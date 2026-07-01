import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';

const RunningDogLoader = () => {
    const { userdata } = useContext(AppContext);
    const isObsidian = userdata?.subscription?.status === 'Active' && userdata?.subscription?.plan === 'Obsidian';

    if (isObsidian) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-[#050505]/40 rounded-2xl border border-[#E6C97A]/10 backdrop-blur-md">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* Rotating Dashed Gold Ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full border border-dashed border-[#E6C97A]/40"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Pulsing Glowing Inner Circle with Paw */}
                    <motion.div
                        className="w-16 h-16 rounded-full bg-[#121212] border border-[#E6C97A]/25 flex items-center justify-center shadow-[0_0_15px_rgba(230,201,122,0.1)]"
                        animate={{
                            scale: [1, 1.05, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <svg viewBox="0 0 24 24" className="w-9 h-9 text-[#E6C97A]" fill="currentColor">
                            <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 3.5s3-1.5 3-3.5c0-1.66-1.34-3-3-3zm-4.5-2.5c-.83 0-1.5-.67-1.5-1.5S6.67 8.5 7.5 8.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-6.2-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3.4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                        </svg>
                    </motion.div>
                </div>
                <p className="bg-gradient-to-r from-amber-600 via-[#E6C97A] to-amber-600 bg-clip-text text-transparent font-black mt-4 animate-pulse text-sm uppercase tracking-wider">
                    Fetching details...
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="relative w-32 h-32">
                <img
                    src="https://media.tenor.com/On7kvXhzml4AAAAj/loading-gif.gif"
                    alt="Loading..."
                    className="w-full h-full object-contain mix-blend-multiply"
                />
            </div>
            <p className="text-[#5A4035] font-bold mt-2 animate-pulse text-lg">
                Fetching details...
            </p>
        </div>
    );
};

export default RunningDogLoader;
