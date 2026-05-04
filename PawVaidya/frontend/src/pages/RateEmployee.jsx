import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';

const RateEmployee = () => {
    const { ticketId } = useParams();
    const { token, backendUrl } = useContext(AppContext);
    const [ticket, setTicket] = useState(null);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) return;
        const fetchTicket = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/complaint/ticket/${ticketId}`, {
                    headers: { token }
                });
                if (data.success) {
                    if (data.ticket.status !== 'closed') {
                        toast.error('Ticket is not closed yet.');
                        navigate(`/ticket-tracking/${ticketId}`);
                    } else if (data.ticket.isRated) {
                        toast.info('You have already rated this ticket.');
                        navigate(`/ticket-tracking/${ticketId}`);
                    } else {
                        setTicket(data.ticket);
                    }
                } else toast.error(data.message);
            } catch (err) {
                toast.error('Failed to load. Returning to tickets.');
                navigate('/my-tickets');
            }
        };
        fetchTicket();
    }, [ticketId, token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return toast.error('Please select a star rating.');
        setSubmitting(true);
        try {
            const { data } = await axios.post(`${backendUrl}/api/complaint/rate/${ticketId}`,
                { rating, review },
                { headers: { token } }
            );
            if (data.success) {
                toast.success('Thank you for your feedback! The agent has been reviewed.');
                navigate(`/ticket-tracking/${ticketId}`);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!ticket) return <div className="p-12 text-center text-gray-500">Loading rating details...</div>;

    const agent = ticket.assignedTo;

    return (
        <div className="max-w-2xl mx-auto my-14 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Rate Your Experience</h1>
                <p className="text-gray-500 mt-2 text-sm">How was your support experience for ticket <span className="font-bold text-gray-700">'{ticket.title}'</span>?</p>
            </div>

            <div className="flex flex-col items-center bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
                <img src={agent?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent?.name || 'Agent')}&background=random`} alt="Agent" className="w-20 h-20 rounded-full shadow-sm mb-3 border-4 border-white" />
                <h3 className="text-lg font-bold text-gray-800">{agent?.name}</h3>
                <p className="text-sm text-gray-500">Customer Success Agent</p>

                {agent?.bio && (
                    <p className="text-xs text-gray-600 mt-3 text-center italic max-w-sm px-4 text-balance">
                        "{agent.bio}"
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center">
                    <p className="font-bold text-gray-800 mb-2">Select Rating</p>
                    <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                type="button"
                                key={star}
                                className={`text-4xl transition-colors focus:outline-none ${(hover || rating) >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(rating)}
                            >
                                <FaStar />
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Leave a review for {agent?.name?.split(' ')[0]} (Optional)</label>
                    <textarea
                        rows="4"
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="They were very helpful and solved my issue quickly..."
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                </div>

                <div className="flex space-x-3 pt-4">
                    <button type="button" onClick={() => navigate(-1)} className="flex-1 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50">
                        Skip
                    </button>
                    <button type="submit" disabled={submitting} className="flex-[2] bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 shadow-sm shadow-yellow-200">
                        {submitting ? 'Submitting...' : 'Submit Rating'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RateEmployee;
