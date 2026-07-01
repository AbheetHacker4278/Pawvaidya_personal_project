import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Video, Calendar, Clock, Loader, Shield, Play, Info, Sparkles, User, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoConsultation = () => {
    const navigate = useNavigate();
    const { doctors, backendurl, token, userdata, getdoctorsdata } = useContext(AppContext);
    const [eligible, setEligible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [slotDate, setSlotDate] = useState('');
    const [slotTime, setSlotTime] = useState('');
    const [booking, setBooking] = useState(false);
    const [docSlots, setDocSlots] = useState([]);
    const [slotIndex, setSlotIndex] = useState(0);

    const isObsidian = userdata?.subscription?.plan === 'Obsidian';
    const daysofWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    useEffect(() => {
        if (!token) {
            toast.warn('Please login to access video consultations');
            navigate('/login');
            return;
        }

        const isEligible = (userdata?.subscription?.plan === 'Gold' || userdata?.subscription?.plan === 'Platinum' || userdata?.subscription?.plan === 'Obsidian') &&
            userdata?.subscription?.status === 'Active';
        setEligible(isEligible);
        setLoading(false);
    }, [token, userdata, navigate]);

    const getAvailableSlots = async (doc) => {
        try {
            const { data } = await axios.get(backendurl + `/api/user/doctor-video-slots/${doc._id}`, { headers: { token } });
            if (data.success) {
                let timeSlots = [];
                let today = new Date();

                for (let i = 0; i < 7; i++) {
                    let currentDate = new Date(today);
                    currentDate.setDate(today.getDate() + i);
                    let dayIndex = currentDate.getDay(); // 0-6 (Sun-Sat)
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const dayName = dayNames[dayIndex];

                    let daySlots = [];
                    const slotsForDay = data.slots.filter(s => s.dayOfWeek === dayName);

                    slotsForDay.forEach(slot => {
                        let [hours, minutes] = slot.slotTime.split(':');
                        let slotDateTime = new Date(currentDate);
                        slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                        if (slotDateTime > today) {
                            let formattedTime = slot.slotTime;
                            let dateObj = new Date(currentDate);
                            let day = dateObj.getDate();
                            let month = dateObj.getMonth() + 1;
                            let year = dateObj.getFullYear();
                            const slotDateStr = `${day}_${month}_${year}`;

                            const isAvailable = !(doc.slots_booked?.[slotDateStr]?.includes(formattedTime));

                            if (isAvailable) {
                                daySlots.push({
                                    datetime: slotDateTime,
                                    time: formattedTime
                                });
                            }
                        }
                    });
                    timeSlots.push({
                        date: new Date(currentDate),
                        slots: daySlots
                    });
                }
                setDocSlots(timeSlots);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleBookClick = (doc) => {
        setSelectedDoc(doc);
        getAvailableSlots(doc);
        setShowBookingModal(true);
    };

    const bookAppointment = async () => {
        if (!slotTime) return toast.warn('Please select a time slot');

        setBooking(true);
        try {
            const date = docSlots[slotIndex].date;
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const formattedDate = `${day}_${month}_${year}`;

            const { data } = await axios.post(
                backendurl + '/api/user/book-video-appointment',
                { userId: userdata.id || userdata._id, docId: selectedDoc._id, slotDate: formattedDate, slotTime },
                { headers: { token } }
            );

            if (data.success) {
                toast.success(data.message);
                setShowBookingModal(false);
                getdoctorsdata();
                navigate('/my-appointments');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setBooking(false);
        }
    };

    if (loading) return <div className='min-h-[60vh] flex items-center justify-center'><Loader className='animate-spin text-primary' /></div>;

    if (!eligible) {
        return (
            <div className={`min-h-screen pt-20 px-4 flex flex-col items-center justify-center text-center transition-colors duration-300 ${isObsidian ? 'bg-[#050505]' : 'bg-[#F2E4C6]'}`}>
                <Shield className={`w-20 h-20 mb-6 ${isObsidian ? 'text-[#E6C97A]' : 'text-[#5A4035]'}`} />
                <h1 className={`text-4xl font-serif mb-4 ${isObsidian ? 'text-white' : 'text-[#3d2b1f]'}`}>Premium Access Required</h1>
                <p className={`max-w-md mb-8 ${isObsidian ? 'text-neutral-400' : 'text-[#5A4035]'}`}>Video Consultations are exclusively available for our Gold, Platinum, and Obsidian subscribers. Upgrade your plan to enjoy one-on-one expert advice from the comfort of your home.</p>
                <button onClick={() => navigate('/subscription')} className={`px-8 py-3 rounded-full transition-all shadow-lg font-bold ${isObsidian ? 'bg-gradient-to-r from-[#c8860a] to-[#E6C97A] text-black hover:opacity-90' : 'bg-[#5A4035] text-[#F2E4C6] hover:bg-[#3d2b1f]'}`}>
                    View Subscription Plans
                </button>
            </div>
        );
    }

    return (
        <div className={`min-h-screen pt-10 pb-20 transition-colors duration-300 ${isObsidian ? 'bg-[#050505]' : 'bg-[#F2E4C6]'}`}>
            <div className="max-w-7xl mx-auto px-4">
                <header className="mb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4 shadow-sm ${isObsidian ? 'bg-[#1a1a1a] text-[#E6C97A] border border-amber-500/20' : 'bg-[#e8d5b0] text-[#5A4035]'}`}
                    >
                        <Video size={16} />
                        <span>PREMIUM VIDEO CONSULTATION</span>
                    </motion.div>
                    <h1 className="text-5xl md:text-6xl font-serif mb-4" style={{ color: isObsidian ? '#fff' : '#3d2b1f' }}>Connect with Experts</h1>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: isObsidian ? '#E6C97A' : '#5A4035' }}>Skip the travel and consult with India's top veterinarians via secure, high-definition video calls.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {doctors.filter(d => d.available).map((doc, index) => (
                        <motion.div
                          key={doc._id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className={`backdrop-blur-md rounded-[2.5rem] p-6 border shadow-xl hover:shadow-2xl transition-all group flex flex-col ${isObsidian ? 'bg-zinc-950/80 border-zinc-800/80 hover:border-amber-500/30' : 'bg-white/40 border-white/50'}`}
                        >
                            <div className="relative mb-6">
                                <img src={doc.image} alt={doc.name} className="w-full h-64 object-cover rounded-[2rem] shadow-md group-hover:scale-[1.02] transition-transform duration-500" />
                                <div className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Online</div>
                            </div>

                            <h3 className={`text-2xl font-serif mb-1 ${isObsidian ? 'text-white' : 'text-[#3d2b1f]'}`}>Dr. {doc.name}</h3>
                            <p className={`font-medium mb-4 ${isObsidian ? 'text-[#E6C97A]' : 'text-[#c8860a]'}`}>{doc.speciality}</p>

                            <div className={`flex items-center gap-4 text-sm mb-6 ${isObsidian ? 'text-neutral-400' : 'text-[#5A4035]'}`}>
                                <span className="flex items-center gap-1"><Calendar size={14} /> Available 7 Days</span>
                                <span className="flex items-center gap-1"><Clock size={14} /> 10:00 - 20:30</span>
                            </div>

                            <button
                                onClick={() => handleBookClick(doc)}
                                className={`mt-auto w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all group/btn shadow-lg ${isObsidian ? 'bg-gradient-to-r from-[#c8860a] to-[#E6C97A] text-black hover:opacity-90' : 'bg-[#5A4035] text-[#F2E4C6] hover:bg-[#3d2b1f]'}`}
                            >
                                <Play size={18} className="group-hover/btn:scale-110 transition-transform" />
                                Book Video Call
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Booking Modal */}
            <AnimatePresence>
                {showBookingModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowBookingModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={`w-full max-w-2xl rounded-[3rem] p-8 relative shadow-2xl overflow-hidden ${isObsidian ? 'bg-[#121212] text-white' : 'bg-[#F2E4C6]'}`}
                            style={{ border: isObsidian ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid #e8d5b0' }}
                        >
                            <button onClick={() => setShowBookingModal(false)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${isObsidian ? 'hover:bg-zinc-800' : 'hover:bg-black/5'}`}>
                                <XCircle size={24} className={isObsidian ? 'text-[#E6C97A]' : 'text-[#5A4035]'} />
                            </button>

                            <div className="flex items-center gap-6 mb-8">
                                <img src={selectedDoc.image} alt="" className="w-24 h-24 rounded-2xl object-cover shadow-lg border-2 border-white" />
                                <div>
                                    <h2 className={`text-3xl font-serif ${isObsidian ? 'text-white' : 'text-[#3d2b1f]'}`}>Dr. {selectedDoc.name}</h2>
                                    <p className={`font-medium ${isObsidian ? 'text-[#E6C97A]' : 'text-[#c8860a]'}`}>{selectedDoc.speciality}</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <p className={`font-bold mb-4 uppercase tracking-widest text-xs ${isObsidian ? 'text-neutral-400' : 'text-[#5A4035]'}`}>Select Preferred Day</p>
                                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                    {docSlots.map((item, index) => (
                                        <div
                                            key={index}
                                            onClick={() => { setSlotIndex(index); setSlotTime(''); }}
                                            className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${slotIndex === index ? (isObsidian ? 'bg-[#E6C97A] text-black shadow-lg scale-105 font-bold' : 'bg-[#5A4035] text-white shadow-lg scale-105') : (isObsidian ? 'bg-zinc-900 text-neutral-300 hover:bg-zinc-800 border border-zinc-800' : 'bg-white/50 text-[#5A4035] hover:bg-white/80')}`}
                                        >
                                            <span className="text-xs uppercase opacity-70">{daysofWeek[item.date.getDay()]}</span>
                                            <span className="text-xl font-bold">{item.date.getDate()}</span>
                                            {item.slots.length === 0 && <span className="text-[8px] text-red-500 font-bold">NO SLOTS</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-10">
                                <p className={`font-bold mb-4 uppercase tracking-widest text-xs ${isObsidian ? 'text-neutral-400' : 'text-[#5A4035]'}`}>Available Time Slots</p>
                                <div className="grid grid-cols-4 gap-3">
                                    {docSlots[slotIndex]?.slots.map((item, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setSlotTime(item.time)}
                                            className={`py-3 rounded-xl text-center cursor-pointer transition-all text-sm font-medium ${slotTime === item.time ? (isObsidian ? 'bg-[#E6C97A] text-black shadow-md font-bold' : 'bg-[#c8860a] text-white shadow-md') : (isObsidian ? 'bg-zinc-900 text-white border border-zinc-800 hover:border-amber-500/40' : 'bg-white text-[#5A4035] hover:border-[#c8860a] border border-transparent')}`}
                                        >
                                            {item.time}
                                        </div>
                                    ))}
                                    {(!docSlots[slotIndex] || docSlots[slotIndex].slots.length === 0) && (
                                        <div className={`col-span-4 py-8 text-center rounded-xl border border-dashed ${isObsidian ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white/30 border-[#5A4035]/30'}`}>
                                            <p className={`text-sm italic ${isObsidian ? 'text-neutral-400' : 'text-[#5A4035]'}`}>No slots available for this day.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={bookAppointment}
                                disabled={booking}
                                className={`w-full py-5 rounded-[2rem] font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-2 ${isObsidian ? 'bg-gradient-to-r from-[#c8860a] to-[#E6C97A] text-black hover:opacity-90' : 'bg-[#5A4035] text-[#F2E4C6] hover:bg-[#3d2b1f]'}`}
                            >
                                {booking ? <Loader className="animate-spin" /> : <Play size={20} />}
                                {booking ? 'Processing...' : 'Confirm Video Request'}
                            </button>

                            <p className={`mt-4 text-center text-xs ${isObsidian ? 'text-neutral-400' : 'text-[#5A4035] opacity-60'}`}>Wait for doctor approval. You'll be notified once confirmed.</p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VideoConsultation;
