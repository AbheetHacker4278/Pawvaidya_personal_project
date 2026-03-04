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
  ChevronRight
} from 'lucide-react';

const UnbanRequests = () => {
  const { atoken, backendurl } = useContext(AdminContext);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseAction, setResponseAction] = useState(''); // 'approve' or 'deny'
  const [adminResponse, setAdminResponse] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const scrollContainerRef = React.useRef(null);

  useEffect(() => {
    fetchUnbanRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, filterStatus, searchTerm]);

  const fetchUnbanRequests = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(backendurl + '/api/unban-request/all', {
        headers: { atoken }
      });

      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching unban requests:', error);
      toast.error('Failed to fetch unban requests');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requesterEmail.toLowerCase().includes(searchTerm.toLowerCase())
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
    setResponseAction('approve');
    setAdminResponse('Your unban request has been approved. Welcome back!');
    setShowResponseModal(true);
  };

  const handleDeny = (request) => {
    setSelectedRequest(request);
    setResponseAction('deny');
    setAdminResponse('Your unban request has been denied.');
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!adminResponse.trim()) {
      toast.warn('Please provide a response message');
      return;
    }

    try {
      const endpoint = responseAction === 'approve'
        ? '/api/unban-request/approve'
        : '/api/unban-request/deny';

      const { data } = await axios.post(
        backendurl + endpoint,
        {
          requestId: selectedRequest._id,
          adminResponse
        },
        { headers: { atoken } }
      );

      if (data.success) {
        toast.success(data.message);
        setShowResponseModal(false);
        setAdminResponse('');
        setSelectedRequest(null);
        fetchUnbanRequests();
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
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <Clock className="w-4 h-4" />,
        label: 'Pending'
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Approved'
      },
      denied: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <XCircle className="w-4 h-4" />,
        label: 'Denied'
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
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    denied: requests.filter(r => r.status === 'denied').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading unban requests...</p>
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Unban Requests</h1>
        <p className="text-gray-600">Review and manage user unban requests</p>
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
          <p className="text-yellow-700 text-sm mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-800">{stats.pending}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-green-50 p-6 rounded-xl shadow-md border border-green-200"
        >
          <p className="text-green-700 text-sm mb-1">Approved</p>
          <p className="text-3xl font-bold text-green-800">{stats.approved}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-red-50 p-6 rounded-xl shadow-md border border-red-200"
        >
          <p className="text-red-700 text-sm mb-1">Denied</p>
          <p className="text-3xl font-bold text-red-800">{stats.denied}</p>
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="relative">
        {/* Scroll Navigation Buttons */}
        {filteredRequests.length > 0 && (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all border-2 border-gray-200"
              title="Scroll Left"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all border-2 border-gray-200"
              title="Scroll Right"
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
                <p className="text-gray-600 text-lg">No unban requests found</p>
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
                            <h3 className="text-lg font-bold text-gray-800">{request.requesterName}</h3>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              {request.requesterType}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                            <Mail className="w-4 h-4" />
                            {request.requesterEmail}
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <Calendar className="w-4 h-4" />
                            {new Date(request.createdAt).toLocaleString()}
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                        <p className="text-xs text-red-600 font-semibold mb-1">Original Ban Reason:</p>
                        <p className="text-sm text-red-800">{request.banReason}</p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <p className="text-xs text-blue-600 font-semibold">Request Message:</p>
                        </div>
                        <p className="text-sm text-blue-800">{request.requestMessage}</p>
                      </div>

                      {request.adminResponse && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-3">
                          <p className="text-xs text-gray-600 font-semibold mb-1">Admin Response:</p>
                          <p className="text-sm text-gray-800">{request.adminResponse}</p>
                        </div>
                      )}
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleApprove(request)}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleDeny(request)}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Deny
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

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {responseAction === 'approve' ? 'Approve' : 'Deny'} Unban Request
            </h3>

            <p className="text-gray-600 mb-4">
              Provide a response message for <strong>{selectedRequest?.requesterName}</strong>
            </p>

            <textarea
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              placeholder="Enter your response..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows="4"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setAdminResponse('');
                  setSelectedRequest(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitResponse}
                className={`flex-1 px-4 py-3 text-white font-semibold rounded-lg hover:shadow-lg transition ${responseAction === 'approve'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                  : 'bg-gradient-to-r from-red-500 to-red-600'
                  }`}
              >
                Confirm {responseAction === 'approve' ? 'Approval' : 'Denial'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UnbanRequests;
