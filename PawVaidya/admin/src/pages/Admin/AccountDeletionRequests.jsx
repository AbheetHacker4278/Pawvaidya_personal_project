import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle,
    XCircle,
    Clock,
    User,
    Mail,
    AlertCircle,
    MessageSquare,
    Calendar,
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
    ShieldAlert
} from 'lucide-react';

const AccountDeletionRequests = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [responseAction, setResponseAction] = useState(''); // 'Approved' or 'Rejected'
    const [adminNote, setAdminNote] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const scrollContainerRef = React.useRef(null);

    useEffect(() => {
        fetchDeletionRequests();
    }, []);

    useEffect(() => {
        filterRequests();
    }, [requests, filterStatus, searchTerm]);

    const fetchDeletionRequests = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(backendurl + '/api/admin/deletion-requests', {
                headers: { atoken }
            });

            if (data.success) {
                setRequests(data.requests);
            }
        } catch (error) {
            console.error('Error fetching deletion requests:', error);
            toast.error('Failed to fetch deletion requests');
        } finally {
            setLoading(false);
        }
    };

    const filterRequests = () => {
        let filtered = requests;

        if (filterStatus !== 'all') {
            filtered = filtered.filter(req => req.status === filterStatus);
        }

        if (searchTerm) {
            filtered = filtered.filter(req =>
                req.userId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.userId?.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredRequests(filtered);
    };

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
        }
    };

    const handleApprove = (request) => {
        setSelectedRequest(request);
        setResponseAction('Approved');
        setAdminNote('Your account has been deleted as requested.');
        setShowResponseModal(true);
    };

    const handleReject = (request) => {
        setSelectedRequest(request);
        setResponseAction('Rejected');
        setAdminNote('Your deletion request has been rejected. Please contact support for more information.');
        setShowResponseModal(true);
    };

    const submitResponse = async () => {
        try {
            const { data } = await axios.post(
                backendurl + '/api/admin/process-deletion',
                {
                    requestId: selectedRequest._id,
                    status: responseAction,
                    adminNote
                },
                { headers: { atoken } }
            );

            if (data.success) {
                toast.success(data.message);
                setShowResponseModal(false);
                setAdminNote('');
                setSelectedRequest(null);
                fetchDeletionRequests();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error processing request:', error);
            toast.error('Failed to process request');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            Pending: {
                bg: 'bg-yellow-100',
                text: 'text-yellow-800',
                icon: <Clock className="w-4 h-4" />,
                label: 'Pending'
            },
            Approved: {
                bg: 'bg-green-100',
                text: 'text-green-800',
                icon: <CheckCircle className="w-4 h-4" />,
                label: 'Deleted'
            },
            Rejected: {
                bg: 'bg-red-100',
                text: 'text-red-800',
                icon: <XCircle className="w-4 h-4" />,
                label: 'Rejected'
            }
        };

        const badge = badges[status];
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                {badge.icon}
                {badge.label}
            </span>
        );
    };

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'Pending').length,
        approved: requests.filter(r => r.status === 'Approved').length,
        rejected: requests.filter(r => r.status === 'Rejected').length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading deletion requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-2">
                    <ShieldAlert size={32} className="text-red-600" />
                    <h1 className="text-3xl font-bold text-gray-800">Account Deletion Requests</h1>
                </div>
                <p className="text-gray-600">Review and process user account deletion requests</p>
            </motion.div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
                >
                    <p className="text-gray-600 text-sm mb-1">Total Requests</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-yellow-50 p-6 rounded-xl shadow-md border border-yellow-200"
                >
                    <p className="text-yellow-700 text-sm mb-1">Pending Review</p>
                    <p className="text-3xl font-bold text-yellow-800">{stats.pending}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-green-50 p-6 rounded-xl shadow-md border border-green-200"
                >
                    <p className="text-green-700 text-sm mb-1">Accounts Deleted</p>
                    <p className="text-3xl font-bold text-green-800">{stats.approved}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-red-50 p-6 rounded-xl shadow-md border border-red-200"
                >
                    <p className="text-red-700 text-sm mb-1">Rejected</p>
                    <p className="text-3xl font-bold text-red-800">{stats.rejected}</p>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-md mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-gray-600 w-5 h-5" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Deleted</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Requests List */}
            <div className="relative">
                {filteredRequests.length > 0 && (
                    <>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={scrollLeft}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all border-2 border-gray-200"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-700" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={scrollRight}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all border-2 border-gray-200"
                        >
                            <ChevronRight className="w-6 h-6 text-gray-700" />
                        </motion.button>
                    </>
                )}

                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto pb-4 px-12 scroll-smooth"
                    style={{ scrollbarWidth: 'thin' }}
                >
                    <AnimatePresence>
                        {filteredRequests.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white p-12 rounded-xl shadow-md text-center w-full"
                            >
                                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg">No deletion requests found</p>
                            </motion.div>
                        ) : (
                            filteredRequests.map((request, index) => (
                                <motion.div
                                    key={request._id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition flex-shrink-0 w-[500px] md:w-[600px]"
                                >
                                    <div className="flex flex-col justify-between gap-4 h-full">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <User className="w-5 h-5 text-gray-600" />
                                                        <h3 className="text-lg font-bold text-gray-800">{request.userId?.name || "Deleted User"}</h3>
                                                    </div>
                                                    {request.userId && (
                                                        <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                                                            <Mail className="w-4 h-4" />
                                                            {request.userId.email}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                                        <Calendar className="w-4 h-4" />
                                                        Requested On: {new Date(request.requestedAt).toLocaleString()}
                                                    </div>
                                                </div>
                                                {getStatusBadge(request.status)}
                                            </div>

                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <MessageSquare className="w-4 h-4 text-blue-600" />
                                                    <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Reason for Deletion:</p>
                                                </div>
                                                <p className="text-sm text-blue-800 italic">"{request.reason}"</p>
                                            </div>

                                            {(request.adminNote || request.processedAt) && (
                                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-3">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-xs text-gray-600 font-semibold">Admin Response:</p>
                                                        {request.processedAt && (
                                                            <span className="text-[10px] text-gray-400">Processed: {new Date(request.processedAt).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-800">{request.adminNote || "No note provided."}</p>
                                                </div>
                                            )}
                                        </div>

                                        {request.status === 'Pending' && (
                                            <div className="flex gap-2 mt-4">
                                                <button
                                                    onClick={() => handleApprove(request)}
                                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
                                                >
                                                    < ShieldAlert className="w-4 h-4" />
                                                    Approve Deletion
                                                </button>
                                                <button
                                                    onClick={() => handleReject(request)}
                                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject Request
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Action Modal */}
            {showResponseModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-3 rounded-xl ${responseAction === 'Approved' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                {responseAction === 'Approved' ? <AlertCircle size={24} /> : <XCircle size={24} />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">
                                    {responseAction === 'Approved' ? 'Approve' : 'Reject'} Request
                                </h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">User: {selectedRequest?.userId?.name}</p>
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-4">
                            {responseAction === 'Approved'
                                ? 'WARNING: This will permanently delete the user account and all their records.'
                                : 'Provide a reason for rejecting this deletion request.'}
                        </p>

                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Admin Response Note</label>
                        <textarea
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="Enter your response for the user..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-32"
                        />

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowResponseModal(false);
                                    setAdminNote('');
                                    setSelectedRequest(null);
                                }}
                                className="flex-1 px-4 py-3 bg-gray-50 text-gray-500 font-bold rounded-lg hover:bg-gray-100 transition border-2 border-transparent"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitResponse}
                                className={`flex-1 px-4 py-3 text-white font-bold rounded-lg hover:shadow-lg transition ${responseAction === 'Approved'
                                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                                    : 'bg-gray-800 hover:bg-gray-900'
                                    }`}
                            >
                                Confirm {responseAction}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AccountDeletionRequests;
