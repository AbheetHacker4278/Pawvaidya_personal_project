import React, { useContext, useState, useEffect, useRef } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle, ArrowRight, ShieldCheck } from "lucide-react";

const Emailverify = () => {
  const { userdata, backendurl, token, loaduserprofiledata, isLoggedin } = useContext(AppContext);
  const navigate = useNavigate();

  // State to hold OTP value
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [isHovered, setIsHovered] = useState(false);
  const otpRefs = useRef([]);

  // Handle OTP input change
  const handleInputChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Focus on the next input if applicable
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  // Handle paste event
  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    const newOtp = paste.split("").concat(Array(6 - paste.length).fill(""));
    setOtp(newOtp);

    // Focus the last filled input or the next empty one
    const nextIndex = Math.min(paste.length, 5);
    otpRefs.current[nextIndex]?.focus();
  };

  // Handle form submission
  const onSubmitHandler = async (e) => {
    if (e) e.preventDefault();
    try {
      const otpString = otp.join('');
      const { data } = await axios.post(backendurl + '/api/user/verify-account', { otp: otpString }, { headers: { token } });
      if (data.success) {
        toast.success(data.message);
        loaduserprofiledata();
        navigate('/');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Redirect if already verified or logged in
  useEffect(() => {
    if (userdata?.isAccountverified) navigate('/');
  }, [isLoggedin, userdata, navigate]);

  const isOtpComplete = otp.every(digit => digit.length === 1);

  // Background blobs animation
  const blobVariants = {
    animate: {
      x: [0, 30, 0],
      y: [0, 50, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="relative min-h-[80vh] flex justify-center items-center overflow-hidden px-4">
      {/* Animated Background Elements */}
      <motion.div
        variants={blobVariants}
        animate="animate"
        className="absolute top-20 left-1/4 w-72 h-72 bg-green-200/30 rounded-full blur-3xl -z-10"
      />
      <motion.div
        variants={blobVariants}
        animate="animate"
        style={{ transitionDelay: "2s" }}
        className="absolute bottom-20 right-1/4 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl -z-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative group box-border"
      >
        {/* Decorative Ring */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-amber-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

        <div className="relative bg-white/80 backdrop-blur-2xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/50 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-300"
            >
              <Mail className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-gray-900 tracking-tight"
            >
              Email Verification
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-500 mt-2 text-center"
            >
              We've sent a 6-digit code to <br />
              <span className="font-semibold text-green-700 underline decoration-green-300/50 underline-offset-4">{userdata?.email}</span>
            </motion.p>
          </div>

          <form onSubmit={onSubmitHandler} className="space-y-8">
            <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handlePaste}>
              {otp.map((_, index) => (
                <motion.input
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index + 0.5 }}
                  type="text"
                  maxLength="1"
                  ref={(el) => (otpRefs.current[index] = el)}
                  value={otp[index]}
                  onChange={(e) => handleInputChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-11 h-14 sm:w-14 sm:h-16 border-2 border-gray-100 rounded-xl text-center text-2xl font-bold bg-gray-50/50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none shadow-sm"
                />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="space-y-4"
            >
              <motion.button
                type="submit"
                disabled={!isOtpComplete}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ scale: isOtpComplete ? 1.02 : 1 }}
                whileTap={{ scale: isOtpComplete ? 0.98 : 1 }}
                className={`group relative overflow-hidden w-full py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-2 ${isOtpComplete
                    ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-green-200"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <span>Verify Account</span>
                  <AnimatePresence>
                    {isOtpComplete && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {isOtpComplete && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                )}
              </motion.button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 uppercase tracking-widest font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Secure SSL Encryption</span>
              </div>
            </motion.div>
          </form>

          {/* Footer Info */}
          <div className="pt-4 text-center">
            <p className="text-sm text-gray-500">
              Didn't receive the code? {" "}
              <button
                type="button"
                className="text-green-600 font-bold hover:text-green-700 transition-colors hover:underline underline-offset-4"
              >
                Resend Code
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Emailverify;
