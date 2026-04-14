import React from 'react';
import { motion } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { assets } from '../assets/assets_frontend/assets';

const PetIDCard = ({ pet, ownerName, phone, onClose }) => {
    const { t } = useTranslation();
    if (!pet) return null;

    // QR payload — unique per pet
    const qrPayload = JSON.stringify({
        qrToken: pet.qrToken || pet._id,
        petId: pet._id,
        ownerId: pet.ownerId
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                id="pet-id-card"
                initial={{ scale: 0.8, y: 20, rotateY: 90 }}
                animate={{ scale: 1, y: 0, rotateY: 0 }}
                exit={{ scale: 0.8, y: 20, rotateY: -90 }}
                transition={{ type: "spring", damping: 15, stiffness: 100 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-[500px] aspect-[1.58/1] rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/20"
            >
                {/* Premium Background Layer */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1f1513] to-[#0a0706] overflow-hidden">
                    {/* Decorative Patterns */}
                    <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-yellow-600/5 rounded-full blur-3xl -ml-24 -mb-24"></div>

                    {/* Texture Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
                </div>

                {/* Card Content Layout */}
                <div className="relative h-full p-6 sm:p-7 flex flex-col justify-between">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1 items-start">
                            <img src="https://i.ibb.co/R2Y4vBk/Screenshot-2024-11-23-000108-removebg-preview.png" alt="PawVaidya Logo" className="h-6 sm:h-7 w-auto object-contain brightness-0 invert opacity-90 drop-shadow-md" />
                            <p className="text-amber-500 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.25em] ml-1 opacity-80">Official Pet Passport</p>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 mt-1">
                            <div className="bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-amber-400" />
                                <span className="text-white/90 text-[10px] font-black uppercase tracking-widest">Verified</span>
                            </div>
                            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors bg-white/5 rounded-full p-1 border border-white/5">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Main Content Body */}
                    <div className="flex gap-4 sm:gap-6 items-center flex-1 mt-3 sm:mt-1">
                        {/* Pet Image with Premium Frame */}
                        <div className="relative group shrink-0">
                            <div className="absolute -inset-1.5 bg-gradient-to-br from-amber-400/50 to-orange-600/30 rounded-[1.5rem] blur-md opacity-40 group-hover:opacity-70 transition duration-500"></div>
                            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[1.4rem] overflow-hidden border-2 border-white/20 shadow-2xl bg-[#2a1d1a]">
                                <img src={pet.image || assets.upload_area} alt="Pet" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            </div>
                        </div>

                        {/* Pet Details */}
                        <div className="flex-1 min-w-0 pr-2">
                            <h4 className="text-white text-3xl sm:text-4xl font-black mb-2 tracking-tight drop-shadow-md leading-normal pb-1">{pet.name}</h4>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                                <div className="space-y-0.5">
                                    <p className="text-amber-500/60 text-[8px] sm:text-[9px] uppercase font-black tracking-widest leading-normal">Species</p>
                                    <p className="text-white/95 text-xs sm:text-[13px] font-bold leading-normal pb-0.5">{pet.type || 'N/A'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-amber-500/60 text-[8px] sm:text-[9px] uppercase font-black tracking-widest leading-normal">Breed</p>
                                    <p className="text-white/95 text-xs sm:text-[13px] font-bold leading-normal pb-0.5">{pet.breed || 'N/A'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-amber-500/60 text-[8px] sm:text-[9px] uppercase font-black tracking-widest leading-normal">Age</p>
                                    <p className="text-white/95 text-xs sm:text-[13px] font-bold leading-normal pb-0.5">{pet.age} Years</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-amber-500/60 text-[8px] sm:text-[9px] uppercase font-black tracking-widest leading-normal">Gender</p>
                                    <p className="text-white/95 text-xs sm:text-[13px] font-bold leading-normal pb-0.5">{pet.gender}</p>
                                </div>
                            </div>
                        </div>

                        {/* Right: QR Code */}
                        <div className="shrink-0 flex flex-col items-center">
                            <div className="bg-white rounded-[1rem] p-1.5 shadow-2xl shadow-amber-900/40 border-2 border-white/50">
                                <QRCodeSVG
                                    value={qrPayload}
                                    size={120}
                                    level="L"
                                    bgColor="#ffffff"
                                    fgColor="#1a1210"
                                    includeMargin={true}
                                />
                            </div>
                            <p className="text-amber-500 text-[7px] font-black uppercase tracking-[0.2em] mt-2 text-center opacity-80 leading-normal">Scan for Actions</p>
                        </div>
                    </div>

                    {/* Footer Card Info */}
                    <div className="flex justify-between items-center pt-3 sm:pt-4 mt-2 sm:mt-1">
                        <div className="flex items-center gap-6">
                            <div className="space-y-0.5">
                                <p className="text-amber-500/50 text-[8px] sm:text-[9px] uppercase font-black tracking-widest leading-normal">Owner</p>
                                <p className="text-white text-[11px] sm:text-[12px] font-bold leading-normal pb-0.5">{ownerName}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-amber-500/50 text-[8px] sm:text-[9px] uppercase font-black tracking-widest leading-normal">Passport ID</p>
                                <p className="text-amber-400 font-mono text-[11px] sm:text-[12px] font-black tracking-wider leading-normal pb-0.5">#{pet._id?.slice(-6)?.toUpperCase() || 'PV9999'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-white/10"></div>
                            <div className="w-6 h-1.5 rounded-full bg-amber-500/30"></div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Download Actions */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-6 flex justify-center w-full pointer-events-none"
            >
                <button
                    onClick={async (e) => {
                        e.stopPropagation();
                        const element = document.getElementById('pet-id-card');
                        if (!element) return;
                        try {
                            const html2canvas = (await import('html2canvas')).default;
                            const canvas = await html2canvas(element, {
                                scale: 3,
                                backgroundColor: null,
                                useCORS: true,
                                logging: false
                            });
                            const dataUrl = canvas.toDataURL('image/png');
                            const link = document.createElement('a');
                            link.href = dataUrl;
                            link.download = `PawVaidya_${pet.name}_Passport.png`;
                            link.click();
                        } catch (err) {
                            console.error('Failed to capture passport', err);
                        }
                    }}
                    className="pointer-events-auto flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #e8d5b0, #c8860a)', color: '#3d2b1f' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Passport
                </button>
            </motion.div>
        </motion.div>
    );
};

export default PetIDCard;

