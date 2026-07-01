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
import { MapPin, Bell, User, Calendar, LogOut, ChevronDown, X, Menu, AlertCircle, AlertTriangle, Wallet, Home, Stethoscope, Info, Phone, BookOpen, PawPrint, BarChart3, Radio, Video, MoreHorizontal, Star, Sparkles, Award, LifeBuoy, Users } from 'lucide-react';
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

// ─── Theme Config ─────────────────────────────────────────────────────────────
const THEME = {
  light: {
    bg: {
      base: 'rgba(253, 248, 240, 0.85)',
      scrolled: 'rgba(253, 248, 240, 0.94)',
      hover: 'rgba(255, 255, 255, 0.55)',
      dropdown: 'rgba(253, 248, 240, 0.98)',
      active: 'rgba(242, 228, 199, 0.5)',
      activeSolid: '#fffaf3',
    },
    border: {
      base: 'rgba(232, 213, 176, 0.4)',
      scrolled: 'rgba(200, 134, 10, 0.2)',
      dropdown: 'rgba(232, 213, 176, 0.6)'
    },
    text: {
      primary: '#2c1e14',
      secondary: '#5A4035',
      tertiary: '#7a5a48',
      accent: '#c8860a',
      accentHover: '#d4a017'
    },
    shadow: {
      sm: '0 4px 20px rgba(61, 43, 31, 0.04), 0 1px 0 rgba(255,255,255,0.5) inset',
      base: '0 12px 32px rgba(61,43,31,0.08), 0 1px 0 rgba(255,255,255,0.8) inset',
      lg: '0 16px 40px -8px rgba(61,43,31,0.15), 0 4px 12px rgba(61,43,31,0.06)'
    },
    gradient: {
      activeUnderline: `linear-gradient(90deg, #c8860a, #d4a017)`
    }
  },
  dark: {
    bg: {
      base: 'rgba(26, 18, 40, 0.88)',
      scrolled: 'rgba(20, 14, 32, 0.95)',
      hover: 'rgba(139, 92, 246, 0.15)',
      dropdown: 'rgba(26, 18, 40, 0.98)',
      active: 'rgba(139, 92, 246, 0.15)',
      activeSolid: '#241b30',
    },
    border: {
      base: 'rgba(139, 92, 246, 0.3)',
      scrolled: 'rgba(139, 92, 246, 0.3)',
      dropdown: 'rgba(139, 92, 246, 0.4)'
    },
    text: {
      primary: '#f3e8ff',
      secondary: '#a78bfa',
      tertiary: '#a78bfa',
      accent: '#c084fc',
      accentHover: '#c084fc'
    },
    shadow: {
      sm: '0 12px 32px rgba(36, 27, 48, 0.4), 0 1px 0 rgba(255,255,255,0.15) inset',
      base: '0 12px 32px rgba(36, 27, 48, 0.4), 0 1px 0 rgba(255,255,255,0.15) inset',
      lg: '0 16px 40px -8px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)'
    },
    gradient: {
      activeUnderline: 'linear-gradient(90deg, #a78bfa, #c084fc)'
    }
  },
  obsidian: {
    bg: {
      base: 'rgba(13, 13, 13, 0.88)',
      scrolled: 'rgba(5, 5, 5, 0.95)',
      hover: 'rgba(212, 175, 55, 0.12)',
      dropdown: 'rgba(13, 13, 13, 0.98)',
      active: 'rgba(212, 175, 55, 0.12)',
      activeSolid: '#1a130d',
    },
    border: {
      base: 'rgba(212, 175, 55, 0.25)',
      scrolled: 'rgba(212, 175, 55, 0.35)',
      dropdown: 'rgba(212, 175, 55, 0.35)'
    },
    text: {
      primary: '#F5F2EA',
      secondary: '#B0B0B0',
      tertiary: '#8A8A8A',
      accent: '#D4AF37',
      accentHover: '#E6C97A'
    },
    shadow: {
      sm: '0 8px 32px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(212,175,55,0.1) inset',
      base: '0 12px 32px rgba(0, 0, 0, 0.95), 0 1px 0 rgba(212,175,55,0.15) inset',
      lg: '0 16px 40px -8px rgba(0,0,0,0.95), 0 4px 12px rgba(212,175,55,0.08)'
    },
    gradient: {
      activeUnderline: 'linear-gradient(90deg, #D4AF37, #E6C97A)'
    }
  }
};

