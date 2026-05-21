import express from 'express';
import {
    predictAnimalDisease,
    getDiseaseHistory,
    updateCaseTracking
} from '../controllers/animalDiseaseController.js';
import authuser from '../middleware/authuser.js';

const animalDiseaseRouter = express.Router();

// Gold Subscription protected endpoints
animalDiseaseRouter.post('/predict', authuser, predictAnimalDisease);
animalDiseaseRouter.get('/history', authuser, getDiseaseHistory);
animalDiseaseRouter.post('/track/:id', authuser, updateCaseTracking);

export default animalDiseaseRouter;
