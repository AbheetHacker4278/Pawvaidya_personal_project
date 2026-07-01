import express from 'express';
import {
    loginDriver,
    getDriverProfile,
    uploadProfilePhoto,
    uploadDriverDocuments,
    updateDriverLocation,
    updateDriverStatus,
    getDriverAssignedBooking,
    updateBookingStatus,
    submitAppeal,
    registerFace,
    verifyFace
} from '../controllers/driverController.js';
import authDriver from '../middleware/authDriver.js';
import upload from '../middleware/multer.js';

const driverRouter = express.Router();

driverRouter.post('/login', loginDriver);
driverRouter.get('/profile', authDriver, getDriverProfile);
driverRouter.post('/upload-profile-photo', authDriver, uploadProfilePhoto);
driverRouter.post('/upload-documents', authDriver, upload.fields([
    { name: 'drivingLicence', maxCount: 1 },
    { name: 'govPhotoId', maxCount: 1 }
]), uploadDriverDocuments);
driverRouter.post('/update-location', authDriver, updateDriverLocation);
driverRouter.post('/update-status', authDriver, updateDriverStatus);
driverRouter.get('/assigned-booking', authDriver, getDriverAssignedBooking);
driverRouter.post('/booking-status', authDriver, updateBookingStatus);
driverRouter.post('/submit-appeal', authDriver, submitAppeal);
driverRouter.post('/register-face', authDriver, registerFace);
driverRouter.post('/verify-face', authDriver, verifyFace);

export default driverRouter;
