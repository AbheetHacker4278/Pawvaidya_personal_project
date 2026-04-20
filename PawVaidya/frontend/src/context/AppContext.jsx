import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'
import { getCurrentLocation, isLocationValid } from '../utils/geolocation'

export const AppContext = createContext();

const AppContextProvider = (props) => {

    const backendurl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"
    const [isLoggedin, setisLoggedin] = useState(false)
    const [doctors, setdoctors] = useState([])
    const [token, settoken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : null)
    const [userdata, setuserdata] = useState(false)
    const [userPets, setUserPets] = useState([])
    const [unreadMessages, setUnreadMessages] = useState(0)
    const [userLocation, setUserLocation] = useState(null)
    const [systemConfig, setSystemConfig] = useState({ maintenanceMode: false, killSwitch: false, maintenanceMessage: "" })

    const getSystemConfig = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/admin/system-settings')
            if (data.success) {
                setSystemConfig(data.config)
            }
        } catch (error) {
            console.error("Failed to fetch system config:", error)
        }
    }

    const getAuthstate = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/user/is-auth')
            if (data.success) {
                setisLoggedin(true)
                loaduserprofiledata()
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getuserdata = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/user/data')
            data.success ? setuserdata(data.userdata) : toast.error(data.message)
        } catch (error) {
            toast.error(data.message)
        }
    }

    const getdoctorsdata = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/doctor/list')
            if (data.success) {
                setdoctors(data.doctors)
            } else {
                toast.error(error.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const loaduserprofiledata = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/user/get-profile', { headers: { token } })
            if (data.success) {
                setuserdata(data.userdata)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error.message)
        }
    }

    const getUnreadMessagesCount = async () => {
        if (!token) return;

        try {
            const { data } = await axios.get(backendurl + '/api/user/messages', { headers: { token } })
            console.log('Messages fetched:', data);
            if (data.success) {
                // Get user ID from token or userdata
                let userId = userdata?._id;

                // If userdata not loaded yet, decode token to get userId
                if (!userId && token) {
                    try {
                        const base64Url = token.split('.')[1];
                        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                        }).join(''));
                        const decoded = JSON.parse(jsonPayload);
                        userId = decoded.id;
                    } catch (e) {
                        console.error('Error decoding token:', e);
                    }
                }

                const unread = data.messages.filter(msg =>
                    !msg.readBy.some(read => read.userId === userId)
                ).length;
                console.log('Unread messages count:', unread);
                setUnreadMessages(unread);
            }
        } catch (error) {
            console.error('Error fetching messages:', error.message)
        }
    }

    // Location functions
    const updateUserLocation = async (location) => {
        if (!token || !location) return;

        try {
            const locationWithTimestamp = {
                ...location,
                timestamp: Date.now()
            };

            const { data } = await axios.post(backendurl + '/api/user/location',
                { location: locationWithTimestamp },
                { headers: { token } }
            );

            if (data.success) {
                setUserLocation(locationWithTimestamp);
                localStorage.setItem('userLocation', JSON.stringify(locationWithTimestamp));
                return locationWithTimestamp;
            }
        } catch (error) {
            console.error('Error updating user location:', error.message);
            toast.error('Failed to update location');
        }
        return null;
    };

    const refreshUserLocation = async () => {
        try {
            const currentLocation = await getCurrentLocation();
            return await updateUserLocation(currentLocation);
        } catch (error) {
            console.error('Error refreshing user location:', error.message);
            toast.error('Failed to get current location');
            return null;
        }
    };

    const getUserPetReports = async () => {
        if (!token) return;
        try {
            const { data } = await axios.post(backendurl + '/api/doctor/pet-report/list', {}, { headers: { token } });
            if (data.success) {
                return data.reports;
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
            console.error(error);
        }
    };

    const getUserAppointments = async () => {
        if (!token) return;
        try {
            const { data } = await axios.get(backendurl + '/api/user/appointments', { headers: { token } })
            if (data.success) {
                return data.appointments;
            }
        } catch (error) {
            console.error("Error fetching appointments:", error.message)
        }
        return [];
    }

    // Load cached location on mount
    useEffect(() => {
        const cachedLocation = localStorage.getItem('userLocation');
        if (cachedLocation) {
            try {
                const parsedLocation = JSON.parse(cachedLocation);
                if (parsedLocation && (parsedLocation.latitude || parsedLocation.lat)) {
                    setUserLocation(parsedLocation);
                    // Initial axios header set
                    axios.defaults.headers.common['x-client-latitude'] = parsedLocation.latitude || parsedLocation.lat;
                    axios.defaults.headers.common['x-client-longitude'] = parsedLocation.longitude || parsedLocation.lon;
                } else {
                    localStorage.removeItem('userLocation');
                }
            } catch (error) {
                localStorage.removeItem('userLocation');
            }
        }
    }, []);

    // Inject location headers into axios
    useEffect(() => {
        if (userLocation && (userLocation.latitude || userLocation.lat)) {
            axios.defaults.headers.common['x-client-latitude'] = userLocation.latitude || userLocation.lat;
            axios.defaults.headers.common['x-client-longitude'] = userLocation.longitude || userLocation.lon;
        }
    }, [userLocation]);

    const registerFace = async (faceData) => {
        try {
            const { data } = await axios.post(backendurl + '/api/user/register-face', faceData, { headers: { token } })
            if (data.success) {
                loaduserprofiledata()
                return true
            } else {
                return false
            }
        } catch (error) {
            return false
        }
    }

    const loginWithFace = async (faceData) => {
        try {
            const { data } = await axios.post(backendurl + '/api/user/login-face', faceData)
            if (data.success) {
                settoken(data.token)
                localStorage.setItem('token', data.token)
                setuserdata(data.userdata)
                setisLoggedin(true)
                return true
            } else {
                return false
            }
        } catch (error) {
            return false
        }
    }

    const fetchUserPets = async () => {
        if (!token) return;
        try {
            const { data } = await axios.post(backendurl + '/api/user/list-pets', {}, { headers: { token } });
            if (data.success) {
                setUserPets(data.pets);
                return data.pets;
            }
        } catch (error) {
            console.error('Error fetching pets:', error.message);
        }
        return [];
    };

    const addPet = async (petData) => {
        try {
            const { data } = await axios.post(backendurl + '/api/user/add-pet', petData, { headers: { token } });
            if (data.success) {
                toast.success(data.message);
                await fetchUserPets();
                return true;
            }
            toast.error(data.message);
            return false;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const updatePet = async (petData) => {
        try {
            const { data } = await axios.post(backendurl + '/api/user/update-pet', petData, { headers: { token } });
            if (data.success) {
                toast.success(data.message);
                await fetchUserPets();
                return true;
            }
            toast.error(data.message);
            return false;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const deletePet = async (petId) => {
        try {
            const { data } = await axios.post(backendurl + '/api/user/delete-pet', { petId }, { headers: { token } });
            if (data.success) {
                toast.success(data.message);
                await fetchUserPets();
                return true;
            }
            toast.error(data.message);
            return false;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    // Subscription related functions
    const getSubscriptionPlans = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/subscription/plans');
            if (data.success) {
                return data.plans;
            }
        } catch (error) {
            console.error('Error fetching plans:', error.message);
        }
        return null;
    };

    const subscribeViaWallet = async (planName) => {
        try {
            const { data } = await axios.post(backendurl + '/api/subscription/wallet-subscribe', { userId: userdata?._id, planName }, { headers: { token } });
            if (data.success) {
                toast.success(data.message);
                await loaduserprofiledata();
                return true;
            }
            toast.error(data.message);
            return false;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const createRazorpaySubscription = async (planName) => {
        try {
            const { data } = await axios.post(backendurl + '/api/subscription/create-order', { userId: userdata?._id, planName }, { headers: { token } });
            if (data.success) {
                return data;
            }
            toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
        return null;
    };

    const verifySubscriptionPayment = async (paymentData) => {
        try {
            const { data } = await axios.post(backendurl + '/api/subscription/verify-payment', { ...paymentData, userId: userdata?._id }, { headers: { token } });
            if (data.success) {
                toast.success(data.message);
                await loaduserprofiledata();
                return true;
            }
            toast.error(data.message);
            return false;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const value = {
        doctors, getdoctorsdata,
        token, settoken,
        backendurl, userdata,
        setuserdata,
        loaduserprofiledata,
        isLoggedin, setisLoggedin,
        getuserdata,
        unreadMessages,
        getUnreadMessagesCount,
        userLocation,
        setUserLocation,
        updateUserLocation,
        refreshUserLocation,
        getUserPetReports,
        getUserAppointments,
        systemConfig,
        registerFace,
        loginWithFace,
        userPets, setUserPets,
        fetchUserPets, addPet, updatePet, deletePet,
        getSubscriptionPlans, subscribeViaWallet, createRazorpaySubscription, verifySubscriptionPayment
    }

    useEffect(() => {
        getAuthstate()
    }, [])

    useEffect(() => {
        getdoctorsdata()
        getSystemConfig()
    }, [])

    useEffect(() => {
        if (token) {
            loaduserprofiledata()
            fetchUserPets()
        } else {
            setuserdata(false)
            setUserPets([])
        }
    }, [token])

    useEffect(() => {
        if (token && userdata) {
            getUnreadMessagesCount()
            // Poll for new messages every 5 seconds for real-time notification updates
            const interval = setInterval(getUnreadMessagesCount, 5000)
            return () => clearInterval(interval)
        }
    }, [token, userdata])

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider;
