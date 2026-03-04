import mongoose from 'mongoose';

const serviceHealthSchema = new mongoose.Schema({
    service: {
        type: String,
        required: true,
        enum: ['Gemini', 'Cloudinary', 'Database', 'Server', 'Nodemailer']
    },
    status: {
        type: String,
        required: true,
        enum: ['Healthy', 'Degraded', 'Unreachable']
    },
    latency: { type: Number, default: 0 }, // in ms
    timestamp: { type: Date, default: Date.now, index: { expires: '7d' } } // Retain history for 7 days
}, { timestamps: false });

const serviceHealthModel = mongoose.models.serviceHealth || mongoose.model('serviceHealth', serviceHealthSchema);

export default serviceHealthModel;
