import supabaseService from '../services/supabaseService.js';
import activityLogModel from '../models/activityLogModel.js';

/**
 * Log user/doctor activity
 * @param {String} userId - User or Doctor ID
 * @param {String} userType - 'user' or 'doctor'
 * @param {String} activityType - Type of activity (login, logout, page_view, action, etc.)
 * @param {String} activityDescription - Detailed description
 * @param {Object} req - Express request object (for IP and User-Agent)
 * @param {Object} metadata - Additional metadata
 */
export const logActivity = async (userId, userType, activityType, activityDescription, req = null, metadata = {}, faceImage = '') => {
    try {
        const ipAddress = req?.ip || req?.connection?.remoteAddress || '';
        const userAgent = req?.headers?.['user-agent'] || '';

        // 1. Log to MongoDB (Reliable local backup)
        try {
            await activityLogModel.create({
                userId,
                userType,
                activityType,
                activityDescription,
                ipAddress,
                userAgent,
                metadata,
                faceImage
            });
        } catch (mongoErr) {
            console.error('Error logging to MongoDB:', mongoErr);
        }

        // 2. Log to Supabase (Analytics & Offloading)
        await supabaseService.logActivity({
            userId,
            userType,
            activityType,
            description: activityDescription,
            ipAddress,
            userAgent,
            metadata: { ...metadata, faceImage }
        });
    } catch (error) {
        console.error('Error in logActivity:', error);
    }
};

