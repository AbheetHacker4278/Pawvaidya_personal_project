import React, { useState } from 'react';
import { X, Award, Gift, Star, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const IncentiveModal = ({ doctor, onClose, onSuccess, backendUrl, aToken }) => {
    // Check if doctor has an active incentive to pre-fill
    const hasActiveIncentive = doctor.incentive && doctor.incentive.type !== 'none';

    const [type, setType] = useState(hasActiveIncentive ? doctor.incentive.type : 'bonus');
    const [value, setValue] = useState(hasActiveIncentive ? doctor.incentive.value : '');
    const [message, setMessage] = useState(hasActiveIncentive ? doctor.incentive.message : '');
    const [expiryDate, setExpiryDate] = useState(
        hasActiveIncentive && doctor.incentive.expiryDate
            ? new Date(doctor.incentive.expiryDate).toISOString().slice(0, 16)
            : ''
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!type || !value) {
            toast.warn('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const { data } = await axios.post(
                backendUrl + '/api/admin/give-incentive',
                {
                    doctorId: doctor._id,
                    type,
                    value,
                    message,
                    expiryDate
                },
                { headers: { aToken } }
            );

            if (data.success) {
                toast.success('Incentive awarded successfully');
                onSuccess();
                onClose();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const PREDEFINED_BADGES = [
        "🏆 Top Rated",
        "⚡ Rapid Responder",
        "❤️ Patient Favorite",
        "🌟 Rising Star",
        "🛡️ Guardian of Health",
        "🎓 Expert Consultant"
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Gift className="w-5 h-5 text-amber-500" />
                            {hasActiveIncentive ? 'Update Incentive' : 'Award Incentive'}
                        </h3>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <img
                            src={doctor.image}
                            alt={doctor.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        <div>
                            <h4 className="font-semibold text-gray-800">{doctor.name}</h4>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{doctor.averageRating?.toFixed(1) || '0.0'} ({doctor.totalRatings || 0} reviews)</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Incentive Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => { setType('bonus'); setValue(''); }}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition ${type === 'bonus'
                                        ? 'bg-amber-50 border-amber-200 text-amber-700 ring-1 ring-amber-200'
                                        : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                                        }`}
                                >
                                    <Gift className="w-4 h-4" /> Bonus
                                </button>
                                <button
                                    onClick={() => { setType('badge'); setValue(''); }}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition ${type === 'badge'
                                        ? 'bg-amber-50 border-amber-200 text-amber-700 ring-1 ring-amber-200'
                                        : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                                        }`}
                                >
                                    <Award className="w-4 h-4" /> Badge
                                </button>
                            </div>
                        </div>

                        {type === 'badge' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Badge</label>
                                <div className="flex flex-wrap gap-2">
                                    {PREDEFINED_BADGES.map((badge) => (
                                        <button
                                            key={badge}
                                            onClick={() => setValue(badge)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${value === badge
                                                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {badge}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {type === 'bonus' ? 'Value (Amount/Percentage)' : 'Badge Name (or Custom)'}
                            </label>
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={type === 'bonus' ? 'e.g., ₹5000 or 10%' : 'e.g., Top Rated'}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Message to the doctor..."
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none h-24"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                            <input
                                type="datetime-local"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                min={new Date().toISOString().slice(0, 16)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Incentive will automatically deactivate after this time.</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            hasActiveIncentive ? 'Update Incentive' : 'Award Incentive'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncentiveModal;
