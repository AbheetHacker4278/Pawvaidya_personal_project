import React, { useContext, useState, useEffect } from 'react'
import Login from './pages/Login'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AdminContext } from './context/AdminContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Admin/Dashboard'
import AllAppointments from './pages/Admin/AllAppointments';
import AddDoctor from './pages/Admin/AddDoctor';
import DoctorsList from './pages/Admin/DoctorsList';
import { DoctorContext } from './context/DoctorContext';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import DoctorSchedule from './pages/Doctor/DoctorSchedule';
import DoctorBlogs from './pages/Doctor/DoctorBlogs';
import TotalUsers from './pages/Admin/TotalUsers';
import AdminMessages from './pages/Admin/AdminMessages';
import DoctorMessages from './components/DoctorMessages';
import AllReports from './pages/Admin/AllReports';
import UnbanRequests from './pages/Admin/UnbanRequests';
import AccountDeletionRequests from './pages/Admin/AccountDeletionRequests';
import TrashReports from './pages/Admin/TrashReports';
// import AdminProfile from './pages/Admin/AdminProfile';
import AdminProfile from './pages/Admin/AdminProfile';
import GlobalReminderNotifications from './components/GlobalReminderNotifications';
import DoctorChat from './pages/Admin/DoctorChat';
import AdminChat from './pages/Doctor/AdminChat';
import ManageAdmins from './pages/Admin/ManageAdmins';
import AdminLogs from './pages/Admin/AdminLogs';
import AdminLiveStreams from './pages/Admin/AdminLiveStreams';
import AdminWatchStream from './pages/Admin/AdminWatchStream';
import BroadcastEmail from './pages/Admin/BroadcastEmail';
import DoctorRankings from './pages/Admin/DoctorRankings';
import DoctorLiveStream from './pages/Doctor/DoctorLiveStream';
import DoctorWatchAdminStream from './pages/Doctor/DoctorWatchAdminStream';
import DoctorDiscounts from './pages/Doctor/DoctorDiscounts';
import PatientRecords from './pages/Doctor/PatientRecords';
import DoctorAttendance from './pages/Admin/DoctorAttendance';
import CommandPalette from './components/CommandPalette';
import MediaRegistry from './pages/Admin/MediaRegistry';
import AppIssueReports from './pages/Admin/AppIssueReports';
import BlacklistManagement from './pages/Admin/BlacklistManagement';
import ManageCoupons from './pages/Admin/ManageCoupons';
import Polls from './pages/Admin/Polls';
import GlobalBroadcastListener from './components/GlobalBroadcastListener';
import { io } from 'socket.io-client';
import MaintenanceMode from './components/MaintenanceMode';
import SecurityMonitoring from './pages/Admin/SecurityMonitoring';
import LocationHandler from './components/LocationHandler';
import AdminDeployments from './pages/Admin/AdminDeployments';
import AdminChatbot from './components/AdminChatbot';
import PaymentDetails from './pages/Admin/PaymentDetails';

