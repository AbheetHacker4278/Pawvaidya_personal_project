import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import {
    BarChart3,
    Plus,
    Trash2,
    Power,
    HelpCircle,
    Users,
    Stethoscope,
    Globe,
    Search,
    X,
    MessageSquare,
    PieChart,
    BrainCircuit,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

const Polls = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedPoll, setExpandedPoll] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        question: '',
        category: 'Question',
        target: 'all',
        options: ['', '']
    });

    const fetchPolls = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(backendurl + '/api/admin/all-polls', { headers: { atoken } });
            if (data.success) {
                setPolls(data.polls);
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
        if (atoken) fetchPolls();
    }, [atoken]);

    const handleCreate = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.options.some(opt => opt.trim() === '')) {
            return toast.error("All options must be filled");
        }

        try {
            const { data } = await axios.post(backendurl + '/api/admin/create-poll', formData, { headers: { atoken } });
            if (data.success) {
                toast.success(data.message);
                setShowAddModal(false);
                setFormData({
                    question: '',
                    category: 'Question',
                    target: 'all',
                    options: ['', '']
                });
                fetchPolls();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleToggleStatus = async (pollId) => {
        try {
            const { data } = await axios.post(backendurl + '/api/admin/toggle-poll', { pollId }, { headers: { atoken } });
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

    const handleDelete = async (pollId) => {
        if (!window.confirm("Are you sure you want to delete this poll?")) return;
        try {
            const { data } = await axios.post(backendurl + '/api/admin/delete-poll', { pollId }, { headers: { atoken } });
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

    const handleOptionChange = (index, value) => {
        const updatedOptions = [...formData.options];
        updatedOptions[index] = value;
        setFormData({ ...formData, options: updatedOptions });
    };

    const addOptionField = () => {
        if (formData.options.length >= 6) return toast.info("Maximum 6 options allowed");
        setFormData({ ...formData, options: [...formData.options, ''] });
    };

    const removeOptionField = (index) => {
        if (formData.options.length <= 2) return toast.info("At least 2 options are required");
        const updatedOptions = formData.options.filter((_, i) => i !== index);
        setFormData({ ...formData, options: updatedOptions });
    };

    const filteredPolls = polls.filter(p =>
        p.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTargetIcon = (target) => {
        switch (target) {
            case 'user': return <Users className="w-4 h-4" />;
            case 'doctor': return <Stethoscope className="w-4 h-4" />;
            default: return <Globe className="w-4 h-4" />;
        }
    };

    const getCategoryStyles = (category) => {
        switch (category) {
            case 'Question': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Riddle': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'Feedback': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/30">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BarChart3 className="w-8 h-8 text-emerald-500" />
                        Interactive Polls & Riddles
                    </h1>
                    <p className="text-gray-500 mt-1">Engage users and doctors with real-time questions and challenges</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl transition-all shadow-lg active:scale-95 font-bold hover:bg-emerald-600"
                >
                    <Plus className="w-5 h-5" />
                    Create New Poll
                </button>
            </div>

            {/* Filters and Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search polls, categories, questions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
                    />
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="bg-emerald-50 p-2 rounded-lg">
                        <PieChart className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Polls</p>
                        <p className="text-xl font-black text-gray-800">{polls.length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="bg-amber-50 p-2 rounded-lg">
                        <BrainCircuit className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active</p>
                        <p className="text-xl font-black text-gray-800">{polls.filter(p => p.isActive).length}</p>
                    </div>
                </div>
            </div>

            {/* Polls Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white h-64 rounded-3xl border border-gray-100 shadow-sm" />
                    ))}
                </div>
            ) : filteredPolls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 shadow-inner">
                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                        <HelpCircle className="w-12 h-12 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">No Polls Found</h3>
                    <p className="text-gray-400">Launch an interactive poll to engage your community</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence mode='popLayout'>
                        {filteredPolls.map((poll) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={poll._id}
                                className={`bg-white rounded-3xl border overflow-hidden transition-all group ${poll.isActive ? 'border-gray-100 shadow-sm hover:shadow-xl' : 'border-red-50 opacity-80'}`}
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getCategoryStyles(poll.category)}`}>
                                            {poll.category}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${poll.isActive ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                            {poll.isActive ? 'Live' : 'Hidden'}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-800 mb-4 group-hover:text-emerald-600 transition-colors line-clamp-2 min-h-[3.5rem]">
                                        {poll.question}
                                    </h3>

                                    <div className="flex items-center gap-4 mb-6 text-sm text-gray-500 font-medium">
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                                            {getTargetIcon(poll.target)}
                                            <span className="capitalize">{poll.target === 'all' ? 'Everyone' : poll.target + 's'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MessageSquare className="w-4 h-4" />
                                            <span>{poll.totalVotes} Votes</span>
                                        </div>
                                    </div>

                                    {/* Options Preview */}
                                    <div className="space-y-2.5">
                                        {poll.options.map((opt, idx) => {
                                            const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                                            return (
                                                <div key={idx} className="relative group/opt">
                                                    <div className="flex items-center justify-between mb-1 text-xs font-bold text-gray-600 px-1">
                                                        <span>{opt.text}</span>
                                                        <span>{percentage}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percentage}%` }}
                                                            className={`h-full rounded-full ${idx === 0 ? 'bg-emerald-400' : idx === 1 ? 'bg-blue-400' : idx === 2 ? 'bg-purple-400' : 'bg-orange-400'}`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-50">
                                        <button
                                            onClick={() => handleToggleStatus(poll._id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${poll.isActive
                                                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                }`}
                                        >
                                            <Power className="w-4 h-4" />
                                            {poll.isActive ? 'Deactivate' : 'Activate Live'}
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleDelete(poll._id)}
                                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Delete Poll"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Create Poll Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl relative overflow-hidden"
                        >
                            <div className="p-8 border-b flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-800">Launch New Poll</h2>
                                    <p className="text-gray-500 text-sm mt-1">Design an engaging interaction for your community</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-white rounded-full transition-all shadow-sm">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-none">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2 px-1">Question / Riddle</label>
                                    <textarea
                                        required
                                        placeholder="Enter your engaging question or riddle here..."
                                        value={formData.question}
                                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all min-h-[100px] resize-none font-medium text-gray-700"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2 px-1">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                                        >
                                            <option value="Question">General Question</option>
                                            <option value="Riddle">Mind Riddle</option>
                                            <option value="Feedback">User Feedback</option>
                                            <option value="Other">Miscellaneous</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2 px-1">Target Audience</label>
                                        <select
                                            value={formData.target}
                                            onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                                        >
                                            <option value="all">Everyone</option>
                                            <option value="user">Users Only</option>
                                            <option value="doctor">Doctors Only</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Voting Options</label>
                                        <button
                                            type="button"
                                            onClick={addOptionField}
                                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-all"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add Option
                                        </button>
                                    </div>

                                    <AnimatePresence mode='popLayout'>
                                        {formData.options.map((option, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                key={idx}
                                                className="flex gap-3"
                                            >
                                                <input
                                                    required
                                                    placeholder={`Option ${idx + 1}`}
                                                    value={option}
                                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                    className="flex-1 px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-medium text-gray-700"
                                                />
                                                {formData.options.length > 2 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOptionField(idx)}
                                                        className="p-3.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200/50 active:scale-[0.98] mt-4"
                                >
                                    Broadcast Poll Live
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default Polls;
