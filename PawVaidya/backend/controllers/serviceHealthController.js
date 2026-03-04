import mongoose from 'mongoose';
import os from 'os';
import { execSync } from 'child_process';
import si from 'systeminformation';
import { v2 as cloudinary } from 'cloudinary';
import { transporter } from '../config/nodemailer.js';
import supabase from '../config/supabase.js';
import { getIO } from '../socketServer.js';

/**
 * Comprehensive Service Health Check Controller
 * GET /api/admin/service-health
 */
export const getServiceHealth = async (req, res) => {
    try {
        const services = {};

        // ── 1. MongoDB Health ──────────────────────────────────────────────
        const mongoStart = Date.now();
        try {
            const adminDb = mongoose.connection.db.admin();
            await adminDb.ping();
            const mongoLatency = Date.now() - mongoStart;

            const dbStats = await mongoose.connection.db.command({ dbStats: 1 });
            const colls = await mongoose.connection.db.listCollections().toArray();
            const serverStatus = await mongoose.connection.db.command({ serverStatus: 1 }).catch(() => ({}));

            services.mongodb = {
                status: 'online',
                latency: mongoLatency,
                details: {
                    host: mongoose.connection.host,
                    name: mongoose.connection.name,
                    readyState: ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][mongoose.connection.readyState] || 'Unknown',
                    dataSize: (dbStats.dataSize / (1024 * 1024)).toFixed(2) + ' MB',
                    storageSize: (dbStats.storageSize / (1024 * 1024)).toFixed(2) + ' MB',
                    collections: colls.length,
                    documents: dbStats.objects || 0,
                    indexes: dbStats.indexes || 0,
                    connections: serverStatus.connections?.current || 'N/A',
                    opcounters: serverStatus.opcounters || null,
                    uptime: serverStatus.uptime ? Math.floor(serverStatus.uptime / 3600) + 'h ' + Math.floor((serverStatus.uptime % 3600) / 60) + 'm' : 'N/A',
                    version: serverStatus.version || 'N/A'
                }
            };
        } catch (error) {
            services.mongodb = {
                status: mongoose.connection.readyState === 1 ? 'degraded' : 'offline',
                latency: Date.now() - mongoStart,
                error: error.message,
                details: {
                    readyState: ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][mongoose.connection.readyState] || 'Unknown'
                }
            };
        }

        // ── 2. Cloudinary Health ──────────────────────────────────────────
        const cloudinaryStart = Date.now();
        try {
            const pingResult = await cloudinary.api.ping();
            const cloudinaryLatency = Date.now() - cloudinaryStart;

            // Get usage stats
            let usage = {};
            try {
                usage = await cloudinary.api.usage();
            } catch (e) { /* usage might fail on free plans */ }

            services.cloudinary = {
                status: pingResult.status === 'ok' ? 'online' : 'degraded',
                latency: cloudinaryLatency,
                details: {
                    cloudName: process.env.CLOUDINARY_NAME || 'N/A',
                    plan: usage.plan || 'N/A',
                    storageUsed: usage.storage?.used_bytes ? (usage.storage.used_bytes / (1024 * 1024)).toFixed(2) + ' MB' : (typeof usage.storage === 'number' ? (usage.storage / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A'),
                    bandwidth: usage.bandwidth?.used_bytes ? (usage.bandwidth.used_bytes / (1024 * 1024)).toFixed(2) + ' MB' : (typeof usage.bandwidth === 'number' ? (usage.bandwidth / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A'),
                    totalAssets: usage.resources ?? usage.total_resources ?? 'N/A',
                    transformations: usage.transformations?.usage ?? usage.transformations ?? 'N/A'
                }
            };
        } catch (error) {
            services.cloudinary = {
                status: 'offline',
                latency: Date.now() - cloudinaryStart,
                error: error.message,
                details: {
                    cloudName: process.env.CLOUDINARY_NAME || 'Not configured',
                    configured: !!(process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY)
                }
            };
        }

        // ── 3. Nodemailer / SMTP Health ───────────────────────────────────
        const smtpStart = Date.now();
        try {
            await transporter.verify();
            const smtpLatency = Date.now() - smtpStart;

            services.nodemailer = {
                status: 'online',
                latency: smtpLatency,
                details: {
                    host: 'smtp-relay.brevo.com',
                    port: 587,
                    secure: false,
                    user: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 6) + '...' : 'Not configured',
                    provider: 'Brevo (Sendinblue)',
                    protocol: 'SMTP/TLS'
                }
            };
        } catch (error) {
            services.nodemailer = {
                status: 'offline',
                latency: Date.now() - smtpStart,
                error: error.message,
                details: {
                    host: 'smtp-relay.brevo.com',
                    port: 587,
                    configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
                    provider: 'Brevo (Sendinblue)'
                }
            };
        }

        // ── 4. Supabase Health ────────────────────────────────────────────
        const supabaseStart = Date.now();
        try {
            const { data, error } = await supabase.from('activity_logs').select('id', { count: 'exact', head: true });
            const supabaseLatency = Date.now() - supabaseStart;

            if (error) {
                const isMissingTable = error.message?.includes('schema cache');
                services.supabase = {
                    status: isMissingTable ? 'degraded' : 'offline',
                    latency: supabaseLatency,
                    error: isMissingTable ? 'Tables not created yet. Run SUPABASE_SETUP.md SQL.' : error.message,
                    details: {
                        url: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'Not configured',
                        configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
                        tablesReady: !isMissingTable
                    }
                };
            } else {
                services.supabase = {
                    status: 'online',
                    latency: supabaseLatency,
                    details: {
                        url: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'N/A',
                        configured: true,
                        tablesReady: true
                    }
                };
            }
        } catch (error) {
            services.supabase = {
                status: 'offline',
                latency: Date.now() - supabaseStart,
                error: error.message,
                details: {
                    configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
                }
            };
        }

        // ── 5. Gemini AI Health ───────────────────────────────────────────
        try {
            services.gemini = {
                status: process.env.GEMINI_API_KEY ? 'online' : 'offline',
                latency: 0,
                details: {
                    configured: !!process.env.GEMINI_API_KEY,
                    keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 8) + '...' : 'Not set',
                    model: 'Gemini Pro'
                }
            };
        } catch (error) {
            services.gemini = {
                status: 'offline',
                latency: 0,
                error: error.message,
                details: { configured: false }
            };
        }

        // ── 6. Data Congestion Metrics ────────────────────────────────────
        let congestion = {};
        try {
            const io = getIO();
            const activeSockets = io.engine.clientsCount || 0;

            // Get MongoDB ops/sec from serverStatus if available
            let opsPerSec = 0;
            try {
                const serverStat = await mongoose.connection.db.command({ serverStatus: 1 });
                const counters = serverStat.opcounters || {};
                opsPerSec = (counters.insert || 0) + (counters.query || 0) + (counters.update || 0) + (counters.delete || 0);
            } catch (e) { /* Atlas might not support serverStatus */ }

            // Memory usage
            const memUsage = process.memoryUsage();

            congestion = {
                activeSockets,
                memoryUsage: {
                    heapUsed: (memUsage.heapUsed / (1024 * 1024)).toFixed(2) + ' MB',
                    heapTotal: (memUsage.heapTotal / (1024 * 1024)).toFixed(2) + ' MB',
                    rss: (memUsage.rss / (1024 * 1024)).toFixed(2) + ' MB',
                    heapPercent: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1)
                },
                processUptime: Math.floor(process.uptime()) + 's',
                uptimeFormatted: (() => {
                    const s = Math.floor(process.uptime());
                    const h = Math.floor(s / 3600);
                    const m = Math.floor((s % 3600) / 60);
                    return `${h}h ${m}m`;
                })(),
                nodeVersion: process.version,
                platform: process.platform,
                cpuUsage: process.cpuUsage(),
                totalOps: opsPerSec
            };

            // ── 7. System Stress Metrics (CPU, RAM, Disk) ─────────────────
            const cpus = os.cpus();
            const cpuCount = cpus.length;

            // Calculate CPU usage from all cores
            let totalIdle = 0, totalTick = 0;
            cpus.forEach(cpu => {
                const t = cpu.times;
                totalIdle += t.idle;
                totalTick += t.user + t.nice + t.sys + t.irq + t.idle;
            });
            const cpuUsagePercent = ((1 - totalIdle / totalTick) * 100).toFixed(1);

            // System RAM
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const ramPercent = ((usedMem / totalMem) * 100).toFixed(1);

            // Disk usage (cross-platform)
            let diskStress = { percent: 0, used: 'N/A', total: 'N/A', free: 'N/A' };
            try {
                if (process.platform === 'win32') {
                    const out = execSync('wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:csv', { encoding: 'utf8', timeout: 3000 });
                    const lines = out.trim().split('\n').filter(l => l.trim());
                    const last = lines[lines.length - 1].split(',');
                    const freeSpace = parseInt(last[1]);
                    const totalSpace = parseInt(last[2]);
                    if (!isNaN(freeSpace) && !isNaN(totalSpace) && totalSpace > 0) {
                        const usedSpace = totalSpace - freeSpace;
                        diskStress = {
                            percent: ((usedSpace / totalSpace) * 100).toFixed(1),
                            used: (usedSpace / (1024 ** 3)).toFixed(1) + ' GB',
                            total: (totalSpace / (1024 ** 3)).toFixed(1) + ' GB',
                            free: (freeSpace / (1024 ** 3)).toFixed(1) + ' GB'
                        };
                    }
                } else {
                    const out = execSync("df -B1 / | tail -1", { encoding: 'utf8', timeout: 3000 });
                    const parts = out.trim().split(/\s+/);
                    const totalSpace = parseInt(parts[1]);
                    const usedSpace = parseInt(parts[2]);
                    const freeSpace = parseInt(parts[3]);
                    if (!isNaN(totalSpace) && totalSpace > 0) {
                        diskStress = {
                            percent: ((usedSpace / totalSpace) * 100).toFixed(1),
                            used: (usedSpace / (1024 ** 3)).toFixed(1) + ' GB',
                            total: (totalSpace / (1024 ** 3)).toFixed(1) + ' GB',
                            free: (freeSpace / (1024 ** 3)).toFixed(1) + ' GB'
                        };
                    }
                }
            } catch (e) { /* disk check optional */ }

            congestion.systemStress = {
                cpu: {
                    percent: parseFloat(cpuUsagePercent),
                    cores: cpuCount,
                    model: cpus[0]?.model || 'Unknown',
                    speed: cpus[0]?.speed || 0,
                    loadAvg: os.loadavg().map(l => l.toFixed(2))
                },
                ram: {
                    percent: parseFloat(ramPercent),
                    used: (usedMem / (1024 ** 3)).toFixed(2) + ' GB',
                    total: (totalMem / (1024 ** 3)).toFixed(2) + ' GB',
                    free: (freeMem / (1024 ** 3)).toFixed(2) + ' GB'
                },
                disk: diskStress
            };

            // ── 8. Temperature & Fan Speed (via systeminformation) ────────
            try {
                const [tempData, fanData] = await Promise.all([
                    si.cpuTemperature(),
                    si.fans()
                ]);

                congestion.thermals = {
                    cpu: {
                        main: tempData.main !== null ? tempData.main : null,
                        max: tempData.max !== null ? tempData.max : null,
                        cores: (tempData.cores && tempData.cores.length > 0) ? tempData.cores : [],
                        chipset: tempData.chipset || null,
                        socket: tempData.socket || []
                    },
                    fans: fanData && fanData.length > 0 ? fanData.map(f => ({
                        label: f.label || `Fan ${fanData.indexOf(f) + 1}`,
                        rpm: f.speed || 0
                    })) : []
                };
            } catch (e) {
                congestion.thermals = {
                    cpu: { main: null, max: null, cores: [], chipset: null, socket: [] },
                    fans: [],
                    error: e.message
                };
            }
        } catch (error) {
            congestion = { error: error.message };
        }

        // ── Summary ──────────────────────────────────────────────────────
        const statusCounts = { online: 0, degraded: 0, offline: 0 };
        Object.values(services).forEach(s => {
            if (statusCounts[s.status] !== undefined) statusCounts[s.status]++;
        });

        const overallStatus = statusCounts.offline > 0 ? 'critical' :
            statusCounts.degraded > 0 ? 'warning' : 'healthy';

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            overallStatus,
            statusCounts,
            services,
            congestion
        });
    } catch (error) {
        console.error('Service Health Check Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to perform health checks: ' + error.message
        });
    }
};
