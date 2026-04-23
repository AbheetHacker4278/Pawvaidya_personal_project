import mongoose from 'mongoose';
import 'dotenv/config';
import connectdb from '../config/mongodb.js';
import redisDailyMetricModel from '../models/redisDailyMetricModel.js';

const seedMetrics = async () => {
    try {
        await connectdb();
        console.log("Database Connected. Seeding Redis Metrics...");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const data = [
            { offset: 5, commands: 0, bandwidth: 0 }, // Saturday
            { offset: 4, commands: 0, bandwidth: 0 }, // Sunday
            { offset: 3, commands: 0, bandwidth: 0 }, // Monday
            { offset: 2, commands: 0, bandwidth: 0 }, // Tuesday
            { offset: 1, commands: 7, bandwidth: 35 }, // Wednesday (match hardcoded)
            { offset: 0, commands: 12, bandwidth: 58 } // Thursday (Today)
        ];

        for (const item of data) {
            const date = new Date(today);
            date.setDate(date.getDate() - item.offset);

            await redisDailyMetricModel.findOneAndUpdate(
                { date },
                {
                    commands: item.commands,
                    bandwidth: item.bandwidth,
                    totalCommandsAtSnapshot: 0, // Baseline dummy
                    totalBandwidthAtSnapshot: 0
                },
                { upsert: true }
            );
            console.log(`Seeded metric for ${date.toDateString()}`);
        }

        console.log("Seeding complete.");
    } catch (error) {
        console.error("Seeding error:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

seedMetrics();
