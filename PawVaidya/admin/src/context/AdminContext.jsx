import { createContext, useCallback, useState, useEffect } from "react";
import axios from "axios";
import { toast } from 'react-toastify'

export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const [atoken, setatoken] = useState(localStorage.getItem('atoken') ? localStorage.getItem('atoken') : '')
    const [doctors, setdoctors] = useState([])
    const [users, setusers] = useState([])
    const [subscriptions, setSubscriptions] = useState([]);
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
    const [appointments, setappointments] = useState([])
    const [dashdata, setdashdata] = useState(false)
    const [adminProfile, setAdminProfile] = useState(null)
    const [fraudAlerts, setFraudAlerts] = useState([])
    const [securityIncidentCount, setSecurityIncidentCount] = useState(0)
    const [contentViolationCount, setContentViolationCount] = useState(0)
    const [adminLocation, setAdminLocation] = useState(null)

    const backendurl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

    // ── Global alert count polling (security + content violations) ─────────────
    const fetchAlertCounts = useCallback(async () => {
        if (!atoken) return;
        try {
            const [incRes, violRes] = await Promise.allSettled([
                axios.get(`${backendurl}/api/admin/security-incidents`, { headers: { atoken } }),
                axios.get(`${backendurl}/api/admin/content-violations`, { headers: { atoken } })
            ]);
            if (incRes.status === 'fulfilled' && incRes.value.data.success) {
                const newCount = incRes.value.data.incidents.filter(i => i.status === 'new').length;
                setSecurityIncidentCount(newCount);
            }
            if (violRes.status === 'fulfilled' && violRes.value.data.success) {
                setContentViolationCount(violRes.value.data.unreadCount ?? 0);
            }
        } catch (_) { /* silent — don't spam toast on poll */ }
    }, [atoken, backendurl]);

    useEffect(() => {
        if (!atoken) return;
        fetchAlertCounts(); // initial fetch
        const interval = setInterval(fetchAlertCounts, 30000); // poll every 30s
        return () => clearInterval(interval);
    }, [atoken, fetchAlertCounts]);

    const getalldoctors = async () => {
        try {
            const { data } = await axios.post(backendurl + '/api/admin/all-doctors', {}, { headers: { atoken } })
            if (data.success) {
                setdoctors(data.doctors)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }
    const getallusers = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/admin/all-users', { headers: { atoken } })
            if (data.success) {
                setusers(data.users)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const changeavailablity = async (docId) => {
        try {
            const { data } = await axios.post(backendurl + '/api/admin/change-availablity', { docId }, { headers: { atoken } })
            if (data.success) {
                toast.success(data.message)
                getalldoctors()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getallappointments = useCallback(async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/admin/appointments`, {
                headers: { atoken },
            });
            if (data.success) {
                setappointments(data.appointments);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }, [atoken, setappointments]);

    const cancelappointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendurl + '/api/admin/cancel-appointment', { appointmentId }, { headers: { atoken } })

            if (data.success) {
                toast.success(data.message)
                getallappointments()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }
    const getdashdata = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/admin/dashboard', { headers: { atoken } })
            if (data.success) {
                setdashdata(data.dashdata)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const editUser = async (userId, userData, userImage = null) => {
        try {
            // Create form data if there's an image
            let formData;
            if (userImage) {
                formData = new FormData();
                // Add all user data to form data
                Object.keys(userData).forEach(key => {
                    formData.append(key, userData[key]);
                });
                // Add image to form data
                formData.append('image', userImage);
            }

            const { data } = await axios.put(
                `${backendurl}/api/admin/users/${userId}`,
                userImage ? formData : userData,
                {
                    headers: {
                        atoken,
                        ...(userImage ? { 'Content-Type': 'multipart/form-data' } : {})
                    }
                }
            );

            if (data.success) {
                toast.success(data.message);
                // Update users state by replacing the edited user
                setusers(users.map(user =>
                    user._id === userId ? data.user : user
                ));
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update user');
        }
    };

    // Ban user function
    const banUser = async (userId, userType, banDuration, banReason, banIp = false, ipAddress = null) => {
        try {
            const { data } = await axios.post(
                `${backendurl}/api/ban/ban`,
                { userId, userType, banDuration, banReason, banIp, ipAddress },
                { headers: { atoken } }
            );

            if (data.success) {
                toast.success(data.message);
                // Refresh users/doctors list
                if (userType === 'user') {
                    getallusers();
                } else {
                    getalldoctors();
                }
                return data.data;
            } else {
                toast.error(data.message);
                return null;
            }
        } catch (error) {
            toast.error(error.message || 'Failed to ban user');
            return null;
        }
    };

    // Unban user function
    const unbanUser = async (userId, userType, unbanReason) => {
        try {
            const { data } = await axios.post(
                `${backendurl}/api/ban/unban`,
                { userId, userType, unbanReason },
                { headers: { atoken } }
            );

            if (data.success) {
                toast.success(data.message);
                // Refresh users/doctors list
                if (userType === 'user') {
                    getallusers();
                } else {
                    getalldoctors();
                }
                return data.data;
            } else {
                toast.error(data.message);
                return null;
            }
        } catch (error) {
            toast.error(error.message || 'Failed to unban user');
            return null;
        }
    };

    // Delete user function
    const deleteUser = async (userId) => {
        try {
            const { data } = await axios.delete(`${backendurl}/api/admin/users/${userId}`, {
                headers: { atoken }
            });

            if (data.success) {
                toast.success(data.message);
                // Update users state by removing the deleted user
                setusers(users.filter(user => user._id !== userId));
                // Update dashboard data if needed
                getdashdata();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to delete user');
        }
    };
    const deleteDoctor = async (doctorId) => {
        try {
            const { data } = await axios.delete(`${backendurl}/api/admin/doctors/${doctorId}`, {
                headers: { atoken }
            });

            if (data.success) {
                toast.success(data.message);
                // Update doctors state by removing the deleted doctor
                setdoctors(doctors.filter(doctor => doctor._id !== doctorId));
                // Update dashboard data since doctor count and appointments may have changed
                getdashdata();
                // Refresh appointments list since some may have been deleted
                getallappointments();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to delete doctor');
        }
    };

    const getUsersWithPasswords = async () => {
        try {
            const { data } = await axios.get(
                backendurl + '/api/admin/users-with-passwords',
                { headers: { atoken } }
            );
            if (data.success) {
                return data.users;
            } else {
                toast.error(data.message);
                return [];
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch users with passwords');
            return [];
        }
    };

    const getDoctorsWithPasswords = async () => {
        try {
            const { data } = await axios.get(
                backendurl + '/api/admin/doctors-with-passwords',
                { headers: { atoken } }
            );
            if (data.success) {
                return data.doctors;
            } else {
                toast.error(data.message);
                return [];
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch doctors with passwords');
            return [];
        }
    };

    const getActivityLogs = async (userId = null, userType = null, limit = 100, skip = 0) => {
        try {
            const params = new URLSearchParams();
            if (userId) params.append('userId', userId);
            if (userType) params.append('userType', userType);
            params.append('limit', limit);
            params.append('skip', skip);

            const { data } = await axios.get(
                backendurl + '/api/admin/activity-logs?' + params.toString(),
                { headers: { atoken } }
            );
            if (data.success) {
                return data;
            } else {
                toast.error(data.message);
                return { logs: [], total: 0 };
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch activity logs');
            return { logs: [], total: 0 };
        }
    };

    const getRealtimeActivityLogs = async (minutes = 5) => {
        try {
            const { data } = await axios.get(
                backendurl + `/api/admin/realtime-activity-logs?minutes=${minutes}`,
                { headers: { atoken } }
            );
            if (data.success) {
                return data.logs;
            } else {
                toast.error(data.message);
                return [];
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch real-time activity logs');
            return [];
        }
    };

    const sendVerificationEmail = async (userId) => {
        try {
            const { data } = await axios.post(
                backendurl + '/api/admin/send-verification-email',
                { userId },
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Failed to send verification email');
            return false;
        }
    };

    const sendBroadcastEmail = async (formData) => {
        try {
            const { data } = await axios.post(
                backendurl + '/api/admin/broadcast-email',
                formData,
                { headers: { atoken } } // axios automatically sets Content-Type to multipart/form-data when data is FormData
            );
            if (data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message || 'Failed to send broadcast email');
            return false;
        }
    };

    const sendIndividualEmail = async (formData) => {
        try {
            const { data } = await axios.post(
                backendurl + '/api/admin/send-individual-email',
                formData,
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message || 'Failed to send individual email');
            return false;
        }
    };

    const makeAllDoctorsAvailable = async () => {
        try {
            const { data } = await axios.post(
                backendurl + '/api/admin/make-all-doctors-available',
                {},
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success(data.message);
                getalldoctors(); // Refresh the doctors list
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to make all doctors available');
        }
    };

    const makeAllDoctorsUnavailable = async () => {
        try {
            const { data } = await axios.post(
                backendurl + '/api/admin/make-all-doctors-unavailable',
                {},
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success(data.message);
                getalldoctors(); // Refresh the doctors list
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to make all doctors unavailable');
        }
    };

    const getAdminProfile = async () => {
        try {
            const { data } = await axios.get(
                backendurl + '/api/admin/profile',
                { headers: { atoken } }
            );
            if (data.success) {
                setAdminProfile(data.admin);
                return data.admin;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }
    };

    useEffect(() => {
        if (atoken) {
            getAdminProfile()
            fetchSecurityIncidentCount()
            // Refresh count every 1 minute
            const interval = setInterval(fetchSecurityIncidentCount, 60000);
            return () => clearInterval(interval);
        } else {
            setAdminProfile(null)
            setSecurityIncidentCount(0)
        }
    }, [atoken]);

    // Load cached location on mount
    useEffect(() => {
        const cachedLocation = localStorage.getItem('adminLocation');
        if (cachedLocation) {
            try {
                const parsedLocation = JSON.parse(cachedLocation);
                setAdminLocation(parsedLocation);
            } catch (error) {
                localStorage.removeItem('adminLocation');
            }
        }
    }, []);

    // Targeted Interceptor: Only send security headers to our backend
    useEffect(() => {
        const interceptor = axios.interceptors.request.use((config) => {
            // Check if request is going to our backend
            if (config.url && config.url.includes(backendurl) && adminLocation) {
                config.headers['x-client-latitude'] = adminLocation.latitude || adminLocation.lat;
                config.headers['x-client-longitude'] = adminLocation.longitude || adminLocation.lon;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });

        return () => axios.interceptors.request.eject(interceptor);
    }, [adminLocation, backendurl]);

    // Refresh count after resolving/fetching in the page (via global state)
    // The page itself calls setSecurityIncidentCount so it will be in sync




    // Admin Management Functions
    const addAdmin = async (adminData) => {
        try {
            const { data } = await axios.post(backendurl + '/api/admin/create-admin', adminData, { headers: { atoken } });
            if (data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message || 'Failed to add admin');
            return false;
        }
    };

    const getAllAdmins = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/admin/all-admins', { headers: { atoken } });
            if (data.success) {
                return data.admins;
            } else {
                toast.error(data.message);
                return [];
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch admins');
            return [];
        }
    };

    const updateAdmin = async (adminId, adminData) => {
        try {
            const { data } = await axios.put(`${backendurl}/api/admin/update-admin/${adminId}`, adminData, { headers: { atoken } });
            if (data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update admin');
            return false;
        }
    };

    const deleteAdmin = async (adminId) => {
        try {
            if (!window.confirm('Are you sure you want to delete this admin?')) return false;

            const { data } = await axios.delete(`${backendurl}/api/admin/delete-admin/${adminId}`, { headers: { atoken } });
            if (data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message || 'Failed to delete admin');
            return false;
        }
    };

    const updateSystemConfig = async (config) => {
        try {
            const { data } = await axios.post(backendurl + '/api/admin/system-config', config, { headers: { atoken } })
            if (data.success) {
                toast.success(data.message)
                getdashdata()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const fetchSecurityIncidentCount = async () => {
        if (!atoken) return;
        try {
            const { data } = await axios.get(`${backendurl}/api/admin/security-incidents/unread-count`, {
                headers: { atoken }
            });
            if (data.success) {
                setSecurityIncidentCount(data.count);
            }
        } catch (error) {
            console.error("Failed to fetch security incident count:", error);
        }
    };

    const getAllSubscriptions = async () => {
        setLoadingSubscriptions(true);
        try {
            const { data } = await axios.get(backendurl + '/api/admin/all-subscriptions', { headers: { atoken } });
            if (data.success) {
                setSubscriptions(data.subscriptions);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch subscriptions');
        } finally {
            setLoadingSubscriptions(false);
        }
    };

    const revokeSubscription = async (userId, reason, shouldRefund = false) => {
        try {
            const { data } = await axios.post(
                `${backendurl}/api/admin/revoke-subscription`,
                { userId, reason, shouldRefund },
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success(data.message);
                getAllSubscriptions(); // Refresh the list
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message || 'Failed to revoke subscription');
            return false;
        }
    };

    const giftSubscription = async (giftData) => {
        try {
            const { data } = await axios.post(
                `${backendurl}/api/admin/gift-subscription`,
                giftData,
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success(data.message);
                getAllSubscriptions(); // Refresh the list
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message || 'Failed to gift subscription');
            return false;
        }
    };

    // ── Admin Intelligence Functions ──────────────────────────────────────────
    const getFraudAlerts = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/admin/get-fraud-alerts', { headers: { atoken } });
            if (data.success) {
                setFraudAlerts(data.alerts);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            // Silently fail if fraud alerts cannot be fetched
        }
    };

    const updateCommissionRules = async (rules) => {
        try {
            const { data } = await axios.post(backendurl + '/api/admin/update-commission-rules', rules, { headers: { atoken } });
            if (data.success) {
                toast.success(data.message);
                getdashdata(); // Refresh dashboard to see new calculations
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const sendEmergencyBroadcast = async (broadcast) => {
        try {
            const { data } = await axios.post(backendurl + '/api/admin/send-emergency-broadcast', broadcast, { headers: { atoken } });
            if (data.success) {
                toast.success(data.message);
                getdashdata();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const blacklistEmails = async (emails, type, reason) => {
        try {
            const { data } = await axios.post(
                `${backendurl}/api/admin/blacklist`,
                { emails, type, reason },
                { headers: { atoken } }
            );

            if (data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message || 'Failed to blacklist emails');
            return false;
        }
    };

    const getBlacklist = async () => {
        try {
            const { data } = await axios.get(
                `${backendurl}/api/admin/blacklist`,
                { headers: { atoken } }
            );
            if (data.success) {
                return data.blacklist;
            } else {
                toast.error(data.message);
                return [];
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch blacklist');
            return [];
        }
    };

    const removeFromBlacklist = async (email) => {
        try {
            const { data } = await axios.post(
                `${backendurl}/api/admin/remove-blacklist`,
                { email },
                { headers: { atoken } }
            );

            if (data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message || 'Failed to remove from blacklist');
            return false;
        }
    };

    const verifyAdminOTP = async (email, otp, method = 'email') => {
        try {
            const { data } = await axios.post(
                `${backendurl}/api/admin/verify-otp`,
                { email, otp, method }
            );

            if (data.success) {
                setatoken(data.token);
                localStorage.setItem('atoken', data.token);
                toast.success("Login Successful");
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message || 'Verification failed');
            return false;
        }
    };

    // ── Coupon Management Functions ──────────────────────────────────────────
    const getAllCoupons = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/admin/all-coupons`, { headers: { atoken } });
            if (data.success) {
                return data.coupons;
            } else {
                toast.error(data.message);
                return [];
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch coupons');
            return [];
        }
    };

    const createCoupon = async (couponData) => {
        try {
            const { data } = await axios.post(`${backendurl}/api/admin/create-coupon`, couponData, { headers: { atoken } });
            if (data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message || 'Failed to create coupon');
            return false;
        }
    };

    const toggleCoupon = async (couponId) => {
        try {
            const { data } = await axios.post(`${backendurl}/api/admin/toggle-coupon`, { couponId }, { headers: { atoken } });
            if (data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message || 'Failed to toggle coupon');
            return false;
        }
    };

    const deleteCoupon = async (couponId) => {
        try {
            if (!window.confirm('Are you sure you want to delete this coupon?')) return false;
            const { data } = await axios.post(`${backendurl}/api/admin/delete-coupon`, { couponId }, { headers: { atoken } });
            if (data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message || 'Failed to delete coupon');
            return false;
        }
    };

    const getRedisStats = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/admin/redis-stats', { headers: { atoken } });
            if (data.success) {
                return data.stats;
            } else {
                toast.error(data.message);
                return null;
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch Redis stats');
            return null;
        }
    };

    const value = {
        atoken, setatoken,
        backendurl, doctors,
        getalldoctors, changeavailablity, makeAllDoctorsAvailable, makeAllDoctorsUnavailable,
        appointments, setappointments,
        getallappointments, cancelappointment,
        dashdata, getdashdata, getallusers, setusers,
        users, deleteUser, editUser, deleteDoctor,
        getUsersWithPasswords, getDoctorsWithPasswords,
        getActivityLogs, getRealtimeActivityLogs,
        sendVerificationEmail,
        sendBroadcastEmail,
        sendIndividualEmail,
        banUser, unbanUser,
        adminProfile, getAdminProfile,
        addAdmin, getAllAdmins, updateAdmin, deleteAdmin,
        updateSystemConfig,
        fraudAlerts, getFraudAlerts, updateCommissionRules, sendEmergencyBroadcast,
        blacklistEmails, getBlacklist, removeFromBlacklist,
        verifyAdminOTP,
        getAllCoupons, createCoupon, toggleCoupon, deleteCoupon,
        giftSubscription,
        getPaymentUsers: async () => {
            try {
                const { data } = await axios.get(`${backendurl}/api/admin/payment-users`, { headers: { atoken } });
                return data;
            } catch (error) {
                toast.error(error.message || 'Failed to fetch payment users');
                return { success: false, users: [] };
            }
        },
        getUserPaymentDetails: async (userId) => {
            try {
                const { data } = await axios.get(`${backendurl}/api/admin/user-payment-details/${userId}`, { headers: { atoken } });
                return data;
            } catch (error) {
                toast.error(error.message || 'Failed to fetch user payment details');
                return { success: false, paymentRecords: [], stats: null };
            }
        },
        securityIncidentCount, setSecurityIncidentCount,
        contentViolationCount, setContentViolationCount,
        adminLocation, setAdminLocation,
        subscriptions, loadingSubscriptions, getAllSubscriptions, revokeSubscription,
        getRedisStats
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
}

export default AdminContextProvider
