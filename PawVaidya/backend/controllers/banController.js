import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import bannedIpModel from '../models/bannedIpModel.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * Ban a user or doctor for a custom duration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Success/error response
 */
export const banUser = async (req, res) => {
    try {
        const { userId, userType, banDuration, banReason, banIp, ipAddress } = req.body;
        const adminId = req.adminId; // From authAdmin middleware

        if (!userId || !userType || !banDuration || !banReason) {
            return res.json({
                success: false,
                message: 'Missing required fields: userId, userType, banDuration, banReason'
            });
        }

        if (!['user', 'doctor'].includes(userType)) {
            return res.json({
                success: false,
                message: 'Invalid userType. Must be "user" or "doctor"'
            });
        }

        // Parse duration (e.g., "1h", "24h", "7d", "30d", "permanent")
        let unbanAt = null;
        if (banDuration !== 'permanent') {
            const durationMatch = banDuration.match(/^(\d+)([hdwm])$/);
            if (!durationMatch) {
                return res.json({
                    success: false,
                    message: 'Invalid banDuration format. Use: 1h, 24h, 7d, 30d, or permanent'
                });
            }

            const amount = parseInt(durationMatch[1]);
            const unit = durationMatch[2];
            const now = new Date();

            switch (unit) {
                case 'h':
                    unbanAt = new Date(now.getTime() + amount * 60 * 60 * 1000);
                    break;
                case 'd':
                    unbanAt = new Date(now.getTime() + amount * 24 * 60 * 60 * 1000);
                    break;
                case 'w':
                    unbanAt = new Date(now.getTime() + amount * 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'm':
                    unbanAt = new Date(now.getTime() + amount * 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    return res.json({
                        success: false,
                        message: 'Invalid duration unit. Use: h, d, w, m'
                    });
            }
        }

        let user;
        if (userType === 'user') {
            user = await userModel.findById(userId);
        } else {
            user = await doctorModel.findById(userId);
        }

        if (!user) {
            return res.json({
                success: false,
                message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} not found`
            });
        }

        // Update ban status
        user.isBanned = true;
        user.banReason = banReason;
        user.bannedAt = new Date();
        user.bannedBy = adminId;
        user.unbanAt = unbanAt;
        user.unbanRequestAttempts = 0; // Reset unban request attempts

        await user.save();

        // Optional IP Ban
        let ipBanned = false;
        if (banIp && ipAddress) {
            let expiresAt = unbanAt; // Use same expiry as user ban
            await bannedIpModel.findOneAndUpdate(
                { ipAddress },
                {
                    reason: banReason,
                    bannedBy: adminId,
                    bannedAt: new Date(),
                    expiresAt,
                    isActive: true,
                    associatedUserId: userId,
                    associatedUserType: userType
                },
                { upsert: true, new: true }
            );
            ipBanned = true;
        }

        // Log the ban activity
        await logActivity(
            adminId,
            'admin',
            'ban_user',
            `Banned ${userType}: ${user.email} for ${banDuration}. Reason: ${banReason}`,
            req,
            {
                userId: userId,
                userType,
                banDuration,
                banReason,
                unbanAt,
                userEmail: user.email,
                userName: user.name
            }
        );

        return res.json({
            success: true,
            message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} banned successfully${ipBanned ? ' (IP also banned)' : ''} for ${banDuration}`,
            data: {
                userId: user._id,
                name: user.name,
                email: user.email,
                banDuration,
                banReason,
                unbanAt,
                bannedAt: user.bannedAt,
                ipBanned
            }
        });

    } catch (error) {
        console.error('Ban user error:', error);
        return res.json({
            success: false,
            message: 'Failed to ban user',
            error: error.message
        });
    }
};

/**
 * Unban a user or doctor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Success/error response
 */
export const unbanUser = async (req, res) => {
    try {
        const { userId, userType, unbanReason } = req.body;
        const adminId = req.adminId; // From authAdmin middleware

        if (!userId || !userType) {
            return res.json({
                success: false,
                message: 'Missing required fields: userId, userType'
            });
        }

        if (!['user', 'doctor'].includes(userType)) {
            return res.json({
                success: false,
                message: 'Invalid userType. Must be "user" or "doctor"'
            });
        }

        let user;
        if (userType === 'user') {
            user = await userModel.findById(userId);
        } else {
            user = await doctorModel.findById(userId);
        }

        if (!user) {
            return res.json({
                success: false,
                message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} not found`
            });
        }

        if (!user.isBanned) {
            return res.json({
                success: false,
                message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} is not banned`
            });
        }

        // Update ban status
        user.isBanned = false;
        user.banReason = unbanReason || 'Unbanned by admin';
        user.unbanAt = null;
        user.unbanRequestAttempts = 0; // Reset unban request attempts

        await user.save();

        // Log the unban activity
        await logActivity(
            adminId,
            'admin',
            'unban_user',
            `Unbanned ${userType}: ${user.email}. Reason: ${unbanReason || 'Unbanned by admin'}`,
            req,
            {
                userId: userId,
                userType,
                unbanReason,
                userEmail: user.email,
                userName: user.name
            }
        );

        return res.json({
            success: true,
            message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} unbanned successfully`,
            data: {
                userId: user._id,
                name: user.name,
                email: user.email,
                unbanReason,
                unbannedAt: new Date()
            }
        });

    } catch (error) {
        console.error('Unban user error:', error);
        return res.json({
            success: false,
            message: 'Failed to unban user',
            error: error.message
        });
    }
};

/**
 * Get ban status for a user or doctor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Ban status information
 */
export const getBanStatus = async (req, res) => {
    try {
        const { userId, userType } = req.query;

        if (!userId || !userType) {
            return res.json({
                success: false,
                message: 'Missing required fields: userId, userType'
            });
        }

        if (!['user', 'doctor'].includes(userType)) {
            return res.json({
                success: false,
                message: 'Invalid userType. Must be "user" or "doctor"'
            });
        }

        let user;
        if (userType === 'user') {
            user = await userModel.findById(userId).select('name email isBanned banReason bannedAt unbanAt bannedBy');
        } else {
            user = await doctorModel.findById(userId).select('name email isBanned banReason bannedAt unbanAt bannedBy');
        }

        if (!user) {
            return res.json({
                success: false,
                message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} not found`
            });
        }

        return res.json({
            success: true,
            data: {
                isBanned: user.isBanned,
                banReason: user.banReason,
                bannedAt: user.bannedAt,
                unbanAt: user.unbanAt,
                bannedBy: user.bannedBy
            }
        });

    } catch (error) {
        console.error('Get ban status error:', error);
        return res.json({
            success: false,
            message: 'Failed to get ban status',
            error: error.message
        });
    }
};