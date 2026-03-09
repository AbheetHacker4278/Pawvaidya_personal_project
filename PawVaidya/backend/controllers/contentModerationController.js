import contentViolationModel from '../models/contentViolationModel.js';
import bannedIpModel from '../models/bannedIpModel.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import { logActivity } from '../utils/activityLogger.js';

// ─── Content Violations ───────────────────────────────────────────────────────

export const getContentViolations = async (req, res) => {
    try {
        const { status, limit = 100 } = req.query;
        const filter = status ? { status } : {};
        const violations = await contentViolationModel
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit));
        const unreadCount = await contentViolationModel.countDocuments({ status: 'new' });
        return res.json({ success: true, violations, unreadCount });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const resolveContentViolation = async (req, res) => {
    try {
        const { violationId } = req.params;
        const { status } = req.body; // 'resolved' | 'ignored'
        const violation = await contentViolationModel.findByIdAndUpdate(
            violationId,
            { status },
            { new: true }
        );
        if (!violation) return res.json({ success: false, message: 'Violation not found' });
        return res.json({ success: true, message: `Violation marked as ${status}`, violation });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// ─── IP Ban Management ────────────────────────────────────────────────────────

export const banIpAddress = async (req, res) => {
    try {
        const { ipAddress, reason, banDuration, associatedUserId, associatedUserType } = req.body;
        const adminId = req.adminId;

        if (!ipAddress || !reason) {
            return res.json({ success: false, message: 'ipAddress and reason are required' });
        }

        let expiresAt = null;
        if (banDuration && banDuration !== 'permanent') {
            const match = banDuration.match(/^(\d+)([hdwm])$/);
            if (match) {
                const amount = parseInt(match[1]);
                const now = new Date();
                const multipliers = { h: 3600000, d: 86400000, w: 604800000, m: 2592000000 };
                expiresAt = new Date(now.getTime() + amount * multipliers[match[2]]);
            }
        }

        // Upsert: if already banned, update the record
        const banned = await bannedIpModel.findOneAndUpdate(
            { ipAddress },
            { reason, bannedBy: adminId, bannedAt: new Date(), expiresAt, isActive: true, associatedUserId, associatedUserType },
            { upsert: true, new: true }
        );

        await logActivity(adminId, 'admin', 'ban_ip',
            `Banned IP ${ipAddress}: ${reason}`, req, { ipAddress, reason, expiresAt });

        return res.json({ success: true, message: `IP ${ipAddress} banned successfully`, data: banned });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const getBannedIps = async (req, res) => {
    try {
        const bannedIps = await bannedIpModel.find({ isActive: true }).sort({ createdAt: -1 });
        return res.json({ success: true, bannedIps });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const unbanIpAddress = async (req, res) => {
    try {
        const { ipAddress } = req.body;
        const adminId = req.adminId;
        const record = await bannedIpModel.findOneAndUpdate(
            { ipAddress },
            { isActive: false },
            { new: true }
        );
        if (!record) return res.json({ success: false, message: 'IP not found in ban list' });
        await logActivity(adminId, 'admin', 'unban_ip', `Unbanned IP ${ipAddress}`, req, { ipAddress });
        return res.json({ success: true, message: `IP ${ipAddress} unbanned` });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// ─── Combined Ban Action (from violation card) ────────────────────────────────

/**
 * Ban a user/doctor + optionally also ban their IP, all in one API call from the
 * Security Monitoring UI when an admin clicks "Ban" on a content violation card.
 */
export const banFromViolation = async (req, res) => {
    try {
        const { violationId, userId, userType, banDuration, banReason, banIp, ipAddress } = req.body;
        const adminId = req.adminId;

        let userBanned = false;
        let ipBanned = false;

        // 1. Ban the user/doctor if userId provided
        if (userId && userType) {
            let user;
            if (userType === 'user') user = await userModel.findById(userId);
            else if (userType === 'doctor') user = await doctorModel.findById(userId);

            if (user) {
                let unbanAt = null;
                if (banDuration && banDuration !== 'permanent') {
                    const match = banDuration.match(/^(\d+)([hdwm])$/);
                    if (match) {
                        const amount = parseInt(match[1]);
                        const multipliers = { h: 3600000, d: 86400000, w: 604800000, m: 2592000000 };
                        unbanAt = new Date(Date.now() + amount * multipliers[match[2]]);
                    }
                }
                user.isBanned = true;
                user.banReason = banReason;
                user.bannedAt = new Date();
                user.bannedBy = adminId;
                user.unbanAt = unbanAt;
                await user.save();
                userBanned = true;
            }
        }

        // 2. Ban the IP if requested
        if (banIp && ipAddress) {
            await bannedIpModel.findOneAndUpdate(
                { ipAddress },
                { reason: banReason, bannedBy: adminId, bannedAt: new Date(), isActive: true },
                { upsert: true, new: true }
            );
            ipBanned = true;
        }

        // 3. Update violation status
        if (violationId) {
            await contentViolationModel.findByIdAndUpdate(violationId, {
                status: 'resolved',
                actionTaken: banIp ? 'ip_banned' : (banDuration === 'permanent' ? 'banned' : 'temp_banned')
            });
        }

        await logActivity(adminId, 'admin', 'ban_from_violation',
            `Banned from violation: userBanned=${userBanned}, ipBanned=${ipBanned}, reason=${banReason}`,
            req, { violationId, userId, userType, banDuration, banReason, banIp, ipAddress });

        return res.json({
            success: true,
            message: `Action completed. User banned: ${userBanned}, IP banned: ${ipBanned}.`,
            userBanned,
            ipBanned
        });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};
