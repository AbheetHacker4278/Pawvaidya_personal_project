import React, { useEffect, useRef, useState, useContext } from 'react';
import * as faceapi from 'face-api.js';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AdminContext } from '../context/AdminContext';

const FaceAuth = ({ mode, onAuthSuccess, onCancel, email }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [captureVideo, setCaptureVideo] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const { backendUrl, aToken } = useContext(AdminContext);

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
                toast.error("Failed to load face recognition models");
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
            .getUserMedia({ video: { width: 300 } })
            .then((stream) => {
                let video = videoRef.current;
                if (video) {
                    video.srcObject = stream;
                    video.play();
                }
            })
            .catch((err) => {
                console.error("error:", err);
                toast.error("Could not access webcam");
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
            if (canvasRef.current && videoRef.current) {
                const displaySize = {
                    width: 300,
                    height: 225
                };

                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);

                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, displaySize.width, displaySize.height);
                    faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                }

                if (detections.length > 0) {
                    setFaceDetected(true);
                } else {
                    setFaceDetected(false);
                }
            }
        }, 100);
    };

    const captureAndAuthenticate = async () => {
        if (!faceDetected || !videoRef.current) return;

        // Get fresh detection
        const detections = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();

        if (!detections) {
            toast.error("No face detected. Please position yourself clearly.");
            return;
        }

        const descriptor = Array.from(detections.descriptor);

        try {
            if (mode === 'register') {
                // Capture image from video
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageBase64 = canvas.toDataURL('image/jpeg');

                const token = localStorage.getItem('atoken');
                console.log("Registering face for:", email);
                const { data } = await axios.post(
                    import.meta.env.VITE_BACKEND_URL + '/api/admin/register-face',
                    { faceDescriptor: descriptor, email, image: imageBase64 },
                    { headers: { atoken: token } }
                );

                if (data.success) {
                    toast.success("Face Registered Successfully");
                    if (onAuthSuccess) onAuthSuccess();
                } else {
                    toast.error(data.message);
                }

            } else if (mode === 'login') {
                // Capture image for logs
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageBase64 = canvas.toDataURL('image/jpeg');

                const { data } = await axios.post(
                    import.meta.env.VITE_BACKEND_URL + '/api/admin/login-face',
                    { faceDescriptor: descriptor, image: imageBase64 }
                );

                if (data.success) {
                    if (onAuthSuccess) onAuthSuccess(data);
                } else {
                    toast.error(data.message);
                }
            } else if (mode === 'doctor_register') {
                // Capture image from video
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageBase64 = canvas.toDataURL('image/jpeg');

                const token = localStorage.getItem('dtoken');
                const { data } = await axios.post(
                    import.meta.env.VITE_BACKEND_URL + '/api/doctor/register-face',
                    { faceDescriptor: descriptor, image: imageBase64 },
                    { headers: { dtoken: token } }
                );

                if (data.success) {
                    toast.success("Face Registered Successfully");
                    if (onAuthSuccess) onAuthSuccess();
                } else {
                    toast.error(data.message);
                }
            } else if (mode === 'doctor_clockin') {
                // Capture image for logs
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageBase64 = canvas.toDataURL('image/jpeg');

                const token = localStorage.getItem('dtoken');
                const { data } = await axios.post(
                    import.meta.env.VITE_BACKEND_URL + '/api/doctor/clock-in',
                    { faceDescriptor: descriptor, image: imageBase64 },
                    { headers: { dtoken: token } }
                );

                if (data.success) {
                    toast.success("Attendance Marked Successfully");
                    if (onAuthSuccess) onAuthSuccess(data);
                } else {
                    toast.error(data.message);
                }
            }
        } catch (error) {
            console.error("Face Auth Error:", error);
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Authentication failed: " + error.message);
            }
        }
    };

    return (
        <div style={{
            position:'fixed',inset:0,background:'rgba(0,0,0,.75)',
            backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)',
            display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,
            fontFamily:"'Inter',sans-serif"
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                @keyframes spin-ring{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
                @keyframes scan-line{0%,100%{top:0;}50%{top:calc(100% - 3px);}}
                @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(.8);}}
                @keyframes fade-in{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
                .fa-modal{animation:fade-in .3s ease;}
                .fa-ring{width:100%;height:100%;border-radius:50%;border:2px solid transparent;border-top-color:#22c55e;border-right-color:rgba(34,197,94,.3);animation:spin-ring 1.8s linear infinite;position:absolute;inset:0;}
                .fa-ring2{width:100%;height:100%;border-radius:50%;border:2px solid transparent;border-bottom-color:rgba(212,175,55,.5);border-left-color:rgba(212,175,55,.15);animation:spin-ring 3s linear infinite reverse;position:absolute;inset:0;}
                .fa-scan{position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,rgba(34,197,94,.8),transparent);animation:scan-line 2s ease-in-out infinite;border-radius:2px;}
                .fa-dot{width:8px;height:8px;border-radius:50%;animation:pulse-dot 1.2s ease-in-out infinite;}
            `}</style>

            <div className="fa-modal" style={{
                background:'linear-gradient(160deg,rgba(7,20,7,.97) 0%,rgba(5,10,5,.97) 100%)',
                border:'1px solid rgba(34,197,94,.2)',
                borderRadius:'24px',
                padding:'2rem',
                width:'360px',
                maxWidth:'95vw',
                boxShadow:'0 24px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(212,175,55,.06) inset',
                display:'flex',flexDirection:'column',alignItems:'center',gap:'1.25rem',
                position:'relative',overflow:'hidden'
            }}>
                {/* Corner gold accent */}
                <div style={{position:'absolute',top:0,right:0,width:'120px',height:'120px',background:'radial-gradient(circle at top right,rgba(212,175,55,.08) 0%,transparent 70%)',pointerEvents:'none'}} />
                <div style={{position:'absolute',bottom:0,left:0,width:'100px',height:'100px',background:'radial-gradient(circle at bottom left,rgba(34,197,94,.06) 0%,transparent 70%)',pointerEvents:'none'}} />

                {/* Header */}
                <div style={{textAlign:'center',zIndex:1}}>
                    <div style={{
                        width:'44px',height:'44px',borderRadius:'50%',
                        background:'linear-gradient(135deg,rgba(34,197,94,.15),rgba(212,175,55,.08))',
                        border:'2px solid rgba(34,197,94,.4)',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:'1.3rem',margin:'0 auto .7rem',
                        boxShadow:'0 0 20px rgba(34,197,94,.25)'
                    }}>🤳</div>
                    <h2 style={{fontSize:'1.15rem',fontWeight:800,color:'#f1f5f9',margin:'0 0 .2rem'}}>
                        {mode === 'login' || mode === 'doctor_clockin' ? 'Face Recognition' : 'Register Face'}
                    </h2>
                    <p style={{fontSize:'.65rem',color:'#475569',letterSpacing:'.1em',textTransform:'uppercase',margin:0}}>
                        {mode === 'login' || mode === 'doctor_clockin' ? 'Biometric Authentication' : 'Secure Face Enrollment'}
                    </p>
                </div>

                {/* Video feed with scanner ring */}
                <div style={{
                    position:'relative',width:'260px',height:'200px',
                    borderRadius:'16px',overflow:'hidden',
                    border:'1px solid rgba(34,197,94,.25)',
                    boxShadow:'0 0 30px rgba(34,197,94,.1)',
                    background:'#050e05',zIndex:1
                }}>
                    {/* Scanning ring overlay */}
                    <div style={{position:'absolute',inset:'-12px',zIndex:3,pointerEvents:'none'}}>
                        <div style={{position:'relative',width:'100%',height:'100%'}}>
                            <div className="fa-ring" />
                            <div className="fa-ring2" />
                        </div>
                    </div>

                    {!modelsLoaded && (
                        <div style={{
                            position:'absolute',inset:0,display:'flex',flexDirection:'column',
                            alignItems:'center',justifyContent:'center',gap:'.6rem',
                            background:'rgba(5,14,5,.9)',zIndex:2
                        }}>
                            <div style={{
                                width:'36px',height:'36px',borderRadius:'50%',
                                border:'3px solid rgba(34,197,94,.2)',
                                borderTopColor:'#22c55e',
                                animation:'spin-ring 1s linear infinite'
                            }} />
                            <span style={{fontSize:'.72rem',color:'#4ade80',letterSpacing:'.05em'}}>Loading AI Models…</span>
                        </div>
                    )}

                    {captureVideo && modelsLoaded && (
                        <div style={{position:'relative',width:'100%',height:'100%'}}>
                            <video
                                ref={videoRef}
                                height="200" width="260"
                                onPlay={handleVideoOnPlay}
                                style={{objectFit:'cover',width:'100%',height:'100%',display:'block'}}
                                muted playsInline autoPlay
                            />
                            <canvas ref={canvasRef} style={{position:'absolute',top:0,left:0}} />
                            {/* Scan line */}
                            <div className="fa-scan" style={{zIndex:4}} />
                            {/* Corner brackets */}
                            {['tl','tr','bl','br'].map(c => (
                                <div key={c} style={{
                                    position:'absolute',
                                    top:c.startsWith('t')?'8px':'auto',
                                    bottom:c.startsWith('b')?'8px':'auto',
                                    left:c.endsWith('l')?'8px':'auto',
                                    right:c.endsWith('r')?'8px':'auto',
                                    width:'18px',height:'18px',
                                    borderTop:c.startsWith('t')?'2px solid #22c55e':'none',
                                    borderBottom:c.startsWith('b')?'2px solid #22c55e':'none',
                                    borderLeft:c.endsWith('l')?'2px solid #22c55e':'none',
                                    borderRight:c.endsWith('r')?'2px solid #22c55e':'none',
                                    zIndex:5
                                }} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Status indicator */}
                <div style={{
                    display:'flex',alignItems:'center',gap:'.5rem',
                    background:'rgba(0,0,0,.3)',border:`1px solid ${faceDetected ? 'rgba(34,197,94,.4)' : 'rgba(255,255,255,.08)'}`,
                    borderRadius:'20px',padding:'.35rem .85rem',
                    transition:'border-color .3s',zIndex:1
                }}>
                    <div className="fa-dot" style={{background: faceDetected ? '#22c55e' : '#475569'}} />
                    <span style={{
                        fontSize:'.72rem',fontWeight:600,
                        color: faceDetected ? '#4ade80' : '#64748b',
                        letterSpacing:'.04em',transition:'color .3s'
                    }}>
                        {faceDetected ? 'Face Detected — Ready' : 'Scanning for face…'}
                    </span>
                </div>

                {/* Action buttons */}
                <div style={{display:'flex',gap:'.75rem',width:'100%',zIndex:1}}>
                    <button
                        onClick={captureAndAuthenticate}
                        disabled={!faceDetected}
                        style={{
                            flex:1,padding:'.7rem',
                            background: faceDetected
                                ? 'linear-gradient(135deg,#15803d,#22c55e)'
                                : 'rgba(255,255,255,.04)',
                            border:`1px solid ${faceDetected ? 'transparent' : 'rgba(255,255,255,.08)'}`,
                            borderRadius:'10px',
                            color: faceDetected ? '#fff' : '#475569',
                            fontSize:'.83rem',fontWeight:700,
                            cursor: faceDetected ? 'pointer' : 'not-allowed',
                            fontFamily:"'Inter',sans-serif",
                            letterSpacing:'.04em',
                            boxShadow: faceDetected ? '0 4px 16px rgba(34,197,94,.3)' : 'none',
                            transition:'all .2s',
                            display:'flex',alignItems:'center',justifyContent:'center',gap:'.4rem'
                        }}
                    >
                        {faceDetected ? '✅' : '⏳'}
                        {mode === 'login' || mode === 'doctor_clockin' ? ' Authenticate' : ' Save Face'}
                    </button>

                    <button
                        onClick={onCancel}
                        style={{
                            flex:1,padding:'.7rem',
                            background:'transparent',
                            border:'1px solid rgba(239,68,68,.35)',
                            borderRadius:'10px',
                            color:'#f87171',
                            fontSize:'.83rem',fontWeight:600,
                            cursor:'pointer',
                            fontFamily:"'Inter',sans-serif",
                            transition:'border-color .2s,background .2s'
                        }}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,.1)';e.currentTarget.style.borderColor='rgba(239,68,68,.6)';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='rgba(239,68,68,.35)';}}
                    >
                        ✕ &nbsp;Cancel
                    </button>
                </div>

                {/* Footer */}
                <p style={{
                    fontSize:'.6rem',color:'#334155',letterSpacing:'.08em',
                    textTransform:'uppercase',margin:'-.4rem 0 0',zIndex:1,
                    display:'flex',alignItems:'center',gap:'.3rem'
                }}>
                    🔒 Biometric data is encrypted & never stored
                </p>
            </div>
        </div>
    );
};

export default FaceAuth;

