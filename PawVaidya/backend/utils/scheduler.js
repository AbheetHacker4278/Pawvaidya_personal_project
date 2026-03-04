import cron from 'node-cron';
import doctorModel from '../models/doctorModel.js';
import serviceHealthModel from '../models/serviceHealthModel.js';
import userModel from '../models/userModel.js';
import { performHeartbeatCheck } from './heartbeatUtility.js';
import { observeJob } from './jobObserver.js';
import { transporter } from '../config/nodemailer.js';
import VERIFICATION_REMINDER_TEMPLATE from '../mailservice/verificationReminderTemplate.js';

const initScheduler = () => {
    // Run every minute to check for expired incentives
    cron.schedule('* * * * *', () => observeJob('Incentive Expiry', async () => {
        const now = new Date();

        // Find doctors with active incentives that have expired
        const expiredDoctors = await doctorModel.find({
            'incentive.type': { $ne: 'none' },
            'incentive.expiryDate': { $lte: now } // Check if expiryDate exists and is in the past
        });

        if (expiredDoctors.length > 0) {
            console.log(`Found ${expiredDoctors.length} doctors with expired incentives. Deactivating...`);

            for (const doctor of expiredDoctors) {
                // Archive the expired incentive to history before removing it
                if (doctor.incentive.type !== 'none') {
                    const expiredIncentive = {
                        ...doctor.incentive,
                        message: `${doctor.incentive.message} (Expired)`,
                        date: new Date() // Log the time of expiration/viewing
                    };

                    if (!doctor.incentiveHistory) {
                        doctor.incentiveHistory = [];
                    }
                    doctor.incentiveHistory.push(expiredIncentive);
                }

                // Reset incentive
                doctor.incentive = {
                    type: 'none',
                    value: '',
                    message: '',
                    date: null,
                    expiryDate: null
                };

                await doctor.save();
            }
            console.log('Expired incentives deactivated successfully.');
        }
    }));

    // Run every 15 minutes for Service Heartbeat
    cron.schedule('*/15 * * * *', () => observeJob('Service Heartbeat', async () => {
        await performHeartbeatCheck();
    }));

    // Run daily at midnight to prune unverified users
    cron.schedule('0 0 * * *', () => observeJob('Prune Unverified Users', async () => {
        const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

        const expiredUsers = await userModel.find({
            isAccountverified: false,
            $or: [
                { createdAt: { $lt: tenDaysAgo } },
                { createdAt: { $exists: false } } // Also prune users missing createdAt
            ]
        });

        if (expiredUsers.length > 0) {
            console.log(`Pruning ${expiredUsers.length} unverified accounts older than 10 days.`);
            await userModel.deleteMany({
                _id: { $in: expiredUsers.map(u => u._id) }
            });
        }
    }));

    // Run at 10:00 AM and 6:10 PM to send reminders
    const reminderTimes = ['0 10 * * *', '10 18 * * *'];
    reminderTimes.forEach(schedule => {
        cron.schedule(schedule, () => observeJob('Send Verification Reminders', async () => {
            const now = new Date();
            const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

            const usersToRemind = await userModel.find({
                isAccountverified: false,
                createdAt: { $gte: tenDaysAgo }
            });

            for (const user of usersToRemind) {
                // Ensure account is at least 1 hour old to avoid immediate spam
                const createdAt = user.createdAt || now;
                const accountAgeHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));

                if (accountAgeHours >= 1) {
                    try {
                        const daysLeft = Math.ceil((10 * 24 - accountAgeHours) / 24);

                        const mailOptions = {
                            from: process.env.SENDER_EMAIL,
                            to: user.email,
                            subject: 'Action Required: Verify Your PawVaidya Account',
                            html: VERIFICATION_REMINDER_TEMPLATE
                                .replace('{name}', user.name || 'User')
                                .replace('{daysLeft}', daysLeft)
                        };

                        await transporter.sendMail(mailOptions);

                        user.verificationRemindersSent += 1;
                        user.lastVerificationReminderAt = now;
                        await user.save();
                    } catch (error) {
                        console.error(`Failed to send verification reminder to ${user.email}:`, error.message);
                    }
                }
            }
        }));
    });

    console.log('Incentive, Heartbeat, and Verification schedulers initialized.');
};

export default initScheduler;
