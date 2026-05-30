import mongoose from "mongoose";

const strayCrowdfundingSchema = new mongoose.Schema({
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    animalType: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    targetAmount: { type: Number, required: true },
    raisedAmount: { type: Number, default: 0 },
    clinicName: { type: String, required: true },
    clinicAccountId: { type: String, default: "" }, // Razorpay Route clinic account token or node
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Cancelled', 'Suspended'],
        default: 'Active'
    },
    durationDays: { type: Number, default: 14 },
    endDate: { type: Date },
    proofBillUrl: { type: String, default: "" },
    isRefunded: { type: Boolean, default: false },
    isWithdrawn: { type: Boolean, default: false },
    contributions: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        userName: { type: String, default: 'Anonymous Patron' },
        amount: { type: Number, required: true },
        paymentId: { type: String, required: true },
        date: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Create the 2dsphere geospatial index
strayCrowdfundingSchema.index({ location: '2dsphere' });

const strayCrowdfundingModel = mongoose.models.strayCrowdfunding || mongoose.model("strayCrowdfunding", strayCrowdfundingSchema);

export default strayCrowdfundingModel;
