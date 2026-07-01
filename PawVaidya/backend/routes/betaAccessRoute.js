import express from 'express';
import authuser from '../middleware/authuser.js';
import authAdmin from '../middleware/authAdmin.js';
import {
    // Feature Management (Admin)
    createBetaFeature,
    getAllBetaFeatures,
    updateBetaFeature,
    deleteBetaFeature,
    // Public / User
    getActiveBetaFeatures,
    getMyBetaApplications,
    applyForBetaAccess,
    checkBetaAccess,
    // Admin — Applications
    getAllBetaApplications,
    approveBetaApplication,
    rejectBetaApplication,
    getBetaStats
} from '../controllers/betaAccessController.js';

const betaRouter = express.Router();

// ── Public: Users can browse active beta features (no auth needed)
betaRouter.get('/features', getActiveBetaFeatures);

// ── Authenticated User Routes
betaRouter.get('/my-applications', authuser, getMyBetaApplications);
betaRouter.post('/apply', authuser, applyForBetaAccess);
betaRouter.get('/check/:slug', authuser, checkBetaAccess);

// ── Admin — Feature Management
betaRouter.post('/features', authAdmin, createBetaFeature);
betaRouter.get('/features/all', authAdmin, getAllBetaFeatures);
betaRouter.put('/features/:featureId', authAdmin, updateBetaFeature);
betaRouter.delete('/features/:featureId', authAdmin, deleteBetaFeature);

// ── Admin — Application Management
betaRouter.get('/applications', authAdmin, getAllBetaApplications);
betaRouter.post('/applications/approve', authAdmin, approveBetaApplication);
betaRouter.post('/applications/reject', authAdmin, rejectBetaApplication);
betaRouter.get('/stats', authAdmin, getBetaStats);

export default betaRouter;
