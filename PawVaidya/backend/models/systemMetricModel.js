import mongoose from 'mongoose';

const systemMetricSchema = new mongoose.Schema({
    path: { type: String, required: true },
    method: { type: String, required: true },
    statusCode: { type: Number, required: true },
    latency: { type: Number, required: true },
    cacheHit: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now, index: { expires: '24h' } } // Auto-delete logs after 24h
}, { timestamps: false });

// Index for aggregation
systemMetricSchema.index({ timestamp: -1 });

const systemMetricModel = mongoose.models.systemMetric || mongoose.model('systemMetric', systemMetricSchema);

export default systemMetricModel;
