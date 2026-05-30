import React, { useContext, useState } from 'react';
import { CSContext } from '../context/CSContext';
import { FaPause, FaPlay, FaStop, FaPlus } from 'react-icons/fa';

const BreakOverlay = () => {
    const { isBreakActive, breakTimeRemaining, stopBreak, increaseBreak, hasReachedMax } = useContext(CSContext);
    
    if (!isBreakActive) return null;

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return {
            m: mins.toString().padStart(2, '0'),
            s: secs.toString().padStart(2, '0')
        };
    };

    const { m, s } = formatTime(breakTimeRemaining);

    return (
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 animate-in fade-in duration-700 bg-cover bg-center"
            style={{ 
                backgroundImage: "linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop')" 
            }}
        >
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[150px] animate-pulse"></div>
            
            <div className="text-center space-y-16 relative z-10">
                <div className="space-y-4">
                    <h2 className="text-emerald-400/60 text-xl font-black uppercase tracking-[0.5em] animate-pulse drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                        System Standby Mode
                    </h2>
                    <p className="text-white/40 text-xs font-bold tracking-widest uppercase">Screen Saver Active • Recording Paused</p>
                    <div className="h-1 w-32 bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-500 mx-auto rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)]"></div>
                </div>

                {/* Digital Digital Display */}
                <div className="flex gap-8 items-center justify-center font-mono">
                    <div className="flex gap-4">
                        <Digit value={m[0]} glowColor="emerald" />
                        <Digit value={m[1]} glowColor="emerald" />
                    </div>
                    
                    <div className="flex flex-col gap-4 animate-pulse">
                        <div className="w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_15px_#f59e0b]"></div>
                        <div className="w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_15px_#f59e0b]"></div>
                    </div>

                    <div className="flex gap-4">
                        <Digit value={s[0]} glowColor="amber" />
                        <Digit value={s[1]} glowColor="amber" />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-8">
                    <div className="flex gap-6">
                        {!hasReachedMax && (
                            <button 
                                onClick={() => increaseBreak(5)}
                                className="flex items-center gap-3 px-8 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-2xl font-black transition-all border border-emerald-500/30 group shadow-[0_0_20px_rgba(16,185,129,0.1)] animate-in slide-in-from-left-4 duration-500"
                            >
                                <FaPlus className="group-hover:scale-125 transition-transform" />
                                +5 MINS
                            </button>
                        )}
                        
                        <button 
                            onClick={stopBreak}
                            className="flex items-center gap-3 px-10 py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl font-black transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] group"
                        >
                            <FaStop className="group-hover:rotate-90 transition-transform" />
                            RESUME SESSION
                        </button>
                    </div>
                    
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
                        {breakTimeRemaining >= 1800 ? 'MAXIMUM DURATION REACHED' : 'AWAITING AGENT INPUT...'}
                    </p>
                </div>
            </div>
        </div>
    );
};

const Digit = ({ value, glowColor }) => {
    const isEmerald = glowColor === 'emerald';
    return (
        <div className={`relative w-28 h-44 bg-slate-900/50 rounded-2xl border border-white/5 flex items-center justify-center shadow-inner overflow-hidden group`}>
            {/* Digital Segment Background (88) */}
            <span className="absolute text-8xl font-black text-white/5 tabular-nums tracking-tighter select-none">
                8
            </span>
            {/* Active Value */}
            <span className={`relative text-8xl font-black tabular-nums tracking-tighter transition-all duration-300 ${
                isEmerald 
                ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]' 
                : 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]'
            }`}>
                {value}
            </span>
            
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] pointer-events-none"></div>
        </div>
    );
};

export default BreakOverlay;
