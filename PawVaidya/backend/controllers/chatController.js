import chatMessageModel from "../models/chatMessageModel.js"
import appointmentModel from "../models/appointmentModel.js"

// Get all messages for a specific appointment
const getMessages = async (req, res) => {
    try {
        const { appointmentId } = req.params

        // Verify appointment exists
        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" })
        }

        // Get all messages for this appointment
        const messages = await chatMessageModel.find({ appointmentId }).sort({ timestamp: 1 })

        res.json({ success: true, messages })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Send a new message
const sendMessage = async (req, res) => {
    try {
        const { appointmentId, senderId, senderType, message } = req.body
        
        console.log('Received chat message:', { appointmentId, senderId, senderType, message })

        // Verify appointment exists
        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment) {
            console.log('Appointment not found:', appointmentId)
            return res.json({ success: false, message: "Appointment not found" })
        }

        // Create new message
        const newMessage = new chatMessageModel({
            appointmentId,
            senderId,
            senderType,
            message,
            timestamp: new Date()
        })

        await newMessage.save()
        console.log('Message saved successfully:', newMessage._id)

        res.json({ success: true, message: "Message sent successfully", data: newMessage })
    } catch (error) {
        console.log('Error in sendMessage:', error)
        res.json({ success: false, message: error.message })
    }
}

// Mark messages as read
const markAsRead = async (req, res) => {
    try {
        const { appointmentId, userId } = req.body

        await chatMessageModel.updateMany(
            { 
                appointmentId, 
                senderId: { $ne: userId },
                isRead: false 
            },
            { isRead: true }
        )

        res.json({ success: true, message: "Messages marked as read" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Get unread message count
const getUnreadCount = async (req, res) => {
    try {
        const { appointmentId, userId } = req.params

        const count = await chatMessageModel.countDocuments({
            appointmentId,
            senderId: { $ne: userId },
            isRead: false
        })

        res.json({ success: true, count })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { getMessages, sendMessage, markAsRead, getUnreadCount }
