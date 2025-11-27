
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

export interface GenerationConfig {
  prompt: string;
  style: ArtStyle;
  aspectRatio: AspectRatio;
  base64Image?: string; // For Image-to-Image (Pose/Composition)
  mimeType?: string;
  characterReferenceImage?: string; // For Character Consistency (The "Trained" face)
  characterStrength?: 'low' | 'medium' | 'high';
  taskType?: 'generation' | 'editing'; // New field for Editing tasks
}

export interface GenerationResult {
  imageUrl?: string;
  text?: string;
}

export interface Influencer {
  id: string | number;
  name: string;
  description?: string;
  gender?: string;
  imageColor?: string;
  avatarUrl?: string; // Used as the primary anchor/reference image
  trainingImages?: string[]; // Store the full set if needed for future advanced features
  
  // Physical Attributes
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
