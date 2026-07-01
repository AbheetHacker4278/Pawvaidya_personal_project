import React, { useContext, useState, useEffect } from 'react';
import { AdminContext } from '../context/AdminContext';
import { useNavigate } from 'react-router';
import { DoctorContext } from '../context/DoctorContext';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets_admin/assets';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, User, LogOut, ChevronDown, Bell, Settings, Home, MessageSquare, RefreshCw, Sun, Moon } from 'lucide-react';
import EmergencyAlertBell from './EmergencyAlertBell';
import logoDark from '../assets/assets_admin/pawvaidya_logo.png';

const Navbar = ({ toggleSidebar }) => {
  const { atoken, setatoken, getAdminProfile, adminProfile, syncLegacyFiles, broadcastReuploadDocs } = useContext(AdminContext);
  const { dtoken, setdtoken, getProfileData, profileData } = useContext(DoctorContext);
  const { theme, toggleTheme } = useContext(AppContext);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncLegacyFiles();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleBroadcastReupload = async () => {
    if (!window.confirm("Are you sure you want to send a global broadcast request to all Doctors and CS Agents to delete and re-upload all documents?")) return;
    setBroadcasting(true);
    try {
      await broadcastReuploadDocs();
    } catch (err) {
      console.error(err);
    } finally {
      setBroadcasting(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (dtoken) getProfileData();
    if (atoken) getAdminProfile();
  }, [dtoken, atoken]);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.dropdown-container')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const logout = () => {
    navigate('/');
    if (dtoken) {
      setdtoken('');
      localStorage.removeItem('dtoken');
    }
    if (atoken) {
      setatoken('');
      localStorage.removeItem('atoken');
    }
  };

  const handleImageClick = () => {
    if (atoken) navigate('/admin-dashboard');
    else if (dtoken) navigate('/doctor-dashboard');
  };

  return (
    <nav
      className={`dark-shell fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-8 py-3 transition-all duration-500 ${scrolled
        ? 'bg-white/70 dark:bg-[#060b14] backdrop-blur-xl shadow-lg shadow-black/20 dark:shadow-black/60 border-b border-emerald-50/50 dark:border-[#111827]'
        : 'bg-white/40 dark:bg-[#060b14] backdrop-blur-md border-b border-white/20 dark:border-[#111827]'
        }`}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-[#0f1729] dark:text-emerald-400 dark:hover:bg-[#131d33] transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-6 h-6" />
        </motion.button>

        <motion.div
          onClick={handleImageClick}
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-2 cursor-pointer"
        >
          {theme === 'dark' ? (
            <div className="w-28 sm:w-32 h-7 sm:h-8 relative overflow-hidden flex items-center justify-center">
              <img
                className="h-[300%] w-auto max-w-none object-contain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                src={logoDark}
                alt="PawVaidya Logo"
              />
            </div>
          ) : (
            <img
              className="w-28 sm:w-32 h-auto drop-shadow-sm transition-all duration-300"
              src="https://i.ibb.co/R2Y4vBk/Screenshot-2024-11-23-000108-removebg-preview.png"
              alt="PawVaidya Logo"
            />
          )}
        </motion.div>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 dark:bg-[#0c1a12] dark:border-emerald-900/40">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
          />
          <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            {atoken ? 'Admin Live' : 'Doctor Live'}
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Omni-Search */}
        {atoken && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
            className="hidden sm:flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50/50 dark:bg-[#0f1729] dark:border-[#1a2540] dark:text-slate-500 dark:hover:border-emerald-800/40 dark:hover:bg-[#131d33] transition-all group"
          >
            <Search className="w-4 h-4 group-hover:text-emerald-500 transition-colors" />
            <span className="text-sm font-medium pr-4">Search...</span>
            <div className="flex items-center gap-0.5 bg-white border border-slate-200 dark:bg-[#0a1020] dark:border-[#1a2540] rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-500 shadow-sm">
              <span className="text-[12px]">⌘</span>K
            </div>
          </motion.button>
        )}
        {/* Sync Button */}
        {atoken && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSync}
            disabled={syncing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${syncing
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-not-allowed'
              : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700 hover:border-emerald-600 shadow-sm shadow-emerald-600/10'
              }`}
            title="Sync legacy non-image files to Firebase"
          >
            <motion.div
              animate={syncing ? { rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </motion.div>
            <span>{syncing ? 'Syncing...' : 'Sync Files'}</span>
          </motion.button>
        )}

        {/* Request Re-upload Button */}
        {atoken && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBroadcastReupload}
            disabled={broadcasting}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${broadcasting
              ? 'bg-amber-50 text-amber-600 border-amber-200 cursor-not-allowed animate-pulse'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 hover:from-amber-600 hover:to-amber-700 hover:border-amber-600 shadow-sm shadow-amber-600/10'
              }`}
            title="Request Doctors and CS Agents to delete and re-upload documents"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{broadcasting ? 'Sending...' : 'Request Re-upload'}</span>
          </motion.button>
        )}

        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-[#0f1729] dark:hover:text-emerald-400 transition-all"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-500 animate-[spin_20s_linear_infinite]" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {/* Emergency Alert Bell for Doctors | Static bell for Admins */}
          {dtoken ? (
            <EmergencyAlertBell />
          ) : (
            <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-[#0f1729] dark:hover:text-emerald-400 transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 dark:bg-[#1a2540] mx-1 hidden sm:block" />

          {/* User Profile */}
          <div className="relative dropdown-container">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 p-1 rounded-2xl bg-white dark:bg-[#0f1729] shadow-sm border border-emerald-50 dark:border-[#1a2540] hover:shadow-md transition-all pr-3"
            >
              <div className="relative">
                <img
                  src={dtoken ? (profileData?.image || assets.doctor_icon) : (adminProfile?.image || assets.people_icon)}
                  alt="avatar"
                  className="w-8 h-8 rounded-xl object-cover border-2 border-emerald-50 dark:border-[#1a2540]"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#080d19]" />
              </div>
              <div className="hidden md:flex flex-col items-start leading-none group">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">
                  {dtoken ? (profileData?.name || 'Doctor') : (adminProfile?.name || 'Admin')}
                </span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {atoken ? (adminProfile?.role || 'Moderator') : 'Verified Vet'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-300" />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-3 w-56 bg-white/95 dark:bg-[#0a1020] backdrop-blur-xl border border-emerald-50 dark:border-[#1a2540] rounded-2xl shadow-2xl dark:shadow-black/50 z-50 overflow-hidden"
                >
                  <div className="p-2 border-b border-emerald-50 dark:border-[#141c2e] bg-emerald-50/20 dark:bg-[#0c1424]">
                    <p className="text-[10px] font-black text-emerald-800/40 dark:text-emerald-400/40 uppercase tracking-widest px-3 py-1">Menu</p>
                  </div>

                  <div className="p-1.5">
                    <button
                      onClick={() => { setMenuOpen(false); handleImageClick(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-[#0f1729] rounded-xl transition-colors font-bold"
                    >
                      <Home className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Dashboard</span>
                    </button>

                    <button
                      onClick={() => { setMenuOpen(false); navigate(atoken ? '/admin-profile' : '/doctor-profile'); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-[#0f1729] rounded-xl transition-colors font-bold"
                    >
                      <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>My Profile</span>
                    </button>

                    <div className="h-px bg-emerald-50 dark:bg-[#1a2540] my-1 mx-2" />

                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-[#1a0f17] rounded-xl transition-colors font-bold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>

                  <div className="bg-slate-50/50 dark:bg-[#060b16] p-3 flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow shadow-emerald-500/50" />
                      <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-[#1a2540]" />
                      <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-[#1a2540]" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">PawVaidya v2.4</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
