import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';


const AdminLogs = () => {
    const { backendurl, atoken } = useContext(AdminContext);
    const [isLoading, setIsLoading] = useState(true);

    const [backendLogs, setBackendLogs] = useState([]); // Store all logs
    const [filter, setFilter] = useState('all'); // 'all', 'login', 'navigation'

    const fetchLogs = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/admin/activity-logs', {
                headers: { atoken }
            });
            if (data.success) {
                setBackendLogs(data.logs);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch logs");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (atoken) {
            fetchLogs();
        }
    }, [atoken]);

    // Filter logs based on selection
    const filteredLogs = backendLogs.filter(log => {
        if (filter === 'all') return true;
        if (filter === 'login') return log.activityType === 'login' || log.activityType === 'logout';
        if (filter === 'navigation') return log.activityType === 'navigation';
        return true;
    });

    return (
        <div className="m-5 max-h-[90vh] overflow-y-scroll">
            <h1 className="text-2xl font-bold mb-4">Admin Activity Logs</h1>

            {/* Filter Tabs */}
            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-green-100 text-green-800 border-2 border-green-500' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
                >
                    All Activities
                </button>
                <button
                    onClick={() => setFilter('login')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'login' ? 'bg-blue-100 text-blue-800 border-2 border-blue-500' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
                >
                    Login History
                </button>
                <button
                    onClick={() => setFilter('navigation')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'navigation' ? 'bg-purple-100 text-purple-800 border-2 border-purple-500' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
                >
                    Navigation History
                </button>
            </div>

            <div className="bg-white border rounded">
                <div className="hidden sm:grid grid-cols-[0.5fr_1fr_1fr_2fr_1fr_1fr] grid-flow-col py-3 px-6 border-b bg-gray-50 text-sm font-semibold">
                    <p>#</p>
                    <p>Time</p>
                    <p>Activity</p>
                    <p>Description</p>
                    <p>Method</p>
                    <p>Face Image</p>
                </div>

                {isLoading ? (
                    <div className="p-6 text-center">Loading logs...</div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-6 text-center">No logs found</div>
                ) : (
                    filteredLogs.map((item, index) => (
                        <div key={index} className="flex flex-wrap sm:grid grid-cols-[0.5fr_1fr_1fr_2fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50 transition-colors">
                            <p className="max-sm:hidden">{index + 1}</p>
                            <p className="text-xs">{new Date(item.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                            <p className="capitalize">{item.activityType}</p>
                            <p className="text-sm">{item.activityDescription}</p>
                            <p className="uppercase text-xs font-semibold">
                                {item.metadata?.method === 'face' ? (
                                    <span className="text-green-600">Face ID</span>
                                ) : item.metadata?.method === 'email' ? (
                                    <span className="text-blue-600">Email</span>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </p>
                            <div className="flex items-center">
                                {item.faceImage ? (
                                    <div className="relative group">
                                        <img
                                            src={item.faceImage}
                                            alt="Face"
                                            className="w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer"
                                        />
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-32">
                                            <img
                                                src={item.faceImage}
                                                alt="Face Large"
                                                className="w-full h-auto rounded-lg shadow-xl border-2 border-white"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400">No Image</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminLogs;
