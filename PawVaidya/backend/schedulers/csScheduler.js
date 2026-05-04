import cron from 'node-cron';
import CSEmployee from '../models/csEmployeeModel.js';
import nodemailer from 'nodemailer';

const getTransporter = () => nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SENDER_EMAIL, pass: process.env.SENDER_PASSWORD }
});

// Suspend employees who missed their profile completion deadline
const checkProfileDeadlines = async () => {
    try {
        const now = new Date();
        const overdue = await CSEmployee.find({
            profileComplete: false,
            profileDeadline: { $lt: now },
            status: { $ne: 'suspended' }
        });

        for (const emp of overdue) {
            await CSEmployee.findByIdAndUpdate(emp._id, {
                status: 'suspended',
                suspendedReason: 'Profile not completed within 2 days of account creation.',
                suspendedAt: now
            });

            console.log(`[CS Scheduler] Suspended employee ${emp.email} – profile deadline missed.`);

            try {
                const transporter = getTransporter();
                await transporter.sendMail({
                    from: `"PawVaidya Admin" <${process.env.SENDER_EMAIL}>`,
                    to: emp.email,
                    subject: '⚠️ Your PawVaidya CS Account Has Been Suspended',
                    html: `<p>Hi ${emp.name},</p><p>Your account has been suspended because you did not complete your profile within the required 2-day window.</p><p>Please contact the admin to get your account reinstated.</p><p>– PawVaidya Admin</p>`
                });
            } catch (emailErr) {
                console.warn('[CS Scheduler] Suspension email failed:', emailErr.message);
            }
        }

        if (overdue.length > 0) {
            console.log(`[CS Scheduler] Suspended ${overdue.length} employee(s) for missed profile deadlines.`);
        }
    } catch (err) {
        console.error('[CS Scheduler] checkProfileDeadlines error:', err.message);
    }
};

// Generate weekly performance report for all active employees (automatically)
// This is also triggerable manually from the admin panel
export const generateWeeklyReports = async () => {
    try {
        const { generateEmployeeReport } = await import('../controllers/csAdminController.js');
        const employees = await CSEmployee.find({ status: 'active' });
        console.log(`[CS Scheduler] Generating weekly reports for ${employees.length} employees...`);
        for (const emp of employees) {
            await generateEmployeeReport(
                { params: { id: String(emp._id) }, body: { period: 'weekly' } },
                {
                    json: (data) => {
                        if (!data.success) console.warn(`[CS Scheduler] Report failed for ${emp.email}: ${data.message}`);
                    }
                }
            );
        }
        console.log('[CS Scheduler] Weekly reports done.');
    } catch (err) {
        console.error('[CS Scheduler] generateWeeklyReports error:', err.message);
    }
};

export const initCSScheduler = () => {
    console.log('[CS Scheduler] Initializing...');

    // Check profile deadlines every hour
    cron.schedule('0 * * * *', () => {
        console.log('[CS Scheduler] Running profile deadline check...');
        checkProfileDeadlines();
    }, { timezone: 'Asia/Kolkata' });

    // Generate weekly reports every Monday at 8:00 AM
    cron.schedule('0 8 * * 1', () => {
        console.log('[CS Scheduler] Triggering weekly employee reports...');
        generateWeeklyReports();
    }, { timezone: 'Asia/Kolkata' });

    console.log('[CS Scheduler] Active: hourly deadline checks + weekly reports (Mondays 8 AM IST)');
};
