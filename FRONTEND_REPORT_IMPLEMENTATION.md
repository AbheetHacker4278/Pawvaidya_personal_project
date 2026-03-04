# Frontend Report System - Implementation Guide

## ✅ Completed Components

### **1. User Report Modal** 
**File:** `frontend/src/components/ReportModal.jsx`
- ✅ Complete with animations
- ✅ Report reasons dropdown
- ✅ Description textarea
- ✅ Evidence upload
- ✅ Success state
- ✅ Form validation

### **2. Doctor Report Modal**
**File:** `admin/src/components/ReportModal.jsx`
- ✅ Already exists
- ✅ Report submission
- ✅ Form validation

### **3. User Appointments - Report Button**
**File:** `frontend/src/pages/MyAppointments.jsx`
- ✅ Report Doctor button added
- ✅ Orange/red gradient
- ✅ Flag icon
- ✅ Modal integration

---

## ⏳ Remaining Implementation

### **4. Doctor Appointments - Report Button**

**File to Modify:** `admin/src/pages/Doctor/DoctorAppointments.jsx`

**Add Import:**
```javascript
import ReportModal from '../../components/ReportModal';
import { Flag } from 'lucide-react';
```

**Add State:**
```javascript
const [reportAppointment, setReportAppointment] = useState(null);
```

**Add Button (after Chat button):**
```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={() => setReportAppointment(item)}
  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
>
  <Flag className="w-4 h-4" />
  Report User
</motion.button>
```

**Add Modal Rendering (at end):**
```jsx
{/* Report Modal */}
{reportAppointment && (
  <ReportModal
    isOpen={true}
    onClose={() => setReportAppointment(null)}
    reportedId={reportAppointment.userId}
    reportedName={reportAppointment.userData.name}
    reportedType="user"
    reporterId={profileData._id}
    reporterName={profileData.name}
    reporterType="doctor"
    appointmentId={reportAppointment._id}
    token={dtoken}
    backendurl={backendurl}
  />
)}
```

---

### **5. Admin Reports Dashboard**

**File to Create:** `admin/src/pages/Reports/ReportsManagement.jsx`

```jsx
import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { DoctorContext } from '../../context/DoctorContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Flag, Filter, Eye, Ban, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const ReportsManagement = () => {
  const { atoken } = useContext(AdminContext);
  const { backendurl } = useContext(DoctorContext);
  
  const [reports, setReports] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
    fetchStatistics();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const url = statusFilter 
        ? `${backendurl}/api/report/all?status=${statusFilter}`
        : `${backendurl}/api/report/all`;
      
      const { data } = await axios.get(url, {
        headers: { atoken }
      });

      if (data.success) {
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-6 flex gap-4 items-center">
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

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Reporter
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Reported
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
                  <div>
                    <p className="font-semibold text-gray-800">
                      {report.reporterId?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {report.reporterType}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {report.reportedId?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {report.reportedType}
                    </p>
                  </div>
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {reports.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            <Flag className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold">No reports found</p>
          </div>
        )}
      </div>

      {/* Report Detail Modal - Add ReportDetailView component here */}
      {selectedReport && (
        <ReportDetailView
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdate={fetchReports}
        />
      )}
    </div>
  );
};

export default ReportsManagement;
```

---

### **6. Report Detail View Component**

**File to Create:** `admin/src/components/ReportDetailView.jsx`

```jsx
import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ban, CheckCircle, XCircle, Eye, FileText, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/DoctorContext';

const ReportDetailView = ({ report, onClose, onUpdate }) => {
  const { atoken, adminData } = useContext(AdminContext);
  const { backendurl } = useContext(DoctorContext);
  
  const [status, setStatus] = useState(report.status);
  const [adminNotes, setAdminNotes] = useState(report.adminNotes || '');
  const [actionTaken, setActionTaken] = useState(report.actionTaken || 'none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);

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
          adminId: adminData._id
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
      const endpoint = report.reportedType === 'user' 
        ? `${backendurl}/api/report/ban-user`
        : `${backendurl}/api/report/ban-doctor`;

      const { data } = await axios.post(
        endpoint,
        {
          [report.reportedType === 'user' ? 'userId' : 'doctorId']: report.reportedId._id,
          reason: `Banned due to report: ${report.reason}`,
          adminId: adminData._id
        },
        { headers: { atoken } }
      );

      if (data.success) {
        toast.success(data.message);
        setActionTaken('permanent_ban');
        setStatus('resolved');
        setShowBanConfirm(false);
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
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Report Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Report Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-700 mb-3">Reporter</h3>
                <div className="flex items-center gap-3">
                  <img
                    src={report.reporterId?.image || '/default-avatar.png'}
                    alt={report.reporterId?.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{report.reporterId?.name}</p>
                    <p className="text-sm text-gray-600">{report.reporterId?.email}</p>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {report.reporterType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-700 mb-3">Reported</h3>
                <div className="flex items-center gap-3">
                  <img
                    src={report.reportedId?.image || '/default-avatar.png'}
                    alt={report.reportedId?.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{report.reportedId?.name}</p>
                    <p className="text-sm text-gray-600">{report.reportedId?.email}</p>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      {report.reportedType}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason & Description */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-2">Reason</h3>
              <p className="text-gray-700">
                {report.reason.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
            </div>

            {/* Evidence */}
            {report.evidence && report.evidence.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Evidence
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {report.evidence.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
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
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-800">Admin Actions</h3>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">None</option>
                  <option value="warning">Warning Issued</option>
                  <option value="temporary_ban">Temporary Ban</option>
                  <option value="permanent_ban">Permanent Ban</option>
                  <option value="account_suspended">Account Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add your notes about this report..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="4"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpdateStatus}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update Report'}
                </button>

                <button
                  onClick={() => setShowBanConfirm(true)}
                  className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <Ban className="w-5 h-5" />
                  Ban Account
                </button>
              </div>
            </div>
          </div>

          {/* Ban Confirmation Modal */}
          {showBanConfirm && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-xl max-w-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Confirm Ban
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to permanently ban {report.reportedId?.name}? 
                  This action cannot be undone easily.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBanConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBanAccount}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Banning...' : 'Yes, Ban Account'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportDetailView;
```

---

## Summary

### ✅ **Completed:**
1. User Report Modal Component
2. Doctor Report Modal Component (already existed)
3. Report Button in User Appointments
4. Report Modal Integration in User Appointments

### ⏳ **To Complete:**
1. Report Button in Doctor Appointments
2. Admin Reports Dashboard
3. Report Detail View Component
4. Ban/Unban Interface (included in Report Detail View)

All code is provided above - just copy and implement! 🚀✅
