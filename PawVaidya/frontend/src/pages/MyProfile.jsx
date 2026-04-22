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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AnimalHealthChatbot from "../components/AnimalHealthChatbot";
import FaceAuth from "../components/FaceAuth";
import PetIDCard from "../components/PetIDCard";

// ─── Stable sub-components ──────────────────────────────────────────────────

const InfoItem = ({ icon, label, value, editComponent, isEdit }) => {
  const Icon = icon;
  return (
    <motion.div
      className="flex items-start p-4 hover:bg-white/40 rounded-2xl transition-all duration-300 group border border-transparent hover:border-white/50"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 5 }}
    >
      <div className="p-3 rounded-xl bg-white/80 shadow-sm mr-4 group-hover:scale-110 group-hover:bg-[#9a6458] group-hover:text-white transition-all duration-300">
        <Icon size={20} className="text-[#9a6458] group-hover:text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#9a6458] font-black uppercase tracking-widest mb-1 opacity-70">{label}</p>
        <div className="mt-1">
          {isEdit ? (
            editComponent
          ) : (
            <p className="font-bold break-words text-gray-800 text-base">
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
      whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(154, 100, 88, 0.3)" }}
      whileTap={{ scale: 0.95 }}
      className={`bg-gradient-to-r from-[#9a6458] to-[#7b483d] text-white px-6 py-2.5 rounded-xl hover:from-[#7b483d] hover:to-[#9a6458] transition-all duration-300 flex items-center shadow-lg ${isSaving ? "opacity-75 cursor-not-allowed" : ""
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
            >
              <Loader2 className="mr-2" size={18} />
            </motion.div>
            {t('profile.saving')}
          </>
        ) : (
          <>
            <Save className="mr-2" size={18} />
            {t('profile.saveChanges')}
          </>
        )
      ) : (
        <>
          <Edit className="mr-2" size={18} />
          {t('profile.editProfile')}
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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm mx-4 border-2 border-[#9a6458]/20"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 size={48} className="text-[#9a6458] mb-4" />
          </motion.div>
          <h3 className="text-xl font-bold text-[#9a6458]">
            {t('profile.updatingProfile')}
          </h3>
          <p className="text-gray-600 mt-2 text-center">
            {t('profile.saveChangesSub')}
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
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full border border-red-100 overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{t('profile.deleteAccount')}</h3>
                <p className="text-xs text-red-500 font-bold uppercase tracking-widest">{t('profile.permanentAction')}</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              {t('profile.deleteWarning')}
            </p>
            <textarea
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-red-100 focus:border-red-200 outline-none transition-all mb-6 resize-none min-h-[120px]"
              placeholder={t('profile.deleteReasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-100 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-all"
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSubmit(reason)}
                disabled={isSubmitting || !reason.trim()}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center ${isSubmitting || !reason.trim()
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-500 to-red-600 shadow-red-200 hover:shadow-red-300"
                  }`}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  t('profile.submitRequest')
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
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

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
  const [dailyQuote, setDailyQuote] = useState(t('common.loading'));
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
      const basicFields = [
        'name', 'email', 'phone', 'gender', 'dob', 'image', 'full_address'
      ];

      const basicCompleted = basicFields.filter(field => {
        if (field === 'full_address') return userdata.full_address && userdata.full_address.length > 5;
        return !!userdata[field];
      }).length;

      const totalFields = basicFields.length + 1;
      const totalCompleted = basicCompleted + (userPets && userPets.length > 0 ? 1 : 0);

      setProfileCompleteness(Math.round((totalCompleted / totalFields) * 100));
    }
  }, [userdata, userPets]);

  useEffect(() => {
    if (token && getUserAppointments) {
      getUserAppointments().then(appts => {
        if (appts && appts.length > 0) {
          const upcoming = appts
            .filter(a => !a.cancelled && !a.isCompleted)
            .sort((a, b) => {
              const dateA = a.slotDate.split('_').reverse().join('-');
              const dateB = b.slotDate.split('_').reverse().join('-');
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
  const TIP_STORAGE_KEY = 'petHealthTip';
  const TIP_TIMESTAMP_KEY = 'petHealthTipTimestamp';

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
      }).forEach(([key, value]) =>
        formdata.append(key, value?.trim?.() || "")
      );

      formdata.append("address", JSON.stringify(normalized));
      if (userToSave.id) formdata.append("userId", userToSave.id);
      if (image) formdata.append("image", image);

      const { data } = await axios.post(
        `${backendurl}/api/user/update-profile`,
        formdata,
        { headers: { token } }
      );

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

  const setupDailyContentGeneration = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshingTip(true);
      if (!apikey2) { setDailyQuote("Daily tip unavailable"); return; }

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
  }, [apikey2, model, prompt, TIP_REFRESH_INTERVAL]);

  useEffect(() => {
    setupDailyContentGeneration();
  }, [setupDailyContentGeneration]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch { return dateString; }
  };

  const handleCancelEdit = () => {
    if (originalDataRef.current) setEditedData(originalDataRef.current);
    setIsEdit(false);
    setImage(null);
    originalDataRef.current = null;
  };

  if (!editedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2e4c7]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 size={48} className="text-[#9a6458]" />
        </motion.div>
      </div>
    );
  }

  const normalized = normalizeAddress(editedData.address);

  return (
    <div className="max-w-6xl mx-auto p-4 min-h-screen bg-[#f2e4c7]">
      <LoadingOverlay isSaving={isSaving} />

      {/* Header & Stats Container */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-md shadow-xl rounded-[2.5rem] mb-8 overflow-hidden border border-[rgba(122,90,72,0.12)] bg-[rgba(122, 90, 72, 0.08)]"
      >
        <div className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar Section */}
            <motion.div
              className="flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {isEdit ? (
                <label htmlFor="image" className="cursor-pointer block">
                  <motion.div
                    className="relative w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl"
                    whileHover={{ scale: 1.02 }}
                  >
                    <img
                      className="w-full h-full object-cover"
                      src={image ? URL.createObjectURL(image) : editedData.image}
                      alt="Profile"
                      onError={(e) => (e.target.src = assets.profile_pic)}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity">
                      <Upload className="w-10 h-10 text-white" />
                    </div>
                  </motion.div>
                  <input onChange={handleImageChange} type="file" id="image" accept="image/*" hidden />
                </label>
              ) : (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#9a6458] to-[#7b483d] rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <div className={`relative w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-white ${userdata?.subscription?.plan && userdata.subscription.plan !== 'None' ? 'ring-4 ring-amber-400/50 ring-offset-2 animate-pulse' : ''}`}>
                    {userdata?.subscription?.plan && userdata.subscription.plan !== 'None' && (
                      <motion.div
                        animate={{
                          boxShadow: [
                            "0 0 20px rgba(251, 191, 36, 0.4)",
                            "0 0 40px rgba(251, 191, 36, 0.7)",
                            "0 0 20px rgba(251, 191, 36, 0.4)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
                      />
                    )}
                    <img
                      src={editedData.image}
                      alt="Profile"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => (e.target.src = assets.profile_pic)}
                    />
                  </div>
                  {profileCompleteness === 100 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-3 -right-3 bg-yellow-400 p-2 rounded-full shadow-lg border-2 border-white"
                    >
                      <Trophy size={20} className="text-white" />
                    </motion.div>
                  )}
                </div>
              )}

              {/* Mobile Completeness */}
              <div className="mt-4 md:hidden w-full">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-[#5A4035]/60 uppercase tracking-widest">{t('profile.profileCompleteness')}</span>
                  <span className="text-xs font-black text-[#5A4035]">{profileCompleteness}%</span>
                </div>
                <div className="w-full bg-white/50 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompleteness}%` }}
                    className="bg-gradient-to-r from-[#9a6458] to-[#7b483d] h-full"
                  />
                </div>
              </div>
            </motion.div>

            {/* Header Content Area */}
            <div className="flex-1 space-y-4 w-full text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                  <h1 className="text-4xl md:text-5xl font-black text-[#5A4035] tracking-tight">
                    {isEdit ? (
                      <input
                        type="text"
                        className="bg-white/80 border-2 border-[#5A4035]/20 rounded-2xl p-2 px-4 focus:ring-4 focus:ring-[#5A4035]/10 outline-none w-full md:max-w-md text-3xl font-black"
                        value={editedData.name || ""}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter your name"
                      />
                    ) : (
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <span>{userdata.name}</span>
                        {userdata?.subscription?.plan && userdata.subscription.plan !== 'None' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-amber-200/50 border border-amber-300"
                          >
                            <Crown size={12} className="fill-current" />
                            Premium {userdata.subscription.plan}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </h1>
                  <div className="hidden md:block">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-[10px] font-black text-amber-700/40 uppercase tracking-[0.2em]">{t('profile.profileCompleteness')}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-lg">{profileCompleteness}%</span>
                    </div>
                    <div className="w-64 h-2.5 bg-white/50 rounded-full overflow-hidden border border-white/20 shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${profileCompleteness}%` }}
                        transition={{ duration: 1.2, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 relative"
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[scroll_2s_linear_infinite]"></div>
                      </motion.div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center md:justify-end items-center">
                  <div className="flex items-center bg-white/80 border border-white px-4 py-2.5 rounded-2xl shadow-sm">
                    <Mail size={16} className="text-amber-600 mr-2" />
                    <span className="text-sm font-bold text-gray-600">{userdata.email}</span>
                  </div>
                  {userPets && userPets.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedPetForID(userPets[0])}
                      className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-5 py-2.5 rounded-2xl shadow-lg flex items-center text-xs font-black uppercase tracking-wider border border-yellow-300"
                    >
                      <Star className="w-4 h-4 mr-2 fill-current" /> {t('profile.premiumPetID')}
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                {!editedData.isBanned ? (
                  <>
                    <SaveButton isEdit={isEdit} isSaving={isSaving} onSave={updateUserProfileData} onEdit={() => setIsEdit(true)} />
                    {isEdit && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCancelEdit}
                        className="border-2 border-[#9a6458] text-[#9a6458] px-6 py-2.5 rounded-xl hover:bg-white/50 backdrop-blur-sm transition-all font-bold shadow-md"
                        disabled={isSaving}
                        type="button"
                      >
                        Cancel
                      </motion.button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold border border-red-200 shadow-sm">
                    <AlertCircle size={18} />
                    Profile Locked
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleEdit}
                  className="px-6 py-2.5 bg-[#5A4035] text-white rounded-2xl text-sm font-black flex items-center shadow-xl hover:bg-[#48332a] transition-all border border-white/10 md:hidden"
                >
                  <Edit size={16} className="mr-2" /> {isEdit ? t('profile.cancel') : t('profile.editProfile')}
                </motion.button>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { icon: Activity, label: "Status", value: editedData.isBanned ? "Restricted" : "Verified", color: "blue" },
              { icon: PawPrint, label: "Total Pets", value: `${userPets?.length || 0} Pets`, color: "green" },
              { icon: Zap, label: "Paw Wallet", value: `₹${userdata.pawWallet || 0}`, color: "purple" },
              {
                icon: Video,
                label: "Video Calls",
                value: userdata?.subscription?.plan === 'Platinum' || userdata?.subscription?.plan === 'Gold'
                  ? `${Math.max(0, (userdata.subscription.plan === 'Platinum' ? 25 : 10) - (userdata.videoCallsUsed || 0))} Left`
                  : "Upgrade",
                color: "rose"
              }
            ].map((stat, i) => (
              <div key={i} className="bg-white/60 backdrop-blur-md p-4 rounded-[2rem] border border-white/50 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-xl bg-${stat.color}-100 text-${stat.color}-600`}>
                    <stat.icon size={18} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className="text-lg font-black text-gray-800">{stat.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Biometric Integration */}
          <AnimatePresence>
            {!userdata.isFaceRegistered ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 p-6 rounded-[2rem] bg-emerald-50 border-2 border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-200">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-emerald-900 leading-tight">Biometric Security Required</h4>
                    <p className="text-xs text-emerald-700/80 mt-1">Setup face authentication to protect your account and pet data.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFaceAuth(true)}
                  className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-500 transition-all shadow-xl"
                >
                  Setup Now
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 p-6 rounded-[2rem] bg-blue-50 border-2 border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-blue-900 leading-tight">Biometric Shield Active</h4>
                    <p className="text-xs text-blue-700/80 mt-1">Your identity is verified via biometric authentication.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFaceAuth(true)}
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-500 transition-all shadow-xl"
                >
                  Update Scan
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subscription Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mt-8 p-6 rounded-[2rem] border-2 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative ${userdata?.subscription?.plan && userdata.subscription.plan !== 'None'
              ? 'bg-amber-50 border-amber-100'
              : 'bg-gray-50 border-gray-100'
              }`}
          >
            {userdata?.subscription?.plan && userdata.subscription.plan !== 'None' && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            )}

            <div className="flex items-center gap-4 relative z-10">
              <div className={`p-4 rounded-2xl shadow-lg ${userdata.subscription?.plan === 'Platinum' ? 'bg-purple-600 text-white' :
                userdata.subscription?.plan === 'Gold' ? 'bg-amber-500 text-white' :
                  userdata.subscription?.plan === 'Silver' ? 'bg-slate-500 text-white' :
                    'bg-gray-400 text-white'
                }`}>
                <CreditCard size={28} />
              </div>
              <div>
                <h4 className="text-lg font-black text-gray-900 leading-tight">
                  {userdata?.subscription?.plan && userdata.subscription.plan !== 'None' ? `${userdata.subscription.plan} Membership` : 'Basic Access'}
                </h4>
                {userdata?.subscription?.plan && userdata.subscription.plan !== 'None' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={14} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-700">Expires: {formatDate(userdata.subscription.expiryDate)}</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Upgrade to unlock premium features and priority care.</p>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate('/subscription')}
              className={`w-full md:w-auto px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-xl relative z-10 ${userdata.subscription?.plan !== 'None'
                ? 'bg-white text-amber-600 hover:bg-amber-50 border border-amber-200'
                : 'bg-primary text-white hover:bg-primary/90'
                }`}
            >
              {userdata.subscription?.plan !== 'None' ? 'Manage Plan' : 'View Plans'}
            </button>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedPetForID && (
          <PetIDCard pet={selectedPetForID} ownerName={userdata.name} phone={userdata.phone} onClose={() => setSelectedPetForID(null)} />
        )}
        {showFaceAuth && (
          <FaceAuth mode="register" onCancel={() => setShowFaceAuth(false)} onAuthSuccess={() => setShowFaceAuth(false)} />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/40 backdrop-blur-xl shadow-2xl rounded-[3rem] overflow-hidden border border-white/60 p-2"
          >
            <div className="p-6 bg-gradient-to-r from-[#9a6458] to-[#7b483d] text-white flex items-center justify-between rounded-[2.5rem] shadow-lg mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md text-white"> <User size={24} /> </div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Account Information</h2>
              </div>
              <Sparkles className="text-yellow-400" size={20} />
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={Phone} label="Contact" value={editedData.phone} isEdit={isEdit} editComponent={<input type="text" className="bg-white/80 border-2 border-white rounded-2xl p-3 w-full outline-none" value={editedData.phone || ""} onChange={(e) => handlePhoneChange(e.target.value)} />} />
              <InfoItem icon={Mail} label="Email" value={editedData.email} isEdit={isEdit} editComponent={<p className="font-bold px-3 py-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-300">{editedData.email}</p>} />
              <InfoItem icon={User} label="Gender" value={editedData.gender} isEdit={isEdit} editComponent={<select className="bg-white/80 border-2 border-white rounded-2xl p-3 w-full outline-none" value={editedData.gender || ""} onChange={(e) => handleInputChange("gender", e.target.value)}><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>} />
              <InfoItem icon={Calendar} label="Birthday" value={formatDate(editedData.dob)} isEdit={isEdit} editComponent={<input type="date" className="bg-white/80 border-2 border-white rounded-2xl p-3 w-full outline-none" value={editedData.dob || ""} onChange={(e) => handleInputChange("dob", e.target.value)} />} />
              <div className="md:col-span-2">
                <InfoItem icon={MapPin} label="Address" value={`${normalized.LOCATION}, ${normalized.LINE}`} isEdit={isEdit} editComponent={<div className="grid grid-cols-2 gap-3"><input type="text" className="bg-white/80 border-2 border-white rounded-2xl p-3 outline-none" value={normalized.LOCATION} placeholder="State" onChange={(e) => handleAddressChange("LOCATION", e.target.value)} /><input type="text" className="bg-white/80 border-2 border-white rounded-2xl p-3 outline-none" value={normalized.LINE} placeholder="District" onChange={(e) => handleAddressChange("LINE", e.target.value)} /></div>} />
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
            <h3 className="text-2xl font-black text-[#5A4035] uppercase tracking-tighter flex items-center gap-3 px-6">
              <PawPrint size={28} className="text-[#9a6458]" /> {t('profile.myPetFamily')}
              <span className="bg-[#9a6458]/10 text-[#9a6458] text-xs px-2 py-1 rounded-lg ml-2">{userPets?.length || 0}</span>
            </h3>

            {userPets && userPets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userPets.map((pet, index) => (
                  <motion.div
                    key={pet._id || index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-white/60 backdrop-blur-xl shadow-xl rounded-[2.5rem] border border-white/80 p-6 relative group overflow-hidden"
                  >
                    <div className="flex items-center gap-5 mb-6">
                      <div className="w-16 h-16 rounded-3xl overflow-hidden border-2 border-[#9a6458]/20 shadow-lg bg-white shrink-0">
                        <img src={pet.image || assets.upload_area} alt={pet.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-black text-[#5A4035] truncate">{pet.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded uppercase tracking-wider">{pet.type}</span>
                          {pet.isVerified && <ShieldCheck size={14} className="text-blue-500" />}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-white/40 p-3 rounded-2xl border border-white/50">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Breed</p>
                        <p className="text-xs font-bold text-gray-800 truncate">{pet.breed || "N/A"}</p>
                      </div>
                      <div className="bg-white/40 p-3 rounded-2xl border border-white/50">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Age / Sex</p>
                        <p className="text-xs font-bold text-gray-800">{pet.age}Y • {pet.gender}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPetForID(pet)}
                      className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-200 transition-all border border-amber-300"
                    >
                      <CreditCard size={14} /> {t('profile.officialPetID')}
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-[#9a6458]/20 p-12 text-center">
                <PawPrint size={48} className="text-[#9a6458]/20 mx-auto mb-4" />
                <p className="text-[#5A4035]/60 font-bold">No pets registered yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          {userdata?.subscription?.plan && (userdata.subscription.plan === 'Gold' || userdata.subscription.plan === 'Platinum') && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/40 backdrop-blur-xl p-6 rounded-[3rem] shadow-2xl border border-white/60 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"> <Video size={100} className="text-[#9a6458]" /> </div>
              <div className="relative z-10 text-center">
                <div className="flex items-center gap-3 mb-4 justify-center">
                  <div className="p-2 bg-[#9a6458]/10 rounded-xl text-[#9a6458]"> <Video size={20} /> </div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-[#5A4035]">Video Consultations</span>
                </div>

                <div className="text-4xl font-black text-[#5A4035] mb-2">
                  {Math.max(0, (userdata.subscription.plan === 'Gold' ? 10 : 25) - (userdata.videoCallsUsed || 0))}
                  <span className="text-sm font-bold text-[#5A4035]/40 ml-1">LEFT</span>
                </div>

                <div className="w-full bg-[#9a6458]/10 rounded-full h-2.5 overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((userdata.videoCallsUsed || 0) / (userdata.subscription.plan === 'Gold' ? 10 : 25)) * 100}%` }}
                    className="bg-gradient-to-r from-[#9a6458] to-[#7b483d] h-full"
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#5A4035]/40">
                  Total allowance: {userdata.subscription.plan === 'Gold' ? 10 : 25} credits
                </p>
              </div>
            </motion.div>
          )}

          {nextAppointment && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-[#9a6458] to-[#7b483d] p-6 rounded-[3rem] shadow-2xl text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"> <Calendar size={120} /> </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md text-white"> <Clock size={20} /> </div>
                  <span className="text-xs font-black uppercase tracking-[0.2em]">{t('profile.nextAppointment')}</span>
                </div>
                <h4 className="text-2xl font-black mb-1">Dr. {nextAppointment.docData.name}</h4>
                <p className="text-white/70 text-sm mb-6 flex items-center gap-2"> <Calendar size={14} /> {nextAppointment.slotDate.replace(/_/g, ' ')} • {nextAppointment.slotTime} </p>
                <motion.button onClick={() => navigate('/my-appointments')} className="w-full py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-sm font-black transition-all"> Manage Bookings </motion.button>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/60 backdrop-blur-xl p-8 rounded-[3rem] border border-white shadow-xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-600"> <Heart size={20} fill="#d97706" /> </div>
                <h3 className="font-black text-[#5A4035] uppercase tracking-tighter">Health Tip</h3>
              </div>
              <motion.button onClick={() => setupDailyContentGeneration(true)} disabled={isRefreshingTip} className="p-2 bg-gray-100 rounded-xl text-gray-400 hover:text-[#9a6458] transition-colors">
                <RefreshCw size={16} className={isRefreshingTip ? "animate-spin" : ""} />
              </motion.button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={dailyQuote} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white/50 p-5 rounded-2xl border border-white/50 italic text-[#5A4035] text-sm leading-relaxed"> "{dailyQuote}" </motion.div>
            </AnimatePresence>
            <p className="text-center text-[9px] font-black text-[#5A4035]/30 uppercase tracking-[0.2em] mt-6">Powered by Gemini AI</p>
          </motion.div>

          {editedData.isBanned && (
            <div className="bg-red-50/50 backdrop-blur-sm p-6 rounded-[3rem] border border-red-100 shadow-sm">
              <h4 className="text-xs font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2"> <AlertCircle size={14} /> Account Restricted </h4>
              <div className="bg-white p-4 rounded-2xl border border-red-100 mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-gray-400">Unban Attempts</span>
                  <span className="text-xs font-black text-red-600">{userdata.unbanAttempts || 0}/3</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full" style={{ width: `${((userdata.unbanAttempts || 0) / 3) * 100}%` }} />
                </div>
              </div>
              <button onClick={() => setShowDeleteModal(true)} disabled={userdata.unbanAttempts >= 3} className="w-full py-3 bg-red-600 text-white rounded-2xl font-black text-xs shadow-lg disabled:opacity-50"> Request Appeal </button>
            </div>
          )}

          <div className="bg-red-50/50 backdrop-blur-sm p-6 rounded-[3rem] border border-red-100 shadow-sm">
            <h4 className="text-xs font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2"> <AlertCircle size={14} /> Danger Zone </h4>
            <p className="text-[10px] text-gray-500 mb-4 px-2">Permanently delete your account and all associated data.</p>
            <button onClick={() => setShowDeleteModal(true)} className="w-full py-3 bg-white text-red-600 font-black text-xs rounded-2xl border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"> Request Account Deletion </button>
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
