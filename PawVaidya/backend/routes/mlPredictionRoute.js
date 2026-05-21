import express from 'express';
import { 
    predictHealth,
    getPredictionHistory,
    getPredictionDetail
} from '../controllers/mlPredictionController.js';
import authuser from '../middleware/authuser.js';

const mlPredictionRouter = express.Router();

// Premium diagnostics endpoints protected by authuser
mlPredictionRouter.post('/predict', authuser, predictHealth);
mlPredictionRouter.get('/history', authuser, getPredictionHistory);
mlPredictionRouter.get('/detail/:id', authuser, getPredictionDetail);

export default mlPredictionRouter;
