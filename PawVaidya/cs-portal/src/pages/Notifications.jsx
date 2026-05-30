import React, { useContext, useEffect, useState } from 'react';
import { CSContext } from '../context/CSContext';
import { FaBell, FaCheck, FaEnvelopeOpen, FaEnvelope, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Notifications = () => {
    const { csMessages, getCSMessages, markCSMessageAsRead, unreadCsMessagesCount } = useContext(CSContext);
    const [filter, setFilter] = useState('all'); // 'all' or 'unread'
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMsgs = async () => {
            setLoading(true);
            await getCSMessages();
            setLoading(false);
        };
        fetchMsgs();
    }, []);

    const handleMarkAsRead = async (id) => {
        const success = await markCSMessageAsRead(id);
        if (success) {
            toast.success('Notification marked as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        const unreadList = csMessages.filter(msg => !msg.readByEmployee);
        if (unreadList.length === 0) return;
        
        setLoading(true);
        let successCount = 0;
        for (const msg of unreadList) {
            const ok = await markCSMessageAsRead(msg._id);
            if (ok) successCount++;
        }
        setLoading(false);
        if (successCount > 0) {
            toast.success(`Marked ${successCount} notifications as read`);
        }
    };

    const filteredMessages = csMessages.filter(msg => {
        if (filter === 'unread') return !msg.readByEmployee;
        return true;
    });

    const formatTimestamp = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 py-8">
            <div className="bg-white shadow-xl rounded-3xl px-6 py-6 text-slate-800 border border-slate-100 backdrop-blur-xl bg-white/95">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 mb-5 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                            <FaBell className="w-6 h-6 animate-swing" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-800">Notification Center</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {unreadCsMessagesCount} Unread Broadcasts
                            </p>
                        </div>
                    </div>

                    {unreadCsMessagesCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                            <FaCheck className="text-[10px]" />
                            <span>Mark All Read</span>
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            filter === 'all'
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        All ({csMessages.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            filter === 'unread'
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        Unread ({unreadCsMessagesCount})
                    </button>
                </div>

                {/* Messages List */}
                {loading && filteredMessages.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredMessages.length > 0 ? (
                    <div className="space-y-4">
                        {filteredMessages.map((msg) => {
                            const isUnread = !msg.readByEmployee;
                            const isHighPriority = msg.priority === 'high';

                            return (
                                <div
                                    key={msg._id}
                                    className={`relative p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                                        isUnread
                                            ? 'bg-gradient-to-br from-amber-50/50 to-orange-50/20 border-amber-200/60 shadow-md shadow-amber-500/5'
                                            : 'bg-white border-slate-100 hover:border-slate-200'
                                    }`}
                                >
                                    {/* Left Accent indicator for unread */}
                                    {isUnread && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-l-2xl" />
                                    )}

                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl shrink-0 mt-0.5 ${
                                            isHighPriority 
                                                ? 'bg-rose-50 text-rose-500 border border-rose-100' 
                                                : 'bg-slate-50 text-slate-400 border border-slate-100'
                                        }`}>
                                            {isHighPriority ? <FaExclamationTriangle className="w-5 h-5" /> : <FaInfoCircle className="w-5 h-5" />}
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="font-extrabold text-slate-800 text-sm md:text-base leading-snug">
                                                    {msg.title}
                                                </h4>
                                                
                                                {isHighPriority && (
                                                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[9px] font-black uppercase tracking-wider">
                                                        Urgent
                                                    </span>
                                                )}
                                                
                                                {isUnread && (
                                                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                                )}
                                            </div>
                                            
                                            <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-medium">
                                                {msg.message}
                                            </p>
                                            
                                            <p className="text-[10px] font-bold text-slate-400">
                                                Sent on {formatTimestamp(msg.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {isUnread && (
                                        <button
                                            onClick={() => handleMarkAsRead(msg._id)}
                                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 hover:border-amber-400 text-amber-600 rounded-xl text-xs font-extrabold shadow-sm transition-all hover:bg-amber-50 active:scale-95"
                                        >
                                            <FaEnvelopeOpen className="text-[10px]" />
                                            <span>Mark Read</span>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                            <FaEnvelopeOpen className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-black text-slate-700">No Notifications</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                            You're all caught up!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
