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
    closeTicketByUser,
    getTicketMessages,
    sendTicketMessage,
    logCallToTimeline,
    uploadTicketChatFile,
    getAutocompleteSuggestions,
    getVetHandoffSummary,
    escalateTicket,
    getTicketSentimentAnalysis
} from '../controllers/complaintController.js';
import { authCSEmployee } from '../middleware/authCSEmployee.js';
import authUser from '../middleware/authuser.js';
import multer from 'multer';

const storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage });

const router = express.Router();

// User routes (require user token)
router.post('/create', authUser, createTicket);
router.get('/my-tickets', authUser, getMyTickets);
router.get('/ticket/:id', getTicketById); // public (user or employee can view)
router.post('/rate/:id', authUser, rateEmployee);
router.put('/user-close/:id', authUser, closeTicketByUser);

// Unified Ticket Chat / Call Routes (auth check inside controller)
router.get('/ticket/:id/messages', getTicketMessages);
router.post('/ticket/:id/messages', sendTicketMessage);
router.post('/ticket/:id/log-call', logCallToTimeline);
router.post('/ticket/:id/upload-file', upload.single('file'), uploadTicketChatFile);
router.get('/ticket/:id/autocomplete-suggestions', getAutocompleteSuggestions);
router.get('/ticket/:id/vet-handoff-summary', getVetHandoffSummary);
router.get('/ticket/:id/sentiment', getTicketSentimentAnalysis);


// CS Employee routes
router.get('/employee/requests', authCSEmployee, getIncomingRequests);
router.post('/accept', authCSEmployee, acceptTicket);
router.post('/reject', authCSEmployee, rejectTicket);
router.get('/employee/queue', authCSEmployee, getEmployeeQueue);
router.put('/update-status/:id', authCSEmployee, updateTicketStatus);
router.put('/schedule-call/:id', authCSEmployee, scheduleCall);
router.put('/close/:id', authCSEmployee, closeTicket);
router.post('/add-note/:id', authCSEmployee, addTimelineNote);
router.post('/escalate/:id', authCSEmployee, escalateTicket);

export default router;

