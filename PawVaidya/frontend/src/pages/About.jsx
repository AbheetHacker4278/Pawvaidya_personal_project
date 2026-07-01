import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PawBackground from '../components/PawBackground';
import { AppContext } from '../context/AppContext';
import { 
  Zap, Target, Heart, MapPin, Star, Users, Phone, Mail, 
  Briefcase, Calendar, MessageCircle, Info, ChevronRight, Stethoscope
} from 'lucide-react';

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

export default function About() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'about';
  const { userdata } = useContext(AppContext);

  const isObsidian = userdata?.subscription?.plan === 'Obsidian';

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // ─── About Tab Data ────────────────────────────────────────────────────────
  const features = [
    {
      title: t('about.efficiency') || 'Efficiency',
      description: t('about.efficiencyText') || 'Streamlined appointment scheduling that fits into your busy lifestyle.',
      icon: <Zap className="w-7 h-7" style={{ color: B.amber }} />,
      iconBg: '#fff8e6',
      accentFrom: B.amber,
      accentTo: '#e8a020',
    },
    {
      title: t('about.convenience') || 'Convenience',
      description: t('about.convenienceText') || 'Access to a network of trusted healthcare professionals in your area.',
      icon: <Target className="w-7 h-7" style={{ color: B.mid }} />,
      iconBg: '#f5ede8',
      accentFrom: B.mid,
      accentTo: B.light,
    },
    {
      title: t('about.personalization') || 'Personalization',
      description: t('about.personalizationText') || 'Tailored recommendations and reminders to help you stay on top of your health.',
      icon: <Heart className="w-7 h-7" style={{ color: '#c0392b' }} />,
      iconBg: '#fdf0ee',
      accentFrom: '#c0392b',
      accentTo: '#e74c3c',
    },
  ];

  const stats = [
    { number: '500+', label: t('about.vetsLabel') || 'Vets', icon: <Users className="w-5 h-5" />, accent: B.mid },
    { number: '50k+', label: t('about.petsLabel') || 'Pets', icon: <span className="text-xl">🐾</span>, accent: B.amber },
    { number: '100+', label: t('about.citiesLabel') || 'Cities', icon: <MapPin className="w-5 h-5" />, accent: B.light },
    { number: '4.9', label: t('about.ratingLabel') || 'Rating', icon: <Star className="w-5 h-5" />, accent: '#c0392b' },
  ];

  // ─── Contact Tab Data ──────────────────────────────────────────────────────
  const contactInfo = [
    {
      icon: <MapPin className="w-7 h-7 text-white" />,
      iconBg: `linear-gradient(135deg, ${B.mid}, ${B.light})`,
      title: t('contact.ourOffice') || 'Our Office',
      content: t('contact.address') || 'Vit Bhopal , astha Sehore , Madhya pradesh',
      chipBg: '#f5ede8',
      chipBorder: B.sand,
    },
    {
      icon: <Phone className="w-7 h-7 text-white" />,
      iconBg: `linear-gradient(135deg, ${B.amber}, #e8a020)`,
      title: t('contact.getInTouch') || 'Get in Touch',
      content: `${t('contact.phone') || 'Tel: (91) 9999999999'}\n${t('contact.email') || 'Email: aseth9588@gmail.com'}`,
      chipBg: '#fff8e6',
      chipBorder: '#f0d080',
    },
    {
      icon: <Briefcase className="w-7 h-7 text-white" />,
      iconBg: `linear-gradient(135deg, #c0392b, #e74c3c)`,
      title: t('contact.career') || 'Career At PawVaidya',
      content: t('contact.careerText') || 'Learn more about our teams and job openings.',
      chipBg: '#fdf0ee',
      chipBorder: '#f5c6c0',
    },
  ];

  // Dynamic titles and icons based on active tab
  const getHeaderDetails = () => {
    if (activeTab === 'contact') {
      return {
        title: t('contact.title') || 'Contact Us',
        subtitle: t('contact.subtitle') || "We're here to help you and your pets",
        icon: isObsidian 
          ? (
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-[#E6C97A]/30 bg-[#0d0d0d] shadow-[0_0_15px_rgba(230,201,122,0.15)]">
              <MessageCircle className="w-8 h-8 text-[#E6C97A] filter drop-shadow-[0_0_4px_rgba(230,201,122,0.4)]" />
              <span className="absolute -bottom-1 -right-1 text-xs select-none pointer-events-none filter drop-shadow-[0_0_2px_rgba(230,201,122,0.5)]">💬</span>
            </div>
          )
          : <MessageCircle className="w-8 h-8 text-white" />,
        badgeText: '💬 Reach Out',
        badgeColor: '#f0d080'
      };
    }
    return {
      title: t('about.title') || 'About Us',
      subtitle: t('about.subtitle') || 'Your trusted partner in pet healthcare',
      icon: isObsidian 
        ? (
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-[#E6C97A]/30 bg-[#0d0d0d] shadow-[0_0_15px_rgba(230,201,122,0.15)]">
            <Stethoscope className="w-8 h-8 text-[#E6C97A] filter drop-shadow-[0_0_4px_rgba(230,201,122,0.4)]" />
            <span className="absolute -bottom-1 -right-1 text-xs select-none pointer-events-none filter drop-shadow-[0_0_2px_rgba(230,201,122,0.5)]">🐾</span>
          </div>
        )
        : <span className="text-3xl">🐾</span>,
      badgeText: '🐾 Our Story',
      badgeColor: '#f0d080'
    };
  };

  const header = getHeaderDetails();

  return (
    <div className={`relative min-h-screen overflow-hidden pb-16 transition-all duration-300 ${isObsidian ? 'bg-[#050505]' : ''}`} style={isObsidian ? {} : { background: B.cream }}>
      <PawBackground density="light" />

      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      {isObsidian ? (
        <motion.div
          key={activeTab} // animate header on tab changes
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden py-12 px-6 rounded-[2.5rem] border border-[#E6C97A]/25 bg-gradient-to-b from-[#121212] to-[#0A0A0A] shadow-[0_0_30px_rgba(230,201,122,0.05)] mx-4 md:mx-6 mt-6 mb-8 animate-glow"
        >
          {/* Border light flare overlays */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#E6C97A]/60 to-transparent"></div>
          <div className="absolute bottom-1/4 right-0 w-[1px] h-1/2 bg-gradient-to-b from-transparent via-[#E6C97A]/40 to-transparent"></div>

          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, #E6C97A 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
          />

          <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              {header.icon}
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
              {header.title}
            </h1>
            
            {/* Divider with flare */}
            <div className="h-[2px] w-48 bg-gradient-to-r from-transparent via-[#E6C97A] to-transparent relative mx-auto mb-4">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#fff,0_0_12px_#E6C97A] blur-[0.5px]"></div>
            </div>

            <p className="text-[#E6C97A] text-sm md:text-base font-semibold tracking-wide filter drop-shadow-[0_0_2px_rgba(230,201,122,0.2)]">
              {header.subtitle}
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key={activeTab} // animate header on tab changes
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden py-14 px-6 mb-8 rounded-b-[2.5rem] shadow-xl"
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
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 border border-white/20"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
            >
              {header.icon}
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
              {header.title}
            </h1>
            <div className="h-1 w-20 rounded-full mx-auto mb-3"
              style={{ background: `linear-gradient(to right, ${B.amber}, #e8a020)` }} />
            <p className="text-amber-200 text-base md:text-lg font-medium">
              {header.subtitle}
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Navigation Tabs ───────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 -mt-14 relative z-20 mb-10">
        <div 
          className={`p-1.5 rounded-full shadow-2xl flex flex-row gap-2 border w-full max-w-2xl mx-auto transition-all ${
            isObsidian ? 'bg-[#0B0B0B] border-[#E6C97A]/15' : ''
          }`}
          style={isObsidian ? {} : { 
            backgroundColor: 'rgba(255, 255, 255, 0.85)', 
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(90, 64, 53, 0.1)'
          }}
        >
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-full font-black text-sm transition-all duration-300 ${
              isObsidian
                ? activeTab === 'about'
                  ? 'text-[#E6C97A] border border-[#E6C97A]/40 bg-[#161616] shadow-[0_0_15px_rgba(230,201,122,0.08)]'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
                : activeTab === 'about'
                  ? 'text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={!isObsidian && activeTab === 'about' ? { background: `linear-gradient(135deg, ${B.dark}, ${B.mid})` } : {}}
          >
            {isObsidian ? (
              <Stethoscope className="w-4 h-4 text-[#E6C97A]" />
            ) : (
              <Info className="w-4 h-4" />
            )}
            {t('about.title') || 'About Us'}
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-full font-black text-sm transition-all duration-300 ${
              isObsidian
                ? activeTab === 'contact'
                  ? 'text-[#E6C97A] border border-[#E6C97A]/40 bg-[#161616] shadow-[0_0_15px_rgba(230,201,122,0.08)]'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
                : activeTab === 'contact'
                  ? 'text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={!isObsidian && activeTab === 'contact' ? { background: `linear-gradient(135deg, ${B.dark}, ${B.mid})` } : {}}
          >
            <Phone className={`w-4 h-4 ${isObsidian ? 'text-[#E6C97A]' : ''}`} />
            {t('contact.title') || 'Contact Us'}
          </button>
        </div>
      </div>

      {/* ── Tab Content Panel ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'about' ? (
            <motion.div
              key="about-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="space-y-8"
            >
              {/* ── Stats Grid ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.04, y: -3 }}
                    className={`rounded-2xl p-4 text-center border transition-all duration-300 ${
                      isObsidian ? 'bg-[#0D0D0D] border-[#E6C97A]/15' : ''
                    }`}
                    style={isObsidian ? {
                      boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                    } : {
                      background: 'rgba(237, 228, 216, 0.85)',
                      backdropFilter: 'blur(16px)',
                      borderColor: B.sand,
                      boxShadow: '0 2px 10px rgba(90,64,53,0.08)',
                    }}
                  >
                    <div className="flex justify-center mb-2" style={{ color: isObsidian ? '#E6C97A' : stat.accent }}>
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold mb-0.5" style={{ color: isObsidian ? '#ffffff' : stat.accent }}>
                      {stat.number}
                    </div>
                    <div className="text-xs font-semibold" style={{ color: isObsidian ? '#a3a3a3' : B.light }}>{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* ── Main Content Card ── */}
              <div 
                className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
                  isObsidian ? 'bg-[#0A0A0A] border-[#E6C97A]/15' : ''
                }`}
                style={isObsidian ? {
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                } : { 
                  background: 'rgba(237, 228, 216, 0.85)', 
                  backdropFilter: 'blur(16px)', 
                  borderColor: B.sand, 
                  boxShadow: '0 4px 24px rgba(90,64,53,0.10)' 
                }}
              >
                <div 
                  className="h-1 w-full" 
                  style={{ 
                    background: isObsidian 
                      ? 'linear-gradient(to right, #c8860a, #E6C97A, #c8860a)' 
                      : `linear-gradient(to right, ${B.dark}, ${B.mid}, ${B.amber})` 
                  }} 
                />
                <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8">
                  {/* Image */}
                  <div className="flex-shrink-0 mx-auto md:mx-0">
                    <div className="relative group">
                      <div 
                        className="absolute -inset-1 rounded-2xl blur opacity-60 group-hover:opacity-90 transition duration-300"
                        style={{ 
                          background: isObsidian 
                            ? 'linear-gradient(135deg, #c8860a, #E6C97A)' 
                            : `linear-gradient(135deg, ${B.mid}, ${B.amber})` 
                        }} 
                      />
                      <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-2xl transform transition-all duration-300 group-hover:scale-105 group-hover:rotate-1">
                        <img
                          className="w-full h-full object-cover"
                          src="https://i.ibb.co/6Wzk9nP/DALL-E-2024-11-24-18-06-17-A-cheerful-veterinarian-surrounded-by-various-animals-including-dogs-cats.webp"
                          alt="Veterinarian with animals"
                        />
                      </div>
                      <div 
                        className="absolute -bottom-2 left-2 right-2 h-2 rounded-full blur-sm"
                        style={{ 
                          background: isObsidian 
                            ? 'linear-gradient(to right, rgba(230,201,122,0.3), rgba(230,201,122,0.3))' 
                            : `linear-gradient(to right, ${B.mid}55, ${B.amber}55)` 
                        }} 
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-5">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">👋</span>
                        <h2 className="text-xl md:text-2xl font-bold" style={{ color: isObsidian ? '#ffffff' : B.dark }}>
                          {t('about.welcomeTitle') || 'Welcome to PawVaidya'}
                        </h2>
                      </div>
                      <p className="leading-relaxed font-semibold text-base transition-colors" style={{ color: isObsidian ? '#E6C97A' : B.mid }}>
                        {t('about.welcome') || 'Welcome to PawVaidya, your trusted partner in managing your pets\' healthcare needs...'}
                      </p>
                    </div>

                    <p className="leading-relaxed text-sm transition-colors font-medium" style={{ color: isObsidian ? '#a3a3a3' : B.light }}>
                      {t('about.description') || 'At PawVaidya, we understand the unique challenges pet owners face when it comes to scheduling...'}
                    </p>

                    {/* Vision box */}
                    <div 
                      className={`rounded-xl p-4 border transition-colors ${
                        isObsidian ? 'bg-[#0D0D0D] border-[#E6C97A]/15' : ''
                      }`}
                      style={isObsidian ? {} : { background: B.pale, borderColor: B.sand }}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5"
                          style={{ 
                            background: isObsidian 
                              ? 'linear-gradient(135deg, #c8860a, #E6C97A)' 
                              : `linear-gradient(135deg, ${B.mid}, ${B.amber})` 
                          }}
                        >
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold mb-1" style={{ color: isObsidian ? '#ffffff' : B.dark }}>
                            {t('about.vision') || 'Our Vision'}
                          </h3>
                          <p className="leading-relaxed text-sm transition-colors" style={{ color: isObsidian ? '#a3a3a3' : B.light }}>
                            {t('about.visionText') || 'With PawVaidya, you can manage your pets\' healthcare needs with just a few clicks...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Why Choose Us ── */}
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: isObsidian ? '#ffffff' : B.dark }}>
                    {t('about.whyChoosePrefix') || 'Why Choose'}{' '}
                    <span style={{ 
                      background: isObsidian 
                        ? 'linear-gradient(to right, #E6C97A, #c8860a)' 
                        : `linear-gradient(to right, ${B.mid}, ${B.amber})`, 
                      WebkitBackgroundClip: 'text', 
                      WebkitTextFillColor: 'transparent' 
                    }}>
                      PawVaidya
                    </span>?
                  </h2>
                  <div className="h-1 w-20 rounded-full mx-auto"
                    style={{ background: isObsidian ? 'linear-gradient(to right, #E6C97A, #c8860a)' : `linear-gradient(to right, ${B.mid}, ${B.amber})` }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {features.map((f, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      className={`group rounded-2xl p-5 border transition-all duration-300 ${
                        isObsidian ? 'bg-[#0D0D0D] border-[#E6C97A]/15 hover:border-[#E6C97A]/40' : ''
                      }`}
                      style={isObsidian ? {
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                      } : {
                        background: 'rgba(237, 228, 216, 0.85)',
                        backdropFilter: 'blur(16px)',
                        borderColor: B.sand,
                        boxShadow: '0 2px 10px rgba(90,64,53,0.07)',
                      }}
                    >
                      <div 
                        className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300"
                        style={{ background: isObsidian ? '#121212' : f.iconBg }}
                      >
                        {isObsidian ? (
                          <div className="text-[#E6C97A] filter drop-shadow-[0_0_4px_rgba(230,201,122,0.4)]">
                            {f.icon}
                          </div>
                        ) : (
                          f.icon
                        )}
                      </div>
                      <h3 className="text-lg font-bold mb-2 transition-colors" style={{ color: isObsidian ? '#ffffff' : B.dark }}>{f.title}</h3>
                      <p className="text-sm leading-relaxed transition-colors" style={{ color: isObsidian ? '#a3a3a3' : B.light }}>{f.description}</p>
                      <div className="mt-4 h-1 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                        style={{ background: isObsidian ? 'linear-gradient(to right, #c8860a, #E6C97A)' : `linear-gradient(to right, ${f.accentFrom}, ${f.accentTo})` }} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="contact-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="space-y-8"
            >
              {/* ── Main Contact Card ── */}
              <div 
                className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
                  isObsidian ? 'bg-[#0A0A0A] border-[#E6C97A]/15' : ''
                }`}
                style={isObsidian ? {
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                } : { 
                  background: 'rgba(237, 228, 216, 0.85)', 
                  backdropFilter: 'blur(16px)', 
                  borderColor: B.sand, 
                  boxShadow: '0 4px 24px rgba(90,64,53,0.10)' 
                }}
              >
                <div 
                  className="h-1 w-full" 
                  style={{ 
                    background: isObsidian 
                      ? 'linear-gradient(to right, #c8860a, #E6C97A, #c8860a)' 
                      : `linear-gradient(to right, ${B.dark}, ${B.mid}, ${B.amber})` 
                  }} 
                />
                <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8">
                  {/* Image */}
                  <div className="flex-shrink-0 mx-auto md:mx-0">
                    <div className="relative group">
                      <div 
                        className="absolute -inset-1 rounded-2xl blur opacity-60 group-hover:opacity-90 transition duration-300"
                        style={{ 
                          background: isObsidian 
                            ? 'linear-gradient(135deg, #c8860a, #E6C97A)' 
                            : `linear-gradient(135deg, ${B.mid}, ${B.amber})` 
                        }} 
                      />
                      <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-2xl transform transition-all duration-300 group-hover:scale-105 group-hover:rotate-1">
                        <img
                          className="w-full h-full object-cover"
                          src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop"
                          alt="Veterinary Contact"
                        />
                      </div>
                      <div 
                        className="absolute -bottom-2 left-2 right-2 h-2 rounded-full blur-sm"
                        style={{ 
                          background: isObsidian 
                            ? 'linear-gradient(to right, rgba(230,201,122,0.3), rgba(230,201,122,0.3))' 
                            : `linear-gradient(to right, ${B.mid}55, ${B.amber}55)` 
                        }} 
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-5">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">👋</span>
                        <h2 className="text-xl md:text-2xl font-bold" style={{ color: isObsidian ? '#ffffff' : B.dark }}>
                          {t('contact.letsConnect') || "Let's Connect"}
                        </h2>
                      </div>
                      <p className="leading-relaxed font-semibold transition-colors" style={{ color: isObsidian ? '#E6C97A' : B.mid }}>
                        {t('contact.connectSubtitle') || "Have questions about your pet's health? We're here to help!"}
                      </p>
                    </div>

                    {/* Quick contact chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div 
                        className={`rounded-xl p-3 border flex items-center gap-3 transition-colors ${
                          isObsidian ? 'bg-[#0D0D0D] border-[#E6C97A]/15' : ''
                        }`}
                        style={isObsidian ? {} : { background: B.pale, borderColor: B.sand }}
                      >
                        <div 
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ 
                            background: isObsidian 
                              ? 'linear-gradient(135deg, #c8860a, #E6C97A)' 
                              : `linear-gradient(135deg, ${B.mid}, ${B.light})` 
                          }}
                        >
                          <Phone className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide transition-colors" style={{ color: isObsidian ? '#a3a3a3' : B.light }}>{t('contact.callUs') || 'Call Us'}</div>
                          <div className="text-sm font-bold transition-colors" style={{ color: isObsidian ? '#ffffff' : B.dark }}>{t('contact.phone') || 'Tel: (91) 9999999999'}</div>
                        </div>
                      </div>
                      <div 
                        className={`rounded-xl p-3 border flex items-center gap-3 transition-colors ${
                          isObsidian ? 'bg-[#0D0D0D] border-[#E6C97A]/15' : ''
                        }`}
                        style={isObsidian ? {} : { background: '#fff8e6', borderColor: '#f0d080' }}
                      >
                        <div 
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ 
                            background: isObsidian 
                              ? 'linear-gradient(135deg, #c8860a, #E6C97A)' 
                              : `linear-gradient(135deg, ${B.amber}, #e8a020)` 
                          }}
                        >
                          <Mail className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide transition-colors" style={{ color: isObsidian ? '#E6C97A' : B.amber }}>{t('contact.emailUs') || 'Email Us'}</div>
                          <div className="text-sm font-bold transition-colors" style={{ color: isObsidian ? '#ffffff' : B.dark }}>{t('contact.email') || 'Email: aseth9588@gmail.com'}</div>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/doctors')}
                      className={`w-full font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                        isObsidian ? 'bg-gradient-to-r from-amber-600 to-[#E6C97A] text-black shadow-amber-500/10' : 'text-white'
                      }`}
                      style={isObsidian ? {} : { background: `linear-gradient(135deg, ${B.mid}, ${B.light})` }}
                    >
                      <Calendar className="w-5 h-5" />
                      {t('appointments.bookAppointment') || 'Book Appointment'}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* ── Contact Info Cards ── */}
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 transition-colors" style={{ color: isObsidian ? '#ffffff' : B.dark }}>
                    <span style={{ 
                      background: isObsidian 
                        ? 'linear-gradient(to right, #E6C97A, #c8860a)' 
                        : `linear-gradient(to right, ${B.mid}, ${B.amber})`, 
                      WebkitBackgroundClip: 'text', 
                      WebkitTextFillColor: 'transparent' 
                    }}>
                      {t('contact.otherWaysPrefix') || 'Other Ways'}
                    </span>{' '}{t('contact.otherWaysSuffix') || 'to Reach Us'}
                  </h2>
                  <div className="h-1 w-20 rounded-full mx-auto"
                    style={{ background: isObsidian ? 'linear-gradient(to right, #E6C97A, #c8860a)' : `linear-gradient(to right, ${B.mid}, ${B.amber})` }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {contactInfo.map((info, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      className={`group rounded-2xl p-5 border transition-all duration-300 ${
                        isObsidian ? 'bg-[#0D0D0D] border-[#E6C97A]/15 hover:border-[#E6C97A]/40' : ''
                      }`}
                      style={isObsidian ? {
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                      } : {
                        background: 'rgba(237, 228, 216, 0.85)',
                        backdropFilter: 'blur(16px)',
                        borderColor: B.sand,
                        boxShadow: '0 2px 10px rgba(90,64,53,0.07)',
                      }}
                    >
                      <div 
                        className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300"
                        style={{ background: isObsidian ? '#121212' : info.iconBg }}
                      >
                        {isObsidian ? (
                          <div className="text-[#E6C97A] filter drop-shadow-[0_0_4px_rgba(230,201,122,0.4)]">
                            {info.icon}
                          </div>
                        ) : (
                          info.icon
                        )}
                      </div>
                      <h3 className="text-lg font-bold mb-2 transition-colors" style={{ color: isObsidian ? '#ffffff' : B.dark }}>{info.title}</h3>
                      <p className="text-sm leading-relaxed whitespace-pre-line transition-colors" style={{ color: isObsidian ? '#a3a3a3' : B.light }}>
                        {info.content}
                      </p>
                      <div className="mt-4 h-1 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                        style={{ background: isObsidian ? 'linear-gradient(to right, #c8860a, #E6C97A)' : info.iconBg }} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}