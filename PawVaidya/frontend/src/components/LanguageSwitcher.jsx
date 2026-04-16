import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 rounded-2xl transition-all duration-300"
        style={{
          background: 'rgba(255,255,255,0.75)',
          border: '1px solid rgba(232,213,176,0.7)',
          boxShadow: '0 2px 8px rgba(61,43,31,0.06)'
        }}
      >
        <span className="text-[16px] lg:text-[18px] drop-shadow-sm">{currentLanguage.flag}</span>
        <span className="font-semibold text-[13px] text-[#5A4035] pr-1">{currentLanguage.code.toUpperCase()}</span>
        <svg
          className={`w-3.5 h-3.5 text-[#5A4035] opacity-60 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 mt-3 w-48 rounded-2xl shadow-xl z-20 overflow-hidden"
            style={{
              background: 'rgba(250,244,234,0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(232,213,176,0.8)',
              boxShadow: '0 12px 30px -10px rgba(61,43,31,0.15)'
            }}
          >
            {/* Arrow pointer */}
            <div className="absolute -top-1.5 right-6 w-3 h-3 rotate-45 rounded-sm"
              style={{ background: '#faf4ea', borderTop: '1px solid rgba(232,213,176,0.8)', borderLeft: '1px solid rgba(232,213,176,0.8)' }} />

            <div className="py-1.5 px-1.5 relative z-10">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                  style={{
                    backgroundColor: i18n.language === lang.code ? 'rgba(200,134,10,0.1)' : 'transparent',
                    color: i18n.language === lang.code ? '#c8860a' : '#5A4035'
                  }}
                >
                  <span className="text-[18px] drop-shadow-sm">{lang.flag}</span>
                  <span className="text-[14px] font-semibold flex-1">{lang.name}</span>
                  {i18n.language === lang.code && (
                    <span className="font-bold text-[#c8860a] text-sm">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;

