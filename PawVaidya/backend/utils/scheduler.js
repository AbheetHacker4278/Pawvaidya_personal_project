import cron from 'node-cron';
import doctorModel from '../models/doctorModel.js';
import serviceHealthModel from '../models/serviceHealthModel.js';
import userModel from '../models/userModel.js';
import { performHeartbeatCheck } from './heartbeatUtility.js';
import { observeJob } from './jobObserver.js';
import { transporter } from '../config/nodemailer.js';
import VERIFICATION_REMINDER_TEMPLATE from '../mailservice/verificationReminderTemplate.js';
import appointmentModel from '../models/appointmentModel.js';
import { PAYMENT_FAILED_TEMPLATE } from '../mailservice/paymentFailedTemplate.js';
import subscriptionModel from '../models/subscriptionModel.js';
import { SUBSCRIPTION_EXPIRY_TEMPLATE, GIFT_SUBSCRIPTION_EXPIRY_TEMPLATE } from '../mailservice/subscriptionTemplates.js';
import { trackRedisMetrics } from './redisTracker.js';

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
        await trackRedisMetrics();
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

    // Prune Stale Razorpay Appointments every 5 minutes
    cron.schedule('*/5 * * * *', () => observeJob('Prune Stale Razorpay Appointments', async () => {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        const staleAppointments = await appointmentModel.find({
            paymentMethod: 'Razorpay',
            payment: false,
            cancelled: false,
            date: { $lt: fifteenMinutesAgo.getTime() } // Assuming 'date' is stored as milliseconds
        });

        if (staleAppointments.length > 0) {
            console.log(`Found ${staleAppointments.length} stale Razorpay appointments. Processing cancellation...`);

            for (const appointment of staleAppointments) {
                try {
                    // Update appointment status
                    appointment.cancelled = true;
                    await appointment.save();

                    // Release doctor's slot
                    const doctor = await doctorModel.findById(appointment.docId);
                    if (doctor) {
                        let slots_booked = doctor.slots_booked || {};
                        if (slots_booked[appointment.slotDate]) {
                            slots_booked[appointment.slotDate] = slots_booked[appointment.slotDate].filter(
                                slot => slot !== appointment.slotTime
                            );
                            await doctorModel.findByIdAndUpdate(appointment.docId, { slots_booked });
                        }
                    }

                    // Send notification email
                    const mailOptions = {
                        from: process.env.SENDER_EMAIL,
                        to: appointment.userData.email,
                        subject: 'Appointment Payment Timed Out',
                        html: PAYMENT_FAILED_TEMPLATE
                            .replace('{name}', appointment.userData.name)
                            .replace('{docName}', appointment.docData.name)
                            .replace('{slotDate}', appointment.slotDate.replace(/_/g, '/'))
                            .replace('{slotTime}', appointment.slotTime)
                    };
                    await transporter.sendMail(mailOptions);

                } catch (err) {
                    console.error(`Failed to cancel stale appointment ${appointment._id}:`, err.message);
                }
            }
        }
    }));

    // Prune Expired Subscriptions (Check every minute for short-duration gifts)
    cron.schedule('* * * * *', () => observeJob('Expire Subscriptions', async () => {
        const now = new Date();

        const expiredSubscriptions = await subscriptionModel.find({
            status: 'Active',
            expiryDate: { $lte: now }
        }).populate('userId');

        if (expiredSubscriptions.length > 0) {
            console.log(`Found ${expiredSubscriptions.length} expired subscriptions. Processing...`);

            for (const sub of expiredSubscriptions) {
                try {
                    // Update subscription history
                    sub.status = 'Expired';
                    await sub.save();

                    // Retrieve and update User
                    const user = sub.userId;
                    if (user && user.subscription && user.subscription.plan === sub.plan) {
                        user.subscription = {
                            plan: 'None',
                            status: 'None',
                            expiryDate: null
                        };
                        await user.save();

                        // Send Expiry Notification Email
                        const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

                        const mailOptions = {
                            from: process.env.SENDER_EMAIL,
                            to: user.email,
                            subject: sub.isGift ? '🎁 Gifted Access Ended - PawVaidya' : 'Account Update: Subscription Expired - PawVaidya',
                            html: (sub.isGift ? GIFT_SUBSCRIPTION_EXPIRY_TEMPLATE : SUBSCRIPTION_EXPIRY_TEMPLATE)
                                .replace('{userName}', user.name)
                                .replace('{planName}', sub.plan)
                                .replace('{expiryDate}', new Date(sub.expiryDate).toLocaleString())
                                .replace(/{appUrl}/g, appUrl)
                        };

                        await transporter.sendMail(mailOptions);
                    }
                } catch (err) {
                    console.error(`Failed to process expired subscription ${sub._id}:`, err.message);
                }
            }
        }
    }));
};

export default initScheduler;
