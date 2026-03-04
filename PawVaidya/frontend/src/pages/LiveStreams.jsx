
import React, { useContext, useEffect, useState, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutGrid, Users } from 'lucide-react';
import { io } from 'socket.io-client';

const LiveStreams = () => {
    const { doctors, userdata, backendurl } = useContext(AppContext);
    const navigate = useNavigate();
    const [activeStreams, setActiveStreams] = useState([]);
    const [activeAdminStreams, setActiveAdminStreams] = useState([]);

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
            <div className='my-10 mx-4 md:mx-[10%]'>
                <button
                    onClick={() => navigate('/live-streams')}
                    className="mb-4 text-gray-600 hover:text-green-600 flex items-center gap-2"
                >
                    ← Back to Channels
                </button>
                <div className='mb-4 bg-yellow-50 p-2 rounded text-sm text-yellow-700'>
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
        <div className='my-10 mx-4 md:mx-[10%]'>
            <div className='text-center mb-12'>
                <h1 className='text-3xl font-bold text-gray-800 flex items-center justify-center gap-3'>
                    <Users className='w-8 h-8 text-red-500' />
                    Live Channels
                </h1>
                <p className='text-gray-600 mt-2'>Join a doctor's live stream to get real-time advice.</p>
            </div>

            {/* Admin Streams Section */}
            {activeAdminStreams.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        Official Admin Streams
                    </h2>
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                        {activeAdminStreams.map((adminId, index) => (
                            <div
                                key={index}
                                onClick={() => navigate(`/live-stream/${adminId}`)}
                                className='bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group relative'
                            >
                                <div className='h-48 flex items-center justify-center bg-indigo-100'>
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
                                    <p className='text-lg font-bold text-indigo-900'>PawVaidya Official</p>
                                    <p className='text-indigo-600 text-sm'>Admin Broadcast</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <h2 className="text-xl font-bold text-gray-800 mb-4">Doctor Streams</h2>
            {activeDoctors.length === 0 ? (
                <div className="text-center text-gray-500 py-10 border-2 border-dashed border-gray-200 rounded-xl">
                    <p>No doctors are currently live.</p>
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                    {activeDoctors.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(`/live-stream/${item._id}`)}
                            className='bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group'
                        >
                            <div className='relative'>
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
                                <p className='text-lg font-bold text-gray-900 line-clamp-1'>{item.name}</p>
                                <p className='text-gray-500 text-sm'>{item.speciality}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LiveStreams;
