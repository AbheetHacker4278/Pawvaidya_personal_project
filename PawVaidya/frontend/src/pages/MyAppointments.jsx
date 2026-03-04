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
  ChevronRight, ChevronUp, ChevronDown, Search
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

        {/* ── Search + Tab Bar ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3 mb-6">
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

                      {/* Action Buttons */}
                      {isUpcoming && (
                        <div className="flex flex-wrap gap-2">
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                            style={{ background: BRAND.mid }}>
                            <CheckCircle className="w-3.5 h-3.5" /> {t('appointments.payOnline')}
                          </motion.button>

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

                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => cancelAppointment(item._id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition"
                            style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </motion.button>
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
      {reportAppointment && (
        <ReportModal appointment={reportAppointment} onClose={() => setReportAppointment(null)} />
      )}

      {/* Rating Modal */}
      {ratingAppointment && (
        <RatingModal
          appointment={ratingAppointment}
          onClose={() => setRatingAppointment(null)}
          onSuccess={getUserAppointments}
          backendurl={backendurl}
          token={token}
        />
      )}

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
    </div>
  )
}

export default MyAppointments
