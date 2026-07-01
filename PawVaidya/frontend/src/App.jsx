import React from 'react'
import { Route, Routes, useLocation, Navigate } from "react-router-dom"
import Home from "./pages/Home"
import Doctors from './pages/Doctors'
import Signup from './pages/Signup'
import About from './pages/About'
import MyProfile from './pages/MyProfile'
import MyAppointments from './pages/MyAppointments'
import Appointments from './pages/Appointments'
import Navbar from './components/Navbar'
import MobileBottomNavbar from './components/MobileBottomNavbar'
import Footer from './components/Footer'
import QuickChat from './pages/QuickChat'
import FAQ from './pages/FAQ'
import LoginForm from './pages/LoginForm'
import PrivacyPolicy from './pages/PrivacyPolicy'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Emailverify from './pages/Emailverify'
import ResetPassword from './pages/ResetPassword'
import CommunityBlogs from './pages/CommunityBlogs'
import CreateBlog from './pages/CreateBlog'
import BlogDetail from './pages/BlogDetail'
import EditBlog from './pages/EditBlog'
import RoomDetail from './pages/RoomDetail'
import UserMessages from './components/UserMessages'
import AnimalHealthChatbot from './components/AnimalHealthChatbot'
import MyPets from './pages/MyPets'
import Polls from './pages/Polls'
import GlobalBroadcastListener from './components/GlobalBroadcastListener'
import MaintenanceMode from './components/MaintenanceMode'
import LocationHandler from './components/LocationHandler'
import { AppContext } from './context/AppContext'
import { useContext } from 'react'
import PawWallet from './pages/PawWallet'
import Subscription from './pages/Subscription'
import VideoConsultation from './pages/VideoConsultation'
import VideoCall from './pages/VideoCall'
import CommunityHub from './pages/CommunityHub'
import SupportHub from './pages/SupportHub'
import TicketTracking from './pages/TicketTracking'
import RateEmployee from './pages/RateEmployee'
import ReportCruelty from './pages/ReportCruelty'
import MLPrediction from './pages/MLPrediction'
import AnimalDiseasePredictor from './pages/AnimalDiseasePredictor'
import DietNutritionPlanner from './pages/DietNutritionPlanner'
import StrayCrowdfunding from './pages/StrayCrowdfunding'
import BetaAccess from './pages/BetaAccess'
import AiFeatures from './pages/AiFeatures'

import PageLoader from './components/PageLoader'

const App = () => {
  const location = useLocation();
  const { systemConfig, token, userdata, authLoading } = useContext(AppContext);

  const activePlan = userdata?.subscription?.status === 'Active' ? userdata?.subscription?.plan : 'None';
  const isObsidian = activePlan === 'Obsidian';

  React.useEffect(() => {
    if (isObsidian) {
      document.body.classList.add('obsidian-theme');
    } else {
      document.body.classList.remove('obsidian-theme');
    }
  }, [isObsidian]);

  const isAuthPage = location.pathname === "/login-form" || location.pathname === "/login";

  if (authLoading) {
    return <PageLoader />;
  }

  return (
    <div className={isAuthPage ? "w-full" : "mx-4 sm:mx-[10%]"}>
      {(systemConfig.maintenanceMode || systemConfig.killSwitch) && (
        <MaintenanceMode
          isKillSwitch={systemConfig.killSwitch}
          message={systemConfig.maintenanceMessage}
        />
      )}
      <LocationHandler />
      {location.pathname != "/login-form" && location.pathname != "/login" && <Navbar />}
      {location.pathname != "/login-form" && location.pathname != "/login" && <MobileBottomNavbar />}
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover={false}
        pauseOnFocusLoss={false}
        draggable
        theme="light"
        limit={3}
        toastClassName="paw-toast"
        progressClassName="paw-toast-progress"
      />
      {/* <Navbar /> */}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/doctors' element={<Doctors />} />
        <Route path='/doctors/:speciality' element={<Doctors />} />
        <Route path='/login' element={token ? <Navigate to='/' /> : <Signup />} />
        <Route path='/email-verify' element={<Emailverify />} />
        <Route path='/login-form' element={token ? <Navigate to='/' /> : <LoginForm />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Navigate to='/about?tab=contact' replace />} />
        <Route path='/my-profile' element={<MyProfile />} />
        <Route path='/my-appointments' element={<MyAppointments />} />
        <Route path='/appointment/:docId' element={<Appointments />} />
        <Route path='/quick-chats' element={<QuickChat />} />
        <Route path='/faq' element={<FAQ />} />
        <Route path='/faqs' element={<FAQ />} />
        <Route path='/privacy-policy' element={<PrivacyPolicy />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/community' element={<CommunityHub />} />
        <Route path='/community/:streamID' element={<CommunityHub />} />
        <Route path='/community-blogs' element={<Navigate to='/community?tab=blogs' replace />} />
        <Route path='/create-blog' element={<CreateBlog />} />
        <Route path='/edit-blog/:blogId' element={<EditBlog />} />
        <Route path='/blog/:blogId' element={<BlogDetail />} />
        <Route path='/room/:roomId' element={<RoomDetail />} />
        <Route path='/messages' element={<UserMessages />} />
        <Route path='/live-streams' element={<Navigate to='/community?tab=live' replace />} />
        <Route path='/live-stream/:streamID' element={<Navigate to='/community/:streamID' replace />} />
        <Route path='/my-pets' element={<MyPets />} />
        <Route path='/report-issue' element={<Navigate to='/support?tab=issue' replace />} />
        <Route path='/polls' element={<Navigate to='/community?tab=polls' replace />} />
        <Route path='/paw-wallet' element={<PawWallet />} />
        <Route path='/subscription' element={<Subscription />} />
        <Route path='/video-consultation' element={<VideoConsultation />} />
        <Route path='/video-call/:appointmentId' element={<VideoCall />} />
        <Route path='/support' element={token ? <SupportHub /> : <Navigate to="/login" />} />
        <Route path='/my-tickets' element={<Navigate to='/support?tab=history' replace />} />
        <Route path='/ticket-tracking/:id' element={token ? <TicketTracking /> : <Navigate to="/login" />} />
        <Route path='/rate-cs/:ticketId' element={token ? <RateEmployee /> : <Navigate to="/login" />} />
        <Route path='/report-cruelty' element={<ReportCruelty />} />
        <Route path='/ml-prediction' element={<Navigate to='/ai-features?tab=ml-prediction' replace />} />
        <Route path='/disease-predictor' element={<Navigate to='/ai-features?tab=disease-predictor' replace />} />
        <Route path='/diet-planner' element={<Navigate to='/ai-features?tab=diet-planner' replace />} />
        <Route path='/ai-features' element={<AiFeatures />} />
        <Route path='/stray-crowdfunding' element={<StrayCrowdfunding />} />
        <Route path='/beta-access' element={<BetaAccess />} />
      </Routes>

      {location.pathname != "/login-form" && location.pathname != "/login" && <Footer />}
      {location.pathname != "/login-form" && location.pathname != "/login" && <AnimalHealthChatbot />}

      {/* Global Broadcast Listener */}
      <GlobalBroadcastListener />
    </div>
  )
}

export default App