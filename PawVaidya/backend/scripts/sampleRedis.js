import 'dotenv/config';
import redis from '../config/redis.js';

const sampleRedis = async () => {
    try {
        if (!redis) {
            console.log("Redis not initialized");
            process.exit(1);
        }
        const info = await redis.info();
        const stats = await redis.info('stats');
        console.log("--- REDIS INFO ---");
        console.log(info.split('\r\n').filter(l => l.includes('total_')).join('\n'));
        console.log("--- STATS ---");
        console.log(stats.split('\r\n').filter(l => l.includes('net')).join('\n'));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
};

sampleRedis();
