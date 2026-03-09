import mongoose from 'mongoose';

const bannedIpSchema = new mongoose.Schema({
    ipAddress: { type: String, required: true, unique: true },
    reason: { type: String, default: '' },
    bannedBy: { type: String, default: null }, // Admin ID
    bannedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null }, // null = permanent
    isActive: { type: Boolean, default: true },
    associatedUserId: { type: String, default: null },
    associatedUserType: { type: String, default: null },
}, { timestamps: true });

const bannedIpModel = mongoose.models.bannedIp ||
    mongoose.model('bannedIp', bannedIpSchema);

export default bannedIpModel;
