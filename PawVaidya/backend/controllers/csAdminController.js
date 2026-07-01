import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import CSEmployee from '../models/csEmployeeModel.js';
import CSLoginHistory from '../models/csLoginHistoryModel.js';
import CSRating from '../models/csRatingModel.js';
import CSReport from '../models/csReportModel.js';
import ComplaintTicket from '../models/complaintTicketModel.js';
import CSShiftLog from '../models/csShiftLogModel.js';
import CSQAScore from '../models/csQAScoreModel.js';
import TicketMessage from '../models/ticketMessageModel.js';
import activityLogModel from '../models/activityLogModel.js';
import { transporter } from '../config/nodemailer.js';
import CSComplaint from '../models/csComplaintModel.js';



// POST /api/cs-admin/create-employee
export const createEmployee = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.json({ success: false, message: 'Name, email and password are required.' });

        const exists = await CSEmployee.findOne({ email });
        if (exists) return res.json({ success: false, message: 'An employee with this email already exists.' });

        const hashed = await bcrypt.hash(password, 10);
        const deadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // +2 days

        const employee = await CSEmployee.create({
            name,
            email,
            password: hashed,
            plainPassword: password,
            profileDeadline: deadline,
            status: 'pending'
        });

        // Send welcome email
        try {
            const transporter = getTransporter();
            await transporter.sendMail({
                from: `"PawVaidya Support" <${process.env.SENDER_EMAIL}>`,
                to: email,
                subject: 'Welcome to PawVaidya Customer Service Team',
                html: `<div style="font-family:Inter,sans-serif;padding:32px;background:#f9fafb;"><div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;"><div style="background:linear-gradient(135deg,#0f4c81,#1a6bb5);padding:32px;text-align:center;color:white;"><h1 style="margin:0;font-size:24px;">Welcome to the Team!</h1><p style="margin:8px 0 0;opacity:.9;">PawVaidya Customer Service</p></div><div style="padding:32px;"><p>Hi <strong>${name}</strong>,</p><p>Your Customer Service account has been created successfully.</p><ul><li><strong>Email:</strong> ${email}</li><li><strong>Temporary Password:</strong> ${password}</li><li><strong>Profile Deadline:</strong> ${deadline.toDateString()}</li></ul><p>Login at: <a href="http://localhost:5175">http://localhost:5175</a></p><p>Best regards,<br/>PawVaidya Admin</p></div></div></div>`
            });
        } catch (emailErr) {
            console.warn('Welcome email failed:', emailErr.message);
        }

        return res.json({ success: true, employee, message: 'Employee account created successfully.' });
    } catch (error) {
        console.error('createEmployee error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs-admin/all-employees
export const getAllEmployees = async (req, res) => {
    try {
        const employees = await CSEmployee.find()
            .select('-password -plainPassword -faceDescriptor')
            .sort({ joinedAt: -1 });
        return res.json({ success: true, employees });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs-admin/employee/:id/stats
export const getEmployeeStats = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await CSEmployee.findById(id).select('-password -plainPassword -faceDescriptor');
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        // Last 30 days login history
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const loginHistory = await CSLoginHistory.find({
            employeeId: id,
            loginAt: { $gte: thirtyDaysAgo }
        }).sort({ loginAt: -1 });

        // Ratings
        const ratings = await CSRating.find({ employeeId: id }).sort({ createdAt: -1 });
        const avgRating = ratings.length ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length) : 0;

        // Tickets
        const tickets = await ComplaintTicket.find({ assignedTo: employee._id });
        const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

        const metrics = {
            avgRating,
            totalRatings: ratings.length,
            resolvedTickets
        };

        const recentReviews = ratings.slice(0, 10).map(r => ({
            rating: r.rating,
            review: r.review,
            ticketId: r.ticketId,
            createdAt: r.createdAt
        }));

        const CSQAScore = (await import('../models/csQAScoreModel.js')).default;
        const recentQA = await CSQAScore.find({ employeeId: id }).sort({ createdAt: -1 }).limit(10);

        const stats = {
            employee,
            metrics,
            recentReviews,
            loginHistory,
            recentQA
        };

        const activityLogModel = (await import('../models/activityLogModel.js')).default;
        const refundLogs = await activityLogModel.find({
            'metadata.employeeId': id,
            activityType: { $in: ['refund', 'reclaim_refund'] }
        }).sort({ timestamp: -1 });
        const subscriptionLogs = await activityLogModel.find({
            'metadata.employeeId': id,
            activityType: { $in: ['grant_subscription', 'revoke_subscription'] }
        }).sort({ timestamp: -1 });

        stats.refundLogs = refundLogs;
        stats.subscriptionLogs = subscriptionLogs;

        const refundsOnly = refundLogs.filter(l => l.activityType === 'refund');
        const reclaimsOnly = refundLogs.filter(l => l.activityType === 'reclaim_refund');
        const totalRefundsVal = refundsOnly.reduce((acc, log) => acc + (Number(log.metadata?.amount) || 0), 0);
        const totalReclaimsVal = reclaimsOnly.reduce((acc, log) => acc + (Number(log.metadata?.amount) || 0), 0);

        stats.metrics.totalRefundAmountProcessed = totalRefundsVal - totalReclaimsVal;
        stats.metrics.totalReclaimedAmountProcessed = totalReclaimsVal;
        stats.metrics.totalGiftedAmount = subscriptionLogs.filter(l => l.activityType === 'grant_subscription').reduce((acc, log) => acc + (Number(log.metadata?.amount) || 0), 0);
        stats.metrics.refundTransactions = refundsOnly.length;
        stats.metrics.reclaimTransactions = reclaimsOnly.length;
        stats.metrics.subscriptionAdjustments = subscriptionLogs.length;

        return res.json({ success: true, stats });
    } catch (error) {
        console.error('getEmployeeStats error:', error);
        res.json({ success: false, message: error.message });
    }
};

// PUT /api/cs-admin/suspend/:id
export const suspendEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        await CSEmployee.findByIdAndUpdate(id, {
            status: 'suspended',
            suspendedReason: reason || 'Suspended by admin.',
            suspendedAt: new Date()
        });
        return res.json({ success: true, message: 'Employee suspended.' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// PUT /api/cs-admin/unsuspend/:id
export const unsuspendEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        await CSEmployee.findByIdAndUpdate(id, {
            status: 'active',
            suspendedReason: '',
            suspendedAt: null
        });
        return res.json({ success: true, message: 'Employee reinstated.' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs-admin/reward/:id
export const grantReward = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, value, message } = req.body;
        const employee = await CSEmployee.findById(id);
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        await CSEmployee.findByIdAndUpdate(id, {
            $push: { rewards: { type: type || 'bonus', value: value || '', message: message || '', grantedAt: new Date() } }
        });

        // Send reward email
        try {
            await transporter.sendMail({
                from: `"PawVaidya Admin" <${process.env.SMTP_USER}>`,
                to: employee.email,
                subject: '🎉 You\'ve been rewarded by PawVaidya Admin!',
                html: `<div style="font-family:Inter,sans-serif;padding:32px;"><h2>Congratulations, ${employee.name}!</h2><p>The Admin has granted you a reward:</p><ul><li><strong>Type:</strong> ${type}</li><li><strong>Value:</strong> ${value}</li><li><strong>Message:</strong> ${message}</li></ul><p>Thank you for your excellent service!</p><p>- PawVaidya Admin</p></div>`
            });
        } catch (emailErr) {
            console.warn('Reward email failed:', emailErr.message);
        }

        return res.json({ success: true, message: 'Reward granted and employee notified.' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs-admin/all-tickets
export const getAllTickets = async (req, res) => {
    try {
        const { status, employeeId, limit = 50, skip = 0 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (employeeId) filter.assignedTo = employeeId;

        const tickets = await ComplaintTicket.find(filter)
            .populate('userId', 'name email')
            .populate('assignedTo', 'name profilePic')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        const total = await ComplaintTicket.countDocuments(filter);
        return res.json({ success: true, tickets, total });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs-admin/generate-report/:id
export const generateEmployeeReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { period = 'weekly' } = req.body;
        const employee = await CSEmployee.findById(id);
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        const dayMs = 24 * 60 * 60 * 1000;
        const periodDays = period === 'monthly' ? 30 : period === 'daily' ? 1 : 7;
        const since = new Date(Date.now() - periodDays * dayMs);
        const labelEnd = new Date();
        const periodLabel = `${since.toDateString()} – ${labelEnd.toDateString()}`;

        const tickets = await ComplaintTicket.find({ assignedTo: employee._id, createdAt: { $gte: since } });
        const ratings = await CSRating.find({ employeeId: id, createdAt: { $gte: since } });
        const loginDocs = await CSLoginHistory.find({ employeeId: id, loginAt: { $gte: since } });

        const uniqueLoginDays = new Set(loginDocs.map(l => l.loginAt.toDateString())).size;
        const totalLoginMinutes = loginDocs.reduce((acc, l) => acc + (l.sessionDurationMinutes || 0), 0);
        const avgRating = ratings.length ? (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length) : 0;
        const callsScheduled = tickets.filter(t => t.scheduledCall?.date).length;
        const topReviews = ratings.filter(r => r.review).slice(0, 3).map(r => ({ rating: r.rating, review: r.review, ticketId: String(r.ticketId) }));

        const reportData = {
            totalTicketsHandled: tickets.length,
            ticketsResolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
            ticketsClosed: tickets.filter(t => t.isClosed || t.status === 'closed').length,
            averageRating: parseFloat(avgRating.toFixed(2)),
            totalRatings: ratings.length,
            loginDays: uniqueLoginDays,
            totalLoginMinutes,
            topReviews,
            callsScheduled,
            rewards: employee.rewards.filter(r => new Date(r.grantedAt) >= since).map(r => ({ rewardType: r.type, value: r.value, message: r.message }))
        };

        const report = await CSReport.create({
            employeeId: id,
            employeeName: employee.name,
            employeeEmail: employee.email,
            period,
            periodLabel,
            reportData
        });

        // Send report email
        try {
            await transporter.sendMail({
                from: `"PawVaidya Analytics" <${process.env.SMTP_USER}>`,
                to: employee.email,
                subject: `📊 Your ${period.charAt(0).toUpperCase() + period.slice(1)} Performance Report – PawVaidya`,
                html: `
                <div style="font-family:Inter,sans-serif;padding:32px;background:#f0f9ff;">
                <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #bae6fd;">
                <div style="background:linear-gradient(135deg,#0f4c81,#0ea5e9);padding:32px;text-align:center;color:white;">
                <h1 style="margin:0;font-size:22px;">📊 Performance Report</h1>
                <p style="margin:8px 0 0;opacity:.9;">${periodLabel}</p>
                </div>
                <div style="padding:32px;">
                <p>Hi <strong>${employee.name}</strong>,</p>
                <p>Here is your ${period} performance summary:</p>
                <table style="width:100%;border-collapse:collapse;margin-top:16px;">
                <tr style="background:#f0f9ff;"><td style="padding:10px;font-weight:600;">Tickets Handled</td><td style="padding:10px;">${reportData.totalTicketsHandled}</td></tr>
                <tr><td style="padding:10px;font-weight:600;">Tickets Resolved/Closed</td><td style="padding:10px;">${reportData.ticketsResolved}</td></tr>
                <tr style="background:#f0f9ff;"><td style="padding:10px;font-weight:600;">Average Rating</td><td style="padding:10px;">${reportData.averageRating} ⭐</td></tr>
                <tr><td style="padding:10px;font-weight:600;">Login Days</td><td style="padding:10px;">${reportData.loginDays}</td></tr>
                <tr style="background:#f0f9ff;"><td style="padding:10px;font-weight:600;">Calls Scheduled</td><td style="padding:10px;">${reportData.callsScheduled}</td></tr>
                </table>
                <p style="margin-top:24px;">Keep up the great work!</p>
                <p>– PawVaidya Admin</p>
                </div></div></div>`
            });
            await CSReport.findByIdAndUpdate(report._id, { emailSent: true, emailSentAt: new Date() });
        } catch (emailErr) {
            console.warn('Report email failed:', emailErr.message);
        }

        return res.json({ success: true, report, message: 'Report generated and emailed.' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs-admin/set-incentive/:id
export const setIncentive = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, durationDays } = req.body;

        if (!amount || !durationDays) return res.json({ success: false, message: 'Amount and duration are required.' });

        const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        await CSEmployee.findByIdAndUpdate(id, {
            adminIncentive: {
                amount: Number(amount),
                expiresAt
            }
        });

        return res.json({ success: true, message: `Incentive of ₹${amount} set for ${durationDays} days.` });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs-admin/reports
export const getAllReports = async (req, res) => {
    try {
        const { employeeId } = req.query;
        const filter = {};
        if (employeeId) filter.employeeId = employeeId;
        const reports = await CSReport.find(filter).sort({ generatedAt: -1 });
        return res.json({ success: true, reports });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
// POST /api/cs-admin/resend-report/:id
export const resendReportEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await CSReport.findById(id);
        if (!report) return res.json({ success: false, message: 'Report not found.' });

        // Fetch employee for current email (in case it changed)
        const employee = await CSEmployee.findById(report.employeeId);
        const emailTo = employee ? employee.email : report.employeeEmail;

        await transporter.sendMail({
            from: `"PawVaidya Analytics" <${process.env.SMTP_USER}>`,
            to: emailTo,
            subject: `📊 [RESEND] Your ${report.period.charAt(0).toUpperCase() + report.period.slice(1)} Performance Report – PawVaidya`,
            html: `
            <div style="font-family:Inter,sans-serif;padding:32px;background:#f0f9ff;">
            <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #bae6fd;">
            <div style="background:linear-gradient(135deg,#0f4c81,#0ea5e9);padding:32px;text-align:center;color:white;">
            <h1 style="margin:0;font-size:22px;">📊 Performance Report</h1>
            <p style="margin:8px 0 0;opacity:.9;">${report.periodLabel}</p>
            </div>
            <div style="padding:32px;">
            <p>Hi <strong>${report.employeeName}</strong>,</p>
            <p>Here is your ${report.period} performance summary:</p>
            <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <tr style="background:#f0f9ff;"><td style="padding:10px;font-weight:600;">Tickets Handled</td><td style="padding:10px;">${report.reportData.totalTicketsHandled}</td></tr>
            <tr><td style="padding:10px;font-weight:600;">Tickets Resolved/Closed</td><td style="padding:10px;">${report.reportData.ticketsResolved}</td></tr>
            <tr style="background:#f0f9ff;"><td style="padding:10px;font-weight:600;">Average Rating</td><td style="padding:10px;">${report.reportData.averageRating} ⭐</td></tr>
            <tr><td style="padding:10px;font-weight:600;">Login Days</td><td style="padding:10px;">${report.reportData.loginDays}</td></tr>
            <tr style="background:#f0f9ff;"><td style="padding:10px;font-weight:600;">Calls Scheduled</td><td style="padding:10px;">${report.reportData.callsScheduled}</td></tr>
            </table>
            <p style="margin-top:24px;">Thank you for your excellent service!</p>
            <p>– PawVaidya Admin</p>
            </div></div></div>`
        });

        await CSReport.findByIdAndUpdate(id, { emailSent: true, emailSentAt: new Date() });
        return res.json({ success: true, message: 'Report email resent successfully.' });
    } catch (error) {
        res.json({ success: false, message: `Email failed: ${error.message}` });
    }
};

// GET /api/cs-admin/employee/:id/shift-logs  — admin view shift logs for an agent
export const getEmployeeShiftLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const { days = 30 } = req.query;
        const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
        const shiftLogs = await CSShiftLog.find({ employeeId: id, shiftStart: { $gte: since } }).sort({ shiftStart: -1 });

        // Summary stats
        const totalWorkSeconds = shiftLogs.reduce((acc, s) => acc + (s.workSeconds || 0), 0);
        const totalBreakSeconds = shiftLogs.reduce((acc, s) => acc + (s.breakSeconds || 0), 0);
        const completedDays = shiftLogs.filter(s => s.completedShift).length;
        const earlyLogoutCount = shiftLogs.filter(s => s.earlyLogout).length;

        return res.json({
            success: true,
            shiftLogs,
            summary: {
                totalWorkSeconds,
                totalBreakSeconds,
                totalWorkHours: parseFloat((totalWorkSeconds / 3600).toFixed(2)),
                completedDays,
                earlyLogoutCount,
                totalDays: shiftLogs.length
            }
        });
    } catch (error) {
        console.error('getEmployeeShiftLogs error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs-admin/early-exits
export const getAllEarlyExits = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

        // Find shift logs that have earlyLogout set to true
        const earlyExits = await CSShiftLog.find({
            shiftStart: { $gte: since },
            earlyLogout: true
        })
            .populate('employeeId', 'name email profilePic status')
            .sort({ shiftStart: -1 });

        res.json({ success: true, earlyExits });
    } catch (error) {
        console.error("Error in getAllEarlyExits:", error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs-admin/employee/:id/reset-password
export const adminResetEmployeePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        if (!password) return res.json({ success: false, message: 'Password is required.' });

        const employee = await CSEmployee.findById(id);
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        const hashed = await bcrypt.hash(password, 10);
        employee.password = hashed;
        employee.plainPassword = password;
        employee.forgotPasswordRequested = false;
        employee.forgotPasswordRequestedAt = null;
        await employee.save();

        // Send email with new password
        try {
            await transporter.sendMail({
                from: `"PawVaidya Support" <${process.env.SENDER_EMAIL}>`,
                to: employee.email,
                subject: 'Your PawVaidya Support Account Password Has Been Reset',
                html: `<div style="font-family:Inter,sans-serif;padding:32px;background:#f9fafb;"><div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;"><div style="background:linear-gradient(135deg,#0f4c81,#1a6bb5);padding:32px;text-align:center;color:white;"><h1 style="margin:0;font-size:24px;">Password Reset</h1><p style="margin:8px 0 0;opacity:.9;">PawVaidya Customer Service</p></div><div style="padding:32px;"><p>Hi <strong>${employee.name}</strong>,</p><p>An administrator has reset your support portal password.</p><ul><li><strong>Email:</strong> ${employee.email}</li><li><strong>New Temporary Password:</strong> ${password}</li></ul><p>Please log in and update your password if desired: <a href="http://localhost:5175/login">http://localhost:5175/login</a></p><p>Best regards,<br/>PawVaidya Admin</p></div></div></div>`
            });
        } catch (emailErr) {
            console.warn('Welcome/reset email failed:', emailErr.message);
        }

        return res.json({ success: true, message: 'Employee password reset successfully.' });
    } catch (error) {
        console.error('adminResetEmployeePassword error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs-admin/employee/:id/clear-reset-request
export const adminClearResetRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await CSEmployee.findById(id);
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        employee.forgotPasswordRequested = false;
        employee.forgotPasswordRequestedAt = null;
        await employee.save();

        return res.json({ success: true, message: 'Password reset request cleared.' });
    } catch (error) {
        console.error('adminClearResetRequest error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs-admin/ticket-aging-heatmap
// Returns open/in-progress tickets grouped by agent, each bucketed by age
export const getTicketAgingHeatmap = async (req, res) => {
    try {
        const employees = await CSEmployee.find({ status: 'active' })
            .select('_id name email profilePic averageRating');

        const openStatuses = ['open', 'in_progress', 'scheduled_call'];
        const now = Date.now();

        const agentRows = await Promise.all(employees.map(async (emp) => {
            const tickets = await ComplaintTicket.find({
                assignedTo: emp._id,
                status: { $in: openStatuses }
            }).select('title status createdAt priority');

            const buckets = { fresh: [], moderate: [], stale: [], critical: [] };
            tickets.forEach(t => {
                const ageHours = (now - new Date(t.createdAt).getTime()) / 3600000;
                const entry = {
                    ticketId: t._id,
                    title: t.title,
                    status: t.status,
                    priority: t.priority,
                    ageHours: parseFloat(ageHours.toFixed(1)),
                    createdAt: t.createdAt
                };
                if (ageHours < 2) buckets.fresh.push(entry);
                else if (ageHours < 12) buckets.moderate.push(entry);
                else if (ageHours < 48) buckets.stale.push(entry);
                else buckets.critical.push(entry);
            });

            const avgAge = tickets.length
                ? tickets.reduce((acc, t) => acc + (now - new Date(t.createdAt).getTime()), 0) / tickets.length / 3600000
                : 0;

            return {
                employeeId: emp._id,
                name: emp.name,
                email: emp.email,
                profilePic: emp.profilePic,
                averageRating: emp.averageRating,
                totalOpen: tickets.length,
                avgAgeHours: parseFloat(avgAge.toFixed(1)),
                buckets
            };
        }));

        // Sort by worst avg age descending so most-neglected agents appear first
        agentRows.sort((a, b) => b.avgAgeHours - a.avgAgeHours);

        return res.json({ success: true, heatmap: agentRows });
    } catch (error) {
        console.error('getTicketAgingHeatmap error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs-admin/resolution-trend
// Returns weekly avg close time (hours) per agent for the past 5 weeks
export const getResolutionTimeTrend = async (req, res) => {
    try {
        const employees = await CSEmployee.find({ status: 'active' })
            .select('_id name email profilePic');

        const NUM_WEEKS = 5;
        const WEEK_MS = 7 * 24 * 3600 * 1000;
        const now = new Date();

        // Build week labels
        const weeks = [];
        for (let w = NUM_WEEKS - 1; w >= 0; w--) {
            const weekStart = new Date(now.getTime() - (w + 1) * WEEK_MS);
            const weekEnd = new Date(now.getTime() - w * WEEK_MS);
            weeks.push({
                label: `W${NUM_WEEKS - w}`,
                start: weekStart,
                end: weekEnd
            });
        }

        const trends = await Promise.all(employees.map(async (emp) => {
            const weeklyData = await Promise.all(weeks.map(async (week) => {
                const closedTickets = await ComplaintTicket.find({
                    assignedTo: emp._id,
                    isClosed: true,
                    closedAt: { $gte: week.start, $lt: week.end },
                    handleTime: { $gt: 0 }
                }).select('handleTime');

                const avgHours = closedTickets.length
                    ? closedTickets.reduce((acc, t) => acc + t.handleTime, 0) / closedTickets.length / 3600
                    : null; // null = no data that week

                return {
                    week: week.label,
                    avgHours: avgHours !== null ? parseFloat(avgHours.toFixed(2)) : null,
                    ticketsCount: closedTickets.length
                };
            }));

            return {
                employeeId: emp._id,
                name: emp.name,
                email: emp.email,
                profilePic: emp.profilePic,
                trend: weeklyData
            };
        }));

        // Filter to agents with at least some data
        const activeTrends = trends.filter(t => t.trend.some(w => w.avgHours !== null));

        return res.json({ success: true, weeks: weeks.map(w => w.label), trends: activeTrends });
    } catch (error) {
        console.error('getResolutionTimeTrend error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs-admin/log-monitoring-alert
// Called by CS agents (via their cstoken) to persist a monitoring alert
export const logMonitoringAlert = async (req, res) => {
    try {
        const { alertType, message, severity, metadata } = req.body;
        const employeeId = req.employeeId; // set by authCSEmployee middleware

        if (!alertType || !message) {
            return res.json({ success: false, message: 'alertType and message are required.' });
        }

        await CSEmployee.findByIdAndUpdate(employeeId, {
            $push: {
                monitoringAlerts: {
                    alertType,
                    message,
                    severity: severity || 'medium',
                    timestamp: new Date(),
                    metadata: metadata || {}
                }
            }
        });

        return res.json({ success: true, message: 'Alert logged.' });
    } catch (error) {
        console.error('logMonitoringAlert error:', error);
        res.json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════
//  NEW PHASE-2 MONITORING ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/cs-admin/response-lag-report
// For each agent, compute average lag (minutes) between last user message and
// the agent's first reply within the same ticket, over the past 30 days.
export const getResponseLagReport = async (req, res) => {
    try {
        const employees = await CSEmployee.find({ status: 'active' }).select('_id name email profilePic averageRating');
        const DAYS = 30;
        const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000);
        const LAG_THRESHOLD_MINS = 5;

        const report = await Promise.all(employees.map(async (emp) => {
            // Get all tickets assigned to this agent closed in last 30 days or still open
            const tickets = await ComplaintTicket.find({
                assignedTo: emp._id,
                createdAt: { $gte: since }
            }).select('_id');

            const lagMinutes = [];

            for (const ticket of tickets) {
                // Get all messages for this ticket ordered by time
                const messages = await TicketMessage.find({ ticketId: ticket._id })
                    .sort({ createdAt: 1 }).select('senderType createdAt');

                // Walk messages: each time we see a user message followed by an agent message, record the gap
                for (let i = 0; i < messages.length - 1; i++) {
                    if (messages[i].senderType === 'user' && messages[i + 1].senderType === 'cs_agent') {
                        const lagMs = new Date(messages[i + 1].createdAt) - new Date(messages[i].createdAt);
                        const lagMin = lagMs / 60000;
                        if (lagMin >= 0 && lagMin < 480) lagMinutes.push(lagMin); // ignore >8h outliers
                    }
                }
            }

            const avgLag = lagMinutes.length
                ? lagMinutes.reduce((a, b) => a + b, 0) / lagMinutes.length
                : null;

            const flagged = avgLag !== null && avgLag > LAG_THRESHOLD_MINS;

            return {
                employeeId: emp._id,
                name: emp.name,
                email: emp.email,
                profilePic: emp.profilePic,
                averageRating: emp.averageRating,
                avgLagMinutes: avgLag !== null ? parseFloat(avgLag.toFixed(2)) : null,
                sampleSize: lagMinutes.length,
                flagged,
                maxLag: lagMinutes.length ? parseFloat(Math.max(...lagMinutes).toFixed(2)) : null
            };
        }));

        // Sort: flagged first, then by avgLag desc
        report.sort((a, b) => {
            if (b.flagged !== a.flagged) return b.flagged ? 1 : -1;
            return (b.avgLagMinutes || 0) - (a.avgLagMinutes || 0);
        });

        return res.json({ success: true, report, lagThreshold: LAG_THRESHOLD_MINS });
    } catch (error) {
        console.error('getResponseLagReport error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs-admin/overtime-undertime-report
// Compares scheduled 10h shift (36000s) vs actual workSeconds for last 14 days
export const getOvertimeUndertimeReport = async (req, res) => {
    try {
        const DAYS = 14;
        const SCHEDULED_SECONDS = 36000; // 10 hours
        const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000);

        const employees = await CSEmployee.find({ status: 'active' }).select('_id name email profilePic');

        const report = await Promise.all(employees.map(async (emp) => {
            const shiftLogs = await CSShiftLog.find({
                employeeId: emp._id,
                shiftStart: { $gte: since }
            }).select('workSeconds breakSeconds completedShift earlyLogout date shiftStart shiftEnd');

            const dailyData = shiftLogs.map(log => {
                const worked = log.workSeconds || 0;
                const diff = worked - SCHEDULED_SECONDS;
                return {
                    date: log.date,
                    workSeconds: worked,
                    breakSeconds: log.breakSeconds || 0,
                    completedShift: log.completedShift,
                    earlyLogout: log.earlyLogout,
                    diffSeconds: diff,
                    status: diff > 1800 ? 'overtime' : diff < -3600 ? 'undertime' : 'normal'
                };
            });

            const totalDays = shiftLogs.length;
            const undertimeDays = dailyData.filter(d => d.status === 'undertime').length;
            const overtimeDays = dailyData.filter(d => d.status === 'overtime').length;
            const avgWorkHours = totalDays
                ? parseFloat((dailyData.reduce((a, d) => a + d.workSeconds, 0) / totalDays / 3600).toFixed(2))
                : 0;

            return {
                employeeId: emp._id,
                name: emp.name,
                email: emp.email,
                profilePic: emp.profilePic,
                totalDays,
                undertimeDays,
                overtimeDays,
                avgWorkHours,
                scheduledHours: SCHEDULED_SECONDS / 3600,
                isConsistentUnderperformer: undertimeDays >= 3,
                dailyData
            };
        }));

        report.sort((a, b) => b.undertimeDays - a.undertimeDays);

        return res.json({ success: true, report });
    } catch (error) {
        console.error('getOvertimeUndertimeReport error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs-admin/break-compliance-report
// Checks today's breaks per agent: are they within the 4h rule (1 mandatory break every 4h)?
// Flags too many short (<3 min) breaks or no breaks during a long shift
export const getBreakComplianceReport = async (req, res) => {
    try {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const startOfDay = new Date(todayStr + 'T00:00:00.000Z');

        const employees = await CSEmployee.find({ status: 'active', isOnline: true })
            .select('_id name email profilePic breakHistory');

        const MANDATORY_BREAK_INTERVAL_H = 4;
        const MIN_BREAK_DURATION_S = 180; // 3 minutes
        const EXCESSIVE_SHORT_THRESHOLD = 5;

        const report = employees.map(emp => {
            const todayBreaks = (emp.breakHistory || []).filter(b =>
                new Date(b.startTime) >= startOfDay
            ).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

            const shortBreaks = todayBreaks.filter(b => b.duration < MIN_BREAK_DURATION_S);
            const validBreaks = todayBreaks.filter(b => b.duration >= MIN_BREAK_DURATION_S);

            // Get shift hours worked today (estimate from first break or startOfDay)
            const totalBreakMin = todayBreaks.reduce((a, b) => a + b.duration, 0) / 60;

            // Check: if agent has been on for >4h and has 0 valid breaks → flag
            const shiftHoursElapsed = (Date.now() - startOfDay.getTime()) / 3600000;
            const missedMandatoryBreak = shiftHoursElapsed > MANDATORY_BREAK_INTERVAL_H && validBreaks.length === 0;
            const tooManyShortBreaks = shortBreaks.length >= EXCESSIVE_SHORT_THRESHOLD;

            let complianceStatus = 'compliant';
            const issues = [];
            if (missedMandatoryBreak) { complianceStatus = 'non_compliant'; issues.push('No mandatory break taken after 4+ hours'); }
            if (tooManyShortBreaks) { complianceStatus = 'warning'; issues.push(`${shortBreaks.length} micro-breaks (<3 min) detected`); }
            if (todayBreaks.length === 0) issues.push('No breaks taken today');

            return {
                employeeId: emp._id,
                name: emp.name,
                email: emp.email,
                profilePic: emp.profilePic,
                totalBreaks: todayBreaks.length,
                validBreaks: validBreaks.length,
                shortBreaks: shortBreaks.length,
                totalBreakMinutes: parseFloat(totalBreakMin.toFixed(1)),
                complianceStatus,
                issues,
                breaksDetail: todayBreaks.map(b => ({
                    startTime: b.startTime,
                    endTime: b.endTime,
                    durationMin: parseFloat((b.duration / 60).toFixed(1)),
                    isShort: b.duration < MIN_BREAK_DURATION_S
                }))
            };
        });

        const sorted = report.sort((a, b) => {
            const order = { non_compliant: 0, warning: 1, compliant: 2 };
            return order[a.complianceStatus] - order[b.complianceStatus];
        });

        return res.json({ success: true, report: sorted });
    } catch (error) {
        console.error('getBreakComplianceReport error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs-admin/suspicious-logins
// Detect: logins at odd hours (10 PM–6 AM), new IPs, or rapid consecutive logins (<10 min apart)
export const getSuspiciousLogins = async (req, res) => {
    try {
        const DAYS = 7;
        const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000);
        const ODD_HOUR_START = 22; // 10 PM
        const ODD_HOUR_END = 6;    // 6 AM
        const RAPID_LOGIN_THRESHOLD_MIN = 10;

        const logins = await CSLoginHistory.find({ loginAt: { $gte: since } })
            .populate('employeeId', 'name email profilePic lastLoginIp')
            .sort({ loginAt: -1 });

        // Group by employee
        const byEmployee = {};
        logins.forEach(l => {
            const eid = l.employeeId?._id?.toString();
            if (!eid) return;
            if (!byEmployee[eid]) byEmployee[eid] = {
                employee: l.employeeId,
                knownIps: new Set(),
                logins: []
            };
            byEmployee[eid].logins.push(l);
        });

        const suspiciousReport = [];

        for (const eid of Object.keys(byEmployee)) {
            const { employee, logins: empLogins } = byEmployee[eid];
            const flags = [];
            const ipsSeen = new Set();

            for (let i = 0; i < empLogins.length; i++) {
                const login = empLogins[i];
                const loginDate = new Date(login.loginAt);
                const hour = loginDate.getHours();
                const ip = login.ip;

                // Odd-hour login
                if (hour >= ODD_HOUR_START || hour < ODD_HOUR_END) {
                    flags.push({
                        type: 'odd_hour',
                        severity: 'medium',
                        loginAt: login.loginAt,
                        ip,
                        message: `Login at ${hour}:${String(loginDate.getMinutes()).padStart(2, '0')} (off-hours)`
                    });
                }

                // New IP (compare to IPs from previous logins in this window)
                if (ip && ipsSeen.size > 0 && !ipsSeen.has(ip)) {
                    flags.push({
                        type: 'new_ip',
                        severity: 'high',
                        loginAt: login.loginAt,
                        ip,
                        message: `Login from previously unseen IP: ${ip}`
                    });
                }
                if (ip) ipsSeen.add(ip);

                // Rapid consecutive logins
                if (i < empLogins.length - 1) {
                    const next = empLogins[i + 1];
                    const gapMin = (new Date(login.loginAt) - new Date(next.loginAt)) / 60000;
                    if (Math.abs(gapMin) < RAPID_LOGIN_THRESHOLD_MIN) {
                        flags.push({
                            type: 'rapid_login',
                            severity: 'high',
                            loginAt: login.loginAt,
                            ip,
                            message: `Rapid consecutive logins within ${Math.abs(gapMin).toFixed(1)} minutes`
                        });
                    }
                }
            }

            if (flags.length > 0) {
                suspiciousReport.push({
                    employeeId: eid,
                    name: employee?.name,
                    email: employee?.email,
                    profilePic: employee?.profilePic,
                    totalLogins: empLogins.length,
                    flagCount: flags.length,
                    highSeverityCount: flags.filter(f => f.severity === 'high').length,
                    flags: flags.slice(0, 20) // cap at 20 flags per agent
                });
            }
        }

        suspiciousReport.sort((a, b) => b.highSeverityCount - a.highSeverityCount);

        return res.json({ success: true, report: suspiciousReport, period: `${DAYS} days` });
    } catch (error) {
        console.error('getSuspiciousLogins error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs-admin/agent-comparison-matrix
// One-glance side-by-side comparison: Rating, FCR, Idle Time, Avg Lag, QA Score, Refunds
export const getAgentComparisonMatrix = async (req, res) => {
    try {
        const employees = await CSEmployee.find({ status: 'active' })
            .select('_id name email profilePic averageRating totalRatings totalTicketsResolved avgHandleTime idleTimeLogs monitoringAlerts xpPoints level rank');

        const DAYS = 30;
        const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000);

        const matrix = await Promise.all(employees.map(async (emp) => {
            // FCR = First Contact Resolution: tickets closed without reopening
            const totalClosed = await ComplaintTicket.countDocuments({
                assignedTo: emp._id,
                isClosed: true,
                updatedAt: { $gte: since }
            });
            // Estimate FCR: closed tickets where status went directly to resolved/closed (no re-opens)
            // Simplified: use resolvedAt presence
            const fcrCount = await ComplaintTicket.countDocuments({
                assignedTo: emp._id,
                isClosed: true,
                resolvedAt: { $ne: null },
                updatedAt: { $gte: since }
            });
            const fcrPercent = totalClosed > 0 ? parseFloat(((fcrCount / totalClosed) * 100).toFixed(1)) : 0;

            // Idle time (minutes last 30d)
            const idleLogs = (emp.idleTimeLogs || []).filter(l => new Date(l.date) >= since);
            const totalIdleMin = parseFloat((idleLogs.reduce((a, l) => a + (l.durationSeconds || 0), 0) / 60).toFixed(1));

            // QA Score (avg of all QA scores)
            const qaScores = await CSQAScore.find({ employeeId: emp._id }).select('score');
            const avgQA = qaScores.length
                ? parseFloat((qaScores.reduce((a, s) => a + s.score, 0) / qaScores.length).toFixed(1))
                : null;

            // Refunds issued (last 30d)
            const refundsIssued = await activityLogModel.countDocuments({
                'metadata.employeeId': emp._id.toString(),
                activityType: 'refund',
                timestamp: { $gte: since }
            });

            // Response lag (avg, reuse message model)
            const tickets = await ComplaintTicket.find({ assignedTo: emp._id, createdAt: { $gte: since } }).select('_id');
            const lagSamples = [];
            for (const t of tickets.slice(0, 20)) { // sample cap for perf
                const msgs = await TicketMessage.find({ ticketId: t._id }).sort({ createdAt: 1 }).select('senderType createdAt');
                for (let i = 0; i < msgs.length - 1; i++) {
                    if (msgs[i].senderType === 'user' && msgs[i + 1].senderType === 'cs_agent') {
                        const lagMin = (new Date(msgs[i + 1].createdAt) - new Date(msgs[i].createdAt)) / 60000;
                        if (lagMin >= 0 && lagMin < 480) lagSamples.push(lagMin);
                    }
                }
            }
            const avgLag = lagSamples.length
                ? parseFloat((lagSamples.reduce((a, b) => a + b, 0) / lagSamples.length).toFixed(2))
                : null;

            // Composite health score (0-100)
            let healthScore = 0;
            healthScore += Math.min(30, (emp.averageRating / 5) * 30);          // 30% weight — rating
            healthScore += Math.min(20, (fcrPercent / 100) * 20);               // 20% weight — FCR
            healthScore += Math.min(15, avgQA ? (avgQA / 100) * 15 : 7.5);     // 15% weight — QA
            healthScore += Math.max(0, 15 - (totalIdleMin / 60) * 5);           // 15% weight — low idle = good
            healthScore += Math.max(0, 20 - (avgLag || 0) * 2);                // 20% weight — low lag = good

            return {
                employeeId: emp._id,
                name: emp.name,
                email: emp.email,
                profilePic: emp.profilePic,
                avgRating: emp.averageRating,
                totalRatings: emp.totalRatings,
                fcrPercent,
                totalIdleMinutes: totalIdleMin,
                avgQAScore: avgQA,
                refundsIssued,
                avgResponseLagMin: avgLag,
                xpPoints: emp.xpPoints,
                rank: emp.rank,
                ticketsResolved: emp.totalTicketsResolved,
                healthScore: parseFloat(healthScore.toFixed(1))
            };
        }));

        matrix.sort((a, b) => b.healthScore - a.healthScore);

        return res.json({ success: true, matrix });
    } catch (error) {
        console.error('getAgentComparisonMatrix error:', error);
        res.json({ success: false, message: error.message });
    }
};


// CS Employee Complaint management by Master CS Agent
export const raiseComplaint = async (req, res) => {
    try {
        const { targetAgentId, title, description } = req.body;
        if (!targetAgentId || !title || !description) {
            return res.json({ success: false, message: 'Target agent ID, title, and description are required.' });
        }

        const reporterId = req.admin._id;
        const reporter = await CSEmployee.findById(reporterId);
        if (!reporter) {
            return res.json({ success: false, message: 'Reporter agent not found.' });
        }

        const targetAgent = await CSEmployee.findById(targetAgentId);
        if (!targetAgent) {
            return res.json({ success: false, message: 'Target CS agent not found.' });
        }

        const complaint = new CSComplaint({
            reporterId,
            reporterName: reporter.name,
            targetAgentId,
            targetAgentName: targetAgent.name,
            title,
            description
        });

        await complaint.save();

        // Log activity
        const newActivity = new activityLogModel({
            userId: reporterId,
            userType: 'admin',
            activityType: 'raise_complaint',
            activityDescription: `Master CS Agent ${reporter.name} raised a complaint against CS Agent ${targetAgent.name}: ${title}`
        });
        await newActivity.save();

        res.json({ success: true, message: 'Complaint filed successfully.', complaint });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
};

export const getComplaints = async (req, res) => {
    try {
        const complaints = await CSComplaint.find({}).sort({ createdAt: -1 });
        res.json({ success: true, complaints });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
};

export const updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) return res.json({ success: false, message: 'Status is required.' });

        const complaint = await CSComplaint.findById(id);
        if (!complaint) return res.json({ success: false, message: 'Complaint not found.' });

        complaint.status = status;
        await complaint.save();

        res.json({ success: true, message: 'Complaint status updated successfully.', complaint });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
};

export const acceptEscalatedTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const masterAgentId = req.admin.id;

        const ticket = await ComplaintTicket.findById(id);
        if (!ticket) return res.json({ success: false, message: 'Ticket not found.' });
        if (!ticket.isEscalatedToMaster) {
            return res.json({ success: false, message: 'This ticket has not been escalated.' });
        }
        if (ticket.assignedTo) {
            return res.json({ success: false, message: 'This ticket has already been accepted.' });
        }

        ticket.assignedTo = masterAgentId;
        ticket.status = 'in_progress';
        ticket.timeline.push({
            event: 'accepted',
            message: `Ticket accepted by Master CS Agent ${req.admin.name}.`,
            by: 'employee',
            timestamp: new Date()
        });
        await ticket.save();

        return res.json({ success: true, message: 'Escalated ticket accepted successfully.', ticket });
    } catch (error) {
        console.error('acceptEscalatedTicket error:', error);
        res.json({ success: false, message: error.message });
    }
};

export const adminAddTicketNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        if (!note) return res.json({ success: false, message: 'Note cannot be empty.' });

        const ticket = await ComplaintTicket.findById(id);
        if (!ticket) return res.json({ success: false, message: 'Ticket not found.' });

        ticket.timeline.push({
            event: 'note',
            message: note,
            by: 'employee',
            timestamp: new Date()
        });
        await ticket.save();

        return res.json({ success: true, message: 'Note added successfully.', ticket });
    } catch (error) {
        console.error('adminAddTicketNote error:', error);
        res.json({ success: false, message: error.message });
    }
};

export const adminUpdateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note, internalNotes } = req.body;

        const validStatuses = ['open', 'in_progress', 'scheduled_call', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) return res.json({ success: false, message: 'Invalid status.' });

        const ticket = await ComplaintTicket.findById(id);
        if (!ticket) return res.json({ success: false, message: 'Ticket not found.' });

        ticket.status = status;
        if (internalNotes !== undefined) ticket.internalNotes = internalNotes;

        const timelineEvent = {
            event: 'status_change',
            message: note || `Status changed to "${status}" by Master CS Agent.`,
            by: 'employee',
            timestamp: new Date()
        };
        ticket.timeline.push(timelineEvent);

        if (status === 'resolved' || status === 'closed') {
            ticket.isClosed = true;
            ticket.closedAt = new Date();
            ticket.resolvedAt = new Date();
        }

        await ticket.save();

        return res.json({ success: true, message: 'Status updated successfully.', ticket });
    } catch (error) {
        console.error('adminUpdateTicketStatus error:', error);
        res.json({ success: false, message: error.message });
    }
};

// DELETE /api/cs-admin/delete-employee/:id  (Admin only)
export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await CSEmployee.findById(id);
        if (!employee) return res.json({ success: false, message: 'CS Agent not found.' });

        // Send dismissal email before deleting
        try {
            await transporter.sendMail({
                from: `"PawVaidya Administration" <${process.env.SENDER_EMAIL}>`,
                to: employee.email,
                subject: 'Important: Your PawVaidya CS Agent Account Has Been Removed',
                html: `
                <div style="font-family:Inter,sans-serif;padding:32px;background:#f9fafb;">
                  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
                    <div style="background:linear-gradient(135deg,#7f1d1d,#b91c1c);padding:32px;text-align:center;color:white;">
                      <h1 style="margin:0;font-size:22px;font-weight:800;">Account Removed</h1>
                      <p style="margin:8px 0 0;opacity:.85;font-size:14px;">PawVaidya Customer Service</p>
                    </div>
                    <div style="padding:32px;">
                      <p style="font-size:15px;color:#374151;">Hi <strong>${employee.name}</strong>,</p>
                      <p style="color:#6b7280;line-height:1.7;">
                        We are writing to inform you that your <strong>PawVaidya Customer Service agent account</strong> has been permanently deleted by an administrator, effective immediately.
                      </p>
                      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0;">
                        <p style="margin:0;color:#b91c1c;font-weight:700;font-size:13px;">⚠️ What this means:</p>
                        <ul style="margin:8px 0 0;padding-left:18px;color:#6b7280;font-size:13px;line-height:1.8;">
                          <li>You can no longer log in to the CS Portal.</li>
                          <li>All your active sessions have been terminated.</li>
                          <li>Your performance records are archived internally.</li>
                        </ul>
                      </div>
                      <p style="color:#6b7280;font-size:13px;">
                        If you believe this was done in error or have any questions, please contact PawVaidya HR at 
                        <a href="mailto:${process.env.SENDER_EMAIL}" style="color:#0f4c81;">${process.env.SENDER_EMAIL}</a>.
                      </p>
                      <p style="margin-top:24px;color:#374151;font-size:13px;">
                        Thank you for your service.<br/>
                        <strong>PawVaidya Administration Team</strong>
                      </p>
                    </div>
                    <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
                      <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} PawVaidya. All rights reserved.</p>
                    </div>
                  </div>
                </div>`
            });
        } catch (emailErr) {
            console.warn('Dismissal email failed to send:', emailErr.message);
        }

        await CSEmployee.findByIdAndDelete(id);

        return res.json({ success: true, message: `CS Agent "${employee.name}" has been permanently deleted and notified via email.` });
    } catch (error) {
        console.error('deleteEmployee error:', error);
        res.json({ success: false, message: error.message });
    }
};
