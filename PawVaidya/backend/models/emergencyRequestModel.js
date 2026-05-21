import mongoose from "mongoose";

const emergencyRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    docId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor',
        default: null
    },
    petId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'pet',
        default: null
    },
    isStray: {
        type: Boolean,
        default: false
    },
    strayDetails: {
        petType: { type: String, default: "" },
        location: { type: String, default: "" },
        description: { type: String, default: "" }
    },
    emergencyType: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Waiting for Doctor Approval', 'Approved', 'Rejected', 'Payment Pending', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    amount: {
        type: Number,
        required: true,
        default: 500
    },
    paymentDetails: {
        paymentId: { type: String, default: null },
        orderId: { type: String, default: null },
        paymentMethod: { type: String, default: "Cash" },
        paidAt: { type: Date, default: null },
        status: { type: String, enum: ['Unpaid', 'Paid', 'Refunded'], default: 'Unpaid' }
    },
    paymentLogs: [{
        amount: { type: Number, required: true },
        transactionId: { type: String, default: null },
        method: { type: String, default: "Cash" },
        status: { type: String, enum: ['Success', 'Failed', 'Refunded'], required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    approvalRecords: [{
        action: { type: String, enum: ['Approved', 'Rejected'], required: true },
        actorId: { type: mongoose.Schema.Types.ObjectId, required: true },
        actorType: { type: String, enum: ['doctor', 'admin'], required: true },
        reason: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now }
    }],
    statusHistory: [{
        status: { type: String, required: true },
        updatedBy: { type: String, required: true }, // e.g. 'user', 'doctor', 'admin'
        updatedById: { type: mongoose.Schema.Types.ObjectId, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    attachments: [{
        url: { type: String },
        name: { type: String },
        uploadedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Production-grade performance-critical indexing
emergencyRequestSchema.index({ status: 1, district: 1 });
emergencyRequestSchema.index({ userId: 1, status: 1 });
emergencyRequestSchema.index({ docId: 1, status: 1 });
emergencyRequestSchema.index({ createdAt: -1 });

const emergencyRequestModel = mongoose.models.emergencyRequest || mongoose.model("emergencyRequest", emergencyRequestSchema);
export default emergencyRequestModel;
