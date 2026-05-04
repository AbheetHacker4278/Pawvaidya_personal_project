import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';

const CSTicketsOverview = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchTickets = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/all-tickets`, {
                headers: { atoken }
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
        fetchTickets();
    }, [atoken]);

    if (loading) return <div className="p-8">Loading tickets...</div>;

    const filteredTickets = statusFilter === 'all'
        ? tickets
        : tickets.filter(t => t.status === statusFilter);

    const getStatusBadge = (status) => {
        const colors = {
            open: 'bg-red-100 text-red-800',
            in_progress: 'bg-blue-100 text-blue-800',
            scheduled_call: 'bg-purple-100 text-purple-800',
            resolved: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800'
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-bold leading-none ${colors[status] || 'bg-gray-100'}`}>{status.replace('_', ' ')}</span>;
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Global Ticket Overview</h1>
                    <p className="text-sm text-gray-500">Monitor all customer service complaints</p>
                </div>
                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-emerald-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="scheduled_call">Scheduled Call</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Agent</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client (User ID)</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredTickets.map((ticket) => (
                            <tr key={ticket._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                                    <div className="text-xs text-gray-500 truncate w-48">{ticket.description}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                                    {ticket.category.replace('_', ' ')}
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(ticket.status)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {ticket.assignedTo ? (
                                        <div className="flex items-center space-x-2">
                                            <span className="font-semibold text-emerald-700">{ticket.assignedTo.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                                    <div className="font-semibold text-gray-700">{ticket.userId?.name || 'Deleted User'}</div>
                                    <div>{ticket.userId?.email || ''}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {filteredTickets.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No tickets found for this filter.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CSTicketsOverview;
