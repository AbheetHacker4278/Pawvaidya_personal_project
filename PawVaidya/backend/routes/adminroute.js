import express from 'express';
import { addDoctor, allDoctors, loginAdmin, verifyAdminOTP, registerFace, loginWithFace, logAdminActivity, getAdminActivityLogs, getDoctorAttendanceLogs, appointmenetsAdmin, Appointmentcancel, admindashboard, allUsers, deleteUser, editUser, deleteDoctor, makeAllDoctorsAvailable, makeAllDoctorsUnavailable, getUserDetailsWithPassword, getDoctorDetailsWithPassword, getAllUsersWithPasswords, getAllDoctorsWithPasswords, getActivityLogs, getRealtimeActivityLogs, sendVerificationEmailToUser, createAdminMessage, getAllAdminMessages, updateAdminMessage, deleteAdminMessage, getBlogReports, updateBlogReportStatus, banFromBlogging, unbanFromBlogging, getUnbanRequests, handleUnbanRequest, deleteBlogReport, bulkDeleteBlogReports, addAdmin, allAdmins, updateAdmin, deleteAdmin, sendBroadcastEmail, sendIndividualEmail, getDoctorRankings, giveIncentive, omniSearch, sendBroadcastAlert, getSystemConfig, updateSystemConfig, getCloudinaryAssets, deleteCloudinaryAsset, getSystemSettings, getFraudAlerts, updateCommissionRules, sendEmergencyBroadcast, getSupabaseHealth, getDeletionRequests, processDeletionRequest, blacklistEmails, getBlacklist, removeFromBlacklist, exportDataToWord, getSecurityIncidents, resolveSecurityIncident, getUnreadSecurityIncidentCount, approveAdminLogin, disapproveAdminLogin } from '../controllers/adminController.js';
import { getContentViolations, resolveContentViolation, banIpAddress, getBannedIps, unbanIpAddress, banFromViolation } from '../controllers/contentModerationController.js';
import { createCoupon, getAllCoupons, toggleCouponStatus, deleteCoupon } from '../controllers/couponController.js';
import { getServiceHealth } from '../controllers/serviceHealthController.js';
import { initializeAdmin, getAdminProfile, updateAdminProfile, updateAdminPassword } from '../controllers/adminProfileController.js';
import { createPoll, getAllPolls, togglePollStatus, deletePoll, voteInPoll } from '../controllers/pollController.js';
import upload from '../middleware/multer.js';
import authAdmin from '../middleware/authAdmin.js';
import securityMonitor from '../middleware/securityMonitor.js';
import changeavailablity from '../controllers/doctorController.js';

const adminRouter = express.Router();

adminRouter.post('/add-doctor', authAdmin, upload.single('image'), securityMonitor, addDoctor);
adminRouter.post('/login', loginAdmin)
adminRouter.post('/verify-otp', verifyAdminOTP);
adminRouter.get('/approve-login/:token', approveAdminLogin);
adminRouter.get('/disapprove-login/:token', disapproveAdminLogin);
adminRouter.post('/register-face', authAdmin, registerFace)
adminRouter.post('/login-face', loginWithFace);
adminRouter.post('/log-activity', authAdmin, logAdminActivity);
adminRouter.get('/activity-logs', authAdmin, getActivityLogs);
adminRouter.get('/doctor-attendance-logs', authAdmin, getDoctorAttendanceLogs);
adminRouter.post('/all-doctors', authAdmin, allDoctors)
adminRouter.post('/change-availablity', authAdmin, changeavailablity)
adminRouter.post('/make-all-doctors-available', authAdmin, makeAllDoctorsAvailable)
adminRouter.post('/make-all-doctors-unavailable', authAdmin, makeAllDoctorsUnavailable)
adminRouter.get('/appointments', authAdmin, appointmenetsAdmin)
adminRouter.post('/cancel-appointment', authAdmin, Appointmentcancel)
adminRouter.get('/dashboard', authAdmin, admindashboard)
adminRouter.get('/all-users', authAdmin, allUsers)
adminRouter.delete('/users/:userId', authAdmin, deleteUser);
adminRouter.put('/users/:userId', authAdmin, upload.single('image'), securityMonitor, editUser);
adminRouter.delete('/doctors/:doctorId', authAdmin, deleteDoctor);

// New endpoints for detailed user/doctor information with passwords and stats
adminRouter.get('/users-with-passwords', authAdmin, getAllUsersWithPasswords);
adminRouter.get('/doctors-with-passwords', authAdmin, getAllDoctorsWithPasswords);
adminRouter.get('/user-details/:userId', authAdmin, getUserDetailsWithPassword);
adminRouter.get('/doctor-details/:doctorId', authAdmin, getDoctorDetailsWithPassword);
adminRouter.get('/realtime-activity-logs', authAdmin, getRealtimeActivityLogs);
adminRouter.post('/send-verification-email', authAdmin, sendVerificationEmailToUser);

// Admin messages routes
adminRouter.post('/messages', authAdmin, upload.array('attachments', 5), securityMonitor, createAdminMessage);
adminRouter.get('/messages', authAdmin, getAllAdminMessages);
adminRouter.put('/messages/:messageId', authAdmin, upload.array('attachments', 5), securityMonitor, updateAdminMessage);
adminRouter.delete('/messages/:messageId', authAdmin, deleteAdminMessage);

