import mongoose from "mongoose";

const mobileIcuVanSchema = new mongoose.Schema({
    vanNumber: { type: String, required: true, unique: true },
    driverName: { type: String, required: true },
    driverPhone: { type: String, required: true },
    paramedicName: { type: String, default: '' },
    paramedicPhone: { type: String, default: '' },
    baseLocation: { type: String, required: true },
    city: { type: String, default: '' },
    status: { type: String, enum: ['Available', 'Dispatched', 'Maintenance', 'Offline'], default: 'Available' },
    currentDispatchUserId: { type: String, default: null },
    equipment: { type: [String], default: ['Oxygen Cylinder', 'Defibrillator', 'First Aid Kit', 'Stretcher'] },
    lastServiceDate: { type: Date, default: null },
    notes: { type: String, default: '' }
}, { timestamps: true });

const mobileIcuVanModel = mongoose.models.mobileIcuVan || mongoose.model("mobileIcuVan", mobileIcuVanSchema);

export default mobileIcuVanModel;
