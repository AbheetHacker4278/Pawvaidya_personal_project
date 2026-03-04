import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import RunningDogLoader from '../components/RunningDogLoader';

const AdminProfile = () => {
    const { backendurl, atoken } = useContext(AppContext);
    const [adminData, setAdminData] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [isPasswordEdit, setIsPasswordEdit] = useState(false);
    const [image, setImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        setIsVisible(true);
        fetchAdminProfile();
    }, []);

    const fetchAdminProfile = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/admin/profile`, {
                headers: { atoken }
            });

            if (data.success) {
                setAdminData(data.admin);
                setFormData({
                    name: data.admin.name || '',
                    email: data.admin.email || ''
                });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch admin profile');
        }
    };

    const handleProfileUpdate = async () => {
        setIsLoading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('newEmail', formData.email);

            if (image) {
                formDataToSend.append('image', image);
            }

            const { data } = await axios.put(
                `${backendurl}/api/admin/profile`,
                formDataToSend,
                { headers: { atoken } }
            );

            if (data.success) {
                toast.success('Profile updated successfully');
                setAdminData(data.admin);
                setIsEdit(false);
                setImage(null);

                // If email changed, update token
                if (data.token) {
                    localStorage.setItem('atoken', data.token);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await axios.put(
                `${backendurl}/api/admin/password`,
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                },
                { headers: { atoken } }
            );

            if (data.success) {
                toast.success('Password updated successfully');
                setIsPasswordEdit(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    if (!adminData) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="flex justify-center items-center h-64">
                    <RunningDogLoader />
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8 transform transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className={`bg-white rounded-2xl shadow-lg p-6 mb-6 transform transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Profile</h1>
                    <p className="text-gray-600">Manage your admin account settings</p>
                </div>

                {/* Profile Information Card */}
                <div className={`bg-white rounded-2xl shadow-lg p-6 mb-6 transform transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">Profile Information</h2>
                        {!isEdit && (
                            <button
                                onClick={() => setIsEdit(true)}
                                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-105"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Profile Image */}
                        <div className="flex flex-col items-center">
                            <div className="relative group">
                                <img
                                    src={image ? URL.createObjectURL(image) : (adminData.image || assets.upload_area)}
                                    alt="Admin"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 group-hover:border-primary/40 transition-all duration-300"
                                />
                                {isEdit && (
                                    <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-all duration-300 transform hover:scale-110">
                                        <input
                                            type="file"
                                            onChange={(e) => setImage(e.target.files[0])}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </label>
                                )}
                            </div>
                            <p className="mt-2 text-sm text-gray-600">Admin</p>
                        </div>

                        {/* Profile Details */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                {isEdit ? (
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                                    />
                                ) : (
                                    <p className="text-gray-800 font-medium">{adminData.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                {isEdit ? (
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                                    />
                                ) : (
                                    <p className="text-gray-800 font-medium">{adminData.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                <p className="text-gray-800 font-medium capitalize">{adminData.role}</p>
                            </div>

                            {isEdit && (
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={handleProfileUpdate}
                                        disabled={isLoading}
                                        className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEdit(false);
                                            setImage(null);
                                            setFormData({
                                                name: adminData.name,
                                                email: adminData.email
                                            });
                                        }}
                                        className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Password Change Card */}
                <div className={`bg-white rounded-2xl shadow-lg p-6 transform transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">Change Password</h2>
                        {!isPasswordEdit && (
                            <button
                                onClick={() => setIsPasswordEdit(true)}
                                className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105"
                            >
                                Change Password
                            </button>
                        )}
                    </div>

                    {isPasswordEdit && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                                    placeholder="Enter new password (min. 8 characters)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handlePasswordUpdate}
                                    disabled={isLoading}
                                    className="flex-1 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Updating...' : 'Update Password'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsPasswordEdit(false);
                                        setPasswordData({
                                            currentPassword: '',
                                            newPassword: '',
                                            confirmPassword: ''
                                        });
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {!isPasswordEdit && (
                        <p className="text-gray-600">
                            Keep your account secure by regularly updating your password.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
