import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FaTrophy, FaCalendarCheck, FaStar, FaHistory, FaUserShield, FaClock, FaImage, FaSignOutAlt, FaFileAlt, FaFileDownload, FaIdCard, FaGraduationCap, FaPassport, FaTimes, FaShieldAlt, FaCheckCircle, FaHospital, FaCar, FaCoffee, FaExclamationTriangle, FaChartBar, FaUndo, FaVideo } from 'react-icons/fa';

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

    const getRecordingUrl = (url) => {
        if (!url) return '';
        if (url.includes('localhost:4000') && backendurl && !backendurl.includes('localhost:4000')) {
            return url.replace(/https?:\/\/localhost:4000/i, backendurl);
        }
        return url;
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
                    <button onClick={() => setShowRewardModal(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm">
                        <FaTrophy className="mr-2" /> Grant Reward
                    </button>
                    <button onClick={() => setShowIncentiveModal(true)} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm">
                        <FaTrophy className="mr-2" /> Set Special Incentive
                    </button>
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

            {/* Refund Logs Section */}
            {stats.refundLogs && stats.refundLogs.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                        <FaUndo className="mr-2 text-rose-500" /> Wallet Refund History (Processed by Agent)
                    </h3>
                    <div className="space-y-3">
                        {stats.refundLogs.map(log => (
                            <div key={log._id || log.id} className="p-4 bg-rose-50 rounded-xl border border-rose-100 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-rose-800 mb-1">{log.activityDescription}</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <p className="text-xs text-rose-600/70">Processed on: {new Date(log.timestamp).toLocaleString()}</p>
                                        {log.metadata?.reason && (
                                            <p className="text-[10px] font-bold text-rose-700 bg-rose-200/50 px-2 py-0.5 rounded uppercase tracking-tighter">Reason: {log.metadata.reason}</p>
                                        )}
                                    </div>
                                </div>
                                {log.metadata?.amount && (
                                    <div className="text-right">
                                        <p className="font-black text-rose-600">+₹{log.metadata.amount}</p>
                                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-tight">Added to Wallet</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
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
                                        <p className="text-sm font-black text-slate-800">Score: {qa.score}%</p>
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
                                                <a 
                                                    href={getRecordingUrl(recording.url)} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                                                >
                                                    <FaVideo size={12} />
                                                    View Recording
                                                </a>
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
