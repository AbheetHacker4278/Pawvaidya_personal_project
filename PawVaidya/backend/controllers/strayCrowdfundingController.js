import strayCrowdfundingModel from '../models/strayCrowdfundingModel.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import adminModel from '../models/adminModel.js';
import { v2 as cloudinary } from 'cloudinary';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { deleteCache } from '../utils/cacheUtils.js';

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/stray-crowdfunding/create
export const createCampaign = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId; // Injected by authuser middleware
        const { title, description, animalType, targetAmount, clinicName, clinicAccountId, longitude, latitude, paymentMethod, selfContributionAmount, durationDays } = req.body;

        if (!title || !description || !animalType || !targetAmount || !clinicName || !longitude || !latitude) {
            return res.json({ success: false, message: "Missing required parameters for campaign registration." });
        }

        const selfContrib = Number(selfContributionAmount) || 500;
        if (selfContrib < 500) {
            return res.json({ success: false, message: "Minimum compulsory initial self-contribution is ₹500." });
        }

        const creator = await userModel.findById(userId);
        if (!creator) {
            return res.json({ success: false, message: "Creator user profile not found." });
        }

        let paymentId = "";
        if (paymentMethod === 'wallet') {
            if (creator.pawWallet < selfContrib) {
                return res.json({ success: false, message: "Insufficient Paw Wallet balance. Minimum self-contribution is ₹500." });
            }
            creator.pawWallet -= selfContrib;
            await creator.save();
            paymentId = `SELF_WALLET_${Date.now()}`;
        } else if (paymentMethod === 'razorpay') {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return res.json({ success: false, message: "Missing Razorpay payment parameters for initial contribution." });
            }
            const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
            hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
            const generated_signature = hmac.digest('hex');
            if (generated_signature !== razorpay_signature) {
                return res.json({ success: false, message: "Initial contribution payment signature verification failed." });
            }
            paymentId = razorpay_payment_id;
        } else {
            return res.json({ success: false, message: "Please specify a valid paymentMethod ('wallet' or 'razorpay') for the compulsory initial contribution." });
        }

        let imageUrl = "";
        // If file is uploaded via multer
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { folder: 'stray_crowdfunding' });
            imageUrl = result.secure_url;
            // try to delete local temp file
            try {
                import('fs').then(fs => {
                    if (fs.default.existsSync(req.file.path)) {
                        fs.default.unlinkSync(req.file.path);
                    }
                });
            } catch (err) {
                console.error("Temp file cleanup error:", err.message);
            }
        }

        const days = Number(durationDays) || 14;
        const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        const newCampaign = new strayCrowdfundingModel({
            creatorId: userId,
            title,
            description,
            animalType,
            imageUrl,
            targetAmount: Number(targetAmount),
            raisedAmount: selfContrib,
            clinicName,
            clinicAccountId: clinicAccountId || "",
            durationDays: days,
            endDate,
            contributions: [{
                userId,
                userName: creator.name || "Campaign Owner",
                amount: selfContrib,
                paymentId,
                date: new Date()
            }],
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)] // [lng, lat]
            }
        });

        await newCampaign.save();

        // Award +5 loyalty PawPoints for creating stray campaign
        creator.pawpoints = (creator.pawpoints || 0) + 5;
        await creator.save();

        await deleteCache(`user_profile_${userId}`);

        return res.json({
            success: true,
            message: "Stray animal crowdfunding campaign initiated successfully.",
            campaign: newCampaign,
            earnedPawPoints: 5
        });

    } catch (error) {
        console.error("Error creating stray campaign:", error);
        return res.json({ success: false, message: error.message });
    }
};

// GET /api/stray-crowdfunding/nearby
export const getNearbyCampaigns = async (req, res) => {
    try {
        const { longitude, latitude, radiusKm = 10 } = req.query;

        if (!longitude || !latitude) {
            const campaigns = await strayCrowdfundingModel.find({})
                .populate('creatorId', 'name email')
                .sort({ createdAt: -1 });
            return res.json({ success: true, count: campaigns.length, campaigns });
        }

        const radiusInMeters = radiusKm * 1000;

        const campaigns = await strayCrowdfundingModel.find({
            location: {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: radiusInMeters
                }
            }
        }).populate('creatorId', 'name email');

        return res.json({ success: true, count: campaigns.length, campaigns });

    } catch (error) {
        console.error("Error fetching nearby campaigns:", error);
        return res.json({ success: false, message: error.message });
    }
};

