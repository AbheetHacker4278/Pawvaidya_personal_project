import userModel from '../models/userModel.js';
import petModel from '../models/petModel.js';
import mlPredictionModel from '../models/mlPredictionModel.js';
import { runAgentLoop } from '../services/agentOrchestrator.js';

// Vitals normal range reference dictionary
const normalRanges = {
    cow: {
        temp: { min: 100.5, max: 102.8, unit: '°F' },
        pulse: { min: 40, max: 80, unit: 'bpm' },
        respiration: { min: 10, max: 30, unit: 'bpm' }
    },
    dog: {
        temp: { min: 101.0, max: 102.5, unit: '°F' },
        pulse: { min: 70, max: 120, unit: 'bpm' },
        respiration: { min: 15, max: 35, unit: 'bpm' }
    },
    cat: {
        temp: { min: 100.5, max: 102.5, unit: '°F' },
        pulse: { min: 120, max: 140, unit: 'bpm' },
        respiration: { min: 20, max: 30, unit: 'bpm' }
    },
    sheep: {
        temp: { min: 101.5, max: 103.5, unit: '°F' },
        pulse: { min: 70, max: 90, unit: 'bpm' },
        respiration: { min: 12, max: 20, unit: 'bpm' }
    },
    goat: {
        temp: { min: 101.5, max: 103.5, unit: '°F' },
        pulse: { min: 70, max: 90, unit: 'bpm' },
        respiration: { min: 12, max: 20, unit: 'bpm' }
    }
};

/**
 * Predict Animal Health Risk & Condition based on Vitals and Symptoms
 * Restricts access to Platinum Subscription tier users.
 */
