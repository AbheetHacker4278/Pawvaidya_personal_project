import appIssueReportModel from '../models/appIssueReportModel.js';
import userModel from '../models/userModel.js';

// Submit an application issue report (User)
const submitAppIssueReport = async (req, res) => {
    try {
        const { userId, subject, description, category } = req.body;

        if (!userId || !subject || !description || !category) {
            return res.json({ success: false, message: 'All fields are required' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const report = new appIssueReportModel({
            userId,
            userName: user.name,
            userEmail: user.email,
            subject,
            description,
            category,
            status: 'pending'
        });

        await report.save();

        res.json({
            success: true,
            message: 'Issue report submitted successfully. Thank you for your feedback!'
        });

    } catch (error) {
        console.error('Error submitting app issue report:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get all application issue reports (Admin)
const getAllAppIssueReports = async (req, res) => {
    try {
        const reports = await appIssueReportModel.find({}).sort({ createdAt: -1 });
        res.json({ success: true, reports });
    } catch (error) {
        console.error('Error fetching app issue reports:', error);
        res.json({ success: false, message: error.message });
    }
};

// Update issue report status (Admin)
const updateAppIssueReportStatus = async (req, res) => {
    try {
        const { reportId, status, adminNotes } = req.body;

        if (!reportId || !status) {
            return res.json({ success: false, message: 'Report ID and status are required' });
        }

        const report = await appIssueReportModel.findById(reportId);
        if (!report) {
            return res.json({ success: false, message: 'Report not found' });
        }

        report.status = status;
        if (adminNotes !== undefined) {
            report.adminNotes = adminNotes;
        }

        await report.save();

        res.json({
            success: true,
            message: 'Report status updated successfully',
            report
        });

    } catch (error) {
        console.error('Error updating app issue report status:', error);
        res.json({ success: false, message: error.message });
    }
};

export { submitAppIssueReport, getAllAppIssueReports, updateAppIssueReportStatus };
