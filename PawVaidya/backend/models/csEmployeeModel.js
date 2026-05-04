import mongoose from 'mongoose';

const csEmployeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    plainPassword: { type: String, default: '' },
    phone: { type: String, default: '' },
    bio: { type: String, default: '' },
    profilePic: { type: String, default: '' },

    // Face verification
    faceDescriptor: { type: [Number], default: [] },
    faceVerified: { type: Boolean, default: false },
    registeredFaceImage: { type: String, default: '' },

    // Profile completion
    profileComplete: { type: Boolean, default: false },
    profileDeadline: { type: Date, default: null }, // 2 days from account creation

    // Account status
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
    // 'pending' = account created, face not yet verified
    // 'active'  = face verified + profile complete
    // 'suspended' = deadline missed or admin action

    suspendedReason: { type: String, default: '' },
    suspendedAt: { type: Date, default: null },

    // Performance stats
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    totalTicketsResolved: { type: Number, default: 0 },
    overallRating: { type: Number, default: 0 },
    fiveStarCount: { type: Number, default: 0 },

    adminIncentive: {
        amount: { type: Number, default: 0 },
        expiresAt: { type: Date, default: null }
    },

    isOnline: { type: Boolean, default: false },
    activeTicketsCount: { type: Number, default: 0 },

    // Rewards/Compensation granted by admin
    rewards: [{
        type: { type: String, enum: ['bonus', 'badge', 'other'], default: 'bonus' },
        value: { type: String, default: '' },
        message: { type: String, default: '' },
        grantedAt: { type: Date, default: Date.now }
    }],

    // DigiLocker Integration
    digilocker: {
        linked: { type: Boolean, default: false },
        accessToken: { type: String, default: '' },
        linkedAt: { type: Date, default: null },
        aadhaarNumber: { type: String, default: '' }, // masked, e.g. XXXX-XXXX-1234
        digilockerName: { type: String, default: '' },
    },
    digilockerDocuments: [{
        docType: { type: String, required: true }, // 'aadhaar', 'abha', 'apaar', 'pan', 'driving_license'
        docName: { type: String, required: true },
        docNumber: { type: String, default: '' }, // masked number
        issuer: { type: String, default: '' },
        issuedDate: { type: String, default: '' },
        docData: { type: String, default: '' }, // base64 image data or cloudinary URL
        fetchedAt: { type: Date, default: Date.now },
        verified: { type: Boolean, default: true }, // DigiLocker docs are govt-verified
    }],

    // Documents/Verification
    documents: [{
        docType: { type: String, required: true }, // 'qualification', 'aadhar', 'pan', 'passport', 'other'
        docUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],

    joinedAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },
}, { timestamps: true });

const CSEmployee = mongoose.models.csEmployee || mongoose.model('csEmployee', csEmployeeSchema);
export default CSEmployee;
