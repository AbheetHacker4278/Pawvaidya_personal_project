import doctorModel from "../models/doctorModel.js"
import userModel from '../models/userModel.js';
import { transporter } from '../config/nodemailer.js';
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"
import { logActivity } from '../utils/activityLogger.js';
import adminMessageModel from '../models/adminMessageModel.js';
import { autoDeleteFilesOnCompletion } from './cleanupController.js';
import reminderModel from '../models/reminderModel.js';
import { v2 as cloudinary } from 'cloudinary';
import activityLogModel from '../models/activityLogModel.js';
import doctorScheduleModel from "../models/doctorScheduleModel.js";
import systemConfigModel from '../models/systemConfigModel.js';
import { getLocationFromIP, checkImpossibleTravel } from '../utils/fraudTracker.js';
import adminCouponModel from '../models/adminCouponModel.js';

const getDoctorWindow = async (docId) => {
    // Default window: 10:00 AM to 8:30 PM
    const defaultWindow = {
        startHour: 10,
        startMinute: 0,
        endHour: 20,
        endMinute: 30,
        isCustom: false
    };

    try {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[new Date().getDay()];

        const schedule = await doctorScheduleModel.findOne({
            doctorId: docId,
            dayOfWeek: dayName,
            isActive: true
        });

        if (schedule && schedule.startTime && schedule.endTime) {
            const [sHour, sMinute] = schedule.startTime.split(':').map(Number);
            const [eHour, eMinute] = schedule.endTime.split(':').map(Number);
            return {
                startHour: sHour,
                startMinute: sMinute,
                endHour: eHour,
                endMinute: eMinute,
                isCustom: true
            };
        }
    } catch (error) {
        console.error("Error fetching doctor schedule:", error);
    }

    return defaultWindow;
};

export const changeavailablity = async (req, res) => {
    try {
        const { docId } = req.body
        const docdata = await doctorModel.findById(docId)

        // Check if attendance is given today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const attendanceLog = await activityLogModel.findOne({
            userId: docId,
            userType: 'doctor',
            activityType: 'doctor_attendance',
            timestamp: { $gte: today }
        });

        // Check if current time is within allowed window
        const window = await getDoctorWindow(docId);
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const isWithinWindow = (currentHour > window.startHour || (currentHour === window.startHour && currentMinute >= window.startMinute)) &&
            (currentHour < window.endHour || (currentHour === window.endHour && currentMinute <= window.endMinute));

        if (!isWithinWindow && !docdata.available) {
            const startTimeStr = `${window.startHour}:${window.startMinute.toString().padStart(2, '0')}`;
            const endTimeStr = `${window.endHour}:${window.endMinute.toString().padStart(2, '0')}`;
            return res.json({
                success: false,
                message: `Availability can only be turned ON between ${startTimeStr} and ${endTimeStr}`
            });
        }

        if (!attendanceLog && !docdata.available) {
            return res.json({
                success: false,
                message: 'Must give attendance before making profile available'
            });
        }

        await doctorModel.findByIdAndUpdate(docId, { available: !docdata.available })
        res.json({
            success: true,
            message: 'Availablity changed'
        })
    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            message: error.message
        })
    }
}

