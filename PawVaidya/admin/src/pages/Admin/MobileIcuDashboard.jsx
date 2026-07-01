import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ambulance, RefreshCw, User, MapPin, Phone, Clock, AlertTriangle,
  CheckCircle, XCircle, Activity, Shield, Plus, Edit2, Trash2, X,
  Save, DollarSign, FileText, Ban, Check, AlertOctagon
} from 'lucide-react';
import { toast } from 'react-toastify';

const statusColor = (s) => ({
  'Available': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Dispatched': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'En Route': 'bg-blue-500/15 text-blue-400 border-blue-500/30 animate-pulse',
  'Arrived': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Cancelled': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  'Maintenance': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'Offline': 'bg-slate-500/15 text-slate-400 border-slate-500/30'
}[s] || 'bg-slate-500/15 text-slate-400 border-slate-500/30');

const EMPTY_VAN = {
  vanNumber: '',
  driverName: '',
  driverPhone: '',
  paramedicName: '',
  paramedicPhone: '',
  baseLocation: '',
  city: '',
  notes: '',
  status: 'Available',
  createDriverAccount: false,
  emailAddress: '',
  username: '',
  password: '',
  emergencyContact: '',
  drivingLicenceNumber: '',
  govPhotoIdNumber: '',
  employmentStatus: 'Active',
  joiningDate: ''
};

