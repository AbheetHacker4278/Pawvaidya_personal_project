import securityIncidentModel from '../models/securityIncidentModel.js';
import { logActivity } from '../utils/activityLogger.js';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import { getLocationFromIP } from '../utils/fraudTracker.js';

// No direct adminModel import to avoid potential issues if it's defined differently, 
// though we usually have it. Let's assume it's available as we are in the same project.
import adminModel from '../models/adminModel.js';

const formatIP = (ip) => {
    if (!ip) return 'Unknown';
    if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') return '127.0.0.1 (Localhost)';
    return ip.replace(/^::ffff:/, ''); // Strip IPv6 prefix for IPv4-mapped addresses
};

const parseUA = (ua) => {
    const res = {
        browser: 'Unknown',
        browserVersion: 'N/A',
        os: 'Unknown',
        osVersion: 'N/A',
        type: 'Desktop'
    };

    if (!ua) return res;

    // Type detection
    if (/mobile/i.test(ua)) res.type = 'Mobile';
    if (/tablet/i.test(ua)) res.type = 'Tablet';

    // Browser detection
    if (/chrome|crios/i.test(ua)) {
        res.browser = 'Chrome';
        const match = ua.match(/(?:chrome|crios)\/([0-9.]+)/i);
        if (match) res.browserVersion = match[1];
    } else if (/firefox|fxios/i.test(ua)) {
        res.browser = 'Firefox';
        const match = ua.match(/(?:firefox|fxios)\/([0-9.]+)/i);
        if (match) res.browserVersion = match[1];
    } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
        res.browser = 'Safari';
        const match = ua.match(/version\/([0-9.]+)/i);
        if (match) res.browserVersion = match[1];
    } else if (/msie|trident/i.test(ua)) {
        res.browser = 'Internet Explorer';
    } else if (/edg/i.test(ua)) {
        res.browser = 'Edge';
        const match = ua.match(/edg\/([0-9.]+)/i);
        if (match) res.browserVersion = match[1];
    }

    // OS detection
    if (/windows/i.test(ua)) {
        res.os = 'Windows';
        if (/nt 10.0/i.test(ua)) res.osVersion = '10/11';
        else if (/nt 6.3/i.test(ua)) res.osVersion = '8.1';
        else if (/nt 6.2/i.test(ua)) res.osVersion = '8';
        else if (/nt 6.1/i.test(ua)) res.osVersion = '7';
    } else if (/macintosh|mac os x/i.test(ua)) {
        res.os = 'Mac OS';
        const match = ua.match(/mac os x ([0-9_. ]+)/i);
        if (match) res.osVersion = match[1].replace(/_/g, '.');
    } else if (/android/i.test(ua)) {
        res.os = 'Android';
        const match = ua.match(/android ([0-9.]+)/i);
        if (match) res.osVersion = match[1];
    } else if (/iphone|ipad|ipod/i.test(ua)) {
        res.os = 'iOS';
        const match = ua.match(/os ([0-9_]+)/i);
        if (match) res.osVersion = match[1].replace(/_/g, '.');
    } else if (/linux/i.test(ua)) {
        res.os = 'Linux';
    }

    return res;
};

