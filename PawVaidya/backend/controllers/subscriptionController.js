import userModel from "../models/userModel.js";
import subscriptionModel from "../models/subscriptionModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { transporter } from "../config/nodemailer.js";
import { SUBSCRIPTION_SUCCESS_TEMPLATE } from "../mailservice/subscriptionTemplates.js";
import redis from "../config/redis.js";

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Subscription Plan Details
const SUBSCRIPTION_PLANS = {
    Silver: {
        price: 599,
        features: ["Priority Booking", "10% Appointment Discount", "Unlimited Free Emergency Bookings", "Basic Support"],
        billingCycle: "Monthly"
    },
    Gold: {
        price: 699,
        features: ["Unlimited Appointments", "20% Appointment Discount", "Free Video Consultation", "Unlimited Free Emergency Bookings", "Standard Support"],
        billingCycle: "Monthly"
    },
    Platinum: {
        price: 999,
        features: ["Everything in Gold", "30% Appointment Discount", "Personal Pet Caregiver", "Unlimited Free Emergency Bookings", "24/7 Priority Support"],
        billingCycle: "Monthly"
    }
};

// @desc    Get all subscription plans
// @route   GET /api/subscription/plans
export const getSubscriptionPlans = async (req, res) => {
    try {
        res.json({ success: true, plans: SUBSCRIPTION_PLANS });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create Razorpay order for subscription
// @route   POST /api/subscription/create-order
// Function to clean up expired (24h) accepted/approved Obsidian subscription requests
export const cleanupExpiredApprovals = async () => {
    try {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        // Find subscriptions with plan 'Obsidian', status 'Approved', where approvedAt is older than 24h
        const expiredSubs = await subscriptionModel.find({
            plan: 'Obsidian',
            status: 'Approved',
            approvedAt: { $lte: twentyFourHoursAgo }
        });
        
        if (expiredSubs.length > 0) {
            console.log(`[Obsidian Pruner] Found ${expiredSubs.length} expired Obsidian approvals. Processing cancellation...`);
            for (const sub of expiredSubs) {
                sub.status = 'Cancelled';
                sub.cancellationReason = 'Payment window expired (24-hour limit exceeded)';
                await sub.save();
                
                // Update User
                const user = await userModel.findById(sub.userId);
                if (user && user.subscription && user.subscription.plan === 'Obsidian' && user.subscription.status === 'Approved') {
                    user.subscription = {
                        plan: 'None',
                        status: 'None',
                        expiryDate: null,
                        approvedAt: null
                    };
                    await user.save();
                    
                    // Invalidate Cache
                    if (redis) await redis.del(`user_profile_${user._id}`);
                    
                    // Send Expiry Notification Email
                    const mailOptions = {
                        from: process.env.SENDER_EMAIL,
                        to: user.email,
                        subject: 'Obsidian Signature Pass Request: Payment Period Expired',
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px dashed #dc3545; border-radius: 8px;">
                                <h2 style="color: #dc3545; text-align: center;">⚠️ PAYMENT WINDOW EXPIRED</h2>
                                <p>Dear <strong>${user.name}</strong>,</p>
                                <p>Your approved application request for the <strong>PawVaidya Obsidian Signature Pass</strong> has been automatically cancelled because the payment was not completed within the required 24-hour grace period.</p>
                                <p>If you still wish to obtain the pass, you will need to submit a new request to the administrators.</p>
                                <p>Best regards,<br/>The PawVaidya Admin Team</p>
                            </div>
                        `
                    };
                    try {
                        await transporter.sendMail(mailOptions);
                    } catch (emailError) {
                        console.error("Failed to send subscription timeout email:", emailError.message);
                    }
                }
            }
        }
    } catch (err) {
        console.error("Error in cleanupExpiredApprovals:", err.message);
    }
};

// @desc    Create Razorpay order for subscription
// @route   POST /api/subscription/create-order
export const createSubscriptionOrder = async (req, res) => {
    try {
        const { userId, planName } = req.body;
        
        let finalPrice = 0;
        let plan = {};

        if (planName === 'Obsidian') {
            await cleanupExpiredApprovals();
            const pendingSub = await subscriptionModel.findOne({
                userId,
                plan: 'Obsidian',
                status: 'Approved'
            });
            
            if (!pendingSub) {
                return res.json({ success: false, message: "No approved Obsidian Signature Pass request found. Please wait for Admin approval." });
            }

            // Verify payment window duration
            const now = new Date();
            const twentyFourHours = 24 * 60 * 60 * 1000;
            if (now.getTime() - pendingSub.approvedAt.getTime() > twentyFourHours) {
                // Manually trigger cleanup for this specific sub
                pendingSub.status = 'Cancelled';
                pendingSub.cancellationReason = 'Payment window expired (24-hour limit exceeded)';
                await pendingSub.save();

                const user = await userModel.findById(userId);
                if (user) {
                    user.subscription = { plan: 'None', status: 'None', expiryDate: null, approvedAt: null };
                    await user.save();
                }
                if (redis) await redis.del(`user_profile_${userId}`);

                return res.json({ success: false, message: "Your approval has expired. The 24-hour payment window has passed." });
            }

            finalPrice = pendingSub.amount;
            plan = { price: finalPrice, features: ["PawVaidya Obsidian Signature Pass"], billingCycle: "Custom" };
        } else {
            plan = SUBSCRIPTION_PLANS[planName];
            finalPrice = plan.price;

            const user = await userModel.findById(userId);
            if (user && user.subscription && user.subscription.plan !== 'None') {
                const currentPlan = SUBSCRIPTION_PLANS[user.subscription.plan];
                if (currentPlan && plan.price > currentPlan.price) {
                    finalPrice = plan.price - currentPlan.price;
                }
            }
        }

        const options = {
            amount: finalPrice * 100, // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `sub_${Date.now()}`,
        };

        const order = await razorpayInstance.orders.create(options);

        res.json({ success: true, order, plan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify Razorpay payment and update subscription
// @route   POST /api/subscription/verify-payment
export const verifySubscriptionPayment = async (req, res) => {
    try {
        const { userId, planName, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        if (generated_signature === razorpay_signature) {
            let finalPrice = 0;
            let expiryDate;

            if (planName === 'Obsidian') {
                const pendingSub = await subscriptionModel.findOne({
                    userId,
                    plan: 'Obsidian',
                    status: 'Approved'
                });

                if (!pendingSub) {
                    return res.json({ success: false, message: "No approved Obsidian Signature Pass request found" });
                }

                finalPrice = pendingSub.amount;
                expiryDate = pendingSub.expiryDate;

                // Update active subscription
                pendingSub.status = 'Active';
                pendingSub.startDate = new Date();
                pendingSub.razorpayOrderId = razorpay_order_id;
                pendingSub.razorpayPaymentId = razorpay_payment_id;
                pendingSub.paymentMethod = 'Razorpay';
                await pendingSub.save();

                // Update User
                const user = await userModel.findById(userId);

                // Find active non-Obsidian subscription and cancel it
                const activeOldSub = await subscriptionModel.findOne({
                    userId,
                    plan: { $in: ['Silver', 'Gold', 'Platinum'] },
                    status: 'Active'
                });

                let oldSubscriptionPlan = null;
                if (activeOldSub) {
                    oldSubscriptionPlan = activeOldSub.plan;
                    activeOldSub.status = 'Cancelled';
                    activeOldSub.cancellationReason = 'Upgraded to Obsidian Signature Pass';
                    await activeOldSub.save();
                }

                user.subscription = {
                    plan: 'Obsidian',
                    status: 'Active',
                    expiryDate: expiryDate
                };
                await user.save();

                // Dynamically assign Dedicated Veterinary Care Officer (VCO) based on user location
                try {
                    const { assignVcoToUser } = await import("./obsidianController.js");
                    await assignVcoToUser(user);
                } catch (vcoErr) {
                    console.error("VCO Assignment failed during payment verification:", vcoErr);
                }

                // Send Cancellation Mail to User for the prior tier
                if (oldSubscriptionPlan) {
                    const cancellationMailOptions = {
                        from: process.env.SENDER_EMAIL,
                        to: user.email,
                        subject: `Cancellation of your PawVaidya ${oldSubscriptionPlan} Membership`,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1.5px solid #dc3545; border-radius: 8px;">
                                <h2 style="color: #dc3545; text-align: center;">Subscription Transition Confirmation</h2>
                                <p>Dear <strong>${user.name}</strong>,</p>
                                <p>We are writing to confirm that your previous <strong>PawVaidya ${oldSubscriptionPlan} Membership</strong> has been deactivated.</p>
                                <p><strong>Reason for cancellation:</strong> Upgraded to the elite <strong>Obsidian Signature Pass</strong>.</p>
                                <p>All active services, diagnostics, and priorities associated with the ${oldSubscriptionPlan} plan have been successfully transitioned into your new Obsidian privileges.</p>
                                <p>Thank you for choosing PawVaidya for your pet's premium health and care journey.</p>
                                <p>Best regards,<br/>The PawVaidya Admin Team</p>
                            </div>
                        `
                    };
                    try {
                        await transporter.sendMail(cancellationMailOptions);
                    } catch (emailError) {
                        console.error("Failed to send prior subscription cancellation email:", emailError.message);
                    }
                }
            } else {
                const plan = SUBSCRIPTION_PLANS[planName];
                expiryDate = new Date();
                expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month validity

                const user = await userModel.findById(userId);
                finalPrice = plan.price;

                if (user && user.subscription && user.subscription.plan !== 'None') {
                    const currentPlan = SUBSCRIPTION_PLANS[user.subscription.plan];
                    if (currentPlan && plan.price > currentPlan.price) {
                        finalPrice = plan.price - currentPlan.price;
                    }
                }

                // Update User Model
                await userModel.findByIdAndUpdate(userId, {
                    'subscription.plan': planName,
                    'subscription.status': 'Active',
                    'subscription.expiryDate': expiryDate
                });

                // Create Subscription History Record
                const newSubscription = new subscriptionModel({
                    userId,
                    plan: planName,
                    amount: finalPrice,
                    status: 'Active',
                    startDate: new Date(),
                    expiryDate: expiryDate,
                    paymentMethod: 'Razorpay',
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id
                });
                await newSubscription.save();
            }

            // Invalidate the user profile cache so the frontend updates immediately
            if (redis) await redis.del(`user_profile_${userId}`);

            // Send Success Email
            const updatedUser = await userModel.findById(userId);
            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: updatedUser.email,
                subject: `Welcome to PawPlan ${planName}!`,
                html: SUBSCRIPTION_SUCCESS_TEMPLATE
                    .replace(/{userName}/g, updatedUser.name)
                    .replace(/{planName}/g, planName)
                    .replace(/{amount}/g, finalPrice)
                    .replace(/{startDate}/g, new Date().toLocaleDateString())
                    .replace(/{expiryDate}/g, expiryDate.toLocaleDateString())
                    .replace(/{paymentMethod}/g, 'Razorpay')
            };

            try {
                await transporter.sendMail(mailOptions);
            } catch (emailError) {
                console.error("Failed to send subscription success email:", emailError.message);
            }

            res.json({ success: true, message: "Subscription activated successfully" });
        } else {
            res.json({ success: false, message: "Payment verification failed" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Subscribe via Wallet Balance
// @route   POST /api/subscription/wallet-subscribe
export const subscribeViaWallet = async (req, res) => {
    try {
        const { userId, planName } = req.body;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        let finalPrice = 0;
        let expiryDate;
        let pendingSub = null;

        if (planName === 'Obsidian') {
            await cleanupExpiredApprovals();
            pendingSub = await subscriptionModel.findOne({
                userId,
                plan: 'Obsidian',
                status: 'Approved'
            });

            if (!pendingSub) {
                return res.json({ success: false, message: "No approved Obsidian Signature Pass request found. Please wait for Admin approval." });
            }

            // Verify payment window duration
            const now = new Date();
            const twentyFourHours = 24 * 60 * 60 * 1000;
            if (now.getTime() - pendingSub.approvedAt.getTime() > twentyFourHours) {
                // Manually trigger cleanup for this specific sub
                pendingSub.status = 'Cancelled';
                pendingSub.cancellationReason = 'Payment window expired (24-hour limit exceeded)';
                await pendingSub.save();

                user.subscription = { plan: 'None', status: 'None', expiryDate: null, approvedAt: null };
                await user.save();
                if (redis) await redis.del(`user_profile_${userId}`);

                return res.json({ success: false, message: "Your approval has expired. The 24-hour payment window has passed." });
            }

            finalPrice = pendingSub.amount;
            expiryDate = pendingSub.expiryDate;
        } else {
            const plan = SUBSCRIPTION_PLANS[planName];
            finalPrice = plan.price;
            if (user.subscription && user.subscription.plan !== 'None') {
                const currentPlan = SUBSCRIPTION_PLANS[user.subscription.plan];
                if (currentPlan && plan.price > currentPlan.price) {
                    finalPrice = plan.price - currentPlan.price;
                }
            }
            expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);
        }

        if (user.pawWallet < finalPrice) {
            return res.json({ success: false, message: `Insufficient wallet balance. You need ₹${finalPrice} but have ₹${user.pawWallet}` });
        }

        let oldSubscriptionPlan = null;
        if (planName === 'Obsidian') {
            // Find active non-Obsidian subscription and cancel it
            const activeOldSub = await subscriptionModel.findOne({
                userId,
                plan: { $in: ['Silver', 'Gold', 'Platinum'] },
                status: 'Active'
            });

            if (activeOldSub) {
                oldSubscriptionPlan = activeOldSub.plan;
                activeOldSub.status = 'Cancelled';
                activeOldSub.cancellationReason = 'Upgraded to Obsidian Signature Pass';
                await activeOldSub.save();
            }
        }

        // Deduct from wallet
        user.pawWallet -= finalPrice;

        user.subscription = {
            plan: planName,
            status: 'Active',
            expiryDate: expiryDate
        };

        await user.save();

        // Dynamically assign Dedicated Veterinary Care Officer (VCO) based on user location
        if (planName === 'Obsidian') {
            try {
                const { assignVcoToUser } = await import("./obsidianController.js");
                await assignVcoToUser(user);
            } catch (vcoErr) {
                console.error("VCO Assignment failed during wallet subscription:", vcoErr);
            }
        }

        if (planName === 'Obsidian' && pendingSub) {
            pendingSub.status = 'Active';
            pendingSub.startDate = new Date();
            pendingSub.paymentMethod = 'Wallet';
            await pendingSub.save();

            // Send Cancellation Mail to User for the prior tier
            if (oldSubscriptionPlan) {
                const cancellationMailOptions = {
                    from: process.env.SENDER_EMAIL,
                    to: user.email,
                    subject: `Cancellation of your PawVaidya ${oldSubscriptionPlan} Membership`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1.5px solid #dc3545; border-radius: 8px;">
                            <h2 style="color: #dc3545; text-align: center;">Subscription Transition Confirmation</h2>
                            <p>Dear <strong>${user.name}</strong>,</p>
                            <p>We are writing to confirm that your previous <strong>PawVaidya ${oldSubscriptionPlan} Membership</strong> has been deactivated.</p>
                            <p><strong>Reason for cancellation:</strong> Upgraded to the elite <strong>Obsidian Signature Pass</strong>.</p>
                            <p>All active services, diagnostics, and priorities associated with the ${oldSubscriptionPlan} plan have been successfully transitioned into your new Obsidian privileges.</p>
                            <p>Thank you for choosing PawVaidya for your pet's premium health and care journey.</p>
                            <p>Best regards,<br/>The PawVaidya Admin Team</p>
                        </div>
                    `
                };
                try {
                    await transporter.sendMail(cancellationMailOptions);
                } catch (emailError) {
                    console.error("Failed to send prior subscription cancellation email:", emailError.message);
                }
            }
        } else {
            // Create Subscription History Record
            const newSubscription = new subscriptionModel({
                userId,
                plan: planName,
                amount: finalPrice,
                status: 'Active',
                startDate: new Date(),
                expiryDate: expiryDate,
                paymentMethod: 'Wallet'
            });
            await newSubscription.save();
        }

        // Invalidate the user profile cache so the frontend updates immediately
        if (redis) await redis.del(`user_profile_${userId}`);

        // Send Success Email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: `Welcome to PawPlan ${planName}!`,
            html: SUBSCRIPTION_SUCCESS_TEMPLATE
                .replace(/{userName}/g, user.name)
                .replace(/{planName}/g, planName)
                .replace(/{amount}/g, finalPrice)
                .replace(/{startDate}/g, new Date().toLocaleDateString())
                .replace(/{expiryDate}/g, expiryDate.toLocaleDateString())
                .replace(/{paymentMethod}/g, 'Wallet Balance')
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error("Failed to send subscription success email:", emailError.message);
        }

        res.json({ success: true, message: "Subscribed via wallet balance successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get User's Subscription Status
// @route   GET /api/subscription/status/:userId
export const getSubscriptionStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        await cleanupExpiredApprovals();
        const user = await userModel.findById(userId).select('subscription');

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, subscription: user.subscription });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Request Obsidian Signature Pass
// @route   POST /api/subscription/request-obsidian
export const requestObsidianPass = async (req, res) => {
    try {
        const { userId, duration } = req.body; // duration: '1 Month', '1 Year', 'Lifetime'

        const prices = {
            '1 Month': 49999,
            '1 Year': 550000,
            'Lifetime': 3000000
        };

        if (!prices[duration]) {
            return res.json({ success: false, message: "Invalid duration selected" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if user already has an active or pending Obsidian subscription
        const existingSub = await subscriptionModel.findOne({
            userId,
            plan: 'Obsidian',
            status: { $in: ['Active', 'Pending', 'Approved'] }
        });

        if (existingSub) {
            return res.json({ success: false, message: `You already have a ${existingSub.status} Obsidian pass request/active pass.` });
        }

        // Calculate expiry date
        const expiryDate = new Date();
        if (duration === '1 Month') {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else if (duration === '1 Year') {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else if (duration === 'Lifetime') {
            expiryDate.setFullYear(expiryDate.getFullYear() + 100); // 100 years for lifetime
        }

        // Update user model to Pending Approval state so front-ends know immediately
        // BUT do not overwrite any running active wellness subscriptions (Silver, Gold, Platinum)
        const hasActiveWellness = user.subscription &&
            ['Silver', 'Gold', 'Platinum'].includes(user.subscription.plan) &&
            user.subscription.status === 'Active';

        if (!hasActiveWellness) {
            user.subscription = {
                plan: 'Obsidian',
                status: 'Pending Approval',
                expiryDate: expiryDate
            };
            await user.save();
        }

        // Create subscription history record in Pending state
        const newSubscription = new subscriptionModel({
            userId,
            plan: 'Obsidian',
            amount: prices[duration],
            status: 'Pending',
            startDate: new Date(),
            expiryDate: expiryDate,
            paymentMethod: 'Wallet'
        });
        await newSubscription.save();

        // Invalidate the user profile cache
        if (redis) await redis.del(`user_profile_${userId}`);

        res.json({ success: true, message: "Obsidian Signature Pass request submitted to Admin successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

