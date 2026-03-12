import express from 'express';
import { getServiceStatus, getServiceLogs, getServiceMetrics } from '../controllers/renderController.js';
import authAdmin from '../middleware/authAdmin.js';

const renderRouter = express.Router();

renderRouter.get('/:serviceType/status', authAdmin, getServiceStatus);
renderRouter.get('/:serviceType/logs/:deployId', authAdmin, getServiceLogs);
renderRouter.get('/:serviceType/metrics', authAdmin, getServiceMetrics);

export default renderRouter;
