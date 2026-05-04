import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { CSContext } from '../context/CSContext';

const ComplaintQueue = () => {
    const { cstoken, backendUrl, employee } = useContext(CSContext);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchQueue = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const { data } = await axios.get(`${backendUrl}/api/complaint/employee/queue`, {
                headers: { cstoken }
            });
            if (data.success) {
                setQueue(data.tickets);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleAccept = async (ticketId) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/complaint/accept`, { employeeId: employee._id, ticketId }, { headers: { cstoken } });
            if (data.success) {
                toast.success('Ticket accepted!');
                fetchQueue();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleReject = async (ticketId) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/complaint/reject`, { employeeId: employee._id, ticketId }, { headers: { cstoken } });
            if (data.success) {
                toast.info('Ticket rejected and reassigned.');
                fetchQueue();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(() => fetchQueue(false), 2000); // Near real-time refresh
        return () => clearInterval(interval);
    }, [cstoken]);

    const getStatusColor = (status) => {
        const colors = {
            open: 'bg-red-100 text-red-800',
            in_progress: 'bg-blue-100 text-blue-800',
            scheduled_call: 'bg-purple-100 text-purple-800',
            resolved: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) return <div className="text-center p-12">Loading queue...</div>;

    return (
        <div className="bg-white shadow rounded-lg px-4 py-5 sm:p-6 text-slate-800">
            <h2 className="text-lg font-medium border-b border-slate-200 pb-4 mb-4">Assigned Complaints</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {queue.map(ticket => (
                            <tr key={ticket._id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{ticket.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{ticket.category.replace('_', ' ')}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {ticket.assignedTo ? (
                                        <button
                                            onClick={() => navigate(`/ticket/${ticket._id}`)}
                                            className="text-primary hover:text-primary/80"
                                        >
                                            View Details
                                        </button>
                                    ) : (
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={() => handleReject(ticket._id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleAccept(ticket._id)}
                                                className="bg-emerald-600 text-white px-3 py-1 rounded-md hover:bg-emerald-700 shadow-sm transition-colors"
                                            >
                                                Accept
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {queue.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                    You have no assigned tickets right now. Good job!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComplaintQueue;
