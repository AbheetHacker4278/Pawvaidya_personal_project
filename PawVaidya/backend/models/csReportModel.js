import mongoose from 'mongoose';

const csReportSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'csEmployee', required: true },
    employeeName: { type: String, default: '' },
    employeeEmail: { type: String, default: '' },
    period: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
    periodLabel: { type: String, default: '' }, // e.g. "Week of Apr 21–27, 2026"
    reportData: {
        totalTicketsHandled: { type: Number, default: 0 },
        ticketsResolved: { type: Number, default: 0 },
        ticketsClosed: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        totalRatings: { type: Number, default: 0 },
        loginDays: { type: Number, default: 0 },
        totalLoginMinutes: { type: Number, default: 0 },
        topReviews: [{ rating: Number, review: String, ticketId: String }],
        callsScheduled: { type: Number, default: 0 },
        rewards: [{ rewardType: String, value: String, message: String }]
    },
    generatedAt: { type: Date, default: Date.now },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null }
}, { timestamps: false });

const CSReport = mongoose.models.csReport || mongoose.model('csReport', csReportSchema);
export default CSReport;
