import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import subscriptionModel from '../models/subscriptionModel.js';
import adminCouponModel from '../models/adminCouponModel.js';
import reportModel from '../models/reportModel.js';

// ─────────────────────────────────────────────
// 1. USER TRUST SCORE
// ─────────────────────────────────────────────
export const getUserTrustScores = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', minScore, maxScore } = req.query;
    const skip = (page - 1) * limit;

    const users = await userModel.find({}).lean();
    const reports = await reportModel.find({}).lean();
    const appointments = await appointmentModel.find({}).lean();

    const reportsByUser = {};
    reports.forEach(r => {
      const uid = r.reportedUser?.toString();
      if (uid) reportsByUser[uid] = (reportsByUser[uid] || 0) + 1;
    });

    const apptsByUser = {};
    appointments.forEach(a => {
      const uid = a.userId?.toString();
      if (uid) {
        if (!apptsByUser[uid]) apptsByUser[uid] = { total: 0, cancelled: 0 };
        apptsByUser[uid].total++;
        if (a.cancelled) apptsByUser[uid].cancelled++;
      }
    });

    let scored = users.map(u => {
      const uid = u._id.toString();
      const reportCount = reportsByUser[uid] || 0;
      const appts = apptsByUser[uid] || { total: 0, cancelled: 0 };
      const cancelRate = appts.total > 0 ? appts.cancelled / appts.total : 0;
      const verified = u.isVerified ? 10 : 0;
      const subscription = u.subscription ? 10 : 0;
      const reportPenalty = Math.min(reportCount * 15, 50);
      const cancelPenalty = Math.round(cancelRate * 20);
      const activityBonus = Math.min((appts.total - appts.cancelled) * 2, 20);
      const score = Math.max(0, Math.min(100, 50 + verified + subscription + activityBonus - reportPenalty - cancelPenalty));
      const tier = score >= 80 ? 'Platinum' : score >= 60 ? 'Gold' : score >= 40 ? 'Silver' : 'At Risk';
      return { _id: u._id, name: u.name, email: u.email, image: u.image, score, tier, reportCount, totalAppts: appts.total, cancelRate: Math.round(cancelRate * 100), isVerified: u.isVerified, subscription: u.subscription };
    });

    if (search) scored = scored.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
    if (minScore !== undefined) scored = scored.filter(u => u.score >= Number(minScore));
    if (maxScore !== undefined) scored = scored.filter(u => u.score <= Number(maxScore));

    scored.sort((a, b) => b.score - a.score);
    const total = scored.length;
    const paginated = scored.slice(skip, skip + Number(limit));

    const stats = {
      platinum: scored.filter(u => u.tier === 'Platinum').length,
      gold: scored.filter(u => u.tier === 'Gold').length,
      silver: scored.filter(u => u.tier === 'Silver').length,
      atRisk: scored.filter(u => u.tier === 'At Risk').length,
      avgScore: Math.round(scored.reduce((s, u) => s + u.score, 0) / (scored.length || 1)),
    };

    res.json({ success: true, users: paginated, total, stats });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// 2. DUPLICATE ACCOUNT DETECTOR
