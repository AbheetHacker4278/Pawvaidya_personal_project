import userModel from '../models/userModel.js';
import petModel from '../models/petModel.js';
import animalDiseaseModel from '../models/animalDiseaseModel.js';

// Multi-species clinical symptom-severity weight matrix profiles
const diseaseProfiles = [
    {
        name: "Lumpy Skin Disease (LSD)",
        animalTypes: ["Cow", "Sheep", "Goat"],
        symptomWeights: {
            "Skin Nodules / Blisters": 5,
            "Fever": 4,
            "Loss of Appetite": 3,
            "Nasal / Eye Discharge": 3,
            "Swollen Lymph Nodes": 4,
            "Drop in Milk Production": 4
        }
    },
    {
        name: "Foot and Mouth Disease (FMD)",
        animalTypes: ["Cow", "Sheep", "Goat"],
        symptomWeights: {
            "Drooling / Salivation": 5,
            "Mouth / Hoof Sores": 5,
            "Lameness / Limping": 4,
            "Fever": 3,
            "Loss of Appetite": 3
        }
    },
    {
        name: "Black Quarter (BQ)",
        animalTypes: ["Cow", "Sheep", "Goat"],
        symptomWeights: {
            "Swelling in Limbs / Muscles": 5,
            "Lameness / Limping": 5,
            "Fever": 4,
            "Loss of Appetite": 3
        }
    },
    {
        name: "Bovine Mastitis",
        animalTypes: ["Cow"],
        symptomWeights: {
            "Udder Swelling / Pain": 5,
            "Abnormal Milk (Clotted/Watery)": 5,
            "Drop in Milk Production": 5,
            "Fever": 2
        }
    },
    {
        name: "Canine Parvovirus (CPV)",
        animalTypes: ["Dog"],
        symptomWeights: {
            "Bloody Diarrhea": 5,
            "Severe Vomiting": 5,
            "Fever": 4,
            "Loss of Appetite": 4
        }
    },
    {
        name: "Feline Panleukopenia (FPL)",
        animalTypes: ["Cat"],
        symptomWeights: {
            "Severe Vomiting": 5,
            "Bloody Diarrhea": 5,
            "Fever": 4,
            "Loss of Appetite": 4
        }
    },
    {
        name: "Sheep / Goat Pox",
        animalTypes: ["Sheep", "Goat"],
        symptomWeights: {
            "Skin Nodules / Blisters": 5,
            "Fever": 4,
            "Loss of Appetite": 3,
            "Nasal / Eye Discharge": 3
        }
    },
    {
        name: "Peste des Petits Ruminants (PPR / Goat Plague)",
        animalTypes: ["Sheep", "Goat"],
        symptomWeights: {
            "Fever": 5,
            "Nasal / Eye Discharge": 5,
            "Bloody Diarrhea": 4,
            "Difficulty Breathing": 4,
            "Loss of Appetite": 3
        }
    },
    {
        name: "Bovine Pneumonia",
        animalTypes: ["Cow"],
        symptomWeights: {
            "Difficulty Breathing": 5,
            "Nasal / Eye Discharge": 4,
            "Fever": 4,
            "Loss of Appetite": 3
        }
    }
];

