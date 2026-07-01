import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import DriverLogin from '../components/DriverLogin';

const BACKEND = 'http://localhost:4000';

export default function DriverPortal() {
  const [token, setToken] = useState(localStorage.getItem('dtoken') || '');
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [locationInterval, setLocationInterval] = useState(10); // in seconds
  const [appealText, setAppealText] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const profileInputRef = useRef(null);

  // Face Biometric state
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceModalMode, setFaceModalMode] = useState('register'); // 'register' or 'verify'
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle', 'streaming', 'scanning', 'success', 'error'
  const [useSimulatedScan, setUseSimulatedScan] = useState(false);

  // File states
  const [dlFile, setDlFile] = useState(null);
  const [photoIdFile, setPhotoIdFile] = useState(null);

  const gpsTimerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Start camera when modal is shown — use useEffect to ensure DOM is ready
  useEffect(() => {
    if (!showFaceModal) return;
    let cancelled = false;

    const initCamera = async () => {
      setScanStatus('streaming');
      setUseSimulatedScan(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 320, facingMode: 'user' }
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        // Wait a tick for video element to be available in the DOM
        requestAnimationFrame(() => {
          if (videoRef.current && !cancelled) {
            videoRef.current.srcObject = stream;
          }
        });
      } catch (err) {
        console.warn("Webcam access failed, falling back to simulator:", err);
        if (!cancelled) setUseSimulatedScan(true);
      }
    };

    initCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [showFaceModal]);

  const triggerFaceScan = () => {
    const mode = driver && driver.faceRegistered ? 'verify' : 'register';
    setFaceModalMode(mode);
    setScanStatus('idle');
    setShowFaceModal(true); // useEffect above handles camera init
  };

  const closeFaceModal = () => {
    // Stop camera tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowFaceModal(false);
    setScanStatus('idle');
  };

  const handleCaptureAndScan = async () => {
    setScanStatus('scanning');

    // Scanning animation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    let facePhoto = null;

    if (!useSimulatedScan && videoRef.current && canvasRef.current) {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 320;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Compress to JPEG at 0.7 quality to reduce payload size
        facePhoto = canvas.toDataURL('image/jpeg', 0.7);
      } catch (err) {
        console.error("Failed to capture image", err);
      }
    }

    // Fallback for simulated mode - generate a tiny placeholder
    if (!facePhoto || facePhoto === 'data:,') {
      // Create a small 1x1 pixel as simulated placeholder
      const c = document.createElement('canvas');
      c.width = 64; c.height = 64;
      const cx = c.getContext('2d');
      cx.fillStyle = '#334155';
      cx.fillRect(0, 0, 64, 64);
      cx.fillStyle = '#fff';
      cx.font = '24px sans-serif';
      cx.textAlign = 'center';
      cx.fillText('👤', 32, 44);
      facePhoto = c.toDataURL('image/jpeg', 0.5);
    }

    try {
      if (faceModalMode === 'register') {
        const { data } = await axios.post(`${BACKEND}/api/driver/register-face`, { facePhoto }, { headers: { dtoken: token } });
        if (data.success) {
          setScanStatus('success');
          toast.success("Face registered successfully!");
          // Re-fetch profile to get full updated driver state
          setTimeout(async () => {
            closeFaceModal();
            await fetchProfile(token);
          }, 1500);
        } else {
          setScanStatus('error');
          toast.error(data.message);
          setTimeout(() => setScanStatus('streaming'), 2000);
        }
      } else {
        // verify mode
        const { data } = await axios.post(`${BACKEND}/api/driver/verify-face`, { facePhoto }, { headers: { dtoken: token } });
        if (data.success) {
          setScanStatus('success');
          toast.success("Face verification successful!");

          // Now proceed to go online
          try {
            const statusRes = await axios.post(`${BACKEND}/api/driver/update-status`, {
              status: 'Online',
              faceVerified: true
            }, { headers: { dtoken: token } });

            if (statusRes.data.success) {
              toast.success("You are now Online");
              setTimeout(async () => {
                closeFaceModal();
                await fetchProfile(token);
              }, 1000);
            } else {
              setScanStatus('error');
              toast.error(statusRes.data.message);
              setTimeout(() => setScanStatus('streaming'), 2000);
            }
          } catch (statusErr) {
            setScanStatus('error');
            toast.error('Failed to update status');
            setTimeout(() => setScanStatus('streaming'), 2000);
          }
        } else {
          setScanStatus('error');
          toast.error(data.message);
          setTimeout(() => setScanStatus('streaming'), 2000);
        }
      }
    } catch (err) {
      setScanStatus('error');
      toast.error("Scan API request failed. Check network.");
      setTimeout(() => setScanStatus('streaming'), 2000);
    }
  };
  const handleLogout = useCallback(() => {
    localStorage.removeItem('dtoken');
    localStorage.removeItem('driverInfo');
    setToken('');
    setDriver(null);
    setActiveBooking(null);
    setGpsEnabled(false);
  }, []);

  const fetchProfile = useCallback(async (authToken) => {
    try {
      const { data } = await axios.get(`${BACKEND}/api/driver/profile`, {
        headers: { dtoken: authToken }
      });
      if (data.success) {
        setDriver(data.driver);
        // Auto-logout if account is banned or inactive and token is somehow invalid
        if (data.driver.isBanned) {
          toast.warning('Account is currently suspended.');
        }
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile');
      if (err.response && (err.response.status === 401 || err.response.status === 403 || err.response.status === 404)) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  const fetchAssignedBooking = useCallback(async (authToken) => {
    try {
      const { data } = await axios.get(`${BACKEND}/api/driver/assigned-booking`, {
        headers: { dtoken: authToken }
      });
      if (data.success) {
        setActiveBooking(data.booking);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchProfile(token);
      fetchAssignedBooking(token);
      const bookingInterval = setInterval(() => fetchAssignedBooking(token), 5000);
      return () => clearInterval(bookingInterval);
    } else {
      setLoading(false);
    }
  }, [token, fetchProfile, fetchAssignedBooking]);

  // GPS tracking loop
  useEffect(() => {
    if (gpsEnabled && token && driver && !driver.isBanned) {
      const sendLocation = () => {
        if (!navigator.geolocation) {
          toast.error('Geolocation is not supported by your browser');
          setGpsEnabled(false);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await axios.post(`${BACKEND}/api/driver/update-location`, {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                locationSharing: true
              }, { headers: { dtoken: token } });
            } catch (err) {
              console.error('Location update failed', err);
            }
          },
          (err) => {
            console.error('GPS error:', err);
          }
        );
      };

      sendLocation();
      gpsTimerRef.current = setInterval(sendLocation, locationInterval * 1000);
    } else {
      if (gpsTimerRef.current) {
        clearInterval(gpsTimerRef.current);
      }
      if (token && gpsEnabled === false) {
        // notify backend location sharing is off
        axios.post(`${BACKEND}/api/driver/update-location`, {
          locationSharing: false
        }, { headers: { dtoken: token } }).catch(err => console.error(err));
      }
    }
    return () => {
      if (gpsTimerRef.current) clearInterval(gpsTimerRef.current);
    };
  }, [gpsEnabled, token, driver, locationInterval]);

  const handleLogin = (authToken, driverData) => {
    setToken(authToken);
    setDriver(driverData);
    fetchProfile(authToken);
  };


  const toggleStatus = async () => {
    if (!driver) return;
    if (driver.status === 'Offline') {
      // Check if face was verified today
      const todayStr = new Date().toDateString();
      const lastVerifiedStr = driver.lastFaceVerifiedAt ? new Date(driver.lastFaceVerifiedAt).toDateString() : null;
      const verifiedToday = (todayStr === lastVerifiedStr);

      if (verifiedToday) {
        // Go online directly without scanning
        try {
          const { data } = await axios.post(`${BACKEND}/api/driver/update-status`, {
            status: 'Online',
            faceVerified: true
          }, { headers: { dtoken: token } });
          if (data.success) {
            setDriver(prev => ({ ...prev, status: data.status }));
            toast.success(`You are now Online`);
          } else {
            toast.error(data.message);
          }
        } catch (err) {
          toast.error('Failed to toggle status');
        }
      } else {
        triggerFaceScan();
      }
      return;
    }
    try {
      const { data } = await axios.post(`${BACKEND}/api/driver/update-status`, {
        status: 'Offline'
      }, { headers: { dtoken: token } });
      if (data.success) {
        setDriver(prev => ({ ...prev, status: data.status }));
        toast.success(`You are now Offline`);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to toggle duty status');
    }
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const { data } = await axios.post(`${BACKEND}/api/driver/upload-profile-photo`, {
            profilePhoto: reader.result
          }, { headers: { dtoken: token } });
          if (data.success) {
            toast.success('Profile photo uploaded!');
            setDriver(prev => ({ ...prev, profilePhoto: data.profilePhoto }));
          } else {
            toast.error(data.message);
          }
        } catch (err) {
          toast.error('Photo upload failed');
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Failed to read file');
      setUploadingPhoto(false);
    }
  };

  const handleUploadDocuments = async (e) => {
    e.preventDefault();
    if (!dlFile || !photoIdFile) {
      return toast.error('Please select both required documents.');
    }
    setUploadingDocs(true);
    const formData = new FormData();
    formData.append('drivingLicence', dlFile);
    formData.append('govPhotoId', photoIdFile);

    try {
      const { data } = await axios.post(`${BACKEND}/api/driver/upload-documents`, formData, {
        headers: {
          dtoken: token,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (data.success) {
        toast.success(data.message);
        setDriver(data.driver);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Document upload failed');
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleLifecycleAction = async (action) => {
    if (!activeBooking) return;
    try {
      const { data } = await axios.post(`${BACKEND}/api/driver/booking-status`, {
        bookingId: activeBooking.dispatchId,
        action
      }, { headers: { dtoken: token } });
      if (data.success) {
        toast.success(data.message);
        fetchAssignedBooking(token);
        if (driver) {
          setDriver(prev => ({ ...prev, status: data.driverStatus }));
        }
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealText.trim()) return toast.error('Please write an appeal explanation.');
    setSubmittingAppeal(true);
    try {
      const { data } = await axios.post(`${BACKEND}/api/driver/submit-appeal`, {
        appealText
      }, { headers: { dtoken: token } });
      if (data.success) {
        toast.success(data.message);
        setDriver(prev => ({ ...prev, appeal: data.appeal }));
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Appeal submission failed');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="animate-spin" style={{ width: 40, height: 40, border: '4px solid rgba(239,68,68,0.2)', borderTopColor: 'var(--red)', borderRadius: '50%' }} />
      </div>
    );
  }

  if (!token || !driver) {
    return <DriverLogin onLogin={handleLogin} />;
  }

  // Calculate salary components
  const baseSalary = driver.salary?.base || 8500;
  // Performance bonus is 1500 for each 5-star rating
  const ratings = driver.ratings || [];
  const fiveStarCount = ratings.filter(r => r.rating === 5).length;
  const ratingBonus = fiveStarCount * 1500;
  const deductions = driver.salary?.deductions || 0;
  const netPayable = baseSalary + ratingBonus - deductions;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#060d1b' }}>
      {/* Top Navbar - Ambulance themed */}
      <header style={{ padding: '14px 24px', borderBottom: '2px solid rgba(239,68,68,0.3)', background: 'linear-gradient(90deg, #0c1425 0%, #141e33 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 0 16px rgba(239,68,68,0.4)' }}>🚑</div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: 0.5 }}>Mobile ICU — Driver Portal</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: driver.status === 'Offline' ? '#ef4444' : '#10b981', boxShadow: driver.status !== 'Offline' ? '0 0 8px #10b981' : 'none' }} />
              <span style={{ fontSize: 11, color: driver.status === 'Offline' ? '#f87171' : '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{driver.isBanned ? 'SUSPENDED' : driver.status}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{driver.fullName}</span>
          <button onClick={handleLogout} style={{ padding: '6px 16px', fontSize: 11, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Logout</button>
        </div>
      </header>

      <main style={{ flex: 1, padding: 24, maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {/* BAN STATE AND APPEAL PANEL */}
        {driver.isBanned ? (
          <div className="glass fade-up" style={{ padding: 32, border: '1px solid var(--red-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 32 }}>🚨</span>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--red)' }}>Account Suspended</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Your account has been banned due to misconduct reports or policy violations.</p>
              </div>
            </div>
            <div className="glass2" style={{ padding: 16, marginBottom: 24 }}>
              <span className="label">Suspension Reason</span>
              <p style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{driver.banReason || 'No specific reason provided'}</p>
            </div>
            {driver.appeal && driver.appeal.status !== 'None' ? (
              <div className="glass2" style={{ padding: 20 }}>
                <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Submitted Reinstatement Appeal</h4>
                <span className={`badge ${driver.appeal.status === 'Pending' ? 'badge-enroute' : driver.appeal.status === 'Approved' ? 'badge-online' : 'badge-banned'}`}>{driver.appeal.status}</span>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic' }}>"{driver.appeal.appealText}"</p>
              </div>
            ) : (
              <form onSubmit={handleAppealSubmit}>
                <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Submit Reinstatement Appeal</h4>
                <textarea className="input" rows={4} placeholder="Explain why your account should be reactivated..." value={appealText} onChange={e => setAppealText(e.target.value)} style={{ resize: 'none', fontFamily: 'inherit', marginBottom: 12 }} />
                <button type="submit" className="btn btn-red" disabled={submittingAppeal}>{submittingAppeal ? 'Submitting...' : '✉️ Submit Appeal'}</button>
              </form>
            )}
          </div>
        ) : !driver.documents?.uploaded ? (
          /* MANDATORY DOCUMENT UPLOADS PANEL */
          <div className="glass fade-up" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 32 }}>📁</span>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900 }}>Mandatory Documents Upload</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Upload your Driving Licence and Government Photo ID to activate your account.</p>
              </div>
            </div>
            <form onSubmit={handleUploadDocuments} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                <div className="glass2" style={{ padding: 20 }}>
                  <label className="label">1. Driving Licence</label>
                  <input type="file" accept="image/*,application/pdf" onChange={e => setDlFile(e.target.files[0])} style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13 }} />
                </div>
                <div className="glass2" style={{ padding: 20 }}>
                  <label className="label">2. Government Photo ID</label>
                  <input type="file" accept="image/*,application/pdf" onChange={e => setPhotoIdFile(e.target.files[0])} style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13 }} />
                </div>
              </div>
              <button type="submit" className="btn btn-emerald" disabled={uploadingDocs} style={{ alignSelf: 'start' }}>{uploadingDocs ? 'Uploading...' : '📤 Upload Documents'}</button>
            </form>
          </div>
        ) : (
          /* ═══ MAIN DASHBOARD ═══ */
          <>
            {/* ── Driver Profile Card + Face Registration ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* Profile Card */}
              <div style={{ background: 'linear-gradient(135deg, #0f1a2e 0%, #162039 100%)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative' }}>
                  <div onClick={() => profileInputRef.current?.click()} style={{ width: 90, height: 90, borderRadius: '50%', border: '3px solid rgba(239,68,68,0.4)', overflow: 'hidden', cursor: 'pointer', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {driver.profilePhoto ? (
                      <img src={driver.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 36, color: '#475569' }}>👤</span>
                    )}
                  </div>
                  {uploadingPhoto && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="animate-spin" style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /></div>}
                  <input ref={profileInputRef} type="file" accept="image/*" onChange={handleProfilePhotoUpload} style={{ display: 'none' }} />
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, cursor: 'pointer', border: '2px solid #0f1a2e' }} onClick={() => profileInputRef.current?.click()}>📷</div>
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{driver.fullName}</h3>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>@{driver.username}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>📞 {driver.mobileNumber}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>🚑 {driver.assignedVehicle || 'No Van Assigned'}</p>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Joined: {new Date(driver.joiningDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Face Biometric Card */}
              <div style={{ background: 'linear-gradient(135deg, #0f1a2e 0%, #162039 100%)', border: `1px solid ${driver.faceRegistered ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: driver.faceRegistered ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', border: `2px solid ${driver.faceRegistered ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {driver.faceRegistered && driver.facePhoto ? (
                    <img src={driver.facePhoto} alt="Face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 28 }}>{driver.faceRegistered ? '✅' : '📸'}</span>
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Biometric Face ID</h4>
                  <p style={{ fontSize: 11, color: driver.faceRegistered ? '#34d399' : '#fbbf24', fontWeight: 600, marginTop: 2 }}>
                    {driver.faceRegistered ? '✓ Face Registered' : '⚠ Not Registered'}
                  </p>
                </div>
                <button onClick={() => { setFaceModalMode(driver.faceRegistered ? 'verify' : 'register'); setScanStatus('idle'); setShowFaceModal(true); }} style={{ padding: '8px 20px', borderRadius: 10, background: driver.faceRegistered ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', border: `1px solid ${driver.faceRegistered ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, color: driver.faceRegistered ? '#34d399' : '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {driver.faceRegistered ? '🔄 Re-Register Face' : '📸 Register Face Now'}
                </button>
              </div>
            </div>

            {/* ── Main Dashboard Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
            {/* Left Side: Duty & Dispatches */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Duty Controls & Location Toggle */}
              <div className="glass" style={{ padding: 20, display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800 }}>Duty Status Control</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    Go Online to receive active bookings & dispatches.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={toggleStatus} className={`btn ${driver.status === 'Offline' ? 'btn-emerald' : 'btn-ghost'}`}>
                    {driver.status === 'Offline' ? '🟢 Go Online' : '🔴 Go Offline'}
                  </button>
                </div>
              </div>

              {/* GPS Tracker Settings */}
              <div className="glass" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800 }}>Live Location Sharing</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Shares your vehicle coordinates with the Admin and booking user.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={gpsEnabled}
                    onChange={e => setGpsEnabled(e.target.checked)}
                    style={{ width: 20, height: 20, accentColor: 'var(--emerald)', cursor: 'pointer' }}
                  />
                </div>
                {gpsEnabled && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Interval:</span>
                    <select
                      className="input"
                      value={locationInterval}
                      onChange={e => setLocationInterval(Number(e.target.value))}
                      style={{ padding: '4px 8px', width: 'auto', fontSize: 12 }}
                    >
                      <option value={5}>Every 5 Seconds</option>
                      <option value={10}>Every 10 Seconds</option>
                      <option value={30}>Every 30 Seconds</option>
                      <option value={60}>Every 60 Seconds</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Ride Lifecycle Management */}
              <div className="glass" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Assigned Active Dispatch</h3>
                {activeBooking ? (
                  <div className="fade-up">
                    <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: 14 }}>
                      <span className="badge badge-enroute">{activeBooking.status}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID: {activeBooking.dispatchId}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 16 }}>
                      <div className="glass2" style={{ padding: 10 }}>
                        <span className="label">User / Pet Info</span>
                        <p style={{ fontWeight: 700 }}>{activeBooking.user?.name || 'Unknown'}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Phone: {activeBooking.user?.phone}</p>
                        <p style={{ fontSize: 12, marginTop: 4 }}>Pet: {activeBooking.petName}</p>
                      </div>
                      <div className="glass2" style={{ padding: 10 }}>
                        <span className="label">Pickup Location</span>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Coordinates: {activeBooking.pickupLat}, {activeBooking.pickupLng}</p>
                        {activeBooking.paramedicName && <p style={{ fontSize: 11, color: 'var(--blue)', marginTop: 4 }}>Paramedic: {activeBooking.paramedicName}</p>}
                      </div>
                    </div>

                    {/* Step indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '20px 0', background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        <span className={`step-dot ${['Dispatched', 'En Route', 'Reached', 'Started', 'Completed'].includes(activeBooking.status) ? 'active' : ''}`} />
                        <span>Dispatched</span>
                      </div>
                      <span style={{ color: 'var(--border2)' }}>→</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        <span className={`step-dot ${activeBooking.status === 'En Route' ? 'current' : ['Reached', 'Started', 'Completed'].includes(activeBooking.status) ? 'active' : ''}`} />
                        <span>En Route</span>
                      </div>
                      <span style={{ color: 'var(--border2)' }}>→</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        <span className={`step-dot ${activeBooking.status === 'Reached' ? 'current' : ['Started', 'Completed'].includes(activeBooking.status) ? 'active' : ''}`} />
                        <span>Reached</span>
                      </div>
                      <span style={{ color: 'var(--border2)' }}>→</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        <span className={`step-dot ${activeBooking.status === 'Started' ? 'current' : activeBooking.status === 'Completed' ? 'active' : ''}`} />
                        <span>Service</span>
                      </div>
                    </div>

                    {/* Action buttons based on status */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      {['Dispatched', 'En Route'].includes(activeBooking.status) && (
                        <button className="btn btn-emerald" onClick={() => handleLifecycleAction('accept')} style={{ flex: 1 }}>
                          🤝 Accept Dispatch
                        </button>
                      )}
                      {activeBooking.status === 'En Route' && (
                        <button className="btn btn-amber" onClick={() => handleLifecycleAction('reached')} style={{ flex: 1 }}>
                          📍 Reached Pickup Location
                        </button>
                      )}
                      {activeBooking.status === 'Reached' && (
                        <button className="btn btn-emerald" onClick={() => handleLifecycleAction('begin')} style={{ flex: 1 }}>
                          🚑 Begin Medical Service
                        </button>
                      )}
                      {activeBooking.status === 'Started' && (
                        <button className="btn btn-red" onClick={() => handleLifecycleAction('complete')} style={{ flex: 1 }}>
                          ✅ Complete Ride & Dispatch
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>💤</span>
                    No active dispatches right now. Go online to receive bookings.
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Ledger & Ratings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Rating Performance */}
              <div className="glass" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Rating Performance</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: 'var(--gold-soft)', border: '1px solid rgba(212,168,67,0.3)', width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--gold)', fontWeight: 900 }}>
                    ★
                  </div>
                  <div>
                    <h4 style={{ fontSize: 18, fontWeight: 900 }}>
                      {(ratings.reduce((sum, r) => sum + r.rating, 0) / (ratings.length || 1)).toFixed(1)} / 5.0
                    </h4>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>From {ratings.length} user reviews</p>
                  </div>
                </div>
                <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-muted)' }}>
                  * Receive ₹1,500 bonus for every 5-star rating you earn!
                </div>
              </div>

              {/* Financial Ledger & Net Payable */}
              <div className="glass" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Salary Account Ledger</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Base Salary (Monthly):</span>
                    <span style={{ fontWeight: 600 }}>₹{baseSalary}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Performance Bonuses:</span>
                    <span style={{ fontWeight: 600, color: 'var(--emerald)' }}>+₹{ratingBonus} ({fiveStarCount} × 1,500)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Deductions:</span>
                    <span style={{ fontWeight: 600, color: 'var(--red)' }}>-₹{deductions}</span>
                  </div>
                  <div className="divider" style={{ margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'between', fontSize: 16, fontWeight: 900 }}>
                    <span>Net Payable:</span>
                    <span style={{ color: 'var(--emerald)' }}>₹{netPayable}</span>
                  </div>
                </div>

                {/* Deduction History logs */}
                {driver.deductionHistory && driver.deductionHistory.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <span className="label">Salary Deduction Logs</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, maxHeight: 150, overflowY: 'auto' }}>
                      {driver.deductionHistory.map((d, idx) => (
                        <div key={idx} style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', padding: 8, borderRadius: 6, fontSize: 11 }}>
                          <div style={{ display: 'flex', justifyContent: 'between', fontWeight: 700, color: 'var(--red)' }}>
                            <span>-{d.reason}</span>
                            <span>₹{d.amount}</span>
                          </div>
                          {d.remarks && <p style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>{d.remarks}</p>}
                        </div>
                      ))}
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </>
      )}
    </main>

      {/* ── BIOMETRIC SCANNER MODAL ── */}
      {showFaceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#0a1020',
            border: '1px solid #1e293b',
            borderRadius: 24,
            maxWidth: 400,
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #111827',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🔐</span> {faceModalMode === 'register' ? 'Biometric Face Registration' : 'Biometric Identity Verification'}
              </h3>
              <button onClick={closeFaceModal} style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 18
              }}>✕</button>
            </div>

            {/* Video Container */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{
                position: 'relative',
                width: 240,
                height: 240,
                borderRadius: '50%',
                overflow: 'hidden',
                border: scanStatus === 'scanning' ? '4px solid #f59e0b' : scanStatus === 'success' ? '4px solid #10b981' : '4px solid #ef4444',
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
              }}>
                {/* Hidden canvas for snapshot capture */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Webcam Video feed */}
                {!useSimulatedScan && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                )}

                {/* Simulation Mode Graphics */}
                {useSimulatedScan && (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(circle, #1e293b 0%, #090d16 100%)',
                    color: '#94a3b8',
                    position: 'relative'
                  }}>
                    <span style={{ fontSize: 64 }}>👤</span>
                    <span style={{ fontSize: 10, color: '#f59e0b', marginTop: 12, fontWeight: 'bold', letterSpacing: 1 }}>SIMULATOR ACTIVE</span>
                  </div>
                )}

                {/* Scanning Laser Line overlay */}
                {scanStatus === 'scanning' && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to bottom, transparent 95%, #ef4444 100%)',
                    animation: 'scanLine 1.5s infinite linear',
                    pointerEvents: 'none'
                  }} />
                )}

                {/* Status overlays */}
                {scanStatus === 'scanning' && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 14
                  }}>
                    {faceModalMode === 'register' ? 'Registering Face...' : 'Scanning Biometrics...'}
                  </div>
                )}

                {scanStatus === 'success' && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(16,185,129,0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 16
                  }}>
                    <span style={{ fontSize: 32, marginBottom: 8 }}>✓</span>
                    {faceModalMode === 'register' ? 'REGISTRATION SUCCESSFUL' : 'MATCH SUCCESSFUL'}
                  </div>
                )}
              </div>

              {/* Status information label */}
              <p style={{
                fontSize: 12,
                color: '#94a3b8',
                textAlign: 'center',
                margin: 0
              }}>
                {scanStatus === 'streaming' && 'Keep your face centered inside the frame.'}
                {scanStatus === 'scanning' && (faceModalMode === 'register' ? 'Analyzing face snapshot...' : 'Comparing biometric credentials with database...')}
                {scanStatus === 'success' && (faceModalMode === 'register' ? 'Biometric face registered.' : 'Biometric identity validated.')}
                {useSimulatedScan && scanStatus === 'streaming' && 'No camera detected. You can proceed with the simulator.'}
              </p>

              {/* Action Button */}
              {scanStatus === 'streaming' && (
                <button
                  onClick={handleCaptureAndScan}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    borderRadius: 12,
                    background: '#ef4444',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  {faceModalMode === 'register' ? '📸 Capture & Register Face' : '📸 Capture & Verify Identity'}
                </button>
              )}
            </div>

            {/* CSS styles injected dynamically for scanline animation */}
            <style>{`
              @keyframes scanLine {
                0% { top: -10%; }
                50% { top: 100%; }
                100% { top: -10%; }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
