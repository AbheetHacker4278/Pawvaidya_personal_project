import React from 'react'
import { Route, Routes, useLocation } from "react-router-dom"
import Home from "./pages/Home"
import Doctors from './pages/Doctors'
import Signup from './pages/Signup'
import About from './pages/About'
import Contact from './pages/Contact'
import MyProfile from './pages/MyProfile'
import MyAppointments from './pages/MyAppointments'
import Appointments from './pages/Appointments'
import Navbar from './components/Navbar'
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
import UserMessages from './components/UserMessages'
import LiveStreams from './pages/LiveStreams'
import ReportIssue from './pages/ReportIssue'
import AnimalHealthChatbot from './components/AnimalHealthChatbot'
import MyPets from './pages/MyPets'
import GlobalBroadcastListener from './components/GlobalBroadcastListener'
import MaintenanceMode from './components/MaintenanceMode'
import { AppContext } from './context/AppContext'
import { useContext } from 'react'

const App = () => {
  const location = useLocation();
  const { systemConfig } = useContext(AppContext);

  return (
    <div className='mx-4 sm:mx-[10%] '>
      {(systemConfig.maintenanceMode || systemConfig.killSwitch) && (
        <MaintenanceMode
          isKillSwitch={systemConfig.killSwitch}
          message={systemConfig.maintenanceMessage}
        />
      )}
      {location.pathname != "/login-form" && location.pathname != "/login" && <Navbar />}
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        toastClassName="paw-toast"
        progressClassName="paw-toast-progress"
      />
      {/* <Navbar /> */}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/doctors' element={<Doctors />} />
        <Route path='/doctors/:speciality' element={<Doctors />} />
        <Route path='/login' element={<Signup />} />
        <Route path='/email-verify' element={<Emailverify />} />
        <Route path='/login-form' element={<LoginForm />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/my-profile' element={<MyProfile />} />
        <Route path='/my-appointments' element={<MyAppointments />} />
        <Route path='/appointment/:docId' element={<Appointments />} />
        <Route path='/quick-chats' element={<QuickChat />} />
        <Route path='/faq' element={<FAQ />} />
        <Route path='/faqs' element={<FAQ />} />
        <Route path='/privacy-policy' element={<PrivacyPolicy />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/community-blogs' element={<CommunityBlogs />} />
        <Route path='/create-blog' element={<CreateBlog />} />
        <Route path='/edit-blog/:blogId' element={<EditBlog />} />
        <Route path='/blog/:blogId' element={<BlogDetail />} />
        <Route path='/messages' element={<UserMessages />} />
        <Route path='/live-streams' element={<LiveStreams />} />
        <Route path='/live-stream/:streamID' element={<LiveStreams />} />
        <Route path='/my-pets' element={<MyPets />} />
        <Route path='/report-issue' element={<ReportIssue />} />
      </Routes>

      {location.pathname != "/login-form" && location.pathname != "/login" && <Footer />}
      {location.pathname != "/login-form" && location.pathname != "/login" && <AnimalHealthChatbot />}

      {/* Global Broadcast Listener */}
      <GlobalBroadcastListener />
    </div>
  )
}

export default App