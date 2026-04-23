import mongoose from 'mongoose';

const redisDailyMetricSchema = new mongoose.Schema({
    date: { type: Date, required: true, unique: true },
    commands: { type: Number, default: 0 },
    bandwidth: { type: Number, default: 0 }, // Store in KB
    totalCommandsAtSnapshot: { type: Number },
    totalBandwidthAtSnapshot: { type: Number }
}, { timestamps: true });

const redisDailyMetricModel = mongoose.models.redisDailyMetric || mongoose.model('redisDailyMetric', redisDailyMetricSchema);

export default redisDailyMetricModel;
