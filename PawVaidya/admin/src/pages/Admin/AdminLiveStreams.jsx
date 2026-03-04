import React, { useContext, useEffect, useState, useRef } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const AdminLiveStreams = () => {
    const { atoken, backendurl, doctors, getalldoctors, adminProfile } = useContext(AdminContext);
    const containerRef = useRef(null);
    const zpRef = useRef(null);
    const socketRef = useRef(null);
    const navigate = useNavigate();

    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [activeDoctorStreams, setActiveDoctorStreams] = useState([]);

    // For Broadcasting
    const roomID = adminProfile?._id || 'admin-main-stream';
    const adminName = adminProfile?.name || 'Admin';

    useEffect(() => {
        if (atoken) {
            getalldoctors();
        }
    }, [atoken]);

    useEffect(() => {
        // Socket for monitoring doctors
        const socket = io(backendurl, {
            withCredentials: true,
            transports: ['polling', 'websocket']
        });
        socket.emit('request-active-streams');

        socket.on('active-live-streams', (streams) => {
            setActiveDoctorStreams(streams);
        });

        return () => socket.disconnect();
    }, [backendurl]);

    // Broadcasting Logic
    useEffect(() => {
        if (!isBroadcasting || !containerRef.current || !atoken) return;

        socketRef.current = io(backendurl, {
            withCredentials: true,
            transports: ['polling', 'websocket']
        });
        socketRef.current.emit('start-admin-stream', roomID);
        console.log("Emitted start-admin-stream for:", roomID);

        if (zpRef.current) {
            zpRef.current.destroy();
            zpRef.current = null;
        }

        const myMeeting = async () => {
            const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
            const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

            if (!appID || !serverSecret) return;

            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                appID, serverSecret, roomID, roomID, adminName
            );

            const zp = ZegoUIKitPrebuilt.create(kitToken);
            zpRef.current = zp;

            zp.joinRoom({
                container: containerRef.current,
                scenario: {
                    mode: ZegoUIKitPrebuilt.LiveStreaming,
                    config: { role: ZegoUIKitPrebuilt.Host },
                },
                sharedLinks: [{
                    name: 'Join as audience',
                    url: window.location.protocol + '//' + window.location.host.replace("5174", "5173") + '/live-stream/' + roomID,
                }],
            });
        };

        myMeeting();

        return () => {
            if (zpRef.current) {
                zpRef.current.destroy();
                zpRef.current = null;
            }
            if (socketRef.current) {
                socketRef.current.emit('end-admin-stream', roomID);
                socketRef.current.disconnect();
            }
        };
    }, [isBroadcasting, atoken, backendurl, adminProfile]);

    const activeDoctorsList = doctors.filter(doc => activeDoctorStreams.includes(doc._id));

    if (!atoken) return <div>Please login first.</div>;

    if (isBroadcasting) {
        return (
            <div className='m-5'>
                <button
                    onClick={() => setIsBroadcasting(false)}
                    className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                >
                    Stop Broadcasting & Return
                </button>
                <div className='mb-6'>
                    <h1 className='text-2xl font-bold text-gray-800'>Broadcasting as Admin</h1>
                    <div className="bg-green-50 p-2 rounded mt-2 text-sm text-green-800 border border-green-200">
                        <strong>Live:</strong> You are streaming as "{adminName}".
                    </div>
                </div>
                <div className="myCallContainer" ref={containerRef} style={{ width: '100%', height: 'calc(100vh - 200px)' }}></div>
            </div>
        );
    }

    return (
        <div className='m-5'>
            <div className="flex justify-between items-center mb-8">
                <h1 className='text-2xl font-bold text-gray-800'>Live Streams Management</h1>
                <button
                    onClick={() => setIsBroadcasting(true)}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition shadow-lg flex items-center gap-2"
                >
                    <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                    Start Admin Broadcast
                </button>
            </div>

            <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Active Doctor Streams</h2>

            {activeDoctorsList.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">No doctors are currently live.</p>
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                    {activeDoctorsList.map((doc) => (
                        <div key={doc._id} className='bg-white rounded-xl shadow border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300'>
                            <div className="relative">
                                <img src={doc.image} alt="" className='w-full h-48 object-cover' />
                                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> LIVE
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className='font-bold text-lg text-gray-800'>{doc.name}</h3>
                                <p className='text-gray-500 text-sm mb-4'>{doc.speciality}</p>
                                <button
                                    onClick={() => navigate(`/admin-watch-stream/${doc._id}`)}
                                    className='w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition'
                                >
                                    Watch Stream
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminLiveStreams;
