import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';
import { useNavigate } from 'react-router-dom';

const CSEmployees = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEarlyExitsModal, setShowEarlyExitsModal] = useState(false);
    const [earlyExits, setEarlyExits] = useState([]);
    const [loadingExits, setLoadingExits] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();

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

    useEffect(() => {
        fetchEmployees();
    }, [atoken]);

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
                        onClick={() => {
                            setShowEarlyExitsModal(true);
                            fetchEarlyExits();
                        }}
                        className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2 rounded-lg transition-all shadow-sm flex items-center gap-2 text-sm font-bold active:scale-95"
                    >
                        <span>⏱</span> Early Exits Log
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

            {/* Quick Leaderboard Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {employees.length > 0 && [...employees].sort((a,b) => (b.xpPoints||0) - (a.xpPoints||0)).slice(0, 3).map((agent, i) => (
                    <div key={agent._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-2 text-[10px] font-black uppercase tracking-widest text-white rounded-bl-xl shadow-sm
                            ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : 'bg-orange-500'}`}>
                            #{i+1}
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
                                                            {new Date(log.shiftStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(log.shiftEnd).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
        </div>
    );
};

export default CSEmployees;
