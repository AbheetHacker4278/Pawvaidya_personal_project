import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert,
    ShieldCheck,
    ShieldX,
    Clock,
    Globe,
    Terminal,
    User,
    RefreshCcw,
    CheckCircle2,
    AlertCircle,
    Info,
    Search,
    ChevronDown,
    ChevronUp,
    BarChart3,
    MapPin,
    Monitor,
    Smartphone,
    Laptop,
    Fingerprint
} from 'lucide-react';

const SecurityMonitoring = () => {
    const { atoken, backendurl, setSecurityIncidentCount } = useContext(AdminContext);
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('new');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedIncident, setExpandedIncident] = useState(null);

    const fetchIncidents = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${backendurl}/api/admin/security-incidents`, {
                headers: { atoken }
            });
            if (data.success) {
                setIncidents(data.incidents);
                const unreadCount = data.incidents.filter(i => i.status === 'new').length;
                setSecurityIncidentCount(unreadCount);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const resolveIncident = async (incidentId, status) => {
        try {
            const { data } = await axios.post(`${backendurl}/api/admin/security-incidents/${incidentId}/resolve`,
                { status },
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success(data.message);
                fetchIncidents();
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (atoken) {
            fetchIncidents();
        }
    }, [atoken]);

    const filteredIncidents = incidents.filter(incident => {
        const matchesTab = activeTab === 'all' || incident.status === activeTab;
        const matchesSearch = incident.payload.toLowerCase().includes(searchQuery.toLowerCase()) ||
            incident.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            incident.ipAddress.includes(searchQuery);
        return matchesTab && matchesSearch;
    });

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'text-rose-600 bg-rose-50 border-rose-100';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100';
            default: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        }
    };

    const StatusBadge = ({ status }) => {
        switch (status) {
            case 'new': return (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-600 border border-rose-200">
                    <AlertCircle className="w-3 h-3" /> New Threat
                </span>
            );
            case 'resolved': return (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Resolved
                </span>
            );
            case 'ignored': return (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                    <ShieldX className="w-3 h-3" /> Ignored
                </span>
            );
            default: return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-rose-500 rounded-2xl shadow-lg shadow-rose-200">
                            <ShieldAlert className="w-8 h-8 text-white" />
                        </div>
                        Security Monitor
                    </h1>
                    <p className="mt-2 text-slate-500 font-medium ml-14">
                        Real-time threat detection and script injection prevention.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchIncidents}
                        className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group"
                        title="Refresh Data"
                    >
                        <RefreshCcw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-700 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="px-5 py-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200 flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="font-bold text-sm">System Secure</span>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'New Threats', count: incidents.filter(i => i.status === 'new').length, icon: AlertCircle, color: 'rose' },
                    { label: 'Total Scanned', count: incidents.length, icon: ShieldCheck, color: 'emerald' },
                    { label: 'Resolved', count: incidents.filter(i => i.status === 'resolved').length, icon: CheckCircle2, color: 'blue' },
                    { label: 'SQLi Attempts', count: incidents.filter(i => i.type === 'SQLi').length, icon: Terminal, color: 'orange' }
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow`}
                    >
                        <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-500`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-2xl font-black text-slate-800">{stat.count}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Controls & Search */}
            <div className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex bg-slate-50 p-1.5 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
                    {['all', 'new', 'resolved', 'ignored'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap
                                ${activeTab === tab
                                    ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-100'
                                    : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search payloads, IPs, or types..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 text-slate-700 font-medium transition-all outline-none"
                    />
                </div>
            </div>

            {/* Content List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Scanning for threats...</p>
                    </div>
                ) : filteredIncidents.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-20 text-center border border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Everything looks safe!</h3>
                        <p className="text-slate-400 font-medium mt-2">No security incidents found for this filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredIncidents.map((incident, idx) => (
                                <motion.div
                                    key={incident._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden
                                        ${expandedIncident === incident._id ? 'ring-2 ring-emerald-500/20' : ''}`}
                                >
                                    <div
                                        onClick={() => setExpandedIncident(expandedIncident === incident._id ? null : incident._id)}
                                        className="p-5 cursor-pointer flex items-center gap-4"
                                    >
                                        <div className={`p-3 rounded-2xl ${getSeverityColor(incident.severity)}`}>
                                            {incident.type === 'SQLi' ? <Terminal className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h4 className="font-black text-slate-800 text-lg">{incident.type} Detected</h4>
                                                {incident.url?.includes('blogs') && (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-tight">
                                                        <Globe className="w-3 h-3" /> Community Post
                                                    </span>
                                                )}
                                                {incident.url?.includes('poll') && (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-tight">
                                                        <BarChart3 className="w-3 h-3" /> Poll interaction
                                                    </span>
                                                )}
                                                <StatusBadge status={incident.status} />
                                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${getSeverityColor(incident.severity)}`}>
                                                    {incident.severity}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-slate-400 font-bold text-xs uppercase tracking-tight">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(incident.createdAt).toLocaleString()}</span>
                                                <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {incident.ipAddress}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {incident.status === 'new' && (
                                                <div className="hidden md:flex items-center gap-2 mr-4">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); resolveIncident(incident._id, 'resolved'); }}
                                                        className="px-4 py-2 bg-emerald-500 text-white text-xs font-black rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100"
                                                    >
                                                        RESOLVE
                                                    </button>
                                                </div>
                                            )}
                                            {expandedIncident === incident._id ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                                        </div>
                                    </div>

                                    {expandedIncident === incident._id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="px-5 pb-5 border-t border-slate-50 pt-5 space-y-4"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Offender Profile</p>
                                                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                                <User className="w-4 h-4 text-rose-500" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">
                                                                    {incident.userDetails?.name || 'Anonymous'}
                                                                    <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[8px]">
                                                                        {incident.userType || 'unknown'}
                                                                    </span>
                                                                </p>
                                                                <p className="text-[9px] font-bold text-slate-500 truncate">{incident.userDetails?.email || 'N/A'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="pt-2 border-t border-rose-100/50 space-y-2">
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                                                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                                                                <span>{incident.location?.city || 'Unknown'}, {incident.location?.country || 'Unknown'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                                                <Globe className="w-3.5 h-3.5 text-slate-400" />
                                                                <span>{incident.ipAddress}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Device Metadata</p>
                                                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                                {incident.device?.type === 'Mobile' ? <Smartphone className="w-4 h-4 text-indigo-500" /> : <Monitor className="w-4 h-4 text-indigo-500" />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                                                                    {incident.device?.browser || 'Unknown'} {incident.device?.browserVersion}
                                                                </p>
                                                                <p className="text-[9px] font-bold text-slate-500">
                                                                    {incident.device?.os || 'Unknown'} {incident.device?.osVersion}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="pt-2 border-t border-indigo-100/50">
                                                            <p className="text-[9px] font-mono text-indigo-400 line-clamp-2 break-all italic leading-tight" title={incident.userAgent}>
                                                                {incident.userAgent}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Surface</p>
                                                    <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-600 border border-slate-100 overflow-x-auto space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-1.5 py-0.5 bg-slate-200 rounded text-[9px] font-black uppercase tracking-tighter">{incident.method}</span>
                                                            <span className="text-emerald-600 truncate font-bold text-[11px]">{incident.url}</span>
                                                        </div>
                                                        <div className="text-[10px] border-t border-slate-200 pt-1.5 mt-1.5 font-bold text-slate-400 flex items-center justify-between">
                                                            <span>Field: <span className="text-slate-600 uppercase tracking-tight">{incident.target}</span></span>
                                                            <Fingerprint className="w-3.5 h-3.5 text-slate-300" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Malicious Payload</p>
                                                <div className="p-4 bg-slate-900 rounded-2xl font-mono text-sm text-emerald-400 border border-slate-800 break-all overflow-x-auto">
                                                    {incident.payload}
                                                </div>
                                            </div>

                                            <div className="flex md:hidden items-center gap-2 pt-2">
                                                {incident.status === 'new' && (
                                                    <button
                                                        onClick={() => resolveIncident(incident._id, 'resolved')}
                                                        className="flex-1 py-3 bg-emerald-500 text-white text-xs font-black rounded-xl"
                                                    >
                                                        MARK AS RESOLVED
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => resolveIncident(incident._id, 'ignored')}
                                                    className="flex-1 py-3 bg-slate-100 text-slate-500 text-xs font-black rounded-xl"
                                                >
                                                    IGNORE
                                                </button>
                                            </div>

                                            {incident.status !== 'new' && (
                                                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <Info className="w-4 h-4 text-slate-400" />
                                                    <p className="text-xs font-bold text-slate-500">
                                                        This incident was marked as <span className="text-slate-800 uppercase">{incident.status}</span>.
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default SecurityMonitoring;
