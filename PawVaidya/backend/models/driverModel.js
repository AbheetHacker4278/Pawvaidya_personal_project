import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    profilePhoto: { type: String, default: '' },
    mobileNumber: { type: String, required: true, unique: true },
    emailAddress: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    assignedVehicle: { type: String, default: '' }, // vanNumber
    vehicleRegNumber: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    drivingLicenceNumber: { type: String, default: '' },
    govPhotoIdNumber: { type: String, default: '' },
    employmentStatus: { type: String, enum: ['Active', 'Suspended', 'On Leave', 'Terminated'], default: 'Active' },
    joiningDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['Online', 'Offline', 'On Duty', 'En Route', 'Reached Destination', 'Ride Completed'], default: 'Offline' },
    locationSharing: { type: Boolean, default: false },
    currentLocation: {
        lat: { type: Number, default: 19.0760 }, // Default Mumbai lat
        lng: { type: Number, default: 72.8777 },
        updatedAt: { type: Date, default: Date.now }
    },
    documents: {
        drivingLicenceUrl: { type: String, default: '' },
        govPhotoIdUrl: { type: String, default: '' },
        uploaded: { type: Boolean, default: false }
    },
    salary: {
        base: { type: Number, default: 8500 },
        bonus: { type: Number, default: 0 },
        deductions: { type: Number, default: 0 }
    },
    ratings: [
        {
            rating: { type: Number, required: true },
            review: { type: String, default: '' },
            bookingId: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },
    appeal: {
        appealText: { type: String, default: '' },
        status: { type: String, enum: ['None', 'Pending', 'Approved', 'Rejected'], default: 'None' },
        submittedAt: { type: Date, default: null }
    },
    faceRegistered: { type: Boolean, default: false },
    facePhoto: { type: String, default: '' },
    lastFaceVerifiedAt: { type: Date, default: null },
    deductionHistory: [
        {
            amount: { type: Number, required: true },
            date: { type: Date, default: Date.now },
            reason: { type: String, required: true },
            bookingId: { type: String, required: true },
            remarks: { type: String, default: '' }
        }
    ]
}, { timestamps: true });

const driverModel = mongoose.models.driver || mongoose.model("driver", driverSchema);

export default driverModel;
