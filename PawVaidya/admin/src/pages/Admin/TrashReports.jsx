import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { DoctorContext } from '../../context/DoctorContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const TrashReports = () => {
  const { atoken } = useContext(AdminContext);
  const { backendurl } = useContext(DoctorContext);
  
  const [trashedReports, setTrashedReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (atoken) {
      fetchTrashedReports();
    }
  }, [atoken]);

  const fetchTrashedReports = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get(
        `${backendurl}/api/report/trash-view`,
        { headers: { atoken } }
      );

      if (data.success) {
        setTrashedReports(data.reports);
      } else {
        toast.error(data.message || 'Failed to load trashed reports');
      }
    } catch (error) {
      console.error('Error fetching trashed reports:', error);
      toast.error('Failed to load trashed reports');
    } finally {
      setIsLoading(false);
    }
  };

  const restoreReport = async (reportId) => {
    try {
      const { data } = await axios.post(
        `${backendurl}/api/report/restore`,
        { reportIds: [reportId] },
        { headers: { atoken } }
      );

      if (data.success) {
        toast.success('Report restored successfully');
        fetchTrashedReports();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error restoring report:', error);
      toast.error('Failed to restore report');
    }
  };

  const deletePermanently = async (reportId) => {
    if (!window.confirm('Are you sure you want to permanently delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const { data } = await axios.post(
        `${backendurl}/api/report/delete`,
        { reportIds: [reportId] },
        { headers: { atoken } }
      );

      if (data.success) {
        toast.success('Report deleted permanently');
        fetchTrashedReports();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const emptyTrash = async () => {
    if (!window.confirm('Are you sure you want to permanently delete ALL trashed reports? This action cannot be undone.')) {
      return;
    }

    try {
      const reportIds = trashedReports.map(r => r._id);
      const { data } = await axios.post(
        `${backendurl}/api/report/delete`,
        { reportIds },
        { headers: { atoken } }
      );

      if (data.success) {
        toast.success('Trash emptied successfully');
        fetchTrashedReports();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error emptying trash:', error);
      toast.error('Failed to empty trash');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trashed reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-red-600" />
            Trash
          </h1>
          <p className="text-gray-600 mt-2">
            Trashed reports ({trashedReports.length})
          </p>
        </div>
        
        {trashedReports.length > 0 && (
          <button
            onClick={emptyTrash}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Empty Trash
          </button>
        )}
      </div>

      {/* Trashed Reports */}
      {trashedReports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Trash is empty</p>
          <p className="text-gray-500 text-sm mt-2">Deleted reports will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
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
                {trashedReports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
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
                      <span className="text-sm text-gray-700">
                        {getReasonLabel(report.reason)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                        {report.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => restoreReport(report._id)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1 text-sm"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Restore
                        </button>
                        <button
                          onClick={() => deletePermanently(report._id)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-1 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashReports;
