import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../context/DoctorContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Save, FileText, Clipboard, History, Plus,
    Stethoscope, Activity, Hash, Layers, Calendar,
    User, CheckCircle2, Loader2, Mail
} from 'lucide-react';

const THEME = {
    primary: '#5A4035',
    accent: '#c8860a',
    light: '#fdf8f0',
    border: '#e8d5b0',
    muted: '#a08060',
    success: '#059669'
};

const InputField = ({ label, name, value, onChange, placeholder, type = "text", required = false }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: THEME.muted }}>{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="px-4 py-2.5 rounded-xl border-2 text-sm focus:outline-none transition-all focus:border-opacity-100"
            style={{ borderColor: THEME.border, background: '#fff', color: THEME.primary }}
        />
    </div>
);

const PetReportModal = ({ appointment, onClose }) => {
    const { getPetReports, createPetReport, addVisitNote, dtoken } = useContext(DoctorContext);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('select'); // 'select', 'create', 'note'
    const [selectedReport, setSelectedReport] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form states for new report
    const [reportForm, setReportForm] = useState({
        petName: '',
        species: '',
        breed: '',
        gender: '',
        age: '',
        weight: '',
        color: '',
        allergies: '',
        existingConditions: ''
    });

    // Form state for visit note
    const [visitNote, setVisitNote] = useState('');

    useEffect(() => {
        fetchReports();
    }, [appointment.userId]);

    const fetchReports = async () => {
        setLoading(true);
        const data = await getPetReports(appointment.userId);
        if (data) {
            setReports(data);
            if (data.length > 0) {
                setMode('select');
            } else {
                setMode('create');
                setReportForm(prev => ({ ...prev, petName: appointment.userData.name || '' }));
            }
        }
        setLoading(false);
    };

    const handleCreateReport = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const data = await createPetReport({
            ...reportForm,
            userId: appointment.userId,
            doctorId: appointment.docId
        });
        if (data) {
            setSelectedReport(data);
            setMode('note');
        }
        setSubmitting(false);
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await addVisitNote({
            reportId: selectedReport._id,
            appointmentId: appointment._id,
            notes: visitNote,
            docId: appointment.docId
        });
        if (res) {
            onClose();
        }
        setSubmitting(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b" style={{ borderColor: THEME.light, background: THEME.primary }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <Clipboard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">Pet Medical Record</h3>
                            <p className="text-xs text-white/70 font-medium">Session with {appointment.userData.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin" style={{ color: THEME.accent }} />
                            <p className="font-bold text-sm" style={{ color: THEME.muted }}>Fetching medical history...</p>
                        </div>
                    ) : (
                        <>
                            {/* Stepper / Tabs */}
                            <div className="flex gap-2 mb-8 p-1.5 rounded-2xl" style={{ background: THEME.light }}>
                                <button
                                    onClick={() => reports.length > 0 && setMode('select')}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${mode === 'select' ? 'bg-white shadow-sm' : 'opacity-50'}`}
                                    style={{ color: mode === 'select' ? THEME.primary : THEME.muted }}
                                >
                                    <History className="w-4 h-4" /> Select Pet
                                </button>
                                <button
                                    onClick={() => setMode('create')}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${mode === 'create' ? 'bg-white shadow-sm' : 'opacity-50'}`}
                                    style={{ color: mode === 'create' ? THEME.primary : THEME.muted }}
                                >
                                    <Plus className="w-4 h-4" /> New Record
                                </button>
                                <button
                                    disabled={!selectedReport}
                                    onClick={() => selectedReport && setMode('note')}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${mode === 'note' ? 'bg-white shadow-sm' : 'opacity-50 text-gray-400 cursor-not-allowed'}`}
                                    style={{ color: mode === 'note' ? THEME.primary : THEME.muted }}
                                >
                                    <FileText className="w-4 h-4" /> Add Notes
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {/* Mode: Select Existing Report */}
                                {mode === 'select' && (
                                    <motion.div
                                        key="select"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="space-y-4"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {reports.map((report) => (
                                                <button
                                                    key={report._id}
                                                    onClick={() => {
                                                        setSelectedReport(report);
                                                        setMode('note');
                                                    }}
                                                    className={`p-4 rounded-2xl border-2 text-left transition-all hover:border-opacity-100 ${selectedReport?._id === report._id ? 'border-primary ring-2 ring-primary ring-opacity-10' : ''}`}
                                                    style={{
                                                        borderColor: selectedReport?._id === report._id ? THEME.accent : THEME.border,
                                                        background: selectedReport?._id === report._id ? THEME.light : '#fff'
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#fff' }}>
                                                            {report.species === 'Dog' ? '🐶' : report.species === 'Cat' ? '🐱' : '🐾'}
                                                        </div>
                                                        <div>
                                                            <p className="font-black" style={{ color: THEME.primary }}>{report.petName}</p>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: THEME.muted }}>{report.breed || 'Unknown Breed'}</p>
                                                        </div>
                                                        {selectedReport?._id === report._id && <CheckCircle2 className="w-5 h-5 ml-auto" style={{ color: THEME.success }} />}
                                                    </div>
                                                    <div className="text-[11px] flex items-center gap-2 font-medium" style={{ color: THEME.muted }}>
                                                        <Activity className="w-3 h-3" /> {report.visitNotes.length} Visit Notes
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Mode: Create New Report */}
                                {mode === 'create' && (
                                    <motion.form
                                        key="create"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        onSubmit={handleCreateReport}
                                        className="space-y-6"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <InputField
                                                label="Pet Name"
                                                value={reportForm.petName}
                                                onChange={e => setReportForm({ ...reportForm, petName: e.target.value })}
                                                required
                                            />
                                            <InputField
                                                label="Species"
                                                placeholder="e.g. Dog, Cat"
                                                value={reportForm.species}
                                                onChange={e => setReportForm({ ...reportForm, species: e.target.value })}
                                                required
                                            />
                                            <InputField
                                                label="Breed"
                                                value={reportForm.breed}
                                                onChange={e => setReportForm({ ...reportForm, breed: e.target.value })}
                                            />
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: THEME.muted }}>Gender</label>
                                                <select
                                                    value={reportForm.gender}
                                                    onChange={e => setReportForm({ ...reportForm, gender: e.target.value })}
                                                    className="px-4 py-2.5 rounded-xl border-2 text-sm focus:outline-none"
                                                    style={{ borderColor: THEME.border, background: '#fff' }}
                                                >
                                                    <option value="">Select</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                            </div>
                                            <InputField
                                                label="Age"
                                                value={reportForm.age}
                                                onChange={e => setReportForm({ ...reportForm, age: e.target.value })}
                                            />
                                            <InputField
                                                label="Weight"
                                                value={reportForm.weight}
                                                onChange={e => setReportForm({ ...reportForm, weight: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: THEME.muted }}>Allergies</label>
                                                <textarea
                                                    value={reportForm.allergies}
                                                    onChange={e => setReportForm({ ...reportForm, allergies: e.target.value })}
                                                    className="px-4 py-3 rounded-xl border-2 text-sm min-h-[80px] focus:outline-none"
                                                    style={{ borderColor: THEME.border, background: '#fff' }}
                                                    placeholder="List any known allergies..."
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: THEME.muted }}>Existing Conditions</label>
                                                <textarea
                                                    value={reportForm.existingConditions}
                                                    onChange={e => setReportForm({ ...reportForm, existingConditions: e.target.value })}
                                                    className="px-4 py-3 rounded-xl border-2 text-sm min-h-[80px] focus:outline-none"
                                                    style={{ borderColor: THEME.border, background: '#fff' }}
                                                    placeholder="Chronic issues, previous surgeries..."
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl flex items-start gap-3 border border-dashed" style={{ borderColor: THEME.accent, background: THEME.light }}>
                                            <Mail className="w-5 h-5 shrink-0" style={{ color: THEME.accent }} />
                                            <p className="text-xs font-medium" style={{ color: THEME.primary }}>
                                                Creating this report will automatically send a full health profile email to <strong>{appointment.userData.email}</strong>.
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-3 shadow-lg transition-transform active:scale-[0.98]"
                                            style={{ background: `linear-gradient(135deg, ${THEME.accent}, #f59e0b)` }}
                                        >
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Record & Email User</>}
                                        </button>
                                    </motion.form>
                                )}

                                {/* Mode: Add Visit Note */}
                                {mode === 'note' && (
                                    <motion.form
                                        key="note"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        onSubmit={handleAddNote}
                                        className="space-y-6"
                                    >
                                        <div className="p-4 rounded-2xl border-2 flex items-center gap-3" style={{ background: THEME.light, borderColor: THEME.border }}>
                                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl">
                                                {selectedReport?.species === 'Dog' ? '🐶' : '🐾'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: THEME.muted }}>Adding Note For</p>
                                                <p className="font-black" style={{ color: THEME.primary }}>{selectedReport?.petName}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: THEME.muted }}>Consultation Summary & Prescription</label>
                                            <textarea
                                                required
                                                value={visitNote}
                                                onChange={e => setVisitNote(e.target.value)}
                                                className="px-4 py-4 rounded-2xl border-2 text-sm min-h-[250px] focus:outline-none transition-all placeholder:italic"
                                                style={{ borderColor: THEME.border, background: '#fff', color: THEME.primary }}
                                                placeholder="Detail your findings, diagnosis, and recommended treatment plan here..."
                                            />
                                        </div>

                                        <div className="p-4 rounded-2xl flex items-start gap-3 border border-dashed" style={{ borderColor: THEME.success, background: '#f0fdf4' }}>
                                            <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: THEME.success }} />
                                            <p className="text-xs font-medium" style={{ color: THEME.success }}>
                                                Submission will securely save the note and immediately mail a summary to the pet owner.
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-3 shadow-lg transition-transform active:scale-[0.98]"
                                            style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                                        >
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Finalize & Send to User</>}
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PetReportModal;