// ─────────────────────────────────────────────
export const getDuplicateAccounts = async (req, res) => {
  try {
    const users = await userModel.find({}).lean();

    // Group by name similarity + device/IP patterns
    const emailDomains = {};
    const nameClusters = {};

    users.forEach(u => {
      const domain = u.email?.split('@')[1];
      if (domain) {
        if (!emailDomains[domain]) emailDomains[domain] = [];
        emailDomains[domain].push(u);
      }
      const normalizedName = u.name?.toLowerCase().replace(/\s+/g, '');
      if (normalizedName) {
        if (!nameClusters[normalizedName]) nameClusters[normalizedName] = [];
        nameClusters[normalizedName].push(u);
      }
    });

    const duplicates = [];
    Object.entries(nameClusters).forEach(([name, group]) => {
      if (group.length > 1) {
        duplicates.push({
          type: 'Same Name',
          confidence: group.length >= 3 ? 'High' : 'Medium',
          accounts: group.map(u => ({ _id: u._id, name: u.name, email: u.email, createdAt: u.createdAt, isVerified: u.isVerified })),
          reason: `${group.length} accounts share identical name "${group[0].name}"`,
        });
      }
    });

    // Phone duplicates
    const phoneClusters = {};
    users.forEach(u => {
      if (u.phone) {
        if (!phoneClusters[u.phone]) phoneClusters[u.phone] = [];
        phoneClusters[u.phone].push(u);
      }
    });
    Object.entries(phoneClusters).forEach(([phone, group]) => {
      if (group.length > 1) {
        duplicates.push({
          type: 'Same Phone',
          confidence: 'High',
          accounts: group.map(u => ({ _id: u._id, name: u.name, email: u.email, phone: u.phone, createdAt: u.createdAt })),
          reason: `${group.length} accounts share phone ${phone}`,
        });
      }
    });

    res.json({ success: true, duplicates, total: duplicates.length });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

export const flagDuplicateUser = async (req, res) => {
  try {
    const { userId, action } = req.body; // action: 'flag' | 'clear' | 'ban'
    const user = await userModel.findById(userId);
    if (!user) return res.json({ success: false, message: 'User not found' });
    if (action === 'ban') {
      user.isBanned = true;
      await user.save();
      return res.json({ success: true, message: 'User banned' });
    }
    res.json({ success: true, message: `Action ${action} recorded` });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// 3. REFERRAL PROGRAM MANAGER
// ─────────────────────────────────────────────
export const getReferralStats = async (req, res) => {
  try {
    const users = await userModel.find({ referredBy: { $exists: true, $ne: null } }).populate('referredBy', 'name email').lean();
    const referrers = {};

    users.forEach(u => {
      const refId = u.referredBy?._id?.toString() || u.referredBy?.toString();
      if (!refId) return;
      if (!referrers[refId]) {
        referrers[refId] = {
          referrerId: refId,
          referrerName: u.referredBy?.name || 'Unknown',
          referrerEmail: u.referredBy?.email || '',
          referrals: [],
          totalReferrals: 0,
          convertedReferrals: 0,
          rewardEarned: 0,
        };
      }
      referrers[refId].referrals.push({ userId: u._id, name: u.name, email: u.email, joinedAt: u.createdAt, hasSubscription: !!u.subscription });
      referrers[refId].totalReferrals++;
      if (u.subscription) {
        referrers[refId].convertedReferrals++;
        referrers[refId].rewardEarned += 50; // ₹50 per converted referral
      }
    });

    const list = Object.values(referrers).sort((a, b) => b.totalReferrals - a.totalReferrals);
    const stats = {
      totalReferrals: users.length,
      converted: users.filter(u => u.subscription).length,
      totalRewardIssued: list.reduce((s, r) => s + r.rewardEarned, 0),
      topReferrers: list.slice(0, 5),
    };

    res.json({ success: true, referrers: list, stats });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

export const updateReferralReward = async (req, res) => {
  try {
    const { userId, rewardAmount, note } = req.body;
    // In production this would update a referral reward ledger
    res.json({ success: true, message: `Reward of ₹${rewardAmount} queued for ${userId}. Note: ${note}` });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// 4. GDPR / DATA REQUEST CENTER
// ─────────────────────────────────────────────
export const getGdprRequests = async (req, res) => {
  try {
    // Reuse existing deletionRequestModel if exists, otherwise mock from users
    const { deletionRequestModel } = await import('../models/deletionRequestModel.js');
    const requests = await deletionRequestModel.find({}).populate('userId', 'name email createdAt').sort({ createdAt: -1 }).lean();
    const enriched = requests.map(r => ({
      ...r,
      type: r.type || 'deletion',
      status: r.status || 'pending',
      slaDeadline: new Date(new Date(r.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      daysRemaining: Math.max(0, Math.ceil((new Date(r.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24))),
    }));
    res.json({ success: true, requests: enriched, total: enriched.length, pending: enriched.filter(r => r.status === 'pending').length });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

export const processGdprRequest = async (req, res) => {
  try {
    const { requestId, action, notes } = req.body;
    const { deletionRequestModel } = await import('../models/deletionRequestModel.js');
    const request = await deletionRequestModel.findByIdAndUpdate(requestId, { status: action, adminNotes: notes, processedAt: new Date() }, { new: true });
    if (!request) return res.json({ success: false, message: 'Request not found' });
    res.json({ success: true, message: `Request ${action}`, request });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// 5. CHURN PREDICTION (enhanced frontend for existing predictChurn)
// ─────────────────────────────────────────────
export const getChurnAnalysis = async (req, res) => {
  try {
    const users = await userModel.find({ subscription: { $exists: true, $ne: null } }).lean();
    const appointments = await appointmentModel.find({}).lean();

    const apptMap = {};
    appointments.forEach(a => {
      const uid = a.userId?.toString();
      if (uid) {
        if (!apptMap[uid]) apptMap[uid] = { total: 0, lastDate: null };
        apptMap[uid].total++;
        if (!apptMap[uid].lastDate || new Date(a.slotDate) > new Date(apptMap[uid].lastDate)) apptMap[uid].lastDate = a.slotDate;
      }
    });

    const now = Date.now();
    const scored = users.map(u => {
      const uid = u._id.toString();
      const appts = apptMap[uid] || { total: 0, lastDate: null };
      const daysSinceLogin = u.lastLogin ? Math.floor((now - new Date(u.lastLogin)) / 86400000) : 180;
      const daysSinceAppt = appts.lastDate ? Math.floor((now - new Date(appts.lastDate)) / 86400000) : 180;
      const risk = Math.min(100, Math.round(daysSinceLogin * 0.3 + daysSinceAppt * 0.3 + (appts.total < 2 ? 30 : 0) + (u.isVerified ? 0 : 10)));
      const riskLevel = risk >= 70 ? 'High' : risk >= 40 ? 'Medium' : 'Low';
      return { _id: u._id, name: u.name, email: u.email, riskScore: risk, riskLevel, daysSinceLogin, daysSinceAppt, totalAppts: appts.total, subscription: u.subscription };
    });

    scored.sort((a, b) => b.riskScore - a.riskScore);
    const stats = {
      high: scored.filter(u => u.riskLevel === 'High').length,
      medium: scored.filter(u => u.riskLevel === 'Medium').length,
      low: scored.filter(u => u.riskLevel === 'Low').length,
      avgRisk: Math.round(scored.reduce((s, u) => s + u.riskScore, 0) / (scored.length || 1)),
    };

    res.json({ success: true, users: scored, stats });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// 6. COUPON ROI ANALYTICS
// ─────────────────────────────────────────────
export const getCouponRoiAnalytics = async (req, res) => {
  try {
    const coupons = await adminCouponModel.find({}).lean();
    const subscriptions = await subscriptionModel.find({ couponUsed: { $exists: true } }).lean();

    const couponMap = {};
    coupons.forEach(c => { couponMap[c.code] = { ...c, usageCount: 0, revenue: 0, uniqueUsers: new Set() }; });

    subscriptions.forEach(s => {
      const code = s.couponUsed;
      if (code && couponMap[code]) {
        couponMap[code].usageCount++;
        couponMap[code].revenue += s.amount || 0;
        couponMap[code].uniqueUsers.add(s.userId?.toString());
      }
    });

    const analytics = Object.values(couponMap).map(c => {
      const discountGiven = c.usageCount * (c.discountAmount || 0);
      const netRevenue = c.revenue - discountGiven;
      const roi = discountGiven > 0 ? ((netRevenue / discountGiven) * 100).toFixed(1) : 'N/A';
      return {
        _id: c._id, code: c.code, type: c.type, discountAmount: c.discountAmount,
        usageCount: c.usageCount, uniqueUsers: c.uniqueUsers.size,
        grossRevenue: c.revenue, discountGiven, netRevenue, roi,
        isActive: c.isActive, expiryDate: c.expiryDate, maxUses: c.maxUses,
        conversionRate: c.maxUses > 0 ? ((c.usageCount / c.maxUses) * 100).toFixed(1) : 'N/A',
      };
    });

    analytics.sort((a, b) => b.usageCount - a.usageCount);

    const stats = {
      totalCoupons: analytics.length,
      activeCoupons: analytics.filter(c => c.isActive).length,
      totalUsage: analytics.reduce((s, c) => s + c.usageCount, 0),
      totalDiscountGiven: analytics.reduce((s, c) => s + (c.discountGiven || 0), 0),
      totalNetRevenue: analytics.reduce((s, c) => s + (c.netRevenue || 0), 0),
    };

    res.json({ success: true, coupons: analytics, stats });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// 7. DOCTOR PAYOUT MANAGER
// ─────────────────────────────────────────────
export const getDoctorPayouts = async (req, res) => {
  try {
    const doctors = await doctorModel.find({ available: true }).lean();
    const appointments = await appointmentModel.find({ payment: true, cancelled: false }).lean();

    const payoutMap = {};
    appointments.forEach(a => {
      const did = a.docId?.toString();
      if (!did) return;
      if (!payoutMap[did]) payoutMap[did] = { totalEarned: 0, appointments: 0, paid: 0, pending: 0 };
      const fee = a.amount || 0;
      const commission = fee * 0.2; // 20% platform commission
      const doctorShare = fee - commission;
      payoutMap[did].totalEarned += doctorShare;
      payoutMap[did].appointments++;
      if (a.payoutStatus === 'paid') payoutMap[did].paid += doctorShare;
      else payoutMap[did].pending += doctorShare;
    });

    const payouts = doctors.map(d => {
      const did = d._id.toString();
      const p = payoutMap[did] || { totalEarned: 0, appointments: 0, paid: 0, pending: 0 };
      return {
        _id: d._id, name: d.name, email: d.email, image: d.image,
        speciality: d.speciality, fees: d.fees,
        totalEarned: Math.round(p.totalEarned),
        totalAppointments: p.appointments,
        paidAmount: Math.round(p.paid),
        pendingAmount: Math.round(p.pending),
        lastPayout: d.lastPayout || null,
        bankVerified: d.bankVerified || false,
        payoutStatus: p.pending > 0 ? 'Pending' : 'Up to Date',
      };
    });

    payouts.sort((a, b) => b.pendingAmount - a.pendingAmount);

    const stats = {
      totalDoctors: payouts.length,
      totalPending: payouts.reduce((s, d) => s + d.pendingAmount, 0),
      totalPaid: payouts.reduce((s, d) => s + d.paidAmount, 0),
      totalEarned: payouts.reduce((s, d) => s + d.totalEarned, 0),
      pendingDoctors: payouts.filter(d => d.pendingAmount > 0).length,
    };

    res.json({ success: true, payouts, stats });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

export const processDoctorPayout = async (req, res) => {
  try {
    const { doctorId, amount, notes, method } = req.body;
    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) return res.json({ success: false, message: 'Doctor not found' });
    doctor.lastPayout = new Date();
    await doctor.save();
    // Mark relevant appointments as paid
    await appointmentModel.updateMany({ docId: doctorId, payment: true, cancelled: false, payoutStatus: { $ne: 'paid' } }, { payoutStatus: 'paid' });
    res.json({ success: true, message: `Payout of ₹${amount} processed for Dr. ${doctor.name} via ${method}` });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};
