import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Activity, Salad, Crown, Lock, ChevronRight,
  ArrowRight, Award, Zap, Brain, FlaskConical, Leaf,
  BrainCircuit, Camera, Loader2, Phone, Mail
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Lazy-load the three tool pages as inline components
import MLPrediction from './MLPrediction';
import AnimalDiseasePredictor from './AnimalDiseasePredictor';
import DietNutritionPlanner from './DietNutritionPlanner';

function ObsidianVisionAI() {
  const { token, backendurl } = useContext(AppContext);
  const [symptomText, setSymptomText] = useState("");
  const [visionImage, setVisionImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzingVision, setAnalyzingVision] = useState(false);
  const [visionAnalysis, setVisionAnalysis] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [vco, setVco] = useState(null);
  const [showVcoModal, setShowVcoModal] = useState(false);
  const [sendingSosAlert, setSendingSosAlert] = useState(false);

  useEffect(() => {
    if (token) {
      axios.get(`${backendurl}/api/user/obsidian/vco`, { headers: { token } })
        .then(res => {
          if (res.data.success) {
            setVco(res.data.vco);
          }
        })
        .catch(err => console.error("Error fetching VCO in ObsidianVisionAI:", err));
    }
  }, [token, backendurl]);

  const loadingSteps = [
    "Establishing connection to secure NVIDIA endpoint...",
    "Scanning submitted visual media for patterns...",
    "Analyzing tissue lesions using MiniMax-M3 multimodal layer...",
    "Correlating observations with clinical veterinary databases...",
    "Structuring diagnostic recommendations...",
    "Finalizing case assessment report..."
  ];

  useEffect(() => {
    let interval;
    if (analyzingVision) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 1500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [analyzingVision]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVisionImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = (e) => {
    e.preventDefault();
    setVisionImage(null);
    setImagePreview(null);
  };

  const handleVisionDiagnostic = async (e) => {
    e.preventDefault();
    if (!symptomText.trim()) {
      toast.info("Please describe the physical symptoms first.");
      return;
    }
    setAnalyzingVision(true);
    setVisionAnalysis(null);
    try {
      const formData = new FormData();
      formData.append("symptoms", symptomText);
      if (visionImage) {
        formData.append("image", visionImage);
      }
      const { data } = await axios.post(`${backendurl}/api/user/obsidian/diagnostics`, formData, {
        headers: { token, 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        setVisionAnalysis(data.analysis);
        toast.success("Multi-Modal analysis complete!");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Vision diagnostic failed");
    } finally {
      setAnalyzingVision(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-gradient-to-b from-[#0d0d0d] to-[#050505] text-[#F5F2EA] rounded-[2.5rem] p-8 border border-[#D4AF37]/35 shadow-[0_0_55px_rgba(212,175,55,0.08)] relative overflow-hidden">
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0.3; }
          50% { top: 100%; opacity: 0.9; }
        }
        .animate-scan {
          position: absolute;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(to right, transparent, #E6C97A, #D4AF37, #E6C97A, transparent);
          box-shadow: 0 0 15px 4px rgba(212, 175, 55, 0.4);
          animation: scan 2.5s ease-in-out infinite;
        }
        .grid-viewfinder::before {
          content: '';
          position: absolute;
          inset: 10px;
          border: 1px dashed rgba(212, 175, 55, 0.15);
          pointer-events: none;
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
      
      {/* Decorative ambient glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#8C6D23]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-[#D4AF37] to-[#8C6D23] text-black rounded-2xl shadow-lg shadow-[#D4AF37]/15">
            <BrainCircuit size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-serif font-black tracking-tight text-[#F5F2EA]">Multi-Modal Vision AI</h2>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-[#D4AF37]/10 text-[#E6C97A] rounded border border-[#D4AF37]/25">
                MiniMax-M3 Engine
              </span>
            </div>
            <p className="text-sm text-[#8A8A8A] mt-1">
              Obsidian Signature Pass clinical scanning module. Real-time visual diagnosis and emergency assessments.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-[#B0B0B0]">Diagnostics Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Side: Inputs (Form) */}
        <form onSubmit={handleVisionDiagnostic} className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Symptom Input */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-[#8A8A8A] tracking-wider flex items-center justify-between">
                <span>1. Describe Clinical Symptoms</span>
                <span className="text-[#8A8A8A]/50 font-bold lowercase">{symptomText.length} chars</span>
              </label>
              <textarea
                required
                className="w-full bg-[#0d0d0d] border border-white/5 rounded-2xl p-4 text-sm text-[#F5F2EA] placeholder-[#8A8A8A]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all resize-none h-36"
                placeholder="Describe visible observations (e.g., swelling, fluid discharge, skin discoloration, hair loss, behavior changes)..."
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value)}
              />
            </div>

            {/* Photo Uploader with Preview */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-[#8A8A8A] tracking-wider">
                2. Clinical Media Upload
              </label>
              
              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center gap-3 py-10 px-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-[#D4AF37]/40 cursor-pointer text-xs font-bold text-[#8A8A8A] transition-all bg-[#0d0d0d]/40 hover:bg-[#0d0d0d]">
                  <div className="p-3 bg-white/5 rounded-xl text-[#F5F2EA]">
                    <Camera size={24} />
                  </div>
                  <div className="text-center space-y-1">
                    <span className="block text-[#B0B0B0]">Drag & drop or click to upload photo</span>
                    <span className="block text-[10px] text-[#8A8A8A]/60">Supports JPG, PNG (Max 10MB)</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-[#0d0d0d]/50 p-3 flex flex-col gap-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center group grid-viewfinder">
                    <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                    
                    {/* Viewfinder crosshairs */}
                    <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-white/40" />
                    <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-white/40" />
                    <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-white/40" />
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-white/40" />

                    {/* Active scanning laser during analysis */}
                    {analyzingVision && <div className="animate-scan" />}
                  </div>
                  <div className="flex items-center justify-between text-xs px-1">
                    <div className="flex items-center gap-2 text-[#B0B0B0] font-bold truncate max-w-[200px]">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#D4AF37]" />
                      {visionImage?.name}
                    </div>
                    <button 
                      onClick={clearImage}
                      className="text-xs font-black text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1 rounded-lg transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={analyzingVision}
            className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] hover:opacity-95 text-black rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:scale-[1.01] active:scale-[0.99] mt-4"
          >
            {analyzingVision ? (
              <>
                <Loader2 size={18} className="animate-spin text-black" /> Analyzing Clinical Media...
              </>
            ) : (
              <>
                <Sparkles size={18} className="text-black" /> Run Clinical AI Scan
              </>
            )}
          </button>
        </form>

        {/* Right Side: Output / Console Console */}
        <div className="lg:col-span-7 bg-[#0d0d0d]/60 rounded-[2rem] p-6 border border-white/5 min-h-[420px] flex flex-col justify-between relative overflow-hidden">
          {analyzingVision ? (
            /* Scanning UI state */
            <div className="flex-1 flex flex-col justify-center items-center py-10 space-y-6">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* Pulse animations */}
                <div className="absolute inset-0 rounded-full border border-[#D4AF37]/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-[#8C6D23]/20 animate-pulse-glow" />
                <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37]/20 to-[#8C6D23]/20 text-[#E6C97A] rounded-full border border-[#D4AF37]/40 flex items-center justify-center shadow-lg">
                  <BrainCircuit size={40} className="animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-base font-black text-[#E6C97A] tracking-wider uppercase">Processing Diagnostic Request</h4>
                <p className="text-xs text-[#8A8A8A] max-w-sm mx-auto leading-relaxed animate-pulse">
                  {loadingSteps[loadingStep]}
                </p>
              </div>
              
              {/* Progress bar */}
              <div className="w-full max-w-xs bg-black rounded-full h-1.5 border border-white/5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#8C6D23] via-[#D4AF37] to-[#F2E3B3] h-full transition-all duration-1000 ease-out"
                  style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                />
              </div>
            </div>
          ) : visionAnalysis ? (
            /* Result state */
            <div className="flex-1 flex flex-col justify-between space-y-6 text-sm">
              <div className="space-y-4">
                {/* Result Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[10px] text-[#E6C97A] font-bold uppercase tracking-widest">Assessment Report</span>
                    <h4 className="font-serif font-black text-xl text-[#F5F2EA] mt-0.5">{visionAnalysis.diagnosis}</h4>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                      visionAnalysis.severity === 'High' || visionAnalysis.severity === 'Critical' 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                        : 'bg-amber-500/10 text-[#E6C97A] border-[#D4AF37]/30'
                    }`}>
                      {visionAnalysis.severity} Severity
                    </span>
                    <span className="text-[10px] text-[#8A8A8A] font-medium mt-1">Confidence Score: <strong className="text-[#E6C97A]">{visionAnalysis.confidenceScore}</strong></span>
                  </div>
                </div>

                {/* Structured diagnostic values */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Action Plan */}
                  <div className="bg-black/60 rounded-2xl p-4 border border-white/5 hover:border-[#D4AF37]/25 transition-all">
                    <div className="flex items-center gap-2 text-[#E6C97A] font-bold mb-2">
                      <Activity size={16} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Clinical Action Plan</span>
                    </div>
                    <p className="text-[#B0B0B0] leading-relaxed text-xs">{visionAnalysis.actionPlan}</p>
                  </div>

                  {/* Hotline Action Recommendation */}
                  <div className="bg-black/60 rounded-2xl p-4 border border-white/5 hover:border-[#D4AF37]/25 transition-all">
                    <div className="flex items-center gap-2 text-[#D4AF37] font-bold mb-2">
                      <Phone size={16} />
                      <span className="text-[10px] font-black uppercase tracking-wider">VCO Direct Hotline Recommendation</span>
                    </div>
                    <p className="text-[#B0B0B0] leading-relaxed text-xs">{visionAnalysis.hotlineRecommendation}</p>
                  </div>
                </div>
              </div>

              {/* Concierge referral footer */}
              <div className="bg-gradient-to-r from-[#1c140d]/40 via-[#0a0a0a]/90 to-[#1c140d]/40 border border-[#D4AF37]/25 rounded-2xl p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 shadow-[0_0_15px_rgba(212,175,55,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#D4AF37]/10 text-[#E6C97A] rounded-xl border border-[#D4AF37]/20">
                    <Crown size={20} className="fill-[#E6C97A]/10" />
                  </div>
                  <div className="text-left">
                    <h5 className="text-xs font-black text-[#E6C97A] uppercase tracking-wide">Obsidian Concierge Desk Active</h5>
                    <p className="text-[11px] text-[#8A8A8A] mt-0.5">Your dedicated VCO ({vco?.name || "Dr. Shruti Sen"}) has been briefed on this report.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVcoModal(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] hover:opacity-95 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all"
                >
                  Consult VCO
                </button>
              </div>
            </div>
          ) : (
            /* Idle Console view */
            <div className="flex-1 flex flex-col justify-center items-center py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-[#8A8A8A] mb-2">
                <BrainCircuit size={32} className="text-[#8A8A8A] animate-pulse-glow" />
              </div>
              <h4 className="font-black text-sm text-[#B0B0B0] uppercase tracking-widest">Clinical Analysis Console</h4>
              <p className="text-xs text-[#8A8A8A]/75 max-w-sm mx-auto leading-relaxed">
                Please describe your pet's physical symptoms and upload a clinical photograph. Results will display here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 24/7 Dedicated VCO Concierge Drawer / Modal */}
      <AnimatePresence>
        {showVcoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowVcoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0a0a0a] border border-[#D4AF37]/35 rounded-[2.5rem] p-8 max-w-md w-full text-white space-y-6 shadow-[0_0_50px_rgba(212,175,55,0.15)] relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#E6C97A] text-[10px] font-black uppercase tracking-wider border border-[#D4AF37]/25">
                    <Crown size={10} className="fill-[#D4AF37]/20" /> 24/7 Concierge Active
                  </span>
                  <h4 className="text-xl font-serif font-black mt-2 bg-gradient-to-r from-[#F5F2EA] via-[#E6C97A] to-[#D4AF37] bg-clip-text text-transparent">
                    Dedicated VCO Line
                  </h4>
                </div>
                <button
                  onClick={() => setShowVcoModal(false)}
                  className="text-[#8A8A8A] hover:text-white transition-colors text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <img
                  src={vco?.photo || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200"}
                  alt="VCO Photo"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37]/35"
                />
                <div>
                  <h5 className="font-serif font-black text-base text-[#F5F2EA]">{vco?.name || "Dr. Shruti Sen"}</h5>
                  <p className="text-xs text-[#E6C97A] font-bold uppercase tracking-wider">{vco?.title || "Dedicated Care Officer"}</p>
                  <p className="text-[10px] text-[#8A8A8A] font-medium mt-1 leading-snug">{vco?.bio || "Assigned critical care specialist for 24/7 hotline support."}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <a
                  href={`tel:${vco?.hotline || "+919876543210"}`}
                  className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black rounded-2xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] active:scale-95 hover:opacity-95"
                >
                  <Phone size={14} /> Direct Phone Call
                </a>

                <a
                  href={`mailto:${vco?.email || "vco@pawvaidya.com"}`}
                  className="w-full py-3.5 bg-[#121212]/90 hover:bg-[#1f1f1f]/90 text-[#E6C97A] rounded-2xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-all border border-[#D4AF37]/20 active:scale-95"
                >
                  <Mail size={14} /> Send Concierge Email
                </a>

                <button
                  disabled={sendingSosAlert}
                  onClick={() => {
                    setSendingSosAlert(true);
                    setTimeout(() => {
                      setSendingSosAlert(false);
                      toast.success(`🚨 SOS Alert Sent! Your dedicated Veterinary Care Officer, ${vco?.name || 'Dr. Shruti Sen'}, has been dispatched and will call you within 60 seconds.`);
                      setShowVcoModal(false);
                    }, 1500);
                  }}
                  className="w-full py-3.5 bg-red-950/20 hover:bg-red-950/45 text-red-400 rounded-2xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-all border border-red-900/40 active:scale-95"
                >
                  {sendingSosAlert ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-red-400" />
                      Broadcasting SOS...
                    </>
                  ) : (
                    <>
                      <Activity size={14} className="animate-pulse" />
                      Request SOS Callback (60s response)
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tool config ──────────────────────────────────────────────────────────────
const TOOLS = [
  {
    id: 'ml-prediction',
    label: 'AI Health Predictor',
    shortLabel: 'Health AI',
    icon: Activity,
    emoji: '🧬',
    gradient: 'from-violet-600 to-purple-700',
    lightGradient: 'from-violet-50 to-purple-50',
    borderColor: 'border-violet-200',
    accentColor: 'text-violet-700',
    badgeBg: 'bg-violet-100',
    tier: 'Platinum',
    tierColor: 'text-purple-700',
    tierBg: 'bg-purple-100',
    description: 'Analyze pet vitals in real-time — temperature, pulse, respiration — against species baselines. Powered by Gemma-3 AI to generate custom care protocols and isolation advisories.',
    highlights: ['Vitals deviation matrix', 'Gemma-3 AI insights', 'Emergency consultation link'],
    component: MLPrediction,
  },
  {
    id: 'disease-predictor',
    label: 'Disease Predictor',
    shortLabel: 'Disease AI',
    icon: Brain,
    emoji: '🏥',
    gradient: 'from-amber-500 to-orange-600',
    lightGradient: 'from-amber-50 to-orange-50',
    borderColor: 'border-amber-200',
    accentColor: 'text-amber-700',
    badgeBg: 'bg-amber-100',
    tier: 'Gold+',
    tierColor: 'text-amber-700',
    tierBg: 'bg-amber-100',
    description: 'Map symptom-severity profiles through a Random Forest classifier to predict disease probabilities. Generate printable clinical PDF reports and track case recovery logs.',
    highlights: ['Random Forest ML engine', 'Clinical PDF reports', 'Interactive case tracking'],
    component: AnimalDiseasePredictor,
  },
  {
    id: 'diet-planner',
    label: 'Diet & Nutrition',
    shortLabel: 'Diet AI',
    icon: Leaf,
    emoji: '🥗',
    gradient: 'from-emerald-500 to-teal-600',
    lightGradient: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200',
    accentColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
    tier: 'Platinum',
    tierColor: 'text-emerald-700',
    tierBg: 'bg-emerald-100',
    description: 'Generate AI-personalized diet and nutrition plans for your pets. Factor in species, breed, age, weight, and health conditions for precision feeding schedules.',
    highlights: ['Species-specific nutrition', 'AI meal planning', 'Health-condition aware'],
    component: DietNutritionPlanner,
  },
  {
    id: 'vision-diagnostic',
    label: 'Multi-Modal Vision AI',
    shortLabel: 'Vision AI',
    icon: BrainCircuit,
    emoji: '👁️',
    gradient: 'from-fuchsia-600 to-pink-700',
    lightGradient: 'from-fuchsia-50 to-pink-50',
    borderColor: 'border-fuchsia-200',
    accentColor: 'text-fuchsia-700',
    badgeBg: 'bg-fuchsia-100',
    tier: 'Obsidian',
    tierColor: 'text-fuchsia-700',
    tierBg: 'bg-fuchsia-100',
    description: 'Upload high-resolution clinical photos of skin lesions, dental issues, or other visible anomalies. Evaluates diagnostic confidence and builds a care plan utilizing Gemini 1.5 Multi-Modal.',
    highlights: ['Multi-modal tissue analysis', 'Confidence deviation check', 'Direct concierge referral'],
    component: ObsidianVisionAI,
  }
];

// ─── Main Hub Component ───────────────────────────────────────────────────────
export default function AiFeatures() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, userdata, backendurl } = useContext(AppContext);

  const [vco, setVco] = useState(null);
  const [showVcoModal, setShowVcoModal] = useState(false);
  const [sendingSosAlert, setSendingSosAlert] = useState(false);

  // Read active tab from URL query ?tab=ml-prediction (defaults to null = show hub)
  const paramTab = searchParams.get('tab');
  const activeTool = TOOLS.find(t => t.id === paramTab) || null;

  const setActiveTool = (id) => {
    if (id) setSearchParams({ tab: id });
    else setSearchParams({});
  };

  const isObsidian = userdata?.subscription?.plan === 'Obsidian' && userdata?.subscription?.status === 'Active';
  const isPlatinum = (userdata?.subscription?.plan === 'Platinum' || userdata?.subscription?.plan === 'Obsidian') && userdata?.subscription?.status === 'Active';
  const isGoldOrAbove = (userdata?.subscription?.plan === 'Gold' || userdata?.subscription?.plan === 'Platinum' || userdata?.subscription?.plan === 'Obsidian') && userdata?.subscription?.status === 'Active';

  useEffect(() => {
    if (token && isObsidian) {
      axios.get(`${backendurl}/api/user/obsidian/vco`, { headers: { token } })
        .then(res => {
          if (res.data.success) {
            setVco(res.data.vco);
          }
        })
        .catch(err => console.error("Error fetching VCO in AiFeatures main hub:", err));
    }
  }, [token, backendurl, isObsidian]);

  const canAccess = (tool) => {
    if (!token) return false;
    if (tool.tier === 'Obsidian') return isObsidian;
    if (tool.tier === 'Gold+') return isGoldOrAbove;
    return isPlatinum;
  };

  // ── If a tool is active, render it full-screen with a back bar ──────────────
  if (activeTool) {
    const ToolComponent = activeTool.component;
    return (
      <div className={`min-h-screen transition-colors duration-500 ${isObsidian ? 'bg-[#050505] text-[#F5F2EA]' : ''}`}>
        {/* Back bar */}
        <div className={`sticky top-0 z-40 ${isObsidian ? 'bg-[#0d0d0d] border-b border-[#D4AF37]/20 text-[#F5F2EA]' : `bg-gradient-to-r ${activeTool.gradient} text-white`} shadow-lg`}>
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setActiveTool(null)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isObsidian ? 'bg-[#D4AF37]/10 hover:bg-[#D4AF37]/25 text-[#E6C97A] border border-[#D4AF37]/20' : 'bg-white/20 hover:bg-white/30 text-white'}`}
            >
              ← AI Hub
            </button>
            <div className="flex items-center gap-2">
              <span className="text-lg">{activeTool.emoji}</span>
              <span className={`font-black text-sm ${isObsidian ? 'bg-gradient-to-r from-[#F5F2EA] via-[#E6C97A] to-[#D4AF37] bg-clip-text text-transparent' : ''}`}>{activeTool.label}</span>
            </div>
            <div className="ml-auto flex gap-2">
              {TOOLS.filter(t => t.id !== activeTool.id).map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTool(t.id)}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isObsidian ? 'bg-white/5 border border-white/10 hover:bg-[#D4AF37]/10 text-slate-300 hover:text-[#E6C97A]' : 'bg-white/15 hover:bg-white/25 text-white'}`}
                >
                  <span>{t.emoji}</span> {t.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Render the tool */}
        <div className="py-8 px-4">
          <ToolComponent />
        </div>
      </div>
    );
  }

  // ── Hub / Landing view ──────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen pb-16 transition-colors duration-500 ${isObsidian ? 'bg-[#050505] text-[#F5F2EA] px-4 sm:px-8 pt-6' : ''}`}>
      {/* Hero Header */}
      <div className={`relative overflow-hidden rounded-3xl mb-10 shadow-2xl ${
        isObsidian 
          ? 'bg-gradient-to-br from-[#121212] via-[#090909] to-[#020202] border border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.08)]' 
          : 'bg-gradient-to-br from-[#2c1e14] via-[#1a1030] to-[#0d0820] text-white'
      }`}>
        {/* Ambient glows */}
        {isObsidian ? (
          <>
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#E6C97A]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
          </>
        ) : (
          <>
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-violet-500/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          </>
        )}

        <div className="relative z-10 px-6 sm:px-12 py-12 sm:py-16">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest mb-6 ${
            isObsidian 
              ? 'bg-gradient-to-r from-[#D4AF37]/20 to-[#F2E3B3]/10 border-[#D4AF37]/35 text-[#E6C97A] shadow-[0_0_15px_rgba(212,175,55,0.15)]' 
              : 'from-amber-500/20 to-purple-500/20 border border-white/10 text-amber-300'
          }`}>
            <Crown className={`w-3.5 h-3.5 ${isObsidian ? 'text-[#D4AF37] fill-[#D4AF37]/20' : 'fill-amber-400'}`} />
            {isObsidian ? 'Obsidian Signature Pass' : 'Premium AI Suite'}
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                {isObsidian ? (
                  <>
                    Executive 
                    <span className="bg-gradient-to-r from-[#F5F2EA] via-[#E6C97A] to-[#D4AF37] bg-clip-text text-transparent"> AI Diagnostics </span>
                    Console
                  </>
                ) : (
                  <>
                    AI-Powered
                    <span className="bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent"> Pet Care </span>
                    Suite
                  </>
                )}
              </h1>
              <p className={`mt-4 text-base sm:text-lg leading-relaxed max-w-xl ${isObsidian ? 'text-[#B0B0B0]' : 'text-white/70'}`}>
                {isObsidian 
                  ? 'Welcome to your elite-tier diagnostic suite. Access real-time clinical prediction, disease mapping, customized nutrition modeling, and your dedicated VCO hotline.' 
                  : 'Unlock the most advanced veterinary AI tools available. From real-time vitals diagnostics to disease probability modeling and precision nutrition planning — all in one place.'}
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                {[
                  { icon: Zap, label: isObsidian ? '4 AI Tools Active' : '3 AI Tools' },
                  { icon: Brain, label: 'Gemma-3 & Gemini Powered' },
                  { icon: FlaskConical, label: 'Clinic-Grade Protocols' },
                ].map(b => (
                  <span 
                    key={b.label} 
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${
                      isObsidian 
                        ? 'bg-neutral-900/60 border-[#D4AF37]/15 text-[#E6C97A]' 
                        : 'bg-white/10 border border-white/10 text-white/80'
                    }`}
                  >
                    <b.icon className="w-3.5 h-3.5" /> {b.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Subscription state panel */}
            <div className="flex-shrink-0 w-full lg:w-64">
              {!token ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                  <Lock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-white mb-1">Sign in Required</p>
                  <p className="text-xs text-white/50 mb-4">Access requires an active subscription</p>
                  <button onClick={() => navigate('/login-form')} className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black rounded-xl text-sm hover:opacity-90 transition-all">
                    Login / Register
                  </button>
                </div>
              ) : isObsidian ? (
                <div className="bg-gradient-to-br from-[#1c140d] via-[#090909] to-[#050505] border border-[#D4AF37]/40 rounded-2xl p-5 text-center shadow-[0_0_25px_rgba(212,175,55,0.1)]">
                  <Crown className="w-8 h-8 text-[#D4AF37] mx-auto mb-2 fill-[#D4AF37]/20" />
                  <p className="text-xs font-black text-[#D4AF37] uppercase tracking-widest mb-1">Obsidian Signature</p>
                  <p className="text-sm font-bold text-white mb-1">All Features Active</p>
                  <p className="text-xs text-[#B0B0B0] mb-3.5">All 4 AI tools active</p>
                  <button
                    onClick={() => setShowVcoModal(true)}
                    className="w-full py-2 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] hover:opacity-95 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)] active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Phone size={12} /> 24/7 Concierge
                  </button>
                </div>
              ) : isPlatinum ? (
                <div className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-purple-400/30 rounded-2xl p-5 text-center">
                  <Crown className="w-8 h-8 text-amber-400 mx-auto mb-2 fill-amber-400/20" />
                  <p className="text-xs font-black text-amber-300 uppercase tracking-widest mb-1">Platinum Member</p>
                  <p className="text-sm font-bold text-white mb-1">Full Access Unlocked</p>
                  <p className="text-xs text-white/50">3 of 4 tools available</p>
                </div>
              ) : isGoldOrAbove ? (
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-400/30 rounded-2xl p-5 text-center">
                  <Award className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs font-black text-amber-300 uppercase tracking-widest mb-1">Gold Member</p>
                  <p className="text-sm font-bold text-white mb-1">Partial Access</p>
                  <p className="text-xs text-white/50 mb-3">1 of 4 tools available</p>
                  <button onClick={() => navigate('/subscription')} className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black rounded-xl text-xs hover:opacity-90 transition-all">
                    Upgrade to Platinum
                  </button>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                  <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-white mb-1">No Active Plan</p>
                  <p className="text-xs text-white/50 mb-4">Subscribe to unlock AI tools</p>
                  <button onClick={() => navigate('/subscription')} className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black rounded-xl text-sm hover:opacity-90 transition-all">
                    View Plans
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {TOOLS.map((tool, idx) => {
          const Icon = tool.icon;
          const hasAccess = canAccess(tool);
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative rounded-3xl border transition-all duration-300 overflow-hidden group flex flex-col ${
                isObsidian
                  ? 'bg-gradient-to-b from-[#0e0e0e] to-[#050505] border-[#D4AF37]/20 hover:border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.03)] hover:shadow-[0_0_30px_rgba(212,175,55,0.12)]'
                  : `bg-white ${tool.borderColor} shadow-sm hover:shadow-xl`
              }`}
            >
              {/* Top gradient stripe */}
              <div className={`h-1.5 ${
                isObsidian 
                  ? 'bg-gradient-to-r from-[#D4AF37] via-[#E6C97A] to-[#D4AF37]' 
                  : `bg-gradient-to-r ${tool.gradient}`
              }`} />

              {/* Card body */}
              <div className="p-6 flex flex-col flex-1">
                {/* Icon + tier badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                    isObsidian 
                      ? 'bg-gradient-to-br from-[#D4AF37] to-[#8C6D23] shadow-[0_0_15px_rgba(212,175,55,0.25)]' 
                      : `bg-gradient-to-br ${tool.gradient}`
                  }`}>
                    <span className="text-2xl">{tool.emoji}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-current/20 ${
                    isObsidian
                      ? 'bg-[#D4AF37]/10 text-[#E6C97A] border-[#D4AF37]/35'
                      : `${tool.tierBg} ${tool.tierColor}`
                  }`}>
                    {tool.tier} Only
                  </span>
                </div>

                {/* Title */}
                <h2 className={`text-xl font-black mb-2 ${isObsidian ? 'text-[#F5F2EA]' : 'text-slate-800'}`}>{tool.label}</h2>
                <p className={`text-sm leading-relaxed mb-5 flex-1 ${isObsidian ? 'text-[#8A8A8A]' : 'text-slate-500'}`}>{tool.description}</p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {tool.highlights.map(h => (
                    <span 
                      key={h} 
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        isObsidian
                          ? 'bg-[#D4AF37]/5 text-[#E6C97A] border-[#D4AF37]/15'
                          : `${tool.badgeBg} ${tool.accentColor}`
                      }`}
                    >
                      ✓ {h}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                {hasAccess ? (
                  <button
                    onClick={() => setActiveTool(tool.id)}
                    className={`w-full py-3.5 font-black rounded-2xl text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      isObsidian
                        ? 'bg-gradient-to-r from-[#D4AF37] via-[#E6C97A] to-[#D4AF37] text-black hover:opacity-95 shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_25px_rgba(212,175,55,0.3)]'
                        : `bg-gradient-to-r ${tool.gradient} text-white hover:opacity-90 shadow-lg group-hover:shadow-xl`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    Launch {tool.shortLabel}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className={`w-full py-3.5 font-black rounded-2xl text-sm flex items-center justify-center gap-2 border ${
                      isObsidian
                        ? 'bg-[#121212] text-[#8A8A8A] border-white/5'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      <Lock className="w-4 h-4" />
                      {!token ? 'Login Required' : `${tool.tier} Plan Required`}
                    </div>
                    {token && (
                      <button
                        onClick={() => navigate('/subscription')}
                        className={`w-full py-2 text-xs font-bold text-center hover:underline transition-colors ${
                          isObsidian ? 'text-[#E6C97A] hover:text-[#D4AF37]' : 'text-amber-600 hover:text-amber-700'
                        }`}
                      >
                        Upgrade now → Unlock all tools
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Lock overlay for non-subscribers */}
              {!hasAccess && (
                <div className={`absolute inset-0 backdrop-blur-[1px] rounded-3xl pointer-events-none ${
                  isObsidian ? 'bg-black/60' : 'bg-white/50'
                }`} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Quick-Launch Tabs (for users with access) */}
      {(isPlatinum || isGoldOrAbove) && (
        <div className={`rounded-3xl p-6 sm:p-8 border ${
          isObsidian 
            ? 'bg-gradient-to-br from-[#0c0c0c] to-[#020202] border-[#D4AF37]/15 shadow-[0_0_30px_rgba(212,175,55,0.05)]' 
            : 'bg-gradient-to-br from-slate-900 to-slate-800'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className={`w-5 h-5 ${isObsidian ? 'text-[#D4AF37]' : 'text-amber-400'}`} />
            <h3 className={`font-black text-lg ${isObsidian ? 'text-[#F5F2EA]' : 'text-white'}`}>Quick Launch</h3>
            <span className={`text-xs font-semibold ${isObsidian ? 'text-[#8A8A8A]' : 'text-slate-400'}`}>Jump directly into any tool</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {TOOLS.map(tool => {
              const accessible = canAccess(tool);
              return (
                <button
                  key={tool.id}
                  onClick={() => accessible && setActiveTool(tool.id)}
                  disabled={!accessible}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                    accessible
                      ? isObsidian
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black shadow-lg shadow-[#D4AF37]/10 hover:shadow-[#D4AF37]/25 active:scale-[0.98]'
                        : `bg-gradient-to-r ${tool.gradient} text-white shadow-lg hover:opacity-90 hover:shadow-xl active:scale-[0.98]`
                      : isObsidian
                      ? 'bg-[#121212] text-[#8A8A8A] cursor-not-allowed border border-white/5'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span className="text-base">{tool.emoji}</span>
                  {tool.label}
                  {!accessible && <Lock className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Upgrade CTA for non-platinum */}
      {token && !isPlatinum && (
        <div className="mt-6 relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 p-8 text-center text-white shadow-xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="relative z-10">
            <Crown className="w-10 h-10 mx-auto mb-3 fill-white/20" />
            <h3 className="text-2xl font-black mb-2">Unlock the Full AI Suite</h3>
            <p className="text-white/80 text-sm max-w-md mx-auto mb-5">
              Upgrade to Platinum or Obsidian for access to all 3 AI-powered veterinary tools, unlimited diagnostics, and VIP emergency consultation benefits.
            </p>
            <button
              onClick={() => navigate('/subscription')}
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-amber-700 font-black rounded-2xl hover:scale-105 transition-transform shadow-lg"
            >
              Upgrade Plan <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 24/7 Dedicated VCO Concierge Drawer / Modal */}
      <AnimatePresence>
        {showVcoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowVcoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0a0a0a] border border-[#D4AF37]/35 rounded-[2.5rem] p-8 max-w-md w-full text-white space-y-6 shadow-[0_0_50px_rgba(212,175,55,0.15)] relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#E6C97A] text-[10px] font-black uppercase tracking-wider border border-[#D4AF37]/25">
                    <Crown size={10} className="fill-[#D4AF37]/20" /> 24/7 Concierge Active
                  </span>
                  <h4 className="text-xl font-serif font-black mt-2 bg-gradient-to-r from-[#F5F2EA] via-[#E6C97A] to-[#D4AF37] bg-clip-text text-transparent">
                    Dedicated VCO Line
                  </h4>
                </div>
                <button
                  onClick={() => setShowVcoModal(false)}
                  className="text-[#8A8A8A] hover:text-white transition-colors text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <img
                  src={vco?.photo || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200"}
                  alt="VCO Photo"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37]/35"
                />
                <div>
                  <h5 className="font-serif font-black text-base text-[#F5F2EA]">{vco?.name || "Dr. Shruti Sen"}</h5>
                  <p className="text-xs text-[#E6C97A] font-bold uppercase tracking-wider">{vco?.title || "Dedicated Care Officer"}</p>
                  <p className="text-[10px] text-[#8A8A8A] font-medium mt-1 leading-snug">{vco?.bio || "Assigned critical care specialist for 24/7 hotline support."}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <a
                  href={`tel:${vco?.hotline || "+919876543210"}`}
                  className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black rounded-2xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] active:scale-95 hover:opacity-95"
                >
                  <Phone size={14} /> Direct Phone Call
                </a>

                <a
                  href={`mailto:${vco?.email || "vco@pawvaidya.com"}`}
                  className="w-full py-3.5 bg-[#121212]/90 hover:bg-[#1f1f1f]/90 text-[#E6C97A] rounded-2xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-all border border-[#D4AF37]/20 active:scale-95"
                >
                  <Mail size={14} /> Send Concierge Email
                </a>

                <button
                  disabled={sendingSosAlert}
                  onClick={() => {
                    setSendingSosAlert(true);
                    setTimeout(() => {
                      setSendingSosAlert(false);
                      toast.success(`🚨 SOS Alert Sent! Your dedicated Veterinary Care Officer, ${vco?.name || 'Dr. Shruti Sen'}, has been dispatched and will call you within 60 seconds.`);
                      setShowVcoModal(false);
                    }, 1500);
                  }}
                  className="w-full py-3.5 bg-red-950/20 hover:bg-red-950/45 text-red-400 rounded-2xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-all border border-red-900/40 active:scale-95"
                >
                  {sendingSosAlert ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-red-400" />
                      Broadcasting SOS...
                    </>
                  ) : (
                    <>
                      <Activity size={14} className="animate-pulse" />
                      Request SOS Callback (60s response)
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
