import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    plainPassword: { type: String, default: '' }, // Store original password for admin access
    image: { type: String, required: true },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    fees: { type: Number, required: true },
    docphone: { type: String, default: "Not Avaiailable", unique: true },
    address: { type: Object, required: true },
    full_address: { type: String, required: true },
    date: { type: Number, required: true },
    slots_booked: { type: Object, default: {} },
    // Login/Logout tracking
    lastLogin: { type: Date, default: null },
    lastLogout: { type: Date, default: null },
    totalSessionTime: { type: Number, default: 0 }, // Total time in seconds
    currentSessionStart: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },
    // Ban/Suspension tracking
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },
    bannedAt: { type: Date, default: null },
    bannedBy: { type: String, default: null },
    unbanRequestAttempts: { type: Number, default: 0 }, // Track unban request attempts
    // Location tracking
    location: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
        accuracy: { type: Number, default: null },
        timestamp: { type: Date, default: null }
    },
    // Discount coupons created by the doctor
    discounts: [{
        code: { type: String, required: true },
        discountType: { type: String, enum: ['percentage', 'flat'], required: true },
        discountValue: { type: Number, required: true },
        maxUses: { type: Number, default: 0 },      // 0 = unlimited
        usedCount: { type: Number, default: 0 },
        expiresAt: { type: Date, default: null },   // null = no expiry
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
    }],
    // Rating System
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    reviews: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        userName: { type: String },
        rating: { type: Number, required: true },
        comment: { type: String },
        date: { type: Date, default: Date.now }
    }],
    // Incentive System
    incentive: {
        type: { type: String, enum: ['bonus', 'badge', 'none'], default: 'none' },
        value: { type: String, default: '' },
        message: { type: String, default: '' },
        date: { type: Date, default: null },
        expiryDate: { type: Date, default: null }
    },
    incentiveHistory: [{
        type: { type: String, enum: ['bonus', 'badge', 'none'] },
        value: { type: String },
        message: { type: String },
        date: { type: Date, default: Date.now }
    }],
    faceDescriptor: {
        type: [Number], // Array of 128 floats for face embedding
        default: []
    }
}, { minimize: false })

const doctorModel = mongoose.models.doctor || mongoose.model('doctor', doctorSchema);

export default doctorModel