import React, { useEffect, useRef, useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { AppContext } from '../context/AppContext';
import { Video, User, Info, Clock, ShieldCheck } from 'lucide-react';

const VideoCall = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const { userdata, backendurl, token, getUserAppointments } = useContext(AppContext);
    const containerRef = useRef(null);
    const initializedRef = useRef(false);
    const [appointment, setAppointment] = useState(null);
    const [meetingDuration, setMeetingDuration] = useState(0);
    const [callEnded, setCallEnded] = useState(false);

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
        const fetchAppointment = async () => {
            if (token) {
                const apps = await getUserAppointments();
                const found = apps.find(a => a._id === appointmentId);
                setAppointment(found);
            }
        };
        fetchAppointment();
    }, [appointmentId, token]);

    useEffect(() => {
        if (!userdata || !appointment || !containerRef.current || initializedRef.current) return;

        const myMeeting = async (element) => {
            initializedRef.current = true;
            const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
            const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;
            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                appID,
                serverSecret,
                appointmentId,
                userdata.id || userdata._id || Date.now().toString(),
                userdata.name || "User"
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
                        await axios.post(backendurl + '/api/user/complete-video-appointment', { appointmentId }, { headers: { token } });
                        setCallEnded(true);
                    } catch (e) {
                        console.error("Auto-completion failed:", e.message);
                        setCallEnded(true);
                    }
                }
            });
        };

        myMeeting(containerRef.current);
    }, [appointmentId, userdata, appointment, navigate]);

    if (callEnded) {
        return (
            <div className="flex items-center justify-center w-full h-[calc(100vh-140px)] bg-[#0f172a] mx-auto mt-4 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-8 text-center text-white">
                <div className="max-w-md w-full">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                        <Video className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-black mb-2 uppercase tracking-tight">Consultation ended</h1>
                    <p className="text-slate-400 text-sm mb-8">Your session has concluded. We hope your pet feels better soon! You can find the summary in your appointment history.</p>

                    <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700 mb-8 flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Total duration</p>
                        <p className="text-4xl font-black text-white tabular-nums">{formatDuration(meetingDuration)}</p>
                    </div>

                    <button
                        onClick={() => navigate('/my-appointments')}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
                    >
                        Go to My Appointments
                    </button>

                    <div className="mt-8 flex items-center gap-2 justify-center opacity-20">
                        <img src="https://res.cloudinary.com/dvz9u7p1g/image/upload/v1648766155/PawVaidya/logo.png" alt="Logo" className="w-4 h-4 grayscale" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">PawVaidya Life</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row w-[calc(100%-1rem)] h-[calc(100vh-140px)] bg-[#0f172a] text-slate-200 overflow-hidden mx-auto mt-4 rounded-2xl shadow-2xl border border-slate-800">
            {/* Main Video Area */}
            <div className="flex-1 relative flex flex-col min-h-0 bg-black">
                {/* Header Overlay */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-2xl">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Live Session</span>
                    <div className="h-3 w-px bg-white/20 mx-1" />
                    <span className="text-[11px] font-bold text-slate-300">
                        Dr. {appointment?.docData?.name || 'Veterinarian'}
                    </span>
                </div>

                <div
                    ref={containerRef}
                    className="w-full h-full"
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            {/* Side Info Panel */}
            <div className="w-full lg:w-[260px] flex flex-col bg-[#1e293b] border-l border-slate-800 shadow-2xl overflow-y-auto no-scrollbar">
                <div className="p-5">
                    <h2 className="text-sm font-black mb-6 flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                        <Video className="w-4 h-4 text-emerald-500" /> Consultation
                    </h2>

                    <div className="space-y-4">
                        {/* Meeting Duration Timer */}
                        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex flex-col items-center justify-center text-center">
                            <p className="text-[10px] font-black uppercase text-slate-500 mb-1 flex items-center gap-2">
                                <Clock className="w-3 h-3 text-emerald-400" /> Duration
                            </p>
                            <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
                                {formatDuration(meetingDuration)}
                            </p>
                        </div>

                        {appointment ? (
                            <>
                                {/* Doctor Card */}
                                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Veterinarian
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={appointment.docData?.image}
                                            alt="Doc"
                                            className="w-10 h-10 rounded-lg object-cover border border-slate-600 shadow-md"
                                        />
                                        <div>
                                            <p className="text-sm font-bold text-white truncate w-24">Dr. {appointment.docData?.name}</p>
                                            <p className="text-[10px] text-slate-500">{appointment.docData?.speciality}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Appointment Info */}
                                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-2">
                                        <Info className="w-3 h-3 text-emerald-500" /> Details
                                    </p>
                                    <div className="flex justify-between items-center text-[11px] mb-1">
                                        <span className="text-slate-400">Scheduled:</span>
                                        <span className="font-bold text-white">{appointment.slotTime}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-400">Status:</span>
                                        <span className="font-bold text-emerald-400 uppercase tracking-tighter">Live</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="py-10 text-center opacity-50">
                                <Clock className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                                <p className="text-[10px] font-bold">Connecting...</p>
                            </div>
                        )}

                        <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 italic text-[10px] text-slate-400">
                            Our team is here to help. Please ensure your camera is enabled.
                        </div>
                    </div>
                </div>

                {/* Bottom Branding */}
                <div className="mt-auto p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-2 justify-center opacity-30">
                        <img src="https://res.cloudinary.com/dvz9u7p1g/image/upload/v1648766155/PawVaidya/logo.png" alt="Logo" className="w-4 h-4 grayscale" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">PawVaidya Life</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCall;
