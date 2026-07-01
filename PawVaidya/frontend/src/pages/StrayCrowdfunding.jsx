import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    Heart, MapPin, Sparkles, Award, PlusCircle, CreditCard,
    Info, Users, DollarSign, Calendar, Target, CheckCircle, RefreshCw, X, Edit, Trash2, ShieldAlert, FileText, Gift
} from 'lucide-react';

const StrayCrowdfunding = () => {
    const { token, userdata, backendurl, loadUserProfileData } = useContext(AppContext);
    const isObsidian = userdata?.subscription?.status === 'Active' && userdata?.subscription?.plan === 'Obsidian';

    // Coordinate state
    const [coords, setCoords] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [donatePaymentMethod, setDonatePaymentMethod] = useState('razorpay');

    // Campaigns state
    const [campaigns, setCampaigns] = useState([]);
    const [campaignsLoading, setCampaignsLoading] = useState(false);
    const [activeCampaign, setActiveCampaign] = useState(null);

    // Create campaign modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [animalType, setAnimalType] = useState('Dog');
    const [targetAmount, setTargetAmount] = useState('');
    const [clinicName, setClinicName] = useState('');
    const [clinicAccountId, setClinicAccountId] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [createLoading, setCreateLoading] = useState(false);

    // Compulsory self-contribution states
    const [selfContributionAmount, setSelfContributionAmount] = useState(500);
    const [paymentMethod, setPaymentMethod] = useState('razorpay');
    const [durationDays, setDurationDays] = useState(14);

    // Edit campaign states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editAnimalType, setEditAnimalType] = useState('Dog');
    const [editTargetAmount, setEditTargetAmount] = useState('');
    const [editClinicName, setEditClinicName] = useState('');
    const [editClinicAccountId, setEditClinicAccountId] = useState('');
    const [editImageFile, setEditImageFile] = useState(null);
    const [editLoading, setEditLoading] = useState(false);

    // Proof file upload state
    const [proofFile, setProofFile] = useState(null);
    const [proofLoading, setProofLoading] = useState(false);

    // Refund & Admin action loading states
    const [refundLoading, setRefundLoading] = useState(false);
    const [adminActionLoading, setAdminActionLoading] = useState(false);

    // Contribution modal
    const [showDonateModal, setShowDonateModal] = useState(false);
    const [donateAmount, setDonateAmount] = useState('');
    const [donateLoading, setDonateLoading] = useState(false);
    const [targetCampaign, setTargetCampaign] = useState(null);

    // Load Razorpay Script
    useEffect(() => {
        if (!document.getElementById('razorpay-js')) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.id = 'razorpay-js';
            script.async = true;
            document.body.appendChild(script);
        }
        getUserLocation();
    }, []);

    const getUserLocation = () => {
        setLocationLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userCoords = {
                        longitude: position.coords.longitude,
                        latitude: position.coords.latitude
                    };
                    setCoords(userCoords);
                    setLocationLoading(false);
                    fetchNearbyCampaigns(userCoords);
                },
                (error) => {
                    console.warn("Geolocation permission denied. Using default Delhi coordinates.");
                    // Default to New Delhi coordinates
                    const defaultCoords = { longitude: 77.2090, latitude: 28.6139 };
                    setCoords(defaultCoords);
                    setLocationLoading(false);
                    fetchNearbyCampaigns(defaultCoords);
                }
            );
        } else {
            console.warn("Geolocation not supported. Using default Delhi coordinates.");
            const defaultCoords = { longitude: 77.2090, latitude: 28.6139 };
            setCoords(defaultCoords);
            setLocationLoading(false);
            fetchNearbyCampaigns(defaultCoords);
        }
    };

    const fetchNearbyCampaigns = async (targetCoords) => {
        setCampaignsLoading(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/stray-crowdfunding/nearby`, {
                params: {
                    longitude: targetCoords.longitude,
                    latitude: targetCoords.latitude,
                    radiusKm: 100 // 100km search radius
                }
            });
            if (data.success) {
                setCampaigns(data.campaigns || []);
            }
        } catch (err) {
            console.error("Error fetching nearby campaigns:", err.message);
        } finally {
            setCampaignsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleEditFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setEditImageFile(e.target.files[0]);
        }
    };

    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        if (!token) {
            toast.warning("Please login to create a campaign.");
            return;
        }

        if (!coords) {
            toast.error("Location coordinates are required to start a localized rescue campaign.");
            return;
        }

        if (Number(selfContributionAmount) < 500) {
            toast.error("Minimum compulsory self-contribution is ₹500.");
            return;
        }

        if (paymentMethod === 'wallet') {
            if ((userdata?.pawWallet || 0) < Number(selfContributionAmount)) {
                toast.error("Insufficient balance in Paw Wallet for self-contribution. Please top up or choose Razorpay.");
                return;
            }
            // Direct wallet contribution
            submitCampaignCreation({ selfContrib: selfContributionAmount, paymentMethod: 'wallet' });
        } else {
            // Razorpay payment first
            setCreateLoading(true);
            try {
                const { data } = await axios.post(`${backendurl}/api/stray-crowdfunding/self-pay-order`, {
                    amount: Number(selfContributionAmount)
                }, { headers: { token } });

                if (data && data.success) {
                    const options = {
                        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                        amount: data.order.amount,
                        currency: data.order.currency,
                        name: "PawVaidya Stray Rescue",
                        description: `Compulsory Self Contribution for Stray Campaign`,
                        order_id: data.order.id,
                        handler: async (response) => {
                            submitCampaignCreation({
                                selfContrib: selfContributionAmount,
                                paymentMethod: 'razorpay',
                                paymentId: response.razorpay_payment_id
                            });
                        },
                        prefill: {
                            name: userdata?.name,
                            email: userdata?.email,
                        },
                        theme: {
                            color: '#5A4035',
                        },
                    };
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                } else {
                    toast.error(data.message);
                    setCreateLoading(false);
                }
            } catch (err) {
                toast.error(err.response?.data?.message || err.message);
                setCreateLoading(false);
            }
        }
    };

    const submitCampaignCreation = async ({ selfContrib, paymentMethod, paymentId }) => {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('animalType', animalType);
        formData.append('targetAmount', targetAmount);
        formData.append('clinicName', clinicName);
        formData.append('clinicAccountId', clinicAccountId);
        formData.append('longitude', coords.longitude);
        formData.append('latitude', coords.latitude);
        formData.append('selfContrib', selfContrib);
        formData.append('paymentMethod', paymentMethod);
        formData.append('paymentId', paymentId || '');
        formData.append('days', durationDays);
        if (imageFile) {
            formData.append('image', imageFile);
        }

        setCreateLoading(true);
        try {
            const { data } = await axios.post(`${backendurl}/api/stray-crowdfunding/create`, formData, {
                headers: {
                    token,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (data.success) {
                toast.success(`Rescue campaign created! You earned +${data.earnedPawPoints} PawPoints!`);
                setShowCreateModal(false);
                // Clear fields
                setTitle('');
                setDescription('');
                setTargetAmount('');
                setClinicName('');
                setClinicAccountId('');
                setImageFile(null);
                setSelfContributionAmount(500);
                setPaymentMethod('razorpay');
                setDurationDays(14);
                fetchNearbyCampaigns(coords);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleOpenEdit = (camp) => {
        setEditingCampaign(camp);
        setEditTitle(camp.title);
        setEditDescription(camp.description);
        setEditAnimalType(camp.animalType);
        setEditTargetAmount(camp.targetAmount);
        setEditClinicName(camp.clinicName);
        setEditClinicAccountId(camp.clinicAccountId || '');
        setEditImageFile(null);
        setShowEditModal(true);
        setActiveCampaign(null);
    };

    const handleEditCampaign = async (e) => {
        e.preventDefault();
        if (!token) return;

        if (Number(editTargetAmount) < editingCampaign.raisedAmount) {
            toast.error(`Target amount cannot be less than raised amount of ₹${editingCampaign.raisedAmount}`);
            return;
        }

        const formData = new FormData();
        formData.append('title', editTitle);
        formData.append('description', editDescription);
        formData.append('animalType', editAnimalType);
        formData.append('targetAmount', editTargetAmount);
        formData.append('clinicName', editClinicName);
        formData.append('clinicAccountId', editClinicAccountId);
        if (editImageFile) {
            formData.append('image', editImageFile);
        }

        setEditLoading(true);
        try {
            const { data } = await axios.put(`${backendurl}/api/stray-crowdfunding/edit/${editingCampaign._id}`, formData, {
                headers: {
                    token,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (data.success) {
                toast.success("Rescue campaign updated successfully!");
                setShowEditModal(false);
                setEditingCampaign(null);
                fetchNearbyCampaigns(coords);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteCampaign = async (id) => {
        if (!window.confirm("Are you sure you want to delete this campaign? All contributions will be refunded back to contributors' wallets.")) {
            return;
        }

        try {
            const { data } = await axios.delete(`${backendurl}/api/stray-crowdfunding/delete/${id}`, {
                headers: { token }
            });

            if (data.success) {
                toast.success("Campaign deleted and contributions refunded back to wallets!");
                setActiveCampaign(null);
                fetchNearbyCampaigns(coords);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        }
    };

    const handleUploadProof = async (id) => {
        if (!proofFile) {
            toast.warning("Please select a file containing the invoice/bill.");
            return;
        }

        const formData = new FormData();
        formData.append('proof', proofFile);

        setProofLoading(true);
        try {
            const { data } = await axios.post(`${backendurl}/api/stray-crowdfunding/upload-proof/${id}`, formData, {
                headers: {
                    token,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (data.success) {
                toast.success("Treatment bill uploaded and funds released to clinic successfully!");
                setProofFile(null);
                loadCampaignDetails(id);
                fetchNearbyCampaigns(coords);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setProofLoading(false);
        }
    };

    const handleRefundCampaign = async (id) => {
        if (!window.confirm("Are you sure you want to suspend this campaign and refund all contributions back to the contributors' wallets?")) {
            return;
        }

        setRefundLoading(true);
        try {
            const { data } = await axios.post(`${backendurl}/api/stray-crowdfunding/refund/${id}`, {}, {
                headers: { token }
            });

            if (data.success) {
                toast.success("Contributions refunded successfully!");
                loadCampaignDetails(id);
                fetchNearbyCampaigns(coords);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setRefundLoading(false);
        }
    };

    const handleAdminStrictAction = async (id) => {
        const atoken = localStorage.getItem('atoken') || localStorage.getItem('aToken');
        if (!atoken) {
            toast.error("Admin authorization token not found. Please log in as an administrator.");
            return;
        }

        if (!window.confirm("Take strict action? This will ban the campaign owner from the platform for failing to refund contributions.")) {
            return;
        }

        setAdminActionLoading(true);
        try {
            const { data } = await axios.post(`${backendurl}/api/stray-crowdfunding/admin/strict-action/${id}`, {}, {
                headers: { atoken }
            });

            if (data.success) {
                toast.success("Strict action successful: Campaign owner has been banned!");
                loadCampaignDetails(id);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setAdminActionLoading(false);
        }
    };

    const handleDonateInit = (campaign) => {
        if (!token) {
            toast.info("Please login to contribute to stray rescue campaigns.");
            return;
        }
        setTargetCampaign(campaign);
        setShowDonateModal(true);
    };

    const processContribution = async (e) => {
        e.preventDefault();
        const amt = Number(donateAmount);
        if (!amt || amt <= 0) {
            toast.warning("Please enter a valid amount.");
            return;
        }

        setDonateLoading(true);
        try {
            if (donatePaymentMethod === 'wallet') {
                if ((userdata?.pawWallet || 0) < amt) {
                    toast.error(`Insufficient balance in Paw Wallet. Available: ₹${userdata?.pawWallet || 0}`);
                    setDonateLoading(false);
                    return;
                }

                // Direct wallet contribution API
                const { data } = await axios.post(`${backendurl}/api/stray-crowdfunding/wallet-contribute`, {
                    campaignId: targetCampaign._id,
                    amount: amt
                }, { headers: { token } });

                if (data && data.success) {
                    toast.success("Thank you! Contribution processed successfully via Paw Wallet. Earned +5 PawPoints!");
                    setShowDonateModal(false);
                    setDonateAmount('');
                    // Refresh profile to update local wallet balance representation
                    if (loadUserProfileData) {
                        loadUserProfileData();
                    }
                    fetchNearbyCampaigns(coords);
                    if (activeCampaign && activeCampaign._id === targetCampaign._id) {
                        // Refresh details dialog
                        const detailsRes = await axios.get(`${backendurl}/api/stray-crowdfunding/details/${targetCampaign._id}`);
                        if (detailsRes.data.success) {
                            setActiveCampaign(detailsRes.data.campaign);
                        }
                    }
                } else {
                    toast.error(data.message);
                }
            } else {
                // Razorpay checkout
                // 1. Create order
                const { data } = await axios.post(`${backendurl}/api/stray-crowdfunding/pay-order`, {
                    campaignId: targetCampaign._id,
                    amount: amt
                }, { headers: { token } });

                if (data && data.success) {
                    // 2. Open Razorpay options
                    const options = {
                        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                        amount: data.order.amount,
                        currency: data.order.currency,
                        name: "PawVaidya Stray Rescue",
                        description: `Contribution for stray: ${targetCampaign.title}`,
                        order_id: data.order.id,
                        handler: async (response) => {
                            try {
                                const verifyPayload = {
                                    campaignId: targetCampaign._id,
                                    amount: amt,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                };
                                const verifyRes = await axios.post(`${backendurl}/api/stray-crowdfunding/verify-payment`, verifyPayload, {
                                    headers: { token }
                                });

                                if (verifyRes.data.success) {
                                    toast.success(`Thank you! Contribution processed. Earned +${verifyRes.data.earnedPawPoints} PawPoints!`);
                                    setShowDonateModal(false);
                                    setDonateAmount('');
                                    if (loadUserProfileData) {
                                        loadUserProfileData();
                                    }
                                    fetchNearbyCampaigns(coords);
                                    if (activeCampaign && activeCampaign._id === targetCampaign._id) {
                                        // Refresh details dialog
                                        const detailsRes = await axios.get(`${backendurl}/api/stray-crowdfunding/details/${targetCampaign._id}`);
                                        if (detailsRes.data.success) {
                                            setActiveCampaign(detailsRes.data.campaign);
                                        }
                                    }
                                } else {
                                    toast.error(verifyRes.data.message);
                                }
                            } catch (verifyErr) {
                                toast.error("Signature verification failed.");
                            }
                        },
                        prefill: {
                            name: userdata?.name,
                            email: userdata?.email,
                        },
                        theme: {
                            color: '#5A4035',
                        },
                    };
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                } else {
                    toast.error(data.message);
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setDonateLoading(false);
        }
    };

    const loadCampaignDetails = async (id) => {
        try {
            const { data } = await axios.get(`${backendurl}/api/stray-crowdfunding/details/${id}`);
            if (data.success) {
                setActiveCampaign(data.campaign);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.message);
        }
    };

    const B = {
        dark: '#2c1e14',
        mid: '#5A4035',
        light: '#7a5a48',
        cream: '#f8f0e3',
        sand: '#e8d5b0',
        amber: '#c8860a',
        gold: '#d4a017',
        pale: '#fdf8f0',
        warmWhite: '#fffaf3',
    };

    const checkIsCreator = (camp) => {
        if (!token || !userdata || !camp?.creatorId) return false;
        const creatorIdStr = camp.creatorId._id || camp.creatorId;
        return creatorIdStr === (userdata.id || userdata._id);
    };

    const checkIsAdmin = () => {
        if (userdata && userdata.role === 'admin') return true;
        const atoken = localStorage.getItem('atoken') || localStorage.getItem('aToken');
        return !!atoken;
    };

    return (
        <div className={`min-h-screen pt-24 pb-16 transition-colors duration-500 ${isObsidian ? 'bg-[#050505] text-[#F5F2EA]' : ''}`}>
            <div className="max-w-6xl mx-auto px-4">
                {/* Header Section */}
                <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 border-b pb-8 transition-colors duration-500 ${isObsidian ? 'border-[#E6C97A]/25' : 'border-[#e8d5b0]'}`}>
                    <div>
                        <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3 border ${
                            isObsidian 
                                ? 'bg-[#E6C97A]/10 border-[#E6C97A]/25 text-[#E6C97A]' 
                                : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}>
                            <MapPin size={12} /> Geolocation Stray Care
                        </span>
                        <h1 className={`text-4xl sm:text-5xl font-black tracking-tight transition-colors duration-500 ${isObsidian ? 'text-[#F5F2EA]' : ''}`} style={!isObsidian ? { color: B.dark } : {}}>
                            Stray Crowdfunding
                        </h1>
                        <p className={`mt-2 font-medium transition-colors duration-500 ${isObsidian ? 'text-neutral-400' : ''}`} style={!isObsidian ? { color: B.light } : {}}>
                            View and fund active stray animal medical campaigns. Compulsory owner contribution. Direct vet partner payouts.
                        </p>
                    </div>
                    {token && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className={`px-6 py-3.5 rounded-2xl text-sm font-black shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 ${
                                isObsidian 
                                    ? 'bg-gradient-to-r from-[#8C6D23] via-[#E6C97A] to-[#8C6D23] text-black shadow-[#E6C97A]/10' 
                                    : 'bg-gradient-to-r from-emerald-600 to-[#5A4035] text-white shadow-lg'
                            }`}
                        >
                            <PlusCircle size={18} /> Initiate Rescue Campaign
                        </button>
                    )}
                </div>

                {/* Location indicator */}
                <div className={`mb-8 p-4 rounded-2xl flex items-center justify-between border transition-all duration-300 ${
                    isObsidian 
                        ? 'bg-[#0E0E0E] border-zinc-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
                        : 'bg-amber-50/50 border-[#e8d5b0]'
                }`}>
                    <div className="flex items-center gap-3">
                        <MapPin className={isObsidian ? 'text-[#E6C97A]' : 'text-emerald-600'} size={20} />
                        <div>
                            <span className={`text-[10px] font-black uppercase block ${isObsidian ? 'text-[#E6C97A]' : 'text-emerald-800'}`}>Active Geolocation Status</span>
                            {locationLoading ? (
                                <span className={`text-xs font-bold ${isObsidian ? 'text-neutral-500' : 'text-gray-500'}`}>Acquiring GPS coordinates...</span>
                            ) : coords ? (
                                <span className={`text-xs font-bold ${isObsidian ? 'text-neutral-300' : 'text-gray-800'}`}>
                                    Radius coordinates: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
                                </span>
                            ) : (
                                <span className={`text-xs font-bold ${isObsidian ? 'text-neutral-500' : 'text-gray-500'}`}>Coords not loaded</span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={getUserLocation}
                        className={`p-2 rounded-xl transition-colors ${
                            isObsidian 
                                ? 'text-[#E6C97A] hover:bg-[#E6C97A]/10' 
                                : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title="Reload GPS Location"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>

                {/* Main Campaigns Grid */}
                {campaignsLoading ? (
                    <div className="flex justify-center py-24">
                        <RefreshCw className={`animate-spin ${isObsidian ? 'text-[#E6C97A]' : 'text-emerald-600'}`} size={32} />
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className={`p-12 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center text-center min-h-[400px] border transition-all duration-500 ${
                        isObsidian 
                            ? 'bg-[#0E0E0E] border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.95)]' 
                            : 'bg-white border-[#e8d5b0]'
                    }`}>
                        <Heart size={56} className={`${isObsidian ? 'text-[#E6C97A]/20' : 'text-emerald-200'} mb-4`} />
                        <h3 className={`text-xl font-black ${isObsidian ? 'text-[#F5F2EA]' : 'text-[#2c1e14]'}`}>No Rescue Campaigns Nearby</h3>
                        <p className={`text-xs max-w-sm mt-1 leading-relaxed ${isObsidian ? 'text-neutral-400' : 'text-gray-500'}`}>
                            No stray animal medical campaigns were found within a 100km radius. If you know a stray animal needing surgery or treatment, initiate a campaign above!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.map((camp) => {
                            const percent = Math.min(100, Math.round((camp.raisedAmount / camp.targetAmount) * 100));
                            const isCreator = checkIsCreator(camp);
                            const isAdmin = checkIsAdmin();
                            const isExpired = camp.endDate ? new Date() > new Date(camp.endDate) : false;

                            return (
                                <div key={camp._id} className={`rounded-[2rem] border transition-all overflow-hidden flex flex-col justify-between relative ${
                                    isObsidian 
                                        ? 'bg-[#0E0E0E] border-zinc-800/80 hover:border-[#E6C97A]/30 shadow-[0_15px_35px_rgba(0,0,0,0.8)]' 
                                        : 'bg-white border-[#e8d5b0] shadow-md hover:shadow-xl'
                                }`}>
                                    {(isCreator || isAdmin) && (
                                        <div className="absolute top-3 right-3 flex gap-2 z-10">
                                            {camp.status === 'Active' && (
                                                <button
                                                    onClick={() => handleOpenEdit(camp)}
                                                    className={`p-2 rounded-full shadow border transition-colors ${
                                                        isObsidian 
                                                            ? 'bg-zinc-900/90 hover:bg-zinc-800 text-[#E6C97A] border-zinc-700/50' 
                                                            : 'bg-white/90 hover:bg-white text-amber-700 border-amber-100'
                                                    }`}
                                                    title="Edit Campaign"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteCampaign(camp._id)}
                                                className={`p-2 rounded-full shadow border transition-colors ${
                                                    isObsidian 
                                                        ? 'bg-zinc-900/90 hover:bg-zinc-800 text-red-400 border-zinc-700/50' 
                                                        : 'bg-white/90 hover:bg-white text-red-600 border-red-100'
                                                }`}
                                                title="Delete Campaign"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {camp.imageUrl ? (
                                        <img
                                            src={camp.imageUrl}
                                            alt={camp.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    ) : (
                                        <div className={`w-full h-48 flex items-center justify-center ${isObsidian ? 'bg-zinc-900/50 text-[#E6C97A]/40' : 'bg-emerald-50 text-emerald-600'}`}>
                                            <Heart size={48} className="opacity-40" />
                                        </div>
                                    )}

                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded border ${
                                                    isObsidian 
                                                        ? 'bg-[#E6C97A]/10 border-[#E6C97A]/25 text-[#E6C97A]' 
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`}>
                                                    {camp.animalType}
                                                </span>
                                                <span className={`text-xs font-black ${isObsidian ? 'text-neutral-400' : 'text-gray-500'}`}>
                                                    {camp.clinicName}
                                                </span>
                                            </div>

                                            <h3 className={`font-black text-lg mb-2 truncate ${isObsidian ? 'text-[#F5F2EA]' : 'text-[#2c1e14]'}`}>
                                                {camp.title}
                                            </h3>
                                            <p className={`text-xs line-clamp-3 mb-4 ${isObsidian ? 'text-neutral-400' : 'text-gray-500'}`}>
                                                {camp.description}
                                            </p>

                                            <div className={`flex justify-between items-center text-[10px] font-bold mb-4 ${isObsidian ? 'text-neutral-500' : 'text-gray-400'}`}>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {camp.endDate ? `Ends: ${new Date(camp.endDate).toLocaleDateString()}` : ''}
                                                </span>
                                                <span>
                                                    {isExpired ? "🔴 Expired" : "🟢 Running"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Progress Bar */}
                                            <div>
                                                <div className={`flex justify-between text-xs font-bold mb-1.5 ${isObsidian ? 'text-neutral-300' : 'text-gray-700'}`}>
                                                    <span>Raised: ₹{camp.raisedAmount}</span>
                                                    <span>Target: ₹{camp.targetAmount}</span>
                                                </div>
                                                <div className={`w-full h-2.5 rounded-full overflow-hidden ${isObsidian ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                                                    <div
                                                        className={`h-full transition-all duration-500 ${
                                                            isObsidian 
                                                                ? 'bg-gradient-to-r from-[#8C6D23] via-[#E6C97A] to-[#8C6D23]' 
                                                                : (camp.status === 'Completed' ? 'bg-emerald-600' :
                                                                   camp.status === 'Cancelled' ? 'bg-red-500' :
                                                                   isExpired ? 'bg-amber-500' : 'bg-emerald-600')
                                                        }`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className={`text-[10px] font-black block ${isObsidian ? 'text-[#E6C97A]' : 'text-emerald-700'}`}>
                                                        {percent}% Funded
                                                    </span>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                                        isObsidian 
                                                            ? 'bg-[#E6C97A]/10 text-[#E6C97A] border-[#E6C97A]/25'
                                                            : (camp.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                               camp.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                               camp.status === 'Suspended' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                                                               'bg-amber-50 text-amber-700 border-amber-200')
                                                    }`}>
                                                        {camp.status === 'Suspended' ? 'Suspended Campaign' : camp.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <button
                                                    onClick={() => loadCampaignDetails(camp._id)}
                                                    className={`w-full py-2.5 rounded-xl text-xs font-black border transition-colors ${
                                                        isObsidian 
                                                            ? 'border-zinc-800 text-neutral-300 hover:bg-zinc-800/50 hover:border-[#E6C97A]/30' 
                                                            : 'border-[#e8d5b0] hover:bg-amber-50 text-[#5A4035]'
                                                    }`}
                                                >
                                                    View Details
                                                </button>
                                                {camp.status === 'Active' && !isExpired ? (
                                                    <button
                                                        onClick={() => handleDonateInit(camp)}
                                                        className={`w-full py-2.5 rounded-xl text-xs font-black transition-colors ${
                                                            isObsidian 
                                                                ? 'bg-gradient-to-r from-[#8C6D23] via-[#E6C97A] to-[#8C6D23] text-black hover:opacity-95' 
                                                                : 'bg-[#5A4035] text-white hover:bg-[#7a5a48]'
                                                        }`}
                                                    >
                                                        Contribute
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled
                                                        className={`w-full py-2.5 rounded-xl text-xs font-black cursor-not-allowed ${
                                                            isObsidian 
                                                                ? 'bg-zinc-900 text-neutral-600' 
                                                                : 'bg-gray-100 text-gray-400'
                                                        }`}
                                                    >
                                                        Closed
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Campaign Detail Modal */}
                <AnimatePresence>
                    {activeCampaign && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`rounded-[2.5rem] shadow-2xl p-8 max-w-2xl w-full border max-h-[85vh] overflow-y-auto transition-colors duration-500 ${isObsidian ? 'bg-[#0E0E0E] border-zinc-800 text-[#F5F2EA]' : 'bg-[#fdf8f0] border-[#e8d5b0]'}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className={`text-2xl font-black ${isObsidian ? 'text-[#F5F2EA]' : 'text-[#2c1e14]'}`}>{activeCampaign.title}</h2>
                                        <span className={`text-[10px] block mt-1 font-bold ${isObsidian ? 'text-neutral-500' : 'text-gray-400'}`}>
                                            Created by: {activeCampaign.creatorId?.name || "Unknown Owner"} ({activeCampaign.creatorId?.email || ""})
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setActiveCampaign(null)}
                                        className={`p-1 rounded-full transition-colors ${isObsidian ? 'text-neutral-400 hover:bg-zinc-800' : 'text-gray-400 hover:bg-gray-100'}`}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {activeCampaign.imageUrl && (
                                        <img
                                            src={activeCampaign.imageUrl}
                                            alt={activeCampaign.title}
                                            className="w-full h-64 object-cover rounded-2xl"
                                        />
                                    )}

                                    <div className={`p-4 rounded-2xl border flex justify-between text-xs transition-colors ${isObsidian ? 'bg-[#121212] border-zinc-800' : 'bg-emerald-50 border-emerald-100'}`}>
                                        <div>
                                            <span className={`text-[10px] font-black uppercase block ${isObsidian ? 'text-[#E6C97A]' : 'text-emerald-800'}`}>Treatment Veterinary Partner</span>
                                            <strong className={`text-sm mt-0.5 block ${isObsidian ? 'text-[#F5F2EA] font-extrabold' : 'text-emerald-950 font-bold'}`}>{activeCampaign.clinicName}</strong>
                                        </div>
                                        {activeCampaign.clinicAccountId && (
                                            <div className="text-right">
                                                <span className={`text-[10px] font-black uppercase block ${isObsidian ? 'text-[#E6C97A]' : 'text-emerald-800'}`}>Razorpay Split ID</span>
                                                <code className={`text-[10px] block mt-0.5 ${isObsidian ? 'text-neutral-400 font-mono' : 'text-gray-600'}`}>{activeCampaign.clinicAccountId}</code>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className={`font-black text-sm mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-[#2c1e14]'}`}>Description</h3>
                                        <p className={`text-xs leading-relaxed ${isObsidian ? 'text-neutral-400' : 'text-gray-600'}`}>{activeCampaign.description}</p>
                                    </div>

                                    {/* Donation metrics */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className={`p-4 border rounded-2xl text-center transition-colors ${isObsidian ? 'bg-[#121212] border-zinc-800' : 'bg-white'}`}>
                                            <span className={`text-[9px] font-black uppercase ${isObsidian ? 'text-neutral-500' : 'text-gray-400'}`}>Target Amount</span>
                                            <span className={`text-lg font-black block mt-1 ${isObsidian ? 'text-neutral-300' : 'text-[#5A4035]'}`}>₹{activeCampaign.targetAmount}</span>
                                        </div>
                                        <div className={`p-4 border rounded-2xl text-center transition-colors ${isObsidian ? 'bg-[#121212] border-zinc-800' : 'bg-white'}`}>
                                            <span className={`text-[9px] font-black uppercase ${isObsidian ? 'text-neutral-500' : 'text-gray-400'}`}>Total Raised</span>
                                            <span className={`text-lg font-black block mt-1 ${isObsidian ? 'text-[#E6C97A]' : 'text-emerald-600'}`}>₹{activeCampaign.raisedAmount}</span>
                                        </div>
                                        <div className={`p-4 border rounded-2xl text-center transition-colors ${isObsidian ? 'bg-[#121212] border-zinc-800' : 'bg-white'}`}>
                                            <span className={`text-[9px] font-black uppercase ${isObsidian ? 'text-neutral-500' : 'text-gray-400'}`}>Status</span>
                                            <span className={`text-xs font-black px-2 py-0.5 rounded border inline-block mt-2 ${
                                                isObsidian 
                                                    ? 'bg-[#E6C97A]/10 text-[#E6C97A] border-[#E6C97A]/25' 
                                                    : (activeCampaign.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                       activeCampaign.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                       activeCampaign.status === 'Suspended' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                                                       'bg-amber-50 text-amber-700 border-amber-200')
                                            }`}>
                                                {activeCampaign.status === 'Suspended' ? 'Suspended Campaign' : activeCampaign.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Refunded or bill details */}
                                    {activeCampaign.status === 'Suspended' && (
                                        <div className={`p-4 border rounded-2xl flex items-center gap-3 ${isObsidian ? 'bg-red-950/20 text-red-400 border-red-900/30' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            <ShieldAlert size={20} />
                                            <div className="text-xs">
                                                <strong className="block">Suspended Campaign</strong>
                                                This campaign has been suspended by the admin. All contributions have been automatically refunded back to the respective contributors' wallets.
                                            </div>
                                        </div>
                                    )}

                                    {activeCampaign.isRefunded && activeCampaign.status !== 'Suspended' && (
                                        <div className={`p-4 border rounded-2xl flex items-center gap-3 ${isObsidian ? 'bg-red-950/20 text-red-400 border-red-900/30' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            <ShieldAlert size={20} />
                                            <div className="text-xs">
                                                <strong className="block">Contributions Refunded</strong>
                                                This campaign expired without meeting its target goal. All user contributions have been returned to their respective wallets.
                                            </div>
                                        </div>
                                    )}

                                    {activeCampaign.proofBillUrl && (
                                        <div className={`p-4 border rounded-2xl flex items-center justify-between ${isObsidian ? 'bg-zinc-900 border-zinc-800 text-[#F5F2EA]' : 'bg-emerald-50 text-emerald-950 border-emerald-200'}`}>
                                            <div className="flex items-center gap-3">
                                                <FileText size={20} className={isObsidian ? 'text-[#E6C97A]' : 'text-emerald-700'} />
                                                <div className="text-xs">
                                                    <strong className="block">Treatment Proof Uploaded</strong>
                                                    The veterinary treatment bill has been verified.
                                                </div>
                                            </div>
                                            <a
                                                href={activeCampaign.proofBillUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${isObsidian ? 'bg-[#E6C97A] text-black hover:bg-[#8c6d23]' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                                            >
                                                View Bill
                                            </a>
                                        </div>
                                    )}

                                    {/* Motive reached - upload proof billing for creator */}
                                    {activeCampaign.raisedAmount >= activeCampaign.targetAmount && (
                                        <div className={`p-5 rounded-2xl space-y-4 border ${isObsidian ? 'bg-[#121212] border-zinc-800' : 'bg-amber-50 border-[#e8d5b0]'}`}>
                                            <h4 className={`font-black text-xs uppercase flex items-center gap-1.5 ${isObsidian ? 'text-[#E6C97A]' : 'text-[#2c1e14]'}`}>
                                                <Sparkles className={isObsidian ? 'text-[#E6C97A]' : 'text-amber-600'} size={16} /> Campaign Target Met!
                                            </h4>
                                            {activeCampaign.proofBillUrl ? (
                                                <p className={`text-xs ${isObsidian ? 'text-emerald-400' : 'text-emerald-800'}`}>
                                                    You have already uploaded an invoice/receipt. If it was incorrect or needs updating, you can attach a new file below to replace it.
                                                </p>
                                            ) : (
                                                <p className={`text-xs ${isObsidian ? 'text-neutral-400' : 'text-gray-600'}`}>
                                                    Since the campaign target amount has been successfully gathered, the funds are held securely. The campaign initiator must upload the official clinic treatment invoice/bill to release the funds.
                                                </p>
                                            )}

                                            {checkIsCreator(activeCampaign) ? (
                                                <div className="space-y-3">
                                                    <label className={`block text-xs font-bold ${isObsidian ? 'text-neutral-300' : 'text-gray-700'}`}>
                                                        {activeCampaign.proofBillUrl ? "Replace/Re-upload Invoice File" : "Select Invoice File"}
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png,.pdf"
                                                        onChange={(e) => setProofFile(e.target.files?.[0])}
                                                        className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-zinc-800 file:text-neutral-300 hover:file:bg-zinc-700"
                                                    />
                                                    <button
                                                        onClick={() => handleUploadProof(activeCampaign._id)}
                                                        disabled={proofLoading}
                                                        className={`w-full py-2.5 font-black rounded-xl text-xs flex justify-center items-center gap-2 ${isObsidian ? 'bg-[#E6C97A] text-black hover:bg-[#8c6d23]' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                                                    >
                                                        {proofLoading ? "Uploading..." : activeCampaign.proofBillUrl ? "Upload Corrected Bill" : "Upload Bill & Release Funds"}
                                                    </button>
                                                </div>
                                            ) : (
                                                !activeCampaign.proofBillUrl && (
                                                    <p className={`text-xs italic ${isObsidian ? 'text-neutral-500' : 'text-gray-500'}`}>
                                                        Awaiting veterinary invoice/bill upload by campaign creator ({activeCampaign.creatorId?.name}).
                                                    </p>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {/* Campaign failed refund panel */}
                                    {(activeCampaign.endDate && new Date() > new Date(activeCampaign.endDate)) && activeCampaign.raisedAmount < activeCampaign.targetAmount && !activeCampaign.isRefunded && (
                                        <div className={`p-5 border rounded-2xl space-y-4 ${isObsidian ? 'bg-red-950/20 border-red-900/30' : 'bg-red-50 border-red-200'}`}>
                                            <h4 className={`font-black text-xs uppercase flex items-center gap-1.5 ${isObsidian ? 'text-red-400' : 'text-red-800'}`}>
                                                <ShieldAlert size={16} /> Campaign Target Period Expired
                                            </h4>
                                            <p className={`text-xs ${isObsidian ? 'text-red-300' : 'text-red-950'}`}>
                                                This campaign expired on {new Date(activeCampaign.endDate).toLocaleDateString()} without reaching the required goal amount. The owner must issue immediate refunds to all contributors' wallets.
                                            </p>

                                            <div className="flex gap-3">
                                                {(checkIsCreator(activeCampaign) || checkIsAdmin()) && (
                                                    <button
                                                        onClick={() => handleRefundCampaign(activeCampaign._id)}
                                                        disabled={refundLoading}
                                                        className={`flex-1 py-3 font-black rounded-xl text-xs ${isObsidian ? 'bg-red-700/30 border border-red-600/40 text-red-300 hover:bg-red-700/50' : 'bg-red-600 text-white hover:bg-red-700'}`}
                                                    >
                                                        {refundLoading ? "Refunding..." : "Refund All Contributors"}
                                                    </button>
                                                )}

                                                {checkIsAdmin() && (
                                                    <button
                                                        onClick={() => handleAdminStrictAction(activeCampaign._id)}
                                                        disabled={adminActionLoading}
                                                        className={`flex-1 py-3 font-black rounded-xl text-xs ${isObsidian ? 'bg-neutral-800 border border-zinc-700 text-neutral-300 hover:bg-neutral-700' : 'bg-black text-white hover:bg-zinc-800'}`}
                                                    >
                                                        {adminActionLoading ? "Processing..." : "Take Strict Action (Ban Owner)"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Contributors List */}
                                    <div>
                                        <h3 className={`font-black text-sm mb-3 flex items-center gap-1.5 ${isObsidian ? 'text-[#E6C97A]' : 'text-[#2c1e14]'}`}>
                                            <Users size={16} /> Contributions History ({activeCampaign.contributions?.length || 0})
                                        </h3>
                                        {activeCampaign.contributions && activeCampaign.contributions.length > 0 ? (
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                                                {activeCampaign.contributions.map((con, idx) => (
                                                    <div key={idx} className={`p-3 rounded-xl border flex justify-between items-center text-xs ${isObsidian ? 'bg-[#121212] border-zinc-800' : 'bg-white'}`}>
                                                        <div>
                                                            <strong className={isObsidian ? 'text-neutral-200' : 'text-[#5A4035]'}>{con.userName}</strong>
                                                            <span className={`text-[10px] block mt-0.5 ${isObsidian ? 'text-neutral-500' : 'text-gray-400'}`}>
                                                                {new Date(con.date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <span className={`font-black font-mono ${isObsidian ? 'text-[#E6C97A]' : 'text-emerald-600'}`}>+₹{con.amount}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={`text-xs italic ${isObsidian ? 'text-neutral-500' : 'text-gray-400'}`}>No contributions recorded yet. Be the first to help!</p>
                                        )}
                                    </div>

                                    {(checkIsCreator(activeCampaign) || checkIsAdmin()) && (
                                        <div className="flex flex-col gap-3 mt-3">
                                            <div className="flex gap-3">
                                                {activeCampaign.status === 'Active' && (
                                                    <button
                                                        onClick={() => handleOpenEdit(activeCampaign)}
                                                        className={`flex-1 py-3.5 text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${isObsidian ? 'bg-amber-700/20 border border-amber-600/30 text-amber-400 hover:bg-amber-700/35' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
                                                    >
                                                        <Edit size={14} />
                                                        <span>Edit Campaign</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        handleDeleteCampaign(activeCampaign._id);
                                                    }}
                                                    className={`flex-1 py-3.5 text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${isObsidian ? 'bg-red-700/20 border border-red-600/30 text-red-400 hover:bg-red-700/35' : 'bg-red-600 text-white hover:bg-red-700'}`}
                                                >
                                                    <Trash2 size={14} />
                                                    <span>Delete Campaign</span>
                                                </button>
                                            </div>

                                            {checkIsCreator(activeCampaign) && activeCampaign.status === 'Active' && (
                                                <button
                                                    onClick={() => handleRefundCampaign(activeCampaign._id)}
                                                    disabled={refundLoading}
                                                    className={`w-full py-3.5 font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-md ${isObsidian ? 'bg-rose-950/40 border border-rose-900/40 text-rose-300 hover:bg-rose-950/60 shadow-none' : 'bg-rose-700 hover:bg-rose-800 text-white shadow-rose-100'}`}
                                                >
                                                    <ShieldAlert size={14} />
                                                    <span>{refundLoading ? "Refunding..." : "Suspend Campaign & Refund Contributors"}</span>
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {activeCampaign.status === 'Active' && (activeCampaign.endDate && new Date() <= new Date(activeCampaign.endDate)) && (
                                        <button
                                            onClick={() => {
                                                setActiveCampaign(null);
                                                handleDonateInit(activeCampaign);
                                            }}
                                            className={`w-full py-4 font-black rounded-2xl text-sm transition-all active:scale-[0.98] mt-4 ${isObsidian ? 'bg-gradient-to-r from-[#8C6D23] to-[#E6C97A] text-black shadow-lg shadow-[#E6C97A]/5' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                                        >
                                            Contribute Now
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Initiate Campaign Modal */}
                <AnimatePresence>
                    {showCreateModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full border max-h-[90vh] overflow-y-auto transition-colors duration-500 ${isObsidian ? 'bg-[#0E0E0E] border-zinc-800 text-[#F5F2EA]' : 'bg-[#fdf8f0] border-[#e8d5b0]'}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className={`text-2xl font-black ${isObsidian ? 'text-[#F5F2EA]' : 'text-[#2c1e14]'}`}>Initiate Stray Campaign</h2>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className={`p-1 rounded-full transition-colors ${isObsidian ? 'text-neutral-400 hover:bg-zinc-800' : 'text-gray-400 hover:bg-gray-100'}`}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateCampaign} className="space-y-4">
                                    <div>
                                        <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Campaign Title</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="E.g., Surgery for Injured Stray Dog"
                                            required
                                            className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 text-sm transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50' : 'bg-white focus:ring-[#c8860a] text-[#5A4035]'}`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Detailed Case Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Explain the animal's condition, required surgery/treatment, and vet advice..."
                                            required
                                            rows="3"
                                            className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 text-sm transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50' : 'bg-white focus:ring-[#c8860a] text-[#5A4035]'}`}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Animal Type</label>
                                            <select
                                                value={animalType}
                                                onChange={(e) => setAnimalType(e.target.value)}
                                                className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 text-sm transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50' : 'bg-white focus:ring-[#c8860a] text-[#5A4035]'}`}
                                            >
                                                <option value="Dog">Dog</option>
                                                <option value="Cat">Cat</option>
                                                <option value="Cow">Cow</option>
                                                <option value="Bird">Bird</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Target Amount (INR)</label>
                                            <input
                                                type="number"
                                                value={targetAmount}
                                                onChange={(e) => setTargetAmount(e.target.value)}
                                                placeholder="E.g., 8500"
                                                required
                                                className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 text-sm transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50' : 'bg-white focus:ring-[#c8860a] text-[#5A4035]'}`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Partner Veterinary Clinic Name</label>
                                        <input
                                            type="text"
                                            value={clinicName}
                                            onChange={(e) => setClinicName(e.target.value)}
                                            placeholder="E.g., Dr. Sharma Pet Hospital"
                                            required
                                            className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 text-sm transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50' : 'bg-white focus:ring-[#c8860a] text-[#5A4035]'}`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Clinic Account Payout ID (Optional)</label>
                                        <input
                                            type="text"
                                            value={clinicAccountId}
                                            onChange={(e) => setClinicAccountId(e.target.value)}
                                            placeholder="Razorpay clinic linked account token"
                                            className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 text-sm transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50' : 'bg-white focus:ring-[#c8860a] text-[#5A4035]'}`}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Campaign Duration (Days)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={durationDays}
                                                onChange={(e) => setDurationDays(e.target.value)}
                                                required
                                                className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 text-sm transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50' : 'bg-white focus:ring-[#c8860a] text-[#5A4035]'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-emerald-800'}`}>Self-Contribution (Min ₹500)</label>
                                            <input
                                                type="number"
                                                min="500"
                                                value={selfContributionAmount}
                                                onChange={(e) => setSelfContributionAmount(e.target.value)}
                                                required
                                                className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 text-sm font-black transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white border-zinc-700/80 focus:border-[#E6C97A]/50' : 'bg-white border-emerald-300 focus:ring-[#c8860a] text-[#5A4035]'}`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Payment Method for Self Contribution</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 text-sm transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50' : 'bg-white focus:ring-[#c8860a] text-[#5A4035]'}`}
                                        >
                                            <option value="razorpay">Razorpay Card/UPI</option>
                                            <option value="wallet">Paw Wallet (Available: ₹{userdata?.pawWallet || 0})</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Upload Case Photo</label>
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className={`w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black ${isObsidian ? 'file:bg-zinc-800 file:text-neutral-300 hover:file:bg-zinc-700' : 'file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100'}`}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={createLoading}
                                        className={`w-full py-4 font-black rounded-2xl text-sm flex justify-center items-center gap-2 ${isObsidian ? 'bg-gradient-to-r from-[#8C6D23] to-[#E6C97A] text-black hover:opacity-95' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                                    >
                                        {createLoading ? (
                                            <>
                                                <RefreshCw className="animate-spin" size={16} />
                                                <span>Processing Self-Contribution & Creating...</span>
                                            </>
                                        ) : (
                                            <span>Initiate & Pay Compulsory Contribution</span>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Edit Campaign Modal */}
                <AnimatePresence>
                    {showEditModal && editingCampaign && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full border max-h-[90vh] overflow-y-auto transition-colors duration-500 ${isObsidian ? 'bg-[#0E0E0E] border-zinc-800 text-[#F5F2EA]' : 'bg-[#fdf8f0] border-[#e8d5b0]'}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className={`text-2xl font-black ${isObsidian ? 'text-[#F5F2EA]' : 'text-[#2c1e14]'}`}>Edit Rescue Campaign</h2>
                                    <button
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setEditingCampaign(null);
                                        }}
                                        className={`p-1 rounded-full transition-colors ${isObsidian ? 'text-neutral-400 hover:bg-zinc-800' : 'text-gray-400 hover:bg-gray-100'}`}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleEditCampaign} className="space-y-4">
                                    <div>
                                        <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Campaign Title</label>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            required
                                            className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 text-sm transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50' : 'bg-white focus:ring-[#c8860a] text-[#5A4035]'}`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Detailed Case Description</label>
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            required
                                            rows="3"
                                            className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 text-sm transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50' : 'bg-white focus:ring-[#c8860a] text-[#5A4035]'}`}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Animal Type</label>
                                            <select
                                                value={editAnimalType}
                                                onChange={(e) => setEditAnimalType(e.target.value)}
                                                className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 text-sm transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50' : 'bg-white focus:ring-[#c8860a] text-[#5A4035]'}`}
                                            >
                                                <option value="Dog">Dog</option>
                                                <option value="Cat">Cat</option>
                                                <option value="Cow">Cow</option>
                                                <option value="Bird">Bird</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Target Amount (INR)</label>
                                            <input
                                                type="number"
                                                value={editTargetAmount}
                                                onChange={(e) => setEditTargetAmount(e.target.value)}
                                                required
                                                className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 text-sm transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50' : 'bg-white focus:ring-[#c8860a] text-[#5A4035]'}`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Partner Veterinary Clinic Name</label>
                                        <input
                                            type="text"
                                            value={editClinicName}
                                            onChange={(e) => setEditClinicName(e.target.value)}
                                            required
                                            className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 text-sm transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50' : 'bg-white focus:ring-[#c8860a] text-[#5A4035]'}`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Clinic Account Payout ID</label>
                                        <input
                                            type="text"
                                            value={editClinicAccountId}
                                            onChange={(e) => setEditClinicAccountId(e.target.value)}
                                            className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 text-sm transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50' : 'bg-white focus:ring-[#c8860a] text-[#5A4035]'}`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-xs font-black uppercase mb-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-gray-400'}`}>Upload New Case Photo (Optional)</label>
                                        <input
                                            type="file"
                                            onChange={handleEditFileChange}
                                            accept="image/*"
                                            className={`w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black ${isObsidian ? 'file:bg-zinc-800 file:text-neutral-300 hover:file:bg-zinc-700' : 'file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100'}`}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={editLoading}
                                        className={`w-full py-4 font-black rounded-2xl text-sm ${isObsidian ? 'bg-gradient-to-r from-[#8C6D23] to-[#E6C97A] text-black hover:opacity-95' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                                    >
                                        {editLoading ? "Updating..." : "Save Changes"}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Donate Modal */}
                <AnimatePresence>
                    {showDonateModal && targetCampaign && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full border transition-colors duration-500 ${isObsidian ? 'bg-[#0E0E0E] border-zinc-800 text-[#F5F2EA]' : 'bg-[#fdf8f0] border-[#e8d5b0]'}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className={`text-xl font-black ${isObsidian ? 'text-[#F5F2EA]' : 'text-[#2c1e14]'}`}>Contribute to Rescue</h2>
                                    <button
                                        onClick={() => setShowDonateModal(false)}
                                        className={`p-2 rounded-xl transition-all ${isObsidian ? 'text-neutral-400 hover:text-red-500 hover:bg-red-950/40' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={processContribution} className="space-y-5">
                                    <div>
                                        <span className={`text-[10px] font-black uppercase block ${isObsidian ? 'text-[#E6C97A]' : 'text-emerald-800'}`}>Selected Case</span>
                                        <strong className={`text-sm block mt-0.5 ${isObsidian ? 'text-neutral-200 font-extrabold' : 'text-[#5A4035] font-bold'}`}>{targetCampaign.title}</strong>
                                    </div>

                                    <div>
                                        <label className={`block text-xs font-black uppercase text-gray-400 mb-2`}>Choose Payment Method</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setDonatePaymentMethod('razorpay')}
                                                className={`py-3 px-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                                                    donatePaymentMethod === 'razorpay'
                                                        ? (isObsidian ? 'border-[#E6C97A] bg-[#E6C97A]/10 text-white scale-[1.02]' : 'border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-sm scale-[1.02]')
                                                        : (isObsidian ? 'border-zinc-800 bg-[#121212] text-neutral-400 hover:bg-zinc-800/35' : 'border-[#e8d5b0] bg-white text-gray-500 hover:bg-amber-50/30')
                                                }`}
                                            >
                                                <CreditCard size={18} className={donatePaymentMethod === 'razorpay' ? (isObsidian ? 'text-[#E6C97A]' : 'text-emerald-600') : 'text-gray-400'} />
                                                <span className="text-xs font-extrabold">Razorpay Card/UPI</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDonatePaymentMethod('wallet')}
                                                className={`py-3 px-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                                                    donatePaymentMethod === 'wallet'
                                                        ? (isObsidian ? 'border-[#E6C97A] bg-[#E6C97A]/10 text-white scale-[1.02]' : 'border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-sm scale-[1.02]')
                                                        : (isObsidian ? 'border-zinc-800 bg-[#121212] text-neutral-400 hover:bg-zinc-800/35' : 'border-[#e8d5b0] bg-white text-gray-500 hover:bg-amber-50/30')
                                                }`}
                                            >
                                                <Gift size={18} className={donatePaymentMethod === 'wallet' ? (isObsidian ? 'text-[#E6C97A]' : 'text-emerald-600') : 'text-gray-400'} />
                                                <span className="text-xs font-extrabold">Paw Wallet</span>
                                            </button>
                                        </div>
                                        {donatePaymentMethod === 'wallet' && (
                                            <div className={`mt-2.5 p-3 rounded-xl border flex items-center justify-between ${isObsidian ? 'bg-[#121212] border-zinc-800' : 'bg-emerald-50/50 border-emerald-100'}`}>
                                                <span className={`text-[11px] font-bold ${isObsidian ? 'text-neutral-400' : 'text-[#5A4035]'}`}>Available Balance</span>
                                                <strong className={`text-xs font-black ${isObsidian ? 'text-[#E6C97A]' : 'text-emerald-700'}`}>₹{userdata?.pawWallet || 0}</strong>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Contribution Amount (INR)</label>
                                        <div className="relative">
                                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm ${isObsidian ? 'text-[#E6C97A]' : 'text-[#5A4035]'}`}>₹</span>
                                            <input
                                                type="number"
                                                value={donateAmount}
                                                onChange={(e) => setDonateAmount(e.target.value)}
                                                placeholder="E.g., 500"
                                                required
                                                min="1"
                                                className={`w-full pl-9 pr-5 py-4 border rounded-2xl focus:outline-none focus:ring-2 text-sm font-black transition-all ${isObsidian ? 'bg-[#121212] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50' : 'bg-white border-[#e8d5b0] focus:ring-emerald-600 text-[#5A4035]'}`}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={donateLoading}
                                        className={`w-full py-4 rounded-2xl text-white font-black shadow-lg transition-all flex items-center justify-center gap-2 ${
                                            isObsidian 
                                                ? 'bg-gradient-to-r from-[#8C6D23] to-[#E6C97A] text-black shadow-[#E6C97A]/5 hover:opacity-95' 
                                                : 'bg-gradient-to-r from-emerald-600 to-[#5A4035] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                                        }`}
                                    >
                                        {donateLoading ? (
                                            <>
                                                <RefreshCw className="animate-spin" size={18} />
                                                <span>Processing Transaction...</span>
                                            </>
                                        ) : donatePaymentMethod === 'wallet' ? (
                                            <>
                                                <Gift size={18} />
                                                <span>Pay using Paw Wallet</span>
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard size={18} />
                                                <span>Pay securely with Razorpay</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StrayCrowdfunding;
