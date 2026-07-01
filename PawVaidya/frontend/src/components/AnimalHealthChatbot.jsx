import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Minimize2, Maximize2, RotateCcw, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import LLM from '../utils/llm';
import assets from '../assets/assets_frontend/assets';

// ─── Premium SVG Paw Icon ─────────────────────────────────────────────────────
const PawIcon = ({ size = 28, color = 'white' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="16" cy="14" rx="6" ry="8" fill={color} opacity="0.95" />
    <ellipse cx="32" cy="9" rx="6" ry="8" fill={color} opacity="0.95" />
    <ellipse cx="48" cy="14" rx="6" ry="8" fill={color} opacity="0.95" />
    <ellipse cx="8" cy="30" rx="5" ry="7" fill={color} opacity="0.95" />
    <ellipse cx="32" cy="42" rx="18" ry="16" fill={color} opacity="0.95" />
  </svg>
);

// ─── Agentic quick chips (personalized per login state) ───────────────────────
const getQuickChips = (isLoggedIn) => [
  ...(isLoggedIn ? [
    { label: '📅 My Appointments', msg: 'Show my upcoming appointments' },
    { label: '🐾 My Pets', msg: 'List my registered pets' },
    { label: '💰 PawPoints', msg: 'Check my PawPoints balance' },
    { label: '🏆 Subscription', msg: 'What is my subscription status?' },
  ] : []),
  { label: '🔍 Find a Vet', msg: 'Show me available vets' },
  { label: '🚨 Emergency Signs', msg: 'What are emergency signs in pets?' },
  { label: '💉 Vaccinations', msg: 'Tell me about pet vaccination schedules' },
  { label: '📝 Community Blogs', msg: 'Open community blogs' },
];

// ─── Render bold **text** ─────────────────────────────────────────────────────
const renderText = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
};