export const predictHealth = async (req, res) => {
    try {
        const { userId } = req.body;
        const {
            petId,
            petName,
            animalType,
            age,
            temperature,
            pulseRate,
            respirationRate,
            symptoms = [],
            activityLevel = 'Normal'
        } = req.body;

        // 1. Subscription Tier Verification
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({
                success: false,
                message: "User account not found."
            });
        }

        const isPlatinum = user.subscription?.plan === 'Platinum' && user.subscription?.status === 'Active';
        if (!isPlatinum) {
            return res.json({
                success: false,
                isPremiumRestricted: true,
                message: "This AI-powered Animal Health Diagnostic Predictor is exclusively available to Active Platinum Subscription users. Upgrade your plan to instantly unlock this VIP medical tool!"
            });
        }

        // Validate basic vitals input
        if (!animalType || !temperature || !pulseRate || !respirationRate) {
            return res.json({
                success: false,
                message: "Missing core animal vitals or type parameters."
            });
        }

        const lowerType = animalType.toLowerCase();
        const refRange = normalRanges[lowerType] || normalRanges['dog']; // Fallback to dog if unknown type

        // 2. Perform Machine Learning / Vitals Classifier logic
        let tempDiff = 0;
        let pulseDiff = 0;
        let respDiff = 0;

        if (temperature < refRange.temp.min) {
            tempDiff = refRange.temp.min - temperature;
        } else if (temperature > refRange.temp.max) {
            tempDiff = temperature - refRange.temp.max;
        }

        if (pulseRate < refRange.pulse.min) {
            pulseDiff = refRange.pulse.min - pulseRate;
        } else if (pulseRate > refRange.pulse.max) {
            pulseDiff = pulseRate - refRange.pulse.max;
        }

        if (respirationRate < refRange.respiration.min) {
            respDiff = refRange.respiration.min - respirationRate;
        } else if (respirationRate > refRange.respiration.max) {
            respDiff = respirationRate - refRange.respiration.max;
        }

        // Deduct from 100 base score
        let score = 100;
        
        // Temperature penalty: -8 per degree of deviation (capped at 30)
        score -= Math.min(30, tempDiff * 8);
        
        // Pulse penalty: -0.5 per unit of deviation (capped at 25)
        score -= Math.min(25, pulseDiff * 0.5);

        // Respiration penalty: -1 per unit of deviation (capped at 20)
        score -= Math.min(20, respDiff * 1);

        // Symptoms penalty: -8 per symptom (capped at 40)
        const symptomCount = Array.isArray(symptoms) ? symptoms.length : 0;
        score -= Math.min(40, symptomCount * 8);

        // Activity level penalty
        if (activityLevel === 'Low') {
            score -= 12;
        } else if (activityLevel === 'Hyperactive' && lowerType !== 'dog') {
            score -= 5;
        }

        // Capped healthIndex boundaries
        const healthIndex = Math.max(12, Math.min(100, Math.round(score)));

        // Determine Risk Category
        let riskCategory = "Healthy";
        if (healthIndex >= 90) {
            riskCategory = "Healthy";
        } else if (healthIndex >= 75) {
            riskCategory = "Low Risk";
        } else if (healthIndex >= 50) {
            riskCategory = "Medium Risk";
        } else {
            riskCategory = "High Risk";
        }

        // 3. Condition Mapping (Veterinary Decision Tree rules)
        let predictedCondition = "Healthy / Optimal Vitals";
        let precautions = [
            "Maintain regular vaccination schedules.",
            "Ensure the pet has access to cool, fresh drinking water.",
            "Conduct routine veterinary check-ups annually."
        ];

        const symptomList = symptoms.map(s => s.toLowerCase());

        if (lowerType === 'cow' || lowerType === 'buffalo') {
            if (temperature > 103.8 && symptomList.some(s => s.includes('udder') || s.includes('milk') || s.includes('mastitis'))) {
                predictedCondition = "Bovine Mastitis";
                precautions = [
                    "Isolate the cow immediately from the milking herd.",
                    "Apply clean cold compresses to the swollen udder quadrant to relieve inflammation.",
                    "Avoid manual milking of the infected quarter; practice strict hygienic stripping.",
                    "Consult a veterinarian immediately for targeted intramammary antibiotic infusion.",
                    "Ensure dry, clean, sand/straw bedding to prevent bacterial reinfection."
                ];
            } else if (temperature > 104.2 && symptomList.some(s => s.includes('drool') || s.includes('blister') || s.includes('saliva') || s.includes('hoof') || s.includes('lame'))) {
                predictedCondition = "Foot and Mouth Disease (FMD)";
                precautions = [
                    "Strict quarantine of infected animals; notify local authorities.",
                    "Wash lesions in the mouth and hooves with 1% potassium permanganate or mild antiseptic solution.",
                    "Provide highly digestible, soft, cool gruel or wet fodder.",
                    "Restrict herd movement completely to halt transmission.",
                    "Arrange veterinary vaccination for all healthy contacts."
                ];
            } else if (temperature > 103.0 && respirationRate > 32 && symptomList.some(s => s.includes('cough') || s.includes('breath') || s.includes('nose') || s.includes('nasal'))) {
                predictedCondition = "Bovine Pneumonia / Respiratory Disease";
                precautions = [
                    "Keep the animal in a warm, dry, draft-free, well-ventilated quarantine shelter.",
                    "Supply warm fresh fluids and highly appetizing feed.",
                    "Isolate to prevent aerosolized transmission to healthy calves/cattle.",
                    "Consult a vet for broad-spectrum injectible antibiotics."
                ];
            } else if (healthIndex < 85) {
                predictedCondition = "General Bovine Physiological Infection / Fever";
                precautions = [
                    "Isolate the cow in a comfortable shade.",
                    "Monitor rectal temperature twice daily.",
                    "Provide fresh clean water mixed with electrolytes.",
                    "Contact a veterinarian if symptoms persist past 24 hours."
                ];
            }
        } else if (lowerType === 'dog') {
            if ((temperature > 103.5 || temperature < 99.5) && symptomList.some(s => s.includes('vomit') || s.includes('blood') || s.includes('diarrhea') || s.includes('parvo'))) {
                predictedCondition = "Canine Parvovirus (CPV)";
                precautions = [
                    "Immediate veterinary hospitalization is critical; this is a highly fatal emergency.",
                    "Administer aggressive IV or subcutaneous electrolyte fluids to counter heavy dehydration.",
                    "Enforce strict isolation; Parvo is highly contagious through fecal-oral transmission.",
                    "Disinfect all contact areas, bowls, and cages with a 1:30 chlorine bleach solution."
                ];
            } else if (temperature > 103.0 && symptomList.some(s => s.includes('cough') || s.includes('sneez') || s.includes('discharge') || s.includes('eye') || s.includes('nose') || s.includes('flu'))) {
                predictedCondition = "Canine Distemper / Influenza (Dog Flu)";
                precautions = [
                    "Quarantine the dog in a warm, well-ventilated room.",
                    "Use warm sterile saline wipes to gently clean crusty eye and nasal discharges.",
                    "Provide appetizing high-odor wet canned food to encourage eating.",
                    "Consult your vet for support care and antibiotic coverage to prevent secondary pneumonia."
                ];
            } else if (temperature > 104.5 && symptomList.some(s => s.includes('pant') || s.includes('drool') || s.includes('red') || s.includes('collaps') || s.includes('heat'))) {
                predictedCondition = "Canine Heat Stroke / Hyperthermia";
                precautions = [
                    "Immediately transport the dog to a cool, shaded, or air-conditioned area.",
                    "Wrap the body and paw pads in cool, wet towels (never use ice water, which constricts vessels).",
                    "Offer small sips of cool water; do not force-feed.",
                    "Direct a household fan to blow air over the wet towels to trigger evaporative cooling.",
                    "Rush to an emergency veterinary clinic immediately."
                ];
            } else if (healthIndex < 88) {
                predictedCondition = "Mild Canine Inflammatory Response / Illness";
                precautions = [
                    "Encourage the dog to rest in a quiet, cozy corner.",
                    "Monitor food and water intake carefully.",
                    "Avoid strenuous activities or walks until vitals normalize.",
                    "If vomiting or diarrhea develops, withhold food for 12 hours and call a vet."
                ];
            }
        } else if (lowerType === 'cat') {
            if (temperature > 103.8 && symptomList.some(s => s.includes('vomit') || s.includes('diarrhea') || s.includes('letharg') || s.includes('panleukopenia'))) {
                predictedCondition = "Feline Panleukopenia (Feline Parvo)";
                precautions = [
                    "Seek inpatient veterinary hospitalization instantly; support care is vital.",
                    "Perform aggressive subcutaneous fluid therapy under veterinary supervision.",
                    "Quarantine from all other cats; virus persists in the environment for months.",
                    "Ensure the cat is kept extremely warm and draft-free."
                ];
            } else if (temperature > 102.8 && symptomList.some(s => s.includes('sneez') || s.includes('snout') || s.includes('nose') || s.includes('discharge') || s.includes('conjunctivitis') || s.includes('watery'))) {
                predictedCondition = "Feline Upper Respiratory Infection (Cat Flu)";
                precautions = [
                    "Quarantine the feline in a warm room away from other cats.",
                    "Provide steam therapy (place the cat in a hot, steamy bathroom for 10-15 minutes) to clear sinuses.",
                    "Offer warm, highly fragrant wet food (tuna or wet cat food) to stimulate feeding.",
                    "Keep nose and eyes clear of discharge with damp, warm cotton pads."
                ];
            } else if (symptomList.some(s => s.includes('strain') || s.includes('peeing') || s.includes('urine') || s.includes('litter') || s.includes('howl') || s.includes('genital') || s.includes('blood'))) {
                predictedCondition = "Feline Lower Urinary Tract Disease (FLUTD)";
                precautions = [
                    "Consult a veterinarian immediately; a complete urinary blockage is fatal within 24-48 hours.",
                    "Ensure multiple clean, quiet bowls of fresh water are scattered around the house.",
                    "Transition completely to high-moisture canned wet food.",
                    "Provide a clean, private, and stress-free litter box environment."
                ];
            } else if (healthIndex < 88) {
                predictedCondition = "Mild Feline Stress Response / Illness";
                precautions = [
                    "Provide a quiet, safe room for the cat to rest undisturbed.",
                    "Ensure clean fresh water is within immediate reach.",
                    "Keep thermal bedding available to maintain core temperature.",
                    "Monitor litter box output closely for normal urination and defecation."
                ];
            }
        } else if (lowerType === 'sheep' || lowerType === 'goat') {
            if (temperature > 104.0 && symptomList.some(s => s.includes('sore') || s.includes('mouth') || s.includes('plague') || s.includes('ppr') || s.includes('discharge'))) {
                predictedCondition = "PPR / Goat Plague (Peste des Petits Ruminants)";
                precautions = [
                    "Quarantine all sick sheep/goats immediately to restrict outbreaks.",
                    "Clean oral ulcers gently with 5% sodium bicarbonate solution or mild antiseptic.",
                    "Offer soft, wet, green fodder instead of dry grains.",
                    "Immediately notify local government veterinary agencies for ring vaccination."
                ];
            } else if (temperature > 104.0 && respirationRate > 25 && symptomList.some(s => s.includes('breath') || s.includes('cough') || s.includes('ccpp') || s.includes('chest'))) {
                predictedCondition = "CCPP (Contagious Caprine Pleuropneumonia)";
                precautions = [
                    "Isolate infected goats in dry, ventilated, well-sheltered stalls.",
                    "Keep animals warm and draft-free.",
                    "Early veterinary administration of tetracyclines or tylosin shows high survival rates.",
                    "Avoid high stocking densities and overcrowding."
                ];
            } else if (healthIndex < 85) {
                predictedCondition = "Mild Caprine Respiratory Stress / Systemic Malaise";
                precautions = [
                    "Shelter the animal from direct rain, cold winds, or high heat.",
                    "Supply mineral licks and clean hydration.",
                    "Isolate from healthy animals to observe development.",
                    "Consult local mobile veterinary support."
                ];
            }
        } else {
            // General animal type fallback
            if (healthIndex < 88) {
                predictedCondition = "Unclassified Physiological Illness / Inflammation";
                precautions = [
                    "Provide a quiet, clean, comfortable resting area.",
                    "Keep the animal hydrated; provide water with electrolyte additives.",
                    "Avoid force feeding; offer simple, palatable food options.",
                    "Schedule a diagnostic consultation with a vet if vitals do not stabilize."
                ];
            }
        }

        // 4. Premium AI-Orchestrated Insights (NVIDIA NIM with Gemini Fallback)
        let aiAnalysis = "";
        const apiKeyAvailable = process.env.NVIDIA_NIM_API_KEY || process.env.GEMINI_API_KEY;

        if (apiKeyAvailable) {
            try {
                console.log("[ML Controller] Dispatching vitals and symptoms to AI Agent Orchestrator for Premium VIP Precaution Plan...");
                
                const systemPrompt = `You are a world-class veterinary consultant and clinical AI diagnostic analyst for PawVaidya.
Your role is to analyze a pet's raw clinical vitals and symptoms alongside our ML classifier's raw predictions and formulate a highly professional, caring, and clinical-grade diagnostic explanation.
Always address the pet parent with empathy and scientific clarity. 

Provide a structured analysis in markdown containing:
1. **Clinical Vitals Assessment**: Explain what the vitals (Temperature, Pulse Rate, Respiration Rate) tell us compared to healthy thresholds for a ${animalType}.
2. **Clinical Insight on Condition**: Provide depth on the predicted condition (${predictedCondition}) – explain why the combination of vitals and symptoms (${symptoms.join(', ') || 'None'}) points to it.
3. **Comprehensive Care & Nutrition Protocol**: Detailed action items for care, quarantine (if contagious), and dietary recommendations.
4. **Red Flags & Warning Signs**: List exactly when they must rush the animal to the ER clinic immediately.
5. **Closing Reassurance**: A warm closing.

Keep the tone encouraging, expert-level, and professional. Always clarify that while you are a highly advanced AI system, an in-person veterinary physical exam is the gold standard. Use markdown formatting beautifully.`;

                const userMessage = `My pet ${petName} is a ${animalType} (Age: ${age || 'N/A'}).
The reported vitals are:
- Body Temperature: ${temperature} °F
- Pulse / Heart Rate: ${pulseRate} bpm
- Respiration / Breathing Rate: ${respirationRate} bpm
- Activity Level: ${activityLevel}
- Observed Symptoms: ${symptoms.join(', ') || 'None'}

Our Machine Learning Vitals Classifier has calculated:
- Health Index Score: ${healthIndex}%
- General Risk Category: ${riskCategory}
- Most Probable Medical Condition: ${predictedCondition}

Please write a custom, luxury clinical-grade medical advice report and action steps for me.`;

                // Call our resilient agent orchestrator
                aiAnalysis = await runAgentLoop({
                    systemPrompt,
                    userMessage,
                    maxIterations: 1, // No tools needed for this analytical summary
                    temperature: 0.3
                });

                console.log("[ML Controller] Premium AI analysis generated successfully.");
            } catch (aiErr) {
                console.error("[ML Controller] AI analysis failed, falling back to local static template:", aiErr.message);
                aiAnalysis = `Our veterinary system has performed a clinical analysis of ${petName}'s vitals. The combination of temperature (${temperature} °F) and respiration (${respirationRate} bpm) shows active physiological stress, indicating a potential risk of **${predictedCondition}**. Please review the detailed precautions in the checklist below and contact a PawVaidya specialist if symptoms worsen.`;
            }
        } else {
            // Local fallback template
            aiAnalysis = `Our veterinary system has performed a clinical analysis of ${petName}'s vitals. The combination of temperature (${temperature} °F) and respiration (${respirationRate} bpm) shows active physiological stress, indicating a potential risk of **${predictedCondition}**. Please review the detailed precautions in the checklist below and contact a PawVaidya specialist if symptoms worsen.`;
        }

        // 5. Save Record to Database
        const newPrediction = new mlPredictionModel({
            userId,
            petId: petId || null,
            petName,
            animalType,
            age: age || "1",
            vitals: {
                temperature,
                pulseRate,
                respirationRate
            },
            symptoms,
            activityLevel,
            healthIndex,
            riskCategory,
            predictedCondition,
            precautions,
            aiAnalysis
        });

        await newPrediction.save();

        // 6. Reward PawPoints (Loyalty Engine gamification)
        user.pawpoints = (user.pawpoints || 0) + 5;
        await user.save();

        res.json({
            success: true,
            message: "Animal Health Prediction executed successfully!",
            prediction: newPrediction,
            earnedPawPoints: 5,
            newPawPointsTotal: user.pawpoints
        });

    } catch (error) {
        console.error("Error inside predictHealth:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get all prediction history for the logged in user
 */
export const getPredictionHistory = async (req, res) => {
    try {
        const { userId } = req.body; // Injected by authuser middleware

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({
                success: false,
                message: "User not found."
            });
        }

        const isPlatinum = user.subscription?.plan === 'Platinum' && user.subscription?.status === 'Active';
        if (!isPlatinum) {
            return res.json({
                success: false,
                isPremiumRestricted: true,
                message: "Prediction history is exclusively available to Platinum subscribers."
            });
        }

        const history = await mlPredictionModel.find({ userId })
            .sort({ createdAt: -1 })
            .populate('petId');

        res.json({
            success: true,
            history
        });
    } catch (error) {
        console.error("Error inside getPredictionHistory:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get single prediction details by ID
 */
export const getPredictionDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body; // Injected by authuser

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({
                success: false,
                message: "User not found."
            });
        }

        const isPlatinum = user.subscription?.plan === 'Platinum' && user.subscription?.status === 'Active';
        if (!isPlatinum) {
            return res.json({
                success: false,
                isPremiumRestricted: true,
                message: "Prediction detail is exclusively available to Platinum subscribers."
            });
        }

        const prediction = await mlPredictionModel.findById(id).populate('petId');
        if (!prediction) {
            return res.json({
                success: false,
                message: "Prediction log not found."
            });
        }

        // Secure checking: must be the owner of the prediction log
        if (prediction.userId.toString() !== userId) {
            return res.json({
                success: false,
                message: "Unauthorized access to this prediction log."
            });
        }

        res.json({
            success: true,
            prediction
        });
    } catch (error) {
        console.error("Error inside getPredictionDetail:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
};
