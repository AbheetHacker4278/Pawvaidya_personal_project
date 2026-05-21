import mongoose from 'mongoose';

const userMisbehaviorReportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'csEmployee', required: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'complaintTicket', default: null },
    reason: { type: String, required: true },
    evidence: { type: String, default: '' }, // Can be chat snippets or links
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
    adminAction: { type: String, default: '' },
    adminFeedbackToAgent: { type: String, default: '' }, // Feedback/Instructions for the CS agent
    actionTakenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'admin', default: null },
}, { timestamps: true });

const UserMisbehaviorReport = mongoose.models.userMisbehaviorReport || mongoose.model('userMisbehaviorReport', userMisbehaviorReportSchema);

export default UserMisbehaviorReport;
