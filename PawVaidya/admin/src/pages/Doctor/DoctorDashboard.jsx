import React, { useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import assets from '../../assets/assets_admin/assets';
import { AppContext } from '../../context/AppContext';
import { DoctorContext } from '../../context/DoctorContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Gift, Calendar, Award, ShieldCheck } from 'lucide-react';
import DoctorCalendar from '../../components/DoctorCalendar';
import AnalogClock from '../../components/AnalogClock';
import DoctorPollCard from '../../components/DoctorPollCard';

const DoctorDashboard = () => {
  const { dtoken, dashdata, getdashdata, cancelAppointment, completeAppointment, getDoctorReminders } = useContext(DoctorContext);
  const { slotDateFormat } = useContext(AppContext);

  // State for daily earnings and reminders
  const [dailyEarnings, setDailyEarnings] = useState(0);
  const [reminders, setReminders] = useState([]);
  const [activeNotifications, setActiveNotifications] = useState([]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 8
      }
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  const listItemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  // State for search input and filtered appointments
  const [searchInput, setSearchInput] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filteredCancelledAppointments, setFilteredCancelledAppointments] = useState([]);
  const [todayEarnings, setTodayEarnings] = useState([]);
  const [weeklyEarnings, setWeeklyEarnings] = useState([]);
  const [todayBookingsCount, setTodayBookingsCount] = useState(0);
  const [weeklyBookingsCount, setWeeklyBookingsCount] = useState(0);
  const [graphData, setGraphData] = useState([]);

  useEffect(() => {
    if (dtoken) {
      getdashdata();
    }
  }, [dtoken]);

  useEffect(() => {
    if (dashdata) {
      // Filter logic based on search input
      const searchFilter = (appointments) =>
        appointments.filter((item) =>
          item.userData.name.toLowerCase().includes(searchInput.toLowerCase())
        );

      setFilteredAppointments(searchFilter(dashdata.latestAppointments));
      setFilteredCancelledAppointments(searchFilter(dashdata.latestCancelled));

      // Helper to parse slot date (DD_MM_YYYY) to Date object at midnight
      const parseSlotDate = (slotDate) => {
        const [day, month, year] = slotDate.split('_').map(Number);
        return new Date(year, month - 1, day);
      };

      // Get today at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate today's earnings
      const todayCompletedAppointments = dashdata.latestAppointments.filter(appointment => {
        if (!appointment.isCompleted || appointment.cancelled || !appointment.slotDate) return false;
        const appointmentDate = parseSlotDate(appointment.slotDate);
        return appointmentDate.getTime() === today.getTime();
      });

      setTodayEarnings(todayCompletedAppointments);

      // Calculate weekly earnings (last 7 days)
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6); // Last 7 days inclusive

      const weeklyCompletedAppointments = dashdata.latestAppointments.filter(appointment => {
        if (!appointment.isCompleted || appointment.cancelled || !appointment.slotDate) return false;

        const appointmentDate = parseSlotDate(appointment.slotDate);
        return appointmentDate >= weekAgo && appointmentDate <= today;
      });

      setWeeklyEarnings(weeklyCompletedAppointments);

      // --- New Calculations for Bookings & Graph ---

      // 1. Today's Bookings Count (non-cancelled)
      const todayBookings = dashdata.latestAppointments.filter(appointment => {
        if (appointment.cancelled || !appointment.slotDate) return false;
        const appointmentDate = parseSlotDate(appointment.slotDate);
        return appointmentDate.getTime() === today.getTime();
      });
      setTodayBookingsCount(todayBookings.length);

      // 2. Weekly Bookings Count (non-cancelled)
      const weeklyBookings = dashdata.latestAppointments.filter(appointment => {
        if (appointment.cancelled || !appointment.slotDate) return false;
        const appointmentDate = parseSlotDate(appointment.slotDate);
        return appointmentDate >= weekAgo && appointmentDate <= today;
      });
      setWeeklyBookingsCount(weeklyBookings.length);

      // 3. Prepare Graph Data (Last 7 Days)
      const last7DaysData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        // Format date for display (e.g., "Mon", "17 Feb")
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

        // Count bookings for this day
        const daysBookings = dashdata.latestAppointments.filter(appointment => {
          if (appointment.cancelled || !appointment.slotDate) return false;
          const appointmentDate = parseSlotDate(appointment.slotDate);
          return appointmentDate.getTime() === date.getTime();
        });

        last7DaysData.push({
          name: dayName,
          date: dateStr,
          bookings: daysBookings.length
        });
      }
      setGraphData(last7DaysData);

    }
  }, [searchInput, dashdata]);

  return dashdata && (
    <motion.div
      className='m-5'
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Statistics Section */}
      <motion.div
        className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Analog Clock Card */}
        <motion.div
          className='flex items-center gap-2 bg-white p-4 rounded-lg border-2 border-gray-100 cursor-pointer shadow-sm hover:shadow-lg transition-all'
          variants={cardVariants}
          whileHover="hover"
        >
          <AnalogClock />
        </motion.div>

        <motion.div
          className='flex items-center gap-2 bg-white p-4 rounded-lg border-2 border-gray-100 cursor-pointer shadow-sm hover:shadow-lg transition-all'
          variants={cardVariants}
          whileHover="hover"
        >
          <motion.img
            className='w-8'
            src='https://i.ibb.co/BZtjVJp/images-removebg-preview.png'
            alt=""
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <div>
            <motion.p
              className='text-xl font-semibold text-gray-600'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              ₹{dashdata.earnings}
            </motion.p>
            <p className='text-gray-400'>Earnings</p>
          </div>
        </motion.div>

        <motion.div
          className='flex items-center gap-2 bg-white p-4 rounded-lg border-2 border-gray-100 cursor-pointer shadow-sm hover:shadow-lg transition-all'
          variants={cardVariants}
          whileHover="hover"
        >
          <motion.img
            className='w-14'
            src="https://thumbs.dreamstime.com/b/appointment-calendar-date-icon-green-vector-sketch-well-organized-simple-use-commercial-purposes-web-printing-any-type-243330702.jpg"
            alt=""
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <div>
            <motion.p
              className='text-xl font-semibold text-gray-600'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {dashdata.appointments}
            </motion.p>
            <p className='text-gray-400'>Appointments</p>
          </div>
        </motion.div>

        <motion.div
          className='flex items-center gap-2 bg-white p-4 rounded-lg border-2 border-gray-100 cursor-pointer shadow-sm hover:shadow-lg transition-all'
          variants={cardVariants}
          whileHover="hover"
        >
          <motion.img
            className='w-8'
            src="https://cdn0.iconfinder.com/data/icons/green-eco-icons/115/eco_pet-01-512.png"
            alt=""
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <div>
            <motion.p
              className='text-xl font-semibold text-gray-600'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {dashdata.patients}
            </motion.p>
            <p className='text-gray-400'>Pets Info</p>
          </div>
        </motion.div>

        <motion.div
          className='flex items-center gap-2 bg-white p-4 rounded-lg border-2 border-gray-100 cursor-pointer shadow-sm hover:shadow-lg transition-all'
          variants={cardVariants}
          whileHover="hover"
        >
          <motion.div
            className='w-8 h-8 flex items-center justify-center bg-indigo-100 rounded-full text-lg'
            whileHover={{ rotate: 10, scale: 1.1 }}
          >
            📅
          </motion.div>
          <div>
            <motion.p
              className='text-xl font-semibold text-gray-600'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {todayBookingsCount}
            </motion.p>
            <p className='text-gray-400'>Today's Bookings</p>
          </div>
        </motion.div>

        <motion.div
          className='flex items-center gap-2 bg-white p-4 rounded-lg border-2 border-gray-100 cursor-pointer shadow-sm hover:shadow-lg transition-all'
          variants={cardVariants}
          whileHover="hover"
        >
          <motion.div
            className='w-8 h-8 flex items-center justify-center bg-pink-100 rounded-full text-lg'
            whileHover={{ rotate: 10, scale: 1.1 }}
          >
            🗓️
          </motion.div>
          <div>
            <motion.p
              className='text-xl font-semibold text-gray-600'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {weeklyBookingsCount}
            </motion.p>
            <p className='text-gray-400'>Weekly Bookings</p>
          </div>
        </motion.div>

        <motion.div
          className='flex items-center gap-2 bg-white p-4 rounded-lg border-2 border-gray-100 cursor-pointer shadow-sm hover:shadow-lg transition-all'
          variants={cardVariants}
          whileHover="hover"
        >
          <motion.img
            className='w-8'
            src="https://cdn-icons-png.flaticon.com/512/4685/4685242.png"
            alt=""
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <div>
            <motion.p
              className='text-xl font-semibold text-gray-600'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {dashdata.completedAppointmentCount}
            </motion.p>
            <p className='text-gray-400'>Completed Appointments</p>
          </div>
        </motion.div>

        <motion.div
          className='flex items-center gap-2 bg-white p-4 rounded-lg border-2 border-gray-100 cursor-pointer shadow-sm hover:shadow-lg transition-all'
          variants={cardVariants}
          whileHover="hover"
        >
          <motion.img
            className='w-8'
            src="https://e7.pngegg.com/pngimages/914/745/png-clipart-cross-on-a-red-circle-red-cross-on-red-fork-thumbnail.png"
            alt=""
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <div>
            <motion.p
              className='text-xl font-semibold text-gray-600'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {dashdata.canceledAppointmentCount}
            </motion.p>
            <p className='text-gray-400'>Canceled Appointments</p>
          </div>
        </motion.div>

        {/* Average Rating Card */}
        <motion.div
          className='flex items-center gap-2 bg-white p-4 rounded-lg border-2 border-gray-100 cursor-pointer shadow-sm hover:shadow-lg transition-all'
          variants={cardVariants}
          whileHover="hover"
        >
          <motion.div
            className='w-8 h-8 flex items-center justify-center bg-amber-100 rounded-full text-lg'
            whileHover={{ rotate: 10, scale: 1.1 }}
          >
            ⭐
          </motion.div>
          <div>
            <motion.p
              className='text-xl font-semibold text-gray-600'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {dashdata.averageRating ? Number(dashdata.averageRating).toFixed(1) : '0.0'}
            </motion.p>
            <p className='text-gray-400'>Average Rating ({dashdata.totalRatings || 0})</p>
          </div>
        </motion.div>

        {/* Current Incentive/Badge Card */}
        <motion.div
          className={`flex items-center gap-2 p-4 rounded-lg border-2 cursor-pointer shadow-sm hover:shadow-lg transition-all ${dashdata.incentive && dashdata.incentive.type === 'badge'
            ? 'bg-purple-50 border-purple-100'
            : 'bg-white border-gray-100'
            }`}
          variants={cardVariants}
          whileHover="hover"
        >
          <motion.div
            className={`w-8 h-8 flex items-center justify-center rounded-full text-lg ${dashdata.incentive && dashdata.incentive.type === 'badge'
              ? 'bg-purple-100 text-purple-600'
              : 'bg-green-100 text-green-600'
              }`}
            whileHover={{ rotate: 10, scale: 1.1 }}
          >
            {dashdata.incentive && dashdata.incentive.type === 'badge' ? <Award className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
          </motion.div>
          <div>
            <p className='text-sm font-medium text-gray-500'>
              {dashdata.incentive && dashdata.incentive.type === 'badge' ? 'Current Badge' : 'Active Incentive'}
            </p>
            <p className={`text-lg font-bold ${dashdata.incentive && dashdata.incentive.type === 'badge' ? 'text-purple-700' : 'text-gray-800'
              }`}>
              {dashdata.incentive && dashdata.incentive.type !== 'none' ? dashdata.incentive.value : 'None'}
            </p>
            <p className='text-gray-400 text-sm'>
              {dashdata.incentive && dashdata.incentive.type !== 'none' ? dashdata.incentive.message : 'Keep working hard!'}
            </p>
            {dashdata.incentive && dashdata.incentive.expiryDate && (
              <p className='text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium'>
                <Calendar className="w-3 h-3" />
                Expires: {new Date(dashdata.incentive.expiryDate).toLocaleString()}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Doctor Polls Section */}
      <DoctorPollCard />

      {/* Badge History Section */}
      {dashdata.incentiveHistory && dashdata.incentiveHistory.some(item => item.type === 'badge') && (
        <motion.div
          className='mt-8 bg-white p-6 rounded-lg shadow-sm border border-purple-100'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className='text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2'>
            <Award className="w-5 h-5 text-purple-500" />
            Badge History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-50 border-b border-purple-100">
                  <th className="p-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Badge</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Message</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const badgeHistory = dashdata.incentiveHistory.filter(item => item.type === 'badge');
                  const uniqueBadges = badgeHistory.reduce((acc, current) => {
                    const last = acc[acc.length - 1];
                    if (!last) return [current];

                    const isSameValue = String(last.value) === String(current.value);
                    const isExpiredVersion = current.message === `${last.message} (Expired)`;

                    if (isSameValue && isExpiredVersion) {
                      acc.pop();
                      return [...acc, current];
                    }

                    const isSameMessage = last.message === current.message;
                    if (isSameValue && isSameMessage) return acc;

                    return [...acc, current];
                  }, []);

                  return uniqueBadges.slice().reverse().map((item, index) => (
                    <tr key={index} className="border-b border-gray-50 last:border-b-0 hover:bg-purple-50/30 transition-colors">
                      <td className="p-3 text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="p-3 text-sm font-bold text-purple-600 flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-500" />
                        {item.value}
                      </td>
                      <td className="p-3 text-sm text-gray-500">{item.message || '-'}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Incentive History Section */}
      {dashdata.incentiveHistory && dashdata.incentiveHistory.some(item => item.type !== 'badge') && (
        <motion.div
          className='mt-8 bg-white p-6 rounded-lg shadow-sm border border-green-100'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <h3 className='text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2'>
            <Gift className="w-5 h-5 text-green-500" />
            Incentive History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-green-50 border-b border-green-100">
                  <th className="p-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Type</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Value</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Message</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const incentiveHistory = dashdata.incentiveHistory.filter(item => item.type !== 'badge');
                  const uniqueIncentives = incentiveHistory.reduce((acc, current) => {
                    const last = acc[acc.length - 1];
                    if (!last) return [current];

                    const isSameValue = String(last.value) === String(current.value);
                    const isExpiredVersion = current.message === `${last.message} (Expired)`;

                    if (isSameValue && isExpiredVersion) {
                      acc.pop();
                      return [...acc, current];
                    }

                    const isSameMessage = last.message === current.message;
                    if (isSameValue && isSameMessage) return acc;

                    return [...acc, current];
                  }, []);

                  return uniqueIncentives.slice().reverse().map((item, index) => (
                    <tr key={index} className="border-b border-gray-50 last:border-b-0 hover:bg-green-50/30 transition-colors">
                      <td className="p-3 text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="p-3 text-sm font-medium text-gray-700 capitalize flex items-center gap-2">
                        <Gift className="w-4 h-4 text-green-500" />
                        {item.type}
                      </td>
                      <td className="p-3 text-sm font-bold text-green-600">
                        {item.value}
                      </td>
                      <td className="p-3 text-sm text-gray-500">{item.message || '-'}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Attendance History Section */}
      {dashdata.attendanceHistory && dashdata.attendanceHistory.length > 0 && (
        <motion.div
          className='mt-8 bg-white p-6 rounded-lg shadow-sm border border-blue-100'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <h3 className='text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2'>
            <Calendar className="w-5 h-5 text-blue-500" />
            Attendance History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-50 border-b border-blue-100">
                  <th className="p-3 text-sm font-semibold text-gray-600">Date & Time</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Activity</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Face Snapshot</th>
                </tr>
              </thead>
              <tbody>
                {dashdata.attendanceHistory.map((item, index) => (
                  <tr key={index} className="border-b border-gray-50 last:border-b-0 hover:bg-blue-50/30 transition-colors">
                    <td className="p-3 text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </td>
                    <td className="p-3 text-sm font-medium text-gray-700">
                      {item.activityDescription || 'Clock-in'}
                    </td>
                    <td className="p-3 text-sm">
                      {item.faceImage ? (
                        <div className="relative group">
                          <img
                            src={item.faceImage}
                            alt="Scan Snapshot"
                            className="w-12 h-12 object-cover rounded-md border border-gray-200 shadow-sm cursor-pointer transition-transform duration-200 group-hover:scale-[2.5] origin-left z-10 hover:z-50"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">No image recorded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Bookings Graph Section */}
      <motion.div
        className='mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <h3 className='text-lg font-semibold text-gray-700 mb-4'>Weekly Bookings Overview</h3>
        <div className='h-[300px] w-full'>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={graphData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Bar
                dataKey="bookings"
                name="Bookings"
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
                barSize={40}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        className='mt-6'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >
        <motion.input
          type="text"
          className='w-auto px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-green-200 transition-all duration-300'
          placeholder="Search by patient name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          whileFocus={{
            scale: 1.02,
            boxShadow: "0 0 0 3px rgba(34, 197, 94, 0.1)",
            borderColor: "#22c55e"
          }}
          transition={{ type: "spring", stiffness: 300 }}
        />
      </motion.div>

      {/* Bookings and Cancelled Appointments Section */}
      <motion.div
        className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mt-10'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        {/* Latest Bookings */}
        <motion.div
          className='bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300'
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.div
            className='flex items-center gap-2.5 px-4 py-4 rounded-t border bg-gradient-to-r from-green-50 to-green-100'
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.img
              src={assets.list_icon}
              alt=""
              animate={{ rotate: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className='font-semibold text-green-800'>Latest Bookings 🦥</p>
          </motion.div>
          <div className='pt-6 border border-t-0'>
            <AnimatePresence>
              {filteredAppointments.slice(0, 5).map((item, index) => (
                <motion.div
                  className='flex items-center px-6 py-3 gap-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0'
                  key={index}
                  variants={listItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{
                    backgroundColor: "#f9fafb",
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                >
                  <motion.img
                    className='rounded-full w-10 h-10 object-cover border-2 border-white shadow-sm'
                    src={item.userData.image}
                    alt=""
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                  <div className='flex-1 text-sm'>
                    <p className='text-gray-800 font-medium'>{item.userData.name}</p>
                    <p className='text-gray-600 '>Booking on {slotDateFormat(item.slotDate)}</p>
                  </div>
                  {item.cancelled
                    ? <motion.p
                      className='text-red-400 text-xs font-medium'
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      Cancelled
                    </motion.p>
                    : item.isCompleted
                      ? <motion.p
                        className='text-green-500 text-xs font-medium'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        Completed
                      </motion.p>
                      : <motion.div
                        className='flex'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.img
                          onClick={() => cancelAppointment(item._id)}
                          className='w-10 cursor-pointer'
                          src={assets.cancel_icon}
                          alt=""
                          whileHover={{ scale: 1.2, rotate: -5 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        />
                        <motion.img
                          onClick={() => completeAppointment(item._id)}
                          className='w-10 cursor-pointer'
                          src={assets.tick_icon}
                          alt=""
                          whileHover={{ scale: 1.2, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        />
                      </motion.div>
                  }
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Latest Cancelled */}
        <motion.div
          className='bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300'
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.div
            className='flex items-center gap-2.5 px-4 py-4 rounded-t border bg-gradient-to-r from-red-50 to-red-100'
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            <motion.img
              src={assets.list_icon}
              alt=""
              animate={{ rotate: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className='font-semibold text-red-800'>Latest Cancelled 🦥</p>
          </motion.div>
          <div className='pt-4 border border-t-0'>
            <AnimatePresence>
              {filteredCancelledAppointments.slice(0, 5).map((item, index) => (
                <motion.div
                  className='flex items-center px-6 py-3 gap-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0'
                  key={index}
                  variants={listItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                  whileHover={{
                    backgroundColor: "#fef2f2",
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                >
                  <motion.img
                    className='rounded-full w-10 h-10 object-cover border-2 border-white shadow-sm'
                    src={item.userData.image}
                    alt=""
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                  <div className='flex-1 text-sm'>
                    <p className='text-gray-800 font-medium'>{item.userData.name}</p>
                    <p className='text-gray-600 '>Booking on {slotDateFormat(item.slotDate)}</p>
                  </div>
                  <motion.p
                    className='text-red-400 text-xs font-medium'
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    Cancelled
                  </motion.p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Daily Earnings */}
        <motion.div
          className='bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300'
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.div
            className='flex items-center gap-2.5 px-4 py-4 rounded-t border bg-gradient-to-r from-blue-50 to-blue-100'
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
          >
            <motion.img
              src={assets.list_icon}
              alt=""
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className='font-semibold text-blue-800'>Today's Earnings 💰</p>
          </motion.div>
          <div className='pt-4 border border-t-0'>
            <AnimatePresence>
              {todayEarnings.length > 0 ? (
                todayEarnings.slice(0, 5).map((item, index) => (
                  <motion.div
                    className='flex items-center px-6 py-3 gap-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0'
                    key={index}
                    variants={listItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    whileHover={{
                      backgroundColor: "#f0f9ff",
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <motion.img
                      className='rounded-full w-10 h-10 object-cover border-2 border-white shadow-sm'
                      src={item.userData.image}
                      alt=""
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                    <div className='flex-1 text-sm min-w-0'>
                      <p className='text-gray-800 font-medium'>{item.userData.name}</p>
                      <p className='text-gray-600'>Earned on {slotDateFormat(item.slotDate)}</p>
                      {item.discountApplied && (
                        <span
                          className='inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold'
                          style={{ background: '#d1fae5', color: '#065f46' }}
                        >
                          🏷️ {item.discountApplied.code}
                        </span>
                      )}
                    </div>
                    <div className='text-right'>
                      {item.discountApplied && (
                        <p className='text-gray-400 line-through text-xs'>₹{item.discountApplied.originalFee}</p>
                      )}
                      <motion.p
                        className='text-green-600 text-sm font-bold'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        ₹{item.amount}
                      </motion.p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  className='flex items-center justify-center px-6 py-8 text-gray-500'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className='text-center'>
                    <motion.div
                      className='text-4xl mb-2'
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      💰
                    </motion.div>
                    <p className='text-sm font-medium'>No earnings today yet</p>
                    <p className='text-xs text-gray-400'>Complete appointments to see earnings</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Total Today's Earnings */}
            {todayEarnings.length > 0 && (
              <motion.div
                className='px-6 py-3 bg-gradient-to-r from-green-50 to-blue-50 border-t'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-semibold text-gray-700'>Total Today:</span>
                  <motion.span
                    className='text-lg font-bold text-green-600'
                    whileHover={{ scale: 1.1 }}
                  >
                    ₹{todayEarnings.reduce((total, item) => total + (item.amount || 0), 0)}
                  </motion.span>
                </div>
                {todayEarnings.some(i => i.discountApplied) && (
                  <p className='text-xs text-emerald-600 mt-0.5'>
                    🏷️ Discounts applied on {todayEarnings.filter(i => i.discountApplied).length} appointment{todayEarnings.filter(i => i.discountApplied).length !== 1 ? 's' : ''} · Saved ₹{todayEarnings.reduce((s, i) => s + (i.discountApplied ? (i.discountApplied.originalFee - i.amount) : 0), 0)} for patients
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Weekly Earnings */}
        <motion.div
          className='bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300'
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.div
            className='flex items-center gap-2.5 px-4 py-4 rounded-t border bg-gradient-to-r from-purple-50 to-purple-100'
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1 }}
          >
            <motion.img
              src={assets.list_icon}
              alt=""
              animate={{ rotate: [0, 15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className='font-semibold text-purple-800'>Weekly Earnings 📊</p>
          </motion.div>
          <div className='pt-4 border border-t-0'>
            <AnimatePresence>
              {weeklyEarnings.length > 0 ? (
                weeklyEarnings.slice(0, 5).map((item, index) => (
                  <motion.div
                    className='flex items-center px-6 py-3 gap-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0'
                    key={index}
                    variants={listItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    whileHover={{
                      backgroundColor: "#faf5ff",
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <motion.img
                      className='rounded-full w-10 h-10 object-cover border-2 border-white shadow-sm'
                      src={item.userData.image}
                      alt=""
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                    <div className='flex-1 text-sm min-w-0'>
                      <p className='text-gray-800 font-medium'>{item.userData.name}</p>
                      <p className='text-gray-600'>Earned on {slotDateFormat(item.slotDate)}</p>
                      {item.discountApplied && (
                        <span
                          className='inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold'
                          style={{ background: '#ede9fe', color: '#4c1d95' }}
                        >
                          🏷️ {item.discountApplied.code}
                        </span>
                      )}
                    </div>
                    <div className='text-right'>
                      {item.discountApplied && (
                        <p className='text-gray-400 line-through text-xs'>₹{item.discountApplied.originalFee}</p>
                      )}
                      <motion.p
                        className='text-purple-600 text-sm font-bold'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        ₹{item.amount}
                      </motion.p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  className='flex items-center justify-center px-6 py-8 text-gray-500'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className='text-center'>
                    <motion.div
                      className='text-4xl mb-2'
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      📊
                    </motion.div>
                    <p className='text-sm font-medium'>No earnings this week yet</p>
                    <p className='text-xs text-gray-400'>Complete appointments to see weekly earnings</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Total Weekly Earnings */}
            {weeklyEarnings.length > 0 && (
              <motion.div
                className='px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-t'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-semibold text-gray-700'>Total This Week:</span>
                  <motion.span
                    className='text-lg font-bold text-purple-600'
                    whileHover={{ scale: 1.1 }}
                  >
                    ₹{weeklyEarnings.reduce((total, item) => total + (item.amount || 0), 0)}
                  </motion.span>
                </div>
                <div className='text-xs text-gray-500 mt-1'>
                  Last 7 days • {weeklyEarnings.length} appointment{weeklyEarnings.length !== 1 ? 's' : ''}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Calendar Section */}
      <motion.div
        className='mt-10'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.4 }}
      >
        <DoctorCalendar />
      </motion.div>
    </motion.div>
  );
}

export default DoctorDashboard;
