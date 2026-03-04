import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, User, Heart, Calendar, Activity,
    ChevronRight, ChevronLeft, Stethoscope,
    History, Shield, Clipboard, Hash, FileText,
    ExternalLink, Download, Clock, PawPrint,
    X
} from 'lucide-react';

const THEME = {
    primary: '#5A4035',
    accent: '#c8860a',
    light: '#fdf8f0',
    border: '#e8d5b0',
    muted: '#a08060',
    success: '#059669',
    white: '#ffffff'
};

const PatientRecords = () => {
    const { appointments, getAppointments, getPetReports, dtoken } = useContext(DoctorContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientReports, setPatientReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [activeAttachment, setActiveAttachment] = useState(null);

    useEffect(() => {
        if (dtoken) {
            getAppointments();
        }
    }, [dtoken]);

    // Get unique patients from appointments
    const uniquePatientsMap = new Map();

    appointments.forEach(appt => {
        const userId = appt.userId.toString();
        if (!uniquePatientsMap.has(userId)) {
            uniquePatientsMap.set(userId, {
                id: userId,
                name: appt.userData.name,
                email: appt.userData.email,
                image: appt.userData.image,
                lastSeen: appointments
                    .filter(a => a.userId.toString() === userId)
                    .sort((a, b) => new Date(b.slotDate) - new Date(a.slotDate))[0].slotDate
            });
        }
    });

    const uniquePatients = Array.from(uniquePatientsMap.values())
        .filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const handlePatientClick = async (patient) => {
        setSelectedPatient(patient);
        setSelectedReport(null);
        setLoadingReports(true);
        const reports = await getPetReports(patient.id);
        if (reports) {
            setPatientReports(reports);
            if (reports.length === 1) {
                setSelectedReport(reports[0]);
            }
        }
        setLoadingReports(false);
    };

    return (
        <div className="p-6 lg:p-10 min-h-screen" style={{ background: '#f9fafb' }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black flex items-center gap-3" style={{ color: THEME.primary }}>
                        <Stethoscope className="w-8 h-8" /> Patient Medical Histories
                    </h1>
                    <p className="mt-2" style={{ color: THEME.muted }}>Search and review medical records for all your patients.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Panel: Patient Search & List */}
                    <div className={`${selectedPatient ? 'hidden lg:block lg:col-span-4' : 'col-span-12'} space-y-6`}>
                        {/* Search Bar */}
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors group-focus-within:text-amber-600" style={{ color: THEME.muted }} />
                            <input
                                type="text"
                                placeholder="Search patients by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all outline-none focus:ring-4 focus:ring-amber-100"
                                style={{ borderColor: THEME.border, background: THEME.white }}
                            />
                        </div>

                        {/* Patient List */}
                        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            {uniquePatients.map((patient) => (
                                <motion.div
                                    key={patient.id}
                                    whileHover={{ x: 4 }}
                                    onClick={() => handlePatientClick(patient)}
                                    className={`p-4 rounded-[1.5rem] border-2 cursor-pointer transition-all ${selectedPatient?.id === patient.id ? 'bg-white shadow-xl shadow-amber-900/5' : 'bg-white/50 hover:bg-white'}`}
                                    style={{ borderColor: selectedPatient?.id === patient.id ? THEME.accent : 'transparent' }}
                                >
                                    <div className="flex items-center gap-4">
                                        <img src={patient.image} alt="" className="w-12 h-12 rounded-xl object-cover border-2" style={{ borderColor: THEME.border }} />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold truncate" style={{ color: THEME.primary }}>{patient.name}</h3>
                                            <p className="text-xs truncate" style={{ color: THEME.muted }}>{patient.email}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 opacity-30" />
                                    </div>
                                    <div className="mt-3 pt-3 border-t text-[10px] uppercase font-black tracking-widest flex items-center justify-between" style={{ borderColor: THEME.border, color: THEME.muted }}>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last Visit: {patient.lastSeen}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Patient Detail & Reports */}
                    {selectedPatient && (
                        <div className="lg:col-span-8">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white h-full flex flex-col"
                            >
                                {/* Active Patient Header */}
                                <div className="p-8 border-b bg-gradient-to-r from-amber-50/50 to-white flex items-center justify-between" style={{ borderColor: THEME.border }}>
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => setSelectedPatient(null)}
                                            className="lg:hidden p-2 rounded-xl bg-white border"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <div className="flex items-center gap-4">
                                            <img src={selectedPatient.image} alt="" className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-lg" />
                                            <div>
                                                <h2 className="text-2xl font-black" style={{ color: THEME.primary }}>{selectedPatient.name}</h2>
                                                <p className="font-bold text-sm" style={{ color: THEME.muted }}>{selectedPatient.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="hidden md:flex flex-col items-end">
                                        <span className="text-[10px] uppercase font-black tracking-widest mb-1 opacity-50">Patient Status</span>
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                            <Shield className="w-3 h-3" /> Active Profile
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                    {loadingReports ? (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                className="w-12 h-12 border-4 border-t-transparent rounded-full"
                                                style={{ borderColor: THEME.accent, borderTopColor: 'transparent' }}
                                            />
                                            <p className="mt-4 font-bold" style={{ color: THEME.muted }}>Fetching medical records...</p>
                                        </div>
                                    ) : patientReports.length === 0 ? (
                                        <div className="text-center py-20">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <FileText className="w-10 h-10 text-gray-300" />
                                            </div>
                                            <h3 className="text-xl font-bold" style={{ color: THEME.primary }}>No Reports Found</h3>
                                            <p style={{ color: THEME.muted }}>This patient has no pet health records yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-10">
                                            {/* Report Selection (if multiple pets) */}
                                            {patientReports.length > 1 && (
                                                <div className="flex flex-wrap gap-3">
                                                    {patientReports.map(rep => (
                                                        <button
                                                            key={rep._id}
                                                            onClick={() => setSelectedReport(rep)}
                                                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${selectedReport?._id === rep._id ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-200' : 'bg-white border-amber-200 text-amber-800 hover:border-amber-400'}`}
                                                        >
                                                            {rep.petName}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* ACTIVE REPORT DETAIL */}
                                            {selectedReport && (
                                                <motion.div
                                                    key={selectedReport._id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="space-y-12"
                                                >
                                                    {/* Pet Summary Card */}
                                                    <div className="p-8 rounded-[2rem] bg-gradient-to-br from-amber-50 to-white border-2 border-white shadow-inner flex flex-col md:flex-row gap-8">
                                                        <div className="w-24 h-24 rounded-3xl bg-white shadow-lg flex items-center justify-center flex-shrink-0">
                                                            <PawPrint className="w-12 h-12" style={{ color: THEME.accent }} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap items-end gap-3 mb-4">
                                                                <h3 className="text-3xl font-black" style={{ color: THEME.primary }}>{selectedReport.petName}</h3>
                                                                <span className="px-3 py-1 bg-white border border-amber-100 rounded-full text-xs font-bold text-amber-800">{selectedReport.species}</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                {[
                                                                    { label: 'Breed', value: selectedReport.breed, icon: <Hash className="w-3.5 h-3.5" /> },
                                                                    { label: 'Gender', value: selectedReport.gender, icon: <User className="w-3.5 h-3.5" /> },
                                                                    { label: 'Age', value: `${selectedReport.age || '?'} yrs`, icon: <Calendar className="w-3.5 h-3.5" /> },
                                                                    { label: 'Weight', value: `${selectedReport.weight || '?'} kg`, icon: <Activity className="w-3.5 h-3.5" /> },
                                                                ].map((item, i) => (
                                                                    <div key={i}>
                                                                        <p className="text-[10px] uppercase font-black opacity-40 mb-1 flex items-center gap-1">{item.icon} {item.label}</p>
                                                                        <p className="text-sm font-bold truncate">{item.value}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* History & Notes */}
                                                    <section>
                                                        <div className="flex items-center justify-between mb-6">
                                                            <h4 className="text-lg font-black flex items-center gap-2" style={{ color: THEME.primary }}>
                                                                <History className="w-6 h-6" style={{ color: THEME.accent }} /> Consultation History
                                                            </h4>
                                                        </div>
                                                        <div className="space-y-4">
                                                            {selectedReport.visitNotes?.length > 0 ? (
                                                                selectedReport.visitNotes.map((note, i) => (
                                                                    <div key={i} className="p-6 rounded-3xl border bg-white flex flex-col md:flex-row gap-6 hover:shadow-lg transition-shadow" style={{ borderColor: THEME.border }}>
                                                                        <div className="flex-shrink-0">
                                                                            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                                                                                <Calendar className="w-6 h-6" />
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <p className="font-black text-sm">{new Date(note.date || note._id.getTimestamp?.() || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                                                                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-500">Note Record</span>
                                                                            </div>
                                                                            <p className="text-sm leading-relaxed text-gray-700 italic border-l-4 border-amber-200 pl-4 py-1">
                                                                                "{note.notes}"
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="p-10 rounded-3xl border-2 border-dashed text-center" style={{ borderColor: THEME.border }}>
                                                                    <p className="text-sm italic" style={{ color: THEME.muted }}>No visit notes found.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </section>

                                                    {/* Vaccinations & Lab Results */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                        <section>
                                                            <h4 className="text-lg font-black flex items-center gap-2 mb-6" style={{ color: THEME.primary }}>
                                                                <Shield className="w-6 h-6" style={{ color: THEME.accent }} /> Immunizations
                                                            </h4>
                                                            <div className="space-y-3">
                                                                {selectedReport.vaccinations?.map((vac, i) => (
                                                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                                                <Hash className="w-4 h-4" />
                                                                            </div>
                                                                            <p className="text-sm font-bold text-emerald-900">{vac.name}</p>
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-emerald-600">{new Date(vac.date).toLocaleDateString()}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </section>

                                                        <section>
                                                            <h4 className="text-lg font-black flex items-center gap-2 mb-6" style={{ color: THEME.primary }}>
                                                                <ExternalLink className="w-6 h-6" style={{ color: THEME.accent }} /> Lab Reports
                                                            </h4>
                                                            <div className="flex flex-wrap gap-4">
                                                                {selectedReport.attachments?.map((file, i) => (
                                                                    <div
                                                                        key={i}
                                                                        onClick={() => setActiveAttachment(file)}
                                                                        className="relative group w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-100 shadow-sm cursor-pointer hover:border-amber-400 transition-all"
                                                                    >
                                                                        <img src={file.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                                                                            <Search className="w-6 h-6 mb-1" />
                                                                            <span className="text-[10px] font-bold uppercase">View Detail</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {(!selectedReport.attachments || selectedReport.attachments.length === 0) && (
                                                                    <p className="text-xs italic" style={{ color: THEME.muted }}>No attachments available.</p>
                                                                )}
                                                            </div>
                                                        </section>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>

            {/* ATTACHMENT DETAIL MODAL */}
            <AnimatePresence>
                {activeAttachment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-5xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
                            style={{ maxHeight: '90vh' }}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: THEME.border }}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg" style={{ color: THEME.primary }}>Lab Report Detail</h3>
                                        <p className="text-xs font-bold" style={{ color: THEME.muted }}>{activeAttachment.filename || 'Untitled Document'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={activeAttachment.url}
                                        download
                                        className="p-3 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                                        title="Download Report"
                                    >
                                        <Download className="w-6 h-6" />
                                    </a>
                                    <button
                                        onClick={() => setActiveAttachment(null)}
                                        className="p-3 rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50 flex items-center justify-center">
                                {activeAttachment.url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                                    <img
                                        src={activeAttachment.url}
                                        alt="Lab Report"
                                        className="max-w-full max-h-full rounded-xl shadow-lg border-4 border-white"
                                    />
                                ) : (
                                    <div className="text-center p-20">
                                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                                            <FileText className="w-12 h-12 text-amber-600" />
                                        </div>
                                        <h4 className="text-xl font-black mb-4" style={{ color: THEME.primary }}>PDF/Document Report</h4>
                                        <p className="mb-8" style={{ color: THEME.muted }}>This document type is best viewed by downloading or opening in a new tab.</p>
                                        <a
                                            href={activeAttachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-8 py-4 bg-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-700 transition-all inline-flex items-center gap-3"
                                        >
                                            <ExternalLink className="w-5 h-5" /> Open in New Tab
                                        </a>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
            `}</style>
        </div>
    );
};

export default PatientRecords;
