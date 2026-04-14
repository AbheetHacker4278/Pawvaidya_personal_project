import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

const QrScanner = ({ isOpen, onClose, onScanSuccess }) => {
    const [error, setError] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            startScanner();
        }
        return () => stopScanner();
    }, [isOpen]);

    const startScanner = async () => {
        try {
            setError('');
            setIsScanning(true);

            // Small delay to let the DOM render
            await new Promise(r => setTimeout(r, 300));

            const html5QrCode = new Html5Qrcode('qr-reader');
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: 'environment' },
                {
                    fps: 15,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        return {
                            width: Math.floor(minEdge * 0.75),
                            height: Math.floor(minEdge * 0.75)
                        };
                    }
                },
                (decodedText) => {
                    try {
                        const parsed = JSON.parse(decodedText);
                        if (parsed.qrToken) {
                            stopScanner();
                            onScanSuccess(parsed);
                        } else {
                            setError('Invalid QR code format');
                        }
                    } catch {
                        setError('Could not parse QR code data');
                    }
                },
                () => { /* Ignore scan failures */ }
            );
        } catch (err) {
            console.error('Scanner error:', err);
            setError(err.message || 'Could not access camera. Please check permissions.');
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        try {
            if (scannerRef.current && scannerRef.current.isScanning) {
                await scannerRef.current.stop();
            }
        } catch { /* ignore */ }
        setIsScanning(false);
    };

    const handleClose = () => {
        stopScanner();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
        >
            <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl border"
                style={{ borderColor: '#e8d5b0' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#5A4035' }}>
                            <Camera className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg" style={{ color: '#3d2b1f' }}>Scan Pet QR</h3>
                            <p className="text-xs" style={{ color: '#a08060' }}>Point camera at pet's ID card QR code</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="relative rounded-2xl overflow-hidden bg-black" style={{ minHeight: '300px' }}>
                    <div id="qr-reader" ref={containerRef} style={{ width: '100%' }}></div>

                    {/* Scanning overlay */}
                    {isScanning && !error && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <motion.div
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-white text-xs font-bold bg-black/50 px-4 py-2 rounded-full absolute bottom-4"
                            >
                                Scanning...
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2"
                        >
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <p className="text-red-600 text-sm font-medium">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Retry Button */}
                {error && (
                    <button
                        onClick={startScanner}
                        className="w-full mt-3 py-2.5 rounded-xl text-white font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg, #5A4035, #7a5a48)' }}
                    >
                        Retry
                    </button>
                )}
            </motion.div>
        </motion.div>
    );
};

export default QrScanner;
