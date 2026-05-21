import mongoose from 'mongoose';

const csShiftLogSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'csEmployee', required: true },
    employeeName: { type: String, default: '' },

    // Shift start: when employee logged in and shift timer began
    shiftStart: { type: Date, required: true },

    // Shift end: when 10hr completed or early logout happened
    shiftEnd: { type: Date, default: null },

    // Total actual work seconds (excludes break time)
    workSeconds: { type: Number, default: 0 },

    // Total break seconds taken during this shift
    breakSeconds: { type: Number, default: 0 },

    // Whether the 10-hour shift was fully completed
    completedShift: { type: Boolean, default: false },

    // If agent logged out early before 10h
    earlyLogout: { type: Boolean, default: false },
    earlyLogoutReason: { type: String, default: '' },
    earlyLogoutAt: { type: Date, default: null },

    // Date reference (just the calendar date for easy filtering)
    date: { type: String, default: '' }, // "YYYY-MM-DD"
}, { timestamps: true });

const CSShiftLog = mongoose.models.csShiftLog || mongoose.model('csShiftLog', csShiftLogSchema);
export default CSShiftLog;
