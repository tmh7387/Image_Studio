

import { GenerationConfig, GenerationResult, AIModel, AspectRatio } from "../types";
import { logError } from "../utils/errorHandler";

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
    // Flux is also often hosted via OpenAI-compatible image endpoint on aggregators
    const isOpenAIImageModel = config.model?.includes('doubao');

    // Extract reference image (Manual Upload usually takes precedence if set, otherwise DNA ref)
    const refImage = config.base64Image || config.characterReferenceImage;

    if (isOpenAIImageModel) {
        // --- OPENAI COMPATIBLE IMAGE ENDPOINT (Doubao / Flux) ---
        const model = config.model || AIModel.DOUBAO_SEEDREAM;

        // Doubao requires High Resolution (>3.6MP)
        let size = "1920x1920";
        if (config.aspectRatio === AspectRatio.WIDE_16_9) size = "2560x1440";
        if (config.aspectRatio === AspectRatio.TALL_9_16) size = "1440x2560";
        if (config.aspectRatio === AspectRatio.SQUARE) size = "1920x1920";

        // IMPORTANT: Doubao Seedream via Comet does NOT appear to support /chat/completions for Img2Img (Vision)
        // We use /images/generations (Text-to-Image).
        // Attempting to pass reference image via 'image_url' parameter (common aggregator pattern).

        const endpoint = `${COMET_API_URL}/images/generations`;

        const payload: any = {
            model: model,
            prompt: config.prompt + (config.style ? ` style of ${config.style}` : ""),
            n: 1,
            size: size,
            response_format: "url"
        };

        if (refImage) {
            // Check if it's a Data URI (Base64) vs Public URL
            if (refImage.startsWith('data:')) {
                // For Base64, many aggregators prefer 'image_base64' without prefix
                const clean = refImage.replace(/^data:image\/[a-z]+;base64,/, "");
                payload.image_base64 = clean;
                payload.image_url = refImage; // Keep just in case
            } else {
                payload.image_url = refImage;
            }
        }

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(`CometAPI Error (${model}): ${data.error?.message || response.statusText}`);

            return { imageUrl: data.data?.[0]?.url };

        } catch (error) {
            logError(error, `Comet API - ${model}`);
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

    // Construct Parts
    const parts: any[] = [
        { text: config.prompt + (config.style ? ` in style of ${config.style}` : "") }
    ];

    // Add Reference Image part (Multimodal Input)
    if (refImage) {
        const base64Data = refImage.replace(/^data:image\/[a-z]+;base64,/, "");
        const mimeMatch = refImage.match(/^data:(image\/[a-z]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        });
    }

    const payload = {
        contents: [
            {
                parts: parts
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

        const responseParts = candidate.content?.parts || [];
        const imagePart = responseParts.find((p: any) => p.inlineData || (p.image && p.image.format));

        if (imagePart && imagePart.inlineData) {
            // Construct Data URL
            const mimeType = imagePart.inlineData.mimeType || "image/png";
            const base64 = imagePart.inlineData.data;
            return { imageUrl: `data:${mimeType};base64,${base64}` };
        }

        // Fallback: Check if there's text with a URL (unlikely for strict image mode but possible)
        const textPart = responseParts.find((p: any) => p.text);
        if (textPart) {
            // Try extract URL
            const urlMatch = textPart.text.match(/(https?:\/\/[^\s)]+)/);
            if (urlMatch) return { imageUrl: urlMatch[1] };

            throw new Error(`Model returned text but no image data: ${textPart.text.substring(0, 100)}...`);
        }

        throw new Error("No image data found in response");

    } catch (error) {
        logError(error, "Comet API - Gemini Native");
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
        logError(error, "Comet API - analyzeCharacterImage");
        throw error;
    }
};

export const generateCharacterPrompt = async (
    headshotBase64: string | null,
    bodyshotBase64: string | null,
    attributes: any
): Promise<string> => {
    const apiKey = getCometKey();
    if (!apiKey) throw new Error("Comet API Key missing");

    const model = AIModel.GROK_4_FAST; // Good localized text model

    // Build constraints string
    let constraints = "PHYSICAL ATTRIBUTES (Must be respected):";
    if (attributes.gender) constraints += `\n- Gender: ${attributes.gender}`;
    if (attributes.age) constraints += `\n- Age: ${attributes.age}`;
    if (attributes.ethnicity) constraints += `\n- Ethnicity: ${attributes.ethnicity}`;
    if (attributes.bodyType) constraints += `\n- Body Type: ${attributes.bodyType}`;
    if (attributes.height) constraints += `\n- Height: ${attributes.height}`;
    if (attributes.complexion) constraints += `\n- Complexion: ${attributes.complexion}`;
    if (attributes.features && attributes.features !== 'None') constraints += `\n- Features: ${attributes.features}`;

    const systemPrompt = `You are an expert prompt engineer for Stable Diffusion and Midjourney. 
    Task: Create a highly detailed, descriptive character prompt based on the provided visual and text inputs.
    Output: A single, dense paragraph. No filler. Focus on visual details.`;

    const messages: any[] = [
        { role: "system", content: systemPrompt }
    ];

    const contentParts: any[] = [
        { type: "text", text: `Create a character prompt.\n${constraints}` }
    ];

    // Add visuals if present (Multimodal analysis + extraction)
    if (headshotBase64) {
        const clean = headshotBase64.replace(/^data:(.*,)?/, '');
        contentParts.push({
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${clean}` }
        });
        contentParts.push({ type: "text", text: "(Image 1: Face Reference)" });
    }
    if (bodyshotBase64) {
        const clean = bodyshotBase64.replace(/^data:(.*,)?/, '');
        contentParts.push({
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${clean}` }
        });
        contentParts.push({ type: "text", text: "(Image 2: Body/Style Reference)" });
    }

    messages.push({ role: "user", content: contentParts });

    try {
        const response = await fetch(`${COMET_API_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_tokens: 1000
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Prompt generation failed");

        return data.choices?.[0]?.message?.content || "No prompt generated.";

    } catch (error) {
        logError(error, "Comet API - generateCharacterPrompt");
        throw error;
    }
};
