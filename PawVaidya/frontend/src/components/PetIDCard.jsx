import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Sparkles, PawPrint, User, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { assets } from '../assets/assets_frontend/assets';
import { AppContext } from '../context/AppContext';

const PetIDCard = ({ pet, ownerName, phone, onClose }) => {
    const { t } = useTranslation();
    const { userdata } = useContext(AppContext);
    const [isQRZoomed, setIsQRZoomed] = useState(false);
    
    if (!pet) return null;

    const isObsidian = userdata?.subscription?.status === 'Active' && userdata?.subscription?.plan === 'Obsidian';

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
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                id="pet-id-card"
                initial={{ scale: 0.8, y: 20, rotateY: 90 }}
                animate={{ scale: 1, y: 0, rotateY: 0 }}
                exit={{ scale: 0.8, y: 20, rotateY: -90 }}
                transition={{ type: "spring", damping: 15, stiffness: 100 }}
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full max-w-[500px] aspect-[1.58/1] rounded-[1.5rem] xs:rounded-[1.8rem] sm:rounded-[2.2rem] overflow-hidden border transition-all duration-500 ${
                    isObsidian 
                        ? 'bg-[#0E0E0E] border-[#E6C97A]/25 shadow-[0_25px_60px_rgba(0,0,0,0.95)]' 
                        : 'border-amber-500/10 shadow-[0_20px_50px_rgba(122,90,72,0.15)]'
                }`}
            >
                {isObsidian ? (
                    /* Premium Obsidian Background Layer */
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#0E0E0E] to-[#050505] overflow-hidden">
                        {/* Top-right subtle gold glow */}
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#E6C97A]/10 rounded-full blur-2xl pointer-events-none" />
                        
                        {/* Gold dots grid in the bottom right corner */}
                        <div 
                            className="absolute right-0 bottom-0 w-36 h-36 opacity-15 pointer-events-none"
                            style={{ 
                                backgroundImage: 'radial-gradient(#E6C97A 1px, transparent 1px)', 
                                backgroundSize: '6px 6px' 
                            }} 
                        />
                        
                        {/* Sweeping golden corner glow */}
                        <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-tr from-[#E6C97A]/20 to-transparent blur-md rounded-full pointer-events-none" />
                    </div>
                ) : (
                    /* Premium Light Champagne Background Layer */
                    <div className="absolute inset-0 bg-gradient-to-br from-[#faf8f4] via-[#f2ece2] to-[#ebdcb9] overflow-hidden">
                        {/* Decorative Patterns */}
                        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-56 h-56 bg-yellow-600/5 rounded-full blur-3xl -ml-24 -mb-24"></div>

                        {/* Subtle Luxury Pattern overlay */}
                        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239a6458' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
                    </div>
                )}

                {/* Card Content Layout */}
                <div className="relative h-full p-4 sm:p-6 flex flex-col justify-between z-10">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-0.5 items-start">
                            {isObsidian ? (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded bg-[#E6C97A]/10 border border-[#E6C97A]/20 flex items-center justify-center text-[#E6C97A]">
                                        <PawPrint size={12} className="fill-current" />
                                    </div>
                                    <span className="text-white text-base sm:text-lg font-black tracking-tight">PawVaidya</span>
                                </div>
                            ) : (
                                <img src="https://i.ibb.co/R2Y4vBk/Screenshot-2024-11-23-000108-removebg-preview.png" alt="PawVaidya Logo" className="h-4 sm:h-7 w-auto object-contain brightness-0 opacity-85 drop-shadow-sm" />
                            )}
                            <p className={`${isObsidian ? 'text-[#E6C97A] opacity-90' : 'text-[#9a6458] opacity-80'} text-[6px] sm:text-[9px] font-black uppercase tracking-[0.25em] mt-0.5 ml-0.5 sm:ml-1`}>
                                Official Pet Passport
                            </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`backdrop-blur-md px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border flex items-center gap-1 sm:gap-1.5 ${
                                isObsidian 
                                    ? 'bg-[#E6C97A]/10 border-[#E6C97A]/30 text-[#E6C97A]' 
                                    : 'bg-[#9a6458]/10 border-[#9a6458]/20 text-[#9a6458]'
                            }`}>
                                <ShieldCheck className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-current" />
                                <span className="text-current text-[7px] sm:text-[9px] font-black uppercase tracking-widest">Verified</span>
                            </div>
                            <button 
                                onClick={onClose} 
                                className={`rounded-full p-1 transition-colors flex items-center justify-center border ${
                                    isObsidian 
                                        ? 'text-[#E6C97A] bg-black/40 border-[#E6C97A]/25 hover:bg-[#E6C97A]/10' 
                                        : 'text-[#5a4035]/60 hover:text-[#5a4035] bg-[#5a4035]/5 hover:bg-[#5a4035]/10 border-[#5a4035]/10'
                                }`}
                            >
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Main Content Body */}
                    <div className="flex gap-3 sm:gap-5 items-center flex-1 mt-3 sm:mt-2 overflow-hidden">
                        {/* Pet Image with Premium Frame */}
                        <div className="relative group shrink-0">
                            <div className={`absolute -inset-1 rounded-[1rem] sm:rounded-[1.6rem] blur-sm opacity-40 group-hover:opacity-75 transition duration-500 ${
                                isObsidian 
                                    ? 'bg-gradient-to-br from-[#E6C97A]/60 to-transparent' 
                                    : 'bg-gradient-to-br from-amber-400/30 to-orange-600/15'
                            }`} />
                            <div className={`relative w-18 h-18 xs:w-22 xs:h-22 sm:w-32 sm:h-32 rounded-[0.9rem] sm:rounded-[1.4rem] overflow-hidden border-2 shadow-xl ${
                                isObsidian 
                                    ? 'border-[#E6C97A] bg-[#0E0E0E]' 
                                    : 'border-white bg-amber-50/45'
                            }`}>
                                <img src={pet.image || assets.upload_area} alt="Pet" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                
                                {isObsidian && (
                                    /* Gold shield overlay icon on photo */
                                    <div className="absolute bottom-1 right-1 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-[#0E0E0E] border border-[#E6C97A] flex items-center justify-center text-[#E6C97A] shadow-md z-20">
                                        <Shield className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-[#E6C97A]" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pet Details */}
                        <div className="flex-1 min-w-0 pr-1 relative">
                            {isObsidian ? (
                                <div className="flex items-center gap-1.5 mb-1 sm:mb-2 relative">
                                    <h4 className="text-white text-base xs:text-lg sm:text-3xl font-black tracking-tight drop-shadow-sm leading-tight truncate">
                                        {pet.name}
                                    </h4>
                                    <Sparkles size={14} className="text-[#E6C97A] fill-[#E6C97A]" />
                                    {/* Paw watermark behind name */}
                                    <div className="absolute -right-4 -top-3 opacity-[0.04] text-[#E6C97A] pointer-events-none">
                                        <PawPrint size={40} className="fill-current" />
                                    </div>
                                </div>
                            ) : (
                                <h4 className="text-[#5a4035] text-sm xs:text-base sm:text-3xl font-black mb-0.5 sm:mb-2 tracking-tight drop-shadow-sm leading-tight sm:leading-normal truncate">
                                    {pet.name}
                                </h4>
                            )}

                            <div className="grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1 sm:gap-y-2 border-t border-b py-1.5 sm:py-2 border-zinc-800/10 border-solid"
                                 style={isObsidian ? { borderColor: 'rgba(230,201,122,0.15)' } : { borderColor: 'rgba(154,100,88,0.15)' }}>
                                <div className="space-y-0.5">
                                    <p className={`${isObsidian ? 'text-[#E6C97A]' : 'text-[#9a6458]/75'} text-[6px] sm:text-[8px] uppercase font-black tracking-widest leading-none`}>
                                        Species
                                    </p>
                                    <p className={`${isObsidian ? 'text-white' : 'text-[#5a4035]'} text-[9px] sm:text-[12px] font-bold leading-normal truncate`}>
                                        {pet.type || 'N/A'}
                                    </p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className={`${isObsidian ? 'text-[#E6C97A]' : 'text-[#9a6458]/75'} text-[6px] sm:text-[8px] uppercase font-black tracking-widest leading-none`}>
                                        Breed
                                    </p>
                                    <p className={`${isObsidian ? 'text-white' : 'text-[#5a4035]'} text-[9px] sm:text-[12px] font-bold leading-normal truncate`}>
                                        {pet.breed || 'N/A'}
                                    </p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className={`${isObsidian ? 'text-[#E6C97A]' : 'text-[#9a6458]/75'} text-[6px] sm:text-[8px] uppercase font-black tracking-widest leading-none`}>
                                        Age
                                    </p>
                                    <p className={`${isObsidian ? 'text-white' : 'text-[#5a4035]'} text-[9px] sm:text-[12px] font-bold leading-normal truncate`}>
                                        {pet.age} Years
                                    </p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className={`${isObsidian ? 'text-[#E6C97A]' : 'text-[#9a6458]/75'} text-[6px] sm:text-[8px] uppercase font-black tracking-widest leading-none`}>
                                        Gender
                                    </p>
                                    <p className={`${isObsidian ? 'text-white' : 'text-[#5a4035]'} text-[9px] sm:text-[12px] font-bold leading-normal truncate`}>
                                        {pet.gender}
                                    </p>
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
                            <div className={`rounded-[0.8rem] sm:rounded-[1.2rem] p-1.5 shadow-xl border flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                                isObsidian 
                                    ? 'bg-[#E6C97A]/5 border-[#E6C97A]/35 hover:border-[#E6C97A] hover:shadow-[0_0_15px_rgba(230,201,122,0.25)] w-18 h-18 xs:w-22 xs:h-22 sm:w-32 sm:h-32' 
                                    : 'bg-white border-[#9a6458]/10 hover:border-amber-500/30 hover:shadow-2xl w-16 h-16 xs:w-20 xs:h-20 sm:w-32 sm:h-32'
                            }`}>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                                    <span className="text-[5px] sm:text-[8px] font-black text-[#5a4035] bg-white/95 px-1.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider">Zoom</span>
                                </div>
                                <QRCodeSVG
                                    value={qrPayload}
                                    size="100%"
                                    level="H"
                                    bgColor={isObsidian ? "#FFFBF0" : "#ffffff"}
                                    fgColor={isObsidian ? "#120D08" : "#3d2b24"}
                                    includeMargin={true}
                                />
                            </div>
                            <p className={`${isObsidian ? 'text-[#E6C97A]' : 'text-[#9a6458]'} text-[5px] sm:text-[7px] font-black uppercase tracking-[0.2em] mt-1 sm:mt-2 text-center opacity-85 leading-none`}>
                                Scan for Actions
                            </p>
                        </div>
                    </div>

                    {/* Footer Card Info */}
                    <div className="flex justify-between items-center pt-2.5 sm:pt-4 border-t"
                         style={isObsidian ? { borderColor: 'rgba(230,201,122,0.15)' } : { borderColor: 'rgba(154,100,88,0.15)' }}>
                        <div className="flex items-center gap-3 sm:gap-6">
                            <div className="flex items-center gap-2">
                                {isObsidian ? (
                                    <div className="w-6 h-6 rounded bg-[#E6C97A]/10 border border-[#E6C97A]/25 flex items-center justify-center text-[#E6C97A]">
                                        <User size={12} />
                                    </div>
                                ) : null}
                                <div className="space-y-0">
                                    <p className={`${isObsidian ? 'text-[#E6C97A]/60' : 'text-[#9a6458]/60'} text-[5px] sm:text-[8px] uppercase font-black tracking-widest leading-none`}>
                                        Owner
                                    </p>
                                    <p className={`${isObsidian ? 'text-white' : 'text-[#5a4035]'} text-[9px] sm:text-[11px] font-bold truncate max-w-[80px] xs:max-w-none`}>
                                        {ownerName}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {isObsidian ? (
                                    <div className="w-6 h-6 rounded bg-[#E6C97A]/10 border border-[#E6C97A]/25 flex items-center justify-center text-[#E6C97A]">
                                        <Shield size={12} />
                                    </div>
                                ) : null}
                                <div className="space-y-0">
                                    <p className={`${isObsidian ? 'text-[#E6C97A]/60' : 'text-[#9a6458]/60'} text-[5px] sm:text-[8px] uppercase font-black tracking-widest leading-none`}>
                                        Passport ID
                                    </p>
                                    <p className={`${isObsidian ? 'text-[#E6C97A]' : 'text-amber-700'} font-mono text-[9px] sm:text-[11px] font-black tracking-wider`}>
                                        #{pet._id?.slice(-6)?.toUpperCase() || 'PV9999'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {isObsidian ? (
                            /* Premium stamp badge */
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full border border-dashed border-[#E6C97A] bg-[#E6C97A]/10 flex items-center justify-center text-[#E6C97A] relative">
                                    <div className="absolute inset-0.5 rounded-full border border-solid border-[#E6C97A]/30" />
                                    <PawPrint size={10} className="fill-current" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[#E6C97A] text-[8px] sm:text-[10px] font-black uppercase tracking-wider leading-none">Premium Pass</p>
                                    <p className="text-neutral-500 text-[6px] sm:text-[7px] font-medium uppercase tracking-wide mt-0.5">Lifetime Validity</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-1.5 sm:gap-2">
                                <div className="w-10 sm:w-16 h-1 sm:h-1.5 rounded-full bg-[#5a4035]/10"></div>
                                <div className="w-4 sm:w-6 h-1 sm:h-1.5 rounded-full bg-[#9a6458]/35"></div>
                            </div>
                        )}
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
                    style={{ 
                        background: isObsidian 
                            ? 'linear-gradient(135deg, #1C150E, #3D2C1A)' 
                            : 'linear-gradient(135deg, #e8d5b0, #c8860a)', 
                        color: isObsidian ? '#E6C97A' : '#3d2b1f',
                        border: isObsidian ? '1px solid rgba(230,201,122,0.35)' : 'none'
                    }}
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
                            className={`rounded-[2rem] p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border max-w-sm w-full flex flex-col items-center text-center cursor-default ${
                                isObsidian ? 'bg-[#0E0E0E] border-[#E6C97A]/25' : 'bg-white border-amber-500/20'
                            }`}
                        >
                            <div className="flex justify-between items-center w-full mb-6">
                                <h5 className={`${isObsidian ? 'text-white' : 'text-[#5a4035]'} text-lg font-black tracking-tight flex items-center gap-2`}>
                                    <ShieldCheck size={18} className={isObsidian ? 'text-[#E6C97A]' : 'text-[#9a6458]'} />
                                    {pet.name}'s QR Code
                                </h5>
                                <button 
                                    onClick={() => setIsQRZoomed(false)} 
                                    className={`rounded-full p-1.5 transition-colors flex items-center justify-center border ${
                                        isObsidian 
                                            ? 'text-[#E6C97A] bg-black/40 border-[#E6C97A]/25 hover:bg-[#E6C97A]/10' 
                                            : 'text-[#5a4035]/60 hover:text-[#5a4035] bg-[#5a4035]/5 hover:bg-[#5a4035]/10 border border-[#5a4035]/10'
                                    }`}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            
                            <div className={`rounded-2xl p-4 shadow-inner border w-64 h-64 flex items-center justify-center ${
                                isObsidian ? 'bg-[#FFFBF0] border-[#E6C97A]/35' : 'bg-white border-[#9a6458]/10'
                            }`}>
                                <QRCodeSVG
                                    value={qrPayload}
                                    size={220}
                                    level="H"
                                    bgColor={isObsidian ? "#FFFBF0" : "#ffffff"}
                                    fgColor={isObsidian ? "#120D08" : "#3d2b24"}
                                    includeMargin={true}
                                />
                            </div>
                            
                            <p className={`text-xs mt-5 leading-relaxed font-semibold ${isObsidian ? 'text-neutral-400' : 'text-[#5a4035]/70'}`}>
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
