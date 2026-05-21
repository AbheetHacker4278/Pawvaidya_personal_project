import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles, Activity, AlertCircle, Heart, Thermometer,
    ShieldAlert, CheckCircle, Clock, ChevronRight, Lock,
    Award, ShieldCheck, HeartHandshake, Eye, ArrowRight,
    User, ChevronDown, CheckSquare, Square, RefreshCw, AlertTriangle
} from 'lucide-react';

const MLPrediction = () => {
    const navigate = useNavigate();
    const { token, userdata, backendurl, userPets, fetchUserPets } = useContext(AppContext);

    // Vitals inputs
    const [selectedPetId, setSelectedPetId] = useState('');
    const [petName, setPetName] = useState('');
    const [animalType, setAnimalType] = useState('Dog');
    const [age, setAge] = useState('1');
    const [temperature, setTemperature] = useState(101.5);
    const [pulseRate, setPulseRate] = useState(80);
    const [respirationRate, setRespirationRate] = useState(25);
    const [activityLevel, setActivityLevel] = useState('Normal');
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);

    // Application state
    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState(0);
    const [predictionResult, setPredictionResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [expandedLogId, setExpandedLogId] = useState(null);
    
    // Checked items for dynamic care protocol list
    const [checkedPrecautions, setCheckedPrecautions] = useState({});

    // Available symptoms for multi-species checklist
    const symptomsList = [
        { id: 'appetite', label: 'Loss of Appetite' },
        { id: 'lethargy', label: 'Lethargy & Inactivity' },
        { id: 'cough', label: 'Coughing / Labored Breathing' },
        { id: 'diarrhea', label: 'Diarrhea / Bloody stool' },
        { id: 'vomiting', label: 'Vomiting' },
        { id: 'discharge', label: 'Eye or Nose Discharge' },
        { id: 'drool', label: 'Excessive Drooling' },
        { id: 'mouth_sores', label: 'Blisters / Mouth Sores' },
        { id: 'uddr_swelling', label: 'Swollen or Painful Udder' },
        { id: 'strain_urinate', label: 'Straining or Painful Urination' }
    ];

    // Reference values for normal ranges
    const references = {
        Dog: { temp: "101.0 - 102.5 °F", pulse: "70 - 120 bpm", resp: "15 - 35 bpm" },
        Cat: { temp: "100.5 - 102.5 °F", pulse: "120 - 140 bpm", resp: "20 - 30 bpm" },
        Cow: { temp: "100.5 - 102.8 °F", pulse: "40 - 80 bpm", resp: "10 - 30 bpm" },
        Sheep: { temp: "101.5 - 103.5 °F", pulse: "70 - 90 bpm", resp: "12 - 20 bpm" },
        Goat: { temp: "101.5 - 103.5 °F", pulse: "70 - 90 bpm", resp: "12 - 20 bpm" }
    };

    const isPlatinum = userdata?.subscription?.plan === 'Platinum' && userdata?.subscription?.status === 'Active';

    useEffect(() => {
        if (token && isPlatinum) {
            fetchUserPets();
            fetchHistory();
        }
    }, [token, userdata]);

    // Handle picking a pet from user list
    const handlePetSelect = (e) => {
        const petId = e.target.value;
        setSelectedPetId(petId);

        if (!petId) {
            setPetName('');
            setAge('1');
            return;
        }

        const selectedPet = userPets.find(p => p._id === petId);
        if (selectedPet) {
            setPetName(selectedPet.name);
            setAge(selectedPet.age || '1');
            
            // Map pet species
            const type = selectedPet.type ? selectedPet.type.toLowerCase() : '';
            if (type.includes('dog')) {
                setAnimalType('Dog');
                setTemperature(101.5);
                setPulseRate(80);
                setRespirationRate(25);
            } else if (type.includes('cat')) {
                setAnimalType('Cat');
                setTemperature(101.2);
                setPulseRate(125);
                setRespirationRate(24);
            } else if (type.includes('cow') || type.includes('buffalo') || type.includes('cattle')) {
                setAnimalType('Cow');
                setTemperature(101.8);
                setPulseRate(60);
                setRespirationRate(18);
            } else if (type.includes('sheep')) {
                setAnimalType('Sheep');
                setTemperature(102.2);
                setPulseRate(75);
                setRespirationRate(15);
            } else if (type.includes('goat')) {
                setAnimalType('Goat');
                setTemperature(102.5);
                setPulseRate(80);
                setRespirationRate(16);
            }
        }
    };

    const toggleSymptom = (label) => {
        if (selectedSymptoms.includes(label)) {
            setSelectedSymptoms(selectedSymptoms.filter(s => s !== label));
        } else {
            setSelectedSymptoms([...selectedSymptoms, label]);
        }
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/ml-prediction/history`, { headers: { token } });
            if (data.success) {
                setHistory(data.history || []);
            }
        } catch (err) {
            console.error("Error fetching history:", err.message);
        } finally {
            setHistoryLoading(false);
        }
    };

    const runDiagnostics = async () => {
        if (!petName.trim()) {
            toast.warning("Please specify a Pet Name.");
            return;
        }

        setLoading(true);
        setLoadingStage(0);
        setPredictionResult(null);

        // Simulated AI stages
        const stages = [
            "Synthesizing animal species baselines...",
            "Analyzing vital parameter standard deviations...",
            "Parsing custom clinical symptom markers...",
            "Executing rule-based veterinary decision logic...",
            "Requesting expert LLM support diagnosis...",
            "Compiling premium clinical report..."
        ];

        for (let i = 0; i < stages.length; i++) {
            setLoadingStage(i);
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        try {
            const payload = {
                petId: selectedPetId || null,
                petName,
                animalType,
                age,
                temperature: parseFloat(temperature),
                pulseRate: parseInt(pulseRate),
                respirationRate: parseInt(respirationRate),
                symptoms: selectedSymptoms,
                activityLevel
            };

            const { data } = await axios.post(`${backendurl}/api/ml-prediction/predict`, payload, { headers: { token } });
            
            if (data.success) {
                setPredictionResult(data.prediction);
                toast.success(`Analysis Complete! You earned +${data.earnedPawPoints} PawPoints!`);
                
                // Clear checklists
                setCheckedPrecautions({});
                fetchHistory(); // Refresh historical diagnostics list
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const togglePrecaution = (index) => {
        setCheckedPrecautions(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // Return visual indicator details based on severity score
    const getScoreIndicator = (score) => {
        if (score >= 90) return { text: "Optimal Health", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", stroke: "#10b981" };
        if (score >= 75) return { text: "Mild Stress / Safe", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", stroke: "#3b82f6" };
        if (score >= 50) return { text: "Moderate Concern", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", stroke: "#f59e0b" };
        return { text: "High Severity Alert", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", stroke: "#ef4444" };
    };

    const activeIndicators = predictionResult ? getScoreIndicator(predictionResult.healthIndex) : null;

    // Standard styling variables
    const B = {
        dark: '#2c1e14',
        mid: '#5A4035',
        light: '#7a5a48',
        cream: '#f8f0e3',
        sand: '#e8d5b0',
        amber: '#c8860a',
        gold: '#d4a017',
        pale: '#fdf8f0',
        warmWhite: '#fffaf3',
    };

    // If user is not logged in or is not a Platinum subscriber, show luxury locked paywall screen
    if (!token || !isPlatinum) {
        return (
            <div className="min-h-screen pb-12 flex items-center justify-center px-4">
                <div className="max-w-4xl w-full rounded-[3.5rem] bg-[#2c1e14] text-[#fdf8f0] overflow-hidden shadow-2xl relative border-2 border-[#d4a017]/30">
                    {/* Glowing mesh background overlays */}
                    <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square bg-[#d4a017]/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[60%] aspect-square bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

                    <div className="p-8 sm:p-16 text-center flex flex-col items-center relative z-10">
                        {/* Lock and Crown glowing badge */}
                        <div className="relative mb-8">
                            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#d4a017] to-amber-600 flex items-center justify-center text-white shadow-2xl relative">
                                <Lock size={44} className="stroke-[2.5]" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-purple-600 border-4 border-[#2c1e14] flex items-center justify-center text-white font-bold text-xs shadow-md">
                                VIP
                            </div>
                        </div>

                        <span className="px-4 py-1.5 rounded-full bg-[#d4a017]/10 border border-[#d4a017]/40 text-[#d4a017] text-xs font-black tracking-widest uppercase mb-4">
                            Premium Membership Portal
                        </span>
                        
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-2xl mb-4">
                            Unlock AI-Powered Animal Health Predictive Diagnostics
                        </h1>
                        
                        <p className="text-[#e8d5b0] text-sm sm:text-base font-medium max-w-xl mb-12">
                            Access our veterinary diagnostics framework. Formulate high-accuracy vitals analysis, predict medical conditions, and generate custom care precautions.
                        </p>

                        {/* Value proposition tiles */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mb-12 text-left">
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                <Thermometer className="text-[#d4a017] mb-3 w-8 h-8" />
                                <h3 className="font-bold text-white text-sm mb-1">Vitals Deviation Matrix</h3>
                                <p className="text-xs text-[#e8d5b0]/70 leading-relaxed">Runs physiological checks against species baselines to detect fever, shock, or infection risks.</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                <Sparkles className="text-purple-400 mb-3 w-8 h-8" />
                                <h3 className="font-bold text-white text-sm mb-1">Gemma-3 VIP Insights</h3>
                                <p className="text-xs text-[#e8d5b0]/70 leading-relaxed">Generates a luxury, custom care checklist, isolation advice, and emergency warning parameters.</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                <HeartHandshake className="text-[#d4a017] mb-3 w-8 h-8" />
                                <h3 className="font-bold text-white text-sm mb-1">Emergency Redirection</h3>
                                <p className="text-xs text-[#e8d5b0]/70 leading-relaxed">Auto-interfaces severe risks with the Free Platinum video consultation emergency desk instantly.</p>
                            </div>
                        </div>

                        {/* Lock state controls */}
                        {!token ? (
                            <button
                                onClick={() => navigate('/login-form')}
                                className="px-10 py-4.5 rounded-full text-base font-black bg-gradient-to-r from-[#d4a017] to-amber-600 text-white shadow-xl hover:scale-[1.03] transition-transform duration-300 flex items-center gap-2"
                            >
                                Get Started <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/subscription')}
                                className="px-10 py-4.5 rounded-full text-base font-black bg-gradient-to-r from-[#d4a017] to-amber-600 text-white shadow-xl hover:scale-[1.03] transition-transform duration-300 flex items-center gap-2"
                                style={{ boxShadow: '0 8px 30px rgba(212, 160, 23, 0.3)' }}
                            >
                                Upgrade to Platinum Membership <Award size={20} className="fill-current" />
                            </button>
                        )}
                        
                        <p className="text-xs text-white/40 mt-6 font-medium">
                            Already purchased a pass? Allow a few seconds to verify your active plan settings.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-16">
            <div className="max-w-6xl mx-auto">
                
                {/* VIP Header Banner */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 border-b border-[#e8d5b0] pb-8">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-wider mb-3 border border-purple-200">
                            <Sparkles size={12} className="fill-current" /> Platinum Exclusive VIP Tool
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: B.dark }}>
                            AI Animal Health Predictor
                        </h1>
                        <p className="mt-2 font-medium" style={{ color: B.light }}>
                            Perform rapid veterinary diagnostics based on vitals mapping and symptom intelligence.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-[#d4a017]/10 border border-[#d4a017]/30">
                        <Award size={24} className="text-[#d4a017]" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Plan Registered</p>
                            <p className="text-sm font-black text-amber-950">Active Platinum Pass</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Diagnosis Form Panel */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="p-8 rounded-[2.5rem] bg-white border border-[#e8d5b0] shadow-xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                                <h2 className="text-2xl font-black flex items-center gap-3" style={{ color: B.dark }}>
                                    <Activity className="text-purple-600 stroke-[2.5]" /> Vitals Input Panel
                                </h2>
                                <span className="text-xs font-black bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full uppercase">
                                    Step 1 of 2
                                </span>
                            </div>

                            {/* Pet Auto-selector */}
                            {userPets && userPets.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Auto-populate Registered Pet Vitals</label>
                                    <div className="relative">
                                        <select
                                            onChange={handlePetSelect}
                                            value={selectedPetId}
                                            className="w-full px-5 py-4 bg-[#fdf8f0] border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm font-black text-[#5A4035] appearance-none"
                                        >
                                            <option value="">-- Select Registered Pet Profile --</option>
                                            {userPets.map(p => (
                                                <option key={p._id} value={p._id}>{p.name} ({p.type} - {p.breed})</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1.5 font-medium ml-1">
                                        Picking a pet automatically sets species baselines, age, and name templates.
                                    </p>
                                </div>
                            )}

                            {/* Manual Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Pet Name</label>
                                    <input
                                        type="text"
                                        value={petName}
                                        onChange={(e) => setPetName(e.target.value)}
                                        placeholder="E.g., Rocky"
                                        className="w-full px-5 py-4 bg-[#fdf8f0] border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm font-bold text-[#5A4035]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Animal Species</label>
                                    <div className="relative">
                                        <select
                                            value={animalType}
                                            onChange={(e) => {
                                                setAnimalType(e.target.value);
                                                setSelectedPetId(''); // Break auto-selection link
                                            }}
                                            className="w-full px-5 py-4 bg-[#fdf8f0] border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm font-bold text-[#5A4035] appearance-none"
                                        >
                                            <option value="Dog">Dog / Puppy</option>
                                            <option value="Cat">Cat / Kitten</option>
                                            <option value="Cow">Cow / Buffalo</option>
                                            <option value="Sheep">Sheep</option>
                                            <option value="Goat">Goat</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Age (Years)</label>
                                    <input
                                        type="number"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        placeholder="E.g., 2"
                                        className="w-full px-5 py-4 bg-[#fdf8f0] border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm font-bold text-[#5A4035]"
                                    />
                                </div>
                            </div>

                            {/* Vitals Form Sliders & Values */}
                            <div className="space-y-5 mb-8">
                                <div className="p-5 rounded-2xl bg-amber-50/50 border border-[#e8d5b0]/40">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase text-[#5A4035] flex items-center gap-1.5">
                                            <Thermometer size={14} className="text-red-500" /> Rectal Temperature (°F)
                                        </span>
                                        <span className="text-sm font-black text-amber-700 bg-white px-2 py-0.5 rounded border">{temperature} °F</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="95"
                                        max="108"
                                        step="0.1"
                                        value={temperature}
                                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                        className="w-full accent-amber-600"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-bold">
                                        <span>Safe: {references[animalType].temp}</span>
                                        <span>Fever Threshold: &gt;103.0°F</span>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-amber-50/50 border border-[#e8d5b0]/40">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase text-[#5A4035] flex items-center gap-1.5">
                                            <Activity size={14} className="text-emerald-500" /> Pulse / Heart Rate (bpm)
                                        </span>
                                        <span className="text-sm font-black text-amber-700 bg-white px-2 py-0.5 rounded border">{pulseRate} bpm</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="30"
                                        max="240"
                                        step="1"
                                        value={pulseRate}
                                        onChange={(e) => setPulseRate(parseInt(e.target.value))}
                                        className="w-full accent-amber-600"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-bold">
                                        <span>Safe: {references[animalType].pulse}</span>
                                        <span>Critical Deviation: &gt;160 / &lt;50</span>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-amber-50/50 border border-[#e8d5b0]/40">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase text-[#5A4035] flex items-center gap-1.5">
                                            <Activity size={14} className="text-blue-500" /> Respiration Rate (breaths/min)
                                        </span>
                                        <span className="text-sm font-black text-amber-700 bg-white px-2 py-0.5 rounded border">{respirationRate} breaths</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="8"
                                        max="80"
                                        step="1"
                                        value={respirationRate}
                                        onChange={(e) => setRespirationRate(parseInt(e.target.value))}
                                        className="w-full accent-amber-600"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-bold">
                                        <span>Safe: {references[animalType].resp}</span>
                                        <span>High Distress: &gt;40 breaths</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Activity / Vitality Level</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Normal', 'Low', 'Hyperactive'].map((level) => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setActivityLevel(level)}
                                                className={`py-3 rounded-2xl text-xs font-black border transition-all duration-300 ${activityLevel === level ? 'bg-[#5A4035] text-white shadow-lg border-[#5A4035]' : 'bg-[#fdf8f0] text-[#5A4035]/80 hover:bg-amber-50 border-[#e8d5b0]'}`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Symptoms checklist */}
                            <div className="mb-8">
                                <label className="block text-xs font-black uppercase text-gray-400 mb-3 flex items-center gap-1.5">
                                    <AlertCircle size={14} /> Observed Symptoms (Check all that apply)
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {symptomsList.map((symptom) => {
                                        const isChecked = selectedSymptoms.includes(symptom.label);
                                        return (
                                            <button
                                                key={symptom.id}
                                                type="button"
                                                onClick={() => toggleSymptom(symptom.label)}
                                                className={`flex items-center gap-3 p-3.5 rounded-2xl text-left text-xs font-black border transition-all duration-200 ${isChecked ? 'bg-amber-100 border-[#c8860a] text-amber-900 shadow-sm' : 'bg-white hover:bg-amber-50/50 border-gray-200 text-[#5A4035]/80'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${isChecked ? 'bg-[#c8860a] border-[#c8860a] text-white' : 'border-gray-300 bg-gray-50'}`}>
                                                    {isChecked && <CheckCircle size={12} className="stroke-[3]" />}
                                                </div>
                                                <span>{symptom.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Execute Diagnostic Button */}
                            <button
                                onClick={runDiagnostics}
                                disabled={loading}
                                className="w-full py-5 rounded-2xl text-base font-black text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-[#5A4035] shadow-xl hover:scale-[1.01] transition-transform duration-300 flex items-center justify-center gap-2 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                {loading ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={18} />
                                        <span>Analyzing Vitals Profile...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} className="fill-current" />
                                        <span>Run AI Vitals Diagnosis</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Diagnostics Result Panel */}
                    <div className="lg:col-span-5 space-y-6">
                        <AnimatePresence mode="wait">
                            
                            {/* Loading Diagnostics Sequence */}
                            {loading && (
                                <motion.div
                                    key="loading-card"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-8 rounded-[2.5rem] bg-[#2c1e14] text-[#fdf8f0] border border-[#d4a017]/20 shadow-2xl flex flex-col items-center justify-center min-h-[500px] text-center relative overflow-hidden"
                                >
                                    <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square bg-[#d4a017]/10 rounded-full blur-[80px]" />
                                    <div className="absolute bottom-[-20%] right-[-20%] w-[60%] aspect-square bg-purple-500/10 rounded-full blur-[80px]" />

                                    <div className="relative mb-8 flex items-center justify-center">
                                        <div className="w-24 h-24 rounded-full border-4 border-[#d4a017]/10 border-t-[#d4a017] animate-spin flex items-center justify-center" />
                                        <Sparkles className="absolute text-[#d4a017] animate-pulse" size={32} />
                                    </div>

                                    <h3 className="text-xl font-black mb-2 text-white">AI Diagnostics in Progress</h3>
                                    <p className="text-xs text-[#e8d5b0] max-w-xs mb-8">
                                        Please wait. Analyzing reported animal vitals, evaluating species deviations, and compiling immediate recommendations.
                                    </p>

                                    {/* Detailed current loading stage */}
                                    <div className="w-full max-w-xs space-y-2 text-left bg-black/25 p-4 rounded-2xl border border-white/5 relative z-10">
                                        {[
                                            "Synthesizing animal species baselines...",
                                            "Analyzing vital parameter standard deviations...",
                                            "Parsing custom clinical symptom markers...",
                                            "Executing rule-based veterinary decision logic...",
                                            "Requesting expert LLM support diagnosis...",
                                            "Compiling premium clinical report..."
                                        ].map((stageText, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-[11px] font-bold">
                                                {loadingStage > idx ? (
                                                    <CheckCircle size={12} className="text-emerald-400" />
                                                ) : loadingStage === idx ? (
                                                    <RefreshCw size={12} className="text-[#d4a017] animate-spin" />
                                                ) : (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                                                )}
                                                <span className={loadingStage === idx ? "text-[#d4a017]" : loadingStage > idx ? "text-[#e8d5b0]/55" : "text-white/20"}>
                                                    {stageText}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Completed Diagnosis Presentation */}
                            {!loading && predictionResult && (
                                <motion.div
                                    key="result-card"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Circular speedo gauge box */}
                                    <div className="p-8 rounded-[2.5rem] bg-white border border-[#e8d5b0] shadow-xl relative overflow-hidden flex flex-col items-center">
                                        <span className="text-xs font-black uppercase text-gray-400 tracking-wider mb-6">Calculated Health Index</span>
                                        
                                        {/* Radial SVG Gauge */}
                                        <div className="relative w-48 h-48 flex items-center justify-center mb-4">
                                            <svg className="w-full h-full rotate-[-90deg]">
                                                <circle
                                                    cx="96"
                                                    cy="96"
                                                    r="80"
                                                    fill="none"
                                                    stroke="#f3f4f6"
                                                    strokeWidth="12"
                                                />
                                                <circle
                                                    cx="96"
                                                    cy="96"
                                                    r="80"
                                                    fill="none"
                                                    stroke={activeIndicators.stroke}
                                                    strokeWidth="12"
                                                    strokeDasharray={2 * Math.PI * 80}
                                                    strokeDashoffset={2 * Math.PI * 80 * (1 - predictionResult.healthIndex / 100)}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000 ease-out"
                                                />
                                            </svg>
                                            <div className="absolute flex flex-col items-center justify-center">
                                                <span className="text-5xl font-black tracking-tight" style={{ color: B.dark }}>
                                                    {predictionResult.healthIndex}%
                                                </span>
                                                <span className={`text-[10px] font-black uppercase tracking-wider mt-1 px-3 py-1 rounded-full ${activeIndicators.bg} ${activeIndicators.color}`}>
                                                    {predictionResult.riskCategory}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-xs font-bold text-center leading-relaxed text-gray-500 max-w-xs mb-4">
                                            Overall vitality score computed against normal rectal temperature, cardiac frequency, and symptoms checklist density.
                                        </p>
                                    </div>

                                    {/* Predicted illness and custom AI description */}
                                    <div className="p-8 rounded-[2.5rem] bg-white border border-[#e8d5b0] shadow-xl relative">
                                        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-gray-100">
                                            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-700">
                                                <Activity size={24} className="stroke-[2.5]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-purple-600 tracking-wider">Identified Classification</p>
                                                <h3 className="text-xl font-black" style={{ color: B.dark }}>{predictionResult.predictedCondition}</h3>
                                            </div>
                                        </div>

                                        {/* Advisory Letter text block */}
                                        <div className="mb-6">
                                            <p className="text-xs font-black uppercase text-gray-400 mb-3 flex items-center gap-1">
                                                <Sparkles size={14} className="text-[#d4a017]" /> AI Veterinary Analysis
                                            </p>
                                            <div className="p-5 rounded-2xl bg-[#fdf8f0] border border-[#e8d5b0]/40 text-xs font-medium leading-relaxed text-[#5A4035] space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                                {predictionResult.aiAnalysis ? (
                                                    predictionResult.aiAnalysis.split('\n\n').map((paragraph, index) => (
                                                        <p key={index}>
                                                            {paragraph.split('\n').map((line, lIdx) => (
                                                                <span key={lIdx} className="block">
                                                                    {line.startsWith('**') ? <strong>{line.replace(/\*\*/g, '')}</strong> : line}
                                                                </span>
                                                            ))}
                                                        </p>
                                                    ))
                                                ) : (
                                                    <p>Diagnostics compiled for {predictionResult.petName || 'General Animal'}. Vitals deviations evaluated against typical boundaries. Seek a certified physical veterinary check if symptoms develop.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Interactive precautions list */}
                                        {predictionResult.precautions && predictionResult.precautions.length > 0 && (
                                            <div>
                                                <p className="text-xs font-black uppercase text-gray-400 mb-3">Precautionary Care Checklist</p>
                                                <div className="space-y-2">
                                                    {predictionResult.precautions.map((prec, idx) => {
                                                        const isChecked = !!checkedPrecautions[idx];
                                                        return (
                                                            <button
                                                                key={idx}
                                                                onClick={() => togglePrecaution(idx)}
                                                                className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left text-xs font-bold transition-all duration-200 ${isChecked ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950' : 'bg-gray-50 border-gray-200 text-[#5A4035]'}`}
                                                            >
                                                                {isChecked ? (
                                                                    <CheckSquare size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                                                                ) : (
                                                                    <Square size={16} className="text-gray-300 shrink-0 mt-0.5" />
                                                                )}
                                                                <span>{prec}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* FREE VIP Emergency Consultation desk redirection (if risk is high) */}
                                    {predictionResult.riskCategory === 'High Risk' && (
                                        <motion.div
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="p-6 rounded-[2rem] bg-red-500 text-white border border-red-400 shadow-xl flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden"
                                        >
                                            {/* Pulsing warning element */}
                                            <div className="absolute top-[-20%] left-[-20%] w-[50%] aspect-square bg-white/10 rounded-full blur-2xl animate-pulse" />
                                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                                                <AlertTriangle size={26} className="stroke-[2.5]" />
                                            </div>
                                            <div className="flex-1 text-center sm:text-left relative z-10">
                                                <h4 className="font-black text-base">Urgent Care Warning</h4>
                                                <p className="text-xs text-white/90 font-medium mt-1 leading-relaxed">
                                                    High severity vitals detected. As an active Platinum member, your <strong>VIP Priority Consultation is 100% FREE</strong>. Call a certified emergency doctor immediately.
                                                </p>
                                                <button
                                                    onClick={() => navigate('/video-consultation')}
                                                    className="mt-3 px-5 py-2.5 rounded-xl bg-white text-red-600 hover:scale-[1.03] active:scale-[0.98] transition-transform text-xs font-black shadow-lg inline-flex items-center gap-1.5"
                                                >
                                                    Start Free Emergency Video Consultation <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                </motion.div>
                            )}

                            {/* Blank Diagnostic Prompt */}
                            {!loading && !predictionResult && (
                                <motion.div
                                    key="blank-card"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-8 rounded-[2.5rem] bg-white border border-[#e8d5b0] shadow-xl flex flex-col items-center justify-center min-h-[400px] text-center"
                                >
                                    <div className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6">
                                        <Sparkles size={32} className="stroke-[2]" />
                                    </div>
                                    <h3 className="text-lg font-black mb-1.5" style={{ color: B.dark }}>Awaiting Physiological Data</h3>
                                    <p className="text-xs text-gray-500 font-medium max-w-xs leading-relaxed">
                                        Fill out the pet vital values and observed symptoms in the input panel, then press "Run AI Vitals Diagnosis" to begin classification.
                                    </p>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </div>

                {/* Historical records list */}
                <div className="mt-16 bg-white rounded-[2.5rem] border border-[#e8d5b0] p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                        <h2 className="text-2xl font-black flex items-center gap-3" style={{ color: B.dark }}>
                            <Clock className="text-amber-600" /> Historical Diagnostic Logs
                        </h2>
                        <span className="text-xs font-black text-amber-700 bg-amber-50 border px-3 py-1.5 rounded-full uppercase">
                            Platinum Vault
                        </span>
                    </div>

                    {historyLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="animate-spin text-[#5A4035] mb-2" size={24} />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 font-bold text-sm">
                            No past predictions saved. Execute your first AI check above.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {history.map((log) => {
                                const isExpanded = expandedLogId === log._id;
                                const indicators = getScoreIndicator(log.healthIndex);
                                return (
                                    <div
                                        key={log._id}
                                        className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors flex flex-col gap-4 text-xs"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center shrink-0">
                                                    <Heart className="text-purple-600" size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-sm text-[#5A4035]">{log.petName} ({log.animalType})</h4>
                                                    <p className="text-[10px] text-gray-400 mt-0.5 font-bold flex items-center gap-1">
                                                        <Clock size={10} /> {new Date(log.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className={`px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider ${indicators.bg} ${indicators.color}`}>
                                                    {log.riskCategory}
                                                </span>
                                                <span className="font-black text-sm text-gray-700">{log.healthIndex}% score</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                                            <div>
                                                <p className="text-[9px] uppercase text-gray-400 font-black">Probable Condition</p>
                                                <p className="font-black text-xs text-[#5A4035]">{log.predictedCondition}</p>
                                            </div>
                                            <button
                                                onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                                                className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-[10px] font-black tracking-wide uppercase transition-colors"
                                            >
                                                {isExpanded ? "Close" : "Open Report"}
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="border-t border-gray-200/60 pt-4 space-y-4 text-xs font-medium"
                                            >
                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                    <div className="bg-white p-2 rounded-xl border">
                                                        <p className="text-[8px] uppercase text-gray-400 font-black">Temp</p>
                                                        <p className="font-bold text-[#5A4035]">{log.vitals?.temperature || log.temperature} °F</p>
                                                    </div>
                                                    <div className="bg-white p-2 rounded-xl border">
                                                        <p className="text-[8px] uppercase text-gray-400 font-black">Pulse</p>
                                                        <p className="font-bold text-[#5A4035]">{log.vitals?.pulseRate || log.pulseRate} bpm</p>
                                                    </div>
                                                    <div className="bg-white p-2 rounded-xl border">
                                                        <p className="text-[8px] uppercase text-gray-400 font-black">Resp</p>
                                                        <p className="font-bold text-[#5A4035]">{log.vitals?.respirationRate || log.respirationRate} breaths</p>
                                                    </div>
                                                </div>

                                                {log.symptoms && log.symptoms.length > 0 && (
                                                    <div>
                                                        <p className="text-[9px] uppercase text-gray-400 font-black mb-1.5">Observed Symptoms</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {log.symptoms.map((s, idx) => (
                                                                <span key={idx} className="bg-amber-50 border border-amber-200/50 text-[#c8860a] px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase">
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {log.aiAnalysis && (
                                                    <div className="p-3 bg-purple-50/30 border border-purple-200/40 rounded-xl">
                                                        <p className="text-[9px] uppercase text-purple-700 font-black mb-1.5 flex items-center gap-1">
                                                            <Sparkles size={10} className="fill-current" /> Expert AI Assessment
                                                        </p>
                                                        <div className="text-[11px] leading-relaxed text-[#5A4035] space-y-2 whitespace-pre-line max-h-[160px] overflow-y-auto pr-1">
                                                            {log.aiAnalysis}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default MLPrediction;
