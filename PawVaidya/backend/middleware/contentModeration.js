import wash from 'washyourmouthoutwithsoap';
import jwt from 'jsonwebtoken';
import contentViolationModel from '../models/contentViolationModel.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import adminModel from '../models/adminModel.js';
import { getLocationFromIP } from '../utils/fraudTracker.js';

const formatIP = (ip) => {
    if (!ip) return 'Unknown';
    if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') return '127.0.0.1 (Localhost)';
    return ip.replace(/^::ffff:/, '');
};

const parseUA = (ua) => {
    const res = { browser: 'Unknown', browserVersion: 'N/A', os: 'Unknown', osVersion: 'N/A', type: 'Desktop' };
    if (!ua) return res;
    if (/mobile/i.test(ua)) res.type = 'Mobile';
    if (/tablet/i.test(ua)) res.type = 'Tablet';
    if (/chrome|crios/i.test(ua)) {
        res.browser = 'Chrome';
        const m = ua.match(/(?:chrome|crios)\/([0-9.]+)/i);
        if (m) res.browserVersion = m[1];
    } else if (/firefox|fxios/i.test(ua)) {
        res.browser = 'Firefox';
        const m = ua.match(/(?:firefox|fxios)\/([0-9.]+)/i);
        if (m) res.browserVersion = m[1];
    } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
        res.browser = 'Safari';
        const m = ua.match(/version\/([0-9.]+)/i);
        if (m) res.browserVersion = m[1];
    } else if (/edg/i.test(ua)) {
        res.browser = 'Edge';
        const m = ua.match(/edg\/([0-9.]+)/i);
        if (m) res.browserVersion = m[1];
    }
    if (/windows/i.test(ua)) { res.os = 'Windows'; if (/nt 10.0/i.test(ua)) res.osVersion = '10/11'; }
    else if (/macintosh|mac os x/i.test(ua)) { res.os = 'Mac OS'; }
    else if (/android/i.test(ua)) { res.os = 'Android'; const m = ua.match(/android ([0-9.]+)/i); if (m) res.osVersion = m[1]; }
    else if (/iphone|ipad|ipod/i.test(ua)) { res.os = 'iOS'; }
    else if (/linux/i.test(ua)) { res.os = 'Linux'; }
    return res;
};

/**
 * Extract all string values from a nested object, skipping long base64/binary fields.
 */
const extractStrings = (obj, path = '') => {
    const strings = [];
    if (!obj || typeof obj !== 'object') return strings;
    for (const key in obj) {
        const val = obj[key];
        if (typeof val === 'string' && val.length < 2000 && !val.startsWith('data:')) {
            strings.push({ field: path ? `${path}.${key}` : key, value: val });
        } else if (typeof val === 'object' && val !== null) {
            strings.push(...extractStrings(val, path ? `${path}.${key}` : key));
        }
    }
    return strings;
};

/**
 * Detect bad words in text using washyourmouthoutwithsoap (multiple locales).
 * Returns an array of detected bad words (deduped).
 */
const detectBadWords = (text) => {
    if (!text || typeof text !== 'string') return [];
    const locales = ['en', 'hi', 'de', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr', 'zh'];
    const detected = new Set();

    for (const locale of locales) {
        try {
            if (wash.check(locale, text)) {
                // Get the actual matched words for this locale
                const wordList = wash.words(locale);
                const lowerText = text.toLowerCase();
                for (const word of wordList) {
                    if (lowerText.includes(word.toLowerCase())) {
                        detected.add(word);
                    }
                }
            }
        } catch (_) { /* locale not available */ }
    }

    return Array.from(detected);
};

/**
 * Content moderation middleware — scans request body for bad words.
 * Saves violations to contentViolationModel (does NOT block the request).
 */
const contentModerationMiddleware = async (req, res, next) => {
    try {
        // Only check text-bearing methods
        if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();

        const strings = extractStrings(req.body);
        const violations = [];

        for (const { field, value } of strings) {
            const detected = detectBadWords(value);
            if (detected.length > 0) {
                violations.push({ field, content: value, detectedWords: detected });
            }
        }

        if (violations.length === 0) return next();

        // --- Collect request metadata ---
        const userAgent = req.headers['user-agent'] || '';
        const deviceInfo = parseUA(userAgent);
        let rawIp = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '';
        if (rawIp.includes(',')) rawIp = rawIp.split(',')[0].trim();
        const ip = formatIP(rawIp);

        let locationData = null;
        const clientLat = req.headers['x-client-latitude'];
        const clientLon = req.headers['x-client-longitude'];
        if (clientLat && clientLon) {
            locationData = { city: 'Client-Reported', country: 'GPS/Network', latitude: parseFloat(clientLat), longitude: parseFloat(clientLon) };
        } else {
            locationData = await getLocationFromIP(ip);
        }

        // --- Identify user ---
        let userId = null, userType = 'unknown', userDetails = { name: 'Anonymous', email: 'N/A' };
        try {
            const { token, dtoken, atoken } = req.headers;
            const jwtSecret = process.env.JWT_SECRET;
            if (atoken) {
                const d = jwt.verify(atoken, jwtSecret);
                const admin = await adminModel.findOne({ email: d.email });
                if (admin) { userId = admin._id; userType = 'admin'; userDetails = { name: 'Admin', email: admin.email }; }
            } else if (dtoken) {
                const d = jwt.verify(dtoken, jwtSecret);
                const doctor = await doctorModel.findById(d.id);
                if (doctor) { userId = doctor._id; userType = 'doctor'; userDetails = { name: doctor.name, email: doctor.email }; }
            } else if (token) {
                const d = jwt.verify(token, jwtSecret);
                const user = await userModel.findById(d.id);
                if (user) { userId = user._id; userType = 'user'; userDetails = { name: user.name, email: user.email }; }
            }
        } catch (_) { /* not authenticated */ }

        // --- Save one violation record per offending field ---
        for (const violation of violations) {
            await contentViolationModel.create({
                userId,
                userType,
                userDetails,
                content: violation.content,
                detectedWords: violation.detectedWords,
                url: req.originalUrl || req.url,
                method: req.method,
                ipAddress: ip,
                location: locationData || { city: 'Unknown', country: 'Unknown' },
                device: deviceInfo,
                userAgent,
                severity: violation.detectedWords.length > 3 ? 'high' : 'medium',
            });

            console.warn(`[Content Moderation] Bad words detected from ${ip} (${userDetails.email}) in field "${violation.field}": ${violation.detectedWords.join(', ')}`);
        }

        // Do NOT block — just log. Admin will take action from the dashboard.
        return next();
    } catch (err) {
        console.error('[Content Moderation] Error:', err.message);
        return next();
    }
};

export default contentModerationMiddleware;
