import React, { useContext, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import FormInput from "../components/FormInput";
import image from '../assets/New/image.png';
import { Mail, Lock, KeyRound } from 'lucide-react';

const ResetPassword = () => {
  const { backendurl } = useContext(AppContext)
  axios.defaults.withCredentials = true
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleInput = (e, index) => {
    const { value } = e.target;
    if (value.length > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
    if (value.length > 1) {
      e.target.value = value[0];
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, 6);
    pasteData.split("").forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char;
      }
    });
    setOtp(pasteData);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) {
      return toast.error("Please enter a valid email address.");
    }
    setIsLoading(true);
    try {
      const { data } = await axios.post(backendurl + '/api/user/send-reset-otp', { email });
      if (data.success) {
        toast.success(data.message);
        setIsEmailSent(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error.response || error.message);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };


  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpArray = inputRefs.current.map(e => e.value);
    const otpValue = otpArray.join('');
    setOtp(otpValue);
    setIsOtpSubmitted(true);
    toast.success('Otp Verified Successfully')
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await axios.post(backendurl + '/api/user/reset-password', { email, otp, password })
      if (data.success) {
        toast.success(data.message);
        navigate('/login-form');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F2E4C6] overflow-hidden relative">
      {/* Logo */}
      <div className={`absolute top-4 left-4 w-24 sm:w-32 z-50 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
        <img
          src={image}
          alt="Logo"
          className="w-full h-auto rounded-2xl shadow-lg hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Left side - Image */}
      <div className={`hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-gradient-to-br from-[#A8D5BA] to-[#8FC1A3] transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
        <div className="relative w-full max-w-xl">
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '700ms' }}></div>
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '500ms' }}></div>

          <img
            src="https://i.ibb.co/N2dwZpC/1fc8fd8a-8ea8-4383-9bb0-3cf75b23cdc4-removebg-preview-1.png"
            alt="Veterinary Care"
            className="relative z-10 w-full h-auto rounded-3xl transform hover:scale-105 transition-transform duration-500 drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Right side - Forms */}
      <div className={`w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-[#F2E4C6] transform transition-all duration-1000 delay-200 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/50">

          {/* Header */}
          <div className={`space-y-2 mb-8 bg-transparent transform transition-all duration-700 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#489065] to-[#2e5b40] bg-clip-text text-transparent animate-gradient">
              {!isEmailSent ? 'Reset Password' : !isOtpSubmitted ? 'Enter OTP' : 'New Password'}
            </h1>
            <p className="text-gray-600 bg-transparent">
              {!isEmailSent ? 'Enter your email to receive a reset code' : !isOtpSubmitted ? 'Enter the 6-digit code sent to your email' : 'Create a strong new password'}
            </p>
          </div>

          {/* Email Form */}
          {!isEmailSent && (
            <form onSubmit={handleEmailSubmit} className="space-y-5 bg-transparent">
              <div className="transform transition-all duration-500 delay-500">
                <FormInput
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail size={20} />}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#489065] to-[#2e5b40] text-white py-4 rounded-xl font-semibold hover:from-[#2e5b40] hover:to-[#489065] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* OTP Form */}
          {isEmailSent && !isOtpSubmitted && (
            <form onSubmit={handleOtpSubmit} className="space-y-5 bg-transparent">
              <div className="flex justify-between mb-8 gap-2">
                {Array(6).fill(0).map((_, index) => (
                  <input
                    type="text"
                    maxLength="1"
                    key={index}
                    required
                    className="w-12 h-12 bg-white text-gray-800 text-center text-xl rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-[#489065] focus:border-transparent outline-none transition-all duration-300"
                    ref={(e) => (inputRefs.current[index] = e)}
                    onInput={(e) => handleInput(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                  />
                ))}
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#489065] to-[#2e5b40] text-white py-4 rounded-xl font-semibold hover:from-[#2e5b40] hover:to-[#489065] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                Verify OTP
              </button>
            </form>
          )}

          {/* Password Form */}
          {isEmailSent && isOtpSubmitted && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5 bg-transparent">
              <div className="transform transition-all duration-500 delay-500">
                <FormInput
                  type="password"
                  name="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock size={20} />}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#489065] to-[#2e5b40] text-white py-4 rounded-xl font-semibold hover:from-[#2e5b40] hover:to-[#489065] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login-form')}
              className="text-sm text-gray-600 hover:text-[#489065] transition-colors duration-200"
            >
              Back to Login
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-size: 200% 200%; background-position: left center; }
          50% { background-size: 200% 200%; background-position: right center; }
        }
        .animate-gradient { animation: gradient 3s ease infinite; }
      `}</style>
    </div>
  );
};

export default ResetPassword;
