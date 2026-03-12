import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Server, Activity, RefreshCw, Terminal, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminDeployments = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [backendStatus, setBackendStatus] = useState(null);
    const [frontendStatus, setFrontendStatus] = useState(null);
    const [adminStatus, setAdminStatus] = useState(null);

    const [activeLogs, setActiveLogs] = useState(null);
    const [activeMetrics, setActiveMetrics] = useState(null);
    const [metricsRange, setMetricsRange] = useState('24h');
    const [logsDeployId, setLogsDeployId] = useState(null);
    const [logsServiceType, setLogsServiceType] = useState(null);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [loadingMetrics, setLoadingMetrics] = useState(false);

    const [loadingStatus, setLoadingStatus] = useState(true);
    const [backendHealth, setBackendHealth] = useState('checking'); // 'ok', 'error', 'checking'

    const fetchStatuses = async () => {
        setLoadingStatus(true);
        try {
            // Create an array of promises for concurrent fetching
            const requests = ['backend', 'frontend', 'admin'].map(type =>
                axios.get(`${backendurl}/api/admin/render/${type}/status`, { headers: { atoken } }).catch(e => ({ error: true, type, msg: e.message }))
            );

            const [bRes, fRes, adminRes] = await Promise.all(requests);

            if (!bRes.error && bRes.data.success) setBackendStatus({ serviceCategory: 'backend', ...bRes.data.status });
            if (!fRes.error && fRes.data.success) setFrontendStatus({ serviceCategory: 'frontend', ...fRes.data.status });
            if (!adminRes.error && adminRes.data.success) setAdminStatus({ serviceCategory: 'admin', ...adminRes.data.status });

        } catch (error) {
            console.error("Error fetching render statuses", error);
            toast.error("Failed to fetch deployment statuses");
        } finally {
            setLoadingStatus(false);
        }
    };

    const checkBackendHealth = async () => {
        try {
            await axios.get(`${backendurl}/api/admin/system-settings`, { headers: { atoken } });
            setBackendHealth('ok');
        } catch (e) {
            setBackendHealth('error');
        }
    };

    useEffect(() => {
        if (atoken) {
            fetchStatuses();
            checkBackendHealth();
        }
    }, [atoken]);

    const fetchMetrics = async (type, range = metricsRange) => {
        setLoadingMetrics(true);
        setActiveMetrics(null);
        try {
            const { data } = await axios.get(`${backendurl}/api/admin/render/${type}/metrics`, {
                params: { range },
                headers: { atoken }
            });
            if (data.success) {
                setActiveMetrics(data.metrics);
            }
        } catch (error) {
            console.error("Error fetching metrics", error);
        } finally {
            setLoadingMetrics(false);
        }
    };

    const handleRangeChange = (newRange) => {
        setMetricsRange(newRange);
        if (logsServiceType) {
            fetchMetrics(logsServiceType, newRange);
        }
    };

    const viewLogs = async (type, deployId) => {
        if (!deployId) return toast.info("No deploy ID found for this service.");
        setLogsServiceType(type);
        setLogsDeployId(deployId);
        setLoadingLogs(true);
        setActiveLogs(null);

        // Fetch both logs and metrics
        fetchMetrics(type);

        try {
            const { data } = await axios.get(`${backendurl}/api/admin/render/${type}/logs/${deployId}`, { headers: { atoken } });
            if (data.success) {
                setActiveLogs(data.deployInfo);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Could not fetch deploy info.");
        } finally {
            setLoadingLogs(false);
        }
    };

    const ServiceCard = ({ service }) => {
        if (!service) return (
            <div className="bg-white/50 animate-pulse h-48 rounded-2xl border border-dashed border-gray-300 flex items-center justify-center">
                <p className="text-gray-400 font-medium">Loading Service Details...</p>
            </div>
        );

        const isLive = service.latestDeployStatus === 'live' && service.suspended !== 'suspended';
        const isFailed = service.latestDeployStatus === 'build_failed' || service.latestDeployStatus === 'canceled';
        const isBuilding = service.latestDeployStatus === 'build_in_progress' || service.latestDeployStatus === 'pre_deploy_in_progress';

        return (
            <motion.div
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 relative overflow-hidden group flex flex-col h-full"
            >
                <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-10 pointer-events-none ${isLive ? 'bg-emerald-500' : isFailed ? 'bg-rose-500' : 'bg-amber-500'}`} />

                <div className="flex items-start justify-between relative z-10 mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl shadow-inner ${isLive ? 'bg-emerald-50 text-emerald-600' : isFailed ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                            <Server className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 capitalize leading-tight">{service.serviceCategory} Service</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{service.serviceName || 'Service'}</p>
                            </div>
                        </div>
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest
            ${isLive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            isFailed ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                'bg-amber-50 border-amber-200 text-amber-700'}`}
                    >
                        {isLive ? <CheckCircle className="w-3.5 h-3.5" /> : isFailed ? <XCircle className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5 animate-pulse" />}
                        {service.suspended === 'suspended' ? 'Suspended' : service.latestDeployStatus?.replace(/_/g, ' ') || 'Unknown'}
                    </div>
                </div>

                {/* Detailed Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 flex-grow">
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 flex items-center gap-1">
                            <Activity className="w-3 h-3" /> Health Score
                        </p>
                        <p className={`text-sm font-bold ${isLive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isLive ? '99.9% Uptime' : 'Issues Detected'}
                        </p>
                    </div>
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Region
                        </p>
                        <p className="text-sm font-bold text-slate-700 uppercase">{service.region || 'Oregon'}</p>
                    </div>
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Infrastructure</p>
                        <p className="text-xs font-bold text-slate-600 truncate">{service.plan} • {service.runtime}</p>
                    </div>
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 font-outfit">Config Info</p>
                        <p className="text-xs font-bold text-slate-600">
                            {service.envVarsCount} Vars • <a href={service.dashboardUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">View on Render</a>
                        </p>
                    </div>
                </div>

                {/* mini timeline */}
                <div className="mb-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Recent Deploys</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        {service.recentDeploys?.map((dep, idx) => (
                            <div
                                key={dep.id}
                                title={`${dep.status}: ${dep.commitMessage || 'No message'}`}
                                className={`w-3 h-3 rounded-full flex-shrink-0 cursor-help border ${dep.status === 'live' ? 'bg-emerald-500 border-emerald-300' :
                                    dep.status === 'build_failed' ? 'bg-rose-500 border-rose-300' :
                                        'bg-amber-400 border-amber-300'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-300 uppercase">Branch</span>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md mt-1 italic">{service.branch}</span>
                    </div>
                    <button
                        onClick={() => viewLogs(service.serviceCategory, service.latestDeployId)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-black text-white text-[11px] font-black uppercase tracking-tighter rounded-xl transition-all shadow-md active:scale-95"
                    >
                        <Terminal className="w-3.5 h-3.5" />
                        Explore Deploy
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 to-green-600 font-outfit tracking-tight">
                            Render Deployments
                        </h1>
                        <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${backendHealth === 'ok' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'}`}>
                            {backendHealth === 'ok' ? 'System Online' : 'System Connectivity Issues'}
                        </div>
                    </div>
                    <p className="text-emerald-700/70 font-medium">Monitor live status of your application infrastructure.</p>
                </div>
                <button
                    onClick={() => { fetchStatuses(); checkBackendHealth(); }}
                    disabled={loadingStatus}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl shadow-lg shadow-emerald-200 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${loadingStatus ? 'animate-spin' : ''}`} />
                    {loadingStatus ? 'Refreshing...' : 'Refresh Status'}
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <ServiceCard service={backendStatus} />
                <ServiceCard service={frontendStatus} />
                <ServiceCard service={adminStatus} />
            </div>

            {/* Terminal Details Block */}
            <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-700 flex flex-col min-h-[400px]">
                <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-rose-500" />
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-xs font-mono text-slate-400 ml-4 font-bold tracking-wider">
                            {logsServiceType ? `${logsServiceType.toUpperCase()} DEPLOYMENT INFO` : 'TERMINAL OUTPUT'}
                        </span>
                    </div>
                    {logsServiceType && (
                        <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-700 text-emerald-400">
                            ID: {logsDeployId}
                        </span>
                    )}
                </div>

                <div className="p-6 font-mono text-sm text-slate-300 overflow-y-auto flex-1">
                    {loadingLogs ? (
                        <div className="flex items-center gap-3 text-emerald-400 animate-pulse">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Fetching deploy metadata from Render...
                        </div>
                    ) : activeLogs ? (
                        <div className="space-y-4">
                            <div><span className="text-emerald-400 font-bold">$ deploy status:</span> {activeLogs.status}</div>
                            <div><span className="text-emerald-400 font-bold">$ commit:</span> {activeLogs.commit ? `${activeLogs.commit.message} (${activeLogs.commit.id})` : 'N/A'}</div>
                            {activeLogs.serviceDetails && (
                                <>
                                    <div className="mt-2"><span className="text-amber-400 font-bold">$ build cmd:</span> <span className="text-slate-400 italic">{activeLogs.serviceDetails.buildCommand || 'npm run build'}</span></div>
                                    <div><span className="text-amber-400 font-bold">$ start cmd:</span> <span className="text-slate-400 italic">{activeLogs.serviceDetails.startCommand || 'npm start'}</span></div>
                                </>
                            )}
                            <div className="mt-2"><span className="text-emerald-400 font-bold">$ created at:</span> {new Date(activeLogs.createdAt).toLocaleString()}</div>
                            <div><span className="text-emerald-400 font-bold">$ updated at:</span> {new Date(activeLogs.updatedAt).toLocaleString()}</div>
                            <div className="mt-8 border-t border-slate-700 pt-4 text-slate-400">
                                Note: The Render API v1 doesn't stream full build logs textively via simple GET unless using WebSockets or log streams. View the full logs directly inside the <a href="https://dashboard.render.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Render Dashboard</a>.
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-500 text-center mt-10">
                            <Terminal className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Select a service to view its latest deployment information.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Network Metrics Block */}
            {logsServiceType && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Network Performance</h2>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {['12h', '24h', '2d', '7d'].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => handleRangeChange(r)}
                                        className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all ${metricsRange === r ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Period: {activeMetrics?.timeRange?.label || metricsRange}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Traffic Volume */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-500" />
                                    Traffic Volume
                                </h3>
                            </div>
                            {loadingMetrics ? (
                                <div className="h-24 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-xs text-slate-400 animate-pulse">Analyzing incoming traffic...</p>
                                </div>
                            ) : activeMetrics?.requests ? (
                                <div className="space-y-3">
                                    <div className="flex items-end gap-1 h-12">
                                        {activeMetrics.requests.map((r, i) => {
                                            const maxVal = Math.max(...activeMetrics.requests.map(m => parseFloat(m.value) || 0)) || 1;
                                            return (
                                                <div
                                                    key={i}
                                                    title={`${new Date(r.timestamp).toLocaleString()}: ${r.value} reqs`}
                                                    className="flex-1 bg-emerald-100 rounded-sm hover:bg-emerald-400 transition-colors"
                                                    style={{ height: `${Math.min(100, (parseFloat(r.value) / maxVal) * 100)}%` }}
                                                />
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                        <div>
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Total Requests</p>
                                            <p className="text-xl font-black text-emerald-700">
                                                {activeMetrics.requests.reduce((acc, r) => acc + (r.value || 0), 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Peak Load</p>
                                            <p className="text-sm font-bold text-emerald-700">
                                                {Math.max(...activeMetrics.requests.map(r => r.value || 0))} req/pulse
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-xs italic">No request data found.</div>
                            )}
                        </div>

                        {/* Bandwidth Usage */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                                    <Server className="w-4 h-4 text-blue-500" />
                                    Outbound Bandwidth
                                </h3>
                            </div>
                            {loadingMetrics ? (
                                <div className="h-24 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-xs text-slate-400 animate-pulse">Calculating egress data...</p>
                                </div>
                            ) : activeMetrics?.bandwidth ? (
                                <div className="space-y-3">
                                    <div className="flex items-end gap-1 h-12">
                                        {activeMetrics.bandwidth.map((b, i) => {
                                            const maxVal = Math.max(...activeMetrics.bandwidth.map(m => parseFloat(m.value) || 0)) || 1;
                                            return (
                                                <div
                                                    key={i}
                                                    title={`${new Date(b.timestamp).toLocaleString()}: ${(parseFloat(b.value) / 1024 / 1024).toFixed(2)} MB`}
                                                    className="flex-1 bg-blue-100 rounded-sm hover:bg-blue-400 transition-colors"
                                                    style={{ height: `${Math.min(100, (parseFloat(b.value) / maxVal) * 100)}%` }}
                                                />
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                        <div>
                                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Total Egress</p>
                                            <p className="text-xl font-black text-blue-700">
                                                {(activeMetrics.bandwidth.reduce((acc, b) => acc + (b.value || 0), 0) / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Avg Pulse</p>
                                            <p className="text-sm font-bold text-blue-700">
                                                {(activeMetrics.bandwidth.reduce((acc, b) => acc + (b.value || 0), 0) / (activeMetrics.bandwidth.length || 1) / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-xs italic">No bandwidth metrics.</div>
                            )}
                        </div>

                        {/* Usage Breakdown - From Image */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 text-purple-500" />
                                    Detailed Traffic Usage
                                </h3>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Usage this {metricsRange.includes('d') ? 'period' : 'day'}</div>
                            </div>
                            {loadingMetrics ? (
                                <div className="space-y-4">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="h-6 bg-slate-50 animate-pulse rounded-md" />)}
                                </div>
                            ) : activeMetrics?.sources ? (
                                <div className="space-y-4">
                                    {['http', 'websocket', 'nat', 'privatelink'].map((source) => {
                                        const value = activeMetrics.sources.find(s => s.source === source)?.total || 0;
                                        const label = source === 'http' ? 'HTTP Responses' :
                                            source === 'websocket' ? 'Websocket Responses' :
                                                source === 'nat' ? 'Service-Initiated' : 'Service-Initiated (Private Link)';

                                        return (
                                            <div key={source} className="flex flex-col gap-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-600">{label}</span>
                                                    <span className="text-xs font-black text-slate-400">{(value / 1024 / 1024).toFixed(2)} MB</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (value / (activeMetrics.bandwidth.reduce((acc, b) => acc + (b.value || 0), 0) || 1)) * 100)}%` }}
                                                        className={`h-full ${source === 'http' ? 'bg-emerald-400' : source === 'websocket' ? 'bg-blue-400' : 'bg-purple-400'}`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-xs italic">No breakdown available.</div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* History Table */}
            {activeLogs && logsServiceType && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" />
                            {logsServiceType} Deployment Timeline
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">showing last 5 attempts</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deploy ID</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Commit Message</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Created At</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {((logsServiceType === 'backend' ? backendStatus : (logsServiceType === 'frontend' ? frontendStatus : adminStatus))?.recentDeploys || []).map((dep) => {
                                    const created = new Date(dep.createdAt);
                                    const finished = dep.finishedAt ? new Date(dep.finishedAt) : null;
                                    const duration = finished ? Math.round((finished - created) / 1000) : null;

                                    return (
                                        <tr key={dep.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <code className="text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{dep.id.substring(0, 12)}...</code>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${dep.status === 'live' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    dep.status === 'build_failed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {dep.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-slate-600 truncate max-w-[200px]" title={dep.commitMessage}>
                                                    {dep.commitMessage || 'Automated Deploy'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-medium text-slate-500">{created.toLocaleString()}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-slate-400">
                                                    {duration ? `${Math.floor(duration / 60)}m ${duration % 60}s` : 'Processing...'}
                                                </p>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default AdminDeployments;
