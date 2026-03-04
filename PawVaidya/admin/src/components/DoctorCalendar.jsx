import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Calendar, DollarSign, Clock, Bell, X } from 'lucide-react';
import { DoctorContext } from '../context/DoctorContext';
import { toast } from 'react-toastify';

const DoctorCalendar = () => {
  const { dtoken, appointments } = useContext(DoctorContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminders, setReminders] = useState({});
  const [dailyEarnings, setDailyEarnings] = useState({});
  const [reminderForm, setReminderForm] = useState({
    title: '',
    description: '',
    time: '',
    date: '',
    id: null
  });
  const [hoveredDate, setHoveredDate] = useState(null);
  const [appointmentCounts, setAppointmentCounts] = useState({});
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState(null);
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [checkedReminders, setCheckedReminders] = useState(new Set());
  const [hoveredReminder, setHoveredReminder] = useState(null);

  // Calculate daily earnings and appointment counts from appointments
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      const earnings = {};
      const counts = {};

      appointments.forEach(appointment => {
        const dateKey = appointment.slotDate;

        // Count all appointments (not cancelled)
        if (!appointment.cancelled) {
          counts[dateKey] = (counts[dateKey] || 0) + 1;
        }

        // Calculate earnings from completed appointments
        if (appointment.isCompleted && !appointment.cancelled) {
          earnings[dateKey] = (earnings[dateKey] || 0) + parseInt(appointment.amount || 0);
        }
      });

      setDailyEarnings(earnings);
      setAppointmentCounts(counts);
    }
  }, [appointments]);

  // Load reminders from localStorage
  useEffect(() => {
    const savedReminders = localStorage.getItem('doctorReminders');
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }
  }, []);

  // Request notification permission and set up reminder checking
  useEffect(() => {
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check reminders every minute
    const interval = setInterval(checkReminders, 60000);

    // Check immediately
    checkReminders();

    return () => clearInterval(interval);
  }, [reminders, checkedReminders]);

  // Save reminders to localStorage
  const saveReminders = (newReminders) => {
    setReminders(newReminders);
    localStorage.setItem('doctorReminders', JSON.stringify(newReminders));
  };

  // Play continuous reminder sound for 10 seconds with 2-second gaps
  const playReminderSound = () => {
    let soundCount = 0;
    const maxSounds = 5; // Play 5 times over 10 seconds (2s gap between each)

    const playSound = () => {
      if (soundCount >= maxSounds) return;

      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7bVkGwY5kdfy0HkpBSl+yO/eizEIHWq+8+OWT');
      audio.volume = 0.7;

      audio.play().catch(() => {
        // Fallback beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
      });

      soundCount++;

      // Schedule next sound after 2 seconds
      if (soundCount < maxSounds) {
        setTimeout(playSound, 2000);
      }
    };

    // Start playing immediately
    playSound();
  };

  // Check for due reminders
  const checkReminders = () => {
    const now = new Date();
    const currentDateKey = formatDateForInput(now);
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const todayReminders = reminders[currentDateKey] || [];

    todayReminders.forEach(reminder => {
      if (reminder.time && !checkedReminders.has(reminder.id)) {
        if (reminder.time === currentTime) {
          // Show notification
          const notification = {
            id: reminder.id,
            title: reminder.title,
            description: reminder.description,
            time: reminder.time
          };

          setActiveNotifications(prev => [...prev, notification]);
          setCheckedReminders(prev => new Set([...prev, reminder.id]));

          // Play sound
          playReminderSound();

          // Show toast notification
          toast.success(`Reminder: ${reminder.title}`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });

          // Browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification('PawVaidya Reminder', {
              body: `${reminder.title}${reminder.description ? ': ' + reminder.description : ''}`,
              icon: '/favicon.ico'
            });
          }
        }
      }
    });
  };

  // Dismiss notification
  const dismissNotification = (notificationId) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatDateKey = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}_${month}_${year}`;
  };

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setReminderForm({
      ...reminderForm,
      date: formatDateForInput(date),
      id: null
    });
  };

  const handleAddReminder = () => {
    if (!selectedDate) return;
    setShowReminderModal(true);
  };

  const handleSaveReminder = () => {
    if (!reminderForm.title || !reminderForm.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if the selected date is in the past
    const selectedDate = new Date(reminderForm.date);
    if (isPastDate(selectedDate)) {
      toast.error('Cannot add reminders for past dates');
      return;
    }

    const dateKey = reminderForm.date;
    const newReminders = { ...reminders };

    if (!newReminders[dateKey]) {
      newReminders[dateKey] = [];
    }

    if (reminderForm.id) {
      // Update existing reminder
      const index = newReminders[dateKey].findIndex(r => r.id === reminderForm.id);
      if (index !== -1) {
        newReminders[dateKey][index] = {
          ...reminderForm,
          id: reminderForm.id
        };
      }
    } else {
      // Add new reminder
      const newReminder = {
        ...reminderForm,
        id: Date.now().toString()
      };
      newReminders[dateKey].push(newReminder);
    }

    saveReminders(newReminders);
    setShowReminderModal(false);
    setReminderForm({
      title: '',
      description: '',
      time: '',
      date: '',
      id: null
    });
    toast.success('Reminder saved successfully!');
  };

  const handleEditReminder = (reminder, date) => {
    setReminderForm({
      ...reminder,
      date: formatDateForInput(date)
    });
    setSelectedDate(date);
    setShowReminderModal(true);
  };

  const handleDeleteReminder = (reminderId, dateKey) => {
    const newReminders = { ...reminders };
    newReminders[dateKey] = newReminders[dateKey].filter(r => r.id !== reminderId);
    if (newReminders[dateKey].length === 0) {
      delete newReminders[dateKey];
    }
    saveReminders(newReminders);
    toast.success('Reminder deleted successfully!');
  };

  const getDayEarnings = (date) => {
    const dateKey = formatDateKey(date);
    return dailyEarnings[dateKey] || 0;
  };

  const getDayReminders = (date) => {
    const dateKey = formatDateForInput(date);
    return reminders[dateKey] || [];
  };

  const getDayAppointmentCount = (date) => {
    const dateKey = formatDateKey(date);
    return appointmentCounts[dateKey] || 0;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const handleDateDoubleClick = (date) => {
    if (isPastDate(date)) {
      toast.error('Cannot add reminders for past dates');
      return;
    }

    setSelectedDate(date);
    setReminderForm({
      title: '',
      description: '',
      time: '',
      date: formatDateForInput(date),
      id: null
    });
    setShowReminderModal(true);
  };

  const days = getDaysInMonth(currentDate);

  return (
    <motion.div
      className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Calendar Header */}
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <motion.h2
          className="text-2xl font-bold text-gray-800 flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
        >
          <Calendar className="w-6 h-6 text-green-600" />
          Doctor Calendar
        </motion.h2>

        <div className="flex items-center gap-4">
          <motion.button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <motion.h3
            className="text-xl font-semibold text-gray-700 min-w-[200px] text-center"
            key={currentDate.getMonth()}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </motion.h3>

          <motion.button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {daysOfWeek.map((day) => (
          <motion.div
            key={day}
            className="text-center font-semibold text-gray-600 py-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {day}
          </motion.div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 relative">
        {days.map((day, index) => (
          <motion.div
            key={index}
            className={`min-h-[120px] p-2 border rounded-lg cursor-pointer transition-all duration-200 relative ${day
                ? isPastDate(day)
                  ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
                  : isToday(day)
                    ? 'bg-green-100 border-green-300 shadow-md'
                    : selectedDate && day.toDateString() === selectedDate.toDateString()
                      ? 'bg-blue-100 border-blue-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                : 'bg-transparent border-transparent'
              }`}
            onClick={() => day && handleDateClick(day)}
            onDoubleClick={() => day && handleDateDoubleClick(day)}
            onMouseEnter={() => day && setHoveredDate(day)}
            onMouseLeave={() => setHoveredDate(null)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            whileHover={day && !isPastDate(day) ? { scale: 1.02 } : {}}
            title={day && isPastDate(day) ? 'Cannot add reminders for past dates' : day ? 'Double-click to add reminder' : ''}
          >
            {day && (
              <>
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-semibold ${isPastDate(day)
                      ? 'text-gray-400'
                      : isToday(day)
                        ? 'text-green-700'
                        : 'text-gray-700'
                    }`}>
                    {day.getDate()}
                    {isPastDate(day) && (
                      <span className="ml-1 text-xs opacity-50">📅</span>
                    )}
                  </span>
                  {getDayEarnings(day) > 0 && (
                    <motion.div
                      className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <DollarSign className="w-3 h-3" />
                      ₹{getDayEarnings(day)}
                    </motion.div>
                  )}
                </div>

                {/* Reminders */}
                <div className="space-y-1">
                  {getDayReminders(day).slice(0, 2).map((reminder) => (
                    <motion.div
                      key={reminder.id}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs truncate flex items-center justify-between group relative"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.05 }}
                      onMouseEnter={() => setHoveredReminder(reminder)}
                      onMouseLeave={() => setHoveredReminder(null)}
                    >
                      <span className="truncate flex-1">{reminder.title}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit
                          className="w-3 h-3 cursor-pointer hover:text-yellow-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditReminder(reminder, day);
                          }}
                        />
                        <Trash2
                          className="w-3 h-3 cursor-pointer hover:text-red-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReminder(reminder.id, formatDateForInput(day));
                          }}
                        />
                      </div>

                      {/* Reminder Description Tooltip */}
                      {hoveredReminder && hoveredReminder.id === reminder.id && (reminder.description || reminder.time) && (
                        <motion.div
                          className="absolute bottom-full left-0 mb-2 z-20 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-xs whitespace-nowrap max-w-xs"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="space-y-1">
                            <div className="font-semibold">{reminder.title}</div>
                            {reminder.time && (
                              <div className="text-blue-300">⏰ {reminder.time}</div>
                            )}
                            {reminder.description && (
                              <div className="text-gray-300">{reminder.description}</div>
                            )}
                          </div>
                          {/* Tooltip Arrow */}
                          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}

                  {getDayReminders(day).length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{getDayReminders(day).length - 2} more
                    </div>
                  )}
                </div>

                {/* Appointment Count Tooltip */}
                {hoveredDate && hoveredDate.toDateString() === day.toDateString() && getDayAppointmentCount(day) > 0 && (
                  <motion.div
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 z-10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {getDayAppointmentCount(day)} appointment{getDayAppointmentCount(day) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {/* Tooltip Arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Add Reminder Button */}
      {selectedDate && (
        <motion.div
          className="mt-6 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            onClick={handleAddReminder}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            Add Reminder for {selectedDate.toLocaleDateString()}
          </motion.button>
        </motion.div>
      )}

      {/* Reminder Modal */}
      <AnimatePresence>
        {showReminderModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                {reminderForm.id ? 'Edit Reminder' : 'Add Reminder'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={reminderForm.title}
                    onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter reminder title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={reminderForm.description}
                    onChange={(e) => setReminderForm({ ...reminderForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Enter description (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={reminderForm.time}
                    onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={reminderForm.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setReminderForm({ ...reminderForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={() => setShowReminderModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSaveReminder}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {reminderForm.id ? 'Update' : 'Save'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Panel */}
      <AnimatePresence>
        {activeNotifications.length > 0 && (
          <motion.div
            className="fixed top-4 right-4 z-50 space-y-2"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            {activeNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                className="bg-white border-l-4 border-green-500 rounded-lg shadow-lg p-4 max-w-sm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 0.5, repeat: 3 }}
                    >
                      <Bell className="w-5 h-5 text-green-500 mt-0.5" />
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-800">
                        Reminder Alert
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.title}
                      </p>
                      {notification.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.description}
                        </p>
                      )}
                      <p className="text-xs text-green-600 mt-2 font-medium">
                        Time: {notification.time}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => dismissNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DoctorCalendar;
