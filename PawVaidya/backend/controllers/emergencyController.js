import emergencyRequestModel from "../models/emergencyRequestModel.js";
import emergencyDoctorAvailabilityModel from "../models/emergencyDoctorAvailabilityModel.js";
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";
import emergencyPaymentDueModel from "../models/emergencyPaymentDueModel.js";
import { getIO } from "../socketServer.js";
import mongoose from "mongoose";
import notificationQueue from "../utils/notificationQueue.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { v2 as cloudinary } from "cloudinary";
import { uploadFile } from "../utils/uploadHelper.js";
import { deleteCache } from "../utils/cacheUtils.js";

// Decrypts emergency request logs and identifiers for runtime display safely
export const decryptRequest = (reqObj) => {
    if (!reqObj) return reqObj;
    const doc = reqObj.toObject ? reqObj.toObject() : JSON.parse(JSON.stringify(reqObj));
    
    if (doc.paymentDetails && doc.paymentDetails.paymentId) {
        doc.paymentDetails.paymentId = decrypt(doc.paymentDetails.paymentId);
    }
    if (doc.paymentDetails && doc.paymentDetails.orderId) {
        doc.paymentDetails.orderId = decrypt(doc.paymentDetails.orderId);
    }
    if (doc.paymentLogs && Array.isArray(doc.paymentLogs)) {
        doc.paymentLogs = doc.paymentLogs.map(log => ({
            ...log,
            transactionId: decrypt(log.transactionId)
        }));
    }
    return doc;
};

// Helper to sweep and expire outdated emergency requests (> 5 mins old)
const sweepExpiredRequests = async () => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const expiredRequests = await emergencyRequestModel.find({
            status: { $in: ['Pending', 'Waiting for Doctor Approval'] },
            createdAt: { $lt: fiveMinutesAgo }
        });

        if (expiredRequests.length > 0) {
            console.log(`[Sweep] Found ${expiredRequests.length} expired emergency requests. Auto-expiring...`);
            const io = getIO();

            for (const reqObj of expiredRequests) {
                reqObj.status = 'Rejected';
                reqObj.statusHistory.push({
                    status: 'Rejected',
                    updatedBy: 'system',
                    updatedById: reqObj.userId,
                    timestamp: new Date()
                });
                reqObj.approvalRecords.push({
                    action: 'Rejected',
                    actorId: reqObj.userId,
                    actorType: 'admin',
                    reason: 'Expired - 5-minute approval window exceeded with no doctor approval.',
                    timestamp: new Date()
                });
                await reqObj.save();

                // Decrement workload of doctor if assigned but expired
                if (reqObj.docId) {
                    await emergencyDoctorAvailabilityModel.findOneAndUpdate(
                        { docId: reqObj.docId },
                        { $inc: { currentActiveEmergencies: -1 } }
                    );
                }

                // Broadcast socket notifications
                if (io) {
                    io.emit('emergency-expired', { requestId: reqObj._id });
                    io.to(`user-emergency-${reqObj.userId}`).emit('emergency-status-updated', { request: reqObj });
                }
            }
        }
    } catch (err) {
        console.error("Error in sweepExpiredRequests:", err.message);
    }
};

