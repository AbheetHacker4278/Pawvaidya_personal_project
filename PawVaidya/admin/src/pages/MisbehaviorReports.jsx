import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../context/AdminContext';
import { ShieldAlert, CheckCircle, XCircle, Info, ExternalLink, Mail, Trash2 } from 'lucide-react';

const MisbehaviorReports = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // Action Modal States
    const [selectedReport, setSelectedReport] = useState(null);
    const [action, setAction] = useState('ban'); // 'ban' or 'dismiss'
    const [banDuration, setBanDuration] = useState('24h');
    const [banReason, setBanReason] = useState('');
    const [adminFeedbackToAgent, setAdminFeedbackToAgent] = useState('');

    // User Profile Modal States
    const [userDetails, setUserDetails] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [fetchingUser, setFetchingUser] = useState(false);

    const fetchReports = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/misbehavior/list`, {
                headers: { atoken }
            });
            if (data.success) {
                setReports(data.reports);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (userId) => {
        setFetchingUser(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/admin/user-payment-details/${userId}`, {
                headers: { atoken }
            });
            if (data.success) {
                setUserDetails(data);
                setShowUserModal(true);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setFetchingUser(false);
        }
    };

    const handleSendWarning = async (userId, reportId) => {
        if (!window.confirm('Send official warning email to this user?')) return;

        try {
            const { data } = await axios.post(`${backendurl}/api/misbehavior/send-warning`, {
                userId,
                reportId
            }, { headers: { atoken } });

            if (data.success) {
                toast.success('Warning email sent successfully');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (atoken) fetchReports();
    }, [atoken]);

    const handleResolve = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${backendurl}/api/misbehavior/resolve`, {
                reportId: selectedReport._id,
                action,
                banDuration,
                banReason: banReason || selectedReport.reason,
                adminFeedbackToAgent: adminFeedbackToAgent || 'No specific instructions.'
            }, { headers: { atoken } });

            if (data.success) {
                toast.success('Report resolved successfully');
                setSelectedReport(null);
                setBanReason('');
                setAdminFeedbackToAgent('');
                fetchReports();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading reports...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <ShieldAlert className="text-rose-500" /> Forwarded Misbehavior Complaints
                    </h2>
                    <p className="text-slate-500 text-sm">Reports from CS Agents about abusive or misbehaving users.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                        {reports.filter(r => r.status === 'pending').length} Pending
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {reports.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-2xl border-2 border-dashed border-slate-200">
                        <CheckCircle className="mx-auto text-emerald-400 w-12 h-12 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">All clear!</h3>
                        <p className="text-slate-500">No user misbehavior reports found.</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div key={report._id} className={`bg-white rounded-2xl border ${report.status === 'pending' ? 'border-amber-200 shadow-md' : 'border-slate-200 opacity-80'} overflow-hidden transition-all hover:shadow-lg`}>
                            <div className="flex flex-col md:flex-row">
                                {/* Left Section: User Info */}
                                <div className="p-5 border-r border-slate-100 md:w-64 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                                    <div className="relative">
                                        <img src={report.userId?.image} alt="" className="w-16 h-16 rounded-full border-4 border-white shadow-sm mb-3 object-cover" />
                                        {fetchingUser && <div className="absolute inset-0 bg-white/50 rounded-full flex items-center justify-center"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>}
                                    </div>
                                    <h4 className="font-bold text-slate-900 truncate w-full">{report.userId?.name}</h4>
                                    <p className="text-xs text-slate-500 truncate w-full mb-2">{report.userId?.email}</p>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => fetchUserDetails(report.userId?._id)}
                                            className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded-md transition-colors"
                                            title="View Complete Profile"
                                        >
                                            <ExternalLink size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleSendWarning(report.userId?._id, report._id)}
                                            className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-md transition-colors"
                                            title="Send Appeal Warning Email"
                                        >
                                            <Mail size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Middle Section: Report Details */}
                                <div className="p-5 flex-1 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${report.status === 'pending' ? 'bg-amber-500 text-white animate-pulse' :
                                                report.status === 'resolved' ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'
                                                }`}>
                                                {report.status}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                {new Date(report.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-medium">
                                            Reported by: <span className="font-bold text-slate-700">{report.reportedBy?.name}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Reason for Complaint</h5>
                                        <p className="text-sm text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100 italic">
                                            "{report.reason}"
                                        </p>
                                    </div>

                                    {report.evidence && (
                                        <div>
                                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Evidence / Notes</h5>
                                            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                {report.evidence}
                                            </p>
                                        </div>
                                    )}

                                    {report.status !== 'pending' && (
                                        <div className="pt-2 mt-2 border-t border-slate-100">
                                            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                                <CheckCircle size={14} /> {report.adminAction}
                                            </p>
                                            <p className="text-[10px] text-slate-400">Action taken by: {report.actionTakenBy?.name}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Right Section: Actions */}
                                {report.status === 'pending' && (
                                    <div className="p-5 bg-slate-50/30 flex flex-col justify-center gap-2 md:w-48">
                                        <button
                                            onClick={() => { setSelectedReport(report); setAction('ban'); }}
                                            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-100"
                                        >
                                            <ShieldAlert size={14} /> Ban User
                                        </button>
                                        <button
                                            onClick={() => { setSelectedReport(report); setAction('dismiss'); }}
                                            className="w-full flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                        >
                                            <Trash2 size={14} /> Dismiss
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Resolution Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className={`p-6 ${action === 'ban' ? 'bg-rose-600' : 'bg-slate-800'} text-white`}>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                {action === 'ban' ? <ShieldAlert /> : <Info />}
                                {action === 'ban' ? 'Suspend User Account' : 'Dismiss Report'}
                            </h3>
                            <p className="text-white/80 text-xs mt-1">Reviewing report for {selectedReport.userId?.name}</p>
                        </div>

                        <form onSubmit={handleResolve} className="p-6 space-y-4">
                            {action === 'ban' ? (
                                <>
                                    <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 mb-4">
                                        <p className="text-[10px] text-rose-700 font-bold uppercase tracking-widest mb-1">Agent's Complaint</p>
                                        <p className="text-xs text-rose-900 italic">"{selectedReport.reason}"</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ban Duration</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['1h', '24h', '7d', '30d', 'permanent'].map(dur => (
                                                <button
                                                    key={dur}
                                                    type="button"
                                                    onClick={() => setBanDuration(dur)}
                                                    className={`px-2 py-2 rounded-xl text-xs font-bold border transition-all ${banDuration === dur
                                                        ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-200'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300'
                                                        }`}
                                                >
                                                    {dur === 'permanent' ? 'Perm' : dur}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ban Reason (Sent to User)</label>
                                        <textarea
                                            required
                                            value={banReason}
                                            onChange={e => setBanReason(e.target.value)}
                                            placeholder="Explain why the account is being suspended..."
                                            className="w-full border-slate-200 rounded-2xl focus:ring-rose-500 focus:border-rose-500 text-sm p-4 bg-slate-50 min-h-[100px]"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                            <Info size={12} /> This message will be automatically emailed to the user.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Message to CS Agent</label>
                                        <select
                                            value={adminFeedbackToAgent}
                                            onChange={(e) => setAdminFeedbackToAgent(e.target.value)}
                                            className="w-full border-slate-200 rounded-xl text-sm mb-3 bg-slate-50"
                                        >
                                            <option value="">Select pre-written instruction...</option>
                                            <option value="The user has been banned. You can now close the ticket and inform the user if they contact again.">Ban & Close Ticket</option>
                                            <option value="Official warning sent. Keep this ticket open for 24h to monitor user behavior, then close.">Warning & Monitor</option>
                                            <option value="Report dismissed. Please resume normal support for this user but stay alert.">Dismiss & Resume</option>
                                            <option value="Issue escalated to technical team. Do not close ticket yet.">Escalate</option>
                                        </select>
                                        <textarea
                                            value={adminFeedbackToAgent}
                                            onChange={(e) => setAdminFeedbackToAgent(e.target.value)}
                                            placeholder="Or write custom instructions for the agent..."
                                            className="w-full border-slate-200 rounded-2xl focus:ring-primary focus:border-primary text-xs p-3 bg-slate-50 min-h-[60px]"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="py-4 text-center">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
                                            <Trash2 size={32} />
                                        </div>
                                        <p className="text-slate-600 text-sm">Are you sure you want to dismiss this report? No action will be taken against the user.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Instruction for Agent</label>
                                        <textarea
                                            value={adminFeedbackToAgent}
                                            onChange={(e) => setAdminFeedbackToAgent(e.target.value)}
                                            placeholder="Tell the agent why this was dismissed..."
                                            className="w-full border-slate-200 rounded-2xl focus:ring-primary focus:border-primary text-xs p-3 bg-slate-50 min-h-[60px]"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedReport(null)}
                                    className="flex-1 px-6 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all shadow-lg ${action === 'ban'
                                        ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                                        : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'
                                        }`}
                                >
                                    {action === 'ban' ? 'Confirm Suspension' : 'Dismiss Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* User Profile Modal */}
            {showUserModal && userDetails && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                    <div className="bg-white rounded-[2rem] max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-8 bg-gradient-to-r from-emerald-500 to-green-600 text-white relative">
                            <button onClick={() => setShowUserModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors text-white">✕</button>
                            <div className="flex items-center gap-6">
                                <img src={userDetails.user.image} alt="" className="w-24 h-24 rounded-3xl border-4 border-white/30 shadow-xl object-cover" />
                                <div>
                                    <h3 className="text-3xl font-black">{userDetails.user.name}</h3>
                                    <p className="text-white/80 font-medium">{userDetails.user.email}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${userDetails.user.isAccountverified ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'}`}>
                                            {userDetails.user.isAccountverified ? '✓ Verified User' : 'Unverified Account'}
                                        </span>
                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
                                            Last Login: {userDetails.user.lastLogin ? new Date(userDetails.user.lastLogin).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
                            {/* Key Stats Row */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Wallet Balance</p>
                                    <p className="text-2xl font-black text-emerald-600">₹{userDetails.user.pawWallet}</p>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">PawPoints</p>
                                    <p className="text-2xl font-black text-blue-600">{userDetails.user.pawpoints} ⭐</p>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Active Plan</p>
                                    <p className={`text-xl font-black ${userDetails.user.subscription?.plan === 'Platinum' ? 'text-purple-600' :
                                        userDetails.user.subscription?.plan === 'Gold' ? 'text-amber-500' :
                                            userDetails.user.subscription?.plan === 'Silver' ? 'text-slate-400' : 'text-slate-500'
                                        }`}>
                                        {userDetails.user.subscription?.plan || 'None'}
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Info */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Profile Details</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-500">Gender</span>
                                            <span className="text-xs font-bold text-slate-700">{userDetails.user.gender}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-500">Date of Birth</span>
                                            <span className="text-xs font-bold text-slate-700">{userDetails.user.dob}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-500">Phone</span>
                                            <span className="text-xs font-bold text-slate-700">{userDetails.user.phone}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-500">Address</span>
                                            <span className="text-xs font-bold text-slate-700 truncate ml-4">{userDetails.user.full_address}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Pet Info</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-500">Pet Type</span>
                                            <span className="text-xs font-bold text-slate-700">{userDetails.user.pet_type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-500">Breed</span>
                                            <span className="text-xs font-bold text-slate-700">{userDetails.user.breed}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-500">Pet Age</span>
                                            <span className="text-xs font-bold text-slate-700">{userDetails.user.pet_age} Yrs</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-slate-100">
                                            <span className="text-xs text-slate-500 font-bold">Total Registered Pets</span>
                                            <span className="text-xs font-black text-emerald-600">{userDetails.stats.petCount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Stats */}
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Platform Engagement</h4>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                                    <div className="text-center">
                                        <p className="text-lg font-black text-slate-800">{userDetails.stats.completedCount}</p>
                                        <p className="text-[10px] text-slate-500">Appts</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-emerald-600">₹{userDetails.stats.totalAmount}</p>
                                        <p className="text-[10px] text-slate-500">Spent</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-blue-600">{userDetails.stats.emergencyCount}</p>
                                        <p className="text-[10px] text-slate-500">Emergencies</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-rose-500">{userDetails.stats.cancelledCount}</p>
                                        <p className="text-[10px] text-slate-500">Cancellations</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-amber-500">₹{userDetails.stats.totalDiscountSaved}</p>
                                        <p className="text-[10px] text-slate-500">Saved</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-indigo-600">{userDetails.stats.petCount}</p>
                                        <p className="text-[10px] text-slate-500">Pets</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MisbehaviorReports;