// GET /api/stray-crowdfunding/my-campaigns  (authenticated)
export const getMyCampaigns = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.json({ success: false, message: "Authentication required." });
        }

        const campaigns = await strayCrowdfundingModel.find({ creatorId: userId })
            .populate('creatorId', 'name email')
            .sort({ createdAt: -1 });

        return res.json({ success: true, count: campaigns.length, campaigns });
    } catch (error) {
        console.error("Error fetching user campaigns:", error);
        return res.json({ success: false, message: error.message });
    }
};

// GET /api/stray-crowdfunding/details/:id
export const getCampaignDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await strayCrowdfundingModel.findById(id)
            .populate('creatorId', 'name email')
            .populate('contributions.userId', 'name email');

        if (!campaign) {
            return res.json({ success: false, message: "Campaign not found." });
        }

        return res.json({ success: true, campaign });
    } catch (error) {
        console.error("Error getting campaign details:", error);
        return res.json({ success: false, message: error.message });
    }
};

// POST /api/stray-crowdfunding/pay-order
export const createContributionOrder = async (req, res) => {
    try {
        const { campaignId, amount } = req.body;

        if (!campaignId || !amount || amount <= 0) {
            return res.json({ success: false, message: "Invalid campaign or contribution amount." });
        }

        const campaign = await strayCrowdfundingModel.findById(campaignId);
        if (!campaign) {
            return res.json({ success: false, message: "Campaign not found." });
        }

        if (campaign.status !== 'Active') {
            return res.json({ success: false, message: "This campaign is no longer accepting contributions." });
        }

        const options = {
            amount: Math.round(amount * 100), // paise
            currency: "INR",
            receipt: `crowd_${campaignId}_${Date.now()}`
        };

        const order = await razorpayInstance.orders.create(options);
        return res.json({ success: true, order, campaign });

    } catch (error) {
        console.error("Error creating contribution order:", error);
        return res.json({ success: false, message: error.message });
    }
};

// POST /api/stray-crowdfunding/verify-payment
export const verifyContributionPayment = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId; // Injected by authuser middleware
        const { campaignId, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.json({ success: false, message: "Payment signature verification failed." });
        }

        const campaign = await strayCrowdfundingModel.findById(campaignId);
        if (!campaign) {
            return res.json({ success: false, message: "Target campaign not found." });
        }

        let contributor = await userModel.findById(userId);
        let isDoctor = false;
        if (!contributor) {
            contributor = await doctorModel.findById(userId);
            isDoctor = true;
        }
        const contributorName = contributor ? contributor.name : "Anonymous Patron";

        const amt = Number(amount);
        const remaining = campaign.targetAmount - campaign.raisedAmount;
        let actualContrib = amt;
        let refundAmount = 0;
        if (amt > remaining) {
            actualContrib = remaining;
            refundAmount = amt - remaining;
        }

        // Record contribution
        campaign.contributions.push({
            userId,
            userName: contributorName,
            amount: actualContrib,
            paymentId: razorpay_payment_id
        });

        // Update raised amount
        campaign.raisedAmount += actualContrib;

        // Auto-complete if target reached
        if (campaign.raisedAmount >= campaign.targetAmount) {
            campaign.status = 'Completed';
        }

        await campaign.save();

        // Refund excess amount to contributor's wallet immediately
        if (refundAmount > 0 && contributor) {
            contributor.pawWallet = (contributor.pawWallet || 0) + refundAmount;
            await contributor.save();
        }

        // Award +5 loyalty PawPoints to user contributor
        if (contributor && !isDoctor) {
            contributor.pawpoints = (contributor.pawpoints || 0) + 5;
            await contributor.save();
        }

        if (isDoctor) {
            await deleteCache(`doctor_profile_${userId}`);
        } else {
            await deleteCache(`user_profile_${userId}`);
        }

        return res.json({
            success: true,
            message: refundAmount > 0 
                ? `Contribution completed! You contributed more than remaining. ₹${actualContrib} was processed, and the remaining ₹${refundAmount} has been refunded to your wallet immediately.`
                : "Contribution processed successfully. Thank you for your support!",
            campaign,
            earnedPawPoints: isDoctor ? 0 : 5,
            refundedAmount: refundAmount
        });

    } catch (error) {
        console.error("Error verifying contribution payment:", error);
        return res.json({ success: false, message: error.message });
    }
};

