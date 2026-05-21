import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

//user auth middleware
const authuser = async (req, res, next) => {
    try {
        const { token } = req.headers;
        if (!token) {
            return res.json({
                success: false,
                message: "not authorized to login"
            })
        }
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        req.body.userId = token_decode.id
        req.userId = token_decode.id;

        // Check ban status for specific restricted operations
        const user = await userModel.findById(token_decode.id).select('isBanned banReason');
        if (user && user.isBanned) {
            let blockedPaths = [
                '/book-appointment',
                '/book-video-appointment',
                '/wallet/topup-order',
                '/wallet/verify-topup'
            ];
            // If restricted for emergency dues, allow them to top up their wallet to clear the dues
            if (user.banReason && user.banReason.toLowerCase().includes('emergency booking dues')) {
                blockedPaths = [
                    '/book-appointment',
                    '/book-video-appointment'
                ];
            }
            if (blockedPaths.some(p => req.path.includes(p))) {
                return res.json({
                    success: false,
                    isBanned: true,
                    message: `Access Denied. Your account is temporarily banned. Reason: ${user.banReason || 'Unpaid emergency booking dues'}`
                });
            }
        }

        next()
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
}

export default authuser