const App = () => {
  const { atoken, adminProfile } = useContext(AdminContext)
  const { dtoken } = useContext(DoctorContext)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [systemConfig, setSystemConfig] = useState({ maintenanceMode: false, killSwitch: false, maintenanceMessage: "" })

  const backendurl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

  const getSystemConfig = async () => {
    try {
      const { data } = await axios.get(backendurl + '/api/admin/system-settings')
      if (data.success) {
        setSystemConfig(data.config)
      }
    } catch (error) {
      console.error("Failed to fetch system config:", error)
    }
  }

  useEffect(() => {
    getSystemConfig()

    const socket = io(backendurl, {
      withCredentials: true,
      transports: ['polling', 'websocket']
    })
    socket.on('system-config-update', () => {
      console.log("Admin Portal: System configuration updated. Refreshing...")
      getSystemConfig()
    })

    // Poll every 30s as a fallback
    const interval = setInterval(getSystemConfig, 30000)
    return () => {
      clearInterval(interval)
      socket.disconnect()
    }
  }, [backendurl])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return atoken || dtoken ? (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/30'>
      {(systemConfig.maintenanceMode || systemConfig.killSwitch) && (
        <MaintenanceMode
          isKillSwitch={systemConfig.killSwitch}
          message={systemConfig.maintenanceMessage}
        />
      )}
      <LocationHandler />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Navbar toggleSidebar={toggleSidebar} />

      {/* Main Content Area with padding for fixed navbar */}
      <div className='pt-16'>
        <Sidebar isOpen={sidebarOpen} />

        {/* Main Content */}
        <main className={`min-h-screen overflow-auto transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'
          }`}>
          <div className='animate-fadeIn'>
            <Routes>
              <Route path='/' element={<></>} />
              <Route path='/admin-dashboard' element={<Dashboard />} />
              <Route path='/manage-admins' element={<ManageAdmins />} />
              <Route path='/all-appointments' element={<AllAppointments />} />
              <Route path='/add-doctor' element={<AddDoctor />} />
              <Route path='/doctor-list' element={<DoctorsList />} />
              <Route path='/total-users' element={<TotalUsers />} />
              <Route path='/payment-details' element={<PaymentDetails />} />
              <Route path='/admin-messages' element={<AdminMessages />} />
              <Route path='/all-reports' element={<AllReports />} />
              <Route path='/unban-requests' element={<UnbanRequests />} />
              <Route path='/deletion-requests' element={<AccountDeletionRequests />} />
              <Route path='/trash' element={<TrashReports />} />
              <Route path='/admin-logs' element={<AdminLogs />} />
              <Route path='/admin-profile' element={<AdminProfile />} />
              <Route path='/admin-live-streams' element={<AdminLiveStreams />} />
              <Route path='/admin-watch-stream/:docId' element={<AdminWatchStream />} />
              <Route path='/broadcast-email' element={<BroadcastEmail />} />
              <Route path='/doctor-rankings' element={<DoctorRankings />} />
              <Route path='/doctor-attendance' element={<DoctorAttendance />} />
              <Route path='/media-registry' element={<MediaRegistry />} />
              <Route path='/app-issue-reports' element={<AppIssueReports />} />
              <Route path='/blacklist-management' element={<BlacklistManagement />} />
              <Route path='/manage-coupons' element={<ManageCoupons />} />
              <Route path='/polls' element={<Polls />} />
              <Route path='/security-monitoring' element={<SecurityMonitoring />} />
              <Route path='/admin-deployments' element={<AdminDeployments />} />

              <Route path='/doctor-dashboard' element={<DoctorDashboard />} />
              <Route path='/doctor-appointments' element={<DoctorAppointments />} />
              <Route path='/doctor-profile' element={<DoctorProfile />} />
              <Route path='/doctor-schedule' element={<DoctorSchedule />} />
              <Route path='/doctor-blogs' element={<DoctorBlogs />} />
              <Route path='/doctor-discounts' element={<DoctorDiscounts />} />
              <Route path='/doctor-messages' element={<DoctorMessages />} />
              <Route path='/doctor-chat' element={<DoctorChat />} />
              <Route path='/admin-chat' element={<AdminChat />} />
              <Route path='/doctor-live-stream' element={<DoctorLiveStream />} />
              <Route path='/doctor-watch-admin-stream' element={<DoctorWatchAdminStream />} />
              <Route path='/patient-records' element={<PatientRecords />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Global Reminder Notifications - Only for doctors */}
      {dtoken && <GlobalReminderNotifications />}

      {/* Omni-Search Command Palette */}
      {atoken && <CommandPalette />}

      {/* Admin Side AI Chatbot */}
      {atoken && adminProfile?.role === 'master' && <AdminChatbot />}

      {/* Global Broadcast Listener */}
      <GlobalBroadcastListener />

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  ) : (
    <>
      <Login />
      <ToastContainer />
    </>
  )
}

export default App