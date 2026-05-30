import express from 'express';
import {
    uploadVaccineRecord,
    listVaccineRecords,
    toggleReminders,
    deleteVaccineRecord
} from '../controllers/vaccineRecordController.js';
import upload from '../middleware/multer.js';
import authuser from '../middleware/authuser.js';

const vaccineRecordRouter = express.Router();

// Upload endpoint with Multer parser for single file 'document'
vaccineRecordRouter.post('/upload', authuser, upload.single('document'), uploadVaccineRecord);
vaccineRecordRouter.get('/list', authuser, listVaccineRecords);
vaccineRecordRouter.post('/toggle-reminders/:id', authuser, toggleReminders);
vaccineRecordRouter.delete('/:id', authuser, deleteVaccineRecord);

export default vaccineRecordRouter;
