import petReportModel from '../models/petReportModel.js'
import appointmentModel from '../models/appointmentModel.js'
import userModel from '../models/userModel.js'
import doctorModel from '../models/doctorModel.js'
import { v2 as cloudinary } from 'cloudinary'
import { transporter } from '../config/nodemailer.js'
import { VISIT_NOTE_EMAIL, PET_REPORT_EMAIL } from '../mailservice/petReportEmailTemplate.js'

export const createPetReport = async (req, res) => {
  try {
    const { userId } = req.body
    const data = req.body
    if (!data.petName || !userId) {
      return res.json({ success: false, message: 'petName and userId are required' })
    }
    const report = new petReportModel({ ...data })
    await report.save()

    // Send email notification to user
    try {
      const userData = await userModel.findById(userId)
      const doctorData = await doctorModel.findById(data.doctorId || data.docId) // Support both field names

      if (userData && doctorData) {
        const mailOptions = {
          from: process.env.SENDER_EMAIL,
          to: userData.email,
          subject: `Medical Report: ${data.petName}`,
          html: PET_REPORT_EMAIL(userData, doctorData, report)
        }
        await transporter.sendMail(mailOptions)
      }
    } catch (mailError) {
      console.error('Failed to send report email:', mailError.message)
    }

    return res.json({ success: true, message: 'Pet report created', data: report })
  } catch (e) {
    return res.json({ success: false, message: e.message })
  }
}

export const getUserPetReports = async (req, res) => {
  try {
    const { userId } = req.body
    const reports = await petReportModel.find({ userId, isDeleted: false }).sort({ updatedAt: -1 })
    return res.json({ success: true, reports })
  } catch (e) {
    return res.json({ success: false, message: e.message })
  }
}

export const doctorGetUserPetReports = async (req, res) => {
  try {
    const { userId } = req.params
    const reports = await petReportModel.find({ userId, isDeleted: false }).sort({ updatedAt: -1 })
    return res.json({ success: true, reports })
  } catch (e) {
    return res.json({ success: false, message: e.message })
  }
}

export const getPetReportById = async (req, res) => {
  try {
    const { reportId } = req.params
    const report = await petReportModel.findById(reportId)
    if (!report || report.isDeleted) return res.json({ success: false, message: 'Report not found' })
    return res.json({ success: true, report })
  } catch (e) {
    return res.json({ success: false, message: e.message })
  }
}

export const updatePetReport = async (req, res) => {
  try {
    const { reportId } = req.params
    const updateData = req.body
    const report = await petReportModel.findById(reportId)
    if (!report || report.isDeleted) return res.json({ success: false, message: 'Report not found' })
    // User can update own report; doctor can update if has appointment linkage (validated in afterAppointmentNote)
    await petReportModel.findByIdAndUpdate(reportId, { $set: updateData })
    const updated = await petReportModel.findById(reportId)
    return res.json({ success: true, message: 'Pet report updated', report: updated })
  } catch (e) {
    return res.json({ success: false, message: e.message })
  }
}

export const deletePetReport = async (req, res) => {
  try {
    const { reportId } = req.params
    await petReportModel.findByIdAndUpdate(reportId, { isDeleted: true })
    return res.json({ success: true, message: 'Pet report deleted' })
  } catch (e) {
    return res.json({ success: false, message: e.message })
  }
}

export const addVaccination = async (req, res) => {
  try {
    const { reportId } = req.params
    const { name, date, notes } = req.body
    const report = await petReportModel.findById(reportId)
    if (!report || report.isDeleted) return res.json({ success: false, message: 'Report not found' })
    report.vaccinations.push({ name, date, notes })
    await report.save()
    return res.json({ success: true, message: 'Vaccination added', report })
  } catch (e) {
    return res.json({ success: false, message: e.message })
  }
}

export const removeVaccination = async (req, res) => {
  try {
    const { reportId, vaccinationId } = req.params
    const report = await petReportModel.findById(reportId)
    if (!report || report.isDeleted) return res.json({ success: false, message: 'Report not found' })
    report.vaccinations = report.vaccinations.filter(v => v._id.toString() !== vaccinationId)
    await report.save()
    return res.json({ success: true, message: 'Vaccination removed', report })
  } catch (e) {
    return res.json({ success: false, message: e.message })
  }
}

export const addAttachment = async (req, res) => {
  try {
    const { reportId } = req.params
    const report = await petReportModel.findById(reportId)
    if (!report || report.isDeleted) return res.json({ success: false, message: 'Report not found' })
    const files = req.files || []
    for (const file of files) {
      const uploadResult = await cloudinary.uploader.upload(file.path, { resource_type: 'auto', folder: 'pet_reports' })
      const fileType = uploadResult.resource_type === 'video' ? 'video' : 'image'
      report.attachments.push({ url: uploadResult.secure_url, type: fileType, filename: file.originalname })
    }
    await report.save()
    return res.json({ success: true, message: 'Attachments added', report })
  } catch (e) {
    return res.json({ success: false, message: e.message })
  }
}

export const afterAppointmentNote = async (req, res) => {
  try {
    const { docId } = req.body
    const { reportId, appointmentId, notes } = req.body
    const report = await petReportModel.findById(reportId)
    if (!report || report.isDeleted) return res.json({ success: false, message: 'Report not found' })
    const appt = await appointmentModel.findById(appointmentId)
    if (!appt) return res.json({ success: false, message: 'Appointment not found' })
    if (appt.docId !== docId || appt.userId !== report.userId) {
      return res.json({ success: false, message: 'Unauthorized: appointment does not match report/user' })
    }
    report.visitNotes.push({ appointmentId, doctorId: docId, notes })
    await report.save()

    // Send email notification to user
    try {
      const userData = await userModel.findById(report.userId)
      const doctorData = await doctorModel.findById(docId)

      if (userData && doctorData) {
        const mailOptions = {
          from: process.env.SENDER_EMAIL,
          to: userData.email,
          subject: `Consultation Notes for ${report.petName}`,
          html: VISIT_NOTE_EMAIL(userData, doctorData, appt, notes)
        }
        await transporter.sendMail(mailOptions)
      }
    } catch (mailError) {
      console.error('Failed to send visit note email:', mailError.message)
    }

    return res.json({ success: true, message: 'Visit note added', report })
  } catch (e) {
    return res.json({ success: false, message: e.message })
  }
}