// POST /api/stray-crowdfunding/self-pay-order
export const createSelfContributionOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount < 500) {
            return res.json({ success: false, message: "Minimum self-contribution is ₹500." });
        }
        const options = {
            amount: Math.round(amount * 100), // paise
            currency: "INR",
            receipt: `self_contrib_${Date.now()}`
        };
        const order = await razorpayInstance.orders.create(options);
        return res.json({ success: true, order });
    } catch (error) {
        console.error("Error creating self contribution order:", error);
        return res.json({ success: false, message: error.message });
    }
};

// PUT /api/stray-crowdfunding/edit/:id
export const editCampaign = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { id } = req.params;
        const { title, description, targetAmount, animalType, clinicName, clinicAccountId } = req.body;

        const campaign = await strayCrowdfundingModel.findById(id);
        if (!campaign) {
            return res.json({ success: false, message: "Campaign not found." });
        }

        if (campaign.creatorId.toString() !== userId.toString()) {
            return res.json({ success: false, message: "Unauthorized. Only the campaign creator can edit it." });
        }

        if (campaign.status !== 'Active') {
            return res.json({ success: false, message: "Cannot edit an inactive campaign." });
        }

        if (targetAmount && Number(targetAmount) < campaign.raisedAmount) {
            return res.json({ success: false, message: `Target amount cannot be lower than the already raised amount of ₹${campaign.raisedAmount}.` });
        }

        if (title) campaign.title = title;
        if (description) campaign.description = description;
        if (targetAmount) campaign.targetAmount = Number(targetAmount);
        if (animalType) campaign.animalType = animalType;
        if (clinicName) campaign.clinicName = clinicName;
        if (clinicAccountId !== undefined) campaign.clinicAccountId = clinicAccountId;

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { folder: 'stray_crowdfunding' });
            campaign.imageUrl = result.secure_url;
            try {
                import('fs').then(fs => {
                    if (fs.default.existsSync(req.file.path)) {
                        fs.default.unlinkSync(req.file.path);
                    }
                });
            } catch (err) {
                console.error("Temp file cleanup error:", err.message);
            }
        }

        await campaign.save();

        return res.json({
            success: true,
            message: "Campaign updated successfully.",
            campaign
        });
    } catch (error) {
        console.error("Error editing campaign:", error);
        return res.json({ success: false, message: error.message });
    }
};

// DELETE /api/stray-crowdfunding/delete/:id
export const deleteCampaign = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { id } = req.params;

        const campaign = await strayCrowdfundingModel.findById(id);
        if (!campaign) {
            return res.json({ success: false, message: "Campaign not found." });
        }

        if (campaign.creatorId.toString() !== userId.toString()) {
            return res.json({ success: false, message: "Unauthorized. Only the campaign creator can delete it." });
        }

        // Refund contributions back to users' wallets
        if (campaign.contributions && campaign.contributions.length > 0) {
            for (const contribution of campaign.contributions) {
                if (contribution.userId) {
                    await userModel.findByIdAndUpdate(contribution.userId, {
                        $inc: { pawWallet: contribution.amount }
                    });
                    await deleteCache(`user_profile_${contribution.userId.toString()}`);
                }
            }
        }

        await strayCrowdfundingModel.findByIdAndDelete(id);

        return res.json({
            success: true,
            message: "Campaign deleted and all contributions refunded successfully."
        });
    } catch (error) {
        console.error("Error deleting campaign:", error);
        return res.json({ success: false, message: error.message });
    }
};

