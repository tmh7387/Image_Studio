
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
  GEMINI_EXP_1206 = "gemini-exp-1206",
  // Comet Specific
  GEMINI_3_PRO_IMAGE = "gemini-3-pro-image",
  DOUBAO_SEEDREAM = "doubao-seedream-4-5-251128",
  GROK_4_FAST = "grok-4-fast-non-reasoning",
  FLUX_1_PRO = "flux-1-pro"
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
  id: string;
  name: string;
  createdAt: number;

  /**
   * THE VISUAL ANCHORS (Generated Assets)
   * These are the source of truth for all future generations.
   */
  anchorHeadshot: string; // Base64: The "Passport Photo" (1:1 aspect ratio)
  anchorBody: string;     // Base64: The "Neutral Lookbook" (Full body, white bg)

  /**
   * THE SEMANTIC BLUEPRINT (Text Source)
   * Split into Immutable (Physical) and Mutable (Style).
   */
  blueprint: {
    // IMMUTABLE: Physical traits that never change
    identity: {
      ageRange: string;       // e.g., "Late 20s"
      gender: string;         // e.g., "Female"
      ethnicity: string;      // e.g., "Japanese-Brazilian"
      skinComplexion: string; // e.g., "Olive skin with warm undertones"
      eyeDetails: string;     // e.g., "Almond-shaped hazel eyes"
      hairDetails: string;    // e.g., "Shoulder-length wavy dark brown hair"
      distinctiveFeatures: string[]; // e.g., ["Beauty mark on chin", "High cheekbones"]
    };

    // MUTABLE: The default "Vibe" (Can be overridden in scenes later)
    style: {
      bodySomatotype: string; // e.g., "Athletic", "Curvy", "Tall and lanky"
      clothingStyle: string[]; // e.g., ["Minimalist", "Streetwear"]
      defaultAccessories: string[]; // e.g., ["Gold hoop earrings"]
    };
  };
}

// Backward compatibility: Legacy Influencer type
// Supports both old single-anchor and new dual-anchor schemas
export interface Influencer {
  id: string | number; // Support both old (number) and new (string) IDs
  name: string;
  description?: string;
  gender?: string;
  imageColor?: string;
  avatarUrl?: string;
  trainingImages?: string[];

  // Legacy single anchor (for old data)
  anchorImage?: string;

  // New dual anchors (CharacterDNA compatibility)
  anchorHeadshot?: string;
  anchorBody?: string;
  blueprint?: CharacterDNA['blueprint'];
  createdAt?: number;

  // Physical Attributes (Legacy flattened - pre-blueprint era)
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
