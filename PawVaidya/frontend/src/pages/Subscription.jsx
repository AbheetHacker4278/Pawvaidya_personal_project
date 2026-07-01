import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { assets } from '../assets/assets_frontend/assets';
import { toast } from 'react-toastify';
import { Crown, Sparkles, Shield, Zap, Check, X, CreditCard, Wallet, Calendar, ArrowRight, ShieldCheck, Heart, Brain, Clock, Video, Percent, Users } from 'lucide-react';
import axios from 'axios';

const detailedFeatures = [
    {
        title: "AI-Powered Vitals Diagnostics",
        description: "Instant veterinary diagnosis based on vitals mapping and symptom intelligence using Gemma-3 AI.",
        details: "Input rectal temperature, heart rates, respiration rate, and observed symptoms. The tool computes a comprehensive health index, maps severity risks, and generates a personalized precautionary care checklist.",
        benefit: "Early detection of health issues before they become critical emergencies, saving life and cost.",
        badge: "Platinum Exclusive",
        badgeBg: "bg-purple-100 text-purple-700 border-purple-200",
        icon: <Brain className="w-6 h-6" />,
    },
    {
        title: "Priority Emergency Router",
        description: "Skip the queue during critical emergencies with ultra-fast caregiver assignment.",
        details: "Non-subscribers wait in the standard queue. Silver users get priority matching (5 min response goal), Gold users get super-priority (3 min response goal), and Platinum users secure a VIP claim lock instantly.",
        benefit: "Guarantees swift emergency response when every second counts for your pet.",
        badge: "All Subscribers",
        badgeBg: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: <Clock className="w-6 h-6" />,
    },
    {
        title: "Free Emergency Booking Fee",
        description: "Zero additional fees for booking emergency care appointments when your pet is in distress.",
        details: "Standard accounts incur a ₹100 flat booking fee for emergency visits. Subscribers of all tiers (Silver, Gold, Platinum) have this fee completely waived for all emergency requests.",
        benefit: "Removes financial barriers and friction when requesting urgent veterinary support.",
        badge: "All Subscribers",
        badgeBg: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: <Wallet className="w-6 h-6" />,
    },
    {
        title: "Video Consultations",
        description: "Telehealth video calls with certified veterinarians from the comfort of your home.",
        details: "Schedule high-definition video calls for follow-ups, general advice, or minor issues. Gold members receive 10 monthly credits (including 1 free call/month), and Platinum members receive 25 monthly credits.",
        benefit: "Saves travel time and stress for anxious pets by consulting professionals virtually.",
        badge: "Gold & Platinum Only",
        badgeBg: "bg-[#D4AF37]/10 text-amber-800 border-[#D4AF37]/20",
        icon: <Video className="w-6 h-6" />,
    },
    {
        title: "Routine Care Discounts",
        description: "Exclusive percentage savings applied automatically to all general care bookings.",
        details: "Enjoy automatically calculated discounts on all non-emergency checkups. Silver tier grants a 10% discount, Gold tier grants 20%, and Platinum tier grants a massive 30% discount.",
        benefit: "Makes routine pet health management, vaccinations, and checkups highly affordable.",
        badge: "All Subscribers",
        badgeBg: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: <Percent className="w-6 h-6" />,
    },
    {
        title: "Household Caregiver Seats",
        description: "Grant profile access and scheduling permissions to family members or pet sitters.",
        details: "Invite multiple accounts to manage your pet's appointments, view diagnostic logs, and access veterinary prescriptions, keeping the whole family aligned on your pet's care.",
        benefit: "Enables seamless coordination of pet care duties across all household members.",
        badge: "Platinum Exclusive",
        badgeBg: "bg-purple-100 text-purple-700 border-purple-200",
        icon: <Users className="w-6 h-6" />,
    }
];

