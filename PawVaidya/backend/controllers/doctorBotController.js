import { runAgentLoop } from "../services/agentOrchestrator.js";
import { createDoctorToolImpls, getDoctorAgentSystemPrompt } from "../services/tools/doctorTools.js";

/**
 * Doctor Agent — Agentic assistant for veterinary doctors.
 * Accessible by Doctors (via dtoken) or Admins (via atoken/custom systemPrompt).
 */
export const queryDoctorBot = async (req, res) => {
    try {
        const { message, history, systemPrompt: customSystemPrompt } = req.body;
        const docId = req.body.docId;

        if (!message) return res.status(400).json({ success: false, message: "Message is required." });

        const systemPrompt = customSystemPrompt || getDoctorAgentSystemPrompt();
        const toolImpls = docId ? createDoctorToolImpls(docId) : {};

        const response = await runAgentLoop({
            systemPrompt,
            toolImpls,
            userMessage: message,
            history: history || [],
            maxIterations: 5,
            maxTokens: 1024,
        });

        res.json({ success: true, response });
    } catch (error) {
        console.error("Doctor Agent Error:", error.response?.data || error.message);
        const detail = error.response?.data?.detail || error.response?.data?.message || error.message;
        res.status(500).json({
            success: false,
            message: `MedBot is currently unavailable. Please try again shortly. (${detail})`,
        });
    }
};
