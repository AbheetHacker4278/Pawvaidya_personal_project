import userModel from "../../models/userModel.js";
import doctorModel from "../../models/doctorModel.js";
import appointmentModel from "../../models/appointmentModel.js";
import ComplaintTicket from "../../models/complaintTicketModel.js";
import systemConfigModel from "../../models/systemConfigModel.js";
import bannedIpModel from "../../models/bannedIpModel.js";
import securityIncidentModel from "../../models/securityIncidentModel.js";
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
- listCsAgents(limit: number): Returns a list of customer support agents.
- searchCsAgent(query: string): Searches for a CS agent by name or email.
- getDashboardGuidance(): Returns navigation links and routes for all admin portal pages.
- getSystemSettings(): Returns current system settings (maintenanceMode, killSwitch, etc.).
- updateSystemSettings(maintenanceMode: boolean, killSwitch: boolean, maintenanceMessage: string, defaultCommissionPercentage: number): Updates system settings.
- getBannedIps(): Returns all currently banned IP addresses.
- banIp(ip: string, reason: string): Bans an IP address.
- unbanIp(ip: string): Unbans an IP address.
- getSecurityIncidents(): Lists all security incidents logged on the platform.
- resolveSecurityIncident(incidentId: string): Marks a specific security incident as resolved.
- getTopUsersByWallet(limit: number): Returns the top users sorted by wallet balance descending.
- getTopUsersByPawpoints(limit: number): Returns the top users sorted by paw points descending.
- getUsersBySubscription(plan: string): Returns users who have a specific subscription plan ('Silver', 'Gold', 'Platinum').
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

    listCsAgents: async ({ limit }) => {
        try {
            const { default: csEmployeeModel } = await import("../../models/csEmployeeModel.js");
            const agents = await csEmployeeModel
                .find({})
                .select("name email phone status averageRating level rank isOnline")
                .limit(limit || 20);
            return { success: true, count: agents.length, agents };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    searchCsAgent: async ({ query }) => {
        try {
            if (!query) return { error: "query is required." };
            const { default: csEmployeeModel } = await import("../../models/csEmployeeModel.js");
            const agent = await csEmployeeModel
                .findOne({ $or: [{ email: query }, { name: { $regex: query, $options: "i" } }] })
                .select("name email phone status averageRating level rank isOnline");
            return agent 
                ? { success: true, agent } 
                : { success: false, message: `CS Agent "${query}" not found.` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getDashboardGuidance: async () => {
        return {
            navigation: [
                { page: "Admin Dashboard", path: "/admin-dashboard" },
                { page: "Manage Admins", path: "/manage-admins" },
                { page: "All Appointments", path: "/all-appointments" },
                { page: "Add Doctor", path: "/add-doctor" },
                { page: "Doctors List", path: "/doctor-list" },
                { page: "Total Registered Users", path: "/total-users" },
                { page: "Payment Details", path: "/payment-details" },
                { page: "All Subscriptions", path: "/all-subscriptions" },
                { page: "Emergency Dashboard", path: "/emergency-dashboard" },
                { page: "Admin Messages / Group Chat", path: "/admin-messages" },
                { page: "All Incident Reports", path: "/all-reports" },
                { page: "User Unban Requests", path: "/unban-requests" },
                { page: "Account Deletion Requests", path: "/deletion-requests" },
                { page: "Trash / Deleted Reports", path: "/trash" },
                { page: "System Logs & Audit Trail", path: "/admin-logs" },
                { page: "Admin Profile Settings", path: "/admin-profile" },
                { page: "Admin Live Video Streams", path: "/admin-live-streams" },
                { page: "Broadcast Email Utility", path: "/broadcast-email" },
                { page: "Doctor Rankings / Performance", path: "/doctor-rankings" },
                { page: "Doctor Attendance Records", path: "/doctor-attendance" },
                { page: "Media Registry", path: "/media-registry" },
                { page: "App Issue Reports", path: "/app-issue-reports" },
                { page: "IP & Domain Blacklist", path: "/blacklist-management" },
                { page: "Manage Coupons", path: "/manage-coupons" },
                { page: "Admin & User Polls", path: "/polls" },
                { page: "Security Threat Monitoring", path: "/security-monitoring" },
                { page: "Render Deployments status", path: "/admin-deployments" },
                { page: "Redis Monitoring & Cache status", path: "/redis-monitoring" },
                { page: "Financial / Accounting CS", path: "/financial-calculations" },
                { page: "CS Employees Management", path: "/cs-employees" },
                { page: "CS Support Tickets", path: "/cs-tickets" },
                { page: "CS Performance Reports", path: "/cs-reports" },
                { page: "User Misbehavior Reports", path: "/misbehavior-reports" },
                { page: "Animal Cruelty Reports", path: "/cruelty-reports" }
            ],
            tip: "Use this map of paths to guide the admin step-by-step or to trigger automatic navigation."
        };
    },
    getSystemSettings: async () => {
        try {
            const config = await systemConfigModel.findOne({}) || {
                maintenanceMode: false,
                killSwitch: false,
                maintenanceMessage: "System is currently under maintenance. Please try again later.",
                commissionRules: { defaultPercentage: 20 }
            };
            return { success: true, config };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    updateSystemSettings: async ({ maintenanceMode, killSwitch, maintenanceMessage, defaultCommissionPercentage }) => {
        try {
            let config = await systemConfigModel.findOne({});
            if (!config) {
                config = new systemConfigModel();
            }
            if (maintenanceMode !== undefined) config.maintenanceMode = maintenanceMode;
            if (killSwitch !== undefined) config.killSwitch = killSwitch;
            if (maintenanceMessage !== undefined) config.maintenanceMessage = maintenanceMessage;
            if (defaultCommissionPercentage !== undefined) {
                if (!config.commissionRules) config.commissionRules = { defaultPercentage: 20 };
                config.commissionRules.defaultPercentage = defaultCommissionPercentage;
            }
            config.lastUpdatedBy = 'admin_bot';
            config.updatedAt = new Date();
            await config.save();
            return { success: true, message: "System settings updated successfully.", config };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    getBannedIps: async () => {
        try {
            const bannedIps = await bannedIpModel.find({ isActive: true }).sort({ createdAt: -1 });
            return { success: true, bannedIps };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    banIp: async ({ ip, reason }) => {
        try {
            const record = await bannedIpModel.findOneAndUpdate(
                { ip },
                { reason, isActive: true, bannedAt: new Date() },
                { upsert: true, new: true }
            );
            return { success: true, message: `IP Address ${ip} has been banned.`, record };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    unbanIp: async ({ ip }) => {
        try {
            const record = await bannedIpModel.findOneAndUpdate(
                { ip },
                { isActive: false, unbannedAt: new Date() },
                { new: true }
            );
            if (!record) return { success: false, message: `IP Address ${ip} not found in banned list.` };
            return { success: true, message: `IP Address ${ip} has been unbanned.`, record };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    getSecurityIncidents: async () => {
        try {
            const incidents = await securityIncidentModel.find({}).sort({ createdAt: -1 }).limit(50);
            return { success: true, incidents };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    resolveSecurityIncident: async ({ incidentId }) => {
        try {
            const record = await securityIncidentModel.findByIdAndUpdate(
                incidentId,
                { status: 'resolved', resolvedAt: new Date() },
                { new: true }
            );
            if (!record) return { success: false, message: "Security incident not found." };
            return { success: true, message: "Security incident resolved.", record };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    getTopUsersByWallet: async ({ limit }) => {
        try {
            const users = await userModel
                .find({})
                .sort({ pawWallet: -1 })
                .limit(limit || 5)
                .select("name email pawWallet pawpoints isBanned");
            return { success: true, users };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    getTopUsersByPawpoints: async ({ limit }) => {
        try {
            const users = await userModel
                .find({})
                .sort({ pawpoints: -1 })
                .limit(limit || 5)
                .select("name email pawWallet pawpoints isBanned");
            return { success: true, users };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    getUsersBySubscription: async ({ plan }) => {
        try {
            const users = await userModel
                .find({ "subscription.plan": plan })
                .limit(20)
                .select("name email subscription pawWallet pawpoints");
            return { success: true, count: users.length, users };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
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
7. If the admin wants to navigate, open, go to, or view a specific admin dashboard/platform page, use the path from getDashboardGuidance() and append [NAVIGATE:path] at the very end of your message (e.g. [NAVIGATE:/all-appointments]). This will automatically route the admin's browser page.
8. CRITICAL: ONLY append [NAVIGATE:...] if the user explicitly asks to navigate, open, go to, or show a page. For informational queries (such as listing users, finding the richest user, or checking statistics), ALWAYS fetch the data using the provided tools and display it directly in the chat box. DO NOT redirect/navigate the user for informational queries.
9. Whenever the admin asks any question related to a specific admin category or sidebar page/module (e.g. Subscriptions, Users, Financials, CS Agents/Tickets, Security, Doctors, etc.), you MUST append a section listing all related available questions/actions that you can answer or perform within that module. List them clearly under a "💡 Related Actions/Questions" header at the very end of your response as bullet points. 
For example:
- If the question is about Subscriptions: list options like 'net profit', 'loss / cancelled subscriptions', 'recent subscriptions', 'list users with Platinum plan', 'change subscription plan'.
- If the question is about Financials: list options like 'net profit from appointments', 'total revenue report', 'refund details', 'recent transactions'.
- If the question is about CS Agents/Support Service: list options like 'CS agent list', 'online agents count', 'QA scores of agents', 'Shift logs', 'average rating of agents'.
- If the question is about Doctors: list options like 'doctor specialities', 'top rated doctors', 'recent doctor onboardings', 'appointment slots availability'.
- If the question is about Users: list options like 'richest user by wallet balance', 'users with highest paw points', 'banned users list', 'recent signups'.
Ensure this suggestion behavior works dynamically for all sidebar sections: Dashboard, Financials, Manage Admins, Appointments, Doctors/Doctor List, Total Users, Payment Details, Subscriptions, Emergency Panel, Media Registry, Blacklist, Coupons, Polls, Security Monitor, Messages, Broadcast Email, Reports, App Issues, Unban Requests, Deletion Requests, CS Agents, CS Tickets, Complaints, Cruelty Reports, CS Reports, Activity Logs.
`;
