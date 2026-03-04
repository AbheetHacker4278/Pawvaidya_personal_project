import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ReportIssue = () => {
    const { backendurl, token, userdata } = useContext(AppContext);
    const navigate = useNavigate();

    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Bug');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error('Please login to report an issue');
            return;
        }

        if (!subject || !description || !category) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            const { data } = await axios.post(
                `${backendurl}/api/app-issue/submit`,
                {
                    userId: userdata?.id || userdata?._id,
                    subject,
                    description,
                    category
                },
                { headers: { token } }
            );

            if (data.success) {
                toast.success(data.message);
                setSubject('');
                setDescription('');
                setCategory('Bug');
                // Redirect after a short delay
                setTimeout(() => navigate('/'), 2000);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-10 pb-20">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-amber-100">
                <div className="bg-gradient-to-r from-amber-700 to-amber-900 p-8 text-white">
                    <h1 className="text-3xl font-bold mb-2">Report an Issue</h1>
                    <p className="text-amber-100 italic">Help us improve PawVaidya! Let us know if you found a bug or have a suggestion.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-amber-900 mb-2">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Brief summary of the issue"
                            className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-amber-900 mb-2">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                            required
                        >
                            <option value="Bug">Bug / Error</option>
                            <option value="UI">UI / Visual Issue</option>
                            <option value="Performance">Performance / Speed</option>
                            <option value="Feature Request">Feature Request</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-amber-900 mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detailed explanation of what happened or what you'd like to see..."
                            rows="5"
                            className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all resize-none"
                            required
                        ></textarea>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all active:scale-95 ${loading
                                    ? 'bg-amber-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 hover:shadow-amber-200'
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Submitting...
                                </div>
                            ) : (
                                'Submit Report'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="mt-8 text-center text-amber-800 opacity-60">
                <p>© 2026 PawVaidya. Thank you for your support.</p>
            </div>
        </div>
    );
};

export default ReportIssue;
