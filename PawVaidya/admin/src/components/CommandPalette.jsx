import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminContext } from '../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const { atoken, backendurl } = useContext(AdminContext);
    const navigate = useNavigate();
    const inputRef = useRef(null);

    // Keyboard shortcut handler (⌘K or Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Fetch results
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const { data } = await axios.get(`${backendurl}/api/admin/omni-search?query=${query}`, {
                    headers: { atoken }
                });
                if (data.success) {
                    setResults(data.results);
                    setSelectedIndex(0);
                }
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, isOpen, backendurl, atoken]);

    // Handle selection
    const handleSelect = (result) => {
        setIsOpen(false);
        navigate(result.link);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden mx-4"
                        onKeyDown={handleKeyDown}
                    >
                        <div className="flex items-center px-4 py-3 border-b border-slate-100">
                            <span className="text-xl mr-3">🔍</span>
                            <input
                                ref={inputRef}
                                autoFocus
                                type="text"
                                placeholder="Search everything... (⌘K to close)"
                                className="flex-1 bg-transparent border-none outline-none text-slate-800 font-medium placeholder:text-slate-400"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            {loading && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {results.length > 0 ? (
                                <div className="space-y-1">
                                    {results.map((result, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleSelect(result)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${idx === selectedIndex ? 'bg-indigo-50 border-indigo-100 shadow-sm' : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-lg">
                                                    {result.image ? (
                                                        <img src={result.image} alt="" className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        <span>{result.icon || '📄'}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${idx === selectedIndex ? 'text-indigo-900' : 'text-slate-700'}`}>{result.name}</p>
                                                    {result.subtext && <p className="text-[10px] text-slate-400 font-medium">{result.subtext}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${result.type === 'Page' ? 'bg-amber-100 text-amber-700' :
                                                    result.type === 'Doctor' ? 'bg-emerald-100 text-emerald-700' :
                                                        result.type === 'Patient' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {result.type}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : query.length >= 2 ? (
                                <div className="py-12 text-center">
                                    <span className="text-4xl">🏜️</span>
                                    <p className="text-slate-500 font-medium mt-3">No results found for "{query}"</p>
                                    <p className="text-slate-400 text-xs mt-1">Try searching for a name, email, or page name.</p>
                                </div>
                            ) : (
                                <div className="py-8 px-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quick Navigation</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { name: 'Dashboard', icon: '📊', link: '/' },
                                            { name: 'Admin Logs', icon: '🛡️', link: '/admin-logs' },
                                            { name: 'Doctors', icon: '👨‍⚕️', link: '/doctor-list' },
                                            { name: 'Users', icon: '👥', link: '/total-users' }
                                        ].map((item, i) => (
                                            <div key={i} onClick={() => navigate(item.link)} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 cursor-pointer transition-all">
                                                <span>{item.icon}</span>
                                                <span className="text-xs font-bold text-slate-600">{item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 px-4 py-2 flex items-center justify-between border-t border-slate-100">
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-sm">↵</kbd> Select
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-sm">↑↓</kbd> Navigate
                                </div>
                            </div>
                            <div className="text-[9px] font-bold text-slate-300">
                                PawVaidya Omni-Search v1.0
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
