import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';
import { AlertCircle, CheckCircle, Clock, XCircle, Search, Filter, Eye, MessageSquare, User, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AppIssueReports = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [updating, setUpdating] = useState(false);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${backendurl}/api/app-issue/all`, { headers: { atoken } });
            if (data.success) {
                setReports(data.reports);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (atoken) {
            fetchReports();
        }
    }, [atoken]);

    const handleStatusUpdate = async (reportId, newStatus) => {
        try {
            setUpdating(true);
            const { data } = await axios.post(
                `${backendurl}/api/app-issue/update-status`,
                { reportId, status: newStatus, adminNotes },
                { headers: { atoken } }
            );

            if (data.success) {
                toast.success(data.message);
                fetchReports();
                setSelectedReport(null);
                setAdminNotes('');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error(error.message);
        } finally {
            setUpdating(false);
        }
    };

    const filteredReports = reports.filter(report => {
        const matchesFilter = filter === 'all' || report.status === filter;
        const matchesSearch = report.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock className="w-5 h-5 text-amber-500" />;
            case 'resolved': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'dismissed': return <XCircle className="w-5 h-5 text-rose-500" />;
            default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
        }
    };

    const getCategoryStyles = (category) => {
        switch (category) {
            case 'Bug': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'UI': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
            case 'Performance': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Feature Request': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-emerald-600" />
                        Application Issue Reports
                    </h1>
                    <p className="text-gray-500 mt-1">View and manage issues reported by users regarding the application.</p>
                </div>

                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-emerald-100 h-fit">
                    {['all', 'pending', 'resolved', 'dismissed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filter === f
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-emerald-50'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
                <div className="p-4 border-b border-emerald-50 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by subject, user or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-emerald-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-emerald-50/50 text-left">
                                <th className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase tracking-wider">Issue</th>
                                <th className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50/50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-8 h-8 bg-gray-50 rounded-lg m-2"></td>
                                    </tr>
                                ))
                            ) : filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-emerald-50 rounded-full">
                                                <AlertCircle className="w-10 h-10 text-emerald-400" />
                                            </div>
                                            <p className="text-gray-500 font-medium">No reports found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredReports.map((report) => (
                                <tr key={report._id} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(report.status)}
                                            <span className={`text-sm font-semibold capitalize ${report.status === 'pending' ? 'text-amber-600' :
                                                    report.status === 'resolved' ? 'text-emerald-600' : 'text-rose-600'
                                                }`}>
                                                {report.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCategoryStyles(report.category)}`}>
                                            {report.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs">
                                            <p className="font-bold text-gray-800 truncate">{report.subject}</p>
                                            <p className="text-xs text-gray-500 truncate">{report.description}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{report.userName}</p>
                                            <p className="text-xs text-gray-500">{report.userEmail}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedReport(report)}
                                            className="p-2 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-colors"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View/Edit Modal */}
            <AnimatePresence>
                {selectedReport && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedReport(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 text-sm opacity-80 mb-1">
                                        <Clock className="w-4 h-4" />
                                        Reported on {new Date(selectedReport.createdAt).toLocaleString()}
                                    </div>
                                    <h2 className="text-2xl font-bold">{selectedReport.subject}</h2>
                                </div>
                                <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-white/20 rounded-full">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <p className="text-xs font-bold text-emerald-800 uppercase mb-2">User Information</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                                                {selectedReport.userName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{selectedReport.userName}</p>
                                                <p className="text-xs text-gray-500">{selectedReport.userEmail}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <p className="text-xs font-bold text-emerald-800 uppercase mb-2">Category</p>
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getCategoryStyles(selectedReport.category)}`}>
                                            {selectedReport.category}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-emerald-800 uppercase mb-2">Description</p>
                                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-gray-700 leading-relaxed font-medium">
                                        {selectedReport.description}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-emerald-800 uppercase mb-2">Admin Notes</p>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Add private notes or instructions..."
                                        rows="3"
                                        className="w-full p-4 rounded-2xl border border-emerald-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-sm"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-4 pt-4 border-t border-emerald-50">
                                    <button
                                        disabled={updating}
                                        onClick={() => handleStatusUpdate(selectedReport._id, 'resolved')}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Mark as Resolved
                                    </button>
                                    <button
                                        disabled={updating}
                                        onClick={() => handleStatusUpdate(selectedReport._id, 'dismissed')}
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <XCircle className="w-5 h-5" />
                                        Dismiss Report
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AppIssueReports;
