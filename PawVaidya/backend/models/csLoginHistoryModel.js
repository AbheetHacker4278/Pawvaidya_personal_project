import mongoose from 'mongoose';

const csLoginHistorySchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'csEmployee', required: true },
    employeeName: { type: String, default: '' },
    loginAt: { type: Date, default: Date.now },
    logoutAt: { type: Date, default: null },
    sessionDurationMinutes: { type: Number, default: 0 },
    loginFaceImage: { type: String, default: '' },
    ip: { type: String, default: '' },
    device: { type: String, default: '' },
    userAgent: { type: String, default: '' },
}, { timestamps: false });

const CSLoginHistory = mongoose.models.csLoginHistory || mongoose.model('csLoginHistory', csLoginHistorySchema);
export default CSLoginHistory;
