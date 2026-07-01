import driverModel from '../models/driverModel.js';
import mobileIcuVanModel from '../models/mobileIcuVanModel.js';
import userModel from '../models/userModel.js';
import { icuDispatches } from './obsidianController.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import { generateGeminiContent } from '../utils/geminiHelper.js';

// 1. Driver Login
export const loginDriver = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.json({ success: false, message: "Username and password are required." });
        }

        const driver = await driverModel.findOne({ username });
        if (!driver) {
            return res.json({ success: false, message: "Invalid credentials." });
        }

        if (driver.employmentStatus === 'Terminated') {
            return res.json({ success: false, message: "Your driver account has been terminated/deleted." });
        }

        if (driver.employmentStatus === 'Suspended' || driver.isBanned) {
            return res.json({ success: false, message: `Account suspended. Reason: ${driver.banReason || 'Policy violations or administrative suspension'}` });
        }

        const isMatch = await bcryptjs.compare(password, driver.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials." });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: driver._id, role: 'driver' }, process.env.JWT_SECRET, { expiresIn: '7d' });

        return res.json({
            success: true,
            message: "Login successful.",
            token,
            driver: {
                id: driver._id,
                fullName: driver.fullName,
                username: driver.username,
                mobileNumber: driver.mobileNumber
            }
        });
    } catch (error) {
        console.error("Error in loginDriver:", error);
        return res.json({ success: false, message: error.message });
    }
};

// 2. Get Driver Profile
export const getDriverProfile = async (req, res) => {
    try {
        const driver = await driverModel.findById(req.driverId);
        if (!driver) {
            return res.json({ success: false, message: "Driver not found." });
        }
        return res.json({ success: true, driver });
    } catch (error) {
        console.error("Error in getDriverProfile:", error);
        return res.json({ success: false, message: error.message });
    }
};

// 2b. Upload Profile Photo
export const uploadProfilePhoto = async (req, res) => {
    try {
        const { profilePhoto } = req.body;
        if (!profilePhoto) {
            return res.json({ success: false, message: "Profile photo is required." });
        }

        const driver = await driverModel.findById(req.driverId);
        if (!driver) {
            return res.json({ success: false, message: "Driver not found." });
        }

        // Upload base64 to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(profilePhoto, {
            folder: 'driver_profiles',
            transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
        });

        driver.profilePhoto = uploadResult.secure_url;
        await driver.save();

        return res.json({
            success: true,
            message: "Profile photo uploaded successfully!",
            profilePhoto: driver.profilePhoto
        });
    } catch (error) {
        console.error("Error in uploadProfilePhoto:", error);
        return res.json({ success: false, message: error.message });
    }
};

// 3. Upload Documents (Licence / Gov ID) via Cloudinary
export const uploadDriverDocuments = async (req, res) => {
    try {
        const driver = await driverModel.findById(req.driverId);
        if (!driver) {
            return res.json({ success: false, message: "Driver not found." });
        }

        let updated = false;

        // If files are uploaded through multer
        if (req.files) {
            if (req.files.drivingLicence && req.files.drivingLicence[0]) {
                const file = req.files.drivingLicence[0];
                const uploadResult = await cloudinary.uploader.upload(file.path, { folder: 'driver_documents' });
                driver.documents.drivingLicenceUrl = uploadResult.secure_url;
                updated = true;
            }
            if (req.files.govPhotoId && req.files.govPhotoId[0]) {
                const file = req.files.govPhotoId[0];
                const uploadResult = await cloudinary.uploader.upload(file.path, { folder: 'driver_documents' });
                driver.documents.govPhotoIdUrl = uploadResult.secure_url;
                updated = true;
            }
        }

        if (updated) {
            driver.documents.uploaded = true;
            // Since documents are newly uploaded, reset the approval status to require admin review
            // Exception: if it was approved, any change requires new approval
            driver.documents.uploaded = true; 
            await driver.save();
            return res.json({ success: true, message: "Documents uploaded successfully. Awaiting Admin Approval.", driver });
        }

        return res.json({ success: false, message: "No documents uploaded." });
    } catch (error) {
        console.error("Error in uploadDriverDocuments:", error);
        return res.json({ success: false, message: error.message });
    }
};

