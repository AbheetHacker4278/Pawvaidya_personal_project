import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';

// Hybrid authorization middleware for Crowdfunding endpoints.
// Allows access if EITHER a valid user token (token) OR a valid doctor token (dtoken) is provided.
const authUserOrDoctor = async (req, res, next) => {
    try {
        const { token, dtoken } = req.headers;
        const activeToken = token || dtoken;
        if (!activeToken) {
            return res.json({
                success: false,
                message: "Authentication required. Please login."
            });
        }
        const token_decode = jwt.verify(activeToken, process.env.JWT_SECRET);
        req.body.userId = token_decode.id;
        req.userId = token_decode.id;

        // Check ban status
        if (token) {
            const user = await userModel.findById(token_decode.id).select('isBanned banReason');
            if (user && user.isBanned) {
                return res.json({
                    success: false,
                    isBanned: true,
                    message: `Access Denied. Your account is temporarily banned. Reason: ${user.banReason || 'Unpaid emergency booking dues'}`
                });
            }
        } else if (dtoken) {
            const doctor = await doctorModel.findById(token_decode.id).select('isBanned banReason');
            if (doctor && doctor.isBanned) {
                return res.json({
                    success: false,
                    isBanned: true,
                    message: `Access Denied. Your doctor account is temporarily banned. Reason: ${doctor.banReason || 'Suspension'}`
                });
            }
        }

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.json({
                success: false,
                message: "Session expired. Please login again."
            });
        }
        console.log(error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

export default authUserOrDoctor;
