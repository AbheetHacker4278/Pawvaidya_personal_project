import express from "express";
import { queryFrontendBot } from "../controllers/frontendBotController.js";
import { queryDoctorBot } from "../controllers/doctorBotController.js";
import optionalAuthUser from "../middleware/optionalAuthUser.js";
import authDoctorOrAdmin from "../middleware/authDoctorOrAdmin.js";

const botRouter = express.Router();

// User Agent — optional authentication so guests can use the bot too
botRouter.post("/query-frontend", optionalAuthUser, queryFrontendBot);

// Doctor Agent — hybrid authentication so both doctors and admins can query
botRouter.post("/query-doctor", authDoctorOrAdmin, queryDoctorBot);

export default botRouter;
