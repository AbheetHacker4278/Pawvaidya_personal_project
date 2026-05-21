import React, { useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Bell, ShieldAlert, MapPin, X, ChevronRight, VolumeX } from 'lucide-react';
import { DoctorContext } from '../context/DoctorContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';

// ─── Continuous looping siren — stops when sirenActive ref is set to false ──
const startContinuousSiren = (sirenActiveRef) => {
  let timeoutId = null;

  const playOneCycle = () => {
    if (!sirenActiveRef.current) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const schedule = (freq, start, dur, gainVal = 0.12) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(gainVal, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur - 0.02);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };
      const now = ctx.currentTime;
      schedule(880,  now,        0.2);
      schedule(660,  now + 0.25, 0.2);
      schedule(880,  now + 0.5,  0.15);
      schedule(1046, now + 0.7,  0.3);
      schedule(880,  now + 1.05, 0.35);

      // Schedule next cycle after 2.5s gap (total ~5s cycle)
      timeoutId = setTimeout(() => {
        if (sirenActiveRef.current) playOneCycle();
      }, 2500);
    } catch (e) {
      console.warn('Siren blocked:', e.message);
    }
  };

  playOneCycle();
  return () => { clearTimeout(timeoutId); };
};

// ─── Subscription badge helper ───────────────────────────────────────────────
const getSubscriptionBadge = (plan) => {
  const p = (plan || '').toLowerCase();
  if (p.includes('platinum')) return { label: 'Platinum', color: 'bg-indigo-100 text-indigo-700', fee: '₹200' };
  if (p.includes('gold'))     return { label: 'Gold',     color: 'bg-amber-100 text-amber-700',   fee: '₹300' };
  if (p.includes('silver'))   return { label: 'Silver',   color: 'bg-slate-100 text-slate-700',   fee: '₹400' };
  return                                { label: 'No Sub', color: 'bg-rose-100 text-rose-700',     fee: '₹500' };
};

