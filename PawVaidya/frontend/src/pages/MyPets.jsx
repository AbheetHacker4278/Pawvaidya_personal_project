import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PawPrint, FileText, Activity, Calendar,
    ChevronRight, Stethoscope, ChevronLeft,
    Clock, Plus, Download, ExternalLink, Mail,
    Clipboard, Hash, User, Heart, Shield,
    History, CheckCircle2, Search, X, Edit2, Trash2,
    ShieldCheck, Sparkles, Star, CreditCard
} from 'lucide-react';
import AddPetModal from '../components/AddPetModal';
import PetIDCard from '../components/PetIDCard';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const { userPets, fetchUserPets, deletePet, getUserPetReports, token, userdata } = useContext(AppContext);

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPet, setSelectedPet] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editPet, setEditPet] = useState(null);
    const [viewMode, setViewMode] = useState('profiles'); // 'profiles' or 'records'
    const [activeAttachment, setActiveAttachment] = useState(null);
    const [selectedPetForID, setSelectedPetForID] = useState(null);

    useEffect(() => {
        if (token) {
            getData();
        }
    }, [token]);

    const getData = async () => {
        setLoading(true);
        await fetchUserPets();
        const reportsData = await getUserPetReports();
        if (reportsData) setReports(reportsData);
        setLoading(false);
    };

    const handleDelete = async (petId) => {
        if (window.confirm("Are you sure you want to remove this pet profile?")) {
            await deletePet(petId);
        }
    };

    if (!token) return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <p className="text-xl font-bold" style={{ color: COLORS.primary }}>Please login to view your pets.</p>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-[10%] transition-opacity duration-500">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black flex items-center gap-3 tracking-tight" style={{ color: COLORS.primary }}>
                            <PawPrint className="w-10 h-10" /> My Pet Family
                        </h1>
                        <p className="mt-2 font-medium" style={{ color: COLORS.muted }}>Manage your beloved companions and their health journey.</p>
                    </div>

                    <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-[#e8d5b0] shadow-sm">
                        <button
                            onClick={() => setViewMode('profiles')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${viewMode === 'profiles' ? 'bg-[#5A4035] text-white shadow-lg' : 'text-[#8a6a5d] hover:bg-white/50'}`}
                        >
                            Pet Profiles
                        </button>
                        <button
                            onClick={() => setViewMode('records')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${viewMode === 'records' ? 'bg-[#5A4035] text-white shadow-lg' : 'text-[#8a6a5d] hover:bg-white/50'}`}
                        >
                            History
                        </button>
                    </div>
                </div>

                {viewMode === 'profiles' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Add Pet Card */}
                        <motion.button
                            whileHover={{ y: -8, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setEditPet(null); setIsAddModalOpen(true); }}
                            className="h-[320px] rounded-[2.5rem] border-4 border-dashed border-[#e8d5b0] flex flex-col items-center justify-center gap-4 group hover:border-[#c8860a] transition-all bg-white/20"
                        >
                            <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform duration-500">
                                <Plus className="w-8 h-8" />
                            </div>
                            <span className="font-black text-lg text-[#5A4035]/60 group-hover:text-[#c8860a]">Add New Pet</span>
                        </motion.button>

                        {userPets.map((pet) => (
                            <motion.div
                                key={pet._id}
                                layoutId={pet._id}
                                whileHover={{ y: -8 }}
                                className="relative h-[320px] rounded-[2.5rem] border border-[#e8d5b0] bg-[#ede4d8] shadow-xl overflow-hidden group"
                            >
                                {/* Pet Image/BG */}
                                <div className="absolute inset-0">
                                    <img
                                        src={pet.image || assets.profile_pic}
                                        alt={pet.name}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0 opacity-40 group-hover:opacity-60"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#5A4035] via-transparent to-transparent opacity-80" />
                                </div>

                                {/* Content */}
                                <div className="absolute inset-x-0 bottom-0 p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-2xl font-black text-white flex items-center gap-2">
                                                {pet.name} {pet.isVerified && <ShieldCheck size={18} className="text-amber-400" />}
                                            </h3>
                                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{pet.type} • {pet.breed}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setEditPet(pet); setIsAddModalOpen(true); }}
                                                className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(pet._id)}
                                                className="p-2.5 rounded-xl bg-red-500/20 backdrop-blur-md text-red-200 border border-red-500/20 hover:bg-red-500/40 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-center border border-white/5">
                                            <p className="text-[8px] text-white/40 font-black uppercase tracking-tighter">Age</p>
                                            <p className="text-xs text-white font-bold">{pet.age}y</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-center border border-white/5">
                                            <p className="text-[8px] text-white/40 font-black uppercase tracking-tighter">Sex</p>
                                            <p className="text-xs text-white font-bold">{pet.gender}</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-center border border-white/5">
                                            <p className="text-[8px] text-white/40 font-black uppercase tracking-tighter">Class</p>
                                            <p className="text-xs text-white font-bold truncate">{pet.category?.split(' ')[0] || 'Pet'}</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedPetForID(pet)}
                                            className="bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex flex-col items-center justify-center border border-amber-300 shadow-lg hover:scale-105 transition-transform"
                                        >
                                            <Star size={12} className="text-white fill-current" />
                                            <p className="text-[7px] text-white font-black uppercase tracking-tighter mt-0.5">ID</p>
                                        </button>
                                    </div>
                                </div>

                                <Sparkles className="absolute top-6 right-6 text-amber-400 opacity-20 group-hover:opacity-100 transition-opacity" size={20} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    /* MEDICAL RECORDS VIEW (Refactored legacy view) */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Reports List */}
                        <div className={`${reports.find(r => r._id === selectedPet) ? 'hidden lg:block lg:col-span-4' : 'col-span-12'} space-y-4`}>
                            {reports.length === 0 ? (
                                <div className="bg-white/50 p-12 rounded-[2rem] text-center border-2 border-dashed border-[#e8d5b0]">
                                    <Stethoscope className="mx-auto w-12 h-12 text-amber-200 mb-4" />
                                    <p className="font-bold text-[#5A4035]/60">No medical history found.</p>
                                </div>
                            ) : (
                                reports.map((report) => (
                                    <motion.div
                                        key={report._id}
                                        onClick={() => setSelectedPet(report._id)}
                                        className={`cursor-pointer p-6 rounded-[2rem] border transition-all duration-300 ${selectedPet === report._id ? 'bg-[#5A4035] text-white shadow-2xl' : 'bg-white/40 border-[#e8d5b0] hover:bg-white/60'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedPet === report._id ? 'bg-white/10' : 'bg-amber-50'}`}>
                                                <Heart className={`w-6 h-6 ${selectedPet === report._id ? 'text-amber-400' : 'text-amber-600'}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg">{report.petName}</h3>
                                                <p className={`text-xs font-bold ${selectedPet === report._id ? 'text-white/40' : 'text-[#a08060]'}`}>{report.species} • {report.breed}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Report Detail View (Legacy Refined) */}
                        {reports.find(r => r._id === selectedPet) && (
                            <div className="lg:col-span-8">
                                <DetailCard report={reports.find(r => r._id === selectedPet)} onClose={() => setSelectedPet(null)} setActiveAttachment={setActiveAttachment} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AddPetModal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); setEditPet(null); getData(); }}
                editPet={editPet}
            />

            {/* ATTACHMENT DETAIL MODAL */}
            <AnimatePresence>
                {activeAttachment && <AttachmentModal attachment={activeAttachment} onClose={() => setActiveAttachment(null)} />}
            </AnimatePresence>

            <AnimatePresence>
                {selectedPetForID && (
                    <PetIDCard
                        pet={selectedPetForID}
                        ownerName={userdata?.name}
                        phone={userdata?.phone}
                        onClose={() => setSelectedPetForID(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const DetailCard = ({ report, onClose, setActiveAttachment }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-[3rem] shadow-2xl overflow-hidden border border-[#e8d5b0] bg-white/90 backdrop-blur-xl"
    >
        <div className="p-10">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-[2rem] bg-amber-50 flex items-center justify-center shrink-0">
                        <PawPrint size={40} className="text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-[#5A4035]">{report.petName}</h2>
                        <div className="flex gap-2 mt-2">
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider">{report.species}</span>
                            <span className="px-3 py-1 bg-[#5A4035]/5 text-[#5A4035]/60 rounded-full text-[10px] font-black uppercase tracking-wider">{report.age || '?'} Years</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-3 bg-gray-50 rounded-2xl lg:hidden"><ChevronLeft /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-100">
                    <p className="text-[10px] font-black text-amber-700/40 uppercase mb-2">Primary Conditions</p>
                    <p className="text-sm font-bold text-[#5A4035]">{report.existingConditions || 'None Recorded'}</p>
                </div>
                <div className="p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-700/40 uppercase mb-2">Known Allergies</p>
                    <p className="text-sm font-bold text-[#5A4035]">{report.allergies || 'None Known'}</p>
                </div>
            </div>

            <div className="space-y-12">
                <section>
                    <h4 className="flex items-center gap-2 text-lg font-black text-[#5A4035] mb-6"><History className="text-amber-500" /> Consultation Notes</h4>
                    <div className="space-y-4">
                        {report.visitNotes?.map((note, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm leading-relaxed text-sm text-[#5A4035]">
                                <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-amber-600/50 uppercase">
                                    <Clock size={12} /> {new Date(note.date).toLocaleDateString()}
                                </div>
                                {note.notes}
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h4 className="flex items-center gap-2 text-lg font-black text-[#5A4035] mb-6"><Shield className="text-emerald-500" /> Immunizations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.vaccinations?.map((v, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100">
                                <CheckCircle2 className="text-emerald-500" size={20} />
                                <div><p className="font-bold text-sm text-[#5A4035]">{v.name}</p><p className="text-[10px] font-bold text-emerald-600">{new Date(v.date).toLocaleDateString()}</p></div>
                            </div>
                        ))}
                    </div>
                </section>

                {report.attachments?.length > 0 && (
                    <section>
                        <h4 className="flex items-center gap-2 text-lg font-black text-[#5A4035] mb-6"><Search className="text-blue-500" /> Diagnostic Results</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {report.attachments.map((file, i) => (
                                <div key={i} onClick={() => setActiveAttachment(file)} className="aspect-square rounded-2xl border-2 border-amber-50 cursor-pointer overflow-hidden group relative shadow-md">
                                    <img src={file.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Search size={20} /></div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    </motion.div>
);

const AttachmentModal = ({ attachment, onClose }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md">
        <motion.div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <FileText className="text-amber-600" />
                    <div><h3 className="font-black text-[#5A4035]">Document Viewer</h3><p className="text-xs font-bold text-gray-400">{attachment.filename}</p></div>
                </div>
                <div className="flex gap-2">
                    <a href={attachment.url} target="_blank" className="p-3 bg-amber-50 text-amber-700 rounded-xl"><Download size={20} /></a>
                    <button onClick={onClose} className="p-3 bg-gray-50 text-gray-400 rounded-xl"><X size={20} /></button>
                </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-8 flex items-center justify-center">
                <img src={attachment.url} className="max-w-full rounded-2xl shadow-xl" />
            </div>
        </motion.div>
    </motion.div>
);

export default MyPets;
