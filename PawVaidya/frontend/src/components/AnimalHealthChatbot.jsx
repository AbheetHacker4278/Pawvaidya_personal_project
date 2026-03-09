import React, { useState, useEffect, useRef, useContext } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Minimize2, Maximize2, RotateCcw, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

// ─── Premium SVG Paw Icon ─────────────────────────────────────────────────────
const PawIcon = ({ size = 28, color = 'white' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Toe beans */}
    <ellipse cx="16" cy="14" rx="6" ry="8" fill={color} opacity="0.95" />
    <ellipse cx="32" cy="9" rx="6" ry="8" fill={color} opacity="0.95" />
    <ellipse cx="48" cy="14" rx="6" ry="8" fill={color} opacity="0.95" />
    <ellipse cx="8" cy="30" rx="5" ry="7" fill={color} opacity="0.95" />
    {/* Main pad */}
    <ellipse cx="32" cy="42" rx="18" ry="16" fill={color} opacity="0.95" />
  </svg>
);

// ─── Gemini setup ─────────────────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_API_KEY_GEMINI_2;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ─── System prompt (prepended to every request) ───────────────────────────────
const SYSTEM_PROMPT = `You are PawBot, the official AI assistant for PawVaidya — a veterinary consultancy platform for pet owners in India.

PERSONALITY: Friendly, warm, professional. Use emojis occasionally 🐾. Keep responses concise (2-4 sentences max). Be proactive and helpful.

PAWVAIDYA FEATURES:
1. Find Doctors (/doctors) — Browse vets by speciality & location. Specialities: Small Animal Vet, Avian Vet, Marine Vet, Exotic Vet, Large Animal Vet, Military Vet.
2. Book Appointments (/appointment/:docId) — Choose date/time slots, payment supported.
3. My Appointments (/my-appointments) — View upcoming, completed, cancelled appointments.
4. My Profile (/my-profile) — Update personal info, pet details (name, type, breed, age), profile picture.
5. Community Blogs (/community-blogs) — Read/write pet care articles, like, comment, share.
6. Quick Chats (/quick-chats) — Real-time messaging with doctors.
7. Live Streams (/live-streams) — Watch live vet sessions and Q&A.
8. FAQ (/faq), About (/about), Contact (/contact).

NAVIGATION: When user wants to go somewhere, end your reply with [NAVIGATE:/path]. Examples:
- "show doctors" → [NAVIGATE:/doctors]
- "my appointments" → [NAVIGATE:/my-appointments]
- "blogs" → [NAVIGATE:/community-blogs]
- "my profile" → [NAVIGATE:/my-profile]
- "home" → [NAVIGATE:/]
- "faq" → [NAVIGATE:/faq]
- "contact" → [NAVIGATE:/contact]
- "about" → [NAVIGATE:/about]
- "quick chats" → [NAVIGATE:/quick-chats]
- "live streams" → [NAVIGATE:/live-streams]

VETERINARY KNOWLEDGE: Answer questions about pet illnesses, nutrition, vaccinations, emergency signs, general care for dogs, cats, birds, fish, reptiles, etc.

RULES: Never make up doctor names. For emergencies, urgently recommend visiting a vet. Encourage booking appointments for medical concerns. Do NOT use markdown ## headers in responses. Keep it conversational.`;

