import mongoose from 'mongoose';

const unbanRequestSchema = new mongoose.Schema({
    requesterType: {
        type: String,
        enum: ['user', 'doctor'],
        required: true
    },
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'requesterModel'
    },
    requesterModel: {
        type: String,
        enum: ['user', 'doctor'],
        required: true
    },
    requesterName: {
        type: String,
        required: true
    },
    requesterEmail: {
        type: String,
        required: true
    },
    banReason: {
        type: String,
        required: true
    },
    requestMessage: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied'],
        default: 'pending'
    },
    adminResponse: {
        type: String,
        default: ''
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: false
    },
    reviewedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const unbanRequestModel = mongoose.model('unbanrequest', unbanRequestSchema);

export default unbanRequestModel;
