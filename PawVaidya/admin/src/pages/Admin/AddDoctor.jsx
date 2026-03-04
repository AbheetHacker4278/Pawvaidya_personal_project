import React, { useContext, useState } from 'react';
import { assets } from '../../assets/assets_admin/assets';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const AddDoctor = () => {
  const allowedStates = ['NEW DELHI', 'HARYANA', 'GUJARAT', 'MUMBAI'];
  const [docimg, setdocimg] = useState(null);
  const [name, setname] = useState('');
  const [email, setemail] = useState('');
  const [password, setpassword] = useState('');
  const [experience, setexperience] = useState('1 Year');
  const [fees, setfees] = useState('');
  const [docphone, setdocphone] = useState('');
  const [about, setabout] = useState('');
  const [speciality, setspeciality] = useState('Marine vet');
  const [degree, setdegree] = useState('');
  const [state, setstate] = useState('');
  const [district, setdistrict] = useState('');
  const [full_address, setfull_address] = useState('');
  const [error, setError] = useState('');

  const { backendurl, atoken } = useContext(AdminContext);

  // Handle State Validation
  const handleStateChange = (e) => {
    const value = e.target.value.toUpperCase();
    setstate(value);
    if (!allowedStates.includes(value)) {
      setError('Invalid state. Allowed states: NEW DELHI, HARYANA, GUJARAT, MUMBAI.');
    } else {
      setError('');
    }
  };
  const handleStateChange2 = (e) => {
    const value = e.target.value.toUpperCase();
    setdistrict(value);
  };

  // Submit Handler
  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (!docimg) {
      return toast.error('Image not selected');
    }

    try {
      const formdata = new FormData();
      formdata.append('image', docimg);
      formdata.append('name', name);
      formdata.append('email', email);
      formdata.append('password', password);
      formdata.append('experience', experience);
      formdata.append('fees', fees);
      formdata.append('docphone', docphone);
      formdata.append('about', about);
      formdata.append('speciality', speciality);
      formdata.append('degree', degree);
      formdata.append('address', JSON.stringify({ Location: state, line: district }));
      formdata.append('full_address', full_address);

      const { data } = await axios.post(`${backendurl}/api/admin/add-doctor`, formdata, {
        headers: { atoken },
      });

      if (data.success) {
        toast.success(data.message);
        // Reset form
        setdocimg(null);
        setname('');
        setemail('');
        setpassword('');
        setexperience('1 Year');
        setfees('');
        setabout('');
        setspeciality('Marine vet');
        setdegree('');
        setstate('');
        setdistrict('');
        setfull_address('');
        setdocphone('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="p-4 md:p-6 lg:p-8 w-full min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Add New Doctor</h1>
          <p className="text-sm md:text-base text-gray-600">
            Fill in the details below to add a new veterinary doctor to the system
            <span className="ml-2 text-xs text-green-600 font-medium">(Use uppercase for state names)</span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Image Upload Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-8 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <label htmlFor="doc-img" className="cursor-pointer group relative">
                <div className="w-24 h-24 md:w-28 md:h-28 bg-white rounded-full border-2 border-dashed border-gray-300 group-hover:border-blue-400 transition-all duration-200 flex items-center justify-center overflow-hidden shadow-md">
                  <img
                    className="w-full h-full object-cover"
                    src={docimg ? URL.createObjectURL(docimg) : assets.upload_area}
                    alt="Doctor profile"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00OCA4QzU5LjA0NTcgOCA2OCAxNi45NTQzIDY4IDI4QzY4IDM5LjA0NTcgNTkuMDQ1NyA0OCA0OCA0OEMzNi45NTQzIDQ4IDI4IDM5LjA0NTcgMjggMjhDMjggMTYuOTU0MyAzNi45NTQzIDggNDggOFoiIGZpbGw9IiM4ODhDNjFBIi8+CjxwYXRoIGQ9Ik0yMS44MTg0IDY5LjgxMTZDMjMuMzEyNCA2OC43OTMzIDI1LjEwNDQgNjguMjY2NyAyNi45NDM0IDY4LjI2NjdINjkuMDU2NkM3MC44OTU2IDY4LjI2NjcgNzIuNjg3NiA2OC43OTMzIDc0LjE4MTYgNjkuODExNkM3OC41NSA3Mi42NjY3IDczLjMzMzMgODggNDggODhDMjIuNjY2NyA4OCAxNy40NSA3Mi42NjY3IDIxLjgxODQgNjkuODExNloiIGZpbGw9IiM4ODhDNjFBIi8+Cjwvc3ZnPgo=';
                    }}
                  />
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </label>
              <input onChange={(e) => setdocimg(e.target.files[0])} type="file" id="doc-img" hidden />
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Doctor Profile Photo</h3>
                <p className="text-sm text-gray-600">Upload a clear photo of the doctor</p>
                <p className="text-xs text-gray-500 mt-1">Recommended: Square image, max 2MB</p>
              </div>
            </div>
          </div>

          {/* Form Sections */}
          <div className="p-6 md:p-8">
            {/* Personal Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  👤 Personal Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name *</label>
                    <input
                      onChange={(e) => setname(e.target.value)}
                      value={name}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      type="text"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                      onChange={(e) => setemail(e.target.value)}
                      value={email}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      type="email"
                      placeholder="doctor@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input
                      onChange={(e) => setpassword(e.target.value)}
                      value={password}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      type="password"
                      placeholder="Create secure password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      onChange={(e) => setdocphone(e.target.value)}
                      value={docphone}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      type="text"
                      placeholder="+91 1234567890"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  💼 Professional Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience *</label>
                    <select
                      onChange={(e) => setexperience(e.target.value)}
                      value={experience}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i} value={`${i + 1} Year`}>
                          {i + 1} Year{i > 0 ? 's' : ''}
                        </option>
                      ))}
                      <option value="12+ Year">12+ Years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fees (₹) *</label>
                    <input
                      onChange={(e) => setfees(e.target.value)}
                      value={fees}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      type="number"
                      placeholder="Enter consultation fee"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Speciality *</label>
                    <select
                      onChange={(e) => setspeciality(e.target.value)}
                      value={speciality}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="Marine vet">🐠 Marine Veterinarian</option>
                      <option value="Small animal vet">🐕 Small Animal Veterinarian</option>
                      <option value="Large animal vet">🐄 Large Animal Veterinarian</option>
                      <option value="Military vet">🎖️ Military Veterinarian</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education/Degree *</label>
                    <input
                      onChange={(e) => setdegree(e.target.value)}
                      value={degree}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      type="text"
                      placeholder="e.g., BVSc, MVSc, PhD"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                📍 Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    onChange={handleStateChange}
                    value={state}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      error ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                    }`}
                    type="text"
                    placeholder="e.g., NEW DELHI"
                    required
                  />
                  {error && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <span>⚠️</span>
                      {error}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Allowed: NEW DELHI, HARYANA, GUJARAT, MUMBAI</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                  <input
                    onChange={handleStateChange2}
                    value={district}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    type="text"
                    placeholder="e.g., CENTRAL DELHI"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
                <textarea
                  onChange={(e) => setfull_address(e.target.value)}
                  value={full_address}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Enter complete clinic/hospital address with landmarks"
                  rows={3}
                  required
                />
              </div>
            </div>

            {/* About Doctor */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                📝 About the Doctor
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professional Bio *</label>
                <textarea
                  onChange={(e) => setabout(e.target.value)}
                  value={about}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Describe the doctor's expertise, achievements, and specializations..."
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This will be displayed on the doctor's public profile</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center md:justify-end">
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Doctor to System
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AddDoctor;