// POST /api/stray-crowdfunding/upload-proof/:id
export const uploadProofInvoice = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { id } = req.params;

        const campaign = await strayCrowdfundingModel.findById(id);
        if (!campaign) {
            return res.json({ success: false, message: "Campaign not found." });
        }

        if (campaign.creatorId.toString() !== userId.toString()) {
            return res.json({ success: false, message: "Unauthorized. Only the campaign creator can upload proof." });
        }

        if (!req.file) {
            return res.json({ success: false, message: "Please upload an invoice or bill proof." });
        }

        // Delete old file if exists (allows re-upload)
        if (campaign.proofBillUrl) {
            try {
                if (campaign.proofBillUrl.includes('res.cloudinary.com')) {
                    const parts = campaign.proofBillUrl.split('/');
                    const filename = parts[parts.length - 1];
                    const publicId = 'stray_crowdfunding_proofs/' + filename.split('.')[0];
                    await cloudinary.uploader.destroy(publicId);
                } else if (campaign.proofBillUrl.includes('storage.googleapis.com') || campaign.proofBillUrl.includes('firebasestorage.googleapis.com')) {
                    const { deleteFromFirebase } = await import('../config/firebase.js');
                    await deleteFromFirebase(campaign.proofBillUrl);
                }
            } catch (err) {
                console.error("Error deleting old proof file:", err.message);
            }
        }

        const mimeType = req.file.mimetype ? req.file.mimetype.toLowerCase() : '';
        const originalName = req.file.originalname || '';
        const isImage = mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|heic|svg)$/i.test(originalName);

        let finalUrl = "";
        if (isImage) {
            const result = await cloudinary.uploader.upload(req.file.path, { folder: 'stray_crowdfunding_proofs' });
            finalUrl = result.secure_url;
            try {
                const fs = await import('fs');
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
            } catch (err) {
                console.error("Temp file cleanup error:", err.message);
            }
        } else {
            // Upload to Firebase Storage
            const { uploadToFirebase } = await import('../config/firebase.js');
            const timestamp = Date.now();
            const cleanFileName = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
            const destinationPath = `stray_crowdfunding_proofs/${timestamp}_${cleanFileName}`;
            finalUrl = await uploadToFirebase(req.file.path, destinationPath, req.file.mimetype || 'application/octet-stream');
        }

        campaign.proofBillUrl = finalUrl;
        campaign.isWithdrawn = true;
        campaign.status = 'Completed';

        await campaign.save();

        return res.json({
            success: true,
            message: "Motive bill/invoice attached and funds released to veterinary clinic successfully.",
            campaign
        });
    } catch (error) {
        console.error("Error uploading proof:", error);
        return res.json({ success: false, message: error.message });
    }
};

// POST /api/stray-crowdfunding/refund/:id
export const refundFailedCampaign = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { id } = req.params;

        const campaign = await strayCrowdfundingModel.findById(id);
        if (!campaign) {
            return res.json({ success: false, message: "Campaign not found." });
        }

        const caller = await userModel.findById(userId);
        const isAdmin = caller && caller.role === 'admin';

        if (campaign.creatorId.toString() !== userId.toString() && !isAdmin) {
            return res.json({ success: false, message: "Unauthorized to refund this campaign." });
        }

        if (campaign.isRefunded) {
            return res.json({ success: false, message: "Campaign contributions have already been refunded." });
        }

        if (campaign.contributions && campaign.contributions.length > 0) {
            for (const contribution of campaign.contributions) {
                if (contribution.userId) {
                    let contributor = await userModel.findById(contribution.userId);
                    if (contributor) {
                        contributor.pawWallet = (contributor.pawWallet || 0) + contribution.amount;
                        await contributor.save();
                        await deleteCache(`user_profile_${contribution.userId.toString()}`);
                    } else {
                        contributor = await doctorModel.findById(contribution.userId);
                        if (contributor) {
                            contributor.pawWallet = (contributor.pawWallet || 0) + contribution.amount;
                            await contributor.save();
                            await deleteCache(`doctor_profile_${contribution.userId.toString()}`);
                        } else {
                            contributor = await adminModel.findById(contribution.userId);
                            if (contributor) {
                                contributor.pawWallet = (contributor.pawWallet || 0) + contribution.amount;
                                await contributor.save();
                            }
                        }
                    }
                }
            }
        }

        campaign.isRefunded = true;
        campaign.status = 'Suspended';
        await campaign.save();

        return res.json({
            success: true,
            message: "Campaign declared failed and all contributions refunded to respective user wallets.",
            campaign
        });
    } catch (error) {
        console.error("Error refunding campaign:", error);
        return res.json({ success: false, message: error.message });
    }
};

// POST /api/stray-crowdfunding/admin/strict-action/:id
export const adminStrictAction = async (req, res) => {
    try {
        const { id } = req.params;
        
        const campaign = await strayCrowdfundingModel.findById(id);
        if (!campaign) {
            return res.json({ success: false, message: "Campaign not found." });
        }

        const owner = await userModel.findById(campaign.creatorId);
        if (!owner) {
            return res.json({ success: false, message: "Campaign owner not found." });
        }

        owner.isBanned = true;
        owner.banReason = `Failed to refund stray campaign '${campaign.title}' contributions within the 2-week duration limit.`;
        await owner.save();

        return res.json({
            success: true,
            message: `Strict action taken. Campaign owner ${owner.name} has been banned from the platform.`,
            owner
        });
    } catch (error) {
        console.error("Error taking strict action:", error);
        return res.json({ success: false, message: error.message });
    }
};

