import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets_admin/assets';

const BroadcastEmail = () => {
    const { sendBroadcastEmail, sendIndividualEmail, users, doctors, getallusers, getalldoctors } = useContext(AdminContext);

    const [target, setTarget] = useState('users');
    const [individualEmail, setIndividualEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);

    // Search and Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [listFilter, setListFilter] = useState('all'); // 'all', 'users', 'doctors'

    useEffect(() => {
        if (users.length === 0) getallusers();
        if (doctors.length === 0) getalldoctors();
    }, []);

    const filteredRecipients = useMemo(() => {
        let combined = [];
        if (listFilter === 'all' || listFilter === 'users') {
            combined = [...combined, ...users.map(u => ({ ...u, type: 'user' }))];
        }
        if (listFilter === 'all' || listFilter === 'doctors') {
            combined = [...combined, ...doctors.map(d => ({ ...d, type: 'doctor' }))];
        }

        return combined.filter(r =>
            (r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (r.email && r.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [users, doctors, listFilter, searchTerm]);

    const handleFileChange = (e) => {
        setAttachments(Array.from(e.target.files));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!subject.trim() || !message.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        if (target === 'individual' && !individualEmail.trim()) {
            toast.error("Please enter recipient email");
            return;
        }

        const confirmationMsg = target === 'individual'
            ? `Are you sure you want to send this email to ${individualEmail}?`
            : `Are you sure you want to send this broadcast email to ${target.toUpperCase()}?`;

        if (window.confirm(confirmationMsg)) {
            setLoading(true);

            // Create FormData
            const formData = new FormData();
            if (target === 'individual') {
                formData.append('email', individualEmail);
            } else {
                formData.append('target', target);
            }
            formData.append('subject', subject);
            formData.append('message', message);

            // Append files
            attachments.forEach(file => {
                formData.append('attachments', file);
            });

            const success = target === 'individual'
                ? await sendIndividualEmail(formData)
                : await sendBroadcastEmail(formData);

            setLoading(false);

            if (success) {
                setSubject('');
                setMessage('');
                setAttachments([]);
                setIndividualEmail('');
                setTarget('users');
                // Reset file input
                if (document.getElementById('file-upload')) {
                    document.getElementById('file-upload').value = '';
                }
            }
        }
    };

    return (
        <div className="m-5 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-green-100 p-3 rounded-xl">
                        <img
                            src={assets.email_icon || "https://cdn-icons-png.flaticon.com/512/552/552486.png"}
                            alt="Broadcast"
                            className="w-8 h-8 text-green-600"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Broadcast Email</h1>
                        <p className="text-sm text-gray-500 mt-1">Send announcements to Users, Doctors, or Everyone</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Target Audience */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider block">
                            Target Audience
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {['users', 'doctors', 'all', 'individual'].map((type) => (
                                <label
                                    key={type}
                                    className={`relative flex items-center justify-center p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 ${target === type
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-200 hover:border-green-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="target"
                                        value={type}
                                        checked={target === type}
                                        onChange={(e) => setTarget(e.target.value)}
                                        className="absolute opacity-0 w-full h-full cursor-pointer"
                                    />
                                    <span className="font-semibold capitalize">
                                        {type === 'all' ? 'Everyone' : type}
                                    </span>
                                    {target === type && (
                                        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Individual Email Field with Search */}
                    {target === 'individual' && (
                        <div className="space-y-4 animate-fadeIn relative">
                            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider block">
                                Recipient Selection
                            </label>

                            {/* Search Input and Filters */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                        placeholder="Search by name or email..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200"
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <div className="flex bg-gray-100 p-1 rounded-xl h-[50px]">
                                    {['all', 'users', 'doctors'].map((f) => (
                                        <button
                                            key={f}
                                            type="button"
                                            onClick={() => setListFilter(f)}
                                            className={`px-4 rounded-lg text-sm font-medium transition-all duration-200 ${listFilter === f
                                                ? 'bg-white text-green-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dropdown List */}
                            {showDropdown && (searchTerm || showDropdown) && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden animate-slideDown">
                                    <div className="p-2 sticky top-0 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-400 uppercase ml-2">
                                            {filteredRecipients.length} {listFilter === 'all' ? 'Recipients' : listFilter} Found
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShowDropdown(false)}
                                            className="text-xs text-green-600 hover:text-green-700 font-bold px-2 py-1"
                                        >
                                            Close
                                        </button>
                                    </div>
                                    {filteredRecipients.length > 0 ? (
                                        filteredRecipients.map((rec) => (
                                            <div
                                                key={rec._id}
                                                onClick={() => {
                                                    setIndividualEmail(rec.email);
                                                    setSearchTerm(rec.email);
                                                    setShowDropdown(false);
                                                }}
                                                className="p-3 hover:bg-green-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 flex items-center gap-3"
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${rec.type === 'doctor' ? 'bg-blue-400' : 'bg-green-400'
                                                    }`}>
                                                    {rec.name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-gray-800 truncate">{rec.name}</div>
                                                    <div className="text-xs text-gray-500 truncate">{rec.email}</div>
                                                </div>
                                                <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${rec.type === 'doctor' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                                    }`}>
                                                    {rec.type}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-500 italic">
                                            No {listFilter === 'all' ? 'Users or Doctors' : listFilter} found matching "{searchTerm}"
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Selected Recipient Confirmation */}
                            {individualEmail && !showDropdown && (
                                <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-r-xl flex items-center justify-between animate-fadeIn">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-500 p-2 rounded-lg">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Sending To:</p>
                                            <p className="text-sm font-medium text-green-700">{individualEmail}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIndividualEmail('');
                                            setSearchTerm('');
                                        }}
                                        className="text-xs text-green-700 hover:underline font-bold"
                                    >
                                        Change
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Subject */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider block">
                            Email Subject
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Important Announcement..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200"
                            required
                        />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider block">
                            Message Content
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows="8"
                            placeholder="Type your message here..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 resize-none font-sans"
                            required
                        />
                    </div>

                    {/* Attachments */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider block">
                            Attachments (Optional)
                        </label>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-200">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                    </svg>
                                    <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-gray-500">Any file type supported</p>
                                </div>
                                <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                        {attachments.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-sm font-semibold text-gray-700">Selected Files:</p>
                                <ul className="space-y-1">
                                    {attachments.map((file, index) => (
                                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            <span className="truncate">{file.name}</span>
                                            <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-200'
                            }`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                {target === 'individual' ? 'Sending Email...' : 'Sending Broadcast...'}
                            </div>
                        ) : (
                            target === 'individual' ? 'Send Individual Email' : 'Send Broadcast Email'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BroadcastEmail;
