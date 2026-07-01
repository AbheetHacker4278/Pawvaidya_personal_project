import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import { uploadFile } from '../utils/uploadHelper.js';
import { uploadToFirebase } from '../config/firebase.js';
import CSEmployee from '../models/csEmployeeModel.js';
import CSLoginHistory from '../models/csLoginHistoryModel.js';
import CSShiftLog from '../models/csShiftLogModel.js';
import userModel from '../models/userModel.js';
import petModel from '../models/petModel.js';
import appointmentModel from '../models/appointmentModel.js';
import crueltyReportModel from '../models/crueltyReportModel.js';
import activityLogModel from '../models/activityLogModel.js';
import doctorModel from '../models/doctorModel.js';
import mlPredictionModel from '../models/mlPredictionModel.js';
import animalDiseaseModel from '../models/animalDiseaseModel.js';
import nutritionPlanModel from '../models/nutritionPlanModel.js';
import adminMessageModel from '../models/adminMessageModel.js';
import strayCrowdfundingModel from '../models/strayCrowdfundingModel.js';
import adminCouponModel from '../models/adminCouponModel.js';
import { transporter } from '../config/nodemailer.js';
import { deleteCache } from '../utils/cacheUtils.js';

// POST /api/cs/login
export const csLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.json({ success: false, message: 'Email and password are required.' });

        const employee = await CSEmployee.findOne({ email });
        if (!employee) return res.json({ success: false, message: 'Invalid credentials.' });

        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) return res.json({ success: false, message: 'Invalid credentials.' });

        if (employee.status === 'suspended') {
            return res.json({ success: false, message: `Account suspended. Reason: ${employee.suspendedReason || 'Policy violation'}` });
        }

        // Check if profile deadline has passed
        if (!employee.profileComplete && employee.profileDeadline && new Date() > new Date(employee.profileDeadline)) {
            await CSEmployee.findByIdAndUpdate(employee._id, {
                status: 'suspended',
                suspendedReason: 'Profile not completed within 2 days of account creation.',
                suspendedAt: new Date()
            });
            return res.json({ success: false, message: 'Your account has been suspended because you did not complete your profile within 2 days. Please contact the admin.' });
        }

        // Determine if face verification is needed
        const needsFaceReg = employee.faceDescriptor.length === 0;
        const needsProfileCompletion = !employee.profileComplete;

        // Generate a pre-auth token (limited scope)
        const preToken = jwt.sign({ id: employee._id, scope: 'pre-auth' }, process.env.JWT_SECRET, { expiresIn: '15m' });

        return res.json({
            success: true,
            preToken,
            needsFaceRegistration: needsFaceReg,
            needsProfileCompletion,
            employeeId: employee._id,
            name: employee.name,
            message: needsFaceReg ? 'Please complete face registration.' : (needsProfileCompletion ? 'Please complete your profile.' : 'Proceed to face verification.')
        });

    } catch (error) {
        console.error('csLogin error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/face-register  –  one-time setup, saves face descriptor
export const faceRegister = async (req, res) => {
    try {
        const { preToken, faceDescriptor, faceImage } = req.body;
        if (!preToken || !faceDescriptor) return res.json({ success: false, message: 'Missing required fields.' });

        const decoded = jwt.verify(preToken, process.env.JWT_SECRET);
        if (decoded.scope !== 'pre-auth') return res.json({ success: false, message: 'Invalid token.' });

        const updateData = {
            faceDescriptor,
            faceVerified: true,
            status: 'active'
        };

        if (faceImage) {
            const uploadRes = await cloudinary.uploader.upload(faceImage, { folder: 'cs_faces' });
            updateData.registeredFaceImage = uploadRes.secure_url;
        }

        await CSEmployee.findByIdAndUpdate(decoded.id, updateData);

        return res.json({ success: true, message: 'Face registered successfully. You can now log in.' });
    } catch (error) {
        console.error('faceRegister error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/face-verify  –  login step 2: compare submitted descriptor
export const faceVerify = async (req, res) => {
    try {
        const { preToken, faceDescriptor } = req.body;
        if (!preToken || !faceDescriptor) return res.json({ success: false, message: 'Missing required fields.' });

        const decoded = jwt.verify(preToken, process.env.JWT_SECRET);
        if (decoded.scope !== 'pre-auth') return res.json({ success: false, message: 'Invalid token.' });

        const employee = await CSEmployee.findById(decoded.id);
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        if (employee.faceDescriptor.length === 0) {
            return res.json({ success: false, message: 'Face not registered yet. Please register first.' });
        }

        // Euclidean distance (threshold 0.6)
        const stored = employee.faceDescriptor;
        const submitted = faceDescriptor;
        if (stored.length !== submitted.length) return res.json({ success: false, message: 'Face descriptor mismatch. Please try again.' });

        let sumSq = 0;
        for (let i = 0; i < stored.length; i++) {
            sumSq += Math.pow(stored[i] - submitted[i], 2);
        }
        const distance = Math.sqrt(sumSq);

        if (distance > 0.6) {
            return res.json({ success: false, message: 'Face not recognized. Please try again.' });
        }

        // Issue full access token
        const ip = req.ip || req.headers['x-forwarded-for'] || '';
        const ua = req.headers['user-agent'] || '';
        const { faceImage } = req.body;

        let loginFaceImageUrl = '';
        if (faceImage) {
            try {
                const uploadRes = await cloudinary.uploader.upload(faceImage, { folder: 'cs_login_faces' });
                loginFaceImageUrl = uploadRes.secure_url;
            } catch (err) {
                console.error('Face image upload failed:', err);
            }
        }

        const now = new Date();
        const confidenceScore = Math.max(0, Math.min(100, Math.round((1 - distance / 0.6) * 100))); const biometricEntry = { date: now, confidenceScore, status: confidenceScore >= 75 ? 'Passed' : 'Warning' }; await CSEmployee.findByIdAndUpdate(employee._id, { $push: { biometricConfidenceHistory: biometricEntry },
            lastLogin: now,
            lastLoginIp: ip,
            faceVerified: true,
            isOnline: true
        });

        await CSLoginHistory.create({
            employeeId: employee._id,
            employeeName: employee.name,
            loginAt: now,
            ip,
            device: ua.substring(0, 200),
            loginFaceImage: loginFaceImageUrl
        });

        // Create a shift log for today's 10-hour shift
        const dateStr = now.toISOString().slice(0, 10);
        // Only one shift per day — upsert
        await CSShiftLog.findOneAndUpdate(
            { employeeId: employee._id, date: dateStr },
            { $setOnInsert: { employeeId: employee._id, employeeName: employee.name, shiftStart: now, date: dateStr } },
            { upsert: true, new: true }
        );

        const token = jwt.sign({ id: employee._id }, process.env.JWT_SECRET, { expiresIn: '12h' });

        return res.json({
            success: true,
            token,
            employee: {
                _id: employee._id,
                name: employee.name,
                email: employee.email,
                profilePic: employee.profilePic,
                status: employee.status,
                profileComplete: employee.profileComplete,
                fiveStarCount: employee.fiveStarCount || 0,
                adminIncentive: employee.adminIncentive || { amount: 0, expiresAt: null },
                isMaster: employee.isMaster || false
            },
            message: 'Login successful.'
        });
    } catch (error) {
        console.error('faceVerify error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/complete-profile  –  fill in profile details
export const completeProfile = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { name, phone, bio, profilePic } = req.body;
        if (!employeeId) return res.json({ success: false, message: 'Unauthorized.' });

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (bio) updateData.bio = bio;
        if (profilePic) updateData.profilePic = profilePic;
        updateData.profileComplete = true;

        await CSEmployee.findByIdAndUpdate(employeeId, updateData);

        return res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('completeProfile error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/update-profile
export const updateCSProfile = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { name, phone, bio } = req.body;
        const imageFile = req.file;

        if (!employeeId) return res.json({ success: false, message: 'Unauthorized.' });

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (bio) updateData.bio = bio;

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
            updateData.profilePic = imageUpload.secure_url;
        }

        const updatedEmployee = await CSEmployee.findByIdAndUpdate(employeeId, updateData, { new: true }).select('-password -plainPassword -faceDescriptor');

        return res.json({
            success: true,
            message: 'Profile updated successfully.',
            employee: updatedEmployee
        });
    } catch (error) {
        console.error('updateCSProfile error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs/profile
export const getCSProfile = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const employee = await CSEmployee.findById(employeeId).select('-password -plainPassword -faceDescriptor');
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });
        return res.json({ success: true, employee });
    } catch (error) {
        console.error('getCSProfile error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs/public-profile/:id  –  basic info shown to user before rating
export const getPublicCSProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await CSEmployee.findById(id).select('name profilePic averageRating totalRatings totalTicketsResolved joinedAt');
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });
        return res.json({ success: true, employee });
    } catch (error) {
        console.error('getPublicCSProfile error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/logout
export const csLogout = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        if (employeeId) {
            await CSEmployee.findByIdAndUpdate(employeeId, { isOnline: false });

            // Update login history with logout time
            const lastLogin = await CSLoginHistory.findOne({ employeeId, logoutAt: null }).sort({ loginAt: -1 });
            if (lastLogin) {
                const logoutAt = new Date();
                const duration = Math.round((logoutAt - lastLogin.loginAt) / (1000 * 60));
                lastLogin.logoutAt = logoutAt;
                lastLogin.sessionDurationMinutes = Math.max(0, duration);
                await lastLogin.save();
            }
        }
        return res.json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
        console.error('csLogout error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/shift/early-logout  — log early logout with reason
export const earlyLogout = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { reason, workSeconds, breakSeconds } = req.body;

        if (!reason || !reason.trim()) {
            return res.json({ success: false, message: 'A reason for early logout is required.' });
        }

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);

        const shiftLog = await CSShiftLog.findOneAndUpdate(
            { employeeId, date: dateStr },
            {
                shiftEnd: now,
                workSeconds: workSeconds || 0,
                breakSeconds: breakSeconds || 0,
                earlyLogout: true,
                earlyLogoutReason: reason.trim(),
                earlyLogoutAt: now,
                completedShift: false
            },
            { new: true }
        );

        // Also update login history and set offline
        await CSEmployee.findByIdAndUpdate(employeeId, { isOnline: false });
        const lastLogin = await CSLoginHistory.findOne({ employeeId, logoutAt: null }).sort({ loginAt: -1 });
        if (lastLogin) {
            const duration = Math.round((now - lastLogin.loginAt) / (1000 * 60));
            lastLogin.logoutAt = now;
            lastLogin.sessionDurationMinutes = Math.max(0, duration);
            await lastLogin.save();
        }

        return res.json({ success: true, message: 'Early logout recorded.', shiftLog });
    } catch (error) {
        console.error('earlyLogout error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/shift/sync  — periodic heartbeat to sync work/break seconds
export const syncShift = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { workSeconds, breakSeconds } = req.body;
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);

        await CSShiftLog.findOneAndUpdate(
            { employeeId, date: dateStr },
            { workSeconds: workSeconds || 0, breakSeconds: breakSeconds || 0 },
            { new: true }
        );

        return res.json({ success: true });
    } catch (error) {
        console.error('syncShift error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/shift/complete  — mark shift as fully completed (10hrs done)
export const completeShift = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { workSeconds, breakSeconds } = req.body;
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);

        await CSShiftLog.findOneAndUpdate(
            { employeeId, date: dateStr },
            { shiftEnd: now, workSeconds: workSeconds || 36000, breakSeconds: breakSeconds || 0, completedShift: true },
            { new: true }
        );

        return res.json({ success: true, message: 'Shift completed.' });
    } catch (error) {
        console.error('completeShift error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs/shift/status  — get today's shift log for the agent
export const getShiftStatus = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const shiftLog = await CSShiftLog.findOne({ employeeId, date: dateStr });
        return res.json({ success: true, shiftLog });
    } catch (error) {
        console.error('getShiftStatus error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/re-register-face
export const reRegisterFace = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { faceDescriptor, faceImage } = req.body;
        if (!employeeId || !faceDescriptor) return res.json({ success: false, message: 'Missing required fields.' });

        const updateData = {
            faceDescriptor,
            faceVerified: true
        };

        if (faceImage) {
            const uploadRes = await cloudinary.uploader.upload(faceImage, { folder: 'cs_faces' });
            updateData.registeredFaceImage = uploadRes.secure_url;
        }

        const updatedEmployee = await CSEmployee.findByIdAndUpdate(employeeId, updateData, { new: true }).select('-password -plainPassword -faceDescriptor');

        return res.json({ success: true, message: 'Biometrics updated successfully.', employee: updatedEmployee });
    } catch (error) {
        console.error('reRegisterFace error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/upload-document
export const uploadCSDocument = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { docType } = req.body;
        const docFile = req.file;

        if (!employeeId || !docType || !docFile) {
            return res.json({ success: false, message: 'Missing required fields or file.' });
        }

        // Upload using our helper
        const uploadResult = await uploadFile(docFile, 'cs_docs');
 
        const updatedEmployee = await CSEmployee.findByIdAndUpdate(
            employeeId,
            {
                $push: {
                    documents: {
                        docType,
                        docUrl: uploadResult.url
                    }
                }
            },
            { new: true }
        ).select('-password -plainPassword -faceDescriptor');
 
        return res.json({
            success: true,
            message: 'Document uploaded successfully.',
            employee: updatedEmployee
        });
    } catch (error) {
        console.error('uploadCSDocument error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/delete-document
export const deleteCSDocument = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { docId } = req.body;

        if (!employeeId || !docId) return res.json({ success: false, message: 'Missing document ID.' });

        const updatedEmployee = await CSEmployee.findByIdAndUpdate(
            employeeId,
            { $pull: { documents: { _id: docId } } },
            { new: true }
        ).select('-password -plainPassword -faceDescriptor');

        return res.json({ success: true, message: 'Document deleted successfully.', employee: updatedEmployee });
    } catch (error) {
        console.error('deleteCSDocument error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/log-break
export const logBreak = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { duration, startTime, endTime } = req.body;

        if (!employeeId || duration === undefined || !startTime || !endTime) {
            return res.json({ success: false, message: 'Missing required break fields.' });
        }

        const employee = await CSEmployee.findByIdAndUpdate(
            employeeId,
            {
                $push: {
                    breakHistory: {
                        duration,
                        startTime: new Date(startTime),
                        endTime: new Date(endTime)
                    }
                }
            },
            { new: true }
        );

        return res.json({ success: true, message: 'Break logged successfully.' });
    } catch (error) {
        console.error('logBreak error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/verify-face-session
export const verifyFaceSession = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { faceDescriptor } = req.body;

        if (!employeeId || !faceDescriptor) {
            return res.json({ success: false, message: 'Missing required fields.' });
        }

        const employee = await CSEmployee.findById(employeeId);
        if (!employee || employee.faceDescriptor.length === 0) {
            return res.json({ success: false, message: 'Face not registered.' });
        }

        const stored = employee.faceDescriptor;
        const submitted = faceDescriptor;
        if (stored.length !== submitted.length) return res.json({ success: false, message: 'Face descriptor mismatch.' });

        let sumSq = 0;
        for (let i = 0; i < stored.length; i++) {
            sumSq += Math.pow(stored[i] - submitted[i], 2);
        }
        const distance = Math.sqrt(sumSq);

        if (distance > 0.6) {
            return res.json({ success: false, message: 'Face not recognized.' });
        }

        return res.json({ success: true, message: 'Identity verified successfully.' });
    } catch (error) {
        console.error('verifyFaceSession error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs/user-360/:email
export const getUser360 = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await userModel.findOne({ email }).select('-password -plainPassword');
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const subscriptionModel = (await import('../models/subscriptionModel.js')).default;
        
        const pets = await petModel.find({ ownerId: user._id });
        const appointments = await appointmentModel.find({ userId: user._id }).sort({ slotDate: -1, slotTime: -1 }).limit(50);
        
        // Manual populate for doctor names to avoid issues
        const populatedAppointments = await Promise.all(appointments.map(async (app) => {
            const doc = await doctorModel.findById(app.docId).select('name image');
            return {
                ...app.toObject(),
                doctorName: doc ? doc.name : 'Unknown Doctor',
                doctorImage: doc ? doc.image : ''
            };
        }));

        const crueltyReports = await crueltyReportModel.find({ 
            $or: [{ userId: user._id.toString() }, { reporterEmail: user.email }]
        }).sort({ createdAt: -1 });
        const subscriptions = await subscriptionModel.find({ 
            $or: [{ userId: user._id }, { userId: user._id.toString() }] 
        }).sort({ createdAt: -1 });

        const refundLogs = await activityLogModel.find({ 
            userId: user._id, 
            activityType: { $in: ['refund', 'reclaim_refund'] } 
        }).sort({ timestamp: -1 });

        // Query Platinum ML Telemetry & Gold Diagnostic logs
        const mlPredictions = await mlPredictionModel.find({ userId: user._id }).sort({ createdAt: -1 });
        const animalDiseases = await animalDiseaseModel.find({ userId: user._id }).sort({ createdAt: -1 });

        // Query AI Diet & Nutrition Plans
        const nutritionPlans = await nutritionPlanModel.find({ userId: user._id }).sort({ createdAt: -1 });

        // Query stray crowdfunding campaigns created by the user
        const crowdfundingCampaigns = await strayCrowdfundingModel.find({ creatorId: user._id }).sort({ createdAt: -1 });

        // Query active loyalty/wellness coupons issued to this user
        const now = new Date();
        const activeLoyaltyCoupons = await adminCouponModel.find({
            code: { $in: ['HEALTHYPET15', 'FREEWELLNESS'] },
            isActive: true,
            expiryDate: { $gt: now },
            recipientEmails: user.email
        }).select('code discountType discountValue expiryDate usedCount usageLimit recipientEmails createdAt');

        return res.json({ 
            success: true, 
            user, 
            pets, 
            appointments: populatedAppointments, 
            crueltyReports, 
            subscriptions, 
            refundLogs,
            mlPredictions,
            animalDiseases,
            nutritionPlans,
            crowdfundingCampaigns,
            activeLoyaltyCoupons
        });
    } catch (error) {
        console.error('getUser360 error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/refund
export const issueRefund = async (req, res) => {
    try {
        const { email, amount, reason, appointmentId } = req.body;
        const employeeId = req.employeeId || (req.admin ? req.admin.id : null);

        if (!email || !amount || !reason) {
            return res.json({ success: false, message: 'Email, amount, and reason are required.' });
        }

        const user = await userModel.findOne({ email });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const refundAmount = Number(amount);
        if (isNaN(refundAmount) || refundAmount <= 0) {
            return res.json({ success: false, message: 'Invalid refund amount.' });
        }

        user.pawWallet += refundAmount;
        await user.save();
        await deleteCache(`user_profile_${user._id}`);

        if (appointmentId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, {
                refundStatus: 'completed',
                refundAmount: refundAmount
            });
        }

        const employee = employeeId ? await CSEmployee.findById(employeeId) : null; 
        const agentName = employee ? employee.name : (req.admin ? 'Admin' : 'Unknown');

        if (employee) { 
            if (refundAmount > 5000) { 
                employee.monitoringAlerts.push({ alertType: 'refund_anomaly', message: `Refund of ₹${refundAmount} issued to ${email} exceeds threshold limit of ₹5,000. Reason: ${reason}`, severity: 'high', timestamp: new Date() }); 
            } 
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); 
            const recentRefundsCount = await activityLogModel.countDocuments({ 'metadata.employeeId': employeeId, activityType: 'refund', timestamp: { $gte: oneHourAgo } }); 
            if (recentRefundsCount >= 2) { 
                employee.monitoringAlerts.push({ alertType: 'refund_anomaly', message: `Multiple refunds (${recentRefundsCount + 1}) processed by CS Agent in the last hour.`, severity: 'medium', timestamp: new Date() }); 
            } 
            await employee.save(); 
        }

        await activityLogModel.create({
            userId: user._id,
            userType: 'user',
            activityType: 'refund',
            activityDescription: `Refund of ₹${refundAmount} issued by ${req.admin ? 'Admin' : `CS Agent ${agentName}`}. Reason: ${reason}${appointmentId ? ` (Linked to Appointment ID: ${appointmentId})` : ''}`,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            metadata: {
                amount: refundAmount,
                employeeId: employeeId,
                agentName: agentName,
                reason: reason,
                appointmentId: appointmentId || null,
                initiatedBy: req.admin ? 'Admin' : 'CS Agent'
            }
        });

        return res.json({ 
            success: true, 
            message: `Successfully refunded ₹${refundAmount} to ${user.name}'s wallet.`,
            newBalance: user.pawWallet
        });
    } catch (error) {
        console.error('issueRefund error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/reclaim-refund
export const reclaimRefund = async (req, res) => {
    try {
        const { email, amount, reason, refundLogId } = req.body;
        const employeeId = req.employeeId || (req.admin ? req.admin.id : null);

        if (!email || !amount || !reason) {
            return res.json({ success: false, message: 'Email, amount, and reason are required.' });
        }

        const user = await userModel.findOne({ email });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const reclaimAmount = Number(amount);
        if (isNaN(reclaimAmount) || reclaimAmount <= 0) {
            return res.json({ success: false, message: 'Invalid reclaim amount.' });
        }

        // Deduct reclaimAmount from pawWallet
        user.pawWallet -= reclaimAmount;
        await user.save();
        await deleteCache(`user_profile_${user._id}`);

        if (refundLogId) {
            const originalRefundLog = await activityLogModel.findById(refundLogId);
            if (originalRefundLog) {
                // Update original refund log to mark it as reclaimed
                if (!originalRefundLog.metadata) originalRefundLog.metadata = {};
                originalRefundLog.metadata.reclaimed = true;
                originalRefundLog.metadata.reclaimedAmount = reclaimAmount;
                originalRefundLog.metadata.reclaimedAt = new Date();
                originalRefundLog.markModified('metadata');
                await originalRefundLog.save();
            }
        }

        const employee = employeeId ? await CSEmployee.findById(employeeId) : null;
        const agentName = employee ? employee.name : (req.admin ? 'Admin' : 'Unknown');

        await activityLogModel.create({
            userId: user._id,
            userType: 'user',
            activityType: 'reclaim_refund',
            activityDescription: `Mistaken refund of ₹${reclaimAmount} reclaimed by ${req.admin ? 'Admin' : `CS Agent ${agentName}`}. Reason: ${reason}`,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            metadata: {
                amount: reclaimAmount,
                employeeId: employeeId,
                agentName: agentName,
                reason: reason,
                originalRefundLogId: refundLogId || null,
                initiatedBy: req.admin ? 'Admin' : 'CS Agent'
            }
        });

        return res.json({ 
            success: true, 
            message: `Successfully reclaimed ₹${reclaimAmount} from ${user.name}'s wallet.`,
            newBalance: user.pawWallet
        });
    } catch (error) {
        console.error('reclaimRefund error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/revoke-subscription
export const revokeSubscription = async (req, res) => {
    try {
        const { userId, employeeId, reason } = req.body;
        const finalEmployeeId = employeeId || req.employeeId || (req.admin ? req.admin.id : null);
        const user = await userModel.findById(userId);
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const prevPlan = user.subscription.plan;
        
        user.subscription.plan = 'None';
        user.subscription.status = 'Cancelled';
        user.subscription.expiryDate = null;
        await user.save();

        const employee = finalEmployeeId ? await CSEmployee.findById(finalEmployeeId) : null;
        const agentName = employee ? employee.name : (req.admin ? 'Admin' : 'Unknown');
        
        await activityLogModel.create({
            userId: user._id,
            userType: 'user',
            activityType: 'revoke_subscription',
            activityDescription: `Subscription (${prevPlan}) revoked by ${req.admin ? 'Admin' : `CS Agent ${agentName}`}. Reason: ${reason}`,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            metadata: {
                previousPlan: prevPlan,
                employeeId: finalEmployeeId,
                agentName: agentName,
                reason,
                initiatedBy: req.admin ? 'Admin' : 'CS Agent'
            }
        });

        res.json({ success: true, message: `Successfully revoked ${prevPlan} subscription.` });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/grant-subscription
export const grantSubscription = async (req, res) => {
    try {
        const { userId, employeeId, plan, durationMonths, reason } = req.body;
        const finalEmployeeId = employeeId || req.employeeId || (req.admin ? req.admin.id : null);
        const user = await userModel.findById(userId);
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + (Number(durationMonths) || 1));

        user.subscription.plan = plan;
        user.subscription.status = 'Active';
        user.subscription.expiryDate = expiryDate;
        user.subscription.isGift = true;
        await user.save();

        const employee = finalEmployeeId ? await CSEmployee.findById(finalEmployeeId) : null;
        const agentName = employee ? employee.name : (req.admin ? 'Admin' : 'Unknown');
        
        // Use standard prices for "Loss" calculation
        const prices = { Silver: 599, Gold: 699, Platinum: 999 };
        const value = prices[plan] || 0;

        await activityLogModel.create({
            userId: user._id,
            userType: 'user',
            activityType: 'grant_subscription',
            activityDescription: `Gifted ${plan} subscription (${durationMonths} months) by ${req.admin ? 'Admin' : `CS Agent ${agentName}`}. Reason: ${reason}`,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            metadata: {
                plan,
                durationMonths,
                employeeId: finalEmployeeId,
                agentName: agentName,
                amount: value, // Log as amount for financial deduction
                reason,
                initiatedBy: req.admin ? 'Admin' : 'CS Agent'
            }
        });

        res.json({ success: true, message: `Successfully gifted ${plan} subscription for ${durationMonths} months.` });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/trigger-emergency
export const triggerEmergencyAlert = async (req, res) => {
    try {
        const { userId, petName, vitals, type, recordId } = req.body;
        const employeeId = req.employeeId || (req.admin ? req.admin.id : null);

        if (!userId || !petName || !recordId || !type) {
            return res.json({ success: false, message: 'User ID, Pet Name, Record ID, and Type are required.' });
        }

        const user = await userModel.findById(userId);
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const employee = employeeId ? await CSEmployee.findById(employeeId) : null;
        const agentName = employee ? employee.name : (req.admin ? 'Admin' : 'Unknown');

        // Update database record to mark it as triggered
        if (type === 'prediction') {
            await mlPredictionModel.findByIdAndUpdate(recordId, { emergencyAlertTriggered: true }, { new: true });
        } else if (type === 'disease') {
            await animalDiseaseModel.findByIdAndUpdate(recordId, { emergencyAlertTriggered: true }, { new: true });
        }

        // Send Email to the user
        let vitalsText = '';
        if (vitals) {
            vitalsText = `vitals (Temperature: ${vitals.temperature || 'N/A'}°F, Heart/Pulse Rate: ${vitals.pulseRate || 'N/A'} bpm, Respiratory Rate: ${vitals.respirationRate || 'N/A'} /m)`;
        } else {
            vitalsText = `recent clinical telemetry data`;
        }

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: `🚨 Emergency Vet Visit Recommended for ${petName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ffcccc; background-color: #fff5f5; border-radius: 8px;">
                    <h2 style="color: #d32f2f;">🚨 Urgent Health Alert for ${petName}</h2>
                    <p>Dear ${user.name},</p>
                    <p>Our veterinary support team has reviewed the ${vitalsText} for <strong>${petName}</strong>.</p>
                    <p style="font-size: 16px; font-weight: bold; color: #d32f2f;">We strongly recommend scheduling an emergency vet visit immediately.</p>
                    <p>Our team, <strong>${agentName || 'Customer Support'}</strong>, is standing by to help you schedule a priority slot or video consultation if needed.</p>
                    <br/>
                    <p>Best regards,</p>
                    <p><strong>PawVaidya Support Team</strong></p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        // Emit socket alert to all CS agents so they receive it and hide their trigger option immediately
        try {
            const { getIO } = await import('../socketServer.js');
            const io = getIO();
            io.emit('emergency-alert-triggered', {
                userId,
                petName,
                recordId,
                type,
                agentName: agentName
            });
            // Notify the user in real-time
            io.to(`user-${String(userId)}`).emit('emergency-alert', {
                message: `${agentName} has suggested an emergency vet visit for your pet ${petName} due to abnormal clinical vitals.`,
                timestamp: new Date()
            });
        } catch (socketError) {
            console.error('Error emitting emergency-alert-triggered socket event:', socketError);
        }

        res.json({ success: true, message: 'Emergency Vet Visit recommendation triggered and user notified.' });
    } catch (error) {
        console.error('triggerEmergencyAlert error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs/messages
export const getCSMessages = async (req, res) => {
    try {
        const employeeId = req.employeeId;

        if (!employeeId) {
            return res.json({
                success: false,
                message: 'Not Authorized'
            });
        }

        const now = new Date();

        // Get all active messages for CS agents
        const messages = await adminMessageModel.find({
            isActive: true,
            $and: [
                {
                    $or: [
                        { targetType: 'all' },
                        { targetType: 'cs_agents' },
                        { targetType: 'specific', targetIds: employeeId }
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
        console.error('Error getting CS messages:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// POST /api/cs/messages/read
export const markCSMessageAsRead = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { messageId } = req.body;

        if (!employeeId) {
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
        const alreadyRead = message.readBy.some(read => read.userId === employeeId);

        if (!alreadyRead) {
            message.readBy.push({
                userId: employeeId,
                readAt: new Date()
            });
            await message.save();
        }

        res.json({
            success: true,
            message: 'Message marked as read'
        });
    } catch (error) {
        console.error('Error marking CS message as read:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// POST /api/cs/upload-recording
export const uploadScreenRecording = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const file = req.file;

        if (!file) {
            return res.json({ success: false, message: 'No screen recording file provided.' });
        }

        const durationSeconds = Number(req.body.durationSeconds) || 0;
        const timestamp = Date.now();
        const destPath = `cs_screen_recordings/${employeeId}/${timestamp}_recording.webm`;

        const fs = await import('fs');
        const path = await import('path');
        const localUploadsDir = path.join(process.cwd(), 'uploads');

        if (!fs.existsSync(localUploadsDir)) {
            fs.mkdirSync(localUploadsDir, { recursive: true });
        }

        const filename = `${timestamp}_recording.webm`;
        const localDestPath = path.join(localUploadsDir, filename);

        // Copy to local backup path before attempting upload
        fs.copyFileSync(file.path, localDestPath);

        let publicUrl;
        let isFallback = false;
        try {
            publicUrl = await uploadToFirebase(file.path, destPath, file.mimetype || 'video/webm');
            
            // If Firebase succeeded, delete the local backup
            try {
                if (fs.existsSync(localDestPath)) {
                    fs.unlinkSync(localDestPath);
                }
            } catch (err) {
                console.warn('Error deleting local backup:', err.message);
            }
        } catch (firebaseErr) {
            console.error('Firebase upload failed, trying Cloudinary backup storage:', firebaseErr.message);
            try {
                // Upload the local backup file to Cloudinary since it's persistent
                const uploadResult = await cloudinary.uploader.upload(localDestPath, {
                    resource_type: 'video',
                    folder: 'cs_screen_recordings'
                });
                publicUrl = uploadResult.secure_url;
                
                // If Cloudinary succeeded, delete the local backup file
                try {
                    if (fs.existsSync(localDestPath)) {
                        fs.unlinkSync(localDestPath);
                    }
                } catch (err) {}
            } catch (cloudinaryErr) {
                console.error('Cloudinary upload failed too, falling back to local storage:', cloudinaryErr.message);
                isFallback = true;

                const host = req.get('host');
                const protocol = req.protocol;
                const requestBackendUrl = `${protocol}://${host}`;
                const backendUrl = process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || requestBackendUrl;
                publicUrl = `${backendUrl}/uploads/${filename}`;
            }
        }

        const updatedEmployee = await CSEmployee.findByIdAndUpdate(
            employeeId,
            {
                $push: {
                    screenRecordings: {
                        url: publicUrl,
                        recordedAt: new Date(),
                        durationSeconds
                    }
                }
            },
            { new: true }
        ).select('-password -plainPassword -faceDescriptor');

        res.json({
            success: true,
            message: isFallback 
                ? 'Screen recording saved locally (Firebase billing issue fallback).' 
                : 'Screen recording uploaded successfully to Firebase.',
            url: publicUrl,
            employee: updatedEmployee
        });
    } catch (error) {
        console.error('uploadScreenRecording error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/upload-voice-call
export const uploadVoiceCallRecording = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const file = req.file;
        const ticketId = req.body.ticketId || '';

        if (!file) {
            return res.json({ success: false, message: 'No voice call recording file provided.' });
        }

        const durationSeconds = Number(req.body.durationSeconds) || 0;
        const timestamp = Date.now();

        // Ensure correct audio MIME type is set
        let mimeType = file.mimetype;
        if (!mimeType || mimeType === 'application/octet-stream') {
            if (file.originalname && file.originalname.endsWith('.mp4')) {
                mimeType = 'audio/mp4';
            } else if (file.originalname && file.originalname.endsWith('.ogg')) {
                mimeType = 'audio/ogg';
            } else if (file.originalname && file.originalname.endsWith('.wav')) {
                mimeType = 'audio/wav';
            } else if (file.originalname && file.originalname.endsWith('.mp3')) {
                mimeType = 'audio/mpeg';
            } else {
                mimeType = 'audio/webm';
            }
        }

        const extension = mimeType.split('/')[1] || 'webm';
        const destPath = `cs_voice_calls/${employeeId}/${timestamp}_voice.${extension}`;

        const fs = await import('fs');
        const path = await import('path');
        const localUploadsDir = path.join(process.cwd(), 'uploads');

        if (!fs.existsSync(localUploadsDir)) {
            fs.mkdirSync(localUploadsDir, { recursive: true });
        }

        const filename = `${timestamp}_voice.${extension}`;
        const localDestPath = path.join(localUploadsDir, filename);

        // Copy to local backup path before attempting upload
        fs.copyFileSync(file.path, localDestPath);

        let publicUrl;
        let isFallback = false;
        try {
            publicUrl = await uploadToFirebase(file.path, destPath, mimeType);
            
            // If Firebase succeeded, delete the local backup
            try {
                if (fs.existsSync(localDestPath)) {
                    fs.unlinkSync(localDestPath);
                }
            } catch (err) {
                console.warn('Error deleting local backup:', err.message);
            }
        } catch (firebaseErr) {
            console.error('Firebase upload failed, trying Cloudinary backup storage:', firebaseErr.message);
            try {
                const uploadResult = await cloudinary.uploader.upload(localDestPath, {
                    resource_type: 'video',
                    folder: 'cs_voice_calls'
                });
                publicUrl = uploadResult.secure_url;
                
                try {
                    if (fs.existsSync(localDestPath)) {
                        fs.unlinkSync(localDestPath);
                    }
                } catch (err) {}
            } catch (cloudinaryErr) {
                console.error('Cloudinary upload failed too, falling back to local storage:', cloudinaryErr.message);
                isFallback = true;

                const host = req.get('host');
                const protocol = req.protocol;
                const requestBackendUrl = `${protocol}://${host}`;
                const backendUrl = process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || requestBackendUrl;
                publicUrl = `${backendUrl}/uploads/${filename}`;
            }
        }

        const updatedEmployee = await CSEmployee.findByIdAndUpdate(
            employeeId,
            {
                $push: {
                    voiceCallRecordings: {
                        url: publicUrl,
                        ticketId,
                        recordedAt: new Date(),
                        durationSeconds
                    }
                }
            },
            { new: true }
        ).select('-password -plainPassword -faceDescriptor');

        res.json({
            success: true,
            message: isFallback 
                ? 'Voice call recording saved locally.' 
                : 'Voice call recording uploaded successfully.',
            url: publicUrl,
            employee: updatedEmployee
        });
    } catch (error) {
        console.error('uploadVoiceCallRecording error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/forgot-password
export const csForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.json({ success: false, message: 'Email is required.' });

        const employee = await CSEmployee.findOne({ email });
        if (!employee) {
            return res.json({ success: true, message: 'If a matching account exists, a password reset request has been logged.' });
        }

        employee.forgotPasswordRequested = true;
        employee.forgotPasswordRequestedAt = new Date();
        await employee.save();

        return res.json({ 
            success: true, 
            message: 'Your password reset request has been submitted to the administrator.' 
        });
    } catch (error) {
        console.error('csForgotPassword error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/idle-time
export const logIdleTime = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { durationSeconds, ticketId } = req.body;

        if (!employeeId) return res.json({ success: false, message: 'Unauthorized.' });
        if (!durationSeconds) return res.json({ success: false, message: 'Missing duration.' });

        const employee = await CSEmployee.findById(employeeId);
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        const idleLog = {
            date: new Date(),
            durationSeconds: Number(durationSeconds),
            ticketId: ticketId || ''
        };

        if (Number(durationSeconds) >= 300) {
            const alertMsg = "CS Agent idle for " + Math.round(durationSeconds / 60) + " minutes" + (ticketId ? " on Ticket #" + ticketId : "");
            employee.monitoringAlerts.push({
                alertType: 'idle_alert',
                message: alertMsg,
                severity: 'medium',
                timestamp: new Date()
            });
        }

        employee.idleTimeLogs.push(idleLog);
        await employee.save();

        return res.json({ success: true, message: 'Idle time logged successfully.' });
    } catch (error) {
        console.error('logIdleTime error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/generate-compensation-coupon
export const generateCompensationCoupon = async (req, res) => {
    try {
        const { ticketId, couponType, discountType, discountValue, maxDiscount, reason, userEmail } = req.body;
        const employeeId = req.employeeId;

        if (!employeeId) {
            return res.json({ success: false, message: 'Not authorized.' });
        }
        if (!ticketId || !couponType || !discountType || !discountValue || !reason || !userEmail) {
            return res.json({ success: false, message: 'Missing required fields.' });
        }

        const employee = await CSEmployee.findById(employeeId);
        if (!employee) {
            return res.json({ success: false, message: 'CS Employee not found.' });
        }

        // Get the limit based on level or isMaster status
        const getAgentLimit = (emp) => {
            if (emp.isMaster) return 1500;
            const lvl = emp.level || 1;
            if (lvl >= 5) return 1500;
            if (lvl === 4) return 1200;
            if (lvl === 3) return 800;
            if (lvl === 2) return 500;
            return 300;
        };

        const limit = getAgentLimit(employee);

        // Validation based on discountType
        const numericValue = Number(discountValue);
        const numericMaxDiscount = maxDiscount ? Number(maxDiscount) : null;

        if (isNaN(numericValue) || numericValue <= 0) {
            return res.json({ success: false, message: 'Invalid discount value.' });
        }

        let requestedLimitAmount = 0;
        if (discountType === 'fixed') {
            requestedLimitAmount = numericValue;
        } else if (discountType === 'percentage') {
            // For percentage, if there is a maxDiscount, we validate against it.
            // If not, we assume standard consultation amount of ₹500
            requestedLimitAmount = numericMaxDiscount || Math.round((numericValue / 100) * 500);
        } else {
            return res.json({ success: false, message: 'Invalid discount type.' });
        }

        if (requestedLimitAmount > limit) {
            return res.json({ 
                success: false, 
                message: `Compensation value (₹${requestedLimitAmount}) exceeds your Level ${employee.level} limit of ₹${limit}.` 
            });
        }

        // Generate unique code: COMP-TKT-[Last 6 chars of ticketId]-[Random 4 chars]
        const ticketShort = ticketId.slice(-6).toUpperCase();
        const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const couponCode = `COMP-${ticketShort}-${randStr}`;

        // Create coupon
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 days expiry

        const newCoupon = new adminCouponModel({
            code: couponCode,
            discountType,
            discountValue: numericValue,
            minAmount: 0,
            maxDiscount: numericMaxDiscount,
            expiryDate,
            isActive: true,
            usageLimit: 1, // Compensation coupon is single-use
            recipientEmails: [userEmail.toLowerCase()],
            generatedBy: employee._id.toString(),
            generationReason: reason,
            ticketId,
            compensationType: couponType // 'refund' or 'gifted'
        });

        await newCoupon.save();

        // Log this activity so it feeds into CS Refund/Gifted Loss calculations
        await activityLogModel.create({
            userId: userEmail, // Logged as target user or email reference
            userType: 'admin',  // To show up in admin/financial ledgers
            activityType: 'cs_compensation_coupon',
            activityDescription: `Compensation coupon ${couponCode} (${couponType}) generated by CS Agent ${employee.name}. Reason: ${reason}`,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            metadata: {
                amount: requestedLimitAmount,
                compensationType: couponType, // 'refund' or 'gifted'
                employeeId,
                agentName: employee.name,
                reason,
                ticketId,
                code: couponCode,
                userEmail
            }
        });

        // Award some XP to the agent for resolving disputes using system tools! E.g. +10 XP
        employee.xpPoints = (employee.xpPoints || 0) + 10;
        // Level up check: every 100 XP is a level
        const newLevel = Math.floor(employee.xpPoints / 100) + 1;
        if (newLevel > employee.level) {
            employee.level = newLevel;
            // Rank mapping
            if (newLevel >= 5) employee.rank = 'Platinum';
            else if (newLevel >= 4) employee.rank = 'Gold';
            else if (newLevel >= 2) employee.rank = 'Silver';
        }
        await employee.save();

        res.json({
            success: true,
            message: `Compensation coupon ${couponCode} generated successfully.`,
            coupon: newCoupon,
            agentXP: employee.xpPoints,
            agentLevel: employee.level
        });

    } catch (error) {
        console.error('generateCompensationCoupon error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs/ticket-coupons/:ticketId
export const getTicketCoupons = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const employeeId = req.employeeId;

        if (!employeeId) {
            return res.json({ success: false, message: 'Not authorized.' });
        }

        const coupons = await adminCouponModel.find({ ticketId });
        res.json({ success: true, coupons });
    } catch (error) {
        console.error('getTicketCoupons error:', error);
        res.json({ success: false, message: error.message });
    }
};

export default { 
    csLogin, 
    faceRegister, 
    faceVerify, 
    completeProfile, 
    updateCSProfile, 
    getCSProfile, 
    getPublicCSProfile, 
    csLogout, 
    reRegisterFace, 
    uploadCSDocument, 
    deleteCSDocument, 
    logBreak, 
    verifyFaceSession, 
    earlyLogout, 
    syncShift, 
    completeShift, 
    getShiftStatus, 
    getUser360, 
    issueRefund, 
    reclaimRefund,
    revokeSubscription, 
    grantSubscription, 
    getCSMessages, 
    markCSMessageAsRead,
    uploadScreenRecording,
    uploadVoiceCallRecording,
    csForgotPassword,
    logIdleTime,
    generateCompensationCoupon,
    getTicketCoupons
};
