import userModel from "../models/userModel.js";
import transactionModel from "../models/transactionModel.js";
import doctorModel from "../models/doctorModel.js";
import systemConfigModel from "../models/systemConfigModel.js";
import appointmentModel from "../models/appointmentModel.js";
import doctorScheduleModel from "../models/doctorScheduleModel.js";
import mobileIcuVanModel from "../models/mobileIcuVanModel.js";
import LLM from "../services/llm.js";
import driverModel from "../models/driverModel.js";
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import axios from 'axios';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Mock database to hold Mobile ICU Dispatches since they are dynamic real-time tracking sessions
export const icuDispatches = new Map();

/**
 * Helper function to find and assign a VCO to an Obsidian user based on location
 */
export const assignVcoToUser = async (user) => {
    try {
        if (user.vcoId && user.vcoId !== "VCO-SRUTI-007") {
            return user.vcoId;
        }

        const userAddressStr = (
            (user.address?.Location || "") + " " +
            (user.address?.line || "") + " " +
            (user.full_address || "")
        ).toLowerCase();

        const words = userAddressStr.split(/[\s,.\-\/]+/).filter(w => w.length > 2 && w !== "india");
        let matchingDoctors = [];

        if (words.length > 0) {
            // Priority 1: Match first word (usually city/district like Surat)
            const cityWord = words[0];
            matchingDoctors = await doctorModel.find({
                isBanned: { $ne: true },
                $or: [
                    { "address.line": { $regex: cityWord, $options: 'i' } },
                    { "full_address": { $regex: cityWord, $options: 'i' } }
                ]
            });

            // Priority 2: Fall back to state or other address words
            if (matchingDoctors.length === 0) {
                matchingDoctors = await doctorModel.find({
                    isBanned: { $ne: true },
                    $or: words.flatMap(word => [
                        { "address.Location": { $regex: word, $options: 'i' } },
                        { "address.line": { $regex: word, $options: 'i' } },
                        { "full_address": { $regex: word, $options: 'i' } }
                    ])
                });
            }
        }

        let selectedDoctor = null;
        if (matchingDoctors.length > 0) {
            selectedDoctor = matchingDoctors[Math.floor(Math.random() * matchingDoctors.length)];
        } else {
            // Fallback: Assign any active, unbanned doctor
            const allDoctors = await doctorModel.find({ isBanned: { $ne: true } });
            if (allDoctors.length > 0) {
                selectedDoctor = allDoctors[Math.floor(Math.random() * allDoctors.length)];
            }
        }

        if (selectedDoctor) {
            user.vcoId = selectedDoctor._id.toString();
            await user.save();
            return user.vcoId;
        }

        return null;
    } catch (error) {
        console.error("Error in assignVcoToUser:", error);
        return null;
    }
};

/**
 * Get assigned Veterinary Care Officer (VCO) details for Obsidian members
 */
export const getVcoDetails = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        // Verify Obsidian membership
        const isObsidian = user.subscription?.plan === 'Obsidian' && user.subscription?.status === 'Active';
        if (!isObsidian) {
            return res.json({
                success: false,
                message: "VCO Concierge is exclusive to Obsidian Signature Pass members."
            });
        }

        // Assign VCO if not set or is set to the default mock string
        let vcoId = user.vcoId;
        if (!vcoId || vcoId === "VCO-SRUTI-007") {
            vcoId = await assignVcoToUser(user);
        }

        let vcoDetails = {
            vcoId: "VCO-SRUTI-007",
            name: "Dr. Shruti Sen",
            title: "Dedicated Veterinary Care Officer",
            specialty: "Critical & Emergency Care Management",
            hotline: "+91 98765 43210",
            email: "shruti.sen@pawvaidya.com",
            photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
            bio: "Experienced critical care specialist assigned as your private 24/7 concierge officer for immediate consultation and clinical dispatch guidance."
        };

        if (vcoId && vcoId !== "VCO-SRUTI-007") {
            const doctor = await doctorModel.findById(vcoId);
            if (doctor) {
                vcoDetails = {
                    vcoId: doctor._id.toString(),
                    name: doctor.name,
                    title: "Dedicated Veterinary Care Officer",
                    specialty: doctor.speciality || "Critical & Emergency Care Management",
                    hotline: doctor.docphone || "+91 98765 43210",
                    email: doctor.email,
                    photo: doctor.image || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
                    bio: doctor.about || `Dedicated VCO for your state/city. Location: ${doctor.full_address || 'N/A'}`
                };
            }
        }

        return res.json({
            success: true,
            vco: vcoDetails
        });
    } catch (error) {
        console.error("Error in getVcoDetails:", error);
        return res.json({ success: false, message: error.message });
    }
};

/**
 * Dispatch Mobile ICU ambulance service
 */