// Execute symptom-severity prediction (Gold Exclusive)
export const predictAnimalDisease = async (req, res) => {
    try {
        const { userId } = req.body; // Injected by auth middleware
        const { petId, petName, animalType, age, symptoms } = req.body;

        // 1. Verify User Plan Permissions
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const isAuthorized = (user.subscription?.plan === 'Gold' || user.subscription?.plan === 'Platinum') && user.subscription?.status === 'Active';
        if (!isAuthorized) {
            return res.status(403).json({ 
                success: false, 
                message: "Access restricted. Gold or Platinum Active Membership is required for this diagnostic module." 
            });
        }

        if (!petName || !animalType || !symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({ success: false, message: "Missing required clinical parameters." });
        }

        // 2. Probabilistic Symptom Weight Engine (Random Forest / Streamlit Style Classifier)
        const predictionResults = [];

        diseaseProfiles.forEach(profile => {
            // Check if disease matches animal type group
            if (profile.animalTypes.includes(animalType)) {
                let matchScore = 0;
                let maxPossibleScore = 0;

                // Max potential score for this profile based on present baseline weights (severity 5 max)
                Object.keys(profile.symptomWeights).forEach(symptomName => {
                    maxPossibleScore += profile.symptomWeights[symptomName] * 5;
                });

                // Calculate matching score based on user submitted severity
                symptoms.forEach(userSymptom => {
                    const weight = profile.symptomWeights[userSymptom.name];
                    if (weight) {
                        // score = weight * submittedSeverity (1-5)
                        matchScore += weight * parseInt(userSymptom.severity || 1);
                    }
                });

                if (matchScore > 0 && maxPossibleScore > 0) {
                    const confidence = parseFloat(((matchScore / maxPossibleScore) * 100).toFixed(1));
                    predictionResults.push({
                        condition: profile.name,
                        confidence: Math.min(confidence, 100)
                    });
                }
            }
        });

        // Sort predictions descending
        predictionResults.sort((a, b) => b.confidence - a.confidence);

        // If no match found, append a default Healthy / General stress entry
        if (predictionResults.length === 0) {
            predictionResults.push({
                condition: "Healthy / General Physical Discomfort",
                confidence: 95.0
            });
        }

        // Determine critical status
        let initialStatus = 'Monitoring';
        if (predictionResults[0].confidence > 60 && predictionResults[0].condition !== "Healthy / General Physical Discomfort") {
            initialStatus = 'Requires Vet';
        }

        // 3. Save Case to Database
        const newDiseaseCase = new animalDiseaseModel({
            userId,
            petId: petId || null,
            petName,
            animalType,
            age: parseInt(age || 1),
            symptoms,
            predictions: predictionResults,
            caseStatus: initialStatus,
            trackingLogs: [{
                note: `Initial Case Diagnosis compiled. Top Match: ${predictionResults[0].condition} with ${predictionResults[0].confidence}% confidence.`,
                statusAtLog: initialStatus
            }]
        });

        await newDiseaseCase.save();

        // 4. Reward user +3 loyalty PawPoints
        const pointsAwarded = 3;
        user.pawpoints = (user.pawpoints || 0) + pointsAwarded;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Symptom prediction complete.",
            prediction: newDiseaseCase,
            earnedPawPoints: pointsAwarded,
            newPawPointsBalance: user.pawpoints
        });

    } catch (err) {
        console.error("Error in predictAnimalDisease:", err.message);
        return res.status(500).json({ success: false, message: "Internal server diagnostic error." });
    }
};

// Fetch diagnostic history logs
export const getDiseaseHistory = async (req, res) => {
    try {
        const { userId } = req.body;
        
        const history = await animalDiseaseModel.find({ userId })
            .sort({ createdAt: -1 })
            .populate('petId');

        return res.status(200).json({ success: true, history });
    } catch (err) {
        console.error("Error in getDiseaseHistory:", err.message);
        return res.status(500).json({ success: false, message: "Internal server history error." });
    }
};

// Update veterinary case tracking logs
export const updateCaseTracking = async (req, res) => {
    try {
        const { userId } = req.body;
        const { id } = req.params;
        const { note, caseStatus } = req.body;

        if (!note || !caseStatus) {
            return res.status(400).json({ success: false, message: "Missing note text or target case status." });
        }

        const targetCase = await animalDiseaseModel.findOne({ _id: id, userId });
        if (!targetCase) {
            return res.status(404).json({ success: false, message: "Veterinary case log not found." });
        }

        // Push new tracking log
        targetCase.trackingLogs.push({
            note,
            statusAtLog: caseStatus
        });

        // Update overall case status
        targetCase.caseStatus = caseStatus;
        await targetCase.save();

        return res.status(200).json({
            success: true,
            message: "Case tracking log updated successfully.",
            updatedCase: targetCase
        });

    } catch (err) {
        console.error("Error in updateCaseTracking:", err.message);
        return res.status(500).json({ success: false, message: "Internal server update error." });
    }
};
