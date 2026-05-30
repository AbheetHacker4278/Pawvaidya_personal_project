import { GoogleGenAI } from "@google/genai";

const getGeminiClient = () => {
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GOOGLE_CLOUD_API_KEY or GEMINI_API_KEY in environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

/**
 * Generate content with fallbacks for models
 * @param {Object} options - API Options
 * @param {string} options.prompt - Prompt text
 * @param {Object} [options.image] - Optional image attachment: { inlineData: { data: string, mimeType: string } }
 * @param {boolean} [options.jsonMode] - Request JSON output structure
 */
export const generateGeminiContent = async ({ prompt, image = null, jsonMode = false }) => {
    const ai = getGeminiClient();
    
    // Ordered preference list
    const models = [
        "gemini-3.5-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ];

    let lastError = null;

    for (const model of models) {
        try {
            console.log(`[Gemini Helper] Attempting call with model: ${model}`);
            
            const contents = [];
            if (image) {
                contents.push(image); // Add visual part
            }
            contents.push(prompt); // Add text prompt

            const config = {};
            if (jsonMode) {
                config.responseMimeType = "application/json";
            }

            const response = await ai.models.generateContent({
                model: model,
                contents: contents,
                config: Object.keys(config).length > 0 ? config : undefined
            });

            if (response && response.text) {
                return response.text.trim();
            }
        } catch (err) {
            console.warn(`[Gemini Helper] Failed with model ${model}:`, err.message);
            lastError = err;
        }
    }

    throw new Error(`All Gemini models failed. Last error: ${lastError ? lastError.message : 'Unknown error'}`);
};
