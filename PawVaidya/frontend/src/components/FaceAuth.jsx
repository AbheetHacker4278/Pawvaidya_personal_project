import React, { useEffect, useRef, useState, useContext } from 'react';
import * as faceapi from 'face-api.js';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, ShieldCheck, UserCheck, Loader2 } from 'lucide-react';

const FaceAuth = ({ mode, onAuthSuccess, onCancel, email }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [captureVideo, setCaptureVideo] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);

    const { backendurl, token, userdata, registerFace, loginWithFace } = useContext(AppContext);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
                startVideo();
            } catch (err) {
                console.error("Error loading models:", err);
                toast.error("Failed to load biometric models");
            }
        };
        loadModels();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            closeVideo();
        };
    }, []);

    const startVideo = () => {
        setCaptureVideo(true);
        navigator.mediaDevices
            .getUserMedia({ video: { width: 400, height: 300, facingMode: 'user' } })
            .then((stream) => {
                let video = videoRef.current;
                if (video) {
                    video.srcObject = stream;
                    video.play();
                }
            })
            .catch((err) => {
                console.error("error:", err);
                toast.error("Webcam access denied. Please enable camera permissions.");
            });
    };

    const closeVideo = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setCaptureVideo(false);
    };

    const handleVideoOnPlay = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(async () => {
            if (canvasRef.current && videoRef.current && !isProcessing) {
                const displaySize = { width: 400, height: 300 };
                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                const ctx = canvasRef.current.getContext('2d');

                if (ctx) {
                    ctx.clearRect(0, 0, displaySize.width, displaySize.height);

                    // Custom drawing for more "premium" look
                    resizedDetections.forEach(detection => {
                        const box = detection.detection.box;
                        ctx.strokeStyle = '#10b981';
                        ctx.lineWidth = 3;
                        ctx.setLineDash([5, 5]);
                        ctx.strokeRect(box.x, box.y, box.width, box.height);

                        // Draw corners
                        ctx.setLineDash([]);
                        ctx.beginPath();
                        const len = 20;
                        // Top Left
                        ctx.moveTo(box.x, box.y + len); ctx.lineTo(box.x, box.y); ctx.lineTo(box.x + len, box.y);
                        // Top Right
                        ctx.moveTo(box.x + box.width - len, box.y); ctx.lineTo(box.x + box.width, box.y); ctx.lineTo(box.x + box.width, box.y + len);
                        // Bottom Left
                        ctx.moveTo(box.x, box.y + box.height - len); ctx.lineTo(box.x, box.y + box.height); ctx.lineTo(box.x + len, box.y + box.height);
                        // Bottom Right
                        ctx.moveTo(box.x + box.width - len, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height - len);
                        ctx.stroke();
                    });
                }

                if (detections.length > 0) {
                    setFaceDetected(true);
                    setScanProgress(prev => Math.min(prev + 10, 100));
                } else {
                    setFaceDetected(false);
                    setScanProgress(0);
                }
            }
        }, 100);
    };

    const captureAndAuthenticate = async () => {
        if (!faceDetected || !videoRef.current || isProcessing) return;

        setIsProcessing(true);
        const toastId = toast.loading(mode === 'register' ? "Analyzing face features..." : "Verifying identity...");

        try {
            // Get fresh detection with high quality
            const detections = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();

            if (!detections) {
                setIsProcessing(false);
                toast.error("Verification failed. Please stay still.", { id: toastId });
                return;
            }

            const descriptor = Array.from(detections.descriptor);

            // Capture image from video
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

            let success = false;

            if (mode === 'register') {
                success = await registerFace({
                    userId: userdata?.id, // if logged in
                    faceDescriptor: descriptor,
                    image: imageBase64
                });
            } else {
                success = await loginWithFace({
                    faceDescriptor: descriptor,
                    image: imageBase64
                });
            }

            if (success) {
                toast.update(toastId, {
                    render: mode === 'register' ? "Biometrics secured successfully!" : "Access granted!",
                    type: "success",
                    isLoading: false,
                    autoClose: 3000
                });
                setIsProcessing(false);
                if (onAuthSuccess) onAuthSuccess();
            } else {
                setIsProcessing(false);
                toast.dismiss(toastId);
            }

        } catch (error) {
            console.error("Face Auth Error:", error);
            setIsProcessing(false);
            toast.update(toastId, {
                render: "Technical error during authentication",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full relative overflow-hidden"
                >
                    {/* Background Decorative elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />

                    <div className="flex justify-between items-start w-full mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-xl">
                                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {mode === 'login' ? 'Biometric Login' : 'Secure Face Setup'}
                                </h2>
                                <p className="text-sm text-gray-400">Powered by Neural Face ID</p>
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="relative group">
                        <div className={`
                            relative flex justify-center items-center h-[280px] w-[320px] 
                            bg-zinc-900 rounded-2xl overflow-hidden border-2 transition-all duration-500
                            ${faceDetected ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-white/10'}
                        `}>
                            {!modelsLoaded && (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                    <p className="text-gray-400 animate-pulse text-sm">Initializing Biometrics...</p>
                                </div>
                            )}

                            {captureVideo && modelsLoaded && (
                                <div className="absolute inset-0">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-full object-cover grayscale-[0.3] brightness-110"
                                        onPlay={handleVideoOnPlay}
                                        muted
                                        playsInline
                                        autoPlay
                                    />
                                    <canvas ref={canvasRef} className="absolute inset-0" />

                                    {/* Scan Line Animation */}
                                    {faceDetected && !isProcessing && (
                                        <motion.div
                                            initial={{ top: '0%' }}
                                            animate={{ top: '100%' }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-10"
                                        />
                                    )}

                                    {/* HUD Overlay */}
                                    <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none" />
                                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                        <div className="text-[10px] font-mono text-emerald-500/70 bg-black/40 px-2 py-1 rounded">
                                            DFS_VAL: {(Math.random() * 0.9).toFixed(4)}<br />
                                            FPS: 30.0
                                        </div>
                                        {faceDetected && (
                                            <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2 py-1 rounded-full border border-emerald-500/30">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-bold text-emerald-400 tracking-wider">FACE_LOCKED</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isProcessing && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-20">
                                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                                    <p className="text-white font-medium">Encrypting Features...</p>
                                </div>
                            )}
                        </div>

                        {/* Progress Bar */}
                        {faceDetected && !isProcessing && (
                            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-emerald-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${scanProgress}%` }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex flex-col gap-3 w-full">
                        <button
                            onClick={captureAndAuthenticate}
                            disabled={!faceDetected || isProcessing}
                            className={`
                                py-4 rounded-2xl text-white font-bold transition-all duration-300 flex items-center justify-center gap-2
                                ${faceDetected && !isProcessing
                                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 active:scale-95'
                                    : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'}
                            `}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {mode === 'login' ? <UserCheck className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                                    {mode === 'login' ? 'Authenticate Identity' : 'Secure My Face ID'}
                                </>
                            )}
                        </button>

                        <p className="text-[11px] text-center text-gray-500 px-4">
                            By continuing, you agree to biometric processing for secure access. Data is encrypted and used only for identity verification.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FaceAuth;
