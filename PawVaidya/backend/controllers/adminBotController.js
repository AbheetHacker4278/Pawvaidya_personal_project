import { GoogleGenerativeAI } from "@google/generative-ai";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { transporter } from "../config/nodemailer.js";
import VERIFICATION_EMAIL_TEMPLATE from "../mailservice/emailtemplate2.js";
import { logActivity } from "../utils/activityLogger.js";

// Initialize Gemini
// We'll use VITE_API_KEY_GEMINI_2 if possible, or GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_API_KEY_GEMINI_2);

// Define tools (functions) for the AI
const tools = [
    {
        name: "getSystemStats",
        description: "Returns overall system statistics including total users, doctors, and appointments.",
        parameters: {
            type: "OBJECT",
            properties: {},
        },
    },
    {
        name: "searchUser",
        description: "Search for a user by their name or email address to get their details.",
        parameters: {
            type: "OBJECT",
            properties: {
                query: {
                    type: "STRING",
                    description: "The name or email of the user to search for.",
                },
            },
            required: ["query"],
        },
    },
    {
        name: "sendVerificationEmail",
        description: "Sends a verification OTP email to a user by their email address.",
        parameters: {
            type: "OBJECT",
            properties: {
                email: {
                    type: "STRING",
                    description: "The email address of the user.",
                },
            },
            required: ["email"],
        },
    },
    {
        name: "getRecentAppointments",
        description: "Fetches the most recent 5 appointments scheduled on the platform.",
        parameters: {
            type: "OBJECT",
            properties: {},
        },
    },
    {
        name: "sendCustomEmail",
        description: "Sends a custom email with a specific subject and message to any email address.",
        parameters: {
            type: "OBJECT",
            properties: {
                recipientEmail: {
                    type: "STRING",
                    description: "The email address of the recipient.",
                },
                subject: {
                    type: "STRING",
                    description: "The subject line of the email.",
                },
                message: {
                    type: "STRING",
                    description: "The main body content of the email (plaintext or basic HTML).",
                },
            },
            required: ["recipientEmail", "subject", "message"],
        },
    },
];

// Tool Implementation Logic
const toolImplementations = {
    getSystemStats: async () => {
        const [userCount, doctorCount, appointmentCount] = await Promise.all([
            userModel.countDocuments(),
            doctorModel.countDocuments(),
            appointmentModel.countDocuments(),
        ]);
        return {
            totalUsers: userCount,
            totalDoctors: doctorCount,
            totalAppointments: appointmentCount,
        };
    },
    searchUser: async ({ query }) => {
        const user = await userModel.findOne({
            $or: [
                { email: query },
                { name: { $regex: query, $options: "i" } },
            ],
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

export const queryAdminBot = async (req, res) => {
    try {
        const { message, history } = req.body;
        const adminId = req.admin?.id || "master";

        if (!process.env.GEMINI_API_KEY && !process.env.VITE_API_KEY_GEMINI_2) {
            return res.json({ success: false, message: "Gemini API Key is missing in .env" });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            tools: [{ functionDeclarations: tools }],
        });

        const chat = model.startChat({
            history: (history || []).filter((m, i) => !(i === 0 && m.role !== 'user')),
        });

        let result = await chat.sendMessage(message);
        let response = result.response;

        // Check if parts exist and contains functionCall
        let call = response.candidates[0].content.parts.find(p => p.functionCall);

        while (call) {
            const { name, args } = call.functionCall;
            console.log(`AI invoking tool: ${name} with args:`, args);

            const toolResult = await toolImplementations[name](args);

            // Log the action if it's sensitive
            if (name === "sendVerificationEmail" || name === "sendCustomEmail") {
                await logActivity(adminId, "admin", "bot_action", `Bot performed: ${name} for ${args.email || args.recipientEmail}`, req);
            }

            result = await chat.sendMessage([
                {
                    functionResponse: {
                        name,
                        response: { result: toolResult },
                    },
                },
            ]);
            response = result.response;
            call = response.candidates[0].content.parts.find(p => p.functionCall);
        }

        const finalResponse = response.text();
        res.json({ success: true, response: finalResponse });

    } catch (error) {
        console.error("AdminBot Error:", error);
        res.json({ success: false, message: "AI Assistant is currently unavailable. " + error.message });
    }
};
