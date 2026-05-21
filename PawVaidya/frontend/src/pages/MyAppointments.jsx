import React, { useContext, useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios'
import io from 'socket.io-client';
import { toast } from 'react-toastify'
import AppointmentChat from '../components/AppointmentChat';
import ReportModal from '../components/ReportModal';
import RatingModal from '../components/RatingModal';
import RunningDogLoader from '../components/RunningDogLoader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, MapPin, Phone, CheckCircle, XCircle,
  MessageCircle, Stethoscope, AlertCircle, Sparkles, Flag,
  ChevronRight, ChevronUp, ChevronDown, Search, PawPrint, Shield, Video,
  Upload, Heart, Info, CreditCard, Plus, Loader2, Check, Activity, FileText, AlertTriangle, Coins
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

// ─── Real-Time Emergency Countdown Timer Subcomponent ────────────────────────
const EmergencyTimer = ({ createdAt, onTimeout }) => {
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(createdAt).getTime();
      const now = Date.now();
      const diffSeconds = Math.floor((now - start) / 1000);
      const remaining = 300 - diffSeconds;
      if (remaining <= 0) {
        setTimeLeft(0);
        if (onTimeout) onTimeout();
      } else {
        setTimeLeft(remaining);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [createdAt, onTimeout]);

  if (timeLeft <= 0) {
    return <span className="text-red-600 font-extrabold text-sm px-3 py-1 bg-red-50 border border-red-200 rounded-lg shadow-inner animate-pulse">Window Expired</span>;
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  return (
    <span className="font-mono text-lg tracking-wider text-red-600 font-extrabold bg-red-50 px-3 py-1 rounded-lg border border-red-200 shadow-inner flex items-center gap-1.5 animate-pulse">
      <Clock className="w-4 h-4 text-red-600 animate-spin" style={{ animationDuration: '4s' }} /> {mins}:{secs < 10 ? '0' : ''}{secs}
    </span>
  );
};

// ─── Due Deadline Countdown Timer Component ─────────────────────────────
const DueTimer = ({ dueDate }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const dueTime = new Date(dueDate).getTime();
      const now = Date.now();
      const diff = dueTime - now;

      if (diff <= 0) {
        setTimeLeft('Expired (Account Restricted)');
        setIsUrgent(true);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days === 0 && hours < 24) {
        setIsUrgent(true);
      } else {
        setIsUrgent(false);
      }

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [dueDate]);

  return (
    <span className={`font-mono text-[11px] font-bold px-2.5 py-1 rounded-full ${
      isUrgent 
        ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse' 
        : 'bg-amber-50 text-amber-700 border border-amber-200'
    }`}>
      {timeLeft}
    </span>
  );
};

const isNearingExpiry = (dueDate) => {
  const diff = new Date(dueDate).getTime() - Date.now();
  return diff > 0 && diff < 24 * 60 * 60 * 1000; // less than 24 hours
};

// ─── Interactive Emergency Channel Subcomponent ─────────────────────────────
const EmergencyBookingView = ({
  userdata,
  BRAND,
  userPets,
  emergencyRequests,
  isBookingEmergency,
  handleBookEmergency,
  selectedPet,
  setSelectedPet,
  isStray,
  setIsStray,
  strayPetType,
  setStrayPetType,
  strayLocation,
  setStrayLocation,
  strayDescription,
  setStrayDescription,
  emergencyType,
  setEmergencyType,
  preferredMode,
  setPreferredMode,
  emergencyDescription,
  setEmergencyDescription,
  reportFile,
  setReportFile,
  stateInput,
  setStateInput,
  districtInput,
  setDistrictInput,
  handleFileChange,
  cancelEmergencyRequest,
  setSelectedChat,
  fetchEmergencyRequests,
  userDues = [],
  isFetchingDues = false,
  handleRepayDue,
  isPayingDue = null,
  isOnline = true,
  fetchError = null,
  isFetchingEmergencies = false
}) => {
  const navigate = useNavigate();
  const hasActiveEmergency = emergencyRequests.some(r => ['Pending', 'Waiting for Doctor Approval', 'Payment Pending'].includes(r.status));
  const activeEmergency = emergencyRequests.find(r => ['Pending', 'Waiting for Doctor Approval', 'Payment Pending'].includes(r.status));

  // ─── Status Steps configuration
  const steps = [
    { label: "Searching Vets", desc: "Locating doctors...", icon: Search },
    { label: "Vet Response", desc: "Awaiting response...", icon: Clock },
    { label: "Approved & Pay", desc: "Doctor locked-in!", icon: Shield },
    { label: "Consultation", desc: "Live consultation", icon: Activity },
    { label: "Completed", desc: "Case completed", icon: CheckCircle }
  ];

  let currentStepIdx = 0;
  if (activeEmergency) {
    if (activeEmergency.status === 'Pending') {
      currentStepIdx = 0;
    } else if (activeEmergency.status === 'Waiting for Doctor Approval') {
      currentStepIdx = 1;
    } else if (activeEmergency.status === 'Payment Pending') {
      currentStepIdx = 2;
    } else if (['Approved', 'Active'].includes(activeEmergency.status)) {
      currentStepIdx = 3;
    } else if (activeEmergency.status === 'Completed') {
      currentStepIdx = 4;
    }
  }

  const [showHistory, setShowHistory] = useState(false);

  // 1. SKELETON LOADER STATE
  if (isFetchingEmergencies && emergencyRequests.length === 0) {
    return (
      <div className="space-y-6">
        <div className="p-6 md:p-8 rounded-3xl bg-white border border-[#e8d5b0] shadow-sm animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/3"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-20 bg-slate-100 rounded-2xl w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="h-4 bg-slate-200 rounded w-4/6"></div>
          </div>
        </div>
        <div className="p-6 md:p-8 rounded-3xl bg-white border border-[#e8d5b0] shadow-sm animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/5"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
            <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ERROR STATE WITH RETRY
  if (fetchError) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-[#e8d5b0] text-center space-y-5 shadow-sm max-w-xl mx-auto my-12">
        <div className="inline-flex p-4 bg-rose-50 border border-rose-100 rounded-full text-rose-500 animate-pulse">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-base font-extrabold text-[#3d2b1f]">Could Not Sync Desk</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {fetchError}. Please verify your network connection or click retry below.
        </p>
        <button
          type="button"
          onClick={fetchEmergencyRequests}
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md active:scale-95"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── OFFLINE STATUS BANNER ───────────────────────────────────────── */}
      {!isOnline && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-3"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <div>
            <strong className="font-extrabold">Offline Mode Active.</strong> We have paused real-time tracking queues. Your current changes will sync automatically once connection returns.
          </div>
          <button 
            type="button" 
            onClick={fetchEmergencyRequests} 
            className="ml-auto px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
          >
            Force Sync
          </button>
        </motion.div>
      )}

      {/* ── CRITICAL EXPIRY REMINDER BANNERS ────────────────────────────── */}
      {userDues.some(due => !due.isPaid && isNearingExpiry(due.dueDate)) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-3xl bg-gradient-to-r from-red-500 to-amber-600 text-white shadow-lg border border-red-400 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
          <div className="flex items-center gap-3 relative z-10">
            <span className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-white animate-bounce" />
            </span>
            <div>
              <h4 className="font-extrabold text-sm tracking-wide uppercase">Critical Payment Warning!</h4>
              <p className="text-xs text-amber-50 font-semibold mt-0.5">
                An unpaid emergency fee of ₹100 is nearing expiration. Repay within the 4-day grace window to prevent temporary account restriction.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => {
              const pendingDue = userDues.find(due => !due.isPaid && isNearingExpiry(due.dueDate));
              if (pendingDue) handleRepayDue(pendingDue._id);
            }}
            disabled={isPayingDue !== null}
            className="px-5 py-2 rounded-xl bg-white text-red-700 text-xs font-extrabold shadow hover:bg-amber-50 transition shrink-0 relative z-10 disabled:opacity-50"
          >
            {isPayingDue ? 'Processing...' : 'Settle Instantly'}
          </button>
        </motion.div>
      )}

      {/* ── PENDING EMERGENCY DUES SECTION ──────────────────────────────── */}
      {userDues.some(due => !due.isPaid) && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-white border border-[#e8d5b0] shadow-md space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#e8d5b0]/60 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#3d2b1f] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#c8860a]" /> Pending Emergency Dues & Billing
              </h3>
              <p className="text-[10px] text-[#7a5a48] font-semibold mt-0.5">
                Outstanding dues must be cleared within 4 days of the consultation to keep your account active.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                {userDues.filter(d => !d.isPaid).length} Unpaid Dues
              </span>
            </div>
          </div>

          {/* Dues Cards Grid */}
          <div className="space-y-4">
            {userDues.filter(due => !due.isPaid).map((due) => {
              const isCritical = isNearingExpiry(due.dueDate);
              const walletBalance = userdata?.pawWallet || 0;
              const canAfford = walletBalance >= due.amountDue;

              return (
                <div 
                  key={due._id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isCritical
                      ? 'bg-red-50/20 border-red-200 shadow-md ring-1 ring-red-100 animate-pulse-subtle'
                      : 'bg-[#fffcf7] border-[#e8d5b0]'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-xl border flex items-center justify-center ${
                      isCritical
                        ? 'bg-red-100/40 border-red-200 text-red-600'
                        : 'bg-amber-100/40 border-amber-200 text-[#c8860a]'
                    }`}>
                      <Coins className="w-5 h-5" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isCritical 
                            ? 'bg-red-50 border-red-200 text-red-700 animate-pulse' 
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          <Clock className="w-3 h-3" /> Repayment Due
                        </span>
                        
                        <span className="text-[10px] text-[#7a5a48] font-semibold">
                          Created {new Date(due.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-sm font-extrabold text-[#3d2b1f] flex items-center gap-1.5">
                        Emergency Consultation Dues
                        <span className="text-xs text-amber-700">({due.requestId?.emergencyType || 'General'})</span>
                      </h4>
                      
                      <p className="text-xs text-[#7a5a48] font-semibold leading-relaxed">
                        Case: "{due.requestId?.description || 'N/A'}"
                      </p>

                      <div className="flex flex-col gap-1.5 pt-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold text-[#7a5a48] uppercase">Repayment Deadline:</span>
                          <span className="text-[11px] font-bold text-[#3d2b1f]">
                            {new Date(due.dueDate).toLocaleDateString()} at {new Date(due.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold text-[#7a5a48] uppercase">Due Countdown:</span>
                          <DueTimer dueDate={due.dueDate} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-2.5 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-dashed border-gray-100">
                    <div>
                      <p className="text-[10px] font-bold text-[#7a5a48] uppercase">Amount Due</p>
                      <p className="text-lg font-black text-amber-700">₹{due.amountDue}</p>
                    </div>

                    <div className="w-full flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRepayDue(due._id)}
                        disabled={isPayingDue !== null || !canAfford}
                        className="w-full md:w-auto px-4 py-2 text-xs font-extrabold rounded-xl text-white shadow-md hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        style={{ backgroundColor: canAfford ? BRAND.mid : BRAND.light }}
                      >
                        {isPayingDue === due._id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> Settle for ₹{due.amountDue}
                          </>
                        )}
                      </button>

                      {!canAfford && (
                        <div className="text-right">
                          <p className="text-[9px] text-red-600 font-bold max-w-[150px] leading-relaxed mb-1">
                            ⚠️ Insufficient Wallet balance! Wallet has ₹{walletBalance}.
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate('/paw-wallet')}
                            className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-extrabold hover:underline"
                          >
                            <Plus className="w-3 h-3" /> Add Funds
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── DUE PAYMENT HISTORY (COLLAPSIBLE) ────────────────────────────── */}
      {userDues.some(due => due.isPaid) && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-white border border-[#e8d5b0] shadow-sm space-y-4"
        >
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-left focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="text-sm font-extrabold text-[#3d2b1f]">Cleared Emergency Dues History</h3>
                <p className="text-[10px] text-[#7a5a48] font-semibold">View successfully settled emergency bookings.</p>
              </div>
            </div>
            {showHistory ? <ChevronUp className="w-4 h-4 text-[#7a5a48]" /> : <ChevronDown className="w-4 h-4 text-[#7a5a48]" />}
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-3 border-t border-[#e8d5b0]/40 overflow-hidden"
              >
                {userDues.filter(due => due.isPaid).map((due) => (
                  <div key={due._id} className="p-4 rounded-2xl bg-green-50/25 border border-green-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 border border-green-200 text-green-700">
                          <Check className="w-3 h-3" /> Cleared
                        </span>
                        <span className="text-[10px] text-[#7a5a48] font-semibold">
                          Reference: #{due._id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-[#3d2b1f]">
                        Emergency Consultation Fee ({due.requestId?.emergencyType || 'General'})
                      </h4>
                      {due.paidAt && (
                        <p className="text-[10px] text-green-700 font-medium italic">
                          Cleared on {new Date(due.paidAt).toLocaleDateString()} at {new Date(due.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#7a5a48] font-bold uppercase">Saddled Amount</p>
                      <p className="text-sm font-extrabold text-green-700">₹{due.amountDue}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── ACTIVE EMERGENCY TRACKING BOARD ─────────────────────────────── */}
      {hasActiveEmergency && activeEmergency ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Status Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-white border-2 border-red-200 shadow-xl overflow-hidden relative">
            <div className="absolute -right-24 -bottom-24 w-64 h-64 rounded-full bg-red-100 blur-3xl opacity-40" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-5 flex-1">
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-red-400 opacity-25"></span>
                  <Activity className="w-8 h-8 text-red-600 animate-pulse" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-red-200 bg-red-50 text-red-600 mb-2 uppercase tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    {activeEmergency.status}
                  </span>
                  <h2 className="text-xl md:text-2xl font-extrabold mb-1" style={{ color: BRAND.dark }}>Emergency Broadcast Active</h2>
                  <p className="text-xs font-semibold text-[#7a5a48] max-w-lg">
                    Our live dispatcher is broadcasting your medical emergency to all registered veterinarians in the <strong className="text-red-600">{activeEmergency.district}</strong> district. Please stand by.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-end gap-3 self-stretch md:self-auto justify-between border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                <div className="text-center md:text-right">
                  <p className="text-[10px] font-extrabold text-[#7a5a48] uppercase tracking-wider mb-1.5">Approval Timer Window</p>
                  <EmergencyTimer createdAt={activeEmergency.createdAt} onTimeout={fetchEmergencyRequests} />
                </div>
                {['Pending', 'Waiting for Doctor Approval'].includes(activeEmergency.status) && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => cancelEmergencyRequest(activeEmergency._id)}
                    className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition shadow-sm"
                  >
                    Cancel Request
                  </motion.button>
                )}
              </div>
            </div>

            {/* Real-time Interactive Progress Stepper */}
            <div className="border-t border-red-100 pt-6 mt-6 relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 lg:gap-2">
                {steps.map((step, idx) => {
                  const IconComponent = step.icon;
                  const isCompleted = idx < currentStepIdx;
                  const isActive = idx === currentStepIdx;
                  const isPending = idx > currentStepIdx;

                  return (
                    <div key={idx} className="flex-1 w-full flex flex-row lg:flex-col items-center gap-3 text-left lg:text-center group relative">
                      {/* Connection Line on Desktop */}
                      {idx < steps.length - 1 && (
                        <div className="hidden lg:block absolute left-[calc(50%+1.5rem)] right-[calc(-50%+1.5rem)] top-5 h-0.5 bg-gray-100 z-0">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: isCompleted ? "100%" : "0%" }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-red-500 to-amber-500"
                          />
                        </div>
                      )}

                      {/* Icon Bubble */}
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all ${
                          isCompleted 
                            ? 'bg-gradient-to-br from-red-500 to-amber-500 border-transparent text-white shadow-md'
                            : isActive
                            ? 'bg-red-50 border-red-600 text-red-600 shadow-lg shadow-red-100 scale-105'
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5 stroke-[3]" />
                        ) : (
                          <IconComponent className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                        )}
                      </motion.div>

                      {/* Content */}
                      <div className="flex-1 lg:mt-1">
                        <p className={`text-xs font-bold leading-tight transition-colors ${
                          isActive ? 'text-red-600 font-extrabold' : isCompleted ? 'text-[#3d2b1f]' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 max-w-[150px] lg:mx-auto">
                          {isActive ? "ACTIVE • " + step.desc : step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Responding Doctor Card */}
          {activeEmergency.docId ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl bg-white border border-[#e8d5b0] shadow-md flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden"
            >
              <div className="absolute -left-10 -top-10 w-32 h-32 rounded-full bg-amber-50 blur-2xl opacity-40" />
              
              <div className="flex items-center gap-4 relative z-10">
                <img 
                  src={activeEmergency.docId.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeEmergency.docId.name)}&background=random`} 
                  alt="Doctor" 
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#e8d5b0] shadow-sm" 
                />
                <div>
                  <p className="text-[10px] font-extrabold text-[#c8860a] uppercase tracking-wider mb-0.5">Assigned Emergency Vet</p>
                  <h3 className="text-lg font-extrabold text-[#3d2b1f]">Dr. {activeEmergency.docId.name}</h3>
                  <p className="text-xs font-medium text-[#7a5a48] flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5" style={{ color: BRAND.amber }} />
                    {activeEmergency.docId.speciality || 'General Veterinary Specialist'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
                {activeEmergency.docId.docphone && (
                  <a 
                    href={`tel:${activeEmergency.docId.docphone}`}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-bold shadow-sm hover:bg-green-100 transition"
                  >
                    <Phone className="w-4 h-4" /> Call Vet
                  </a>
                )}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedChat({ _id: activeEmergency._id, docData: activeEmergency.docId })}
                  className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[#c8860a] text-xs font-bold shadow-sm hover:bg-amber-100 transition"
                >
                  <MessageCircle className="w-4 h-4" /> Message Chat
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="p-6 rounded-3xl bg-white border border-[#e8d5b0] text-center shadow-inner py-8">
              <div className="inline-flex p-3 rounded-full bg-amber-50 border border-amber-200 animate-pulse mb-3">
                <Clock className="w-6 h-6 text-[#c8860a]" />
              </div>
              <h3 className="text-sm font-bold text-[#3d2b1f]">Awaiting Doctor Lock-In</h3>
              <p className="text-xs text-[#7a5a48] mt-1 max-w-md mx-auto">
                Vets in your district are receiving notifications right now. The first doctor to accept will lock this appointment instantly to prevent conflicts.
              </p>
            </div>
          )}

          {/* Breakdown details */}
          <div className="p-6 md:p-8 rounded-3xl bg-[#fffdfa] border border-[#e8d5b0] shadow-sm">
            <h3 className="text-xs font-extrabold text-[#3d2b1f] border-b border-[#e8d5b0] pb-3 mb-5 flex items-center gap-2 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-[#c8860a]" /> Emergency Case Sheet
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-[#7a5a48] uppercase tracking-wider">Target Patient</p>
                <p className="text-sm font-bold text-[#3d2b1f] mt-1 flex items-center gap-1.5">
                  <PawPrint className="w-4 h-4 text-[#c8860a]" />
                  {activeEmergency.isStray ? `Stray Animal (${activeEmergency.strayDetails?.petType || 'Other'})` : `Registered Pet`}
                </p>
                {activeEmergency.isStray && activeEmergency.strayDetails?.location && (
                  <p className="text-xs text-[#7a5a48] mt-1.5 flex items-center gap-1 bg-[#fbf5e8] p-2 rounded-xl border border-[#e8d5b0]/40">
                    <MapPin className="w-3.5 h-3.5 text-[#c8860a]" /> Location: {activeEmergency.strayDetails.location}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#7a5a48] uppercase tracking-wider">Symptom Severity Level</p>
                <p className="text-sm font-extrabold text-red-600 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {activeEmergency.emergencyType}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-[10px] font-bold text-[#7a5a48] uppercase tracking-wider">Situation Narrative</p>
                <p className="text-xs text-[#3d2b1f] mt-2 bg-white p-4 rounded-2xl border border-[#e8d5b0] italic leading-relaxed shadow-inner">
                  "{activeEmergency.description}"
                </p>
              </div>
              {activeEmergency.attachments && activeEmergency.attachments.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-[10px] font-bold text-[#7a5a48] uppercase tracking-wider mb-2.5">Attached Medical Files / Images</p>
                  <div className="flex flex-wrap gap-2">
                    {activeEmergency.attachments.map((file, fIdx) => (
                      <a 
                        key={fIdx} 
                        href={file.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e8d5b0] bg-white text-xs font-bold text-[#5A4035] hover:text-[#c8860a] hover:bg-amber-50 transition shadow-sm"
                      >
                        <FileText className="w-4 h-4 text-[#c8860a]" /> {file.name || `Medical_Record_${fIdx + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        /* ── EMERGENCY CREATION FORM ─────────────────────────────────────── */
        <form onSubmit={handleBookEmergency} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Inputs Columns (Left & Center) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Select Pet Box */}
            <div className="p-6 rounded-3xl bg-white border border-[#e8d5b0] shadow-sm">
              <label className="text-sm font-extrabold text-[#3d2b1f] uppercase tracking-wider flex items-center gap-2 mb-4">
                <PawPrint className="w-4 h-4 text-[#c8860a]" /> 1. Select Emergency Patient
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {userPets && userPets.map(pet => (
                  <div
                    key={pet._id}
                    onClick={() => {
                      setSelectedPet(pet._id);
                      setIsStray(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
                      selectedPet === pet._id && !isStray
                        ? 'border-2 border-[#5A4035] bg-[#fffcf7] scale-[1.02] shadow-md'
                        : 'border-[#e8d5b0] bg-white hover:bg-amber-50/40'
                    }`}
                  >
                    <img 
                      src={pet.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(pet.name)}&background=random`} 
                      alt={pet.name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" 
                    />
                    <div>
                      <p className="text-sm font-extrabold text-[#3d2b1f] truncate max-w-[120px]">{pet.name}</p>
                      <p className="text-[10px] text-[#7a5a48] font-semibold">{pet.breed || pet.species}</p>
                    </div>
                  </div>
                ))}
                
                {/* Stray Card Option */}
                <div
                  onClick={() => {
                    setSelectedPet('');
                    setIsStray(true);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
                    isStray
                      ? 'border-2 border-red-600 bg-red-50/30 scale-[1.02] shadow-md'
                      : 'border-[#e8d5b0] bg-white hover:bg-amber-50/40'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-bold text-lg shadow-inner">
                    🏥
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-red-600">Stray Animal</p>
                    <p className="text-[10px] text-red-400 font-semibold">Injured/Rescue</p>
                  </div>
                </div>
              </div>

              {/* Stray Details panel */}
              {isStray && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-5 p-4 rounded-2xl bg-red-50/30 border border-red-100 space-y-4"
                >
                  <p className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider">Stray Animal Details Needed</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold text-[#7a5a48] uppercase block mb-1 font-semibold">Animal Type</label>
                      <select
                        value={strayPetType}
                        onChange={e => setStrayPetType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs outline-none bg-white border border-[#e8d5b0] font-semibold"
                      >
                        <option value="Dog">Dog</option>
                        <option value="Cat">Cat</option>
                        <option value="Cow">Cow / Livestock</option>
                        <option value="Bird">Bird</option>
                        <option value="Other">Other Species</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-[#7a5a48] uppercase block mb-1 font-semibold">Found Location</label>
                      <input
                        type="text"
                        placeholder="E.g., Near Sector 4 Bus Stop"
                        value={strayLocation}
                        onChange={e => setStrayLocation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs outline-none bg-white border border-[#e8d5b0] font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-[#7a5a48] uppercase block mb-1 font-semibold">Animal Condition Details</label>
                    <textarea
                      rows={2}
                      placeholder="Describe how the stray animal was found (injuries, bleeding, limp, etc.)"
                      value={strayDescription}
                      onChange={e => setStrayDescription(e.target.value)}
                      className="w-full p-3 rounded-xl text-xs outline-none bg-white border border-[#e8d5b0] font-semibold"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Severity level & Category Selection */}
            <div className="p-6 rounded-3xl bg-white border border-[#e8d5b0] shadow-sm">
              <label className="text-sm font-extrabold text-[#3d2b1f] uppercase tracking-wider flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-600" /> 2. Select Medical Severity Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'Accident/Trauma', label: 'Accident / Severe Trauma', desc: 'Bone fracture, bleeding from car collision, physical impact', emoji: '💥' },
                  { id: 'Severe Bleeding', label: 'Severe / Profuse Bleeding', desc: 'Uncontrolled blood loss, deep wounds, artery cuts', emoji: '🩸' },
                  { id: 'Breathing Difficulty', label: 'Respiratory Distress', desc: 'Gasping for air, extreme heavy panting, choking', emoji: '🫁' },
                  { id: 'Poisoning/Ingestion', label: 'Poisoning / Toxic Ingestion', desc: 'Swallowed household chemicals, medication, poisonous food', emoji: '🤢' },
                  { id: 'Heat Stroke / High Fever', label: 'Heat Stroke / Extreme Fever', desc: 'Super high temperature, collapsing, foaming at mouth', emoji: '🥵' },
                  { id: 'Severe Vomiting / Diaper', label: 'Extreme Dehydration', desc: 'Continuous vomiting, inability to retain water, lethargy', emoji: '🤮' },
                  { id: 'Other Medical Emergency', label: 'Other Critical Emergency', desc: 'Seizures, stomach bloat, sudden paralysis, unconscious', emoji: '❓' }
                ].map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => setEmergencyType(cat.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 text-left ${
                      emergencyType === cat.id
                        ? 'border-2 border-red-600 bg-red-50/20 scale-[1.01] shadow-md'
                        : 'border-[#e8d5b0] bg-white hover:bg-amber-50/20'
                    }`}
                  >
                    <span className="text-2xl pt-0.5">{cat.emoji}</span>
                    <div>
                      <p className="text-xs font-extrabold text-[#3d2b1f]">{cat.label}</p>
                      <p className="text-[10px] text-[#7a5a48] font-medium leading-relaxed mt-0.5">{cat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consultation Mode Selector */}
            <div className="p-6 rounded-3xl bg-white border border-[#e8d5b0] shadow-sm">
              <label className="text-sm font-extrabold text-[#3d2b1f] uppercase tracking-wider flex items-center gap-2 mb-4">
                <Stethoscope className="w-4 h-4 text-[#c8860a]" /> 3. Preferred Consultation Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'clinic', label: '🏥 In-Clinic Priority', desc: 'Walk-in immediately, bypass normal lines' },
                  { id: 'video', label: '📹 Live Video Call', desc: 'Connect instantly with next available online vet' }
                ].map(mode => (
                  <div
                    key={mode.id}
                    onClick={() => setPreferredMode(mode.id)}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                      preferredMode === mode.id
                        ? 'border-2 border-[#5A4035] bg-[#fffcf7] scale-[1.02] shadow-md'
                        : 'border-[#e8d5b0] bg-white hover:bg-amber-50/20'
                    }`}
                  >
                    <p className="text-xs font-extrabold text-[#3d2b1f]">{mode.label}</p>
                    <p className="text-[10px] text-[#7a5a48] font-medium mt-1 leading-relaxed">{mode.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Narrative details & attachment */}
            <div className="p-6 rounded-3xl bg-white border border-[#e8d5b0] shadow-sm space-y-4">
              <div>
                <label className="text-sm font-extrabold text-[#3d2b1f] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#c8860a]" /> 4. Brief Case Narrative
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain the situation briefly (e.g. Swallowed a dark chocolate bar 10 minutes ago, is whimpering and starting to vomit. Please help!)"
                  value={emergencyDescription}
                  onChange={e => setEmergencyDescription(e.target.value)}
                  className="w-full p-4 rounded-2xl text-xs outline-none bg-white border border-[#e8d5b0] focus:ring-1 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="text-sm font-extrabold text-[#3d2b1f] uppercase tracking-wider block mb-2">
                  Upload Medical Images / Records <span className="text-[#7a5a48] font-semibold text-[10px]">(Optional)</span>
                </label>
                <div className="relative border-2 border-dashed border-[#e8d5b0] rounded-2xl p-6 text-center hover:bg-amber-50/20 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-1">
                    <Upload className="mx-auto h-8 w-8 text-[#7a5a48]" />
                    <p className="text-xs font-bold text-[#5A4035]">
                      {reportFile ? reportFile.name : 'Click to select or drag files here'}
                    </p>
                    <p className="text-[10px] text-[#7a5a48] font-semibold">Supports JPG, PNG, or PDF files up to 5MB</p>
                  </div>
                </div>
                {reportFile && (
                  <div className="mt-2.5 flex items-center justify-between p-2 px-3 rounded-xl bg-[#fffcf7] border border-[#e8d5b0] text-xs font-medium text-[#5A4035]">
                    <span className="truncate max-w-xs">{reportFile.name} ({(reportFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button
                      type="button"
                      onClick={() => setReportFile(null)}
                      className="text-red-500 hover:text-red-700 font-extrabold text-sm px-1.5"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Dispatch Parameters */}
            <div className="p-6 rounded-3xl bg-white border border-[#e8d5b0] shadow-sm">
              <label className="text-sm font-extrabold text-[#3d2b1f] uppercase tracking-wider flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-[#c8860a]" /> 5. Dispatch Routing Location
              </label>
              <p className="text-[10px] text-[#7a5a48] font-semibold mb-4 leading-relaxed">
                Alerts are instantly pushed to available veterinarians in your district. Correct physical location parameters ensure maximum response rates.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-[#7a5a48] uppercase block mb-1">State</label>
                  <input
                    required
                    type="text"
                    placeholder="E.g., MAHARASHTRA"
                    value={stateInput}
                    onChange={e => setStateInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none bg-[#fffcf7] border border-[#e8d5b0] font-extrabold uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-[#7a5a48] uppercase block mb-1">District</label>
                  <input
                    required
                    type="text"
                    placeholder="E.g., PUNE"
                    value={districtInput}
                    onChange={e => setDistrictInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none bg-[#fffcf7] border border-[#e8d5b0] font-extrabold uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Columns (Rules, Membership, Submit button) */}
          <div className="space-y-6">
            
            {/* Active plan billing details */}
            <div className="p-6 rounded-3xl bg-[#fffaf0] border border-[#e8d5b0] shadow-sm relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-amber-100 blur-xl opacity-30" />
              
              <h3 className="text-xs font-extrabold text-[#3d2b1f] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#e8d5b0]/60 pb-3 mb-4 relative z-10">
                <CreditCard className="w-4 h-4 text-[#c8860a]" /> Membership Billing Slip
              </h3>

              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#7a5a48]">Active Plan Tier:</span>
                  <span className="font-extrabold text-[#3d2b1f] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#c8860a]" />
                    {userdata?.subscription?.plan || 'None/Non-Subscriber'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#7a5a48]">Plan Status:</span>
                  <span className={`font-extrabold uppercase ${
                    userdata?.subscription?.status === 'Active' ? 'text-green-600' : 'text-rose-500'
                  }`}>
                    {userdata?.subscription?.status || 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#7a5a48]">Paw Wallet Balance:</span>
                  <span className="font-extrabold text-[#3d2b1f]">₹{userdata?.pawWallet || 0}</span>
                </div>

                <div className="border-t border-dashed border-[#e8d5b0] pt-3 mt-1.5 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#3d2b1f]">Service Fee:</span>
                  <span className="text-lg font-extrabold text-[#3d2b1f]">
                    {userdata?.subscription?.status === 'Active' && ['Platinum', 'Gold', 'Silver'].includes(userdata?.subscription?.plan) ? (
                      <span className="text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-600" /> ₹0
                      </span>
                    ) : (
                      <span className="text-red-600 font-extrabold">₹100</span>
                    )}
                  </span>
                </div>

                {!(userdata?.subscription?.status === 'Active' && ['Platinum', 'Gold', 'Silver'].includes(userdata?.subscription?.plan)) && (
                  <div className="mt-3 bg-white p-3 rounded-xl border border-[#e8d5b0]/60 text-[10px] text-[#7a5a48] font-semibold leading-relaxed">
                    {userdata?.pawWallet >= 100 ? (
                      <p className="text-green-700 flex items-start gap-1">
                        <Check className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" /> Balance is sufficient! ₹100 will be auto-deducted directly from your Paw Wallet upon booking.
                      </p>
                    ) : (
                      <p className="text-amber-700 flex items-start gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" /> Balance is insufficient (requires ₹100). The emergency request will still be booked successfully, but your account will receive a pending due with a 4-day deadline.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Dispatching Guidelines */}
            <div className="p-6 rounded-3xl bg-white border border-[#e8d5b0] shadow-sm">
              <h3 className="text-xs font-extrabold text-[#3d2b1f] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3 mb-4">
                <Shield className="w-4 h-4 text-red-600" /> Dispatch Rules
              </h3>
              <ul className="space-y-3">
                {[
                  { title: 'District Routing', text: 'Alerts are routed instantly to all available vets matching your state and district.' },
                  { title: '5-Minute Lock', text: 'Veterinarians are notified immediately and are required to accept or decline the request within 5 minutes.' },
                  { title: 'Double Claim Guard', text: 'Once the first doctor claims your emergency, the system automatically locks it to prevent duplicate approvals.' },
                  { title: 'Account Restrict', text: 'Unpaid emergency booking dues exceed 4 days will trigger automatic temporary account restriction.' }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start">
                    <span className="text-[#c8860a] text-xs font-bold pt-0.5">0{idx + 1}.</span>
                    <div>
                      <p className="text-xs font-extrabold text-[#3d2b1f]">{item.title}</p>
                      <p className="text-[10px] text-[#7a5a48] font-semibold leading-relaxed mt-0.5">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* SUBMIT BUTTON */}
            <motion.button
              type="submit"
              whileHover={{ scale: isBookingEmergency ? 1 : 1.02 }}
              whileTap={{ scale: isBookingEmergency ? 1 : 0.98 }}
              disabled={isBookingEmergency}
              className="w-full py-4 text-sm font-extrabold rounded-2xl text-white shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #ef4444 100%)' }}
            >
              {isBookingEmergency ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Broadcasting Dispatch...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 animate-pulse" /> Launch Emergency Broadcast
                </>
              )}
            </motion.button>
          </div>
        </form>
      )}

      {/* ── EMERGENCY CONSULTATION HISTORY ────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#e8d5b0]/60 pb-3">
          <h3 className="text-base font-extrabold text-[#3d2b1f] flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-[#c8860a]" /> Emergency Case Archive
          </h3>
          <span className="text-[10px] font-extrabold bg-[#e8d5b0]/30 text-[#5A4035] px-2.5 py-1 rounded-full border border-[#e8d5b0]/60">
            {emergencyRequests.filter(r => !['Pending', 'Waiting for Doctor Approval', 'Payment Pending'].includes(r.status)).length} Recorded Cases
          </span>
        </div>

        {emergencyRequests.filter(r => !['Pending', 'Waiting for Doctor Approval', 'Payment Pending'].includes(r.status)).length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-4 rounded-3xl bg-white border border-[#e8d5b0] space-y-4"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-[#e8d5b0] text-4xl shadow-inner mx-auto"
            >
              🐾
            </motion.div>
            <h3 className="text-base font-extrabold text-[#3d2b1f]">No Emergency Cases on Record</h3>
            <p className="text-xs text-[#7a5a48] font-semibold max-w-xs mx-auto leading-relaxed">
              All your completed, cancelled, and resolved emergency cases will appear here for reference.
            </p>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-full border border-green-200 bg-green-50 text-green-700">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> All Clear
            </span>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {emergencyRequests
              .filter(r => !['Pending', 'Waiting for Doctor Approval', 'Payment Pending'].includes(r.status))
              .map((req, rIdx) => {
                const isComplete = req.status === 'Completed';
                const isReject = req.status === 'Rejected';
                
                const badgeStyle = isComplete 
                  ? { bg: 'bg-green-50 border-green-200 text-green-700', text: 'Completed', dot: 'bg-green-600' }
                  : isReject
                    ? { bg: 'bg-red-50 border-red-200 text-red-700', text: 'Rejected', dot: 'bg-red-600' }
                    : { bg: 'bg-gray-50 border-gray-200 text-gray-700', text: 'Cancelled', dot: 'bg-gray-500' };

                return (
                  <motion.div
                    key={req._id || rIdx}
                    whileHover={{ y: -2 }}
                    className="p-5 rounded-3xl bg-white border border-[#e8d5b0] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-2xl bg-amber-50/40 border border-[#e8d5b0]/40 flex items-center justify-center">
                        <PawPrint className="w-5 h-5 text-[#c8860a]" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle.bg}`}>
                            <span className={`w-1 h-1 rounded-full ${badgeStyle.dot}`} />
                            {badgeStyle.text}
                          </span>
                          <span className="text-[10px] text-[#7a5a48] font-semibold">
                            {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-[#3d2b1f]">{req.emergencyType}</h4>
                        <p className="text-xs text-[#7a5a48] font-semibold max-w-lg truncate leading-relaxed">
                          {req.isStray
                            ? `Stray ${req.strayDetails?.petType || 'Animal'} — ${req.strayDetails?.location || 'Location not set'}`
                            : req.petId
                              ? `Pet: ${req.petId.name || 'Unknown'} (${req.petId.type || req.petId.breed || 'Mixed'})`
                              : 'Pet info unavailable'}
                        </p>
                        <p className="text-[10px] text-[#7a5a48] font-medium truncate mt-0.5">
                          {req.description || req.emergencyDescription || 'No additional description'}
                        </p>
                        {req.docId && (
                          <p className="text-[10px] text-[#5A4035] font-extrabold">
                            Responding Doctor: Dr. {req.docId.name} ({req.docId.speciality || 'Vet'})
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-[#3d2b1f]">Charge</p>
                      <p className="text-sm font-extrabold text-amber-700 mt-0.5">
                        {req.paymentLog?.amount ? `₹${req.paymentLog.amount}` : req.billingPlanTier && req.billingPlanTier !== 'None' ? '₹0 (Plan Cover)' : '₹100'}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

const TABS = [
  { key: 'all', label: 'appointments.total' },
  { key: 'upcoming', label: 'appointments.upcoming' },
  { key: 'completed', label: 'appointments.completed' },
  { key: 'cancelled', label: 'appointments.cancelled' },
  { key: 'emergency', label: 'appointments.emergency' },
];

const MyAppointments = () => {
  const { backendurl, token, userdata, userPets, fetchUserPets, loadUserProfileData } = useContext(AppContext)
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
      // Clean up state to avoid switching back on refresh if not intended
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [appointments, setAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedChat, setSelectedChat] = useState(null)
  const [reportAppointment, setReportAppointment] = useState(null)
  const [ratingAppointment, setRatingAppointment] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('clinic') // 'clinic' or 'video'
  const [searchQuery, setSearchQuery] = useState('')

  // ─── Emergency Section State ──────────────────────────────────────────────
  const [emergencyRequests, setEmergencyRequests] = useState(() => {
    try {
      const cached = localStorage.getItem('pawvaidya_cached_emergencies');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [isFetchingEmergencies, setIsFetchingEmergencies] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedPet, setSelectedPet] = useState('');
  const [isStray, setIsStray] = useState(false);
  const [strayPetType, setStrayPetType] = useState('Dog');
  const [strayLocation, setStrayLocation] = useState('');
  const [strayDescription, setStrayDescription] = useState('');
  const [emergencyType, setEmergencyType] = useState('Accident/Trauma');
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [districtInput, setDistrictInput] = useState('');
  const [stateInput, setStateInput] = useState('');
  const [preferredMode, setPreferredMode] = useState('clinic');
  const [reportFile, setReportFile] = useState(null);
  const [isBookingEmergency, setIsBookingEmergency] = useState(false);

  // ─── Emergency Dues State & Actions ───────────────────────────────────────
  const [userDues, setUserDues] = useState([]);
  const [isFetchingDues, setIsFetchingDues] = useState(false);
  const [isPayingDue, setIsPayingDue] = useState(null);

  const fetchUserDues = async () => {
    if (!token) return;
    try {
      setIsFetchingDues(true);
      const { data } = await axios.get(backendurl + '/api/emergency/dues', { headers: { token } });
      if (data.success) {
        setUserDues(data.dues);
      }
    } catch (err) {
      console.error("Error fetching user dues:", err);
    } finally {
      setIsFetchingDues(false);
    }
  };

  const handleRepayDue = async (dueId) => {
    if (!token) return;
    try {
      setIsPayingDue(dueId);
      const { data } = await axios.post(
        backendurl + '/api/emergency/repay-dues',
        { dueId },
        { headers: { token } }
      );
      if (data.success) {
        toast.success(data.message || "Due cleared successfully!");
        fetchUserDues();
        fetchEmergencyRequests();
        if (typeof loadUserProfileData === 'function') {
          loadUserProfileData();
        }
      } else {
        toast.error(data.message || "Failed to repay due.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "An error occurred during repayment.");
    } finally {
      setIsPayingDue(null);
    }
  };

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
    if (token) {
      getUserAppointments();
      fetchUserDues();
    }
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

  // ─── Emergency Functionality & Helpers ─────────────────────────────────────
  const fetchEmergencyRequests = async () => {
    if (!token) return;
    try {
      setIsFetchingEmergencies(true);
      setFetchError(null);
      const { data } = await axios.get(backendurl + '/api/emergency/requests', { headers: { token } });
      if (data.success) {
        setEmergencyRequests(data.requests);
        // SWR: persist to localStorage for instant next-load
        try {
          localStorage.setItem('pawvaidya_cached_emergencies', JSON.stringify(data.requests));
        } catch {}
      }
    } catch (err) {
      console.error("Error fetching emergency requests:", err);
      const msg = err.response?.data?.message || err.message || 'Network error – could not reach servers';
      setFetchError(msg);
    } finally {
      setIsFetchingEmergencies(false);
    }
  };

  const handleBookEmergency = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please log in to book an emergency.");
      return;
    }
    if (!emergencyType) {
      toast.error("Please select an emergency type.");
      return;
    }
    if (!emergencyDescription) {
      toast.error("Please describe the emergency.");
      return;
    }
    if (!districtInput || !stateInput) {
      toast.error("Please specify both District and State for matching nearest veterinarians.");
      return;
    }
    if (isStray && (!strayLocation || !strayPetType)) {
      toast.error("Please provide pet type and location for the stray animal.");
      return;
    }
    if (!isStray && !selectedPet) {
      toast.error("Please select one of your registered pets or choose the Stray option.");
      return;
    }

    try {
      setIsBookingEmergency(true);
      const formData = new FormData();
      formData.append('emergencyType', emergencyType);
      formData.append('description', emergencyDescription);
      formData.append('district', districtInput.toUpperCase());
      formData.append('state', stateInput.toUpperCase());
      formData.append('isStray', isStray ? 'true' : 'false');
      
      if (isStray) {
        formData.append('strayDetails', JSON.stringify({
          petType: strayPetType,
          location: strayLocation,
          description: strayDescription
        }));
      } else {
        formData.append('petId', selectedPet);
      }

      if (reportFile) {
        formData.append('report', reportFile);
      }

      const { data } = await axios.post(
        backendurl + '/api/emergency/create',
        formData,
        {
          headers: {
            token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (data.success) {
        toast.success("Emergency booking requested successfully!");
        setEmergencyDescription('');
        setStrayLocation('');
        setStrayDescription('');
        setReportFile(null);
        fetchEmergencyRequests();
      } else {
        toast.error(data.message || "Failed to book emergency.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "An error occurred.");
    } finally {
      setIsBookingEmergency(false);
    }
  };

  const cancelEmergencyRequest = async (requestId) => {
    try {
      const { data } = await axios.post(
        backendurl + '/api/emergency/status',
        { requestId, status: 'Cancelled', reason: 'Cancelled by patient.' },
        { headers: { token } }
      );
      if (data.success) {
        toast.success("Emergency request cancelled successfully.");
        fetchEmergencyRequests();
      } else {
        toast.error(data.message || "Failed to cancel emergency request.");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setReportFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (userdata) {
      setDistrictInput(userdata.district || '');
      setStateInput(userdata.state || '');
    }
  }, [userdata]);

  useEffect(() => {
    if (activeTab === 'emergency') {
      fetchEmergencyRequests();
      fetchUserPets();
      fetchUserDues();
    }
  }, [activeTab]);

  useEffect(() => {
    let interval = null;
    const hasActive = emergencyRequests.some(r => 
      ['Pending', 'Waiting for Doctor Approval', 'Payment Pending'].includes(r.status)
    );

    if (hasActive && activeTab === 'emergency') {
      interval = setInterval(() => {
        fetchEmergencyRequests();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emergencyRequests, activeTab]);

  // ─── Online / Offline detection ──────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored! Syncing emergency data...', { autoClose: 2500 });
      if (activeTab === 'emergency') fetchEmergencyRequests();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warn('You are offline. Emergency tracking is paused.', { autoClose: 4000 });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [activeTab]);

  useEffect(() => {
    if (!token || !userdata || !userdata._id) return;

    // Initialize socket connection using backendurl
    const socket = io(backendurl, {
      withCredentials: true,
      transports: ['polling', 'websocket']
    });

    socket.on('connect', () => {
      console.log('MyAppointments real-time tracking socket connected:', socket.id);
      // Register this user for their specific real-time emergency updates
      socket.emit('register-user-emergency', userdata._id);
    });

    socket.on('emergency-status-updated', (data) => {
      console.log('Real-time emergency status update received:', data);
      if (data && data.request) {
        setEmergencyRequests(prev => {
          const index = prev.findIndex(r => r._id === data.request._id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = data.request;
            return updated;
          } else {
            return [data.request, ...prev];
          }
        });
        toast.info(`Emergency Request status updated: ${data.request.status}`, {
          position: "top-right",
          autoClose: 3500
        });
      }
    });

    socket.on('emergency-expired', (data) => {
      console.log('Real-time emergency request expired:', data);
      fetchEmergencyRequests();
    });

    socket.on('emergency-locked', (data) => {
      console.log('Real-time emergency request locked:', data);
      fetchEmergencyRequests();
    });

    return () => {
      socket.off('emergency-status-updated');
      socket.off('emergency-expired');
      socket.off('emergency-locked');
      socket.disconnect();
    };
  }, [token, userdata, backendurl]);

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
    // Exclude incomplete/stuck appointments that have no valid doctor data
    let list = appointments.filter(a => a.docData && a.docData.name);

    if (categoryFilter === 'clinic') list = list.filter(a => !a.isVideo);
    else if (categoryFilter === 'video') list = list.filter(a => a.isVideo);

    if (activeTab === 'upcoming') list = list.filter(a => !a.cancelled && !a.isCompleted);
    if (activeTab === 'completed') list = list.filter(a => a.isCompleted);
    if (activeTab === 'cancelled') list = list.filter(a => a.cancelled);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        (a.docData?.name || '').toLowerCase().includes(q) ||
        (a.docData?.speciality || '').toLowerCase().includes(q) ||
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

  if (userdata?.isBanned) {
    const unpaidDues = userDues.filter(due => !due.isPaid);
    const walletBalance = userdata?.pawWallet || 0;

    return (
      <div className="min-h-screen py-16 px-4 md:px-8 flex items-center justify-center" style={{ background: BRAND.cream }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl w-full bg-white rounded-[3rem] shadow-2xl border-2 border-red-200 overflow-hidden relative"
        >
          {/* Crimson Warning Header Banner */}
          <div className="bg-gradient-to-r from-red-600 to-rose-700 py-10 px-8 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="p-4 bg-white/20 rounded-full mb-4 animate-bounce">
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-black uppercase tracking-tight">Temporary Account Restriction</h1>
              <p className="text-red-100 text-xs font-bold uppercase tracking-widest mt-1">Dues Payment Overdue</p>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-8 text-[#3d2b1f]">
            {/* Warning Info */}
            <div className="space-y-3">
              <h3 className="text-lg font-extrabold flex items-center gap-2 text-red-600">
                <Shield className="w-5 h-5 shrink-0" /> Restrictive Notice & Account Suspension
              </h3>
              <p className="text-sm font-medium leading-relaxed opacity-80">
                Your account is currently restricted in accordance with PawVaidya policy. This temporary suspension occurs automatically when outstanding emergency consultation dues exceed the **4-day payment window**.
              </p>
              <div className="p-4.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-amber-900 block mb-1">Active Restrictions:</span> 
                  Standard appointment bookings, telemedicine video requests, and active emergency dispatch queues are locked. Settle your dues below to restore full access instantly.
                </div>
              </div>
            </div>

            {/* Dues and Balances Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Ban Details Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Suspension Profile</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Reason for Ban</span>
                    <span className="text-xs font-bold text-slate-700">{userdata?.banReason || 'Unpaid emergency booking dues'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Total Unpaid Cases</span>
                    <span className="text-xs font-extrabold text-slate-700">{unpaidDues.length} Pending Emergency Due(s)</span>
                  </div>
                </div>
              </div>

              {/* Paw Wallet Status */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Your Paw Wallet</h4>
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Available Balance</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-slate-800">₹{walletBalance}</span>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Secure</span>
                  </div>
                </div>
                {walletBalance < 100 && (
                  <button
                    onClick={() => navigate('/paw-wallet')}
                    className="w-full py-2.5 rounded-xl bg-[#5A4035] hover:bg-[#3d2b1f] text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md"
                  >
                    + Top Up Wallet
                  </button>
                )}
              </div>
            </div>

            {/* Repayment List */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> Settle Overdue Balances ({unpaidDues.length})
              </h4>

              {unpaidDues.length === 0 ? (
                <div className="p-6 rounded-2xl bg-green-50 border border-green-200 text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto animate-bounce" />
                  <p className="text-xs font-bold text-green-800">No pending dues found! Reloading profile...</p>
                  <button 
                    onClick={() => {
                      if (typeof loadUserProfileData === 'function') loadUserProfileData();
                    }} 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow"
                  >
                    Refresh Account
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {unpaidDues.map((due) => {
                    const canAfford = walletBalance >= due.amountDue;
                    return (
                      <div key={due._id} className="p-5 rounded-2xl border-2 border-red-100 bg-red-50/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md uppercase">Overdue</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Due: <DueTimer dueDate={due.dueDate} />
                            </span>
                          </div>
                          <h5 className="text-sm font-black text-[#3d2b1f] mt-1.5">Emergency Consultation Fee</h5>
                          <p className="text-[11px] font-semibold text-slate-500">Case ID: {due.requestId?._id || due._id}</p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-0 pt-3 md:pt-0">
                          <div className="text-right">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Amount Due</span>
                            <span className="text-base font-black text-rose-600">₹{due.amountDue}</span>
                          </div>

                          <button
                            onClick={() => handleRepayDue(due._id)}
                            disabled={isPayingDue !== null || !canAfford}
                            className={`px-5 py-3 rounded-xl font-black uppercase tracking-wider text-xs shadow-md transition flex items-center gap-1.5 ${
                              canAfford
                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-100'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                          >
                            {isPayingDue === due._id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Clearing...
                              </>
                            ) : canAfford ? (
                              'Repay Instantly'
                            ) : (
                              'Insufficient Balance'
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Return instructions */}
            <div className="text-center pt-4 border-t border-slate-100">
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                Need Support? Contact our Help Desk or write to support@pawvaidya.com
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
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

        {/* ── Progressive Due Warnings & Reminders ────────────────────────── */}
        {userDues.some(due => !due.isPaid && isNearingExpiry(due.dueDate)) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4.5 mb-6 rounded-3xl bg-gradient-to-r from-red-500 to-amber-600 text-white shadow-lg border border-red-400 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
            <div className="flex items-center gap-3 relative z-10">
              <span className="p-2.5 bg-white/20 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-white animate-bounce" />
              </span>
              <div>
                <h4 className="font-extrabold text-sm tracking-wide uppercase">Critical Payment Warning!</h4>
                <p className="text-xs text-amber-50 font-semibold mt-0.5">
                  An unpaid emergency fee of ₹100 is nearing expiration. Repay within the 4-day grace window to prevent temporary account restriction.
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => {
                const pendingDue = userDues.find(due => !due.isPaid && isNearingExpiry(due.dueDate));
                if (pendingDue) handleRepayDue(pendingDue._id);
              }}
              disabled={isPayingDue !== null}
              className="px-5 py-2.5 rounded-xl bg-white text-red-700 text-xs font-black uppercase tracking-wider shadow hover:bg-amber-50 transition shrink-0 relative z-10 disabled:opacity-50"
            >
              {isPayingDue ? 'Processing...' : 'Settle Instantly'}
            </button>
          </motion.div>
        )}

        {/* ── Category + Search + Tab Bar ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="flex flex-col gap-4 mb-6">

          {/* Category Tabs */}
          {activeTab === 'emergency' ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-50 border-2 border-red-200 self-start shadow-sm">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
              </span>
              <span className="text-xs font-bold text-red-600 tracking-wider uppercase flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Emergency Dispatch Channel
              </span>
            </div>
          ) : (
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
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            {activeTab !== 'emergency' && (
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
            )}
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
                    {tab.key === 'all' 
                      ? stats.total 
                      : tab.key === 'upcoming' 
                        ? stats.upcoming 
                        : tab.key === 'completed' 
                          ? stats.completed 
                          : tab.key === 'emergency'
                            ? emergencyRequests.filter(r => ['Pending', 'Waiting for Doctor Approval', 'Payment Pending'].includes(r.status)).length
                            : stats.cancelled}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {activeTab === 'emergency' ? (
          <EmergencyBookingView
            userdata={userdata}
            BRAND={BRAND}
            userPets={userPets}
            emergencyRequests={emergencyRequests}
            isBookingEmergency={isBookingEmergency}
            handleBookEmergency={handleBookEmergency}
            selectedPet={selectedPet}
            setSelectedPet={setSelectedPet}
            isStray={isStray}
            setIsStray={setIsStray}
            strayPetType={strayPetType}
            setStrayPetType={setStrayPetType}
            strayLocation={strayLocation}
            setStrayLocation={setStrayLocation}
            strayDescription={strayDescription}
            setStrayDescription={setStrayDescription}
            emergencyType={emergencyType}
            setEmergencyType={setEmergencyType}
            preferredMode={preferredMode}
            setPreferredMode={setPreferredMode}
            emergencyDescription={emergencyDescription}
            setEmergencyDescription={setEmergencyDescription}
            reportFile={reportFile}
            setReportFile={setReportFile}
            stateInput={stateInput}
            setStateInput={setStateInput}
            districtInput={districtInput}
            setDistrictInput={setDistrictInput}
            handleFileChange={handleFileChange}
            cancelEmergencyRequest={cancelEmergencyRequest}
            setSelectedChat={setSelectedChat}
            fetchEmergencyRequests={fetchEmergencyRequests}
            userDues={userDues}
            isFetchingDues={isFetchingDues}
            handleRepayDue={handleRepayDue}
            isPayingDue={isPayingDue}
            isOnline={isOnline}
            fetchError={fetchError}
            isFetchingEmergencies={isFetchingEmergencies}
          />
        ) : (
          <>
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
      </>
    )}
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
