
import { GoogleGenAI } from "@google/genai";
import { ArtStyle, AspectRatio, GenerationConfig, GenerationResult } from "../types";

// Initialize the client
// Initialize the client lazily or with a placeholder to prevent crash on load
const getAiClient = () => {
  const localStorageKey = localStorage.getItem('gemini_api_key');
  const envKey = (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.API_KEY; // Fallback to either env var
  const apiKey = localStorageKey || envKey || "PLACEHOLDER_KEY_FOR_UI_RENDERING";
  return new GoogleGenAI({ apiKey });
};
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); // OLD CRASHING CODE

const MODEL_NAME = "gemini-2.5-flash-image";
const TEXT_MODEL_NAME = "gemini-2.5-flash";

// Helper to map UI Aspect Ratios to API supported values
const mapAspectRatio = (ratio: AspectRatio): string | undefined => {
  switch (ratio) {
    case AspectRatio.SQUARE:
      return "1:1";
    case AspectRatio.WIDE_16_9:
      return "16:9";
    case AspectRatio.TALL_9_16:
      return "9:16";
    // Map unsupported requested ratios to closest supported API config
    case AspectRatio.PORTRAIT_4_5:
      return "3:4";
    case AspectRatio.LANDSCAPE_3_2:
      return "4:3";
    default:
      return "1:1";
  }
};

export const generateContent = async (config: GenerationConfig): Promise<GenerationResult> => {
  const { prompt, style, aspectRatio, base64Image, mimeType, characterReferenceImage, taskType } = config;

  // Prepare contents
  const parts: any[] = [];
  let promptPrefix = "";

  // 1. Handle Character Reference (The "Trained" LoRA simulation)
  if (characterReferenceImage) {
    const cleanCharBase64 = characterReferenceImage.replace(/^data:(.*,)?/, '');
    parts.push({
      inlineData: {
        data: cleanCharBase64,
        mimeType: "image/png",
      },
    });
    promptPrefix += "Image 1 is the CHARACTER VISUAL ANCHOR (Face/Identity Source). Maintain this exact identity. ";
  }

  // 2. Handle Image Input (Source Image/Scene/Pose)
  if (base64Image && mimeType) {
    const cleanBase64 = base64Image.replace(/^data:(.*,)?/, '');
    const imgIndex = characterReferenceImage ? 2 : 1;
    parts.push({
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType,
      },
    });

    // Logic branching based on Task Type
    if (taskType === 'editing') {
      promptPrefix += `Image ${imgIndex} is the image to EDIT. Instruction: `;
    } else {
      // Standard Generation with Reference
      if (characterReferenceImage) {
        promptPrefix += `Image ${imgIndex} is the POSE/COMPOSITION TARGET. Transfer the character from Image 1 into the scene/pose of Image ${imgIndex}. `;
      } else {
        promptPrefix += `Use Image ${imgIndex} as a visual reference for composition and structure. `;
      }
    }
  }

  // 3. Construct Final Text Prompt
  let finalPrompt = promptPrefix + prompt;

  if (style !== ArtStyle.NO_STYLE) {
    finalPrompt = `${finalPrompt} style: ${style}.`;
  }

  // Handle unsupported exact aspect ratios via prompt engineering
  if (aspectRatio === AspectRatio.PORTRAIT_4_5) {
    finalPrompt += " (Aspect Ratio 4:5 composition)";
  } else if (aspectRatio === AspectRatio.LANDSCAPE_3_2) {
    finalPrompt += " (Aspect Ratio 3:2 composition)";
  }

  // Add text prompt last
  parts.push({ text: finalPrompt });

  try {
    const apiAspectRatio = mapAspectRatio(aspectRatio);

    const response = await getAiClient().models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: apiAspectRatio,
        },
      },
    });

    let imageUrl: string | undefined;
    let textResponse: string | undefined;

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          textResponse = part.text;
        }
      }
    }

    return { imageUrl, text: textResponse };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const describeImage = async (base64Image: string, mimeType: string): Promise<string> => {
  const cleanBase64 = base64Image.replace(/^data:(.*,)?/, '');

  try {
    const response = await getAiClient().models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType
            }
          },
          {
            text: "Describe this image in extreme detail as a stable diffusion prompt. Focus on the subject's appearance, clothing, lighting, background, art style, camera angle, and color palette. Output ONLY the prompt text, no conversational filler."
          }
        ]
      }
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to generate description.";
  } catch (error) {
    console.error("Gemini Describe Error:", error);
    throw error;
  }
};

