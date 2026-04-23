import redis from '../config/redis.js';
import redisDailyMetricModel from '../models/redisDailyMetricModel.js';

export const trackRedisMetrics = async () => {
    try {
        if (!redis) return;

        const info = await redis.info();
        const stats = {};
        info.split('\r\n').forEach(line => {
            const parts = line.split(':');
            if (parts.length === 2) stats[parts[0]] = parts[1];
        });

        const currentTotalCommands = parseInt(stats.total_commands_processed) || 0;
        const currentTotalBandwidth = (parseInt(stats.total_net_output_bytes) || 0) / 1024; // KB

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find the absolute latest metric recorded BEFORE today to use as a baseline
        const lastMetric = await redisDailyMetricModel.findOne({ date: { $lt: today } }).sort({ date: -1 });

        let dailyCommands = 0;
        let dailyBandwidth = 0;

        if (lastMetric) {
            // Delta is (current total) - (total at the end of yesterday)
            dailyCommands = Math.max(0, currentTotalCommands - (lastMetric.totalCommandsAtSnapshot || 0));
            dailyBandwidth = Math.max(0, currentTotalBandwidth - (lastMetric.totalBandwidthAtSnapshot || 0));
        } else {
            // First time tracking: we can't know the delta, so we start from 0
            dailyCommands = 0;
            dailyBandwidth = 0;
        }

        // Upsert today's metric (overwrite with latest cumulative delta)
        await redisDailyMetricModel.findOneAndUpdate(
            { date: today },
            {
                $set: {
                    commands: dailyCommands,
                    bandwidth: dailyBandwidth,
                    totalCommandsAtSnapshot: currentTotalCommands,
                    totalBandwidthAtSnapshot: currentTotalBandwidth
                }
            },
            { upsert: true, new: true }
        );

        console.log(`Redis metrics tracked for ${today.toDateString()}`);
    } catch (error) {
        console.error("Redis tracker error:", error.message);
    }
};
