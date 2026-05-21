const ipCache = new Map();

// Periodic self-cleaning interval to prevent memory leaks from inactive IPs (runs every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipCache.entries()) {
    if (now > record.resetTime) {
      ipCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * High-performance, self-cleaning rate limiter middleware
 * @param {object} options Configuration options
 * @param {number} options.windowMs Window timeframe in milliseconds (e.g. 60000 for 1 min)
 * @param {number} options.max Limit of hits allowed inside the timeframe window
 * @param {string} options.message Custom warning error message
 */
export const createEmergencyRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // default 1 minute
  const max = options.max || 10;                  // default 10 requests
  const message = options.message || 'Too many emergency operations requests, please slow down.';

  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown-client';
    const now = Date.now();

    let clientRecord = ipCache.get(key);

    if (!clientRecord || now > clientRecord.resetTime) {
      // First hit or window expired
      clientRecord = {
        hits: 1,
        resetTime: now + windowMs
      };
      ipCache.set(key, clientRecord);
    } else {
      // Within window
      clientRecord.hits += 1;
    }

    const remaining = Math.max(0, max - clientRecord.hits);
    const resetSeconds = Math.ceil((clientRecord.resetTime - now) / 1000);

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (clientRecord.hits > max) {
      console.warn(`[Rate Limiter] Throttle triggered for IP ${key}. Request rejected.`);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: resetSeconds
      });
    }

    next();
  };
};

// Specialized strict rate limiter for creating emergency bookings
export const createBookingLimiter = createEmergencyRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes window
  max: 5,                  // Max 5 creation attempts
  message: '🚨 Too many emergency booking attempts. To protect platform capacity, please wait 5 minutes before trying again.'
});

// Specialized rate limiter for doctor approval claims
export const doctorClaimLimiter = createEmergencyRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 20,                 // Max 20 claims/status updates per minute
  message: 'Too many status modification requests. Throttled for clinical coordination safety.'
});
