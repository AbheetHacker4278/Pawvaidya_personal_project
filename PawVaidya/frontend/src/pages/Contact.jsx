import React from 'react'
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import PawBackground from '../components/PawBackground'
import { MapPin, Phone, Mail, Briefcase, Calendar, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const Contact = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const contactInfo = [
    {
      icon: <MapPin className="w-7 h-7 text-white" />,
      iconBg: `linear-gradient(135deg, ${B.mid}, ${B.light})`,
      title: t('contact.ourOffice'),
      content: t('contact.address'),
      chipBg: '#f5ede8',
      chipBorder: B.sand,
    },
    {
      icon: <Phone className="w-7 h-7 text-white" />,
      iconBg: `linear-gradient(135deg, ${B.amber}, #e8a020)`,
      title: t('contact.getInTouch'),
      content: `${t('contact.phone')}\n${t('contact.email')}`,
      chipBg: '#fff8e6',
      chipBorder: '#f0d080',
    },
    {
      icon: <Briefcase className="w-7 h-7 text-white" />,
      iconBg: `linear-gradient(135deg, #c0392b, #e74c3c)`,
      title: t('contact.career'),
      content: t('contact.careerText'),
      chipBg: '#fdf0ee',
      chipBorder: '#f5c6c0',
    },
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
            <MessageCircle className="w-8 h-8 text-white" />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            {t('contact.title')}
          </h1>
          <div className="h-1 w-20 rounded-full mx-auto mb-3"
            style={{ background: `linear-gradient(to right, ${B.amber}, #e8a020)` }} />
          <p className="text-amber-200 text-base md:text-lg font-medium">
            {t('contact.subtitle')}
          </p>
        </div>
      </motion.div>

      {/* ── Main Contact Card ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative z-10 max-w-5xl mx-auto px-4 mb-8"
      >
        <div className="rounded-2xl overflow-hidden border"
          style={{ background: 'rgba(237, 228, 216, 0.85)', backdropFilter: 'blur(16px)', borderColor: B.sand, boxShadow: '0 4px 24px rgba(90,64,53,0.10)' }}>
          <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${B.dark}, ${B.mid}, ${B.amber})` }} />
          <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex-shrink-0 mx-auto md:mx-0"
            >
              <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl blur opacity-60 group-hover:opacity-90 transition duration-300"
                  style={{ background: `linear-gradient(135deg, ${B.mid}, ${B.amber})` }} />
                <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-2xl transform transition-all duration-300 group-hover:scale-105 group-hover:rotate-1">
                  <img
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop"
                    alt="Veterinary Contact"
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
                    {t('contact.letsConnect')}
                  </h2>
                </div>
                <p className="leading-relaxed font-medium" style={{ color: B.mid }}>
                  {t('contact.connectSubtitle')}
                </p>
              </div>

              {/* Quick contact chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl p-3 border flex items-center gap-3"
                  style={{ background: B.pale, borderColor: B.sand }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${B.mid}, ${B.light})` }}>
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide" style={{ color: B.light }}>{t('contact.callUs')}</div>
                    <div className="text-sm font-bold" style={{ color: B.dark }}>{t('contact.phone')}</div>
                  </div>
                </div>
                <div className="rounded-xl p-3 border flex items-center gap-3"
                  style={{ background: '#fff8e6', borderColor: '#f0d080' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${B.amber}, #e8a020)` }}>
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide" style={{ color: B.amber }}>{t('contact.emailUs')}</div>
                    <div className="text-sm font-bold" style={{ color: B.dark }}>{t('contact.email')}</div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/doctors')}
                className="w-full text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${B.mid}, ${B.light})` }}
              >
                <Calendar className="w-5 h-5" />
                {t('appointments.bookAppointment')}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Contact Info Cards ────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 pb-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-6"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: B.dark }}>
            <span style={{ background: `linear-gradient(to right, ${B.mid}, ${B.amber})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t('contact.otherWaysPrefix')}
            </span>{' '}{t('contact.otherWaysSuffix')}
          </h2>
          <div className="h-1 w-20 rounded-full mx-auto"
            style={{ background: `linear-gradient(to right, ${B.mid}, ${B.amber})` }} />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {contactInfo.map((info, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group rounded-2xl p-5 border transition-all duration-300"
              style={{
                background: 'rgba(237, 228, 216, 0.85)',
                backdropFilter: 'blur(16px)',
                borderColor: B.sand,
                boxShadow: '0 2px 10px rgba(90,64,53,0.07)',
              }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300"
                style={{ background: info.iconBg }}>
                {info.icon}
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: B.dark }}>{info.title}</h3>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: B.light }}>
                {info.content}
              </p>
              <div className="mt-4 h-1 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{ background: info.iconBg }} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Contact
