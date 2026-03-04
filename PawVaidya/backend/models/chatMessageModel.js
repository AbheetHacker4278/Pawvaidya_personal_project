import mongoose from "mongoose"

const chatMessageSchema = new mongoose.Schema({
    appointmentId: { type: String, required: true },
    senderId: { type: String, required: true },
    senderType: { type: String, enum: ['user', 'doctor'], required: true },
    message: { type: String, default: '' },
    messageType: { type: String, enum: ['text', 'image', 'video', 'file'], default: 'text' },
    fileUrl: { type: String, default: null },
    fileName: { type: String, default: null },
    fileSize: { type: Number, default: null },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
})

const chatMessageModel = mongoose.models.chatMessage || mongoose.model("chatMessage", chatMessageSchema)
export default chatMessageModel
