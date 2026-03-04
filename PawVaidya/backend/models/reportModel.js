import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    reporterType: {
        type: String,
        enum: ['user', 'doctor'],
        required: true
    },
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'reporterModel'
    },
    reporterModel: {
        type: String,
        required: true,
        enum: ['user', 'doctor']
    },
    reportedType: {
        type: String,
        enum: ['user', 'doctor'],
        required: true
    },
    reportedId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        refPath: 'reportedModel'
    },
    reportedModel: {
        type: String,
        required: false,
        enum: ['user', 'doctor']
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'appointment',
        required: false
    },
    blogId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'blogModel',
        required: false
    },
    reason: {
        type: String,
        required: true,
        enum: [
            'inappropriate_behavior',
            'harassment',
            'unprofessional_conduct',
            'fake_profile',
            'spam',
            'no_show',
            'payment_issue',
            'medical_malpractice',
            'privacy_violation',
            'inappropriate_content',
            'copyright_violation',
            'medical_misinformation',
            'other'
        ]
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    evidence: {
        type: [String], // Array of URLs (screenshots, documents)
        default: []
    },
    status: {
        type: String,
        enum: ['pending', 'under_review', 'resolved', 'dismissed'],
        default: 'pending'
    },
    adminNotes: {
        type: String,
        default: ''
    },
    actionTaken: {
        type: String,
        enum: ['none', 'warning', 'temporary_ban', 'permanent_ban', 'account_suspended', 'post_deleted'],
        default: 'none'
    },
    reviewedBy: {
        type: String,
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isTrashed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for faster queries
reportSchema.index({ reporterId: 1, reportedId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ reportedId: 1, status: 1 });

const reportModel = mongoose.model('reportModel', reportSchema);

export default reportModel;
