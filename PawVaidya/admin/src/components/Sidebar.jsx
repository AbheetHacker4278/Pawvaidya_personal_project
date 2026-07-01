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
  Clock, BookOpen, ClipboardList, Tag, Tv, Search, Star,
  Menu, X, ChevronRight, Bell, ShieldAlert, BarChart3, Server, Activity, Scan, Cloud, Heart, FlaskConical, Zap, Award, Ambulance
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
          ? 'bg-gradient-to-r from-emerald-500/90 to-green-600/90 text-white shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30'
          : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-[#0a1020] dark:hover:text-emerald-400'
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
        <span className={`absolute ${isOpen ? 'right-2' : 'top-1 right-1'} flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black border border-white dark:border-[#060b14] shadow-sm shadow-rose-200 dark:shadow-none animate-pulse`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Tooltip for collapsed mode */}
      {!isOpen && (
        <div className="absolute left-16 px-3 py-1 bg-slate-800 dark:bg-[#0a1020] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-1 group-hover:translate-x-0 z-[60] whitespace-nowrap shadow-xl dark:shadow-black/40 dark:border dark:border-[#1a2540]">
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
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
          {label}
        </p>
      </motion.div>
    ) : (
      <div className="h-px bg-slate-100 dark:bg-[#111827] mx-4 my-6 opacity-50 dark:opacity-100" />
    )}
  </AnimatePresence>
);

