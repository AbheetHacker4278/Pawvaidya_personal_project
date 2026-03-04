import express from 'express';
import { banUser, unbanUser, getBanStatus } from '../controllers/banController.js';
import authAdmin  from '../middleware/authAdmin.js';

const router = express.Router();

// Ban a user or doctor
router.post('/ban', authAdmin, banUser);

// Unban a user or doctor
router.post('/unban', authAdmin, unbanUser);

// Get ban status
router.get('/status', authAdmin, getBanStatus);

export default router;