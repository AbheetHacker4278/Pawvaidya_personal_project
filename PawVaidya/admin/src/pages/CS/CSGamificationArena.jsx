import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';
import { 
  Trophy, 
  Sparkles, 
  ShieldAlert, 
  Award, 
  Coins, 
  Zap, 
  CheckCircle, 
  Star, 
  User, 
  Clock, 
  MessageSquare, 
  ChevronRight, 
  Flame, 
  HelpCircle,
  TrendingUp,
  Sliders,
  DollarSign
} from 'lucide-react';

const CSGamificationArena = () => {
  const { atoken } = useContext(AdminContext);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const [loading, setLoading] = useState(false);
  const [submittingReward, setSubmittingReward] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Reward Form State
  const [rewardType, setRewardType] = useState('badge'); // badge, bonus, other
  const [rewardValue, setRewardValue] = useState(''); // Badge title or Bonus amount
  const [rewardMessage, setRewardMessage] = useState('');
  const [xpBonus, setXpBonus] = useState(100);

  // Badge list presets
  const badgePresets = [
    { label: '⚡ Speed Demon', value: 'Speed Demon' },
    { label: '🏆 Customer Champion', value: 'Customer Champion' },
    { label: '🎸 CS Rockstar', value: 'CS Rockstar' },
    { label: '💰 Clawback King', value: 'Clawback King' },
    { label: '🧩 Problem Solver', value: 'Problem Solver' },
    { label: '🐾 Patient Savior', value: 'Patient Savior' }
  ];

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/cs-gamification/race-arena`, {
        headers: { atoken }
      });
      if (data.success) {
        setAgents(data.agents);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to load CS agents statistics');
    } finally {
      setLoading(false);
    }
  };



  const handleAwardReward = async (e) => {
    e.preventDefault();
    if (!selectedAgent) return;
    if (!rewardValue) return toast.warn('Please enter or select a reward value');

    try {
      setSubmittingReward(true);
      const { data } = await axios.post(`${backendUrl}/api/cs-gamification/award-reward`, {
        employeeId: selectedAgent._id,
        type: rewardType,
        value: rewardValue,
        message: rewardMessage,
        xpBonus: Number(xpBonus)
      }, {
        headers: { atoken }
      });

      if (data.success) {
        toast.success(data.message || 'Reward successfully granted!');
        // Update selected agent detail
        setSelectedAgent(data.employee);
        // Reset form
        setRewardValue('');
        setRewardMessage('');
        setXpBonus(100);
        // Refresh grid
        fetchAgents();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to grant reward');
    } finally {
      setSubmittingReward(false);
    }
  };

  useEffect(() => {
    fetchAgents();

    const socket = io(backendUrl, {
      withCredentials: true,
      transports: ['polling', 'websocket']
    });

    socket.on('gamification-update', (data) => {
      console.log('Real-time gamification update received:', data);
      fetchAgents();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Compute maximum XP to calculate relative positions on track
  const maxXP = agents.length > 0 ? Math.max(...agents.map(a => a.xpPoints || 1)) : 1000;
  
  // Sort agents into Podium rankings (Top 3)
  const podiumAgents = [...agents].sort((a, b) => b.xpPoints - a.xpPoints).slice(0, 3);
  
  // The rest of the agents list
  const trackAgents = [...agents].sort((a, b) => b.xpPoints - a.xpPoints);

  const getRankBadgeColor = (rank) => {
    switch (rank?.toLowerCase()) {
      case 'diamond': return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'platinum': return 'bg-violet-100 text-violet-800 border-violet-300';
      case 'gold': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'silver': return 'bg-slate-100 text-slate-800 border-slate-300';
      default: return 'bg-orange-100 text-orange-800 border-orange-300';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-950 to-green-950 p-6 rounded-2xl border border-emerald-900 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            🏆 CS Gamification & Performance Arena
          </h1>
          <p className="text-emerald-400 text-xs mt-1 uppercase tracking-widest font-semibold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Live Customer Support Racing Grid & Incentives Suite
          </p>
        </div>
      </div>

      {loading && agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider">Loading Arena Coordinates...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* PODIUM & TOP PERFORMERS */}
          {podiumAgents.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* 2ND PLACE */}
              {podiumAgents[1] && (
                <div 
                  onClick={() => setSelectedAgent(podiumAgents[1])}
                  className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col items-center justify-between relative overflow-hidden group"
                >
                  <div className="absolute top-2 right-2 text-3xl font-black text-slate-100">#2</div>
                  <div className="text-center space-y-3 flex-1 flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-slate-300 overflow-hidden shadow-inner bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-lg">
                        {podiumAgents[1].profilePic ? (
                          <img src={podiumAgents[1].profilePic} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{podiumAgents[1].name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="absolute -top-2 -right-1 text-xl">🥈</span>
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${podiumAgents[1].isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-emerald-600 transition">{podiumAgents[1].name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{podiumAgents[1].email}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getRankBadgeColor(podiumAgents[1].rank)}`}>
                        {podiumAgents[1].rank} (Lvl {podiumAgents[1].level})
                      </span>
                    </div>
                  </div>
                  <div className="w-full border-t border-slate-50 pt-3 mt-4 grid grid-cols-2 text-center text-xs">
                    <div className="border-r border-slate-100">
                      <span className="text-slate-400 text-[10px] font-semibold block">Tickets</span>
                      <span className="font-black text-slate-700">{podiumAgents[1].totalTicketsResolved}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-semibold block">Rating</span>
                      <span className="font-black text-amber-500 flex items-center justify-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                        {podiumAgents[1].averageRating ? podiumAgents[1].averageRating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3.5">
                    <div className="bg-slate-400 h-full rounded-full" style={{ width: `${Math.max(15, (podiumAgents[1].xpPoints / maxXP) * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1.5">{podiumAgents[1].xpPoints} XP Total</p>
                </div>
              )}

              {/* 1ST PLACE */}
              {podiumAgents[0] && (
                <div 
                  onClick={() => setSelectedAgent(podiumAgents[0])}
                  className="bg-gradient-to-b from-amber-50/50 to-white/90 backdrop-blur-sm border-2 border-amber-300/60 rounded-2xl p-6 shadow-md hover:shadow-lg cursor-pointer transition flex flex-col items-center justify-between relative overflow-hidden group scale-105"
                >
                  <div className="absolute top-2 right-2 text-3xl font-black text-amber-100">#1</div>
                  <div className="text-center space-y-3 flex-1 flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-amber-400 overflow-hidden shadow-md bg-slate-50 flex items-center justify-center font-bold text-amber-500 text-xl">
                        {podiumAgents[0].profilePic ? (
                          <img src={podiumAgents[0].profilePic} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{podiumAgents[0].name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-2xl animate-bounce">👑</span>
                      <span className={`absolute bottom-0 right-1 w-4 h-4 rounded-full border-2 border-white ${podiumAgents[0].isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-base group-hover:text-amber-600 transition flex items-center justify-center gap-1">
                        {podiumAgents[0].name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{podiumAgents[0].email}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase border bg-amber-100 text-amber-800 border-amber-400">
                        ⭐ {podiumAgents[0].rank} (Lvl {podiumAgents[0].level})
                      </span>
                    </div>
                  </div>
                  <div className="w-full border-t border-amber-100 pt-3 mt-4 grid grid-cols-2 text-center text-xs">
                    <div className="border-r border-amber-100">
                      <span className="text-slate-400 text-[10px] font-semibold block">Tickets</span>
                      <span className="font-black text-slate-700">{podiumAgents[0].totalTicketsResolved}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-semibold block">Rating</span>
                      <span className="font-black text-amber-500 flex items-center justify-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                        {podiumAgents[0].averageRating ? podiumAgents[0].averageRating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3.5">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: '100%' }} />
                  </div>
                  <p className="text-[10px] text-amber-600 font-black mt-1.5">{podiumAgents[0].xpPoints} XP Total</p>
                </div>
              )}

              {/* 3RD PLACE */}
              {podiumAgents[2] && (
                <div 
                  onClick={() => setSelectedAgent(podiumAgents[2])}
                  className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col items-center justify-between relative overflow-hidden group"
                >
                  <div className="absolute top-2 right-2 text-3xl font-black text-slate-100">#3</div>
                  <div className="text-center space-y-3 flex-1 flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-amber-600/50 overflow-hidden shadow-inner bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-lg">
                        {podiumAgents[2].profilePic ? (
                          <img src={podiumAgents[2].profilePic} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{podiumAgents[2].name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="absolute -top-2 -right-1 text-xl">🥉</span>
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${podiumAgents[2].isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-emerald-600 transition">{podiumAgents[2].name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{podiumAgents[2].email}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getRankBadgeColor(podiumAgents[2].rank)}`}>
                        {podiumAgents[2].rank} (Lvl {podiumAgents[2].level})
                      </span>
                    </div>
                  </div>
                  <div className="w-full border-t border-slate-50 pt-3 mt-4 grid grid-cols-2 text-center text-xs">
                    <div className="border-r border-slate-100">
                      <span className="text-slate-400 text-[10px] font-semibold block">Tickets</span>
                      <span className="font-black text-slate-700">{podiumAgents[2].totalTicketsResolved}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-semibold block">Rating</span>
                      <span className="font-black text-amber-500 flex items-center justify-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                        {podiumAgents[2].averageRating ? podiumAgents[2].averageRating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3.5">
                    <div className="bg-amber-600 h-full rounded-full" style={{ width: `${Math.max(15, (podiumAgents[2].xpPoints / maxXP) * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1.5">{podiumAgents[2].xpPoints} XP Total</p>
                </div>
              )}

            </div>
          )}

          {/* THE LIVE RACING GRID TRACK */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden relative">
            <h3 className="text-base font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
              🏎️ Live Arena Speedway
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              Agents advance forward in real-time on the speedway lanes based on their accumulated XP Points. Click an agent's racecar to review stats or award achievements.
            </p>

            <div className="relative border-t border-b border-slate-200 bg-slate-900 rounded-2xl p-4 md:p-6 overflow-x-auto min-w-[700px] shadow-inner">
              
              {/* Racetrack Lanes */}
              <div className="space-y-4 relative z-10">
                {trackAgents.map((agent, index) => {
                  const relativePos = Math.max(5, Math.min(92, (agent.xpPoints / maxXP) * 100));
                  return (
                    <div 
                      key={agent._id} 
                      onClick={() => setSelectedAgent(agent)}
                      className="flex items-center h-14 border-b border-slate-800/80 last:border-0 relative group cursor-pointer"
                    >
                      {/* Lane Number */}
                      <span className="text-slate-700 text-xs font-black w-8 text-center border-r border-slate-800 select-none">
                        LANE {index + 1}
                      </span>
                      
                      {/* The road dashes */}
                      <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-0.5 border-t border-dashed border-slate-800 pointer-events-none" />

                      {/* Racing Car/Avatar */}
                      <div 
                        className="absolute flex items-center gap-2 transition-all duration-1000 ease-out hover:scale-105"
                        style={{ left: `${relativePos}%` }}
                      >
                        <div className="relative flex flex-col items-center">
                          {/* Mini Tooltip */}
                          <div className="absolute -top-8 px-2 py-0.5 bg-emerald-600 text-[9px] text-white font-extrabold rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-md pointer-events-none z-20">
                            {agent.name} ({agent.xpPoints} XP)
                          </div>

                          {/* Avatar Circle representing the Driver */}
                          <div className={`w-10 h-10 rounded-full border-2 overflow-hidden shadow-md flex items-center justify-center font-black text-xs relative
                            ${agent.isOnline ? 'border-emerald-400 bg-emerald-950 text-emerald-400 ring-2 ring-emerald-500/20' : 'border-slate-500 bg-slate-800 text-slate-400'}
                          `}>
                            {agent.profilePic ? (
                              <img src={agent.profilePic} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{agent.name.charAt(0)}</span>
                            )}
                          </div>
                          
                          {/* Racer Vehicle Indicator */}
                          <div className="text-sm mt-0.5 drop-shadow-md select-none animate-bounce" style={{ animationDuration: `${1.5 + (index % 3) * 0.3}s` }}>
                            {index === 0 ? '🏎️' : index === 1 ? '🏍️' : index === 2 ? '🏁' : '🚀'}
                          </div>
                        </div>
                        
                        <div className="hidden lg:flex flex-col text-[10px] bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded border border-slate-800 text-slate-300 max-w-[120px] truncate shadow">
                          <span className="font-extrabold text-slate-100 truncate">{agent.name}</span>
                          <span className="text-[8px] text-slate-400 font-bold">Lvl {agent.level} • {agent.rank}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Finish Line Overlay */}
              <div className="absolute right-10 top-0 bottom-0 w-8 border-l border-dashed border-red-500/40 flex flex-col justify-between items-center py-4 pointer-events-none z-0">
                <span className="text-red-500/70 font-black text-[9px] uppercase tracking-widest rotate-90 whitespace-nowrap">FINISH SPEEDWAY</span>
                <span className="text-base select-none">🏁</span>
                <span className="text-red-500/70 font-black text-[9px] uppercase tracking-widest rotate-90 whitespace-nowrap">FINISH SPEEDWAY</span>
              </div>
            </div>
          </div>

          {/* ACTIVE DOSSIER & AWARD DIALOG */}
          {selectedAgent && (
            <div className="grid md:grid-cols-3 gap-6 animate-fadeIn">
              
              {/* Agent Stats & unlocked achievements */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 md:col-span-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full border-2 border-emerald-500 overflow-hidden bg-slate-50 flex items-center justify-center font-bold text-slate-700 text-lg">
                      {selectedAgent.profilePic ? (
                        <img src={selectedAgent.profilePic} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{selectedAgent.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-base">{selectedAgent.name}</h3>
                      <p className="text-xs text-slate-400 font-bold">{selectedAgent.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedAgent(null)}
                    className="px-2.5 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 border border-slate-100 rounded-lg hover:bg-slate-50 transition"
                  >
                    Close Dossier
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Rank Status</span>
                    <span className="font-black text-emerald-800 text-sm">{selectedAgent.rank || 'Bronze'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Total Experience</span>
                    <span className="font-black text-slate-800 text-sm">{selectedAgent.xpPoints || 0} XP</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Resolved Tickets</span>
                    <span className="font-black text-slate-800 text-sm">{selectedAgent.totalTicketsResolved || 0}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Incentive Accrued</span>
                    <span className="font-black text-slate-800 text-sm">
                      ${selectedAgent.adminIncentive?.amount || 0}
                    </span>
                  </div>
                </div>

                {/* Level Progress */}
                <div className="bg-emerald-50/30 border border-emerald-100/40 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-emerald-800">LEVEL {selectedAgent.level || 1}</span>
                    <span className="text-emerald-600">{(selectedAgent.xpPoints || 0) % 1000} / 1000 XP to next level</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${((selectedAgent.xpPoints || 0) % 1000) / 10}%` }} />
                  </div>
                </div>

                {/* Unlocked Badges / Rewards History */}
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3 flex items-center gap-1">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Unlocked Badges & Special Incentives ({selectedAgent.rewards?.length || 0})
                  </h4>
                  {(!selectedAgent.rewards || selectedAgent.rewards.length === 0) ? (
                    <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400 font-semibold italic">
                      No badges or bonuses granted yet. Use the reward panel to onboard achievements!
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                      {selectedAgent.rewards.map((reward, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm flex items-start gap-3 hover:border-emerald-100/80 transition">
                          <span className="text-2xl pt-0.5">
                            {reward.type === 'badge' ? '🎖️' : reward.type === 'bonus' ? '💰' : '🎁'}
                          </span>
                          <div>
                            <h5 className="font-extrabold text-slate-800 text-xs">{reward.value}</h5>
                            {reward.message && <p className="text-[10px] text-slate-500 italic mt-0.5">"{reward.message}"</p>}
                            <span className="text-[9px] text-slate-400 font-semibold mt-1.5 block">
                              Granted: {new Date(reward.grantedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reward configurator form */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 h-fit">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Grant Achievement Suite
                </h3>

                <form onSubmit={handleAwardReward} className="space-y-4">
                  
                  {/* Select Reward Type */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Reward Class</label>
                    <div className="grid grid-cols-3 bg-slate-50 p-1 rounded-xl border border-slate-100">
                      {[
                        { id: 'badge', label: 'Badge', icon: '🎖️' },
                        { id: 'bonus', label: 'Incentive', icon: '💰' },
                        { id: 'other', label: 'Other', icon: '🎁' }
                      ].map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            setRewardType(type.id);
                            setRewardValue('');
                          }}
                          className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${rewardType === type.id
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <span className="text-xs">{type.icon}</span>
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reward Value */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      {rewardType === 'badge' ? 'Select Badge Preset' : rewardType === 'bonus' ? 'Cash Bonus Value ($)' : 'Reward Detail'}
                    </label>

                    {rewardType === 'badge' ? (
                      <select
                        value={rewardValue}
                        onChange={e => setRewardValue(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-bold text-slate-700"
                      >
                        <option value="">-- Choose Badge --</option>
                        {badgePresets.map((preset, i) => (
                          <option key={i} value={preset.value}>{preset.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={rewardType === 'bonus' ? 'number' : 'text'}
                        placeholder={rewardType === 'bonus' ? 'e.g. 50' : 'e.g. Extra day off token'}
                        value={rewardValue}
                        onChange={e => setRewardValue(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    )}
                  </div>

                  {/* XP Boost */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Experience (XP) Boost</label>
                    <select
                      value={xpBonus}
                      onChange={e => setXpBonus(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-bold text-slate-700"
                    >
                      <option value={0}>0 XP (No Boost)</option>
                      <option value={50}>+50 XP (Minor Accomplishment)</option>
                      <option value={100}>+100 XP (Standard Milestone)</option>
                      <option value={250}>+250 XP (Major Win)</option>
                      <option value={500}>+500 XP (Unstoppable MVP)</option>
                    </select>
                  </div>

                  {/* Congratulatory Message */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Dossier Citation Note</label>
                    <textarea
                      placeholder="Citation message for agent portal feed..."
                      value={rewardMessage}
                      onChange={e => setRewardMessage(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      rows="3"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReward}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-bold py-2.5 rounded-lg text-xs transition shadow-md flex items-center justify-center gap-1.5"
                  >
                    {submittingReward ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Deploy Award to Employee
                  </button>

                </form>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default CSGamificationArena;
