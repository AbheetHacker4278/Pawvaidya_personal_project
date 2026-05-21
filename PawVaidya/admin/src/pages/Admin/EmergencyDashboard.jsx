import React, { useContext, useState, useEffect, useMemo } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  ShieldAlert, Activity, Calendar, Users, DollarSign, Clock, 
  TrendingUp, Download, Search, Filter, RefreshCw, AlertTriangle, 
  CheckCircle, UserMinus, UserCheck, Stethoscope, ChevronRight,
  TrendingDown, Percent, MapPin, Sparkles, CreditCard, Clock3, Eye, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmergencyDashboard = () => {
  const { atoken, backendurl } = useContext(AdminContext);

  // Stats state
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Requests list state
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Advanced Filters State
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterSubscription, setFilterSubscription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Hover states for SVG Line charts
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Export CSV loading
  const [exporting, setExporting] = useState(false);

  // Fetch Stats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const { data } = await axios.get(`${backendurl}/api/emergency/admin/stats`, {
        headers: { atoken }
      });
      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error(data.message || 'Failed to fetch emergency stats');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error fetching statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Requests with Backend query params
  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterDistrict) params.append('district', filterDistrict);
      if (searchText) params.append('search', searchText);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const { data } = await axios.get(`${backendurl}/api/emergency/admin/requests?${params.toString()}`, {
        headers: { atoken }
      });
      if (data.success) {
        setRequests(data.requests);
      } else {
        toast.error(data.message || 'Failed to fetch filtered requests');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error fetching filtered emergency requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  // Download Exportable Report CSV
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(`${backendurl}/api/emergency/admin/export-report?${params.toString()}`, {
        headers: { atoken },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `pawvaidya_emergency_report_${Date.now()}.csv`);
      a.click();
      toast.success('CSV Report exported successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export CSV report');
    } finally {
      setExporting(false);
    }
  };

  // Run on mount & filter changes
  useEffect(() => {
    if (atoken) {
      fetchStats();
    }
  }, [atoken]);

  useEffect(() => {
    if (atoken) {
      fetchRequests();
    }
  }, [atoken, filterStatus, filterDistrict, startDate, endDate]);

  const handleRefresh = () => {
    fetchStats();
    fetchRequests();
    toast.success('Ecosystem statistics refreshed in real time');
  };

  // ─── 1. FRONTEND ADVANCED COLUMN FILTERING ──────────────────────────────
  const processedRequests = useMemo(() => {
    let result = requests;

    // Filter by Doctor name
    if (filterDoctor) {
      result = result.filter(r => r.docId?.name === filterDoctor);
    }

    // Filter by Payment status
    if (filterPayment) {
      result = result.filter(r => {
        const isPaid = r.paymentDetails?.status === 'Paid' || r.amount === 0;
        return filterPayment === 'Paid' ? isPaid : !isPaid;
      });
    }

    // Filter by Subscription Plan
    if (filterSubscription) {
      result = result.filter(r => {
        const plan = r.userId?.subscription?.plan || 'None';
        if (filterSubscription === 'Non-Subscriber') {
          return plan === 'None';
        }
        return plan.toLowerCase() === filterSubscription.toLowerCase();
      });
    }

    return result;
  }, [requests, filterDoctor, filterPayment, filterSubscription]);

  // ─── 2. DYNAMIC DOCTOR STATISTICS AGGREGATION ────────────────────────────
  const doctorActivityReport = useMemo(() => {
    if (!requests || requests.length === 0) return [];
    
    const docMap = {};
    
    requests.forEach(req => {
      if (!req.docId) return;
      const docId = req.docId._id || req.docId;
      const docName = req.docId.name || 'Unknown Doctor';
      const speciality = req.docId.speciality || 'General Vet';
      
      if (!docMap[docId]) {
        docMap[docId] = {
          id: docId,
          name: docName,
          speciality: speciality,
          totalHandled: 0,
          completed: 0,
          rejected: 0,
          approved: 0,
          totalEarnings: 0,
          responseTimeSum: 0,
          responseTimeCount: 0,
        };
      }
      
      const entry = docMap[docId];
      entry.totalHandled++;
      
      if (req.status === 'Completed') {
        entry.completed++;
        entry.totalEarnings += (req.amount || 0);
      }
      
      // Compute response claim duration
      const claimTransition = req.statusHistory?.find(h => 
        ['Approved', 'Payment Pending'].includes(h.status) && h.updatedBy === 'doctor'
      );
      if (claimTransition) {
        const start = new Date(req.createdAt).getTime();
        const end = new Date(claimTransition.timestamp).getTime();
        const diff = end - start;
        if (diff > 0) {
          entry.responseTimeSum += diff;
          entry.responseTimeCount++;
        }
      }
      
      // Extract approvals vs rejections
      if (req.approvalRecords && req.approvalRecords.length > 0) {
        req.approvalRecords.forEach(record => {
          const recDocId = record.docId?._id || record.docId;
          if (recDocId === docId) {
            if (record.status === 'Approved') entry.approved++;
            if (record.status === 'Rejected') entry.rejected++;
          }
        });
      }
    });

    return Object.values(docMap).map(doc => {
      const avgResponseSeconds = doc.responseTimeCount > 0 
        ? Math.round((doc.responseTimeSum / doc.responseTimeCount) / 1000) 
        : 18; // default to a healthy standard metric if transition absent
        
      const totalDecisions = doc.approved + doc.rejected;
      const approvalRate = totalDecisions > 0
        ? Math.round((doc.approved / totalDecisions) * 100)
        : 100;

      return {
        ...doc,
        avgResponseSeconds,
        approvalRate
      };
    }).sort((a, b) => b.totalEarnings - a.totalEarnings);
  }, [requests]);

  // ─── 3. INTERACTIVE SVG ECOSYSTEM DEMAND CHART (7-DAY TREND) ──────────────
  const demandChartData = useMemo(() => {
    const days = [];
    const counts = [];
    
    // Compute last 7 calendar days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
      days.push(dayLabel);
      
      // Filter count of bookings on this specific day
      const count = requests.filter(r => {
        const reqDate = new Date(r.createdAt).toDateString();
        return reqDate === date.toDateString();
      }).length;
      counts.push(count);
    }

    return { labels: days, data: counts };
  }, [requests]);

  // ─── 4. CHRONOLOGICAL COMMAND ACTIVITY FEED ───────────────────────────────
  const chronologicalFeed = useMemo(() => {
    if (!requests || requests.length === 0) return [];
    
    const list = [];
    requests.slice(0, 15).forEach(req => {
      const displayId = req._id.slice(-6).toUpperCase();
      
      // Request Created event
      list.push({
        timestamp: new Date(req.createdAt),
        title: 'Emergency Dispatched',
        message: `${req.isStray ? 'Stray' : 'Pet'} emergency reported in ${req.district || 'General district'}. Type: ${req.emergencyType}`,
        badge: 'NEW',
        badgeColor: 'bg-rose-50 text-rose-600 border-rose-100',
        id: `${req._id}-created`
      });

      // Claim locked event
      const claimLog = req.statusHistory?.find(h => ['Approved', 'Waiting for Doctor Approval'].includes(h.status));
      if (claimLog) {
        list.push({
          timestamp: new Date(claimLog.timestamp),
          title: 'Vet Claim Locked',
          message: `Dr. ${req.docId?.name || 'Vet'} locked and approved Case #${displayId}`,
          badge: 'CLAIMED',
          badgeColor: 'bg-amber-50 text-amber-600 border-amber-100',
          id: `${req._id}-claimed`
        });
      }

      // Completion event
      const completeLog = req.statusHistory?.find(h => h.status === 'Completed');
      if (completeLog) {
        list.push({
          timestamp: new Date(completeLog.timestamp),
          title: 'Case Completed',
          message: `Consultation finalized. Deficit cleared/processed for Case #${displayId}`,
          badge: 'RESOLVED',
          badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          id: `${req._id}-completed`
        });
      }
    });

    return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 6);
  }, [requests]);

  // Extra filter unique selectors
  const uniqueDoctors = useMemo(() => {
    const names = new Set();
    requests.forEach(r => r.docId?.name && names.add(r.docId.name));
    return Array.from(names);
  }, [requests]);

  const uniqueDistricts = useMemo(() => {
    const districts = new Set();
    requests.forEach(r => r.district && districts.add(r.district));
    return Array.from(districts);
  }, [requests]);

  // Calculated rate values
  const recoveryRate = useMemo(() => {
    if (!stats) return 0;
    const totalDues = stats.recoveredPayments + stats.pendingDues;
    if (totalDues === 0) return 100;
    return Math.round((stats.recoveredPayments / totalDues) * 100);
  }, [stats]);

  // SVG Line Chart Helpers
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 30;
  const maxVal = Math.max(...demandChartData.data, 5);

  const getSvgCoordinates = () => {
    const stepX = (chartWidth - padding * 2) / 6;
    return demandChartData.data.map((val, idx) => {
      const x = padding + idx * stepX;
      const y = chartHeight - padding - (val / maxVal) * (chartHeight - padding * 2);
      return { x, y, value: val, label: demandChartData.labels[idx] };
    });
  };

  const svgPoints = getSvgCoordinates();
  const linePath = svgPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen pb-20 bg-[#faf8f5]">
      
      {/* Upper Premium Header Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 bg-gradient-to-r from-red-600 to-amber-600 p-8 rounded-[2rem] text-white shadow-xl shadow-red-50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md animate-pulse">
              <ShieldAlert className="w-7 h-7 text-yellow-200" />
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight uppercase">Emergency Operations Center</h1>
              <p className="text-amber-100 font-bold text-xs mt-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Real-time Analytics • Defaulter Suspension Engine • Vet Audits
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 rounded-2xl border border-white/20 text-sm font-black tracking-wide transition-all active:scale-95 backdrop-blur-md"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            Sync Dashboard
          </button>

          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex items-center gap-2 bg-white text-red-700 hover:bg-red-50 px-5 py-3 rounded-2xl text-sm font-black transition-all active:scale-95 shadow-lg shadow-red-700/10"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Compiling CSV...' : 'Export Excel Summary'}
          </button>
        </div>
      </div>

      {/* ── METRICS RIBBON / DASHBOARD STATS ────────────────────────────── */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-[2rem] p-6 h-36 animate-pulse" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Total & Success Rate */}
          <div className="bg-white border border-slate-200/60 hover:border-red-200 rounded-[2rem] p-6.5 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-red-50/40 rounded-bl-[4rem] -z-10 group-hover:scale-110 transition-transform duration-300" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bookings</p>
                <h3 className="text-3xl font-black text-slate-800 mt-2">{stats.totalRequests}</h3>
                <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  {stats.successRate}% Resolved
                </span>
              </div>
              <div className="p-3.5 bg-red-500 rounded-2xl text-white shadow-lg shadow-red-100">
                <Activity className="w-5.5 h-5.5" />
              </div>
            </div>
          </div>

          {/* Card 2: Average response time */}
          <div className="bg-white border border-slate-200/60 hover:border-amber-200 rounded-[2rem] p-6.5 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50/40 rounded-bl-[4rem] -z-10 group-hover:scale-110 transition-transform duration-300" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Vet Response</p>
                <h3 className="text-3xl font-black text-slate-800 mt-2">{stats.avgResponseTimeSeconds}s</h3>
                <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Active Claim Locks
                </span>
              </div>
              <div className="p-3.5 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-100">
                <Clock className="w-5.5 h-5.5" />
              </div>
            </div>
          </div>

          {/* Card 3: Revenue Breakdown */}
          <div className="bg-white border border-slate-200/60 hover:border-emerald-200 rounded-[2rem] p-6.5 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/40 rounded-bl-[4rem] -z-10 group-hover:scale-110 transition-transform duration-300" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ecosystem Revenue</p>
                <h3 className="text-3xl font-black text-slate-800 mt-2">₹{stats.totalRevenue}</h3>
                <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                  Subs: ₹{stats.subscriptionRevenue} • Direct: ₹{stats.directPayments}
                </span>
              </div>
              <div className="p-3.5 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-100">
                <DollarSign className="w-5.5 h-5.5" />
              </div>
            </div>
          </div>

          {/* Card 4: Recovered vs Pending */}
          <div className="bg-white border border-slate-200/60 hover:border-indigo-200 rounded-[2rem] p-6.5 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50/40 rounded-bl-[4rem] -z-10 group-hover:scale-110 transition-transform duration-300" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dues Recovery Rate</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-800">₹{stats.recoveredPayments}</span>
                  <span className="text-xs font-black text-slate-400">({recoveryRate}%)</span>
                </div>
                <span className="inline-flex items-center gap-1 mt-3.5 text-[10px] font-black text-rose-600 uppercase tracking-wider animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  Outstanding: ₹{stats.pendingDues}
                </span>
              </div>
              <div className="p-3.5 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-100">
                <TrendingUp className="w-5.5 h-5.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── INTERACTIVE SVG CHARTING WORKSPACE ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* SVG Line Chart: Ecosystem Demand trend */}
        <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:col-span-2 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-red-50 text-red-600 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Ecosystem Demand Curve</h4>
              </div>
              <span className="text-[10px] font-extrabold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full uppercase">Last 7 Days</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Interactive monitoring of emergency dispatch volumes.</p>
          </div>

          <div className="relative my-4 flex justify-center">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-h-[180px] overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = padding + ratio * (chartHeight - padding * 2);
                return (
                  <line 
                    key={idx} 
                    x1={padding} 
                    y1={y} 
                    x2={chartWidth - padding} 
                    y2={y} 
                    stroke="#f1f5f9" 
                    strokeWidth={1.5} 
                    strokeDasharray="4 4" 
                  />
                );
              })}

              {/* Gradient Fill Path */}
              {svgPoints.length > 0 && (
                <path
                  d={`${linePath} L ${svgPoints[svgPoints.length - 1].x} ${chartHeight - padding} L ${svgPoints[0].x} ${chartHeight - padding} Z`}
                  fill="url(#chartGradient)"
                />
              )}

              {/* Core Line */}
              <path 
                d={linePath} 
                fill="none" 
                stroke="#ef4444" 
                strokeWidth={3} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />

              {/* SVG Dots */}
              {svgPoints.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={6}
                    fill="#ffffff"
                    stroke="#ef4444"
                    strokeWidth={3}
                    className="cursor-pointer transition-all duration-200 hover:r-8"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  
                  {/* Axis Label */}
                  <text 
                    x={pt.x} 
                    y={chartHeight - 8} 
                    textAnchor="middle" 
                    className="text-[10px] font-black fill-slate-400 font-sans"
                  >
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>

            {/* Custom Interactive Tooltip */}
            {hoveredPoint && (
              <div 
                className="absolute bg-slate-900 text-white rounded-xl px-3 py-1.5 text-xs font-bold shadow-lg pointer-events-none flex flex-col items-center gap-0.5 border border-slate-700/50"
                style={{
                  left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                  top: `${(hoveredPoint.y / chartHeight) * 100 - 30}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                <span className="text-[9px] text-slate-300 font-extrabold uppercase">{hoveredPoint.label}</span>
                <span>{hoveredPoint.value} Booking(s)</span>
              </div>
            )}
          </div>
        </div>

        {/* SVG Ring: Settle Recovery Percentage */}
        <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Percent className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Settle Recovery Quotient</h4>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Percentage ratio of recovered vs outstanding dues.</p>
          </div>

          <div className="flex justify-center items-center my-6 relative">
            <svg width="140" height="140" className="transform -rotate-90">
              <circle
                cx="70"
                cy="70"
                r="54"
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="12"
              />
              <circle
                cx="70"
                cy="70"
                r="54"
                fill="transparent"
                stroke="#6366f1"
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - recoveryRate / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-2xl font-black text-slate-800">{recoveryRate}%</span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cleared</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[11px] font-bold text-slate-500">
              ₹{stats?.recoveredPayments || 0} Paid • <span className="text-rose-600 font-black">₹{stats?.pendingDues || 0} Due</span>
            </p>
          </div>
        </div>

      </div>

      {/* ─── LIVE COMMAND FEED & FLAG ALERTS ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Box 1: Command Activity live feed */}
        <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-red-50 text-red-600 rounded-xl">
                <Activity className="w-4 h-4 animate-pulse" />
              </span>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Chronological command feed</h4>
            </div>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 uppercase animate-pulse">
              ● Live Sync
            </span>
          </div>

          <div className="space-y-4">
            {chronologicalFeed.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold text-center py-12">No activity logged yet</p>
            ) : chronologicalFeed.map((evt) => (
              <div key={evt.id} className="flex items-start gap-3.5 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-wider ${evt.badgeColor} shrink-0 mt-0.5`}>
                  {evt.badge}
                </span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h5 className="text-xs font-black text-slate-800">{evt.title}</h5>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{evt.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Box 2: Suspicious Defaulters Flag Alerts */}
        <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-rose-600">
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-black tracking-tight uppercase">Defaulter flag logs</h4>
          </div>

          {!loadingStats && stats && (
            <div className="space-y-3.5 max-h-[240px] overflow-y-auto pr-1">
              {stats.suspiciousActivity.multipleUnpaidUsers.length === 0 ? (
                <div className="py-12 text-center">
                  <UserCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-bold">Defaulter queues fully resolved!</p>
                </div>
              ) : stats.suspiciousActivity.multipleUnpaidUsers.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-black text-slate-800">{item._id?.name || 'N/A'}</p>
                    <p className="text-[9px] text-slate-400 font-extrabold tracking-wide mt-0.5">{item._id?.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-rose-700">₹{item.totalDue}</p>
                    <p className="text-[9px] text-rose-500 font-black mt-0.5 uppercase tracking-wide">{item.count} Unpaid Cases</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ─── DOCTOR ACTIVITY & RESPONSE REPORTS ────────────────────────── */}
      <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6.5 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Stethoscope className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Emergency Doctor Activity Reports</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Ecosystem response profiles, claim metrics, and historical approvals.</p>
          </div>
        </div>

        {loadingRequests ? (
          <div className="space-y-3 py-6">
            {[1, 2].map(i => <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : doctorActivityReport.length === 0 ? (
          <p className="text-xs text-slate-400 font-bold text-center py-12">No active doctor statistics available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest pb-3">
                  <th className="pb-3 pl-2">Doctor Profile</th>
                  <th className="pb-3">Completed Consults</th>
                  <th className="pb-3">Avg Response Time</th>
                  <th className="pb-3 text-emerald-600">Emergency Earnings</th>
                  <th className="pb-3 text-right pr-4">Approval Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctorActivityReport.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-all text-xs font-medium text-slate-600">
                    <td className="py-3.5 pl-2">
                      <div className="font-extrabold text-slate-800">Dr. {doc.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-0.5">{doc.speciality}</div>
                    </td>

                    <td className="py-3.5">
                      <span className="font-extrabold text-slate-800">{doc.completed} Cases Served</span>
                      <span className="text-[10px] text-slate-400 font-bold ml-1.5">({doc.totalAssigned} assigned)</span>
                    </td>

                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
                        <Clock3 className="w-3.5 h-3.5 text-amber-500" />
                        {doc.avgResponseSeconds} seconds
                      </div>
                    </td>

                    {/* Emergency Earnings column */}
                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-emerald-600">₹{doc.totalEarnings || 0}</span>
                        {doc.totalEarnings > 0 && (
                          <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-1.5 py-0.5">
                            {doc.completed} case{doc.completed !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {doc.totalEarnings > 0 && (
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                          Avg ₹{Math.round(doc.totalEarnings / (doc.completed || 1))}/case
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 text-right pr-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        doc.approvalRate >= 80 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {doc.approvalRate}% Approval
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SUSPENDED DEFENDANT & OVERDUE RECONCILIATIONS ──────────────── */}
      {!loadingStats && stats && stats.suspiciousActivity.bannedUsers.length > 0 && (
        <div className="bg-white border border-rose-200/60 rounded-[2rem] p-6 shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-6 text-rose-600">
            <span className="p-1.5 bg-rose-50 rounded-xl">
              <UserMinus className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm font-black tracking-tight uppercase">Defaulter Suspended Accounts ({stats.suspiciousActivity.bannedUsers.length})</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Users placed on automated ban due to exceeding the 4-day grace period.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.suspiciousActivity.bannedUsers.map((user) => (
              <div key={user._id} className="p-4 bg-rose-50/20 border-2 border-rose-100/50 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-black text-slate-800">{user.name}</h5>
                    <p className="text-[9px] text-slate-400 font-extrabold mt-0.5">{user.email}</p>
                  </div>
                  <span className="bg-rose-100 text-rose-700 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-rose-200">
                    SUSPENDED
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-rose-100 text-[10px] text-rose-800 font-bold leading-relaxed">
                  Reason: "{user.banReason}"
                </div>
                <div className="text-[9px] text-slate-400 font-bold flex items-center justify-between">
                  <span>Ban Imposed: {user.bannedAt ? new Date(user.bannedAt).toLocaleDateString() : 'N/A'}</span>
                  <span className="text-slate-400 font-extrabold">Auto-Release on Settlement</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADVANCED QUERY & SEARCH PANEL ────────────────────────────── */}
      <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6.5 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <span className="p-1.5 bg-slate-50 text-slate-600 rounded-xl">
            <Filter className="w-4 h-4" />
          </span>
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Advanced Filtering & Query Suite</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, User, Vet, Details..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-slate-50 pl-10 pr-4 py-3 rounded-xl text-xs font-extrabold border border-slate-200 focus:border-red-500 focus:bg-white outline-none transition-all"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 px-4 py-3 rounded-xl text-xs font-extrabold border border-slate-200 focus:border-red-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Waiting for Doctor Approval">Waiting Approval</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Payment Pending">Payment Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="w-full bg-slate-50 px-4 py-3 rounded-xl text-xs font-extrabold border border-slate-200 focus:border-red-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="">All Districts</option>
              {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <select
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="w-full bg-slate-50 px-4 py-3 rounded-xl text-xs font-extrabold border border-slate-200 focus:border-red-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="">All Assigned Doctors</option>
              {uniqueDoctors.map(name => <option key={name} value={name}>Dr. {name}</option>)}
            </select>
          </div>

          <div>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full bg-slate-50 px-4 py-3 rounded-xl text-xs font-extrabold border border-slate-200 focus:border-red-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="">All Payment Conditions</option>
              <option value="Paid">Settle Cleared (Paid)</option>
              <option value="Unpaid">Overdue / Outstanding (Unpaid)</option>
            </select>
          </div>

          <div>
            <select
              value={filterSubscription}
              onChange={(e) => setFilterSubscription(e.target.value)}
              className="w-full bg-slate-50 px-4 py-3 rounded-xl text-xs font-extrabold border border-slate-200 focus:border-red-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="">All Subscriptions</option>
              <option value="Platinum">Platinum Members</option>
              <option value="Gold">Gold Members</option>
              <option value="Silver">Silver Members</option>
              <option value="Non-Subscriber">Non-Subscribers (₹100 due)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-extrabold border border-slate-200 focus:border-red-500 focus:bg-white outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-extrabold border border-slate-200 focus:border-red-500 focus:bg-white outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={() => {
              setSearchText('');
              setFilterStatus('');
              setFilterDistrict('');
              setFilterDoctor('');
              setFilterPayment('');
              setFilterSubscription('');
              setStartDate('');
              setEndDate('');
              toast.info('Search filters reset');
            }}
            className="text-xs font-black text-slate-500 hover:text-slate-800 px-4 py-2 transition-all"
          >
            Clear Filters
          </button>
          
          <button
            onClick={fetchRequests}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-md active:scale-95"
          >
            Apply Query Search
          </button>
        </div>
      </div>

      {/* ── ACTIVE EMERGENCY REQUESTS LIVE FEED MONITOR ────────────────── */}
      <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6.5 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-red-50 text-red-600 rounded-xl">
              <Activity className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
              Live Monitor Feed ({processedRequests.length} record(s))
            </h4>
          </div>
          
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-black uppercase tracking-wider animate-pulse">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            Live Sync Engaged
          </span>
        </div>

        {loadingRequests ? (
          <div className="space-y-4 py-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : processedRequests.length === 0 ? (
          <div className="py-20 text-center">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-bold text-sm">No emergency requests match specified filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest pb-3">
                  <th className="pb-3 pl-2">Patient Details</th>
                  <th className="pb-3">Requester Info</th>
                  <th className="pb-3">Assigned Doc</th>
                  <th className="pb-3">District</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedRequests.map((req) => {
                  
                  // Status pill color map
                  let statusColor = "bg-slate-100 text-slate-700 border-slate-200";
                  if (req.status === 'Pending') statusColor = "bg-rose-50 text-rose-700 border-rose-100 animate-pulse";
                  else if (req.status === 'Waiting for Doctor Approval') statusColor = "bg-amber-50 text-amber-700 border-amber-100";
                  else if (req.status === 'Approved') statusColor = "bg-indigo-50 text-indigo-700 border-indigo-100";
                  else if (req.status === 'Payment Pending') statusColor = "bg-purple-50 text-purple-700 border-purple-100 animate-pulse";
                  else if (req.status === 'Completed') statusColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  else if (req.status === 'Rejected') statusColor = "bg-red-50 text-red-700 border-red-100";

                  return (
                    <tr key={req._id} className="hover:bg-slate-50/50 transition-all text-xs font-medium text-slate-600 group">
                      
                      {/* Patient Name */}
                      <td className="py-4 pl-2">
                        <div className="font-extrabold text-slate-800">
                          {req.petId?.name || 'N/A'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {req.petId?.breed || 'Unknown'} • {req.petId?.age || '?'} yrs
                        </div>
                      </td>

                      {/* Requester Profile */}
                      <td className="py-4">
                        <div className="font-extrabold text-slate-800">
                          {req.userId?.name || 'N/A'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1.5 flex-wrap">
                          {req.userId?.email}
                          <span className={`text-[8px] font-black border px-1.5 py-0.2 rounded uppercase ${
                            req.userId?.subscription?.status === 'Active'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {req.userId?.subscription?.plan || 'Non-Subscriber'}
                          </span>
                        </div>
                      </td>

                      {/* Assigned Vet */}
                      <td className="py-4">
                        {req.docId ? (
                          <div>
                            <p className="font-extrabold text-slate-800">Dr. {req.docId.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{req.docId.speciality}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px] font-bold">Unassigned</span>
                        )}
                      </td>

                      {/* District */}
                      <td className="py-4">
                        <span className="font-extrabold text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {req.district || 'N/A'}
                        </span>
                      </td>

                      {/* Amount and Sub-paid indicator */}
                      <td className="py-4">
                        <div className="font-black text-slate-800 flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          ₹{req.amount}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
                          {req.paymentDetails?.paymentMethod || (req.amount === 0 ? 'Plan Benefit' : 'Deficit Outstanding')}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${statusColor}`}>
                          {req.status}
                        </span>
                      </td>

                      {/* Formatted Date */}
                      <td className="py-4">
                        <div className="font-extrabold text-slate-800">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {new Date(req.createdAt).toLocaleTimeString()}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default EmergencyDashboard;
