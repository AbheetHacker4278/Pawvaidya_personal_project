import mongoose from 'mongoose'

const vaccinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date },
  notes: { type: String }
}, { _id: true })

const visitNoteSchema = new mongoose.Schema({
  appointmentId: { type: String },
  doctorId: { type: String },
  date: { type: Date, default: Date.now },
  notes: { type: String }
}, { _id: true })

const petReportSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  doctorId: { type: String },
  petName: { type: String, required: true },
  species: { type: String },
  breed: { type: String },
  gender: { type: String },
  color: { type: String },
  weight: { type: String },
  age: { type: String },
  birthDate: { type: Date },
  allergies: { type: String },
  existingConditions: { type: String },
  veterinarian: { type: String },
  vaccinations: [vaccinationSchema],
  visitNotes: [visitNoteSchema],
  attachments: [{ url: String, type: String, filename: String }],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true })

const petReportModel = mongoose.models.petReport || mongoose.model('petReport', petReportSchema)

export default petReportModel

