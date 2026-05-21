import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import FaceCamera from './FaceCamera';
import { CSContext } from '../context/CSContext';
import { FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';

const PostBreakVerifyOverlay = () => {
    const { backendUrl, cstoken, isPostBreakVerification, setPostBreakVerification } = useContext(CSContext);
    const [timeLeft, setTimeLeft] = useState(60);
    const [ringing, setRinging] = useState(false);
    const cameraRef = useRef();
    const audioRef = useRef(null);

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setRinging(false);
    };

    useEffect(() => {
        if (isPostBreakVerification) {
            setTimeLeft(60);
            setRinging(false);
            if (!audioRef.current) {
                audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audioRef.current.loop = true;
            }
        } else {
            stopAudio();
        }

        return () => {
            stopAudio();
        };
    }, [isPostBreakVerification]);

    useEffect(() => {
        let timer;
        if (isPostBreakVerification && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isPostBreakVerification && timeLeft <= 0 && !ringing) {
            setRinging(true);
            if (audioRef.current) {
                audioRef.current.play().catch(e => console.log('Audio play failed:', e));
            }
        }
        return () => clearInterval(timer);
    }, [isPostBreakVerification, timeLeft, ringing]);

    // stopAudio moved to the top

    const handleFaceCapture = async (descriptor, imageData) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/cs/verify-face-session`, {
                faceDescriptor: descriptor
            }, { headers: { cstoken } });

            if (data.success) {
                if (cameraRef.current) cameraRef.current.setSuccess();
                toast.success('Identity verified. Welcome back.');
                stopAudio();
                setTimeout(() => {
                    setPostBreakVerification(false);
                    localStorage.removeItem('isPostBreakVerification');
                }, 1000);
            } else {
                if (cameraRef.current) cameraRef.current.setFailure(data.message);
                toast.error(data.message);
            }
        } catch (error) {
            if (cameraRef.current) cameraRef.current.setFailure(error.message);
            toast.error(error.message);
        }
    };

    if (!isPostBreakVerification) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center">
            {ringing && (
                <div className="absolute top-10 flex items-center bg-red-600/20 border border-red-500 text-red-500 px-6 py-3 rounded-xl animate-pulse">
                    <FaExclamationTriangle className="mr-3 text-xl" />
                    <span className="font-bold tracking-widest uppercase">URGENT: VERIFY IDENTITY IMMEDIATELY</span>
                </div>
            )}
            
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="text-center mb-6 relative z-10">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 border-4 border-blue-50">
                        <FaShieldAlt className="text-3xl text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Security Check</h2>
                    <p className="text-slate-500 text-sm mt-2">
                        Please verify your face to resume working.
                    </p>
                </div>

                {/* Timer Countdown */}
                {!ringing && (
                    <div className="text-center mb-6 relative z-10">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Time remaining</span>
                        <div className={`text-3xl font-black mt-1 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                            00:{timeLeft.toString().padStart(2, '0')}
                        </div>
                    </div>
                )}

                <div className="relative z-10">
                    <FaceCamera ref={cameraRef} onCapture={handleFaceCapture} buttonText="Scan Face to Resume" />
                </div>
            </div>
        </div>
    );
};

export default PostBreakVerifyOverlay;
