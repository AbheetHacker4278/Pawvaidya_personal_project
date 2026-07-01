import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import RunningDogLoader from './RunningDogLoader';
import { PlusIcon, UserGroupIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { assets } from '../assets/assets_frontend/assets';

const B = {
    dark: '#3d2b1f',
    mid: '#5A4035',
    light: '#7a5a48',
    cream: '#f2e4c7',
    sand: '#e8d5b0',
    amber: '#c8860a',
    pale: '#fdf8f0',
};

const RoomsList = ({ onSelectRoom }) => {
    const { t } = useTranslation();
    const { token, userdata, backendurl } = useContext(AppContext);
    const navigate = useNavigate();

    const isObsidian = userdata?.subscription?.status === 'Active' && userdata?.subscription?.plan === 'Obsidian';

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Create Room state
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomDesc, setNewRoomDesc] = useState('');
    const [newRoomRules, setNewRoomRules] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${backendurl}/api/rooms`);
            if (data.success) {
                setRooms(data.rooms);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to fetch rooms');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!token) return toast.error('Please login to create a room');
        if (!newRoomName.trim() || !newRoomDesc.trim()) return toast.error('Name and description are required');

        setCreating(true);
        try {
            const { data } = await axios.post(`${backendurl}/api/rooms/create`, {
                userId: userdata.id,
                name: newRoomName,
                description: newRoomDesc,
                rules: newRoomRules,
                isPrivate: true
            }, { headers: { token } });

            if (data.success) {
                toast.success('Room created successfully!');
                setIsCreateModalOpen(false);
                setNewRoomName('');
                setNewRoomDesc('');
                setNewRoomRules('');
                fetchRooms();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create room');
        } finally {
            setCreating(false);
        }
    };

    const handleRequestJoin = async (e, roomId) => {
        e.stopPropagation();
        if (!token) return toast.error('Please login to request joining a room');
        if (userdata.isBanned) return toast.error('Account is banned');

        try {
            const { data } = await axios.post(`${backendurl}/api/rooms/${roomId}/request`,
                { userId: userdata.id },
                { headers: { token } });

            if (data.success) {
                toast.success('Join request sent!');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error sending request');
        }
    };

    const handleDeleteRoom = async (e, roomId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) return;

        try {
            const { data } = await axios.delete(`${backendurl}/api/rooms/${roomId}`, { headers: { token } });
            if (data.success) {
                toast.success('Room deleted successfully');
                fetchRooms();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete room');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <RunningDogLoader />
                <p className={`mt-4 text-sm font-medium animate-pulse ${isObsidian ? 'text-[#E6C97A]' : ''}`} style={!isObsidian ? { color: B.light } : {}}>Loading community rooms...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${isObsidian ? 'text-white' : ''}`} style={!isObsidian ? { color: B.dark } : {}}>Community Rooms</h2>
                {token && userdata && !userdata.isBanned && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCreateModalOpen(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold shadow-md text-sm ${
                            isObsidian ? 'text-black font-black' : 'text-white'
                        }`}
                        style={{ background: isObsidian ? 'linear-gradient(135deg, #8C6D23, #E6C97A, #8C6D23)' : `linear-gradient(135deg, ${B.mid}, ${B.amber})` }}
                    >
                        <PlusIcon className="w-5 h-5" />
                        Create Room
                    </motion.button>
                )}
            </div>

            {rooms.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`text-center py-20 rounded-3xl border ${
                        isObsidian ? 'bg-[#0E0E0E] border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-white' : ''
                    }`}
                    style={!isObsidian ? { background: '#fff', borderColor: B.sand } : {}}
                >
                    <div className="text-5xl mb-4">🚪</div>
                    <p className={`text-lg font-bold mb-1 ${isObsidian ? 'text-white' : ''}`} style={!isObsidian ? { color: B.dark } : {}}>No Rooms Available</p>
                    <p className={`text-sm ${isObsidian ? 'text-neutral-400' : ''}`} style={!isObsidian ? { color: B.light } : {}}>Be the first to create a community room!</p>
                </motion.div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                    {rooms.map((room, index) => {
                        const isOwner = userdata?.id === room.ownerId;

                        return (
                            <motion.div
                                key={room._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className={`rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col h-full border ${
                                    isObsidian ? 'bg-[#0E0E0E] border-zinc-800/80 hover:border-[#E6C97A]/40 text-white' : 'bg-white'
                                }`}
                                style={!isObsidian ? { border: `1px solid ${B.sand}` } : {}}
                                onClick={() => navigate(`/room/${room._id}`)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className={`font-bold text-lg line-clamp-1 ${isObsidian ? 'text-[#F5F2EA]' : ''}`} style={!isObsidian ? { color: B.dark } : {}}>
                                        {room.isPrivate && <LockClosedIcon className={`w-4 h-4 inline-block mr-1 ${isObsidian ? 'text-neutral-400' : 'text-gray-500'}`} />}
                                        {room.name}
                                    </h3>
                                    <span className={`px-2 py-1 text-xs font-bold rounded-lg whitespace-nowrap ${
                                        isObsidian ? 'bg-[#E6C97A]/10 text-[#E6C97A] border border-[#E6C97A]/25' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                        {room.memberCount} Mbrs
                                    </span>
                                </div>

                                <p className={`text-sm line-clamp-2 mb-4 flex-1 ${isObsidian ? 'text-neutral-400' : ''}`} style={!isObsidian ? { color: B.mid } : {}}>
                                    {room.description}
                                </p>

                                <div className={`flex items-center justify-between mt-auto pt-3 border-t ${
                                    isObsidian ? 'border-zinc-800/80' : ''
                                }`} style={!isObsidian ? { borderColor: B.sand } : {}}>
                                    <div className="flex items-center gap-2">
                                        <img src={room.ownerData?.image || (assets && assets.profile_pic) || ''} alt="Owner" className={`w-6 h-6 rounded-full border ${isObsidian ? 'border-zinc-700' : 'border-gray-200'}`} />
                                        <span className={`text-xs ${isObsidian ? 'text-neutral-400' : 'text-gray-500'}`}>by {room.ownerData?.name}</span>
                                    </div>

                                    {!isOwner && token && (
                                        <button
                                            onClick={(e) => handleRequestJoin(e, room._id)}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                                                isObsidian ? 'border-[#E6C97A] text-[#E6C97A] hover:bg-[#E6C97A]/10' : 'hover:bg-gray-50'
                                            }`}
                                            style={!isObsidian ? { borderColor: B.amber, color: B.amber } : {}}
                                        >
                                            Request Join
                                        </button>
                                    )}
                                    {isOwner && (
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                                                isObsidian ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30' : 'bg-green-50 text-green-700'
                                            }`}>
                                                Owner
                                            </span>
                                            <button
                                                onClick={(e) => handleDeleteRoom(e, room._id)}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                                                    isObsidian ? 'border-red-900/30 bg-red-950/20 text-red-400 hover:bg-red-950/40' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                                }`}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Create Room Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className={`rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border ${
                                isObsidian ? 'bg-[#0E0E0E] border-zinc-800 text-white' : 'bg-white'
                            }`}
                        >
                            <div className="p-5" style={isObsidian ? { background: 'linear-gradient(135deg, #1c140d, #0E0E0E)' } : { background: `linear-gradient(135deg, ${B.dark}, ${B.mid})` }}>
                                <h3 className="text-xl font-bold text-white">Create Community Room</h3>
                                <p className={`text-sm mt-1 ${isObsidian ? 'text-neutral-400' : 'text-cream/80'}`}>Start a private space for like-minded pet lovers.</p>
                            </div>

                            <form onSubmit={handleCreateRoom} className="p-6 space-y-4">
                                <div>
                                    <label className={`block text-sm font-bold mb-1 ${isObsidian ? 'text-neutral-300' : 'text-gray-700'}`}>Room Name</label>
                                    <input required type="text" maxLength={50} value={newRoomName} onChange={e => setNewRoomName(e.target.value)}
                                        className={`w-full px-4 py-2 rounded-xl border-2 focus:outline-none transition-colors ${
                                            isObsidian ? 'bg-[#151515] border-zinc-800 focus:border-[#E6C97A] text-white' : 'focus:border-amber-400'
                                        }`} style={!isObsidian ? { borderColor: B.sand } : {}} />
                                </div>
                                <div>
                                    <label className={`block text-sm font-bold mb-1 ${isObsidian ? 'text-neutral-300' : 'text-gray-700'}`}>Description</label>
                                    <textarea required rows="3" maxLength={200} value={newRoomDesc} onChange={e => setNewRoomDesc(e.target.value)}
                                        className={`w-full px-4 py-2 rounded-xl border-2 focus:outline-none transition-colors resize-none ${
                                            isObsidian ? 'bg-[#151515] border-zinc-800 focus:border-[#E6C97A] text-white' : 'focus:border-amber-400'
                                        }`} style={!isObsidian ? { borderColor: B.sand } : {}}></textarea>
                                </div>
                                <div>
                                    <label className={`block text-sm font-bold mb-1 ${isObsidian ? 'text-neutral-300' : 'text-gray-700'}`}>Room Rules (Optional)</label>
                                    <textarea rows="2" value={newRoomRules} onChange={e => setNewRoomRules(e.target.value)}
                                        className={`w-full px-4 py-2 rounded-xl border-2 focus:outline-none transition-colors resize-none ${
                                            isObsidian ? 'bg-[#151515] border-zinc-800 focus:border-[#E6C97A] text-white' : 'focus:border-amber-400'
                                        }`} style={!isObsidian ? { borderColor: B.sand } : {}} placeholder="e.g. Be kind, no spam..."></textarea>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className={`flex-1 py-2 rounded-xl font-bold border-2 transition-colors ${
                                        isObsidian ? 'border-zinc-800 text-neutral-400 hover:text-white hover:bg-zinc-950' : 'text-gray-600 hover:bg-gray-50'
                                    }`} style={!isObsidian ? { borderColor: B.sand } : {}}>Cancel</button>
                                    <button type="submit" disabled={creating} className={`flex-1 py-2 rounded-xl font-bold shadow-md disabled:opacity-50 transition-colors ${
                                        isObsidian ? 'bg-[#E6C97A] text-black hover:bg-[#E6C97A]/90 font-extrabold' : 'text-white'
                                    }`} style={!isObsidian ? { background: B.amber } : {}}>
                                        {creating ? 'Creating...' : 'Create Room'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RoomsList;
