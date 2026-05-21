import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const CrueltyReports = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [editingNotes, setEditingNotes] = useState({});

    const fetchReports = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/cruelty-report/admin/all`, { headers: { atoken } });
            if (data.success) {
                setReports(data.reports);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
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

    const handleUpdate = async (reportId, newStatus, currentNotes) => {
        const notes = editingNotes[reportId] !== undefined ? editingNotes[reportId] : currentNotes;
        
        setUpdatingId(reportId);
        try {
            const { data } = await axios.post(`${backendurl}/api/cruelty-report/admin/update-status`, { reportId, status: newStatus, adminNotes: notes }, { headers: { atoken } });
            if (data.success) {
                toast.success('Report updated successfully');
                fetchReports();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) return <div className="text-center p-12">Loading Reports...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Animal Cruelty Reports</h1>
            <p className="text-slate-500 text-sm">Review and take action on reported incidents.</p>

            {reports.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500">No reports submitted yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {reports.map((report) => (
                        <div key={report._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6">
                            
                            {/* Images section */}
                            {report.images && report.images.length > 0 && (
                                <div className="md:w-1/4 shrink-0 flex flex-col gap-2">
                                    <img src={report.images[0]} alt="Report evidence" className="w-full h-40 object-cover rounded-xl border border-slate-200" />
                                    {report.images.length > 1 && (
                                        <div className="text-xs text-center font-medium text-slate-500 bg-slate-50 py-1 rounded-md">
                                            + {report.images.length - 1} more images
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Details section */}
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                report.status === 'Pending' ? 'bg-red-100 text-red-600' :
                                                report.status === 'Investigating' ? 'bg-amber-100 text-amber-600' :
                                                report.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {report.status}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium">{new Date(report.createdAt).toLocaleString()}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800">{report.animalType} Incident at {report.incidentLocation}</h3>
                                        <p className="text-sm text-slate-500 mt-1">Incident Date: {new Date(report.incidentDate).toLocaleString()}</p>
                                    </div>
                                    
                                    <select 
                                        value={report.status}
                                        onChange={(e) => handleUpdate(report._id, e.target.value, report.adminNotes)}
                                        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Investigating">Investigating</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Dismissed">Dismissed</option>
                                    </select>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.incidentDescription}</p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-white border border-slate-100 p-4 rounded-xl">
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Reporter Name</p>
                                        <p className="font-medium text-slate-700">{report.reporterName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Reporter Email</p>
                                        <p className="font-medium text-slate-700">{report.reporterEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Reporter Phone</p>
                                        <p className="font-medium text-slate-700">{report.reporterPhone}</p>
                                    </div>
                                </div>

                                {/* Admin Notes Section */}
                                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 mt-4 space-y-3">
                                    <p className="text-xs text-amber-600 font-bold uppercase">Admin Notes (Visible to Reporter)</p>
                                    <textarea
                                        value={editingNotes[report._id] !== undefined ? editingNotes[report._id] : (report.adminNotes || '')}
                                        onChange={(e) => setEditingNotes(prev => ({...prev, [report._id]: e.target.value}))}
                                        placeholder="Add a comment or update for the reporter here..."
                                        rows="2"
                                        className="w-full text-sm border border-amber-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-amber-500/30 transition-all resize-none"
                                    ></textarea>
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => handleUpdate(report._id, report.status, report.adminNotes)}
                                            disabled={updatingId === report._id || editingNotes[report._id] === undefined || editingNotes[report._id] === report.adminNotes}
                                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {updatingId === report._id ? 'Saving...' : 'Save Note'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CrueltyReports;
