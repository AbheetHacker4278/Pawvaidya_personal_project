import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';
import { ShieldAlert, CheckCircle2, AlertCircle, Clock, Check, Search, Filter } from 'lucide-react';

const CSComplaints = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchComplaints = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/complaints`, {
                headers: { atoken }
            });
            if (data.success) {
                setComplaints(data.complaints);
            } else {
                toast.error(data.message || 'Failed to fetch complaints.');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const { data } = await axios.put(
                `${backendurl}/api/cs-admin/complaint/${id}/status`,
                { status },
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success(`Complaint marked as ${status}`);
                fetchComplaints();
            } else {
                toast.error(data.message || 'Failed to update complaint status.');
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (atoken) {
            fetchComplaints();
        }
    }, [atoken]);

    const filteredComplaints = complaints.filter(c => {
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            c.title?.toLowerCase().includes(searchLower) ||
            c.description?.toLowerCase().includes(searchLower) ||
            c.reporterName?.toLowerCase().includes(searchLower) ||
            c.targetAgentName?.toLowerCase().includes(searchLower);
        return matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'investigating':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'resolved':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'dismissed':
                return 'bg-slate-100 text-slate-800 border-slate-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ShieldAlert className="text-rose-500" /> CS Agent Complaints
                    </h1>
                    <p className="text-sm text-gray-500">Internal grievances and misbehavior reports raised against CS Staff</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                        {complaints.filter(c => c.status === 'pending').length} Pending
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
                        {complaints.filter(c => c.status === 'investigating').length} Investigating
                    </span>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search complaints, agents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="w-4 h-4 text-slate-400 hidden sm:inline" />
                    <div className="flex flex-wrap gap-1.5 w-full">
                        {['all', 'pending', 'investigating', 'resolved', 'dismissed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border capitalize transition-all active:scale-95 flex-1 md:flex-none text-center ${
                                    filterStatus === status
                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Complaints List */}
            <div className="space-y-4">
                {filteredComplaints.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
                        <CheckCircle2 className="mx-auto text-emerald-500 w-12 h-12 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">All Clear!</h3>
                        <p className="text-slate-500">No CS agent complaints found matching the criteria.</p>
                    </div>
                ) : (
                    filteredComplaints.map((complaint) => (
                        <div
                            key={complaint._id}
                            className={`bg-white rounded-2xl border p-6 transition-all hover:shadow-lg ${
                                complaint.status === 'pending'
                                    ? 'border-amber-200 shadow-md shadow-amber-50/20'
                                    : 'border-slate-200'
                            }`}
                        >
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(complaint.status)}`}>
                                            {complaint.status}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(complaint.createdAt).toLocaleString()}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">{complaint.title}</h3>
                                        <p className="text-sm text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100 leading-relaxed italic">
                                            "{complaint.description}"
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs font-semibold">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Reported By:</span>
                                            <span className="text-slate-700 bg-emerald-50 text-emerald-800 px-2 py-1 rounded-md border border-emerald-100">
                                                {complaint.reporterName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Target Agent:</span>
                                            <span className="text-slate-700 bg-rose-50 text-rose-800 px-2 py-1 rounded-md border border-rose-100 font-bold">
                                                {complaint.targetAgentName}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex md:flex-col justify-end gap-2 md:w-48 border-t md:border-t-0 pt-4 md:pt-0 border-slate-150">
                                    {complaint.status === 'pending' && (
                                        <button
                                            onClick={() => updateStatus(complaint._id, 'investigating')}
                                            className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100 active:scale-95"
                                        >
                                            <AlertCircle className="w-3.5 h-3.5" /> Start Investigating
                                        </button>
                                    )}
                                    {['pending', 'investigating'].includes(complaint.status) && (
                                        <>
                                            <button
                                                onClick={() => updateStatus(complaint._id, 'resolved')}
                                                className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-100 active:scale-95"
                                            >
                                                <Check className="w-3.5 h-3.5" /> Mark Resolved
                                            </button>
                                            <button
                                                onClick={() => updateStatus(complaint._id, 'dismissed')}
                                                className="w-full flex items-center justify-center gap-1.5 bg-slate-200 hover:bg-slate-350 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                                            >
                                                Dismiss Complaint
                                            </button>
                                        </>
                                    )}
                                    {['resolved', 'dismissed'].includes(complaint.status) && (
                                        <button
                                            onClick={() => updateStatus(complaint._id, 'pending')}
                                            className="w-full flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                                        >
                                            Reopen Complaint
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CSComplaints;
