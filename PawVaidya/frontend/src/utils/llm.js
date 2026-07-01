import axios from 'axios';
import { getBestMatchingFaq } from '../faqdata/chatbotFaq';

class CustomFrontendLLM {
    constructor(options = {}) {
        this.options = options;
    }

    async chat(messages, options = {}) {
        const mergedOptions = { ...this.options, ...options };
        const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
        
        let text = "";
        let history = [];

        if (typeof messages === 'string') {
            text = messages;
        } else if (Array.isArray(messages)) {
            const userMsgs = messages.filter(m => m.role === 'user');
            if (userMsgs.length > 0) {
                text = userMsgs[userMsgs.length - 1].content || userMsgs[userMsgs.length - 1].text || "";
            }
            history = messages.slice(0, messages.length - 1).map(m => ({
                role: m.role === 'assistant' || m.role === 'model' || m.role === 'bot' ? 'assistant' : 'user',
                content: m.content || m.text || ""
            }));
        }

        // Check for preloaded answers first
        const matchedFaq = getBestMatchingFaq(text);
        if (matchedFaq) {
            console.log(`[Local FAQ] Instant match found for: "${text}"`);
            return matchedFaq.a;
        }

        // Get token from cookie or local storage to authenticate the request
        const token = localStorage.getItem('token') || '';
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['token'] = token;

        const response = await axios.post(
            `${backendUrl}/api/bot/query-frontend`,
            { 
                message: text, 
                history,
                options: mergedOptions
            },
            { headers }
        );

        if (response.data.success) {
            return response.data.response;
        } else {
            throw new Error(response.data.message || "Failed to query LLM");
        }
    }
}

function LLM(promptOrMessages, options = {}) {
    const instance = new CustomFrontendLLM(options);
    return instance.chat(promptOrMessages, options);
}

Object.setPrototypeOf(LLM, CustomFrontendLLM.prototype);
LLM.prototype = CustomFrontendLLM.prototype;
LLM.constructor = CustomFrontendLLM;

export default LLM;