// 1. Create Emergency Request (even when normal slots are closed)
export const createEmergencyRequest = async (req, res) => {
    try {
        const { 
            petId, 
            isStray, 
            strayDetails, 
            emergencyType, 
            description, 
            district, 
            state, 
            docId 
        } = req.body;

        const userId = req.userId || req.body.userId;

        if (!emergencyType || !description || !district || !state) {
            return res.json({
                success: false,
                message: "Missing essential emergency details (Type, Description, District, State)"
            });
        }

        // Fetch User and validate details
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({
                success: false,
                message: "Requester account not found."
            });
        }

        // Clean district & state for consistent matching
        const cleanDistrict = district.trim().toUpperCase();
        const cleanState = state.trim().toUpperCase();

        let assignedDocId = docId && docId !== "null" && docId !== "undefined" ? docId : null;
        let status = "Pending";

        // Find active, available doctors in district for immediate broadcast and potential assignment
        const availableEmergencyDocs = await emergencyDoctorAvailabilityModel.find({
            activeDistrict: cleanDistrict,
            activeState: cleanState,
            isEmergencyAvailable: true,
            $expr: { $lt: ["$currentActiveEmergencies", "$maxConcurrentEmergencies"] }
        }).sort({ currentActiveEmergencies: 1 });

        if (assignedDocId) {
            status = "Waiting for Doctor Approval";
        } else if (availableEmergencyDocs.length > 0) {
            // Auto-assign to doctor with the lowest active emergency workload
            assignedDocId = availableEmergencyDocs[0].docId;
            status = "Waiting for Doctor Approval";
        }

        // --- SUBSCRIPTION-BASED VALIDATION & PRICING ---
        // Tier-based emergency fee structure:
        //   Non-subscriber : ₹500  (full price)
        //   Silver          : ₹400  (₹100 off)
        //   Gold            : ₹300  (₹200 off)
        //   Platinum        : ₹200  (₹300 off)
        let finalAmount = 500; // default: Non-subscriber
        let paymentDetailsObj = {};
        let initialPaymentLogs = [];
        let createdDueRecord = null;
        let hasActiveSubscription = false;

        // Check if user has an active subscription (Platinum, Gold, Silver)
        if (user.subscription && user.subscription.plan !== 'None' && user.subscription.status === 'Active') {
            const expiryDate = new Date(user.subscription.expiryDate);
            if (expiryDate > new Date()) {
                hasActiveSubscription = true;
                const plan = (user.subscription.plan || '').toLowerCase();
                if (plan.includes('obsidian'))      finalAmount = 0;
                else if (plan.includes('platinum')) finalAmount = 200;
                else if (plan.includes('gold'))     finalAmount = 300;
                else if (plan.includes('silver'))   finalAmount = 400;
            }
        }

        if (hasActiveSubscription) {
            // Covered / discounted by subscription; deduct from wallet if sufficient, else mark as paid-by-subscription
            if (user.pawWallet >= finalAmount) {
                user.pawWallet -= finalAmount;
                await user.save();
            }
            const txnId = encrypt(`TXN-EM-SUB-${Date.now()}`);
            paymentDetailsObj = {
                paymentId: txnId,
                paymentMethod: `Subscription (${user.subscription.plan})`,
                paidAt: new Date(),
                status: "Paid"
            };

            initialPaymentLogs.push({
                amount: finalAmount,
                transactionId: txnId,
                method: `Subscription (${user.subscription.plan})`,
                status: "Success",
                timestamp: new Date()
            });
        } else {
            // Non-Subscriber or Expired subscription: apply full ₹500 fee
            if (user.pawWallet >= finalAmount) {
                // Deduct instantly from wallet
                user.pawWallet -= finalAmount;
                await user.save();

                const txnId = encrypt(`TXN-EM-WL-${Date.now()}`);
                paymentDetailsObj = {
                    paymentId: txnId,
                    paymentMethod: "Wallet",
                    paidAt: new Date(),
                    status: "Paid"
                };

                initialPaymentLogs.push({
                    amount: finalAmount,
                    transactionId: txnId,
                    method: "Wallet",
                    status: "Success",
                    timestamp: new Date()
                });
            } else {
                // Sufficient balance not available. Continue booking but enter "Pending Due Payment" state
                user.emergencyPaymentStatus = "Pending Due Payment";
                await user.save();

                paymentDetailsObj = {
                    paymentMethod: "None",
                    status: "Unpaid"
                };
            }
        }

        // Optional medical file/report processing via our helper
        let initialAttachments = [];
        if (req.file) {
            try {
                const uploadResult = await uploadFile(req.file, "emergency_attachments");
                initialAttachments.push({
                    url: uploadResult.url,
                    name: req.file.originalname || "Medical Report"
                });
            } catch (uploadErr) {
                console.error("Upload failed for emergency request file:", uploadErr.message);
            }
        }

        // Parse strayDetails if it's sent as a stringified FormData value
        let parsedStrayDetails = { petType: "", location: "", description: "" };
        const isStrayBool = isStray === "true" || isStray === true;
        if (isStrayBool && strayDetails) {
            try {
                parsedStrayDetails = typeof strayDetails === 'string' ? JSON.parse(strayDetails) : strayDetails;
            } catch (e) {
                console.warn("Failed to parse strayDetails JSON string, falling back.", e);
                parsedStrayDetails = { petType: "Stray", location: "", description: strayDetails };
            }
        }

        const emergencyData = {
            userId,
            docId: assignedDocId,
            petId: petId && petId !== "null" && petId !== "undefined" ? petId : null,
            isStray: isStrayBool,
            strayDetails: isStrayBool ? parsedStrayDetails : { petType: "", location: "", description: "" },
            emergencyType,
            description,
            district: cleanDistrict,
            state: cleanState,
            status,
            amount: finalAmount,
            paymentDetails: paymentDetailsObj,
            paymentLogs: initialPaymentLogs,
            attachments: initialAttachments,
            statusHistory: [{
                status,
                updatedBy: req.role || 'user',
                updatedById: userId,
                timestamp: new Date()
            }]
        };

        const newRequest = new emergencyRequestModel(emergencyData);
        await newRequest.save();

        // Create due payment record if user wallet has insufficient funds
        if (paymentDetailsObj.status !== "Paid") {
            const repaymentDeadline = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000); // 4 days from booking
            createdDueRecord = new emergencyPaymentDueModel({
                requestId: newRequest._id,
                userId: user._id,
                amountDue: finalAmount,
                dueDate: repaymentDeadline,
                auditLogs: [{
                    action: 'DUE_CREATED',
                    details: `Insufficient Paw Wallet balance. Deferred emergency booking fee of ₹${finalAmount} created with a 4-day repayment deadline.`,
                    timestamp: new Date()
                }]
            });
            await createdDueRecord.save();
        }

        // Increment doctor workload if assigned
        if (assignedDocId) {
            await emergencyDoctorAvailabilityModel.findOneAndUpdate(
                { docId: assignedDocId },
                { $inc: { currentActiveEmergencies: 1 } }
            );
        }

        // --- REAL-TIME BROADCAST NOTIFICATIONS ---
        // 1. Send Socket.IO live alerts to all connected doctors in the district
        try {
            const io = getIO();
            if (io) {
                io.to(`emergency-district-${cleanDistrict}`).emit('new-emergency-alert', { 
                    request: newRequest,
                    expiresInMs: 5 * 60 * 1000 
                });
            }
        } catch (sockErr) {
            console.error("Socket broadcast failed:", sockErr.message);
        }

        // 2. Query target doctors' email addresses to send urgent notifications
        const docIdsToNotify = availableEmergencyDocs.map(avail => avail.docId);
        if (assignedDocId && !docIdsToNotify.some(id => id.toString() === assignedDocId.toString())) {
            docIdsToNotify.push(assignedDocId);
        }

        if (docIdsToNotify.length > 0) {
            const doctorsList = await doctorModel.find({ _id: { $in: docIdsToNotify } });
            
            doctorsList.forEach(doctor => {
                const mailOptions = {
                    from: process.env.SENDER_EMAIL,
                    to: doctor.email,
                    subject: `🚨 URGENT: New Emergency Request in ${cleanDistrict}!`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #dc3545; border-radius: 8px;">
                            <h2 style="color: #dc3545; text-align: center;">🚨 EMERGENCY ALERT</h2>
                            <p>Dear Dr. <strong>${doctor.name}</strong>,</p>
                            <p>An urgent pet emergency has been reported in your active district (<strong>${cleanDistrict}</strong>).</p>
                            <hr/>
                            <p><strong>Emergency Particulars:</strong></p>
                            <ul>
                                <li><strong>Severity/Type:</strong> ${emergencyType}</li>
                                <li><strong>Description:</strong> ${description}</li>
                                <li><strong>Location:</strong> ${cleanDistrict}, ${cleanState}</li>
                            </ul>
                            <p style="background-color: #f8d7da; padding: 10px; border-radius: 4px; color: #721c24; text-align: center; font-weight: bold;">
                                Action Required: You have 5 minutes to approve or decline this emergency from your dashboard before it expires.
                            </p>
                            <p style="color: #6c757d; font-size: 12px; text-align: center;">PawVaidya Life-Support Network &copy; 2026</p>
                        </div>
                    `
                };
                notificationQueue.enqueueMail(mailOptions);
            });
        }

        // 3. Setup Node-level active scheduler for 5-minute auto-expiry fallback
        setTimeout(async () => {
            try {
                const checkRequest = await emergencyRequestModel.findById(newRequest._id);
                if (checkRequest && (checkRequest.status === 'Pending' || checkRequest.status === 'Waiting for Doctor Approval')) {
                    checkRequest.status = 'Rejected';
                    checkRequest.statusHistory.push({
                        status: 'Rejected',
                        updatedBy: 'system',
                        updatedById: userId,
                        timestamp: new Date()
                    });
                    checkRequest.approvalRecords.push({
                        action: 'Rejected',
                        actorId: userId,
                        actorType: 'admin',
                        reason: 'Expired - 5-minute approval window exceeded with no doctor approval.',
                        timestamp: new Date()
                    });
                    await checkRequest.save();

                    if (checkRequest.docId) {
                        await emergencyDoctorAvailabilityModel.findOneAndUpdate(
                            { docId: checkRequest.docId },
                            { $inc: { currentActiveEmergencies: -1 } }
                        );
                    }

                    const io = getIO();
                    if (io) {
                        io.emit('emergency-expired', { requestId: checkRequest._id });
                        io.to(`user-emergency-${userId}`).emit('emergency-status-updated', { request: checkRequest });
                    }
                }
            } catch (err) {
                console.error("Delayed expiry failed:", err.message);
            }
        }, 5 * 60 * 1000);

        await deleteCache(`user_profile_${userId}`);

        res.json({
            success: true,
            message: paymentDetailsObj.status === "Paid" 
                ? "Emergency request generated and paid successfully from Paw Wallet. Awaiting doctor approval." 
                : "Emergency request generated successfully. Insufficient wallet balance: account set to 'Pending Due Payment' with a 4-day repayment window.",
            request: decryptRequest(newRequest),
            dueRecord: createdDueRecord
        });

    } catch (error) {
        console.error("Error creating emergency request:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// 2. Fetch Emergency Requests based on Roles (Admin, Doctor, User)
export const getEmergencyRequests = async (req, res) => {
    try {
        // Run passive sweeper before returning lists
        await sweepExpiredRequests();

        let query = {};

        if (req.role === 'admin') {
            query = {};
        } else if (req.role === 'doctor') {
            const doctorAvailability = await emergencyDoctorAvailabilityModel.findOne({ docId: req.docId });
            const docDistrict = doctorAvailability ? doctorAvailability.activeDistrict : null;
            const docState = doctorAvailability ? doctorAvailability.activeState : null;

            query = {
                $or: [
                    { docId: req.docId },
                    { 
                        status: 'Pending', 
                        district: docDistrict, 
                        state: docState 
                    }
                ]
            };
        } else if (req.role === 'user') {
            query = { userId: req.userId };
        }

        const requests = await emergencyRequestModel.find(query)
            .populate('userId', 'name email phone subscription emergencyPaymentStatus') // Populates User Profile & Subscription Status
            .populate('docId', 'name speciality email docphone image')
            .populate('petId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            requests: requests.map(decryptRequest)
        });

    } catch (error) {
        console.error("Error fetching emergency requests:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// 3. Update Emergency Request Status (with role checks & atomic concurrency locking)
export const updateEmergencyStatus = async (req, res) => {
    try {
        const { requestId, status, reason } = req.body;
        const actorId = req.userId || req.docId || req.adminId;

        if (!requestId || !status) {
            return res.json({
                success: false,
                message: "Request ID and Target Status are required."
            });
        }

        // Run sweeper to make sure request is not stale
        await sweepExpiredRequests();

        const request = await emergencyRequestModel.findById(requestId);
        if (!request) {
            return res.json({
                success: false,
                message: "Emergency request not found."
            });
        }

        // Check if request already locked/resolved to prevent double claiming
        if (request.status === 'Completed' || request.status === 'Rejected' || request.status === 'Approved' || request.status === 'Payment Pending') {
            if (status === 'Approved' || status === 'Payment Pending') {
                return res.json({
                    success: false,
                    message: `Request is already locked in status: ${request.status}. Action aborted to prevent duplicate approvals.`
                });
            }
        }

        // --- ATOMIC CONCURRENCY LOCKING ---
        if (req.role === 'doctor' && (status === 'Approved' || status === 'Payment Pending')) {
            // Atomically lock request only if status is still Pending or Waiting for Doctor Approval
            // and either no doctor is assigned, or it is already assigned to this doctor
            const lockedRequest = await emergencyRequestModel.findOneAndUpdate(
                { 
                    _id: requestId, 
                    status: { $in: ['Pending', 'Waiting for Doctor Approval'] },
                    $or: [
                        { docId: null },
                        { docId: req.docId }
                    ]
                },
                { 
                    $set: { 
                        status: 'Payment Pending', 
                        docId: req.docId 
                    },
                    $push: {
                        approvalRecords: {
                            action: 'Approved',
                            actorId: req.docId,
                            actorType: 'doctor',
                            reason: reason || "Doctor claimed/approved emergency within window.",
                            timestamp: new Date()
                        },
                        statusHistory: {
                            status: 'Payment Pending',
                            updatedBy: 'doctor',
                            updatedById: req.docId,
                            timestamp: new Date()
                        }
                    }
                },
                { new: true }
            );

            if (!lockedRequest) {
                return res.json({
                    success: false,
                    message: "Concurrency Lock Failed. Another doctor has already approved or locked this emergency request."
                });
            }

            // Sync other doctor dashboards immediately via socket to hide/update
            try {
                const io = getIO();
                if (io) {
                    io.emit('emergency-locked', { requestId });
                    io.to(`user-emergency-${lockedRequest.userId}`).emit('emergency-status-updated', { request: lockedRequest });
                }
            } catch (sockErr) {
                console.error("Lock socket emission failed:", sockErr.message);
            }

            return res.json({
                success: true,
                message: "Emergency claimed and locked successfully. Pending user payment.",
                request: decryptRequest(lockedRequest)
            });
        }

        // Standard Status Update flows (e.g. Reject, Complete)
        if (req.role === 'doctor') {
            if (status === 'Rejected') {
                request.status = 'Rejected';
                request.approvalRecords.push({
                    action: 'Rejected',
                    actorId,
                    actorType: 'doctor',
                    reason: reason || "Doctor declined emergency.",
                    timestamp: new Date()
                });
                
                if (request.docId) {
                    await emergencyDoctorAvailabilityModel.findOneAndUpdate(
                        { docId: request.docId },
                        { $inc: { currentActiveEmergencies: -1 } }
                    );
                }
            } else if (status === 'Completed') {
                request.status = 'Completed';
                
                if (request.docId) {
                    await emergencyDoctorAvailabilityModel.findOneAndUpdate(
                        { docId: request.docId },
                        { $inc: { currentActiveEmergencies: -1 } }
                    );
                }
            } else {
                return res.json({
                    success: false,
                    message: "Doctors are only authorized to claim/approve, reject, or complete requests."
                });
            }
        }

        if (req.role === 'user') {
            if (status === 'Completed' || status === 'Rejected') {
                return res.json({
                    success: false,
                    message: "Users cannot reject or complete requests directly."
                });
            }
            request.status = status;

            // If user cancels, and a doctor was assigned, decrement doctor's workload
            if (status === 'Cancelled' && request.docId) {
                await emergencyDoctorAvailabilityModel.findOneAndUpdate(
                    { docId: request.docId },
                    { $inc: { currentActiveEmergencies: -1 } }
                );
            }
        }

        if (req.role === 'admin') {
            const oldStatus = request.status;
            request.status = status;
            
            // If status changed to Completed/Rejected/Cancelled from an active state, decrement doctor's workload
            if (['Completed', 'Rejected', 'Cancelled'].includes(status) && !['Completed', 'Rejected', 'Cancelled'].includes(oldStatus)) {
                if (request.docId) {
                    await emergencyDoctorAvailabilityModel.findOneAndUpdate(
                        { docId: request.docId },
                        { $inc: { currentActiveEmergencies: -1 } }
                    );
                }
            }
        }

        request.statusHistory.push({
            status: request.status,
            updatedBy: req.role,
            updatedById: actorId,
            timestamp: new Date()
        });

        await request.save();

        // Broadcast standard update to socket rooms
        try {
            const io = getIO();
            if (io) {
                io.to(`user-emergency-${request.userId}`).emit('emergency-status-updated', { request });
                io.emit('emergency-list-updated', { request });
            }
        } catch (sockErr) {
            console.error("Status update socket emission failed:", sockErr.message);
        }

        res.json({
            success: true,
            message: `Emergency request status moved to ${request.status}.`,
            request: decryptRequest(request)
        });

    } catch (error) {
        console.error("Error updating emergency status:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// 4. Filter Doctors by District Instantly
export const getAvailableDoctorsInDistrict = async (req, res) => {
    try {
        const { district, state } = req.query;

        if (!district || !state) {
            return res.json({
                success: false,
                message: "District and State are required queries."
            });
        }

        const cleanDistrict = district.trim().toUpperCase();
        const cleanState = state.trim().toUpperCase();

        const availabilities = await emergencyDoctorAvailabilityModel.find({
            activeDistrict: cleanDistrict,
            activeState: cleanState,
            isEmergencyAvailable: true
        }).populate({
            path: 'docId',
            select: 'name speciality experience image fees docphone averageRating available'
        });

        const activeDoctors = availabilities
            .filter(avail => avail.docId)
            .map(avail => ({
                availabilityId: avail._id,
                doctor: avail.docId,
                isEmergencyAvailable: avail.isEmergencyAvailable,
                maxConcurrentEmergencies: avail.maxConcurrentEmergencies,
                currentActiveEmergencies: avail.currentActiveEmergencies,
                activeDistrict: avail.activeDistrict,
                activeState: avail.activeState
            }));

        res.json({
            success: true,
            doctors: activeDoctors
        });

    } catch (error) {
        console.error("Error filtering doctors by district:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// 5. Create or Update Doctor Emergency Availability Toggles
export const updateDoctorEmergencyAvailability = async (req, res) => {
    try {
        const { isEmergencyAvailable, activeDistrict, activeState, maxConcurrentEmergencies } = req.body;
        const docId = req.docId || req.body.docId;

        if (!docId) {
            return res.json({
                success: false,
                message: "Doctor ID is required."
            });
        }

        if (!activeDistrict || !activeState) {
            return res.json({
                success: false,
                message: "Active District and State are required for emergency availability."
            });
        }

        const cleanDistrict = activeDistrict.trim().toUpperCase();
        const cleanState = activeState.trim().toUpperCase();

        const updatedAvailability = await emergencyDoctorAvailabilityModel.findOneAndUpdate(
            { docId },
            { 
                isEmergencyAvailable: isEmergencyAvailable === undefined ? true : (isEmergencyAvailable === "true" || isEmergencyAvailable === true),
                activeDistrict: cleanDistrict,
                activeState: cleanState,
                maxConcurrentEmergencies: maxConcurrentEmergencies || 3,
                lastUpdated: new Date()
            },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: "Emergency availability settings updated successfully.",
            availability: updatedAvailability
        });

    } catch (error) {
        console.error("Error updating doctor emergency availability:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// 6. Record Emergency Payment Log
export const recordEmergencyPaymentLog = async (req, res) => {
    try {
        const { requestId, amount, transactionId, method } = req.body;

        if (!requestId || !amount) {
            return res.json({
                success: false,
                message: "Request ID and Amount are required to record payment."
            });
        }

        const request = await emergencyRequestModel.findById(requestId);
        if (!request) {
            return res.json({
                success: false,
                message: "Emergency request not found."
            });
        }

        const finalTxnId = encrypt(transactionId || `TXN-EM-${Date.now()}`);

        // Add payment entry to the payment logs array
        request.paymentLogs.push({
            amount,
            transactionId: finalTxnId,
            method: method || "Cash",
            status: "Success",
            timestamp: new Date()
        });

        // Update standard payment tracking details
        request.paymentDetails = {
            paymentId: finalTxnId,
            paymentMethod: method || "Cash",
            paidAt: new Date(),
            status: "Paid"
        };

        // Transition from Payment Pending to Approved once paid
        request.status = "Approved";

        request.statusHistory.push({
            status: "Approved",
            updatedBy: req.role || 'user',
            updatedById: req.userId || req.adminId,
            timestamp: new Date()
        });

        await request.save();

        // Broadcast payment confirmation to sockets
        try {
            const io = getIO();
            if (io) {
                io.to(`user-emergency-${request.userId}`).emit('emergency-status-updated', { request });
                io.emit('emergency-list-updated', { request });
            }
        } catch (sockErr) {
            console.error("Payment update socket emission failed:", sockErr.message);
        }

        res.json({
            success: true,
            message: "Emergency payment recorded successfully and status set to Approved.",
            request: decryptRequest(request)
        });

    } catch (error) {
        console.error("Error recording emergency payment log:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// 7. Get historical emergency service consultations for a patient
export const getPatientEmergencyHistory = async (req, res) => {
    try {
        const { userId, petId } = req.query;

        if (!userId) {
            return res.json({
                success: false,
                message: "userId is required to query history."
            });
        }

        let query = { userId, status: 'Completed' };
        if (petId) {
            query.petId = petId;
        }

        const history = await emergencyRequestModel.find(query)
            .populate('docId', 'name speciality')
            .populate('petId', 'name breed age')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            history
        });
    } catch (error) {
        console.error("Error fetching patient history:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// 8. Repay outstanding emergency dues manually using Paw Wallet balance
export const repayEmergencyDues = async (req, res) => {
    try {
        const { dueId } = req.body;
        const userId = req.userId;

        if (!dueId) {
            return res.json({
                success: false,
                message: "Due ID is required for repayment."
            });
        }

        const due = await emergencyPaymentDueModel.findById(dueId);
        if (!due) {
            return res.json({
                success: false,
                message: "Payment due record not found."
            });
        }

        if (due.isPaid) {
            return res.json({
                success: false,
                message: "This due is already paid."
            });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({
                success: false,
                message: "User not found."
            });
        }

        const isObsidian = user.subscription?.plan === 'Obsidian' && user.subscription?.status === 'Active';
        const overdraftLimit = 50000;
        const availableAmount = isObsidian ? (user.pawWallet + overdraftLimit) : user.pawWallet;

        if (availableAmount < due.amountDue) {
            return res.json({
                success: false,
                message: `Insufficient Paw Wallet balance. You need ₹${due.amountDue} but only have ₹${user.pawWallet} (with ₹${isObsidian ? overdraftLimit : 0} overdraft limit). Please add funds to your wallet.`
            });
        }

        // Deduct from wallet
        user.pawWallet -= due.amountDue;

        // Check other outstanding dues for the same user
        const otherDuesCount = await emergencyPaymentDueModel.countDocuments({
            userId: user._id,
            isPaid: false,
            _id: { $ne: due._id }
        });

        if (otherDuesCount === 0) {
            user.emergencyPaymentStatus = 'No Dues';
            if (user.isBanned && user.banReason && user.banReason.includes("emergency booking dues")) {
                user.isBanned = false;
                user.banReason = '';
                user.bannedAt = null;
                user.bannedBy = null;
            }
        }

        await user.save();
        await deleteCache(`user_profile_${userId}`);

        // Mark due paid
        due.isPaid = true;
        due.paidAt = new Date();
        due.auditLogs.push({
            action: 'REPAYMENT_SUCCESS',
            details: `Outstanding due of ₹${due.amountDue} successfully paid manually using available Paw Wallet balance.`
        });
        await due.save();

        // Update corresponding emergency request
        const request = await emergencyRequestModel.findById(due.requestId);
        if (request) {
            const rawTxnId = `TXN-EM-WL-${Date.now()}`;
            const encTxnId = encrypt(rawTxnId);
            request.paymentDetails = {
                paymentId: encTxnId,
                paymentMethod: "Wallet",
                paidAt: new Date(),
                status: "Paid"
            };
            request.paymentLogs.push({
                amount: due.amountDue,
                transactionId: encTxnId,
                method: "Wallet",
                status: "Success",
                timestamp: new Date()
            });
            await request.save();

            // Notify user via socket with decrypted request details
            try {
                const io = getIO();
                if (io) {
                    io.to(`user-emergency-${request.userId}`).emit('emergency-status-updated', { request: decryptRequest(request) });
                }
            } catch (sockErr) {
                console.error("Dues manual socket notify failed:", sockErr.message);
            }
        }

        res.json({
            success: true,
            message: "Outstanding due successfully repaid from Paw Wallet balance.",
            due,
            walletBalance: user.pawWallet
        });

    } catch (error) {
        console.error("Error in repayEmergencyDues:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// 9. Fetch outstanding dues list for current user
export const getUserDuesList = async (req, res) => {
    try {
        const userId = req.userId;
        const dues = await emergencyPaymentDueModel.find({ userId })
            .populate({
                path: 'requestId',
                select: 'emergencyType status createdAt description'
            })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            dues
        });
    } catch (error) {
        console.error("Error fetching dues list:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// 10. Admin Stats Endpoint for Emergency Ecosystem
export const getAdminEmergencyStats = async (req, res) => {
    try {
        // A. Total emergency requests
        const totalRequests = await emergencyRequestModel.countDocuments();

        // B. Completion and success rates
        const completedRequests = await emergencyRequestModel.countDocuments({ status: 'Completed' });
        const successRate = totalRequests > 0 ? Number(((completedRequests / totalRequests) * 100).toFixed(2)) : 0;

        // C. Doctor-wise consultations served
        const doctorAggregation = await emergencyRequestModel.aggregate([
            { $match: { status: 'Completed', docId: { $ne: null } } },
            { $group: { _id: '$docId', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        const doctorWise = await doctorModel.populate(doctorAggregation, { path: '_id', select: 'name speciality' });

        // D. District-wise demand
        const districtWise = await emergencyRequestModel.aggregate([
            { $group: { _id: '$district', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // E. Subscription revenue
        const activeSilver = await userModel.countDocuments({ "subscription.status": "Active", "subscription.plan": "Silver" });
        const activeGold = await userModel.countDocuments({ "subscription.status": "Active", "subscription.plan": "Gold" });
        const activePlatinum = await userModel.countDocuments({ "subscription.status": "Active", "subscription.plan": "Platinum" });
        const subscriptionRevenue = (activeSilver * 650) + (activeGold * 450) + (activePlatinum * 250);

        // F. Recovered vs Pending dues
        const pendingDuesObj = await emergencyPaymentDueModel.aggregate([
            { $match: { isPaid: false } },
            { $group: { _id: null, total: { $sum: '$amountDue' } } }
        ]);
        const pendingDues = pendingDuesObj[0]?.total || 0;

        const recoveredDuesObj = await emergencyPaymentDueModel.aggregate([
            { $match: { isPaid: true } },
            { $group: { _id: null, total: { $sum: '$amountDue' } } }
        ]);
        const recoveredPayments = recoveredDuesObj[0]?.total || 0;

        // G. Direct Non-Subscriber request payments
        const directPaymentsObj = await emergencyRequestModel.aggregate([
            { $match: { "paymentDetails.status": "Paid", "paymentDetails.paymentMethod": { $not: /Subscription/i }, amount: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const directPayments = directPaymentsObj[0]?.total || 0;

        const totalRevenue = subscriptionRevenue + directPayments;

        // H. Average doctor response time (Pending to Approved/Claimed transition)
        const claimedRequests = await emergencyRequestModel.find({
            status: { $in: ['Approved', 'Payment Pending', 'Completed'] },
            docId: { $ne: null }
        }).select('createdAt statusHistory');

        let totalResponseTimeMs = 0;
        let countWithResponse = 0;

        for (const reqObj of claimedRequests) {
            const claimTransition = reqObj.statusHistory.find(h => 
                ['Approved', 'Payment Pending'].includes(h.status) && h.updatedBy === 'doctor'
            );
            if (claimTransition) {
                const duration = claimTransition.timestamp.getTime() - reqObj.createdAt.getTime();
                totalResponseTimeMs += duration;
                countWithResponse++;
            }
        }
        const avgResponseTimeSeconds = countWithResponse > 0 ? Number(((totalResponseTimeMs / countWithResponse) / 1000).toFixed(1)) : 0;

        // I. Suspicious activity tracking
        // I1. Users with multiple unpaid dues
        const suspiciousUsers = await emergencyPaymentDueModel.aggregate([
            { $match: { isPaid: false } },
            { $group: { _id: '$userId', count: { $sum: 1 }, totalDue: { $sum: '$amountDue' } } },
            { $match: { count: { $gt: 1 } } },
            { $sort: { count: -1 } }
        ]);
        const populatedSuspiciousUsers = await userModel.populate(suspiciousUsers, { path: '_id', select: 'name email phone' });

        // I2. Banned accounts matching emergency dues
        const bannedUsers = await userModel.find({
            isBanned: true,
            banReason: { $regex: /emergency/i }
        }).select('name email phone bannedAt banReason');

        // I3. Doctor declines tracking
        const doctorDeclines = await emergencyRequestModel.aggregate([
            { $unwind: '$approvalRecords' },
            { $match: { 'approvalRecords.status': 'Rejected' } },
            { $group: { _id: '$approvalRecords.docId', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        const populatedDeclines = await doctorModel.populate(doctorDeclines, { path: '_id', select: 'name speciality phone' });

        res.json({
            success: true,
            stats: {
                totalRequests,
                completedRequests,
                successRate,
                doctorWise,
                districtWise,
                subscriptionRevenue,
                directPayments,
                totalRevenue,
                pendingDues,
                recoveredPayments,
                avgResponseTimeSeconds,
                suspiciousActivity: {
                    multipleUnpaidUsers: populatedSuspiciousUsers,
                    bannedUsers,
                    doctorDeclines: populatedDeclines
                }
            }
        });
    } catch (error) {
        console.error("Error generating admin emergency stats:", error);
        res.json({ success: false, message: error.message });
    }
};

// 11. Advanced Filter & Query Requests for Admin Dashboard
export const getAdminEmergencyRequests = async (req, res) => {
    try {
        const { status, district, search, startDate, endDate } = req.query;
        let query = {};

        if (status) query.status = status;
        if (district) {
            query.district = { $regex: new RegExp(district, 'i') };
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        let requests = await emergencyRequestModel.find(query)
            .populate('userId', 'name email phone subscription')
            .populate('docId', 'name speciality phone')
            .populate('petId', 'name breed age')
            .sort({ createdAt: -1 });

        if (search) {
            const searchLower = search.toLowerCase();
            requests = requests.filter(r => 
                (r.userId?.name && r.userId.name.toLowerCase().includes(searchLower)) ||
                (r.userId?.email && r.userId.email.toLowerCase().includes(searchLower)) ||
                (r.docId?.name && r.docId.name.toLowerCase().includes(searchLower)) ||
                (r.description && r.description.toLowerCase().includes(searchLower)) ||
                (r._id.toString().includes(searchLower))
            );
        }

        res.json({
            success: true,
            count: requests.length,
            requests: requests.map(decryptRequest)
        });
    } catch (error) {
        console.error("Error querying admin requests:", error);
        res.json({ success: false, message: error.message });
    }
};

// 12. Export Downloadable CSV Report of Emergencies
export const exportEmergencyReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const requests = await emergencyRequestModel.find(query)
            .populate('userId', 'name email')
            .populate('docId', 'name')
            .sort({ createdAt: -1 });

        const csvRows = [];
        // CSV Headers
        csvRows.push(['Request ID', 'User Name', 'User Email', 'Doctor Name', 'District', 'Status', 'Booking Fee', 'Payment Status', 'Created At'].join(','));

        for (const reqObj of requests) {
            const row = [
                reqObj._id,
                `"${reqObj.userId?.name || 'Unknown'}"`,
                `"${reqObj.userId?.email || 'N/A'}"`,
                `"${reqObj.docId?.name || 'Unassigned'}"`,
                `"${reqObj.district || 'N/A'}"`,
                reqObj.status,
                reqObj.amount,
                reqObj.paymentDetails?.status || 'Unpaid',
                reqObj.createdAt.toISOString()
            ];
            csvRows.push(row.join(','));
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=emergency_report.csv');
        res.status(200).send(csvRows.join('\n'));
    } catch (error) {
        console.error("Error exporting report CSV:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
