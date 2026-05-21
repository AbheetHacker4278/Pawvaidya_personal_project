import express from 'express';
import { getLeaderboard, getEmployeePerformance, submitQAScore, recalculateAllXP } from '../controllers/csGamificationController.js';
import { authCSEmployee } from '../middleware/authCSEmployee.js';
import authAdmin from '../middleware/authAdmin.js';

const gamificationRouter = express.Router();

// Public/Agent Routes
gamificationRouter.get('/leaderboard', getLeaderboard);
gamificationRouter.get('/performance/:employeeId', authCSEmployee, getEmployeePerformance);

// Admin Routes
gamificationRouter.post('/qa-score', authAdmin, submitQAScore);
gamificationRouter.post('/recalculate-all', authAdmin, recalculateAllXP);

export default gamificationRouter;
