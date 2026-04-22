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
    <form onSubmit={onSubmitHandler} className="p-6 md:p-10 lg:p-12 w-full min-h-screen bg-[#fdfaf7]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100/50 rounded-full text-[10px] font-black uppercase tracking-tighter text-amber-700 mb-4 border border-amber-200/50">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Administrative Portal
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
              Onboard <span className="text-indigo-600">Expert</span>
            </h1>
            <p className="text-slate-500 font-medium mt-3 text-lg leading-relaxed max-w-2xl">
              Expand our veterinary network with premium medical professionals.
              <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mt-2 bg-slate-100 inline-block px-2 py-0.5 rounded">Required: Uppercase Region Identifiers</span>
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden relative">
          {/* Decorative background gradients */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-50/50 rounded-full blur-3xl -ml-48 -mb-48 pointer-events-none" />

          {/* Image Upload Section */}
          <div className="px-8 py-10 border-b border-slate-100 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <label htmlFor="doc-img" className="cursor-pointer group relative">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-slate-50 rounded-[2rem] border-4 border-white shadow-2xl group-hover:rotate-3 transition-all duration-500 overflow-hidden flex items-center justify-center relative">
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={docimg ? URL.createObjectURL(docimg) : assets.upload_area}
                    alt="Doctor profile"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00OCA4QzU5LjA0NTcgOCA2OCAxNi45NTQzIDY4IDI4QzY4IDM5LjA0NTcgNTkuMDQ1NyA0OCA0OCA0OEMzNi45NTQzIDQ4IDI4IDM5LjA0NTcgMjggMjhDMjggMTYuOTU0MyAzNi45NTQzIDggNDggOFoiIGZpbGw9IiM4MDgwODAiLz4KPC9zdmc+';
                    }}
                  />
                  {!docimg && (
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white p-2 rounded-xl shadow-lg text-xs font-black uppercase tracking-widest text-slate-900">Upload</span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-3 rounded-2xl shadow-xl border-4 border-white group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </label>
              <input onChange={(e) => setdocimg(e.target.files[0])} type="file" id="doc-img" hidden />
              <div className="text-center md:text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Professional Portrait</p>
                <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight">Visual Identity</h3>
                <p className="text-slate-500 font-medium max-w-xs text-sm leading-relaxed">
                  High-resolution square portraits recommended for profile distinction.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12 relative z-10">
            {/* Form Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                  <span className="w-8 h-px bg-slate-200" /> Identity Matrix
                </h3>
                <div className="space-y-6">
                  <div className="group/field">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 group-focus-within/field:text-indigo-600 transition-colors">Official Name</label>
                    <input
                      onChange={(e) => setname(e.target.value)}
                      value={name}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all duration-300 font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                      type="text"
                      placeholder="e.g. Dr. Jonathan Vance"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group/field">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 group-focus-within/field:text-indigo-600 transition-colors">Digital Email</label>
                      <input
                        onChange={(e) => setemail(e.target.value)}
                        value={email}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all duration-300 font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                        type="email"
                        placeholder="doctor@pawvaidya.com"
                        required
                      />
                    </div>
                    <div className="group/field">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 group-focus-within/field:text-indigo-600 transition-colors">Security Key</label>
                      <input
                        onChange={(e) => setpassword(e.target.value)}
                        value={password}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all duration-300 font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                        type="password"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  <div className="group/field">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 group-focus-within/field:text-indigo-600 transition-colors">Direct Contact</label>
                    <input
                      onChange={(e) => setdocphone(e.target.value)}
                      value={docphone}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all duration-300 font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                      type="text"
                      placeholder="+91 9999-000-111"
                      required
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                  <span className="w-8 h-px bg-slate-200" /> Expertise Profile
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group/field">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 group-focus-within/field:text-indigo-600 transition-colors">Experience Level</label>
                      <select
                        onChange={(e) => setexperience(e.target.value)}
                        value={experience}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all duration-300 font-bold text-slate-700 appearance-none shadow-inner"
                      >
                        {[...Array(12)].map((_, i) => (
                          <option key={i} value={`${i + 1} Year`}>
                            Exp: {i + 1} Year{i > 0 ? 's' : ''}
                          </option>
                        ))}
                        <option value="12+ Year">Exp: 12+ Years</option>
                      </select>
                    </div>
                    <div className="group/field">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 group-focus-within/field:text-indigo-600 transition-colors">Consultation Fee</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                        <input
                          onChange={(e) => setfees(e.target.value)}
                          value={fees}
                          className="w-full pl-10 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all duration-300 font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                          type="number"
                          placeholder="800"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="group/field">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 group-focus-within/field:text-indigo-600 transition-colors">Clinical Specialization</label>
                    <select
                      onChange={(e) => setspeciality(e.target.value)}
                      value={speciality}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all duration-300 font-bold text-slate-700 shadow-inner"
                    >
                      <option value="Marine vet">🐠 Marine Veterinarian</option>
                      <option value="Small animal vet">🐕 Small Animal Specialist</option>
                      <option value="Large animal vet">🐄 Large Animal Specialist</option>
                      <option value="Military vet">🎖️ Medical Corps / Military Vet</option>
                    </select>
                  </div>
                  <div className="group/field">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 group-focus-within/field:text-indigo-600 transition-colors">Academic Credentials</label>
                    <input
                      onChange={(e) => setdegree(e.target.value)}
                      value={degree}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all duration-300 font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                      type="text"
                      placeholder="e.g. BVSc, MVSc (Gold Medalist)"
                      required
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Geolocation & Address */}
            <div className="mb-12">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                <span className="w-8 h-px bg-slate-200" /> Regional Mapping
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group/field">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 group-focus-within/field:text-indigo-600 transition-colors">Region / State</label>
                  <input
                    onChange={handleStateChange}
                    value={state}
                    className={`w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 transition-all duration-300 font-bold text-slate-700 shadow-inner ${error ? 'ring-4 ring-rose-100 text-rose-600 bg-rose-50' : 'focus:ring-indigo-100'
                      }`}
                    type="text"
                    placeholder="e.g. HARYANA"
                    required
                  />
                  {error && (
                    <p className="text-rose-500 text-[10px] font-black uppercase mt-2 ml-1 animate-bounce">
                      {error}
                    </p>
                  )}
                </div>
                <div className="group/field">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 group-focus-within/field:text-indigo-600 transition-colors">District Hub</label>
                  <input
                    onChange={handleStateChange2}
                    value={district}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all duration-300 font-bold text-slate-700 shadow-inner"
                    type="text"
                    placeholder="e.g. GURUGRAM"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 group/field">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 group-focus-within/field:text-indigo-600 transition-colors">Physical Address Hierarchy</label>
                <textarea
                  onChange={(e) => setfull_address(e.target.value)}
                  value={full_address}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all duration-300 font-bold text-slate-700 placeholder:text-slate-300 shadow-inner min-h-[100px]"
                  placeholder="Complete clinic coordinate details..."
                  required
                />
              </div>
            </div>

            {/* Professional Manifesto */}
            <div className="mb-12">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                <span className="w-8 h-px bg-slate-200" /> Physician Narrative
              </h3>
              <div className="group/field">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 group-focus-within/field:text-indigo-600 transition-colors">Professional Background</label>
                <textarea
                  onChange={(e) => setabout(e.target.value)}
                  value={about}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all duration-300 font-bold text-slate-700 placeholder:text-slate-300 shadow-inner min-h-[150px]"
                  placeholder="Articulate the doctor's medical journey and expertise philosophy..."
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center md:justify-end">
              <button
                type="submit"
                className="group relative px-10 py-5 bg-slate-900 text-white font-black rounded-3xl overflow-hidden hover:bg-slate-800 transition-all duration-300 shadow-2xl active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center gap-3 uppercase tracking-widest text-[12px]">
                  Add Doctor to System
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AddDoctor;
