import React, { useState, useEffect, useContext } from 'react';
import { DoctorContext } from '../context/DoctorContext';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import RunningDogLoader from '../components/RunningDogLoader';
import { Calendar, Clock, Plus, Trash2, Power, Save, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DoctorSchedule = () => {
    const { dToken, backendurl, docId } = useContext(DoctorContext);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingDay, setEditingDay] = useState(null);
    const [formData, setFormData] = useState({
        dayOfWeek: '',
        startTime: '',
        endTime: '',
        slotDuration: 30
    });

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Fetch doctor's schedules
    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const { data } = await axios.post(
                backendurl + '/api/doctor-schedule/get-schedules',
                { docId },
                { headers: { dToken } }
            );

            if (data.success) {
                setSchedules(data.schedules);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error fetching schedules:', error);
            toast.error('Failed to fetch schedules');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dToken && docId) {
            fetchSchedules();
        }
    }, [dToken, docId]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Add or update schedule
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.dayOfWeek || !formData.startTime || !formData.endTime) {
            toast.warn('Please fill all fields');
            return;
        }

        try {
            setLoading(true);
            const { data } = await axios.post(
                backendurl + '/api/doctor-schedule/add-update',
                {
                    docId,
                    ...formData
                },
                { headers: { dToken } }
            );

            if (data.success) {
                toast.success(data.message);
                fetchSchedules();
                setFormData({
                    dayOfWeek: '',
                    startTime: '',
                    endTime: '',
                    slotDuration: 30
                });
                setEditingDay(null);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            toast.error('Failed to save schedule');
        } finally {
            setLoading(false);
        }
    };

    // Delete schedule
    const handleDelete = async (scheduleId) => {
        if (!window.confirm('Are you sure you want to delete this schedule?')) {
            return;
        }

        try {
            setLoading(true);
            const { data } = await axios.post(
                backendurl + '/api/doctor-schedule/delete',
                { scheduleId, docId },
                { headers: { dToken } }
            );

            if (data.success) {
                toast.success(data.message);
                fetchSchedules();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error deleting schedule:', error);
            toast.error('Failed to delete schedule');
        } finally {
            setLoading(false);
        }
    };

    // Toggle schedule status
    const handleToggleStatus = async (scheduleId) => {
        try {
            setLoading(true);
            const { data } = await axios.post(
                backendurl + '/api/doctor-schedule/toggle-status',
                { scheduleId, docId },
                { headers: { dToken } }
            );

            if (data.success) {
                toast.success(data.message);
                fetchSchedules();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error('Failed to toggle status');
        } finally {
            setLoading(false);
        }
    };

    // Edit schedule
    const handleEdit = (schedule) => {
        setEditingDay(schedule.dayOfWeek);
        setFormData({
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            slotDuration: schedule.slotDuration
        });
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditingDay(null);
        setFormData({
            dayOfWeek: '',
            startTime: '',
            endTime: '',
            slotDuration: 30
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-6 mb-8"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-[#5A4035] to-[#7a5a48] p-4 rounded-xl">
                            <Calendar className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Manage Your Schedule</h1>
                            <p className="text-gray-600 mt-1">Set your availability for patient appointments</p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Add/Edit Schedule Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Plus className="w-6 h-6 text-[#5A4035]" />
                            <h2 className="text-2xl font-bold text-gray-800">
                                {editingDay ? 'Edit Schedule' : 'Add New Schedule'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Day of Week */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Day of Week
                                </label>
                                <select
                                    name="dayOfWeek"
                                    value={formData.dayOfWeek}
                                    onChange={handleInputChange}
                                    disabled={editingDay !== null}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A4035] focus:border-transparent disabled:bg-gray-100"
                                    required
                                >
                                    <option value="">Select Day</option>
                                    {daysOfWeek.map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Start Time */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A4035] focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* End Time */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    End Time
                                </label>
                                <input
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A4035] focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Slot Duration */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Slot Duration (minutes)
                                </label>
                                <select
                                    name="slotDuration"
                                    value={formData.slotDuration}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A4035] focus:border-transparent"
                                    required
                                >
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>60 minutes</option>
                                </select>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-[#5A4035] to-[#7a5a48] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5" />
                                    {editingDay ? 'Update Schedule' : 'Add Schedule'}
                                </button>
                                {editingDay && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </motion.div>

                    {/* Schedule List */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Clock className="w-6 h-6 text-[#5A4035]" />
                            <h2 className="text-2xl font-bold text-gray-800">Your Schedules</h2>
                        </div>

                        {loading && schedules.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="flex justify-center py-8">
                                    <RunningDogLoader />
                                </div>
                                <p className="text-gray-600 mt-4">Loading schedules...</p>
                            </div>
                        ) : schedules.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600">No schedules added yet</p>
                                <p className="text-sm text-gray-500 mt-2">Add your first schedule to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                <AnimatePresence>
                                    {schedules.map((schedule) => (
                                        <motion.div
                                            key={schedule._id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className={`border-2 rounded-xl p-4 transition-all ${schedule.isActive
                                                ? 'border-green-200 bg-green-50'
                                                : 'border-gray-200 bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="text-lg font-bold text-gray-800">
                                                            {schedule.dayOfWeek}
                                                        </h3>
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${schedule.isActive
                                                                ? 'bg-green-200 text-green-800'
                                                                : 'bg-gray-300 text-gray-700'
                                                                }`}
                                                        >
                                                            {schedule.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1 text-sm text-gray-600">
                                                        <p className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4" />
                                                            {schedule.startTime} - {schedule.endTime}
                                                        </p>
                                                        <p className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            {schedule.slotDuration} min slots
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleEdit(schedule)}
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(schedule._id)}
                                                        className={`p-2 rounded-lg transition-all ${schedule.isActive
                                                            ? 'text-orange-600 hover:bg-orange-100'
                                                            : 'text-green-600 hover:bg-green-100'
                                                            }`}
                                                        title={schedule.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <Power className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(schedule._id)}
                                                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6"
                >
                    <h3 className="text-lg font-bold text-gray-800 mb-3">📋 How it works</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">1.</span>
                            <span>Add your availability for each day of the week</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">2.</span>
                            <span>Set start time, end time, and slot duration for appointments</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">3.</span>
                            <span>Patients can only book appointments during your available slots</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">4.</span>
                            <span>Toggle schedules on/off or delete them as needed</span>
                        </li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
};

export default DoctorSchedule;
