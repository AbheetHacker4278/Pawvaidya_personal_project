import React from 'react'
import { FiTool, FiAlertOctagon, FiAlertTriangle, FiPhoneCall } from 'react-icons/fi'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets_frontend/assets'

const MaintenanceMode = ({ isKillSwitch, message }) => {
    const { userdata } = useContext(AppContext);
    const activePlan = userdata?.subscription?.status === 'Active' ? userdata.subscription.plan : 'None';
    const brandedLogo =
        activePlan === 'Gold' ? assets.gold_logo :
            activePlan === 'Platinum' ? assets.platinum_logo :
                activePlan === 'Silver' ? assets.silver_logo :
                    null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900 overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 overflow-hidden opacity-20">
                <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[120px] ${isKillSwitch ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                <div className={`absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[120px] ${isKillSwitch ? 'bg-rose-700 animate-pulse' : 'bg-indigo-500'}`} />
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

            {/* Content Card */}
            <div className="relative max-w-lg w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-12 text-center shadow-2xl overflow-hidden">
                {/* Animated Caution Strip */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-shimmer" />

                <div className="flex flex-col items-center">
                    {/* Icon Stage */}
                    <div className="relative mb-8">
                        <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 ${isKillSwitch ? 'bg-rose-500 animate-ping' : 'bg-amber-400'}`} />
                        <div className={`relative w-24 h-24 rounded-full flex items-center justify-center border-2 ${isKillSwitch ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' : 'bg-amber-500/10 border-amber-500/50 text-amber-500'}`}>
                            {isKillSwitch ? <FiAlertOctagon size={48} /> : <FiTool size={48} />}
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tighter uppercase">
                        {isKillSwitch ? "Service Suspended" : "System Maintenance"}
                    </h1>

                    <div className="w-12 h-1 bg-white/20 rounded-full mb-6" />

                    <p className="text-slate-300 text-lg leading-relaxed font-medium mb-8">
                        {message || (isKillSwitch ? "The platform is currently offline due to a critical system emergency. Please check back later." : "We're currently performing scheduled improvements to enhance your PawVaidya experience.")}
                    </p>

                    <div className="flex flex-col md:flex-row gap-4 w-full">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 transition-colors hover:bg-white/10">
                            <FiAlertTriangle className="text-amber-500 mx-auto mb-2" size={24} />
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Status</p>
                            <p className="text-sm font-bold text-white">{isKillSwitch ? "Emergency Halt" : "Upgrading"}</p>
                        </div>
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 transition-colors hover:bg-white/10">
                            <FiPhoneCall className="text-indigo-400 mx-auto mb-2" size={24} />
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Assistance</p>
                            <p className="text-sm font-bold text-white">support@pawvaidya.com</p>
                        </div>
                    </div>
                </div>

                {/* Branding Footer */}
                <div className="mt-12 flex items-center justify-center gap-3 opacity-40">
                    <img
                        src={brandedLogo || "/logo.png"}
                        alt="PawVaidya"
                        className={`h-6 ${!brandedLogo ? 'filter grayscale invert' : ''}`}
                    />
                    <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">PawVaidya Core Engine</p>
                </div>
            </div>

            <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite linear;
        }
      `}</style>
        </div>
    )
}

export default MaintenanceMode
