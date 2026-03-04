import mongoose from 'mongoose';

const doctorScheduleSchema = new mongoose.Schema({
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
    startTime: { 
        type: String, 
        required: true 
    },
    endTime: { 
        type: String, 
        required: true 
    },
    slotDuration: { 
        type: Number, 
        default: 30, // in minutes
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Create compound index to prevent duplicate schedules for same doctor and day
doctorScheduleSchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });

const doctorScheduleModel = mongoose.models.doctorSchedule || mongoose.model('doctorSchedule', doctorScheduleSchema);

export default doctorScheduleModel;