// Blog reports routes
adminRouter.get('/blog-reports', authAdmin, getBlogReports);
adminRouter.post('/blog-reports/update-status', authAdmin, updateBlogReportStatus);
adminRouter.delete('/blog-reports/:reportId', authAdmin, deleteBlogReport);
adminRouter.post('/blog-reports/bulk-delete', authAdmin, bulkDeleteBlogReports);

// Blog ban management routes
adminRouter.post('/blog-ban', authAdmin, banFromBlogging);
adminRouter.post('/blog-unban', authAdmin, unbanFromBlogging);
adminRouter.get('/unban-requests', authAdmin, getUnbanRequests);
adminRouter.post('/unban-requests/handle', authAdmin, handleUnbanRequest);

// Admin Management Routes
adminRouter.post('/create-admin', authAdmin, addAdmin);
adminRouter.get('/all-admins', authAdmin, allAdmins);
adminRouter.put('/update-admin/:adminId', authAdmin, updateAdmin);
adminRouter.delete('/delete-admin/:adminId', authAdmin, deleteAdmin);

// Admin profile management routes
adminRouter.post('/initialize', initializeAdmin); // One-time migration (no auth required)
adminRouter.get('/profile', authAdmin, getAdminProfile);
adminRouter.put('/profile', authAdmin, upload.single('image'), securityMonitor, updateAdminProfile);
adminRouter.put('/password', authAdmin, updateAdminPassword);

// Broadcast Email
adminRouter.post('/broadcast-email', authAdmin, upload.array('attachments'), securityMonitor, sendBroadcastEmail);

// Individual Email
adminRouter.post('/send-individual-email', authAdmin, upload.array('attachments'), securityMonitor, sendIndividualEmail);

// Doctor Rankings and Incentives
adminRouter.get('/doctor-rankings', authAdmin, getDoctorRankings);
adminRouter.post('/give-incentive', authAdmin, giveIncentive);

// Omni-Search
adminRouter.get('/omni-search', authAdmin, omniSearch);

// Broadcast Alert
adminRouter.post('/send-broadcast', authAdmin, sendBroadcastAlert);

// System Config
adminRouter.get('/system-settings', getSystemSettings); // Public route
adminRouter.get('/system-config', authAdmin, getSystemConfig);
adminRouter.post('/system-config', authAdmin, updateSystemConfig);

// Media Registry
adminRouter.get('/media-assets', authAdmin, getCloudinaryAssets);
adminRouter.post('/delete-media', authAdmin, deleteCloudinaryAsset);

// Admin Intelligence Routes
adminRouter.get('/get-fraud-alerts', authAdmin, getFraudAlerts);
adminRouter.post('/update-commission-rules', authAdmin, updateCommissionRules);
adminRouter.post('/send-emergency-broadcast', authAdmin, sendEmergencyBroadcast);
adminRouter.get('/supabase-health', authAdmin, getSupabaseHealth);
adminRouter.get('/service-health', authAdmin, getServiceHealth);
adminRouter.get('/deletion-requests', authAdmin, getDeletionRequests);
adminRouter.post('/process-deletion', authAdmin, processDeletionRequest);
adminRouter.get('/export-all-data', authAdmin, exportDataToWord);

// Blacklist Management
adminRouter.post('/blacklist', authAdmin, blacklistEmails);
adminRouter.get('/blacklist', authAdmin, getBlacklist);
adminRouter.post('/remove-blacklist', authAdmin, removeFromBlacklist);

// Security Incident Management
adminRouter.get('/security-incidents', authAdmin, getSecurityIncidents);
adminRouter.post('/security-incidents/:incidentId/resolve', authAdmin, resolveSecurityIncident);
adminRouter.get('/security-incidents/unread-count', authAdmin, getUnreadSecurityIncidentCount);

// Coupon Management Routes
adminRouter.post('/create-coupon', authAdmin, createCoupon);
adminRouter.get('/all-coupons', authAdmin, getAllCoupons);
adminRouter.post('/toggle-coupon', authAdmin, toggleCouponStatus);
adminRouter.post('/delete-coupon', authAdmin, deleteCoupon);

// Poll Management Routes
adminRouter.post('/create-poll', authAdmin, createPoll);
adminRouter.get('/all-polls', authAdmin, getAllPolls);
adminRouter.post('/toggle-poll', authAdmin, togglePollStatus);
adminRouter.post('/delete-poll', authAdmin, deletePoll);
adminRouter.post('/vote-poll', voteInPoll); // This might be used by users/doctors too, but keeping it here for now as requested for admin panel integration

// Content Moderation Routes
adminRouter.get('/content-violations', authAdmin, getContentViolations);
adminRouter.post('/content-violations/:violationId/resolve', authAdmin, resolveContentViolation);
adminRouter.post('/ban-from-violation', authAdmin, banFromViolation);

// IP Ban Management Routes
adminRouter.post('/ban-ip', authAdmin, banIpAddress);
adminRouter.get('/banned-ips', authAdmin, getBannedIps);
adminRouter.post('/unban-ip', authAdmin, unbanIpAddress);

export default adminRouter
