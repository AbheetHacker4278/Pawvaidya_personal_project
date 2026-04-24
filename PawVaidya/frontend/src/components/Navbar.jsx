import React, { useContext, useEffect, useState, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next';
import assets from '../assets/assets_frontend/assets';
import PlatinumSVG from '../assets/assets_frontend/Platinum.svg';
import GoldSVG from '../assets/assets_frontend/Gold.svg';
import SilverSVG from '../assets/assets_frontend/Silver.svg';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import LanguageSwitcher from './LanguageSwitcher';
import LocationRefreshButton from './LocationRefreshButton';
import { MapPin, Bell, User, Calendar, LogOut, ChevronDown, X, Menu, AlertCircle, AlertTriangle, Wallet, Home, Stethoscope, Info, Phone, BookOpen, PawPrint, BarChart3, Radio, Video, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Brand palette ────────────────────────────────────────────────────────────
const B = {
  dark: '#2c1e14',
  mid: '#5A4035',
  light: '#7a5a48',
  cream: '#f8f0e3',
  sand: '#e8d5b0',
  amber: '#c8860a',
  gold: '#d4a017',
  pale: '#fdf8f0',
  warmWhite: '#fffaf3',
};

// Primary nav links (always visible)
const PRIMARY_LINKS = [
  { to: '/', labelKey: 'navbar.home', icon: Home },
  { to: '/doctors', labelKey: 'navbar.allDoctors', icon: Stethoscope },
  { to: '/about', labelKey: 'navbar.about', icon: Info },
  { to: '/contact', labelKey: 'navbar.contact', icon: Phone },
  { to: '/my-pets', labelKey: 'navbar.myPets', icon: PawPrint },
];

// Secondary nav links (inside "More" dropdown)
const SECONDARY_LINKS = [
  { to: '/community-blogs', labelKey: 'navbar.communityBlogs', icon: BookOpen },
  { to: '/polls', labelKey: 'navbar.communityPolls', icon: BarChart3 },
  { to: '/live-streams', labelKey: 'navbar.live', icon: Radio, live: true },
  { to: '/video-consultation', label: 'Video Consultation', icon: Video },
];

// All nav links for mobile
const ALL_NAV_LINKS = [...PRIMARY_LINKS, ...SECONDARY_LINKS];

const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    token, settoken, userdata, backendurl,
    setuserdata, setisLoggedin,
    unreadMessages, userLocation, refreshUserLocation,
    authLoading,
  } = useContext(AppContext);

  const activePlan = userdata?.subscription?.status === 'Active' ? userdata?.subscription?.plan : 'None';
  const brandedLogo =
    activePlan === 'Platinum' ? PlatinumSVG :
      activePlan === 'Gold' ? GoldSVG :
        activePlan === 'Silver' ? SilverSVG :
          null;

  const [showMenu, setShowMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const dropdownRef = useRef(null);
  const moreRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = showMenu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMenu]);

  const Logout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendurl + '/api/user/logout', {}, { headers: { token } });
      if (data.success) {
        setisLoggedin(false);
        setuserdata(false);
        settoken(false);
        localStorage.removeItem('token');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendVerificationOtp = async () => {
    try {
      const { data } = await axios.post(`${backendurl}/api/user/send-verify-otp`, {}, { headers: { token } });
      if (data.success) { navigate('/email-verify'); toast.success(data.message); }
      else toast.error(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ─── Desktop Nav Link Renderer ────────────────────────────────────────
  const NavLinkItem = ({ to, labelKey, label, icon: Icon, live }) => (
    <NavLink to={to} className="relative group">
      {({ isActive }) => (
        <div className="relative px-3.5 lg:px-4 py-2 rounded-xl cursor-pointer select-none flex items-center justify-center">
          {/* Active chip background */}
          {isActive && (
            <motion.div
              layoutId="nav-active-chip"
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(253,248,240,0.95))',
                boxShadow: '0 2px 12px rgba(61,43,31,0.10), 0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(200,134,10,0.08) inset',
                zIndex: 0,
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          )}
          {/* Hover background */}
          {!isActive && (
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-250"
              style={{ background: 'rgba(255,255,255,0.6)', zIndex: 0 }}
            />
          )}

          <motion.span
            whileHover={{ y: -1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              color: isActive ? B.dark : B.mid,
              fontWeight: isActive ? 700 : 550,
            }}
            className="relative z-10 flex items-center gap-1.5 text-[13.5px] lg:text-[14px] tracking-[-0.01em]"
          >
            {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'opacity-90' : 'opacity-50 group-hover:opacity-75'} transition-opacity duration-200`} strokeWidth={isActive ? 2.5 : 2} />}
            {live ? (
              <span className="flex items-center gap-1.5">
                {label || (labelKey ? t(labelKey) : '')}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
              </span>
            ) : (
              labelKey ? t(labelKey) : label
            )}
          </motion.span>

          {/* Active gradient underline */}
          {isActive && (
            <motion.div
              layoutId="nav-active-underline"
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[2.5px] rounded-full"
              style={{
                width: '60%',
                background: `linear-gradient(90deg, ${B.amber}, ${B.gold})`,
                boxShadow: `0 1px 6px rgba(200,134,10,0.35)`,
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          )}
        </div>
      )}
    </NavLink>
  );

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 120 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 lg:px-8 xl:px-[10%]"
        style={{
          height: 'var(--navbar-height, 68px)',
          background: isScrolled
            ? 'linear-gradient(180deg, rgba(253,248,240,0.97) 0%, rgba(248,240,227,0.96) 100%)'
            : 'linear-gradient(180deg, rgba(248,240,227,0.98) 0%, rgba(242,228,199,0.96) 100%)',
          borderBottom: `1px solid ${isScrolled ? 'rgba(200,134,10,0.12)' : 'rgba(232,213,176,0.4)'}`,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: isScrolled
            ? '0 4px 32px rgba(61,43,31,0.10), 0 1px 0 rgba(255,255,255,0.7) inset'
            : '0 1px 8px rgba(61,43,31,0.04)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ── Logo ───────────────────────────────────────────────────────── */}
        <div className="relative flex items-center shrink-0 py-2">
          <img
            onClick={() => navigate('/')}
            className="w-36 lg:w-40 xl:w-44 cursor-pointer drop-shadow-sm hover:scale-[1.03] transition-transform duration-300"
            src={brandedLogo || "https://i.ibb.co/R2Y4vBk/Screenshot-2024-11-23-000108-removebg-preview.png"}
            alt="PawVaidya Logo"
          />
          {/* Blacklist Warning Label */}
          {userdata && userdata.isBanned && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -bottom-1 right-0 translate-x-1/4 flex items-center gap-1 px-2 py-0.5 bg-red-100 border border-red-300 rounded-md shadow-sm pointer-events-none"
              style={{ zIndex: 10 }}
            >
              <AlertTriangle className="w-3 h-3 text-red-600" />
              <span className="text-[10px] font-black text-red-700 tracking-widest uppercase leading-none">Banned</span>
            </motion.div>
          )}
        </div>

        {/* ── Desktop Nav Links ───────────────────────────────────────────── */}
        <div
          className="hidden md:flex items-center gap-0.5 lg:gap-0.5 px-2 py-1.5 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(122, 90, 72, 0.06), rgba(200, 134, 10, 0.04))',
            border: '1px solid rgba(122, 90, 72, 0.10)',
            boxShadow: '0 1px 4px rgba(61,43,31,0.03), 0 1px 0 rgba(255,255,255,0.4) inset',
          }}
        >
          {/* Primary nav links */}
          {PRIMARY_LINKS.map((link) => (
            <NavLinkItem key={link.to} {...link} />
          ))}

          {/* Subtle divider */}
          <div className="w-px h-5 mx-1 rounded-full" style={{ background: 'rgba(122, 90, 72, 0.15)' }} />

          {/* "More" dropdown for secondary links */}
          <div className="relative" ref={moreRef}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="relative flex items-center gap-1 px-3 lg:px-3.5 py-2 rounded-xl cursor-pointer select-none group"
              style={{ color: isMoreOpen ? B.dark : B.mid }}
            >
              {isMoreOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.85)',
                    boxShadow: '0 2px 8px rgba(61,43,31,0.08)',
                    zIndex: 0,
                  }}
                />
              )}
              {!isMoreOpen && (
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(255,255,255,0.55)', zIndex: 0 }} />
              )}
              <MoreHorizontal className="relative z-10 w-4 h-4 opacity-70" strokeWidth={2.2} />
              <span className="relative z-10 text-[13.5px] lg:text-[14px] font-medium tracking-[-0.01em]">More</span>
              <motion.div
                className="relative z-10"
                animate={{ rotate: isMoreOpen ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 250, damping: 20 }}
              >
                <ChevronDown className="w-3 h-3 opacity-50" />
              </motion.div>
            </motion.button>

            {/* More Dropdown */}
            <AnimatePresence>
              {isMoreOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] w-56 rounded-2xl overflow-hidden z-50"
                  style={{
                    background: 'rgba(253, 248, 240, 0.98)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(232,213,176,0.6)',
                    boxShadow: '0 16px 40px -8px rgba(61,43,31,0.15), 0 4px 12px rgba(61,43,31,0.06)',
                  }}
                >
                  {/* Arrow */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 rounded-sm"
                    style={{ background: B.pale, borderTop: '1px solid rgba(232,213,176,0.6)', borderLeft: '1px solid rgba(232,213,176,0.6)' }} />

                  <div className="py-2 px-1.5">
                    {SECONDARY_LINKS.map(({ to, labelKey, label, icon: Icon, live }) => (
                      <NavLink key={to} to={to} onClick={() => setIsMoreOpen(false)} className="block">
                        {({ isActive }) => (
                          <motion.div
                            whileHover={{ x: 3, backgroundColor: 'rgba(242, 228, 199, 0.5)' }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-200 ${isActive ? 'bg-amber-50' : ''}`}
                          >
                            <Icon
                              className="w-[18px] h-[18px] shrink-0"
                              style={{ color: isActive ? B.amber : B.light }}
                              strokeWidth={isActive ? 2.2 : 1.8}
                            />
                            <span
                              className="text-[14px] flex items-center gap-2"
                              style={{
                                color: isActive ? B.dark : B.mid,
                                fontWeight: isActive ? 650 : 500,
                              }}
                            >
                              {live ? (
                                <>
                                  {label || (labelKey ? t(labelKey) : '')}
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                  </span>
                                </>
                              ) : (
                                labelKey ? t(labelKey) : label
                              )}
                            </span>
                            {isActive && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: B.amber }} />
                            )}
                          </motion.div>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Verify email pill */}
          {userdata && !userdata.isAccountverified && (
            <motion.li
              whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(192,57,43,0.15)' }}
              whileTap={{ scale: 0.95 }}
              onClick={sendVerificationOtp}
              className="list-none px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ml-1 transition-all"
              style={{ color: '#fff', background: 'linear-gradient(135deg, #e74c3c, #c0392b)', boxShadow: '0 2px 8px rgba(192,57,43,0.2)' }}
            >
              {t('navbar.verifyEmail')}
            </motion.li>
          )}
        </div>

        {/* ── Right side ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 shrink-0">
          <LanguageSwitcher />

          {/* Subtle separator */}
          {token && userdata && (
            <div className="hidden md:block w-px h-6 rounded-full" style={{ background: 'rgba(122, 90, 72, 0.12)' }} />
          )}

          {/* Bell icon (desktop) */}
          {token && userdata && (
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: '0 6px 20px rgba(200,134,10,0.15)' }}
              whileTap={{ scale: 0.93 }}
              onClick={() => navigate('/messages')}
              className="relative p-2.5 rounded-xl transition-all duration-300 shrink-0"
              style={{
                color: B.mid,
                background: 'rgba(255,255,255,0.80)',
                border: '1px solid rgba(232,213,176,0.5)',
                boxShadow: '0 2px 8px rgba(61,43,31,0.05)',
              }}
            >
              <Bell className="w-[18px] h-[18px]" strokeWidth={2} />
              {unreadMessages > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-md ring-2 ring-white px-1"
                >
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </motion.span>
              )}
            </motion.button>
          )}

          {/* Auth loading skeleton */}
          {authLoading ? (
            <div className="hidden md:flex items-center gap-2.5 px-2.5 py-1.5 rounded-2xl border animate-pulse" style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(232,213,176,0.5)' }}>
              <div className="w-8 h-8 rounded-full" style={{ background: 'rgba(200,134,10,0.15)' }} />
              <div className="flex flex-col gap-1">
                <div className="w-20 h-3 rounded-md" style={{ background: 'rgba(122,90,72,0.12)' }} />
                <div className="w-14 h-2 rounded-md" style={{ background: 'rgba(122,90,72,0.08)' }} />
              </div>
              <div className="w-3.5 h-3.5 rounded" style={{ background: 'rgba(122,90,72,0.08)' }} />
            </div>
          ) : token && userdata ? (
            <div className="relative hidden md:block" ref={dropdownRef}>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 6px 24px rgba(61,43,31,0.12)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-2xl border transition-all duration-300 shrink-0"
                style={{
                  background: isDropdownOpen
                    ? 'linear-gradient(135deg, #ede4d8, #f0e8dc)'
                    : 'rgba(255,255,255,0.85)',
                  borderColor: isDropdownOpen ? B.amber : 'rgba(232,213,176,0.65)',
                  boxShadow: isDropdownOpen
                    ? `0 0 0 2px rgba(200,134,10,0.15), 0 4px 16px rgba(61,43,31,0.10)`
                    : '0 2px 8px rgba(61,43,31,0.05)',
                }}
              >
                <div className="relative shrink-0">
                  <img
                    className="w-8 h-8 rounded-full object-cover"
                    style={{ border: `2.5px solid ${B.amber}`, boxShadow: '0 2px 8px rgba(200,134,10,0.15)' }}
                    src={userdata.image}
                    alt="Profile"
                  />
                  {userdata?.subscription?.plan && userdata.subscription.plan !== 'None' ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm ring-1.5 ring-white"
                      style={{
                        background: userdata.subscription.plan === 'Platinum' ? 'linear-gradient(135deg, #a855f7, #6b21a8)' :
                          userdata.subscription.plan === 'Gold' ? 'linear-gradient(135deg, #f59e0b, #b45309)' :
                            'linear-gradient(135deg, #94a3b8, #475569)'
                      }}
                    >
                      {userdata.subscription.plan[0]}
                    </motion.div>
                  ) : (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                  )}
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                  <span className="hidden lg:block text-[13px] font-semibold tracking-tight" style={{ color: B.dark }}>
                    {userdata.name}
                  </span>
                  {userdata?.subscription?.plan && userdata.subscription.plan !== 'None' && (
                    <span className="hidden lg:block text-[9px] font-bold uppercase tracking-wider" style={{ color: B.amber, opacity: 0.7 }}>
                      {userdata.subscription.plan} Member
                    </span>
                  )}
                </div>
                <motion.div animate={{ rotate: isDropdownOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" style={{ color: B.dark }} />
                </motion.div>
              </motion.button>

              {/* Dropdown */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10, transformOrigin: "top right" }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="absolute right-0 top-[calc(100%+12px)] w-64 rounded-2xl overflow-hidden z-50"
                    style={{
                      background: 'rgba(253, 248, 240, 0.98)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      border: `1px solid rgba(232,213,176,0.6)`,
                      boxShadow: `0 20px 48px -12px rgba(61,43,31,0.18), 0 4px 12px rgba(61,43,31,0.06)`,
                    }}
                  >
                    {/* Arrow */}
                    <div className="absolute -top-1.5 right-6 w-3 h-3 rotate-45 rounded-sm"
                      style={{ background: '#f5ede8', borderTop: '1px solid rgba(232,213,176,0.6)', borderLeft: '1px solid rgba(232,213,176,0.6)' }} />

                    {/* User header */}
                    <div className="px-5 py-4 border-b relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #f5ede8, #ede4d8)', borderColor: 'rgba(232,213,176,0.5)' }}>
                      <div className="flex items-center gap-3 relative z-10">
                        <img className="w-11 h-11 rounded-full object-cover shadow-sm" style={{ border: `2.5px solid ${B.amber}` }}
                          src={userdata.image} alt="Profile" />
                        <div className="flex flex-col justify-center">
                          <p className="font-bold text-[15px] leading-tight" style={{ color: B.dark }}>{userdata.name}</p>
                          <p className="text-[12px] opacity-70 mt-0.5" style={{ color: B.light }}>{userdata.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-2 px-1.5">
                      {[
                        { icon: <User className="w-[18px] h-[18px]" />, label: t('navbar.myProfile'), action: () => { navigate('/my-profile'); setIsDropdownOpen(false); } },
                        { icon: <Calendar className="w-[18px] h-[18px]" />, label: t('navbar.myAppointments'), action: () => { navigate('/my-appointments'); setIsDropdownOpen(false); } },
                        { icon: <Calendar className="w-[18px] h-[18px]" />, label: 'PawPlan / Subscription', action: () => { navigate('/subscription'); setIsDropdownOpen(false); } },
                        { icon: <Wallet className="w-[18px] h-[18px]" />, label: 'Paw Wallet', action: () => { navigate('/paw-wallet'); setIsDropdownOpen(false); } },
                        { icon: <Bell className="w-[18px] h-[18px]" />, label: t('navbar.notifications'), badge: unreadMessages, action: () => { navigate('/messages'); setIsDropdownOpen(false); } },
                        { icon: <AlertCircle className="w-[18px] h-[18px]" />, label: t('navbar.reportIssue'), action: () => { navigate('/report-issue'); setIsDropdownOpen(false); } },
                      ].map(({ icon, label, badge, action }) => (
                        <motion.button
                          key={label}
                          whileHover={{ x: 3, backgroundColor: 'rgba(242, 228, 199, 0.5)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={action}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors duration-200"
                          style={{ color: B.dark }}
                        >
                          <div className="flex items-center gap-3">
                            <span style={{ color: B.amber }} className="opacity-85">{icon}</span>
                            <span className="text-[14px] font-medium">{label}</span>
                          </div>
                          {badge > 0 && (
                            <span className="bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm">
                              {badge > 9 ? '9+' : badge}
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </div>

                    {/* Location section */}
                    <div className="border-t px-5 py-3.5" style={{ borderColor: 'rgba(232,213,176,0.4)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 opacity-75" style={{ color: B.amber }} />
                          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: B.light }}>Location</span>
                        </div>
                        <LocationRefreshButton variant="icon" size="sm" onLocationUpdate={refreshUserLocation} location={userLocation} />
                      </div>
                      {userLocation && (
                        <p className="text-[11px] mt-1.5 ml-6 font-medium" style={{ color: B.light }}>
                          {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                        </p>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t p-1.5" style={{ borderColor: 'rgba(232,213,176,0.4)' }}>
                      <motion.button
                        whileHover={{ background: 'rgba(231, 76, 60, 0.08)', color: '#e74c3c' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { Logout(); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors duration-200"
                        style={{ color: '#c0392b' }}
                      >
                        <LogOut className="w-[18px] h-[18px] opacity-85" />
                        <span className="text-[14px] font-semibold">{t('navbar.logout')}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.04, background: '#fffaf4' }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 rounded-full text-[14px] font-bold border transition-all duration-300"
                style={{ color: B.mid, borderColor: 'rgba(232,213,176,0.7)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}
              >
                {t('navbar.createAccount')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: `0 8px 28px rgba(200,134,10,0.30)`, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/login-form')}
                className="px-6 py-2.5 rounded-full text-[14px] font-bold text-white transition-all duration-300"
                style={{ background: `linear-gradient(135deg, ${B.mid}, ${B.amber})`, boxShadow: `0 4px 16px rgba(61,43,31,0.15)` }}
              >
                {t('navbar.login')}
              </motion.button>
            </div>
          )}

          {/* Mobile hamburger */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setShowMenu(true)}
            className="md:hidden p-2.5 rounded-xl transition-all shrink-0"
            style={{
              color: B.mid,
              background: 'rgba(255,255,255,0.80)',
              border: '1px solid rgba(232,213,176,0.5)',
              boxShadow: '0 2px 8px rgba(61,43,31,0.05)'
            }}
          >
            <Menu className="w-[22px] h-[22px] opacity-80" strokeWidth={2.5} />
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Mobile Menu ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setShowMenu(false)}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-[70] w-[85%] max-w-sm md:hidden flex flex-col shadow-[0_0_40px_rgba(30,20,10,0.8)]"
              style={{
                background: 'linear-gradient(135deg, rgba(68,44,29,0.98), rgba(45,26,15,0.98))',
                borderLeft: `1px solid rgba(255,255,255,0.08)`,
                backdropFilter: 'blur(20px)'
              }}
            >
              {/* Grain Texture */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

              {/* Drawer header */}
              <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/10">
                <img
                  onClick={() => { navigate('/'); setShowMenu(false); }}
                  className="w-32 cursor-pointer invert brightness-0"
                  style={{ filter: brandedLogo ? 'none' : 'brightness(0) invert(1)' }}
                  src={brandedLogo || "https://i.ibb.co/R2Y4vBk/Screenshot-2024-11-23-000108-removebg-preview.png"}
                  alt="PawVaidya"
                />
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setShowMenu(false)}
                  className="p-2.5 rounded-full bg-white/10 text-white transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* User info (if logged in) - Now clickable to Profile */}
              {token && userdata && (
                <div
                  onClick={() => { navigate('/my-profile'); setShowMenu(false); }}
                  className="relative z-10 px-6 py-6 border-b border-white/5 cursor-pointer group hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-500/50 group-hover:ring-amber-400 transition-all shadow-xl"
                      src={userdata.image} alt="Profile" />
                    <div className="flex flex-col flex-1">
                      <p className="font-bold text-[17px] leading-tight text-white">{userdata.name}</p>
                      <p className="text-[13px] text-amber-200/80 mt-0.5">{userdata.email}</p>
                      <span className="text-[10px] uppercase font-bold text-amber-500 mt-1 inline-flex items-center gap-1">
                        <User className="w-3 h-3" /> View Profile &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <div className="relative z-10 flex-1 overflow-y-auto px-5 py-6 no-scrollbar">
                <ul className="flex flex-col gap-2.5 w-full">
                  {ALL_NAV_LINKS.map(({ to, labelKey, label, icon: Icon, live }, i) => (
                    <motion.div
                      key={to}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.1, type: "spring", stiffness: 200, damping: 20 }}
                    >
                      <NavLink onClick={() => setShowMenu(false)} to={to} className="w-full block">
                        {({ isActive }) => (
                          <div className={`px-5 py-3.5 rounded-xl font-medium text-[15px] flex items-center gap-3 transition-all duration-300 ${isActive ? 'bg-amber-500/15 border border-amber-500/20 text-amber-300' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}>
                            {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-white/40'}`} strokeWidth={isActive ? 2.2 : 1.8} />}
                            {live ? (
                              <span className="flex items-center gap-2">
                                {label || (labelKey ? t(labelKey) : '')}
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                </span>
                              </span>
                            ) : (
                              labelKey ? t(labelKey) : label
                            )}
                          </div>
                        )}
                      </NavLink>
                    </motion.div>
                  ))}

                  {/* Divider */}
                  <div className="w-full h-px bg-white/10 my-2" />

                  {/* Paw Wallet / Appointment links */}
                  {token && userdata && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (ALL_NAV_LINKS.length + 1) * 0.05 + 0.1, type: "spring", stiffness: 200, damping: 20 }}
                      className="flex flex-col gap-2.5"
                    >
                      <NavLink onClick={() => setShowMenu(false)} to="/my-appointments" className="w-full block">
                        <div className="px-5 py-3.5 rounded-xl font-medium text-[15px] flex items-center gap-3 text-white/80 hover:bg-white/5 transition-all">
                          <Calendar className="w-4 h-4 text-amber-400" />
                          <span>My Appointments</span>
                        </div>
                      </NavLink>

                      <NavLink onClick={() => setShowMenu(false)} to="/paw-wallet" className="w-full block">
                        <div className="px-5 py-3.5 rounded-xl font-medium text-[15px] flex items-center gap-3 text-white/80 hover:bg-white/5 transition-all">
                          <Wallet className="w-4 h-4 text-amber-400" />
                          <span>Paw Wallet</span>
                        </div>
                      </NavLink>

                      <NavLink onClick={() => setShowMenu(false)} to="/messages" className="w-full block">
                        <div className="px-5 py-3.5 rounded-xl font-medium text-[15px] flex items-center justify-between text-white/80 hover:bg-white/5 transition-all">
                          <div className="flex items-center gap-3">
                            <Bell className="w-4 h-4 text-amber-400" />
                            <span>{t('navbar.notifications')}</span>
                          </div>
                          {unreadMessages > 0 && (
                            <span className="bg-red-500 text-white text-[11px] rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm">
                              {unreadMessages > 9 ? '9+' : unreadMessages}
                            </span>
                          )}
                        </div>
                      </NavLink>
                    </motion.div>
                  )}

                  {/* Verify email */}
                  {userdata && !userdata.isAccountverified && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-4"
                    >
                      <button
                        onClick={() => { sendVerificationOtp(); setShowMenu(false); }}
                        className="w-full flex items-center justify-center gap-2 text-[13px] font-bold py-3.5 px-4 rounded-xl transition-all duration-300 shadow-sm"
                        style={{ color: '#fff', background: 'linear-gradient(135deg, #e74c3c, #c0392b)', boxShadow: "0 4px 12px rgba(192,57,43,0.2)" }}
                      >
                        <AlertCircle className="w-4 h-4" />
                        {t('navbar.verifyEmail')}
                      </button>
                    </motion.div>
                  )}
                </ul>
              </div>

              {/* Bottom actions */}
              <div className="relative z-10 p-6 border-t border-white/10 bg-black/20 backdrop-blur-md">
                {authLoading ? (
                  <div className="flex flex-col gap-3 animate-pulse">
                    <div className="w-full h-12 rounded-xl bg-white/10" />
                    <div className="w-full h-12 rounded-xl bg-white/5" />
                  </div>
                ) : token && userdata ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 opacity-60 text-white">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">Location Status</span>
                        </div>
                        {userLocation ? (
                          <p className="text-[13px] font-semibold text-amber-300 mt-1">
                            {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                          </p>
                        ) : (
                          <p className="text-[13px] font-semibold text-white/50 mt-1">Not Available</p>
                        )}
                      </div>
                      <LocationRefreshButton variant="icon" size="sm" onLocationUpdate={refreshUserLocation} location={userLocation} />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(231, 76, 60, 0.15)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { Logout(); setShowMenu(false); }}
                      className="w-full py-3.5 rounded-xl text-[14px] font-bold text-red-400 transition-all flex items-center justify-center gap-2 border border-red-500/20 bg-red-500/5 hover:border-red-500/40"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('navbar.logout')}
                    </motion.button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { navigate('/login'); setShowMenu(false); }}
                      className="w-full py-3.5 rounded-xl text-[15px] font-bold text-white border border-white/20 hover:bg-white/5 transition-all"
                    >
                      {t('navbar.createAccount')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: `0 8px 20px rgba(200,134,10,0.3)` }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { navigate('/login-form'); setShowMenu(false); }}
                      className="w-full py-3.5 rounded-xl text-[15px] font-bold text-white transition-all shadow-md"
                      style={{ background: `linear-gradient(135deg, ${B.mid}, ${B.amber})` }}
                    >
                      {t('navbar.login')}
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
