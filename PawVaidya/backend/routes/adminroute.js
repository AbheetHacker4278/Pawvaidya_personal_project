import express from 'express';
import { addDoctor, allDoctors, loginAdmin, verifyAdminOTP, registerFace, loginWithFace, logAdminActivity, getAdminActivityLogs, getDoctorAttendanceLogs, appointmenetsAdmin, Appointmentcancel, admindashboard, allUsers, deleteUser, editUser, deleteDoctor, makeAllDoctorsAvailable, makeAllDoctorsUnavailable, getUserDetailsWithPassword, getDoctorDetailsWithPassword, getAllUsersWithPasswords, getAllDoctorsWithPasswords, getActivityLogs, getRealtimeActivityLogs, sendVerificationEmailToUser, createAdminMessage, getAllAdminMessages, updateAdminMessage, deleteAdminMessage, getBlogReports, updateBlogReportStatus, banFromBlogging, unbanFromBlogging, getUnbanRequests, handleUnbanRequest, deleteBlogReport, bulkDeleteBlogReports, addAdmin, allAdmins, updateAdmin, deleteAdmin, sendBroadcastEmail, sendIndividualEmail, getDoctorRankings, giveIncentive, omniSearch, sendBroadcastAlert, getSystemConfig, updateSystemConfig, getCloudinaryAssets, deleteCloudinaryAsset, getSystemSettings, getFraudAlerts, updateCommissionRules, sendEmergencyBroadcast, getSupabaseHealth, getDeletionRequests, processDeletionRequest, blacklistEmails, getBlacklist, removeFromBlacklist, exportDataToWord, getSecurityIncidents, resolveSecurityIncident, getUnreadSecurityIncidentCount, approveAdminLogin, disapproveAdminLogin, getUserPaymentDetails, getPaymentUsers, getAllSubscriptions, revokeSubscription, giftSubscription, approveObsidianPass, rejectObsidianPass, analyzeObsidianUser, getRedisStats, getRedisHistory, syncLegacyFiles, getFirebaseStorageStatsEndpoint, broadcastReuploadDocs, predictChurn } from '../controllers/adminController.js';
import { createAdminCreditTopupOrder, verifyAdminCreditTopup, getAdminCreditStats, getAllIcuDispatches, getAllVans, createVan, updateVan, deleteVan, getAllDrivers, getDriverDetails, updateDriverDetails, banDriver, unbanDriver, handleAppeal, deleteDriver } from '../controllers/obsidianController.js';
import { getContentViolations, resolveContentViolation, banIpAddress, getBannedIps, unbanIpAddress, banFromViolation } from '../controllers/contentModerationController.js';
import { createCoupon, getAllCoupons, toggleCouponStatus, deleteCoupon } from '../controllers/couponController.js';
import { getServiceHealth } from '../controllers/serviceHealthController.js';
import { initializeAdmin, getAdminProfile, updateAdminProfile, updateAdminPassword } from '../controllers/adminProfileController.js';
import { createPoll, getAllPolls, togglePollStatus, deletePoll, voteInPoll } from '../controllers/pollController.js';
import upload from '../middleware/multer.js';
import { getPetHealthCardByPetId } from '../controllers/petReportController.js';
import authAdmin from '../middleware/authAdmin.js';
import securityMonitor from '../middleware/securityMonitor.js';
import changeavailablity from '../controllers/doctorController.js';
import { getAdminDoctorDocuments, verifyDoctorDocument, adminDeleteDoctorDocument } from '../controllers/doctorDocumentController.js';
import {
  getUserTrustScores,
  getDuplicateAccounts,
  flagDuplicateUser,
  getReferralStats,
  updateReferralReward,
  getGdprRequests,
  processGdprRequest,
  getChurnAnalysis,
  getCouponRoiAnalytics,
  getDoctorPayouts,
  processDoctorPayout
} from '../controllers/trustRevenueController.js';
import ipAllowlistMiddleware from '../middleware/ipAllowlistMiddleware.js';
import {
  getAllowedIps,
  addAllowedIp,
  deleteAllowedIp,
  get2faPolicyAndCompliance,
  update2faPolicy,
  getSimulatedPermissionPages
} from '../controllers/securityComplianceController.js';

const adminRouter = express.Router();
adminRouter.use(ipAllowlistMiddleware);


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

