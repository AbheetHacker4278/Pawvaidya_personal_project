import express from 'express';
import {
    csLogin,
    faceRegister,
    faceVerify,
    completeProfile,
    getCSProfile,
    getPublicCSProfile,
    updateCSProfile,
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
    revokeSubscription,
    grantSubscription
} from '../controllers/csAuthController.js';
import {
    initiateDigilockerLink,
    digilockerCallback,
    fetchDigilockerDocuments,
    unlinkDigilocker,
    getDigilockerStatus
} from '../controllers/digilockerController.js';
import { authCSEmployee } from '../middleware/authCSEmployee.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// Public auth routes
router.post('/login', csLogin);
router.post('/face-register', faceRegister);
router.post('/face-verify', faceVerify);
router.post('/logout', authCSEmployee, csLogout);
router.get('/public-profile/:id', getPublicCSProfile);

// Temporary developer tools to bypass face recognition/retrieve active testing agent & user profiles
router.get('/dev-list', async (req, res) => {
    try {
        const CSEmployee = (await import('../models/csEmployeeModel.js')).default;
        const userModel = (await import('../models/userModel.js')).default;
        const employees = await CSEmployee.find({});
        const users = await userModel.find({});
        res.json({
            success: true,
            employees: employees.map(e => ({ name: e.name, email: e.email, status: e.status, faceVerified: e.faceVerified })),
            users: users.map(u => ({ name: u.name, email: u.email, plan: u.subscription?.plan }))
        });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

router.get('/dev-login/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const CSEmployee = (await import('../models/csEmployeeModel.js')).default;
        const employee = await CSEmployee.findOne({ email });
        if (!employee) return res.json({ success: false, error: 'Agent not found.' });

        const jwt = (await import('jsonwebtoken')).default;
        const token = jwt.sign({ id: employee._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            token,
            employee: { name: employee.name, email: employee.email }
        });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// Protected routes (require cstoken)
router.post('/complete-profile', authCSEmployee, completeProfile);
router.post('/update-profile', authCSEmployee, upload.single('image'), updateCSProfile);
router.post('/re-register-face', authCSEmployee, reRegisterFace);
router.post('/upload-document', authCSEmployee, upload.single('docFile'), uploadCSDocument);
router.post('/delete-document', authCSEmployee, deleteCSDocument);
router.post('/log-break', authCSEmployee, logBreak);
router.post('/verify-face-session', authCSEmployee, verifyFaceSession);
router.get('/profile', authCSEmployee, getCSProfile);

// Shift management routes
router.post('/shift/early-logout', authCSEmployee, earlyLogout);
router.post('/shift/sync', authCSEmployee, syncShift);
router.post('/shift/complete', authCSEmployee, completeShift);
router.get('/shift/status', authCSEmployee, getShiftStatus);

// Customer 360 & Refunds
router.get('/user-360/:email', authCSEmployee, getUser360);
router.post('/refund', authCSEmployee, issueRefund);
router.post('/revoke-subscription', authCSEmployee, revokeSubscription);
router.post('/grant-subscription', authCSEmployee, grantSubscription);

// DigiLocker routes (protected)
router.post('/digilocker/initiate', authCSEmployee, initiateDigilockerLink);
router.post('/digilocker/callback', authCSEmployee, digilockerCallback);
router.post('/digilocker/fetch-documents', authCSEmployee, fetchDigilockerDocuments);
router.post('/digilocker/unlink', authCSEmployee, unlinkDigilocker);
router.get('/digilocker/status', authCSEmployee, getDigilockerStatus);

export default router;

