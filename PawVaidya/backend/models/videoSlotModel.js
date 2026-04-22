import mongoose from 'mongoose';

const videoSlotSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor',
        required: true
    },
    dayOfWeek: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    slotTime: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent duplicate slots for same doctor, day and time
videoSlotSchema.index({ doctorId: 1, dayOfWeek: 1, slotTime: 1 }, { unique: true });

const videoSlotModel = mongoose.models.videoSlot || mongoose.model('videoSlot', videoSlotSchema);

export default videoSlotModel;
