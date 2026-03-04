import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ReportModal = ({ isOpen, onClose, reportedId, reportedName, reportedType, reporterId, reporterName, reporterType, appointmentId, token, backendurl }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reasons = [
        { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
        { value: 'harassment', label: 'Harassment' },
        { value: 'unprofessional_conduct', label: 'Unprofessional Conduct' },
        { value: 'spam', label: 'Spam' },
        { value: 'fake_profile', label: 'Fake Profile' },
        { value: 'medical_malpractice', label: 'Medical Malpractice' },
        { value: 'late_arrival', label: 'Late Arrival' },
        { value: 'no_show', label: 'No Show' },
        { value: 'other', label: 'Other' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!reason || !description.trim()) {
            toast.error('Please fill all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const endpoint = reporterType === 'doctor' 
                ? `${backendurl}/api/report/doctor/submit`
                : `${backendurl}/api/report/submit`;

            const { data } = await axios.post(endpoint, {
                reporterId,
                reporterType,
                reporterName,
                reportedId,
                reportedType,
                reportedName,
                reason,
                description,
                appointmentId
            }, { 
                headers: { 
                    [reporterType === 'doctor' ? 'dtoken' : 'token']: token 
                } 
            });

            if (data.success) {
                toast.success('Report submitted successfully');
                onClose();
                setReason('');
                setDescription('');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.error('Failed to submit report');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md shadow-2xl">
                <div className="bg-red-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <h3 className="font-semibold text-lg">Report {reportedType === 'doctor' ? 'Doctor' : 'User'}</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-red-700 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Reporting: {reportedName}
                        </label>
                        <p className="text-xs text-gray-500">
                            Your report will be reviewed by our admin team
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Reason *
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                        >
                            <option value="">Select a reason</option>
                            {reasons.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description * (Max 1000 characters)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Please provide details about the issue..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            maxLength={1000}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {description.length}/1000 characters
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
