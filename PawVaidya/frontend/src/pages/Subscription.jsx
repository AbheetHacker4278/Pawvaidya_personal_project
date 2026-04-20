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
        if (!plans) return [];
        return [
            {
                name: 'Silver',
                price: plans.Silver.price,
                limit: '3 Bookings / Week',
                discount: '10% Discount',
                icon: <Shield className="w-8 h-8" />,
                color: colors.silver,
                bgClass: 'bg-slate-50',
                borderClass: 'border-slate-200',
                btnClass: 'bg-slate-700 hover:bg-slate-800 text-white',
                features: plans.Silver.features
            },
            {
                name: 'Gold',
                price: plans.Gold.price,
                limit: '6 Bookings / Week',
                discount: '20% Discount',
                icon: <Crown className="w-10 h-10" />,
                color: colors.accent,
                featured: true,
                bgClass: 'bg-[#5A4035] text-[#f2e4c7]',
                borderClass: 'border-[#D4AF37]',
                btnClass: 'bg-[#D4AF37] hover:bg-[#B8972F] text-[#5A4035]',
                features: plans.Gold.features
            },
            {
                name: 'Platinum',
                price: plans.Platinum.price,
                limit: 'Unlimited Bookings',
                discount: '30% Discount',
                icon: <Sparkles className="w-8 h-8" />,
                color: colors.platinum,
                bgClass: 'bg-slate-900 text-white',
                borderClass: 'border-slate-700',
                btnClass: 'bg-white hover:bg-slate-100 text-slate-900',
                features: plans.Platinum.features
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
            <div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-24'>
                {getTiers().map((tier, idx) => (
                    <motion.div
                        key={tier.name}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.15 }}
                        className={`relative rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 ${tier.borderClass} ${tier.bgClass} overflow-hidden group`}
                    >
                        {tier.featured && (
                            <div className='absolute top-0 right-0 bg-[#D4AF37] text-[#5A4035] font-black text-[0.65rem] tracking-widest uppercase px-12 py-3 rotate-45 translate-x-14 translate-y-3 shadow-lg'>
                                Most Loved
                            </div>
                        )}

                        <div className={`p-4 rounded-3xl mb-8 ${tier.featured ? 'bg-[#D4AF37] text-[#5A4035]' : 'bg-[#5A4035] text-[#f2e4c7]'} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            {tier.icon}
                        </div>

                        <h3 className='text-3xl font-black mb-1 uppercase tracking-tighter'>{tier.name}</h3>
                        <div className='text-sm font-bold opacity-60 mb-6 uppercase tracking-[0.2em]'>Wellness Tier</div>

                        <div className='flex items-baseline gap-1 mb-6'>
                            <span className='text-4xl font-black'>₹{tier.price}</span>
                            <span className='text-base opacity-60 font-medium'>/mo</span>
                        </div>

                        <div className='w-full space-y-4 mb-10 text-left'>
                            <div className={`p-4 rounded-2xl flex items-center justify-between font-black text-sm uppercase ${tier.featured ? 'bg-[#f2e4c7]/10 border border-[#f2e4c7]/20' : 'bg-slate-100 text-slate-900'}`}>
                                <span className='opacity-60'>Weekly Limit</span>
                                <span>{tier.limit}</span>
                            </div>
                            <div className={`p-4 rounded-2xl flex items-center justify-between font-black text-sm uppercase ${tier.featured ? 'bg-[#f2e4c7]/10 border border-[#f2e4c7]/20' : 'bg-slate-100 text-slate-900'}`}>
                                <span className='opacity-60'>Discount</span>
                                <span>{tier.discount}</span>
                            </div>
                            <div className='pt-4 space-y-3'>
                                {tier.features.slice(0, 4).map((f, i) => (
                                    <div key={i} className='flex items-center gap-3 text-sm font-medium'>
                                        <div className={`p-1 rounded-full ${tier.featured ? 'bg-[#D4AF37]' : 'bg-[#5A4035] text-white'}`}>
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        <span>{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => handleSubscribe(tier.name)}
                            disabled={
                                userdata?.subscription?.plan === tier.name ||
                                userdata?.subscription?.plan === 'Platinum' ||
                                (userdata?.subscription?.plan === 'Gold' && tier.name === 'Silver')
                            }
                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all duration-300 active:scale-95 mt-auto ${tier.btnClass} ${userdata?.subscription?.plan === tier.name ||
                                userdata?.subscription?.plan === 'Platinum' ||
                                (userdata?.subscription?.plan === 'Gold' && tier.name === 'Silver')
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:shadow-2xl'
                                }`}
                        >
                            {userdata?.subscription?.plan === tier.name
                                ? 'Current Status'
                                : userdata?.subscription?.plan === 'Platinum'
                                    ? 'Ultra Access Active'
                                    : (userdata?.subscription?.plan === 'Silver' && (tier.name === 'Gold' || tier.name === 'Platinum')) ||
                                        (userdata?.subscription?.plan === 'Gold' && tier.name === 'Platinum')
                                        ? `Upgrade for ₹${tier.price - (plans[userdata.subscription.plan]?.price || 0)}`
                                        : `Select ${tier.name}`}
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Benefits Comparison Table */}
            <div className='max-w-4xl mx-auto'>
                <div className='text-center mb-16'>
                    <h2 className='text-3xl font-serif font-black text-[#5A4035] uppercase tracking-tighter'>Why Go Premium?</h2>
                    <div className='w-20 h-1.5 bg-[#D4AF37] mx-auto mt-4 rounded-full' />
                </div>

                <div className='bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-[#D4AF37]/10'>
                    <div className='grid grid-cols-4 p-8 bg-[#5A4035] text-[#f2e4c7] font-black text-xs uppercase tracking-widest'>
                        <div className='col-span-1'>Service Feature</div>
                        <div className='text-center'>Silver</div>
                        <div className='text-center'>Gold</div>
                        <div className='text-center text-[#D4AF37]'>Platinum</div>
                    </div>

                    {[
                        { title: 'Weekly Appointments', silver: '3', gold: '6', platinum: 'Unlimited' },
                        { title: 'Care Discount', silver: '10%', gold: '20%', platinum: '30%' },
                        { title: 'Priority Booking', silver: true, gold: true, platinum: true },
                        { title: 'Free Video Consult', silver: false, gold: true, platinum: true },
                        { title: '24/7 Support', silver: false, gold: false, platinum: true },
                        { title: 'Caregiver Access', silver: false, gold: false, platinum: true },
                    ].map((row, i) => (
                        <div key={i} className={`grid grid-cols-4 p-7 items-center border-b border-[#5A4035]/5 ${i % 2 === 0 ? 'bg-[#f2e4c7]/5' : ''}`}>
                            <div className='text-sm font-bold text-[#5A4035]'>{row.title}</div>
                            <div className='text-sm font-black text-center opacity-70'>
                                {typeof row.silver === 'boolean' ? (row.silver ? <Check className='inline text-green-600' size={18} /> : <X className='inline text-slate-300' size={18} />) : row.silver}
                            </div>
                            <div className='text-sm font-black text-center opacity-70'>
                                {typeof row.gold === 'boolean' ? (row.gold ? <Check className='inline text-green-600' size={18} /> : <X className='inline text-slate-300' size={18} />) : row.gold}
                            </div>
                            <div className='text-sm font-black text-center text-[#D4AF37] bg-[#5A4035]/5 py-2 rounded-xl'>
                                {typeof row.platinum === 'boolean' ? (row.platinum ? <Check className='inline' size={18} /> : <X className='inline text-slate-300' size={18} />) : row.platinum}
                            </div>
                        </div>
                    ))}
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
