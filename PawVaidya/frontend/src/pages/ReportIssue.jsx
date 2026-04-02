import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bug, Monitor, Zap, MessageSquare, AlertCircle, Send, Loader2 } from 'lucide-react';

const ReportIssue = () => {
    const { backendurl, token, userdata } = useContext(AppContext);
    const navigate = useNavigate();

    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Bug');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error('Please login to report an issue');
            return;
        }

        if (!subject || !description || !category) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            const { data } = await axios.post(
                `${backendurl}/api/app-issue/submit`,
                {
                    userId: userdata?.id || userdata?._id,
                    subject,
                    description,
                    category
                },
                { headers: { token } }
            );

            if (data.success) {
                toast.success(data.message);
                setSubject('');
                setDescription('');
                setCategory('Bug');
                setTimeout(() => navigate('/'), 2000);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.error(error.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut",
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    const CategoryIcon = () => {
        switch (category) {
            case 'Bug': return <Bug size={18} className="text-[#9a6458]" />;
            case 'UI': return <Monitor size={18} className="text-[#9a6458]" />;
            case 'Performance': return <Zap size={18} className="text-[#9a6458]" />;
            case 'Feature Request': return <MessageSquare size={18} className="text-[#9a6458]" />;
            default: return <AlertCircle size={18} className="text-[#9a6458]" />;
        }
    };

    return (
        <div className="min-h-screen bg-[#f2e4c7] pt-24 pb-20 px-4 flex items-center justify-center relative overflow-hidden">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-lg bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-[rgba(122,90,72,0.12)] relative z-10"
            >
                {/* Header Strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#9a6458] via-[#7b483d] to-[#5A4035]"></div>

                <div className="p-6 md:p-8">
                    <motion.div variants={itemVariants} className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/80 shadow-sm border border-[rgba(122,90,72,0.1)] mb-3 text-[#9a6458]">
                            <MessageSquare size={24} />
                        </div>
                        <h1 className="text-2xl font-black text-[#3d2b1f] mb-2 tracking-tight">Report an Issue</h1>
                        <p className="text-[#7a5a48] text-sm font-medium opacity-80">Help us improve PawVaidya! Let us know if you found a bug or have a suggestion.</p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <motion.div variants={itemVariants}>
                            <label className="block text-xs font-bold text-[#9a6458] uppercase tracking-widest mb-1.5 pl-1">Category</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CategoryIcon />
                                </div>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[rgba(122,90,72,0.2)] bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-[#9a6458] focus:border-transparent outline-none transition-all appearance-none text-[#3d2b1f] text-sm font-medium shadow-sm hover:border-[rgba(122,90,72,0.4)]"
                                    required
                                >
                                    <option value="Bug">Bug / Error</option>
                                    <option value="UI">UI / Visual Issue</option>
                                    <option value="Performance">Performance / Speed</option>
                                    <option value="Feature Request">Feature Request</option>
                                    <option value="Other">Other</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 text-[#9a6458]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label className="block text-xs font-bold text-[#9a6458] uppercase tracking-widest mb-1.5 pl-1">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Brief summary of the issue"
                                className="w-full px-4 py-3 rounded-xl border border-[rgba(122,90,72,0.2)] bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-[#9a6458] focus:border-transparent outline-none transition-all text-[#3d2b1f] text-sm font-medium placeholder:text-[#3d2b1f]/40 shadow-sm hover:border-[rgba(122,90,72,0.4)]"
                                required
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label className="block text-xs font-bold text-[#9a6458] uppercase tracking-widest mb-1.5 pl-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detailed explanation..."
                                rows="4"
                                className="w-full px-4 py-3 rounded-xl border border-[rgba(122,90,72,0.2)] bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-[#9a6458] focus:border-transparent outline-none transition-all resize-none text-[#3d2b1f] text-sm font-medium placeholder:text-[#3d2b1f]/40 shadow-sm hover:border-[rgba(122,90,72,0.4)]"
                                required
                            ></textarea>
                        </motion.div>

                        <motion.div variants={itemVariants} className="pt-2">
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: "0 8px 20px -4px rgba(154,100,88,0.4)" }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-xl text-white font-bold shadow-lg flex items-center justify-center transition-all ${loading
                                    ? 'bg-[#9a6458]/70 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#9a6458] to-[#7b483d]'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Loader2 className="w-5 h-5 mr-2" />
                                        </motion.div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Submit Report
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    </form>
                </div>
            </motion.div>

            <div className="absolute bottom-6 w-full text-center text-[#9a6458] font-medium opacity-60 text-sm">
                <p>© 2026 PawVaidya. Thank you for your support.</p>
            </div>
        </div>
    );
};

export default ReportIssue;
