import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { extractLinks, getLinkSource, getSourceColor } from '../utils/linkUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Bell, Calendar, Clock, Paperclip, CheckCheck, Play } from 'lucide-react';

// ─── Brand palette ────────────────────────────────────────────────────────────
const B = {
    dark: '#3d2b1f',
    mid: '#5A4035',
    light: '#7a5a48',
    cream: '#f2e4c7',
    sand: '#e8d5b0',
    amber: '#c8860a',
    pale: '#fdf8f0',
};

// Priority config — keep red/orange for urgency (semantic), but style cards in brand palette
const PRIORITY_CONFIG = {
    urgent: { icon: '🚨', label: 'URGENT', border: '#c0392b', bg: '#fff5f5', badge: { bg: '#c0392b', color: '#fff' } },
    high: { icon: '⚠️', label: 'HIGH', border: '#e67e22', bg: '#fffbf0', badge: { bg: '#e67e22', color: '#fff' } },
    normal: { icon: '📋', label: 'NORMAL', border: B.amber, bg: B.pale, badge: { bg: B.amber, color: '#fff' } },
    low: { icon: '📌', label: 'LOW', border: B.sand, bg: 'rgba(237, 228, 216, 0.6)', badge: { bg: B.light, color: '#fff' } },
};

const getPriorityCfg = (p) => PRIORITY_CONFIG[p] || PRIORITY_CONFIG.low;

