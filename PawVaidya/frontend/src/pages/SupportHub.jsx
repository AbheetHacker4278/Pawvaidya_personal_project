import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LifeBuoy, HelpCircle, MessageSquare, History, Bug,
    Monitor, Zap, AlertCircle, Send, Loader2, Calendar,
    User, ArrowRight, ShieldCheck, ChevronRight
} from 'lucide-react';

const B = {
    dark: '#3d2b1f',
    mid: '#5A4035',
    light: '#7a5a48',
    cream: '#f2e4c7',
    sand: '#e8d5b0',
    amber: '#c8860a',
    pale: '#fdf8f0',
};

const SupportHub = () => {
    const { token, backendurl, userdata } = useContext(AppContext);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Active tab: 'ticket', 'issue', or 'history'
    const activeTab = searchParams.get('tab') || 'ticket';

    const handleTabChange = (tab) => {
        setSearchParams({ tab });
    };

    // Form 1: Support Ticket
    const [ticketTitle, setTicketTitle] = useState('');
    const [ticketCategory, setTicketCategory] = useState('');
    const [ticketDesc, setTicketDesc] = useState('');
    const [submittingTicket, setSubmittingTicket] = useState(false);

    // Form 2: Report Issue
    const [issueSubject, setIssueSubject] = useState('');
    const [issueCategory, setIssueCategory] = useState('Bug');
    const [issueDesc, setIssueDesc] = useState('');
    const [submittingIssue, setSubmittingIssue] = useState(false);

    // History state
    const [tickets, setTickets] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchTickets = async () => {
        if (!token) return;
        setLoadingHistory(true);
        try {
            // Note: backendurl might be formatted differently, using backendurl or backendUrl
            const { data } = await axios.get(`${backendurl}/api/complaint/my-tickets`, {
                headers: { token }
            });
            if (data.success) {
                setTickets(data.tickets || []);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
            toast.error(error.message);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') {
            fetchTickets();
        }
    }, [activeTab, token]);

    const handleTicketSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            toast.error('Please login to create a ticket');
            return;
        }
        setSubmittingTicket(true);
        try {
            const { data } = await axios.post(
                `${backendurl}/api/complaint/create`,
                { title: ticketTitle, category: ticketCategory, description: ticketDesc },
                { headers: { token } }
            );

            if (data.success) {
                toast.success('Ticket created successfully! Our team will contact you shortly.');
                setTicketTitle('');
                setTicketCategory('');
                setTicketDesc('');
                handleTabChange('history');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmittingTicket(false);
        }
    };

    const handleIssueSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            toast.error('Please login to report an issue');
            return;
        }
        setSubmittingIssue(true);
        try {
            const { data } = await axios.post(
                `${backendurl}/api/app-issue/submit`,
                {
                    userId: userdata?.id || userdata?._id,
                    subject: issueSubject,
                    description: issueDesc,
                    category: issueCategory
                },
                { headers: { token } }
            );

            if (data.success) {
                toast.success(data.message || 'Issue reported successfully! Thank you.');
                setIssueSubject('');
                setIssueDesc('');
                setIssueCategory('Bug');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmittingIssue(false);
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            open: 'bg-red-100 text-red-800 border-red-200',
            in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
            scheduled_call: 'bg-purple-100 text-purple-800 border-purple-200',
            resolved: 'bg-green-100 text-green-800 border-green-200',
            closed: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${colors[status] || 'bg-gray-100'}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen" style={{ color: B.dark }}>
            {/* Header */}
            <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3d2b1f] via-[#5A4035] to-[#2c1e14] p-8 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2.5">
                            <span className="p-2 rounded-2xl bg-white/10 border border-white/10">
                                <LifeBuoy className="w-7 h-7 text-amber-300" />
                            </span>
                            Support & Feedback Center
                        </h1>
                        <p className="mt-2 text-sm text-white/70 max-w-xl">
                            Need help with a doctor appointment? Found a bug in the app? Let us know and our dedicated support representatives will resolve it.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Switches */}
            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm mb-6 max-w-md">
                {[
                    { id: 'ticket', label: 'Raise Ticket', icon: HelpCircle },
                    { id: 'issue', label: 'Report Issue', icon: Bug },
                    { id: 'history', label: 'Ticket History', icon: History }
                ].map(t => {
                    const Icon = t.icon;
                    const active = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => handleTabChange(t.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-wider ${active
                                ? 'bg-gradient-to-r from-[#5A4035] to-[#3d2b1f] text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            <Icon size={14} />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Container */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 md:p-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'ticket' && (
                        <motion.div
                            key="ticket"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="mb-6">
                                <h2 className="text-xl font-black">Open a Support Ticket</h2>
                                <p className="text-xs text-slate-400 mt-1">Submit your request regarding doctor feedback, payments, or booking issues.</p>
                            </div>

                            <form onSubmit={handleTicketSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 pl-1">Subject / Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={ticketTitle}
                                            onChange={(e) => setTicketTitle(e.target.value)}
                                            placeholder="e.g. Cancelled booking refund query"
                                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 pl-1">Category</label>
                                        <select
                                            required
                                            value={ticketCategory}
                                            onChange={(e) => setTicketCategory(e.target.value)}
                                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50"
                                        >
                                            <option value="" disabled>Select category...</option>
                                            <option value="doctor_complaint">Doctor Complaint</option>
                                            <option value="malpractice">Malpractice Report</option>
                                            <option value="user_issue">Account / Usage Issue</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 pl-1">Detailed Description</label>
                                    <textarea
                                        required
                                        rows="5"
                                        value={ticketDesc}
                                        onChange={(e) => setTicketDesc(e.target.value)}
                                        placeholder="Please provide full details, including doctor name and appointment dates if applicable..."
                                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50 resize-none"
                                    />
                                </div>

                                <div className="flex justify-end pt-3 border-t">
                                    <button
                                        type="submit"
                                        disabled={submittingTicket}
                                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 text-white font-black rounded-xl text-xs flex items-center gap-2 uppercase tracking-wider shadow-md transition-all disabled:opacity-50"
                                    >
                                        {submittingTicket ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Submit Support Ticket
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {activeTab === 'issue' && (
                        <motion.div
                            key="issue"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="mb-6">
                                <h2 className="text-xl font-black">Report an App Issue / Feedback</h2>
                                <p className="text-xs text-slate-400 mt-1">Submit visual glitches, performance concerns, or generic feature requests.</p>
                            </div>

                            <form onSubmit={handleIssueSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 pl-1">Subject</label>
                                        <input
                                            type="text"
                                            required
                                            value={issueSubject}
                                            onChange={(e) => setIssueSubject(e.target.value)}
                                            placeholder="e.g. Chat screen scroll issue"
                                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 pl-1">Issue Category</label>
                                        <select
                                            required
                                            value={issueCategory}
                                            onChange={(e) => setIssueCategory(e.target.value)}
                                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50"
                                        >
                                            <option value="Bug">Bug / Error</option>
                                            <option value="UI">UI / Visual Issue</option>
                                            <option value="Performance">Performance / Speed</option>
                                            <option value="Feature Request">Feature Request</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 pl-1">Description</label>
                                    <textarea
                                        required
                                        rows="5"
                                        value={issueDesc}
                                        onChange={(e) => setIssueDesc(e.target.value)}
                                        placeholder="Explain the issue clearly and steps to reproduce..."
                                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50 resize-none"
                                    />
                                </div>

                                <div className="flex justify-end pt-3 border-t">
                                    <button
                                        type="submit"
                                        disabled={submittingIssue}
                                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 text-white font-black rounded-xl text-xs flex items-center gap-2 uppercase tracking-wider shadow-md transition-all disabled:opacity-50"
                                    >
                                        {submittingIssue ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Submit Feedback
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="mb-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black">Support Ticket History</h2>
                                    <p className="text-xs text-slate-400 mt-1">Track the resolution progress of your open and closed complaints.</p>
                                </div>
                                <button
                                    onClick={() => handleTabChange('ticket')}
                                    className="text-xs font-black uppercase text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
                                >
                                    Raise new ticket &rarr;
                                </button>
                            </div>

                            {loadingHistory ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm font-semibold gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                                    Loading your tickets...
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-semibold text-xs">
                                    You have not raised any support tickets yet.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                                                <th className="pb-3 px-2">Ticket</th>
                                                <th className="pb-3 px-2">Status</th>
                                                <th className="pb-3 px-2 hidden sm:table-cell">Created Date</th>
                                                <th className="pb-3 px-2 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {tickets.map(ticket => (
                                                <tr key={ticket._id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-2">
                                                        <div className="font-bold text-sm text-slate-800">{ticket.title}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 capitalize mt-1">
                                                            {ticket.category.replace('_', ' ')}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-2">
                                                        {getStatusBadge(ticket.status)}
                                                    </td>
                                                    <td className="py-4 px-2 text-slate-500 text-xs hidden sm:table-cell font-medium">
                                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 px-2 text-right">
                                                        <button
                                                            onClick={() => navigate(`/ticket-tracking/${ticket._id}`)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100/70 border border-amber-200 text-amber-700 font-black rounded-lg text-[10px] uppercase tracking-wider transition-all"
                                                        >
                                                            Track status <ChevronRight size={10} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SupportHub;
