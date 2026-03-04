import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const DoctorDiscounts = () => {
    const { dtoken, backendurl } = useContext(DoctorContext);

    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        maxUses: '',
        expiresAt: '',
    });

    // ──────────────── Fetch discounts ────────────────
    const fetchDiscounts = async () => {
        setLoading(true);
        try {
            const { data } = await axios.post(
                backendurl + '/api/doctor/discounts',
                {},
                { headers: { dtoken } }
            );
            if (data.success) setDiscounts(data.discounts);
            else toast.error(data.message);
        } catch (err) {
            toast.error('Failed to load discounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiscounts();
    }, []);

    // ──────────────── Create discount ────────────────
    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data } = await axios.post(
                backendurl + '/api/doctor/discounts/create',
                {
                    code: form.code,
                    discountType: form.discountType,
                    discountValue: form.discountValue,
                    maxUses: form.maxUses || 0,
                    expiresAt: form.expiresAt || null,
                },
                { headers: { dtoken } }
            );
            if (data.success) {
                toast.success('Discount created!');
                setDiscounts(data.discounts);
                setShowModal(false);
                setForm({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiresAt: '' });
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error('Failed to create discount');
        } finally {
            setSubmitting(false);
        }
    };

    // ──────────────── Toggle active ────────────────
    const handleToggle = async (discount) => {
        try {
            const { data } = await axios.post(
                backendurl + '/api/doctor/discounts/update',
                { discountId: discount._id, isActive: !discount.isActive },
                { headers: { dtoken } }
            );
            if (data.success) {
                setDiscounts(data.discounts);
                toast.success(`Discount ${!discount.isActive ? 'activated' : 'deactivated'}`);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error('Failed to update discount');
        }
    };

    // ──────────────── Delete ────────────────
    const handleDelete = async (discountId) => {
        if (!window.confirm('Are you sure you want to delete this discount?')) return;
        try {
            const { data } = await axios.post(
                backendurl + '/api/doctor/discounts/delete',
                { discountId },
                { headers: { dtoken } }
            );
            if (data.success) {
                setDiscounts(data.discounts);
                toast.success('Discount deleted');
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error('Failed to delete discount');
        }
    };

    const isExpired = (expiresAt) => expiresAt && new Date(expiresAt) < new Date();

    return (
        <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5, #f0f9ff)' }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent flex items-center gap-3">
                        <span className="text-3xl">🏷️</span> My Discounts
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Create and manage discount codes for your patients</p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(16,185,129,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-all"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Discount
                </motion.button>
            </motion.div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total', value: discounts.length, color: '#6366f1', bg: '#ede9fe' },
                    { label: 'Active', value: discounts.filter(d => d.isActive && !isExpired(d.expiresAt)).length, color: '#10b981', bg: '#d1fae5' },
                    { label: 'Expired', value: discounts.filter(d => isExpired(d.expiresAt)).length, color: '#f59e0b', bg: '#fef3c7' },
                    { label: 'Total Uses', value: discounts.reduce((sum, d) => sum + (d.usedCount || 0), 0), color: '#3b82f6', bg: '#dbeafe' },
                ].map((stat) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.04 }}
                        className="rounded-2xl p-4 shadow-md flex flex-col items-center"
                        style={{ background: stat.bg, border: `1.5px solid ${stat.color}30` }}
                    >
                        <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                        <p className="text-sm font-medium mt-1" style={{ color: stat.color }}>{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Discount Cards */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : discounts.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                >
                    <div className="text-7xl mb-4">🏷️</div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Discounts Yet</h3>
                    <p className="text-gray-400 mb-6">Create your first discount code to reward your patients!</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-2.5 rounded-xl text-white font-medium shadow"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    >
                        + Create First Discount
                    </button>
                </motion.div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence>
                        {discounts.map((discount, index) => {
                            const expired = isExpired(discount.expiresAt);
                            const statusColor = expired ? '#f59e0b' : discount.isActive ? '#10b981' : '#ef4444';
                            const statusText = expired ? 'Expired' : discount.isActive ? 'Active' : 'Inactive';

                            return (
                                <motion.div
                                    key={discount._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                                    className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100"
                                >
                                    {/* Card Header */}
                                    <div
                                        className="px-5 py-4 flex justify-between items-center"
                                        style={{
                                            background: expired
                                                ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
                                                : discount.isActive
                                                    ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
                                                    : 'linear-gradient(135deg, #fee2e2, #fecaca)'
                                        }}
                                    >
                                        <div>
                                            <span className="text-xl font-black tracking-widest text-gray-800 font-mono">
                                                {discount.code}
                                            </span>
                                        </div>
                                        <span
                                            className="text-xs font-bold px-3 py-1 rounded-full text-white"
                                            style={{ background: statusColor }}
                                        >
                                            {statusText}
                                        </span>
                                    </div>

                                    {/* Card Body */}
                                    <div className="px-5 py-4 space-y-3">
                                        {/* Discount value */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 text-sm">Discount</span>
                                            <span className="font-bold text-lg text-emerald-600">
                                                {discount.discountType === 'percentage'
                                                    ? `${discount.discountValue}% off`
                                                    : `₹${discount.discountValue} off`}
                                            </span>
                                        </div>

                                        {/* Usage */}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Usage</span>
                                            <span className="font-medium text-gray-700">
                                                {discount.usedCount} / {discount.maxUses === 0 ? '∞' : discount.maxUses}
                                            </span>
                                        </div>

                                        {/* Progress bar for usage */}
                                        {discount.maxUses > 0 && (
                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(100, (discount.usedCount / discount.maxUses) * 100)}%`,
                                                        background: 'linear-gradient(90deg, #10b981, #059669)'
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Expiry */}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Expires</span>
                                            <span className={`font-medium ${expired ? 'text-amber-600' : 'text-gray-700'}`}>
                                                {discount.expiresAt
                                                    ? new Date(discount.expiresAt).toLocaleDateString()
                                                    : 'Never'}
                                            </span>
                                        </div>

                                        {/* Created */}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Created</span>
                                            <span className="text-gray-700">
                                                {new Date(discount.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Footer Actions */}
                                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center gap-3">
                                        {/* Toggle */}
                                        <button
                                            onClick={() => handleToggle(discount)}
                                            disabled={expired}
                                            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${expired
                                                    ? 'opacity-40 cursor-not-allowed bg-gray-200 text-gray-500'
                                                    : discount.isActive
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                }`}
                                        >
                                            {discount.isActive ? (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                    </svg>
                                                    Deactivate
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Activate
                                                </>
                                            )}
                                        </button>

                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDelete(discount._id)}
                                            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Create Discount Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                        onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div
                                className="px-6 py-5"
                                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🏷️</span>
                                        <h2 className="text-xl font-bold text-white">Create Discount</h2>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            {/* Modal Form */}
                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                {/* Code */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Discount Code *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g. SAVE20, PAWCARE"
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl font-mono font-bold text-gray-800 uppercase focus:outline-none focus:border-emerald-400 transition-colors"
                                    />
                                </div>

                                {/* Type + Value row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Discount Type *
                                        </label>
                                        <select
                                            value={form.discountType}
                                            onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-400 transition-colors bg-white"
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="flat">Flat Amount (₹)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Value *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max={form.discountType === 'percentage' ? 100 : undefined}
                                            value={form.discountValue}
                                            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                                            placeholder={form.discountType === 'percentage' ? '0-100' : '₹ amount'}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-400 transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Max Uses */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Max Uses <span className="text-gray-400 font-normal">(0 = unlimited)</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.maxUses}
                                        onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                                        placeholder="Leave blank for unlimited"
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-400 transition-colors"
                                    />
                                </div>

                                {/* Expiry */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Expiry Date <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={form.expiresAt}
                                        onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-400 transition-colors"
                                    />
                                </div>

                                {/* Preview */}
                                {form.discountValue && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="p-3 rounded-xl text-sm font-medium"
                                        style={{ background: '#d1fae5', color: '#065f46' }}
                                    >
                                        🎉 Patients using <strong>{form.code || 'CODE'}</strong> will get{' '}
                                        <strong>
                                            {form.discountType === 'percentage'
                                                ? `${form.discountValue}%`
                                                : `₹${form.discountValue}`}
                                        </strong>{' '}
                                        off their consultation fee.
                                    </motion.div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white shadow-md disabled:opacity-60 transition-all"
                                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                                    >
                                        {submitting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Creating...
                                            </span>
                                        ) : 'Create Discount'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DoctorDiscounts;
