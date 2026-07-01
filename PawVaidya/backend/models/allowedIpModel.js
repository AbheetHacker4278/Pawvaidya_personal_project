import mongoose from 'mongoose';

const allowedIpSchema = new mongoose.Schema({
    ipAddress: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    addedBy: {
        type: String,
        default: 'System'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const allowedIpModel = mongoose.model('allowedIp', allowedIpSchema);

export default allowedIpModel;
