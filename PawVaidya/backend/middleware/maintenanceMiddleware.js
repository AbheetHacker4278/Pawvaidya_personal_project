import systemConfigModel from '../models/systemConfigModel.js';
import jwt from 'jsonwebtoken';

const maintenanceMiddleware = async (req, res, next) => {
    try {
        // Skip maintenance check for master admin login, system settings and essential health checks if needed
        if (req.path === '/api/admin/login' || req.path === '/api/admin/health-check' || req.path === '/api/admin/system-settings') {
            return next();
        }

        const config = await systemConfigModel.findOne({});
        if (!config) return next();

        // Check if the requester is an admin
        let isAdmin = false;
        let isMaster = false;
        const token = req.headers.token || req.headers.atoken || req.headers.dtoken;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.email === process.env.ADMIN_EMAIL) {
                    isAdmin = true;
                    isMaster = true;
                } else if (req.headers.atoken) {
                    // Simple check for child admin token
                    isAdmin = true;
                }
            } catch (err) {
                // Invalid token, treat as normal user
            }
        }

        const isAdminRoute = req.path.startsWith('/api/admin');

        // 1. Kill Switch: Blocks everyone except Master Admin
        if (config.killSwitch) {
            if (!isMaster) {
                return res.status(503).json({
                    success: false,
                    message: "CRITICAL: SYSTEM KILL-SWITCH ACTIVATED. All services suspended by root administrator.",
                    killSwitch: true
                });
            }
        }

        // 2. Maintenance Mode: Blocks non-admins
        if (config.maintenanceMode) {
            if (!isAdmin && !isAdminRoute) {
                return res.status(503).json({
                    success: false,
                    message: config.maintenanceMessage || "Platform is currently under scheduled maintenance.",
                    maintenance: true
                });
            }
        }

        next();
    } catch (error) {
        console.error("Maintenance Middleware Error:", error);
        next();
    }
};

export default maintenanceMiddleware;
