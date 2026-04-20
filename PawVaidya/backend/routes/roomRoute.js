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
import authuser from '../middleware/authuser.js';

const roomRouter = express.Router();

roomRouter.post('/create', authuser, createRoom);
roomRouter.get('/', getAllRooms);
roomRouter.get('/:roomId', getRoomById);
roomRouter.get('/:roomId/manage', authuser, getRoomManagementData);
roomRouter.post('/:roomId/request', authuser, requestJoinRoom);
roomRouter.post('/:roomId/approve', authuser, approveJoinRequest);
roomRouter.post('/:roomId/reject', authuser, rejectJoinRequest);
roomRouter.delete('/:roomId', authuser, deleteRoom);

export default roomRouter;
