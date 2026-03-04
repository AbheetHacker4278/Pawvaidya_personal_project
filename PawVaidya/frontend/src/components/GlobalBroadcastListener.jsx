import React, { useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';

const GlobalBroadcastListener = () => {
    const { backendurl, getSystemConfig } = useContext(AppContext);

    useEffect(() => {
        if (!backendurl) return;

        const socket = io(backendurl, {
            withCredentials: true,
            transports: ['polling', 'websocket']
        });

        socket.on('system-config-update', () => {
            console.log("System configuration updated. Refreshing state...");
            getSystemConfig();
        });

        socket.on('admin-broadcast', (data) => {
            console.log('Received system broadcast on patient portal:', data);

            const toastOptions = {
                position: "top-center",
                autoClose: data.duration || 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
            };

            const content = (
                <div className="flex flex-col gap-1">
                    <p className="font-black text-xs uppercase tracking-widest">{data.type === 'emergency' ? '🚨 EMERGENCY ALERT' : data.type === 'warning' ? '⚠️ SYSTEM WARNING' : '📢 SYSTEM ANNOUNCEMENT'}</p>
                    <p className="text-sm font-medium">{data.message}</p>
                    <p className="text-[9px] opacity-70 italic font-bold text-white/80">Received: {new Date(data.timestamp).toLocaleTimeString()}</p>
                </div>
            );

            if (data.type === 'emergency') {
                toast.error(content, toastOptions);
            } else if (data.type === 'warning') {
                toast.warning(content, toastOptions);
            } else {
                toast.info(content, toastOptions);
            }
        });

        socket.on('emergency-alert', (data) => {
            console.log('Received emergency alert:', data);
            toast.error(
                <div className="flex flex-col gap-1">
                    <p className="font-black text-xs uppercase tracking-widest animate-pulse">🛑 CRITICAL EMERGENCY</p>
                    <p className="text-sm font-bold">{data.message}</p>
                    <p className="text-[9px] opacity-80 italic">Activated: {new Date(data.timestamp).toLocaleTimeString()}</p>
                </div>,
                {
                    position: "top-center",
                    autoClose: false, // Must be dismissed manually
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: false,
                    theme: "colored",
                    icon: "🚨"
                }
            );
        });

        return () => {
            socket.off('admin-broadcast');
            socket.off('emergency-alert');
            socket.disconnect();
        };
    }, [backendurl]);

    return null;
};

export default GlobalBroadcastListener;
