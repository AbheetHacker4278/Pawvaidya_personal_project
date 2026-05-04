import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema({
    event: { type: String, required: true }, // e.g. 'status_change', 'note', 'call_scheduled'
    message: { type: String, required: true },
    by: { type: String, enum: ['user', 'employee', 'system'], default: 'system' },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const complaintTicketSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },

    category: {
        type: String,
        enum: ['doctor_complaint', 'malpractice', 'user_issue', 'billing', 'technical', 'other'],
        required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },

    status: {
        type: String,
        enum: ['open', 'in_progress', 'scheduled_call', 'resolved', 'closed'],
        default: 'open'
    },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'csEmployee', default: null },

    requestedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'csEmployee', default: null },
    requestedAt: { type: Date, default: null },
    rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'csEmployee' }],

    scheduledCall: {
        date: { type: String, default: null },
        time: { type: String, default: null },
        link: { type: String, default: null },
        notes: { type: String, default: '' }
    },

    timeline: [timelineEventSchema],

    // Rating after closure
    rating: { type: mongoose.Schema.Types.ObjectId, ref: 'csRating', default: null },
    isRated: { type: Boolean, default: false },

    isClosed: { type: Boolean, default: false },
    closedAt: { type: Date, default: null },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'csEmployee', default: null },

    // Internal employee notes
    internalNotes: { type: String, default: '' },

    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
}, { timestamps: true });

const ComplaintTicket = mongoose.models.complaintTicket || mongoose.model('complaintTicket', complaintTicketSchema);
export default ComplaintTicket;