const patterns = {
    XSS: [
        /<script\b[^>]*>([\s\S]*?)<\/script>/im,
        /<script\b[^>]*>/im,
        /on\w+\s*=\s*['"].*?['"]/im,
        /javascript:\s*/im,
        /<iframe\b[^>]*>([\s\S]*?)<\/iframe>/im,
        /<object\b[^>]*>([\s\S]*?)<\/object>/im,
        /<embed\b[^>]*>([\s\S]*?)<\/embed>/im,
        /<svg\b[^>]*on[a-z]+\s*=/im,
        /<img\b[^>]*onerror\s*=/im,
        /style\s*=\s*(['"])[^'"]*expression\s*\(/im,
        /<link\b[^>]*rel\s*=\s*(['"])stylesheet\1[^>]*href\s*=\s*(['"])javascript:/im,
    ],
    SQLi: [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/im,
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/im,
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/im,
        /exec(\s|\+)+(s|x)p\w+/im,
        /union(\s|\+)+select/im,
        /drop(\s|\+)+table/im,
        /SELECT\s+.*\s+FROM/im,
        /INSERT\s+INTO\s+.*\s+VALUES/im,
        /UPDATE\s+.*\s+SET/im,
        /DELETE\s+FROM/im,
    ]
};

const scanObject = (obj, path = '') => {
    let threats = [];
    if (!obj || typeof obj !== 'object') return threats;
    for (const key in obj) {
        const fullPath = path ? `${path}.${key}` : key;
        const value = obj[key];

        if (typeof value === 'string') {
            for (const type in patterns) {
                for (const pattern of patterns[type]) {
                    if (pattern.test(value)) {
                        console.log(`[Security Scan] Match detected! Type: ${type}, Field: ${fullPath}, Pattern: ${pattern}`);
                        threats.push({ type, target: fullPath, payload: value });
                        break; // Important: Stop after the first match of this type for this field
                    }
                }
            }
        } else if (typeof value === 'object' && value !== null) {
            threats = threats.concat(scanObject(value, fullPath));
        }
    }
    return threats;
};

const securityMonitor = async (req, res, next) => {
    try {
        // Prevent duplicate scans if middleware is applied at both global and route level
        // but only if body is still empty (global level). 
        // If body exists now but didn't before, we want to scan it.
        const bodyContent = JSON.stringify(req.body || {});
        const queryContent = JSON.stringify(req.query || {});

        if (req._securityScannedBody === bodyContent && req._securityScannedQuery === queryContent) {
            return next();
        }

        console.log(`[Security Monitor] Scanning ${req.method} ${req.originalUrl || req.url}`);
        if (Object.keys(req.body || {}).length > 0) {
            console.log(`[Security Monitor] Body keys: ${Object.keys(req.body).join(', ')}`);
        }

        const threats = [
            ...scanObject(req.body, 'body'),
            ...scanObject(req.query, 'query'),
            ...scanObject(req.params, 'params')
        ];

        req._securityScannedBody = bodyContent;
        req._securityScannedQuery = JSON.stringify(req.query || {});

        if (threats.length > 0) {
            console.log(`[Security Monitor] ${threats.length} threats detected on ${req.method} ${req.originalUrl}`);
            // Attempt to identify the user
            let userId = null;
            let userType = 'unknown';
            let userDetails = { name: 'Anonymous', email: 'N/A' };

            // Capture Metadata
            const userAgent = req.headers['user-agent'] || '';
            const deviceInfo = parseUA(userAgent);
            let rawIp = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '';
            if (rawIp.includes(',')) rawIp = rawIp.split(',')[0].trim();
            const ip = formatIP(rawIp);

            // Prioritize client-side headers if available
            let locationData = null;
            const clientLat = req.headers['x-client-latitude'];
            const clientLon = req.headers['x-client-longitude'];

            if (clientLat && clientLon) {
                locationData = {
                    city: 'Client-Reported',
                    country: 'GPS/Network',
                    latitude: parseFloat(clientLat),
                    longitude: parseFloat(clientLon)
                };
                console.log(`[Security Monitor] Using client-reported coordinates: ${clientLat}, ${clientLon}`);
            } else {
                locationData = await getLocationFromIP(ip);
            }

            try {
                const { token, dtoken, atoken } = req.headers;
                const jwtSecret = process.env.JWT_SECRET;

                if (atoken) {
                    const decoded = jwt.verify(atoken, jwtSecret);
                    const admin = await adminModel.findOne({ email: decoded.email });
                    if (admin) {
                        userId = admin._id;
                        userType = 'admin';
                        userDetails = { name: 'Admin', email: admin.email };
                    }
                } else if (dtoken) {
                    const decoded = jwt.verify(dtoken, jwtSecret);
                    const doctor = await doctorModel.findById(decoded.id);
                    if (doctor) {
                        userId = doctor._id;
                        userType = 'doctor';
                        userDetails = { name: doctor.name, email: doctor.email };
                    }
                } else if (token) {
                    const decoded = jwt.verify(token, jwtSecret);
                    const user = await userModel.findById(decoded.id);
                    if (user) {
                        userId = user._id;
                        userType = 'user';
                        userDetails = { name: user.name, email: user.email };
                    }
                }
            } catch (authError) {
                // Ignore auth errors, just proceed as anonymous/unknown
            }

            console.warn(`[Security Alert] Potential threat detected from ${req.ip} (${userDetails.email}):`, threats);

            for (const threat of threats) {
                const incident = new securityIncidentModel({
                    type: threat.type,
                    target: threat.target,
                    payload: threat.payload,
                    method: req.method,
                    url: req.originalUrl || req.url,
                    ipAddress: ip,
                    location: locationData || { city: 'Unknown', country: 'Unknown' },
                    userAgent: userAgent,
                    device: deviceInfo,
                    userId: userId,
                    userType: userType,
                    userDetails: userDetails,
                    severity: threat.type === 'SQLi' ? 'high' : 'medium'
                });
                const savedIncident = await incident.save();
                console.log(`[Security Monitor] Incident saved: ${savedIncident._id}`);

                // Also log to general activity logs
                try {
                    await logActivity(
                        userId,
                        userType,
                        'security_threat',
                        `Security threat detected: ${threat.type} on ${threat.target} by ${userDetails.name} (${userType})`,
                        req,
                        { threatType: threat.type, payload: threat.payload, offender: userDetails }
                    );
                } catch (logErr) {
                    console.error("[Security Monitor] Activity Logging failed:", logErr.message);
                }
            }
        }
        next();
    } catch (error) {
        console.error("Security Monitor Error:", error);
        next();
    }
};

export default securityMonitor;
