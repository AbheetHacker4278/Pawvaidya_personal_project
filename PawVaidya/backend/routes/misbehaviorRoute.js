import express from 'express';
import { reportMisbehavior, getMisbehaviorReports, resolveMisbehaviorReport, sendComplaintAppealEmail, getReportByTicket } from '../controllers/misbehaviorController.js';
import authAdmin from '../middleware/authAdmin.js';
import { authCSEmployee } from '../middleware/authCSEmployee.js';

const router = express.Router();

// CS Agent route
router.post('/report', authCSEmployee, reportMisbehavior);

// Admin routes
router.get('/list', authAdmin, getMisbehaviorReports);
router.post('/resolve', authAdmin, resolveMisbehaviorReport);
router.post('/send-warning', authAdmin, sendComplaintAppealEmail);

// Shared or CS routes
router.get('/ticket/:ticketId', authCSEmployee, getReportByTicket);

export default router;
