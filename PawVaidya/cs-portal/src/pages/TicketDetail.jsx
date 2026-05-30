import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CSContext } from '../context/CSContext';
import { io } from 'socket.io-client';

const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cstoken, backendUrl, employee } = useContext(CSContext);

    const [ticket, setTicket] = useState(null);
    const [adminReport, setAdminReport] = useState(null);
    const [loading, setLoading] = useState(true);

    // Co-Browsing States
    const [socket, setSocket] = useState(null);
    const [coBrowseStatus, setCoBrowseStatus] = useState('inactive'); // inactive, requesting, active, declined
    const [mirroredState, setMirroredState] = useState(null);
    const iframeRef = useRef(null);
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(800);

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

    // Measure container size for responsive viewport scaling
    useEffect(() => {
        if (containerRef.current) {
            const handleResize = () => {
                setContainerWidth(containerRef.current.getBoundingClientRect().width);
            };
            handleResize();
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, [coBrowseStatus === 'active']);

    // Initialize Socket.io and Listen for Co-Browsing Events
    useEffect(() => {
        if (!backendUrl || !id) return;

        const newSocket = io(backendUrl, {
            withCredentials: true,
            transports: ['polling', 'websocket']
        });
        setSocket(newSocket);

        newSocket.emit('join-room', `ticket-${id}`);
        console.log(`CS Agent joined ticket room: ticket-${id}`);

        newSocket.on('co-browse-accept', (data) => {
            console.log('Customer accepted co-browsing session:', data);
            setCoBrowseStatus('active');
            toast.success('Customer accepted co-browsing request.');
        });

        newSocket.on('co-browse-decline', (data) => {
            console.log('Customer declined co-browsing session:', data);
            setCoBrowseStatus('declined');
            toast.warning('Customer declined co-browsing request.');
            setTimeout(() => setCoBrowseStatus('inactive'), 5000);
        });

        newSocket.on('co-browse-stop', (data) => {
            console.log('Co-browsing session ended by user');
            setCoBrowseStatus('inactive');
            setMirroredState(null);
            toast.info('Co-browsing session ended by customer.');
        });

        newSocket.on('co-browse-sync', (data) => {
            if (data.isMouseOnly) {
                setMirroredState(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        mouseX: data.mouseX,
                        mouseY: data.mouseY
                    };
                });
            } else {
                setMirroredState(data);
            }
        });

        return () => {
            newSocket.emit('leave-room', `ticket-${id}`);
            newSocket.off('co-browse-accept');
            newSocket.off('co-browse-decline');
            newSocket.off('co-browse-stop');
            newSocket.off('co-browse-sync');
            newSocket.disconnect();
        };
    }, [id, backendUrl]);

    // Handle iframe document writes
    useEffect(() => {
        if (iframeRef.current && mirroredState?.html) {
            const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
            
            let stylesHtml = '';
            (mirroredState.styles || []).forEach(style => {
                if (style.type === 'text') {
                    stylesHtml += `<style>${style.content}</style>`;
                } else if (style.type === 'link') {
                    stylesHtml += `<link rel="stylesheet" href="${style.href}">`;
                }
            });

            doc.open();
            doc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    ${stylesHtml}
                    <style>
                        ::-webkit-scrollbar { display: none; }
                        body { 
                            margin: 0;
                            padding: 0;
                            overflow: hidden; 
                            pointer-events: none; 
                            user-select: none;
                        }
                    </style>
                </head>
                <body>
                    <div id="root">${mirroredState.html}</div>
                </body>
                </html>
            `);
            doc.close();

            iframeRef.current.contentWindow.scrollTo(mirroredState.scrollX || 0, mirroredState.scrollY || 0);
        }
    }, [mirroredState?.html, mirroredState?.styles]);

    // Fast scroll synchronization without iframe reload
    useEffect(() => {
        if (iframeRef.current && iframeRef.current.contentWindow && mirroredState) {
            iframeRef.current.contentWindow.scrollTo(mirroredState.scrollX || 0, mirroredState.scrollY || 0);
        }
    }, [mirroredState?.scrollX, mirroredState?.scrollY]);

    const handleRequestCoBrowse = () => {
        if (!socket || !ticket || !employee) {
            toast.error('Unable to send request. Active session parameters missing.');
            return;
        }
        // ticket.userId may be a populated object or a raw ObjectId string
        const resolvedUserId = ticket.userId?._id
            ? String(ticket.userId._id)
            : String(ticket.userId);

        if (!resolvedUserId || resolvedUserId === 'undefined') {
            toast.error('Cannot identify the customer. Please refresh and try again.');
            return;
        }

        setCoBrowseStatus('requesting');
        socket.emit('co-browse-request', {
            ticketId: id,
            agentName: employee.name,
            userId: resolvedUserId
        });
        toast.info('Co-browsing request sent to customer.');
    };

    const handleStopCoBrowse = () => {
        if (!socket) return;
        socket.emit('co-browse-stop', { ticketId: id });
        setCoBrowseStatus('inactive');
        setMirroredState(null);
        toast.info('Co-browsing session terminated.');
    };

    const handleMirrorClick = (e) => {
        if (!socket || !mirroredState) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const pctViewportX = clickX / rect.width;
        const pctViewportY = clickY / rect.height;

        const docX = (pctViewportX * mirroredState.width) + mirroredState.scrollX;
        const docY = (pctViewportY * mirroredState.height) + mirroredState.scrollY;

        const pctX = docX / mirroredState.scrollWidth;
        const pctY = docY / mirroredState.scrollHeight;

        socket.emit('co-browse-highlight', {
            ticketId: id,
            pctX,
            pctY
        });

        // Add visual click confirmation pulse overlay
        const clickIndicator = document.createElement('div');
        clickIndicator.style.position = 'absolute';
        clickIndicator.style.left = `${clickX}px`;
        clickIndicator.style.top = `${clickY}px`;
        clickIndicator.style.transform = 'translate(-50%, -50%)';
        clickIndicator.style.width = '30px';
        clickIndicator.style.height = '30px';
        clickIndicator.style.borderRadius = '50%';
        clickIndicator.style.border = '2px solid #eab308';
        clickIndicator.style.backgroundColor = 'rgba(234, 179, 8, 0.2)';
        clickIndicator.style.pointerEvents = 'none';
        clickIndicator.style.animation = 'agent-pulse 0.8s ease-out';
        clickIndicator.style.zIndex = '50';

        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes agent-pulse {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
            }
        `;
        clickIndicator.appendChild(style);

        e.currentTarget.appendChild(clickIndicator);
        setTimeout(() => clickIndicator.remove(), 800);
    };

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

            {/* CS Agent Co-Browsing Panel */}
            <div className="bg-white px-6 py-5 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-base">Safe Co-Browsing Mode</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Interactive Support System</p>
                        </div>
                    </div>
                    {coBrowseStatus === 'active' && (
                        <div className="flex items-center gap-3">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Live Viewport Mirror</span>
                        </div>
                    )}
                </div>

                {coBrowseStatus === 'inactive' && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
                        <div className="text-sm text-slate-600 flex-1">
                            <p className="font-medium text-slate-800">Guide the user in real-time</p>
                            <p className="text-xs text-slate-500 mt-1">
                                Request a safe, read-only co-browsing connection to view the user's active page. Sensitive data like passwords will be automatically masked.
                            </p>
                        </div>
                        <button
                            onClick={handleRequestCoBrowse}
                            className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 whitespace-nowrap"
                        >
                            Request Co-Browsing
                        </button>
                    </div>
                )}

                {coBrowseStatus === 'requesting' && (
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <div>
                                <p className="text-sm font-bold text-indigo-700">Awaiting Approval</p>
                                <p className="text-xs text-slate-500 mt-0.5">Prompt sent to customer's screen. Waiting for them to accept...</p>
                            </div>
                        </div>
                        <button
                            onClick={handleStopCoBrowse}
                            className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {coBrowseStatus === 'declined' && (
                    <div className="flex items-center justify-between bg-rose-50 p-4 rounded-xl border border-rose-100">
                        <div className="flex items-center gap-3 text-rose-800">
                            <span className="text-lg">❌</span>
                            <div>
                                <p className="text-sm font-bold">Request Declined</p>
                                <p className="text-xs text-rose-600 mt-0.5">The customer chose not to share their screen at this time.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRequestCoBrowse}
                            className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {coBrowseStatus === 'active' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-emerald-850 text-xs font-semibold">
                            <div className="flex items-center gap-2">
                                <span>📍</span>
                                <span>Customer Path: <strong className="text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-emerald-100">{mirroredState?.path || '/'}</strong></span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="hidden sm:inline text-slate-500">🖱️ Click anywhere to Highlight guidance spotlight</span>
                                <button
                                    onClick={handleStopCoBrowse}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded transition-colors"
                                >
                                    End Session
                                </button>
                            </div>
                        </div>

                        {/* Mirrored Sandbox View */}
                        {mirroredState ? (
                            <div 
                                ref={containerRef}
                                style={{
                                    width: '100%',
                                    height: `${(mirroredState?.height || 768) * (containerWidth / (mirroredState?.width || 1024))}px`,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    border: '2px solid #cbd5e1',
                                    borderRadius: '12px',
                                    backgroundColor: '#f8fafc',
                                    boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)'
                                }}
                            >
                                <div
                                    style={{
                                        width: `${mirroredState?.width || 1024}px`,
                                        height: `${mirroredState?.height || 768}px`,
                                        transform: `scale(${containerWidth / (mirroredState?.width || 1024)})`,
                                        transformOrigin: 'top left',
                                        position: 'relative'
                                    }}
                                >
                                    <iframe
                                        ref={iframeRef}
                                        title="Co-Browse Sandbox"
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                        sandbox="allow-same-origin"
                                    />
                                    
                                    {/* Action capture layer */}
                                    <div
                                        onClick={handleMirrorClick}
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            cursor: 'crosshair',
                                            zIndex: 40,
                                            background: 'transparent'
                                        }}
                                    />

                                    {/* Customer's Sync Cursor */}
                                    {mirroredState && mirroredState.mouseX !== undefined && mirroredState.mouseY !== undefined && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${mirroredState.mouseX - mirroredState.scrollX}px`,
                                                top: `${mirroredState.mouseY - mirroredState.scrollY}px`,
                                                width: '14px',
                                                height: '14px',
                                                borderRadius: '50%',
                                                backgroundColor: '#ef4444',
                                                border: '2.5px solid white',
                                                boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
                                                pointerEvents: 'none',
                                                zIndex: 45,
                                                transform: 'translate(-50%, -50%)',
                                                transition: 'left 0.08s ease-out, top 0.08s ease-out'
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-sm font-semibold text-slate-500">Connecting to stream...</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Waiting for customer's first frame payload</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

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
