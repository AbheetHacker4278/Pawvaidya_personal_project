import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, HelpCircle, CheckCircle2, Users } from 'lucide-react';

const PollCard = ({ poll: initialPoll, onVoteSuccess }) => {
    const { backendurl, token, userdata } = useContext(AppContext);
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(!initialPoll);

    const fetchPolls = async () => {
        if (!token || initialPoll) return;
        try {
            const { data } = await axios.get(backendurl + '/api/user/active-polls?target=user', { headers: { token } });
            if (data.success) {
                setPolls(data.polls);
            }
        } catch (error) {
            console.error("Error fetching polls:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && !initialPoll) fetchPolls();
    }, [token, initialPoll]);

    const handleVote = async (pollId, optionIndex) => {
        if (!token) return toast.info("Please login to vote");
        try {
            const { data } = await axios.post(backendurl + '/api/user/vote-poll', {
                pollId,
                optionIndex,
                userId: userdata?._id,
                userType: 'user'
            }, { headers: { token } });

            if (data.success) {
                toast.success(data.message);
                if (onVoteSuccess) {
                    onVoteSuccess();
                } else {
                    fetchPolls();
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (loading) return null;

    // If a single poll is passed, render just the card without the outer container and title
    if (initialPoll) {
        const poll = initialPoll;
        const userVote = poll.votedBy.find(v => v.userId === userdata?._id);
        const hasVoted = !!userVote;
        const votedOptionIndex = userVote ? userVote.optionIndex : null;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl p-6 shadow-lg shadow-[#3d2b1f]/5 border border-[rgba(122,90,72,0.12)] relative overflow-hidden group h-full flex flex-col"
                style={{ background: 'rgba(237, 228, 216, 0.85)', backdropFilter: 'blur(16px)' }}
            >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <HelpCircle className="w-16 h-16 text-[#5A4035]" />
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${poll.category === 'Riddle' ? 'bg-purple-100 text-purple-600' :
                        poll.category === 'Question' ? 'bg-blue-100 text-blue-600' :
                            poll.category === 'Feedback' ? 'bg-emerald-100 text-emerald-600' :
                                'bg-gray-100 text-gray-600'
                        }`}>
                        {poll.category}
                    </span>
                    {hasVoted && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" />
                            Voted
                        </span>
                    )}
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-6 leading-tight min-h-[3.5rem]">
                    {poll.question}
                </h3>

                <div className="space-y-3 flex-1">
                    {poll.options.map((opt, idx) => {
                        const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                        const isSelected = votedOptionIndex === idx;

                        return (
                            <button
                                key={idx}
                                disabled={hasVoted}
                                onClick={() => handleVote(poll._id, idx)}
                                className={`w-full text-left relative overflow-hidden rounded-2xl transition-all ${hasVoted
                                    ? 'cursor-default'
                                    : 'hover:border-emerald-500 hover:shadow-md active:scale-[0.98]'
                                    } border ${isSelected ? 'border-emerald-500 bg-emerald-50/10' : (hasVoted ? 'border-gray-100' : 'border-gray-200')}`}
                            >
                                {hasVoted && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        className="absolute inset-0 bg-emerald-50 z-0"
                                    />
                                )}

                                <div className="relative z-10 px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-medium ${hasVoted ? 'text-gray-700' : 'text-gray-600'}`}>
                                            {opt.text}
                                        </span>
                                        {isSelected && (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        )}
                                    </div>
                                    {hasVoted && (
                                        <span className="text-xs font-black text-emerald-600">
                                            {percentage}%
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <Users className="w-3.5 h-3.5" />
                        <span>{poll.totalVotes} responses</span>
                    </div>
                    {!hasVoted && (
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                            Vote Now
                        </span>
                    )}
                </div>
            </motion.div>
        );
    }

    if (polls.length === 0) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-emerald-500 p-2 rounded-lg">
                    <BarChart3 className="text-white w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Community Polls</h2>
                    <p className="text-gray-500 text-sm">Your voice matters! Participation helps us improve.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {polls.map((poll) => (
                    <PollCard key={poll._id} poll={poll} onVoteSuccess={fetchPolls} />
                ))}
            </div>
        </div>
    );
};

export default PollCard;
