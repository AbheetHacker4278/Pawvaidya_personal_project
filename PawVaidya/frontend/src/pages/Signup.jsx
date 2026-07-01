import React, { useContext, useState } from "react";
import FormInput from "../components/FormInput";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import image from "../assets/New/image.png";
import { User, Mail, Lock, MapPin, Building, Gift, Heart, Sparkles, Activity, Plus } from 'lucide-react';
import SocialAuthModal from "../components/SocialAuthModal";
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

const Signup = () => {
  const { backendurl, token, settoken, setisLoggedin } = useContext(AppContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    state: "",
    district: "",
    referralCode: "",
    terms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialProvider, setSocialProvider] = useState('google');

  const handleSocialClick = (provider) => {
    setSocialProvider(provider);
    setSocialModalOpen(true);
  };

  const handleSocialAuthSuccess = (data) => {
    localStorage.setItem('token', data.token);
    settoken(data.token);
    setisLoggedin(true);
    navigate('/');
  };

  const allowedStates = ["NEW DELHI", "GUJARAT", "HARYANA", "MUMBAI"];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    const { name, email, password, state, district, referralCode, terms } = formData;

    if (!terms) {
      toast.error("You must accept the terms and conditions");
      return;
    }

    // Validate state
    if (!allowedStates.includes(state.toUpperCase())) {
      toast.error(
        "State must be one of: NEW DELHI, GUJARAT, HARYANA, or MUMBAI."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendurl + "/api/user/register", {
        name,
        password,
        email,
        state,
        district,
        referralCode,
      });
      if (data.success) {
        setisLoggedin(true);
        localStorage.setItem("token", data.token);
        settoken(data.token);
        toast.success("Registration successful!");
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred during registration.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Global Parallax & 3D Tilt Setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for cursor position tracking
  const springX = useSpring(mouseX, { damping: 30, stiffness: 120 });
  const springY = useSpring(mouseY, { damping: 30, stiffness: 120 });

  // Map coordinates to card rotations
  const rotateX = useTransform(springY, [-400, 400], [12, -12]);
  const rotateY = useTransform(springX, [-400, 400], [-12, 12]);

  // Card glare overlay translations
  const glareX = useTransform(springX, [-400, 400], [0, 100]);
  const glareY = useTransform(springY, [-400, 400], [0, 100]);
  const glareOpacity = useTransform(springX, (val) => val === 0 ? 0 : 0.35);

  // Background parallax movement mapping
  const bgTranslateX1 = useTransform(springX, [-400, 400], [-25, 25]);
  const bgTranslateY1 = useTransform(springY, [-400, 400], [-25, 25]);

  const bgTranslateX2 = useTransform(springX, [-400, 400], [35, -35]);
  const bgTranslateY2 = useTransform(springY, [-400, 400], [35, -35]);

  const bgTranslateX3 = useTransform(springX, [-400, 400], [-15, 15]);
  const bgTranslateY3 = useTransform(springY, [-400, 400], [15, -15]);

  const handleMouseMove = (e) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const offsetX = e.clientX - width / 2;
    const offsetY = e.clientY - height / 2;
    mouseX.set(offsetX);
    mouseY.set(offsetY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Card entrance variants
  const cardVariants = {
    hidden: { opacity: 0, rotateY: -30, scale: 0.95, y: 40 },
    visible: {
      opacity: 1,
      rotateY: 0,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 90,
        damping: 18,
        duration: 0.8
      }
    }
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="flex min-h-screen animated-mesh-bg overflow-hidden relative"
    >
      
      {/* 3D Background Floating Shapes & Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        
        {/* Soft Background Blur Blobs */}
        <motion.div
          style={{
            x: bgTranslateX1,
            y: bgTranslateY1,
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-12 left-1/4 w-72 h-72 rounded-full bg-gradient-to-br from-[#E6D7B9]/30 to-[#D5C29D]/30 blur-2xl"
        />
        <motion.div
          style={{
            x: bgTranslateX2,
            y: bgTranslateY2,
          }}
          animate={{
            rotate: [360, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-24 right-1/4 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-[#F2E4C6]/40 to-[#E8D5B5]/40 blur-3xl"
        />
        <motion.div
          style={{
            x: bgTranslateX3,
            y: bgTranslateY3,
          }}
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 right-10 w-44 h-44 rounded-full bg-gradient-to-br from-[#EAD7B3]/25 to-[#E3CFA8]/25 blur-xl"
        />

        {/* Floating Glassmorphic Icon 1 - Sparkles */}
        <motion.div
          style={{
            x: bgTranslateX1,
            y: bgTranslateY1,
          }}
          animate={{
            rotate: [0, 360],
            y: [0, -15, 0],
          }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute top-1/4 right-[15%] p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/35 shadow-lg text-[#aa771c]/45 z-0 pointer-events-none hidden sm:block"
        >
          <Sparkles size={32} />
        </motion.div>

        {/* Floating Glassmorphic Icon 2 - Heart */}
        <motion.div
          style={{
            x: bgTranslateX2,
            y: bgTranslateY2,
          }}
          animate={{
            scale: [1, 1.1, 1],
            y: [0, 15, 0],
          }}
          transition={{
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 8, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute top-1/3 left-[8%] p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/35 shadow-lg text-[#aa771c]/45 z-0 pointer-events-none hidden sm:block"
        >
          <Heart size={32} />
        </motion.div>

        {/* Floating Glassmorphic Icon 3 - Plus */}
        <motion.div
          style={{
            x: bgTranslateX3,
            y: bgTranslateY3,
          }}
          animate={{
            rotate: [0, -360],
            y: [0, -20, 0],
          }}
          transition={{
            rotate: { duration: 30, repeat: Infinity, ease: "linear" },
            y: { duration: 7, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute bottom-1/4 left-[15%] p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/35 shadow-lg text-[#aa771c]/35 z-0 pointer-events-none hidden sm:block"
        >
          <Plus size={32} />
        </motion.div>

        {/* Floating Glassmorphic Icon 4 - Activity */}
        <motion.div
          style={{
            x: bgTranslateX1,
            y: bgTranslateY2,
          }}
          animate={{
            y: [0, 20, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-1/3 right-[8%] p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/35 shadow-lg text-[#aa771c]/40 z-0 pointer-events-none hidden sm:block"
        >
          <Activity size={32} />
        </motion.div>
      </div>

      {/* Logo - Floating spring entrance */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 120 }}
        className="absolute top-4 left-4 w-24 sm:w-32 z-50"
      >
        <img
          src={image}
          alt="Logo"
          className="w-full h-auto rounded-2xl shadow-lg hover:scale-105 hover:shadow-emerald-500/10 cursor-pointer transition-all duration-300"
          onClick={() => navigate('/')}
        />
      </motion.div>

      {/* Left side - Image with slide-in animation & floating drift */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.1 }}
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-transparent relative overflow-hidden"
      >
        {/* Floating gradient circles inside the left side */}
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-sm"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -10, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-sm"
        />

        <motion.div
          whileHover={{ scale: 1.03, rotate: -0.5 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="relative z-10 w-full max-w-xl"
        >
          <img
            src="https://i.ibb.co/N2dwZpC/1fc8fd8a-8ea8-4383-9bb0-3cf75b23cdc4-removebg-preview-1.png"
            alt="Veterinary Care"
            className="w-full h-auto rounded-3xl drop-shadow-[0_20px_35px_rgba(0,0,0,0.15)]"
          />
        </motion.div>
      </motion.div>

      {/* Right side - Form with glassmorphic 3D Card */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-transparent z-10">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX: rotateX,
            rotateY: rotateY,
            transformStyle: "preserve-3d",
          }}
          className="w-full max-w-md bg-white/55 backdrop-blur-xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] p-8 border border-white/60 relative overflow-hidden preserve-3d"
        >
          {/* Glare/shine overlay */}
          <motion.div
            style={{
              x: useTransform(glareX, (xVal) => `${xVal}%`),
              y: useTransform(glareY, (yVal) => `${yVal}%`),
              opacity: glareOpacity,
            }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full blur-[80px] bg-white/50 mix-blend-overlay"
          />

          {/* Header with 3D Pop */}
          <div 
            style={{ transform: "translateZ(35px)" }} 
            className="space-y-1 mb-6 bg-transparent"
          >
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#2c5b40] via-[#489065] to-[#2e5b40] bg-clip-text text-transparent animate-gradient">
              Welcome to PawVaidya!
            </h1>
            <p className="text-gray-600 font-medium">
              Access expert advice for your furry friends
            </p>
          </div>

          {/* Form with 3D Elements */}
          <form onSubmit={onSubmitHandler} className="space-y-4 bg-transparent">
            
            {/* Name Field */}
            <div style={{ transform: "translateZ(25px)" }}>
              <FormInput
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                icon={<User size={20} />}
              />
            </div>

            {/* Email Field */}
            <div style={{ transform: "translateZ(25px)" }}>
              <FormInput
                type="email"
                name="email"
                placeholder="Your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                icon={<Mail size={20} />}
              />
            </div>

            {/* Password Field */}
            <div style={{ transform: "translateZ(25px)" }}>
              <FormInput
                type="password"
                name="password"
                placeholder="Password (min. 8 characters)"
                value={formData.password}
                onChange={handleInputChange}
                required
                icon={<Lock size={20} />}
              />
            </div>

            {/* State & District Grid */}
            <div style={{ transform: "translateZ(25px)" }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                type="text"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleInputChange}
                required
                icon={<MapPin size={20} />}
              />
              <FormInput
                type="text"
                name="district"
                placeholder="District"
                value={formData.district}
                onChange={handleInputChange}
                required
                icon={<Building size={20} />}
              />
            </div>

            {/* Referral Code Field */}
            <div style={{ transform: "translateZ(20px)" }}>
              <FormInput
                type="text"
                name="referralCode"
                placeholder="Referral Paw Code (Optional)"
                value={formData.referralCode}
                onChange={handleInputChange}
                icon={<Gift size={20} />}
              />
            </div>

            {/* Terms checkbox */}
            <div 
              style={{ transform: "translateZ(15px)" }} 
              className="flex items-center gap-2 bg-transparent cursor-pointer"
            >
              <input
                type="checkbox"
                name="terms"
                id="terms"
                checked={formData.terms}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-gray-300 text-[#489065] focus:ring-[#489065]/35 cursor-pointer transition-transform duration-200 hover:scale-110"
              />
              <label htmlFor="terms" className="text-sm font-semibold text-gray-600 bg-transparent cursor-pointer hover:text-gray-800 transition-colors duration-200">
                I agree to the terms and conditions
              </label>
            </div>

            {/* Submit Button */}
            <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
              <motion.button
                whileHover={{ scale: 1.025, translateZ: "35px" }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full relative overflow-hidden bg-gradient-to-r from-[#489065] via-[#3a7551] to-[#2e5b40] text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:shadow-emerald-900/10 active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2 bg-transparent">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span className="text-xl bg-transparent ml-2">🦥</span>
                  </>
                )}
                {/* Sweep shimmer reflection */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:animate-shimmer-sweep" />
              </motion.button>
            </div>

            {/* Social Logins */}
            <div style={{ transform: "translateZ(25px)" }}>
              <motion.button
                whileHover={{ scale: 1.02, translateZ: "25px" }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleSocialClick('google')}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-bold text-sm border border-gray-300/80 hover:bg-gray-50/50 transition-all duration-300 shadow-sm bg-white/75 text-gray-700 backdrop-blur-sm"
              >
                <svg className="w-5 h-5 bg-transparent" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Sign up with Google</span>
              </motion.button>
            </div>

            {/* Separator line */}
            <div style={{ transform: "translateZ(15px)" }} className="flex items-center bg-transparent">
              <hr className="flex-grow border-t border-gray-300" />
              <span className="mx-3 text-gray-500 font-bold text-xs bg-transparent uppercase tracking-wider">or</span>
              <hr className="flex-grow border-t border-gray-300" />
            </div>

            {/* Navigation back to login-form */}
            <div style={{ transform: "translateZ(20px)" }} className="text-center bg-transparent">
              <p className="text-sm font-semibold text-gray-600 bg-transparent">
                Already have an account?{" "}
                <span
                  onClick={() => navigate("/login-form")}
                  className="text-[#489065] font-bold hover:text-[#2c5b40] cursor-pointer transition-all duration-200 hover:scale-105 inline-block"
                >
                  Login
                </span>
              </p>
            </div>
          </form>

          <SocialAuthModal
            isOpen={socialModalOpen}
            onClose={() => setSocialModalOpen(false)}
            provider={socialProvider}
            backendurl={backendurl}
            onAuthSuccess={handleSocialAuthSuccess}
          />
        </motion.div>
      </div>

      {/* Self-contained CSS Styles for Mesh background and shimmers */}
      <style>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }

        .animated-mesh-bg {
          background: linear-gradient(-45deg, #F2E4C6, #E6D7B9, #EAD7B3, #E3CFA8, #F2E4C6);
          background-size: 400% 400%;
          animation: meshGradient 20s ease infinite;
        }

        @keyframes meshGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes gradient {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        
        .animate-gradient {
          animation: gradient 4s ease infinite;
        }

        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .hover\\:animate-shimmer-sweep:hover::after,
        button:hover .hover\\:animate-shimmer-sweep,
        button:hover div {
          animation: shimmer-sweep 1.6s ease-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Signup;
