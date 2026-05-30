import React, { useState, useEffect, useContext } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Wallet, MapPin, Calendar, Clock, Stethoscope, User, Search, Eye, Filter, X,
  CheckCircle, ShieldAlert, Award, ArrowUpRight, Coins, CreditCard, Trash2, Plus, ShieldCheck
} from 'lucide-react';


const DoctorCrowdfunding = () => {
  const { dtoken, backendurl, profileData, getProfileData } = useContext(DoctorContext);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [contribAmount, setContribAmount] = useState('500');
  const [topupAmount, setTopupAmount] = useState('1000');
  
  // Loading sub-states
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      // Calling getNearbyCampaigns without coordinates fetches all campaigns
      const { data } = await axios.get(`${backendurl}/api/stray-crowdfunding/nearby`);
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
    fetchCampaigns();
    if (dtoken) {
      getProfileData();
    }
  }, [dtoken]);

  // Card management state for Doctor
  const [savedCards, setSavedCards] = useState([]);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardHolder, setNewCardHolder] = useState('');
  const [newExpiryMonth, setNewExpiryMonth] = useState('');
  const [newExpiryYear, setNewExpiryYear] = useState('');
  const [savingCard, setSavingCard] = useState(false);

  // Saved Card Selection in Topup Modal
  const [payWithSaved, setPayWithSaved] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [cvv, setCvv] = useState('');

  const fetchSavedCards = async () => {
    try {
      const { data } = await axios.get(`${backendurl}/api/cards/list`, {
        headers: { dtoken }
      });
      if (data.success) {
        setSavedCards(data.cards || []);
        if (data.cards?.length > 0) {
          setSelectedCardId(data.cards[0]._id);
        }
      }
    } catch (err) {
      console.error("Error fetching saved cards:", err);
    }
  };

  useEffect(() => {
    if (dtoken) {
      fetchSavedCards();
    }
  }, [dtoken]);

  const validateLuhn = (num) => {
    const clean = num.replace(/\D/g, '');
    if (!clean || clean.length < 13 || clean.length > 19) return false;
    let sum = 0;
    const isEven = clean.length % 2 === 0;
    for (let i = 0; i < clean.length; i++) {
      let digit = parseInt(clean[i], 10);
      if ((i % 2 === 0) === isEven) {
        digit *= 2;
        if (digit > 9) {
          digit = Math.floor(digit / 10) + (digit % 10);
        }
      }
      sum += digit;
    }
    return sum % 10 === 0;
  };

  const getCardTypeFromNum = (num) => {
    const clean = num.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(clean)) return 'Mastercard';
    if (/^(34|37)/.test(clean)) return 'American Express';
    if (/^65/.test(clean) || /^6011/.test(clean) || /^(64[4-9])/.test(clean) || /^(622126|622925)/.test(clean)) return 'Discover';
    if (/^(30[0-5]|36|38|39)/.test(clean)) return 'Diners Club';
    if (/^(352[89]|35[3-8][0-9])/.test(clean)) return 'JCB';
    if (/^(5018|5020|5038|6304|6759|6761|6763)/.test(clean)) return 'Switch/Solo';
    if (/^(5019)/.test(clean)) return 'Dankort';
    if (/^(508|60|65|81|82)/.test(clean)) return 'RuPay';
    return '';
  };

  const getCardGradient = (cardType) => {
    const brand = (cardType || '').toLowerCase();
    if (brand.includes('visa')) return 'linear-gradient(135deg, #1e3a8a, #3b82f6)';
    if (brand.includes('mastercard')) return 'linear-gradient(135deg, #2e1065, #7c3aed)';
    if (brand.includes('rupay')) return 'linear-gradient(135deg, #064e3b, #10b981)';
    if (brand.includes('amex') || brand.includes('american express')) return 'linear-gradient(135deg, #78350f, #f59e0b)';
    if (brand.includes('discover')) return 'linear-gradient(135deg, #c2410c, #ea580c)';
    if (brand.includes('diners')) return 'linear-gradient(135deg, #0369a1, #0284c7)';
    if (brand.includes('jcb')) return 'linear-gradient(135deg, #be185d, #db2777)';
    if (brand.includes('switch') || brand.includes('solo')) return 'linear-gradient(135deg, #4f46e5, #6366f1)';
    if (brand.includes('dankort')) return 'linear-gradient(135deg, #b91c1c, #dc2626)';
    return 'linear-gradient(135deg, #1e293b, #0f172a)'; // default dark
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0, len = v.length; i < len; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.length > 0 ? parts.join(' ') : v;
  };

  const handleSaveCard = async (e) => {
    e.preventDefault();
    if (!newCardNumber || !newCardHolder || !newExpiryMonth || !newExpiryYear) {
      toast.error("Please fill all card details");
      return;
    }

    if (!validateLuhn(newCardNumber)) {
      toast.error("Invalid card number. Please check and try again.");
      return;
    }

    setSavingCard(true);
    try {
      const { data } = await axios.post(`${backendurl}/api/cards/save`, {
        cardNumber: newCardNumber,
        cardHolderName: newCardHolder,
        expiryMonth: Number(newExpiryMonth),
        expiryYear: Number(newExpiryYear)
      }, {
        headers: { dtoken }
      });

      if (data.success) {
        toast.success(data.message);
        setShowAddCardModal(false);
        setNewCardNumber('');
        setNewCardHolder('');
        setNewExpiryMonth('');
        setNewExpiryYear('');
        fetchSavedCards();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSavingCard(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Are you sure you want to delete this saved card?")) return;
    try {
      const { data } = await axios.delete(`${backendurl}/api/cards/delete/${cardId}`, {
        headers: { dtoken }
      });
      if (data.success) {
        toast.success(data.message);
        fetchSavedCards();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSavedCardTopup = async (e) => {
    e.preventDefault();
    const amt = Number(topupAmount);
    if (amt < 100) {
      toast.error("Minimum top-up amount is ₹100");
      return;
    }
    if (!selectedCardId) {
      toast.error("Please select a saved card");
      return;
    }
    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      toast.error("Please enter a valid 3 or 4 digit CVV");
      return;
    }

    setActionLoading(true);
    try {
      const { data } = await axios.post(`${backendurl}/api/cards/topup-saved`, {
        cardId: selectedCardId,
        cvv,
        amount: amt
      }, {
        headers: { dtoken }
      });

      if (data.success) {
        toast.success(data.message);
        getProfileData();
        setShowTopupModal(false);
        setTopupAmount('1000');
        setCvv('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };


  // Address resolution states
  const [resolvedAddress, setResolvedAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    if (selectedCampaign && selectedCampaign.location?.coordinates) {
      const [lon, lat] = selectedCampaign.location.coordinates;
      if (lon && lat) {
        setAddressLoading(true);
        setResolvedAddress(null);
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`, {
          headers: {
            'User-Agent': 'PawVaidyaDoctorCrowdfunding/1.0'
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data) {
              const addr = data.address || {};
              const place = addr.road || addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city || '';
              const district = addr.county || addr.district || addr.city_district || addr.city || '';
              const state = addr.state || '';
              const displayName = data.display_name || 'Unknown Location';
              setResolvedAddress({
                place,
                district,
                state,
                displayName
              });
            } else {
              setResolvedAddress({
                place: 'Unknown Place',
                district: 'Unknown District',
                state: 'Unknown State',
                displayName: `Coordinates: ${lat}, ${lon}`
              });
            }
          })
          .catch(err => {
            console.error("Geocoding error:", err);
            setResolvedAddress({
              place: 'Unknown Place',
              district: 'Unknown District',
              state: 'Unknown State',
              displayName: `Coordinates: ${lat}, ${lon}`
            });
          })
          .finally(() => {
            setAddressLoading(false);
          });
      }
    }
  }, [selectedCampaign]);

  // Wallet contribution handler for Doctors
  const handleContribute = async () => {
    const amount = Number(contribAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (profileData && profileData.pawWallet < amount) {
      toast.error(`Insufficient Paw Wallet balance. You have ₹${profileData.pawWallet}`);
      return;
    }

    setActionLoading(true);
    try {
      const { data } = await axios.post(`${backendurl}/api/stray-crowdfunding/wallet-contribute`, {
        campaignId: selectedCampaign._id,
        amount: amount
      }, {
        headers: { dtoken }
      });
      if (data.success) {
        toast.success(data.message || `Successfully contributed ₹${amount} via Paw Wallet!`);
        setShowContributeModal(false);
        fetchCampaigns();
        getProfileData();
      } else {
        toast.error(data.message || "Failed to process contribution");
      }
    } catch (error) {
      toast.error(error.message || "Error processing contribution");
    } finally {
      setActionLoading(false);
    }
  };

  // Load Razorpay Script helper
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Wallet top-up payment handler
  const handleTopup = async () => {
    const amount = Number(topupAmount);
    if (!amount || amount < 100) {
      toast.error("Minimum top-up amount is ₹100");
      return;
    }

    setActionLoading(true);
    try {
      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded) {
        toast.error("Razorpay SDK failed to load. Are you offline?");
        return;
      }

      const { data } = await axios.post(`${backendurl}/api/stray-crowdfunding/doctor-topup-order`, {
        amount
      }, {
        headers: { dtoken }
      });

      if (data.success) {
        const { order, razorpayKeyId } = data;
        
        const options = {
          key: razorpayKeyId,
          amount: order.amount,
          currency: order.currency,
          name: "PawVaidya Philanthropy Wallet",
          description: "Top-up Doctor Philanthropy Wallet",
          order_id: order.id,
          handler: async (response) => {
            try {
              setActionLoading(true);
              const verifyRes = await axios.post(`${backendurl}/api/stray-crowdfunding/doctor-verify-topup`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }, {
                headers: { dtoken }
              });

              if (verifyRes.data.success) {
                toast.success(verifyRes.data.message || "Top-up successful!");
                setShowTopupModal(false);
                getProfileData();
              } else {
                toast.error(verifyRes.data.message || "Verification failed");
              }
            } catch (error) {
              toast.error(error.message || "Error verifying top-up payment");
            } finally {
              setActionLoading(false);
            }
          },
          prefill: {
            name: profileData?.name || "Doctor",
            email: profileData?.email || ""
          },
          theme: {
            color: "#059669"
          },
          modal: {
            ondismiss: () => {
              setActionLoading(false);
            }
          }
        };

        const rpay = new window.Razorpay(options);
        rpay.open();
      } else {
        toast.error(data.message || "Failed to initiate top-up");
      }
    } catch (error) {
      toast.error(error.message || "Error initiating top-up payment");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter logic:
  // Available: status === 'Active'
  // Past: status === 'Completed' || status === 'Cancelled'
  // Suspended: status === 'Suspended'
  const getFilteredCampaigns = () => {
    return campaigns.filter(c => {
      let statusMatch = true;
      if (filterStatus === 'Available') {
        statusMatch = c.status === 'Active';
      } else if (filterStatus === 'Past') {
        statusMatch = c.status === 'Completed' || c.status === 'Cancelled';
      } else if (filterStatus === 'Suspended') {
        statusMatch = c.status === 'Suspended';
      }

      const searchMatch = !searchTerm.trim() || 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.creatorId?.name && c.creatorId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.animalType && c.animalType.toLowerCase().includes(searchTerm.toLowerCase()));

      return statusMatch && searchMatch;
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Suspended':
        return 'bg-slate-100 text-slate-700 border-slate-300 font-bold';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const filtered = getFilteredCampaigns();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Wallet Balance Hero section for Doctor */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20"></div>
        
        <div className="space-y-2 relative z-10">
          <span className="bg-emerald-500/30 text-emerald-100 border border-emerald-400/20 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
            Doctor Philanthropy Panel
          </span>
          <h1 className="text-3xl font-black tracking-tight">Stray Animal Crowdfunding</h1>
          <p className="text-emerald-100 text-sm max-w-xl font-medium">
            Browse active rescues, support clinics, and contribute directly using your medical wallet balance to fund critical stray treatments.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0">
              <Coins className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider">Philanthropy Wallet</p>
              <h2 className="text-2xl font-black">₹{profileData?.pawWallet || 0}</h2>
            </div>
          </div>
          <button 
            onClick={() => setShowTopupModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-black transition-all shadow-sm shrink-0 uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <Wallet className="w-3.5 h-3.5" />
            Top Up
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by animal, clinic, creator or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'All', label: 'All Campaigns' },
            { id: 'Available', label: '🟢 Available Campaigns' },
            { id: 'Past', label: '🏁 Past Campaigns' },
            { id: 'Suspended', label: '🚫 Suspended Campaigns' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                filterStatus === tab.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Listing */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500">Retrieving crowdfunding database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 text-center py-20 rounded-3xl shadow-sm space-y-2">
          <p className="text-slate-400 font-bold text-lg">No campaigns found</p>
          <p className="text-slate-400 text-sm font-medium">Try broadening your search term or filtering options.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((camp) => {
            const progressPercent = Math.min(100, Math.round((camp.raisedAmount / camp.targetAmount) * 100)) || 0;
            
            return (
              <motion.div 
                key={camp._id} 
                layout
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Campaign Image */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img 
                    src={camp.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80'} 
                    alt={camp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border shadow-sm ${getStatusStyle(camp.status)}`}>
                      {camp.status}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                        {camp.animalType || "Animal"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        Created: {new Date(camp.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-800 text-base line-clamp-1">{camp.title}</h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2">{camp.description}</p>
                  </div>

                  {/* Creator & Target */}
                  <div className="text-[11px] font-semibold text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> Rescuer:</span>
                      <span className="font-extrabold text-slate-800">{camp.creatorId?.name || "Anonymous User"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-slate-400" /> Veterinary:</span>
                      <span className="font-extrabold text-slate-800 truncate max-w-[120px]">{camp.clinicName}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-emerald-600">₹{camp.raisedAmount} raised</span>
                      <span className="text-slate-400">Target: ₹{camp.targetAmount}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-extrabold text-slate-400">
                      <span>{progressPercent}% Complete</span>
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
                      <Eye className="w-3.5 h-3.5" /> View details
                    </button>
                    {camp.status === 'Active' ? (
                      <button
                        onClick={() => {
                          setSelectedCampaign(camp);
                          setShowContributeModal(true);
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-100"
                      >
                        <Heart className="w-3.5 h-3.5 fill-white text-white" /> Participate
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-400 font-extrabold text-xs rounded-xl border border-slate-200 cursor-not-allowed"
                      >
                        Closed Campaign
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Details & Proof Modal */}
      {showDetailModal && selectedCampaign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h2 className="text-lg font-black text-slate-800">Rescue Campaign Details</h2>
              </div>
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
                  <p className="font-black text-slate-800 mt-0.5">{selectedCampaign.status}</p>
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
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase">Clinic Name</p>
                  <p className="font-black text-slate-800 mt-0.5">{selectedCampaign.clinicName}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Rescue Details</h4>
                <p className="text-xs font-semibold text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                  {selectedCampaign.description}
                </p>
              </div>

              {/* Rescue Location */}
              {(() => {
                const lon = selectedCampaign.location?.coordinates?.[0];
                const lat = selectedCampaign.location?.coordinates?.[1];
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
                            <span className="text-slate-500 font-semibold">{[resolvedAddress.district, resolvedAddress.state].filter(Boolean).join(', ')}</span>
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
                      {/* Open in OSM link */}
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
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Treatment Invoices / Clinic Receipts</h4>
                {(selectedCampaign.proofBillUrl || selectedCampaign.proofUrl) ? (
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-800">
                      <span>Clinic Treatment Receipt Attached</span>
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
                        alt="Treatment Invoice" 
                        className="w-full max-h-60 object-contain rounded-xl border border-slate-200" 
                      />
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/50 text-amber-800 rounded-2xl border border-amber-100/50 text-xs font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 flex-shrink-0" />
                    No clinic invoice receipt uploaded yet.
                  </div>
                )}
              </div>

              {/* Contributions list */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Contribution History Logs</h4>
                {selectedCampaign.contributions?.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-2 bg-slate-50">
                    {selectedCampaign.contributions.map((contrib, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 text-[11px] font-bold text-slate-700">
                        <div className="flex flex-col">
                          <span>{contrib.userName || "Anonymous Patron"}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">Processed Payment</span>
                        </div>
                        <span className="font-extrabold text-emerald-600">₹{contrib.amount}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-400 italic">No contributions recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct Contribution Modal */}
      {showContributeModal && selectedCampaign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800">Contribute to Rescue</h2>
              <button 
                onClick={() => setShowContributeModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-all text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 font-semibold">
              Enter your contribution amount for <strong>"{selectedCampaign.title}"</strong>. The amount will be deducted directly from your Paw Wallet balance.
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Donation Amount (₹)</label>
                <span className="text-[10px] text-slate-500 font-bold">Your Balance: ₹{profileData?.pawWallet || 0}</span>
              </div>
              <input
                type="number"
                min="10"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                className="w-full text-sm font-bold px-4.5 py-3 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 rounded-xl outline-none transition-all"
                placeholder="500"
              />
            </div>
            <button
              onClick={handleContribute}
              disabled={actionLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-100 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {actionLoading ? "Processing..." : (
                <>
                  <Coins className="w-4 h-4" />
                  Confirm Philanthropy Deduction
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Top Up Wallet Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                Top Up Wallet
              </h2>
              <button 
                onClick={() => { setShowTopupModal(false); setCvv(''); }}
                className="p-1 hover:bg-slate-100 rounded-full transition-all text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={payWithSaved ? handleSavedCardTopup : (e) => { e.preventDefault(); handleTopup(); }} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Amount (₹)</label>
                  <span className="text-[10px] text-slate-500 font-bold">Min: ₹100</span>
                </div>
                <input
                  type="number"
                  min="100"
                  required
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full text-sm font-bold px-4.5 py-3 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 rounded-xl outline-none transition-all"
                  placeholder="1000"
                />
              </div>

              {/* Option to pay via Saved Cards */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Payment Method</label>
                  <button
                    type="button"
                    onClick={() => setShowAddCardModal(true)}
                    className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider hover:underline"
                  >
                    + Add New Card
                  </button>
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPayWithSaved(false)}
                    className={`flex-1 py-2 px-3 border rounded-xl text-[10px] font-extrabold uppercase transition-all ${!payWithSaved ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                  >
                    Standard Checkout
                  </button>
                  {savedCards.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayWithSaved(true)}
                      className={`flex-1 py-2 px-3 border rounded-xl text-[10px] font-extrabold uppercase transition-all ${payWithSaved ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                    >
                      Saved Card
                    </button>
                  )}
                </div>

                {payWithSaved && savedCards.length > 0 && (
                  <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Select Card</label>
                      <select
                        value={selectedCardId}
                        onChange={(e) => setSelectedCardId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-semibold"
                      >
                        {savedCards.map(c => (
                          <option key={c._id} value={c._id}>
                            {c.cardType} ({c.cardNumber}) - {c.cardHolderName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">CVV</label>
                        <input
                          type="password"
                          required
                          maxLength="4"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="•••"
                          className="w-20 px-3 py-1.5 text-center text-xs font-bold tracking-widest rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(selectedCardId)}
                        className="text-rose-500 hover:text-rose-700 text-[10px] font-bold flex items-center gap-1 mt-4"
                        title="Delete Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Card
                      </button>
                    </div>
                  </div>
                )}

                {!payWithSaved && (
                  <p className="text-[10px] text-slate-400 font-medium">
                    You will be redirected to the secure Razorpay payment gateway checkout.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={actionLoading || (payWithSaved && (!selectedCardId || cvv.length < 3))}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-100 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {actionLoading ? "Processing..." : (
                  <>
                    <Coins className="w-4 h-4" />
                    {payWithSaved ? "Pay via Saved Card" : "Proceed to Payment"}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Card Modal for Doctor */}
      <AnimatePresence>
        {showAddCardModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Save Payment Card
                </h3>
                <button 
                  onClick={() => setShowAddCardModal(false)} 
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Live card preview */}
              <div
                className="p-5 rounded-2xl text-white relative overflow-hidden flex flex-col justify-between h-40 shadow-lg"
                style={{
                  background: newCardNumber ? getCardGradient(getCardTypeFromNum(newCardNumber)) : 'linear-gradient(135deg, #475569, #334155)'
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start z-10">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
                      {getCardTypeFromNum(newCardNumber) || 'CARD BRAND'}
                    </p>
                    <p className="text-xs font-semibold mt-1 opacity-95 truncate max-w-[200px]">
                      {newCardHolder || 'CARDHOLDER NAME'}
                    </p>
                  </div>
                  <ShieldCheck className="w-5 h-5 opacity-80" />
                </div>
                <div className="z-10">
                  <p className="text-lg font-black tracking-widest">
                    {formatCardNumber(newCardNumber) || '•••• •••• •••• ••••'}
                  </p>
                  <div className="flex justify-between items-center mt-2 opacity-80 text-[10px] font-bold">
                    <span>VALID THRU</span>
                    <span>
                      {newExpiryMonth ? String(newExpiryMonth).padStart(2, '0') : 'MM'} / {newExpiryYear ? String(newExpiryYear).slice(-2) : 'YY'}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveCard} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">CARDHOLDER NAME</label>
                  <input
                    type="text"
                    required
                    value={newCardHolder}
                    onChange={(e) => setNewCardHolder(e.target.value)}
                    placeholder="e.g. Dr. John Doe"
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">CARD NUMBER</label>
                  <input
                    type="text"
                    required
                    maxLength="23"
                    value={formatCardNumber(newCardNumber)}
                    onChange={(e) => setNewCardNumber(e.target.value.replace(/\s/g, ''))}
                    placeholder="4111 2222 3333 4444"
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  />
                  {newCardNumber && (
                    <p className={`text-[10px] font-bold mt-1 ${validateLuhn(newCardNumber) ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {validateLuhn(newCardNumber) ? '✓ Luhn validation passed' : '✗ Invalid card number (Luhn check failed)'}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">EXPIRY MONTH</label>
                    <select
                      required
                      value={newExpiryMonth}
                      onChange={(e) => setNewExpiryMonth(e.target.value)}
                      className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="">Month</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">EXPIRY YEAR</label>
                    <select
                      required
                      value={newExpiryYear}
                      onChange={(e) => setNewExpiryYear(e.target.value)}
                      className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() + i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddCardModal(false)}
                    className="px-4 py-2 text-sm rounded-xl font-medium border border-slate-200 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCard || !validateLuhn(newCardNumber)}
                    className="px-6 py-2 text-sm rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all"
                  >
                    {savingCard ? 'Saving...' : 'Save Card'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorCrowdfunding;
