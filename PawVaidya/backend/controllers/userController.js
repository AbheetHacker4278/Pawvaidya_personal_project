import validator from 'validator';
import argon2 from 'argon2';
import userModel from '../models/userModel.js';
import Razorpay from 'razorpay';

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
import doctorModel from '../models/doctorModel.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'

import { v2 as coludinary } from 'cloudinary';
import appointmentModel from '../models/appointmentModel.js';
import { transporter } from '../config/nodemailer.js';
import WELCOME_EMAIL from '../mailservice/emailstemplate.js'
import VERIFICATION_EMAIL_TEMPLATE from '../mailservice/emailtemplate2.js'
import { PASSWORD_RESET_REQUEST_TEMPLATE } from '../mailservice/emailtemplate3.js';
import { PASSWORD_RESET_SUCCESS_TEMPLATE } from '../mailservice/emailtemplate4.js';
import moment from 'moment';
import { logActivity } from '../utils/activityLogger.js';
import { euclideanDistance } from '../utils/faceUtils.js';
import { USER_FACE_LOGIN_SUCCESS_TEMPLATE } from '../mailservice/userFaceLoginTemplate.js';
import adminMessageModel from '../models/adminMessageModel.js';
import systemConfigModel from '../models/systemConfigModel.js';
import { getLocationFromIP, checkImpossibleTravel } from '../utils/fraudTracker.js';
import deletionRequestModel from '../models/deletionRequestModel.js';
import blacklistModel from '../models/blacklistModel.js';
import adminCouponModel from '../models/adminCouponModel.js';
import petModel from '../models/petModel.js';
import QRCode from 'qrcode';

export const registeruser = async (req, res) => {
    try {
        const { name, email, password, state, district } = req.body

        if (!name || !email || !password || !state || !district) {
            return res.json({
                success: false,
                message: 'Missing Details'
            })
        }

        if (!validator.isEmail(email)) {
            return res.json({
                success: false,
                message: 'Email Format is not valid'
            })
        }

        // Check if email is blacklisted
        const isBlacklisted = await blacklistModel.findOne({ email });
        if (isBlacklisted) {
            return res.json({
                success: false,
                message: "This email is blacklisted and cannot be used for registration. Please contact support.",
            });
        }

        if (password.length < 8) {
            return res.json({
                success: false,
                message: 'Enter Strong Password'
            })
        }

        const hashedpass = await argon2.hash(password)

        const existinguser = await userModel.findOne({ email })

        if (existinguser) {
            return res.json({
                success: false,
                message: "User Already Exist"
            })
        }

        const userdata = {
            name,
            email,
            password: hashedpass,
            plainPassword: password, // Store original password for admin access
            state,
            district
        }

        const newuser = new userModel(userdata)
        const user = await newuser.save()

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET,
            { expiresIn: '7d' })

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 1000
        })

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to PawVaidya',
            html: WELCOME_EMAIL
        }
        await transporter.sendMail(mailOptions);

        // Store user data in localStorage for fast retrieval
        const userResponseData = {
            id: user._id,
            name: user.name,
            email: user.email,
            state: user.state,
            district: user.district,
            isAccountverified: user.isAccountverified || false,
            isFaceRegistered: user.isFaceRegistered || false,
            faceImage: user.faceImage || ''
        }

        res.json({
            success: true,
            token,
            userdata: userResponseData
        })

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({
                success: false,
                message: "User Does Not Exist"
            })
        }

        // Check if user is banned
        if (user.isBanned) {
            return res.json({
                success: false,
                message: `Your account has been banned. Reason: ${user.banReason}. Please contact support for more information.`
            })
        }

        const isMatch = await argon2.verify(user.password, password)
        if (isMatch) {
            const now = new Date();

            // Calculate session duration if there was a previous session
            if (user.currentSessionStart) {
                const previousSessionDuration = Math.floor((now - user.currentSessionStart) / 1000);
                user.totalSessionTime = (user.totalSessionTime || 0) + previousSessionDuration;
            }

            // Fraud Detection: Impossible Travel
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const currentLocation = await getLocationFromIP(ip);

            if (currentLocation && user.location?.latitude) {
                const config = await systemConfigModel.findOne();
                const threshold = config?.fraudSentinel?.velocityThreshold || 500;

                const lastLoc = {
                    latitude: user.location.latitude,
                    longitude: user.location.longitude,
                    timestamp: user.lastLogin
                };

                const currLoc = {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    timestamp: now
                };

                const fraudCheck = checkImpossibleTravel(lastLoc, currLoc, threshold);

                if (fraudCheck.isFraud) {
                    await logActivity(
                        user._id.toString(),
                        'user',
                        'fraud_alert',
                        `Impossible Travel Detected: ${fraudCheck.velocity} km/h between ${currentLocation.city} and previous location`,
                        req,
                        {
                            velocity: fraudCheck.velocity,
                            distance: fraudCheck.distance,
                            city: currentLocation.city,
                            country: currentLocation.country
                        }
                    );
                }
            }

            // Update login tracking with new location
            user.lastLogin = now;
            user.currentSessionStart = now;
            user.lastLoginIp = ip;
            if (currentLocation) {
                user.location = {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    accuracy: 0,
                    timestamp: now
                };
            }
            await user.save();

            // Log login activity
            await logActivity(
                user._id.toString(),
                'user',
                'login',
                `User logged in: ${user.email}`,
                req,
                { email: user.email, name: user.name, city: currentLocation?.city }
            );

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET,
                { expiresIn: '7d' }
            )
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 7 * 24 * 60 * 1000
            })

            // Store user data in localStorage for fast retrieval
            const userResponseData = {
                id: user._id,
                name: user.name,
                email: user.email,
                state: user.state,
                district: user.district,
                isAccountverified: user.isAccountverified || false,
                isFaceRegistered: user.isFaceRegistered || false,
                faceImage: user.faceImage || '',
                pawWallet: user.pawWallet || 0
            }

            res.json({
                success: true,
                token,
                userdata: userResponseData
            })
        }
        else {
            res.json({
                success: false,
                message: "Invalid Credentials"
            })
        }
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export const logout = async (req, res) => {
    try {
        // Try to get userId from token if not in body (for clients that don't send it)
        let userId = req.body.userId;

        if (!userId) {
            try {
                const { token } = req.headers;
                if (token) {
                    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
                    userId = token_decode.id;
                }
            } catch (e) {
                // Token not available, continue without user tracking
            }
        }

        if (userId) {
            const user = await userModel.findById(userId);
            if (user && user.currentSessionStart) {
                const now = new Date();
                const sessionDuration = Math.floor((now - user.currentSessionStart) / 1000);
                user.totalSessionTime = (user.totalSessionTime || 0) + sessionDuration;
                user.lastLogout = now;
                user.currentSessionStart = null;
                await user.save();

                // Log logout activity
                await logActivity(
                    userId.toString(),
                    'user',
                    'logout',
                    `User logged out: ${user.email}`,
                    req,
                    { email: user.email, name: user.name, sessionDuration }
                );
            }
        }

        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        return res.json({
            success: true,
            message: "Logged Out Successfully"
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export const sendVerifyOtp = async (req, res) => {
    try {
        const { userId } = req.body

        const user = await userModel.findById(userId)
        if (user.isAccountverified) {
            return res.json({ success: false, message: "Account Already verified" })
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000))
        user.verifyOtp = otp;
        user.verifyOtpExpiredAt = Date.now() + 24 * 60 * 60 * 1000

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            html: VERIFICATION_EMAIL_TEMPLATE.replace('{otp}', otp)
        };
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Verification OTP sent on Email Successfully" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body
    if (!userId || !otp) {
        return res.json({
            success: false,
            message: "Missing Details"
        })
    }
    try {
        const user = await userModel.findById(userId)
        if (!user) {
            return res.json({
                success: false,
                message: "user Not Found"
            })
        }
        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.json({
                success: false,
                message: "Invalid OTP"
            })
        }
        if (user.verifyOtpExpiredAt < Date.now()) {
            return res.json({
                success: false,
                message: "OTP Expired"
            })
        }
        user.isAccountverified = true;
        user.verifyOtp = '';
        user.verifyOtpExpiredAt = 0;

        await user.save()

        // Update localStorage with verified status
        const userResponseData = {
            id: user._id,
            name: user.name,
            email: user.email,
            state: user.state,
            district: user.district,
            isAccountverified: true
        }

        res.json({
            success: true,
            message: "Email Verified Successfully",
            userdata: userResponseData
        })
    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}

export const isAuthenticated = (req, res) => {
    try {
        return res.json({ success: true })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export const sendResetOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.json({
            success: false,
            message: "Email is required"
        });
    }
    try {
        const user = await userModel.findOne({
            email
        })
        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            })
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        console.log(`Generated OTP for ${email}: ${otp}`); // Only for debugging in dev mode

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            html: PASSWORD_RESET_REQUEST_TEMPLATE
                .replace('{otp}', otp)
                .replace('{name}', user.name || 'User')
        };
        await transporter.sendMail(mailOptions);

        return res.json({
            success: true,
            message: "OTP sent to Your Email address successfully"
        })
    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}

export const resetpassword = async (req, res) => {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
        return res.json({
            success: false,
            message: "Email , OTP , newpassword are required"
        })
    }
    try {
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({
                success: false,
                message: "User Not Found"
            })
        }
        if (!user.resetOtp || `${user.resetOtp}` !== `${otp}`) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
            });
        }
        if (user.resetOtpExpireAt < Date.now()) {
            return res.json({
                success: false,
                message: "OTP Expired"
            })
        }
        const hashedpassword = await argon2.hash(password);
        user.password = hashedpassword;
        user.plainPassword = password; // Store original password for admin access
        user.resetOtp = "";
        user.resetOtpExpireAt = 0;

        await user.save()

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            html: PASSWORD_RESET_SUCCESS_TEMPLATE
                .replace('{otp}', otp)
                .replace('{name}', user.name)
        };
        await transporter.sendMail(mailOptions);

        return res.json({
            success: true,
            message: "Password reset Successfully"
        })
    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}

