import React, { useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const SupportCenter = () => {
    const { token, backendUrl } = useContext(AppContext);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await axios.post(`${backendUrl}/api/complaint/create`,
                { title, category, description },
                { headers: { token } }
            );

            if (data.success) {
                toast.success('Ticket created successfully! Our team will contact you shortly.');
                navigate('/my-tickets');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto my-10 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">PawVaidya Support Center</h1>
            <p className="text-gray-500 mb-8">How can we help you today? Please provide the details of your issue below.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject / Title</label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Brief summary of your issue"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-primary focus:border-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Category</label>
                    <select
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-primary focus:border-primary"
                    >
                        <option value="" disabled>Select a category...</option>
                        <option value="doctor_complaint">Doctor Complaint</option>
                        <option value="malpractice">Malpractice Report</option>
                        <option value="user_issue">Account / Usage Issue</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
                    <textarea
                        required
                        rows="5"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Please describe your issue in as much detail as possible. Include appointment dates or doctor names if relevant."
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-primary focus:border-primary"
                    />
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <button type="button" onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 font-medium text-sm">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SupportCenter;
