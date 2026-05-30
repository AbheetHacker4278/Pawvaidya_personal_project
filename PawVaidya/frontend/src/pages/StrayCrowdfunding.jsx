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
        <div className="min-h-screen pt-24 pb-16">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 border-b border-[#e8d5b0] pb-8">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-wider mb-3 border border-emerald-200">
                            <MapPin size={12} /> Geolocation Stray Care
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: B.dark }}>
                            Stray Crowdfunding
                        </h1>
                        <p className="mt-2 font-medium" style={{ color: B.light }}>
                            View and fund active stray animal medical campaigns. Compulsory owner contribution. Direct vet partner payouts.
                        </p>
                    </div>
                    {token && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-[#5A4035] text-white rounded-2xl text-sm font-black shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-2"
                        >
                            <PlusCircle size={18} /> Initiate Rescue Campaign
                        </button>
                    )}
                </div>

                {/* Location indicator */}
                <div className="mb-8 p-4 rounded-2xl bg-amber-50/50 border border-[#e8d5b0] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MapPin className="text-emerald-600" size={20} />
                        <div>
                            <span className="text-[10px] font-black text-emerald-800 uppercase block">Active Geolocation Status</span>
                            {locationLoading ? (
                                <span className="text-xs text-gray-500 font-bold">Acquiring GPS coordinates...</span>
                            ) : coords ? (
                                <span className="text-xs text-gray-800 font-bold">
                                    Radius coordinates: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
                                </span>
                            ) : (
                                <span className="text-xs text-gray-500 font-bold">Coords not loaded</span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={getUserLocation}
                        className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-xl"
                        title="Reload GPS Location"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>

                {/* Main Campaigns Grid */}
                {campaignsLoading ? (
                    <div className="flex justify-center py-24">
                        <RefreshCw className="animate-spin text-emerald-600" size={32} />
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="p-12 rounded-[2.5rem] bg-white border border-[#e8d5b0] shadow-xl flex flex-col items-center justify-center text-center min-h-[400px]">
                        <Heart size={56} className="text-emerald-200 mb-4" />
                        <h3 className="text-xl font-black text-[#2c1e14]">No Rescue Campaigns Nearby</h3>
                        <p className="text-xs text-gray-500 max-w-sm mt-1 leading-relaxed">
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
                                <div key={camp._id} className="bg-white rounded-[2rem] border border-[#e8d5b0] shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between relative">
                                    {(isCreator || isAdmin) && (
                                        <div className="absolute top-3 right-3 flex gap-2 z-10">
                                            {camp.status === 'Active' && (
                                                <button
                                                    onClick={() => handleOpenEdit(camp)}
                                                    className="p-2 bg-white/90 hover:bg-white text-amber-700 rounded-full shadow border border-amber-100 transition-colors"
                                                    title="Edit Campaign"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteCampaign(camp._id)}
                                                className="p-2 bg-white/90 hover:bg-white text-red-600 rounded-full shadow border border-red-100 transition-colors"
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
                                        <div className="w-full h-48 bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <Heart size={48} className="opacity-40" />
                                        </div>
                                    )}

                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded border border-emerald-200">
                                                    {camp.animalType}
                                                </span>
                                                <span className="text-xs font-black text-gray-500">
                                                    {camp.clinicName}
                                                </span>
                                            </div>

                                            <h3 className="font-black text-lg text-[#2c1e14] mb-2 truncate">
                                                {camp.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 line-clamp-3 mb-4">
                                                {camp.description}
                                            </p>

                                            <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold mb-4">
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
                                                <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                                                    <span>Raised: ₹{camp.raisedAmount}</span>
                                                    <span>Target: ₹{camp.targetAmount}</span>
                                                </div>
                                                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${
                                                            camp.status === 'Completed' ? 'bg-emerald-600' :
                                                            camp.status === 'Cancelled' ? 'bg-red-500' :
                                                            isExpired ? 'bg-amber-500' : 'bg-emerald-600'
                                                        }`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[10px] font-black text-emerald-700 block">
                                                        {percent}% Funded
                                                    </span>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                                        camp.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                                                        camp.status === 'Cancelled' ? 'bg-red-50 text-red-700' :
                                                        camp.status === 'Suspended' ? 'bg-gray-100 text-gray-700 font-bold border border-gray-300' :
                                                        'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {camp.status === 'Suspended' ? 'Suspended Campaign' : camp.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <button
                                                    onClick={() => loadCampaignDetails(camp._id)}
                                                    className="w-full py-2.5 border border-[#e8d5b0] hover:bg-amber-50 rounded-xl text-xs font-black text-[#5A4035]"
                                                >
                                                    View Details
                                                </button>
                                                {camp.status === 'Active' && !isExpired ? (
                                                    <button
                                                        onClick={() => handleDonateInit(camp)}
                                                        className="w-full py-2.5 bg-[#5A4035] text-white hover:bg-[#7a5a48] rounded-xl text-xs font-black"
                                                    >
                                                        Contribute
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled
                                                        className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-xl text-xs font-black cursor-not-allowed"
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
                                className="bg-[#fdf8f0] rounded-[2.5rem] shadow-2xl p-8 max-w-2xl w-full border border-[#e8d5b0] max-h-[85vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-[#2c1e14]">{activeCampaign.title}</h2>
                                        <span className="text-[10px] text-gray-400 block mt-1 font-bold">
                                            Created by: {activeCampaign.creatorId?.name || "Unknown Owner"} ({activeCampaign.creatorId?.email || ""})
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setActiveCampaign(null)}
                                        className="p-1 text-gray-400 hover:bg-gray-100 rounded-full"
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

                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between text-xs">
                                        <div>
                                            <span className="text-[10px] font-black text-emerald-800 uppercase block">Treatment Veterinary Partner</span>
                                            <strong className="text-emerald-950 text-sm mt-0.5 block">{activeCampaign.clinicName}</strong>
                                        </div>
                                        {activeCampaign.clinicAccountId && (
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-emerald-800 uppercase block">Razorpay Split ID</span>
                                                <code className="text-[10px] text-gray-600 block mt-0.5">{activeCampaign.clinicAccountId}</code>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="font-black text-sm text-[#2c1e14] mb-2">Description</h3>
                                        <p className="text-xs text-gray-600 leading-relaxed">{activeCampaign.description}</p>
                                    </div>

                                    {/* Donation metrics */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-white border rounded-2xl text-center">
                                            <span className="text-[9px] font-black text-gray-400 uppercase">Target Amount</span>
                                            <span className="text-lg font-black text-[#5A4035] block mt-1">₹{activeCampaign.targetAmount}</span>
                                        </div>
                                        <div className="p-4 bg-white border rounded-2xl text-center">
                                            <span className="text-[9px] font-black text-gray-400 uppercase">Total Raised</span>
                                            <span className="text-lg font-black text-emerald-600 block mt-1">₹{activeCampaign.raisedAmount}</span>
                                        </div>
                                        <div className="p-4 bg-white border rounded-2xl text-center">
                                            <span className="text-[9px] font-black text-gray-400 uppercase">Status</span>
                                            <span className={`text-xs font-black px-2 py-0.5 rounded border inline-block mt-2 ${
                                                activeCampaign.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                activeCampaign.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                activeCampaign.status === 'Suspended' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                                                'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {activeCampaign.status === 'Suspended' ? 'Suspended Campaign' : activeCampaign.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Refunded or bill details */}
                                    {activeCampaign.status === 'Suspended' && (
                                        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl flex items-center gap-3">
                                            <ShieldAlert size={20} />
                                            <div className="text-xs">
                                                <strong className="block">Suspended Campaign</strong>
                                                This campaign has been suspended by the admin. All contributions have been automatically refunded back to the respective contributors' wallets.
                                            </div>
                                        </div>
                                    )}

                                    {activeCampaign.isRefunded && activeCampaign.status !== 'Suspended' && (
                                        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl flex items-center gap-3">
                                            <ShieldAlert size={20} />
                                            <div className="text-xs">
                                                <strong className="block">Contributions Refunded</strong>
                                                This campaign expired without meeting its target goal. All user contributions have been returned to their respective wallets.
                                            </div>
                                        </div>
                                    )}

                                    {activeCampaign.proofBillUrl && (
                                        <div className="p-4 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FileText size={20} className="text-emerald-700" />
                                                <div className="text-xs">
                                                    <strong className="block">Treatment Proof Uploaded</strong>
                                                    The veterinary treatment bill has been verified.
                                                </div>
                                            </div>
                                            <a
                                                href={activeCampaign.proofBillUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700"
                                            >
                                                View Bill
                                            </a>
                                        </div>
                                    )}

                                    {/* Motive reached - upload proof billing for creator */}
                                    {activeCampaign.raisedAmount >= activeCampaign.targetAmount && (
                                        <div className="p-5 bg-amber-50 border border-[#e8d5b0] rounded-2xl space-y-4">
                                            <h4 className="font-black text-[#2c1e14] text-xs uppercase flex items-center gap-1.5">
                                                <Sparkles className="text-amber-600" size={16} /> Campaign Target Met!
                                            </h4>
                                            {activeCampaign.proofBillUrl ? (
                                                <p className="text-xs text-emerald-800">
                                                    You have already uploaded an invoice/receipt. If it was incorrect or needs updating, you can attach a new file below to replace it.
                                                </p>
                                            ) : (
                                                <p className="text-xs text-gray-600">
                                                    Since the campaign target amount has been successfully gathered, the funds are held securely. The campaign initiator must upload the official clinic treatment invoice/bill to release the funds.
                                                </p>
                                            )}

                                            {checkIsCreator(activeCampaign) ? (
                                                <div className="space-y-3">
                                                    <label className="block text-xs font-bold text-gray-700">
                                                        {activeCampaign.proofBillUrl ? "Replace/Re-upload Invoice File" : "Select Invoice File"}
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png,.pdf"
                                                        onChange={(e) => setProofFile(e.target.files?.[0])}
                                                        className="w-full text-xs"
                                                    />
                                                    <button
                                                        onClick={() => handleUploadProof(activeCampaign._id)}
                                                        disabled={proofLoading}
                                                        className="w-full py-2.5 bg-emerald-600 text-white font-black hover:bg-emerald-700 rounded-xl text-xs flex justify-center items-center gap-2"
                                                    >
                                                        {proofLoading ? "Uploading..." : activeCampaign.proofBillUrl ? "Upload Corrected Bill" : "Upload Bill & Release Funds"}
                                                    </button>
                                                </div>
                                            ) : (
                                                !activeCampaign.proofBillUrl && (
                                                    <p className="text-xs text-gray-500 italic">
                                                        Awaiting veterinary invoice/bill upload by campaign creator ({activeCampaign.creatorId?.name}).
                                                    </p>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {/* Campaign failed refund panel */}
                                    {(activeCampaign.endDate && new Date() > new Date(activeCampaign.endDate)) && activeCampaign.raisedAmount < activeCampaign.targetAmount && !activeCampaign.isRefunded && (
                                        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl space-y-4">
                                            <h4 className="font-black text-red-800 text-xs uppercase flex items-center gap-1.5">
                                                <ShieldAlert size={16} /> Campaign Target Period Expired
                                            </h4>
                                            <p className="text-xs text-red-950">
                                                This campaign expired on {new Date(activeCampaign.endDate).toLocaleDateString()} without reaching the required goal amount. The owner must issue immediate refunds to all contributors' wallets.
                                            </p>

                                            <div className="flex gap-3">
                                                {(checkIsCreator(activeCampaign) || checkIsAdmin()) && (
                                                    <button
                                                        onClick={() => handleRefundCampaign(activeCampaign._id)}
                                                        disabled={refundLoading}
                                                        className="flex-1 py-3 bg-red-600 text-white font-black hover:bg-red-700 rounded-xl text-xs"
                                                    >
                                                        {refundLoading ? "Refunding..." : "Refund All Contributors"}
                                                    </button>
                                                )}

                                                {checkIsAdmin() && (
                                                    <button
                                                        onClick={() => handleAdminStrictAction(activeCampaign._id)}
                                                        disabled={adminActionLoading}
                                                        className="flex-1 py-3 bg-black text-white font-black hover:bg-zinc-800 rounded-xl text-xs"
                                                    >
                                                        {adminActionLoading ? "Processing..." : "Take Strict Action (Ban Owner)"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Contributors List */}
                                    <div>
                                        <h3 className="font-black text-sm text-[#2c1e14] mb-3 flex items-center gap-1.5">
                                            <Users size={16} /> Contributions History ({activeCampaign.contributions?.length || 0})
                                        </h3>
                                        {activeCampaign.contributions && activeCampaign.contributions.length > 0 ? (
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                                                {activeCampaign.contributions.map((con, idx) => (
                                                    <div key={idx} className="p-3 bg-white rounded-xl border flex justify-between items-center text-xs">
                                                        <div>
                                                            <strong className="text-[#5A4035]">{con.userName}</strong>
                                                            <span className="text-[10px] text-gray-400 block mt-0.5">
                                                                {new Date(con.date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <span className="font-black text-emerald-600 font-mono">+₹{con.amount}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">No contributions recorded yet. Be the first to help!</p>
                                        )}
                                    </div>

                                    {(checkIsCreator(activeCampaign) || checkIsAdmin()) && (
                                        <div className="flex flex-col gap-3 mt-3">
                                            <div className="flex gap-3">
                                                {activeCampaign.status === 'Active' && (
                                                    <button
                                                        onClick={() => handleOpenEdit(activeCampaign)}
                                                        className="flex-1 py-3.5 bg-amber-600 text-white font-black hover:bg-amber-700 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                                                    >
                                                        <Edit size={14} />
                                                        <span>Edit Campaign</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        handleDeleteCampaign(activeCampaign._id);
                                                    }}
                                                    className="flex-1 py-3.5 bg-red-600 text-white font-black hover:bg-red-700 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                                                >
                                                    <Trash2 size={14} />
                                                    <span>Delete Campaign</span>
                                                </button>
                                            </div>

                                            {checkIsCreator(activeCampaign) && activeCampaign.status === 'Active' && (
                                                <button
                                                    onClick={() => handleRefundCampaign(activeCampaign._id)}
                                                    disabled={refundLoading}
                                                    className="w-full py-3.5 bg-rose-700 hover:bg-rose-800 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-md shadow-rose-100"
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
                                            className="w-full py-4 bg-emerald-600 text-white font-black hover:bg-emerald-700 rounded-2xl text-sm transition-all active:scale-[0.98] mt-4"
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
                                className="bg-[#fdf8f0] rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full border border-[#e8d5b0] max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-2xl font-black text-[#2c1e14]">Initiate Stray Campaign</h2>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="p-1 text-gray-400 hover:bg-gray-100 rounded-full"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateCampaign} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Campaign Title</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="E.g., Surgery for Injured Stray Dog"
                                            required
                                            className="w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Detailed Case Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Explain the animal's condition, required surgery/treatment, and vet advice..."
                                            required
                                            rows="3"
                                            className="w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Animal Type</label>
                                            <select
                                                value={animalType}
                                                onChange={(e) => setAnimalType(e.target.value)}
                                                className="w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035]"
                                            >
                                                <option value="Dog">Dog</option>
                                                <option value="Cat">Cat</option>
                                                <option value="Cow">Cow</option>
                                                <option value="Bird">Bird</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Target Amount (INR)</label>
                                            <input
                                                type="number"
                                                value={targetAmount}
                                                onChange={(e) => setTargetAmount(e.target.value)}
                                                placeholder="E.g., 8500"
                                                required
                                                className="w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Partner Veterinary Clinic Name</label>
                                        <input
                                            type="text"
                                            value={clinicName}
                                            onChange={(e) => setClinicName(e.target.value)}
                                            placeholder="E.g., Dr. Sharma Pet Hospital"
                                            required
                                            className="w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Clinic Account Payout ID (Optional)</label>
                                        <input
                                            type="text"
                                            value={clinicAccountId}
                                            onChange={(e) => setClinicAccountId(e.target.value)}
                                            placeholder="Razorpay clinic linked account token"
                                            className="w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Campaign Duration (Days)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={durationDays}
                                                onChange={(e) => setDurationDays(e.target.value)}
                                                required
                                                className="w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase text-gray-400 mb-2 font-bold text-emerald-800">Self-Contribution (Min ₹500)</label>
                                            <input
                                                type="number"
                                                min="500"
                                                value={selfContributionAmount}
                                                onChange={(e) => setSelfContributionAmount(e.target.value)}
                                                required
                                                className="w-full px-5 py-3.5 bg-white border border-emerald-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035] font-black"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Payment Method for Self Contribution</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035]"
                                        >
                                            <option value="razorpay">Razorpay Card/UPI</option>
                                            <option value="wallet">Paw Wallet (Available: ₹{userdata?.pawWallet || 0})</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Upload Case Photo</label>
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={createLoading}
                                        className="w-full py-4 bg-emerald-600 text-white font-black hover:bg-emerald-700 rounded-2xl text-sm flex justify-center items-center gap-2"
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
                                className="bg-[#fdf8f0] rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full border border-[#e8d5b0] max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-2xl font-black text-[#2c1e14]">Edit Rescue Campaign</h2>
                                    <button
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setEditingCampaign(null);
                                        }}
                                        className="p-1 text-gray-400 hover:bg-gray-100 rounded-full"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleEditCampaign} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Campaign Title</label>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            required
                                            className="w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Detailed Case Description</label>
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            required
                                            rows="3"
                                            className="w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Animal Type</label>
                                            <select
                                                value={editAnimalType}
                                                onChange={(e) => setEditAnimalType(e.target.value)}
                                                className="w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035]"
                                            >
                                                <option value="Dog">Dog</option>
                                                <option value="Cat">Cat</option>
                                                <option value="Cow">Cow</option>
                                                <option value="Bird">Bird</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Target Amount (INR)</label>
                                            <input
                                                type="number"
                                                value={editTargetAmount}
                                                onChange={(e) => setEditTargetAmount(e.target.value)}
                                                required
                                                className="w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Partner Veterinary Clinic Name</label>
                                        <input
                                            type="text"
                                            value={editClinicName}
                                            onChange={(e) => setEditClinicName(e.target.value)}
                                            required
                                            className="w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Clinic Account Payout ID</label>
                                        <input
                                            type="text"
                                            value={editClinicAccountId}
                                            onChange={(e) => setEditClinicAccountId(e.target.value)}
                                            className="w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Upload New Case Photo (Optional)</label>
                                        <input
                                            type="file"
                                            onChange={handleEditFileChange}
                                            accept="image/*"
                                            className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={editLoading}
                                        className="w-full py-4 bg-emerald-600 text-white font-black hover:bg-emerald-700 rounded-2xl text-sm"
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
                                className="bg-[#fdf8f0] rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full border border-[#e8d5b0]"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-xl font-black text-[#2c1e14]">Contribute to Rescue</h2>
                                    <button
                                        onClick={() => setShowDonateModal(false)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={processContribution} className="space-y-5">
                                    <div>
                                        <span className="text-[10px] font-black text-emerald-800 uppercase block">Selected Case</span>
                                        <strong className="text-[#5A4035] text-sm block mt-0.5">{targetCampaign.title}</strong>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Choose Payment Method</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setDonatePaymentMethod('razorpay')}
                                                className={`py-3 px-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                                                    donatePaymentMethod === 'razorpay'
                                                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-sm scale-[1.02]'
                                                        : 'border-[#e8d5b0] bg-white text-gray-500 hover:bg-amber-50/30'
                                                }`}
                                            >
                                                <CreditCard size={18} className={donatePaymentMethod === 'razorpay' ? 'text-emerald-600' : 'text-gray-400'} />
                                                <span className="text-xs font-extrabold">Razorpay Card/UPI</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDonatePaymentMethod('wallet')}
                                                className={`py-3 px-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                                                    donatePaymentMethod === 'wallet'
                                                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-sm scale-[1.02]'
                                                        : 'border-[#e8d5b0] bg-white text-gray-500 hover:bg-amber-50/30'
                                                }`}
                                            >
                                                <Gift size={18} className={donatePaymentMethod === 'wallet' ? 'text-emerald-600' : 'text-gray-400'} />
                                                <span className="text-xs font-extrabold">Paw Wallet</span>
                                            </button>
                                        </div>
                                        {donatePaymentMethod === 'wallet' && (
                                            <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-[#5A4035]">Available Balance</span>
                                                <strong className="text-xs font-black text-emerald-700">₹{userdata?.pawWallet || 0}</strong>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Contribution Amount (INR)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A4035] font-black text-sm">₹</span>
                                            <input
                                                type="number"
                                                value={donateAmount}
                                                onChange={(e) => setDonateAmount(e.target.value)}
                                                placeholder="E.g., 500"
                                                required
                                                min="1"
                                                className="w-full pl-9 pr-5 py-4 bg-white border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm text-[#5A4035] font-black"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={donateLoading}
                                        className="w-full py-4 rounded-2xl text-white font-black bg-gradient-to-r from-emerald-600 to-[#5A4035] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
