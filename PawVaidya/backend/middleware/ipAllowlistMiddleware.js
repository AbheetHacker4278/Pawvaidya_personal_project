import allowedIpModel from '../models/allowedIpModel.js';

const ipAllowlistMiddleware = async (req, res, next) => {
    try {
        const allowedIps = await allowedIpModel.find({});
        if (allowedIps.length === 0) {
            // Allowlist is empty - bypass restriction
            return next();
        }

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Clean client IP (strip IPv6 prefix if present)
        let cleanIp = clientIp;
        if (clientIp.includes('::ffff:')) {
            cleanIp = clientIp.split('::ffff:')[1];
        }

        const isAllowed = allowedIps.some(item => {
            const allowed = item.ipAddress;
            return allowed === cleanIp || 
                   allowed === '::1' && (cleanIp === '::1' || cleanIp === '127.0.0.1') ||
                   allowed === '127.0.0.1' && (cleanIp === '::1' || cleanIp === '127.0.0.1');
        });

        if (!isAllowed) {
            return res.status(403).json({
                success: false,
                message: `Access denied. IP address (${cleanIp}) is not whitelisted for administrative access.`
            });
        }

        next();
    } catch (err) {
        console.error("IP Allowlist Middleware Error:", err);
        next();
    }
};

export default ipAllowlistMiddleware;
