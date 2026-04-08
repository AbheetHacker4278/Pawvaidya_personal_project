import axios from "axios";
import 'dotenv/config';

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

async function testAdminBot() {
    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    if (!apiKey) {
        console.error("❌ NVIDIA_NIM_API_KEY is missing from .env");
        return;
    }

    console.log("Testing Admin Bot with tools (Gemma 3)...");

    const tools = [
        {
            type: "function",
            function: {
                name: "getSystemStats",
                description: "Returns overall system statistics.",
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            }
        }
    ];

    const payload = {
        model: "google/gemma-3-27b-it",
        messages: [{ role: "user", content: "Tell me a joke about pets." }],
        max_tokens: 512,
        temperature: 0.2,
        top_p: 0.7
    };

    const headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
    };

    try {
        const response = await axios.post(NVIDIA_API_URL, payload, { headers });
        console.log("✅ Success!");
        console.log("Response:", JSON.stringify(response.data.choices[0], null, 2));
    } catch (error) {
        console.error("❌ Failed!");
        console.error("Status:", error.response?.status);
        console.error("Error Data:", JSON.stringify(error.response?.data, null, 2));
    }
}

testAdminBot();
