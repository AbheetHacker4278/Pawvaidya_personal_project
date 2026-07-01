import OpenAI from 'openai';
import { GoogleGenAI } from "@google/genai";

let OfficialLLM = null;
try {
    // Attempt to dynamically import the official library if installed
    const module = await import("@themaximalist/llm.js");
    OfficialLLM = module.default;
    console.log("[LLM.js] Successfully loaded @themaximalist/llm.js");
} catch (e) {
    console.warn("[LLM.js] @themaximalist/llm.js not installed or loaded. Using native fallback implementation.");
}

/**
 * Custom LLM implementation matching the API of @themaximalist/llm.js.
 * Acts as a direct drop-in replacement/fallback.
 */
class CustomLLM {
    constructor(options = {}) {
        this.options = options;
    }

    async chat(messages, options = {}) {
        const mergedOptions = { ...this.options, ...options };
        const service = mergedOptions.service || "openai";
        const model = mergedOptions.model || "deepseek-ai/deepseek-v4-pro";
        
        let systemPrompt = mergedOptions.systemPrompt || mergedOptions.system;
        
        // Normalize messages to {role, content}
        let formattedMessages = [];
        if (typeof messages === "string") {
            formattedMessages = [{ role: "user", content: messages }];
        } else if (Array.isArray(messages)) {
            formattedMessages = messages.map(m => ({
                role: m.role === "bot" || m.role === "model" || m.role === "assistant" ? "assistant" : m.role || "user",
                content: m.content || m.text || ""
            }));
        }

        if (systemPrompt && !formattedMessages.some(m => m.role === "system")) {
            formattedMessages.unshift({ role: "system", content: systemPrompt });
        }

        if (service === "openai") {
            const apiKey = mergedOptions.apiKey || process.env.OPENAI_API_KEY || process.env.NVIDIA_NIM_API_KEY;
            const baseURL = mergedOptions.baseUrl || mergedOptions.baseURL || 'https://integrate.api.nvidia.com/v1';
            
            const openai = new OpenAI({ apiKey, baseURL });
            const completion = await openai.chat.completions.create({
                model: model,
                messages: formattedMessages.filter(m => m.role !== "system" || m.content),
                temperature: mergedOptions.temperature !== undefined ? mergedOptions.temperature : 1,
                max_tokens: mergedOptions.max_tokens || mergedOptions.maxTokens || 16384,
                stream: false
            });
            return completion.choices[0]?.message?.content || "";
        } else if (service === "google") {
            const apiKey = mergedOptions.apiKey || process.env.GOOGLE_CLOUD_API_KEY || process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("GOOGLE_CLOUD_API_KEY or GEMINI_API_KEY is missing in environment variables.");
            
            const ai = new GoogleGenAI({ apiKey });
            const filtered = formattedMessages.filter(m => m.role !== "system");
            const contents = [];
            for (const m of filtered) {
                const role = m.role === "assistant" ? "model" : "user";
                if (contents.length > 0 && contents[contents.length - 1].role === role) {
                    contents[contents.length - 1].parts[0].text += "\n" + m.content;
                } else {
                    contents.push({ role, parts: [{ text: m.content }] });
                }
            }
            if (contents.length > 0 && contents[0].role === "model") {
                contents.shift();
            }
            if (contents.length === 0) {
                contents.push({ role: "user", parts: [{ text: "Hello" }] });
            }

            const response = await ai.models.generateContent({
                model: model || "gemini-3.5-flash",
                contents: contents,
                config: {
                    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
                    temperature: mergedOptions.temperature !== undefined ? mergedOptions.temperature : 0.2,
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' }
                    ]
                }
            });
            return response.text;
        } else {
            throw new Error(`Unsupported service in custom LLM fallback: ${service}`);
        }
    }
}

/**
 * Universal LLM function call supporting both function call and class instantiation.
 */
function LLM(promptOrMessages, options = {}) {
    if (OfficialLLM) {
        // If official library is loaded, delegate to it
        return OfficialLLM(promptOrMessages, options);
    }
    const instance = new CustomLLM(options);
    return instance.chat(promptOrMessages, options);
}

// Attach prototype so new LLM() works
Object.setPrototypeOf(LLM, CustomLLM.prototype);
LLM.prototype = CustomLLM.prototype;
LLM.constructor = CustomLLM;

export default LLM;
