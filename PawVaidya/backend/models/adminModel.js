import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        unique: true,
        sparse: true // Allows nulls while enforcing uniqueness for non-null values
    },
    plainPassword: {
        type: String
    },
    image: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        default: 'admin',
        enum: ['admin', 'master'] // 'master' is implicitly handled via env but good to have in schema if we ever store it
    },
    permissions: {
        type: [String],
        default: [] // Array of permission strings, e.g., ['manage_doctors', 'manage_users']
    },
    faceDescriptor: {
        type: [Number], // Array of 128 floats for face embedding
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    otp: {
        type: String,
        default: null
    },
    otpExpires: {
        type: Date,
        default: null
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lastFailedLoginAt: {
        type: Date,
        default: null
    },
    trustedGeolocations: {
        type: [String],
        default: []
    },
    pendingLogins: [{
        ip: String,
        geolocation: String,
        token: String,
        expiresAt: Date
    }]
});

const adminModel = mongoose.model('admin', adminSchema);

export default adminModel;
