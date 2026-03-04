import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AdminContext } from '../context/AdminContext';
import axios from 'axios';
import {
    Activity, Server, Zap, RefreshCw, CheckCircle, XCircle, AlertTriangle,
    Database, Cloud, Mail, BrainCircuit, Gauge, Wifi, HardDrive, Cpu,
    Clock, MemoryStick, CircleDot, Thermometer, Fan
} from 'lucide-react';

const SERVICE_META = {
    mongodb: { label: 'MongoDB', icon: Database, color: '#10b981', bgGrad: 'from-emerald-500 to-teal-600', lightBg: 'bg-emerald-50', lightText: 'text-emerald-700', lightBorder: 'border-emerald-200', emoji: '🍃' },
    cloudinary: { label: 'Cloudinary', icon: Cloud, color: '#3b82f6', bgGrad: 'from-blue-500 to-indigo-600', lightBg: 'bg-blue-50', lightText: 'text-blue-700', lightBorder: 'border-blue-200', emoji: '☁️' },
    nodemailer: { label: 'Nodemailer', icon: Mail, color: '#f59e0b', bgGrad: 'from-amber-500 to-orange-600', lightBg: 'bg-amber-50', lightText: 'text-amber-700', lightBorder: 'border-amber-200', emoji: '📨' },
    supabase: { label: 'Supabase', icon: Server, color: '#8b5cf6', bgGrad: 'from-violet-500 to-purple-600', lightBg: 'bg-violet-50', lightText: 'text-violet-700', lightBorder: 'border-violet-200', emoji: '⚡' },
    gemini: { label: 'Gemini AI', icon: BrainCircuit, color: '#ec4899', bgGrad: 'from-pink-500 to-rose-600', lightBg: 'bg-pink-50', lightText: 'text-pink-700', lightBorder: 'border-pink-200', emoji: '🧠' },
};

