import adminCouponModel from "../models/adminCouponModel.js";
import { logActivity } from "../utils/activityLogger.js";

// Add a new global coupon (Admin Only)
export const createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, minAmount, maxDiscount, expiryDate, usageLimit } = req.body;

        if (!code || !discountType || !discountValue || !expiryDate) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        const existingCoupon = await adminCouponModel.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.json({ success: false, message: "Coupon code already exists" });
        }

        const newCoupon = new adminCouponModel({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minAmount,
            maxDiscount,
            expiryDate,
            usageLimit
        });

        await newCoupon.save();
        await logActivity(req.admin?.id || 'master', 'admin', 'coupon_create', `Created coupon ${code.toUpperCase()}`, req);

        res.json({ success: true, message: "Coupon created successfully", coupon: newCoupon });
    } catch (error) {
        console.error("Error creating coupon:", error);
        res.json({ success: false, message: error.message });
    }
};

// Get all coupons (Admin Only for management)
export const getAllCoupons = async (req, res) => {
    try {
        const coupons = await adminCouponModel.find({}).sort({ createdAt: -1 });
        res.json({ success: true, coupons });
    } catch (error) {
        console.error("Error fetching coupons:", error);
        res.json({ success: false, message: error.message });
    }
};

// Toggle coupon status (Admin Only)
export const toggleCouponStatus = async (req, res) => {
    try {
        const { couponId } = req.body;
        const coupon = await adminCouponModel.findById(couponId);
        if (!coupon) {
            return res.json({ success: false, message: "Coupon not found" });
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        res.json({ success: true, message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`, isActive: coupon.isActive });
    } catch (error) {
        console.error("Error toggling coupon:", error);
        res.json({ success: false, message: error.message });
    }
};

// Delete coupon (Admin Only)
export const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.body;
        const coupon = await adminCouponModel.findByIdAndDelete(couponId);
        if (!coupon) {
            return res.json({ success: false, message: "Coupon not found" });
        }

        await logActivity(req.admin?.id || 'master', 'admin', 'coupon_delete', `Deleted coupon ${coupon.code}`, req);
        res.json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        res.json({ success: false, message: error.message });
    }
};

// Validate coupon for user (Public/User)
export const validateAdminCoupon = async (req, res) => {
    try {
        const { code, amount } = req.body;
        if (!code) {
            return res.json({ success: false, message: "Coupon code is required" });
        }

        const coupon = await adminCouponModel.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) {
            return res.json({ success: false, message: "Invalid or inactive coupon" });
        }

        if (new Date(coupon.expiryDate) < new Date()) {
            return res.json({ success: false, message: "Coupon has expired" });
        }

        if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
            return res.json({ success: false, message: "Coupon usage limit reached" });
        }

        if (amount < coupon.minAmount) {
            return res.json({ success: false, message: `Minimum amount of ${coupon.minAmount} required` });
        }

        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (amount * coupon.discountValue) / 100;
            if (coupon.maxDiscount) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        } else {
            discount = coupon.discountValue;
        }

        res.json({
            success: true,
            message: "Coupon is valid",
            discountDetails: {
                code: coupon.code,
                discountAmount: Math.round(discount),
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                originalFee: amount,
                discountedFee: Math.round(Math.max(0, amount - discount))
            }
        });
    } catch (error) {
        console.error("Error validating coupon:", error);
        res.json({ success: false, message: error.message });
    }
};

// Get all active coupons for users (Public/User)
export const getActiveAdminCoupons = async (req, res) => {
    try {
        const coupons = await adminCouponModel.find({
            isActive: true,
            expiryDate: { $gte: new Date() }
        }).select('code discountType discountValue minAmount maxDiscount expiryDate usedCount usageLimit');

        // Filter out coupons that have reached usage limit
        const availableCoupons = coupons.filter(c => c.usageLimit === 0 || c.usedCount < c.usageLimit);

        res.json({ success: true, coupons: availableCoupons });
    } catch (error) {
        console.error("Error fetching active coupons:", error);
        res.json({ success: false, message: error.message });
    }
};
