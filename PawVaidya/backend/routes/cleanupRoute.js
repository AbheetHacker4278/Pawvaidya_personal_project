import express from 'express'
import { deleteAppointmentChatFiles } from '../controllers/cleanupController.js'
import authAdmin from '../middleware/authAdmin.js'

const cleanupRouter = express.Router()

// Manual cleanup route (admin only)
cleanupRouter.delete('/chat-files/:appointmentId', authAdmin, deleteAppointmentChatFiles)

export default cleanupRouter
