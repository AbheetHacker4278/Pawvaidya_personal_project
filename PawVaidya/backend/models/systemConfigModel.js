import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema({
    maintenanceMode: { type: Boolean, default: false },
    killSwitch: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "System is currently under maintenance. Please try again later." },

    // Dynamic Commission Engine
    commissionRules: {
        defaultPercentage: { type: Number, default: 20 },
        specialityRules: [{
            speciality: String,
            percentage: Number
        }],
        surgeRules: [{
            startTime: String, // HH:mm
            endTime: String,   // HH:mm
            multiplier: { type: Number, default: 1 } // Multiplies the base/speciality percentage
        }]
    },

    // Fraud & Security Sentinel
    fraudSentinel: {
        velocityThreshold: { type: Number, default: 500 }, // km/h (Impossible travel threshold)
        maxLoginAttempts: { type: Number, default: 5 },
        autoLockAccounts: { type: Boolean, default: true }
    },

    // Emergency Broadcast History
    emergencyBroadcasts: [{
        message: String,
        severity: { type: String, enum: ['high', 'critical'], default: 'high' },
        timestamp: { type: Date, default: Date.now },
        triggeredBy: String
    }],

    // Emergency SMS Contacts
    emergencyContacts: [{
        name: String,
        phone: { type: String, required: true },
        role: String
    }],

    lastUpdatedBy: { type: String, default: 'system' },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const systemConfigModel = mongoose.models.systemConfig || mongoose.model('systemConfig', systemConfigSchema);
export default systemConfigModel;
