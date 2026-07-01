import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../context/AppContext';
import { translateSpeciality } from '../utils/translateSpeciality';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, HeartPulse } from 'lucide-react';

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

const ReleatedDoctors = ({ speciality, docId, location, State }) => {
  const [relDoc, setRelDoc] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const { doctors, userdata } = useContext(AppContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isObsidian = userdata?.subscription?.plan === 'Obsidian';

  useEffect(() => {
    if (doctors.length > 0 && speciality && location && State) {
      const doctorsData = doctors.filter(
        (doc) =>
          doc.speciality === speciality &&
          doc._id !== docId &&
          doc.address.Location === location &&
          doc.address.line === State
      );
      setRelDoc(doctorsData);
    }
  }, [doctors, speciality, docId, location, State]);

  return (
    <section 
      className={`relative py-16 px-4 md:px-10 overflow-hidden transition-all duration-300 ${isObsidian ? 'bg-[#050505] border-t border-[#E6C97A]/10' : ''}`}
      style={isObsidian ? {} : { background: B.cream }}
    >
      {/* Subtle dot grid */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{ 
          backgroundImage: isObsidian 
            ? 'radial-gradient(circle, #E6C97A 1px, transparent 1px)' 
            : 'radial-gradient(circle, #5A4035 1px, transparent 1px)', 
          backgroundSize: '28px 28px' 
        }} 
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          {/* Label pill */}
          <div 
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border transition-all ${
              isObsidian 
                ? 'bg-[#121212] text-[#E6C97A] border-[#E6C97A]/25 shadow-[0_0_15px_rgba(230,201,122,0.05)]' 
                : ''
            }`}
            style={isObsidian ? {} : { background: '#f5ede8', color: B.mid, borderColor: B.sand }}
          >
            <span style={{ color: isObsidian ? '#E6C97A' : B.amber }}>●</span>
            From Your Location
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-3 transition-colors" style={{ color: isObsidian ? '#ffffff' : B.dark }}>
            Related Doctors
          </h2>

          {/* Underline */}
          <motion.div
            className="h-1 w-16 rounded-full mx-auto mb-3"
            style={{ 
              background: isObsidian 
                ? 'linear-gradient(to right, #d97706, #E6C97A)'
                : `linear-gradient(to right, ${B.mid}, ${B.amber})` 
            }}
            initial={{ width: 0 }}
            whileInView={{ width: 64 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          <p className="text-sm max-w-sm mx-auto transition-colors" style={{ color: isObsidian ? '#a3a3a3' : B.light }}>
            Browse trusted veterinarians near you with the same speciality.
          </p>
        </motion.div>

        {relDoc.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {relDoc.slice(0, 5).map((item, index) => (
              <motion.div
                key={item._id || index}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', damping: 15, stiffness: 100, delay: index * 0.08 }}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                whileTap={{ scale: 0.97 }}
                onHoverStart={() => setHoveredCard(index)}
                onHoverEnd={() => setHoveredCard(null)}
                onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0); }}
                className={`group relative rounded-3xl overflow-hidden cursor-pointer border transition-all duration-300 ${
                  isObsidian 
                    ? 'bg-[#0A0A0A] border-[#E6C97A]/15 hover:border-[#E6C97A]/40' 
                    : ''
                }`}
                style={isObsidian ? {
                  boxShadow: hoveredCard === index
                    ? '0 16px 40px rgba(230, 201, 122, 0.08)'
                    : '0 4px 20px rgba(0, 0, 0, 0.5)',
                } : {
                  background: 'rgba(237, 228, 216, 0.85)',
                  backdropFilter: 'blur(16px)',
                  borderColor: hoveredCard === index ? B.mid : B.sand,
                  boxShadow: hoveredCard === index
                    ? `0 16px 40px rgba(90,64,53,0.18)`
                    : '0 2px 12px rgba(90,64,53,0.07)',
                }}
              >
                {/* Hover overlay */}
                {isObsidian ? (
                  <motion.div
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{ background: `linear-gradient(135deg, rgba(230,201,122,0.05), transparent, rgba(230,201,122,0.02))` }}
                    animate={{ opacity: hoveredCard === index ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                ) : (
                  <motion.div
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{ background: `linear-gradient(135deg, rgba(90,64,53,0.10), transparent, rgba(200,134,10,0.06))` }}
                    animate={{ opacity: hoveredCard === index ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}

                {/* Doctor image */}
                <div 
                  className="relative overflow-hidden h-64"
                  style={isObsidian ? {
                    background: 'radial-gradient(circle, rgba(230,201,122,0.15) 0%, rgba(10,10,10,1) 85%)'
                  } : { 
                    background: `linear-gradient(135deg, #f5ede8, #fdf8f0)` 
                  }}
                >
                  {isObsidian && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-7xl select-none pointer-events-none opacity-[0.03] text-[#E6C97A]">
                      🐾
                    </div>
                  )}

                  <motion.img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    animate={{ scale: hoveredCard === index ? 1.05 : 1 }}
                    transition={{ duration: 0.5 }}
                  />

                  {/* Availability badge */}
                  <div
                    className={`absolute top-2.5 right-2.5 px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 text-xs font-semibold shadow transition-all ${
                      isObsidian
                        ? item.available 
                          ? 'border border-green-500/30 bg-green-500/10 text-white' 
                          : 'border border-neutral-700 bg-neutral-900/80 text-neutral-400'
                        : 'text-white'
                    }`}
                    style={isObsidian ? {} : { background: item.available ? 'rgba(34,197,94,0.88)' : 'rgba(107,114,128,0.88)' }}
                  >
                    <motion.span
                      className={`w-1.5 h-1.5 rounded-full ${isObsidian ? (item.available ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-neutral-500') : 'bg-white'}`}
                      animate={item.available ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : {}}
                      transition={{ duration: 1.8, repeat: Infinity }}
                    />
                    {item.available ? t('common.available') : t('common.notAvailable')}
                  </div>

                  {/* Corner accent */}
                  {!isObsidian && (
                    <div className="absolute bottom-0 right-0 w-12 h-12 rounded-tl-full"
                      style={{ background: 'rgba(255,255,255,0.25)' }} />
                  )}
                </div>

                {/* Divider between image and content */}
                {isObsidian && (
                  <div className="h-px bg-gradient-to-r from-transparent via-[#E6C97A]/40 to-transparent relative mx-4">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-1 bg-white rounded-full shadow-[0_0_8px_#fff,0_0_12px_#E6C97A] blur-[1px]"></div>
                  </div>
                )}

                {/* Content */}
                <div className="p-5" style={isObsidian ? {} : { background: `linear-gradient(to bottom, transparent, rgba(237,228,216,0.3))` }}>
                  <p className="font-extrabold text-lg mb-3 transition-colors duration-300"
                    style={{ color: isObsidian ? '#ffffff' : (hoveredCard === index ? B.mid : B.dark) }}>
                    {item.name}
                  </p>

                  {/* Location badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {isObsidian ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold border border-[#E6C97A]/30 text-[#E6C97A] bg-[#0A0A0A]">
                          <MapPin className="w-3.5 h-3.5 text-[#E6C97A]" />
                          {item.address?.Location}
                        </span>
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-extrabold text-black bg-gradient-to-r from-amber-600 to-[#E6C97A]">
                          {item.address?.line}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: '#f5ede8', color: B.mid, border: `1px solid ${B.sand}` }}>
                          <MapPin className="w-2.5 h-2.5" />
                          {item.address?.Location}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: '#fff8e6', color: B.amber, border: '1px solid #f0d080' }}>
                          {item.address?.line}
                        </span>
                      </>
                    )}
                  </div>

                  {isObsidian ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 mt-3 mb-4">
                      <HeartPulse className="w-4 h-4 text-[#E6C97A] flex-shrink-0" />
                      <span>{translateSpeciality(item.speciality, t)}</span>
                    </div>
                  ) : (
                    <p className="text-xs font-medium mb-3" style={{ color: B.light }}>
                      {translateSpeciality(item.speciality, t)}
                    </p>
                  )}

                  {/* Inner Divider */}
                  {isObsidian && (
                    <div className="border-t border-dashed border-[#E6C97A]/20 my-4" />
                  )}

                  {/* View profile row */}
                  {isObsidian ? (
                    <motion.div
                      className="border border-[#E6C97A]/20 rounded-2xl px-4 py-3 flex items-center justify-between transition-all group-hover:bg-[#E6C97A]/5 group-hover:border-[#E6C97A]/40"
                    >
                      <span className="text-xs font-extrabold text-[#E6C97A]">View Profile</span>
                      <motion.div
                        animate={{ x: hoveredCard === index ? 4 : 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <ArrowRight className="w-4 h-4 text-[#E6C97A]" />
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="pt-2.5 border-t flex items-center justify-between"
                      style={{ borderColor: B.sand }}
                      animate={{ opacity: hoveredCard === index ? 1 : 0.4 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-xs font-semibold" style={{ color: B.mid }}>View Profile</span>
                      <motion.div
                        animate={{ x: hoveredCard === index ? 4 : 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <ArrowRight className="w-3.5 h-3.5" style={{ color: B.amber }} />
                      </motion.div>
                    </motion.div>
                  )}
                </div>

                {/* Bottom accent bar */}
                {!isObsidian && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: `linear-gradient(to right, ${B.mid}, ${B.amber}, ${B.mid})` }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: hoveredCard === index ? 1 : 0 }}
                    transition={{ duration: 0.35 }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`text-center py-16 px-6 rounded-3xl border ${isObsidian ? 'bg-[#0D0D0D] border-[#E6C97A]/15 text-white' : ''}`}
            style={isObsidian ? {} : { background: '#fff', borderColor: B.sand }}
          >
            <div className={`text-5xl mb-4 ${isObsidian ? 'filter drop-shadow-[0_0_8px_rgba(230,201,122,0.4)]' : ''}`}>🐾</div>
            <p className="text-xl font-extrabold mb-2" style={isObsidian ? {} : { color: B.dark }}>
              No Other Doctors Found
            </p>
            <p className="text-sm" style={{ color: isObsidian ? '#a3a3a3' : B.light }}>
              No other <strong>{translateSpeciality(speciality, t)}</strong> vets available in <strong>{State}</strong> right now.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default ReleatedDoctors;