// POST /api/stray-crowdfunding/wallet-contribute
export const contributeViaWallet = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { campaignId, amount } = req.body;

        const amt = Number(amount);
        if (!amt || amt <= 0) {
            return res.json({ success: false, message: "Please specify a valid contribution amount." });
        }

        const campaign = await strayCrowdfundingModel.findById(campaignId);
        if (!campaign) {
            return res.json({ success: false, message: "Target campaign not found." });
        }

        if (campaign.status !== 'Active') {
            return res.json({ success: false, message: "This campaign is no longer accepting contributions." });
        }
        let contributor = await userModel.findById(userId);
        let isDoctor = false;
        if (!contributor) {
            contributor = await doctorModel.findById(userId);
            isDoctor = true;
        }
        if (!contributor) {
            return res.json({ success: false, message: "Contributor profile not found." });
        }

        if (contributor.pawWallet < amt) {
            return res.json({ success: false, message: `Insufficient Paw Wallet balance. Your balance is ₹${contributor.pawWallet}.` });
        }

        const remaining = campaign.targetAmount - campaign.raisedAmount;
        let actualContrib = amt;
        let refundAmount = 0;
        if (amt > remaining) {
            actualContrib = remaining;
            refundAmount = amt - remaining;
        }

        // Deduct actual contribution from wallet
        contributor.pawWallet -= actualContrib;
        await contributor.save();

        const paymentId = `WALLET_CONTRIB_${Date.now()}`;

        // Record contribution
        campaign.contributions.push({
            userId,
            userName: contributor.name || "Anonymous Patron",
            amount: actualContrib,
            paymentId
        });

        // Update raised amount
        campaign.raisedAmount += actualContrib;

        // Auto-complete if target reached
        if (campaign.raisedAmount >= campaign.targetAmount) {
            campaign.status = 'Completed';
        }

        await campaign.save();

        // Award +5 loyalty PawPoints
        if (!isDoctor) {
            contributor.pawpoints = (contributor.pawpoints || 0) + 5;
            await contributor.save();
        }

        if (isDoctor) {
            await deleteCache(`doctor_profile_${userId}`);
        } else {
            await deleteCache(`user_profile_${userId}`);
        }

        return res.json({
            success: true,
            message: refundAmount > 0
                ? `Contribution completed! You contributed more than remaining. ₹${actualContrib} was deducted, and the remaining ₹${refundAmount} was refunded/retained in your Paw Wallet immediately.`
                : "Contribution processed successfully via Paw Wallet. Thank you for your support!",
            campaign,
            earnedPawPoints: isDoctor ? 0 : 5,
            newWalletBalance: contributor.pawWallet
        });
    } catch (error) {
        console.error("Error with wallet contribution:", error);
        return res.json({ success: false, message: error.message });
    }
};

// POST /api/stray-crowdfunding/admin/contribute
export const adminContribute = async (req, res) => {
    try {
        const { campaignId, amount } = req.body;
        const adminId = req.admin?.id || 'master';

        const amt = Number(amount);
        if (!amt || amt <= 0) {
            return res.json({ success: false, message: "Please specify a valid contribution amount." });
        }

        const campaign = await strayCrowdfundingModel.findById(campaignId);
        if (!campaign) {
            return res.json({ success: false, message: "Target campaign not found." });
        }

        if (campaign.status !== 'Active') {
            return res.json({ success: false, message: "This campaign is no longer accepting contributions." });
        }

        let adminUser = null;
        let adminDbId = null;
        if (adminId !== 'master') {
            adminUser = await adminModel.findById(adminId);
            if (adminUser) {
                adminDbId = adminUser._id;
            }
        } else {
            adminUser = await adminModel.findOne({ email: req.admin?.email });
            if (!adminUser) {
                adminUser = await adminModel.findOne({});
            }
            if (adminUser) {
                adminDbId = adminUser._id;
            }
        }

        const remaining = campaign.targetAmount - campaign.raisedAmount;
        let actualContrib = amt;
        let refundAmount = 0;
        if (amt > remaining) {
            actualContrib = remaining;
            refundAmount = amt - remaining;
        }

        const paymentId = `ADMIN_CONTRIB_${Date.now()}`;

        // Record contribution
        campaign.contributions.push({
            userId: adminDbId,
            userName: "System Admin (Earnings Deduction)",
            amount: actualContrib,
            paymentId
        });

        // Update raised amount
        campaign.raisedAmount += actualContrib;

        // Auto-complete if target reached
        if (campaign.raisedAmount >= campaign.targetAmount) {
            campaign.status = 'Completed';
        }

        await campaign.save();

        // Refund any over-contributed amount back to Admin's wallet immediately
        if (refundAmount > 0 && adminUser) {
            adminUser.pawWallet = (adminUser.pawWallet || 0) + refundAmount;
            await adminUser.save();
        }

        // Import logActivity to log this action
        const { logActivity } = await import('../utils/activityLogger.js');
        await logActivity(
            adminId,
            'admin',
            'admin_campaign_contribution',
            `Contributed ₹${actualContrib} to stray campaign: ${campaign.title} (Refunded ₹${refundAmount} to wallet)`,
            req,
            { campaignId, amount: actualContrib, refundAmount }
        );

        return res.json({
            success: true,
            message: refundAmount > 0
                ? `Successfully contributed ₹${actualContrib} to the campaign. The remaining ₹${refundAmount} was refunded to your Admin Wallet immediately.`
                : `Successfully contributed ₹${amt} to the campaign. The amount will be deducted from your earnings.`,
            campaign
        });
    } catch (error) {
        console.error("Error in adminContribute:", error);
        return res.json({ success: false, message: error.message });
    }
};