interface CharacterAttributes {
  gender?: string;
  age?: string;
  ethnicity?: string;
  bodyType?: string;
  height?: string;
  complexion?: string;
  features?: string;
}

export const generateCharacterPrompt = async (
  headshotBase64: string | null,
  bodyshotBase64: string | null,
  attributes: CharacterAttributes
): Promise<string> => {

  const parts: any[] = [];

  if (headshotBase64) {
    const cleanHead = headshotBase64.replace(/^data:(.*,)?/, '');
    // Simple mimetype guess or pass in. Assuming jpeg/png works generally.
    parts.push({
      inlineData: { data: cleanHead, mimeType: 'image/png' }
    });
  }

  if (bodyshotBase64) {
    const cleanBody = bodyshotBase64.replace(/^data:(.*,)?/, '');
    parts.push({
      inlineData: { data: cleanBody, mimeType: 'image/png' }
    });
  }

  // Build constraint text
  let constraints = "PHYSICAL ATTRIBUTES (Must be included):";
  if (attributes.gender) constraints += `\n- Gender: ${attributes.gender}`;
  if (attributes.age) constraints += `\n- Age: ${attributes.age}`;
  if (attributes.ethnicity) constraints += `\n- Ethnicity: ${attributes.ethnicity}`;
  if (attributes.bodyType) constraints += `\n- Body Type: ${attributes.bodyType}`;
  if (attributes.height) constraints += `\n- Height: ${attributes.height}`;
  if (attributes.complexion) constraints += `\n- Complexion: ${attributes.complexion}`;
  if (attributes.features && attributes.features !== 'None') constraints += `\n- Distinguishing Features: ${attributes.features}`;

  const promptText = `
    You are an expert prompt engineer for AI Image Generators.
    
    TASK:
    Create a highly detailed, structured character description prompt based on the inputs provided.
    
    INPUTS:
    ${headshotBase64 ? "- Image 1: Headshot Reference" : ""}
    ${bodyshotBase64 ? "- Image 2: Body/Outfit Reference" : ""}
    ${constraints}
    
    INSTRUCTIONS:
    1. Analyze the provided images (if any) to extract specific facial structures, hair style, eye color, fashion style, and vibe.
    2. Combine visual findings with the text 'PHYSICAL ATTRIBUTES' listed above. The text attributes take precedence if there is a conflict.
    3. Output a single, dense paragraph suitable for Stable Diffusion or Midjourney.
    4. Focus on: Facial features, Skin texture, Hair details, Body proportions, Clothing style, and general Vibe/Aura.
    5. Do NOT include conversational filler like "Here is the prompt". Just output the prompt text.
  `;

  parts.push({ text: promptText });

  try {
    const response = await getAiClient().models.generateContent({
      model: TEXT_MODEL_NAME, // gemini-2.5-flash is multimodal capable
      contents: { parts }
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to generate prompt.";
  } catch (error) {
    console.error("Gemini Character Prompt Error:", error);
    throw error;
  }
};

export const analyzeCharacterImage = async (base64Image: string): Promise<any> => {
  const cleanBase64 = base64Image.replace(/^data:(.*,)?/, '');

  const prompt = `
    You are an expert character designer. Analyze the provided image and extract a JSON profile (NO markdown). 
    Accurately estimate the:
    - Age Range (e.g., "Late 20s", "Mid 40s")
    - Gender
    - Ethnicity
    - Body Somatotype (using standard terms like Ectomorph/Mesomorph or descriptive terms like Athletic/Curvy)
    - List 3 distinct facial features
    - Identify the Clothing Style shown.

    Output STRICT JSON format:
    {
      "bio": {
        "ageRange": "string",
        "gender": "string",
        "ethnicity": "string",
        "bodySomatotype": "string",
        "facialFeatures": ["string", "string", "string"]
      },
      "stylePreferences": {
        "clothingStyle": ["string"]
      }
    }
  `;

  try {
    const response = await getAiClient().models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: "image/png" // Assuming PNG/JPEG generic handling
            }
          },
          { text: prompt }
        ]
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response from analysis model");

    // Clean markdown code blocks if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("Character Analysis Error:", error);
    throw error;
  }
};
