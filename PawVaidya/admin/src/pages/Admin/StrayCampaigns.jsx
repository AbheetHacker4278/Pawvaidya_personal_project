import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Heart, Megaphone, Trash2, ShieldAlert, DollarSign, Wallet, 
  MapPin, Calendar, Clock, Stethoscope, User, Search, Eye, Filter, X,
  Mail, Ban 
} from 'lucide-react';

const StrayCampaigns = () => {
  const { atoken, backendurl } = useContext(AdminContext);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [contribAmount, setContribAmount] = useState('500');
  
  // Loading sub-states
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      // Calling getNearbyCampaigns without coordinates fetches all campaigns
      const { data } = await axios.get(`${backendurl}/api/stray-crowdfunding/nearby`, {
        headers: { atoken }
      });
      if (data.success) {
        setCampaigns(data.campaigns || []);
      } else {
        toast.error(data.message || "Failed to fetch campaigns");
      }
    } catch (error) {
      toast.error(error.message || "Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (atoken) {
      fetchCampaigns();
    }
  }, [atoken]);

  // Address resolution states
  const [resolvedAddress, setResolvedAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    if (selectedCampaign && selectedCampaign.coordinates) {
      const [lon, lat] = selectedCampaign.coordinates;
      if (lon && lat) {
        setAddressLoading(true);
        setResolvedAddress(null);
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`, {
          headers: { 'User-Agent': 'PawVaidyaAdminCrowdfunding/1.0' }
        })
          .then(res => res.json())
          .then(data => {
            if (data) {
              const addr = data.address || {};
              const place = addr.road || addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city || '';
              const district = addr.county || addr.district || addr.city_district || addr.city || '';
              const state = addr.state || '';
              setResolvedAddress({ place, district, state, displayName: data.display_name || `${lat}, ${lon}` });
            } else {
              setResolvedAddress({ place: '', district: '', state: '', displayName: `${lat}, ${lon}` });
            }
          })
          .catch(() => {
            setResolvedAddress({ place: '', district: '', state: '', displayName: `${lat}, ${lon}` });
          })
          .finally(() => setAddressLoading(false));
      }
    }
  }, [selectedCampaign]);

  // Admin contribution handler
  const handleContribute = async () => {
    if (!contribAmount || Number(contribAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await axios.post(`${backendurl}/api/stray-crowdfunding/admin/contribute`, {
        campaignId: selectedCampaign._id,
        amount: Number(contribAmount)
      }, {
        headers: { atoken }
      });
      if (data.success) {
        toast.success(data.message || `Successfully contributed ₹${contribAmount}`);
        setShowContributeModal(false);
        fetchCampaigns();
      } else {
        toast.error(data.message || "Failed to contribute");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Admin delete campaign handler
  const handleDelete = async () => {
    if (!deleteReason.trim()) {
      toast.error("Please provide a reason/explanation for deleting this campaign.");
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await axios.post(`${backendurl}/api/stray-crowdfunding/admin/delete/${selectedCampaign._id}`, {
        responseMessage: deleteReason
      }, {
        headers: { atoken }
      });
      if (data.success) {
        toast.success(data.message || "Campaign deleted and contributors refunded.");
        setShowDeleteModal(false);
        setDeleteReason('');
        setSelectedCampaign(null);
        fetchCampaigns();
      } else {
        toast.error(data.message || "Failed to delete campaign");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Admin boost campaign handler
  const handleBoost = async (campaignId) => {
    setActionLoading(true);
    try {
      const { data } = await axios.post(`${backendurl}/api/stray-crowdfunding/admin/boost/${campaignId}`, {}, {
        headers: { atoken }
      });
      if (data.success) {
        toast.success(data.message || "Campaign boosted! Mass notification emails dispatched.");
      } else {
        toast.error(data.message || "Failed to boost campaign");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Admin strict ban action handler
  const handleStrictAction = async (campaignId) => {
    if (!window.confirm("Are you sure you want to take strict action against this campaign owner? This will ban their account from the platform.")) {
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await axios.post(`${backendurl}/api/stray-crowdfunding/admin/strict-action/${campaignId}`, {}, {
        headers: { atoken }
      });
      if (data.success) {
        toast.success(data.message || "Strict action applied. Campaign owner has been banned.");
        fetchCampaigns();
      } else {
        toast.error(data.message || "Failed to take strict action");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Admin send warning handler
  const handleSendWarning = async (campaignId) => {
    setActionLoading(true);
    try {
      const { data } = await axios.post(`${backendurl}/api/stray-crowdfunding/admin/send-warning/${campaignId}`, {}, {
        headers: { atoken }
      });
      if (data.success) {
        toast.success(data.message || "Warning email sent successfully!");
        fetchCampaigns();
      } else {
        toast.error(data.message || "Failed to send warning email");
      }
    } catch (error) {
      toast.error(error.message || "Error sending warning email");
    } finally {
      setActionLoading(false);
    }
  };

  // Admin suspend and refund handler
  const handleSuspendRefund = async (campaignId) => {
    if (!window.confirm("Are you sure you want to suspend this campaign and refund all contributions immediately back to the contributors' wallets?")) {
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await axios.post(`${backendurl}/api/stray-crowdfunding/admin/suspend-refund/${campaignId}`, {}, {
        headers: { atoken }
      });
      if (data.success) {
        toast.success(data.message || "Campaign suspended and all contributions refunded!");
        fetchCampaigns();
      } else {
        toast.error(data.message || "Failed to suspend and refund campaign");
      }
    } catch (error) {
      toast.error(error.message || "Error suspending and refunding campaign");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtering & search logic
  const filteredCampaigns = campaigns.filter(c => {
    const statusMatch = filterStatus === 'All' || c.status === filterStatus;
    const searchMatch = !searchTerm.trim() || 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.creatorId?.name && c.creatorId.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return statusMatch && searchMatch;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Suspended':
        return 'bg-gray-100 text-gray-800 border-gray-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const isOverdue = (createdAt) => {
    const createdDate = new Date(createdAt);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return createdDate < twoWeeksAgo;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-50 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500 animate-pulse" />
            Stray Campaigns Administration
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Monitor nearby campaigns, boost emergencies, contribute directly, or moderate inactive campaign owners.
          </p>
        </div>
        <button 
          onClick={fetchCampaigns}
          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold rounded-xl border border-emerald-200/50 transition-all text-xs self-start"
        >
          Refresh Data
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by campaign, clinic, or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {['All', 'Active', 'Completed', 'Cancelled', 'Suspended'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                filterStatus === status
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {status === 'Suspended' ? 'Suspended Campaign' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Campaigns */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500">Retrieving campaign databases...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-white border border-slate-100 text-center py-16 rounded-3xl shadow-sm">
          <p className="text-slate-400 font-bold">No campaigns match your query or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((camp) => {
            const progressPercent = Math.min(100, Math.round((camp.raisedAmount / camp.targetAmount) * 100)) || 0;
            const overdue = isOverdue(camp.createdAt) && camp.status === 'Active' && camp.raisedAmount < camp.targetAmount;
            
            return (
              <div key={camp._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
                {/* Campaign Image */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img 
                    src={camp.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80'} 
                    alt={camp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border shadow-sm ${getStatusStyle(camp.status)}`}>
                      {camp.status === 'Suspended' ? 'Suspended Campaign' : camp.status}
                    </span>
                    {overdue && (
                      <span className="bg-rose-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider animate-bounce shadow-md">
                        <Clock className="w-3 h-3" /> Overdue
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-black text-slate-800 text-base line-clamp-1">{camp.title}</h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2">{camp.description}</p>
                  </div>

                  {/* Creator & Target */}
                  <div className="text-[11px] font-semibold text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> Creator:</span>
                      <span className="font-extrabold text-slate-800">{camp.creatorId?.name || "Anonymous Rescuer"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-slate-400" /> Clinic:</span>
                      <span className="font-extrabold text-slate-800">{camp.clinicName}</span>
                    </div>
                  </div>

                  {/* Progress Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-emerald-600">₹{camp.raisedAmount} raised</span>
                      <span className="text-slate-400">Target: ₹{camp.targetAmount}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${overdue ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-extrabold text-slate-400">
                      <span>{progressPercent}% Complete</span>
                      <span>Created: {new Date(camp.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedCampaign(camp);
                        setShowDetailModal(true);
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                    {camp.status === 'Active' && (
                      <button
                        onClick={() => handleBoost(camp._id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold text-xs rounded-xl border border-amber-200 transition-all"
                      >
                        <Megaphone className="w-3.5 h-3.5" /> Boost
                      </button>
                    )}
                    {camp.status === 'Active' && (
                      <button
                        onClick={() => {
                          setSelectedCampaign(camp);
                          setShowContributeModal(true);
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs rounded-xl border border-emerald-200 transition-all"
                      >
                        <Wallet className="w-3.5 h-3.5" /> Contribute
                      </button>
                    )}
                     <button
                      onClick={() => {
                        setSelectedCampaign(camp);
                        setShowDeleteModal(true);
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>

                    {(camp.status === 'Active' || camp.status === 'Completed') && (!camp.proofBillUrl && !camp.proofUrl) && (
                      <button
                        onClick={() => handleSendWarning(camp._id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#fdf2e9] hover:bg-[#fae5d3] text-[#d35400] font-extrabold text-xs rounded-xl border border-[#fadbd8] transition-all"
                      >
                        <Mail className="w-3.5 h-3.5" /> Send Warning
                      </button>
                    )}

                    {camp.status !== 'Suspended' && camp.status !== 'Cancelled' && (!camp.proofBillUrl && !camp.proofUrl) && (
                      <button
                        onClick={() => handleSuspendRefund(camp._id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#fdedec] hover:bg-[#fadbd8] text-[#c0392b] font-extrabold text-xs rounded-xl border border-[#f5b7b1] transition-all"
                      >
                        <Ban className="w-3.5 h-3.5" /> Suspend Campaign
                      </button>
                    )}

                    {overdue && (
                      <button
                        onClick={() => handleStrictAction(camp._id)}
                        className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-rose-200"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" /> Take Strict Action
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details & Proof Modal */}
      {showDetailModal && selectedCampaign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-lg font-black text-slate-800">{selectedCampaign.title} Details</h2>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Meta Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase">Campaign Status</p>
                  <p className="font-black text-slate-800 mt-0.5">
                    {selectedCampaign.status === 'Suspended' ? 'Suspended Campaign' : selectedCampaign.status}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase">Target Amount</p>
                  <p className="font-black text-slate-800 mt-0.5">₹{selectedCampaign.targetAmount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase">Amount Raised</p>
                  <p className="font-black text-emerald-600 mt-0.5">₹{selectedCampaign.raisedAmount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase">Compulsory Self-Paid</p>
                  <p className={`font-black mt-0.5 ${selectedCampaign.hasSelfContributed ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedCampaign.hasSelfContributed ? 'Yes (Compulsory Contribution Cleared)' : 'No'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Motive / Description</h4>
                <p className="text-xs font-semibold text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                  {selectedCampaign.description}
                </p>
              </div>

              {/* Rescue Location */}
              {(() => {
                const lon = selectedCampaign.coordinates?.[0];
                const lat = selectedCampaign.coordinates?.[1];
                if (!lon || !lat) return null;
                const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lon}`;
                const mapsLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=16`;
                return (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Rescue Location</h4>

                    {/* Address Info */}
                    {addressLoading ? (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-100 animate-pulse">
                        <MapPin className="w-4 h-4 text-rose-400" />
                        Resolving location address...
                      </div>
                    ) : resolvedAddress ? (
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 flex flex-col gap-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                          <div className="text-xs font-bold text-slate-800 leading-snug">
                            {resolvedAddress.place && <span className="block">{resolvedAddress.place}</span>}
                            <span className="text-slate-500 font-semibold">
                              {[resolvedAddress.district, resolvedAddress.state].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed pl-6 truncate" title={resolvedAddress.displayName}>
                          {resolvedAddress.displayName}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <MapPin className="w-4 h-4 text-rose-400" />
                        Location unavailable
                      </div>
                    )}

                    {/* OpenStreetMap Embed */}
                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
                      <iframe
                        title="Rescue Location Map"
                        src={mapSrc}
                        width="100%"
                        height="220"
                        className="block"
                        style={{ border: 0 }}
                        loading="lazy"
                      />
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-2 right-2 bg-white/90 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-white transition-all shadow"
                      >
                        Open in Maps ↗
                      </a>
                    </div>
                  </div>
                );
              })()}

              {/* Bill Invoice Proof Upload */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Medical Treatment Invoices / Receipts</h4>
                {(selectedCampaign.proofBillUrl || selectedCampaign.proofUrl) ? (
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-800">
                      <span>Invoice Proof File Uploaded</span>
                      <a 
                        href={selectedCampaign.proofBillUrl || selectedCampaign.proofUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-black text-[10px]"
                      >
                        View Original Receipt
                      </a>
                    </div>
                    {/* Render preview if image */}
                    {/\.(jpg|jpeg|png|webp)/i.test(selectedCampaign.proofBillUrl || selectedCampaign.proofUrl) && (
                      <img 
                        src={selectedCampaign.proofBillUrl || selectedCampaign.proofUrl} 
                        alt="Treatment Invoice Proof" 
                        className="w-full max-h-60 object-contain rounded-xl border border-slate-200" 
                      />
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/50 text-amber-800 rounded-2xl border border-amber-100/50 text-xs font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 flex-shrink-0" />
                    No clinic invoice receipt has been uploaded yet. Campaign owner must attach the receipt to release funds.
                  </div>
                )}
              </div>

              {/* Contributions list */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Contributor Logs</h4>
                {selectedCampaign.contributions?.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-2 bg-slate-50">
                    {selectedCampaign.contributions.map((contrib, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 text-[11px] font-bold text-slate-700">
                        <div className="flex flex-col">
                          <span>{contrib.userName || "Anonymous Contributor"}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">Payment ID: {contrib.paymentId}</span>
                        </div>
                        <span className="font-extrabold text-emerald-600">₹{contrib.amount}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-400 italic">No contributions recorded yet.</p>
                )}
              </div>

              {/* Admin Actions inside Modal */}
              {(selectedCampaign.status !== 'Suspended' && selectedCampaign.status !== 'Cancelled' && !selectedCampaign.proofBillUrl && !selectedCampaign.proofUrl) && (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Admin Moderate Actions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {(selectedCampaign.status === 'Active' || selectedCampaign.status === 'Completed') && (
                      <button
                        onClick={() => {
                          handleSendWarning(selectedCampaign._id);
                          setShowDetailModal(false);
                        }}
                        disabled={actionLoading}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#fdf2e9] hover:bg-[#fae5d3] text-[#d35400] font-extrabold text-xs rounded-xl border border-[#fadbd8] transition-all"
                      >
                        <Mail className="w-3.5 h-3.5" /> Send Warning Email
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleSuspendRefund(selectedCampaign._id);
                        setShowDetailModal(false);
                      }}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#fdedec] hover:bg-[#fadbd8] text-[#c0392b] font-extrabold text-xs rounded-xl border border-[#f5b7b1] transition-all"
                    >
                      <Ban className="w-3.5 h-3.5" /> Suspend & Refund
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Direct Contribution Modal */}
      {showContributeModal && selectedCampaign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800">Contribute to Campaign</h2>
              <button 
                onClick={() => setShowContributeModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-all text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 font-semibold">
              Enter the amount you wish to contribute to <strong>"{selectedCampaign.title}"</strong>. This will be deducted from Admin Treasury earnings.
            </p>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Contribution Amount (₹)</label>
              <input
                type="number"
                min="100"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                className="w-full text-sm font-bold px-4.5 py-3 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 rounded-xl outline-none transition-all"
                placeholder="500"
              />
            </div>
            <button
              onClick={handleContribute}
              disabled={actionLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-100 transition-all uppercase tracking-wider"
            >
              {actionLoading ? "Processing..." : `Confirm Contribution`}
            </button>
          </div>
        </div>
      )}

      {/* Delete Campaign Explanation Modal */}
      {showDeleteModal && selectedCampaign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800">Delete Campaign</h2>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                }}
                className="p-1 hover:bg-slate-100 rounded-full transition-all text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">
              Warning: Deleting this campaign will automatically refund all contribution amounts back to the contributors' wallets.
            </p>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Explanation / Justification Email to Creator</label>
              <textarea
                rows="4"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full text-xs font-semibold px-4.5 py-3 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 rounded-xl outline-none transition-all resize-none"
                placeholder="Specify the guidelines violated, false claims discovered, or policy issues..."
              />
            </div>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-100 transition-all uppercase tracking-wider"
            >
              {actionLoading ? "Processing Refund & Deleting..." : "Delete Campaign & Send Notification"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrayCampaigns;
