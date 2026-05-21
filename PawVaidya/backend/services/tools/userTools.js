import userModel from "../../models/userModel.js";
import petModel from "../../models/petModel.js";
import appointmentModel from "../../models/appointmentModel.js";
import doctorModel from "../../models/doctorModel.js";
import subscriptionModel from "../../models/subscriptionModel.js";

// ─── Tool Definitions (shown in system prompt) ───────────────────────────────
export const USER_TOOL_DESCRIPTIONS = `
Available Tools (use JSON format: {"tool": "toolName", "args": {...}}):
- getUserProfile(): Returns the logged-in user's profile details (name, email, wallet, PawPoints, subscription).
- getUserPets(): Returns a list of all pets registered by the user.
- getUpcomingAppointments(): Returns the user's upcoming (not cancelled, not completed) appointments.
- getPastAppointments(): Returns the user's last 5 completed or past appointments.
- searchVetsBySpeciality(speciality: string): Returns available vets filtered by speciality (e.g., "dermatologist", "surgeon", "general").
- getAvailableDoctors(): Returns a list of all currently available vets on the platform.
- checkPawPoints(): Returns the user's current PawPoints balance.
- getSubscriptionStatus(): Returns the user's active subscription plan details.
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
        const now = Date.now();
        const appointments = await appointmentModel
            .find({ userId, cancelled: false, isCompleted: false, date: { $gte: now } })
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
`;
