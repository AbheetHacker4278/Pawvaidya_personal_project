import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { extractLinks, getLinkSource, getSourceColor } from '../../utils/linkUtils';

const AdminMessages = () => {
    const { atoken, backendurl, users, doctors, getallusers, getalldoctors } = useContext(AdminContext);
    const [messages, setMessages] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        targetType: 'all',
        priority: 'normal',
        expiresAt: ''
    });
    const [attachments, setAttachments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recipientQuery, setRecipientQuery] = useState('');
    const [selectedRecipients, setSelectedRecipients] = useState([]);

    const fetchMessages = async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/admin/messages`, {
                headers: { atoken }
            });
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (atoken) {
            fetchMessages();
            getallusers();
            getalldoctors();
        }
    }, [atoken]);

    // Reset recipients when target changes
    useEffect(() => {
        setRecipientQuery('');
        setSelectedRecipients([]);
    }, [formData.targetType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const endpoint = editingMessage
                ? `${backendurl}/api/admin/messages/${editingMessage._id}`
                : `${backendurl}/api/admin/messages`;

            const method = editingMessage ? 'put' : 'post';

            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('message', formData.message);
            formDataToSend.append('targetType', formData.targetType);
            formDataToSend.append('priority', formData.priority);
            if (formData.expiresAt) {
                formDataToSend.append('expiresAt', formData.expiresAt);
            }

            attachments.forEach((file) => {
                formDataToSend.append('attachments', file);
            });

            if ((formData.targetType === 'users' || formData.targetType === 'doctors') && selectedRecipients.length > 0) {
                formDataToSend.append('targetIds', JSON.stringify(selectedRecipients));
                formDataToSend.set('targetType', 'specific');
            }

            const { data } = await axios[method](endpoint, formDataToSend, {
                headers: {
                    atoken,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (data.success) {
                toast.success(editingMessage ? 'Message updated!' : 'Message created!');
                setShowForm(false);
                setEditingMessage(null);
                setFormData({
                    title: '',
                    message: '',
                    targetType: 'all',
                    priority: 'normal',
                    expiresAt: ''
                });
                setAttachments([]);
                setSelectedRecipients([]);
                fetchMessages();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;

        try {
            const { data } = await axios.delete(`${backendurl}/api/admin/messages/${messageId}`, {
                headers: { atoken }
            });

            if (data.success) {
                toast.success('Message deleted!');
                fetchMessages();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleEdit = (message) => {
        setEditingMessage(message);
        setFormData({
            title: message.title,
            message: message.message,
            targetType: message.targetType,
            priority: message.priority,
            expiresAt: message.expiresAt ? new Date(message.expiresAt).toISOString().slice(0, 16) : ''
        });
        setAttachments([]);
        setSelectedRecipients(Array.isArray(message.targetIds) ? message.targetIds : []);
        setShowForm(true);
    };

    const toggleActive = async (messageId, currentStatus) => {
        try {
            const { data } = await axios.put(`${backendurl}/api/admin/messages/${messageId}`,
                { isActive: !currentStatus },
                { headers: { atoken } }
            );

            if (data.success) {
                toast.success('Status updated!');
                fetchMessages();
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500 text-white shadow-md';
            case 'high': return 'bg-orange-500 text-white shadow-md';
            case 'normal': return 'bg-blue-500 text-white shadow-md';
            case 'low': return 'bg-gray-500 text-white shadow-md';
            default: return 'bg-gray-500 text-white shadow-md';
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'urgent': return '🚨';
            case 'high': return '⚠️';
            case 'normal': return '📋';
            case 'low': return '📌';
            default: return '📌';
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;

            if (!isImage && !isVideo) {
                toast.error(`${file.name} is not a valid image or video file`);
                return false;
            }

            if (file.size > maxSize) {
                toast.error(`${file.name} exceeds the maximum file size`);
                return false;
            }

            return true;
        });

        if (attachments.length + validFiles.length > 5) {
            toast.error('Maximum 5 attachments allowed');
            return;
        }

        setAttachments([...attachments, ...validFiles]);
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const removeExistingAttachment = async (messageId, attachmentIndex) => {
        try {
            const message = messages.find(m => m._id === messageId);
            const updatedAttachments = message.attachments.filter((_, i) => i !== attachmentIndex);

            const { data } = await axios.put(`${backendurl}/api/admin/messages/${messageId}`,
                { attachments: updatedAttachments },
                { headers: { atoken } }
            );

            if (data.success) {
                toast.success('Attachment removed!');
                fetchMessages();
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="w-full max-w-full overflow-x-hidden">
            <div className="m-5 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="w-full sm:w-auto">
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent break-words">
                            📨 Admin Messages
                        </h1>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage and broadcast important announcements</p>
                    </div>
                    <button
                        onClick={() => {
                            setShowForm(!showForm);
                            setEditingMessage(null);
                            setFormData({
                                title: '',
                                message: '',
                                targetType: 'all',
                                priority: 'normal',
                                expiresAt: ''
                            });
                            setAttachments([]);
                        }}
                        className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-6 py-3 rounded-full hover:from-green-600 hover:to-emerald-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
                    >
                        {showForm ? '❌ Cancel' : '✨ Create New Message'}
                    </button>
                </div>

                {showForm && (
                    <div className="bg-gradient-to-br from-white to-gray-50 p-4 sm:p-8 rounded-2xl shadow-2xl border border-gray-200 mb-8 animate-slide-down">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 break-words">
                            {editingMessage ? '✏️ Edit Message' : '📝 Create New Message'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div className="w-full">
                                    <label className="block mb-3 font-semibold text-gray-700 text-sm sm:text-base">📋 Title</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full border-2 border-gray-300 px-3 sm:px-4 py-2 sm:py-3 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 text-sm sm:text-base"
                                        placeholder="Enter message title"
                                        required
                                    />
                                </div>

                                <div className="w-full">
                                    <label className="block mb-3 font-semibold text-gray-700 text-sm sm:text-base">🎯 Target</label>
                                    <select
                                        value={formData.targetType}
                                        onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                                        className="w-full border-2 border-gray-300 px-3 sm:px-4 py-2 sm:py-3 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 text-sm sm:text-base"
                                    >
                                        <option value="all">🌍 All (Users & Doctors)</option>
                                        <option value="users">👥 Users Only</option>
                                        <option value="doctors">👨‍⚕️ Doctors Only</option>
                                    </select>
                                </div>
                            </div>

                            {(formData.targetType === 'users' || formData.targetType === 'doctors') && (
                                <div className="w-full bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="font-semibold text-gray-700 text-sm sm:text-base">📇 Select Specific {formData.targetType === 'users' ? 'Users' : 'Doctors'} (Optional)</label>
                                        <span className="text-xs sm:text-sm text-gray-500">Selected: {selectedRecipients.length}</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={recipientQuery}
                                        onChange={(e) => setRecipientQuery(e.target.value)}
                                        placeholder={`Search ${formData.targetType === 'users' ? 'users' : 'doctors'} by name or email`}
                                        className="w-full border-2 border-gray-300 px-3 sm:px-4 py-2 sm:py-3 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 text-sm sm:text-base mb-4"
                                    />
                                    <div className="max-h-64 overflow-y-auto space-y-2">
                                        {((formData.targetType === 'users' ? users : doctors) || [])
                                            .filter(item => {
                                                const q = recipientQuery.trim().toLowerCase();
                                                if (!q) return true;
                                                return (item.name || '').toLowerCase().includes(q) || (item.email || '').toLowerCase().includes(q);
                                            })
                                            .slice(0, 25)
                                            .map(item => (
                                                <label key={item._id} className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-2 sm:p-3 rounded-xl border border-gray-200">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-xs sm:text-sm text-gray-800 truncate">{item.name || 'N/A'}</p>
                                                        <p className="text-xs text-gray-500 truncate">{item.email || 'N/A'}</p>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRecipients.includes(item._id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedRecipients(prev => [...prev, item._id]);
                                                            } else {
                                                                setSelectedRecipients(prev => prev.filter(id => id !== item._id));
                                                            }
                                                        }}
                                                        className="h-4 w-4"
                                                    />
                                                </label>
                                            ))}
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-2">Leave empty to broadcast to all {formData.targetType}.</p>
                                </div>
                            )}

                            <div className="w-full">
                                <label className="block mb-3 font-semibold text-gray-700 text-sm sm:text-base">💬 Message</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full border-2 border-gray-300 px-3 sm:px-4 py-2 sm:py-3 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 resize-none text-sm sm:text-base"
                                    rows="5"
                                    placeholder="Type your important message here..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div className="w-full">
                                    <label className="block mb-3 font-semibold text-gray-700 text-sm sm:text-base">🚦 Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full border-2 border-gray-300 px-3 sm:px-4 py-2 sm:py-3 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 text-sm sm:text-base"
                                    >
                                        <option value="low">📌 Low Priority</option>
                                        <option value="normal">📋 Normal Priority</option>
                                        <option value="high">⚠️ High Priority</option>
                                        <option value="urgent">🚨 Urgent Priority</option>
                                    </select>
                                </div>

                                <div className="w-full">
                                    <label className="block mb-3 font-semibold text-gray-700 text-sm sm:text-base">⏰ Expires At (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.expiresAt}
                                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                        className="w-full border-2 border-gray-300 px-3 sm:px-4 py-2 sm:py-3 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 text-sm sm:text-base"
                                    />
                                </div>
                            </div>

                            <div className="w-full">
                                <label className="block mb-3 font-semibold text-gray-700 text-sm sm:text-base">📎 Attachments</label>
                                <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-6 sm:p-8 text-center hover:border-green-400 hover:bg-green-50 transition-all duration-300">
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        multiple
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="text-base sm:text-lg font-medium text-gray-600 mb-2">Drop files here or click to upload</p>
                                        <p className="text-xs sm:text-sm text-gray-500">Images up to 5MB, Videos up to 50MB • Max 5 files</p>
                                    </label>
                                </div>

                                {attachments.length > 0 && (
                                    <div className="mt-6 space-y-3 w-full">
                                        <p className="font-semibold text-gray-700 text-sm sm:text-base">📁 Selected files:</p>
                                        {attachments.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 w-full">
                                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                                    <span className="text-blue-600 flex-shrink-0">📄</span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-xs sm:text-sm truncate">{file.name}</p>
                                                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
                                                    className="text-red-500 hover:text-red-700 text-xs sm:text-sm bg-red-50 px-2 sm:px-3 py-1 rounded-lg hover:bg-red-100 transition-colors duration-200 flex-shrink-0 ml-2"
                                                >
                                                    ❌ Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {editingMessage && editingMessage.attachments && editingMessage.attachments.length > 0 && (
                                    <div className="mt-6 space-y-3 w-full">
                                        <p className="font-semibold text-gray-700 text-sm sm:text-base">📂 Existing attachments:</p>
                                        {editingMessage.attachments.map((attachment, index) => (
                                            <div key={index} className="flex items-center justify-between bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 w-full">
                                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                                    <span className="text-green-600 flex-shrink-0">📎</span>
                                                    <a
                                                        href={attachment.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs sm:text-sm text-blue-600 hover:underline font-medium truncate"
                                                    >
                                                        {attachment.filename}
                                                    </a>
                                                    <span className="text-xs text-gray-500 flex-shrink-0">({attachment.type})</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingAttachment(editingMessage._id, index)}
                                                    className="text-red-500 hover:text-red-700 text-xs sm:text-sm bg-red-50 px-2 sm:px-3 py-1 rounded-lg hover:bg-red-100 transition-colors duration-200 flex-shrink-0 ml-2"
                                                >
                                                    ❌ Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-base sm:text-lg"
                            >
                                {editingMessage ? '💾 Update Message' : '🚀 Create Message'}
                            </button>
                        </form>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                        <span className="ml-3 text-gray-600 text-sm sm:text-base">Loading messages...</span>
                    </div>
                ) : (
                    <div className="space-y-6 w-full">
                        {messages.map((msg, index) => (
                            <div
                                key={msg._id}
                                className="bg-gradient-to-br from-white to-gray-50 p-4 sm:p-8 rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl hover:border-green-200 transform hover:scale-[1.01] transition-all duration-300 animate-fade-in-up w-full"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex flex-col gap-6 w-full">
                                    <div className="flex-1 w-full">
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 break-words">{msg.title}</h3>
                                            <span className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${getPriorityColor(msg.priority)} flex items-center gap-1 sm:gap-2 whitespace-nowrap`}>
                                                {getPriorityIcon(msg.priority)} {msg.priority.toUpperCase()}
                                            </span>
                                            <span className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${msg.isActive ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-800 border border-gray-300'} flex items-center gap-1 sm:gap-2 whitespace-nowrap`}>
                                                {msg.isActive ? '✅ Active' : '⏸️ Inactive'}
                                            </span>
                                        </div>

                                        <p className="text-sm sm:text-base text-gray-700 mb-6 leading-relaxed bg-gray-50 p-3 sm:p-4 rounded-xl border-l-4 border-green-400 break-words whitespace-pre-wrap">
                                            {msg.message}
                                            {/* Display Link Sources */}
                                            {extractLinks(msg.message).length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {extractLinks(msg.message).map((link, idx) => {
                                                        const source = getLinkSource(link);
                                                        const colorClass = getSourceColor(source);
                                                        return (
                                                            <a
                                                                key={idx}
                                                                href={link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${colorClass} hover:opacity-80 transition-opacity`}
                                                            >
                                                                🔗 {source}
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </p>

                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="mb-6 w-full">
                                                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                    📎 Attachments:
                                                </p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 w-full">
                                                    {msg.attachments.map((attachment, idx) => (
                                                        <div key={idx} className="relative group transform hover:scale-105 transition-transform duration-200">
                                                            {attachment.type === 'image' ? (
                                                                <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
                                                                    <img
                                                                        src={attachment.url}
                                                                        alt={attachment.filename}
                                                                        className="w-full h-24 sm:h-28 object-cover rounded-xl border-2 border-gray-200 group-hover:border-green-400 transition-all duration-300 shadow-md"
                                                                        onError={(e) => {
                                                                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2YzZjNmMyIvPjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==';
                                                                        }}
                                                                    />
                                                                </a>
                                                            ) : (
                                                                <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
                                                                    <div className="w-full h-24 sm:h-28 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl border-2 border-gray-200 group-hover:border-blue-400 transition-all duration-300 shadow-md flex items-center justify-center">
                                                                        <div className="text-center">
                                                                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                            <span className="text-xs text-blue-700 font-medium">Video</span>
                                                                        </div>
                                                                    </div>
                                                                </a>
                                                            )}
                                                            <p className="text-xs text-gray-600 mt-2 truncate text-center" title={attachment.filename}>
                                                                {attachment.filename}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
                                            <span className="flex items-center gap-1 sm:gap-2 bg-gray-100 px-2 sm:px-3 py-1 sm:py-2 rounded-lg whitespace-nowrap">
                                                🎯 <strong>{msg.targetType}</strong>
                                            </span>
                                            <span className="flex items-center gap-1 sm:gap-2 bg-gray-100 px-2 sm:px-3 py-1 sm:py-2 rounded-lg whitespace-nowrap">
                                                📅 Created: {new Date(msg.createdAt).toLocaleDateString()}
                                            </span>
                                            {msg.expiresAt && (
                                                <span className="flex items-center gap-1 sm:gap-2 bg-orange-100 px-2 sm:px-3 py-1 sm:py-2 rounded-lg whitespace-nowrap">
                                                    ⏰ Expires: {new Date(msg.expiresAt).toLocaleDateString()}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 sm:gap-2 bg-blue-100 px-2 sm:px-3 py-1 sm:py-2 rounded-lg whitespace-nowrap">
                                                👁️ Read by: <strong>{msg.readBy.length}</strong> users
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                                        <button
                                            onClick={() => toggleActive(msg._id, msg.isActive)}
                                            className={`w-full px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base ${msg.isActive ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'}`}
                                        >
                                            {msg.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(msg)}
                                            className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(msg._id)}
                                            className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {messages.length === 0 && !showForm && (
                            <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl border border-gray-200 animate-pulse w-full">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                                    <span className="text-3xl sm:text-4xl">📨</span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-3">No messages yet</h3>
                                <p className="text-sm sm:text-base text-gray-600 mb-6">Create your first message to get started!</p>
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                                >
                                    ✨ Create First Message
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminMessages;