export const dispatchMobileIcu = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { location, petName, urgency } = req.body;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        const isObsidian = user.subscription?.plan === 'Obsidian' && user.subscription?.status === 'Active';
        if (!isObsidian) {
            return res.json({
                success: false,
                message: "Mobile ICU Dispatch is exclusive to Obsidian Signature Pass members."
            });
        }

        // Try to find an available registered van
        let van = await mobileIcuVanModel.findOne({ status: 'Available' });

        const dispatchId = `ICU-DISP-${Date.now().toString().slice(-6)}`;
        const dispatchDetails = {
            dispatchId,
            vanId: van?._id?.toString() || null,
            userId,
            petName: petName || "your pet",
            status: "Dispatched",
            driverName: van?.driverName || "Vikram Rathore",
            paramedicName: van?.paramedicName || "Suresh Kumar",
            ambulanceNumber: van?.vanNumber || "DL 3C AY 4278",
            contact: van?.driverPhone || "+91 99991 11222",
            paramedicPhone: van?.paramedicPhone || "+91 99992 22333",
            baseLocation: van?.baseLocation || "Central Depot",
            equipment: van?.equipment || ['Oxygen Cylinder', 'Defibrillator', 'First Aid Kit'],
            location: location || van?.baseLocation || "User Registered Location",
            etaMinutes: 12,
            dispatchedAt: new Date()
        };

        icuDispatches.set(userId, dispatchDetails);

        // Mark the van as dispatched in DB
        if (van) {
            van.status = 'Dispatched';
            van.currentDispatchUserId = userId;
            await van.save();
        }

        return res.json({
            success: true,
            message: van
                ? `Mobile ICU Van ${van.vanNumber} has been dispatched immediately.`
                : "Mobile ICU unit has been dispatched immediately.",
            dispatch: dispatchDetails
        });
    } catch (error) {
        console.error("Error in dispatchMobileIcu:", error);
        return res.json({ success: false, message: error.message });
    }
};

/**
 * Retrieve status of active Mobile ICU dispatch
 */
export const getIcuStatus = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        const isObsidian = user.subscription?.plan === 'Obsidian' && user.subscription?.status === 'Active';
        if (!isObsidian) {
            return res.json({
                success: false,
                message: "Mobile ICU tracking is exclusive to Obsidian Signature Pass members."
            });
        }

        const dispatch = icuDispatches.get(userId);
        if (!dispatch) {
            return res.json({
                success: true,
                status: "Idle",
                message: "No active ICU dispatch found for your profile."
            });
        }

        // Dynamically adjust ETA for demonstration / realism
        const elapsedMinutes = Math.floor((new Date() - new Date(dispatch.dispatchedAt)) / 60000);
        let newEta = dispatch.etaMinutes - elapsedMinutes;
        let newStatus = dispatch.status;

        if (newEta <= 0) {
            newEta = 0;
            newStatus = "Arrived";
        } else if (newEta < 5) {
            newStatus = "En Route (Nearby)";
        }

        dispatch.etaMinutes = newEta;
        dispatch.status = newStatus;
        icuDispatches.set(userId, dispatch);

        return res.json({
            success: true,
            dispatch
        });
    } catch (error) {
        console.error("Error in getIcuStatus:", error);
        return res.json({ success: false, message: error.message });
    }
};

/**
 * Cancel an active Mobile ICU dispatch
 */
export const cancelIcuDispatch = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        const dispatch = icuDispatches.get(userId);
        if (!dispatch) {
            return res.json({ success: false, message: "No active ICU dispatch found to cancel." });
        }

        if (dispatch.status === 'Arrived') {
            return res.json({ success: false, message: "ICU van has already arrived. Cannot cancel." });
        }

        dispatch.status = 'Cancelled';
        dispatch.cancelledAt = new Date();
        icuDispatches.set(userId, dispatch);

        // Free the van back to Available in DB
        if (dispatch.vanId) {
            await mobileIcuVanModel.findByIdAndUpdate(dispatch.vanId, {
                status: 'Available',
                currentDispatchUserId: null
            });
        }

        // Auto-remove from active dispatches after 30 seconds
        setTimeout(() => {
            const current = icuDispatches.get(userId);
            if (current && current.status === 'Cancelled') {
                icuDispatches.delete(userId);
            }
        }, 30000);

        return res.json({
            success: true,
            message: "Mobile ICU dispatch has been cancelled successfully.",
            dispatch
        });
    } catch (error) {
        console.error("Error in cancelIcuDispatch:", error);
        return res.json({ success: false, message: error.message });
    }
};

/**
 * Admin: Get all active Mobile ICU dispatches (real-time overview)
 */
export const getAllIcuDispatches = async (req, res) => {
    try {
        const allDispatches = [];
        for (const [userId, dispatch] of icuDispatches.entries()) {
            // Dynamically update ETA
            const elapsedMinutes = Math.floor((new Date() - new Date(dispatch.dispatchedAt)) / 60000);
            let newEta = (dispatch.etaMinutes || 12) - elapsedMinutes;
            let newStatus = dispatch.status;

            if (dispatch.status !== 'Cancelled') {
                if (newEta <= 0) {
                    newEta = 0;
                    newStatus = "Arrived";
                } else if (newEta < 5) {
                    newStatus = "En Route (Nearby)";
                }
                dispatch.etaMinutes = newEta;
                dispatch.status = newStatus;
                icuDispatches.set(userId, dispatch);
            }

            // Fetch user info for admin display
            const user = await userModel.findById(userId).select('name email phone image address subscription');
            allDispatches.push({
                ...dispatch,
                user: user ? {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    image: user.image,
                    address: user.address,
                    plan: user.subscription?.plan
                } : { name: 'Unknown User' }
            });
        }

        return res.json({
            success: true,
            dispatches: allDispatches,
            totalActive: allDispatches.filter(d => d.status !== 'Cancelled' && d.status !== 'Arrived').length,
            totalArrived: allDispatches.filter(d => d.status === 'Arrived').length,
            totalCancelled: allDispatches.filter(d => d.status === 'Cancelled').length
        });
    } catch (error) {
        console.error("Error in getAllIcuDispatches:", error);
        return res.json({ success: false, message: error.message });
    }
};


/**
 * Admin: Get all registered Mobile ICU Vans
 */
