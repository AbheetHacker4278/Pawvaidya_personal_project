import redis from '../config/redis.js';

/**
 * Cache data with an optional TTL (Time To Live in seconds)
 */
export const setCache = async (key, data, ttl = 3600) => {
    try {
        if (!redis) return null;
        await redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (error) {
        console.error(`Error setting cache for key ${key}:`, error.message);
    }
};

/**
 * Get data from cache
 */
export const getCache = async (key) => {
    try {
        if (!redis) return null;
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Error getting cache for key ${key}:`, error.message);
        return null;
    }
};

/**
 * Invalidate/Delete a specific cache key
 */
export const deleteCache = async (key) => {
    try {
        if (!redis) return null;
        await redis.del(key);
    } catch (error) {
        console.error(`Error deleting cache for key ${key}:`, error.message);
    }
};

/**
 * Clear multiple keys based on a pattern
 */
export const deleteCacheByPattern = async (pattern) => {
    try {
        if (!redis) return null;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(keys);
        }
    } catch (error) {
        console.error(`Error deleting cache pattern ${pattern}:`, error.message);
    }
};
