import directMessageModel from "../models/directMessageModel.js";
import doctorModel from "../models/doctorModel.js";
import adminModel from "../models/adminModel.js";
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
        io.to(room).emit('receive-direct-message', newMessage);

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
        const doctors = await doctorModel.find({}).select('_id name image available');

        // Fetch last message for each doctor to show snippet/unread count
        const conversations = await Promise.all(doctors.map(async (doc) => {
            const lastMessage = await directMessageModel.findOne({
                $or: [
                    { senderId: doc._id },
                    { receiverId: doc._id }
                ]
            }).sort({ timestamp: -1 });

            const unreadCount = await directMessageModel.countDocuments({
                senderId: doc._id,
                receiverId: req.body.adminId, // Assuming adminId is passed or available
                isRead: false
            });

            return {
                ...doc.toObject(),
                lastMessage: lastMessage ? lastMessage.message || (lastMessage.fileType ? `Sent a ${lastMessage.fileType}` : '') : '',
                lastMessageTime: lastMessage ? lastMessage.timestamp : null,
                unreadCount
            };
        }));

        // Sort by last message time
        conversations.sort((a, b) => {
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
        });

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

// Get Admin ID (For Doctor to initiate chat)
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
