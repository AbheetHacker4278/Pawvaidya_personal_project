import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CSContext } from '../context/CSContext';
import { FaTicketAlt, FaStar, FaCheckCircle, FaUserClock } from 'react-icons/fa';

const CSDashboard = () => {
    const { cstoken, backendUrl, employee } = useContext(CSContext);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = async () => {
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
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, [cstoken]);

    if (loading) return <div className="text-center p-12">Loading dashboard...</div>;

    const openCount = queue.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const resolvedCount = queue.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const scheduledCount = queue.filter(t => t.status === 'scheduled_call').length;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Welcome, {employee?.name}</h1>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><FaTicketAlt size={24} /></div>
                    <div>
                        <p className="text-slate-500 text-sm">Active Tickets</p>
                        <h3 className="text-2xl font-bold text-slate-800">{openCount}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full"><FaCheckCircle size={24} /></div>
                    <div>
                        <p className="text-slate-500 text-sm">Resolved / Closed</p>
                        <h3 className="text-2xl font-bold text-slate-800">{resolvedCount}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><FaUserClock size={24} /></div>
                    <div>
                        <p className="text-slate-500 text-sm">Scheduled Calls</p>
                        <h3 className="text-2xl font-bold text-slate-800">{scheduledCount}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
                    <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full"><FaStar size={24} /></div>
                    <div>
                        <p className="text-slate-500 text-sm">My Avg Rating</p>
                        <h3 className="text-2xl font-bold text-slate-800">{employee?.averageRating?.toFixed(1) || '0.0'}</h3>
                    </div>
                </div>
            </div>

            {/* Detailed Earnings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 bg-emerald-50/10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <span className="w-2 h-8 bg-emerald-500 rounded-full mr-3"></span>
                        Detailed Earnings
                    </h2>
                    <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Projected</p>
                        <p className="text-3xl font-black text-emerald-600">
                            ₹{(15000 + (employee?.fiveStarCount || 0) * 800 + (
                                (employee?.adminIncentive?.amount && employee?.adminIncentive?.expiresAt && new Date(employee.adminIncentive.expiresAt) > new Date())
                                    ? employee.adminIncentive.amount : 0
                            )).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-lg bg-white border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Fixed Salary</p>
                        <p className="text-xl font-bold text-slate-700">₹15,000</p>
                        <p className="text-[10px] text-slate-400 mt-1">Monthly base compensation</p>
                    </div>

                    <div className="p-4 rounded-lg bg-white border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Rating Bonus (5★)</p>
                        <p className="text-xl font-bold text-slate-700">₹{((employee?.fiveStarCount || 0) * 800).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{employee?.fiveStarCount || 0} tickets × ₹800</p>
                    </div>

                    <div className="p-4 rounded-lg bg-white border border-slate-100 shadow-sm relative overflow-hidden">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Admin Incentive</p>
                        <p className="text-xl font-bold text-purple-600">
                            ₹{(employee?.adminIncentive?.amount && employee?.adminIncentive?.expiresAt && new Date(employee.adminIncentive.expiresAt) > new Date())
                                ? employee.adminIncentive.amount.toLocaleString() : '0'}
                        </p>
                        {employee?.adminIncentive?.expiresAt && new Date(employee.adminIncentive.expiresAt) > new Date() ? (
                            <p className="text-[10px] text-purple-400 mt-1">
                                Active until {new Date(employee.adminIncentive.expiresAt).toLocaleDateString()}
                            </p>
                        ) : (
                            <p className="text-[10px] text-slate-400 mt-1">No active special incentive</p>
                        )}
                        {employee?.adminIncentive?.amount > 0 && new Date(employee.adminIncentive.expiresAt) <= new Date() && (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] px-2 py-0.5 transform rotate-45 translate-x-3 translate-y-1">EXPIRED</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Warning if profile not fully compliant (extra info) */}
            {!employee?.profileComplete && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center">
                    <span className="font-bold mr-2">Action Required:</span>
                    Please complete your full profile details before the deadline to avoid account suspension.
                </div>
            )}

        </div>
    );
};

export default CSDashboard;
