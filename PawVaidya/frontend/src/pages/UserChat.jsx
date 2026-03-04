import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { assets } from '../assets/assets_frontend/assets';

const UserChat = () => {
    const { friendId } = useParams();
    const { token, backendurl, userData } = useContext(AppContext);
    const navigate = useNavigate();
    const [friend, setFriend] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch friend details
    useEffect(() => {
        const fetchFriend = async () => {
            try {
                const { data } = await axios.get(backendurl + `/api/user/profile/${friendId}`);
                if (data.success) {
                    setFriend(data.userdata);
                } else {
                    toast.error("User not found");
                    navigate('/friends');
                }
            } catch (error) {
                console.error(error);
                navigate('/friends');
            }
        };

        if (friendId) fetchFriend();
    }, [friendId, backendurl, navigate]);

    // Initialize Socket
    useEffect(() => {
        if (userData && friendId) {
            const newSocket = io(backendurl, {
                withCredentials: true,
                transports: ['polling', 'websocket']
            });
            setSocket(newSocket);

            // Create a unique room ID for this pair of users
            // Sort IDs to ensure consistent room ID regardless of who initiates
            const room = [userData.id, friendId].sort().join('-');

            newSocket.emit('join-user-chat', room);

            newSocket.on('receive-user-message', (data) => {
                if (data.senderId === friendId) {
                    setMessages((prev) => [...prev, data]);
                }
            });

            return () => newSocket.disconnect();
        }
    }, [userData, friendId, backendurl]);

    // Fetch Messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                if (!userData || !friendId) return;

                const { data } = await axios.post(
                    backendurl + '/api/user/chat/messages',
                    { userId: userData.id, friendId },
                    { headers: { token } }
                );
                if (data.success) {
                    setMessages(data.messages);
                } else {
                    toast.error(data.message || "Failed to load messages");
                }
            } catch (error) {
                console.error(error);
                toast.error("Error loading chat");
            } finally {
                setLoading(false);
            }
        };

        if (userData && friendId && token) {
            fetchMessages();
            // Mark as read
            axios.post(
                backendurl + '/api/user/chat/read',
                { userId: userData.id, friendId },
                { headers: { token } }
            );
        } else if (!token) {
            setLoading(false);
            navigate('/login');
        }
    }, [userData, friendId, token, backendurl, navigate]);

    // Safety timeout for loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading && token && !userData) {
                setLoading(false);
                toast.error("Failed to load user profile. Please login again.");
                navigate('/login');
            }
        }, 8000);
        return () => clearTimeout(timer);
    }, [loading, token, userData, navigate]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !file) || !socket) return;

        const formData = new FormData();
        formData.append('senderId', userData.id);
        formData.append('receiverId', friendId);
        formData.append('message', newMessage);
        if (file) {
            formData.append('file', file);
            let type = 'file';
            if (file.type.startsWith('image/')) type = 'image';
            if (file.type.startsWith('video/')) type = 'video';
            formData.append('messageType', type);
        } else {
            formData.append('messageType', 'text');
        }

        try {
            const { data } = await axios.post(
                backendurl + '/api/user/chat/send',
                formData,
                { headers: { token, 'Content-Type': 'multipart/form-data' } }
            );

            if (data.success) {
                const msgData = data.data;
                setMessages((prev) => [...prev, msgData]);
                setNewMessage('');
                setFile(null);

                // Emit via socket
                const room = [userData.id, friendId].sort().join('-');
                socket.emit('send-user-message', { ...msgData, room });
            } else {
                toast.error(data.message || "Failed to send message");
            }
        } catch (error) {
            toast.error("Error sending message");
            console.error(error);
        }
    };

    const handleFileSelect = (e) => {
        setFile(e.target.files[0]);
    };

    if (loading) return <div className="h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto bg-gray-50 shadow-lg rounded-xl overflow-hidden my-4 border">
            {/* Header */}
            <div className="bg-white p-4 border-b flex items-center gap-4">
                <button onClick={() => navigate('/friends')} className="md:hidden text-gray-600 hover:text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                </button>
                <img
                    src={friend?.image || assets.profile_pic}
                    alt={friend?.name}
                    className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                    <h2 className="font-semibold text-gray-800">{friend?.name}</h2>
                    <span className="text-xs text-green-500 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
                    </span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg, index) => {
                    const isOwn = msg.senderId === userData.id;
                    return (
                        <div key={index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isOwn ? 'bg-primary text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'
                                }`}>
                                {msg.message && <p className="mb-1">{msg.message}</p>}

                                {msg.messageType === 'image' && (
                                    <img src={msg.fileUrl} alt="attachment" className="rounded-lg max-w-full h-auto mt-2" />
                                )}
                                {msg.messageType === 'video' && (
                                    <video src={msg.fileUrl} controls className="rounded-lg max-w-full h-auto mt-2" />
                                )}
                                {msg.messageType === 'file' && (
                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 mt-2 p-2 rounded-lg ${isOwn ? 'bg-primary-dark/20' : 'bg-gray-100'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                        </svg>
                                        <span className="text-sm underline truncate max-w-[150px]">{msg.fileName || 'Download File'}</span>
                                    </a>
                                )}
                                <span className={`text-[10px] block text-right mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
                {file && (
                    <div className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-lg mb-2">
                        <span className="text-sm truncate max-w-[80%]">{file.name}</span>
                        <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="p-2 text-gray-500 hover:text-primary transition bg-gray-100 rounded-full"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                        </svg>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,video/*,.pdf,.doc,.docx"
                    />
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() && !file}
                        className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserChat;
