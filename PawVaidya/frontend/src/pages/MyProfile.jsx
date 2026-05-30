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
  ExternalLink
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AnimalHealthChatbot from "../components/AnimalHealthChatbot";
import FaceAuth from "../components/FaceAuth";
import PetIDCard from "../components/PetIDCard";

// ─── Sub-Components ──────────────────────────────────────────────────

const InfoItem = ({ icon: Icon, label, value, editComponent, isEdit }) => {
  return (
    <div className="flex items-start p-4 bg-white/80 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="p-2.5 rounded-xl bg-purple-50 mr-4 text-[#8c52ff]">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mb-0.5">{label}</p>
        <div>
          {isEdit ? (
            editComponent
          ) : (
            <p className="font-bold text-neutral-700 text-[14px] leading-relaxed truncate">
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
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center ${isSubmitting || !reason.trim()
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
  const remainingVideoCalls = userdata?.subscription?.plan === "Platinum" || userdata?.subscription?.plan === "Gold"
    ? Math.max(0, (userdata.subscription.plan === "Gold" ? 10 : 25) - (userdata.videoCallsUsed || 0))
    : 25;

  return (
    <div className="min-h-screen bg-[#f2e4c6] py-12 px-4 md:px-8 relative overflow-hidden font-sans">
      
      {/* Decorative ambient elements */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 right-20 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

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
        </AnimatePresence>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ────────────────── LEFT COLUMN: PROFILE & ACCOUNT SETTINGS ────────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-6 items-stretch lg:self-start">
            
            {/* Profile Identity Card */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-neutral-100 overflow-hidden relative pb-8 flex flex-col items-center h-fit">
              
              {/* Header Curve Banner */}
              <div className="w-full h-36 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 relative rounded-t-[2.5rem]" />
              
              {/* Profile Avatar Overlapping Wrapper */}
              <div className="relative -mt-16 flex flex-col items-center z-10">
                
                {/* Crown subscription badge */}
                {userdata?.subscription?.status === "Active" && userdata.subscription.plan !== "None" && (
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className="absolute -top-3 -left-3 bg-white p-2 rounded-2xl shadow-md border border-amber-300 z-20 flex items-center justify-center cursor-pointer"
                    onClick={() => navigate("/subscription")}
                    title={`${userdata.subscription.plan} Tier`}
                  >
                    <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
                  </motion.div>
                )}

                {/* Verified Badge */}
                {!editedData.isBanned && (
                  <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-white shadow-sm z-20">
                    <CheckCircle className="w-3.5 h-3.5 fill-white text-emerald-500" />
                  </div>
                )}

                {/* Main profile picture */}
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-neutral-100 group relative">
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
              <h2 className="text-xl font-black text-neutral-800 mt-4 text-center px-4 truncate max-w-full">
                {isEdit ? (
                  <input
                    type="text"
                    className="bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-xl px-3 py-1.5 text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 max-w-[200px]"
                    value={editedData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                ) : (
                  userdata.name
                )}
              </h2>

              {userdata?.subscription?.plan && userdata.subscription.plan !== "None" && (
                <div className="mt-2 px-3 py-1 bg-purple-100 text-purple-700 text-[9px] font-black uppercase tracking-wider rounded-full border border-purple-200">
                  {userdata.subscription.plan} Tier
                </div>
              )}

              {userdata?.pawCode && (
                <div
                  onClick={() => {
                    navigator.clipboard.writeText(userdata.pawCode);
                    toast.success("Referral Paw Code copied!");
                  }}
                  className="mt-3 flex items-center gap-1 px-3 py-1 bg-neutral-50 hover:bg-neutral-100 text-neutral-500 text-[10px] font-mono rounded-lg border border-neutral-200 cursor-pointer transition-all active:scale-95"
                  title="Click to copy Paw Code"
                >
                  <Gift className="w-3.5 h-3.5 text-purple-500" />
                  <span>PAW CODE: </span>
                  <span className="font-bold text-neutral-700">{userdata.pawCode}</span>
                </div>
              )}

              <div className="mt-4 flex items-center gap-1.5 text-xs text-neutral-500 px-4 max-w-full">
                <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                <span className="truncate">{editedData.email}</span>
              </div>

              {userPets && userPets.length > 0 && (
                <button
                  onClick={() => setSelectedPetForID(userPets[0])}
                  className="mt-6 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" /> Premium Pet ID
                </button>
              )}

              {/* Next Appointment or Book Appointment Widget */}
              {nextAppointment ? (
                <div className="mt-6 w-[88%] bg-purple-50/70 border border-purple-100 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-purple-700">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Next Appointment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={nextAppointment.docData?.image || assets.profile_pic}
                      alt="Doctor"
                      className="w-10 h-10 rounded-full object-cover border border-purple-200"
                    />
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-neutral-800 truncate">{nextAppointment.docData?.name || "Doctor"}</h5>
                      <p className="text-[10px] text-neutral-500 truncate">{nextAppointment.docData?.speciality || "General Vet"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-neutral-600 font-bold bg-white px-2.5 py-1.5 rounded-xl border border-neutral-100">
                    <span>{nextAppointment.slotDate ? nextAppointment.slotDate.replaceAll("_", "/") : ""}</span>
                    <span className="text-purple-600 font-black">{nextAppointment.slotTime}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-6 w-[88%] bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex flex-col items-center text-center gap-1.5">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-wider">No Upcoming Visits</h5>
                  <p className="text-[9px] text-neutral-500 leading-normal">Keep your pet's health checked. Book a video consultation today.</p>
                  <button
                    onClick={() => navigate("/doctors")}
                    className="mt-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all active:scale-95"
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
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-neutral-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-500" /> Linked Accounts
              </h4>
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-2xl border border-neutral-100 shadow-inner">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-700">Google</p>
                    <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                      {userdata.isGoogleConnected ? "Connected" : "Not Connected"}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleToggleSocialConnection('google')}
                  disabled={isProcessingSocial !== null}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm shrink-0 min-w-[76px] flex items-center justify-center ${
                    userdata.isGoogleConnected
                      ? "bg-neutral-100 hover:bg-red-50 text-neutral-500 hover:text-red-500 border border-neutral-200"
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
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-neutral-100 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800 mb-3 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  {userdata?.subscription?.plan && userdata.subscription.plan !== "None" ? `${userdata.subscription.plan} Membership` : "Platinum Membership"}
                </h4>
                
                <p className="text-[11px] text-neutral-500 leading-relaxed mb-4">
                  Enjoy unlimited online pet consultations, 24/7 priority support, smart health tracking, and free shipping on prescriptions.
                </p>

                <div className="mt-3">
                  <p className="text-[9px] text-neutral-400 font-black uppercase tracking-wider">Expiry Information</p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-neutral-600">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{userdata.subscription?.expiryDate ? formatDate(userdata.subscription.expiryDate) : "June 6, 2026"}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/subscription")}
                className="w-full mt-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1 active:scale-95"
              >
                Manage Membership <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50/50 rounded-[2rem] p-6 shadow-sm border border-red-100 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-red-600 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" /> Danger Zone
                </h4>
                <p className="text-[10px] text-neutral-500 leading-relaxed mb-4">
                  Permanently close and delete your diagnostic history, wallet funds, and linked biometric data.
                </p>
              </div>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-4 h-4" /> Request Account Deletion
              </button>
            </div>

          </div>

          {/* ────────────────── RIGHT COLUMN: PANELS & GRID ────────────────── */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* ROW 1: 5 QUICK STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Status", value: editedData.isBanned ? "Restricted" : "Verified", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Total Pets", value: `${userPets?.length || 0} Pets`, icon: PawPrint, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Paw Wallet", value: `₹${userdata.pawWallet || 0}`, icon: Zap, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Paw Points", value: `${userdata.pawpoints || 0} PTS`, icon: Trophy, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Video Calls", value: `${remainingVideoCalls} Left`, icon: Video, color: "text-rose-600", bg: "bg-rose-50" }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{stat.label}</span>
                    <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color}`}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-base font-black text-neutral-800">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* ROW 2: PROFILE COMPLETENESS */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 overflow-hidden flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-purple-50 rounded-lg text-[#8c52ff]">
                    <PawPrint className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Profile Completeness</h3>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-neutral-100 rounded-full h-4 overflow-hidden p-0.5 border border-neutral-200/50 shadow-inner relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${profileCompleteness}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">{profileCompleteness}%</span>
                </div>
              </div>
              
              <div className="w-24 h-24 -mr-4 -mb-6 flex-shrink-0 relative self-end">
                <img src="/completeness_dog.png" alt="peaking puppy" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* ROW 3: PROFILE DETAILS */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-[#8c52ff] rounded-xl">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-neutral-800 uppercase tracking-tight">Profile Details</h3>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isEdit ? (
                    <>
                      <button
                        onClick={updateUserProfileData}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold text-xs uppercase tracking-wider rounded-xl border border-neutral-200 transition-all"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    !editedData.isBanned ? (
                      <button
                        onClick={() => setIsEdit(true)}
                        className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center gap-1.5"
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
              <div className="md:col-span-8 bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-50 text-[#8c52ff] rounded-lg">
                        <PawPrint className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-black text-neutral-800 uppercase tracking-tight">My Pet Family</h3>
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold ml-1">{userPets?.length || 0}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-500 transition-all">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-500 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pet Family Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    {userPets && userPets.length > 0 ? (
                      userPets.map((pet, idx) => (
                        <div key={pet._id || idx} className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
                          <div>
                            <img src={pet.image || assets.upload_area} alt={pet.name} className="w-full h-24 object-cover rounded-xl mb-3 bg-neutral-50" />
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100/50 mb-1.5 inline-block">
                              {pet.type || "Other"}
                            </span>
                            <h4 className="text-sm font-bold text-neutral-800">{pet.name}</h4>
                            <div className="grid grid-cols-2 gap-2 mt-2 border-t border-neutral-50 pt-2 text-[10px]">
                              <div>
                                <p className="text-neutral-400 uppercase font-bold tracking-wider">Breed</p>
                                <p className="font-semibold text-neutral-600 truncate">{pet.breed || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-neutral-400 uppercase font-bold tracking-wider">Age/Sex</p>
                                <p className="font-semibold text-neutral-600 truncate">{pet.age}Y - {pet.gender || "M"}</p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedPetForID(pet)}
                            className="w-full mt-3 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-[9px] font-bold uppercase tracking-wider text-neutral-600 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Official Pet ID
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 py-8 text-center text-neutral-400 text-xs font-semibold">
                        No pets registered yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Update Face Scan Button */}
                <button
                  onClick={() => setShowFaceAuth(true)}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Fingerprint className="w-4 h-4" /> Update Face Scan
                </button>
              </div>

              {/* BIOMETRIC SHIELD (1/3 width) */}
              <div className="md:col-span-4 bg-gradient-to-br from-[#6c33e8] to-[#4c1ba6] rounded-3xl p-6 shadow-lg text-white flex flex-col justify-between h-[395px] relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-purple-200" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-200">Biometric Shield</span>
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-300">
                    {userdata.isFaceRegistered ? "Active & Encrypted" : "Security Inactive"}
                  </h4>
                </div>

                {/* Central orbit/spinning elements */}
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center my-2">
                  <div className="absolute inset-0 rounded-full border border-white/10 animate-spin-slow" />
                  <div className="absolute inset-4 rounded-full border border-dashed border-white/20 animate-[spin_10s_linear_infinite]" />
                  <div className="absolute inset-8 rounded-full border border-white/30 animate-[spin_6s_linear_infinite_reverse]" />
                  
                  <div className="relative z-10 w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.25)]">
                    <Shield className="w-8 h-8 text-white fill-white/10" />
                    <PawPrint className="w-4 h-4 absolute text-purple-300" />
                  </div>
                </div>

                <p className="text-[11px] text-purple-100 text-center leading-relaxed mb-4">
                  {userdata.isFaceRegistered
                    ? "Your profile and diagnostic reports are fully secured via active on-device biometric scanning."
                    : "Setup face authentication to guarantee protection of your pet health vault and transactional history."}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFaceAuth(true)}
                    className="flex-1 py-3 bg-white text-indigo-700 hover:bg-neutral-50 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Fingerprint className="w-4 h-4" /> Scan Now
                  </button>
                  <button
                    onClick={() => setShowFaceAuth(true)}
                    className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white transition-all"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* ROW 5: 2 COLUMNS FOOTER GRID */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Pet Health Tip */}
              <div className="md:col-span-6 bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 flex flex-col justify-between h-[390px]">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" /> Pet Health Tip
                    </h4>
                    <button
                      onClick={() => setupDailyContentGeneration(true)}
                      disabled={isRefreshingTip}
                      className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-400 transition-all active:scale-90"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingTip ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 shadow-inner italic text-xs text-neutral-600 leading-relaxed font-medium min-h-[200px] flex items-center justify-center">
                    "{dailyQuote}"
                  </div>
                </div>

                <p className="text-center text-[7px] font-black text-neutral-300 uppercase tracking-widest mt-4">Powered by Gemini AI</p>
              </div>

              {/* Video Consultations */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 flex flex-col justify-between h-[390px] relative overflow-hidden md:col-span-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-pink-50 rounded-lg text-pink-500">
                      <Video className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Video Consultations</h3>
                  </div>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-black text-neutral-800">
                      {userdata?.subscription?.plan === "Platinum" || userdata?.subscription?.plan === "Gold"
                        ? (userdata.subscription.plan === "Gold" ? 10 : 25) - (userdata.videoCallsUsed || 0)
                        : 25}
                    </span>
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Left</span>
                  </div>

                  <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-neutral-200/50 mb-2 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-rose-400 h-full rounded-full"
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
                  <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                    Allowance: {userdata?.subscription?.plan === "Gold" ? 10 : 25} Monthly Credits
                  </p>
                  <button
                    onClick={() => navigate("/doctors")}
                    className="w-full mt-3 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Video className="w-3.5 h-3.5" /> Start Consult
                  </button>
                </div>

                <div className="w-full h-32 mt-2 flex justify-center items-end">
                  <img src="/video_doctor.png" alt="doctor consulting" className="max-h-full object-contain" />
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default MyProfile;
