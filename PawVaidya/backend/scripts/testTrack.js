import 'dotenv/config';
import mongoose from 'mongoose';
import { trackRedisMetrics } from '../utils/redisTracker.js';

const testTracking = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        console.log("Starting Manual Redis Metric Capture...");
        await trackRedisMetrics();
        console.log("Metric Capture Complete.");

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
};

testTracking();
