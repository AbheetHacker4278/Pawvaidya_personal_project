import { runAgentLoop } from "../services/agentOrchestrator.js";
import { createUserToolImpls, getUserAgentSystemPrompt } from "../services/tools/userTools.js";

/**
 * User Agent — Agentic chatbot for pet owners.
 * Requires authUser middleware → req.body.userId must be set.
 */
export const queryFrontendBot = async (req, res) => {
    try {
        const { message, history } = req.body;
        const userId = req.body.userId;
        const token = req.headers.token;

        if (!message) return res.status(400).json({ success: false, message: "Message is required." });

        const systemPrompt = getUserAgentSystemPrompt();
        const toolImpls = userId ? createUserToolImpls(userId) : {};

        const response = await runAgentLoop({
            systemPrompt,
            toolImpls,
            userMessage: message,
            history: history || [],
            maxIterations: 5,
        });

        res.json({ success: true, response });
    } catch (error) {
        console.error("User Agent Error:", error.response?.data || error.message);
        const detail = error.response?.data?.detail || error.response?.data?.message || error.message;
        res.status(500).json({
            success: false,
            message: `PawBot is currently unavailable. Please try again shortly. (${detail})`,
        });
    }
};
