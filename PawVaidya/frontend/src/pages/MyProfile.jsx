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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AnimalHealthChatbot from "../components/AnimalHealthChatbot";
import FaceAuth from "../components/FaceAuth";
import PetIDCard from "../components/PetIDCard";

// ─── Stable sub-components with Golden Touch ──────────────────────────────────

const InfoItem = ({ icon, label, value, editComponent, isEdit }) => {
  const Icon = icon;
  return (
    <motion.div
      className="flex items-start p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/80 hover:border-amber-500/30 hover:bg-white/80 transition-all duration-300 group shadow-sm hover:shadow-md"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
    >
      <div className="p-3 rounded-xl bg-white shadow-sm mr-4 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-amber-600 group-hover:text-white transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] border border-neutral-100">
        <Icon size={18} className="text-[#9a6458] group-hover:text-white transition-colors duration-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-amber-800/80 font-black uppercase tracking-widest mb-0.5">{label}</p>
        <div className="mt-1">
          {isEdit ? (
            editComponent
          ) : (
            <p className="font-bold break-words text-[#5A4035] text-sm leading-relaxed">
              {value || label + " " + "Not provided"}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const SaveButton = ({ isEdit, isSaving, onSave, onEdit }) => {
  const { t } = useTranslation();
  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(212, 175, 55, 0.3)" }}
      whileTap={{ scale: 0.95 }}
      className={`relative overflow-hidden bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center shadow-md border border-amber-400/40 royal-shimmer ${isSaving ? "opacity-75 cursor-not-allowed" : ""
        }`}
      onClick={() => {
        if (isEdit && !isSaving) {
          onSave();
        } else if (!isEdit) {
          onEdit();
        }
      }}
      disabled={isSaving}
      type="button"
    >
      {isEdit ? (
        isSaving ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mr-2"
            >
              <Loader2 size={16} />
            </motion.div>
            {t("profile.saving")}
          </>
        ) : (
          <>
            <Save className="mr-2" size={16} />
            {t("profile.saveChanges")}
          </>
        )
      ) : (
        <>
          <Edit className="mr-2" size={16} />
          {t("profile.editProfile")}
        </>
      )}
    </motion.button>
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
          className="bg-[#fdfbf7] border border-amber-500/20 p-8 rounded-[2.5rem] shadow-[0_25px_50px_rgba(122,90,72,0.15)] flex flex-col items-center max-w-sm mx-4 relative overflow-hidden text-center luxury-noise-bg"
        >
          {/* Decorative Sparkles */}
          <div className="absolute top-4 left-4 text-amber-500/20 animate-gold-float">
            <Sparkles size={24} />
          </div>
          <div className="absolute bottom-4 right-4 text-amber-500/20 animate-gold-float [animation-delay:2s]">
            <Sparkles size={18} />
          </div>

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="p-4 bg-amber-500/5 rounded-full border border-amber-500/20 mb-6"
          >
            <Loader2 size={36} className="text-amber-500" />
          </motion.div>
          <h3 className="text-2xl font-black text-[#5A4035] tracking-tight uppercase">
            {t("profile.updatingProfile")}
          </h3>
          <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
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
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md flex items-center justify-center z-[160] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-[#fdfbf7] rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full border border-red-500/20 overflow-hidden relative luxury-noise-bg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#5A4035] uppercase tracking-tight">{t("profile.deleteAccount")}</h3>
                <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">{t("profile.permanentAction")}</p>
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 text-neutral-500 font-bold text-sm hover:bg-neutral-50 transition-all"
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
              </motion.button>
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

  // local editable copy
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
      const userToSave = editedData;
      const missingFields = validateFields(userToSave);
      if (missingFields.length > 0) {
        toast.error(`Please fill in: ${missingFields.join(", ")}`);
        return;
      }

      const normalized = normalizeAddress(userToSave.address);
      if (!normalized.LOCATION || !normalized.LINE) {
        toast.error("Please fill in address fields (State and District)");
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
      <div className="min-h-screen flex items-center justify-center bg-[#f2e4c7] relative overflow-hidden">
        {/* Glowing sparkles in background */}
        <div className="absolute top-20 left-20 text-[#9a6458]/20 animate-gold-float">
          <Sparkles size={40} />
        </div>
        <div className="absolute bottom-20 right-20 text-[#9a6458]/20 animate-gold-float [animation-delay:2s]">
          <Sparkles size={60} />
        </div>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="p-4 bg-[#9a6458]/5 rounded-full border border-amber-500/20 shadow-xl">
          <Loader2 size={48} className="text-[#9a6458]" />
        </motion.div>
      </div>
    );
  }

  const normalized = normalizeAddress(editedData.address);

  return (
    <div className="max-w-6xl mx-auto p-4 min-h-screen bg-[#f2e4c7] relative">
      <LoadingOverlay isSaving={isSaving} />

      {/* ─── HEADER & STATS CONTAINER (Aesthetic Light Cream & Gold Premium Panel) ─── */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="luxury-noise-bg gold-shimmer bg-[#fdfbf7]/90 border border-amber-500/20 shadow-[0_15px_45px_rgba(122,90,72,0.1)] rounded-[3rem] mb-8 overflow-hidden relative"
      >
        {/* Floating background decorations */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-b from-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="p-8 md:p-10 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10">
            {/* Avatar Section */}
            <motion.div className="flex-shrink-0 relative" whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
              {isEdit ? (
                <label htmlFor="image" className="cursor-pointer block">
                  <motion.div className="relative w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-amber-500/40 shadow-2xl bg-white group" whileHover={{ scale: 1.02 }}>
                    <img
                      className="w-full h-full object-cover"
                      src={image ? URL.createObjectURL(image) : editedData.image}
                      alt="Profile"
                      onError={(e) => (e.target.src = assets.profile_pic)}
                    />
                    <div className="absolute inset-0 bg-neutral-900/40 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Upload className="w-10 h-10 text-amber-500 animate-bounce" />
                    </div>
                  </motion.div>
                  <input onChange={handleImageChange} type="file" id="image" accept="image/*" hidden />
                </label>
              ) : (
                <div className="relative group">
                  {/* Outer Glowing Rings */}
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-[2.7rem] blur-md opacity-35 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                  {userdata?.subscription?.status === "Active" && userdata.subscription.plan !== "None" && (
                    <div className="absolute -inset-1 rounded-[2.6rem] border border-amber-400/40 animate-pulse-gold pointer-events-none"></div>
                  )}

                  <div className="relative w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl bg-white">
                    <img
                      src={editedData.image}
                      alt="Profile"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => (e.target.src = assets.profile_pic)}
                    />
                  </div>

                  {/* Premium Subscription Badge */}
                  {userdata?.subscription?.status === "Active" && userdata.subscription.plan !== "None" && (
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      className="absolute -top-4 -right-4 bg-[#fdfbf7] p-2.5 rounded-[1.5rem] shadow-xl border-2 border-amber-500/20 backdrop-blur-md z-20 flex items-center justify-center transform transition-transform"
                    >
                      <img
                        src={
                          userdata.subscription.plan === "Platinum"
                            ? assets.platinum_logo
                            : userdata.subscription.plan === "Gold"
                              ? assets.gold_logo
                              : assets.silver_logo
                        }
                        alt={`${userdata.subscription.plan} Badge`}
                        className="w-12 h-12 object-contain filter drop-shadow-[0_2px_5px_rgba(212,175,55,0.2)]"
                      />
                    </motion.div>
                  )}

                  {/* Profile Completeness Trophy */}
                  {profileCompleteness === 100 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.2 }}
                      className="absolute -bottom-2 -left-2 bg-gradient-to-br from-amber-400 to-amber-600 p-2.5 rounded-full shadow-lg border-2 border-white z-20"
                    >
                      <Trophy size={16} className="text-white" />
                    </motion.div>
                  )}
                </div>
              )}

              {/* Mobile Profile Completeness */}
              <div className="mt-5 md:hidden w-full">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] font-black text-[#5A4035]/60 uppercase tracking-[0.2em]">Profile Progress</span>
                  <span className="text-xs font-black text-[#5A4035]">{profileCompleteness}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden border border-white/50 shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompleteness}%` }}
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full shadow-[0_0_8px_rgba(212,175,55,0.3)]"
                  />
                </div>
              </div>
            </motion.div>

            {/* Header Content Area */}
            <div className="flex-1 space-y-4 w-full text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row md:items-baseline md:gap-4 flex-wrap justify-center md:justify-start">
                    <h1 className="text-3xl md:text-5xl font-black text-[#5A4035] tracking-tight leading-none mb-1 md:mb-0">
                      {isEdit ? (
                        <input
                          type="text"
                          className="bg-white border-2 border-amber-500/30 text-amber-600 rounded-2xl p-2 px-4 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 outline-none w-full md:max-w-md text-2xl md:text-3xl font-black shadow-inner"
                          value={editedData.name || ""}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Enter your name"
                        />
                      ) : (
                        <span className="gold-text-premium font-black tracking-tight leading-none">{userdata.name}</span>
                      )}
                    </h1>

                    {!isEdit && (
                      <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 justify-center md:justify-start select-none">
                        {userdata?.subscription?.plan && userdata.subscription.plan !== "None" && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-600/10 text-[#9a6458] text-[10px] font-black uppercase tracking-widest shadow-inner border border-amber-500/20 whitespace-nowrap"
                          >
                            <Crown size={11} className="text-[#9a6458] fill-current" />
                            {userdata.subscription.plan} Member
                          </motion.div>
                        )}
                        {userdata?.pawCode && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              navigator.clipboard.writeText(userdata.pawCode);
                              toast.success("Your permanent Paw Code copied to clipboard!");
                            }}
                            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FCF6E8] hover:bg-[#F5ECD2] text-[#5A4035] text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow border border-amber-500/30 border-dashed whitespace-nowrap transition-all"
                            title="Click to copy your referral Paw Code!"
                          >
                            <Gift size={11} className="text-amber-600" />
                            <span>Paw Code:</span>
                            <span className="font-mono font-bold text-amber-700 tracking-wider bg-amber-50/50 px-1.5 py-0.5 rounded border border-amber-200/40">{userdata.pawCode}</span>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Desktop Profile Completeness */}
                  <div className="hidden md:block pt-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-[10px] font-black text-amber-800/60 uppercase tracking-[0.25em]">Profile Completeness</span>
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-800 text-[9px] font-black rounded-lg border border-amber-500/20">{profileCompleteness}%</span>
                    </div>
                    <div className="w-64 h-2 bg-neutral-200/50 rounded-full overflow-hidden border border-white shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${profileCompleteness}%` }}
                        transition={{ duration: 1.2, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 relative"
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[scroll_2s_linear_infinite]"></div>
                      </motion.div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center md:justify-end items-center">
                  <div className="flex items-center bg-white border border-neutral-100 px-4 py-2.5 rounded-2xl shadow-sm backdrop-blur-sm">
                    <Mail size={15} className="text-[#9a6458] mr-2" />
                    <span className="text-xs font-bold text-neutral-600">{userdata.email}</span>
                  </div>
                  {userPets && userPets.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedPetForID(userPets[0])}
                      className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white px-5 py-2.5 rounded-2xl shadow-md flex items-center text-xs font-black uppercase tracking-wider border border-amber-400/40 royal-shimmer"
                    >
                      <Star className="w-3.5 h-3.5 mr-1.5 fill-current text-yellow-300" /> {t("profile.premiumPetID")}
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-3">
                {!editedData.isBanned ? (
                  <>
                    <SaveButton isEdit={isEdit} isSaving={isSaving} onSave={updateUserProfileData} onEdit={() => setIsEdit(true)} />
                    {isEdit && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCancelEdit}
                        className="border border-[#9a6458]/30 text-[#9a6458] hover:text-[#7b483d] px-6 py-3 rounded-2xl bg-white/50 hover:bg-white font-black text-xs uppercase tracking-wider transition-all shadow-sm"
                        disabled={isSaving}
                        type="button"
                      >
                        Cancel
                      </motion.button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-500/10 text-red-500 font-bold border border-red-500/20 shadow-sm text-xs uppercase tracking-wider">
                    <AlertCircle size={16} />
                    Profile Locked
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleEdit}
                  className="px-6 py-2.5 bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center shadow-xl hover:bg-amber-400 transition-all border border-amber-300 md:hidden"
                >
                  <Edit size={14} className="mr-2" /> {isEdit ? t("profile.cancel") : t("profile.editProfile")}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            {[
              { icon: Activity, label: "Status", value: editedData.isBanned ? "Restricted" : "Verified", color: "text-emerald-600", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
              { icon: PawPrint, label: "Total Pets", value: `${userPets?.length || 0} Pets`, color: "text-amber-700", bg: "bg-amber-500/5", border: "border-amber-500/20" },
              { icon: Zap, label: "Paw Wallet", value: `₹${userdata.pawWallet || 0}`, color: "text-[#9a6458]", bg: "bg-yellow-500/5", border: "border-yellow-500/20" },
              { icon: Trophy, label: "PawPoints", value: `${userdata.pawpoints || 0} PTS`, color: "text-yellow-600", bg: "bg-amber-500/5", border: "border-amber-500/20" },
              {
                icon: Video,
                label: "Video Calls",
                value:
                  userdata?.subscription?.plan === "Platinum" || userdata?.subscription?.plan === "Gold"
                    ? `${Math.max(0, (userdata.subscription.plan === "Gold" ? 10 : 25) - (userdata.videoCallsUsed || 0))} Left`
                    : "Upgrade Plan",
                color: "text-rose-600",
                bg: "bg-rose-500/5",
                border: "border-rose-500/20",
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03, y: -2, borderColor: "rgba(212,175,55,0.4)" }}
                className="bg-white/80 border border-amber-500/10 p-4 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                  <stat.icon size={44} className={stat.color} />
                </div>
                <div className="flex items-center gap-3 mb-2.5">
                  <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} border ${stat.border}`}>
                    <stat.icon size={16} />
                  </div>
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className="text-base font-black text-[#5A4035] group-hover:text-amber-600 transition-colors duration-300">{stat.value}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ─── MODAL CONTROLLERS ─── */}
      <AnimatePresence>
        {selectedPetForID && (
          <PetIDCard pet={selectedPetForID} ownerName={userdata.name} phone={userdata.phone} onClose={() => setSelectedPetForID(null)} />
        )}
        {showFaceAuth && (
          <FaceAuth mode="register" onCancel={() => setShowFaceAuth(false)} onAuthSuccess={() => setShowFaceAuth(false)} />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        <div className="lg:col-span-8 space-y-8">
          {/* ─── ACCOUNT INFORMATION CARD (Cream & Gold Premium Form) ─── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white/50 backdrop-blur-xl shadow-[0_15px_40px_rgba(122,90,72,0.1)] rounded-[3rem] overflow-hidden border border-white p-3"
          >
            {/* Header Plate */}
            <div className="p-6 bg-gradient-to-r from-[#9a6458] to-[#7b483d] text-white flex items-center justify-between rounded-[2.5rem] shadow-lg mb-6 border border-amber-500/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/25 rounded-2xl text-white">
                  <User size={20} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tighter text-white leading-none">Account Information</h2>
                  <p className="text-[9px] text-amber-100/80 uppercase tracking-widest mt-1">Manage secure profile specifics</p>
                </div>
              </div>
              <Sparkles className="text-yellow-300 animate-gold-float" size={18} />
            </div>

            <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                icon={Phone}
                label="Contact"
                value={editedData.phone}
                isEdit={isEdit}
                editComponent={
                  <input
                    type="text"
                    className="bg-white border border-amber-500/20 focus:border-amber-500/50 rounded-2xl p-3 w-full outline-none text-sm text-neutral-800 font-bold transition-all shadow-inner focus:ring-4 focus:ring-amber-500/5"
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
                  <p className="font-bold px-4 py-3 bg-neutral-100 rounded-2xl border border-dashed border-neutral-300 text-neutral-500 text-sm">
                    {editedData.email}
                  </p>
                }
              />
              <InfoItem
                icon={User}
                label="Gender"
                value={editedData.gender}
                isEdit={isEdit}
                editComponent={
                  <select
                    className="bg-white border border-amber-500/20 focus:border-amber-500/50 rounded-2xl p-3 w-full outline-none text-sm text-neutral-800 font-bold transition-all shadow-inner focus:ring-4 focus:ring-amber-500/5"
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
                    className="bg-white border border-amber-500/20 focus:border-amber-500/50 rounded-2xl p-3 w-full outline-none text-sm text-neutral-800 font-bold transition-all shadow-inner focus:ring-4 focus:ring-amber-500/5"
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
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        className="bg-white border border-amber-500/20 focus:border-amber-500/50 rounded-2xl p-3 outline-none text-sm text-neutral-800 font-bold transition-all shadow-inner focus:ring-4 focus:ring-amber-500/5"
                        value={normalized.LOCATION}
                        placeholder="State"
                        onChange={(e) => handleAddressChange("LOCATION", e.target.value)}
                      />
                      <input
                        type="text"
                        className="bg-white border border-amber-500/20 focus:border-amber-500/50 rounded-2xl p-3 outline-none text-sm text-neutral-800 font-bold transition-all shadow-inner focus:ring-4 focus:ring-amber-500/5"
                        value={normalized.LINE}
                        placeholder="District"
                        onChange={(e) => handleAddressChange("LINE", e.target.value)}
                      />
                    </div>
                  }
                />
              </div>
            </div>
          </motion.div>

          {/* ─── MY PET FAMILY SECTION (Luxury passports / ID cards) ─── */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-[#5A4035] uppercase tracking-tighter flex items-center gap-3 px-4">
              <PawPrint size={24} className="text-[#9a6458]" /> {t("profile.myPetFamily")}
              <span className="bg-amber-500/10 text-amber-800 text-xs px-2.5 py-1 rounded-xl border border-amber-500/20 ml-2">{userPets?.length || 0}</span>
            </h3>

            {userPets && userPets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userPets.map((pet, index) => (
                  <motion.div
                    key={pet._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                    whileHover={{ y: -5 }}
                    className="bg-white/70 backdrop-blur-lg shadow-md hover:shadow-[0_20px_40px_rgba(122,90,72,0.12)] rounded-[2.5rem] border border-white/80 p-6 relative group overflow-hidden transition-all duration-300 gold-shimmer"
                  >
                    {/* Tiny decorative gold frame internally */}
                    <div className="absolute inset-2 border border-[#9a6458]/5 rounded-[2rem] pointer-events-none"></div>

                    <div className="flex items-center gap-5 mb-6 relative z-10">
                      <div className="w-24 h-24 rounded-[1.8rem] overflow-hidden border-2 border-[#9a6458]/15 shadow-lg bg-amber-50/40 shrink-0 relative group">
                        <img src={pet.image || assets.upload_area} alt={pet.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xl font-black text-[#5A4035] truncate flex items-center gap-1.5 leading-tight">
                          {pet.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="px-2.5 py-0.5 bg-amber-100/60 text-[#9a6458] text-[9px] font-black rounded-lg uppercase tracking-wider border border-[#9a6458]/10">{pet.type}</span>
                          {pet.isVerified && (
                            <div className="flex items-center text-blue-600 gap-0.5 font-bold text-[10px]">
                              <ShieldCheck size={13} className="fill-blue-100" /> Verified
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                      <div className="bg-white/60 p-3 rounded-2xl border border-neutral-100 shadow-inner">
                        <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">Breed</p>
                        <p className="text-xs font-bold text-[#5A4035] truncate">{pet.breed || "N/A"}</p>
                      </div>
                      <div className="bg-white/60 p-3 rounded-2xl border border-neutral-100 shadow-inner">
                        <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">Age / Sex</p>
                        <p className="text-xs font-bold text-[#5A4035]">{pet.age}Y • {pet.gender}</p>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(212,175,55,0.2)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPetForID(pet)}
                      className="w-full py-3 bg-[#5A4035] hover:bg-[#4a3229] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md border border-amber-500/20 relative z-10 royal-shimmer"
                    >
                      <CreditCard size={13} className="text-amber-100" /> {t("profile.officialPetID")}
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-[#9a6458]/20 p-12 text-center shadow-inner">
                <PawPrint size={44} className="text-[#9a6458]/15 mx-auto mb-4 animate-bounce" />
                <p className="text-[#5A4035]/60 font-black text-sm uppercase tracking-wide">No pets registered yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT HAND COLUMN (Widgets & Security Modules) ─── */}
        <div className="lg:col-span-4 space-y-8">
          {/* Biometric Integration Card */}
          <AnimatePresence>
            {!userdata.isFaceRegistered ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-[2.5rem] bg-gradient-to-br from-amber-50/70 to-amber-100/50 border border-amber-200/60 shadow-md relative overflow-hidden group gold-shimmer"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
                  <Shield size={100} className="text-amber-600" />
                </div>
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl text-white shadow-lg shadow-amber-200/50 animate-pulse-gold">
                    <Shield size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight leading-tight">Biometric Shield</h4>
                    <p className="text-[10px] text-amber-700/80 mt-0.5 font-bold uppercase tracking-wide">Security Inactive</p>
                  </div>
                </div>
                <p className="text-xs text-amber-800/80 mb-5 leading-relaxed relative z-10">
                  Setup face authentication to guarantee protection of your pet health vault and transactional history.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowFaceAuth(true)}
                  className="w-full py-3 bg-gradient-to-r from-[#9a6458] to-[#7b483d] text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md royal-shimmer"
                >
                  Setup Biometrics
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-[2.5rem] bg-gradient-to-br from-blue-50/60 to-blue-100/40 border border-blue-200/60 shadow-md relative overflow-hidden group gold-shimmer"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
                  <ShieldCheck size={100} className="text-blue-500" />
                </div>
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="p-3 bg-blue-500/10 border border-blue-200/20 rounded-2xl text-blue-600">
                    <ShieldCheck size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight leading-tight">Biometric Shield</h4>
                    <p className="text-[10px] text-blue-600 mt-0.5 font-black uppercase tracking-wider">Active & Encrypted</p>
                  </div>
                </div>
                <p className="text-xs text-blue-800/80 mb-5 leading-relaxed relative z-10">
                  Your profile and diagnostic reports are fully secured via active on-device biometric scanning.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowFaceAuth(true)}
                  className="w-full py-3 bg-white text-blue-600 border border-blue-200 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-neutral-50 transition-all shadow-sm"
                >
                  Update Face Scan
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── SUBSCRIPTION MEMBERSHIP CARD (Luxury Ivory Card design) ─── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-[2.5rem] bg-gradient-to-br from-white/95 via-amber-50/20 to-[#fbf9f4] border border-amber-500/25 shadow-xl relative overflow-hidden group"
          >
            {/* Glossy diagonal sheet */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-white/0 to-amber-500/5 pointer-events-none"></div>

            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl shadow-md ${userdata.subscription?.plan === "Platinum"
                    ? "bg-purple-600 text-white"
                    : userdata.subscription?.plan === "Gold"
                      ? "bg-amber-500 text-white animate-pulse"
                      : userdata.subscription?.plan === "Silver"
                        ? "bg-slate-500 text-white"
                        : "bg-[#9a6458] text-white"
                    }`}>
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight leading-none text-[#5A4035]">
                      {userdata?.subscription?.plan && userdata.subscription.plan !== "None" ? `${userdata.subscription.plan} Membership` : "Basic Access"}
                    </h4>
                    <p className="text-[9px] text-[#9a6458] uppercase tracking-widest mt-1">Tier Level Access</p>
                  </div>
                </div>

                {/* Simulated Gold Chip detailing */}
                {userdata?.subscription?.plan && userdata.subscription.plan !== "None" && (
                  <div className="w-8 h-6 rounded-lg bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border border-amber-200/40 shadow-sm flex items-center justify-center opacity-80">
                    <div className="grid grid-cols-3 gap-0.5 w-full h-full p-1 opacity-45">
                      <div className="border-r border-b border-black"></div>
                      <div className="border-r border-b border-black"></div>
                      <div className="border-b border-black"></div>
                      <div className="border-r border-black"></div>
                      <div className="border-r border-black"></div>
                      <div></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                {userdata?.subscription?.plan && userdata.subscription.plan !== "None" ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Expiry Information</p>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[#9a6458]" />
                      <span className="text-xs font-black text-amber-700">{formatDate(userdata.subscription.expiryDate)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Upgrade to high-tier subscriptions to unlock VIP consults, zero processing fees, and priority live queues.
                  </p>
                )}
              </div>

              <button
                onClick={() => navigate("/subscription")}
                className="w-full py-3 bg-[#5A4035] hover:bg-[#4a3229] text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md royal-shimmer"
              >
                {userdata.subscription?.plan !== "None" ? "Manage Membership" : "View Premium Plans"}
              </button>
            </div>
          </motion.div>

          {/* ─── VIDEO ALLOWANCE WIDGET ─── */}
          {userdata?.subscription?.plan && (userdata.subscription.plan === "Gold" || userdata.subscription.plan === "Platinum") && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/50 border border-amber-500/20 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden"
            >
              <div className="absolute -top-6 -right-6 opacity-5 rotate-12 text-[#9a6458]">
                <Video size={100} />
              </div>
              <div className="relative z-10 text-center">
                <div className="flex items-center gap-3 mb-4 justify-center">
                  <div className="p-2 bg-[#9a6458]/10 rounded-xl text-[#9a6458]">
                    <Video size={16} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#5A4035]">Video Consultations</span>
                </div>

                <div className="text-4xl font-black text-[#5A4035] mb-2 tracking-tight">
                  {Math.max(0, (userdata.subscription.plan === "Gold" ? 10 : 25) - (userdata.videoCallsUsed || 0))}
                  <span className="text-xs font-black text-neutral-400 ml-1.5 uppercase tracking-widest">Left</span>
                </div>

                <div className="w-full bg-[#5A4035]/10 rounded-full h-2.5 overflow-hidden mb-3 p-0.5 border border-[#5A4035]/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((userdata.videoCallsUsed || 0) / (userdata.subscription.plan === "Gold" ? 10 : 25)) * 100}%` }}
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full"
                  />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#5A4035]/40">
                  Allowance: {userdata.subscription.plan === "Gold" ? 10 : 25} Monthly Credits
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── UPCOMING APPOINTMENT WIDGET (PawVaidya Copper-Gold design) ─── */}
          {nextAppointment && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-[#9a6458] to-[#7b483d] border border-amber-500/20 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 text-white">
                <Calendar size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-white/20 rounded-xl text-white">
                    <Clock size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-100">{t("profile.nextAppointment")}</span>
                </div>
                <h4 className="text-xl font-black mb-1.5 text-white">Dr. {nextAppointment.docData.name}</h4>
                <p className="text-amber-100/90 text-xs mb-6 flex items-center gap-1.5 font-bold">
                  <Calendar size={13} className="text-amber-300" />
                  {nextAppointment.slotDate.replace(/_/g, " ")} • {nextAppointment.slotTime}
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/my-appointments")}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-black uppercase tracking-wider transition-all royal-shimmer"
                >
                  Manage Bookings
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─── HEALTH TIP CARD (Powered by Gemini AI) ─── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-500">
                  <Heart size={18} fill="#d97706" className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-[#5A4035] uppercase tracking-tight leading-none">Pet Health Tip</h3>
                  <p className="text-[8px] text-[#9a6458]/70 uppercase tracking-widest mt-1">Smart advice</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setupDailyContentGeneration(true)}
                disabled={isRefreshingTip}
                className="p-2 bg-white rounded-xl text-neutral-400 hover:text-amber-500 hover:shadow-md transition-all border border-neutral-100"
              >
                <RefreshCw size={15} className={isRefreshingTip ? "animate-spin" : ""} />
              </motion.button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={dailyQuote}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/70 p-5 rounded-2xl border border-amber-500/10 italic text-[#5A4035] text-xs leading-relaxed font-bold shadow-inner"
              >
                "{dailyQuote}"
              </motion.div>
            </AnimatePresence>
            <p className="text-center text-[8px] font-black text-[#5A4035]/30 uppercase tracking-[0.25em] mt-5">Powered by Gemini AI</p>
          </motion.div>

          {/* ─── BAN DETAILS / APPEAL ZONE ─── */}
          {editedData.isBanned && (
            <div className="bg-red-500/5 backdrop-blur-sm p-6 rounded-[2.5rem] border border-red-500/20 shadow-md">
              <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertCircle size={15} /> Account Restricted
              </h4>
              <div className="bg-[#fdfbf7] p-4 rounded-2xl border border-red-500/10 mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] font-black text-[#5A4035]/60 uppercase tracking-wider">Unban Appeal Attempts</span>
                  <span className="text-xs font-black text-red-600">
                    {userdata.unbanAttempts || 0}/3
                  </span>
                </div>
                <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden p-0.5 border border-white shadow-inner">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${((userdata.unbanAttempts || 0) / 3) * 100}%` }} />
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={userdata.unbanAttempts >= 3}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-40"
              >
                Request Support Appeal
              </button>
            </div>
          )}

          {/* ─── DANGER ZONE ─── */}
          <div className="bg-red-500/5 backdrop-blur-sm p-6 rounded-[2.5rem] border border-red-500/10 shadow-sm">
            <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertCircle size={14} /> Danger Zone
            </h4>
            <p className="text-[10px] text-neutral-500 mb-4 px-1 leading-relaxed">
              Permanently close and delete your diagnostic history, wallet funds, and linked biometric data.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-3 bg-white hover:bg-red-600 text-red-600 hover:text-white font-black text-xs uppercase tracking-wider rounded-2xl border border-red-200 hover:border-red-600 transition-all shadow-sm"
            >
              Request Account Deletion
            </motion.button>
          </div>
        </div>
      </div>

      <AnimalHealthChatbot />

      {showDeleteModal && (
        <DeletionRequestModal onClose={() => setShowDeleteModal(false)} onSubmit={handleSubmitDeletion} isSubmitting={isSubmittingDeletion} />
      )}
    </div>
  );
};

export default MyProfile;
