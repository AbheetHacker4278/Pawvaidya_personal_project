import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import PollCard from '../components/PollCard';
import { motion } from 'framer-motion';
import { Vote, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Polls = ({ hideHeader = false }) => {
    const { t } = useTranslation();
    const { backendurl, token, userdata } = useContext(AppContext);
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);

    const isObsidian = userdata?.subscription?.status === 'Active' && userdata?.subscription?.plan === 'Obsidian';

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
        <div className={hideHeader ? "py-6 px-4" : `min-h-screen pt-24 pb-12 px-4 sm:px-[10%] transition-colors duration-500 ${isObsidian ? 'bg-[#050505] text-[#F5F2EA]' : 'bg-[#f2e4c7]'}`}>
            {/* Header section */}
            {!hideHeader && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-center"
                >
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border ${
                        isObsidian 
                            ? 'bg-[#E6C97A]/10 border-[#E6C97A]/25 text-[#E6C97A]' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                        <Vote className="w-3.5 h-3.5" />
                        Community Engagement
                    </div>
                    <h1 className={`text-4xl md:text-5xl font-black mb-4 ${isObsidian ? 'text-white' : 'text-[#3d2b1f]'}`}>
                        Community <span className={isObsidian ? 'text-[#E6C97A]' : 'text-[#c8860a]'}>Polls</span>
                    </h1>
                    <p className={`max-w-2xl mx-auto text-lg ${isObsidian ? 'text-neutral-400' : 'text-[#7a5a48]'}`}>
                        Speak your mind, share your voice. Participate in our community polls and riddles to help us improve PawVaidya for everyone.
                    </p>
                </motion.div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className={`w-12 h-12 border-4 rounded-full animate-spin ${
                        isObsidian ? 'border-[#E6C97A]/20 border-t-[#E6C97A]' : 'border-amber-200 border-t-amber-600'
                    }`}></div>
                    <p className={`font-medium ${isObsidian ? 'text-[#E6C97A]' : 'text-amber-800'}`}>Fetching active polls...</p>
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
                    className={`rounded-3xl p-12 border shadow-xl text-center max-w-lg mx-auto ${
                        isObsidian ? 'bg-[#0E0E0E] border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-white' : 'bg-white border-amber-100 shadow-amber-900/5'
                    }`}
                >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                        isObsidian ? 'bg-[#E6C97A]/10' : 'bg-amber-50'
                    }`}>
                        <Info className={`w-10 h-10 ${isObsidian ? 'text-[#E6C97A]' : 'text-amber-50'}`} />
                    </div>
                    <h3 className={`text-2xl font-bold mb-3 ${isObsidian ? 'text-white' : 'text-[#3d2b1f]'}`}>No Active Polls</h3>
                    <p className={`mb-8 ${isObsidian ? 'text-neutral-400' : 'text-[#7a5a48]'}`}>
                        There are no active polls for users at the moment. Please check back later for new riddles and questions!
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
                            isObsidian ? 'bg-[#E6C97A] text-black hover:bg-[#E6C97A]/90 font-extrabold shadow-md' : 'bg-[#3d2b1f] text-white hover:bg-[#5A4035]'
                        }`}
                    >
                        Go Back
                    </button>
                </motion.div>
            )}
        </div>
    );
};

export default Polls;
