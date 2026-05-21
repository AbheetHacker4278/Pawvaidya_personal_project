import mongoose from "mongoose";

const mlPredictionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'pet', default: null },
    petName: { type: String, required: true },
    animalType: { type: String, required: true },
    age: { type: String, default: "1" },
    vitals: {
        temperature: { type: Number, required: true },
        pulseRate: { type: Number, required: true },
        respirationRate: { type: Number, required: true }
    },
    symptoms: { type: [String], default: [] },
    activityLevel: { type: String, default: "Normal" },
    healthIndex: { type: Number, required: true }, // 0 to 100%
    riskCategory: { type: String, required: true }, // "Healthy", "Low Risk", "Medium Risk", "High Risk"
    predictedCondition: { type: String, required: true }, // E.g., "Mastitis", "Canine Parvovirus", "Healthy"
    precautions: { type: [String], default: [] },
    aiAnalysis: { type: String, default: "" }
}, { timestamps: true });

const mlPredictionModel = mongoose.models.mlPrediction || mongoose.model("mlPrediction", mlPredictionSchema);

export default mlPredictionModel;
