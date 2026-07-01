import mongoose from "mongoose";

const nutritionPlanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'pet', default: null },
    petName: { type: String, required: true },
    animalType: { type: String, required: true },
    breed: { type: String, default: "Generic" },
    age: { type: Number, default: 1 },
    weight: { type: Number, default: 5 }, // in kg
    activityLevel: {
        type: String,
        enum: ['Low', 'Normal', 'Moderate', 'Active', 'Athletic'],
        default: 'Moderate'
    },
    medicalConditions: [{ type: String }],
    goals: { type: String, default: "" },
    caloricTarget: { type: Number, default: 0 }, // Daily target in kcal
    dietSchedule: {
        morning: { type: String, default: "" },
        afternoon: { type: String, default: "" },
        evening: { type: String, default: "" }
    },
    customRecipes: [{
        title: { type: String, default: "" },
        ingredients: [{ type: String }],
        instructions: { type: String, default: "" }
    }],
    portionCalculator: {
        dryFoodGrams: { type: Number, default: 0 },
        wetFoodGrams: { type: Number, default: 0 },
        waterRequirementMl: { type: Number, default: 0 }
    }
}, { timestamps: true });

const nutritionPlanModel = mongoose.models.nutritionPlan || mongoose.model("nutritionPlan", nutritionPlanSchema);

export default nutritionPlanModel;
