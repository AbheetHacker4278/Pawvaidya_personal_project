import React, { useContext, useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios'
import { toast } from 'react-toastify'
import AppointmentChat from '../components/AppointmentChat';
import ReportModal from '../components/ReportModal';
import RatingModal from '../components/RatingModal';
import RunningDogLoader from '../components/RunningDogLoader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, MapPin, Phone, CheckCircle, XCircle,
  MessageCircle, Stethoscope, AlertCircle, Sparkles, Flag,
  ChevronRight, ChevronUp, ChevronDown, Search, PawPrint, Shield, Video
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translateSpeciality } from '../utils/translateSpeciality';

// ─── Brand palette (matches app's brown/beige theme) ─────────────────────────
const BRAND = {
  dark: '#3d2b1f',   // deep espresso
  mid: '#5A4035',   // brand brown
  light: '#7a5a48',   // warm medium brown
  cream: '#f2e4c7',   // page background
  sand: '#e8d5b0',   // slightly darker sand
  amber: '#c8860a',   // warm amber accent
};

const TABS = [
  { key: 'all', label: 'appointments.total' },
  { key: 'upcoming', label: 'appointments.upcoming' },
  { key: 'completed', label: 'appointments.completed' },
  { key: 'cancelled', label: 'appointments.cancelled' },
];