// ─── Typing dots ──────────────────────────────────────────────────────────────
const TypingDots = () => (
  <div className="flex items-center gap-1 px-1 py-0.5">
    {[0, 1, 2].map(i => (
      <motion.div key={i} className="w-2 h-2 rounded-full bg-indigo-400"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

// ─── Agent Status Banner ──────────────────────────────────────────────────────
const AgentStatus = ({ status }) => {
  if (!status) return null;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border-t border-indigo-100"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent flex-shrink-0"
      />
      <span className="text-xs text-indigo-600 font-medium">{status}</span>
    </motion.div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const AnimalHealthChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState(null);
  const [showChips, setShowChips] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { userdata, token } = useContext(AppContext);

  // ── Popup teaser ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setShowPopup(true), 3000);
    const t2 = setTimeout(() => setShowPopup(false), 9000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ── Welcome message on first open ────────────────────────────────────────
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = userdata?.name
        ? `Hey **${userdata.name}**! 👋 I'm **PawBot**, your AI assistant for PawVaidya.\n\nI can fetch your **real appointment data**, check your **pet profiles**, look up **vets**, check your **PawPoints**, and much more — just ask! 🐾`
        : `Hey there! 👋 I'm **PawBot**, your PawVaidya AI assistant.\n\nI can help you find vets, answer pet health questions, guide you through the platform, and more. Log in to unlock personalized features! 🐾`;
      setMessages([{ role: 'bot', text: greeting, ts: Date.now() }]);
    }
  }, [isOpen]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  // ── Focus input ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !isMinimized) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, isMinimized]);

  // ── Handle navigation tag in response ────────────────────────────────────
  const processNavigation = (text) => {
    const match = text.match(/\[NAVIGATE:([^\]]+)\]/);
    if (match) {
      const path = match[1];
      setTimeout(() => { navigate(path); setIsOpen(false); }, 700);
      return text.replace(/\[NAVIGATE:[^\]]+\]/, '').trim();
    }
    return text;
  };

  // ── Detect what tool the agent is likely using ────────────────────────────
  const getStatusFromMessage = (msg) => {
    const m = msg.toLowerCase();
    if (m.includes('appointment')) return '🔍 Looking up your appointments…';
    if (m.includes('pet')) return '🐾 Fetching your pet profiles…';
    if (m.includes('vet') || m.includes('doctor')) return '👨‍⚕️ Searching available vets…';
    if (m.includes('pawpoint') || m.includes('balance') || m.includes('wallet')) return '💰 Checking your PawPoints…';
    if (m.includes('subscription') || m.includes('plan')) return '🏆 Fetching subscription details…';
    if (m.includes('cancel')) return '🚫 Processing cancellation…';
    return '🤔 Agent is thinking…';
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setShowChips(false);
    const newMsg = { role: 'user', text: trimmed, ts: Date.now() };
    setMessages(prev => [...prev, newMsg]);
    setIsLoading(true);
    setAgentStatus(getStatusFromMessage(trimmed));

    try {
      // Build history in the format expected by the LLM helper
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const responseText = await LLM(trimmed, {
        messages: history
      });

      setAgentStatus(null);
      const cleaned = processNavigation(responseText);
      setMessages(prev => [...prev, { role: 'bot', text: cleaned, ts: Date.now() }]);
    } catch (err) {
      console.error('PawBot error:', err);
      setAgentStatus(null);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `Sorry, I ran into an issue 🐾 (${err?.response?.data?.message || err?.message || 'Unknown error'}). Please try again.`,
        ts: Date.now(),
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const resetChat = () => {
    setMessages([]);
    setShowChips(true);
    const greeting = userdata?.name
      ? `Hey **${userdata.name}**! 👋 I'm **PawBot**, your PawVaidya AI assistant. What can I help you with? 🐾`
      : `Hey there! 👋 I'm **PawBot**, your PawVaidya AI assistant. What can I help you with? 🐾`;
    setMessages([{ role: 'bot', text: greeting, ts: Date.now() }]);
  };

  const toggleOpen = () => {
    setIsOpen(o => !o);
    setShowPopup(false);
    setIsMinimized(false);
  };

  const quickChips = getQuickChips(!!token);

  return (
    <div className="fixed bottom-28 md:bottom-5 right-5 z-[130] flex flex-col items-end gap-3">

      {/* ── Popup teaser ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPopup && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            onClick={toggleOpen}
            className="cursor-pointer bg-white rounded-2xl shadow-2xl border border-indigo-100 px-4 py-3 max-w-[240px] text-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🐾</span>
              <span className="font-bold text-indigo-700">PawBot</span>
              <div className="ml-auto flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] text-amber-600 font-semibold">AI Agent</span>
              </div>
            </div>
            <p className="text-gray-600 text-xs leading-relaxed">
              {userdata?.name ? `Hi ${userdata.name}! ` : 'Hi there! '}
              {token ? 'Ask me about your appointments, pets & more! 🐾' : 'Need help finding a vet or navigating PawVaidya? 👋'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat window ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-[380px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
            style={{ maxHeight: isMinimized ? 'auto' : '600px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex items-center gap-3 flex-shrink-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white/10 backdrop-blur-md">
                  <img src={assets.chatbot_logo} alt="PawBot Logo" className="w-full h-full object-contain" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm">PawBot</p>
                  <span className="flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5">
                    <Zap className="w-2.5 h-2.5 text-amber-300" />
                    <span className="text-[10px] text-white/90 font-semibold">AI Agent</span>
                  </span>
                </div>
                <p className="text-indigo-200 text-xs">
                  {token ? `Logged in as ${userdata?.name || 'User'} · Personalized` : 'PawVaidya Assistant · Online'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={resetChat} title="Reset chat"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <RotateCcw className="w-3.5 h-3.5 text-white" />
                </button>
                <button onClick={() => setIsMinimized(m => !m)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5 text-white" /> : <Minimize2 className="w-3.5 h-3.5 text-white" />}
                </button>
                <button onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* Body */}
            {!isMinimized && (
              <>
                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50" style={{ minHeight: 0 }}>
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'bot' && (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden bg-transparent">
                            <img src={assets.chatbot_logo} alt="PawBot Logo" className="w-full h-full object-contain" />
                          </div>
                        )}
                        <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm'
                          : msg.isError
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 rounded-bl-sm'
                            : 'bg-white text-gray-700 border border-gray-100 rounded-bl-sm'
                          }`}>
                          {renderText(msg.text)}
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm flex-shrink-0 shadow-sm overflow-hidden">
                            {userdata?.image
                              ? <img src={userdata.image} alt="" className="w-full h-full object-cover" />
                              : '👤'}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-transparent">
                        <img src={assets.chatbot_logo} alt="PawBot Logo" className="w-full h-full object-contain" />
                      </div>
                      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                        <TypingDots />
                      </div>
                    </motion.div>
                  )}

                  {/* Quick chips */}
                  {showChips && !isLoading && messages.length <= 1 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="flex flex-wrap gap-2 pt-1">
                      {quickChips.map((chip, i) => (
                        <button key={i} onClick={() => sendMessage(chip.msg)}
                          className="text-xs bg-white border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm font-medium">
                          {chip.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Agent Status Banner */}
                <AnimatePresence>
                  {isLoading && agentStatus && <AgentStatus status={agentStatus} />}
                </AnimatePresence>

                {/* Input */}
                <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={token ? "Ask about your appointments, pets…" : "Ask anything about PawVaidya…"}
                      className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                      disabled={isLoading}
                    />
                    <motion.button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || isLoading}
                      whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex-shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 text-white" />
                    </motion.button>
                  </div>
                  <p className="text-center text-gray-400 text-[10px] mt-2 flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" /> Powered by NVIDIA NIM · DeepSeek v4 Pro
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB launcher ──────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Outer glow pulse ring */}
        {!isOpen && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(230, 201, 122, 0.4) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <motion.button
          onClick={toggleOpen}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="relative w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: 'transparent',
            boxShadow: isOpen ? 'none' : '0 8px 32px rgba(212, 175, 55, 0.25)',
          }}
        >
          <AnimatePresence mode="wait">
            {isOpen
              ? <motion.div key="close" initial={{ rotate: -90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }} className="relative z-10 w-12 h-12 bg-gradient-to-br from-[#c8860a] to-[#7a5a48] rounded-full flex items-center justify-center shadow-lg">
                <X className="w-5 h-5 text-white" strokeWidth={2.5} />
              </motion.div>
              : <motion.div key="open" initial={{ rotate: 90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: -90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }} className="relative z-10 w-16 h-16">
                <img src={assets.chatbot_logo} alt="PawBot Launcher" className="w-full h-full object-contain" />
              </motion.div>
            }
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
};

export default AnimalHealthChatbot;