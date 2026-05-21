import mongoose from "mongoose";

const emergencyDoctorAvailabilitySchema = new mongoose.Schema({
    docId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'doctor', 
        required: true, 
        unique: true 
    },
    isEmergencyAvailable: { 
        type: Boolean, 
        default: true 
    },
    activeDistrict: { 
        type: String, 
        required: true 
    },
    activeState: { 
        type: String, 
        required: true 
    },
    maxConcurrentEmergencies: { 
        type: Number, 
        default: 3 
    },
    currentActiveEmergencies: { 
        type: Number, 
        default: 0 
    }
}, { timestamps: true });

// Production-grade performance-critical indexing
emergencyDoctorAvailabilitySchema.index({ isEmergencyAvailable: 1, activeDistrict: 1 });

const emergencyDoctorAvailabilityModel = mongoose.models.emergencyDoctorAvailability || mongoose.model("emergencyDoctorAvailability", emergencyDoctorAvailabilitySchema);
export default emergencyDoctorAvailabilityModel;
