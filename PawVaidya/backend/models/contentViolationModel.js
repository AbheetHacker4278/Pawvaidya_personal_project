import mongoose from 'mongoose';

const contentViolationSchema = new mongoose.Schema({
    userId: { type: String, default: null },
    userType: { type: String, enum: ['user', 'doctor', 'admin', 'unknown'], default: 'unknown' },
    userDetails: {
        name: { type: String, default: 'Anonymous' },
        email: { type: String, default: 'N/A' }
    },
    content: { type: String, required: true },         // Original text that triggered the flag
    detectedWords: [{ type: String }],                  // Array of detected bad words
    url: { type: String, default: '' },
    method: { type: String, default: 'POST' },
    ipAddress: { type: String, default: '' },
    location: {
        city: { type: String, default: 'Unknown' },
        country: { type: String, default: 'Unknown' },
        latitude: { type: Number },
        longitude: { type: Number }
    },
    device: {
        browser: { type: String, default: 'Unknown' },
        browserVersion: { type: String, default: 'N/A' },
        os: { type: String, default: 'Unknown' },
        osVersion: { type: String, default: 'N/A' },
        type: { type: String, default: 'Desktop' }
    },
    userAgent: { type: String, default: '' },
    status: { type: String, enum: ['new', 'resolved', 'ignored'], default: 'new' },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    actionTaken: { type: String, default: null }, // 'banned', 'temp_banned', 'ip_banned', null
}, { timestamps: true });

const contentViolationModel = mongoose.models.contentViolation ||
    mongoose.model('contentViolation', contentViolationSchema);

export default contentViolationModel;
