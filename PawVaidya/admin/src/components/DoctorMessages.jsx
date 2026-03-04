import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../context/DoctorContext';
import axios from 'axios';
import { extractLinks, getLinkSource, getSourceColor } from '../utils/linkUtils';

const DoctorMessages = () => {
    const { dtoken, backendurl } = useContext(DoctorContext);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMessages = async (isBackgroundRefresh = false) => {
        try {
            if (isBackgroundRefresh) {
                setRefreshing(true);
            }
            const { data } = await axios.post(`${backendurl}/api/doctor/messages`, {}, {
                headers: { dtoken }
            });
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAsRead = async (messageId) => {
        try {
            await axios.post(`${backendurl}/api/doctor/messages/read`,
                { messageId },
                { headers: { dtoken } }
            );
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (dtoken) {
            fetchMessages(false);

            // Poll for new messages every 5 seconds for real-time updates
            const interval = setInterval(() => {
                fetchMessages(true); // Background refresh
            }, 5000); // 5 seconds

            return () => clearInterval(interval);
        }
    }, [dtoken]);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 border-red-500 text-red-800';
            case 'high': return 'bg-orange-100 border-orange-500 text-orange-800';
            case 'normal': return 'bg-blue-100 border-blue-500 text-blue-800';
            case 'low': return 'bg-gray-100 border-gray-500 text-gray-800';
            default: return 'bg-gray-100 border-gray-500 text-gray-800';
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'urgent': return '🚨';
            case 'high': return '⚠️';
            case 'normal': return 'ℹ️';
            case 'low': return '📌';
            default: return 'ℹ️';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">📬 Admin Notifications</h1>
                    <p className="text-gray-600">Stay updated with important messages from the administration</p>
                </div>
                <div className="flex items-center gap-3">
                    {refreshing && (
                        <div className="flex items-center gap-2 text-green-600">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm">Updating...</span>
                        </div>
                    )}
                    <button
                        onClick={() => fetchMessages(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {messages.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-gray-500 text-lg">No messages at this time</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg._id}
                            className={`bg-white rounded-lg shadow-md border-l-4 ${getPriorityColor(msg.priority)} p-6 hover:shadow-lg transition-shadow cursor-pointer`}
                            onClick={() => markAsRead(msg._id)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{getPriorityIcon(msg.priority)}</span>
                                    <h3 className="text-xl font-semibold text-gray-800">{msg.title}</h3>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(msg.priority)}`}>
                                    {msg.priority.toUpperCase()}
                                </span>
                            </div>

                            <p className="text-gray-700 mb-4 whitespace-pre-wrap break-words">
                                {msg.message}
                                {/* Display Link Sources */}
                                {extractLinks(msg.message).length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {extractLinks(msg.message).map((link, idx) => {
                                            const source = getLinkSource(link);
                                            const colorClass = getSourceColor(source); // You might need to adjust path or copy utility if it's not accessible here, but it is in ../utils
                                            // The color function returns Tailwind classes like 'text-red-600 bg-red-50 border-red-200'
                                            // We need to map those string classes to style or just use them.
                                            // Since I'm using Tailwind classes in the utility, I can just use them.
                                            let styleClass = "";
                                            switch (source) {
                                                case 'YouTube': styleClass = 'text-red-600 bg-red-50 border-red-200'; break;
                                                case 'LinkedIn': styleClass = 'text-blue-700 bg-blue-50 border-blue-200'; break;
                                                case 'Facebook': styleClass = 'text-blue-600 bg-blue-50 border-blue-200'; break;
                                                case 'X (Twitter)': styleClass = 'text-black bg-gray-50 border-gray-200'; break;
                                                case 'Instagram': styleClass = 'text-pink-600 bg-pink-50 border-pink-200'; break;
                                                case 'GitHub': styleClass = 'text-gray-800 bg-gray-50 border-gray-200'; break;
                                                default: styleClass = 'text-gray-600 bg-gray-50 border-gray-200';
                                            }

                                            return (
                                                <a
                                                    key={idx}
                                                    href={link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${styleClass} hover:opacity-80 transition-opacity no-underline`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    🔗 {source}
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </p>

                            {/* Display attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">📎 Attachments:</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {msg.attachments.map((attachment, idx) => (
                                            <div key={idx} className="relative group">
                                                {attachment.type === 'image' ? (
                                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                                        <img
                                                            src={attachment.url}
                                                            alt={attachment.filename}
                                                            className="w-full h-24 object-cover rounded border hover:opacity-80 transition"
                                                        />
                                                    </a>
                                                ) : (
                                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                                        <div className="w-full h-24 bg-gray-200 rounded border flex items-center justify-center hover:bg-gray-300 transition">
                                                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                    </a>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1 truncate" title={attachment.filename}>
                                                    {attachment.filename}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {new Date(msg.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>

                                {msg.expiresAt && (
                                    <span className="flex items-center gap-1 text-orange-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Expires: {new Date(msg.expiresAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DoctorMessages;
