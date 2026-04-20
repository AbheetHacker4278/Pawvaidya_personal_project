import React, { useContext, useEffect, useState, useMemo } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import AppointmentChat from '../../components/AppointmentChat';
import ReportUserModal from '../../components/ReportUserModal';
import PetReportModal from '../../components/PetReportModal';
import QrScanner from '../../components/QrScanner';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  MessageCircle, Flag, CheckCircle, XCircle, Search, Calendar,
  Clock, Phone, User, Filter, ChevronDown, Tag, IndianRupee,
  PawPrint, AlertCircle, TrendingUp, Users, Activity, FileText, MapPin,
  QrCode, Wallet, ShieldCheck, X
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
  const { dtoken, appointments, getAppointments, cancelAppointment, completeAppointment, backendurl } = useContext(DoctorContext);
  const { slotDateFormat, calculateAge } = useContext(AppContext);

  const [selectedChat, setSelectedChat] = useState(null);
  const [reportUser, setReportUser] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [confirmAction, setConfirmAction] = useState(null);
  const [reportAppointment, setReportAppointment] = useState(null);

  // QR Scanner states
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrResult, setQrResult] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [walletPaymentLoading, setWalletPaymentLoading] = useState(false);
  const [scannedQrToken, setScannedQrToken] = useState('');

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

  // ─── QR Scan Handler ────────────────────────────
  const handleQrScanSuccess = async (qrData) => {
    setShowQrScanner(false);
    setQrLoading(true);
    setScannedQrToken(qrData.qrToken);
    try {
      const { data } = await axios.post(
        backendurl + '/api/doctor/scan-qr',
        { qrToken: qrData.qrToken },
        { headers: { dtoken } }
      );
      if (data.success) {
        setQrResult(data);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.message || 'QR verification failed');
    }
    setQrLoading(false);
  };

  // ─── Process Wallet Payment via QR ──────────────
  const handleWalletPayment = async () => {
    if (!qrResult?.appointment) return;
    setWalletPaymentLoading(true);
    try {
      const { data } = await axios.post(
        backendurl + '/api/doctor/process-qr-wallet-payment',
        {
          qrToken: scannedQrToken,
          appointmentId: qrResult.appointment._id
        },
        { headers: { dtoken } }
      );

      if (data.success) {
        toast.success(data.message);
        setQrResult(null);
        getAppointments();
      } else {
        toast.error(data.message);
        if (data.declined) {
          // Refresh to show updated state
          getAppointments();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Payment processing failed');
    }
    setWalletPaymentLoading(false);
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

        {/* Scan QR Button */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 8px 20px rgba(90,64,53,0.2)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowQrScanner(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #5A4035, #7a5a48)' }}
        >
          <QrCode className="w-4 h-4" /> Scan Pet QR
        </motion.button>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-base truncate" style={{ color: THEME.primary }}>{item.userData.name}</p>
                      {item.userSubscription && item.userSubscription.plan !== 'None' && item.userSubscription.status === 'Active' && (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm ${item.userSubscription.plan === 'Platinum' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          item.userSubscription.plan === 'Gold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                          <ShieldCheck className={`w-3 h-3 ${item.userSubscription.plan === 'Platinum' ? 'text-indigo-500' :
                            item.userSubscription.plan === 'Gold' ? 'text-amber-500' :
                              'text-slate-400'
                            }`} />
                          <span className="uppercase tracking-wider">{item.userSubscription.plan} Member</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="text-xs flex items-center gap-1" style={{ color: THEME.muted }}>
                        <User className="w-3 h-3" /> {calculateAge(item.userData.dob)} yrs
                      </span>
                      <span className="text-xs flex items-center gap-1" style={{ color: THEME.muted }}>
                        <Phone className="w-3 h-3" /> {item.userData.phone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Pet Details ── */}
                <div className="flex-1 min-w-[200px] lg:border-x px-0 lg:px-6 py-2 lg:py-0" style={{ borderColor: THEME.border }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: THEME.muted }}>
                    <PawPrint className="w-3 h-3" /> Selected Pet
                  </p>
                  {item.isStray ? (
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5A4035] to-[#3d2b1f] flex items-center justify-center text-white text-xs shadow-sm">
                        🐾
                      </div>
                      <div>
                        <p className="text-xs font-bold capitalize" style={{ color: THEME.primary }}>{item.strayDetails?.petType || 'Unknown'} (Stray)</p>
                        <p className="text-[10px] italic truncate max-w-[150px]" style={{ color: THEME.muted }}>
                          <MapPin className="w-2.5 h-2.5 inline mr-1" /> {item.strayDetails?.location || 'No location'}
                        </p>
                      </div>
                    </div>
                  ) : item.petId ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <img src={item.petId.image} alt={item.petId.name} className="w-9 h-9 rounded-xl object-cover border shadow-sm" style={{ borderColor: THEME.border }} />
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center shadow-sm">
                          <CheckCircle className="w-2 h-2 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: THEME.primary }}>{item.petId.name}</p>
                        <p className="text-[10px] font-medium tracking-tight" style={{ color: THEME.muted }}>
                          {item.petId.breed} · {item.petId.age}y · <span className="font-bold text-[#c8860a]">{item.petId.petId}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-gray-50 border border-dashed border-gray-200">
                      <AlertCircle className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] text-gray-400 italic">No pet data selection</span>
                    </div>
                  )}
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
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowQrScanner(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-md shadow-[#5A4035]/30"
                        style={{ background: 'linear-gradient(135deg,#5A4035,#7a5a48)' }}
                        title="Scan Pet QR"
                      >
                        <QrCode className="w-4 h-4" /> Scan QR
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

      {/* ─── QR Scanner Modal ──────────────────────────── */}
      <AnimatePresence>
        <QrScanner
          isOpen={showQrScanner}
          onClose={() => setShowQrScanner(false)}
          onScanSuccess={handleQrScanSuccess}
        />
      </AnimatePresence>

      {/* ─── QR Loading ────────────────────────────────── */}
      <AnimatePresence>
        {qrLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
              <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#5A4035', borderTopColor: 'transparent' }}></div>
              <p className="font-bold text-sm" style={{ color: THEME.primary }}>Verifying QR Code...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── QR Verification Result Modal ──────────────── */}
      <AnimatePresence>
        {qrResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setQrResult(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl border max-h-[85vh] overflow-y-auto"
              style={{ borderColor: THEME.border }}
            >
              {/* Verified Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black" style={{ color: THEME.primary }}>Identity Verified ✓</h3>
                <p className="text-xs mt-1" style={{ color: THEME.muted }}>Pet owner identity confirmed via QR scan</p>
              </div>

              {/* Pet Info */}
              <div className="p-4 rounded-2xl mb-4" style={{ background: '#fdf8f0', border: '1px solid ' + THEME.border }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: THEME.muted }}>
                  <PawPrint className="w-3 h-3 inline mr-1" /> Pet Details
                </p>
                <div className="flex items-center gap-3">
                  {qrResult.pet.image && (
                    <img src={qrResult.pet.image} alt="" className="w-12 h-12 rounded-xl object-cover border" style={{ borderColor: THEME.border }} />
                  )}
                  <div>
                    <p className="font-black text-base" style={{ color: THEME.primary }}>{qrResult.pet.name}</p>
                    <p className="text-xs" style={{ color: THEME.muted }}>{qrResult.pet.type} · {qrResult.pet.breed} · {qrResult.pet.age}y · {qrResult.pet.gender}</p>
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div className="p-4 rounded-2xl mb-4" style={{ background: '#fdf8f0', border: '1px solid ' + THEME.border }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: THEME.muted }}>
                  <User className="w-3 h-3 inline mr-1" /> Owner Details
                </p>
                <div className="flex items-center gap-3">
                  {qrResult.owner.image && (
                    <img src={qrResult.owner.image} alt="" className="w-10 h-10 rounded-xl object-cover border" style={{ borderColor: THEME.border }} />
                  )}
                  <div>
                    <p className="font-bold text-sm" style={{ color: THEME.primary }}>{qrResult.owner.name}</p>
                    <p className="text-xs" style={{ color: THEME.muted }}>{qrResult.owner.email}</p>
                    {qrResult.owner.phone && <p className="text-xs" style={{ color: THEME.muted }}>📞 {qrResult.owner.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Active Appointment */}
              {qrResult.appointment ? (
                <div className="p-4 rounded-2xl mb-4" style={{ background: qrResult.appointment.payment ? '#f0fdf4' : '#fffbf0', border: '1px solid ' + (qrResult.appointment.payment ? '#bbf7d0' : '#fde68a') }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: qrResult.appointment.payment ? '#059669' : '#c8860a' }}>
                    <Calendar className="w-3 h-3 inline mr-1" /> Active Appointment
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-bold" style={{ color: THEME.primary }}>{qrResult.appointment.slotDate} at {qrResult.appointment.slotTime}</p>
                    <p className="text-xs" style={{ color: THEME.muted }}>Amount: <span className="font-bold">₹{qrResult.appointment.amount}</span></p>
                    <p className="text-xs" style={{ color: THEME.muted }}>Payment: <span className="font-bold">{qrResult.appointment.payment ? 'Paid' : 'Pending'}</span> ({qrResult.appointment.paymentMethod || 'Cash'})</p>
                  </div>

                  {/* Wallet Payment Button */}
                  {!qrResult.appointment.payment && !qrResult.appointment.isStray && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleWalletPayment}
                      disabled={walletPaymentLoading}
                      className="w-full mt-4 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #c8860a, #e8a020)' }}
                    >
                      {walletPaymentLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4" /> Pay ₹{qrResult.appointment.amount} via Paw Wallet
                        </>
                      )}
                    </motion.button>
                  )}

                  {qrResult.appointment.isStray && !qrResult.appointment.payment && (
                    <div className="mt-3 p-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
                      <p className="text-xs font-bold text-amber-700">🚫 Wallet payments unavailable for stray appointments</p>
                    </div>
                  )}

                  {qrResult.appointment.payment && (
                    <div className="mt-3 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <p className="text-xs font-bold text-emerald-700">✅ This appointment is already paid</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl mb-4 bg-gray-50 border border-dashed border-gray-200 text-center">
                  <p className="text-sm text-gray-500">No active appointment found with you</p>
                </div>
              )}

              {/* Close */}
              <button
                onClick={() => setQrResult(null)}
                className="w-full py-2.5 rounded-xl border font-semibold text-sm"
                style={{ borderColor: THEME.border, color: THEME.muted }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorAppointments;
