import React, { useContext, useEffect, useState, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutGrid, Users, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';

const LiveStreams = ({ hideHeader = false }) => {
    const { doctors, userdata, backendurl } = useContext(AppContext);
    const navigate = useNavigate();
    const [activeStreams, setActiveStreams] = useState([]);
    const [activeAdminStreams, setActiveAdminStreams] = useState([]);

    const isObsidian = userdata?.subscription?.status === 'Active' && userdata?.subscription?.plan === 'Obsidian';

    // Socket Listener for Active Streams
    useEffect(() => {
        const socket = io(backendurl, {
            withCredentials: true,
            transports: ['polling', 'websocket']
        });

        socket.emit('request-active-streams');
        socket.emit('request-active-admin-streams');

        socket.on('active-live-streams', (streams) => {
            console.log("Active streams updated:", streams);
            setActiveStreams(streams);
        });

        socket.on('active-admin-streams', (streams) => {
            console.log("Active Admin streams updated:", streams);
            setActiveAdminStreams(streams);
        });

        return () => {
            socket.disconnect();
        };
    }, [backendurl]);

    // If ID is passed, show the stream
    const { streamID } = useParams();
    const containerRef = useRef(null);
    const zpRef = useRef(null);

    useEffect(() => {
        if (!streamID || !containerRef.current || !userdata) return;

        if (zpRef.current) {
            zpRef.current.destroy();
            zpRef.current = null;
        }

        const myMeeting = async () => {
            console.log("LiveStreams: Joining StreamID:", streamID);
            const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
            const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;
            console.log("LiveStreams: AppID:", appID);

            if (appID === 0 || serverSecret === "YOUR_ZEGO_SERVER_SECRET_HERE") {
                alert("Please update your Frontend .env file with valid ZegoCloud keys and restart the server!");
                return;
            }

            if (!appID || !serverSecret) {
                console.error("ZegoCloud keys are missing in .env");
                return;
            }

            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                appID,
                serverSecret,
                streamID,
                userdata?._id || "user" + Date.now(),
                (userdata?.name || "User") + " (User)"
            );

            const zp = ZegoUIKitPrebuilt.create(kitToken);
            zpRef.current = zp;

            zp.joinRoom({
                container: containerRef.current,
                scenario: {
                    mode: ZegoUIKitPrebuilt.LiveStreaming,
                    config: {
                        role: ZegoUIKitPrebuilt.Audience,
                    },
                },
            });
        };

        myMeeting();

        return () => {
            if (zpRef.current) {
                zpRef.current.destroy();
                zpRef.current = null;
            }
        };
    }, [streamID, userdata]);

    if (streamID) {
        return (
            <div className={hideHeader ? 'py-4' : 'my-10 mx-4 md:mx-[10%]'}>
                <button
                    onClick={() => navigate('/community?tab=live')}
                    className={`mb-4 flex items-center gap-2 font-bold transition-colors ${
                        isObsidian ? 'text-neutral-400 hover:text-[#E6C97A]' : 'text-gray-600 hover:text-green-600'
                    }`}
                >
                    <ArrowLeft size={16} /> Back to Channels
                </button>
                <div className={`mb-4 p-3 rounded-xl text-sm font-semibold border ${
                    isObsidian 
                        ? 'bg-[#E6C97A]/15 border-[#E6C97A]/25 text-[#E6C97A]' 
                        : 'bg-yellow-50 border-yellow-100 text-yellow-700'
                }`}>
                    Debug: Joined Room ID: {streamID}
                </div>
                <div
                    ref={containerRef}
                    style={{ width: '100%', height: 'calc(100vh - 150px)' }}
                ></div>
            </div>
        );
    }

    // Filter doctors to show only active streams
    const activeDoctors = doctors.filter(doc => activeStreams.includes(doc._id));

    // List of "Channels" (Doctors)
    return (
        <div className={hideHeader ? 'py-4' : 'my-10 mx-4 md:mx-[10%]'}>
            {!hideHeader && (
                <div className='text-center mb-12'>
                    <h1 className={`text-3xl font-black flex items-center justify-center gap-3 ${isObsidian ? 'text-white' : 'text-gray-800'}`}>
                        <Users className={`w-8 h-8 ${isObsidian ? 'text-[#E6C97A]' : 'text-red-500'}`} />
                        Live Channels
                    </h1>
                    <p className={`mt-2 ${isObsidian ? 'text-neutral-400' : 'text-gray-600'}`}>Join a doctor's live stream to get real-time advice.</p>
                </div>
            )}
            
            {/* Admin Streams Section */}
            {activeAdminStreams.length > 0 && (
                <div className="mb-12">
                    <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isObsidian ? 'text-white' : 'text-gray-800'}`}>
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        Official Admin Streams
                    </h2>
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                        {activeAdminStreams.map((adminId, index) => (
                            <div
                                key={index}
                                onClick={() => navigate(`/live-stream/${adminId}`)}
                                className={`rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group relative border ${
                                    isObsidian 
                                        ? 'bg-[#0E0E0E] border-zinc-800/80 text-white hover:border-[#E6C97A]/40 shadow-2xl' 
                                        : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100'
                                }`}
                            >
                                <div className={`h-48 flex items-center justify-center ${isObsidian ? 'bg-[#151515]' : 'bg-indigo-100'}`}>
                                    <img
                                        src="https://cdn-icons-png.flaticon.com/512/2206/2206368.png"
                                        alt="Admin Stream"
                                        className="w-20 h-20 opacity-80 group-hover:scale-110 transition-transform duration-300"
                                    />
                                </div>
                                <div className='absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                                    <span className='w-2 h-2 bg-white rounded-full animate-pulse'></span>
                                    LIVE
                                </div>
                                <div className='p-4'>
                                    <p className={`text-lg font-black ${isObsidian ? 'text-white' : 'text-indigo-900'}`}>PawVaidya Official</p>
                                    <p className={`text-sm ${isObsidian ? 'text-[#E6C97A]' : 'text-indigo-600'}`}>Admin Broadcast</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <h2 className={`text-xl font-bold mb-4 ${isObsidian ? 'text-white' : 'text-gray-800'}`}>Doctor Streams</h2>
            {activeDoctors.length === 0 ? (
                <div className={`text-center py-12 border-2 border-dashed rounded-2xl ${
                    isObsidian ? 'bg-[#0E0E0E] border-zinc-800/80 text-neutral-400 shadow-2xl' : 'border-gray-200 text-gray-500'
                }`}>
                    <p className="font-semibold">No doctors are currently live.</p>
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                    {activeDoctors.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(`/live-stream/${item._id}`)}
                            className={`rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border ${
                                isObsidian 
                                    ? 'bg-[#0E0E0E] border-zinc-800/80 text-white hover:border-[#E6C97A]/40 shadow-2xl' 
                                    : 'bg-white border-gray-100'
                            }`}
                        >
                            <div className='relative overflow-hidden'>
                                <img className='w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500' src={item.image} alt="" />
                                <div className='absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 opacity-100 transition-opacity'>
                                    <span className='w-2 h-2 bg-white rounded-full animate-pulse'></span>
                                    LIVE
                                </div>
                            </div>
                            <div className='p-4'>
                                <div className='flex items-center gap-2 text-sm text-center text-green-500 font-medium mb-1'>
                                    <span className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></span>
                                    <p className="text-red-500">Live Now</p>
                                </div>
                                <p className={`text-lg font-black line-clamp-1 ${isObsidian ? 'text-white' : 'text-gray-900'}`}>{item.name}</p>
                                <p className={`text-sm ${isObsidian ? 'text-neutral-400' : 'text-gray-500'}`}>{item.speciality}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LiveStreams;
