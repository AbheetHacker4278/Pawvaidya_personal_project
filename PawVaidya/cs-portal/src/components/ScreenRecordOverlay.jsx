import React, { useContext } from 'react';
import { CSContext } from '../context/CSContext';
import { FaVideo, FaShieldAlt } from 'react-icons/fa';

const ScreenRecordOverlay = () => {
    const { 
        isRecording, 
        startScreenRecording, 
        shiftStarted, 
        shiftCompleted, 
        isBreakActive, 
        isPostBreakVerification, 
        cstoken 
    } = useContext(CSContext);

    const isBypassed = localStorage.getItem('cs_isBypassed') === 'true';

    // Show overlay if:
    // 1. Shift has started
    // 2. Shift is not completed
    // 3. Not on break or post-break verification
    // 4. Employee is authenticated
    // 5. Not currently recording
    // 6. Not bypassed
    const shouldShow = shiftStarted && !shiftCompleted && !isBreakActive && !isPostBreakVerification && cstoken && !isRecording && !isBypassed;

    if (!shouldShow) return null;

    return (
        <div className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-500">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-500/10 rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

            <div className="max-w-md w-full mx-4 text-center space-y-8 relative z-10 bg-slate-900/50 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
                <div className="space-y-4">
                    <div className="mx-auto w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/10 animate-bounce">
                        <FaVideo className="text-4xl text-rose-500" />
                    </div>
                    <h2 className="text-rose-400 text-xl font-black uppercase tracking-[0.2em]">
                        Screen Recording Required
                    </h2>
                    <div className="h-0.5 w-32 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 mx-auto rounded-full"></div>
                </div>

                <div className="space-y-4 text-slate-300">
                    <p className="text-sm leading-relaxed">
                        To ensure quality support, compliance, and security, you must share and record your screen during your shift.
                    </p>
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex gap-3 text-left items-start">
                        <FaShieldAlt className="text-amber-500 text-lg shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Screen recording will automatically pause during breaks and verification, and will stop/upload once your shift is complete or upon sign-out.
                        </p>
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        onClick={startScreenRecording}
                        className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black transition-all shadow-[0_0_30px_rgba(244,63,94,0.3)] active:scale-[0.98] group"
                    >
                        <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
                        START SCREEN SHARING
                    </button>
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mt-4">
                        AWAITING MEDIA PERMISSION
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ScreenRecordOverlay;
