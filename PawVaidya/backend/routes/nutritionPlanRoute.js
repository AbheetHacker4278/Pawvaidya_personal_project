import express from 'express';
import {
    generateNutritionPlan,
    getNutritionPlanHistory,
    deleteNutritionPlan
} from '../controllers/nutritionPlanController.js';
import authuser from '../middleware/authuser.js';

const nutritionPlanRouter = express.Router();

nutritionPlanRouter.post('/generate', authuser, generateNutritionPlan);
nutritionPlanRouter.get('/history', authuser, getNutritionPlanHistory);
nutritionPlanRouter.delete('/:id', authuser, deleteNutritionPlan);

export default nutritionPlanRouter;
