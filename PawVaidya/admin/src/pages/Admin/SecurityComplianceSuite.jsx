import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';

const SecurityComplianceSuite = () => {
  const { atoken } = useContext(AdminContext);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const [activeTab, setActiveTab] = useState('allowlist'); // allowlist, twofactor, simulator
  const [loading, setLoading] = useState(false);

  // IP Allowlist State
  const [allowedIps, setAllowedIps] = useState([]);
  const [newIp, setNewIp] = useState('');
  const [newIpDesc, setNewIpDesc] = useState('');

  // 2FA Enforcement Policy State
  const [policy, setPolicy] = useState({
    enforcedRoles: [],
    complianceRateAdmins: 0,
    complianceRateCs: 0,
    totalAdmins: 0,
    compliantAdminsCount: 0,
    totalCs: 0,
    compliantCsCount: 0
  });

  // Simulator State
  const [selectedRole, setSelectedRole] = useState('admin');
  const [simulatedPermissions, setSimulatedPermissions] = useState([]);
  const [simulatedPages, setSimulatedPages] = useState([]);

  // Mock Roles mapping for simulator
  const rolePermissionsMap = {
    master: ['all'],
    admin: ['appointments', 'doctors', 'users', 'customer360', 'payment_details', 'stray_campaigns', 'polls', 'messages'],
    master_cs_agent: ['cs_employees', 'cs_chat', 'cs_tickets', 'misbehavior_reports', 'cruelty_reports', 'cs_reports', 'chat_with_admin'],
    cs_staff: ['cs_chat', 'cs_tickets', 'misbehavior_reports'],
    guest_read_only: ['users', 'doctors']
  };

  const fetchAllowedIps = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/allowed-ips`, {
        headers: { atoken }
      });
      if (data.success) {
        setAllowedIps(data.list);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to load whitelisted IPs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIp = async (e) => {
    e.preventDefault();
    if (!newIp) return toast.warn('Please enter an IP Address');
    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/allowed-ips`, {
        ipAddress: newIp,
        description: newIpDesc
      }, {
        headers: { atoken }
      });
      if (data.success) {
        toast.success(data.message);
        setNewIp('');
        setNewIpDesc('');
        fetchAllowedIps();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to add IP address');
    }
  };

  const handleDeleteIp = async (ipId) => {
    if (!confirm('Are you sure you want to remove this IP address?')) return;
    try {
      const { data } = await axios.delete(`${backendUrl}/api/admin/allowed-ips/${ipId}`, {
        headers: { atoken }
      });
      if (data.success) {
        toast.success(data.message);
        fetchAllowedIps();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to delete IP address');
    }
  };

  const fetch2faPolicy = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/2fa-policy`, {
        headers: { atoken }
      });
      if (data.success) {
        setPolicy(data.policy);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to load 2FA policy details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2faRole = async (role) => {
    let updatedRoles = [...policy.enforcedRoles];
    if (updatedRoles.includes(role)) {
      updatedRoles = updatedRoles.filter(r => r !== role);
    } else {
      updatedRoles.push(role);
    }
    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/2fa-policy`, {
        enforcedRoles: updatedRoles
      }, {
        headers: { atoken }
      });
      if (data.success) {
        toast.success(data.message);
        fetch2faPolicy();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to update 2FA enforcement policy');
    }
  };

  const handleSimulatePermissions = async () => {
    const perms = rolePermissionsMap[selectedRole];
    setSimulatedPermissions(perms);
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/simulated-permissions?permissions=${perms.join(',')}`, {
        headers: { atoken }
      });
      if (data.success) {
        setSimulatedPages(data.simulatedPages);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Simulation calculation failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'allowlist') fetchAllowedIps();
    if (activeTab === 'twofactor') fetch2faPolicy();
    if (activeTab === 'simulator') handleSimulatePermissions();
  }, [activeTab, selectedRole]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-950 to-green-950 p-6 rounded-2xl border border-emerald-900 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            🛡️ Security & Compliance Suite
          </h1>
          <p className="text-emerald-400 text-xs mt-1 uppercase tracking-widest font-semibold">
            Administrative Policy Control & Cyber Sentinel Operations
          </p>
        </div>
        <div className="flex bg-black/40 p-1 rounded-xl border border-emerald-900/60">
          {[
            { id: 'allowlist', label: 'IP Allowlist', icon: '🌐' },
            { id: 'twofactor', label: '2FA Policy', icon: '🔐' },
            { id: 'simulator', label: 'Role Simulator', icon: '🎭' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${activeTab === tab.id
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
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider">Verifying Security Protocols...</p>
        </div>
      )}

      {!loading && activeTab === 'allowlist' && (
        <div className="grid md:grid-cols-3 gap-6 animate-fadeIn">
          {/* Allowlist Manager */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm md:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Active Administrative Access IP Ranges</h3>
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-lg text-xs leading-relaxed">
              <strong>⚠️ Warning:</strong> Once IP Allowlist is populated, access to any admin operations is restricted strictly to these IPs. Leave it empty to allow access from any IP address. Always whitelist your current IP address (or local IP <code>::1</code> / <code>127.0.0.1</code>) before enabling the policy to prevent accidental lockout.
            </div>

            <div className="overflow-x-auto border border-slate-50 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Added By</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allowedIps.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center p-8 text-slate-400 font-semibold italic">
                        Allowlist is empty. Global administrative IP access is open.
                      </td>
                    </tr>
                  ) : (
                    allowedIps.map(ip => (
                      <tr key={ip._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-800">{ip.ipAddress}</td>
                        <td className="p-3 text-slate-600">{ip.description || 'No description'}</td>
                        <td className="p-3 text-slate-500">{ip.addedBy}</td>
                        <td className="p-3 text-slate-400">{new Date(ip.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteIp(ip._id)}
                            className="px-2 py-1 text-[10px] font-bold bg-red-100 text-red-700 hover:bg-red-200 rounded transition"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add IP Form */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4 h-fit">
            <h3 className="font-bold text-slate-800 text-sm">Whitelist IP Address</h3>
            <form onSubmit={handleAddIp} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">IP Address</label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.1"
                  value={newIp}
                  onChange={e => setNewIp(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Description</label>
                <textarea
                  placeholder="Reason for whitelisting..."
                  value={newIpDesc}
                  onChange={e => setNewIpDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  rows="3"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition shadow-md"
              >
                Add to Allowlist
              </button>
            </form>
          </div>
        </div>
      )}

      {!loading && activeTab === 'twofactor' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Compliance Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="text-slate-500 text-xs font-semibold">Admin 2FA Compliance Rate</h4>
                <div className="text-2xl font-black text-slate-800 mt-2">
                  {policy.complianceRateAdmins}%
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {policy.compliantAdminsCount} of {policy.totalAdmins} admins configured
                </span>
              </div>
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-extrabold text-lg">
                🔐
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="text-slate-500 text-xs font-semibold">CS Agent 2FA Compliance Rate</h4>
                <div className="text-2xl font-black text-slate-800 mt-2">
                  {policy.complianceRateCs}%
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {policy.compliantCsCount} of {policy.totalCs} agents verified
                </span>
              </div>
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-extrabold text-lg">
                👨‍💻
              </div>
            </div>
          </div>

          {/* Policy Enforcers */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Force Multifactor Security Rules</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Forced roles will be blocked from administrative operations until they have bound a verified mobile phone number for OTP reception or successfully registered biometric details.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { key: 'master', label: 'Master Administrators (Root)', desc: 'High privileges admin controls' },
                { key: 'admin', label: 'Standard Administrators', desc: 'Manage clinics, users & coupon parameters' },
                { key: 'master_cs_agent', label: 'Customer Service Master Agents', desc: 'Control tickets assignations, resolve agent complaints' }
              ].map(item => (
                <div key={item.key} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">{item.label}</h5>
                    <p className="text-slate-400 text-[10px]">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggle2faRole(item.key)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition shadow-sm ${policy.enforcedRoles.includes(item.key)
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                  >
                    {policy.enforcedRoles.includes(item.key) ? 'Force Enforced' : 'Enforce 2FA'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'simulator' && (
        <div className="grid md:grid-cols-3 gap-6 animate-fadeIn">
          {/* Simulator Controls */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4 h-fit">
            <h3 className="font-bold text-slate-800 text-sm">Role Simulator Panel</h3>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Select Simulated Role</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-bold"
              >
                <option value="master">Master Admin (Root Access)</option>
                <option value="admin">Standard Admin</option>
                <option value="master_cs_agent">Master CS Employee</option>
                <option value="cs_staff">Customer Service Representative</option>
                <option value="guest_read_only">Guest Administrator (Audit)</option>
              </select>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Calculated Permissions:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {simulatedPermissions.map((perm, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Simulator Results */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm md:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Administrative Dashboard UI Preview</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Simulates which sections and dashboard navigation options would render on screen for the selected role.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {simulatedPages.map((page, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border transition-all duration-300 ${page.isVisible
                    ? 'bg-emerald-50/40 border-emerald-200/60 shadow-sm'
                    : 'bg-slate-50 border-slate-100 opacity-40 select-none'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{page.category}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${page.isVisible ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs mt-1">{page.label}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 italic font-semibold">Requires: {page.required}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityComplianceSuite;
