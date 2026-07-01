import appointmentModel from "../models/appointmentModel.js";
import subscriptionModel from "../models/subscriptionModel.js";
import adminCouponModel from "../models/adminCouponModel.js";
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";
import driverModel from "../models/driverModel.js";
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_NIM_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

// Get Comprehensive Financial Data for Admin
const getFinancialCalculations = async (req, res) => {
    try {
        // 1. Fetch all required data
        const appointments = await appointmentModel.find({ payment: true });
        const subscriptions = await subscriptionModel.find({ status: 'Active' });
        const adminCoupons = await adminCouponModel.find({ isActive: true });
        const doctors = await doctorModel.find({}, 'name discounts');

        // 2. Booking Earnings & Breakdown
        let totalBookingEarnings = 0;
        const bookingBreakdown = appointments.map(app => {
            const earnings = app.amount;
            totalBookingEarnings += earnings;
            
            return {
                id: app._id,
                user: app.userData.name,
                userEmail: app.userData.email,
                doctor: app.docData.name,
                originalFee: app.discountApplied?.originalFee || app.amount,
                finalFee: app.amount,
                discount: app.discountApplied ? {
                    code: app.discountApplied.code,
                    value: app.discountApplied.discountValue,
                    type: app.discountApplied.discountType
                } : null,
                adminDiscount: app.adminDiscountApplied ? app.adminDiscountApplied.amount : 0,
                paymentMethod: app.paymentMethod,
                timestamp: app.date
            };
        });

        // 3. Subscription Earnings & Loss from Gifted
        let totalSubscriptionEarnings = 0;
        let totalGiftedLoss = 0;
        const allSubscriptions = await subscriptionModel.find({}).populate('userId', 'name email');
        
        allSubscriptions.forEach(sub => {
            if (sub.isGift) {
                totalGiftedLoss += sub.amount;
            } else {
                // Count all sold subscriptions that are not pending
                // If cancelled but not refunded, it's still revenue
                // If refunded, subtract the refund amount
                if (sub.status !== 'Pending') {
                    const netAmount = sub.amount - (sub.refundAmount || 0);
                    totalSubscriptionEarnings += netAmount;
                }
            }
        });

        // 4. Discount Analysis
        let activeAdminDiscountsCount = adminCoupons.length;
        let activeDoctorDiscountsCount = 0;
        let projectedAdminDiscountLoss = 0;

        // Count doctor discounts
        doctors.forEach(doc => {
            if (doc.discounts) {
                doc.discounts.forEach(d => {
                    if (d.isActive && (!d.expiresAt || new Date(d.expiresAt) > new Date())) {
                        activeDoctorDiscountsCount++;
                    }
                });
            }
        });

        // Calculate continuous loss from admin coupons (based on current usage rate or projected)
        // For simplicity, we'll calculate loss incurred so far by active admin coupons
        let adminCouponLossSoFar = 0;
        appointments.forEach(app => {
            if (app.adminDiscountApplied) {
                adminCouponLossSoFar += app.adminDiscountApplied.amount;
            }
        });

        // Projected loss (if we want to show potential loss until expiry)
        // This is tricky without knowing expected usage, but we can show "Loss Incurred via Active Campaigns"
        projectedAdminDiscountLoss = adminCouponLossSoFar;

        // Breakdown of subscription sales
        const subscriptionBreakdown = allSubscriptions
            .filter(sub => !sub.isGift && sub.status !== 'Pending')
            .map(sub => ({
                id: sub._id,
                plan: sub.plan,
                amount: sub.amount,
                refunded: sub.refunded,
                refundAmount: sub.refundAmount || 0,
                netAmount: sub.amount - (sub.refundAmount || 0),
                status: sub.status,
                paymentMethod: sub.paymentMethod,
                timestamp: sub.createdAt,
                user: sub.userId ? { name: sub.userId.name, email: sub.userId.email } : null
            }));

        // 5. CS Manual Deductions & Reclaims (Refunds + Gifted Subscriptions + Reclaims)
        const activityLogModel = (await import('../models/activityLogModel.js')).default;
        const manualDeductionLogs = await activityLogModel.find({ 
            activityType: { $in: ['refund', 'grant_subscription', 'reclaim_refund', 'cs_compensation_coupon'] } 
        });
        
        let totalCSRefunds = 0;
        let totalCSReclaims = 0;
        let totalCSGifts = 0;
        
        manualDeductionLogs.forEach(log => {
            const amount = Number(log.metadata?.amount) || 0;
            if (log.activityType === 'refund') {
                totalCSRefunds += amount;
            } else if (log.activityType === 'reclaim_refund') {
                totalCSReclaims += amount;
            } else if (log.activityType === 'grant_subscription') {
                totalCSGifts += amount;
            } else if (log.activityType === 'cs_compensation_coupon') {
                if (log.metadata?.compensationType === 'gifted') {
                    totalCSGifts += amount;
                } else {
                    totalCSRefunds += amount;
                }
            }
        });

        const netCSRefundLoss = totalCSRefunds - totalCSReclaims;
        const totalCSManualLoss = netCSRefundLoss + totalCSGifts;

        // 6. Admin Crowdfunding Contributions (Deductions from Earnings)
        let adminCrowdfundLoss = 0;
        try {
            const strayCrowdfundingModel = (await import('../models/strayCrowdfundingModel.js')).default;
            const campaigns = await strayCrowdfundingModel.find({});
            campaigns.forEach(camp => {
                if (camp.contributions) {
                    camp.contributions.forEach(contrib => {
                        if (contrib.paymentId && contrib.paymentId.startsWith('ADMIN_CONTRIB_')) {
                            adminCrowdfundLoss += contrib.amount;
                        }
                    });
                }
            });
        } catch (strayErr) {
            console.error("Error calculating admin crowdfund loss:", strayErr);
        }

        // 7. Driver Payroll Expenses
        let totalDriverBasePay = 0;
        let totalDriverBonuses = 0;
        let totalDriverDeductions = 0;
        let driverPayrollDetails = [];

        try {
            const drivers = await driverModel.find({});
            drivers.forEach(drv => {
                const base = drv.salary?.base || 8500;
                const fiveStarCount = (drv.ratings || []).filter(r => r.rating === 5).length;
                const bonus = fiveStarCount * 1500;
                const deductions = drv.salary?.deductions || 0;
                const net = base + bonus - deductions;

                totalDriverBasePay += base;
                totalDriverBonuses += bonus;
                totalDriverDeductions += deductions;

                driverPayrollDetails.push({
                    id: drv._id,
                    name: drv.fullName,
                    username: drv.username,
                    assignedVehicle: drv.assignedVehicle,
                    baseSalary: base,
                    performanceBonus: bonus,
                    deductions: deductions,
                    netPayable: net,
                    ratingsCount: drv.ratings?.length || 0,
                    fiveStarRatingsCount: fiveStarCount
                });
            });
        } catch (drvErr) {
            console.error("Error calculating driver salaries:", drvErr);
        }

        const netDriverSalariesExpense = totalDriverBasePay + totalDriverBonuses - totalDriverDeductions;

        // Build email-to-name mapping for outreach coupons
        const userEmails = [];
        adminCoupons.forEach(c => {
            if (c.recipientEmails && c.recipientEmails.length > 0) {
                userEmails.push(...c.recipientEmails);
            }
        });
        
        let emailToNameMap = {};
        if (userEmails.length > 0) {
            const recipientUsers = await userModel.find({ email: { $in: userEmails } }, 'name email');
            recipientUsers.forEach(u => {
                emailToNameMap[u.email] = u.name;
            });
        }

        res.json({
            success: true,
            data: {
                summary: {
                    totalEarnings: (totalBookingEarnings + totalSubscriptionEarnings) - totalCSManualLoss - adminCrowdfundLoss - adminCouponLossSoFar - netDriverSalariesExpense,
                    bookingEarnings: totalBookingEarnings,
                    subscriptionEarnings: totalSubscriptionEarnings,
                    totalLoss: totalGiftedLoss + adminCouponLossSoFar + totalCSManualLoss + adminCrowdfundLoss + netDriverSalariesExpense,
                    giftedSubscriptionLoss: totalGiftedLoss + totalCSGifts,
                    adminCouponLoss: adminCouponLossSoFar,
                    csRefundLoss: netCSRefundLoss,
                    csManualGiftLoss: totalCSGifts,
                    adminCrowdfundLoss: adminCrowdfundLoss,
                    driverBaseSalariesPaid: totalDriverBasePay,
                    driverBonusesPaid: totalDriverBonuses,
                    driverDeductionsApplied: totalDriverDeductions,
                    netDriverSalariesExpense: netDriverSalariesExpense
                },
                breakdown: bookingBreakdown,
                subscriptionBreakdown: subscriptionBreakdown,
                manualDeductions: manualDeductionLogs.sort((a, b) => b.timestamp - a.timestamp),
                driverPayroll: driverPayrollDetails,
                discounts: {
                    activeAdminCount: activeAdminDiscountsCount,
                    activeDoctorCount: activeDoctorDiscountsCount,
                    adminCoupons: adminCoupons.map(c => ({
                        code: c.code,
                        value: c.discountValue,
                        type: c.discountType,
                        expiry: c.expiryDate,
                        used: c.usedCount,
                        recipientEmails: c.recipientEmails || [],
                        recipientNames: (c.recipientEmails || []).map(email => emailToNameMap[email] || 'Valued Subscriber')
                    }))
                }
            }
        });

    } catch (error) {
        console.error("Finance Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/admin/financial-analysis
const getFinancialAnalysis = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({ payment: true });
        const adminCoupons = await adminCouponModel.find({ isActive: true });
        const doctors = await doctorModel.find({}, 'name discounts');

        let totalBookingEarnings = 0;
        appointments.forEach(app => {
            totalBookingEarnings += app.amount;
        });

        let totalSubscriptionEarnings = 0;
        let totalGiftedLoss = 0;
        const allSubscriptions = await subscriptionModel.find({});
        allSubscriptions.forEach(sub => {
            if (sub.isGift) {
                totalGiftedLoss += sub.amount;
            } else {
                if (sub.status !== 'Pending') {
                    totalSubscriptionEarnings += (sub.amount - (sub.refundAmount || 0));
                }
            }
        });

        let activeAdminDiscountsCount = adminCoupons.length;
        let activeDoctorDiscountsCount = 0;
        doctors.forEach(doc => {
            if (doc.discounts) {
                doc.discounts.forEach(d => {
                    if (d.isActive && (!d.expiresAt || new Date(d.expiresAt) > new Date())) {
                        activeDoctorDiscountsCount++;
                    }
                });
            }
        });

        let adminCouponLossSoFar = 0;
        appointments.forEach(app => {
            if (app.adminDiscountApplied) {
                adminCouponLossSoFar += app.adminDiscountApplied.amount;
            }
        });

        const activityLogModel = (await import('../models/activityLogModel.js')).default;
        const manualDeductionLogs = await activityLogModel.find({ 
            activityType: { $in: ['refund', 'grant_subscription', 'reclaim_refund', 'cs_compensation_coupon'] } 
        });
        
        let totalCSRefunds = 0;
        let totalCSReclaims = 0;
        let totalCSGifts = 0;
        
        manualDeductionLogs.forEach(log => {
            const amount = Number(log.metadata?.amount) || 0;
            if (log.activityType === 'refund') {
                totalCSRefunds += amount;
            } else if (log.activityType === 'reclaim_refund') {
                totalCSReclaims += amount;
            } else if (log.activityType === 'grant_subscription') {
                totalCSGifts += amount;
            } else if (log.activityType === 'cs_compensation_coupon') {
                if (log.metadata?.compensationType === 'gifted') {
                    totalCSGifts += amount;
                } else {
                    totalCSRefunds += amount;
                }
            }
        });

        const netCSRefundLoss = totalCSRefunds - totalCSReclaims;
        const totalCSManualLoss = netCSRefundLoss + totalCSGifts;

        let adminCrowdfundLoss = 0;
        try {
            const strayCrowdfundingModel = (await import('../models/strayCrowdfundingModel.js')).default;
            const campaigns = await strayCrowdfundingModel.find({});
            campaigns.forEach(camp => {
                if (camp.contributions) {
                    camp.contributions.forEach(contrib => {
                        if (contrib.paymentId && contrib.paymentId.startsWith('ADMIN_CONTRIB_')) {
                            adminCrowdfundLoss += contrib.amount;
                        }
                    });
                }
            });
        } catch (strayErr) {
            console.error("Error calculating admin crowdfund loss:", strayErr);
        }

        // Calculate driver salaries for AI Analysis
        let totalDriverBasePay = 0;
        let totalDriverBonuses = 0;
        let totalDriverDeductions = 0;
        try {
            const drivers = await driverModel.find({});
            drivers.forEach(drv => {
                totalDriverBasePay += (drv.salary?.base || 8500);
                const fiveStarCount = (drv.ratings || []).filter(r => r.rating === 5).length;
                totalDriverBonuses += (fiveStarCount * 1500);
                totalDriverDeductions += (drv.salary?.deductions || 0);
            });
        } catch (drvErr) {
            console.error("Error calculating driver salaries:", drvErr);
        }
        const netDriverSalariesExpense = totalDriverBasePay + totalDriverBonuses - totalDriverDeductions;

        const summary = {
            totalEarnings: (totalBookingEarnings + totalSubscriptionEarnings) - totalCSManualLoss - adminCrowdfundLoss - adminCouponLossSoFar - netDriverSalariesExpense,
            bookingEarnings: totalBookingEarnings,
            subscriptionEarnings: totalSubscriptionEarnings,
            totalLoss: totalGiftedLoss + adminCouponLossSoFar + totalCSManualLoss + adminCrowdfundLoss + netDriverSalariesExpense,
            adminCouponLoss: adminCouponLossSoFar,
            csRefundLoss: netCSRefundLoss,
            csManualGiftLoss: totalCSGifts,
            adminCrowdfundLoss: adminCrowdfundLoss,
            driverBaseSalariesPaid: totalDriverBasePay,
            driverBonusesPaid: totalDriverBonuses,
            driverDeductionsApplied: totalDriverDeductions,
            netDriverSalariesExpense: netDriverSalariesExpense
        };

        const activeCouponsText = adminCoupons.map(c => `  - ${c.code}: ${c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`} value, ${c.usedCount} redemptions`).join('\n');

        const prompt = `You are a Chief Financial Officer (CFO) AI assistant for PawVaidya, a veterinary consultation and pet care platform.
Analyze the following financial report data:

--- FINANCIAL METRICS ---
- Total Treasury (Net Profit/Earning): ₹${summary.totalEarnings.toLocaleString()}
- Gross Booking Revenue: ₹${summary.bookingEarnings.toLocaleString()}
- Subscription Membership Revenue: ₹${summary.subscriptionEarnings.toLocaleString()}
- Total Loss & Expense Incurred: ₹${summary.totalLoss.toLocaleString()}
- Coupon Loss (Admin Campaigns): ₹${summary.adminCouponLoss.toLocaleString()}
- Customer Service (CS) Refunds Loss: ₹${summary.csRefundLoss.toLocaleString()}
- Customer Service (CS) Gifted Membership Loss: ₹${summary.csManualGiftLoss.toLocaleString()}
- Stray Crowdfunding Admin Contributions: ₹${summary.adminCrowdfundLoss.toLocaleString()}
- Mobile ICU Driver Base Salaries Paid: ₹${summary.driverBaseSalariesPaid.toLocaleString()}
- Mobile ICU Driver Performance Bonuses: ₹${summary.driverBonusesPaid.toLocaleString()}
- Mobile ICU Driver Misconduct Deductions Applied: ₹${summary.driverDeductionsApplied.toLocaleString()}
- Net Mobile ICU Driver Payroll Expense: ₹${summary.netDriverSalariesExpense.toLocaleString()}

--- CAMPAIGN METRICS ---
- Active Admin Coupons: ${activeAdminDiscountsCount}
- Active Doctor Custom Coupons: ${activeDoctorDiscountsCount}
Active Admin Campaigns:
${activeCouponsText || 'None'}

--- TASK ---
Provide a highly professional, detailed, and strategic financial analysis report for the Admin dashboard in clean markdown formatting. 
Include sections addressing the following:
1. **Overall Treasury Performance**: Evaluate if the system is profitable and analyze the balance between booking revenue and subscription revenue.
2. **Where to Stop Spending / Minimize Losses**: Identify high-loss areas (e.g. CS refund patterns, high coupon redemption campaigns, or stray donations) and give concrete cost-cutting recommendations.
3. **Where to Double Down / Invest More**: Identify high-yield sources of revenue (e.g. particular membership programs, pricing optimizations) and how to scale them.
4. **Actionable CFO Bullet Points**: 3-4 immediate steps the administration should execute to optimize margins.

Be specific and use actual numbers from the metrics provided. Do not use generic placeholders. Make it visually premium with markdown lists, bold headers, and structured points.`;

        const completion = await openai.chat.completions.create({
            model: "z-ai/glm-5.1",
            messages: [{ role: "user", content: prompt }],
            temperature: 1,
            top_p: 1,
            max_tokens: 16384,
            stream: false
        });

        const analysis = completion.choices[0]?.message?.content || "";
        
        return res.json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error("AI Financial Analysis Error:", error);
        res.json({ success: false, message: error.message });
    }
};

export { getFinancialCalculations, getFinancialAnalysis };
