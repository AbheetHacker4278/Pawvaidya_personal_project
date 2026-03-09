import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert, ShieldCheck, ShieldX, Clock, Globe, Terminal, User, RefreshCcw,
    CheckCircle2, AlertCircle, Info, Search, ChevronDown, ChevronUp, BarChart3,
    MapPin, Monitor, Smartphone, Fingerprint, MessageSquareWarning, Ban, Timer,
    WifiOff, Eye, X, AlertTriangle, Gavel
} from 'lucide-react';

// ─── Ban Modal Component ──────────────────────────────────────────────────────
const BanModal = ({ violation, onClose, onBan }) => {
    const [banDuration, setBanDuration] = useState('permanent');
    const [banReason, setBanReason] = useState(
        `Content violation: Detected bad words — "${violation?.detectedWords?.slice(0, 3).join('", "')}"${violation?.detectedWords?.length > 3 ? `... and ${violation.detectedWords.length - 3} more` : ''}`
    );
    const [banIp, setBanIp] = useState(false);
    const [loading, setLoading] = useState(false);

    const durations = [
        { label: '1 Hour', value: '1h', icon: '⚡' },
        { label: '24 Hours', value: '24h', icon: '🕐' },
        { label: '7 Days', value: '7d', icon: '📅' },
        { label: '30 Days', value: '30d', icon: '🗓️' },
        { label: 'Permanent', value: 'permanent', icon: '🔒' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[2rem] shadow-2xl p-7 max-w-lg w-full border border-red-100"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 rounded-2xl">
                            <Gavel className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Ban User</h3>
                            <p className="text-xs text-slate-400 font-bold">{violation?.userDetails?.email || 'Unknown'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {/* Offending Content */}
                <div className="mb-5 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Flagged Content</p>
                    <p className="text-sm text-slate-700 font-medium line-clamp-2">{violation?.content}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {violation?.detectedWords?.map((w, i) => (
                            <span key={i} className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-black border border-red-200">{w}</span>
                        ))}
                    </div>
                </div>

                {/* Duration Picker */}
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ban Duration</p>
                <div className="grid grid-cols-5 gap-2 mb-5">
                    {durations.map(d => (
                        <button
                            key={d.value}
                            onClick={() => setBanDuration(d.value)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center ${banDuration === d.value
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                        >
                            <span className="text-lg">{d.icon}</span>
                            <span className="text-[9px] font-black leading-tight">{d.label}</span>
                        </button>
                    ))}
                </div>

                {/* Remarks */}
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ban Reason / Remarks</p>
                <textarea
                    value={banReason}
                    onChange={e => setBanReason(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm text-slate-700 focus:border-red-300 focus:ring-2 focus:ring-red-100 outline-none resize-none mb-5 font-medium transition-all"
                    placeholder="Reason for ban..."
                />

                {/* IP Ban toggle */}
                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-5 cursor-pointer group hover:border-red-200 transition-all">
                    <div className={`w-10 h-6 rounded-full transition-all duration-300 relative ${banIp ? 'bg-red-500' : 'bg-slate-200'}`} onClick={() => setBanIp(!banIp)}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${banIp ? 'left-5' : 'left-1'}`} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">Also ban IP address</p>
                        <p className="text-[10px] text-slate-400 font-bold">{violation?.ipAddress}</p>
                    </div>
                    <WifiOff className="w-4 h-4 text-slate-300 ml-auto group-hover:text-red-400 transition-colors" />
                </label>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border-2 border-slate-100 text-slate-500 font-black text-sm hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onBan({ banDuration, banReason, banIp }, setLoading)}
                        disabled={!banReason.trim() || loading}
                        className={`flex-1 py-3 rounded-xl font-black text-sm text-white transition-all flex items-center justify-center gap-2 shadow-lg ${loading || !banReason.trim()
                            ? 'bg-slate-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-200'}`}
                    >
                        {loading
                            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Banning...</>
                            : <><Ban className="w-4 h-4" /> Confirm Ban</>}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SecurityMonitoring = () => {
    const { atoken, backendurl, setSecurityIncidentCount } = useContext(AdminContext);

    // Security incidents
    const [incidents, setIncidents] = useState([]);
    const [incidentsLoading, setIncidentsLoading] = useState(true);
    const [expandedIncident, setExpandedIncident] = useState(null);

    // Content violations
    const [violations, setViolations] = useState([]);
    const [violationsLoading, setViolationsLoading] = useState(true);
    const [expandedViolation, setExpandedViolation] = useState(null);
    const [banModalViolation, setBanModalViolation] = useState(null); // which violation to show ban modal for

    // Shared UI state
    const [activeSection, setActiveSection] = useState('violations'); // 'incidents' | 'violations'
    const [activeTab, setActiveTab] = useState('new');
    const [searchQuery, setSearchQuery] = useState('');

    // ─── Fetch Security Incidents ──────────────────────────────────────────────
    const fetchIncidents = async () => {
        try {
            setIncidentsLoading(true);
            const { data } = await axios.get(`${backendurl}/api/admin/security-incidents`, { headers: { atoken } });
            if (data.success) {
                setIncidents(data.incidents);
                setSecurityIncidentCount(data.incidents.filter(i => i.status === 'new').length);
            }
        } catch (err) { toast.error(err.message); }
        finally { setIncidentsLoading(false); }
    };

    // ─── Fetch Content Violations ──────────────────────────────────────────────
    const fetchViolations = async () => {
        try {
            setViolationsLoading(true);
            const { data } = await axios.get(`${backendurl}/api/admin/content-violations`, { headers: { atoken } });
            if (data.success) setViolations(data.violations);
        } catch (err) { toast.error(err.message); }
        finally { setViolationsLoading(false); }
    };

    // ─── Resolve / Ignore ──────────────────────────────────────────────────────
    const resolveIncident = async (id, status) => {
        const { data } = await axios.post(`${backendurl}/api/admin/security-incidents/${id}/resolve`, { status }, { headers: { atoken } });
        if (data.success) { toast.success(data.message); fetchIncidents(); }
        else toast.error(data.message);
    };

    const resolveViolation = async (id, status) => {
        const { data } = await axios.post(`${backendurl}/api/admin/content-violations/${id}/resolve`, { status }, { headers: { atoken } });
        if (data.success) { toast.success(`Violation ${status}`); fetchViolations(); }
        else toast.error(data.message);
    };

    // ─── Ban from violation ────────────────────────────────────────────────────
    const handleBan = async (violation, { banDuration, banReason, banIp }, setLoading) => {
        try {
            setLoading(true);
            const { data } = await axios.post(`${backendurl}/api/admin/ban-from-violation`, {
                violationId: violation._id,
                userId: violation.userId,
                userType: violation.userType,
                banDuration,
                banReason,
                banIp,
                ipAddress: violation.ipAddress,
            }, { headers: { atoken } });

            if (data.success) {
                toast.success(data.message);
                setBanModalViolation(null);
                fetchViolations();
            } else {
                toast.error(data.message);
            }
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (atoken) { fetchIncidents(); fetchViolations(); }
    }, [atoken]);

    // ─── Helpers ───────────────────────────────────────────────────────────────
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'text-rose-600 bg-rose-50 border-rose-100';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100';
            default: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        }
    };

    const StatusBadge = ({ status }) => {
        const configs = {
            new: { color: 'bg-rose-100 text-rose-600 border-rose-200', icon: <AlertCircle className="w-3 h-3" />, label: 'New' },
            resolved: { color: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Resolved' },
            ignored: { color: 'bg-slate-100 text-slate-500 border-slate-200', icon: <ShieldX className="w-3 h-3" />, label: 'Ignored' },
        };
        const c = configs[status] || configs.ignored;
        return <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${c.color}`}>{c.icon} {c.label}</span>;
    };

    const filteredIncidents = incidents.filter(i => {
        const matchesTab = activeTab === 'all' || i.status === activeTab;
        const q = searchQuery.toLowerCase();
        return matchesTab && (i.payload?.toLowerCase().includes(q) || i.type?.toLowerCase().includes(q) || i.ipAddress?.includes(q));
    });

    const filteredViolations = violations.filter(v => {
        const matchesTab = activeTab === 'all' || v.status === activeTab;
        const q = searchQuery.toLowerCase();
        return matchesTab && (
            v.content?.toLowerCase().includes(q) ||
            v.detectedWords?.some(w => w.includes(q)) ||
            v.ipAddress?.includes(q) ||
            v.userDetails?.name?.toLowerCase().includes(q)
        );
    });

    const isLoading = activeSection === 'incidents' ? incidentsLoading : violationsLoading;

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-rose-500 rounded-2xl shadow-lg shadow-rose-200">
                            <ShieldAlert className="w-8 h-8 text-white" />
                        </div>
                        Security Monitor
                    </h1>
                    <p className="mt-2 text-slate-500 font-medium ml-14">
                        Real-time threat detection, bad-words filtering, and user ban management.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { fetchIncidents(); fetchViolations(); }}
                        className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group"
                        title="Refresh Data"
                    >
                        <RefreshCcw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-700 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="px-5 py-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200 flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="font-bold text-sm">System Secure</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Threats', count: incidents.filter(i => i.status === 'new').length, icon: AlertCircle, color: 'rose' },
                    { label: 'Content Flags', count: violations.filter(v => v.status === 'new').length, icon: MessageSquareWarning, color: 'orange' },
                    { label: 'Resolved', count: incidents.filter(i => i.status === 'resolved').length + violations.filter(v => v.status === 'resolved').length, icon: CheckCircle2, color: 'emerald' },
                    { label: 'SQLi Attempts', count: incidents.filter(i => i.type === 'SQLi').length, icon: Terminal, color: 'indigo' },
                ].map((stat, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                        className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-500`}><stat.icon className="w-5 h-5" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-2xl font-black text-slate-800">{stat.count}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Section Switcher */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1.5 max-w-sm">
                {[
                    { key: 'violations', label: 'Content Violations', icon: MessageSquareWarning, count: violations.filter(v => v.status === 'new').length },
                    { key: 'incidents', label: 'Security Threats', icon: ShieldAlert, count: incidents.filter(i => i.status === 'new').length },
                ].map(s => (
                    <button key={s.key} onClick={() => setActiveSection(s.key)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                            ${activeSection === s.key ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>
                        <s.icon className="w-4 h-4" />
                        {s.label}
                        {s.count > 0 && <span className="ml-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">{s.count}</span>}
                    </button>
                ))}
            </div>

            {/* Controls */}
            <div className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex bg-slate-50 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
                    {['all', 'new', 'resolved', 'ignored'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap
                                ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" placeholder={activeSection === 'violations' ? 'Search content, users, IPs...' : 'Search payloads, IPs, types...'}
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 text-slate-700 font-medium outline-none transition-all" />
                </div>
            </div>

            {/* ── CONTENT VIOLATIONS SECTION ── */}
            {activeSection === 'violations' && (
                <div className="space-y-4">
                    {violationsLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-slate-400 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Scanning content...</p>
                        </div>
                    ) : filteredViolations.length === 0 ? (
                        <div className="bg-white rounded-[2rem] p-20 text-center border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <MessageSquareWarning className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">No violations found!</h3>
                            <p className="text-slate-400 font-medium mt-2">Users are being respectful.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            <AnimatePresence mode="popLayout">
                                {filteredViolations.map((v) => (
                                    <motion.div key={v._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                        className={`bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden ${expandedViolation === v._id ? 'ring-2 ring-orange-500/20' : ''}`}>

                                        {/* Summary row */}
                                        <div onClick={() => setExpandedViolation(expandedViolation === v._id ? null : v._id)}
                                            className="p-5 cursor-pointer flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 flex-shrink-0">
                                                <MessageSquareWarning className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h4 className="font-black text-slate-800">Bad Words Detected</h4>
                                                    <StatusBadge status={v.status} />
                                                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${getSeverityColor(v.severity)}`}>{v.severity}</div>
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-slate-400 font-bold text-xs">
                                                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {v.userDetails?.name || 'Anonymous'} ({v.userType})</span>
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(v.createdAt).toLocaleString()}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {v.detectedWords?.slice(0, 5).map((w, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-red-50 text-red-500 rounded-full text-[9px] font-black border border-red-100">{w}</span>
                                                    ))}
                                                    {v.detectedWords?.length > 5 && <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black">+{v.detectedWords.length - 5} more</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {v.status === 'new' && (
                                                    <div className="hidden md:flex items-center gap-2">
                                                        <button onClick={e => { e.stopPropagation(); setBanModalViolation(v); }}
                                                            className="px-3 py-2 bg-red-500 text-white text-xs font-black rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-100 flex items-center gap-1.5">
                                                            <Ban className="w-3 h-3" /> BAN
                                                        </button>
                                                        <button onClick={e => { e.stopPropagation(); resolveViolation(v._id, 'resolved'); }}
                                                            className="px-3 py-2 bg-emerald-500 text-white text-xs font-black rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100">
                                                            RESOLVE
                                                        </button>
                                                    </div>
                                                )}
                                                {expandedViolation === v._id ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                                            </div>
                                        </div>

                                        {/* Expanded detail */}
                                        {expandedViolation === v._id && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                className="px-5 pb-5 border-t border-slate-50 pt-5 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Offender */}
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Offender Profile</p>
                                                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <User className="w-4 h-4 text-rose-500" />
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-800">{v.userDetails?.name} <span className="ml-1 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[8px]">{v.userType}</span></p>
                                                                    <p className="text-xs text-slate-500">{v.userDetails?.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                                                                <Globe className="w-3 h-3" />
                                                                <span>{v.ipAddress}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                                                                <MapPin className="w-3 h-3" />
                                                                <span>{v.location?.city}, {v.location?.country}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Device */}
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Device & URL</p>
                                                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                {v.device?.type === 'Mobile' ? <Smartphone className="w-4 h-4 text-indigo-500" /> : <Monitor className="w-4 h-4 text-indigo-500" />}
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-800">{v.device?.browser} {v.device?.browserVersion}</p>
                                                                    <p className="text-xs text-slate-500">{v.device?.os} {v.device?.osVersion}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs font-mono text-slate-500 border-t border-indigo-100 pt-2 truncate">
                                                                <span className="font-black text-slate-400 mr-1">{v.method}</span> {v.url}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Flagged content */}
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flagged Content</p>
                                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-sm text-slate-700 break-all font-medium">{v.content}</div>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {v.detectedWords?.map((w, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-black border border-red-200">{w}</span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Mobile actions */}
                                                {v.status === 'new' && (
                                                    <div className="flex md:hidden gap-2 pt-2">
                                                        <button onClick={() => setBanModalViolation(v)} className="flex-1 py-3 bg-red-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5">
                                                            <Ban className="w-3 h-3" /> BAN USER
                                                        </button>
                                                        <button onClick={() => resolveViolation(v._id, 'resolved')} className="flex-1 py-3 bg-emerald-500 text-white text-xs font-black rounded-xl">RESOLVE</button>
                                                        <button onClick={() => resolveViolation(v._id, 'ignored')} className="flex-1 py-3 bg-slate-100 text-slate-500 text-xs font-black rounded-xl">IGNORE</button>
                                                    </div>
                                                )}
                                                {v.status !== 'new' && (
                                                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                        <Info className="w-4 h-4 text-slate-400" />
                                                        <p className="text-xs font-bold text-slate-500">Status: <span className="text-slate-800 uppercase">{v.status}</span>{v.actionTaken && ` — Action: ${v.actionTaken}`}</p>
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
            )}

            {/* ── SECURITY INCIDENTS SECTION ── */}
            {activeSection === 'incidents' && (
                <div className="space-y-4">
                    {incidentsLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-slate-400 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Scanning for threats...</p>
                        </div>
                    ) : filteredIncidents.length === 0 ? (
                        <div className="bg-white rounded-[2rem] p-20 text-center border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">Everything looks safe!</h3>
                            <p className="text-slate-400 font-medium mt-2">No security incidents found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            <AnimatePresence mode="popLayout">
                                {filteredIncidents.map((incident) => (
                                    <motion.div key={incident._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                        className={`bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden ${expandedIncident === incident._id ? 'ring-2 ring-emerald-500/20' : ''}`}>
                                        <div onClick={() => setExpandedIncident(expandedIncident === incident._id ? null : incident._id)}
                                            className="p-5 cursor-pointer flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${getSeverityColor(incident.severity)}`}>
                                                {incident.type === 'SQLi' ? <Terminal className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h4 className="font-black text-slate-800 text-lg">{incident.type} Detected</h4>
                                                    <StatusBadge status={incident.status} />
                                                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${getSeverityColor(incident.severity)}`}>{incident.severity}</div>
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-slate-400 font-bold text-xs">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(incident.createdAt).toLocaleString()}</span>
                                                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {incident.ipAddress}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {incident.status === 'new' && (
                                                    <div className="hidden md:flex gap-2 mr-4">
                                                        <button onClick={e => { e.stopPropagation(); resolveIncident(incident._id, 'resolved'); }}
                                                            className="px-4 py-2 bg-emerald-500 text-white text-xs font-black rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100">
                                                            RESOLVE
                                                        </button>
                                                    </div>
                                                )}
                                                {expandedIncident === incident._id ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                                            </div>
                                        </div>

                                        {expandedIncident === incident._id && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                className="px-5 pb-5 border-t border-slate-50 pt-5 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Offender Profile</p>
                                                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 space-y-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-white rounded-lg shadow-sm"><User className="w-4 h-4 text-rose-500" /></div>
                                                                <div>
                                                                    <p className="text-[11px] font-black text-slate-800 uppercase">{incident.userDetails?.name || 'Anonymous'} <span className="ml-1 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[8px]">{incident.userType}</span></p>
                                                                    <p className="text-[9px] text-slate-500">{incident.userDetails?.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-[10px] text-slate-600 font-bold flex items-center gap-2"><Globe className="w-3 h-3 text-slate-400" />{incident.ipAddress}</div>
                                                            <div className="text-[10px] text-slate-600 font-bold flex items-center gap-2"><MapPin className="w-3 h-3 text-rose-400" />{incident.location?.city}, {incident.location?.country}</div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Device Metadata</p>
                                                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                {incident.device?.type === 'Mobile' ? <Smartphone className="w-4 h-4 text-indigo-500" /> : <Monitor className="w-4 h-4 text-indigo-500" />}
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-800">{incident.device?.browser} {incident.device?.browserVersion}</p>
                                                                    <p className="text-xs text-slate-500">{incident.device?.os} {incident.device?.osVersion}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-[9px] font-mono text-indigo-400 line-clamp-2 border-t border-indigo-100 pt-1">{incident.userAgent}</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Surface</p>
                                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono text-xs text-slate-600 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-1.5 py-0.5 bg-slate-200 rounded text-[9px] font-black uppercase">{incident.method}</span>
                                                                <span className="text-emerald-600 truncate font-bold">{incident.url}</span>
                                                            </div>
                                                            <div className="text-[10px] border-t border-slate-200 pt-1.5 font-bold text-slate-400 flex items-center justify-between">
                                                                <span>Field: <span className="text-slate-600 uppercase">{incident.target}</span></span>
                                                                <Fingerprint className="w-3.5 h-3.5 text-slate-300" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Malicious Payload</p>
                                                    <div className="p-4 bg-slate-900 rounded-2xl font-mono text-sm text-emerald-400 border border-slate-800 break-all">{incident.payload}</div>
                                                </div>
                                                {incident.status === 'new' && (
                                                    <div className="flex md:hidden gap-2 pt-2">
                                                        <button onClick={() => resolveIncident(incident._id, 'resolved')} className="flex-1 py-3 bg-emerald-500 text-white text-xs font-black rounded-xl">RESOLVE</button>
                                                        <button onClick={() => resolveIncident(incident._id, 'ignored')} className="flex-1 py-3 bg-slate-100 text-slate-500 text-xs font-black rounded-xl">IGNORE</button>
                                                    </div>
                                                )}
                                                {incident.status !== 'new' && (
                                                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                        <Info className="w-4 h-4 text-slate-400" />
                                                        <p className="text-xs font-bold text-slate-500">Marked as <span className="text-slate-800 uppercase">{incident.status}</span></p>
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
            )}

            {/* Ban Modal */}
            <AnimatePresence>
                {banModalViolation && (
                    <BanModal
                        violation={banModalViolation}
                        onClose={() => setBanModalViolation(null)}
                        onBan={(opts, setLoading) => handleBan(banModalViolation, opts, setLoading)}
                    />
                )}
            </AnimatePresence>

            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </div>
    );
};

export default SecurityMonitoring;
