import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PawPrint, FileText, Activity, Calendar,
    ChevronRight, Stethoscope, ChevronLeft,
    Clock, Plus, Download, ExternalLink, Mail,
    Clipboard, Hash, User, Heart, Shield,
    History, CheckCircle2, Search, X
} from 'lucide-react';

const COLORS = {
    primary: '#5A4035',
    accent: '#c8860a',
    light: '#fdf8f0',
    border: '#e8d5b0',
    muted: '#a08060',
    success: '#059669',
    bg: '#fdf8f0'
};

const MyPets = () => {
    const { getUserPetReports, token } = useContext(AppContext);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [activeAttachment, setActiveAttachment] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        const data = await getUserPetReports();
        if (data) {
            setReports(data);
        }
        setLoading(false);
    };

    if (!token) return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <p className="text-xl font-bold" style={{ color: COLORS.primary }}>Please login to view your pet reports.</p>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-[10%] bg-transparent">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: COLORS.primary }}>
                            <PawPrint className="w-8 h-8" /> My Pets' Medical Records
                        </h1>
                        <p className="mt-2" style={{ color: COLORS.muted }}>Access your pets' health history, visit notes, and vaccination records.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-12 h-12 border-4 border-t-transparent rounded-full"
                            style={{ borderColor: COLORS.accent, borderTopColor: 'transparent' }}
                        />
                        <p className="mt-4 font-bold" style={{ color: COLORS.muted }}>Loading medical records...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-xl border-2 border-dashed" style={{ borderColor: COLORS.border }}>
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Stethoscope className="w-10 h-10 text-amber-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.primary }}>No Medical Records Found</h2>
                        <p className="max-w-md mx-auto mb-8" style={{ color: COLORS.muted }}>
                            Medical records are created by doctors after your consultations. Once a doctor creates a report for your pet, it will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Reports List */}
                        <div className={`${selectedReport ? 'hidden lg:block lg:col-span-4' : 'col-span-12'} space-y-4`}>
                            {reports.map((report) => (
                                <motion.div
                                    key={report._id}
                                    whileHover={{ y: -4, shadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                    onClick={() => setSelectedReport(report)}
                                    className={`cursor-pointer p-5 rounded-3xl border transition-all duration-300 backdrop-blur-md shadow-sm ${selectedReport?._id === report._id ? 'shadow-lg border-[#c8860a]' : 'border-[rgba(122,90,72,0.12)] hover:shadow-md'}`}
                                    style={{ background: selectedReport?._id === report._id ? 'rgba(237, 228, 216, 0.95)' : 'rgba(237, 228, 216, 0.6)' }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: COLORS.light }}>
                                            <Heart className="w-7 h-7" style={{ color: COLORS.accent }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg truncate" style={{ color: COLORS.primary }}>{report.petName}</h3>
                                            <p className="text-sm" style={{ color: COLORS.muted }}>{report.species} • {report.breed}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5" style={{ color: COLORS.border }} />
                                    </div>
                                    <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs font-bold uppercase tracking-wider" style={{ borderColor: COLORS.border, color: COLORS.muted }}>
                                        <span className="flex items-center gap-1.5 truncate">
                                            <Calendar className="w-3.5 h-3.5" /> Updated {new Date(report.updatedAt).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Activity className="w-3.5 h-3.5" /> {report.visitNotes?.length || 0} Visits
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Report Detail */}
                        {selectedReport && (
                            <div className="lg:col-span-8">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="rounded-[2rem] shadow-2xl overflow-hidden border border-[rgba(122,90,72,0.12)]"
                                    style={{ background: 'rgba(237, 228, 216, 0.85)', backdropFilter: 'blur(16px)' }}
                                >
                                    {/* Detail Header */}
                                    <div className="p-8 pb-0 flex items-center justify-between">
                                        <button
                                            onClick={() => setSelectedReport(null)}
                                            className="lg:hidden p-2 rounded-xl"
                                            style={{ background: COLORS.light, color: COLORS.primary }}
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
                                            style={{ background: COLORS.light, color: COLORS.accent }}>
                                            <Shield className="w-3.5 h-3.5" /> Medical Record Verified
                                        </div>
                                    </div>

                                    <div className="p-8">
                                        <div className="flex flex-col md:flex-row gap-8 mb-10">
                                            <div className="w-32 h-32 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-inner"
                                                style={{ background: COLORS.light }}>
                                                <PawPrint className="w-16 h-16" style={{ color: COLORS.accent }} />
                                            </div>
                                            <div className="flex-1">
                                                <h2 className="text-3xl font-black mb-2" style={{ color: COLORS.primary }}>{selectedReport.petName}</h2>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {[
                                                        { label: selectedReport.species, icon: <Activity className="w-3 h-3" /> },
                                                        { label: selectedReport.breed, icon: <Hash className="w-3 h-3" /> },
                                                        { label: selectedReport.gender, icon: <User className="w-3 h-3" /> },
                                                        { label: `${selectedReport.age || '?'} yrs`, icon: <Calendar className="w-3 h-3" /> },
                                                        { label: `${selectedReport.weight || '?'} kg`, icon: <Activity className="w-3 h-3" /> },
                                                    ].map((tag, i) => (
                                                        <span key={i} className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 flex items-center gap-1.5">
                                                            {tag.icon} {tag.label}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-2xl border bg-amber-50/30" style={{ borderColor: COLORS.border }}>
                                                        <p className="text-[10px] uppercase font-black mb-1 opacity-50">Allergies</p>
                                                        <p className="text-sm font-bold">{selectedReport.allergies || 'None Known'}</p>
                                                    </div>
                                                    <div className="p-4 rounded-2xl border bg-amber-50/30" style={{ borderColor: COLORS.border }}>
                                                        <p className="text-[10px] uppercase font-black mb-1 opacity-50">Conditions</p>
                                                        <p className="text-sm font-bold">{selectedReport.existingConditions || 'None'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tabs Content */}
                                        <div className="space-y-12">
                                            {/* Visit History */}
                                            <section>
                                                <h3 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: COLORS.primary }}>
                                                    <History className="w-6 h-6" style={{ color: COLORS.accent }} /> Consultation History
                                                </h3>
                                                <div className="space-y-4">
                                                    {selectedReport.visitNotes?.length > 0 ? (
                                                        selectedReport.visitNotes.map((note, i) => (
                                                            <div key={i} className="p-6 rounded-[1.5rem] border bg-white" style={{ borderColor: COLORS.border }}>
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                                                                            <Clipboard className="w-5 h-5" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Visit Note</p>
                                                                            <p className="font-bold">{new Date(note.date || note._id.getTimestamp?.() || Date.now()).toLocaleDateString()}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm leading-relaxed text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                                    {note.notes}
                                                                </p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm italic" style={{ color: COLORS.muted }}>No visit notes recorded yet.</p>
                                                    )}
                                                </div>
                                            </section>

                                            {/* Vaccinations */}
                                            <section>
                                                <h3 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: COLORS.primary }}>
                                                    <Shield className="w-6 h-6" style={{ color: COLORS.accent }} /> Immunization Record
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {selectedReport.vaccinations?.length > 0 ? (
                                                        selectedReport.vaccinations.map((vac, i) => (
                                                            <div key={i} className="p-5 rounded-2xl border flex items-center gap-4 bg-emerald-50/20" style={{ borderColor: COLORS.border }}>
                                                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                                    <CheckCircle2 className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm">{vac.name}</p>
                                                                    <p className="text-xs text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded-full mt-1">
                                                                        {new Date(vac.date).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm italic" style={{ color: COLORS.muted }}>No vaccinations recorded.</p>
                                                    )}
                                                </div>
                                            </section>

                                            {/* Attachments */}
                                            {selectedReport.attachments?.length > 0 && (
                                                <section>
                                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: COLORS.primary }}>
                                                        <ExternalLink className="w-6 h-6" style={{ color: COLORS.accent }} /> Lab Results & Attachments
                                                    </h3>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                        {selectedReport.attachments.map((file, i) => (
                                                            <div
                                                                key={i}
                                                                onClick={() => setActiveAttachment(file)}
                                                                className="relative aspect-square rounded-2xl overflow-hidden border-2 border-amber-100 shadow-sm cursor-pointer hover:border-amber-400 transition-all group"
                                                            >
                                                                <img
                                                                    src={file.url}
                                                                    alt={file.filename}
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                                                                    <Search className="w-6 h-6 mb-1" />
                                                                    <span className="text-[10px] font-bold uppercase">View Detail</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </div>
                )}
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
                            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: COLORS.border }}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg" style={{ color: COLORS.primary }}>Lab Report Detail</h3>
                                        <p className="text-xs font-bold" style={{ color: COLORS.muted }}>{activeAttachment.filename || 'Untitled Document'}</p>
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
                                        <h4 className="text-xl font-black mb-4" style={{ color: COLORS.primary }}>PDF/Document Report</h4>
                                        <p className="mb-8" style={{ color: COLORS.muted }}>This document type is best viewed by downloading or opening in a new tab.</p>
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
        </div>
    );
};

export default MyPets;
