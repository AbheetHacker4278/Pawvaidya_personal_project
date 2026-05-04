import React, { useState, useEffect, useContext, useRef } from 'react';
import { CSContext } from '../context/CSContext';
import { FaPaperPlane, FaUserShield, FaSmile, FaImage, FaEllipsisV, FaLock, FaCommentAlt, FaFileAlt } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

const AdminChat = () => {
    const { employee, backendUrl, cstoken } = useContext(CSContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [adminId, setAdminId] = useState(null);
    const [socket, setSocket] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const commonEmojis = ['😊', '😂', '👍', '🙏', '❤️', '🔥', '✨', '✅', '❌', '👋', '🙌', '🐱', '🐶'];

    // Initialize Socket
    useEffect(() => {
        const newSocket = io(backendUrl, {
            withCredentials: true,
            transports: ['polling', 'websocket']
        });
        setSocket(newSocket);

        if (employee?._id) {
            newSocket.emit('join-direct-chat', employee._id);
        }

        return () => newSocket.disconnect();
    }, [backendUrl, employee?._id]);

    // Fetch Admin ID and History
    useEffect(() => {
        const initChat = async () => {
            try {
                // 1. Get Admin ID
                const idRes = await axios.get(`${backendUrl}/api/chat/direct/get-admin-id`);
                if (idRes.data.success) {
                    const aId = idRes.data.adminId;
                    setAdminId(aId);

                    // 2. Fetch History
                    const historyRes = await axios.get(`${backendUrl}/api/chat/direct/history/${employee._id}/${aId}`, {
                        headers: { cstoken }
                    });
                    if (historyRes.data.success) {
                        setMessages(historyRes.data.messages);
                        scrollToBottom();
                    }
                }
            } catch (err) {
                console.error('Chat init error:', err);
            }
        };

        if (employee?._id && backendUrl) {
            initChat();
        }
    }, [employee?._id, backendUrl, cstoken]);

    // Listen for new messages
    useEffect(() => {
        if (!socket || !adminId) return;

        socket.on('receive-direct-message', (message) => {
            if (message.senderId.toString() === adminId.toString() || 
                message.receiverId.toString() === adminId.toString()) {
                setMessages(prev => {
                    const exists = prev.some(m => m._id === message._id);
                    if (exists) return prev;
                    return [...prev, message];
                });
                scrollToBottom();
            }
        });

        return () => socket.off('receive-direct-message');
    }, [socket, adminId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !adminId) return;

        const messageData = {
            senderId: employee._id,
            senderModel: 'CS_Employee',
            receiverId: adminId,
            receiverModel: 'Admin',
            message: input,
        };

        try {
            const { data } = await axios.post(`${backendUrl}/api/chat/direct/send`, messageData, {
                headers: { cstoken }
            });
            if (data.success) {
                setMessages(prev => [...prev, data.data]);
                setInput('');
                scrollToBottom();
            }
        } catch (err) {
            toast.error('Failed to send message');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !adminId) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File too large (Max 10MB)");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('senderId', employee._id);
        formData.append('senderModel', 'CS_Employee');
        formData.append('receiverId', adminId);
        formData.append('receiverModel', 'Admin');
        formData.append('message', '');

        try {
            const { data } = await axios.post(`${backendUrl}/api/chat/direct/upload-file`, formData, {
                headers: { cstoken, 'Content-Type': 'multipart/form-data' }
            });
            if (data.success) {
                setMessages((prev) => [...prev, data.data]);
                scrollToBottom();
            }
        } catch (error) {
            toast.error("File upload failed");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleEmojiClick = (emoji) => {
        setInput(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Chat Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-800">
                            <FaUserShield className="text-white text-xl" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-800 animate-pulse"></div>
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg tracking-tight">System Administrator</h2>
                        <div className="flex items-center space-x-1.5">
                            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Live Support</span>
                            <span className="text-slate-500 text-[10px]">•</span>
                            <span className="text-slate-400 text-[10px] flex items-center"><FaLock className="mr-1 text-[8px]" /> Secure Line</span>
                        </div>
                    </div>
                </div>
                <button className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800">
                    <FaEllipsisV />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <FaCommentAlt size={40} className="mb-3 text-slate-300" />
                        <p className="text-sm font-medium text-slate-500">No message history with Admin</p>
                        <p className="text-[10px] uppercase tracking-widest mt-1">Start a conversation below</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div 
                        key={msg._id || idx} 
                        className={`flex ${msg.senderModel === 'CS_Employee' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                        <div className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${msg.senderModel === 'CS_Employee' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-5 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                msg.senderModel === 'CS_Employee' 
                                ? 'bg-primary text-white rounded-tr-none' 
                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                            }`}>
                                {msg.fileUrl && (
                                    <div className="mb-2">
                                        {msg.fileType === 'image' ? (
                                            <img src={msg.fileUrl} alt="attachment" className="rounded-xl max-w-full cursor-pointer hover:opacity-90" onClick={() => window.open(msg.fileUrl, '_blank')} />
                                        ) : msg.fileType === 'video' ? (
                                            <video src={msg.fileUrl} controls className="rounded-xl max-w-full" />
                                        ) : (
                                            <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                                                <FaFileAlt size={16} /> {msg.fileName || 'Download'}
                                            </a>
                                        )}
                                    </div>
                                )}
                                {msg.message && <p className="font-medium whitespace-pre-wrap">{msg.message}</p>}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1.5 font-medium px-1 uppercase tracking-tighter">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-4 border-t border-slate-100 relative">
                {showEmojiPicker && (
                    <div className="absolute bottom-24 left-6 bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 flex gap-2 z-20">
                        {commonEmojis.map(emoji => (
                            <button key={emoji} onClick={() => handleEmojiClick(emoji)} className="text-xl hover:scale-125 transition-transform">{emoji}</button>
                        ))}
                    </div>
                )}
                <form onSubmit={handleSend} className="flex items-center space-x-3 bg-slate-50 rounded-2xl p-1.5 border border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                    <div className="flex items-center">
                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                            <FaSmile size={20} />
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2 transition-colors ${isUploading ? 'text-primary animate-pulse' : 'text-slate-400 hover:text-primary'}`}>
                            <FaImage size={20} />
                        </button>
                    </div>
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isUploading ? "Uploading file..." : "Type your message to Admin..."} 
                        disabled={isUploading}
                        className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm text-slate-800 placeholder:text-slate-400"
                    />
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    <button 
                        type="submit"
                        disabled={(!input.trim() && !isUploading) || isUploading}
                        className="bg-primary hover:bg-primary/90 text-white p-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100"
                    >
                        <FaPaperPlane size={16} />
                    </button>
                </form>
                <p className="text-[9px] text-slate-400 text-center mt-3 uppercase tracking-widest font-bold opacity-60">
                    End-to-end encrypted with PawVaidya security
                </p>
            </div>
        </div>
    );
};

export default AdminChat;
