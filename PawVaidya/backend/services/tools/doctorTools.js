import doctorModel from "../../models/doctorModel.js";
import appointmentModel from "../../models/appointmentModel.js";
import petModel from "../../models/petModel.js";

// ─── Tool Descriptions ────────────────────────────────────────────────────────
export const DOCTOR_TOOL_DESCRIPTIONS = `
Available Tools (use JSON format: {"tool": "toolName", "args": {...}}):
- getDoctorProfile(): Returns this doctor's own profile (name, speciality, fees, rating, etc.).
- getTodaysAppointments(): Returns all appointments scheduled for today.
- getUpcomingAppointments(): Returns the next 10 upcoming (not completed, not cancelled) appointments.
- getPatientHistory(patientName: string): Looks up appointment history for a patient by name.
- getDoctorEarnings(): Returns a summary of earnings from completed appointments.
- getSchedule(): Returns the doctor's current slot booking status.
- markAppointmentComplete(appointmentId: string): Marks an appointment as completed.
- getPetDetailsForAppointment(appointmentId: string): Gets the pet details linked to an appointment.
`;

// ─── Tool Implementations ─────────────────────────────────────────────────────
export const createDoctorToolImpls = (docId) => ({
    getDoctorProfile: async () => {
        const doc = await doctorModel
            .findById(docId)
            .select("name email speciality degree experience fees available averageRating totalRatings about full_address");
        if (!doc) return { error: "Doctor not found." };
        return {
            name: doc.name,
            email: doc.email,
            speciality: doc.speciality,
            degree: doc.degree,
            experience: doc.experience,
            fees: doc.fees,
            available: doc.available,
            averageRating: doc.averageRating,
            totalRatings: doc.totalRatings,
            about: doc.about,
            address: doc.full_address,
        };
    },

    getTodaysAppointments: async () => {
        const today = new Date();
        const todayStr = `${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}`;
        const appointments = await appointmentModel
            .find({ docId, slotDate: todayStr, cancelled: false })
            .sort({ slotTime: 1 });
        if (!appointments.length) return { message: "No appointments scheduled for today.", appointments: [] };
        return {
            count: appointments.length,
            date: todayStr,
            appointments: appointments.map(a => ({
                id: a._id,
                patient: a.userData?.name,
                patientEmail: a.userData?.email,
                time: a.slotTime,
                isCompleted: a.isCompleted,
                isVideo: a.isVideo,
                payment: a.payment,
                amount: a.amount,
            })),
        };
    },

    getUpcomingAppointments: async () => {
        const now = Date.now();
        const appointments = await appointmentModel
            .find({ docId, cancelled: false, isCompleted: false, date: { $gte: now } })
            .sort({ date: 1 })
            .limit(10);
        if (!appointments.length) return { message: "No upcoming appointments.", appointments: [] };
        return {
            count: appointments.length,
            appointments: appointments.map(a => ({
                id: a._id,
                patient: a.userData?.name,
                date: a.slotDate,
                time: a.slotTime,
                isVideo: a.isVideo,
                amount: a.amount,
            })),
        };
    },

    getPatientHistory: async ({ patientName }) => {
        if (!patientName) return { error: "patientName is required." };
        const appointments = await appointmentModel
            .find({
                docId,
                "userData.name": { $regex: patientName, $options: "i" },
            })
            .sort({ date: -1 })
            .limit(10);
        if (!appointments.length) return { message: `No history found for patient "${patientName}".`, appointments: [] };
        return {
            patient: patientName,
            count: appointments.length,
            appointments: appointments.map(a => ({
                id: a._id,
                date: a.slotDate,
                time: a.slotTime,
                isCompleted: a.isCompleted,
                cancelled: a.cancelled,
                isRated: a.isRated,
                rating: a.rating,
                amount: a.amount,
            })),
        };
    },

    getDoctorEarnings: async () => {
        const completed = await appointmentModel.find({
            docId,
            isCompleted: true,
            cancelled: false,
        });
        const totalEarnings = completed.reduce((sum, a) => sum + (a.amount || 0), 0);
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        const monthlyCompleted = completed.filter(a => a.date >= thisMonth.getTime());
        const monthlyEarnings = monthlyCompleted.reduce((sum, a) => sum + (a.amount || 0), 0);
        return {
            totalAppointmentsCompleted: completed.length,
            totalEarnings,
            thisMonthAppointments: monthlyCompleted.length,
            thisMonthEarnings: monthlyEarnings,
        };
    },

    getSchedule: async () => {
        const doc = await doctorModel.findById(docId).select("slots_booked available");
        if (!doc) return { error: "Doctor not found." };
        const slotsBooked = doc.slots_booked || {};
        const totalSlots = Object.values(slotsBooked).reduce((sum, slots) => sum + slots.length, 0);
        return {
            available: doc.available,
            totalBookedSlots: totalSlots,
            slotsBreakdown: Object.fromEntries(
                Object.entries(slotsBooked).map(([date, slots]) => [date, slots.length])
            ),
        };
    },

    markAppointmentComplete: async ({ appointmentId }) => {
        if (!appointmentId) return { error: "appointmentId is required." };
        const appt = await appointmentModel.findOne({ _id: appointmentId, docId });
        if (!appt) return { error: "Appointment not found or doesn't belong to you." };
        if (appt.isCompleted) return { error: "Appointment is already marked as completed." };
        if (appt.cancelled) return { error: "Cannot complete a cancelled appointment." };

        appt.isCompleted = true;
        await appt.save();
        return { success: true, message: `Appointment for ${appt.userData?.name} on ${appt.slotDate} at ${appt.slotTime} marked as complete.` };
    },

    getPetDetailsForAppointment: async ({ appointmentId }) => {
        if (!appointmentId) return { error: "appointmentId is required." };
        const appt = await appointmentModel.findOne({ _id: appointmentId, docId });
        if (!appt) return { error: "Appointment not found." };

        if (appt.isStray) {
            return { petType: "Stray", details: appt.strayDetails };
        }

        if (!appt.petId) return { message: "No pet linked to this appointment.", patient: appt.userData?.name };

        const pet = await petModel.findById(appt.petId).select("name type breed age gender isVerified");
        if (!pet) return { message: "Pet record not found.", appointmentId };
        return {
            name: pet.name,
            type: pet.type,
            breed: pet.breed,
            age: pet.age,
            gender: pet.gender,
            isVerified: pet.isVerified,
        };
    },
});

// ─── System Prompt ────────────────────────────────────────────────────────────
export const getDoctorAgentSystemPrompt = () => `
You are MedBot 🩺, a professional AI assistant for PawVaidya veterinary doctors.
You help veterinarians manage their appointments, patient records, and daily workflow efficiently.

${DOCTOR_TOOL_DESCRIPTIONS}

Instructions:
1. When you need real data, call the appropriate tool using JSON format.
2. After getting tool results, respond clearly and professionally.
3. Maintain a clinical, professional tone — you're assisting a licensed veterinarian.
4. For medical queries, provide helpful professional guidance.
5. NEVER fabricate patient or appointment data — always use tools.
6. Keep responses concise and action-oriented for a busy doctor.
`;