const Sidebar = ({ isOpen }) => {
  const { atoken, backendurl, adminProfile, securityIncidentCount, contentViolationCount } = useContext(AdminContext);
  const { dtoken, unreadDoctorMessagesCount } = useContext(DoctorContext);
  const [firebaseStats, setFirebaseStats] = useState(null);

  React.useEffect(() => {
    if (!atoken) return;
    const fetchFirebaseStats = async () => {
      try {
        const { data } = await axios.get(backendurl + '/api/admin/firebase-storage-stats', {
          headers: { atoken }
        });
        if (data && data.success) {
          setFirebaseStats(data);
        }
      } catch (err) {
        console.error("Error fetching Firebase Storage Stats in Sidebar:", err);
      }
    };

    fetchFirebaseStats();
    const interval = setInterval(fetchFirebaseStats, 30000);
    return () => clearInterval(interval);
  }, [atoken, backendurl]);

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

  const hasPerm = (perm) => 
    adminProfile?.role === 'master' || 
    adminProfile?.permissions?.includes('all') || 
    adminProfile?.permissions?.includes(perm);

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
        className={`dark-shell fixed top-16 left-0 z-40 h-[calc(100vh-64px)] transition-shadow duration-500 ease-in-out
          ${isOpen ? 'shadow-2xl dark:shadow-black/40' : 'shadow-lg dark:shadow-black/30'}
          bg-white/70 dark:bg-[#060b14] backdrop-blur-xl border-r border-emerald-50/50 dark:border-[#111827]
          flex flex-col overflow-hidden
        `}
      >
        {/* Background Decorative Blobs */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-100/30 dark:bg-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 -right-20 w-32 h-32 bg-green-100/30 dark:bg-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-4">
          {atoken && (
            <div className="flex flex-col">
              <SectionHeader label="Insights" isOpen={isOpen} />
              <SidebarItem to="/admin-dashboard" icon={LayoutDashboard} label="Dashboard" subtext="Overview & Stats" isOpen={isOpen} onClick={() => logNavigation('Dashboard')} />
              {hasPerm('financials') && (
                <SidebarItem to="/financial-calculations" icon={BarChart3} label="Financials" subtext="Treasury & Loss" isOpen={isOpen} onClick={() => logNavigation('Financials')} />
              )}
              {hasPerm('deployments') && (
                <SidebarItem to="/admin-deployments" icon={Server} label="Deployments" subtext="Render Status" isOpen={isOpen} onClick={() => logNavigation('Deployments')} />
              )}
              {hasPerm('redis_monitor') && (
                <SidebarItem to="/redis-monitoring" icon={Activity} label="Redis Monitor" subtext="Cache Performance" isOpen={isOpen} onClick={() => logNavigation('Redis Monitor')} />
              )}

              <SectionHeader label="Management" isOpen={isOpen} />
              {(adminProfile?.role === 'master' || hasPerm('manage_admins')) && (
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
              {hasPerm('customer360') && (
                <SidebarItem to="/customer-360" icon={Search} label="Customer 360" subtext="360° Profile View" isOpen={isOpen} onClick={() => logNavigation('Customer 360')} />
              )}
              {(hasPerm('users') || hasPerm('customer360')) && (
                <SidebarItem to="/user-trust-suite" icon={ShieldCheck} label="User & Trust" subtext="Integrity & GDPR Desk" isOpen={isOpen} onClick={() => logNavigation('User Trust Suite')} />
              )}
              {hasPerm('financials') && (
                <SidebarItem to="/revenue-business-suite" icon={BarChart3} label="Revenue & Biz" subtext="Churn & Payouts" isOpen={isOpen} onClick={() => logNavigation('Revenue Business Suite')} />
              )}
              {hasPerm('payment_details') && (
                <SidebarItem to="/payment-details" icon={Database} label="Payment Details" subtext="Transaction History" isOpen={isOpen} onClick={() => logNavigation('Payment Details')} />
              )}
              {hasPerm('subscriptions') && (
                <SidebarItem to="/all-subscriptions" icon={Star} label="All Subscriptions" subtext="Membership Monitor" isOpen={isOpen} onClick={() => logNavigation('All Subscriptions')} />
              )}
              {hasPerm('emergency_panel') && (
                <SidebarItem to="/emergency-dashboard" icon={ShieldAlert} label="Emergency Panel" subtext="Ecosystem Analytics" isOpen={isOpen} onClick={() => logNavigation('Emergency Panel')} />
              )}
              {hasPerm('emergency_panel') && (
                <SidebarItem to="/mobile-icu-dashboard" icon={Ambulance} label="Mobile ICU" subtext="Live Dispatch Tracker" isOpen={isOpen} onClick={() => logNavigation('Mobile ICU Dashboard')} />
              )}
              {hasPerm('stray_campaigns') && (
                <SidebarItem to="/stray-campaigns" icon={Heart} label="Stray Campaigns" subtext="Monitor & Support" isOpen={isOpen} onClick={() => logNavigation('Stray Campaigns')} />
              )}
              {hasPerm('beta_access') && (
                <SidebarItem to="/beta-access-manager" icon={FlaskConical} label="Beta Access" subtext="Early Tester Program" isOpen={isOpen} onClick={() => logNavigation('Beta Access Manager')} />
              )}
              {hasPerm('media_registry') && (
                <SidebarItem to="/media-registry" icon={Database} label="Media Registry" subtext="Cloud Assets" isOpen={isOpen} onClick={() => logNavigation('Media Registry')} />
              )}
              {hasPerm('blacklist') && (
                <SidebarItem to="/blacklist-management" icon={ShieldAlert} label="Blacklist" subtext="Blocked Emails" isOpen={isOpen} onClick={() => logNavigation('Blacklist')} />
              )}
              {hasPerm('coupons') && (
                <SidebarItem to="/manage-coupons" icon={Tag} label="Coupons" subtext="Admin Subsidy" isOpen={isOpen} onClick={() => logNavigation('Coupons')} />
              )}
              {hasPerm('polls') && (
                <SidebarItem to="/polls" icon={BarChart3} label="Polls" subtext="Riddles & Questions" isOpen={isOpen} onClick={() => logNavigation('Polls')} />
              )}
              {hasPerm('security_monitor') && (
                <SidebarItem to="/security-monitoring" icon={ShieldAlert} label="Security Monitor" subtext="Threats & Content" isOpen={isOpen} onClick={() => logNavigation('Security Monitor')} badge={securityIncidentCount + contentViolationCount} />
              )}
              {hasPerm('security_monitor') && (
                <SidebarItem to="/security-compliance-suite" icon={ShieldCheck} label="Security Policy" subtext="IPs & 2FA Suite" isOpen={isOpen} onClick={() => logNavigation('Security Compliance Suite')} />
              )}

              <SectionHeader label="Communication" isOpen={isOpen} />
              {hasPerm('live_streams') && (
                <SidebarItem to="/admin-live-streams" icon={Radio} label="Live Streams" subtext="Active Broadcasters" badge={1} isOpen={isOpen} />
              )}
              {hasPerm('messages') && (
                <SidebarItem to="/admin-messages" icon={MessageSquare} label="Messages" subtext="Support Inbox" isOpen={isOpen} onClick={() => logNavigation('Messages')} />
              )}
              {hasPerm('broadcast_email') && (
                <SidebarItem to="/broadcast-email" icon={Mail} label="Broadcast Email" subtext="Mass Campaigns" isOpen={isOpen} onClick={() => logNavigation('Broadcast Email')} />
              )}
              {hasPerm('reports') && (
                <SidebarItem to="/all-reports" icon={assets.AlertCircle || AlertTriangle} label="All Reports" subtext="System Flags" isOpen={isOpen} onClick={() => logNavigation('All Reports')} />
              )}
              {hasPerm('app_issues') && (
                <SidebarItem to="/app-issue-reports" icon={Search} label="App Issues" subtext="Bugs & UI Feedback" isOpen={isOpen} onClick={() => logNavigation('App Issues')} />
              )}
              {hasPerm('unban') && (
                <SidebarItem to="/unban-requests" icon={Clock} label="Unban Requests" subtext="Appeals Portal" isOpen={isOpen} onClick={() => logNavigation('Unban Requests')} />
              )}
              {hasPerm('deletion_requests') && (
                <SidebarItem to="/deletion-requests" icon={ShieldAlert} label="Deletion Requests" subtext="Account Removal" isOpen={isOpen} onClick={() => logNavigation('Deletion Requests')} />
              )}
              {hasPerm('chat') && (
                <SidebarItem to="/doctor-chat" icon={MessageSquare} label="Doctor Chat" subtext="Internal Comms" isOpen={isOpen} onClick={() => logNavigation('Doctor Chat')} />
              )}

              <SectionHeader label="Support Service" isOpen={isOpen} />
              {(hasPerm('cs_employees') || adminProfile?.role === 'master_cs_agent') && (
                <SidebarItem to="/cs-employees" icon={Users} label="CS Agents" subtext="Manage Staff" isOpen={isOpen} onClick={() => logNavigation('CS Employees')} />
              )}
              <SidebarItem to="/cs-gamification-arena" icon={Trophy} label="Speedway Arena" subtext="Live Racing Grid" isOpen={isOpen} onClick={() => logNavigation('CS Speedway Arena')} />
              <SidebarItem to="/cs-advanced-gamification" icon={Zap} label="Advanced Gamification" subtext="Fraud & Mentorship" isOpen={isOpen} onClick={() => logNavigation('Advanced Gamification')} />
              {(hasPerm('cs_employees') || adminProfile?.role === 'master_cs_agent') && (
                <SidebarItem to="/cs-complaints" icon={ShieldAlert} label="Agent Complaints" subtext="Staff Grievances" isOpen={isOpen} onClick={() => logNavigation('CS Complaints')} />
              )}
              {(hasPerm('cs_employees') || adminProfile?.role === 'master_cs_agent') && (
                <SidebarItem to="/cs-chat" icon={MessageSquare} label="Agent Chat" subtext="Direct Comms" isOpen={isOpen} onClick={() => logNavigation('CS Agent Chat')} />
              )}
              {(hasPerm('cs_tickets') || adminProfile?.role === 'master_cs_agent') && (
                <SidebarItem to="/cs-tickets" icon={LayoutDashboard} label="CS Tickets" subtext="Global View" isOpen={isOpen} onClick={() => logNavigation('CS Tickets')} />
              )}
              {(hasPerm('misbehavior_reports') || adminProfile?.role === 'master_cs_agent') && (
                <SidebarItem to="/misbehavior-reports" icon={ShieldAlert} label="Complaints" subtext="User Misbehavior" isOpen={isOpen} onClick={() => logNavigation('Misbehavior Reports')} />
              )}
              {(hasPerm('cruelty_reports') || adminProfile?.role === 'master_cs_agent') && (
                <SidebarItem to="/cruelty-reports" icon={AlertTriangle} label="Cruelty Reports" subtext="Animal Abuse Logs" isOpen={isOpen} onClick={() => logNavigation('Cruelty Reports')} />
              )}
              {(hasPerm('cs_reports') || adminProfile?.role === 'master_cs_agent') && (
                <SidebarItem to="/cs-reports" icon={Activity} label="CS Reports" subtext="Agent Metrics" isOpen={isOpen} onClick={() => logNavigation('CS Reports')} />
              )}

              <SectionHeader label="Settings" isOpen={isOpen} />
              <SidebarItem to="/admin-logs" icon={History} label={adminProfile?.role === 'master' ? "Activity Logs" : "My Activities"} subtext="System Audit trail" isOpen={isOpen} onClick={() => logNavigation('Logs')} />
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
              <SidebarItem to="/doctor-emergencies" icon={ShieldAlert} label="Emergency Desk" subtext="Live Life-Support" isOpen={isOpen} />
              <SidebarItem to="/doctor-vco-assignment" icon={Award} label="VCO Assignment" subtext="Obsidian Clients" isOpen={isOpen} />

              <SectionHeader label="Practice" isOpen={isOpen} />
              <SidebarItem to="/doctor-appointments" icon={Calendar} label="Appointments" subtext="Client Schedule" isOpen={isOpen} />
              <SidebarItem to="/doctor-schedule" icon={Clock} label="My Schedule" subtext="Consultation Hours" isOpen={isOpen} />
              <SidebarItem to="/doctor-scanner" icon={Scan} label="Health Scanner" subtext="Scan Pet QR" isOpen={isOpen} />
              <SidebarItem to="/patient-records" icon={ClipboardList} label="Patient Records" subtext="Medical History" isOpen={isOpen} />

              <SectionHeader label="Growth" isOpen={isOpen} />
              <SidebarItem to="/doctor-blogs" icon={BookOpen} label="My Blogs" subtext="Published Articles" isOpen={isOpen} />
              <SidebarItem to="/doctor-discounts" icon={Tag} label="Discounts" subtext="Offer Management" isOpen={isOpen} />
              <SidebarItem to="/doctor-crowdfunding" icon={Heart} label="Crowdfunding" subtext="Support Stray Rescues" isOpen={isOpen} />

              <SectionHeader label="Communication" isOpen={isOpen} />
              <SidebarItem to="/doctor-messages" icon={MessageSquare} label="Notifications" subtext="Admin Broadcasts" isOpen={isOpen} badge={unreadDoctorMessagesCount} />
              <SidebarItem to="/admin-chat" icon={User} label="Admin Chat" subtext="Direct Line" isOpen={isOpen} />
              <SidebarItem to="/doctor-live-stream" icon={Radio} label="Go Live" subtext="Broadcasting" isOpen={isOpen} />
              <SidebarItem to="/doctor-watch-admin-stream" icon={Tv} label="Admin Stream" subtext="Watch Updates" isOpen={isOpen} />
            </div>
          )}
        </div>

        {/* Firebase Storage Health & Credits Widget */}
        {atoken && (
          <div className="px-4 py-2 border-t border-emerald-50 dark:border-[#111827] bg-emerald-50/10 dark:bg-[#060b14]">
            {isOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-white/60 dark:bg-[#0a1020] backdrop-blur-md rounded-2xl border border-emerald-100/50 dark:border-[#111827] shadow-sm dark:shadow-black/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Firebase Storage</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${firebaseStats?.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400">
                      {firebaseStats?.status === 'online' ? 'Healthy' : 'Offline'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 mb-0.5">
                      <span>USED: {firebaseStats?.details?.usedStorage || '0.00 MB'}</span>
                      <span>FREE: {firebaseStats?.details?.remainingStorage || '5.00 GB'}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-[#111827] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: firebaseStats?.details?.percentUsed || '0%' }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-[8px] text-slate-500 dark:text-slate-400 font-bold">
                    <span>Quota: {firebaseStats?.details?.totalQuota || '5.00 GB'}</span>
                    <span>Files: {firebaseStats?.details?.fileCount || 0}</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="group relative flex justify-center py-2">
                <div className="relative">
                  <Cloud className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white dark:border-[#060b14] ${firebaseStats?.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                </div>

                {/* Tooltip */}
                <div className="absolute left-16 bottom-0 px-3 py-2 bg-slate-800 dark:bg-[#0a1020] text-white rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-1 group-hover:translate-x-0 z-[60] shadow-xl dark:shadow-black/40 text-left min-w-[150px] border dark:border-[#111827]">
                  <p className="text-[10px] font-bold border-b border-white/10 pb-1 mb-1">Firebase Storage</p>
                  <p className="text-[9px] text-slate-300">Status: <span className={firebaseStats?.status === 'online' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{firebaseStats?.status === 'online' ? 'Healthy' : 'Offline'}</span></p>
                  <p className="text-[9px] text-slate-300">Used: {firebaseStats?.details?.usedStorage || '0.00 MB'}</p>
                  <p className="text-[9px] text-slate-300">Remaining: {firebaseStats?.details?.remainingStorage || '5.00 GB'}</p>
                  <p className="text-[9px] text-slate-300">Files: {firebaseStats?.details?.fileCount || 0}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Footer Info (Optional) */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 border-t border-emerald-50 dark:border-[#111827] bg-emerald-50/20 dark:bg-[#060b14]"
          >
            <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-[#0a1020] rounded-2xl border border-white dark:border-[#111827]">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-[#0c1a12] flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs shadow-inner">
                PV
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase leading-none">PawVaidya v2.4</p>
                <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/50 font-bold mt-1">Hacker Edition</p>
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
