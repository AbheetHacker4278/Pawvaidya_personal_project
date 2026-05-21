import mongoose from 'mongoose';

const crueltyReportSchema = new mongoose.Schema({
    userId: { type: String, default: null },
    reporterName: { type: String, required: true },
    reporterEmail: { type: String, required: true },
    reporterPhone: { type: String, required: true },
    
    incidentDate: { type: Date, required: true },
    incidentLocation: { type: String, required: true },
    incidentDescription: { type: String, required: true },
    
    animalType: { type: String, required: true },
    
    images: { type: Array, default: [] }, // Array of image URLs

    status: { type: String, enum: ['Pending', 'Investigating', 'Resolved', 'Dismissed'], default: 'Pending' },
    adminNotes: { type: String, default: '' },
}, { timestamps: true });

const CrueltyReport = mongoose.models.crueltyReport || mongoose.model('crueltyReport', crueltyReportSchema);
export default CrueltyReport;
