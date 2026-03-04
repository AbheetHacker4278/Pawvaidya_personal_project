import express from 'express'
import { getMessages, sendMessage, markAsRead, getUnreadCount } from '../controllers/chatController.js'
import { uploadChatFile } from '../controllers/fileUploadController.js'
import multer from 'multer'

const chatRouter = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage })

// Routes accessible by both users and doctors (no auth middleware needed as we handle tokens in frontend)
chatRouter.get('/messages/:appointmentId', getMessages)
chatRouter.post('/send', sendMessage)
chatRouter.post('/upload-file', upload.single('file'), uploadChatFile)
chatRouter.post('/mark-read', markAsRead)
chatRouter.get('/unread/:appointmentId/:userId', getUnreadCount)

// Direct Chat Routes
import { sendDirectMessage, getDirectMessages, getAdminConversations, markDirectMessagesRead, getAdminId } from '../controllers/directChatController.js'

chatRouter.post('/direct/send', sendDirectMessage)
chatRouter.get('/direct/history/:user1Id/:user2Id', getDirectMessages)
chatRouter.post('/direct/admin-conversations', getAdminConversations)
chatRouter.post('/direct/mark-read', markDirectMessagesRead)
chatRouter.get('/direct/get-admin-id', getAdminId)

export default chatRouter
