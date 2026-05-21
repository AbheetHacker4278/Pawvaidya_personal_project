import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { assets } from '../assets/assets_frontend/assets';
import { toast } from 'react-toastify';
import { Crown, Sparkles, Shield, Zap, Check, X, CreditCard, Wallet, Calendar, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

const Subscription = () => {
    const {
        backendurl,
        token,
        userdata,
        getSubscriptionPlans,
        subscribeViaWallet,
        createRazorpaySubscription,
        verifySubscriptionPayment
    } = useContext(AppContext);
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

    const getTiers = () => {
        const standardPrice = 0;
        const silverPrice = plans?.Silver?.price || 199;
        const goldPrice = plans?.Gold?.price || 399;
        const platinumPrice = plans?.Platinum?.price || 799;

        const isNoneActive = !userdata?.subscription?.plan || userdata?.subscription?.plan === 'None' || userdata?.subscription?.status !== 'Active';

        return [
            {
                name: 'Non-Subscriber',
                price: standardPrice,
                limit: '1 Booking / Week',
                discount: 'No Care Discount',
                savings: 'Standard Charges Apply',
                icon: <Shield className="w-8 h-8 text-slate-400" />,
                color: '#94a3b8',
                isActive: isNoneActive,
                validity: 'Lifetime Access',
                bgClass: 'bg-white text-[#3d2b1f]',
                borderClass: 'border-slate-200',
                btnClass: 'bg-slate-100 text-slate-400 cursor-not-allowed',
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
                icon: <Shield className="w-8 h-8" />,
                color: colors.silver,
                isActive: userdata?.subscription?.plan === 'Silver' && userdata?.subscription?.status === 'Active',
                validity: '30 Days Duration',
                bgClass: 'bg-gradient-to-b from-slate-50 to-white text-[#3d2b1f]',
                borderClass: 'border-slate-200',
                btnClass: 'bg-slate-700 hover:bg-slate-800 text-white',
                features: plans?.Silver?.features || [
                    'FREE Emergency Bookings (₹0 Fee!)',
                    'Priority district-wise routing',
                    '10% Discount on general care',
                    '3 general appointments / week'
                ]
            },
            {
                name: 'Gold',
                price: goldPrice,
                limit: '6 Bookings / Week',
                discount: '20% Care Discount',
                savings: 'Saves up to ₹1,500 / mo!',
                icon: <Crown className="w-10 h-10" />,
                color: colors.accent,
                isActive: userdata?.subscription?.plan === 'Gold' && userdata?.subscription?.status === 'Active',
                validity: '30 Days Duration',
                featured: true,
                bgClass: 'bg-gradient-to-b from-[#5A4035] to-[#3d2b1f] text-[#f2e4c7]',
                borderClass: 'border-[#D4AF37]',
                btnClass: 'bg-[#D4AF37] hover:bg-[#B8972F] text-[#5A4035]',
                features: plans?.Gold?.features || [
                    'FREE Emergency Bookings (₹0 Fee!)',
                    'Super-Priority routing (3 min)',
                    '20% Discount on general care',
                    '1 FREE Video Consultation / month'
                ]
            },
            {
                name: 'Platinum',
                price: platinumPrice,
                limit: 'Unlimited Bookings',
                discount: '30% Care Discount',
                savings: 'Saves up to ₹3,000+ / mo!',
                icon: <Sparkles className="w-8 h-8" />,
                color: colors.platinum,
                isActive: userdata?.subscription?.plan === 'Platinum' && userdata?.subscription?.status === 'Active',
                validity: '30 Days Duration',
                bgClass: 'bg-gradient-to-b from-slate-900 to-black text-white',
                borderClass: 'border-slate-700',
                btnClass: 'bg-white hover:bg-slate-100 text-slate-900',
                features: plans?.Platinum?.features || [
                    'FREE Emergency Bookings (₹0 Fee!)',
                    'VIP Connection (Instant claim lock)',
                    '30% Discount on general care',
                    'Unlimited Video Consultations'
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
        <div className='min-h-screen bg-[#f2e4c7]/10 py-20 px-4 md:px-8'>
            {/* Header section */}
            <div className='max-w-5xl mx-auto mb-12 text-center'>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5A4035] text-[#D4AF37] font-bold text-xs mb-4 tracking-widest uppercase'
                >
                    <Sparkles size={14} /> Exclusive Membership Plans <Sparkles size={14} />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='text-3xl md:text-5xl font-serif font-black text-[#5A4035] mb-4 leading-tight'
                >
                    Elevate Your <br />
                    <span className='italic text-[#D4AF37]'>Pet's Care Experience</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className='text-base text-[#5A4035]/70 max-w-xl mx-auto font-medium'
                >
                    Designed for pet owners who demand nothing but the absolute best.
                    Choose a plan that fits your lifestyle.
                </motion.p>

                {usageInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='mt-8 inline-flex items-center gap-4 bg-white p-1.5 pl-5 rounded-full shadow-xl border border-[#D4AF37]/20'
                    >
                        <div className='flex items-center gap-2'>
                            <Zap size={16} className='text-[#D4AF37]' />
                            <span className='text-sm text-[#5A4035] font-bold'>Weekly Usage:</span>
                            <span className='text-xs text-[#5A4035]/70'>{usageInfo.count} / {usageInfo.limit} used</span>
                        </div>
                        <div className='bg-[#5A4035] text-white px-3 py-1.5 rounded-full font-bold text-xs'>
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
                        className={`relative rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-2xl transition-all duration-500 border-2 overflow-hidden group ${
                            tier.isActive 
                                ? 'border-[#D4AF37] ring-4 ring-[#D4AF37]/20 scale-[1.02] shadow-[0_0_50px_rgba(212,175,55,0.15)]' 
                                : `${tier.borderClass} hover:-translate-y-2`
                        } ${tier.bgClass}`}
                    >
                        {tier.featured && (
                            <div className='absolute top-0 right-0 bg-[#D4AF37] text-[#5A4035] font-black text-[0.65rem] tracking-widest uppercase px-12 py-3 rotate-45 translate-x-14 translate-y-3 shadow-lg'>
                                Most Loved
                            </div>
                        )}

                        {tier.isActive && (
                            <div className='absolute top-3 left-3 bg-green-500 text-white font-black text-[9px] tracking-widest uppercase px-3 py-1 rounded-full shadow-md animate-pulse z-10'>
                                Active Plan
                            </div>
                        )}

                        <div className={`p-4 rounded-3xl mb-6 ${tier.featured ? 'bg-[#D4AF37] text-[#5A4035]' : 'bg-[#5A4035] text-[#f2e4c7]'} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
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
                        <div className={`text-[10px] font-extrabold uppercase tracking-wider mb-6 px-3 py-1.5 rounded-full inline-block border shadow-sm ${
                            tier.name === 'Non-Subscriber'
                                ? 'bg-slate-50 text-slate-500 border-slate-200/50'
                                : 'bg-green-50/80 text-green-700 border-green-200/50'
                        }`}>
                            {tier.savings}
                        </div>

                        <div className='w-full space-y-4 mb-8 text-left'>
                            <div className={`p-4 rounded-2xl flex items-center justify-between font-black text-xs uppercase ${tier.featured ? 'bg-[#f2e4c7]/10 border border-[#f2e4c7]/20' : 'bg-slate-100 text-[#3d2b1f]'}`}>
                                <span className='opacity-60'>Weekly Limit</span>
                                <span>{tier.limit}</span>
                            </div>
                            <div className={`p-4 rounded-2xl flex items-center justify-between font-black text-xs uppercase ${tier.featured ? 'bg-[#f2e4c7]/10 border border-[#f2e4c7]/20' : 'bg-slate-100 text-[#3d2b1f]'}`}>
                                <span className='opacity-60'>Discount</span>
                                <span>{tier.discount}</span>
                            </div>
                            <div className='pt-4 space-y-3'>
                                {tier.features.slice(0, 4).map((f, i) => (
                                    <div key={i} className='flex items-start gap-2.5 text-xs font-semibold leading-tight'>
                                        <div className={`p-0.5 rounded-full mt-0.5 shrink-0 ${tier.featured ? 'bg-[#D4AF37] text-[#5A4035]' : 'bg-[#5A4035] text-white'}`}>
                                            <Check size={10} strokeWidth={4} />
                                        </div>
                                        <span>{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => handleSubscribe(tier.name)}
                            disabled={
                                tier.name === 'Non-Subscriber' ||
                                tier.isActive ||
                                userdata?.subscription?.plan === 'Platinum' ||
                                (userdata?.subscription?.plan === 'Gold' && tier.name === 'Silver')
                            }
                            className={`w-full py-4.5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all duration-300 active:scale-95 mt-auto ${tier.btnClass} ${
                                tier.name === 'Non-Subscriber' ||
                                tier.isActive ||
                                userdata?.subscription?.plan === 'Platinum' ||
                                (userdata?.subscription?.plan === 'Gold' && tier.name === 'Silver')
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:shadow-2xl hover:scale-[1.02]'
                            }`}
                        >
                            {tier.isActive
                                ? 'Active Plan'
                                : tier.name === 'Non-Subscriber'
                                    ? 'Standard Tier Active'
                                    : userdata?.subscription?.plan === 'Platinum'
                                        ? 'VIP Tier Active'
                                        : (userdata?.subscription?.plan === 'Silver' && (tier.name === 'Gold' || tier.name === 'Platinum')) ||
                                          (userdata?.subscription?.plan === 'Gold' && tier.name === 'Platinum')
                                            ? `Upgrade for ₹${tier.price - (plans?.[userdata?.subscription?.plan]?.price || 0)}`
                                            : `Select ${tier.name}`}
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Benefits Comparison Table */}
            <div className='max-w-5xl mx-auto'>
                <div className='text-center mb-16'>
                    <h2 className='text-3xl font-serif font-black text-[#5A4035] uppercase tracking-tighter'>Plan Comparison Table</h2>
                    <div className='w-20 h-1.5 bg-[#D4AF37] mx-auto mt-4 rounded-full animate-pulse' />
                    <p className='text-xs font-bold text-[#5A4035]/60 uppercase tracking-widest mt-3'>Detailed comparison of emergency and wellness benefits</p>
                </div>

                <div className='bg-white rounded-[2.5rem] shadow-2xl border border-[#D4AF37]/10 overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <div className='min-w-[850px]'>
                            {/* Table Header */}
                            <div className='grid grid-cols-5 p-8 bg-[#5A4035] text-[#f2e4c7] font-black text-xs uppercase tracking-widest border-b border-[#e8d5b0]/20'>
                                <div className='col-span-1'>Service Feature</div>
                                <div className='text-center text-slate-300'>Non-Subscriber</div>
                                <div className='text-center text-slate-100'>Silver</div>
                                <div className='text-center text-[#D4AF37]'>Gold</div>
                                <div className='text-center text-[#D4AF37] flex items-center justify-center gap-1'>
                                    <Sparkles className='w-3.5 h-3.5 text-[#D4AF37]' /> Platinum
                                </div>
                            </div>

                            {/* Table Rows */}
                            {[
                                { title: 'Monthly Membership Charge', standard: '₹0 / mo', silver: '₹199 / mo', gold: '₹399 / mo', platinum: '₹799 / mo' },
                                { title: 'Emergency Booking Fee', standard: '₹100 / request', silver: 'FREE (₹0 Fee!)', gold: 'FREE (₹0 Fee!)', platinum: 'FREE (₹0 Fee!)' },
                                { title: 'Emergency Response Router', standard: 'Standard Queue', silver: 'Priority (5 min)', gold: 'Super-Priority (3 min)', platinum: 'VIP / Instant Lock-in' },
                                { title: 'Weekly Appointment Limit', standard: '1 Booking', silver: '3 Bookings', gold: '6 Bookings', platinum: 'Unlimited Access' },
                                { title: 'General Care Discount', standard: '0%', silver: '10% Discount', gold: '20% Discount', platinum: '30% Discount' },
                                { title: 'Free Video Consultations', standard: false, silver: false, gold: '1 / month Included', platinum: 'Unlimited Video Calls' },
                                { title: '24/7 Dedicated Support', standard: false, silver: false, gold: false, platinum: true },
                                { title: 'Caregiver Panel Seats', standard: false, silver: false, gold: false, platinum: true },
                            ].map((row, i) => (
                                <div key={i} className={`grid grid-cols-5 p-7 items-center border-b border-[#5A4035]/5 ${i % 2 === 0 ? 'bg-[#f2e4c7]/5' : ''}`}>
                                    <div className='text-sm font-bold text-[#5A4035]'>{row.title}</div>
                                    <div className='text-sm font-black text-center opacity-70 text-slate-500'>
                                        {typeof row.standard === 'boolean' ? (row.standard ? <Check className='inline text-green-600' size={18} strokeWidth={4} /> : <X className='inline text-slate-300' size={18} />) : row.standard}
                                    </div>
                                    <div className='text-sm font-black text-center opacity-80 text-slate-600'>
                                        {typeof row.silver === 'boolean' ? (row.silver ? <Check className='inline text-green-600' size={18} strokeWidth={4} /> : <X className='inline text-slate-300' size={18} />) : row.silver}
                                    </div>
                                    <div className='text-sm font-black text-center text-[#5a4035]'>
                                        {typeof row.gold === 'boolean' ? (row.gold ? <Check className='inline text-green-600' size={18} strokeWidth={4} /> : <X className='inline text-slate-300' size={18} />) : row.gold}
                                    </div>
                                    <div className='text-sm font-black text-center text-[#D4AF37] bg-[#5A4035]/5 py-2.5 rounded-2xl'>
                                        {typeof row.platinum === 'boolean' ? (row.platinum ? <Check className='inline text-green-600' size={18} strokeWidth={4} /> : <X className='inline text-slate-300' size={18} />) : row.platinum}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <AnimatePresence>
                {paymentModal && (
                    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#5A4035]/90 backdrop-blur-md'>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-[#f2e4c7] rounded-[3rem] shadow-[0_0_100px_rgba(212,175,55,0.2)] p-12 max-w-md w-full border border-[#D4AF37]/30 text-[#5A4035]'
                        >
                            <div className='text-center mb-10'>
                                <div className='inline-block p-4 bg-[#5A4035] text-[#D4AF37] rounded-3xl mb-6'>
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
                                    className='w-full flex items-center justify-between p-6 rounded-3xl bg-white border-2 border-transparent hover:border-[#D4AF37] transition-all group shadow-xl'
                                >
                                    <div className='flex items-center gap-5'>
                                        <div className='p-3 bg-[#5A4035] text-[#D4AF37] rounded-2xl'>
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
                                    className='w-full flex items-center justify-between p-6 rounded-3xl bg-[#5A4035] text-[#f2e4c7] shadow-xl group'
                                >
                                    <div className='flex items-center gap-5'>
                                        <div className='p-3 bg-[#D4AF37] text-[#5A4035] rounded-2xl'>
                                            <CreditCard size={24} />
                                        </div>
                                        <div className='text-left'>
                                            <div className='font-black text-sm uppercase'>Razorpay Secure</div>
                                            <div className='text-[0.65rem] font-bold opacity-40 italic'>Cards, UPI, Netbanking</div>
                                        </div>
                                    </div>
                                    <ArrowRight size={20} className='opacity-100 group-hover:translate-x-1 transition-all' />
                                </motion.button>
                            </div>

                            <button
                                onClick={() => setPaymentModal(false)}
                                className='w-full mt-10 text-xs font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity'
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
