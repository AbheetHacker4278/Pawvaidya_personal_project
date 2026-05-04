import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import CSEmployee from '../models/csEmployeeModel.js';
import CSLoginHistory from '../models/csLoginHistoryModel.js';
import CSRating from '../models/csRatingModel.js';
import CSReport from '../models/csReportModel.js';
import ComplaintTicket from '../models/complaintTicketModel.js';
import { transporter } from '../config/nodemailer.js';


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
                html: `<div style="font-family:Inter,sans-serif;padding:32px;background:#f9fafb;"><div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;"><div style="background:linear-gradient(135deg,#0f4c81,#1a6bb5);padding:32px;text-align:center;color:white;"><h1 style="margin:0;font-size:24px;">Welcome to the Team!</h1><p style="margin:8px 0 0;opacity:.9;">PawVaidya Customer Service</p></div><div style="padding:32px;"><p>Hi <strong>${name}</strong>,</p><p>Your Customer Service account has been created successfully.</p><ul><li><strong>Email:</strong> ${email}</li><li><strong>Temporary Password:</strong> ${password}</li><li><strong>Profile Deadline:</strong> ${deadline.toDateString()}</li></ul><p style="color:#DC2626;font-weight:600;">⚠️ You must complete your profile and register your face within 2 days or your account will be suspended.</p><p>Login at: <a href="http://localhost:5175">http://localhost:5175</a></p><p>Best regards,<br/>PawVaidya Admin</p></div></div></div>`
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

        const stats = {
            employee,
            metrics,
            recentReviews,
            loginHistory
        };

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
