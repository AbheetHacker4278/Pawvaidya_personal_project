import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';
import { useNavigate } from 'react-router-dom';

const CSEmployees = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();

    const fetchEmployees = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/all-employees`, {
                headers: { atoken }
            });
            if (data.success) {
                setEmployees(data.employees);
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [atoken]);

    const handleCreateEmployee = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${backendurl}/api/cs-admin/create-employee`,
                { name, email, password },
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success('Employee created successfully');
                setShowModal(false);
                setName(''); setEmail(''); setPassword('');
                fetchEmployees();
            } else toast.error(data.message);
        } catch (err) { toast.error(err.response?.data?.message || err.message); }
    };

    const toggleSuspension = async (id, isSuspended) => {
        try {
            const endpoint = isSuspended ? 'unsuspend' : 'suspend';
            const { data } = await axios.put(`${backendurl}/api/cs-admin/${endpoint}/${id}`, {}, { headers: { atoken } });
            if (data.success) {
                toast.success(`Employee ${isSuspended ? 'unsuspended' : 'suspended'}`);
                fetchEmployees();
            } else toast.error(data.message);
        } catch (err) { toast.error(err.message); }
    };

    if (loading) return <div className="p-8">Loading employees...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Support Employees</h1>
                    <p className="text-sm text-gray-500">Manage Customer Service Agents</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/cs-chat')}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all shadow-md flex items-center gap-2 text-sm font-bold active:scale-95"
                    >
                        <span>💬</span> Agent Inbox
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-all shadow-md flex items-center gap-2 text-sm font-bold active:scale-95"
                    >
                        <span>+</span> Add Employee
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Agent Info</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Account Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Performance Metrics</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Tickets</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Management</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {employees.map((emp) => (
                            <tr key={emp._id} className="hover:bg-slate-50/50 transition-all duration-200 group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center">
                                        <div className="relative">
                                            <img src={emp.profilePic || 'https://via.placeholder.com/40'} alt="" className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
                                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{emp.name}</div>
                                            <div className="text-xs text-slate-500 font-medium">{emp.email}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                {!emp.profileComplete && (
                                                    <span className="inline-block text-[9px] px-1.5 py-0.5 bg-orange-50 text-orange-600 font-bold rounded uppercase tracking-tighter">Profile Incomplete</span>
                                                )}
                                                {emp.faceVerified && (
                                                    <span className="inline-block text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded uppercase tracking-tighter">Face ID Verified</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest
                                        ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                            emp.status === 'suspended' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                        {emp.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="space-y-1.5 max-w-[240px]">
                                        <div className="flex items-center space-x-1">
                                            <div className="flex text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className={`w-3.5 h-3.5 ${i < Math.round(emp.averageRating || 0) ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">{emp.averageRating ? emp.averageRating.toFixed(1) : '0.0'}</span>
                                        </div>
                                        {emp.latestReview ? (
                                            <div className="text-[10px] text-slate-500 italic line-clamp-1 border-l-2 border-emerald-500 pl-2 py-0.5">
                                                "{emp.latestReview}"
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-slate-400 italic">No reviews yet</div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <div className="text-sm font-black text-slate-700">{emp.totalTicketsResolved || 0}</div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Resolved</div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-4">
                                        <button
                                            onClick={() => toggleSuspension(emp._id, emp.status === 'suspended')}
                                            className={`text-[11px] font-bold uppercase tracking-wider transition-colors
                                                ${emp.status === 'suspended' ? "text-emerald-600 hover:text-emerald-700" : "text-rose-500 hover:text-rose-600"}`}
                                        >
                                            {emp.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                                        </button>
                                        <button
                                            onClick={() => navigate('/cs-chat/' + emp._id)}
                                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                                        >
                                            Chat
                                        </button>
                                        <button
                                            onClick={() => navigate(`/cs-employee/${emp._id}`)}
                                            className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                                        >
                                            Detailed Stats
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {employees.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                    No support agents found. Create your first agent to start monitoring performance.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">New CS Agent</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleCreateEmployee} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Temporary Password</label>
                                <input type="text" required value={password} onChange={e => setPassword(e.target.value)}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500" />
                                <p className="text-xs text-gray-500 mt-1">They will use this to login and complete their profile.</p>
                            </div>
                            <div className="pt-2 flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CSEmployees;
