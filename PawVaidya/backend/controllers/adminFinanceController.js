import appointmentModel from "../models/appointmentModel.js";
import subscriptionModel from "../models/subscriptionModel.js";
import adminCouponModel from "../models/adminCouponModel.js";
import doctorModel from "../models/doctorModel.js";

// Get Comprehensive Financial Data for Admin
const getFinancialCalculations = async (req, res) => {
    try {
        // 1. Fetch all required data
        const appointments = await appointmentModel.find({ payment: true });
        const subscriptions = await subscriptionModel.find({ status: 'Active' });
        const adminCoupons = await adminCouponModel.find({ isActive: true });
        const doctors = await doctorModel.find({}, 'name discounts');

        // 2. Booking Earnings & Breakdown
        let totalBookingEarnings = 0;
        const bookingBreakdown = appointments.map(app => {
            const earnings = app.amount;
            totalBookingEarnings += earnings;
            
            return {
                id: app._id,
                user: app.userData.name,
                doctor: app.docData.name,
                originalFee: app.discountApplied?.originalFee || app.amount,
                finalFee: app.amount,
                discount: app.discountApplied ? {
                    code: app.discountApplied.code,
                    value: app.discountApplied.discountValue,
                    type: app.discountApplied.discountType
                } : null,
                adminDiscount: app.adminDiscountApplied ? app.adminDiscountApplied.amount : 0,
                paymentMethod: app.paymentMethod,
                timestamp: app.date
            };
        });

        // 3. Subscription Earnings & Loss from Gifted
        let totalSubscriptionEarnings = 0;
        let totalGiftedLoss = 0;
        const allSubscriptions = await subscriptionModel.find({});
        
        allSubscriptions.forEach(sub => {
            if (sub.isGift) {
                totalGiftedLoss += sub.amount;
            } else {
                // Count all sold subscriptions that are not pending
                // If cancelled but not refunded, it's still revenue
                // If refunded, subtract the refund amount
                if (sub.status !== 'Pending') {
                    const netAmount = sub.amount - (sub.refundAmount || 0);
                    totalSubscriptionEarnings += netAmount;
                }
            }
        });

        // 4. Discount Analysis
        let activeAdminDiscountsCount = adminCoupons.length;
        let activeDoctorDiscountsCount = 0;
        let projectedAdminDiscountLoss = 0;

        // Count doctor discounts
        doctors.forEach(doc => {
            if (doc.discounts) {
                doc.discounts.forEach(d => {
                    if (d.isActive && (!d.expiresAt || new Date(d.expiresAt) > new Date())) {
                        activeDoctorDiscountsCount++;
                    }
                });
            }
        });

        // Calculate continuous loss from admin coupons (based on current usage rate or projected)
        // For simplicity, we'll calculate loss incurred so far by active admin coupons
        let adminCouponLossSoFar = 0;
        appointments.forEach(app => {
            if (app.adminDiscountApplied) {
                adminCouponLossSoFar += app.adminDiscountApplied.amount;
            }
        });

        // Projected loss (if we want to show potential loss until expiry)
        // This is tricky without knowing expected usage, but we can show "Loss Incurred via Active Campaigns"
        projectedAdminDiscountLoss = adminCouponLossSoFar;

        // Breakdown of subscription sales
        const subscriptionBreakdown = allSubscriptions
            .filter(sub => !sub.isGift && sub.status !== 'Pending')
            .map(sub => ({
                id: sub._id,
                plan: sub.plan,
                amount: sub.amount,
                refunded: sub.refunded,
                refundAmount: sub.refundAmount || 0,
                netAmount: sub.amount - (sub.refundAmount || 0),
                status: sub.status,
                paymentMethod: sub.paymentMethod,
                timestamp: sub.createdAt
            }));

        res.json({
            success: true,
            data: {
                summary: {
                    totalEarnings: totalBookingEarnings + totalSubscriptionEarnings,
                    bookingEarnings: totalBookingEarnings,
                    subscriptionEarnings: totalSubscriptionEarnings,
                    totalLoss: totalGiftedLoss + adminCouponLossSoFar,
                    giftedSubscriptionLoss: totalGiftedLoss,
                    adminCouponLoss: adminCouponLossSoFar
                },
                breakdown: bookingBreakdown,
                subscriptionBreakdown: subscriptionBreakdown,
                discounts: {
                    activeAdminCount: activeAdminDiscountsCount,
                    activeDoctorCount: activeDoctorDiscountsCount,
                    adminCoupons: adminCoupons.map(c => ({
                        code: c.code,
                        value: c.discountValue,
                        type: c.discountType,
                        expiry: c.expiryDate,
                        used: c.usedCount
                    }))
                }
            }
        });

    } catch (error) {
        console.error("Finance Error:", error);
        res.json({ success: false, message: error.message });
    }
};

export { getFinancialCalculations };
