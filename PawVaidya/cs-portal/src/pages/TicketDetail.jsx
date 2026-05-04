import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CSContext } from '../context/CSContext';

const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cstoken, backendUrl } = useContext(CSContext);

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [newStatus, setNewStatus] = useState('');
    const [note, setNote] = useState('');
    const [callDate, setCallDate] = useState('');
    const [callTime, setCallTime] = useState('');
    const [callLink, setCallLink] = useState('');

    const fetchTicket = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/complaint/ticket/${id}`, {
                headers: { cstoken } // Using cstoken here as CS employee
            });
            if (data.success) {
                setTicket(data.ticket);
                setNewStatus(data.ticket.status);
            } else {
                toast.error(data.message);
                navigate('/queue');
            }
        } catch (error) {
            toast.error(error.message);
            navigate('/queue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicket();
        // Polling for real-time updates could be added here
        const interval = setInterval(fetchTicket, 10000);
        return () => clearInterval(interval);
    }, [id]);

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.put(`${backendUrl}/api/complaint/update-status/${id}`,
                { status: newStatus },
                { headers: { cstoken } }
            );
            if (data.success) {
                toast.success('Status updated');
                fetchTicket();
            } else toast.error(data.message);
        } catch (err) { toast.error(err.message); }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!note) return;
        try {
            const { data } = await axios.post(`${backendUrl}/api/complaint/add-note/${id}`,
                { message: note },
                { headers: { cstoken } }
            );
            if (data.success) {
                toast.success('Note added');
                setNote('');
                fetchTicket();
            } else toast.error(data.message);
        } catch (err) { toast.error(err.message); }
    };

    const handleScheduleCall = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.put(`${backendUrl}/api/complaint/schedule-call/${id}`,
                { date: callDate, time: callTime, link: callLink },
                { headers: { cstoken } }
            );
            if (data.success) {
                toast.success('Call scheduled & user notified');
                setCallDate(''); setCallTime(''); setCallLink('');
                fetchTicket();
            } else toast.error(data.message);
        } catch (err) { toast.error(err.message); }
    };

    const handleCloseTicket = async () => {
        if (!window.confirm("Are you sure you want to close this ticket?")) return;
        try {
            const { data } = await axios.put(`${backendUrl}/api/complaint/close/${id}`, {}, { headers: { cstoken } });
            if (data.success) {
                toast.success('Ticket closed successfully');
                fetchTicket();
            } else toast.error(data.message);
        } catch (err) { toast.error(err.message); }
    };

    if (loading || !ticket) return <div className="p-8 text-center text-slate-500">Loading details...</div>;

    const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white px-6 py-5 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{ticket.title}</h2>
                        <p className="text-sm text-slate-500 mt-1 uppercase tracking-wide">{ticket.category.replace('_', ' ')}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-800 uppercase tracking-wide">
                        {ticket.status.replace('_', ' ')}
                    </span>
                </div>
                <div className="mt-4 p-4 bg-slate-50 rounded-lg text-slate-700 whitespace-pre-wrap">
                    {ticket.description}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Timeline */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Timeline</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {ticket.timeline.map((event, idx) => (
                            <div key={idx} className="flex space-x-3">
                                <div className="flex flex-col items-center">
                                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5"></div>
                                    {idx !== ticket.timeline.length - 1 && <div className="h-full w-px bg-slate-200 my-1"></div>}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-800 capitalize">{event.event.replace('_', ' ')}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{new Date(event.timestamp).toLocaleString()}</p>
                                    {event.message && <p className="text-sm text-slate-600 mt-1">{event.message}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {!isClosed && (
                        <form onSubmit={handleAddNote} className="mt-4 flex space-x-2">
                            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Add a timeline note..."
                                className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-primary focus:border-primary text-sm" />
                            <button type="submit" className="px-4 py-2 bg-slate-800 text-white text-sm rounded hover:bg-slate-900 transition-colors">Post</button>
                        </form>
                    )}
                </div>

                {/* Actions */}
                <div className="space-y-6">
                    {!isClosed && (
                        <>
                            <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Update Status</h3>
                                <form onSubmit={handleUpdateStatus} className="flex space-x-3">
                                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                                        className="flex-1 border-slate-300 rounded focus:ring-primary focus:border-primary text-sm p-2 bg-slate-50 border">
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="scheduled_call">Scheduled Call</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                    <button type="submit" className="px-4 py-2 bg-primary text-white text-sm rounded transition-colors hover:bg-primary/90">Update</button>
                                </form>
                            </div>

                            <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Schedule Call</h3>
                                <form onSubmit={handleScheduleCall} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="date" required value={callDate} onChange={e => setCallDate(e.target.value)}
                                            className="px-3 py-2 border border-slate-300 rounded text-sm w-full" />
                                        <input type="time" required value={callTime} onChange={e => setCallTime(e.target.value)}
                                            className="px-3 py-2 border border-slate-300 rounded text-sm w-full" />
                                    </div>
                                    <input type="url" required placeholder="Meeting Link (e.g., Google Meet URL)" value={callLink} onChange={e => setCallLink(e.target.value)}
                                        className="px-3 py-2 border border-slate-300 rounded text-sm w-full" />
                                    <button type="submit" className="w-full px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors">
                                        Schedule & Send Email to User
                                    </button>
                                </form>
                            </div>
                        </>
                    )}

                    {ticket.scheduledCall && ticket.scheduledCall.date && (
                        <div className="bg-purple-50 p-5 rounded-lg border border-purple-200 text-purple-800">
                            <h3 className="font-bold mb-2">Scheduled Call Info:</h3>
                            <p className="text-sm font-medium">Date: {ticket.scheduledCall.date}</p>
                            <p className="text-sm font-medium mt-1">Time: {ticket.scheduledCall.time}</p>
                            <p className="text-sm mt-1">
                                Link: <a href={ticket.scheduledCall.link} target="_blank" rel="noreferrer" className="underline">{ticket.scheduledCall.link}</a>
                            </p>
                        </div>
                    )}

                    <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex flex-col items-center">
                        {isClosed ? (
                            <div className="text-green-600 font-bold text-center">
                                <p>🎫 This ticket is resolved/closed.</p>
                                {ticket.rating && (
                                    <div className="mt-2 text-slate-600 font-normal">
                                        <p className="text-sm font-semibold">User Rating: {ticket.rating.rating} / 5 ⭐</p>
                                        {ticket.rating.review && <p className="text-xs italic">"{ticket.rating.review}"</p>}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button onClick={handleCloseTicket} className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors">
                                Mark as Resolved & Close Ticket
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetail;
