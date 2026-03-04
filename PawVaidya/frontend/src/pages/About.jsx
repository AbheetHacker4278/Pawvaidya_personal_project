import React from 'react'
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import PawBackground from '../components/PawBackground'
import { Zap, Target, Heart, MapPin, Star, Users, Building2 } from 'lucide-react';

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

const About = () => {
    const { t } = useTranslation();

    const features = [
        {
            title: t('about.efficiency'),
            description: t('about.efficiencyText'),
            icon: <Zap className="w-7 h-7" style={{ color: B.amber }} />,
            iconBg: '#fff8e6',
            accentFrom: B.amber,
            accentTo: '#e8a020',
        },
        {
            title: t('about.convenience'),
            description: t('about.convenienceText'),
            icon: <Target className="w-7 h-7" style={{ color: B.mid }} />,
            iconBg: '#f5ede8',
            accentFrom: B.mid,
            accentTo: B.light,
        },
        {
            title: t('about.personalization'),
            description: t('about.personalizationText'),
            icon: <Heart className="w-7 h-7" style={{ color: '#c0392b' }} />,
            iconBg: '#fdf0ee',
            accentFrom: '#c0392b',
            accentTo: '#e74c3c',
        },
    ];

    const stats = [
        { number: '500+', label: t('about.vetsLabel'), icon: <Users className="w-5 h-5" />, accent: B.mid },
        { number: '50k+', label: t('about.petsLabel'), icon: <span className="text-xl">🐾</span>, accent: B.amber },
        { number: '100+', label: t('about.citiesLabel'), icon: <MapPin className="w-5 h-5" />, accent: B.light },
        { number: '4.9', label: t('about.ratingLabel'), icon: <Star className="w-5 h-5" />, accent: '#c0392b' },
    ];

    return (
        <div className="relative min-h-screen overflow-hidden pb-12" style={{ background: B.cream }}>
            <PawBackground density="light" />

            {/* ── Hero Header ───────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden py-12 px-6 mb-8 rounded-b-[2.5rem] shadow-xl"
                style={{ background: `linear-gradient(135deg, ${B.dark} 0%, ${B.mid} 55%, ${B.light} 100%)` }}
            >
                {/* Decorative blobs */}
                <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full blur-3xl opacity-15"
                    style={{ background: B.cream }} />
                <div className="absolute -bottom-8 -right-8 w-64 h-64 rounded-full blur-3xl opacity-10"
                    style={{ background: B.amber }} />
                <div className="absolute inset-0 opacity-5"
                    style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 border border-white/20"
                        style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
                    >
                        <span className="text-3xl">🐾</span>
                    </motion.div>

                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                        {t('about.title')}
                    </h1>
                    <div className="h-1 w-20 rounded-full mx-auto mb-3"
                        style={{ background: `linear-gradient(to right, ${B.amber}, #e8a020)` }} />
                    <p className="text-amber-200 text-base md:text-lg font-medium">
                        {t('about.subtitle')}
                    </p>
                </div>
            </motion.div>

            {/* ── Stats Grid ────────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="relative z-10 max-w-5xl mx-auto px-4 mb-8"
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + i * 0.08 }}
                            whileHover={{ scale: 1.04, y: -3 }}
                            className="rounded-2xl p-4 text-center border transition-all duration-300"
                            style={{
                                background: '#fff',
                                borderColor: B.sand,
                                boxShadow: '0 2px 10px rgba(90,64,53,0.08)',
                            }}
                        >
                            <div className="flex justify-center mb-2" style={{ color: stat.accent }}>
                                {stat.icon}
                            </div>
                            <div className="text-2xl font-bold mb-0.5" style={{ color: stat.accent }}>
                                {stat.number}
                            </div>
                            <div className="text-xs font-semibold" style={{ color: B.light }}>{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ── Main Content Card ─────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative z-10 max-w-5xl mx-auto px-4 mb-8"
            >
                <div className="rounded-2xl overflow-hidden border"
                    style={{ background: '#fff', borderColor: B.sand, boxShadow: '0 4px 24px rgba(90,64,53,0.10)' }}>
                    <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${B.dark}, ${B.mid}, ${B.amber})` }} />
                    <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8">
                        {/* Image */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex-shrink-0 mx-auto md:mx-0"
                        >
                            <div className="relative group">
                                <div className="absolute -inset-1 rounded-2xl blur opacity-60 group-hover:opacity-90 transition duration-300"
                                    style={{ background: `linear-gradient(135deg, ${B.mid}, ${B.amber})` }} />
                                <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-2xl transform transition-all duration-300 group-hover:scale-105 group-hover:rotate-1">
                                    <img
                                        className="w-full h-full object-cover"
                                        src="https://i.ibb.co/6Wzk9nP/DALL-E-2024-11-24-18-06-17-A-cheerful-veterinarian-surrounded-by-various-animals-including-dogs-cats.webp"
                                        alt="Veterinarian with animals"
                                    />
                                </div>
                                <div className="absolute -bottom-2 left-2 right-2 h-2 rounded-full blur-sm"
                                    style={{ background: `linear-gradient(to right, ${B.mid}55, ${B.amber}55)` }} />
                            </div>
                        </motion.div>

                        {/* Content */}
                        <div className="flex-1 space-y-5">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">👋</span>
                                    <h2 className="text-xl md:text-2xl font-bold" style={{ color: B.dark }}>
                                        {t('about.welcomeTitle')}
                                    </h2>
                                </div>
                                <p className="leading-relaxed font-medium" style={{ color: B.mid }}>
                                    {t('about.welcome')}
                                </p>
                            </div>

                            <p className="leading-relaxed text-sm" style={{ color: B.light }}>
                                {t('about.description')}
                            </p>

                            {/* Vision box */}
                            <div className="rounded-xl p-4 border"
                                style={{ background: B.pale, borderColor: B.sand }}>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5"
                                        style={{ background: `linear-gradient(135deg, ${B.mid}, ${B.amber})` }}>
                                        <Target className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold mb-1" style={{ color: B.dark }}>
                                            {t('about.vision')}
                                        </h3>
                                        <p className="leading-relaxed text-sm" style={{ color: B.light }}>
                                            {t('about.visionText')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Why Choose Us ─────────────────────────────────────────────────── */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 pb-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mb-6"
                >
                    <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: B.dark }}>
                        {t('about.whyChoosePrefix')}{' '}
                        <span style={{ background: `linear-gradient(to right, ${B.mid}, ${B.amber})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            PawVaidya
                        </span>?
                    </h2>
                    <div className="h-1 w-20 rounded-full mx-auto"
                        style={{ background: `linear-gradient(to right, ${B.mid}, ${B.amber})` }} />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                            className="group rounded-2xl p-5 border transition-all duration-300"
                            style={{
                                background: '#fff',
                                borderColor: B.sand,
                                boxShadow: '0 2px 10px rgba(90,64,53,0.07)',
                            }}
                        >
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300"
                                style={{ background: f.iconBg }}>
                                {f.icon}
                            </div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: B.dark }}>{f.title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: B.light }}>{f.description}</p>
                            <div className="mt-4 h-1 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                                style={{ background: `linear-gradient(to right, ${f.accentFrom}, ${f.accentTo})` }} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default About