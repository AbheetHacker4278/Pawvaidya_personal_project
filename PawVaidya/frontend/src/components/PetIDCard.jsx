import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { assets } from '../assets/assets_frontend/assets';

const PetIDCard = ({ pet, ownerName, phone, onClose }) => {
    const { t } = useTranslation();
    const [isQRZoomed, setIsQRZoomed] = useState(false);
    
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
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                id="pet-id-card"
                initial={{ scale: 0.8, y: 20, rotateY: 90 }}
                animate={{ scale: 1, y: 0, rotateY: 0 }}
                exit={{ scale: 0.8, y: 20, rotateY: -90 }}
                transition={{ type: "spring", damping: 15, stiffness: 100 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-[500px] aspect-[1.58/1] rounded-[1.2rem] xs:rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(122,90,72,0.15)] border border-amber-500/10"
            >
                {/* Premium Light Champagne Background Layer */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#faf8f4] via-[#f2ece2] to-[#ebdcb9] overflow-hidden">
                    {/* Decorative Patterns */}
                    <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-yellow-600/5 rounded-full blur-3xl -ml-24 -mb-24"></div>

                    {/* Subtle Luxury Pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239a6458' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
                </div>

                {/* Card Content Layout */}
                <div className="relative h-full p-3 xs:p-4 sm:p-7 flex flex-col justify-between">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-0.5 sm:gap-1 items-start">
                            <img src="https://i.ibb.co/R2Y4vBk/Screenshot-2024-11-23-000108-removebg-preview.png" alt="PawVaidya Logo" className="h-4 sm:h-7 w-auto object-contain brightness-0 opacity-85 drop-shadow-sm" />
                            <p className="text-[#9a6458] text-[6px] sm:text-[9px] font-black uppercase tracking-[0.25em] ml-0.5 sm:ml-1 opacity-80">Official Pet Passport</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 mt-0.5">
                            <div className="bg-[#9a6458]/10 backdrop-blur-md px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-[#9a6458]/20 flex items-center gap-1 sm:gap-2">
                                <ShieldCheck className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#9a6458]" />
                                <span className="text-[#9a6458] text-[7px] sm:text-[10px] font-black uppercase tracking-widest">Verified</span>
                            </div>
                            <button onClick={onClose} className="text-[#5a4035]/60 hover:text-[#5a4035] bg-[#5a4035]/5 hover:bg-[#5a4035]/10 border border-[#5a4035]/10 rounded-full p-0.5 sm:p-1 transition-colors flex items-center justify-center">
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Main Content Body */}
                    <div className="flex gap-2 sm:gap-6 items-center flex-1 mt-2 sm:mt-1 overflow-hidden">
                        {/* Pet Image with Premium Frame */}
                        <div className="relative group shrink-0">
                            <div className="absolute -inset-1 bg-gradient-to-br from-amber-400/30 to-orange-600/15 rounded-[0.8rem] sm:rounded-[1.5rem] blur-sm opacity-40 group-hover:opacity-70 transition duration-500"></div>
                            <div className="relative w-16 h-16 xs:w-20 xs:h-20 sm:w-32 sm:h-32 rounded-[0.7rem] sm:rounded-[1.4rem] overflow-hidden border-2 border-white shadow-xl bg-amber-50/45">
                                <img src={pet.image || assets.upload_area} alt="Pet" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            </div>
                        </div>

                        {/* Pet Details */}
                        <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                            <h4 className="text-[#5a4035] text-sm xs:text-base sm:text-3xl font-black mb-0.5 sm:mb-2 tracking-tight drop-shadow-sm leading-tight sm:leading-normal truncate">{pet.name}</h4>
                            <div className="grid grid-cols-2 gap-x-1.5 sm:gap-x-3 gap-y-0.5 sm:gap-y-2.5">
                                <div className="space-y-0">
                                    <p className="text-[#9a6458]/75 text-[6px] sm:text-[9px] uppercase font-black tracking-widest leading-none sm:leading-normal">Species</p>
                                    <p className="text-[#5a4035] text-[9px] sm:text-[13px] font-bold leading-normal pb-0.5 truncate">{pet.type || 'N/A'}</p>
                                </div>
                                <div className="space-y-0">
                                    <p className="text-[#9a6458]/75 text-[6px] sm:text-[9px] uppercase font-black tracking-widest leading-none sm:leading-normal">Breed</p>
                                    <p className="text-[#5a4035] text-[9px] sm:text-[13px] font-bold leading-normal pb-0.5 truncate">{pet.breed || 'N/A'}</p>
                                </div>
                                <div className="space-y-0">
                                    <p className="text-[#9a6458]/75 text-[6px] sm:text-[9px] uppercase font-black tracking-widest leading-none sm:leading-normal">Age</p>
                                    <p className="text-[#5a4035] text-[9px] sm:text-[13px] font-bold leading-normal pb-0.5 truncate">{pet.age} Years</p>
                                </div>
                                <div className="space-y-0">
                                    <p className="text-[#9a6458]/75 text-[6px] sm:text-[9px] uppercase font-black tracking-widest leading-none sm:leading-normal">Gender</p>
                                    <p className="text-[#5a4035] text-[9px] sm:text-[13px] font-bold leading-normal pb-0.5 truncate">{pet.gender}</p>
                                </div>
                            </div>
                        </div>

                        {/* Right: QR Code */}
                        <div 
                            className="shrink-0 flex flex-col items-center cursor-pointer group/qr"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsQRZoomed(true);
                            }}
                        >
                            <div className="bg-white rounded-[0.6rem] sm:rounded-[1rem] p-1 sm:p-1.5 shadow-xl border border-[#9a6458]/10 w-16 h-16 xs:w-20 xs:h-20 sm:w-32 sm:h-32 flex items-center justify-center relative overflow-hidden transition-all duration-300 hover:border-amber-500/30 hover:shadow-2xl">
                                <div className="absolute inset-0 bg-[#5a4035]/5 opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <span className="text-[5px] sm:text-[8px] font-black text-[#5a4035] bg-white/95 px-1.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider">Zoom</span>
                                </div>
                                <QRCodeSVG
                                    value={qrPayload}
                                    size="100%"
                                    level="L"
                                    bgColor="#ffffff"
                                    fgColor="#3d2b24"
                                    includeMargin={true}
                                />
                            </div>
                            <p className="text-[#9a6458] text-[5px] sm:text-[7px] font-black uppercase tracking-[0.2em] mt-1 sm:mt-2 text-center opacity-80 leading-none sm:leading-normal">Scan for Actions</p>
                        </div>
                    </div>

                    {/* Footer Card Info */}
                    <div className="flex justify-between items-center pt-1.5 sm:pt-4 mt-1 sm:mt-1 border-t border-[#9a6458]/10">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="space-y-0">
                                <p className="text-[#9a6458]/60 text-[6px] sm:text-[9px] uppercase font-black tracking-widest leading-none sm:leading-normal">Owner</p>
                                <p className="text-[#5a4035] text-[9px] sm:text-[12px] font-bold leading-normal pb-0.5 truncate max-w-[80px] xs:max-w-none">{ownerName}</p>
                            </div>
                            <div className="space-y-0">
                                <p className="text-[#9a6458]/60 text-[6px] sm:text-[9px] uppercase font-black tracking-widest leading-none sm:leading-normal">Passport ID</p>
                                <p className="text-amber-700 font-mono text-[9px] sm:text-[12px] font-black tracking-wider leading-normal pb-0.5">#{pet._id?.slice(-6)?.toUpperCase() || 'PV9999'}</p>
                            </div>
                        </div>
                        <div className="flex gap-1.5 sm:gap-2">
                            <div className="w-10 sm:w-16 h-1 sm:h-1.5 rounded-full bg-[#5a4035]/10"></div>
                            <div className="w-4 sm:w-6 h-1 sm:h-1.5 rounded-full bg-[#9a6458]/35"></div>
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
                    className="pointer-events-auto flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm shadow-[0_10px_25px_rgba(122,90,72,0.15)] transition-all duration-300 hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #e8d5b0, #c8860a)', color: '#3d2b1f' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Passport
                </button>
            </motion.div>

            {/* Zoomed QR Modal Overlay */}
            <AnimatePresence>
                {isQRZoomed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsQRZoomed(false);
                        }}
                        className="fixed inset-0 z-[1010] flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 15 }}
                            transition={{ type: "spring", damping: 20, stiffness: 150 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2rem] p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-amber-500/20 max-w-sm w-full flex flex-col items-center text-center cursor-default"
                        >
                            <div className="flex justify-between items-center w-full mb-6">
                                <h5 className="text-[#5a4035] text-lg font-black tracking-tight flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-[#9a6458]" />
                                    {pet.name}'s QR Code
                                </h5>
                                <button 
                                    onClick={() => setIsQRZoomed(false)} 
                                    className="text-[#5a4035]/60 hover:text-[#5a4035] bg-[#5a4035]/5 hover:bg-[#5a4035]/10 border border-[#5a4035]/10 rounded-full p-1.5 transition-colors flex items-center justify-center"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            
                            <div className="bg-white rounded-2xl p-4 shadow-inner border border-[#9a6458]/10 w-64 h-64 flex items-center justify-center">
                                <QRCodeSVG
                                    value={qrPayload}
                                    size={220}
                                    level="H"
                                    bgColor="#ffffff"
                                    fgColor="#3d2b24"
                                    includeMargin={true}
                                />
                            </div>
                            
                            <p className="text-xs text-[#5a4035]/70 mt-5 leading-relaxed font-semibold">
                                Scan this QR using the CS-Portal or PawVaidya Scanner to load {pet.name}'s medical files, emergency state, and verification history instantly.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default PetIDCard;
