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
                className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full relative group overflow-hidden"
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

                {/* Info Grid - 2x2 for consistent look */}
                <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Schedule</span>
                    <span className="text-xs font-black text-slate-700">{slotDateFormat(item.slotDate)}</span>
                    <span className="text-[10px] font-bold text-indigo-600 mt-1">{item.slotTime}</span>
                  </div>
                  <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100 flex flex-col">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter mb-1">Consult Fee</span>
                    <span className="text-sm font-black text-indigo-900">₹{item.amount}</span>
                    <span className="text-[8px] font-bold text-indigo-500 mt-1 uppercase">{item.paymentMethod || 'Cash'}</span>
                  </div>
                  <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-100 flex flex-col">
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter mb-1">Category</span>
                    <span className="text-xs font-black text-amber-900 uppercase truncate">{item.userData.category || 'General'}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-2xl flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Short ID</span>
                      <span className="text-[9px] font-mono text-white">#{item._id?.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className="mt-1 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-full opacity-50" />
                    </div>
                  </div>
                </div>

                {/* Assigned Doctor Mini Panel */}
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 mb-6 flex items-center gap-3 group/doc transition-all hover:bg-white hover:shadow-md">
                  <img
                    src={item.docData.image}
                    alt={item.docData.name}
                    className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm grayscale group-hover/doc:grayscale-0 transition-all"
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Assigned Doctor</p>
                    <p className="text-sm font-black text-slate-700 truncate">{item.docData.name}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[12px] opacity-40 group-hover/doc:opacity-100 transition-all">
                    🩺
                  </div>
                </div>

                {/* Action Bar */}
                <div className="mt-auto flex items-center gap-2">
                  {!item.cancelled && !item.isCompleted ? (
                    <button
                      onClick={() => cancelappointment(item._id)}
                      className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      Cancel Engagement
                    </button>
                  ) : (
                    <div className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center ${item.cancelled ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
                      {item.cancelled ? 'Session Revoked' : 'Session Finalized'}
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white cursor-help group/id transition-all hover:bg-indigo-600" title={`Full ID: ${item._id}`}>
                    <span className="text-[10px] font-mono font-bold">{item._id?.slice(-2).toUpperCase()}</span>
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
