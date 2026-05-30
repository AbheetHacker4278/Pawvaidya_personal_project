import userModel from "../../models/userModel.js";
import petModel from "../../models/petModel.js";
import appointmentModel from "../../models/appointmentModel.js";
import doctorModel from "../../models/doctorModel.js";
import subscriptionModel from "../../models/subscriptionModel.js";
import complaintTicketModel from "../../models/complaintTicketModel.js";

// ─── Tool Definitions (shown in system prompt) ───────────────────────────────
export const USER_TOOL_DESCRIPTIONS = `
Available Tools (use JSON format: {"tool": "toolName", "args": {...}}):
- getUserProfile(): Returns the logged-in user's profile details (name, email, wallet, PawPoints, subscription).
- getUserPets(): Returns a list of all pets registered by the user.
- getUpcomingAppointments(): Returns the user's upcoming (not cancelled, not completed) appointments.
- getPastAppointments(): Returns the user's last 5 completed or past appointments.
- getCancelledAppointments(): Returns the user's last 10 cancelled appointments.
- getUserSupportTickets(): Returns all support tickets/complaints raised by the user.
- searchVetsBySpeciality(speciality: string): Returns available vets filtered by speciality (e.g., "dermatologist", "surgeon", "general").
- getAvailableDoctors(): Returns a list of all currently available vets on the platform.
- checkPawPoints(): Returns the user's current PawPoints balance.
- getSubscriptionStatus(): Returns the user's active subscription plan details.
- getDashboardGuidance(): Returns navigation links and routes for all user portal pages.
- cancelAppointment(appointmentId: string): Cancels a specific appointment by its ID.
`;

