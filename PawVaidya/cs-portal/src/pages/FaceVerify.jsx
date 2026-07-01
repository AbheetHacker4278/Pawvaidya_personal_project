import React, { useContext, useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { CSContext } from '../context/CSContext';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { FaShieldAlt, FaLock, FaPaw, FaEye, FaEyeSlash, FaArrowRight, FaVideo, FaUserShield } from 'react-icons/fa';

/* global faceapi */

const FaceVerify = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('initializing'); // initializing, ready, scanning, success, fail, error
    const [statusMsg, setStatusMsg] = useState('Loading AI models...');
    const [errorMsg, setErrorMsg] = useState('');
    const [hasFace, setHasFace] = useState(false);
    const navigate = useNavigate();
    const { backendUrl, setCSToken } = useContext(CSContext);
    
    const videoRef = useRef(null);

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

    // Camera and AI initialization
    useEffect(() => {
        let active = true;
        let detectionInterval = null;

        const initAIAndCamera = async () => {
            try {
                setStatus('initializing');
                setStatusMsg('Initializing AI models...');
                
                if (window.tf) await window.tf.ready();

                const MODEL_URL = '/models';
                await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                
                if (!active) return;

                // Start webcam stream
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 640, height: 480, facingMode: 'user' } 
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                
                setStatus('ready');
                setStatusMsg('Ready to verify. Align your face.');

                // Active loop to check if a face is in focus and show the pill badge
                detectionInterval = setInterval(async () => {
                    if (videoRef.current && videoRef.current.readyState === 4 && status !== 'scanning' && status !== 'success') {
                        try {
                            const detection = await faceapi.detectSingleFace(videoRef.current);
                            if (active) {
                                if (detection) {
                                    setHasFace(true);
                                    setStatusMsg("Face detected. You're good to go!");
                                } else {
                                    setHasFace(false);
                                    setStatusMsg("Position your face in the frame.");
                                }
                            }
                        } catch (err) {
                            // Suppress feed read errors
                        }
                    }
                }, 800);

            } catch (err) {
                console.error("AI/Camera Init Error:", err);
                setErrorMsg("Face recognition engine failed to start.");
                setStatus('error');
                setStatusMsg("Initialization failed.");
            }
        };

        initAIAndCamera();

        return () => {
            active = false;
            if (detectionInterval) clearInterval(detectionInterval);
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleVerify = async () => {
        if (!videoRef.current || (status !== 'ready' && !hasFace)) return;
        
        setStatus('scanning');
        setStatusMsg('Analyzing face features...');
        
        try {
            const detection = await faceapi.detectSingleFace(videoRef.current)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setStatus('fail');
                setStatusMsg("No face detected. Please center your face.");
                setTimeout(() => setStatus('ready'), 2500);
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg');

            // Send capture descriptor to CS Auth verification endpoint
            setLoading(true);
            const preToken = localStorage.getItem('cs_preToken');
            if (!preToken) {
                toast.error("Authentication session expired.");
                navigate('/login');
                return;
            }

            const { data } = await axios.post(`${backendUrl}/api/cs/face-verify`, {
                preToken,
                faceDescriptor: Array.from(detection.descriptor),
                faceImage: imageData
            });

            if (data.success) {
                setStatus('success');
                setStatusMsg('Verified! Accessing dashboard...');
                toast.success(data.message);
                
                setTimeout(() => {
                    setCSToken(data.token);
                    localStorage.setItem('cstoken', data.token);
                    localStorage.removeItem('cs_preToken');
                    navigate('/'); // Dashboard
                }, 1200);
            } else {
                setStatus('fail');
                setStatusMsg(data.message || "Verification failed.");
                toast.error(data.message);
                setTimeout(() => setStatus('ready'), 3000);
            }
        } catch (error) {
            setStatus('fail');
            setStatusMsg(error.message || "Verification crashed.");
            toast.error(error.message);
            setTimeout(() => setStatus('ready'), 3000);
        } finally {
            setLoading(false);
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

            <div className="w-full max-w-lg z-10 flex flex-col items-center">
                
                {/* Header Title Area */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-12 h-12 bg-[#2d523e]/20 border border-[#489065]/40 rounded-xl flex items-center justify-center text-[#55b37b] mb-4 shadow-lg">
                        <FaUserShield size={22} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                        Security Verification
                    </h1>
                    <p className="text-white/60 text-xs mt-2 max-w-xs leading-relaxed">
                        Please verify your face to securely access the support portal.
                    </p>
                </div>

                {/* Main glass card */}
                <motion.div
                    style={{
                        rotateX: rX,
                        rotateY: rY,
                        transformStyle: "preserve-3d",
                    }}
                    className="w-full bg-[#0d1216]/90 backdrop-blur-2xl rounded-[32px] p-8 sm:p-10 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden preserve-3d"
                >
                    {/* Dynamic Glare Reflection overlay */}
                    <motion.div
                        style={{
                            background: `radial-gradient(circle 120px at ${glareX} ${glareY}, rgba(255,255,255,0.05), transparent)`,
                        }}
                        className="absolute inset-0 z-10 pointer-events-none"
                    />

                    {/* Progress Timeline Indicator */}
                    <div style={{ transform: "translateZ(30px)" }} className="flex items-center justify-between w-full max-w-[200px] mx-auto mb-8 relative">
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/10 z-0" />
                        <div className="absolute left-0 w-1/2 top-1/2 -translate-y-1/2 h-[2px] bg-[#489065] z-0" />
                        
                        {/* Milestone 1 (Login Done) */}
                        <div className="w-2.5 h-2.5 rounded-full bg-[#489065] z-10" />
                        
                        {/* Milestone 2 (Verify Identity - Active) */}
                        <div className="w-6 h-6 rounded-full bg-[#489065] flex items-center justify-center text-white text-[10px] font-bold z-10 shadow-lg shadow-[#489065]/30">
                            ✓
                        </div>
                        
                        {/* Milestone 3 (Portal Access) */}
                        <div className="w-2.5 h-2.5 rounded-full bg-white/20 z-10" />
                    </div>

                    {/* Status Info row */}
                    <div style={{ transform: "translateZ(25px)" }} className="flex items-start gap-4 mb-6">
                        <div className="p-2.5 bg-[#2d523e]/20 border border-[#489065]/30 rounded-xl text-[#55b37b] shrink-0 mt-0.5">
                            <FaVideo size={16} />
                        </div>
                        <div>
                            <h3 className="text-white text-sm font-bold">Face Verification</h3>
                            <p className="text-white/40 text-[11px] mt-0.5 leading-normal">Position your face in the frame and look at the camera</p>
                        </div>
                    </div>

                    {/* Camera Feed Container */}
                    <div style={{ transform: "translateZ(20px)" }} className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/5 bg-black/40 shadow-inner">
                        
                        {/* Corner scanner brackets overlay */}
                        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#55b37b] rounded-tl-lg pointer-events-none z-20" />
                        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#55b37b] rounded-tr-lg pointer-events-none z-20" />
                        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#55b37b] rounded-bl-lg pointer-events-none z-20" />
                        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#55b37b] rounded-br-lg pointer-events-none z-20" />

                        {/* Webcam Video stream */}
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            muted 
                            playsInline
                            className="w-full h-full object-cover z-0" 
                        />

                        {/* Scanning scanner line overlay */}
                        {status === 'scanning' && (
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#55b37b] to-transparent z-10 animate-scan" />
                        )}

                        {/* Initializing / Loading indicator */}
                        {status === 'initializing' && (
                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm text-white gap-3">
                                <div className="w-8 h-8 border-4 border-[#489065] border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-[10px] font-bold tracking-widest uppercase opacity-75">Loading AI Models</span>
                            </div>
                        )}
                    </div>

                    {/* Real-time Status Badge below video */}
                    <div style={{ transform: "translateZ(20px)" }} className="flex justify-center mt-4 mb-6">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                            status === 'success' 
                                ? 'bg-green-500/20 text-[#55b37b] border border-green-500/30'
                                : status === 'fail'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : hasFace
                                ? 'bg-green-500/20 text-[#55b37b] border border-green-500/30'
                                : 'bg-white/5 text-white/50 border border-white/10'
                        }`}>
                            <span className={`w-2 h-2 rounded-full ${
                                status === 'success' || hasFace ? 'bg-[#55b37b]' : status === 'fail' ? 'bg-red-500' : 'bg-white/30 animate-pulse'
                            }`} />
                            <span>{statusMsg}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ transform: "translateZ(30px)" }} className="space-y-4">
                        {/* Verify Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleVerify}
                            disabled={status === 'initializing' || status === 'scanning' || status === 'success'}
                            className="w-full relative overflow-hidden bg-[#2d523e] hover:bg-[#38674d] text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-[#2d523e]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 border border-[#489065]/20"
                        >
                            <FaShieldAlt size={14} />
                            <span>{status === 'scanning' ? 'Analyzing Face...' : 'Verify Identity'}</span>
                        </motion.button>

                        {/* Divider */}
                        <div className="flex items-center justify-between gap-4 py-1 text-white/10">
                            <div className="h-[1px] flex-1 bg-white/10" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">or</span>
                            <div className="h-[1px] flex-1 bg-white/10" />
                        </div>

                        {/* Back to Login */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/login')}
                            className="w-full bg-white/5 hover:bg-white/10 text-white/80 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 border border-white/5"
                        >
                            <span>← Back to Login</span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* Footer security labels */}
                <div className="mt-8 text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-white/40 text-[9px] font-bold uppercase tracking-wider">
                        <FaLock size={10} className="text-[#489065] -mt-0.5" />
                        <span>Your biometric data is encrypted and never stored</span>
                    </div>
                    <div className="text-white/20 text-[9px] font-bold uppercase tracking-wider">
                        Protected by <span className="text-[#489065] font-black">PawVaidya Security</span>
                    </div>
                </div>
            </div>

            {/* Styles definition for scanner scanline and background */}
            <style>{`
                .preserve-3d {
                    transform-style: preserve-3d;
                }

                .support-mesh-bg {
                    background: radial-gradient(circle at 10% 20%, rgba(72, 144, 101, 0.04) 0%, transparent 45%),
                                radial-gradient(circle at 90% 80%, rgba(72, 144, 101, 0.04) 0%, transparent 45%),
                                #090c0f;
                }

                @keyframes scan { 
                    0% { top: 0; } 
                    100% { top: 100%; } 
                }
                .animate-scan { 
                    animation: scan 2.5s linear infinite; 
                }
            `}</style>
        </div>
    );
};

export default FaceVerify;
