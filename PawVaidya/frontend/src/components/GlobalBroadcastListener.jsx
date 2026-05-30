import React, { useEffect, useState, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { useLocation } from 'react-router-dom';

// Helper function to throttle socket emissions
const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

const GlobalBroadcastListener = () => {
    const { backendurl, getSystemConfig, userdata } = useContext(AppContext);
    const location = useLocation();

    // Co-Browsing States
    const [coBrowseReq, setCoBrowseReq] = useState(null);
    const [isCoSharing, setIsCoSharing] = useState(false);
    const [activeTicket, setActiveTicket] = useState(null);
    const socketRef = useRef(null);

    // Helper: Collect styles to re-apply in the agent's iframe sandbox
    const getStylesheets = () => {
        const styles = [];
        document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
            if (el.tagName === 'STYLE') {
                styles.push({ type: 'text', content: el.innerHTML });
            } else if (el.tagName === 'LINK') {
                styles.push({ type: 'link', href: el.href });
            }
        });
        return styles;
    };

    // Helper: Clone, Sanitize, and Serialize the DOM
    const serializeDOM = () => {
        const root = document.getElementById('root');
        if (!root) return '';

        const clone = root.cloneNode(true);

        // Strip scripts to prevent code execution in sandbox
        clone.querySelectorAll('script').forEach(el => el.remove());

        // Redact sensitive inputs (passwords, card credentials, personal data keys)
        clone.querySelectorAll('input, textarea, select').forEach(el => {
            const isSensitive = el.type === 'password' || 
                                el.name?.toLowerCase().includes('card') || 
                                el.name?.toLowerCase().includes('cvv') ||
                                el.name?.toLowerCase().includes('pass') ||
                                el.placeholder?.toLowerCase().includes('password') ||
                                el.classList.contains('private') ||
                                el.getAttribute('data-private') !== null;
            
            if (isSensitive) {
                el.setAttribute('value', '••••••••');
                el.value = '••••••••';
            } else {
                if (el.tagName === 'TEXTAREA') {
                    el.textContent = el.value;
                } else if (el.tagName === 'SELECT') {
                    const selectedOpt = el.querySelector(`option[value="${el.value}"]`);
                    if (selectedOpt) selectedOpt.setAttribute('selected', 'selected');
                } else {
                    el.setAttribute('value', el.value || '');
                }
            }
        });

        return clone.innerHTML;
    };

    // Helper: Show golden beacon highlight when CS agent clicks their screen
    const showHighlightBeacon = (pctX, pctY) => {
        const docWidth = document.documentElement.scrollWidth;
        const docHeight = document.documentElement.scrollHeight;
        const x = pctX * docWidth;
        const y = pctY * docHeight;

        const beacon = document.createElement('div');
        beacon.id = 'cobrowse-highlight-beacon';
        beacon.style.position = 'absolute';
        beacon.style.left = `${x}px`;
        beacon.style.top = `${y}px`;
        beacon.style.transform = 'translate(-50%, -50%)';
        beacon.style.zIndex = '999999';
        beacon.style.pointerEvents = 'none';

        beacon.innerHTML = `
            <div style="position: relative; width: 60px; height: 60px;">
                <div style="position: absolute; inset: 0; border: 4px solid #d97706; border-radius: 50%; opacity: 0.75; animation: cobrowse-pulse 1.5s infinite;"></div>
                <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background-color: #d97706; border: 2px solid white; border-radius: 50%;"></div>
                <div style="position: absolute; left: 70px; top: 50%; transform: translateY(-50%); background-color: #78350f; color: white; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; white-space: nowrap; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    💡 CS Agent pointing here!
                </div>
            </div>
            <style>
                @keyframes cobrowse-pulse {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                }
            </style>
        `;

        const existing = document.getElementById('cobrowse-highlight-beacon');
        if (existing) existing.remove();

        document.body.appendChild(beacon);

        // Smooth scroll user so the highlight is centered in their viewport
        window.scrollTo({
            top: Math.max(0, y - window.innerHeight / 2),
            behavior: 'smooth'
        });

        setTimeout(() => {
            const el = document.getElementById('cobrowse-highlight-beacon');
            if (el) el.remove();
        }, 6000);
    };

    // Primary Socket Management Effect
    useEffect(() => {
        if (!backendurl) return;

        const userId = userdata?.id || userdata?._id;
        console.log("GlobalBroadcastListener initializing socket connection. User ID:", userId);

        const socket = io(backendurl, {
            withCredentials: true,
            transports: ['polling', 'websocket']
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log("GlobalBroadcastListener socket connected successfully:", socket.id);
            if (userId) {
                const roomName = `user-${String(userId)}`;
                socket.emit('join-direct-chat', String(userId));
                console.log(`GlobalBroadcastListener joined room: ${roomName}`);
            }
            
            // Session restoration on refresh/mount
            const savedTicketId = sessionStorage.getItem('coBrowseTicketId');
            if (savedTicketId && userId) {
                console.log("Restoring active co-browsing session for ticket ID:", savedTicketId);
                socket.emit('join-room', `ticket-${savedTicketId}`);
                setActiveTicket(savedTicketId);
                setIsCoSharing(true);
            }
        });

        socket.on('system-config-update', () => {
            console.log("System configuration updated. Refreshing state...");
            getSystemConfig();
        });

        socket.on('admin-broadcast', (data) => {
            console.log('Received system broadcast on patient portal:', data);
            const toastOptions = {
                position: "top-center",
                autoClose: data.duration || 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
            };

            const content = (
                <div className="flex flex-col gap-1">
                    <p className="font-black text-xs uppercase tracking-widest">{data.type === 'emergency' ? '🚨 EMERGENCY ALERT' : data.type === 'warning' ? '⚠️ SYSTEM WARNING' : '📢 SYSTEM ANNOUNCEMENT'}</p>
                    <p className="text-sm font-medium">{data.message}</p>
                    <p className="text-[9px] opacity-70 italic font-bold text-white/80">Received: {new Date(data.timestamp).toLocaleTimeString()}</p>
                </div>
            );

            if (data.type === 'emergency') {
                toast.error(content, toastOptions);
            } else if (data.type === 'warning') {
                toast.warning(content, toastOptions);
            } else {
                toast.info(content, toastOptions);
            }
        });

        socket.on('emergency-alert', (data) => {
            console.log('Received emergency alert:', data);
            toast.error(
                <div className="flex flex-col gap-1">
                    <p className="font-black text-xs uppercase tracking-widest animate-pulse">🛑 CRITICAL EMERGENCY</p>
                    <p className="text-sm font-bold">{data.message}</p>
                    <p className="text-[9px] opacity-80 italic">Activated: {new Date(data.timestamp).toLocaleTimeString()}</p>
                </div>,
                {
                    position: "top-center",
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: false,
                    theme: "colored",
                    icon: "🚨"
                }
            );
        });

        // Co-Browsing Event Receivers
        socket.on('co-browse-request', (data) => {
            console.log('Received co-browse request:', data);
            setCoBrowseReq(data);
        });

        socket.on('co-browse-stop', () => {
            console.log('Agent stopped co-browsing session');
            setIsCoSharing(false);
            setActiveTicket(null);
            sessionStorage.removeItem('coBrowseTicketId');
            const beacon = document.getElementById('cobrowse-highlight-beacon');
            if (beacon) beacon.remove();
            toast.info('Co-browsing support session ended by the agent.');
        });

        socket.on('co-browse-highlight', (data) => {
            console.log('Received co-browse highlight:', data);
            if (data.pctX !== undefined && data.pctY !== undefined) {
                showHighlightBeacon(data.pctX, data.pctY);
            }
        });

        return () => {
            console.log("Cleaning up socket connection inside GlobalBroadcastListener");
            socket.off('connect');
            socket.off('system-config-update');
            socket.off('admin-broadcast');
            socket.off('emergency-alert');
            socket.off('co-browse-request');
            socket.off('co-browse-stop');
            socket.off('co-browse-highlight');
            socket.disconnect();
            socketRef.current = null;
        };
    }, [backendurl, userdata?.id, userdata?._id]);

    // Co-Browsing DOM & Interaction Sync Engine
    useEffect(() => {
        if (!isCoSharing || !activeTicket || !socketRef.current) return;

        const performSync = () => {
            if (!socketRef.current) return;
            const payload = {
                ticketId: activeTicket,
                path: window.location.pathname + window.location.search,
                html: serializeDOM(),
                styles: getStylesheets(),
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                width: window.innerWidth,
                height: window.innerHeight,
                scrollWidth: document.documentElement.scrollWidth,
                scrollHeight: document.documentElement.scrollHeight,
                timestamp: Date.now()
            };
            socketRef.current.emit('co-browse-sync', payload);
        };

        // Send baseline DOM immediately on route/mount change
        performSync();

        // Throttled sync for scroll & value typing
        const throttledSync = throttle(performSync, 400);

        // Throttled cursor position sender (to keep bandwidth lightweight)
        const handleMouseMove = throttle((e) => {
            if (!socketRef.current) return;
            socketRef.current.emit('co-browse-sync', {
                ticketId: activeTicket,
                mouseX: e.pageX,
                mouseY: e.pageY,
                isMouseOnly: true
            });
        }, 80);

        window.addEventListener('scroll', throttledSync);
        document.addEventListener('input', throttledSync);
        window.addEventListener('mousemove', handleMouseMove);

        // Fallback keepalive heartbeat
        const heartbeat = setInterval(performSync, 3000);

        return () => {
            window.removeEventListener('scroll', throttledSync);
            document.removeEventListener('input', throttledSync);
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(heartbeat);
        };
    }, [isCoSharing, activeTicket, location.pathname]);

    const acceptCoBrowse = () => {
        if (!coBrowseReq || !socketRef.current) return;
        const { ticketId } = coBrowseReq;

        const userId = userdata?.id || userdata?._id;
        socketRef.current.emit('join-room', `ticket-${ticketId}`);
        socketRef.current.emit('co-browse-accept', { ticketId, userId });

        setActiveTicket(ticketId);
        setIsCoSharing(true);
        sessionStorage.setItem('coBrowseTicketId', ticketId);
        setCoBrowseReq(null);
        toast.success('Co-browsing active. Connecting you with our CS representative...');
    };

    const declineCoBrowse = () => {
        if (!coBrowseReq || !socketRef.current) return;
        const { ticketId } = coBrowseReq;
        const userId = userdata?.id || userdata?._id;
        socketRef.current.emit('co-browse-decline', { ticketId, userId });
        setCoBrowseReq(null);
    };

    const stopCoBrowsingSession = () => {
        if (socketRef.current && activeTicket) {
            socketRef.current.emit('co-browse-stop', { ticketId: activeTicket });
        }
        setIsCoSharing(false);
        setActiveTicket(null);
        sessionStorage.removeItem('coBrowseTicketId');
        const beacon = document.getElementById('cobrowse-highlight-beacon');
        if (beacon) beacon.remove();
        toast.info('Co-browsing session terminated.');
    };

    return (
        <>
            {/* Safe Co-Browsing Request Overlay Modal */}
            {coBrowseReq && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200/50 transform scale-100 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-amber-50 rounded-xl text-amber-600 animate-pulse">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Interactive Support Request</h3>
                                <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mt-0.5">Safe Co-Browsing Session</p>
                            </div>
                        </div>

                        <div className="space-y-3 my-4 text-sm text-gray-600">
                            <p>
                                Customer Service Agent <strong className="text-gray-800 font-bold">{coBrowseReq.agentName}</strong> wants to view your app screen in real time to guide you.
                            </p>
                            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                                <div className="flex items-start gap-2.5">
                                    <span className="text-emerald-500 text-base mt-0.5">🛡️</span>
                                    <p className="text-xs text-slate-700"><strong className="text-slate-900 font-bold">Strict Privacy:</strong> Sensitive fields like passwords and card info are hidden from the agent.</p>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="text-emerald-500 text-base mt-0.5">🛑</span>
                                    <p className="text-xs text-slate-700"><strong className="text-slate-900 font-bold">Read-Only Screen:</strong> The agent cannot click buttons or enter data on your behalf.</p>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="text-emerald-500 text-base mt-0.5">🚪</span>
                                    <p className="text-xs text-slate-700"><strong className="text-slate-900 font-bold">Full Control:</strong> You can cancel sharing at any time by clicking the disconnect badge.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={declineCoBrowse}
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Decline
                            </button>
                            <button
                                onClick={acceptCoBrowse}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-bold hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-100 transition-all"
                            >
                                Accept & Share
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Active Session Overlay Badge */}
            {isCoSharing && (
                <div className="fixed bottom-6 right-6 bg-slate-900/90 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-emerald-500/20 z-[99998] flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                        </span>
                        <div className="text-left">
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Co-Browsing Active</p>
                            <p className="text-xs font-semibold text-slate-200">Sharing screen with Agent</p>
                        </div>
                    </div>
                    <button
                        onClick={stopCoBrowsingSession}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase px-3 py-1.5 rounded-lg transition-transform active:scale-95 shadow-md shadow-rose-900/20"
                    >
                        Disconnect
                    </button>
                </div>
            )}
        </>
    );
};

export default GlobalBroadcastListener;
