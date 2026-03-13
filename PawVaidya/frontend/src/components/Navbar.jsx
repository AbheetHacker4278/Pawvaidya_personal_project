import React, { useContext, useEffect, useState, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next';
import assets from '../assets/assets_frontend/assets';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import LanguageSwitcher from './LanguageSwitcher';
import LocationRefreshButton from './LocationRefreshButton';
import { MapPin, Bell, User, Calendar, LogOut, ChevronDown, X, Menu, AlertCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

// Nav links config
const NAV_LINKS = [
  { to: '/', labelKey: 'navbar.home' },
  { to: '/doctors', labelKey: 'navbar.allDoctors' },
  { to: '/about', labelKey: 'navbar.about' },
  { to: '/contact', labelKey: 'navbar.contact' },
  { to: '/community-blogs', labelKey: 'navbar.communityBlogs' },
  { to: '/my-pets', labelKey: 'navbar.myPets' },
  { to: '/polls', labelKey: 'navbar.communityPolls' },
  { to: '/live-streams', labelKey: 'navbar.live', live: true },
];

const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    token, settoken, userdata, backendurl,
    setuserdata, setisLoggedin,
    unreadMessages, userLocation, refreshUserLocation
  } = useContext(AppContext);

  const [showMenu, setShowMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

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

  // ─── Scrolled vs top background ───────────────────────────────────────────
  const navBg = isScrolled
    ? 'rgba(253,248,240,0.88)'
    : B.cream;
  const navBorder = isScrolled
    ? B.sand
    : 'transparent';

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 120 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 lg:px-8 xl:px-[10%]"
        style={{
          height: 'var(--navbar-height, 72px)',
          background: navBg,
          borderBottom: `1px solid ${navBorder}`,
          backdropFilter: isScrolled ? 'blur(16px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(16px) saturate(180%)' : 'none',
          boxShadow: isScrolled ? `0 4px 24px rgba(61,43,31,0.10)` : 'none',
          transition: 'background 0.4s, border-color 0.4s, box-shadow 0.4s',
        }}
      >
        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <div className="relative flex items-center shrink-0 py-2">
          <img
            onClick={() => navigate('/')}
            className="w-36 lg:w-40 xl:w-48 cursor-pointer drop-shadow-sm hover:scale-105 transition-transform duration-300"
            src="https://i.ibb.co/R2Y4vBk/Screenshot-2024-11-23-000108-removebg-preview.png"
            alt="PawVaidya Logo"
          />
          {/* Blacklist Warning Label near Logo */}
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

        {/* ── Desktop Nav Links ─────────────────────────────────────────────── */}
        <ul className="hidden md:flex items-center gap-1 lg:gap-2 font-medium text-sm">
          {NAV_LINKS.map(({ to, labelKey, label, live }) => (
            <NavLink key={to} to={to} className="relative group">
              {({ isActive }) => (
                <div className="relative px-2.5 md:px-2 lg:px-4 py-2 rounded-full cursor-pointer select-none transition-colors duration-300 flex items-center justify-center">
                  {/* Active Background Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-bg"
                      className="absolute inset-0 rounded-full"
                      style={{ background: '#e8dbce', zIndex: -1, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)' }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {/* Hover background for inactive state */}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-full bg-[#f5ede8] opacity-0 group-hover:opacity-60 transition-opacity duration-300" style={{ zIndex: -1 }} />
                  )}

                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    style={{
                      color: isActive ? B.dark : B.mid,
                      fontWeight: isActive ? 800 : 600,
                      letterSpacing: '0.01em'
                    }}
                    className="relative z-10 flex items-center text-[13px] lg:text-sm tracking-tight"
                  >
                    {live ? (
                      <span className="flex items-center gap-1.5">
                        {label}
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                      </span>
                    ) : (
                      labelKey ? t(labelKey) : label
                    )}
                  </motion.span>
                </div>
              )}
            </NavLink>
          ))}

          {/* Verify email pill */}
          {userdata && !userdata.isAccountverified && (
            <motion.li
              whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(192,57,43,0.15)" }}
              whileTap={{ scale: 0.95 }}
              onClick={sendVerificationOtp}
              className="px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all duration-300 ml-2"
              style={{ color: '#fff', background: 'linear-gradient(135deg, #e74c3c, #c0392b)', boxShadow: "0 2px 8px rgba(192,57,43,0.2)" }}
            >
              {t('navbar.verifyEmail')}
            </motion.li>
          )}
        </ul>

        {/* ── Right side ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
          <LanguageSwitcher />

          {/* Bell icon (desktop) */}
          {token && userdata && (
            <motion.button
              whileHover={{ scale: 1.1, background: '#f0e4db' }}
              whileTap={{ scale: 0.93 }}
              onClick={() => navigate('/messages')}
              className="relative p-2 lg:p-2.5 rounded-xl transition-colors duration-300 shrink-0"
              style={{ color: B.mid, background: '#f5ede8' }}
            >
              <Bell className="w-4.5 h-4.5 lg:w-5 lg:h-5" />
              {unreadMessages > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] lg:text-[10.5px] rounded-full w-4 h-4 lg:w-4.5 lg:h-4.5 flex items-center justify-center font-bold shadow-md ring-2 ring-white"
                >
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </motion.span>
              )}
            </motion.button>
          )}

          {/* Profile dropdown */}
          {token && userdata ? (
            <div className="relative hidden md:block" ref={dropdownRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 lg:gap-2.5 px-2 py-1.5 lg:px-3 lg:py-1.5 rounded-full border transition-all duration-300 hover:shadow-sm shrink-0"
                style={{
                  background: isDropdownOpen ? '#e8dbce' : 'rgba(255,255,255,0.7)',
                  borderColor: isDropdownOpen ? B.sand : 'rgba(232,213,176,0.6)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: isDropdownOpen ? 'inset 0 1px 3px rgba(0,0,0,0.02)' : 'none'
                }}
              >
                <img
                  className="w-7 h-7 lg:w-8 lg:h-8 rounded-full object-cover transition-transform duration-300 shrink-0"
                  style={{ border: `2px solid ${B.sand}` }}
                  src={userdata.image}
                  alt="Profile"
                />
                <span className="hidden sm:block text-sm font-semibold tracking-tight" style={{ color: B.dark }}>
                  {userdata.name}
                </span>
                <motion.div animate={{ rotate: isDropdownOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                  <ChevronDown className="w-4 h-4 opacity-75" style={{ color: B.dark }} />
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
                      background: 'rgba(255, 255, 255, 0.98)',
                      backdropFilter: 'blur(16px)',
                      border: `1px solid ${B.sand}`,
                      boxShadow: `0 20px 40px -10px rgba(61,43,31,0.15)`,
                    }}
                  >
                    {/* Arrow */}
                    <div className="absolute -top-1.5 right-6 w-3 h-3 rotate-45 rounded-sm"
                      style={{ background: '#fff', borderTop: `1px solid ${B.sand}`, borderLeft: `1px solid ${B.sand}` }} />

                    {/* User header */}
                    <div className="px-5 py-4 border-b relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #fcfaf8, #f5ede8)', borderColor: B.sand }}>
                      <div className="flex items-center gap-3 relative z-10">
                        <img className="w-11 h-11 rounded-full object-cover shadow-sm" style={{ border: `2px solid #fff` }}
                          src={userdata.image} alt="Profile" />
                        <div className="flex flex-col justify-center">
                          <p className="font-bold text-[15px] leading-tight" style={{ color: B.dark }}>{userdata.name}</p>
                          <p className="text-[12px] opacity-80 mt-0.5" style={{ color: B.light }}>{userdata.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-2.5 px-1.5">
                      {[
                        { icon: <User className="w-[18px] h-[18px]" />, label: t('navbar.myProfile'), action: () => { navigate('/my-profile'); setIsDropdownOpen(false); } },
                        { icon: <Calendar className="w-[18px] h-[18px]" />, label: t('navbar.myAppointments'), action: () => { navigate('/my-appointments'); setIsDropdownOpen(false); } },
                        { icon: <Bell className="w-[18px] h-[18px]" />, label: t('navbar.notifications'), badge: unreadMessages, action: () => { navigate('/messages'); setIsDropdownOpen(false); } },
                        { icon: <AlertCircle className="w-[18px] h-[18px]" />, label: t('navbar.reportIssue'), action: () => { navigate('/report-issue'); setIsDropdownOpen(false); } },
                      ].map(({ icon, label, badge, action }) => (
                        <motion.button
                          key={label}
                          whileHover={{ x: 4, backgroundColor: '#fdf8f5' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={action}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors duration-200"
                          style={{ color: B.dark }}
                        >
                          <div className="flex items-center gap-3">
                            <span style={{ color: B.amber }} className="opacity-90">{icon}</span>
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
                    <div className="border-t px-5 py-3.5 bg-[#fcfaf8]" style={{ borderColor: B.sand }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 opacity-80" style={{ color: B.amber }} />
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
                    <div className="border-t p-1.5 bg-[#fff]" style={{ borderColor: B.sand }}>
                      <motion.button
                        whileHover={{ background: '#fff5f5', color: '#e74c3c' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { Logout(); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors duration-200"
                        style={{ color: '#c0392b' }}
                      >
                        <LogOut className="w-[18px] h-[18px] opacity-90" />
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
                whileHover={{ scale: 1.05, background: '#fcfaf8' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 rounded-full text-[14px] font-bold border transition-all duration-300"
                style={{ color: B.mid, borderColor: B.sand, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)' }}
              >
                {t('navbar.createAccount')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: `0 8px 25px rgba(200,134,10,0.35)`, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login-form')}
                className="px-6 py-2.5 rounded-full text-[14px] font-bold text-white transition-all duration-300"
                style={{ background: `linear-gradient(135deg, ${B.mid}, ${B.amber})`, boxShadow: `0 4px 15px rgba(61,43,31,0.15)` }}
              >
                {t('navbar.login')}
              </motion.button>
            </div>
          )}

          {/* Mobile hamburger */}
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
            onClick={() => setShowMenu(true)}
            className="md:hidden p-2 rounded-xl"
            style={{ color: B.mid, background: '#f5ede8' }}
          >
            <Menu className="w-5 h-5" />
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
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-md md:hidden"
              onClick={() => setShowMenu(false)}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 z-[70] w-[85%] max-w-sm md:hidden flex flex-col shadow-2xl"
              style={{ background: 'rgba(253, 248, 240, 0.98)', borderLeft: `1px solid rgba(232,213,176,0.5)`, backdropFilter: 'blur(16px)' }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(232,213,176,0.3)' }}>
                <img
                  onClick={() => { navigate('/'); setShowMenu(false); }}
                  className="w-32 cursor-pointer"
                  src="https://i.ibb.co/R2Y4vBk/Screenshot-2024-11-23-000108-removebg-preview.png"
                  alt="PawVaidya"
                />
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90, background: '#f0e4db' }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setShowMenu(false)}
                  className="p-2.5 rounded-xl transition-colors duration-200"
                  style={{ color: B.mid, background: '#f5ede8' }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* User info (if logged in) */}
              {token && userdata && (
                <div className="px-6 py-5 border-b flex items-center gap-4 shadow-sm" style={{ borderColor: 'rgba(232,213,176,0.3)', background: 'linear-gradient(to bottom, #fcfaf8, #f5ede8)' }}>
                  <img className="w-12 h-12 rounded-full object-cover shadow-sm" style={{ border: `2px solid #fff` }}
                    src={userdata.image} alt="Profile" />
                  <div className="flex flex-col justify-center">
                    <p className="font-bold text-[16px] leading-tight" style={{ color: B.dark }}>{userdata.name}</p>
                    <p className="text-[13px] opacity-80 mt-0.5" style={{ color: B.light }}>{userdata.email}</p>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <ul className="flex flex-col gap-2 p-5 flex-1 overflow-y-auto w-full">
                {NAV_LINKS.map(({ to, labelKey, label, live }, i) => (
                  <motion.div
                    key={to}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 + 0.1, type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <NavLink onClick={() => setShowMenu(false)} to={to} className="w-full block">
                      {({ isActive }) => (
                        <div className="px-5 py-3.5 rounded-2xl font-medium text-[15px] flex items-center justify-between transition-all duration-300"
                          style={{
                            color: isActive ? B.mid : B.dark,
                            background: isActive ? '#f5ede8' : 'transparent',
                            fontWeight: isActive ? 700 : 500,
                            borderLeft: isActive ? `4px solid ${B.amber}` : '4px solid transparent',
                            boxShadow: isActive ? '0 2px 10px rgba(61,43,31,0.05)' : 'none'
                          }}>
                          {live ? (
                            <span className="flex items-center gap-2">
                              {label}
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

                {/* Notifications link */}
                {token && userdata && (
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: NAV_LINKS.length * 0.08 + 0.1, type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <NavLink onClick={() => setShowMenu(false)} to="/messages" className="w-full block">
                      <div className="px-5 py-3.5 rounded-2xl font-medium text-[15px] flex items-center justify-between transition-all duration-300"
                        style={{ color: B.dark, borderLeft: '4px solid transparent' }}>
                        <span>{t('navbar.notifications')}</span>
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
                    transition={{ delay: (NAV_LINKS.length + 1) * 0.08 + 0.1 }}
                    className="mt-2"
                  >
                    <button
                      onClick={() => { sendVerificationOtp(); setShowMenu(false); }}
                      className="w-full text-center text-[13px] font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-sm"
                      style={{ color: '#fff', background: 'linear-gradient(135deg, #e74c3c, #c0392b)', boxShadow: "0 4px 12px rgba(192,57,43,0.2)" }}
                    >
                      {t('navbar.verifyEmail')}
                    </button>
                  </motion.div>
                )}
              </ul>

              {/* Bottom actions */}
              <div className="p-6 border-t bg-white bg-opacity-50" style={{ borderColor: 'rgba(232,213,176,0.5)' }}>
                {token && userdata ? (
                  <>
                    {/* Location */}
                    <div className="flex items-center justify-between mb-4 px-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 opacity-90" style={{ color: B.amber }} />
                        <span className="text-[13px] font-semibold tracking-wide uppercase" style={{ color: B.light }}>Location</span>
                      </div>
                      <LocationRefreshButton variant="icon" size="sm" onLocationUpdate={refreshUserLocation} location={userLocation} />
                    </div>
                    {userLocation && (
                      <p className="text-[12px] mb-4 ml-8 font-medium" style={{ color: B.light }}>
                        {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                      </p>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: `0 8px 20px rgba(192,57,43,0.25)` }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { Logout(); setShowMenu(false); }}
                      className="w-full py-3.5 rounded-xl text-[15px] font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}
                    >
                      <LogOut className="w-4 h-4" />
                      {t('navbar.logout')}
                    </motion.button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02, background: '#fcfaf8' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { navigate('/login'); setShowMenu(false); }}
                      className="w-full py-3.5 rounded-xl text-[15px] font-bold border transition-all"
                      style={{ color: B.mid, borderColor: B.sand, background: '#fff' }}
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
