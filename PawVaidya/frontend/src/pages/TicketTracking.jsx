import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaClock, FaPhoneAlt, FaStar, FaInfoCircle } from 'react-icons/fa';

const TicketTracking = () => {
    const { id } = useParams();
    const { token, backendUrl } = useContext(AppContext);
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const handleCloseTicket = async () => {
        if (!window.confirm("Are you sure you want to close this ticket?")) return;
        try {
            const { data } = await axios.put(`${backendUrl}/api/complaint/user-close/${id}`, {}, {
                headers: { token }
            });
            if (data.success) {
                toast.success('Ticket closed successfully');
                fetchTicket();
            } else toast.error(data.message);
        } catch (error) { toast.error(error.message); }
    };

    const fetchTicket = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/complaint/ticket/${id}`, {
                headers: { token }
            });
            if (data.success) {
                setTicket(data.ticket);
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
            navigate('/my-tickets');
        } finally {
            setLoading(false);
        }
    };

    // Use polling for real-time updates as per plan or every 10s
    useEffect(() => {
        if (!token) return;
        fetchTicket();
        const intv = setInterval(fetchTicket, 10000);
        return () => clearInterval(intv);
    }, [id, token]);

    if (loading || !ticket) return <div className="p-12 text-center text-gray-500">Loading ticket details...</div>;

    const timelineReversed = [...ticket.timeline].reverse();

    const getStatusIcon = (status) => {
        if (status === 'closed' || status === 'resolved') return <FaCheckCircle className="text-green-500" />;
        if (status === 'scheduled_call') return <FaPhoneAlt className="text-purple-500" />;
        if (status === 'in_progress') return <FaClock className="text-blue-500" />;
        return <FaInfoCircle className="text-red-500" />;
    };

    const isMeetActive = (dateStr, timeStr) => {
        if (!dateStr || !timeStr) return false;
        try {
            const [year, month, day] = dateStr.split('-').map(Number);
            const [hours, minutes] = timeStr.split(':').map(Number);
            const meetingTime = new Date(year, month - 1, day, hours, minutes);
            const now = new Date();
            const timeDiffMinutes = (meetingTime - now) / (1000 * 60);
            return timeDiffMinutes <= 5;
        } catch (e) { return false; }
    };

    return (
        <div className="max-w-4xl mx-auto my-10 px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{ticket.title}</h1>
                            <p className="text-sm text-gray-500 mt-1 capitalize">Category: {ticket.category.replace('_', ' ')}</p>
                        </div>
                        <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            {getStatusIcon(ticket.status)}
                            <span className="font-bold text-gray-700 capitalize text-sm">{ticket.status.replace('_', ' ')}</span>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg mt-4 text-gray-700 text-sm leading-relaxed border border-gray-100 min-h-[100px]">
                        {ticket.description}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Status Timeline</h2>
                    <div className="relative border-l-2 border-primary/20 ml-3 space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {timelineReversed.map((note, idx) => (
                            <div key={idx} className="relative pl-6">
                                <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${idx === 0 ? 'bg-primary scale-110 shadow-sm shadow-primary/40' : 'bg-gray-300'}`}></span>
                                <div className="text-xs text-gray-400 font-medium mb-1 relative top-[-2px]">{new Date(note.timestamp).toLocaleString()}</div>
                                <div className="text-sm text-gray-800 bg-gray-50/50 p-3 rounded-lg border border-gray-100/50">{note.message}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-primary/20 bg-emerald-50/20">
                    <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Assigned Agent</h3>
                    {ticket.assignedTo ? (
                        <div className="flex items-center space-x-4">
                            <img src={ticket.assignedTo.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.assignedTo.name)}&background=random`} alt="Agent" className="w-12 h-12 rounded-full border border-gray-200" />
                            <div>
                                <p className="font-bold text-emerald-800">{ticket.assignedTo.name}</p>
                                <p className="text-xs text-gray-500">Customer Success</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">We are currently assigning an agent to your ticket...</p>
                    )}
                </div>

                {ticket.scheduledCall?.date && ticket.status !== 'closed' && (
                    <div className="bg-purple-50 p-5 rounded-xl shadow-sm border border-purple-200">
                        <div className="flex items-center text-purple-700 font-bold mb-2">
                            <FaPhoneAlt className="mr-2" /> Call Scheduled
                        </div>
                        <p className="text-sm text-purple-900 mb-1">Our agent will call you on:</p>
                        <p className="text-base font-black text-purple-800 bg-white px-3 py-2 rounded-md border border-purple-100 mt-2">
                            {ticket.scheduledCall.date} at {ticket.scheduledCall.time}
                        </p>

                        {ticket.scheduledCall.link && (
                            <div className="mt-4">
                                {isMeetActive(ticket.scheduledCall.date, ticket.scheduledCall.time) ? (
                                    <a
                                        href={ticket.scheduledCall.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition-transform active:scale-95"
                                    >
                                        Join Meeting Now
                                    </a>
                                ) : (
                                    <button
                                        disabled
                                        className="inline-flex items-center justify-center w-full bg-gray-200 text-gray-400 font-bold py-2 rounded-lg cursor-not-allowed border border-gray-300"
                                    >
                                        Link Locked (Wait till 5 mins before)
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {ticket.status === 'closed' && !ticket.isRated && (
                    <div className="bg-yellow-50 p-5 rounded-xl shadow-sm border border-yellow-200 text-center">
                        <div className="text-yellow-500 flex justify-center mb-2"><FaStar size={24} /></div>
                        <p className="text-sm text-yellow-800 font-medium mb-3">Ticket Closed! How did we do?</p>
                        <button
                            onClick={() => navigate(`/rate-cs/${ticket._id}`)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 w-full rounded-lg transition-colors"
                        >
                            Rate Agent
                        </button>
                    </div>
                )}

                {ticket.status !== 'closed' && (
                    <button
                        onClick={handleCloseTicket}
                        disabled={ticket.scheduledCall?.date && !isMeetActive(ticket.scheduledCall.date, ticket.scheduledCall.time)}
                        className={`w-full py-2 font-bold rounded-lg border transition-colors text-sm ${ticket.scheduledCall?.date && !isMeetActive(ticket.scheduledCall.date, ticket.scheduledCall.time)
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                            }`}
                    >
                        {ticket.scheduledCall?.date && !isMeetActive(ticket.scheduledCall.date, ticket.scheduledCall.time)
                            ? 'Close Ticket (Locked till call)'
                            : 'Close Ticket'}
                    </button>
                )}

                <button
                    onClick={() => navigate('/my-tickets')}
                    className="w-full py-2 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                    ← Back to Tickets
                </button>
            </div>
        </div>
    );
};

export default TicketTracking;