const StatusBadge = ({ status }) => {
    const config = {
        online: { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500', label: 'Online' },
        degraded: { color: 'bg-amber-100 text-amber-700 border-amber-300', dot: 'bg-amber-500', label: 'Degraded' },
        offline: { color: 'bg-rose-100 text-rose-700 border-rose-300', dot: 'bg-rose-500', label: 'Offline' },
    }[status] || { color: 'bg-gray-100 text-gray-600 border-gray-300', dot: 'bg-gray-400', label: 'Unknown' };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${config.color}`}>
            <span className={`w-2 h-2 rounded-full ${config.dot} ${status === 'online' ? 'animate-pulse' : ''}`} />
            {config.label}
        </span>
    );
};

const LatencyBar = ({ latency, maxMs = 2000 }) => {
    const pct = Math.min((latency / maxMs) * 100, 100);
    const color = latency < 200 ? 'bg-emerald-500' : latency < 800 ? 'bg-amber-500' : 'bg-rose-500';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 min-w-[36px] text-right">{latency}ms</span>
        </div>
    );
};

const ServiceCard = ({ serviceKey, service }) => {
    const meta = SERVICE_META[serviceKey];
    if (!meta || !service) return null;
    const Icon = meta.icon;
    const details = service.details || {};

    return (
        <div className={`group relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 overflow-hidden`}>
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${meta.bgGrad} opacity-50 group-hover:opacity-100 transition-opacity`} />

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${meta.lightBg} ${meta.lightText} group-hover:scale-110 transition-transform`}>
                        <Icon size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">{meta.label}</h3>
                        <LatencyBar latency={service.latency || 0} />
                    </div>
                </div>
                <StatusBadge status={service.status} />
            </div>

            {/* Error */}
            {service.error && (
                <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-100">
                    <p className="text-[10px] text-rose-600 font-medium leading-relaxed">{service.error}</p>
                </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {Object.entries(details).filter(([k, v]) => v !== null && v !== undefined && k !== 'opcounters').map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center py-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate mr-2">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
                        <span className="text-[10px] font-semibold text-slate-600 text-right truncate max-w-[100px]" title={String(val)}>{String(val)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CongestionMeter = ({ congestion }) => {
    if (!congestion || congestion.error) return null;
    const heapPct = parseFloat(congestion.memoryUsage?.heapPercent || 0);
    const heapColor = heapPct < 60 ? 'from-emerald-400 to-emerald-600' : heapPct < 80 ? 'from-amber-400 to-amber-600' : 'from-rose-400 to-rose-600';

    const metrics = [
        { icon: Wifi, label: 'Active Sockets', value: congestion.activeSockets || 0, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { icon: MemoryStick, label: 'Heap Used', value: congestion.memoryUsage?.heapUsed || '0 MB', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { icon: HardDrive, label: 'RSS Memory', value: congestion.memoryUsage?.rss || '0 MB', color: 'text-blue-600', bg: 'bg-blue-50' },
        { icon: Clock, label: 'Uptime', value: congestion.uptimeFormatted || '0h 0m', color: 'text-amber-600', bg: 'bg-amber-50' },
        { icon: Cpu, label: 'Node Version', value: congestion.nodeVersion || 'N/A', color: 'text-violet-600', bg: 'bg-violet-50' },
        { icon: CircleDot, label: 'Total DB Ops', value: (congestion.totalOps || 0).toLocaleString(), color: 'text-rose-600', bg: 'bg-rose-50' },
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <Gauge size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">Real-Time Data Congestion</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Server load & resource utilization</p>
                </div>
            </div>

            {/* Heap Pressure Bar */}
            <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Memory Pressure</span>
                    <span className={`text-xs font-extrabold ${heapPct < 60 ? 'text-emerald-600' : heapPct < 80 ? 'text-amber-600' : 'text-rose-600'}`}>{heapPct}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${heapColor} rounded-full transition-all duration-1000`} style={{ width: `${heapPct}%` }} />
                </div>
                <div className="flex justify-between mt-1.5 text-[9px] text-slate-400 font-semibold">
                    <span>{congestion.memoryUsage?.heapUsed}</span>
                    <span>{congestion.memoryUsage?.heapTotal} total</span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
                {metrics.map((m, i) => (
                    <div key={i} className={`${m.bg} rounded-xl p-3 text-center group/metric hover:scale-105 transition-transform`}>
                        <m.icon size={16} className={`${m.color} mx-auto mb-1.5 group-hover/metric:animate-pulse`} />
                        <p className={`text-sm font-extrabold ${m.color}`}>{m.value}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{m.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StressGauge = ({ label, percent, icon: Icon, detail, subDetail }) => {
    const pct = parseFloat(percent) || 0;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (pct / 100) * circumference;
    const severity = pct < 50 ? 'low' : pct < 75 ? 'medium' : pct < 90 ? 'high' : 'critical';
    const colors = {
        low: { stroke: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Low' },
        medium: { stroke: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-600', label: 'Medium' },
        high: { stroke: '#f97316', bg: 'bg-orange-50', text: 'text-orange-600', label: 'High' },
        critical: { stroke: '#ef4444', bg: 'bg-rose-50', text: 'text-rose-600', label: 'Critical' },
    }[severity];

    return (
        <div className="flex flex-col items-center group">
            <div className="relative w-[100px] h-[100px] group-hover:scale-105 transition-transform">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
                    <circle
                        cx="50" cy="50" r={radius} fill="none"
                        stroke={colors.stroke} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-lg font-black ${colors.text}`}>{pct}%</span>
                    <Icon size={12} className={`${colors.text} mt-0.5`} />
                </div>
            </div>
            <p className="text-xs font-bold text-slate-700 mt-2">{label}</p>
            <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 ${colors.bg} ${colors.text}`}>
                {colors.label}
            </span>
            <p className="text-[9px] text-slate-400 font-semibold mt-1 text-center">{detail}</p>
            {subDetail && <p className="text-[8px] text-slate-400 text-center">{subDetail}</p>}
        </div>
    );
};

const SystemStressGauges = ({ congestion }) => {
    const stress = congestion?.systemStress;
    if (!stress) return null;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                    <Activity size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">System Stress Levels</h3>
                    <p className="text-[10px] text-slate-400 font-medium">CPU · RAM · Storage pressure</p>
                </div>
            </div>

            <div className="flex items-start justify-around">
                <StressGauge
                    label="CPU"
                    percent={stress.cpu?.percent}
                    icon={Cpu}
                    detail={`${stress.cpu?.cores || 0} Cores @ ${stress.cpu?.speed || 0} MHz`}
                    subDetail={stress.cpu?.model?.substring(0, 30)}
                />
                <StressGauge
                    label="RAM"
                    percent={stress.ram?.percent}
                    icon={MemoryStick}
                    detail={`${stress.ram?.used} / ${stress.ram?.total}`}
                    subDetail={`${stress.ram?.free} free`}
                />
                <StressGauge
                    label="Storage"
                    percent={stress.disk?.percent}
                    icon={HardDrive}
                    detail={`${stress.disk?.used} / ${stress.disk?.total}`}
                    subDetail={`${stress.disk?.free} free`}
                />
            </div>

            {stress.cpu?.model && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate" title={stress.cpu.model}>
                        {stress.cpu.model}
                    </p>
                </div>
            )}
        </div>
    );
};

const ThermalMonitor = ({ congestion }) => {
    const thermals = congestion?.thermals;
    if (!thermals) return null;

    const cpuTemp = thermals.cpu?.main;
    const maxTemp = thermals.cpu?.max;
    const cores = thermals.cpu?.cores || [];
    const fans = thermals.fans || [];

    // Temperature severity
    const getTempSeverity = (t) => {
        if (t === null || t === undefined) return { color: '#94a3b8', label: 'N/A', bg: 'bg-slate-100' };
        if (t < 50) return { color: '#10b981', label: 'Cool', bg: 'bg-emerald-50' };
        if (t < 70) return { color: '#f59e0b', label: 'Warm', bg: 'bg-amber-50' };
        if (t < 85) return { color: '#f97316', label: 'Hot', bg: 'bg-orange-50' };
        return { color: '#ef4444', label: 'Critical', bg: 'bg-rose-50' };
    };

    const severity = getTempSeverity(cpuTemp);
    const mercuryHeight = cpuTemp !== null ? Math.min(Math.max((cpuTemp / 105) * 100, 5), 100) : 5;

    // Fan animation speed based on RPM
    const maxRpm = Math.max(...fans.map(f => f.rpm), 1);
    const primaryFanRpm = fans.length > 0 ? fans[0].rpm : 0;
    const fanDuration = primaryFanRpm > 0 ? Math.max(0.1, 3 - (primaryFanRpm / 2000) * 2.8) : 0;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
                    <Thermometer size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">Thermal Monitor</h3>
                    <p className="text-[10px] text-slate-400 font-medium">CPU temperature & fan speed</p>
                </div>
            </div>

            <div className="flex items-start gap-6">
                {/* Thermometer Column */}
                <div className="flex flex-col items-center">
                    <div className="relative w-12 h-32">
                        {/* Thermometer body */}
                        <svg viewBox="0 0 48 128" className="w-full h-full">
                            {/* Tube background */}
                            <rect x="16" y="8" width="16" height="88" rx="8" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5" />
                            {/* Mercury fill */}
                            <clipPath id="tubeClip">
                                <rect x="16" y="8" width="16" height="88" rx="8" />
                            </clipPath>
                            <rect
                                x="16" width="16" rx="8"
                                y={8 + 88 * (1 - mercuryHeight / 100)}
                                height={88 * (mercuryHeight / 100)}
                                fill={severity.color}
                                clipPath="url(#tubeClip)"
                                className="transition-all duration-1000"
                            >
                                <animate
                                    attributeName="opacity"
                                    values="0.85;1;0.85"
                                    dur="2s"
                                    repeatCount="indefinite"
                                />
                            </rect>
                            {/* Bulb */}
                            <circle cx="24" cy="112" r="14" fill={severity.color} stroke="#e2e8f0" strokeWidth="1.5">
                                <animate
                                    attributeName="r"
                                    values="13;14.5;13"
                                    dur="2s"
                                    repeatCount="indefinite"
                                />
                            </circle>
                            {/* Tick marks */}
                            {[0, 25, 50, 75, 100].map((tick) => (
                                <g key={tick}>
                                    <line
                                        x1="34" y1={96 - (tick / 100) * 88}
                                        x2="40" y2={96 - (tick / 100) * 88}
                                        stroke="#cbd5e1" strokeWidth="1"
                                    />
                                    <text
                                        x="43" y={96 - (tick / 100) * 88 + 3}
                                        fontSize="6" fill="#94a3b8" fontWeight="600"
                                    >{tick}°</text>
                                </g>
                            ))}
                        </svg>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-2xl font-black" style={{ color: severity.color }}>
                            {cpuTemp !== null ? `${cpuTemp}°C` : '--'}
                        </p>
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${severity.bg}`}
                            style={{ color: severity.color }}>
                            {severity.label}
                        </span>
                        {maxTemp !== null && maxTemp !== cpuTemp && (
                            <p className="text-[9px] text-slate-400 mt-1">Max: {maxTemp}°C</p>
                        )}
                    </div>
                </div>

                {/* Fan + Details Column */}
                <div className="flex-1">
                    {/* Animated Fan */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-16 h-16">
                            <svg viewBox="0 0 64 64" className="w-full h-full">
                                <circle cx="32" cy="32" r="30" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                                <g
                                    style={{
                                        transformOrigin: '32px 32px',
                                        animation: fanDuration > 0 ? `spin ${fanDuration}s linear infinite` : 'none'
                                    }}
                                >
                                    {[0, 72, 144, 216, 288].map((angle) => (
                                        <path
                                            key={angle}
                                            d="M32,32 Q28,18 32,6 Q36,18 32,32"
                                            fill="#64748b"
                                            fillOpacity="0.7"
                                            transform={`rotate(${angle}, 32, 32)`}
                                        />
                                    ))}
                                </g>
                                <circle cx="32" cy="32" r="4" fill="#475569" />
                                <circle cx="32" cy="32" r="2" fill="#94a3b8" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-700">
                                {primaryFanRpm > 0 ? `${primaryFanRpm} RPM` : 'N/A'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Fan Speed</p>
                        </div>
                    </div>

                    {/* Per-core Temps */}
                    {cores.length > 0 && (
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Core Temperatures</p>
                            <div className="space-y-1.5">
                                {cores.slice(0, 8).map((temp, i) => {
                                    const coreSeverity = getTempSeverity(temp);
                                    const pct = temp ? Math.min((temp / 105) * 100, 100) : 0;
                                    return (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="text-[8px] font-bold text-slate-400 w-8">C{i}</span>
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${pct}%`, backgroundColor: coreSeverity.color }}
                                                />
                                            </div>
                                            <span className="text-[9px] font-bold min-w-[30px] text-right" style={{ color: coreSeverity.color }}>
                                                {temp !== null ? `${temp}°` : '--'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* All Fans */}
                    {fans.length > 1 && (
                        <div className="mt-3">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">All Fans</p>
                            <div className="flex flex-wrap gap-2">
                                {fans.map((f, i) => (
                                    <div key={i} className="bg-slate-50 rounded-lg px-2.5 py-1.5 text-center">
                                        <Fan size={10} className="text-slate-500 mx-auto mb-0.5" />
                                        <p className="text-[10px] font-bold text-slate-600">{f.rpm} RPM</p>
                                        <p className="text-[7px] text-slate-400">{f.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No data fallback */}
                    {cpuTemp === null && fans.length === 0 && (
                        <div className="p-3 bg-slate-50 rounded-xl text-center">
                            <p className="text-[10px] text-slate-400 font-medium">
                                ⚡ Sensor data may require admin privileges or may not be available on this hardware.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* CSS for fan spin animation */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const OverallStatus = ({ overallStatus, statusCounts, timestamp, onRefresh, loading, autoRefresh, setAutoRefresh }) => {
    const config = {
        healthy: { bg: 'bg-gradient-to-r from-emerald-500 to-teal-500', text: 'All Systems Operational', icon: CheckCircle, emoji: '✅' },
        warning: { bg: 'bg-gradient-to-r from-amber-500 to-orange-500', text: 'Some Services Degraded', icon: AlertTriangle, emoji: '⚠️' },
        critical: { bg: 'bg-gradient-to-r from-rose-500 to-red-600', text: 'Service Disruption Detected', icon: XCircle, emoji: '🚨' },
    }[overallStatus] || { bg: 'bg-gradient-to-r from-gray-400 to-gray-500', text: 'Checking...', icon: Activity, emoji: '⏳' };

    const StatusIcon = config.icon;

    return (
        <div className={`${config.bg} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <StatusIcon size={28} className="drop-shadow" />
                    <div>
                        <h2 className="text-lg font-black tracking-tight">{config.text}</h2>
                        <p className="text-white/70 text-xs font-medium">
                            {statusCounts?.online || 0} online · {statusCounts?.degraded || 0} degraded · {statusCounts?.offline || 0} offline
                            {timestamp && <span className="ml-2">· Updated {new Date(timestamp).toLocaleTimeString()}</span>}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <span className="text-[10px] font-bold text-white/90">Auto</span>
                        <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="w-3 h-3 accent-white" />
                    </div>
                    <button
                        onClick={onRefresh}
                        className={`p-2.5 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all ${loading ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const ServiceHealthDashboard = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [history, setHistory] = useState([]);

    const fetchHealth = useCallback(async () => {
        setLoading(true);
        try {
            const { data: res } = await axios.get(`${backendurl}/api/admin/service-health`, {
                headers: { atoken }
            });
            if (res.success) {
                setData(res);
                setHistory(prev => [...prev.slice(-9), { time: new Date(), status: res.overallStatus }]);
            }
        } catch (error) {
            setData({ overallStatus: 'critical', services: {}, congestion: {}, statusCounts: { offline: 5 } });
        } finally {
            setLoading(false);
        }
    }, [atoken, backendurl]);

    useEffect(() => { fetchHealth(); }, [fetchHealth]);

    useEffect(() => {
        let timer;
        if (autoRefresh) {
            timer = setInterval(fetchHealth, 30000);
        }
        return () => clearInterval(timer);
    }, [autoRefresh, fetchHealth]);

    return (
        <div className="space-y-4">
            <OverallStatus
                overallStatus={data?.overallStatus}
                statusCounts={data?.statusCounts}
                timestamp={data?.timestamp}
                onRefresh={fetchHealth}
                loading={loading}
                autoRefresh={autoRefresh}
                setAutoRefresh={setAutoRefresh}
            />

            {/* Health Heartbeat History */}
            {history.length > 1 && (
                <div className="flex items-center gap-2 px-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">History</span>
                    <div className="flex items-center gap-1">
                        {history.map((h, i) => (
                            <div
                                key={i}
                                title={`${h.status} at ${h.time.toLocaleTimeString()}`}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${h.status === 'healthy' ? 'bg-emerald-500' :
                                    h.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                                    } ${i === history.length - 1 ? 'scale-125 ring-2 ring-offset-1 ring-current' : 'opacity-60'}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Service Cards Grid */}
            {data?.services && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Object.entries(data.services).map(([key, service]) => (
                        <ServiceCard key={key} serviceKey={key} service={service} />
                    ))}
                    <CongestionMeter congestion={data.congestion} />
                    <SystemStressGauges congestion={data.congestion} />
                    <ThermalMonitor congestion={data.congestion} />
                </div>
            )}

            {/* Loading State */}
            {!data && loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-sm text-slate-500 font-medium">Running health checks...</p>
                </div>
            )}
        </div>
    );
};

export default ServiceHealthDashboard;