const MyAppointments = () => {
  const { backendurl, token, userdata } = useContext(AppContext)
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedChat, setSelectedChat] = useState(null)
  const [reportAppointment, setReportAppointment] = useState(null)
  const [ratingAppointment, setRatingAppointment] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('clinic') // 'clinic' or 'video'
  const [searchQuery, setSearchQuery] = useState('')

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('_')
    return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
  }

  const parseAppointmentDateTime = (slotDate, slotTime) => {
    const [day, month, year] = slotDate.split('_');
    const [time, period] = slotTime.split(' ');
    let [hours, minutes] = time.split(':');
    if (period === 'PM' && hours !== '12') hours = String(Number(hours) + 12);
    if (period === 'AM' && hours === '12') hours = '00';
    return new Date(year, month - 1, day, hours, minutes);
  }

  const getUserAppointments = async () => {
    try {
      setIsLoading(true)
      const { data } = await axios.get(backendurl + '/api/user/appointments', { headers: { token } })
      if (data.success) {
        const processed = data.appointments.map(appt => {
          const dt = parseAppointmentDateTime(appt.slotDate, appt.slotTime);
          if (dt < currentTime && !appt.cancelled && !appt.isCompleted) {
            cancelAppointment(appt._id);
            return { ...appt, cancelled: true };
          }
          return appt;
        });
        setAppointments(processed.reverse())
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (token) getUserAppointments()
  }, [token, currentTime])

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendurl + '/api/user/cancel-appointment',
        { appointmentId },
        { headers: { token } }
      )
      if (data.success) {
        toast.success('Appointment cancelled.')
        getUserAppointments()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const getTimeStatus = (slotDate, slotTime) => {
    const dt = parseAppointmentDateTime(slotDate, slotTime);
    const diff = dt.getTime() - currentTime.getTime();
    if (diff > 0) {
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h > 24) return `In ${Math.floor(h / 24)}d ${h % 24}h`;
      return `In ${h}h ${m}m`;
    }
    const h = Math.abs(Math.floor(diff / 3600000));
    const m = Math.abs(Math.floor((diff % 3600000) / 60000));
    return `${h}h ${m}m ago`;
  }

  const stats = useMemo(() => ({
    total: appointments.length,
    upcoming: appointments.filter(a => !a.cancelled && !a.isCompleted).length,
    completed: appointments.filter(a => a.isCompleted).length,
    cancelled: appointments.filter(a => a.cancelled).length,
  }), [appointments]);

  const filtered = useMemo(() => {
    let list = appointments;

    if (categoryFilter === 'clinic') list = list.filter(a => !a.isVideo);
    else if (categoryFilter === 'video') list = list.filter(a => a.isVideo);

    if (activeTab === 'upcoming') list = list.filter(a => !a.cancelled && !a.isCompleted);
    if (activeTab === 'completed') list = list.filter(a => a.isCompleted);
    if (activeTab === 'cancelled') list = list.filter(a => a.cancelled);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.docData.name.toLowerCase().includes(q) ||
        a.docData.speciality.toLowerCase().includes(q) ||
        slotDateFormat(a.slotDate).toLowerCase().includes(q)
      );
    }
    return list;
  }, [appointments, activeTab, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ background: BRAND.cream }}>
        <RunningDogLoader />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: BRAND.cream }}>

      {/* ── Hero Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden py-10 px-6 mb-8 rounded-b-[2.5rem] shadow-xl"
        style={{ background: `linear-gradient(135deg, ${BRAND.dark} 0%, ${BRAND.mid} 50%, ${BRAND.light} 100%)` }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full blur-3xl opacity-20"
          style={{ background: BRAND.cream }} />
        <div className="absolute -bottom-8 -right-8 w-64 h-64 rounded-full blur-3xl opacity-15"
          style={{ background: '#c8860a' }} />
        {/* Subtle paw print pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-2.5 rounded-2xl border border-white/20"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{t('appointments.myAppointments')}</h1>
              <p className="text-amber-200 text-sm mt-0.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {userdata?.name ? `${t('appointments.welcomeBack')} ${userdata.name}` : 'Manage your pet care schedule'}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            {[
              { label: t('appointments.total'), value: stats.total, key: 'all', accent: 'rgba(255,255,255,0.15)' },
              { label: t('appointments.upcoming'), value: stats.upcoming, key: 'upcoming', accent: 'rgba(200,134,10,0.35)' },
              { label: t('appointments.completed'), value: stats.completed, key: 'completed', accent: 'rgba(34,197,94,0.25)' },
              { label: t('appointments.cancelled'), value: stats.cancelled, key: 'cancelled', accent: 'rgba(239,68,68,0.25)' },
            ].map(s => (
              <motion.button key={s.label}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(s.key)}
                className={`rounded-2xl p-3 text-center border transition-all ${activeTab === s.key ? 'border-white/40 ring-2 ring-white/30' : 'border-white/10'
                  }`}
                style={{ background: s.accent, backdropFilter: 'blur(8px)' }}
              >
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/70 font-medium">{s.label}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-4">

        {/* ── Category + Search + Tab Bar ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="flex flex-col gap-4 mb-6">

          {/* Category Tabs */}
          <div className="flex p-1 bg-white rounded-2xl border-2 self-start" style={{ borderColor: BRAND.sand }}>
            <button
              onClick={() => setCategoryFilter('clinic')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${categoryFilter === 'clinic' ? 'text-white shadow-lg' : 'text-[#5A4035] hover:bg-amber-50'}`}
              style={{ background: categoryFilter === 'clinic' ? BRAND.mid : 'transparent' }}
            >
              🏥 Clinic Appointments
            </button>
            <button
              onClick={() => setCategoryFilter('video')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${categoryFilter === 'video' ? 'text-white shadow-lg' : 'text-[#5A4035] hover:bg-amber-50'}`}
              style={{ background: categoryFilter === 'video' ? BRAND.mid : 'transparent' }}
            >
              📹 Video Consultations
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.light }} />
              <input
                type="text"
                placeholder={t('appointments.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition"
                style={{
                  background: '#fff',
                  border: `1.5px solid ${BRAND.sand}`,
                  color: BRAND.dark,
                  boxShadow: '0 1px 4px rgba(90,64,53,0.08)',
                }}
              />
            </div>
            {/* Tabs */}
            <div className="flex gap-1 rounded-xl p-1 border"
              style={{ background: '#fff', borderColor: BRAND.sand, boxShadow: '0 1px 4px rgba(90,64,53,0.08)' }}>
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={activeTab === tab.key
                    ? { background: BRAND.mid, color: '#fff' }
                    : { color: BRAND.light }
                  }>
                  {t(tab.label)}
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                    style={activeTab === tab.key
                      ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                      : { background: BRAND.sand, color: BRAND.mid }
                    }>
                    {tab.key === 'all' ? stats.total : tab.key === 'upcoming' ? stats.upcoming : tab.key === 'completed' ? stats.completed : stats.cancelled}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Empty State ──────────────────────────────────────────────────── */}
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-5"
              style={{ background: BRAND.sand }}>
              <Calendar className="w-10 h-10" style={{ color: BRAND.light }} />
            </motion.div>
            <h3 className="text-xl font-bold mb-2" style={{ color: BRAND.dark }}>
              {searchQuery ? t('appointments.noResults') : t('appointments.noAppointmentsHere')}
            </h3>
            <p className="text-sm mb-6" style={{ color: BRAND.light }}>
              {searchQuery ? t('appointments.tryDifferentSearch') : t('appointments.bookFirstAppointment')}
            </p>
            {!searchQuery && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/doctors')}
                className="px-6 py-2.5 text-white rounded-xl text-sm font-semibold shadow-lg transition"
                style={{ background: BRAND.mid }}>
                {t('doctors.findADoctor')}
              </motion.button>
            )}
          </motion.div>
        )}

        {/* ── Appointment Cards ────────────────────────────────────────────── */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, index) => {
              const isUpcoming = !item.cancelled && !item.isCompleted;
              const isCompleted = item.isCompleted;
              const isCancelled = item.cancelled;

              // Status styling in warm palette
              const status = isCancelled
                ? { label: t('appointments.cancelled'), icon: XCircle, barColor: '#ef4444', badgeBg: '#fef2f2', badgeBorder: '#fecaca', badgeText: '#dc2626' }
                : isCompleted
                  ? { label: t('appointments.completed'), icon: CheckCircle, barColor: '#16a34a', badgeBg: '#f0fdf4', badgeBorder: '#bbf7d0', badgeText: '#15803d' }
                  : { label: t('appointments.upcoming'), icon: Clock, barColor: BRAND.amber, badgeBg: '#fffbeb', badgeBorder: '#fde68a', badgeText: BRAND.amber };

              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={item._id || index}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                  whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(90,64,53,0.15)', transition: { duration: 0.2 } }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: '#fff',
                    border: `1.5px solid ${BRAND.sand}`,
                    boxShadow: '0 2px 8px rgba(90,64,53,0.07)',
                  }}
                >
                  {/* Top accent bar */}
                  <div className="h-1 w-full" style={{ background: status.barColor }} />

                  <div className="p-5 md:p-6 flex flex-col sm:flex-row gap-5">
                    {/* Video Banner for Video Consultations */}
                    {item.isVideo && (
                      <div className="absolute top-1 right-1 px-2 py-1 bg-[#5A4035] text-[#F2E4C6] text-[10px] font-bold rounded-bl-xl flex items-center gap-1 shadow-sm">
                        <Video size={10} /> VIDEO CONSULTATION
                      </div>
                    )}
                    {/* ... (rest of doctor image section unchanged) */}
                    {/* Doctor Image */}
                    <div className="relative flex-shrink-0 self-start">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2"
                        style={{ borderColor: BRAND.sand, boxShadow: '0 4px 12px rgba(90,64,53,0.15)' }}>
                        <img src={item.docData.image} alt={item.docData.name}
                          className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md"
                        style={{ background: BRAND.mid }}>
                        <Stethoscope className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div>
                          <h2 className="text-lg font-bold" style={{ color: BRAND.dark }}>Dr. {item.docData.name}</h2>
                          <p className="text-sm font-medium" style={{ color: BRAND.mid }}>{translateSpeciality(item.docData.speciality, t)}</p>
                        </div>
                        {/* Status badge */}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                          style={{ background: status.badgeBg, borderColor: status.badgeBorder, color: status.badgeText }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.barColor }} />
                          {status.label}
                        </span>
                      </div>

                      {/* Info chips */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {/* Date */}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
                          style={{ background: '#fdf8f0', borderColor: '#e8d5b0', color: BRAND.mid }}>
                          <Calendar className="w-3.5 h-3.5" style={{ color: BRAND.amber }} />
                          {slotDateFormat(item.slotDate)}
                        </span>
                        {/* Time */}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
                          style={{ background: '#fdf8f0', borderColor: '#e8d5b0', color: BRAND.mid }}>
                          <Clock className="w-3.5 h-3.5" style={{ color: BRAND.amber }} />
                          {item.slotTime}
                        </span>
                        {/* Countdown */}
                        {isUpcoming && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
                            style={{ background: '#fffbeb', borderColor: '#fde68a', color: BRAND.amber }}>
                            <AlertCircle className="w-3.5 h-3.5" />
                            {getTimeStatus(item.slotDate, item.slotTime)}
                          </span>
                        )}
                        {/* Location */}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
                          style={{ background: '#fdf8f0', borderColor: '#e8d5b0', color: BRAND.mid }}>
                          <MapPin className="w-3.5 h-3.5" style={{ color: BRAND.light }} />
                          {item.docData.address?.Location || 'N/A'}
                        </span>
                        {/* Phone */}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
                          style={{ background: '#fdf8f0', borderColor: '#e8d5b0', color: BRAND.mid }}>
                          <Phone className="w-3.5 h-3.5" style={{ color: BRAND.light }} />
                          +91 {item.docData.docphone}
                        </span>
                      </div>

                      {/* Pet Details (Hidden for Video) */}
                      {!item.isVideo && (
                        <div className="mb-4 p-4 rounded-xl border border-[#e8d5b0] bg-[#fdfaf2]/80 group transition-all hover:bg-[#fdfaf2]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7a5a48] mb-3 flex items-center gap-1.5">
                            <PawPrint className="w-3.5 h-3.5 text-[#c8860a]" /> {t('appointments.selectedPet')}
                          </p>
                          {item.isStray ? (
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5A4035] to-[#3d2b1f] flex items-center justify-center text-white font-bold text-xs shadow-md">
                                🐾
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#3d2b1f] capitalize">{item.strayDetails?.petType || 'Unknown'} (Stray)</p>
                                <p className="text-[11px] text-[#5A4035] italic flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {item.strayDetails?.location || 'Location not specified'}
                                </p>
                              </div>
                            </div>
                          ) : item.petId ? (
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img src={item.petId.image} alt={item.petId.name} className="w-12 h-12 rounded-xl object-cover border-2 border-[#e8d5b0] shadow-md" />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#c8860a] border border-white flex items-center justify-center">
                                  <Sparkles className="w-2 h-2 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-[#3d2b1f] truncate">{item.petId.name}</p>
                                  <span className="text-[10px] bg-[#e8d5b0] text-[#5A4035] px-1.5 py-0.5 rounded-md font-semibold truncate max-w-[80px]">
                                    {item.petId.breed}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#5A4035] mt-1 font-medium">
                                  {item.petId.gender} • {item.petId.age} yrs • ID: <span className="text-[#c8860a] font-bold">{item.petId.petId}</span>
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-dashed border-gray-300">
                              <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                              <p className="text-xs text-gray-500 italic">No pet selection data available</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {isUpcoming && (
                        <div className="flex flex-wrap gap-2">
                          {item.isVideo && !isCancelled && !isCompleted && (
                            <>
                              {item.videoStatus === 'Approved' ? (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  disabled={parseAppointmentDateTime(item.slotDate, item.slotTime).getTime() - 600000 > currentTime.getTime()}
                                  onClick={() => navigate(`/video-call/${item._id}`)}
                                  className={`inline-flex items-center gap-1.5 px-6 py-2 text-white text-xs font-bold rounded-xl shadow-lg transition-all ${parseAppointmentDateTime(item.slotDate, item.slotTime).getTime() - 600000 > currentTime.getTime() ? 'opacity-50 cursor-not-allowed grayscale' : 'bg-gradient-to-r from-[#5A4035] to-[#c8860a]'}`}
                                >
                                  <Video size={14} /> {parseAppointmentDateTime(item.slotDate, item.slotTime).getTime() - 600000 > currentTime.getTime() ? 'Joinable at Scheduled' : 'Join Video Call'}
                                </motion.button>
                              ) : item.videoStatus === 'Pending' ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-[#fdf8f0] border border-[#e8d5b0] rounded-xl text-xs font-bold text-[#c8860a]">
                                  <Clock size={14} /> Video Request Pending Approval
                                </div>
                              ) : null}
                            </>
                          )}

                          {item.isVideo && item.videoStatus === 'Declined' && (
                            <div className="w-full mt-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                              <p className="text-[11px] font-bold text-red-700 uppercase flex items-center gap-1">
                                <XCircle size={12} /> Appointment Declined
                              </p>
                              {item.videoMessage && <p className="text-xs text-red-600 mt-1 italic">"{item.videoMessage}"</p>}
                            </div>
                          )}

                          {item.isVideo && item.videoStatus === 'Rescheduled' && (
                            <div className="w-full mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                              <p className="text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1">
                                <Calendar size={12} /> Reschedule Suggested
                              </p>
                              <p className="text-xs text-amber-800 mt-1">Suggested Slot: <span className="font-bold">{item.rescheduleSlot}</span></p>
                              {item.videoMessage && <p className="text-xs text-amber-600 mt-1 italic">"{item.videoMessage}"</p>}
                            </div>
                          )}
                          {!item.payment && item.paymentMethod !== 'Cash' && (
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                              onClick={() => toast.info('Order recovery for late payment is currently being integrated by Admin.')}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                              style={{ background: BRAND.mid }}>
                              <CheckCircle className="w-3.5 h-3.5" /> {t('appointments.payOnline')}
                            </motion.button>
                          )}

                          {item.walletDeduction > 0 && (
                            <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                              <p className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                                <Shield className="w-3 h-3" /> Wallet Payment: ₹{item.walletDeduction}
                              </p>
                              <p className="text-[10px] font-medium text-amber-600">
                                Remaining {item.paymentMethod === 'Cash' ? 'to pay at clinic' : 'paid online'}: ₹{item.amount}
                              </p>
                            </div>
                          )}

                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedChat(item)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                            style={{ background: '#3b82f6' }}>
                            <MessageCircle className="w-3.5 h-3.5" /> {t('appointments.chat')}
                          </motion.button>

                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              let num = item.docData.docphone.replace(/\s+/g, '');
                              if (!num.startsWith('+91')) num = `+91${num}`;
                              window.open(`https://wa.me/${num}?text=Hi%20Dr.%20${item.docData.name},%20regarding%20my%20appointment%20on%20${slotDateFormat(item.slotDate)}%20at%20${item.slotTime}.`, '_blank');
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                            style={{ background: '#16a34a' }}>
                            <MessageCircle className="w-3.5 h-3.5" /> {t('appointments.whatsapp')}
                          </motion.button>

                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setReportAppointment(item)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                            style={{ background: '#f97316' }}>
                            <Flag className="w-3.5 h-3.5" /> Report
                          </motion.button>

                          {!item.isVideo && (
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                              onClick={() => cancelAppointment(item._id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition"
                              style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </motion.button>
                          )}
                        </div>
                      )}

                      {isCompleted && (
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => navigate('/doctors')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                          style={{ background: BRAND.mid }}>
                          <ChevronRight className="w-3.5 h-3.5" /> Book Again
                        </motion.button>
                      )}

                      {isCompleted && !isCancelled && !item.isRated && (
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => setRatingAppointment(item)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                          style={{ background: BRAND.amber }}>
                          <CheckCircle className="w-3.5 h-3.5" /> {t('appointments.rateDoctor')}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {selectedChat && (
          <AppointmentChat appointment={selectedChat} onClose={() => setSelectedChat(null)} />
        )}
      </AnimatePresence>

      {/* Report Modal */}
      {
        reportAppointment && (
          <ReportModal appointment={reportAppointment} onClose={() => setReportAppointment(null)} />
        )
      }

      {/* Rating Modal */}
      {
        ratingAppointment && (
          <RatingModal
            appointment={ratingAppointment}
            onClose={() => setRatingAppointment(null)}
            onSuccess={getUserAppointments}
            backendurl={backendurl}
            token={token}
          />
        )
      }

      {/* Scroll Buttons */}
      <div className="fixed bottom-6 left-6 flex flex-col gap-3 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="p-3 rounded-full text-white shadow-lg flex items-center justify-center transition-all hover:shadow-xl"
          style={{ background: BRAND.mid }}
          title="Scroll to Top"
        >
          <ChevronUp className="w-6 h-6" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
          className="p-3 rounded-full text-white shadow-lg flex items-center justify-center transition-all hover:shadow-xl"
          style={{ background: BRAND.mid }}
          title="Scroll to Bottom"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.button>
      </div>
    </div >
  )
}

export default MyAppointments
