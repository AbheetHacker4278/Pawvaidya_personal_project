import unbanRequestModel from '../models/unbanRequestModel.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';

// Submit unban request (User or Doctor)
export const submitUnbanRequest = async (req, res) => {
    try {
        const { requesterType, requesterId, requestMessage } = req.body;

        // Check if user/doctor exists and is banned
        let requester;
        let requesterModel;
        
        if (requesterType === 'user') {
            requester = await userModel.findById(requesterId);
            requesterModel = 'user';
        } else if (requesterType === 'doctor') {
            requester = await doctorModel.findById(requesterId);
            requesterModel = 'doctor';
        }

        if (!requester) {
            return res.json({ 
                success: false, 
                message: `${requesterType} not found` 
            });
        }

        if (!requester.isBanned) {
            return res.json({ 
                success: false, 
                message: 'Account is not banned' 
            });
        }

        // Check if user has exceeded 3 attempts
        if (requester.unbanRequestAttempts >= 3) {
            return res.json({ 
                success: false, 
                message: 'You have exceeded the maximum number of unban requests (3 attempts). Please contact support directly.' 
            });
        }

        // Check if there's already a pending request
        const existingRequest = await unbanRequestModel.findOne({
            requesterId: requesterId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.json({ 
                success: false, 
                message: 'You already have a pending unban request' 
            });
        }

        // Increment unban request attempts
        requester.unbanRequestAttempts += 1;
        await requester.save();

        // Create unban request
        const unbanRequest = new unbanRequestModel({
            requesterType,
            requesterId,
            requesterModel,
            requesterName: requester.name,
            requesterEmail: requester.email,
            banReason: requester.banReason,
            requestMessage,
            status: 'pending'
        });

        await unbanRequest.save();

        res.json({ 
            success: true, 
            message: 'Unban request submitted successfully. Admin will review your request.' 
        });

    } catch (error) {
        console.error('Error submitting unban request:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get all unban requests (Admin only)
export const getAllUnbanRequests = async (req, res) => {
    try {
        const requests = await unbanRequestModel.find()
            .sort({ createdAt: -1 })
            .populate('reviewedBy', 'name email');

        res.json({ 
            success: true, 
            requests 
        });

    } catch (error) {
        console.error('Error fetching unban requests:', error);
        res.json({ success: false, message: error.message });
    }
};

// Approve unban request (Admin only)
export const approveUnbanRequest = async (req, res) => {
    try {
        const { requestId, adminId, adminResponse } = req.body;

        const request = await unbanRequestModel.findById(requestId);
        if (!request) {
            return res.json({ success: false, message: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.json({ success: false, message: 'Request already processed' });
        }

        // Unban the user/doctor
        let account;
        if (request.requesterType === 'user') {
            account = await userModel.findById(request.requesterId);
        } else {
            account = await doctorModel.findById(request.requesterId);
        }

        if (!account) {
            return res.json({ success: false, message: 'Account not found' });
        }

        // Unban the account
        account.isBanned = false;
        account.banReason = '';
        account.bannedAt = null;
        account.bannedBy = null;
        account.unbanRequestAttempts = 0; // Reset attempts on approval
        
        if (request.requesterType === 'doctor') {
            account.available = true; // Make doctor available again
        }

        await account.save();

        // Update request status
        request.status = 'approved';
        request.adminResponse = adminResponse || 'Your unban request has been approved.';
        if (adminId) {
            request.reviewedBy = adminId;
        }
        request.reviewedAt = new Date();

        await request.save();

        res.json({ 
            success: true, 
            message: `${request.requesterName} has been unbanned successfully` 
        });

    } catch (error) {
        console.error('Error approving unban request:', error);
        res.json({ success: false, message: error.message });
    }
};

// Deny unban request (Admin only)
export const denyUnbanRequest = async (req, res) => {
    try {
        const { requestId, adminId, adminResponse } = req.body;

        const request = await unbanRequestModel.findById(requestId);
        if (!request) {
            return res.json({ success: false, message: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.json({ success: false, message: 'Request already processed' });
        }

        // Update request status
        request.status = 'denied';
        request.adminResponse = adminResponse || 'Your unban request has been denied.';
        if (adminId) {
            request.reviewedBy = adminId;
        }
        request.reviewedAt = new Date();

        await request.save();

        res.json({ 
            success: true, 
            message: 'Unban request denied' 
        });

    } catch (error) {
        console.error('Error denying unban request:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get user's unban request status
export const getMyUnbanRequest = async (req, res) => {
    try {
        const { requesterId } = req.params;

        const request = await unbanRequestModel.findOne({
            requesterId: requesterId
        }).sort({ createdAt: -1 });

        if (!request) {
            return res.json({ 
                success: true, 
                hasRequest: false,
                request: null
            });
        }

        res.json({ 
            success: true, 
            hasRequest: true,
            request 
        });

    } catch (error) {
        console.error('Error fetching unban request:', error);
        res.json({ success: false, message: error.message });
    }
};
