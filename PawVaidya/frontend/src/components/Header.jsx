import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import assets from '../assets/assets_frontend/assets';
import { AppContext } from '../context/AppContext';
import docimage1 from '../assets/New/Doctorfront1.png';
import { ArrowRight, Star, Shield, Clock, Crown } from 'lucide-react';

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

    const badges = [
        { icon: <Star className="w-3.5 h-3.5" />, label: t('home.ratingBadge') },
        { icon: <Shield className="w-3.5 h-3.5" />, label: t('home.trustedBadge') },
        { icon: <Clock className="w-3.5 h-3.5" />, label: t('home.availableBadge') },
    ];

    return (
        <div className="relative overflow-visible mx-0 w-full bg-transparent">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 px-6 md:px-10 lg:px-14 py-5 md:py-7">

                {/* ── Left ─────────────────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col gap-4 items-start relative z-10">
                    {/* Premium Ambient Background Glow for Subscribers */}
                    {token && userdata && userdata?.subscription?.status === 'Active' && userdata.subscription.plan !== 'None' && (
                        <div className="absolute -inset-10 -z-10 blur-3xl opacity-30 pointer-events-none"
                            style={{
                                background: userdata.subscription.plan === 'Platinum' ? 'radial-gradient(circle, #a855f7 0%, transparent 70%)' :
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
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-xs font-semibold text-[#fdf8f0] shadow-sm tracking-wide"
                        style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}
                    >
                        {token && userdata && userdata?.subscription?.status === 'Active' && userdata.subscription.plan !== 'None' ? (
                            <span className="flex items-center gap-1.5" style={{ color: userdata.subscription.plan === 'Platinum' ? '#d8b4fe' : userdata.subscription.plan === 'Gold' ? '#fde68a' : '#cbd5e1' }}>
                                <Crown size={12} className="fill-current" />
                                Premium {userdata.subscription.plan} Member
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
                                className="text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.2] tracking-tight"
                                style={{
                                    background: userdata.subscription.plan === 'Platinum' ? 'linear-gradient(to right, #d8b4fe, #ffffff)' :
                                        userdata.subscription.plan === 'Gold' ? 'linear-gradient(to right, #fde68a, #ffffff)' :
                                            'linear-gradient(to right, #f8fafc, #cbd5e1)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    dropShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                            >
                                <div className="flex flex-col gap-1">
                                    <span className="text-xl md:text-2xl font-medium opacity-90 flex items-center gap-2" style={{ WebkitTextFillColor: 'initial', color: '#fff' }}>
                                        VIP Access, {userdata.name}
                                        <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>✨</motion.span>
                                    </span>
                                    {userdata.subscription.plan === 'Platinum' ? "Your Personal Pet Caregiver Is Ready" :
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
                        className="flex items-center gap-3"
                    >
                        <img className="w-16 h-auto object-contain drop-shadow-md flex-shrink-0" src={assets.group_profiles} alt="Trusted doctors" />
                        <p className="text-[#fdf8f0]/80 text-sm leading-relaxed max-w-xs font-medium">
                            {token && userdata && userdata?.subscription?.status === 'Active' && userdata.subscription.plan !== 'None'
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
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium text-white/90 border border-white/20 shadow-sm"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                {b.icon} {b.label}
                            </span>
                        ))}
                    </motion.div>

                    {/* CTA Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/doctors')}
                        className="mt-1 flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm shadow-lg transition-all"
                        style={{
                            background: (token && userdata && userdata?.subscription?.status === 'Active' && userdata.subscription.plan === 'Platinum')
                                ? `linear-gradient(135deg, #a855f7, #6b21a8)`
                                : `linear-gradient(135deg, ${B.amber}, #e8a020)`,
                            color: '#fff',
                            boxShadow: (token && userdata && userdata?.subscription?.status === 'Active') ? '0 8px 20px rgba(0,0,0,0.2)' : '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                    >
                        {(token && userdata && userdata?.subscription?.status === 'Active' && userdata.subscription.plan !== 'None')
                            ? "Book Priority Appointment"
                            : t('home.bookAppointmentBtn', 'Book Appointment')}
                        <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </div>

                {/* ── Center/Bottom Stats (Integrated seamlessly) ────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="hidden lg:flex md:absolute bottom-6 left-[45%] -translate-x-1/2 flex-col items-center justify-center px-6 py-4 rounded-2xl border border-white/10 shadow-2xl z-20"
                    style={{ background: 'rgba(58,35,22,0.6)', backdropFilter: 'blur(16px)' }}
                >
                    <p className="text-white font-bold text-xl">{t('home.totalVets', '500+ Vets')}</p>
                    <p className="text-[#fdf8f0]/80 text-xs tracking-wide uppercase mt-1">{t('home.cityCoverage', 'Across 100+ cities')}</p>
                </motion.div>

                {/* ── Right: Doctor Image ───────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
                    className="relative flex-shrink-0 w-full md:w-[40%] flex justify-end items-end"
                >
                    <motion.img
                        initial={{ y: 0 }}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                        className="relative w-full h-auto drop-shadow-2xl z-10 max-h-[320px] object-contain object-bottom"
                        src={docimage1}
                        alt="Doctor"
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default Header;
