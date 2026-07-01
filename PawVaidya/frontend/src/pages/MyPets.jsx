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
import PawBackground from '../components/PawBackground';
import { useTranslation } from 'react-i18next';
import { assets } from '../assets/assets_frontend/assets';

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

    const isObsidian = userdata?.subscription?.status === 'Active' && userdata?.subscription?.plan === 'Obsidian';

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
        <div 
            className={`min-h-screen pt-24 pb-12 px-4 sm:px-[10%] transition-colors duration-500`}
            style={isObsidian ? { background: '#050505' } : { background: '#f2e4c7' }}
        >
            <PawBackground density={isObsidian ? "light" : "normal"} />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        {isObsidian ? (
                            <div className="p-3.5 rounded-2xl bg-[#E6C97A]/10 border border-[#E6C97A]/30 text-[#E6C97A] shadow-[0_0_15px_rgba(230,201,122,0.15)] shrink-0">
                                <PawPrint className="w-8 h-8" />
                            </div>
                        ) : null}
                        <div>
                            <h1 className={`text-4xl font-black flex items-center gap-2.5 tracking-tight ${isObsidian ? 'text-white' : ''}`} style={isObsidian ? {} : { color: COLORS.primary }}>
                                {!isObsidian && <PawPrint className="w-10 h-10" />}
                                {isObsidian && <Sparkles className="w-5 h-5 text-[#E6C97A] animate-pulse" />}
                                My Pet Family
                            </h1>
                            <p className={`mt-2 font-medium ${isObsidian ? 'text-neutral-400' : ''}`} style={isObsidian ? {} : { color: COLORS.muted }}>
                                Manage your beloved companions and their health journey.
                            </p>
                        </div>
                    </div>

                    {/* Toggle Buttons */}
                    <div className={`flex backdrop-blur-md p-1.5 rounded-2xl border transition-all duration-300 ${isObsidian ? 'bg-[#0E0E0E]/80 border-[#E6C97A]/15 shadow-[0_0_20px_rgba(0,0,0,0.4)]' : 'bg-white/50 border-[#e8d5b0] shadow-sm'}`}>
                        <button
                            onClick={() => setViewMode('profiles')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 flex items-center gap-2 ${
                                viewMode === 'profiles'
                                    ? isObsidian
                                        ? 'bg-[#1A1A1A] text-[#E6C97A] border border-[#E6C97A]/40 shadow-[0_0_15px_rgba(230,201,122,0.25)]'
                                        : 'bg-[#5A4035] text-white shadow-lg'
                                    : isObsidian
                                        ? 'text-neutral-500 hover:text-neutral-300'
                                        : 'text-[#8a6a5d] hover:bg-white/50'
                            }`}
                        >
                            {isObsidian && <PawPrint size={14} className="text-[#E6C97A]" />}
                            Pet Profiles
                        </button>
                        <button
                            onClick={() => setViewMode('records')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 flex items-center gap-2 ${
                                viewMode === 'records'
                                    ? isObsidian
                                        ? 'bg-[#1A1A1A] text-[#E6C97A] border border-[#E6C97A]/40 shadow-[0_0_15px_rgba(230,201,122,0.25)]'
                                        : 'bg-[#5A4035] text-white shadow-lg'
                                    : isObsidian
                                        ? 'text-neutral-500 hover:text-neutral-300'
                                        : 'text-[#8a6a5d] hover:bg-white/50'
                            }`}
                        >
                            {isObsidian && <History size={14} className="text-[#E6C97A]" />}
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
                            className={`h-[320px] rounded-[2.5rem] flex flex-col items-center justify-center gap-4 group transition-all ${
                                isObsidian
                                    ? 'border-2 border-dashed border-[#E6C97A]/30 bg-[#0A0A0A]/60 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:border-[#E6C97A]/60'
                                    : 'border-4 border-dashed border-[#e8d5b0] bg-white/20 hover:border-[#c8860a]'
                            }`}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${
                                isObsidian
                                    ? 'bg-[#E6C97A]/10 text-[#E6C97A] border border-[#E6C97A]/40 shadow-[0_0_15px_rgba(230,201,122,0.25)]'
                                    : 'bg-amber-50 text-amber-600'
                            }`}>
                                <Plus className="w-8 h-8" />
                            </div>
                            <span className={`font-black text-lg ${
                                isObsidian
                                    ? 'text-[#E6C97A]/95 group-hover:text-white'
                                    : 'text-[#5A4035]/60 group-hover:text-[#c8860a]'
                            }`}>
                                Add New Pet
                            </span>
                            <span className={`text-xs max-w-[180px] text-center font-medium leading-tight ${
                                isObsidian ? 'text-neutral-500' : 'text-neutral-400'
                            }`}>
                                Welcome a new companion to your family
                            </span>
                            {isObsidian && (
                                <svg viewBox="0 0 24 24" className="w-10 h-10 text-[#E6C97A]/10 mt-1" fill="currentColor">
                                    <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 3.5s3-1.5 3-3.5c0-1.66-1.34-3-3-3zm-4.5-2.5c-.83 0-1.5-.67-1.5-1.5S6.67 8.5 7.5 8.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-6.2-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3.4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                                </svg>
                            )}
                        </motion.button>

                        {userPets.map((pet) => (
                            <motion.div
                                key={pet._id}
                                layoutId={pet._id}
                                whileHover={{ y: -8 }}
                                className={`relative h-[320px] rounded-[2.5rem] overflow-hidden group border transition-all ${
                                    isObsidian
                                        ? 'border-[#E6C97A]/25 bg-[#0e0e0e] shadow-[0_0_30px_rgba(0,0,0,0.8)]'
                                        : 'border-[#e8d5b0] bg-[#ede4d8] shadow-xl'
                                }`}
                            >
                                {/* Pet Image/BG */}
                                <div className="absolute inset-0">
                                    <img
                                        src={pet.image || assets.profile_pic}
                                        alt={pet.name}
                                        className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${
                                            isObsidian
                                                ? 'opacity-75 group-hover:opacity-90'
                                                : 'opacity-40 group-hover:opacity-60 grayscale-[30%] group-hover:grayscale-0'
                                        }`}
                                    />
                                    <div className={`absolute inset-0 bg-gradient-to-t ${
                                        isObsidian
                                            ? 'from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent'
                                            : 'from-[#5A4035] via-transparent to-transparent opacity-80'
                                    }`} />
                                </div>

                                {/* Content */}
                                <div className="absolute inset-x-0 bottom-0 p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-2xl font-black text-white flex items-center gap-2">
                                                {pet.name} {pet.isVerified && <ShieldCheck size={18} className="text-[#E6C97A]" />}
                                            </h3>
                                            <p className={`text-xs font-bold uppercase tracking-widest ${isObsidian ? 'text-[#E6C97A]' : 'text-white/60'}`}>
                                                {pet.type} • {pet.breed}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setEditPet(pet); setIsAddModalOpen(true); }}
                                                className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${
                                                    isObsidian
                                                        ? 'bg-black/40 text-[#E6C97A] border-[#E6C97A]/30 hover:bg-[#E6C97A]/10 hover:border-[#E6C97A]/60'
                                                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                                                }`}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(pet._id)}
                                                className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${
                                                    isObsidian
                                                        ? 'bg-black/40 text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/60'
                                                        : 'bg-red-500/20 text-red-200 border-red-500/20 hover:bg-red-500/40'
                                                }`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 items-center">
                                        <div className={`backdrop-blur-md px-3 py-2 rounded-xl text-center border ${
                                            isObsidian
                                                ? 'bg-[#0E0E0E]/80 border-[#E6C97A]/15 shadow-[0_0_10px_rgba(0,0,0,0.3)]'
                                                : 'bg-white/10 border-white/5'
                                        }`}>
                                            <p className={`text-[8px] font-black uppercase tracking-tighter ${isObsidian ? 'text-neutral-400' : 'text-white/40'}`}>Age</p>
                                            <p className="text-xs text-white font-bold">{pet.age}y</p>
                                        </div>
                                        <div className={`backdrop-blur-md px-3 py-2 rounded-xl text-center border ${
                                            isObsidian
                                                ? 'bg-[#0E0E0E]/80 border-[#E6C97A]/15 shadow-[0_0_10px_rgba(0,0,0,0.3)]'
                                                : 'bg-white/10 border-white/5'
                                        }`}>
                                            <p className={`text-[8px] font-black uppercase tracking-tighter ${isObsidian ? 'text-neutral-400' : 'text-white/40'}`}>Sex</p>
                                            <p className="text-xs text-white font-bold truncate">{pet.gender}</p>
                                        </div>
                                        <div className={`backdrop-blur-md px-3 py-2 rounded-xl text-center border ${
                                            isObsidian
                                                ? 'bg-[#0E0E0E]/80 border-[#E6C97A]/15 shadow-[0_0_10px_rgba(0,0,0,0.3)]'
                                                : 'bg-white/10 border-white/5'
                                        }`}>
                                            <p className={`text-[8px] font-black uppercase tracking-tighter ${isObsidian ? 'text-neutral-400' : 'text-white/40'}`}>Class</p>
                                            <p className="text-xs text-white font-bold truncate">
                                                {pet.category?.split(' ')[0] || 'Pet'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedPetForID(pet)}
                                            className={`rounded-xl flex flex-col items-center justify-center transition-transform hover:scale-105 h-full ${
                                                isObsidian
                                                    ? 'bg-gradient-to-br from-amber-600 via-[#E6C97A] to-amber-700 text-black border border-[#E6C97A]/40 shadow-[0_0_15px_rgba(230,201,122,0.3)]'
                                                    : 'bg-gradient-to-br from-amber-400 to-yellow-600 border border-amber-300 shadow-lg text-white'
                                            }`}
                                        >
                                            <Star size={12} className={isObsidian ? 'text-black fill-current' : 'text-white fill-current'} />
                                            <p className={`text-[7px] font-black uppercase tracking-tighter mt-0.5 ${isObsidian ? 'text-black' : 'text-white'}`}>ID</p>
                                        </button>
                                    </div>
                                </div>

                                {isObsidian ? (
                                    <Star className="absolute top-6 right-6 text-[#E6C97A]/60 hover:text-[#E6C97A] transition-colors cursor-pointer" size={20} />
                                ) : (
                                    <Sparkles className="absolute top-6 right-6 text-amber-400 opacity-20 group-hover:opacity-100 transition-opacity" size={20} />
                                )}
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    /* MEDICAL RECORDS VIEW (Refactored legacy view) */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Reports List */}
                        <div className={`${reports.find(r => r._id === selectedPet) ? 'hidden lg:block lg:col-span-4' : 'col-span-12'} space-y-4`}>
                            {reports.length === 0 ? (
                                <div className={`p-12 rounded-[2rem] text-center border-2 border-dashed ${isObsidian ? 'bg-[#0E0E0E]/40 border-[#E6C97A]/15' : 'bg-white/50 border-[#e8d5b0]'}`}>
                                    <Stethoscope className={`mx-auto w-12 h-12 mb-4 ${isObsidian ? 'text-[#E6C97A]/30' : 'text-amber-200'}`} />
                                    <p className={`font-bold ${isObsidian ? 'text-neutral-500' : 'text-[#5A4035]/60'}`}>No medical history found.</p>
                                </div>
                            ) : (
                                reports.map((report) => (
                                    <motion.div
                                        key={report._id}
                                        onClick={() => setSelectedPet(report._id)}
                                        className={`cursor-pointer p-6 rounded-[2rem] border transition-all duration-300 relative overflow-hidden group flex items-center justify-between ${
                                            selectedPet === report._id
                                                ? isObsidian
                                                    ? 'bg-[#151515] border-[#E6C97A] shadow-[0_0_25px_rgba(230,201,122,0.2)] text-white'
                                                    : 'bg-[#5A4035] text-white shadow-2xl'
                                                : isObsidian
                                                    ? 'bg-[#0E0E0E]/60 border-[#E6C97A]/15 text-neutral-300 hover:bg-[#0E0E0E] hover:border-[#E6C97A]/30'
                                                    : 'bg-white/40 border-[#e8d5b0] hover:bg-white/60'
                                        }`}
                                    >
                                        {/* Subtle Paw Watermark on the right */}
                                        {isObsidian && (
                                            <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                                                <svg viewBox="0 0 24 24" className="w-24 h-24 text-[#E6C97A]" fill="currentColor">
                                                    <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 3.5s3-1.5 3-3.5c0-1.66-1.34-3-3-3zm-4.5-2.5c-.83 0-1.5-.67-1.5-1.5S6.67 8.5 7.5 8.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-6.2-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3.4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                                                </svg>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                                                selectedPet === report._id
                                                    ? isObsidian
                                                        ? 'bg-[#E6C97A]/10 border-[#E6C97A]/40 text-[#E6C97A]'
                                                        : 'bg-white/10 border-transparent text-amber-400'
                                                    : isObsidian
                                                        ? 'bg-black/40 border-[#E6C97A]/20 text-[#E6C97A]'
                                                        : 'bg-amber-50 border-transparent text-amber-600'
                                            }`}>
                                                <Heart className="w-6 h-6" fill={selectedPet === report._id ? 'currentColor' : 'none'} />
                                            </div>
                                            <div>
                                                <h3 className={`font-black text-lg ${isObsidian ? 'text-white' : ''}`}>{report.petName}</h3>
                                                <p className={`text-xs font-bold ${
                                                    selectedPet === report._id
                                                        ? isObsidian ? 'text-[#E6C97A]/80' : 'text-white/40'
                                                        : isObsidian ? 'text-neutral-500' : 'text-[#a08060]'
                                                }`}>
                                                    {report.species} • {report.breed}
                                                </p>
                                            </div>
                                        </div>

                                        {isObsidian ? (
                                            <ChevronRight className={`w-6 h-6 transition-transform group-hover:translate-x-1 ${
                                                selectedPet === report._id ? 'text-[#E6C97A]' : 'text-neutral-500'
                                            }`} />
                                        ) : null}
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

const DetailCard = ({ report, onClose, setActiveAttachment }) => {
    const { userdata } = useContext(AppContext);
    const isObsidian = userdata?.subscription?.status === 'Active' && userdata?.subscription?.plan === 'Obsidian';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-[3rem] shadow-2xl overflow-hidden border transition-colors duration-500 ${
                isObsidian
                    ? 'bg-[#0E0E0E] border-[#E6C97A]/15 text-white shadow-[0_0_50px_rgba(0,0,0,0.8)]'
                    : 'bg-white/90 border-[#e8d5b0] backdrop-blur-xl'
            }`}
        >
            <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 border ${
                            isObsidian
                                ? 'bg-[#E6C97A]/5 border-[#E6C97A]/20 text-[#E6C97A]'
                                : 'bg-amber-50 border-transparent text-amber-600'
                        }`}>
                            <PawPrint size={40} />
                        </div>
                        <div>
                            <h2 className={`text-3xl font-black ${isObsidian ? 'text-white' : 'text-[#5A4035]'}`}>{report.petName}</h2>
                            <div className="flex gap-2 mt-2">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                    isObsidian
                                        ? 'bg-[#E6C97A]/10 border-[#E6C97A]/20 text-[#E6C97A]'
                                        : 'bg-amber-100 border-transparent text-amber-700'
                                }`}>
                                    {report.species}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                    isObsidian
                                        ? 'bg-zinc-900 border-zinc-800 text-neutral-400'
                                        : 'bg-[#5A4035]/5 border-transparent text-[#5A4035]/60'
                                }`}>
                                    {report.age || '?'} Years
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className={`p-3 rounded-2xl lg:hidden ${
                            isObsidian
                                ? 'bg-zinc-900 border border-zinc-800 text-white'
                                : 'bg-gray-50'
                        }`}
                    >
                        <ChevronLeft />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                    <div className={`p-6 rounded-3xl border ${
                        isObsidian
                            ? 'bg-[#E6C97A]/5 border-[#E6C97A]/15'
                            : 'bg-amber-50/50 border border-amber-100'
                    }`}>
                        <p className={`text-[10px] font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]/60' : 'text-amber-700/40'}`}>Primary Conditions</p>
                        <p className={`text-sm font-bold ${isObsidian ? 'text-white' : 'text-[#5A4035]'}`}>{report.existingConditions || 'None Recorded'}</p>
                    </div>
                    <div className={`p-6 rounded-3xl border ${
                        isObsidian
                            ? 'bg-red-500/5 border border-red-500/10'
                            : 'bg-emerald-50/50 border border-emerald-100'
                    }`}>
                        <p className={`text-[10px] font-black uppercase mb-2 ${isObsidian ? 'text-red-400/60' : 'text-emerald-700/40'}`}>Known Allergies</p>
                        <p className={`text-sm font-bold ${isObsidian ? 'text-white' : 'text-[#5A4035]'}`}>{report.allergies || 'None Known'}</p>
                    </div>
                </div>

                <div className="space-y-12">
                    <section>
                        <h4 className={`flex items-center gap-2 text-lg font-black mb-6 ${isObsidian ? 'text-white' : 'text-[#5A4035]'}`}>
                            <History className={isObsidian ? 'text-[#E6C97A]' : 'text-amber-500'} /> Consultation Notes
                        </h4>
                        <div className="space-y-4">
                            {report.visitNotes?.map((note, i) => (
                                <div 
                                    key={i} 
                                    className={`p-6 rounded-2xl border leading-relaxed text-sm ${
                                        isObsidian
                                            ? 'bg-[#151515] border-zinc-800 text-neutral-300 shadow-lg'
                                            : 'bg-white border border-gray-100 shadow-sm text-[#5A4035]'
                                    }`}
                                >
                                    <div className={`flex items-center gap-2 mb-3 text-[10px] font-black uppercase ${
                                        isObsidian ? 'text-[#E6C97A]/50' : 'text-amber-600/50'
                                    }`}>
                                        <Clock size={12} /> {new Date(note.date).toLocaleDateString()}
                                    </div>
                                    {note.notes}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h4 className={`flex items-center gap-2 text-lg font-black mb-6 ${isObsidian ? 'text-white' : 'text-[#5A4035]'}`}>
                            <Shield className={isObsidian ? 'text-[#E6C97A]' : 'text-emerald-500'} /> Immunizations
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {report.vaccinations?.map((v, i) => (
                                <div 
                                    key={i} 
                                    className={`flex items-center gap-4 p-4 rounded-2xl border ${
                                        isObsidian
                                            ? 'bg-emerald-500/5 border border-emerald-500/10 text-neutral-300'
                                            : 'bg-emerald-50/30 border border-emerald-100'
                                    }`}
                                >
                                    <CheckCircle2 className="text-emerald-500" size={20} />
                                    <div>
                                        <p className={`font-bold text-sm ${isObsidian ? 'text-white' : 'text-[#5A4035]'}`}>{v.name}</p>
                                        <p className={`text-[10px] font-bold ${isObsidian ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                            {new Date(v.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {report.attachments?.length > 0 && (
                        <section>
                            <h4 className={`flex items-center gap-2 text-lg font-black mb-6 ${isObsidian ? 'text-white' : 'text-[#5A4035]'}`}>
                                <Search className={isObsidian ? 'text-[#E6C97A]' : 'text-blue-500'} /> Diagnostic Results
                            </h4>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {report.attachments.map((file, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => setActiveAttachment(file)} 
                                        className={`aspect-square rounded-2xl border-2 cursor-pointer overflow-hidden group relative shadow-md ${
                                            isObsidian
                                                ? 'border-zinc-800 bg-zinc-950/40 shadow-inner'
                                                : 'border-amber-50 bg-white'
                                        }`}
                                    >
                                        {file.url.toLowerCase().endsWith('.pdf') || file.type === 'raw' ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                                <FileText size={32} className={`transition-colors ${
                                                    isObsidian
                                                        ? 'text-[#E6C97A]/40 group-hover:text-[#E6C97A]'
                                                        : 'text-amber-200 group-hover:text-amber-500'
                                                }`} />
                                                <p className="text-[8px] mt-2 text-gray-400 text-center truncate w-full font-bold uppercase">{file.filename || 'PDF Report'}</p>
                                            </div>
                                        ) : (
                                            <img src={file.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Thumbnail" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                            <Search size={20} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

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
                {attachment.url.toLowerCase().endsWith('.pdf') || attachment.type === 'raw' ? (
                    <iframe 
                        src={`${attachment.url}#view=FitH`} 
                        className="w-full h-full min-h-[600px] rounded-2xl shadow-xl"
                        title="Document Viewer"
                    />
                ) : (
                    <img src={attachment.url} className="max-w-full rounded-2xl shadow-xl" alt="Medical Document" />
                )}
            </div>
        </motion.div>
    </motion.div>
);

export default MyPets;
