import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import assets from '../assets/assets_frontend/assets';
import docimage1 from '../assets/New/Doctorfront1.png';
import { ArrowRight, Star, Shield, Clock } from 'lucide-react';

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

    const badges = [
        { icon: <Star className="w-3.5 h-3.5" />, label: t('home.ratingBadge') },
        { icon: <Shield className="w-3.5 h-3.5" />, label: t('home.trustedBadge') },
        { icon: <Clock className="w-3.5 h-3.5" />, label: t('home.availableBadge') },
    ];

    return (
        <div
            className="relative overflow-hidden rounded-2xl mx-0 mb-0"
            style={{ background: `linear-gradient(135deg, ${B.dark} 0%, ${B.mid} 55%, ${B.light} 100%)` }}
        >
            {/* Decorative blobs */}
            <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-20"
                style={{ background: B.cream }} />
            <div className="absolute -bottom-12 -right-12 w-80 h-80 rounded-full blur-3xl opacity-10"
                style={{ background: B.amber }} />
            {/* Dot grid */}
            <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 px-8 md:px-14 lg:px-20 py-12 md:py-16">

                {/* ── Left ─────────────────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col gap-6 items-start">
                    {/* Pill badge */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 text-xs font-semibold text-amber-200"
                        style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)' }}
                    >
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        {t('home.platformLabel')}
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.6 }}
                        className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
                    >
                        {t('home.bookAppointment')}
                    </motion.h1>

                    {/* Sub-text */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex items-center gap-3"
                    >
                        <img className="w-24" src={assets.group_profiles} alt="Trusted doctors" />
                        <p className="text-amber-100 text-sm leading-relaxed">
                            {t('home.trustedDoctors')}<br />
                            {t('home.locations')} · {t('home.scheduleAppointment')}
                        </p>
                    </motion.div>

                    {/* Trust badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="flex flex-wrap gap-2"
                    >
                        {badges.map((b, i) => (
                            <span key={i}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white border border-white/15"
                                style={{ background: 'rgba(255,255,255,0.10)' }}>
                                {b.icon} {b.label}
                            </span>
                        ))}
                    </motion.div>

                    {/* CTA Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        whileHover={{ scale: 1.05, boxShadow: `0 12px 32px ${B.amber}55` }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/doctors')}
                        className="flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-sm shadow-xl transition-all"
                        style={{ background: `linear-gradient(135deg, ${B.amber}, #e8a020)`, color: '#fff' }}
                    >
                        {t('home.bookAppointmentBtn')}
                        <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </div>

                {/* ── Right: Doctor Image ───────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
                    className="relative flex-shrink-0 w-full md:w-[45%] flex justify-center"
                >
                    {/* Glow ring behind image */}
                    <div className="absolute inset-0 rounded-3xl blur-2xl opacity-30"
                        style={{ background: `radial-gradient(circle, ${B.amber}, transparent 70%)` }} />
                    <motion.img
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.4 }}
                        className="relative w-full max-w-sm md:max-w-none h-auto rounded-2xl drop-shadow-2xl"
                        src={docimage1}
                        alt="Doctor"
                    />
                    {/* Floating stat card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                        animate2={{ y: [0, -6, 0] }}
                        className="absolute bottom-6 left-4 px-4 py-3 rounded-2xl border border-white/20 shadow-xl"
                        style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
                    >
                        <p className="text-white font-bold text-lg">{t('home.totalVets')}</p>
                        <p className="text-amber-200 text-xs">{t('home.cityCoverage')}</p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Header;
