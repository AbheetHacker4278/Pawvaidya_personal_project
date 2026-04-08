import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const AllAppointments = () => {
  const { atoken, appointments, cancelappointment, getallappointments } = useContext(AdminContext);
  const { slotDateFormat } = useContext(AppContext);

  const [searchText, setSearchText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [regionCounts, setRegionCounts] = useState({});

  useEffect(() => {
    if (atoken) {
      getallappointments();
    }
  }, [atoken, getallappointments]);

  useEffect(() => {
    if (appointments) {
      const lowerCaseSearchText = searchText.toLowerCase();

      const filtered = appointments.filter((item) => {
        const matchesSearchText = item.userData.name.toLowerCase().includes(lowerCaseSearchText);
        const matchesRegion = selectedRegion ? item.docData.address.Location === selectedRegion : true;
        return matchesSearchText && matchesRegion;
      });

      setFilteredAppointments(filtered);
    }
  }, [searchText, selectedRegion, appointments]);

  useEffect(() => {
    if (appointments) {
      const counts = appointments.reduce((acc, item) => {
        const region = item.docData.address.Location || 'Unknown';
        acc[region] = (acc[region] || 0) + 1;
        return acc;
      }, {});
      setRegionCounts(counts);
    }
  }, [appointments]);

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
    exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }
  };

  const pageVariants = {
    initial: { opacity: 0, x: -20 },
    in: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      initial="initial" animate="in" variants={pageVariants}
      className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8"
    >
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          All Appointments <span className="text-4xl" aria-hidden="true">📅</span>
        </h2>
        <p className="text-base text-gray-500 mt-2 font-medium">Manage and track all veterinary appointments across the network</p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-xl shadow-gray-200/40 transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2 lg:col-span-1">
            <label htmlFor="search-owners" className="block text-sm font-semibold text-gray-700 mb-2">
              Search Pet Owners
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
              <input
                id="search-owners"
                type="text"
                placeholder="Search by pet owner's name..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="filter-region" className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Region
            </label>
            <select
              id="filter-region"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full p-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm font-medium text-gray-700 cursor-pointer"
            >
              <option value="">All Regions</option>
              {Object.keys(regionCounts).map((region) => (
                <option key={region} value={region}>
                  {region} ({regionCounts[region]})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 w-full text-white shadow-lg shadow-blue-500/30 flex flex-col justify-center h-full"
            >
              <p className="text-blue-100 font-medium text-sm">Total Appointments</p>
              <p className="text-3xl font-black mt-1">{appointments?.length || 0}</p>
            </motion.div>
          </div>
        </div>

        {/* Region Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          <AnimatePresence>
            {Object.entries(regionCounts).map(([region, count]) => (
              <motion.button
                key={region}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedRegion(selectedRegion === region ? '' : region)}
                className={`p-3 rounded-xl text-left transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${selectedRegion === region
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-transparent text-white shadow-green-500/30'
                    : 'bg-white border border-gray-200 hover:border-green-400 hover:shadow-md'
                  }`}
              >
                <p className={`text-xs font-semibold truncate ${selectedRegion === region ? 'text-green-100' : 'text-gray-500'}`}>{region}</p>
                <p className={`text-xl font-bold mt-1 ${selectedRegion === region ? 'text-white' : 'text-gray-800'}`}>{count}</p>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Appointment Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((item, index) => (
              <motion.div
                variants={itemVariants}
                layout
                key={item._id || index}
                className="bg-white/80 backdrop-blur-sm border border-gray-200/70 rounded-2xl p-5 md:p-6 shadow-md hover:shadow-xl shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Decorative background glow for card on hover */}
                <div className="absolute -z-10 inset-0 bg-gradient-to-br from-green-50/0 to-emerald-50/0 group-hover:from-green-50/50 group-hover:to-emerald-50/50 transition-colors duration-500" />

                {/* Pet Owner Info */}
                <div className="flex items-center gap-4 mb-5">
                  <motion.div whileHover={{ scale: 1.1, rotate: 5 }}>
                    <img
                      src={item.userData.image}
                      alt={item.userData.name}
                      className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-100 object-cover shadow-sm border border-gray-200"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCA0QzI5LjUyMjggNCAzNCA4LjQ3NzE1IDM0IDE0QzM0IDE5LjUyMjggMjkuNTIyOCAyNCAyNCAyNEMxOC40NzcyIDI0IDE0IDE5LjUyMjggMTQgMTRDMTQgOC40NzcxNSAxOC40NzcyIDQgMjQgNFoiIGZpbGw9IiM4ODhDNjFBIi8+CjxwYXRoIGQ9Ik0xMC45MDkyIDM0LjkwNThDMTEuNjU2MiAzNC4zOTY3IDEyLjU1MjIgMzQuMTMzMyAxMy40NzE3IDM0LjEzMzNIMzQuNTI4M0M1NS40NDc4IDM0LjEzMzMgMzYuMzQzOCAzNC4zOTY3IDM3LjA5MDggMzQuOTA1OEMzOS4yNzUgMzYuMzMzMyAzNi42NjY3IDQ0IDI0IDQ0QzExLjMzMzMgNDQgOC43MjUgMzYuMzMzMyAxMC45MDkyIDM0LjkwNThaIiBmaWxsPSIjODg4QzYxQSIvPgo8L3N2Zz4K';
                      }}
                    />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                      <h3 className="text-lg font-bold text-gray-800 truncate">{item.userData.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-md font-bold uppercase tracking-wider whitespace-nowrap hidden sm:inline-block">
                        Pet Owner
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-0.5">{item.userData.pet_type}</p>
                  </div>
                </div>

                {/* Appointment Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Category</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{item.userData.category || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Breed</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{item.userData.breed || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Age</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{item.userData.pet_age || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Time</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{item.slotTime}</p>
                  </div>
                </div>

                {/* Booking Date */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3 mb-5 flex justify-between items-center">
                  <div>
                    <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">Appointment Date</p>
                    <p className="text-[15px] font-bold text-blue-900 mt-0.5">{slotDateFormat(item.slotDate)}</p>
                  </div>
                  <div className="bg-blue-100/50 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="border-t border-gray-100 pt-5 mb-5 relative">
                  <p className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                    Assigned Doctor
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={item.docData.image}
                      alt={item.docData.name}
                      className="w-12 h-12 rounded-full bg-gray-50 object-cover shadow-sm border border-gray-200"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxMEMyNC40MTgzIDEwIDI4IDEzLjU4MTcgMjggMThDMjggMjIuNDE4MyAyNC40MTgzIDI2IDIwIDI2QzE1LjU4MTcgMjYgMTIgMjIuNDE4MyAxMiAxOEMxMiAxMy41ODE3IDE1LjU4MTcgMTAgMjAgMTBaIiBmaWxsPSIjODg4QzYxQSIvPgo8cGF0aCBkPSJNOS4wOTEgMjkuMDg4QzkuNzEzMyAyOC42NjM5IDEwLjQ2IDI4LjQ0NDQgMTEuMjI5NyAyOC40NDQ0SDI4Ljc3MDNDMjkuNTQgMjguNDQ0NCAzMC4yODY3IDI4LjY2MzkgMzAuOTA5IDI5LjA4OEMzMi43MjkgMzAuMjc3OCAzMC41NTU2IDM2LjY2NjcgMjAgMzYuNjY2N0M5LjQ0NDQgMzYuNjY2NyA3LjI3MSAzMC4yNzc4IDkuMDkxIDI5LjA4OFoiIGZpbGw9IiM4ODhDNjFBIi8+Cjwvc3ZnPgo=';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-800 truncate">{item.docData.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {item.docData.address?.Location || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fee and Status */}
                <div className="bg-gray-50/50 -mx-6 -mb-6 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
                  <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <p className="text-xs font-semibold text-gray-500">Consultation Fee</p>
                    <p className="text-2xl font-black text-gray-900 tracking-tight">₹{item.amount}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${item.payment ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : (item.paymentMethod === 'Razorpay' ? 'bg-orange-50 text-orange-700 border-orange-200' : (item.paymentMethod === 'Wallet' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'))}`}>
                        {item.payment ? 'Paid Online' : (item.paymentMethod === 'Razorpay' ? 'Unpaid Online' : (item.paymentMethod === 'Wallet' ? 'Paid via Wallet' : 'Cash'))}
                      </span>
                    </div>
                    {item.walletDeduction > 0 && (
                      <p className="text-[10px] font-black text-amber-600 mt-1 uppercase tracking-tighter">
                        Wallet: -₹{item.walletDeduction} | Rem: ₹{item.amount}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                    {item.cancelled ? (
                      <span className="px-4 py-2 bg-red-100 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm">
                        Cancelled
                      </span>
                    ) : item.isCompleted ? (
                      <span className="px-4 py-2 bg-green-100 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm">
                        Completed
                      </span>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => cancelappointment(item._id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-red-500/20 focus:ring-4 focus:ring-red-500/30 focus:outline-none transition-colors duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
                        aria-label="Cancel Appointment"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        Cancel
                      </motion.button>
                    )}
                    <p className="text-[10px] font-medium text-gray-400 font-mono">ID:{item._id?.slice(-6)}</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-1 md:col-span-2 xl:col-span-3 text-center py-20 bg-white/50 backdrop-blur-md rounded-3xl border border-dashed border-gray-300 shadow-sm"
            >
              <div className="text-7xl mb-6">📋</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 tracking-tight">No appointments found</h3>
              <p className="text-gray-500 font-medium max-w-sm mx-auto">
                {searchText || selectedRegion
                  ? 'We couldn\'t find any appointments matching your filters. Try adjusting your search criteria.'
                  : 'Your veterinary network has no scheduled appointments at the moment.'
                }
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default AllAppointments;
