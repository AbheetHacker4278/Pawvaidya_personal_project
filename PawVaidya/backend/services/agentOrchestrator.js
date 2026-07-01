import LLM from "./llm.js";

/**
 * Calls NVIDIA's DeepSeek-v4-pro completion engine using llm.js.
 */
async function callDeepSeek(messages) {
    console.log("[NVIDIA NIM] Dispatching query to DeepSeek-v4-pro via llm.js...");
    return await LLM(messages, {
        service: "openai",
        model: "deepseek-ai/deepseek-v4-pro",
        temperature: 1,
        max_tokens: 16384,
    });
}

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
    // Dynamic fallback sequence to prevent version-specific API model 404s
    const modelsToTry = [
        "gemini-3.5-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
    ];

    let lastError = null;

    for (const modelId of modelsToTry) {
        try {
            console.log(`[Google Cloud GenAI] Attempting generation with model: ${modelId} via llm.js...`);
            return await LLM(messages, {
                service: "google",
                model: modelId,
                systemPrompt: systemPrompt,
                temperature: 0.2,
            });
        } catch (err) {
            console.warn(`[Google Cloud GenAI] Model ${modelId} failed:`, err.message);
            lastError = err;
            if (err.message.includes("404") || err.message.includes("not found") || err.message.includes("not supported") || err.message.includes("model")) {
                continue;
            } else {
                throw err;
            }
        }
    }

    throw lastError || new Error("All Google Cloud GenAI model fallback options failed.");
}

/**
 * Helper to extract multiple JSON objects matching the tool structure.
 * Counts brace balance to support nested structures.
 */
function extractJsonObjects(str) {
    const objects = [];
    let braceCount = 0;
    let startIdx = -1;
    
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '{') {
            if (braceCount === 0) {
                startIdx = i;
            }
            braceCount++;
        } else if (str[i] === '}') {
            if (braceCount > 0) {
                braceCount--;
                if (braceCount === 0 && startIdx !== -1) {
                    const candidate = str.substring(startIdx, i + 1);
                    try {
                        const parsed = JSON.parse(candidate);
                        if (parsed && typeof parsed === 'object' && parsed.tool) {
                            objects.push(parsed);
                        }
                    } catch (e) {
                        // Ignore invalid JSON structures
                    }
                }
            }
        }
    }
    return objects;
}

/**
 * Shared AI Agent Orchestrator
 * Runs a prompt-based agentic loop against Google Cloud GenAI (Gemini).
 * Parses JSON tool calls from the response, executes them locally,
 * and feeds the results back to the agent in a loop.
 * 
 * Falls back to offline heuristic response engine if all cloud models fail.
 */
export const runAgentLoop = async ({
    systemPrompt,
    toolImpls = {},
    userMessage,
    history = [],
    maxIterations = 5,
    maxTokens = 1024,
    temperature = 0.2,
}) => {
    // Build initial messages array
    let messages = [{ role: "system", content: systemPrompt }];

    // Normalize history to {role, content} format (skip initial assistant greetings)
    let normalizedHistory = (history || []).map(m => ({
        role: m.role === "bot" || m.role === "model" || m.role === "assistant" ? "assistant" : "user",
        content: m.content || m.text || (m.parts?.[0]?.text) || "",
    })).filter(m => m.content);

    // Remove leading assistant message (Gemini format helper)
    if (normalizedHistory.length > 0 && normalizedHistory[0].role === "assistant") {
        normalizedHistory.shift();
    }

    messages.push(...normalizedHistory);
    messages.push({ role: "user", content: userMessage });

    let aiResponse = "";
    let iterations = 0;

    while (iterations <= maxIterations) {
        let callSuccess = false;

        try {
            console.log(`[Orchestrator] Dispatching to NVIDIA DeepSeek API (Iteration ${iterations})...`);
            aiResponse = await callDeepSeek(messages);
            console.log("[Orchestrator] NVIDIA DeepSeek API responded successfully.");
            callSuccess = true;
        } catch (dsError) {
            console.warn(`[Orchestrator] NVIDIA DeepSeek API failed (Iteration ${iterations}):`, dsError.message);
            try {
                console.log(`[Orchestrator] Falling back to Google Cloud GenAI (Iteration ${iterations})...`);
                aiResponse = await callGemini(messages, systemPrompt);
                console.log("[Orchestrator] Google Cloud GenAI responded successfully.");
                callSuccess = true;
            } catch (error) {
                console.error(`[Orchestrator] Google Cloud GenAI failed (Iteration ${iterations}):`, error.message);
                
                // Final Heuristic Offline Response Fallback Layer
                console.log("[Orchestrator] Engaging final Heuristic Offline Response Fallback...");
                aiResponse = getLocalHeuristicResponse(userMessage, systemPrompt);
                callSuccess = true;
            }
        }

        // Try to extract JSON tool calls from the response using brace-balancing
        const toolCalls = extractJsonObjects(aiResponse);

        // Break if no tool calls were extracted, or max iterations reached
        if (toolCalls.length === 0 || iterations >= maxIterations) break;

        // Execute all extracted tool calls in parallel
        const toolResults = await Promise.all(toolCalls.map(async (tc) => {
            const { tool, args } = tc;
            let result;
            
            if (!toolImpls[tool]) {
                console.warn(`[Agent] Tool '${tool}' requested but not available.`);
                result = {
                    error: `Tool '${tool}' is not available. This is because the user is currently not logged in (guest mode). Please inform the user that they must log in to access this feature.`
                };
            } else {
                console.log(`[Agent] Executing tool: ${tool}`, args);
                try {
                    result = await toolImpls[tool](args || {});
                } catch (toolError) {
                    console.error(`[Orchestrator] Error during tool execution for '${tool}':`, toolError);
                    result = { error: `Failed to execute tool '${tool}': ${toolError.message}` };
                }
                console.log(`[Agent] Tool execution complete for '${tool}'.`);
            }
            return { tool, result };
        }));

        // Feed the tool results back into the conversation
        messages.push({ role: "assistant", content: aiResponse });
        
        const resultsContent = toolResults.map(tr => 
            `Tool Result from ${tr.tool}: ${JSON.stringify(tr.result)}`
        ).join("\n");

        messages.push({
            role: "user",
            content: resultsContent,
        });

        iterations++;
    }

    // Safety Guardrail: If the final response is still a raw JSON tool call block, return a friendly message
    let finalResponse = aiResponse;
    try {
        const trimmed = aiResponse.trim();
        const candidateCalls = extractJsonObjects(trimmed);
        if (candidateCalls.length > 0 && trimmed.replace(/\{[\s\S]*?\}/g, "").trim() === "") {
            finalResponse = "To access this personalized feature, please make sure you are logged in to your PawVaidya account! Once you are logged in, I will be able to retrieve your pets, appointments, wallet balance, and more. 🐾";
        }
    } catch (e) {
        // Fallback to normal response
    }

    return finalResponse;
};
