import React, { useContext, useEffect, useState, useRef } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { extractLinks, getLinkSource, getSourceColor } from '../../utils/linkUtils';

const DoctorChat = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [conversations, setConversations] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [socket, setSocket] = useState(null);
    const [adminId, setAdminId] = useState(null);
    const messagesEndRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Initialize socket and fetch admin ID
    useEffect(() => {
        if (atoken) {
            const newSocket = io(backendurl, {
                withCredentials: true,
                transports: ['polling', 'websocket']
            });
            setSocket(newSocket);
            const fetchAdminId = async () => {
                try {
                    const profileRes = await axios.get(`${backendurl}/api/admin/profile`, { headers: { atoken } });
                    if (profileRes.data.success) {
                        const id = profileRes.data.admin._id;
                        setAdminId(id);
                        newSocket.emit('join-direct-chat', id);
                    }
                } catch (err) {
                    console.error('Failed to fetch admin profile:', err);
                }
            };
            fetchAdminId();
        }
        return () => socket?.disconnect();
    }, [atoken, backendurl]);

    // Manage file preview URL
    useEffect(() => {
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setFilePreview(objectUrl);
            console.log('File selected:', file.name, file.type);

            // Cleanup
            return () => {
                URL.revokeObjectURL(objectUrl);
            };
        } else {
            setFilePreview(null);
        }
    }, [file]);

    // Fetch Conversations
    useEffect(() => {
        if (atoken) {
            fetchConversations();
        }
    }, [atoken]);

    const fetchConversations = async () => {
        try {
            const { data } = await axios.post(`${backendurl}/api/chat/direct/admin-conversations`, {}, {
                headers: { atoken }
            });
            if (data.success) {
                setConversations(data.conversations);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // ─── Gemini Integration ──────────────────────────────────────────────────────
    const [genAI, setGenAI] = useState(null);
    const [model, setModel] = useState(null);
    // Initialize from localStorage or default to false
    const [isGeminiEnabled, setIsGeminiEnabled] = useState(() => {
        const saved = localStorage.getItem('isGeminiEnabled');
        return saved === 'true';
    });
    const [isGeminiTyping, setIsGeminiTyping] = useState(false);

    // Ref to access current state inside socket callback
    const geminiEnabledRef = useRef(isGeminiEnabled);

    useEffect(() => {
        geminiEnabledRef.current = isGeminiEnabled;
        // Save to localStorage whenever it changes
        localStorage.setItem('isGeminiEnabled', isGeminiEnabled);
    }, [isGeminiEnabled]);

    useEffect(() => {
        const initGemini = async () => {
            try {
                const { GoogleGenerativeAI } = await import('@google/generative-ai');
                const API_KEY = import.meta.env.VITE_API_KEY_GEMINI_2;
                const genAIInstance = new GoogleGenerativeAI(API_KEY);
                setGenAI(genAIInstance);
                setModel(genAIInstance.getGenerativeModel({ model: 'gemini-3-flash-preview' }));
            } catch (error) {
                console.error("Failed to initialize Gemini:", error);
            }
        };
        initGemini();
    }, []);

    const SYSTEM_PROMPT = `You are the AI Assistant for the **PawVaidya Admin**. You are talking to a **Veterinary Doctor** on the platform.
    
    YOUR ROLE:
    - Handle queries from doctors efficiently.
    - Status updates, technical support, verification questions, or general platform guidance.
    - Speak in a professional yet friendly tone.
    - **LANGUAGE**: You can speak in **Hinglish** (Hindi + English mix) or **English**, depending on the doctor's message.
    - Be concise. Do NOT be verbose.

    CONTEXT:
    - You are the Admin.
    - The user is a Doctor.
    - Platform: PawVaidya (Veterinary Consultancy).

    If the doctor asks for sensitive actions (like unbanning, payment release), say you will "forward this request to the main admin team" or "look into it shortly".`;

    const generateGeminiResponse = async (userMessage) => {
        // Use ref here as well to be safe, though not strictly necessary if called from closure-safe place
        if (!geminiEnabledRef.current || !model) {
            console.log("Gemini skipped: Enabled=", geminiEnabledRef.current, "Model=", !!model);
            return;
        }

        setIsGeminiTyping(true);
        // Emit typing start
        socket?.emit('direct-typing-start', { receiverId: selectedDoctor._id, senderId: adminId });

        try {
            // Build conversation history (last 5 messages for context)
            const history = messages.slice(-5).map(m =>
                `${m.senderModel === 'Admin' ? 'Admin' : 'Doctor'}: ${m.message || '[Attachment]'}`
            ).join('\n');

            const prompt = `${SYSTEM_PROMPT}\n\nRecent Conversation:\n${history}\n\nDoctor: ${userMessage}\nAdmin (You):`;

            const result = await model.generateContent(prompt);
            const response = result.response.text();

            if (response) {
                await sendAdminMessage(response);
            }
        } catch (error) {
            console.error("Gemini Error:", error);
            // Fallback: Try with 'gemini-pro' if flash fails? Or just log.
        } finally {
            setIsGeminiTyping(false);
            // Emit typing stop
            socket?.emit('direct-typing-stop', { receiverId: selectedDoctor._id, senderId: adminId });
        }
    };

    const sendAdminMessage = async (text) => {
        if (!adminId || !selectedDoctor) return;

        // Stop typing before sending
        socket?.emit('direct-typing-stop', { receiverId: selectedDoctor._id, senderId: adminId });

        try {
            const messageData = {
                senderId: adminId,
                senderModel: 'Admin',
                receiverId: selectedDoctor._id,
                receiverModel: 'Doctor',
                message: text,
                fileUrl: null,
                fileType: null,
                fileName: null
            };

            const { data } = await axios.post(`${backendurl}/api/chat/direct/send`, messageData, {
                headers: { atoken }
            });

            if (data.success) {
                setMessages(prev => [...prev, data.data]);
                scrollToBottom();
                fetchConversations();
            }
        } catch (error) {
            console.error("Auto-reply error:", error);
        }
    };
    // ─────────────────────────────────────────────────────────────────────────────

    // Fetch Messages when doctor selected
    useEffect(() => {
        if (selectedDoctor && atoken && adminId) {
            fetchMessages();
            // Mark as read
            markAsRead();
        }
    }, [selectedDoctor, atoken, adminId]);

    const fetchMessages = async () => {
        try {
            // Ensure adminId and selectedDoctor are available
            if (!adminId || !selectedDoctor) return;
            // Join socket room (if not already joined)
            socket?.emit('join-direct-chat', adminId);

            // Set up listener (avoid duplicate listeners)
            socket?.off('receive-direct-message');
            socket?.on('receive-direct-message', (message) => {
                if (message.senderId === selectedDoctor._id || message.receiverId === selectedDoctor._id) {
                    setMessages((prev) => [...prev, message]);
                    scrollToBottom();

                    // ─── Trigger Gemini Auto-Reply ───
                    // Use ref to check current enabled state
                    if (geminiEnabledRef.current && message.senderId === selectedDoctor._id) {
                        console.log("Triggering auto-reply for:", message.message);
                        // Small delay to simulate thinking/reading
                        setTimeout(() => {
                            generateGeminiResponse(message.message || "Sent an attachment");
                        }, 1500);
                    }
                    // ─────────────────────────────────
                }
                fetchConversations();
            });

            const { data } = await axios.get(
                `${backendurl}/api/chat/direct/history/${adminId}/${selectedDoctor._id}`,
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
            if (!adminId || !selectedDoctor) return;
            await axios.post(`${backendurl}/api/chat/direct/mark-read`, {
                senderId: selectedDoctor._id,
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

    // Typing debounce for manual input
    const typingTimeoutRef = useRef(null);

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);

        if (!selectedDoctor || !adminId) return;

        // Emit typing start
        socket?.emit('direct-typing-start', { receiverId: selectedDoctor._id, senderId: adminId });

        // Clear existing timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Set new timeout to stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            socket?.emit('direct-typing-stop', { receiverId: selectedDoctor._id, senderId: adminId });
        }, 2000);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !file) return;
        if (!adminId || !selectedDoctor) return;

        // Stop typing immediately
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket?.emit('direct-typing-stop', { receiverId: selectedDoctor._id, senderId: adminId });

        try {
            let fileUrl = null;
            let fileType = null;
            let fileName = null;

            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                const uploadRes = await axios.post(`${backendurl}/api/chat/upload-file`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (uploadRes.data.success) {
                    fileUrl = uploadRes.data.fileUrl;
                    fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
                    fileName = file.name;
                }
            }

            const messageData = {
                senderId: adminId,
                senderModel: 'Admin',
                receiverId: selectedDoctor._id,
                receiverModel: 'Doctor',
                message: newMessage,
                fileUrl,
                fileType,
                fileName
            };

            const { data } = await axios.post(`${backendurl}/api/chat/direct/send`, messageData, {
                headers: { atoken }
            });

            if (data.success) {
                setMessages([...messages, data.data]);
                setNewMessage('');
                setFile(null);
                scrollToBottom();
                fetchConversations();
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const filteredConversations = conversations.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out;
                }
                /* Toggle Switch Styles */
                .toggle-checkbox:checked {
                    right: 0;
                    border-color: #10B981;
                }
                .toggle-checkbox:checked + .toggle-label {
                    background-color: #10B981;
                }
            `}</style>
            <div className="flex h-[calc(100vh-100px)] bg-white rounded-xl shadow-lg overflow-hidden m-5">
                {/* Sidebar */}
                <div className="w-1/3 border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">💬 Doctor Chat</h2>
                        <input
                            type="text"
                            placeholder="Search doctors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.map((doc) => (
                            <div
                                key={doc._id}
                                onClick={() => setSelectedDoctor(doc)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedDoctor?._id === doc._id ? 'bg-green-50 border-l-4 border-green-500' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img src={doc.image} alt={doc.name} className="w-12 h-12 rounded-full object-cover" />
                                        {doc.available && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="font-semibold text-gray-800 truncate">{doc.name}</h3>
                                            {doc.lastMessageTime && (
                                                <span className="text-xs text-gray-500">
                                                    {new Date(doc.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-sm text-gray-600 truncate w-3/4">
                                                {doc.lastMessage || <span className="italic text-gray-400">No messages yet</span>}
                                            </p>
                                            {doc.unreadCount > 0 && (
                                                <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                    {doc.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-gray-50">
                    {selectedDoctor ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-4">
                                    <img src={selectedDoctor.image} alt={selectedDoctor.name} className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <h3 className="font-bold text-gray-800">{selectedDoctor.name}</h3>
                                        <p className="text-xs text-green-600 font-medium">{selectedDoctor.available ? 'Online' : 'Offline'}</p>
                                    </div>
                                </div>

                                {/* Gemini Toggle */}
                                <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                                    <span className={`text-xs font-semibold flex items-center gap-1 ${isGeminiEnabled ? 'text-purple-600' : 'text-gray-400'}`}>
                                        ✨ Gemini AI
                                    </span>
                                    <div
                                        className={`relative inline-block w-10 h-6 transition-colors duration-200 ease-in-out border-2 rounded-full cursor-pointer ${isGeminiEnabled ? 'bg-purple-500 border-purple-500' : 'bg-gray-200 border-gray-200'
                                            }`}
                                        onClick={() => setIsGeminiEnabled(!isGeminiEnabled)}
                                    >
                                        <span
                                            className={`inline-block w-5 h-5 transform transition-transform duration-200 ease-in-out bg-white rounded-full ${isGeminiEnabled ? 'translate-x-4' : 'translate-x-0'
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${msg.senderModel === 'Admin' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <div className={`max-w-[70%] rounded-2xl p-4 shadow-md transition-all hover:shadow-lg ${msg.senderModel === 'Admin' ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                                            {msg.fileUrl && (
                                                <div className="mb-2">
                                                    {msg.fileType === 'image' ? (
                                                        <img src={msg.fileUrl} alt="attachment" className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition" />
                                                    ) : msg.fileType === 'video' ? (
                                                        <video src={msg.fileUrl} controls className="max-w-full rounded-lg" />
                                                    ) : (
                                                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/10 p-2 rounded-lg hover:bg-black/20 transition">
                                                            <span>📄</span> {msg.fileName}
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {msg.message && (
                                                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                    {msg.message}
                                                    {/* Display Link Sources */}
                                                    {extractLinks(msg.message).length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {extractLinks(msg.message).map((link, idx) => {
                                                                const source = getLinkSource(link);
                                                                const colorClass = getSourceColor(source);
                                                                return (
                                                                    <a
                                                                        key={idx}
                                                                        href={link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${colorClass} hover:opacity-80 transition-opacity no-underline`}
                                                                    >
                                                                        🔗 {source}
                                                                    </a>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <p className={`text-[10px] mt-1 text-right ${msg.senderModel === 'Admin' ? 'text-green-100' : 'text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {isGeminiTyping && (
                                    <div className="flex justify-end animate-fadeIn">
                                        <div className="bg-gradient-to-br from-green-50 to-green-100 text-gray-500 text-xs py-2 px-4 rounded-full rounded-tr-none shadow-sm flex items-center gap-2 border border-green-200">
                                            <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                            <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                            Gemini is typing...
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                                {file && filePreview && (
                                    <div className="mb-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 animate-slideIn">
                                        <div className="flex items-start gap-3">
                                            {/* Preview */}
                                            <div className="flex-shrink-0">
                                                {file.type.startsWith('image/') ? (
                                                    <img
                                                        src={filePreview}
                                                        alt="preview"
                                                        className="w-20 h-20 object-cover rounded-lg border-2 border-green-300 shadow-sm"
                                                    />
                                                ) : file.type.startsWith('video/') ? (
                                                    <video
                                                        src={filePreview}
                                                        className="w-20 h-20 object-cover rounded-lg border-2 border-green-300 shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center text-3xl border-2 border-green-300 shadow-sm">
                                                        📄
                                                    </div>
                                                )}
                                            </div>
                                            {/* File info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {(file.size / 1024).toFixed(2)} KB • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                </p>
                                            </div>
                                            {/* Remove button */}
                                            <button
                                                type="button"
                                                onClick={() => setFile(null)}
                                                className="flex-shrink-0 text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-full transition-all duration-200 transform hover:scale-110"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <label className="cursor-pointer p-3 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setFile(e.target.files[0]);
                                                }
                                            }}
                                            accept="image/*,video/*,application/*"
                                        />
                                        📎
                                    </label>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 border border-gray-300 rounded-full px-4 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() && !file}
                                        className="bg-green-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Send
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <div className="text-6xl mb-4">💬</div>
                            <p className="text-xl font-medium">Select a doctor to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default DoctorChat;
