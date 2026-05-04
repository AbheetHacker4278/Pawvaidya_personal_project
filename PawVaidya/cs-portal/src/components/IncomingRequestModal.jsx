import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { CSContext } from '../context/CSContext';
import { toast } from 'react-toastify';
import { FaClock, FaCheck, FaTimes } from 'react-icons/fa';

const IncomingRequestModal = () => {
    const { backendUrl, cstoken, employee, incomingRequests, setIncomingRequests, fetchIncomingRequests } = useContext(CSContext);
    const [timeLeft, setTimeLeft] = useState({});

    // Process requests to calculate time left
    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = {};
            incomingRequests.forEach(req => {
                const requestedAt = new Date(req.requestedAt).getTime();
                const now = new Date().getTime();
                const diff = (requestedAt + 5 * 60 * 1000) - now;

                if (diff > 0) {
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    newTimeLeft[req._id] = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                } else {
                    newTimeLeft[req._id] = 'Expired';
                    // Optional: auto-fetch to clear expired requests from UI
                }
            });
            setTimeLeft(newTimeLeft);
        }, 1000);

        return () => clearInterval(timer);
    }, [incomingRequests]);

    const handleAccept = async (ticketId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/complaint/accept', { employeeId: employee._id, ticketId }, { headers: { cstoken } });
            if (data.success) {
                toast.success('Ticket accepted!');
                fetchIncomingRequests();
                // Redirect to ticket queue or dashboard
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleReject = async (ticketId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/complaint/reject', { employeeId: employee._id, ticketId }, { headers: { cstoken } });
            if (data.success) {
                toast.info('Ticket rejected and reassigned.');
                fetchIncomingRequests();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (incomingRequests.length === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-emerald-600 p-6 text-white text-center">
                    <h2 className="text-xl font-bold">New Query Request</h2>
                    <p className="text-emerald-100 text-sm mt-1">You have {incomingRequests.length} incoming support {incomingRequests.length === 1 ? 'request' : 'requests'}</p>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                    {incomingRequests.map((req) => (
                        <div key={req._id} className="p-6 border-b border-gray-100 last:border-0">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">{req.title}</h3>
                                    <p className="text-sm text-gray-500 capitalize">{req.category.replace('_', ' ')}</p>
                                </div>
                                <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-100 flex items-center">
                                    <FaClock size={12} className="mr-1.5" />
                                    {timeLeft[req._id] || '5:00'}
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                {req.description}
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleReject(req._id)}
                                    className="flex items-center justify-center py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    <FaTimes className="mr-2" /> Reject
                                </button>
                                <button
                                    onClick={() => handleAccept(req._id)}
                                    className="flex items-center justify-center py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                                >
                                    <FaCheck className="mr-2" /> Accept
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default IncomingRequestModal;
