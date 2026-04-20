import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import assets from '../assets/assets_frontend/assets';
import ReleatedDoctors from '../components/ReleatedDoctors';
import { AppContext } from '../context/AppContext';
import { translateSpeciality } from '../utils/translateSpeciality';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Stethoscope, Calendar, CheckCircle, Clock, ArrowRight, X, Loader, MapPin, Award, IndianRupee, Info, Shield, Star, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Appointments = () => {
  const { t } = useTranslation();
  const { docId } = useParams();
  const { doctors, backendurl, token, getdoctorsdata, userdata, userPets, fetchUserPets } = useContext(AppContext);
  const daysofWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const navigate = useNavigate();

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [hasActiveAppointment, setHasActiveAppointment] = useState(false);
  const [activeAppointmentInfo, setActiveAppointmentInfo] = useState(null);
  const [loadingActiveAppointment, setLoadingActiveAppointment] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [showUnbanRequestModal, setShowUnbanRequestModal] = useState(false);
  const [unbanReason, setUnbanReason] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [unbanRequestMessage, setUnbanRequestMessage] = useState('');
  const [hasUnbanRequest, setHasUnbanRequest] = useState(false);
  const [unbanRequestStatus, setUnbanRequestStatus] = useState('');
  const [unbanAttempts, setUnbanAttempts] = useState(0);
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedAdminCoupon, setAppliedAdminCoupon] = useState(null);
  const [appliedDoctorCoupon, setAppliedDoctorCoupon] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [adminCoupons, setAdminCoupons] = useState([]);
  const [useWallet, setUseWallet] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [isStray, setIsStray] = useState(false);
  const [strayType, setStrayType] = useState('Unknown');
  const [showStrayInput, setShowStrayInput] = useState(false);
  const [subscriptionUsage, setSubscriptionUsage] = useState({ count: 0, limit: 0, remaining: 0, plan: 'None' });
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  const loadingMessages = [
    "Checking Available Slots...",
    "We are confirming Your Booking...",
    "Booking is Confirmed!",
    // New messages for cancellation
    "Processing Cancellation Request...",
    "Updating Appointment Records...",
    "Appointment Successfully Cancelled!"
  ];

  const LoadingState = ({ step }) => {
    const icons = [
      <Stethoscope className="w-12 h-12 animate-pulse" style={{ color: '#5A4035' }} />,
      <Calendar className="w-12 h-12 animate-bounce" style={{ color: '#5A4035' }} />,
      <CheckCircle className="w-12 h-12 animate-ping" style={{ color: '#c8860a' }} />
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="p-8 rounded-2xl max-w-md w-full mx-4 shadow-2xl" style={{ background: '#e8d5b0', border: '1px solid #e8d5b0' }}>
          <div className="flex flex-col items-center">
            <div className="mb-4">
              {icons[step]}
            </div>
            <div className="relative w-64 h-2 rounded-full mb-4" style={{ background: '#e8d5b0' }}>
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                style={{ width: `${(step + 1) * 33.33}%`, background: 'linear-gradient(to right, #5A4035, #c8860a)' }}
              />
            </div>
            <p className="text-lg font-medium text-center" style={{ color: '#3d2b1f' }}>
              {loadingMessages[step]}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const CancellationLoadingState = ({ step }) => {
    const icons = [
      <X className="w-12 h-12 text-red-500 animate-pulse" />,
      <Calendar className="w-12 h-12 text-red-500 animate-bounce" />,
      <CheckCircle className="w-12 h-12 text-green-500 animate-ping" />
    ];
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="mb-4">
              {icons[step]}
            </div>
            <div className="relative w-64 h-2 bg-gray-200 rounded-full mb-4">
              <div
                className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all duration-500"
                style={{ width: `${(step + 1) * 33.33}%` }}
              />
            </div>
            <p className="text-lg font-medium text-gray-800 text-center">
              {loadingMessages[step + 3]}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const ActiveAppointmentLoadingState = () => {
    return (
      <div className="mt-4 p-6 bg-gray-100 border border-gray-200 rounded-lg animate-pulse">
        <div className="flex items-center space-x-2">
          <Loader className="w-6 h-6 text-primary animate-spin" />
          <div className="h-4 bg-gray-300 rounded w-48"></div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-3 bg-gray-300 rounded w-full"></div>
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          <div className="h-3 bg-gray-300 rounded w-4/6"></div>
        </div>
        <div className="mt-4 flex gap-3">
          <div className="h-10 bg-gray-300 rounded w-40"></div>
          <div className="h-10 bg-gray-300 rounded w-40"></div>
        </div>
      </div>
    );
  };

  // Fetch subscription usage
  const fetchSubscriptionUsage = async () => {
    if (!token) return;
    setLoadingSubscription(true);
    try {
      const { data } = await axios.get(backendurl + '/api/user/subscription-usage', { headers: { token } });
      if (data.success) {
        setSubscriptionUsage({
          count: data.count,
          limit: data.limit,
          remaining: data.remaining,
          plan: data.plan
        });
      }
    } catch (error) {
      console.error("Error fetching subscription usage:", error.message);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const calculateFinalFee = () => {
    if (!docInfo) return 0;
    let fee = docInfo.fees;

    // Apply incentive if bonus
    if (docInfo.incentive && docInfo.incentive.type === 'bonus' && docInfo.incentive.value && (!docInfo.incentive.expiryDate || new Date(docInfo.incentive.expiryDate) > new Date())) {
      const valStr = String(docInfo.incentive.value).trim();
      if (valStr.includes('%')) {
        const perc = parseFloat(valStr.replace('%', ''));
        if (!isNaN(perc)) fee += (docInfo.fees * perc) / 100;
      } else {
        const val = Number(valStr);
        if (!isNaN(val)) fee += val;
      }
    }

    // Apply subscription discount if within limit
    let subDiscountAmount = 0;
    if (subscriptionUsage.remaining !== 0 && subscriptionUsage.plan !== 'None') {
      let discountPercent = 0;
      if (subscriptionUsage.plan === 'Silver') discountPercent = 10;
      else if (subscriptionUsage.plan === 'Gold') discountPercent = 20;
      else if (subscriptionUsage.plan === 'Platinum') discountPercent = 30;

      subDiscountAmount = Math.round((fee * discountPercent) / 100);
      fee -= subDiscountAmount;
    }

    if (appliedDoctorCoupon) {
      fee -= appliedDoctorCoupon.discountAmount;
    }
    if (appliedAdminCoupon) {
      fee -= (appliedAdminCoupon.amount || appliedAdminCoupon.discountAmount);
    }
    return { finalFee: Math.max(0, fee), subDiscountAmount };
  };

  // Check if user has any active appointments and ban status
  const checkActiveAppointments = async () => {
    if (!token) return;

    setLoadingActiveAppointment(true);
    try {
      // Check user profile for ban status
      const profileRes = await axios.get(backendurl + '/api/user/get-profile', { headers: { token } });

      if (profileRes.data.success && profileRes.data.userdata) {
        // Check if user data has ban information
        const userData = profileRes.data.userdata;
        if (userData.isBanned) {
          setIsBanned(true);
          setBanReason(userData.banReason || 'Policy Violation');
          setUnbanAttempts(userData.unbanRequestAttempts || 0);

          // Check if user has an unban request
          const unbanReqRes = await axios.get(backendurl + `/api/unban-request/my-request/${userData._id || userData.id}`);
          if (unbanReqRes.data.success && unbanReqRes.data.hasRequest) {
            setHasUnbanRequest(true);
            setUnbanRequestStatus(unbanReqRes.data.request.status);
          }
        } else {
          setIsBanned(false);
          setBanReason('');
        }
      }

      const { data } = await axios.get(backendurl + '/api/user/appointments', { headers: { token } });

      if (data.success) {
        // Check if there are any active appointments (not cancelled and not completed)
        const activeAppointments = data.appointments.filter(
          appointment => !appointment.cancelled && !appointment.isCompleted
        );

        if (activeAppointments.length > 0) {
          setHasActiveAppointment(true);
          setActiveAppointmentInfo(activeAppointments[0]);
        } else {
          setHasActiveAppointment(false);
          setActiveAppointmentInfo(null);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingActiveAppointment(false);
    }
  };

  const submitUnbanRequest = async () => {
    if (!unbanRequestMessage.trim()) {
      toast.warn('Please provide a reason for your unban request');
      return;
    }

    try {
      const { data } = await axios.post(
        backendurl + '/api/unban-request/submit',
        {
          requesterType: 'user',
          requesterId: userdata?._id || userdata?.id,
          requestMessage: unbanRequestMessage
        }
      );

      if (data.success) {
        toast.success(data.message);
        setShowUnbanRequestModal(false);
        setUnbanRequestMessage('');
        setHasUnbanRequest(true);
        setUnbanRequestStatus('pending');
        setUnbanAttempts(prev => prev + 1); // Increment attempts
        // Refresh user data to get updated attempts count
        checkActiveAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error submitting unban request:', error);
      toast.error('Failed to submit unban request');
    }
  };

  const fetchDocInfo = async () => {
    const docInfo = doctors.find(doc => doc._id === docId);
    setDocInfo(docInfo);

    // Fetch active public coupons for this doctor
    if (docId) {
      try {
        const { data } = await axios.get(backendurl + `/api/doctor/discounts/public/${docId}`);
        if (data.success) setActiveCoupons(data.discounts);
      } catch (e) {
        // silent — coupons are optional
      }
    }

    // Fetch active admin coupons
    const fetchAdminCoupons = async () => {
      try {
        const { data } = await axios.get(backendurl + '/api/user/admin-coupons', { headers: { token } });
        if (data.success) setAdminCoupons(data.coupons);
      } catch (e) {
        console.error("Error fetching admin coupons", e);
      }
    };
    if (token) fetchAdminCoupons();
  };

  // Fetch doctor's schedule
  const fetchDoctorSchedule = async () => {
    try {
      const { data } = await axios.get(backendurl + `/api/doctor-schedule/public/${docId}`);
      if (data.success) {
        setDoctorSchedules(data.schedules);
      }
    } catch (error) {
      console.error('Error fetching doctor schedule:', error);
    }
  };

  const getAvailableSlots = () => {
    // If user has an active appointment, don't show any slots
    if (hasActiveAppointment) {
      setDocSlots([]);
      return;
    }

    setDocSlots([]);
    const today = new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      const dayName = daysOfWeek[currentDate.getDay()];

      // Find schedule for this day
      const daySchedule = doctorSchedules.find(schedule => schedule.dayOfWeek === dayName && schedule.isActive);

      let timeSlots = [];

      // If doctor has a schedule for this day, use it
      if (daySchedule) {
        const [startHour, startMin] = daySchedule.startTime.split(':').map(Number);
        const [endHour, endMin] = daySchedule.endTime.split(':').map(Number);

        let slotDate = new Date(currentDate);
        slotDate.setHours(startHour, startMin, 0, 0);

        let endTime = new Date(currentDate);
        endTime.setHours(endHour, endMin, 0, 0);

        // For today, skip past slots
        if (i === 0) {
          const now = new Date();
          if (slotDate < now) {
            slotDate = new Date(now);
            // Round up to next slot
            const minutesToAdd = daySchedule.slotDuration - (slotDate.getMinutes() % daySchedule.slotDuration);
            slotDate.setMinutes(slotDate.getMinutes() + minutesToAdd);
            slotDate.setSeconds(0, 0);
          }
        }

        // Generate slots based on schedule
        while (slotDate < endTime) {
          let formattedTime = slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          let day = currentDate.getDate();
          let month = currentDate.getMonth() + 1;
          let year = currentDate.getFullYear();

          const slotDateStr = day + "_" + month + "_" + year;
          const slotTime = formattedTime;

          const isSlotAvailable = docInfo.slots_booked[slotDateStr] && docInfo.slots_booked[slotDateStr].includes(slotTime) ? false : true;

          if (isSlotAvailable) {
            timeSlots.push({
              datetime: new Date(slotDate),
              time: formattedTime
            });
          }

          slotDate.setMinutes(slotDate.getMinutes() + daySchedule.slotDuration);
        }
      } else {
        // Fallback to default slots if no schedule is set (10 AM - 9 PM, 30 min slots)
        let endTime = new Date(currentDate);
        endTime.setHours(21, 0, 0, 0);

        if (i === 0) {
          const now = new Date();
          const startHour = now.getMinutes() > 30 ? now.getHours() + 1 : now.getHours();
          const startMinutes = now.getMinutes() > 30 ? 0 : 30;

          currentDate.setHours(startHour);
          currentDate.setMinutes(startMinutes);
        } else {
          currentDate.setHours(10);
          currentDate.setMinutes(0);
        }

        while (currentDate < endTime) {
          let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          let day = currentDate.getDate();
          let month = currentDate.getMonth() + 1;
          let year = currentDate.getFullYear();

          const slotDate = day + "_" + month + "_" + year;
          const slotTime = formattedTime;

          const isSlotAvailable = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime) ? false : true;

          if (isSlotAvailable) {
            timeSlots.push({
              datetime: new Date(currentDate),
              time: formattedTime
            });
          }

          currentDate.setMinutes(currentDate.getMinutes() + 30);
        }
      }

      setDocSlots(prev => ([...prev, timeSlots]));
    }
  };

  const validateBooking = () => {
    if (hasActiveAppointment) {
      setValidationError('You already have an active appointment. Please complete or cancel it before booking a new one.');
      toast.warn('You already have an active appointment. Please complete or cancel it before booking a new one.');
      return false;
    }

    if (!docSlots[slotIndex]?.[0]?.datetime) {
      setValidationError('Please select an appointment date');
      toast.warn('Please select an appointment date');
      return false;
    }
    if (!slotTime) {
      setValidationError('Please select an appointment time');
      toast.warn('Please select an appointment time');
      return false;
    }

    if (!isStray && !selectedPetId) {
      setValidationError('Please select a pet or choose the stray animal option');
      toast.warn('Please select a pet or choose the stray animal option');
      return false;
    }

    if (isStray && !strayType.trim()) {
      setValidationError('Please enter the pet type for the stray animal');
      return false;
    }
    setValidationError('');
    return true;
  };

  const applyDiscount = async (codeToApply = null) => {
    const code = codeToApply || discountCode;
    if (!code || !code.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    // Check if code is already applied
    if (appliedAdminCoupon?.code === code.trim() || appliedDoctorCoupon?.code === code.trim()) {
      setDiscountError('This coupon is already applied');
      return;
    }

    if (codeToApply) {
      setDiscountCode(codeToApply.trim());
    }

    setDiscountLoading(true);
    setDiscountError('');
    try {
      const { data } = await axios.post(
        backendurl + '/api/user/validate-discount',
        { docId, discountCode: code.trim() },
        { headers: { token } }
      );
      if (data.success) {
        const unifiedDiscount = { ...data.discount, type: data.type };

        if (data.type === 'admin') {
          if (appliedAdminCoupon) {
            toast.warn('An Admin platform coupon is already applied. Replacing it.');
          }
          setAppliedAdminCoupon(unifiedDiscount);
          toast.success(`Platform Coupon applied! You save ₹${data.discount.discountAmount}`);
        } else {
          if (appliedDoctorCoupon) {
            toast.warn('A Doctor discount is already applied. Replacing it.');
          }
          setAppliedDoctorCoupon(unifiedDiscount);
          toast.success(`Doctor Discount applied! You save ${data.discount.discountType === 'percentage' ? data.discount.discountValue + '%' : '₹' + data.discount.discountValue}`);
        }
        setDiscountCode(''); // Clear input for the next coupon
      } else {
        setDiscountError(data.message);
      }
    } catch (error) {
      setDiscountError('Failed to validate discount code');
    } finally {
      setDiscountLoading(false);
    }
  };


  const triggerBooking = () => {
    if (!token) {
      toast.warn('Login to Book Appointment');
      return navigate('/login');
    }
    if (!userdata.isAccountverified) {
      toast.warn('Please Verify Your Account');
      return navigate('/');
    }

    if (userdata && !userdata.isFaceRegistered) {
      toast.warn('Mandatory Biometric Setup Required');
      return navigate('/my-profile');
    }

    if (!validateBooking()) {
      return;
    }

    setShowPaymentModal(true);
  }

  const bookappointment = async (paymentMethod, forceUseWallet = useWallet) => {
    setShowPaymentModal(false);
    setIsLoading(true);
    try {
      const date = docSlots[slotIndex][0].datetime;

      let day = date.getDate();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();

      const slotDate = day + '_' + month + '_' + year;

      setLoadingStep(0);
      await new Promise(resolve => setTimeout(resolve, 1500));

      setLoadingStep(1);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const bookingPayload = {
        docId,
        slotDate,
        slotTime,
        paymentMethod,
        useWallet: forceUseWallet,
        petId: isStray ? null : selectedPetId,
        isStray,
        strayDetails: isStray ? { petType: strayType || 'Unknown' } : null
      };

      if (appliedDoctorCoupon) {
        bookingPayload.discountCode = appliedDoctorCoupon.code;
      }
      if (appliedAdminCoupon) {
        bookingPayload.adminCouponCode = appliedAdminCoupon.code;
      }

      const { data } = await axios.post(
        backendurl + '/api/user/book-appointment',
        bookingPayload,
        { headers: { token } }
      );

      setLoadingStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (data.success) {
        if (paymentMethod === 'Razorpay' && data.order) {
          const options = {
            key: data.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: data.order.amount,
            currency: data.order.currency,
            name: "PawVaidya",
            description: "Appointment Booking",
            order_id: data.order.id,
            theme: { color: "#c8860a" },
            handler: async (response) => {
              try {
                const verifyRes = await axios.post(
                  backendurl + '/api/user/verify-razorpay',
                  {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    appointmentId: data.appointmentData._id
                  },
                  { headers: { token } }
                );
                if (verifyRes.data.success) {
                  toast.success("Payment successful! Booking confirmed.");
                  getdoctorsdata();
                  navigate('/my-appointments');
                } else {
                  toast.error("Payment verification failed. Cancelling appointment...");
                  await axios.post(
                    backendurl + '/api/user/cancel-appointment',
                    { appointmentId: data.appointmentData._id, isPaymentAbort: true },
                    { headers: { token } }
                  );
                  getdoctorsdata();
                  navigate('/my-appointments');
                }
              } catch (err) {
                toast.error(err.message || "Failed verifying payment");
              }
            },
            modal: {
              ondismiss: async function () {
                toast.error("Payment aborted! Cancelling the appointment...");
                try {
                  await axios.post(
                    backendurl + '/api/user/cancel-appointment',
                    { appointmentId: data.appointmentData._id, isPaymentAbort: true },
                    { headers: { token } }
                  );
                } catch (err) {
                  console.error("Cancellation error:", err);
                }
                getdoctorsdata();
                navigate('/my-appointments');
              }
            }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          toast.success(data.message);
          getdoctorsdata();
          navigate('/my-appointments');
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      // Check if it's a ban error (403 status)
      if (error.response?.status === 403) {
        toast.error(error.response.data.message, {
          position: 'top-center',
          autoClose: 5000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            fontWeight: 'bold',
            fontSize: '16px'
          }
        });
      } else {
        toast.error(error.response?.data?.message || error.message);
      }
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  const cancelAppointment = async () => {
    if (!activeAppointmentInfo) return;

    setIsLoading(true);
    try {
      // Set first cancellation loading step
      setLoadingStep(0);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Set second cancellation loading step
      setLoadingStep(1);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data } = await axios.post(
        backendurl + '/api/user/cancel-appointment',
        { appointmentId: activeAppointmentInfo._id },
        { headers: { token } }
      );

      // Set final cancellation loading step
      setLoadingStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (data.success) {
        toast.success('Appointment cancelled successfully');
        setHasActiveAppointment(false);
        setActiveAppointmentInfo(null);
        getdoctorsdata();
        // Refresh available slots after cancellation
        getAvailableSlots();
      } else {
        toast.error(data.message || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || 'Error cancelling appointment');
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  useEffect(() => {
    fetchDocInfo();
    checkActiveAppointments();
    if (docId) {
      fetchDoctorSchedule();
    }
    if (token) {
      checkActiveAppointments();
      fetchSubscriptionUsage();
    }
  }, [backendurl, token, docId]);

  useEffect(() => {
    if (!document.getElementById('razorpay-js')) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.id = 'razorpay-js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (docInfo) {
      getAvailableSlots();
    }
  }, [docInfo, hasActiveAppointment, doctorSchedules]);

  useEffect(() => {
    setValidationError('');
  }, [slotIndex, slotTime]);

  if (isLoading) {
    if (activeAppointmentInfo) {
      return <CancellationLoadingState step={loadingStep} />;
    } else {
      return <LoadingState step={loadingStep} />;
    }
  }

  return docInfo && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="pb-20"
      style={{ background: '#F2E4C6', minHeight: '100vh' }}
    >
      {/* Doctor Info Section */}
      <div className="flex flex-col sm:flex-row gap-6 max-w-7xl mx-auto px-4 pt-10">
        {/* Doctor Image + quick stats */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative group flex flex-col gap-4"
        >
          {/* Image card */}
          <div className="relative overflow-hidden rounded-3xl shadow-2xl w-full sm:max-w-sm">
            <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(90,64,53,0.20), transparent, rgba(200,134,10,0.12))' }} />
            <motion.img
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="w-full h-auto object-cover"
              src={docInfo.image}
              alt={docInfo.name}
            />
            {/* Availability ribbon */}
            <div
              className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg z-20"
              style={{
                background: docInfo.available
                  ? 'linear-gradient(135deg,#16a34a,#22c55e)'
                  : 'linear-gradient(135deg,#6b7280,#9ca3af)',
                color: '#fff',
                boxShadow: docInfo.available ? '0 4px 12px rgba(34,197,94,0.4)' : 'none'
              }}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping absolute" style={{ left: 12 }} />
              <span className="w-2 h-2 rounded-full bg-white relative" />
              {docInfo.available ? 'Available Today' : 'Unavailable'}
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-white/20 to-transparent rounded-tl-full" />
          </div>

          {/* Quick stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="grid grid-cols-3 gap-3 w-full sm:max-w-sm"
          >
            {[
              { label: 'Experience', value: docInfo.experience, icon: '🏅' },
              { label: 'Fee', value: `₹${docInfo.fees}`, icon: '💰' },
              { label: 'Speciality', value: docInfo.speciality?.split(' ')[0], icon: '🩺' },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center py-3 px-2 rounded-2xl text-center"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(232,213,176,0.7)',
                  boxShadow: '0 2px 12px rgba(61,43,31,0.07)'
                }}
              >
                <span className="text-xl mb-1">{icon}</span>
                <p className="text-[11px] font-bold truncate w-full" style={{ color: '#5A4035' }}>{value}</p>
                <p className="text-[10px]" style={{ color: '#a08060' }}>{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Doctor Details Card — modern glassmorphism */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex-1 relative"
        >
          <div
            className="relative overflow-hidden rounded-3xl shadow-2xl h-full"
            style={{
              background: 'rgba(243, 235, 214, 0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(232,213,176,0.7)',
              boxShadow: '0 20px 60px rgba(61,43,31,0.14), 0 4px 16px rgba(61,43,31,0.07)'
            }}
          >
            {/* ── Animated top accent bar ── */}
            <motion.div
              className="h-1.5 w-full"
              style={{ background: 'linear-gradient(90deg, #5A4035, #c8860a, #e8a020, #5A4035)', backgroundSize: '300% 100%' }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            />

            {/* ── Decorative orbs ── */}
            <div className="absolute top-6 right-6 w-28 h-28 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(200,134,10,0.10) 0%, transparent 70%)' }}
            />
            <div className="absolute bottom-10 left-0 w-36 h-36 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(90,64,53,0.07) 0%, transparent 70%)' }}
            />

            <div className="relative z-10 p-8 flex flex-col gap-5">

              {/* ── Name + verified ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-3xl md:text-4xl font-extrabold leading-tight flex items-center gap-3 flex-wrap"
                  style={{ color: '#3d2b1f' }}
                >
                  {docInfo.name}
                  <motion.img
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.7, type: 'spring', stiffness: 260, damping: 14 }}
                    className="w-7 h-7"
                    src={assets.verified_icon}
                    alt="Verified"
                  />
                </h1>
              </motion.div>

              {/* ── Degree + Experience ── */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-3 flex-wrap"
              >
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ background: '#f5ede8', border: '1px solid #e8d5b0' }}
                >
                  <Award className="w-4 h-4 flex-shrink-0" style={{ color: '#c8860a' }} />
                  <span className="text-sm font-semibold" style={{ color: '#5A4035' }}>
                    {docInfo.degree} · {translateSpeciality(docInfo.speciality, t)}
                  </span>
                </div>
                <motion.div
                  whileHover={{ scale: 1.08, y: -2 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-bold shadow-md"
                  style={{ background: 'linear-gradient(135deg, #c8860a, #e8a020)', boxShadow: '0 4px 14px rgba(200,134,10,0.35)' }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🏅
                  </motion.span>
                  {docInfo.experience}
                </motion.div>
              </motion.div>

              {/* ── Divider ── */}
              <div className="h-px rounded-full" style={{ background: 'linear-gradient(to right, #e8d5b0, transparent)' }} />

              {/* ── About ── */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#fff8e6', border: '1px solid #f0d080' }}>
                    <Info className="w-3.5 h-3.5" style={{ color: '#c8860a' }} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#5A4035' }}>About</h3>
                </div>
                <p className="text-[14px] leading-relaxed" style={{ color: '#6b5040' }}>{docInfo.about}</p>
              </motion.div>

              {/* ── Fee row ── */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(200,134,10,0.18)' }}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #fffdf7, #fff8e6)', border: '1.5px solid #f0d080' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #c8860a, #e8a020)', boxShadow: '0 4px 12px rgba(200,134,10,0.3)' }}
                >
                  <IndianRupee className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#a08060' }}>Approx. Treatment Fee</p>
                  <p className="text-2xl font-black leading-tight" style={{ color: '#3d2b1f' }}>₹{docInfo.fees || 'N/A'}</p>
                </div>
                <motion.div
                  className="ml-auto text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: '#dcfce7', color: '#16a34a' }}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Est.
                </motion.div>
              </motion.div>

              {/* ── Location tags ── */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap gap-2"
              >
                {docInfo.address?.Location && (
                  <motion.div
                    whileHover={{ y: -3, scale: 1.04, boxShadow: '0 6px 18px rgba(200,134,10,0.20)' }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold cursor-default transition-all"
                    style={{ background: '#fff8e6', color: '#7a5a48', border: '1.5px solid #f0d080' }}
                  >
                    <MapPin className="w-3.5 h-3.5" style={{ color: '#c8860a' }} />
                    {docInfo.address.Location}
                  </motion.div>
                )}
                {docInfo.address?.line && (
                  <motion.div
                    whileHover={{ y: -3, scale: 1.04, boxShadow: '0 6px 18px rgba(90,64,53,0.12)' }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold cursor-default transition-all"
                    style={{ background: '#f5ede8', color: '#5A4035', border: '1.5px solid #e8d5b0' }}
                  >
                    <MapPin className="w-3.5 h-3.5" style={{ color: '#5A4035' }} />
                    {docInfo.address.line}
                  </motion.div>
                )}
              </motion.div>

              {/* ── Full address ── */}
              {docInfo.full_address && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  whileHover={{ y: -2 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-2xl transition-all"
                  style={{ background: '#fdf8f0', border: '1px dashed #e8d5b0' }}
                >
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: '#c8860a' }} />
                  <p className="text-[13px] leading-relaxed" style={{ color: '#6b5040' }}>{docInfo.full_address}</p>
                </motion.div>
              )}

            </div>
          </div>
        </motion.div>
      </div>


      {/* Booking Slots Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="max-w-7xl mx-auto px-4 mt-10"
      >
        <div
          className="rounded-3xl shadow-2xl overflow-hidden"
          style={{ background: '#f3ebd6', border: '1px solid #e8d5b0' }}
        >
          {/* Premium section header */}
          <div
            className="px-8 py-6 flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, #5A4035 0%, #7a5a48 60%, #5A4035 100%)' }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(200,134,10,0.22)', border: '1px solid rgba(200,134,10,0.35)' }}
            >
              <Calendar className="w-6 h-6" style={{ color: '#f0c060' }} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white leading-tight">Book Your Appointment</h2>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Select a date &amp; time that works for you
              </p>
            </div>
            {/* Decorative circles */}
            <div className="ml-auto flex gap-2 opacity-20">
              <div className="w-12 h-12 rounded-full border-2 border-white" />
              <div className="w-8 h-8 rounded-full border-2 border-white self-end" />
            </div>
          </div>
          <div className="p-8">

            {loadingActiveAppointment ? (
              <ActiveAppointmentLoadingState />
            ) : hasActiveAppointment ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mt-4 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <Calendar className="w-7 h-7 text-yellow-600 mr-3" />
                  </motion.div>
                  <p className="text-yellow-900 font-bold text-xl">Active Appointment</p>
                </div>
                <p className="text-yellow-700 mb-4">You already have an active appointment. Please complete or cancel it before booking a new one.</p>

                {activeAppointmentInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-5 rounded-xl shadow-md mb-4"
                    style={{ background: '#fefcf0', border: '1px solid #e8d5b0' }}
                  >
                    <p className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Appointment Details
                    </p>
                    <div className="space-y-3">
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-3 text-gray-700"
                      >
                        <Stethoscope className="w-5 h-5 text-[#5A4035]" />
                        <span><strong>Doctor:</strong> {activeAppointmentInfo.docData.name}</span>
                      </motion.div>
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-3 text-gray-700"
                      >
                        <Calendar className="w-5 h-5 text-[#5A4035]" />
                        <span><strong>Date:</strong> {activeAppointmentInfo.slotDate?.split('_').join(' / ')}</span>
                      </motion.div>
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-3 text-gray-700"
                      >
                        <Clock className="w-5 h-5 text-[#5A4035]" />
                        <span><strong>Time:</strong> {activeAppointmentInfo.slotTime}</span>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(90,64,53,0.25)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/my-appointments')}
                    className="flex-1 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 group"
                    style={{ background: 'linear-gradient(135deg, #5A4035, #7a5a48)' }}
                  >
                    <Calendar className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    View My Appointments
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(239, 68, 68, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={cancelAppointment}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 group"
                  >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Cancel Appointment
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  {/* Ban Overlay */}
                  {isBanned && (
                    <div className="absolute inset-0 z-50 bg-red-900/90 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center p-6 max-w-lg w-full"
                      >
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                          className="mb-4"
                        >
                          <X className="w-16 h-16 text-white mx-auto" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-white mb-3">
                          Account Banned
                        </h3>
                        <p className="text-lg text-red-100 mb-2 font-semibold">
                          You have been banned for false report of {docInfo.name}
                        </p>
                        <p className="text-base text-red-200 mb-4">
                          Reason: {banReason || 'Policy Violation'}
                        </p>
                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 mb-4">
                          <p className="text-white text-xs leading-relaxed">
                            You cannot book appointments while your account is banned.
                          </p>
                        </div>

                        {/* Unban Request Button */}
                        {unbanAttempts >= 3 ? (
                          <div className="w-full px-4 py-3 bg-red-500/20 border border-red-400 text-red-100 font-semibold rounded-lg text-center">
                            <p className="text-sm">Maximum attempts reached (3/3)</p>
                            <p className="text-xs mt-1">Please contact support directly</p>
                          </div>
                        ) : hasUnbanRequest && unbanRequestStatus === 'pending' ? (
                          <div className="space-y-2">
                            <div className="w-full px-4 py-3 bg-yellow-500/20 border border-yellow-400 text-yellow-100 font-semibold rounded-lg flex items-center justify-center gap-2">
                              <Clock className="w-5 h-5" />
                              Request Pending
                            </div>
                            <p className="text-xs text-white/70 text-center">
                              Attempts used: {unbanAttempts}/3 ({3 - unbanAttempts} remaining)
                            </p>
                          </div>
                        ) : hasUnbanRequest && unbanRequestStatus === 'approved' ? (
                          <div className="space-y-2">
                            <div className="w-full px-4 py-3 bg-green-500/20 border border-green-400 text-green-100 font-semibold rounded-lg flex items-center justify-center gap-2">
                              <CheckCircle className="w-5 h-5" />
                              Request Approved
                            </div>
                            <p className="text-xs text-white/70 text-center mb-4">
                              Your account will be unbanned shortly.
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={checkActiveAppointments}
                              className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg border border-white/30 transition flex items-center justify-center gap-2"
                            >
                              <Loader className="w-4 h-4 animate-spin" />
                              Refresh Status
                            </motion.button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {hasUnbanRequest && unbanRequestStatus === 'denied' && (
                              <div className="w-full px-4 py-3 bg-red-500/20 border border-red-400 text-red-100 font-semibold rounded-lg flex items-center justify-center gap-2 mb-2">
                                <Clock className="w-5 h-5" />
                                Previous Request Denied
                              </div>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setShowUnbanRequestModal(true)}
                              className="w-full px-4 py-3 text-white font-semibold rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
                              style={{ background: 'linear-gradient(135deg, #c8860a, #e8a020)' }}
                            >
                              <CheckCircle className="w-5 h-5" />
                              {hasUnbanRequest && unbanRequestStatus === 'denied' ? 'Request Again' : 'Request Unban'}
                            </motion.button>
                            <p className="text-xs text-white/70 text-center">
                              Attempts used: {unbanAttempts}/3 ({3 - unbanAttempts} remaining)
                            </p>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  )}

                  {/* Unban Request Modal */}
                  {showUnbanRequestModal && (
                    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-2xl font-bold text-gray-800">Request Unban</h3>
                          <button
                            onClick={() => setShowUnbanRequestModal(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                          >
                            <X className="w-6 h-6 text-gray-600" />
                          </button>
                        </div>

                        <p className="text-gray-600 mb-4">
                          Please explain why you believe your ban should be lifted. Admin will review your request.
                        </p>

                        <textarea
                          value={unbanRequestMessage}
                          onChange={(e) => setUnbanRequestMessage(e.target.value)}
                          placeholder="Enter your reason here..."
                          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 resize-none" style={{ borderColor: '#e8d5b0', outlineColor: '#5A4035' }}
                          rows="5"
                        />

                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => setShowUnbanRequestModal(false)}
                            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={submitUnbanRequest}
                            className="flex-1 px-4 py-3 text-white font-semibold rounded-lg hover:shadow-lg transition"
                            style={{ background: 'linear-gradient(135deg, #c8860a, #e8a020)' }}
                          >
                            Submit Request
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Pet Selection Section */}
                  <div className="mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="p-6 rounded-3xl"
                      style={{
                        background: 'rgba(232, 213, 176, 0.45)',
                        backdropFilter: 'blur(10px)',
                        border: '1.5px solid #e8d5b0',
                        boxShadow: '0 8px 32px rgba(90,64,53,0.05)'
                      }}
                    >
                      <p className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: '#3d2b1f' }}>
                        <span className="p-2 rounded-xl bg-[#5A4035] text-white">🐾</span>
                        Who is this appointment for?
                      </p>

                      <div className="flex flex-col gap-6">
                        {/* Toggle between My Pets and Stray */}
                        <div className="flex p-1.5 rounded-2xl bg-gray-100/50 self-start">
                          <button
                            onClick={() => { setIsStray(false); setShowStrayInput(false); }}
                            className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 ${!isStray ? 'bg-[#5A4035] text-white shadow-lg' : 'text-gray-500 hover:text-[#5A4035]'}`}
                          >
                            My Pets
                          </button>
                          <button
                            onClick={() => { setIsStray(true); setShowStrayInput(true); setUseWallet(false); }}
                            className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 ${isStray ? 'bg-[#c8860a] text-white shadow-lg' : 'text-gray-500 hover:text-[#c8860a]'}`}
                          >
                            Stray Animal
                          </button>
                        </div>

                        {!isStray ? (
                          <div className="space-y-4">
                            {userPets && userPets.length > 0 ? (
                              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {userPets.map((pet) => (
                                  <motion.div
                                    key={pet._id}
                                    whileHover={{ y: -5 }}
                                    onClick={() => setSelectedPetId(pet._id)}
                                    className={`relative min-w-[120px] p-4 rounded-2xl cursor-pointer border-2 transition-all flex flex-col items-center gap-3 ${selectedPetId === pet._id ? 'border-[#5A4035] bg-[#5A4035]/5 shadow-md' : 'border-transparent bg-white/50 hover:bg-white'}`}
                                  >
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#e8d5b0]">
                                      <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                                    </div>
                                    <span className={`font-bold text-sm ${selectedPetId === pet._id ? 'text-[#5A4035]' : 'text-gray-600'}`}>{pet.name}</span>
                                    {selectedPetId === pet._id && (
                                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#5A4035] rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                                <motion.div
                                  whileHover={{ y: -5 }}
                                  onClick={() => navigate('/my-pets')}
                                  className="min-w-[120px] p-4 rounded-2xl cursor-pointer border-2 border-dashed border-[#e8d5b0] bg-white/30 flex flex-col items-center justify-center gap-2 hover:bg-white/50 transition-all"
                                >
                                  <div className="w-10 h-10 rounded-full bg-[#5A4035]/10 flex items-center justify-center text-[#5A4035] font-bold text-xl">+</div>
                                  <span className="text-gray-500 font-semibold text-xs text-center">Add New Pet</span>
                                </motion.div>
                              </div>
                            ) : (
                              <div className="text-center py-8 px-4 rounded-2xl bg-white/50 border border-dashed border-[#e8d5b0]">
                                <p className="text-gray-500 mb-4 font-medium italic">No pets found in your profile.</p>
                                <button
                                  onClick={() => navigate('/my-pets')}
                                  className="px-6 py-2 rounded-xl bg-[#5A4035] text-white font-bold text-sm shadow-md"
                                >
                                  Register Your Pet
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/80 p-6 rounded-2xl border-2 border-[#c8860a]/30"
                          >
                            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                              <Info className="w-4 h-4 text-[#c8860a]" />
                              Stray Medical Request
                            </p>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                              Booking for a stray animal helps our clinic track community health cases. Please specify the animal type if known.
                            </p>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-xs font-bold text-[#5A4035] mb-2 uppercase tracking-wider">Animal Species / Type</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Dog, Cat, Bird, Unknown"
                                  value={strayType}
                                  onChange={(e) => setStrayType(e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border-2 border-[#e8d5b0] focus:border-[#c8860a] outline-none transition-all font-medium text-gray-700"
                                />
                              </div>
                              <div className="flex items-center gap-2 px-3 py-2 bg-[#fdf3e7] rounded-lg border border-[#f5e1c8]">
                                <Shield className="w-4 h-4 text-[#c8860a]" />
                                <span className="text-[10px] text-[#8e6b4e] font-semibold">Priority consultation available for critical street rescues.</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {/* Date Selection */}
                  <div className="mb-8">
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      className="text-lg font-semibold mb-4"
                      style={{ color: '#3d2b1f' }}
                    >
                      Select Date
                    </motion.p>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                      {docSlots.map((item, index) => {
                        const dt = item[0]?.datetime;
                        const isSelected = slotIndex === index;
                        const monthStr = dt ? dt.toLocaleString('default', { month: 'short' }).toUpperCase() : 'N/A';
                        const dayNum = dt ? dt.getDate() : 'N/A';
                        const dayName = dt ? daysofWeek[dt.getDay()] : 'N/A';
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.07 * index, type: 'spring', stiffness: 120 }}
                            whileHover={{ y: -6, scale: 1.06 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSlotIndex(index)}
                            className="min-w-[80px] text-center py-5 px-3 rounded-2xl cursor-pointer flex flex-col items-center gap-1"
                            style={isSelected
                              ? {
                                background: 'linear-gradient(145deg, #5A4035, #7a5a48)',
                                color: '#fff',
                                boxShadow: '0 10px 28px rgba(90,64,53,0.38)',
                                border: '2px solid transparent'
                              }
                              : {
                                background: 'rgba(232, 213, 176, 0.55)',
                                border: '2px solid #e8d5b0',
                                color: '#3d2b1f',
                                backdropFilter: 'blur(8px)'
                              }
                            }
                          >
                            {/* Month */}
                            <span
                              className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full"
                              style={isSelected
                                ? { background: 'rgba(200,134,10,0.35)', color: '#f0c060' }
                                : { background: '#f5ede8', color: '#c8860a' }
                              }
                            >
                              {monthStr}
                            </span>
                            {/* Date number */}
                            <span className={`text-3xl font-black leading-none ${isSelected ? 'text-white' : 'text-[#3d2b1f]'}`}>
                              {dayNum}
                            </span>
                            {/* Day name */}
                            <span className={`text-[11px] font-semibold ${isSelected ? 'text-white/80' : 'text-[#7a5a48]'}`}>
                              {dayName}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Selection */}
                  <div className="mb-8">
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      className="text-lg font-semibold mb-4"
                      style={{ color: '#3d2b1f' }}
                    >
                      Select Time Slot
                    </motion.p>
                    <div className="flex flex-wrap gap-3">
                      <AnimatePresence>
                        {docSlots.length &&
                          docSlots[slotIndex]
                            ?.filter((item) => item)
                            .map((item, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: 0.05 * index }}
                                whileHover={{ scale: 1.1, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSlotTime(item.time)}
                                className={`px-6 py-3 rounded-xl cursor-pointer font-semibold transition-all duration-300 ${item.time === slotTime
                                  ? 'bg-gradient-to-r from-[#5A4035] to-[#7a5a48] text-white shadow-xl scale-105'
                                  : 'bg-[#fefcf0]/80 border-2 border-[#5A4035]/60 text-[#5A4035] hover:bg-[#5A4035] hover:text-white hover:shadow-lg'
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  {item.time.toLowerCase()}
                                </div>
                              </motion.div>
                            ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Discount Code Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.85 }}
                    className="mt-7"
                  >
                    {/* Card wrapper with coupon-ticket style */}
                    <div
                      className="rounded-2xl overflow-hidden"
                      style={{
                        border: '2px dashed #d4a76a',
                        background: 'linear-gradient(135deg, #fefcf0 0%, #fdf8eb 100%)',
                        boxShadow: '0 4px 20px rgba(200,134,10,0.08)'
                      }}
                    >
                      {/* Header strip */}
                      <div
                        className="px-5 py-3 flex items-center gap-2.5"
                        style={{ background: 'linear-gradient(135deg, #7a5a48, #5A4035)' }}
                      >
                        <motion.span
                          animate={{ rotate: [0, -10, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                          className="text-lg"
                        >
                          🏷️
                        </motion.span>
                        <p className="text-white font-bold text-sm tracking-wide">
                          HAVE A DISCOUNT CODE?
                        </p>
                      </div>

                      {/* Admin Coupons showcase */}
                      {adminCoupons.length > 0 && (
                        <div className="px-5 pb-1 pt-2">
                          <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#10b981' }}>
                            ✨ Platform Special Offers — subsidized by Admin:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {adminCoupons.map((coupon, i) => (
                              <motion.button
                                key={`admin-${i}`}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.07 }}
                                whileHover={{ scale: 1.06, y: -2, boxShadow: '0 6px 18px rgba(16,185,129,0.22)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => applyDiscount(coupon.code)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                                style={{
                                  background: appliedAdminCoupon?.code === coupon.code
                                    ? 'linear-gradient(135deg,#10b981,#059669)'
                                    : 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                                  border: `1.5px dashed #10b981`,
                                  color: appliedAdminCoupon?.code === coupon.code ? '#fff' : '#047857'
                                }}
                              >
                                <span className="font-mono tracking-wider">{coupon.code}</span>
                                <span
                                  className="px-1.5 py-0.5 rounded-md text-xs"
                                  style={{
                                    background: appliedAdminCoupon?.code === coupon.code ? 'rgba(255,255,255,0.2)' : '#10b981',
                                    color: '#fff'
                                  }}
                                >
                                  {coupon.discountType === 'percentage'
                                    ? `${coupon.discountValue}% OFF`
                                    : `₹${coupon.discountValue} OFF`}
                                </span>
                                <span className="text-emerald-400 font-normal" style={{ fontSize: '10px' }}>
                                  global
                                </span>
                              </motion.button>
                            ))}
                          </div>
                          <div className="my-3 border-t" style={{ borderColor: '#dcfce7' }} />
                        </div>
                      )}

                      {/* Active Coupons Showcase */}
                      {activeCoupons.length > 0 && (
                        <div className="px-5 pb-1 pt-2">
                          <p className="text-xs font-semibold mb-2" style={{ color: '#7a5a48' }}>🎁 Available Offers — click to apply:</p>
                          <div className="flex flex-wrap gap-2">
                            {activeCoupons.map((coupon, i) => (
                              <motion.button
                                key={i}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.07 }}
                                whileHover={{ scale: 1.06, y: -2, boxShadow: '0 6px 18px rgba(200,134,10,0.22)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => applyDiscount(coupon.code)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                                style={{
                                  background: appliedDoctorCoupon?.code === coupon.code
                                    ? 'linear-gradient(135deg,#10b981,#059669)'
                                    : 'linear-gradient(135deg,#fff8ed,#fef3c7)',
                                  border: `1.5px dashed ${appliedDoctorCoupon?.code === coupon.code ? '#10b981' : '#d4a76a'}`,
                                  color: appliedDoctorCoupon?.code === coupon.code ? '#fff' : '#7a5a48'
                                }}
                              >
                                <span className="font-mono tracking-wider">{coupon.code}</span>
                                <span
                                  className="px-1.5 py-0.5 rounded-md text-xs"
                                  style={{
                                    background: appliedDoctorCoupon?.code === coupon.code ? 'rgba(255,255,255,0.2)' : '#7a5a48',
                                    color: '#fff'
                                  }}
                                >
                                  {coupon.discountType === 'percentage'
                                    ? `${coupon.discountValue}% OFF`
                                    : `₹${coupon.discountValue} OFF`}
                                </span>
                                {coupon.expiresAt && (
                                  <span className="text-gray-400 font-normal" style={{ fontSize: '10px' }}>
                                    till {new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </span>
                                )}
                              </motion.button>
                            ))}
                          </div>
                          <div className="my-3 border-t" style={{ borderColor: '#e8d5b0' }} />
                        </div>
                      )}

                      {/* Input area */}
                      <div className="px-5 py-4">
                        <div className="flex gap-3 mb-4">
                          {/* Code input */}
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={discountCode}
                              onChange={(e) => {
                                setDiscountCode(e.target.value.toUpperCase());
                                setDiscountError('');
                              }}
                              onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
                              placeholder="e.g. SAVE20, PAWCARE"
                              disabled={appliedAdminCoupon && appliedDoctorCoupon}
                              className="w-full pl-4 pr-10 py-3 rounded-xl font-mono font-bold text-base uppercase focus:outline-none transition-all duration-300"
                              style={{
                                border: `2px solid ${(appliedAdminCoupon && appliedDoctorCoupon) ? '#10b981' : discountError ? '#ef4444' : '#d4a76a'}`,
                                background: (appliedAdminCoupon && appliedDoctorCoupon) ? '#f0fdf4' : '#fff',
                                color: '#3d2b1f',
                                letterSpacing: '0.1em'
                              }}
                            />
                            {/* Clear button */}
                            {discountCode && (
                              <button
                                onClick={() => { setDiscountCode(''); setDiscountError(''); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            {(appliedAdminCoupon && appliedDoctorCoupon) && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                                <CheckCircle className="w-5 h-5" />
                              </span>
                            )}
                          </div>

                          {/* Apply button */}
                          <motion.button
                            whileHover={!discountLoading && !(appliedAdminCoupon && appliedDoctorCoupon) ? { scale: 1.05, boxShadow: '0 8px 20px rgba(200,134,10,0.35)' } : {}}
                            whileTap={!discountLoading && !(appliedAdminCoupon && appliedDoctorCoupon) ? { scale: 0.97 } : {}}
                            onClick={() => applyDiscount()}
                            disabled={discountLoading || !discountCode.trim() || (appliedAdminCoupon && appliedDoctorCoupon)}
                            className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #c8860a, #e8a020)' }}
                          >
                            {discountLoading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Checking...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Apply
                              </>
                            )}
                          </motion.button>
                        </div>

                        {/* Error state */}
                        <AnimatePresence>
                          {discountError && (
                            <motion.div
                              initial={{ opacity: 0, x: -8, height: 0 }}
                              animate={{ opacity: 1, x: 0, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ type: 'spring', stiffness: 400 }}
                              className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4"
                              style={{ background: '#fef2f2', border: '1.5px solid #fca5a5' }}
                            >
                              <span className="text-red-500 flex-shrink-0">
                                <X className="w-4 h-4" />
                              </span>
                              <p className="text-red-600 text-sm font-medium">{discountError}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Success states (Render each applied coupon) */}
                        <div className="flex flex-col gap-3">
                          <AnimatePresence>
                            {[appliedAdminCoupon, appliedDoctorCoupon].filter(Boolean).map((coupon, index) => (
                              <motion.div
                                key={coupon.code}
                                initial={{ opacity: 0, scale: 0.95, height: 0 }}
                                animate={{ opacity: 1, scale: 1, height: 'auto' }}
                                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="rounded-xl overflow-hidden shadow-sm relative group"
                                style={{ border: '1.5px solid #10b981' }}
                              >
                                {/* Remove button explicitly for this coupon */}
                                <button
                                  onClick={() => {
                                    if (coupon.type === 'admin') setAppliedAdminCoupon(null);
                                    else setAppliedDoctorCoupon(null);
                                  }}
                                  className="absolute top-2 right-2 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
                                  title="Remove Coupon"
                                >
                                  <X className="w-4 h-4" />
                                </button>

                                {/* Success header */}
                                <div
                                  className="px-4 py-2 flex items-center justify-between"
                                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                                >
                                  <div className="flex items-center gap-2">
                                    <motion.span
                                      initial={{ scale: 0, rotate: -180 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                                    >
                                      ✅
                                    </motion.span>
                                    <p className="text-white font-bold text-sm">
                                      {coupon.type === 'admin' ? 'Platform Coupon Applied!' : 'Doctor Discount Applied!'}
                                    </p>
                                  </div>
                                </div>

                                {/* Price breakdown */}
                                <div className="px-4 py-3" style={{ background: '#f0fdf4' }}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-emerald-800 font-bold text-base">
                                        {coupon.discountType === 'percentage'
                                          ? `${coupon.discountValue}% OFF`
                                          : `₹${coupon.discountValue} OFF`}
                                      </p>
                                      <p className="text-emerald-600 text-xs mt-0.5 flex flex-col gap-0.5">
                                        <span>Code: <span className="font-mono font-bold tracking-wider">{coupon.code}</span></span>
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <motion.p
                                        initial={{ scale: 0.5 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 400, delay: 0.2 }}
                                        className="text-emerald-700 font-black text-xl"
                                      >
                                        -{coupon.type === 'admin' ? `₹${coupon.amount || coupon.discountAmount}` : (coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`)}
                                      </motion.p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>

                        {/* Helper text */}
                        {!(appliedAdminCoupon && appliedDoctorCoupon) && !discountError && (
                          <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: '#a08060' }}>
                            💡 <span className="font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Pro Tip:</span> You can apply up to TWO coupons (1 Platform + 1 Doctor)
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Subscription Benefits Showcase */}
                  {subscriptionUsage.plan !== 'None' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 }}
                      className="mt-7 p-6 rounded-2xl relative overflow-hidden group border"
                      style={{
                        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
                      }}
                    >
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors duration-500" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -ml-12 -mb-12 group-hover:bg-purple-500/20 transition-colors duration-500" />

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            </div>
                            <div>
                              <p className="text-white font-black text-sm tracking-wide uppercase">
                                {subscriptionUsage.plan} PLAN BENEFITS
                              </p>
                              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Active Member Status</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="px-3 py-1 bg-emerald-500/20 rounded-full backdrop-blur-md border border-emerald-500/30">
                              <p className="text-emerald-400 font-black text-xs">
                                {subscriptionUsage.plan === 'Silver' ? '10%' : subscriptionUsage.plan === 'Gold' ? '20%' : '30%'} DISCOUNT
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Usage Visualizer */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <p className="text-slate-300 text-xs font-bold">Weekly Discount Qty</p>
                            <p className="text-white text-xs font-black">
                              {subscriptionUsage.count} / {subscriptionUsage.limit === 'Unlimited' ? '∞' : subscriptionUsage.limit} used
                            </p>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: subscriptionUsage.limit === 'Unlimited' ? '100%' : `${(subscriptionUsage.count / subscriptionUsage.limit) * 100}%` }}
                              transition={{ duration: 1.5, ease: "circOut" }}
                              className="h-full rounded-full"
                              style={{
                                background: 'linear-gradient(to right, #3b82f6, #a855f7)'
                              }}
                            />
                          </div>
                          <div className="flex items-start gap-2 pt-1">
                            <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <p className="text-slate-400 text-[10px] font-semibold leading-relaxed">
                              {subscriptionUsage.remaining === 0
                                ? "Weekly quota reached. Regular consultation fee will be applied for new bookings."
                                : `Tier-based discount active. You have ${subscriptionUsage.remaining === 'Unlimited' ? 'unlimited' : subscriptionUsage.remaining} more discounted slots this week.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Price Summary Breakdown */}
                  {docInfo && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="mt-6 p-4 rounded-2xl bg-white/40 border border-[#e8d5b0]/50"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 font-medium">Base Fee</span>
                          <span className="text-gray-900 font-bold">₹{docInfo.fees}</span>
                        </div>

                        {calculateFinalFee().subDiscountAmount > 0 && (
                          <div className="flex justify-between text-sm text-emerald-600">
                            <span className="font-medium flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 fill-emerald-500" />
                              Member Discount ({subscriptionUsage.plan})
                            </span>
                            <span className="font-black">-₹{calculateFinalFee().subDiscountAmount}</span>
                          </div>
                        )}

                        {(appliedAdminCoupon || appliedDoctorCoupon) && (
                          <div className="flex justify-between text-sm text-emerald-600">
                            <span className="font-medium">Coupon Savings</span>
                            <span className="font-bold">-₹{(appliedAdminCoupon?.amount || 0) + (appliedDoctorCoupon?.discountAmount || 0)}</span>
                          </div>
                        )}

                        <div className="pt-2 mt-2 border-t border-[#e8d5b0]/50 flex justify-between items-center text-lg">
                          <span className="text-[#3d2b1f] font-black italic">Final Amount</span>
                          <span className="text-[#c8860a] font-black text-xl">₹{calculateFinalFee().finalFee}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Book Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="mt-8"
                  >
                    <motion.button
                      whileHover={slotTime && docSlots[slotIndex]?.[0]?.datetime && (userdata && userdata.isFaceRegistered) ? {
                        boxShadow: '0 24px 48px rgba(200,134,10,0.45)'
                      } : {}}
                      whileTap={slotTime && docSlots[slotIndex]?.[0]?.datetime && (userdata && userdata.isFaceRegistered) ? { scale: 0.98 } : {}}
                      onClick={triggerBooking}
                      disabled={!slotTime || !docSlots[slotIndex]?.[0]?.datetime || (userdata && !userdata.isFaceRegistered)}
                      className="relative w-full py-5 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 overflow-hidden transition-all duration-300"
                      style={!slotTime || !docSlots[slotIndex]?.[0]?.datetime || (userdata && !userdata.isFaceRegistered)
                        ? { background: '#e8d5b0', color: '#a08060', cursor: 'not-allowed' }
                        : { background: 'linear-gradient(135deg, #c8860a, #e8a020, #c8860a)', backgroundSize: '200%', color: '#fff', boxShadow: '0 10px 28px rgba(200,134,10,0.32)' }
                      }
                    >
                      {/* Shimmer sweep */}
                      {slotTime && docSlots[slotIndex]?.[0]?.datetime && (
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)' }}
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
                        />
                      )}
                      <CheckCircle className="w-6 h-6 relative z-10" />
                      <span className="relative z-10 tracking-wide">Book Appointment</span>
                      <ArrowRight className="w-6 h-6 relative z-10" />
                    </motion.button>

                    <AnimatePresence>
                      {userdata && !userdata.isFaceRegistered && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3"
                        >
                          <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-red-900 font-bold text-sm">Action Required: Biometric Setup</p>
                            <p className="text-red-700 text-xs">Face registration is mandatory for booking. <span className="underline cursor-pointer font-bold" onClick={() => navigate('/my-profile')}>Setup in Profile</span></p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {validationError && (
                        <motion.p
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="text-red-500 font-medium mt-3 flex items-center gap-2"
                        >
                          <X className="w-5 h-5" />
                          {validationError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>{/* /p-8 */}
        </div>
      </motion.div>

      {/* Payment Selection Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(90,64,53,0.35)', backdropFilter: 'blur(6px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="rounded-[30px] shadow-2xl p-6 sm:p-8 max-w-sm w-full"
              style={{ background: 'rgba(237, 228, 216, 0.95)', border: '2px solid rgba(255,255,255,0.4)' }}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black tracking-tight" style={{ color: '#3d2b1f' }}>Confirm Payment</h3>
                <p className="text-sm mt-1 font-medium" style={{ color: '#7a5a48' }}>How would you like to pay?</p>
              </div>
              <div className="flex flex-col gap-4">
                {/* Wallet Toggle — hidden for stray appointments */}
                {isStray && (
                  <div className="p-4 rounded-2xl border-2 border-amber-300/50 bg-amber-50/50">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 text-base">🚫</span>
                      <p className="text-amber-800 font-bold text-sm">Wallet payments are not available for stray animal appointments.</p>
                    </div>
                    <p className="text-amber-600 text-xs mt-1 ml-7">Please pay via Cash or Card only.</p>
                  </div>
                )}
                {!isStray && userdata && userdata.pawWallet > 0 && (
                  <div
                    className="p-4 rounded-2xl border-2 transition-all cursor-pointer"
                    style={{
                      borderColor: useWallet ? '#c8860a' : '#e8d5b0',
                      background: useWallet ? 'rgba(200,134,10,0.05)' : 'white'
                    }}
                    onClick={() => setUseWallet(!useWallet)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={useWallet ? { rotate: [0, 15, 0] } : {}}
                          className="p-1.5 rounded-lg bg-amber-100 text-amber-600"
                        >
                          <Shield className="w-4 h-4" />
                        </motion.div>
                        <span className="font-bold text-sm" style={{ color: '#3d2b1f' }}>Paw Wallet</span>
                      </div>
                      <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${useWallet ? 'bg-[#c8860a]' : 'bg-gray-200'}`}>
                        <motion.div
                          animate={{ x: useWallet ? 20 : 2 }}
                          className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-xs font-medium text-gray-500">Available: ₹{userdata.pawWallet}</p>
                      {useWallet && (
                        <p className="text-xs font-bold text-amber-600">
                          -{userdata.pawWallet >= calculateFinalFee().finalFee ? 'Full amount covered' : `₹${userdata.pawWallet} deducted`}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Main Action Buttons */}
                {useWallet && userdata.pawWallet >= calculateFinalFee().finalFee ? (
                  <button
                    onClick={() => bookappointment("Wallet", true)}
                    className="w-full flex justify-center items-center gap-2 py-4 rounded-xl font-extrabold text-white transition-all shadow-lg active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #c8860a, #e8a020)' }}
                  >
                    Pay FULL Amount via Wallet
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => bookappointment("Razorpay")}
                      className="w-full flex justify-center items-center gap-2 py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.03]"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}
                    >
                      <Shield className="w-5 h-5" />
                      {useWallet ? `Pay Remaining ₹${Math.max(0, (appliedAdminCoupon || appliedDoctorCoupon ? (appliedAdminCoupon ? (appliedDoctorCoupon ? (docInfo.fees - appliedDoctorCoupon.discountAmount - appliedAdminCoupon.amount) : (docInfo.fees - appliedAdminCoupon.amount)) : (docInfo.fees - appliedDoctorCoupon.discountAmount)) : docInfo.fees) - userdata.pawWallet)} Online` : "Pay Online Now"}
                    </button>
                    <button
                      onClick={() => bookappointment("Cash")}
                      className="w-full flex justify-center items-center gap-2 py-4 rounded-xl font-bold transition-all hover:scale-[1.03]"
                      style={{ border: '2px solid #d4a76a', color: '#c8860a', background: 'rgba(255,255,255,0.7)' }}
                    >
                      <CheckCircle className="w-5 h-5" />
                      {useWallet ? `Pay Remaining ₹${Math.max(0, (appliedAdminCoupon || appliedDoctorCoupon ? (appliedAdminCoupon ? (appliedDoctorCoupon ? (docInfo.fees - appliedDoctorCoupon.discountAmount - appliedAdminCoupon.amount) : (docInfo.fees - appliedAdminCoupon.amount)) : (docInfo.fees - appliedAdminCoupon.amount)) : docInfo.fees) - userdata.pawWallet)} at Clinic` : "Pay Cash at Clinic"}
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="mt-6 w-full font-medium text-sm underline opacity-80 hover:opacity-100 transition-opacity"
                style={{ color: '#7a5a48' }}
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Related Doctors */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <ReleatedDoctors
          docId={docId}
          speciality={docInfo.speciality}
          location={docInfo.address.Location}
          State={docInfo.address.line}
        />
      </motion.div>
    </motion.div>
  );
};

export default Appointments;