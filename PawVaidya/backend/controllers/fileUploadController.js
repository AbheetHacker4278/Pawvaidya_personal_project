import { v2 as cloudinary } from 'cloudinary'
import chatMessageModel from "../models/chatMessageModel.js"
import appointmentModel from "../models/appointmentModel.js"

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

        // Determine file type
        let messageType = 'file'
        const mimeType = file.mimetype.toLowerCase()
        
        if (mimeType.startsWith('image/')) {
            messageType = 'image'
        } else if (mimeType.startsWith('video/')) {
            messageType = 'video'
        }

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            folder: 'chat_files'
        })

        console.log('File uploaded to Cloudinary:', uploadResult.secure_url)

        // Create new message with file
        const newMessage = new chatMessageModel({
            appointmentId,
            senderId,
            senderType,
            message: message || '',
            messageType,
            fileUrl: uploadResult.secure_url,
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

export { uploadChatFile }
