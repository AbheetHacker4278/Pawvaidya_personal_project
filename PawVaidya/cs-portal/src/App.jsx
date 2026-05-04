import React, { useContext } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Register from './pages/Register';
import FaceVerify from './pages/FaceVerify';
import CSDashboard from './pages/CSDashboard';
import ComplaintQueue from './pages/ComplaintQueue';
import TicketDetail from './pages/TicketDetail';
import EmployeeProfile from './pages/EmployeeProfile';
import AdminChat from './pages/AdminChat';
import IncomingRequestModal from './components/IncomingRequestModal';

import { CSContext } from './context/CSContext';
import { FaCommentAlt } from 'react-icons/fa';

const PrivateRoute = ({ children }) => {
  const { cstoken, loading } = useContext(CSContext);
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  return cstoken ? children : <Navigate to="/login" />;
};

const Navbar = () => {
  const { employee, logout } = useContext(CSContext);
  const location = useLocation();

  if (!employee) return null;

  const isActive = (path) => location.pathname === path;
  const defaultProfilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random`;

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold tracking-tighter text-primary">PawVaidya Support</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${location.pathname === '/' ? 'border-primary text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Dashboard</Link>
              <Link to="/queue" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${location.pathname.startsWith('/queue') || location.pathname.startsWith('/ticket') ? 'border-primary text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Ticket Queue</Link>
              <Link to="/profile" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${location.pathname.startsWith('/profile') ? 'border-primary text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>My Profile</Link>
              <Link to="/chat" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${location.pathname.startsWith('/chat') ? 'border-primary text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <FaCommentAlt className="mr-2 text-xs opacity-70" /> Admin Chat
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <img src={employee.profilePic || defaultProfilePic} alt="" className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
              <span className="text-sm font-medium text-slate-700">{employee.name}</span>
              <button onClick={logout} className="ml-4 text-sm text-red-600 hover:text-red-800 font-medium">Logout</button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const App = () => {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <IncomingRequestModal />
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/face-verify" element={<FaceVerify />} />

          <Route path="/" element={<PrivateRoute><CSDashboard /></PrivateRoute>} />
          <Route path="/queue" element={<PrivateRoute><ComplaintQueue /></PrivateRoute>} />
          <Route path="/ticket/:id" element={<PrivateRoute><TicketDetail /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><EmployeeProfile /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><AdminChat /></PrivateRoute>} />
        </Routes>
      </main>
    </>
  );
};

export default App;
