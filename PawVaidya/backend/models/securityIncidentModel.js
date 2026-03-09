import mongoose from 'mongoose';

const securityIncidentSchema = new mongoose.Schema({
    type: { type: String, required: true }, // 'XSS', 'SQLi', 'Brute Force', etc.
    target: { type: String, required: true }, // URL or field name
    payload: { type: String, required: true }, // The detected malicious payload
    method: { type: String, required: true }, // GET, POST, etc.
    url: { type: String, default: '' }, // The request path
    ipAddress: { type: String, default: '' },
    location: {
        city: { type: String, default: 'Unknown' },
        country: { type: String, default: 'Unknown' },
        latitude: { type: Number },
        longitude: { type: Number }
    },
    userAgent: { type: String, default: '' },
    device: {
        browser: { type: String, default: 'Unknown' },
        browserVersion: { type: String, default: 'N/A' },
        os: { type: String, default: 'Unknown' },
        osVersion: { type: String, default: 'N/A' },
        type: { type: String, default: 'Desktop' }
    },
    userId: { type: String, default: null }, // If user was logged in
    userType: { type: String, enum: ['user', 'doctor', 'admin', 'unknown'], default: 'unknown' },
    userDetails: {
        name: { type: String, default: 'Anonymous' },
        email: { type: String, default: 'N/A' }
    },
    status: { type: String, enum: ['new', 'resolved', 'ignored'], default: 'new' },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
}, { timestamps: true });

const securityIncidentModel = mongoose.models.securityIncident || mongoose.model('securityIncident', securityIncidentSchema);

export default securityIncidentModel;
