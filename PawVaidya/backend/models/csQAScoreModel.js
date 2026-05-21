import mongoose from 'mongoose';

const csQAScoreSchema = new mongoose.Schema({
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'complaintTicket', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'csEmployee', required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'admin' },
    
    score: { type: Number, required: true, min: 0, max: 100 }, // QA Score percentage
    feedback: { type: String, default: '' },
    
    // Key Performance Indicators scored by Admin
    kpis: {
        communication: { type: Number, min: 0, max: 10 },
        technicalKnowledge: { type: Number, min: 0, max: 10 },
        empathy: { type: Number, min: 0, max: 10 },
        resolutionQuality: { type: Number, min: 0, max: 10 }
    },

    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const CSQAScore = mongoose.models.csQAScore || mongoose.model('csQAScore', csQAScoreSchema);
export default CSQAScore;
