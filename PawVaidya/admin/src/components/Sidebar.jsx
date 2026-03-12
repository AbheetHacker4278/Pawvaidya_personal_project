import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { NavLink, useLocation } from 'react-router-dom';
import assets from '../assets/assets_admin/assets';
import { DoctorContext } from '../context/DoctorContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, User, History, Users, Calendar, UserPlus,
  Stethoscope, Trophy, Radio, MessageSquare, Mail,
  AlertTriangle, Trash2, ShieldCheck, Database,
  Clock, BookOpen, ClipboardList, Tag, Tv, Search,
  Menu, X, ChevronRight, Bell, ShieldAlert, BarChart3, Server
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, isOpen, onClick, subtext, badge }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `
        relative group flex items-center h-12 my-1 mx-3 rounded-xl transition-all duration-300 overflow-hidden
        ${isActive
          ? 'bg-gradient-to-r from-emerald-500/90 to-green-600/90 text-white shadow-lg shadow-emerald-200/50'
          : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
        }
        ${!isOpen ? 'justify-center mx-2 px-0' : 'px-3'}
      `}
    >
      <div className={`flex items-center justify-center ${!isOpen ? 'w-10' : 'w-6'} transition-all text-center`}>
        {typeof Icon === 'string' ? (
          <img src={Icon} alt="" className={`w-5 h-5 flex-shrink-0 ${isActive ? 'invert brightness-0' : ''}`} />
        ) : (
          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
        )}
      </div>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="ml-3 flex flex-col overflow-hidden whitespace-nowrap"
          >
            <p className="text-sm font-bold tracking-tight">{label}</p>
            {subtext && <p className="text-[10px] opacity-70 font-medium">{subtext}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge / Indicator — show numeric count */}
      {badge > 0 && (
        <span className={`absolute ${isOpen ? 'right-2' : 'top-1 right-1'} flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black border border-white shadow-sm shadow-rose-200 animate-pulse`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Tooltip for collapsed mode */}
      {!isOpen && (
        <div className="absolute left-16 px-3 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-1 group-hover:translate-x-0 z-[60] whitespace-nowrap shadow-xl">
          {label}
        </div>
      )}

      {/* Active Indicator Glow */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
        />
      )}
    </NavLink>
  );
};

const SectionHeader = ({ label, isOpen }) => (
  <AnimatePresence>
    {isOpen ? (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-6 mt-6 mb-2"
      >
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {label}
        </p>
      </motion.div>
    ) : (
      <div className="h-px bg-slate-100 mx-4 my-6 opacity-50" />
    )}
  </AnimatePresence>
);

