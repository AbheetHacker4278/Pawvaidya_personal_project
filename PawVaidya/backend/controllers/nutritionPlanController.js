import userModel from '../models/userModel.js';
import nutritionPlanModel from '../models/nutritionPlanModel.js';
import { generateGeminiContent } from '../utils/geminiHelper.js';

// POST /api/nutrition-plan/generate
export const generateNutritionPlan = async (req, res) => {
    try {
        const { userId } = req.body; // Injected by authuser middleware
        const { petId, petName, animalType, breed, age, weight, activityLevel, medicalConditions, goals } = req.body;

        // 1. Verify subscription tier (Gold or Platinum active plan required)
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        const isAuthorized = (user.subscription?.plan === 'Gold' || user.subscription?.plan === 'Platinum') && user.subscription?.status === 'Active';
        if (!isAuthorized) {
            return res.json({ 
                success: false, 
                message: "Access restricted. Gold or Platinum Active Membership is required for the AI Diet & Nutrition Planner." 
            });
        }

        if (!petName || !animalType || !weight || !activityLevel) {
            return res.json({ success: false, message: "Missing required pet parameters (name, type, weight, activity level)." });
        }

        // 2. Formulate Prompt for Gemini
        const medicalConditionsText = (medicalConditions && Array.isArray(medicalConditions) && medicalConditions.length > 0)
            ? medicalConditions.join(", ")
            : "None";

        const prompt = `
Generate a professional, veterinary-grade pet diet and nutrition plan in JSON format.
The JSON MUST match this exact schema format:
{
  "caloricTarget": 450, // Daily target in kcal, calculated scientifically using MER formulas based on weight, species, and activity level
  "dietSchedule": {
    "morning": "Morning meal details, ingredients, and feeding guide",
    "afternoon": "Afternoon meal/snack details, ingredients, and feeding guide",
    "evening": "Evening meal details, ingredients, and feeding guide"
  },
  "customRecipes": [
    {
      "title": "Recipe Title (e.g. Sensitive Stomach Chicken Broth)",
      "ingredients": ["Ingredient 1 with weight/quantity", "Ingredient 2"],
      "instructions": "Step by step cooking and preparation instructions"
    }
  ],
  "portionCalculator": {
    "dryFoodGrams": 120, // Recommended daily dry food portion in grams
    "wetFoodGrams": 85,  // Recommended daily wet food portion in grams
    "waterRequirementMl": 400 // Daily water requirement in ml
  }
}

Pet Profile for Calculation:
- Name: ${petName}
- Species/Type: ${animalType}
- Breed: ${breed || "Unknown"}
- Age: ${age || 1} years
- Weight: ${weight} kg
- Activity Level: ${activityLevel} (Low, Moderate, Active, Athletic)
- Underlying Medical Conditions: ${medicalConditionsText}
- Nutrition Goals / Specific Target Results: ${goals || "None Specified"}

Respond ONLY with valid JSON. Do not include markdown code block formatting (like \`\`\`json) in your response. Ensure the recipes and caloric calculation are highly tailored to the species, medical conditions, and user's specific diet goals / target results provided (for example, low sodium/low protein details for kidney disease, lower calories for obesity, allergy-safe ingredients, weight loss/gain calorie levels, allergy-safe ingredients, muscle building proteins, etc.).
`;

        // 3. Query Gemini
        const resultText = await generateGeminiContent({ prompt, jsonMode: true });
        
        let cleanedJson = resultText;
        // Strip markdown backticks if returned despite instructions
        if (cleanedJson.startsWith("```")) {
            cleanedJson = cleanedJson.replace(/^```json\s*/, "").replace(/```$/, "").trim();
        }

        const planData = JSON.parse(cleanedJson);

        // 4. Save to Database
        const newPlan = new nutritionPlanModel({
            userId,
            petId: petId || null,
            petName,
            animalType,
            breed: breed || "Generic",
            age: Number(age || 1),
            weight: Number(weight),
            activityLevel,
            medicalConditions: medicalConditions || [],
            goals: goals || "",
            caloricTarget: planData.caloricTarget,
            dietSchedule: planData.dietSchedule,
            customRecipes: planData.customRecipes || [],
            portionCalculator: planData.portionCalculator
        });

        await newPlan.save();

        // 5. Award +2 Loyalty PawPoints
        user.pawpoints = (user.pawpoints || 0) + 2;
        await user.save();

        return res.json({
            success: true,
            message: "Nutrition plan successfully compiled.",
            plan: newPlan,
            earnedPawPoints: 2,
            newPawPointsBalance: user.pawpoints
        });

    } catch (error) {
        console.error("Error generating nutrition plan:", error);
        return res.json({ success: false, message: "Error compiling nutrition plan: " + error.message });
    }
};

// GET /api/nutrition-plan/history
export const getNutritionPlanHistory = async (req, res) => {
    try {
        const { userId } = req.body;
        const history = await nutritionPlanModel.find({ userId })
            .sort({ createdAt: -1 })
            .populate('petId');

        return res.json({ success: true, history });
    } catch (error) {
        console.error("Error fetching nutrition history:", error);
        return res.json({ success: false, message: error.message });
    }
};

// DELETE /api/nutrition-plan/:id
export const deleteNutritionPlan = async (req, res) => {
    try {
        const { userId } = req.body;
        const { id } = req.params;

        const deleted = await nutritionPlanModel.findOneAndDelete({ _id: id, userId });
        if (!deleted) {
            return res.json({ success: false, message: "Plan not found or unauthorized." });
        }

        return res.json({ success: true, message: "Nutrition plan deleted successfully." });
    } catch (error) {
        console.error("Error deleting nutrition plan:", error);
        return res.json({ success: false, message: error.message });
    }
};
