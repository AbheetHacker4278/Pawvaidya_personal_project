import { logActivity } from '../utils/activityLogger.js';

/**
 * Middleware to track user/doctor activities
 * Should be placed after authentication middleware
 */
export const trackActivity = (activityType, activityDescription) => {
    return async (req, res, next) => {
        try {
            // Get user/doctor ID from request (set by auth middleware)
            const userId = req.body.userId || req.body.docId || req.userId || req.docId;
            const userType = req.body.userType || (req.body.docId || req.docId ? 'doctor' : 'user');
            
            // Log the activity
            if (userId) {
                await logActivity(
                    userId.toString(),
                    userType,
                    activityType,
                    activityDescription,
                    req,
                    { route: req.path, method: req.method }
                );
            }
            
            next();
        } catch (error) {
            console.error('Error tracking activity:', error);
            // Don't block the request if activity tracking fails
            next();
        }
    };
};

