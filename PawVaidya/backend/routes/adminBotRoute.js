import express from "express";
import { queryAdminBot } from "../controllers/adminBotController.js";
import authAdmin from "../middleware/authAdmin.js";

const adminBotRouter = express.Router();

adminBotRouter.post("/query", authAdmin, queryAdminBot);

export default adminBotRouter;
