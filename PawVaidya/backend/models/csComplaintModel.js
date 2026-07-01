import mongoose from 'mongoose';

const csComplaintSchema = new mongoose.Schema({
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'csEmployee', required: true },
    reporterName: { type: String, required: true },
    targetAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'csEmployee', required: true },
    targetAgentName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' }
}, { timestamps: true });

const CSComplaint = mongoose.models.csComplaint || mongoose.model('csComplaint', csComplaintSchema);

export default CSComplaint;
