import express from 'express';
import {
    createEmployee,
    getAllEmployees,
    getEmployeeStats,
    suspendEmployee,
    unsuspendEmployee,
    grantReward,
    getAllTickets,
    generateEmployeeReport,
    getAllReports,
    setIncentive,
    resendReportEmail
} from '../controllers/csAdminController.js';
import authAdmin from '../middleware/authAdmin.js';

const router = express.Router();

// All routes require admin token
router.post('/create-employee', authAdmin, createEmployee);
router.get('/all-employees', authAdmin, getAllEmployees);
router.get('/employee/:id/stats', authAdmin, getEmployeeStats);
router.put('/suspend/:id', authAdmin, suspendEmployee);
router.put('/unsuspend/:id', authAdmin, unsuspendEmployee);
router.post('/reward/:id', authAdmin, grantReward);
router.get('/all-tickets', authAdmin, getAllTickets);
router.post('/generate-report/:id', authAdmin, generateEmployeeReport);
router.get('/reports', authAdmin, getAllReports);
router.post('/set-incentive/:id', authAdmin, setIncentive);
router.post('/resend-report/:id', authAdmin, resendReportEmail);

export default router;
