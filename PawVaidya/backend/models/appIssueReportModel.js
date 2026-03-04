import mongoose from 'mongoose';

const appIssueReportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    category: {
        type: String,
        required: true,
        enum: ['UI', 'Bug', 'Performance', 'Feature Request', 'Other'],
        default: 'Bug'
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    },
    adminNotes: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const appIssueReportModel = mongoose.models.appIssueReport || mongoose.model('appIssueReport', appIssueReportSchema);

export default appIssueReportModel;
