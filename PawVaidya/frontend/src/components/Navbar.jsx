import React, { useContext, useEffect, useState, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next';
import assets from '../assets/assets_frontend/assets';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import LanguageSwitcher from './LanguageSwitcher';
import LocationRefreshButton from './LocationRefreshButton';
import { MapPin, Bell, User, Calendar, LogOut, ChevronDown, X, Menu, AlertCircle } from 'lucide-react';
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
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-[10%]"
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
        <motion.img
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/')}
          className="w-40 cursor-pointer"
          src="https://i.ibb.co/R2Y4vBk/Screenshot-2024-11-23-000108-removebg-preview.png"
          alt="PawVaidya"
        />

        {/* ── Desktop Nav Links ─────────────────────────────────────────────── */}
        <ul className="hidden md:flex items-center gap-1 font-medium text-sm">
          {NAV_LINKS.map(({ to, labelKey, label, live }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <motion.li
                  whileHover={{ y: -1 }}
                  className="relative px-3 py-2 rounded-lg cursor-pointer select-none transition-colors duration-200"
                  style={{
                    color: isActive ? B.mid : B.dark,
                    background: isActive ? '#f5ede8' : 'transparent',
                    fontWeight: isActive ? 700 : 500,
                  }}
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
                  {/* Active underline */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full"
                      style={{ background: `linear-gradient(to right, ${B.mid}, ${B.amber})` }}
                    />
                  )}
                </motion.li>
              )}
            </NavLink>
          ))}

          {/* Verify email pill */}
          {userdata && !userdata.isAccountverified && (
            <motion.li
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={sendVerificationOtp}
              className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border transition-all duration-200"
              style={{ color: '#c0392b', borderColor: '#c0392b', background: '#fff5f5' }}
            >
              {t('navbar.verifyEmail')}
            </motion.li>
          )}
        </ul>

        {/* ── Right side ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {/* Bell icon (desktop) */}
          {token && userdata && (
            <motion.button
              whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.93 }}
              onClick={() => navigate('/messages')}
              className="relative p-2 rounded-xl transition-colors duration-200"
              style={{ color: B.mid, background: '#f5ede8' }}
            >
              <Bell className="w-5 h-5" />
              {unreadMessages > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold notification-badge"
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
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200"
                style={{
                  background: isDropdownOpen ? '#f5ede8' : 'rgba(255,255,255,0.6)',
                  borderColor: isDropdownOpen ? B.sand : 'rgba(232,213,176,0.5)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <img
                  className="w-8 h-8 rounded-full object-cover"
                  style={{ border: `2px solid ${B.sand}` }}
                  src={userdata.image}
                  alt="Profile"
                />
                <span className="hidden sm:block text-sm font-semibold" style={{ color: B.dark }}>
                  {userdata.name}
                </span>
                <motion.div animate={{ rotate: isDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-4 h-4" style={{ color: B.light }} />
                </motion.div>
              </motion.button>

              {/* Dropdown */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    className="absolute right-0 top-full mt-3 w-64 rounded-2xl overflow-hidden z-50"
                    style={{
                      background: '#fff',
                      border: `1px solid ${B.sand}`,
                      boxShadow: `0 16px 48px rgba(61,43,31,0.16)`,
                    }}
                  >
                    {/* Arrow */}
                    <div className="absolute -top-2 right-5 w-4 h-4 rotate-45 rounded-sm"
                      style={{ background: '#fff', borderTop: `1px solid ${B.sand}`, borderLeft: `1px solid ${B.sand}` }} />

                    {/* User header */}
                    <div className="px-4 py-4 border-b" style={{ background: '#f5ede8', borderColor: B.sand }}>
                      <div className="flex items-center gap-3">
                        <img className="w-10 h-10 rounded-full object-cover" style={{ border: `2px solid ${B.sand}` }}
                          src={userdata.image} alt="Profile" />
                        <div>
                          <p className="font-bold text-sm" style={{ color: B.dark }}>{userdata.name}</p>
                          <p className="text-xs" style={{ color: B.light }}>{userdata.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-2">
                      {[
                        { icon: <User className="w-4 h-4" />, label: t('navbar.myProfile'), action: () => { navigate('/my-profile'); setIsDropdownOpen(false); } },
                        { icon: <Calendar className="w-4 h-4" />, label: t('navbar.myAppointments'), action: () => { navigate('/my-appointments'); setIsDropdownOpen(false); } },
                        { icon: <Bell className="w-4 h-4" />, label: t('navbar.notifications'), badge: unreadMessages, action: () => { navigate('/messages'); setIsDropdownOpen(false); } },
                        { icon: <AlertCircle className="w-4 h-4" />, label: t('navbar.reportIssue'), action: () => { navigate('/report-issue'); setIsDropdownOpen(false); } },
                      ].map(({ icon, label, badge, action }) => (
                        <motion.button
                          key={label}
                          whileHover={{ x: 4, background: '#f5ede8' }}
                          onClick={action}
                          className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors duration-150"
                          style={{ color: B.dark }}
                        >
                          <div className="flex items-center gap-3">
                            <span style={{ color: B.amber }}>{icon}</span>
                            <span className="text-sm font-medium">{label}</span>
                          </div>
                          {badge > 0 && (
                            <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                              {badge > 9 ? '9+' : badge}
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </div>

                    {/* Location section */}
                    <div className="border-t px-4 py-3" style={{ borderColor: B.sand }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" style={{ color: B.amber }} />
                          <span className="text-xs font-semibold" style={{ color: B.light }}>Location</span>
                        </div>
                        <LocationRefreshButton variant="icon" size="sm" onLocationUpdate={refreshUserLocation} location={userLocation} />
                      </div>
                      {userLocation && (
                        <p className="text-[10px] mt-1 ml-6" style={{ color: B.light }}>
                          {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                        </p>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t" style={{ borderColor: B.sand }}>
                      <motion.button
                        whileHover={{ background: '#fff5f5' }}
                        onClick={() => { Logout(); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150"
                        style={{ color: '#c0392b' }}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('navbar.logout')}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                className="px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200"
                style={{ color: B.mid, borderColor: B.sand, background: '#fff' }}
              >
                {t('navbar.createAccount')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: `0 6px 20px rgba(200,134,10,0.30)` }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login-form')}
                className="px-5 py-2 rounded-full text-sm font-bold text-white transition-all duration-200"
                style={{ background: `linear-gradient(135deg, ${B.mid}, ${B.amber})` }}
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
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setShowMenu(false)}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-[70] w-4/5 max-w-sm md:hidden flex flex-col"
              style={{ background: B.pale, borderLeft: `1px solid ${B.sand}` }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: B.sand }}>
                <img
                  onClick={() => { navigate('/'); setShowMenu(false); }}
                  className="w-32 cursor-pointer"
                  src="https://i.ibb.co/R2Y4vBk/Screenshot-2024-11-23-000108-removebg-preview.png"
                  alt="PawVaidya"
                />
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.93 }}
                  onClick={() => setShowMenu(false)}
                  className="p-2 rounded-xl"
                  style={{ color: B.mid, background: '#f5ede8' }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* User info (if logged in) */}
              {token && userdata && (
                <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: B.sand, background: '#f5ede8' }}>
                  <img className="w-10 h-10 rounded-full object-cover" style={{ border: `2px solid ${B.sand}` }}
                    src={userdata.image} alt="Profile" />
                  <div>
                    <p className="font-bold text-sm" style={{ color: B.dark }}>{userdata.name}</p>
                    <p className="text-xs" style={{ color: B.light }}>{userdata.email}</p>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <ul className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
                {NAV_LINKS.map(({ to, labelKey, label, live }, i) => (
                  <motion.div
                    key={to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <NavLink onClick={() => setShowMenu(false)} to={to}>
                      {({ isActive }) => (
                        <li className="px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-between transition-all duration-200"
                          style={{
                            color: isActive ? B.mid : B.dark,
                            background: isActive ? '#f5ede8' : 'transparent',
                            fontWeight: isActive ? 700 : 500,
                            borderLeft: isActive ? `3px solid ${B.amber}` : '3px solid transparent',
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
                        </li>
                      )}
                    </NavLink>
                  </motion.div>
                ))}

                {/* Notifications link */}
                {token && userdata && (
                  <NavLink onClick={() => setShowMenu(false)} to="/messages">
                    <li className="px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-between transition-all duration-200"
                      style={{ color: B.dark }}>
                      <span>{t('navbar.notifications')}</span>
                      {unreadMessages > 0 && (
                        <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                      )}
                    </li>
                  </NavLink>
                )}

                {/* Verify email */}
                {userdata && !userdata.isAccountverified && (
                  <li className="px-4 py-3">
                    <button
                      onClick={() => { sendVerificationOtp(); setShowMenu(false); }}
                      className="w-full text-center text-xs font-bold py-2 px-4 rounded-full border transition-colors"
                      style={{ color: '#c0392b', borderColor: '#c0392b', background: '#fff5f5' }}
                    >
                      {t('navbar.verifyEmail')}
                    </button>
                  </li>
                )}
              </ul>

              {/* Bottom actions */}
              <div className="p-4 border-t" style={{ borderColor: B.sand }}>
                {token && userdata ? (
                  <>
                    {/* Location */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" style={{ color: B.amber }} />
                        <span className="text-xs font-semibold" style={{ color: B.light }}>Location</span>
                      </div>
                      <LocationRefreshButton variant="icon" size="sm" onLocationUpdate={refreshUserLocation} location={userLocation} />
                    </div>
                    {userLocation && (
                      <p className="text-[10px] mb-3 ml-6" style={{ color: B.light }}>
                        {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                      </p>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { Logout(); setShowMenu(false); }}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #c0392b, #e74c3c)' }}
                    >
                      {t('navbar.logout')}
                    </motion.button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { navigate('/login'); setShowMenu(false); }}
                      className="w-full py-3 rounded-xl text-sm font-bold border transition-all"
                      style={{ color: B.mid, borderColor: B.sand, background: '#fff' }}
                    >
                      {t('navbar.createAccount')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { navigate('/login-form'); setShowMenu(false); }}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
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
