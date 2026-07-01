import React, { useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CSContext } from '../context/CSContext';
import { FaSearch, FaWallet, FaPaw, FaCalendarAlt, FaExclamationTriangle, FaUser, FaChartPie, FaCrown, FaHistory, FaUndo, FaTimes, FaStethoscope, FaClipboardList, FaHeartbeat, FaMedkit, FaAppleAlt, FaLeaf, FaFlask, FaTint, FaHeart, FaCoins, FaClock, FaMapMarkerAlt, FaBan, FaCheckCircle, FaInfoCircle, FaGoogle } from 'react-icons/fa';

const Customer360 = () => {
  const { backendUrl, cstoken, socket } = useContext(CSContext);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [nowTime, setNowTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleEmergencyAlertTriggered = (data) => {
      console.log('Customer360: emergency-alert-triggered event received:', data);
      
      // Update local state to immediately hide button / mark as triggered
      setCustomerData(prevData => {
        if (!prevData) return prevData;
        
        const updatedMlPredictions = prevData.mlPredictions?.map(pred => {
          if (pred._id === data.recordId && data.type === 'prediction') {
            return { ...pred, emergencyAlertTriggered: true };
          }
          return pred;
        });
        
        const updatedAnimalDiseases = prevData.animalDiseases?.map(disease => {
          if (disease._id === data.recordId && data.type === 'disease') {
            return { ...disease, emergencyAlertTriggered: true };
          }
          return disease;
        });
        
        return {
          ...prevData,
          mlPredictions: updatedMlPredictions,
          animalDiseases: updatedAnimalDiseases
        };
      });
    };
    
    socket.on('emergency-alert-triggered', handleEmergencyAlertTriggered);
    
    return () => {
      socket.off('emergency-alert-triggered', handleEmergencyAlertTriggered);
    };
  }, [socket]);

  const evaluateVitals = (caseItem) => {
    if (!caseItem) return { status: 'Normal', vitalsEvaluation: { temperature: 'Normal', heartRate: 'Normal', respiratoryRate: 'Normal' }, summary: 'Healthy', veterinaryLetter: '' };
    
    const animal = caseItem.animalType;
    const temp = caseItem.vitals?.temperature;
    const pulse = caseItem.vitals?.pulseRate;
    const resp = caseItem.vitals?.respirationRate;
    
    let tempStatus = 'Normal';
    let pulseStatus = 'Normal';
    let respStatus = 'Normal';
    
    if (animal === 'Dog') {
      if (temp < 101.0 || temp > 102.5) tempStatus = 'Abnormal';
      if (pulse < 70 || pulse > 120) pulseStatus = 'Abnormal';
      if (resp < 15 || resp > 35) respStatus = 'Abnormal';
    } else if (animal === 'Cat') {
      if (temp < 100.5 || temp > 102.5) tempStatus = 'Abnormal';
      if (pulse < 120 || pulse > 140) pulseStatus = 'Abnormal';
      if (resp < 20 || resp > 30) respStatus = 'Abnormal';
    } else if (animal === 'Cow') {
      if (temp < 100.5 || temp > 102.8) tempStatus = 'Abnormal';
      if (pulse < 40 || pulse > 80) pulseStatus = 'Abnormal';
      if (resp < 10 || resp > 30) respStatus = 'Abnormal';
    } else if (animal === 'Sheep' || animal === 'Goat') {
      if (temp < 101.5 || temp > 103.5) tempStatus = 'Abnormal';
      if (pulse < 70 || pulse > 90) pulseStatus = 'Abnormal';
      if (resp < 12 || resp > 20) respStatus = 'Abnormal';
    }
    
    // Flag as abnormal if vitals are out of range, OR if ML model predicts anything other than Healthy / Low Risk
    const isAbnormal =
      tempStatus === 'Abnormal' ||
      pulseStatus === 'Abnormal' ||
      respStatus === 'Abnormal' ||
      caseItem.riskCategory === 'High Risk' ||
      caseItem.riskCategory === 'Medium Risk' ||
      caseItem.riskCategory === 'Low Risk' ||
      (caseItem.predictedCondition && caseItem.predictedCondition !== 'Healthy');
    
    return {
      status: isAbnormal ? 'Abnormal' : 'Normal',
      vitalsEvaluation: {
        temperature: tempStatus,
        heartRate: pulseStatus,
        respiratoryRate: respStatus
      },
      summary: caseItem.predictedCondition || 'Healthy',
      veterinaryLetter: caseItem.aiAnalysis || 'No recommendations generated.'
    };
  };

  const handleTriggerEmergency = async (alert) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/cs/trigger-emergency`, {
        userId: customerData.user._id,
        petName: alert.petName,
        vitals: alert.vitals,
        type: alert.type,
        recordId: alert.recordId
      }, { headers: { cstoken } });
      
      if (data.success) {
        toast.success(data.message);
        
        // Update local state immediately
        setCustomerData(prevData => {
          if (!prevData) return prevData;
          
          const updatedMlPredictions = prevData.mlPredictions?.map(pred => {
            if (pred._id === alert.recordId && alert.type === 'prediction') {
              return { ...pred, emergencyAlertTriggered: true };
            }
            return pred;
          });
          
          const updatedAnimalDiseases = prevData.animalDiseases?.map(disease => {
            if (disease._id === alert.recordId && alert.type === 'disease') {
              return { ...disease, emergencyAlertTriggered: true };
            }
            return disease;
          });
          
          return {
            ...prevData,
            mlPredictions: updatedMlPredictions,
            animalDiseases: updatedAnimalDiseases
          };
        });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('handleTriggerEmergency error:', error);
      toast.error('Failed to trigger emergency suggestion.');
    }
  };

  const getCriticalAlerts = () => {
    if (!customerData) return [];
    const alerts = [];
    
    // Track latest prediction per pet
    const processedPetsMl = new Set();
    if (customerData.mlPredictions) {
      for (const pred of customerData.mlPredictions) {
        if (processedPetsMl.has(pred.petName)) continue;
        processedPetsMl.add(pred.petName);
        
        const evalResult = evaluateVitals(pred);
        const isAbnormal = evalResult.status === 'Abnormal';
        
        if (isAbnormal) {
          const petBreed = customerData.pets?.find(p => p.name === pred.petName || p._id === pred.petId)?.breed || 'N/A';
          const abnormalDetails = [];
          if (evalResult.vitalsEvaluation.temperature === 'Abnormal') {
            abnormalDetails.push(`temperature of ${pred.vitals?.temperature}°F`);
          }
          if (evalResult.vitalsEvaluation.heartRate === 'Abnormal') {
            abnormalDetails.push(`heart/pulse rate of ${pred.vitals?.pulseRate} bpm`);
          }
          if (evalResult.vitalsEvaluation.respiratoryRate === 'Abnormal') {
            abnormalDetails.push(`respiratory rate of ${pred.vitals?.respirationRate} /m`);
          }
          
          const detailsText = abnormalDetails.join(' and ');
          
          alerts.push({
            type: 'prediction',
            recordId: pred._id,
            petId: pred.petId,
            petName: pred.petName,
            breed: petBreed,
            details: detailsText || `abnormal vitals detected`,
            vitals: pred.vitals,
            triggered: pred.emergencyAlertTriggered || false
          });
        }
      }
    }

    // Track latest disease per pet
    const processedPetsDisease = new Set();
    if (customerData.animalDiseases) {
      for (const disease of customerData.animalDiseases) {
        if (processedPetsDisease.has(disease.petName)) continue;
        processedPetsDisease.add(disease.petName);
        
        if (disease.caseStatus === 'Requires Vet') {
          const petBreed = customerData.pets?.find(p => p.name === disease.petName || p._id === disease.petId)?.breed || 'N/A';
          const primaryPrediction = disease.predictions?.[0]?.condition || 'health issues';
          
          alerts.push({
            type: 'disease',
            recordId: disease._id,
            petId: disease.petId,
            petName: disease.petName,
            breed: petBreed,
            details: `condition requiring vet attention: ${primaryPrediction}`,
            triggered: disease.emergencyAlertTriggered || false
          });
        }
      }
    }
    
    return alerts;
  };

  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const [reclaimModalOpen, setReclaimModalOpen] = useState(false);
  const [reclaimAmount, setReclaimAmount] = useState('');
  const [reclaimReason, setReclaimReason] = useState('');
  const [reclaimLoading, setReclaimLoading] = useState(false);
  const [selectedRefundLogId, setSelectedRefundLogId] = useState(null);

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

  const handleReclaimRefund = async (e) => {
    e.preventDefault();
    if (!reclaimAmount || !reclaimReason) return toast.warning('Please fill out all fields.');

    try {
      setReclaimLoading(true);
      const { data } = await axios.post(`${backendUrl}/api/cs/reclaim-refund`, {
        email: customerData.user.email,
        amount: reclaimAmount,
        reason: reclaimReason,
        refundLogId: selectedRefundLogId
      }, { headers: { cstoken } });

      if (data.success) {
        toast.success(data.message);
        setCustomerData({
          ...customerData,
          user: { ...customerData.user, pawWallet: data.newBalance }
        });
        setReclaimModalOpen(false);
        setReclaimAmount('');
        setReclaimReason('');
        setSelectedRefundLogId(null);
        fetchCustomerData({ preventDefault: () => {} }); // Refresh to show refund status
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error reclaiming refund.');
    } finally {
      setReclaimLoading(false);
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
          {/* Critical Telemetry Warnings */}
          {getCriticalAlerts().map((alert, index) => (
            <div key={index} className="bg-red-50 border-l-4 border-red-500 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-red-500 text-2xl mt-1 shrink-0 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-red-800 text-lg uppercase tracking-wider">Critical Pet Vitals Detected</h3>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    Pet: <span className="font-extrabold text-slate-900">{alert.petName} ({alert.breed})</span> recently recorded {alert.details}.
                  </p>
                </div>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                {alert.triggered ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-200">
                    ● Emergency Visit Suggested
                  </span>
                ) : (
                  <button
                    onClick={() => handleTriggerEmergency(alert)}
                    className="w-full md:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-red-600/20 active:scale-95"
                  >
                    Suggest for Emergency Vet visit
                  </button>
                )}
              </div>
            </div>
          ))}

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
                      customerData.user.subscription?.plan === 'Obsidian' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 font-black animate-pulse' :
                      customerData.user.subscription?.plan === 'Platinum' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/50' : 
                      customerData.user.subscription?.plan === 'Gold' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50' : 
                      'bg-slate-500/50 text-slate-200'
                    }`}>
                      {customerData.user.subscription?.plan || 'No Subscription'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${customerData.user.isBanned ? 'bg-red-500/20 text-red-200 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50'}`}>
                      {customerData.user.isBanned ? 'Banned' : 'Active Account'}
                    </span>
                    {customerData.user.isGoogleConnected && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-200 border border-sky-500/50 flex items-center gap-1.5 shadow-sm shadow-sky-500/10">
                        <FaGoogle className="text-sky-300" /> Google Linked
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Wallet Info Box */}
                <div className="ml-auto bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-white text-center min-w-[240px]">
                  <p className="text-slate-300 text-sm font-medium uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                    <FaWallet className="text-amber-400" /> PawWallet Balance
                  </p>
                  <p className="text-3xl font-black text-amber-400 mb-3">₹{customerData.user.pawWallet}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setRefundModalOpen(true)}
                      className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-lg text-xs font-bold"
                    >
                      Issue Refund
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedRefundLogId(null);
                        setReclaimAmount('');
                        setReclaimReason('');
                        setReclaimModalOpen(true);
                      }}
                      className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-600 transition-colors rounded-lg text-xs font-bold text-white shadow-sm"
                    >
                      Reclaim Amt
                    </button>
                  </div>
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

          {customerData.user.subscription?.plan === 'Obsidian' && (
            <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 p-5 rounded-2xl shadow-xl text-white mb-6">
              <div className="flex items-center gap-3 mb-2">
                <FaCrown className="text-amber-400 text-2xl animate-pulse" />
                <h3 className="font-extrabold text-xl tracking-wider text-[#D4AF37] uppercase">Obsidian Signature Pass Status</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-0.5 font-bold">Request Status</span>
                  <span className={`text-sm font-black uppercase tracking-wider ${
                    customerData.user.subscription.status === 'Active' ? 'text-emerald-400' :
                    customerData.user.subscription.status === 'Approved' ? 'text-indigo-400 animate-pulse' :
                    customerData.user.subscription.status === 'Pending Approval' ? 'text-amber-400' :
                    'text-rose-400'
                  }`}>
                    {customerData.user.subscription.status}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-0.5 font-bold">Expiry / Grace Period End</span>
                  <span className="text-sm font-bold text-slate-200">
                    {customerData.user.subscription.status === 'Approved' && customerData.user.subscription.approvedAt ? (
                      (() => {
                        const limit = new Date(customerData.user.subscription.approvedAt).getTime() + 24 * 60 * 60 * 1000;
                        const diff = limit - nowTime;
                        if (diff <= 0) return 'Expired';
                        const h = Math.floor(diff / 3600000);
                        const m = Math.floor((diff % 3600000) / 60000);
                        const s = Math.floor((diff % 60000) / 1000);
                        return `${h}h ${m}m ${s}s remaining`;
                      })()
                    ) : (
                      customerData.user.subscription.expiryDate ? new Date(customerData.user.subscription.expiryDate).toLocaleDateString() : 'N/A'
                    )}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-0.5 font-bold">Pricing Details</span>
                  <span className="text-sm font-bold text-slate-200">
                    {customerData.subscriptions?.find(s => s.plan === 'Obsidian')?.amount ? `₹${customerData.subscriptions.find(s => s.plan === 'Obsidian').amount.toLocaleString()}` : 'Custom Premium'}
                  </span>
                </div>
              </div>
            </div>
          )}

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
                        <FaCrown className={`text-lg ${sub.plan === 'Obsidian' ? 'text-yellow-500 animate-pulse' : sub.plan === 'Platinum' ? 'text-purple-500' : sub.plan === 'Gold' ? 'text-amber-500' : 'text-slate-400'}`} />
                        <h4 className="font-bold text-slate-700">{sub.plan} Plan</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${sub.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : sub.status === 'Pending' || sub.status === 'Pending Approval' || sub.status === 'Approved' ? 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse' : 'bg-slate-200 text-slate-600'}`}>
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
                        <FaCrown className={`text-lg ${customerData.user.subscription.plan === 'Obsidian' ? 'text-yellow-500 animate-pulse' : customerData.user.subscription.plan === 'Platinum' ? 'text-purple-500' : customerData.user.subscription.plan === 'Gold' ? 'text-amber-500' : 'text-slate-400'}`} />
                        <h4 className="font-bold text-slate-700">{customerData.user.subscription.plan} Plan</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${customerData.user.subscription.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : customerData.user.subscription.status === 'Pending' || customerData.user.subscription.status === 'Pending Approval' || customerData.user.subscription.status === 'Approved' ? 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse' : 'bg-slate-200 text-slate-600'}`}>
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

          {/* Loyalty & Wellness Rewards Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-2xl">🎁</span> Active Loyalty &amp; Wellness Rewards
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Admin-issued AI retention coupons active for this subscriber</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                customerData.activeLoyaltyCoupons && customerData.activeLoyaltyCoupons.length > 0
                  ? 'bg-violet-100 text-violet-700 border border-violet-200'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {customerData.activeLoyaltyCoupons?.length || 0} Active
              </span>
            </div>

            {customerData.activeLoyaltyCoupons && customerData.activeLoyaltyCoupons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customerData.activeLoyaltyCoupons.map((coupon) => {
                  const isWellness = coupon.code === 'FREEWELLNESS';
                  const expiryDate = new Date(coupon.expiryDate);
                  const now = new Date();
                  const hoursLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60));
                  const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                  const isExpiringSoon = hoursLeft <= 24;
                  const isUsed = coupon.usedCount > 0;

                  return (
                    <div key={coupon.code} className={`relative overflow-hidden rounded-2xl border-2 p-5 ${
                      isWellness
                        ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50'
                        : 'border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50'
                    }`}>
                      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${isWellness ? 'bg-emerald-500' : 'bg-violet-500'}`} />

                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{isWellness ? '❤️' : '🏷️'}</span>
                            <span className={`px-3 py-1 rounded-lg font-black text-sm uppercase tracking-widest ${
                              isWellness ? 'bg-emerald-600 text-white' : 'bg-violet-600 text-white'
                            }`}>
                              {coupon.code}
                            </span>
                          </div>
                          <p className={`text-xs font-bold mt-1 ${isWellness ? 'text-emerald-700' : 'text-violet-700'}`}>
                            {isWellness
                              ? '🩺 Complimentary Wellness Consultation'
                              : '💸 15% Loyalty Discount on Next Booking'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isUsed
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : isExpiringSoon
                              ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          {isUsed ? '✅ Redeemed' : isExpiringSoon ? '⚠️ Expiring Soon' : '⏳ Pending'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/60">
                        <div className="text-center">
                          <p className={`text-xl font-black ${isWellness ? 'text-emerald-700' : 'text-violet-700'}`}>
                            {coupon.discountValue === 100 ? 'FREE' : `${coupon.discountValue}%`}
                          </p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Benefit</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-xl font-black ${isExpiringSoon ? 'text-rose-600' : 'text-slate-700'}`}>
                            {daysLeft > 1 ? `${daysLeft}d` : `${hoursLeft}h`}
                          </p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Remaining</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-black text-slate-700">{coupon.usedCount}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Used</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expires:</span>
                        <span className={`text-[10px] font-black ${isExpiringSoon ? 'text-rose-500' : 'text-slate-600'}`}>
                          {expiryDate.toLocaleDateString()} at {expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className={`mt-2 px-3 py-1.5 rounded-lg ${isWellness ? 'bg-emerald-100/60' : 'bg-violet-100/60'}`}>
                        <p className={`text-[10px] font-bold ${isWellness ? 'text-emerald-700' : 'text-violet-700'}`}>
                          {isWellness
                            ? '🤖 AI Triggered: High churn risk — free wellness checkup issued by Admin'
                            : '🤖 AI Triggered: Medium churn risk — 15% loyalty discount issued by Admin'}
                        </p>
                      </div>

                      {/* CS Agent Info */}
                      <div className="mt-2 px-3 py-1.5 bg-sky-50 rounded-lg border border-sky-100">
                        <p className="text-[10px] font-bold text-sky-700">
                          💬 CS Note: Inform the customer they can use code <strong>{coupon.code}</strong> at checkout.
                          {isExpiringSoon && ' ⚠️ Expires very soon — mention urgency!'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <span className="text-4xl mb-3">🎫</span>
                <p className="text-sm font-bold uppercase tracking-widest">No Active Rewards</p>
                <p className="text-xs font-medium text-slate-400 mt-1">This user has no active loyalty or wellness coupons.</p>
                <p className="text-xs text-slate-300 mt-0.5">Rewards are auto-issued when Admin triggers AI churn prediction on the subscriptions page.</p>
              </div>
            )}
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
                    {customerData.mlPredictions.map((caseItem) => {
                      const evalResult = evaluateVitals(caseItem);
                      const petBreed = customerData.pets?.find(p => p.name === caseItem.petName || p._id === caseItem.petId)?.breed || 'N/A';
                      return (
                        <div key={caseItem._id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                          {/* Title Header */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/60 pb-3 mb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-slate-800 text-base">{caseItem.petName}</h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 uppercase">
                                  {caseItem.animalType}
                                </span>
                                <span className="text-xs text-slate-500">Breed: {petBreed}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">Checked on: {new Date(caseItem.createdAt).toLocaleString()}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-1 rounded-lg">
                                +{caseItem.pawPointsEarned || 5} PawPoints Credit
                              </span>
                              <span className={`text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider ${
                                evalResult.status === 'Abnormal' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                ● {evalResult.status}
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
                                  <p className="text-sm font-extrabold text-slate-700 mt-1">{caseItem.vitals?.temperature}°F</p>
                                  <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${evalResult.vitalsEvaluation?.temperature === 'Normal' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {evalResult.vitalsEvaluation?.temperature || 'Check'}
                                  </span>
                                </div>
                                <div className="p-2 bg-slate-50 rounded-lg text-center">
                                  <p className="text-[10px] font-bold text-slate-400">PULSE</p>
                                  <p className="text-sm font-extrabold text-slate-700 mt-1">{caseItem.vitals?.pulseRate || caseItem.vitals?.heartRate} bpm</p>
                                  <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${evalResult.vitalsEvaluation?.heartRate === 'Normal' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {evalResult.vitalsEvaluation?.heartRate || 'Check'}
                                  </span>
                                </div>
                                <div className="p-2 bg-slate-50 rounded-lg text-center">
                                  <p className="text-[10px] font-bold text-slate-400">RESP</p>
                                  <p className="text-sm font-extrabold text-slate-700 mt-1">{caseItem.vitals?.respirationRate || caseItem.vitals?.respiratoryRate} /m</p>
                                  <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${evalResult.vitalsEvaluation?.respiratoryRate === 'Normal' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {evalResult.vitalsEvaluation?.respiratoryRate || 'Check'}
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
                                <p className="text-xs text-purple-900 font-extrabold mb-1">Diagnosis Matrix: <span className="underline">{evalResult.summary}</span></p>
                                <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic">
                                  "{evalResult.veterinaryLetter || 'No recommendations generated.'}"
                                </p>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
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
                {customerData.refundLogs.map(log => {
                  const isRefund = log.activityType === 'refund';
                  const isReclaimed = log.metadata?.reclaimed || false;
                  return (
                    <div key={log._id || log.id} className={`p-4 rounded-xl border ${isRefund ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'} flex justify-between items-center`}>
                      <div>
                        <p className={`text-sm font-bold ${isRefund ? 'text-rose-800' : 'text-amber-800'} mb-1`}>{log.activityDescription}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <p className={`text-xs ${isRefund ? 'text-rose-600/70' : 'text-amber-600/70'}`}>Processed on: {new Date(log.timestamp).toLocaleString()}</p>
                          {log.metadata?.reason && (
                            <p className={`text-[10px] font-bold ${isRefund ? 'text-rose-700 bg-rose-200/50' : 'text-amber-700 bg-amber-200/50'} px-2 py-0.5 rounded uppercase tracking-tighter`}>Reason: {log.metadata.reason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {log.metadata?.amount && (
                          <div className="text-right">
                            <p className={`font-black ${isRefund ? 'text-rose-600' : 'text-amber-600'}`}>{isRefund ? '+' : '-'}₹{log.metadata.amount}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{isRefund ? 'Added to Wallet' : 'Reclaimed/Deducted'}</p>
                          </div>
                        )}
                        {isRefund && (
                          <div>
                            {isReclaimed ? (
                              <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-3 py-1 rounded-lg border border-amber-200">
                                Reclaimed
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedRefundLogId(log._id);
                                  setReclaimAmount(log.metadata?.amount || '');
                                  setReclaimReason(`Reclaim mistaken refund of ₹${log.metadata?.amount || ''}`);
                                  setReclaimModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                              >
                                <FaUndo size={10} /> Reclaim
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── AI Diet & Nutrition Planner ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FaAppleAlt className="text-green-500" /> AI Diet &amp; Nutrition Planner
                </h3>
                <p className="text-xs text-slate-500 mt-1">AI-generated veterinary-grade meal plans created by the user for their pets.</p>
              </div>
              <span className="text-xs font-bold bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
                {customerData.nutritionPlans?.length || 0} Plan{(customerData.nutritionPlans?.length || 0) !== 1 ? 's' : ''} Generated
              </span>
            </div>

            {customerData.nutritionPlans && customerData.nutritionPlans.length > 0 ? (
              <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {customerData.nutritionPlans.map((plan) => (
                  <div key={plan._id} className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200/60 shadow-sm">

                    {/* Plan Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-green-200/60">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-800 text-base">{plan.petName}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-200 text-green-900 uppercase">{plan.animalType}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">{plan.breed}</span>
                          <span className="text-[10px] text-slate-500">{plan.age} yr • {plan.weight} kg</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Generated on: {new Date(plan.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-tight">
                          Activity: {plan.activityLevel}
                        </span>
                        <span className="text-sm font-black text-green-700 bg-white border border-green-200 px-3 py-1 rounded-xl shadow-sm">
                          🔥 {plan.caloricTarget} kcal/day
                        </span>
                      </div>
                    </div>

                    {/* Goals & Medical Conditions */}
                    {(plan.goals || (plan.medicalConditions && plan.medicalConditions.length > 0)) && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {plan.goals && (
                          <div className="flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-100 text-blue-800 px-3 py-1 rounded-lg">
                            <FaLeaf className="text-blue-500 shrink-0" />
                            <span className="font-semibold">Goal:</span> {plan.goals}
                          </div>
                        )}
                        {plan.medicalConditions && plan.medicalConditions.map((cond, i) => (
                          <span key={i} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-100">
                            ⚕ {cond}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 3-column body */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                      {/* Meal Schedule */}
                      <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
                        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <FaAppleAlt className="text-green-500" /> Daily Meal Schedule
                        </h5>
                        <div className="space-y-3">
                          {[['🌅 Morning', plan.dietSchedule?.morning], ['☀️ Afternoon', plan.dietSchedule?.afternoon], ['🌙 Evening', plan.dietSchedule?.evening]].map(([label, text]) => (
                            text ? (
                              <div key={label} className="p-2.5 bg-green-50/60 rounded-lg border border-green-100">
                                <p className="text-[10px] font-extrabold text-green-700 uppercase tracking-tight mb-1">{label}</p>
                                <p className="text-[11px] text-slate-600 leading-relaxed">{text}</p>
                              </div>
                            ) : null
                          ))}
                        </div>
                      </div>

                      {/* Portion Calculator */}
                      <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
                        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <FaFlask className="text-indigo-500" /> Portion Calculator
                        </h5>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                            <span className="text-xs font-semibold text-slate-600">Dry Food</span>
                            <span className="text-sm font-extrabold text-slate-800">{plan.portionCalculator?.dryFoodGrams ?? '–'} g</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                            <span className="text-xs font-semibold text-slate-600">Wet Food</span>
                            <span className="text-sm font-extrabold text-slate-800">{plan.portionCalculator?.wetFoodGrams ?? '–'} g</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                            <span className="text-xs font-semibold text-blue-700 flex items-center gap-1"><FaTint className="text-blue-400" /> Water</span>
                            <span className="text-sm font-extrabold text-blue-800">{plan.portionCalculator?.waterRequirementMl ?? '–'} ml</span>
                          </div>
                        </div>
                      </div>

                      {/* Custom Recipes */}
                      <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
                        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <FaLeaf className="text-emerald-500" /> Custom Recipes ({plan.customRecipes?.length || 0})
                        </h5>
                        {plan.customRecipes && plan.customRecipes.length > 0 ? (
                          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                            {plan.customRecipes.map((recipe, ri) => (
                              <div key={ri} className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
                                <p className="text-[10px] font-extrabold text-emerald-800 mb-1.5">🍽 {recipe.title}</p>
                                {recipe.ingredients && recipe.ingredients.length > 0 && (
                                  <div className="mb-1.5">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Ingredients:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {recipe.ingredients.map((ing, ii) => (
                                        <span key={ii} className="text-[9px] bg-white border border-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-md font-semibold">{ing}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {recipe.instructions && (
                                  <p className="text-[10px] text-slate-500 leading-relaxed italic">{recipe.instructions}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic text-center py-4">No custom recipes in this plan.</p>
                        )}
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-green-50/50 rounded-2xl border border-dashed border-green-200">
                <FaAppleAlt className="text-green-300 text-4xl mx-auto mb-3" />
                <p className="font-bold text-slate-700">No AI Diet Plans Generated Yet</p>
                <p className="text-xs text-slate-400 mt-1">This user has not created any nutrition plans using the AI Diet Planner.</p>
              </div>
            )}
          </div>

          {/* ── Stray Crowdfunding Campaigns ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <FaHeart className="text-rose-500" /> Stray Crowdfunding Campaigns
                </h3>
                <p className="text-xs text-slate-500 mt-1">Monitor stray animal crowdfunding campaigns created by this user.</p>
              </div>
              <span className="text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full">
                {customerData.crowdfundingCampaigns?.length || 0} Campaign{(customerData.crowdfundingCampaigns?.length || 0) !== 1 ? 's' : ''} Found
              </span>
            </div>

            {/* Stats Summary Widget */}
            {customerData.crowdfundingCampaigns && customerData.crowdfundingCampaigns.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Campaigns</p>
                  <p className="text-xl font-black text-slate-800 mt-1">{customerData.crowdfundingCampaigns.length}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Active</p>
                  <p className="text-xl font-black text-emerald-800 mt-1">
                    {customerData.crowdfundingCampaigns.filter(c => c.status === 'Active').length}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase">Completed</p>
                  <p className="text-xl font-black text-blue-800 mt-1">
                    {customerData.crowdfundingCampaigns.filter(c => c.status === 'Completed').length}
                  </p>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="text-[10px] font-bold text-rose-600 uppercase">Suspended</p>
                  <p className="text-xl font-black text-rose-800 mt-1">
                    {customerData.crowdfundingCampaigns.filter(c => c.status === 'Suspended').length}
                  </p>
                </div>
              </div>
            )}

            {customerData.crowdfundingCampaigns && customerData.crowdfundingCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {customerData.crowdfundingCampaigns.map((camp) => {
                  const progressPercent = Math.min(100, Math.round((camp.raisedAmount / camp.targetAmount) * 100)) || 0;
                  
                  const getStatusBadge = (status) => {
                    switch (status) {
                      case 'Active':
                        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      case 'Completed':
                        return 'bg-blue-100 text-blue-800 border-blue-200';
                      case 'Cancelled':
                        return 'bg-amber-100 text-amber-800 border-amber-200';
                      case 'Suspended':
                        return 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold';
                      default:
                        return 'bg-slate-100 text-slate-800 border-slate-200';
                    }
                  };

                  return (
                    <div key={camp._id} className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-5 flex flex-col justify-between gap-4 group hover:shadow-md transition-all duration-300">
                      
                      {/* Image & Title Header */}
                      <div className="flex gap-4 items-start">
                        {camp.imageUrl && (
                          <img 
                            src={camp.imageUrl} 
                            alt={camp.title}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                            <span className="text-[9px] font-black uppercase bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded tracking-wider">
                              {camp.animalType}
                            </span>
                            <span className={`text-[9px] font-black uppercase border px-2.5 py-0.5 rounded-full ${getStatusBadge(camp.status)}`}>
                              {camp.status}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-slate-800 text-sm truncate" title={camp.title}>{camp.title}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Created: {new Date(camp.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 font-semibold line-clamp-2 italic leading-relaxed">
                        "{camp.description}"
                      </p>

                      {/* Target / Raised Statistics */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-slate-500">Fundraising Progress</span>
                          <span className="font-black text-slate-800">{progressPercent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Raised</p>
                            <p className="font-black text-emerald-600 text-sm">₹{camp.raisedAmount}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Target Goal</p>
                            <p className="font-black text-slate-800 text-sm">₹{camp.targetAmount}</p>
                          </div>
                        </div>
                      </div>

                      {/* Meta Footer */}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                        <span className="font-bold flex items-center gap-1"><FaStethoscope className="text-slate-400" /> {camp.clinicName}</span>
                        {camp.endDate && (
                          <span className="font-bold flex items-center gap-1"><FaClock className="text-slate-400" /> Ends: {new Date(camp.endDate).toLocaleDateString()}</span>
                        )}
                      </div>
                      
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-rose-50/50 rounded-2xl border border-dashed border-rose-200">
                <FaHeart className="text-rose-300 text-4xl mx-auto mb-3" />
                <p className="font-bold text-slate-700">No Crowdfunding Campaigns Created</p>
                <p className="text-xs text-slate-400 mt-1">This user has not created any stray crowdfunding campaigns.</p>
              </div>
            )}
          </div>

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

          {/* Reclaim Refund Modal */}
          {reclaimModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FaUndo className="text-amber-500" /> Reclaim / Claw Back Amount
                  </h3>
                  <button onClick={() => setReclaimModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <FaTimes />
                  </button>
                </div>
                <form onSubmit={handleReclaimRefund} className="p-6 space-y-4">
                  {selectedRefundLogId && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold break-all">
                      Clawing back amount for Refund Log ID: {selectedRefundLogId}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Clawback Amount (₹)</label>
                    <input
                      type="number"
                      value={reclaimAmount}
                      onChange={(e) => setReclaimAmount(e.target.value)}
                      placeholder="Enter amount to claw back..."
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Reason / Internal Memo</label>
                    <textarea
                      value={reclaimReason}
                      onChange={(e) => setReclaimReason(e.target.value)}
                      placeholder="Explain why this refund is being clawed back..."
                      rows="3"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    ></textarea>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setReclaimModalOpen(false)}
                      className="flex-1 py-2 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reclaimLoading}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-70"
                    >
                      {reclaimLoading ? 'Processing...' : 'Confirm Clawback'}
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
