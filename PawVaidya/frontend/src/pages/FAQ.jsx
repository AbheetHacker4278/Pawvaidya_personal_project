import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, HelpCircle, Phone, Mail, MessageCircle } from 'lucide-react';

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

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFAQ, setOpenFAQ] = useState(null);

  const categories = [
    { id: 'all', name: 'All Questions', icon: '📚' },
    { id: 'appointments', name: 'Appointments', icon: '📅' },
    { id: 'payments', name: 'Payments', icon: '💳' },
    { id: 'pets', name: 'Pet Care', icon: '🐾' },
    { id: 'account', name: 'Account', icon: '👤' },
    { id: 'doctors', name: 'Doctors', icon: '👨‍⚕️' },
  ];

  const faqs = [
    { category: 'appointments', question: 'How do I book an appointment with a veterinarian?', answer: 'To book an appointment, log in to your account, browse available doctors, select your preferred veterinarian, choose a suitable time slot, and confirm your booking. You will receive a confirmation email and notification.' },
    { category: 'appointments', question: 'Can I cancel or reschedule my appointment?', answer: 'Yes, you can cancel or reschedule your appointment up to 24 hours before the scheduled time. Go to "My Appointments" section, select the appointment, and choose the cancel or reschedule option.' },
    { category: 'appointments', question: 'What happens if I miss my appointment?', answer: 'If you miss an appointment without prior cancellation, it may affect your ability to book future appointments. Please try to cancel at least 24 hours in advance if you cannot attend.' },
    { category: 'payments', question: 'What payment methods do you accept?', answer: 'We accept various payment methods including credit/debit cards, UPI, net banking, and digital wallets. You can also choose to pay in cash during your visit for in-person consultations.' },
    { category: 'payments', question: 'Is my payment information secure?', answer: 'Yes, all payment transactions are processed through secure, encrypted payment gateways. We do not store your complete card details on our servers.' },
    { category: 'payments', question: 'Can I get a refund if I cancel my appointment?', answer: 'Refund policies depend on when you cancel. Cancellations made 24+ hours before the appointment are eligible for full refund. Cancellations within 24 hours may incur a cancellation fee.' },
    { category: 'pets', question: 'What types of pets do you provide services for?', answer: 'We provide veterinary services for dogs, cats, birds, rabbits, and other small animals. Our network of veterinarians specializes in various pet types.' },
    { category: 'pets', question: "How do I add my pet's information to my profile?", answer: 'Go to "My Profile" section, click on "Add Pet" or "Edit Pet Information", and fill in details like pet type, breed, age, gender, and any medical history. This helps doctors provide better care.' },
    { category: 'pets', question: 'Can I book appointments for multiple pets?', answer: 'Yes, you can add multiple pets to your profile and book separate appointments for each pet. Make sure to select the correct pet when booking an appointment.' },
    { category: 'account', question: 'How do I create an account?', answer: 'Click on "Sign Up" button, provide your email, phone number, and create a password. You will receive a verification email to activate your account.' },
    { category: 'account', question: 'I forgot my password. How can I reset it?', answer: 'Click on "Forgot Password" on the login page, enter your registered email address, and you will receive a password reset link. Follow the instructions in the email to set a new password.' },
    { category: 'account', question: 'How do I update my profile information?', answer: 'Log in to your account, go to "My Profile" section, click on "Edit Profile", update your information, and save changes. You can update your name, contact details, address, and pet information.' },
    { category: 'account', question: 'Is my personal information safe?', answer: 'Yes, we take data security seriously. All personal information is encrypted and stored securely. We comply with data protection regulations and never share your information without consent.' },
    { category: 'doctors', question: 'How do I choose the right veterinarian for my pet?', answer: "You can browse doctor profiles to see their specializations, experience, ratings, and reviews. Filter doctors by specialty, location, or availability to find the best match for your pet's needs." },
    { category: 'doctors', question: 'Can I communicate with the doctor before booking?', answer: 'Yes, you can use our chat feature to ask preliminary questions to the doctor before booking an appointment. This helps you understand if the doctor is the right fit for your pet.' },
    { category: 'doctors', question: "What if I'm not satisfied with the consultation?", answer: 'If you have concerns about your consultation, please contact our support team. We take feedback seriously and will work to resolve any issues. You can also leave a review to help other pet owners.' },
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (index) => setOpenFAQ(openFAQ === index ? null : index);

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

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 border border-white/20"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
          >
            <HelpCircle className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Frequently Asked Questions
          </h1>
          <div className="h-1 w-20 rounded-full mx-auto mb-3"
            style={{ background: `linear-gradient(to right, ${B.amber}, #e8a020)` }} />
          <p className="text-amber-200 text-base md:text-lg">
            Find answers to common questions about PawVaidya services, appointments, and pet care
          </p>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4">

        {/* ── Search Bar ────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="relative max-w-2xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: B.light }} />
          <input
            type="text"
            placeholder="Search for answers…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm outline-none transition-all"
            style={{
              background: 'rgba(237, 228, 216, 0.85)',
              backdropFilter: 'blur(16px)',
              border: `2px solid ${B.sand}`,
              color: B.dark,
              boxShadow: '0 2px 12px rgba(90,64,53,0.08)',
            }}
            onFocus={e => e.target.style.borderColor = B.mid}
            onBlur={e => e.target.style.borderColor = B.sand}
          />
        </motion.div>

        {/* ── Category Pills ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-2.5 mb-10">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className="px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm"
              style={activeCategory === cat.id
                ? { background: `linear-gradient(135deg, ${B.mid}, ${B.light})`, color: '#fff', boxShadow: `0 4px 14px ${B.mid}55` }
                : { background: 'rgba(237, 228, 216, 0.85)', backdropFilter: 'blur(16px)', color: B.mid, border: `1.5px solid ${B.sand}` }
              }
            >
              <span className="mr-1.5">{cat.icon}</span>
              {cat.name}
            </motion.button>
          ))}
        </motion.div>

        {/* ── FAQ Accordion ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="space-y-3 mb-12">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.04 }}
                className="rounded-2xl overflow-hidden border transition-shadow"
                style={{
                  background: 'rgba(237, 228, 216, 0.85)',
                  backdropFilter: 'blur(16px)',
                  borderColor: openFAQ === index ? B.mid : B.sand,
                  boxShadow: openFAQ === index
                    ? `0 4px 20px rgba(90,64,53,0.12)`
                    : '0 1px 6px rgba(90,64,53,0.06)',
                }}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors"
                  style={{ background: openFAQ === index ? B.pale : 'transparent' }}
                >
                  <span className="text-base font-semibold pr-4" style={{ color: B.dark }}>
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openFAQ === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-5 h-5" style={{ color: B.mid }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFAQ === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-1">
                        <div className="h-px mb-4" style={{ background: `linear-gradient(to right, ${B.sand}, ${B.amber}55, ${B.sand})` }} />
                        <p className="text-sm leading-relaxed" style={{ color: B.light }}>
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <p className="text-lg" style={{ color: B.light }}>No FAQs found matching your search.</p>
            </motion.div>
          )}
        </motion.div>

        {/* ── Still Have Questions Banner ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-3xl p-8 md:p-10 text-white shadow-2xl"
          style={{ background: `linear-gradient(135deg, ${B.dark} 0%, ${B.mid} 60%, ${B.light} 100%)` }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Still have questions?</h2>
            <p className="text-amber-200">Our support team is here to help you 24/7</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: <Phone className="w-8 h-8 mx-auto mb-2" />, title: 'Call Us', sub: '+91 1800-123-4567' },
              { icon: <Mail className="w-8 h-8 mx-auto mb-2" />, title: 'Email Us', sub: 'support@pawvaidya.com' },
              { icon: <MessageCircle className="w-8 h-8 mx-auto mb-2" />, title: 'Live Chat', sub: 'Chat with our team' },
            ].map((item, i) => (
              <motion.div key={i} whileHover={{ scale: 1.05, y: -4 }}
                className="rounded-2xl p-5 text-center border border-white/15"
                style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)' }}>
                {item.icon}
                <h3 className="font-semibold text-base mb-1">{item.title}</h3>
                <p className="text-amber-200 text-sm">{item.sub}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
