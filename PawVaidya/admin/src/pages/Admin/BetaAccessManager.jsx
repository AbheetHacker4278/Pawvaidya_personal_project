import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';
import { FlaskConical, Plus, CheckCircle, XCircle, Clock, Users, Zap, Trash2, Edit3, ChevronDown, ChevronUp, Send, Rocket } from 'lucide-react';

const CATEGORIES = ['AI', 'Health', 'Social', 'Marketplace', 'Emergency', 'Analytics', 'Other'];

const statusColor = { pending: 'bg-amber-100 text-amber-800', approved: 'bg-emerald-100 text-emerald-800', rejected: 'bg-red-100 text-red-700' };

export default function BetaAccessManager() {
  const { backendurl, atoken } = useContext(AdminContext);
  const headers = { atoken };

  const [tab, setTab] = useState('applications');
  const [features, setFeatures] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFeature, setFilterFeature] = useState('all');
  const [loading, setLoading] = useState(false);
  const [expandedApp, setExpandedApp] = useState(null);
  const [noteInput, setNoteInput] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFeature, setNewFeature] = useState({ name: '', slug: '', description: '', category: 'AI', maxTesters: 100 });
  const [editFeature, setEditFeature] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fRes, aRes, sRes] = await Promise.all([
        axios.get(`${backendurl}/api/beta/features/all`, { headers }),
        axios.get(`${backendurl}/api/beta/applications`, { headers }),
        axios.get(`${backendurl}/api/beta/stats`, { headers }),
      ]);
      if (fRes.data.success) setFeatures(fRes.data.features);
      if (aRes.data.success) setApplications(aRes.data.applications);
      if (sRes.data.success) setStats(sRes.data.stats);
    } catch (e) { toast.error('Failed to load data'); }
    setLoading(false);
  };

  const filteredApps = applications.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterFeature !== 'all' && a.featureId?._id !== filterFeature && a.featureId !== filterFeature) return false;
    return true;
  });

  const handleApprove = async (id) => {
    const { data } = await axios.post(`${backendurl}/api/beta/applications/approve`, { applicationId: id, adminNote: noteInput[id] || '' }, { headers });
    if (data.success) { toast.success(data.message); fetchAll(); } else toast.error(data.message);
  };

  const handleReject = async (id) => {
    const { data } = await axios.post(`${backendurl}/api/beta/applications/reject`, { applicationId: id, adminNote: noteInput[id] || '' }, { headers });
    if (data.success) { toast.success(data.message); fetchAll(); } else toast.error(data.message);
  };

  const handleCreateFeature = async () => {
    if (!newFeature.name || !newFeature.slug || !newFeature.description) return toast.error('Fill all required fields');
    const { data } = await axios.post(`${backendurl}/api/beta/features`, newFeature, { headers });
    if (data.success) { toast.success('Feature created!'); setShowCreateForm(false); setNewFeature({ name: '', slug: '', description: '', category: 'AI', maxTesters: 100 }); fetchAll(); }
    else toast.error(data.message);
  };

  const handleUpdateFeature = async () => {
    const { data } = await axios.put(`${backendurl}/api/beta/features/${editFeature._id}`, editFeature, { headers });
    if (data.success) { toast.success('Feature updated!'); setEditFeature(null); fetchAll(); } else toast.error(data.message);
  };

  const handleDeleteFeature = async (id) => {
    if (!window.confirm('Delete this feature and all its applications?')) return;
    const { data } = await axios.delete(`${backendurl}/api/beta/features/${id}`, { headers });
    if (data.success) { toast.success('Deleted!'); fetchAll(); } else toast.error(data.message);
  };

  const toggleFeatureStatus = async (f) => {
    const updated = { ...f, isActive: !f.isActive };
    const { data } = await axios.put(`${backendurl}/api/beta/features/${f._id}`, updated, { headers });
    if (data.success) { toast.success('Updated!'); fetchAll(); }
  };

  const launchFeatureGlobally = async (f) => {
    if (!window.confirm(`Are you sure you want to launch "${f.name}" globally to all users? This will end the beta testing phase.`)) return;
    const updated = { ...f, status: 'launched', isActive: false };
    const { data } = await axios.put(`${backendurl}/api/beta/features/${f._id}`, updated, { headers });
    if (data.success) { toast.success(`🚀 ${f.name} has been launched globally!`); fetchAll(); }
    else toast.error(data.message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50/30 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FlaskConical className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Beta Access Manager</h1>
            <p className="text-sm text-slate-500">Manage early-access features and tester applications</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Active Features', value: stats.totalFeatures ?? '—', icon: Zap, color: 'from-violet-500 to-purple-600' },
          { label: 'Total Applications', value: stats.totalApplications ?? '—', icon: Users, color: 'from-blue-500 to-indigo-600' },
          { label: 'Pending', value: stats.pendingCount ?? '—', icon: Clock, color: 'from-amber-400 to-orange-500' },
          { label: 'Approved', value: stats.approvedCount ?? '—', icon: CheckCircle, color: 'from-emerald-500 to-green-600' },
          { label: 'Rejected', value: stats.rejectedCount ?? '—', icon: XCircle, color: 'from-red-400 to-rose-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-white/60 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ key: 'applications', label: '📋 Applications' }, { key: 'features', label: '🔬 Beta Features' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === t.key ? 'bg-violet-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-violet-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Applications Tab */}
      {tab === 'applications' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white font-semibold text-slate-700">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={filterFeature} onChange={e => setFilterFeature(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white font-semibold text-slate-700">
              <option value="all">All Features</option>
              {features.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
            <span className="ml-auto text-sm text-slate-400 font-semibold self-center">{filteredApps.length} result{filteredApps.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? <div className="p-12 text-center text-slate-400">Loading...</div> : filteredApps.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No applications found.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredApps.map(app => (
                <div key={app._id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800">{app.userName}</span>
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">{app.userSubscription || 'Free'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${statusColor[app.status]}`}>{app.status}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{app.userEmail}</p>
                      <p className="text-xs text-violet-600 font-bold mt-1">🔬 {app.featureName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <button onClick={() => setExpandedApp(expandedApp === app._id ? null : app._id)}
                      className="text-slate-400 hover:text-violet-600 transition-colors">
                      {expandedApp === app._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {expandedApp === app._id && (
                    <div className="mt-4 space-y-3">
                      <div className="bg-violet-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-violet-700 mb-1">MOTIVATION</p>
                        <p className="text-sm text-slate-700">{app.motivation}</p>
                      </div>
                      {app.adminNote && (
                        <div className="bg-amber-50 rounded-xl p-3">
                          <p className="text-xs font-bold text-amber-700 mb-1">ADMIN NOTE</p>
                          <p className="text-sm text-slate-700">{app.adminNote}</p>
                        </div>
                      )}
                      {app.status === 'pending' && (
                        <div className="flex gap-2 flex-wrap">
                          <input value={noteInput[app._id] || ''} onChange={e => setNoteInput(p => ({ ...p, [app._id]: e.target.value }))}
                            placeholder="Optional admin note for user..."
                            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-300 outline-none" />
                          <button onClick={() => handleApprove(app._id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button onClick={() => handleReject(app._id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors">
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Features Tab */}
      {tab === 'features' && (
        <div className="space-y-4">
          <button onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-all shadow-lg">
            <Plus className="w-4 h-4" /> New Beta Feature
          </button>

          {showCreateForm && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-violet-100">
              <h3 className="font-black text-slate-800 mb-4">Create New Beta Feature</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={newFeature.name} onChange={e => setNewFeature(p => ({ ...p, name: e.target.value }))} placeholder="Feature Name *" className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 outline-none" />
                <input value={newFeature.slug} onChange={e => setNewFeature(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} placeholder="slug-identifier *" className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 outline-none font-mono" />
                <select value={newFeature.category} onChange={e => setNewFeature(p => ({ ...p, category: e.target.value }))} className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="number" value={newFeature.maxTesters} onChange={e => setNewFeature(p => ({ ...p, maxTesters: Number(e.target.value) }))} placeholder="Max Testers" className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 outline-none" />
                <textarea value={newFeature.description} onChange={e => setNewFeature(p => ({ ...p, description: e.target.value }))} placeholder="Description *" rows={3} className="md:col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 outline-none resize-none" />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleCreateFeature} className="px-5 py-2 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 text-sm"><Send className="w-4 h-4 inline mr-1" />Create</button>
                <button onClick={() => setShowCreateForm(false)} className="px-5 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-sm">Cancel</button>
              </div>
            </div>
          )}

          {features.map(f => (
            <div key={f._id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              {editFeature?._id === f._id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input value={editFeature.name} onChange={e => setEditFeature(p => ({ ...p, name: e.target.value }))} className="px-3 py-2 border border-violet-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 outline-none" />
                    <select value={editFeature.status} onChange={e => setEditFeature(p => ({ ...p, status: e.target.value }))} className="px-3 py-2 border border-violet-200 rounded-xl text-sm bg-white">
                      {['accepting', 'closed', 'launched'].map(s => <option key={s}>{s}</option>)}
                    </select>
                    <input type="number" value={editFeature.maxTesters} onChange={e => setEditFeature(p => ({ ...p, maxTesters: Number(e.target.value) }))} className="px-3 py-2 border border-violet-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 outline-none" />
                    <select value={editFeature.category} onChange={e => setEditFeature(p => ({ ...p, category: e.target.value }))} className="px-3 py-2 border border-violet-200 rounded-xl text-sm bg-white">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <textarea value={editFeature.description} onChange={e => setEditFeature(p => ({ ...p, description: e.target.value }))} rows={2} className="md:col-span-2 px-3 py-2 border border-violet-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 outline-none resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleUpdateFeature} className="px-4 py-1.5 bg-violet-600 text-white font-bold rounded-xl text-sm">Save</button>
                    <button onClick={() => setEditFeature(null)} className="px-4 py-1.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-slate-800">{f.name}</h3>
                      <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">{f.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${f.status === 'accepting' ? 'bg-emerald-100 text-emerald-700' : f.status === 'launched' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{f.status}</span>
                      {!f.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Hidden</span>}
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">/{f.slug}</p>
                    <p className="text-sm text-slate-600 mt-1">{f.description}</p>
                    <p className="text-xs text-slate-400 mt-1">Testers: {f.currentTesters}/{f.maxTesters}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {f.status !== 'launched' && (
                      <button onClick={() => launchFeatureGlobally(f)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors shadow-sm" title="Launch to all users">
                        <Rocket className="w-4 h-4" /> Launch Globally
                      </button>
                    )}
                    <button onClick={() => toggleFeatureStatus(f)} className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm ${f.isActive ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                      {f.isActive ? 'Pause Beta' : 'Resume Beta'}
                    </button>
                    <button onClick={() => setEditFeature({ ...f })} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteFeature(f._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
