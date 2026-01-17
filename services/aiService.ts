
import { GenerationConfig, GenerationResult, AIProvider, AIModel } from "../types";
import { generateContent as generateGemini, analyzeCharacterImage as analyzeGemini, describeImage as describeGemini, generateCharacterPrompt as promptGemini } from "./geminiService";
import { generateContent as generateComet, analyzeCharacterImage as analyzeComet } from "./cometService";

// Helper to get active provider from settings
const getProvider = (): AIProvider => {
    const stored = localStorage.getItem('ai_provider');
    return (stored as AIProvider) || AIProvider.GOOGLE;
};

export const generateContent = async (config: GenerationConfig): Promise<GenerationResult> => {
    const provider = config.provider || getProvider();

    if (provider === AIProvider.COMET) {
        return generateComet(config);
    }
    return generateGemini(config);
};

export const analyzeCharacterImage = async (base64Image: string): Promise<any> => {
    const provider = getProvider();
    if (provider === AIProvider.COMET) {
        return analyzeComet(base64Image);
    }
    return analyzeGemini(base64Image);
};

export const describeImage = async (base64Image: string, mimeType: string): Promise<string> => {
    // Comet implementation for describeImage is TBD, defaulting to Gemini or we implement later
    // For now, if Comet, use analyzeComet generic or fallback
    const provider = getProvider();
    if (provider === AIProvider.COMET) {
        // We can use the Grok vision for this
        // But for now let's just use Gemini strictly or implement a basic Comet describer
        // Return analyzeComet(base64Image) but stringified?
        // Actually implementation is missing, I will create describeImage in cometService
        return "Comet description not fully implemented yet.";
    }
    return describeGemini(base64Image, mimeType);
};

export const generateCharacterPrompt = async (
    headshotBase64: string | null,
    bodyshotBase64: string | null,
    attributes: any
): Promise<string> => {
    const provider = getProvider();
    if (provider === AIProvider.COMET) {
        // Fallback or implement
        return "Comet prompt gen not implemented.";
    }
    return promptGemini(headshotBase64, bodyshotBase64, attributes);
};
