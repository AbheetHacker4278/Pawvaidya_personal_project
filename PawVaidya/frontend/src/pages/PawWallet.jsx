import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Wallet, Activity, ArrowUpRight, ArrowDownRight, Info, Plus, Heart, Calendar, CreditCard, Trash2, Lock, ShieldCheck, X } from 'lucide-react';
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
    const [myCampaigns, setMyCampaigns] = useState([]);

    // Card management state
    const [savedCards, setSavedCards] = useState([]);
    const [showAddCardModal, setShowAddCardModal] = useState(false);
    const [newCardNumber, setNewCardNumber] = useState('');
    const [newCardHolder, setNewCardHolder] = useState('');
    const [newExpiryMonth, setNewExpiryMonth] = useState('');
    const [newExpiryYear, setNewExpiryYear] = useState('');
    const [savingCard, setSavingCard] = useState(false);

    // Saved Card Selection in Topup Modal
    const [payWithSaved, setPayWithSaved] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState('');
    const [cvv, setCvv] = useState('');

    useEffect(() => {
        if (!document.getElementById('razorpay-js')) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.id = 'razorpay-js';
            script.async = true;
            document.body.appendChild(script);
        }
        if (token && userdata) {
            fetchMyCampaigns();
            fetchSavedCards();
        }
    }, [token, userdata]);

    const fetchSavedCards = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/cards/list`, {
                headers: { token }
            });
            if (data.success) {
                setSavedCards(data.cards || []);
                if (data.cards?.length > 0) {
                    setSelectedCardId(data.cards[0]._id);
                }
            }
        } catch (err) {
            console.error("Error fetching saved cards:", err);
        }
    };

    const validateLuhn = (num) => {
        const clean = num.replace(/\D/g, '');
        if (!clean || clean.length < 13 || clean.length > 19) return false;
        let sum = 0;
        const isEven = clean.length % 2 === 0;
        for (let i = 0; i < clean.length; i++) {
            let digit = parseInt(clean[i], 10);
            if ((i % 2 === 0) === isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit = Math.floor(digit / 10) + (digit % 10);
                }
            }
            sum += digit;
        }
        return sum % 10 === 0;
    };

    const getCardTypeFromNum = (num) => {
        const clean = num.replace(/\D/g, '');
        if (clean.startsWith('4')) return 'Visa';
        if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(clean)) return 'Mastercard';
        if (/^(34|37)/.test(clean)) return 'American Express';
        if (/^65/.test(clean) || /^6011/.test(clean) || /^(64[4-9])/.test(clean) || /^(622126|622925)/.test(clean)) return 'Discover';
        if (/^(30[0-5]|36|38|39)/.test(clean)) return 'Diners Club';
        if (/^(352[89]|35[3-8][0-9])/.test(clean)) return 'JCB';
        if (/^(5018|5020|5038|6304|6759|6761|6763)/.test(clean)) return 'Switch/Solo';
        if (/^(5019)/.test(clean)) return 'Dankort';
        if (/^(508|60|65|81|82)/.test(clean)) return 'RuPay';
        return '';
    };

    const getCardGradient = (cardType) => {
        const brand = (cardType || '').toLowerCase();
        if (brand.includes('visa')) return 'linear-gradient(135deg, #1e3a8a, #3b82f6)';
        if (brand.includes('mastercard')) return 'linear-gradient(135deg, #2e1065, #7c3aed)';
        if (brand.includes('rupay')) return 'linear-gradient(135deg, #064e3b, #10b981)';
        if (brand.includes('amex') || brand.includes('american express')) return 'linear-gradient(135deg, #78350f, #f59e0b)';
        if (brand.includes('discover')) return 'linear-gradient(135deg, #c2410c, #ea580c)';
        if (brand.includes('diners')) return 'linear-gradient(135deg, #0369a1, #0284c7)';
        if (brand.includes('jcb')) return 'linear-gradient(135deg, #be185d, #db2777)';
        if (brand.includes('switch') || brand.includes('solo')) return 'linear-gradient(135deg, #4f46e5, #6366f1)';
        if (brand.includes('dankort')) return 'linear-gradient(135deg, #b91c1c, #dc2626)';
        return 'linear-gradient(135deg, #1e293b, #0f172a)'; // default dark
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const parts = [];
        for (let i = 0, len = v.length; i < len; i += 4) {
            parts.push(v.substring(i, i + 4));
        }
        return parts.length > 0 ? parts.join(' ') : v;
    };

    const handleSaveCard = async (e) => {
        e.preventDefault();
        if (!newCardNumber || !newCardHolder || !newExpiryMonth || !newExpiryYear) {
            toast.error("Please fill all card details");
            return;
        }

        if (!validateLuhn(newCardNumber)) {
            toast.error("Invalid card number. Please check and try again.");
            return;
        }

        setSavingCard(true);
        try {
            const { data } = await axios.post(`${backendurl}/api/cards/save`, {
                cardNumber: newCardNumber,
                cardHolderName: newCardHolder,
                expiryMonth: Number(newExpiryMonth),
                expiryYear: Number(newExpiryYear)
            }, {
                headers: { token }
            });

            if (data.success) {
                toast.success(data.message);
                setShowAddCardModal(false);
                setNewCardNumber('');
                setNewCardHolder('');
                setNewExpiryMonth('');
                setNewExpiryYear('');
                fetchSavedCards();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSavingCard(false);
        }
    };

    const handleDeleteCard = async (cardId) => {
        if (!window.confirm("Are you sure you want to delete this saved card?")) return;
        try {
            const { data } = await axios.delete(`${backendurl}/api/cards/delete/${cardId}`, {
                headers: { token }
            });
            if (data.success) {
                toast.success(data.message);
                fetchSavedCards();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleSavedCardTopup = async (e) => {
        e.preventDefault();
        const amt = Number(topupAmount);
        if (amt < 100) {
            toast.error("Minimum top-up amount is ₹100");
            return;
        }
        if (!selectedCardId) {
            toast.error("Please select a saved card");
            return;
        }
        if (!cvv || !/^\d{3,4}$/.test(cvv)) {
            toast.error("Please enter a valid 3 or 4 digit CVV");
            return;
        }

        setIsProcessing(true);
        try {
            const { data } = await axios.post(`${backendurl}/api/cards/topup-saved`, {
                cardId: selectedCardId,
                cvv,
                amount: amt
            }, {
                headers: { token }
            });

            if (data.success) {
                toast.success(data.message);
                loadUserProfileData();
                setShowTopupModal(false);
                setTopupAmount('');
                setCvv('');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const fetchMyCampaigns = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/stray-crowdfunding/my-campaigns`, {
                headers: { token }
            });
            if (data.success) {
                setMyCampaigns(data.campaigns || []);
            }
        } catch (err) {
            console.error("Error fetching campaigns for wallet:", err);
        }
    };

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
    const campaignWalletBalance = myCampaigns
        .filter(camp => camp.status === 'Active')
        .reduce((sum, camp) => sum + (camp.raisedAmount || 0), 0);


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

            {/* Wallets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Balance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl p-8 relative overflow-hidden shadow-lg border flex flex-col justify-between"
                    style={{
                        background: `linear-gradient(135deg, ${B.dark}, ${B.mid})`,
                        borderColor: B.sand
                    }}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

                    <div className="relative z-10">
                        <span className="text-xs uppercase font-black text-amber-300 tracking-wider">Personal Wallet</span>
                        <div className="text-white mt-4">
                            <p className="text-sm opacity-80 mb-1">Available Balance</p>
                            <h2 className="text-4xl font-black tracking-tight" style={{ color: B.cream }}>
                                ₹{balance.toLocaleString('en-IN')}
                            </h2>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => setShowTopupModal(true)}
                            className="bg-white px-5 py-2 rounded-xl font-semibold flex items-center gap-1.5 hover:bg-opacity-90 transition-all shadow-md text-xs"
                            style={{ color: B.dark }}
                        >
                            <Plus className="w-4 h-4" />
                            Top Up
                        </button>
                    </div>
                </motion.div>

                {/* Campaign Wallet Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-3xl p-8 relative overflow-hidden shadow-lg border flex flex-col justify-between"
                    style={{
                        background: 'linear-gradient(135deg, #0f5132, #146c43)',
                        borderColor: '#a3cfbb'
                    }}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

                    <div className="relative z-10">
                        <span className="text-xs uppercase font-black text-emerald-200 tracking-wider">Campaign Wallet</span>
                        <div className="text-white mt-4">
                            <p className="text-sm opacity-80 mb-1">Collected Rescue Funds</p>
                            <h2 className="text-4xl font-black tracking-tight text-white">
                                ₹{campaignWalletBalance.toLocaleString('en-IN')}
                            </h2>
                        </div>
                    </div>

                    <div className="mt-6">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-100 font-bold bg-emerald-800/40 px-2.5 py-1 rounded-lg">
                            <Heart size={10} className="fill-emerald-100" /> Dedicated Clinic Release Only
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Saved Cards Section */}
            <div className="mb-8 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-black flex items-center gap-2" style={{ color: B.dark }}>
                        <CreditCard className="w-5 h-5 text-amber-600" />
                        Saved Cards
                    </h3>
                    <button
                        onClick={() => setShowAddCardModal(true)}
                        className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-600 hover:text-amber-700 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Save New Card
                    </button>
                </div>

                {savedCards.length === 0 ? (
                    <div className="border border-dashed rounded-2xl p-6 text-center text-slate-400 font-semibold text-xs">
                        No saved cards. Add a card for instant wallet recharges.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {savedCards.map(card => {
                            const cardGradient = getCardGradient(card.cardType);

                            return (
                                <motion.div
                                    key={card._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-5 rounded-2xl text-white relative overflow-hidden flex flex-col justify-between h-40 shadow border border-white/10"
                                    style={{ background: cardGradient }}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                    <div className="flex justify-between items-start z-10">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{card.cardType}</p>
                                            <p className="text-xs font-semibold mt-1 opacity-90">{card.cardHolderName}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCard(card._id)}
                                            className="p-1.5 bg-white/10 hover:bg-rose-600/20 hover:text-rose-400 rounded-lg transition-all text-white/80"
                                            title="Delete Card"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="z-10">
                                        <p className="text-lg font-black tracking-widest">{card.cardNumber}</p>
                                        <div className="flex justify-between items-center mt-2 opacity-80 text-[10px] font-bold">
                                            <span>EXPIRES</span>
                                            <span>{String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Info Notice */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-5 rounded-2xl flex flex-col gap-4 border"
                style={{ backgroundColor: B.pale, borderColor: B.sand }}
            >
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: B.amber }} />
                    <div>
                        <h4 className="font-bold text-[15px]">Refund & Wallet Policy</h4>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: B.light }}>
                            If a scheduled appointment is cancelled by a doctor or admin, the paid amount is automatically refunded here. You can use your personal wallet balance towards future bookings. Note: Self-cancelled appointments are not eligible for a refund.
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3 border-t pt-4" style={{ borderColor: B.sand }}>
                    <Heart className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                    <div>
                        <h4 className="font-bold text-[15px] text-emerald-800">Campaign Wallet Policy</h4>
                        <p className="text-xs mt-1 leading-relaxed text-emerald-950">
                            Funds collected from stray animal crowdfunding campaigns are locked and sent directly to partner veterinary clinics upon uploading valid treatment invoices as proof. <strong>These funds cannot be used for appointment bookings, subscription purchases, or any personal transactions.</strong>
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* My Campaign Contributions list */}
            {myCampaigns.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2" style={{ color: B.dark }}>
                        <Activity size={18} /> My Initiated Campaigns ({myCampaigns.length})
                    </h3>
                    <div className="space-y-3">
                        {myCampaigns.map(camp => (
                            <div key={camp._id} className="p-4 bg-white border rounded-2xl flex justify-between items-center text-xs">
                                <div>
                                    <strong className="text-sm block" style={{ color: B.dark }}>{camp.title}</strong>
                                    <span className="text-[10px] text-gray-400 block mt-1">
                                        End Date: {camp.endDate ? new Date(camp.endDate).toLocaleDateString() : 'N/A'} • Partner Vet: {camp.clinicName}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="font-black text-emerald-600 block text-sm">₹{camp.raisedAmount} / ₹{camp.targetAmount}</span>
                                    <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded mt-1 ${
                                        camp.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                        camp.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                                        'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                        {camp.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                            <form onSubmit={payWithSaved ? handleSavedCardTopup : handleTopup}>
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

                                {/* Option to pay via Saved Cards */}
                                {savedCards.length > 0 && (
                                    <div className="mb-4 border-t pt-4">
                                        <label className="block text-xs font-bold text-slate-500 mb-2">PAYMENT METHOD</label>
                                        <div className="flex gap-2 mb-4">
                                            <button
                                                type="button"
                                                onClick={() => setPayWithSaved(false)}
                                                className={`flex-1 py-2 px-3 border rounded-xl text-xs font-black uppercase transition-all ${!payWithSaved ? 'bg-amber-600 border-amber-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                                            >
                                                New Card / Razorpay
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPayWithSaved(true)}
                                                className={`flex-1 py-2 px-3 border rounded-xl text-xs font-black uppercase transition-all ${payWithSaved ? 'bg-amber-600 border-amber-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                                            >
                                                Saved Card
                                            </button>
                                        </div>

                                        {payWithSaved && (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 mb-1">SELECT CARD</label>
                                                    <select
                                                        value={selectedCardId}
                                                        onChange={(e) => setSelectedCardId(e.target.value)}
                                                        className="w-full px-4 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50"
                                                    >
                                                        {savedCards.map(c => (
                                                            <option key={c._id} value={c._id}>
                                                                {c.cardType} ({c.cardNumber}) - {c.cardHolderName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 mb-1">ENTER CVV</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        maxLength="4"
                                                        value={cvv}
                                                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                                        placeholder="•••"
                                                        className="w-24 px-4 py-2 text-center text-sm font-bold tracking-widest rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => { setShowTopupModal(false); setTopupAmount(''); setCvv(''); }}
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
                                        disabled={isProcessing || !topupAmount || topupAmount < 100 || (payWithSaved && (!selectedCardId || cvv.length < 3))}
                                    >
                                        {isProcessing ? 'Processing...' : 'Proceed to Pay'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Card Modal */}
            <AnimatePresence>
                {showAddCardModal && (
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
                            <div className="flex justify-between items-center border-b pb-3 mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-amber-600" />
                                    Save Payment Card
                                </h3>
                                <button onClick={() => setShowAddCardModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Live card preview */}
                            <div
                                className="mb-6 p-5 rounded-2xl text-white relative overflow-hidden flex flex-col justify-between h-40 shadow-lg"
                                style={{
                                    background: newCardNumber ? getCardGradient(getCardTypeFromNum(newCardNumber)) : 'linear-gradient(135deg, #475569, #334155)'
                                }}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <div className="flex justify-between items-start z-10">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
                                            {getCardTypeFromNum(newCardNumber) || 'CARD BRAND'}
                                        </p>
                                        <p className="text-xs font-semibold mt-1 opacity-95 truncate max-w-[200px]">
                                            {newCardHolder || 'CARDHOLDER NAME'}
                                        </p>
                                    </div>
                                    <ShieldCheck className="w-5 h-5 opacity-80" />
                                </div>
                                <div className="z-10">
                                    <p className="text-lg font-black tracking-widest">
                                        {formatCardNumber(newCardNumber) || '•••• •••• •••• ••••'}
                                    </p>
                                    <div className="flex justify-between items-center mt-2 opacity-80 text-[10px] font-bold">
                                        <span>VALID THRU</span>
                                        <span>
                                            {newExpiryMonth ? String(newExpiryMonth).padStart(2, '0') : 'MM'} / {newExpiryYear ? String(newExpiryYear).slice(-2) : 'YY'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSaveCard} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">CARDHOLDER NAME</label>
                                    <input
                                        type="text"
                                        required
                                        value={newCardHolder}
                                        onChange={(e) => setNewCardHolder(e.target.value)}
                                        placeholder="e.g. John Doe"
                                        className="w-full px-4 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">CARD NUMBER</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength="23"
                                        value={formatCardNumber(newCardNumber)}
                                        onChange={(e) => setNewCardNumber(e.target.value.replace(/\s/g, ''))}
                                        placeholder="4111 2222 3333 4444"
                                        className="w-full px-4 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                                    />
                                    {newCardNumber && (
                                        <p className={`text-[10px] font-bold mt-1 ${validateLuhn(newCardNumber) ? 'text-emerald-600' : 'text-rose-500'}`}>
                                            {validateLuhn(newCardNumber) ? '✓ Luhn validation passed' : '✗ Invalid card number (Luhn check failed)'}
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">EXPIRY MONTH</label>
                                        <select
                                            required
                                            value={newExpiryMonth}
                                            onChange={(e) => setNewExpiryMonth(e.target.value)}
                                            className="w-full px-4 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        >
                                            <option value="">Month</option>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">EXPIRY YEAR</label>
                                        <select
                                            required
                                            value={newExpiryYear}
                                            onChange={(e) => setNewExpiryYear(e.target.value)}
                                            className="w-full px-4 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        >
                                            <option value="">Year</option>
                                            {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() + i).map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCardModal(false)}
                                        className="px-4 py-2 text-sm rounded-xl font-medium border"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingCard || !validateLuhn(newCardNumber)}
                                        className="px-6 py-2 text-sm rounded-xl font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-all"
                                    >
                                        {savingCard ? 'Saving...' : 'Save Card'}
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

