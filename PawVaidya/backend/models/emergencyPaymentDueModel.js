import mongoose from "mongoose";

const emergencyPaymentDueSchema = new mongoose.Schema({
    requestId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'emergencyRequest', 
        required: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', 
        required: true 
    },
    amountDue: { 
        type: Number, 
        required: true, 
        default: 100 
    },
    dueDate: { 
        type: Date, 
        required: true 
    },
        isPaid: { 
        type: Boolean, 
        default: false 
    },
    paidAt: { 
        type: Date, 
        default: null 
    },
    auditLogs: [{
        action: { type: String, required: true },
        details: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now }
    }],
    remindersSent: {
        type: [String],
        default: []
    }
}, { timestamps: true });

// Production-grade performance-critical indexing
emergencyPaymentDueSchema.index({ isPaid: 1, dueDate: 1 });
emergencyPaymentDueSchema.index({ userId: 1, isPaid: 1 });

const emergencyPaymentDueModel = mongoose.models.emergencyPaymentDue || mongoose.model("emergencyPaymentDue", emergencyPaymentDueSchema);
export default emergencyPaymentDueModel;
