import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CSContext } from '../context/CSContext';
import { io } from 'socket.io-client';
import {
    FaPhoneAlt,
    FaPhoneSlash,
    FaMicrophone,
    FaMicrophoneSlash,
    FaPaperclip,
    FaPaperPlane,
    FaFileAlt,
    FaSpinner,
    FaTimes,
    FaVolumeUp
} from 'react-icons/fa';

const throttle = (func, limit) => {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cstoken, backendUrl, employee } = useContext(CSContext);

    const [ticket, setTicket] = useState(null);
    const [adminReport, setAdminReport] = useState(null);
    const [loading, setLoading] = useState(true);

    // Co-Browsing States
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);
    const [coBrowseStatus, setCoBrowseStatus] = useState('inactive'); // inactive, requesting, active, declined
    const [mirroredState, setMirroredState] = useState(null);
    const iframeRef = useRef(null);
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(800);

    // Advanced Co-Browsing states
    const [coBrowseMode, setCoBrowseMode] = useState('pointer'); // 'pointer' or 'draw'
    const [allowAnnotations, setAllowAnnotations] = useState(false);
    const [isCustomerRouteProtected, setIsCustomerRouteProtected] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);

    const drawPoints = useRef([]);
    const agentActivityRef = useRef(Date.now());
    const agentCanvasRef = useRef(null);
    const agentLinesBuffer = useRef([]);

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

    // AI CS Helper states
    const [suggestions, setSuggestions] = useState([]);
    const [deEscalationTip, setDeEscalationTip] = useState('');
    const [showVetSummaryModal, setShowVetSummaryModal] = useState(false);
    const [vetSummaryContent, setVetSummaryContent] = useState('');
    const [fetchingVetSummary, setFetchingVetSummary] = useState(false);

    // Script Adherence Scoring
    const [scriptScore, setScriptScore] = useState(null); // 0-100

    // Sentiment tracking & supervisor escalation states
    const [sentimentData, setSentimentData] = useState({
        sentimentScore: 0,
        label: 'neutral',
        isCritical: false,
        deEscalationTip: '',
        messageCount: 0,
        history: []
    });
    const [fetchingSentiment, setFetchingSentiment] = useState(false);
    const [hasAutoEscalated, setHasAutoEscalated] = useState(false);

    // Compensation & Loyalty Coupon Generator States
    const [couponType, setCouponType] = useState('refund'); // 'refund' or 'gifted'
    const [discountType, setDiscountType] = useState('fixed'); // 'fixed' or 'percentage'
    const [discountValue, setDiscountValue] = useState('');
    const [maxDiscount, setMaxDiscount] = useState('');
    const [couponReason, setCouponReason] = useState('doctor_missed_call');
    const [customReason, setCustomReason] = useState('');
    const [generatingCoupon, setGeneratingCoupon] = useState(false);
    const [generatedCoupons, setGeneratedCoupons] = useState([]);

    const triggerSupervisorAlert = async (score, label, isAuto = false) => {
        if (!employee || !id) return;
        
        const messageText = isAuto
            ? `⚠️ System alert: High-stress/critical sentiment detected. Customer is ${label.toUpperCase()} (score: ${score}).`
            : `Agent ${employee.name} manually called for supervisor assistance. Customer sentiment: ${label.toUpperCase()} (score: ${score}).`;

        // Emit Socket Event to cs-monitor-admin room
        if (socketRef.current) {
            socketRef.current.emit('cs-agent-supervisor-escalation', {
                employeeId: employee._id,
                employeeName: employee.name,
                ticketId: id,
                message: messageText,
                severity: isAuto ? 'medium' : 'high',
                sentimentScore: score,
                label
            });
        }

        // Persist to DB using the existing log-monitoring-alert API
        try {
            await axios.post(`${backendUrl}/api/cs-admin/log-monitoring-alert`, {
                alertType: 'idle_alert',
                message: messageText,
                severity: isAuto ? 'medium' : 'high',
                metadata: {
                    subType: 'supervisor_escalation',
                    ticketId: id,
                    sentimentScore: score,
                    label,
                    isAuto
                }
            }, { headers: { cstoken } });

            if (!isAuto) {
                toast.success("🚨 Supervisor has been alerted successfully.");
            }
        } catch (err) {
            console.error("Failed to log supervisor alert:", err);
            if (!isAuto) {
                toast.error("Failed to alert supervisor via API.");
            }
        }
    };

    const fetchSentiment = useCallback(async () => {
        if (!id) return;
        setFetchingSentiment(true);
        try {
            const { data } = await axios.get(`${backendUrl}/api/complaint/ticket/${id}/sentiment`, {
                headers: { cstoken }
            });
            if (data.success) {
                setSentimentData({
                    sentimentScore: data.sentimentScore,
                    label: data.label,
                    isCritical: data.isCritical,
                    deEscalationTip: data.deEscalationTip,
                    messageCount: data.messageCount,
                    history: data.history || []
                });

                // Auto-Escalate if critical and we haven't escalated yet
                if (data.isCritical && !hasAutoEscalated) {
                    triggerSupervisorAlert(data.sentimentScore, data.label, true);
                    setHasAutoEscalated(true);
                }
            }
        } catch (error) {
            console.warn("Failed to fetch sentiment analysis:", error.message);
        } finally {
            setFetchingSentiment(false);
        }
    }, [id, backendUrl, cstoken, hasAutoEscalated]);

    // Create a throttled version of fetchSentiment (limit to once per 3s)
    const throttledFetchSentiment = useCallback(
        throttle(() => {
            fetchSentiment();
        }, 3000),
        [fetchSentiment]
    );
    // Golden response templates — key phrases admin expects agents to use
    const GOLDEN_TEMPLATES = [
        'thank you for reaching out',
        'i understand your concern',
        'i apologize for the inconvenience',
        'please allow me to',
        'i will escalate',
        'happy to help',
        'is there anything else',
        'we value your feedback',
        'let me check that for you',
    ];
    const calcScriptScore = (text) => {
        const lc = text.toLowerCase();
        const matched = GOLDEN_TEMPLATES.filter(t => lc.includes(t)).length;
        return Math.round((matched / GOLDEN_TEMPLATES.length) * 100);
    };


    // Chat States
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherSideTyping, setOtherSideTyping] = useState(false);
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Call States
    const [callState, setCallState] = useState('idle'); // idle, calling, connected
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [customerSocketId, setCustomerSocketId] = useState('');

    // WebRTC Refs
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const durationIntervalRef = useRef(null);

    // Call Recording Refs
    const audioRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioContextRef = useRef(null);
    const callDurationRef = useRef(0);

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

    const loadMessages = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/complaint/ticket/${id}/messages`, {
                headers: { cstoken }
            });
            if (data.success) {
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    };

    const fetchTicketCoupons = async () => {
        if (!id) return;
        try {
            const { data } = await axios.get(`${backendUrl}/api/cs/ticket-coupons/${id}`, {
                headers: { cstoken }
            });
            if (data.success) {
                setGeneratedCoupons(data.coupons || []);
            }
        } catch (error) {
            console.warn("Failed to fetch ticket coupons:", error.message);
        }
    };

    const handleGenerateCoupon = async (e) => {
        e.preventDefault();
        if (!discountValue || Number(discountValue) <= 0) {
            toast.error("Please enter a valid discount value");
            return;
        }

        const finalReason = couponReason === 'other' ? customReason : couponReason.replace(/_/g, ' ');
        if (!finalReason.trim()) {
            toast.error("Please provide a reason for compensation");
            return;
        }

        setGeneratingCoupon(true);
        try {
            const { data } = await axios.post(`${backendUrl}/api/cs/generate-compensation-coupon`, {
                ticketId: id,
                couponType,
                discountType,
                discountValue,
                maxDiscount: discountType === 'percentage' ? maxDiscount : undefined,
                reason: finalReason,
                userEmail: ticket.userEmail
            }, {
                headers: { cstoken }
            });

            if (data.success) {
                toast.success(data.message || "Compensation coupon generated successfully!");
                setDiscountValue('');
                setMaxDiscount('');
                setCustomReason('');
                fetchTicketCoupons();
                if (data.agentXP !== undefined) {
                    toast.info(`🎉 +10 XP Gained! New Level: ${data.agentLevel} (${data.agentXP} XP)`);
                }
            } else {
                toast.error(data.message || "Failed to generate coupon");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setGeneratingCoupon(false);
        }
    };

    const getAgentLimit = () => {
        if (!employee) return 300;
        if (employee.isMaster) return 1500;
        const lvl = employee.level || 1;
        if (lvl >= 5) return 1500;
        if (lvl === 4) return 1200;
        if (lvl === 3) return 800;
        if (lvl === 2) return 500;
        return 300;
    };

    useEffect(() => {
        setHasAutoEscalated(false);
        fetchTicket();
        loadMessages();
        fetchSentiment();
        fetchTicketCoupons();
        const interval = setInterval(() => {
            fetchTicket();
            loadMessages();
            fetchSentiment();
            fetchTicketCoupons();
        }, 10000);
        return () => clearInterval(interval);
    }, [id, fetchSentiment]);

    // ── Tab-Switch / Focus-Loss Detection ──────────────────────────────────
    useEffect(() => {
        if (!employee || !id) return;

        const handleVisibilityChange = async () => {
            if (document.hidden) {
                // Emit real-time socket alert
                if (socketRef.current) {
                    socketRef.current.emit('cs-agent-focus-loss', {
                        employeeId: employee._id,
                        employeeName: employee.name,
                        ticketId: id,
                        lostAt: new Date().toISOString()
                    });
                }
                // Persist to DB silently
                try {
                    await axios.post(`${backendUrl}/api/cs-admin/log-monitoring-alert`, {
                        alertType: 'idle_alert',
                        message: `Agent switched away from CS portal while handling ticket #${id}`,
                        severity: 'medium',
                        metadata: { ticketId: id, subType: 'focus_loss' }
                    }, { headers: { cstoken } });
                } catch (e) {
                    console.warn('[Monitor] Focus-loss log failed:', e.message);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [employee, id, backendUrl, cstoken]);
    // ──────────────────────────────────────────────────────────────────────

    // ── Concurrent Ticket Overload Detection ────────────────────────────────
    useEffect(() => {
        if (!employee || !socketRef.current) return;
        // Count agent's currently open tickets and report to monitor
        const reportActiveCount = async () => {
            try {
                const { data } = await axios.get(
                    `${backendUrl}/api/complaint/my-tickets?status=open,in_progress,scheduled_call`,
                    { headers: { cstoken } }
                );
                const activeCount = data?.tickets?.length ?? 0;
                if (socketRef.current) {
                    socketRef.current.emit('cs-agent-ticket-count-update', {
                        employeeId: employee._id,
                        employeeName: employee.name,
                        activeCount
                    });
                }
            } catch (e) { /* silent */ }
        };
        reportActiveCount();
    }, [employee, socketRef.current]);
    // ──────────────────────────────────────────────────────────────────────

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

    // Call duration timer
    useEffect(() => {
        if (callState === 'connected') {
            setCallDuration(0);
            callDurationRef.current = 0;
            durationIntervalRef.current = setInterval(() => {
                setCallDuration(prev => {
                    const next = prev + 1;
                    callDurationRef.current = next;
                    return next;
                });
            }, 1000);
        } else {
            if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
            setCallDuration(0);
            callDurationRef.current = 0;
        }
        return () => {
            if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        };
    }, [callState]);

    // Initialize Socket.io and Listen for Co-Browsing / VoIP / Chat Events
    useEffect(() => {
        if (!backendUrl || !id) return;

        const newSocket = io(backendUrl, {
            withCredentials: true,
            transports: ['polling', 'websocket']
        });
        setSocket(newSocket);
        socketRef.current = newSocket;

        newSocket.emit('join-room', `ticket-${id}`);
        console.log(`CS Agent joined ticket room: ticket-${id}`);

        // Co-Browsing listeners
        newSocket.on('co-browse-accept', (data) => {
            console.log('Customer accepted co-browsing session:', data);
            setCoBrowseStatus('active');
            setAllowAnnotations(!!data.allowAnnotations);
            toast.success(data.allowAnnotations
                ? 'Customer accepted co-browsing. Interactive guidance enabled.'
                : 'Customer accepted co-browsing. View-Only mode enforced.'
            );
            // Log session start to DB audit
            axios.post(`${backendUrl}/api/cs-admin/log-monitoring-alert`, {
                alertType: 'cobrowse_action',
                message: `Safe co-browsing session started with customer. Interactive annotations: ${data.allowAnnotations ? 'GRANTED' : 'DENIED'}`,
                severity: 'low',
                metadata: { ticketId: id, allowAnnotations: data.allowAnnotations }
            }, { headers: { cstoken } }).catch(() => { });
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
            setAllowAnnotations(false);
            setIsCustomerRouteProtected(false);
            agentLinesBuffer.current = [];
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
                setIsCustomerRouteProtected(!!data.routeProtected);
            }
        });

        // Chat listeners
        newSocket.on('receive-ticket-message', (msg) => {
            setMessages(prev => {
                if (prev.some(m => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        });

        newSocket.on('ticket-typing-start', () => {
            setOtherSideTyping(true);
        });

        newSocket.on('ticket-typing-stop', () => {
            setOtherSideTyping(false);
        });

        // WebRTC/VoIP listeners
        newSocket.on('ticket-call-accepted', async (data) => {
            console.log('Customer accepted voice call:', data);
            setCustomerSocketId(data.fromSocketId);
            setCallState('connected');
            await startWebRTCCaller(data.fromSocketId);
        });

        newSocket.on('ticket-call-declined', () => {
            toast.warning('The customer declined your voice call.');
            resetCallState();
        });

        newSocket.on('ticket-call-ended', async () => {
            toast.info('Voice call ended by customer.');
            if (callDurationRef.current > 0) {
                await uploadVoiceCallRecording(callDurationRef.current);
            }
            resetCallState();
        });

        newSocket.on('ticket-answer', async (data) => {
            console.log('Received WebRTC answer:', data);
            if (peerConnectionRef.current) {
                try {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                } catch (e) {
                    console.error('Error setting remote description:', e);
                }
            }
        });

        newSocket.on('ticket-ice-candidate', async (data) => {
            console.log('Received WebRTC ICE candidate:', data);
            if (peerConnectionRef.current) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    console.error('Error adding ICE candidate:', e);
                }
            }
        });

        return () => {
            newSocket.emit('leave-room', `ticket-${id}`);
            newSocket.off('co-browse-accept');
            newSocket.off('co-browse-decline');
            newSocket.off('co-browse-stop');
            newSocket.off('co-browse-sync');
            newSocket.off('receive-ticket-message');
            newSocket.off('ticket-typing-start');
            newSocket.off('ticket-typing-stop');
            newSocket.off('ticket-call-accepted');
            newSocket.off('ticket-call-declined');
            newSocket.off('ticket-call-ended');
            newSocket.off('ticket-answer');
            newSocket.off('ticket-ice-candidate');
            newSocket.disconnect();
            resetCallState();
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

    // Co-browsing requests
    const handleRequestCoBrowse = () => {
        if (!socket || !ticket || !employee) {
            toast.error('Unable to send request. Active session parameters missing.');
            return;
        }
        const targetUserId = ticket.userId?._id || ticket.userId;
        socket.emit('co-browse-request', {
            ticketId: id,
            userId: targetUserId,
            agentName: employee.name
        });
        setCoBrowseStatus('requesting');
        toast.info('Co-browsing request sent to customer.');
    };

    const handleStopCoBrowse = () => {
        if (!socket) return;
        socket.emit('co-browse-stop', { ticketId: id });
        setCoBrowseStatus('inactive');
        setMirroredState(null);
        setAllowAnnotations(false);
        setIsCustomerRouteProtected(false);
        agentLinesBuffer.current = [];
        toast.info('Co-browsing session terminated.');

        // Log session stop to DB audit
        axios.post(`${backendUrl}/api/cs-admin/log-monitoring-alert`, {
            alertType: 'cobrowse_action',
            message: `Co-browsing session terminated by Agent ${employee?.name || ''}.`,
            severity: 'low',
            metadata: { ticketId: id }
        }, { headers: { cstoken } }).catch(() => { });
    };

    const sendAgentPointer = useCallback(
        throttle((pctX, pctY) => {
            if (socketRef.current) {
                socketRef.current.emit('co-browse-mouse-move', { ticketId: id, pctX, pctY });
            }
        }, 85),
        [id]
    );

    const sendDrawPoints = useCallback(
        throttle((points) => {
            if (socketRef.current) {
                socketRef.current.emit('co-browse-draw-line', { ticketId: id, points, color: '#f43f5e' });
            }
        }, 110),
        [id]
    );

    const handleMirrorClick = (e) => {
        if (!socket) return;

        agentActivityRef.current = Date.now();
        const rect = e.target.getBoundingClientRect();

        const clickX = ((e.clientX - rect.left) / rect.width) * (mirroredState?.width || 1024);
        const clickY = ((e.clientY - rect.top) / rect.height) * (mirroredState?.height || 768);

        // Security check: Check if clicking a restricted element
        if (iframeRef.current && iframeRef.current.contentDocument) {
            const el = iframeRef.current.contentDocument.elementFromPoint(clickX, clickY);
            if (el) {
                const tag = el.tagName;
                const text = (el.innerText || el.value || '').toLowerCase();
                const isActionButton = tag === 'BUTTON' ||
                    tag === 'A' ||
                    el.type === 'submit' ||
                    text.includes('pay') ||
                    text.includes('submit') ||
                    text.includes('refund') ||
                    text.includes('delete') ||
                    text.includes('confirm') ||
                    text.includes('cancel');

                if (isActionButton) {
                    toast.error('❌ Operation Restricted: Agents are not permitted to click buttons or execute transactions on behalf of customers.');
                    // Log to DB audit
                    axios.post(`${backendUrl}/api/cs-admin/log-monitoring-alert`, {
                        alertType: 'cobrowse_action',
                        message: `Agent ${employee?.name || ''} attempted interaction on restricted element (${tag}) "${text.substring(0, 30)}"`,
                        severity: 'medium',
                        metadata: { ticketId: id, buttonText: text, elementTag: tag }
                    }, { headers: { cstoken } }).catch(() => { });
                    return;
                }
            }
        }

        // Highlight spotlight
        if (coBrowseMode === 'pointer') {
            const absX = clickX + (mirroredState?.scrollX || 0);
            const absY = clickY + (mirroredState?.scrollY || 0);

            const pctX = absX / (mirroredState?.scrollWidth || mirroredState?.width || 1024);
            const pctY = absY / (mirroredState?.scrollHeight || mirroredState?.height || 768);

            socket.emit('co-browse-highlight', {
                ticketId: id,
                pctX,
                pctY
            });
        }
    };

    const handleMirrorMouseMove = (e) => {
        if (!socket || coBrowseStatus !== 'active' || !allowAnnotations) return;
        agentActivityRef.current = Date.now();

        const rect = e.target.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * (mirroredState?.width || 1024) + (mirroredState?.scrollX || 0);
        const clickY = ((e.clientY - rect.top) / rect.height) * (mirroredState?.height || 768) + (mirroredState?.scrollY || 0);

        const pctX = clickX / (mirroredState?.scrollWidth || mirroredState?.width || 1024);
        const pctY = clickY / (mirroredState?.scrollHeight || mirroredState?.height || 768);

        if (isDrawing && coBrowseMode === 'draw') {
            drawPoints.current.push({ pctX, pctY });

            agentLinesBuffer.current.push({
                points: [...drawPoints.current],
                color: '#f43f5e',
                timestamp: Date.now()
            });

            sendDrawPoints(drawPoints.current);
        } else if (coBrowseMode === 'pointer') {
            sendAgentPointer(pctX, pctY);
        }
    };

    const handleMirrorMouseDown = (e) => {
        if (coBrowseMode !== 'draw' || !allowAnnotations) return;
        setIsDrawing(true);
        agentActivityRef.current = Date.now();

        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * (mirroredState?.width || 1024) + (mirroredState?.scrollX || 0);
        const y = ((e.clientY - rect.top) / rect.height) * (mirroredState?.height || 768) + (mirroredState?.scrollY || 0);

        const pctX = x / (mirroredState?.scrollWidth || mirroredState?.width || 1024);
        const pctY = y / (mirroredState?.scrollHeight || mirroredState?.height || 768);

        drawPoints.current = [{ pctX, pctY }];
    };

    const handleMirrorMouseUp = () => {
        setIsDrawing(false);
        drawPoints.current = [];
    };

    // Agent drawing canvas animation loop
    useEffect(() => {
        if (coBrowseStatus !== 'active' || !allowAnnotations) {
            agentLinesBuffer.current = [];
            return;
        }

        let animFrame;
        const canvas = agentCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        const drawLoop = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const now = Date.now();
            agentLinesBuffer.current = agentLinesBuffer.current.filter(line => now - line.timestamp < 3500);

            agentLinesBuffer.current.forEach(line => {
                if (line.points.length < 2) return;

                const age = now - line.timestamp;
                const opacity = Math.max(0, 1 - age / 3500);

                ctx.beginPath();
                ctx.strokeStyle = line.color;
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.globalAlpha = opacity;

                const firstPoint = line.points[0];
                ctx.moveTo(firstPoint.pctX * canvas.width, firstPoint.pctY * canvas.height);
                for (let i = 1; i < line.points.length; i++) {
                    ctx.lineTo(line.points[i].pctX * canvas.width, line.points[i].pctY * canvas.height);
                }
                ctx.stroke();
            });

            animFrame = requestAnimationFrame(drawLoop);
        };

        drawLoop();

        return () => {
            cancelAnimationFrame(animFrame);
        };
    }, [coBrowseStatus, allowAnnotations]);

    // Agent inactivity timeout (90s)
    useEffect(() => {
        if (coBrowseStatus !== 'active') return;

        agentActivityRef.current = Date.now();

        const checkActivity = setInterval(() => {
            const idleTime = Date.now() - agentActivityRef.current;
            if (idleTime >= 90000) {
                toast.warning('Co-browsing session closed due to agent inactivity.');
                handleStopCoBrowse();

                // Log inactivity timeout to DB audit
                axios.post(`${backendUrl}/api/cs-admin/log-monitoring-alert`, {
                    alertType: 'cobrowse_action',
                    message: `Co-browsing session closed automatically due to agent inactivity (90 seconds).`,
                    severity: 'low',
                    metadata: { ticketId: id }
                }, { headers: { cstoken } }).catch(() => { });
            }
        }, 5000);

        return () => clearInterval(checkActivity);
    }, [coBrowseStatus]);

    // Auto-timeout co-browsing on focus loss (15s)
    useEffect(() => {
        if (coBrowseStatus !== 'active') return;

        let blurTimeout;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                blurTimeout = setTimeout(() => {
                    toast.warning('Co-browsing session disconnected for security (tab out-of-focus timeout).');
                    handleStopCoBrowse();

                    axios.post(`${backendUrl}/api/cs-admin/log-monitoring-alert`, {
                        alertType: 'cobrowse_action',
                        message: `Co-browsing session terminated due to agent tab focus loss > 15s.`,
                        severity: 'medium',
                        metadata: { ticketId: id }
                    }, { headers: { cstoken } }).catch(() => { });
                }, 15000);
            } else {
                if (blurTimeout) clearTimeout(blurTimeout);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (blurTimeout) clearTimeout(blurTimeout);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [coBrowseStatus]);

    // Call Recording Actions
    const startCallRecording = (localStream, remoteStream) => {
        try {
            console.log("Starting voice call audio mixer & recording...");
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn("Web Audio API not supported in this browser.");
                return;
            }

            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;

            const localSource = audioCtx.createMediaStreamSource(localStream);
            const remoteSource = audioCtx.createMediaStreamSource(remoteStream);
            const destination = audioCtx.createMediaStreamDestination();

            localSource.connect(destination);
            remoteSource.connect(destination);

            // Resume AudioContext if suspended (browser security policy)
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => {
                    console.log("AudioContext resumed successfully.");
                }).catch(err => {
                    console.error("Failed to resume AudioContext:", err);
                });
            }

            let mimeType = 'audio/webm';
            if (typeof MediaRecorder.isTypeSupported === 'function') {
                if (MediaRecorder.isTypeSupported('audio/webm')) {
                    mimeType = 'audio/webm';
                } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    mimeType = 'audio/mp4';
                } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                    mimeType = 'audio/ogg';
                } else {
                    mimeType = '';
                }
            }

            const options = mimeType ? { mimeType } : {};
            const recorder = new MediaRecorder(destination.stream, options);
            audioRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            recorder.start(1000); // chunk every 1s
            console.log("Voice call recording started with mimeType:", mimeType || 'default');
        } catch (err) {
            console.error("Failed to start voice call recording:", err);
        }
    };

    const uploadVoiceCallRecording = (duration) => {
        return new Promise((resolve) => {
            const recorder = audioRecorderRef.current;
            if (!recorder || recorder.state === 'inactive') {
                resolve();
                return;
            }

            recorder.onstop = async () => {
                const chunks = audioChunksRef.current;
                if (chunks.length === 0) {
                    resolve();
                    return;
                }

                const actualMimeType = recorder.mimeType || 'audio/webm';
                const extension = actualMimeType.includes('mp4') ? 'mp4' : actualMimeType.includes('ogg') ? 'ogg' : 'webm';
                const blob = new Blob(chunks, { type: actualMimeType });
                const formData = new FormData();
                formData.append('audio', blob, `voice_call_${id}_${Date.now()}.${extension}`);
                formData.append('durationSeconds', duration);
                formData.append('ticketId', id);

                try {
                    console.log("Uploading voice call recording...");
                    const { data } = await axios.post(`${backendUrl}/api/cs/upload-voice-call`, formData, {
                        headers: {
                            cstoken,
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    if (data.success) {
                        toast.success('Voice call recording saved successfully!');
                    } else {
                        console.error('Failed to save voice call recording:', data.message);
                    }
                } catch (err) {
                    console.error('Error uploading voice call recording:', err);
                }
                resolve();
            };

            try {
                recorder.stop();
            } catch (err) {
                console.warn('Error stopping voice recorder:', err);
                resolve();
            }
        });
    };

    // VoIP Signaling Logic (Agent is Caller/Initiator)
    const startWebRTCCaller = async (toSocketId) => {
        try {
            console.log("Setting up RTCPeerConnection as initiator/caller");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.onicecandidate = (event) => {
                if (event.candidate && socketRef.current) {
                    socketRef.current.emit('ticket-ice-candidate', {
                        ticketId: id,
                        candidate: event.candidate,
                        toSocketId
                    });
                }
            };

            pc.ontrack = (event) => {
                console.log("Remote track received:", event.track);
                let remoteStream = event.streams[0];
                if (!remoteStream) {
                    remoteStream = new MediaStream([event.track]);
                }
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStream;
                    remoteAudioRef.current.play().catch(e => console.warn("Failed to play remote audio:", e));
                }
                if (stream) {
                    startCallRecording(stream, remoteStream);
                }
            };

            peerConnectionRef.current = pc;

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socketRef.current.emit('ticket-offer', {
                ticketId: id,
                offer,
                toSocketId
            });

        } catch (err) {
            console.error("Failed to start WebRTC Caller:", err);
            toast.error("Microphone setup failed: " + err.message);
            endCall();
        }
    };

    const handleInitiateCall = () => {
        if (!socketRef.current) return;
        setCallState('calling');
        toast.info('Calling customer...');
        socketRef.current.emit('ticket-call-initiate', {
            ticketId: id,
            callerName: employee.name
        });
    };

    const endCall = async () => {
        if (socketRef.current) {
            socketRef.current.emit('ticket-call-end', { ticketId: id });
        }
        if (callState === 'connected' && callDurationRef.current > 0) {
            try {
                await uploadVoiceCallRecording(callDurationRef.current);
                await axios.post(`${backendUrl}/api/complaint/ticket/${id}/log-call`, {
                    event: 'call_ended',
                    message: `Voice call occurred. Duration: ${formatDuration(callDurationRef.current)}`
                }, { headers: { cstoken } });
            } catch (e) {
                console.error("Failed to log call duration", e);
            }
        }
        resetCallState();
    };

    const resetCallState = () => {
        setCallState('idle');
        setCustomerSocketId('');
        setIsMuted(false);

        if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
            try {
                audioRecorderRef.current.stop();
            } catch (e) { }
            audioRecorderRef.current = null;
        }

        if (audioContextRef.current) {
            try {
                audioContextRef.current.close();
            } catch (e) { }
            audioContextRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                toast.info(audioTrack.enabled ? 'Microphone unmuted' : 'Microphone muted');
            }
        }
    };

    const formatDuration = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // AI CS Helper Functions
    const fetchSuggestions = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/complaint/ticket/${id}/autocomplete-suggestions`, {
                headers: { cstoken }
            });
            if (data.success) {
                setSuggestions(data.suggestions || []);
            }
        } catch (e) {
            console.warn("Failed to fetch suggestions:", e.message);
        }
    };

    const handleGenerateVetSummary = async () => {
        setFetchingVetSummary(true);
        setShowVetSummaryModal(true);
        try {
            const { data } = await axios.get(`${backendUrl}/api/complaint/ticket/${id}/vet-handoff-summary`, {
                headers: { cstoken }
            });
            if (data.success) {
                setVetSummaryContent(data.summary);
            } else {
                setVetSummaryContent("Failed to generate summary: " + data.message);
            }
        } catch (error) {
            setVetSummaryContent("Error generating summary: " + error.message);
        } finally {
            setFetchingVetSummary(false);
        }
    };

    useEffect(() => {
        if (messages && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg.senderType === 'user') {
                if (lastMsg.sentimentAnalysis && (lastMsg.sentimentAnalysis.label === 'angry' || lastMsg.sentimentAnalysis.label === 'anxious')) {
                    setDeEscalationTip(lastMsg.sentimentAnalysis.deEscalationTip);
                } else {
                    setDeEscalationTip('');
                }
                fetchSuggestions();
            } else {
                setDeEscalationTip('');
            }
            throttledFetchSentiment();
        }
    }, [messages, throttledFetchSentiment]);

    // Chat actions
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim()) return;

        const text = newMessage;
        setNewMessage('');

        if (socketRef.current) {
            socketRef.current.emit('ticket-typing-stop', { ticketId: id });
        }

        // ── Monitoring hooks ──────────────────────────────────────────────
        if (socketRef.current && employee) {
            // 1. Language detection (server-side toxic keyword check)
            socketRef.current.emit('cs-agent-message-check', {
                employeeId: employee._id,
                employeeName: employee.name,
                ticketId: id,
                message: text
            });

            // 2. Script adherence scoring
            const score = calcScriptScore(text);
            if (score > 0) {
                setScriptScore(prev => prev === null ? score : Math.round((prev + score) / 2));
                socketRef.current.emit('cs-agent-script-score', {
                    employeeId: employee._id,
                    employeeName: employee.name,
                    ticketId: id,
                    score,
                    templateName: 'Standard CS Response Template'
                });
            }
        }
        // ─────────────────────────────────────────────────────────────────

        try {
            const { data } = await axios.post(`${backendUrl}/api/complaint/ticket/${id}/messages`, {
                message: text,
                messageType: 'text'
            }, { headers: { cstoken } });

            if (!data.success) {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };


    const handleFileUpload = async (file) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await axios.post(`${backendUrl}/api/complaint/ticket/${id}/upload-file`, formData, {
                headers: {
                    cstoken,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (!data.success) {
                toast.error(data.message);
            } else {
                toast.success('File shared successfully');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error("File size must be less than 10MB");
                return;
            }
            handleFileUpload(file);
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (!socketRef.current) return;
        socketRef.current.emit('ticket-typing-start', { ticketId: id });

        if (window.typingTimeout) clearTimeout(window.typingTimeout);
        window.typingTimeout = setTimeout(() => {
            if (socketRef.current) {
                socketRef.current.emit('ticket-typing-stop', { ticketId: id });
            }
        }, 2000);
    };

    // ── Copy-Paste Anomaly Detection ──────────────────────────────────────
    const PASTE_THRESHOLD = 300; // characters — flag anything above this
    const handlePasteAnomaly = async (e) => {
        const pasted = (e.clipboardData || window.clipboardData)?.getData('text') || '';
        if (!pasted || pasted.length < PASTE_THRESHOLD) return;

        const preview = pasted.substring(0, 120).replace(/\n/g, ' ');

        // Real-time socket alert
        if (socketRef.current && employee) {
            socketRef.current.emit('cs-agent-paste-anomaly', {
                employeeId: employee._id,
                employeeName: employee.name,
                ticketId: id,
                pastedLength: pasted.length,
                preview,
                pastedAt: new Date().toISOString()
            });
        }

        // Persist alert to DB
        try {
            await axios.post(`${backendUrl}/api/cs-admin/log-monitoring-alert`, {
                alertType: 'idle_alert',
                message: `Agent pasted ${pasted.length} characters in ticket #${id} — review for possible script/data misuse. Preview: "${preview}..."`,
                severity: pasted.length > 2000 ? 'high' : 'medium',
                metadata: { ticketId: id, subType: 'paste_anomaly', pastedLength: pasted.length, preview }
            }, { headers: { cstoken } });
        } catch (e) {
            console.warn('[Monitor] Paste anomaly log failed:', e.message);
        }
    };
    // ──────────────────────────────────────────────────────────────────────


    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, otherSideTyping]);

    // Timeline note submission
    const handleSubmitNote = async (e) => {
        e.preventDefault();
        if (!note.trim()) return;
        try {
            const { data } = await axios.post(`${backendUrl}/api/complaint/add-note/${id}`, { note }, {
                headers: { cstoken }
            });
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
                userId: ticket.userId?._id || ticket.userId,
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
                userId: ticket.userId?._id || ticket.userId,
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
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Audio tag for WebRTC stream */}
            <audio ref={remoteAudioRef} autoPlay />

            {/* Ticket header summary */}
            <div className="bg-white px-6 py-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{ticket.title}</h2>
                        <p className="text-xs text-slate-500 mt-1.5 uppercase tracking-wider">Category: {ticket.category.replace('_', ' ')}</p>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 uppercase tracking-wide">
                        {ticket.status.replace('_', ' ')}
                    </span>
                </div>
                <div className="mt-4 p-4 bg-slate-50 rounded-xl text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                    {ticket.description}
                </div>
            </div>

            {/* Admin Decision Instructions if present */}
            {adminReport && (
                <div className={`p-6 rounded-2xl border-2 animate-pulse-slow ${adminReport.status === 'resolved'
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
                        <div className="bg-white/60 p-4 rounded-xl border border-white">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Instruction for you:</p>
                            <p className="text-slate-800 font-bold text-sm leading-relaxed">
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

            {/* Co-Browsing control bar */}
            <div className="bg-white px-6 py-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Safe Co-Browsing Mode</h3>
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
                        <div className="text-xs text-slate-600 flex-1 leading-relaxed">
                            <p className="font-bold text-slate-700">Guide the user in real-time</p>
                            <p className="text-slate-500 mt-1">
                                Request a safe, read-only co-browsing connection to view the user's active page. Sensitive data like passwords will be automatically masked.
                            </p>
                        </div>
                        <button
                            onClick={handleRequestCoBrowse}
                            className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all hover:shadow-lg active:scale-95 whitespace-nowrap"
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
                                <p className="text-xs font-bold text-indigo-700">Awaiting Approval</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Prompt sent to customer's screen. Waiting for them to accept...</p>
                            </div>
                        </div>
                        <button
                            onClick={handleStopCoBrowse}
                            className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-350 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {coBrowseStatus === 'declined' && (
                    <div className="flex items-center justify-between bg-rose-50 p-4 rounded-xl border border-rose-100">
                        <div className="flex items-center gap-3 text-rose-850">
                            <span className="text-lg">❌</span>
                            <div>
                                <p className="text-xs font-bold text-rose-900">Request Declined</p>
                                <p className="text-[10px] text-rose-600 mt-0.5">The customer chose not to share their screen at this time.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRequestCoBrowse}
                            className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {coBrowseStatus === 'active' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-emerald-850 text-xs font-semibold gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span>📍</span>
                                <span>Customer Path: <strong className="text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200/50">{mirroredState?.path || '/'}</strong></span>
                                {isCustomerRouteProtected && (
                                    <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-wider animate-pulse border border-rose-200">
                                        🔒 Sensitive Route Protected
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                    onClick={handleStopCoBrowse}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-xs"
                                >
                                    End Session
                                </button>
                            </div>
                        </div>

                        {/* Interactive Guidance Bar / Consent Warning */}
                        <div className="flex flex-col md:flex-row items-center justify-between p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">🛡️</span>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Guidance Guardrails</h4>
                                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                        {allowAnnotations
                                            ? 'Interactive guidance tools granted by user consent.'
                                            : 'View-Only mode enforced. Customer disabled interactive pointer/draw controls.'}
                                    </p>
                                </div>
                            </div>

                            {allowAnnotations ? (
                                <div className="flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-300/45">
                                    <button
                                        onClick={() => { setCoBrowseMode('pointer'); }}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${coBrowseMode === 'pointer'
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                : 'text-slate-600 hover:bg-slate-300/50'
                                            }`}
                                    >
                                        Laser Pointer Mode
                                    </button>
                                    <button
                                        onClick={() => { setCoBrowseMode('draw'); }}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${coBrowseMode === 'draw'
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                : 'text-slate-600 hover:bg-slate-300/50'
                                            }`}
                                    >
                                        Live Draw Mode
                                    </button>
                                </div>
                            ) : (
                                <span className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-300/50">
                                    🔒 VIEW-ONLY ENFORCED
                                </span>
                            )}
                        </div>

                        {/* Customer Screen Viewport or Privacy Redaction Shield */}
                        {isCustomerRouteProtected ? (
                            <div className="flex flex-col items-center justify-center py-20 px-8 border-2 border-slate-200 rounded-xl bg-slate-50/50 shadow-inner">
                                <div className="text-6xl animate-pulse mb-4">🛡️</div>
                                <h4 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">Privacy Shield Active</h4>
                                <p className="text-xs text-slate-500 text-center max-w-sm mt-1 leading-relaxed">
                                    The customer has navigated to a sensitive route (checkout, settings, profile, wallet). DOM sharing is paused until they leave this area.
                                </p>
                            </div>
                        ) : mirroredState ? (
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
                                        onMouseMove={handleMirrorMouseMove}
                                        onMouseDown={handleMirrorMouseDown}
                                        onMouseUp={handleMirrorMouseUp}
                                        onMouseLeave={handleMirrorMouseUp}
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            cursor: !allowAnnotations ? 'not-allowed' : (coBrowseMode === 'draw' ? 'cell' : 'crosshair'),
                                            zIndex: 40,
                                            background: 'transparent'
                                        }}
                                    />

                                    {/* Local Agent Drawing canvas */}
                                    {allowAnnotations && (
                                        <canvas
                                            ref={agentCanvasRef}
                                            width={mirroredState?.width || 1024}
                                            height={mirroredState?.height || 768}
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                pointerEvents: 'none',
                                                zIndex: 42
                                            }}
                                        />
                                    )}

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
                                <p className="text-xs font-semibold text-slate-500">Connecting to stream...</p>
                                <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Waiting for customer's first frame payload</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Split Grid for Communication vs Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left Side: Timeline and Notes */}
                <div className="space-y-6">
                    {/* Live Customer Sentiment Tracker & Supervisor Escalation Card */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🎭</span>
                                <div>
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Customer Sentiment Gauge</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Real-time Stress & Escalation Tracker</p>
                                </div>
                            </div>
                            {fetchingSentiment && (
                                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 animate-pulse">
                                    <FaSpinner className="animate-spin" /> Analyzing...
                                </span>
                            )}
                        </div>

                        {/* Gauge Visual */}
                        <div className="space-y-4">
                            <div className="relative pt-2">
                                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-2">
                                    <span className="text-rose-500">Stressed (-1.0)</span>
                                    <span className="text-slate-400">Neutral (0.0)</span>
                                    <span className="text-emerald-500">Positive (+1.0)</span>
                                </div>
                                <div className="h-3.5 w-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 rounded-full relative shadow-inner">
                                    {/* Indicator Pin */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-2 border-slate-800 shadow-md flex items-center justify-center -ml-2.5 transition-all duration-500 ease-out"
                                        style={{ left: `${((sentimentData.sentimentScore + 1) / 2) * 100}%` }}
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Customer Disposition</span>
                                    <span className={`text-xs font-black uppercase tracking-wide flex items-center gap-1.5 mt-0.5 ${
                                        sentimentData.label === 'angry' ? 'text-rose-600 animate-pulse' :
                                        sentimentData.label === 'anxious' ? 'text-amber-600' :
                                        sentimentData.label === 'happy' ? 'text-emerald-600' : 'text-slate-600'
                                    }`}>
                                        {sentimentData.label === 'angry' ? '😠 Angry' :
                                         sentimentData.label === 'anxious' ? '😟 Anxious' :
                                         sentimentData.label === 'happy' ? '🙂 Positive' : '😐 Neutral'}
                                        <span className="text-[10px] text-slate-400 font-bold">({sentimentData.sentimentScore > 0 ? `+${sentimentData.sentimentScore.toFixed(2)}` : sentimentData.sentimentScore.toFixed(2)})</span>
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Recent Trend</span>
                                    <span className="text-xs font-black flex items-center justify-end gap-1 mt-0.5">
                                        {sentimentData.history.length < 2 ? (
                                            <span className="text-slate-500">Stable ➡️</span>
                                        ) : (() => {
                                            const scores = sentimentData.history.map(h => h.score);
                                            const first = scores[0];
                                            const last = scores[scores.length - 1];
                                            const diff = last - first;
                                            if (diff <= -0.25) return <span className="text-rose-600">Deteriorating 📉</span>;
                                            if (diff >= 0.25) return <span className="text-emerald-600">Improving 📈</span>;
                                            return <span className="text-slate-500">Stable ➡️</span>;
                                        })()}
                                    </span>
                                </div>
                            </div>

                            {/* Sentiment History Timeline */}
                            {sentimentData.history && sentimentData.history.length > 0 && (
                                <div className="space-y-1.5">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Real-time Sentiment Trend Line</span>
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar flex-wrap">
                                        {sentimentData.history.map((hist, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5 flex-shrink-0">
                                                <span className={`px-2 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                                    hist.label === 'angry' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                                    hist.label === 'anxious' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                    hist.label === 'happy' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                                    'bg-slate-50 border-slate-200 text-slate-700'
                                                }`}>
                                                    {hist.label === 'angry' ? '😠' :
                                                     hist.label === 'anxious' ? '😟' :
                                                     hist.label === 'happy' ? '🙂' : '😐'}
                                                    <span>{hist.score > 0 ? `+${hist.score.toFixed(1)}` : hist.score.toFixed(1)}</span>
                                                </span>
                                                {idx < sentimentData.history.length - 1 && (
                                                    <span className="text-slate-300 text-xs font-bold font-sans">→</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Supervisor Alert Gating Control */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                                {hasAutoEscalated || sentimentData.isCritical ? (
                                    <div className="flex-1 bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 animate-pulse">
                                        <span className="text-sm">🚨</span>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black text-rose-800 uppercase tracking-wider">Supervisor Alert Transmitted</p>
                                            <p className="text-[9px] text-rose-600 font-bold leading-normal">High-Stress event logged. Monitoring active.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => triggerSupervisorAlert(sentimentData.sentimentScore, sentimentData.label, false)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 hover:bg-rose-150 border border-rose-200 hover:border-rose-300 text-rose-700 font-black rounded-xl text-xs transition-all active:scale-95 shadow-sm"
                                    >
                                        <span>🚨</span> Call for Supervisor Assist
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Timeline logs */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 tracking-tight uppercase">Timeline Notes</h3>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {ticket.timeline && ticket.timeline.length > 0 ? (
                                [...ticket.timeline].reverse().map((note, index) => (
                                    <div key={index} className="flex gap-3 text-xs leading-relaxed border-b border-slate-50 pb-3">
                                        <div className="min-w-[80px] text-slate-400 font-bold">
                                            {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div>
                                            <span className="font-extrabold uppercase text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 mr-2 capitalize">
                                                {note.by}
                                            </span>
                                            <span className="text-slate-700">{note.message}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 text-center py-6 text-xs italic">No timeline notes yet.</p>
                            )}
                        </div>

                        {/* Add Timeline Note Form */}
                        {!isClosed && (
                            <form onSubmit={handleSubmitNote} className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                                <input
                                    type="text"
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Add custom timeline note..."
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 focus:bg-white focus:border-emerald-500 transition-colors"
                                />
                                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95">
                                    Add Note
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Right Side: Communication Hub (VoIP + Chat) & Administrative Actions */}
                <div className="space-y-6">

                    {/* VoIP calling widget */}
                    {!isClosed && (
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">VoIP Audio Calling</h3>

                            {callState === 'idle' && (
                                <button
                                    onClick={handleInitiateCall}
                                    className="w-full flex items-center justify-center gap-3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-500/25 active:scale-95 text-xs"
                                >
                                    <FaPhoneAlt />
                                    <span>Call Customer (Real-time VoIP)</span>
                                </button>
                            )}

                            {callState === 'calling' && (
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                            <FaPhoneAlt className="animate-bounce" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-blue-800">Calling Customer...</p>
                                            <p className="text-[10px] text-blue-500 mt-0.5">Waiting for answer</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={endCall}
                                        className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {callState === 'connected' && (
                                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white animate-pulse">
                                            <FaVolumeUp />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-emerald-800">Call Connected</p>
                                            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{formatDuration(callDuration)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={toggleMute}
                                            className={`p-2.5 rounded-xl border transition-all ${isMuted ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            {isMuted ? <FaMicrophoneSlash size={14} /> : <FaMicrophone size={14} />}
                                        </button>
                                        <button
                                            onClick={endCall}
                                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-200 active:scale-95"
                                        >
                                            End Call
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Support Chat thread widget */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-[400px] flex flex-col overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-xs tracking-tight">Active Customer Support Chat</h3>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={handleGenerateVetSummary}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-full text-[9px] font-black transition-all active:scale-95 shadow-sm"
                                    title="Generate Clinical Vet Handoff Synopsis using DeepSeek"
                                >
                                    <span>🩺 Vet Handoff</span>
                                </button>
                                {scriptScore !== null && (
                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${scriptScore >= 70 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                            scriptScore >= 40 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                'bg-rose-50 border-rose-200 text-rose-700'
                                        }`}>
                                        <span>📋</span>
                                        <span>Script {scriptScore}%</span>
                                    </div>
                                )}
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            </div>
                        </div>

                        {/* Message log */}
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20 custom-scrollbar">
                            {messages.length > 0 ? (
                                messages.map((msg, index) => {
                                    const isSelf = msg.senderType === 'cs_agent';
                                    return (
                                        <div key={index} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                            <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm border text-xs leading-normal ${isSelf
                                                    ? 'bg-slate-800 text-white border-slate-800 rounded-br-none'
                                                    : 'bg-white text-slate-800 border-slate-100 rounded-bl-none'
                                                }`}>
                                                <div className="flex justify-between items-center gap-4 mb-0.5">
                                                    <span className={`text-[9px] font-black uppercase tracking-wider ${isSelf ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                        {msg.senderName}
                                                    </span>
                                                    <span className="text-[8px] opacity-60">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {/* Text message */}
                                                {msg.messageType === 'text' && <p>{msg.message}</p>}

                                                {/* Image file */}
                                                {msg.messageType === 'image' && (
                                                    <div className="space-y-1.5 mt-1">
                                                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg bg-black/5 border border-black/5">
                                                            <img src={msg.fileUrl} alt={msg.fileName} className="max-w-full max-h-[140px] object-cover mx-auto" />
                                                        </a>
                                                        <p className="text-[10px] opacity-90">{msg.message}</p>
                                                    </div>
                                                )}

                                                {/* Generic file */}
                                                {msg.messageType === 'file' && (
                                                    <a
                                                        href={msg.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`flex items-center gap-2 mt-1.5 p-1.5 rounded-lg border font-bold text-[10px] transition-all hover:bg-black/5 ${isSelf ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'
                                                            }`}
                                                    >
                                                        <FaFileAlt size={14} className={isSelf ? 'text-slate-300' : 'text-slate-400'} />
                                                        <div className="text-left truncate max-w-[120px]">
                                                            <p className="truncate">{msg.fileName}</p>
                                                        </div>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                    <p className="text-slate-400 text-xs italic">No messages exchanged yet.</p>
                                </div>
                            )}

                            {otherSideTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-3.5 py-2 shadow-sm flex items-center gap-1">
                                        <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* De-escalation Alert */}
                        {deEscalationTip && (
                            <div className="mx-3 mt-2 mb-1 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 animate-pulse">
                                <span className="text-base">⚠️</span>
                                <div className="flex-1">
                                    <h4 className="text-[10px] font-black text-red-800 uppercase tracking-wider">AI Sentiment Escalation Warning</h4>
                                    <p className="text-[11px] text-red-700 font-bold mt-0.5 leading-relaxed">{deEscalationTip}</p>
                                </div>
                            </div>
                        )}

                        {/* Autocomplete Suggestions Chips */}
                        {!isClosed && suggestions && suggestions.length > 0 && (
                            <div className="px-3 pt-2 pb-1 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    ✨ NIM DeepSeek Response Suggestions:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {suggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setNewMessage(suggestion)}
                                            className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-slate-600 hover:text-indigo-700 rounded-lg text-[10px] font-bold text-left transition-all active:scale-95 shadow-sm truncate max-w-full"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input forms */}
                        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="image/*,.pdf,.doc,.docx,.txt"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading || isClosed}
                                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl transition-all border border-slate-100 disabled:opacity-40"
                            >
                                {uploading ? <FaSpinner className="animate-spin" /> : <FaPaperclip size={14} />}
                            </button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={handleTyping}
                                onPaste={handlePasteAnomaly}
                                disabled={isClosed}
                                placeholder={isClosed ? "Ticket closed" : "Write a response to customer..."}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs text-slate-700 placeholder-slate-400 disabled:bg-slate-100"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || isClosed}
                                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center transition-all disabled:opacity-40 disabled:shadow-none"
                            >
                                <FaPaperPlane size={12} />
                            </button>
                        </form>
                    </div>

                    {/* Schedule Call controls */}
                    {!isClosed && !ticket.scheduledCall?.date && (
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-xs font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 tracking-tight uppercase">Schedule External Meeting Link</h3>
                            <form onSubmit={handleScheduleCall} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="date" required value={callDate} onChange={e => setCallDate(e.target.value)}
                                        className="px-3 py-2 border border-slate-200 rounded-xl text-xs w-full bg-slate-50 outline-none focus:bg-white focus:border-purple-500" />
                                    <input type="time" required value={callTime} onChange={e => setCallTime(e.target.value)}
                                        className="px-3 py-2 border border-slate-200 rounded-xl text-xs w-full bg-slate-50 outline-none focus:bg-white focus:border-purple-500" />
                                </div>
                                <input type="url" required placeholder="Meeting Link (e.g., Google Meet URL)" value={callLink} onChange={e => setCallLink(e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs w-full bg-slate-50 outline-none focus:bg-white focus:border-purple-500" />
                                <button type="submit" className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-750 transition-all active:scale-95 shadow-md shadow-purple-200">
                                    Schedule & Send Email Notification
                                </button>
                            </form>
                        </div>
                    )}

                    {ticket.scheduledCall && ticket.scheduledCall.date && (
                        <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 text-purple-900">
                            <h3 className="font-bold text-xs uppercase tracking-wider mb-2">Scheduled Meeting:</h3>
                            <p className="text-xs font-bold">Date: {ticket.scheduledCall.date}</p>
                            <p className="text-xs font-bold mt-1">Time: {ticket.scheduledCall.time}</p>
                            <p className="text-xs mt-1 font-bold">
                                Link: <a href={ticket.scheduledCall.link} target="_blank" rel="noreferrer" className="underline text-purple-700">{ticket.scheduledCall.link}</a>
                            </p>
                        </div>
                    )}

                    {/* Granular CS Compensation & Loyalty Coupon Generator */}
                    {!isClosed && (
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🎟️</span>
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Granular CS Compensation</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loyalty Coupon & Dispute Resolution Generator</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                    employee?.rank === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                                    employee?.rank === 'Gold' ? 'bg-amber-100 text-amber-700' :
                                    employee?.rank === 'Silver' ? 'bg-slate-200 text-slate-700' :
                                    'bg-orange-100 text-orange-700'
                                }`}>
                                    Level {employee?.level || 1} • {employee?.rank || 'Bronze'}
                                </span>
                            </div>

                            {/* Authority gauge & limits */}
                            <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
                                <div className="flex justify-between font-bold text-slate-500 mb-1">
                                    <span>Your Authorization Limit:</span>
                                    <span className="text-slate-850 font-black">₹{getAgentLimit()}</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min((getAgentLimit() / 1500) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1.5 tracking-wider">
                                    Limits: L1: ₹300 | L2: ₹500 | L3: ₹800 | L4: ₹1200 | L5+: ₹1500
                                </p>
                            </div>

                            <form onSubmit={handleGenerateCoupon} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Type</label>
                                        <select
                                            value={couponType}
                                            onChange={e => setCouponType(e.target.value)}
                                            className="w-full border-slate-200 rounded-xl text-xs px-2.5 py-2 bg-slate-50 border outline-none focus:bg-white focus:border-indigo-500"
                                        >
                                            <option value="refund">Booking Refund</option>
                                            <option value="gifted">Loyalty Gift</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Discount Unit</label>
                                        <select
                                            value={discountType}
                                            onChange={e => setDiscountType(e.target.value)}
                                            className="w-full border-slate-200 rounded-xl text-xs px-2.5 py-2 bg-slate-50 border outline-none focus:bg-white focus:border-indigo-500"
                                        >
                                            <option value="fixed">Flat (₹)</option>
                                            <option value="percentage">Percentage (%)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                            {discountType === 'fixed' ? 'Refund Amount (₹)' : 'Percentage Value (%)'}
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={discountValue}
                                            onChange={e => setDiscountValue(e.target.value)}
                                            placeholder={discountType === 'fixed' ? 'e.g. 200' : 'e.g. 20'}
                                            className="w-full border-slate-200 rounded-xl text-xs px-2.5 py-2 bg-slate-50 border outline-none focus:bg-white focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                            Max Cap (₹) {discountType === 'fixed' && <span className="text-[8px] text-slate-400 font-normal">(N/A)</span>}
                                        </label>
                                        <input
                                            type="number"
                                            disabled={discountType === 'fixed'}
                                            value={maxDiscount}
                                            onChange={e => setMaxDiscount(e.target.value)}
                                            placeholder="e.g. 500"
                                            className="w-full border-slate-200 rounded-xl text-xs px-2.5 py-2 bg-slate-50 border outline-none focus:bg-white focus:border-indigo-500 disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Reason for Issuance</label>
                                    <select
                                        value={couponReason}
                                        onChange={e => setCouponReason(e.target.value)}
                                        className="w-full border-slate-200 rounded-xl text-xs px-2.5 py-2 bg-slate-50 border outline-none focus:bg-white focus:border-indigo-500 mb-2"
                                    >
                                        <option value="doctor_missed_call">Doctor missed scheduled video call</option>
                                        <option value="app_glitch">App glitch during payment/consultation</option>
                                        <option value="customer_dissatisfaction">Customer dissatisfied with vet advice</option>
                                        <option value="loyalty_outreach">Loyalty outreach & customer retention</option>
                                        <option value="other">Other (specify custom reason)</option>
                                    </select>
                                    {couponReason === 'other' && (
                                        <input
                                            type="text"
                                            required
                                            value={customReason}
                                            onChange={e => setCustomReason(e.target.value)}
                                            placeholder="Describe specific reason..."
                                            className="w-full border-slate-200 rounded-xl text-xs px-2.5 py-2 bg-slate-50 border outline-none focus:bg-white focus:border-indigo-500 animate-in slide-in-from-top-1 duration-150"
                                        />
                                    )}
                                </div>

                                {/* Dynamic Threshold Check & Live Warnings */}
                                {(() => {
                                    const val = Number(discountValue) || 0;
                                    const maxVal = discountType === 'percentage' ? (Number(maxDiscount) || Math.round((val / 100) * 500)) : val;
                                    const isExceeded = maxVal > getAgentLimit();

                                    return (
                                        <>
                                            {isExceeded && (
                                                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-rose-800 text-[10px] font-bold flex items-center gap-1.5 animate-pulse">
                                                    <span>⚠️</span>
                                                    <span>
                                                        Requested amount (₹{maxVal}) exceeds your authorization limit (₹{getAgentLimit()})!
                                                    </span>
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={generatingCoupon || isExceeded}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none hover:shadow-md hover:shadow-indigo-200"
                                            >
                                                {generatingCoupon ? (
                                                    <>
                                                        <FaSpinner className="animate-spin" /> Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>🎟️</span> Generate & Issue Coupon
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    );
                                })()}
                            </form>

                            {/* Issued Coupon History / Receipt Log */}
                            {generatedCoupons.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Issued Coupons for this ticket ({generatedCoupons.length})</h4>
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                        {generatedCoupons.map((coupon, idx) => (
                                            <div key={idx} className="bg-slate-50 border border-slate-200/60 p-2 rounded-xl text-[10px] flex justify-between items-center gap-2">
                                                <div>
                                                    <span className="font-mono font-black text-slate-800 uppercase tracking-wide block">{coupon.code}</span>
                                                    <span className="text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                                                        {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : '₹'} off • {coupon.compensationType === 'gifted' ? 'Gift' : 'Refund'}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                                        coupon.isActive && new Date(coupon.expiryDate) > new Date()
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-slate-200 text-slate-500'
                                                    }`}>
                                                        {coupon.isActive && new Date(coupon.expiryDate) > new Date() ? 'Active' : 'Expired/Used'}
                                                    </span>
                                                    <span className="text-slate-400 font-bold block mt-1 text-[8px]">
                                                        Exp: {new Date(coupon.expiryDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Standard Administrative Actions */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center gap-4">
                        {isClosed ? (
                            <div className="text-green-600 font-bold text-center w-full">
                                <p className="text-sm">🎫 This ticket is marked as resolved and closed.</p>
                                {ticket.rating && (
                                    <div className="mt-2 text-slate-600 font-normal">
                                        <p className="text-xs font-semibold">User Rating: {ticket.rating.rating} / 5 ⭐</p>
                                        {ticket.rating.review && <p className="text-[10px] italic mt-1">"{ticket.rating.review}"</p>}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button onClick={handleCloseTicket} className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-md shadow-green-200 text-xs active:scale-95">
                                Mark as Resolved & Close Ticket
                            </button>
                        )}

                        <div className="grid grid-cols-2 gap-3 w-full border-t border-slate-100 pt-3">
                            <button onClick={() => setShowBanModal(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1">
                                🚫 Ban User Account
                            </button>
                            <button onClick={() => setShowReportModal(true)} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1">
                                ⚠️ Report Misbehavior
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ban Modal */}
            {showBanModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Ban User Account</h3>
                            <button onClick={() => setShowBanModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleBanUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ban Duration</label>
                                <select value={banDuration} onChange={e => setBanDuration(e.target.value)}
                                    className="w-full border-slate-200 rounded-xl focus:ring-red-500 focus:border-red-500 text-xs p-3 bg-slate-50 border">
                                    <option value="1h">1 Hour</option>
                                    <option value="24h">24 Hours</option>
                                    <option value="7d">7 Days</option>
                                    <option value="30d">30 Days</option>
                                    <option value="permanent">Permanent</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason for Ban</label>
                                <textarea required value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="e.g., Abusive language with agent"
                                    className="w-full border-slate-200 rounded-xl focus:ring-red-500 focus:border-red-500 text-xs p-3 bg-slate-50 border h-24 outline-none"></textarea>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowBanModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200">Confirm Ban</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Forward to Admin</h3>
                            <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleReportMisbehavior} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Detailed Reason</label>
                                <textarea required value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Explain the misbehavior..."
                                    className="w-full border-slate-200 rounded-xl focus:ring-orange-500 focus:border-orange-500 text-xs p-3 bg-slate-50 border h-24 outline-none"></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Evidence / Notes</label>
                                <textarea value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="Chat snippets or relevant info..."
                                    className="w-full border-slate-200 rounded-xl focus:ring-orange-500 focus:border-orange-500 text-xs p-3 bg-slate-50 border h-24 outline-none"></textarea>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200">Forward Complaint</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Vet Summary Modal */}
            {showVetSummaryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🩺</span>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight font-serif">Clinical Escalation Case Synopsis</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Automated Handoff Briefing</p>
                                </div>
                            </div>
                            <button onClick={() => setShowVetSummaryModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed custom-scrollbar">
                            {fetchingVetSummary ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="font-bold text-slate-500 text-xs">DeepSeek NIM is analyzing conversation clinical features...</p>
                                </div>
                            ) : (
                                vetSummaryContent
                            )}
                        </div>
                        <div className="flex gap-3 pt-4 border-t mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(vetSummaryContent);
                                    toast.success("Synopsis copied to clipboard!");
                                }}
                                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                            >
                                📋 Copy Synopsis
                            </button>
                            <button type="button" onClick={() => setShowVetSummaryModal(false)} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketDetail;
