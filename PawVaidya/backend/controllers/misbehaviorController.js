import UserMisbehaviorReport from '../models/userMisbehaviorReportModel.js';
import userModel from '../models/userModel.js';
import { transporter } from '../config/nodemailer.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * Report user misbehavior to Admin (CS Agent)
 */
export const reportMisbehavior = async (req, res) => {
    try {
        const { userId, ticketId, reason, evidence } = req.body;
        const employeeId = req.employeeId;

        if (!userId || !reason) {
            return res.json({ success: false, message: 'Missing required fields' });
        }

        const report = await UserMisbehaviorReport.create({
            userId,
            reportedBy: employeeId,
            ticketId,
            reason,
            evidence
        });

        await logActivity(
            employeeId,
            'cs_employee',
            'report_misbehavior',
            `Reported user ${userId} for misbehavior.`,
            req,
            { reportId: report._id }
        );

        res.json({ success: true, message: 'Reported to Admin successfully', report });
    } catch (error) {
        console.error('Report misbehavior error:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Get all misbehavior reports (Admin)
 */
export const getMisbehaviorReports = async (req, res) => {
    try {
        const reports = await UserMisbehaviorReport.find()
            .populate('userId', 'name email image')
            .populate('reportedBy', 'name email')
            .populate('actionTakenBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, reports });
    } catch (error) {
        console.error('Get misbehavior reports error:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Resolve misbehavior report (Admin)
 */
export const resolveMisbehaviorReport = async (req, res) => {
    try {
        const { reportId, action, banDuration, banReason, adminFeedbackToAgent } = req.body;
        const adminId = req.adminId;

        if (!reportId || !action) {
            return res.json({ success: false, message: 'Missing required fields' });
        }

        const report = await UserMisbehaviorReport.findById(reportId).populate('userId');
        if (!report) {
            return res.json({ success: false, message: 'Report not found' });
        }

        report.adminFeedbackToAgent = adminFeedbackToAgent || '';

        if (action === 'ban') {
            if (!banDuration || !banReason) {
                return res.json({ success: false, message: 'Ban duration and reason are required' });
            }

            const user = await userModel.findById(report.userId._id);
            if (!user) {
                return res.json({ success: false, message: 'User not found' });
            }

            // Calculate unban date
            let unbanAt = null;
            if (banDuration !== 'permanent') {
                const amount = parseInt(banDuration);
                const unit = banDuration.slice(-1);
                const now = new Date();
                if (unit === 'h') unbanAt = new Date(now.getTime() + amount * 60 * 60 * 1000);
                else if (unit === 'd') unbanAt = new Date(now.getTime() + amount * 24 * 60 * 60 * 1000);
                else if (unit === 'w') unbanAt = new Date(now.getTime() + amount * 7 * 24 * 60 * 60 * 1000);
                else if (unit === 'm') unbanAt = new Date(now.getTime() + amount * 30 * 24 * 60 * 60 * 1000);
            }

            user.isBanned = true;
            user.banReason = banReason;
            user.bannedAt = new Date();
            user.bannedBy = adminId;
            user.unbanAt = unbanAt;
            await user.save();

            // Send Email to User
            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: user.email,
                subject: 'Account Suspended - PawVaidya',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
                        <h2 style="color: #d9534f;">Account Suspension Notice</h2>
                        <p>Hello ${user.name},</p>
                        <p>Your account has been suspended due to misbehavior with our Customer Service agents.</p>
                        <p><strong>Reason:</strong> ${banReason}</p>
                        <p><strong>Duration:</strong> ${banDuration === 'permanent' ? 'Permanent' : banDuration}</p>
                        ${unbanAt ? `<p><strong>Suspension Ends:</strong> ${unbanAt.toLocaleString()}</p>` : ''}
                        <p>If you believe this is a mistake, please contact support.</p>
                        <br/>
                        <p>Best regards,<br/>PawVaidya Admin Team</p>
                    </div>
                `
            };
            await transporter.sendMail(mailOptions);

            report.status = 'resolved';
            report.adminAction = `Banned for ${banDuration}`;
        } else if (action === 'dismiss') {
            report.status = 'dismissed';
            report.adminAction = 'Report dismissed by admin';
        }

        report.actionTakenBy = adminId;
        await report.save();

        res.json({ success: true, message: 'Report resolved successfully' });
    } catch (error) {
        console.error('Resolve misbehavior report error:', error);
        res.json({ success: false, message: error.message });
    }
};
/**
 * Send pre-written complaint appeal/warning email (Admin)
 */
export const sendComplaintAppealEmail = async (req, res) => {
    try {
        const { userId, reportId } = req.body;
        const adminId = req.adminId;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const report = await UserMisbehaviorReport.findById(reportId);
        
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Official Warning: Account Misbehavior - PawVaidya',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ff9800; padding: 25px; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #ff9800; margin: 0;">OFFICIAL WARNING</h1>
                        <p style="color: #666; font-size: 14px;">Behavior Monitoring Division</p>
                    </div>
                    
                    <p>Dear <strong>${user.name}</strong>,</p>
                    
                    <p>We are writing to officially inform you that a formal complaint regarding your recent interaction with our Customer Service team has been logged into our system.</p>
                    
                    <div style="background-color: #fffaf0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #856404;"><strong>Incident Report Summary:</strong></p>
                        <p style="margin: 5px 0 0; font-style: italic;">"${report ? report.reason : 'Unprofessional conduct with support staff'}"</p>
                    </div>
                    
                    <p>At PawVaidya, we maintain a <strong>Zero Tolerance Policy</strong> regarding abusive language, threats, or harassment of our employees. Our agents are here to help you, and they deserve to be treated with respect.</p>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ul style="color: #333;">
                        <li>Avoid further unprofessional interactions.</li>
                        <li>Review our Terms of Service regarding user conduct.</li>
                        <li>Failure to comply will result in a <strong>Permanent Ban</strong> of your account and forfeiture of any active subscriptions.</li>
                    </ul>
                    
                    <p style="margin-top: 30px;">If you wish to appeal this warning or provide evidence regarding this incident, you may reply to this email.</p>
                    
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
                        <p>© 2026 PawVaidya Veterinary Services. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        await logActivity(
            adminId,
            'admin',
            'send_complaint_warning',
            `Sent warning email to user ${user.name} regarding report ${reportId}`,
            req,
            { userId, reportId }
        );

        res.json({ success: true, message: 'Warning email sent successfully' });
    } catch (error) {
        console.error('Send complaint email error:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * @api {get} /api/misbehavior/ticket/:ticketId Get report by ticket ID
 */
export const getReportByTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const report = await UserMisbehaviorReport.findOne({ ticketId }).populate('actionTakenBy', 'name');
        
        if (!report) {
            return res.json({ success: false, message: 'No report found for this ticket' });
        }

        res.json({ success: true, report });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};
