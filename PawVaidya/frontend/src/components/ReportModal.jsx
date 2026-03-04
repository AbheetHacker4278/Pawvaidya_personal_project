import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { translateSpeciality } from '../utils/translateSpeciality';

const ReportModal = ({ appointment, onClose }) => {
  const { backendurl, token, userdata } = useContext(AppContext);
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const reportReasons = [
    { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'unprofessional_conduct', label: 'Unprofessional Conduct' },
    { value: 'fake_profile', label: 'Fake Profile' },
    { value: 'spam', label: 'Spam' },
    { value: 'no_show', label: 'No Show' },
    { value: 'payment_issue', label: 'Payment Issue' },
    { value: 'medical_malpractice', label: 'Medical Malpractice' },
    { value: 'privacy_violation', label: 'Privacy Violation' },
    { value: 'other', label: 'Other' }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        return;
      }
      setEvidence(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (description.length < 20) {
      toast.error('Description must be at least 20 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit report
      const reportData = {
        reporterType: 'user',
        reporterId: userdata._id || userdata.id,
        reportedType: 'doctor',
        reportedId: appointment.docId,
        appointmentId: appointment._id,
        reason,
        description
      };

      const { data } = await axios.post(
        `${backendurl}/api/report/submit`,
        reportData,
        { headers: { token } }
      );

      if (data.success) {
        // Upload evidence if provided
        if (evidence) {
          const formData = new FormData();
          formData.append('reportId', data.reportId);
          formData.append('evidence', evidence);

          await axios.post(
            `${backendurl}/api/report/upload-evidence`,
            formData,
            {
              headers: {
                token,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
        }

        setIsSuccess(true);
        toast.success('Report submitted successfully!');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        toast.error(data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flag className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Report Doctor</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="mt-2 text-red-100">
              Report inappropriate behavior or violations
            </p>
          </div>

          {isSuccess ? (
            /* Success State */
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-12 h-12 text-green-600" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Report Submitted!
              </h3>
              <p className="text-gray-600">
                Thank you for reporting. Our team will review this case and take appropriate action.
              </p>
            </div>
          ) : (
            /* Report Form */
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Doctor Info */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">Reporting:</h3>
                <div className="flex items-center gap-3">
                  <img
                    src={appointment.docData.image}
                    alt={appointment.docData.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">
                      Dr. {appointment.docData.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {translateSpeciality(appointment.docData.speciality, t)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Important:</p>
                  <p>
                    False reports may result in action against your account. Please provide accurate information.
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Report <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a reason</option>
                  {reportReasons.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide detailed information about the incident (minimum 20 characters)..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows="5"
                  maxLength="1000"
                  required
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">
                    Minimum 20 characters
                  </p>
                  <p className="text-sm text-gray-500">
                    {description.length}/1000
                  </p>
                </div>
              </div>

              {/* Evidence Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Evidence (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    id="evidence-upload"
                  />
                  <label
                    htmlFor="evidence-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-10 h-10 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-700">
                      Upload Screenshot or Document
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF, DOC (Max 10MB)
                    </p>
                  </label>
                  {evidence && (
                    <div className="mt-3 text-sm text-green-600 font-semibold">
                      ✓ {evidence.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportModal;
