import express from "express";
import {
    getSubscriptionPlans,
    createSubscriptionOrder,
    verifySubscriptionPayment,
    subscribeViaWallet,
    getSubscriptionStatus
} from "../controllers/subscriptionController.js";
import authuser from "../middleware/authuser.js";

const subscriptionRouter = express.Router();

subscriptionRouter.get("/plans", getSubscriptionPlans);
subscriptionRouter.get("/status/:userId", authuser, getSubscriptionStatus);
subscriptionRouter.post("/create-order", authuser, createSubscriptionOrder);
subscriptionRouter.post("/verify-payment", authuser, verifySubscriptionPayment);
subscriptionRouter.post("/wallet-subscribe", authuser, subscribeViaWallet);

export default subscriptionRouter;
