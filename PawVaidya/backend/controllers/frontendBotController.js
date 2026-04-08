import axios from "axios";

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export const queryFrontendBot = async (req, res) => {
    try {
        const { message, history, systemPrompt } = req.body;
        const apiKey = process.env.NVIDIA_NIM_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ success: false, message: "NVIDIA NIM API Key is missing" });
        }

        // Standard OpenAI/NVIDIA APIs expect System -> User -> Assistant -> User...
        let messages = [{ role: "system", content: systemPrompt }];

        let chatHistory = (history || []).map(m => ({
            role: m.role === 'bot' ? 'assistant' : 'user',
            content: m.text
        }));

        // NVIDIA NIM requires alternating User/Assistant. 
        // We ensure the first message in history is User if it's not empty, or skip it if it's a Bot greeting.
        if (chatHistory.length > 0 && chatHistory[0].role === 'assistant') {
            chatHistory.shift(); // Remove the initial bot greeting to ensure we start with User
        }

        messages.push(...chatHistory);
        messages.push({ role: "user", content: message });

        const headers = {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        };

        const payload = {
            model: "google/gemma-3-27b-it",
            messages: messages,
            max_tokens: 512,
            temperature: 0.2,
            top_p: 0.7
        };

        console.log("NVIDIA Frontend Bot Request:", JSON.stringify(payload, null, 2));

        const response = await axios.post(NVIDIA_API_URL, payload, { headers });
        const botResponse = response.data.choices[0].message.content;
        res.json({ success: true, response: botResponse });

    } catch (error) {
        console.error("FrontendBot Proxy Error Full:", error.response?.data || error.message);
        const detail = error.response?.data?.detail || error.response?.data?.message || error.message;
        res.status(400).json({
            success: false,
            message: `I'm having trouble connecting to my brain. (${detail})`
        });
    }
};
