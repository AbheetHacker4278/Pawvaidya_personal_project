import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import specialityimage from '../assets/New/Speciality_Doctors.png';

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

const SpecialityMenu = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      id="speciality"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="flex flex-col items-center gap-6 py-16 px-4"
    >
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border"
        style={{ background: B.pale, borderColor: B.sand, color: B.mid }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: B.amber }} />
        {t('home.specialityLabel')}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-2xl sm:text-3xl font-bold text-center"
        style={{ color: B.dark }}
      >
        {t('home.findBySpeciality')}
      </motion.h2>

      {/* Amber underline */}
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: 80 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="h-1 rounded-full"
        style={{ background: `linear-gradient(to right, ${B.mid}, ${B.amber})` }}
      />

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="w-full sm:w-2/3 lg:w-1/3 text-center text-sm"
        style={{ color: B.light }}
      >
        {t('home.trustedDoctors')} {t('home.scheduleAppointment')}
      </motion.p>

      {/* Speciality image */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.45, duration: 0.8, ease: 'easeOut' }}
        whileHover={{ scale: 1.02 }}
        className="relative rounded-3xl overflow-hidden shadow-xl border"
        style={{ borderColor: B.sand }}
      >
        {/* Warm tint overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${B.mid}10, transparent 60%, ${B.amber}08)` }} />
        <img
          src={specialityimage}
          alt="Speciality Doctors"
          className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl"
        />
      </motion.div>
    </motion.div>
  );
};

export default SpecialityMenu;
