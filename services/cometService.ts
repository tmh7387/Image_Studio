
import { GenerationConfig, GenerationResult, AIModel } from "../types";

const getCometKey = () => localStorage.getItem('comet_api_key') || "";

const COMET_API_URL = "https://api.cometapi.com/v1";

// Mapping our generic config to Comet/OpenAI body
const createCometPayload = (config: GenerationConfig) => {
    const model = config.model || AIModel.GEMINI_3_PRO_IMAGE; // Default image model

    // Image Generation Endpoint Payload
    // NOTE: CometAPI docs might differ, assuming OpenAI DALL-E compatible "generations" or "chat"

    // Strategy: Comets Aggregator often uses /chat/completions for everything including images if the model is multimodal
    // BUT standard practice is /images/generations for image-only models.
    // Exception: "gemini-3-pro-image" in other aggregators is often a chat model that outputs image URL in text or attachment.
    // HOWEVER, user listed it alongside "doubao-seedream" which is definitely image gen.
    // I will assume standard /images/generations for now. 

    return {
        model: model,
        prompt: config.prompt,
        n: 1,
        size: "1024x1024", // Default unless we map aspect ratio
        response_format: "url" // or b64_json
    };
};

export const generateContent = async (config: GenerationConfig): Promise<GenerationResult> => {
    const apiKey = getCometKey();
    if (!apiKey) throw new Error("Comet API Key missing. Please set it in Settings.");

    // Check if it's Doubao (OpenAI Compatible Image Endpoint)
    const isOpenAIImageModel = config.model?.includes('doubao');

    if (isOpenAIImageModel) {
        // --- DOUBAO IMPLEMENTATION (OpenAI Standard) ---
        const model = config.model || AIModel.DOUBAO_SEEDREAM;
        const endpoint = `${COMET_API_URL}/images/generations`;

        // Map Aspect Ratio to specific sizes if needed, or use default logic
        let size = "1024x1024";
        if (config.aspectRatio === "16:9") size = "1792x1024";
        if (config.aspectRatio === "9:16") size = "1024x1792";
        if (config.aspectRatio === "4:5") size = "1024x1280";
        if (config.aspectRatio === "3:2") size = "1280x853";

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    prompt: config.prompt + (config.style ? ` style of ${config.style}` : ""),
                    n: 1,
                    size: size,
                    response_format: "url"
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(`CometAPI (Doubao) Error: ${data.error?.message || response.statusText}`);

            return { imageUrl: data.data?.[0]?.url };

        } catch (error) {
            console.error("Comet Doubao Error:", error);
            throw error;
        }
    }

    // --- GEMINI 3 PRO IMAGE IMPLEMENTATION (Native Protocol) ---
    // Using Gemini Native REST API via Comet Proxy
    const model = "gemini-3-pro-image"; // Explicitly force the ID User provided/linked
    const endpoint = `https://api.cometapi.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Map Aspect Ratio for Gemini Native
    // Based on sample code: "1:1", "16:9", "9:16", etc.
    // Note: config.aspectRatio is already "1:1" or "16:9" strings mostly.
    let aspectRatio = config.aspectRatio || "1:1";

    // Clean up label if it's from enum like "16:9" -> "16:9" (matches)
    // Ensure strict match
    if (!["1:1", "16:9", "9:16", "4:3", "3:4"].includes(aspectRatio)) {
        aspectRatio = "1:1"; // Fallback
    }

    const payload = {
        contents: [
            {
                parts: [
                    { text: config.prompt + (config.style ? ` in style of ${config.style}` : "") }
                ]
            }
        ],
        generationConfig: {
            responseModalities: ["IMAGE"], // Force image generation
            imageConfig: {
                aspectRatio: aspectRatio,
                imageSize: "4K" // Using 4K as per sample code (safest for quality)
            }
        }
    };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" }, // Key is in URL
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Comet Gemini Native Error", data);
            const errMsg = data.error?.message || JSON.stringify(data.error) || response.statusText;
            throw new Error(`CometAPI (Gemini) Error: ${errMsg}`);
        }

        // Parse Native Response
        // Structure: candidates[0].content.parts[].inlineData (Base64) or executableCode?
        // Sample code implies `part.as_image()`. Native API returns base64 in `inlineData` within parts.

        const candidate = data.candidates?.[0];
        if (!candidate) throw new Error("No candidates returned");

        const parts = candidate.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData || (p.image && p.image.format));

        if (imagePart && imagePart.inlineData) {
            // Construct Data URL
            const mimeType = imagePart.inlineData.mimeType || "image/png";
            const base64 = imagePart.inlineData.data;
            return { imageUrl: `data:${mimeType};base64,${base64}` };
        }

        // Fallback: Check if there's text with a URL (unlikely for strict image mode but possible)
        const textPart = parts.find((p: any) => p.text);
        if (textPart) {
            // Try extract URL
            const urlMatch = textPart.text.match(/(https?:\/\/[^\s)]+)/);
            if (urlMatch) return { imageUrl: urlMatch[1] };

            throw new Error(`Model returned text but no image data: ${textPart.text.substring(0, 100)}...`);
        }

        throw new Error("No image data found in response");

    } catch (error) {
        console.error("Comet Gemini Logic Error:", error);
        throw error;
    }
};

export const analyzeCharacterImage = async (base64Image: string): Promise<any> => {
    const apiKey = getCometKey();
    if (!apiKey) throw new Error("Comet API Key missing");

    // User requested Grok-4 fast for analysis
    const model = AIModel.GROK_4_FAST;

    const cleanBase64 = base64Image.replace(/^data:(.*,)?/, '');

    const prompt = `
    Analyze the provided image and extract a JSON profile (NO markdown). 
    Accurately estimate: Age Range, Gender, Ethnicity, Body Somatotype, 3 facial features, Clothing Style.
    Output STRICT JSON:
    {
      "bio": {
        "ageRange": "string",
        "gender": "string",
        "ethnicity": "string",
        "bodySomatotype": "string",
        "facialFeatures": ["string"]
      },
      "stylePreferences": {
        "clothingStyle": ["string"]
      }
    }
  `;

    // OpenAI Vision Payload
    const payload = {
        model: model,
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
                ]
            }
        ],
        max_tokens: 1000,
        response_format: { type: "json_object" } // Force JSON if model supports it (Grok might, otherwise we strip markdown)
    };

    try {
        const response = await fetch(`${COMET_API_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Analysis failed");

        let text = data.choices?.[0]?.message?.content;

        // Clean JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);

    } catch (error) {
        console.error("Comet Analysis Error:", error);
        throw error;
    }
};
