
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
                scenario: {
                    mode: ZegoUIKitPrebuilt.LiveStreaming,
                    config: {
                        role: ZegoUIKitPrebuilt.Host,
                    },
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
        return <div className='m-5'>Loading Doctor Profile to initialize Stream...</div>;
    }

    return (
        <div className='m-5'>
            <div className='mb-6'>
                <h1 className='text-2xl font-bold text-gray-800'>Live Stream</h1>
                <p className='text-gray-600'>Start your live session to connect with pet owners.</p>
                <div className="bg-yellow-100 p-2 rounded mt-2 text-sm text-yellow-800">
                    <strong>Debug Info:</strong> Room ID: {roomID}
                </div>
            </div>

            <div
                className="myCallContainer"
                ref={containerRef}
                style={{ width: '100%', height: 'calc(100vh - 150px)' }}
            ></div>
        </div>
    );
};

export default DoctorLiveStream;
