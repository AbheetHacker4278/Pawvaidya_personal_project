import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';

const RatingModal = ({ appointment, onClose, onSuccess, backendurl, token }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.warn('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        try {
            const { data } = await axios.post(
                backendurl + '/api/user/rate-doctor',
                {
                    userId: appointment.userId,
                    appointmentId: appointment._id,
                    rating,
                    comment
                },
                { headers: { token } }
            );

            if (data.success) {
                toast.success('Thank you for your feedback!');
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">Rate Your Experience</h3>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="flex flex-col items-center mb-6">
                        <img
                            src={appointment.docData.image}
                            alt={appointment.docData.name}
                            className="w-20 h-20 rounded-full object-cover mb-3 border-4 border-amber-100"
                        />
                        <h4 className="text-lg font-semibold text-gray-800">Dr. {appointment.docData.name}</h4>
                        <p className="text-sm text-gray-500">{appointment.docData.speciality}</p>
                    </div>

                    <div className="flex justify-center gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    className={`w-8 h-8 ${star <= (hoverRating || rating)
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-gray-300'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience (optional)..."
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none h-24 text-sm"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Review'
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default RatingModal;
