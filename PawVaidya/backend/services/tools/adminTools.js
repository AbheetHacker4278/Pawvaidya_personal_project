import userModel from "../../models/userModel.js";
import doctorModel from "../../models/doctorModel.js";
import appointmentModel from "../../models/appointmentModel.js";
import ComplaintTicket from "../../models/complaintTicketModel.js";
import { transporter } from "../../config/nodemailer.js";
import VERIFICATION_EMAIL_TEMPLATE from "../../mailservice/emailtemplate2.js";

// ─── Tool Descriptions ────────────────────────────────────────────────────────
export const ADMIN_TOOL_DESCRIPTIONS = `
Available Tools (use JSON format: {"tool": "toolName", "args": {...}}):
- getSystemStats(): Returns overall platform statistics (users, doctors, appointments).
- searchUser(query: string): Searches for a user by name or email.
- searchDoctor(query: string): Searches for a doctor by name or email.
- sendVerificationEmail(email: string): Sends a verification OTP email to a user.
- getRecentAppointments(): Fetches the 5 most recent appointments.
- sendCustomEmail(recipientEmail: string, subject: string, message: string): Sends a custom email.
- getBannedUsers(): Lists all currently banned users.
- banUser(email: string, reason: string): Bans a user account.
- unbanUser(email: string): Unbans a user account.
- getOpenComplaints(): Fetches all open complaint tickets.
- getRevenueReport(): Returns a revenue summary from appointments.
- getPendingDoctors(): Lists doctors with no appointments yet (possibly pending review).
- getCsAgentCount(): Returns the count of active CS agents.
`;

