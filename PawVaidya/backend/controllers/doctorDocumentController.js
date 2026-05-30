import doctorModel from '../models/doctorModel.js';
import { v2 as cloudinary } from 'cloudinary';
import { uploadToFirebase, deleteFromFirebase } from '../config/firebase.js';
import fs from 'fs';

// Helper to determine fileType from mimetype
const getFileType = (mimeType) => {
    if (!mimeType) return 'other';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    return 'other';
};

// Doctor: Upload medical document(s)
export const uploadMedicalDocuments = async (req, res) => {
    try {
        const docId = req.docId; // set by authDoctor, survives multer body overwrite
        const { category } = req.body; // 'education' | 'records' | 'govtId' | 'other'
        const files = req.files; // array from multer

        if (!files || files.length === 0) {
            return res.json({ success: false, message: 'No files uploaded' });
        }

        const validCategories = ['education', 'records', 'govtId', 'other'];
        const docCategory = validCategories.includes(category) ? category : 'other';

        const uploadedDocs = [];

        for (const file of files) {
            const mimeType = (file.mimetype || '').toLowerCase();
            const fileType = getFileType(mimeType);
            let url = '';
            let storageProvider = '';

            try {
                if (fileType === 'image') {
                    // Upload image to Cloudinary
                    const result = await cloudinary.uploader.upload(file.path, {
                        resource_type: 'image',
                        folder: 'doctor_documents'
                    });
                    url = result.secure_url;
                    storageProvider = 'cloudinary';

                    // Clean up local file
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                } else {
                    // Upload PDF / other files to Firebase
                    const timestamp = Date.now();
                    const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
                    const destPath = `doctor_documents/${docId}/${timestamp}_${cleanName}`;
                    url = await uploadToFirebase(file.path, destPath, file.mimetype || 'application/octet-stream');
                    storageProvider = 'firebase';
                    // uploadToFirebase already deletes the local file
                }

                uploadedDocs.push({
                    name: file.originalname,
                    url,
                    mimeType: file.mimetype || '',
                    fileType,
                    storageProvider,
                    category: docCategory,
                    verificationStatus: 'pending',
                    adminNote: ''
                });
            } catch (uploadErr) {
                console.error(`Error uploading file ${file.originalname}:`, uploadErr.message);
                // Clean up on error
                if (fs.existsSync(file.path)) {
                    try { fs.unlinkSync(file.path); } catch (e) { }
                }
            }
        }

        if (uploadedDocs.length === 0) {
            return res.json({ success: false, message: 'All file uploads failed' });
        }

        // Save references to the doctor's record
        const doctor = await doctorModel.findByIdAndUpdate(
            docId,
            { $push: { medicalDocuments: { $each: uploadedDocs } } },
            { new: true }
        ).select('medicalDocuments');

        return res.json({
            success: true,
            message: `${uploadedDocs.length} document(s) uploaded successfully`,
            documents: doctor.medicalDocuments
        });
    } catch (error) {
        console.error('Error in uploadMedicalDocuments:', error);
        res.json({ success: false, message: error.message });
    }
};

// Doctor: Get own medical documents
export const getMyMedicalDocuments = async (req, res) => {
    try {
        const docId = req.docId;
        const doctor = await doctorModel.findById(docId).select('medicalDocuments');
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' });

        return res.json({ success: true, documents: doctor.medicalDocuments || [] });
    } catch (error) {
        console.error('Error in getMyMedicalDocuments:', error);
        res.json({ success: false, message: error.message });
    }
};

// Doctor: Delete own medical document
export const deleteMedicalDocument = async (req, res) => {
    try {
        const docId = req.docId;
        const { documentId } = req.body;
        if (!documentId) return res.json({ success: false, message: 'documentId is required' });

        const doctor = await doctorModel.findById(docId).select('medicalDocuments');
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' });

        const doc = doctor.medicalDocuments.id(documentId);
        if (!doc) return res.json({ success: false, message: 'Document not found' });

        // Optionally delete from storage
        try {
            if (doc.storageProvider === 'firebase') {
                await deleteFromFirebase(doc.url);
            } else if (doc.storageProvider === 'cloudinary') {
                // Extract publicId from URL
                const parts = doc.url.split('/');
                const filenameWithExt = parts[parts.length - 1];
                const filename = filenameWithExt.split('.')[0];
                const folder = parts[parts.length - 2];
                await cloudinary.uploader.destroy(`${folder}/${filename}`);
            }
        } catch (delErr) {
            console.warn('Could not delete file from storage:', delErr.message);
        }

        await doctorModel.findByIdAndUpdate(docId, { $pull: { medicalDocuments: { _id: documentId } } });

        return res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error in deleteMedicalDocument:', error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Get all medical documents for a specific doctor
export const getAdminDoctorDocuments = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const doctor = await doctorModel.findById(doctorId).select('medicalDocuments name email');
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' });

        return res.json({
            success: true,
            doctorName: doctor.name,
            doctorEmail: doctor.email,
            documents: doctor.medicalDocuments || []
        });
    } catch (error) {
        console.error('Error in getAdminDoctorDocuments:', error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Update document verification status
export const verifyDoctorDocument = async (req, res) => {
    try {
        const { doctorId, documentId, verificationStatus, adminNote } = req.body;
        const validStatuses = ['pending', 'verified', 'rejected'];
        if (!validStatuses.includes(verificationStatus)) {
            return res.json({ success: false, message: 'Invalid verification status' });
        }

        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' });

        const doc = doctor.medicalDocuments.id(documentId);
        if (!doc) return res.json({ success: false, message: 'Document not found' });

        doc.verificationStatus = verificationStatus;
        doc.adminNote = adminNote || '';
        await doctor.save();

        return res.json({ success: true, message: `Document marked as ${verificationStatus}` });
    } catch (error) {
        console.error('Error in verifyDoctorDocument:', error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Delete a document
export const adminDeleteDoctorDocument = async (req, res) => {
    try {
        const { doctorId, documentId } = req.body;

        const doctor = await doctorModel.findById(doctorId).select('medicalDocuments');
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' });

        const doc = doctor.medicalDocuments.id(documentId);
        if (!doc) return res.json({ success: false, message: 'Document not found' });

        try {
            if (doc.storageProvider === 'firebase') {
                await deleteFromFirebase(doc.url);
            } else if (doc.storageProvider === 'cloudinary') {
                const parts = doc.url.split('/');
                const filenameWithExt = parts[parts.length - 1];
                const filename = filenameWithExt.split('.')[0];
                const folder = parts[parts.length - 2];
                await cloudinary.uploader.destroy(`${folder}/${filename}`);
            }
        } catch (delErr) {
            console.warn('Could not delete file from storage:', delErr.message);
        }

        await doctorModel.findByIdAndUpdate(doctorId, { $pull: { medicalDocuments: { _id: documentId } } });

        return res.json({ success: true, message: 'Document deleted by admin' });
    } catch (error) {
        console.error('Error in adminDeleteDoctorDocument:', error);
        res.json({ success: false, message: error.message });
    }
};
