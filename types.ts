
export enum ArtStyle {
  NO_STYLE = "No Style (Raw)",
  PHOTOREALISTIC = "Photorealistic",
  ANIME_MANGA = "Anime / Manga",
  CINEMATIC = "Cinematic",
  SURREALISM = "Surrealism",
  WATERCOLOR = "Watercolor",
  MOEBIUS = "Moebius Style",
  HYPER_REALISTIC = "Hyper-realistic",
  CYBERPUNK = "Cyberpunk",
  OIL_PAINTING = "Oil Painting",
  THREE_D_RENDER = "3D Render",
  PENCIL_SKETCH = "Pencil Sketch",
  PIXEL_ART = "Pixel Art",
}

export enum AspectRatio {
  SQUARE = "1:1",
  WIDE_16_9 = "16:9",
  TALL_9_16 = "9:16",
  PORTRAIT_4_5 = "4:5",
  LANDSCAPE_3_2 = "3:2",
}

export enum AIProvider {
  GOOGLE = "Google Gemini Native",
  COMET = "CometAPI (Aggregator)"
}

export enum AIModel {
  GEMINI_2_5_FLASH = "gemini-2.5-flash",
  GEMINI_2_5_FLASH_IMAGE = "gemini-2.5-flash-image",
  // Comet Specific
  GEMINI_3_PRO_IMAGE = "gemini-3-pro-image",
  DOUBAO_SEEDREAM = "doubao-seedream-4-5-251128",
  GROK_4_FAST = "grok-4-fast-non-reasoning"
}

export interface GenerationConfig {
  prompt: string;
  style: ArtStyle;
  aspectRatio: AspectRatio;
  base64Image?: string; // For Image-to-Image (Pose/Composition)
  mimeType?: string;
  characterReferenceImage?: string; // For Character Consistency (The "Trained" face)
  characterStrength?: 'low' | 'medium' | 'high';
  taskType?: 'generation' | 'editing'; // New field for Editing tasks

  // Provider Config
  provider?: AIProvider;
  model?: string; // specific model override
}

export interface GenerationResult {
  imageUrl?: string;
  text?: string;
}

export interface CharacterDNA {
  id: string | number;
  name: string;
  createdAt: number;
  anchorImage: string; // Base64 or URL

  bio: {
    ageRange: string;
    gender: string;
    ethnicity: string;
    bodySomatotype: string;
    facialFeatures: string[];
  };

  stylePreferences: {
    clothingStyle: string[];
    defaultAccessories: string[];
  };
}

// Backward compatibility or legacy type
export interface Influencer extends Partial<CharacterDNA> {
  id: string | number;
  name: string;
  description?: string;
  gender?: string;
  imageColor?: string;
  avatarUrl?: string;
  trainingImages?: string[];

  // Physical Attributes (Legacy flattened)
  characterStyle?: string;
  age?: string;
  ethnicity?: string;
  bodyType?: string;
  height?: string;
  complexion?: string;
  distinguishingFeatures?: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  type: 'generation' | 'faceswap' | 'editing' | 'image-to-prompt' | 'character-prompt';
  timestamp: number;
  influencerId?: string | number;
}
