import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Wallet, Activity, ArrowUpRight, ArrowDownRight, Info, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';

// Brand palette
const B = {
    dark: '#3d2b1f',
    mid: '#5A4035',
    light: '#7a5a48',
    cream: '#f2e4c7',
    sand: '#e8d5b0',
    amber: '#c8860a',
    pale: '#fdf8f0',
};

const PawWallet = () => {
    const { userdata, loadUserProfileData, backendurl, token } = useContext(AppContext);
    const { t } = useTranslation();
    const [showTopupModal, setShowTopupModal] = useState(false);
    const [topupAmount, setTopupAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!document.getElementById('razorpay-js')) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.id = 'razorpay-js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const initPay = (order, razorpayKeyId) => {
        const options = {
            key: razorpayKeyId,
            amount: order.amount,
            currency: order.currency,
            name: "PawVaidya",
            description: "Wallet Top-Up",
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {
                try {
                    const { data } = await axios.post(
                        backendurl + '/api/user/wallet/verify-topup',
                        {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            userId: userdata._id
                        },
                        { headers: { token } }
                    );

                    if (data.success) {
                        toast.success(data.message);
                        loadUserProfileData();
                        setShowTopupModal(false);
                        setTopupAmount('');
                    } else {
                        toast.error(data.message);
                    }
                } catch (error) {
                    toast.error(error.message);
                }
            },
            theme: {
                color: B.amber
            }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    const handleTopup = async (e) => {
        e.preventDefault();
        const amt = Number(topupAmount);
        if (amt < 100) {
            toast.error("Minimum top-up amount is ₹100");
            return;
        }

        setIsProcessing(true);
        try {
            const { data } = await axios.post(
                backendurl + '/api/user/wallet/topup-order',
                { amount: amt },
                { headers: { token } }
            );

            if (data.success) {
                initPay(data.order, data.razorpayKeyId);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const balance = userdata?.pawWallet || 0;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen" style={{ color: B.dark }}>

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <span className="p-2 rounded-xl" style={{ backgroundColor: B.cream }}>
                            <Wallet className="w-8 h-8" style={{ color: B.amber }} />
                        </span>
                        Paw Wallet
                    </h1>
                    <p className="mt-2 text-[15px]" style={{ color: B.light }}>
                        Manage your refunds and wallet balance.
                    </p>
                </div>
            </div>

            {/* Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl p-8 relative overflow-hidden shadow-lg border"
                style={{
                    background: `linear-gradient(135deg, ${B.dark}, ${B.mid})`,
                    borderColor: B.sand
                }}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-white text-center md:text-left">
                        <p className="text-lg opacity-80 mb-1">Available Balance</p>
                        <h2 className="text-5xl font-black tracking-tight" style={{ color: B.cream }}>
                            ₹{balance.toLocaleString('en-IN')}
                        </h2>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowTopupModal(true)}
                            className="bg-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-md"
                            style={{ color: B.dark }}
                        >
                            <Plus className="w-5 h-5" />
                            Top Up
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Info Notice */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6 p-4 rounded-xl flex items-start gap-3 border"
                style={{ backgroundColor: B.pale, borderColor: B.cream }}
            >
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: B.amber }} />
                <div>
                    <h4 className="font-semibold text-[15px]">Refund Policy</h4>
                    <p className="text-[14px] mt-1" style={{ color: B.light }}>
                        If a scheduled appointment is cancelled by a doctor or admin, the paid amount is automatically refunded here. You can use your wallet balance towards future bookings. Note: Self-cancelled appointments are not eligible for a refund.
                    </p>
                </div>
            </motion.div>

            {/* Top-up Modal */}
            <AnimatePresence>
                {showTopupModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
                            style={{ color: B.dark }}
                        >
                            <h3 className="text-xl font-bold border-b pb-3 mb-4">Top Up Paw Wallet</h3>
                            <form onSubmit={handleTopup}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1" style={{ color: B.light }}>Enter Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="100"
                                        required
                                        value={topupAmount}
                                        onChange={(e) => setTopupAmount(e.target.value)}
                                        placeholder="Min ₹100"
                                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                                        style={{ borderColor: B.sand, outlineColor: B.amber }}
                                    />
                                    <div className="flex gap-2 mt-3 cursor-pointer select-none">
                                        {[100, 500, 1000, 2000].map(amt => (
                                            <span
                                                key={amt}
                                                onClick={() => setTopupAmount(amt)}
                                                className="px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-opacity-20 transition-colors"
                                                style={{ borderColor: B.sand, backgroundColor: topupAmount == amt ? B.sand : 'transparent' }}
                                            >
                                                + ₹{amt}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end mt-6">
                                    <button
                                        type="button"
                                        onClick={() => { setShowTopupModal(false); setTopupAmount(''); }}
                                        className="px-4 py-2 rounded-xl font-medium border"
                                        style={{ borderColor: B.sand, color: B.light }}
                                        disabled={isProcessing}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-xl font-semibold text-white flex items-center gap-2 transition-all hover:bg-opacity-90"
                                        style={{ backgroundColor: B.amber }}
                                        disabled={isProcessing || !topupAmount || topupAmount < 100}
                                    >
                                        {isProcessing ? 'Processing...' : 'Proceed to Pay'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div >
    );
};

export default PawWallet;
