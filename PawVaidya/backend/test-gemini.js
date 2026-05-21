import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

async function testGeminiModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is missing from environment.");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // List of model IDs to test
    const modelsToTest = [
        "gemini-3.5-flash",
        "gemini-3.5-flash-latest",
        "gemini-3.0-flash",
        "gemini-3.5-flash",
        "gemini-3.0-flash-exp",
        "gemini-3.5-pro",
        "gemini-3.0-pro"
    ];

    console.log("Listing available models if possible...");
    try {
        // Try calling the model list endpoint if supported by client
        const list = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).listModels();
        console.log("Available models:");
        for (const m of list.models) {
            console.log(`- ${m.name}: ${m.displayName}`);
        }
    } catch (e) {
        console.warn("⚠️ Could not list models using client SDK:", e.message);
    }

    console.log("\nTesting individual generateContent calls...");
    for (const modelId of modelsToTest) {
        try {
            console.log(`Testing model: ${modelId}...`);
            const model = genAI.getGenerativeModel({ model: modelId });
            const response = await model.generateContent("Hello! What is your name and model version?");
            console.log(`✅ Success for ${modelId}:`, response.response.text().trim().substring(0, 80) + "...");
            return modelId; // Found working model!
        } catch (err) {
            console.log(`❌ Failed for ${modelId}:`, err.message);
        }
    }
}

testGeminiModels();
