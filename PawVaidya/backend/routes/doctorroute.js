import express from 'express';
import { appointmentCancel, appointmentComplete, appointmentsDoctor, doctorDashboard, doctorProfile, doctorslist, logindoctor, updateDoctorProfile, logoutdoctor, getDoctorMessages, markDoctorMessageAsRead, getDoctorById, updateDoctorLocation, createReminder, getDoctorReminders, updateReminder, deleteReminder, getDailyEarnings, createDiscount, getDoctorDiscounts, updateDiscount, deleteDiscount, getPublicDoctorDiscounts, registerFaceDr, clockInDr, checkAttendanceStatus, changeavailablity } from '../controllers/doctorController.js';
import { createDoctorBlog, getDoctorBlogs, updateDoctorBlog, deleteDoctorBlog, getAllBlogsForDoctor, toggleLikeBlog, addCommentToBlog, incrementBlogView, getBlogDetails } from '../controllers/doctorBlogController.js';
import { authDoctor } from '../middleware/authDoctor.js';
import upload from '../middleware/multer.js';

export const doctorrouter = express.Router()

doctorrouter.get('/list', doctorslist)
doctorrouter.post('/login', logindoctor)
doctorrouter.post('/logout', authDoctor, logoutdoctor)
doctorrouter.get('/appointments', authDoctor, appointmentsDoctor)
doctorrouter.post('/complete-appointment', authDoctor, appointmentComplete)
doctorrouter.post('/cancel-appointment', authDoctor, appointmentCancel)
doctorrouter.get('/dashboard', authDoctor, doctorDashboard)
doctorrouter.get('/profile', authDoctor, doctorProfile)
doctorrouter.post('/update-profile', upload.single('image'), authDoctor, updateDoctorProfile)
doctorrouter.post('/location', authDoctor, updateDoctorLocation)

// Doctor messages routes
doctorrouter.post('/messages', authDoctor, getDoctorMessages)
doctorrouter.post('/messages/read', authDoctor, markDoctorMessageAsRead)

// Get doctor by ID (for admin)
doctorrouter.get('/profile/:doctorId', getDoctorById)

// Doctor blog routes
doctorrouter.post('/blogs/create', upload.fields([{ name: 'images', maxCount: 5 }, { name: 'videos', maxCount: 2 }]), authDoctor, createDoctorBlog)
doctorrouter.post('/blogs/my-blogs', authDoctor, getDoctorBlogs)
doctorrouter.post('/blogs/update', upload.fields([{ name: 'images', maxCount: 5 }, { name: 'videos', maxCount: 2 }]), authDoctor, updateDoctorBlog)
doctorrouter.post('/blogs/delete', authDoctor, deleteDoctorBlog)
doctorrouter.get('/blogs/community', authDoctor, getAllBlogsForDoctor)
doctorrouter.post('/blogs/like', authDoctor, toggleLikeBlog)
doctorrouter.post('/blogs/comment', authDoctor, addCommentToBlog)
doctorrouter.post('/blogs/view', authDoctor, incrementBlogView)
doctorrouter.get('/blogs/:blogId', authDoctor, getBlogDetails)

// Reminder routes
doctorrouter.post('/reminders/create', authDoctor, createReminder)
doctorrouter.post('/reminders', authDoctor, getDoctorReminders)
doctorrouter.post('/reminders/update', authDoctor, updateReminder)
doctorrouter.post('/reminders/delete', authDoctor, deleteReminder)

// Calendar earnings route
doctorrouter.post('/earnings/daily', authDoctor, getDailyEarnings)

// Discount management routes
doctorrouter.post('/discounts/create', authDoctor, createDiscount)
doctorrouter.post('/discounts', authDoctor, getDoctorDiscounts)
doctorrouter.post('/discounts/update', authDoctor, updateDiscount)
doctorrouter.post('/discounts/delete', authDoctor, deleteDiscount)

// Attendance routes
doctorrouter.post('/register-face', authDoctor, registerFaceDr)
doctorrouter.post('/clock-in', authDoctor, clockInDr)
doctorrouter.post('/attendance-status', authDoctor, checkAttendanceStatus)
doctorrouter.post('/change-availability', authDoctor, changeavailablity)

// Public route — active coupons for a doctor (no auth, for frontend display)
doctorrouter.get('/discounts/public/:docId', getPublicDoctorDiscounts)

export default doctorrouter