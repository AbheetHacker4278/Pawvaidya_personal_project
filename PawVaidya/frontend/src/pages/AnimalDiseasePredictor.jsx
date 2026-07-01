import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
    Award, ShieldCheck, Activity, AlertCircle, ChevronDown, CheckCircle, Clock,
    Download, Eye, Lock, ArrowRight, Sparkles, RefreshCw, AlertTriangle, FileText,
    MessageSquare, CheckSquare, Plus, Trash2, HeartHandshake, UserPlus
} from 'lucide-react';

const AnimalDiseasePredictor = () => {
    const navigate = useNavigate();
    const { token, userdata, backendurl, userPets, fetchUserPets } = useContext(AppContext);

    // Form inputs
    const [selectedPetId, setSelectedPetId] = useState('');
    const [petName, setPetName] = useState('');
    const [animalType, setAnimalType] = useState('Dog');
    const [age, setAge] = useState('1');
    const [symptomsInput, setSymptomsInput] = useState([]); // Array of { name, severity (1-5) }

    // Case tracking log inputs
    const [trackingNotes, setTrackingNotes] = useState({}); // Mapping: { caseId: "note text" }
    const [trackingStatus, setTrackingStatus] = useState({}); // Mapping: { caseId: "status" }

    // Application state
    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState(0);
    const [predictionResult, setPredictionResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [expandedCaseId, setExpandedCaseId] = useState(null);

    // List of symptoms categorized clinically
    const allSymptoms = [
        { name: "Fever", category: "General" },
        { name: "Loss of Appetite", category: "General" },
        { name: "Lethargy & Inactivity", category: "General" },
        { name: "Nasal / Eye Discharge", category: "Respiratory" },
        { name: "Difficulty Breathing", category: "Respiratory" },
        { name: "Severe Vomiting", category: "Gastrointestinal" },
        { name: "Bloody Diarrhea", category: "Gastrointestinal" },
        { name: "Lameness / Limping", category: "Musculoskeletal" },
        { name: "Swelling in Limbs / Muscles", category: "Musculoskeletal", species: ["Cow", "Sheep", "Goat"] },
        { name: "Skin Nodules / Blisters", category: "Integumentary", species: ["Cow", "Sheep", "Goat"] },
        { name: "Drooling / Salivation", category: "Oral/Mammary", species: ["Cow", "Sheep", "Goat"] },
        { name: "Mouth / Hoof Sores", category: "Oral/Mammary", species: ["Cow", "Sheep", "Goat"] },
        { name: "Udder Swelling / Pain", category: "Oral/Mammary", species: ["Cow"] },
        { name: "Abnormal Milk (Clotted/Watery)", category: "Oral/Mammary", species: ["Cow"] },
        { name: "Drop in Milk Production", category: "Oral/Mammary", species: ["Cow", "Sheep", "Goat"] }
    ];

    const isGoldOrPlatinum = (userdata?.subscription?.plan === 'Gold' || userdata?.subscription?.plan === 'Platinum' || userdata?.subscription?.plan === 'Obsidian') && userdata?.subscription?.status === 'Active';

    useEffect(() => {
        if (token && isGoldOrPlatinum) {
            fetchUserPets();
            fetchHistory();
        }
    }, [token, userdata]);

    // Handle picking a registered pet
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
            } else if (type.includes('cat')) {
                setAnimalType('Cat');
            } else if (type.includes('cow') || type.includes('cattle') || type.includes('buffalo')) {
                setAnimalType('Cow');
            } else if (type.includes('sheep')) {
                setAnimalType('Sheep');
            } else if (type.includes('goat')) {
                setAnimalType('Goat');
            }
            // Clear checked symptoms when switching pets
            setSymptomsInput([]);
        }
    };

    // Toggle symptom select
    const handleSymptomToggle = (symptomName) => {
        const index = symptomsInput.findIndex(s => s.name === symptomName);
        if (index > -1) {
            // Remove
            setSymptomsInput(symptomsInput.filter(s => s.name !== symptomName));
        } else {
            // Add with default severity 2 (Moderate)
            setSymptomsInput([...symptomsInput, { name: symptomName, severity: 2 }]);
        }
    };

    // Update symptom severity slider
    const handleSeverityChange = (symptomName, value) => {
        setSymptomsInput(symptomsInput.map(s => {
            if (s.name === symptomName) {
                return { ...s, severity: parseInt(value) };
            }
            return s;
        }));
    };

    // Fetch Gold Case logs
    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const { data } = await axios.get(`${backendurl}/api/disease-predictor/history`, { headers: { token } });
            if (data.success) {
                setHistory(data.history || []);
            }
        } catch (err) {
            console.error("Error fetching disease history:", err.message);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Trigger Gold Machine Learning Predictor
    const runGoldPrediction = async () => {
        if (!petName.trim()) {
            toast.warning("Please enter a pet name.");
            return;
        }
        if (symptomsInput.length === 0) {
            toast.warning("Please check at least one observed symptom.");
            return;
        }

        setLoading(true);
        setLoadingStage(0);
        setPredictionResult(null);

        // Standard Streamlit ML pipeline simulation
        const stages = [
            "Initializing Random Forest diagnostic weights...",
            "Matching observed symptoms to clinical matrices...",
            "Evaluating symptom severity multipliers...",
            "Computing probabilistic disease confidence ratings...",
            "Formulating comprehensive case monitoring track..."
        ];

        for (let i = 0; i < stages.length; i++) {
            setLoadingStage(i);
            await new Promise(resolve => setTimeout(resolve, 600));
        }

        try {
            const payload = {
                petId: selectedPetId || null,
                petName,
                animalType,
                age: parseInt(age || 1),
                symptoms: symptomsInput
            };

            const { data } = await axios.post(`${backendurl}/api/disease-predictor/predict`, payload, { headers: { token } });

            if (data.success) {
                setPredictionResult(data.prediction);
                toast.success(`Diagnosis Complete! +${data.earnedPawPoints} Loyalty PawPoints credited!`);
                setSymptomsInput([]); // Reset
                fetchHistory(); // Refresh grid
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Update tracking log comments / status
    const submitTrackingLog = async (caseId) => {
        const note = trackingNotes[caseId];
        const status = trackingStatus[caseId] || history.find(c => c._id === caseId)?.caseStatus || 'Monitoring';

        if (!note || !note.trim()) {
            toast.warning("Please type a tracking progress note.");
            return;
        }

        try {
            const { data } = await axios.post(
                `${backendurl}/api/disease-predictor/track/${caseId}`,
                { note, caseStatus: status },
                { headers: { token } }
            );

            if (data.success) {
                toast.success("Case tracking logs updated successfully!");
                // Clear note input
                setTrackingNotes({ ...trackingNotes, [caseId]: '' });
                // Update history item in state to avoid layout reload
                setHistory(history.map(item => item._id === caseId ? data.updatedCase : item));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        }
    };

    // Clinical PDF generator compiler
    const downloadClinicalReport = (item) => {
        const printWindow = window.open('', '_blank', 'width=900,height=800');
        if (!printWindow) {
            toast.error("Please disable your popup blocker to compile the clinical PDF report.");
            return;
        }

        const topPrediction = item.predictions[0];
        const symptomsRows = item.symptoms.map(s => {
            const severityText = s.severity === 5 ? "Critical (5/5)" : s.severity === 4 ? "Severe (4/5)" : s.severity === 3 ? "Noticeable (3/5)" : s.severity === 2 ? "Moderate (2/5)" : "Mild (1/5)";
            return `<tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>${s.name}</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${s.severity} / 5</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: ${s.severity >= 4 ? '#b45309' : '#1b3726'}">${severityText}</td>
            </tr>`;
        }).join('');

        const predictionsRows = item.predictions.map((p, idx) => {
            return `<tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${idx + 1}. <strong>${p.condition}</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #b8860b;">${p.confidence}% Probability</td>
            </tr>`;
        }).join('');

        const logsRows = item.trackingLogs.map(l => {
            return `<div style="padding: 12px; margin-bottom: 8px; background: #faf8f5; border-radius: 8px; border-left: 4px solid #b8860b; font-size: 11px;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px; color: #5a4035;">
                    <span>Status: ${l.statusAtLog}</span>
                    <span>${new Date(l.createdAt).toLocaleString()}</span>
                </div>
                <div style="color: #666;">${l.note}</div>
            </div>`;
        }).join('');

        const html = `
        <html>
        <head>
            <title>PawVaidya Clinical Disease Report - ${item.petName}</title>
            <style>
                body { font-family: 'Outfit', sans-serif; background: #fff; color: #333; margin: 40px; }
                .header { text-align: center; border-bottom: 3px double #d4af37; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 28px; font-weight: 900; color: #1b3726; margin-bottom: 5px; }
                .title { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #b8860b; font-weight: bold; }
                .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .meta-table td { padding: 8px; border: 1px solid #ddd; font-size: 13px; }
                .section-title { font-size: 16px; font-weight: bold; color: #1b3726; border-bottom: 1px solid #d4af37; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; }
                table.data-table { width: 100%; border-collapse: collapse; }
                table.data-table th { background: #f8f5f0; padding: 10px; font-size: 12px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #ddd; }
                .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; background: #fef3c7; color: #b45309; }
                .footer { text-align: center; margin-top: 50px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🐾 PawVaidya Premium Portal</div>
                <div class="title">Gold Subscription Clinical Diagnostic Report</div>
            </div>

            <table class="meta-table">
                <tr>
                    <td style="background: #fdfaf6; font-weight: bold; width: 20%;">Pet Profile Name:</td>
                    <td><strong>${item.petName}</strong></td>
                    <td style="background: #fdfaf6; font-weight: bold; width: 20%;">Species Type:</td>
                    <td>${item.animalType}</td>
                </tr>
                <tr>
                    <td style="background: #fdfaf6; font-weight: bold;">Report Date:</td>
                    <td>${new Date(item.createdAt).toLocaleDateString()}</td>
                    <td style="background: #fdfaf6; font-weight: bold;">Age / Status:</td>
                    <td>${item.age} Years / <span class="badge">${item.caseStatus}</span></td>
                </tr>
                <tr>
                    <td style="background: #fdfaf6; font-weight: bold;">Case ID Token:</td>
                    <td colspan="3"><code style="font-size: 11px; color: #b8860b;">${item._id}</code></td>
                </tr>
            </table>

            <div class="section-title">1. Observed Symptoms & Severity Telemetry</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="text-align: left;">Symptom Name</th>
                        <th style="text-align: center; width: 20%;">Severity Rating</th>
                        <th style="text-align: right; width: 30%;">Clinical Interpretation</th>
                    </tr>
                </thead>
                <tbody>
                    ${symptomsRows}
                </tbody>
            </table>

            <div class="section-title">2. Probabilistic Diagnostic Classification Results (ML Classifier)</div>
            <p style="font-size: 12px; color: #666; margin-bottom: 15px;">Computed using our clinical symptom-severity random forest classifier engine mapped against typical physiological parameters.</p>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="text-align: left;">Predicted Disease Condition</th>
                        <th style="text-align: right; width: 45%;">Probability Confidence</th>
                    </tr>
                </thead>
                <tbody>
                    ${predictionsRows}
                </tbody>
            </table>

            <div class="section-title">3. Veterinary Case Tracking Logs & monitoring Progress</div>
            <div style="margin-top: 10px;">
                ${logsRows || '<p style="font-size: 12px; color: #888;">No tracking history logs recorded.</p>'}
            </div>

            <div class="footer">
                This report is compiled by the PawVaidya Gold Symptom-Severity Predictor Engine.<br/>
                Always cross-reference automated digital diagnoses with a physical certified veterinary practitioner in case of emergency.
            </div>

            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    // Styling themes
    const B = {
        dark: '#2c1e14',
        mid: '#5A4035',
        light: '#7a5a48',
        cream: '#f8f0e3',
        sand: '#e8d5b0',
        gold: '#b8860b',
        goldLight: '#d4af37',
        amber: '#c8860a',
        goldGlow: '0 0 20px rgba(212, 175, 55, 0.25)',
    };

    // If user has no active Gold / Platinum subscription, render lock paywall
    if (!token || !isGoldOrPlatinum) {
        return (
            <div className="min-h-screen pb-12 flex items-center justify-center px-4">
                <div className="max-w-4xl w-full rounded-[3.5rem] bg-[#1e1512] text-[#fdf8f0] overflow-hidden shadow-2xl relative border-2 border-[#d4af37]/30 luxury-noise-bg">
                    {/* Golden mesh background overrides */}
                    <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square bg-[#d4af37]/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[60%] aspect-square bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="p-8 sm:p-16 text-center flex flex-col items-center relative z-10">
                        {/* Lock Crown glowing badge */}
                        <div className="relative mb-8">
                            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#d4af37] to-amber-700 flex items-center justify-center text-white shadow-2xl animate-pulse-gold relative">
                                <Lock size={44} className="stroke-[2.5]" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-amber-600 border-4 border-[#1e1512] flex items-center justify-center text-white font-bold text-xs shadow-md">
                                GOLD
                            </div>
                        </div>

                        <span className="px-4 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/40 text-[#d4af37] text-xs font-black tracking-widest uppercase mb-4">
                            Gold Member Exclusive
                        </span>

                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-2xl mb-4 text-white">
                            Unlock Symptom-Severity Animal Disease Predictor
                        </h1>

                        <p className="text-[#e8d5b0] text-sm sm:text-base font-medium max-w-xl mb-12">
                            Integrate your clinical observation records with our Random Forest probability engine. Predict disease likelihood, track case updates, and download clinical PDF sheets.
                        </p>

                        {/* Value proposition tiles */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mb-12 text-left">
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                <Activity className="text-[#d4af37] mb-3 w-8 h-8" />
                                <h3 className="font-bold text-white text-sm mb-1">Random Forest Logic</h3>
                                <p className="text-xs text-[#e8d5b0]/70 leading-relaxed">Runs symptom input matching against weighted clinical disease profiles to construct accurate probability ratings.</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                <FileText className="text-[#d4af37] mb-3 w-8 h-8" />
                                <h3 className="font-bold text-white text-sm mb-1">Printable Clinical Sheets</h3>
                                <p className="text-xs text-[#e8d5b0]/70 leading-relaxed">Generates beautiful, clinical-formatted PDF summaries of pet diagnoses, checked symptoms, and results instantly.</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                <MessageSquare className="text-amber-400 mb-3 w-8 h-8" />
                                <h3 className="font-bold text-white text-sm mb-1">Interactive Case Logs</h3>
                                <p className="text-xs text-[#e8d5b0]/70 leading-relaxed">Gold owners can log veterinary progress notes, record treatment dates, and toggle recovered cases.</p>
                            </div>
                        </div>

                        {/* Lock actions */}
                        {!token ? (
                            <button
                                onClick={() => navigate('/login-form')}
                                className="px-10 py-4.5 rounded-full text-base font-black bg-gradient-to-r from-[#d4af37] to-amber-600 text-white shadow-xl hover:scale-[1.03] transition-transform duration-300 flex items-center gap-2"
                            >
                                Get Started <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/subscription')}
                                className="px-10 py-4.5 rounded-full text-base font-black bg-gradient-to-r from-[#d4af37] to-amber-600 text-white shadow-xl hover:scale-[1.03] transition-transform duration-300 flex items-center gap-2 animate-pulse-gold"
                            >
                                Upgrade to Gold Membership <Award size={20} className="fill-current" />
                            </button>
                        )}

                        <p className="text-xs text-white/40 mt-6 font-medium">
                            Need complete vital checks, radial speedometer dashboards, and Gemma-3 isolation advisories? Look at our **Platinum Plan**!
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
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider mb-3 border border-[#d4af37]/30">
                            <Award size={12} className="fill-current text-[#b8860b]" /> Gold Member Exclusive Tool
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: B.dark }}>
                            Animal Disease Predictor 👑
                        </h1>
                        <p className="mt-2 font-medium" style={{ color: B.light }}>
                            Map veterinary symptom severity profiles, evaluate disease probabilities, and log case tracking chronicles.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-[#d4af37]/10 border border-[#d4af37]/30 shadow-sm">
                        <Award size={24} className="text-[#b8860b]" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Level Authorized</p>
                            <p className="text-sm font-black text-amber-950">Active Gold / VIP Plan</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Symptoms input checklist matrix */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="p-8 rounded-[2.5rem] bg-white border border-[#e8d5b0] shadow-xl relative">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                                <h2 className="text-2xl font-black flex items-center gap-3" style={{ color: B.dark }}>
                                    <Activity className="text-amber-600 stroke-[2.5]" /> Symptom Severity Panel
                                </h2>
                                <span className="text-xs font-black bg-amber-50 text-[#b8860b] border px-3 py-1.5 rounded-full uppercase">
                                    Observation Entry
                                </span>
                            </div>

                            {/* Pet profile picker */}
                            {userPets && userPets.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Select Companion Profile</label>
                                    <div className="relative">
                                        <select
                                            onChange={handlePetSelect}
                                            value={selectedPetId}
                                            className="w-full px-5 py-4 bg-[#fdf8f0] border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm font-black text-[#5A4035] appearance-none"
                                        >
                                            <option value="">-- Choose Registered Pet --</option>
                                            {userPets.map(p => (
                                                <option key={p._id} value={p._id}>{p.name} ({p.type} - {p.breed})</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                            )}

                            {/* Manual Info Entry */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Pet Name</label>
                                    <input
                                        type="text"
                                        value={petName}
                                        onChange={(e) => setPetName(e.target.value)}
                                        placeholder="E.g., Boxer"
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
                                                setSelectedPetId(''); // Break picker link
                                                setSymptomsInput([]);
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
                                        placeholder="E.g., 3"
                                        className="w-full px-5 py-4 bg-[#fdf8f0] border border-[#e8d5b0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c8860a] text-sm font-bold text-[#5A4035]"
                                    />
                                </div>
                            </div>

                            {/* Symptoms list with conditional species filtering */}
                            <div className="space-y-6 mb-8">
                                <label className="block text-xs font-black uppercase text-gray-400 flex items-center gap-1.5">
                                    <AlertCircle size={14} className="text-[#b8860b]" /> Checked Observations & Severity Configurator
                                </label>

                                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
                                    {allSymptoms
                                        .filter(s => !s.species || s.species.includes(animalType))
                                        .map((symptom) => {
                                            const activeSymptom = symptomsInput.find(s => s.name === symptom.name);
                                            const isChecked = !!activeSymptom;

                                            return (
                                                <div
                                                    key={symptom.name}
                                                    className={`p-4 rounded-2xl border transition-all duration-200 ${isChecked ? 'bg-amber-50/50 border-[#d4af37]/45' : 'bg-white border-gray-100 hover:bg-gray-50/50'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSymptomToggle(symptom.name)}
                                                            className="flex items-center gap-3 text-left"
                                                        >
                                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${isChecked ? 'bg-[#b8860b] border-[#b8860b] text-white' : 'border-gray-300 bg-gray-50'}`}>
                                                                {isChecked && <CheckCircle size={12} className="stroke-[3]" />}
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-black text-[#5A4035]">{symptom.name}</span>
                                                                <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 text-[9px] uppercase font-bold">{symptom.category}</span>
                                                            </div>
                                                        </button>

                                                        {isChecked && (
                                                            <span className="text-xs font-black text-amber-800 bg-white px-2 py-0.5 rounded border">
                                                                Severity: {activeSymptom.severity === 5 ? "Critical" : activeSymptom.severity === 4 ? "Severe" : activeSymptom.severity === 3 ? "Noticeable" : activeSymptom.severity === 2 ? "Moderate" : "Mild"}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {isChecked && (
                                                        <div className="mt-4 pt-3 border-t border-dashed border-[#e8d5b0]/40 flex items-center gap-4">
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase shrink-0">Level Sliders:</span>
                                                            <input
                                                                type="range"
                                                                min="1"
                                                                max="5"
                                                                step="1"
                                                                value={activeSymptom.severity}
                                                                onChange={(e) => handleSeverityChange(symptom.name, e.target.value)}
                                                                className="w-full accent-[#b8860b]"
                                                            />
                                                            <span className="text-xs font-black text-[#b8860b] shrink-0 w-8 text-right">{activeSymptom.severity} / 5</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* Prediction Button */}
                            <button
                                onClick={runGoldPrediction}
                                disabled={loading}
                                className="w-full py-5 rounded-2xl text-base font-black text-white bg-gradient-to-r from-amber-600 via-[#b8860b] to-[#5A4035] shadow-xl hover:scale-[1.01] transition-transform duration-300 flex items-center justify-center gap-2 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                {loading ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={18} />
                                        <span>Synthesizing Severity Vectors...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} className="fill-current text-[#e8d5b0]" />
                                        <span>Compute Random Forest Probability</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Prediction Output Results */}
                    <div className="lg:col-span-5 space-y-6">
                        <AnimatePresence mode="wait">

                            {/* Loading Pipeline */}
                            {loading && (
                                <motion.div
                                    key="gold-loading"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-8 rounded-[2.5rem] bg-[#1e1512] text-[#fdf8f0] border border-[#d4af37]/20 shadow-2xl flex flex-col items-center justify-center min-h-[480px] text-center relative overflow-hidden"
                                >
                                    <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square bg-[#d4af37]/10 rounded-full blur-[80px]" />

                                    <div className="relative mb-8 flex items-center justify-center">
                                        <div className="w-24 h-24 rounded-full border-4 border-[#d4af37]/10 border-t-[#d4af37] animate-spin flex items-center justify-center" />
                                        <Award className="absolute text-[#d4af37] animate-pulse" size={32} />
                                    </div>

                                    <h3 className="text-xl font-black mb-2 text-white">Classifier Processing Data</h3>
                                    <p className="text-xs text-[#e8d5b0] max-w-xs mb-8 font-medium">
                                        Streamlit Random Forest decision estimators are compiling checked symptom severities.
                                    </p>

                                    {/* Progress track checklist */}
                                    <div className="w-full max-w-xs space-y-2 text-left bg-black/25 p-4 rounded-2xl border border-white/5 relative z-10">
                                        {[
                                            "Initializing Random Forest diagnostic weights...",
                                            "Matching observed symptoms to clinical matrices...",
                                            "Evaluating symptom severity multipliers...",
                                            "Computing probabilistic disease confidence ratings...",
                                            "Formulating comprehensive case monitoring track..."
                                        ].map((stageText, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-[10px] font-bold">
                                                {loadingStage > idx ? (
                                                    <CheckCircle size={11} className="text-emerald-400" />
                                                ) : loadingStage === idx ? (
                                                    <RefreshCw size={11} className="text-[#d4af37] animate-spin" />
                                                ) : (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                                                )}
                                                <span className={loadingStage === idx ? "text-[#d4af37]" : loadingStage > idx ? "text-[#e8d5b0]/55" : "text-white/20"}>
                                                    {stageText}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Completed Result Card */}
                            {!loading && predictionResult && (
                                <motion.div
                                    key="gold-result"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="p-8 rounded-[2.5rem] bg-white border border-[#e8d5b0] shadow-xl relative">

                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                            <span className="text-xs font-black uppercase text-gray-400">Diagnosis Output</span>
                                            <button
                                                onClick={() => downloadClinicalReport(predictionResult)}
                                                className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-[#e8d5b0] text-[#b8860b] text-[11px] font-black flex items-center gap-1.5 transition-colors"
                                            >
                                                <Download size={12} /> Get Clinical PDF
                                            </button>
                                        </div>

                                        <h3 className="text-xs font-black uppercase text-gray-400 mb-4 flex items-center gap-1.5">
                                            <Activity size={14} className="text-[#b8860b]" /> Computed Disease Probabilities
                                        </h3>

                                        {/* Horizontal Progress bar bars */}
                                        <div className="space-y-4 mb-6">
                                            {predictionResult.predictions.map((p, idx) => (
                                                <div key={idx} className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs font-black text-[#5A4035]">
                                                        <span>{p.condition}</span>
                                                        <span className="text-[#b8860b]">{p.confidence}%</span>
                                                    </div>
                                                    <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden border">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-amber-400 to-[#b8860b] rounded-full transition-all duration-1000"
                                                            style={{ width: `${p.confidence}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Case status badge */}
                                        <div className="p-4 rounded-2xl bg-amber-50/50 border border-[#e8d5b0]/40 flex items-center justify-between text-xs">
                                            <span className="font-bold text-[#5A4035]">Initial Tracking Status:</span>
                                            <span className={`px-3 py-1 rounded-full font-black uppercase tracking-wider text-[10px] ${predictionResult.caseStatus === 'Requires Vet' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                                {predictionResult.caseStatus}
                                            </span>
                                        </div>

                                        {predictionResult.aiAnalysis && (
                                            <div className="mt-6 p-5 rounded-2xl bg-amber-50/30 border border-[#e8d5b0]/30 space-y-2">
                                                <h4 className="text-xs font-black text-amber-800 uppercase flex items-center gap-1.5">
                                                    <Sparkles size={13} className="text-amber-600" /> Premium DeepSeek AI Analysis
                                                </h4>
                                                <div className="text-xs text-[#5A4035] leading-relaxed whitespace-pre-wrap font-medium">
                                                    {predictionResult.aiAnalysis}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Blank Prompt */}
                            {!loading && !predictionResult && (
                                <motion.div
                                    key="gold-blank"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-8 rounded-[2.5rem] bg-white border border-[#e8d5b0] shadow-xl flex flex-col items-center justify-center min-h-[400px] text-center"
                                >
                                    <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-[#e8d5b0] flex items-center justify-center text-[#b8860b] mb-6">
                                        <FileText size={32} className="stroke-[2]" />
                                    </div>
                                    <h3 className="text-lg font-black mb-1.5" style={{ color: B.dark }}>Awaiting Observation Data</h3>
                                    <p className="text-xs text-gray-500 font-medium max-w-xs leading-relaxed">
                                        Select symptoms and configure their severity levels on the left panel, then hit compute to run probability modeling estimators.
                                    </p>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </div>

                {/* Tracking logs logs section */}
                <div className="mt-16 bg-white rounded-[2.5rem] border border-[#e8d5b0] p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                        <h2 className="text-2xl font-black flex items-center gap-3" style={{ color: B.dark }}>
                            <Clock className="text-[#b8860b]" /> Active Cases Chronicles & Tracking
                        </h2>
                        <span className="text-xs font-black text-amber-700 bg-amber-50 border border-[#e8d5b0]/60 px-3 py-1.5 rounded-full uppercase">
                            Case Log Tracker
                        </span>
                    </div>

                    {historyLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="animate-spin text-[#5A4035]" size={24} />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 font-bold text-sm">
                            No active clinical cases saved. Compute your first severity predictor check.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {history.map((item) => {
                                const isExpanded = expandedCaseId === item._id;
                                const topPrediction = item.predictions[0];
                                return (
                                    <div
                                        key={item._id}
                                        className="p-6 rounded-[2rem] border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors flex flex-col gap-4 text-xs font-medium"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center shrink-0">
                                                    <Award className="text-[#b8860b]" size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-sm text-[#5A4035]">{item.petName} ({item.animalType})</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold mt-0.5 flex items-center gap-1">
                                                        <Clock size={10} /> Diagnosed: {new Date(item.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${item.caseStatus === 'Resolved' ? 'bg-blue-100 text-blue-800' : item.caseStatus === 'Requires Vet' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                                    {item.caseStatus}
                                                </span>
                                                <button
                                                    onClick={() => downloadClinicalReport(item)}
                                                    className="p-2 rounded-xl bg-white border hover:bg-gray-50 text-gray-500 hover:text-[#b8860b]"
                                                    title="Download PDF Sheet"
                                                >
                                                    <Download size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setExpandedCaseId(isExpanded ? null : item._id)}
                                                    className="px-4 py-2 bg-[#5A4035] hover:bg-[#7a5a48] text-white font-black text-[10px] rounded-xl flex items-center gap-1 transition-colors"
                                                >
                                                    {isExpanded ? "Collapse Case" : "Track Logs"}
                                                </button>
                                            </div>
                                        </div>
                                        {/* Brief Top Match Indicator */}
                                        <div className="p-4 rounded-xl bg-white border flex items-center justify-between text-[11px]">
                                            <span className="text-gray-400">Primary Predicted Condition:</span>
                                            <span className="font-black text-[#5A4035]">{topPrediction.condition} ({topPrediction.confidence}%)</span>
                                        </div>

                                        {/* Expanded Tracking Logs Console */}
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                className="pt-4 border-t border-dashed border-gray-200 space-y-4"
                                            >
                                                {item.aiAnalysis && (
                                                    <div className="p-5 rounded-2xl bg-amber-50/30 border border-[#e8d5b0]/30 space-y-2">
                                                        <h5 className="text-[10px] font-black text-amber-800 uppercase flex items-center gap-1.5">
                                                            <Sparkles size={12} className="text-amber-600" /> DeepSeek AI Clinical Insight
                                                        </h5>
                                                        <div className="text-xs text-[#5A4035] leading-relaxed whitespace-pre-wrap font-medium">
                                                            {item.aiAnalysis}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Historic Tracking Comment Threads */}
                                                <div>
                                                    <h5 className="font-black text-gray-400 uppercase text-[9px] mb-2.5">Veterinary Progression Chronicle</h5>
                                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
                                                        {item.trackingLogs.map((log, idx) => (
                                                            <div key={idx} className="p-3 bg-white rounded-xl border flex flex-col gap-1">
                                                                <div className="flex items-center justify-between text-[9px] font-black text-gray-400">
                                                                    <span className="text-amber-800">Status: {log.statusAtLog}</span>
                                                                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                                                                </div>
                                                                <p className="text-gray-600 font-bold">{log.note}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Submit New tracking logs form */}
                                                <div className="p-4 rounded-2xl bg-amber-50/40 border border-[#e8d5b0]/40 space-y-3">
                                                    <h5 className="font-black text-amber-900 uppercase text-[9px]">Add Chronic Progress Note</h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <div className="sm:col-span-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Type treatment notes or recovery updates..."
                                                                value={trackingNotes[item._id] || ''}
                                                                onChange={(e) => setTrackingNotes({ ...trackingNotes, [item._id]: e.target.value })}
                                                                className="w-full px-4 py-3 bg-white border border-[#e8d5b0] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#b8860b] font-bold text-xs"
                                                            />
                                                        </div>
                                                        <div>
                                                            <select
                                                                value={trackingStatus[item._id] || item.caseStatus}
                                                                onChange={(e) => setTrackingStatus({ ...trackingStatus, [item._id]: e.target.value })}
                                                                className="w-full px-4 py-3 bg-white border border-[#e8d5b0] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#b8860b] font-black text-xs text-[#5A4035] appearance-none"
                                                            >
                                                                <option value="Monitoring">Monitoring (Green)</option>
                                                                <option value="Requires Vet">Requires Vet (Orange)</option>
                                                                <option value="Resolved">Resolved (Blue)</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => submitTrackingLog(item._id)}
                                                        className="px-6 py-2.5 bg-[#b8860b] hover:bg-amber-700 text-white font-black text-[10px] rounded-xl flex items-center gap-1.5 transition-colors"
                                                    >
                                                        <Plus size={12} /> Post tracking Progress Note
                                                    </button>
                                                </div>
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

export default AnimalDiseasePredictor;
