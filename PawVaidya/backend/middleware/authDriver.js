import jwt from 'jsonwebtoken';
import driverModel from '../models/driverModel.js';

const authDriver = async (req, res, next) => {
    try {
        const { dtoken } = req.headers;
        if (!dtoken) {
            return res.json({
                success: false,
                message: "Not authorized. No token provided."
            });
        }

        const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET);
        const driver = await driverModel.findById(token_decode.id);

        if (!driver) {
            return res.json({
                success: false,
                message: "Driver account not found."
            });
        }

        if (driver.employmentStatus === 'Terminated') {
            return res.json({
                success: false,
                message: "Your driver account has been terminated/deleted."
            });
        }

        if (driver.employmentStatus === 'Suspended' || driver.isBanned) {
            return res.json({
                success: false,
                message: `Account suspended. Reason: ${driver.banReason || 'Policy violations or administrative suspension'}`
            });
        }

        req.driverId = driver._id.toString();
        req.driver = driver;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.json({
                success: false,
                message: "Session expired. Please login again."
            });
        }
        console.error("authDriver Error:", error);
        return res.json({
            success: false,
            message: error.message || "Authorization failed."
        });
    }
};

export default authDriver;
