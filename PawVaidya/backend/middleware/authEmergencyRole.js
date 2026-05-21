import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const authEmergencyRole = async (req, res, next) => {
    try {
        const { token, dtoken, atoken } = req.headers;

        if (atoken) {
            const token_decode = jwt.verify(atoken, process.env.JWT_SECRET);
            req.adminId = token_decode.id || token_decode.email;
            req.role = 'admin';
            next();
        } else if (dtoken) {
            const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET);
            req.docId = token_decode.id;
            req.role = 'doctor';
            next();
        } else if (token) {
            const token_decode = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = token_decode.id;
            req.role = 'user';

            // Check if user is banned
            const user = await userModel.findById(token_decode.id).select('isBanned banReason');
            if (user && user.isBanned) {
                const blockedPaths = ['/create', '/payment'];
                if (blockedPaths.some(p => req.path.includes(p))) {
                    return res.json({
                        success: false,
                        isBanned: true,
                        message: `Access Denied. Your account is temporarily banned. Reason: ${user.banReason || 'Unpaid emergency booking dues'}`
                    });
                }
            }
            next();
        } else {
            return res.json({
                success: false,
                message: "Not authorized. No access token provided."
            });
        }
    } catch (error) {
        console.error("[authEmergencyRole] Verification failed:", error.message);
        return res.json({
            success: false,
            message: "Session expired or invalid authentication token."
        });
    }
};

export default authEmergencyRole;
