import React, { useState, useContext } from 'react';
import { CSContext } from '../context/CSContext';
import { FaSignOutAlt, FaTimes, FaExclamationTriangle, FaClock } from 'react-icons/fa';

const EARLY_LOGOUT_REASONS = [
    'Medical emergency / feeling unwell',
    'Family emergency',
    'Power outage or internet failure',
    'System/hardware failure',
    'Approved early release by supervisor',
    'Other (specify below)',
];

const EarlyLogoutModal = () => {
    const { showEarlyLogoutModal, setShowEarlyLogoutModal, submitEarlyLogout, shiftWorkSeconds, SHIFT_DURATION, isBreakActive } = useContext(CSContext);
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!showEarlyLogoutModal) return null;

    const workedHrs = Math.floor(shiftWorkSeconds / 3600);
    const workedMins = Math.floor((shiftWorkSeconds % 3600) / 60);
    const remainingHrs = Math.floor(Math.max(0, SHIFT_DURATION - shiftWorkSeconds) / 3600);
    const remainingMins = Math.floor((Math.max(0, SHIFT_DURATION - shiftWorkSeconds) % 3600) / 60);

    const finalReason = selectedReason === 'Other (specify below)' ? customReason : selectedReason;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!finalReason.trim()) return;
        setSubmitting(true);
        await submitEarlyLogout(finalReason);
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <FaExclamationTriangle className="text-white text-lg" />
                        </div>
                        <div>
                            <h2 className="text-white font-black text-lg">Early Logout Request</h2>
                            <p className="text-red-100 text-xs font-medium">This will be recorded and reviewed by Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowEarlyLogoutModal(false)}
                        className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Shift Info Banner */}
                <div className="bg-amber-50 border-b border-amber-100 px-6 py-4">
                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                        <FaClock className="text-amber-500" />
                        <span className="font-bold text-sm">Today's Shift Progress</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-xl p-3 border border-amber-100 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Worked So Far</p>
                            <p className="text-xl font-black text-slate-800">{workedHrs}h {workedMins}m</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-red-100 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remaining</p>
                            <p className="text-xl font-black text-red-600">{remainingHrs}h {remainingMins}m</p>
                        </div>
                    </div>
                    {isBreakActive && (
                        <div className="mt-3 px-3 py-2 bg-red-100 rounded-lg border border-red-200 text-red-700 text-xs font-bold text-center">
                            ⚠️ Cannot logout during an active break. Resume session first.
                        </div>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">
                            Select a reason for early logout <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {EARLY_LOGOUT_REASONS.map((reason) => (
                                <label
                                    key={reason}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                        selectedReason === reason
                                            ? 'border-red-400 bg-red-50'
                                            : 'border-slate-100 bg-slate-50 hover:border-slate-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={() => setSelectedReason(reason)}
                                        className="accent-red-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">{reason}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {selectedReason === 'Other (specify below)' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Custom Reason</label>
                            <textarea
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Please describe the reason in detail..."
                                rows={3}
                                required
                                className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowEarlyLogoutModal(false)}
                            className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:border-slate-300 transition-colors"
                        >
                            Cancel — Stay at Work
                        </button>
                        <button
                            type="submit"
                            disabled={!finalReason.trim() || submitting || isBreakActive}
                            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            {submitting ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <FaSignOutAlt />
                            )}
                            {submitting ? 'Logging out...' : 'Submit & Logout'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EarlyLogoutModal;
