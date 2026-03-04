import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Star } from 'lucide-react';

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

const Banner = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl mx-4 md:mx-10 my-16 shadow-2xl"
      style={{ background: `linear-gradient(135deg, ${B.dark} 0%, ${B.mid} 55%, ${B.light} 100%)` }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-12 -left-12 w-56 h-56 rounded-full blur-3xl opacity-15"
        style={{ background: B.cream }} />
      <div className="absolute -bottom-10 -right-10 w-72 h-72 rounded-full blur-3xl opacity-10"
        style={{ background: B.amber }} />
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 px-8 md:px-14 py-12">
        {/* Left content */}
        <div className="flex flex-col gap-4 max-w-lg">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-amber-200 border border-white/15 w-fit"
            style={{ background: 'rgba(255,255,255,0.10)' }}
          >
            <Star className="w-3 h-3" /> {t('banner.trustedOwners')}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-snug"
          >
            {t('appointments.bookAppointment')}<br />
            <span style={{ color: '#f5c842' }}>{t('banner.withTrusted')}</span> Veterinary
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-amber-100 text-sm leading-relaxed"
          >
            {t('banner.description')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-3 mt-2"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: `0 12px 32px ${B.amber}55` }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { navigate('/login'); scrollTo(0, 0); }}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm shadow-xl"
              style={{ background: `linear-gradient(135deg, ${B.amber}, #e8a020)`, color: '#fff' }}
            >
              <Calendar className="w-4 h-4" /> {t('banner.createAccount')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { navigate('/doctors'); scrollTo(0, 0); }}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm border border-white/25 text-white transition"
              style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)' }}
            >
              {t('banner.browseDoctors')} <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>

        {/* Right: floating stat cards */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col gap-4 w-full md:w-auto"
        >
          {[
            { value: '500+', label: t('banner.expertVets'), icon: '🩺' },
            { value: '50k+', label: t('banner.happyPetOwners'), icon: '🐾' },
            { value: '100+', label: t('banner.citiesCovered'), icon: '📍' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 + i * 0.1 }}
              whileHover={{ scale: 1.04, x: -4 }}
              className="flex items-center gap-4 px-5 py-3.5 rounded-2xl border border-white/15"
              style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)', minWidth: '200px' }}
            >
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-amber-200">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Banner;