// POST /api/stray-crowdfunding/admin/delete/:id
export const adminDeleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const { responseMessage } = req.body;
        const adminId = req.admin?.id || 'master';

        if (!responseMessage) {
            return res.json({ success: false, message: "Please provide an appropriate response/reason for deleting this campaign." });
        }

        const campaign = await strayCrowdfundingModel.findById(id);
        if (!campaign) {
            return res.json({ success: false, message: "Campaign not found." });
        }

        const owner = await userModel.findById(campaign.creatorId);
        if (owner && owner.email) {
            try {
                const { transporter } = await import('../config/nodemailer.js');
                await transporter.sendMail({
                    from: process.env.SENDER_EMAIL,
                    to: owner.email,
                    subject: `Important: Your Stray Animal Campaign Has Been Deleted by Admin`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h2>Campaign Deletion Notification</h2>
                            <p>Hello ${owner.name || 'User'},</p>
                            <p>Your stray animal crowdfunding campaign titled <strong>"${campaign.title}"</strong> has been deleted by the administrator.</p>
                            <p><strong>Reason / Response from Admin:</strong></p>
                            <blockquote style="background: #f9f9f9; border-left: 5px solid #e11d48; padding: 10px 15px; margin: 20px 0;">
                                "${responseMessage}"
                            </blockquote>
                            <p>All contributions raised so far (₹${campaign.raisedAmount}) have been refunded back to the respective contributors' wallets.</p>
                            <p>If you have any questions, please contact our support team.</p>
                            <p>Best regards,<br/>PawVaidya Team</p>
                        </div>
                    `
                });
            } catch (mailErr) {
                console.error("Failed to send deletion email to owner:", mailErr);
            }
        }

        // Refund contributions back to users' wallets
        if (campaign.contributions && campaign.contributions.length > 0) {
            for (const contribution of campaign.contributions) {
                if (contribution.userId) {
                    let contributor = await userModel.findById(contribution.userId);
                    if (contributor) {
                        contributor.pawWallet = (contributor.pawWallet || 0) + contribution.amount;
                        await contributor.save();
                        await deleteCache(`user_profile_${contribution.userId.toString()}`);
                    } else {
                        contributor = await doctorModel.findById(contribution.userId);
                        if (contributor) {
                            contributor.pawWallet = (contributor.pawWallet || 0) + contribution.amount;
                            await contributor.save();
                            await deleteCache(`doctor_profile_${contribution.userId.toString()}`);
                        } else {
                            contributor = await adminModel.findById(contribution.userId);
                            if (contributor) {
                                contributor.pawWallet = (contributor.pawWallet || 0) + contribution.amount;
                                await contributor.save();
                            }
                        }
                    }
                }
            }
        }

        await strayCrowdfundingModel.findByIdAndDelete(id);

        // Log activity
        const { logActivity } = await import('../utils/activityLogger.js');
        await logActivity(
            adminId,
            'admin',
            'admin_campaign_deletion',
            `Deleted stray campaign: ${campaign.title}. Reason: ${responseMessage}`,
            req,
            { campaignId: id, responseMessage }
        );

        return res.json({
            success: true,
            message: "Campaign deleted and all contributions refunded. A notification email has been sent to the campaign owner."
        });
    } catch (error) {
        console.error("Error in adminDeleteCampaign:", error);
        return res.json({ success: false, message: error.message });
    }
};

// POST /api/stray-crowdfunding/admin/boost/:id
export const adminBoostCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin?.id || 'master';

        const campaign = await strayCrowdfundingModel.findById(id);
        if (!campaign) {
            return res.json({ success: false, message: "Campaign not found." });
        }

        // Fetch all users and doctors
        const users = await userModel.find({}, 'email name');
        const doctorModel = (await import('../models/doctorModel.js')).default;
        const doctors = await doctorModel.find({}, 'email name');

        const recipients = [
            ...users.map(u => ({ email: u.email, name: u.name, type: 'user' })),
            ...doctors.map(d => ({ email: d.email, name: d.name, type: 'doctor' }))
        ].filter(r => r.email);

        const { transporter } = await import('../config/nodemailer.js');

        // Send boost emails asynchronously in non-blocking fashion
        const mailPromises = recipients.map(recipient => {
            return transporter.sendMail({
                from: process.env.SENDER_EMAIL,
                to: recipient.email,
                subject: `🚨 Urgent Support Needed: Boosted Stray Animal Campaign!`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
                        <h2 style="color: #0f766e;">PawVaidya Stray Animal Emergency</h2>
                        <p>Hello ${recipient.name || 'Friend'},</p>
                        <p>Our administrator has boosted a critical stray animal crowdfunding campaign that urgently needs your support!</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <h3 style="color: #0f766e; margin-top: 0;">"${campaign.title}"</h3>
                        <p><strong>Motive/Description:</strong> ${campaign.description}</p>
                        <p><strong>Target Clinic:</strong> ${campaign.clinicName}</p>
                        <p><strong>Financial Target:</strong> ₹${campaign.targetAmount}</p>
                        <p><strong>Already Raised:</strong> ₹${campaign.raisedAmount}</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p>Every contribution helps provide immediate medical care to this vulnerable stray animal. If you can help, please view the campaign and contribute today.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:5173/stray-crowdfunding" style="background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Contribute Now</a>
                        </div>
                        <p>Best regards,<br/>PawVaidya Team</p>
                    </div>
                `
            }).catch(err => {
                console.error(`Failed to send boost email to ${recipient.email}:`, err.message);
            });
        });

        // We run the mail promises without blocking the response
        Promise.allSettled(mailPromises).then(() => {
            console.log(`Boost campaign email broadcast completed for ${recipients.length} recipients.`);
        });

        // Log activity
        const { logActivity } = await import('../utils/activityLogger.js');
        await logActivity(
            adminId,
            'admin',
            'admin_campaign_boost',
            `Boosted stray campaign: ${campaign.title}. Broadcasted email to all users & doctors.`,
            req,
            { campaignId: id }
        );

        return res.json({
            success: true,
            message: `Campaign boosted successfully! Notification emails are being broadcasted to all ${recipients.length} users and doctors.`
        });

    } catch (error) {
        console.error("Error in adminBoostCampaign:", error);
        return res.json({ success: false, message: error.message });
    }
};