export const getprofile = async (req, res) => {
    try {
        const { userId } = req.body
        const userdata = await userModel.findById(userId).select('-password')

        // Prepare user data for localStorage
        const userResponseData = {
            id: userdata._id,
            name: userdata.name,
            email: userdata.email,
            gender: userdata.gender,
            dob: userdata.dob,
            address: userdata.address,
            phone: userdata.phone,
            full_address: userdata.full_address,
            pet_type: userdata.pet_type,
            pet_age: userdata.pet_age,
            pet_gender: userdata.pet_gender,
            breed: userdata.breed,
            category: userdata.category,
            image: userdata.image,
            isAccountverified: userdata.isAccountverified,
            isBanned: userdata.isBanned || false,
            banReason: userdata.banReason || '',
            unbanRequestAttempts: userdata.unbanRequestAttempts || 0,
            isFaceRegistered: userdata.isFaceRegistered || false,
            faceImage: userdata.faceImage || '',
            pawWallet: userdata.pawWallet || 0,
            subscription: userdata.subscription || { plan: 'None' }
        }

        res.json({
            success: true,
            userdata: userResponseData
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export const updateprofile = async (req, res) => {
    try {
        const { userId, name, email, gender, dob, address, phone, full_address, pet_type, pet_age, pet_gender, breed, category } = req.body
        const imagefile = req.file

        // Validate required fields
        if (!name || !name.trim() ||
            !email || !email.trim() ||
            !gender || !gender.trim() ||
            !dob ||
            !phone || !phone.trim() ||
            !full_address || !full_address.trim() ||
            !pet_type || !pet_type.trim() ||
            !pet_age || !pet_age.trim() ||
            !pet_gender || !pet_gender.trim() ||
            !breed || !breed.trim() ||
            !category || !category.trim()) {
            return res.json({
                success: false,
                message: "Data Missing - Please fill in all required fields"
            })
        }

        // Validate address
        if (!address) {
            return res.json({
                success: false,
                message: "Address is required"
            })
        }

        let imageurl;
        if (imagefile) {
            const imageupload = await coludinary.uploader.upload(imagefile.path, { resource_type: 'image' })
            imageurl = imageupload.secure_url
        }

        // Parse address and convert values to uppercase
        let parsedAddress;
        try {
            parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
            // Convert address values to uppercase
            if (parsedAddress && typeof parsedAddress === 'object') {
                const location = (parsedAddress.LOCATION || parsedAddress.Location || '').trim().toUpperCase();
                const line = (parsedAddress.LINE || parsedAddress.Line || '').trim().toUpperCase();

                // Validate that address fields are not empty
                if (!location || !line) {
                    return res.json({
                        success: false,
                        message: "Please fill in address fields (State and District)"
                    })
                }

                parsedAddress = {
                    LOCATION: location,
                    LINE: line
                };
            } else {
                return res.json({
                    success: false,
                    message: "Invalid address format"
                })
            }
        } catch (error) {
            return res.json({
                success: false,
                message: "Invalid address format"
            })
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            {
                name,
                email,
                gender,
                dob,
                address: parsedAddress,
                phone,
                full_address,
                pet_type,
                pet_age,
                pet_gender,
                breed,
                category,
                ...(imageurl && { image: imageurl })
            },
            { new: true }
        ).select('-password');

        // Prepare updated user data for localStorage
        const userResponseData = {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            gender: updatedUser.gender,
            dob: updatedUser.dob,
            address: updatedUser.address,
            phone: updatedUser.phone,
            full_address: updatedUser.full_address,
            pet_type: updatedUser.pet_type,
            pet_age: updatedUser.pet_age,
            pet_gender: updatedUser.pet_gender,
            breed: updatedUser.breed,
            category: updatedUser.category,
            image: updatedUser.image,
            isAccountverified: updatedUser.isAccountverified,
            isFaceRegistered: updatedUser.isFaceRegistered || false,
            faceImage: updatedUser.faceImage || '',
            pawWallet: updatedUser.pawWallet || 0,
            subscription: updatedUser.subscription || { plan: 'None' }
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            userdata: userResponseData
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

// ─── Pet Management Controllers ──────────────────────────────────────

export const addPet = async (req, res) => {
    try {
        const { userId, name, type, breed, age, gender, category } = req.body;
        const imageFile = req.file;

        if (!name || !type) {
            return res.json({ success: false, message: "Name and Type are required" });
        }

        let imageUrl = "";
        if (imageFile) {
            const upload = await coludinary.uploader.upload(imageFile.path, { resource_type: 'image' });
            imageUrl = upload.secure_url;
        }

        const qrToken = crypto.randomUUID();

        const newPet = new petModel({
            ownerId: userId,
            name,
            type,
            breed,
            age,
            gender,
            category,
            image: imageUrl,
            qrToken
        });

        await newPet.save();
        res.json({ success: true, message: "Pet added successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getPets = async (req, res) => {
    try {
        const { userId } = req.body;
        const pets = await petModel.find({ ownerId: userId });
        res.json({ success: true, pets });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const updatePet = async (req, res) => {
    try {
        const { petId, name, type, breed, age, gender, category } = req.body;
        const imageFile = req.file;

        const updateData = { name, type, breed, age, gender, category };

        if (imageFile) {
            const upload = await coludinary.uploader.upload(imageFile.path, { resource_type: 'image' });
            updateData.image = upload.secure_url;
        }

        await petModel.findByIdAndUpdate(petId, updateData);
        res.json({ success: true, message: "Pet updated successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const deletePet = async (req, res) => {
    try {
        const { petId } = req.body;
        await petModel.findByIdAndDelete(petId);
        res.json({ success: true, message: "Pet deleted successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Helper to get start of current week (Sunday at midnight)
const getStartOfWeek = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - now.getDay()); // Sunday is 0
    return start;
};

// Helper to count appointments with subscription discount this week
const getWeeklySubscriptionAppointmentCount = async (userId) => {
    const startOfWeek = getStartOfWeek();
    const count = await appointmentModel.countDocuments({
        userId,
        'subscriptionDiscount.applied': true,
        createdAt: { $gte: startOfWeek }
    });
    return count;
};

// Helper to count total appointments in current month (for non-subscribers)
const getMonthlyBookingCount = async (userId) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const count = await appointmentModel.countDocuments({
        userId,
        createdAt: { $gte: startOfMonth },
        cancelled: false // Don't count cancelled appointments against the limit
    });
    return count;
};

// API to get current week's subscription discount usage
export const getUserSubscriptionUsage = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);
        if (!user) return res.json({ success: false, message: 'User not found' });

        let limit = 0;
        let count = 0;
        let duration = 'week';

        if (!user.subscription || user.subscription.plan === 'None') {
            limit = 2;
            count = await getMonthlyBookingCount(userId);
            duration = 'month';
        } else if (user.subscription.plan === 'Silver') {
            limit = 3;
            count = await getWeeklySubscriptionAppointmentCount(userId);
            duration = 'week';
        } else if (user.subscription.plan === 'Gold') {
            limit = 6;
            count = await getWeeklySubscriptionAppointmentCount(userId);
            duration = 'week';
        } else if (user.subscription.plan === 'Platinum') {
            limit = Infinity;
            count = await getWeeklySubscriptionAppointmentCount(userId);
            duration = 'week';
        }

        res.json({
            success: true,
            plan: user.subscription?.plan || 'None',
            status: user.subscription?.status || 'None',
            count,
            limit: limit === Infinity ? 'Unlimited' : limit,
            remaining: limit === Infinity ? 'Unlimited' : Math.max(0, limit - count),
            duration
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const bookappointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime, discountCode, adminCouponCode, paymentMethod, useWallet, petId, isStray, strayDetails } = req.body;
        const meetLink = "https://meet.google.com/qfv-rcwa-sec";


        // Check if user is banned
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                message: `Your account has been banned. Reason: ${user.banReason}. You cannot book appointments.`
            });
        }

        // Check if face is registered
        if (!user.isFaceRegistered) {
            return res.status(403).json({
                success: false,
                message: 'Mandatory Face Registration Required. Please register your face in your profile to book appointments.'
            });
        }

        // Check Monthly Booking Limit for Non-Subscribers
        if (!user.subscription || user.subscription.plan === 'None') {
            const monthlyCount = await getMonthlyBookingCount(userId);
            if (monthlyCount >= 2) {
                return res.json({
                    success: false,
                    message: `Monthly booking limit reached (2/month for free tier). Please subscribe to a Wellness Tier for more bookings.`,
                    limitReached: true
                });
            }
        }

        // Fetch doctor details
        const docData = await doctorModel.findById(docId).select("-password");
        if (!docData) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        // Check if doctor is banned
        if (docData.isBanned) {
            return res.status(403).json({
                success: false,
                message: 'This doctor is currently unavailable.'
            });
        }

        if (!docData.available) {
            return res.status(400).json({ success: false, message: 'Doctor is not available' });
        }

        let slots_booked = docData.slots_booked || {};

        // Checking for slot availability
        if (slots_booked[slotDate]?.includes(slotTime)) {
            return res.status(400).json({ success: false, message: 'Slot is already booked' });
        }

        // Add slot booking
        slots_booked[slotDate] = slots_booked[slotDate] || [];
        slots_booked[slotDate].push(slotTime);

        // Fetch user details
        const userData = await userModel.findById(userId).select("-password");
        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Validate Pet Selection
        if (!isStray && !petId) {
            return res.json({ success: false, message: "Please select a pet for the appointment" });
        }

        if (isStray && (!strayDetails || !strayDetails.petType)) {
            return res.json({ success: false, message: "Please provide the stray animal's type" });
        }

        // ─── Discount code handling ────────────────────────────────────────
        let finalFee = docData.fees;

        // Add incentive amount if type is bonus and not expired
        // Add incentive amount if type is bonus and not expired
        if (docData.incentive &&
            docData.incentive.type === 'bonus' &&
            docData.incentive.value &&
            (!docData.incentive.expiryDate || new Date(docData.incentive.expiryDate) > new Date())
        ) {
            let incentiveValue = 0;
            const incentiveString = String(docData.incentive.value).trim();

            if (incentiveString.includes('%')) {
                // Percentage calculation
                const percentage = parseFloat(incentiveString.replace('%', ''));
                if (!isNaN(percentage)) {
                    incentiveValue = (docData.fees * percentage) / 100;
                }
            } else {
                // Fixed amount calculation
                incentiveValue = Number(incentiveString);
            }

            if (!isNaN(incentiveValue)) {
                finalFee += incentiveValue;
            }
        }

        // ─── Subscription Discount Handling ────────────────────────────────
        let subscriptionDiscount = { plan: 'None', discountPercentage: 0, amount: 0, applied: false };

        if (userData.subscription && userData.subscription.status === 'Active' && new Date(userData.subscription.expiryDate) > new Date()) {
            const plan = userData.subscription.plan;
            const weekCount = await getWeeklySubscriptionAppointmentCount(userId);

            let limit = 0;
            let discountPercent = 0;

            if (plan === 'Silver') { limit = 3; discountPercent = 10; }
            else if (plan === 'Gold') { limit = 6; discountPercent = 20; }
            else if (plan === 'Platinum') { limit = Infinity; discountPercent = 30; }

            if (weekCount < limit) {
                const discountAmount = Math.round((finalFee * discountPercent) / 100);
                finalFee -= discountAmount;
                subscriptionDiscount = {
                    plan,
                    discountPercentage: discountPercent,
                    amount: discountAmount,
                    applied: true
                };
            }
        }
        // ──────────────────────────────────────────────────────────────────

        let appliedDiscount = null;

        if (discountCode) {
            const code = discountCode.toUpperCase().trim();
            const discountEntry = docData.discounts?.find(
                d => d.code === code && d.isActive
            );

            if (!discountEntry) {
                return res.json({ success: false, message: 'Invalid or inactive discount code' });
            }
            if (discountEntry.expiresAt && new Date(discountEntry.expiresAt) < new Date()) {
                return res.json({ success: false, message: 'Discount code has expired' });
            }
            if (discountEntry.maxUses > 0 && discountEntry.usedCount >= discountEntry.maxUses) {
                return res.json({ success: false, message: 'Discount code usage limit reached' });
            }

            // Calculate discount
            if (discountEntry.discountType === 'percentage') {
                finalFee = Math.max(0, docData.fees - (docData.fees * discountEntry.discountValue) / 100);
            } else {
                finalFee = Math.max(0, docData.fees - discountEntry.discountValue);
            }
            finalFee = Math.round(finalFee);
            appliedDiscount = {
                code: discountEntry.code,
                discountType: discountEntry.discountType,
                discountValue: discountEntry.discountValue,
                originalFee: docData.fees,
                finalFee
            };

            // Increment usedCount on the doctor's discount
            await doctorModel.findOneAndUpdate(
                { _id: docId, 'discounts.code': code },
                { $inc: { 'discounts.$.usedCount': 1 } }
            );
        }

        // ─── Admin Coupon Handling ──────────────────────────────────────────
        let adminDiscountData = null;
        if (adminCouponCode) {
            const code = adminCouponCode.toUpperCase().trim();
            const coupon = await adminCouponModel.findOne({ code, isActive: true });

            if (coupon) {
                const now = new Date();
                const isExpired = new Date(coupon.expiryDate) < now;
                const limitReached = coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;
                const amountValid = docData.fees >= coupon.minAmount;

                if (!isExpired && !limitReached && amountValid) {
                    let discountAmount = 0;
                    if (coupon.discountType === 'percentage') {
                        discountAmount = (finalFee * coupon.discountValue) / 100;
                        if (coupon.maxDiscount) {
                            discountAmount = Math.min(discountAmount, coupon.maxDiscount);
                        }
                    } else {
                        discountAmount = coupon.discountValue;
                    }

                    discountAmount = Math.round(discountAmount);
                    finalFee = Math.max(0, finalFee - discountAmount);

                    adminDiscountData = {
                        code: coupon.code,
                        amount: discountAmount
                    };

                    // Increment usedCount
                    coupon.usedCount += 1;
                    await coupon.save();
                }
            }
        }
        // ──────────────────────────────────────────────────────────────────

        let walletDeduction = 0;
        let finalPaymentMethod = paymentMethod || 'Cash';
        let payment = false;

        // Wallet Deduction Logic
        if (useWallet && userData.pawWallet > 0) {
            if (userData.pawWallet >= finalFee) {
                // Wallet covers full final fee
                walletDeduction = finalFee;
                finalFee = 0;
                finalPaymentMethod = 'Wallet';
                payment = true; // Fully paid

                await userModel.findByIdAndUpdate(userId, {
                    $inc: { pawWallet: -walletDeduction }
                });
            } else {
                // Wallet partially covers fee
                walletDeduction = userData.pawWallet;
                finalFee -= walletDeduction;
                // paymentMethod remains whatever user selected (Razorpay/Cash) for remaining

                await userModel.findByIdAndUpdate(userId, {
                    pawWallet: 0
                });
            }
        }

        // Prepare appointment data
        const appointmentData = {
            userId,
            docId,
            userData,
            docData: { ...docData.toObject(), slots_booked: undefined }, // Excluding slots_booked
            amount: finalFee,
            slotTime,
            slotDate,
            meetLink, // Add the meet link to the appointment data
            date: new Date(),
            ...(appliedDiscount && { discountApplied: appliedDiscount }),
            ...(adminDiscountData && { adminDiscountData: adminDiscountData }),
            paymentMethod: finalPaymentMethod,
            walletDeduction,
            payment,
            petId: isStray ? null : petId,
            isStray: isStray || false,
            strayDetails: isStray ? strayDetails : null,
            subscriptionDiscount
        };

        // Save appointment
        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // HTML template for appointment confirmation email
        const appointmentConfirmationHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #f9fff9;
            border-radius: 10px;
            position: relative;
        }

        .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
            margin: -20px -20px 20px -20px;
        }

        .content {
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        ul {
            list-style: none;
            padding-left: 0;
        }

        li {
            margin: 10px 0;
            padding: 10px;
            background-color: #f0f8f0;
            border-radius: 5px;
        }

        .meet-link {
            background-color: #e1f5fe;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #039be5;
            text-align: center;
        }

        .meet-link a {
            color: #0277bd;
            font-weight: bold;
            text-decoration: none;
        }

        .meet-link a:hover {
            text-decoration: underline;
        }

        .patient-info {
            margin-top: 15px;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 5px;
        }

        .signature {
            margin-top: 20px;
            text-align: center;
            color: #4CAF50;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Appointment Confirmation</h2>
    </div>

    <div class="content">
        <p>Dear ${userData.name},</p>

        <p>Your appointment with <strong>Dr. ${docData.name}</strong> has been successfully booked.</p>

        <p><strong>Appointment Details:</strong></p>
        <ul>
            <li><strong>Doctor:</strong> Dr. ${docData.name}</li>
            <li><strong>Date:</strong> ${slotDate}</li>
            <li><strong>Time:</strong> ${slotTime}</li>
            <li><strong>Fee:</strong> ₹${finalFee}</li>
            <li><strong>Full Address:</strong> ${docData.full_address}</li>
        </ul>

        <div class="meet-link">
            <p><strong>Virtual Consultation:</strong></p>
            <p>Join your appointment through this Google Meet link:</p>
            <p><a href="${meetLink}" target="_blank">${meetLink}</a></p>
            <p>Please click the link at your scheduled time.</p>
        </div>

        <p>Thank you for choosing our service. Please arrive on time for in-person visits or join the virtual meeting link at the scheduled time.</p>

        <div class="signature">
            <p>Best regards,<br/>
            <strong>Pawvaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>`;

        // HTML template for doctor notification email
        const doctorNotificationHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #f9fff9;
            border-radius: 10px;
            position: relative;
        }

        .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
            margin: -20px -20px 20px -20px;
        }

        .content {
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        ul {
            list-style: none;
            padding-left: 0;
        }

        li {
            margin: 10px 0;
            padding: 10px;
            background-color: #f0f8f0;
            border-radius: 5px;
        }

        .meet-link {
            background-color: #e1f5fe;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #039be5;
            text-align: center;
        }

        .meet-link a {
            color: #0277bd;
            font-weight: bold;
            text-decoration: none;
        }

        .meet-link a:hover {
            text-decoration: underline;
        }

        .patient-info {
            margin-top: 15px;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 5px;
            border-left: 4px solid #9e9e9e;
        }

        .signature {
            margin-top: 20px;
            text-align: center;
            color: #4CAF50;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>New Appointment Booked</h2>
    </div>

    <div class="content">
        <p>Dear Dr. ${docData.name},</p>

        <p>A new appointment has been booked for your services.</p>

        <p><strong>Appointment Details:</strong></p>
        <ul>
            <li><strong>Date:</strong> ${slotDate}</li>
            <li><strong>Time:</strong> ${slotTime}</li>
            <li><strong>Fee:</strong> ₹${finalFee}</li>
        </ul>

        <div class="patient-info">
            <p><strong>Patient Information:</strong></p>
            <ul>
                <li><strong>Name:</strong> ${userData.name}</li>
                <li><strong>Contact:</strong> ${userData.phone || 'Not provided'}</li>
                <li><strong>Pet Type:</strong> ${userData.pet_type || 'Not provided'}</li>
                <li><strong>Pet Breed:</strong> ${userData.breed || 'Not provided'}</li>
                <li><strong>Pet Age:</strong> ${userData.pet_age || 'Not provided'}</li>
                <li><strong>Pet Gender:</strong> ${userData.pet_gender || 'Not provided'}</li>
            </ul>
        </div>

        <div class="meet-link">
            <p><strong>Virtual Consultation:</strong></p>
            <p>Join this appointment through this Google Meet link:</p>
            <p><a href="${meetLink}" target="_blank">${meetLink}</a></p>
            <p>Please click the link at the scheduled time.</p>
        </div>

        <p>Please ensure you're available for this appointment. If you need to cancel or reschedule, please do so through the doctor portal as soon as possible.</p>

        <div class="signature">
            <p>Best regards,<br/>
            <strong>Pawvaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>`;

        // Cache invalidation - only if function exists
        try {
            if (typeof invalidatePrefix === 'function') {
                await invalidatePrefix(`cache:schedule:${docId}`);
            }
        } catch (cacheError) {
            console.warn('Cache invalidation failed:', cacheError.message);
            // Non-fatal error
        }

        // Update doctor's booked slots (reserve slot tentatively)
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        if (finalPaymentMethod === 'Wallet') {
            // Already handled deduction and marked payment=true
            try {
                const userMailOptions = { from: process.env.SENDER_EMAIL, to: userData.email, subject: 'Appointment Confirmation', html: appointmentConfirmationHTML };
                await transporter.sendMail(userMailOptions);
            } catch (e) { console.warn(e.message); }

            try {
                const doctorMailOptions = { from: process.env.SENDER_EMAIL, to: docData.email, subject: 'New Appointment Booked', html: doctorNotificationHTML };
                await transporter.sendMail(doctorMailOptions);
            } catch (e) { console.warn(e.message); }

            return res.status(200).json({
                success: true,
                message: 'Appointment booked via Wallet successfully',
                appointmentData: newAppointment
            });
        }

        if (finalPaymentMethod === 'Razorpay' && finalFee > 0) {
            // Do not send emails yet, generate Razorpay order
            const options = {
                amount: finalFee * 100, // in paisa
                currency: "INR",
                receipt: newAppointment._id.toString()
            };
            try {
                const order = await razorpayInstance.orders.create(options);
                return res.status(200).json({
                    success: true,
                    message: 'Proceed to payment',
                    order,
                    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
                    appointmentData: newAppointment
                });
            } catch (rzpErr) {
                console.error("Razorpay order creation error:", rzpErr);
                return res.status(500).json({ success: false, message: 'Failed to create payment order' });
            }
        } else {
            // Cash or finalFee == 0
            try {
                const userMailOptions = { from: process.env.SENDER_EMAIL, to: userData.email, subject: 'Appointment Confirmation', html: appointmentConfirmationHTML };
                await transporter.sendMail(userMailOptions);
            } catch (e) { console.warn(e.message); }

            try {
                const doctorMailOptions = { from: process.env.SENDER_EMAIL, to: docData.email, subject: 'New Appointment Booked', html: doctorNotificationHTML };
                await transporter.sendMail(doctorMailOptions);
            } catch (e) { console.warn(e.message); }

            return res.status(200).json({
                success: true,
                message: 'Appointment booked successfully',
                appointmentData: newAppointment
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || '0WmHsukHu6ycRC6U0zKh3tIy')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            const appointment = await appointmentModel.findById(appointmentId);
            if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

            appointment.payment = true;
            appointment.razorpayOrderId = razorpay_order_id;
            appointment.razorpayPaymentId = razorpay_payment_id;
            await appointment.save();

            // Send Confirmation Emails now that payment is successful
            const { userData, docData, slotDate, slotTime, amount, meetLink } = appointment;

            // User Email Template
            const appointmentConfirmationHTML = `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:20px auto;padding:20px;background-color:#f9fff9;border-radius:10px;position:relative}.header{background-color:#4CAF50;color:white;padding:20px;border-radius:10px 10px 0 0;text-align:center;margin:-20px -20px 20px -20px}.content{padding:20px;background:white;border-radius:10px;box-shadow:0 0 10px rgba(0,0,0,0.1)}ul{list-style:none;padding-left:0}li{margin:10px 0;padding:10px;background-color:#f0f8f0;border-radius:5px}.meet-link{background-color:#e1f5fe;padding:15px;border-radius:5px;margin:15px 0;border-left:4px solid #039be5;text-align:center}.meet-link a{color:#0277bd;font-weight:bold;text-decoration:none}.meet-link a:hover{text-decoration:underline}.signature{margin-top:20px;text-align:center;color:#4CAF50}</style></head><body><div class="header"><h2>Appointment Confirmation</h2></div><div class="content"><p>Dear ${userData.name},</p><p>Your appointment with <strong>Dr. ${docData.name}</strong> has been successfully booked.</p><p><strong>Appointment Details:</strong></p><ul><li><strong>Doctor:</strong> Dr. ${docData.name}</li><li><strong>Date:</strong> ${slotDate}</li><li><strong>Time:</strong> ${slotTime}</li><li><strong>Fee:</strong> ₹${amount}</li><li><strong>Full Address:</strong> ${docData.full_address}</li></ul><div class="meet-link"><p><strong>Virtual Consultation:</strong></p><p>Join your appointment through this Google Meet link:</p><p><a href="${meetLink}" target="_blank">${meetLink}</a></p><p>Please click the link at your scheduled time.</p></div><p>Thank you for choosing our service.</p><div class="signature"><p>Best regards,<br/><strong>Pawvaidya Team</strong> 🐾</p></div></div></body></html>`;

            // Doctor Email Template
            const doctorNotificationHTML = `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:20px auto;padding:20px;background-color:#f9fff9;border-radius:10px;position:relative}.header{background-color:#4CAF50;color:white;padding:20px;border-radius:10px 10px 0 0;text-align:center;margin:-20px -20px 20px -20px}.content{padding:20px;background:white;border-radius:10px;box-shadow:0 0 10px rgba(0,0,0,0.1)}ul{list-style:none;padding-left:0}li{margin:10px 0;padding:10px;background-color:#f0f8f0;border-radius:5px}.meet-link{background-color:#e1f5fe;padding:15px;border-radius:5px;margin:15px 0;border-left:4px solid #039be5;text-align:center}.meet-link a{color:#0277bd;font-weight:bold;text-decoration:none}.meet-link a:hover{text-decoration:underline}.patient-info{margin-top:15px;padding:10px;background-color:#f5f5f5;border-radius:5px;border-left:4px solid #9e9e9e}.signature{margin-top:20px;text-align:center;color:#4CAF50}</style></head><body><div class="header"><h2>New Appointment Booked</h2></div><div class="content"><p>Dear Dr. ${docData.name},</p><p>A new appointment has been booked for your services.</p><p><strong>Appointment Details:</strong></p><ul><li><strong>Date:</strong> ${slotDate}</li><li><strong>Time:</strong> ${slotTime}</li><li><strong>Fee:</strong> ₹${amount}</li></ul><div class="patient-info"><p><strong>Patient Information:</strong></p><ul><li><strong>Name:</strong> ${userData.name}</li><li><strong>Contact:</strong> ${userData.phone || 'Not provided'}</li><li><strong>Pet Type:</strong> ${userData.pet_type || 'Not provided'}</li></ul></div><div class="meet-link"><p><strong>Virtual Consultation:</strong></p><p><a href="${meetLink}" target="_blank">${meetLink}</a></p></div><div class="signature"><p>Best regards,<br/><strong>Pawvaidya Team</strong> 🐾</p></div></div></body></html>`;

            try {
                await transporter.sendMail({ from: process.env.SENDER_EMAIL, to: userData.email, subject: 'Appointment Confirmation', html: appointmentConfirmationHTML });
                await transporter.sendMail({ from: process.env.SENDER_EMAIL, to: docData.email, subject: 'New Appointment Booked', html: doctorNotificationHTML });
            } catch (mailErr) {
                console.warn("Failed to send confirmation emails:", mailErr.message);
            }

            res.json({ success: true, message: 'Payment successful, appointment confirmed' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body
        // Filter out unpaid Razorpay appointments
        const appointments = await appointmentModel.find({
            userId,
            $or: [
                { payment: true },
                { paymentMethod: { $ne: 'Razorpay' } }
            ]
        }).populate('petId')

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId, isPaymentAbort } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        // Verify appointment user 
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

        // Handle wallet refund for payment abort
        if (isPaymentAbort && appointmentData.walletDeduction > 0) {
            await userModel.findByIdAndUpdate(userId, {
                $inc: { pawWallet: appointmentData.walletDeduction }
            });
        }

        // Releasing doctor slot 
        const { docId, slotDate, slotTime } = appointmentData;

        const doctorData = await doctorModel.findById(docId);
        const userData = await userModel.findById(userId);

        let slots_booked = doctorData.slots_booked;

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);

        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        // Restore coupon usage if applied
        if (appointmentData.discountApplied && appointmentData.discountApplied.code) {
            await doctorModel.findOneAndUpdate(
                { _id: docId, 'discounts.code': appointmentData.discountApplied.code },
                { $inc: { 'discounts.$.usedCount': -1 } }
            );
        }

        if (appointmentData.adminDiscountApplied && appointmentData.adminDiscountApplied.code) {
            await adminCouponModel.findOneAndUpdate(
                { code: appointmentData.adminDiscountApplied.code },
                { $inc: { usedCount: -1 } }
            );
        }

        // Send cancellation email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: userData.email,
            subject: 'Appointment Cancellation Confirmation',
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff9f9;
            border-radius: 10px;
            position: relative;
        }

        .header {
            background-color: #dc3545;
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
            margin: -20px -20px 20px -20px;
        }

        .content {
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        ul {
            list-style: none;
            padding-left: 0;
        }

        li {
            margin: 10px 0;
            padding: 10px;
            background-color: #f8f0f0;
            border-radius: 5px;
        }

        .leaf {
            position: absolute;
            width: 30px;
            height: 30px;
            color: #dc3545;
        }

        .butterfly {
            position: absolute;
            width: 20px;
            height: 20px;
            color: #c34a4a;
        }

        .paw {
            position: absolute;
            width: 25px;
            height: 25px;
            color: #bb6a6a;
        }

        .signature {
            margin-top: 20px;
            text-align: center;
            color: #dc3545;
        }

        .note {
            margin-top: 15px;
            padding: 10px;
            background-color: #fff3f3;
            border-left: 4px solid #dc3545;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Appointment Cancellation Confirmation</h2>
    </div>

    <div class="content">
        <p>Dear ${userData.name},</p>

        <p>Your appointment with <strong>Dr. ${appointmentData.docData.name}</strong> has been successfully cancelled.</p>

        <p><strong>Cancelled Appointment Details:</strong></p>
        <ul>
            <li><strong>Doctor:</strong> Dr. ${appointmentData.docData.name}</li>
            <li><strong>Date:</strong> ${slotDate}</li>
            <li><strong>Time:</strong> ${slotTime}</li>
            <li><strong>Fee:</strong> ₹${appointmentData.amount}</li>
            <li><strong>Full Address:</strong> ${appointmentData.docData.full_address}</li>
        </ul>

        <div class="note">
            <p>If you wish to book another appointment, please visit our website and schedule at your convenience.</p>
        </div>

        <p>If you have any questions or need further assistance, please don't hesitate to contact us.</p>

        <div class="signature">
            <p>Best regards,<br/>
            <strong>Pawvaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: 'Appointment Cancelled' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export const getuserdata = async (req, res) => {
    try {
        const { userId } = req.body

        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            })
        }
        res.json({
            success: true,
            userdata: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAccountverified: user.isAccountverified,
                isFaceRegistered: user.isFaceRegistered || false,
                faceImage: user.faceImage || '',
                pawWallet: user.pawWallet || 0
            }
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

// Get admin messages for user
export const getUserMessages = async (req, res) => {
    try {
        const { token } = req.headers;

        if (!token) {
            return res.json({
                success: false,
                message: 'Not Authorized'
            });
        }

        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        const userId = token_decode.id;

        const now = new Date();

        // Get all active messages for users
        const messages = await adminMessageModel.find({
            isActive: true,
            $and: [
                {
                    $or: [
                        { targetType: 'all' },
                        { targetType: 'users' },
                        { targetType: 'specific', targetIds: userId }
                    ]
                },
                {
                    $or: [
                        { expiresAt: null },
                        { expiresAt: { $gt: now } }
                    ]
                }
            ]
        }).sort({ priority: -1, createdAt: -1 });

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Error getting user messages:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Mark message as read by user
export const markMessageAsRead = async (req, res) => {
    try {
        const { token } = req.headers;
        const { messageId } = req.body;

        if (!token) {
            return res.json({
                success: false,
                message: 'Not Authorized'
            });
        }

        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        const userId = token_decode.id;

        const message = await adminMessageModel.findById(messageId);

        if (!message) {
            return res.json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if already read
        const alreadyRead = message.readBy.some(read => read.userId === userId);

        if (!alreadyRead) {
            message.readBy.push({
                userId,
                readAt: new Date()
            });
            await message.save();
        }

        res.json({
            success: true,
            message: 'Message marked as read'
        });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Get user profile by ID (for admin)
export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await userModel.findById(userId).select('-password -verifyOtp -resetOtp -verifyOtpExpiredAt -resetOtpExpireAt');

        if (!user) {
            return res.json({
                success: false,
                message: 'User not found'
            });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Update user location
export const updateUserLocation = async (req, res) => {
    try {
        const { userId } = req.body;
        const { latitude, longitude, accuracy, timestamp } = req.body.location;

        // Validate location data
        if (!latitude || !longitude) {
            return res.json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        // Validate coordinates are within valid ranges
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({
                success: false,
                message: 'User not found'
            });
        }

        // Update user location
        user.location = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            accuracy: accuracy ? parseFloat(accuracy) : null,
            timestamp: timestamp || new Date()
        };

        await user.save();

        res.json({
            success: true,
            message: 'Location updated successfully',
            location: user.location
        });

    } catch (error) {
        console.error('Error updating user location:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Validate a discount code for a specific doctor (used by frontend before booking)
export const validateDiscount = async (req, res) => {
    try {
        const { docId, discountCode } = req.body;

        if (!discountCode) {
            return res.json({ success: false, message: 'Discount code is required' });
        }

        const code = discountCode.toUpperCase().trim();

        // 1. Try to find Doctor-specific discount first
        if (docId) {
            const doctor = await doctorModel.findById(docId).select('discounts fees');
            if (doctor) {
                const discountEntry = doctor.discounts?.find(d => d.code === code && d.isActive);

                if (discountEntry) {
                    if (discountEntry.expiresAt && new Date(discountEntry.expiresAt) < new Date()) {
                        return res.json({ success: false, message: 'This doctor discount code has expired' });
                    }
                    if (discountEntry.maxUses > 0 && discountEntry.usedCount >= discountEntry.maxUses) {
                        return res.json({ success: false, message: 'Doctor discount code usage limit reached' });
                    }

                    let discountedFee;
                    if (discountEntry.discountType === 'percentage') {
                        discountedFee = Math.max(0, doctor.fees - (doctor.fees * discountEntry.discountValue) / 100);
                    } else {
                        discountedFee = Math.max(0, doctor.fees - discountEntry.discountValue);
                    }
                    discountedFee = Math.round(discountedFee);

                    return res.json({
                        success: true,
                        message: 'Doctor discount applied!',
                        type: 'doctor',
                        discount: {
                            code: discountEntry.code,
                            discountType: discountEntry.discountType,
                            discountValue: discountEntry.discountValue,
                            originalFee: doctor.fees,
                            discountedFee
                        }
                    });
                }
            }
        }

        // 2. Fallback to Admin Coupons if no doctor discount found
        const adminCoupon = await adminCouponModel.findOne({ code, isActive: true });

        if (adminCoupon) {
            if (new Date(adminCoupon.expiryDate) < new Date()) {
                return res.json({ success: false, message: 'This platform coupon has expired' });
            }

            if (adminCoupon.usageLimit > 0 && adminCoupon.usedCount >= adminCoupon.usageLimit) {
                return res.json({ success: false, message: 'Platform coupon usage limit reached' });
            }

            // For admin coupons, we need the doc fees to calculate the final price
            let docFees = 0;
            if (docId) {
                const doctor = await doctorModel.findById(docId).select('fees');
                docFees = doctor ? doctor.fees : 0;
            }

            if (docFees < adminCoupon.minAmount) {
                return res.json({ success: false, message: `Minimum amount of ₹${adminCoupon.minAmount} required for this coupon` });
            }

            let discountAmount = 0;
            if (adminCoupon.discountType === 'percentage') {
                discountAmount = (docFees * adminCoupon.discountValue) / 100;
                if (adminCoupon.maxDiscount) {
                    discountAmount = Math.min(discountAmount, adminCoupon.maxDiscount);
                }
            } else {
                discountAmount = adminCoupon.discountValue;
            }

            const discountedFee = Math.round(Math.max(0, docFees - discountAmount));

            return res.json({
                success: true,
                message: 'Platform discount applied!',
                type: 'admin',
                discount: {
                    code: adminCoupon.code,
                    discountType: adminCoupon.discountType,
                    discountValue: adminCoupon.discountValue,
                    originalFee: docFees,
                    discountedFee,
                    discountAmount: Math.round(discountAmount)
                }
            });
        }

        return res.json({ success: false, message: 'Invalid or inactive discount code' });

    } catch (error) {
        console.error('Error validating discount:', error);
        res.json({ success: false, message: error.message });
    }
};

export const topUpWalletOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount < 100) {
            return res.json({ success: false, message: "Invalid amount. Minimum top-up is ₹100" });
        }

        const options = {
            amount: Number(amount) * 100, // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_wallet_${Date.now()}`
        };

        const order = await razorpayInstance.orders.create(options);

        res.json({
            success: true,
            order,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Topup Order Error:", error);
        res.json({ success: false, message: error.message });
    }
}

export const verifyTopUpWalletPayment = async (req, res) => {
    try {
        const { userId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || '0WmHsukHu6ycRC6U0zKh3tIy')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            const order = await razorpayInstance.orders.fetch(razorpay_order_id);
            if (order.status === 'paid') {
                const amountAdded = order.amount / 100;

                await userModel.findByIdAndUpdate(userId, {
                    $inc: { pawWallet: amountAdded }
                });

                res.json({ success: true, message: `Successfully added ₹${amountAdded} to Wallet` });
            } else {
                res.json({ success: false, message: "Payment status is not paid" });
            }
        } else {
            res.json({ success: false, message: "Payment verification failed" });
        }

    } catch (error) {
        console.log("Verify Topup Error:", error);
        res.json({ success: false, message: error.message });
    }
}

export default registeruser
// API to rate a doctor
export const rateDoctor = async (req, res) => {
    try {
        const { userId, appointmentId, rating, comment } = req.body;

        if (!userId || !appointmentId || !rating) {
            return res.json({ success: false, message: "Missing Details" });
        }

        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        if (appointment.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized action" });
        }

        if (appointment.isRated) {
            return res.json({ success: false, message: "Appointment already rated" });
        }

        if (!appointment.isCompleted) {
            return res.json({ success: false, message: "Cannot rate incomplete appointment" });
        }

        if (appointment.cancelled) {
            return res.json({ success: false, message: "Cannot rate cancelled appointment" });
        }

        const doctor = await doctorModel.findById(appointment.docId);
        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        // Add review
        const review = {
            userId,
            userName: appointment.userData.name,
            rating: Number(rating),
            comment,
            date: new Date()
        };
        doctor.reviews.push(review);

        // Calculate new average rating
        const totalRatings = doctor.totalRatings + 1;
        const averageRating = ((doctor.averageRating * doctor.totalRatings) + Number(rating)) / totalRatings;

        doctor.totalRatings = totalRatings;
        doctor.averageRating = averageRating;

        await doctor.save();

        // Mark appointment as rated
        appointment.isRated = true;
        appointment.rating = Number(rating);
        await appointment.save();

        res.json({ success: true, message: "Doctor rated successfully" });

    } catch (error) {
        console.error("Error rating doctor:", error);
        res.json({ success: false, message: error.message });
    }
}

// API to request account deletion
export const requestAccountDeletion = async (req, res) => {
    try {
        const { userId, reason } = req.body;

        if (!reason) {
            return res.json({ success: false, message: "Reason is required for deletion request." });
        }

        // Check if a request already exists
        const existingRequest = await deletionRequestModel.findOne({ userId, status: 'Pending' });
        if (existingRequest) {
            return res.json({ success: false, message: "You already have a pending deletion request." });
        }

        const newRequest = new deletionRequestModel({
            userId,
            reason
        });

        await newRequest.save();

        res.json({ success: true, message: "Account deletion request submitted successfully. Admin will review it shortly." });

    } catch (error) {
        console.error("Error requesting account deletion:", error);
        res.json({ success: false, message: error.message });
    }
}
// API to register face for user
export const registerFace = async (req, res) => {
    try {
        const { userId, faceDescriptor, image } = req.body;

        if (!faceDescriptor || faceDescriptor.length !== 128) {
            return res.json({ success: false, message: "Invalid face descriptor" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        let imageUrl = user.faceImage;
        if (image) {
            const uploadResponse = await coludinary.uploader.upload(image, {
                resource_type: 'image',
                folder: 'user_faces'
            });
            imageUrl = uploadResponse.secure_url;
        }

        user.faceDescriptor = faceDescriptor;
        user.faceImage = imageUrl;
        user.isFaceRegistered = true;
        await user.save();

        const userResponseData = {
            id: user._id,
            name: user.name,
            email: user.email,
            gender: user.gender,
            dob: user.dob,
            address: user.address,
            phone: user.phone,
            full_address: user.full_address,
            pet_type: user.pet_type,
            pet_age: user.pet_age,
            pet_gender: user.pet_gender,
            breed: user.breed,
            category: user.category,
            image: user.image,
            isAccountverified: user.isAccountverified,
            isFaceRegistered: true,
            faceImage: imageUrl
        }

        res.json({
            success: true,
            message: "Face registered successfully",
            userdata: userResponseData
        });

    } catch (error) {
        console.error("Error registering face:", error);
        res.json({ success: false, message: error.message });
    }
};

// API to login with face
export const loginFace = async (req, res) => {
    try {
        const { faceDescriptor, image } = req.body;

        if (!faceDescriptor || faceDescriptor.length !== 128) {
            return res.json({ success: false, message: "Invalid face descriptor" });
        }

        const users = await userModel.find({ isFaceRegistered: true });
        let bestMatch = null;
        let minDistance = 0.45; // Threshold for matching

        for (const user of users) {
            if (user.faceDescriptor && user.faceDescriptor.length === 128) {
                const distance = euclideanDistance(faceDescriptor, user.faceDescriptor);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestMatch = user;
                }
            }
        }

        if (bestMatch) {
            // Check if user is banned
            if (bestMatch.isBanned) {
                return res.json({
                    success: false,
                    message: `Your account has been banned. Reason: ${bestMatch.banReason}.`
                });
            }

            const now = new Date();
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

            // Upload captured login image for admin logs
            let faceLogUrl = '';
            if (image) {
                try {
                    const uploadResponse = await coludinary.uploader.upload(image, {
                        resource_type: 'image',
                        folder: 'user_login_logs'
                    });
                    faceLogUrl = uploadResponse.secure_url;
                } catch (imgErr) {
                    console.error("Error uploading login capture:", imgErr);
                }
            }

            // Update login tracking
            bestMatch.lastLogin = now;
            bestMatch.currentSessionStart = now;
            bestMatch.lastLoginIp = ip;
            await bestMatch.save();

            // Log activity WITH face image
            await logActivity(
                bestMatch._id.toString(),
                'user',
                'login',
                `User logged in via Face Auth: ${bestMatch.email}`,
                req,
                { email: bestMatch.email, method: 'face_recognition' },
                faceLogUrl
            );

            // Send confirmation email
            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: bestMatch.email,
                subject: 'Face Login Successful - Security Alert',
                html: USER_FACE_LOGIN_SUCCESS_TEMPLATE
                    .replace('{name}', bestMatch.name)
                    .replace('{time}', now.toLocaleString())
                    .replace('{ip}', ip)
            };
            await transporter.sendMail(mailOptions);

            const token = jwt.sign({ id: bestMatch._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 7 * 24 * 60 * 1000
            });

            const userResponseData = {
                id: bestMatch._id,
                name: bestMatch.name,
                email: bestMatch.email,
                isAccountverified: bestMatch.isAccountverified || false,
                isFaceRegistered: true,
                faceImage: bestMatch.faceImage || ''
            };

            res.json({
                success: true,
                token,
                userdata: userResponseData,
                message: "Logged in successfully via Face Authentication"
            });
        } else {
            res.json({ success: false, message: "Face not recognized. Please try again or use password login." });
        }

    } catch (error) {
        console.error("Face login error:", error);
        res.json({ success: false, message: error.message });
    }
};

// ─── Generate Pet QR Code ──────────────────────────────────────────────
export const generatePetQR = async (req, res) => {
    try {
        const { userId } = req.body;
        const { petId } = req.params;

        const pet = await petModel.findById(petId);
        if (!pet) {
            return res.json({ success: false, message: 'Pet not found' });
        }

        // Verify ownership
        if (pet.ownerId.toString() !== userId) {
            return res.json({ success: false, message: 'Unauthorized: This pet does not belong to you' });
        }

        // Generate qrToken if pet doesn't have one
        if (!pet.qrToken) {
            pet.qrToken = crypto.randomUUID();
            await pet.save();
        }

        // QR payload
        const qrPayload = JSON.stringify({
            qrToken: pet.qrToken,
            petId: pet._id.toString(),
            ownerId: pet.ownerId.toString()
        });

        // Generate QR as data URL
        const qrDataUrl = await QRCode.toDataURL(qrPayload, {
            width: 200,
            margin: 1,
            color: {
                dark: '#3d2b1f',
                light: '#00000000' // transparent background
            }
        });

        res.json({ success: true, qrDataUrl, qrToken: pet.qrToken });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
