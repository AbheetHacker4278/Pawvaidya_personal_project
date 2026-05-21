import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DoctorContext } from '../context/DoctorContext';
import { toast } from 'react-toastify';
import { 
  Heart, 
  Calendar, 
  Syringe, 
  Stethoscope, 
  AlertCircle, 
  FileText, 
  User, 
  MapPin, 
  Phone,
  Shield,
  Activity,
  ClipboardList,
  Plus,
  Search,
  Download
} from 'lucide-react';

const PetHealthCard = ({ data, onUpdate }) => {
  const { addVisitNote, uploadMedicalDocument, addVaccination, dtoken } = useContext(DoctorContext);
  const [activeTab, setActiveTab] = useState('summary'); // summary, actions
  const [uploading, setUploading] = useState(false);
  
  if (!data) return null;

  const { pet, reports, owner } = data;
  const currentReport = reports[0]; // Most recent report

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 text-white shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Shield size={160} />
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative">
            <img 
              src={pet.image || 'https://via.placeholder.com/150'} 
              alt={pet.name}
              className="w-40 h-40 rounded-2xl object-cover border-4 border-white/20 shadow-xl"
            />
            <div className="absolute -bottom-3 -right-3 bg-green-500 p-2 rounded-full border-4 border-indigo-600">
              <Activity size={20} className="text-white" />
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start mb-2">
              <h1 className="text-4xl font-black tracking-tight">{pet.name}</h1>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium uppercase tracking-wider">
                {pet.type}
              </span>
            </div>
            <p className="text-blue-100 text-lg font-medium opacity-90 mb-4">
              {pet.breed} • {pet.age} Years Old • {pet.gender}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                <div className="bg-blue-500/30 p-2 rounded-lg">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase opacity-60">Owner</p>
                  <p className="text-sm font-semibold">{owner?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                <div className="bg-purple-500/30 p-2 rounded-lg">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase opacity-60">Digital ID</p>
                  <p className="text-sm font-mono">{pet.qrToken?.substring(0, 8)}...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Doctor Update Console */}
      {dtoken && currentReport && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] border-2 border-blue-100 shadow-xl overflow-hidden"
        >
          <div className="bg-blue-50 px-8 py-4 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              <h3 className="font-black text-blue-900 uppercase tracking-widest text-sm">Doctor Update Console</h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'summary' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-600 hover:bg-blue-100'}`}
              >
                View History
              </button>
              <button 
                onClick={() => setActiveTab('actions')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'actions' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-600 hover:bg-blue-100'}`}
              >
                Update Records
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'actions' && (
              <motion.div 
                key="actions"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10"
              >
                {/* Visit Note Form */}
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Add Clinical Note</label>
                  <textarea 
                    id="scanner-note"
                    placeholder="Diagnosis, symptoms, or clinical advice..."
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-blue-200 outline-none transition-all text-sm min-h-[120px] bg-gray-50/50"
                  />
                  <button 
                    onClick={async () => {
                      const noteInput = document.getElementById('scanner-note');
                      if (!noteInput.value.trim()) return toast.error("Note is empty");
                      const updated = await addVisitNote({
                        reportId: currentReport._id,
                        notes: noteInput.value.trim()
                      });
                      if (updated && onUpdate) {
                        noteInput.value = "";
                        onUpdate();
                      }
                    }}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                  >
                    Save Clinical Note
                  </button>
                </div>

                {/* Vaccination Form */}
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Register Immunization</label>
                  <div className="space-y-3">
                    <input 
                      id="scanner-vac-name"
                      type="text"
                      placeholder="Vaccine Name (e.g. DHPP, Rabies)"
                      className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-blue-200 outline-none text-sm bg-gray-50/50"
                    />
                    <input 
                      id="scanner-vac-date"
                      type="date"
                      className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-blue-200 outline-none text-sm bg-gray-50/50"
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      const name = document.getElementById('scanner-vac-name');
                      const date = document.getElementById('scanner-vac-date');
                      if (!name.value.trim() || !date.value) return toast.error("Fill vaccine details");
                      const updated = await addVaccination({
                        reportId: currentReport._id,
                        vaccinationName: name.value.trim(),
                        vaccinationDate: date.value
                      });
                      if (updated && onUpdate) {
                        name.value = "";
                        date.value = "";
                        onUpdate();
                      }
                    }}
                    className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-all"
                  >
                    Add Vaccination
                  </button>
                </div>

                {/* Document Upload Form */}
                <div className="space-y-4 md:col-span-2 pt-6 border-t border-gray-100">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload Clinical Documents (PDF/Reports)</label>
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <input 
                      id="scanner-files"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                    />
                    <button 
                      disabled={uploading}
                      onClick={async () => {
                        const fileInput = document.getElementById('scanner-files');
                        if (!fileInput.files.length) return toast.error("Select files to upload");
                        setUploading(true);
                        const updated = await uploadMedicalDocument(currentReport._id, fileInput.files);
                        setUploading(false);
                        if (updated && onUpdate) {
                          fileInput.value = "";
                          onUpdate();
                        }
                      }}
                      className="w-full md:w-auto px-10 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload Documents'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Essential Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Owner Details */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User size={20} className="text-blue-600" />
              Owner Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">{owner?.phone || 'N/A'}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-gray-400 mt-1 shrink-0" />
                <span className="text-sm text-gray-600">{owner?.full_address || 'N/A'}</span>
              </div>
            </div>
          </section>

          {/* Emergency Summary */}
          <section className="bg-red-50 rounded-2xl p-6 border border-red-100">
            <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-red-600" />
              Allergies & Conditions
            </h3>
            <div className="space-y-4">
              <div className="bg-white p-3 rounded-xl border border-red-200">
                <p className="text-xs font-bold text-red-500 uppercase mb-1">Known Allergies</p>
                <p className="text-sm text-gray-700">{reports[0]?.allergies || 'No known allergies reported'}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-red-200">
                <p className="text-xs font-bold text-red-500 uppercase mb-1">Existing Conditions</p>
                <p className="text-sm text-gray-700">{reports[0]?.existingConditions || 'None'}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Medical History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Vaccinations */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Syringe size={22} className="text-indigo-600" />
                Vaccination Records
              </h3>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                {reports.reduce((acc, r) => acc + (r.vaccinations?.length || 0), 0)} Total
              </span>
            </div>
            <div className="space-y-3">
              {reports.flatMap(r => r.vaccinations || []).length > 0 ? (
                reports.flatMap(r => r.vaccinations || []).map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-indigo-50/50 transition-colors border border-transparent hover:border-indigo-100">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <Syringe size={18} className="text-indigo-500" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{v.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(v.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {v.notes && <p className="text-xs text-gray-600 italic max-w-[150px] text-right truncate">{v.notes}</p>}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No vaccination records found
                </div>
              )}
            </div>
          </section>

          {/* Clinical Records */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <ClipboardList size={22} className="text-blue-600" />
              Doctor History & Notes
            </h3>
            <div className="space-y-6">
              {reports.flatMap(r => r.visitNotes || []).length > 0 ? (
                reports.flatMap(r => r.visitNotes || []).map((n, i) => (
                  <div key={i} className="relative pl-6 border-l-2 border-blue-100 pb-6 last:pb-0">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white" />
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                            Consultation Note
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(n.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <Stethoscope size={16} className="text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {n.notes}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No clinical notes recorded
                </div>
              )}
            </div>
          </section>

          {/* Attachments/Reports */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FileText size={22} className="text-emerald-600" />
              Medical Documents
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {reports.flatMap(r => r.attachments || []).length > 0 ? (
                reports.flatMap(r => r.attachments || []).map((a, i) => (
                  <div 
                    key={i} 
                    className="group relative rounded-xl overflow-hidden aspect-square bg-gray-100 border border-gray-200"
                  >
                    {a.url?.toLowerCase().endsWith('.pdf') || a.type === 'raw' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <FileText size={32} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                        <p className="text-[10px] mt-2 text-gray-500 text-center truncate w-full">{a.filename || 'PDF Document'}</p>
                      </div>
                    ) : (
                      <img src={a.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Report" />
                    )}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                      <a 
                        href={a.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-all backdrop-blur-md"
                        title="View Full"
                      >
                        <Search size={18} />
                      </a>
                      <a 
                        href={a.url} 
                        download={a.filename || 'medical-report.pdf'}
                        className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-all shadow-lg"
                        title="Download"
                        onClick={(e) => {
                          // For cross-origin downloads, some browsers need a specific fetch approach, 
                          // but direct link is standard.
                        }}
                      >
                        <Download size={18} />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-400">
                  No attachments found
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PetHealthCard;
