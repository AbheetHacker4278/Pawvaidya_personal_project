import express from 'express';

import { registeruser, loginUser, getprofile, updateprofile, bookappointment, verifyRazorpay, listAppointment, cancelAppointment, sendVerifyOtp, verifyEmail, isAuthenticated, sendResetOtp, resetpassword, getuserdata, logout, getUserMessages, markMessageAsRead, getUserById, updateUserLocation, validateDiscount, rateDoctor, requestAccountDeletion, registerFace, loginFace } from '../controllers/userController.js';
import { validateAdminCoupon, getActiveAdminCoupons } from '../controllers/couponController.js';
import { getNearbyDoctors } from '../controllers/doctorController.js';
import { createBlog, getAllBlogs, getBlogById, updateBlog, deleteBlog, toggleLike, addComment, deleteComment, getUserBlogs } from '../controllers/blogController.js';
import { getActivePolls, voteInPoll } from '../controllers/pollController.js';
import authuser from '../middleware/authuser.js';
import upload from '../middleware/multer.js';
import { uploadBlogFiles } from '../middleware/multerBlogs.js';
import securityMonitor from '../middleware/securityMonitor.js';

export const userRouter = express.Router()

userRouter.post('/register', registeruser)
userRouter.post('/login', loginUser)
userRouter.post('/logout', logout)
userRouter.get('/get-profile', authuser, getprofile)
userRouter.post('/update-profile', upload.single('image'), authuser, securityMonitor, updateprofile)
userRouter.post('/book-appointment', authuser, bookappointment)
userRouter.post('/verify-razorpay', authuser, verifyRazorpay)
userRouter.get("/appointments", authuser, listAppointment)
userRouter.post("/cancel-appointment", authuser, cancelAppointment)
userRouter.post("/send-verify-otp", authuser, sendVerifyOtp)
userRouter.post("/verify-account", authuser, verifyEmail)
userRouter.get("/is-auth", authuser, isAuthenticated)
userRouter.post('/register-face', authuser, registerFace)
userRouter.post('/login-face', loginFace)
userRouter.post("/send-reset-otp", sendResetOtp)
userRouter.post("/reset-password", resetpassword)
userRouter.get("/data", authuser, getuserdata)
userRouter.get("/profile/:userId", getUserById)
userRouter.post("/location", authuser, updateUserLocation)
userRouter.post("/nearby-doctors", authuser, getNearbyDoctors)
userRouter.post("/validate-discount", authuser, validateDiscount)
userRouter.post("/validate-admin-coupon", authuser, validateAdminCoupon)
userRouter.get("/admin-coupons", authuser, getActiveAdminCoupons)

// Blog routes
userRouter.post('/blogs/create', authuser, uploadBlogFiles, securityMonitor, createBlog)
userRouter.get('/blogs', getAllBlogs)
userRouter.get('/blogs/:blogId', getBlogById)
userRouter.put('/blogs/:blogId', authuser, uploadBlogFiles, securityMonitor, updateBlog)
userRouter.delete('/blogs/:blogId', authuser, deleteBlog)
userRouter.post('/blogs/:blogId/like', authuser, toggleLike)
userRouter.post('/blogs/:blogId/comment', authuser, addComment)
userRouter.delete('/blogs/:blogId/comments/:commentId', authuser, deleteComment)
userRouter.get('/blogs/user/:userId', getUserBlogs)

// User messages routes
userRouter.get('/messages', authuser, getUserMessages)
userRouter.post('/messages/read', authuser, markMessageAsRead)

// Rating routes
userRouter.post('/rate-doctor', authuser, rateDoctor)

// Account Deletion route
userRouter.post('/request-deletion', authuser, requestAccountDeletion)

// Poll routes
userRouter.get('/active-polls', authuser, getActivePolls)
userRouter.post('/vote-poll', authuser, voteInPoll)

export default userRouter