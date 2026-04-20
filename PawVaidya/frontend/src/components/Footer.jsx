import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import footerLogo from '../assets/New/footerlogo.png';
import { assets } from '../assets/assets_frontend/assets';
import { AppContext } from '../context/AppContext';
import { useContext } from 'react';
import { Phone, Mail, MapPin, ArrowRight, Heart } from 'lucide-react';

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

const Footer = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { userdata } = useContext(AppContext);

    const activePlan = userdata?.subscription?.status === 'Active' ? userdata.subscription.plan : 'None';
    const brandedLogo =
        activePlan === 'Gold' ? assets.gold_logo :
            activePlan === 'Platinum' ? assets.platinum_logo :
                activePlan === 'Silver' ? assets.silver_logo :
                    null;

    const companyLinks = [
        { label: t('footer.home'), path: '/' },
        { label: t('footer.aboutUs'), path: '/about' },
        { label: t('footer.contactUs'), path: '/contact' },
        { label: t('footer.privacyPolicy'), path: '/privacy-policy' },
        { label: t('footer.faqs'), path: '/faqs' },
        { label: t('footer.reportIssue'), path: '/report-issue' },
    ];

    const socialLinks = [
        {
            label: 'Instagram',
            href: '#',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
            ),
        },
        {
            label: 'Twitter / X',
            href: '#',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            ),
        },
        {
            label: 'Facebook',
            href: '#',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            ),
        },
        {
            label: 'LinkedIn',
            href: '#',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
            ),
        },
    ];

    return (
        <footer
            className="relative overflow-hidden rounded-3xl mx-4 md:mx-6 mb-6 mt-4"
            style={{ background: `linear-gradient(135deg, ${B.dark} 0%, ${B.mid} 60%, ${B.light} 100%)` }}
        >
            {/* Decorative blobs */}
            <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-10"
                style={{ background: B.cream }} />
            <div className="absolute -bottom-12 -right-12 w-72 h-72 rounded-full blur-3xl opacity-08"
                style={{ background: B.amber }} />
            <div className="absolute inset-0 opacity-[0.04]"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative z-10 px-6 md:px-12 pt-12 pb-6">

                {/* ── Top grid ──────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">

                    {/* Brand column */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-1"
                    >
                        <img src={brandedLogo || footerLogo} alt="PawVaidya" className="w-36 mb-4" />
                        <p className="text-sm leading-relaxed mb-5" style={{ color: '#d4b896' }}>
                            {t('footer.description')}
                        </p>
                        {/* Social icons */}
                        <div className="flex gap-2.5">
                            {socialLinks.map((s, i) => (
                                <motion.a
                                    key={i}
                                    href={s.href}
                                    aria-label={s.label}
                                    whileHover={{ scale: 1.15, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/15 transition-colors"
                                    style={{ background: 'rgba(255,255,255,0.08)', color: '#d4b896' }}
                                    onMouseEnter={e => e.currentTarget.style.background = `rgba(200,134,10,0.25)`}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                >
                                    {s.icon}
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Company links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: B.amber }}>
                            {t('footer.company')}
                        </h3>
                        <ul className="flex flex-col gap-2.5">
                            {companyLinks.map((link, i) => (
                                <motion.li
                                    key={i}
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => { navigate(link.path); scrollTo(0, 0); }}
                                    className="flex items-center gap-2 text-sm cursor-pointer group transition-colors"
                                    style={{ color: '#d4b896' }}
                                >
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: B.amber }} />
                                    <span className="group-hover:text-white transition-colors">{link.label}</span>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Get in touch */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: B.amber }}>
                            {t('footer.getInTouch')}
                        </h3>
                        <ul className="flex flex-col gap-3">
                            <li className="flex items-start gap-3 text-sm" style={{ color: '#d4b896' }}>
                                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: B.amber }} />
                                <span>+91 99999 99999</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm" style={{ color: '#d4b896' }}>
                                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: B.amber }} />
                                <span>support@pawvaidya.com</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm" style={{ color: '#d4b896' }}>
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: B.amber }} />
                                <span>100+ Cities across India</span>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Newsletter / CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: B.amber }}>
                            {t('footer.bookAVet')}
                        </h3>
                        <p className="text-sm mb-4" style={{ color: '#d4b896' }}>
                            {t('footer.findVetSub')}
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.04, boxShadow: `0 8px 24px ${B.amber}55` }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { navigate('/doctors'); scrollTo(0, 0); }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg"
                            style={{ background: `linear-gradient(135deg, ${B.amber}, #e8a020)` }}
                        >
                            {t('footer.findADoctor')} <ArrowRight className="w-4 h-4" />
                        </motion.button>

                        {/* Trust badge */}
                        <div className="mt-5 flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 w-fit"
                            style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <span className="text-lg">🐾</span>
                            <div>
                                <p className="text-xs font-bold text-white">{t('footer.happyPets')}</p>
                                <p className="text-xs" style={{ color: '#d4b896' }}>{t('footer.servedIndia')}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── Divider ───────────────────────────────────────────────────── */}
                <div className="h-px mb-5" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)' }} />

                {/* ── Bottom bar ────────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: '#a08060' }}>
                        {t('footer.copyright')}
                    </p>
                    <p className="text-xs flex items-center gap-1" style={{ color: '#a08060' }}>
                        Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> for pets everywhere
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;