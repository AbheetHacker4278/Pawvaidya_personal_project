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
    resendReportEmail,
    getEmployeeShiftLogs,
    getAllEarlyExits,
    adminResetEmployeePassword,
    adminClearResetRequest,
    getTicketAgingHeatmap,
    getResolutionTimeTrend,
    logMonitoringAlert,
    getResponseLagReport,
    getOvertimeUndertimeReport,
    getBreakComplianceReport,
    getSuspiciousLogins,
    getAgentComparisonMatrix,
    raiseComplaint,
    getComplaints,
    updateComplaintStatus,
    acceptEscalatedTicket,
    adminAddTicketNote,
    adminUpdateTicketStatus,
    deleteEmployee
} from '../controllers/csAdminController.js';
import { authCSEmployee } from '../middleware/authCSEmployee.js';
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
router.get('/employee/:id/shift-logs', authAdmin, getEmployeeShiftLogs);
router.get('/early-exits', authAdmin, getAllEarlyExits);
router.post('/employee/:id/reset-password', authAdmin, adminResetEmployeePassword);
router.post('/employee/:id/clear-reset-request', authAdmin, adminClearResetRequest);

// Monitoring intelligence endpoints (Admin only)
router.get('/ticket-aging-heatmap', authAdmin, getTicketAgingHeatmap);
router.get('/resolution-trend', authAdmin, getResolutionTimeTrend);
router.get('/response-lag-report', authAdmin, getResponseLagReport);
router.get('/overtime-undertime-report', authAdmin, getOvertimeUndertimeReport);
router.get('/break-compliance-report', authAdmin, getBreakComplianceReport);
router.get('/suspicious-logins', authAdmin, getSuspiciousLogins);
router.get('/agent-comparison-matrix', authAdmin, getAgentComparisonMatrix);

// Master CS Agent monitoring & complaint endpoints
router.post('/raise-complaint', authAdmin, raiseComplaint);
router.get('/complaints', authAdmin, getComplaints);
router.put('/complaint/:id/status', authAdmin, updateComplaintStatus);
router.post('/accept-escalated/:id', authAdmin, acceptEscalatedTicket);
router.post('/ticket/:id/add-note', authAdmin, adminAddTicketNote);
router.put('/ticket/:id/update-status', authAdmin, adminUpdateTicketStatus);
router.delete('/delete-employee/:id', authAdmin, deleteEmployee);

// Agent-side alert logging (authenticated CS agent)
router.post('/log-monitoring-alert', authCSEmployee, logMonitoringAlert);

export default router;
