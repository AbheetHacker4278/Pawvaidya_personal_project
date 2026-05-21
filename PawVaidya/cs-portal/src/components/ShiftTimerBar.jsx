import React, { useContext } from 'react';
import { CSContext } from '../context/CSContext';

const ShiftTimerPill = () => {
    const {
        shiftWorkSeconds,
        shiftSecondsRemaining,
        shiftProgress,
        shiftCompleted,
        shiftStarted,
        isBreakActive,
    } = useContext(CSContext);

    if (!shiftStarted) return null;

    const fmt = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    if (shiftCompleted) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest">SHIFT DONE</span>
            </div>
        );
    }

    const isWarning  = shiftSecondsRemaining < 3600;
    const isCritical = shiftSecondsRemaining < 1800;

    const theme = isBreakActive
        ? { pill: 'bg-amber-50/50', label: 'text-amber-500', val: 'text-amber-700', bar: 'bg-amber-400', dot: 'bg-amber-400 animate-pulse' }
        : isCritical
        ? { pill: 'bg-emerald-50/50', label: 'text-emerald-500', val: 'text-emerald-700', bar: 'bg-gradient-to-r from-emerald-400 to-emerald-600', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' }
        : isWarning
        ? { pill: 'bg-blue-50/50', label: 'text-blue-500', val: 'text-blue-700', bar: 'bg-gradient-to-r from-blue-400 to-indigo-600', dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' }
        : { pill: 'bg-slate-50/50', label: 'text-slate-400', val: 'text-slate-700', bar: 'bg-gradient-to-r from-emerald-400 to-teal-500', dot: 'bg-emerald-400' };

    return (
        <div className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl ${theme.pill} transition-all duration-500`}>
            {/* Status Indicator */}
            <div className="relative flex items-center justify-center">
                <span className={`w-2 h-2 rounded-full z-10 ${theme.dot}`} />
                {!isBreakActive && <span className={`absolute w-4 h-4 rounded-full opacity-20 animate-ping ${theme.dot}`} />}
            </div>

            <div className="flex flex-col">
                <div className="flex items-center justify-between gap-4 mb-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${theme.label}`}>
                        {isBreakActive ? 'PAUSED' : 'SHIFT LIVE'}
                    </span>
                    <span className={`font-mono text-[10px] font-black tracking-tight ${theme.val}`}>
                        {fmt(shiftSecondsRemaining)}
                    </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-24 sm:w-32 h-1 bg-slate-200/50 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${theme.bar}`}
                        style={{ width: `${shiftProgress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ShiftTimerPill;