// ─── Quick suggestion chips ───────────────────────────────────────────────────
const QUICK_CHIPS = [
  { label: '🔍 Find Doctors', msg: 'Show me available doctors' },
  { label: '📅 My Appointments', msg: 'Take me to my appointments' },
  { label: '📝 Community Blogs', msg: 'Open community blogs' },
  { label: '🐾 Pet Care Tips', msg: 'Give me general pet care tips' },
  { label: '🚨 Emergency Signs', msg: 'What are emergency signs in pets?' },
  { label: '💉 Vaccinations', msg: 'Tell me about pet vaccination schedules' },
  { label: '📞 Contact Support', msg: 'How do I contact PawVaidya support?' },
  { label: '❓ How to Book', msg: 'How do I book an appointment?' },
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

// ─── Main component ───────────────────────────────────────────────────────────
const AnimalHealthChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const bottomRef = useRef(null);
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
        ? `Hey ${userdata.name}! 👋 I'm **PawBot**, your PawVaidya assistant. I can help you find doctors, book appointments, answer pet health questions, and guide you through the platform. What can I help you with? 🐾`
        : `Hey there! 👋 I'm **PawBot**, your PawVaidya assistant. I can help you find doctors, book appointments, answer pet health questions, and guide you through the platform. What can I help you with? 🐾`;
      setMessages([{ role: 'bot', text: greeting, ts: Date.now() }]);
    }
  }, [isOpen]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  // ── Build conversation history for Gemini ────────────────────────────────
  const buildPrompt = (userMsg) => {
    // Build a full conversation string with system context prepended
    const history = messages
      .map(m => `${m.role === 'user' ? 'User' : 'PawBot'}: ${m.text}`)
      .join('\n');
    return `${SYSTEM_PROMPT}\n\n${history ? `Conversation so far:\n${history}\n\n` : ''}User: ${userMsg}\nPawBot:`;
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setShowChips(false);
    setMessages(prev => [...prev, { role: 'user', text: trimmed, ts: Date.now() }]);
    setIsLoading(true);

    try {
      const prompt = buildPrompt(trimmed);
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const cleaned = processNavigation(raw);

      setMessages(prev => [...prev, { role: 'bot', text: cleaned, ts: Date.now() }]);
    } catch (err) {
      console.error('PawBot error:', err);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `Sorry, I ran into an issue 🐾 (${err?.message || 'Unknown error'}). Please try again.`,
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
    // Re-trigger welcome
    const greeting = userdata?.name
      ? `Hey ${userdata.name}! 👋 I'm **PawBot**, your PawVaidya assistant. What can I help you with? 🐾`
      : `Hey there! 👋 I'm **PawBot**, your PawVaidya assistant. What can I help you with? 🐾`;
    setMessages([{ role: 'bot', text: greeting, ts: Date.now() }]);
  };

  const toggleOpen = () => {
    setIsOpen(o => !o);
    setShowPopup(false);
    setIsMinimized(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3">

      {/* ── Popup teaser ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPopup && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            onClick={toggleOpen}
            className="cursor-pointer bg-white rounded-2xl shadow-2xl border border-indigo-100 px-4 py-3 max-w-[220px] text-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🐾</span>
              <span className="font-bold text-indigo-700">PawBot</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-auto" />
            </div>
            <p className="text-gray-600 text-xs leading-relaxed">
              {userdata?.name ? `Hi ${userdata.name}! ` : 'Hi there! '}Need help finding a vet or navigating PawVaidya? 👋
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
            className="w-[370px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
            style={{ maxHeight: isMinimized ? 'auto' : '580px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex items-center gap-3 flex-shrink-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                  <PawIcon size={22} color="white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">PawBot</p>
                <p className="text-indigo-200 text-xs">PawVaidya AI Assistant · Online</p>
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
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50" style={{ minHeight: 0 }}>
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'bot' && (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                            <PawIcon size={14} color="white" />
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
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm flex-shrink-0">🐾</div>
                      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                        <TypingDots />
                      </div>
                    </motion.div>
                  )}

                  {/* Quick chips */}
                  {showChips && !isLoading && messages.length <= 1 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="flex flex-wrap gap-2 pt-1">
                      {QUICK_CHIPS.map((chip, i) => (
                        <button key={i} onClick={() => sendMessage(chip.msg)}
                          className="text-xs bg-white border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm font-medium">
                          {chip.label}
                        </button>
                      ))}
                    </motion.div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything about PawVaidya…"
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
                    <Sparkles className="w-3 h-3" /> Powered by Gemini AI
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
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <motion.button
          onClick={toggleOpen}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          className="relative w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(145deg, #7c3aed, #4f46e5)',
            boxShadow: '0 8px 32px rgba(109,40,217,0.5), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          {/* Frosted glass inner ring */}
          <div className="absolute inset-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(4px)' }} />
          <AnimatePresence mode="wait">
            {isOpen
              ? <motion.div key="close" initial={{ rotate: -90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }} className="relative z-10">
                <X className="w-6 h-6 text-white" strokeWidth={2.5} />
              </motion.div>
              : <motion.div key="open" initial={{ rotate: 90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: -90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }} className="relative z-10">
                <PawIcon size={30} color="white" />
              </motion.div>
            }
          </AnimatePresence>
          {/* Online dot */}
          {!isOpen && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default AnimalHealthChatbot;