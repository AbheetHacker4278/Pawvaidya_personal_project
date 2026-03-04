
import React, { useContext, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const AdminWatchStream = () => {
    const { docId } = useParams();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const zpRef = useRef(null);

    useEffect(() => {
        if (!docId || !containerRef.current) return;

        if (zpRef.current) {
            zpRef.current.destroy();
            zpRef.current = null;
        }

        const myMeeting = async () => {
            const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
            const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

            if (!appID || !serverSecret) {
                console.error("ZegoCloud keys are missing in .env");
                return;
            }

            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                appID,
                serverSecret,
                docId, // Room ID is Doctor ID
                "admin" + Date.now(),
                "Admin"
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
                showUserList: true,
            });
        };

        myMeeting();

        return () => {
            if (zpRef.current) {
                zpRef.current.destroy();
                zpRef.current = null;
            }
        };

    }, [docId]);

    return (
        <div className='m-5'>
            <button
                onClick={() => navigate('/admin-live-streams')}
                className="mb-4 text-gray-600 hover:text-green-600"
            >
                ← Back to List
            </button>
            <div
                ref={containerRef}
                style={{ width: '100%', height: 'calc(100vh - 150px)' }}
            ></div>
        </div>
    );
};

export default AdminWatchStream;
