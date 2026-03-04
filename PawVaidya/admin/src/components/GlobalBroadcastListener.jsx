import React, { useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/DoctorContext';

const GlobalBroadcastListener = () => {
    const { backendurl } = useContext(AdminContext) || { backendurl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000' };
    const { dtoken } = useContext(DoctorContext) || { dtoken: '' };

    useEffect(() => {
        const socket = io(backendurl, {
            withCredentials: true,
            transports: ['polling', 'websocket']
        });

        socket.on('admin-broadcast', (data) => {
            console.log('Received system broadcast:', data);

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
                    <p className="text-[9px] opacity-70 italic font-bold">Sent at {new Date(data.timestamp).toLocaleTimeString()}</p>
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
            console.log('Received emergency alert in admin:', data);
            toast.error(
                <div className="flex flex-col gap-1">
                    <p className="font-black text-xs uppercase tracking-widest animate-pulse">🛑 CRITICAL EMERGENCY</p>
                    <p className="text-sm font-bold">{data.message}</p>
                    <p className="text-[9px] opacity-80 italic">Activated: {new Date(data.timestamp).toLocaleTimeString()}</p>
                </div>,
                {
                    position: "bottom-right",
                    autoClose: false,
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

    return null; // This component doesn't render anything visible directly
};

export default GlobalBroadcastListener;