export const getAllVans = async (req, res) => {
    try {
        const vans = await mobileIcuVanModel.find({}).sort({ createdAt: -1 });
        return res.json({ success: true, vans });
    } catch (error) {
        console.error("Error in getAllVans:", error);
        return res.json({ success: false, message: error.message });
    }
};

export const createVan = async (req, res) => {
    try {
        const {
            vanNumber, driverName, driverPhone, paramedicName, paramedicPhone, baseLocation, city, equipment, notes,
            createDriverAccount, emailAddress, username, password, emergencyContact, drivingLicenceNumber, govPhotoIdNumber, employmentStatus, joiningDate
        } = req.body;

        if (!vanNumber || !driverName || !driverPhone || !baseLocation) {
            return res.json({ success: false, message: "Van number, driver name, driver phone, and base location are required." });
        }

        const existing = await mobileIcuVanModel.findOne({ vanNumber });
        if (existing) {
            return res.json({ success: false, message: "A van with this number already exists." });
        }

        let driverId = null;
        let generatedCredentials = null;
        if (createDriverAccount) {
            if (!emailAddress) {
                return res.json({ success: false, message: "Email address is required for driver account creation." });
            }

            const existingEmail = await driverModel.findOne({ emailAddress });
            if (existingEmail) {
                return res.json({ success: false, message: "A driver with this email address already exists." });
            }

            const existingMobile = await driverModel.findOne({ mobileNumber: driverPhone });
            if (existingMobile) {
                return res.json({ success: false, message: "A driver with this mobile number already exists." });
            }

            // Generate Username: based on driverName (lowercase alphanumeric) + random 6 digits
            const baseName = driverName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'driver';
            const randomNum = Math.floor(100000 + Math.random() * 900000);
            const finalUsername = `${baseName}_${randomNum}`;

            // Generate 6-digit password
            const finalPassword = Math.floor(100000 + Math.random() * 900000).toString();

            const salt = await bcryptjs.genSalt(10);
            const hashedPassword = await bcryptjs.hash(finalPassword, salt);

            const driver = new driverModel({
                fullName: driverName,
                mobileNumber: driverPhone,
                emailAddress,
                username: finalUsername,
                password: hashedPassword,
                assignedVehicle: vanNumber,
                vehicleRegNumber: vanNumber,
                emergencyContact: emergencyContact || '',
                drivingLicenceNumber: drivingLicenceNumber || '',
                govPhotoIdNumber: govPhotoIdNumber || '',
                employmentStatus: employmentStatus || 'Active',
                joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
                status: 'Offline'
            });

            const savedDriver = await driver.save();
            driverId = savedDriver._id;
            generatedCredentials = {
                username: finalUsername,
                password: finalPassword
            };
        }

        const van = new mobileIcuVanModel({
            vanNumber, driverName, driverPhone,
            paramedicName: paramedicName || '',
            paramedicPhone: paramedicPhone || '',
            baseLocation, city: city || '',
            equipment: equipment || ['Oxygen Cylinder', 'Defibrillator', 'First Aid Kit', 'Stretcher'],
            notes: notes || '',
            status: 'Available'
        });
        await van.save();

        return res.json({
            success: true,
            message: createDriverAccount
                ? "Mobile ICU Van and associated driver account registered successfully."
                : "Mobile ICU Van registered successfully.",
            van,
            driverId,
            credentials: generatedCredentials
        });
    } catch (error) {
        console.error("Error in createVan:", error);
        return res.json({ success: false, message: error.message });
    }
};

/**
 * Admin: Update a Mobile ICU Van
 */
export const updateVan = async (req, res) => {
    try {
        const { vanId } = req.params;
        const updates = req.body;
        const van = await mobileIcuVanModel.findByIdAndUpdate(vanId, updates, { new: true });
        if (!van) return res.json({ success: false, message: "Van not found." });
        return res.json({ success: true, message: "Van updated successfully.", van });
    } catch (error) {
        console.error("Error in updateVan:", error);
        return res.json({ success: false, message: error.message });
    }
};

/**
 * Admin: Delete a Mobile ICU Van
 */
export const deleteVan = async (req, res) => {
    try {
        const { vanId } = req.params;
        const van = await mobileIcuVanModel.findById(vanId);
        if (!van) return res.json({ success: false, message: "Van not found." });
        if (van.status === 'Dispatched') {
            return res.json({ success: false, message: "Cannot delete a van that is currently dispatched." });
        }
        await mobileIcuVanModel.findByIdAndDelete(vanId);
        // Delete associated driver if exists
        await driverModel.findOneAndDelete({ assignedVehicle: van.vanNumber });
        return res.json({ success: true, message: "Van removed from fleet and associated driver account deleted successfully." });
    } catch (error) {
        console.error("Error in deleteVan:", error);
        return res.json({ success: false, message: error.message });
    }
};


/**
 * Get Wallet Overdraft details
 */
export const getOverdraftDetails = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        const isObsidian = user.subscription?.plan === 'Obsidian' && user.subscription?.status === 'Active';
        
        // Initialize user credit line if not set or status is None
        if (isObsidian && (!user.creditLine || user.creditLine.status === 'None')) {
            user.creditLine = {
                limit: 50000,
                spent: 0,
                lastUsed: null,
                repaymentDeadline: null,
                status: 'Active'
            };
            await user.save();
        }

        const limit = isObsidian ? (user.creditLine?.limit || 50000) : 0;
        const used = isObsidian ? (user.creditLine?.spent || 0) : 0;
        const available = limit - used;

        return res.json({
            success: true,
            isObsidian,
            limit,
            used,
            available,
            walletBalance: user.pawWallet,
            repaymentDeadline: user.creditLine?.repaymentDeadline || null,
            status: user.creditLine?.status || 'None'
        });
    } catch (error) {
        console.error("Error in getOverdraftDetails:", error);
        return res.json({ success: false, message: error.message });
    }
};

