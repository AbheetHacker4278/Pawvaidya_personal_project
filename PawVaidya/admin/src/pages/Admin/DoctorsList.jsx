import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
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
import WarningIcon from '@mui/icons-material/Warning'
import DeleteIcon from '@mui/icons-material/Delete'
import FolderIcon from '@mui/icons-material/Folder'
import VerifiedIcon from '@mui/icons-material/Verified'
import CancelIcon from '@mui/icons-material/Cancel'
import PendingIcon from '@mui/icons-material/Pending'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import ImageIcon from '@mui/icons-material/Image'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'

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

  // Medical Documents state
  const [medicalDocs, setMedicalDocs] = useState([])
  const [medicalDocsLoading, setMedicalDocsLoading] = useState(false)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [docToVerify, setDocToVerify] = useState(null)
  const [verifyStatus, setVerifyStatus] = useState('verified')
  const [verifyNote, setVerifyNote] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)

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
      <div className={`relative group bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden flex flex-col h-full ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
        {isDeleting && <LoadingSpinner />}

        {/* Selection & Status Header */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-xl border border-white/50 shadow-sm">
            <input
              type="checkbox"
              checked={selectedDoctors.includes(doctor.email)}
              onChange={(e) => {
                e.stopPropagation();
                handleSelectDoctor(doctor.email);
              }}
              className="w-5 h-5 cursor-pointer accent-emerald-600 rounded-md"
            />
          </div>
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${isAvailable
            ? 'bg-emerald-500 text-white shadow-emerald-200'
            : 'bg-rose-500 text-white shadow-rose-200'
            }`}>
            {isAvailable ? 'Active' : 'Busy'}
          </div>
        </div>

        {/* Doctor Image & Specialty Banner */}
        <div className="relative h-56 overflow-hidden">
          <img
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            src={doctor.image}
            alt={doctor.name}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA4Ny41Qzc1IDc4LjgxODIgODEuODE4MiA3MiA5MC41IDcyQzk5LjE4MTggNzIgMTA2IDc4LjgxODIgMTA2IDg3LjVDMTA2IDk2LjE4MTggOTkuMTgxOCAxMDMgOTAuNSAxMDNDODEuODE4MiAxMDMgNzUgOTYuMTgxOCA3NSA4Ny41WiIgZmlsbD0iIzlDQThBNiIvPgo8cGF0aCBkPSJNMTIwLjUgMTI4LjVDMTIwLjUgMTE5LjgxOCAxMjcuMzE4IDExMyAxMzYgMTEzQzE0NC42ODIgMTEzIDE1MS41IDExOS44MTggMTUxLjUgMTI4LjVDMTUxLjUgMTM3LjE4MiAxNDQuNjgyIDE0NCAxMzYgMTQ0QzEyNy4zMTggMTQ0IDEyMC41IDEzNy4xODIgMTIwLjUgMTI4LjVaIiBmaWxsPSIjOUNBOEE2Ii8+CjxwYXRoIGQ9Ik00OC41IDEyOC41QzQ4LjUgMTE5LjgxOCA1NS4zMTgyIDExMyA2NCAxMTNDNzIuNjgxOCAxMTMgNzkuNSAxMTkuODE4IDc5LjUgMTI4LjVDNzkuNSAxMzcuMTgyIDcyLjY4MTggMTQ0IDY0IDE0NEM1NS4zMTgyIDE0NCA0OC41IDEzNy4xODIgNDguNSAxMjguNVoiIGZpbGw9IiM5Q0E4QTYiLz4KPHBhdGggZD0iTTE0MCA3MEMxNDAgNjEuODE4MiAxNDYuODE4IDU1IDE1NSA1NUMxNjMuMTgyIDU1IDE3MCA2MS44MTgyIDE3MCA3MEMxNzAgNzguMTgxOCAxNjMuMTgyIDg1IDE1NSA4NUMxNDYuODE4IDg1IDE0MCA3OC4xODE4IDE0MCA3MFoiIGZpbGw9IiM5Q0E4QTYiLz4KPC9zdmc+';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
            <p className="text-white text-xs font-semibold leading-relaxed line-clamp-2 italic">
              {doctor.about || "Dedicated veterinary professional committed to pet wellness."}
            </p>
          </div>
        </div>

        {/* Doctor Info Content */}
        <div className="p-6 flex flex-col flex-1">
          <div className="mb-4">
            <h3 className="text-xl font-black text-slate-800 truncate tracking-tight">{doctor.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100 uppercase tracking-wider">
                {doctor.speciality}
              </span>
              {doctor.isBanned && (
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-100 uppercase tracking-wider">
                  Banned
                </span>
              )}
            </div>
          </div>

          {/* Professional Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <SchoolIcon className="text-indigo-500" sx={{ fontSize: 14 }} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Degree</span>
              </div>
              <span className="text-xs font-black text-slate-700 truncate">{doctor.degree}</span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <WorkIcon className="text-indigo-600" sx={{ fontSize: 14 }} />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Experience</span>
              </div>
              <span className="text-xs font-black text-indigo-700">{doctor.experience}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <AttachMoneyIcon className="text-amber-600" sx={{ fontSize: 14 }} />
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">Consult Fees</span>
              </div>
              <span className="text-xs font-black text-amber-700">₹{doctor.fees || '0'}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <HistoryIcon className="text-rose-600" sx={{ fontSize: 14 }} />
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-tighter">Last Seen IP</span>
              </div>
              <span className="text-xs font-black text-rose-700 truncate">{doctor.lastLoginIp || 'N/A'}</span>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-slate-500 group/item">
              <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center group-hover/item:border-emerald-200 transition-colors">
                <EmailIcon sx={{ fontSize: 14 }} />
              </div>
              <span className="text-xs font-medium truncate">{doctor.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 group/item">
              <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center group-hover/item:border-emerald-200 transition-colors">
                <PhoneIcon sx={{ fontSize: 14 }} />
              </div>
              <span className="text-xs font-medium">+91 {doctor.docphone}</span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={() => handleViewDetails(doctor)}
              className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 active:scale-95"
            >
              Full Profile
            </button>

            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex flex-col items-end mr-1">
                <span className="text-[8px] font-black text-slate-400 uppercase">Availability</span>
                <span className={`text-[9px] font-bold ${doctor.available ? 'text-emerald-600' : 'text-slate-500'}`}>{doctor.available ? 'ON' : 'OFF'}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  onChange={() => changeavailablity(doctor._id)}
                  type="checkbox"
                  checked={doctor.available}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
              </label>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleBanDoctor(doctor, false)}
              className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${doctor.isBanned
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'}`}
            >
              {doctor.isBanned ? 'Unlock' : 'Restrict'}
            </button>
            <button
              onClick={() => handleDeleteDoctor(doctor._id)}
              className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-rose-600 hover:text-white transition-all"
            >
              <DeleteIcon sx={{ fontSize: 14 }} />
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
  const handleViewDetails = async (doctor, tabIndex = 0) => {
    setSelectedDoctorDetails(null);
    setActivityLogs([]);
    setMedicalDocs([]);
    setDetailsDialogOpen(true);
    setDetailsTab(tabIndex); // Start with specified tab
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

      // Fetch medical documents
      fetchDoctorDocuments(doctor._id);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    } finally {
      setDoctorDetailsLoading(false);
      setLogsLoading(false);
    }
  };

  const fetchDoctorDocuments = async (doctorId) => {
    setMedicalDocsLoading(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/admin/doctor-documents/${doctorId}`,
        { headers: { atoken } }
      );
      if (data.success) setMedicalDocs(data.documents || []);
    } catch (e) {
      console.error('fetchDoctorDocuments error:', e);
    } finally {
      setMedicalDocsLoading(false);
    }
  };

  const handleVerifyDoc = async () => {
    if (!docToVerify) return;
    setVerifyLoading(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/doctor-documents/verify`,
        { doctorId: selectedDoctorDetails._id, documentId: docToVerify._id, verificationStatus: verifyStatus, adminNote: verifyNote },
        { headers: { atoken } }
      );
      if (data.success) {
        fetchDoctorDocuments(selectedDoctorDetails._id);
        setVerifyDialogOpen(false);
        setDocToVerify(null);
        setVerifyNote('');
      }
    } catch (e) {
      console.error('handleVerifyDoc error:', e);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleAdminDeleteDoc = async (docId) => {
    if (!window.confirm('Permanently delete this document?')) return;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/doctor-documents/delete`,
        { doctorId: selectedDoctorDetails._id, documentId: docId },
        { headers: { atoken } }
      );
      if (data.success) fetchDoctorDocuments(selectedDoctorDetails._id);
    } catch (e) {
      console.error('handleAdminDeleteDoc error:', e);
    }
  };

  const handleDetailsDialogClose = () => {
    setDetailsDialogOpen(false);
    setSelectedDoctorDetails(null);
    setActivityLogs([]);
    setDetailsTab(0);
    setMedicalDocs([]);
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
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
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

        <div className='bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-indigo-800'>Document Uploads</h3>
              <p className='text-3xl font-bold text-indigo-900'>
                {doctors.filter(d => d.medicalDocuments && d.medicalDocuments.length > 0).length} / {doctors.length}
              </p>
              <p className='text-xs text-indigo-600 mt-1'>Doctors with uploaded documents</p>
            </div>
            <div className='w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center'>
              <FolderIcon className="text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Document Stats & Verification Hub */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-6 mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left panel: Breakdown & Metrics */}
          <div className="w-full lg:w-1/3 flex flex-col justify-between p-6 bg-slate-50/50 border border-slate-100 rounded-3xl animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FolderIcon className="text-emerald-500" />
                Document Statistics
              </h2>
              <div className="space-y-4">
                {/* Total Docs */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Total Uploaded Files</span>
                  <span className="text-lg font-black text-slate-800">
                    {doctors.reduce((acc, d) => acc + (d.medicalDocuments?.length || 0), 0)}
                  </span>
                </div>
                {/* Categories */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">By Category</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-white border border-slate-100 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-medium">Education</span>
                      <span className="text-sm font-bold text-indigo-600">
                        {doctors.reduce((acc, d) => acc + (d.medicalDocuments?.filter(doc => doc.category === 'education').length || 0), 0)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-100 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-medium">Records</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {doctors.reduce((acc, d) => acc + (d.medicalDocuments?.filter(doc => doc.category === 'records').length || 0), 0)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-100 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-medium">Govt ID</span>
                      <span className="text-sm font-bold text-purple-600">
                        {doctors.reduce((acc, d) => acc + (d.medicalDocuments?.filter(doc => doc.category === 'govtId').length || 0), 0)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-100 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-medium">Others</span>
                      <span className="text-sm font-bold text-slate-600">
                        {doctors.reduce((acc, d) => acc + (d.medicalDocuments?.filter(doc => doc.category === 'other').length || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Verification Status</span>
              
              {/* Verified progress */}
              <div className="space-y-1">
                {(() => {
                  const total = doctors.reduce((acc, d) => acc + (d.medicalDocuments?.length || 0), 0);
                  const verified = doctors.reduce((acc, d) => acc + (d.medicalDocuments?.filter(doc => doc.verificationStatus === 'verified').length || 0), 0);
                  const pct = total ? Math.round((verified / total) * 100) : 0;
                  return (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Verified</span>
                        <span className="font-bold text-emerald-600">{verified} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Pending progress */}
              <div className="space-y-1">
                {(() => {
                  const total = doctors.reduce((acc, d) => acc + (d.medicalDocuments?.length || 0), 0);
                  const pending = doctors.reduce((acc, d) => acc + (d.medicalDocuments?.filter(doc => doc.verificationStatus === 'pending').length || 0), 0);
                  const pct = total ? Math.round((pending / total) * 100) : 0;
                  return (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Pending Review</span>
                        <span className="font-bold text-amber-600">{pending} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Rejected progress */}
              <div className="space-y-1">
                {(() => {
                  const total = doctors.reduce((acc, d) => acc + (d.medicalDocuments?.length || 0), 0);
                  const rejected = doctors.reduce((acc, d) => acc + (d.medicalDocuments?.filter(doc => doc.verificationStatus === 'rejected').length || 0), 0);
                  const pct = total ? Math.round((rejected / total) * 100) : 0;
                  return (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Rejected</span>
                        <span className="font-bold text-rose-600">{rejected} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Right panel: Doctor List with Uploaded Docs */}
          <div className="w-full lg:w-2/3 flex flex-col animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <VerifiedIcon className="text-indigo-500" />
                Doctors with Uploaded Documents
              </h2>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                {doctors.filter(d => d.medicalDocuments && d.medicalDocuments.length > 0).length} Doctor(s)
              </span>
            </div>

            {doctors.filter(d => d.medicalDocuments && d.medicalDocuments.length > 0).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-100 rounded-3xl text-center">
                <FolderIcon className="text-slate-300 w-16 h-16 mb-2" />
                <p className="text-slate-600 font-semibold">No documents uploaded yet</p>
                <p className="text-slate-400 text-xs mt-1">Uploaded credentials will appear here for verification.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[360px] pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
                {doctors.filter(d => d.medicalDocuments && d.medicalDocuments.length > 0).map(doc => {
                  const docCount = doc.medicalDocuments.length;
                  const docCategories = [...new Set(doc.medicalDocuments.map(d => d.category))];
                  const hasPending = doc.medicalDocuments.some(d => d.verificationStatus === 'pending');
                  const verifiedCount = doc.medicalDocuments.filter(d => d.verificationStatus === 'verified').length;
                  const rejectedCount = doc.medicalDocuments.filter(d => d.verificationStatus === 'rejected').length;
                  const pendingCount = doc.medicalDocuments.filter(d => d.verificationStatus === 'pending').length;

                  return (
                    <div key={doc._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl shadow-sm transition-all duration-300 gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={doc.image} alt={doc.name} className="w-12 h-12 border border-slate-100" />
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm sm:text-base leading-snug">{doc.name}</h4>
                          <span className="text-xs text-slate-400 block">{doc.speciality}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {docCategories.map(cat => (
                              <span key={cat} className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {cat === 'govtId' ? 'Govt ID' : cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex flex-col items-start sm:items-end">
                          <span className="text-xs font-bold text-slate-700">{docCount} document(s)</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            {verifiedCount > 0 && (
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title={`${verifiedCount} Verified`} />
                            )}
                            {pendingCount > 0 && (
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title={`${pendingCount} Pending`} />
                            )}
                            {rejectedCount > 0 && (
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" title={`${rejectedCount} Rejected`} />
                            )}
                            <span className="text-[10px] text-slate-400">
                              ({verifiedCount}v, {pendingCount}p, {rejectedCount}r)
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleViewDetails(doc, 3)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 active:scale-95 flex items-center gap-1.5 ${
                            hasPending
                              ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-100'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100'
                          }`}
                        >
                          {hasPending ? 'Verify (Pending)' : 'Review Docs'}
                          <OpenInNewIcon sx={{ fontSize: 12 }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                <Tab label={`Medical Documents (${medicalDocs.length})`} icon={medicalDocsLoading ? undefined : undefined} />
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

              {/* Medical Documents Tab */}
              {detailsTab === 3 && (
                <Box>
                  {/* Stats summary */}
                  <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                    {['pending', 'verified', 'rejected'].map(s => {
                      const count = medicalDocs.filter(d => d.verificationStatus === s).length;
                      return (
                        <Paper key={s} elevation={1} sx={{ px: 2, py: 1, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s === 'verified' ? '#10b981' : s === 'rejected' ? '#ef4444' : '#f59e0b' }} />
                          <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>{s}: {count}</Typography>
                        </Paper>
                      );
                    })}
                    <Paper elevation={1} sx={{ px: 2, py: 1, borderRadius: 3 }}>
                      <Typography variant="caption" fontWeight="bold">Total: {medicalDocs.length}</Typography>
                    </Paper>
                  </Box>

                  {medicalDocsLoading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                      <CircularProgress color="primary" />
                    </Box>
                  ) : medicalDocs.length === 0 ? (
                    <Box textAlign="center" py={6}>
                      <FolderIcon sx={{ fontSize: 56, color: '#c7d2fe', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">No documents uploaded yet</Typography>
                      <Typography variant="body2" color="text.disabled">The doctor has not uploaded any medical documents</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 2 }}>
                      {medicalDocs.map(doc => (
                        <Paper
                          key={doc._id}
                          elevation={2}
                          sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: '2px solid',
                            borderColor: doc.verificationStatus === 'verified' ? '#bbf7d0' : doc.verificationStatus === 'rejected' ? '#fecaca' : '#fef3c7',
                            transition: 'box-shadow 0.2s',
                            '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }
                          }}
                        >
                          {/* Thumbnail */}
                          <Box sx={{ height: 140, bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                            {doc.fileType === 'image' ? (
                              <img src={doc.url} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : doc.fileType === 'pdf' ? (
                              <Box textAlign="center">
                                <PictureAsPdfIcon sx={{ fontSize: 52, color: '#ef4444' }} />
                                <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold">PDF</Typography>
                              </Box>
                            ) : (
                              <Box textAlign="center">
                                <InsertDriveFileIcon sx={{ fontSize: 52, color: '#6366f1' }} />
                                <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold">
                                  {doc.mimeType && doc.mimeType.split('/')[1] ? doc.mimeType.split('/')[1].toUpperCase() : 'FILE'}
                                </Typography>
                              </Box>
                            )}
                            <Chip
                              label={doc.verificationStatus ? doc.verificationStatus.toUpperCase() : 'PENDING'}
                              size="small"
                              sx={{
                                position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 'bold',
                                bgcolor: doc.verificationStatus === 'verified' ? '#10b981' : doc.verificationStatus === 'rejected' ? '#ef4444' : '#f59e0b',
                                color: 'white'
                              }}
                            />
                          </Box>

                          {/* Info */}
                          <Box sx={{ p: 1.5 }}>
                            <Typography variant="body2" fontWeight="bold" noWrap title={doc.name}>{doc.name}</Typography>
                            <Box display="flex" alignItems="center" gap={1} mt={0.5} mb={1}>
                              <Chip
                                label={
                                  doc.category === 'education' ? 'Education' :
                                  doc.category === 'records' ? 'Records' :
                                  doc.category === 'govtId' ? 'Govt ID' : 'Other'
                                }
                                size="small"
                                sx={{
                                  fontSize: 9, fontWeight: 'bold',
                                  bgcolor: doc.category === 'education' ? '#dbeafe' :
                                           doc.category === 'records' ? '#dcfce7' :
                                           doc.category === 'govtId' ? '#f3e8ff' : '#f1f5f9'
                                }}
                              />
                              <Typography variant="caption" color="text.disabled">
                                {doc.storageProvider === 'cloudinary' ? 'Cloudinary' : 'Firebase'}
                              </Typography>
                            </Box>
                            {doc.adminNote && (
                              <Typography variant="caption" color="text.secondary" display="block"
                                sx={{ fontStyle: 'italic', mb: 1, borderTop: '1px solid #f1f5f9', pt: 0.5 }}>
                                Note: {doc.adminNote}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              <Button
                                size="small" variant="outlined"
                                startIcon={<OpenInNewIcon />}
                                href={doc.url} target="_blank" rel="noreferrer"
                                sx={{ fontSize: 10, borderRadius: 2, flex: 1 }}
                              >View</Button>
                              <Button
                                size="small" variant="contained"
                                sx={{ fontSize: 10, borderRadius: 2, flex: 1, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
                                onClick={() => {
                                  setDocToVerify(doc);
                                  setVerifyStatus(doc.verificationStatus || 'verified');
                                  setVerifyNote(doc.adminNote || '');
                                  setVerifyDialogOpen(true);
                                }}
                              >Verify</Button>
                              <Button
                                size="small" variant="contained" color="error"
                                sx={{ fontSize: 10, borderRadius: 2, minWidth: 'auto', px: 1 }}
                                onClick={() => handleAdminDeleteDoc(doc._id)}
                              ><DeleteIcon sx={{ fontSize: 14 }} /></Button>
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </>
          ) : (
            <Typography>No details available</Typography>
          )}
        </DialogContent>

        {/* Verify Document Dialog */}
        <Dialog open={verifyDialogOpen} onClose={() => setVerifyDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: '#4f46e5', color: 'white', fontWeight: 'bold' }}>
            {docToVerify?.verificationStatus === 'verified' ? '🔄 Update Verification' : '✅ Verify Document'}: {docToVerify?.name}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Verification Status</Typography>
              <Box display="flex" gap={1} mb={3}>
                {['verified', 'rejected', 'pending'].map(s => (
                  <Button
                    key={s}
                    variant={verifyStatus === s ? 'contained' : 'outlined'}
                    color={s === 'verified' ? 'success' : s === 'rejected' ? 'error' : 'warning'}
                    size="small"
                    onClick={() => setVerifyStatus(s)}
                    sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}
                  >
                    {s === 'verified' ? '✅ Verified' : s === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                  </Button>
                ))}
              </Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Admin Note (optional)</Typography>
              <textarea
                value={verifyNote}
                onChange={e => setVerifyNote(e.target.value)}
                placeholder="Add a note for the doctor..."
                rows={3}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, resize: 'vertical' }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setVerifyDialogOpen(false)} color="inherit">Cancel</Button>
            <Button onClick={handleVerifyDoc} variant="contained" color="primary" disabled={verifyLoading}>
              {verifyLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

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
