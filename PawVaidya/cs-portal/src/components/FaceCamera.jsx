import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';

/* global faceapi */

const FaceCamera = forwardRef(({ onCapture, buttonText = "Verify Identity" }, ref) => {
    const videoRef = useRef();
    const [status, setStatus] = useState('initializing'); // initializing, ready, scanning, success, fail, error
    const [errorMsg, setErrorMsg] = useState('');
    const [progress, setProgress] = useState(0);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        setFailure: (msg) => {
            setStatus('fail');
            setErrorMsg(msg);
            setTimeout(() => {
                if (status !== 'error') setStatus('ready');
            }, 3000);
        },
        setSuccess: () => {
            setStatus('success');
        },
        reset: () => {
            setStatus('ready');
            setErrorMsg('');
        }
    }));

    useEffect(() => {
        const initAI = async () => {
            try {
                setStatus('initializing');
                if (window.tf) await window.tf.ready();

                const MODEL_URL = '/models';
                await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                
                setStatus('ready');
                startCamera();
            } catch (err) {
                console.error("AI Init Error:", err);
                setErrorMsg("Face recognition engine failed to start.");
                setStatus('error');
            }
        };

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 640, height: 480, facingMode: 'user' } 
                });
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) {
                setErrorMsg("Camera access denied.");
                setStatus('error');
            }
        };

        initAI();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleVerify = async () => {
        if (status !== 'ready' || !videoRef.current) return;
        
        setStatus('scanning');
        setErrorMsg('');
        setProgress(0);
        
        const timer = setInterval(() => setProgress(p => Math.min(p + 15, 95)), 150);

        try {
            const detection = await faceapi.detectSingleFace(videoRef.current)
                .withFaceLandmarks()
                .withFaceDescriptor();

            clearInterval(timer);
            setProgress(100);

            if (!detection) {
                setStatus('fail');
                setErrorMsg("No face detected. Please center your face.");
                setTimeout(() => setStatus('ready'), 2000);
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg');

            // We don't set success here anymore, we let the parent decide after backend check
            onCapture(Array.from(detection.descriptor), imageData);

        } catch (err) {
            clearInterval(timer);
            setStatus('error');
            setErrorMsg("Verification crashed.");
        }
    };

    return (
        <div className="flex flex-col items-center space-y-6 animate-in fade-in duration-700">
            <div className="relative group">
                <div className={`absolute -inset-1 rounded-2xl blur opacity-25 transition duration-1000 
                    ${status === 'success' ? 'bg-green-500' : status === 'fail' ? 'bg-red-500' : 'bg-primary'}`}>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-2xl bg-black aspect-video w-full max-w-[340px]">
                    
                    {status === 'initializing' && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm text-white space-y-3">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] font-medium tracking-widest uppercase opacity-80">Loading AI Engine</span>
                        </div>
                    )}

                    {status === 'scanning' && (
                        <>
                            <div className="absolute inset-0 z-10 bg-primary/5"></div>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent z-20 animate-scan"></div>
                        </>
                    )}

                    {/* SUCCESS OVERLAY (GREEN TICK) */}
                    {status === 'success' && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-green-500/20 backdrop-blur-[2px] animate-in zoom-in duration-300">
                            <div className="bg-green-500 text-white p-3 rounded-full shadow-lg scale-125">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* FAIL OVERLAY (RED CROSS) */}
                    {status === 'fail' && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-red-500/20 backdrop-blur-[2px] animate-in zoom-in duration-300">
                            <div className="bg-red-500 text-white p-3 rounded-full shadow-lg scale-125">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                    )}

                    <video 
                        ref={videoRef} 
                        autoPlay 
                        muted 
                        playsInline
                        className={`w-full h-full object-cover transition-opacity duration-1000 ${status !== 'initializing' ? 'opacity-100' : 'opacity-0'}`} 
                    />
                </div>
            </div>

            {errorMsg && (
                <div className={`flex items-center space-x-2 py-2 px-4 rounded-full border animate-in slide-in-from-top-2 
                    ${status === 'fail' ? 'text-red-600 bg-red-50 border-red-100' : 'text-slate-600 bg-slate-50 border-slate-100'}`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-medium">{errorMsg}</span>
                </div>
            )}

            <div className="w-full space-y-3">
                {status === 'scanning' && (
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                )}
                
                <button
                    onClick={handleVerify}
                    disabled={status !== 'ready'}
                    className={`w-full font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2
                        ${status === 'ready' ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                        ${status === 'success' ? 'bg-green-500 !text-white' : status === 'fail' ? 'bg-red-500 !text-white' : ''}
                    `}
                >
                    {status === 'scanning' ? (
                        <>
                            <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                            <span>Analyzing...</span>
                        </>
                    ) : status === 'success' ? (
                        <span>Verified!</span>
                    ) : status === 'fail' ? (
                        <span>Failed</span>
                    ) : (
                        <span>{buttonText}</span>
                    )}
                </button>
            </div>

            <style>{`
                @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
                .animate-scan { animation: scan 2s linear infinite; }
            `}</style>
        </div>
    );
});

export default FaceCamera;
