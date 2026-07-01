import mongoose from "mongoose";

const adminCouponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true },
    minAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null }, // Only for percentage
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usageLimit: { type: Number, default: 0 }, // 0 for unlimited
    usedCount: { type: Number, default: 0 },
    recipientEmails: { type: [String], default: [] },
    generatedBy: { type: String, default: null },
    generationReason: { type: String, default: '' },
    ticketId: { type: String, default: null },
    compensationType: { type: String, enum: ['refund', 'gifted', null], default: null },
    createdAt: { type: Date, default: Date.now }
});

const adminCouponModel = mongoose.models.adminCoupon || mongoose.model("adminCoupon", adminCouponSchema);
export default adminCouponModel;
