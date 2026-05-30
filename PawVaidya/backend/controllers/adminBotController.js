import { runAgentLoop } from "../services/agentOrchestrator.js";
import { adminToolImpls, getAdminAgentSystemPrompt } from "../services/tools/adminTools.js";
import { logActivity } from "../utils/activityLogger.js";

/**
 * Admin Agent — Powerful agentic assistant for platform administrators.
 * Handles user management, revenue, complaints, emails, and more.
 */
export const queryAdminBot = async (req, res) => {
    try {
        const { message, history } = req.body;
        const adminId = req.admin?.id || "master";

        if (!message) return res.status(400).json({ success: false, message: "Message is required." });

        const systemPrompt = getAdminAgentSystemPrompt();

        // Wrap tool impls with activity logging for sensitive actions
        const toolImplsWithLogging = {
            ...adminToolImpls,
            banUser: async (args) => {
                const result = await adminToolImpls.banUser(args);
                if (result.success) {
                    await logActivity(adminId, "admin", "bot_action", `Bot banned user: ${args.email}. Reason: ${args.reason}`, req).catch(() => {});
                }
                return result;
            },
            unbanUser: async (args) => {
                const result = await adminToolImpls.unbanUser(args);
                if (result.success) {
                    await logActivity(adminId, "admin", "bot_action", `Bot unbanned user: ${args.email}`, req).catch(() => {});
                }
                return result;
            },
            sendVerificationEmail: async (args) => {
                const result = await adminToolImpls.sendVerificationEmail(args);
                if (result.success) {
                    await logActivity(adminId, "admin", "bot_action", `Bot sent verification email to: ${args.email}`, req).catch(() => {});
                }
                return result;
            },
            sendCustomEmail: async (args) => {
                const result = await adminToolImpls.sendCustomEmail(args);
                if (result.success) {
                    await logActivity(adminId, "admin", "bot_action", `Bot sent custom email to: ${args.recipientEmail}`, req).catch(() => {});
                }
                return result;
            },
            banIp: async (args) => {
                const result = await adminToolImpls.banIp(args);
                if (result.success) {
                    await logActivity(adminId, "admin", "bot_action", `Bot banned IP: ${args.ip}. Reason: ${args.reason}`, req).catch(() => {});
                }
                return result;
            },
            unbanIp: async (args) => {
                const result = await adminToolImpls.unbanIp(args);
                if (result.success) {
                    await logActivity(adminId, "admin", "bot_action", `Bot unbanned IP: ${args.ip}`, req).catch(() => {});
                }
                return result;
            },
            resolveSecurityIncident: async (args) => {
                const result = await adminToolImpls.resolveSecurityIncident(args);
                if (result.success) {
                    await logActivity(adminId, "admin", "bot_action", `Bot resolved security incident ID: ${args.incidentId}`, req).catch(() => {});
                }
                return result;
            },
            updateSystemSettings: async (args) => {
                const result = await adminToolImpls.updateSystemSettings(args);
                if (result.success) {
                    await logActivity(adminId, "admin", "bot_action", `Bot updated system settings: ${JSON.stringify(args)}`, req).catch(() => {});
                }
                return result;
            },
        };

        const response = await runAgentLoop({
            systemPrompt,
            toolImpls: toolImplsWithLogging,
            userMessage: message,
            history: history || [],
            maxIterations: 5,
            temperature: 0.1, // Lower temp for precise admin actions
        });

        res.json({ success: true, response });
    } catch (error) {
        console.error("Admin Agent Error:", error.response?.data || error.message);
        const detail = error.response?.data?.detail || error.response?.data?.message || error.message;
        res.json({ success: false, message: `AdminBot is currently unavailable. (${detail})` });
    }
};
