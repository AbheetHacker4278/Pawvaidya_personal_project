import React, { useState } from 'react';
import { X, Gift, Award, Calendar, Search } from 'lucide-react';

const HistoryModal = ({ doctor, onClose }) => {
    const [filter, setFilter] = useState('all'); // 'all', 'badge', 'bonus'

    if (!doctor) return null;

    const history = doctor.incentiveHistory || [];

    // Deduplicate history: remove consecutive duplicates and "Active -> Expired" redundancy
    const uniqueHistory = history.reduce((acc, current) => {
        const last = acc[acc.length - 1];

        if (!last) return [current];

        const isSameType = last.type === current.type;
        const isSameValue = String(last.value) === String(current.value);

        // Check if current is just the expired version of last
        const isExpiredVersion = current.message === `${last.message} (Expired)`;

        if (isSameType && isSameValue && isExpiredVersion) {
            // Replace the active entry with the expired one (latest state)
            acc.pop();
            return [...acc, current];
        }

        const isSameMessage = last.message === current.message;
        const isSameExpiry = (!last.expiryDate && !current.expiryDate) ||
            (last.expiryDate && current.expiryDate && new Date(last.expiryDate).getTime() === new Date(current.expiryDate).getTime());

        if (isSameType && isSameValue && isSameMessage && isSameExpiry) {
            return acc;
        }

        return [...acc, current];
    }, []);

    const reversedHistory = [...uniqueHistory].reverse();

    const filteredHistory = reversedHistory.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'badge') return item.type === 'badge';
        if (filter === 'bonus') return item.type !== 'badge';
        return true;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            Incentive History
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            History for <span className="font-semibold text-gray-700">{doctor.name}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 border-b border-gray-100 flex gap-3">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('badge')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'badge'
                            ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Award className="w-4 h-4" /> Badges
                    </button>
                    <button
                        onClick={() => setFilter('bonus')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'bonus'
                            ? 'bg-green-100 text-green-700 ring-1 ring-green-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Gift className="w-4 h-4" /> Bonuses
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-6 space-y-3">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map((item, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-xl border flex items-center gap-4 transition-all hover:bg-gray-50 ${item.type === 'badge' ? 'border-purple-100 bg-purple-50/30' : 'border-green-100 bg-green-50/30'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.type === 'badge' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'
                                    }`}>
                                    {item.type === 'badge' ? <Award className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className={`font-bold ${item.type === 'badge' ? 'text-purple-700' : 'text-green-700'
                                                }`}>
                                                {item.value}
                                            </p>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-0.5">
                                                {item.type === 'badge' ? 'Honorary Badge' : 'Financial Bonus'}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium">
                                            {new Date(item.date).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {item.message && (
                                        <p className="text-gray-600 text-sm mt-2 bg-white/50 p-2 rounded-lg">
                                            "{item.message}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search className="w-8 h-8 text-gray-300" />
                            </div>
                            <p>No history found for this filter.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-400">
                    Showing {filteredHistory.length} records
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
