import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import assets from '../assets/assets_frontend/assets';
import { AppContext } from '../context/AppContext';
import docimage1 from '../assets/New/Doctorfront1.png';
import docimageObsidian from '../assets/New/Doctorfront.png';
import { ArrowRight, Star, Shield, Clock, Crown, ShieldAlert, Users, Lock, MapPin } from 'lucide-react';

// ─── Brand palette ────────────────────────────────────────────────────────────
const B = {
    dark: '#3d2b1f',
    mid: '#5A4035',
    light: '#7a5a48',
    cream: '#f2e4c7',
    sand: '#e8d5b0',
    amber: '#c8860a',
    pale: '#fdf8f0',
};

const Header = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { userdata, token } = useContext(AppContext);

    const isObsidian = userdata?.subscription?.plan === 'Obsidian' && userdata?.subscription?.status === 'Active';

    const badges = [
        { icon: <Star className={`w-3.5 h-3.5 ${isObsidian ? 'text-[#E6C97A] fill-current' : ''}`} />, label: t('home.ratingBadge') },
        { icon: <Shield className="w-3.5 h-3.5" />, label: t('home.trustedBadge') },
        { icon: <Clock className="w-3.5 h-3.5" />, label: t('home.availableBadge') },
    ];

    return (
        <div className="relative overflow-visible mx-0 w-full bg-transparent">
            {/* Main Split Row */}
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 px-6 md:px-10 lg:px-14 pt-5 md:pt-7 pb-2">

                {/* ── Left ─────────────────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col gap-4 items-start relative z-10">
                    {/* Premium Ambient Background Glow for Subscribers */}
                    {token && userdata && userdata?.subscription?.status === 'Active' && userdata.subscription.plan !== 'None' && (
                        <div className="absolute -inset-10 -z-10 blur-3xl opacity-35 pointer-events-none"
                            style={{
                                background: isObsidian ? 'radial-gradient(circle, rgba(230,201,122,0.45) 0%, transparent 70%)' :
                                    userdata.subscription.plan === 'Platinum' ? 'radial-gradient(circle, #a855f7 0%, transparent 70%)' :
                                    userdata.subscription.plan === 'Gold' ? 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' :
                                        'radial-gradient(circle, #94a3b8 0%, transparent 70%)'
                            }}
                        />
                    )}

                    {/* Pill badge */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold text-[#fdf8f0] shadow-sm tracking-wide ${
                            isObsidian 
                                ? 'border-[#E6C97A]/25 shadow-[0_0_15px_rgba(230,201,122,0.15)] bg-black/40 text-[#E6C97A]' 
                                : 'border-white/10 bg-white/5'
                        }`}
                        style={{ backdropFilter: 'blur(8px)' }}
                    >
                        {token && userdata && userdata?.subscription?.status === 'Active' && userdata.subscription.plan !== 'None' ? (
                            <span className="flex items-center gap-1.5 uppercase font-black tracking-widest text-[10px]" style={{ color: isObsidian ? '#E6C97A' : userdata.subscription.plan === 'Platinum' ? '#d8b4fe' : userdata.subscription.plan === 'Gold' ? '#fde68a' : '#cbd5e1' }}>
                                <Crown size={12} className="fill-current" />
                                {isObsidian ? 'Obsidian Signature Pass' : `Premium ${userdata.subscription.plan} Member`}
                            </span>
                        ) : (
                            <>
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                                {t('home.platformLabel', "India's #1 Veterinary Platform")}
                            </>
                        )}
                    </motion.div>

                    {/* Headline Wrapper */}
                    <div className="flex flex-col gap-2">
                        {token && userdata && userdata?.subscription?.status === 'Active' && userdata.subscription.plan !== 'None' ? (
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15, duration: 0.6 }}
                                className="text-2xl md:text-3xl lg:text-4xl font-serif font-black leading-[1.2] tracking-tight text-white"
                            >
                                <div className="flex flex-col gap-1">
                                    <span className="text-xl md:text-2xl font-medium opacity-90 flex items-center gap-2 font-sans" style={{ color: isObsidian ? '#F5F2EA' : '#fff' }}>
                                        {isObsidian ? 'Welcome back, Executive Member' : `VIP Access, ${userdata.name}`}
                                        <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>✨</motion.span>
                                    </span>
                                    {isObsidian ? "24/7 Dedicated Concierge Desk Active" :
                                        userdata.subscription.plan === 'Platinum' ? "Your Personal Pet Caregiver Is Ready" :
                                        userdata.subscription.plan === 'Gold' ? "Unlimited Priority Appointments" :
                                            "Book Your Priority Appointment"}
                                </div>
                            </motion.h1>
                        ) : (
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15, duration: 0.6 }}
                                className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-[1.2] tracking-tight"
                            >
                                {token && userdata ? (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-lg md:text-xl font-medium opacity-80">
                                            Welcome back, {userdata.name}
                                        </span>
                                        {t('home.bookAppointment', 'Book Appointment With Trusted Doctors')}
                                    </div>
                                ) : (
                                    t('home.bookAppointment', 'Book Appointment With Trusted Doctors')
                                )}
                            </motion.h1>
                        )}
                    </div>

                    {/* Sub-text */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex items-center gap-4 mt-1"
                    >
                        <img className="w-16 h-auto object-contain drop-shadow-md flex-shrink-0" src={assets.group_profiles} alt="Trusted doctors" />
                        <p className={`text-sm leading-relaxed max-w-md font-medium ${isObsidian ? 'text-neutral-400' : 'text-[#fdf8f0]/80'}`}>
                          {isObsidian 
                              ? "Unlock state-of-the-art vision diagnostics, priority local dispatching, and direct private contact with your assigned Care Officer."
                              : token && userdata && userdata?.subscription?.status === 'Active' && userdata.subscription.plan !== 'None'
                              ? "As a Premium member, enjoy hassle-free booking, priority doctor access, and exclusive discounts."
                              : t('home.trustedDoctorsDesc', 'Simply browse our trusted doctors from Gujarat, New Delhi, Haryana, Mumbai — schedule hassle-free.')}
                        </p>
                    </motion.div>

                    {/* Trust badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="flex flex-wrap gap-3 mt-1"
                    >
                        {badges.map((b, i) => (
                            <span key={i}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold border shadow-sm ${
                                    isObsidian 
                                        ? 'border-[#E6C97A]/25 text-[#E6C97A] bg-black/60 shadow-[0_0_8px_rgba(230,201,122,0.05)]' 
                                        : 'border-white/20 text-white/90 bg-white/5'
                                }`}
                            >
                                {b.icon} {b.label}
                            </span>
                        ))}
                    </motion.div>

                    {/* CTA Buttons & Stats Badge */}
                    <div className="flex items-center gap-6 mt-3 flex-wrap w-full">
                        {/* Button columns */}
                        <div className="flex flex-col items-start gap-4 z-30">
                            <div className="flex flex-wrap items-center gap-3">
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, duration: 0.5 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => navigate('/doctors')}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm shadow-lg transition-all ${isObsidian ? 'hover:opacity-95' : ''}`}
                                    style={{
                                        background: isObsidian
                                            ? 'linear-gradient(to right, #E6C97A, #8C6D23)'
                                            : (token && userdata && userdata?.subscription?.status === 'Active' && userdata.subscription.plan === 'Platinum')
                                            ? `linear-gradient(135deg, #a855f7, #6b21a8)`
                                            : `linear-gradient(135deg, ${B.amber}, #e8a020)`,
                                        color: isObsidian ? '#050505' : '#html',
                                        boxShadow: isObsidian
                                            ? '0 8px 25px rgba(230,201,122,0.25)'
                                            : (token && userdata && userdata?.subscription?.status === 'Active')
                                            ? '0 8px 20px rgba(0,0,0,0.2)'
                                            : '0 4px 6px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {(token && userdata && userdata?.subscription?.status === 'Active' && userdata.subscription.plan !== 'None')
                                        ? isObsidian ? "Executive Scheduling" : "Book Priority Appointment"
                                        : t('home.bookAppointmentBtn', 'Book Appointment')}
                                    <ArrowRight className="w-4 h-4" />
                                </motion.button>

                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6, duration: 0.5 }}
                                    whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(220, 38, 38, 0.4)' }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => navigate('/my-appointments', { state: { tab: 'emergency' } })}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm shadow-lg transition-all bg-red-600 text-white relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]"
                                    />
                                    Emergency Booking
                                </motion.button>
                            </div>

                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7, duration: 0.5 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/report-cruelty')}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm shadow-lg transition-all bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                                <ShieldAlert className="w-4 h-4" />
                                Report Cruelty
                            </motion.button>
                        </div>

                        {/* Obsidian Vets Badge */}
                        {isObsidian && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.7, duration: 0.5 }}
                                className="border border-[#E6C97A]/20 bg-[#0E0E0E]/80 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center min-w-[150px] text-center shadow-2xl z-30"
                            >
                                <div className="w-9 h-9 rounded-full bg-[#E6C97A]/10 border border-[#E6C97A]/30 flex items-center justify-center text-[#E6C97A] mb-1.5 shadow-[0_0_10px_rgba(230,201,122,0.1)]">
                                    <Users size={16} />
                                </div>
                                <span className="text-white font-black text-base">500+ Vets</span>
                                <span className="text-[#E6C97A]/60 font-bold text-[8px] uppercase tracking-widest mt-0.5">Across 100+ Cities</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* ── Right: Doctor Image ───────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
                    className="relative flex-shrink-0 w-full md:w-[40%] flex justify-end items-end"
                >
                    {/* Standard Legacy Stats Badge */}
                    {!isObsidian && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                            className="hidden lg:flex absolute bottom-8 -left-12 flex-col items-center justify-center px-6 py-4 rounded-2xl border border-white/10 shadow-2xl z-30"
                            style={{ background: 'rgba(58,35,22,0.8)', backdropFilter: 'blur(16px)' }}
                        >
                            <p className="text-white font-bold text-xl">{t('home.totalVets', '500+ Vets')}</p>
                            <p className="text-[#fdf8f0]/80 text-xs tracking-wide uppercase mt-1">{t('home.cityCoverage', 'Across 100+ cities')}</p>
                        </motion.div>
                    )}

                    <motion.img
                        initial={{ y: 0 }}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                        className={`relative w-full h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] z-10 object-contain object-bottom transition-all ${
                            isObsidian 
                                ? 'max-h-[380px] scale-105 origin-bottom' 
                                : 'max-h-[320px]'
                        }`}
                        src={isObsidian ? docimageObsidian : docimage1}
                        alt="Doctor"
                    />
                </motion.div>
            </div>

            {/* Bottom Row Trust Metrics (Obsidian Only) */}
            {isObsidian && (
                <div className="px-6 md:px-10 lg:px-14 pb-6 mt-4 z-25 relative">
                    <div className="w-full pt-6 border-t border-[#E6C97A]/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#E6C97A]/10 border border-[#E6C97A]/25 flex items-center justify-center text-[#E6C97A] shrink-0 shadow-[0_0_10px_rgba(230,201,122,0.1)]">
                                <Shield size={16} />
                            </div>
                            <div>
                                <p className="text-white font-bold text-xs">Priority Care</p>
                                <p className="text-neutral-500 text-[10px] font-medium leading-tight mt-0.5">Top priority in all bookings</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#E6C97A]/10 border border-[#E6C97A]/25 flex items-center justify-center text-[#E6C97A] shrink-0 shadow-[0_0_10px_rgba(230,201,122,0.1)]">
                                <MapPin size={16} />
                            </div>
                            <div>
                                <p className="text-white font-bold text-xs">Local Experts</p>
                                <p className="text-neutral-500 text-[10px] font-medium leading-tight mt-0.5">Verified vets in your area</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#E6C97A]/10 border border-[#E6C97A]/25 flex items-center justify-center text-[#E6C97A] shrink-0 shadow-[0_0_10px_rgba(230,201,122,0.1)]">
                                <Clock size={16} />
                            </div>
                            <div>
                                <p className="text-white font-bold text-xs">Fast Response</p>
                                <p className="text-neutral-500 text-[10px] font-medium leading-tight mt-0.5">Average response in 3 mins</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#E6C97A]/10 border border-[#E6C97A]/25 flex items-center justify-center text-[#E6C97A] shrink-0 shadow-[0_0_10px_rgba(230,201,122,0.1)]">
                                <Lock size={16} />
                            </div>
                            <div>
                                <p className="text-white font-bold text-xs">Private & Secure</p>
                                <p className="text-neutral-500 text-[10px] font-medium leading-tight mt-0.5">Your data is always protected</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Header;
