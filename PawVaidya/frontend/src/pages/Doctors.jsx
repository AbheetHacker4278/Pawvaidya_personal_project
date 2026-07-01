import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { translateSpeciality } from '../utils/translateSpeciality';
import { motion, AnimatePresence } from 'framer-motion';
import { useAITranslation } from '../context/TranslationContext';
import { filterDoctorsByDistance, formatDistance } from '../utils/geolocation';
import LocationRefreshButton from '../components/LocationRefreshButton';
import PawBackground from '../components/PawBackground';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MapPin, SlidersHorizontal, ArrowRight, Search, HeartPulse } from 'lucide-react';

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

const SPECIALITIES = [
  { key: 'Marine vet', labelKey: 'doctorSpecialities.marineVet', icon: '🐟' },
  { key: 'smallAnimalVet', labelKey: 'doctorSpecialities.smallAnimalVet', icon: '🐹' },
  { key: 'Large animal vet', labelKey: 'doctorSpecialities.largeAnimalVet', icon: '🐄' },
  { key: 'Military vet', labelKey: 'doctorSpecialities.militaryVet', icon: '🦅' },
];

export const Doctors = () => {
  const { t, i18n } = useTranslation();
  const { speciality } = useParams();
  const [filterDoc, setFilterDoc] = useState([]);
  const [showfilter, setshowfilter] = useState(false);
  const [location, setLocation] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [nearbyDoctors, setNearbyDoctors] = useState([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState(null);
  const { translateText, translateBatch } = useAITranslation();
  const { doctors, userLocation, refreshUserLocation, backendurl, isDoctorsLoading, userdata } = useContext(AppContext);
  const navigate = useNavigate();

  const isObsidian = userdata?.subscription?.plan === 'Obsidian';

  const filterNearbyDoctors = () => {
    if (!userLocation) return [];
    return filterDoctorsByDistance(doctors, userLocation.latitude, userLocation.longitude, 5);
  };

  const fetchNearbyDoctorsFromAPI = async () => {
    if (!userLocation) return;
    setIsLoadingNearby(true);
    setNearbyError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to use nearby doctors feature');
        setNearbyError('Please login to use nearby doctors feature');
        return;
      }
      const response = await axios.post(
        `${backendurl}/api/user/nearby-doctors`,
        { latitude: userLocation.latitude, longitude: userLocation.longitude, maxDistance: 5 },
        { headers: { token } }
      );
      if (response.data.success) {
        setNearbyDoctors(response.data.doctors);
        if (response.data.doctors.length === 0) toast.info('No doctors found within 5km radius');
      } else {
        toast.error('Failed to fetch nearby doctors');
        setNearbyError('Failed to fetch nearby doctors');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error fetching nearby doctors';
      toast.error(errorMessage);
      setNearbyError(errorMessage);
    } finally {
      setIsLoadingNearby(false);
    }
  };

  const applyFilter = () => {
    let filtered = doctors;
    if (showNearbyOnly && userLocation) {
      filtered = nearbyDoctors.length > 0 ? nearbyDoctors : filterNearbyDoctors();
    }
    if (speciality) filtered = filtered.filter(doc => doc.speciality.toLowerCase() === speciality.toLowerCase());
    if (location) filtered = filtered.filter(doc => doc.address?.Location.toLowerCase() === location.toLowerCase());

    // Auto-translate filtered doctors if not in English
    const translateFiltered = async (data) => {
      if (i18n.language === 'en' || data.length === 0) {
        setFilterDoc(data);
        return;
      }

      try {
        const names = data.map(d => d.name);
        const locations = data.map(d => d.address?.Location || '');
        const lines = data.map(d => d.address?.line || '');

        const [tNames, tLocations, tLines] = await Promise.all([
          translateBatch(names),
          translateBatch(locations),
          translateBatch(lines)
        ]);

        const translatedData = data.map((doc, i) => ({
          ...doc,
          name: tNames[i],
          address: {
            ...doc.address,
            Location: tLocations[i],
            line: tLines[i]
          }
        }));
        setFilterDoc(translatedData);
      } catch (error) {
        console.error('Doctor translation error:', error);
        setFilterDoc(data);
      }
    };

    translateFiltered(filtered);
  };

  useEffect(() => { applyFilter(); }, [speciality, location, showNearbyOnly, userLocation, doctors, isDoctorsLoading]);
  useEffect(() => {
    if (!isDoctorsLoading) {
      setIsLoading(false);
    }
  }, [isDoctorsLoading]);
  useEffect(() => {
    if (showNearbyOnly && userLocation) fetchNearbyDoctorsFromAPI();
  }, [showNearbyOnly, userLocation]);

  return (
    <div className={`relative min-h-screen pb-12 transition-all duration-300 ${isObsidian ? 'bg-[#050505]' : ''}`} style={isObsidian ? {} : { background: B.cream }}>
      <PawBackground density="light" />

      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      {isObsidian ? (
        <motion.div
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
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 border border-[#E6C97A]/30 bg-[#0d0d0d] shadow-[0_0_15px_rgba(230,201,122,0.15)]"
            >
              <span className="text-2xl filter drop-shadow-[0_0_5px_rgba(230,201,122,0.5)]">🐾</span>
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2 tracking-tight">
              {t('doctors.browseSpeciality')}
            </h1>
            
            {/* Divider with flare */}
            <div className="h-[2px] w-48 bg-gradient-to-r from-transparent via-[#E6C97A] to-transparent relative mx-auto mb-4">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#fff,0_0_12px_#E6C97A] blur-[0.5px]"></div>
            </div>

            <p className="text-[#E6C97A] text-xs md:text-sm font-semibold tracking-wide filter drop-shadow-[0_0_2px_rgba(230,201,122,0.2)]">
              {filterDoc.length} {t('doctors.availableVets')} · {t('doctors.findSpecialist')}
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden py-10 px-6 mb-8 rounded-b-[2.5rem] shadow-xl"
          style={{ background: `linear-gradient(135deg, ${B.dark} 0%, ${B.mid} 55%, ${B.light} 100%)` }}
        >
          <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full blur-3xl opacity-15" style={{ background: B.cream }} />
          <div className="absolute -bottom-8 -right-8 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ background: B.amber }} />
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 border border-white/20"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
            >
              <span className="text-2xl">🩺</span>
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
              {t('doctors.browseSpeciality')}
            </h1>
            <div className="h-1 w-20 rounded-full mx-auto mb-3"
              style={{ background: `linear-gradient(to right, ${B.amber}, #e8a020)` }} />
            <p className="text-amber-200 text-sm md:text-base">
              {filterDoc.length} {t('doctors.availableVets')} · {t('doctors.findSpecialist')}
            </p>
          </div>
        </motion.div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4">

        {/* ── Controls bar ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6"
        >
          {/* Location select */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: B.amber }} />
            <select
              className={`pl-9 pr-4 py-2.5 rounded-xl text-sm font-semibold outline-none cursor-pointer border transition-all ${isObsidian ? 'text-white' : ''}`}
              style={isObsidian ? {
                background: '#0D0D0D',
                borderColor: 'rgba(230,201,122,0.25)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              } : {
                background: '#fff',
                borderColor: B.sand,
                color: B.dark,
                boxShadow: '0 2px 8px rgba(90,64,53,0.08)',
              }}
              value={location}
              onChange={e => setLocation(e.target.value)}
            >
              <option value="" style={{ background: isObsidian ? '#0D0D0D' : '#fff' }}>{t('doctors.selectLocationOption')}</option>
              {[
                { value: 'New Delhi', label: t('locations.newDelhi') },
                { value: 'Madhya Pradesh', label: t('locations.madhyaPradesh') },
                { value: 'Mumbai', label: t('locations.mumbai') },
                { value: 'Chhattisgarh', label: t('locations.chhattisgarh') },
              ].map(loc => (
                <option key={loc.value} value={loc.value} style={{ background: isObsidian ? '#0D0D0D' : '#fff' }}>{loc.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* Location refresh */}
            <LocationRefreshButton
              variant="button"
              size="md"
              onLocationUpdate={refreshUserLocation}
              location={userLocation}
            />

            {/* Nearby toggle */}
            {userLocation && (
              <label 
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-sm font-medium transition-all ${
                  isObsidian ? 'text-white' : ''
                }`}
                style={isObsidian ? {
                  background: showNearbyOnly ? 'rgba(230,201,122,0.05)' : '#0D0D0D',
                  borderColor: 'rgba(230,201,122,0.25)'
                } : {
                  background: showNearbyOnly ? B.pale : '#fff',
                  borderColor: showNearbyOnly ? B.mid : B.sand,
                  color: B.dark,
                }}
              >
                <input
                  type="checkbox"
                  checked={showNearbyOnly}
                  onChange={e => setShowNearbyOnly(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-600"
                />
                <MapPin className="w-3.5 h-3.5" style={{ color: B.amber }} />
                {t('doctors.nearbyOnly')}
              </label>
            )}

            {/* Mobile filter toggle */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="sm:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all"
              style={showfilter
                ? { background: `linear-gradient(135deg, ${B.mid}, ${B.light})`, color: '#fff', borderColor: 'transparent' }
                : { background: '#fff', color: B.mid, borderColor: B.sand }
              }
              onClick={() => setshowfilter(p => !p)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t('doctors.filters')}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Main layout: sidebar + grid ───────────────────────────────── */}
        <div className={`flex flex-col sm:flex-row gap-6 ${showfilter ? 'flex' : 'hidden sm:flex'}`}>

          {/* Speciality sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col gap-2.5 sm:min-w-[220px]"
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-1 px-1 transition-colors" style={{ color: isObsidian ? '#E6C97A' : B.light }}>
              {t('doctors.specialitySidebar')}
            </p>
            {SPECIALITIES.map((sp, i) => {
              const isActive = speciality === sp.key;
              return (
                <motion.button
                  key={sp.key}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => isActive ? navigate('/doctors') : navigate(`/doctors/${sp.key}`)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all border ${
                    isObsidian
                      ? isActive
                        ? 'bg-gradient-to-r from-amber-600 to-[#E6C97A] text-black border-transparent font-extrabold shadow-lg shadow-amber-500/10'
                        : 'bg-[#0D0D0D] text-neutral-400 border-[#E6C97A]/15 hover:text-white hover:border-[#E6C97A]/35'
                      : ''
                  }`}
                  style={isActive
                    ? (isObsidian 
                      ? {} 
                      : { background: `linear-gradient(135deg, ${B.mid}, ${B.light})`, color: '#fff', borderColor: 'transparent', boxShadow: `0 4px 14px ${B.mid}44` })
                    : (isObsidian 
                      ? {} 
                      : { background: '#fff', color: B.mid, borderColor: B.sand })
                  }
                >
                  <span className="text-base">{sp.icon}</span>
                  {t(sp.labelKey)}
                  {isActive && <ArrowRight className="w-3.5 h-3.5 ml-auto" />}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Doctor cards grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="wait">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={`sk-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`rounded-3xl overflow-hidden border ${isObsidian ? 'bg-[#0D0D0D] border-[#E6C97A]/15' : ''}`}
                    style={isObsidian ? {} : { background: '#fff', borderColor: B.sand }}
                  >
                    <div className="h-56 animate-pulse" style={{ background: isObsidian ? 'rgba(230,201,122,0.05)' : `linear-gradient(135deg, ${B.sand}, ${B.cream})` }} />
                    <div className="p-5 space-y-3">
                      <div className="h-5 rounded-lg animate-pulse" style={{ background: isObsidian ? 'rgba(230,201,122,0.1)' : B.sand }} />
                      <div className="flex gap-2">
                        <div className="h-5 w-16 rounded-full animate-pulse" style={{ background: isObsidian ? 'rgba(230,201,122,0.08)' : B.sand }} />
                        <div className="h-5 w-20 rounded-full animate-pulse" style={{ background: isObsidian ? 'rgba(230,201,122,0.08)' : B.sand }} />
                      </div>
                      <div className="h-4 rounded-lg animate-pulse" style={{ background: isObsidian ? 'rgba(230,201,122,0.05)' : B.cream }} />
                    </div>
                  </motion.div>
                ))
              ) : filterDoc.length > 0 ? (
                filterDoc.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100, delay: index * 0.07 }}
                    whileHover={{ y: -8, transition: { duration: 0.25 } }}
                    whileTap={{ scale: 0.97 }}
                    onHoverStart={() => setHoveredCard(index)}
                    onHoverEnd={() => setHoveredCard(null)}
                    onClick={() => navigate(`/appointment/${item._id}`)}
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
                      background: '#fff',
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

                    {/* Image */}
                    <div className="relative h-56 overflow-hidden"
                      style={isObsidian ? {
                        background: 'radial-gradient(circle, rgba(230,201,122,0.15) 0%, rgba(10,10,10,1) 85%)'
                      } : { 
                        background: `linear-gradient(135deg, #f5ede8, #fdf8f0)` 
                      }}>
                      {isObsidian && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-7xl select-none pointer-events-none opacity-[0.03] text-[#E6C97A]">
                          🐾
                        </div>
                      )}

                      <motion.img
                        className="w-full h-full object-cover"
                        src={item.image}
                        alt={item.name}
                        animate={{ scale: hoveredCard === index ? 1.08 : 1 }}
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
                        style={isObsidian ? {} : { background: item.available ? 'rgba(34,197,94,0.90)' : 'rgba(107,114,128,0.90)' }}
                      >
                        <motion.span
                          className={`w-1.5 h-1.5 rounded-full ${isObsidian ? (item.available ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-neutral-500') : 'bg-white'}`}
                          animate={item.available ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
                          transition={{ duration: 1.8, repeat: Infinity }}
                        />
                        {item.available ? t('common.available') : t('common.notAvailable')}
                      </div>

                      {/* Distance badge */}
                      {showNearbyOnly && userLocation && item.distance !== undefined && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                          style={{ background: `${B.amber}ee`, color: '#fff' }}>
                          <MapPin className="w-3 h-3" />
                          {formatDistance(item.distance)}
                        </div>
                      )}

                      {/* Corner accent */}
                      {!isObsidian && (
                        <div className="absolute bottom-0 right-0 w-16 h-16 rounded-tl-full"
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
                    <div className="p-5" style={isObsidian ? {} : { background: `linear-gradient(to bottom, #fff, ${B.pale})` }}>
                      <p className="text-lg font-bold mb-2 transition-colors duration-300"
                        style={{ color: isObsidian ? '#ffffff' : (hoveredCard === index ? B.mid : B.dark) }}>
                        {item.name}
                      </p>

                      {/* Location badges */}
                      <div className="flex flex-wrap gap-2 mb-2.5">
                        {isObsidian ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border border-[#E6C97A]/30 text-[#E6C97A] bg-[#0A0A0A]">
                              <MapPin className="w-3.5 h-3.5 text-[#E6C97A]" />
                              {item.address?.Location || t('doctors.unknownLocation')}
                            </span>
                            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-extrabold text-black bg-gradient-to-r from-amber-600 to-[#E6C97A]">
                              {item.address?.line}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: '#f5ede8', color: B.mid, border: `1px solid ${B.sand}` }}>
                              <MapPin className="w-3 h-3" />
                              {item.address?.Location || t('doctors.unknownLocation')}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
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
                        <p className="text-sm font-medium mb-3" style={{ color: B.light }}>
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
                          className="pt-3 border-t flex items-center justify-between"
                          style={{ borderColor: B.sand }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: hoveredCard === index ? 1 : 0.4 }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className="text-sm font-semibold" style={{ color: B.mid }}>{t('doctors.viewProfile')}</span>
                          <motion.div
                            animate={{ x: hoveredCard === index ? 4 : 0 }}
                            transition={{ duration: 0.25 }}
                          >
                            <ArrowRight className="w-4 h-4" style={{ color: B.amber }} />
                          </motion.div>
                        </motion.div>
                      )}
                    </div>

                    {/* Bottom accent bar */}
                    {!isObsidian && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-1"
                        style={{ background: `linear-gradient(to right, ${B.mid}, ${B.amber}, ${B.mid})` }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: hoveredCard === index ? 1 : 0 }}
                        transition={{ duration: 0.35 }}
                      />
                    )}
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`col-span-full text-center py-20 ${isObsidian ? 'text-white' : ''}`}
                >
                  <div className={`text-5xl mb-4 ${isObsidian ? 'filter drop-shadow-[0_0_8px_rgba(230,201,122,0.4)]' : ''}`}>🐾</div>
                  <p className="text-xl font-bold mb-2" style={isObsidian ? {} : { color: B.dark }}>{t('doctors.noDoctors')}</p>
                  <p className="text-sm" style={{ color: isObsidian ? '#a3a3a3' : B.light }}>{t('doctors.adjustFilters')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Doctors;
