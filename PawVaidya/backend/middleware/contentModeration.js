import { createRequire } from 'module';
import jwt from 'jsonwebtoken';

const require = createRequire(import.meta.url);
// Use createRequire to properly load the CommonJS package in an ES module context
let wash = null;
try {
    wash = require('washyourmouthoutwithsoap');
} catch (e) {
    console.warn('[Content Moderation] washyourmouthoutwithsoap not available, using built-in list only.');
}

// ── Custom bad-words list (primary detection layer — always works) ─────────────
const CUSTOM_BAD_WORDS = [
    // English profanity
    'fuck', 'fucking', 'fucked', 'fucker', 'fucks', 'shit', 'shitting', 'shitty',
    'ass', 'asshole', 'ass hole', 'a s s', 'asses', 'bastard', 'bitch', 'bitches', 'bitching',
    'cunt', 'cunts', 'dick', 'dicks', 'dickhead', 'cock', 'cocks', 'cocksucker',
    'pussy', 'pussies', 'whore', 'whores', 'slut', 'sluts', 'nigger', 'nigga',
    'faggot', 'fag', 'retard', 'retarded', 'motherfucker', 'motherfucking', 'mother fucker',
    'damn', 'damned', 'hell', 'piss', 'pissed', 'prick', 'wanker', 'wank',
    'bollocks', 'bugger', 'crap', 'twat', 'arsehole', 'arse',
    // Common evasions/variations
    'f*ck', 'f**k', 'sh*t', 'b*tch', 'a**', 'a**hole', 'c**t', 'd*ck',
    // Hindi/Hinglish abuses
    'madarchod', 'behenchod', 'bhenchod', 'mc', 'bc', 'bhosdike', 'bhosdika',
    'chutiya', 'chutiye', 'teri maa', 'sala', 'saala', 'haramzada', 'harami',
    'gandu', 'gaand', 'randi', 'madar chod', 'behen chod', 'bakchod',
    'maderchod', 'kutte', 'kuttiya', 'lavde', 'lund', 'lauda',
    // Racial / hate slurs
    'spic', 'kike', 'chink', 'wetback', 'cracker', 'gook', 'coon', 'jigaboo',
    // Threats
    'i will kill', 'ill kill', 'kill yourself', 'go die', 'i hate you',
    // Generic abuses
    'idiot', 'stupid', 'moron', 'loser', 'jerk', 'creep', 'pervert', 'pedophile',
];

/**
 * Check text against the custom wordlist (substring match, case-insensitive).
 * Returns array of matched words.
 */
const detectWithCustomList = (text) => {
    const lowerText = text.toLowerCase();
    return CUSTOM_BAD_WORDS.filter(word => lowerText.includes(word));
};
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
 * Detect bad words in text — two layers:
 *  1) Custom wordlist (substring match — always works, catches Hindi + English)
 *  2) washyourmouthoutwithsoap (token-level, multi-locale) if available
 * Returns an array of detected bad words (deduped).
 */
const detectBadWords = (text) => {
    if (!text || typeof text !== 'string') return [];
    const detected = new Set();

    // Layer 1: Custom list (primary — guaranteed to work)
    for (const word of detectWithCustomList(text)) {
        detected.add(word);
    }

    // Layer 2: washyourmouthoutwithsoap (secondary — multi-language token matching)
    if (wash && typeof wash.check === 'function') {
        const locales = ['en', 'hi', 'de', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr', 'zh'];
        const lowerText = text.toLowerCase();
        for (const locale of locales) {
            try {
                if (wash.check(locale, text)) {
                    const wordList = wash.words(locale);
                    if (Array.isArray(wordList)) {
                        for (const word of wordList) {
                            if (lowerText.includes(word.toLowerCase())) detected.add(word);
                        }
                    }
                }
            } catch (_) { /* locale not available */ }
        }
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

        // Skip scanning for Chatbot Query (it's for authenticated admins and contains AI generated content/history)
        if (req.originalUrl === '/api/admin/bot/query' || req.originalUrl === '/api/admin/bot/query/') {
            return next();
        }

        const strings = extractStrings(req.body);
        const violations = [];

        for (const { field, value } of strings) {
            const detected = detectBadWords(value);
            if (detected.length > 0) {
                violations.push({ field, content: value, detectedWords: detected });
            }
        }

        if (violations.length === 0) return next();

        await logViolationsToDB(req, violations);

        // Attach to request so downstream controllers can block if necessary
        req.contentViolations = violations;
        return next();
    } catch (err) {
        console.error('[Content Moderation] Error:', err.message);
        return next();
    }
};

/**
 * Logs violations to the database. Extracted for reuse.
 */
const logViolationsToDB = async (req, violations) => {
    try {
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
    } catch (err) {
        console.error('[Content Moderation Logging Error]', err);
    }
};

/**
 * Manual trigger for multipart/form-data controllers after multer parsing.
 * Returns true if violations exist.
 */
export const checkAndLogViolations = async (req, bodyToScan) => {
    const strings = extractStrings(bodyToScan);
    const violations = [];

    for (const { field, value } of strings) {
        const detected = detectBadWords(value);
        if (detected.length > 0) {
            violations.push({ field, content: value, detectedWords: detected });
        }
    }

    if (violations.length === 0) return false;

    // --- Prevent Duplicate Logging ---
    // If the global middleware already logged these violations (JSON requests), don't log them again.
    // We check if the content and detected words match any existing violation in req.contentViolations.
    const newViolations = req.contentViolations
        ? violations.filter(v => !req.contentViolations.some(prev => prev.content === v.content && JSON.stringify(prev.detectedWords) === JSON.stringify(v.detectedWords)))
        : violations;

    if (newViolations.length > 0) {
        await logViolationsToDB(req, newViolations);
        // Merge or replace contentViolations
        req.contentViolations = [...(req.contentViolations || []), ...newViolations];
    } else {
        // Even if we didn't log (because it's a duplicate), we still ensure req.contentViolations is set
        // so controllers can block the request.
        if (!req.contentViolations) req.contentViolations = violations;
    }

    return true;
};

export default contentModerationMiddleware;
