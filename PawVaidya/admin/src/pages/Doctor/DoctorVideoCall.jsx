import React, { useEffect, useRef, useContext, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { Video, User, PawPrint, Info, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DoctorVideoCall = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const { profileData, appointments, getAppointments, dtoken, backendurl } = useContext(DoctorContext);
    const containerRef = useRef(null);
    const initializedRef = useRef(false);
    const [appointment, setAppointment] = useState(null);
    const [meetingDuration, setMeetingDuration] = useState(0);
    const [callEnded, setCallEnded] = useState(false);

    useEffect(() => {
        if (dtoken) {
            getAppointments();
        }
    }, [dtoken, appointmentId]);

    useEffect(() => {
        if (appointments && appointments.length > 0) {
            const found = appointments.find(a => a._id === appointmentId);
            setAppointment(found);
        }
    }, [appointments, appointmentId]);

    // Meeting timer
    useEffect(() => {
        if (callEnded) return;
        const timer = setInterval(() => {
            setMeetingDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [callEnded]);

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!profileData || !appointment || !containerRef.current || initializedRef.current) return;

        const myMeeting = async (element) => {
            initializedRef.current = true;
            const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
            const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;
            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                appID,
                serverSecret,
                appointmentId,
                profileData?._id || Date.now().toString(),
                profileData?.name || "Doctor"
            );

            const zp = ZegoUIKitPrebuilt.create(kitToken);
            zp.joinRoom({
                container: element,
                sharedLinks: [
                    {
                        name: 'Personal link',
                        url: window.location.origin + window.location.pathname,
                    },
                ],
                scenario: {
                    mode: ZegoUIKitPrebuilt.OneONoneCall,
                },
                showScreenSharingButton: true,
                onLeaveRoom: async () => {
                    try {
                        await axios.post(backendurl + "/api/doctor/complete-appointment", { appointmentId }, { headers: { dtoken } });
                        setCallEnded(true);
                    } catch (error) {
                        console.error("Error completing appointment:", error);
                        setCallEnded(true);
                    }
                }
            });
        };

        myMeeting(containerRef.current);
    }, [appointmentId, profileData, appointment, navigate]);

    if (callEnded) {
        return (
            <div className="flex items-center justify-center w-full h-[calc(100vh-100px)] bg-[#0f172a] m-2 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-8 text-center text-white">
                <div className="max-w-md w-full animate-fadeIn">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                        <Video className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black mb-2 uppercase tracking-tight">Consultation Ended</h1>
                    <p className="text-slate-400 text-sm mb-8">The session has been successfully concluded. All changes have been saved to the appointment records.</p>

                    <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700 mb-8 flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Total Session Duration</p>
                        <p className="text-4xl font-black text-white tabular-nums">{formatDuration(meetingDuration)}</p>
                    </div>

                    <button
                        onClick={() => navigate('/doctor-appointments')}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/40 active:scale-95"
                    >
                        Go to Appointments
                    </button>

                    <div className="mt-8 flex items-center gap-2 justify-center opacity-20">
                        <img src="https://res.cloudinary.com/dvz9u7p1g/image/upload/v1648766155/PawVaidya/logo.png" alt="Logo" className="w-4 h-4 grayscale" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">PawVaidya Pro</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row w-[calc(100%-1rem)] h-[calc(100vh-100px)] bg-[#0f172a] text-slate-200 overflow-hidden m-2 rounded-2xl shadow-2xl border border-slate-800">
            {/* Main Video Area */}
            <div className="flex-1 relative flex flex-col min-h-0 bg-black">
                {/* Header Overlay */}
                <div className="absolute top-2 left-2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-2xl">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">Live Session</span>
                    <div className="h-3 w-px bg-white/20 mx-1" />
                    <span className="text-[11px] font-bold text-slate-300">
                        {profileData?.name?.startsWith('Dr.') ? profileData?.name : `Dr. ${profileData?.name}`}
                    </span>
                </div>

                <div
                    ref={containerRef}
                    className="w-full h-full"
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            {/* Side Info Panel - Narrower and cleaner */}
            <div className="w-full lg:w-[240px] flex flex-col bg-[#1e293b] border-l border-slate-800 shadow-2xl overflow-y-auto no-scrollbar">
                <div className="p-5">
                    <h2 className="text-sm font-black mb-6 flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                        <Video className="w-4 h-4 text-amber-500" /> Session Info
                    </h2>

                    <div className="space-y-4">
                        {/* Meeting Duration Timer */}
                        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex flex-col items-center justify-center text-center">
                            <p className="text-[10px] font-black uppercase text-slate-500 mb-1 flex items-center gap-2">
                                <Clock className="w-3 h-3 text-emerald-400" /> Meeting Duration
                            </p>
                            <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
                                {formatDuration(meetingDuration)}
                            </p>
                        </div>

                        {appointment ? (
                            <>
                                {/* Owner Info Card */}
                                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-2">
                                        <User className="w-3 h-3 text-blue-400" /> Guardian
                                    </p>
                                    <p className="text-sm font-bold text-white truncate">{appointment.userData?.name}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{appointment.userData?.email}</p>
                                </div>

                                {/* Appointment Info */}
                                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-2">
                                        <Info className="w-3 h-3 text-amber-500" /> Appointment
                                    </p>
                                    <div className="flex justify-between items-center text-[11px] mb-1">
                                        <span className="text-slate-400">Scheduled:</span>
                                        <span className="font-bold text-white">{appointment.slotTime}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-400">Fee Paid:</span>
                                        <span className="font-bold text-emerald-400">₹{appointment.amount}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="py-10 text-center opacity-50">
                                <Clock className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                                <p className="text-[10px] font-bold">Syncing data...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Branding */}
                <div className="mt-auto p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-2 justify-center opacity-30">
                        <img src="https://res.cloudinary.com/dvz9u7p1g/image/upload/v1648766155/PawVaidya/logo.png" alt="Logo" className="w-4 h-4 grayscale" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">PawVaidya Pro</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorVideoCall;
