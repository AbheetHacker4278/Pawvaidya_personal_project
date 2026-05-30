import React, { useContext, useEffect, useState, useRef } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Camera, MapPin, Phone, Clock, CreditCard, Edit2, Save, RefreshCw, UserCheck, ShieldCheck, Upload, FileText, Eye, Trash2, CheckCircle, XCircle, AlertCircle, FolderOpen } from 'lucide-react';
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
    const [imageUrl, setImageUrl] = useState('');

    // Medical Documents state
    const [medicalDocs, setMedicalDocs] = useState([]);
    const [uploadCategory, setUploadCategory] = useState('education');
    const [docFiles, setDocFiles] = useState([]);
    const [docUploading, setDocUploading] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    const docInputRef = useRef(null);

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
            setImageUrl(''); // Clear URL if file is selected
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

    const handleImageUrlChange = (url) => {
        setImageUrl(url);
        if (url) {
            setSelectedImage(null); // Clear file if URL is pasted
            setProfileData((prev) => ({
                ...prev,
                tempImage: url,
            }));
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
            formData.append('name', profileData.name);
            formData.append('fees', profileData.fees);
            formData.append('address', JSON.stringify(profileData.address));
            formData.append('available', profileData.available);
            formData.append('about', profileData.about);
            formData.append('full_address', profileData.full_address);
            formData.append('experience', profileData.experience);
            formData.append('docphone', profileData.docphone);

            if (selectedImage) {
                formData.append('image', selectedImage);
            } else if (imageUrl) {
                formData.append('image', imageUrl);
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
            fetchMyDocs();
        }
    }, [dtoken]);

    const fetchMyDocs = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/doctor/documents/my', { headers: { dtoken } });
            if (data.success) setMedicalDocs(data.documents || []);
        } catch (e) {
            console.error('fetchMyDocs error:', e);
        }
    };

    const handleDocUpload = async () => {
        if (docFiles.length === 0) return toast.error('Please select file(s) to upload');
        setDocUploading(true);
        try {
            const fd = new FormData();
            fd.append('category', uploadCategory);
            docFiles.forEach(f => fd.append('documents', f));
            const { data } = await axios.post(backendurl + '/api/doctor/documents/upload', fd, { headers: { dtoken } });
            if (data.success) {
                toast.success(data.message);
                setDocFiles([]);
                if (docInputRef.current) docInputRef.current.value = '';
                fetchMyDocs();
            } else {
                toast.error(data.message);
            }
        } catch (e) {
            toast.error('Upload failed: ' + e.message);
        } finally {
            setDocUploading(false);
        }
    };

    const handleDocDelete = async (docId) => {
        if (!window.confirm('Delete this document?')) return;
        try {
            const { data } = await axios.post(backendurl + '/api/doctor/documents/delete', { documentId: docId }, { headers: { dtoken } });
            if (data.success) {
                toast.success('Document deleted');
                fetchMyDocs();
            } else toast.error(data.message);
        } catch (e) {
            toast.error('Delete failed');
        }
    };

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

                        {/* Image URL Input */}
                        {isEdit && (
                            <div className="flex-1 max-w-xs">
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Or Paste Image URL</label>
                                <input
                                    type="text"
                                    className="w-full p-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                                    placeholder="https://example.com/image.jpg"
                                    value={imageUrl}
                                    onChange={(e) => handleImageUrlChange(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Basic Info */}
                        <div className="flex-1">
                            {isEdit ? (
                                <input
                                    type="text"
                                    className="text-2xl font-bold text-gray-900 border-b-2 border-green-400 focus:outline-none focus:border-green-600 bg-transparent w-full mb-1"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Doctor Name"
                                />
                            ) : (
                                <h1 className="text-2xl font-bold text-gray-900">{profileData.name}</h1>
                            )}
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

                {/* ─── Medical Documents Section ─── */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <FolderOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Medical Documents</h2>
                                <p className="text-indigo-100 text-sm">Upload your education certificates, medical records &amp; government IDs</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Upload Panel */}
                        <div className="border-2 border-dashed border-indigo-200 rounded-xl p-6 bg-indigo-50/40 hover:bg-indigo-50 transition-colors">
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                                {/* Category */}
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Document Category</label>
                                    <select
                                        value={uploadCategory}
                                        onChange={e => setUploadCategory(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-sm"
                                    >
                                        <option value="education">🎓 Medical Education</option>
                                        <option value="records">📋 Medical Records</option>
                                        <option value="govtId">🪪 Government ID</option>
                                        <option value="other">📁 Other</option>
                                    </select>
                                </div>
                                {/* File Picker */}
                                <div className="flex-[2]">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Files <span className="text-gray-400 font-normal">(images → Cloudinary, PDFs/others → Firebase)</span></label>
                                    <input
                                        ref={docInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*,application/pdf,.doc,.docx"
                                        onChange={e => setDocFiles(Array.from(e.target.files))}
                                        className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-xs file:font-semibold hover:file:bg-indigo-700 cursor-pointer"
                                    />
                                    {docFiles.length > 0 && (
                                        <p className="mt-1 text-xs text-indigo-600 font-medium">{docFiles.length} file(s) selected</p>
                                    )}
                                </div>
                                {/* Upload Btn */}
                                <button
                                    onClick={handleDocUpload}
                                    disabled={docUploading || docFiles.length === 0}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-indigo-200 whitespace-nowrap"
                                >
                                    {docUploading ? (
                                        <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading...</>
                                    ) : (
                                        <><Upload className="w-4 h-4" /> Upload Now</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Documents List */}
                        {medicalDocs.length === 0 ? (
                            <div className="text-center py-10">
                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No documents uploaded yet</p>
                                <p className="text-gray-400 text-sm">Upload your medical education, records or government IDs above</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {medicalDocs.map(doc => (
                                    <motion.div
                                        key={doc._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="group relative bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300"
                                    >
                                        {/* Preview Thumbnail */}
                                        <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                                            {doc.fileType === 'image' ? (
                                                <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <FileText className="w-12 h-12 text-indigo-400" />
                                                    <span className="text-xs text-gray-500 mt-1 uppercase font-bold">
                                                        {doc.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Overlay on hover */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <a href={doc.url} target="_blank" rel="noreferrer"
                                                    className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
                                                    title="Open">
                                                    <Eye className="w-4 h-4 text-gray-700" />
                                                </a>
                                                <button
                                                    onClick={() => handleDocDelete(doc._id)}
                                                    className="w-9 h-9 bg-red-500 rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
                                                    title="Delete">
                                                    <Trash2 className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info footer */}
                                        <div className="p-3">
                                            <p className="text-xs font-semibold text-gray-800 truncate" title={doc.name}>{doc.name}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                    doc.category === 'education' ? 'bg-blue-100 text-blue-700' :
                                                    doc.category === 'records' ? 'bg-green-100 text-green-700' :
                                                    doc.category === 'govtId' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {doc.category === 'education' ? '🎓 Education' :
                                                     doc.category === 'records' ? '📋 Records' :
                                                     doc.category === 'govtId' ? '🪪 Govt ID' : '📁 Other'}
                                                </span>
                                                <span className={`flex items-center gap-1 text-[10px] font-bold ${
                                                    doc.verificationStatus === 'verified' ? 'text-emerald-600' :
                                                    doc.verificationStatus === 'rejected' ? 'text-red-500' :
                                                    'text-amber-500'
                                                }`}>
                                                    {doc.verificationStatus === 'verified' ? <CheckCircle className="w-3 h-3" /> :
                                                     doc.verificationStatus === 'rejected' ? <XCircle className="w-3 h-3" /> :
                                                     <AlertCircle className="w-3 h-3" />}
                                                    {doc.verificationStatus?.charAt(0).toUpperCase() + doc.verificationStatus?.slice(1)}
                                                </span>
                                            </div>
                                            {doc.adminNote && (
                                                <p className="mt-1.5 text-[10px] text-gray-500 italic border-t border-gray-100 pt-1.5">
                                                    Admin note: {doc.adminNote}
                                                </p>
                                            )}
                                            <p className="text-[9px] text-gray-400 mt-1">
                                                {doc.storageProvider === 'cloudinary' ? '☁️ Cloudinary' : '🔥 Firebase'} · {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorProfile;