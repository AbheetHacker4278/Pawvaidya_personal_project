import React, { useContext, useEffect, useState, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles, Lock, Award, ArrowRight, ChevronDown, CheckCircle, RefreshCw,
    Apple, Printer, Calculator, Scale, Heart, AlertTriangle, FileText, Info
} from 'lucide-react';

const DietNutritionPlanner = () => {
    const navigate = useNavigate();
    const { token, userdata, backendurl, userPets, fetchUserPets, authLoading } = useContext(AppContext);

    // Form states
    const [selectedPetId, setSelectedPetId] = useState('');
    const [petName, setPetName] = useState('');
    const [animalType, setAnimalType] = useState('Dog');
    const [breed, setBreed] = useState('');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [activityLevel, setActivityLevel] = useState('Normal');
    const [medicalConditions, setMedicalConditions] = useState('');
    const [goals, setGoals] = useState('');

    // App state
    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState(0);
    const [planResult, setPlanResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Portion calculator state
    const [calcPortions, setCalcPortions] = useState(1); // multiplier
    const [customCalorieInput, setCustomCalorieInput] = useState('');

    // Check tier eligibility: Gold or Platinum active
    const isGoldOrPlatinum = userdata?.subscription?.status === 'Active' &&
        (userdata?.subscription?.plan === 'Gold' || userdata?.subscription?.plan === 'Platinum');

    useEffect(() => {
        if (token && isGoldOrPlatinum) {
            fetchUserPets();
            fetchHistory();
        }
    }, [token, userdata]);

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/nutrition-plan/history`, { headers: { token } });
            if (data.success) {
                setHistory(data.history || []);
            }
        } catch (err) {
            console.error("Error fetching nutrition history:", err.message);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handlePetSelect = (e) => {
        const petId = e.target.value;
        setSelectedPetId(petId);

        if (!petId) {
            setPetName('');
            setBreed('');
            setAge('');
            setWeight('');
            return;
        }

        const pet = userPets.find(p => p._id === petId);
        if (pet) {
            setPetName(pet.name);
            setBreed(pet.breed || '');
            setAge(pet.age || '');
            setWeight(pet.weight || '');
            const type = pet.type ? pet.type.toLowerCase() : '';
            if (type.includes('dog')) setAnimalType('Dog');
            else if (type.includes('cat')) setAnimalType('Cat');
            else setAnimalType('Dog');
        }
    };

    const generatePlan = async (e) => {
        e.preventDefault();
        if (!petName.trim() || !age || !weight) {
            toast.warning("Please fill in Pet Name, Age, and Weight.");
            return;
        }

        setLoading(true);
        setLoadingStage(0);
        setPlanResult(null);

        // Simulation stage visualizer
        const stages = [
            "Analyzing pet physiology metrics...",
            "Computing baseline metabolic rate (RER)...",
            "Adjusting caloric needs for activity levels...",
            "Formulating dietary restrictions for medical concerns...",
            "Assembling customized home recipes...",
            "Compiling premium printable nutrition guide..."
        ];

        for (let i = 0; i < stages.length; i++) {
            setLoadingStage(i);
            await new Promise(res => setTimeout(res, 800));
        }

        try {
            const payload = {
                petId: selectedPetId || null,
                petName,
                animalType,
                breed,
                age: Number(age),
                weight: Number(weight),
                activityLevel,
                medicalConditions: medicalConditions ? medicalConditions.split(',').map(c => c.trim()) : [],
                goals: goals.trim()
            };

            const { data } = await axios.post(`${backendurl}/api/nutrition-plan/generate`, payload, { headers: { token } });
            if (data.success) {
                setPlanResult(data.plan);
                setCustomCalorieInput(data.plan.caloricTarget || '');
                toast.success("AI Nutrition Plan generated successfully!");
                fetchHistory();
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const deletePlan = async (id) => {
        if (!window.confirm("Are you sure you want to delete this nutrition plan?")) return;
        try {
            const { data } = await axios.delete(`${backendurl}/api/nutrition-plan/${id}`, { headers: { token } });
            if (data.success) {
                toast.success(data.message);
                if (planResult && planResult._id === id) {
                    setPlanResult(null);
                }
                fetchHistory();
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Styling constants
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

    // Loading state while verifying authentication
    if (authLoading || (token && !userdata)) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-[#fdf8f0]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="h-12 w-12 border-4 border-[#5A4035] border-t-transparent rounded-full"
                />
            </div>
        );
    }

    // Paywall view for unauthorized tiers
    if (!token || !isGoldOrPlatinum) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center px-4">
                <div className="max-w-4xl w-full rounded-[3.5rem] bg-[#2c1e14] text-[#fdf8f0] overflow-hidden shadow-2xl relative border-2 border-[#d4a017]/30">
                    <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square bg-[#d4a017]/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[60%] aspect-square bg-amber-600/10 rounded-full blur-[100px] pointer-events-none" />

                    <div className="p-8 sm:p-16 text-center flex flex-col items-center relative z-10">
                        <div className="relative mb-8">
                            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#d4a017] to-amber-600 flex items-center justify-center text-white shadow-2xl">
                                <Lock size={44} className="stroke-[2.5]" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-amber-500 border-4 border-[#2c1e14] flex items-center justify-center text-white font-bold text-xs shadow-md">
                                VIP
                            </div>
                        </div>

                        <span className="px-4 py-1.5 rounded-full bg-[#d4a017]/10 border border-[#d4a017]/40 text-[#d4a017] text-xs font-black tracking-widest uppercase mb-4">
                            Gold & Platinum Premium Add-On
                        </span>

                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-2xl mb-4">
                            AI Diet & Nutrition Planner
                        </h1>

                        <p className="text-[#e8d5b0] text-sm sm:text-base font-medium max-w-xl mb-12">
                            Generate bespoke nutritional schedules, calculated target portions, and custom recipes designed for your pet's breed, age, weight, and clinical health markers.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mb-12 text-left">
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                <Apple className="text-[#d4a017] mb-3 w-8 h-8" />
                                <h3 className="font-bold text-white text-sm mb-1">Tailored Portions</h3>
                                <p className="text-xs text-[#e8d5b0]/70 leading-relaxed">Exact calorie breakdown and weight formulas to keep pets at their ideal physiological weights.</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                <Scale className="text-amber-400 mb-3 w-8 h-8" />
                                <h3 className="font-bold text-white text-sm mb-1">Recipe Customization</h3>
                                <p className="text-xs text-[#e8d5b0]/70 leading-relaxed">Easy homemade recipe formulations accounting for chronic conditions like obesity or kidney health.</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                <Printer className="text-[#d4a017] mb-3 w-8 h-8" />
                                <h3 className="font-bold text-white text-sm mb-1">Printable Diet Sheets</h3>
                                <p className="text-xs text-[#e8d5b0]/70 leading-relaxed">Export offline sheets to stick on your fridge or hand over to your pet caretaker.</p>
                            </div>
                        </div>

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
                                Upgrade Plan (Gold/Platinum) <Award size={20} className="fill-current" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16">
            <div className="max-w-6xl mx-auto">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 border-b border-[#e8d5b0] pb-8 print:hidden">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider mb-3 border border-amber-200">
                            <Sparkles size={12} className="fill-current" /> Premium Diet Planner
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: B.dark }}>
                            AI Diet & Nutrition Planner
                        </h1>
                        <p className="mt-2 font-medium" style={{ color: B.light }}>
                            Generate premium daily nutrition schedules, caloric targets, and portion calculators.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-[#d4a017]/10 border border-[#d4a017]/30">
                        <Award size={24} className="text-[#d4a017]" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Access Granted</p>
                            <p className="text-sm font-black text-amber-950">{userdata.subscription.plan} Member</p>
                        </div>
                    </div>
                </div>

                {/* Print View Styling */}
                <div className="hidden print:block mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 border-b pb-4">PawVaidya Pet Nutrition Report</h1>
                    {planResult && (
                        <p className="text-sm text-gray-500 mt-2">
                            Generated for: <strong>{planResult.petName}</strong> | Species: {planResult.animalType} | Breed: {planResult.breed || 'N/A'} | Weight: {planResult.weight} kg
                        </p>
                    )}
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Setup Panel (Wizard Form) */}
                    <div className="lg:col-span-5 space-y-6 print:hidden">
                        <div className="p-8 rounded-[2.5rem] bg-white border border-[#e8d5b0] shadow-xl relative">
                            <h2 className="text-2xl font-black flex items-center gap-2 mb-6" style={{ color: B.dark }}>
                                <Apple className="text-amber-600" /> Pet Baseline Vitals
                            </h2>

                            <form onSubmit={generatePlan} className="space-y-4">
                                {userPets && userPets.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Registered Pet Profile</label>
                                        <div className="relative">
                                            <select
                                                onChange={handlePetSelect}
                                                value={selectedPetId}
                                                className="w-full px-5 py-4 bg-[#fdf8f0] border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm font-semibold text-[#5A4035] appearance-none"
                                            >
                                                <option value="">-- Choose Profile --</option>
                                                {userPets.map(p => (
                                                    <option key={p._id} value={p._id}>{p.name} ({p.type})</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Pet Name</label>
                                    <input
                                        type="text"
                                        value={petName}
                                        onChange={(e) => { setPetName(e.target.value); setSelectedPetId(''); }}
                                        placeholder="E.g., Max"
                                        required
                                        className="w-full px-5 py-4 bg-[#fdf8f0] border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035] font-semibold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Animal Type</label>
                                        <div className="relative">
                                            <select
                                                value={animalType}
                                                onChange={(e) => setAnimalType(e.target.value)}
                                                className="w-full px-5 py-4 bg-[#fdf8f0] border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035] font-semibold appearance-none"
                                            >
                                                <option value="Dog">Dog</option>
                                                <option value="Cat">Cat</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Breed</label>
                                        <input
                                            type="text"
                                            value={breed}
                                            onChange={(e) => setBreed(e.target.value)}
                                            placeholder="E.g., Golden Retriever"
                                            className="w-full px-5 py-4 bg-[#fdf8f0] border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035] font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Age (Years)</label>
                                        <input
                                            type="number"
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                            placeholder="E.g., 3"
                                            required
                                            className="w-full px-5 py-4 bg-[#fdf8f0] border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035] font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Weight (kg)</label>
                                        <input
                                            type="number"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            placeholder="E.g., 12.5"
                                            required
                                            step="0.1"
                                            className="w-full px-5 py-4 bg-[#fdf8f0] border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035] font-semibold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Activity Level</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Low', 'Normal', 'Active'].map((lvl) => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => setActivityLevel(lvl)}
                                                className={`py-3 rounded-2xl text-xs font-black border transition-all ${activityLevel === lvl ? 'bg-[#5A4035] text-white' : 'bg-[#fdf8f0] text-[#5A4035] border-[#e8d5b0] hover:bg-amber-50'}`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Underlying Medical Conditions</label>
                                    <input
                                        type="text"
                                        value={medicalConditions}
                                        onChange={(e) => setMedicalConditions(e.target.value)}
                                        placeholder="Obesity, Allergies, Kidney Disease (comma separated)"
                                        className="w-full px-5 py-4 bg-[#fdf8f0] border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035] font-semibold"
                                    />
                                    <span className="text-[10px] text-gray-400 mt-1 block">Leave empty if pet has no medical concerns.</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Diet Goals / Target Results</label>
                                    <textarea
                                        value={goals}
                                        onChange={(e) => setGoals(e.target.value)}
                                        placeholder="E.g. Weight loss target of 2kg, shinier coat, allergic recipe, muscle building for active training..."
                                        rows={3}
                                        className="w-full px-5 py-4 bg-[#fdf8f0] border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035] font-semibold resize-none"
                                    />
                                    <span className="text-[10px] text-gray-400 mt-1 block">Specify what result you want to achieve for your pet.</span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4.5 rounded-2xl text-white font-black bg-gradient-to-r from-amber-600 to-[#5A4035] shadow-lg hover:scale-[1.01] transition-transform flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw className="animate-spin" size={18} />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} className="fill-current" />
                                            <span>Generate AI Nutrition Plan</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Results Display Panel */}
                    <div className="lg:col-span-7 space-y-6">
                        <AnimatePresence mode="wait">
                            {/* Loading State */}
                            {loading && (
                                <motion.div
                                    key="loading-box"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-8 rounded-[2.5rem] bg-[#2c1e14] text-[#fdf8f0] border border-[#d4a017]/20 shadow-2xl flex flex-col items-center justify-center min-h-[480px] text-center"
                                >
                                    <div className="w-20 h-20 rounded-full border-4 border-[#d4a017]/10 border-t-[#d4a017] animate-spin flex items-center justify-center mb-6">
                                        <Sparkles className="text-[#d4a017] animate-pulse" size={28} />
                                    </div>
                                    <h3 className="text-xl font-black mb-2 text-white">Generating Diet Sheet</h3>
                                    <p className="text-xs text-[#e8d5b0] max-w-xs mb-6">Evaluating physiological requirements and health constraints...</p>

                                    <div className="w-full max-w-xs space-y-2 text-left bg-black/20 p-4 rounded-2xl border border-white/5">
                                        {[
                                            "Analyzing pet physiology metrics...",
                                            "Computing baseline metabolic rate (RER)...",
                                            "Adjusting caloric needs for activity levels...",
                                            "Formulating dietary restrictions for medical concerns...",
                                            "Assembling customized home recipes...",
                                            "Compiling premium printable nutrition guide..."
                                        ].map((stageText, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-[11px] font-bold">
                                                {loadingStage > idx ? (
                                                    <CheckCircle size={12} className="text-emerald-400" />
                                                ) : loadingStage === idx ? (
                                                    <RefreshCw size={12} className="text-[#d4a017] animate-spin" />
                                                ) : (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                                                )}
                                                <span className={loadingStage === idx ? "text-[#d4a017]" : loadingStage > idx ? "text-[#e8d5b0]/60" : "text-white/20"}>
                                                    {stageText}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Nutrition Results */}
                            {!loading && planResult && (
                                <motion.div
                                    key="result-box"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Summary Card */}
                                    <div className="p-8 rounded-[2.5rem] bg-white border border-[#e8d5b0] shadow-xl relative overflow-hidden">
                                        <div className="flex items-center justify-between border-b pb-4 mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700">
                                                    <Apple size={24} />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Nutrition Target</span>
                                                    <h3 className="text-xl font-black text-[#2c1e14]">{planResult.petName}</h3>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handlePrint}
                                                className="px-4 py-2 bg-[#fdf8f0] text-[#5A4035] border border-[#e8d5b0] rounded-xl text-xs font-black hover:bg-amber-50 flex items-center gap-1.5 print:hidden"
                                            >
                                                <Printer size={14} /> Print Schedule
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                            <div className="p-4 rounded-2xl bg-amber-50/50 border border-[#e8d5b0]/40 text-center">
                                                <span className="text-[9px] font-black uppercase text-amber-700 block">Daily Target</span>
                                                <span className="text-2xl font-black text-[#5A4035] block mt-1">
                                                    {planResult.caloricTarget} kcal
                                                </span>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-amber-50/50 border border-[#e8d5b0]/40 text-center">
                                                <span className="text-[9px] font-black uppercase text-amber-700 block">RER Metabolic</span>
                                                <span className="text-xl font-bold text-[#5A4035] block mt-1">
                                                    {Math.round(70 * Math.pow(planResult.weight || 5, 0.75))} kcal
                                                </span>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-amber-50/50 border border-[#e8d5b0]/40 text-center">
                                                <span className="text-[9px] font-black uppercase text-amber-700 block">Meals / Day</span>
                                                <span className="text-2xl font-black text-[#5A4035] block mt-1">
                                                    {Object.values(planResult.dietSchedule || {}).filter(v => typeof v === 'string' && v.trim().length > 0).length || 2}
                                                </span>
                                            </div>
                                        </div>

                                        {planResult.goals && (
                                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/50 flex gap-3 text-xs mb-3">
                                                <Heart className="text-emerald-700 shrink-0 mt-0.5" size={16} />
                                                <div>
                                                    <strong className="text-emerald-900">Diet Goals & Specific Requirements:</strong>
                                                    <p className="text-emerald-800 mt-1">{planResult.goals}</p>
                                                </div>
                                            </div>
                                        )}

                                        {planResult.medicalConditions && planResult.medicalConditions.length > 0 && (
                                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/50 flex gap-3 text-xs">
                                                <AlertTriangle className="text-amber-700 shrink-0 mt-0.5" size={16} />
                                                <div>
                                                    <strong className="text-amber-900">Health Adjustments Active:</strong>
                                                    <p className="text-amber-800 mt-1">Specialized diet tailored for: {planResult.medicalConditions.join(', ')}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Daily Diet Schedule */}
                                    <div className="p-8 rounded-[2.5rem] bg-white border border-[#e8d5b0] shadow-xl">
                                        <h3 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: B.dark }}>
                                            <FileText size={20} className="text-amber-600" /> Daily Diet Schedule
                                        </h3>
                                        <div className="space-y-4">
                                            {['morning', 'afternoon', 'evening'].map((timeKey) => {
                                                const mealText = planResult.dietSchedule?.[timeKey];
                                                if (!mealText) return null;
                                                return (
                                                    <div key={timeKey} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between items-start gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/50 uppercase tracking-wider">
                                                                {timeKey}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap mt-1">{mealText}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Interactive Portion Calculator */}
                                    <div className="p-8 rounded-[2.5rem] bg-white border border-[#e8d5b0] shadow-xl print:hidden">
                                        <h3 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: B.dark }}>
                                            <Calculator size={20} className="text-amber-600" /> Portion Scale Calculator
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-6">
                                            Scale the portion weights dynamically based on custom calorie targets.
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center mb-6">
                                            <div>
                                                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Custom Target Calories (kcal)</label>
                                                <input
                                                    type="number"
                                                    value={customCalorieInput}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        setCustomCalorieInput(e.target.value);
                                                        if (val && planResult.caloricTarget) {
                                                            setCalcPortions(val / planResult.caloricTarget);
                                                        } else {
                                                            setCalcPortions(1);
                                                        }
                                                    }}
                                                    className="w-full px-5 py-4 bg-[#fdf8f0] border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm text-[#5A4035] font-semibold"
                                                />
                                            </div>
                                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-amber-700 block">Scaling Factor</span>
                                                    <span className="text-lg font-black text-amber-950 mt-1 block">{(calcPortions * 100).toFixed(0)}%</span>
                                                </div>
                                                <Scale className="text-amber-600" size={24} />
                                            </div>
                                        </div>

                                        {planResult.portionCalculator && (
                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                <div className="p-4 rounded-2xl bg-amber-50/40 border border-[#e8d5b0]/25 text-center">
                                                    <span className="text-[9px] font-black uppercase text-amber-750 block">Dry Food</span>
                                                    <span className="text-base font-black text-[#5A4035] block mt-1">
                                                        {Math.round((planResult.portionCalculator.dryFoodGrams || 0) * calcPortions)} g
                                                    </span>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-amber-50/40 border border-[#e8d5b0]/25 text-center">
                                                    <span className="text-[9px] font-black uppercase text-amber-750 block">Wet Food</span>
                                                    <span className="text-base font-black text-[#5A4035] block mt-1">
                                                        {Math.round((planResult.portionCalculator.wetFoodGrams || 0) * calcPortions)} g
                                                    </span>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-amber-50/40 border border-[#e8d5b0]/25 text-center">
                                                    <span className="text-[9px] font-black uppercase text-amber-750 block">Water Need</span>
                                                    <span className="text-base font-black text-[#5A4035] block mt-1">
                                                        {Math.round((planResult.portionCalculator.waterRequirementMl || 0) * calcPortions)} ml
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {calcPortions !== 1 && (
                                            <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200/50 text-xs text-emerald-950 font-medium">
                                                Portion weights will scale by <strong>{calcPortions.toFixed(2)}x</strong> to match the target of {customCalorieInput} kcal/day.
                                            </div>
                                        )}
                                    </div>

                                    {/* Custom Homemade Recipes */}
                                    {planResult.customRecipes && planResult.customRecipes.length > 0 && (
                                        <div className="p-8 rounded-[2.5rem] bg-white border border-[#e8d5b0] shadow-xl">
                                            <h3 className="text-xl font-black mb-6 flex items-center gap-2" style={{ color: B.dark }}>
                                                <Heart size={20} className="text-amber-600" /> Healthy Homemade Recipes
                                            </h3>
                                            <div className="space-y-6">
                                                {planResult.customRecipes.map((recipe, idx) => (
                                                    <div key={idx} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                                                        <h4 className="font-black text-sm text-[#5A4035] mb-2">{recipe.title || recipe.recipeName}</h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-3">
                                                            <div>
                                                                <strong className="text-gray-700 block mb-1">Ingredients:</strong>
                                                                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                                                                    {recipe.ingredients?.map((ing, iIdx) => (
                                                                        <li key={iIdx}>{ing}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <div>
                                                                <strong className="text-gray-700 block mb-1">Preparation Instructions:</strong>
                                                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{recipe.instructions}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Awaiting Selection State */}
                            {!loading && !planResult && (
                                <motion.div
                                    key="blank-box"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-8 rounded-[2.5rem] bg-white border border-[#e8d5b0] shadow-xl flex flex-col items-center justify-center min-h-[400px] text-center"
                                >
                                    <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6">
                                        <Apple size={32} />
                                    </div>
                                    <h3 className="text-lg font-black mb-1.5" style={{ color: B.dark }}>Awaiting Input Profile</h3>
                                    <p className="text-xs text-gray-500 font-medium max-w-xs leading-relaxed">
                                        Configure baseline vitals and activity indices in the setup panel and click "Generate AI Nutrition Plan" to compile the custom sheet.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* History Vault List */}
                <div className="mt-16 bg-white rounded-[2.5rem] border border-[#e8d5b0] p-8 shadow-xl print:hidden">
                    <h2 className="text-2xl font-black flex items-center gap-3 mb-6 pb-4 border-b border-gray-100" style={{ color: B.dark }}>
                        <Info className="text-amber-600" /> Historical Diet Vault
                    </h2>

                    {historyLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="animate-spin text-[#5A4035]" size={24} />
                        </div>
                    ) : history.length === 0 ? (
                        <p className="text-center py-12 text-gray-400 font-bold text-sm">
                            No historical diet logs recorded. Generate your first plan.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {history.map((log) => (
                                <div key={log._id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-amber-50/20 transition-all flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-black text-sm text-[#5A4035]">{log.petName} ({log.animalType})</h4>
                                            <span className="text-[10px] text-gray-400 block mt-0.5">
                                                Created: {new Date(log.createdAt).toLocaleDateString()}
                                            </span>
                                            {log.goals && (
                                                <p className="text-[11px] text-[#7a5a48] font-semibold mt-1 bg-amber-50/50 px-2 py-1 rounded-lg border border-[#e8d5b0]/30 line-clamp-1">
                                                    Goal: {log.goals}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => deletePlan(log._id)}
                                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between border-t pt-3 border-gray-200/50">
                                        <span className="text-xs text-gray-500">
                                            Target: <strong>{log.caloricTarget} kcal</strong>
                                        </span>
                                        <button
                                            onClick={() => setPlanResult(log)}
                                            className="px-3.5 py-1.5 bg-[#5A4035] text-white rounded-xl text-xs font-black hover:bg-[#7a5a48]"
                                        >
                                            Load Plan
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DietNutritionPlanner;
