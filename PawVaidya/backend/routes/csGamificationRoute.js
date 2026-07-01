import express from 'express';
import { 
    getLeaderboard, 
    getEmployeePerformance, 
    submitQAScore, 
    recalculateAllXP,
    getRaceArena,
    awardReward,
    detectFraud,
    getMentorshipMatrix
} from '../controllers/csGamificationController.js';
import { authCSEmployee } from '../middleware/authCSEmployee.js';
import authAdmin from '../middleware/authAdmin.js';

const gamificationRouter = express.Router();

// Public/Agent Routes
gamificationRouter.get('/leaderboard', getLeaderboard);
gamificationRouter.get('/performance/:employeeId', authCSEmployee, getEmployeePerformance);

// Admin/Race Routes
gamificationRouter.get('/race-arena', authAdmin, getRaceArena);
gamificationRouter.post('/award-reward', authAdmin, awardReward);
gamificationRouter.post('/qa-score', authAdmin, submitQAScore);
gamificationRouter.post('/recalculate-all', authAdmin, recalculateAllXP);
gamificationRouter.get('/fraud-detection', authAdmin, detectFraud);
gamificationRouter.get('/mentorship-matrix', authAdmin, getMentorshipMatrix);

export default gamificationRouter;

