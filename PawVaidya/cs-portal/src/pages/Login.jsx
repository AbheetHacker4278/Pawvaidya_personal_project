import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { CSContext } from '../context/CSContext';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { FaHeadphones, FaShieldAlt, FaCommentAlt, FaUserCheck, FaEnvelope, FaLock, FaPaw, FaBell, FaUsers, FaEye, FaEyeSlash, FaArrowRight, FaArrowLeft, FaCheckCircle, FaQuestionCircle } from 'react-icons/fa';
import heroImage from '../assets/hero.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSubmitted, setForgotSubmitted] = useState(false);
    const navigate = useNavigate();
    const { backendUrl, setCSToken } = useContext(CSContext);

    // Global viewport mouse tracking for 3D card tilt & parallax
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Tilt transformations (softer for professional CS portal feel)
    const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
    const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

    // Glare position tracking
    const glareX = useTransform(mouseX, [-300, 300], ['0%', '100%']);
    const glareY = useTransform(mouseY, [-300, 300], ['0%', '100%']);

    // Spring animations for fluid transitions
    const springConfig = { damping: 25, stiffness: 150 };
    const rX = useSpring(rotateX, springConfig);
    const rY = useSpring(rotateY, springConfig);

    // Parallax displacements for background elements
    const bgTranslateX1 = useTransform(mouseX, [-300, 300], [-20, 20]);
    const bgTranslateY1 = useTransform(mouseY, [-300, 300], [-20, 20]);
    const bgTranslateX2 = useTransform(mouseX, [-300, 300], [20, -20]);
    const bgTranslateY2 = useTransform(mouseY, [-300, 300], [20, -20]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const x = e.clientX - rect.left - width / 2;
        const y = e.clientY - rect.top - height / 2;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const bypassToken = urlParams.get('bypass-token');
        if (bypassToken) {
            localStorage.setItem('cstoken', bypassToken);
            localStorage.setItem('cs_isBypassed', 'true');
            setCSToken(bypassToken);
            toast.success(`⚡ Bypass success via Admin!`);
            navigate('/customer-360');
        }
    }, [navigate, setCSToken]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post(`${backendUrl}/api/cs/login`, { email, password });
            if (data.success) {
                if (data.needsFaceRegistration || data.needsProfileCompletion) {
                    localStorage.setItem('cs_preToken', data.preToken);
                    localStorage.setItem('cs_empId', data.employeeId);
                    localStorage.setItem('cs_needsFace', data.needsFaceRegistration);
                    localStorage.setItem('cs_needsProfile', data.needsProfileCompletion);
                    toast.info(data.message);
                    navigate('/register');
                } else {
                    localStorage.setItem('cs_preToken', data.preToken);
                    toast.info(data.message);
                    navigate('/face-verify');
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setForgotLoading(true);
        try {
            const { data } = await axios.post(`${backendUrl}/api/cs/forgot-password`, { email: forgotEmail });
            if (data.success) {
                toast.success(data.message);
                setForgotSubmitted(true);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="flex min-h-screen support-mesh-bg overflow-hidden relative items-center justify-center p-4 sm:p-6 lg:p-8"
        >
            {/* Top-Left Brand Logo */}
            <div className="absolute top-8 left-8 flex items-center gap-3 z-20">
                <div className="w-10 h-10 bg-[#2d523e]/40 rounded-xl flex items-center justify-center border border-[#489065]/30">
                    <FaPaw className="text-[#55b37b]" size={20} />
                </div>
                <div>
                    <span className="text-xl font-black tracking-tight text-white block leading-none">PawVaidya</span>
                    <span className="text-[9px] font-bold text-[#489065] tracking-[0.2em] uppercase block mt-1">Support Portal</span>
                </div>
            </div>

            {/* Subtle green ambient blur background layers */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div
                    style={{ x: bgTranslateX1, y: bgTranslateY1 }}
                    className="absolute top-1/4 right-[5%] w-[450px] h-[450px] rounded-full bg-[#489065]/5 blur-[120px]"
                />
                <motion.div
                    style={{ x: bgTranslateX2, y: bgTranslateY2 }}
                    className="absolute bottom-1/4 left-[5%] w-[450px] h-[450px] rounded-full bg-[#489065]/5 blur-[120px]"
                />
            </div>

            {/* Split layout container */}
            <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 z-10 mt-16 lg:mt-0">
                
                {/* Left Side: Mockup Illustration and Features list */}
                <motion.div 
                    initial={{ x: -80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                    className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-8 bg-transparent text-white relative"
                >
                    {/* Header info */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
                            Welcome to <br />
                            PawVaidya <br />
                            <span className="text-[#489065] drop-shadow-[0_0_15px_rgba(72,144,101,0.2)]">Support Portal</span>
                        </h1>
                        <div className="flex items-center justify-center gap-3 my-4">
                            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#489065]/40" />
                            <FaPaw className="text-[#489065]/70" size={14} />
                            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#489065]/40" />
                        </div>
                        <p className="text-white/60 text-xs max-w-xs mx-auto leading-relaxed">
                            Connecting veterinary care, animal welfare alerts, and customer compliance in real-time.
                        </p>
                    </div>

                    {/* Features and Illustration Split Area */}
                    <div className="relative w-full flex items-center justify-center gap-10 mt-6">
                        
                        {/* Features stacked on the left of illustration */}
                        <div className="flex flex-col gap-4 z-10 w-64">
                            {/* Secure Card */}
                            <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 p-4 rounded-2xl flex items-start gap-3 shadow-lg hover:bg-white/[0.04] transition-all duration-300">
                                <div className="p-2 bg-[#2d523e]/20 border border-[#489065]/30 rounded-xl text-[#489065] shrink-0">
                                    <FaShieldAlt size={16} />
                                </div>
                                <div>
                                    <h3 className="text-white text-xs font-bold">Secure</h3>
                                    <p className="text-white/40 text-[10px] mt-0.5 leading-normal">Your data is safe with enterprise grade security.</p>
                                </div>
                            </div>

                            {/* Real-time Alerts Card */}
                            <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 p-4 rounded-2xl flex items-start gap-3 shadow-lg hover:bg-white/[0.04] transition-all duration-300">
                                <div className="p-2 bg-[#2d523e]/20 border border-[#489065]/30 rounded-xl text-[#489065] shrink-0">
                                    <FaBell size={16} />
                                </div>
                                <div>
                                    <h3 className="text-white text-xs font-bold">Real-time Alerts</h3>
                                    <p className="text-white/40 text-[10px] mt-0.5 leading-normal">Stay updated on animal welfare and compliance.</p>
                                </div>
                            </div>

                            {/* Customer Focused Card */}
                            <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 p-4 rounded-2xl flex items-start gap-3 shadow-lg hover:bg-white/[0.04] transition-all duration-300">
                                <div className="p-2 bg-[#2d523e]/20 border border-[#489065]/30 rounded-xl text-[#489065] shrink-0">
                                    <FaUsers size={16} />
                                </div>
                                <div>
                                    <h3 className="text-white text-xs font-bold">Customer Focused</h3>
                                    <p className="text-white/40 text-[10px] mt-0.5 leading-normal">Better support for better care.</p>
                                </div>
                            </div>
                        </div>

                        {/* Central Target Radar Base Circle Glow with 3D Image */}
                        <div className="relative flex items-center justify-center w-72 h-72">
                            {/* Target circles */}
                            <div className="absolute w-[240px] h-[240px] rounded-full border border-[#489065]/10 bg-gradient-to-b from-[#489065]/5 to-transparent blur-sm -bottom-6" />
                            <div className="absolute w-[180px] h-[180px] rounded-full border border-[#489065]/20 -bottom-2 animate-pulse" />
                            <div className="absolute w-[110px] h-[110px] rounded-full border border-[#489065]/30 bottom-6" />

                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="relative z-10 w-full"
                            >
                                <img 
                                    src={heroImage} 
                                    alt="CS Illustration" 
                                    className="w-full h-auto drop-shadow-[0_20px_50px_rgba(72,144,101,0.25)] select-none pointer-events-none" 
                                />
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: 3D interactive login card */}
                <div className="w-full lg:w-1/2 flex justify-center items-center">
                    <motion.div
                        style={{
                            rotateX: rX,
                            rotateY: rY,
                            transformStyle: "preserve-3d",
                        }}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                        className="w-full max-w-md bg-[#0d1216]/90 backdrop-blur-2xl rounded-[32px] p-8 sm:p-10 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden preserve-3d"
                    >
                        {/* Dynamic Glare Reflection overlay */}
                        <motion.div
                            style={{
                                background: `radial-gradient(circle 120px at ${glareX} ${glareY}, rgba(255,255,255,0.05), transparent)`,
                            }}
                            className="absolute inset-0 z-10 pointer-events-none"
                        />

                        {/* Top Badge Headset Icon */}
                        <div style={{ transform: "translateZ(30px)" }} className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-[#2d523e]/20 border border-[#489065]/40 rounded-full flex items-center justify-center text-[#55b37b] shadow-lg shadow-[#489065]/10">
                                {isForgotPassword ? <FaQuestionCircle size={26} /> : <FaHeadphones size={26} />}
                            </div>
                        </div>

                        {/* Title block */}
                        <div style={{ transform: "translateZ(30px)" }} className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white tracking-tight leading-none">
                                {isForgotPassword ? (forgotSubmitted ? "Request Logged!" : "Reset Password") : "Welcome Back!"}
                            </h2>
                            <p className="text-white/40 text-[9px] mt-2.5 uppercase tracking-widest font-black">
                                {isForgotPassword ? "Agent Verification" : "Employee Command Center"}
                            </p>
                        </div>

                        {/* Form / Content */}
                        {!isForgotPassword ? (
                            <form className="space-y-6 relative z-20" onSubmit={handleLogin}>
                                {/* Email Address */}
                                <div style={{ transform: "translateZ(20px)" }} className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/50">Email Address</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                                            <FaEnvelope size={14} />
                                        </span>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your registered email"
                                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-white/5 bg-white/[0.02] text-white placeholder-white/20 focus:border-[#489065]/50 focus:ring-1 focus:ring-[#489065]/35 outline-none transition-all duration-300 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div style={{ transform: "translateZ(20px)" }} className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/50">Password</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                                            <FaLock size={14} />
                                        </span>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-12 py-4 rounded-xl border border-white/5 bg-white/[0.02] text-white placeholder-white/20 focus:border-[#489065]/50 focus:ring-1 focus:ring-[#489065]/35 outline-none transition-all duration-300 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                        >
                                            {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Remember me & Forgot Password */}
                                <div style={{ transform: "translateZ(20px)" }} className="flex items-center justify-between text-xs pt-1">
                                    <label className="flex items-center gap-2 text-white/50 cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#489065] focus:ring-0 accent-[#489065] cursor-pointer" 
                                        />
                                        <span>Remember me</span>
                                    </label>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setIsForgotPassword(true);
                                            setForgotSubmitted(false);
                                            setForgotEmail(email);
                                        }}
                                        className="text-[#489065] hover:text-[#55b37b] font-semibold transition-colors bg-transparent border-none p-0 cursor-pointer"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>

                                {/* Action Button */}
                                <div style={{ transform: "translateZ(30px)" }} className="pt-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02, translateZ: "30px" }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={loading}
                                        className="w-full relative overflow-hidden bg-[#2d523e] hover:bg-[#38674d] text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-[#2d523e]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 border border-[#489065]/20"
                                    >
                                        <span>{loading ? 'Authorizing...' : 'Sign In'}</span>
                                        <FaArrowRight size={14} className="mt-0.5" />
                                    </motion.button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6 relative z-20">
                                {!forgotSubmitted ? (
                                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                                        <p className="text-white/50 text-xs leading-relaxed text-center">
                                            Please provide your registered email. An administrator will verify your credentials and dispatch your reset configuration.
                                        </p>
                                        <div style={{ transform: "translateZ(20px)" }} className="space-y-2">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-white/50">Email Address</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                                                    <FaEnvelope size={14} />
                                                </span>
                                                <input
                                                    type="email"
                                                    required
                                                    value={forgotEmail}
                                                    onChange={(e) => setForgotEmail(e.target.value)}
                                                    placeholder="Enter your registered email"
                                                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-white/5 bg-white/[0.02] text-white placeholder-white/20 focus:border-[#489065]/50 focus:ring-1 focus:ring-[#489065]/35 outline-none transition-all duration-300 text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div style={{ transform: "translateZ(30px)" }} className="pt-2">
                                            <motion.button
                                                whileHover={{ scale: 1.02, translateZ: "30px" }}
                                                whileTap={{ scale: 0.98 }}
                                                type="submit"
                                                disabled={forgotLoading}
                                                className="w-full relative overflow-hidden bg-[#2d523e] hover:bg-[#38674d] text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-[#2d523e]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 border border-[#489065]/20"
                                            >
                                                <span>{forgotLoading ? 'Logging request...' : 'Log Reset Request'}</span>
                                                <FaArrowRight size={14} className="mt-0.5" />
                                            </motion.button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="text-center space-y-4 py-4">
                                        <div className="flex justify-center text-emerald-500">
                                            <FaCheckCircle size={48} className="animate-bounce" />
                                        </div>
                                        <p className="text-white text-sm font-bold">Request Pending Authorization</p>
                                        <p className="text-white/50 text-xs leading-relaxed max-w-xs mx-auto">
                                            Your reset token has been registered in the system registry. Please contact your system administrator to assign your new access credentials.
                                        </p>
                                    </div>
                                )}

                                <div style={{ transform: "translateZ(20px)" }} className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsForgotPassword(false)}
                                        className="text-[#489065] hover:text-[#55b37b] text-xs font-semibold flex items-center justify-center gap-2 mx-auto bg-transparent border-none cursor-pointer"
                                    >
                                        <FaArrowLeft size={10} />
                                        <span>Back to Login</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Footer lock block */}
                        <div 
                            style={{ transform: "translateZ(10px)" }}
                            className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-white/30 text-[10px] uppercase tracking-wider font-bold"
                        >
                            <FaLock size={10} />
                            <span>Protected by PawVaidya Security</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Matte dark background and utility styling definitions */}
            <style>{`
                .preserve-3d {
                    transform-style: preserve-3d;
                }

                .support-mesh-bg {
                    background: radial-gradient(circle at 10% 20%, rgba(72, 144, 101, 0.04) 0%, transparent 45%),
                                radial-gradient(circle at 90% 80%, rgba(72, 144, 101, 0.04) 0%, transparent 45%),
                                #090c0f;
                }
            `}</style>
        </div>
    );
};

export default Login;