// ─── Tool Implementations ─────────────────────────────────────────────────────
export const createUserToolImpls = (userId) => ({
    getUserProfile: async () => {
        const user = await userModel.findById(userId).select(
            "name email phone gender dob pawWallet pawpoints subscription isBanned address"
        );
        if (!user) return { error: "User not found" };
        return {
            name: user.name,
            email: user.email,
            phone: user.phone,
            gender: user.gender,
            dob: user.dob,
            pawWallet: user.pawWallet,
            pawpoints: user.pawpoints,
            subscription: user.subscription,
            address: user.full_address || user.address,
            isBanned: user.isBanned,
        };
    },

    getUserPets: async () => {
        const pets = await petModel.find({ ownerId: userId }).select(
            "name type breed age gender isVerified category"
        );
        if (!pets || pets.length === 0) return { message: "No pets registered yet.", pets: [] };
        return {
            count: pets.length,
            pets: pets.map(p => ({
                id: p._id,
                name: p.name,
                type: p.type,
                breed: p.breed,
                age: p.age,
                gender: p.gender,
                isVerified: p.isVerified,
                category: p.category,
            })),
        };
    },

    getUpcomingAppointments: async () => {
        const appointments = await appointmentModel
            .find({ userId, cancelled: false, isCompleted: false })
            .sort({ date: 1 })
            .limit(10);
        if (!appointments.length) return { message: "No upcoming appointments.", appointments: [] };
        return {
            count: appointments.length,
            appointments: appointments.map(a => ({
                id: a._id,
                doctor: a.docData?.name,
                speciality: a.docData?.speciality,
                date: a.slotDate,
                time: a.slotTime,
                amount: a.amount,
                isVideo: a.isVideo,
                paymentStatus: a.payment ? "Paid" : "Pending",
            })),
        };
    },

    getCancelledAppointments: async () => {
        const appointments = await appointmentModel
            .find({ userId, cancelled: true })
            .sort({ date: -1 })
            .limit(10);
        if (!appointments.length) return { message: "No cancelled appointments.", appointments: [] };
        return {
            count: appointments.length,
            appointments: appointments.map(a => ({
                id: a._id,
                doctor: a.docData?.name,
                speciality: a.docData?.speciality,
                date: a.slotDate,
                time: a.slotTime,
                amount: a.amount,
                cancelledBy: a.cancelledBy || "none",
                cancelReason: a.cancelReason || "No reason provided",
                refundStatus: a.refundStatus || "none",
                refundAmount: a.refundAmount || 0,
            })),
        };
    },

    getPastAppointments: async () => {
        const appointments = await appointmentModel
            .find({ userId, $or: [{ isCompleted: true }, { cancelled: true }] })
            .sort({ date: -1 })
            .limit(5);
        if (!appointments.length) return { message: "No past appointments found.", appointments: [] };
        return {
            count: appointments.length,
            appointments: appointments.map(a => ({
                id: a._id,
                doctor: a.docData?.name,
                speciality: a.docData?.speciality,
                date: a.slotDate,
                time: a.slotTime,
                amount: a.amount,
                status: a.cancelled ? "Cancelled" : "Completed",
                isRated: a.isRated,
            })),
        };
    },

    searchVetsBySpeciality: async ({ speciality }) => {
        if (!speciality) return { error: "Speciality is required." };
        const doctors = await doctorModel
            .find({
                speciality: { $regex: speciality, $options: "i" },
                available: true,
                isBanned: false,
            })
            .select("name speciality degree experience fees address averageRating totalRatings")
            .limit(5);
        if (!doctors.length) return { message: `No available vets found for "${speciality}".`, doctors: [] };
        return {
            count: doctors.length,
            doctors: doctors.map(d => ({
                id: d._id,
                name: d.name,
                speciality: d.speciality,
                degree: d.degree,
                experience: d.experience,
                fees: d.fees,
                rating: d.averageRating,
                totalRatings: d.totalRatings,
                location: d.full_address || d.address,
            })),
        };
    },

    getAvailableDoctors: async () => {
        const doctors = await doctorModel
            .find({ available: true, isBanned: false })
            .select("name speciality degree experience fees averageRating")
            .limit(10);
        if (!doctors.length) return { message: "No available doctors at this time.", doctors: [] };
        return {
            count: doctors.length,
            doctors: doctors.map(d => ({
                id: d._id,
                name: d.name,
                speciality: d.speciality,
                degree: d.degree,
                experience: d.experience,
                fees: d.fees,
                rating: d.averageRating,
            })),
        };
    },

    checkPawPoints: async () => {
        const user = await userModel.findById(userId).select("pawpoints pawWallet");
        if (!user) return { error: "User not found." };
        return { pawpoints: user.pawpoints, pawWallet: user.pawWallet };
    },

    getSubscriptionStatus: async () => {
        const sub = await subscriptionModel.findOne({ userId, status: "Active" }).sort({ createdAt: -1 });
        if (!sub) return { message: "No active subscription found.", plan: "Free" };
        return {
            plan: sub.plan,
            status: sub.status,
            startDate: sub.startDate,
            expiryDate: sub.expiryDate,
            isAutoRenew: sub.isAutoRenew,
        };
    },

    cancelAppointment: async ({ appointmentId }) => {
        if (!appointmentId) return { error: "appointmentId is required." };
        const appt = await appointmentModel.findOne({ _id: appointmentId, userId });
        if (!appt) return { error: "Appointment not found or doesn't belong to you." };
        if (appt.cancelled) return { error: "Appointment is already cancelled." };
        if (appt.isCompleted) return { error: "Cannot cancel a completed appointment." };

        appt.cancelled = true;
        await appt.save();
        return { success: true, message: `Appointment with Dr. ${appt.docData?.name} on ${appt.slotDate} has been cancelled.` };
    },

    getUserSupportTickets: async () => {
        const tickets = await complaintTicketModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(10);
        if (!tickets.length) return { message: "No support tickets found.", tickets: [] };
        return {
            count: tickets.length,
            tickets: tickets.map(t => ({
                id: t._id,
                category: t.category,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                isClosed: t.isClosed,
                createdAt: t.createdAt
            }))
        };
    },

    getDashboardGuidance: async () => {
        return {
            navigation: [
                { page: "Home Page", path: "/" },
                { page: "Vets / Book Appointments", path: "/doctors" },
                { page: "My Profile", path: "/my-profile" },
                { page: "My Appointments", path: "/my-appointments" },
                { page: "Live Video Streams", path: "/live-streams" },
                { page: "My Pets Manager", path: "/my-pets" },
                { page: "Community Blogs", path: "/community-blogs" },
                { page: "User / Admin Polls", path: "/polls" },
                { page: "PawWallet & Wallet Recharge", path: "/paw-wallet" },
                { page: "Premium Subscriptions", path: "/subscription" },
                { page: "Video Consultation Dashboard", path: "/video-consultation" },
                { page: "Support Center", path: "/support" },
                { page: "My Support Tickets", path: "/my-tickets" },
                { page: "Report Animal Cruelty / Abuse", path: "/report-cruelty" },
                { page: "Animal Disease / Health Predictor", path: "/disease-predictor" }
            ],
            tip: "Use this map of paths to guide the user step-by-step on where to click or navigate in the UI to find what they need."
        };
    },
});

// ─── System Prompt ────────────────────────────────────────────────────────────
export const getUserAgentSystemPrompt = () => `
You are PawBot 🐾, a warm and friendly AI assistant for PawVaidya — India's premier pet healthcare platform.
You help pet owners manage their appointments, pets, and health queries with care and empathy.

${USER_TOOL_DESCRIPTIONS}

Instructions:
1. When you need real data (appointments, pets, profile, etc.), call the appropriate tool using JSON format.
2. After getting tool results, respond in a friendly, clear, and helpful way.
3. Always address the user warmly. Use pet-friendly language and emojis occasionally.
4. If asked about symptoms or health concerns, provide general guidance and suggest consulting a vet.
5. NEVER make up appointment or pet data — always use tools.
6. If no tool is needed, respond naturally and helpfully.
7. Keep responses concise but complete.
8. If the user wants to navigate, go to, open, or view a specific page on the dashboard/platform, use the path from getDashboardGuidance() and append [NAVIGATE:path] at the very end of your message (e.g. [NAVIGATE:/my-tickets]). This will automatically route the user's browser page.
9. CRITICAL: ONLY append [NAVIGATE:...] if the user explicitly asks to navigate, open, go to, or show a page. For informational queries (such as listing or finding info, checking stats or rates), ALWAYS fetch the data using the provided tools and display it directly in the chat box. DO NOT redirect/navigate the user for informational queries.
`;
