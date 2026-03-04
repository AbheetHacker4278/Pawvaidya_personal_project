import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const GlobalReminderNotifications = () => {
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [checkedReminders, setCheckedReminders] = useState(new Set());

  // Play continuous reminder sound for 10 seconds with 2-second gaps
  const playReminderSound = () => {
    let soundCount = 0;
    const maxSounds = 5; // Play 5 times over 10 seconds (2s gap between each)
    
    const playSound = () => {
      if (soundCount >= maxSounds) return;
      
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7bVkGwY5kdfy0HkpBSl+yO/eizEIHWq+8+OWT');
      audio.volume = 0.8;
      
      audio.play().catch(() => {
        // Fallback beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 850;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1.2);
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

  // Format date for input
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check for due reminders
  const checkReminders = () => {
    const savedReminders = localStorage.getItem('doctorReminders');
    if (!savedReminders) return;

    const reminders = JSON.parse(savedReminders);
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
            time: reminder.time,
            timestamp: Date.now()
          };
          
          setActiveNotifications(prev => [...prev, notification]);
          setCheckedReminders(prev => new Set([...prev, reminder.id]));
          
          // Play continuous sound
          playReminderSound();
          
          // Show toast notification
          toast.success(`🔔 Reminder: ${reminder.title}`, {
            position: "top-right",
            autoClose: 8000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            style: {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: 'bold'
            }
          });
          
          // Browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification('🔔 PawVaidya Reminder Alert', {
              body: `${reminder.title}${reminder.description ? '\n' + reminder.description : ''}\nTime: ${reminder.time}`,
              icon: '/favicon.ico',
              tag: reminder.id,
              requireInteraction: true
            });
          }
        }
      }
    });
  };

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
  }, [checkedReminders]);

  // Dismiss notification
  const dismissNotification = (notificationId) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Auto-dismiss notifications after 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setActiveNotifications(prev => 
        prev.filter(notification => now - notification.timestamp < 30000)
      );
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <AnimatePresence>
      {activeNotifications.length > 0 && (
        <motion.div
          className="fixed top-4 right-4 z-[9999] space-y-3"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
        >
          {activeNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-2xl p-4 max-w-sm border-l-4 border-yellow-400"
              initial={{ opacity: 0, scale: 0.8, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 100 }}
              whileHover={{ scale: 1.02 }}
              layout
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <motion.div
                    animate={{ 
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 0.6, 
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  >
                    <Bell className="w-6 h-6 text-yellow-300 mt-0.5" />
                  </motion.div>
                  <div className="flex-1">
                    <motion.h4 
                      className="text-sm font-bold text-white mb-1"
                      animate={{ opacity: [1, 0.8, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      🚨 REMINDER ALERT
                    </motion.h4>
                    <p className="text-sm font-semibold text-yellow-100 mb-1">
                      {notification.title}
                    </p>
                    {notification.description && (
                      <p className="text-xs text-gray-200 mb-2">
                        {notification.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-yellow-200">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">Time: {notification.time}</span>
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-white hover:text-yellow-300 transition-colors ml-2"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              
              {/* Progress bar */}
              <motion.div 
                className="mt-3 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden"
                initial={{ width: '100%' }}
              >
                <motion.div
                  className="h-full bg-yellow-300"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 30, ease: 'linear' }}
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalReminderNotifications;
