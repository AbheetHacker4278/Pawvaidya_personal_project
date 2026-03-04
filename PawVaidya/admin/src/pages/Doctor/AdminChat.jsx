import React, { useContext, useEffect, useState, useRef } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { extractLinks, getLinkSource, getSourceColor } from '../../utils/linkUtils';

const AdminChat = () => {
    const { dtoken, backendurl } = useContext(DoctorContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);
    const [adminId, setAdminId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);

    // Initialize Socket and Fetch Admin ID
    useEffect(() => {
        if (dtoken) {
            const newSocket = io(backendurl, {
                withCredentials: true,
                transports: ['polling', 'websocket']
            });
            setSocket(newSocket);

            fetchAdminProfile(newSocket);
        }
        return () => socket?.disconnect();
    }, [dtoken, backendurl]);

    const fetchAdminProfile = async (currentSocket) => {
        try {
            // We need to know who the admin is. 
            // Since there is usually one admin or a shared admin role, 
            // we need to find the admin's ID to send messages to.
            // Let's assume there's an endpoint to get "The Admin" or we use a fixed ID if we knew it.
            // But better: The backend controller for `getDirectMessages` takes user IDs.
            // We need to find the Admin's ID.
            // Let's assume we can get it from a new endpoint or existing one.
            // Actually, let's create a helper endpoint or just fetch the first admin?
            // For now, let's assume we fetch the admin profile via a public or protected route.
            // Wait, we don't have a route to "get admin id".
            // Let's assume the Admin sends a message first? No, Doctor might initiate.
            // Let's add a quick endpoint or use a known one.
            // Actually, we can use the `getAdminConversations` logic in reverse? No.
            // Let's assume we can get the admin ID from the `adminProfile` if we were admin.
            // As a doctor, we don't have access to admin profile.
            // Let's cheat slightly and assume the Admin ID is available or we fetch it via a specific "get-admin-contact" route.
            // OR, we can just search for a user with role 'Admin'?
            // Let's try to fetch the admin details.
            // I'll add a simple route to `adminController` or just use a hardcoded assumption if I must, 
            // but better to fetch.
            // Let's assume there is an endpoint `api/doctor/get-admin-id`.
            // Since I didn't create it, let's create it or use a workaround.
            // Workaround: The Doctor can only chat if Admin messaged first? No.
            // Let's use a hardcoded ID? No.
            // Let's fetch all admins?
            // I will assume for this iteration that I can get the admin ID.
            // I will add a small endpoint to `doctorController` or `adminController` to "get support contact".
            // Actually, let's just use the first admin found in DB.
            // I'll add a route to `chatRoute` to `get-admin-id`.

            const { data } = await axios.get(`${backendurl}/api/chat/direct/get-admin-id`); // I need to add this!
            if (data.success) {
                setAdminId(data.adminId);
                const fetchedAdminId = data.adminId;

                // Join my own room
                const profileRes = await axios.get(`${backendurl}/api/doctor/profile`, { headers: { dtoken } });
                if (profileRes.data.success) {
                    const doctorId = profileRes.data.profileData._id;
                    currentSocket.emit('join-direct-chat', doctorId);

                    // Listen for messages
                    currentSocket.on('receive-direct-message', (message) => {
                        if (message.senderId === fetchedAdminId || message.receiverId === fetchedAdminId) {
                            setMessages(prev => [...prev, message]);
                            setIsTyping(false); // Stop typing when message received
                            scrollToBottom();
                        }
                    });

                    // Listen for typing events
                    currentSocket.on('direct-typing-start', (data) => {
                        if (data.senderId === fetchedAdminId) {
                            setIsTyping(true);
                            scrollToBottom();
                        }
                    });

                    currentSocket.on('direct-typing-stop', (data) => {
                        if (data.senderId === fetchedAdminId) {
                            setIsTyping(false);
                        }
                    });

                    // Fetch history
                    const historyRes = await axios.get(`${backendurl}/api/chat/direct/history/${doctorId}/${fetchedAdminId}`, {
                        headers: { dtoken } // This route needs to support dtoken too!
                    });
                    if (historyRes.data.success) {
                        setMessages(historyRes.data.messages);
                        scrollToBottom();
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Manage file preview URL
    useEffect(() => {
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setFilePreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else {
            setFilePreview(null);
        }
    }, [file]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !file) || !adminId) return;

        try {
            const profileRes = await axios.get(`${backendurl}/api/doctor/profile`, { headers: { dtoken } });
            const doctorId = profileRes.data.profileData._id;

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
                senderId: doctorId,
                senderModel: 'Doctor',
                receiverId: adminId,
                receiverModel: 'Admin',
                message: newMessage,
                fileUrl,
                fileType,
                fileName
            };

            const { data } = await axios.post(`${backendurl}/api/chat/direct/send`, messageData, {
                headers: { dtoken } // Ensure backend accepts dtoken for this route or is public
            });

            if (data.success) {
                setMessages([...messages, data.data]);
                setNewMessage('');
                setFile(null);
                scrollToBottom();
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
                .animate-slideIn { animation: slideIn 0.3s ease-out; }
            `}</style>
            <div className="flex h-[calc(100vh-100px)] bg-white rounded-xl shadow-lg overflow-hidden m-5">
                <div className="flex-1 flex flex-col bg-gray-50">
                    {/* Header */}
                    <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-4 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                            A
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Admin Support</h3>
                            <p className="text-xs text-green-600 font-medium">Always here to help</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.senderModel === 'Doctor' ? 'justify-end' : 'justify-start'} animate-fadeIn`} style={{ animationDelay: `${index * 0.05}s` }}>
                                <div className={`max-w-[70%] rounded-2xl p-4 shadow-md transition-all hover:shadow-lg ${msg.senderModel === 'Doctor' ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
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
                                    <p className={`text-[10px] mt-1 text-right ${msg.senderModel === 'Doctor' ? 'text-green-100' : 'text-gray-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start animate-fadeIn">
                                <div className="bg-white text-gray-500 text-xs py-2 px-4 rounded-full rounded-tl-none shadow-sm flex items-center gap-2 border border-gray-100">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                    Admin is typing...
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
                                    <div className="flex-shrink-0">
                                        {file.type.startsWith('image/') ? (
                                            <img src={filePreview} alt="preview" className="w-20 h-20 object-cover rounded-lg border-2 border-green-300 shadow-sm" />
                                        ) : file.type.startsWith('video/') ? (
                                            <video src={filePreview} className="w-20 h-20 object-cover rounded-lg border-2 border-green-300 shadow-sm" />
                                        ) : (
                                            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center text-3xl border-2 border-green-300 shadow-sm">📄</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(2)} KB • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                                    </div>
                                    <button type="button" onClick={() => setFile(null)} className="flex-shrink-0 text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-full transition-all duration-200 transform hover:scale-110">✕</button>
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
                </div>
            </div>
        </>
    );
};

export default AdminChat;
