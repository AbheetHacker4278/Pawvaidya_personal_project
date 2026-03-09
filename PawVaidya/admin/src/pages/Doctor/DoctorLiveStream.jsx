
import React, { useContext, useEffect, useRef } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { io } from 'socket.io-client';

const DoctorLiveStream = () => {
    const { dtoken, profileData, backendurl } = useContext(DoctorContext);
    const containerRef = useRef(null);
    const zpRef = useRef(null);
    const socketRef = useRef(null);

    // Use Doctor's ID as Room ID to make it persistent/findable
    const roomID = profileData ? profileData._id : null;

    console.log("DoctorLiveStream: Initializing with RoomID:", roomID);

    useEffect(() => {
        if (!containerRef.current || !profileData || !roomID) return;

        // Initialize Socket
        socketRef.current = io(backendurl, {
            withCredentials: true,
            transports: ['polling', 'websocket']
        });
        socketRef.current.emit('start-stream', roomID);
        console.log("Emitted start-stream for:", roomID);

        // Cleanup previous instance if exists
        if (zpRef.current) {
            zpRef.current.destroy();
            zpRef.current = null;
        }

        const myMeeting = async () => {
            const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
            const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

            if (appID === 0 || serverSecret === "YOUR_ZEGO_SERVER_SECRET_HERE") {
                alert("Please update your Admin .env file with valid ZegoCloud keys and restart the server!");
                return;
            }

            if (!appID || !serverSecret) {
                console.error("ZegoCloud keys are missing in .env");
                return;
            }

            console.log("DoctorLiveStream: AppID:", appID);

            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                appID,
                serverSecret,
                roomID,
                profileData._id,
                profileData.name
            );

            // Create instance object from Kit Token.
            const zp = ZegoUIKitPrebuilt.create(kitToken);
            zpRef.current = zp;

            // start the call
            zp.joinRoom({
                container: containerRef.current,
                showPreJoinView: false, // Skip the "Join" screen for a seamless start
                scenario: {
                    mode: ZegoUIKitPrebuilt.LiveStreaming,
                    config: {
                        role: ZegoUIKitPrebuilt.Host,
                    },
                },
                turnOnCameraWhenJoining: true,
                showMyCameraControls: true,
                showMyMicrophoneControls: true,
                showAudioVideoSettingsButton: true,
                showScreenSharingButton: true,
                showUserList: true,
                branding: {
                    logoURL: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
                },
                sharedLinks: [
                    {
                        name: 'Join as audience',
                        url:
                            window.location.protocol + '//' +
                            window.location.host.replace("5174", "5173") +
                            '/live-stream/' +
                            roomID,
                    },
                ],
            });
        };

        myMeeting();

        return () => {
            if (zpRef.current) {
                zpRef.current.destroy();
                zpRef.current = null;
            }
            if (socketRef.current) {
                socketRef.current.emit('end-stream', roomID);
                console.log("Emitted end-stream for:", roomID);
                socketRef.current.disconnect();
            }
        };
    }, [profileData, roomID, backendurl]);

    if (!profileData) {
        return (
            <div className="min-h-[400px] flex items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full shadow-lg shadow-indigo-200" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Initializing Broadcast...</p>
                </div>
            </div>
        );
    }

    const audienceUrl = window.location.protocol + '//' + window.location.host.replace("5174", "5173") + '/live-stream/' + roomID;

    return (
        <div className='m-6 animate-fadeIn'>
            <div className='mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div className="flex items-center gap-4">
                    <div className="bg-rose-500 p-3 rounded-2xl text-white shadow-lg shadow-rose-200 animate-pulse">
                        <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                    <div>
                        <h1 className='text-3xl font-black text-slate-900 tracking-tight'>Live Broadcast</h1>
                        <p className='text-slate-500 text-sm font-medium'>Connected as <span className="text-indigo-600 font-bold">Dr. {profileData.name}</span></p>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-3 rounded-2xl shadow-sm flex items-center gap-4">
                    <div className="hidden md:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-right">Audience Link</p>
                        <p className="text-xs font-mono font-bold text-slate-600 truncate max-w-[200px]">{audienceUrl}</p>
                    </div>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(audienceUrl);
                            alert("Link copied to clipboard!");
                        }}
                        className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md shadow-slate-200"
                        title="Copy Join Link"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </button>
                </div>
            </div>

            <div className="relative group rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 border border-slate-200 bg-slate-900">
                <div
                    className="myCallContainer transition-opacity duration-700 h-[calc(100vh-280px)]"
                    ref={containerRef}
                    style={{ width: '100%' }}
                ></div>

                {/* Overlay for inactive state */}
                {!roomID && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-xl z-50">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full" />
                            </div>
                            <p className="text-white font-black uppercase tracking-tighter text-xl">Securing Stream...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorLiveStream;
