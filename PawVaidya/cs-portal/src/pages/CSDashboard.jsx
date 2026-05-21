import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CSContext } from '../context/CSContext';
import { FaTicketAlt, FaStar, FaCheckCircle, FaUserClock, FaTrophy, FaMedal, FaRocket, FaClock, FaChartLine } from 'react-icons/fa';

const CSDashboard = () => {
    const { cstoken, backendUrl, employee, isBreakActive, performanceData, leaderboard, fetchPerformance, fetchLeaderboard } = useContext(CSContext);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/complaint/employee/queue`, {
                headers: { cstoken }
            });
            if (data.success) {
                setQueue(data.tickets);
            }
        } catch (error) {
            console.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (cstoken) {
            fetchQueue();
            fetchPerformance();
            fetchLeaderboard();
        }
    }, [cstoken]);

    if (loading) return <div className="text-center p-12">Loading dashboard...</div>;

    if (isBreakActive) {
        return (
            <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-16 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-20"></div>
                    <div className="relative w-32 h-32 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border-4 border-white shadow-xl">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-slate-800">You're on Break!</h2>
                    <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
                        Your dashboard stats and ticket queue are hidden to help you disconnect. Enjoy your rest, {employee?.name}!
                    </p>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                    <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-400 uppercase tracking-widest">
                        System Monitoring Active
                    </div>
                </div>
            </div>
        );
    }

    const openCount = queue.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const resolvedCount = queue.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const scheduledCount = queue.filter(t => t.status === 'scheduled_call').length;

    return (
        <div className="space-y-8 pb-10">
            {/* Header section with gradient text */}
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-amber-500 drop-shadow-sm">
                    Welcome back, {employee?.name} ✨
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Here's your performance overview for today.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Active Tickets', count: openCount, icon: <FaTicketAlt size={22} />, color: 'emerald', delay: '0' },
                    { label: 'Level / XP', count: `Lvl ${performanceData?.level || 1} (${performanceData?.xpPoints || 0} XP)`, icon: <FaRocket size={22} />, color: 'indigo', delay: '100' },
                    { label: 'Avg Handle Time', count: performanceData?.avgHandleTime ? `${Math.round(performanceData.avgHandleTime / 60)}m` : '0m', icon: <FaClock size={22} />, color: 'blue', delay: '200' },
                    { label: 'Global Rank', count: `#${performanceData?.position || '-'}`, icon: <FaTrophy size={22} />, color: 'amber', delay: '300' }
                ].map((stat, idx) => (
                    <div 
                        key={idx} 
                        className={`group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4`}
                        style={{ animationDelay: `${stat.delay}ms`, animationFillMode: 'both' }}
                    >
                        <div className="relative flex items-center space-x-5">
                            <div className={`p-3.5 bg-${stat.color}-50 text-${stat.color}-500 rounded-xl shadow-sm group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                                <h3 className={`text-2xl font-black text-slate-800`}>{stat.count}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gamification Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-8">
                            <div className="space-y-4 text-center sm:text-left">
                                <div className="flex items-center gap-3 justify-center sm:justify-start">
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-widest">{performanceData?.rank || 'Bronze'} Rank</span>
                                    <span className="text-indigo-200 font-bold tracking-tighter">Level {performanceData?.level || 1}</span>
                                </div>
                                <h2 className="text-4xl font-black tracking-tighter">Road to Master Rank</h2>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold opacity-80">
                                        <span>{performanceData?.xpPoints || 0} XP</span>
                                        <span>{((Math.floor((performanceData?.xpPoints || 0) / 1000) + 1) * 1000)} XP</span>
                                    </div>
                                    <div className="w-full sm:w-80 h-3 bg-black/20 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                                            style={{ width: `${((performanceData?.xpPoints || 0) % 1000) / 10}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div className="shrink-0 p-6 bg-white/10 rounded-[3rem] backdrop-blur-md border border-white/20">
                                <FaTrophy className="text-6xl text-amber-400 drop-shadow-lg animate-bounce" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         {/* Performance Metrics */}
                         <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><FaChartLine /></div>
                               <h3 className="font-black text-slate-800 tracking-tight">Performance KPI</h3>
                            </div>
                            <div className="space-y-4">
                               <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-slate-500">Avg Handle Time</span>
                                  <span className="text-sm font-black text-slate-800">{performanceData?.avgHandleTime ? `${Math.round(performanceData.avgHandleTime / 60)}m ${performanceData.avgHandleTime % 60}s` : '0s'}</span>
                               </div>
                               <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-slate-500">Tickets Resolved</span>
                                  <span className="text-sm font-black text-slate-800">{performanceData?.totalTicketsResolved || 0}</span>
                               </div>
                               <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-slate-500">Quality Assurance</span>
                                  <span className="text-sm font-black text-emerald-600">{performanceData?.recentQA?.[0]?.score || 0}%</span>
                               </div>
                            </div>
                         </div>

                         {/* Quick Actions / Tips */}
                         <div className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
                            <div>
                               <h3 className="font-black text-emerald-800 tracking-tight mb-2">Boost Your XP 🚀</h3>
                               <p className="text-xs text-emerald-600/80 leading-relaxed font-medium">Resolving urgent tickets grants <span className="font-black">+100 XP</span>. Keep up the great work!</p>
                            </div>
                            <div className="pt-4 space-y-2">
                               <div className="text-[10px] font-black uppercase text-emerald-500/50">Next Reward</div>
                               <div className="flex items-center gap-2">
                                  <FaMedal className="text-amber-500" />
                                  <span className="text-xs font-bold text-emerald-800">Silver Rank Badge (Lvl 5)</span>
                               </div>
                            </div>
                         </div>
                    </div>
                </div>

                {/* Leaderboard Widget */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="font-black text-slate-800 flex items-center gap-2">
                            <FaTrophy className="text-amber-500" /> Top Performers
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {leaderboard.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {leaderboard.map((agent, i) => (
                                    <div key={agent._id} className={`flex items-center gap-4 p-4 transition-colors ${agent._id === employee?._id ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
                                        <div className="w-6 text-xs font-black text-slate-400">#{i + 1}</div>
                                        <div className="relative shrink-0">
                                            <img src={agent.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}`} className="w-10 h-10 rounded-2xl object-cover" alt="" />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] font-black shadow-sm text-indigo-600 ring-1 ring-indigo-100">
                                                {agent.level}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-800 truncate">{agent.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{agent.rank} · {agent.xpPoints} XP</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400 text-sm italic">No data available</div>
                        )}
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">Global Rankings</p>
                    </div>
                </div>
            </div>

            {/* Detailed Earnings */}
            <div className="relative bg-white p-8 rounded-3xl shadow-sm border border-emerald-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500" style={{ animationFillMode: 'both' }}>
                {/* Decorative background aura */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl mix-blend-multiply"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl mix-blend-multiply"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center">
                        <div className="w-1.5 h-10 bg-gradient-to-b from-emerald-400 to-amber-400 rounded-full mr-4 shadow-sm"></div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Detailed Earnings</h2>
                            <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Current Cycle Projections</p>
                        </div>
                    </div>
                    <div className="text-left md:text-right bg-emerald-50/80 px-6 py-3 rounded-2xl border border-emerald-100/50 shadow-sm backdrop-blur-sm">
                        <p className="text-xs text-emerald-600/80 uppercase font-bold tracking-widest mb-1">Total Projected</p>
                        <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-teal-500">
                            ₹{(15000 + (employee?.fiveStarCount || 0) * 800 + (
                                (employee?.adminIncentive?.amount && employee?.adminIncentive?.expiresAt && new Date(employee.adminIncentive.expiresAt) > new Date())
                                    ? employee.adminIncentive.amount : 0
                            )).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="group p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Fixed Salary</p>
                            <span className="p-1.5 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </span>
                        </div>
                        <p className="text-2xl font-extrabold text-slate-700">₹15,000</p>
                        <p className="text-[11px] text-slate-400 mt-2 font-medium">Monthly base compensation</p>
                    </div>

                    <div className="group p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-amber-500 transition-colors">Rating Bonus (5★)</p>
                            <span className="p-1.5 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                                <FaStar className="w-4 h-4" />
                            </span>
                        </div>
                        <p className="text-2xl font-extrabold text-slate-700">₹{((employee?.fiveStarCount || 0) * 800).toLocaleString()}</p>
                        <p className="text-[11px] text-slate-400 mt-2 font-medium">{employee?.fiveStarCount || 0} tickets × ₹800</p>
                    </div>

                    <div className="group p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-purple-500 transition-colors">Admin Incentive</p>
                            <span className="p-1.5 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-purple-50 group-hover:text-purple-500 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </span>
                        </div>
                        <p className="text-2xl font-extrabold text-purple-600">
                            ₹{(employee?.adminIncentive?.amount && employee?.adminIncentive?.expiresAt && new Date(employee.adminIncentive.expiresAt) > new Date())
                                ? employee.adminIncentive.amount.toLocaleString() : '0'}
                        </p>
                        {employee?.adminIncentive?.expiresAt && new Date(employee.adminIncentive.expiresAt) > new Date() ? (
                            <p className="text-[11px] text-purple-500/80 mt-2 font-medium">
                                Active until {new Date(employee.adminIncentive.expiresAt).toLocaleDateString()}
                            </p>
                        ) : (
                            <p className="text-[11px] text-slate-400 mt-2 font-medium">No active special incentive</p>
                        )}
                        {employee?.adminIncentive?.amount > 0 && new Date(employee.adminIncentive.expiresAt) <= new Date() && (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-6 py-1 transform rotate-45 translate-x-4 translate-y-2 shadow-sm tracking-wider">EXPIRED</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Warning if profile not fully compliant (extra info) */}
            {!employee?.profileComplete && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center shadow-sm animate-in fade-in slide-in-from-bottom-4 delay-700" style={{ animationFillMode: 'both' }}>
                    <div className="p-2 bg-red-100 rounded-full mr-3 shrink-0"><svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>
                    <p className="text-sm font-medium">
                        <span className="font-bold mr-1">Action Required:</span>
                        Please complete your full profile details before the deadline to avoid account suspension.
                    </p>
                </div>
            )}

        </div>
    );
};

export default CSDashboard;
