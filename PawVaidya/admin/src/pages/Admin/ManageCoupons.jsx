import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import {
    Ticket,
    Plus,
    Trash2,
    Power,
    Calendar,
    TrendingDown,
    Info,
    Search,
    Clock,
    UserCheck,
    AlertCircle,
    X,
    Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManageCoupons = () => {
    const { getAllCoupons, createCoupon, toggleCoupon, deleteCoupon } = useContext(AdminContext);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minAmount: '',
        maxDiscount: '',
        expiryDate: '',
        usageLimit: 0
    });

    const fetchCoupons = async () => {
        setLoading(true);
        const data = await getAllCoupons();
        setCoupons(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        const success = await createCoupon(formData);
        if (success) {
            setShowAddModal(false);
            setFormData({
                code: '',
                discountType: 'percentage',
                discountValue: '',
                minAmount: '',
                maxDiscount: '',
                expiryDate: '',
                usageLimit: 0
            });
            fetchCoupons();
        }
    };

    const handleToggle = async (id) => {
        const success = await toggleCoupon(id);
        if (success) fetchCoupons();
    };

    const handleDelete = async (id) => {
        const success = await deleteCoupon(id);
        if (success) fetchCoupons();
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isExpired = (expiry) => new Date(expiry) < new Date();

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Ticket className="w-8 h-8" style={{ color: '#10b981' }} />
                        Admin Discount Coupons
                    </h1>
                    <p className="text-gray-500 mt-1">Manage global discounts subsidized by admin commission</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    style={{ backgroundColor: '#10b981', color: 'white' }}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 font-bold"
                >
                    <Plus className="w-5 h-5" />
                    Create New Coupon
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between border border-gray-100">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span>These coupons deduct amount from admin income, not doctors.</span>
                </div>
            </div>

            {/* Coupons Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white h-48 rounded-2xl border border-gray-100 shadow-sm" />
                    ))}
                </div>
            ) : filteredCoupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                        <Ticket className="w-12 h-12 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">No Coupons Found</h3>
                    <p className="text-gray-400">Create your first subsidy-based coupon to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode='popLayout'>
                        {filteredCoupons.map((coupon) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                key={coupon._id}
                                className={`bg-white rounded-2xl border ${coupon.isActive ? 'border-gray-100' : 'border-red-100 opacity-75'} shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}
                            >
                                {/* Active/Inactive Badge */}
                                <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${coupon.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {coupon.isActive ? 'Active' : 'Inactive'}
                                </div>

                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                            <Ticket className="w-6 h-6 text-emerald-500" />
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-800 mb-1">{coupon.code}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-2xl font-black text-emerald-600">
                                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded uppercase">
                                            OFF
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span>Expiry: {new Date(coupon.expiryDate).toLocaleDateString()}</span>
                                            {isExpired(coupon.expiryDate) && (
                                                <span className="text-[10px] bg-red-50 text-red-500 px-1.5 rounded border border-red-100 font-bold uppercase">Expired</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <TrendingDown className="w-4 h-4 text-gray-400" />
                                            <span>Min. Booking: ₹{coupon.minAmount}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <UserCheck className="w-4 h-4 text-gray-400" />
                                            <span>Used: {coupon.usedCount} {coupon.usageLimit > 0 ? `/ ${coupon.usageLimit}` : '(Unlimited)'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <button
                                            onClick={() => handleToggle(coupon._id)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${coupon.isActive
                                                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                }`}
                                        >
                                            <Power className="w-4 h-4" />
                                            {coupon.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(coupon._id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Add Coupon Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden"
                        >
                            <div className="p-6 border-b flex items-center justify-between bg-emerald-50">
                                <h2 className="text-xl font-bold text-gray-800">Create Admin Coupon</h2>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-full transition-all">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Coupon Code</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="e.g. PAW50"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Discount Type</label>
                                        <select
                                            value={formData.discountType}
                                            onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed (₹)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Value</label>
                                        <input
                                            required
                                            type="number"
                                            placeholder="0"
                                            value={formData.discountValue}
                                            onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Min. Booking</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={formData.minAmount}
                                            onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Max Usage</label>
                                        <input
                                            type="number"
                                            placeholder="0 (Unlimited)"
                                            value={formData.usageLimit}
                                            onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Expiry Date</label>
                                        <input
                                            required
                                            type="date"
                                            value={formData.expiryDate}
                                            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex gap-3 mt-4">
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                                        This coupon will offer a total of <span className="font-bold underline">₹{formData.discountType === 'fixed' ? formData.discountValue : 'X'}</span> subsidy per booking, which will be deducted from your commission income. Ensure you have enough earnings to cover it.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200/50 mt-2"
                                >
                                    Confirm and Create
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageCoupons;
