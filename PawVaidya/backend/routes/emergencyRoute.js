import express from "express";
import { 
    createEmergencyRequest,
    getEmergencyRequests,
    updateEmergencyStatus,
    getAvailableDoctorsInDistrict,
    updateDoctorEmergencyAvailability,
    recordEmergencyPaymentLog,
    getPatientEmergencyHistory,
    repayEmergencyDues,
    getUserDuesList,
    getAdminEmergencyStats,
    getAdminEmergencyRequests,
    exportEmergencyReport
} from "../controllers/emergencyController.js";
import authEmergencyRole from "../middleware/authEmergencyRole.js";
import authAdmin from "../middleware/authAdmin.js";
import { createBookingLimiter, doctorClaimLimiter } from "../middleware/emergencyRateLimiter.js";
import upload from "../middleware/multer.js";

const emergencyRouter = express.Router();


// Route to create emergency request (Users only)
emergencyRouter.post("/create", authEmergencyRole, upload.single('report'), createBookingLimiter, createEmergencyRequest);

// Route to get list of emergency requests (Users, Doctors, and Admins based on role)
emergencyRouter.get("/requests", authEmergencyRole, getEmergencyRequests);

// Route to update status of emergency requests (Users, Doctors, and Admins based on role)
emergencyRouter.post("/status", authEmergencyRole, doctorClaimLimiter, updateEmergencyStatus);

// Route to filter doctors by district instantly (Open/User)
emergencyRouter.get("/filter-doctors", getAvailableDoctorsInDistrict);

// Route to set or update doctor emergency availability settings (Doctors or Admins)
emergencyRouter.post("/toggle-availability", authEmergencyRole, updateDoctorEmergencyAvailability);
emergencyRouter.post("/update-availability", authEmergencyRole, updateDoctorEmergencyAvailability);

// Route to record payment and transition request to Approved (Users only)
emergencyRouter.post("/payment", authEmergencyRole, recordEmergencyPaymentLog);

// Route to get historical emergency consultations of a patient (Doctors/Admins)
emergencyRouter.get("/patient-history", authEmergencyRole, getPatientEmergencyHistory);

// Route to fetch outstanding emergency payment dues for a user (Users only)
emergencyRouter.get("/dues", authEmergencyRole, getUserDuesList);

// Route to repay outstanding dues manually from Paw Wallet (Users only)
emergencyRouter.post("/repay-dues", authEmergencyRole, repayEmergencyDues);

// Route to fetch ecosystem-wide admin dashboard statistics (Admins only)
emergencyRouter.get("/admin/stats", authAdmin, getAdminEmergencyStats);

// Route to query filtered lists of emergency requests (Admins only)
emergencyRouter.get("/admin/requests", authAdmin, getAdminEmergencyRequests);

// Route to export CSV reports for a specified time frame (Admins only)
emergencyRouter.get("/admin/export-report", authAdmin, exportEmergencyReport);

export default emergencyRouter;

