import mongoose from 'mongoose';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import validator from 'validator';
import bcryptjs from 'bcryptjs';
import argon2 from "argon2";
import { v2 as cloudinary } from 'cloudinary';
import doctorModel from '../models/doctorModel.js';
import jwt from 'jsonwebtoken';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import { logActivity } from '../utils/activityLogger.js';
import { transporter } from '../config/nodemailer.js';
import VERIFICATION_EMAIL_TEMPLATE from '../mailservice/emailtemplate2.js';
import VERIFICATION_REMINDER_TEMPLATE from '../mailservice/verificationReminderTemplate.js';
import adminMessageModel from '../models/adminMessageModel.js';
import adminModel from '../models/adminModel.js';
import blogModel from '../models/blogModel.js';
import reportModel from '../models/reportModel.js';
import { getIO } from '../socketServer.js';
import serviceHealthModel from '../models/serviceHealthModel.js';
import backgroundJobModel from '../models/backgroundJobModel.js';
import systemConfigModel from '../models/systemConfigModel.js';
import { getLocationFromIP, checkImpossibleTravel } from '../utils/fraudTracker.js';
import supabaseService from '../services/supabaseService.js';
import supabase from '../config/supabase.js';
import activityLogModel from '../models/activityLogModel.js';
import deletionRequestModel from '../models/deletionRequestModel.js';

const execAsync = promisify(exec);

const getActivePorts = async () => {
    try {
        const { stdout } = await execAsync('netstat -ano | findstr LISTENING');
        const lines = stdout.split('\n');
        const ports = lines
            .map(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 4) {
                    const localAddress = parts[1];
                    const port = localAddress.split(':').pop();
                    return {
                        protocol: parts[0],
                        localAddress: parts[1],
                        state: parts[3],
                        pid: parts[4],
                        port: parseInt(port)
                    };
                }
                return null;
            })
            .filter(p => p && !isNaN(p.port));

        // Remove duplicates and sort
        const uniquePortsMap = new Map();
        ports.forEach(p => {
            if (p) uniquePortsMap.set(p.port, p);
        });

        return Array.from(uniquePortsMap.values()).sort((a, b) => a.port - b.port);
    } catch (error) {
        console.error("Error fetching active ports:", error.message);
        return [];
    }
};

// API for adding a doctor
export const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, docphone, address, full_address } = req.body;
        const imageFile = req.file;

        // Validate required fields
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !docphone || !address || !full_address) {
            return res.json({
                success: false,
                message: "Missing required Fields",
            });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.json({
                success: false,
                message: "Invalid email format",
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.json({
                success: false,
                message: "Use a strong password",
            });
        }

        // Hash the password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await argon2.hash(password, salt);

        // Upload image to Cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
        const imageUrl = imageUpload.secure_url;

        // Create doctor data
        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            plainPassword: password, // Store original password for admin access
            speciality,
            degree,
            experience,
            about,
            fees,
            docphone,
            address: JSON.parse(address),
            full_address,
            date: Date.now(),
        };

        // Save doctor to the database
        const newDoctor = new doctorModel(doctorData);
        await newDoctor.save();

        // Send a success response
        res.status(200).json({
            success: true,
            message: "Doctor added successfully",
            data: {
                name,
                email,
                hashedPassword,
                speciality,
                degree,
                experience,
                about,
                fees,
                docphone,
                address,
                full_address,
            },
        });
    } catch (error) {
        console.error("Error adding doctor:", error.message);

        // Send an error response
        res.status(500).json({
            success: false,
            message: "Failed to add doctor",
            error: error.message,
        });
    }
};


