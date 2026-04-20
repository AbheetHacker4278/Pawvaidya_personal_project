import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    plan: { type: String, enum: ['Silver', 'Gold', 'Platinum'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Active', 'Expired', 'Cancelled', 'Pending', 'Revoked'], default: 'Pending' },
    startDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    paymentMethod: { type: String, enum: ['Wallet', 'Razorpay'], required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySubscriptionId: { type: String },
    isAutoRenew: { type: Boolean, default: true },
    cancellationReason: { type: String },
    refunded: { type: Boolean, default: false },
    refundAmount: { type: Number, default: 0 },
    isGift: { type: Boolean, default: false }
}, { timestamps: true });

const subscriptionModel = mongoose.models.subscription || mongoose.model('subscription', subscriptionSchema);

export default subscriptionModel;
