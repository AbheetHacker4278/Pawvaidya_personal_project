import express from 'express';
import { banUser, unbanUser, getBanStatus } from '../controllers/banController.js';
import authAdmin  from '../middleware/authAdmin.js';
import { authCSEmployee } from '../middleware/authCSEmployee.js';

const router = express.Router();

// Middleware to allow either Admin or CS Employee
const authAdminOrCS = (req, res, next) => {
    const { token, cstoken } = req.headers;
    if (token) {
        return authAdmin(req, res, next);
    } else if (cstoken) {
        return authCSEmployee(req, res, next);
    } else {
        return res.json({ success: false, message: 'Not authorized' });
    }
};

// Ban a user or doctor
router.post('/ban', authAdminOrCS, banUser);

// Unban a user or doctor
router.post('/unban', authAdminOrCS, unbanUser);

// Get ban status
router.get('/status', authAdminOrCS, getBanStatus);

export default router;