// API to register face for doctor
export const registerFaceDr = async (req, res) => {
    try {
        const { docId, faceDescriptor, image } = req.body;

        if (!faceDescriptor || faceDescriptor.length !== 128) {
            return res.status(400).json({ success: false, message: "Invalid face descriptor" });
        }

        const doctor = await doctorModel.findById(docId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        doctor.faceDescriptor = faceDescriptor;
        await doctor.save();

        res.json({ success: true, message: "Face registered successfully" });

    } catch (error) {
        console.error("Error registering face:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to clock in with face
export const clockInDr = async (req, res) => {
    try {
        const { docId, faceDescriptor, image } = req.body;

        // Check if current time is within allowed window
        const window = await getDoctorWindow(docId);
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const isWithinWindow = (currentHour > window.startHour || (currentHour === window.startHour && currentMinute >= window.startMinute)) &&
            (currentHour < window.endHour || (currentHour === window.endHour && currentMinute <= window.endMinute));

        if (!isWithinWindow) {
            const startTimeStr = `${window.startHour}:${window.startMinute.toString().padStart(2, '0')}`;
            const endTimeStr = `${window.endHour}:${window.endMinute.toString().padStart(2, '0')}`;
            return res.status(400).json({
                success: false,
                message: `Attendance can only be given between ${startTimeStr} and ${endTimeStr}`
            });
        }

        if (!faceDescriptor || faceDescriptor.length !== 128) {
            return res.status(400).json({ success: false, message: "Invalid face descriptor" });
        }

        const doctor = await doctorModel.findById(docId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        if (!doctor.faceDescriptor || doctor.faceDescriptor.length !== 128) {
            return res.status(400).json({ success: false, message: "Face not registered for this doctor" });
        }

        const distance = Math.sqrt(faceDescriptor.reduce((acc, val, i) => acc + Math.pow(val - doctor.faceDescriptor[i], 2), 0));

        if (distance < 0.5) { // Threshold
            let faceImageUrl = '';
            if (image) {
                try {
                    const uploadResponse = await cloudinary.uploader.upload(image, { resource_type: 'image', folder: 'doctor_attendance' });
                    faceImageUrl = uploadResponse.secure_url;
                } catch (imgErr) {
                    console.error("Error uploading attendance image:", imgErr);
                }
            }

            await logActivity(docId, 'doctor', 'doctor_attendance', 'Clocked in via Face', req, { method: 'face' }, faceImageUrl);

            res.json({ success: true, message: "Attendance marked successfully" });
        } else {
            res.status(401).json({ success: false, message: "Face not recognized" });
        }

    } catch (error) {
        console.error("Error clocking in:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to check today's attendance status
export const checkAttendanceStatus = async (req, res) => {
    try {
        const { docId } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendanceLog = await activityLogModel.findOne({
            userId: docId,
            userType: 'doctor',
            activityType: 'doctor_attendance',
            timestamp: { $gte: today }
        });

        res.json({
            success: true,
            isClockedIn: !!attendanceLog,
            attendanceTime: attendanceLog ? attendanceLog.timestamp : null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const logoutdoctor = async (req, res) => {
    try {
        const docId = req.body.docId; // From authDoctor middleware

        if (docId) {
            const doctor = await doctorModel.findById(docId);
            if (doctor && doctor.currentSessionStart) {
                const now = new Date();
                const sessionDuration = Math.floor((now - doctor.currentSessionStart) / 1000);
                doctor.totalSessionTime = (doctor.totalSessionTime || 0) + sessionDuration;
                doctor.lastLogout = now;
                doctor.currentSessionStart = null;
                await doctor.save();

                // Log logout activity
                await logActivity(
                    docId.toString(),
                    'doctor',
                    'logout',
                    `Doctor logged out: ${doctor.email}`,
                    req,
                    { email: doctor.email, name: doctor.name, sessionDuration }
                );
            }
        }

        return res.json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        });
    }
};

export const doctorslist = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({
            success: true,
            doctors
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export const logindoctor = async (req, res) => {
    try {
        const { email, password } = req.body
        const doctor = await doctorModel.findOne({ email })
        if (!doctor) {
            return res.json({
                success: false,
                message: "Invalid Credentials"
            })
        }

        // Check if doctor is banned
        if (doctor.isBanned) {
            return res.json({
                success: false,
                message: `Your account has been banned. Reason: ${doctor.banReason}. Please contact support for more information.`
            })
        }

        const isMatch = await argon2.verify(doctor.password, password)

        if (isMatch) {
            const now = new Date();

            // Calculate session duration if there was a previous session
            if (doctor.currentSessionStart) {
                const previousSessionDuration = Math.floor((now - doctor.currentSessionStart) / 1000);
                doctor.totalSessionTime = (doctor.totalSessionTime || 0) + previousSessionDuration;
            }

            // Fraud Detection: Impossible Travel
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const currentLocation = await getLocationFromIP(ip);

            if (currentLocation && doctor.location?.latitude) {
                const config = await systemConfigModel.findOne();
                const threshold = config?.fraudSentinel?.velocityThreshold || 500;

                const lastLoc = {
                    latitude: doctor.location.latitude,
                    longitude: doctor.location.longitude,
                    timestamp: doctor.lastLogin
                };

                const currLoc = {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    timestamp: now
                };

                const fraudCheck = checkImpossibleTravel(lastLoc, currLoc, threshold);

                if (fraudCheck.isFraud) {
                    await logActivity(
                        doctor._id.toString(),
                        'doctor',
                        'fraud_alert',
                        `Impossible Travel Detected: ${fraudCheck.velocity} km/h between ${currentLocation.city} and previous location`,
                        req,
                        {
                            velocity: fraudCheck.velocity,
                            distance: fraudCheck.distance,
                            city: currentLocation.city,
                            country: currentLocation.country
                        }
                    );
                }
            }

            // Update login tracking with new location
            doctor.lastLogin = now;
            doctor.currentSessionStart = now;
            doctor.lastLoginIp = ip;
            if (currentLocation) {
                doctor.location = {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    accuracy: 0,
                    timestamp: now
                };
            }
            await doctor.save();

            // Log login activity
            await logActivity(
                doctor._id.toString(),
                'doctor',
                'login',
                `Doctor logged in: ${doctor.email}`,
                req,
                { email: doctor.email, name: doctor.name, city: currentLocation?.city }
            );

            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET)
            return res.json({
                success: true,
                token
            })
        }
        else {
            return res.json({
                success: false,
                message: "Invalid Credentials"
            })
        }
    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}

export const appointmentsDoctor = async (req, res) => {
    try {

        const { docId } = req.body
        const appointments = await appointmentModel.find({ docId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export const appointmentComplete = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);
        const meetLink = appointmentData.meetLink || "https://meet.google.com/qfv-rcwa-sec";

        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        if (appointmentData.docId !== docId) {
            return res.json({ success: false, message: 'Unauthorized action' });
        }

        // Get user and doctor data for the email
        const userData = await userModel.findById(appointmentData.userId);
        const doctorData = await doctorModel.findById(docId);

        // Update appointment status
        await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });

        // Auto-delete chat files from Cloudinary
        autoDeleteFilesOnCompletion(appointmentId).catch(err => {
            console.error('Error auto-deleting files:', err);
        });

        // Send completion confirmation email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: userData.email,
            subject: 'Appointment Completion Confirmation',
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #f9fff9;
            border-radius: 10px;
            position: relative;
        }

        .header {
            background-color: #28a745;
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
            margin: -20px -20px 20px -20px;
        }

        .content {
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        ul {
            list-style: none;
            padding-left: 0;
        }

        li {
            margin: 10px 0;
            padding: 10px;
            background-color: #f0f8f0;
            border-radius: 5px;
        }

        .meet-link {
            background-color: #e8f5e9;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #43a047;
            text-align: center;
            text-decoration: line-through;
        }

        .signature {
            margin-top: 20px;
            text-align: center;
            color: #28a745;
        }

        .thank-you-note {
            margin-top: 15px;
            padding: 10px;
            background-color: #f0f8f0;
            border-left: 4px solid #28a745;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Appointment Completed</h2>
    </div>

    <div class="content">
        <p>Dear ${userData.name},</p>

        <p>Your appointment with <strong>Dr. ${doctorData.name}</strong> has been successfully completed.</p>

        <p><strong>Appointment Details:</strong></p>
        <ul>
            <li><strong>Doctor:</strong> Dr. ${doctorData.name}</li>
            <li><strong>Date:</strong> ${appointmentData.slotDate}</li>
            <li><strong>Time:</strong> ${appointmentData.slotTime}</li>
            <li><strong>Fee:</strong> ₹${appointmentData.amount}</li>
        </ul>

        <div class="meet-link">
            <p><strong>Virtual Consultation Link (Session Ended):</strong></p>
            <p>${meetLink}</p>
            <p>This virtual meeting has now ended.</p>
        </div>

        <div class="thank-you-note">
            <p>Thank you for choosing PawVaidya for your pet's healthcare needs. We hope you and your pet had a great experience.</p>
            <p>If you have any feedback or concerns about your visit, please don't hesitate to reach out to us.</p>
        </div>

        <p>We look forward to serving you and your pet again!</p>

        <div class="signature">
            <p>Best regards,<br/>
            <strong>PawVaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>
            `
        };

        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: 'Appointment Completed' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export const appointmentCancel = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        if (appointmentData.docId !== docId) {
            return res.json({ success: false, message: 'Unauthorized action' });
        }

        // Get user and doctor data for the email
        const userData = await userModel.findById(appointmentData.userId);
        const doctorData = await doctorModel.findById(docId);

        // Update doctor's slots_booked to remove the cancelled slot
        const slots_booked = doctorData.slots_booked;
        slots_booked[appointmentData.slotDate] = slots_booked[appointmentData.slotDate]
            .filter(time => time !== appointmentData.slotTime);

        await doctorModel.findByIdAndUpdate(docId, { slots_booked });
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

        // Refund to Paw Wallet if paid
        let refundMessage = '';
        if (appointmentData.payment) {
            await userModel.findByIdAndUpdate(appointmentData.userId, {
                $inc: { pawWallet: appointmentData.amount }
            });
            refundMessage = `<p><strong>Refund Notice:</strong> An amount of ₹${appointmentData.amount} has been refunded to your Paw Wallet.</p>`;
        }

        // Restore coupon usage if applied
        if (appointmentData.discountApplied && appointmentData.discountApplied.code) {
            await doctorModel.findOneAndUpdate(
                { _id: docId, 'discounts.code': appointmentData.discountApplied.code },
                { $inc: { 'discounts.$.usedCount': -1 } }
            );
        }

        if (appointmentData.adminDiscountApplied && appointmentData.adminDiscountApplied.code) {
            await adminCouponModel.findOneAndUpdate(
                { code: appointmentData.adminDiscountApplied.code },
                { $inc: { usedCount: -1 } }
            );
        }

        // Send cancellation email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: userData.email,
            subject: 'Appointment Cancellation Notice',
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff9f9;
            border-radius: 10px;
            position: relative;
        }

        .header {
            background-color: #dc3545;
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
            margin: -20px -20px 20px -20px;
        }

        .content {
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        ul {
            list-style: none;
            padding-left: 0;
        }

        li {
            margin: 10px 0;
            padding: 10px;
            background-color: #f8f0f0;
            border-radius: 5px;
        }

        .signature {
            margin-top: 20px;
            text-align: center;
            color: #dc3545;
        }

        .apology-note {
            margin-top: 15px;
            padding: 10px;
            background-color: #fff3f3;
            border-left: 4px solid #dc3545;
            border-radius: 4px;
        }

        .rebook-info {
            margin-top: 15px;
            padding: 10px;
            background-color: #f0f8f0;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Important: Appointment Cancellation Notice</h2>
    </div>

    <div class="content">
        <p>Dear ${userData.name},</p>

        <p>We regret to inform you that your appointment with <strong>Dr. ${doctorData.name}</strong> has been cancelled due to an unexpectedly high patient load.</p>

        <p><strong>Cancelled Appointment Details:</strong></p>
        <ul>
            <li><strong>Doctor:</strong> Dr. ${doctorData.name}</li>
            <li><strong>Date:</strong> ${appointmentData.slotDate}</li>
            <li><strong>Time:</strong> ${appointmentData.slotTime}</li>
            <li><strong>Fee:</strong> ₹${appointmentData.amount}</li>
        </ul>

        <div class="apology-note">
            <p>We sincerely apologize for any inconvenience this may cause. Dr. ${doctorData.name} had to make this difficult decision to ensure the quality of care for all patients.</p>
        </div>
        ${refundMessage}

        <div class="rebook-info">
            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>You can rebook your appointment for a different time slot through our website</li>
                <li>Consider booking with another available veterinarian if your need is urgent</li>
                <li>Contact our support team if you need any assistance</li>
            </ul>
        </div>

        <p>We value your trust in PawVaidya and are committed to providing the best care for your pet.</p>

        <div class="signature">
            <p>Best regards,<br/>
            <strong>PawVaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>
            `
        };

        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: 'Appointment Cancelled' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export const doctorDashboard = async (req, res) => {
    try {
        const { docId } = req.body;

        if (!docId) {
            return res.json({ success: false, message: "Doctor ID is required." });
        }

        // Fetch all appointments for the given doctor ID
        const appointments = await appointmentModel.find({ docId });

        // Initialize counters and arrays for tracking appointments
        let earnings = 0;
        const cancelledAppointments = [];
        const completedAppointments = [];
        const latestAppointments = [];

        // Iterate through the appointments to calculate earnings and segregate data
        appointments.forEach((item) => {
            // Calculate earnings for completed appointments
            if (item.isCompleted) {
                earnings += item.amount || 0; // Default to 0 if `amount` is undefined
                completedAppointments.push(item);
            }

            // Track canceled appointments
            if (item.cancelled) {
                cancelledAppointments.push(item);
            }

            // Add all appointments to the latest list
            latestAppointments.push(item);
        });

        // Collect unique patient IDs
        const patients = new Set();
        appointments.forEach((item) => {
            patients.add(item.userId.toString()); // Ensure `userId` is handled as a string
        });

        // Fetch doctor info for ratings and incentives
        const doctor = await doctorModel.findById(docId).select('averageRating totalRatings incentive incentiveHistory');

        // Fetch attendance history for the doctor
        const attendanceHistory = await activityLogModel.find({
            userId: docId,
            userType: 'doctor',
            activityType: 'doctor_attendance'
        }).sort({ timestamp: -1 }).limit(100);

        // Prepare dashboard data
        const dashData = {
            appointments: appointments.length, // Total number of appointments
            patients: patients.size, // Unique patient count
            latestAppointments: latestAppointments.reverse(), // Reverse for latest first
            latestCancelled: cancelledAppointments.reverse(), // Latest canceled appointments
            earnings, // Total earnings from completed appointments
            canceledAppointmentCount: cancelledAppointments.length, // Total canceled appointments count
            completedAppointmentCount: completedAppointments.length, // Total completed appointments count
            averageRating: doctor.averageRating || 0,
            totalRatings: doctor.totalRatings || 0,
            incentive: doctor.incentive,
            incentiveHistory: doctor.incentiveHistory || [],
            attendanceHistory: attendanceHistory || []
        };

        // Send the response with dashboard data
        res.json({ success: true, dashData });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ success: false, message: error.message });
    }
};



export const doctorProfile = async (req, res) => {
    try {

        const { docId } = req.body
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export const updateDoctorProfile = async (req, res) => {
    try {
        const { docId, fees, address, available, about, full_address, experience, docphone, image, name } = req.body;
        const imagefile = req.file; // Handled by multer middleware

        // Parse address if it's a string
        let parsedAddress = address;
        if (typeof address === 'string') {
            try {
                parsedAddress = JSON.parse(address);
            } catch (parseError) {
                console.error('Failed to parse address:', parseError.message);
                return res.status(400).json({ success: false, message: 'Invalid address format' });
            }
        }

        // Update doctor profile details
        await doctorModel.findByIdAndUpdate(docId, {
            ...(name && { name }),
            fees,
            address: parsedAddress,
            available,
            about,
            full_address,
            experience,
            docphone,
        });

        // Handle image upload if imagefile exists or image URL is provided in body
        if (imagefile) {
            const imageupload = await cloudinary.uploader.upload(imagefile.path, {
                resource_type: 'image',
            });
            const imageurl = imageupload.secure_url;

            await doctorModel.findByIdAndUpdate(docId, { image: imageurl });
        } else if (image && typeof image === 'string' && image.startsWith('http')) {
            // Upload from URL to Cloudinary
            const imageupload = await cloudinary.uploader.upload(image, {
                resource_type: 'image',
            });
            const imageurl = imageupload.secure_url;
            await doctorModel.findByIdAndUpdate(docId, { image: imageurl });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
        });

    } catch (error) {
        console.error('Error updating profile:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message,
        });
    }
};

// Get admin messages for doctor
export const getDoctorMessages = async (req, res) => {
    try {
        const { docId } = req.body;

        if (!docId) {
            return res.json({
                success: false,
                message: 'Not Authorized'
            });
        }

        const now = new Date();

        // Get all active messages for doctors
        const messages = await adminMessageModel.find({
            isActive: true,
            $and: [
                {
                    $or: [
                        { targetType: 'all' },
                        { targetType: 'doctors' },
                        { targetType: 'specific', targetIds: docId }
                    ]
                },
                {
                    $or: [
                        { expiresAt: null },
                        { expiresAt: { $gt: now } }
                    ]
                }
            ]
        }).sort({ priority: -1, createdAt: -1 });

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Error getting doctor messages:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Mark message as read by doctor
export const markDoctorMessageAsRead = async (req, res) => {
    try {
        const { docId, messageId } = req.body;

        if (!docId) {
            return res.json({
                success: false,
                message: 'Not Authorized'
            });
        }

        const message = await adminMessageModel.findById(messageId);

        if (!message) {
            return res.json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if already read
        const alreadyRead = message.readBy.some(read => read.userId === docId);

        if (!alreadyRead) {
            message.readBy.push({
                userId: docId,
                readAt: new Date()
            });
            await message.save();
        }

        res.json({
            success: true,
            message: 'Message marked as read'
        });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Get doctor profile by ID (for admin)
export const getDoctorById = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const doctor = await doctorModel.findById(doctorId).select('-password');

        if (!doctor) {
            return res.json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.json(doctor);
    } catch (error) {
        console.error('Error fetching doctor by ID:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Update doctor location
export const updateDoctorLocation = async (req, res) => {
    try {
        const { docId } = req.body;
        const { latitude, longitude, accuracy, timestamp } = req.body.location;

        // Validate location data
        if (!latitude || !longitude) {
            return res.json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        // Validate coordinates are within valid ranges
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        const doctor = await doctorModel.findById(docId);
        if (!doctor) {
            return res.json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Update doctor location
        doctor.location = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            accuracy: accuracy ? parseFloat(accuracy) : null,
            timestamp: timestamp || new Date()
        };

        await doctor.save();

        res.json({
            success: true,
            message: 'Location updated successfully',
            location: doctor.location
        });

    } catch (error) {
        console.error('Error updating doctor location:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Get nearby doctors based on user location
export const getNearbyDoctors = async (req, res) => {
    try {
        const { latitude, longitude, maxDistance = 50 } = req.body; // maxDistance in kilometers

        // Validate location data
        if (!latitude || !longitude) {
            return res.json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        // Validate coordinates are within valid ranges
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        // Convert maxDistance from kilometers to radians (1 degree ≈ 111.32 km)
        const maxDistanceInRadians = maxDistance / 111.32;

        // Find doctors with location data within the specified distance
        const nearbyDoctors = await doctorModel.find({
            'location.latitude': { $ne: null },
            'location.longitude': { $ne: null },
            available: true,
            isBanned: false,
            $expr: {
                $and: [
                    {
                        $gte: [
                            {
                                $sqrt: {
                                    $add: [
                                        {
                                            $pow: [
                                                {
                                                    $subtract: [
                                                        { $toDouble: '$location.latitude' },
                                                        parseFloat(latitude)
                                                    ]
                                                },
                                                2
                                            ]
                                        },
                                        {
                                            $pow: [
                                                {
                                                    $subtract: [
                                                        { $toDouble: '$location.longitude' },
                                                        parseFloat(longitude)
                                                    ]
                                                },
                                                2
                                            ]
                                        }
                                    ]
                                }
                            },
                            maxDistanceInRadians
                        ]
                    }
                ]
            }
        }).select('-password -email').limit(20);

        // Calculate distance for each doctor
        const doctorsWithDistance = nearbyDoctors.map(doctor => {
            const distance = calculateDistance(
                latitude,
                longitude,
                doctor.location.latitude,
                doctor.location.longitude
            );
            return {
                ...doctor.toObject(),
                distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
            };
        });

        // Sort by distance
        doctorsWithDistance.sort((a, b) => a.distance - b.distance);

        res.json({
            success: true,
            doctors: doctorsWithDistance,
            total: doctorsWithDistance.length
        });

    } catch (error) {
        console.error('Error getting nearby doctors:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Create a new reminder
export const createReminder = async (req, res) => {
    try {
        const { docId } = req.body;
        const { title, description, date, time, priority } = req.body;

        if (!title || !date) {
            return res.json({
                success: false,
                message: 'Title and date are required'
            });
        }

        const reminder = new reminderModel({
            doctorId: docId,
            title,
            description: description || '',
            date: new Date(date),
            time: time || '',
            priority: priority || 'medium'
        });

        await reminder.save();

        res.json({
            success: true,
            message: 'Reminder created successfully',
            reminder
        });
    } catch (error) {
        console.error('Error creating reminder:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Get all reminders for a doctor
export const getDoctorReminders = async (req, res) => {
    try {
        const { docId } = req.body;

        const reminders = await reminderModel.find({ doctorId: docId })
            .sort({ date: 1, createdAt: -1 });

        res.json({
            success: true,
            reminders
        });
    } catch (error) {
        console.error('Error getting reminders:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Update a reminder
export const updateReminder = async (req, res) => {
    try {
        const { docId } = req.body;
        const { reminderId, title, description, date, time, priority, isCompleted } = req.body;

        const reminder = await reminderModel.findOne({
            _id: reminderId,
            doctorId: docId
        });

        if (!reminder) {
            return res.json({
                success: false,
                message: 'Reminder not found'
            });
        }

        // Update fields
        if (title !== undefined) reminder.title = title;
        if (description !== undefined) reminder.description = description;
        if (date !== undefined) reminder.date = new Date(date);
        if (time !== undefined) reminder.time = time;
        if (priority !== undefined) reminder.priority = priority;
        if (isCompleted !== undefined) reminder.isCompleted = isCompleted;

        await reminder.save();

        res.json({
            success: true,
            message: 'Reminder updated successfully',
            reminder
        });
    } catch (error) {
        console.error('Error updating reminder:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Delete a reminder
export const deleteReminder = async (req, res) => {
    try {
        const { docId } = req.body;
        const { reminderId } = req.body;

        const reminder = await reminderModel.findOneAndDelete({
            _id: reminderId,
            doctorId: docId
        });

        if (!reminder) {
            return res.json({
                success: false,
                message: 'Reminder not found'
            });
        }

        res.json({
            success: true,
            message: 'Reminder deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting reminder:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Get daily earnings for calendar
export const getDailyEarnings = async (req, res) => {
    try {
        const { docId } = req.body;
        const { startDate, endDate } = req.body;

        // Build query
        let query = {
            docId,
            isCompleted: true,
            cancelled: false
        };

        // Add date range if provided
        if (startDate && endDate) {
            query.slotDate = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const appointments = await appointmentModel.find(query);

        // Group earnings by date
        const dailyEarnings = {};
        appointments.forEach(appointment => {
            const dateKey = appointment.slotDate;
            dailyEarnings[dateKey] = (dailyEarnings[dateKey] || 0) + (appointment.amount || 0);
        });

        res.json({
            success: true,
            dailyEarnings
        });
    } catch (error) {
        console.error('Error getting daily earnings:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// ─── Discount Management ────────────────────────────────────────────────────

// Create a new discount coupon
export const createDiscount = async (req, res) => {
    try {
        const { docId, code, discountType, discountValue, maxUses, expiresAt } = req.body;

        if (!code || !discountType || !discountValue) {
            return res.json({ success: false, message: 'Code, type, and value are required' });
        }

        const doctor = await doctorModel.findById(docId);
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' });

        // Ensure code is unique for this doctor (case-insensitive)
        const exists = doctor.discounts.some(d => d.code.toUpperCase() === code.toUpperCase());
        if (exists) return res.json({ success: false, message: 'Discount code already exists' });

        doctor.discounts.push({
            code: code.toUpperCase().trim(),
            discountType,
            discountValue: Number(discountValue),
            maxUses: Number(maxUses) || 0,
            usedCount: 0,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            isActive: true,
            createdAt: new Date()
        });

        await doctor.save();
        res.json({ success: true, message: 'Discount created successfully', discounts: doctor.discounts });
    } catch (error) {
        console.error('Error creating discount:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get all discounts for the logged-in doctor
export const getDoctorDiscounts = async (req, res) => {
    try {
        const { docId } = req.body;
        const doctor = await doctorModel.findById(docId).select('discounts');
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' });

        res.json({ success: true, discounts: doctor.discounts });
    } catch (error) {
        console.error('Error fetching discounts:', error);
        res.json({ success: false, message: error.message });
    }
};

// Update a discount (toggle active, change value, etc.)
export const updateDiscount = async (req, res) => {
    try {
        const { docId, discountId, isActive, discountValue, maxUses, expiresAt } = req.body;

        const doctor = await doctorModel.findById(docId);
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' });

        const discount = doctor.discounts.id(discountId);
        if (!discount) return res.json({ success: false, message: 'Discount not found' });

        if (isActive !== undefined) discount.isActive = isActive;
        if (discountValue !== undefined) discount.discountValue = Number(discountValue);
        if (maxUses !== undefined) discount.maxUses = Number(maxUses);
        if (expiresAt !== undefined) discount.expiresAt = expiresAt ? new Date(expiresAt) : null;

        await doctor.save();
        res.json({ success: true, message: 'Discount updated', discounts: doctor.discounts });
    } catch (error) {
        console.error('Error updating discount:', error);
        res.json({ success: false, message: error.message });
    }
};

// Delete a discount
export const deleteDiscount = async (req, res) => {
    try {
        const { docId, discountId } = req.body;

        const doctor = await doctorModel.findById(docId);
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' });

        doctor.discounts = doctor.discounts.filter(d => d._id.toString() !== discountId);
        await doctor.save();

        res.json({ success: true, message: 'Discount deleted', discounts: doctor.discounts });
    } catch (error) {
        console.error('Error deleting discount:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get ACTIVE discounts for a doctor (public — no auth needed, safe for frontend display)
export const getPublicDoctorDiscounts = async (req, res) => {
    try {
        const { docId } = req.params;
        const doctor = await doctorModel.findById(docId).select('discounts');
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' });

        const now = new Date();
        const activeDiscounts = doctor.discounts
            .filter(d =>
                d.isActive &&
                (d.expiresAt === null || new Date(d.expiresAt) > now) &&
                (d.maxUses === 0 || d.usedCount < d.maxUses)
            )
            .map(d => ({
                code: d.code,
                discountType: d.discountType,
                discountValue: d.discountValue,
                expiresAt: d.expiresAt
            }));

        res.json({ success: true, discounts: activeDiscounts });
    } catch (error) {
        console.error('Error fetching public discounts:', error);
        res.json({ success: false, message: error.message });
    }
};

export default changeavailablity