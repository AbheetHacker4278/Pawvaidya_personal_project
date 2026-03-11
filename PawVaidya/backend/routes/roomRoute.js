import express from 'express';
import {
    createRoom,
    getAllRooms,
    getRoomById,
    requestJoinRoom,
    approveJoinRequest,
    rejectJoinRequest,
    getRoomManagementData,
    deleteRoom
} from '../controllers/roomController.js';
import authUser from '../middleware/authUser.js';

const roomRouter = express.Router();

roomRouter.post('/create', authUser, createRoom);
roomRouter.get('/', getAllRooms);
roomRouter.get('/:roomId', getRoomById);
roomRouter.get('/:roomId/manage', authUser, getRoomManagementData);
roomRouter.post('/:roomId/request', authUser, requestJoinRoom);
roomRouter.post('/:roomId/approve', authUser, approveJoinRequest);
roomRouter.post('/:roomId/reject', authUser, rejectJoinRequest);
roomRouter.delete('/:roomId', authUser, deleteRoom);

export default roomRouter;
