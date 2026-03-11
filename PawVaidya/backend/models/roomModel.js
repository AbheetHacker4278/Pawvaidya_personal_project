import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    ownerId: { type: String, required: true, index: true },
    rules: { type: String, default: '' },
    isPrivate: { type: Boolean, default: true },
    members: [{
        userId: { type: String, required: true },
        joinedAt: { type: Date, default: Date.now }
    }],
    pendingRequests: [{
        userId: { type: String, required: true },
        requestedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

roomSchema.index({ createdAt: -1 });

const roomModel = mongoose.models.room || mongoose.model('room', roomSchema);

export default roomModel;
