import { useContext, useState } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { translateSpeciality } from '../utils/translateSpeciality';
import { MapPin, GraduationCap, ArrowRight } from 'lucide-react';

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

// ─── Individual tilt card ─────────────────────────────────────────────────────
const DoctorCard = ({ item, index, onClick, t }) => {

  const [hovered, setHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-80, 80], [8, -8]);
  const rotateY = useTransform(x, [-80, 80], [-8, 8]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  return (
    <motion.div
      key={index}
      variants={{
        hidden: { opacity: 0, y: 60, scale: 0.88 },
        visible: {
          opacity: 1, y: 0, scale: 1,
          transition: { type: 'spring', damping: 18, stiffness: 90, delay: index * 0.07 }
        }
      }}
      style={{
        rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000,
        background: 'rgba(237, 228, 216, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(232,213,176,0.6)',
        boxShadow: hovered
          ? '0 24px 48px rgba(61,43,31,0.18), 0 8px 16px rgba(61,43,31,0.10)'
          : '0 8px 24px rgba(61,43,31,0.10), 0 2px 8px rgba(61,43,31,0.07)',
        transition: 'box-shadow 0.4s ease',
      }}
      className="relative cursor-pointer rounded-[24px] overflow-hidden w-full max-w-[260px] mx-auto"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
    >
      {/* ── Ambient glow behind card ── */}
      <motion.div
        className="absolute -inset-px rounded-[24px] z-0 pointer-events-none"
        animate={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(ellipse at 60% 0%, rgba(200,134,10,0.18) 0%, transparent 70%)`
        }}
        transition={{ duration: 0.4 }}
      />

      {/* ── Image section ── */}
      <div
        className="relative overflow-hidden"
        style={{
          height: 200,
          background: `linear-gradient(145deg, ${B.sand}80, ${B.pale})`,
        }}
      >
        <motion.img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
          animate={{ scale: hovered ? 1.1 : 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />

        {/* Frosted bottom gradient over image */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.9) 0%, transparent 100%)' }}
        />

        {/* ── Availability badge ── */}
        <motion.div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold shadow-md"
          style={{
            background: item.available
              ? 'linear-gradient(135deg, #16a34a, #22c55e)'
              : 'linear-gradient(135deg, #6b7280, #9ca3af)',
            color: '#fff',
            boxShadow: item.available ? '0 4px 12px rgba(34,197,94,0.4)' : 'none',
          }}
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.07 + 0.3, type: 'spring', stiffness: 200 }}
        >
          {/* Pulsing dot */}
          {item.available && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
          )}
          <span>{item.available ? 'Available' : 'Unavailable'}</span>
        </motion.div>

        {/* ── Shimmer sweep ── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-0 -left-full h-full w-1/2 skew-x-12"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.35), transparent)'
            }}
            animate={hovered ? { left: '200%' } : { left: '-100%' }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 px-5 pt-4 pb-5 flex flex-col gap-3">
        {/* Name */}
        <motion.h3
          className="text-[17px] font-extrabold leading-tight line-clamp-1"
          style={{ color: B.dark }}
          animate={{ color: hovered ? B.amber : B.dark }}
          transition={{ duration: 0.3 }}
        >
          {item.name}
        </motion.h3>

        {/* Speciality */}
        <div className="flex items-center gap-2">
          <GraduationCap size={14} style={{ color: B.amber }} strokeWidth={2.2} />
          <span className="text-[13px] font-semibold" style={{ color: B.light }}>
            {translateSpeciality(item.speciality, t)}
          </span>
        </div>

        {/* Location badges */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: '#f5ede8', color: B.mid, border: `1px solid ${B.sand}` }}
          >
            <MapPin size={10} strokeWidth={2.5} />
            {item.address?.Location}
          </span>
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: '#fff8e6', color: B.amber, border: '1px solid #f0d080' }}
          >
            {item.address?.line}
          </span>
        </div>

        {/* ── Divider line (animates in on hover) ── */}
        <motion.div
          className="h-px w-full rounded-full"
          style={{ background: `linear-gradient(to right, ${B.sand}, transparent)` }}
          animate={{ opacity: hovered ? 1 : 0.4 }}
          transition={{ duration: 0.3 }}
        />

        {/* ── CTA Row ── */}
        <div className="flex items-center justify-between">
          <motion.span
            className="text-[12px] font-bold tracking-wide"
            style={{ color: B.mid }}
            animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -8 }}
            transition={{ duration: 0.3 }}
          >
            Book Appointment
          </motion.span>

          {/* Arrow button */}
          <motion.div
            className="flex items-center justify-center w-8 h-8 rounded-full"
            style={{ background: `linear-gradient(135deg, ${B.mid}, ${B.amber})` }}
            animate={{
              scale: hovered ? 1.15 : 1,
              boxShadow: hovered
                ? '0 6px 16px rgba(200,134,10,0.45)'
                : '0 2px 6px rgba(200,134,10,0.2)',
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{ x: hovered ? 2 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <ArrowRight size={14} color="#fff" strokeWidth={2.5} />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── Bottom accent bar ── */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-[24px]"
        style={{ background: `linear-gradient(to right, ${B.mid}, ${B.amber}, ${B.mid})` }}
        animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
        initial={{ scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  );
};

// ─── Main section ─────────────────────────────────────────────────────────────
const TopDoctors = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { doctors, isDoctorsLoading } = useContext(AppContext);

  return (
    <div className="flex flex-col gap-10 my-20 md:mx-10 px-4 overflow-hidden">
      {/* ── Section heading ── */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center flex flex-col items-center gap-3"
      >
        {/* Label pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border"
          style={{ background: B.pale, borderColor: B.sand, color: B.mid }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: B.amber }} />
          {t('home.topDoctors') || 'Our Top Vets'}
        </motion.div>

        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold"
          style={{ color: B.dark }}
        >
          Trusted <span style={{ color: B.amber }}>Veterinary</span> Experts
        </motion.h2>

        <motion.div
          className="h-1 rounded-full"
          style={{ background: `linear-gradient(to right, ${B.mid}, ${B.amber})` }}
          initial={{ width: 0 }}
          animate={{ width: 80 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />

        <motion.p
          className="text-sm max-w-xs sm:max-w-md text-center"
          style={{ color: B.light }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {t('home.trustedDoctors') || 'Browse through our extensive list of trusted doctors and schedule your appointment hassle-free.'}
        </motion.p>
      </motion.div>

      {/* ── Cards grid ── */}
      <div className="w-full flex justify-center">
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
          }}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pt-4 max-w-[1600px] w-full"
        >
          {isDoctorsLoading && doctors.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`sk-top-${i}`}
                className="rounded-[24px] overflow-hidden border border-[rgba(232,213,176,0.6)] animate-pulse"
                style={{ background: 'rgba(237, 228, 216, 0.85)', minHeight: '360px' }}
              >
                <div className="h-[200px]" style={{ background: B.sand }} />
                <div className="p-5 space-y-4">
                  <div className="h-6 w-3/4 rounded-lg" style={{ background: B.sand }} />
                  <div className="h-4 w-1/2 rounded-lg" style={{ background: B.sand }} />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 rounded-full" style={{ background: B.sand }} />
                    <div className="h-5 w-20 rounded-full" style={{ background: B.sand }} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            doctors.slice(0, 10).map((item, index) => (
              <DoctorCard
                key={item._id || index}
                item={item}
                index={index}
                t={t}
                onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0); }}
              />
            ))
          )}
        </motion.div>
      </div>

      {/* ── Explore button ── */}
      <motion.div
        className="flex justify-center w-full mt-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(90,64,53,0.35)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { navigate('/doctors'); scrollTo(0, 0); }}
          className="relative px-12 py-4 rounded-full text-white text-[15px] font-bold overflow-hidden shadow-xl"
          style={{ background: `linear-gradient(135deg, ${B.mid}, ${B.amber})` }}
        >
          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)' }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
          />
          <span className="relative z-10 flex items-center gap-3">
            {t('home.exploreBtn') || 'Explore All Doctors'}
            <motion.div
              animate={{ x: [0, 6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              <ArrowRight size={18} strokeWidth={2.5} />
            </motion.div>
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default TopDoctors;
