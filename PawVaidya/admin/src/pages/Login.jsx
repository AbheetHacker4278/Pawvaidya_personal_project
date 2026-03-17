import React, { useContext, useState } from 'react';
import assets from '../assets/assets_admin/assets';
import { MailIcon, LockIcon } from 'lucide-react';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/DoctorContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FaceAuth from '../components/FaceAuth';

function App() {
  const [state, setState] = useState('Admin');
  const [email, setemail] = useState('');
  const [password, setpassword] = useState('');
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [secretCode, setSecretCode] = useState('');

  const backendurl = import.meta.env.VITE_BACKEND_URL

  const { verifyAdminOTP, setatoken } = useContext(AdminContext);
  const { setdtoken } = useContext(DoctorContext);

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(90);
  const [pendingEmail, setPendingEmail] = useState('');

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    try {
      if (state === 'Admin') {
        const { data } = await axios.post(`${backendurl}/api/admin/login`, { email, password, secretCode });
        if (data.success) {
          if (data.requiresOTP) {
            setIsOtpSent(true);
            setPendingEmail(email);
            setTimer(90);
            toast.success(data.message);
          } else {
            // Fallback if OTP is somehow disabled on backend
            localStorage.setItem('atoken', data.token);
            setatoken(data.token);
            toast.success(data.message || 'Login successful!');
          }
        } else {
          if (data.pendingApproval) {
            toast.info(data.message, { autoClose: 10000 });
          } else {
            toast.error(data.message || 'Admin login failed!');
          }
        }
      } else {
        const { data } = await axios.post(`${backendurl}/api/doctor/login`, { email, password });
        if (data.success) {
          localStorage.setItem('dtoken', data.token);
          setdtoken(data.token);
          toast.success(data.message || 'Login successful!');
        } else {
          toast.error(data.message || 'Doctor login failed!');
        }
      }
    } catch (error) {
      toast.error('Something went wrong!');
      console.error(error);
    }
  };

  const onVerifyOtpHandler = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return toast.error("Please enter a 6-digit OTP");
    }

    const success = await verifyAdminOTP(pendingEmail, otp, showFaceAuth ? 'Face' : 'Email');
    if (success) {
      setIsOtpSent(false);
      setOtp('');
    }
  };

  React.useEffect(() => {
    let interval = null;
    if (isOtpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsOtpSent(false);
      toast.error("Security code expired. Please login again.");
    }
    return () => clearInterval(interval);
  }, [isOtpSent, timer]);

  const requestLocationPermission = () => {
    if ("geolocation" in navigator) {
      // Add auto-refresh listener if user changes permission in browser settings
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(result => {
          result.onchange = () => {
            if (result.state === 'granted') {
              window.location.reload();
            }
          };
        }).catch(console.error);
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationGranted(true);
          setLocationError('');
        },
        (error) => {
          setLocationGranted(false);
          let errorMessage = "Location permission is required to access the admin panel.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "You denied the request for Geolocation. Please enable it in your browser settings and try again.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "The request to get user location timed out.";
              break;
          }
          setLocationError(errorMessage);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  };

  React.useEffect(() => {
    if (state === 'Admin') {
      requestLocationPermission();
    } else {
      // Location not strictly required for Doctor login based on prompt, but keeping it blocked just for Admin
      setLocationGranted(true);
    }
  }, [state]);

  return (
    <div className="flex min-h-screen">
      {/* Left Section - Logo and Illustration */}
      <div className="hidden lg:block lg:w-3/5 bg-[#f8e7d3] relative">
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center">
            <img className="w-44 cursor-pointer" src="https://i.ibb.co/R2Y4vBk/Screenshot-2024-11-23-000108-removebg-preview.png" alt="" />
          </div>
        </div>
        <div className="h-full flex items-center justify-center">
          <img
            src="https://i.ibb.co/N2dwZpC/1fc8fd8a-8ea8-4383-9bb0-3cf75b23cdc4-removebg-preview-1.png"
            alt="Vet with Pets Silhouette"
            className="w-3/5 object-contain"
          />
        </div>
        <div className="absolute bottom-0 w-full h-32 bg-[#97c7b7] rounded-t-[100px]" />
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-2/5 bg-[#97c7b7] p-8 flex flex-col justify-center relative">
        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-2">Welcome Back</h2>
            <h3 className="text-3xl font-semibold text-[#f8e7d3] mb-1">to</h3>
            <h1 className="text-4xl font-bold text-white mb-4">PawVaidya</h1>
            <p className="text-[#f8e7d3]">Access expert advice for your furry friends</p>
          </div>

          {!locationGranted && state === 'Admin' ? (
            <div className="mt-8 space-y-6 text-center bg-white/10 p-6 rounded-xl border border-white/20">
              <h3 className="text-xl font-bold text-white mb-2">Location Required</h3>
              <p className="text-white/80 text-sm mb-4">
                {locationError || "To ensure the security of the admin panel, we require access to your location before allowing login."}
              </p>
              <button
                onClick={() => {
                  if (locationError.includes("denied")) {
                    window.location.reload();
                  } else {
                    requestLocationPermission();
                  }
                }}
                className="w-full py-3 px-4 bg-white text-[#97c7b7] rounded-lg font-semibold hover:bg-[#f8e7d3] transition duration-200"
              >
                {locationError.includes("denied") ? "Reload Page After Granting" : "Grant Location Permission"}
              </button>
              <div className="mt-4 text-center text-white text-sm">
                Doctor Login?{' '}
                <button type="button" onClick={() => setState('Doctor')} className="underline hover:text-[#f8e7d3]">
                  Click here
                </button>
              </div>
            </div>
          ) : !isOtpSent ? (
            <form onSubmit={onSubmitHandler} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <MailIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    onChange={(e) => setemail(e.target.value)}
                    value={email}
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/90 border border-transparent focus:border-white focus:ring-2 focus:ring-white/30 focus:outline-none"
                    placeholder="Your email or username"
                  />
                </div>

                <div className="relative">
                  <LockIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    onChange={(e) => setpassword(e.target.value)}
                    value={password}
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/90 border border-transparent focus:border-white focus:ring-2 focus:ring-white/30 focus:outline-none"
                    placeholder="Password"
                  />
                </div>

                {state === 'Admin' && (
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input
                      onChange={(e) => setSecretCode(e.target.value)}
                      value={secretCode}
                      type="text"
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/90 border border-transparent focus:border-white focus:ring-2 focus:ring-white/30 focus:outline-none"
                      placeholder="Secret Code (Optional)"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded border-gray-300 text-[#97c7b7] focus:ring-[#97c7b7]"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-white">
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-white text-[#97c7b7] rounded-lg font-semibold hover:bg-[#f8e7d3] transition duration-200"
              >
                Login as {state}
              </button>

              {state === 'Admin' && (
                <button
                  type="button"
                  onClick={() => setShowFaceAuth(true)}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-200 flex items-center justify-center gap-2"
                >
                  📷 Login with Face
                </button>
              )}

              <div className="text-center text-white">
                {state === 'Admin' ? (
                  <p>
                    Doctor Login?{' '}
                    <button
                      type="button"
                      onClick={() => setState('Doctor')}
                      className="underline hover:text-[#f8e7d3]"
                    >
                      Click here
                    </button>
                  </p>
                ) : (
                  <p>
                    Admin Login?{' '}
                    <button
                      type="button"
                      onClick={() => setState('Admin')}
                      className="underline hover:text-[#f8e7d3]"
                    >
                      Click here
                    </button>
                  </p>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={onVerifyOtpHandler} className="mt-8 space-y-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center flex-col items-center gap-2">
                  <div className="bg-white/20 p-4 rounded-full">
                    <MailIcon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white uppercase tracking-wider">Verification Code</h4>
                  <p className="text-white/80 text-sm">Sent to {pendingEmail}</p>
                </div>

                <div className="relative pt-4">
                  <input
                    onChange={(e) => setOtp(e.target.value)}
                    value={otp}
                    type="text"
                    maxLength="6"
                    required
                    autoFocus
                    className="w-full text-center text-3xl font-bold tracking-[1em] py-4 rounded-xl bg-white/90 border-2 border-transparent focus:border-white focus:outline-none"
                    placeholder="000000"
                  />
                </div>

                <div className="flex justify-between items-center text-white text-sm font-medium">
                  <span>Expires in: <span className={timer < 11 ? 'text-red-500 animate-pulse' : 'text-[#f8e7d3]'}>{timer}s</span></span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtpSent(false);
                      setOtp('');
                    }}
                    className="underline hover:text-[#f8e7d3]"
                  >
                    Back to Login
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 px-4 bg-white text-[#97c7b7] rounded-xl font-bold text-lg hover:bg-[#f8e7d3] transition duration-200 shadow-lg"
                >
                  VERIFY & LOGIN
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {showFaceAuth && (
        <FaceAuth
          mode="login"
          onAuthSuccess={(data) => {
            if (data.requiresOTP) {
              setPendingEmail(data.email);
              setIsOtpSent(true);
              setTimer(90);
              setShowFaceAuth(false);
              toast.success(data.message);
            } else {
              localStorage.setItem('atoken', data.token);
              setatoken(data.token);
              setShowFaceAuth(false);
              toast.success("Face Login Successful!");
            }
          }}
          onCancel={() => setShowFaceAuth(false)}
        />
      )}
    </div>
  );
}

export default App;
