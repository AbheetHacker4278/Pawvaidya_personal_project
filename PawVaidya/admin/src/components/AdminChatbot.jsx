import React, { useState, useEffect, useRef, useContext } from 'react';
import { AdminContext } from '../context/AdminContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    X,
    Send,
    Bot,
    User,
    Loader2,
    Maximize2,
    Minimize2,
    Sparkles,
    RefreshCw,
    Mail,
    Users,
    Calendar,
    ShieldCheck
} from 'lucide-react';

const AdminChatbot = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hello Admin! I'm your PawVaidya AI Assistant. I can help you with real-time data, searching users, or performing actions like sending verification emails. try asking 'How many users are registered?' or 'Send verification email to user@example.com'."
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Build history for Gemini
            // Rule: History must start with 'user' and alternate roles.
            // Since our first message is assistant (model), we filter it out if there's no preceding user message.
            const history = messages
                .filter((m, i) => !(i === 0 && m.role === 'assistant'))
                .map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }));

            const { data } = await axios.post(`${backendurl}/api/admin/bot/query`, {
                message: input,
                history: history
            }, {
                headers: { atoken }
            });

            if (data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "Error: " + data.message }]);
            }
        } catch (error) {
            console.error("Chatbot Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to the brain. Please check the backend console." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!atoken) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            height: isMinimized ? '60px' : '550px',
                            width: '400px'
                        }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl border border-green-100 flex flex-col overflow-hidden mb-4"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">PawVaidya Admin Bot</h3>
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        <span className="text-[10px] opacity-80">AI Assistant Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                                >
                                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'assistant' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                                                </div>
                                                <div className={`p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'assistant'
                                                    ? 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                                    : 'bg-green-600 text-white rounded-tr-none'
                                                    }`}>
                                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="flex gap-2 max-w-[85%]">
                                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-sm">
                                                    <Bot size={16} />
                                                </div>
                                                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-gray-400 text-xs shadow-sm">
                                                    <Loader2 size={14} className="animate-spin" />
                                                    Thinking...
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Suggested Actions */}
                                {messages.length === 1 && (
                                    <div className="px-4 py-2 flex flex-wrap gap-2 bg-gray-50/50">
                                        <button
                                            onClick={() => setInput("How many users are registered?")}
                                            className="text-[11px] bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-green-500 hover:text-green-600 transition-all flex items-center gap-1.5 shadow-sm"
                                        >
                                            <Users size={12} /> Total Users
                                        </button>
                                        <button
                                            onClick={() => setInput("Show me recent appointments")}
                                            className="text-[11px] bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-green-500 hover:text-green-600 transition-all flex items-center gap-1.5 shadow-sm"
                                        >
                                            <Calendar size={12} /> Recent Appts
                                        </button>
                                        <button
                                            onClick={() => setInput("Search for user Abheet Seth")}
                                            className="text-[11px] bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-green-500 hover:text-green-600 transition-all flex items-center gap-1.5 shadow-sm"
                                        >
                                            <ShieldCheck size={12} /> Search User
                                        </button>
                                    </div>
                                )}

                                {/* Input */}
                                <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask something..."
                                        disabled={isLoading}
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading || !input.trim()}
                                        className="bg-green-600 text-white p-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </button>
                                </form>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    setIsOpen(!isOpen);
                    setIsMinimized(false);
                }}
                className={`p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${isOpen && !isMinimized ? 'bg-white text-green-600' : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                    }`}
            >
                {isOpen && !isMinimized ? <X size={28} /> : (
                    <div className="relative">
                        <MessageSquare size={28} />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </div>
                )}
            </motion.button>
        </div>
    );
};

export default AdminChatbot;
