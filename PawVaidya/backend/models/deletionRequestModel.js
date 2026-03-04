import mongoose from "mongoose";

const deletionRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    adminNote: { type: String, default: "" }
});

const deletionRequestModel = mongoose.models.deletionRequest || mongoose.model('deletionRequest', deletionRequestSchema);

export default deletionRequestModel;
