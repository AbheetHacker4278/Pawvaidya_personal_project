import roomModel from '../models/roomModel.js';
import userModel from '../models/userModel.js';
import { logActivity } from '../utils/activityLogger.js';

// Create a new room
export const createRoom = async (req, res) => {
    try {
        const { userId, name, description, rules, isPrivate } = req.body;

        if (!name || !description) {
            return res.json({ success: false, message: 'Name and description are required' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const room = new roomModel({
            name: name.trim(),
            description: description.trim(),
            ownerId: userId,
            rules: rules ? rules.trim() : '',
            isPrivate: isPrivate !== undefined ? isPrivate : true,
            members: [{ userId, joinedAt: new Date() }] // Owner is automatically a member
        });

        await room.save();

        await logActivity(
            userId.toString(),
            'user',
            'room_create',
            `Created room: ${name}`,
            req,
            { roomId: room._id, name }
        );

        res.json({ success: true, message: 'Room created successfully', room });
    } catch (error) {
        console.error('Error creating room:', error);
        res.json({ success: false, message: error.message || 'Failed to create room' });
    }
};

// Get all rooms (directory view)
export const getAllRooms = async (req, res) => {
    try {
        const rooms = await roomModel.find({}).sort({ createdAt: -1 });

        // Fetch owner details for each room to display created by info
        const roomOwnersIds = [...new Set(rooms.map(r => r.ownerId))];
        const owners = await userModel.find({ _id: { $in: roomOwnersIds } }).select('name image');
        const ownerMap = {};
        owners.forEach(o => ownerMap[o._id.toString()] = o);

        const enrichedRooms = rooms.map(room => {
            const r = room.toObject();
            r.ownerData = ownerMap[r.ownerId] || null;
            r.memberCount = r.members.length;

            // Don't send the full members/pending list to the global directory view for privacy
            // The client only needs to know if they are a member or pending
            delete r.members;
            delete r.pendingRequests;

            return r;
        });

        res.json({ success: true, rooms: enrichedRooms });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.json({ success: false, message: error.message || 'Failed to fetch rooms' });
    }
};

// Get a single room
export const getRoomById = async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await roomModel.findById(roomId);

        if (!room) {
            return res.json({ success: false, message: 'Room not found' });
        }

        const ownerData = await userModel.findById(room.ownerId).select('name image');
        const enrichedRoom = room.toObject();
        enrichedRoom.ownerData = ownerData;
        enrichedRoom.memberCount = room.members.length;

        res.json({ success: true, room: enrichedRoom });
    } catch (error) {
        console.error('Error fetching room:', error);
        res.json({ success: false, message: error.message || 'Failed to fetch room' });
    }
};

// Get room details specifically for the owner (includes full members and pending users data)
export const getRoomManagementData = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { userId } = req.body; // Authenticated user ID

        const room = await roomModel.findById(roomId);

        if (!room) {
            return res.json({ success: false, message: 'Room not found' });
        }

        if (room.ownerId !== userId) {
            return res.json({ success: false, message: 'Unauthorized. Only the owner can view management data.' });
        }

        // Fetch user data for all members and pending requests
        const memberIds = room.members.map(m => m.userId);
        const pendingIds = room.pendingRequests.map(p => p.userId);
        const allUserIds = [...new Set([...memberIds, ...pendingIds])];

        const users = await userModel.find({ _id: { $in: allUserIds } }).select('name image email');
        const userMap = {};
        users.forEach(u => userMap[u._id.toString()] = u);

        const enrichedMembers = room.members.map(m => ({
            ...m.toObject(),
            userData: userMap[m.userId] || null
        }));

        const enrichedPending = room.pendingRequests.map(p => ({
            ...p.toObject(),
            userData: userMap[p.userId] || null
        }));

        res.json({
            success: true,
            members: enrichedMembers,
            pendingRequests: enrichedPending
        });

    } catch (error) {
        console.error('Error fetching room management data:', error);
        res.json({ success: false, message: error.message || 'Failed to fetch room management data' });
    }
}


// Request to join a room
export const requestJoinRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { userId } = req.body;

        const room = await roomModel.findById(roomId);
        if (!room) return res.json({ success: false, message: 'Room not found' });

        // Check if already a member
        if (room.members.some(m => m.userId === userId)) {
            return res.json({ success: false, message: 'You are already a member of this room' });
        }

        // Check if request already pending
        if (room.pendingRequests.some(p => p.userId === userId)) {
            return res.json({ success: false, message: 'Join request already pending' });
        }

        // Add to pending requests
        room.pendingRequests.push({ userId, requestedAt: new Date() });
        await room.save();

        await logActivity(userId.toString(), 'user', 'room_join_request', `Requested to join room: ${room.name}`, req, { roomId });

        res.json({ success: true, message: 'Join request sent successfully' });
    } catch (error) {
        console.error('Error requesting to join room:', error);
        res.json({ success: false, message: error.message || 'Failed to request joining room' });
    }
};

// Approve a join request
export const approveJoinRequest = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { userId, targetUserId } = req.body; // userId is owner, targetUserId is the requester

        const room = await roomModel.findById(roomId);
        if (!room) return res.json({ success: false, message: 'Room not found' });

        if (room.ownerId !== userId) {
            return res.json({ success: false, message: 'Only the room owner can approve requests' });
        }

        // Remove from pending
        const pendingIndex = room.pendingRequests.findIndex(p => p.userId === targetUserId);
        if (pendingIndex === -1) {
            return res.json({ success: false, message: 'Join request not found' });
        }
        room.pendingRequests.splice(pendingIndex, 1);

        // Add to members
        if (!room.members.some(m => m.userId === targetUserId)) {
            room.members.push({ userId: targetUserId, joinedAt: new Date() });
        }

        await room.save();
        res.json({ success: true, message: 'Request approved successfully' });
    } catch (error) {
        console.error('Error approving request:', error);
        res.json({ success: false, message: error.message || 'Failed to approve request' });
    }
};

// Reject a join request
export const rejectJoinRequest = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { userId, targetUserId } = req.body; // userId is owner, targetUserId is the requester

        const room = await roomModel.findById(roomId);
        if (!room) return res.json({ success: false, message: 'Room not found' });

        if (room.ownerId !== userId) {
            return res.json({ success: false, message: 'Only the room owner can reject requests' });
        }

        // Remove from pending
        room.pendingRequests = room.pendingRequests.filter(p => p.userId !== targetUserId);
        await room.save();

        res.json({ success: true, message: 'Request rejected successfully' });
    } catch (error) {
        console.error('Error rejecting request:', error);
        res.json({ success: false, message: error.message || 'Failed to reject request' });
    }
};

// Delete a room
export const deleteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { userId } = req.body; // from authUser middleware

        const room = await roomModel.findById(roomId);
        if (!room) return res.json({ success: false, message: 'Room not found' });

        if (room.ownerId !== userId && room.ownerId.toString() !== userId) {
            return res.json({ success: false, message: 'Only the room owner can delete this room' });
        }

        await roomModel.findByIdAndDelete(roomId);

        await logActivity(userId.toString(), 'user', 'room_delete', `Deleted room: ${room.name}`, req, { roomId });

        res.json({ success: true, message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.json({ success: false, message: error.message || 'Failed to delete room' });
    }
};