const Sidebar = ({ isOpen }) => {
  const { atoken, backendurl, adminProfile, securityIncidentCount, contentViolationCount } = useContext(AdminContext);
  const { dtoken } = useContext(DoctorContext);

  const logNavigation = async (section) => {
    if (!atoken) return;
    try {
      await axios.post(backendurl + '/api/admin/log-activity', {
        activityType: 'navigation',
        activityDescription: `Navigated to ${section}`,
        metadata: { button_clicked: section }
      }, { headers: { atoken } });
    } catch (error) {
      console.error("Failed to log navigation:", error);
    }
  };

  const hasPerm = (perm) => adminProfile?.permissions?.includes('all') || adminProfile?.permissions?.includes(perm);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        animate={{ width: isOpen ? 288 : 80 }}
        className={`fixed top-16 left-0 z-40 h-[calc(100vh-64px)] transition-shadow duration-500 ease-in-out
          ${isOpen ? 'shadow-2xl' : 'shadow-lg'}
          bg-white/70 backdrop-blur-xl border-r border-emerald-50/50
          flex flex-col overflow-hidden
        `}
      >
        {/* Background Decorative Blobs */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 -right-20 w-32 h-32 bg-green-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-4">
          {atoken && (
            <div className="flex flex-col">
              <SectionHeader label="Insights" isOpen={isOpen} />
              <SidebarItem to="/admin-dashboard" icon={LayoutDashboard} label="Dashboard" subtext="Overview & Stats" isOpen={isOpen} onClick={() => logNavigation('Dashboard')} />
              {adminProfile?.role === 'master' && (
                <SidebarItem to="/admin-deployments" icon={Server} label="Deployments" subtext="Render Status" isOpen={isOpen} onClick={() => logNavigation('Deployments')} />
              )}

              <SectionHeader label="Management" isOpen={isOpen} />
              {adminProfile?.role === 'master' && (
                <SidebarItem to="/manage-admins" icon={ShieldCheck} label="Manage Admins" subtext="Privileges & Roles" isOpen={isOpen} onClick={() => logNavigation('Manage Admins')} />
              )}
              {hasPerm('appointments') && (
                <SidebarItem to="/all-appointments" icon={Calendar} label="Appointments" subtext="Global Bookings" isOpen={isOpen} onClick={() => logNavigation('Appointments')} />
              )}
              {hasPerm('add_doctor') && (
                <SidebarItem to="/add-doctor" icon={UserPlus} label="Add Doctor" subtext="Onboard New Vet" isOpen={isOpen} onClick={() => logNavigation('Add Doctor')} />
              )}
              {hasPerm('doctors') && (
                <SidebarItem to="/doctor-list" icon={Stethoscope} label="Doctor List" subtext="Directory" isOpen={isOpen} onClick={() => logNavigation('Doctor List')} />
              )}
              {hasPerm('doctors') && (
                <SidebarItem to="/doctor-rankings" icon={Trophy} label="Top Doctors" subtext="Performance" isOpen={isOpen} onClick={() => logNavigation('Doctor Rankings')} />
              )}
              {hasPerm('users') && (
                <SidebarItem to="/total-users" icon={Users} label="Total Users" subtext="Client Registry" isOpen={isOpen} onClick={() => logNavigation('Total Users')} />
              )}
              {adminProfile?.role === 'master' && (
                <SidebarItem to="/media-registry" icon={Database} label="Media Registry" subtext="Cloud Assets" isOpen={isOpen} onClick={() => logNavigation('Media Registry')} />
              )}
              {adminProfile?.role === 'master' && (
                <SidebarItem to="/blacklist-management" icon={ShieldAlert} label="Blacklist" subtext="Blocked Emails" isOpen={isOpen} onClick={() => logNavigation('Blacklist')} />
              )}
              {adminProfile?.role === 'master' && (
                <SidebarItem to="/manage-coupons" icon={Tag} label="Coupons" subtext="Admin Subsidy" isOpen={isOpen} onClick={() => logNavigation('Coupons')} />
              )}
              {hasPerm('all') && (
                <SidebarItem to="/polls" icon={BarChart3} label="Polls" subtext="Riddles & Questions" isOpen={isOpen} onClick={() => logNavigation('Polls')} />
              )}
              {adminProfile?.role === 'master' && (
                <SidebarItem to="/security-monitoring" icon={ShieldAlert} label="Security Monitor" subtext="Threats & Content" isOpen={isOpen} onClick={() => logNavigation('Security Monitor')} badge={securityIncidentCount + contentViolationCount} />
              )}

              <SectionHeader label="Communication" isOpen={isOpen} />
              {hasPerm('doctors') && (
                <SidebarItem to="/admin-live-streams" icon={Radio} label="Live Streams" subtext="Active Broadcasters" badge={1} isOpen={isOpen} />
              )}
              {hasPerm('messages') && (
                <SidebarItem to="/admin-messages" icon={MessageSquare} label="Messages" subtext="Support Inbox" isOpen={isOpen} onClick={() => logNavigation('Messages')} />
              )}
              {hasPerm('messages') && (
                <SidebarItem to="/broadcast-email" icon={Mail} label="Broadcast Email" subtext="Mass Campaigns" isOpen={isOpen} onClick={() => logNavigation('Broadcast Email')} />
              )}
              {hasPerm('reports') && (
                <SidebarItem to="/all-reports" icon={assets.AlertCircle || AlertTriangle} label="All Reports" subtext="System Flags" isOpen={isOpen} onClick={() => logNavigation('All Reports')} />
              )}
              {hasPerm('reports') && (
                <SidebarItem to="/app-issue-reports" icon={Search} label="App Issues" subtext="Bugs & UI Feedback" isOpen={isOpen} onClick={() => logNavigation('App Issues')} />
              )}
              {hasPerm('unban') && (
                <SidebarItem to="/unban-requests" icon={Clock} label="Unban Requests" subtext="Appeals Portal" isOpen={isOpen} onClick={() => logNavigation('Unban Requests')} />
              )}
              {hasPerm('users') && (
                <SidebarItem to="/deletion-requests" icon={ShieldAlert} label="Deletion Requests" subtext="Account Removal" isOpen={isOpen} onClick={() => logNavigation('Deletion Requests')} />
              )}
              {hasPerm('chat') && (
                <SidebarItem to="/doctor-chat" icon={MessageSquare} label="Doctor Chat" subtext="Internal Comms" isOpen={isOpen} onClick={() => logNavigation('Doctor Chat')} />
              )}

              <SectionHeader label="Settings" isOpen={isOpen} />
              <SidebarItem to="/admin-logs" icon={History} label="Activity Logs" subtext="System Audit trail" isOpen={isOpen} onClick={() => logNavigation('Logs')} />
              <SidebarItem to="/admin-profile" icon={User} label="Admin Profile" subtext="Account Details" isOpen={isOpen} onClick={() => logNavigation('Profile')} />
              {hasPerm('trash') && (
                <SidebarItem to="/trash" icon={Trash2} label="Trash" subtext="Archived Data" isOpen={isOpen} onClick={() => logNavigation('Trash')} />
              )}
            </div>
          )}

          {dtoken && (
            <div className="flex flex-col">
              <SectionHeader label="Core" isOpen={isOpen} />
              <SidebarItem to="/doctor-dashboard" icon={LayoutDashboard} label="Dashboard" subtext="Daily Statistics" isOpen={isOpen} />
              <SidebarItem to="/doctor-profile" icon={User} label="My Profile" subtext="Personal Info" isOpen={isOpen} />

              <SectionHeader label="Practice" isOpen={isOpen} />
              <SidebarItem to="/doctor-appointments" icon={Calendar} label="Appointments" subtext="Client Schedule" isOpen={isOpen} />
              <SidebarItem to="/doctor-schedule" icon={Clock} label="My Schedule" subtext="Consultation Hours" isOpen={isOpen} />
              <SidebarItem to="/patient-records" icon={ClipboardList} label="Patient Records" subtext="Medical History" isOpen={isOpen} />

              <SectionHeader label="Growth" isOpen={isOpen} />
              <SidebarItem to="/doctor-blogs" icon={BookOpen} label="My Blogs" subtext="Published Articles" isOpen={isOpen} />
              <SidebarItem to="/doctor-discounts" icon={Tag} label="Discounts" subtext="Offer Management" isOpen={isOpen} />

              <SectionHeader label="Communication" isOpen={isOpen} />
              <SidebarItem to="/doctor-messages" icon={MessageSquare} label="Messages" subtext="Patient Chat" isOpen={isOpen} />
              <SidebarItem to="/admin-chat" icon={User} label="Admin Chat" subtext="Direct Line" isOpen={isOpen} />
              <SidebarItem to="/doctor-live-stream" icon={Radio} label="Go Live" subtext="Broadcasting" isOpen={isOpen} />
              <SidebarItem to="/doctor-watch-admin-stream" icon={Tv} label="Admin Stream" subtext="Watch Updates" isOpen={isOpen} />
            </div>
          )}
        </div>

        {/* Bottom Footer Info (Optional) */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 border-t border-emerald-50 bg-emerald-50/20"
          >
            <div className="flex items-center gap-2 p-3 bg-white/50 rounded-2xl border border-white">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs shadow-inner">
                PV
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-emerald-800 uppercase leading-none">PawVaidya v2.4</p>
                <p className="text-[9px] text-emerald-600/70 font-bold mt-1">Hacker Edition</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.aside>

      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
