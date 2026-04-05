import React, { useContext, useEffect, useState, useMemo } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import AppointmentChat from '../../components/AppointmentChat';
import ReportUserModal from '../../components/ReportUserModal';
import PetReportModal from '../../components/PetReportModal';
import {
  MessageCircle, Flag, CheckCircle, XCircle, Search, Calendar,
  Clock, Phone, User, Filter, ChevronDown, Tag, IndianRupee,
  PawPrint, AlertCircle, TrendingUp, Users, Activity, FileText
} from 'lucide-react';

const THEME = {
  primary: '#5A4035',
  accent: '#c8860a',
  light: '#fdf8f0',
  border: '#e8d5b0',
  muted: '#a08060',
};

const StatusBadge = ({ item }) => {
  if (item.cancelled)
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">
        <XCircle className="w-3 h-3" /> Cancelled
      </span>
    );
  if (item.isCompleted)
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3 h-3" /> Completed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <motion.div
    whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.1)' }}
    className="flex items-center gap-4 p-4 rounded-2xl border"
    style={{ background: bg, borderColor: THEME.border }}
  >
    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: color + '22' }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      <p className="text-xs font-medium" style={{ color: THEME.muted }}>{label}</p>
    </div>
  </motion.div>
);

const DoctorAppointments = () => {
  const { dtoken, appointments, getAppointments, cancelAppointment, completeAppointment } = useContext(DoctorContext);
  const { slotDateFormat, calculateAge } = useContext(AppContext);

  const [selectedChat, setSelectedChat] = useState(null);
  const [reportUser, setReportUser] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [confirmAction, setConfirmAction] = useState(null); // { type:'cancel'|'complete', appointmentId, name }
  const [reportAppointment, setReportAppointment] = useState(null);

  useEffect(() => {
    if (dtoken) getAppointments();
  }, [dtoken]);

  // Stats
  const stats = useMemo(() => ({
    total: appointments.length,
    pending: appointments.filter(a => !a.cancelled && !a.isCompleted).length,
    completed: appointments.filter(a => a.isCompleted).length,
    cancelled: appointments.filter(a => a.cancelled).length,
  }), [appointments]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = [...appointments];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.userData.name.toLowerCase().includes(q) ||
        a.slotDate.includes(q) ||
        (a.userData.phone && String(a.userData.phone).includes(q))
      );
    }

    if (statusFilter === 'pending') list = list.filter(a => !a.cancelled && !a.isCompleted);
    else if (statusFilter === 'completed') list = list.filter(a => a.isCompleted);
    else if (statusFilter === 'cancelled') list = list.filter(a => a.cancelled);
    else if (statusFilter === 'discount') list = list.filter(a => a.discountApplied);

    list.sort((a, b) => {
      const [da, ma, ya] = a.slotDate.split('_').map(Number);
      const [db, mb, yb] = b.slotDate.split('_').map(Number);
      const dateA = new Date(ya, ma - 1, da);
      const dateB = new Date(yb, mb - 1, db);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [appointments, search, statusFilter, sortOrder]);

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'complete') completeAppointment(confirmAction.appointmentId);
    if (confirmAction.type === 'cancel') cancelAppointment(confirmAction.appointmentId);
    setConfirmAction(null);
  };

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'discount', label: '🏷️ With Discount' },
  ];

  return (
    <div className="min-h-screen p-6" style={{ background: '#f9f4ec' }}>

      {/* ─── Header ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-black" style={{ color: THEME.primary }}>
          📋 Appointments
        </h1>
        <p className="text-sm mt-1" style={{ color: THEME.muted }}>
          Manage and track all your patient appointments
        </p>
      </motion.div>

      {/* ─── Stats Bar ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <StatCard icon={Activity} label="Total" value={stats.total} color="#5A4035" bg="#fff" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="#c8860a" bg="#fffbf0" />
        <StatCard icon={CheckCircle} label="Completed" value={stats.completed} color="#059669" bg="#f0fdf4" />
        <StatCard icon={XCircle} label="Cancelled" value={stats.cancelled} color="#dc2626" bg="#fef2f2" />
      </motion.div>

      {/* ─── Controls ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-3 mb-6 items-center"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: THEME.muted }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient name, phone…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 text-sm font-medium focus:outline-none transition-colors"
            style={{ borderColor: THEME.border, background: '#fff', color: THEME.primary }}
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: THEME.muted }} />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-xl border-2 text-sm font-semibold focus:outline-none appearance-none cursor-pointer"
            style={{ borderColor: THEME.border, background: '#fff', color: THEME.primary }}
          >
            {filterOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: THEME.muted }} />
        </div>

        {/* Sort */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: THEME.muted }} />
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-xl border-2 text-sm font-semibold focus:outline-none appearance-none cursor-pointer"
            style={{ borderColor: THEME.border, background: '#fff', color: THEME.primary }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: THEME.muted }} />
        </div>

        <span className="text-sm font-semibold px-4 py-2.5 rounded-xl" style={{ background: THEME.border, color: THEME.primary }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </motion.div>

      {/* ─── Appointment Cards ────────────────────────── */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg font-bold" style={{ color: THEME.primary }}>No appointments found</p>
              <p className="text-sm mt-1" style={{ color: THEME.muted }}>Try changing the filter or search query</p>
            </motion.div>
          ) : filtered.map((item, index) => (
            <motion.div
              key={item._id || index}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ y: -3, boxShadow: '0 16px 40px rgba(90,64,53,0.12)' }}
              className="bg-white rounded-2xl border overflow-hidden transition-all"
              style={{ borderColor: item.discountApplied ? '#10b981' : THEME.border }}
            >
              {/* Discount ribbon */}
              {item.discountApplied && (
                <div className="px-5 py-1.5 flex items-center gap-2 text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }}>
                  <Tag className="w-3 h-3" />
                  Discount Applied: {item.discountApplied.code} —{' '}
                  {item.discountApplied.discountType === 'percentage'
                    ? `${item.discountApplied.discountValue}% OFF`
                    : `₹${item.discountApplied.discountValue} OFF`}
                  <span className="ml-auto font-normal opacity-75">
                    Original ₹{item.discountApplied.originalFee} → Final ₹{item.amount}
                  </span>
                </div>
              )}

              <div className="p-5 flex flex-col lg:flex-row gap-5 items-start lg:items-center">

                {/* ── Patient Info ── */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.userData.image}
                      alt={item.userData.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2"
                      style={{ borderColor: THEME.border }}
                    />
                    <span className="absolute -bottom-1 -right-1 text-base">
                      {item.userData.category === 'Dog' ? '🐶'
                        : item.userData.category === 'Cat' ? '🐱'
                          : item.userData.category === 'Bird' ? '🦜'
                            : item.userData.category === 'Rabbit' ? '🐰'
                              : '🐾'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-base truncate" style={{ color: THEME.primary }}>{item.userData.name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="text-xs flex items-center gap-1" style={{ color: THEME.muted }}>
                        <User className="w-3 h-3" /> {calculateAge(item.userData.dob)} yrs
                      </span>
                      <span className="text-xs flex items-center gap-1" style={{ color: THEME.muted }}>
                        <Phone className="w-3 h-3" /> {item.userData.phone}
                      </span>
                      <span className="text-xs flex items-center gap-1" style={{ color: THEME.muted }}>
                        <PawPrint className="w-3 h-3" /> {item.userData.category} · {item.userData.pet_age}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Date / Time ── */}
                <div className="flex flex-col items-start lg:items-center min-w-[120px]">
                  <span className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: THEME.muted }}>Date &amp; Time</span>
                  <span className="font-bold text-sm flex items-center gap-1.5" style={{ color: THEME.primary }}>
                    <Calendar className="w-4 h-4" style={{ color: THEME.accent }} />
                    {slotDateFormat(item.slotDate)}
                  </span>
                  <span className="text-sm flex items-center gap-1.5 mt-0.5" style={{ color: THEME.muted }}>
                    <Clock className="w-3.5 h-3.5" /> {item.slotTime}
                  </span>
                </div>

                {/* ── Fee ── */}
                <div className="flex flex-col items-start lg:items-center min-w-[90px]">
                  <span className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: THEME.muted }}>Fee</span>
                  {item.discountApplied && (
                    <span className="text-xs line-through" style={{ color: THEME.muted }}>₹{item.discountApplied.originalFee}</span>
                  )}
                  <span className="text-lg font-black flex items-center gap-0.5" style={{ color: item.discountApplied ? '#059669' : THEME.primary }}>
                    <IndianRupee className="w-4 h-4" />{item.amount}
                  </span>
                  {item.walletDeduction > 0 && (
                    <span className="text-[10px] font-bold text-amber-600 mt-1">
                      Wallet: -₹{item.walletDeduction}
                    </span>
                  )}
                </div>

                {/* ── Payment ── */}
                <div className="flex flex-col items-start lg:items-center min-w-[80px]">
                  <span className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: THEME.muted }}>Payment</span>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${item.payment ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : (item.paymentMethod === 'Razorpay' ? 'bg-orange-50 text-orange-700 border-orange-200' : (item.paymentMethod === 'Wallet' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-700 border-gray-200'))}`}>
                    {item.payment ? 'Paid Online' : (item.paymentMethod === 'Razorpay' ? 'Unpaid Online' : (item.paymentMethod === 'Wallet' ? 'Paid via Wallet' : 'Cash'))}
                  </span>
                </div>

                {/* ── Status ── */}
                <div className="flex flex-col items-start lg:items-center min-w-[100px]">
                  <span className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: THEME.muted }}>Status</span>
                  <StatusBadge item={item} />
                </div>

                {/* ── Actions ── */}
                <div className="flex gap-2 flex-wrap lg:flex-nowrap items-center flex-shrink-0">
                  {!item.cancelled && !item.isCompleted && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setConfirmAction({ type: 'complete', appointmentId: item._id, name: item.userData.name })}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}
                        title="Mark Complete"
                      >
                        <CheckCircle className="w-4 h-4" /> Complete
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setConfirmAction({ type: 'cancel', appointmentId: item._id, name: item.userData.name })}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)' }}
                        title="Cancel Appointment"
                      >
                        <XCircle className="w-4 h-4" /> Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedChat(item)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#c8860a,#e8a020)' }}
                        title="Chat with Patient"
                      >
                        <MessageCircle className="w-4 h-4" /> Chat
                      </motion.button>
                    </>
                  )}
                  {(item.isCompleted || item.cancelled) && (
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setReportUser(item)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border"
                        style={{ borderColor: '#fca5a5', color: '#dc2626', background: '#fef2f2' }}
                        title="Report User"
                      >
                        <Flag className="w-4 h-4" /> Report
                      </motion.button>

                      {item.isCompleted && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setReportAppointment(item)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-md shadow-emerald-200"
                          style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                          title="Generate Pet Report / Visit Notes"
                        >
                          <FileText className="w-4 h-4" /> Pet Report
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─── Confirm Dialog ──────────────────────────── */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border"
              style={{ borderColor: THEME.border }}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6" style={{ color: confirmAction.type === 'cancel' ? '#dc2626' : '#059669' }} />
                <p className="font-black text-lg" style={{ color: THEME.primary }}>
                  {confirmAction.type === 'cancel' ? 'Cancel Appointment?' : 'Mark as Completed?'}
                </p>
              </div>
              <p className="text-sm mb-6" style={{ color: THEME.muted }}>
                {confirmAction.type === 'cancel'
                  ? `Are you sure you want to cancel the appointment for ${confirmAction.name}? This cannot be undone.`
                  : `Mark appointment for ${confirmAction.name} as completed?`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2.5 rounded-xl border font-semibold text-sm"
                  style={{ borderColor: THEME.border, color: THEME.muted }}
                >
                  Go Back
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{
                    background: confirmAction.type === 'cancel'
                      ? 'linear-gradient(135deg,#dc2626,#ef4444)'
                      : 'linear-gradient(135deg,#059669,#10b981)'
                  }}
                >
                  {confirmAction.type === 'cancel' ? 'Yes, Cancel' : 'Yes, Complete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Modals ──────────────────────────────────── */}
      <AnimatePresence>
        {selectedChat && (
          <AppointmentChat appointment={selectedChat} onClose={() => setSelectedChat(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {reportUser && (
          <ReportUserModal appointment={reportUser} onClose={() => setReportUser(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {reportAppointment && (
          <PetReportModal appointment={reportAppointment} onClose={() => setReportAppointment(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorAppointments;
