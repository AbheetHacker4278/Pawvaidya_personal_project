import si from 'systeminformation';
import mongoose from 'mongoose';
import redis from '../config/redis.js';
import { v2 as cloudinary } from 'cloudinary';
import supabase from '../config/supabase.js';
import { transporter } from '../config/nodemailer.js';
import HEALTH_REPORT_TEMPLATE from '../mailservice/healthReportTemplate.js';
import dotenv from 'dotenv';
dotenv.config();

export const sendHealthReport = async () => {
    try {
        console.log("Generating Automated Health Report...");

        // 1. Collect Redis Stats
        let redisStats = {
            hitRate: "0",
            memory: "0B",
            opsPerSec: "0",
            uptimeDays: "0"
        };

        if (redis) {
            try {
                const info = await redis.info();
                const stats = {};
                info.split('\r\n').forEach(line => {
                    const parts = line.split(':');
                    if (parts.length === 2) stats[parts[0]] = parts[1];
                });

                const hits = parseInt(stats.keyspace_hits) || 0;
                const misses = parseInt(stats.keyspace_misses) || 0;
                const total = hits + misses;

                redisStats = {
                    hitRate: total > 0 ? ((hits / total) * 100).toFixed(1) : "0",
                    missRate: total > 0 ? ((misses / total) * 100).toFixed(1) : "0",
                    emat: total > 0 ? (((hits * 1.5) + (misses * 120)) / total).toFixed(2) : "0.00",
                    memory: stats.used_memory_human || "0B",
                    opsPerSec: stats.instantaneous_ops_per_sec || "0",
                    uptimeDays: stats.uptime_in_days || "0"
                };
            } catch (err) {
                console.error("Redis health fetch failed:", err.message);
            }
        }

        // 2. Collect System Stats
        const [cpu, mem, os] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.time()
        ]);

        const systemStats = {
            cpuLoad: cpu.currentLoad.toFixed(1),
            memUsage: ((mem.active / mem.total) * 100).toFixed(1),
            memUsed: (mem.active / (1024 * 1024 * 1024)).toFixed(1) + " GB",
            memTotal: (mem.total / (1024 * 1024 * 1024)).toFixed(1) + " GB",
            uptime: (os.uptime / (60 * 60)).toFixed(1) + " hours"
        };

        // 3. Service Status
        const services = {
            mongodb: mongoose.connection.readyState === 1 ? "Operational" : "Disconnected",
            redis: redis && redis.status === 'ready' ? "Operational" : "Offline",
            cloudinary: cloudinary.config().cloud_name ? "Operational" : "Misconfigured",
            supabase: supabase ? "Operational" : "Offline"
        };

        const timestamp = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'full',
            timeStyle: 'short'
        });

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: process.env.ADMIN_EMAIL, // Send to actual admin
            subject: `PawVaidya Systems Report • ${timestamp}`,
            html: HEALTH_REPORT_TEMPLATE({
                redis: redisStats,
                system: systemStats,
                services: services,
                timestamp: timestamp
            })
        };

        await transporter.sendMail(mailOptions);
        console.log("Health Report Sent Successfully.");
        return true;
    } catch (error) {
        console.error("Critical Health Report Failure:", error);
        return false;
    }
};
