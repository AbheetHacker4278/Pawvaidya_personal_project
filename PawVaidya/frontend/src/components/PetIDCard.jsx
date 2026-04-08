import React from 'react';
import { motion } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { assets } from '../assets/assets_frontend/assets';

const PetIDCard = ({ pet, ownerName, phone, onClose }) => {
    const { t } = useTranslation();
    if (!pet) return null;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, y: 20, rotateY: 90 }}
                animate={{ scale: 1, y: 0, rotateY: 0 }}
                exit={{ scale: 0.8, y: 20, rotateY: -90 }}
                transition={{ type: "spring", damping: 15, stiffness: 100 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md aspect-[1.58/1] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/30"
            >
                {/* Premium Background Layer */}
                <div className="absolute inset-0 bg-[#1a1210] overflow-hidden">
                    {/* Decorative Patterns */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-600/5 rounded-full blur-2xl -ml-24 -mb-24"></div>

                    {/* Texture Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
                </div>

                {/* Card Content Layout */}
                <div className="relative h-full p-8 flex flex-col justify-between">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center p-2 shadow-lg">
                                <img src={assets.logo} alt="Logo" className="w-full h-full brightness-0 invert" />
                            </div>
                            <div>
                                <h3 className="text-white text-base font-black tracking-tighter uppercase leading-none">PawVaidya</h3>
                                <p className="text-amber-500/60 text-[8px] font-bold uppercase tracking-[0.2em] mt-1">Official Pet Passport</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                                <ShieldCheck size={12} className="text-amber-400" />
                                <span className="text-white/80 text-[9px] font-black uppercase tracking-widest">Verified</span>
                            </div>
                            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Main Content Body */}
                    <div className="flex gap-8 items-center flex-1">
                        {/* Pet Image with Premium Frame */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-[2rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                            <div className="relative w-32 h-32 rounded-[1.8rem] overflow-hidden border-2 border-white/20 shadow-2xl bg-[#2a1d1a]">
                                <img src={pet.image || assets.upload_area} alt="Pet" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            </div>
                        </div>

                        {/* Pet Details Grid */}
                        <div className="flex-1">
                            <h4 className="text-white text-3xl font-black mb-4 tracking-tight drop-shadow-md">{pet.name}</h4>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                <div className="space-y-0.5">
                                    <p className="text-amber-500/40 text-[9px] uppercase font-black tracking-widest">{t('profile.species')}</p>
                                    <p className="text-white/90 text-sm font-bold truncate">{pet.type || 'N/A'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-amber-500/40 text-[9px] uppercase font-black tracking-widest">{t('profile.breed')}</p>
                                    <p className="text-white/90 text-sm font-bold truncate">{pet.breed || 'N/A'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-amber-500/40 text-[9px] uppercase font-black tracking-widest">Age</p>
                                    <p className="text-white/90 text-sm font-bold truncate">{pet.age} Years</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-amber-500/40 text-[9px] uppercase font-black tracking-widest">Gender</p>
                                    <p className="text-white/90 text-sm font-bold truncate">{pet.gender}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-amber-500/40 text-[9px] uppercase font-black tracking-widest">Owner</p>
                                    <p className="text-white/90 text-[11px] font-bold truncate">{ownerName}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-amber-500/40 text-[9px] uppercase font-black tracking-widest">ID No.</p>
                                    <p className="text-amber-400 font-mono text-[11px] font-black">#PV{phone?.slice(-4) || '9999'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Card Info */}
                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <p className="text-white/20 text-[7px] font-medium tracking-[0.3em] uppercase">Security Level: Gold Tier</p>
                        <div className="flex gap-4">
                            <div className="w-12 h-1.5 rounded-full bg-white/5"></div>
                            <div className="w-8 h-1.5 rounded-full bg-amber-500/20"></div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PetIDCard;
