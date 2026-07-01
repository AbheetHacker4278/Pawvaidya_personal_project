import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';

const UserTrustSuite = () => {
  const { atoken } = useContext(AdminContext);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const [activeTab, setActiveTab] = useState('trust'); // trust, duplicates, referrals, gdpr
  const [loading, setLoading] = useState(false);

  // Trust Scores State
  const [trustUsers, setTrustUsers] = useState([]);
  const [trustStats, setTrustStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Duplicates State
  const [duplicates, setDuplicates] = useState([]);
  const [dupStats, setDupStats] = useState({ total: 0 });

  // Referrals State
  const [referrals, setReferrals] = useState([]);
  const [refStats, setRefStats] = useState({});

  // GDPR State
  const [gdprRequests, setGdprRequests] = useState([]);
  const [gdprStats, setGdprStats] = useState({});

  const fetchTrustScores = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/trust-scores?search=${searchQuery}`, {
        headers: { atoken }
      });
      if (data.success) {
        setTrustUsers(data.users);
        setTrustStats(data.stats);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Error fetching trust scores');
    } finally {
      setLoading(false);
    }
  };

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/duplicate-accounts`, {
        headers: { atoken }
      });
      if (data.success) {
        setDuplicates(data.duplicates);
        setDupStats({ total: data.total });
      }
    } catch (err) {
      toast.error('Error fetching duplicate accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/referral-stats`, {
        headers: { atoken }
      });
      if (data.success) {
        setReferrals(data.referrers);
        setRefStats(data.stats);
      }
    } catch (err) {
      toast.error('Error fetching referral stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchGdprRequests = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/gdpr-requests`, {
        headers: { atoken }
      });
      if (data.success) {
        setGdprRequests(data.requests);
        setGdprStats(data.stats || { total: data.total, pending: data.pending });
      }
    } catch (err) {
      toast.error('Error fetching GDPR requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'trust') fetchTrustScores();
    if (activeTab === 'duplicates') fetchDuplicates();
    if (activeTab === 'referrals') fetchReferrals();
    if (activeTab === 'gdpr') fetchGdprRequests();
  }, [activeTab, searchQuery]);

  const handleDuplicateAction = async (userId, action) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/flag-duplicate`, { userId, action }, {
        headers: { atoken }
      });
      if (data.success) {
        toast.success(data.message);
        fetchDuplicates();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to perform action');
    }
  };

  const handleGdprAction = async (requestId, action) => {
    const notes = prompt('Enter notes for this action:');
    if (notes === null) return;
    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/process-gdpr`, { requestId, action, notes }, {
        headers: { atoken }
      });
      if (data.success) {
        toast.success(data.message);
        fetchGdprRequests();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to update GDPR request');
    }
  };

  const handleRewardAdjust = async (userId) => {
    const amount = prompt('Enter manual adjustment amount:');
    if (!amount || isNaN(amount)) return;
    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/referral-reward`, { userId, rewardAmount: amount, note: 'Manual override' }, {
        headers: { atoken }
      });
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to update reward');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-900 to-green-950 p-6 rounded-2xl border border-emerald-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            🛡️ User & Trust Center
          </h1>
          <p className="text-emerald-400 text-xs mt-1 uppercase tracking-widest font-semibold">
            Integrity, Safety & User Rights Infrastructure
          </p>
        </div>
        <div className="flex bg-black/40 p-1 rounded-xl border border-emerald-800/60">
          {[
            { id: 'trust', label: 'Trust Scores', icon: '📈' },
            { id: 'duplicates', label: 'Duplicates', icon: '👥' },
            { id: 'referrals', label: 'Referrals', icon: '🔗' },
            { id: 'gdpr', label: 'GDPR / Privacy', icon: '🔒' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider">Loading Analytics...</p>
        </div>
      )}

      {!loading && activeTab === 'trust' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Avg Trust Score', val: `${trustStats.avgScore || 0}%`, color: 'border-emerald-500' },
              { label: 'Platinum Class', val: trustStats.platinum || 0, color: 'border-blue-500' },
              { label: 'Gold Class', val: trustStats.gold || 0, color: 'border-yellow-500' },
              { label: 'Silver Class', val: trustStats.silver || 0, color: 'border-slate-400' },
              { label: 'At Risk', val: trustStats.atRisk || 0, color: 'border-red-500' },
            ].map((s, i) => (
              <div key={i} className={`bg-white p-4 rounded-xl border-l-4 ${s.color} shadow-sm flex flex-col justify-between`}>
                <span className="text-slate-500 text-xs font-semibold">{s.label}</span>
                <span className="text-lg font-black text-slate-800 mt-2">{s.val}</span>
              </div>
            ))}
          </div>

          {/* User List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="font-bold text-slate-800 text-sm">User Integrity Dashboard</span>
              <input
                type="text"
                placeholder="Search user name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <th className="p-4">User</th>
                    <th className="p-4">Verification</th>
                    <th className="p-4 text-center">Trust Score</th>
                    <th className="p-4">Tier</th>
                    <th className="p-4 text-center">Reports Flagged</th>
                    <th className="p-4 text-center">Appt Cancels</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trustUsers.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img src={u.image || 'https://via.placeholder.com/40'} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <div className="font-bold text-slate-800">{u.name}</div>
                          <div className="text-slate-500 text-[10px]">{u.email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.isVerified ? 'Email Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                u.score >= 80 ? 'bg-emerald-500' : u.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${u.score}%` }}
                            />
                          </div>
                          <span className="font-black text-slate-700">{u.score}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.tier === 'Platinum' ? 'bg-indigo-100 text-indigo-700' :
                          u.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                          u.tier === 'Silver' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.tier}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-600">{u.reportCount}</td>
                      <td className="p-4 text-center text-slate-600">
                        <span className="font-bold">{u.cancelRate}%</span>
                        <span className="text-[10px] text-slate-400 block">{u.totalAppts} total appts</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'duplicates' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-3">
            <span className="text-lg">🤖</span>
            <div>
              <h4 className="font-bold text-emerald-900 text-sm">Duplicate Identity Guard</h4>
              <p className="text-emerald-700 text-xs mt-0.5 leading-relaxed">
                Matches are compiled daily based on matching phone records, name clustering, and identical network parameters to prevent fraud and spam accounts.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {duplicates.length === 0 ? (
                <div className="bg-white p-12 rounded-xl text-center border border-slate-100 shadow-sm">
                  <span className="text-4xl">🎉</span>
                  <h3 className="font-bold text-slate-800 mt-3 text-sm">No duplicate threats found</h3>
                  <p className="text-slate-500 text-xs mt-1">Identity validation systems are operating normally.</p>
                </div>
              ) : (
                duplicates.map((dup, i) => (
                  <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          dup.confidence === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {dup.confidence} Confidence Match
                        </span>
                        <p className="text-slate-800 font-bold text-xs mt-1.5">{dup.reason}</p>
                      </div>
                      <span className="text-slate-400 text-xs font-semibold uppercase">{dup.type}</span>
                    </div>

                    <div className="space-y-2">
                      {dup.accounts.map(acc => (
                        <div key={acc._id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100/60">
                          <div>
                            <span className="font-bold text-slate-800 text-xs">{acc.name}</span>
                            <span className="text-slate-400 text-[10px] block">{acc.email} | {acc.phone || 'No phone'}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDuplicateAction(acc._id, 'flag')}
                              className="px-2.5 py-1 text-[10px] font-bold bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-all rounded-md"
                            >
                              Flag
                            </button>
                            <button
                              onClick={() => handleDuplicateAction(acc._id, 'ban')}
                              className="px-2.5 py-1 text-[10px] font-bold bg-red-100 text-red-800 hover:bg-red-200 transition-all rounded-md"
                            >
                              Ban
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 text-sm mb-3">Identity Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-500 text-xs">Total Flags</span>
                    <span className="font-black text-slate-800 text-xs">{dupStats.total} detected</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-500 text-xs">High Risk Cases</span>
                    <span className="font-black text-red-600 text-xs">
                      {duplicates.filter(d => d.confidence === 'High').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'referrals' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Referral Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Total Referrals Triggered', val: refStats.totalReferrals || 0, icon: '🔗' },
              { label: 'Converted Subscriptions', val: refStats.converted || 0, icon: '💰' },
              { label: 'Referral Rewards Disbursed', val: `₹${refStats.totalRewardIssued || 0}`, icon: '🎁' },
            ].map((s, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-xs font-semibold block">{s.label}</span>
                  <span className="text-xl font-black text-slate-800 mt-2 block">{s.val}</span>
                </div>
                <span className="text-2xl bg-emerald-50 p-2.5 rounded-xl">{s.icon}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-800 text-sm">
              Referral Program Network Ledger
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <th className="p-4">Referrer (Promoter)</th>
                    <th className="p-4 text-center">Network Size</th>
                    <th className="p-4 text-center">Conversions</th>
                    <th className="p-4 text-center">Conversion Rate</th>
                    <th className="p-4 text-center">Accrued Rewards</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referrals.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{r.referrerName}</div>
                        <div className="text-slate-500 text-[10px]">{r.referrerEmail}</div>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-600">{r.totalReferrals} users</td>
                      <td className="p-4 text-center font-bold text-emerald-600">{r.convertedReferrals}</td>
                      <td className="p-4 text-center">
                        <span className="font-bold text-slate-600">
                          {Math.round((r.convertedReferrals / r.totalReferrals) * 100)}%
                        </span>
                      </td>
                      <td className="p-4 text-center font-black text-emerald-700">₹{r.rewardEarned}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleRewardAdjust(r.referrerId)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all rounded-md"
                        >
                          Manual Adjustment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'gdpr' && (
        <div className="space-y-6 animate-fadeIn">
          {/* GDPR / Deletion Requests */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="font-bold text-slate-800 text-sm">GDPR Right to be Forgotten Compliance Desk</span>
              <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-md">
                SLA Obligation: 30-Day Limit
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <th className="p-4">User Details</th>
                    <th className="p-4">Requested Action</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4 text-center">Compliance Deadline</th>
                    <th className="p-4 text-center">Days Remaining</th>
                    <th className="p-4 text-center">Processing Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gdprRequests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center p-12 text-slate-400 font-semibold">
                        No active deletion or compliance data requests.
                      </td>
                    </tr>
                  ) : (
                    gdprRequests.map(r => (
                      <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{r.userId?.name || 'Deleted User'}</div>
                          <div className="text-slate-500 text-[10px]">{r.userId?.email || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                            {r.type === 'deletion' ? 'Right to Erasure (Delete)' : 'Data Access Export'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-center font-bold text-slate-700">
                          {new Date(r.slaDeadline).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.daysRemaining < 10 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {r.daysRemaining} days remaining
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'processed' || r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            r.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-center flex items-center justify-center gap-1.5 mt-2">
                          {r.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleGdprAction(r._id, 'approved')}
                                className="px-2 py-1 text-[10px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                              >
                                Accept & Erasure
                              </button>
                              <button
                                onClick={() => handleGdprAction(r._id, 'rejected')}
                                className="px-2 py-1 text-[10px] font-bold bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTrustSuite;
