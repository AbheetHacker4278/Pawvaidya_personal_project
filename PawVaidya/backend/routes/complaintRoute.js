import express from 'express';
import {
    createTicket,
    getMyTickets,
    getTicketById,
    rateEmployee,
    getEmployeeQueue,
    updateTicketStatus,
    scheduleCall,
    closeTicket,
    addTimelineNote,
    getIncomingRequests,
    acceptTicket,
    rejectTicket,
    closeTicketByUser
} from '../controllers/complaintController.js';
import { authCSEmployee } from '../middleware/authCSEmployee.js';
import authUser from '../middleware/authuser.js';

const router = express.Router();

// User routes (require user token)
router.post('/create', authUser, createTicket);
router.get('/my-tickets', authUser, getMyTickets);
router.get('/ticket/:id', getTicketById); // public (user or employee can view)
router.post('/rate/:id', authUser, rateEmployee);
router.put('/user-close/:id', authUser, closeTicketByUser);

// CS Employee routes
router.get('/employee/requests', authCSEmployee, getIncomingRequests);
router.post('/accept', authCSEmployee, acceptTicket);
router.post('/reject', authCSEmployee, rejectTicket);
router.get('/employee/queue', authCSEmployee, getEmployeeQueue);
router.put('/update-status/:id', authCSEmployee, updateTicketStatus);
router.put('/schedule-call/:id', authCSEmployee, scheduleCall);
router.put('/close/:id', authCSEmployee, closeTicket);
router.post('/add-note/:id', authCSEmployee, addTimelineNote);

export default router;
