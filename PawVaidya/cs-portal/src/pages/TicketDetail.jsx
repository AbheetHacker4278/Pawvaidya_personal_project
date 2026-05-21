import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CSContext } from '../context/CSContext';

const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cstoken, backendUrl } = useContext(CSContext);

    const [ticket, setTicket] = useState(null);
    const [adminReport, setAdminReport] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [newStatus, setNewStatus] = useState('');
    const [note, setNote] = useState('');
    const [callDate, setCallDate] = useState('');
    const [callTime, setCallTime] = useState('');
    const [callLink, setCallLink] = useState('');
    
    // Ban & Report states
    const [showBanModal, setShowBanModal] = useState(false);
    const [banDuration, setBanDuration] = useState('24h');
    const [banReason, setBanReason] = useState('');
    
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [evidence, setEvidence] = useState('');

    const fetchTicket = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/complaint/ticket/${id}`, {
                headers: { cstoken } // Using cstoken here as CS employee
            });
            if (data.success) {
                setTicket(data.ticket);
                setNewStatus(data.ticket.status);
                
                // Fetch associated misbehavior report if any
                const reportRes = await axios.get(`${backendUrl}/api/misbehavior/ticket/${id}`, {
                    headers: { cstoken }
                });
                if (reportRes.data.success) {
                    setAdminReport(reportRes.data.report);
                }
            } else {
                toast.error(data.message);
                navigate('/queue');
            }
        } catch (error) {
            toast.error(error.message);
            navigate('/queue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicket();
        // Polling for real-time updates could be added here
        const interval = setInterval(fetchTicket, 10000);
        return () => clearInterval(interval);
    }, [id]);

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.put(`${backendUrl}/api/complaint/update-status/${id}`,
                { status: newStatus },
                { headers: { cstoken } }
            );
            if (data.success) {
                toast.success('Status updated');
                fetchTicket();
            } else toast.error(data.message);
        } catch (err) { toast.error(err.message); }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!note) return;
        try {
            const { data } = await axios.post(`${backendUrl}/api/complaint/add-note/${id}`,
                { message: note },
                { headers: { cstoken } }
            );
            if (data.success) {
                toast.success('Note added');
                setNote('');
                fetchTicket();
            } else toast.error(data.message);
        } catch (err) { toast.error(err.message); }
    };

    const handleScheduleCall = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.put(`${backendUrl}/api/complaint/schedule-call/${id}`,
                { date: callDate, time: callTime, link: callLink },
                { headers: { cstoken } }
            );
            if (data.success) {
                toast.success('Call scheduled & user notified');
                setCallDate(''); setCallTime(''); setCallLink('');
                fetchTicket();
            } else toast.error(data.message);
        } catch (err) { toast.error(err.message); }
    };

    const handleCloseTicket = async () => {
        if (!window.confirm("Are you sure you want to close this ticket?")) return;
        try {
            const { data } = await axios.put(`${backendUrl}/api/complaint/close/${id}`, {}, { headers: { cstoken } });
            if (data.success) {
                toast.success('Ticket closed successfully');
                fetchTicket();
            } else toast.error(data.message);
        } catch (err) { toast.error(err.message); }
    };

    const handleBanUser = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${backendUrl}/api/ban/ban`, {
                userId: ticket.userId,
                userType: 'user',
                banDuration,
                banReason
            }, { headers: { cstoken } });
            if (data.success) {
                toast.success('User banned successfully');
                setShowBanModal(false);
                setBanReason('');
            } else toast.error(data.message);
        } catch (err) { toast.error(err.message); }
    };

    const handleReportMisbehavior = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${backendUrl}/api/misbehavior/report`, {
                userId: ticket.userId,
                ticketId: id,
                reason: reportReason,
                evidence
            }, { headers: { cstoken } });
            if (data.success) {
                toast.success('Reported to admin successfully');
                setShowReportModal(false);
                setReportReason('');
                setEvidence('');
            } else toast.error(data.message);
        } catch (err) { toast.error(err.message); }
    };

    if (loading || !ticket) return <div className="p-8 text-center text-slate-500">Loading details...</div>;

    const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white px-6 py-5 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{ticket.title}</h2>
                        <p className="text-sm text-slate-500 mt-1 uppercase tracking-wide">{ticket.category.replace('_', ' ')}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-800 uppercase tracking-wide">
                        {ticket.status.replace('_', ' ')}
                    </span>
                </div>
                <div className="mt-4 p-4 bg-slate-50 rounded-lg text-slate-700 whitespace-pre-wrap">
                    {ticket.description}
                </div>
            </div>

            {/* Admin Instructions/Feedback */}
            {adminReport && (
                <div className={`p-6 rounded-xl border-2 animate-pulse-slow ${
                    adminReport.status === 'resolved' 
                    ? 'bg-rose-50 border-rose-200' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${adminReport.status === 'resolved' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className={`font-black uppercase tracking-widest text-sm ${adminReport.status === 'resolved' ? 'text-rose-700' : 'text-amber-700'}`}>
                            Admin Decision & Instructions
                        </h3>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="bg-white/60 p-4 rounded-lg border border-white">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Instruction for you:</p>
                            <p className="text-slate-800 font-bold leading-relaxed">
                                {adminReport.adminFeedbackToAgent || "No specific instructions provided. Admin has reviewed the case."}
                            </p>
                        </div>
                        
                        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <span>Status: <span className={adminReport.status === 'resolved' ? 'text-rose-600' : 'text-amber-600'}>{adminReport.status}</span></span>
                            <span>Action: {adminReport.adminAction}</span>
                            {adminReport.actionTakenBy && <span>By: {adminReport.actionTakenBy.name}</span>}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Timeline */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Timeline</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {ticket.timeline.map((event, idx) => (
                            <div key={idx} className="flex space-x-3">
                                <div className="flex flex-col items-center">
                                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5"></div>
                                    {idx !== ticket.timeline.length - 1 && <div className="h-full w-px bg-slate-200 my-1"></div>}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-800 capitalize">{event.event.replace('_', ' ')}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{new Date(event.timestamp).toLocaleString()}</p>
                                    {event.message && <p className="text-sm text-slate-600 mt-1">{event.message}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {!isClosed && (
                        <form onSubmit={handleAddNote} className="mt-4 flex space-x-2">
                            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Add a timeline note..."
                                className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-primary focus:border-primary text-sm" />
                            <button type="submit" className="px-4 py-2 bg-slate-800 text-white text-sm rounded hover:bg-slate-900 transition-colors">Post</button>
                        </form>
                    )}
                </div>

                {/* Actions */}
                <div className="space-y-6">
                    {!isClosed && (
                        <>
                            <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Update Status</h3>
                                <form onSubmit={handleUpdateStatus} className="flex space-x-3">
                                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                                        className="flex-1 border-slate-300 rounded focus:ring-primary focus:border-primary text-sm p-2 bg-slate-50 border">
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="scheduled_call">Scheduled Call</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                    <button type="submit" className="px-4 py-2 bg-primary text-white text-sm rounded transition-colors hover:bg-primary/90">Update</button>
                                </form>
                            </div>

                            <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Schedule Call</h3>
                                <form onSubmit={handleScheduleCall} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="date" required value={callDate} onChange={e => setCallDate(e.target.value)}
                                            className="px-3 py-2 border border-slate-300 rounded text-sm w-full" />
                                        <input type="time" required value={callTime} onChange={e => setCallTime(e.target.value)}
                                            className="px-3 py-2 border border-slate-300 rounded text-sm w-full" />
                                    </div>
                                    <input type="url" required placeholder="Meeting Link (e.g., Google Meet URL)" value={callLink} onChange={e => setCallLink(e.target.value)}
                                        className="px-3 py-2 border border-slate-300 rounded text-sm w-full" />
                                    <button type="submit" className="w-full px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors">
                                        Schedule & Send Email to User
                                    </button>
                                </form>
                            </div>
                        </>
                    )}

                    {ticket.scheduledCall && ticket.scheduledCall.date && (
                        <div className="bg-purple-50 p-5 rounded-lg border border-purple-200 text-purple-800">
                            <h3 className="font-bold mb-2">Scheduled Call Info:</h3>
                            <p className="text-sm font-medium">Date: {ticket.scheduledCall.date}</p>
                            <p className="text-sm font-medium mt-1">Time: {ticket.scheduledCall.time}</p>
                            <p className="text-sm mt-1">
                                Link: <a href={ticket.scheduledCall.link} target="_blank" rel="noreferrer" className="underline">{ticket.scheduledCall.link}</a>
                            </p>
                        </div>
                    )}

                    <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex flex-col items-center gap-4">
                        {isClosed ? (
                            <div className="text-green-600 font-bold text-center">
                                <p>🎫 This ticket is resolved/closed.</p>
                                {ticket.rating && (
                                    <div className="mt-2 text-slate-600 font-normal">
                                        <p className="text-sm font-semibold">User Rating: {ticket.rating.rating} / 5 ⭐</p>
                                        {ticket.rating.review && <p className="text-xs italic">"{ticket.rating.review}"</p>}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <button onClick={handleCloseTicket} className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors">
                                    Mark as Resolved & Close Ticket
                                </button>
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <button onClick={() => setShowBanModal(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors">
                                        🚫 Ban User
                                    </button>
                                    <button onClick={() => setShowReportModal(true)} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors">
                                        ⚠️ Report to Admin
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Ban Modal */}
            {showBanModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-900">Ban User Account</h3>
                            <button onClick={() => setShowBanModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleBanUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ban Duration</label>
                                <select value={banDuration} onChange={e => setBanDuration(e.target.value)}
                                    className="w-full border-slate-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm p-2.5 bg-slate-50 border">
                                    <option value="1h">1 Hour</option>
                                    <option value="24h">24 Hours</option>
                                    <option value="7d">7 Days</option>
                                    <option value="30d">30 Days</option>
                                    <option value="permanent">Permanent</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Ban</label>
                                <textarea required value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="e.g., Abusive language with agent"
                                    className="w-full border-slate-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm p-2.5 bg-slate-50 border h-24"></textarea>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowBanModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">Confirm Ban</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-900">Forward to Admin</h3>
                            <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleReportMisbehavior} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Reason</label>
                                <textarea required value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Explain the misbehavior..."
                                    className="w-full border-slate-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm p-2.5 bg-slate-50 border h-24"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Evidence / Notes</label>
                                <textarea value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="Chat snippets or relevant info..."
                                    className="w-full border-slate-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm p-2.5 bg-slate-50 border h-24"></textarea>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200">Forward Complaint</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketDetail;