// Payment Details Routes
adminRouter.get('/all-subscriptions', authAdmin, getAllSubscriptions);
adminRouter.get('/payment-users', authAdmin, getPaymentUsers);
adminRouter.post('/revoke-subscription', authAdmin, revokeSubscription);
adminRouter.post('/gift-subscription', authAdmin, giftSubscription);
adminRouter.post('/approve-obsidian', authAdmin, approveObsidianPass);
adminRouter.post('/reject-obsidian', authAdmin, rejectObsidianPass);
adminRouter.get('/analyze-obsidian-user/:subscriptionId', authAdmin, analyzeObsidianUser);
adminRouter.post('/obsidian/admin/credit-topup-order', authAdmin, createAdminCreditTopupOrder);
adminRouter.post('/obsidian/admin/verify-credit-topup', authAdmin, verifyAdminCreditTopup);
adminRouter.get('/obsidian/admin/credit-stats', authAdmin, getAdminCreditStats);
adminRouter.get('/obsidian/admin/icu-dispatches', authAdmin, getAllIcuDispatches);
adminRouter.get('/obsidian/admin/vans', authAdmin, getAllVans);
adminRouter.post('/obsidian/admin/vans', authAdmin, createVan);
adminRouter.put('/obsidian/admin/vans/:vanId', authAdmin, updateVan);
adminRouter.delete('/obsidian/admin/vans/:vanId', authAdmin, deleteVan);
adminRouter.get('/obsidian/admin/drivers', authAdmin, getAllDrivers);
adminRouter.get('/obsidian/admin/drivers/:driverId', authAdmin, getDriverDetails);
adminRouter.put('/obsidian/admin/drivers/:driverId', authAdmin, updateDriverDetails);
adminRouter.post('/obsidian/admin/drivers/:driverId/ban', authAdmin, banDriver);
adminRouter.post('/obsidian/admin/drivers/:driverId/unban', authAdmin, unbanDriver);
adminRouter.post('/obsidian/admin/drivers/:driverId/appeal', authAdmin, handleAppeal);
adminRouter.delete('/obsidian/admin/drivers/:driverId', authAdmin, deleteDriver);
adminRouter.post('/predict-churn', authAdmin, predictChurn);
adminRouter.get('/redis-stats', authAdmin, getRedisStats);
adminRouter.get('/redis-history', authAdmin, getRedisHistory);
adminRouter.get('/user-payment-details/:userId', authAdmin, getUserPaymentDetails);
adminRouter.get('/pet-health/:petId', authAdmin, getPetHealthCardByPetId);

adminRouter.post('/sync-legacy-files', authAdmin, syncLegacyFiles);
adminRouter.get('/firebase-storage-stats', authAdmin, getFirebaseStorageStatsEndpoint);
adminRouter.post('/broadcast-reupload-docs', authAdmin, broadcastReuploadDocs);

// Doctor Medical Documents (Admin)
adminRouter.get('/doctor-documents/:doctorId', authAdmin, getAdminDoctorDocuments);
adminRouter.post('/doctor-documents/verify', authAdmin, verifyDoctorDocument);
adminRouter.post('/doctor-documents/delete', authAdmin, adminDeleteDoctorDocument);

// Financial Calculations Route
import { getFinancialCalculations, getFinancialAnalysis } from '../controllers/adminFinanceController.js';
import { getUser360, issueRefund, reclaimRefund, grantSubscription, triggerEmergencyAlert } from '../controllers/csAuthController.js';

adminRouter.get('/financial-calculations', authAdmin, getFinancialCalculations);
adminRouter.get('/financial-analysis', authAdmin, getFinancialAnalysis);

// Customer 360 routes for Admin
adminRouter.get('/user-360/:email', authAdmin, getUser360);
adminRouter.post('/refund', authAdmin, issueRefund);
adminRouter.post('/reclaim-refund', authAdmin, reclaimRefund);
adminRouter.post('/grant-subscription', authAdmin, grantSubscription);
adminRouter.post('/trigger-emergency', authAdmin, triggerEmergencyAlert);

// Trust & Revenue Analytics endpoints
adminRouter.get('/trust-scores', authAdmin, getUserTrustScores);
adminRouter.get('/duplicate-accounts', authAdmin, getDuplicateAccounts);
adminRouter.post('/flag-duplicate', authAdmin, flagDuplicateUser);
adminRouter.get('/referral-stats', authAdmin, getReferralStats);
adminRouter.post('/referral-reward', authAdmin, updateReferralReward);
adminRouter.get('/gdpr-requests', authAdmin, getGdprRequests);
adminRouter.post('/process-gdpr', authAdmin, processGdprRequest);
adminRouter.get('/churn-analysis', authAdmin, getChurnAnalysis);
adminRouter.get('/coupon-roi', authAdmin, getCouponRoiAnalytics);
adminRouter.get('/doctor-payouts', authAdmin, getDoctorPayouts);
adminRouter.post('/process-doctor-payout', authAdmin, processDoctorPayout);

// Security & Compliance endpoints
adminRouter.get('/allowed-ips', authAdmin, getAllowedIps);
adminRouter.post('/allowed-ips', authAdmin, addAllowedIp);
adminRouter.delete('/allowed-ips/:ipId', authAdmin, deleteAllowedIp);
adminRouter.get('/2fa-policy', authAdmin, get2faPolicyAndCompliance);
adminRouter.post('/2fa-policy', authAdmin, update2faPolicy);
adminRouter.get('/simulated-permissions', authAdmin, getSimulatedPermissionPages);

import axios from 'axios';
adminRouter.post('/generate-ai-content', authAdmin, async (req, res) => {
  try {
    const { prompt, max_tokens } = req.body;
    const apiKey = process.env.NVIDIA_API_KEY_FRONTEND;
    if (!apiKey) return res.status(500).json({ success: false, message: "NVIDIA API key not configured" });

    const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
    const payload = {
      model: "minimaxai/minimax-m3",
      messages: [{ role: "user", content: prompt }],
      max_tokens: max_tokens || 1024,
      temperature: 1.00,
      top_p: 0.95,
      stream: false
    };
    
    const response = await axios.post(invokeUrl, payload, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error("AI Generation Error:", error?.response?.data || error.message);
    res.status(500).json({ success: false, message: "AI generation failed" });
  }
});

export default adminRouter;

