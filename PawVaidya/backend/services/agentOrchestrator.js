import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

/**
 * Local Heuristic Fallback Engine
 * Provides immediate, smart offline responses if both remote NIM and Gemini fail or are unavailable.
 * Ensures the platform NEVER returns a 500 error or hangs.
 */
function getLocalHeuristicResponse(userMessage, systemPrompt) {
    const msg = (userMessage || "").toLowerCase().trim();
    const isDoctor = systemPrompt && systemPrompt.toLowerCase().includes("doctor");
    const isAdmin = systemPrompt && systemPrompt.toLowerCase().includes("admin");
    const botName = isDoctor ? "MedBot" : (isAdmin ? "AdminBot" : "PawBot");

    if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey") || msg.includes("hii") || msg.includes("greet")) {
        return `Hello there! 🐾 I am ${botName}, your AI veterinary companion. Both of my primary cloud engines (NVIDIA NIM & Gemini) are currently experiencing network latency, so I have switched to my lightweight offline backup brain!

How can I help you and your pet today? I can guide you on where to manage your account, bookings, or pets.`;
    }

    if (msg.includes("appointment") || msg.includes("schedule") || msg.includes("book") || msg.includes("slot")) {
        return `I understand you're interested in booking or viewing appointments! Since my cloud connection is currently offline, I can't look up slot availability or write to the database automatically right now.

No worries! You can do this directly and instantly on our platform:
* Go to the **Book Appointment** tab in the main navigation bar to select a vet and schedule a visit.
* Go to the **My Appointments** tab to see your upcoming schedule or cancel any bookings. 🗓️`;
    }

    if (msg.includes("pet") || msg.includes("dog") || msg.includes("cat") || msg.includes("puppy") || msg.includes("kitten")) {
        return `It sounds like you're talking about your furry companions! 🐶🐱 Since I am operating on my local backup brain, I can't query your pet's current medical records right now.

You can easily manage all of your registered pets, view their profiles, and register new ones by visiting the **My Profile** page from the top navigation menu!`;
    }

    if (msg.includes("doctor") || msg.includes("vet") || msg.includes("specialist") || msg.includes("dermatologist")) {
        return `I can guide you on finding the perfect vet! Since my cloud search is offline:
* You can view our entire verified roster of veterinary specialists by going to the **All Doctors** section on the homepage.
* You can filter them by specialty (e.g., General Physician, Dermatologist, Pediatrician) from the sidebar options! 🩺`;
    }

    if (msg.includes("point") || msg.includes("pawpoint") || msg.includes("reward") || msg.includes("coin")) {
        return `Looking to check your PawPoints? 🪙 
Your rewards are fully tracked in the database! While I can't fetch your exact balance while in offline backup mode, you can see your current points, earn rates, and claim rewards on the **My Profile** page of your account dashboard. Keep earning those rewards for your pet's health!`;
    }

    return `Woof! 🐾 I am ${botName}, your veterinary assistant. My cloud engines are currently experiencing a brief connection delay, but I'm running on my offline backup system to ensure you're never left hanging!

For booking appointments, viewing your pet records, checking rewards, or contacting human specialists, you can use the direct navigation tabs in the main menu above. I will be fully back online shortly!`;
}

/**
 * Calls Gemini as a robust, highly available fallback when NVIDIA NIM fails or times out.
 * Iterates through available model list to resolve model-specific version support 404 errors.
 */
async function callGemini(messages, systemPrompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing in environment variables.");

    const genAI = new GoogleGenerativeAI(apiKey);

    // Dynamic fallback sequence to prevent version-specific API model 404s
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-1.5-pro",
        "gemini-pro"
    ];

    let lastError = null;

    for (const modelId of modelsToTry) {
        try {
            console.log(`[Gemini Fallback] Attempting generation with model: ${modelId}...`);
            const model = genAI.getGenerativeModel({
                model: modelId,
                systemInstruction: systemPrompt,
            });

            // Format chat messages for Gemini:
            // Gemini expects alternating user and model roles.
            // Filter system messages and merge consecutive identical roles to comply with Gemini API.
            const filtered = messages.filter(m => m.role !== "system");
            const contents = [];

            for (const m of filtered) {
                const role = m.role === "assistant" ? "model" : "user";
                if (contents.length > 0 && contents[contents.length - 1].role === role) {
                    // Merge consecutive messages of the same role
                    contents[contents.length - 1].parts[0].text += "\n" + (m.content || "");
                } else {
                    contents.push({
                        role,
                        parts: [{ text: m.content || "..." }],
                    });
                }
            }

            // Gemini requires the first message to be from the 'user' role.
            if (contents.length > 0 && contents[0].role === "model") {
                contents.shift();
            }

            // Ensure there is at least one message
            if (contents.length === 0) {
                contents.push({ role: "user", parts: [{ text: "Hello" }] });
            }

            console.log(`[Orchestrator Fallback] Dispatching history to Gemini (${modelId})...`);
            const result = await model.generateContent({ contents });
            const response = await result.response;
            return response.text();
        } catch (err) {
            console.warn(`[Gemini Fallback] Model ${modelId} failed:`, err.message);
            lastError = err;
            // Move to next model if this one is not found or unsupported
            if (err.message.includes("404") || err.message.includes("not found") || err.message.includes("not supported")) {
                continue;
            } else {
                throw err; // Throw other critical errors directly (like auth/quota errors)
            }
        }
    }

    throw lastError || new Error("All Gemini model fallback options failed.");
}

