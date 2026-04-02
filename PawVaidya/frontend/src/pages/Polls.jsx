import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import PollCard from '../components/PollCard';
import { motion } from 'framer-motion';
import { Vote, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Polls = () => {
    const { t } = useTranslation();
    const { backendurl, token } = useContext(AppContext);
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPolls = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/user/active-polls?target=user`, {
                headers: { token }
            });
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
        if (token) {
            fetchPolls();
        } else {
            setLoading(false);
        }
    }, [token]);

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-[10%]">
            {/* Header section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-100">
                    <Vote className="w-3.5 h-3.5" />
                    Community Engagement
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-[#3d2b1f] mb-4">
                    Community <span className="text-[#c8860a]">Polls</span>
                </h1>
                <p className="text-[#7a5a48] max-w-2xl mx-auto text-lg">
                    Speak your mind, share your voice. Participate in our community polls and riddles to help us improve PawVaidya for everyone.
                </p>
            </motion.div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
                    <p className="text-amber-800 font-medium">Fetching active polls...</p>
                </div>
            ) : polls.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {polls.map((poll, index) => (
                        <motion.div
                            key={poll._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <PollCard
                                poll={poll}
                                onVoteSuccess={fetchPolls}
                            />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-3xl p-12 border border-amber-100 shadow-xl shadow-amber-900/5 text-center max-w-lg mx-auto"
                >
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Info className="w-10 h-10 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#3d2b1f] mb-3">No Active Polls</h3>
                    <p className="text-[#7a5a48] mb-8">
                        There are no active polls for users at the moment. Please check back later for new riddles and questions!
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-8 py-3 rounded-xl bg-[#3d2b1f] text-white font-bold hover:bg-[#5A4035] transition-colors"
                    >
                        Go Back
                    </button>
                </motion.div>
            )}
        </div>
    );
};

export default Polls;
