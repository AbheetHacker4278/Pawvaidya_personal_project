import express from 'express';
import { 
    submitUnbanRequest, 
    getAllUnbanRequests, 
    approveUnbanRequest, 
    denyUnbanRequest,
    getMyUnbanRequest
} from '../controllers/unbanRequestController.js';
import authAdmin from '../middleware/authAdmin.js';

const unbanRequestRouter = express.Router();

// User/Doctor routes
unbanRequestRouter.post('/submit', submitUnbanRequest);
unbanRequestRouter.get('/my-request/:requesterId', getMyUnbanRequest);

// Admin routes
unbanRequestRouter.get('/all', authAdmin, getAllUnbanRequests);
unbanRequestRouter.post('/approve', authAdmin, approveUnbanRequest);
unbanRequestRouter.post('/deny', authAdmin, denyUnbanRequest);

export default unbanRequestRouter;