// POST /api/stray-crowdfunding/admin/send-warning/:id
export const adminSendWarning = async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await strayCrowdfundingModel.findById(id);
        if (!campaign) {
            return res.json({ success: false, message: "Campaign not found." });
        }

        const owner = await userModel.findById(campaign.creatorId);
        if (!owner) {
            return res.json({ success: false, message: "Campaign owner not found." });
        }

        const { transporter } = await import('../config/nodemailer.js');
        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: owner.email,
            subject: `⚠️ URGENT WARNING: Attach Invoice for Stray Campaign "${campaign.title}"`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #b91c1c;">Urgent Warning: Invoice/Bill Required</h2>
                    <p>Hello ${owner.name || 'User'},</p>
                    <p>Your stray animal crowdfunding campaign titled <strong>"${campaign.title}"</strong> successfully reached its target of <strong>₹${campaign.targetAmount}</strong>, but you have failed to upload the required clinic invoice/receipt within 3 days.</p>
                    <p>Please attach the valid invoice or bill immediately as proof of treatment.</p>
                    <p>If you fail to do so, the admin will suspend the campaign and refund all contributions back to the respective contributors' wallets, and strict action may be taken against your account.</p>
                    <p>If the campaign motive was not met or if you cannot provide the invoice, you must repay the contributions by clicking the refund button on your campaign dashboard to credit contributors' wallets.</p>
                    <p>Best regards,<br/>PawVaidya Admin Team</p>
                </div>
            `
        });

        return res.json({ success: true, message: "Warning email sent successfully to the campaign owner." });
    } catch (error) {
        console.error("Error sending warning email:", error);
        return res.json({ success: false, message: error.message });
    }
};

// POST /api/stray-crowdfunding/admin/suspend-refund/:id
export const adminSuspendRefundCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin?.id || 'master';

        const campaign = await strayCrowdfundingModel.findById(id);
        if (!campaign) {
            return res.json({ success: false, message: "Campaign not found." });
        }

        if (campaign.isRefunded) {
            return res.json({ success: false, message: "Campaign contributions have already been refunded." });
        }

        // Refund contributions back to users' wallets
        if (campaign.contributions && campaign.contributions.length > 0) {
            for (const contribution of campaign.contributions) {
                if (contribution.userId) {
                    let contributor = await userModel.findById(contribution.userId);
                    if (contributor) {
                        contributor.pawWallet = (contributor.pawWallet || 0) + contribution.amount;
                        await contributor.save();
                        await deleteCache(`user_profile_${contribution.userId.toString()}`);
                    } else {
                        contributor = await doctorModel.findById(contribution.userId);
                        if (contributor) {
                            contributor.pawWallet = (contributor.pawWallet || 0) + contribution.amount;
                            await contributor.save();
                            await deleteCache(`doctor_profile_${contribution.userId.toString()}`);
                        } else {
                            contributor = await adminModel.findById(contribution.userId);
                            if (contributor) {
                                contributor.pawWallet = (contributor.pawWallet || 0) + contribution.amount;
                                await contributor.save();
                            }
                        }
                    }
                }
            }
        }

        campaign.isRefunded = true;
        campaign.status = 'Suspended';
        await campaign.save();

        // Notify owner of suspension
        const owner = await userModel.findById(campaign.creatorId);
        if (owner && owner.email) {
            try {
                const { transporter } = await import('../config/nodemailer.js');
                await transporter.sendMail({
                    from: process.env.SENDER_EMAIL,
                    to: owner.email,
                    subject: `🚨 Campaign Suspended: Stray Campaign "${campaign.title}"`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
                            <h2 style="color: #b91c1c;">Campaign Suspended & Refunded</h2>
                            <p>Hello ${owner.name || 'User'},</p>
                            <p>Because you failed to upload the required clinic invoice/receipt, your stray animal campaign titled <strong>"${campaign.title}"</strong> has been suspended.</p>
                            <p>All contributions raised have been automatically refunded back to the respective contributors' wallets.</p>
                            <p>Best regards,<br/>PawVaidya Admin Team</p>
                        </div>
                    `
                });
            } catch (mailErr) {
                console.error("Failed to send suspension email:", mailErr);
            }
        }

        // Log activity
        const { logActivity } = await import('../utils/activityLogger.js');
        await logActivity(
            adminId,
            'admin',
            'admin_campaign_suspension',
            `Suspended stray campaign and refunded all contributions: ${campaign.title}.`,
            req,
            { campaignId: id }
        );

        return res.json({
            success: true,
            message: "Campaign successfully suspended and all contributions refunded.",
            campaign
        });
    } catch (error) {
        console.error("Error in adminSuspendRefundCampaign:", error);
        return res.json({ success: false, message: error.message });
    }
};