// ─── Tool Implementations ─────────────────────────────────────────────────────
export const adminToolImpls = {
    getSystemStats: async () => {
        const [userCount, doctorCount, appointmentCount, complaintCount] = await Promise.all([
            userModel.countDocuments(),
            doctorModel.countDocuments(),
            appointmentModel.countDocuments(),
            ComplaintTicket.countDocuments({ status: "open" }),
        ]);
        return {
            totalUsers: userCount,
            totalDoctors: doctorCount,
            totalAppointments: appointmentCount,
            openComplaints: complaintCount,
        };
    },

    searchUser: async ({ query }) => {
        if (!query) return { error: "query is required." };
        const user = await userModel
            .findOne({ $or: [{ email: query }, { name: { $regex: query, $options: "i" } }] })
            .select("-password -plainPassword -faceDescriptor -faceImage");
        return user
            ? { success: true, user: { id: user._id, name: user.name, email: user.email, isBanned: user.isBanned, subscription: user.subscription?.plan, pawpoints: user.pawpoints, pawWallet: user.pawWallet } }
            : { success: false, message: `User "${query}" not found.` };
    },

    searchDoctor: async ({ query }) => {
        if (!query) return { error: "query is required." };
        const doctor = await doctorModel
            .findOne({ $or: [{ email: query }, { name: { $regex: query, $options: "i" } }] })
            .select("-password -plainPassword -faceDescriptor");
        return doctor
            ? { success: true, doctor: { id: doctor._id, name: doctor.name, email: doctor.email, speciality: doctor.speciality, isBanned: doctor.isBanned, available: doctor.available, averageRating: doctor.averageRating } }
            : { success: false, message: `Doctor "${query}" not found.` };
    },

    sendVerificationEmail: async ({ email }) => {
        const user = await userModel.findOne({ email });
        if (!user) return { success: false, message: `User with email ${email} not found.` };
        if (user.isAccountverified) return { success: false, message: `Account for ${email} is already verified.` };

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = otp;
        user.verifyOtpExpiredAt = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Account Verification OTP — PawVaidya",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{otp}", otp),
        });
        return { success: true, message: `Verification email sent to ${email}.` };
    },

    getRecentAppointments: async () => {
        const appointments = await appointmentModel
            .find()
            .sort({ date: -1 })
            .limit(5);
        return {
            appointments: appointments.map(a => ({
                id: a._id,
                patient: a.userData?.name,
                doctor: a.docData?.name,
                speciality: a.docData?.speciality,
                date: a.slotDate,
                time: a.slotTime,
                amount: a.amount,
                isCompleted: a.isCompleted,
                cancelled: a.cancelled,
            })),
        };
    },

    sendCustomEmail: async ({ recipientEmail, subject, message }) => {
        if (!recipientEmail || !subject || !message) return { error: "recipientEmail, subject, and message are all required." };
        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: recipientEmail,
            subject,
            html: `
                <div style="font-family:sans-serif;padding:20px;color:#333;border:1px solid #eee;border-radius:10px;">
                    <h2 style="color:#10b981;">PawVaidya Admin Update</h2>
                    <p>${message}</p>
                    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
                    <p style="font-size:12px;color:#999;">This is an automated message from the PawVaidya Admin Panel.</p>
                </div>
            `,
        });
        return { success: true, message: `Email sent to ${recipientEmail} with subject: "${subject}".` };
    },

    getBannedUsers: async () => {
        const banned = await userModel
            .find({ isBanned: true })
            .select("name email banReason bannedAt")
            .limit(20);
        if (!banned.length) return { message: "No banned users found.", users: [] };
        return { count: banned.length, users: banned.map(u => ({ name: u.name, email: u.email, reason: u.banReason, bannedAt: u.bannedAt })) };
    },

    banUser: async ({ email, reason }) => {
        if (!email) return { error: "email is required." };
        const user = await userModel.findOne({ email });
        if (!user) return { error: `User "${email}" not found.` };
        if (user.isBanned) return { error: `User "${email}" is already banned.` };

        user.isBanned = true;
        user.banReason = reason || "Banned by admin.";
        user.bannedAt = new Date();
        user.bannedBy = "Admin AI Agent";
        await user.save();
        return { success: true, message: `User "${email}" has been banned. Reason: ${reason || "Not specified"}.` };
    },

    unbanUser: async ({ email }) => {
        if (!email) return { error: "email is required." };
        const user = await userModel.findOne({ email });
        if (!user) return { error: `User "${email}" not found.` };
        if (!user.isBanned) return { error: `User "${email}" is not banned.` };

        user.isBanned = false;
        user.banReason = "";
        user.bannedAt = null;
        user.bannedBy = null;
        await user.save();
        return { success: true, message: `User "${email}" has been unbanned successfully.` };
    },

    getOpenComplaints: async () => {
        const complaints = await ComplaintTicket
            .find({ status: "open" })
            .sort({ createdAt: -1 })
            .limit(10);
        if (!complaints.length) return { message: "No open complaints.", complaints: [] };
        return {
            count: complaints.length,
            complaints: complaints.map(c => ({
                id: c._id,
                user: c.userName,
                email: c.userEmail,
                category: c.category,
                title: c.title,
                priority: c.priority,
                createdAt: c.createdAt,
            })),
        };
    },

    getRevenueReport: async () => {
        const allCompleted = await appointmentModel.find({ isCompleted: true, cancelled: false });
        const totalRevenue = allCompleted.reduce((sum, a) => sum + (a.amount || 0), 0);

        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const monthlyAppts = allCompleted.filter(a => a.date >= thisMonthStart);
        const monthlyRevenue = monthlyAppts.reduce((sum, a) => sum + (a.amount || 0), 0);

        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        const lastMonthEnd = thisMonthStart;
        const lastMonthAppts = allCompleted.filter(a => a.date >= lastMonthStart && a.date < lastMonthEnd);
        const lastMonthRevenue = lastMonthAppts.reduce((sum, a) => sum + (a.amount || 0), 0);

        return {
            totalRevenue,
            totalCompletedAppointments: allCompleted.length,
            thisMonth: { revenue: monthlyRevenue, appointments: monthlyAppts.length },
            lastMonth: { revenue: lastMonthRevenue, appointments: lastMonthAppts.length },
        };
    },

    getPendingDoctors: async () => {
        // Doctors who have 0 completed appointments (new / inactive)
        const completedDocIds = await appointmentModel.distinct("docId", { isCompleted: true });
        const newDoctors = await doctorModel
            .find({ _id: { $nin: completedDocIds } })
            .select("name email speciality available date")
            .sort({ date: -1 })
            .limit(10);
        if (!newDoctors.length) return { message: "All doctors have completed at least one appointment.", doctors: [] };
        return {
            count: newDoctors.length,
            doctors: newDoctors.map(d => ({ id: d._id, name: d.name, email: d.email, speciality: d.speciality, available: d.available })),
        };
    },

    getCsAgentCount: async () => {
        try {
            // Dynamic import to avoid circular dependency if csEmployee model unavailable
            const { default: csEmployeeModel } = await import("../../models/csEmployeeModel.js");
            const [total, active] = await Promise.all([
                csEmployeeModel.countDocuments(),
                csEmployeeModel.countDocuments({ status: 'active' }),
            ]);
            return { totalCsAgents: total, activeAgents: active };
        } catch {
            return { message: "CS Agent data not available." };
        }
    },
};

// ─── System Prompt ────────────────────────────────────────────────────────────
export const getAdminAgentSystemPrompt = () => `
You are AdminBot ⚙️, a powerful AI assistant for PawVaidya platform administrators.
You help admins manage the platform: users, doctors, revenue, complaints, and communications.

${ADMIN_TOOL_DESCRIPTIONS}

Instructions:
1. When you need real data, call the appropriate tool using the JSON format shown.
2. After getting tool results, provide a clear and professional summary.
3. For destructive actions (ban, email), always confirm what was done clearly.
4. Be efficient and direct — admins are busy.
5. NEVER make up data — always use tools for real information.
6. If no tool is needed, respond naturally and helpfully.
`;
