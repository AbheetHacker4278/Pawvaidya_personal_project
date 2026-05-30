import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

async function testGeminiModels() {
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GOOGLE_CLOUD_API_KEY or GEMINI_API_KEY is missing from environment.");
        return;
    }

    const ai = new GoogleGenAI({ apiKey });

    // List of model IDs to test
    const modelsToTest = [
        "gemini-3.5-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ];

    console.log("\nTesting individual generateContent calls using @google/genai...");
    for (const modelId of modelsToTest) {
        try {
            console.log(`Testing model: ${modelId}...`);
            const response = await ai.models.generateContent({
                model: modelId,
                contents: "Hello! What is your name and model version?"
            });
            console.log(`✅ Success for ${modelId}:`, response.text.trim().substring(0, 80) + "...");
            return modelId; // Found working model!
        } catch (err) {
            console.log(`❌ Failed for ${modelId}:`, err.message);
        }
    }
}

testGeminiModels();
