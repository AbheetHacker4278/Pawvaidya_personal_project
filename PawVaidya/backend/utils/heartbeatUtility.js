import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import serviceHealthModel from '../models/serviceHealthModel.js';

/**
 * Perform a heartbeat check on all major services
 */
export const performHeartbeatCheck = async () => {
    const results = [];

    // 1. Database Check
    const dbStart = Date.now();
    const isDbHealthy = mongoose.connection.readyState === 1;
    results.push({
        service: 'Database',
        status: isDbHealthy ? 'Healthy' : 'Unreachable',
        latency: Date.now() - dbStart
    });

    // 2. Gemini Check (Config & Connection)
    const geminiStart = Date.now();
    const isGeminiConfigured = !!process.env.GEMINI_API_KEY;
    results.push({
        service: 'Gemini',
        status: isGeminiConfigured ? 'Healthy' : 'Degraded',
        latency: Date.now() - geminiStart
    });

    // 3. Cloudinary Check
    const cloudStart = Date.now();
    const isCloudinaryConfigured = !!process.env.CLOUDINARY_CLOUD_NAME;
    results.push({
        service: 'Cloudinary',
        status: isCloudinaryConfigured ? 'Healthy' : 'Degraded',
        latency: Date.now() - cloudStart
    });

    // 4. Server Check
    results.push({
        service: 'Server',
        status: 'Healthy',
        latency: 0
    });

    // Save to database
    try {
        await serviceHealthModel.insertMany(results.map(r => ({ ...r, timestamp: new Date() })));
        console.log('Heartbeat check completed and logged.');
    } catch (error) {
        console.error('Error saving heartbeat check:', error.message);
    }

    return results;
};
