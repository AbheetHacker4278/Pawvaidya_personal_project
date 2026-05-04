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
    deleteCSDocument
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

// Protected routes (require cstoken)
router.post('/complete-profile', authCSEmployee, completeProfile);
router.post('/update-profile', authCSEmployee, upload.single('image'), updateCSProfile);
router.post('/re-register-face', authCSEmployee, reRegisterFace);
router.post('/upload-document', authCSEmployee, upload.single('docFile'), uploadCSDocument);
router.post('/delete-document', authCSEmployee, deleteCSDocument);
router.get('/profile', authCSEmployee, getCSProfile);

// DigiLocker routes (protected)
router.post('/digilocker/initiate', authCSEmployee, initiateDigilockerLink);
router.post('/digilocker/callback', authCSEmployee, digilockerCallback);
router.post('/digilocker/fetch-documents', authCSEmployee, fetchDigilockerDocuments);
router.post('/digilocker/unlink', authCSEmployee, unlinkDigilocker);
router.get('/digilocker/status', authCSEmployee, getDigilockerStatus);

export default router;

