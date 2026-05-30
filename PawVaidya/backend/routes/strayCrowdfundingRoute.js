import express from 'express';
import {
    createCampaign,
    getNearbyCampaigns,
    getMyCampaigns,
    getCampaignDetails,
    createContributionOrder,
    verifyContributionPayment,
    createSelfContributionOrder,
    editCampaign,
    deleteCampaign,
    uploadProofInvoice,
    refundFailedCampaign,
    adminStrictAction,
    contributeViaWallet,
    adminContribute,
    adminDeleteCampaign,
    adminBoostCampaign,
    adminSendWarning,
    adminSuspendRefundCampaign,
    createDoctorTopupOrder,
    verifyDoctorTopupPayment
} from '../controllers/strayCrowdfundingController.js';
import upload from '../middleware/multer.js';
import authuser from '../middleware/authuser.js';
import authAdmin from '../middleware/authAdmin.js';
import authUserOrDoctor from '../middleware/authUserOrDoctor.js';

const strayCrowdfundingRouter = express.Router();

// Create campaign with single image upload support
strayCrowdfundingRouter.post('/create', authuser, upload.single('image'), createCampaign);

// Query active campaigns within radius (longitude, latitude parameters)
strayCrowdfundingRouter.get('/nearby', getNearbyCampaigns);

// Authenticated: get campaigns created by the logged-in user
strayCrowdfundingRouter.get('/my-campaigns', authuser, getMyCampaigns);

// Load individual details
strayCrowdfundingRouter.get('/details/:id', getCampaignDetails);

// Razorpay contribution flow
strayCrowdfundingRouter.post('/pay-order', authUserOrDoctor, createContributionOrder);
strayCrowdfundingRouter.post('/verify-payment', authUserOrDoctor, verifyContributionPayment);

// Wallet contribution flow
strayCrowdfundingRouter.post('/wallet-contribute', authUserOrDoctor, contributeViaWallet);

// Doctor Wallet Topup flow
strayCrowdfundingRouter.post('/doctor-topup-order', authUserOrDoctor, createDoctorTopupOrder);
strayCrowdfundingRouter.post('/doctor-verify-topup', authUserOrDoctor, verifyDoctorTopupPayment);

// Compulsory self-contribution order
strayCrowdfundingRouter.post('/self-pay-order', authuser, createSelfContributionOrder);

// Edit/Delete campaigns
strayCrowdfundingRouter.put('/edit/:id', authuser, upload.single('image'), editCampaign);
strayCrowdfundingRouter.delete('/delete/:id', authuser, deleteCampaign);

// Proof upload, refund and admin strict action
strayCrowdfundingRouter.post('/upload-proof/:id', authuser, upload.single('proof'), uploadProofInvoice);
strayCrowdfundingRouter.post('/refund/:id', authuser, refundFailedCampaign);
strayCrowdfundingRouter.post('/admin/strict-action/:id', authAdmin, adminStrictAction);

// Admin dedicated campaign management routes
strayCrowdfundingRouter.post('/admin/contribute', authAdmin, adminContribute);
strayCrowdfundingRouter.post('/admin/delete/:id', authAdmin, adminDeleteCampaign);
strayCrowdfundingRouter.post('/admin/boost/:id', authAdmin, adminBoostCampaign);
strayCrowdfundingRouter.post('/admin/send-warning/:id', authAdmin, adminSendWarning);
strayCrowdfundingRouter.post('/admin/suspend-refund/:id', authAdmin, adminSuspendRefundCampaign);

export default strayCrowdfundingRouter;
