import express from 'express';
import {
    submitAppIssueReport,
    getAllAppIssueReports,
    updateAppIssueReportStatus
} from '../controllers/appIssueReportController.js';
import authuser from '../middleware/authuser.js';
import authAdmin from '../middleware/authAdmin.js';

const appIssueReportRouter = express.Router();

// User route to submit a report
appIssueReportRouter.post('/submit', authuser, submitAppIssueReport);

// Admin routes to view and manage reports
appIssueReportRouter.get('/all', authAdmin, getAllAppIssueReports);
appIssueReportRouter.post('/update-status', authAdmin, updateAppIssueReportStatus);

export default appIssueReportRouter;
