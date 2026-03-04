import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { DoctorContext } from '../../context/DoctorContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Flag, Filter, Eye, Ban, TrendingUp, AlertTriangle, Trash2, Check, CheckSquare, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import ReportDetailModal from '../../components/ReportDetailModal';

const AllReports = () => {
  const { atoken, users, doctors, getallusers, getalldoctors } = useContext(AdminContext);
  const { backendurl } = useContext(DoctorContext);

  const [reports, setReports] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [statusFilter, setStatusFilter] = useState(''); // Empty string = All Status
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);
  const [showTrash, setShowTrash] = useState(false);

  useEffect(() => {
    if (atoken) {
      fetchReports();
      fetchStatistics();
    }
  }, [atoken, statusFilter]);

  useEffect(() => {
    if (atoken) {
      getallusers();
      getalldoctors();
    }
  }, [atoken]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const url = statusFilter
        ? `${backendurl}/api/report/all?status=${statusFilter}`
        : `${backendurl}/api/report/all`;

      console.log('Fetching reports from:', url);
      console.log('Using token:', atoken ? 'Token exists' : 'No token');

      const { data } = await axios.get(url, {
        headers: { atoken }
      });

      console.log('Reports response:', data);

      if (data.success) {
        setReports(data.reports);
        console.log('Reports loaded:', data.reports.length);
      } else {
        console.error('Failed to fetch reports:', data.message);
        toast.error(data.message || 'Failed to load reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const { data } = await axios.get(
        `${backendurl}/api/report/statistics/overview`,
        { headers: { atoken } }
      );

      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Toggle select report
  const toggleSelectReport = (reportId) => {
    setSelectedReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  // Select all reports
  const toggleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(r => r._id));
    }
  };

  // Mark as read
  const markAsRead = async (reportIds) => {
    try {
      const { data } = await axios.post(
        `${backendurl}/api/report/mark-read`,
        { reportIds },
        { headers: { atoken } }
      );

      if (data.success) {
        toast.success('Reports marked as read');
        fetchReports();
        setSelectedReports([]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  // Move to trash
  const moveToTrash = async (reportIds) => {
    try {
      const { data } = await axios.post(
        `${backendurl}/api/report/trash`,
        { reportIds },
        { headers: { atoken } }
      );

      if (data.success) {
        toast.success('Reports moved to trash');
        fetchReports();
        setSelectedReports([]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error moving to trash:', error);
      toast.error('Failed to move to trash');
    }
  };

  // Delete permanently
  const deleteReports = async (reportIds) => {
    if (!window.confirm('Are you sure you want to permanently delete these reports?')) {
      return;
    }

    try {
      const { data } = await axios.post(
        `${backendurl}/api/report/delete`,
        { reportIds },
        { headers: { atoken } }
      );

      if (data.success) {
        toast.success('Reports deleted permanently');
        fetchReports();
        setSelectedReports([]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error deleting reports:', error);
      toast.error('Failed to delete reports');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonLabel = (reason) => {
    return reason.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getReportedEntity = (reportedType, reportedId) => {
    if (reportedType === 'user') {
      return users.find(u => u._id === reportedId);
    }
    return doctors.find(d => d._id === reportedId);
  };

  const getBannedBadge = (entity) => {
    if (!entity) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">Unknown</span>
      );
    }
    if (entity.isBanned) {
      return (
        <span title={entity.banReason || 'Banned'} className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Banned</span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Active</span>
    );
  };

  return (
    <div className="p-6 w-full max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Flag className="w-8 h-8 text-red-600" />
          Reports Management
        </h1>
        <p className="text-gray-600 mt-2">
          Review and manage user and doctor reports
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Pending Reports</p>
                <p className="text-3xl font-bold mt-2">{statistics.pendingReports}</p>
              </div>
              <Flag className="w-12 h-12 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Under Review</p>
                <p className="text-3xl font-bold mt-2">{statistics.underReviewReports}</p>
              </div>
              <Eye className="w-12 h-12 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-red-500 to-rose-500 text-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Banned Accounts</p>
                <p className="text-3xl font-bold mt-2">
                  {statistics.bannedUsers + statistics.bannedDoctors}
                </p>
              </div>
              <Ban className="w-12 h-12 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Reports</p>
                <p className="text-3xl font-bold mt-2">{statistics.totalReports}</p>
              </div>
              <TrendingUp className="w-12 h-12 opacity-50" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-4 items-center">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          {/* Action Buttons */}
          {selectedReports.length > 0 && (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600 mr-2">
                {selectedReports.length} selected
              </span>
              <button
                onClick={() => markAsRead(selectedReports)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Mark as Read
              </button>
              <button
                onClick={() => moveToTrash(selectedReports)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Move to Trash
              </button>
              <button
                onClick={() => deleteReports(selectedReports)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Banned Accounts */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Banned Accounts</h2>
          <p className="text-sm text-gray-500">Users and Doctors currently banned from the platform</p>
        </div>
        <div className="overflow-x-auto">
          {(() => {
            const bannedUsers = (users || []).filter(u => u.isBanned);
            const bannedDoctors = (doctors || []).filter(d => d.isBanned);
            const bannedAccounts = [
              ...bannedUsers.map(u => ({
                _id: u._id,
                _type: 'user',
                name: u.name,
                email: u.email,
                reason: u.banReason,
                bannedAt: u.bannedAt,
                unbanAt: u.unbanAt,
              })),
              ...bannedDoctors.map(d => ({
                _id: d._id,
                _type: 'doctor',
                name: d.name,
                email: d.email,
                reason: d.banReason,
                bannedAt: d.bannedAt,
                unbanAt: d.unbanAt,
              })),
            ];

            if (bannedAccounts.length === 0) {
              return (
                <div className="text-center py-12 text-gray-500">
                  <Ban className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">No banned accounts</p>
                  <p className="text-sm mt-2">Banned users or doctors will appear here</p>
                </div>
              );
            }

            return (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Reason</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Banned At</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Auto-unban</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bannedAccounts.map(acc => (
                    <tr key={acc._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {acc._type === 'user' ? 'User' : 'Doctor'}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">{acc.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">ID: {acc._id?.substring(0, 8)}...</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{acc.email || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          {acc.reason || 'Not specified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {acc.bannedAt ? new Date(acc.bannedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {acc.unbanAt ? new Date(acc.unbanAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading reports...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {selectedReports.length === reports.length && reports.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Reporter
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Reported
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Banned
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Reason
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSelectReport(report._id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {selectedReports.includes(report._id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {report.reporterType === 'user' ? 'User' : 'Doctor'}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {report.reporterId?.substring(0, 8)}...
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {report.reportedType === 'user' ? 'User' : 'Doctor'}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {report.reportedId?.substring(0, 8)}...
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getBannedBadge(getReportedEntity(report.reportedType, report.reportedId))}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {getReasonLabel(report.reason)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {reports.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Flag className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">No reports found</p>
                <p className="text-sm mt-2">Reports will appear here when users or doctors submit them</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdate={() => {
            fetchReports();
            fetchStatistics();
          }}
        />
      )}
    </div>
  );
};

export default AllReports;
