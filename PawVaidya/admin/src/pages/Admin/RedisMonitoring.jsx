import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar, Cell, Legend
} from 'recharts';
import {
    Activity, Database, Cpu, Zap, Clock, Users,
    ArrowUpRight, ArrowDownRight, RefreshCw, Server,
    ShieldCheck, AlertCircle, HardDrive, Terminal, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RedisMonitoring = () => {
    const { getRedisStats } = useContext(AdminContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    // Simulated regional data (Upstash mock)
    const [regionalData] = useState([
        { name: 'Saturday', 'asia-northeast1': 0 },
        { name: 'Sunday', 'asia-northeast1': 0 },
        { name: 'Monday', 'asia-northeast1': 0 },
        { name: 'Tuesday', 'asia-northeast1': 0 },
        { name: 'Wednesday', 'asia-northeast1': 7 }
    ]);

    const [bandwidthData] = useState([
        { name: 'Saturday', 'asia-northeast1': 0 },
        { name: 'Sunday', 'asia-northeast1': 0 },
        { name: 'Monday', 'asia-northeast1': 0 },
        { name: 'Tuesday', 'asia-northeast1': 0 },
        { name: 'Wednesday', 'asia-northeast1': 35 }
    ]);

    const fetchStats = async () => {
        const data = await getRedisStats();
        if (data && data !== null) {
            setStats(data);
            setError(null);
            setLastRefresh(new Date());
            setHistory(prev => {
                const newHistory = [...prev, {
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    ops: parseInt(data.opsPerSec),
                    memory: parseFloat(data.memoryRaw) / 1024, // KB
                    hitRate: parseFloat(data.hitRate),
                    missRate: parseFloat(data.missRate),
                    hits: data.hits,
                    misses: data.misses,
                    latency: Math.random() * 2 + 0.5,
                    emat: parseFloat(data.emat),
                    clients: parseInt(data.clients),
                    keys: parseInt(data.keyspace?.split(',')[0].split('=')[1]) || 0
                }];
                return newHistory.slice(-30);
            });
        } else {
            setError("Unable to connect to Redis server. Please check your REDIS_URL environment variable.");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#00A971] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#00A971] font-black uppercase tracking-widest text-xs">Connecting to Redis Clusters...</p>
                </div>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
                    <ShieldAlert size={32} />
                </div>
                <h1 className="text-xl font-bold text-slate-800 mb-2">Connection Failure</h1>
                <p className="text-slate-500 max-w-md mb-8">{error}</p>
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-left max-w-lg mb-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Terminal size={14} /> Troubleshooting
                    </h3>
                    <ul className="text-sm text-slate-600 space-y-2">
                        <li className="flex gap-2"><span>1.</span> <span>Verify <b>REDIS_URL</b> is set in Render Environment Variables.</span></li>
                        <li className="flex gap-2"><span>2.</span> <span>Ensure your Redis provider allows connections from Render's IP range.</span></li>
                        <li className="flex gap-2"><span>3.</span> <span>Check if the URL requires <b>rediss://</b> (SSL) instead of <b>redis://</b>.</span></li>
                    </ul>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 bg-[#00A971] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-100 hover:scale-105 transition-all"
                >
                    <RefreshCw size={18} /> Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 lg:p-12 w-full max-w-[1600px] mx-auto bg-[#F9FAFB] min-h-screen">
            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Real-time Data Monitoring</h1>
                    <p className="text-slate-500 text-sm">Dashboard Analysis of Upstash Redis performance and telemetry.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 uppercase">Primary / asia-northeast1</span>
                    <button onClick={fetchStats} className="p-2 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-all text-slate-600">
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Advanced Metrics Quick Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <MetricHighlight
                    label="Cache Hit Rate"
                    value={`${stats?.hitRate}%`}
                    sub="Efficiency of cache usage"
                    icon={<ArrowUpRight size={20} className="text-emerald-500" />}
                    trend="up"
                />
                <MetricHighlight
                    label="Miss Rate"
                    value={`${stats?.missRate}%`}
                    sub="Database fallback frequency"
                    icon={<ArrowDownRight size={20} className="text-rose-500" />}
                    trend="down"
                />
                <MetricHighlight
                    label="Effective Access Time"
                    value={`${stats?.emat} ms`}
                    sub="Avg response (Cache + DB)"
                    icon={<Timer size={20} className="text-amber-500" />}
                    trend="stable"
                />
            </div>

            {/* Top Overview Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ChartContainer title="Daily Commands by Regions" sub="Last 5 days, calculated according to UTC+0">
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={regionalData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend verticalAlign="bottom" align="right" iconType="rect" />
                            <Bar dataKey="asia-northeast1" fill="#00A971" radius={[4, 4, 0, 0]} barSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="Daily Bandwidth by Regions" sub="Last 5 days, calculated according to UTC+0">
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={bandwidthData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <YAxis unit=" KB" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend verticalAlign="bottom" align="right" iconType="rect" />
                            <Bar dataKey="asia-northeast1" fill="#00A971" radius={[4, 4, 0, 0]} barSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>

            {/* Performance Analysis Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ChartContainer title="Throughput / Miss Rate Analysis">
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="time" hide />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend verticalAlign="bottom" align="right" />
                            <Line type="monotone" dataKey="ops" name="Throughput (ops)" stroke="#3B82F6" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="missRate" name="Miss Rate (%)" stroke="#EF4444" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="Effective Memory Access Time (EMAT) Trend">
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorEmat" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="time" hide />
                            <YAxis unit=" ms" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey="emat" name="EMAT (ms)" stroke="#F59E0B" fillOpacity={1} fill="url(#colorEmat)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>

            {/* Original Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartContainer title="Data Size">
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="time" hide />
                            <YAxis unit=" KB" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey="memory" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="Keyspace">
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="time" hide />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Line type="monotone" dataKey="keys" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>
        </div>
    );
};

const ChartContainer = ({ title, sub, children }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
        {children}
    </div>
);

const MetricHighlight = ({ label, value, sub, icon, trend }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
    >
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h3 className="text-2xl font-black text-slate-900 leading-none mb-2">{value}</h3>
            <p className="text-[10px] text-slate-400 font-medium">{sub}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
            {icon}
        </div>
    </motion.div>
);

export default RedisMonitoring;
