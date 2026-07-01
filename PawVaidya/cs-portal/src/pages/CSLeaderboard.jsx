import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { CSContext } from '../context/CSContext';
import { FaTrophy, FaRedo, FaStar, FaAward, FaBolt, FaChevronRight, FaCrown } from 'react-icons/fa';

const CSLeaderboard = () => {
  const { employee, cstoken } = useContext(CSContext);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/cs-gamification/leaderboard`);
      if (data.success) {
        setAgents(data.leaderboard);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to load active speedway standings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    const socket = io(backendUrl, {
      withCredentials: true,
      transports: ['polling', 'websocket']
    });

    socket.on('gamification-update', (data) => {
      console.log('Real-time gamification update received:', data);
      fetchLeaderboard();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const maxXP = agents.length > 0 ? Math.max(...agents.map(a => a.xpPoints || 1)) : 1000;
  const podiumAgents = [...agents].slice(0, 3);
  const myPerformance = agents.find(a => a._id === employee?._id);

  const getRankBadgeColor = (rank) => {
    switch (rank?.toLowerCase()) {
      case 'diamond': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'platinum': return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'gold': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'silver': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-orange-50 text-orange-700 border-orange-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-emerald-800 to-green-700 p-6 rounded-3xl border border-emerald-600 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            🏁 CS Speedway Leaderboard
          </h1>
          <p className="text-emerald-100 text-[11px] mt-1 uppercase tracking-widest font-black flex items-center gap-1.5">
            <FaBolt className="text-amber-300 animate-pulse" />
            Compete with peers, resolve complaints, and level up!
          </p>
        </div>
        
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="relative z-10 flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-50 text-white text-xs font-black rounded-2xl transition border border-white/10 shadow-sm"
        >
          <FaRedo className={`${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Syncing Arena Telemetry...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* PODIUM STANDINGS */}
          {podiumAgents.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* 2ND PLACE */}
              {podiumAgents[1] && (
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col items-center justify-between relative overflow-hidden">
                  <div className="absolute top-3 right-4 text-3xl font-black text-slate-100">#2</div>
                  <div className="text-center space-y-3 flex-1 flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl border-2 border-slate-300 overflow-hidden shadow-inner bg-slate-50 flex items-center justify-center font-bold text-slate-400">
                        {podiumAgents[1].profilePic ? (
                          <img src={podiumAgents[1].profilePic} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{podiumAgents[1].name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="absolute -top-2 -right-1.5 text-lg">🥈</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{podiumAgents[1].name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Level {podiumAgents[1].level} • {podiumAgents[1].rank}</p>
                    </div>
                  </div>
                  <div className="w-full border-t border-slate-50 pt-3 mt-4 flex justify-around text-center text-xs">
                    <div>
                      <span className="text-slate-400 text-[9px] font-bold block uppercase">Tickets</span>
                      <span className="font-black text-slate-700">{podiumAgents[1].totalTicketsResolved}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] font-bold block uppercase">Rating</span>
                      <span className="font-black text-amber-500 flex items-center justify-center gap-0.5">
                        <FaStar className="text-amber-400" />
                        {podiumAgents[1].averageRating ? podiumAgents[1].averageRating.toFixed(1) : '0.0'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-black mt-3">{podiumAgents[1].xpPoints} XP</p>
                </div>
              )}

              {/* 1ST PLACE */}
              {podiumAgents[0] && (
                <div className="bg-gradient-to-b from-amber-50/20 to-white border-2 border-amber-300/40 rounded-3xl p-6 shadow-md flex flex-col items-center justify-between relative overflow-hidden scale-105">
                  <div className="absolute top-3 right-4 text-3xl font-black text-amber-100">#1</div>
                  <div className="text-center space-y-3 flex-1 flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl border-2 border-amber-400 overflow-hidden shadow bg-slate-50 flex items-center justify-center font-bold text-amber-500">
                        {podiumAgents[0].profilePic ? (
                          <img src={podiumAgents[0].profilePic} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{podiumAgents[0].name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl animate-bounce"><FaCrown className="text-amber-400" /></span>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">{podiumAgents[0].name}</h4>
                      <p className="text-[10px] text-amber-600 font-bold">Level {podiumAgents[0].level} • {podiumAgents[0].rank}</p>
                    </div>
                  </div>
                  <div className="w-full border-t border-amber-100 pt-3 mt-4 flex justify-around text-center text-xs">
                    <div>
                      <span className="text-slate-400 text-[9px] font-bold block uppercase">Tickets</span>
                      <span className="font-black text-slate-700">{podiumAgents[0].totalTicketsResolved}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] font-bold block uppercase">Rating</span>
                      <span className="font-black text-amber-500 flex items-center justify-center gap-0.5">
                        <FaStar className="text-amber-400" />
                        {podiumAgents[0].averageRating ? podiumAgents[0].averageRating.toFixed(1) : '0.0'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-600 font-black mt-3">{podiumAgents[0].xpPoints} XP</p>
                </div>
              )}

              {/* 3RD PLACE */}
              {podiumAgents[2] && (
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col items-center justify-between relative overflow-hidden">
                  <div className="absolute top-3 right-4 text-3xl font-black text-slate-100">#3</div>
                  <div className="text-center space-y-3 flex-1 flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl border-2 border-amber-600/30 overflow-hidden shadow-inner bg-slate-50 flex items-center justify-center font-bold text-slate-400">
                        {podiumAgents[2].profilePic ? (
                          <img src={podiumAgents[2].profilePic} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{podiumAgents[2].name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="absolute -top-2 -right-1.5 text-lg">🥉</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{podiumAgents[2].name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Level {podiumAgents[2].level} • {podiumAgents[2].rank}</p>
                    </div>
                  </div>
                  <div className="w-full border-t border-slate-50 pt-3 mt-4 flex justify-around text-center text-xs">
                    <div>
                      <span className="text-slate-400 text-[9px] font-bold block uppercase">Tickets</span>
                      <span className="font-black text-slate-700">{podiumAgents[2].totalTicketsResolved}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] font-bold block uppercase">Rating</span>
                      <span className="font-black text-amber-500 flex items-center justify-center gap-0.5">
                        <FaStar className="text-amber-400" />
                        {podiumAgents[2].averageRating ? podiumAgents[2].averageRating.toFixed(1) : '0.0'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-black mt-3">{podiumAgents[2].xpPoints} XP</p>
                </div>
              )}

            </div>
          )}

          {/* MY STANDINGS & INSIGHT */}
          {myPerformance && (
            <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                  <FaTrophy />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">You are currently at Rank #{agents.findIndex(a => a._id === employee?._id) + 1}!</h3>
                  <p className="text-xs text-slate-500 font-bold">Level {myPerformance.level} • {myPerformance.xpPoints} total experience points.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-black uppercase">Level Progress</span>
                <div className="w-48 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(myPerformance.xpPoints % 1000) / 10}%` }} />
                </div>
                <span className="text-[10px] text-emerald-700 font-black">{myPerformance.xpPoints % 1000}/1000 XP</span>
              </div>
            </div>
          )}

          {/* THE SPEEDWAY TRACK */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden relative">
            <h3 className="text-sm font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
              🏎️ Live Arena Speedway
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              Track real-time agent standings on the track. Higher XP puts you closer to the finish line flag!
            </p>

            <div className="relative border-t border-b border-slate-200 bg-slate-950 rounded-3xl p-4 md:p-6 overflow-x-auto min-w-[700px] shadow-inner">
              <div className="space-y-4 relative z-10">
                {agents.map((agent, index) => {
                  const relativePos = Math.max(5, Math.min(92, (agent.xpPoints / maxXP) * 100));
                  const isMe = agent._id === employee?._id;
                  
                  return (
                    <div 
                      key={agent._id} 
                      className={`flex items-center h-14 border-b border-slate-900 last:border-0 relative ${isMe ? 'bg-emerald-950/20' : ''}`}
                    >
                      <span className="text-slate-800 text-[10px] font-black w-8 text-center border-r border-slate-900 select-none">
                        LANE {index + 1}
                      </span>
                      
                      <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-0.5 border-t border-dashed border-slate-900 pointer-events-none" />

                      <div 
                        className="absolute flex items-center gap-2 transition-all duration-1000 ease-out"
                        style={{ left: `${relativePos}%` }}
                      >
                        <div className="relative flex flex-col items-center">
                          <div className={`w-9 h-9 rounded-xl border-2 overflow-hidden shadow flex items-center justify-center font-bold text-xs relative
                            ${isMe ? 'border-amber-400 bg-amber-950 text-amber-400 ring-2 ring-amber-500/20' : 'border-slate-500 bg-slate-800 text-slate-400'}
                          `}>
                            {agent.profilePic ? (
                              <img src={agent.profilePic} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{agent.name.charAt(0)}</span>
                            )}
                          </div>
                          
                          <div className="text-xs mt-0.5 drop-shadow select-none animate-bounce" style={{ animationDuration: `${1.5 + (index % 3) * 0.3}s` }}>
                            {index === 0 ? '🏎️' : index === 1 ? '🏍️' : index === 2 ? '🏁' : '🚀'}
                          </div>
                        </div>
                        
                        <div className="hidden lg:flex flex-col text-[10px] bg-slate-900/90 backdrop-blur px-2 py-0.5 rounded border border-slate-800 text-slate-300 max-w-[120px] truncate shadow">
                          <span className="font-extrabold text-slate-100 truncate">{agent.name} {isMe && '(You)'}</span>
                          <span className="text-[8px] text-slate-400 font-bold">Lvl {agent.level} • {agent.xpPoints} XP</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="absolute right-10 top-0 bottom-0 w-8 border-l border-dashed border-red-500/30 flex flex-col justify-between items-center py-4 pointer-events-none z-0">
                <span className="text-base select-none">🏁</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default CSLeaderboard;