// 4. Update GPS Location Coordinates
export const updateDriverLocation = async (req, res) => {
    try {
        const { lat, lng, locationSharing } = req.body;
        const driver = await driverModel.findById(req.driverId);
        if (!driver) {
            return res.json({ success: false, message: "Driver not found." });
        }

        if (lat !== undefined) driver.currentLocation.lat = Number(lat);
        if (lng !== undefined) driver.currentLocation.lng = Number(lng);
        if (locationSharing !== undefined) driver.locationSharing = Boolean(locationSharing);
        driver.currentLocation.updatedAt = new Date();

        await driver.save();
        return res.json({ success: true, message: "Location updated successfully.", currentLocation: driver.currentLocation, locationSharing: driver.locationSharing });
    } catch (error) {
        console.error("Error in updateDriverLocation:", error);
        return res.json({ success: false, message: error.message });
    }
};

// 5. Toggle Online/Offline Status
export const updateDriverStatus = async (req, res) => {
    try {
        const { status, faceVerified } = req.body; // 'Online' or 'Offline'
        if (!['Online', 'Offline'].includes(status)) {
            return res.json({ success: false, message: "Invalid status toggle value." });
        }

        const driver = await driverModel.findById(req.driverId);
        if (!driver) {
            return res.json({ success: false, message: "Driver not found." });
        }

        // Check if documents are approved
        if (status === 'Online') {
            if (!driver.documents.uploaded || driver.employmentStatus !== 'Active') {
                return res.json({
                    success: false,
                    message: "Cannot go Online. Your documents are pending admin approval or account is inactive."
                });
            }
            if (!driver.faceRegistered) {
                return res.json({
                    success: false,
                    message: "Cannot go Online. You must register your face first."
                });
            }

            // Check if face was verified today (same calendar date)
            const todayStr = new Date().toDateString();
            const lastVerifiedStr = driver.lastFaceVerifiedAt ? new Date(driver.lastFaceVerifiedAt).toDateString() : null;
            const verifiedToday = (todayStr === lastVerifiedStr);

            if (!verifiedToday) {
                return res.json({
                    success: false,
                    message: "Cannot go Online. Daily face verification is required before starting your job."
                });
            }
        }

        driver.status = status;
        await driver.save();

        return res.json({ success: true, message: `Driver is now ${status}.`, status: driver.status });
    } catch (error) {
        console.error("Error in updateDriverStatus:", error);
        return res.json({ success: false, message: error.message });
    }
};

// 6. Get Assigned Booking Detail
export const getDriverAssignedBooking = async (req, res) => {
    try {
        const driver = await driverModel.findById(req.driverId);
        if (!driver) {
            return res.json({ success: false, message: "Driver not found." });
        }

        // Find van assigned to this driver
        const van = await mobileIcuVanModel.findOne({ vanNumber: driver.assignedVehicle });
        if (!van) {
            return res.json({ success: true, booking: null, message: "No van currently assigned to this driver." });
        }

        // Find if this van is active in any dispatch
        let activeDispatch = null;
        let activeUserId = null;

        for (const [uid, dispatch] of icuDispatches.entries()) {
            if (dispatch.vanId === van._id.toString() && ['Dispatched', 'Accepted', 'En Route', 'Reached', 'Started'].includes(dispatch.status)) {
                activeDispatch = dispatch;
                activeUserId = uid;
                break;
            }
        }

        if (!activeDispatch) {
            return res.json({ success: true, booking: null });
        }

        // Fetch user data for address/contact details
        const bookingUser = await userModel.findById(activeUserId, 'name phone email');

        return res.json({
            success: true,
            booking: {
                ...activeDispatch,
                user: bookingUser
            }
        });
    } catch (error) {
        console.error("Error in getDriverAssignedBooking:", error);
        return res.json({ success: false, message: error.message });
    }
};