// API to delete a doctor
export const makeAllDoctorsAvailable = async (req, res) => {
    try {
        // Update all doctors to set available = true
        const result = await doctorModel.updateMany(
            {},
            { $set: { available: true } }
        );

        return res.json({
            success: true,
            message: `Successfully made ${result.modifiedCount} doctor(s) available`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error making all doctors available:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// API to make all doctors unavailable
export const makeAllDoctorsUnavailable = async (req, res) => {
    try {
        // Update all doctors to set available = false
        const result = await doctorModel.updateMany(
            {},
            { $set: { available: false } }
        );

        return res.json({
            success: true,
            message: `Successfully made ${result.modifiedCount} doctor(s) unavailable`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error making all doctors unavailable:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

export const deleteDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Check if doctor exists
        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        // Check for associated appointments
        const doctorAppointments = await appointmentModel.find({ docId: doctorId });

        // Delete associated appointments
        if (doctorAppointments.length > 0) {
            await appointmentModel.deleteMany({ docId: doctorId });
        }

        // Delete the doctor's image from Cloudinary if exists
        if (doctor.image && doctor.image.includes('cloudinary')) {
            const publicId = doctor.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        // Delete the doctor
        await doctorModel.findByIdAndDelete(doctorId);

        res.json({
            success: true,
            message: "Doctor deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting doctor:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to delete doctor",
            error: error.message
        });
    }
};




// API for admin login
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check Master Admin Credentials (from Env)
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
            // For master admin, we might not have ID, use 'master' or fetch if created
            await logActivity('master', 'admin', 'login', 'Master Admin Logged in via Email', req, { method: 'email' });
            return res.json({
                success: true,
                token,
                role: 'master',
                permissions: ['all'],
                name: 'Master Admin'
            });
        }

        // 2. Check Child Admin Credentials (from Database)
        const admin = await adminModel.findOne({ email });
        if (admin) {
            const isMatch = await argon2.verify(admin.password, password);
            if (isMatch) {
                const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
                await logActivity(admin._id, 'admin', 'login', 'Logged in via Email', req, { method: 'email' });
                return res.json({
                    success: true,
                    token,
                    role: admin.role,
                    permissions: admin.permissions,
                    name: admin.name
                });
            }
        }

        res.json({
            success: false,
            message: "Invalid email or password",
        });

    } catch (error) {
        console.error("Error logging in admin:", error.message);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// API to register face for admin
export const registerFace = async (req, res) => {
    try {
        const { email, faceDescriptor } = req.body;

        console.log("Register Face Request:", { email, hasDescriptor: !!faceDescriptor });
        console.log("Env Admin Email:", process.env.ADMIN_EMAIL);

        if (!faceDescriptor || faceDescriptor.length !== 128) {
            return res.status(400).json({ success: false, message: "Invalid face descriptor" });
        }

        let admin = await adminModel.findOne({ email });

        // Special case for Master Admin (Env): If not in DB, create it
        if (!admin && email === process.env.ADMIN_EMAIL) {
            let imageUrl = '';
            if (req.body.image) {
                const uploadResponse = await cloudinary.uploader.upload(req.body.image, { resource_type: 'image' });
                imageUrl = uploadResponse.secure_url;
            }

            const hashedPassword = await argon2.hash(process.env.ADMIN_PASSWORD);
            admin = new adminModel({
                name: "Master Admin",
                email: email,
                password: hashedPassword,
                role: 'master',
                permissions: ['all'],
                faceDescriptor: faceDescriptor,
                image: imageUrl
            });
            await admin.save();
            return res.json({ success: true, message: "Face registered successfully (Master Admin created)" });
        }

        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        if (req.body.image) {
            const uploadResponse = await cloudinary.uploader.upload(req.body.image, { resource_type: 'image' });
            admin.image = uploadResponse.secure_url;
        }

        admin.faceDescriptor = faceDescriptor;
        await admin.save();

        res.json({ success: true, message: "Face registered successfully" });

    } catch (error) {
        console.error("Error registering face:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to login with face
export const loginWithFace = async (req, res) => {
    try {
        const { faceDescriptor, image } = req.body; // Accept image base64

        if (!faceDescriptor || faceDescriptor.length !== 128) {
            return res.status(400).json({ success: false, message: "Invalid face descriptor" });
        }

        const admins = await adminModel.find({});
        let bestMatch = null;
        let minDistance = 0.5; // Threshold

        for (const admin of admins) {
            if (admin.faceDescriptor && admin.faceDescriptor.length === 128) {
                const storedDescriptor = admin.faceDescriptor;
                const distance = euclideanDistance(faceDescriptor, storedDescriptor);

                if (distance < minDistance) {
                    minDistance = distance;
                    bestMatch = admin;
                }
            }
        }

        if (bestMatch) {
            const token = jwt.sign({ email: bestMatch.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

            // Upload captured image for log (async to not block response too long, or await if critical)
            let faceImageUrl = '';
            if (image) {
                try {
                    const uploadResponse = await cloudinary.uploader.upload(image, { resource_type: 'image', folder: 'admin_logs' });
                    faceImageUrl = uploadResponse.secure_url;
                } catch (imgErr) {
                    console.error("Error uploading log image:", imgErr);
                }
            }

            await logActivity(bestMatch._id, 'admin', 'login', 'Logged in via Face', req, { method: 'face' }, faceImageUrl);

            res.json({
                success: true,
                token,
                role: bestMatch.role,
                permissions: bestMatch.permissions,
                name: bestMatch.name
            });
        } else {
            res.status(401).json({ success: false, message: "Face not recognized" });
        }

    } catch (error) {
        console.error("Error logging in with face:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const euclideanDistance = (desc1, desc2) => {
    return Math.sqrt(desc1.reduce((acc, val, i) => acc + Math.pow(val - desc2[i], 2), 0));
};

// API to log manual activity
export const logAdminActivity = async (req, res) => {
    try {
        const { activityType, activityDescription, metadata } = req.body;
        // req.admin passed by authAdmin middleware
        const adminId = req.admin?.id || (req.admin?.role === 'master' ? 'master' : null);

        if (!adminId) {
            // Try to find admin by email if id not present (Master Admin case)
            // or just use email as ID for master
            // If req.admin.id is undefined (which might happen for Master Admin created via Env without Logged in DB record in valid session context, though we created DB record now)
            // Let's rely on authAdmin.
        }

        await logActivity(adminId, 'admin', activityType, activityDescription, req, metadata);
        res.json({ success: true, message: "Activity logged" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to get Admin Activity Logs
export const getAdminActivityLogs = async (req, res) => {
    try {
        let rawLogs = [];
        try {
            rawLogs = (await supabaseService.getActivityLogs(200)) || [];
        } catch (error) {
            const msg = error.message || String(error);
            if (!msg.toLowerCase().includes('fetch')) {
                console.error("Supabase Activity Logs fetch error:", msg);
            }
        }

        // Map Supabase columns to match frontend AdminLogs.jsx expectations
        let mappedLogs = rawLogs
            .filter(log => log && log.user_type === 'admin')
            .map(log => ({
                id: log.id,
                timestamp: log.created_at,
                activityType: log.activity_type,
                activityDescription: log.description,
                faceImage: log.metadata?.faceImage || null,
                metadata: log.metadata || {},
                ipAddress: log.ip_address,
                userAgent: log.user_agent
            }));

        // FALLBACK: If Supabase returns nothing or fails, pull from local MongoDB
        if (mappedLogs.length === 0) {
            const mongoLogs = await activityLogModel.find({ userType: 'admin' })
                .sort({ timestamp: -1 })
                .limit(200);

            mappedLogs = mongoLogs.map(log => ({
                id: log._id,
                timestamp: log.timestamp,
                activityType: log.activityType,
                activityDescription: log.activityDescription,
                faceImage: log.faceImage || null,
                metadata: log.metadata || {},
                ipAddress: log.ipAddress,
                userAgent: log.userAgent
            }));
        }

        res.json({ success: true, logs: mappedLogs });
    } catch (error) {
        console.error("Fatal error in getAdminActivityLogs:", error);
        res.status(500).json({ success: false, message: "Internal server error while fetching logs." });
    }
};

// API to get Doctor Attendance Logs
export const getDoctorAttendanceLogs = async (req, res) => {
    try {
        let logs = [];
        try {
            logs = (await supabaseService.getActivityLogs(200)) || [];
        } catch (error) {
            const msg = error.message || String(error);
            if (!msg.toLowerCase().includes('fetch')) {
                console.error("Supabase Attendance Logs fetch error:", msg);
            }
        }
        const attendanceLogs = logs.filter(log => log && log.user_type === 'doctor' && log.activity_type === 'doctor_attendance');

        let logsWithNames = await Promise.all(attendanceLogs.map(async (log) => {
            const doctor = await doctorModel.findById(log.user_id || log.userId);
            return {
                id: log.id || log._id,
                userId: log.user_id || log.userId,
                userType: log.user_type || log.userType,
                activityType: log.activity_type || log.activityType,
                activityDescription: log.description || log.activityDescription,
                metadata: log.metadata || {},
                faceImage: log.faceImage || log.metadata?.faceImage || null,
                doctorName: doctor ? doctor.name : 'Unknown Doctor',
                timestamp: log.created_at || log.timestamp
            };
        }));

        // FALLBACK: If Supabase has no attendance logs, check MongoDB
        if (logsWithNames.length === 0) {
            const mongoLogs = await activityLogModel.find({
                userType: 'doctor',
                activityType: 'doctor_attendance'
            }).sort({ timestamp: -1 }).limit(100);

            logsWithNames = await Promise.all(mongoLogs.map(async (log) => {
                const doctor = await doctorModel.findById(log.userId);
                return {
                    id: log._id,
                    userId: log.userId,
                    userType: log.userType,
                    activityType: log.activityType,
                    activityDescription: log.activityDescription,
                    metadata: log.metadata || {},
                    faceImage: log.faceImage || null,
                    doctorName: doctor ? doctor.name : 'Unknown Doctor',
                    timestamp: log.timestamp
                };
            }));
        }

        res.json({ success: true, logs: logsWithNames });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to add a new child admin
export const addAdmin = async (req, res) => {
    try {
        const { name, email, password, permissions } = req.body;

        // Check if requester is Master Admin
        if (req.admin.role !== 'master') {
            return res.status(403).json({ success: false, message: "Only Master Admin can add admins" });
        }

        // Validate existence
        const existingAdmin = await adminModel.findOne({ email });
        if (existingAdmin) {
            return res.json({ success: false, message: "Admin with this email already exists" });
        }

        // Hash password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await argon2.hash(password, salt);

        const newAdmin = new adminModel({
            name,
            email,
            password: hashedPassword,
            plainPassword: password, // Optional: keep if you want to see it in DB, otherwise remove
            permissions: permissions || [],
            role: 'admin'
        });

        await newAdmin.save();

        res.json({ success: true, message: "Admin added successfully" });

    } catch (error) {
        console.error("Error adding admin:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to get all child admins
export const allAdmins = async (req, res) => {
    try {
        if (req.admin.role !== 'master') {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const admins = await adminModel.find({ role: 'admin' }).select('-password');
        res.json({ success: true, admins });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to update a child admin
export const updateAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { name, email, permissions } = req.body;

        if (req.admin.role !== 'master') {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const updateData = { name, email, permissions };

        // If password is being updated (optional)
        if (req.body.password) {
            const salt = await bcryptjs.genSalt(10);
            updateData.password = await argon2.hash(req.body.password, salt);
            updateData.plainPassword = req.body.password;
        }

        await adminModel.findByIdAndUpdate(adminId, updateData);

        res.json({ success: true, message: "Admin updated successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to delete a child admin
export const deleteAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;

        if (req.admin.role !== 'master') {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        await adminModel.findByIdAndDelete(adminId);
        res.json({ success: true, message: "Admin deleted successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const allDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}
export const allUsers = async (req, res) => {
    try {
        const users = await userModel.find({}).select('-password -resetOtpExpireAt -verifyOtpExpiredAt -verifyOtpVerified -verifyOtp -resetOtp');
        res.json({ success: true, users })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}

// API to delete a user
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check for associated appointments
        const userAppointments = await appointmentModel.find({ userId });

        // Delete associated appointments
        if (userAppointments.length > 0) {
            await appointmentModel.deleteMany({ userId });
        }

        // Delete the user
        await userModel.findByIdAndDelete(userId);

        res.json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting user:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to delete user",
            error: error.message
        });
    }
};

// API to edit a user
export const editUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        // Check if user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Validate email if it's being updated
        if (updateData.email && !validator.isEmail(updateData.email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // Handle password update if provided
        if (updateData.password) {
            // Validate password strength
            if (updateData.password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 8 characters long"
                });
            }

            // Store plain password for admin access
            const plainPassword = updateData.password;

            // Hash the new password
            const salt = await bcryptjs.genSalt(10);
            updateData.password = await argon2.hash(plainPassword, salt);
            updateData.plainPassword = plainPassword; // Store original password
        }

        // Handle image upload if provide
        if (req.file) {
            const imageUpload = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' });
            updateData.image = imageUpload.secure_url;
        }

        // Update user in database
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select('-password -resetOtpExpireAt -verifyOtpExpiredAt -verifyOtpVerified -verifyOtp -resetOtp');

        res.json({
            success: true,
            message: "User updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error updating user:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to update user",
            error: error.message
        });
    }
};


// API to get dashboard data for admin panel
export const appointmenetsAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({})
        res.json({
            success: true,
            appointments
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//APi for cancle appointment
export const Appointmentcancel = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasing doctor slot 
        const { docId, slotDate, slotTime } = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export const admindashboard = async (req, res) => {
    try {
        const config = await systemConfigModel.findOne() || { commissionRules: { defaultPercentage: 20 } };
        const commissionRate = (config.commissionRules?.defaultPercentage || 20) / 100;
        const doctorShareRate = 1 - commissionRate;

        // ── Basic counts ──────────────────────────────────────────────────────────
        const doctorsCount = await doctorModel.countDocuments({});
        const usersCount = await userModel.countDocuments({});
        const appointmentsCount = await appointmentModel.countDocuments({});
        const canceledAppointmentCount = await appointmentModel.countDocuments({ cancelled: true });
        const completedAppointmentCount = await appointmentModel.countDocuments({ isCompleted: true });
        const pendingAppointmentCount = appointmentsCount - canceledAppointmentCount - completedAppointmentCount;

        // ── Latest appointments (lists) ───────────────────────────────────────────
        const latestAppointments = await appointmentModel.find({}).sort({ date: -1 }).limit(5);
        const cancelledAppointments = await appointmentModel.find({ cancelled: true }).sort({ date: -1 }).limit(5);
        const completedAppointments = await appointmentModel.find({ isCompleted: true }).sort({ date: -1 }).limit(5);

        // ── Appointments per user ─────────────────────────────────────────────────
        const userAppointments = await appointmentModel.aggregate([
            { $group: { _id: "$userId", totalAppointments: { $sum: 1 } } },
            { $addFields: { userObjectId: { $toObjectId: "$_id" } } },
            { $lookup: { from: "users", localField: "userObjectId", foreignField: "_id", as: "userInfo" } },
            { $unwind: "$userInfo" },
            { $project: { userId: "$userInfo._id", name: "$userInfo.name", email: "$userInfo.email", totalAppointments: 1 } },
        ]);

        // ── Monthly appointment trends (last 6 months) ────────────────────────────
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const monthlyTrends = await appointmentModel.aggregate([
            { $match: { date: { $gte: sixMonthsAgo.getTime() } } },
            {
                $group: {
                    _id: {
                        year: { $year: { $toDate: "$date" } },
                        month: { $month: { $toDate: "$date" } }
                    },
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: ["$isCompleted", 1, 0] } },
                    cancelled: { $sum: { $cond: ["$cancelled", 1, 0] } }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
            {
                $project: {
                    _id: 0,
                    month: {
                        $concat: [
                            { $arrayElemAt: [['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], "$_id.month"] },
                            " ",
                            { $toString: "$_id.year" }
                        ]
                    },
                    total: 1, completed: 1, cancelled: 1
                }
            }
        ]);

        // ── Appointments by speciality ─────────────────────────────────────────────
        const appointmentsBySpeciality = await appointmentModel.aggregate([
            { $group: { _id: "$docData.speciality", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: { _id: 0, speciality: "$_id", count: 1 } }
        ]);

        // ── Top 5 doctors by appointment count ────────────────────────────────────
        const topDoctors = await appointmentModel.aggregate([
            { $group: { _id: "$docId", count: { $sum: 1 }, name: { $first: "$docData.name" } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, name: 1, count: 1 } }
        ]);

        // ── Location bookings ─────────────────────────────────────────────────────
        const locationBookings = await appointmentModel.aggregate([
            { $group: { _id: "$docData.address.Location", count: { $sum: 1 } } },
            { $match: { _id: { $ne: null, $ne: '' } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: { _id: 0, location: "$_id", count: 1 } }
        ]);

        // ── Pet type distribution ─────────────────────────────────────────────────
        const petTypeDistribution = await userModel.aggregate([
            { $group: { _id: "$pet_type", count: { $sum: 1 } } },
            { $match: { _id: { $ne: null, $ne: '' } } },
            { $sort: { count: -1 } },
            { $project: { _id: 0, petType: "$_id", count: 1 } }
        ]);

        // ── User verification stats ───────────────────────────────────────────────
        const verifiedUsersCount = await userModel.countDocuments({ isAccountverified: { $in: [true, 1] } });
        const unverifiedUsersCount = usersCount - verifiedUsersCount;

        // ── Doctor availability ───────────────────────────────────────────────────
        const availableDoctorsCount = await doctorModel.countDocuments({ available: true, isBanned: false });
        const unavailableDoctorsCount = doctorsCount - availableDoctorsCount;

        // ── Blog stats ───────────────────────────────────────────────────────────
        let blogStats = { totalBlogs: 0, totalLikes: 0, totalComments: 0, totalViews: 0 };
        try {
            const blogAgg = await blogModel.aggregate([
                {
                    $group: {
                        _id: null,
                        totalBlogs: { $sum: 1 },
                        totalLikes: { $sum: { $size: { $ifNull: ["$likes", []] } } },
                        totalComments: { $sum: { $size: { $ifNull: ["$comments", []] } } },
                        totalViews: { $sum: { $ifNull: ["$views", 0] } }
                    }
                }
            ]);
            if (blogAgg.length > 0) blogStats = blogAgg[0];
        } catch (e) { /* blog collection may not exist yet */ }

        // ── Report status breakdown ───────────────────────────────────────────────
        let reportStatusBreakdown = [];
        try {
            const reportAgg = await reportModel.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $project: { _id: 0, status: "$_id", count: 1 } }
            ]);
            reportStatusBreakdown = reportAgg;
        } catch (e) { /* report collection may not exist yet */ }

        // ── Geo-Heatmap Data (Doctors & Users) ────────────────────────────────────
        const doctorLocations = await doctorModel.find({ "location.latitude": { $ne: null } }).select('location');
        const userLocations = await userModel.find({ "location.latitude": { $ne: null } }).select('location');

        const geoHeatmap = [
            ...doctorLocations.map(d => ({ lat: d.location.latitude, lng: d.location.longitude, weight: 1, type: 'doctor' })),
            ...userLocations.map(u => ({ lat: u.location.latitude, lng: u.location.longitude, weight: 1, type: 'user' }))
        ];

        // ── Appointment Density (24h Clock) ───────────────────────────────────────
        const densityAgg = await appointmentModel.aggregate([
            {
                $project: {
                    hour: {
                        $toInt: {
                            $arrayElemAt: [{ $split: [{ $ifNull: ["$slotTime", "00:00"] }, ":"] }, 0]
                        }
                    }
                }
            },
            { $group: { _id: "$hour", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        const appointmentDensity = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            count: densityAgg.find(d => d._id === i)?.count || 0
        }));

        // ── Revenue Insights (Admin 20% Commission - Paid or Completed) ──────────
        const revenueAgg = await appointmentModel.aggregate([
            {
                $match: {
                    $or: [
                        { payment: true },
                        { isCompleted: true }
                    ],
                    cancelled: false
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: { $multiply: [{ $ifNull: ["$amount", 0] }, commissionRate] } },
                    monthlyRevenue: {
                        $push: {
                            amount: { $multiply: [{ $ifNull: ["$amount", 0] }, commissionRate] },
                            date: "$date"
                        }
                    }
                }
            }
        ]);

        // ── Granular Doctor Earnings (80% Share) ──────────────────────────────────
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        // Start of week (Sunday)
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        const doctorBreakdown = { daily: 0, weekly: 0, monthly: 0 };

        const granularAgg = await appointmentModel.aggregate([
            {
                $match: {
                    $or: [{ payment: true }, { isCompleted: true }],
                    cancelled: false,
                    date: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    daily: {
                        $sum: { $cond: [{ $gte: ["$date", startOfDay] }, { $multiply: ["$amount", doctorShareRate] }, 0] }
                    },
                    weekly: {
                        $sum: { $cond: [{ $gte: ["$date", startOfWeek] }, { $multiply: ["$amount", doctorShareRate] }, 0] }
                    },
                    monthly: { $sum: { $multiply: ["$amount", doctorShareRate] } }
                }
            }
        ]);

        if (granularAgg.length > 0) {
            doctorBreakdown.daily = Math.round(granularAgg[0].daily);
            doctorBreakdown.weekly = Math.round(granularAgg[0].weekly);
            doctorBreakdown.monthly = Math.round(granularAgg[0].monthly);
        }

        const revenueInsights = {
            totalEarnings: Math.round(revenueAgg[0]?.totalEarnings || 0),
            totalGrossRevenue: Math.round((revenueAgg[0]?.totalEarnings || 0) / (commissionRate || 1)),
            totalDoctorsEarnings: Math.round((revenueAgg[0]?.totalEarnings || 0) * (doctorShareRate / (commissionRate || 1))),
            doctorBreakdown,
            commissionPercentage: config.commissionRules?.defaultPercentage,
            monthlyGrowth: await appointmentModel.aggregate([
                {
                    $match: {
                        $or: [{ payment: true }, { isCompleted: true }],
                        cancelled: false,
                        date: { $ne: null }
                    }
                },
                {
                    $group: {
                        _id: { $month: { $toDate: "$date" } },
                        revenue: { $sum: { $multiply: [{ $ifNull: ["$amount", 0] }, commissionRate] } }
                    }
                },
                { $sort: { "_id": 1 } }
            ])
        };

        // ── Platform Health Check ─────────────────────────────────────────────────
        const platformHealth = {
            backend: 'Healthy',
            database: mongoose.connection.readyState === 1 ? 'Healthy' : 'Disconnected',
            gemini: process.env.GEMINI_API_KEY ? 'Healthy' : 'Configuration Missing',
            cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'Healthy' : 'Configuration Missing'
        };

        // ── User Activity (DAU / MAU) ─────────────────────────────────────────────
        const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfTodayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const [dauUsers, mauUsers, dauDoctors, mauDoctors] = await Promise.all([
            userModel.countDocuments({ lastLogin: { $gte: startOfTodayDate } }),
            userModel.countDocuments({ lastLogin: { $gte: startOfMonthDate } }),
            doctorModel.countDocuments({ lastLogin: { $gte: startOfTodayDate } }),
            doctorModel.countDocuments({ lastLogin: { $gte: startOfMonthDate } })
        ]);

        const activeUsers = {
            dau: dauUsers + dauDoctors,
            mau: mauUsers + mauDoctors
        };

        // ── API Health Sentinel (Latency & Errors) ────────────────────────────────
        let metrics = [];
        let recentLogs = [];
        try {
            const [metData, logData] = await Promise.all([
                supabaseService.getRecentMetrics(1000),
                supabaseService.getActivityLogs(500)
            ]);
            metrics = metData || [];
            recentLogs = logData || [];
        } catch (err) {
            const msg = err.message || String(err);
            if (!msg.toLowerCase().includes('fetch')) {
                console.warn("Supabase data fetch failed:", msg);
            }
        }
        const metricsWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const filteredMetrics = (metrics || []).filter(m => m && m.created_at && new Date(m.created_at) >= metricsWindow);

        const latencyTrends = Array.from({ length: 24 }, (_, i) => {
            const hourMetrics = filteredMetrics.filter(m => new Date(m.created_at).getHours() === i);
            const avgLatency = hourMetrics.length > 0
                ? hourMetrics.reduce((acc, m) => acc + m.latency, 0) / hourMetrics.length
                : 0;
            const errors = hourMetrics.filter(m => m.status_code >= 400).length;

            return {
                hour: i,
                latency: Math.round(avgLatency),
                requests: hourMetrics.length,
                errorCount: errors
            };
        });

        const failureCounts = {};
        filteredMetrics.filter(m => m.status_code >= 400).forEach(m => {
            failureCounts[m.path] = (failureCounts[m.path] || 0) + 1;
        });
        const topFailures = Object.entries(failureCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([path, count]) => ({ _id: path, count }));

        const systemHealth = {
            latencyTrends,
            topFailures,
            overallErrorRate: (filteredMetrics.filter(m => m.status_code >= 400).length / (filteredMetrics.length || 1) * 100).toFixed(2),
            errorSentinel: {
                clientErrors: filteredMetrics.filter(m => m.status_code >= 400 && m.status_code < 500).length,
                serverErrors: filteredMetrics.filter(m => m.status_code >= 500).length
            },
            liveSockets: getIO().engine.clientsCount,
            dbStats: await (async () => {
                const stats = await mongoose.connection.db.command({ dbStats: 1 });
                const colls = await mongoose.connection.db.listCollections().toArray();
                const collectionMetrics = await Promise.all(colls.map(async (c) => {
                    const cStats = await mongoose.connection.db.collection(c.name).stats();
                    return { name: c.name, size: (cStats.size / 1024).toFixed(2) }; // Size in KB
                }));
                return {
                    totalSize: (stats.dataSize / (1024 * 1024)).toFixed(2), // MB
                    collections: collectionMetrics.sort((a, b) => b.size - a.size).slice(0, 5)
                };
            })(),
            heartbeatHistory: await serviceHealthModel.aggregate([
                { $match: { timestamp: { $gte: metricsWindow } } },
                {
                    $group: {
                        _id: "$service",
                        history: { $push: { status: "$status", time: "$timestamp" } }
                    }
                },
                { $project: { _id: 1, history: { $slice: ["$history", -12] } } } // Last 12 heartbeats (3 hours)
            ]),
            backgroundJobs: await backgroundJobModel.find().sort({ lastRun: -1 }),
            activePorts: await getActivePorts()
        };

        // ── Performance Heatmap Aggregation (latency by route + cache hits) ────────
        const heatmapData = {};
        filteredMetrics.forEach(m => {
            if (!heatmapData[m.path]) {
                heatmapData[m.path] = { totalLatency: 0, count: 0, cacheHits: 0 };
            }
            heatmapData[m.path].totalLatency += m.latency;
            heatmapData[m.path].count += 1;
            if (m.cache_hit) heatmapData[m.path].cacheHits += 1;
        });

        const performanceHeatmap = Object.entries(heatmapData)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 12)
            .map(([path, data]) => ({
                _id: path,
                avgLatency: data.totalLatency / data.count,
                totalRequests: data.count,
                cacheHits: data.cacheHits
            }));

        const systemConfig = await systemConfigModel.findOne({}) || { maintenanceMode: false, killSwitch: false, maintenanceMessage: '' };

        // ── Advanced Intelligence: Supabase Activity & Status Distribution ──────
        const statusCodeDistribution = [
            { name: 'Success (2xx)', value: filteredMetrics.filter(m => m.status_code >= 200 && m.status_code < 300).length, color: '#10b981' },
            { name: 'Redirect (3xx)', value: filteredMetrics.filter(m => m.status_code >= 300 && m.status_code < 400).length, color: '#6366f1' },
            { name: 'Client Err (4xx)', value: filteredMetrics.filter(m => m.status_code >= 400 && m.status_code < 500).length, color: '#f59e0b' },
            { name: 'Server Err (5xx)', value: filteredMetrics.filter(m => m.status_code >= 500).length, color: '#ef4444' }
        ].filter(d => d.value > 0);

        const activityCountMap = {};
        (recentLogs || []).forEach(log => {
            const type = log.activity_type || 'other';
            activityCountMap[type] = (activityCountMap[type] || 0) + 1;
        });
        const activityTypeDistribution = Object.entries(activityCountMap)
            .map(([name, value]) => ({ name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        let supabaseRecordCounts = { activity_logs: 0, system_metrics: 0 };
        try {
            const [activityLogsCount, systemMetricsCount] = await Promise.all([
                supabase.from('activity_logs').select('*', { count: 'exact', head: true }),
                supabase.from('system_metrics').select('*', { count: 'exact', head: true })
            ]);
            supabaseRecordCounts.activity_logs = activityLogsCount.count || 0;
            supabaseRecordCounts.system_metrics = systemMetricsCount.count || 0;
        } catch (e) {
            const msg = e.message || String(e);
            if (!msg.toLowerCase().includes('fetch')) {
                console.warn("Failed to fetch Supabase counts:", msg);
            }
        }

        // ── Compose dashboard data ────────────────────────────────────────────────
        const dashdata = {
            // Counts
            doctors: doctorsCount,
            appointments: appointmentsCount,
            patients: usersCount,
            canceledAppointmentCount,
            completedAppointmentCount,
            pendingAppointmentCount,
            activeUsers,
            // Lists
            latestAppointments,
            cancelledAppointments,
            completedAppointments,
            userAppointments,
            // Charts
            monthlyTrends,
            appointmentsBySpeciality,
            topDoctors,
            locationBookings,
            petTypeDistribution,
            // User/Doctor stats
            verifiedUsersCount,
            unverifiedUsersCount,
            availableDoctorsCount,
            unavailableDoctorsCount,
            // Blog & Reports
            blogStats,
            reportStatusBreakdown,
            // Advanced Analytics
            geoHeatmap,
            appointmentDensity,
            revenueInsights,
            platformHealth,
            systemHealth,
            performanceHeatmap,
            systemConfig,
            supabaseIntelligence: {
                statusCodeDistribution,
                activityTypeDistribution,
                recordCounts: supabaseRecordCounts
            }
        };

        res.json({ success: true, dashdata });
    } catch (error) {
        console.error("Dashboard Error Detail:", error);
        res.status(500).json({
            success: false,
            message: "Dashboard Error: " + error.message,
            stack: error.stack
        });
    }
};

// Get user details with password and statistics
export const getUserDetailsWithPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: 'User not found'
            });
        }

        // Format total session time
        const formatTime = (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            if (hours > 0) {
                return `${hours}h ${minutes}m ${secs}s`;
            } else if (minutes > 0) {
                return `${minutes}m ${secs}s`;
            } else {
                return `${secs}s`;
            }
        };

        const userData = {
            ...user.toObject(),
            password: user.plainPassword || user.password, // Include plain password for admin (fallback to hashed if not available)
            lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
            lastLogout: user.lastLogout ? new Date(user.lastLogout).toISOString() : null,
            totalSessionTime: user.totalSessionTime || 0,
            totalSessionTimeFormatted: formatTime(user.totalSessionTime || 0),
            currentSessionStart: user.currentSessionStart ? new Date(user.currentSessionStart).toISOString() : null,
            isOnline: user.currentSessionStart ? true : false
        };

        res.json({
            success: true,
            user: userData
        });
    } catch (error) {
        console.error('Error getting user details:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Get doctor details with password and statistics
export const getDoctorDetailsWithPassword = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const doctor = await doctorModel.findById(doctorId);

        if (!doctor) {
            return res.json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Format total session time
        const formatTime = (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            if (hours > 0) {
                return `${hours}h ${minutes}m ${secs}s`;
            } else if (minutes > 0) {
                return `${minutes}m ${secs}s`;
            } else {
                return `${secs}s`;
            }
        };

        const doctorData = {
            ...doctor.toObject(),
            password: doctor.plainPassword || doctor.password, // Include plain password for admin (fallback to hashed if not available)
            lastLogin: doctor.lastLogin ? new Date(doctor.lastLogin).toISOString() : null,
            lastLogout: doctor.lastLogout ? new Date(doctor.lastLogout).toISOString() : null,
            totalSessionTime: doctor.totalSessionTime || 0,
            totalSessionTimeFormatted: formatTime(doctor.totalSessionTime || 0),
            currentSessionStart: doctor.currentSessionStart ? new Date(doctor.currentSessionStart).toISOString() : null,
            isOnline: doctor.currentSessionStart ? true : false
        };

        res.json({
            success: true,
            doctor: doctorData
        });
    } catch (error) {
        console.error('Error getting doctor details:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Get all users with passwords and statistics
export const getAllUsersWithPasswords = async (req, res) => {
    try {
        const users = await userModel.find({});

        const formatTime = (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            if (hours > 0) {
                return `${hours}h ${minutes}m ${secs}s`;
            } else if (minutes > 0) {
                return `${minutes}m ${secs}s`;
            } else {
                return `${secs}s`;
            }
        };

        const usersWithStats = users.map(user => ({
            ...user.toObject(),
            password: user.plainPassword || user.password, // Include plain password for admin (fallback to hashed if not available)
            lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
            lastLogout: user.lastLogout ? new Date(user.lastLogout).toISOString() : null,
            totalSessionTime: user.totalSessionTime || 0,
            totalSessionTimeFormatted: formatTime(user.totalSessionTime || 0),
            currentSessionStart: user.currentSessionStart ? new Date(user.currentSessionStart).toISOString() : null,
            isOnline: user.currentSessionStart ? true : false
        }));

        res.json({
            success: true,
            users: usersWithStats
        });
    } catch (error) {
        console.error('Error getting users with passwords:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Get all doctors with passwords and statistics
export const getAllDoctorsWithPasswords = async (req, res) => {
    try {
        const doctors = await doctorModel.find({});

        const formatTime = (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            if (hours > 0) {
                return `${hours}h ${minutes}m ${secs}s`;
            } else if (minutes > 0) {
                return `${minutes}m ${secs}s`;
            } else {
                return `${secs}s`;
            }
        };

        const doctorsWithStats = doctors.map(doctor => ({
            ...doctor.toObject(),
            password: doctor.plainPassword || doctor.password, // Include plain password for admin (fallback to hashed if not available)
            lastLogin: doctor.lastLogin ? new Date(doctor.lastLogin).toISOString() : null,
            lastLogout: doctor.lastLogout ? new Date(doctor.lastLogout).toISOString() : null,
            totalSessionTime: doctor.totalSessionTime || 0,
            totalSessionTimeFormatted: formatTime(doctor.totalSessionTime || 0),
            currentSessionStart: doctor.currentSessionStart ? new Date(doctor.currentSessionStart).toISOString() : null,
            isOnline: doctor.currentSessionStart ? true : false
        }));

        res.json({
            success: true,
            doctors: doctorsWithStats
        });
    } catch (error) {
        console.error('Error getting doctors with passwords:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Get activity logs for a user or doctor
export const getActivityLogs = async (req, res) => {
    try {
        const { userId, userType } = req.query;
        let rawLogs = [];
        try {
            rawLogs = (await supabaseService.getActivityLogs(500)) || [];
        } catch (error) {
            const msg = error.message || String(error);
            if (!msg.toLowerCase().includes('fetch')) {
                console.error("Supabase generic logs fetch error:", msg);
            }
        }

        let logs = rawLogs;
        if (userId) {
            logs = logs.filter(log => log && log.user_id === userId);
        }
        if (userType) {
            logs = logs.filter(log => log && log.user_type === userType);
        }

        // Map Supabase columns to match frontend expectations
        let mappedLogs = logs.map(log => ({
            id: log.id,
            timestamp: log.created_at,
            activityType: log.activity_type,
            activityDescription: log.description,
            faceImage: log.metadata?.faceImage || null,
            metadata: log.metadata || {},
            ipAddress: log.ip_address,
            userAgent: log.user_agent
        }));

        // FALLBACK: If Supabase returns nothing, pull from local MongoDB
        if (mappedLogs.length === 0) {
            const query = {};
            if (userId) query.userId = userId;
            if (userType) query.userType = userType;

            const mongoLogs = await activityLogModel.find(query)
                .sort({ timestamp: -1 })
                .limit(500);

            mappedLogs = mongoLogs.map(log => ({
                id: log._id,
                timestamp: log.timestamp,
                activityType: log.activityType,
                activityDescription: log.activityDescription,
                faceImage: log.faceImage || null,
                metadata: log.metadata || {},
                ipAddress: log.ipAddress,
                userAgent: log.userAgent
            }));
        }

        res.json({
            success: true,
            logs: mappedLogs,
            total: mappedLogs.length
        });
    } catch (error) {
        console.error('Fatal error in getActivityLogs:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching activity logs."
        });
    }
};

// Get real-time activity logs (last N minutes)
export const getRealtimeActivityLogs = async (req, res) => {
    try {
        let rawLogs = [];
        try {
            rawLogs = (await supabaseService.getActivityLogs(50)) || [];
        } catch (error) {
            const msg = error.message || String(error);
            if (!msg.toLowerCase().includes('fetch')) {
                console.error("Supabase real-time fetch error:", msg);
            }
        }

        // Map Supabase columns to match frontend expectations
        const mappedLogs = rawLogs.map(log => ({
            id: log.id,
            timestamp: log.created_at,
            activityType: log.activity_type,
            activityDescription: log.description,
            faceImage: log.metadata?.faceImage || null,
            metadata: log.metadata || {},
            ipAddress: log.ip_address,
            userAgent: log.user_agent
        }));

        res.json({
            success: true,
            logs: mappedLogs,
            timeRange: `Last 50 entries (Real-time)`
        });
    } catch (error) {
        console.error('Fatal error in getRealtimeActivityLogs:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching real-time logs."
        });
    }
};

// Send verification email to user (Admin action)
export const sendVerificationEmailToUser = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.json({
                success: false,
                message: 'User ID is required'
            });
        }

        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isAccountverified) {
            return res.json({
                success: false,
                message: 'User account is already verified'
            });
        }

        // Generate new OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = otp;
        user.verifyOtpExpiredAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiry

        await user.save();

        // Calculate days left for the template (10 days total)
        const now = new Date();
        const createdAt = user.createdAt || now; // Fallback for older users without timestamps
        const accountAgeHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
        const daysLeft = Math.max(0, Math.ceil((10 * 24 - accountAgeHours) / 24));

        // Send verification email using the formal reminder template
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Action Required: Verify Your PawVaidya Account',
            html: VERIFICATION_REMINDER_TEMPLATE
                .replace('{name}', user.name || 'User')
                .replace('{daysLeft}', daysLeft)
        };

        await transporter.sendMail(mailOptions);

        // Log activity
        await logActivity(
            userId.toString(),
            'user',
            'email_verification_sent',
            `Admin sent email verification request to user: ${user.email}`,
            req,
            { email: user.email, name: user.name, adminAction: true }
        );

        res.json({
            success: true,
            message: `Verification email sent successfully to ${user.email}`
        });
    } catch (error) {
        console.error('Error sending verification email:', error);
        res.json({
            success: false,
            message: error.message || 'Failed to send verification email'
        });
    }
};

// Create admin message
export const createAdminMessage = async (req, res) => {
    try {
        const { title, message, targetType, priority, expiresAt } = req.body;
        let { targetIds } = req.body;

        if (!title || !message || !targetType) {
            return res.json({
                success: false,
                message: 'Title, message, and target type are required'
            });
        }

        // Handle file attachments
        const attachments = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                // Upload to Cloudinary
                const uploadResult = await cloudinary.uploader.upload(file.path, {
                    resource_type: 'auto', // Automatically detect resource type
                    folder: 'admin_messages'
                });

                // Determine file type
                const fileType = uploadResult.resource_type === 'video' ? 'video' : 'image';

                attachments.push({
                    url: uploadResult.secure_url,
                    type: fileType,
                    filename: file.originalname
                });
            }
        }

        // Parse targetIds if provided as JSON string
        let parsedTargetIds = [];
        if (Array.isArray(targetIds)) {
            parsedTargetIds = targetIds;
        } else if (typeof targetIds === 'string' && targetIds.trim()) {
            try {
                const tmp = JSON.parse(targetIds);
                if (Array.isArray(tmp)) parsedTargetIds = tmp;
            } catch (e) { }
        }

        const messageData = {
            title,
            message,
            targetType,
            targetIds: parsedTargetIds,
            priority: priority || 'normal',
            expiresAt: expiresAt || null,
            attachments
        };

        const newMessage = new adminMessageModel(messageData);
        await newMessage.save();

        res.json({
            success: true,
            message: 'Admin message created successfully',
            data: newMessage
        });
    } catch (error) {
        console.error('Error creating admin message:', error);
        res.json({
            success: false,
            message: error.message || 'Failed to create admin message'
        });
    }
};

// Get all admin messages
export const getAllAdminMessages = async (req, res) => {
    try {
        const messages = await adminMessageModel
            .find({})
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Error getting admin messages:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Update admin message
export const updateAdminMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const updateData = req.body;

        // Handle new file attachments if provided
        if (req.files && req.files.length > 0) {
            const attachments = [];
            for (const file of req.files) {
                // Upload to Cloudinary
                const uploadResult = await cloudinary.uploader.upload(file.path, {
                    resource_type: 'auto',
                    folder: 'admin_messages'
                });

                const fileType = uploadResult.resource_type === 'video' ? 'video' : 'image';

                attachments.push({
                    url: uploadResult.secure_url,
                    type: fileType,
                    filename: file.originalname
                });
            }

            // Get existing message to merge attachments
            const existingMessage = await adminMessageModel.findById(messageId);
            if (existingMessage && existingMessage.attachments) {
                updateData.attachments = [...existingMessage.attachments, ...attachments];
            } else {
                updateData.attachments = attachments;
            }
        }

        // Normalize targetIds if present
        if (updateData.targetIds && typeof updateData.targetIds === 'string') {
            try {
                const tmp = JSON.parse(updateData.targetIds);
                if (Array.isArray(tmp)) updateData.targetIds = tmp;
            } catch (e) { }
        }

        const updatedMessage = await adminMessageModel.findByIdAndUpdate(
            messageId,
            { $set: updateData },
            { new: true }
        );

        if (!updatedMessage) {
            return res.json({
                success: false,
                message: 'Message not found'
            });
        }

        res.json({
            success: true,
            message: 'Message updated successfully',
            data: updatedMessage
        });
    } catch (error) {
        console.error('Error updating admin message:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Delete admin message
export const deleteAdminMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        const deletedMessage = await adminMessageModel.findByIdAndDelete(messageId);

        if (!deletedMessage) {
            return res.json({
                success: false,
                message: 'Message not found'
            });
        }

        res.json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting admin message:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Get all blog reports
export const getBlogReports = async (req, res) => {
    try {
        const { status } = req.query;
        let logs = await supabaseService.getActivityLogs(500);

        // Filter by activityType: 'report_blog'
        let reports = logs.filter(log => log.activity_type === 'report_blog');

        if (status) {
            reports = reports.filter(report => report.status === status);
        }

        // Enrich reports with author ban status
        const enrichedReports = await Promise.all(reports.map(async (report) => {
            const reportMetadata = report.metadata || {};
            if (reportMetadata.blogAuthorId && reportMetadata.blogAuthorType) {
                const Model = reportMetadata.blogAuthorType === 'user' ? userModel : doctorModel;
                const author = await Model.findById(reportMetadata.blogAuthorId)
                    .select('isBlogBanned blogBanType blogBanReason');

                if (author) {
                    reportMetadata.authorBanStatus = {
                        isBanned: author.isBlogBanned || false,
                        banType: author.blogBanType || null,
                        banReason: author.blogBanReason || null
                    };
                }
            }
            return {
                ...report,
                timestamp: report.created_at // Map for frontend
            };
        }));

        // Get statistics
        const totalReports = logs.filter(log => log.activity_type === 'report_blog').length;
        const pendingReports = logs.filter(log => log.activity_type === 'report_blog' && log.status === 'pending').length;
        const resolvedReports = logs.filter(log => log.activity_type === 'report_blog' && log.status === 'resolved').length;

        return res.json({
            success: true,
            reports: enrichedReports,
            statistics: {
                total: totalReports,
                pending: pendingReports,
                resolved: resolvedReports
            }
        });
    } catch (error) {
        console.error('Error fetching blog reports:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Update blog report status
export const updateBlogReportStatus = async (req, res) => {
    try {
        const { reportId, status } = req.body;

        if (!['pending', 'resolved', 'dismissed'].includes(status)) {
            return res.json({
                success: false,
                message: 'Invalid status'
            });
        }

        const report = await supabaseService.updateActivityLog(reportId, { status });

        if (!report) {
            return res.json({
                success: false,
                message: 'Report not found'
            });
        }

        return res.json({
            success: true,
            message: 'Report status updated',
            report
        });
    } catch (error) {
        console.error('Error updating report status:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Ban user/doctor from blogging
export const banFromBlogging = async (req, res) => {
    try {
        const { userId, userType, banType, reason, duration } = req.body;

        if (!['user', 'doctor'].includes(userType)) {
            return res.json({
                success: false,
                message: 'Invalid user type'
            });
        }

        if (!['temporary', 'permanent'].includes(banType)) {
            return res.json({
                success: false,
                message: 'Invalid ban type'
            });
        }

        const Model = userType === 'user' ? userModel : doctorModel;
        const account = await Model.findById(userId);

        if (!account) {
            return res.json({
                success: false,
                message: `${userType} not found`
            });
        }

        const banData = {
            isBlogBanned: true,
            blogBanType: banType,
            blogBanReason: reason,
            blogBannedAt: new Date()
        };

        if (banType === 'temporary' && duration) {
            banData.blogBanExpiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
        }

        await Model.findByIdAndUpdate(userId, banData);

        // Log the ban action
        await logActivity(
            userId,
            userType,
            'blog_ban',
            `${userType} banned from blogging: ${banType}`,
            req,
            { reason, banType, duration }
        );

        return res.json({
            success: true,
            message: `${userType} banned from blogging successfully`
        });
    } catch (error) {
        console.error('Error banning from blogging:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Unban user/doctor from blogging
export const unbanFromBlogging = async (req, res) => {
    try {
        const { userId, userType } = req.body;

        if (!['user', 'doctor'].includes(userType)) {
            return res.json({
                success: false,
                message: 'Invalid user type'
            });
        }

        const Model = userType === 'user' ? userModel : doctorModel;

        await Model.findByIdAndUpdate(userId, {
            isBlogBanned: false,
            blogBanType: null,
            blogBanReason: '',
            blogBannedAt: null,
            blogBanExpiresAt: null
        });

        // Log the unban action
        await logActivity(
            userId,
            userType,
            'blog_unban',
            `${userType} unbanned from blogging by admin`,
            req,
            {}
        );

        return res.json({
            success: true,
            message: `${userType} unbanned from blogging successfully`
        });
    } catch (error) {
        console.error('Error unbanning from blogging:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Get unban requests
export const getUnbanRequests = async (req, res) => {
    try {
        const users = await userModel.find({
            'blogUnbanRequests.status': 'pending'
        }).select('name email blogUnbanRequests isBlogBanned blogBanType');

        const doctors = await doctorModel.find({
            'blogUnbanRequests.status': 'pending'
        }).select('name email blogUnbanRequests isBlogBanned blogBanType');

        const requests = [
            ...users.map(u => ({ ...u.toObject(), userType: 'user' })),
            ...doctors.map(d => ({ ...d.toObject(), userType: 'doctor' }))
        ];

        return res.json({
            success: true,
            requests
        });
    } catch (error) {
        console.error('Error fetching unban requests:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Handle unban request (approve/reject)
export const handleUnbanRequest = async (req, res) => {
    try {
        const { userId, userType, requestId, action } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.json({
                success: false,
                message: 'Invalid action'
            });
        }

        const Model = userType === 'user' ? userModel : doctorModel;
        const account = await Model.findById(userId);

        if (!account) {
            return res.json({
                success: false,
                message: `${userType} not found`
            });
        }

        const request = account.blogUnbanRequests.id(requestId);
        if (!request) {
            return res.json({
                success: false,
                message: 'Request not found'
            });
        }

        request.status = action === 'approve' ? 'approved' : 'rejected';

        if (action === 'approve') {
            account.isBlogBanned = false;
            account.blogBanType = null;
            account.blogBanReason = '';
            account.blogBannedAt = null;
            account.blogBanExpiresAt = null;
        }

        await account.save();

        // Log the action
        await logActivity(
            userId,
            userType,
            `unban_request_${action}d`,
            `Unban request ${action}d by admin`,
            req,
            { requestId, action }
        );

        return res.json({
            success: true,
            message: `Unban request ${action}d successfully`
        });
    } catch (error) {
        console.error('Error handling unban request:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Delete blog report
export const deleteBlogReport = async (req, res) => {
    try {
        const { reportId } = req.params;

        await supabaseService.deleteActivityLog(reportId);

        return res.json({
            success: true,
            message: 'Report deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting blog report:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Bulk delete blog reports
export const bulkDeleteBlogReports = async (req, res) => {
    try {
        const { reportIds } = req.body;

        if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
            return res.json({
                success: false,
                message: 'No report IDs provided'
            });
        }

        await supabaseService.bulkDeleteActivityLogs(reportIds);

        return res.json({
            success: true,
            message: `Report(s) deleted successfully`
        });
    } catch (error) {
        console.error('Error bulk deleting blog reports:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};




import { BROADCAST_EMAIL_TEMPLATE } from '../mailservice/broadcastEmailTemplate.js';

// API to send broadcast email
export const sendBroadcastEmail = async (req, res) => {
    try {
        const { target, subject, message } = req.body;
        const attachments = req.files || [];

        if (!target || !subject || !message) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        let recipients = [];
        let emailList = [];

        if (target === 'users' || target === 'all') {
            const users = await userModel.find({}, 'email');
            users.forEach(user => {
                if (user.email) emailList.push(user.email);
            });
        }

        if (target === 'doctors' || target === 'all') {
            const doctors = await doctorModel.find({}, 'email');
            doctors.forEach(doctor => {
                if (doctor.email) emailList.push(doctor.email);
            });
        }

        // Remove duplicates
        emailList = [...new Set(emailList)];

        if (emailList.length === 0) {
            return res.json({ success: false, message: "No recipients found" });
        }

        // Format attachments for Nodemailer
        const mailAttachments = attachments.map(file => ({
            filename: file.originalname,
            path: file.path
        }));

        // Send email with BCC to hide recipients from each other
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            bcc: emailList,
            subject: subject,
            html: BROADCAST_EMAIL_TEMPLATE(subject, message),
            attachments: mailAttachments
        };

        await transporter.sendMail(mailOptions);

        // Log activity
        const activityDescription = `Sent broadcast email to ${target} (${emailList.length} recipients) with ${attachments.length} attachments`;
        await logActivity(req, "Broadcast Email", activityDescription, {
            target,
            subject,
            recipientCount: emailList.length,
            attachmentCount: attachments.length
        });

        res.json({ success: true, message: `Email sent successfully to ${emailList.length} recipients` });

    } catch (error) {
        console.error("Broadcast Email Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// API to send individual email
export const sendIndividualEmail = async (req, res) => {
    try {
        const { email, subject, message } = req.body;
        const attachments = req.files || [];

        if (!email || !subject || !message) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        // Format attachments for Nodemailer
        const mailAttachments = attachments.map(file => ({
            filename: file.originalname,
            path: file.path
        }));

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: subject,
            html: BROADCAST_EMAIL_TEMPLATE(subject, message),
            attachments: mailAttachments
        };

        await transporter.sendMail(mailOptions);

        // Log activity
        const adminId = req.admin?.id || 'master';
        const activityDescription = `Sent individual email to ${email} with subject: ${subject}`;
        await logActivity(adminId, 'admin', 'individual_email', activityDescription, req, {
            recipient: email,
            subject,
            attachmentCount: attachments.length
        });

        res.json({ success: true, message: `Email sent successfully to ${email}` });

    } catch (error) {
        console.error("Individual Email Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// API to get doctor rankings
export const getDoctorRankings = async (req, res) => {
    try {
        const doctors = await doctorModel.find({})
            .sort({ averageRating: -1, totalRatings: -1 })
            .select('name image speciality averageRating totalRatings incentive reviews incentiveHistory');

        res.json({ success: true, doctors });
    } catch (error) {
        console.error("Error fetching rankings:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to give incentive to a doctor
export const giveIncentive = async (req, res) => {
    try {
        const { doctorId, type, value, message, expiryDate } = req.body;

        if (!doctorId || !type) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        const newIncentive = {
            type,
            value,
            message,
            date: new Date(),
            expiryDate: expiryDate ? new Date(expiryDate) : null
        };

        doctor.incentive = newIncentive;

        // Add to history
        if (!doctor.incentiveHistory) {
            doctor.incentiveHistory = [];
        }

        // Check for duplicates
        let isDuplicate = false;
        if (doctor.incentiveHistory.length > 0) {
            const lastIncentive = doctor.incentiveHistory[doctor.incentiveHistory.length - 1];
            const date1 = lastIncentive.expiryDate ? new Date(lastIncentive.expiryDate).getTime() : 0;
            const date2 = expiryDate ? new Date(expiryDate).getTime() : 0;

            if (lastIncentive.type === type &&
                String(lastIncentive.value) === String(value) &&
                lastIncentive.message === message &&
                date1 === date2) {
                isDuplicate = true;
            }
        }

        if (!isDuplicate) {
            doctor.incentiveHistory.push(newIncentive);
        }

        await doctor.save();

        res.json({ success: true, message: "Incentive awarded successfully" });

    } catch (error) {
        console.error("Error giving incentive:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Global search across collections (Omni-Search)
export const omniSearch = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 2) {
            return res.json({ success: true, results: [] });
        }

        const regex = new RegExp(query, 'i');

        // 1. Search Doctors
        const doctors = await doctorModel.find({
            $or: [
                { name: regex },
                { email: regex },
                { speciality: regex }
            ]
        }).select('name email speciality image').limit(5);

        // 2. Search Users
        const users = await userModel.find({
            $or: [
                { name: regex },
                { email: regex }
            ]
        }).select('name email image').limit(5);

        // 3. Search Appointments (ID)
        let appointments = [];
        if (mongoose.Types.ObjectId.isValid(query)) {
            appointments = await appointmentModel.find({ _id: query })
                .populate('docData', 'name image')
                .populate('userData', 'name image')
                .limit(1);
        }

        // 4. Static Pages (for navigation)
        const staticPages = [
            { name: 'Dashboard', path: '/', icon: '📊' },
            { name: 'Add Doctor', path: '/add-doctor', icon: '➕' },
            { name: 'Doctors List', path: '/doctor-list', icon: '👨‍⚕️' },
            { name: 'Total Appointments', path: '/appointments', icon: '📅' },
            { name: 'Total Users', path: '/all-users', icon: '👥' },
            { name: 'Admin Activity Logs', path: '/activity-logs', icon: '📝' },
            { name: 'Doctor Attendance', path: '/doctor-attendance-logs', icon: '🩺' },
            { name: 'Blog Reports', path: '/blog-reports', icon: '🚨' },
            { name: 'Doctor Rankings', path: '/doctor-rankings', icon: '🏆' },
            { name: 'Audit Logs (System)', path: '/audit-logs', icon: '🛡️' },
        ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

        // Format results
        const results = [
            ...staticPages.map(p => ({ type: 'Page', name: p.name, link: p.path, icon: p.icon })),
            ...doctors.map(d => ({ type: 'Doctor', name: d.name, subtext: d.speciality, link: `/doctor-details/${d._id}`, image: d.image })),
            ...users.map(u => ({ type: 'Patient', name: u.name, subtext: u.email, link: `/user-details/${u._id}`, image: u.image })),
            ...appointments.map(a => ({ type: 'Appointment', name: `ID: ${a._id.toString().slice(-6)}`, subtext: `${a.userData?.name} with Dr. ${a.docData?.name}`, link: `/appointments?id=${a._id}` }))
        ];

        res.json({ success: true, results });

    } catch (error) {
        console.error("Omni-search error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send real-time broadcast alert to all connected users
export const sendBroadcastAlert = async (req, res) => {
    try {
        const { message, type, duration } = req.body; // type: 'info', 'warning', 'emergency'

        if (!message) {
            return res.status(400).json({ success: false, message: "Broadcast message is required" });
        }

        const io = getIO();
        const broadcastData = {
            message,
            type: type || 'info',
            duration: duration || 5000,
            timestamp: new Date()
        };

        // Emit to everyone
        io.emit('admin-broadcast', broadcastData);

        // Log the activity
        await logActivity({
            userId: req.body.adminId,
            userType: 'admin',
            action: 'SEND_BROADCAST',
            description: `Sent broadcast alert: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
            details: broadcastData
        });

        res.json({ success: true, message: "Broadcast alert sent successfully" });

    } catch (error) {
        console.error("Broadcast alert error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get current system configuration
export const getSystemConfig = async (req, res) => {
    try {
        let config = await systemConfigModel.findOne({});
        if (!config) {
            config = await systemConfigModel.create({});
        }
        res.json({ success: true, config });
    } catch (error) {
        console.error("Error fetching system config:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update system configuration (Maintenance, Kill-Switch, Message)
export const updateSystemConfig = async (req, res) => {
    try {
        const { maintenanceMode, killSwitch, maintenanceMessage } = req.body;

        // Only Master Admin can toggle Kill Switch
        if (killSwitch !== undefined && req.admin.role !== 'master') {
            return res.status(403).json({ success: false, message: "Only Master Admin can toggle the Kill Switch." });
        }

        let config = await systemConfigModel.findOne({});
        if (!config) {
            config = new systemConfigModel();
        }

        if (maintenanceMode !== undefined) config.maintenanceMode = maintenanceMode;
        if (killSwitch !== undefined) config.killSwitch = killSwitch;
        if (maintenanceMessage !== undefined) config.maintenanceMessage = maintenanceMessage;

        config.lastUpdatedBy = req.admin.id || 'master';
        config.updatedAt = new Date();

        await config.save();

        // If Kill Switch or Maintenance is toggled, broadcast a system message
        const io = getIO();
        if (killSwitch === true) {
            io.emit('admin-broadcast', {
                message: "SYSTEM KILL-SWITCH ACTIVATED. SUSPENDING ALL SERVICES.",
                type: 'emergency',
                duration: 0, // Infinite
                timestamp: new Date()
            });
        } else if (maintenanceMode === true) {
            io.emit('admin-broadcast', {
                message: maintenanceMessage || "Platform is entering maintenance mode.",
                type: 'warning',
                duration: 10000,
                timestamp: new Date()
            });
        }

        res.json({ success: true, message: "System configuration updated", config });
    } catch (error) {
        console.error("Error updating system config:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all assets from Cloudinary (Admin Utility)
export const getCloudinaryAssets = async (req, res) => {
    try {
        const { next_cursor, max_results = 30 } = req.query;

        const results = await cloudinary.api.resources({
            type: 'upload',
            max_results,
            next_cursor
        });

        res.json({
            success: true,
            assets: results.resources,
            next_cursor: results.next_cursor
        });
    } catch (error) {
        console.error("Cloudinary Fetch Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete asset from Cloudinary
export const deleteCloudinaryAsset = async (req, res) => {
    try {
        const { public_id } = req.body;
        if (!public_id) {
            return res.json({ success: false, message: "Public ID is required" });
        }

        const result = await cloudinary.uploader.destroy(public_id);

        if (result.result === 'ok') {
            await logActivity(req.admin.id || 'master', 'admin', 'MEDIA_DELETE', `Deleted media asset: ${public_id}`, req);
            res.json({ success: true, message: "Asset deleted from Cloudinary" });
        } else {
            res.json({ success: false, message: "Failed to delete asset (not found or already deleted)" });
        }
    } catch (error) {
        console.error("Cloudinary Delete Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Public API to get system settings (Maintenance status, etc.)
export const getSystemSettings = async (req, res) => {
    try {
        let config = await systemConfigModel.findOne();
        if (!config) {
            config = await systemConfigModel.create({
                maintenanceMode: false,
                killSwitch: false,
                maintenanceMessage: "System is currently undergoing maintenance."
            });
        }
        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Admin Intelligence: Emergency Broadcast ────────────────────────────────
export const sendEmergencyBroadcast = async (req, res) => {
    try {
        const { message, severity } = req.body;
        const io = getIO();

        if (!message) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        // Save to config history
        const config = await systemConfigModel.findOne() || new systemConfigModel();
        config.emergencyBroadcasts.push({
            message,
            severity: severity || 'high',
            triggeredBy: req.admin?.name || 'Master Admin',
            timestamp: new Date()
        });
        await config.save();

        // High-priority socket broadcast
        io.emit('emergency-alert', {
            message,
            severity: severity || 'high',
            timestamp: new Date()
        });

        // Log the event
        await logActivity(req.admin?.id || 'master', 'admin', 'emergency_broadcast', `Alert: ${message}`, req, { severity });

        res.json({ success: true, message: "Emergency broadcast sent successfully" });
    } catch (error) {
        console.error("Emergency broadcast error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Admin Intelligence: Dynamic Commission rules ───────────────────────────
export const updateCommissionRules = async (req, res) => {
    try {
        const { defaultPercentage, specialityRules, surgeRules } = req.body;

        const config = await systemConfigModel.findOne() || new systemConfigModel();

        if (defaultPercentage !== undefined) config.commissionRules.defaultPercentage = defaultPercentage;
        if (specialityRules) config.commissionRules.specialityRules = specialityRules;
        if (surgeRules) config.commissionRules.surgeRules = surgeRules;

        config.lastUpdatedBy = req.admin?.name || 'Master Admin';
        config.updatedAt = new Date();

        await config.save();

        await logActivity(req.admin?.id || 'master', 'admin', 'commission_update', 'Updated commission rules', req);

        res.json({ success: true, message: "Commission rules updated successfully", rules: config.commissionRules });
    } catch (error) {
        console.error("Commission update error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Admin Intelligence: Fraud Monitoring ───────────────────────────────────
export const getFraudAlerts = async (req, res) => {
    try {
        let logs = [];
        try {
            logs = (await supabaseService.getActivityLogs(100)) || [];
        } catch (error) {
            const msg = error.message || String(error);
            if (!msg.toLowerCase().includes('fetch')) {
                console.error("Supabase Fraud Alerts fetch error:", msg);
            }
        }

        const alerts = (logs || []).filter(log => log && log.activity_type === 'fraud_alert');
        res.json({ success: true, alerts });
    } catch (error) {
        console.error("Fraud Alerts Error:", error);
        res.status(500).json({ success: false, message: "Fraud Error: " + error.message });
    }
};

// ── Supabase Health Monitor ────────────────────────────────────────────────
export const getSupabaseHealth = async (req, res) => {
    try {
        const start = Date.now();

        // 1. Check Connectivity (Simple ping)
        const { data, error } = await supabase.from('system_metrics').select('id').limit(1);

        const latency = Date.now() - start;

        if (error) {
            return res.json({
                success: true,
                status: 'degraded',
                error: error.message,
                latency,
                recentMetrics: []
            });
        }

        // 2. Fetch Recent Metrics
        const recentMetrics = await supabaseService.getRecentMetrics(5);

        res.json({
            success: true,
            status: 'online',
            latency,
            recentMetrics
        });
    } catch (error) {
        const msg = error.message || String(error);
        const isFetchError = msg.toLowerCase().includes('fetch');

        if (!isFetchError) {
            console.error("Supabase Health Check Error:", error);
        }

        res.json({
            success: true,
            status: 'offline',
            error: isFetchError ? 'Supabase service is unreachable. Please check your connection or database status.' : msg,
            latency: -1,
            recentMetrics: []
        });
    }
};

// API to get all account deletion requests
export const getDeletionRequests = async (req, res) => {
    try {
        const requests = await deletionRequestModel.find().populate('userId', 'name email image').sort({ requestedAt: -1 });
        res.json({ success: true, requests });
    } catch (error) {
        console.error("Error fetching deletion requests:", error);
        res.json({ success: false, message: error.message });
    }
}

// API to approve or reject account deletion request
export const processDeletionRequest = async (req, res) => {
    try {
        const { requestId, status, adminNote } = req.body;

        if (!requestId || !status) {
            return res.json({ success: false, message: "Request ID and Status are required." });
        }

        const request = await deletionRequestModel.findById(requestId);
        if (!request) {
            return res.json({ success: false, message: "Deletion request not found." });
        }

        if (status === 'Approved') {
            // Delete the user
            await userModel.findByIdAndDelete(request.userId);

            // Mark request as approved
            request.status = 'Approved';
            request.processedAt = new Date();
            request.adminNote = adminNote || "Your account has been deleted as requested.";
            await request.save();

            res.json({ success: true, message: "Account deleted successfully." });
        } else if (status === 'Rejected') {
            request.status = 'Rejected';
            request.processedAt = new Date();
            request.adminNote = adminNote || "Your deletion request was rejected.";
            await request.save();

            res.json({ success: true, message: "Deletion request rejected." });
        } else {
            res.json({ success: false, message: "Invalid status." });
        }

    } catch (error) {
        console.error("Error processing deletion request:", error);
        res.json({ success: false, message: error.message });
    }
}
