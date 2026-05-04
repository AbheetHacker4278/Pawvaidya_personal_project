import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const MyTickets = () => {
    const { token, backendUrl } = useContext(AppContext);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchTickets = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/complaint/my-tickets`, {
                headers: { token }
            });
            if (data.success) {
                setTickets(data.tickets);
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchTickets();
    }, [token]);

    const getStatusBadge = (status) => {
        const colors = {
            open: 'bg-red-100 text-red-800',
            in_progress: 'bg-blue-100 text-blue-800',
            scheduled_call: 'bg-purple-100 text-purple-800',
            resolved: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800'
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-bold leading-none uppercase tracking-wide inline-flex items-center ${colors[status] || 'bg-gray-100'}`}>{status.replace('_', ' ')}</span>;
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading your tickets...</div>;

    return (
        <div className="max-w-4xl mx-auto my-10 px-4 sm:px-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">My Support Tickets</h1>
                <button
                    onClick={() => navigate('/support')}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                >
                    Raise New Ticket
                </button>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden text-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ticket</th>
                            <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date Created</th>
                            <th className="px-6 py-3 text-right font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tickets.map(ticket => (
                            <tr key={ticket._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{ticket.title}</div>
                                    <div className="text-xs text-gray-500 capitalize">{ticket.category.replace('_', ' ')}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(ticket.status)}
                                </td>
                                <td className="px-6 py-4 text-gray-500 hidden sm:table-cell">
                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => navigate(`/ticket-tracking/${ticket._id}`)}
                                        className="text-primary hover:underline font-medium border border-primary/20 px-3 py-1.5 rounded bg-primary/5 hover:bg-primary/10 transition-colors"
                                    >
                                        Track Status →
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {tickets.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        You have not raised any support tickets.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTickets;