// 7. Update Dispatch Lifecycle (Accept -> Navigate -> Reached -> Begin -> Complete)
export const updateBookingStatus = async (req, res) => {
    try {
        const { bookingId, action } = req.body; // actions: 'accept', 'reached', 'begin', 'complete'
        const driver = await driverModel.findById(req.driverId);
        if (!driver) {
            return res.json({ success: false, message: "Driver not found." });
        }

        const van = await mobileIcuVanModel.findOne({ vanNumber: driver.assignedVehicle });
        if (!van) {
            return res.json({ success: false, message: "No vehicle assigned." });
        }

        // Find active dispatch
        let activeUserId = null;
        let activeDispatch = null;

        for (const [uid, dispatch] of icuDispatches.entries()) {
            if (dispatch.dispatchId === bookingId) {
                activeDispatch = dispatch;
                activeUserId = uid;
                break;
            }
        }

        if (!activeDispatch) {
            return res.json({ success: false, message: "Active booking dispatch not found." });
        }

        let newStatus = activeDispatch.status;
        let driverStatus = driver.status;

        if (action === 'accept') {
            newStatus = 'En Route';
            driverStatus = 'On Duty';
            activeDispatch.etaMinutes = 10;
        } else if (action === 'reached') {
            newStatus = 'Reached';
            activeDispatch.etaMinutes = 0;
        } else if (action === 'begin') {
            newStatus = 'Started';
        } else if (action === 'complete') {
            newStatus = 'Completed';
            driverStatus = 'Online';

            // Free the van in DB
            van.status = 'Available';
            van.currentDispatchUserId = null;
            await van.save();

            // Store completed status on dispatch
            activeDispatch.status = 'Completed';
            activeDispatch.completedAt = new Date();
            icuDispatches.set(activeUserId, activeDispatch);

            // Clean up from active dispatches after 60s
            setTimeout(() => {
                const current = icuDispatches.get(activeUserId);
                if (current && current.status === 'Completed') {
                    icuDispatches.delete(activeUserId);
                }
            }, 60000);
        } else {
            return res.json({ success: false, message: "Invalid action." });
        }

        activeDispatch.status = newStatus;
        icuDispatches.set(activeUserId, activeDispatch);

        driver.status = driverStatus;
        await driver.save();

        return res.json({ success: true, message: `Booking status updated to ${newStatus}.`, dispatch: activeDispatch, driverStatus });
    } catch (error) {
        console.error("Error in updateBookingStatus:", error);
        return res.json({ success: false, message: error.message });
    }
};

// 8. Submit Reinstatement Appeal
export const submitAppeal = async (req, res) => {
    try {
        const { appealText } = req.body;
        if (!appealText) {
            return res.json({ success: false, message: "Appeal reason is required." });
        }

        const driver = await driverModel.findById(req.driverId);
        if (!driver) {
            return res.json({ success: false, message: "Driver not found." });
        }

        if (!driver.isBanned) {
            return res.json({ success: false, message: "Driver is not banned. No appeal needed." });
        }

        // Limit: Exactly 1 appeal allowed
        if (driver.appeal && driver.appeal.status !== 'None') {
            return res.json({ success: false, message: "You have already submitted an appeal. Only one appeal is allowed." });
        }

        driver.appeal = {
            appealText,
            status: 'Pending',
            submittedAt: new Date()
        };

        await driver.save();
        return res.json({ success: true, message: "Appeal submitted successfully.", appeal: driver.appeal });
    } catch (error) {
        console.error("Error in submitAppeal:", error);
        return res.json({ success: false, message: error.message });
    }
};

// 9. Register Driver Face Snapshot
export const registerFace = async (req, res) => {
    try {
        const { facePhoto } = req.body;
        if (!facePhoto) {
            return res.json({ success: false, message: "Face snapshot is required for registration." });
        }

        const driver = await driverModel.findById(req.driverId);
        if (!driver) {
            return res.json({ success: false, message: "Driver not found." });
        }

        // --- Biometric Validation with Gemini ---
        const matches = facePhoto.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        let mimeType = 'image/jpeg';
        let base64Data = facePhoto;
        if (matches && matches.length === 3) {
            mimeType = matches[1];
            base64Data = matches[2];
        }

        const imageObj = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        };

        const prompt = `You are a biometric security AI. Analyze the attached image.
Determine if there is a single, clear, visible human face in this image.
Respond ONLY with a JSON object in this format:
{
  "hasFace": boolean,
  "confidence": number (between 0 and 1 representing face detection confidence),
  "reason": "description of why detection succeeded or failed (e.g. 'clear visible face', 'too dark', 'no human face present', 'blurry', 'multiple faces')"
}`;

        let geminiResponseText;
        try {
            geminiResponseText = await generateGeminiContent({ prompt, image: imageObj, jsonMode: true });
        } catch (geminiError) {
            console.error("Gemini face detection call failed:", geminiError);
            return res.json({ success: false, message: "Biometric validation server is currently busy. Please try again." });
        }

        let result;
        try {
            result = JSON.parse(geminiResponseText);
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", geminiResponseText);
            return res.json({ success: false, message: "Failed to parse biometric validation response." });
        }

        if (!result.hasFace || result.confidence < 0.7) {
            return res.json({
                success: false,
                message: `Face registration rejected: ${result.reason || 'No clear human face detected.'}`
            });
        }

        // Upload the base64 facePhoto data URL to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(facePhoto, {
            folder: 'driver_faces'
        });

        driver.facePhoto = uploadResult.secure_url;
        driver.faceRegistered = true;
        driver.lastFaceVerifiedAt = new Date();
        await driver.save();

        return res.json({
            success: true,
            message: "Face registration saved successfully to Cloudinary!",
            driver: {
                faceRegistered: driver.faceRegistered,
                facePhoto: driver.facePhoto,
                lastFaceVerifiedAt: driver.lastFaceVerifiedAt
            }
        });
    } catch (error) {
        console.error("Error in registerFace:", error);
        return res.json({ success: false, message: error.message });
    }
};

