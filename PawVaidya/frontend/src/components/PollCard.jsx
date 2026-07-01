import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { BarChart3, HelpCircle, CheckCircle2, Users, Sparkles } from 'lucide-react';

const PollCard = ({ poll: initialPoll, onVoteSuccess }) => {
    const { backendurl, token, userdata } = useContext(AppContext);
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(!initialPoll);

    const isObsidian = userdata?.subscription?.plan === 'Obsidian' && userdata?.subscription?.status === 'Active';

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
                className={`rounded-3xl p-6 shadow-lg relative overflow-hidden group h-full flex flex-col transition-all duration-300 ${
                    isObsidian 
                        ? 'shadow-black/40 border border-zinc-800/80 hover:border-[#E6C97A]/40' 
                        : 'shadow-[#3d2b1f]/5 border border-[rgba(122,90,72,0.12)]'
                }`}
                style={{ 
                    background: isObsidian ? 'rgba(13, 13, 13, 0.85)' : 'rgba(237, 228, 216, 0.85)', 
                    backdropFilter: 'blur(16px)' 
                }}
            >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <HelpCircle className={`w-16 h-16 ${isObsidian ? 'text-[#E6C97A]' : 'text-[#5A4035]'}`} />
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        isObsidian
                            ? poll.category === 'Riddle' ? 'bg-purple-950/30 text-purple-400 border-purple-900/35' :
                              poll.category === 'Question' ? 'bg-blue-950/30 text-blue-400 border-blue-900/35' :
                              poll.category === 'Feedback' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/35' :
                              'bg-zinc-900 text-zinc-400 border-zinc-800'
                            : poll.category === 'Riddle' ? 'bg-purple-100 text-purple-600 border-transparent' :
                              poll.category === 'Question' ? 'bg-blue-100 text-blue-600 border-transparent' :
                              poll.category === 'Feedback' ? 'bg-emerald-100 text-emerald-600 border-transparent' :
                              'bg-gray-100 text-gray-600 border-transparent'
                    }`}>
                        {poll.category}
                    </span>
                    {hasVoted && (
                        <span className={`flex items-center gap-1 text-[10px] font-bold ${isObsidian ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            <CheckCircle2 className="w-3 h-3" />
                            Voted
                        </span>
                    )}
                </div>

                <h3 className={`text-lg font-bold mb-6 leading-tight min-h-[3.5rem] ${isObsidian ? 'text-[#F5F2EA]' : 'text-gray-800'}`}>
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
                                className={`w-full text-left relative overflow-hidden rounded-2xl transition-all ${
                                    hasVoted
                                        ? 'cursor-default'
                                        : isObsidian 
                                          ? 'hover:border-[#E6C97A] hover:shadow-md hover:shadow-[#E6C97A]/5 active:scale-[0.98]'
                                          : 'hover:border-[#5A4035] hover:shadow-md active:scale-[0.98]'
                                } border ${
                                    isSelected 
                                        ? isObsidian ? 'border-[#E6C97A] bg-[#E6C97A]/5' : 'border-emerald-500 bg-emerald-50/10' 
                                        : hasVoted 
                                          ? isObsidian ? 'border-zinc-800 bg-zinc-950/10' : 'border-gray-100 bg-transparent' 
                                          : isObsidian ? 'border-zinc-800/80 bg-zinc-900/10' : 'border-gray-200 bg-transparent'
                                }`}
                            >
                                {hasVoted && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        className={`absolute inset-0 z-0 ${isObsidian ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}
                                    />
                                )}

                                <div className="relative z-10 px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-medium ${hasVoted ? (isObsidian ? 'text-[#F5F2EA]' : 'text-gray-700') : (isObsidian ? 'text-neutral-300' : 'text-gray-600')}`}>
                                            {opt.text}
                                        </span>
                                        {isSelected && (
                                            <CheckCircle2 className={`w-4 h-4 ${isObsidian ? 'text-[#E6C97A]' : 'text-emerald-600'}`} />
                                        )}
                                    </div>
                                    {hasVoted && (
                                        <span className={`text-xs font-black ${isObsidian ? 'text-[#E6C97A]' : 'text-emerald-600'}`}>
                                            {percentage}%
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className={`mt-6 pt-4 border-t flex items-center justify-between ${isObsidian ? 'border-zinc-800/80' : 'border-gray-100'}`}>
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${isObsidian ? 'text-neutral-500' : 'text-gray-400'}`}>
                        <Users className="w-3.5 h-3.5" />
                        <span>{poll.totalVotes} responses</span>
                    </div>
                    {!hasVoted && (
                        <span className={`text-[10px] font-black uppercase tracking-widest animate-pulse ${isObsidian ? 'text-[#E6C97A]' : 'text-emerald-500'}`}>
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
                <div className={`p-2 rounded-lg ${isObsidian ? 'bg-[#E6C97A] text-black' : 'bg-[#5A4035] text-white'}`}>
                    {isObsidian ? <Sparkles className="w-6 h-6" /> : <BarChart3 className="w-6 h-6" />}
                </div>
                <div>
                    <h2 className={`text-2xl font-bold ${isObsidian ? 'text-[#F5F2EA]' : 'text-gray-800'}`}>Community Polls</h2>
                    <p className={`text-sm ${isObsidian ? 'text-neutral-400' : 'text-gray-500'}`}>Your voice matters! Participation helps us improve.</p>
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
