import mongoose from 'mongoose';

const blacklistSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    type: { type: String, enum: ['user', 'doctor'], required: true },
    reason: { type: String, default: 'Blacklisted by admin' },
    blacklistedBy: { type: String, required: true }, // Admin ID or 'master'
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const blacklistModel = mongoose.models.blacklist || mongoose.model('blacklist', blacklistSchema);

export default blacklistModel;
