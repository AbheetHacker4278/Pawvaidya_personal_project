import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck } from 'lucide-react';

const PageLoader = () => {
  const isObsidian = localStorage.getItem('subscriptionPlan') === 'Obsidian';
  const [textIndex, setTextIndex] = useState(0);

  const obsidianTexts = [
    'Unlocking Obsidian Lounge...',
    'Securing VIP Veterinary Access...',
    'Verifying Encrypted Wallet...',
    'Loading Premium Aesthetics...',
    'Welcome to Premium Care...',
  ];

  const standardTexts = [
    'Fetching details...',
    'Loading PawVaidya...',
    'Connecting to Vets...',
    'Preparing Pet Care...',
  ];

  const texts = isObsidian ? obsidianTexts : standardTexts;

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-colors duration-500 ${
        isObsidian ? 'bg-[#050505]' : 'bg-[#f2e4c7]'
      }`}
    >
      {/* Background decorations */}
      {isObsidian ? (
        <>
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #E6C97A 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          {/* Glowing background blobs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-amber-600/10 to-[#E6C97A]/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-[#E6C97A]/5 to-transparent blur-[120px] pointer-events-none" />
        </>
      ) : (
        <>
          {/* Subtle grid pattern for standard theme */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #5A4035 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          {/* Soft background blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#e8d5b0]/30 blur-[80px] pointer-events-none" />
        </>
      )}

      {/* Main loading container */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
        {/* Animated Icon Ring */}
        <div className="relative w-36 h-36 flex items-center justify-center mb-6">
          {isObsidian ? (
            <>
              {/* Golden Rotating Ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-dashed border-[#E6C97A]/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              />
              {/* Golden Inner Solid Ring with Gradient Border */}
              <motion.div
                className="absolute inset-2 rounded-full border border-gradient-to-r from-[#E6C97A]/60 via-[#c8860a]/20 to-[#E6C97A]/60 shadow-[0_0_25px_rgba(230,201,122,0.15)]"
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />
              {/* Premium Glow effect */}
              <div className="absolute inset-4 rounded-full bg-[#121212] border border-[#E6C97A]/25 flex items-center justify-center shadow-[inset_0_0_15px_rgba(230,201,122,0.05)]">
                {/* Glowing Paw icon */}
                <motion.svg
                  viewBox="0 0 24 24"
                  className="w-14 h-14 text-[#E6C97A]"
                  fill="currentColor"
                  animate={{
                    scale: [1, 1.08, 1],
                    filter: [
                      'drop-shadow(0 0 4px rgba(230, 201, 122, 0.4))',
                      'drop-shadow(0 0 12px rgba(230, 201, 122, 0.7))',
                      'drop-shadow(0 0 4px rgba(230, 201, 122, 0.4))',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 3.5s3-1.5 3-3.5c0-1.66-1.34-3-3-3zm-4.5-2.5c-.83 0-1.5-.67-1.5-1.5S6.67 8.5 7.5 8.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-6.2-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3.4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                </motion.svg>
              </div>

              {/* Obsidian Badges/Stars decorations */}
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 text-[#E6C97A] filter drop-shadow-[0_0_4px_#E6C97A]" />
              </motion.div>
              <motion.div
                className="absolute -bottom-1 -left-1"
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
              >
                <ShieldCheck className="w-5 h-5 text-[#E6C97A] filter drop-shadow-[0_0_4px_#E6C97A]" />
              </motion.div>
            </>
          ) : (
            <>
              {/* Standard Rotating Ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-dashed border-[#5A4035]/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-3 rounded-full bg-[#fdf8f0] border border-[#e8d5b0] flex items-center justify-center shadow-md">
                {/* Standard Paw icon */}
                <motion.svg
                  viewBox="0 0 24 24"
                  className="w-12 h-12 text-[#5A4035]"
                  fill="currentColor"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 3.5s3-1.5 3-3.5c0-1.66-1.34-3-3-3zm-4.5-2.5c-.83 0-1.5-.67-1.5-1.5S6.67 8.5 7.5 8.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-6.2-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3.4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                </motion.svg>
              </div>
            </>
          )}
        </div>

        {/* Text Area with Framer Motion AnimatePresence */}
        <div className="h-14 flex items-center justify-center overflow-hidden w-80">
          <AnimatePresence mode="wait">
            <motion.p
              key={textIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`font-black text-lg md:text-xl tracking-wide ${
                isObsidian
                  ? 'bg-gradient-to-r from-amber-600 via-[#E6C97A] to-amber-600 bg-clip-text text-transparent filter drop-shadow-[0_0_5px_rgba(230,201,122,0.15)]'
                  : 'text-[#5A4035]'
              }`}
            >
              {texts[textIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Glowing Subtext or Tagline */}
        {isObsidian ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full border border-[#E6C97A]/20 bg-[#0d0d0d] text-[11px] font-extrabold tracking-widest text-[#E6C97A] uppercase filter drop-shadow-[0_0_3px_rgba(230,201,122,0.1)]"
          >
            <span>✨</span> Obsidian Lounge Member <span>✨</span>
          </motion.div>
        ) : (
          <p className="text-xs text-[#7a5a48] font-bold tracking-wider mt-1 uppercase">
            PawVaidya Healthcare
          </p>
        )}
      </div>

      {/* Modern bottom linear loading progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-black/10 overflow-hidden">
        <motion.div
          className={`h-full ${
            isObsidian
              ? 'bg-gradient-to-r from-amber-600 via-[#E6C97A] to-amber-600 shadow-[0_0_8px_#E6C97A]'
              : 'bg-gradient-to-r from-[#5A4035] to-[#c8860a]'
          }`}
          initial={{ left: '-100%', width: '100%', position: 'absolute' }}
          animate={{ left: '100%' }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
};

export default PageLoader;
