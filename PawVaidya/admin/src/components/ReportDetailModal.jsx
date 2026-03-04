import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ban, CheckCircle, XCircle, AlertTriangle, FileText, Calendar, User } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/DoctorContext';

const ReportDetailModal = ({ report, onClose, onUpdate }) => {
  const { atoken, adminData } = useContext(AdminContext);
  const { backendurl } = useContext(DoctorContext);

  const [status, setStatus] = useState(report.status);
  const [adminNotes, setAdminNotes] = useState(report.adminNotes || '');
  const [actionTaken, setActionTaken] = useState(report.actionTaken || 'none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [banTarget, setBanTarget] = useState(null); // 'reporter' or 'reported'
  const [reporterDetails, setReporterDetails] = useState(null);
  const [reportedDetails, setReportedDetails] = useState(null);
  const [blogDetails, setBlogDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  // Fetch user/doctor details
  React.useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoadingDetails(true);

        // Fetch reporter details
        const reporterEndpoint = report.reporterType === 'user'
          ? `${backendurl}/api/user/profile/${report.reporterId}`
          : `${backendurl}/api/doctor/profile/${report.reporterId}`;

        // Fetch reported person details
        const reportedEndpoint = report.reportedType === 'user'
          ? `${backendurl}/api/user/profile/${report.reportedId}`
          : `${backendurl}/api/doctor/profile/${report.reportedId}`;

        const [reporterRes, reportedRes] = await Promise.all([
          axios.get(reporterEndpoint, { headers: { atoken } }).catch(() => null),
          axios.get(reportedEndpoint, { headers: { atoken } }).catch(() => null)
        ]);

        if (reporterRes?.data) setReporterDetails(reporterRes.data);
        if (reportedRes?.data) setReportedDetails(reportedRes.data);

        // Fetch blog details if applicable
        if (report.blogId) {
          const { data } = await axios.get(`${backendurl}/api/user/blogs/${report.blogId}`, { headers: { atoken } });
          if (data?.success) setBlogDetails(data.blog);
        }
      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [report, backendurl, atoken]);

  const handleUpdateStatus = async () => {
    try {
      setIsSubmitting(true);
      const { data } = await axios.put(
        `${backendurl}/api/report/update-status`,
        {
          reportId: report._id,
          status,
          adminNotes,
          actionTaken,
          adminId: adminData?._id || 'admin'
        },
        { headers: { atoken } }
      );

      if (data.success) {
        toast.success('Report updated successfully');
        onUpdate();
        onClose();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBanAccount = async () => {
    try {
      setIsSubmitting(true);

      const targetType = banTarget === 'reporter' ? report.reporterType : report.reportedType;
      const targetId = banTarget === 'reporter' ? report.reporterId : report.reportedId;

      const endpoint = targetType === 'user'
        ? `${backendurl}/api/report/ban-user`
        : `${backendurl}/api/report/ban-doctor`;

      const { data } = await axios.post(
        endpoint,
        {
          [targetType === 'user' ? 'userId' : 'doctorId']: targetId,
          reason: `Banned due to report: ${report.reason}`,
          adminId: adminData?._id || 'admin'
        },
        { headers: { atoken } }
      );

      if (data.success) {
        toast.success(data.message);
        if (banTarget === 'reported') {
          setActionTaken('permanent_ban');
          setStatus('resolved');
        }
        setShowBanConfirm(false);
        setBanTarget(null);
        onUpdate();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error banning account:', error);
      toast.error('Failed to ban account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnbanAccount = async (targetType, targetId, targetName) => {
    try {
      setIsSubmitting(true);

      const endpoint = targetType === 'user'
        ? `${backendurl}/api/report/unban-user`
        : `${backendurl}/api/report/unban-doctor`;

      const { data } = await axios.post(
        endpoint,
        {
          [targetType === 'user' ? 'userId' : 'doctorId']: targetId
        },
        { headers: { atoken } }
      );

      if (data.success) {
        toast.success(`${targetName} has been unbanned successfully`);
        onUpdate();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error unbanning account:', error);
      toast.error('Failed to unban account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) return;
    try {
      setIsSubmitting(true);
      const { data } = await axios.post(
        `${backendurl}/api/report/delete-post`,
        {
          blogId: report.blogId,
          reportId: report._id,
          adminId: adminData?._id || 'admin'
        },
        { headers: { atoken } }
      );

      if (data.success) {
        toast.success(data.message);
        setStatus('resolved');
        setActionTaken('post_deleted');
        onUpdate();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReasonLabel = (reason) => {
    return reason.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Report Details</h2>
                <p className="text-blue-100 text-sm mt-1">Review and take action on this report</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Report Info Cards */}
            <div className="grid grid-cols-2 gap-6">
              {/* Reporter */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">Reporter</h3>
                </div>
                {isLoadingDetails ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : reporterDetails ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-gray-800">{reporterDetails.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-semibold text-gray-800 capitalize">{report.reporterType}</p>
                    </div>
                    {report.reporterType === 'user' && (
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="text-sm text-gray-700">
                          {reporterDetails.address?.Location || reporterDetails.full_address || 'Not provided'}
                        </p>
                      </div>
                    )}
                    {report.reporterType === 'doctor' && (
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="text-sm text-gray-700">
                          {reporterDetails.full_address || reporterDetails.address?.line1 || 'Not provided'}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-xs text-gray-700">{reporterDetails.email || 'N/A'}</p>
                    </div>
                    {reporterDetails.isBanned ? (
                      <div className="mt-3 space-y-2">
                        <div className="px-3 py-2 bg-red-100 border border-red-300 rounded-lg">
                          <p className="text-xs font-semibold text-red-800">⚠️ Already Banned</p>
                          <p className="text-xs text-red-600 mt-1">{reporterDetails.banReason}</p>
                        </div>
                        <button
                          onClick={() => handleUnbanAccount(
                            report.reporterType,
                            report.reporterId,
                            reporterDetails.name
                          )}
                          disabled={isSubmitting}
                          className="w-full px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Unban {report.reporterType === 'user' ? 'User' : 'Doctor'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setBanTarget('reporter');
                          setShowBanConfirm(true);
                        }}
                        className="mt-3 w-full px-3 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                      >
                        <Ban className="w-4 h-4" />
                        Ban {report.reporterType === 'user' ? 'User' : 'Doctor'}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Unable to load details</p>
                )}
              </div>

              {/* Reported */}
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-gray-800">Reported Person</h3>
                </div>
                {isLoadingDetails ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  </div>
                ) : reportedDetails ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-gray-800">{reportedDetails.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-semibold text-gray-800 capitalize">{report.reportedType}</p>
                    </div>
                    {report.reportedType === 'user' && (
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="text-sm text-gray-700">
                          {reportedDetails.address?.Location || reportedDetails.full_address || 'Not provided'}
                        </p>
                      </div>
                    )}
                    {report.reportedType === 'doctor' && (
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="text-sm text-gray-700">
                          {reportedDetails.full_address || reportedDetails.address?.line1 || 'Not provided'}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-xs text-gray-700">{reportedDetails.email || 'N/A'}</p>
                    </div>
                    {reportedDetails.isBanned ? (
                      <div className="mt-3 space-y-2">
                        <div className="px-3 py-2 bg-red-100 border border-red-300 rounded-lg">
                          <p className="text-xs font-semibold text-red-800">⚠️ Already Banned</p>
                          <p className="text-xs text-red-600 mt-1">{reportedDetails.banReason}</p>
                        </div>
                        <button
                          onClick={() => handleUnbanAccount(
                            report.reportedType,
                            report.reportedId,
                            reportedDetails.name
                          )}
                          disabled={isSubmitting}
                          className="w-full px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Unban {report.reportedType === 'user' ? 'User' : 'Doctor'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setBanTarget('reported');
                          setShowBanConfirm(true);
                        }}
                        className="mt-3 w-full px-3 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                      >
                        <Ban className="w-4 h-4" />
                        Ban {report.reportedType === 'user' ? 'User' : 'Doctor'}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Unable to load details</p>
                )}
              </div>
            </div>

            {/* Reported Blog Info */}
            {report.blogId && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-800">Reported Blog Details</h3>
                </div>
                {isLoadingDetails ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  </div>
                ) : blogDetails ? (
                  <div className="space-y-2">
                    <p className="font-bold text-gray-800 text-lg leading-tight">{blogDetails.title}</p>
                    <p className="text-sm text-gray-700 line-clamp-4 leading-relaxed bg-white/50 p-3 rounded-lg border border-orange-100">
                      {blogDetails.content}
                    </p>
                    <div className="flex gap-4 mt-3 pt-2">
                      <a
                        href={`http://localhost:5173/blog/${report.blogId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
                      >
                        View Full Post <FileText className="w-4 h-4" />
                      </a>
                      {actionTaken !== 'post_deleted' && (
                        <button
                          onClick={handleDeletePost}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Delete This Post
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-sm text-red-600 font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Blog post may have been already deleted or is inaccessible.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Report Details */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-gray-800">Report Information</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reason</p>
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                    {getReasonLabel(report.reason)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(report.status)}`}>
                    {report.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Submitted On</p>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(report.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
            </div>

            {/* Evidence */}
            {report.evidence && report.evidence.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-3">Evidence Attached</h3>
                <div className="grid grid-cols-3 gap-4">
                  {report.evidence.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition"
                    >
                      <img
                        src={url}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Actions */}
            <div className="border-t-2 border-gray-200 pt-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Admin Actions
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Update Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Action Taken
                  </label>
                  <select
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">None</option>
                    <option value="warning">Warning Issued</option>
                    <option value="temporary_ban">Temporary Ban</option>
                    <option value="permanent_ban">Permanent Ban</option>
                    <option value="account_suspended">Account Suspended</option>
                    <option value="post_deleted">Post Deleted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Admin Notes (Internal)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add your notes about this report investigation..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="4"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateStatus}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating...' : 'Update Report'}
                </button>

                <button
                  onClick={() => {
                    setBanTarget('reported');
                    setShowBanConfirm(true);
                  }}
                  disabled={reportedDetails?.isBanned || isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold rounded-lg hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Ban className="w-5 h-5" />
                  {reportedDetails?.isBanned
                    ? 'Already Banned'
                    : `Ban Reported ${report.reportedType === 'user' ? 'User' : 'Doctor'}`
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Ban Confirmation Modal */}
          {showBanConfirm && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 rounded-2xl">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-white p-6 rounded-xl max-w-md shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Ban className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Confirm Ban
                  </h3>
                </div>
                <div className="mb-6">
                  <p className="text-gray-600 mb-3">
                    Are you sure you want to permanently ban <strong>
                      {banTarget === 'reporter'
                        ? (reporterDetails?.name || 'the reporter')
                        : (reportedDetails?.name || 'the reported person')
                      }
                    </strong>?
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ This action will:
                    </p>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1 ml-4 list-disc">
                      <li>Prevent them from logging in</li>
                      <li>Block all platform access</li>
                      <li>Cancel their active appointments</li>
                      {banTarget === 'reporter' && (
                        <li className="text-orange-700 font-semibold">Mark this report as invalid (false report)</li>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBanConfirm(false)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBanAccount}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Banning...' : 'Yes, Ban Account'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportDetailModal;
