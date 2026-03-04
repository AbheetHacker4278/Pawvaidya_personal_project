import mongoose from "mongoose";

const directMessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderModel: { type: String, required: true, enum: ['Admin', 'Doctor'] },
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
    receiverModel: { type: String, required: true, enum: ['Admin', 'Doctor'] },
    message: { type: String, default: '' },
    fileUrl: { type: String, default: null },
    fileType: { type: String, enum: ['image', 'video', 'file', null], default: null },
    fileName: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});

const directMessageModel = mongoose.models.directMessage || mongoose.model("directMessage", directMessageSchema);
export default directMessageModel;
