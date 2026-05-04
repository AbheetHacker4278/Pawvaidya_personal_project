import React, { useContext, useEffect, useState, useRef } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Search, Send, User, Shield, Lock, 
  MoreVertical, ChevronLeft, Image as ImageIcon, Smile, FileText, CheckCircle2 
} from 'lucide-react';

const CSAgentChat = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { atoken, backendurl } = useContext(AdminContext);
    const [conversations, setConversations] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [adminId, setAdminId] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showMobileSidebar, setShowMobileSidebar] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const commonEmojis = ['😊', '😂', '👍', '🙏', '❤️', '🔥', '✨', '✅', '❌', '👋', '🙌', '🐱', '🐶'];

    useEffect(() => {
        if (atoken) {
            const newSocket = io(backendurl, {
                withCredentials: true,
                transports: ['polling', 'websocket']
            });
            setSocket(newSocket);
            const fetchAdminProfile = async () => {
                try {
                    const profileRes = await axios.get(`${backendurl}/api/admin/profile`, { headers: { atoken } });
                    if (profileRes.data.success) {
                        const aid = profileRes.data.admin._id;
                        setAdminId(aid);
                        newSocket.emit('join-direct-chat', aid);
                    }
                } catch (err) {
                    console.error('Failed to fetch admin profile:', err);
                }
            };
            fetchAdminProfile();
        }
        return () => socket?.disconnect();
    }, [atoken, backendurl]);

    useEffect(() => {
        if (atoken && adminId) {
            fetchConversations();
        }
    }, [atoken, adminId]);

    const fetchConversations = async () => {
        try {
            const { data } = await axios.post(`${backendurl}/api/chat/direct/cs-conversations`, { adminId }, {
                headers: { atoken }
            });
            if (data.success) {
                setConversations(data.conversations);
                if (id) {
                    const agent = data.conversations.find(a => a._id === id);
                    if (agent) setSelectedAgent(agent);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (selectedAgent && atoken && adminId) {
            fetchHistory();
            markAsRead();
        }
    }, [selectedAgent, atoken, adminId]);

    const fetchHistory = async () => {
        try {
            if (!adminId || !selectedAgent) return;
            
            socket?.off('receive-direct-message');
            socket?.on('receive-direct-message', (message) => {
                if (message.senderId.toString() === selectedAgent._id.toString() || 
                    message.receiverId.toString() === selectedAgent._id.toString()) {
                    setMessages((prev) => {
                        const exists = prev.some(m => m._id === message._id);
                        if (exists) return prev;
                        return [...prev, message];
                    });
                    scrollToBottom();
                }
                fetchConversations();
            });

            const { data } = await axios.get(
                `${backendurl}/api/chat/direct/history/${adminId}/${selectedAgent._id}`,
                { headers: { atoken } }
            );
            if (data.success) {
                setMessages(data.messages);
                scrollToBottom();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const markAsRead = async () => {
        try {
            if (!adminId || !selectedAgent) return;
            await axios.post(`${backendurl}/api/chat/direct/mark-read`, {
                senderId: selectedAgent._id,
                receiverId: adminId
            }, { headers: { atoken } });
            fetchConversations();
        } catch (error) {
            console.error(error);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !adminId || !selectedAgent) return;

        try {
            const messageData = {
                senderId: adminId,
                senderModel: 'Admin',
                receiverId: selectedAgent._id,
                receiverModel: 'CS_Employee',
                message: newMessage,
            };

            const { data } = await axios.post(`${backendurl}/api/chat/direct/send`, messageData, {
                headers: { atoken }
            });

            if (data.success) {
                setMessages([...messages, data.data]);
                setNewMessage('');
                scrollToBottom();
                fetchConversations();
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedAgent || !adminId) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File too large (Max 10MB)");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('senderId', adminId);
        formData.append('senderModel', 'Admin');
        formData.append('receiverId', selectedAgent._id);
        formData.append('receiverModel', 'CS_Employee');
        formData.append('message', '');

        try {
            const { data } = await axios.post(`${backendurl}/api/chat/direct/upload-file`, formData, {
                headers: { atoken, 'Content-Type': 'multipart/form-data' }
            });
            if (data.success) {
                setMessages((prev) => [...prev, data.data]);
                scrollToBottom();
                fetchConversations();
            }
        } catch (error) {
            toast.error("File upload failed");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleEmojiClick = (emoji) => {
        setNewMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const filteredConversations = conversations.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (id) {
            setShowMobileSidebar(false);
        } else {
            setShowMobileSidebar(true);
        }
    }, [id]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl overflow-hidden m-4 lg:m-6 border border-slate-100"
        >
            {/* Sidebar */}
            <div className={`
                ${showMobileSidebar ? 'flex' : 'hidden'} 
                md:flex w-full md:w-80 lg:w-96 border-r border-slate-100 flex-col bg-slate-50/50
            `}>
                <div className="p-6 bg-white border-b border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Agent Inbox</h2>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <MessageSquare size={20} />
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search agents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                    {filteredConversations.map((agent) => (
                        <motion.div
                            key={agent._id}
                            whileHover={{ x: 4 }}
                            onClick={() => {
                                setSelectedAgent(agent);
                                navigate(`/cs-chat/${agent._id}`);
                                setShowMobileSidebar(false);
                            }}
                            className={`p-4 border-b border-slate-50 cursor-pointer transition-all duration-300 relative ${selectedAgent?._id === agent._id ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
                        >
                            {selectedAgent?._id === agent._id && (
                                <motion.div layoutId="activeAgent" className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full" />
                            )}
                            <div className="flex items-center gap-4">
                                <div className="relative flex-shrink-0">
                                    <img src={agent.image || 'https://via.placeholder.com/40'} alt={agent.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md" />
                                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${agent.available ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`text-sm font-bold truncate ${selectedAgent?._id === agent._id ? 'text-emerald-700' : 'text-slate-800'}`}>{agent.name}</h3>
                                        {agent.lastMessageTime && (
                                            <span className="text-[10px] font-black text-slate-400 uppercase">
                                                {new Date(agent.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[11px] text-slate-500 truncate w-4/5 font-medium leading-relaxed">
                                            {agent.lastMessage || <span className="italic opacity-40 font-normal">Start a new conversation</span>}
                                        </p>
                                        {agent.unreadCount > 0 && (
                                            <motion.span 
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg"
                                            >
                                                {agent.unreadCount}
                                            </motion.span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {filteredConversations.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="text-slate-200 mb-4 flex justify-center"><Search size={40} /></div>
                            <p className="text-slate-400 font-bold text-sm">No agents found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`
                ${!showMobileSidebar ? 'flex' : 'hidden'} 
                md:flex flex-1 flex-col bg-slate-50/30
            `}>
                <AnimatePresence mode="wait">
                    {selectedAgent ? (
                        <motion.div 
                            key="chat"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            {/* Chat Header */}
                            <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setShowMobileSidebar(true)}
                                        className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <div className="relative">
                                        <img src={selectedAgent.image || 'https://via.placeholder.com/40'} alt={selectedAgent.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md" />
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${selectedAgent.available ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 tracking-tight leading-none">{selectedAgent.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${selectedAgent.available ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${selectedAgent.available ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {selectedAgent.available ? 'Active Now' : 'Offline'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                                        <Lock size={12} className="text-slate-400" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Encrypted</span>
                                    </div>
                                    <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><MoreVertical size={20} /></button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
                                {messages.map((msg, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: msg.senderModel === 'Admin' ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex ${msg.senderModel === 'Admin' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-5 py-3.5 shadow-sm transition-all hover:shadow-md ${
                                            msg.senderModel === 'Admin' 
                                            ? 'bg-slate-900 text-white rounded-tr-none' 
                                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                                        }`}>
                                            {msg.fileUrl && (
                                                <div className="mb-2">
                                                    {msg.fileType === 'image' ? (
                                                        <img src={msg.fileUrl} alt="attachment" className="rounded-xl max-w-full cursor-pointer hover:opacity-90" onClick={() => window.open(msg.fileUrl, '_blank')} />
                                                    ) : msg.fileType === 'video' ? (
                                                        <video src={msg.fileUrl} controls className="rounded-xl max-w-full" />
                                                    ) : (
                                                        <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                                                            <FileText size={16} /> {msg.fileName || 'Download'}
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {msg.message && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">{msg.message}</p>}
                                            <div className="flex items-center justify-end gap-1.5 mt-2.5">
                                                <p className={`text-[9px] font-black uppercase tracking-tighter text-slate-400`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {msg.senderModel === 'Admin' && <CheckCircle2 size={10} className="text-emerald-500" />}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-slate-100 relative">
                                {showEmojiPicker && (
                                    <div className="absolute bottom-24 left-6 bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 flex gap-2 z-20">
                                        {commonEmojis.map(emoji => (
                                            <button key={emoji} onClick={() => handleEmojiClick(emoji)} className="text-xl hover:scale-125 transition-transform">{emoji}</button>
                                        ))}
                                    </div>
                                )}
                                <form onSubmit={handleSendMessage} className="flex gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500/30 transition-all duration-300">
                                    <div className="flex items-center gap-1">
                                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"><Smile size={20} /></button>
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2 transition-colors ${isUploading ? 'text-emerald-500 animate-pulse' : 'text-slate-400 hover:text-emerald-500'}`}><ImageIcon size={20} /></button>
                                    </div>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={isUploading ? "Uploading..." : "Write a message to agent..."}
                                        disabled={isUploading}
                                        className="flex-1 bg-transparent border-0 px-2 focus:outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                                    />
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        disabled={(!newMessage.trim() && !isUploading) || isUploading}
                                        className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 flex items-center gap-2 disabled:opacity-50 disabled:grayscale disabled:shadow-none"
                                    >
                                        Send <Send size={14} />
                                    </motion.button>
                                </form>
                                <p className="text-[9px] text-center text-slate-400 font-black uppercase tracking-[0.2em] mt-4 opacity-50">Secure Admin-to-Agent Communication Channel</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="placeholder"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center"
                        >
                            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl mb-8 relative">
                                <motion.div 
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute inset-0 bg-emerald-100 rounded-full" 
                                />
                                <MessageSquare size={56} className="text-emerald-500 relative z-10" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-3 uppercase">Support Communication</h2>
                            <p className="max-w-xs text-sm font-bold text-slate-400 leading-relaxed uppercase tracking-widest opacity-60">Select a CS Agent from the sidebar to initiate a secure 1-to-1 conversation</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default CSAgentChat;
