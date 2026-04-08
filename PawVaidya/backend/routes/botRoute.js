import express from "express";
import { queryFrontendBot } from "../controllers/frontendBotController.js";
import { queryDoctorBot } from "../controllers/doctorBotController.js";

const botRouter = express.Router();

botRouter.post("/query-frontend", queryFrontendBot);
botRouter.post("/query-doctor", queryDoctorBot);

export default botRouter;
