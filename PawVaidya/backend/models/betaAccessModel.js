import mongoose from 'mongoose';

const betaAccessSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userSubscription: {
        type: String,
        default: 'None'
    },
    featureId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'betafeature',
        required: true
    },
    featureName: {
        type: String,
        required: true
    },
    motivation: {
        type: String,
        required: true,
        maxlength: 600
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminNote: {
        type: String,
        default: ''
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: false
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index: one application per user per feature
betaAccessSchema.index({ userId: 1, featureId: 1 }, { unique: true });

const betaAccessModel = mongoose.model('betaaccess', betaAccessSchema);
export default betaAccessModel;
