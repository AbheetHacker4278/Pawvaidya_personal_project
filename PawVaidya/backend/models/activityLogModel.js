import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    userId: { type: String, default: null }, // Can be user, doctor or admin ID
    userType: { type: String, enum: ['user', 'doctor', 'admin'], required: true }, // 'user', 'doctor' or 'admin'
    activityType: { type: String, required: true }, // 'login', 'logout', 'page_view', 'action', etc.
    activityDescription: { type: String, required: true }, // Detailed description
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' }, // Browser/device info
    metadata: { type: Object, default: {} }, // Additional data
    faceImage: { type: String, default: '' }, // URL/Base64 of the face image if login via face
}, { timestamps: true });

// Index for faster queries
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ userType: 1, timestamp: -1 });

const activityLogModel = mongoose.models.activityLog || mongoose.model('activityLog', activityLogSchema);

export default activityLogModel;

