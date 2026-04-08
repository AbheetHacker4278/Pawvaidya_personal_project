import express from "express";
import { queryFrontendBot } from "../controllers/frontendBotController.js";

const botRouter = express.Router();

botRouter.post("/query-frontend", queryFrontendBot);

export default botRouter;
