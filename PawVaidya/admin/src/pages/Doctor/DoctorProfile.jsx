import React, { useContext, useEffect, useState, useRef } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Camera, MapPin, Phone, Clock, CreditCard, Edit2, Save, RefreshCw, UserCheck, ShieldCheck } from 'lucide-react';
import { getCurrentLocation } from '../../../../frontend/src/utils/geolocation';
import FaceAuth from '../../components/FaceAuth';
import { motion, AnimatePresence } from 'framer-motion';

const DoctorProfile = () => {
    const { dtoken, profileData, setProfileData, getProfileData, backendurl } = useContext(DoctorContext);
    const [isEdit, setIsEdit] = useState(false);
    const fileInputRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [showFaceAuth, setShowFaceAuth] = useState(false);
    const [faceAuthMode, setFaceAuthMode] = useState('');
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [attendanceTime, setAttendanceTime] = useState(null);
    const [todaySchedule, setTodaySchedule] = useState(null);

    const fetchTodaySchedule = async () => {
        try {
            const { data } = await axios.post(
                backendurl + '/api/doctor-schedule/get-schedules',
                {},
                { headers: { dtoken } }
            );

            if (data.success) {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayName = days[new Date().getDay()];
                const schedule = data.schedules.find(s => s.dayOfWeek === dayName && s.isActive);
                setTodaySchedule(schedule || null);
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setProfileData((prev) => ({
                    ...prev,
                    tempImage: e.target.result,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const refreshLocation = async () => {
        setLocationLoading(true);
        try {
            const location = await getCurrentLocation();
            const locationWithTimestamp = {
                ...location,
                timestamp: Date.now()
            };

            // Update doctor location in backend
            const response = await axios.post(backendurl + '/api/doctor/location',
                { location: locationWithTimestamp },
                { headers: { dtoken } }
            );

            if (response.data.success) {
                setProfileData(prev => ({
                    ...prev,
                    location: locationWithTimestamp
                }));
                toast.success('Location updated successfully');
            }
        } catch (error) {
            console.error('Error refreshing location:', error);
            toast.error('Failed to update location');
        } finally {
            setLocationLoading(false);
        }
    };

    const checkAttendance = async () => {
        try {
            const { data } = await axios.post(backendurl + '/api/doctor/attendance-status', { docId: profileData._id }, { headers: { dtoken } });
            if (data.success) {
                setIsClockedIn(data.isClockedIn);
                setAttendanceTime(data.attendanceTime);
            }
        } catch (error) {
            console.error('Error checking attendance:', error);
        }
    };

    const handleAvailabilityToggle = async () => {
        if (!isClockedIn && !profileData.available) {
            toast.warning('You must give attendance using face recognition before becoming available.');
            return;
        }

        try {
            const { data } = await axios.post(backendurl + '/api/doctor/change-availability', { docId: profileData._id }, { headers: { dtoken } });
            if (data.success) {
                setProfileData(prev => ({ ...prev, available: !prev.available }));
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const updateProfile = async () => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('docId', profileData._id);
            formData.append('fees', profileData.fees);
            formData.append('address', JSON.stringify(profileData.address));
            formData.append('available', profileData.available);
            formData.append('about', profileData.about);
            formData.append('full_address', profileData.full_address);
            formData.append('experience', profileData.experience);
            formData.append('docphone', profileData.docphone);

            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            const { data } = await axios.post(
                `${backendurl}/api/doctor/update-profile`,
                formData,
                { headers: { dtoken } }
            );

            if (data.success) {
                toast.success('Profile updated successfully');
                setIsEdit(false);
                setSelectedImage(null);
                getProfileData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dtoken) {
            getProfileData();
            fetchTodaySchedule();
        }
    }, [dtoken]);

    useEffect(() => {
        if (profileData && profileData._id) {
            checkAttendance();

            // Auto-toggle availability OFF if outside attendance window
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();

            let isWithinWindow = false;
            if (todaySchedule) {
                const [sHour, sMin] = todaySchedule.startTime.split(':').map(Number);
                const [eHour, eMin] = todaySchedule.endTime.split(':').map(Number);
                isWithinWindow = (hour > sHour || (hour === sHour && minute >= sMin)) &&
                    (hour < eHour || (hour === eHour && minute <= eMin));
            } else {
                // Default fallback
                isWithinWindow = (hour > 10 || (hour === 10 && minute >= 0)) && (hour < 20 || (hour === 20 && minute <= 30));
            }

            if (!isWithinWindow && profileData.available) {
                handleAvailabilityToggle();
            }
        }
    }, [profileData?._id, todaySchedule]);

    const isWithinAttendanceWindow = () => {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();

        if (todaySchedule) {
            const [sHour, sMin] = todaySchedule.startTime.split(':').map(Number);
            const [eHour, eMin] = todaySchedule.endTime.split(':').map(Number);
            return (hour > sHour || (hour === sHour && minute >= sMin)) &&
                (hour < eHour || (hour === eHour && minute <= eMin));
        }

        // Default window: 10:00 AM to 8:30 PM
        return (hour > 10 || (hour === 10 && minute >= 0)) && (hour < 20 || (hour === 20 && minute <= 30));
    };

    const getWindowLabel = () => {
        if (todaySchedule) {
            return `${todaySchedule.startTime} - ${todaySchedule.endTime}`;
        }
        return "10:00 AM - 08:30 PM";
    };

    if (!profileData) return null;

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="bg-white rounded-xl shadow-sm overflow-visible p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        {/* Profile Image */}
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-green-100">
                                <img
                                    className="w-full h-full object-cover"
                                    src={profileData.tempImage || profileData.image}
                                    alt={profileData.name}
                                />
                            </div>
                            {isEdit && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Camera className="w-6 h-6 text-white" />
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">{profileData.name}</h1>
                            <p className="text-gray-500 mt-1">{profileData.degree} · {profileData.speciality}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    {profileData.experience}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {!isEdit && (
                                <button
                                    onClick={() => {
                                        setFaceAuthMode('doctor_register');
                                        setShowFaceAuth(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md hover:scale-105 transition-all duration-300"
                                >
                                    <Camera className="w-4 h-4" />
                                    Register Face
                                </button>
                            )}
                            <button
                                onClick={() => isEdit ? updateProfile() : setIsEdit(true)}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {isEdit ? (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                ) : (
                                    <>
                                        <Edit2 className="w-4 h-4" />
                                        Edit Profile
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Attendance & Availability */}
                    <div className="mt-6 flex flex-col md:flex-row md:items-center gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAvailabilityToggle}
                                disabled={!isWithinAttendanceWindow()}
                                className={`relative w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none shadow-inner ${profileData.available
                                    ? "bg-green-500 shadow-green-200/50"
                                    : "bg-gray-300 shadow-gray-400/20"
                                    } ${!isWithinAttendanceWindow() ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <motion.div
                                    layout
                                    transition={{
                                        type: "spring",
                                        stiffness: 700,
                                        damping: 30
                                    }}
                                    className={`w-5 h-5 bg-white rounded-full shadow-md ${profileData.available ? "ml-auto" : "ml-0"
                                        }`}
                                />
                                {profileData.available && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute inset-0 rounded-full bg-green-400/20 animate-pulse"
                                    />
                                )}
                            </motion.button>
                            <span className="text-sm font-medium text-gray-700">
                                Available for Appointments
                                {!isWithinAttendanceWindow() && <span className="text-xs text-red-500 ml-2">(Closed: {getWindowLabel()} only)</span>}
                            </span>
                        </div>

                        <div className="h-4 w-px bg-gray-300 hidden md:block"></div>

                        <div className="flex items-center gap-4 flex-wrap">
                            {isClockedIn ? (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-sm font-medium">Attendance Given at {new Date(attendanceTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        if (!isWithinAttendanceWindow()) {
                                            toast.error(`Attendance can only be given between ${getWindowLabel()}`);
                                            return;
                                        }
                                        if (profileData.faceDescriptor?.length === 128) {
                                            setFaceAuthMode('doctor_clockin');
                                            setShowFaceAuth(true);
                                        } else {
                                            toast.info('Please register your face first.');
                                        }
                                    }}
                                    disabled={!isWithinAttendanceWindow()}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-white transition-all text-sm font-medium shadow-lg hover:shadow-amber-500/20 ${isWithinAttendanceWindow() ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gray-400 cursor-not-allowed'}`}
                                >
                                    <UserCheck className="w-4 h-4" />
                                    Give Attendance
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>

                {showFaceAuth && (
                    <FaceAuth
                        mode={faceAuthMode}
                        onAuthSuccess={() => {
                            setShowFaceAuth(false);
                            getProfileData();
                            checkAttendance();
                        }}
                        onCancel={() => setShowFaceAuth(false)}
                    />
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* About Section */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
                        {isEdit ? (
                            <textarea
                                className="w-full min-h-[200px] p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                                value={profileData.about}
                                onChange={(e) => setProfileData(prev => ({ ...prev, about: e.target.value }))}
                            />
                        ) : (
                            <p className="text-gray-600 whitespace-pre-wrap">{profileData.about}</p>
                        )}
                    </div>

                    {/* Contact & Details */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact & Details</h2>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-gray-400" />
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Consultation Fee:</span>
                                    {isEdit ? (
                                        <input
                                            type="number"
                                            className="w-24 p-1 rounded border border-gray-200"
                                            value={profileData.fees}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, fees: e.target.value }))}
                                        />
                                    ) : (
                                        <span className="font-medium">₹{profileData.fees}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-gray-400" />
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Phone:</span>
                                    {isEdit ? (
                                        <input
                                            type="tel"
                                            className="w-32 p-1 rounded border border-gray-200"
                                            value={profileData.docphone}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, docphone: e.target.value }))}
                                        />
                                    ) : (
                                        <span className="font-medium">+91 {profileData.docphone}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Address:</span>
                                        {!isEdit && (
                                            <button
                                                onClick={refreshLocation}
                                                disabled={locationLoading}
                                                className="inline-flex items-center px-2 py-1 text-xs bg-green-50 text-green-700 rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {locationLoading ? (
                                                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                                ) : (
                                                    <RefreshCw className="w-3 h-3 mr-1" />
                                                )}
                                                Update Location
                                            </button>
                                        )}
                                    </div>
                                    {isEdit ? (
                                        <div className="space-y-2 mt-2">
                                            <input
                                                type="text"
                                                className="w-full p-2 rounded border border-gray-200"
                                                value={profileData.address.Location}
                                                onChange={(e) => setProfileData(prev => ({
                                                    ...prev,
                                                    address: { ...prev.address, Location: e.target.value }
                                                }))}
                                                placeholder="Location"
                                            />
                                            <input
                                                type="text"
                                                className="w-full p-2 rounded border border-gray-200"
                                                value={profileData.address.line}
                                                onChange={(e) => setProfileData(prev => ({
                                                    ...prev,
                                                    address: { ...prev.address, line: e.target.value }
                                                }))}
                                                placeholder="Street Address"
                                            />
                                        </div>
                                    ) : (
                                        <p className="font-medium mt-1">
                                            {profileData.address.Location}, {profileData.address.line}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Full Address */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Complete Address</h2>
                    {isEdit ? (
                        <textarea
                            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                            rows={4}
                            value={profileData.full_address}
                            onChange={(e) => setProfileData(prev => ({ ...prev, full_address: e.target.value }))}
                        />
                    ) : (
                        <p className="text-gray-600 whitespace-pre-wrap">{profileData.full_address}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorProfile;