import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Wallet, Activity, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Brand palette
const B = {
    dark: '#3d2b1f',
    mid: '#5A4035',
    light: '#7a5a48',
    cream: '#f2e4c7',
    sand: '#e8d5b0',
    amber: '#c8860a',
    pale: '#fdf8f0',
};

const PawWallet = () => {
    const { userdata } = useContext(AppContext);
    const { t } = useTranslation();

    const balance = userdata?.pawWallet || 0;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen" style={{ color: B.dark }}>

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <span className="p-2 rounded-xl" style={{ backgroundColor: B.cream }}>
                            <Wallet className="w-8 h-8" style={{ color: B.amber }} />
                        </span>
                        Paw Wallet
                    </h1>
                    <p className="mt-2 text-[15px]" style={{ color: B.light }}>
                        Manage your refunds and wallet balance.
                    </p>
                </div>
            </div>

            {/* Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl p-8 relative overflow-hidden shadow-lg border"
                style={{
                    background: `linear-gradient(135deg, ${B.dark}, ${B.mid})`,
                    borderColor: B.sand
                }}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-white text-center md:text-left">
                        <p className="text-lg opacity-80 mb-1">Available Balance</p>
                        <h2 className="text-5xl font-black tracking-tight" style={{ color: B.cream }}>
                            ₹{balance.toLocaleString('en-IN')}
                        </h2>
                    </div>

                    <div className="flex gap-4">
                        {/* Future Add Funds Button could go here */}
                    </div>
                </div>
            </motion.div>

            {/* Info Notice */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6 p-4 rounded-xl flex items-start gap-3 border"
                style={{ backgroundColor: B.pale, borderColor: B.cream }}
            >
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: B.amber }} />
                <div>
                    <h4 className="font-semibold text-[15px]">Refund Policy</h4>
                    <p className="text-[14px] mt-1" style={{ color: B.light }}>
                        If a scheduled appointment is cancelled by a doctor or admin, the paid amount is automatically refunded here. You can use your wallet balance towards future bookings. Note: Self-cancelled appointments are not eligible for a refund.
                    </p>
                </div>
            </motion.div>

        </div>
    );
};

export default PawWallet;
