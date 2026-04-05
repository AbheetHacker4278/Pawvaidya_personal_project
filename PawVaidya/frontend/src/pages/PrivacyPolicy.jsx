import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── Brand palette ────────────────────────────────────────────────────────────
const B = {
  dark: '#3d2b1f',
  mid: '#5A4035',
  light: '#7a5a48',
  cream: '#f2e4c7',
  sand: '#e8d5b0',
  amber: '#c8860a',
  pale: '#fdf8f0',
};

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);

  const privacypolicydata = [
    { question: t('privacyPolicy.q1'), answers: [t('privacyPolicy.a1_1'), t('privacyPolicy.a1_2'), t('privacyPolicy.a1_3'), t('privacyPolicy.a1_4')] },
    { question: t('privacyPolicy.q2'), answers: [t('privacyPolicy.a2_1'), t('privacyPolicy.a2_2')] },
    { question: t('privacyPolicy.q3'), answers: [t('privacyPolicy.a3_1'), t('privacyPolicy.a3_2')] },
    { question: t('privacyPolicy.q4'), answers: [t('privacyPolicy.a4_1'), t('privacyPolicy.a4_2')] },
    { question: t('privacyPolicy.q5'), answers: [t('privacyPolicy.a5_1'), t('privacyPolicy.a5_2')] },
    { question: t('privacyPolicy.q6'), answers: [t('privacyPolicy.a6_1'), t('privacyPolicy.a6_2'), t('privacyPolicy.a6_3')] },
    { question: t('privacyPolicy.q7'), answers: [t('privacyPolicy.a7_1')] },
    { question: t('privacyPolicy.q8'), answers: [t('privacyPolicy.a8_1'), t('privacyPolicy.a8_2')] },
    { question: t('privacyPolicy.q9'), answers: [t('privacyPolicy.a9_1'), t('privacyPolicy.a9_2')] },
    { question: t('privacyPolicy.q10'), answers: [t('privacyPolicy.a10_1'), t('privacyPolicy.a10_2')] },
  ];

  const toggleDropdown = (index) => setOpenIndex(openIndex === index ? null : index);

  return (
    <div className="min-h-screen pb-16" style={{ background: B.cream }}>

      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden py-12 px-6 mb-10 rounded-b-[2.5rem] shadow-xl"
        style={{ background: `linear-gradient(135deg, ${B.dark} 0%, ${B.mid} 55%, ${B.light} 100%)` }}
      >
        <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full blur-3xl opacity-15" style={{ background: B.cream }} />
        <div className="absolute -bottom-8 -right-8 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ background: B.amber }} />
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 border border-white/20"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            {t('privacyPolicy.title')}
          </h1>
          <div className="h-1 w-20 rounded-full mx-auto mb-3"
            style={{ background: `linear-gradient(to right, ${B.amber}, #e8a020)` }} />
          <p className="text-amber-200 text-base md:text-lg">
            {t('privacyPolicy.subtitle')}
          </p>
        </div>
      </motion.div>

      {/* ── Policy Accordion ──────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl overflow-hidden border backdrop-blur-md"
          style={{ background: 'rgba(237, 228, 216, 0.85)', borderColor: B.sand, boxShadow: '0 4px 24px rgba(90,64,53,0.10)' }}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${B.dark}, ${B.mid}, ${B.amber})` }} />

          <div className="divide-y" style={{ borderColor: B.sand }}>
            {privacypolicydata.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 + index * 0.04 }}
              >
                <button
                  onClick={() => toggleDropdown(index)}
                  className="w-full flex justify-between items-center text-left px-6 py-4 transition-colors"
                  style={{ background: openIndex === index ? B.pale : 'transparent' }}
                >
                  <span className="font-semibold text-sm md:text-base pr-4" style={{ color: B.dark }}>
                    {item.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-5 h-5" style={{ color: B.mid }} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-1">
                        <div className="h-px mb-4"
                          style={{ background: `linear-gradient(to right, ${B.sand}, ${B.amber}55, ${B.sand})` }} />
                        <ul className="space-y-2">
                          {item.answers.map((answer, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed"
                              style={{ color: B.light }}>
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ background: B.amber }} />
                              {answer}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Footer note ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-sm" style={{ color: B.light }}>
            {t('privacyPolicy.cantFind')}{' '}
            <a href="/contact"
              className="font-semibold underline underline-offset-2 transition-colors hover:opacity-80"
              style={{ color: B.mid }}>
              {t('privacyPolicy.contactSupport')}
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
