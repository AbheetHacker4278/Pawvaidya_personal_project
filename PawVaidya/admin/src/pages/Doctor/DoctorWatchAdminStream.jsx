import React, { useContext, useEffect, useState, useRef } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { io } from 'socket.io-client';

const DoctorWatchAdminStream = () => {
    const { dtoken, profileData, backendurl } = useContext(DoctorContext);
    const navigate = useNavigate();
    const [activeAdminStreams, setActiveAdminStreams] = useState([]);
    const [streamID, setStreamID] = useState(null);
    const containerRef = useRef(null);
    const zpRef = useRef(null);

    // Socket Listener for Active Admin Streams
    useEffect(() => {
        const socket = io(backendurl, {
            withCredentials: true,
            transports: ['polling', 'websocket']
        });
        socket.emit('request-active-admin-streams');

        socket.on('active-admin-streams', (streams) => {
            setActiveAdminStreams(streams);
        });

        return () => {
            socket.disconnect();
        };
    }, [backendurl]);

    // Handle joining stream
    useEffect(() => {
        if (!streamID || !containerRef.current || !profileData) return;

        if (zpRef.current) {
            zpRef.current.destroy();
            zpRef.current = null;
        }

        const myMeeting = async () => {
            const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
            const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

            if (!appID || !serverSecret) return;

            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                appID,
                serverSecret,
                streamID,
                profileData._id,
                profileData.name + " (Doctor)"
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
    }, [streamID, profileData]);

    if (streamID) {
        return (
            <div className='m-5'>
                <button
                    onClick={() => setStreamID(null)}
                    className="mb-4 text-gray-600 hover:text-green-600 flex items-center gap-2"
                >
                    ← Back to List
                </button>
                <div
                    ref={containerRef}
                    style={{ width: '100%', height: 'calc(100vh - 150px)' }}
                ></div>
            </div>
        );
    }

    return (
        <div className='m-5'>
            <h1 className='text-2xl font-bold mb-5'>Admin Live Streams</h1>

            {activeAdminStreams.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">No active admin streams at the moment.</p>
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                    {activeAdminStreams.map((id, index) => (
                        <div key={index} className='bg-indigo-50 p-6 rounded-lg shadow border border-indigo-100 flex flex-col items-center text-center'>
                            <div className="bg-indigo-100 p-4 rounded-full mb-4">
                                <img src="https://cdn-icons-png.flaticon.com/512/2206/2206368.png" className="w-12 h-12 opacity-80" alt="Admin" />
                            </div>
                            <h3 className='font-bold text-lg text-indigo-900'>PawVaidya Official</h3>
                            <p className="text-indigo-600 mb-4">Admin Broadcast</p>
                            <button
                                onClick={() => setStreamID(id)}
                                className='w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition flex items-center justify-center gap-2'
                            >
                                Watch Stream
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DoctorWatchAdminStream;
