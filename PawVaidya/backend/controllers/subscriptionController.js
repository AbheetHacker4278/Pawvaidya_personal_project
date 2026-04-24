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
        price: 199,
        features: ["Priority Booking", "10% Appointment Discount", "Basic Support"],
        billingCycle: "Monthly"
    },
    Gold: {
        price: 499,
        features: ["Unlimited Appointments", "20% Appointment Discount", "Free Video Consultation", "Standard Support"],
        billingCycle: "Monthly"
    },
    Platinum: {
        price: 999,
        features: ["Everything in Gold", "30% Appointment Discount", "Personal Pet Caregiver", "24/7 Priority Emergency Support"],
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
export const createSubscriptionOrder = async (req, res) => {
    try {
        const { userId, planName } = req.body;
        const plan = SUBSCRIPTION_PLANS[planName];

        const user = await userModel.findById(userId);
        let finalPrice = plan.price;

        if (user && user.subscription && user.subscription.plan !== 'None') {
            const currentPlan = SUBSCRIPTION_PLANS[user.subscription.plan];
            if (currentPlan && plan.price > currentPlan.price) {
                finalPrice = plan.price - currentPlan.price;
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
            const plan = SUBSCRIPTION_PLANS[planName];
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month validity

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
                amount: plan.price,
                status: 'Active',
                startDate: new Date(),
                expiryDate: expiryDate,
                paymentMethod: 'Razorpay',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id
            });
            await newSubscription.save();

            // Invalidate the user profile cache so the frontend updates immediately
            if (redis) await redis.del(`user_profile_${userId}`);

            // Send Success Email
            const user = await userModel.findById(userId);
            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: user.email,
                subject: `Welcome to PawPlan ${planName}!`,
                html: SUBSCRIPTION_SUCCESS_TEMPLATE
                    .replace(/{userName}/g, user.name)
                    .replace(/{planName}/g, planName)
                    .replace(/{amount}/g, plan.price)
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
        const plan = SUBSCRIPTION_PLANS[planName];

        let finalPrice = plan.price;
        if (user.subscription && user.subscription.plan !== 'None') {
            const currentPlan = SUBSCRIPTION_PLANS[user.subscription.plan];
            if (currentPlan && plan.price > currentPlan.price) {
                finalPrice = plan.price - currentPlan.price;
            }
        }

        if (user.pawWallet < finalPrice) {
            return res.json({ success: false, message: "Insufficient wallet balance" });
        }

        // Deduct from wallet
        user.pawWallet -= finalPrice;

        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        user.subscription = {
            plan: planName,
            status: 'Active',
            expiryDate: expiryDate
        };

        await user.save();

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
        const user = await userModel.findById(userId).select('subscription');

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, subscription: user.subscription });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
