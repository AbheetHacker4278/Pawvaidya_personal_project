import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const CSEmployees = () => {
    const { atoken, backendurl, adminProfile } = useContext(AdminContext);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEarlyExitsModal, setShowEarlyExitsModal] = useState(false);
    const [earlyExits, setEarlyExits] = useState([]);
    const [loadingExits, setLoadingExits] = useState(false);

    // Ticket Aging Heatmap
    const [showHeatmapModal, setShowHeatmapModal] = useState(false);
    const [heatmapData, setHeatmapData] = useState([]);
    const [loadingHeatmap, setLoadingHeatmap] = useState(false);

    // Resolution Time Trend
    const [showTrendModal, setShowTrendModal] = useState(false);
    const [trendData, setTrendData] = useState({ weeks: [], trends: [] });
    const [loadingTrend, setLoadingTrend] = useState(false);

    // Real-time behavioral alerts feed
    const [liveAlerts, setLiveAlerts] = useState([]);
    const [showAlertsPanel, setShowAlertsPanel] = useState(false);
    const socketRef = useRef(null);

    // Response Lag Report
    const [showLagModal, setShowLagModal] = useState(false);
    const [lagData, setLagData] = useState([]);
    const [loadingLag, setLoadingLag] = useState(false);

    // Overtime / Undertime
    const [showOTModal, setShowOTModal] = useState(false);
    const [otData, setOtData] = useState([]);
    const [loadingOT, setLoadingOT] = useState(false);

    // Break Compliance
    const [showBreakModal, setShowBreakModal] = useState(false);
    const [breakData, setBreakData] = useState([]);
    const [loadingBreak, setLoadingBreak] = useState(false);

    // Suspicious Logins
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginData, setLoginData] = useState([]);
    const [loadingLogin, setLoadingLogin] = useState(false);

    // Agent Comparison Matrix
    const [showMatrixModal, setShowMatrixModal] = useState(false);
    const [matrixData, setMatrixData] = useState([]);
    const [loadingMatrix, setLoadingMatrix] = useState(false);

    // Live Script Adherence scores from socket
    const [scriptScores, setScriptScores] = useState({}); // { employeeId: score }

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();

    // Complaint State
    const [complaintModalOpen, setComplaintModalOpen] = useState(false);
    const [selectedEmpForComplaint, setSelectedEmpForComplaint] = useState(null);
    const [complaintTitle, setComplaintTitle] = useState('');
    const [complaintDesc, setComplaintDesc] = useState('');

    const handleRaiseComplaint = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${backendurl}/api/cs-admin/raise-complaint`,
                { targetAgentId: selectedEmpForComplaint._id, title: complaintTitle, description: complaintDesc },
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success('Complaint raised successfully');
                setComplaintModalOpen(false);
                setSelectedEmpForComplaint(null);
                setComplaintTitle('');
                setComplaintDesc('');
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        }
    };

    // Delete Employee State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [empToDelete, setEmpToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleDeleteEmployee = async () => {
        if (!empToDelete) return;
        setDeleteLoading(true);
        try {
            const { data } = await axios.delete(
                `${backendurl}/api/cs-admin/delete-employee/${empToDelete._id}`,
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success(data.message);
                setEmployees(prev => prev.filter(e => e._id !== empToDelete._id));
                setDeleteModalOpen(false);
                setEmpToDelete(null);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDevBypass = async (agentEmail) => {
        try {
            const { data } = await axios.get(`${backendurl}/api/cs/dev-login/${agentEmail}`);
            if (data.success) {
                window.open(`http://localhost:5175/login?bypass-token=${data.token}`, '_blank');
                toast.success(`⚡ Quick-Login bypass link opened for ${agentEmail}!`);
            } else {
                toast.error(data.error || 'Bypass failed.');
            }
        } catch (err) {
            toast.error(err.message);
        }
    };

    const fetchEmployees = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/all-employees`, {
                headers: { atoken }
            });
            if (data.success) {
                setEmployees(data.employees);
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchEarlyExits = async () => {
        setLoadingExits(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/early-exits?days=30`, {
                headers: { atoken }
            });
            if (data.success) {
                setEarlyExits(data.earlyExits);
            } else toast.error(data.message);
        } catch (error) {
            toast.error("Failed to fetch early exits");
        } finally {
            setLoadingExits(false);
        }
    };

    const fetchHeatmap = async () => {
        setLoadingHeatmap(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/ticket-aging-heatmap`, {
                headers: { atoken }
            });
            if (data.success) setHeatmapData(data.heatmap);
            else toast.error(data.message);
        } catch (err) {
            toast.error('Failed to fetch heatmap data');
        } finally {
            setLoadingHeatmap(false);
        }
    };

    const fetchTrend = async () => {
        setLoadingTrend(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/resolution-trend`, {
                headers: { atoken }
            });
            if (data.success) setTrendData({ weeks: data.weeks, trends: data.trends });
            else toast.error(data.message);
        } catch (err) {
            toast.error('Failed to fetch resolution trend');
        } finally {
            setLoadingTrend(false);
        }
    };

    const fetchLag = async () => {
        setLoadingLag(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/response-lag-report`, { headers: { atoken } });
            if (data.success) setLagData(data.report);
            else toast.error(data.message);
        } catch (err) { toast.error('Failed to fetch lag data'); }
        finally { setLoadingLag(false); }
    };

    const fetchOT = async () => {
        setLoadingOT(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/overtime-undertime-report`, { headers: { atoken } });
            if (data.success) setOtData(data.report);
            else toast.error(data.message);
        } catch (err) { toast.error('Failed to fetch overtime data'); }
        finally { setLoadingOT(false); }
    };

    const fetchBreak = async () => {
        setLoadingBreak(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/break-compliance-report`, { headers: { atoken } });
            if (data.success) setBreakData(data.report);
            else toast.error(data.message);
        } catch (err) { toast.error('Failed to fetch break data'); }
        finally { setLoadingBreak(false); }
    };

    const fetchLogins = async () => {
        setLoadingLogin(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/suspicious-logins`, { headers: { atoken } });
            if (data.success) setLoginData(data.report);
            else toast.error(data.message);
        } catch (err) { toast.error('Failed to fetch login data'); }
        finally { setLoadingLogin(false); }
    };

    const fetchMatrix = async () => {
        setLoadingMatrix(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/agent-comparison-matrix`, { headers: { atoken } });
            if (data.success) setMatrixData(data.matrix);
            else toast.error(data.message);
        } catch (err) { toast.error('Failed to fetch matrix data'); }
        finally { setLoadingMatrix(false); }
    };


    useEffect(() => {
        fetchEmployees();
    }, [atoken]);

    // Real-time behavioral alert socket
    useEffect(() => {
        if (!backendurl) return;
        const socket = io(backendurl, { transports: ['polling', 'websocket'] });
        socketRef.current = socket;
        socket.on('connect', () => {
            socket.emit('admin-join-monitor');
        });
        socket.on('cs-agent-alert', (alert) => {
            setLiveAlerts(prev => [{ ...alert, id: Date.now() }, ...prev].slice(0, 50));
            setShowAlertsPanel(true);
        });
        // Script adherence updates
        socket.on('cs-agent-script-update', (data) => {
            setScriptScores(prev => ({ ...prev, [data.employeeId]: data.score }));
        });
        return () => socket.disconnect();
    }, [backendurl]);



    const handleCreateEmployee = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${backendurl}/api/cs-admin/create-employee`,
                { name, email, password },
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success('Employee created successfully');
                setShowModal(false);
                setName(''); setEmail(''); setPassword('');
                fetchEmployees();
            } else toast.error(data.message);
        } catch (err) { toast.error(err.response?.data?.message || err.message); }
    };

    const toggleSuspension = async (id, isSuspended) => {
        try {
            const endpoint = isSuspended ? 'unsuspend' : 'suspend';
            const { data } = await axios.put(`${backendurl}/api/cs-admin/${endpoint}/${id}`, {}, { headers: { atoken } });
            if (data.success) {
                toast.success(`Employee ${isSuspended ? 'unsuspended' : 'suspended'}`);
                fetchEmployees();
            } else toast.error(data.message);
        } catch (err) { toast.error(err.message); }
    };

    async function handleSyncXP() {
        try {
            const { data } = await axios.post(`${backendurl}/api/cs-gamification/recalculate-all`, {}, { headers: { atoken } });
            if (data.success) {
                toast.success('Performance XP synced for all agents!');
                fetchEmployees();
            } else toast.error(data.message);
        } catch (err) { toast.error(err.message); }
    }

    const fmtDuration = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    if (loading) return <div className="p-8">Loading employees...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Support Employees</h1>
                    <p className="text-sm text-gray-500">Manage Customer Service Agents</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSyncXP}
                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-all shadow-sm flex items-center gap-2 text-sm font-bold active:scale-95 border border-indigo-100"
                    >
                        <span>🏆</span> Sync XP
                    </button>
                    <button
                        onClick={() => { setShowEarlyExitsModal(true); fetchEarlyExits(); }}
                        className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2 rounded-lg transition-all shadow-sm flex items-center gap-2 text-sm font-bold active:scale-95"
                    >
                        <span>⏱</span> Early Exits Log
                    </button>
                    <button
                        onClick={() => { setShowHeatmapModal(true); fetchHeatmap(); }}
                        className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-4 py-2 rounded-lg transition-all shadow-sm flex items-center gap-2 text-sm font-bold active:scale-95"
                    >
                        <span>🌡️</span> Aging Heatmap
                    </button>
                    <button
                        onClick={() => { setShowTrendModal(true); fetchTrend(); }}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-lg transition-all shadow-sm flex items-center gap-2 text-sm font-bold active:scale-95"
                    >
                        <span>📈</span> Resolution Trend
                    </button>
                    <button
                        onClick={() => setShowAlertsPanel(p => !p)}
                        className={`relative px-4 py-2 rounded-lg transition-all shadow-sm flex items-center gap-2 text-sm font-bold active:scale-95 ${liveAlerts.length > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600'
                            }`}
                    >
                        <span>🔴</span> Live Alerts
                        {liveAlerts.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white px-1 shadow-lg">
                                {liveAlerts.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => navigate('/cs-chat')}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all shadow-md flex items-center gap-2 text-sm font-bold active:scale-95"
                    >
                        <span>💬</span> Agent Inbox
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-all shadow-md flex items-center gap-2 text-sm font-bold active:scale-95"
                    >
                        <span>+</span> Add Employee
                    </button>
                </div>

            </div>

            {/* Advanced Monitoring & Security Suite */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 bg-indigo-50 border border-indigo-100 rounded-xl">🛡️</span>
                    <div>
                        <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Agent Analytics & Audit Suite</h2>
                        <p className="text-[10px] text-slate-500 font-semibold">Real-time risk monitoring, compliance audits, and performance matrices</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={() => { setShowLagModal(true); fetchLag(); }}
                        className="bg-white hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                    >
                        <span>⏱️</span> Response Lag Tracker
                    </button>
                    <button
                        onClick={() => { setShowOTModal(true); fetchOT(); }}
                        className="bg-white hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                    >
                        <span>🗓️</span> Overtime & Undertime
                    </button>
                    <button
                        onClick={() => { setShowBreakModal(true); fetchBreak(); }}
                        className="bg-white hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                    >
                        <span>☕</span> Break Compliance
                    </button>
                    <button
                        onClick={() => { setShowLoginModal(true); fetchLogins(); }}
                        className="bg-white hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                    >
                        <span>🚨</span> Login Pattern Alerts
                    </button>
                    <button
                        onClick={() => { setShowMatrixModal(true); fetchMatrix(); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                    >
                        <span>📊</span> Team Comparison Matrix
                    </button>
                </div>
            </div>

            {/* Quick Leaderboard Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {employees.length > 0 && [...employees].sort((a, b) => (b.xpPoints || 0) - (a.xpPoints || 0)).slice(0, 3).map((agent, i) => (
                    <div key={agent._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-2 text-[10px] font-black uppercase tracking-widest text-white rounded-bl-xl shadow-sm
                            ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : 'bg-orange-500'}`}>
                            #{i + 1}
                        </div>
                        <div className="relative">
                            <img src={agent.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}`} className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-50 shadow-sm" alt="" />
                            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                                {agent.level || 1}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 group-hover:text-emerald-600 transition-colors">{agent.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{agent.rank || 'Bronze'} · {agent.xpPoints || 0} XP</p>
                            <div className="mt-2 flex items-center gap-3">
                                <span className="text-[10px] font-bold text-emerald-600">{agent.totalTicketsResolved || 0} Solved</span>
                                <span className="text-[10px] font-bold text-slate-400">{agent.averageRating?.toFixed(1) || '0.0'} ★</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Agent Info</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Level & Rank</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Efficiency</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Quality</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Management</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {employees.map((emp) => (
                            <tr key={emp._id} className="hover:bg-slate-50/50 transition-all duration-200 group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center">
                                        <div className="relative">
                                            <img src={emp.profilePic || 'https://via.placeholder.com/40'} alt="" className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
                                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{emp.name}</div>
                                            <div className="text-xs text-slate-500 font-medium">{emp.email}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                {!emp.profileComplete && (
                                                    <span className="inline-block text-[9px] px-1.5 py-0.5 bg-orange-50 text-orange-600 font-bold rounded uppercase tracking-tighter">Profile Incomplete</span>
                                                )}
                                                {emp.faceVerified && (
                                                    <span className="inline-block text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded uppercase tracking-tighter">Face ID Verified</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border
                                                ${emp.rank === 'Diamond' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    emp.rank === 'Platinum' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                                        emp.rank === 'Gold' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                                {emp.rank || 'Bronze'}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">Lvl {emp.level || 1}</span>
                                        </div>
                                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${((emp.xpPoints || 0) % 1000) / 10}%` }}
                                            />
                                        </div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                            {emp.xpPoints || 0} Total XP
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-slate-700">
                                            {emp.avgHandleTime ? `${Math.round(emp.avgHandleTime / 60)}m` : '0m'}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Avg Handle</span>
                                        <div className="mt-1 text-[10px] font-bold text-emerald-600">
                                            {emp.totalTicketsResolved || 0} Resolved
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="flex items-center space-x-1">
                                            <div className="flex text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className={`w-3 h-3 ${i < Math.round(emp.averageRating || 0) ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                            <span className="text-[11px] font-black text-slate-700">{emp.averageRating ? emp.averageRating.toFixed(1) : '0.0'}</span>
                                        </div>
                                        <div className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter
                                            ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {emp.status}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-4">
                                        {adminProfile?.role === 'master_cs_agent' && (
                                            <button
                                                onClick={() => { setSelectedEmpForComplaint(emp); setComplaintModalOpen(true); }}
                                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center gap-1"
                                            >
                                                ⚠️ Report
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDevBypass(emp.email)}
                                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-1"
                                        >
                                            ⚡ Bypass
                                        </button>
                                        <button
                                            onClick={() => toggleSuspension(emp._id, emp.status === 'suspended')}
                                            className={`text-[11px] font-bold uppercase tracking-wider transition-colors
                                                ${emp.status === 'suspended' ? "text-emerald-600 hover:text-emerald-700" : "text-rose-500 hover:text-rose-600"}`}
                                        >
                                            {emp.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                                        </button>
                                        <button
                                            onClick={() => navigate('/cs-chat/' + emp._id)}
                                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                                        >
                                            Chat
                                        </button>
                                        <button
                                            onClick={() => navigate(`/cs-employee/${emp._id}`)}
                                            className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                                        >
                                            Detailed Stats
                                        </button>
                                        {adminProfile?.role === 'master' && (
                                            <button
                                                onClick={() => { setEmpToDelete(emp); setDeleteModalOpen(true); }}
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-1"
                                            >
                                                🗑 Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {employees.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                    No support agents found. Create your first agent to start monitoring performance.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">New CS Agent</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleCreateEmployee} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Temporary Password</label>
                                <input type="text" required value={password} onChange={e => setPassword(e.target.value)}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500" />
                                <p className="text-xs text-gray-500 mt-1">They will use this to login and complete their profile.</p>
                            </div>
                            <div className="pt-2 flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Early Exits Modal */}
            {showEarlyExitsModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[85vh] overflow-hidden animate-fadeIn">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    <span className="text-rose-500">⏱</span> Global Early Exits Log
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">Showing all agents who logged out before completing their 10hr shift (Last 30 days)</p>
                            </div>
                            <button
                                onClick={() => setShowEarlyExitsModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto bg-slate-50/30">
                            {loadingExits ? (
                                <div className="py-12 flex justify-center">
                                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : earlyExits.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                                    <p className="text-slate-400 font-medium">No early exits recorded in the last 30 days. 🎉</p>
                                </div>
                            ) : (
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date & Time</th>
                                                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Agent</th>
                                                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Shift Progress</th>
                                                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason Provided</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {earlyExits.map((log) => (
                                                <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <div className="text-sm font-bold text-slate-700">
                                                            {new Date(log.shiftStart).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-xs font-medium text-slate-400">
                                                            {new Date(log.shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(log.shiftEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={log.employeeId?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(log.employeeId?.name || 'A')}&background=10b981&color=fff`}
                                                                className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                                                                alt=""
                                                            />
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-800">{log.employeeId?.name || 'Unknown Agent'}</div>
                                                                <div className="text-xs text-slate-500">{log.employeeId?.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                                                <span>{fmtDuration(log.workSeconds || 0)} worked</span>
                                                                <span className="text-slate-400 font-medium">of 10h</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                                <div
                                                                    className="bg-amber-400 h-full rounded-full"
                                                                    style={{ width: `${Math.min(100, ((log.workSeconds || 0) / 36000) * 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 font-medium">
                                                                {fmtDuration(log.breakSeconds || 0)} breaks taken
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 max-w-[250px]">
                                                        <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-600 text-xs font-semibold rounded-md border border-rose-100">
                                                            {log.earlyLogoutReason ? (log.earlyLogoutReason.includes(' - ') ? log.earlyLogoutReason.split(' - ')[0] : 'Early Leave') : 'No reason provided'}
                                                        </span>
                                                        {log.earlyLogoutReason && (
                                                            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed italic">
                                                                "{log.earlyLogoutReason.includes(' - ') ? log.earlyLogoutReason.split(' - ').slice(1).join(' - ') : log.earlyLogoutReason}"
                                                            </p>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Live Behavioral Alerts Panel ══════════════════════════════════ */}
            {showAlertsPanel && (
                <div className="fixed bottom-6 right-6 w-[420px] max-h-[520px] bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 flex flex-col z-[200] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                            <h3 className="text-sm font-black text-white">Live Agent Alerts</h3>
                            <span className="text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full font-bold">{liveAlerts.length}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setLiveAlerts([])} className="text-slate-500 hover:text-slate-300 text-xs font-bold transition-colors">Clear</button>
                            <button onClick={() => setShowAlertsPanel(false)} className="text-slate-500 hover:text-white text-lg transition-colors leading-none">&times;</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-900/60">
                        {liveAlerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <span className="text-3xl mb-2">🛡️</span>
                                <p className="text-slate-500 text-xs font-medium">No alerts yet. Monitoring active agents...</p>
                            </div>
                        ) : liveAlerts.map(alert => (
                            <div key={alert.id} className={`p-3 rounded-xl border text-xs font-medium flex gap-3 ${alert.type === 'focus_loss'
                                    ? 'bg-amber-950/40 border-amber-800/50'
                                    : alert.severity === 'high'
                                        ? 'bg-rose-950/40 border-rose-800/50'
                                        : 'bg-orange-950/40 border-orange-800/50'
                                }`}>
                                <div className="flex-shrink-0 mt-0.5">
                                    {alert.type === 'focus_loss' ? (
                                        <span className="text-amber-400 text-base">👁️</span>
                                    ) : (
                                        <span className="text-rose-400 text-base">📋</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-black text-white truncate">{alert.employeeName}</span>
                                        <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${alert.severity === 'high' ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'
                                            }`}>{alert.severity}</span>
                                    </div>
                                    <p className="text-slate-300 leading-relaxed">{alert.message}</p>
                                    {alert.preview && (
                                        <p className="text-slate-500 text-[10px] mt-1 truncate italic">Preview: "{alert.preview}"</p>
                                    )}
                                    <p className="text-slate-600 text-[10px] mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ══ Ticket Aging Heatmap Modal ════════════════════════════════════ */}
            {showHeatmapModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-rose-50">
                            <div>
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">🌡️ Ticket Aging Heatmap</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Open ticket ages per agent — sorted by most neglected first</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={fetchHeatmap} className="text-xs text-orange-600 font-bold hover:underline">↻ Refresh</button>
                                <button onClick={() => setShowHeatmapModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 text-lg transition-colors">&times;</button>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="px-6 py-3 border-b border-slate-50 bg-slate-50 flex items-center gap-6 text-[11px] font-bold">
                            <span className="text-slate-400 uppercase tracking-wider">Age Legend:</span>
                            {[
                                { key: 'fresh', label: '< 2h', color: 'bg-emerald-400' },
                                { key: 'moderate', label: '2h–12h', color: 'bg-amber-400' },
                                { key: 'stale', label: '12h–48h', color: 'bg-orange-500' },
                                { key: 'critical', label: '> 48h', color: 'bg-rose-600' },
                            ].map(b => (
                                <div key={b.key} className="flex items-center gap-1.5">
                                    <span className={`w-3 h-3 rounded-sm ${b.color}`} />
                                    <span className="text-slate-600">{b.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loadingHeatmap ? (
                                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
                            ) : heatmapData.length === 0 ? (
                                <div className="text-center py-16 text-slate-400 font-medium">No active agents with open tickets.</div>
                            ) : heatmapData.map(agent => (
                                <div key={agent.employeeId} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="px-5 py-4 flex items-center justify-between bg-slate-50/60 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <img src={agent.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=f97316&color=fff`}
                                                className="w-9 h-9 rounded-xl object-cover border border-slate-200" alt="" />
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{agent.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{agent.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <div>
                                                <p className="text-lg font-black text-slate-800">{agent.totalOpen}</p>
                                                <p className="text-[9px] text-slate-400 uppercase font-bold">Open Tickets</p>
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-xl text-sm font-black border ${agent.avgAgeHours > 48 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                    agent.avgAgeHours > 12 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                        agent.avgAgeHours > 2 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`}>
                                                Avg {agent.avgAgeHours}h
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 grid grid-cols-4 gap-3">
                                        {[
                                            { key: 'fresh', label: 'Fresh', color: 'bg-emerald-100 border-emerald-200 text-emerald-800', dot: 'bg-emerald-500' },
                                            { key: 'moderate', label: 'Moderate', color: 'bg-amber-100 border-amber-200 text-amber-800', dot: 'bg-amber-500' },
                                            { key: 'stale', label: 'Stale', color: 'bg-orange-100 border-orange-200 text-orange-800', dot: 'bg-orange-500' },
                                            { key: 'critical', label: 'Critical', color: 'bg-rose-100 border-rose-200 text-rose-800', dot: 'bg-rose-600' },
                                        ].map(bucket => (
                                            <div key={bucket.key} className={`rounded-xl p-3 border ${bucket.color}`}>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <span className={`w-2 h-2 rounded-full ${bucket.dot}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-wider">{bucket.label}</span>
                                                </div>
                                                <p className="text-2xl font-black">{agent.buckets[bucket.key].length}</p>
                                                <div className="mt-2 space-y-1">
                                                    {agent.buckets[bucket.key].slice(0, 2).map(t => (
                                                        <p key={t.ticketId} className="text-[10px] truncate opacity-70">{t.title}</p>
                                                    ))}
                                                    {agent.buckets[bucket.key].length > 2 && (
                                                        <p className="text-[10px] opacity-50">+{agent.buckets[bucket.key].length - 2} more</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Resolution Time Trend Modal ══════════════════════════════════ */}
            {showTrendModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div>
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">📈 Resolution Time Trend</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Avg ticket close time (hours) per agent — last 5 weeks</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={fetchTrend} className="text-xs text-blue-600 font-bold hover:underline">↻ Refresh</button>
                                <button onClick={() => setShowTrendModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 text-lg transition-colors">&times;</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {loadingTrend ? (
                                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
                            ) : trendData.trends.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="text-slate-400 font-medium text-sm">No resolution data available yet.</p>
                                    <p className="text-slate-300 text-xs mt-1">Agents need at least one closed ticket with handle time to appear here.</p>
                                </div>
                            ) : trendData.trends.map(agent => {
                                const validPoints = agent.trend.filter(w => w.avgHours !== null);
                                const maxHours = validPoints.length ? Math.max(...validPoints.map(w => w.avgHours)) : 1;
                                // Detect slowdown: is last week worse than first valid week?
                                const firstVal = validPoints[0]?.avgHours;
                                const lastVal = validPoints[validPoints.length - 1]?.avgHours;
                                const isSlowing = lastVal && firstVal && lastVal > firstVal * 1.25;
                                return (
                                    <div key={agent.employeeId} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-50">
                                            <div className="flex items-center gap-3">
                                                <img src={agent.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=6366f1&color=fff`}
                                                    className="w-9 h-9 rounded-xl object-cover border border-slate-200" alt="" />
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{agent.name}</p>
                                                    <p className="text-[10px] text-slate-400">{agent.email}</p>
                                                </div>
                                            </div>
                                            {isSlowing && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-xs font-black text-rose-600">
                                                    ⚠️ Resolution Slowdown Detected
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-5">
                                            <div className="flex items-end gap-2 h-28">
                                                {agent.trend.map((point, wi) => (
                                                    <div key={wi} className="flex-1 flex flex-col items-center gap-1">
                                                        <div className="relative w-full flex items-end" style={{ height: '80px' }}>
                                                            {point.avgHours !== null ? (
                                                                <div
                                                                    className={`w-full rounded-t-lg transition-all duration-700 ${point.avgHours > 24 ? 'bg-rose-500' :
                                                                            point.avgHours > 12 ? 'bg-orange-400' :
                                                                                point.avgHours > 6 ? 'bg-amber-400' :
                                                                                    'bg-emerald-500'
                                                                        }`}
                                                                    style={{ height: `${Math.max(6, (point.avgHours / Math.max(maxHours, 1)) * 80)}px` }}
                                                                    title={`${point.avgHours}h avg — ${point.ticketsCount} tickets`}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-1 bg-slate-100 rounded" />
                                                            )}
                                                        </div>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">{point.week}</span>
                                                        {point.avgHours !== null ? (
                                                            <span className="text-[9px] font-black text-slate-600">{point.avgHours}h</span>
                                                        ) : (
                                                            <span className="text-[9px] text-slate-300">—</span>
                                                        )}
                                                        <span className="text-[8px] text-slate-300">{point.ticketsCount || 0}t</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Response Lag Tracker Modal ════════════════════════════════════ */}
            {showLagModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
                            <div>
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">⏱️ Response Lag Tracker</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Average time agents take to respond after a user message (Last 30 Days)</p>
                            </div>
                            <button onClick={() => setShowLagModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 text-lg transition-colors">&times;</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingLag ? (
                                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
                            ) : lagData.length === 0 ? (
                                <p className="text-center py-12 text-slate-400 font-medium">No lag telemetry recorded yet.</p>
                            ) : (
                                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider">
                                                <th className="p-4">Agent</th>
                                                <th className="p-4">Avg Response Lag</th>
                                                <th className="p-4">Max Recorded Lag</th>
                                                <th className="p-4">Sample Size</th>
                                                <th className="p-4 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {lagData.map(agent => (
                                                <tr key={agent.employeeId} className="hover:bg-slate-50/50">
                                                    <td className="p-4 flex items-center gap-3">
                                                        <img src={agent.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}`} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                                        <div>
                                                            <p className="font-bold text-slate-800">{agent.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">{agent.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm font-black">
                                                        {agent.avgLagMinutes !== null ? (
                                                            <span className={agent.flagged ? 'text-rose-600 font-black' : 'text-slate-700'}>
                                                                {agent.avgLagMinutes} min
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">—</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-slate-600 font-medium">{agent.maxLag !== null ? `${agent.maxLag} min` : '—'}</td>
                                                    <td className="p-4 text-slate-500 font-medium">{agent.sampleSize} interactions</td>
                                                    <td className="p-4 text-center">
                                                        {agent.flagged ? (
                                                            <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 font-black uppercase tracking-wider text-[9px] animate-pulse">
                                                                ⚠️ Lag Warning (&gt;5m)
                                                            </span>
                                                        ) : agent.avgLagMinutes !== null ? (
                                                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-black uppercase tracking-wider text-[9px]">
                                                                Optimal
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">No Data</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Overtime & Undertime Tracker Modal ══════════════════════════════ */}
            {showOTModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50">
                            <div>
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">🗓️ Shift Schedule Audit (Last 14 Days)</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Compares actual worked hours vs scheduled 10-hour shifts</p>
                            </div>
                            <button onClick={() => setShowOTModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 text-lg transition-colors">&times;</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loadingOT ? (
                                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                            ) : otData.length === 0 ? (
                                <p className="text-center py-12 text-slate-400 font-medium">No shift log metrics found.</p>
                            ) : otData.map(agent => (
                                <div key={agent.employeeId} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-3">
                                            <img src={agent.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}`} className="w-9 h-9 rounded-xl object-cover" alt="" />
                                            <div>
                                                <p className="font-black text-slate-800 text-sm">{agent.name}</p>
                                                <p className="text-[10px] text-slate-400 font-semibold">{agent.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-right text-xs">
                                            <div>
                                                <p className="font-black text-slate-800">{agent.avgWorkHours}h</p>
                                                <p className="text-[9px] text-slate-400 uppercase font-black">Avg Daily Work</p>
                                            </div>
                                            {agent.isConsistentUnderperformer ? (
                                                <span className="px-2 py-1 rounded bg-rose-50 border border-rose-100 text-rose-700 font-black text-[9px] uppercase tracking-wider animate-pulse">
                                                    ⚠️ Under-Work Risk (&gt;=3 Days Undertime)
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 font-black text-[9px] uppercase tracking-wider">
                                                    Compliant
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                                        {agent.dailyData.slice(0, 7).map((day, idx) => {
                                            const hrs = (day.workSeconds / 3600).toFixed(1);
                                            return (
                                                <div key={idx} className={`p-2.5 rounded-lg border text-center ${day.status === 'undertime' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                                                        day.status === 'overtime' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' :
                                                            'bg-slate-50 border-slate-200 text-slate-700'
                                                    }`}>
                                                    <p className="text-[9px] font-black text-slate-400">{day.date}</p>
                                                    <p className="text-sm font-black mt-1">{hrs}h</p>
                                                    <p className="text-[8px] font-black uppercase mt-0.5 tracking-wide opacity-80">
                                                        {day.status === 'undertime' ? 'Undertime' : day.status === 'overtime' ? 'Overtime' : 'Normal'}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Break Compliance Audit Modal ════════════════════════════════════ */}
            {showBreakModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
                            <div>
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">☕ Today's Break Compliance Audit</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Detects skipped mandatory breaks (every 4h) and excessive short micro-breaks (&lt;3 min)</p>
                            </div>
                            <button onClick={() => setShowBreakModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 text-lg transition-colors">&times;</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loadingBreak ? (
                                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
                            ) : breakData.length === 0 ? (
                                <p className="text-center py-12 text-slate-400 font-medium">No active online agents currently on shift.</p>
                            ) : breakData.map(agent => (
                                <div key={agent.employeeId} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <img src={agent.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}`} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                            <div>
                                                <p className="font-bold text-slate-800 text-xs">{agent.name}</p>
                                                <p className="text-[10px] text-slate-400 font-semibold">{agent.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${agent.complianceStatus === 'non_compliant' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                                    agent.complianceStatus === 'warning' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                }`}>
                                                {agent.complianceStatus.replace('_', ' ')}
                                            </span>
                                            <div className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-lg">
                                                ☕ {agent.totalBreaks} breaks ({agent.totalBreakMinutes} mins)
                                            </div>
                                        </div>
                                    </div>

                                    {agent.issues.length > 0 && (
                                        <div className="mb-3 flex flex-wrap gap-1.5">
                                            {agent.issues.map((issue, idx) => (
                                                <span key={idx} className="bg-rose-50 text-rose-700 text-[10px] px-2 py-0.5 rounded font-black border border-rose-100">
                                                    ⚠️ {issue}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {agent.breaksDetail.length === 0 ? (
                                        <p className="text-[10px] text-slate-400 italic">No breaks taken today.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                                            {agent.breaksDetail.map((b, idx) => (
                                                <div key={idx} className={`p-2 rounded-lg border text-xs ${b.isShort ? 'bg-amber-50/50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-800'
                                                    }`}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-black">{b.durationMin} mins</span>
                                                        {b.isShort && <span className="text-[8px] bg-amber-500/20 px-1 py-0.5 rounded font-black uppercase text-amber-700">Micro-Break</span>}
                                                    </div>
                                                    <p className="text-[9px] text-slate-400 font-semibold">
                                                        {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Suspicious Login Pattern Alerts Modal ══════════════════════════ */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-orange-50">
                            <div>
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">🚨 Suspicious Login Pattern Alerts</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Identifies logins from new IPs, off-shift hours, or rapid consecutive sessions (Last 7 Days)</p>
                            </div>
                            <button onClick={() => setShowLoginModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 text-lg transition-colors">&times;</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loadingLogin ? (
                                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>
                            ) : loginData.length === 0 ? (
                                <p className="text-center py-12 text-slate-400 font-medium">No suspicious login flags detected in the past 7 days.</p>
                            ) : loginData.map(agent => (
                                <div key={agent.employeeId} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-3">
                                            <img src={agent.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}`} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                            <div>
                                                <p className="font-bold text-slate-800 text-xs">{agent.name}</p>
                                                <p className="text-[10px] text-slate-400 font-semibold">{agent.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                                                🚨 {agent.flagCount} Suspicous Incidents
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        {agent.flags.map((flag, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 text-xs font-semibold">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${flag.severity === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                                                    <span className="text-slate-700">{flag.message}</span>
                                                </div>
                                                <div className="text-right text-[10px] text-slate-400 font-semibold">
                                                    <span>IP: {flag.ip || 'Unknown'}</span>
                                                    <span className="mx-2">|</span>
                                                    <span>{new Date(flag.loginAt).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Agent Comparison Matrix Modal ══════════════════════════════════ */}
            {showMatrixModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50">
                            <div>
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">📊 Team Health Comparison Matrix</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Comprehensive team health scorecard — compares key compliance & efficiency parameters (Last 30 Days)</p>
                            </div>
                            <button onClick={() => setShowMatrixModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 text-lg transition-colors">&times;</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingMatrix ? (
                                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                            ) : matrixData.length === 0 ? (
                                <p className="text-center py-12 text-slate-400 font-medium">No performance data compiled.</p>
                            ) : (
                                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider">
                                                <th className="p-4">Agent</th>
                                                <th className="p-4 text-center">Avg Rating</th>
                                                <th className="p-4 text-center">FCR %</th>
                                                <th className="p-4 text-center">Idle Time</th>
                                                <th className="p-4 text-center">Avg Response Lag</th>
                                                <th className="p-4 text-center">QA Score</th>
                                                <th className="p-4 text-center">Refunds Issued</th>
                                                <th className="p-4 text-center">Live Script Score</th>
                                                <th className="p-4 text-center">Composite Health</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {matrixData.map(agent => (
                                                <tr key={agent.employeeId} className="hover:bg-slate-50/50">
                                                    <td className="p-4 flex items-center gap-3">
                                                        <img src={agent.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}`} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                                        <div>
                                                            <p className="font-bold text-slate-800">{agent.name}</p>
                                                            <p className="text-[9px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded font-black w-max mt-0.5 uppercase tracking-wide">
                                                                Lvl {agent.level} • {agent.rank}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center font-black text-slate-700 text-sm">⭐ {agent.avgRating.toFixed(1)}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full font-black ${agent.fcrPercent >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                                agent.fcrPercent >= 60 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                                    'bg-rose-50 text-rose-700 border border-rose-100'
                                                            }`}>
                                                            {agent.fcrPercent}%
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center text-slate-500 font-semibold">{agent.totalIdleMinutes} mins</td>
                                                    <td className="p-4 text-center font-semibold">
                                                        {agent.avgResponseLagMin !== null ? (
                                                            <span className={agent.avgResponseLagMin > 5 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                                                                {agent.avgResponseLagMin} mins
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">—</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {agent.avgQAScore !== null ? (
                                                            <span className={`px-2 py-0.5 rounded font-black ${agent.avgQAScore >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                                    agent.avgQAScore >= 70 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                                        'bg-rose-50 text-rose-700 border border-rose-100'
                                                                }`}>
                                                                {agent.avgQAScore}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">Unrated</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center font-bold text-slate-700">₹{agent.refundsIssued * 5000}+ ({agent.refundsIssued} issued)</td>
                                                    <td className="p-4 text-center font-black">
                                                        {scriptScores[agent.employeeId] !== undefined ? (
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] ${scriptScores[agent.employeeId] >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                                }`}>
                                                                📝 {scriptScores[agent.employeeId]}% Match
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">Idle / No Live Score</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden min-w-[70px]">
                                                                <div className={`h-full transition-all duration-500 ${agent.healthScore >= 80 ? 'bg-emerald-500' :
                                                                        agent.healthScore >= 50 ? 'bg-amber-500' :
                                                                            'bg-rose-500'
                                                                    }`} style={{ width: `${agent.healthScore}%` }} />
                                                            </div>
                                                            <span className="font-black text-slate-800 text-[10px]">{agent.healthScore}/100</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Complaint Modal */}
            {complaintModalOpen && selectedEmpForComplaint && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">⚠️ Raise Complaint</h2>
                            <button onClick={() => { setComplaintModalOpen(false); setSelectedEmpForComplaint(null); }} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
                        </div>
                        <p className="text-xs text-slate-500 mb-4 font-semibold">Reporting Agent: <span className="text-slate-800 font-bold">{selectedEmpForComplaint.name}</span> ({selectedEmpForComplaint.email})</p>
                        <form onSubmit={handleRaiseComplaint} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Complaint Title</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={complaintTitle} 
                                    onChange={e => setComplaintTitle(e.target.value)}
                                    placeholder="e.g. Script Non-Adherence, Poor Tone"
                                    className="w-full border-slate-200 rounded-xl text-sm p-3 focus:ring-rose-500 focus:border-rose-500 bg-slate-50" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Detailed Description</label>
                                <textarea 
                                    required 
                                    value={complaintDesc} 
                                    onChange={e => setComplaintDesc(e.target.value)} 
                                    rows="4"
                                    placeholder="Provide details about the incident or performance issue..."
                                    className="w-full border-slate-200 rounded-xl text-sm p-3 focus:ring-rose-500 focus:border-rose-500 bg-slate-50 min-h-[100px]" 
                                />
                            </div>
                            <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100 mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => { setComplaintModalOpen(false); setSelectedEmpForComplaint(null); }} 
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-100 active:scale-95"
                                >
                                    Submit Complaint
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && empToDelete && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex flex-col items-center text-center gap-3 mb-5">
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-2xl">🗑️</div>
                            <h2 className="text-lg font-black text-slate-800">Delete CS Agent?</h2>
                            <p className="text-sm text-slate-500">
                                You are about to <span className="font-bold text-red-600">permanently delete</span> the account of{' '}
                                <span className="font-bold text-slate-800">{empToDelete.name}</span> ({empToDelete.email}).
                            </p>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-semibold text-left w-full">
                                ⚠️ This action cannot be undone. The agent will receive an automated dismissal email.
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setDeleteModalOpen(false); setEmpToDelete(null); }}
                                disabled={deleteLoading}
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteEmployee}
                                disabled={deleteLoading}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-sm font-black transition-all shadow-md shadow-red-100 active:scale-95"
                            >
                                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CSEmployees;