// POST /api/stray-crowdfunding/doctor-topup-order
export const createDoctorTopupOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount < 100) {
            return res.json({ success: false, message: "Invalid amount. Minimum top-up is ₹100" });
        }

        const options = {
            amount: Number(amount) * 100, // paise
            currency: "INR",
            receipt: `doc_wallet_${Date.now()}`
        };

        const order = await razorpayInstance.orders.create(options);

        res.json({
            success: true,
            order,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Doctor Topup Order Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/stray-crowdfunding/doctor-verify-topup
export const verifyDoctorTopupPayment = async (req, res) => {
    try {
        const doctorId = req.userId || req.body.userId; // Injected by authUserOrDoctor middleware
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            const order = await razorpayInstance.orders.fetch(razorpay_order_id);
            if (order.status === 'paid') {
                const amountAdded = order.amount / 100;

                const doctor = await doctorModel.findByIdAndUpdate(doctorId, {
                    $inc: { pawWallet: amountAdded }
                }, { new: true });

                await deleteCache(`doctor_profile_${doctorId}`);

                res.json({ 
                    success: true, 
                    message: `Successfully added ₹${amountAdded} to your Philanthropy Wallet`,
                    pawWallet: doctor.pawWallet
                });
            } else {
                res.json({ success: false, message: "Payment status is not paid" });
            }
        } else {
            res.json({ success: false, message: "Payment verification failed" });
        }

    } catch (error) {
        console.error("Doctor Verify Topup Error:", error);
        res.json({ success: false, message: error.message });
    }
};

