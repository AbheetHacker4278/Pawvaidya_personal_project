import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Clock, CheckCircle, Video, MessageSquare, Phone, MapPin, User,
  Calendar, Activity, RefreshCw, AlertCircle, Sparkles, Filter, Check, X, ClipboardList,
  ExternalLink, Heart, Settings, ShieldCheck
} from 'lucide-react';

// Inline Active countdown timer
const RequestTimer = ({ createdAt, onTimeout }) => {
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

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border transition-all ${
      timeLeft < 60 
        ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse scale-105 shadow-sm shadow-rose-100'
        : 'bg-amber-50 border-amber-200 text-[#c8860a]'
    }`}>
      <Clock className={`w-3.5 h-3.5 ${timeLeft < 60 ? 'animate-spin' : ''}`} />
      {timeLeft > 0 ? `${minutes}:${seconds < 10 ? '0' : ''}${seconds} Window` : 'Expired'}
    </span>
  );
};

// ─── Web Audio API Emergency Siren Synthesizer ──────────────────────────────────
// Uses native browser API – no CDN, no 404s, zero latency, works offline
const playEmergencySiren = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (freq, startTime, duration, gainVal = 0.15) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);
      gainNode.gain.setValueAtTime(gainVal, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration - 0.05);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = audioCtx.currentTime;
    playTone(880, now,        0.25); // High A - urgent burst
    playTone(660, now + 0.3,  0.25); // Lower  - response drop
    playTone(880, now + 0.6,  0.15); // High A - second burst
    playTone(1046, now + 0.8, 0.35); // C6     - peak alert
    playTone(880, now + 1.2,  0.4);  // Final A - hold
  } catch (err) {
    console.warn('Web Audio API siren blocked (requires user gesture first):', err.message);
  }
};

const DoctorEmergencies = () => {
  const { dtoken, profileData, getProfileData, backendurl } = useContext(DoctorContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // pending, active, completed, settings
  const [processingId, setProcessingId] = useState(null);
  const [emergencySettings, setEmergencySettings] = useState({
    isEmergencyAvailable: true,
    activeDistrict: '',
    activeState: '',
    maxConcurrentEmergencies: 3
  });
  const [updatingSettings, setUpdatingSettings] = useState(false);

  const fetchEmergencies = async (showToast = false) => {
    try {
      if (showToast) setLoading(true);
      const { data } = await axios.get(backendurl + '/api/emergency/requests', { headers: { dtoken } });
      if (data.success) {
        setRequests(data.requests);
        if (showToast) toast.success("Live list synchronized.");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching doctor emergencies:", error);
      toast.error("Failed to connect to emergency records.");
    } finally {
      if (showToast) setLoading(false);
    }
  };

  useEffect(() => {
    if (profileData) {
      // Load emergency settings from profileData
      if (profileData?.emergencyProfile) {
        setEmergencySettings({
          isEmergencyAvailable: profileData.emergencyProfile.isEmergencyAvailable,
          activeDistrict: profileData.emergencyProfile.activeDistrict,
          activeState: profileData.emergencyProfile.activeState,
          maxConcurrentEmergencies: profileData.emergencyProfile.maxConcurrentEmergencies || 3
        });
      } else {
        // Fallback to address data
        setEmergencySettings(prev => ({
          ...prev,
          activeDistrict: profileData?.address?.Location || '',
          activeState: profileData?.address?.State || ''
        }));
      }
    }
  }, [profileData]);

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setUpdatingSettings(true);
    try {
      const { data } = await axios.post(
        backendurl + '/api/emergency/update-availability',
        emergencySettings,
        { headers: { dtoken } }
      );
      if (data.success) {
        toast.success("Emergency settings updated successfully!");
        getProfileData(); // Refresh context
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdatingSettings(false);
    }
  };

  useEffect(() => {
    if (dtoken) {
      if (!profileData) {
        getProfileData();
      }
      fetchEmergencies(true);
    }
  }, [dtoken]);

  // Real-time socket sync
  useEffect(() => {
    if (!profileData || !profileData._id) return;

    const socket = io(backendurl, {
      withCredentials: true,
      transports: ['polling', 'websocket']
    });

    const cleanDistrict = (profileData.emergencyProfile?.activeDistrict || profileData.address?.Location || "").trim().toUpperCase();

    // Register doctor to emergency alerts
    socket.emit('register-doctor-emergency', {
      docId: profileData._id,
      district: cleanDistrict
    });

    console.log("Registered for emergency alerts in district:", cleanDistrict);

    // Handle WebSocket live push alerts
    socket.on('new-emergency-alert', ({ request }) => {
      // Safety check: ensure doctor is still on this route before firing toast
      if (window.location.pathname !== '/doctor-emergencies') {
          console.log("Websocket: Suppressing emergency alert as doctor is not on the emergency desk.");
          return;
      }

      console.log("Websocket: New emergency in district alert received!", request);
      // Fire dual-tone Web Audio API siren
      playEmergencySiren();
      // Prepend if not exist
      setRequests(prev => {
        if (prev.some(r => r._id === request._id)) return prev;
        toast.error(`🚨 EMERGENCY IN ${cleanDistrict}: A new request was broadcasted!`, {
          position: "top-center",
          autoClose: 10000,
          theme: "dark"
        });
        return [request, ...prev];
      });
    });

    // Handle when another doctor locks-in claim (disappear instantly)
    socket.on('emergency-locked', ({ requestId }) => {
      console.log("Websocket: Emergency locked by another doc:", requestId);
      setRequests(prev => {
        const target = prev.find(r => r._id === requestId);
        if (target && target.docId?._id !== profileData._id) {
          toast.warning("Request claimed and locked by another veterinarian.", { autoClose: 2000 });
        }
        return prev.filter(r => r._id !== requestId || r.docId?._id === profileData._id);
      });
    });

    // Handle general status updates
    socket.on('emergency-status-updated', ({ request }) => {
      console.log("Websocket: Emergency request updated:", request);
      setRequests(prev => prev.map(r => r._id === request._id ? request : r));
    });

    // Handle automatic exipry removal
    socket.on('emergency-expired', ({ requestId }) => {
      console.log("Websocket: Emergency request expired:", requestId);
      setRequests(prev => prev.filter(r => r._id !== requestId));
    });

    return () => {
      socket.disconnect();
    };
  }, [profileData, backendurl]);

  // Handle Approve/Lock Claim
  const handleApproveClaim = async (requestId) => {
    try {
      setProcessingId(requestId);
      const { data } = await axios.post(
        backendurl + '/api/emergency/status',
        { requestId, status: 'Approved' },
        { headers: { dtoken } }
      );

      if (data.success) {
        toast.success("Concurrency Claim Locked! Case assigned to you.");
        fetchEmergencies();
        setActiveTab('active');
      } else {
        toast.error(data.message || "Failed to claim request.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Decline/Reject
  const handleDeclineRequest = async (requestId) => {
    const reason = prompt("Please provide a cancellation reason:");
    if (reason === null) return; // User cancelled prompt

    try {
      setProcessingId(requestId);
      const { data } = await axios.post(
        backendurl + '/api/emergency/status',
        { requestId, status: 'Rejected', reason: reason || "Doctor declined case." },
        { headers: { dtoken } }
      );

      if (data.success) {
        toast.warn("Emergency declined and removed.");
        fetchEmergencies();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Complete Consultation
  const handleCompleteConsultation = async (requestId) => {
    const conf = window.confirm("Are you sure you want to finalize this case and close consultation?");
    if (!conf) return;

    try {
      setProcessingId(requestId);
      const { data } = await axios.post(
        backendurl + '/api/emergency/status',
        { requestId, status: 'Completed' },
        { headers: { dtoken } }
      );

      if (data.success) {
        toast.success("Consultation successfully closed and archived.");
        fetchEmergencies();
        setActiveTab('completed');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Helper to resolve User subscription visual tags
  const getSubscriptionBadge = (sub) => {
    if (!sub || sub.status !== 'Active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 border border-slate-200 text-slate-600 uppercase">
          Non-Subscriber
        </span>
      );
    }

    const plan = sub.planName?.toUpperCase() || 'STANDARD';
    if (plan.includes('PLATINUM')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-700 uppercase animate-pulse shadow-sm shadow-indigo-100">
          <Sparkles className="w-3 h-3" /> Platinum Tier
        </span>
      );
    } else if (plan.includes('GOLD')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-50 border border-amber-200 text-[#c8860a] uppercase shadow-sm shadow-amber-100">
          <Heart className="w-3 h-3" /> Gold Tier
        </span>
      );
    } else if (plan.includes('SILVER')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase">
          Silver Tier
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-green-50 border border-green-200 text-green-700 uppercase">
        {plan} Tier
      </span>
    );
  };

  // Filters logic
  const pendingRequests = requests.filter(r => 
    ['Pending', 'Waiting for Doctor Approval'].includes(r.status) && 
    (!r.docId || r.docId._id === profileData?._id)
  );

  const activeConsultations = requests.filter(r => 
    ['Payment Pending', 'Approved', 'Active'].includes(r.status) && 
    r.docId?._id === profileData?._id
  );

  const completedCases = requests.filter(r => 
    ['Completed', 'Rejected'].includes(r.status) && 
    r.docId?._id === profileData?._id
  );

  return (
    <div className="m-6 animate-fadeIn">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-rose-500 to-amber-500 p-3.5 rounded-3xl text-white shadow-xl shadow-rose-200/50">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Emergency Desk</h1>
            <p className="text-slate-500 text-sm font-bold flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-rose-500" />
              Active District: <strong className="text-rose-600 uppercase">{profileData?.emergencyProfile?.activeDistrict || profileData?.address?.Location || 'Fetching...'}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchEmergencies(true)}
          disabled={loading}
          className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-black shadow-sm transition-all hover:scale-105 active:scale-95 active:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Force Sync Desk
        </button>
      </div>

      {/* THREE TABS NAV */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8 max-w-xl shadow-inner border border-slate-200/40">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all ${
            activeTab === 'pending'
              ? 'bg-white text-rose-600 shadow-md'
              : 'text-slate-600 hover:text-slate-950 hover:bg-white/40'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Pending Alerts
          {pendingRequests.length > 0 && (
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-black animate-bounce">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all ${
            activeTab === 'active'
              ? 'bg-white text-amber-600 shadow-md'
              : 'text-slate-600 hover:text-slate-950 hover:bg-white/40'
          }`}
        >
          <Activity className="w-4 h-4" />
          In Session
          {activeConsultations.length > 0 && (
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-black">
              {activeConsultations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all ${
            activeTab === 'completed'
              ? 'bg-white text-emerald-600 shadow-md'
              : 'text-slate-600 hover:text-slate-950 hover:bg-white/40'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Resolved Cases
          {completedCases.length > 0 && (
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-black">
              {completedCases.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all ${
            activeTab === 'settings'
              ? 'bg-white text-indigo-600 shadow-md'
              : 'text-slate-600 hover:text-slate-950 hover:bg-white/40'
          }`}
        >
          <Settings className="w-4 h-4" />
          Desk Settings
        </button>
      </div>

      {/* CASE SHEETS LISTS CONTAINER */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
        >
          
          {/* PENDING ALERTS TAB */}
          {activeTab === 'pending' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {pendingRequests.length === 0 ? (
                <div className="col-span-full py-16 px-6 bg-white border border-slate-200/60 rounded-3xl text-center shadow-sm">
                  <div className="inline-flex p-4 bg-rose-50 border border-rose-100 rounded-full text-rose-500 mb-4 animate-pulse">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800">Clear Horizon</h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
                    There are currently no active veterinary emergency broadcasts reported inside the <span className="text-rose-500 uppercase font-black">{profileData?.emergencyProfile?.activeDistrict || profileData?.address?.Location}</span> district.
                  </p>
                </div>
              ) : (
                pendingRequests.map(req => (
                  <motion.div
                    key={req._id}
                    layoutId={req._id}
                    className="bg-white border-2 border-rose-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                  >
                    {/* Urgency header backdrop */}
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-rose-500 to-amber-500" />
                    
                    <div>
                      {/* Top status headers */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 mt-2">
                        <span className="px-3 py-1 rounded-xl text-[10px] font-black bg-rose-50 border border-rose-200 text-rose-600 uppercase tracking-wide">
                          🚨 IMMEDIATE BROADCAST
                        </span>
                        <RequestTimer createdAt={req.createdAt} onTimeout={fetchEmergencies} />
                      </div>

                      {/* Pet & Owner Information */}
                      <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shadow-inner">
                          {req.isStray ? '🐕‍🦺' : req.petId?.image ? <img src={req.petId.image} className="w-full h-full object-cover rounded-2xl" /> : '🐾'}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient</p>
                          <h4 className="text-sm font-black text-slate-800">
                            {req.isStray ? `Stray Animal (${req.strayDetails?.petType || 'Other'})` : req.petId?.name || 'Registered Pet'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold text-slate-500">Owner: {req.userId?.name || 'Anonymous citizen'}</span>
                            {getSubscriptionBadge(req.userId?.subscription)}
                          </div>
                        </div>
                      </div>

                      {/* Symptoms Card Details */}
                      <div className="space-y-3.5 text-xs mb-6">
                        <div className="flex items-start gap-2 bg-[#fffcfb] border border-rose-100/50 p-3 rounded-2xl">
                          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Complaint Classification</p>
                            <p className="font-bold text-slate-800 mt-0.5">{req.emergencyType}</p>
                          </div>
                        </div>

                        {req.description && (
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Situation Description</p>
                            <p className="text-slate-600 italic mt-1 leading-relaxed">"{req.description}"</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consultation Mode</p>
                            <p className="font-extrabold text-slate-700 flex items-center gap-1.5 mt-0.5">
                              <Video className="w-3.5 h-3.5 text-indigo-500" /> Live Video
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timestamp</p>
                            <p className="font-bold text-slate-700 mt-0.5">
                              {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                      <button
                        onClick={() => handleDeclineRequest(req._id)}
                        disabled={processingId !== null}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 transition"
                      >
                        <X className="w-4 h-4 text-slate-400" /> Decline
                      </button>
                      <button
                        onClick={() => handleApproveClaim(req._id)}
                        disabled={processingId !== null}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-xs font-black text-white hover:opacity-90 shadow-md shadow-emerald-100 transition active:scale-95"
                      >
                        <Check className="w-4 h-4 stroke-[3]" /> Approve & Lock Claim
                      </button>
                    </div>

                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* ACTIVE CONSULTATIONS TAB */}
          {activeTab === 'active' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {activeConsultations.length === 0 ? (
                <div className="col-span-full py-16 px-6 bg-white border border-slate-200/60 rounded-3xl text-center shadow-sm">
                  <div className="inline-flex p-4 bg-amber-50 border border-amber-100 rounded-full text-amber-500 mb-4 animate-pulse">
                    <Activity className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800">No Active Case</h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
                    You do not have any claimed active emergencies. When you claim a pending request, it will appear here instantly.
                  </p>
                </div>
              ) : (
                activeConsultations.map(req => (
                  <div
                    key={req._id}
                    className="bg-white border border-amber-200 rounded-3xl p-6 shadow-sm hover:shadow-md relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-amber-500 animate-pulse" />

                    <div>
                      {/* Top indicators */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 mt-2">
                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wide flex items-center gap-1 ${
                          req.status === 'Payment Pending'
                            ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                          {req.status === 'Payment Pending' ? 'Awaiting User Payment' : 'Live Consultation Session'}
                        </span>
                        
                        <span className="text-xs font-bold text-slate-400">
                          ID: #{req._id.substring(req._id.length - 6).toUpperCase()}
                        </span>
                      </div>

                      {/* Pet Card */}
                      <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shadow-inner">
                          {req.isStray ? '🐕‍🦺' : req.petId?.image ? <img src={req.petId.image} className="w-full h-full object-cover rounded-2xl" /> : '🐾'}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Details</p>
                          <h4 className="text-sm font-black text-slate-800">
                            {req.isStray ? `Stray Animal (${req.strayDetails?.petType || 'Other'})` : req.petId?.name || 'Registered Pet'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold text-slate-500">Contact: {req.userId?.name || 'Anonymous'}</span>
                            {getSubscriptionBadge(req.userId?.subscription)}
                          </div>
                        </div>
                      </div>

                      {/* Contact Channels */}
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-6 space-y-3.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Case & Contact Sheet</p>
                        
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span className="text-slate-400 font-medium">Emergency Classification:</span>
                          <span className="text-rose-600">{req.emergencyType}</span>
                        </div>

                        {req.userId?.phone && (
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-t border-slate-200/50 pt-2">
                            <span className="text-slate-400 font-medium flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Line:
                            </span>
                            <a href={`tel:${req.userId.phone}`} className="text-indigo-600 hover:underline">
                              +91 {req.userId.phone}
                            </a>
                          </div>
                        )}

                        {req.userId?.email && (
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-t border-slate-200/50 pt-2">
                            <span className="text-slate-400 font-medium">Email Address:</span>
                            <span className="text-slate-600">{req.userId.email}</span>
                          </div>
                        )}

                        {req.isStray && req.strayDetails?.location && (
                          <div className="flex items-start gap-1.5 text-xs font-bold text-slate-700 border-t border-slate-200/50 pt-2">
                            <MapPin className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-slate-400 font-medium">Reported Spot:</span>
                              <p className="text-slate-600 mt-0.5 leading-relaxed font-bold">{req.strayDetails.location}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operational Action Controls */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2.5">
                      <div className="flex gap-2">
                        {req.userId?.phone && (
                          <a 
                            href={`tel:${req.userId.phone}`}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-700 transition"
                          >
                            <Phone className="w-4 h-4" /> Direct Phone Line
                          </a>
                        )}
                        <a 
                          href={`${window.location.protocol}//${window.location.host}/doctor-chat`} 
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-black text-slate-700 transition"
                        >
                          <MessageSquare className="w-4 h-4 text-amber-500" /> Patient Chat
                        </a>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={`${window.location.protocol}//${window.location.host}/doctor-video-call/${req._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:opacity-90 text-xs font-black text-white shadow-md shadow-indigo-100 transition active:scale-95"
                        >
                          <Video className="w-4 h-4 animate-bounce" /> Launch Video Consultation
                        </a>

                        <button
                          onClick={() => handleCompleteConsultation(req._id)}
                          disabled={processingId !== null}
                          className="px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-black text-emerald-700 transition"
                          title="Complete Consultation"
                        >
                          <CheckCircle className="w-4 h-4 inline-block mr-1 stroke-[3]" /> Resolve Case
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800">Emergency Desk Settings</h2>
                    <p className="text-xs text-slate-500 font-bold">Configure how you receive and manage emergency broadcasts</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateSettings} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Response District</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={emergencySettings.activeDistrict}
                          onChange={(e) => setEmergencySettings({...emergencySettings, activeDistrict: e.target.value})}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                          placeholder="e.g. SURAT"
                          required
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold italic">You will only receive siren alerts for emergencies booked in this district.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">State / Region</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={emergencySettings.activeState}
                          onChange={(e) => setEmergencySettings({...emergencySettings, activeState: e.target.value})}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                          placeholder="e.g. GUJARAT"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Concurrent Cases</label>
                      <div className="relative">
                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={emergencySettings.maxConcurrentEmergencies}
                          onChange={(e) => setEmergencySettings({...emergencySettings, maxConcurrentEmergencies: parseInt(e.target.value)})}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                          required
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold italic">Max number of emergency cases you can handle at once.</p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div>
                        <p className="text-xs font-black text-slate-800">Accept Emergency Alerts</p>
                        <p className="text-[10px] text-slate-400 font-bold">Toggle visibility for emergency broadcasts</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEmergencySettings({...emergencySettings, isEmergencyAvailable: !emergencySettings.isEmergencyAvailable})}
                        className={`w-12 h-6 rounded-full relative transition-colors ${emergencySettings.isEmergencyAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${emergencySettings.isEmergencyAvailable ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-4">
                    <button
                      type="submit"
                      disabled={updatingSettings}
                      className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white text-sm font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50"
                    >
                      {updatingSettings ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : "Save Desk Configuration"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        // Play test siren to check audio context
                        playEmergencySiren();
                        toast.info("Testing alarm system... if you don't hear sound, interact with the page and try again.");
                      }}
                      className="px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-black hover:bg-slate-50 transition"
                    >
                      Test Alert Siren
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* RESOLVED CASES TAB */}
          {activeTab === 'completed' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {completedCases.length === 0 ? (
                <div className="col-span-full py-16 px-6 bg-white border border-slate-200/60 rounded-3xl text-center shadow-sm">
                  <div className="inline-flex p-4 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-500 mb-4 animate-pulse">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800">No Resolved Case History</h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
                    You have not finalized any cases inside your personal archive. Closed emergency records will automatically populate here.
                  </p>
                </div>
              ) : (
                completedCases.map(req => (
                  <div
                    key={req._id}
                    className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md relative overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Top tags */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 mt-1">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wide flex items-center gap-1 ${
                          req.status === 'Completed'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-rose-50 border-rose-200 text-rose-600'
                        }`}>
                          {req.status === 'Completed' ? 'RESOLVED & COMPLETED' : 'DECLINED / REJECTED'}
                        </span>
                        
                        <span className="text-xs font-semibold text-slate-400">
                          Date: {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Pet Card */}
                      <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center text-xl">
                          {req.isStray ? '🐕‍🦺' : req.petId?.image ? <img src={req.petId.image} className="w-full h-full object-cover rounded-xl" /> : '🐾'}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">
                            {req.isStray ? `Stray Animal (${req.strayDetails?.petType || 'Other'})` : req.petId?.name || 'Registered Pet'}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5 font-semibold">User: {req.userId?.name || 'Anonymous'}</p>
                        </div>
                      </div>

                      {/* Diagnosis/Log Details */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-600">
                          <span>Classification:</span>
                          <span className="text-slate-800 font-extrabold">{req.emergencyType}</span>
                        </div>

                        <div className="flex items-center justify-between font-bold text-slate-600">
                          <span>Payment Method:</span>
                          <span className="text-slate-800 uppercase font-black">{req.paymentDetails?.paymentMethod || 'Wallet'}</span>
                        </div>

                        <div className="flex items-center justify-between font-bold text-slate-600">
                          <span>Total Collected Revenue:</span>
                          <span className="text-[#3d2b1f] font-black">₹{req.amount}</span>
                        </div>

                        {req.statusHistory && req.statusHistory.length > 0 && (
                          <div className="bg-slate-50 border border-slate-100/60 p-3 rounded-2xl mt-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                              <ClipboardList className="w-3.5 h-3.5 text-slate-400" /> Resolution Audit Trails
                            </p>
                            {req.statusHistory.map((history, hIdx) => (
                              <div key={hIdx} className="text-[10px] font-bold text-slate-500 flex items-center justify-between py-1 border-t border-slate-100 first:border-0 mt-1">
                                <span className="capitalize">{history.updatedBy}: moved to <strong className="text-slate-700">{history.status}</strong></span>
                                <span className="opacity-70">{new Date(history.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Report action buttons */}
                    {req.attachments && req.attachments.length > 0 && (
                      <div className="border-t border-slate-100 pt-4 mt-4 flex flex-wrap gap-2">
                        {req.attachments.map((file, fIdx) => (
                          <a
                            key={fIdx}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-xs font-extrabold text-slate-700 transition"
                          >
                            Medical Sheet {fIdx + 1} <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    )}

                  </div>
                ))
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
};

export default DoctorEmergencies;
