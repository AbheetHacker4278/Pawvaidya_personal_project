import React from 'react';
import { Network, Hash, Activity } from 'lucide-react';

const ActivePortsMonitor = ({ ports }) => {
    return (
        <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter transition-all group-hover:text-slate-500">
                Network Sentinel: Active Listening Ports
            </span>
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                {ports && ports.length > 0 ? (
                    ports.map((p, i) => (
                        <div key={i} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all group/port">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                                        <Hash size={12} />
                                    </div>
                                    <span className="text-sm font-black text-slate-700 tracking-tight">Port {p.port}</span>
                                </div>
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase">
                                    {p.protocol}
                                </span>
                            </div>
                            <div className="mt-1.5 flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                    <Activity size={10} className="text-slate-400" />
                                    <span className="text-[9px] font-bold text-slate-500 truncate max-w-[120px]">
                                        PID: {p.pid}
                                    </span>
                                </div>
                                <div className="text-[9px] font-medium text-slate-400 italic">
                                    {p.localAddress}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                        <Network size={24} className="mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">No active ports detected</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivePortsMonitor;
