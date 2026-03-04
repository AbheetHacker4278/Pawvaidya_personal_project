import React, { useContext, useState, useEffect } from 'react';
import { AdminContext } from '../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Activity, Server, Zap, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const SupabaseHealthMonitor = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(60);

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/admin/supabase-health`, {
                headers: { atoken }
            });
            if (data.success) {
                setHealth(data);
            }
        } catch (error) {
            setHealth({ status: 'offline', error: error.message, latency: -1, recentMetrics: [] });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
    }, []);

    useEffect(() => {
        let timer;
        if (autoRefresh) {
            timer = setInterval(fetchHealth, refreshInterval * 1000);
        }
        return () => clearInterval(timer);
    }, [autoRefresh, refreshInterval, atoken, backendurl]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'online': return <CheckCircle className="text-green-500" size={20} />;
            case 'degraded': return <AlertTriangle className="text-amber-500" size={20} />;
            case 'offline': return <XCircle className="text-red-500" size={20} />;
            default: return <Server className="text-gray-500" size={20} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'bg-green-100 text-green-700 border-green-200';
            case 'degraded': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'offline': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Supabase Health</h2>
                        <p className="text-xs text-gray-500">Real-time service monitoring</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchHealth}
                        className={`p-2 rounded-full hover:bg-gray-100 transition-all ${loading ? 'animate-spin' : ''}`}
                        title="Manual Refresh"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <div className="flex items-center gap-2 text-xs font-medium bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                        <span className="text-gray-500">Auto</span>
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="w-3 h-3 accent-emerald-500"
                        />
                    </div>
                </div>
            </div>

            {health && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`flex items-center justify-between p-3 rounded-xl border ${getStatusColor(health.status)}`}>
                            <span className="text-xs font-semibold uppercase tracking-wider">Status</span>
                            <div className="flex items-center gap-2">
                                {getStatusIcon(health.status)}
                                <span className="font-bold capitalize">{health.status}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                            <span className="text-xs font-semibold uppercase tracking-wider">Latency</span>
                            <div className="flex items-center gap-2">
                                <Zap size={18} className="text-blue-500" />
                                <span className="font-bold">{health.latency >= 0 ? `${health.latency}ms` : '---'}</span>
                            </div>
                        </div>
                    </div>

                    {health.error && (
                        <div className={`p-4 rounded-xl flex flex-col gap-2 ${health.status === 'offline' ? 'bg-rose-50 border border-rose-100' : 'bg-amber-50 border border-amber-100'}`}>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className={health.status === 'offline' ? 'text-rose-500' : 'text-amber-500'} size={18} />
                                <span className={`text-xs font-bold uppercase tracking-wider ${health.status === 'offline' ? 'text-rose-700' : 'text-amber-700'}`}>
                                    {health.status === 'offline' ? 'Service Unavailable' : 'System Warning'}
                                </span>
                            </div>
                            <p className={`text-xs ${health.status === 'offline' ? 'text-rose-600' : 'text-amber-600'}`}>{health.error}</p>
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Server size={14} />
                            Recent Metrics
                        </h3>
                        <div className="overflow-hidden rounded-xl border border-gray-100">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                                    <tr>
                                        <th className="px-3 py-2 font-semibold">Path</th>
                                        <th className="px-3 py-2 font-semibold text-center">Status</th>
                                        <th className="px-3 py-2 font-semibold text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {health.recentMetrics && health.recentMetrics.length > 0 ? (
                                        health.recentMetrics.map((m, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-3 py-2 text-gray-600 truncate max-w-[120px]" title={m.path}>{m.path}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full font-bold ${m.status_code >= 200 && m.status_code < 300 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                        }`}>
                                                        {m.status_code}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right text-gray-400">
                                                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-3 py-4 text-center text-gray-400 italic">No recent metrics found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {!health && loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500">Initializing monitor...</p>
                </div>
            )}
        </div>
    );
};

export default SupabaseHealthMonitor;
