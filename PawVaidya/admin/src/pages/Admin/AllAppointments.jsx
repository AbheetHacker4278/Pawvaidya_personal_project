import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';

const AllAppointments = () => {
  const { atoken, appointments, cancelappointment, getallappointments } = useContext(AdminContext);
  const { slotDateFormat } = useContext(AppContext);

  const [searchText, setSearchText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [regionCounts, setRegionCounts] = useState({});

  // Fetch all appointments when atoken is available
  useEffect(() => {
    if (atoken) {
      getallappointments();
    }
  }, [atoken, getallappointments]);

  // Filter appointments by search text and selected region
  useEffect(() => {
    if (appointments) {
      const lowerCaseSearchText = searchText.toLowerCase();

      // Filter by name and region
      const filtered = appointments.filter((item) => {
        const matchesSearchText = item.userData.name.toLowerCase().includes(lowerCaseSearchText);
        const matchesRegion = selectedRegion ? item.docData.address.Location === selectedRegion : true;
        return matchesSearchText && matchesRegion;
      });

      setFilteredAppointments(filtered);
    }
  }, [searchText, selectedRegion, appointments]);

  // Calculate region counts
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

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">All Appointments 📅</h2>
        <p className="text-sm md:text-base text-gray-600 mt-2">Manage and track all veterinary appointments</p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Pet Owners
            </label>
            <input
              type="text"
              placeholder="Search by pet owner's name..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Region
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 w-full">
              <p className="text-xs text-blue-600 font-medium">Total Appointments</p>
              <p className="text-lg font-bold text-blue-800">{appointments?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Region Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(regionCounts).map(([region, count]) => (
            <div
              key={region}
              className={`p-3 rounded-lg text-center transition-colors ${
                selectedRegion === region
                  ? 'bg-green-100 border-2 border-green-400'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <p className="text-xs font-medium text-gray-600 truncate">{region}</p>
              <p className="text-lg font-bold text-gray-800">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Appointment Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((item, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-green-300"
            >
            {/* Pet Owner Info */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src={item.userData.image}
                alt={item.userData.name}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gray-100 object-cover border-2 border-white shadow-sm"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCA0QzI5LjUyMjggNCAzNCA4LjQ3NzE1IDM0IDE0QzM0IDE5LjUyMjggMjkuNTIyOCAyNCAyNCAyNEMxOC40NzcyIDI0IDE0IDE5LjUyMjggMTQgMTRDMTQgOC40NzcxNSAxOC40NzcyIDQgMjQgNFoiIGZpbGw9IiM4ODhDNjFBIi8+CjxwYXRoIGQ9Ik0xMC45MDkyIDM0LjkwNThDMTEuNjU2MiAzNC4zOTY3IDEyLjU1MjIgMzQuMTMzMyAxMy40NzE3IDM0LjEzMzNIMzQuNTI4M0M1NS40NDc4IDM0LjEzMzMgMzYuMzQzOCAzNC4zOTY3IDM3LjA5MDggMzQuOTA1OEMzOS4yNzUgMzYuMzMzMyAzNi42NjY3IDQ0IDI0IDQ0QzExLjMzMzMgNDQgOC43MjUgMzYuMzMzMyAxMC45MDkyIDM0LjkwNThaIiBmaWxsPSIjODg4QzYxQSIvPgo8L3N2Zz4K';
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <h3 className="text-base font-semibold text-gray-800 truncate">{item.userData.name}</h3>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium whitespace-nowrap">
                    Pet Owner
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{item.userData.pet_type}</p>
              </div>
            </div>

            {/* Appointment Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500 font-medium">Category</p>
                <p className="text-sm font-medium text-gray-800">{item.userData.category || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500 font-medium">Breed</p>
                <p className="text-sm font-medium text-gray-800">{item.userData.breed || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500 font-medium">Age</p>
                <p className="text-sm font-medium text-gray-800">{item.userData.pet_age || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500 font-medium">Time</p>
                <p className="text-sm font-medium text-gray-800">{item.slotTime}</p>
              </div>
            </div>

            {/* Booking Date */}
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-600 font-medium">Appointment Date</p>
              <p className="text-sm font-semibold text-blue-800">{slotDateFormat(item.slotDate)}</p>
            </div>

            {/* Doctor Info */}
            <div className="border-t border-gray-100 pt-4 mb-4">
              <p className="text-xs font-medium text-gray-500 mb-3">DOCTOR INFORMATION</p>
              <div className="flex items-center gap-3">
                <img
                  src={item.docData.image}
                  alt={item.docData.name}
                  className="w-10 h-10 rounded-full bg-gray-100 object-cover border-2 border-white"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxMEMyNC40MTgzIDEwIDI4IDEzLjU4MTcgMjggMThDMjggMjIuNDE4MyAyNC40MTgzIDI2IDIwIDI2QzE1LjU4MTcgMjYgMTIgMjIuNDE4MyAxMiAxOEMxMiAxMy41ODE3IDE1LjU4MTcgMTAgMjAgMTBaIiBmaWxsPSIjODg4QzYxQSIvPgo8cGF0aCBkPSJNOS4wOTEgMjkuMDg4QzkuNzEzMyAyOC42NjM5IDEwLjQ2IDI4LjQ0NDQgMTEuMjI5NyAyOC40NDQ0SDI4Ljc3MDNDMjkuNTQgMjguNDQ0NCAzMC4yODY3IDI4LjY2MzkgMzAuOTA5IDI5LjA4OEMzMi43MjkgMzAuMjc3OCAzMC41NTU2IDM2LjY2NjcgMjAgMzYuNjY2N0M5LjQ0NDQgMzYuNjY2NyA3LjI3MSAzMC4yNzc4IDkuMDkxIDI5LjA4OFoiIGZpbGw9IiM4ODhDNjFBIi8+Cjwvc3ZnPgo=';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.docData.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      {item.docData.address?.Location || 'Unknown'}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {item.docData.address?.line || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fee and Status */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-xs text-gray-500">Consultation Fee</p>
                <p className="text-lg font-bold text-gray-800">₹{item.amount}</p>
              </div>
              
              <div className="flex flex-col items-end">
                {item.cancelled ? (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    Cancelled
                  </span>
                ) : item.isCompleted ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Completed
                  </span>
                ) : (
                  <button
                    onClick={() => cancelappointment(item._id)}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors duration-200 flex items-center gap-1"
                  >
                    <span>❌</span>
                    Cancel
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-1">ID: {item._id?.slice(-6)}</p>
              </div>
            </div>
          </div>
        ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No appointments found</h3>
            <p className="text-gray-500">
              {searchText || selectedRegion 
                ? 'Try adjusting your search criteria'
                : 'No appointments have been scheduled yet'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllAppointments;
