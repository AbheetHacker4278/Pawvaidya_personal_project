import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';

const RevenueBusinessSuite = () => {
  const { atoken } = useContext(AdminContext);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const [activeTab, setActiveTab] = useState('churn'); // churn, coupons, payouts
  const [loading, setLoading] = useState(false);

  // Churn Risk State
  const [churnUsers, setChurnUsers] = useState([]);
  const [churnStats, setChurnStats] = useState({});

  // Coupons State
  const [couponRoi, setCouponRoi] = useState([]);
  const [couponStats, setCouponStats] = useState({});

  // Payouts State
  const [payouts, setPayouts] = useState([]);
  const [payoutStats, setPayoutStats] = useState({});
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [payoutNotes, setPayoutNotes] = useState('');

  const fetchChurnRisk = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/churn-analysis`, {
        headers: { atoken }
      });
      if (data.success) {
        setChurnUsers(data.users);
        setChurnStats(data.stats);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to load churn risk telemetry');
    } finally {
      setLoading(false);
    }
  };

  const fetchCouponRoi = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/coupon-roi`, {
        headers: { atoken }
      });
      if (data.success) {
        setCouponRoi(data.coupons);
        setCouponStats(data.stats);
      }
    } catch (err) {
      toast.error('Failed to load coupon analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/doctor-payouts`, {
        headers: { atoken }
      });
      if (data.success) {
        setPayouts(data.payouts);
        setPayoutStats(data.stats);
      }
    } catch (err) {
      toast.error('Failed to load doctor payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'churn') fetchChurnRisk();
    if (activeTab === 'coupons') fetchCouponRoi();
    if (activeTab === 'payouts') fetchPayouts();
  }, [activeTab]);

  const handleOpenPayout = (doc) => {
    setSelectedDoctor(doc);
    setPayoutAmount(doc.pendingAmount);
    setShowPayoutModal(true);
  };

  const handleProcessPayout = async () => {
    if (!payoutAmount || isNaN(payoutAmount) || Number(payoutAmount) <= 0) {
      return toast.warn('Please enter a valid payout amount');
    }
    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/process-doctor-payout`, {
        doctorId: selectedDoctor._id,
        amount: payoutAmount,
        method: payoutMethod,
        notes: payoutNotes
      }, {
        headers: { atoken }
      });
      if (data.success) {
        toast.success(data.message);
        setShowPayoutModal(false);
        fetchPayouts();
        setPayoutNotes('');
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to process payout');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-900 to-green-950 p-6 rounded-2xl border border-emerald-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            💼 Revenue & Business Center
          </h1>
          <p className="text-emerald-400 text-xs mt-1 uppercase tracking-widest font-semibold">
            Predictive Customer Retention & Financial Settlement Suite
          </p>
        </div>
        <div className="flex bg-black/40 p-1 rounded-xl border border-emerald-800/60">
          {[
            { id: 'churn', label: 'Churn Risk Monitor', icon: '🚨' },
            { id: 'coupons', label: 'Coupon ROI Analytics', icon: '📉' },
            { id: 'payouts', label: 'Doctor Payouts', icon: '💰' }
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

      {!loading && activeTab === 'churn' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Overall Retention Risk', val: `${churnStats.avgRisk || 0}%`, color: 'border-amber-500' },
              { label: 'High Risk Customers', val: churnStats.high || 0, color: 'border-red-500' },
              { label: 'Medium Risk Customers', val: churnStats.medium || 0, color: 'border-yellow-500' },
              { label: 'Low Risk Customers', val: churnStats.low || 0, color: 'border-emerald-500' },
            ].map((s, i) => (
              <div key={i} className={`bg-white p-4 rounded-xl border-l-4 ${s.color} shadow-sm flex flex-col justify-between`}>
                <span className="text-slate-500 text-xs font-semibold">{s.label}</span>
                <span className="text-lg font-black text-slate-800 mt-2">{s.val}</span>
              </div>
            ))}
          </div>

          {/* Churn Risk List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-800 text-sm bg-slate-50/50">
              Retention Analytics Ledger
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Subscription</th>
                    <th className="p-4 text-center">Last Active Log</th>
                    <th className="p-4 text-center">Days Since Appt</th>
                    <th className="p-4 text-center">Total Bookings</th>
                    <th className="p-4 text-center">Retention Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {churnUsers.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{u.name}</div>
                        <div className="text-slate-500 text-[10px]">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.subscription ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.subscription ? 'Subscribed' : 'None'}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-600">
                        {u.daysSinceLogin === 180 ? 'N/A' : `${u.daysSinceLogin} days ago`}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-600">
                        {u.daysSinceAppt === 180 ? 'Never Booked' : `${u.daysSinceAppt} days ago`}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-600">{u.totalAppts} appts</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.riskLevel === 'High' ? 'bg-red-100 text-red-700' :
                            u.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {u.riskLevel} ({u.riskScore}%)
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'coupons' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Coupon Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Active Promotions', val: couponStats.activeCoupons || 0, icon: '🏷️' },
              { label: 'Gross Promotional Usage', val: couponStats.totalUsage || 0, icon: '🔥' },
              { label: 'Total Discount Costs', val: `₹${couponStats.totalDiscountGiven || 0}`, icon: '💸' },
              { label: 'Net Revenue Earned', val: `₹${couponStats.totalNetRevenue || 0}`, icon: '💰' },
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
              Coupon Utilization & Return on Investment (ROI)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <th className="p-4">Coupon Code</th>
                    <th className="p-4 text-center">Gross Redemptions</th>
                    <th className="p-4 text-center">Conversion Ratio</th>
                    <th className="p-4 text-center">Gross Revenue</th>
                    <th className="p-4 text-center">Discount Cost</th>
                    <th className="p-4 text-center">Net Revenue</th>
                    <th className="p-4 text-center">Promotion ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {couponRoi.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-black text-emerald-800 text-xs tracking-wider">{c.code}</td>
                      <td className="p-4 text-center font-bold text-slate-600">{c.usageCount} times</td>
                      <td className="p-4 text-center font-bold text-slate-600">{c.conversionRate}%</td>
                      <td className="p-4 text-center text-slate-600 font-semibold">₹{c.grossRevenue}</td>
                      <td className="p-4 text-center text-red-500 font-semibold">₹{c.discountGiven}</td>
                      <td className="p-4 text-center text-emerald-600 font-bold">₹{c.netRevenue}</td>
                      <td className="p-4 text-center font-black text-emerald-850">
                        {c.roi === 'N/A' ? 'N/A' : `${c.roi}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'payouts' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Payout Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Settled Doctors', val: payoutStats.totalDoctors || 0, icon: '👨‍⚕️' },
              { label: 'Total Settled Amount', val: `₹${payoutStats.totalPaid || 0}`, icon: '✅' },
              { label: 'Pending Settlement Pool', val: `₹${payoutStats.totalPending || 0}`, icon: '⏳' },
              { label: 'Pending Settlement Accounts', val: payoutStats.pendingDoctors || 0, icon: '🏦' },
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
              Doctor Earnings & Payout Settlements
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <th className="p-4">Doctor Details</th>
                    <th className="p-4 text-center">Consultations</th>
                    <th className="p-4 text-center">Accrued Earnings</th>
                    <th className="p-4 text-center">Settled Earnings</th>
                    <th className="p-4 text-center">Pending Settlement</th>
                    <th className="p-4 text-center">Bank Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payouts.map(doc => (
                    <tr key={doc._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img src={doc.image || 'https://via.placeholder.com/40'} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <div className="font-bold text-slate-800">Dr. {doc.name}</div>
                          <div className="text-slate-500 text-[10px]">{doc.speciality} | {doc.email}</div>
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-600">{doc.totalAppointments} sessions</td>
                      <td className="p-4 text-center font-bold text-slate-700">₹{doc.totalEarned}</td>
                      <td className="p-4 text-center font-bold text-emerald-600">₹{doc.paidAmount}</td>
                      <td className="p-4 text-center font-black text-amber-600">₹{doc.pendingAmount}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.bankVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {doc.bankVerified ? 'Verified' : 'Pending Verification'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleOpenPayout(doc)}
                          disabled={doc.pendingAmount <= 0}
                          className={`px-3 py-1 rounded text-[10px] font-bold transition ${
                            doc.pendingAmount > 0
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          Process Settlement
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

      {/* Payout Settlement Modal */}
      {showPayoutModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-sm">Settlement Transfer Request</h3>
              <button onClick={() => setShowPayoutModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Doctor</label>
                <div className="text-xs font-bold text-slate-800">Dr. {selectedDoctor.name}</div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Settlement Amount (₹)</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Transfer Gateway</label>
                <select
                  value={payoutMethod}
                  onChange={e => setPayoutMethod(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="bank_transfer">Direct Bank Transfer</option>
                  <option value="upi">UPI Gateway</option>
                  <option value="wallet">Virtual Wallet</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Audit Ledger Notes</label>
                <textarea
                  value={payoutNotes}
                  onChange={e => setPayoutNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  rows="2"
                  placeholder="Reference number or processing info"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleProcessPayout}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition shadow-md"
              >
                Confirm Settlement
              </button>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueBusinessSuite;
