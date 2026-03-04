import { v2 as cloudinary } from 'cloudinary'
import chatMessageModel from "../models/chatMessageModel.js"
import appointmentModel from "../models/appointmentModel.js"

// Delete all chat files for a completed appointment
const deleteAppointmentChatFiles = async (req, res) => {
    try {
        const { appointmentId } = req.params

        console.log('Deleting chat files for appointment:', appointmentId)

        // Verify appointment exists and is completed
        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" })
        }

        if (!appointment.isCompleted) {
            return res.json({ success: false, message: "Appointment is not completed yet" })
        }

        // Get all messages with files for this appointment
        const messagesWithFiles = await chatMessageModel.find({
            appointmentId,
            fileUrl: { $exists: true, $ne: null }
        })

        console.log(`Found ${messagesWithFiles.length} messages with files`)

        let deletedCount = 0
        let failedCount = 0

        // Delete each file from Cloudinary
        for (const message of messagesWithFiles) {
            try {
                // Extract public_id from Cloudinary URL
                const urlParts = message.fileUrl.split('/')
                const fileNameWithExt = urlParts[urlParts.length - 1]
                const publicId = `chat_files/${fileNameWithExt.split('.')[0]}`

                console.log('Deleting file:', publicId)

                // Delete from Cloudinary
                const result = await cloudinary.uploader.destroy(publicId, {
                    resource_type: message.messageType === 'video' ? 'video' : 'image'
                })

                if (result.result === 'ok') {
                    deletedCount++
                    console.log('Successfully deleted:', publicId)
                } else {
                    failedCount++
                    console.log('Failed to delete:', publicId, result)
                }
            } catch (error) {
                failedCount++
                console.error('Error deleting file:', error)
            }
        }

        // Update messages to remove file references
        await chatMessageModel.updateMany(
            { appointmentId, fileUrl: { $exists: true, $ne: null } },
            {
                $set: {
                    fileUrl: null,
                    fileName: null,
                    fileSize: null,
                    message: '[File deleted - appointment completed]'
                }
            }
        )

        res.json({
            success: true,
            message: "Chat files deleted successfully",
            deletedCount,
            failedCount,
            totalFiles: messagesWithFiles.length
        })
    } catch (error) {
        console.log('Error in deleteAppointmentChatFiles:', error)
        res.json({ success: false, message: error.message })
    }
}

// Automatically delete files when appointment is marked as completed
const autoDeleteFilesOnCompletion = async (appointmentId) => {
    try {
        console.log('Auto-deleting files for completed appointment:', appointmentId)

        // Get all messages with files
        const messagesWithFiles = await chatMessageModel.find({
            appointmentId,
            fileUrl: { $exists: true, $ne: null }
        })

        console.log(`Auto-cleanup: Found ${messagesWithFiles.length} files to delete`)

        for (const message of messagesWithFiles) {
            try {
                // Extract public_id from Cloudinary URL
                const urlParts = message.fileUrl.split('/')
                const fileNameWithExt = urlParts[urlParts.length - 1]
                const publicId = `chat_files/${fileNameWithExt.split('.')[0]}`

                // Delete from Cloudinary
                await cloudinary.uploader.destroy(publicId, {
                    resource_type: message.messageType === 'video' ? 'video' : 'image'
                })

                console.log('Auto-deleted file:', publicId)
            } catch (error) {
                console.error('Error auto-deleting file:', error)
            }
        }

        // Update messages
        await chatMessageModel.updateMany(
            { appointmentId, fileUrl: { $exists: true, $ne: null } },
            {
                $set: {
                    fileUrl: null,
                    fileName: null,
                    fileSize: null,
                    message: '[File deleted - appointment completed]'
                }
            }
        )

        console.log('Auto-cleanup completed for appointment:', appointmentId)
    } catch (error) {
        console.error('Error in autoDeleteFilesOnCompletion:', error)
    }
}

export { deleteAppointmentChatFiles, autoDeleteFilesOnCompletion }
