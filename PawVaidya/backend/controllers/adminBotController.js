import axios from "axios";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { transporter } from "../config/nodemailer.js";
import VERIFICATION_EMAIL_TEMPLATE from "../mailservice/emailtemplate2.js";
import { logActivity } from "../utils/activityLogger.js";

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

// Standardize tools for OpenAI/NVIDIA API
const tools = [
    {
        type: "function",
        function: {
            name: "getSystemStats",
            description: "Returns overall system statistics including total users, doctors, and appointments.",
            parameters: {
                type: "object",
                properties: {},
                required: [],
            },
        }
    },
    {
        type: "function",
        function: {
            name: "searchUser",
            description: "Search for a user by their name or email address to get their details.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The name or email of the user to search for.",
                    },
                },
                required: ["query"],
            },
        }
    },
    {
        type: "function",
        function: {
            name: "sendVerificationEmail",
            description: "Sends a verification OTP email to a user by their email address.",
            parameters: {
                type: "object",
                properties: {
                    email: {
                        type: "string",
                        description: "The email address of the user.",
                    },
                },
                required: ["email"],
            },
        }
    },
    {
        type: "function",
        function: {
            name: "getRecentAppointments",
            description: "Fetches the most recent 5 appointments scheduled on the platform.",
            parameters: {
                type: "object",
                properties: {},
                required: [],
            },
        }
    },
    {
        type: "function",
        function: {
            name: "sendCustomEmail",
            description: "Sends a custom email with a specific subject and message to any email address.",
            parameters: {
                type: "object",
                properties: {
                    recipientEmail: {
                        type: "string",
                        description: "The email address of the recipient.",
                    },
                    subject: {
                        type: "string",
                        description: "The subject line of the email.",
                    },
                    message: {
                        type: "string",
                        description: "The main body content of the email (plaintext or basic HTML).",
                    },
                },
                required: ["recipientEmail", "subject", "message"],
            },
        }
    },
];

const toolImplementations = {
    getSystemStats: async () => {
        const [userCount, doctorCount, appointmentCount] = await Promise.all([
            userModel.countDocuments(),
            doctorModel.countDocuments(),
            appointmentModel.countDocuments(),
        ]);
        return { totalUsers: userCount, totalDoctors: doctorCount, totalAppointments: appointmentCount };
    },
    searchUser: async ({ query }) => {
        const user = await userModel.findOne({
            $or: [{ email: query }, { name: { $regex: query, $options: "i" } }],
        }).select("-password -plainPassword");
        return user ? { success: true, user } : { success: false, message: `User ${query} not found` };
    },
    sendVerificationEmail: async ({ email }) => {
        const user = await userModel.findOne({ email });
        if (!user) return { success: false, message: `User with email ${email} not found` };
        if (user.isAccountverified) return { success: false, message: `Account for ${email} is already verified` };

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = otp;
        user.verifyOtpExpiredAt = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Account Verification OTP",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{otp}", otp),
        };
        await transporter.sendMail(mailOptions);
        return { success: true, message: `Verification email sent successfully to ${email}` };
    },
    getRecentAppointments: async () => {
        const appointments = await appointmentModel.find()
            .sort({ date: -1 })
            .limit(5)
            .populate("userId", "name email")
            .populate("docId", "name speciality");
        return { appointments };
    },
    sendCustomEmail: async ({ recipientEmail, subject, message }) => {
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: recipientEmail,
            subject: subject,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #10b981;">PawVaidya Admin Update</h2>
                    <p>${message}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999;">This is an automated message from the PawVaidya Admin Panel.</p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        return { success: true, message: `Custom email sent to ${recipientEmail} with subject: ${subject}` };
    },
};

const SYSTEM_PROMPT = `You are the PawVaidya Admin Assistant. You help administrators manage the platform.
You have access to the following tools. If you need to use a tool, you MUST output a JSON object in your response using this EXACT format:
{"tool": "toolName", "args": {"arg1": "value1"}}

Available Tools:
- getSystemStats(): Returns total users, doctors, and appointments.
- searchUser(query: string): Searches for a user by name or email.
- sendVerificationEmail(email: string): Sends verification OTP to a user.
- getRecentAppointments(): Fetches the 5 most recent appointments.
- sendCustomEmail(recipientEmail: string, subject: string, message: string): Sends a customized email.

Instructions:
1. If the user asks for information that requires a tool, call the tool first.
2. After receiving tool results, provide a clear and helpful summary to the admin.
3. If no tool is needed, respond naturally.
4. ONLY use the tools listed above.`;

export const queryAdminBot = async (req, res) => {
    try {
        const { message, history } = req.body;
        const adminId = req.admin?.id || "master";
        const apiKey = process.env.NVIDIA_NIM_API_KEY;

        if (!apiKey) {
            return res.json({ success: false, message: "NVIDIA NIM API Key is missing in .env" });
        }

        // Prepare messages for NVIDIA API with strict alternation
        let apiMessages = [{ role: 'system', content: SYSTEM_PROMPT }];

        const chatHistory = (history || []).map(m => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.parts[0].text
        }));

        // Skip initial assistant greeting if present to start with User
        if (chatHistory.length > 0 && chatHistory[0].role === 'assistant') {
            chatHistory.shift();
        }

        apiMessages.push(...chatHistory);
        apiMessages.push({ role: 'user', content: message });

        const headers = {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        };

        const payload = {
            model: "google/gemma-3-27b-it",
            messages: apiMessages,
            max_tokens: 1024,
            temperature: 0.1, // Lower temperature for more reliable JSON
            top_p: 0.7
        };

        console.log("NVIDIA Admin Bot Request (Prompt-based):", message);

        let response = await axios.post(NVIDIA_API_URL, payload, { headers });
        let aiResponse = response.data.choices[0].message.content;

        // Tool calling loop (max 3 iterations to prevent loops)
        let iterations = 0;
        while (iterations < 3) {
            let toolCallMatch = null;
            try {
                // Try to find JSON in the response
                const jsonMatch = aiResponse.match(/\{[\s\S]*?"tool"[\s\S]*?\}/);
                if (jsonMatch) {
                    toolCallMatch = JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.log("No valid JSON tool call found in AI response.");
            }

            if (!toolCallMatch || !toolImplementations[toolCallMatch.tool]) break;

            const { tool, args } = toolCallMatch;
            console.log(`Executing Prompt-Tool: ${tool} with args:`, args);

            const result = await toolImplementations[tool](args);

            if (tool === "sendVerificationEmail" || tool === "sendCustomEmail") {
                await logActivity(adminId, "admin", "bot_action", `Bot performed: ${tool} for ${args.email || args.recipientEmail}`, req);
            }

            // Feed the result back to the model
            apiMessages.push({ role: 'assistant', content: aiResponse });
            apiMessages.push({ role: 'user', content: `Tool Result from ${tool}: ${JSON.stringify(result)}` });

            response = await axios.post(NVIDIA_API_URL, { ...payload, messages: apiMessages }, { headers });
            aiResponse = response.data.choices[0].message.content;
            iterations++;
        }

        res.json({ success: true, response: aiResponse });

    } catch (error) {
        console.error("AdminBot Error:", error.response?.data || error.message);
        const detail = error.response?.data?.detail || error.response?.data?.message || error.message;
        res.json({ success: false, message: `AI Assistant is currently unavailable. (${detail})` });
    }
};
