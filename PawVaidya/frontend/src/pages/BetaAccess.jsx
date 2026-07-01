import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { FlaskConical, Rocket, CheckCircle, Clock, XCircle, Send, ChevronDown, ChevronUp, Zap, Users, Lock } from 'lucide-react';

const CATEGORY_COLORS = {
  AI: 'from-violet-500 to-purple-600',
  Health: 'from-emerald-500 to-teal-600',
  Social: 'from-blue-500 to-indigo-600',
  Marketplace: 'from-amber-500 to-orange-600',
  Emergency: 'from-red-500 to-rose-600',
  Analytics: 'from-cyan-500 to-blue-600',
  Other: 'from-slate-500 to-gray-600',
};

const STATUS_UI = {
  pending: { icon: Clock, label: 'Under Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  approved: { icon: CheckCircle, label: 'Access Granted ✓', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  rejected: { icon: XCircle, label: 'Not Approved', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
};

export default function BetaAccess() {
  const { backendurl, token, userData } = useContext(AppContext);

  const [features, setFeatures] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [motivation, setMotivation] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [activeTab, setActiveTab] = useState('features');

  useEffect(() => {
    fetchFeatures();
    if (token) fetchMyApps();
  }, [token]);

  const fetchFeatures = async () => {
    try {
      const { data } = await axios.get(`${backendurl}/api/beta/features`);
      if (data.success) setFeatures(data.features);
    } catch { toast.error('Failed to load beta features'); }
    setLoading(false);
  };

  const fetchMyApps = async () => {
    try {
      const { data } = await axios.get(`${backendurl}/api/beta/my-applications`, { headers: { token } });
      if (data.success) setMyApps(data.applications);
    } catch { }
  };

  const getMyApp = (featureId) => myApps.find(a => a.featureId === featureId || a.featureId?._id === featureId);

  const handleApply = async (featureId, featureName) => {
    if (!token) return toast.error('Please log in to apply for beta access.');
    const text = motivation[featureId]?.trim() || '';
    if (text.length < 20) return toast.error('Write at least 20 characters in your motivation.');

    setSubmitting(featureId);
    try {
      const { data } = await axios.post(`${backendurl}/api/beta/apply`,
        { featureId, motivation: text },
        { headers: { token } }
      );
      if (data.success) {
        toast.success('🚀 Application submitted! Check your email for confirmation.');
        setMotivation(p => ({ ...p, [featureId]: '' }));
        fetchMyApps();
      } else toast.error(data.message);
    } catch { toast.error('Something went wrong.'); }
    setSubmitting(null);
  };

  const approvedFeatureSlugs = myApps.filter(a => a.status === 'approved').map(a => a.featureName);

  return (
    <div className="min-h-screen py-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl mb-10 p-8 md:p-12 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex items-center gap-4 flex-wrap">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
            <FlaskConical className="w-9 h-9 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full mb-2 uppercase tracking-wider">
              <Zap className="w-3 h-3" /> Early Access Program
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Beta Tester Hub</h1>
            <p className="mt-1 text-white/80 text-sm max-w-xl">Be the first to experience cutting-edge features before they go live. Apply, get reviewed, and help shape PawVaidya's future.</p>
          </div>
        </div>
        {token && approvedFeatureSlugs.length > 0 && (
          <div className="relative z-10 mt-6 flex items-center gap-2 bg-white/15 rounded-2xl p-3 w-fit">
            <CheckCircle className="w-5 h-5 text-emerald-300" />
            <span className="text-sm font-bold">You have access to <span className="text-emerald-300">{approvedFeatureSlugs.length}</span> beta feature{approvedFeatureSlugs.length > 1 ? 's' : ''}!</span>
          </div>
        )}
      </div>

      {/* Tabs (only when logged in) */}
      {token && (
        <div className="flex gap-2 mb-6">
          {[{ key: 'features', label: '🔬 Available Features' }, { key: 'myapps', label: `📋 My Applications (${myApps.length})` }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === t.key ? 'bg-violet-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-violet-50 border border-slate-200'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Features Grid */}
      {(activeTab === 'features' || !token) && (
        loading ? (
          <div className="text-center py-20 text-slate-400">Loading features...</div>
        ) : features.length === 0 ? (
          <div className="text-center py-20">
            <FlaskConical className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold">No beta features available right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map(f => {
              const myApp = getMyApp(f._id);
              const isExpanded = expanded === f._id;
              const gradClass = CATEGORY_COLORS[f.category] || CATEGORY_COLORS.Other;
              const seatsFull = f.currentTesters >= f.maxTesters;
              const isClosed = f.status === 'closed' || f.status === 'launched';

              return (
                <div key={f._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300">
                  {/* Card header */}
                  <div className={`h-2 bg-gradient-to-r ${gradClass}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${gradClass}`}>{f.category}</span>
                          {isClosed && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">{f.status}</span>}
                        </div>
                        <h2 className="text-lg font-black text-slate-800">{f.name}</h2>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{f.description}</p>
                      </div>
                    </div>

                    {/* Seat meter */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {f.currentTesters} testers</span>
                        <span>{f.maxTesters} seats</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${gradClass} transition-all`} style={{ width: `${Math.min(100, (f.currentTesters / f.maxTesters) * 100)}%` }} />
                      </div>
                    </div>

                    {/* Status or Apply */}
                    <div className="mt-4">
                      {myApp ? (
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${STATUS_UI[myApp.status].bg} ${STATUS_UI[myApp.status].border}`}>
                          {React.createElement(STATUS_UI[myApp.status].icon, { className: `w-4 h-4 ${STATUS_UI[myApp.status].text}` })}
                          <span className={`text-sm font-bold ${STATUS_UI[myApp.status].text}`}>{STATUS_UI[myApp.status].label}</span>
                        </div>
                      ) : !token ? (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-500 font-semibold">Log in to apply</span>
                        </div>
                      ) : isClosed || seatsFull ? (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-500 font-semibold">{seatsFull ? 'All seats filled' : 'Applications closed'}</span>
                        </div>
                      ) : (
                        <button onClick={() => setExpanded(isExpanded ? null : f._id)}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r ${gradClass} text-white font-bold rounded-xl hover:opacity-90 transition-all shadow text-sm`}>
                          <Rocket className="w-4 h-4" />
                          {isExpanded ? 'Cancel' : 'Apply for Early Access'}
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>

                    {/* Apply Form */}
                    {isExpanded && !myApp && token && (
                      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">Why do you want early access?</label>
                        <textarea
                          value={motivation[f._id] || ''}
                          onChange={e => setMotivation(p => ({ ...p, [f._id]: e.target.value }))}
                          rows={4}
                          placeholder="Tell us about your interest in this feature and how you'll use it... (min 20 characters)"
                          className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-violet-300 outline-none text-slate-700"
                        />
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold ${(motivation[f._id]?.length || 0) < 20 ? 'text-red-400' : 'text-emerald-500'}`}>
                            {motivation[f._id]?.length || 0} / 600 chars
                          </span>
                          <button
                            onClick={() => handleApply(f._id, f.name)}
                            disabled={submitting === f._id || (motivation[f._id]?.length || 0) < 20}
                            className={`flex items-center gap-2 px-5 py-2 bg-gradient-to-r ${gradClass} text-white font-bold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow`}>
                            <Send className="w-4 h-4" />
                            {submitting === f._id ? 'Submitting...' : 'Submit Application'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── My Applications Tab */}
      {activeTab === 'myapps' && token && (
        <div className="space-y-4">
          {myApps.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <FlaskConical className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-semibold">You haven't applied for any beta features yet.</p>
              <button onClick={() => setActiveTab('features')} className="mt-3 text-violet-600 font-bold text-sm hover:underline">Browse available features →</button>
            </div>
          ) : myApps.map(app => {
            const s = STATUS_UI[app.status];
            return (
              <div key={app._id} className={`bg-white rounded-2xl p-5 border shadow-sm ${s.border}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-black text-slate-800">{app.featureName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Applied on {new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${s.bg} border ${s.border}`}>
                    {React.createElement(s.icon, { className: `w-4 h-4 ${s.text}` })}
                    <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
                  </div>
                </div>
                <div className="mt-3 bg-slate-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-slate-500 mb-1">YOUR MOTIVATION</p>
                  <p className="text-sm text-slate-700">{app.motivation}</p>
                </div>
                {app.adminNote && (
                  <div className={`mt-3 rounded-xl p-3 ${s.bg} border ${s.border}`}>
                    <p className="text-xs font-bold mb-1" style={{ color: 'inherit' }}>📝 Admin Note</p>
                    <p className="text-sm text-slate-700">{app.adminNote}</p>
                  </div>
                )}
                {app.status === 'approved' && (
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm text-emerald-700 font-bold">This feature is now unlocked in your account! 🎉</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
