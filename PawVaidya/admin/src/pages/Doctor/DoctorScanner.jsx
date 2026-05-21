import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import QrScanner from '../../components/QrScanner';
import PetHealthCard from '../../components/PetHealthCard';

const DoctorScanner = () => {
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(true);
  const [error, setError] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  const handleScanSuccess = async (decodedText) => {
    try {
      const dToken = localStorage.getItem('dtoken');
      if (!dToken) {
        throw new Error("You are not logged in as a doctor.");
      }

      setLoading(true);
      setError(null);
      
      // The QR payload is a JSON string containing qrToken, petId, etc.
      let payload;
      try {
        payload = JSON.parse(decodedText);
      } catch (e) {
        throw new Error("Invalid QR Code format. Please scan a valid PawVaidya Pet Card.");
      }

      if (!payload.qrToken) {
        throw new Error("Invalid QR Code: Missing Security Token.");
      }

      const { data } = await axios.get(`${backendUrl}/api/doctor/pet-health/${payload.qrToken}`, {
        headers: { dtoken: dToken }
      });

      if (data.success) {
        setScannedData(data);
        setShowScanner(false);
        toast.success("Pet Medical Records Retrieved!");
      } else {
        setError(data.message);
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(err.message || "Failed to retrieve records");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (scannedData?.pet?.qrToken) {
      const dToken = localStorage.getItem('dtoken');
      const { data } = await axios.get(`${backendUrl}/api/doctor/pet-health/${scannedData.pet.qrToken}`, {
        headers: { dtoken: dToken }
      });
      if (data.success) {
        setScannedData(data);
      }
    }
  };

  const handleReset = () => {
    setScannedData(null);
    setShowScanner(true);
    setError(null);
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <AnimatePresence mode="wait">
        {showScanner ? (
          <motion.div 
            key="scanner-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Scan size={40} className="text-blue-600" />
              </div>
              <h1 className="text-3xl font-black text-gray-800 mb-2">Digital Health Scanner</h1>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Scan the QR code on the physical Pet Premium Card to instantly access the pet's full medical history.
              </p>

              <div className="relative rounded-2xl overflow-hidden border-4 border-gray-100 bg-gray-900 aspect-square max-w-md mx-auto mb-8 shadow-inner">
                {loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm z-10">
                    <RefreshCw className="text-blue-500 animate-spin mb-4" size={48} />
                    <p className="text-white font-medium">Retrieving Secure Records...</p>
                  </div>
                ) : (
                  <QrScanner 
                    isOpen={true}
                    inline={true}
                    onScanSuccess={handleScanSuccess}
                    onScanError={(err) => console.log(err)}
                  />
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 justify-center text-red-500 bg-red-50 p-4 rounded-xl mb-6">
                  <AlertCircle size={18} />
                  <p className="text-sm font-semibold">{error}</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
                  Secure Medical Access • Authorized Personnel Only
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="data-view"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100"
              >
                <ArrowLeft size={18} />
                Scan Another Card
              </button>
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 font-bold text-sm">
                <RefreshCw size={14} />
                Real-time Data
              </div>
            </div>
            
            <PetHealthCard data={scannedData} onUpdate={handleUpdate} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorScanner;
