import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets_frontend/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  PawPrint,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Edit,
  Save,
  Upload,
  Heart,
  AlertCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  Activity,
  Shield,
  ShieldCheck,
  Clock,
  Trophy,
  Star,
  Zap,
  CreditCard,
  X,
  Crown,
  Video,
  Gift,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Trash2,
  CheckCircle,
  Lock,
  ExternalLink,
  FlaskConical,
  Rocket,
  Send,
  BrainCircuit,
  Camera,
  ShieldAlert,
  XCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AnimalHealthChatbot from "../components/AnimalHealthChatbot";
import FaceAuth from "../components/FaceAuth";
import PetIDCard from "../components/PetIDCard";

// ─── Sub-Components ──────────────────────────────────────────────────

const InfoItem = ({ icon: Icon, label, value, editComponent, isEdit }) => {
  const { userdata } = useContext(AppContext);
  const isObsidian = userdata?.subscription?.plan === 'Obsidian' && userdata?.subscription?.status === 'Active';
  return (
    <div className={`flex items-start p-4 rounded-2xl border transition-all duration-300 ${
      isObsidian 
        ? 'bg-[#0d0d0d] border-[#D4AF37]/15 shadow-sm hover:border-[#D4AF37]/40 text-[#F5F2EA]' 
        : 'bg-white/80 border border-neutral-100 shadow-sm hover:shadow-md'
    }`}>
      <div className={`p-2.5 rounded-xl mr-4 ${isObsidian ? 'bg-[#D4AF37]/10 text-[#E6C97A]' : 'bg-purple-50 text-[#8c52ff]'}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-400'}`}>{label}</p>
        <div>
          {isEdit ? (
            editComponent
          ) : (
            <p className={`font-bold text-[14px] leading-relaxed truncate ${isObsidian ? 'text-[#F5F2EA]' : 'text-neutral-700'}`}>
              {value || "Not provided"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const LoadingOverlay = ({ isSaving }) => {
  const { t } = useTranslation();
  if (!isSaving) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-neutral-900/60 flex items-center justify-center z-[150] backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white border border-purple-500/20 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-sm mx-4 text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="p-4 bg-purple-500/5 rounded-full border border-purple-500/10 mb-6"
          >
            <Loader2 size={36} className="text-purple-600" />
          </motion.div>
          <h3 className="text-xl font-bold text-neutral-800 tracking-tight uppercase">
            {t("profile.updatingProfile")}
          </h3>
          <p className="text-neutral-500 text-xs mt-2.5 leading-relaxed">
            {t("profile.saveChangesSub")}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const DeletionRequestModal = ({ onClose, onSubmit, isSubmitting }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md flex items-center justify-center z-[160] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-[#fdfbf7] rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full border border-red-500/20 overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-800 uppercase tracking-tight">{t("profile.deleteAccount")}</h3>
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{t("profile.permanentAction")}</p>
              </div>
            </div>
            <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
              {t("profile.deleteWarning")}
            </p>
            <textarea
              className="w-full bg-white border border-neutral-200 rounded-2xl p-4 text-sm text-neutral-800 focus:ring-2 focus:ring-red-500/10 focus:border-red-500/30 outline-none transition-all mb-6 resize-none min-h-[120px] shadow-inner"
              placeholder={t("profile.deleteReasonPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 text-neutral-500 font-bold text-sm hover:bg-neutral-50 transition-all"
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => onSubmit(reason)}
                disabled={isSubmitting || !reason.trim()}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center ${isSubmitting || !reason.trim()}
                  ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-500 to-red-600 shadow-red-200 hover:from-red-600 hover:to-red-700"
                  }`}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  t("profile.submitRequest")
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const MyProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Initialize Gemini
  const apikey2 = import.meta.env.VITE_API_KEY_GEMINI_2;
  const genAI = new GoogleGenerativeAI(apikey2);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt =
    import.meta.env.VITE_PROMPT ||
    "Provide a helpful pet health tip for pet owners in exactly 2 lines. Keep it concise, practical, and positive.";

  const {
    userdata,
    setuserdata,
    token,
    backendurl,
    loaduserprofiledata,
    getUserAppointments,
    userPets,
  } = useContext(AppContext);

  const isObsidian = userdata?.subscription?.plan === 'Obsidian' && userdata?.subscription?.status === 'Active';

  const [isEdit, setIsEdit] = useState(false);
  const [image, setImage] = useState(null);
  const [dailyQuote, setDailyQuote] = useState(t("common.loading"));
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingTip, setIsRefreshingTip] = useState(false);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [selectedPetForID, setSelectedPetForID] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [isProcessingSocial, setIsProcessingSocial] = useState(null);

  // ── Obsidian Signature Pass Exclusive States & Actions
  const [vco, setVco] = useState(null);
  const [icuDispatch, setIcuDispatch] = useState(null);
  const [overdraft, setOverdraft] = useState(null);
  const [creditDetails, setCreditDetails] = useState(null);
  const [showSpendModal, setShowSpendModal] = useState(false);
  const [spendAmount, setSpendAmount] = useState("");
  const [spendDescription, setSpendDescription] = useState("");
  const [spendCategory, setSpendCategory] = useState("UPI Scan");
  const [spending, setSpending] = useState(false);
  const [repaying, setRepaying] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayAmountInput, setRepayAmountInput] = useState("");
  const [visionAnalysis, setVisionAnalysis] = useState(null);
  const [analyzingVision, setAnalyzingVision] = useState(false);
  const [symptomText, setSymptomText] = useState("");
  const [visionImage, setVisionImage] = useState(null);

  // VCO Booking States
  const [showVcoBookingModal, setShowVcoBookingModal] = useState(false);
  const [vcoBookingVisitType, setVcoBookingVisitType] = useState("Clinic Visit");
  const [vcoBookingDate, setVcoBookingDate] = useState("");
  const [vcoBookingTime, setVcoBookingTime] = useState("10:00 AM");
  const [vcoBookingPetId, setVcoBookingPetId] = useState("");
  const [vcoBookingIsStray, setVcoBookingIsStray] = useState(false);
  const [vcoBookingStrayType, setVcoBookingStrayType] = useState("Dog");
  const [vcoBookingStrayNotes, setVcoBookingStrayNotes] = useState("");
  const [vcoBookingLoading, setVcoBookingLoading] = useState(false);

  const fetchObsidianData = useCallback(async () => {
    if (token && userdata?.subscription?.plan === 'Obsidian' && userdata?.subscription?.status === 'Active') {
      try {
        const vcoRes = await axios.get(`${backendurl}/api/user/obsidian/vco`, { headers: { token } });
        if (vcoRes.data.success) setVco(vcoRes.data.vco);

        const odRes = await axios.get(`${backendurl}/api/user/obsidian/overdraft`, { headers: { token } });
        if (odRes.data.success) setOverdraft(odRes.data);

        const cdRes = await axios.get(`${backendurl}/api/user/obsidian/credit-details`, { headers: { token } });
        if (cdRes.data.success) setCreditDetails(cdRes.data.creditLine);

        const icuRes = await axios.get(`${backendurl}/api/user/obsidian/icu-status`, { headers: { token } });
        if (icuRes.data.success) setIcuDispatch(icuRes.data.dispatch);
      } catch (error) {
        console.error("Error fetching Obsidian data:", error);
      }
    }
  }, [token, userdata, backendurl]);

  const handleSpendCredit = async (e) => {
    e.preventDefault();
    if (!spendAmount || Number(spendAmount) <= 0) {
      toast.info("Please enter a valid amount to spend");
      return;
    }
    setSpending(true);
    try {
      const { data } = await axios.post(`${backendurl}/api/user/obsidian/spend-credit`, {
        amount: Number(spendAmount),
        description: spendDescription || `Spent ₹${spendAmount} via ${spendCategory}`,
        category: spendCategory
      }, { headers: { token } });
      
      if (data.success) {
        toast.success(data.message || `Successfully spent ₹${spendAmount} using Credit Line`);
        setShowSpendModal(false);
        setSpendAmount("");
        setSpendDescription("");
        await loaduserprofiledata();
        await fetchObsidianData();
      } else {
        toast.error(data.message || "Failed to spend credit");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to spend credit");
    } finally {
      setSpending(false);
    }
  };

  const handleRepayCredit = async (e) => {
    if (e) e.preventDefault();
    if (!creditDetails || creditDetails.spent <= 0) {
      toast.info("No outstanding credit balance to repay");
      return;
    }

    const repayAmt = Number(repayAmountInput);
    if (!repayAmt || repayAmt <= 0) {
      toast.info("Please enter a valid amount to repay");
      return;
    }
    
    if (repayAmt > (userdata.pawWallet || 0)) {
      toast.error(`Insufficient Paw Wallet balance. Required: ₹${repayAmt}, Wallet Balance: ₹${userdata.pawWallet || 0}`);
      return;
    }

    if (repayAmt > creditDetails.spent) {
      toast.info(`Repayment amount cannot exceed your outstanding balance of ₹${creditDetails.spent}`);
      return;
    }
    
    setRepaying(true);
    try {
      const { data } = await axios.post(`${backendurl}/api/user/obsidian/repay-credit`, {
        amount: repayAmt
      }, { headers: { token } });
      
      if (data.success) {
        toast.success(data.message || `Successfully repaid ₹${repayAmt} of your credit balance`);
        setShowRepayModal(false);
        setRepayAmountInput("");
        await loaduserprofiledata();
        await fetchObsidianData();
      } else {
        toast.error(data.message || "Repayment failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Repayment failed");
    } finally {
      setRepaying(false);
    }
  };

  const handleBookVco = async (e) => {
    if (e) e.preventDefault();
    if (!vcoBookingDate) {
      toast.info("Please select a date");
      return;
    }
    if (!vcoBookingIsStray && !vcoBookingPetId && userPets && userPets.length > 0) {
      toast.info("Please select a pet");
      return;
    }

    setVcoBookingLoading(true);
    try {
      const dateObj = new Date(vcoBookingDate);
      const day = dateObj.getDate();
      const month = dateObj.getMonth() + 1;
      const year = dateObj.getFullYear();
      const slotDate = `${day}_${month}_${year}`;

      const { data } = await axios.post(`${backendurl}/api/user/obsidian/book-vco`, {
        slotDate,
        slotTime: vcoBookingTime,
        visitType: vcoBookingVisitType,
        petId: vcoBookingIsStray ? null : vcoBookingPetId,
        isStray: vcoBookingIsStray,
        strayDetails: vcoBookingIsStray ? {
          petType: vcoBookingStrayType || 'Dog',
          location: 'VCO Area',
          notes: vcoBookingStrayNotes
        } : null
      }, { headers: { token } });

      if (data.success) {
        toast.success(data.message || "Dedicated VCO Booked Successfully!");
        setShowVcoBookingModal(false);
        if (data.preemptedCount > 0) {
          toast.info(`${data.preemptedCount} conflicting appointment(s) rescheduled to next available slots!`);
        }
        if (getUserAppointments) {
          getUserAppointments();
        }
      } else {
        toast.error(data.message || "Failed to book VCO");
      }
    } catch (error) {
      console.error("Error booking VCO:", error);
      toast.error(error.response?.data?.message || "Failed to book VCO");
    } finally {
      setVcoBookingLoading(false);
    }
  };

  useEffect(() => {
    fetchObsidianData();
    let interval;
    if (token && userdata?.subscription?.plan === 'Obsidian' && userdata?.subscription?.status === 'Active') {
      interval = setInterval(async () => {
        try {
          const icuRes = await axios.get(`${backendurl}/api/user/obsidian/icu-status`, { headers: { token } });
          if (icuRes.data.success && icuRes.data.dispatch && icuRes.data.dispatch.status !== 'Idle') {
            setIcuDispatch(icuRes.data.dispatch);
          }
        } catch (error) {
          console.error("Error polling ICU status:", error);
        }
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [token, userdata, backendurl, fetchObsidianData]);

  const handleDispatchIcu = async (location, petName, urgency) => {
    try {
      const { data } = await axios.post(`${backendurl}/api/user/obsidian/dispatch-icu`, {
        location, petName, urgency
      }, { headers: { token } });
      if (data.success) {
        toast.success(data.message);
        setIcuDispatch(data.dispatch);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to dispatch ICU");
    }
  };

  const handleVisionDiagnostic = async (e) => {
    e.preventDefault();
    if (!symptomText.trim()) {
      toast.info("Please describe the physical symptoms first.");
      return;
    }
    setAnalyzingVision(true);
    try {
      const formData = new FormData();
      formData.append("symptoms", symptomText);
      if (visionImage) {
        formData.append("image", visionImage);
      }
      const { data } = await axios.post(`${backendurl}/api/user/obsidian/diagnostics`, formData, {
        headers: { token, 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        setVisionAnalysis(data.analysis);
        toast.success("Multi-Modal analysis complete!");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Vision diagnostic failed");
    } finally {
      setAnalyzingVision(false);
    }
  };

  // ── Beta Access State
  const [betaFeatures, setBetaFeatures] = useState([]);
  const [betaApplications, setBetaApplications] = useState([]);
  const [betaMotivation, setBetaMotivation] = useState({});
  const [betaSubmitting, setBetaSubmitting] = useState(null);
  const [betaExpanded, setBetaExpanded] = useState(null);

  useEffect(() => {
    axios.get(`${backendurl}/api/beta/features`)
      .then(({ data }) => { if (data.success) setBetaFeatures(data.features.filter(f => f.status === 'accepting')); })
      .catch(() => {});
    if (token) {
      axios.get(`${backendurl}/api/beta/my-applications`, { headers: { token } })
        .then(({ data }) => { if (data.success) setBetaApplications(data.applications); })
        .catch(() => {});
    }
  }, [token, backendurl]);

  const getMyBetaApp = (featureId) => betaApplications.find(a => a.featureId === featureId || a.featureId?._id === featureId);

  const handleBetaApply = async (featureId, featureName) => {
    const text = betaMotivation[featureId]?.trim() || '';
    if (text.length < 20) { toast.error('Write at least 20 characters explaining your interest.'); return; }
    setBetaSubmitting(featureId);
    try {
      const { data } = await axios.post(`${backendurl}/api/beta/apply`, { featureId, motivation: text }, { headers: { token } });
      if (data.success) {
        toast.success('🚀 Application submitted! Check your email for confirmation.');
        setBetaMotivation(p => ({ ...p, [featureId]: '' }));
        setBetaExpanded(null);
        const { data: appsData } = await axios.get(`${backendurl}/api/beta/my-applications`, { headers: { token } });
        if (appsData.success) setBetaApplications(appsData.applications);
      } else toast.error(data.message);
    } catch { toast.error('Something went wrong.'); }
    setBetaSubmitting(null);
  };

  const handleToggleSocialConnection = async (provider) => {
    if (provider !== 'google') return;
    const isConnected = userdata.isGoogleConnected;

    if (isConnected) {
      setIsProcessingSocial('google');
      try {
        const { data } = await axios.post(
          `${backendurl}/api/user/disconnect-social`,
          { provider: 'google' },
          { headers: { token } }
        );
        if (data.success) {
          toast.success(data.message);
          await loaduserprofiledata();
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || `Failed to disconnect Google`);
      } finally {
        setIsProcessingSocial(null);
      }
    } else {
      setIsProcessingSocial('google');
      
      if (!window.google) {
        // Attempt to load GIS script if not present
        const script = document.createElement('script');
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          triggerGoogleGIS();
        };
        script.onerror = () => {
          toast.error("Failed to load Google Sign-In helper.");
          setIsProcessingSocial(null);
        };
        document.body.appendChild(script);
      } else {
        triggerGoogleGIS();
      }
    }
  };

  const triggerGoogleGIS = () => {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1047648485293-placeholderclientid.apps.googleusercontent.com";
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              const res = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
              const providerId = res.data.sub;
              
              const { data } = await axios.post(
                `${backendurl}/api/user/connect-social`,
                { provider: 'google', providerId },
                { headers: { token } }
              );
              
              if (data.success) {
                toast.success(`Connected Google account: ${res.data.email}`);
                await loaduserprofiledata();
              } else {
                toast.error(data.message);
              }
            } catch (error) {
              toast.error(error.response?.data?.message || "Failed to fetch user details from Google.");
            } finally {
              setIsProcessingSocial(null);
            }
          } else {
            toast.error("Google login cancelled or failed.");
            setIsProcessingSocial(null);
          }
        },
        error_callback: (err) => {
          toast.error(err.message || "Google authorization error");
          setIsProcessingSocial(null);
        }
      });
      tokenClient.requestAccessToken();
    } catch (err) {
      console.error(err);
      const fallbackId = prompt("Failed to load Google OAuth popup. Enter Google email/id manually to test sandbox link (or press Cancel):");
      if (fallbackId) {
        axios.post(
          `${backendurl}/api/user/connect-social`,
          { provider: 'google', providerId: fallbackId },
          { headers: { token } }
        ).then(({ data }) => {
          if (data.success) {
            toast.success(`Linked manual ID: ${fallbackId}`);
            loaduserprofiledata();
          } else {
            toast.error(data.message);
          }
        }).catch(err => {
          toast.error(err.message);
        }).finally(() => {
          setIsProcessingSocial(null);
        });
      } else {
        setIsProcessingSocial(null);
      }
    }
  };

  const [editedData, setEditedData] = useState(null);
  const originalDataRef = useRef(null);

  const toggleEdit = () => setIsEdit(!isEdit);

  const handleSubmitDeletion = async (reason) => {
    try {
      setIsSubmittingDeletion(true);
      const { data } = await axios.post(
        `${backendurl}/api/user/request-deletion`,
        { reason },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
        setShowDeleteModal(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error submitting request");
    } finally {
      setIsSubmittingDeletion(false);
    }
  };

  useEffect(() => {
    if (userdata) {
      const basicFields = ["name", "email", "phone", "gender", "dob", "image", "full_address"];

      const basicCompleted = basicFields.filter((field) => {
        if (field === "full_address") return userdata.full_address && userdata.full_address.length > 5;
        return !!userdata[field];
      }).length;

      const totalFields = basicFields.length + 1;
      const totalCompleted = basicCompleted + (userPets && userPets.length > 0 ? 1 : 0);

      setProfileCompleteness(Math.round((totalCompleted / totalFields) * 100));
    }
  }, [userdata, userPets]);

  useEffect(() => {
    if (token && getUserAppointments) {
      getUserAppointments().then((appts) => {
        if (appts && appts.length > 0) {
          const upcoming = appts
            .filter((a) => !a.cancelled && !a.isCompleted)
            .sort((a, b) => {
              const dateA = a.slotDate.split("_").reverse().join("-");
              const dateB = b.slotDate.split("_").reverse().join("-");
              return new Date(dateA) - new Date(dateB);
            });
          if (upcoming.length > 0) {
            setNextAppointment(upcoming[0]);
          }
        }
      });
    }
  }, [token, getUserAppointments]);

  const TIP_REFRESH_INTERVAL = 10 * 60 * 60 * 1000;
  const TIP_STORAGE_KEY = "petHealthTip";
  const TIP_TIMESTAMP_KEY = "petHealthTipTimestamp";

  useEffect(() => {
    if (userdata && !isEdit) {
      setEditedData({ ...userdata });
    }
  }, [userdata, isEdit]);

  useEffect(() => {
    if (isEdit && userdata && !originalDataRef.current) {
      originalDataRef.current = JSON.parse(JSON.stringify(userdata));
    }
    if (!isEdit) {
      originalDataRef.current = null;
    }
  }, [isEdit, userdata]);

  const normalizeAddress = useCallback((address) => {
    if (!address) return { LOCATION: "", LINE: "" };
    return {
      LOCATION: (address.LOCATION || address.Location || "").trim().toUpperCase(),
      LINE: (address.LINE || address.Line || "").trim().toUpperCase(),
    };
  }, []);

  const validateFields = useCallback((data) => {
    if (!data) return ["User data not loaded"];
    const fields = {
      Name: data?.name?.trim(),
      Email: data?.email?.trim(),
      Gender: data?.gender?.trim(),
      "Date of Birth": data?.dob,
      Phone: data?.phone?.trim(),
      "Full Address": data?.full_address?.trim(),
    };

    return Object.entries(fields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handlePhoneChange = (value) => {
    const digitsOnly = value.replace(/\D/g, "");
    handleInputChange("phone", digitsOnly);
  };

  const handleAddressChange = useCallback((field, value) => {
    setEditedData((prev) => ({
      ...prev,
      address: {
        ...(prev?.address || {}),
        [field]: value.toUpperCase(),
        ...(field === "LOCATION" ? { Location: value.toUpperCase() } : {}),
        ...(field === "LINE" ? { Line: value.toUpperCase() } : {}),
      },
    }));
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setImage(file);
    }
  };

  const updateUserProfileData = async () => {
    try {
      setIsSaving(true);
      const userToSave = { ...editedData };

      const normalized = normalizeAddress(userToSave.address);
      if (!normalized.LOCATION || !normalized.LINE) {
        toast.error("Please fill in address fields (State and District)");
        return;
      }

      // Auto-construct full_address from District (LINE) and State (LOCATION)
      userToSave.full_address = `${normalized.LINE}, ${normalized.LOCATION}`;

      // Ensure defaults for pet fields if they are missing
      if (!userToSave.pet_type) userToSave.pet_type = "Small Animal";
      if (!userToSave.pet_age) userToSave.pet_age = "1";
      if (!userToSave.pet_gender) userToSave.pet_gender = "Male";
      if (!userToSave.breed) userToSave.breed = "Not Selected";
      if (!userToSave.category) userToSave.category = "Not Selected";

      const missingFields = validateFields(userToSave);
      if (missingFields.length > 0) {
        toast.error(`Please fill in: ${missingFields.join(", ")}`);
        return;
      }

      const formdata = new FormData();
      Object.entries({
        name: userToSave.name,
        email: userToSave.email,
        phone: userToSave.phone,
        full_address: userToSave.full_address,
        gender: userToSave.gender,
        dob: userToSave.dob,
        pet_type: userToSave.pet_type,
        pet_gender: userToSave.pet_gender,
        breed: userToSave.breed,
        category: userToSave.category,
        pet_age: userToSave.pet_age,
      }).forEach(([key, value]) => formdata.append(key, value?.trim?.() || ""));

      formdata.append("address", JSON.stringify(normalized));
      if (userToSave.id) formdata.append("userId", userToSave.id);
      if (image) formdata.append("image", image);

      const { data } = await axios.post(`${backendurl}/api/user/update-profile`, formdata, { headers: { token } });

      if (data.success) {
        await loaduserprofiledata();
        toast.success(data.message || "Profile updated successfully!");
        setuserdata(userToSave);
        setIsEdit(false);
        setImage(null);
        originalDataRef.current = null;
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  const setupDailyContentGeneration = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setIsRefreshingTip(true);
        if (!apikey2) {
          setDailyQuote("Daily tip unavailable");
          return;
        }

        const cachedTip = localStorage.getItem(TIP_STORAGE_KEY);
        const cachedTimestamp = localStorage.getItem(TIP_TIMESTAMP_KEY);
        const currentTime = Date.now();

        if (!isManualRefresh && cachedTip && cachedTimestamp) {
          const timeSinceLastUpdate = currentTime - parseInt(cachedTimestamp);
          if (timeSinceLastUpdate < TIP_REFRESH_INTERVAL) {
            setDailyQuote(cachedTip);
            return;
          }
        }

        const result = await model.generateContent(prompt);
        const newTip = result.response.text() || "No content available.";
        localStorage.setItem(TIP_STORAGE_KEY, newTip);
        localStorage.setItem(TIP_TIMESTAMP_KEY, currentTime.toString());
        setDailyQuote(newTip);
      } catch (error) {
        console.error("Error generating tip:", error);
        setDailyQuote("Regular check-ups and a balanced diet keep your pet healthy and happy!");
      } finally {
        if (isManualRefresh) setTimeout(() => setIsRefreshingTip(false), 500);
      }
    },
    [apikey2, model, prompt, TIP_REFRESH_INTERVAL]
  );

  useEffect(() => {
    setupDailyContentGeneration();
  }, [setupDailyContentGeneration]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  const handleCancelEdit = () => {
    if (originalDataRef.current) setEditedData(originalDataRef.current);
    setIsEdit(false);
    setImage(null);
    originalDataRef.current = null;
  };

  if (!editedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2e4c6] relative overflow-hidden">
        <div className="absolute top-20 left-20 text-[#8c574b]/10 animate-pulse">
          <Sparkles size={40} />
        </div>
        <div className="absolute bottom-20 right-20 text-[#8c574b]/10 animate-pulse [animation-delay:1.5s]">
          <Sparkles size={60} />
        </div>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="p-4 bg-purple-500/5 rounded-full border border-purple-500/20 shadow-xl">
          <Loader2 size={48} className="text-purple-600" />
        </motion.div>
      </div>
    );
  }

  const normalized = normalizeAddress(editedData.address);
  const remainingVideoCalls = userdata?.subscription?.plan === "Obsidian"
    ? "Unlimited"
    : (userdata?.subscription?.plan === "Platinum" || userdata?.subscription?.plan === "Gold")
      ? Math.max(0, (userdata.subscription.plan === "Gold" ? 10 : 25) - (userdata.videoCallsUsed || 0))
      : 25;

  return (
    <div className={`min-h-screen py-12 px-4 md:px-8 relative overflow-hidden font-sans transition-colors duration-500 ${isObsidian ? 'bg-[#050505] text-[#F5F2EA]' : 'bg-[#f2e4c6]'}`}>
      
      {/* Decorative ambient elements */}
      <div className={`absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isObsidian ? 'bg-[#D4AF37]/5' : 'bg-purple-300/10'}`} />
      <div className={`absolute bottom-40 right-20 w-[450px] h-[450px] rounded-full blur-3xl pointer-events-none ${isObsidian ? 'bg-[#E6C97A]/5' : 'bg-amber-500/10'}`} />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Loading Overlay */}
        <LoadingOverlay isSaving={isSaving} />

        {/* Dynamic Modal Controllers */}
        <AnimatePresence>
          {selectedPetForID && (
            <PetIDCard pet={selectedPetForID} ownerName={userdata.name} phone={userdata.phone} onClose={() => setSelectedPetForID(null)} />
          )}
          {showFaceAuth && (
            <FaceAuth mode="register" onCancel={() => setShowFaceAuth(false)} onAuthSuccess={() => setShowFaceAuth(false)} />
          )}
          {showSpendModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-gradient-to-br from-[#121212] to-[#050505] border border-[#D4AF37]/30 rounded-[2.5rem] w-full max-w-md p-6 shadow-2xl overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23]" />
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-[#F5F2EA] flex items-center gap-2">
                      <Zap className="text-[#E6C97A]" size={20} /> Spend Credit
                    </h3>
                    <p className="text-xs text-[#8A8A8A] mt-1">Available Limit: ₹{creditDetails?.available !== undefined ? creditDetails.available : 50000}</p>
                  </div>
                  <button onClick={() => setShowSpendModal(false)} className="p-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#E6C97A] rounded-full transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSpendCredit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-2">Amount to Spend (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37] font-black">₹</span>
                      <input
                        type="number"
                        min="1"
                        max={creditDetails?.available !== undefined ? creditDetails.available : 50000}
                        required
                        value={spendAmount}
                        onChange={(e) => setSpendAmount(e.target.value)}
                        className="w-full bg-[#050505] border border-[#D4AF37]/20 focus:border-[#D4AF37]/50 rounded-2xl py-3 pl-8 pr-4 text-[#F5F2EA] font-bold outline-none transition-all placeholder:text-[#8A8A8A]/50"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-2">Spend Category</label>
                    <select
                      value={spendCategory}
                      onChange={(e) => setSpendCategory(e.target.value)}
                      className="w-full bg-[#050505] border border-[#D4AF37]/20 focus:border-[#D4AF37]/50 rounded-2xl p-3 text-[#F5F2EA] font-medium outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="UPI Scan">UPI QR Scan</option>
                      <option value="Hospital Bill">Hospital / Vet Bill</option>
                      <option value="Medicine">Medicine & Supplies</option>
                      <option value="Donation">Charitable Donation</option>
                      <option value="Other">Other Expenses</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-2">Description (Optional)</label>
                    <input
                      type="text"
                      value={spendDescription}
                      onChange={(e) => setSpendDescription(e.target.value)}
                      className="w-full bg-[#050505] border border-[#D4AF37]/20 focus:border-[#D4AF37]/50 rounded-2xl p-3 text-[#F5F2EA] text-sm outline-none transition-all placeholder:text-[#8A8A8A]/50"
                      placeholder="e.g. Paid for Apollo Vet Services"
                      maxLength={100}
                    />
                  </div>

                  <div className="pt-4 border-t border-[#D4AF37]/10 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowSpendModal(false)}
                      disabled={spending}
                      className="flex-1 py-3 px-4 bg-[#0d0d0d] hover:bg-[#121212] disabled:opacity-50 text-[#F5F2EA] rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-[#D4AF37]/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={spending || !spendAmount || Number(spendAmount) <= 0 || Number(spendAmount) > (creditDetails?.available !== undefined ? creditDetails.available : 50000)}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] hover:opacity-90 disabled:opacity-50 text-black rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#D4AF37]/10"
                    >
                      {spending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                      Authorize
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
          {showRepayModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-gradient-to-br from-[#121212] to-[#050505] border border-[#D4AF37]/30 rounded-[2.5rem] w-full max-w-md p-6 shadow-2xl overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23]" />
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-[#F5F2EA] flex items-center gap-2">
                      <RefreshCw className="text-[#E6C97A]" size={20} /> Repay Dues
                    </h3>
                    <p className="text-xs text-[#8A8A8A] mt-1">Outstanding Balance: ₹{creditDetails?.spent || 0}</p>
                  </div>
                  <button onClick={() => setShowRepayModal(false)} className="p-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#E6C97A] rounded-full transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleRepayCredit} className="space-y-4">
                  <div className="p-4 bg-[#0d0d0d] border border-[#D4AF37]/15 rounded-2xl space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8A8A8A]">Paw Wallet Balance:</span>
                      <span className="text-[#F5F2EA] font-bold">₹{userdata?.pawWallet || 0}</span>
                    </div>
                    {Number(repayAmountInput) > (userdata?.pawWallet || 0) && (
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                        ⚠️ Insufficient funds in Paw Wallet
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-2">Amount to Repay (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37] font-black">₹</span>
                      <input
                        type="number"
                        min="1"
                        max={Math.min(creditDetails?.spent || 0, userdata?.pawWallet || 0)}
                        required
                        value={repayAmountInput}
                        onChange={(e) => setRepayAmountInput(e.target.value)}
                        className="w-full bg-[#050505] border border-[#D4AF37]/20 focus:border-[#D4AF37]/50 rounded-2xl py-3 pl-8 pr-4 text-[#F5F2EA] font-bold outline-none transition-all placeholder:text-[#8A8A8A]/50"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#D4AF37]/10 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRepayModal(false)}
                      disabled={repaying}
                      className="flex-1 py-3 px-4 bg-[#0d0d0d] hover:bg-[#121212] disabled:opacity-50 text-[#F5F2EA] rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-[#D4AF37]/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={repaying || !repayAmountInput || Number(repayAmountInput) <= 0 || Number(repayAmountInput) > (userdata?.pawWallet || 0) || Number(repayAmountInput) > (creditDetails?.spent || 0)}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] hover:opacity-90 disabled:opacity-50 text-black rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#D4AF37]/10"
                    >
                      {repaying ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                      Confirm Payment
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}

          {showVcoBookingModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-gradient-to-br from-[#121212] to-[#050505] border border-[#D4AF37]/30 rounded-[2.5rem] w-full max-w-md p-6 shadow-2xl overflow-hidden relative text-[#F5F2EA]"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23]" />
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-[#F5F2EA] flex items-center gap-2">
                      <Calendar className="text-[#E6C97A]" size={20} /> Book Dedicated VCO
                    </h3>
                    <p className="text-xs text-[#8A8A8A] mt-1">Priority Override Enabled for Obsidian Members</p>
                  </div>
                  <button onClick={() => setShowVcoBookingModal(false)} className="p-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#E6C97A] rounded-full transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleBookVco} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  {/* Visit Type */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-2">Visit Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setVcoBookingVisitType("Clinic Visit")}
                        className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
                          vcoBookingVisitType === "Clinic Visit"
                            ? "bg-[#D4AF37]/15 border-[#D4AF37] text-[#E6C97A]"
                            : "bg-[#0d0d0d] border-[#D4AF37]/10 text-[#8A8A8A] hover:bg-[#121212]"
                        }`}
                      >
                        Clinic Visit
                      </button>
                      <button
                        type="button"
                        onClick={() => setVcoBookingVisitType("Home Visit")}
                        className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
                          vcoBookingVisitType === "Home Visit"
                            ? "bg-[#D4AF37]/15 border-[#D4AF37] text-[#E6C97A]"
                            : "bg-[#0d0d0d] border-[#D4AF37]/10 text-[#8A8A8A] hover:bg-[#121212]"
                        }`}
                      >
                        Home Visit
                      </button>
                    </div>
                  </div>

                  {/* Date selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-2">Select Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={vcoBookingDate}
                      onChange={(e) => setVcoBookingDate(e.target.value)}
                      className="w-full bg-[#050505] border border-[#D4AF37]/20 focus:border-[#D4AF37]/50 rounded-2xl py-3 px-4 text-[#F5F2EA] font-bold outline-none transition-all"
                    />
                  </div>

                  {/* Time selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-2">Select Time</label>
                    <select
                      value={vcoBookingTime}
                      onChange={(e) => setVcoBookingTime(e.target.value)}
                      className="w-full bg-[#050505] border border-[#D4AF37]/20 focus:border-[#D4AF37]/50 rounded-2xl py-3 px-4 text-[#F5F2EA] font-bold outline-none transition-all"
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="01:00 PM">01:00 PM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                      <option value="05:00 PM">05:00 PM</option>
                      <option value="06:00 PM">06:00 PM</option>
                      <option value="07:00 PM">07:00 PM</option>
                      <option value="08:00 PM">08:00 PM</option>
                    </select>
                  </div>

                  {/* Animal Status */}
                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="vcoStrayCheck"
                      checked={vcoBookingIsStray}
                      onChange={(e) => setVcoBookingIsStray(e.target.checked)}
                      className="accent-[#D4AF37]"
                    />
                    <label htmlFor="vcoStrayCheck" className="text-xs text-[#F5F2EA] font-bold cursor-pointer">
                      This is for a Stray Animal / Emergency
                    </label>
                  </div>

                  {!vcoBookingIsStray ? (
                    <div>
                      <label className="block text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-2">Select Pet</label>
                      {userPets && userPets.length > 0 ? (
                        <select
                          required={!vcoBookingIsStray}
                          value={vcoBookingPetId}
                          onChange={(e) => setVcoBookingPetId(e.target.value)}
                          className="w-full bg-[#050505] border border-[#D4AF37]/20 focus:border-[#D4AF37]/50 rounded-2xl py-3 px-4 text-[#F5F2EA] font-bold outline-none transition-all"
                        >
                          <option value="">-- Choose Pet --</option>
                          {userPets.map(p => (
                            <option key={p._id} value={p._id}>{p.name} ({p.petType})</option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-[11px] text-yellow-300">
                          No registered pets found. Please register a pet first or select "Stray Animal".
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 p-4 bg-[#0d0d0d] border border-[#D4AF37]/15 rounded-2xl">
                      <div>
                        <label className="block text-[9px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">Animal Type</label>
                        <select
                          value={vcoBookingStrayType}
                          onChange={(e) => setVcoBookingStrayType(e.target.value)}
                          className="w-full bg-[#050505] border border-[#D4AF37]/10 focus:border-[#D4AF37]/35 rounded-xl py-2 px-3 text-[#F5F2EA] text-xs font-bold outline-none"
                        >
                          <option value="Dog">Dog</option>
                          <option value="Cat">Cat</option>
                          <option value="Cow">Cow</option>
                          <option value="Bird">Bird</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">Emergency Details</label>
                        <textarea
                          placeholder="Describe the condition or emergency notes..."
                          value={vcoBookingStrayNotes}
                          onChange={(e) => setVcoBookingStrayNotes(e.target.value)}
                          className="w-full h-16 bg-[#050505] border border-[#D4AF37]/10 focus:border-[#D4AF37]/35 rounded-xl p-3 text-[#F5F2EA] text-xs outline-none resize-none placeholder:text-[#8A8A8A]/40"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-[#D4AF37]/10 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowVcoBookingModal(false)}
                      disabled={vcoBookingLoading}
                      className="flex-1 py-3 px-4 bg-[#0d0d0d] hover:bg-[#121212] disabled:opacity-50 text-[#F5F2EA] rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-[#D4AF37]/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={vcoBookingLoading}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] hover:opacity-90 disabled:opacity-50 text-black rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#D4AF37]/10"
                    >
                      {vcoBookingLoading ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
                      Book Priority Slot
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ────────────────── LEFT COLUMN: PROFILE & ACCOUNT SETTINGS ────────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-6 items-stretch lg:self-start">
            
            {/* Profile Identity Card */}
            <div className={`rounded-[2.5rem] shadow-sm overflow-hidden relative pb-8 flex flex-col items-center h-fit border transition-all duration-300 ${
              isObsidian 
                ? 'bg-[#0d0d0d] border-[#D4AF37]/25 shadow-[0_0_50px_rgba(212,175,55,0.05)]' 
                : 'bg-white border border-neutral-100 shadow-sm'
            }`}>
              
              {/* Header Curve Banner */}
              <div className={`w-full h-36 relative rounded-t-[2.5rem] ${isObsidian ? 'bg-gradient-to-r from-[#1c140d] via-[#2a2015] to-[#0d0d0d] border-b border-[#D4AF37]/10' : 'bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600'}`} />
              
              {/* Profile Avatar Overlapping Wrapper */}
              <div className="relative -mt-16 flex flex-col items-center z-10">
                
                {/* Crown subscription badge */}
                {userdata?.subscription?.status === "Active" && userdata.subscription.plan !== "None" && (
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className={`absolute -top-3 -left-3 p-2 rounded-2xl shadow-md z-20 flex items-center justify-center cursor-pointer border ${
                      userdata.subscription.plan === 'Obsidian'
                        ? 'border-[#D4AF37] bg-gradient-to-br from-neutral-950 to-[#1c140d] shadow-[#D4AF37]/20'
                        : 'border-amber-300 bg-white'
                    }`}
                    onClick={() => navigate("/subscription")}
                    title={`${userdata.subscription.plan} Tier`}
                  >
                    <Crown className={`w-5 h-5 ${userdata.subscription.plan === 'Obsidian' ? 'text-[#E6C97A] fill-[#D4AF37] animate-pulse' : 'text-amber-500 fill-amber-400'}`} />
                  </motion.div>
                )}

                {/* Verified Badge */}
                {!editedData.isBanned && (
                  <div className={`absolute bottom-0 right-0 p-1.5 rounded-full border-4 shadow-sm z-20 ${isObsidian ? 'bg-emerald-600 border-[#0d0d0d]' : 'bg-emerald-500 border-white'}`}>
                    <CheckCircle className="w-3.5 h-3.5 fill-white text-emerald-500" />
                  </div>
                )}

                {/* Main profile picture */}
                <div className={`w-32 h-32 rounded-full border-4 shadow-lg overflow-hidden group relative ${isObsidian ? 'border-[#D4AF37]/25 bg-neutral-900' : 'border-white bg-neutral-100'}`}>
                  {isEdit ? (
                    <label htmlFor="image" className="cursor-pointer block w-full h-full">
                      <img
                        className="w-full h-full object-cover"
                        src={image ? URL.createObjectURL(image) : editedData.image}
                        alt="Profile"
                        onError={(e) => (e.target.src = assets.profile_pic)}
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-white animate-bounce" />
                      </div>
                      <input onChange={handleImageChange} type="file" id="image" accept="image/*" hidden />
                    </label>
                  ) : (
                    <img
                      src={editedData.image}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.src = assets.profile_pic)}
                    />
                  )}
                </div>
              </div>

              {/* User Identity Info */}
              <h2 className={`text-xl font-black mt-4 text-center px-4 truncate max-w-full ${isObsidian ? 'text-[#F5F2EA]' : 'text-neutral-800'}`}>
                {isEdit ? (
                  <input
                    type="text"
                    className={`rounded-xl px-3 py-1.5 text-center text-base font-bold focus:outline-none max-w-[200px] ${
                      isObsidian 
                        ? 'bg-[#050505] border border-[#D4AF37]/20 text-[#F5F2EA] focus:ring-2 focus:ring-[#D4AF37]/15' 
                        : 'bg-neutral-50 border border-neutral-200 text-neutral-800 focus:ring-2 focus:ring-purple-500/20'
                    }`}
                    value={editedData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                ) : (
                  userdata.name
                )}
              </h2>

              {userdata?.subscription?.plan && userdata.subscription.plan !== "None" && (
                <div className={`mt-2 px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                  userdata.subscription.plan === 'Obsidian'
                    ? 'bg-gradient-to-r from-neutral-900 via-[#1c140d] to-neutral-950 text-[#E6C97A] border-[#D4AF37]/45 shadow-sm shadow-[#D4AF37]/20'
                    : 'bg-purple-100 text-purple-700 border-purple-200'
                }`}>
                  {userdata.subscription.plan} Tier
                </div>
              )}

              {userdata?.pawCode && (
                <div
                  onClick={() => {
                    navigator.clipboard.writeText(userdata.pawCode);
                    toast.success("Referral Paw Code copied!");
                  }}
                  className={`mt-3 flex items-center gap-1 px-3 py-1 text-[10px] font-mono rounded-lg border cursor-pointer transition-all active:scale-95 ${
                    isObsidian 
                      ? 'bg-[#050505] hover:bg-[#121212] text-[#8A8A8A] border-[#D4AF37]/15' 
                      : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-500 border-neutral-200'
                  }`}
                  title="Click to copy Paw Code"
                >
                  <Gift className={`w-3.5 h-3.5 ${isObsidian ? 'text-[#D4AF37]' : 'text-purple-500'}`} />
                  <span>PAW CODE: </span>
                  <span className={`font-bold ${isObsidian ? 'text-[#E6C97A]' : 'text-neutral-700'}`}>{userdata.pawCode}</span>
                </div>
              )}

              <div className={`mt-4 flex items-center gap-1.5 text-xs px-4 max-w-full ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-500'}`}>
                <Mail className={`w-4 h-4 shrink-0 ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-400'}`} />
                <span className="truncate">{editedData.email}</span>
              </div>

              {userPets && userPets.length > 0 && (
                <button
                  onClick={() => setSelectedPetForID(userPets[0])}
                  className={`mt-6 px-5 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 active:scale-95 ${
                    isObsidian 
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black shadow-[#D4AF37]/10 hover:opacity-95' 
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white'
                  }`}
                >
                  <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" /> Premium Pet ID
                </button>
              )}

              {/* Next Appointment or Book Appointment Widget */}
              {nextAppointment ? (
                <div className={`mt-6 w-[88%] rounded-2xl p-4 flex flex-col gap-2 border ${
                  isObsidian 
                    ? 'bg-[#050505] border-[#D4AF37]/15 text-[#F5F2EA]' 
                    : 'bg-purple-50/70 border border-purple-100'
                }`}>
                  <div className={`flex items-center gap-1.5 ${isObsidian ? 'text-[#E6C97A]' : 'text-purple-700'}`}>
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Next Appointment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={nextAppointment.docData?.image || assets.profile_pic}
                      alt="Doctor"
                      className={`w-10 h-10 rounded-full object-cover border ${isObsidian ? 'border-[#D4AF37]/20' : 'border-purple-200'}`}
                    />
                    <div className="min-w-0">
                      <h5 className={`text-xs font-bold truncate ${isObsidian ? 'text-[#F5F2EA]' : 'text-neutral-800'}`}>{nextAppointment.docData?.name || "Doctor"}</h5>
                      <p className={`text-[10px] truncate ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-500'}`}>{nextAppointment.docData?.speciality || "General Vet"}</p>
                    </div>
                  </div>
                  <div className={`flex items-center justify-between mt-1 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border ${
                    isObsidian 
                      ? 'bg-[#0d0d0d] border-[#D4AF37]/10 text-[#F5F2EA]' 
                      : 'bg-white border border-neutral-100 text-neutral-600'
                  }`}>
                    <span>{nextAppointment.slotDate ? nextAppointment.slotDate.replaceAll("_", "/") : ""}</span>
                    <span className={`font-black ${isObsidian ? 'text-[#D4AF37]' : 'text-purple-600'}`}>{nextAppointment.slotTime}</span>
                  </div>
                </div>
              ) : (
                <div className={`mt-6 w-[88%] rounded-2xl p-4 flex flex-col items-center text-center gap-1.5 border ${
                  isObsidian 
                    ? 'bg-[#050505] border-[#D4AF37]/15' 
                    : 'bg-amber-50/50 border border-amber-100'
                }`}>
                  <Calendar className={`w-5 h-5 ${isObsidian ? 'text-[#D4AF37]' : 'text-amber-500'}`} />
                  <h5 className={`text-[10px] font-black uppercase tracking-wider ${isObsidian ? 'text-[#E6C97A]' : 'text-amber-800'}`}>No Upcoming Visits</h5>
                  <p className={`text-[9px] leading-normal ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-500'}`}>Keep your pet's health checked. Book a video consultation today.</p>
                  <button
                    onClick={() => navigate("/doctors")}
                    className={`mt-2 px-3 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all active:scale-95 ${
                      isObsidian 
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black shadow-[#D4AF37]/10' 
                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    Book Consult
                  </button>
                </div>
              )}

              {/* Decorative pets illustration */}
              <div className="mt-4 px-4 w-full flex justify-center">
                <img src="/pets_illustration.png" alt="pets illustration" className="max-w-[160px] w-full object-contain" />
              </div>

            </div>

            {/* Linked Accounts */}
            <div className={`rounded-[2rem] p-6 shadow-sm border transition-all duration-300 ${
              isObsidian 
                ? 'bg-[#0d0d0d] border-[#D4AF37]/15 text-white' 
                : 'bg-white border border-neutral-100'
            }`}>
              <h4 className={`text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2 ${isObsidian ? 'text-[#F5F2EA]' : 'text-neutral-800'}`}>
                <ShieldCheck className={`w-4 h-4 ${isObsidian ? 'text-[#D4AF37]' : 'text-purple-500'}`} /> Linked Accounts
              </h4>
              <div className={`flex items-center justify-between p-3 rounded-2xl border shadow-inner ${
                isObsidian 
                  ? 'bg-[#050505] border-[#D4AF37]/10' 
                  : 'bg-neutral-50 border-neutral-100'
              }`}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${isObsidian ? 'text-[#F5F2EA]' : 'text-neutral-700'}`}>Google</p>
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-400'}`}>
                      {userdata.isGoogleConnected ? "Connected" : "Not Connected"}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleToggleSocialConnection('google')}
                  disabled={isProcessingSocial !== null}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm shrink-0 min-w-[76px] flex items-center justify-center ${
                    userdata.isGoogleConnected
                      ? isObsidian 
                        ? "bg-[#121212] hover:bg-red-950/20 text-[#8A8A8A] hover:text-red-400 border border-[#D4AF37]/15"
                        : "bg-neutral-100 hover:bg-red-50 text-neutral-500 hover:text-red-500 border border-neutral-200"
                      : isObsidian 
                        ? "bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  {isProcessingSocial === 'google' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    userdata.isGoogleConnected ? "Disconnect" : "Connect"
                  )}
                </button>
              </div>
            </div>

            {/* Premium Membership */}
            <div className={`rounded-[2rem] p-6 shadow-sm flex flex-col justify-between border transition-all duration-300 ${
              isObsidian 
                ? 'bg-gradient-to-br from-[#1c140d] via-[#090909] to-[#050505] border-[#D4AF37]/45 text-white shadow-[0_0_30px_rgba(212,175,55,0.08)]' 
                : 'bg-white border border-neutral-100'
            }`}>
              <div>
                <h4 className={`text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-2 ${isObsidian ? 'text-[#E6C97A]' : 'text-neutral-800'}`}>
                  <Crown className={`w-4 h-4 ${isObsidian ? 'text-[#D4AF37] fill-[#D4AF37]/30 animate-pulse' : 'text-amber-500'}`} />
                  {userdata?.subscription?.plan && userdata.subscription.plan !== "None" ? `${userdata.subscription.plan} Membership` : "Platinum Membership"}
                </h4>
                
                <p className={`text-[11px] leading-relaxed mb-4 ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-500'}`}>
                  Enjoy unlimited online pet consultations, 24/7 priority support, smart health tracking, and free shipping on prescriptions.
                </p>

                <div className="mt-3">
                  <p className={`text-[9px] font-black uppercase tracking-wider ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-400'}`}>Expiry Information</p>
                  <div className={`flex items-center gap-1.5 mt-1 text-xs font-semibold ${isObsidian ? 'text-[#F5F2EA]' : 'text-neutral-600'}`}>
                    <Clock className={`w-3.5 h-3.5 ${isObsidian ? 'text-[#D4AF37]' : 'text-neutral-400'}`} />
                    <span>{userdata.subscription?.expiryDate ? formatDate(userdata.subscription.expiryDate) : "June 6, 2026"}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/subscription")}
                className={`w-full mt-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1 active:scale-95 ${
                  isObsidian 
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black shadow-[#D4AF37]/10 hover:opacity-95' 
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white'
                }`}
              >
                Manage Membership <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Danger Zone */}
            <div className={`rounded-[2rem] p-6 shadow-sm border flex flex-col justify-between transition-all duration-300 ${
              isObsidian 
                ? 'bg-red-950/10 border-red-900/40 text-white' 
                : 'bg-red-50/50 border border-red-100'
            }`}>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-red-600 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" /> Danger Zone
                </h4>
                <p className={`text-[10px] leading-relaxed mb-4 ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-500'}`}>
                  Permanently close and delete your diagnostic history, wallet funds, and linked biometric data.
                </p>
              </div>

              <button
                onClick={() => setShowDeleteModal(true)}
                className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  isObsidian 
                    ? 'bg-red-950/40 border border-red-900/60 hover:bg-red-900/30 text-red-400 shadow-sm' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                <Trash2 className="w-4 h-4" /> Request Account Deletion
              </button>
            </div>

          </div>

          {/* ────────────────── RIGHT COLUMN: PANELS & GRID ────────────────── */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Obsidian Signature Pass VIP Command Center */}
            {userdata?.subscription?.plan === 'Obsidian' && userdata?.subscription?.status === 'Active' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[2.5rem] p-8 bg-gradient-to-b from-[#0d0d0d] via-[#1a140d] to-[#050505] border border-[#D4AF37]/35 shadow-[0_0_50px_rgba(212,175,55,0.08)] text-white space-y-8"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#D4AF37]/10">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#E6C97A] text-[10px] font-black uppercase tracking-wider border border-[#D4AF37]/20">
                      <Sparkles size={12} className="animate-pulse text-[#E6C97A]" /> Elite Signature Pass Active
                    </span>
                    <h3 className="text-2xl font-serif font-black mt-2 bg-gradient-to-r from-white via-[#F5F2EA] to-[#E6C97A] bg-clip-text text-transparent">
                      Obsidian VIP Command Center
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-[10px] text-[#8A8A8A] font-bold uppercase tracking-wider">Interest-Free Credit Line</p>
                      <p className="text-sm font-black text-[#E6C97A]">₹{overdraft?.available !== undefined ? overdraft.available : 50000} / ₹{overdraft?.limit || 50000} Available</p>
                    </div>
                    <div className="p-3 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20 text-[#E6C97A]">
                      <Zap size={20} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* VCO Concierge Card */}
                  <div className="bg-[#050505]/60 rounded-[2rem] p-6 border border-[#D4AF37]/15 flex flex-col justify-between space-y-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={vco?.photo || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200"}
                        alt="VCO Photo"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37]/35 shadow-sm shadow-[#D4AF37]/10"
                      />
                      <div>
                        <h4 className="font-black text-base text-[#F5F2EA]">{vco?.name || "Dr. Shruti Sen"}</h4>
                        <p className="text-xs text-[#E6C97A] font-bold uppercase tracking-wider">{vco?.title || "Dedicated Care Officer"}</p>
                        <p className="text-[10px] text-[#8A8A8A] font-medium mt-1 leading-snug">{vco?.bio || "Assigned critical care specialist for 24/7 hotline support."}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-[#D4AF37]/10 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <a
                          href={`tel:${vco?.hotline || "+919876543210"}`}
                          className="flex-1 py-3 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] hover:opacity-90 text-black rounded-xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#D4AF37]/10"
                        >
                          <Phone size={14} /> Direct Call
                        </a>
                        <a
                          href={`mailto:${vco?.email || "vco@pawvaidya.com"}`}
                          className="flex-1 py-3 bg-[#0d0d0d] hover:bg-[#121212] text-[#F5F2EA] rounded-xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all border border-[#D4AF37]/20"
                        >
                          <Mail size={14} /> Send Email
                        </a>
                      </div>
                      <button
                        onClick={() => {
                          setVcoBookingVisitType("Clinic Visit");
                          setVcoBookingIsStray(false);
                          setShowVcoBookingModal(true);
                        }}
                        className="w-full py-3 bg-gradient-to-r from-[#D4AF37]/25 to-[#8C6D23]/25 hover:from-[#D4AF37]/35 hover:to-[#8C6D23]/35 text-[#E6C97A] rounded-xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all border border-[#D4AF37]/30"
                      >
                        <Calendar size={14} /> Book VCO Consultation
                      </button>
                    </div>
                  </div>

                  {/* Mobile ICU Ambulance Dispatcher */}
                  <div className="bg-[#050505]/60 rounded-[2rem] p-6 border border-[#D4AF37]/15 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-black text-sm text-[#F5F2EA] uppercase tracking-wide">Mobile ICU Dispatch</h4>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          icuDispatch?.status === 'Dispatched' || icuDispatch?.status === 'En Route' || icuDispatch?.status === 'En Route (Nearby)'
                            ? 'bg-[#D4AF37]/10 text-[#E6C97A] border border-[#D4AF37]/25 animate-pulse'
                            : icuDispatch?.status === 'Arrived'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : icuDispatch?.status === 'Cancelled'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-[#0d0d0d] text-[#8A8A8A] border border-[#D4AF37]/15'
                        }`}>
                          {icuDispatch?.status || 'Idle'}
                        </span>
                      </div>
                      
                      {icuDispatch && icuDispatch.status !== 'Idle' && icuDispatch.status !== 'Cancelled' ? (
                        <div className="space-y-3">
                          <div className="space-y-2.5 text-xs text-[#F5F2EA]">
                            <div className="flex justify-between border-b border-[#D4AF37]/5 pb-1">
                              <span className="text-[#8A8A8A]">Ambulance No:</span>
                              <span className="font-bold font-mono text-[#F5F2EA]">{icuDispatch.ambulanceNumber}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#D4AF37]/5 pb-1">
                              <span className="text-[#8A8A8A]">Paramedic:</span>
                              <span className="font-bold text-[#F5F2EA]">{icuDispatch.driverName}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#D4AF37]/5 pb-1">
                              <span className="text-[#8A8A8A]">Estimated Arrival:</span>
                              <span className="font-bold text-[#E6C97A] animate-pulse">{icuDispatch.etaMinutes} mins</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#8A8A8A]">Urgent Dispatch For:</span>
                              <span className="font-bold text-[#F5F2EA]">{icuDispatch.petName}</span>
                            </div>
                          </div>

                          {/* Live Interactive Map */}
                          <div className="rounded-xl overflow-hidden border border-[#D4AF37]/20 h-40 relative">
                            <iframe
                              title="ICU Live Tracking"
                              width="100%"
                              height="100%"
                              style={{ border: 0, filter: 'sepia(0.3) hue-rotate(180deg) saturate(0.6) brightness(0.7)' }}
                              loading="lazy"
                              src="https://www.openstreetmap.org/export/embed.html?bbox=72.7,18.8,73.2,19.3&layer=mapnik"
                            />
                            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg border border-[#D4AF37]/30">
                              <span className="text-[9px] font-bold text-[#E6C97A] uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Live Tracking
                              </span>
                            </div>
                            {/* Animated ambulance indicator */}
                            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg border border-red-500/30">
                              <span className="text-[9px] font-bold text-red-400 flex items-center gap-1">
                                🚑 {icuDispatch?.etaMinutes > 0 ? `ETA ${icuDispatch.etaMinutes} min` : 'Arrived'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : icuDispatch?.status === 'Cancelled' ? (
                        <div className="text-center py-4">
                          <p className="text-xs text-red-400 font-bold">Dispatch was cancelled.</p>
                          <p className="text-[10px] text-[#8A8A8A] mt-1">You can re-dispatch anytime.</p>
                        </div>
                      ) : (
                        <p className="text-xs text-[#8A8A8A] leading-relaxed">
                          24/7 Mobile Intensive Care Unit dispatch is pre-approved for your account. Immediate on-road stabilization.
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {(!icuDispatch || icuDispatch.status === 'Idle' || icuDispatch.status === 'Arrived' || icuDispatch.status === 'Cancelled') && (
                        <button
                          onClick={() => handleDispatchIcu(userdata.full_address, userPets?.[0]?.name || "My Pet", "High")}
                          className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg ${
                            isObsidian 
                              ? 'bg-gradient-to-r from-red-600 to-red-800 text-white hover:opacity-90 shadow-red-950/20' 
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          <ShieldAlert size={14} /> Dispatch Emergency ICU
                        </button>
                      )}

                      {icuDispatch && icuDispatch.status !== 'Idle' && icuDispatch.status !== 'Arrived' && icuDispatch.status !== 'Cancelled' && (
                        <button
                          onClick={async () => {
                            try {
                              const { data } = await axios.post(`${backendurl}/api/user/obsidian/cancel-icu`, {}, { headers: { token } });
                              if (data.success) {
                                toast.success(data.message);
                                setIcuDispatch(data.dispatch);
                              } else {
                                toast.error(data.message);
                              }
                            } catch (error) {
                              toast.error(error.response?.data?.message || "Failed to cancel dispatch");
                            }
                          }}
                          className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        >
                          <XCircle size={14} /> Cancel Dispatch
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interest-Free Credit Line Dashboard Card */}
                <div className="bg-[#050505]/60 rounded-[2.5rem] p-6 border border-[#D4AF37]/15 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-black text-sm text-[#F5F2EA] uppercase tracking-wide flex items-center gap-2">
                        <CreditCard size={16} className="text-[#E6C97A]" /> Obsidian Interest-Free Credit Line
                      </h4>
                      <p className="text-xs text-[#8A8A8A] mt-1">
                        Enjoy interest-free short term liquidity. All transactions must be repaid within 7 days.
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      creditDetails?.status === 'Active' 
                        ? 'bg-[#D4AF37]/10 text-[#E6C97A] border-[#D4AF37]/25' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${creditDetails?.status === 'Active' ? 'bg-[#E6C97A] animate-pulse' : 'bg-red-500 animate-pulse'}`} />
                      Status: {creditDetails?.status || 'Active'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Progress Bar & Balances */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[#B0B0B0]">
                        <span>Spent: ₹{creditDetails?.spent || 0}</span>
                        <span>Available: ₹{creditDetails?.available !== undefined ? creditDetails.available : 50000}</span>
                      </div>
                      
                      <div className="w-full rounded-full h-3 overflow-hidden p-0.5 border border-[#D4AF37]/15 bg-[#050505] shadow-inner">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#8C6D23]"
                          style={{
                            width: `${Math.min(100, (((creditDetails?.spent || 0) / (creditDetails?.limit || 50000)) * 100))}%`
                          }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#8A8A8A]">Total Limit: ₹{creditDetails?.limit || 50000}</span>
                        {creditDetails?.spent > 0 ? (
                          <span className="text-red-400 font-bold uppercase tracking-wide flex items-center gap-1">
                            <Clock size={12} /> Due: {new Date(creditDetails.repaymentDeadline).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold uppercase tracking-wide">✅ No outstanding balance</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row md:flex-col gap-2.5">
                      <button
                        onClick={() => setShowSpendModal(true)}
                        disabled={creditDetails?.status !== 'Active'}
                        className="py-3 px-4 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] hover:opacity-90 disabled:opacity-50 text-black rounded-xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#D4AF37]/10"
                      >
                        <Zap size={14} /> Spend Credit
                      </button>
                      
                      <button
                        onClick={() => {
                          setRepayAmountInput(Math.min(creditDetails?.spent || 0, userdata?.pawWallet || 0).toString());
                          setShowRepayModal(true);
                        }}
                        disabled={repaying || !creditDetails?.spent}
                        className="py-3 px-4 bg-[#0d0d0d] hover:bg-[#121212] disabled:opacity-50 text-[#F5F2EA] rounded-xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all border border-[#D4AF37]/20"
                      >
                        {repaying ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        Repay Dues
                      </button>
                    </div>
                  </div>
                </div>

                {/* Multi-Modal Vision AI Diagnostics */}
                <div className="bg-[#050505]/60 rounded-[2.5rem] p-6 border border-[#D4AF37]/15 space-y-6">
                  <div>
                    <h4 className="font-black text-sm text-[#F5F2EA] uppercase tracking-wide flex items-center gap-2">
                      <BrainCircuit size={16} className="text-[#E6C97A]" /> Multi-Modal Vision AI Scanner
                    </h4>
                    <p className="text-xs text-[#8A8A8A] mt-1">
                      Upload photos of wounds, skin problems, or behavioral anomalies to run immediate deep-learning diagnostics.
                    </p>
                  </div>

                  <form onSubmit={handleVisionDiagnostic} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div className="space-y-3">
                      <textarea
                        className={`w-full bg-neutral-950 border rounded-2xl p-4 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none resize-none h-24 ${
                          isObsidian ? 'border-[#D4AF37]/15 focus:border-[#D4AF37]/40' : 'border-neutral-800 focus:border-purple-500/50'
                        }`}
                        placeholder="Describe observations, e.g. red circular rash on hind leg, scratching frequently, dry skin patches..."
                        value={symptomText}
                        onChange={(e) => setSymptomText(e.target.value)}
                      />
                      <div className="flex items-center gap-3">
                        <label className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border border-dashed cursor-pointer text-[10px] uppercase font-bold text-neutral-400 transition-all ${
                          isObsidian ? 'border-[#D4AF37]/15 hover:border-[#D4AF37]/45' : 'border-neutral-800 hover:border-purple-500/30'
                        }`}>
                          <Camera size={14} />
                          {visionImage ? visionImage.name.slice(0, 15) + "..." : "Upload Photo"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setVisionImage(e.target.files?.[0])}
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={analyzingVision}
                          className="py-3 px-6 bg-[#5A4035] hover:bg-[#725447] text-[#D4AF37] rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          {analyzingVision ? <Loader2 size={12} className={`animate-spin ${isObsidian ? 'text-[#D4AF37]' : 'text-purple-400'}`} /> : "Run AI Scan"}
                        </button>
                      </div>
                    </div>

                    <div className={`bg-neutral-950 rounded-2xl p-4 min-h-[148px] flex flex-col justify-center border ${isObsidian ? 'border-[#D4AF37]/15' : 'border-neutral-800/80'}`}>
                      {visionAnalysis ? (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-100">{visionAnalysis.diagnosis}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              visionAnalysis.severity === 'High' || visionAnalysis.severity === 'Critical' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>{visionAnalysis.severity}</span>
                          </div>
                          <p className="text-neutral-400 text-[11px] leading-relaxed">{visionAnalysis.actionPlan}</p>
                          <div className={`pt-2 border-t flex items-center justify-between text-[10px] ${isObsidian ? 'border-[#D4AF37]/10 text-[#E6C97A]' : 'border-neutral-800/50 text-purple-400'}`}>
                            <span>Confidence: {visionAnalysis.confidenceScore}</span>
                            <span>{visionAnalysis.hotlineRecommendation}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-1.5 py-4">
                          <Sparkles size={20} className="mx-auto text-neutral-700" />
                          <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider">Analysis Result Panel</p>
                          <p className="text-[10px] text-neutral-600">Submit a description and skin photo to generate report.</p>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ROW 1: 5 QUICK STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Status", value: editedData.isBanned ? "Restricted" : "Verified", icon: ShieldCheck, color: isObsidian ? "text-[#E6C97A]" : "text-emerald-600", bg: isObsidian ? "bg-[#D4AF37]/10" : "bg-emerald-50" },
                { label: "Total Pets", value: `${userPets?.length || 0} Pets`, icon: PawPrint, color: isObsidian ? "text-[#E6C97A]" : "text-amber-600", bg: isObsidian ? "bg-[#D4AF37]/10" : "bg-amber-50" },
                { label: "Paw Wallet", value: `₹${userdata.pawWallet || 0}`, icon: Zap, color: isObsidian ? "text-[#E6C97A]" : "text-purple-600", bg: isObsidian ? "bg-[#D4AF37]/10" : "bg-purple-50" },
                { label: "Paw Points", value: `${userdata.pawpoints || 0} PTS`, icon: Trophy, color: isObsidian ? "text-[#E6C97A]" : "text-blue-600", bg: isObsidian ? "bg-[#D4AF37]/10" : "bg-blue-50" },
                { label: "Video Calls", value: `${remainingVideoCalls} Left`, icon: Video, color: isObsidian ? "text-[#E6C97A]" : "text-rose-600", bg: isObsidian ? "bg-[#D4AF37]/10" : "bg-rose-50" }
              ].map((stat, idx) => (
                <div key={idx} className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between h-28 transition-all duration-300 ${
                  isObsidian 
                    ? 'bg-[#0d0d0d] border-[#D4AF37]/15 hover:border-[#D4AF37]/45' 
                    : 'bg-white border-neutral-100 hover:shadow-md'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-400'}`}>{stat.label}</span>
                    <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color}`}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <span className={`text-base font-black ${isObsidian ? 'text-[#F5F2EA]' : 'text-neutral-800'}`}>{stat.value}</span>
                </div>
              ))}
            </div>

            {/* ROW 2: PROFILE COMPLETENESS */}
            <div className={`rounded-3xl p-6 shadow-sm overflow-hidden flex items-center justify-between border transition-all duration-300 ${
              isObsidian 
                ? 'bg-[#0d0d0d] border-[#D4AF37]/15' 
                : 'bg-white border-neutral-100'
            }`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${isObsidian ? 'bg-[#D4AF37]/10 text-[#E6C97A]' : 'bg-purple-50 text-[#8c52ff]'}`}>
                    <PawPrint className="w-4 h-4" />
                  </div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isObsidian ? 'text-[#F5F2EA]' : 'text-neutral-800'}`}>Profile Completeness</h3>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`flex-1 rounded-full h-4 overflow-hidden p-0.5 border shadow-inner relative ${
                    isObsidian ? 'bg-[#050505] border-[#D4AF37]/15' : 'bg-neutral-100 border-neutral-200/50'
                  }`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${profileCompleteness}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        isObsidian ? 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23]' : 'bg-gradient-to-r from-violet-500 to-indigo-500'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${
                    isObsidian 
                      ? 'text-[#E6C97A] bg-[#D4AF37]/10 border-[#D4AF37]/20' 
                      : 'text-purple-700 bg-purple-50 border-purple-100'
                  }`}>{profileCompleteness}%</span>
                </div>
              </div>
              
              <div className="w-24 h-24 -mr-4 -mb-6 flex-shrink-0 relative self-end">
                <img src="/completeness_dog.png" alt="peaking puppy" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* ROW 3: PROFILE DETAILS */}
            <div className={`rounded-3xl p-6 shadow-sm border transition-all duration-300 ${
              isObsidian 
                ? 'bg-[#0d0d0d] border-[#D4AF37]/15' 
                : 'bg-white border-neutral-100'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${isObsidian ? 'bg-[#D4AF37]/10 text-[#E6C97A]' : 'bg-purple-50 text-[#8c52ff]'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className={`text-base font-black uppercase tracking-tight ${isObsidian ? 'text-[#F5F2EA]' : 'text-neutral-800'}`}>Profile Details</h3>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isEdit ? (
                    <>
                      <button
                        onClick={updateUserProfileData}
                        className={`px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center gap-1 ${
                          isObsidian 
                            ? 'bg-[#D4AF37] hover:bg-[#E6C97A] text-black shadow-[#D4AF37]/10' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className={`px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-xl border transition-all ${
                          isObsidian 
                            ? 'bg-[#121212] hover:bg-[#1c1c1c] text-[#8A8A8A] border-[#D4AF37]/15' 
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    !editedData.isBanned ? (
                      <button
                        onClick={() => setIsEdit(true)}
                        className={`px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95 ${
                          isObsidian 
                            ? 'bg-[#D4AF37] hover:bg-[#E6C97A] text-black shadow-sm shadow-[#D4AF37]/10' 
                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-purple-100'
                        }`}
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Profile
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-200 uppercase tracking-wider">
                        <Lock className="w-3.5 h-3.5" /> Profile Locked
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem
                  icon={Phone}
                  label="Contact"
                  value={editedData.phone}
                  isEdit={isEdit}
                  editComponent={
                    <input
                      type="text"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm text-neutral-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      value={editedData.phone || ""}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                    />
                  }
                />
                
                <InfoItem
                  icon={Mail}
                  label="Email"
                  value={editedData.email}
                  isEdit={isEdit}
                  editComponent={
                    <span className="text-sm font-semibold text-neutral-400 bg-neutral-100 px-4 py-2.5 rounded-xl border border-neutral-200 w-full block">
                      {editedData.email}
                    </span>
                  }
                />

                <InfoItem
                  icon={User}
                  label="Gender"
                  value={editedData.gender}
                  isEdit={isEdit}
                  editComponent={
                    <select
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm text-neutral-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      value={editedData.gender || ""}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  }
                />

                <InfoItem
                  icon={Calendar}
                  label="Birthday"
                  value={formatDate(editedData.dob)}
                  isEdit={isEdit}
                  editComponent={
                    <input
                      type="date"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm text-neutral-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      value={editedData.dob || ""}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                    />
                  }
                />

                <div className="md:col-span-2">
                  <InfoItem
                    icon={MapPin}
                    label="Address"
                    value={`${normalized.LOCATION}, ${normalized.LINE}`}
                    isEdit={isEdit}
                    editComponent={
                      <div className="grid grid-cols-2 gap-3 w-full">
                        <input
                          type="text"
                          className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm text-neutral-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                          value={normalized.LOCATION}
                          placeholder="State"
                          onChange={(e) => handleAddressChange("LOCATION", e.target.value)}
                        />
                        <input
                          type="text"
                          className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm text-neutral-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                          value={normalized.LINE}
                          placeholder="District"
                          onChange={(e) => handleAddressChange("LINE", e.target.value)}
                        />
                      </div>
                    }
                  />
                </div>
              </div>
            </div>

            {/* ROW 4: MY PET FAMILY + BIOMETRIC SHIELD */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* MY PET FAMILY (2/3 width) */}
              <div className={`rounded-3xl p-6 shadow-sm border flex flex-col justify-between transition-all duration-300 md:col-span-8 ${
                isObsidian 
                  ? 'bg-[#0d0d0d] border-[#D4AF37]/15' 
                  : 'bg-white border-neutral-100'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isObsidian ? 'bg-[#D4AF37]/10 text-[#E6C97A]' : 'bg-purple-50 text-[#8c52ff]'}`}>
                        <PawPrint className="w-4 h-4" />
                      </div>
                      <h3 className={`text-base font-black uppercase tracking-tight ${isObsidian ? 'text-[#F5F2EA]' : 'text-neutral-800'}`}>My Pet Family</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ml-1 ${
                        isObsidian ? 'bg-[#D4AF37]/10 text-[#E6C97A] border border-[#D4AF37]/20' : 'bg-purple-100 text-purple-700'
                      }`}>{userPets?.length || 0}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button className={`p-1.5 rounded-lg border transition-all ${
                        isObsidian 
                          ? 'border-[#D4AF37]/15 hover:bg-[#D4AF37]/10 text-[#E6C97A]' 
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-500'
                      }`}>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button className={`p-1.5 rounded-lg border transition-all ${
                        isObsidian 
                          ? 'border-[#D4AF37]/15 hover:bg-[#D4AF37]/10 text-[#E6C97A]' 
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-500'
                      }`}>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pet Family Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    {userPets && userPets.length > 0 ? (
                      userPets.map((pet, idx) => (
                        <div key={pet._id || idx} className={`rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all duration-300 border ${
                          isObsidian 
                            ? 'bg-[#050505] border-[#D4AF37]/15 hover:border-[#D4AF37]/45' 
                            : 'bg-white border-neutral-100 hover:shadow-md'
                        }`}>
                          <div>
                            <img src={pet.image || assets.upload_area} alt={pet.name} className={`w-full h-24 object-cover rounded-xl mb-3 ${
                              isObsidian ? 'bg-[#0d0d0d] border border-[#D4AF37]/10' : 'bg-neutral-50'
                            }`} />
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-1.5 inline-block border ${
                              isObsidian 
                                ? 'bg-[#D4AF37]/10 text-[#E6C97A] border-[#D4AF37]/20' 
                                : 'bg-blue-50 text-blue-600 border-blue-100/50'
                            }`}>
                              {pet.type || "Other"}
                            </span>
                            <h4 className={`text-sm font-bold ${isObsidian ? 'text-[#F5F2EA]' : 'text-neutral-800'}`}>{pet.name}</h4>
                            <div className={`grid grid-cols-2 gap-2 mt-2 pt-2 text-[10px] border-t ${
                              isObsidian ? 'border-white/5' : 'border-neutral-50'
                            }`}>
                              <div>
                                <p className={`uppercase font-bold tracking-wider ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-400'}`}>Breed</p>
                                <p className={`font-semibold truncate ${isObsidian ? 'text-[#B0B0B0]' : 'text-neutral-600'}`}>{pet.breed || "N/A"}</p>
                              </div>
                              <div>
                                <p className={`uppercase font-bold tracking-wider ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-400'}`}>Age/Sex</p>
                                <p className={`font-semibold truncate ${isObsidian ? 'text-[#B0B0B0]' : 'text-neutral-600'}`}>{pet.age}Y - {pet.gender || "M"}</p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedPetForID(pet)}
                            className={`w-full mt-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
                              isObsidian 
                                ? 'bg-[#0d0d0d] hover:bg-[#D4AF37]/10 text-[#E6C97A] border-[#D4AF37]/15' 
                                : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600'
                            }`}
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Official Pet ID
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className={`col-span-3 py-8 text-center text-xs font-semibold ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-400'}`}>
                        No pets registered yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Update Face Scan Button */}
                <button
                  onClick={() => setShowFaceAuth(true)}
                  className={`w-full mt-6 py-3 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 ${
                    isObsidian 
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black hover:opacity-95' 
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white'
                  }`}
                >
                  <Fingerprint className="w-4 h-4" /> Update Face Scan
                </button>
              </div>

              {/* BIOMETRIC SHIELD (1/3 width) */}
              <div className={`rounded-3xl p-6 shadow-lg flex flex-col justify-between h-[395px] relative overflow-hidden transition-all duration-300 md:col-span-4 ${
                isObsidian 
                  ? 'bg-gradient-to-br from-[#121212] via-[#090909] to-[#050505] border border-[#D4AF37]/25 text-[#F5F2EA] shadow-[#D4AF37]/5' 
                  : 'bg-gradient-to-br from-[#6c33e8] to-[#4c1ba6] text-white'
              }`}>
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className={`w-4 h-4 ${isObsidian ? 'text-[#E6C97A]' : 'text-purple-200'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isObsidian ? 'text-[#E6C97A]' : 'text-purple-200'}`}>Biometric Shield</span>
                  </div>
                  <h4 className={`text-xs font-black uppercase tracking-widest ${isObsidian ? 'text-[#D4AF37]' : 'text-emerald-300'}`}>
                    {userdata.isFaceRegistered ? "Active & Encrypted" : "Security Inactive"}
                  </h4>
                </div>

                {/* Central orbit/spinning elements */}
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center my-2">
                  <div className={`absolute inset-0 rounded-full border animate-spin-slow ${isObsidian ? 'border-[#D4AF37]/10' : 'border-white/10'}`} />
                  <div className={`absolute inset-4 rounded-full border border-dashed animate-[spin_10s_linear_infinite] ${isObsidian ? 'border-[#D4AF37]/15' : 'border-white/20'}`} />
                  <div className={`absolute inset-8 rounded-full border animate-[spin_6s_linear_infinite_reverse] ${isObsidian ? 'border-[#D4AF37]/20' : 'border-white/30'}`} />
                  
                  <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md border shadow-lg ${
                    isObsidian 
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/35 shadow-[#D4AF37]/10 text-[#E6C97A]' 
                      : 'bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.25)] text-white'
                  }`}>
                    <Shield className="w-8 h-8 fill-current/10" />
                    <PawPrint className={`w-4 h-4 absolute ${isObsidian ? 'text-[#D4AF37]' : 'text-purple-300'}`} />
                  </div>
                </div>

                <p className={`text-[11px] text-center leading-relaxed mb-4 ${isObsidian ? 'text-[#B0B0B0]' : 'text-purple-100'}`}>
                  {userdata.isFaceRegistered
                    ? "Your profile and diagnostic reports are fully secured via active on-device biometric scanning."
                    : "Setup face authentication to guarantee protection of your pet health vault and transactional history."}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFaceAuth(true)}
                    className={`flex-1 py-3 font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 rounded-2xl ${
                      isObsidian 
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black hover:opacity-95' 
                        : 'bg-white text-indigo-700 hover:bg-neutral-50'
                    }`}
                  >
                    <Fingerprint className="w-4 h-4" /> Scan Now
                  </button>
                  <button
                    onClick={() => setShowFaceAuth(true)}
                    className={`p-3 border rounded-2xl transition-all ${
                      isObsidian 
                        ? 'bg-[#121212] hover:bg-[#1a1a1a] border-[#D4AF37]/20 text-[#E6C97A]' 
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* ROW 5: 2 COLUMNS FOOTER GRID */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Pet Health Tip */}
              <div className={`rounded-3xl p-6 shadow-sm border flex flex-col justify-between h-[390px] transition-all duration-300 md:col-span-6 ${
                isObsidian 
                  ? 'bg-[#0d0d0d] border-[#D4AF37]/15' 
                  : 'bg-white border-neutral-100'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isObsidian ? 'text-[#F5F2EA]' : 'text-neutral-800'}`}>
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" /> Pet Health Tip
                    </h4>
                    <button
                      onClick={() => setupDailyContentGeneration(true)}
                      disabled={isRefreshingTip}
                      className={`p-1.5 rounded-lg border transition-all active:scale-90 ${
                        isObsidian 
                          ? 'border-[#D4AF37]/15 hover:bg-[#D4AF37]/10 text-[#E6C97A]' 
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-400'
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingTip ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  <div className={`p-4 rounded-2xl border shadow-inner italic text-xs leading-relaxed font-medium min-h-[200px] flex items-center justify-center text-center ${
                    isObsidian 
                      ? 'bg-[#050505] border-[#D4AF37]/10 text-[#B0B0B0]' 
                      : 'bg-neutral-50 border-neutral-100 text-neutral-600'
                  }`}>
                    "{dailyQuote}"
                  </div>
                </div>

                <p className={`text-center text-[7px] font-black uppercase tracking-widest mt-4 ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-300'}`}>Powered by Gemini AI</p>
              </div>

              {/* Video Consultations */}
              <div className={`rounded-3xl p-6 shadow-sm border flex flex-col justify-between h-[390px] relative overflow-hidden transition-all duration-300 md:col-span-6 ${
                isObsidian 
                  ? 'bg-[#0d0d0d] border-[#D4AF37]/15' 
                  : 'bg-white border-neutral-100'
              }`}>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`p-1.5 rounded-lg ${isObsidian ? 'bg-[#D4AF37]/10 text-[#E6C97A]' : 'bg-pink-50 text-pink-500'}`}>
                      <Video className="w-4 h-4" />
                    </div>
                    <h3 className={`text-xs font-bold uppercase tracking-widest ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-400'}`}>Video Consultations</h3>
                  </div>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-4xl font-black ${isObsidian ? 'text-[#F5F2EA]' : 'text-neutral-800'}`}>
                      {userdata?.subscription?.plan === "Platinum" || userdata?.subscription?.plan === "Gold"
                        ? (userdata.subscription.plan === "Gold" ? 10 : 25) - (userdata.videoCallsUsed || 0)
                        : 25}
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-400'}`}>Left</span>
                  </div>

                  <div className={`w-full rounded-full h-2.5 overflow-hidden p-0.5 border mb-2 shadow-inner ${
                    isObsidian ? 'bg-[#050505] border-[#D4AF37]/10' : 'bg-neutral-100 border-neutral-200/50'
                  }`}>
                    <div
                      className={`h-full rounded-full ${
                        isObsidian ? 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23]' : 'bg-gradient-to-r from-pink-500 to-rose-400'
                      }`}
                      style={{
                        width: `${
                          (((userdata?.subscription?.plan === "Platinum" || userdata?.subscription?.plan === "Gold"
                            ? (userdata.subscription.plan === "Gold" ? 10 : 25) - (userdata.videoCallsUsed || 0)
                            : 25) /
                            (userdata?.subscription?.plan === "Gold" ? 10 : 25 || 25)) *
                          100) || 100
                        }%`,
                      }}
                    />
                  </div>
                  <p className={`text-[9px] font-bold uppercase tracking-wider ${isObsidian ? 'text-[#8A8A8A]' : 'text-neutral-400'}`}>
                    Allowance: {userdata?.subscription?.plan === "Gold" ? 10 : 25} Monthly Credits
                  </p>
                  <button
                    onClick={() => navigate("/doctors")}
                    className={`w-full mt-3 py-2 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                      isObsidian 
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black hover:opacity-95' 
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" /> Start Consult
                  </button>
                </div>

                <div className="w-full h-32 mt-2 flex justify-center items-end">
                  <img src="/video_doctor.png" alt="doctor consulting" className="max-h-full object-contain" />
                </div>
              </div>

            </div>

            {/* ROW 6: BETA ACCESS PANEL */}
            <div className={`rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 ${
              isObsidian 
                ? 'bg-gradient-to-br from-[#121212] via-[#090909] to-[#020202] border border-[#D4AF37]/20 shadow-[0_0_40px_rgba(212,175,55,0.06)]' 
                : 'bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800'
            }`}>
              {/* Decorative blobs */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-sm ${
                      isObsidian ? 'bg-[#D4AF37]/10 text-[#E6C97A] border border-[#D4AF37]/20' : 'bg-white/20 text-white'
                    }`}>
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-base font-black uppercase tracking-tight ${isObsidian ? 'text-[#F5F2EA]' : 'text-white'}`}>Beta Access Program</h3>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse ${
                          isObsidian ? 'bg-[#D4AF37]/10 text-[#E6C97A] border border-[#D4AF37]/25' : 'bg-amber-400 text-amber-900'
                        }`}>Early Access</span>
                      </div>
                      <p className={`text-[11px] mt-0.5 ${isObsidian ? 'text-[#8A8A8A]' : 'text-violet-200'}`}>Apply to test upcoming features before public launch</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/beta-access')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all backdrop-blur-sm ${
                      isObsidian 
                        ? 'bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/25 text-[#E6C97A]' 
                        : 'bg-white/15 hover:bg-white/25 border border-white/20 text-white'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Full Hub
                  </button>
                </div>

                {betaFeatures.length === 0 ? (
                  <div className={`text-center py-8 text-sm font-semibold ${isObsidian ? 'text-[#8A8A8A]' : 'text-violet-300'}`}>
                    No beta features open for applications right now. Check back soon!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {betaFeatures.slice(0, 3).map(f => {
                      const myApp = getMyBetaApp(f._id);
                      const isExpandedCard = betaExpanded === f._id;
                      const seatsFull = f.currentTesters >= f.maxTesters;

                      return (
                        <div key={f._id} className={`backdrop-blur-sm border rounded-2xl p-4 flex flex-col gap-3 transition-all ${
                          isObsidian 
                            ? 'bg-[#050505]/60 hover:bg-[#050505]/80 border-[#D4AF37]/15 hover:border-[#D4AF37]/35' 
                            : 'bg-white/10 border-white/20 hover:bg-white/15'
                        }`}>
                          <div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isObsidian ? 'text-[#E6C97A]' : 'text-violet-300'}`}>{f.category}</span>
                            <h4 className={`text-sm font-black mt-0.5 ${isObsidian ? 'text-[#F5F2EA]' : 'text-white'}`}>{f.name}</h4>
                            <p className={`text-[11px] mt-1 leading-relaxed line-clamp-2 ${isObsidian ? 'text-[#8A8A8A]' : 'text-violet-200'}`}>{f.description}</p>
                          </div>

                          {/* Seat bar */}
                          <div>
                            <div className={`flex justify-between text-[9px] font-bold mb-1 ${isObsidian ? 'text-[#8A8A8A]' : 'text-violet-300'}`}>
                              <span>{f.currentTesters} testers</span>
                              <span>{f.maxTesters} seats</span>
                            </div>
                            <div className={`h-1 rounded-full overflow-hidden ${isObsidian ? 'bg-[#0d0d0d]' : 'bg-white/20'}`}>
                              <div className={`h-full rounded-full ${
                                isObsidian ? 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23]' : 'bg-gradient-to-r from-emerald-400 to-teal-400'
                              }`} style={{ width: `${Math.min(100,(f.currentTesters/f.maxTesters)*100)}%` }} />
                            </div>
                          </div>

                          {/* CTA */}
                          {myApp ? (
                            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border ${
                              myApp.status === 'approved' 
                                ? (isObsidian ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30') 
                                : myApp.status === 'pending'  
                                ? (isObsidian ? 'bg-amber-500/10 text-[#E6C97A] border-[#D4AF37]/25' : 'bg-amber-500/20 text-amber-300 border-amber-400/30') 
                                : 'bg-white/10 text-white/50 border-white/10'
                            }`}>
                              {myApp.status === 'approved' ? <CheckCircle className="w-3.5 h-3.5" /> : myApp.status === 'pending' ? <Clock className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                              {myApp.status === 'approved' ? 'Access Granted ✓' : myApp.status === 'pending' ? 'Under Review' : 'Not Approved'}
                            </div>
                          ) : seatsFull ? (
                            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#121212] text-[#8A8A8A] border border-white/5">
                              <Lock className="w-3.5 h-3.5" /> Seats Full
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setBetaExpanded(isExpandedCard ? null : f._id)}
                                className={`flex items-center justify-center gap-1.5 w-full py-2 font-black text-xs rounded-xl transition-all active:scale-95 shadow ${
                                  isObsidian 
                                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black' 
                                    : 'bg-white text-violet-700 hover:bg-violet-50'
                                }`}
                              >
                                <Rocket className="w-3.5 h-3.5" />
                                {isExpandedCard ? 'Cancel' : 'Apply Now'}
                              </button>

                              {isExpandedCard && (
                                <div className="space-y-2">
                                  <textarea
                                    value={betaMotivation[f._id] || ''}
                                    onChange={e => setBetaMotivation(p => ({ ...p, [f._id]: e.target.value }))}
                                    rows={3}
                                    placeholder="Why do you want early access? (min 20 chars)"
                                    className={`w-full px-3 py-2 text-xs border rounded-xl resize-none outline-none focus:ring-2 placeholder:text-slate-400 ${
                                      isObsidian 
                                        ? 'bg-[#0d0d0d] text-[#F5F2EA] border-[#D4AF37]/20 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40' 
                                        : 'bg-white/90 text-slate-800 border-white/30 focus:ring-white/40'
                                    }`}
                                  />
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[9px] font-bold ${ (betaMotivation[f._id]?.length||0) < 20 ? 'text-rose-300' : 'text-emerald-300'}`}>
                                      {betaMotivation[f._id]?.length || 0}/600
                                    </span>
                                    <button
                                      onClick={() => handleBetaApply(f._id, f.name)}
                                      disabled={betaSubmitting === f._id || (betaMotivation[f._id]?.length||0) < 20}
                                      className={`flex items-center gap-1 px-4 py-1.5 font-bold text-xs rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 ${
                                        isObsidian 
                                          ? 'bg-[#D4AF37] hover:bg-[#E6C97A] text-black shadow-[#D4AF37]/10' 
                                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'
                                      }`}
                                    >
                                      <Send className="w-3 h-3" />
                                      {betaSubmitting === f._id ? 'Sending...' : 'Submit'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {betaFeatures.length > 3 && (
                  <div className="mt-4 text-center">
                    <button onClick={() => navigate('/beta-access')} className={`text-xs font-bold underline underline-offset-2 transition-colors ${
                      isObsidian ? 'text-[#E6C97A] hover:text-[#D4AF37]' : 'text-violet-300 hover:text-white'
                    }`}>
                      View all {betaFeatures.length} beta features →
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default MyProfile;
