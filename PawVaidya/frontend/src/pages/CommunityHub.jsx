import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Radio, Vote, Sparkles } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import CommunityBlogs from './CommunityBlogs';
import LiveStreams from './LiveStreams';
import Polls from './Polls';

const B = {
  dark: '#3d2b1f',
  mid: '#5A4035',
  light: '#7a5a48',
  cream: '#f2e4c7',
  sand: '#e8d5b0',
  amber: '#c8860a',
  pale: '#fdf8f0',
  warmWhite: '#fffaf3'
};

const CommunityHub = () => {
  const { userdata } = useContext(AppContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const { streamID } = useParams();
  const navigate = useNavigate();

  const isObsidian = userdata?.subscription?.status === 'Active' && userdata?.subscription?.plan === 'Obsidian';

  // Determine active tab based on query parameters or active live stream parameter
  const tabFromQuery = searchParams.get('tab');
  const initialTab = streamID ? 'live' : (tabFromQuery || 'blogs');
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab state with query param and URL
  useEffect(() => {
    if (streamID) {
      setActiveTab('live');
    } else if (tabFromQuery && ['blogs', 'live', 'polls'].includes(tabFromQuery)) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery, streamID]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    // Clear stream ID if switching away from live streams to prevent player stickiness
    if (streamID && tabName !== 'live') {
      navigate(`/community?tab=${tabName}`);
    } else {
      setSearchParams({ tab: tabName });
    }
  };

  const tabs = [
    { id: 'blogs', label: 'Community Feed', icon: BookOpen },
    { id: 'live', label: 'Live Channels', icon: Radio },
    { id: 'polls', label: 'Community Polls', icon: Vote }
  ];

  return (
    <div className={`min-h-screen pt-24 pb-16 transition-colors duration-500 ${isObsidian ? 'bg-[#050505] text-[#F5F2EA]' : 'bg-[#f2e4c7]'}`}>

      {/* ── Hero Banner ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div
          className={`relative overflow-hidden rounded-[2.5rem] py-14 px-6 md:px-12 border transition-all duration-500 ${isObsidian
            ? 'bg-gradient-to-br from-[#121212] via-[#0A0A0A] to-[#0E0E0E] border-[#E6C97A]/25 shadow-[0_20px_50px_rgba(0,0,0,0.95)]'
            : 'border-[#5a4035]/10 shadow-[0_20px_50px_rgba(122,90,72,0.15)]'
            }`}
          style={!isObsidian ? { background: `linear-gradient(135deg, ${B.dark} 0%, ${B.mid} 60%, ${B.light} 100%)` } : {}}
        >
          {/* Decorative Grid Overlay & Ambient Glow */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}
          />
          <div className={`absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none ${isObsidian ? 'bg-[#E6C97A]/5' : 'bg-amber-500/10'}`} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl pointer-events-none" />

          {/* Premium stars background (exclusive to Obsidian) */}
          {isObsidian && (
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
              <div
                className="absolute right-12 top-10 w-24 h-24 opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(#E6C97A 1px, transparent 1px)',
                  backgroundSize: '6px 6px'
                }}
              />
            </div>
          )}

          <div className="relative z-10 max-w-4xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-left">
              {/* Label Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-5 border ${isObsidian
                  ? 'bg-[#E6C97A]/10 border-[#E6C97A]/25 text-[#E6C97A]'
                  : 'bg-white/10 border-white/10 text-[#e8d5b0]'
                  }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isObsidian ? 'text-[#E6C97A]' : 'text-amber-400'}`} />
                <span>PawVaidya Interactive Hub</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-4"
              >
                PawVaidya <span className={isObsidian ? 'text-[#E6C97A]' : ''} style={!isObsidian ? { color: B.sand } : {}}>Community</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`text-sm font-medium max-w-2xl leading-relaxed ${isObsidian ? 'text-neutral-400' : 'text-white/70'}`}
              >
                Share stories, participate in engagement polls, and join live consults.
                Connect with pet owners & expert vets all in one place.
              </motion.p>
            </div>

            {/* Mockup Pet Hero Image (Dog & Cat) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="w-48 sm:w-60 md:w-72 shrink-0 relative hidden md:block"
            >
              <img
                src="https://i.ibb.co/gFD25XJS/Chat-GPT-Image-Jun-16-2026-05-36-27-PM.png"
                className="w-full h-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
                alt="Pets"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Glassmorphic Navigation Tabs ───────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
        <div
          className={`p-2.5 rounded-[2rem] shadow-xl flex flex-col md:flex-row gap-2 border transition-all duration-300 ${isObsidian
            ? 'bg-[#0E0E0E] border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.85)]'
            : 'bg-white/95 border-[#5a4035]/10'
            }`}
          style={{
            backdropFilter: 'blur(20px)',
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black text-sm transition-all duration-300 relative overflow-hidden active:scale-98"
                style={{
                  color: isActive ? (isObsidian ? '#000000' : '#ffffff') : (isObsidian ? '#A3A3A3' : B.light),
                  background: isActive
                    ? (isObsidian
                      ? 'linear-gradient(135deg, #8C6D23, #E6C97A, #8C6D23)'
                      : `linear-gradient(135deg, ${B.mid}, ${B.dark})`)
                    : 'transparent',
                  boxShadow: isActive ? (isObsidian ? '0 10px 20px rgba(230,201,122,0.15)' : '0 10px 20px rgba(90, 64, 53, 0.25)') : 'none',
                  border: isActive && isObsidian ? '1px solid rgba(230,201,122,0.4)' : 'none'
                }}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'opacity-80'}`} />
                <span>{tab.label}</span>
                {isActive && !isObsidian && (
                  <motion.span
                    layoutId="activeTabGlow"
                    className="absolute inset-0 bg-white/5 pointer-events-none"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Consolidated Content View ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {activeTab === 'blogs' && <CommunityBlogs hideHeader={true} />}
            {activeTab === 'live' && <LiveStreams hideHeader={true} />}
            {activeTab === 'polls' && <Polls hideHeader={true} />}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
};

export default CommunityHub;