export default function MobileIcuDashboard() {
  const { atoken, backendurl } = useContext(AdminContext);
  const [tab, setTab] = useState('monitor');
  const [dispatches, setDispatches] = useState([]);
  const [stats, setStats] = useState({ totalActive: 0, totalArrived: 0, totalCancelled: 0 });
  const [vans, setVans] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  
  // Van form modal states
  const [showForm, setShowForm] = useState(false);
  const [editVan, setEditVan] = useState(null);
  const [form, setForm] = useState(EMPTY_VAN);
  const [saving, setSaving] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState(null);

  // Driver action modal states
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [deductionForm, setDeductionForm] = useState({ amount: '', reason: '', remarks: '' });
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');

  const fetchDispatches = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendurl}/api/admin/obsidian/admin/icu-dispatches`, { headers: { atoken } });
      if (data.success) {
        setDispatches(data.dispatches || []);
        setStats({
          totalActive: data.totalActive || 0,
          totalArrived: data.totalArrived || 0,
          totalCancelled: data.totalCancelled || 0
        });
        setLastRefresh(new Date());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [atoken, backendurl]);

  const fetchVans = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendurl}/api/admin/obsidian/admin/vans`, { headers: { atoken } });
      if (data.success) setVans(data.vans || []);
    } catch (e) {
      console.error(e);
    }
  }, [atoken, backendurl]);

  const fetchDrivers = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendurl}/api/admin/obsidian/admin/drivers`, { headers: { atoken } });
      if (data.success) setDrivers(data.drivers || []);
    } catch (e) {
      console.error(e);
    }
  }, [atoken, backendurl]);

  useEffect(() => {
    if (!atoken) return;
    fetchDispatches();
    fetchVans();
    fetchDrivers();
    const iv = setInterval(() => {
      fetchDispatches();
      fetchVans();
      fetchDrivers();
    }, 8000);
    return () => clearInterval(iv);
  }, [atoken, fetchDispatches, fetchVans, fetchDrivers]);

  const openCreate = () => {
    setEditVan(null);
    setForm(EMPTY_VAN);
    setShowForm(true);
  };

  const openEdit = (van) => {
    setEditVan(van);
    setForm({
      vanNumber: van.vanNumber,
      driverName: van.driverName,
      driverPhone: van.driverPhone,
      paramedicName: van.paramedicName || '',
      paramedicPhone: van.paramedicPhone || '',
      baseLocation: van.baseLocation,
      city: van.city || '',
      notes: van.notes || '',
      status: van.status,
      createDriverAccount: false,
      emailAddress: '',
      username: '',
      password: '',
      emergencyContact: '',
      drivingLicenceNumber: '',
      govPhotoIdNumber: '',
      employmentStatus: 'Active',
      joiningDate: ''
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let res;
      if (editVan) {
        res = await axios.put(`${backendurl}/api/admin/obsidian/admin/vans/${editVan._id}`, form, { headers: { atoken } });
      } else {
        res = await axios.post(`${backendurl}/api/admin/obsidian/admin/vans`, form, { headers: { atoken } });
      }
      if (res.data.success) {
        toast.success(res.data.message);
        setShowForm(false);
        fetchVans();
        fetchDrivers();
        if (res.data.credentials) {
          setGeneratedCreds(res.data.credentials);
          setShowCredentialsModal(true);
        }
      } else {
        toast.error(res.data.message);
      }
    } catch (e) {
      toast.error('Failed to save van');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (van) => {
    if (!window.confirm(`Remove Van ${van.vanNumber}?`)) return;
    try {
      const { data } = await axios.delete(`${backendurl}/api/admin/obsidian/admin/vans/${van._id}`, { headers: { atoken } });
      if (data.success) {
        toast.success(data.message);
        fetchVans();
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error('Failed to delete van');
    }
  };

  const handleBanToggle = async (drv) => {
    if (drv.isBanned) {
      if (!window.confirm(`Reactivate / Unban ${drv.fullName}?`)) return;
      try {
        const { data } = await axios.post(`${backendurl}/api/admin/obsidian/admin/drivers/${drv._id}/unban`, {}, { headers: { atoken } });
        if (data.success) {
          toast.success(data.message);
          fetchDrivers();
        } else {
          toast.error(data.message);
        }
      } catch (e) {
        toast.error('Failed to reactivate driver');
      }
    } else {
      setSelectedDriver(drv);
      setBanReason('');
      setShowBanModal(true);
    }
  };

  const submitBan = async () => {
    if (!banReason.trim()) return toast.error('Please specify a ban reason.');
    try {
      const { data } = await axios.post(`${backendurl}/api/admin/obsidian/admin/drivers/${selectedDriver._id}/ban`, { reason: banReason }, { headers: { atoken } });
      if (data.success) {
        toast.success(data.message);
        setShowBanModal(false);
        fetchDrivers();
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error('Failed to ban driver');
    }
  };

  const handleAppealStatus = async (drv, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this appeal?`)) return;
    try {
      const { data } = await axios.post(`${backendurl}/api/admin/obsidian/admin/drivers/${drv._id}/appeal`, { action }, { headers: { atoken } });
      if (data.success) {
        toast.success(data.message);
        fetchDrivers();
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error('Failed to handle appeal');
    }
  };

  const handleDeleteDriver = async (drv) => {
    if (!window.confirm(`Permanently delete driver account for ${drv.fullName}? This action cannot be undone.`)) return;
    try {
      const { data } = await axios.delete(`${backendurl}/api/admin/obsidian/admin/drivers/${drv._id}`, { headers: { atoken } });
      if (data.success) {
        toast.success(data.message);
        fetchDrivers();
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error('Failed to delete driver account');
    }
  };

  const handleApproveDocs = async (drv, approve) => {
    try {
      const { data } = await axios.put(`${backendurl}/api/admin/obsidian/admin/drivers/${drv._id}`, { approveDocuments: approve }, { headers: { atoken } });
      if (data.success) {
        toast.success(approve ? "Documents verified successfully." : "Documents rejected.");
        fetchDrivers();
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error('Failed to update document status');
    }
  };

  const openDeduction = (drv) => {
    setSelectedDriver(drv);
    setDeductionForm({ amount: '', reason: '', remarks: '' });
    setShowDeductionModal(true);
  };

  const submitDeduction = async () => {
    if (!deductionForm.amount || Number(deductionForm.amount) <= 0) {
      return toast.error('Please input a valid positive deduction amount.');
    }
    if (!deductionForm.reason.trim()) {
      return toast.error('Please select or specify a reason.');
    }
    try {
      const { data } = await axios.put(`${backendurl}/api/admin/obsidian/admin/drivers/${selectedDriver._id}`, {
        deductionAmount: deductionForm.amount,
        deductionReason: deductionForm.reason,
        deductionRemarks: deductionForm.remarks
      }, { headers: { atoken } });
      if (data.success) {
        toast.success(`Deduction of ₹${deductionForm.amount} applied to ${selectedDriver.fullName}'s salary.`);
        setShowDeductionModal(false);
        fetchDrivers();
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error('Failed to apply salary deduction');
    }
  };

  const inp = 'w-full bg-slate-50 dark:bg-[#060b14] border border-slate-200 dark:border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500/50 transition';

  return (
    <div className="m-5 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 dark:bg-red-500/20 rounded-xl border border-red-500/20">
              <Ambulance className="w-7 h-7 text-red-500" />
            </div>
            Mobile ICU Command Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time ICU dispatch tracking, driver accounting & fleet management</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && <span className="text-[10px] text-slate-400 font-medium hidden md:block">Refreshed: {lastRefresh.toLocaleTimeString()}</span>}
          <button onClick={fetchDispatches} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-bold transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          ['monitor', 'Live Monitor'],
          ['fleet', 'Fleet Management'],
          ['drivers', 'Driver & Appeal Center']
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              tab === key
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-white dark:bg-[#0a1020] border-slate-200 dark:border-[#111827] text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── MONITOR TAB ── */}
      {tab === 'monitor' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              ['Total', dispatches.length, 'slate', Ambulance],
              ['Active', stats.totalActive, 'amber', Activity],
              ['Arrived', stats.totalArrived, 'emerald', CheckCircle],
              ['Cancelled', stats.totalCancelled, 'rose', XCircle]
            ].map(([l, v, c, Icon], i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-[#0a1020] border border-slate-100 dark:border-[#111827] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 text-${c}-500`} />
                  <span className={`text-[9px] font-black uppercase tracking-widest text-${c}-500`}>{l}</span>
                </div>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{v}</p>
              </motion.div>
            ))}
          </div>
          {loading ? (
            <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" /></div>
          ) : dispatches.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#0a1020] rounded-2xl border border-slate-100 dark:border-[#111827]">
              <Ambulance className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-400">No Active Dispatches</h3>
              <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">All Mobile ICU units are currently idle. Auto-refreshes every 8s.</p>
            </div>
          ) : dispatches.map((d, i) => (
            <motion.div key={d.dispatchId || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white dark:bg-[#0a1020] border border-slate-100 dark:border-[#111827] rounded-2xl p-5 mb-4 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-5">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        {d.user?.image ? <img src={d.user.image} alt={d.user.name} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{d.user?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-400">{d.user?.email}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${statusColor(d.status)}`}>{d.status}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {[
                      ['Dispatch ID', d.dispatchId],
                      ['Ambulance', d.ambulanceNumber],
                      ['Driver', d.driverName],
                      ['ETA', d.etaMinutes <= 0 ? 'ARRIVED' : `${d.etaMinutes} min`]
                    ].map(([k, v]) => (
                      <div key={k} className="bg-slate-50 dark:bg-[#060b14] rounded-xl p-3 border border-slate-100 dark:border-[#111827]">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">{k}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(d.dispatchedAt).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Pet: {d.petName || 'N/A'}</span>
                    {d.paramedicName && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Paramedic: {d.paramedicName}</span>}
                  </div>
                </div>
                {d.status !== 'Cancelled' && (
                  <div className="lg:w-72 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-[#111827] h-40 relative">
                    <iframe title={`map-${d.dispatchId}`} width="100%" height="100%" style={{ border: 0 }} loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=72.7,18.8,73.2,19.3&layer=mapnik" />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
                      <span className="text-[9px] font-bold text-white flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'Arrived' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                        {d.status === 'Arrived' ? 'Arrived' : 'Live'}
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-red-500/20">
                      <span className="text-[9px] font-bold text-red-400">🚑 {d.etaMinutes <= 0 ? 'On Site' : `ETA ${d.etaMinutes}m`}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </>
      )}

      {/* ── FLEET TAB ── */}
      {tab === 'fleet' && (
        <>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 font-bold">Van Fleet Registry</h2>
              <p className="text-sm text-slate-400">{vans.length} van{vans.length !== 1 ? 's' : ''} registered · {vans.filter(v => v.status === 'Available').length} available</p>
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all">
              <Plus className="w-4 h-4" /> Register Van
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vans.map((van, i) => (
              <motion.div key={van._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-[#0a1020] border border-slate-100 dark:border-[#111827] rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Ambulance className="w-5 h-5 text-red-500" />
                      <span className="font-black text-slate-800 dark:text-slate-100 font-mono text-sm">{van.vanNumber}</span>
                    </div>
                    <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${statusColor(van.status)}`}>{van.status}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(van)} className="p-2 rounded-xl bg-slate-100 dark:bg-[#111827] hover:bg-blue-500/10 hover:text-blue-500 transition-all text-slate-500">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(van)} className="p-2 rounded-xl bg-slate-100 dark:bg-[#111827] hover:bg-red-500/10 hover:text-red-500 transition-all text-slate-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2"><User className="w-3 h-3 shrink-0" /> <span className="font-semibold text-slate-800 dark:text-slate-200">{van.driverName}</span></div>
                  <div className="flex items-center gap-2"><Phone className="w-3 h-3 shrink-0" /> {van.driverPhone}</div>
                  {van.paramedicName && <div className="flex items-center gap-2"><Shield className="w-3 h-3 shrink-0" /> {van.paramedicName} {van.paramedicPhone && `· ${van.paramedicPhone}`}</div>}
                  <div className="flex items-center gap-2"><MapPin className="w-3 h-3 shrink-0" /> {van.baseLocation}{van.city && `, ${van.city}`}</div>
                  {van.notes && <p className="text-[10px] text-slate-400 italic pt-1">{van.notes}</p>}
                </div>
                {van.equipment?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {van.equipment.slice(0, 3).map(e => <span key={e} className="text-[9px] bg-slate-100 dark:bg-[#111827] text-slate-500 px-2 py-0.5 rounded-full">{e}</span>)}
                    {van.equipment.length > 3 && <span className="text-[9px] bg-slate-100 dark:bg-[#111827] text-slate-500 px-2 py-0.5 rounded-full">+{van.equipment.length - 3}</span>}
                  </div>
                )}
              </motion.div>
            ))}
            {vans.length === 0 && (
              <div className="col-span-3 text-center py-16 bg-white dark:bg-[#0a1020] rounded-2xl border border-slate-100 dark:border-[#111827]">
                <Ambulance className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="font-bold text-slate-400">No vans registered yet</p>
                <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">Click "Register Van" to add your first Mobile ICU van.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── DRIVER & APPEAL CENTER TAB ── */}
      {tab === 'drivers' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0a1020] border border-slate-100 dark:border-[#111827] rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-2">Driver Roster & Verification Center</h2>
            <p className="text-sm text-slate-400">Approve government documents, review reinstatement appeals, issue performance misconduct deductions, and manage account statuses.</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {drivers.map((drv) => {
              const baseSalary = drv.salary?.base || 8500;
              const fiveStarCount = (drv.ratings || []).filter(r => r.rating === 5).length;
              const bonus = fiveStarCount * 1500;
              const deductions = drv.salary?.deductions || 0;
              const netPayable = baseSalary + bonus - deductions;

              return (
                <motion.div key={drv._id} layout
                  className="bg-white dark:bg-[#0a1020] border border-slate-100 dark:border-[#111827] rounded-2xl p-5 shadow-sm flex flex-col xl:flex-row gap-6">
                  {/* Left Column: Profile & Status */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-500">
                        {drv.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{drv.fullName}</h3>
                        <p className="text-[11px] text-slate-400">Username: <span className="font-mono text-slate-500">{drv.username}</span> | Email: {drv.emailAddress}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-50 dark:bg-[#060b14] border border-slate-100 dark:border-[#111827] rounded-xl p-3">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Status</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${statusColor(drv.status)}`}>{drv.status}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#060b14] border border-slate-100 dark:border-[#111827] rounded-xl p-3">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Vehicle Assignment</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{drv.assignedVehicle || 'Unassigned'}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#060b14] border border-slate-100 dark:border-[#111827] rounded-xl p-3">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Account Ban</span>
                        <span className={`font-bold ${drv.isBanned ? 'text-rose-500' : 'text-emerald-500'}`}>{drv.isBanned ? '🚨 Banned' : '🟢 Active'}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#060b14] border border-slate-100 dark:border-[#111827] rounded-xl p-3">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Performance Rating</span>
                        <span className="font-bold text-amber-500">★ {(drv.ratings?.reduce((sum, r) => sum + r.rating, 0) / (drv.ratings?.length || 1)).toFixed(1)} / 5.0</span>
                      </div>
                    </div>

                    {drv.isBanned && drv.banReason && (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs">
                        <strong>Ban Reason:</strong> {drv.banReason}
                      </div>
                    )}
                  </div>

                  {/* Middle Column: Document Verification */}
                  <div className="w-full xl:w-80 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-[#111827] pt-4 xl:pt-0 xl:pl-6 space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Document Registry</h4>
                    {drv.documents?.uploaded ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {drv.documents.drivingLicenceUrl ? (
                            <a href={drv.documents.drivingLicenceUrl} target="_blank" rel="noreferrer" className="flex-1 p-2 bg-slate-50 dark:bg-[#060b14] border border-slate-200 dark:border-[#1e293b] hover:border-emerald-500/30 rounded-xl text-[11px] text-center font-bold text-slate-600 dark:text-slate-300 block">
                              🪪 Driving Licence
                            </a>
                          ) : <div className="flex-1 p-2 bg-slate-50 dark:bg-[#060b14] border border-dashed border-slate-200 dark:border-[#1e293b] rounded-xl text-[10px] text-center text-slate-400">No DL Uploaded</div>}

                          {drv.documents.govPhotoIdUrl ? (
                            <a href={drv.documents.govPhotoIdUrl} target="_blank" rel="noreferrer" className="flex-1 p-2 bg-slate-50 dark:bg-[#060b14] border border-slate-200 dark:border-[#1e293b] hover:border-emerald-500/30 rounded-xl text-[11px] text-center font-bold text-slate-600 dark:text-slate-300 block">
                              🆔 Gov Photo ID
                            </a>
                          ) : <div className="flex-1 p-2 bg-slate-50 dark:bg-[#060b14] border border-dashed border-slate-200 dark:border-[#1e293b] rounded-xl text-[10px] text-center text-slate-400">No Photo ID</div>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveDocs(drv, true)} className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition">
                            Verify Documents
                          </button>
                          <button onClick={() => handleApproveDocs(drv, false)} className="flex-1 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 rounded-lg text-[10px] font-bold transition">
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 dark:bg-[#060b14] rounded-xl border border-dashed border-slate-200 dark:border-[#1e293b] text-center text-[11px] text-slate-400">
                        📄 Waiting for driver to upload documents...
                      </div>
                    )}
                  </div>

                  {/* Right Column: Financial Calculations & Actions */}
                  <div className="w-full xl:w-72 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-[#111827] pt-4 xl:pt-0 xl:pl-6 flex flex-col justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Driver Payroll Breakdown</h4>
                      <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex justify-between"><span>Base Pay:</span><span className="font-mono text-slate-700 dark:text-slate-300">₹{baseSalary}</span></div>
                        <div className="flex justify-between"><span>Rating Bonus:</span><span className="font-mono text-emerald-500">+₹{bonus} ({fiveStarCount}★)</span></div>
                        <div className="flex justify-between"><span>Deductions:</span><span className="font-mono text-rose-500">-₹{deductions}</span></div>
                        <div className="border-t border-slate-100 dark:border-[#111827] my-1.5 pt-1.5 flex justify-between font-bold text-xs text-slate-800 dark:text-slate-200">
                          <span>Net Payable:</span><span className="font-mono text-emerald-500">₹{netPayable}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button onClick={() => openDeduction(drv)} className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> Deduct Salary
                        </button>
                        <button onClick={() => handleBanToggle(drv)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                          drv.isBanned ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-rose-500 text-white hover:bg-rose-600'
                        }`}>
                          <Ban className="w-3.5 h-3.5" /> {drv.isBanned ? 'Unban Account' : 'Suspended'}
                        </button>
                      </div>

                      <button onClick={() => handleDeleteDriver(drv)} className="w-full py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Delete Driver Account
                      </button>

                      {/* Appeal Panel */}
                      {drv.appeal && drv.appeal.status === 'Pending' && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-2 text-xs">
                          <p className="text-amber-500 font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Pending Ban Appeal</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">"{drv.appeal.appealText}"</p>
                          <div className="flex gap-1.5">
                            <button onClick={() => handleAppealStatus(drv, 'approve')} className="flex-1 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition">Accept Appeal</button>
                            <button onClick={() => handleAppealStatus(drv, 'reject')} className="flex-1 py-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded-lg transition">Reject Appeal</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {drivers.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-[#0a1020] rounded-2xl border border-slate-100 dark:border-[#111827]">
                <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-400">No Driver Accounts Registered</h3>
                <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">Driver accounts are automatically generated when registering a new van with "Create Associated Driver Account" checked.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VAN FORM MODAL ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#0a1020] rounded-2xl border border-slate-200 dark:border-[#1e293b] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#111827]">
                <h3 className="font-black text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Ambulance className="w-5 h-5 text-red-500" />{editVan ? 'Edit Van & Fleet Registry' : 'Register New ICU Van & Driver'}
                </h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#111827] text-slate-400 transition-all"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-5 space-y-6">
                {/* Section 1: Van Registry details */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5"><Ambulance className="w-3.5 h-3.5" /> Fleet Specifications</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      ['Van Reg Number*', 'vanNumber', 'e.g. DL 1C AB 1234'],
                      ['Driver Name*', 'driverName', 'Full legal name'],
                      ['Driver Phone*', 'driverPhone', '+91 XXXXX XXXXX'],
                      ['Paramedic Name', 'paramedicName', 'Staff paramedic name'],
                      ['Paramedic Phone', 'paramedicPhone', 'Paramedic contact number'],
                      ['Base Depot Location*', 'baseLocation', 'ICU hub or depot name'],
                      ['Serving City', 'city', 'e.g. Mumbai'],
                      ['Extra Notes / Equipment List', 'notes', 'Special configurations...']
                    ].map(([label, key, ph]) => (
                      <div key={key} className={key === 'notes' ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>
                        {key === 'notes' ? (
                          <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} className={inp + ' resize-none h-20'} />
                        ) : (
                          <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} className={inp} />
                        )}
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Duty Status</label>
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inp}>
                        {['Available', 'Maintenance', 'Offline'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Associated Driver Credentials (only for new vans) */}
                {!editVan && (
                  <div className="border-t border-slate-100 dark:border-[#111827] pt-5">
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        id="createDriverAccount"
                        checked={form.createDriverAccount}
                        onChange={e => setForm(f => ({ ...f, createDriverAccount: e.target.checked }))}
                        className="w-4.5 h-4.5 accent-emerald-500 rounded"
                      />
                      <label htmlFor="createDriverAccount" className="text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                        Simultaneously Create Driver Web Portal Credentials
                      </label>
                    </div>

                    {form.createDriverAccount && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-black/15 p-4 rounded-2xl border border-slate-100 dark:border-[#111827] overflow-hidden">
                        <div className="sm:col-span-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl mb-2 font-medium flex items-start gap-2">
                          <span className="text-base leading-none">ℹ️</span>
                          <span>Portal Username and Password will be automatically generated. The Username is based on the driver's name with a random 6-digit number, and the Password is a random 6-digit code. You will see them in a copyable popup after registration.</span>
                        </div>
                        {[
                          ['Email Address*', 'emailAddress', 'driver@pawvaidya.com'],
                          ['Emergency Contact Phone', 'emergencyContact', '+91 XXXXX XXXXX'],
                          ['Driving Licence Number', 'drivingLicenceNumber', 'DL-XXXXXXXXXXXXX'],
                          ['Gov Photo ID Number', 'govPhotoIdNumber', 'Aadhaar / Voter ID Number'],
                          ['Base Monthly Salary (₹)', 'baseSalary', 'Default: 8500', 'number']
                        ].map(([label, key, ph, type]) => (
                          <div key={key}>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>
                            <input
                              type={type || 'text'}
                              value={form[key]}
                              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                              placeholder={ph}
                              className={inp}
                            />
                          </div>
                        ))}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Joining Date</label>
                          <input
                            type="date"
                            value={form.joiningDate}
                            onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))}
                            className={inp}
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-5 border-t border-slate-100 dark:border-[#111827]">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#1e293b] text-slate-500 text-sm font-bold hover:bg-slate-50 dark:hover:bg-[#111827] transition-all">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{editVan ? 'Save Changes' : 'Register Unit & Driver'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DRIVER BAN MODAL ── */}
      <AnimatePresence>
        {showBanModal && selectedDriver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#0a1020] rounded-2xl border border-slate-200 dark:border-[#1e293b] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#111827]">
                <h3 className="font-black text-lg text-rose-500 flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5" /> Ban Driver Account
                </h3>
                <button onClick={() => setShowBanModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#111827] text-slate-400 transition-all"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You are about to suspend <strong>{selectedDriver.fullName}</strong>. This will set their duty status to Offline and prevent them from logging in.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Specify Reason for Suspension*</label>
                  <textarea
                    value={banReason}
                    onChange={e => setBanReason(e.target.value)}
                    placeholder="Describe specific policy violations or user misconduct reports..."
                    className={inp + ' resize-none h-24'}
                  />
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t border-slate-100 dark:border-[#111827]">
                <button onClick={() => setShowBanModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#1e293b] text-slate-500 text-sm font-bold hover:bg-slate-50 dark:hover:bg-[#111827] transition-all">Cancel</button>
                <button onClick={submitBan} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold shadow-lg shadow-rose-500/20 transition-all">
                  Confirm Account Ban
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SALARY DEDUCTION MODAL ── */}
      <AnimatePresence>
        {showDeductionModal && selectedDriver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#0a1020] rounded-2xl border border-slate-200 dark:border-[#1e293b] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#111827]">
                <h3 className="font-black text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-rose-500" /> Apply Salary Deduction
                </h3>
                <button onClick={() => setShowDeductionModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#111827] text-slate-400 transition-all"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Deduction Amount (₹)*</label>
                  <input
                    type="number"
                    value={deductionForm.amount}
                    onChange={e => setDeductionForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="e.g. 3000"
                    className={inp}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Violation Reason*</label>
                  <select
                    value={deductionForm.reason}
                    onChange={e => setDeductionForm(f => ({ ...f, reason: e.target.value }))}
                    className={inp}
                  >
                    <option value="">Select violation category...</option>
                    <option value="Direct Tip Solicitation">Direct Tip Solicitation (₹3,000 policy penalty)</option>
                    <option value="Reckless Driving">Reckless Driving / Vehicle Misuse</option>
                    <option value="Late Dispatch Acceptance">Repeated Late Dispatch Acceptance</option>
                    <option value="Rude Behavior to Client">Unprofessional Behavior to Pet Owner</option>
                    <option value="Unauthorized Absence">Offline during scheduled active shift</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Additional Remarks</label>
                  <textarea
                    value={deductionForm.remarks}
                    onChange={e => setDeductionForm(f => ({ ...f, remarks: e.target.value }))}
                    placeholder="Provide citations, booking IDs, or ticket context..."
                    className={inp + ' resize-none h-20'}
                  />
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t border-slate-100 dark:border-[#111827]">
                <button onClick={() => setShowDeductionModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#1e293b] text-slate-500 text-sm font-bold hover:bg-slate-50 dark:hover:bg-[#111827] transition-all">Cancel</button>
                <button onClick={submitDeduction} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold shadow-lg shadow-rose-500/20 transition-all">
                  Apply Deduction
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GENERATED CREDENTIALS MODAL ── */}
      <AnimatePresence>
        {showCredentialsModal && generatedCreds && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#0a1020] rounded-2xl border border-slate-200 dark:border-[#1e293b] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#111827]">
                <h3 className="font-black text-lg text-emerald-500 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Driver Account Created!
                </h3>
                <button onClick={() => setShowCredentialsModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#111827] text-slate-400 transition-all"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Please copy and share these temporary credentials with the driver. They are required to log into the Driver Web Portal.
                </p>
                <div className="space-y-3 bg-slate-50 dark:bg-black/15 p-4 rounded-xl border border-slate-100 dark:border-[#111827]">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Portal URL</label>
                    <div className="flex items-center justify-between bg-white dark:bg-[#0c1322] px-3 py-2 rounded-lg border border-slate-200/60 dark:border-[#1e293b]">
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-300">http://localhost:5176/Mobile-ICU-Dispatch</span>
                      <button onClick={() => {
                        navigator.clipboard.writeText("http://localhost:5176/Mobile-ICU-Dispatch");
                        toast.success("URL copied!");
                      }} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-bold hover:bg-slate-200">Copy</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Username (Login ID)</label>
                    <div className="flex items-center justify-between bg-white dark:bg-[#0c1322] px-3 py-2 rounded-lg border border-slate-200/60 dark:border-[#1e293b]">
                      <span className="text-sm font-mono font-bold text-slate-800 dark:text-emerald-400">{generatedCreds.username}</span>
                      <button onClick={() => {
                        navigator.clipboard.writeText(generatedCreds.username);
                        toast.success("Username copied!");
                      }} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-bold hover:bg-slate-200">Copy</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Temporary Password</label>
                    <div className="flex items-center justify-between bg-white dark:bg-[#0c1322] px-3 py-2 rounded-lg border border-slate-200/60 dark:border-[#1e293b]">
                      <span className="text-sm font-mono font-bold text-slate-800 dark:text-emerald-400">{generatedCreds.password}</span>
                      <button onClick={() => {
                        navigator.clipboard.writeText(generatedCreds.password);
                        toast.success("Password copied!");
                      }} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-bold hover:bg-slate-200">Copy</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 dark:border-[#111827] bg-slate-50/50 dark:bg-black/5">
                <button onClick={() => setShowCredentialsModal(false)} className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold transition-all">
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
