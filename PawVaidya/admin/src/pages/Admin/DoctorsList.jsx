import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import BanUserDialog from '../../components/BanUserDialog'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Paper,
  Typography,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Badge,
  Chip,
  Avatar,
  Divider,
  Card,
  CardContent
} from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import LoginIcon from '@mui/icons-material/Login'
import LogoutIcon from '@mui/icons-material/Logout'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction'
import HistoryIcon from '@mui/icons-material/History'
import VisibilityIcon from '@mui/icons-material/Visibility'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import WorkIcon from '@mui/icons-material/Work'
import SchoolIcon from '@mui/icons-material/School'
import InfoIcon from '@mui/icons-material/Info'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const DoctorsList = () => {
  const { doctors, atoken, getalldoctors, changeavailablity, deleteDoctor, makeAllDoctorsAvailable, makeAllDoctorsUnavailable, getDoctorsWithPasswords, getActivityLogs, banUser, unbanUser, blacklistEmails } = useContext(AdminContext)
  const [deletingDoctorId, setDeletingDoctorId] = useState(null)
  const [isMakingAllAvailable, setIsMakingAllAvailable] = useState(false)
  const [isMakingAllUnavailable, setIsMakingAllUnavailable] = useState(false)
  const [selectedDoctors, setSelectedDoctors] = useState([])

  // State for view details dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedDoctorDetails, setSelectedDoctorDetails] = useState(null)
  const [doctorDetailsLoading, setDoctorDetailsLoading] = useState(false)
  const [activityLogs, setActivityLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [detailsTab, setDetailsTab] = useState(0)

  // State for ban dialog
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [doctorToBan, setDoctorToBan] = useState(null)
  const [defaultBanIp, setDefaultBanIp] = useState(false)

  // Separate available and not available doctors
  const getDoctorsByAvailability = (isAvailable) => {
    return doctors.filter((doctor) => doctor.available === isAvailable)
  }

  useEffect(() => {
    if (atoken) {
      getalldoctors()
    }
  }, [atoken])

  // Calculate counts
  const availableDoctors = getDoctorsByAvailability(true)
  const notAvailableDoctors = getDoctorsByAvailability(false)

  // Handle doctor deletion with loading state
  const handleDeleteDoctor = async (doctorId) => {
    setDeletingDoctorId(doctorId)
    await deleteDoctor(doctorId)
    setDeletingDoctorId(null)
  }

  // Loading animation component
  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-md z-10 rounded-2xl">
      <div className="flex flex-col items-center p-6 bg-white/95 rounded-2xl shadow-xl border">
        <div className="w-16 h-16 rounded-full border-4 border-t-green-500 border-r-emerald-400 border-b-green-300 border-l-emerald-200 animate-spin mb-3"></div>
        <p className="text-sm font-semibold text-gray-700">Processing...</p>
        <p className="text-xs text-gray-500 mt-1">Please wait</p>
      </div>
    </div>
  )

  // Doctor card component to avoid repetition
  const DoctorCard = ({ doctor, isAvailable }) => {
    const isDeleting = deletingDoctorId === doctor._id

    return (
      <div className={`relative border-2 ${isAvailable
        ? 'border-green-200 hover:border-green-400 bg-gradient-to-b from-green-50 to-white'
        : 'border-red-200 hover:border-red-400 bg-gradient-to-b from-red-50 to-white'
        } rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-xl hover:scale-105`}>
        {isDeleting && <LoadingSpinner />}

        <div className="absolute top-3 left-3 z-20">
          <input
            type="checkbox"
            checked={selectedDoctors.includes(doctor.email)}
            onChange={(e) => {
              e.stopPropagation();
              handleSelectDoctor(doctor.email);
            }}
            className="w-5 h-5 cursor-pointer accent-green-600"
          />
        </div>

        {/* Doctor Image */}
        <div className={`relative h-48 overflow-hidden ${isAvailable ? 'bg-green-100' : 'bg-red-100'
          }`}>
          <img
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            src={doctor.image}
            alt={doctor.name}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA4Ny41Qzc1IDc4LjgxODIgODEuODE4MiA3MiA5MC41IDcyQzk5LjE4MTggNzIgMTA2IDc4LjgxODIgMTA2IDg3LjVDMTA2IDk2LjE4MTggOTkuMTgxOCAxMDMgOTAuNSAxMDNDODEuODE4MiAxMDMgNzUgOTYuMTgxOCA3NSA4Ny41WiIgZmlsbD0iIzlDQThBNiIvPgo8cGF0aCBkPSJNMTIwLjUgMTI4LjVDMTIwLjUgMTE5LjgxOCAxMjcuMzE4IDExMyAxMzYgMTEzQzE0NC42ODIgMTEzIDE1MS41IDExOS44MTggMTUxLjUgMTI4LjVDMTUxLjUgMTM3LjE4MiAxNDQuNjgyIDE0NCAxMzYgMTQ0QzEyNy4zMTggMTQ0IDEyMC41IDEzNy4xODIgMTIwLjUgMTI4LjVaIiBmaWxsPSIjOUNBOEE2Ii8+CjxwYXRoIGQ9Ik00OC41IDEyOC41QzQ4LjUgMTE5LjgxOCA1NS4zMTgyIDExMyA2NCAxMTNDNzIuNjgxOCAxMTMgNzkuNSAxMTkuODE4IDc5LjUgMTI4LjVDNzkuNSAxMzcuMTgyIDcyLjY4MTggMTQ0IDY0IDE0NEM1NS4zMTgyIDE0NCA0OC41IDEzNy4xODIgNDguNSAxMjguNVoiIGZpbGw9IiM5Q0E4QTYiLz4KPHBhdGggZD0iTTE0MCA3MEMxNDAgNjEuODE4MiAxNDYuODE4IDU1IDE1NSA1NUMxNjMuMTgyIDU1IDE3MCA2MS44MTgyIDE3MCA3MEMxNzAgNzguMTgxOCAxNjMuMTgyIDg1IDE1NSA4NUMxNDYuODE4IDg1IDE0MCA3OC4xODE4IDE0MCA3MFoiIGZpbGw9IiM5Q0E4QTYiLz4KPC9zdmc+';
            }}
          />
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${isAvailable
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
            }`}>
            {isAvailable ? 'Available' : 'Busy'}
          </div>
        </div>

        {/* Doctor Info */}
        <div className='p-5'>
          <h3 className='text-lg font-bold text-gray-800 mb-1 truncate'>{doctor.name}</h3>
          <p className='text-emerald-600 font-semibold text-sm mb-2'>{doctor.speciality}</p>

          <div className='space-y-1 mb-4'>
            <div className='flex items-center gap-2 text-gray-600 text-sm'>
              <EmailIcon sx={{ fontSize: 14 }} />
              <span className='truncate'>{doctor.email}</span>
            </div>
            <div className='flex items-center gap-2 text-gray-600 text-sm'>
              <PhoneIcon sx={{ fontSize: 14 }} />
              <span>+91 {doctor.docphone}</span>
            </div>
            {doctor.lastLoginIp && (
              <div className='flex items-center gap-2 text-gray-600 text-sm'>
                <LoginIcon sx={{ fontSize: 14 }} />
                <span>IP: <strong>{doctor.lastLoginIp}</strong></span>
              </div>
            )}
          </div>

          {/* Availability Toggle */}
          <div className='flex items-center gap-2 mb-4 p-2 bg-gray-100 rounded-lg'>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                onChange={() => changeavailablity(doctor._id)}
                type="checkbox"
                checked={doctor.available}
                disabled={isDeleting}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer ${doctor.available ? 'peer-checked:bg-green-500' : 'peer-checked:bg-red-500'
                } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${doctor.available ? 'peer-checked:border-green-500' : 'peer-checked:border-red-500'
                }`}></div>
            </label>
            <span className='text-sm font-medium text-gray-700'>
              {doctor.available ? 'Available' : 'Not Available'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-wrap gap-2'>
            <button
              onClick={() => handleViewDetails(doctor)}
              disabled={isDeleting}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-200 ${isDeleting
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
                }`}
            >
              <VisibilityIcon sx={{ fontSize: 16 }} />
              View
            </button>
            <button
              onClick={() => handleBanDoctor(doctor, false)}
              disabled={isDeleting}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-200 ${isDeleting
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : doctor.isBanned
                  ? 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md'
                  : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-md'
                }`}
            >
              {doctor.isBanned ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <BlockIcon sx={{ fontSize: 16 }} />}
              {doctor.isBanned ? 'Unban' : 'Ban'}
            </button>
            {doctor.lastLoginIp && !doctor.isBanned && (
              <button
                onClick={() => handleBanDoctor(doctor, true)}
                disabled={isDeleting}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-200 ${isDeleting
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md'
                  }`}
              >
                <WarningIcon sx={{ fontSize: 16 }} />
                Ban IP
              </button>
            )}
            <button
              onClick={() => handleDeleteDoctor(doctor._id)}
              disabled={isDeleting}
              className={`flex-1 min-w-[30%] py-2 px-3 rounded-lg font-medium text-sm transition-all duration-200 ${isDeleting
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md'
                }`}
            >
              {isDeleting ? '...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleMakeAllAvailable = async () => {
    if (window.confirm('Are you sure you want to make all doctors available? This will set all doctors to available status.')) {
      setIsMakingAllAvailable(true);
      try {
        await makeAllDoctorsAvailable();
      } finally {
        setIsMakingAllAvailable(false);
      }
    }
  };

  const handleMakeAllUnavailable = async () => {
    if (window.confirm('Are you sure you want to make all doctors unavailable? This will set all doctors to unavailable status.')) {
      setIsMakingAllUnavailable(true);
      try {
        await makeAllDoctorsUnavailable();
      } finally {
        setIsMakingAllUnavailable(false);
      }
    }
  };

  // Handle view details
  const handleViewDetails = async (doctor) => {
    setSelectedDoctorDetails(null);
    setActivityLogs([]);
    setDetailsDialogOpen(true);
    setDetailsTab(0); // Start with Profile Details tab
    setDoctorDetailsLoading(true);

    try {
      // Fetch doctor details with password
      const doctorsWithPasswords = await getDoctorsWithPasswords();
      const doctorDetails = doctorsWithPasswords.find(d => d._id === doctor._id);
      setSelectedDoctorDetails(doctorDetails || doctor);

      // Fetch activity logs
      setLogsLoading(true);
      const logsData = await getActivityLogs(doctor._id, 'doctor', 50, 0);
      setActivityLogs(logsData.logs || []);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    } finally {
      setDoctorDetailsLoading(false);
      setLogsLoading(false);
    }
  };

  const handleDetailsDialogClose = () => {
    setDetailsDialogOpen(false);
    setSelectedDoctorDetails(null);
    setActivityLogs([]);
    setDetailsTab(0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Handle ban doctor
  const handleBanDoctor = (doctor, banIp = false) => {
    setDoctorToBan(doctor);
    setDefaultBanIp(banIp);
    setBanDialogOpen(true);
  };

  // Handle ban dialog close
  const handleBanDialogClose = () => {
    setBanDialogOpen(false);
    setDoctorToBan(null);
    setDefaultBanIp(false);
  };

  // Handle ban/unban completion
  const handleBanComplete = async (result) => {
    if (result.success) {
      // Refresh doctors list to get updated ban status
      await getalldoctors();
    }
    handleBanDialogClose();
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedDoctors(doctors.map(doc => doc.email));
    } else {
      setSelectedDoctors([]);
    }
  };

  const handleSelectDoctor = (email) => {
    setSelectedDoctors(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleBulkBlacklist = async () => {
    if (selectedDoctors.length === 0) return;

    if (window.confirm(`Are you sure you want to blacklist ${selectedDoctors.length} doctor email(s)? This will prevent them from registering again.`)) {
      const success = await blacklistEmails(selectedDoctors, 'doctor', 'Bulk blacklisted by admin');
      if (success) {
        setSelectedDoctors([]);
        getalldoctors();
      }
    }
  };

  return (
    <div className='p-4 md:p-6 lg:p-8 max-h-[90vh] overflow-y-auto'>
      {/* Header Section */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4'>
        <div>
          <h1 className='text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2'>
            Doctors Management
          </h1>
          <p className='text-gray-600 text-sm md:text-base'>
            Manage all veterinary doctors in your system
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleMakeAllUnavailable}
            disabled={isMakingAllUnavailable}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${isMakingAllUnavailable
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700'
              } min-w-[280px] md:min-w-auto`}
          >
            {isMakingAllUnavailable ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className='text-sm md:text-base'>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span className='text-sm md:text-base'>Make All Unavailable</span>
              </>
            )}
          </button>

          <button
            onClick={handleMakeAllAvailable}
            disabled={isMakingAllAvailable}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${isMakingAllAvailable
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
              } min-w-[280px] md:min-w-auto`}
          >
            {isMakingAllAvailable ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className='text-sm md:text-base'>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className='text-sm md:text-base'>Make All Available</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white px-4 py-2 rounded-xl border-2 border-green-200">
              <input
                type="checkbox"
                checked={selectedDoctors.length === doctors.length && doctors.length > 0}
                onChange={handleSelectAll}
                className="w-5 h-5 cursor-pointer accent-green-600 mr-2"
              />
              <span className="text-sm font-bold text-green-800">Select All ({selectedDoctors.length})</span>
            </div>

            {selectedDoctors.length > 0 && (
              <button
                onClick={handleBulkBlacklist}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-all shadow-md transform hover:scale-105"
              >
                <BlockIcon sx={{ fontSize: 20 }} />
                Blacklist Selected
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8'>
        <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-green-800'>Available Doctors</h3>
              <p className='text-3xl font-bold text-green-900'>{availableDoctors.length}</p>
            </div>
            <div className='w-12 h-12 bg-green-200 rounded-full flex items-center justify-center'>
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className='bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-red-800'>Not Available</h3>
              <p className='text-3xl font-bold text-red-900'>{notAvailableDoctors.length}</p>
            </div>
            <div className='w-12 h-12 bg-red-200 rounded-full flex items-center justify-center'>
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Available Doctors Section */}
      <div className='mb-8'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-3 h-8 bg-green-500 rounded-full'></div>
          <h2 className='text-xl md:text-2xl font-bold text-gray-800'>
            Available Doctors ({availableDoctors.length})
          </h2>
        </div>

        {availableDoctors.length === 0 ? (
          <div className='bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center'>
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47.86-6.09 2.28" />
            </svg>
            <p className='text-gray-600 text-lg'>No doctors are currently available</p>
            <p className='text-gray-500 text-sm'>All doctors are either busy or offline</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {availableDoctors.map((doctor, index) => (
              <DoctorCard
                key={doctor._id || index}
                doctor={doctor}
                isAvailable={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Not Available Doctors Section */}
      <div>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-3 h-8 bg-red-500 rounded-full'></div>
          <h2 className='text-xl md:text-2xl font-bold text-gray-800'>
            Not Available Doctors ({notAvailableDoctors.length})
          </h2>
        </div>

        {notAvailableDoctors.length === 0 ? (
          <div className='bg-green-50 border border-green-200 rounded-2xl p-8 text-center'>
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className='text-green-800 text-lg font-semibold'>Excellent! All doctors are available</p>
            <p className='text-green-600 text-sm'>Your veterinary team is ready to serve patients</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {notAvailableDoctors.map((doctor, index) => (
              <DoctorCard
                key={doctor._id || index}
                doctor={doctor}
                isAvailable={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* View Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleDetailsDialogClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
          Doctor Profile & Details
        </DialogTitle>
        <DialogContent dividers>
          {doctorDetailsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : selectedDoctorDetails ? (
            <>
              <Tabs value={detailsTab} onChange={(e, v) => setDetailsTab(v)} sx={{ mb: 3 }}>
                <Tab label="Profile Details" />
                <Tab label="Login Statistics" />
                <Tab label="Activity Logs" />
              </Tabs>

              {/* Profile Details Tab */}
              {detailsTab === 0 && (
                <Box>
                  <Card elevation={3} sx={{ mb: 3 }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={3}>
                        <Avatar
                          src={selectedDoctorDetails.image}
                          alt={selectedDoctorDetails.name}
                          sx={{ width: 100, height: 100, mr: 3 }}
                        />
                        <Box>
                          <Typography variant="h5" fontWeight="bold" gutterBottom>
                            {selectedDoctorDetails.name}
                          </Typography>
                          <Chip
                            label={selectedDoctorDetails.speciality}
                            color="primary"
                            sx={{ mb: 1 }}
                          />
                          <Box display="flex" alignItems="center" mt={1}>
                            <Badge
                              color={selectedDoctorDetails.available ? 'success' : 'error'}
                              variant="dot"
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {selectedDoctorDetails.available ? 'Available' : 'Not Available'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  <Grid container spacing={3}>
                    {/* Personal Information */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                        Personal Information
                      </Typography>

                      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Email
                          </Typography>
                        </Box>
                        <Typography variant="body1">{selectedDoctorDetails.email || 'N/A'}</Typography>
                      </Paper>

                      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Phone Number
                          </Typography>
                        </Box>
                        <Typography variant="body1">
                          {selectedDoctorDetails.docphone ? `+91 ${selectedDoctorDetails.docphone}` : 'Not Available'}
                        </Typography>
                      </Paper>

                      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Address
                          </Typography>
                        </Box>
                        <Typography variant="body1">
                          {selectedDoctorDetails.address?.Location ? selectedDoctorDetails.address.Location : 'N/A'}
                        </Typography>
                        {selectedDoctorDetails.address?.line && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {selectedDoctorDetails.address.line}
                          </Typography>
                        )}
                        {selectedDoctorDetails.full_address && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {selectedDoctorDetails.full_address}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>

                    {/* Professional Information */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                        Professional Information
                      </Typography>

                      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Speciality
                          </Typography>
                        </Box>
                        <Typography variant="body1">{selectedDoctorDetails.speciality || 'N/A'}</Typography>
                      </Paper>

                      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Degree
                          </Typography>
                        </Box>
                        <Typography variant="body1">{selectedDoctorDetails.degree || 'N/A'}</Typography>
                      </Paper>

                      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Experience
                          </Typography>
                        </Box>
                        <Typography variant="body1">{selectedDoctorDetails.experience || 'N/A'}</Typography>
                      </Paper>

                      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <AttachMoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Consultation Fees
                          </Typography>
                        </Box>
                        <Typography variant="body1">
                          ₹{selectedDoctorDetails.fees || '0'} per consultation
                        </Typography>
                      </Paper>

                      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Registration Date
                          </Typography>
                        </Box>
                        <Typography variant="body1">
                          {selectedDoctorDetails.date ? new Date(selectedDoctorDetails.date).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* About Section */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Paper elevation={2} sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" mb={2}>
                          <InfoIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="h6" fontWeight="bold">
                            About Doctor
                          </Typography>
                        </Box>
                        <Typography variant="body1" paragraph>
                          {selectedDoctorDetails.about || 'No information available.'}
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* Credentials */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Paper elevation={2} sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" mb={2}>
                          <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="h6" fontWeight="bold">
                            Security Credentials
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            Password
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              wordBreak: 'break-all',
                              fontFamily: 'monospace',
                              fontSize: '0.875rem',
                              bgcolor: 'grey.100',
                              p: 1.5,
                              borderRadius: 1,
                              color: 'text.primary',
                              fontWeight: 'medium'
                            }}
                          >
                            {selectedDoctorDetails.password || 'N/A'}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Login Statistics Tab */}
              {detailsTab === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Password
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          wordBreak: 'break-all',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          bgcolor: 'grey.100',
                          p: 1.5,
                          borderRadius: 1,
                          color: 'text.primary',
                          fontWeight: 'medium'
                        }}
                      >
                        {selectedDoctorDetails.password || 'N/A'}
                      </Typography>
                    </Paper>

                    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <LoginIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Last Login
                        </Typography>
                      </Box>
                      <Typography variant="body1">
                        {formatDate(selectedDoctorDetails.lastLogin)}
                      </Typography>
                    </Paper>

                    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <LogoutIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Last Logout
                        </Typography>
                      </Box>
                      <Typography variant="body1">
                        {formatDate(selectedDoctorDetails.lastLogout)}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Total Session Time
                        </Typography>
                      </Box>
                      <Typography variant="h6" color="primary">
                        {selectedDoctorDetails.totalSessionTimeFormatted ||
                          `${Math.floor((selectedDoctorDetails.totalSessionTime || 0) / 3600)}h ${Math.floor(((selectedDoctorDetails.totalSessionTime || 0) % 3600) / 60)}m ${(selectedDoctorDetails.totalSessionTime || 0) % 60}s`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(selectedDoctorDetails.totalSessionTime || 0)} seconds total
                      </Typography>
                    </Paper>

                    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Current Session Start
                        </Typography>
                      </Box>
                      <Typography variant="body1">
                        {formatDate(selectedDoctorDetails.currentSessionStart)}
                      </Typography>
                    </Paper>

                    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <OnlinePredictionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Online Status
                        </Typography>
                      </Box>
                      <Badge
                        color={selectedDoctorDetails.isOnline ? 'success' : 'error'}
                        variant="dot"
                        sx={{ mr: 2 }}
                      />
                      <Typography variant="body1" display="inline">
                        {selectedDoctorDetails.isOnline ? 'Online' : 'Offline'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Activity Logs Tab */}
              {detailsTab === 2 && (
                <Box>
                  {logsLoading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                      <CircularProgress />
                    </Box>
                  ) : activityLogs.length > 0 ? (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Timestamp</strong></TableCell>
                            <TableCell><strong>Activity Type</strong></TableCell>
                            <TableCell><strong>Description</strong></TableCell>
                            <TableCell><strong>IP Address</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {activityLogs.map((log, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {formatDate(log.timestamp)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={log.activityType}
                                  size="small"
                                  color={
                                    log.activityType === 'login' ? 'success' :
                                      log.activityType === 'logout' ? 'error' :
                                        'default'
                                  }
                                />
                              </TableCell>
                              <TableCell>{log.activityDescription}</TableCell>
                              <TableCell>{log.ipAddress || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box textAlign="center" p={3}>
                      <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        No activity logs found
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </>
          ) : (
            <Typography>No details available</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleDetailsDialogClose} color="primary" variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ban Doctor Dialog */}
      <BanUserDialog
        open={banDialogOpen}
        onClose={handleBanDialogClose}
        user={doctorToBan}
        userType="doctor"
        defaultBanIp={defaultBanIp}
        onBan={async (id, type, duration, reason, banIp, ipAddress) => {
          const result = await banUser(id, type, duration, reason, banIp, ipAddress);
          await getalldoctors();
          return result;
        }}
        onUnban={async (id, type, reason) => {
          const result = await unbanUser(id, type, reason);
          await getalldoctors();
          return result;
        }}
      />
    </div>
  )
}

export default DoctorsList
