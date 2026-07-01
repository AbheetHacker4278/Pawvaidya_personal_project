import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    FaCheckCircle, 
    FaClock, 
    FaPhoneAlt, 
    FaStar, 
    FaInfoCircle, 
    FaPhoneSlash, 
    FaMicrophone, 
    FaMicrophoneSlash, 
    FaPaperclip, 
    FaPaperPlane, 
    FaFileAlt, 
    FaSpinner, 
    FaTimes 
} from 'react-icons/fa';
import io from 'socket.io-client';

const TicketTracking = () => {
    const id = useParams().id;
    const { token, backendUrl, systemConfig } = useContext(AppContext);
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Socket Ref
    const socketRef = useRef(null);

    // Chat States
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherSideTyping, setOtherSideTyping] = useState(false);
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);

    // WebRTC & Call States
    const [callState, setCallState] = useState('idle'); // idle, incoming, connected
    const [callerName, setCallerName] = useState('');
    const [callSocketId, setCallSocketId] = useState('');
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    // WebRTC Refs
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const durationIntervalRef = useRef(null);

    const handleCloseTicket = async () => {
        if (!window.confirm("Are you sure you want to close this ticket?")) return;
        try {
            const { data } = await axios.put(`${backendUrl}/api/complaint/user-close/${id}`, {}, {
                headers: { token }
            });
            if (data.success) {
                toast.success('Ticket closed successfully');
                fetchTicket();
            } else toast.error(data.message);
        } catch (error) { toast.error(error.message); }
    };

    const fetchTicket = async () => {
        if (systemConfig?.maintenanceMode || systemConfig?.killSwitch) return;
        try {
            const { data } = await axios.get(`${backendUrl}/api/complaint/ticket/${id}`, {
                headers: { token }
            });
            if (data.success) {
                setTicket(data.ticket);
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
            navigate('/support?tab=history');
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async () => {
        if (systemConfig?.maintenanceMode || systemConfig?.killSwitch) return;
        try {
            const { data } = await axios.get(`${backendUrl}/api/complaint/ticket/${id}/messages`, {
                headers: { token }
            });
            if (data.success) {
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    };

    // Chat scroll helper
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, otherSideTyping]);

    // Timer for active call duration
    useEffect(() => {
        if (callState === 'connected') {
            setCallDuration(0);
            durationIntervalRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
            setCallDuration(0);
        }
        return () => {
            if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        };
    }, [callState]);

    // Main socket & fetching orchestrator
    useEffect(() => {
        if (!token || !backendUrl) return;
        fetchTicket();
        loadMessages();

        const socket = io(backendUrl, {
            withCredentials: true,
            transports: ['polling', 'websocket']
        });
        socketRef.current = socket;

        socket.emit('join-room', `ticket-${id}`);

        socket.on('ticket-closed', (data) => {
            toast.info('This ticket has been marked as resolved/closed.');
            fetchTicket();
        });

        socket.on('ticket-updated', () => {
            fetchTicket();
        });

        // Chat Socket listeners
        socket.on('receive-ticket-message', (msg) => {
            setMessages(prev => {
                if (prev.some(m => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        });

        socket.on('ticket-typing-start', () => {
            setOtherSideTyping(true);
        });

        socket.on('ticket-typing-stop', () => {
            setOtherSideTyping(false);
        });

        // WebRTC Signaling listeners
        socket.on('incoming-ticket-call', (data) => {
            console.log('Incoming ticket call:', data);
            setCallerName(data.callerName);
            setCallSocketId(data.fromSocketId);
            setCallState('incoming');
        });

        socket.on('ticket-call-ended', () => {
            toast.info('Voice call ended by customer support agent.');
            resetCallState();
        });

        socket.on('ticket-offer', async (data) => {
            console.log('Received WebRTC offer:', data);
            await setupWebRTCAnswer(data.offer, data.fromSocketId);
        });

        socket.on('ticket-ice-candidate', async (data) => {
            console.log('Received WebRTC ICE candidate:', data);
            if (peerConnectionRef.current) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    console.error('Error adding ICE candidate:', e);
                }
            }
        });

        const intv = setInterval(fetchTicket, 15000);

        return () => {
            socket.emit('leave-room', `ticket-${id}`);
            socket.off('ticket-closed');
            socket.off('ticket-updated');
            socket.off('receive-ticket-message');
            socket.off('ticket-typing-start');
            socket.off('ticket-typing-stop');
            socket.off('incoming-ticket-call');
            socket.off('ticket-call-ended');
            socket.off('ticket-offer');
            socket.off('ticket-ice-candidate');
            socket.disconnect();
            clearInterval(intv);
            resetCallState();
        };
    }, [id, token, backendUrl]);

    // WebRTC Core Signaling Logic (User side is Answerer)
    const setupWebRTCAnswer = async (offer, fromSocketId) => {
        try {
            console.log("Setting up RTCPeerConnection as answerer");
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
                        toSocketId: fromSocketId
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
            };

            peerConnectionRef.current = pc;

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketRef.current.emit('ticket-answer', {
                ticketId: id,
                answer,
                toSocketId: fromSocketId
            });

        } catch (err) {
            console.error("Failed to setup WebRTC Answer:", err);
            toast.error("Microphone setup failed: " + err.message);
            endCall();
        }
    };

    const handleAcceptCall = async () => {
        setCallState('connected');
        if (socketRef.current && callSocketId) {
            socketRef.current.emit('ticket-call-accept', {
                ticketId: id,
                toSocketId: callSocketId
            });
        }
    };

    const handleDeclineCall = () => {
        if (socketRef.current && callSocketId) {
            socketRef.current.emit('ticket-call-decline', {
                ticketId: id,
                toSocketId: callSocketId
            });
        }
        resetCallState();
    };

    const endCall = async () => {
        if (socketRef.current) {
            socketRef.current.emit('ticket-call-end', { ticketId: id });
        }
        if (callState === 'connected' && callDuration > 0) {
            try {
                await axios.post(`${backendUrl}/api/complaint/ticket/${id}/log-call`, {
                    event: 'call_ended',
                    message: `Voice call occurred. Duration: ${formatDuration(callDuration)}`
                }, { headers: { token } });
            } catch (e) {
                console.error("Failed to log call duration", e);
            }
        }
        resetCallState();
    };

    const resetCallState = () => {
        setCallState('idle');
        setCallerName('');
        setCallSocketId('');
        setIsMuted(false);

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

    // Chat handlers
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim()) return;

        const text = newMessage;
        setNewMessage('');

        if (socketRef.current) {
            socketRef.current.emit('ticket-typing-stop', { ticketId: id });
        }

        try {
            const { data } = await axios.post(`${backendUrl}/api/complaint/ticket/${id}/messages`, {
                message: text,
                messageType: 'text'
            }, { headers: { token } });

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
                    token,
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

    if (loading || !ticket) return <div className="p-12 text-center text-gray-500">Loading ticket details...</div>;

    const isClosed = ticket.isClosed || ticket.status === 'closed' || ticket.status === 'resolved';
    const timelineReversed = [...ticket.timeline].reverse();

    const getStatusIcon = (status) => {
        if (status === 'closed' || status === 'resolved') return <FaCheckCircle className="text-green-500" />;
        if (status === 'scheduled_call') return <FaPhoneAlt className="text-purple-500" />;
        if (status === 'in_progress') return <FaClock className="text-blue-500" />;
        return <FaInfoCircle className="text-red-500" />;
    };

    const isMeetActive = (dateStr, timeStr) => {
        if (!dateStr || !timeStr) return false;
        try {
            const [year, month, day] = dateStr.split('-').map(Number);
            const [hours, minutes] = timeStr.split(':').map(Number);
            const meetingTime = new Date(year, month - 1, day, hours, minutes);
            const now = new Date();
            const timeDiffMinutes = (meetingTime - now) / (1000 * 60);
            return timeDiffMinutes <= 5;
        } catch (e) { return false; }
    };

    return (
        <div className="max-w-7xl mx-auto my-6 px-4 sm:px-6 space-y-6">
            {/* Audio tag for WebRTC stream */}
            <audio ref={remoteAudioRef} autoPlay />

            {/* Incoming Call Dialog/Overlay */}
            {callState === 'incoming' && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[9999] animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 flex flex-col items-center">
                        <div className="relative mb-6">
                            <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping duration-1000" />
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white text-3xl shadow-lg shadow-emerald-500/40">
                                <FaPhoneAlt />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Incoming Audio Call</h3>
                        <p className="text-slate-500 text-sm mt-2 font-medium">Customer support agent is calling</p>
                        <p className="text-emerald-600 font-extrabold text-base mt-1">{callerName}</p>
                        
                        <div className="flex gap-4 mt-8 w-full">
                            <button 
                                onClick={handleDeclineCall}
                                className="flex-1 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-2xl border border-rose-100 transition-all hover:shadow-lg active:scale-95"
                            >
                                Decline
                            </button>
                            <button 
                                onClick={handleAcceptCall}
                                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl active:scale-95"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Connected Call Banner */}
            {callState === 'connected' && (
                <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl flex items-center justify-between shadow-xl shadow-emerald-500/20 border border-emerald-500 animate-in slide-in-from-top-6 duration-300">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center animate-pulse">
                            <FaPhoneAlt />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-100 tracking-wide uppercase">Active Call with CS Agent</p>
                            <p className="text-sm font-black mt-0.5">{callerName || 'CS Agent'} • {formatDuration(callDuration)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={toggleMute}
                            className={`p-3 rounded-xl transition-all active:scale-95 ${isMuted ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/20' : 'bg-white/15 hover:bg-white/20'}`}
                            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                        >
                            {isMuted ? <FaMicrophoneSlash size={16} /> : <FaMicrophone size={16} />}
                        </button>
                        <button 
                            onClick={endCall}
                            className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-rose-500/35 transition-all active:scale-95"
                        >
                            <FaPhoneSlash />
                            <span className="hidden sm:inline">End Call</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Page Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side (2/3 space): Ticket details & Chat */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Details card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{ticket.title}</h1>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Category: {ticket.category.replace('_', ' ')}</p>
                            </div>
                            <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
                                {getStatusIcon(ticket.status)}
                                <span className="font-bold text-slate-700 capitalize text-xs tracking-wide">{ticket.status.replace('_', ' ')}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-2xl mt-4 text-slate-600 text-sm leading-relaxed border border-slate-100 min-h-[100px] whitespace-pre-wrap">
                            {ticket.description}
                        </div>
                    </div>

                    {/* Support Chat Thread Component */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-[500px] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-sm">
                                    💬
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-sm tracking-tight">Ticket Communication Hub</h3>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Real-time connection active</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages panel */}
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 custom-scrollbar">
                            {messages.length > 0 ? (
                                messages.map((msg, index) => {
                                    const isSelf = msg.senderType === 'user';
                                    return (
                                        <div key={index} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                            <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm border ${
                                                isSelf 
                                                    ? 'bg-emerald-600 text-white border-emerald-500 rounded-br-none' 
                                                    : 'bg-white text-slate-800 border-slate-100 rounded-bl-none'
                                            }`}>
                                                <div className="flex items-center justify-between gap-4 mb-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider ${isSelf ? 'text-emerald-100' : 'text-emerald-600'}`}>
                                                        {msg.senderName}
                                                    </span>
                                                    <span className={`text-[9px] font-medium opacity-60`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {/* Text message */}
                                                {msg.messageType === 'text' && (
                                                    <p className="text-sm leading-relaxed">{msg.message}</p>
                                                )}

                                                {/* Image File */}
                                                {msg.messageType === 'image' && (
                                                    <div className="space-y-2 mt-1">
                                                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-black/5 bg-black/5 hover:opacity-95 transition-opacity">
                                                            <img src={msg.fileUrl} alt={msg.fileName} className="max-w-full max-h-[160px] object-cover mx-auto" />
                                                        </a>
                                                        <p className="text-xs leading-normal opacity-90">{msg.message}</p>
                                                    </div>
                                                )}

                                                {/* Generic File */}
                                                {msg.messageType === 'file' && (
                                                    <a 
                                                        href={msg.fileUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className={`flex items-center gap-3 mt-1.5 p-2 rounded-xl border text-xs font-bold transition-all hover:bg-black/5 ${
                                                            isSelf ? 'bg-emerald-700/50 border-emerald-500/30' : 'bg-slate-50 border-slate-100'
                                                        }`}
                                                    >
                                                        <FaFileAlt className={isSelf ? 'text-emerald-200' : 'text-slate-400'} size={18} />
                                                        <div className="text-left truncate max-w-[150px]">
                                                            <p className="truncate">{msg.fileName}</p>
                                                            <p className="text-[9px] opacity-70">{(msg.fileSize / 1024).toFixed(1)} KB</p>
                                                        </div>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <span className="text-4xl">💬</span>
                                    <p className="text-slate-500 font-bold mt-4 text-sm">No messages yet</p>
                                    <p className="text-slate-400 text-xs mt-1">Submit a message below to start communicating with support.</p>
                                </div>
                            )}

                            {/* Typing Indicator */}
                            {otherSideTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input tools */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex gap-3">
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
                                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl transition-all border border-slate-100 disabled:opacity-40"
                                title="Upload file attachment"
                            >
                                {uploading ? <FaSpinner className="animate-spin" /> : <FaPaperclip />}
                            </button>
                            <input 
                                type="text"
                                value={newMessage}
                                onChange={handleTyping}
                                disabled={isClosed}
                                placeholder={isClosed ? "This ticket is closed" : "Type your message to support agent..."}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 focus:border-emerald-500 rounded-xl outline-none text-sm text-slate-700 placeholder-slate-400 transition-colors disabled:bg-slate-100"
                            />
                            <button 
                                type="submit"
                                disabled={!newMessage.trim() || isClosed}
                                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:shadow-none"
                            >
                                <FaPaperPlane />
                                <span className="hidden sm:inline">Send</span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right side (1/3 space): Agent info & Timeline */}
                <div className="space-y-6">
                    {/* Agent details */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-500/10 bg-emerald-50/10">
                        <h3 className="font-black text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2 tracking-tight uppercase">Assigned Agent</h3>
                        {ticket.assignedTo ? (
                            <div className="flex items-center space-x-4">
                                <img 
                                    src={ticket.assignedTo.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.assignedTo.name)}&background=10b981&color=fff`} 
                                    alt="Agent" 
                                    className="w-12 h-12 rounded-xl border border-slate-100 object-cover ring-4 ring-emerald-50/50 shadow-sm" 
                                />
                                <div>
                                    <p className="font-black text-slate-800 text-sm">{ticket.assignedTo.name}</p>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Support Specialist</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Assigning Agent</p>
                                <p className="text-[10px] text-slate-400 leading-normal mt-1">We are matching a support agent for you.</p>
                            </div>
                        )}
                    </div>

                    {/* Scheduled Call Info */}
                    {ticket.scheduledCall?.date && !isClosed && (
                        <div className="bg-purple-50 p-5 rounded-2xl shadow-sm border border-purple-100">
                            <div className="flex items-center text-purple-700 font-bold text-sm mb-2">
                                <FaPhoneAlt className="mr-2" /> Call Scheduled
                            </div>
                            <p className="text-xs text-purple-900 mb-1">Our agent will call you on:</p>
                            <p className="text-sm font-black text-purple-800 bg-white px-3 py-2 rounded-xl border border-purple-100 mt-2">
                                {ticket.scheduledCall.date} at {ticket.scheduledCall.time}
                            </p>

                            {ticket.scheduledCall.link && (
                                <div className="mt-4">
                                    {isMeetActive(ticket.scheduledCall.date, ticket.scheduledCall.time) ? (
                                        <a
                                            href={ticket.scheduledCall.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-purple-500/25 active:scale-95"
                                        >
                                            Join Meeting Now
                                        </a>
                                    ) : (
                                        <button
                                            disabled
                                            className="inline-flex items-center justify-center w-full bg-slate-100 text-slate-400 font-bold py-2.5 rounded-xl cursor-not-allowed border border-slate-200 text-xs"
                                        >
                                            Link Locked (Available 5m before)
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Timeline card */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-black text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2 tracking-tight uppercase">Status Timeline</h3>
                        <div className="relative border-l-2 border-emerald-500/20 ml-2 space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {timelineReversed.map((note, idx) => (
                                <div key={idx} className="relative pl-6">
                                    <span className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                                        idx === 0 
                                            ? 'bg-emerald-500 scale-110 shadow-md shadow-emerald-500/30' 
                                            : 'bg-slate-300'
                                    }`} />
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-1">
                                        {new Date(note.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="text-xs text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 leading-relaxed">
                                        {note.message}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions and back buttons */}
                    <div className="space-y-3">
                        {isClosed && !ticket.isRated && (
                            <div className="bg-yellow-50 p-5 rounded-2xl shadow-sm border border-yellow-200 text-center">
                                <div className="text-yellow-500 flex justify-center mb-2"><FaStar size={24} /></div>
                                <p className="text-xs text-yellow-800 font-bold mb-3">Ticket Closed! How did we do?</p>
                                <button
                                    onClick={() => navigate(`/rate-cs/${ticket._id}`)}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2.5 w-full rounded-xl transition-all shadow-md shadow-yellow-500/20 active:scale-95"
                                >
                                    Rate Support Agent
                                </button>
                            </div>
                        )}

                        {!isClosed && (
                            <button
                                onClick={handleCloseTicket}
                                disabled={ticket.scheduledCall?.date && !isMeetActive(ticket.scheduledCall.date, ticket.scheduledCall.time)}
                                className={`w-full py-2.5 font-bold rounded-xl border transition-all text-xs active:scale-95 ${
                                    ticket.scheduledCall?.date && !isMeetActive(ticket.scheduledCall.date, ticket.scheduledCall.time)
                                        ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                                        : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-100 shadow-sm'
                                }`}
                            >
                                {ticket.scheduledCall?.date && !isMeetActive(ticket.scheduledCall.date, ticket.scheduledCall.time)
                                    ? 'Close Ticket (Locked until call)'
                                    : 'Mark Ticket as Resolved'}
                            </button>
                        )}

                        <button
                            onClick={() => navigate('/support?tab=history')}
                            className="w-full py-2.5 border border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs active:scale-95"
                        >
                            ← Back to Tickets List
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketTracking;
