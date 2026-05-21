import CrueltyReport from '../models/crueltyReportModel.js';
import { v2 as cloudinary } from 'cloudinary';
import { transporter } from '../config/nodemailer.js';

// POST /api/cruelty-report/submit
export const submitReport = async (req, res) => {
    try {
        const { userId, reporterName, reporterEmail, reporterPhone, incidentDate, incidentLocation, incidentDescription, animalType } = req.body;
        
        // Handle images upload
        const imageFiles = req.files;
        let images = [];
        
        if (imageFiles && imageFiles.length > 0) {
            for (const file of imageFiles) {
                const result = await cloudinary.uploader.upload(file.path, { folder: 'cruelty_reports', resource_type: 'image' });
                images.push(result.secure_url);
            }
        }

        const newReport = new CrueltyReport({
            userId: userId || null,
            reporterName,
            reporterEmail,
            reporterPhone,
            incidentDate,
            incidentLocation,
            incidentDescription,
            animalType,
            images
        });

        await newReport.save();

        // Send confirmation email
        try {
            await transporter.sendMail({
                from: process.env.SENDER_EMAIL,
                to: reporterEmail,
                subject: 'Animal Cruelty Report Received',
                html: `
                    <h2>Thank you for your report</h2>
                    <p>Dear ${reporterName},</p>
                    <p>We have successfully received your report regarding the <strong>${animalType}</strong> incident at <strong>${incidentLocation}</strong>.</p>
                    <p>Your unique Report ID is: <strong>${newReport._id}</strong></p>
                    <p>You can use this ID to track the status of your report on our website.</p>
                    <p>Your report has been marked as <strong>Pending</strong> and is queued for review by our administration. Rest assured that we take these matters very seriously and will pass this on to the appropriate authorities if necessary.</p>
                    <p>Thank you for being vigilant and helping us protect animals.</p>
                    <br/>
                    <p>Sincerely,</p>
                    <p><strong>PawVaidya Support Team</strong></p>
                `
            });
        } catch (emailError) {
            console.error('Failed to send cruelty report email:', emailError);
            // We don't fail the request if email fails
        }

        res.json({ success: true, message: 'Report submitted successfully. Thank you for your vigilance.', reportId: newReport._id });

    } catch (error) {
        console.error('Error submitting cruelty report:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cruelty-report/track/:reportId
export const trackReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const report = await CrueltyReport.findById(reportId).select('status animalType incidentDate incidentLocation createdAt adminNotes');
        if (!report) {
            return res.json({ success: false, message: 'Report not found with the provided ID.' });
        }
        res.json({ success: true, report });
    } catch (error) {
        res.json({ success: false, message: 'Invalid Report ID format or error fetching report.' });
    }
};

// GET /api/cruelty-report/admin/all
export const getAllReports = async (req, res) => {
    try {
        const reports = await CrueltyReport.find().sort({ createdAt: -1 });
        res.json({ success: true, reports });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cruelty-report/admin/update-status
export const updateReportStatus = async (req, res) => {
    try {
        const { reportId, status, adminNotes } = req.body;
        await CrueltyReport.findByIdAndUpdate(reportId, { status, adminNotes });
        res.json({ success: true, message: 'Report status updated' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
