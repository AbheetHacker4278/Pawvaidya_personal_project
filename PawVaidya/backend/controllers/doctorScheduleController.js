import doctorScheduleModel from '../models/doctorScheduleModel.js';
import doctorModel from '../models/doctorModel.js';

// Add or update doctor schedule for a specific day
export const addOrUpdateSchedule = async (req, res) => {
    try {
        const { docId, dayOfWeek, startTime, endTime, slotDuration } = req.body;

        // Validate required fields
        if (!docId || !dayOfWeek || !startTime || !endTime) {
            return res.json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Verify doctor exists
        const doctor = await doctorModel.findById(docId);
        if (!doctor) {
            return res.json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            return res.json({
                success: false,
                message: 'Invalid time format. Use HH:MM format'
            });
        }

        // Check if end time is after start time
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (endMinutes <= startMinutes) {
            return res.json({
                success: false,
                message: 'End time must be after start time'
            });
        }

        // Check if schedule already exists for this doctor and day
        const existingSchedule = await doctorScheduleModel.findOne({ 
            doctorId: docId, 
            dayOfWeek 
        });

        if (existingSchedule) {
            // Update existing schedule
            existingSchedule.startTime = startTime;
            existingSchedule.endTime = endTime;
            existingSchedule.slotDuration = slotDuration || 30;
            existingSchedule.updatedAt = Date.now();
            await existingSchedule.save();

            return res.json({
                success: true,
                message: 'Schedule updated successfully',
                schedule: existingSchedule
            });
        } else {
            // Create new schedule
            const newSchedule = new doctorScheduleModel({
                doctorId: docId,
                dayOfWeek,
                startTime,
                endTime,
                slotDuration: slotDuration || 30,
                isActive: true
            });

            await newSchedule.save();

            return res.json({
                success: true,
                message: 'Schedule added successfully',
                schedule: newSchedule
            });
        }
    } catch (error) {
        console.error('Error adding/updating schedule:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Get all schedules for a doctor
export const getDoctorSchedules = async (req, res) => {
    try {
        const { docId } = req.body;

        if (!docId) {
            return res.json({
                success: false,
                message: 'Doctor ID is required'
            });
        }

        const schedules = await doctorScheduleModel.find({ 
            doctorId: docId 
        }).sort({ dayOfWeek: 1 });

        return res.json({
            success: true,
            schedules
        });
    } catch (error) {
        console.error('Error fetching schedules:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Get schedules for a specific doctor (public - for users booking appointments)
export const getPublicDoctorSchedules = async (req, res) => {
    try {
        const { docId } = req.params;

        if (!docId) {
            return res.json({
                success: false,
                message: 'Doctor ID is required'
            });
        }

        const schedules = await doctorScheduleModel.find({ 
            doctorId: docId,
            isActive: true 
        }).sort({ dayOfWeek: 1 });

        return res.json({
            success: true,
            schedules
        });
    } catch (error) {
        console.error('Error fetching public schedules:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Delete a schedule
export const deleteSchedule = async (req, res) => {
    try {
        const { scheduleId, docId } = req.body;

        if (!scheduleId || !docId) {
            return res.json({
                success: false,
                message: 'Schedule ID and Doctor ID are required'
            });
        }

        const schedule = await doctorScheduleModel.findOne({ 
            _id: scheduleId, 
            doctorId: docId 
        });

        if (!schedule) {
            return res.json({
                success: false,
                message: 'Schedule not found or unauthorized'
            });
        }

        await doctorScheduleModel.findByIdAndDelete(scheduleId);

        return res.json({
            success: true,
            message: 'Schedule deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Toggle schedule active status
export const toggleScheduleStatus = async (req, res) => {
    try {
        const { scheduleId, docId } = req.body;

        if (!scheduleId || !docId) {
            return res.json({
                success: false,
                message: 'Schedule ID and Doctor ID are required'
            });
        }

        const schedule = await doctorScheduleModel.findOne({ 
            _id: scheduleId, 
            doctorId: docId 
        });

        if (!schedule) {
            return res.json({
                success: false,
                message: 'Schedule not found or unauthorized'
            });
        }

        schedule.isActive = !schedule.isActive;
        schedule.updatedAt = Date.now();
        await schedule.save();

        return res.json({
            success: true,
            message: `Schedule ${schedule.isActive ? 'activated' : 'deactivated'} successfully`,
            schedule
        });
    } catch (error) {
        console.error('Error toggling schedule status:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Get available time slots for a specific date based on doctor's schedule
export const getAvailableSlots = async (req, res) => {
    try {
        const { docId, date } = req.query;

        if (!docId || !date) {
            return res.json({
                success: false,
                message: 'Doctor ID and date are required'
            });
        }

        // Parse the date and get day of week
        const selectedDate = new Date(date);
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = daysOfWeek[selectedDate.getDay()];

        // Get doctor's schedule for this day
        const schedule = await doctorScheduleModel.findOne({
            doctorId: docId,
            dayOfWeek,
            isActive: true
        });

        if (!schedule) {
            return res.json({
                success: true,
                slots: [],
                message: 'No schedule available for this day'
            });
        }

        // Get doctor's booked slots
        const doctor = await doctorModel.findById(docId);
        if (!doctor) {
            return res.json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Generate time slots based on schedule
        const slots = [];
        const [startHour, startMin] = schedule.startTime.split(':').map(Number);
        const [endHour, endMin] = schedule.endTime.split(':').map(Number);
        
        let currentTime = new Date(selectedDate);
        currentTime.setHours(startHour, startMin, 0, 0);
        
        const endTime = new Date(selectedDate);
        endTime.setHours(endHour, endMin, 0, 0);

        // Format date for checking booked slots
        const day = selectedDate.getDate();
        const month = selectedDate.getMonth() + 1;
        const year = selectedDate.getFullYear();
        const slotDate = `${day}_${month}_${year}`;

        const bookedSlots = doctor.slots_booked[slotDate] || [];

        while (currentTime < endTime) {
            const timeString = currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });

            const isBooked = bookedSlots.includes(timeString);
            
            slots.push({
                time: timeString,
                available: !isBooked
            });

            currentTime.setMinutes(currentTime.getMinutes() + schedule.slotDuration);
        }

        return res.json({
            success: true,
            slots,
            schedule: {
                dayOfWeek,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                slotDuration: schedule.slotDuration
            }
        });
    } catch (error) {
        console.error('Error getting available slots:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};
