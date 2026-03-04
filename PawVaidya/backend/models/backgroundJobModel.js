import mongoose from 'mongoose';

const backgroundJobSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    lastRun: { type: Date },
    nextRun: { type: Date },
    status: { type: String, enum: ['Success', 'Failure', 'Running', 'Idle'], default: 'Idle' },
    lastDuration: { type: Number }, // ms
    lastError: { type: String },
    runCount: { type: Number, default: 0 }
}, { timestamps: true });

const backgroundJobModel = mongoose.models.backgroundJob || mongoose.model('backgroundJob', backgroundJobSchema);

export default backgroundJobModel;
