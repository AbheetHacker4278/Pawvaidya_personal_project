import directMessageModel from "../models/directMessageModel.js";
import doctorModel from "../models/doctorModel.js";
import adminModel from "../models/adminModel.js";
import csEmployeeModel from "../models/csEmployeeModel.js";
import { getIO } from "../socketServer.js";

// Send a direct message
export const sendDirectMessage = async (req, res) => {
    try {
        const { senderId, senderModel, receiverId, receiverModel, message, fileUrl, fileType, fileName } = req.body;

        const newMessage = new directMessageModel({
            senderId,
            senderModel,
            receiverId,
            receiverModel,
            message,
            fileUrl,
            fileType,
            fileName
        });

        await newMessage.save();

        // Emit socket event for real-time delivery
        const io = getIO();
        const room = `user-${receiverId}`;
        const messageData = newMessage.toObject();
        io.to(room).emit('receive-direct-message', messageData);

        res.json({ success: true, message: "Message sent", data: newMessage });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Get chat history between two users
export const getDirectMessages = async (req, res) => {
    try {
        const { user1Id, user2Id } = req.params;

        const messages = await directMessageModel.find({
            $or: [
                { senderId: user1Id, receiverId: user2Id },
                { senderId: user2Id, receiverId: user1Id }
            ]
        }).sort({ timestamp: 1 });

        res.json({ success: true, messages });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Get list of doctors with last message (For Admin)
export const getAdminConversations = async (req, res) => {
    try {
        const { adminId } = req.body;
        const doctors = await doctorModel.find({}).select('_id name image available');

        const conversations = await Promise.all(doctors.map(async (doc) => {
            const lastMessage = await directMessageModel.findOne({
                $or: [
                    { senderId: doc._id, receiverId: adminId },
                    { senderId: adminId, receiverId: doc._id }
                ]
            }).sort({ timestamp: -1 });

            const unreadCount = await directMessageModel.countDocuments({
                senderId: doc._id,
                receiverId: adminId,
                isRead: false
            });

            return {
                _id: doc._id,
                name: doc.name,
                image: doc.image,
                available: doc.available,
                lastMessage: lastMessage ? lastMessage.message || (lastMessage.fileType ? `Sent a ${lastMessage.fileType}` : '') : '',
                lastMessageTime: lastMessage ? lastMessage.timestamp : null,
                unreadCount
            };
        }));

        conversations.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
        res.json({ success: true, conversations });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Get list of CS Agents with last message (For Admin)
export const getCSConversations = async (req, res) => {
    try {
        const { adminId } = req.body;
        const agents = await csEmployeeModel.find({}).select('_id name profilePic status');

        const conversations = await Promise.all(agents.map(async (agent) => {
            const lastMessage = await directMessageModel.findOne({
                $or: [
                    { senderId: agent._id, receiverId: adminId },
                    { senderId: adminId, receiverId: agent._id }
                ]
            }).sort({ timestamp: -1 });

            const unreadCount = await directMessageModel.countDocuments({
                senderId: agent._id,
                receiverId: adminId,
                isRead: false
            });

            return {
                _id: agent._id,
                name: agent.name,
                image: agent.profilePic,
                available: agent.status === 'active',
                lastMessage: lastMessage ? lastMessage.message || (lastMessage.fileType ? `Sent a ${lastMessage.fileType}` : '') : '',
                lastMessageTime: lastMessage ? lastMessage.timestamp : null,
                unreadCount
            };
        }));

        conversations.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
        res.json({ success: true, conversations });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Mark messages as read
export const markDirectMessagesRead = async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;

        await directMessageModel.updateMany(
            { senderId, receiverId, isRead: false },
            { isRead: true }
        );

        res.json({ success: true, message: "Messages marked as read" });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Get Admin ID (For Doctor/CS to initiate chat)
export const getAdminId = async (req, res) => {
    try {
        const admin = await adminModel.findOne({});
        if (admin) {
            res.json({ success: true, adminId: admin._id });
        } else {
            res.json({ success: false, message: "No admin found" });
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};
