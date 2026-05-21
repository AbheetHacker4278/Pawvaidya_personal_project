import express from 'express';
import { submitReport, getAllReports, updateReportStatus, trackReport } from '../controllers/crueltyReportController.js';
import upload from '../middleware/multer.js';
import authAdmin from '../middleware/authAdmin.js';

import authUser from '../middleware/authuser.js';

const crueltyReportRouter = express.Router();

// Public endpoint for users to submit a report (up to 5 images)
crueltyReportRouter.post('/submit', upload.array('images', 5), submitReport);

// Public endpoint for users to track a report by ID
crueltyReportRouter.get('/track/:reportId', trackReport);

// Protected endpoint for user to get their own reports
crueltyReportRouter.get('/my-reports', authUser, async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Find user to get their email
        const user = await import('../models/userModel.js').then(m => m.default.findById(userId));
        const userEmail = user ? user.email : null;

        // Find reports where userId matches OR reporterEmail matches
        const query = userEmail 
            ? { $or: [{ userId }, { reporterEmail: userEmail }] }
            : { userId };

        const reports = await import('../models/crueltyReportModel.js').then(m => m.default.find(query).sort({ createdAt: -1 }));
        res.json({ success: true, reports });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// Admin endpoints
crueltyReportRouter.get('/admin/all', authAdmin, getAllReports);
crueltyReportRouter.post('/admin/update-status', authAdmin, updateReportStatus);

export default crueltyReportRouter;
