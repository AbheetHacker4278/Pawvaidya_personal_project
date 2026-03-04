import React, { useContext, useState, useEffect } from 'react';
import { AdminContext } from '../context/AdminContext';
import { useNavigate } from 'react-router';
import { DoctorContext } from '../context/DoctorContext';
import { assets } from '../assets/assets_admin/assets';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, User, LogOut, ChevronDown, Bell, Settings, Home, MessageSquare } from 'lucide-react';

const Navbar = ({ toggleSidebar }) => {
  const { atoken, setatoken, getAdminProfile, adminProfile } = useContext(AdminContext);
  const { dtoken, setdtoken, getProfileData, profileData } = useContext(DoctorContext);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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
      className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-8 py-3 transition-all duration-500 ${scrolled
          ? 'bg-white/70 backdrop-blur-xl shadow-lg border-b border-emerald-50/50'
          : 'bg-white/40 backdrop-blur-md border-b border-white/20'
        }`}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-6 h-6" />
        </motion.button>

        <motion.div
          onClick={handleImageClick}
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <img
            className="w-32 sm:w-36 h-auto drop-shadow-sm"
            src="https://i.ibb.co/R2Y4vBk/Screenshot-2024-11-23-000108-removebg-preview.png"
            alt="PawVaidya Logo"
          />
        </motion.div>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
          />
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
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
            className="hidden sm:flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group"
          >
            <Search className="w-4 h-4 group-hover:text-emerald-500 transition-colors" />
            <span className="text-sm font-medium pr-4">Search...</span>
            <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-500 shadow-sm">
              <span className="text-[12px]">⌘</span>K
            </div>
          </motion.button>
        )}

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* User Profile */}
          <div className="relative dropdown-container">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 p-1 rounded-2xl bg-white shadow-sm border border-emerald-50 hover:shadow-md transition-all pr-3"
            >
              <div className="relative">
                <img
                  src={dtoken ? (profileData?.image || assets.doctor_icon) : (adminProfile?.image || assets.people_icon)}
                  alt="avatar"
                  className="w-8 h-8 rounded-xl object-cover border-2 border-emerald-50"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div className="hidden md:flex flex-col items-start leading-none group">
                <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">
                  {dtoken ? (profileData?.name || 'Doctor') : (adminProfile?.name || 'Admin')}
                </span>
                <span className="text-[9px] font-bold text-emerald-600 mt-1">
                  {atoken ? (adminProfile?.role || 'Moderator') : 'Verified Vet'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-3 w-56 bg-white/95 backdrop-blur-xl border border-emerald-50 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-2 border-b border-emerald-50 bg-emerald-50/20">
                    <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest px-3 py-1">Menu</p>
                  </div>

                  <div className="p-1.5">
                    <button
                      onClick={() => { setMenuOpen(false); handleImageClick(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-emerald-50 rounded-xl transition-colors font-bold"
                    >
                      <Home className="w-4 h-4 text-emerald-600" />
                      <span>Dashboard</span>
                    </button>

                    <button
                      onClick={() => { setMenuOpen(false); navigate(atoken ? '/admin-profile' : '/doctor-profile'); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-emerald-50 rounded-xl transition-colors font-bold"
                    >
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>My Profile</span>
                    </button>

                    <div className="h-px bg-emerald-50 my-1 mx-2" />

                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>

                  <div className="bg-slate-50/50 p-3 flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow shadow-emerald-500/50" />
                      <div className="w-2 h-2 rounded-full bg-slate-200" />
                      <div className="w-2 h-2 rounded-full bg-slate-200" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase">PawVaidya v2.4</span>
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
