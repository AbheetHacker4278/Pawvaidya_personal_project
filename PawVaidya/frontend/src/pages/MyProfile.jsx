import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets_frontend/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from "framer-motion";
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
  Clock,
  Trophy,
  Star,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AnimalHealthChatbot from "../components/AnimalHealthChatbot";

// ─── Stable sub-components (must be at module scope so React doesn't recreate
//     their identity on every parent render — that would unmount/remount inputs
//     and kill focus after every keystroke) ────────────────────────────────────

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

const PetIDCard = ({ data, onClose }) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, rotateY: 90 }}
        animate={{ scale: 1, rotateY: 0 }}
        exit={{ scale: 0.8, rotateY: -90 }}
        transition={{ type: "spring", damping: 15 }}
        className="relative w-full max-w-md aspect-[1.6/1] bg-gradient-to-br from-[#9a6458] via-[#7b483d] to-[#5A4035] rounded-[2rem] shadow-2xl p-8 overflow-hidden border border-white/20 select-none cursor-default"
        onClick={e => e.stopPropagation()}
      >
        {/* Background patterns */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

        <div className="relative z-10 h-full flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <PawPrint className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-white font-black text-xl tracking-tighter uppercase italic">PawVaidya</h3>
                <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold">{t('profile.officialPetID')}</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
              <span className="text-white text-[10px] font-black uppercase tracking-wider">{t('profile.verifiedPet')}</span>
            </div>
          </div>

          <div className="flex gap-6 items-center flex-1">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white/20 shadow-xl bg-white/10 shrink-0">
              <img src={data.image} alt="Pet" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white text-2xl font-black truncate drop-shadow-lg mb-1">{data.name}</h4>
              <div className="grid grid-cols-2 gap-y-2">
                <div>
                  <p className="text-white/50 text-[10px] uppercase font-black">{t('profile.species')}</p>
                  <p className="text-white text-xs font-bold">{data.pet_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-white/50 text-[10px] uppercase font-black">{t('profile.breed')}</p>
                  <p className="text-white text-xs font-bold truncate">{data.breed || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-white/50 text-[10px] uppercase font-black">{t('profile.owner')}</p>
                  <p className="text-white text-xs font-bold truncate">{data.name}</p>
                </div>
                <div>
                  <p className="text-white/50 text-[10px] uppercase font-black">{t('profile.idNo')}</p>
                  <p className="text-white text-xs font-mono font-bold">#PV{data.phone?.slice(-4) || '9999'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 flex justify-between items-end border-t border-white/10">
            <div className="flex gap-1">
              {[1, 2, 3].map(i => <Star key={i} size={10} className="text-yellow-400 fill-current" />)}
            </div>
            <p className="text-[10px] text-white/40 font-bold tracking-widest uppercase">{t('profile.premiumMembership')}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-2"
        >
          <AlertCircle size={20} className="rotate-45" />
        </button>
      </motion.div>
    </motion.div>
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
          {/* Decorative background */}
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
  // Initialize Gemini
  const apikey2 = import.meta.env.VITE_API_KEY_GEMINI_2;
  const genAI = new GoogleGenerativeAI(apikey2);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.0-flash' });

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
  } = useContext(AppContext);

  const [isEdit, setIsEdit] = useState(false);
  const [image, setImage] = useState(null);
  const [dailyQuote, setDailyQuote] = useState(t('common.loading'));
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingTip, setIsRefreshingTip] = useState(false);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [showPetID, setShowPetID] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);

  // ✅ local editable copy
  const [editedData, setEditedData] = useState(null);
  const originalDataRef = useRef(null);

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

  // Calculate Profile Completeness
  useEffect(() => {
    if (userdata) {
      const fields = [
        'name', 'email', 'phone', 'gender', 'dob', 'image',
        'full_address', 'pet_type', 'pet_age', 'pet_gender', 'breed'
      ];
      const completed = fields.filter(field => {
        if (field === 'full_address') return userdata.full_address && userdata.full_address.length > 5;
        return !!userdata[field];
      }).length;
      setProfileCompleteness(Math.round((completed / fields.length) * 100));
    }
  }, [userdata]);

  // Fetch Next Appointment
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

  // Constants for tip refresh
  const TIP_REFRESH_INTERVAL = 10 * 60 * 60 * 1000; // 10 hours in milliseconds
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
      "Pet Type": data?.pet_type?.trim(),
      "Pet Age": data?.pet_age?.trim(),
      "Pet Gender": data?.pet_gender?.trim(),
      Breed: data?.breed?.trim(),
      Category: data?.category?.trim(),
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
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Error updating profile"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const setupDailyContentGeneration = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshingTip(true);
      }

      if (!apikey2) {
        setDailyQuote("Daily tip unavailable");
        return;
      }

      // Check if we have a cached tip and if it's still valid (less than 10 hours old)
      const cachedTip = localStorage.getItem(TIP_STORAGE_KEY);
      const cachedTimestamp = localStorage.getItem(TIP_TIMESTAMP_KEY);
      const currentTime = Date.now();

      if (!isManualRefresh && cachedTip && cachedTimestamp) {
        const timeSinceLastUpdate = currentTime - parseInt(cachedTimestamp);

        if (timeSinceLastUpdate < TIP_REFRESH_INTERVAL) {
          // Use cached tip if it's still fresh
          setDailyQuote(cachedTip);
          return;
        }
      }

      // Fetch new tip from Gemini
      const result = await model.generateContent(prompt);
      const newTip = result.response.text() || "No content available.";

      // Save to localStorage with timestamp
      localStorage.setItem(TIP_STORAGE_KEY, newTip);
      localStorage.setItem(TIP_TIMESTAMP_KEY, currentTime.toString());

      setDailyQuote(newTip);
    } catch (error) {
      console.error("Error generating tip:", error);
      // Fallback tip for API failures (503 handling)
      setDailyQuote("Regular check-ups and a balanced diet keep your pet healthy and happy!");
    } finally {
      if (isManualRefresh) {
        setTimeout(() => setIsRefreshingTip(false), 500);
      }
    }
  }, [apikey2, model, prompt, TIP_REFRESH_INTERVAL, TIP_STORAGE_KEY, TIP_TIMESTAMP_KEY]);

  useEffect(() => {
    setupDailyContentGeneration();
  }, [setupDailyContentGeneration]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handleCancelEdit = () => {
    if (originalDataRef.current) {
      setEditedData(originalDataRef.current);
    }
    setIsEdit(false);
    setImage(null);
    originalDataRef.current = null;
  };

  if (!editedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F2E4C6] via-[#f8f3f1] to-[#F2E4C6]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={48} className="text-[#9a6458]" />
        </motion.div>
      </div>
    );
  }

  const normalized = normalizeAddress(editedData.address);

  return (
    <div className="max-w-6xl mx-auto p-4 min-h-screen bg-gradient-to-br from-[#F2E4C6] via-[#f8f3f1] to-[#F2E4C6]">
      <LoadingOverlay isSaving={isSaving} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl mb-6 overflow-hidden border border-white/20">
        <div className="p-6 flex flex-col md:flex-row items-center md:items-start">
          <motion.div
            className="mb-6 md:mb-0 md:mr-8 flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {isEdit ? (
              <label htmlFor="image" className="cursor-pointer block">
                <motion.div
                  className="relative w-40 h-40 rounded-3xl overflow-hidden border-4 border-white shadow-2xl"
                  whileHover={{ scale: 1.02 }}
                >
                  <img
                    className="w-full h-full object-cover"
                    src={
                      image
                        ? URL.createObjectURL(image)
                        : editedData.image
                    }
                    alt="Profile"
                    onError={(e) =>
                    (e.target.src =
                      assets.profile_pic)
                    }
                  />
                  <motion.div
                    className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm"
                    whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                  >
                    <Upload className="w-10 h-10 text-white" />
                  </motion.div>
                </motion.div>
                <input
                  onChange={handleImageChange}
                  type="file"
                  id="image"
                  accept="image/*"
                  hidden
                />
              </label>
            ) : (
              <motion.div
                className="relative group"
                whileHover={{ y: -5 }}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-[#9a6458] to-[#7b483d] rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-40 h-40 rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
                  <img
                    src={editedData.image}
                    alt="Profile"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) =>
                    (e.target.src =
                      assets.profile_pic)
                    }
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
              </motion.div>
            )}

            {/* Profile Completeness Bar (Mobile) */}
            <div className="mt-4 md:hidden w-full">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-[#9a6458]">{t('profile.profileStrength')}</span>
                <span className="text-xs font-bold text-[#9a6458]">{profileCompleteness}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profileCompleteness}%` }}
                  className="bg-gradient-to-r from-[#9a6458] to-[#7b483d] h-full"
                />
              </div>
            </div>
          </motion.div>

          <div className="text-center md:text-left flex-1 min-w-0">
            {isEdit ? (
              <input
                type="text"
                className="text-2xl font-bold border border-gray-300 rounded-lg p-2 mb-2 w-full md:max-w-md"
                value={editedData.name || ""}
                onChange={(e) =>
                  handleInputChange("name", e.target.value)
                }
                placeholder="Enter your name"
              />
            ) : (
              <h1 className="text-2xl font-bold mb-2 break-words">
                {editedData.name}
              </h1>
            )}

            <div className="hidden md:block mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-[#9a6458] uppercase tracking-wider">{t('profile.profileCompleteness')}</span>
                <span className="text-xs font-bold text-[#9a6458]">{profileCompleteness}%</span>
              </div>
              <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profileCompleteness}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-gradient-to-r from-[#9a6458] to-[#7b483d] h-full shadow-[0_0_10px_rgba(154,100,88,0.3)]"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-6">
              <span className="bg-white/60 backdrop-blur-sm text-[#9a6458] px-4 py-1.5 rounded-xl border border-white/50 shadow-sm flex items-center text-sm font-medium">
                <Mail className="w-4 h-4 mr-2" /> {editedData.email}
              </span>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPetID(true)}
                className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-4 py-1.5 rounded-xl shadow-md flex items-center text-sm font-bold border border-yellow-300"
              >
                <Star className="w-4 h-4 mr-2 fill-current" /> {t('profile.premiumPetID')}
              </motion.button>
            </div>

            <AnimatePresence>
              {showPetID && <PetIDCard data={editedData} onClose={() => setShowPetID(false)} />}
            </AnimatePresence>

            <div className="flex gap-4 justify-center md:justify-start">
              <SaveButton
                isEdit={isEdit}
                isSaving={isSaving}
                onSave={updateUserProfileData}
                onEdit={() => setIsEdit(true)}
              />
              {isEdit && (
                <motion.button
                  whileHover={{ scale: 1.05, borderColor: "#7b483d" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancelEdit}
                  className="border-2 border-[#9a6458] text-[#9a6458] px-6 py-2.5 rounded-xl hover:bg-[#f8f3f1]/50 backdrop-blur-sm transition-all duration-300 font-bold shadow-md"
                  disabled={isSaving}
                  type="button"
                >
                  Cancel
                </motion.button>
              )}
            </div>

            {/* Quick Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                    <Activity size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Status</span>
                </div>
                <p className="text-lg font-bold text-gray-800">{editedData.isBanned ? "Restricted" : "Verified"}</p>
              </div>

              <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-green-100 text-green-600">
                    <Shield size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Pet Type</span>
                </div>
                <p className="text-lg font-bold text-gray-800">{editedData.pet_type || "N/A"}</p>
              </div>

              <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                    <Clock size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Experience</span>
                </div>
                <p className="text-lg font-bold text-gray-800">{editedData.pet_age ? `${editedData.pet_age} yrs` : "New"}</p>
              </div>

              <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                    <Zap size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Health Score</span>
                </div>
                <p className="text-lg font-bold text-gray-800">{profileCompleteness}%</p>
              </div>
            </motion.div>
          </div>

          <div className="w-full md:w-1/3 mt-8 md:mt-0 md:ml-8 space-y-6">
            {/* Upcoming Appointment Widget */}
            {nextAppointment && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-[#9a6458] to-[#7b483d] p-5 rounded-3xl shadow-xl text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Calendar size={80} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <Clock size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Next Appointment</span>
                  </div>
                  <h4 className="text-xl font-bold mb-1">Dr. {nextAppointment.docData.name}</h4>
                  <p className="text-white/80 text-sm mb-4">{nextAppointment.slotDate.replace(/_/g, ' ')} • {nextAppointment.slotTime}</p>
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: 'white', color: '#9a6458' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/my-appointments')}
                    className="w-full py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm font-bold transition-all"
                  >
                    View Details
                  </motion.button>
                </div>
              </motion.div>
            )}
            {/* Daily Pet Health Tip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative bg-gradient-to-br from-[#f8f3f1] via-white to-[#f8f3f1] p-5 rounded-2xl border-2 border-[#9a6458]/20 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#9a6458]/5 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#9a6458]/5 rounded-full -ml-12 -mb-12"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                    >
                      <Heart className="text-[#9a6458] mr-2" size={20} fill="#9a6458" />
                    </motion.div>
                    <h3 className="font-bold text-[#9a6458] text-lg flex items-center">
                      Daily Pet Health Tip
                      <Sparkles className="ml-2 w-4 h-4 text-yellow-500" />
                    </h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setupDailyContentGeneration(true)}
                    disabled={isRefreshingTip}
                    className="p-2 rounded-full bg-[#9a6458]/10 hover:bg-[#9a6458]/20 transition-colors disabled:opacity-50"
                    title="Get new tip"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-[#9a6458] ${isRefreshingTip ? 'animate-spin' : ''}`}
                    />
                  </motion.button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={dailyQuote}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-gray-800 italic text-sm leading-relaxed bg-white/50 p-3 rounded-lg backdrop-blur-sm">
                      {dailyQuote}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center text-xs text-[#9a6458]/70">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#9a6458]/30 to-transparent"></div>
                    <span className="px-2">Powered by Gemini AI</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#9a6458]/30 to-transparent"></div>
                  </div>
                  <p className="text-xs text-gray-500 text-center italic">
                    💡 Tips refresh every 10 hours automatically
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Unban Request Attempts */}
            {editedData.isBanned && (
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <div className="flex items-center mb-2">
                  <AlertCircle className="text-red-600 mr-2" size={18} />
                  <h3 className="font-semibold text-red-600">
                    Account Status
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-red-700 font-medium">
                    Account Banned
                  </p>
                  <div className="bg-white p-3 rounded border border-red-200">
                    <p className="text-xs text-gray-600 mb-1">Unban Requests</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-red-600">
                        {editedData.unbanRequestAttempts || 0} / 3
                      </span>
                      <span className="text-xs text-gray-500">
                        {3 - (editedData.unbanRequestAttempts || 0)} left
                      </span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-red-500 h-full transition-all duration-300"
                        style={{ width: `${((editedData.unbanRequestAttempts || 0) / 3) * 100}%` }}
                      />
                    </div>
                  </div>
                  {(editedData.unbanRequestAttempts || 0) >= 3 && (
                    <p className="text-xs text-red-600 italic">
                      Maximum attempts reached. Please contact support.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Owner Info */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/40 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden border border-white/60 p-2"
        >
          <div className="p-6 bg-gradient-to-r from-[#9a6458] to-[#7b483d] text-white flex items-center justify-between rounded-[2rem] shadow-lg mb-2">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-xl mr-3">
                <User size={24} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Owner Profile</h2>
            </div>
            <Sparkles className="text-yellow-400 opacity-50" size={20} />
          </div>
          <div className="p-4 space-y-2">
            <InfoItem
              icon={Phone}
              label="Contact"
              value={editedData.phone}
              isEdit={isEdit}
              editComponent={
                <input
                  type="text"
                  className="bg-white/80 border-2 border-white rounded-2xl p-3 w-full focus:ring-4 focus:ring-[#9a6458]/20 transition-all outline-none"
                  value={editedData.phone || ""}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Enter phone number"
                />
              }
            />

            <InfoItem
              icon={Mail}
              label="Email"
              value={editedData.email}
              isEdit={isEdit}
              editComponent={<p className="font-bold px-3">{editedData.email}</p>}
            />

            <InfoItem
              icon={User}
              label="Gender"
              value={editedData.gender}
              isEdit={isEdit}
              editComponent={
                <select
                  className="bg-white/80 border-2 border-white rounded-2xl p-3 w-full focus:ring-4 focus:ring-[#9a6458]/20 transition-all outline-none"
                  value={editedData.gender || ""}
                  onChange={(e) =>
                    handleInputChange("gender", e.target.value)
                  }
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
                  className="bg-white/80 border-2 border-white rounded-2xl p-3 w-full focus:ring-4 focus:ring-[#9a6458]/20 transition-all outline-none"
                  value={editedData.dob || ""}
                  onChange={(e) =>
                    handleInputChange("dob", e.target.value)
                  }
                  max={new Date().toISOString().split("T")[0]}
                />
              }
            />

            <InfoItem
              icon={MapPin}
              label="Location"
              value={`${normalized.LOCATION || "N/A"}, ${normalized.LINE || "N/A"
                }`}
              isEdit={isEdit}
              editComponent={
                <div className="space-y-3">
                  <input
                    type="text"
                    className="bg-white/80 border-2 border-white rounded-2xl p-3 w-full focus:ring-4 focus:ring-[#9a6458]/20 transition-all outline-none"
                    value={normalized.LOCATION}
                    placeholder="State (e.g., GUJARAT)"
                    onChange={(e) =>
                      handleAddressChange("LOCATION", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className="bg-white/80 border-2 border-white rounded-2xl p-3 w-full focus:ring-4 focus:ring-[#9a6458]/20 transition-all outline-none"
                    value={normalized.LINE}
                    placeholder="District"
                    onChange={(e) =>
                      handleAddressChange("LINE", e.target.value)
                    }
                  />
                </div>
              }
            />
          </div>
        </motion.div>

        {/* Pet Info */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white/40 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden border border-white/60 p-2"
        >
          <div className="p-6 bg-gradient-to-r from-[#9a6458] to-[#7b483d] text-white flex items-center justify-between rounded-[2rem] shadow-lg mb-2">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-xl mr-3">
                <PawPrint size={24} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Pet Details</h2>
            </div>
            <Heart className="text-red-400 animate-pulse" fill="#f87171" size={20} />
          </div>
          <div className="p-4 space-y-2">
            <InfoItem
              icon={PawPrint}
              label="Species"
              value={editedData.pet_type}
              isEdit={isEdit}
              editComponent={
                <input
                  type="text"
                  className="bg-white/80 border-2 border-white rounded-2xl p-3 w-full focus:ring-4 focus:ring-[#9a6458]/20 transition-all outline-none"
                  value={editedData.pet_type || ""}
                  onChange={(e) =>
                    handleInputChange("pet_type", e.target.value)
                  }
                  placeholder="Enter pet type"
                />
              }
            />

            <InfoItem
              icon={Clock}
              label="Age"
              value={editedData.pet_age ? `${editedData.pet_age} Years` : null}
              isEdit={isEdit}
              editComponent={
                <input
                  type="number"
                  min="0"
                  className="bg-white/80 border-2 border-white rounded-2xl p-3 w-full focus:ring-4 focus:ring-[#9a6458]/20 transition-all outline-none"
                  value={editedData.pet_age || ""}
                  onChange={(e) =>
                    handleInputChange("pet_age", e.target.value)
                  }
                  placeholder="Enter pet age"
                />
              }
            />

            <InfoItem
              icon={User}
              label="Sex"
              value={editedData.pet_gender}
              isEdit={isEdit}
              editComponent={
                <select
                  className="bg-white/80 border-2 border-white rounded-2xl p-3 w-full focus:ring-4 focus:ring-[#9a6458]/20 transition-all outline-none"
                  value={editedData.pet_gender || ""}
                  onChange={(e) =>
                    handleInputChange("pet_gender", e.target.value)
                  }
                >
                  <option value="">Select Pet Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              }
            />

            <InfoItem
              icon={AlertCircle}
              label="Breed"
              value={editedData.breed}
              isEdit={isEdit}
              editComponent={
                <input
                  type="text"
                  className="bg-white/80 border-2 border-white rounded-2xl p-3 w-full focus:ring-4 focus:ring-[#9a6458]/20 transition-all outline-none"
                  value={editedData.breed || ""}
                  onChange={(e) =>
                    handleInputChange("breed", e.target.value)
                  }
                  placeholder="Enter breed"
                />
              }
            />

            <InfoItem
              icon={Heart}
              label="Category"
              value={editedData.category}
              isEdit={isEdit}
              editComponent={
                <input
                  type="text"
                  className="bg-white/80 border-2 border-white rounded-2xl p-3 w-full focus:ring-4 focus:ring-[#9a6458]/20 transition-all outline-none"
                  value={editedData.category || ""}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                  placeholder="Enter category"
                />
              }
            />
          </div>
        </motion.div>
      </div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-8 bg-red-50/50 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden border border-red-100 p-2"
      >
        <div className="p-6 bg-gradient-to-r from-red-500 to-red-600 text-white flex items-center justify-between rounded-[2rem] shadow-lg mb-4">
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-xl mr-3">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tighter">Danger Zone</h2>
          </div>
          <Shield className="text-red-200 opacity-50" size={20} />
        </div>
        <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Account</h3>
            <p className="text-sm text-gray-500">Permanently remove your account and all associated pet data. This action is not reversible.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(239, 68, 68, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDeleteModal(true)}
            className="whitespace-nowrap px-8 py-3 bg-white text-red-600 font-bold rounded-2xl border-2 border-red-100 hover:bg-red-50 transition-all shadow-md"
          >
            Request Deletion
          </motion.button>
        </div>
      </motion.div>

      {/* Chatbot Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="mt-8"
      >
        <AnimalHealthChatbot />
      </motion.div>

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <DeletionRequestModal
          onClose={() => setShowDeleteModal(false)}
          onSubmit={handleSubmitDeletion}
          isSubmitting={isSubmittingDeletion}
        />
      )}
    </div>
  );
};

export default MyProfile;
