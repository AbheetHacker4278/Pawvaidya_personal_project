import { uploadFile } from "../utils/uploadHelper.js"
import chatMessageModel from "../models/chatMessageModel.js"
import appointmentModel from "../models/appointmentModel.js"
import directMessageModel from "../models/directMessageModel.js"
import { getIO } from "../socketServer.js"

// Upload file for chat
const uploadChatFile = async (req, res) => {
    try {
        const { appointmentId, senderId, senderType, message } = req.body
        const file = req.file

        console.log('Upload chat file request:', { appointmentId, senderId, senderType, hasFile: !!file })

        if (!file) {
            return res.json({ success: false, message: "No file uploaded" })
        }

        // Verify appointment exists
        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" })
        }

        // Upload using our helper
        const uploadResult = await uploadFile(file, 'chat_files');
        
        // Determine messageType for model compatibility
        const messageType = uploadResult.type === 'image' ? 'image' : 
                            (file.mimetype.toLowerCase().startsWith('video/') ? 'video' : 'file');

        console.log('File uploaded successfully:', uploadResult.url)

        // Create new message with file
        const newMessage = new chatMessageModel({
            appointmentId,
            senderId,
            senderType,
            message: message || '',
            messageType,
            fileUrl: uploadResult.url,
            fileName: file.originalname,
            fileSize: file.size,
            timestamp: new Date()
        })

        await newMessage.save()
        console.log('Message with file saved:', newMessage._id)

        res.json({ 
            success: true, 
            message: "File uploaded successfully", 
            data: newMessage 
        })
    } catch (error) {
        console.log('Error in uploadChatFile:', error)
        res.json({ success: false, message: error.message })
    }
}

// Upload file for Direct Chat (Admin <-> CS Agent)
const uploadDirectChatFile = async (req, res) => {
    try {
        const { senderId, senderModel, receiverId, receiverModel, message } = req.body
        const file = req.file

        if (!file) return res.json({ success: false, message: "No file uploaded" })

        // Upload using our helper
        const uploadResult = await uploadFile(file, 'direct_chat_files');
        
        // Determine fileType
        const fileType = uploadResult.type === 'image' ? 'image' : 
                         (file.mimetype.toLowerCase().startsWith('video/') ? 'video' : 'file');

        const newMessage = new directMessageModel({
            senderId,
            senderModel,
            receiverId,
            receiverModel,
            message: message || '',
            fileUrl: uploadResult.url,
            fileType,
            fileName: file.originalname,
            timestamp: new Date()
        })

        await newMessage.save()

        // Socket emit
        const io = getIO()
        const messageData = newMessage.toObject()
        io.to(`user-${receiverId}`).emit('receive-direct-message', messageData)

        res.json({ success: true, message: "File sent", data: newMessage })
    } catch (error) {
        console.error('Error in uploadDirectChatFile:', error)
        res.json({ success: false, message: error.message })
    }
}

export { uploadChatFile, uploadDirectChatFile }
