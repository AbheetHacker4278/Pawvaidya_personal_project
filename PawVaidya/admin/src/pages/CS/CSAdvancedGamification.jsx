import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';
import { ShieldAlert, Zap, AlertTriangle, Users, Star, Award, ChevronRight, Activity, Search } from 'lucide-react';

const CSAdvancedGamification = () => {
  const { atoken } = useContext(AdminContext);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const [activeTab, setActiveTab] = useState('mentorship'); // 'mentorship' or 'fraud'
  
  const [mentorshipData, setMentorshipData] = useState([]);
  const [fraudData, setFraudData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // AI State
  const [aiReport, setAiReport] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fetchMentorship = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/cs-gamification/mentorship-matrix`, {
        headers: { atoken }
      });
      if (data.success) {
        setMentorshipData(data.pairings || []);
      }
    } catch (err) {
      toast.error('Failed to load mentorship matrix');
    }
  };

  const fetchFraud = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/cs-gamification/fraud-detection`, {
        headers: { atoken }
      });
      if (data.success) {
        setFraudData(data.flaggedAgents || []);
      }
    } catch (err) {
      toast.error('Failed to load fraud detection');
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchMentorship(), fetchFraud()]);
    setLoading(false);
  };

  const analyzeWithAI = () => {
    if (mentorshipData.length === 0 && fraudData.length === 0) {
        toast.info("No anomalies or pairings to analyze.");
        return;
    }
    
    setIsAiLoading(true);
    setAiReport('');

    const prompt = `As the Chief Operations Officer AI for PawVaidya, analyze the following Customer Support Gamification data and provide a concise, strategic 3-paragraph executive summary on team health, risks, and next steps. Do not use markdown headers, just 3 simple paragraphs.
    Fraud Alerts: ${JSON.stringify(fraudData)}
    Mentorship Pairings: ${JSON.stringify(mentorshipData)}`;

    axios.post(`${backendUrl}/api/admin/generate-ai-content`, { prompt, max_tokens: 1024 }, { headers: { atoken } })
      .then(response => {
        if (response.data.success && response.data.data?.choices?.[0]?.message?.content) {
            setAiReport(response.data.data.choices[0].message.content);
        } else {
            throw new Error(response.data.message || "Failed to generate report");
        }
      })
      .catch(error => {
        console.error(error);
        toast.error("AI Analysis failed.");
      })
      .finally(() => {
        setIsAiLoading(false);
      });
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Zap className="w-8 h-8 text-indigo-400" />
              Advanced Analytics Hub
            </h1>
            <p className="text-slate-300 mt-2 max-w-2xl text-sm">
              AI-driven insights for optimizing your Customer Support Gamification system. Monitor integrity through anomaly detection and build a stronger workforce via automated mentorship pairings.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadAllData}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium rounded-xl transition"
            >
              <Activity className="w-4 h-4" />
              Refresh Data
            </button>
            <button
              onClick={analyzeWithAI}
              disabled={isAiLoading || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-900/50 disabled:opacity-50"
            >
              {isAiLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {isAiLoading ? 'Analyzing...' : 'AI Deep Scan'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Report Section */}
      {aiReport && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-indigo-600" />
            AI Executive Summary
          </h3>
          <div className="space-y-4 text-indigo-800 leading-relaxed text-sm">
            {aiReport.split('\n').filter(p => p.trim()).map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('mentorship')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'mentorship' 
            ? 'border-indigo-600 text-indigo-700' 
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          Mentorship Matrix
        </button>
        <button
          onClick={() => setActiveTab('fraud')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'fraud' 
            ? 'border-rose-600 text-rose-700' 
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Fraud & Anomaly Detection
          {fraudData.length > 0 && (
            <span className="bg-rose-100 text-rose-700 py-0.5 px-2 rounded-full text-xs">{fraudData.length}</span>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="mt-6">
          
          {/* MENTORSHIP TAB */}
          {activeTab === 'mentorship' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-4 items-start">
                <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900">AI-Powered Mentorship Pairings</h3>
                  <p className="text-sm text-indigo-700 mt-1">
                    The system automatically pairs struggling agents (Bronze rank or low ratings) with top-tier Diamond/Platinum agents for peer-to-peer coaching.
                  </p>
                </div>
              </div>

              {mentorshipData.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No mentorship pairings required right now. All agents are performing optimally.</p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {mentorshipData.map((pair, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mentorship Pairing #{idx + 1}</span>
                        <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded-md">Action Recommended</span>
                      </div>
                      
                      <div className="p-5 flex items-center justify-between gap-4">
                        
                        {/* MENTEE */}
                        <div className="flex-1 flex flex-col items-center text-center">
                          <img src={pair.mentee.profilePic || '/default-avatar.png'} alt="" className="w-16 h-16 rounded-full border-4 border-slate-100 mb-2 object-cover" />
                          <h4 className="font-bold text-slate-800">{pair.mentee.name}</h4>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1">Mentee</span>
                          <p className="text-xs text-rose-600 font-medium mt-3 bg-rose-50 p-2 rounded-lg border border-rose-100">
                            Weakness: {pair.mentee.weakness}
                          </p>
                        </div>

                        {/* CONNECTION */}
                        <div className="flex flex-col items-center px-4">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 z-10">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                          <div className="h-0.5 w-16 bg-gradient-to-r from-slate-200 to-indigo-200 -mt-4 -z-10"></div>
                        </div>

                        {/* MENTOR */}
                        <div className="flex-1 flex flex-col items-center text-center">
                          <img src={pair.mentor.profilePic || '/default-avatar.png'} alt="" className="w-16 h-16 rounded-full border-4 border-amber-100 mb-2 object-cover shadow-sm" />
                          <h4 className="font-bold text-slate-800">{pair.mentor.name}</h4>
                          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-1 font-bold">
                            {pair.mentor.rank} Mentor
                          </span>
                          <p className="text-xs text-emerald-600 font-medium mt-3 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                            Avg Rating: {pair.mentor.averageRating?.toFixed(1) || '5.0'} ⭐
                          </p>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FRAUD TAB */}
          {activeTab === 'fraud' && (
            <div className="space-y-6">
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-4 items-start">
                <div className="p-3 bg-rose-100 rounded-lg text-rose-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-rose-900">Integrity & Anomaly Detection</h3>
                  <p className="text-sm text-rose-700 mt-1">
                    The system actively scans agent behavior to detect Gamification exploits, such as rapid ticket closing or artificial rating inflation.
                  </p>
                </div>
              </div>

              {fraudData.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">System Secure</h3>
                  <p className="text-slate-500 font-medium mt-2">No gamification anomalies or suspicious activities detected.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fraudData.map((agent, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                      <div className="p-6 bg-rose-50/50 md:w-64 border-r border-rose-100 flex flex-col items-center justify-center text-center">
                        <img src={agent.profilePic || '/default-avatar.png'} alt="" className="w-16 h-16 rounded-full border-2 border-rose-300 object-cover" />
                        <h4 className="font-bold text-slate-800 mt-3">{agent.name}</h4>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">{agent.rank} • {agent.xpPoints} XP</p>
                        <button className="mt-4 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg w-full transition">
                          Audit Agent
                        </button>
                      </div>
                      <div className="p-6 flex-1">
                        <h5 className="text-sm font-bold text-rose-800 flex items-center gap-2 mb-4 uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4" />
                          Anomalies Detected
                        </h5>
                        <ul className="space-y-3">
                          {agent.flags.map((flag, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <Search className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <span>{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

// CheckCircle missing in imports, adding locally
const CheckCircle = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default CSAdvancedGamification;
