import express from "express";
import {
    getSubscriptionPlans,
    createSubscriptionOrder,
    verifySubscriptionPayment,
    subscribeViaWallet,
    getSubscriptionStatus
} from "../controllers/subscriptionController.js";
import authUser from "../middleware/authUser.js";

const subscriptionRouter = express.Router();

subscriptionRouter.get("/plans", getSubscriptionPlans);
subscriptionRouter.get("/status/:userId", authUser, getSubscriptionStatus);
subscriptionRouter.post("/create-order", authUser, createSubscriptionOrder);
subscriptionRouter.post("/verify-payment", authUser, verifySubscriptionPayment);
subscriptionRouter.post("/wallet-subscribe", authUser, subscribeViaWallet);

export default subscriptionRouter;