const UserMessages = () => {
    const { token, backendurl, getUnreadMessagesCount, systemConfig, userdata } = useContext(AppContext);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    const isObsidian = userdata?.subscription?.plan === 'Obsidian';

    const fetchMessages = async (isBackgroundRefresh = false) => {
        if (systemConfig?.maintenanceMode || systemConfig?.killSwitch) return;
        try {
            if (isBackgroundRefresh) setRefreshing(true);
            const { data } = await axios.get(`${backendurl}/api/user/messages`, { headers: { token } });
            if (data.success) {
                const hasNewMessages = data.messages.length > messages.length;
                setMessages(data.messages);
                setLastUpdated(new Date());
                if (isBackgroundRefresh && hasNewMessages && messages.length > 0) {
                    toast.info(`📬 ${data.messages.length - messages.length} new message(s) received!`, { autoClose: 3000 });
                }
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAsRead = async (messageId, isAlreadyRead) => {
        if (isAlreadyRead) return;
        try {
            await axios.post(`${backendurl}/api/user/messages/read`, { messageId }, { headers: { token } });
            setMessages(prev => prev.map(msg =>
                msg._id === messageId
                    ? { ...msg, readBy: [...msg.readBy, { userId: 'current', readAt: new Date() }] }
                    : msg
            ));
            if (getUnreadMessagesCount) getUnreadMessagesCount();
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchMessages(false);
            const interval = setInterval(() => fetchMessages(true), 5000);
            return () => clearInterval(interval);
        }
    }, [token]);

    // ── Loading state ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-screen gap-4 transition-all duration-300 ${isObsidian ? 'bg-[#050505]' : ''}`} style={isObsidian ? {} : { background: B.cream }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 rounded-full border-4 border-t-transparent"
                    style={isObsidian ? {
                        borderColor: 'rgba(230,201,122,0.1) rgba(230,201,122,0.1) rgba(230,201,122,0.1) #E6C97A'
                    } : {
                        borderColor: `${B.sand} ${B.sand} ${B.sand} ${B.mid}`
                    }}
                />
                <p className="text-sm font-medium" style={{ color: isObsidian ? '#E6C97A' : B.light }}>Loading notifications…</p>
            </div>
        );
    }

    const unreadCount = messages.filter(m => !m.readBy?.length).length;

    return (
        <div className={`min-h-screen pb-12 transition-all duration-300 ${isObsidian ? 'bg-[#050505]' : ''}`} style={isObsidian ? {} : { background: B.cream }}>

            {/* ── Hero Header ─────────────────────────────────────────────────────── */}
            {isObsidian ? (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden py-10 px-6 sm:px-8 rounded-[2rem] border border-[#E6C97A]/25 bg-gradient-to-b from-[#121212] to-[#0A0A0A] shadow-[0_0_30px_rgba(230,201,122,0.05)] mx-4 md:mx-6 mt-6 mb-8"
                >
                    {/* Border light flare overlays */}
                    <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#E6C97A]/60 to-transparent"></div>
                    <div className="absolute bottom-1/4 right-0 w-[1px] h-1/2 bg-gradient-to-b from-transparent via-[#E6C97A]/40 to-transparent"></div>

                    <div 
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, #E6C97A 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
                    />

                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 max-w-5xl mx-auto">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-3 border border-[#E6C97A]/35 bg-[#121212] text-[#E6C97A]">
                                <Bell className="w-3.5 h-3.5 text-[#E6C97A]" /> NOTIFICATIONS
                            </div>
                            
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">Your Inbox</h1>
                            
                            <div className="flex items-center gap-3 flex-wrap">
                                <p className="text-sm text-neutral-400 font-medium">
                                    Stay updated with messages from administration
                                </p>
                                {lastUpdated && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border border-[#E6C97A]/20 bg-[#0D0D0D] text-[#E6C97A]">
                                        <Clock className="w-3.5 h-3.5 text-[#E6C97A]" /> Updated {lastUpdated.toLocaleTimeString()}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Unread badge */}
                            {unreadCount > 0 && (
                                <div className="px-3.5 py-1.5 rounded-full text-xs font-extrabold text-[#E6C97A] border border-[#E6C97A]/30 bg-amber-500/10 shadow-[0_0_10px_rgba(230,201,122,0.1)]">
                                    {unreadCount} unread
                                </div>
                            )}

                            {/* Refresh button */}
                            <motion.button
                                whileHover={{ scale: 1.04, boxShadow: `0 0 15px rgba(230,201,122,0.15)` }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => fetchMessages(true)}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 border border-[#E6C97A]/30 bg-gradient-to-r from-amber-700 to-[#c8860a]"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                <span>Refresh</span>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="relative overflow-hidden py-12 px-4 sm:px-[10%]"
                    style={{ background: `linear-gradient(135deg, ${B.dark} 0%, ${B.mid} 60%, ${B.light} 100%)` }}>
                    {/* Dot grid */}
                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                    {/* Blobs */}
                    <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: B.amber }} />
                    <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#fff' }} />

                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-4xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border border-white/20"
                                style={{ background: 'rgba(255,255,255,0.10)', color: '#f0d080' }}>
                                <Bell className="w-3.5 h-3.5" /> Notifications
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Your Inbox</h1>
                            <div className="flex items-center gap-3 flex-wrap">
                                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                    Stay updated with messages from administration
                                </p>
                                {lastUpdated && (
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)' }}>
                                        Updated {lastUpdated.toLocaleTimeString()}
                                    </span>
                                )}
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                            className="flex items-center gap-3">
                            {/* Unread badge */}
                            {unreadCount > 0 && (
                                <div className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                                    style={{ background: 'rgba(200,134,10,0.85)', border: '1px solid rgba(255,255,255,0.20)' }}>
                                    {unreadCount} unread
                                </div>
                            )}
                            {/* Refresh spinner indicator */}
                            {refreshing && (
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                    <RefreshCw className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                                </motion.div>
                            )}
                            {/* Refresh button */}
                            <motion.button
                                whileHover={{ scale: 1.06, boxShadow: `0 6px 20px rgba(200,134,10,0.35)` }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => fetchMessages(true)}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                                style={{ background: `linear-gradient(135deg, ${B.amber}, #e8a020)` }}
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            )}

            {/* ── Content ─────────────────────────────────────────────────────────── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-[10%] py-8">

                {messages.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`text-center py-20 rounded-3xl border backdrop-blur-md ${
                            isObsidian ? 'bg-[#0A0A0A] border-[#E6C97A]/15' : ''
                        }`}
                        style={isObsidian ? {
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                        } : { 
                            background: 'rgba(237, 228, 216, 0.85)', 
                            borderColor: B.sand 
                        }}
                    >
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-lg font-bold mb-1" style={{ color: isObsidian ? '#ffffff' : B.dark }}>No notifications yet</p>
                        <p className="text-sm" style={{ color: isObsidian ? '#a3a3a3' : B.light }}>Check back later for updates from admin</p>
                    </motion.div>

                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {messages.map((msg, index) => {
                                const isRead = msg.readBy && msg.readBy.length > 0;
                                const cfg = getPriorityCfg(msg.priority);
                                const links = extractLinks(msg.message);

                                return (
                                    <motion.div
                                        key={msg._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.35, delay: index * 0.06 }}
                                        whileHover={{ y: -3, boxShadow: isObsidian ? `0 12px 32px rgba(230,201,122,0.04)` : `0 12px 32px rgba(61,43,31,0.12)` }}
                                        onClick={() => markAsRead(msg._id, isRead)}
                                        className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 backdrop-blur-md border ${
                                            isObsidian 
                                                ? isRead ? 'bg-[#0A0A0A] border-[#E6C97A]/15 hover:border-[#E6C97A]/40' : 'bg-[#0D0D0D] border-[#E6C97A]/30 hover:border-[#E6C97A]/50'
                                                : ''
                                        }`}
                                        style={isObsidian ? {
                                            borderLeft: `4px solid ${cfg.border}`,
                                            borderLeftWidth: '4px',
                                            borderLeftColor: cfg.border,
                                        } : {
                                            background: isRead ? 'rgba(237, 228, 216, 0.85)' : cfg.bg,
                                            borderLeft: `4px solid ${cfg.border}`,
                                            borderColor: B.sand,
                                            borderLeftWidth: '4px',
                                            borderLeftColor: cfg.border,
                                            boxShadow: isRead
                                                ? '0 2px 12px rgba(90,64,53,0.06)'
                                                : `0 4px 20px rgba(90,64,53,0.10)`,
                                        }}
                                    >
                                        {/* Unread glow pulse */}
                                        {!isRead && (
                                            <motion.div
                                                className="absolute top-4 right-4 z-10"
                                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            >
                                                <span className="relative flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                                        style={{ background: cfg.border }} />
                                                    <span className="relative inline-flex rounded-full h-3 w-3"
                                                        style={{ background: cfg.border }} />
                                                </span>
                                            </motion.div>
                                        )}

                                        {/* Read checkmark */}
                                        {isRead && (
                                            <div className="absolute top-4 right-4">
                                                <CheckCheck className="w-4 h-4" style={{ color: isObsidian ? '#E6C97A' : B.sand }} />
                                            </div>
                                        )}

                                        <div className="p-5">
                                            {/* ── Header row ──────────────────────────────────── */}
                                            <div className="flex items-start gap-3 mb-3 pr-8">
                                                <span className="text-2xl flex-shrink-0">{cfg.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-lg font-bold" style={{ color: isObsidian ? '#ffffff' : B.dark }}>{msg.title}</h3>
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
                                                            style={{ background: cfg.badge.bg, color: cfg.badge.color }}>
                                                            {cfg.label}
                                                        </span>
                                                        {!isRead && (
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                                isObsidian ? 'border-[#E6C97A]/30 bg-amber-500/10 text-[#E6C97A]' : 'bg-[#f5ede8] text-mid border-sand'
                                                            }`}>
                                                                NEW
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── Message body ─────────────────────────────────── */}
                                            <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap break-words" style={{ color: isObsidian ? '#d4d4d4' : '#4a3728' }}>
                                                {msg.message}
                                                {links.length > 0 && (
                                                    <span className="block mt-2 flex flex-wrap gap-2">
                                                        {links.map((link, idx) => {
                                                            const source = getLinkSource(link);
                                                            const colorClass = getSourceColor(source);
                                                            return (
                                                                <a key={idx} href={link} target="_blank" rel="noopener noreferrer"
                                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${colorClass} hover:opacity-80 transition-opacity no-underline`}
                                                                    onClick={(e) => e.stopPropagation()}>
                                                                    🔗 {source}
                                                                </a>
                                                            );
                                                        })}
                                                    </span>
                                                )}
                                            </p>

                                            {/* ── Attachments ──────────────────────────────────── */}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mb-4">
                                                    <p className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: isObsidian ? '#E6C97A' : B.light }}>
                                                        <Paperclip className="w-3.5 h-3.5" /> Attachments
                                                    </p>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        {msg.attachments.map((attachment, idx) => (
                                                            <motion.div key={idx} whileHover={{ scale: 1.03 }} className="relative group">
                                                                {attachment.type === 'image' ? (
                                                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                                                        <img src={attachment.url} alt={attachment.filename}
                                                                            className="w-full h-20 object-cover rounded-xl transition"
                                                                            style={{ border: isObsidian ? '1px solid rgba(230,201,122,0.2)' : `1px solid ${B.sand}` }} />
                                                                    </a>
                                                                ) : (
                                                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                                                        <div className="w-full h-20 rounded-xl flex items-center justify-center transition"
                                                                            style={{ background: isObsidian ? '#121212' : '#f5ede8', border: isObsidian ? '1px solid rgba(230,201,122,0.2)' : `1px solid ${B.sand}` }}>
                                                                            <Play className="w-6 h-6" style={{ color: isObsidian ? '#E6C97A' : B.mid }} />
                                                                        </div>
                                                                    </a>
                                                                )}
                                                                <p className="text-[10px] mt-1 truncate" style={{ color: isObsidian ? '#a3a3a3' : B.light }} title={attachment.filename}>
                                                                    {attachment.filename}
                                                                </p>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* ── Footer meta ──────────────────────────────────── */}
                                            <div className="flex flex-wrap items-center gap-4 pt-3 border-t text-xs" style={{ borderColor: isObsidian ? 'rgba(230,201,122,0.15)' : B.sand, color: isObsidian ? '#a3a3a3' : B.light }}>
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" style={{ color: isObsidian ? '#E6C97A' : B.amber }} />
                                                    {new Date(msg.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </span>
                                                {msg.expiresAt && (
                                                    <span className="flex items-center gap-1.5" style={{ color: '#e67e22' }}>
                                                        <Clock className="w-3.5 h-3.5" />
                                                        Expires {new Date(msg.expiresAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {isRead ? (
                                                    <span className="ml-auto flex items-center gap-1" style={{ color: isObsidian ? '#E6C97A' : B.sand }}>
                                                        <CheckCheck className="w-3.5 h-3.5" /> Read
                                                    </span>
                                                ) : (
                                                    <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#E6C97A]/20 bg-[#0D0D0D] text-[#E6C97A] hover:bg-[#E6C97A]/5 transition-colors">
                                                        Click to mark as read
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserMessages;
