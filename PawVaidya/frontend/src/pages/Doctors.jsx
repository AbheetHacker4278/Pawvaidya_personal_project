import React, { useContext, useEffect, useState, useRef } from 'react';
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
import { MapPin, SlidersHorizontal, ArrowRight, Search } from 'lucide-react';

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
  const { doctors, userLocation, refreshUserLocation, backendurl, isDoctorsLoading } = useContext(AppContext);
  const navigate = useNavigate();

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
    <div className="relative min-h-screen pb-12" style={{ background: B.cream }}>
      <PawBackground density="light" />

      {/* ── Hero Header ───────────────────────────────────────────────────── */}
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
              className="pl-9 pr-4 py-2.5 rounded-xl text-sm font-semibold outline-none cursor-pointer border transition-all"
              style={{
                background: '#fff',
                borderColor: B.sand,
                color: B.dark,
                boxShadow: '0 2px 8px rgba(90,64,53,0.08)',
              }}
              value={location}
              onChange={e => setLocation(e.target.value)}
            >
              <option value="">{t('doctors.selectLocationOption')}</option>
              {[
                { value: 'New Delhi', label: t('locations.newDelhi') },
                { value: 'Madhya Pradesh', label: t('locations.madhyaPradesh') },
                { value: 'Mumbai', label: t('locations.mumbai') },
                { value: 'Chhattisgarh', label: t('locations.chhattisgarh') },
              ].map(loc => (
                <option key={loc.value} value={loc.value}>{loc.label}</option>
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
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-sm font-medium transition-all"
                style={{
                  background: showNearbyOnly ? B.pale : '#fff',
                  borderColor: showNearbyOnly ? B.mid : B.sand,
                  color: B.dark,
                }}>
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
            <p className="text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: B.light }}>
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
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all border"
                  style={isActive
                    ? { background: `linear-gradient(135deg, ${B.mid}, ${B.light})`, color: '#fff', borderColor: 'transparent', boxShadow: `0 4px 14px ${B.mid}44` }
                    : { background: '#fff', color: B.mid, borderColor: B.sand }
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
                    className="rounded-3xl overflow-hidden border"
                    style={{ background: '#fff', borderColor: B.sand }}
                  >
                    <div className="h-56 animate-pulse" style={{ background: `linear-gradient(135deg, ${B.sand}, ${B.cream})` }} />
                    <div className="p-5 space-y-3">
                      <div className="h-5 rounded-lg animate-pulse" style={{ background: B.sand }} />
                      <div className="flex gap-2">
                        <div className="h-5 w-16 rounded-full animate-pulse" style={{ background: B.sand }} />
                        <div className="h-5 w-20 rounded-full animate-pulse" style={{ background: B.sand }} />
                      </div>
                      <div className="h-4 rounded-lg animate-pulse" style={{ background: B.cream }} />
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
                    className="group relative rounded-3xl overflow-hidden cursor-pointer border transition-all duration-300"
                    style={{
                      background: '#fff',
                      borderColor: hoveredCard === index ? B.mid : B.sand,
                      boxShadow: hoveredCard === index
                        ? `0 16px 40px rgba(90,64,53,0.18)`
                        : '0 2px 12px rgba(90,64,53,0.07)',
                    }}
                  >
                    {/* Warm hover overlay */}
                    <motion.div
                      className="absolute inset-0 z-10 pointer-events-none"
                      style={{ background: `linear-gradient(135deg, rgba(90,64,53,0.10), transparent, rgba(200,134,10,0.06))` }}
                      animate={{ opacity: hoveredCard === index ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Image */}
                    <div className="relative h-56 overflow-hidden"
                      style={{ background: `linear-gradient(135deg, #f5ede8, #fdf8f0)` }}>
                      <motion.img
                        className="w-full h-full object-cover"
                        src={item.image}
                        alt={item.name}
                        animate={{ scale: hoveredCard === index ? 1.08 : 1 }}
                        transition={{ duration: 0.5 }}
                      />

                      {/* Availability badge */}
                      <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-lg text-xs font-semibold text-white ${item.available ? '' : ''}`}
                        style={{ background: item.available ? 'rgba(34,197,94,0.90)' : 'rgba(107,114,128,0.90)' }}>
                        <motion.span
                          className="w-2 h-2 rounded-full bg-white"
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
                      <div className="absolute bottom-0 right-0 w-16 h-16 rounded-tl-full"
                        style={{ background: 'rgba(255,255,255,0.25)' }} />
                    </div>

                    {/* Content */}
                    <div className="p-5" style={{ background: `linear-gradient(to bottom, #fff, ${B.pale})` }}>
                      <p className="text-lg font-bold mb-2 transition-colors duration-300"
                        style={{ color: hoveredCard === index ? B.mid : B.dark }}>
                        {item.name}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-2.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: '#f5ede8', color: B.mid, border: `1px solid ${B.sand}` }}>
                          <MapPin className="w-3 h-3" />
                          {item.address?.Location || t('doctors.unknownLocation')}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: '#fff8e6', color: B.amber, border: '1px solid #f0d080' }}>
                          {item.address?.line}
                        </span>
                      </div>

                      <p className="text-sm font-medium mb-3" style={{ color: B.light }}>
                        {translateSpeciality(item.speciality, t)}
                      </p>

                      {/* View profile row */}
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
                    </div>

                    {/* Bottom accent bar */}
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ background: `linear-gradient(to right, ${B.mid}, ${B.amber}, ${B.mid})` }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: hoveredCard === index ? 1 : 0 }}
                      transition={{ duration: 0.35 }}
                    />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-20"
                >
                  <div className="text-5xl mb-4">🐾</div>
                  <p className="text-xl font-bold mb-2" style={{ color: B.dark }}>{t('doctors.noDoctors')}</p>
                  <p className="text-sm" style={{ color: B.light }}>{t('doctors.adjustFilters')}</p>
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
