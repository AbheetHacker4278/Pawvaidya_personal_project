import React, { useState, useContext, useEffect } from 'react';
import { DoctorContext } from '../context/DoctorContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, HelpCircle, CheckCircle2, Users } from 'lucide-react';

const DoctorPollCard = () => {
    const { dtoken, backendurl } = useContext(DoctorContext);
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    const fetchPolls = async () => {
        if (!dtoken) return;
        try {
            const { data } = await axios.get(backendurl + '/api/doctor/active-polls?target=doctor', { headers: { dtoken } });
            if (data.success) {
                setPolls(data.polls);
            }
        } catch (error) {
            console.error("Error fetching polls:", error);
        } finally {
            setLoading(false);
        }
    };

    // Decode dtoken to get doctorId for checking voted status
    useEffect(() => {
        if (dtoken) {
            try {
                const base64Url = dtoken.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decoded = JSON.parse(jsonPayload);
                setUserData({ _id: decoded.id });
                fetchPolls();
            } catch (e) {
                console.error('Error decoding token:', e);
            }
        }
    }, [dtoken]);

    const handleVote = async (pollId, optionIndex) => {
        if (!dtoken) return toast.info("Session expired. Please login again.");
        try {
            const { data } = await axios.post(backendurl + '/api/doctor/vote-poll', {
                pollId,
                optionIndex,
                userId: userData?._id,
                userType: 'doctor'
            }, { headers: { dtoken } });

            if (data.success) {
                toast.success(data.message);
                fetchPolls();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (loading || polls.length === 0) return null;

    return (
        <div className="mt-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-500 p-2 rounded-lg">
                    <BarChart3 className="text-white w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Professional Insights & Polls</h2>
                    <p className="text-gray-500 text-xs">Share your expert opinion on veterinary practices</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {polls.map((poll) => {
                    const hasVoted = poll.votedBy.some(v => v.userId === userData?._id);

                    return (
                        <motion.div
                            key={poll._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl p-6 border border-indigo-50 shadow-xl shadow-indigo-900/5 relative overflow-hidden group hover:shadow-indigo-900/10 transition-all"
                        >
                            {/* Decorative background element */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <div className="flex items-center gap-2 mb-4 relative z-10">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${poll.category === 'Riddle' ? 'bg-purple-50 text-purple-600' :
                                    poll.category === 'Question' ? 'bg-blue-50 text-blue-600' :
                                        poll.category === 'Feedback' ? 'bg-indigo-50 text-indigo-600' :
                                            'bg-gray-50 text-gray-600'
                                    }`}>
                                    {poll.category}
                                </span>
                                {hasVoted && (
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-600">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Response Recorded
                                    </span>
                                )}
                            </div>

                            <h3 className="text-base font-bold text-gray-800 mb-5 leading-snug">
                                {poll.question}
                            </h3>

                            <div className="space-y-2.5">
                                {poll.options.map((opt, idx) => {
                                    const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                                    const userVote = poll.votedBy.find(v => v.userId === userData?._id);
                                    const isSelected = userVote && userVote.optionIndex === idx;

                                    return (
                                        <button
                                            key={idx}
                                            disabled={hasVoted}
                                            onClick={() => handleVote(poll._id, idx)}
                                            className={`w-full text-left relative overflow-hidden rounded-xl transition-all ${hasVoted
                                                ? 'cursor-default'
                                                : 'hover:border-indigo-500 hover:bg-indigo-50/10'
                                                } border ${isSelected ? 'border-indigo-500 bg-indigo-50/10' : (hasVoted ? 'border-gray-50' : 'border-gray-100')}`}
                                        >
                                            {hasVoted && (
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    className="absolute inset-0 bg-indigo-50/50 z-0"
                                                />
                                            )}
                                            <div className="relative z-10 px-4 py-2.5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm ${hasVoted ? 'text-gray-700 font-medium' : 'text-gray-600'}`}>
                                                        {opt.text}
                                                    </span>
                                                    {isSelected && (
                                                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                                    )}
                                                </div>
                                                {hasVoted && (
                                                    <span className="text-xs font-black text-indigo-600">
                                                        {percentage}%
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    <Users className="w-3 h-3" />
                                    <span>{poll.totalVotes} experts voted</span>
                                </div>
                                {!hasVoted && (
                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] animate-pulse">
                                        Cast Vote
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default DoctorPollCard;