/**
 * Multi-Modal Vision AI Diagnostic simulation endpoint
 */
export const runMultiModalDiagnostics = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { symptoms } = req.body;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        const isObsidian = user.subscription?.plan === 'Obsidian' && user.subscription?.status === 'Active';
        if (!isObsidian) {
            return res.json({
                success: false,
                message: "Multi-Modal Vision AI is exclusive to Obsidian Signature Pass members."
            });
        }

        let imageContent = null;
        if (req.file) {
            try {
                const fileBuffer = fs.readFileSync(req.file.path);
                const base64Image = fileBuffer.toString('base64');
                const mimeType = req.file.mimetype || 'image/jpeg';
                imageContent = `data:${mimeType};base64,${base64Image}`;
                
                // Clean up the temporary file from local storage
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error("Temp file cleanup failed:", err);
                });
            } catch (err) {
                console.error("Failed to process uploaded file:", err);
            }
        }

        const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
        const headers = {
            "Authorization": `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
        };

        const prompt = `Perform an AI clinical analysis of physical symptoms for a pet.
Pet Name/Type: ${user.pet_type || 'Unknown Pet'}
Reported Symptoms: ${symptoms || 'Visual trauma / skin lesions'}

Analyze the symptoms and any attached visual media to make a diagnostic assessment.
Provide your response strictly in the following JSON format (do not wrap in markdown blocks, just return a raw JSON string):
{
  "diagnosis": "Likely diagnostic assessment",
  "severity": "Low | Moderate | High | Critical",
  "confidenceScore": "percentage",
  "actionPlan": "Recommended immediate veterinary action plan",
  "hotlineRecommendation": "Direct recommendation for concierge VCO attention"
}`;

        const messages = [];
        if (imageContent) {
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: imageContent } }
                ]
            });
        } else {
            messages.push({
                role: "user",
                content: prompt
            });
        }

        const payload = {
            model: "minimaxai/minimax-m3",
            messages: messages,
            max_tokens: 8192,
            temperature: 1.00,
            top_p: 0.95,
            stream: false
        };

        let aiResponse = "";
        try {
            const response = await axios.post(invokeUrl, payload, { headers });
            aiResponse = response.data.choices[0].message.content;
            console.log("NVIDIA response content:", aiResponse);
        } catch (err) {
            console.error("NVIDIA API call failed, using high-fidelity fallback diagnostic:", err.response ? err.response.data : err.message);
            aiResponse = JSON.stringify({
                diagnosis: "Dermatological Lesion consistent with Acute Moist Dermatitis (Hot Spot)",
                severity: "Moderate",
                confidenceScore: "92%",
                actionPlan: "Keep area dry, clean with pet-safe antiseptic, and apply recommended soothing balm. Avoid licking by using an E-collar.",
                hotlineRecommendation: "Connect with Dr. Shruti Sen on your VCO Hotline for prescription medication guidance."
            });
        }

        let parsedOutput;
        try {
            let cleanResponse = aiResponse.trim();
            if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
            }
            parsedOutput = JSON.parse(cleanResponse);
        } catch (e) {
            console.error("Failed to parse AI response, fallback to default schema:", e);
            parsedOutput = {
                diagnosis: "Visual inspection suggests localized cutaneous inflammation or hypersensitivity reaction.",
                severity: "Moderate",
                confidenceScore: "85%",
                actionPlan: "Observe area for spreading. Consult your Veterinary Care Officer via concierge chat.",
                hotlineRecommendation: "VCO guidance recommended."
            };
        }

        return res.json({
            success: true,
            analysis: parsedOutput
        });
    } catch (error) {
        console.error("Error in runMultiModalDiagnostics:", error);
        return res.json({ success: false, message: error.message });
    }
};

export const getCreditDetails = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        const isObsidian = user.subscription?.plan === 'Obsidian' && user.subscription?.status === 'Active';
        
        let config = await systemConfigModel.findOne();
        if (!config) {
            config = new systemConfigModel();
            await config.save();
        }
        if (!config.creditLinePool) {
            config.creditLinePool = { limit: 100000000, spent: 0, balance: 100000000 };
            await config.save();
        }

        // Initialize user credit line if not set or status is None
        if (isObsidian && (!user.creditLine || user.creditLine.status === 'None')) {
            user.creditLine = {
                limit: 50000,
                spent: 0,
                lastUsed: null,
                repaymentDeadline: null,
                status: 'Active'
            };
            await user.save();
        }

        return res.json({
            success: true,
            isObsidian,
            creditLine: user.creditLine || { limit: 0, spent: 0, lastUsed: null, repaymentDeadline: null, status: 'None' },
            globalPool: config.creditLinePool,
            walletBalance: user.pawWallet
        });
    } catch (error) {
        console.error("Error in getCreditDetails:", error);
        return res.json({ success: false, message: error.message });
    }
};

export const spendCredit = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { amount, description } = req.body;

        if (!amount || amount <= 0) {
            return res.json({ success: false, message: "Invalid amount." });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        const isObsidian = user.subscription?.plan === 'Obsidian' && user.subscription?.status === 'Active';
        if (!isObsidian) {
            return res.json({ success: false, message: "Credit line is exclusive to active Obsidian members." });
        }

        if (user.creditLine.status === 'Suspended') {
            return res.json({ success: false, message: "Your credit line is suspended due to delinquent repayment." });
        }

        // Initialize creditLine if needed
        if (!user.creditLine || user.creditLine.status === 'None') {
            user.creditLine = {
                limit: 50000,
                spent: 0,
                lastUsed: null,
                repaymentDeadline: null,
                status: 'Active'
            };
        }

        const availableCredit = user.creditLine.limit - user.creditLine.spent;
        if (availableCredit < amount) {
            return res.json({ success: false, message: `Insufficient credit limit. Available: ₹${availableCredit}, Requested: ₹${amount}` });
        }

        let config = await systemConfigModel.findOne();
        if (!config) {
            config = new systemConfigModel();
        }
        if (!config.creditLinePool) {
            config.creditLinePool = { limit: 100000000, spent: 0, balance: 100000000 };
        }

        if (config.creditLinePool.balance < amount) {
            return res.json({ success: false, message: "Global Credit Line pool has insufficient funds. Please contact administrator." });
        }

        // Deduct from global pool
        config.creditLinePool.spent += Number(amount);
        config.creditLinePool.balance -= Number(amount);
        await config.save();

        // Update user credit line
        if (user.creditLine.spent === 0) {
            user.creditLine.repaymentDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        }
        user.creditLine.spent += Number(amount);
        user.creditLine.lastUsed = new Date();
        user.pawWallet -= Number(amount); // Deduct from wallet (goes negative)
        await user.save();

        // Log transaction
        const transaction = new transactionModel({
            userId: user._id,
            type: 'Debit',
            amount: Number(amount),
            description: description || "Spent from Interest-Free Credit Line",
            paymentMethod: 'Credit Line',
            isOverdraftUsed: true,
            overdraftAmount: Number(amount)
        });
        await transaction.save();

        return res.json({
            success: true,
            message: `Successfully spent ₹${amount} from credit line.`,
            creditLine: user.creditLine,
            walletBalance: user.pawWallet
        });
    } catch (error) {
        console.error("Error in spendCredit:", error);
        return res.json({ success: false, message: error.message });
    }
};

export const repayCredit = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { amount } = req.body; // If not provided, repay full spent amount

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        if (!user.creditLine || user.creditLine.spent <= 0) {
            return res.json({ success: false, message: "No outstanding credit line dues to repay." });
        }

        const repayAmount = amount ? Math.min(Number(amount), user.creditLine.spent) : user.creditLine.spent;

        if (repayAmount <= 0) {
            return res.json({ success: false, message: "Invalid repayment amount." });
        }

        if (user.pawWallet < repayAmount) {
            return res.json({
                success: false,
                message: `Insufficient Paw Wallet balance to repay. Required: ₹${repayAmount}, Current Wallet Balance: ₹${user.pawWallet}. Please top up your wallet first.`
            });
        }

        // Deduct from user wallet & update creditLine
        user.pawWallet -= repayAmount;
        user.creditLine.spent -= repayAmount;

        if (user.creditLine.spent === 0) {
            user.creditLine.repaymentDeadline = null;
            if (user.creditLine.status === 'Suspended') {
                user.creditLine.status = 'Active'; // Restore status if fully paid
            }
        }
        await user.save();

        // Replenish global pool
        let config = await systemConfigModel.findOne();
        if (config && config.creditLinePool) {
            config.creditLinePool.spent = Math.max(0, config.creditLinePool.spent - repayAmount);
            config.creditLinePool.balance = Math.min(config.creditLinePool.limit, config.creditLinePool.balance + repayAmount);
            await config.save();
        }

        // Log transaction
        const transaction = new transactionModel({
            userId: user._id,
            type: 'Credit',
            amount: repayAmount,
            description: "Repayment of Interest-Free Credit Line dues",
            paymentMethod: 'Wallet'
        });
        await transaction.save();

        return res.json({
            success: true,
            message: `Successfully repaid ₹${repayAmount} of credit line dues. Remaining dues: ₹${user.creditLine.spent}`,
            creditLine: user.creditLine,
            walletBalance: user.pawWallet
        });
    } catch (error) {
        console.error("Error in repayCredit:", error);
        return res.json({ success: false, message: error.message });
    }
};

export const createAdminCreditTopupOrder = async (req, res) => {
    try {
        const { amount } = req.body; // in Rupees
        if (!amount || Number(amount) < 10000000) {
            return res.json({ success: false, message: "Minimum top-up amount is ₹1 Crore (₹1,00,00,000)." });
        }

        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_DpHGkF6J1sE0Q9',
            key_secret: process.env.RAZORPAY_KEY_SECRET || '0WmHsukHu6ycRC6U0zKh3tIy',
        });

        const options = {
            amount: Math.round(Number(amount) * 100), // in paisa
            currency: "INR",
            receipt: `admin_topup_${Date.now()}`
        };

        const order = await razorpayInstance.orders.create(options);

        return res.json({
            success: true,
            order,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_DpHGkF6J1sE0Q9'
        });
    } catch (error) {
        console.error("Error in createAdminCreditTopupOrder:", error);
        return res.json({ success: false, message: error.message });
    }
};

export const verifyAdminCreditTopup = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || '0WmHsukHu6ycRC6U0zKh3tIy')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.json({ success: false, message: "Invalid payment signature verification failed." });
        }

        // Top up global pool
        let config = await systemConfigModel.findOne();
        if (!config) {
            config = new systemConfigModel();
        }
        if (!config.creditLinePool) {
            config.creditLinePool = { limit: 100000000, spent: 0, balance: 100000000 };
        }

        config.creditLinePool.limit += Number(amount);
        config.creditLinePool.balance += Number(amount);
        await config.save();

        // Log transaction for admin
        // Find first admin or user to link to transaction
        const firstUser = await userModel.findOne();
        if (firstUser) {
            const transaction = new transactionModel({
                userId: firstUser._id,
                type: 'Credit',
                amount: Number(amount),
                description: `Admin topped up Interest-Free Credit Line by ₹${amount}`,
                paymentMethod: 'Razorpay'
            });
            await transaction.save();
        }

        return res.json({
            success: true,
            message: `Successfully topped up Interest-Free Credit Line by ₹${amount}.`,
            globalPool: config.creditLinePool
        });
    } catch (error) {
        console.error("Error in verifyAdminCreditTopup:", error);
        return res.json({ success: false, message: error.message });
    }
};

export const getAdminCreditStats = async (req, res) => {
    try {
        let config = await systemConfigModel.findOne();
        if (!config || !config.creditLinePool) {
            config = await systemConfigModel.findOneAndUpdate(
                {},
                { creditLinePool: { limit: 100000000, spent: 0, balance: 100000000 } },
                { new: true, upsert: true }
            );
        }

        // Find users with active or suspended credit lines
        const users = await userModel.find({
            "subscription.plan": "Obsidian",
            "creditLine.status": { $in: ["Active", "Suspended"] }
        }).select("name email phone creditLine pawWallet");

        // Find delinquent users
        const delinquentUsers = users.filter(u => u.creditLine.spent > 0 && u.creditLine.repaymentDeadline && new Date(u.creditLine.repaymentDeadline) < new Date());

        return res.json({
            success: true,
            globalPool: config.creditLinePool,
            usersCount: users.length,
            delinquentCount: delinquentUsers.length,
            users: users,
            delinquentUsers: delinquentUsers
        });
    } catch (error) {
        console.error("Error in getAdminCreditStats:", error);
        return res.json({ success: false, message: error.message });
    }
};

export const bookVco = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { slotDate, slotTime, visitType, petId, isStray, strayDetails } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        const isObsidian = user.subscription?.plan === 'Obsidian' && user.subscription?.status === 'Active';
        if (!isObsidian) {
            return res.json({
                success: false,
                message: "VCO Concierge bookings are exclusive to Obsidian Signature Pass members."
            });
        }

        let vcoId = user.vcoId;
        if (!vcoId || vcoId === "VCO-SRUTI-007") {
            vcoId = await assignVcoToUser(user);
        }

        if (!vcoId) {
            return res.json({ success: false, message: "No Dedicated Veterinary Care Officer is assigned or available." });
        }

        const doctor = await doctorModel.findById(vcoId);
        if (!doctor) {
            return res.json({ success: false, message: "Dedicated VCO details not found." });
        }

        // Find if there are any conflicting bookings for this doctor on that date & time
        const conflicts = await appointmentModel.find({
            docId: vcoId,
            slotDate,
            slotTime,
            cancelled: false,
            isCompleted: false
        });

        const preemptedIds = [];
        for (const conflict of conflicts) {
            conflict.cancelled = true;
            conflict.cancelledBy = 'admin';
            conflict.cancelReason = 'Preempted by Obsidian VIP Priority booking';
            await conflict.save();
            preemptedIds.push(conflict._id.toString());
        }

        // Add booking slot to doctor's slots_booked if not already there
        let slots_booked = doctor.slots_booked || {};
        slots_booked[slotDate] = slots_booked[slotDate] || [];
        if (!slots_booked[slotDate].includes(slotTime)) {
            slots_booked[slotDate].push(slotTime);
            await doctorModel.findByIdAndUpdate(vcoId, { slots_booked });
        }

        // Create the Obsidian VCO appointment
        const appointmentData = new appointmentModel({
            userId,
            docId: vcoId,
            slotDate,
            slotTime,
            userData: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                full_address: user.full_address
            },
            docData: {
                name: doctor.name,
                email: doctor.email,
                speciality: doctor.speciality,
                fees: doctor.fees,
                address: doctor.address
            },
            petId: petId || null,
            isStray: !!isStray,
            strayDetails: strayDetails || null,
            amount: 0, 
            date: Date.now(),
            payment: true,
            paymentMethod: "Obsidian",
            isVcoBooking: true,
            vcoVisitType: visitType || 'Clinic Visit',
            preemptedAppointments: preemptedIds
        });

        await appointmentData.save();

        return res.json({
            success: true,
            message: "Dedicated VCO Booked Successfully!",
            appointment: appointmentData,
            preemptedCount: preemptedIds.length
        });
    } catch (error) {
        console.error("Error in bookVco:", error);
        return res.json({ success: false, message: error.message });
    }
};

export const findNextAvailableSlot = async (docId, startDateStr) => {
    try {
        let currentDate = new Date();
        if (startDateStr) {
            const parts = startDateStr.split('_');
            if (parts.length === 3) {
                currentDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            }
        }

        const doctor = await doctorModel.findById(docId);
        if (!doctor) return null;

        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Search for the next 30 days
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(currentDate);
            checkDate.setDate(currentDate.getDate() + i);

            const dayName = daysOfWeek[checkDate.getDay()];
            const schedule = await doctorScheduleModel.findOne({
                doctorId: docId,
                dayOfWeek: dayName,
                isActive: true
            });

            if (!schedule) continue;

            const day = checkDate.getDate();
            const month = checkDate.getMonth() + 1;
            const year = checkDate.getFullYear();
            const slotDateKey = `${day}_${month}_${year}`;

            const bookedSlots = doctor.slots_booked[slotDateKey] || [];

            const [startHour, startMin] = schedule.startTime.split(':').map(Number);
            const [endHour, endMin] = schedule.endTime.split(':').map(Number);

            let currentTime = new Date(checkDate);
            currentTime.setHours(startHour, startMin, 0, 0);

            const endTime = new Date(checkDate);
            endTime.setHours(endHour, endMin, 0, 0);

            while (currentTime < endTime) {
                const timeString = currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });

                if (!bookedSlots.includes(timeString)) {
                    return {
                        slotDate: slotDateKey,
                        slotTime: timeString
                    };
                }

                currentTime.setMinutes(currentTime.getMinutes() + schedule.slotDuration);
            }
        }

        const nextDay = new Date(currentDate);
        nextDay.setDate(currentDate.getDate() + 1);
        const day = nextDay.getDate();
        const month = nextDay.getMonth() + 1;
        const year = nextDay.getFullYear();
        return {
            slotDate: `${day}_${month}_${year}`,
            slotTime: "10:00 AM"
        };
    } catch (error) {
        console.error("Error in findNextAvailableSlot:", error);
        return null;
    }
};

export const reschedulePreemptedAppointments = async (preemptedIds, docId) => {
    try {
        const doctor = await doctorModel.findById(docId);
        if (!doctor) return;

        for (const appId of preemptedIds) {
            const app = await appointmentModel.findById(appId);
            if (!app) continue;

            const freeSlot = await findNextAvailableSlot(docId, app.slotDate);
            if (freeSlot) {
                let slots_booked = doctor.slots_booked || {};
                slots_booked[freeSlot.slotDate] = slots_booked[freeSlot.slotDate] || [];
                if (!slots_booked[freeSlot.slotDate].includes(freeSlot.slotTime)) {
                    slots_booked[freeSlot.slotDate].push(freeSlot.slotTime);
                    await doctorModel.findByIdAndUpdate(docId, { slots_booked });
                }

                app.slotDate = freeSlot.slotDate;
                app.slotTime = freeSlot.slotTime;
                app.cancelled = false;
                app.cancelledBy = 'none';
                app.cancelReason = '';
                await app.save();
            }
        }
    } catch (error) {
        console.error("Error in reschedulePreemptedAppointments:", error);
    }
};

// --- DRIVER ADMINISTRATIVE ENDPOINTS ---

// Admin: Get all drivers
export const getAllDrivers = async (req, res) => {
    try {
        const drivers = await driverModel.find({}).sort({ createdAt: -1 });
        return res.json({ success: true, drivers });
    } catch (error) {
        console.error("Error in getAllDrivers:", error);
        return res.json({ success: false, message: error.message });
    }
};

// Admin: Get driver details
export const getDriverDetails = async (req, res) => {
    try {
        const { driverId } = req.params;
        const driver = await driverModel.findById(driverId);
        if (!driver) return res.json({ success: false, message: "Driver not found." });
        return res.json({ success: true, driver });
    } catch (error) {
        console.error("Error in getDriverDetails:", error);
        return res.json({ success: false, message: error.message });
    }
};

// Admin: Update driver details (includes document approval)
export const updateDriverDetails = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { fullName, emailAddress, mobileNumber, assignedVehicle, drivingLicenceNumber, govPhotoIdNumber, employmentStatus, approveDocuments, baseSalary, deductionAmount, deductionReason, deductionRemarks } = req.body;

        const driver = await driverModel.findById(driverId);
        if (!driver) return res.json({ success: false, message: "Driver not found." });

        if (fullName) driver.fullName = fullName;
        if (emailAddress) driver.emailAddress = emailAddress;
        if (mobileNumber) driver.mobileNumber = mobileNumber;
        if (assignedVehicle !== undefined) driver.assignedVehicle = assignedVehicle;
        if (drivingLicenceNumber) driver.drivingLicenceNumber = drivingLicenceNumber;
        if (govPhotoIdNumber) driver.govPhotoIdNumber = govPhotoIdNumber;
        if (employmentStatus) driver.employmentStatus = employmentStatus;
        if (baseSalary !== undefined) driver.salary.base = Number(baseSalary);

        if (approveDocuments !== undefined) {
            // Document Approval gates Online status
            driver.documents.uploaded = approveDocuments; 
            // If approved, we make sure they can go online
        }

        if (deductionAmount !== undefined && Number(deductionAmount) > 0) {
            if (!deductionReason) {
                return res.json({ success: false, message: "Reason is required to issue a salary deduction." });
            }
            const amount = Number(deductionAmount);
            driver.salary.deductions = (driver.salary.deductions || 0) + amount;
            driver.deductionHistory.push({
                amount,
                reason: deductionReason,
                remarks: deductionRemarks || '',
                bookingId: 'MANUAL_ADMIN_' + Date.now(),
                date: new Date()
            });
        }

        await driver.save();
        return res.json({ success: true, message: "Driver details updated successfully.", driver });
    } catch (error) {
        console.error("Error in updateDriverDetails:", error);
        return res.json({ success: false, message: error.message });
    }
};

// Admin: Ban a driver
export const banDriver = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { reason } = req.body;

        const driver = await driverModel.findById(driverId);
        if (!driver) return res.json({ success: false, message: "Driver not found." });

        driver.isBanned = true;
        driver.banReason = reason || "Violation of company terms of service.";
        driver.status = 'Offline';
        driver.employmentStatus = 'Suspended';
        
        await driver.save();
        return res.json({ success: true, message: "Driver has been banned successfully.", driver });
    } catch (error) {
        console.error("Error in banDriver:", error);
        return res.json({ success: false, message: error.message });
    }
};

// Admin: Unban / Reactivate a driver
export const unbanDriver = async (req, res) => {
    try {
        const { driverId } = req.params;

        const driver = await driverModel.findById(driverId);
        if (!driver) return res.json({ success: false, message: "Driver not found." });

        driver.isBanned = false;
        driver.banReason = '';
        driver.employmentStatus = 'Active';
        driver.appeal = { appealText: '', status: 'None', submittedAt: null }; // Reset appeal

        await driver.save();
        return res.json({ success: true, message: "Driver reactivated successfully.", driver });
    } catch (error) {
        console.error("Error in unbanDriver:", error);
        return res.json({ success: false, message: error.message });
    }
};

// Admin: Handle a pending appeal
export const handleAppeal = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        const driver = await driverModel.findById(driverId);
        if (!driver) return res.json({ success: false, message: "Driver not found." });

        if (!driver.appeal || driver.appeal.status !== 'Pending') {
            return res.json({ success: false, message: "No pending appeal found for this driver." });
        }

        if (action === 'approve') {
            driver.isBanned = false;
            driver.banReason = '';
            driver.employmentStatus = 'Active';
            driver.appeal.status = 'Approved';
        } else {
            driver.appeal.status = 'Rejected';
        }

        await driver.save();
        return res.json({ success: true, message: `Appeal ${action}d successfully.`, driver });
    } catch (error) {
        console.error("Error in handleAppeal:", error);
        return res.json({ success: false, message: error.message });
    }
};

// Admin: Delete a Driver Account
export const deleteDriver = async (req, res) => {
    try {
        const { driverId } = req.params;
        const driver = await driverModel.findById(driverId);
        if (!driver) {
            return res.json({ success: false, message: "Driver not found." });
        }
        await driverModel.findByIdAndDelete(driverId);
        return res.json({ success: true, message: "Driver account deleted successfully." });
    } catch (error) {
        console.error("Error in deleteDriver:", error);
        return res.json({ success: false, message: error.message });
    }
};

// --- USER DRIVER-INTERACTION ENDPOINTS ---

// User: Rate Driver (1-5 Stars)
export const rateDriver = async (req, res) => {
    try {
        const { bookingId, rating, review } = req.body;
        if (!bookingId || !rating) {
            return res.json({ success: false, message: "Booking ID and rating are required." });
        }

        // Find the dispatch in icuDispatches
        let activeUserId = null;
        let activeDispatch = null;
        for (const [uid, disp] of icuDispatches.entries()) {
            if (disp.dispatchId === bookingId) {
                activeDispatch = disp;
                activeUserId = uid;
                break;
            }
        }

        // Search for driver by vanId
        let van = null;
        if (activeDispatch && activeDispatch.vanId) {
            van = await mobileIcuVanModel.findById(activeDispatch.vanId);
        }

        if (!van) {
            return res.json({ success: false, message: "Could not locate driver/vehicle for this dispatch." });
        }

        const driver = await driverModel.findOne({ assignedVehicle: van.vanNumber });
        if (!driver) {
            return res.json({ success: false, message: "Driver account not found for rating." });
        }

        const newRating = {
            rating: Number(rating),
            review: review || '',
            bookingId
        };

        driver.ratings.push(newRating);

        // If rating is 5 stars, award a ₹1,500 bonus
        if (Number(rating) === 5) {
            driver.salary.bonus = (driver.salary.bonus || 0) + 1500;
        }

        await driver.save();
        return res.json({ success: true, message: "Thank you! Driver rating submitted successfully.", rating: newRating });
    } catch (error) {
        console.error("Error in rateDriver:", error);
        return res.json({ success: false, message: error.message });
    }
};

// User: Report Tip Demand (Automatic ₹3,000 deduction)
export const reportTipDemand = async (req, res) => {
    try {
        const { bookingId, remarks } = req.body;
        if (!bookingId) {
            return res.json({ success: false, message: "Booking ID is required." });
        }

        let activeUserId = null;
        let activeDispatch = null;
        for (const [uid, disp] of icuDispatches.entries()) {
            if (disp.dispatchId === bookingId) {
                activeDispatch = disp;
                activeUserId = uid;
                break;
            }
        }

        let van = null;
        if (activeDispatch && activeDispatch.vanId) {
            van = await mobileIcuVanModel.findById(activeDispatch.vanId);
        }

        if (!van) {
            return res.json({ success: false, message: "Could not locate vehicle for this complaint." });
        }

        const driver = await driverModel.findOne({ assignedVehicle: van.vanNumber });
        if (!driver) {
            return res.json({ success: false, message: "Driver account not found." });
        }

        // Deduct ₹3,000 from salary
        driver.salary.deductions = (driver.salary.deductions || 0) + 3000;
        driver.deductionHistory.push({
            amount: 3000,
            reason: "Misconduct: Demanded extra tips from user.",
            bookingId,
            remarks: remarks || ''
        });

        await driver.save();
        return res.json({ success: true, message: "Complaint filed. Deductions of ₹3,000 applied to driver's account." });
    } catch (error) {
        console.error("Error in reportTipDemand:", error);
        return res.json({ success: false, message: error.message });
    }
};
