import cron from 'node-cron';
import doctorModel from '../models/doctorModel.js';
import serviceHealthModel from '../models/serviceHealthModel.js';
import userModel from '../models/userModel.js';
import { performHeartbeatCheck } from './heartbeatUtility.js';
import { observeJob } from './jobObserver.js';
import { transporter } from '../config/nodemailer.js';
import notificationQueue from './notificationQueue.js';
import VERIFICATION_REMINDER_TEMPLATE from '../mailservice/verificationReminderTemplate.js';
import appointmentModel from '../models/appointmentModel.js';
import { PAYMENT_FAILED_TEMPLATE } from '../mailservice/paymentFailedTemplate.js';
import subscriptionModel from '../models/subscriptionModel.js';
import { SUBSCRIPTION_EXPIRY_TEMPLATE, GIFT_SUBSCRIPTION_EXPIRY_TEMPLATE } from '../mailservice/subscriptionTemplates.js';
import { trackRedisMetrics } from './redisTracker.js';
import emergencyPaymentDueModel from '../models/emergencyPaymentDueModel.js';
import emergencyRequestModel from '../models/emergencyRequestModel.js';
import adminMessageModel from '../models/adminMessageModel.js';
import adminCouponModel from '../models/adminCouponModel.js';
import { getIO } from '../socketServer.js';


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

    // Run every minute to prune expired Obsidian subscription approvals (24-hour limit)
    cron.schedule('* * * * *', () => observeJob('Obsidian Approval Expiry', async () => {
        try {
            const { cleanupExpiredApprovals } = await import('../controllers/subscriptionController.js');
            await cleanupExpiredApprovals();
        } catch (err) {
            console.error('Error in Obsidian Approval Expiry scheduler:', err.message);
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

                        notificationQueue.enqueueMail(mailOptions);
                    }
                } catch (err) {
                    console.error(`Failed to process expired subscription ${sub._id}:`, err.message);
                }
            }
        }
    }));

    // Auto-reconcile unpaid emergency dues from Paw Wallet every minute
    cron.schedule('* * * * *', () => observeJob('Reconcile Emergency Dues', async () => {
        try {
            const unpaidDues = await emergencyPaymentDueModel.find({ isPaid: false });
            
            for (const due of unpaidDues) {
                const user = await userModel.findById(due.userId);
                if (user && user.pawWallet >= due.amountDue) {
                    console.log(`[Dues Resolver] User ${user.name} has sufficient wallet balance (${user.pawWallet}). Reconciling due ${due._id} of ₹${due.amountDue}...`);
                    
                    // Deduct
                    user.pawWallet -= due.amountDue;
                    
                    // Check other dues
                    const otherDuesCount = await emergencyPaymentDueModel.countDocuments({
                        userId: user._id,
                        isPaid: false,
                        _id: { $ne: due._id }
                    });
                    
                    if (otherDuesCount === 0) {
                        user.emergencyPaymentStatus = 'No Dues';
                        // Auto-unban if banned due to emergency dues
                        if (user.isBanned && user.banReason && user.banReason.includes("emergency booking dues")) {
                            user.isBanned = false;
                            user.banReason = '';
                            user.bannedAt = null;
                            user.bannedBy = null;
                        }
                    }
                    
                    await user.save();
                    
                    // Mark due as paid
                    due.isPaid = true;
                    due.paidAt = new Date();
                    due.auditLogs.push({
                        action: 'RECONCILIATION_SUCCESS',
                        details: `Outstanding due of ₹${due.amountDue} automatically reconciled and paid from updated Paw Wallet balance.`
                    });
                    await due.save();
                    
                    // Update request
                    const request = await emergencyRequestModel.findById(due.requestId);
                    if (request) {
                        request.paymentDetails = {
                            paymentId: `TXN-EM-WL-AUTO-${Date.now()}`,
                            paymentMethod: "Wallet",
                            paidAt: new Date(),
                            status: "Paid"
                        };
                        request.paymentLogs.push({
                            amount: due.amountDue,
                            transactionId: `TXN-EM-WL-AUTO-${Date.now()}`,
                            method: "Wallet",
                            status: "Success",
                            timestamp: new Date()
                        });
                        await request.save();
                        
                        // Notify user via socket
                        try {
                            const io = getIO();
                            if (io) {
                                io.to(`user-emergency-${request.userId}`).emit('emergency-status-updated', { request });
                            }
                        } catch (sockErr) {
                            console.error("Dues socket notify failed:", sockErr.message);
                        }
                    }
                    
                    // Send Email notification
                    const mailOptions = {
                        from: process.env.SENDER_EMAIL,
                        to: user.email,
                        subject: '🐾 PawVaidya Emergency Dues Cleared!',
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #28a745; border-radius: 8px;">
                                <h2 style="color: #28a745; text-align: center;">🎉 EMERGENCY DUES RECONCILED</h2>
                                <p>Dear <strong>${user.name}</strong>,</p>
                                <p>Great news! We have automatically cleared your outstanding emergency booking due from your available <strong>Paw Wallet</strong> balance.</p>
                                <hr/>
                                <p><strong>Transaction Breakdown:</strong></p>
                                <p>No manual admin intervention is needed! Your account restrictions have been fully lifted and all booking, emergency, and wallet services are fully active again.</p>
                                <ul>
                                    <li><strong>Amount Processed:</strong> ₹${due.amountDue}</li>
                                    <li><strong>Payment Method:</strong> Paw Wallet Auto-Deduction</li>
                                    <li><strong>Remaining Wallet Balance:</strong> ₹${user.pawWallet}</li>
                                </ul>
                                <p style="color: #28a745; font-weight: bold; text-align: center;">Your emergency account status is now fully cleared ("No Dues").</p>
                                <p style="color: #6c757d; font-size: 12px; text-align: center;">PawVaidya Auto-Billing Network &copy; 2026</p>
                            </div>
                        `
                    };
                    notificationQueue.enqueueMail(mailOptions);
                }
            }
        } catch (err) {
            console.error("Error in Reconcile Emergency Dues cron job:", err.message);
        }
    }));

    // Check Emergency Late Dues & Apply Automated Warnings / Suspension Bans every minute
    cron.schedule('* * * * *', () => observeJob('Check Emergency Late Dues & Bans', async () => {
        try {
            const now = new Date();
            const unpaidDues = await emergencyPaymentDueModel.find({ isPaid: false });

            for (const due of unpaidDues) {
                const user = await userModel.findById(due.userId);
                if (!user) continue;

                const timeLeftMs = due.dueDate.getTime() - now.getTime();
                const timeLeftHours = timeLeftMs / (1000 * 60 * 60);

                if (timeLeftMs <= 0) {
                    // DEADLINE EXCEEDED -> Apply Temporary Ban
                    if (!user.isBanned) {
                        console.log(`[Dues Suspender] Due ${due._id} has expired for user ${user.name}. Applying temporary suspension...`);
                        
                        user.isBanned = true;
                        user.banReason = `Suspended due to unpaid emergency booking dues after 4-day grace period. Outstanding amount: ₹${due.amountDue}. Please clear the outstanding due to reactivate your account instantly.`;
                        user.bannedAt = now;
                        user.bannedBy = "system";
                        await user.save();

                        // Log audit log inside the due record
                        due.auditLogs.push({
                            action: 'ACCOUNT_BANNED',
                            details: `Grace period exceeded. Temporary account ban successfully applied to user ${user.name} for outstanding due ₹${due.amountDue}.`,
                            timestamp: now
                        });
                        await due.save();

                        // Create in-app urgent adminMessage
                        try {
                            const banAlert = new adminMessageModel({
                                title: '🚫 Account Suspended - Unpaid Emergency Dues',
                                message: `Your PawVaidya account has been temporarily suspended due to unpaid emergency booking dues of ₹${due.amountDue}. Please clear this outstanding due immediately to reactivate all booking and wallet services.`,
                                targetType: 'specific',
                                targetIds: [user._id.toString()],
                                priority: 'urgent',
                                createdBy: 'System'
                            });
                            await banAlert.save();
                        } catch (msgErr) {
                            console.error("Failed to create in-app ban message:", msgErr.message);
                        }

                        // Send suspension email notification
                        const mailOptions = {
                            from: process.env.SENDER_EMAIL,
                            to: user.email,
                            subject: '⚠️ ACTION REQUIRED: PawVaidya Account Suspended',
                            html: `
                                <div style="font-family: Arial, sans-serif; padding: 20px; border: 3px dashed #dc3545; border-radius: 8px; background-color: #fffafb;">
                                    <h2 style="color: #721c24; text-align: center;">🚫 ACCOUNT SUSPENDED: EMERGENCY DUE EXCEEDED</h2>
                                    <p>Dear <strong>${user.name}</strong>,</p>
                                    <p>Your PawVaidya account has been <strong>temporarily suspended</strong> because you failed to repay your outstanding emergency booking due of <strong>₹${due.amountDue}</strong> within the allowed 4-day grace period.</p>
                                    <hr style="border: none; border-top: 1px solid #f5c6cb; margin: 20px 0;"/>
                                    <p style="font-size: 16px; color: #721c24; font-weight: bold;">Restricted Services during Ban:</p>
                                    <ul style="color: #721c24; line-height: 1.6;">
                                        <li>❌ Standard Vet Appointment Bookings</li>
                                        <li>❌ Emergency Booking Services</li>
                                        <li>❌ Wallet Transactions (except debt repayment)</li>
                                    </ul>
                                    <p style="background-color: #f1f3f5; padding: 12px; border-radius: 4px; text-align: center; font-weight: bold; color: #495057;">
                                        How to Unlock Your Account:
                                    </p>
                                    <p style="text-align: center; font-size: 14px;">
                                        No manual admin intervention is needed! Add <strong>₹${due.amountDue}</strong> to your Paw Wallet and navigate to your outstanding dues section, then click "Repay". Once settled, your account restrictions will be instantly lifted.
                                    </p>
                                    <p style="color: #6c757d; font-size: 12px; text-align: center;">PawVaidya Compliance & Auto-Billing Network &copy; 2026</p>
                                </div>
                            `
                        };
                        notificationQueue.enqueueMail(mailOptions);
                    }
                } else {
                    // DEADLINE NOT EXCEEDED YET -> Dispatch Warnings (24h and 48h)
                    if (timeLeftHours <= 24 && !due.remindersSent.includes('24h')) {
                        console.log(`[Dues Reminder] Under 24h remaining for due ${due._id}. Sending final warning to ${user.name}...`);
                        
                        due.remindersSent.push('24h');
                        due.auditLogs.push({
                            action: 'REMINDER_SENT_24H',
                            details: `Final 24-hour warning reminder email, in-app notification, and push alerts dispatched.`,
                            timestamp: now
                        });
                        await due.save();

                        // In-app alert
                        try {
                            const warningAlert = new adminMessageModel({
                                title: '🚨 Final 24-Hour Warning: Account Suspension Imminent',
                                message: `Your account has an outstanding emergency due of ₹${due.amountDue}. To avoid temporary restriction of your booking and wallet services, please clear this amount within 24 hours.`,
                                targetType: 'specific',
                                targetIds: [user._id.toString()],
                                priority: 'urgent',
                                createdBy: 'System'
                            });
                            await warningAlert.save();
                        } catch (msgErr) {
                            console.error("Failed to create 24h in-app message:", msgErr.message);
                        }

                        // Send warning email
                        const mailOptions = {
                            from: process.env.SENDER_EMAIL,
                            to: user.email,
                            subject: '🚨 FINAL WARNING: Account Suspension in 24 Hours - PawVaidya',
                            html: `
                                <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #dc3545; border-radius: 8px;">
                                    <h2 style="color: #dc3545; text-align: center;">🚨 FINAL 24-HOUR WARNING: ACCOUNT SUSPENSION IMMINENT</h2>
                                    <p>Dear <strong>${user.name}</strong>,</p>
                                    <p>This is the final automated warning that you have an outstanding emergency booking due of <strong>₹${due.amountDue}</strong>.</p>
                                    <p>You have less than <strong>24 hours</strong> (by ${new Date(due.dueDate).toLocaleString()}) to settle this due before temporary account restrictions are applied.</p>
                                    <p style="color: #721c24; background-color: #f8d7da; padding: 12px; border-radius: 4px; border: 1px solid #f5c6cb;">
                                        <strong>🚫 Restriction Penalty:</strong> If unpaid, our automated system will restrict your account. During the suspension, you will not be allowed to book standard appointments, request emergency services, or use wallet-related operations.
                                    </p>
                                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                                    <p style="text-align: center; font-size: 14px;"><strong>Resolve immediately:</strong> Top up your Paw Wallet now to avoid disruption of your pet's healthcare services.</p>
                                    <p style="color: #6c757d; font-size: 12px; text-align: center;">PawVaidya Auto-Billing Network &copy; 2026</p>
                                </div>
                            `
                        };
                        notificationQueue.enqueueMail(mailOptions);

                    } else if (timeLeftHours <= 48 && timeLeftHours > 24 && !due.remindersSent.includes('48h')) {
                        console.log(`[Dues Reminder] Under 48h remaining for due ${due._id}. Sending 48h warning to ${user.name}...`);
                        
                        due.remindersSent.push('48h');
                        due.auditLogs.push({
                            action: 'REMINDER_SENT_48H',
                            details: `48-hour warning reminder email, in-app notification, and push alerts dispatched.`,
                            timestamp: now
                        });
                        await due.save();

                        // In-app alert
                        try {
                            const warningAlert = new adminMessageModel({
                                title: '⏰ 48-Hour Warning: Emergency Dues Repayment',
                                message: `Your account has an outstanding emergency due of ₹${due.amountDue}. Please repay this outstanding due within 48 hours to keep your account in good standing and avoid service suspensions.`,
                                targetType: 'specific',
                                targetIds: [user._id.toString()],
                                priority: 'high',
                                createdBy: 'System'
                            });
                            await warningAlert.save();
                        } catch (msgErr) {
                            console.error("Failed to create 48h in-app message:", msgErr.message);
                        }

                        // Send warning email
                        const mailOptions = {
                            from: process.env.SENDER_EMAIL,
                            to: user.email,
                            subject: '⏰ 48-Hour Payment Reminder: Emergency Dues - PawVaidya',
                            html: `
                                <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #ffc107; border-radius: 8px;">
                                    <h2 style="color: #d39e00; text-align: center;">⏰ 48-HOUR PAYMENT REMINDER: EMERGENCY DUES</h2>
                                    <p>Dear <strong>${user.name}</strong>,</p>
                                    <p>This is an automated reminder that your account has an outstanding emergency service fee of <strong>₹${due.amountDue}</strong>.</p>
                                    <p>Please repay this due within <strong>48 hours</strong> (by ${new Date(due.dueDate).toLocaleString()}) to keep your PawVaidya account in good standing.</p>
                                    <p style="color: #856404; background-color: #fff3cd; padding: 12px; border-radius: 4px; border: 1px solid #ffeeba;">
                                        <strong>⚠️ Warning:</strong> Failure to clear outstanding dues before the deadline will trigger an automatic temporary suspension of your account, blocking you from booking new appointments, emergency services, or accessing your Paw Wallet.
                                    </p>
                                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                                    <p style="text-align: center; font-size: 14px;">Simply top up your <strong>Paw Wallet</strong> and click <strong>Repay Outstanding Dues</strong> inside your dashboard to clear it instantly.</p>
                                    <p style="color: #6c757d; font-size: 12px; text-align: center;">PawVaidya Auto-Billing Network &copy; 2026</p>
                                </div>
                            `
                        };
                        notificationQueue.enqueueMail(mailOptions);
                    }
                }
            }
        } catch (err) {
            console.error("Error in Check Emergency Late Dues & Bans cron job:", err.message);
        }
    }));

    // Interest-Free Credit Line (IFCL) Enforcement Job
    cron.schedule('*/5 * * * *', () => observeJob('Interest-Free Credit Line Enforcement', async () => {
        try {
            const now = new Date();
            const delinquentUsers = await userModel.find({
                "subscription.plan": "Obsidian",
                "creditLine.spent": { $gt: 0 },
                "creditLine.repaymentDeadline": { $lte: now },
                "creditLine.status": "Active"
            });

            if (delinquentUsers.length > 0) {
                console.log(`[Credit Line Enforcement] Found ${delinquentUsers.length} delinquent users. Suspending credit lines...`);
                for (const user of delinquentUsers) {
                    user.creditLine.status = 'Suspended';
                    await user.save();

                    // Create in-app system notification message
                    try {
                        await adminMessageModel.create({
                            title: "⚠️ Obsidian Credit Line Suspended",
                            message: `Your Obsidian Interest-Free Credit Line has been suspended due to non-payment of ₹${user.creditLine.spent} by the deadline. Please repay immediately to restore access.`,
                            sender: "System",
                            receivers: [user.email],
                            createdAt: new Date(),
                            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        });
                    } catch (msgErr) {
                        console.error("Failed to create delinquent credit system message:", msgErr.message);
                    }

                    // Send email
                    const mailOptions = {
                        from: process.env.SENDER_EMAIL,
                        to: user.email,
                        subject: '⚠️ ACTION REQUIRED: Obsidian Credit Line Suspended - PawVaidya',
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #dc3545; border-radius: 8px;">
                                <h2 style="color: #dc3545; text-align: center;">⚠️ OBSIDIAN CREDIT LINE SUSPENDED</h2>
                                <p>Dear <strong>${user.name}</strong>,</p>
                                <p>Your Obsidian Interest-Free Credit Line has been suspended because you did not repay your outstanding balance of <strong>₹${user.creditLine.spent}</strong> by the weekly deadline.</p>
                                <p style="color: #721c24; background-color: #f8d7da; padding: 12px; border-radius: 4px; border: 1px solid #f5c6cb;">
                                    <strong>Access Blocked:</strong> You cannot spend any more from your Credit Line, and Obsidian benefits are frozen until this balance is fully cleared.
                                </p>
                                <p>Please log in to your account, top up your Paw Wallet, and click <strong>Repay Credit Dues</strong> in the Obsidian Command Center.</p>
                                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                                <p style="color: #6c757d; font-size: 12px; text-align: center;">PawVaidya Auto-Billing Network &copy; 2026</p>
                            </div>
                        `
                    };
                    if (notificationQueue && typeof notificationQueue.enqueueMail === 'function') {
                        notificationQueue.enqueueMail(mailOptions);
                    }
                }
            }
        } catch (err) {
            console.error("Error in Interest-Free Credit Line Enforcement cron job:", err.message);
        }
    }));

    // Prune Expired Outreach Coupons and Admin Messages every minute
    cron.schedule('* * * * *', () => observeJob('Prune Expired Outreach Coupons and Messages', async () => {
        try {
            const now = new Date();
            // Delete expired specific coupons
            const deletedCoupons = await adminCouponModel.deleteMany({
                code: { $in: ['HEALTHYPET15', 'FREEWELLNESS'] },
                expiryDate: { $lte: now }
            });
            if (deletedCoupons.deletedCount > 0) {
                console.log(`[Outreach Pruner] Deleted ${deletedCoupons.deletedCount} expired outreach coupons.`);
            }

            // Delete expired admin messages
            const deletedMessages = await adminMessageModel.deleteMany({
                expiresAt: { $lte: now }
            });
            if (deletedMessages.deletedCount > 0) {
                console.log(`[Outreach Pruner] Deleted ${deletedMessages.deletedCount} expired admin messages.`);
            }
        } catch (err) {
            console.error("Error in Prune Expired Outreach Coupons and Messages cron job:", err.message);
        }
    }));
};


export default initScheduler;
