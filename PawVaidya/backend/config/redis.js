import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.warn('WARNING: REDIS_URL is not defined. Redis features will be disabled.');
}

const redis = redisUrl ? new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    showFriendlyErrorStack: true,
}) : null;

if (redis) {
    redis.on('connect', () => {
        console.log('Redis connected successfully');
    });

    redis.on('error', (err) => {
        console.error('Redis connection error:', err.message);
    });
}

export default redis;
