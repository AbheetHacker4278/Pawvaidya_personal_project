import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';
import { UserCheck, Clock, Calendar, Image as ImageIcon } from 'lucide-react';

const DoctorAttendance = () => {
    const { backendurl, atoken } = useContext(AdminContext);
    const [isLoading, setIsLoading] = useState(true);
    const [logs, setLogs] = useState([]);

    const fetchAttendanceLogs = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/admin/doctor-attendance-logs', {
                headers: { atoken }
            });
            if (data.success) {
                setLogs(data.logs);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch attendance logs");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (atoken) {
            fetchAttendanceLogs();
        }
    }, [atoken]);

    return (
        <div className="m-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
                <UserCheck className="w-8 h-8 text-green-600" />
                <h1 className="text-2xl font-bold font-outfit text-gray-800">Doctor Face Attendance Logs</h1>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="hidden sm:grid grid-cols-[0.5fr_2fr_1.5fr_1.5fr_1fr] bg-gray-50/80 border-b border-gray-100 py-4 px-6 text-sm font-semibold text-gray-600">
                    <p>#</p>
                    <p>Doctor Name</p>
                    <p>Date</p>
                    <p>Time</p>
                    <p>Face Verification</p>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading attendance records...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No attendance records found</p>
                        <p className="text-gray-400 text-sm mt-1">Attendance logs will appear here once doctors clock in.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {logs.map((item, index) => (
                            <div key={index} className="flex flex-wrap sm:grid grid-cols-[0.5fr_2fr_1.5fr_1.5fr_1fr] items-center text-gray-600 py-4 px-6 hover:bg-green-50/30 transition-colors group">
                                <p className="max-sm:hidden font-medium text-gray-400">{index + 1}</p>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                                        {item.doctorName.charAt(0)}
                                    </div>
                                    <p className="font-semibold text-gray-800">{item.doctorName}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <p className="text-sm">
                                        {new Date(item.timestamp).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <p className="text-sm font-medium text-gray-700">
                                        {new Date(item.timestamp).toLocaleTimeString('en-IN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </p>
                                </div>

                                <div className="flex items-center">
                                    {item.faceImage ? (
                                        <div className="relative group/img">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer ring-1 ring-gray-100">
                                                <img
                                                    src={item.faceImage}
                                                    alt="Captured Face"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {/* Preview on hover */}
                                            <div className="fixed sm:absolute bottom-full right-0 mb-3 hidden group-hover/img:block z-50 animate-fadeIn bg-white p-1 rounded-xl shadow-2xl border border-gray-200">
                                                <div className="relative">
                                                    <img
                                                        src={item.faceImage}
                                                        alt="Face Large"
                                                        className="w-48 h-48 object-cover rounded-lg"
                                                    />
                                                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                                                        <ShieldCheck className="w-3 h-3" />
                                                    </div>
                                                </div>
                                                <div className="p-2 text-center">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Clock-in Identification</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 italic">
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            <span>No capture</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

// Internal icon for the preview
const ShieldCheck = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

export default DoctorAttendance;
