import React, { useContext, useState, useRef, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Register from './pages/Register';
import FaceVerify from './pages/FaceVerify';
import CSDashboard from './pages/CSDashboard';
import ComplaintQueue from './pages/ComplaintQueue';
import TicketDetail from './pages/TicketDetail';
import EmployeeProfile from './pages/EmployeeProfile';
import AdminChat from './pages/AdminChat';
import Customer360 from './pages/Customer360';
import Notifications from './pages/Notifications';
import CSLeaderboard from './pages/CSLeaderboard';
import IncomingRequestModal from './components/IncomingRequestModal';
import BreakOverlay from './components/BreakOverlay';
import PostBreakVerifyOverlay from './components/PostBreakVerifyOverlay';
import EarlyLogoutModal from './components/EarlyLogoutModal';
import ShiftTimerBar from './components/ShiftTimerBar';
import ScreenRecordOverlay from './components/ScreenRecordOverlay';

import { CSContext } from './context/CSContext';
import { FaCommentAlt, FaPause, FaSignOutAlt, FaChevronDown, FaChevronUp, FaCheck, FaBars, FaUser, FaFileAlt, FaChartBar, FaBell, FaTrophy } from 'react-icons/fa';

const PrivateRoute = ({ children }) => {
  const { cstoken, loading } = useContext(CSContext);
  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return cstoken ? children : <Navigate to="/login" />;
};

/* ────────────────────────────────────────────
   Break duration dropdown (self-closing on outside click)
──────────────────────────────────────────── */
const BreakButton = () => {
  const { startBreak, isBreakActive, shiftBreakCount } = useContext(CSContext);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const ref = useRef(null);

  const MAX_BREAKS = 2;
  const breaksLeft = Math.max(0, MAX_BREAKS - (shiftBreakCount || 0));
  const maxReached = breaksLeft === 0;
  const disabled = isBreakActive || maxReached;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleStart = (mins) => {
    startBreak(mins);
    setOpen(false);
    setCustom('');
  };

  const BreakDots = () => (
    <div className="flex gap-1 items-center">
      {Array.from({ length: MAX_BREAKS }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-500 ${
            i < breaksLeft
              ? isBreakActive ? 'bg-amber-400 ring-4 ring-amber-400/20' : 'bg-amber-500 shadow-sm shadow-amber-200'
              : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className={`group flex items-center justify-center gap-2.5 h-10 px-4 rounded-2xl text-sm font-bold transition-all duration-300 select-none ${
          isBreakActive
            ? 'bg-amber-50 text-amber-600 border border-amber-200 cursor-not-allowed shadow-inner'
            : maxReached
            ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200'
            : open
            ? 'bg-amber-100 text-amber-700 border border-amber-300 scale-95'
            : 'bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-600 border border-slate-200 hover:border-amber-200 hover:shadow-md active:scale-95'
        }`}
      >
        <div className={`p-1.5 rounded-lg transition-colors ${isBreakActive ? 'bg-amber-100' : 'bg-slate-100 group-hover:bg-amber-100'}`}>
          <FaPause className={`text-[10px] ${isBreakActive ? 'text-amber-600' : 'text-slate-500 group-hover:text-amber-600'}`} />
        </div>
        <span className="hidden lg:inline whitespace-nowrap">
          {isBreakActive ? 'On Break' : maxReached ? 'No Breaks' : 'Take Break'}
        </span>
        <BreakDots />
        {!disabled && (
          <FaChevronUp className={`text-[10px] opacity-40 transition-transform duration-300 ${open ? 'rotate-180 opacity-100' : 'group-hover:opacity-70'}`} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-3 w-64 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden z-[300] animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">
          <div className="px-5 pt-4 pb-3 border-b border-slate-100/50 flex items-center justify-between bg-gradient-to-br from-white/50 to-amber-50/30">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Quick Breaks</p>
              <p className="text-[11px] text-amber-600/80 font-medium">{breaksLeft} of {MAX_BREAKS} remaining</p>
            </div>
            <div className="bg-white/80 p-2 rounded-xl shadow-sm border border-white/50">
               <BreakDots />
            </div>
          </div>

          <div className="p-2 grid grid-cols-2 gap-2">
            {[5, 10, 15, 30].map(m => (
              <button
                key={m}
                onClick={() => handleStart(m)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-amber-500 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 group"
              >
                <span className="text-lg mb-0.5">{m}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-60 group-hover:opacity-100">Mins</span>
              </button>
            ))}
          </div>

          <div className="px-4 pb-4 pt-2 border-t border-slate-100/50">
            <p className="text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-tight">Custom Duration</p>
            <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
              <input
                type="number"
                min={1}
                max={30}
                value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder="1-30 min"
                className="flex-1 bg-transparent px-3 py-2 text-xs font-bold text-slate-700 placeholder:text-slate-300 outline-none"
              />
              <button
                onClick={() => {
                  const v = parseInt(custom);
                  if (v > 0 && v <= 30) handleStart(v);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-lg shadow-amber-500/30 transition-all active:scale-95"
              >
                START
              </button>
            </div>
          </div>

          <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100/50">
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">
              Timer pauses during breaks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────
   Main Sidebar
──────────────────────────────────────────── */
const Sidebar = ({ isOpen, setIsOpen }) => {
  const { employee, requestEarlyLogout, shiftStarted, shiftCompleted, logout, unreadCsMessagesCount, isRecording } = useContext(CSContext);
  const location = useLocation();

  if (!employee) return null;

  const defaultPic = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=6366f1&color=fff`;

  const navLink = (to, label, icon, badgeCount = 0) => {
    const active = to === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(to);

    return (
      <Link
        to={to}
        onClick={() => setIsOpen(false)}
        className={`group flex items-center gap-4 px-5 py-4 rounded-2xl text-[13px] font-black transition-all duration-300 ${
          active
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]'
            : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
        }`}
      >
        {icon && (
          <span className={`relative text-lg transition-transform duration-300 ${active ? 'scale-110' : 'opacity-40 group-hover:opacity-100 group-hover:scale-110'}`}>
            {icon}
            {badgeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full border border-white px-1">
                {badgeCount}
              </span>
            )}
          </span>
        )}
        <span className="tracking-tight">{label}</span>
        {active && (
           <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse"></span>
        )}
      </Link>
    );
  };

  const handleLogout = () => (!shiftStarted || shiftCompleted) ? logout() : requestEarlyLogout();

  return (
    <>
      {/* Mobile Hamburger Toggle (Top Bar on Mobile Only) */}
      <div className="lg:hidden fixed top-0 left-0 w-full z-[90] px-4 py-3 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
           <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black text-sm">P</div>
           <span className="font-black text-sm tracking-tighter text-slate-800">PawVaidya <span className="text-emerald-600">CS</span></span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 flex items-center justify-center text-slate-600 bg-slate-50 rounded-xl"
        >
          <FaBars />
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar Container */}
      <aside className={`fixed top-0 left-0 h-full z-[110] transition-all duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} w-72 bg-white border-r border-slate-100 flex flex-col p-5 shadow-2xl lg:shadow-none`}>
        
        {/* ── Brand Section ── */}
        <div className="mb-10 px-2">
           <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 group-hover:rotate-6 transition-transform">
                <span className="text-white font-black text-2xl">P</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-slate-800 leading-none group-hover:text-emerald-600 transition-colors">
                  PawVaidya
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/50 leading-none mt-1">
                  Support Portal
                </span>
              </div>
           </Link>
        </div>

        {/* ── Navigation Links ── */}
        <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar py-2">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 px-2">Menu</p>
           {navLink('/', 'Dashboard', <FaChartBar />)}
           {navLink('/queue', 'Complaint Queue', <FaFileAlt />)}
           {navLink('/customer-360', 'Customer 360', <FaUser />)}
           {navLink('/chat', 'Admin Comms', <FaCommentAlt />)}
           {navLink('/profile', 'My Performance', <FaChartBar />)}
           {navLink('/leaderboard', 'Speedway Arena', <FaTrophy />)}
           {navLink('/notifications', 'Notifications', <FaBell />, unreadCsMessagesCount)}
        </div>

        {/* ── Functional Section (Timer + Breaks) ── */}
        {shiftStarted && (
          <div className="mt-auto space-y-4 pt-6 border-t border-slate-50">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Live Session</p>
             {isRecording && (
               <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 rounded-2xl border border-rose-100 text-rose-600 text-[10px] font-black animate-pulse mx-2">
                 <span className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
                 <span>RECORDING SCREEN ACTIVE</span>
               </div>
             )}
             <div className="p-1 bg-slate-50/80 rounded-3xl border border-slate-100 flex flex-col gap-2">
                <div className="flex items-center justify-center py-1">
                   <ShiftTimerBar />
                </div>
                <BreakButton />
             </div>
          </div>
        )}

        {/* ── Agent Profile Section ── */}
        <div className="mt-6 pt-6 border-t border-slate-50">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="relative shrink-0">
                    <img
                      src={employee.profilePic || defaultPic}
                      alt={employee.name}
                      className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-50 shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm ring-2 ring-emerald-500/20" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800 leading-tight truncate max-w-[120px]">
                      {employee.name}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500 leading-tight uppercase tracking-wider">
                      On Duty
                    </span>
                 </div>
              </div>
              
              <button
                onClick={handleLogout}
                title={shiftCompleted ? 'Complete shift' : 'Request leave'}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
                  shiftCompleted
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:shadow-lg hover:shadow-red-500/10'
                }`}
              >
                {shiftCompleted ? <FaCheck /> : <FaSignOutAlt />}
              </button>
           </div>
        </div>
      </aside>
    </>
  );
};

/* ────────────────────────────────────────────
   App Root
──────────────────────────────────────────── */
const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/face-verify'].includes(location.pathname);
  const { isUploadingRecording } = useContext(CSContext);

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full bg-slate-950 overflow-hidden relative">
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="light" />
        <Routes>
          <Route path="/login"       element={<Login />} />
          <Route path="/register"    element={<Register />} />
          <Route path="/face-verify" element={<FaceVerify />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="light" />
      <IncomingRequestModal />
      <BreakOverlay />
      <PostBreakVerifyOverlay />
      <EarlyLogoutModal />
      <ScreenRecordOverlay />

      {isUploadingRecording && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-emerald-500/20" />
            <h3 className="text-white text-lg font-black tracking-wider uppercase">Uploading Screen Recording</h3>
            <p className="text-white/60 text-sm">Saving session logs to Firebase storage, please wait...</p>
          </div>
        </div>
      )}
      
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <main className="flex-1 transition-all duration-500 lg:ml-72 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-10">
          <Routes>
            <Route path="/"            element={<PrivateRoute><CSDashboard /></PrivateRoute>} />
            <Route path="/queue"       element={<PrivateRoute><ComplaintQueue /></PrivateRoute>} />
            <Route path="/ticket/:id"  element={<PrivateRoute><TicketDetail /></PrivateRoute>} />
            <Route path="/customer-360" element={<PrivateRoute><Customer360 /></PrivateRoute>} />
            <Route path="/profile"     element={<PrivateRoute><EmployeeProfile /></PrivateRoute>} />
            <Route path="/leaderboard" element={<PrivateRoute><CSLeaderboard /></PrivateRoute>} />
            <Route path="/chat"        element={<PrivateRoute><AdminChat /></PrivateRoute>} />
            <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;

