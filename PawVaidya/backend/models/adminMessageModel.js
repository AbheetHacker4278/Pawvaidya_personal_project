import mongoose from 'mongoose';

const adminMessageSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetType: { 
        type: String, 
        required: true, 
        enum: ['all', 'users', 'doctors', 'specific'] 
    },
    targetIds: [{ type: String }], // For specific users/doctors
    createdBy: { type: String, default: 'Admin' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }, // Optional expiry date
    priority: { 
        type: String, 
        default: 'normal', 
        enum: ['low', 'normal', 'high', 'urgent'] 
    },
    readBy: [{ 
        userId: String, 
        readAt: Date 
    }],
    attachments: [{
        url: { type: String },
        type: { type: String, enum: ['image', 'video'] },
        filename: { type: String }
    }]
});

const adminMessageModel = mongoose.models.adminMessage || mongoose.model('adminMessage', adminMessageSchema);

export default adminMessageModel;