// 10. Verify Driver Face Snapshot
export const verifyFace = async (req, res) => {
    try {
        const { facePhoto } = req.body;
        if (!facePhoto) {
            return res.json({ success: false, message: "Face snapshot is required for verification." });
        }

        const driver = await driverModel.findById(req.driverId);
        if (!driver) {
            return res.json({ success: false, message: "Driver not found." });
        }

        if (!driver.faceRegistered || !driver.facePhoto) {
            return res.json({ success: false, message: "Face is not registered. Please register your face first." });
        }

        // --- Biometric Validation with Gemini ---
        const matches = facePhoto.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        let mimeType = 'image/jpeg';
        let base64Data = facePhoto;
        if (matches && matches.length === 3) {
            mimeType = matches[1];
            base64Data = matches[2];
        }

        const newImageObj = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        };

        // Download the registered face image and convert to base64
        let registeredImageObj;
        try {
            const downloadRes = await axios.get(driver.facePhoto, { responseType: 'arraybuffer' });
            const regMimeType = downloadRes.headers['content-type'] || 'image/jpeg';
            const regBase64 = Buffer.from(downloadRes.data, 'binary').toString('base64');
            registeredImageObj = {
                inlineData: {
                    data: regBase64,
                    mimeType: regMimeType
                }
            };
        } catch (downloadErr) {
            console.error("Failed to download registered face image:", downloadErr);
            return res.json({ success: false, message: "Failed to retrieve registered face profile for comparison." });
        }

        const prompt = `You are a high-security face biometric comparison system.
You are given two images:
1. The first image is the registered face photo of the driver.
2. The second image is the new live verification snapshot.

Analyze both images and determine:
1. If the second image contains a clear human face.
2. If the face in the second image belongs to the same person as the face in the first image (biometric match).

Respond ONLY with a JSON object in this format:
{
  "hasFace": boolean,
  "isMatch": boolean,
  "confidence": number (between 0 and 1 representing the match confidence),
  "reason": "detailed explanation of the comparison result (e.g., 'Faces match perfectly', 'No face detected in live snapshot', 'Different person', 'Lighting or angles differ too much')"
}`;

        let geminiResponseText;
        try {
            geminiResponseText = await generateGeminiContent({
                prompt,
                image: [registeredImageObj, newImageObj],
                jsonMode: true
            });
        } catch (geminiError) {
            console.error("Gemini face verification call failed:", geminiError);
            return res.json({ success: false, message: "Biometric validation server is currently busy. Please try again." });
        }

        let result;
        try {
            result = JSON.parse(geminiResponseText);
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", geminiResponseText);
            return res.json({ success: false, message: "Failed to parse biometric verification response." });
        }

        if (!result.hasFace) {
            return res.json({ success: false, message: `Verification failed: No clear face detected in snapshot. ${result.reason || ''}` });
        }

        if (!result.isMatch || result.confidence < 0.75) {
            return res.json({ success: false, message: `Biometric verification failed: Identity mismatch. ${result.reason || ''}` });
        }

        // Upload verification face snapshot to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(facePhoto, {
            folder: 'driver_face_verifications'
        });

        // Save last verified date
        driver.lastFaceVerifiedAt = new Date();
        await driver.save();

        return res.json({
            success: true,
            message: "Face verified successfully! Identity confirmed.",
            verificationUrl: uploadResult.secure_url,
            lastFaceVerifiedAt: driver.lastFaceVerifiedAt
        });
    } catch (error) {
        console.error("Error in verifyFace:", error);
        return res.json({ success: false, message: error.message });
    }
};

