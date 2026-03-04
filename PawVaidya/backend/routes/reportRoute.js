import express from 'express';
import multer from 'multer';
import {
    submitReport,
    uploadEvidence,
    getAllReports,
    getReportById,
    updateReportStatus,
    banUser,
    unbanUser,
    banDoctor,
    unbanDoctor,
    getMyReports,
    getReportsAgainstMe,
    getReportStatistics,
    markReportsAsRead,
    moveReportsToTrash,
    deleteReports,
    getTrashedReports,
    restoreReports,
    deletePostByAdmin
} from '../controllers/reportController.js';
import authAdmin from '../middleware/authAdmin.js';
import authUser from '../middleware/authUser.js';
import { authDoctor } from '../middleware/authDoctor.js';

const reportRouter = express.Router();

// Multer configuration for evidence upload
const storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Public routes (User/Doctor can submit reports)
reportRouter.post('/submit', submitReport);
reportRouter.post('/upload-evidence', upload.single('evidence'), uploadEvidence);

// User/Doctor routes (requires authentication)
reportRouter.get('/my-reports', getMyReports);
reportRouter.get('/against-me', getReportsAgainstMe);

// Admin routes (requires admin authentication)
// IMPORTANT: Specific routes must come BEFORE parameterized routes like /:reportId
reportRouter.get('/all', authAdmin, getAllReports);
reportRouter.get('/statistics/overview', authAdmin, getReportStatistics);
reportRouter.get('/trash-view', authAdmin, getTrashedReports);
reportRouter.put('/update-status', authAdmin, updateReportStatus);

// Ban/Unban routes (Admin only)
reportRouter.post('/ban-user', authAdmin, banUser);
reportRouter.post('/unban-user', authAdmin, unbanUser);
reportRouter.post('/ban-doctor', authAdmin, banDoctor);
reportRouter.post('/unban-doctor', authAdmin, unbanDoctor);

// Report management routes (Admin only)
reportRouter.post('/mark-read', authAdmin, markReportsAsRead);
reportRouter.post('/trash', authAdmin, moveReportsToTrash);
reportRouter.post('/delete', authAdmin, deleteReports);
reportRouter.post('/restore', authAdmin, restoreReports);
reportRouter.post('/delete-post', authAdmin, deletePostByAdmin);

// Parameterized route - MUST be last to avoid catching specific routes
reportRouter.get('/:reportId', authAdmin, getReportById);

export default reportRouter;
