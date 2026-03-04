import React, { useState, useContext } from 'react';
import { AdminContext } from '../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const BroadcastComposer = () => {
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info'); // info, warning, emergency
    const [duration, setDuration] = useState(5000);
    const [loading, setLoading] = useState(false);
    const { atoken, backendurl } = useContext(AdminContext);

    const handleSend = async () => {
        if (!message.trim()) {
            return toast.error("Please enter a message");
        }

        setLoading(true);
        try {
            const { data } = await axios.post(`${backendurl}/api/admin/send-broadcast`, {
                message,
                type,
                duration
            }, {
                headers: { atoken }
            });

            if (data.success) {
                toast.success("Broadcast alert successfully pushed to all users!");
                setMessage('');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Broadcast failed:', error);
            toast.error("Failed to send broadcast alert");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-5 border border-indigo-50 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            </div>

            <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📢</span>
                <h3 className="font-bold text-slate-800 text-sm">System Broadcast Composer</h3>
            </div>

            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your system announcement here..."
                className="w-full h-24 p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none placeholder:text-slate-400"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {['info', 'warning', 'emergency'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setType(t)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${type === t
                                ? (t === 'emergency' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : t === 'warning' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200')
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400">Duration</span>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="bg-transparent text-[10px] font-black text-slate-600 outline-none cursor-pointer"
                        >
                            <option value={3000}>3s</option>
                            <option value={5000}>5s</option>
                            <option value={10000}>10s</option>
                            <option value={30000}>30s</option>
                        </select>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        onClick={handleSend}
                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all ${loading ? 'bg-slate-400' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-200'
                            }`}
                    >
                        {loading ? 'Pushing...' : 'Push Alert'}
                    </motion.button>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-[9px] text-slate-400 font-medium italic">
                    * This message will appear instantly as a high-priority banner to all currently logged-in users, doctors, and admins.
                </p>
            </div>
        </div>
    );
};

export default BroadcastComposer;
