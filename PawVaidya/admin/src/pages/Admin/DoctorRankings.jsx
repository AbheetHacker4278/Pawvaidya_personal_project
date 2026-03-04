import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Award, Star, TrendingUp, Gift, BarChart3, Users, MessageSquare, X, Calendar } from 'lucide-react';
import IncentiveModal from '../../components/IncentiveModal';
import HistoryModal from '../../components/HistoryModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const ReviewsModal = ({ doctor, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                            Patient Reviews
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Feedback for <span className="font-semibold text-gray-700">{doctor.name}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-4">
                    {doctor.reviews && doctor.reviews.length > 0 ? (
                        doctor.reviews.map((review, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                            {review.userName ? review.userName.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{review.userName || 'Anonymous User'}</p>
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(review.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm pl-10">
                                    {review.comment || <span className="italic text-gray-400">No written comment provided.</span>}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No reviews available for this doctor yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DoctorRankings = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [reviewDoctor, setReviewDoctor] = useState(null);
    const [historyDoctor, setHistoryDoctor] = useState(null);

    const fetchRankings = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(backendurl + '/api/admin/doctor-rankings', { headers: { atoken } });
            if (data.success) {
                console.log("Doctors data received:", data.doctors);
                setDoctors(data.doctors);
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
        if (atoken) {
            fetchRankings();
        }
    }, [atoken]);

    // Prepare data for charts
    const topRatedDoctors = [...doctors].sort((a, b) => b.averageRating - a.averageRating).slice(0, 5);
    const mostReviewedDoctors = [...doctors].sort((a, b) => b.totalRatings - a.totalRatings).slice(0, 5);

    const checkDoctorStatus = (doc) => {
        if (!doc.incentive || doc.incentive.type === 'none') return null;
        return doc.incentive;
    }

    return (
        <div className="w-full max-w-7xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-3">
                    <Award className="w-8 h-8 text-amber-500" />
                    Doctor Rankings & Incentives
                </h1>
                <p className="text-gray-500 mt-2">Visualize performance and award incentives to top-performing doctors.</p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    {/* Charts Section */}
                    {doctors.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Rated Chart */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-700 mb-6 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                    Top 5 Highest Rated
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topRatedDoctors} layout="vertical" margin={{ left: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" domain={[0, 5]} hide />
                                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Bar dataKey="averageRating" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={20}>
                                                {topRatedDoctors.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#fbbf24'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Most Reviewed Chart */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-700 mb-6 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                    Top 5 Most Reviewed
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={mostReviewedDoctors} margin={{ bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" />
                                            <YAxis />
                                            <Tooltip
                                                cursor={{ fill: '#f0fdf4' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Bar dataKey="totalRatings" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rankings List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500" />
                                All Doctors Rankings
                            </h3>
                            <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                                Total: {doctors.length}
                            </span>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {doctors.map((doc, index) => {
                                const incentive = checkDoctorStatus(doc);
                                return (
                                    <div key={doc._id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row items-center gap-6">
                                        {/* Rank & Avatar */}
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-white text-gray-400 border'
                                                }`}>
                                                #{index + 1}
                                            </div>
                                            <img
                                                src={doc.image}
                                                alt={doc.name}
                                                className={`w-12 h-12 rounded-full object-cover border-2 ${index === 0 ? 'border-yellow-400' :
                                                    index === 1 ? 'border-gray-400' :
                                                        index === 2 ? 'border-orange-400' :
                                                            'border-transparent'
                                                    }`}
                                            />
                                            <div className="md:hidden">
                                                <h4 className="font-semibold text-gray-800">{doc.name}</h4>
                                                <p className="text-sm text-gray-500">{doc.speciality}</p>
                                            </div>
                                        </div>

                                        {/* Details (Hidden on mobile, shown on md+) */}
                                        <div className="hidden md:block flex-1">
                                            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                                {doc.name}
                                                {index < 3 && <Award className={`w-4 h-4 ${index === 0 ? 'text-yellow-500' :
                                                    index === 1 ? 'text-gray-500' :
                                                        'text-orange-500'
                                                    }`} />}
                                            </h4>
                                            <p className="text-sm text-gray-500">{doc.speciality}</p>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-start bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none">
                                            <div className="text-center md:text-left">
                                                <p className="text-xs text-gray-500 mb-0.5">Rating</p>
                                                <div className="flex items-center gap-1 justify-center md:justify-start">
                                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                    <span className="font-bold text-gray-800">{doc.averageRating?.toFixed(1) || '0.0'}</span>
                                                </div>
                                            </div>
                                            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                                            <div className="text-center md:text-left">
                                                <p className="text-xs text-gray-500 mb-0.5">Reviews</p>
                                                <div className="flex items-center gap-2 justify-center md:justify-start">
                                                    <div className="flex items-center gap-1">
                                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                                        <span className="font-bold text-gray-800">{doc.totalRatings || 0}</span>
                                                    </div>
                                                    {doc.totalRatings > 0 && (
                                                        <button
                                                            onClick={() => setReviewDoctor(doc)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Incentive Status */}
                                        <div className="w-full md:w-auto flex justify-center md:justify-start">
                                            {incentive ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-amber-50 border-amber-100 text-amber-700">
                                                    <Gift className="w-3.5 h-3.5" />
                                                    {incentive.value}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No active incentive</span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                            <button
                                                onClick={() => setHistoryDoctor(doc)}
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                                                title="View History"
                                            >
                                                <Calendar className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setSelectedDoctor(doc)}
                                                className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition shadow-sm hover:shadow flex items-center justify-center gap-2"
                                            >
                                                <Gift className="w-4 h-4" />
                                                {incentive ? 'Update' : 'Award'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {doctors.length === 0 && (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Star className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-800">No Data Available</h3>
                                    <p className="text-gray-500">Rankings will appear once users start rating doctors.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {selectedDoctor && (
                <IncentiveModal
                    doctor={selectedDoctor}
                    onClose={() => {
                        setSelectedDoctor(null);
                        fetchRankings();
                    }}
                    backendUrl={backendurl}
                    aToken={atoken}
                />
            )}

            {historyDoctor && (
                <HistoryModal
                    doctor={historyDoctor}
                    onClose={() => setHistoryDoctor(null)}
                />
            )}

            {reviewDoctor && (
                <ReviewsModal
                    doctor={reviewDoctor}
                    onClose={() => setReviewDoctor(null)}
                />
            )}
        </div>
    );
};

export default DoctorRankings;