/**
 * Shared AI Agent Orchestrator
 * Runs a prompt-based agentic loop against NVIDIA NIM (Gemma 3-27B).
 * Parses JSON tool calls from the response, executes them locally,
 * and feeds the results back to the agent in a loop.
 * 
 * Automatically falls back to Gemini 1.5 Flash if NVIDIA NIM times out (8s) or fails.
 * Falls back to offline heuristic response engine if all cloud models fail.
 */
export const runAgentLoop = async ({
    systemPrompt,
    toolImpls = {},
    userMessage,
    history = [],
    maxIterations = 5,
    model = "google/gemma-3-27b-it",
    maxTokens = 1024,
    temperature = 0.2,
}) => {
    const nvidiaKey = process.env.NVIDIA_NIM_API_KEY;
    
    // Build initial messages array
    let messages = [{ role: "system", content: systemPrompt }];

    // Normalize history to {role, content} format (skip initial assistant greetings)
    let normalizedHistory = (history || []).map(m => ({
        role: m.role === "bot" || m.role === "model" || m.role === "assistant" ? "assistant" : "user",
        content: m.content || m.text || (m.parts?.[0]?.text) || "",
    })).filter(m => m.content);

    // Remove leading assistant message (NVIDIA requires user first)
    if (normalizedHistory.length > 0 && normalizedHistory[0].role === "assistant") {
        normalizedHistory.shift();
    }

    messages.push(...normalizedHistory);
    messages.push({ role: "user", content: userMessage });

    const headers = {
        Authorization: `Bearer ${nvidiaKey}`,
        "Content-Type": "application/json",
    };

    const basePayload = { model, max_tokens: maxTokens, temperature, top_p: 0.7 };

    let aiResponse = "";
    let iterations = 0;

    while (iterations <= maxIterations) {
        // Attempt API call with NVIDIA NIM first, fall back to Gemini if it fails or times out (8 seconds)
        let callSuccess = false;

        if (nvidiaKey) {
            try {
                console.log(`[Orchestrator] Attempting NVIDIA NIM call (Iteration ${iterations})...`);
                const response = await axios.post(
                    NVIDIA_API_URL,
                    { ...basePayload, messages },
                    { headers, timeout: 8000 } // Robust 8-second timeout to prevent hangs
                );
                
                aiResponse = response.data.choices[0].message.content;
                callSuccess = true;
                console.log("[Orchestrator] NVIDIA NIM responded successfully.");
            } catch (error) {
                console.warn(`[Orchestrator] NVIDIA NIM error/timeout (Iteration ${iterations}): ${error.message}`);
            }
        } else {
            console.warn("[Orchestrator] NVIDIA NIM API key missing. Skipping to fallback...");
        }

        // Graceful Fallback Layer
        if (!callSuccess) {
            try {
                console.log(`[Orchestrator] Falling back to Gemini 1.5 Flash (Iteration ${iterations})...`);
                aiResponse = await callGemini(messages, systemPrompt);
                console.log("[Orchestrator] Gemini responded successfully.");
                callSuccess = true;
            } catch (fallbackError) {
                console.error("[Orchestrator] Critical: Gemini fallback also failed:", fallbackError.message);
                
                // Final Offline Resilience Fallback Layer - Heuristic Engine
                console.log("[Orchestrator] Engaging final Heuristic Offline Response Fallback...");
                aiResponse = getLocalHeuristicResponse(userMessage, systemPrompt);
                callSuccess = true;
            }
        }

        // Try to extract a JSON tool call from the response
        let toolCall = null;
        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*?"tool"[\s\S]*?\}/);
            if (jsonMatch) toolCall = JSON.parse(jsonMatch[0]);
        } catch {
            // No valid JSON in response
        }

        // Break if no tool call, or tool not found, or max iterations reached
        if (!toolCall || !toolImpls[toolCall.tool] || iterations >= maxIterations) break;

        const { tool, args } = toolCall;
        console.log(`[Agent] Executing tool: ${tool}`, args);

        // Safe tool execution wrapper
        let toolResult;
        try {
            toolResult = await toolImpls[tool](args || {});
        } catch (toolError) {
            console.error(`[Orchestrator] Error during tool execution for '${tool}':`, toolError);
            toolResult = { error: `Failed to execute tool '${tool}': ${toolError.message}` };
        }

        console.log(`[Agent] Tool execution complete for '${tool}'.`);

        // Feed the tool result back into the conversation
        messages.push({ role: "assistant", content: aiResponse });
        messages.push({
            role: "user",
            content: `Tool Result from ${tool}: ${JSON.stringify(toolResult)}`,
        });

        iterations++;
    }

    return aiResponse;
};
