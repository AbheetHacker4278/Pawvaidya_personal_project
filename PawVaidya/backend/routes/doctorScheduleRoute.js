import express from 'express';
import { 
    addOrUpdateSchedule, 
    getDoctorSchedules, 
    getPublicDoctorSchedules,
    deleteSchedule, 
    toggleScheduleStatus,
    getAvailableSlots
} from '../controllers/doctorScheduleController.js';
import { authDoctor } from '../middleware/authDoctor.js';

const doctorScheduleRouter = express.Router();

// Doctor routes (protected)
doctorScheduleRouter.post('/add-update', authDoctor, addOrUpdateSchedule);
doctorScheduleRouter.post('/get-schedules', authDoctor, getDoctorSchedules);
doctorScheduleRouter.post('/delete', authDoctor, deleteSchedule);
doctorScheduleRouter.post('/toggle-status', authDoctor, toggleScheduleStatus);

// Public routes (for users booking appointments)
doctorScheduleRouter.get('/public/:docId', getPublicDoctorSchedules);
doctorScheduleRouter.get('/available-slots', getAvailableSlots);

export default doctorScheduleRouter;