const EmergencyAlertBell = () => {
  const { dtoken, profileData, backendurl } = useContext(DoctorContext);
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const dropdownRef = useRef(null);
  const sirenActiveRef = useRef(false);
  const stopSirenFnRef = useRef(null);

  // ─── Start / stop continuous siren ─────────────────────────────────────────
  const startSiren = () => {
    if (sirenActiveRef.current) return; // already running
    sirenActiveRef.current = true;
    stopSirenFnRef.current = startContinuousSiren(sirenActiveRef);
  };

  const stopSiren = () => {
    sirenActiveRef.current = false;
    if (stopSirenFnRef.current) { stopSirenFnRef.current(); stopSirenFnRef.current = null; }
  };

  // Stop siren when all pending alerts are gone
  useEffect(() => {
    const hasPending = alerts.some(a => ['Pending', 'Waiting for Doctor Approval'].includes(a.status));
    if (!hasPending) stopSiren();
  }, [alerts]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Socket subscription
  useEffect(() => {
    if (!dtoken || !profileData?._id) return;

    const cleanDistrict = (
      profileData.emergencyProfile?.activeDistrict ||
      profileData.address?.Location || ''
    ).trim().toUpperCase();
    if (!cleanDistrict) return;

    const socket = io(backendurl, { withCredentials: true, transports: ['polling', 'websocket'] });

    socket.emit('register-doctor-emergency', { docId: profileData._id, district: cleanDistrict });

    socket.on('new-emergency-alert', ({ request }) => {
      setAlerts(prev => {
        if (prev.some(a => a._id === request._id)) return prev;
        return [{ ...request }, ...prev].slice(0, 20);
      });
      setNewCount(c => c + 1);
      startSiren(); // 🚨 start continuous siren
    });

    // Stop siren when a request is locked / accepted by anyone (including this doc)
    socket.on('emergency-locked', ({ requestId }) => {
      setAlerts(prev => {
        const updated = prev.map(a => a._id === requestId ? { ...a, status: 'Approved' } : a);
        const stillPending = updated.some(a => ['Pending', 'Waiting for Doctor Approval'].includes(a.status));
        if (!stillPending) stopSiren();
        return updated;
      });
    });

    socket.on('emergency-status-updated', ({ request }) => {
      setAlerts(prev => {
        const updated = prev.map(a => a._id === request._id ? request : a);
        const stillPending = updated.some(a => ['Pending', 'Waiting for Doctor Approval'].includes(a.status));
        if (!stillPending) stopSiren();
        return updated;
      });
    });

    socket.on('emergency-expired', ({ requestId }) => {
      setAlerts(prev => {
        const updated = prev.filter(a => a._id !== requestId);
        const stillPending = updated.some(a => ['Pending', 'Waiting for Doctor Approval'].includes(a.status));
        if (!stillPending) stopSiren();
        return updated;
      });
    });

    return () => { socket.disconnect(); stopSiren(); };
  }, [dtoken, profileData, backendurl]);

  const handleOpen = () => {
    setIsOpen(p => !p);
    if (!isOpen) setNewCount(0);
  };

  const handleDismiss = (id, e) => {
    e.stopPropagation();
    setAlerts(prev => {
      const updated = prev.filter(a => a._id !== id);
      const stillPending = updated.some(a => ['Pending', 'Waiting for Doctor Approval'].includes(a.status));
      if (!stillPending) stopSiren();
      return updated;
    });
  };

  const handleStopSiren = (e) => {
    e.stopPropagation();
    stopSiren();
  };

  const handleGoToDesk = () => { setIsOpen(false); navigate('/doctor-emergencies'); };

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getTypeEmoji = (type) => {
    const map = { 'Critical Injury': '🩸', 'Poisoning': '☠️', 'Cardiac Arrest': '❤️', 'Fracture': '🦴', 'Respiratory Distress': '🫁' };
    return map[type] || '🚨';
  };

  if (!dtoken) return null;

  const pendingAlerts = alerts.filter(a => ['Pending', 'Waiting for Doctor Approval'].includes(a.status));
  const isSirenOn = sirenActiveRef.current;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className={`relative p-2 rounded-xl transition-all group ${newCount > 0 ? 'text-rose-600 bg-rose-50' : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'}`}
        title="Emergency Alerts"
      >
        <motion.div
          animate={newCount > 0 ? { rotate: [0, -20, 20, -15, 15, -5, 5, 0] } : {}}
          transition={{ duration: 0.6, repeat: newCount > 0 ? Infinity : 0, repeatDelay: 2.5 }}
        >
          <Bell className="w-5 h-5" />
        </motion.div>

        {newCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-rose-500 text-white text-[9px] font-black rounded-full border-2 border-white px-1"
          >
            {newCount > 9 ? '9+' : newCount}
          </motion.span>
        )}
        {newCount === 0 && (
          <span className={`absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-white ${alerts.length > 0 ? 'bg-rose-400' : 'bg-slate-300'}`} />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full mt-3 w-80 sm:w-[22rem] bg-white/98 backdrop-blur-xl border border-rose-100 rounded-2xl shadow-2xl z-[9999] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-600 to-amber-600 text-white">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest">Emergency Alerts</span>
                {pendingAlerts.length > 0 && (
                  <span className="text-[9px] font-black bg-white/25 rounded-full px-2 py-0.5 animate-pulse">
                    {pendingAlerts.length} LIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {/* Stop siren button */}
                {isSirenOn && (
                  <button
                    onClick={handleStopSiren}
                    title="Mute siren"
                    className="flex items-center gap-1 text-[10px] font-black bg-white/20 hover:bg-white/30 rounded-lg px-2 py-1 transition"
                  >
                    <VolumeX className="w-3 h-3" /> Mute
                  </button>
                )}
                <button
                  onClick={handleGoToDesk}
                  className="flex items-center gap-1 text-[10px] font-black bg-white/20 hover:bg-white/30 rounded-lg px-2 py-1 transition"
                >
                  Desk <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* District */}
            <div className="px-4 py-2 bg-rose-50 border-b border-rose-100 flex items-center gap-2">
              <MapPin className="w-3 h-3 text-rose-500" />
              <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">
                {(profileData?.emergencyProfile?.activeDistrict || profileData?.address?.Location || 'District Not Set').toUpperCase()}
              </span>
            </div>

            {/* Alert list */}
            <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-50">
              {alerts.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="text-3xl mb-2">🛡️</div>
                  <p className="text-xs font-bold text-slate-500">No incoming emergencies</p>
                  <p className="text-[10px] text-slate-400 mt-1">Your district is clear</p>
                </div>
              ) : (
                alerts.map(alert => {
                  const isPending = ['Pending', 'Waiting for Doctor Approval'].includes(alert.status);
                  const subPlan = alert.userId?.subscription?.plan || 'None';
                  const badge = getSubscriptionBadge(subPlan);

                  return (
                    <div
                      key={alert._id}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-rose-50/50 transition-colors cursor-pointer group ${isPending ? 'bg-rose-50/30' : ''}`}
                      onClick={handleGoToDesk}
                    >
                      <div className="text-xl flex-shrink-0 mt-0.5">{getTypeEmoji(alert.emergencyType)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-black text-slate-800 truncate">{alert.emergencyType || 'Emergency'}</p>
                          <span className={`text-[9px] font-black rounded-full px-1.5 py-0.5 ${badge.color}`}>
                            {badge.label} · {badge.fee}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {alert.isStray ? '🐕 Stray' : '🐾 Pet'} · {alert.district}
                        </p>
                        <p className={`text-[9px] font-bold mt-1 flex items-center gap-1 ${isPending ? 'text-rose-500' : 'text-slate-400'}`}>
                          {isPending && <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse inline-block" />}
                          {alert.status} · {formatTime(alert.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={e => handleDismiss(alert._id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-all flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {alerts.length > 0 && (
                <button
                  onClick={() => { setAlerts([]); stopSiren(); }}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={handleGoToDesk}
                className="ml-auto text-[10px] font-black text-rose-600 hover:underline flex items-center gap-1"
              >
                Open Emergency Desk <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmergencyAlertBell;