// Primary nav links (always visible)
const PRIMARY_LINKS = [
  { to: '/', labelKey: 'navbar.home', icon: Home },
  { to: '/doctors', labelKey: 'navbar.allDoctors', icon: Stethoscope },
  { to: '/my-pets', labelKey: 'navbar.myPets', icon: PawPrint },
];

// Secondary nav links (inside "More" dropdown)
const SECONDARY_LINKS = [
  { to: '/community', label: 'Community Hub 🐾', icon: Users },
  { to: '/video-consultation', label: 'Video Consultation', icon: Video },
  { to: '/ai-features', label: 'AI Features ✨', icon: Sparkles },
  { to: '/stray-crowdfunding', label: 'Stray Crowdfunding ❤️', icon: Wallet },
  { to: '/about', labelKey: 'common.about', icon: Info },
  { to: '/contact', labelKey: 'common.contact', icon: Phone },
  { to: '/support', label: 'Support & Feedback 💬', icon: LifeBuoy },
];

// All nav links for mobile
const ALL_NAV_LINKS = [...PRIMARY_LINKS, ...SECONDARY_LINKS];

// ─── Helper Functions ─────────────────────────────────────────────────────────
function getPlanLogo(plan) {
  switch (plan) {
    case 'Obsidian': return PlatinumSVG;
    case 'Platinum': return PlatinumSVG;
    case 'Gold': return GoldSVG;
    case 'Silver': return SilverSVG;
    default: return null;
  }
}

function getPlanGradient(plan) {
  switch (plan) {
    case 'Obsidian': return 'linear-gradient(135deg, #D4AF37, #8C6D23)';
    case 'Platinum': return 'linear-gradient(135deg, #a855f7, #6b21a8)';
    case 'Gold': return 'linear-gradient(135deg, #f59e0b, #b45309)';
    default: return 'linear-gradient(135deg, #94a3b8, #475569)';
  }
}

// ─── Components ───────────────────────────────────────────────────────────────

