import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleGenerativeAI } from "@google/generative-ai";

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
    const { i18n } = useTranslation();
    const [translationCache, setTranslationCache] = useState(() => {
        const saved = localStorage.getItem('translation_cache');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('translation_cache', JSON.stringify(translationCache));
    }, [translationCache]);

    const translateText = async (text, targetLang = i18n.language) => {
        if (!text || targetLang === 'en') return text;

        const cacheKey = `${text}_${targetLang}`;
        if (translationCache[cacheKey]) return translationCache[cacheKey];

        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                systemInstruction: "You are a professional medical and veterinary translator for 'PawVaidya', India's #1 Veterinary Platform. Translate the following text accurately into the target language. Maintain a professional, empathetic, and expert tone. Only return the translated text, nothing else."
            });

            const langMap = { 'hi': 'Hindi', 'ta': 'Tamil', 'te': 'Telugu' };
            const targetLangFull = langMap[targetLang] || targetLang;

            const prompt = `Translate this text to ${targetLangFull}:\n\n${text}`;
            const result = await model.generateContent(prompt);
            const translation = result.response.text().trim();

            setTranslationCache(prev => ({ ...prev, [cacheKey]: translation }));
            return translation;
        } catch (error) {
            console.error('Translation failed:', error);
            return text;
        }
    };

    /**
     * Translates an array of strings in a single batch to save context and potentially improve speed/consistency.
     */
    const translateBatch = async (texts, targetLang = i18n.language) => {
        if (!texts || texts.length === 0 || targetLang === 'en') return texts;

        // Filter out already cached or empty strings
        const results = [...texts];
        const missingIndices = [];
        const missingTexts = [];

        texts.forEach((text, index) => {
            if (!text) return;
            const cacheKey = `${text}_${targetLang}`;
            if (translationCache[cacheKey]) {
                results[index] = translationCache[cacheKey];
            } else {
                missingIndices.push(index);
                missingTexts.push(text);
            }
        });

        if (missingTexts.length === 0) return results;

        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                systemInstruction: "You are a professional veterinary translator. Translate each item in the provided JSON array to the target language. Maintain professional tone. Return a JSON array of strings in the same order."
            });

            const langMap = { 'hi': 'Hindi', 'ta': 'Tamil', 'te': 'Telugu' };
            const targetLangFull = langMap[targetLang] || targetLang;

            const prompt = `Target Language: ${targetLangFull}\n\nTexts to translate:\n${JSON.stringify(missingTexts)}`;
            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim();

            // Try to extract JSON array if model included extra text
            const jsonMatch = responseText.match(/\[.*\]/s);
            const translatedArray = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

            const newCache = { ...translationCache };
            translatedArray.forEach((translation, i) => {
                const originalText = missingTexts[i];
                const actualIndex = missingIndices[i];
                results[actualIndex] = translation;
                newCache[`${originalText}_${targetLang}`] = translation;
            });

            setTranslationCache(newCache);
            return results;
        } catch (error) {
            console.error('Batch translation failed:', error);
            return results;
        }
    };

    return (
        <TranslationContext.Provider value={{ translateText, translateBatch, isTranslating: false }}>
            {children}
        </TranslationContext.Provider>
    );
};

export const useAITranslation = () => {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useAITranslation must be used within a TranslationProvider');
    }
    return context;
};
