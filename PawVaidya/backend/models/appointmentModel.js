
import mongoose from "mongoose"

const appointmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    docId: { type: String, required: true },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    userData: { type: Object, required: true },
    docData: { type: Object, required: true },
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'pet', default: null },
    isStray: { type: Boolean, default: false },
    strayDetails: {
        type: {
            petType: String,
            location: String,
            notes: String
        },
        default: null
    },
    amount: { type: Number, required: true },
    date: { type: Number, required: true },
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
    paymentMethod: { type: String, default: "Cash" },
    walletDeduction: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    discountApplied: {
        type: {
            code: String,
            discountType: String,
            discountValue: Number,
            originalFee: Number,
            finalFee: Number
        },
        default: null
    },
    adminDiscountApplied: {
        type: {
            code: String,
            amount: Number
        },
        default: null
    },
    // Rating
    isRated: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    // Payment IDs
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null }
})

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema)
export default appointmentModel
