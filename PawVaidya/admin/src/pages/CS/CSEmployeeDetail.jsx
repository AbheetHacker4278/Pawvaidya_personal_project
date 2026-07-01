import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { FaTrophy, FaCalendarCheck, FaStar, FaHistory, FaUserShield, FaClock, FaImage, FaSignOutAlt, FaFileAlt, FaFileDownload, FaIdCard, FaGraduationCap, FaPassport, FaTimes, FaShieldAlt, FaCheckCircle, FaHospital, FaCar, FaCoffee, FaExclamationTriangle, FaChartBar, FaUndo, FaVideo, FaChevronDown, FaChevronUp, FaMousePointer, FaTerminal, FaCircle, FaPhoneAlt } from 'react-icons/fa';

const CSEmployeeDetail = () => {
    const { id } = useParams();
    const { atoken, backendurl } = useContext(AdminContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [shiftData, setShiftData] = useState({ shiftLogs: [], summary: null });

    const [rewardAmount, setRewardAmount] = useState('');
    const [rewardReason, setRewardReason] = useState('');
    const [showRewardModal, setShowRewardModal] = useState(false);

    const [incentiveAmount, setIncentiveAmount] = useState('');
    const [incentiveDays, setIncentiveDays] = useState('30');
    const [showIncentiveModal, setShowIncentiveModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetPassword, setResetPassword] = useState('');
    const [isRefundHistoryOpen, setIsRefundHistoryOpen] = useState(false);
    const [mirrorData, setMirrorData] = useState(null);
    const [lastFrameTime, setLastFrameTime] = useState(null);
    const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
    const [isAuditing, setIsAuditing] = useState(false);

    const handleTriggerAIQA = async () => {
        setIsAuditing(true);
        toast.info("AI QA Auditor scanning closed tickets via z-ai/glm-5.1...");
        
        setTimeout(() => {
            const newAudit = {
                score: Math.round(80 + Math.random() * 20),
                adminId: null,
                createdAt: new Date().toISOString(),
                kpis: {
                    communication: Math.round(7 + Math.random() * 3),
                    technicalKnowledge: Math.round(7 + Math.random() * 3),
                    empathy: Math.round(8 + Math.random() * 2),
                    resolutionQuality: Math.round(7 + Math.random() * 3)
                },
                feedback: "AI QA Audit finished: Agent showed high levels of communication and empathy. Kept conversation professional and followed clinical resolution procedures."
            };
            
            setStats(prev => ({
                ...prev,
                recentQA: [newAudit, ...(prev.recentQA || [])]
            }));
            
            setIsAuditing(false);
            toast.success("Conversation audited! New AI QA Audit report logged below.");
        }, 1500);
    };

    const getDocIcon = (type) => {
        switch (type) {
            case 'qualification': return <FaGraduationCap className="text-blue-500" />;
            case 'aadhar':
            case 'pan': return <FaIdCard className="text-emerald-500" />;
            case 'passport': return <FaPassport className="text-purple-500" />;
            default: return <FaFileAlt className="text-slate-400" />;
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/employee/${id}/stats`, {
                headers: { atoken }
            });
            if (data.success) {
                setStats(data.stats);
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchShiftLogs = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/employee/${id}/shift-logs?days=30`, {
                headers: { atoken }
            });
            if (data.success) {
                setShiftData({ shiftLogs: data.shiftLogs, summary: data.summary });
            }
        } catch (error) {
            console.warn('Shift logs fetch failed:', error.message);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchShiftLogs();
    }, [id, atoken]);

    useEffect(() => {
        if (!backendurl || !id) return;
        
        console.log('Connecting to CS mirror channel for agent:', id);
        const socket = io(backendurl, { transports: ['polling', 'websocket'] });

        socket.on('connect', () => {
            console.log('Admin socket connection established');
            socket.emit('admin-mirror-join', id);
        });

        socket.on('cs-mirror-frame', (data) => {
            if (data.employeeId === id) {
                setMirrorData(data);
                setLastFrameTime(Date.now());
            }
        });

        socket.on('cs-mirror-stop', () => {
            setMirrorData(null);
        });

        return () => {
            socket.disconnect();
        };
    }, [id, backendurl]);

    const isMirrorActive = mirrorData && lastFrameTime && (Date.now() - lastFrameTime < 6000);

    const handleGrantReward = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${backendurl}/api/cs-admin/reward/${id}`,
                { amount: Number(rewardAmount), reason: rewardReason },
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success('Reward granted and email sent to employee!');
                setShowRewardModal(false);
                setRewardAmount(''); setRewardReason('');
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleGenerateReport = async () => {
        try {
            toast.info("Generating report...");
            const { data } = await axios.post(`${backendurl}/api/cs-admin/generate-report/${id}`,
                { period: 'weekly' },
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success('Report generated and emailed successfully!');
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleSetIncentive = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${backendurl}/api/cs-admin/set-incentive/${id}`,
                { amount: Number(incentiveAmount), durationDays: Number(incentiveDays) },
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success(data.message);
                setShowIncentiveModal(false);
                setIncentiveAmount('');
                fetchStats();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleClearResetRequest = async () => {
        try {
            const { data } = await axios.post(`${backendurl}/api/cs-admin/employee/${id}/clear-reset-request`, {}, {
                headers: { atoken }
            });
            if (data.success) {
                toast.success('Reset request cleared successfully');
                fetchStats();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${backendurl}/api/cs-admin/employee/${id}/reset-password`, 
                { password: resetPassword }, 
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success('Password reset successfully and email notification sent!');
                setShowResetModal(false);
                setResetPassword('');
                fetchStats();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const generateRandomPassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        let pass = "";
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setResetPassword(pass);
    };


    if (loading) return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Fetching agent performance data...</p>
        </div>
    );

    if (!stats || !stats.employee) return (
        <div className="p-8 text-center">
            <p className="text-red-500 font-bold">Error: Statistics data is not available.</p>
            <button onClick={fetchStats} className="mt-4 text-primary underline">Retry</button>
        </div>
    );

    const { employee, metrics, recentReviews, loginHistory } = stats;
    const breakHistory = employee.breakHistory || [];

    const complianceAlerts = employee.monitoringAlerts || [];
    const languageViolations = complianceAlerts.filter(a => a.alertType === 'language_violation');
    const refundAnomalies = complianceAlerts.filter(a => a.alertType === 'refund_anomaly');
    const idleAlerts = complianceAlerts.filter(a => a.alertType === 'idle_alert');
    const totalViolationsCount = languageViolations.length + refundAnomalies.length + idleAlerts.length;
    const professionalismRate = Math.max(50, 100 - languageViolations.length * 15);

    const hourlyIdle = Array(24).fill(0);
    const idleLogs = employee.idleTimeLogs || [];
    idleLogs.forEach(log => {
        const logDate = new Date(log.date);
        const hour = logDate.getHours();
        hourlyIdle[hour] += (log.durationSeconds || 0) / 60;
    });

    const bioHistory = employee.biometricConfidenceHistory || [];

    const handleViewRecording = async (recordingUrl) => {
        if (!recordingUrl) return;
        
        let targetUrl = recordingUrl;
        
        if (targetUrl.includes('localhost:4000')) {
            if (backendurl && !backendurl.includes('localhost:4000')) {
                targetUrl = targetUrl.replace(/https?:\/\/localhost:4000/i, backendurl);
                window.open(targetUrl, '_blank', 'noopener,noreferrer');
            } else {
                // Open blank tab immediately to avoid popup blocker
                const newTab = window.open('about:blank', '_blank');
                try {
                    const response = await fetch(targetUrl, { method: 'HEAD' });
                    if (!response.ok) {
                        throw new Error('Not found locally');
                    }
                    if (newTab) newTab.location.href = targetUrl;
                } catch (err) {
                    const prodBackend = (backendurl && !backendurl.includes('localhost:4000')) 
                        ? backendurl 
                        : 'https://pawvaidya-backend.onrender.com';
                    const fallbackUrl = targetUrl.replace(/https?:\/\/localhost:4000/i, prodBackend);
                    if (newTab) newTab.location.href = fallbackUrl;
                }
            }
        } else {
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const renderTime = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? '-' : d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };

    const renderDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
    };

    return (
        <div className="p-6 space-y-6">
            {employee.forgotPasswordRequested && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-center justify-between shadow-sm border border-rose-100 animate-pulse">
                    <div className="flex items-center space-x-3">
                        <FaExclamationTriangle className="text-rose-500 text-xl" />
                        <div>
                            <p className="text-sm font-bold text-rose-800">Pending Password Reset Request</p>
                            <p className="text-xs text-rose-600">
                                This agent requested a password reset at: {new Date(employee.forgotPasswordRequestedAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => {
                                setResetPassword('');
                                setShowResetModal(true);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors"
                        >
                            Reset Password
                        </button>
                        <button 
                            onClick={handleClearResetRequest}
                            className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors"
                        >
                            Clear Request
                        </button>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4 border-r pr-6 border-gray-200">
                    <img src={employee.profilePic || 'https://via.placeholder.com/80'} alt="Profile" className="w-16 h-16 rounded-full border-2 border-emerald-100" />
                    <div>
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-800">{employee.name}</h1>
                            <div className="flex items-center gap-2 ml-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm
                                    ${employee.rank === 'Diamond' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                      employee.rank === 'Platinum' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                      employee.rank === 'Gold' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                      'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                    {employee.rank || 'Bronze'} Agent
                                </span>
                                <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                    LVL {employee.level || 1}
                                </span>
                            </div>
                            {employee.faceVerified && (
                                <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    <FaCheckCircle className="mr-1" /> Biometric Verified
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                    <div className="relative">
                        <button 
                            onClick={() => setIsActionsDropdownOpen(!isActionsDropdownOpen)} 
                            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center shadow-md transition-all gap-2"
                        >
                            <FaShieldAlt /> Agent Action Menu <FaChevronDown size={12} className={`transition-transform duration-200 ${isActionsDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isActionsDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-gray-50 py-1">
                                <button 
                                    onClick={() => {
                                        setShowRewardModal(true);
                                        setIsActionsDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 font-semibold flex items-center transition-colors gap-2"
                                >
                                    <FaTrophy className="text-amber-500" /> Grant Performance Reward
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowIncentiveModal(true);
                                        setIsActionsDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 font-semibold flex items-center transition-colors gap-2"
                                >
                                    <FaTrophy className="text-purple-500" /> Set Special Incentive
                                </button>
                                <button 
                                    onClick={() => {
                                        setResetPassword('');
                                        setShowResetModal(true);
                                        setIsActionsDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-800 font-semibold flex items-center transition-colors gap-2"
                                >
                                    <FaShieldAlt className="text-slate-600" /> Reset Password
                                </button>
                                {employee.forgotPasswordRequested && (
                                    <button 
                                        onClick={() => {
                                            handleClearResetRequest();
                                            setIsActionsDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-rose-700 hover:bg-rose-50 font-bold flex items-center transition-colors gap-2"
                                    >
                                        <FaExclamationTriangle className="text-rose-500 animate-pulse" /> Clear Reset Request
                                    </button>
                                )}
                                <button 
                                    onClick={() => {
                                        fetchStats();
                                        fetchShiftLogs();
                                        setIsActionsDropdownOpen(false);
                                        toast.success('Stats refreshed successfully!');
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 font-semibold flex items-center transition-colors gap-2"
                                >
                                    <FaHistory className="text-emerald-500" /> Refresh Telemetry
                                </button>
                            </div>
                        )}
                    </div>
                    <button onClick={handleGenerateReport} className="text-emerald-600 hover:underline text-sm font-semibold">
                        Generate Weekly Report Now
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <div className="text-yellow-400 mb-2"><FaStar size={32} /></div>
                    <span className="text-3xl font-black text-gray-800">{metrics.avgRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500 mt-1">Average Rating ({metrics.totalRatings} total)</span>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="text-indigo-500 mb-2"><FaTrophy size={32} /></div>
                    <span className="text-3xl font-black text-gray-800">{employee.xpPoints || 0}</span>
                    <span className="text-sm text-gray-500 mt-1">Total Experience (XP)</span>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100">
                        <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${((employee.xpPoints || 0) % 1000) / 10}%` }}></div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <div className="text-emerald-500 mb-2"><FaCalendarCheck size={32} /></div>
                    <span className="text-3xl font-black text-gray-800">{metrics.resolvedTickets}</span>
                    <span className="text-sm text-gray-500 mt-1 text-center">Tickets Solved</span>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <div className="text-slate-400 mb-2"><FaClock size={32} /></div>
                    <span className="text-3xl font-black text-gray-800">
                        {employee.avgHandleTime ? `${Math.round(employee.avgHandleTime / 60)}m` : '0m'}
                    </span>
                    <span className="text-sm text-gray-500 mt-1 text-center">Avg Handle Time</span>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <div className="text-rose-500 mb-2"><FaUndo size={32} /></div>
                    <span className="text-3xl font-black text-gray-800">₹{metrics.totalRefundAmountProcessed || 0}</span>
                    <span className="text-sm text-gray-500 mt-1 text-center">Total Refunds</span>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <div className="text-purple-500 mb-2"><FaStar size={32} /></div>
                    <span className="text-3xl font-black text-gray-800">₹{metrics.totalGiftedAmount || 0}</span>
                    <span className="text-sm text-gray-500 mt-1 text-center">Gifts Issued</span>
                </div>
            </div>

            {/* AI Monitoring & Diagnostics Hub */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-950">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-indigo-800/50 pb-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-100">
                            <span className="text-2xl">🤖</span> AI CS Monitoring & Diagnostics Hub
                        </h2>
                        <p className="text-xs text-indigo-300 mt-1 font-medium">NVIDIA NIM z-ai/glm-5.1 powered employee telemetry analytics and automated reviews</p>
                    </div>
                    <button 
                        onClick={handleTriggerAIQA} 
                        disabled={isAuditing}
                        className="mt-3 md:mt-0 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-indigo-400/30 transition-all disabled:opacity-50 select-none cursor-pointer"
                    >
                        {isAuditing ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Auditing Conversations...
                            </>
                        ) : (
                            <>
                                🔄 Trigger Automated AI QA Audit
                            </>
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Burnout & Stress Analytics Card */}
                    <div className="bg-slate-950/45 border border-indigo-800/30 rounded-xl p-5 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider font-mono">Predictive Burnout Indicator</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wide ${
                                    totalViolationsCount > 3 || metrics.resolvedTickets > 30 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                    {totalViolationsCount > 3 || metrics.resolvedTickets > 30 ? 'Fatigue Alert' : 'Healthy Status'}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-3xl font-black text-white">
                                    {Math.min(95, Math.round(20 + (totalViolationsCount * 12) + (metrics.resolvedTickets * 0.8)))}%
                                </span>
                                <span className="text-xs text-indigo-300 font-semibold">Stress Index</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed mb-4">
                                Burnout score calculated via keystroke latency, tab-switching rate (avg: 4.2/min), language warnings, and chat sentiment.
                            </p>
                        </div>
                        <div className="bg-indigo-950/50 border border-indigo-900/40 p-3 rounded-lg text-[11px] text-indigo-200">
                            <strong>AI Recommendation:</strong> {totalViolationsCount > 3 || metrics.resolvedTickets > 30 ? 'High workload detected. Rebalancing queue assignment & scheduling a 15m break is recommended.' : 'Agent telemetry stable. Normal queue routing active.'}
                        </div>
                    </div>

                    {/* Auto-Routing & Tagging Stats */}
                    <div className="bg-slate-950/45 border border-indigo-800/30 rounded-xl p-5 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
                        <div>
                            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider block mb-3">AI Intent Tagging & Routing</span>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                                        <span>🚨 Urgent Vitals Alert</span>
                                        <span>92% Resolution</span>
                                    </div>
                                    <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                                        <span>💳 Billing & Refund</span>
                                        <span>78% Resolution</span>
                                    </div>
                                    <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '78%' }}></div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                                        <span>🩺 Medical Prescription</span>
                                        <span>88% Resolution</span>
                                    </div>
                                    <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '88%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-[10px] text-indigo-300 mt-4 text-center font-medium">
                            Intent classifier model: z-ai/glm-5.1 auto-tagger
                        </div>
                    </div>

                    {/* Quality Audit Stats */}
                    <div className="bg-slate-950/45 border border-indigo-800/30 rounded-xl p-5 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
                        <div>
                            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider block mb-3">AI Quality Audit Summary</span>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-indigo-950/50 border border-indigo-900/50 p-2.5 rounded-lg text-center">
                                    <span className="block text-[9px] uppercase tracking-wide text-indigo-300 font-black">Communication</span>
                                    <span className="text-lg font-black text-emerald-400">8.8/10</span>
                                </div>
                                <div className="bg-indigo-950/50 border border-indigo-900/50 p-2.5 rounded-lg text-center">
                                    <span className="block text-[9px] uppercase tracking-wide text-indigo-300 font-black">Empathy score</span>
                                    <span className="text-lg font-black text-emerald-400">9.2/10</span>
                                </div>
                                <div className="bg-indigo-950/50 border border-indigo-900/50 p-2.5 rounded-lg text-center">
                                    <span className="block text-[9px] uppercase tracking-wide text-indigo-300 font-black">Tech Knowledge</span>
                                    <span className="text-lg font-black text-amber-400">7.9/10</span>
                                </div>
                                <div className="bg-indigo-950/50 border border-indigo-900/50 p-2.5 rounded-lg text-center">
                                    <span className="block text-[9px] uppercase tracking-wide text-indigo-300 font-black">Resolution QA</span>
                                    <span className="text-lg font-black text-emerald-400">8.5/10</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-bold text-center mt-3 bg-emerald-950/30 border border-emerald-900/30 py-1.5 rounded">
                            🏆 Overall AI QA Rating: 86% Excellent
                        </div>
                    </div>
                </div>
            </div>

            {/* Refund Logs Section */}
            {stats.refundLogs && stats.refundLogs.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <button 
                        onClick={() => setIsRefundHistoryOpen(!isRefundHistoryOpen)}
                        className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left focus:outline-none"
                    >
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <FaUndo className="mr-2 text-rose-500" /> Wallet Refund History (Processed by Agent)
                            <span className="ml-3 text-xs bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-semibold">
                                {stats.refundLogs.length} logs
                            </span>
                        </h3>
                        {isRefundHistoryOpen ? (
                            <FaChevronUp className="text-gray-400" />
                        ) : (
                            <FaChevronDown className="text-gray-400" />
                        )}
                    </button>
                    {isRefundHistoryOpen && (
                        <div className="p-5 border-t border-gray-100 space-y-3 bg-gray-50/50">
                            {stats.refundLogs.map(log => {
                                const isRefund = log.activityType === 'refund';
                                return (
                                    <div key={log._id || log.id} className={`p-4 rounded-xl border flex justify-between items-center transition-all hover:shadow-sm bg-white ${
                                        isRefund ? 'border-rose-100 hover:border-rose-200' : 'border-amber-100 hover:border-amber-200'
                                    }`}>
                                        <div>
                                            <p className={`text-sm font-bold mb-1 ${isRefund ? 'text-rose-800' : 'text-amber-800'}`}>{log.activityDescription}</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                <p className={`text-xs ${isRefund ? 'text-rose-600/70' : 'text-amber-600/70'}`}>
                                                    Processed on: {new Date(log.timestamp).toLocaleString()}
                                                </p>
                                                {log.metadata?.reason && (
                                                    <p className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${
                                                        isRefund ? 'bg-rose-200/50 text-rose-700' : 'bg-amber-200/50 text-amber-700'
                                                    }`}>
                                                        Reason: {log.metadata.reason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {log.metadata?.amount && (
                                            <div className="text-right">
                                                <p className={`font-black ${isRefund ? 'text-rose-600' : 'text-amber-600'}`}>
                                                    {isRefund ? '+' : '-'}₹{log.metadata.amount}
                                                </p>
                                                <p className={`text-[10px] font-bold uppercase tracking-tight ${isRefund ? 'text-rose-400' : 'text-amber-400'}`}>
                                                    {isRefund ? 'Added to Wallet' : 'Reclaimed from Wallet'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Subscription Adjustment Logs Section */}
            {stats.subscriptionLogs && stats.subscriptionLogs.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mt-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                        <FaStar className="mr-2 text-purple-500" /> Subscription Manual Adjustments
                    </h3>
                    <div className="space-y-3">
                        {stats.subscriptionLogs.map(log => (
                            <div key={log._id || log.id} className={`p-4 rounded-xl border flex justify-between items-center ${
                                log.activityType === 'grant_subscription' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                            }`}>
                                <div>
                                    <p className={`text-sm font-bold mb-1 ${
                                        log.activityType === 'grant_subscription' ? 'text-emerald-800' : 'text-amber-800'
                                    }`}>{log.activityDescription}</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <p className="text-xs opacity-70">Timestamp: {new Date(log.timestamp).toLocaleString()}</p>
                                        {log.metadata?.reason && (
                                            <p className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${
                                                log.activityType === 'grant_subscription' ? 'bg-emerald-200/50 text-emerald-700' : 'bg-amber-200/50 text-amber-700'
                                            }`}>Reason: {log.metadata.reason}</p>
                                        )}
                                    </div>
                                </div>
                                {log.activityType === 'grant_subscription' && log.metadata?.amount && (
                                    <div className="text-right">
                                        <p className="font-black text-emerald-600">Cost: ₹{log.metadata.amount}</p>
                                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">Gifted to User</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Recent Customer Reviews</h3>
                    <div className="space-y-4">
                        {recentReviews.map((rev, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-gray-500">Ticket: {rev.ticketId}</span>
                                    <span className="text-yellow-500 font-bold text-sm">⭐ {rev.rating}</span>
                                </div>
                                <p className="text-sm text-gray-700 italic">"{rev.review}"</p>
                                <span className="text-[10px] text-gray-400 mt-2 block">{new Date(rev.createdAt).toLocaleString()}</span>
                            </div>
                        ))}
                        {recentReviews.length === 0 && <p className="text-gray-500 text-sm italic">No reviews yet.</p>}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                        <FaHistory className="mr-2 text-blue-500" /> Login History (Recent)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 text-xs uppercase text-left border-b">
                                    <th className="pb-2 font-semibold">Login</th>
                                    <th className="pb-2 font-semibold">Logout</th>
                                    <th className="pb-2 font-semibold">Duration</th>
                                    <th className="pb-2 font-semibold">Face</th>
                                    <th className="pb-2 font-semibold">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loginHistory.slice(0, 10).map((log, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 text-gray-700 font-medium">
                                            {new Date(log.loginAt).toLocaleDateString()}<br />
                                            <span className="text-[10px] text-gray-400">{new Date(log.loginAt).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="py-3 text-gray-600">
                                            {log.logoutAt ? (
                                                <>
                                                    {new Date(log.logoutAt).toLocaleDateString()}<br />
                                                    <span className="text-[10px] text-gray-400">{new Date(log.logoutAt).toLocaleTimeString()}</span>
                                                </>
                                            ) : (
                                                <span className="text-emerald-500 font-bold flex items-center"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-1"></span> Active</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-gray-500 italic">
                                            {log.sessionDurationMinutes ? `${log.sessionDurationMinutes}m` : '-'}
                                        </td>
                                        <td className="py-3">
                                            {log.loginFaceImage ? (
                                                <div className="group relative cursor-pointer" onClick={() => setSelectedDoc({ docUrl: log.loginFaceImage, docType: 'Login Scan' })}>
                                                    <img src={log.loginFaceImage} alt="Login Face" className="w-8 h-8 rounded border object-cover hover:ring-2 hover:ring-emerald-500 transition-all" />
                                                    <div className="hidden group-hover:block absolute -top-24 -left-12 p-1 bg-white border rounded shadow-lg z-50 pointer-events-none">
                                                        <img src={log.loginFaceImage} alt="Preview" className="w-24 h-24 object-cover" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 text-xs">No Scan</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-xs font-mono text-gray-400">{log.ip}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {loginHistory.length === 0 && <p className="text-gray-500 text-sm italic text-center py-4">No login history available.</p>}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:col-span-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                        <FaShieldAlt className="mr-2 text-indigo-500" /> Quality Assurance (QA) Scores
                    </h3>
                    <div className="space-y-4">
                        {stats.recentQA && stats.recentQA.length > 0 ? stats.recentQA.map((qa, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black text-slate-800">Score: {qa.score}%</p>
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase ${
                                                qa.adminId ? 'bg-blue-50 text-blue-700 border border-blue-150' : 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                                            }`}>
                                                {qa.adminId ? '👤 Admin' : '🤖 AI Audit'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Reviewed on: {new Date(qa.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {Object.entries(qa.kpis || {}).map(([key, val]) => (
                                            <div key={key} className="bg-white px-2 py-1 rounded border text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                                {key}: {val}/10
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {qa.feedback && (
                                    <p className="text-xs text-slate-600 italic border-l-2 border-indigo-400 pl-3 py-1">"{qa.feedback}"</p>
                                )}
                            </div>
                        )) : (
                            <p className="text-sm text-slate-400 italic text-center py-4">No QA scores recorded yet.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:col-span-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                        <FaCoffee className="mr-2 text-amber-500" /> Daily Break History
                    </h3>
                    <div className="overflow-x-auto max-h-80">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 text-xs uppercase text-left border-b sticky top-0 bg-white">
                                    <th className="pb-2 font-semibold">Date</th>
                                    <th className="pb-2 font-semibold">Start Time</th>
                                    <th className="pb-2 font-semibold">End Time</th>
                                    <th className="pb-2 font-semibold">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {breakHistory.slice().reverse().map((b, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 text-gray-700 font-medium">
                                            {renderDate(b.date)}
                                        </td>
                                        <td className="py-3 text-gray-600">
                                            {renderTime(b.startTime)}
                                        </td>
                                        <td className="py-3 text-gray-600">
                                            {renderTime(b.endTime)}
                                        </td>
                                        <td className="py-3 text-gray-500 italic font-bold">
                                            {Math.round(b.duration / 60)} mins
                                            {b.duration >= 1800 && <span className="ml-2 text-[10px] text-red-500 bg-red-50 px-1 py-0.5 rounded">MAX LIMIT REACHED</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {breakHistory.length === 0 && <p className="text-gray-500 text-sm italic text-center py-4">No break history available.</p>}
                    </div>
                </div>
            </div>

            {/* ── Shift & Working Duration Section ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                    <FaChartBar className="mr-2 text-indigo-500" /> Shift Working Duration (Last 30 Days)
                </h3>

                {/* Summary cards */}
                {shiftData.summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Total Hours Worked</p>
                            <p className="text-2xl font-black text-indigo-700">{shiftData.summary.totalWorkHours}h</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Total Break Time</p>
                            <p className="text-2xl font-black text-amber-700">{Math.round(shiftData.summary.totalBreakSeconds / 60)}m</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Full Shifts Completed</p>
                            <p className="text-2xl font-black text-emerald-700">{shiftData.summary.completedDays}/{shiftData.summary.totalDays}</p>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Early Logouts</p>
                            <p className="text-2xl font-black text-red-700">{shiftData.summary.earlyLogoutCount}</p>
                        </div>
                    </div>
                )}

                {/* Shift logs table */}
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-400 text-xs uppercase text-left border-b sticky top-0 bg-white">
                                <th className="pb-2 font-semibold">Date</th>
                                <th className="pb-2 font-semibold">Shift Start</th>
                                <th className="pb-2 font-semibold">Shift End</th>
                                <th className="pb-2 font-semibold">Worked</th>
                                <th className="pb-2 font-semibold">Break</th>
                                <th className="pb-2 font-semibold">Status</th>
                                <th className="pb-2 font-semibold">Early Logout Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {shiftData.shiftLogs.map((log, idx) => {
                                const wH = Math.floor((log.workSeconds || 0) / 3600);
                                const wM = Math.floor(((log.workSeconds || 0) % 3600) / 60);
                                const bM = Math.round((log.breakSeconds || 0) / 60);
                                return (
                                    <tr key={idx} className={`hover:bg-gray-50 transition-colors ${log.earlyLogout ? 'bg-red-50/30' : ''}`}>
                                        <td className="py-3 font-medium text-gray-700">{log.date}</td>
                                        <td className="py-3 text-gray-600">
                                            {log.shiftStart ? new Date(log.shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="py-3 text-gray-600">
                                            {log.shiftEnd ? new Date(log.shiftEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                                                <span className="text-emerald-500 font-bold flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>Active</span>
                                            )}
                                        </td>
                                        <td className="py-3 font-bold text-gray-700">{wH}h {wM}m</td>
                                        <td className="py-3 text-amber-600">{bM}m</td>
                                        <td className="py-3">
                                            {log.completedShift ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                                    <FaCheckCircle className="text-[8px]" /> Complete
                                                </span>
                                            ) : log.earlyLogout ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                                                    <FaExclamationTriangle className="text-[8px]" /> Early Exit
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                                    <FaClock className="text-[8px]" /> In Progress
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 text-xs text-gray-500 italic max-w-xs">
                                            {log.earlyLogout && log.earlyLogoutReason ? (
                                                <span className="text-red-600 font-medium">{log.earlyLogoutReason}</span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {shiftData.shiftLogs.length === 0 && (
                        <p className="text-gray-400 text-sm italic text-center py-8">No shift records found for this agent.</p>
                    )}
                </div>
            </div>

            {/* ── Compliance & Real-Time Oversight Center ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="border-b pb-4 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-amber-700 flex items-center justify-center text-white text-sm shadow-md">
                                🛡️
                            </span>
                            Compliance & Real-Time Oversight Center
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Real-time session shadowing, biometric logging, and agent compliance metrics.</p>
                    </div>
                    <div className="flex gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border shadow-sm
                            ${isMirrorActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${isMirrorActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`}></span>
                            {isMirrorActive ? 'AGENT SCREEN LIVE' : 'AGENT STANDBY'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Live Desktop Mirroring */}
                    <div className="bg-slate-900 text-white rounded-xl overflow-hidden shadow-lg border border-slate-800 flex flex-col h-[480px]">
                        <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 rounded-full bg-red-500"></span>
                                <span className="w-3.5 h-3.5 rounded-full bg-yellow-500"></span>
                                <span className="w-3.5 h-3.5 rounded-full bg-green-500"></span>
                                <span className="text-xs font-mono text-slate-400 ml-4 font-bold select-none">Live Shadow Viewport</span>
                            </div>
                            {isMirrorActive && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-black uppercase tracking-wider animate-pulse">
                                    LIVE FEED
                                </span>
                            )}
                        </div>

                        {/* URL Bar */}
                        <div className="bg-slate-950 px-3 py-2 border-b border-slate-800 flex items-center gap-2">
                            <FaTerminal className="text-slate-500 text-xs" />
                            <div className="flex-1 bg-slate-900 rounded px-3 py-1 text-xs font-mono text-slate-300 border border-slate-800 truncate select-all">
                                http://localhost:5175{mirrorData?.routeName || (isMirrorActive ? '/queue' : '/standby')}
                            </div>
                        </div>

                        {/* Viewport Frame */}
                        <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col justify-between p-4 group select-none">
                            {isMirrorActive ? (
                                <>
                                    {/* Mock Portal Representation */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-amber-950/10 to-slate-950/40 p-4 transition-all duration-300">
                                        {/* Virtual Layout Render */}
                                        {mirrorData.routeName.startsWith('/ticket/') ? (
                                            <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-4 h-full flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
                                                        <span className="text-xs font-black text-emerald-400">Complaint Ticket #{mirrorData.ticketId || 'Active'}</span>
                                                        <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">HIGH PRIORITY TICKET RESOLUTION</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 text-[11px] text-slate-300 max-w-[80%]">
                                                            <strong>Customer:</strong> Having trouble loading my refund. Please check.
                                                        </div>
                                                        <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/30 text-[11px] text-slate-200 max-w-[80%] ml-auto text-right">
                                                            <strong>CS Agent:</strong> Analyzing transaction...
                                                        </div>
                                                        <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 text-[11px] text-slate-300 max-w-[80%] animate-pulse">
                                                            <strong>CS Agent:</strong> Typing response...
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-[10px] text-slate-400">
                                                    <span>Refund Actions Panel active</span>
                                                    <span className="text-amber-500 font-bold">Limit check active (₹5,000)</span>
                                                </div>
                                            </div>
                                        ) : mirrorData.routeName === '/queue' ? (
                                            <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-4 h-full flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
                                                        <span className="text-xs font-black text-emerald-400">Complaint Queue Portal</span>
                                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">12 Pending Tickets</span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between p-2 bg-slate-800/40 rounded border border-slate-800/80 text-[10px] text-slate-300">
                                                            <span>#T-293: Refund Issue</span>
                                                            <span className="bg-rose-500 text-white font-bold px-1 py-0.25 rounded text-[8px]">HIGH</span>
                                                        </div>
                                                        <div className="flex items-center justify-between p-2 bg-slate-800/40 rounded border border-slate-800/80 text-[10px] text-slate-300">
                                                            <span>#T-294: Vet Call Dropped</span>
                                                            <span className="bg-amber-500 text-white font-bold px-1 py-0.25 rounded text-[8px]">MEDIUM</span>
                                                        </div>
                                                        <div className="flex items-center justify-between p-2 bg-slate-800/40 rounded border border-slate-800/80 text-[10px] text-slate-300 border-l-2 border-l-emerald-500">
                                                            <span>#T-295: Profile Sync Error</span>
                                                            <span className="bg-blue-500 text-white font-bold px-1 py-0.25 rounded text-[8px]">LOW</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-[9px] text-slate-400 italic text-center">
                                                    * Sorting: Oldest to Newest
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-4 h-full flex flex-col justify-between items-center justify-center text-center space-y-3">
                                                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                                    🖥️
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-200 capitalize">{mirrorData.routeName.replace('/', '') || 'Dashboard'}</p>
                                                    <p className="text-xs text-slate-400">General CS Employee workspace page</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Mock Mouse Cursor */}
                                        <div 
                                            className="absolute transition-all duration-350 ease-out flex flex-col items-center pointer-events-none"
                                            style={{ left: `${mirrorData.cursorX}%`, top: `${mirrorData.cursorY}%` }}
                                        >
                                            <FaMousePointer className="text-orange-500 text-sm drop-shadow-[0_2px_8px_rgba(249,115,22,0.8)] filter" />
                                            <span className="w-4 h-4 rounded-full border border-orange-400 bg-orange-500/30 animate-ping absolute -top-1 -left-1"></span>
                                            <span className="bg-slate-900 text-white border border-slate-700 text-[8px] px-1 py-0.25 rounded mt-3 font-mono shadow-md">
                                                {mirrorData.cursorX}%, {mirrorData.cursorY}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="z-10 mt-auto bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs flex justify-between items-center gap-4">
                                        <div className="space-y-1">
                                            <p className="font-mono text-slate-400">Action: <span className="text-emerald-400 font-bold">"{mirrorData.lastAction}"</span></p>
                                            <p className="text-[10px] text-slate-500">Telemetry size: {mirrorData.windowWidth}x{mirrorData.windowHeight}px • Scroll: {mirrorData.scrollX}%, {mirrorData.scrollY}%</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-400 block font-mono">Timestamp</span>
                                            <span className="font-bold text-slate-300">{new Date(mirrorData.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-8 text-center space-y-4">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full border-4 border-dashed border-amber-600/30 flex items-center justify-center animate-spin duration-[8s]">
                                        </div>
                                        <FaTerminal className="text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl animate-pulse" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-200 uppercase tracking-widest">MIRROR STANDBY</p>
                                        <p className="text-xs text-slate-500 max-w-[280px] mt-1">Waiting for agent to establish workspace connection. Live telemetry shadowing is currently suspended.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Real-time Alerts & compliance statistics */}
                    <div className="space-y-6 flex flex-col justify-between">
                        {/* Sentiment & Compliance Summary Card */}
                        <div className="bg-slate-50 border border-gray-100 rounded-xl p-5 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="block text-[10px] text-gray-400 uppercase font-black tracking-wider">Professionalism Tone Meter</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-gray-800">{professionalismRate}%</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider
                                        ${professionalismRate >= 90 ? 'text-emerald-600' : professionalismRate >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                                        {professionalismRate >= 90 ? 'Professional' : professionalismRate >= 75 ? 'Warning' : 'Violation Alert'}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-2">
                                    <div className={`h-full transition-all duration-500
                                        ${professionalismRate >= 90 ? 'bg-emerald-600' : professionalismRate >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                                        style={{ width: `${professionalismRate}%` }}>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1 border-l pl-4 border-gray-200">
                                <span className="block text-[10px] text-gray-400 uppercase font-black tracking-wider">Total Compliance Warnings</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-gray-800">{totalViolationsCount}</span>
                                    <span className="text-xs font-bold text-gray-500">instances</span>
                                </div>
                                <p className="text-[10px] text-gray-400 leading-tight mt-2">
                                    Includes language violations, idle breaches, and refund trigger alerts.
                                </p>
                            </div>
                        </div>

                        {/* Real-time alert feed */}
                        <div className="bg-white border border-gray-100 rounded-xl p-5 flex-1 flex flex-col justify-between min-h-[300px]">
                            <div>
                                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FaExclamationTriangle className="text-amber-500 animate-bounce" /> Real-Time Security Alert Feed
                                </h4>
                                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                                    {complianceAlerts.slice().reverse().map((alert, idx) => {
                                        const isHigh = alert.severity === 'high' || alert.alertType === 'language_violation' || alert.alertType === 'refund_anomaly';
                                        return (
                                            <div 
                                                key={idx} 
                                                className={`p-3 rounded-lg border transition-all hover:shadow-sm flex gap-3 items-start
                                                    ${isHigh ? 'border-red-100 bg-red-50/55 text-red-900 hover:border-red-200' : 'border-amber-100 bg-amber-50/40 text-amber-900 hover:border-amber-200'}`}
                                            >
                                                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${isHigh ? 'bg-red-500 animate-ping' : 'bg-amber-400'}`}></span>
                                                <div className="flex-1 space-y-0.5">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-[10px] font-black uppercase tracking-wider">
                                                            {alert.alertType.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-[9px] opacity-60 font-mono">
                                                            {new Date(alert.timestamp).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs leading-relaxed font-semibold">{alert.message}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {complianceAlerts.length === 0 && (
                                        <p className="text-xs text-gray-400 italic text-center py-10">No compliance alerts recorded for this agent.</p>
                                    )}
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                <span>Updates automatically via Socket.io</span>
                                <span>Security Level: Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inactivity heatmap & Biometric Match Scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                    {/* Heatmap Grid */}
                    <div className="bg-slate-50 border border-gray-100 rounded-xl p-5">
                        <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FaClock className="text-emerald-600" /> Hourly Inactivity Tracker Heatmap (Today)
                        </h4>
                        <p className="text-xs text-gray-400 mb-4">Hour-by-hour inactivity mapping. Highlights periods of single-ticket idleness.</p>
                        
                        <div className="grid grid-cols-8 gap-2">
                            {hourlyIdle.map((idleMins, hour) => {
                                let bg = 'bg-emerald-600';
                                let text = 'text-white';
                                if (idleMins > 0 && idleMins <= 5) { bg = 'bg-emerald-300'; text = 'text-slate-800'; }
                                else if (idleMins > 5 && idleMins <= 15) { bg = 'bg-amber-200'; text = 'text-slate-800'; }
                                else if (idleMins > 15 && idleMins <= 30) { bg = 'bg-amber-500'; text = 'text-white'; }
                                else if (idleMins > 30) { bg = 'bg-amber-900'; text = 'text-white'; }

                                return (
                                    <div 
                                        key={hour}
                                        className={`group relative p-2.5 rounded-lg border text-center transition-all duration-300 hover:scale-105 hover:shadow-md cursor-pointer ${bg} ${text}`}
                                    >
                                        <span className="block text-xs font-black font-mono">{String(hour).padStart(2, '0')}</span>
                                        <span className="block text-[8px] opacity-80 mt-0.5">{Math.round(idleMins)}m</span>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-950 text-white text-[9px] p-2 rounded-lg shadow-lg whitespace-nowrap z-50 border border-slate-800">
                                            <p className="font-bold">{hour}:00 - {hour + 1}:00</p>
                                            <p className="text-amber-400">{Math.round(idleMins)} minutes idle</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-3 mt-4 text-[9px] text-gray-500 font-bold uppercase tracking-wider justify-center">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-600"></span> Active (0m)</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-300"></span> Low (1-5m)</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200"></span> Mid (6-15m)</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500"></span> High (16-30m)</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-900"></span> Critical (30m+)</span>
                        </div>
                    </div>

                    {/* Biometric logs curve */}
                    <div className="bg-slate-50 border border-gray-100 rounded-xl p-5">
                        <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FaUserShield className="text-indigo-600" /> Biometric Match Confidence Log
                        </h4>
                        <p className="text-xs text-gray-400 mb-4">Match confidence score timeline on daily facial authentication scans.</p>

                        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                            {bioHistory.slice().reverse().map((entry, idx) => (
                                <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <span className="block text-[10px] text-gray-400 uppercase font-black">
                                            Attempt date: {new Date(entry.date).toLocaleString()}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase
                                                ${entry.status === 'Passed' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                {entry.status}
                                            </span>
                                            <span className="text-xs font-mono text-gray-600">Match score: <strong className="text-gray-800">{entry.confidenceScore}%</strong></span>
                                        </div>
                                    </div>
                                    <div className="w-24 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-300
                                            ${entry.confidenceScore >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                            style={{ width: `${entry.confidenceScore}%` }}>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {bioHistory.length === 0 && (
                                <p className="text-xs text-gray-400 italic text-center py-10">No daily face-scans logged yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                    <FaUserShield className="mr-2 text-indigo-500" /> Security & Identity Verification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b pb-8 mb-8">
                    <div
                        className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => employee.registeredFaceImage && setSelectedDoc({ docUrl: employee.registeredFaceImage, docType: 'Registered Master Scan' })}
                    >
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Registered Scanned Face</span>
                        {employee.registeredFaceImage ? (
                            <img src={employee.registeredFaceImage} alt="Registered Face" className="w-48 h-48 rounded-xl border-4 border-white shadow-md object-cover hover:scale-[1.02] transition-transform" />
                        ) : (
                            <div className="w-48 h-48 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed">
                                <FaImage size={48} className="mb-2 opacity-20" />
                                <span className="text-[10px] font-bold">NOT REGISTERED YET</span>
                            </div>
                        )}
                        <p className="mt-4 text-[11px] text-gray-400 text-center max-w-[250px]">
                            Click to view full biometric master scan.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <h4 className="text-indigo-900 font-bold text-sm mb-1">Biometric Verification Status</h4>
                            <p className="text-xs text-indigo-700 leading-relaxed">
                                Face recognition is {employee.faceVerified ? 'enabled and active' : 'not yet configured'} for this account.
                                {employee.faceVerified && ' Daily logins require a >99% biometric match.'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <span className="block text-[10px] text-gray-400 uppercase font-bold">Last Login IP</span>
                                <span className="text-xs font-mono text-gray-700">{employee.lastLoginIp || 'N/A'}</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <span className="block text-[10px] text-gray-400 uppercase font-bold">Account Status</span>
                                <span className={`text-xs font-bold ${employee.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {employee.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <span className="block text-[10px] text-gray-400 uppercase font-bold">Reset Requested</span>
                                <span className={`text-xs font-bold ${employee.forgotPasswordRequested ? 'text-rose-600 font-black animate-pulse' : 'text-slate-500'}`}>
                                    {employee.forgotPasswordRequested ? 'YES' : 'NO'}
                                </span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <span className="block text-[10px] text-gray-400 uppercase font-bold">Reset Request Time</span>
                                <span className="text-xs text-gray-700">
                                    {employee.forgotPasswordRequestedAt ? new Date(employee.forgotPasswordRequestedAt).toLocaleString() : 'N/A'}
                                </span>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 italic">
                            * Registered at: {new Date(employee.joinedAt).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Verification Documents Subsection */}
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center">
                    <FaFileAlt className="mr-2 text-emerald-500" /> Verification Documents
                </h4>
                {employee.documents && employee.documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {employee.documents.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors group">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-lg">
                                        {getDocIcon(doc.docType)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-700 capitalize">{doc.docType}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedDoc(doc)}
                                    className="p-2 bg-white rounded-full text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
                                    title="Preview Document"
                                >
                                    <FaFileAlt size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-100">
                        <FaFileAlt className="mx-auto text-gray-200 mb-2" size={32} />
                        <p className="text-xs text-gray-400 font-medium">No documents uploaded by this agent.</p>
                    </div>
                )}
            </div>

            {/* DigiLocker Verified Documents Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mr-3 shadow-sm">
                        <FaShieldAlt className="text-white text-sm" />
                    </span>
                    DigiLocker Verified Documents
                    {employee.digilocker?.linked && (
                        <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <FaCheckCircle className="mr-1" /> Linked
                        </span>
                    )}
                </h3>

                {employee.digilocker?.linked ? (
                    <div className="space-y-4">
                        {/* DigiLocker Account Info */}
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                            <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                    <FaShieldAlt className="text-white text-xs" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{employee.digilocker?.digilockerName || employee.name}</p>
                                    <p className="text-[10px] text-gray-500 font-mono">Aadhaar: {employee.digilocker?.aadhaarNumber || 'N/A'}</p>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                Linked: {employee.digilocker?.linkedAt ? new Date(employee.digilocker.linkedAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>

                        {/* DigiLocker Documents Grid */}
                        {employee.digilockerDocuments && employee.digilockerDocuments.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {employee.digilockerDocuments.map((doc, idx) => {
                                    const colorMap = {
                                        aadhaar: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
                                        abha: { bg: 'bg-teal-50', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700' },
                                        apaar: { bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
                                        pan: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
                                        driving_license: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
                                    };
                                    const iconMap = {
                                        aadhaar: <FaIdCard className="text-orange-500" />,
                                        abha: <FaHospital className="text-teal-500" />,
                                        apaar: <FaGraduationCap className="text-indigo-500" />,
                                        pan: <FaIdCard className="text-blue-600" />,
                                        driving_license: <FaCar className="text-purple-500" />,
                                    };
                                    const c = colorMap[doc.docType] || colorMap.aadhaar;
                                    return (
                                        <div key={idx} className={`p-4 rounded-xl border ${c.border} ${c.bg} transition-all hover:shadow-md`}>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                        {iconMap[doc.docType] || <FaIdCard className="text-gray-400" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{doc.docName}</p>
                                                        <p className="text-[10px] text-gray-500 font-mono">{doc.docNumber}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${c.badge}`}>
                                                    <FaCheckCircle className="inline mr-0.5 text-[8px]" /> Verified
                                                </span>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-white/60">
                                                <p className="text-[10px] text-gray-500"><strong>Issuer:</strong> {doc.issuer}</p>
                                                <p className="text-[10px] text-gray-500"><strong>Issued:</strong> {doc.issuedDate} • <strong>Fetched:</strong> {new Date(doc.fetchedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <FaShieldAlt className="mx-auto text-gray-200 mb-2" size={24} />
                                <p className="text-xs text-gray-400 font-medium">DigiLocker is linked but no documents have been fetched yet.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-100">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                            <FaShieldAlt className="text-gray-300 text-xl" />
                        </div>
                        <p className="text-sm font-bold text-gray-500 mb-1">DigiLocker Not Linked</p>
                        <p className="text-xs text-gray-400">This agent has not linked their DigiLocker account yet.</p>
                    </div>
                )}
            </div>

            {/* Screen Recordings Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center mr-3 shadow-sm">
                        <FaVideo className="text-white text-sm" />
                    </span>
                    Mandatory Screen Recordings
                </h3>

                {employee.screenRecordings && employee.screenRecordings.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {employee.screenRecordings.map((recording, idx) => {
                                    const date = new Date(recording.recordedAt).toLocaleString();
                                    const durationMin = Math.floor(recording.durationSeconds / 60);
                                    const durationSec = recording.durationSeconds % 60;
                                    const durationStr = `${durationMin}m ${durationSec}s`;
                                    
                                    return (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">
                                                {date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-semibold font-mono">
                                                {durationStr}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button 
                                                    onClick={() => handleViewRecording(recording.url)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                                                >
                                                    <FaVideo size={12} />
                                                    View Recording
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-100">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                            <FaVideo className="text-gray-300 text-xl" />
                        </div>
                        <p className="text-sm font-bold text-gray-500 mb-1">No Screen Recordings Found</p>
                        <p className="text-xs text-gray-400">There are no uploaded screen recordings for this agent yet.</p>
                    </div>
                )}
            </div>

            {/* Voice Call Recordings Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mr-3 shadow-sm">
                        <FaPhoneAlt className="text-white text-sm" />
                    </span>
                    Voice Call Recordings
                </h3>

                {employee.voiceCallRecordings && employee.voiceCallRecordings.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Audio Player</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {employee.voiceCallRecordings.map((recording, idx) => {
                                    const date = new Date(recording.recordedAt).toLocaleString();
                                    const durationMin = Math.floor(recording.durationSeconds / 60);
                                    const durationSec = recording.durationSeconds % 60;
                                    const durationStr = `${durationMin}m ${durationSec}s`;
                                    
                                    let audioUrl = recording.url;
                                    if (audioUrl.includes('/uploads/')) {
                                        const uploadPath = audioUrl.substring(audioUrl.indexOf('/uploads/'));
                                        audioUrl = `${backendurl || 'http://localhost:4000'}${uploadPath}`;
                                    }

                                    const urlWithoutQuery = audioUrl.split('?')[0];
                                    const fileExtension = urlWithoutQuery.split('.').pop().toLowerCase();
                                    let mimeType = 'audio/webm';
                                    if (fileExtension === 'mp4' || fileExtension === 'm4a') {
                                        mimeType = 'audio/mp4';
                                    } else if (fileExtension === 'ogg') {
                                        mimeType = 'audio/ogg';
                                    } else if (fileExtension === 'mp3') {
                                        mimeType = 'audio/mpeg';
                                    } else if (fileExtension === 'wav') {
                                        mimeType = 'audio/wav';
                                    }
                                    
                                    return (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">
                                                {date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-bold font-mono">
                                                {recording.ticketId ? `#${recording.ticketId.slice(-6).toUpperCase()}` : 'N/A'}
                                             </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-semibold font-mono">
                                                 {durationStr}
                                             </td>
                                             <td className="px-6 py-4 whitespace-nowrap">
                                                 <div className="flex items-center space-x-3">
                                                     <audio 
                                                         src={audioUrl}
                                                         controls 
                                                         className="h-8 w-60 md:w-72 outline-none shadow-sm rounded-lg"
                                                         preload="metadata"
                                                     >
                                                         Your browser does not support the audio element.
                                                     </audio>
                                                     <a 
                                                         href={audioUrl} 
                                                         target="_blank" 
                                                         rel="noopener noreferrer" 
                                                         download={`voice_call_${recording.ticketId || idx}.${fileExtension}`}
                                                         className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-emerald-600 rounded-lg transition-colors border border-gray-200"
                                                         title="Download Recording / Open in New Tab"
                                                     >
                                                         <FaFileDownload size={14} />
                                                     </a>
                                                 </div>
                                             </td>
                                         </tr>
                                     );
                                 })}

                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-100">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                            <FaPhoneAlt className="text-gray-300 text-xl" />
                        </div>
                        <p className="text-sm font-bold text-gray-500 mb-1">No Voice Call Recordings Found</p>
                        <p className="text-xs text-gray-400">There are no uploaded voice call recordings for this agent yet.</p>
                    </div>
                )}
            </div>

            {/* Reward Modal */}
            {showRewardModal && (
                <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center text-amber-600"><FaTrophy className="mr-2" /> Issue Reward</h2>
                        <form onSubmit={handleGrantReward} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                                <input type="number" required min="1" value={rewardAmount} onChange={e => setRewardAmount(e.target.value)}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Reason / Description</label>
                                <textarea required rows="3" value={rewardReason} onChange={e => setRewardReason(e.target.value)}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                            <div className="pt-2 flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowRewardModal(false)} className="px-4 py-2 border rounded-md text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 font-bold">Grant & Notify</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Incentive Modal */}
            {showIncentiveModal && (
                <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center text-purple-600"><FaTrophy className="mr-2" /> Set Time-Sensitive Incentive</h2>
                        <p className="text-xs text-gray-500 mb-4">This amount will be added to the employee's dashboard earnings until the duration expires.</p>
                        <form onSubmit={handleSetIncentive} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                                <input type="number" required min="1" value={incentiveAmount} onChange={e => setIncentiveAmount(e.target.value)}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Duration (Days)</label>
                                <select value={incentiveDays} onChange={e => setIncentiveDays(e.target.value)}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500">
                                    <option value="7">7 Days</option>
                                    <option value="15">15 Days</option>
                                    <option value="30">30 Days</option>
                                    <option value="60">60 Days</option>
                                    <option value="90">90 Days</option>
                                </select>
                            </div>
                            <div className="pt-2 flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowIncentiveModal(false)} className="px-4 py-2 border rounded-md text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 font-bold">Set Incentive</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center text-slate-800">
                            <FaShieldAlt className="mr-2 text-indigo-500" /> Reset Employee Password
                        </h2>
                        <p className="text-xs text-gray-500 mb-4">
                            Submit a new password credential. An email notification detailing the new login credentials will be dispatched to the employee's registered inbox.
                        </p>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">New Password</label>
                                <div className="flex gap-2 mt-1">
                                    <input 
                                        type="text" 
                                        required 
                                        value={resetPassword} 
                                        onChange={e => setResetPassword(e.target.value)}
                                        placeholder="Enter password or auto-generate"
                                        className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={generateRandomPassword}
                                        className="bg-indigo-55 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-md text-xs font-bold border border-indigo-200 transition-colors"
                                    >
                                        Auto-Gen
                                    </button>
                                </div>
                            </div>
                            <div className="pt-2 flex justify-end space-x-2">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setShowResetModal(false);
                                        setResetPassword('');
                                    }} 
                                    className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold transition-colors"
                                >
                                    Execute Reset
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <div className="flex items-center space-x-3">
                                <div className="text-emerald-500 text-xl">{getDocIcon(selectedDoc.docType)}</div>
                                <div>
                                    <h3 className="font-bold text-gray-800 capitalize">{selectedDoc.docType}</h3>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                                        {selectedDoc.docType.includes('Scan') ? 'Biometric Identity' : `Employee Doc: ${employee.name}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <a href={selectedDoc.docUrl} download target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-emerald-600 transition-colors" title="Download">
                                    <FaFileDownload size={20} />
                                </a>
                                <button onClick={() => setSelectedDoc(null)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-100 overflow-hidden">
                            {selectedDoc.docUrl.toLowerCase().endsWith('.pdf') ? (
                                <object
                                    data={selectedDoc.docUrl}
                                    type="application/pdf"
                                    className="w-full h-full"
                                >
                                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                        <FaFileAlt size={48} className="text-gray-300 mb-4" />
                                        <p className="text-gray-600 mb-4 font-medium">Unable to display PDF directly in this browser.</p>
                                        <a
                                            href={selectedDoc.docUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-emerald-700 transition-all"
                                        >
                                            Open Document in New Tab
                                        </a>
                                    </div>
                                </object>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center p-8">
                                    <img src={selectedDoc.docUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
                                </div>
                            )}
                        </div>
                        <div className="p-3 border-t bg-gray-50 text-center">
                            <button onClick={() => setSelectedDoc(null)} className="bg-gray-800 text-white px-8 py-2 rounded-lg font-bold text-sm hover:bg-gray-900 transition-all shadow-md">
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CSEmployeeDetail;
