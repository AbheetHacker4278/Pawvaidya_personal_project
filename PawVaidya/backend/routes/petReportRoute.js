import express from 'express'
import authuser from '../middleware/authuser.js'
import {authDoctor} from '../middleware/authDoctor.js'
import upload from '../middleware/multer.js'
import { createPetReport, getUserPetReports, doctorGetUserPetReports, getPetReportById, updatePetReport, deletePetReport, addVaccination, removeVaccination, addAttachment, afterAppointmentNote } from '../controllers/petReportController.js'

const petReportRouter = express.Router()

// User CRUD
petReportRouter.post('/create', authuser, createPetReport)
petReportRouter.post('/list', authuser, getUserPetReports)
petReportRouter.get('/:reportId', authuser, getPetReportById)
petReportRouter.put('/:reportId', authuser, updatePetReport)
petReportRouter.delete('/:reportId', authuser, deletePetReport)

// Vaccinations & attachments
petReportRouter.post('/:reportId/vaccinations', authuser, addVaccination)
petReportRouter.delete('/:reportId/vaccinations/:vaccinationId', authuser, removeVaccination)
petReportRouter.post('/:reportId/attachments', authuser, upload.array('attachments', 5), addAttachment)

// Doctor visit note after appointment
petReportRouter.post('/visit-note', authDoctor, afterAppointmentNote)
petReportRouter.get('/user/:userId', authDoctor, doctorGetUserPetReports)

// Doctor CRUD (when needed)
petReportRouter.post('/doctor/create', authDoctor, createPetReport)
petReportRouter.put('/doctor/:reportId', authDoctor, updatePetReport)
petReportRouter.delete('/doctor/:reportId', authDoctor, deletePetReport)

export default petReportRouter
