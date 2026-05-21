import React, { useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CSContext } from '../context/CSContext';
import { FaSearch, FaWallet, FaPaw, FaCalendarAlt, FaExclamationTriangle, FaUser, FaChartPie, FaCrown, FaHistory, FaUndo, FaTimes, FaStethoscope, FaClipboardList, FaHeartbeat, FaMedkit } from 'react-icons/fa';

const Customer360 = () => {
  const { backendUrl, cstoken } = useContext(CSContext);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState(null);

  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantPlan, setGrantPlan] = useState('Silver');
  const [grantDuration, setGrantDuration] = useState('1');
  const [grantReason, setGrantReason] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);

  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeLoading, setRevokeLoading] = useState(false);

  const [selectedAppId, setSelectedAppId] = useState(null);
  const [activeDiagTab, setActiveDiagTab] = useState('gold');

  const fetchCustomerData = async (e) => {
    e.preventDefault();
    if (!email) return toast.warning('Please enter an email address.');

    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/cs/user-360/${email}`, {
        headers: { cstoken }
      });
      if (data.success) {
        setCustomerData(data);
        toast.success('Customer profile loaded.');
      } else {
        toast.error(data.message || 'User not found.');
        setCustomerData(null);
      }
    } catch (error) {
      toast.error('Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    if (!refundAmount || !refundReason) return toast.warning('Please fill out all fields.');

    try {
      setRefundLoading(true);
      const { data } = await axios.post(`${backendUrl}/api/cs/refund`, {
        email: customerData.user.email,
        amount: refundAmount,
        reason: refundReason,
        appointmentId: selectedAppId
      }, { headers: { cstoken } });

      if (data.success) {
        toast.success(data.message);
        setCustomerData({
          ...customerData,
          user: { ...customerData.user, pawWallet: data.newBalance }
        });
        setRefundModalOpen(false);
        setRefundAmount('');
        setRefundReason('');
        setSelectedAppId(null);
        fetchCustomerData({ preventDefault: () => {} }); // Refresh to show refund status
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error processing refund.');
    } finally {
      setRefundLoading(false);
    }
  };

  const handleGrantSubscription = async (e) => {
    e.preventDefault();
    if (!grantReason) return toast.warning('Please provide a reason.');

    try {
      setGrantLoading(true);
      const { data } = await axios.post(`${backendUrl}/api/cs/grant-subscription`, {
        userId: customerData.user._id,
        plan: grantPlan,
        durationMonths: grantDuration,
        reason: grantReason
      }, { headers: { cstoken } });

      if (data.success) {
        toast.success(data.message);
        setGrantModalOpen(false);
        setGrantReason('');
        fetchCustomerData({ preventDefault: () => {} });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error granting subscription.');
    } finally {
      setGrantLoading(false);
    }
  };

  const handleRevokeSubscription = async (e) => {
    e.preventDefault();
    if (!revokeReason) return toast.warning('Please provide a reason.');

    try {
      setRevokeLoading(true);
      const { data } = await axios.post(`${backendUrl}/api/cs/revoke-subscription`, {
        userId: customerData.user._id,
        reason: revokeReason
      }, { headers: { cstoken } });

      if (data.success) {
        toast.success(data.message);
        setRevokeModalOpen(false);
        setRevokeReason('');
        fetchCustomerData({ preventDefault: () => {} });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error revoking subscription.');
    } finally {
      setRevokeLoading(false);
    }
  };

  let paymentMethodCounts = {};
  let totalTransactions = 0;
  let renewals = 0;

  if (customerData) {
    customerData.appointments?.forEach(app => {
      const pm = app.paymentMethod || 'Cash';
      paymentMethodCounts[pm] = (paymentMethodCounts[pm] || 0) + 1;
      totalTransactions++;
    });
    customerData.subscriptions?.forEach(sub => {
      const pm = sub.paymentMethod || 'Unknown';
      paymentMethodCounts[pm] = (paymentMethodCounts[pm] || 0) + 1;
      totalTransactions++;
      if (sub.status === 'Active' || sub.status === 'Expired') renewals++;
    });

    if (customerData.subscriptions?.length === 0 && customerData.user.subscription?.plan !== 'None') {
      renewals++;
      paymentMethodCounts['Unknown'] = (paymentMethodCounts['Unknown'] || 0) + 1;
      totalTransactions++;
    }
  }

  const paymentMatrix = Object.keys(paymentMethodCounts).map(method => ({
    method,
    count: paymentMethodCounts[method],
    percentage: totalTransactions > 0 ? (paymentMethodCounts[method] / totalTransactions) * 100 : 0
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FaUser className="text-emerald-500" /> Customer 360° Profile
        </h2>
        <form onSubmit={fetchCustomerData} className="flex gap-4 max-w-2xl">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Search user by email address..."
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Searching...' : <><FaSearch /> Search</>}
          </button>
        </form>
      </div>

      {customerData && customerData.user && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* User Overview Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-8 relative">
              <div className="flex items-center gap-6">
                <img
                  src={customerData.user.image || `https://ui-avatars.com/api/?name=${customerData.user.name}&background=10b981&color=fff`}
                  alt={customerData.user.name}
                  className="w-24 h-24 rounded-full border-4 border-white/20 shadow-xl"
                />
                <div className="text-white space-y-2">
                  <h1 className="text-3xl font-black">{customerData.user.name}</h1>
                  <p className="text-slate-300 flex items-center gap-2">
                    <span className="font-medium">{customerData.user.email}</span> • 
                    <span>{customerData.user.phone}</span>
                  </p>
                  <div className="flex gap-3 pt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      customerData.user.subscription?.plan === 'Platinum' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/50' : 
                      customerData.user.subscription?.plan === 'Gold' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50' : 
                      'bg-slate-500/50 text-slate-200'
                    }`}>
                      {customerData.user.subscription?.plan || 'No Subscription'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${customerData.user.isBanned ? 'bg-red-500/20 text-red-200 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50'}`}>
                      {customerData.user.isBanned ? 'Banned' : 'Active Account'}
                    </span>
                  </div>
                </div>
                
                {/* Wallet Info Box */}
                <div className="ml-auto bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-white text-center min-w-[200px]">
                  <p className="text-slate-300 text-sm font-medium uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                    <FaWallet className="text-amber-400" /> PawWallet Balance
                  </p>
                  <p className="text-3xl font-black text-amber-400 mb-3">₹{customerData.user.pawWallet}</p>
                  <button 
                    onClick={() => setRefundModalOpen(true)}
                    className="w-full py-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-lg text-sm font-bold"
                  >
                    Issue Refund
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Layout for details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Pets List */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FaPaw className="text-amber-500" /> Registered Pets
              </h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {customerData.pets.length > 0 ? customerData.pets.map(pet => (
                  <div key={pet._id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <img src={pet.image} alt={pet.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="font-bold text-slate-700">{pet.name}</h4>
                      <p className="text-xs text-slate-500">{pet.type} • {pet.breed}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-500 text-sm text-center py-4">No pets registered.</p>
                )}
              </div>
            </div>

            {/* Appointments */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-500" /> Recent Appointments
              </h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {customerData.appointments.length > 0 ? customerData.appointments.map(app => (
                  <div key={app._id} className={`p-3 rounded-xl border ${app.cancelled ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-700 text-xs">{new Date(app.slotDate).toLocaleDateString()} at {app.slotTime}</h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        app.cancelled ? 'bg-red-200 text-red-800' : 
                        app.isCompleted ? 'bg-emerald-200 text-emerald-800' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {app.cancelled ? 'Cancelled' : app.isCompleted ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {app.doctorImage && <img src={app.doctorImage} alt="" className="w-5 h-5 rounded-full" />}
                      <p className="text-[11px] text-slate-600 font-medium">Dr. {app.doctorName}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Fee: ₹{app.amount} • {app.paymentMethod}</p>
                    
                    {app.cancelled && (
                      <div className="mt-2 pt-2 border-t border-red-200/50">
                        <p className="text-[10px] text-red-700 font-medium italic">
                          By: <span className="uppercase">{app.cancelledBy || 'system'}</span> • {app.cancelReason || 'No reason provided'}
                        </p>
                        
                        {app.payment && app.refundStatus !== 'completed' && (
                          <button 
                            onClick={() => {
                              setSelectedAppId(app._id);
                              setRefundAmount(app.amount + (app.walletDeduction || 0));
                              setRefundReason(`Refund for appointment cancelled by ${app.cancelledBy}`);
                              setRefundModalOpen(true);
                            }}
                            className="mt-2 w-full py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <FaUndo size={10} /> Issue Direct Refund
                          </button>
                        )}
                        {app.refundStatus === 'completed' && (
                          <div className="mt-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg text-center border border-emerald-200">
                            Refunded ₹{app.refundAmount}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )) : (
                  <p className="text-slate-500 text-sm text-center py-4">No recent appointments.</p>
                )}
              </div>
            </div>

            {/* Cruelty Reports */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FaExclamationTriangle className="text-red-500" /> Cruelty Reports Made
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {customerData.crueltyReports.length > 0 ? customerData.crueltyReports.map(rep => (
                  <div key={rep._id} className="p-3 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-700 text-sm">{rep.animalType}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${rep.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{rep.incidentDescription}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(rep.createdAt).toLocaleDateString()}</p>
                  </div>
                )) : (
                  <p className="text-slate-500 text-sm text-center py-4">No cruelty reports filed.</p>
                )}
              </div>
            </div>
          </div>

          {/* Subscriptions & Payment Matrix Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Subscription History */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FaHistory className="text-purple-500" /> Subscription History
                </h3>
                <div className="flex gap-2">
                  {customerData.user.subscription?.plan === 'None' ? (
                    <button 
                      onClick={() => setGrantModalOpen(true)}
                      className="text-[10px] font-bold px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors uppercase"
                    >
                      Grant Subscription
                    </button>
                  ) : (
                    <button 
                      onClick={() => setRevokeModalOpen(true)}
                      className="text-[10px] font-bold px-3 py-1 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors uppercase"
                    >
                      Revoke Current
                    </button>
                  )}
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    {renewals} Renewals/Purchases
                  </span>
                </div>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {customerData.subscriptions && customerData.subscriptions.length > 0 ? customerData.subscriptions.map(sub => (
                  <div key={sub._id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FaCrown className={`text-lg ${sub.plan === 'Platinum' ? 'text-purple-500' : sub.plan === 'Gold' ? 'text-amber-500' : 'text-slate-400'}`} />
                        <h4 className="font-bold text-slate-700">{sub.plan} Plan</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${sub.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Purchased: {new Date(sub.startDate).toLocaleDateString()} via {sub.paymentMethod}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-700">₹{sub.amount}</p>
                    </div>
                  </div>
                )) : customerData.user.subscription && customerData.user.subscription.plan !== 'None' ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FaCrown className={`text-lg ${customerData.user.subscription.plan === 'Platinum' ? 'text-purple-500' : customerData.user.subscription.plan === 'Gold' ? 'text-amber-500' : 'text-slate-400'}`} />
                        <h4 className="font-bold text-slate-700">{customerData.user.subscription.plan} Plan</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${customerData.user.subscription.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                          {customerData.user.subscription.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Expires: {new Date(customerData.user.subscription.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-700">Legacy Purchase</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm text-center py-4">No past subscriptions found.</p>
                )}
              </div>
            </div>

            {/* Payment Matrix */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FaChartPie className="text-emerald-500" /> Payment Methods Matrix
              </h3>
              {totalTransactions > 0 ? (
                <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {paymentMatrix.map((item, idx) => (
                    <div key={item.method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold text-slate-700 flex items-center gap-2">
                          {item.method === 'Wallet' && <FaWallet className="text-amber-500" />}
                          {item.method}
                        </span>
                        <span className="text-slate-500 font-medium">{item.count} trxn ({Math.round(item.percentage)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full ${idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-amber-500' : 'bg-purple-500'}`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Total Transactions Tracked</span>
                    <span className="font-black text-slate-800 text-lg">{totalTransactions}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">Not enough transaction data.</p>
              )}
            </div>

          </div>

          {/* Premium Diagnostic Telemetry Logs */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FaStethoscope className="text-amber-500" /> Premium Diagnostic Telemetry Logs
                </h3>
                <p className="text-xs text-slate-500 mt-1">Monitor user symptom-severity entries, automated predictions, vital checks, and active chronicles.</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveDiagTab('gold')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    activeDiagTab === 'gold' 
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <FaCrown /> 🥇 Gold Disease Predictor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDiagTab('platinum')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    activeDiagTab === 'platinum' 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <FaCrown /> 💎 Platinum AI Vitals
                </button>
              </div>
            </div>

            {/* TAB CONTENTS */}
            {activeDiagTab === 'gold' ? (
              <div className="space-y-4">
                {customerData.animalDiseases && customerData.animalDiseases.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {customerData.animalDiseases.map((caseItem) => (
                      <div key={caseItem._id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                        {/* Title Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/60 pb-3 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-slate-800 text-base">{caseItem.petName}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                                {caseItem.animalType}
                              </span>
                              <span className="text-xs text-slate-500">Age: {caseItem.age} yrs</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">Diagnosed on: {new Date(caseItem.createdAt).toLocaleString()}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-1 rounded-lg">
                              +{caseItem.pawPointsEarned || 3} PawPoints Credit
                            </span>
                            <span className={`text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider ${
                              caseItem.caseStatus === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              caseItem.caseStatus === 'Requires Vet' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                              'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              ● {caseItem.caseStatus || 'Monitoring'}
                            </span>
                          </div>
                        </div>

                        {/* Split Details columns */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                          
                          {/* Symptoms observed checklist */}
                          <div className="md:col-span-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <FaClipboardList className="text-amber-500" /> Symptoms Telemetry
                            </h5>
                            <div className="space-y-2">
                              {caseItem.symptoms && caseItem.symptoms.length > 0 ? (
                                caseItem.symptoms.map((symp, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                                    <span className="font-semibold text-slate-600">{symp.name}</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                      symp.severity === 5 ? 'bg-red-500 text-white' :
                                      symp.severity >= 3 ? 'bg-amber-500 text-white' :
                                      'bg-yellow-400 text-slate-800'
                                    }`}>
                                      Lvl {symp.severity}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400 italic">No symptoms recorded.</p>
                              )}
                            </div>
                          </div>

                          {/* Calculated probabilities matrix */}
                          <div className="md:col-span-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <FaChartPie className="text-amber-500" /> Math Engine Probability
                            </h5>
                            <div className="space-y-3">
                              {caseItem.predictions && caseItem.predictions.length > 0 ? (
                                caseItem.predictions.map((pred, idx) => (
                                  <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                      <span>{pred.condition}</span>
                                      <span className="text-amber-600">{Math.round(pred.confidence)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                      <div 
                                        className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-[#d4af37]"
                                        style={{ width: `${pred.confidence}%` }}
                                      />
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400 italic">No prediction details.</p>
                              )}
                            </div>
                          </div>

                          {/* Interactive Chronology diary timeline */}
                          <div className="md:col-span-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <FaHistory className="text-amber-500" /> Chronicle Timeline Logs
                            </h5>
                            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1.5 custom-scrollbar text-[11px]">
                              {caseItem.trackingLogs && caseItem.trackingLogs.length > 0 ? (
                                caseItem.trackingLogs.map((logItem, idx) => (
                                  <div key={idx} className="p-2 bg-slate-50 rounded-lg border-l-4 border-amber-400 relative">
                                    <div className="flex justify-between font-bold text-slate-700 mb-0.5">
                                      <span className="text-amber-700 bg-amber-50 px-1 rounded">{logItem.statusChangedTo}</span>
                                      <span className="text-[9px] text-slate-400">{new Date(logItem.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed italic">"{logItem.note}"</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400 italic py-2 text-center">No progress diaries recorded yet.</p>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FaMedkit className="text-amber-300 text-4xl mx-auto mb-3" />
                    <p className="font-bold text-slate-700">No Gold Disease Predictions Found</p>
                    <p className="text-xs text-slate-400 mt-1">This user has not diagnosed any pet symptoms under the Gold Tier.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {customerData.mlPredictions && customerData.mlPredictions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {customerData.mlPredictions.map((caseItem) => (
                      <div key={caseItem._id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                        {/* Title Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/60 pb-3 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-slate-800 text-base">{caseItem.petName}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 uppercase">
                                {caseItem.animalType}
                              </span>
                              <span className="text-xs text-slate-500">Breed: {caseItem.breed}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">Checked on: {new Date(caseItem.createdAt).toLocaleString()}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-1 rounded-lg">
                              +{caseItem.pawPointsEarned || 5} PawPoints Credit
                            </span>
                            <span className={`text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider ${
                              caseItem.predictionResult?.status === 'Abnormal' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              ● {caseItem.predictionResult?.status || 'Normal'}
                            </span>
                          </div>
                        </div>

                        {/* Split columns */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                          
                          {/* Vitals stats grids */}
                          <div className="md:col-span-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <FaHeartbeat className="text-purple-500" /> Physiological Vitals
                            </h5>
                            
                            <div className="grid grid-cols-3 gap-2">
                              <div className="p-2 bg-slate-50 rounded-lg text-center">
                                <p className="text-[10px] font-bold text-slate-400">TEMP</p>
                                <p className="text-sm font-extrabold text-slate-700 mt-1">{caseItem.vitals?.temperature}°C</p>
                                <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${caseItem.predictionResult?.vitalsEvaluation?.temperature === 'Normal' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {caseItem.predictionResult?.vitalsEvaluation?.temperature || 'Check'}
                                </span>
                              </div>
                              <div className="p-2 bg-slate-50 rounded-lg text-center">
                                <p className="text-[10px] font-bold text-slate-400">PULSE</p>
                                <p className="text-sm font-extrabold text-slate-700 mt-1">{caseItem.vitals?.heartRate} bpm</p>
                                <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${caseItem.predictionResult?.vitalsEvaluation?.heartRate === 'Normal' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {caseItem.predictionResult?.vitalsEvaluation?.heartRate || 'Check'}
                                </span>
                              </div>
                              <div className="p-2 bg-slate-50 rounded-lg text-center">
                                <p className="text-[10px] font-bold text-slate-400">RESP</p>
                                <p className="text-sm font-extrabold text-slate-700 mt-1">{caseItem.vitals?.respiratoryRate} /m</p>
                                <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${caseItem.predictionResult?.vitalsEvaluation?.respiratoryRate === 'Normal' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {caseItem.predictionResult?.vitalsEvaluation?.respiratoryRate || 'Check'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* AI Recommendation Panel */}
                          <div className="md:col-span-8 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                              <FaCrown className="text-purple-500" /> Gemma-3 Generative Health Advisory
                            </h5>
                            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 max-h-[140px] overflow-y-auto pr-1.5 custom-scrollbar">
                              <p className="text-xs text-purple-900 font-extrabold mb-1">Diagnosis Matrix: <span className="underline">{caseItem.predictionResult?.summary}</span></p>
                              <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic">
                                "{caseItem.predictionResult?.veterinaryLetter || 'No recommendations generated.'}"
                              </p>
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FaHeartbeat className="text-purple-300 text-4xl mx-auto mb-3" />
                    <p className="font-bold text-slate-700">No Platinum Vitals Checked Found</p>
                    <p className="text-xs text-slate-400 mt-1">This user has not checked any pet vitals under the Platinum Tier.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Refund Activity Row */}
          {customerData.refundLogs && customerData.refundLogs.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FaUndo className="text-rose-500" /> Wallet Refund History
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {customerData.refundLogs.map(log => (
                  <div key={log._id || log.id} className="p-4 bg-rose-50 rounded-xl border border-rose-100 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-rose-800 mb-1">{log.activityDescription}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <p className="text-xs text-rose-600/70">Processed on: {new Date(log.timestamp).toLocaleString()}</p>
                        {log.metadata?.reason && (
                          <p className="text-[10px] font-bold text-rose-700 bg-rose-200/50 px-2 py-0.5 rounded uppercase tracking-tighter">Reason: {log.metadata.reason}</p>
                        )}
                      </div>
                    </div>
                    {log.metadata?.amount && (
                      <div className="text-right">
                        <p className="font-black text-rose-600">+₹{log.metadata.amount}</p>
                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-tight">Added to Wallet</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Refund Modal */}
          {/* Refund Modal */}
          {refundModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FaWallet className="text-amber-500" /> Issue Wallet Refund
                  </h3>
                  <button onClick={() => setRefundModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <FaTimes />
                  </button>
                </div>
                <form onSubmit={handleRefund} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Refund Amount (₹)</label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="Enter amount to refund..."
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Reason / Internal Memo</label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Explain why this refund is being issued..."
                      rows="3"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    ></textarea>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setRefundModalOpen(false)}
                      className="flex-1 py-2 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={refundLoading}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-70"
                    >
                      {refundLoading ? 'Processing...' : 'Confirm Refund'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Grant Subscription Modal */}
          {grantModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FaCrown className="text-purple-500" /> Grant Subscription
                  </h3>
                  <button onClick={() => setGrantModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <FaTimes />
                  </button>
                </div>
                <form onSubmit={handleGrantSubscription} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Select Plan</label>
                      <select 
                        value={grantPlan}
                        onChange={(e) => setGrantPlan(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="Silver">Silver</option>
                        <option value="Gold">Gold</option>
                        <option value="Platinum">Platinum</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Duration (Months)</label>
                      <select 
                        value={grantDuration}
                        onChange={(e) => setGrantDuration(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="1">1 Month</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">12 Months</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Reason for Grant</label>
                    <textarea
                      value={grantReason}
                      onChange={(e) => setGrantReason(e.target.value)}
                      placeholder="e.g. Service recovery, promotional gift..."
                      rows="3"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    ></textarea>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button type="button" onClick={() => setGrantModalOpen(false)} className="flex-1 py-2 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                    <button
                      type="submit"
                      disabled={grantLoading}
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all disabled:opacity-70"
                    >
                      {grantLoading ? 'Granting...' : 'Grant Subscription'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Revoke Subscription Modal */}
          {revokeModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
                  <h3 className="text-lg font-bold text-rose-800 flex items-center gap-2">
                    <FaUndo className="text-rose-500" /> Revoke Subscription
                  </h3>
                  <button onClick={() => setRevokeModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <FaTimes />
                  </button>
                </div>
                <form onSubmit={handleRevokeSubscription} className="p-6 space-y-4">
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                    <p className="text-sm text-rose-800 font-medium">
                      Warning: This will immediately cancel the user's active <span className="font-bold">{customerData.user.subscription?.plan}</span> plan. This action is irreversible.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Reason for Revocation</label>
                    <textarea
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      placeholder="Explain why this subscription is being revoked..."
                      rows="3"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    ></textarea>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button type="button" onClick={() => setRevokeModalOpen(false)} className="flex-1 py-2 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                    <button
                      type="submit"
                      disabled={revokeLoading}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all disabled:opacity-70"
                    >
                      {revokeLoading ? 'Revoking...' : 'Confirm Revocation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
    </div>
  );
};

export default Customer360;
