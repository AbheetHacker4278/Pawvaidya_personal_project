import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShieldAlert, ImagePlus, Loader2, Send, Search, CheckCircle2, Clock, XCircle, AlertCircle, FileText } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const ReportCruelty = () => {
    const { token, userdata, backendurl } = useContext(AppContext);
    
    const [activeTab, setActiveTab] = useState('submit'); // 'submit' or 'track'
    
    // Submit State
    const [formData, setFormData] = useState({
        reporterName: '',
        reporterEmail: '',
        reporterPhone: '',
        animalType: '',
        incidentDate: '',
        incidentLocation: '',
        incidentDescription: '',
    });
    
    // Pre-fill user data if available
    useEffect(() => {
        if (userdata && !formData.reporterName) {
            setFormData(prev => ({
                ...prev,
                reporterName: userdata.name || '',
                reporterEmail: userdata.email || '',
                reporterPhone: userdata.phone || ''
            }));
        }
    }, [userdata]);

    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submittedId, setSubmittedId] = useState(null);

    // Track State
    const [trackId, setTrackId] = useState('');
    const [trackLoading, setTrackLoading] = useState(false);
    const [trackResult, setTrackResult] = useState(null);
    const [myReports, setMyReports] = useState([]);
    const [loadingMyReports, setLoadingMyReports] = useState(false);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        if (e.target.files.length > 5) {
            toast.error('You can only upload up to 5 images.');
            return;
        }
        setImages(e.target.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            
            // Append userId if logged in
            if (userdata && userdata._id) {
                data.append('userId', userdata._id);
            }

            for (let i = 0; i < images.length; i++) {
                data.append('images', images[i]);
            }

            const response = await axios.post(`${backendurl}/api/cruelty-report/submit`, data, {
                headers: { 'Content-Type': 'multipart/form-data', ...(token && { token }) }
            });

            if (response.data.success) {
                toast.success(response.data.message);
                setSubmittedId(response.data.reportId);
                
                // Clear only incident details, keep reporter info
                setFormData(prev => ({
                    ...prev,
                    animalType: '', incidentDate: '', incidentLocation: '', incidentDescription: ''
                }));
                setImages([]);
                
                // Refresh my reports if tracking tab is ever opened
                fetchMyReports();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTrack = async (e) => {
        if (e) e.preventDefault();
        if (!trackId.trim()) return;

        setTrackLoading(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/cruelty-report/track/${trackId.trim()}`);
            if (data.success) {
                setTrackResult(data.report);
                toast.success("Report found!");
            } else {
                setTrackResult(null);
                toast.error(data.message);
            }
        } catch (error) {
            setTrackResult(null);
            toast.error('Could not track report. Please check the ID.');
        } finally {
            setTrackLoading(false);
        }
    };

    const fetchMyReports = async () => {
        if (!token) return;
        setLoadingMyReports(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/cruelty-report/my-reports`, { headers: { token } });
            if (data.success) {
                setMyReports(data.reports);
            }
        } catch (error) {
            console.error("Failed to fetch user reports:", error);
        } finally {
            setLoadingMyReports(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'track' && token) {
            fetchMyReports();
        }
    }, [activeTab, token]);

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Pending': return { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock, border: 'border-amber-200' };
            case 'Investigating': return { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Search, border: 'border-blue-200' };
            case 'Resolved': return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2, border: 'border-emerald-200' };
            case 'Dismissed': return { color: 'text-slate-500', bg: 'bg-slate-500/10', icon: XCircle, border: 'border-slate-200' };
            default: return { color: 'text-slate-500', bg: 'bg-slate-500/10', icon: AlertCircle, border: 'border-slate-200' };
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center pt-24 pb-12 px-4 sm:px-6 relative overflow-hidden">
            <div className="w-full max-w-4xl z-10">
                
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-2xl mb-4 border border-emerald-200 shadow-sm">
                        <ShieldAlert className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">
                        Animal Protection Portal
                    </h1>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
                        Speak up for those who cannot. Report cruelty securely or track an existing investigation.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center gap-4 mb-8">
                    <button 
                        onClick={() => setActiveTab('submit')}
                        className={`px-8 py-3 rounded-full font-bold transition-all duration-300 shadow-sm ${
                            activeTab === 'submit' 
                            ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700' 
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                    >
                        Submit Report
                    </button>
                    <button 
                        onClick={() => setActiveTab('track')}
                        className={`px-8 py-3 rounded-full font-bold transition-all duration-300 shadow-sm ${
                            activeTab === 'track' 
                            ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600' 
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                    >
                        Track Report
                    </button>
                </div>

                {/* Main Container */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-xl relative overflow-hidden">
                    
                    {/* Submit Form */}
                    {activeTab === 'submit' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {submittedId ? (
                                <div className="text-center py-12 space-y-6">
                                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-800">Report Submitted Successfully</h2>
                                    <p className="text-slate-500 max-w-md mx-auto">
                                        Thank you for being vigilant. We have sent a confirmation email.
                                    </p>
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-md mx-auto">
                                        <p className="text-sm text-slate-400 uppercase tracking-widest mb-2 font-bold">Your Tracking ID</p>
                                        <p className="text-xl font-mono text-emerald-600 select-all font-bold">{submittedId}</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setSubmittedId(null);
                                            setActiveTab('track');
                                            setTrackId(submittedId);
                                            setTimeout(() => handleTrack({ preventDefault: () => {} }), 100);
                                        }}
                                        className="mt-6 px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold transition-all"
                                    >
                                        Track This Report
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-slate-700 font-bold ml-1 text-sm">Your Name *</label>
                                            <input required type="text" name="reporterName" value={formData.reporterName} onChange={handleInputChange} 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" 
                                                placeholder="John Doe" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-slate-700 font-bold ml-1 text-sm">Your Email *</label>
                                            <input required type="email" name="reporterEmail" value={formData.reporterEmail} onChange={handleInputChange} 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" 
                                                placeholder="john@example.com" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-slate-700 font-bold ml-1 text-sm">Phone Number</label>
                                            <input type="tel" name="reporterPhone" value={formData.reporterPhone} onChange={handleInputChange} 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" 
                                                placeholder="+91 9876543210" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-slate-700 font-bold ml-1 text-sm">Animal Type *</label>
                                            <input required type="text" name="animalType" value={formData.animalType} onChange={handleInputChange} 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" 
                                                placeholder="e.g. Stray Dog, Cat, Horse" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-slate-700 font-bold ml-1 text-sm">Incident Location *</label>
                                        <input required type="text" name="incidentLocation" value={formData.incidentLocation} onChange={handleInputChange} 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" 
                                            placeholder="Specific address, landmark, or GPS coordinates" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-slate-700 font-bold ml-1 text-sm">Date & Time of Incident *</label>
                                        <input required type="datetime-local" name="incidentDate" value={formData.incidentDate} onChange={handleInputChange} 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-slate-700 font-bold ml-1 text-sm">Description of Incident *</label>
                                        <textarea required name="incidentDescription" rows="4" value={formData.incidentDescription} onChange={handleInputChange} 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none" 
                                            placeholder="Please describe exactly what you saw..." />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-slate-700 font-bold ml-1 text-sm">Evidence (Images)</label>
                                        <div className="relative border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 bg-slate-50 hover:bg-emerald-50/50 transition-all text-center group cursor-pointer">
                                            <input type="file" multiple accept="image/*" onChange={handleImageChange} 
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            <ImagePlus className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 mx-auto mb-3 transition-colors" />
                                            <p className="text-slate-600 font-bold">Click or drag images here</p>
                                            <p className="text-slate-400 text-sm mt-1">Maximum 5 images allowed</p>
                                            
                                            {images.length > 0 && (
                                                <div className="mt-4 p-3 bg-emerald-100 rounded-xl border border-emerald-200 inline-block">
                                                    <span className="text-emerald-700 font-bold">{images.length} files selected</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button disabled={loading} type="submit" 
                                            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg shadow-emerald-500/25 transition-all flex justify-center items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed">
                                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5" /> Submit Confidential Report</>}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Track Form */}
                    {activeTab === 'track' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[400px]">
                            
                            <form onSubmit={handleTrack} className="mb-8 border-b border-slate-100 pb-8">
                                <div className="space-y-3 max-w-2xl mx-auto">
                                    <label className="text-slate-700 font-bold ml-1">Search by Tracking ID</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input type="text" value={trackId} onChange={(e) => setTrackId(e.target.value)} 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-32 py-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono" 
                                            placeholder="Paste Tracking ID here..." />
                                        <button disabled={trackLoading || !trackId.trim()} type="submit" 
                                            className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm">
                                            {trackLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Track'}
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {trackResult ? (
                                <div className="max-w-2xl mx-auto mt-6">
                                    <button 
                                        onClick={() => setTrackResult(null)}
                                        className="mb-4 text-sm text-slate-500 hover:text-slate-700 font-bold flex items-center gap-1"
                                    >
                                        &larr; Back to my reports
                                    </button>
                                    <div className="bg-white rounded-[23px] p-6 md:p-8 border border-slate-200 shadow-lg shadow-slate-200/50">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                                            <div>
                                                <h3 className="text-2xl font-bold text-slate-800 mb-1">Incident Report</h3>
                                                <p className="text-slate-400 text-sm font-mono">{trackResult._id}</p>
                                            </div>
                                            
                                            {(() => {
                                                const statusCfg = getStatusConfig(trackResult.status);
                                                const StatusIcon = statusCfg.icon;
                                                return (
                                                    <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${statusCfg.bg} border ${statusCfg.border}`}>
                                                        <StatusIcon className={`w-5 h-5 ${statusCfg.color}`} />
                                                        <span className={`font-bold tracking-wide uppercase text-sm ${statusCfg.color}`}>
                                                            {trackResult.status}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Animal Involved</p>
                                                <p className="text-slate-800 font-bold text-lg">{trackResult.animalType}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Date Reported</p>
                                                <p className="text-slate-800 font-bold">{new Date(trackResult.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 sm:col-span-2">
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Location</p>
                                                <p className="text-slate-800 font-bold">{trackResult.incidentLocation}</p>
                                            </div>
                                        </div>

                                        {trackResult.adminNotes ? (
                                            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                                                    <p className="text-amber-700 text-sm font-black uppercase tracking-wider">Admin Response</p>
                                                </div>
                                                <p className="text-amber-900 text-sm font-medium">{trackResult.adminNotes}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                                                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                <p className="text-slate-500 text-sm font-medium">Our team is reviewing this report. Please check back later for updates from the admin.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto">
                                    {token ? (
                                        loadingMyReports ? (
                                            <div className="flex justify-center p-12">
                                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                            </div>
                                        ) : myReports.length > 0 ? (
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                                    <FileText className="text-amber-500" /> My Submitted Reports
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {myReports.map(report => {
                                                        const statusCfg = getStatusConfig(report.status);
                                                        return (
                                                            <div 
                                                                key={report._id} 
                                                                onClick={() => { setTrackId(report._id); handleTrack({ preventDefault: () => {} }); }}
                                                                className="bg-slate-50 border border-slate-200 p-5 rounded-2xl hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all group"
                                                            >
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm text-xs font-mono text-slate-500">
                                                                        ID: {report._id.substring(0, 8)}...
                                                                    </div>
                                                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                                                                        {report.status}
                                                                    </span>
                                                                </div>
                                                                <h4 className="font-bold text-slate-800 mb-1 group-hover:text-emerald-600 transition-colors">{report.animalType}</h4>
                                                                <p className="text-xs text-slate-500 line-clamp-1 mb-2">{report.incidentLocation}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(report.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center p-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                                <h3 className="text-lg font-bold text-slate-600 mb-1">No Reports Found</h3>
                                                <p className="text-slate-400 text-sm">You haven't submitted any cruelty reports yet.</p>
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-center p-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                                            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            <h3 className="text-lg font-bold text-slate-600 mb-1">Log in to view your history</h3>
                                            <p className="text-slate-400 text-sm">If you submitted reports while logged in, you can view them here.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportCruelty;