const Subscription = () => {
    const {
        backendurl,
        token,
        userdata,
        getSubscriptionPlans,
        subscribeViaWallet,
        createRazorpaySubscription,
        verifySubscriptionPayment,
        loadUserProfileData
    } = useContext(AppContext);
    const isObsidian = userdata?.subscription?.plan === 'Obsidian';
    const navigate = React.useMemo(() => (path) => window.location.href = path, []); // Simple navigate fallback if not in context

    useEffect(() => {
        if (!document.getElementById('razorpay-js')) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.id = 'razorpay-js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const [plans, setPlans] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [paymentModal, setPaymentModal] = useState(false);
    const [usageInfo, setUsageInfo] = useState(null);
    const [obsidianDuration, setObsidianDuration] = useState('1 Month');
    const [submittingObsidian, setSubmittingObsidian] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    const obsidianRequestState = React.useMemo(() => {
        if (userdata?.subscription?.plan === 'Obsidian' && userdata?.subscription?.status === 'Active') {
            return { plan: 'Obsidian', status: 'Active' };
        }
        if (userdata?.obsidianRequest) {
            return {
                plan: 'Obsidian',
                status: userdata.obsidianRequest.status === 'Pending' ? 'Pending Approval' : userdata.obsidianRequest.status,
                approvedAt: userdata.obsidianRequest.approvedAt,
                expiryDate: userdata.obsidianRequest.expiryDate
            };
        }
        if (userdata?.subscription?.plan === 'Obsidian') {
            return {
                plan: 'Obsidian',
                status: userdata.subscription.status,
                approvedAt: userdata.subscription.approvedAt,
                expiryDate: userdata.subscription.expiryDate
            };
        }
        return null;
    }, [userdata]);

    useEffect(() => {
        if (obsidianRequestState?.plan === 'Obsidian' && obsidianRequestState?.expiryDate) {
            const expiry = new Date(obsidianRequestState.expiryDate).getTime();
            const now = Date.now();
            const diffMs = expiry - now;

            if (diffMs > 5 * 365 * 24 * 60 * 60 * 1000) {
                setObsidianDuration('Lifetime');
            } else if (diffMs > 45 * 24 * 60 * 60 * 1000) {
                setObsidianDuration('1 Year');
            } else {
                setObsidianDuration('1 Month');
            }
        }
    }, [obsidianRequestState]);

    useEffect(() => {
        if (obsidianRequestState?.plan === 'Obsidian' && obsidianRequestState?.status === 'Approved' && obsidianRequestState?.approvedAt) {
            const calculateTimeLeft = () => {
                const approvedAt = new Date(obsidianRequestState.approvedAt);
                const expiryTime = approvedAt.getTime() + 24 * 60 * 60 * 1000;
                const difference = expiryTime - Date.now();

                if (difference <= 0) {
                    setTimeLeft('Expired');
                    if (loadUserProfileData) loadUserProfileData();
                } else {
                    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                    const minutes = Math.floor((difference / 1000 / 60) % 60);
                    const seconds = Math.floor((difference / 1000) % 60);

                    setTimeLeft(
                        `${hours.toString().padStart(2, '0')}:${minutes
                            .toString()
                            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                    );
                }
            };

            calculateTimeLeft();
            const timer = setInterval(calculateTimeLeft, 1000);
            return () => clearInterval(timer);
        }
    }, [obsidianRequestState, loadUserProfileData]);

    const handleRequestObsidian = async () => {
        if (!token) {
            toast.info("Please login to request the Obsidian Signature Pass");
            return;
        }

        try {
            setSubmittingObsidian(true);
            const { data } = await axios.post(`${backendurl}/api/subscription/request-obsidian`, {
                duration: obsidianDuration
            }, {
                headers: { token }
            });

            if (data.success) {
                toast.success(data.message);
                if (loadUserProfileData) {
                    await loadUserProfileData();
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error requesting Obsidian pass:", error);
            toast.error(error.response?.data?.message || "Failed to submit request");
        } finally {
            setSubmittingObsidian(false);
        }
    };

    const colors = {
        primary: '#5A4035',
        accent: '#D4AF37', // Gold
        light: '#f2e4c7',
        white: '#ffffff',
        silver: '#C0C0C0',
        platinum: '#E5E4E2'
    };

    useEffect(() => {
        const fetchPlans = async () => {
            const data = await getSubscriptionPlans();
            setPlans(data);
            setLoading(false);
        };
        fetchPlans();
    }, []);

    // Fetch usage info if user has a plan
    useEffect(() => {
        const fetchUsage = async () => {
            if (token && userdata?.subscription?.plan && userdata.subscription.plan !== 'None') {
                try {
                    const response = await fetch(`${backendurl}/api/user/subscription-usage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', token },
                        body: JSON.stringify({ userId: userdata._id })
                    });
                    const data = await response.json();
                    if (data.success) {
                        setUsageInfo(data);
                    }
                } catch (error) {
                    console.error("Error fetching usage info:", error);
                }
            }
        };
        fetchUsage();
    }, [token, userdata]);

    const handleSubscribe = (planName) => {
        if (!token) {
            toast.info("Please login to subscribe");
            return;
        }
        setSelectedPlan(planName);
        setPaymentModal(true);
    };

    const processWalletPayment = async () => {
        setLoading(true);
        const success = await subscribeViaWallet(selectedPlan);
        if (success) setPaymentModal(false);
        setLoading(false);
    };

    const processRazorpayPayment = async () => {
        setLoading(true);
        const data = await createRazorpaySubscription(selectedPlan);

        if (data && data.success) {
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "PawVaidya Premium",
                description: `${selectedPlan} Tier Membership`,
                order_id: data.order.id,
                handler: async (response) => {
                    const verifyData = {
                        planName: selectedPlan,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                    };
                    const success = await verifySubscriptionPayment(verifyData);
                    if (success) setPaymentModal(false);
                },
                prefill: {
                    name: userdata?.name,
                    email: userdata?.email,
                },
                theme: {
                    color: colors.primary,
                },
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        }
        setLoading(false);
    };

    const getBtnContent = (tier) => {
        if (tier.isActive) {
            return (
                <span className="flex items-center justify-center gap-1.5 font-black tracking-widest">
                    <Check size={14} strokeWidth={3} className="text-emerald-500" /> Active Plan
                </span>
            );
        }
        if (tier.name === 'Non-Subscriber') {
            return 'Standard Tier Active';
        }
        if (userdata?.subscription?.plan === 'Platinum') {
            return 'VIP Tier Active';
        }

        const isUpgrade = (userdata?.subscription?.plan === 'Silver' && (tier.name === 'Gold' || tier.name === 'Platinum')) ||
            (userdata?.subscription?.plan === 'Gold' && tier.name === 'Platinum');

        if (isUpgrade) {
            const upgradeCost = tier.price - (plans?.[userdata?.subscription?.plan]?.price || (userdata?.subscription?.plan === 'Silver' ? 599 : userdata?.subscription?.plan === 'Gold' ? 699 : 0));
            return (
                <span className="flex items-center justify-center gap-1.5 font-black tracking-widest">
                    <Zap size={14} className="text-[#D4AF37] fill-[#D4AF37] animate-pulse" /> Upgrade for ₹{upgradeCost}
                </span>
            );
        }

        return (
            <span className="flex items-center justify-center gap-1.5 font-black tracking-widest">
                {tier.name === 'Silver' && <Shield size={14} />}
                {tier.name === 'Gold' && <Crown size={14} />}
                {tier.name === 'Platinum' && <Sparkles size={14} />}
                Select {tier.name} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </span>
        );
    };

    const getTiers = () => {
        const standardPrice = 0;
        const silverPrice = plans?.Silver?.price || 599;
        const goldPrice = plans?.Gold?.price || 699;
        const platinumPrice = plans?.Platinum?.price || 999;

        const isNoneActive = !userdata?.subscription?.plan || userdata?.subscription?.plan === 'None' || userdata?.subscription?.status !== 'Active';

        return [
            {
                name: 'Non-Subscriber',
                price: standardPrice,
                limit: '1 Booking / Week',
                discount: 'No Care Discount',
                savings: 'Standard Charges Apply',
                icon: <Shield className={`w-8 h-8 ${isObsidian ? 'text-[#E6C97A]' : 'text-slate-400'}`} />,
                color: isObsidian ? '#E6C97A' : '#94a3b8',
                isActive: isNoneActive,
                validity: 'Lifetime Access',
                bgClass: isObsidian ? 'bg-[#0D0D0D] border-[#E6C97A]/15 text-white' : 'bg-white text-[#3d2b1f]',
                borderClass: isObsidian ? 'border-[#E6C97A]/15' : 'border-slate-200',
                btnClass: isObsidian ? 'bg-[#151515] text-neutral-500 cursor-not-allowed border border-neutral-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                features: [
                    '₹100 Emergency Request Fee',
                    'Standard district-wise routing',
                    '4-day emergency due window',
                    'Standard support tier'
                ]
            },
            {
                name: 'Silver',
                price: silverPrice,
                limit: '3 Bookings / Week',
                discount: '10% Care Discount',
                savings: 'Saves up to ₹500 / mo!',
                icon: <Shield className={`w-8 h-8 ${isObsidian ? 'text-[#E6C97A]' : ''}`} style={isObsidian ? {} : { color: colors.silver }} />,
                color: isObsidian ? '#E6C97A' : colors.silver,
                isActive: userdata?.subscription?.plan === 'Silver' && userdata?.subscription?.status === 'Active',
                validity: '30 Days Duration',
                bgClass: isObsidian ? 'bg-[#0D0D0D] border-zinc-800 text-white' : 'bg-gradient-to-b from-slate-50 to-white text-[#3d2b1f]',
                borderClass: isObsidian ? 'border-zinc-800' : 'border-slate-200',
                btnClass: isObsidian ? 'border border-[#E6C97A]/30 bg-[#0A0A0A] text-white hover:bg-white/5' : 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border border-slate-600/30 shadow-[0_4px_15px_rgba(148,163,184,0.25)]',
                features: [
                    'Priority Booking',
                    '10% Appointment Discount',
                    'Unlimited Free Emergency Bookings',
                    'Basic Support'
                ]
            },
            {
                name: 'Gold',
                price: goldPrice,
                limit: '6 Bookings / Week',
                discount: '20% Care Discount',
                savings: 'Saves up to ₹1,500 / mo!',
                icon: <Crown className={`w-10 h-10 ${isObsidian ? 'text-[#E6C97A]' : ''}`} style={isObsidian ? {} : { color: colors.accent }} />,
                color: isObsidian ? '#E6C97A' : colors.accent,
                isActive: userdata?.subscription?.plan === 'Gold' && userdata?.subscription?.status === 'Active',
                validity: '30 Days Duration',
                featured: true,
                bgClass: isObsidian ? 'bg-gradient-to-b from-[#1C1A14] to-[#0A0A0A] text-white border-[#E6C97A] shadow-[0_0_30px_rgba(230,201,122,0.08)]' : 'bg-gradient-to-b from-[#5A4035] to-[#3d2b1f] text-[#f2e4c7]',
                borderClass: isObsidian ? 'border-[#E6C97A]' : 'border-[#D4AF37]',
                btnClass: isObsidian ? 'bg-[#E6C97A] text-black hover:bg-[#E6C97A]/90 font-extrabold shadow-[0_0_20px_rgba(230,201,122,0.25)]' : 'bg-gradient-to-r from-amber-500 via-[#D4AF37] to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#5A4035] font-extrabold border border-[#D4AF37]/40 shadow-[0_4px_20px_rgba(212,175,55,0.4)]',
                features: [
                    'Unlimited appointments',
                    '20% Appointment Discount',
                    'Free Video Consultation',
                    'Unlimited Free Emergency Bookings'
                ]
            },
            {
                name: 'Platinum',
                price: platinumPrice,
                limit: '30 Bookings / Week',
                discount: '30% Care Discount',
                savings: 'Saves up to ₹3,000+ / mo!',
                icon: <Sparkles className={`w-8 h-8 ${isObsidian ? 'text-[#E6C97A]' : ''}`} style={isObsidian ? {} : { color: colors.platinum }} />,
                color: isObsidian ? '#E6C97A' : colors.platinum,
                isActive: userdata?.subscription?.plan === 'Platinum' && userdata?.subscription?.status === 'Active',
                validity: '30 Days Duration',
                bgClass: isObsidian ? 'bg-[#0D0D0D] border-zinc-800 text-white' : 'bg-gradient-to-b from-slate-900 to-black text-white',
                borderClass: isObsidian ? 'border-zinc-800' : 'border-slate-700',
                btnClass: isObsidian ? 'border border-[#E6C97A]/30 bg-[#0A0A0A] text-white hover:bg-white/5' : 'bg-gradient-to-r from-white via-slate-100 to-slate-200 hover:from-white hover:to-slate-100 text-slate-950 font-extrabold border border-slate-200 shadow-[0_4px_25px_rgba(255,255,255,0.3)]',
                features: [
                    'Everything in Gold',
                    '30% Appointment Discount',
                    'Personal Pet Caregiver',
                    'Unlimited Free Emergency Bookings'
                ]
            }
        ];
    };

    if (loading && !plans) {
        return (
            <div className='min-h-[80vh] flex items-center justify-center bg-[#f2e4c7]/30'>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className='h-12 w-12 border-4 border-[#5A4035] border-t-transparent rounded-full'
                />
            </div>
        );
    }

    return (
        <div className={`min-h-screen py-20 px-4 md:px-8 transition-colors duration-300 ${isObsidian ? 'bg-[#050505] text-white' : 'bg-[#f2e4c7]/10'}`}>
            {/* Header section */}
            <div className='max-w-5xl mx-auto mb-12 text-center'>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs mb-4 tracking-widest uppercase ${isObsidian ? 'bg-[#151515] text-[#E6C97A] border border-[#E6C97A]/25' : 'bg-[#5A4035] text-[#D4AF37]'}`}
                >
                    <Sparkles size={14} /> Exclusive Membership Plans <Sparkles size={14} />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-3xl md:text-5xl font-serif font-black mb-4 leading-tight ${isObsidian ? 'text-white' : 'text-[#5A4035]'}`}
                >
                    Elevate Your <br />
                    <span className={`italic ${isObsidian ? 'text-[#E6C97A]' : 'text-[#D4AF37]'}`}>Pet's Care Experience</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`text-base max-w-xl mx-auto font-medium ${isObsidian ? 'text-neutral-400' : 'text-[#5A4035]/70'}`}
                >
                    Designed for pet owners who demand nothing but the absolute best.
                    Choose a plan that fits your lifestyle.
                </motion.p>

                {usageInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-8 inline-flex items-center gap-4 p-1.5 pl-5 rounded-full shadow-xl border ${isObsidian ? 'bg-[#0E0E0E] text-white border-[#E6C97A]/20' : 'bg-white text-[#5A4035] border-[#D4AF37]/20'}`}
                    >
                        <div className='flex items-center gap-2'>
                            <Zap size={16} className={isObsidian ? 'text-[#E6C97A]' : 'text-[#D4AF37]'} />
                            <span className={`text-sm font-bold ${isObsidian ? 'text-neutral-200' : 'text-[#5A4035]'}`}>Weekly Usage:</span>
                            <span className={`text-xs ${isObsidian ? 'text-neutral-400' : 'text-[#5A4035]/70'}`}>{usageInfo.count} / {usageInfo.limit} used</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full font-bold text-xs ${isObsidian ? 'bg-[#E6C97A] text-black' : 'bg-[#5A4035] text-white'}`}>
                            Active {usageInfo.plan} Plan
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Pricing Tiers */}
            <div className='max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24'>
                {getTiers().map((tier, idx) => (
                    <motion.div
                        key={tier.name}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.15 }}
                        className={`relative rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-2xl transition-all duration-500 border-2 overflow-hidden group ${tier.isActive
                                ? (isObsidian ? 'border-[#E6C97A] ring-4 ring-[#E6C97A]/20 scale-[1.02] shadow-[0_0_50px_rgba(230,201,122,0.15)]' : 'border-[#D4AF37] ring-4 ring-[#D4AF37]/20 scale-[1.02] shadow-[0_0_50px_rgba(212,175,55,0.15)]')
                                : `${tier.borderClass} hover:-translate-y-2`
                            } ${tier.bgClass}`}
                    >
                        {tier.featured && (
                            <div className={`absolute top-0 right-0 font-black text-[0.65rem] tracking-widest uppercase px-12 py-3 rotate-45 translate-x-14 translate-y-3 shadow-lg ${isObsidian ? 'bg-[#E6C97A] text-black' : 'bg-[#D4AF37] text-[#5A4035]'}`}>
                                Most Loved
                            </div>
                        )}

                        {tier.isActive && (
                            <div className='absolute top-3 left-3 bg-green-500 text-white font-black text-[9px] tracking-widest uppercase px-3 py-1 rounded-full shadow-md animate-pulse z-10'>
                                Active Plan
                            </div>
                        )}

                        <div className={`p-4 rounded-3xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 ${tier.featured ? (isObsidian ? 'bg-[#E6C97A] text-black' : 'bg-[#D4AF37] text-[#5A4035]') : (isObsidian ? 'bg-[#151515] text-[#E6C97A]' : 'bg-[#5A4035] text-[#f2e4c7]')}`}>
                            {tier.icon}
                        </div>

                        <h3 className='text-2xl font-black mb-1 uppercase tracking-tighter'>{tier.name}</h3>
                        <div className='text-sm font-bold opacity-60 mb-4 uppercase tracking-[0.2em]'>Wellness Tier</div>

                        <div className='flex items-baseline gap-1 mb-2'>
                            <span className='text-4xl font-black'>₹{tier.price}</span>
                            <span className='text-base opacity-60 font-medium'>/mo</span>
                        </div>

                        {/* Validity duration display */}
                        <div className='flex items-center gap-1.5 justify-center text-[10px] opacity-60 font-bold mb-4 uppercase tracking-widest'>
                            <Calendar className='w-3.5 h-3.5' /> {tier.validity}
                        </div>

                        {/* Savings Display compared to Non-subscribers */}
                        <div className={`text-[10px] font-extrabold uppercase tracking-wider mb-6 px-3 py-1.5 rounded-full inline-block border shadow-sm ${tier.name === 'Non-Subscriber'
                                ? (isObsidian ? 'bg-zinc-900/40 text-neutral-400 border-zinc-800' : 'bg-slate-50 text-slate-500 border-slate-200/50')
                                : (isObsidian ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' : 'bg-green-50/80 text-green-700 border-green-200/50')
                            }`}>
                            {tier.savings}
                        </div>

                        <div className='w-full space-y-4 mb-8 text-left'>
                            <div className={`p-4 rounded-2xl flex items-center justify-between font-black text-xs uppercase ${tier.featured ? (isObsidian ? 'bg-[#E6C97A]/10 border border-[#E6C97A]/20 text-white' : 'bg-[#f2e4c7]/10 border border-[#f2e4c7]/20') : (isObsidian ? 'bg-[#151515] text-white border border-zinc-800' : 'bg-slate-100 text-[#3d2b1f]')}`}>
                                <span className='opacity-60'>Weekly Limit</span>
                                <span>{tier.limit}</span>
                            </div>
                            <div className={`p-4 rounded-2xl flex items-center justify-between font-black text-xs uppercase ${tier.featured ? (isObsidian ? 'bg-[#E6C97A]/10 border border-[#E6C97A]/20 text-white' : 'bg-[#f2e4c7]/10 border border-[#f2e4c7]/20') : (isObsidian ? 'bg-[#151515] text-white border border-zinc-800' : 'bg-slate-100 text-[#3d2b1f]')}`}>
                                <span className='opacity-60'>Discount</span>
                                <span>{tier.discount}</span>
                            </div>
                            <div className='pt-4 space-y-3'>
                                {tier.features.slice(0, 4).map((f, i) => (
                                    <div key={i} className='flex items-start gap-2.5 text-xs font-semibold leading-tight'>
                                        <div className={`p-0.5 rounded-full mt-0.5 shrink-0 ${tier.featured ? (isObsidian ? 'bg-[#E6C97A] text-black' : 'bg-[#D4AF37] text-[#5A4035]') : (isObsidian ? 'bg-[#E6C97A] text-black' : 'bg-[#5A4035] text-white')}`}>
                                            <Check size={10} strokeWidth={4} />
                                        </div>
                                        <span>{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {userdata?.subscription?.plan === 'Obsidian' && tier.name !== 'Non-Subscriber' ? (
                            <div className='w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm bg-gradient-to-r from-yellow-500/5 via-[#E6C97A]/15 to-yellow-500/5 text-[#E6C97A] border border-[#E6C97A]/30 flex items-center justify-center gap-2.5 mt-auto shadow-[0_0_20px_rgba(230,201,122,0.05)] select-none'>
                                <Sparkles size={14} className="animate-pulse text-[#E6C97A]" strokeWidth={2.5} /> Obsidian Unlocked
                            </div>
                        ) : (
                            <button
                                onClick={() => handleSubscribe(tier.name)}
                                disabled={
                                    tier.name === 'Non-Subscriber' ||
                                    tier.isActive ||
                                    userdata?.subscription?.plan === 'Platinum' ||
                                    (userdata?.subscription?.plan === 'Gold' && tier.name === 'Silver')
                                }
                                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm shadow-xl transition-all duration-300 active:scale-95 mt-auto group ${tier.btnClass} ${tier.name === 'Non-Subscriber' ||
                                        tier.isActive ||
                                        userdata?.subscription?.plan === 'Platinum' ||
                                        (userdata?.subscription?.plan === 'Gold' && tier.name === 'Silver')
                                        ? (isObsidian ? 'opacity-40 cursor-not-allowed bg-zinc-950/20 text-neutral-600 border border-zinc-900 shadow-none' : 'opacity-40 cursor-not-allowed bg-slate-300/10 text-slate-400 border-slate-300/10 shadow-none')
                                        : 'hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-0.5'
                                    }`}
                            >
                                {getBtnContent(tier)}
                            </button>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Obsidian Signature Pass Section */}
            <div className='max-w-7xl mx-auto mb-24 px-4'>
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className='relative rounded-[3rem] p-8 md:p-12 overflow-hidden border border-[#D4AF37]/30 shadow-[0_0_80px_rgba(0,0,0,0.8)] bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white'
                >
                    {/* Glowing background effects */}
                    <div className='absolute top-0 right-0 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl -z-10' />
                    <div className='absolute bottom-0 left-0 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl -z-10' />

                    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-center'>
                        <div className='lg:col-span-7 space-y-6'>
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r border font-black text-[10px] tracking-widest uppercase shadow-md ${isObsidian ? 'from-neutral-900 to-[#1E1B15] border-[#E6C97A]/40 text-[#E6C97A]' : 'from-neutral-900 to-[#5A4035] border-[#D4AF37]/40 text-[#D4AF37]'}`}>
                                <Sparkles size={12} className="animate-pulse" /> Elite Tier Experience <Sparkles size={12} />
                            </div>

                            <h2 className={`text-3xl md:text-5xl font-serif font-black tracking-tight leading-none bg-gradient-to-r bg-clip-text text-transparent ${isObsidian ? 'from-white via-[#f2e4c7] to-[#E6C97A]' : 'from-white via-[#f2e4c7] to-[#D4AF37]'}`}>
                                PawVaidya Obsidian <br />
                                <span className='italic font-light'>Signature Pass</span>
                            </h2>

                            <p className='text-sm md:text-base text-neutral-400 font-medium leading-relaxed max-w-xl'>
                                The ultimate premium pass for pet owners who desire absolute priority, luxury, and peace of mind. Experience veterinary care elevated to a fine art.
                            </p>

                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4'>
                                {[
                                    { title: "24/7 Dedicated Care Manager", desc: "Your personal advocate coordinating all appointments and records." },
                                    { title: "Zero Emergency Fees Forever", desc: "No booking charges or surcharges on any critical care services." },
                                    { title: "Direct Priority Hotline", desc: "Connect instantly to senior consultants via call or WhatsApp." },
                                    { title: "Priority Home Vet Visits", desc: "Top-tier doctors dispatched to your doorstep, minimizing stress." }
                                ].map((feat, i) => (
                                    <div key={i} className={`flex gap-3 items-start bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800/80 transition-all ${isObsidian ? 'hover:border-[#E6C97A]/25' : 'hover:border-[#D4AF37]/25'}`}>
                                        <div className={`p-1.5 rounded-lg mt-0.5 ${isObsidian ? 'bg-[#E6C97A]/10 text-[#E6C97A]' : 'bg-[#5A4035]/50 text-[#D4AF37]'}`}>
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <h4 className='font-black text-xs text-[#f2e4c7] uppercase tracking-wide'>{feat.title}</h4>
                                            <p className='text-[11px] text-neutral-500 font-semibold mt-0.5 leading-snug'>{feat.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className='lg:col-span-5 bg-neutral-900/80 rounded-[2.5rem] p-8 border border-neutral-800 flex flex-col justify-between items-center text-center shadow-xl space-y-6 relative'>
                            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/5 to-transparent rounded-[2.5rem] pointer-events-none' />

                            <div className='space-y-2'>
                                <h3 className={`text-xl font-black uppercase tracking-wider ${isObsidian ? 'text-[#E6C97A]' : 'text-[#D4AF37]'}`}>Request Signature Membership</h3>
                                <p className='text-xs text-neutral-400 font-bold uppercase tracking-widest'>Select a duration below to apply</p>
                            </div>

                            {/* Duration selector */}
                            <div className='w-full grid grid-cols-3 gap-2.5 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800'>
                                {[
                                    { label: '1 Month', price: '₹49,999' },
                                    { label: '1 Year', price: '₹5.5L' },
                                    { label: 'Lifetime', price: '₹30L' }
                                ].map((opt) => (
                                    <button
                                        key={opt.label}
                                        onClick={() => setObsidianDuration(opt.label)}
                                        disabled={obsidianRequestState?.plan === 'Obsidian'}
                                        className={`py-3.5 px-2 rounded-xl text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${obsidianDuration === opt.label
                                                ? (isObsidian ? 'bg-[#151515] border border-[#E6C97A]/40 text-[#E6C97A]' : 'bg-[#5A4035] border border-[#D4AF37]/40 text-[#D4AF37]')
                                                : 'bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-900'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <span className='font-black text-[10px] uppercase tracking-wider'>{opt.label}</span>
                                        <span className='font-black text-xs'>{opt.price}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Cost display */}
                            <div className='py-4 border-y border-dashed border-neutral-800 w-full flex items-baseline justify-center gap-1.5'>
                                <span className='text-xs text-neutral-500 font-black uppercase tracking-wider'>Total Cost:</span>
                                <span className='text-3xl font-black text-white'>
                                    {obsidianDuration === '1 Month' && '₹49,999'}
                                    {obsidianDuration === '1 Year' && '₹5,50,000'}
                                    {obsidianDuration === 'Lifetime' && '₹3,000,000'}
                                </span>
                            </div>

                            {/* Actions / Status */}
                            {obsidianRequestState?.plan === 'Obsidian' ? (
                                <div className='w-full space-y-4'>
                                    {obsidianRequestState?.status === 'Pending Approval' ? (
                                        <div className='w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-amber-500/10 text-amber-500 border-2 border-amber-500/20 shadow-inner flex items-center justify-center gap-2 animate-pulse'>
                                            <Clock size={14} /> Request Pending Approval
                                        </div>
                                    ) : obsidianRequestState?.status === 'Approved' ? (
                                        <div className='w-full space-y-3'>
                                            <div className='w-full py-3 rounded-2xl font-black uppercase tracking-widest text-xs bg-indigo-500/10 text-indigo-400 border-2 border-indigo-500/20 flex flex-col items-center justify-center gap-1 shadow-inner'>
                                                <div className={`flex items-center gap-1.5 ${isObsidian ? 'text-[#E6C97A]' : 'text-[#D4AF37]'}`}>
                                                    <Sparkles size={14} /> Approved & Ready for Payment
                                                </div>
                                                <div className="text-[10px] text-neutral-400 mt-1">
                                                    Payment Window Expires in: <span className="font-mono text-white text-xs">{timeLeft || '24:00:00'}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleSubscribe('Obsidian')}
                                                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 ${isObsidian ? 'bg-[#E6C97A] text-black hover:bg-[#E6C97A]/90' : 'bg-gradient-to-r from-amber-500 via-[#D4AF37] to-[#e8d5b0] hover:from-amber-400 hover:to-amber-500 text-neutral-950'}`}
                                            >
                                                Complete Payment <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className='w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.08)] flex items-center justify-center gap-2.5'>
                                            <Check size={14} strokeWidth={3} /> Signature Pass Active
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={handleRequestObsidian}
                                    disabled={submittingObsidian}
                                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 ${isObsidian ? 'bg-[#E6C97A] text-black hover:bg-[#E6C97A]/90' : 'bg-gradient-to-r from-amber-500 via-[#D4AF37] to-[#e8d5b0] hover:from-amber-400 hover:to-amber-500 text-neutral-950'}`}
                                >
                                    {submittingObsidian ? 'Submitting Request...' : 'Send Access Request'} <ArrowRight size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Benefits Comparison Table */}
            <div className='max-w-5xl mx-auto'>
                <div className='text-center mb-16'>
                    <h2 className={`text-3xl font-serif font-black uppercase tracking-tighter ${isObsidian ? 'text-white' : 'text-[#5A4035]'}`}>Plan Comparison Table</h2>
                    <div className={`w-20 h-1.5 mx-auto mt-4 rounded-full animate-pulse ${isObsidian ? 'bg-[#E6C97A]' : 'bg-[#D4AF37]'}`} />
                    <p className={`text-xs font-bold uppercase tracking-widest mt-3 ${isObsidian ? 'text-neutral-400' : 'text-[#5A4035]/60'}`}>Detailed comparison of emergency and wellness benefits</p>
                </div>

                <div className={`rounded-[2.5rem] shadow-2xl border overflow-hidden ${isObsidian ? 'bg-[#0A0A0A] border-[#E6C97A]/15 text-white' : 'bg-white border-[#D4AF37]/10'}`}>
                    <div className='overflow-x-auto'>
                        <div className='min-w-[850px]'>
                            {/* Table Header */}
                            <div className={`grid grid-cols-5 p-8 font-black text-xs uppercase tracking-widest border-b ${isObsidian ? 'bg-[#121212] text-white border-[#E6C97A]/15' : 'bg-[#5A4035] text-[#f2e4c7] border-[#e8d5b0]/20'}`}>
                                <div className='col-span-1'>Service Feature</div>
                                <div className={isObsidian ? 'text-center text-neutral-400' : 'text-center text-slate-300'}>Non-Subscriber</div>
                                <div className={isObsidian ? 'text-center text-neutral-300' : 'text-center text-slate-100'}>Silver</div>
                                <div className={isObsidian ? 'text-center text-[#E6C97A]' : 'text-center text-[#D4AF37]'}>Gold</div>
                                <div className={isObsidian ? 'text-center text-[#E6C97A] flex items-center justify-center gap-1' : 'text-center text-[#D4AF37] flex items-center justify-center gap-1'}>
                                    <Sparkles className={`w-3.5 h-3.5 ${isObsidian ? 'text-[#E6C97A]' : 'text-[#D4AF37]'}`} /> Platinum
                                </div>
                            </div>

                            {/* Table Rows */}
                            {[
                                { title: 'Monthly Membership Charge', standard: '₹0 / mo', silver: '₹599 / mo', gold: '₹699 / mo', platinum: '₹999 / mo' },
                                { title: 'Emergency Booking Fee', standard: '₹100 / request', silver: 'FREE (₹0 Fee!)', gold: 'FREE (₹0 Fee!)', platinum: 'FREE (₹0 Fee!)' },
                                { title: 'Emergency Response Router', standard: 'Standard Queue', silver: 'Priority (5 min)', gold: 'Super-Priority (3 min)', platinum: 'VIP / Instant Lock-in' },
                                { title: 'Weekly Appointment Limit', standard: '1 Booking', silver: '3 Bookings', gold: '6 Bookings', platinum: 'Unlimited Access' },
                                { title: 'General Care Discount', standard: '0%', silver: '10% Discount', gold: '20% Discount', platinum: '30% Discount' },
                                { title: 'Free Video Consultations', standard: false, silver: false, gold: '1 / month Included', platinum: 'Unlimited Video Calls' },
                                { title: '24/7 Dedicated Support', standard: false, silver: false, gold: false, platinum: true },
                                { title: 'Caregiver Panel Seats', standard: false, silver: false, gold: false, platinum: true },
                            ].map((row, i) => (
                                <div key={i} className={`grid grid-cols-5 p-7 items-center border-b ${isObsidian ? 'border-zinc-900' : 'border-[#5A4035]/5'} ${i % 2 === 0 ? (isObsidian ? 'bg-[#101010]/30' : 'bg-[#f2e4c7]/5') : ''}`}>
                                    <div className={`text-sm font-bold ${isObsidian ? 'text-neutral-200' : 'text-[#5A4035]'}`}>{row.title}</div>
                                    <div className={`text-sm font-black text-center ${isObsidian ? 'text-neutral-400' : 'opacity-70 text-slate-500'}`}>
                                        {typeof row.standard === 'boolean' ? (row.standard ? <Check className={`inline ${isObsidian ? 'text-[#E6C97A]' : 'text-green-600'}`} size={18} strokeWidth={4} /> : <X className={`inline ${isObsidian ? 'text-neutral-600' : 'text-slate-300'}`} size={18} />) : row.standard}
                                    </div>
                                    <div className={`text-sm font-black text-center ${isObsidian ? 'text-neutral-300' : 'opacity-80 text-slate-600'}`}>
                                        {typeof row.silver === 'boolean' ? (row.silver ? <Check className={`inline ${isObsidian ? 'text-[#E6C97A]' : 'text-green-600'}`} size={18} strokeWidth={4} /> : <X className={`inline ${isObsidian ? 'text-neutral-600' : 'text-slate-300'}`} size={18} />) : row.silver}
                                    </div>
                                    <div className={`text-sm font-black text-center ${isObsidian ? 'text-neutral-200' : 'text-[#5a4035]'}`}>
                                        {typeof row.gold === 'boolean' ? (row.gold ? <Check className={`inline ${isObsidian ? 'text-[#E6C97A]' : 'text-green-600'}`} size={18} strokeWidth={4} /> : <X className={`inline ${isObsidian ? 'text-neutral-600' : 'text-slate-300'}`} size={18} />) : row.gold}
                                    </div>
                                    <div className={`text-sm font-black text-center py-2.5 rounded-2xl ${isObsidian ? 'text-[#E6C97A] bg-[#E6C97A]/5' : 'text-[#D4AF37] bg-[#5A4035]/5'}`}>
                                        {typeof row.platinum === 'boolean' ? (row.platinum ? <Check className={`inline ${isObsidian ? 'text-[#E6C97A]' : 'text-green-600'}`} size={18} strokeWidth={4} /> : <X className={`inline ${isObsidian ? 'text-neutral-600' : 'text-slate-300'}`} size={18} />) : row.platinum}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Detail Section */}
            <div className='max-w-6xl mx-auto mt-24 mb-16'>
                <div className='text-center mb-12'>
                    <h2 className={`text-3xl font-serif font-black uppercase tracking-tighter ${isObsidian ? 'text-white' : 'text-[#5A4035]'}`}>Features Spotlight</h2>
                    <div className={`w-20 h-1.5 mx-auto mt-4 rounded-full animate-pulse ${isObsidian ? 'bg-[#E6C97A]' : 'bg-[#D4AF37]'}`} />
                    <p className={`text-xs font-bold uppercase tracking-widest mt-3 ${isObsidian ? 'text-neutral-400' : 'text-[#5A4035]/60'}`}>A deep dive into the premium tools and benefits unlocked by your subscription</p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
                    {detailedFeatures.map((feat, idx) => (
                        <motion.div
                            key={feat.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            whileHover={{ y: -8 }}
                            className={`rounded-[2.5rem] p-8 border shadow-xl flex flex-col hover:shadow-2xl transition-all duration-300 relative overflow-hidden group ${isObsidian ? 'bg-[#0D0D0D] border-zinc-800 hover:border-[#E6C97A]/45' : 'bg-white border-[#e8d5b0]/30 hover:border-[#D4AF37]/45'}`}
                        >
                            {/* Accent line */}
                            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isObsidian ? 'from-[#E6C97A]/80 via-[#E6C97A] to-[#E6C97A]/80' : 'from-[#5A4035] via-[#D4AF37] to-[#5A4035]'}`} />

                            <div className='flex items-center justify-between mb-6'>
                                <div className={`p-4 rounded-2xl shadow-md transition-all duration-300 ${isObsidian ? 'bg-[#151515] text-[#E6C97A] group-hover:bg-[#E6C97A] group-hover:text-black' : 'bg-[#fdf8f0] text-[#5A4035] group-hover:bg-[#5A4035] group-hover:text-[#D4AF37]'}`}>
                                    {feat.icon}
                                </div>
                                <span className={`px-3.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${isObsidian ? (feat.badge === 'Platinum Exclusive' ? 'bg-purple-950/40 text-purple-400 border-purple-900/30' : feat.badge === 'All Subscribers' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' : 'bg-amber-950/40 text-[#E6C97A] border-[#E6C97A]/30') : feat.badgeBg}`}>
                                    {feat.badge}
                                </span>
                            </div>

                            <h3 className={`text-xl font-black mb-3 transition-colors duration-300 ${isObsidian ? 'text-white group-hover:text-[#E6C97A]' : 'text-[#5A4035] group-hover:text-[#D4AF37]'}`}>{feat.title}</h3>
                            <p className={`text-sm font-bold mb-4 leading-relaxed ${isObsidian ? 'text-neutral-400' : 'text-[#5A4035]/80'}`}>{feat.description}</p>

                            <div className={`mt-auto pt-6 border-t border-dashed ${isObsidian ? 'border-zinc-800' : 'border-[#5A4035]/15'} space-y-4`}>
                                <div>
                                    <h4 className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isObsidian ? 'text-[#E6C97A]/85' : 'text-[#D4AF37]'}`}>How it works</h4>
                                    <p className={`text-xs leading-relaxed font-medium ${isObsidian ? 'text-neutral-400' : 'text-[#5A4035]/70'}`}>{feat.details}</p>
                                </div>
                                <div>
                                    <h4 className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isObsidian ? 'text-neutral-200' : 'text-[#5A4035]'}`}>Why it matters</h4>
                                    <p className={`text-xs italic leading-relaxed font-medium ${isObsidian ? 'text-neutral-500' : 'text-[#5A4035]/60'}`}>"{feat.benefit}"</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Payment Modal */}
            <AnimatePresence>
                {paymentModal && (
                    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md ${isObsidian ? 'bg-black/80' : 'bg-[#5A4035]/90'}`}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`rounded-[3rem] p-12 max-w-md w-full border ${isObsidian ? 'bg-[#0E0E0E] border-[#E6C97A]/25 text-white shadow-[0_0_80px_rgba(0,0,0,0.8)]' : 'bg-[#f2e4c7] border-[#D4AF37]/30 text-[#5A4035] shadow-[0_0_100px_rgba(212,175,55,0.2)]'}`}
                        >
                            <div className='text-center mb-10'>
                                <div className={`inline-block p-4 rounded-3xl mb-6 ${isObsidian ? 'bg-[#E6C97A]/10 text-[#E6C97A]' : 'bg-[#5A4035] text-[#D4AF37]'}`}>
                                    <ShieldCheck size={40} />
                                </div>
                                <h2 className='text-3xl font-serif font-black mb-2'>Payment Portal</h2>
                                <p className='font-bold opacity-60 uppercase text-[0.65rem] tracking-[0.25em]'>Tier: {selectedPlan}</p>
                            </div>

                            <div className='space-y-4'>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={processWalletPayment}
                                    className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 border-transparent transition-all group shadow-xl ${isObsidian ? 'bg-[#151515] text-white hover:border-[#E6C97A]' : 'bg-white text-[#5A4035] hover:border-[#D4AF37]'}`}
                                >
                                    <div className='flex items-center gap-5'>
                                        <div className={`p-3 rounded-2xl ${isObsidian ? 'bg-[#E6C97A]/10 text-[#E6C97A]' : 'bg-[#5A4035] text-[#D4AF37]'}`}>
                                            <Wallet size={24} />
                                        </div>
                                        <div className='text-left'>
                                            <div className='font-black text-sm uppercase'>Paw Wallet</div>
                                            <div className='text-[0.65rem] font-bold opacity-60'>Available: ₹{userdata?.pawWallet || 0}</div>
                                        </div>
                                    </div>
                                    <ArrowRight size={20} className='opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all' />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={processRazorpayPayment}
                                    className={`w-full flex items-center justify-between p-6 rounded-3xl shadow-xl group ${isObsidian ? 'bg-[#E6C97A] text-black' : 'bg-[#5A4035] text-[#f2e4c7]'}`}
                                >
                                    <div className='flex items-center gap-5'>
                                        <div className={`p-3 rounded-2xl ${isObsidian ? 'bg-black text-[#E6C97A]' : 'bg-[#D4AF37] text-[#5A4035]'}`}>
                                            <CreditCard size={24} />
                                        </div>
                                        <div className='text-left'>
                                            <div className='font-black text-sm uppercase'>Razorpay Secure</div>
                                            <div className={`text-[0.65rem] font-bold opacity-45 italic ${isObsidian ? 'text-black/60' : 'text-white/40'}`}>Cards, UPI, Netbanking</div>
                                        </div>
                                    </div>
                                    <ArrowRight size={20} className='opacity-100 group-hover:translate-x-1 transition-all' />
                                </motion.button>
                            </div>

                            <button
                                onClick={() => setPaymentModal(false)}
                                className='w-full mt-10 text-xs font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity text-current'
                            >
                                ← Cancel Transaction
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Subscription;