const NavLinkItem = ({ to, labelKey, label, icon: Icon, live, isObsidian, theme, t }) => (
  <NavLink to={to} className="relative group">
    {({ isActive }) => (
      <div className={`relative h-9 rounded-full cursor-pointer select-none flex items-center justify-center transition-all duration-200 ${isObsidian ? 'px-2 lg:px-3' : 'px-3.5 lg:px-4'
        }`}>
        {!isActive && (
          <div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
            style={{ background: theme.bg.hover, zIndex: 0 }}
          />
        )}
        <motion.span
          whileHover={{ y: -1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{
            color: isActive ? theme.text.primary : theme.text.secondary,
            fontWeight: isActive ? 700 : 550,
          }}
          className={`relative z-10 flex items-center gap-1.5 tracking-[-0.01em] whitespace-nowrap ${isObsidian ? 'text-[12px] lg:text-[13.5px]' : 'text-[13.5px] lg:text-[14px]'
            }`}
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
        {isActive && (
          <motion.div
            layoutId="nav-active-underline"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full"
            style={{
              width: '24px',
              background: theme.gradient.activeUnderline,
              boxShadow: isObsidian ? '0 1px 6px rgba(167,139,250,0.4)' : '0 1px 6px rgba(200,134,10,0.35)',
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        )}
      </div>
    )}
  </NavLink>
);

const UserDropdown = ({ isDropdownOpen, setIsDropdownOpen, userdata, unreadMessages, Logout, refreshUserLocation, userLocation, navigate, t, theme, isObsidian }) => {
  const dropdownItems = [
    { icon: <User className="w-[18px] h-[18px]" />, label: t('navbar.myProfile'), action: () => { navigate('/my-profile'); setIsDropdownOpen(false); } },
    { icon: <Sparkles className="w-[18px] h-[18px] text-violet-500" />, label: 'AI Features ✨', action: () => { navigate('/ai-features'); setIsDropdownOpen(false); } },
    { icon: <Calendar className="w-[18px] h-[18px]" />, label: t('navbar.myAppointments'), action: () => { navigate('/my-appointments'); setIsDropdownOpen(false); } },
    { icon: <Calendar className="w-[18px] h-[18px]" />, label: 'PawPlan / Subscription', action: () => { navigate('/subscription'); setIsDropdownOpen(false); } },
    { icon: <Wallet className="w-[18px] h-[18px]" />, label: 'Paw Wallet', action: () => { navigate('/paw-wallet'); setIsDropdownOpen(false); } },
    { icon: <LifeBuoy className="w-[18px] h-[18px]" />, label: 'Support & Feedback', action: () => { navigate('/support'); setIsDropdownOpen(false); } },
    { icon: <Bell className="w-[18px] h-[18px]" />, label: t('navbar.notifications'), badge: unreadMessages, action: () => { navigate('/messages'); setIsDropdownOpen(false); } },
  ];

  return (
    <AnimatePresence>
      {isDropdownOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10, transformOrigin: "top right" }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -5 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute right-0 top-[calc(100%+12px)] w-64 rounded-2xl overflow-hidden z-50"
          style={{
            background: theme.bg.dropdown,
            backdropFilter: 'blur(20px) saturate(180%)',
            border: `1px solid ${theme.border.dropdown}`,
            boxShadow: theme.shadow.lg,
          }}
        >
          {/* Arrow */}
          <div className="absolute -top-1.5 right-6 w-3 h-3 rotate-45 rounded-sm"
            style={{ background: isObsidian ? theme.bg.dropdown : '#f5ede8', borderTop: `1px solid ${theme.border.dropdown}`, borderLeft: `1px solid ${theme.border.dropdown}` }} />

          {/* User header */}
          <div className="px-5 py-4 border-b relative overflow-hidden" style={{ background: isObsidian ? theme.bg.hover : 'linear-gradient(to bottom, #f5ede8, #ede4d8)', borderColor: theme.border.base }}>
            <div className="flex items-center gap-3 relative z-10">
              <img className="w-11 h-11 rounded-full object-cover shadow-sm" style={{ border: `2.5px solid ${theme.text.accent}` }}
                src={userdata.image} alt="Profile" />
              <div className="flex flex-col justify-center">
                <p className="font-bold text-[15px] leading-tight" style={{ color: theme.text.primary }}>{userdata.name}</p>
                <p className="text-[12px] opacity-70 mt-0.5" style={{ color: theme.text.secondary }}>{userdata.email}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-2 px-1.5">
            {dropdownItems.map(({ icon, label, badge, action }) => (
              <motion.button
                key={label}
                whileHover={{ x: 3, backgroundColor: theme.bg.active }}
                whileTap={{ scale: 0.98 }}
                onClick={action}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors duration-200"
                style={{ color: theme.text.primary }}
              >
                <div className="flex items-center gap-3">
                  <span style={{ color: theme.text.accent }} className="opacity-85">{icon}</span>
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
          <div className="border-t px-5 py-3.5" style={{ borderColor: theme.border.base }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 opacity-75" style={{ color: theme.text.accent }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text.secondary }}>Location</span>
              </div>
              <LocationRefreshButton variant="icon" size="sm" onLocationUpdate={refreshUserLocation} location={userLocation} />
            </div>
            {userLocation && (
              <p className="text-[11px] mt-1.5 ml-6 font-medium" style={{ color: theme.text.secondary }}>
                {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </p>
            )}
          </div>

          {/* Logout */}
          <div className="border-t p-1.5" style={{ borderColor: theme.border.base }}>
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
  );
};

const MobileMenu = ({ 
  showMenu, 
  setShowMenu, 
  userdata, 
  token, 
  authLoading, 
  navigate, 
  t, 
  sendVerificationOtp, 
  unreadMessages, 
  refreshUserLocation, 
  userLocation, 
  Logout, 
  brandedLogo,
  isObsidian,
  theme
}) => (
  <AnimatePresence>
    {showMenu && (
      <>
        {/* Backdrop */}
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[140] bg-black/60 md:hidden"
          onClick={() => setShowMenu(false)}
        />

        {/* Drawer */}
        <motion.div
          key="drawer"
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ ease: "easeInOut", duration: 0.22 }}
          className="fixed right-0 top-0 bottom-0 z-[150] w-[85%] max-w-sm md:hidden flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          style={{
            background: isObsidian 
              ? 'linear-gradient(135deg, #121212, #070707)' 
              : 'linear-gradient(135deg, #442c1d, #2d1a0f)',
            borderLeft: isObsidian
              ? '1px solid rgba(230, 201, 122, 0.15)'
              : '1px solid rgba(255,255,255,0.08)'
          }}
        >
          {/* Drawer header */}
          <div className={`relative z-10 flex items-center justify-between px-6 py-5 border-b ${isObsidian ? 'border-[#E6C97A]/10' : 'border-white/10'}`}>
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
              className={`p-2.5 rounded-full text-white transition-colors duration-200 ${isObsidian ? 'bg-[#E6C97A]/10 hover:bg-[#E6C97A]/20' : 'bg-white/10 hover:bg-white/20'}`}
            >
              <X className="w-5 h-5" style={{ color: isObsidian ? '#E6C97A' : '#ffffff' }} />
            </motion.button>
          </div>

          {/* User info */}
          {token && userdata && (
            <div
              onClick={() => { navigate('/my-profile'); setShowMenu(false); }}
              className={`relative z-10 px-6 py-6 border-b cursor-pointer group transition-colors ${
                isObsidian ? 'border-[#E6C97A]/5 hover:bg-white/5' : 'border-white/5 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <img 
                  className={`w-14 h-14 rounded-full object-cover shadow-xl transition-all ${
                    isObsidian 
                      ? 'ring-2 ring-[#E6C97A]/60 group-hover:ring-[#E6C97A]' 
                      : 'ring-2 ring-amber-500/50 group-hover:ring-amber-400'
                  }`}
                  src={userdata.image} 
                  alt="Profile" 
                />
                <div className="flex flex-col flex-1">
                  <p className="font-bold text-[17px] leading-tight text-white">{userdata.name}</p>
                  {isObsidian && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-[#8C6D23] to-[#E6C97A] text-black font-extrabold tracking-wide inline-block w-fit mt-1 shadow-sm">
                      👑 OBSIDIAN MEMBER
                    </span>
                  )}
                  <p className={`text-[13px] mt-0.5 ${isObsidian ? 'text-neutral-400' : 'text-amber-200/80'}`}>{userdata.email}</p>
                  <span className={`text-[10px] uppercase font-bold mt-1 inline-flex items-center gap-1 ${
                    isObsidian ? 'text-[#E6C97A]' : 'text-amber-500'
                  }`}>
                    <User className="w-3 h-3" /> {isObsidian ? 'VIEW PROFILE' : 'VIEW PROFILE'} &rarr;
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
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 + 0.04, ease: "easeOut", duration: 0.18 }}
                >
                  <NavLink onClick={() => setShowMenu(false)} to={to} className="w-full block">
                    {({ isActive }) => (
                      <div className={`px-5 py-3.5 rounded-xl font-medium text-[15px] flex items-center justify-between transition-all duration-300 ${
                        isActive 
                          ? isObsidian
                            ? 'bg-[#E6C97A]/10 border border-[#E6C97A]/30 text-[#E6C97A]'
                            : 'bg-amber-500/15 border border-amber-500/20 text-amber-300'
                          : isObsidian
                            ? 'text-neutral-400 hover:bg-white/5 hover:text-white'
                            : 'text-white/80 hover:bg-white/5 hover:text-white'
                      }`}>
                        <div className="flex items-center gap-3">
                          {Icon && (
                            <Icon 
                              className={`w-4 h-4 ${
                                isActive 
                                  ? isObsidian ? 'text-[#E6C97A]' : 'text-amber-400' 
                                  : isObsidian ? 'text-neutral-500' : 'text-white/40'
                              }`} 
                              strokeWidth={isActive ? 2.2 : 1.8} 
                            />
                          )}
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
                        {isActive && isObsidian && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E6C97A] shadow-[0_0_8px_#E6C97A]" />
                        )}
                        {label === 'AI Features ✨' && isObsidian && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#E6C97A]/20 text-[#E6C97A] border border-[#E6C97A]/30 ml-2">NEW</span>
                        )}
                      </div>
                    )}
                  </NavLink>
                </motion.div>
              ))}

              <div className={`w-full h-px my-2 ${isObsidian ? 'bg-[#E6C97A]/10' : 'bg-white/10'}`} />

              {token && userdata && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (ALL_NAV_LINKS.length + 1) * 0.02 + 0.04, ease: "easeOut", duration: 0.18 }}
                  className="flex flex-col gap-2.5"
                >
                  <NavLink onClick={() => setShowMenu(false)} to="/my-appointments" className="w-full block">
                    <div className={`px-5 py-3.5 rounded-xl font-medium text-[15px] flex items-center gap-3 transition-all ${
                      isObsidian ? 'text-neutral-400 hover:bg-white/5 hover:text-white' : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}>
                      <Calendar className={`w-4 h-4 ${isObsidian ? 'text-[#E6C97A]' : 'text-amber-400'}`} />
                      <span>My Appointments</span>
                    </div>
                  </NavLink>
                  <NavLink onClick={() => setShowMenu(false)} to="/paw-wallet" className="w-full block">
                    <div className={`px-5 py-3.5 rounded-xl font-medium text-[15px] flex items-center gap-3 transition-all ${
                      isObsidian ? 'text-neutral-400 hover:bg-white/5 hover:text-white' : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}>
                      <Wallet className={`w-4 h-4 ${isObsidian ? 'text-[#E6C97A]' : 'text-amber-400'}`} />
                      <span>Paw Wallet</span>
                    </div>
                  </NavLink>
                  <NavLink onClick={() => setShowMenu(false)} to="/messages" className="w-full block">
                    <div className={`px-5 py-3.5 rounded-xl font-medium text-[15px] flex items-center justify-between transition-all ${
                      isObsidian ? 'text-neutral-400 hover:bg-white/5 hover:text-white' : 'text-white/80 hover:bg-white/5'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Bell className={`w-4 h-4 ${isObsidian ? 'text-[#E6C97A]' : 'text-amber-400'}`} />
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

          {/* Obsidian Elite Member Card */}
          {isObsidian && token && userdata && (
            <div 
              className="mx-5 my-4 p-4 rounded-2xl border border-[#E6C97A]/25 relative overflow-hidden flex items-center justify-between shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(26,26,26,0.9), rgba(10,10,10,0.95))',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)'
              }}
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-[#E6C97A]/10 blur-xl pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E6C97A]/10 border border-[#E6C97A]/35">
                  <Award className="w-5 h-5 text-[#E6C97A]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#E6C97A]/80 uppercase tracking-widest leading-none mb-1">Obsidian Status</span>
                  <span className="text-[14px] font-extrabold text-white leading-tight">ELITE MEMBER</span>
                  <span className="text-[10px] text-neutral-400 mt-0.5">Since May 2024</span>
                </div>
              </div>
              <div className="relative w-12 h-12 shrink-0 flex items-center justify-center z-10">
                <div className="absolute inset-0 border border-[#E6C97A]/20 rounded-full animate-spin [animation-duration:12s] opacity-40" />
                <svg className="w-8 h-8 text-[#E6C97A] drop-shadow-[0_0_8px_rgba(230,201,122,0.4)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 9l10 13 10-13-10-11zm0 3.3L18.4 9 12 20.3 5.6 9 12 5.3z" />
                </svg>
              </div>
            </div>
          )}

          {/* Bottom actions */}
          <div className={`relative z-10 px-6 pt-5 pb-8 sm:pb-6 border-t bg-black/35 ${isObsidian ? 'border-[#E6C97A]/15' : 'border-white/10'}`}>
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
                      <MapPin className={`w-3.5 h-3.5 ${isObsidian ? 'text-[#E6C97A]' : 'text-amber-500'}`} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Location Status</span>
                    </div>
                    {userLocation ? (
                      <p className={`text-[13px] font-semibold mt-1 ${isObsidian ? 'text-[#E6C97A]' : 'text-amber-300'}`}>
                        {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-[13px] font-semibold text-white/50 mt-1">Not Available</p>
                    )}
                  </div>
                  {isObsidian ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={refreshUserLocation}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E6C97A]/30 bg-[#E6C97A]/5 text-[#E6C97A] text-[11px] font-extrabold uppercase tracking-wide"
                    >
                      <Radio className="w-3.5 h-3.5 text-[#E6C97A] animate-pulse" />
                      <span>Update</span>
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05, rotate: 180 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={refreshUserLocation}
                      className="w-8 h-8 rounded-full flex items-center justify-center border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    >
                      <Radio className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(231, 76, 60, 0.15)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { Logout(); setShowMenu(false); }}
                  className={`w-full py-3.5 rounded-xl text-[14px] font-bold text-red-400 transition-all flex items-center justify-center gap-2 border ${
                    isObsidian 
                      ? 'border-red-500/15 bg-red-500/5 hover:border-red-500/30' 
                      : 'border-red-500/20 bg-red-500/5 hover:border-red-500/40'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </motion.button>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { navigate('/login'); setShowMenu(false); }}
                  className={`w-full py-3.5 rounded-xl text-[15px] font-bold text-white border transition-all ${
                    isObsidian ? 'border-[#E6C97A]/20 hover:bg-white/5' : 'border-white/20 hover:bg-white/5'
                  }`}
                >
                  {t('navbar.createAccount')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: isObsidian ? `0 8px 20px rgba(230,201,122,0.2)` : `0 8px 20px rgba(200,134,10,0.3)` }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { navigate('/login-form'); setShowMenu(false); }}
                  className="w-full py-3.5 rounded-xl text-[15px] font-bold text-white transition-all shadow-md"
                  style={{ 
                    background: isObsidian 
                      ? 'linear-gradient(135deg, #8c6d23, #e6c97a)' 
                      : `linear-gradient(135deg, ${B.mid}, ${B.amber})` 
                  }}
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
);

// ─── Main Navbar Component ────────────────────────────────────────────────────
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
  const isObsidian = activePlan === 'Obsidian';
  const theme = isObsidian ? THEME.obsidian : THEME.light;

  const primaryLinksToRender = isObsidian
    ? [
      ...PRIMARY_LINKS,
      { to: '/ai-features', label: 'AI Features ✨', icon: Sparkles },
    ]
    : PRIMARY_LINKS;

  const secondaryLinksToRender = isObsidian
    ? SECONDARY_LINKS.filter(link => link.to !== '/ai-features')
    : SECONDARY_LINKS;

  const brandedLogo = getPlanLogo(activePlan);

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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setIsMoreOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        localStorage.removeItem('subscriptionPlan');
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

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 120 }}
        className="fixed top-4 left-4 right-4 md:left-6 md:right-6 lg:left-8 lg:right-8 max-w-7xl mx-auto z-50 flex items-center justify-between px-4 md:px-6 rounded-full border"
        style={{
          height: '60px',
          background: isScrolled ? theme.bg.scrolled : theme.bg.base,
          borderColor: isScrolled ? theme.border.scrolled : theme.border.base,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: isScrolled ? theme.shadow.base : theme.shadow.sm,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ── Logo ───────────────────────────────────────────────────────── */}
        <div className="relative flex items-center shrink-0">
          <img
            onClick={() => navigate('/')}
            className="h-8 lg:h-8.5 w-auto object-contain cursor-pointer drop-shadow-sm hover:scale-[1.03] transition-transform duration-300"
            src={brandedLogo || "https://i.ibb.co/R2Y4vBk/Screenshot-2024-11-23-000108-removebg-preview.png"}
            alt="PawVaidya Logo"
          />
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
        <div className="hidden md:flex flex-1 justify-center items-center gap-2 lg:gap-3.5 mx-4">
          {primaryLinksToRender.map((link) => (
            <NavLinkItem key={link.to} {...link} isObsidian={isObsidian} theme={theme} t={t} />
          ))}

          {/* "More" dropdown */}
          <div className="relative shrink-0" ref={moreRef}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="relative flex items-center gap-1.5 px-3 lg:px-3.5 h-10 rounded-full cursor-pointer select-none group"
              style={{ color: isMoreOpen ? theme.text.primary : theme.text.secondary }}
            >
              {isMoreOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: theme.bg.dropdown, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 0 }}
                />
              )}
              {!isMoreOpen && (
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: theme.bg.hover, zIndex: 0 }} />
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

            <AnimatePresence>
              {isMoreOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] w-56 rounded-2xl overflow-hidden z-50"
                  style={{
                    background: theme.bg.dropdown,
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: `1px solid ${theme.border.dropdown}`,
                    boxShadow: theme.shadow.lg,
                  }}
                >
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 rounded-sm"
                    style={{ background: theme.bg.dropdown, borderTop: `1px solid ${theme.border.dropdown}`, borderLeft: `1px solid ${theme.border.dropdown}` }} />
                  <div className="py-2 px-1.5">
                    {secondaryLinksToRender.map(({ to, labelKey, label, icon: Icon, live }) => (
                      <NavLink key={to} to={to} onClick={() => setIsMoreOpen(false)} className="block">
                        {({ isActive }) => (
                          <motion.div
                            whileHover={{ x: 3, backgroundColor: theme.bg.active }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-200`}
                            style={{ backgroundColor: isActive ? theme.bg.active : 'transparent' }}
                          >
                            <Icon className="w-[18px] h-[18px] shrink-0"
                              style={{ color: isActive ? theme.text.accent : theme.text.tertiary }}
                              strokeWidth={isActive ? 2.2 : 1.8} />
                            <span className="text-[14px] flex items-center gap-2"
                              style={{ color: isActive ? theme.text.primary : theme.text.secondary, fontWeight: isActive ? 650 : 500 }}>
                              {live ? (
                                <>
                                  {label || (labelKey ? t(labelKey) : '')}
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                  </span>
                                </>
                              ) : (labelKey ? t(labelKey) : label)}
                            </span>
                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: theme.text.accent }} />}
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

          {token && userdata && (
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => navigate('/messages')}
              className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 shrink-0`}
              style={{ color: theme.text.secondary }}
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

          {authLoading ? (
            <div className="hidden md:flex items-center gap-2.5 px-2.5 h-10 rounded-full border animate-pulse" style={{ background: 'rgba(255,255,255,0.4)', borderColor: 'rgba(232,213,176,0.2)' }}>
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2 px-3 h-10 rounded-full transition-all duration-300 shrink-0`}
                style={{
                  background: isDropdownOpen ? theme.bg.dropdown : 'transparent',
                  color: theme.text.primary,
                }}
              >
                <div className="relative shrink-0">
                  <img
                    className="w-8 h-8 rounded-full object-cover"
                    style={{ border: `2.5px solid ${theme.text.accent}`, boxShadow: isObsidian ? '0 2px 8px rgba(139,92,246,0.3)' : '0 2px 8px rgba(200,134,10,0.15)' }}
                    src={userdata.image}
                    alt="Profile"
                  />
                  {userdata?.subscription?.plan && userdata.subscription.plan !== 'None' ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm ring-1.5 ring-white"
                      style={{ background: getPlanGradient(userdata.subscription.plan) }}
                    >
                      {userdata.subscription.plan[0]}
                    </motion.div>
                  ) : (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                  )}
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                  <span className="hidden lg:block text-[13px] font-semibold tracking-tight" style={{ color: theme.text.primary }}>
                    {userdata.name}
                  </span>
                  {userdata?.subscription?.plan && userdata.subscription.plan !== 'None' && (
                    <span className="hidden lg:block text-[9px] font-bold uppercase tracking-wider" style={{ color: theme.text.accent, opacity: 0.9 }}>
                      {userdata.subscription.plan} Member
                    </span>
                  )}
                </div>
                <motion.div animate={{ rotate: isDropdownOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" style={{ color: theme.text.primary }} />
                </motion.div>
              </motion.button>
              <UserDropdown
                isDropdownOpen={isDropdownOpen}
                setIsDropdownOpen={setIsDropdownOpen}
                userdata={userdata}
                unreadMessages={unreadMessages}
                Logout={Logout}
                refreshUserLocation={refreshUserLocation}
                userLocation={userLocation}
                navigate={navigate}
                t={t}
                theme={theme}
                isObsidian={isObsidian}
              />
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.04, color: theme.text.primary }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/login')}
                className="px-4 h-9 flex items-center justify-center rounded-full text-[13.5px] font-bold transition-all duration-300"
                style={{ color: theme.text.secondary }}
              >
                {t('navbar.createAccount')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: `0 8px 24px rgba(168,133,96,0.35)`, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/login-form')}
                className="px-5 h-9 flex items-center justify-center rounded-full text-[13.5px] font-bold text-white transition-all duration-300"
                style={{ background: `linear-gradient(135deg, #c8a27b, #a88560)`, boxShadow: `0 4px 16px rgba(168,133,96,0.2)` }}
              >
                {t('navbar.login')}
              </motion.button>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setShowMenu(true)}
            className="md:hidden p-2.5 rounded-full transition-all shrink-0"
            style={{
              color: theme.text.secondary,
              background: theme.bg.hover,
              border: `1px solid ${theme.border.base}`,
              boxShadow: '0 2px 8px rgba(61,43,31,0.03)'
            }}
          >
            <Menu className="w-[22px] h-[22px] opacity-80" strokeWidth={2.5} />
          </motion.button>
        </div>
      </motion.nav>

      <MobileMenu
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        userdata={userdata}
        token={token}
        authLoading={authLoading}
        navigate={navigate}
        t={t}
        sendVerificationOtp={sendVerificationOtp}
        unreadMessages={unreadMessages}
        refreshUserLocation={refreshUserLocation}
        userLocation={userLocation}
        Logout={Logout}
        brandedLogo={brandedLogo}
        isObsidian={isObsidian}
        theme={theme}
      />
    </>
  );
};

export default Navbar;
