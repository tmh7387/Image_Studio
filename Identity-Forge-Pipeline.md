# ARCHITECTURE BLUEPRINT: The "Identity Forge" Pipeline

## 1. Executive Summary
**Goal:** Upgrade the existing `Influencer` system in NanoBanana Studio to a robust "Character DNA" architecture.
**Core Philosophy:** Move from a single-step generation to a sequential "Identity Forge" pipeline:
1.  **Extract:** Analyze user uploads to create a Semantic Blueprint.
2.  **Forge Head:** Generate a perfect, neutral "Passport Photo" (The Visual Anchor).
3.  **Forge Body:** Generate a neutral "Lookbook" body shot using the Head as a hard reference.

**Tech Stack:** React 19, Vite, TypeScript, Google GenAI SDK (`gemini-2.5-flash` for vision, `gemini-2.5-flash-image` for generation). NO external backend.

---

## 2. Data Schema Upgrade

**Action:** Replace the simple `Influencer` type in `src/types.ts` with `CharacterDNA`.

```typescript
export interface CharacterDNA {
  id: string;
  name: string;
  createdAt: number;

  /** * THE VISUAL ANCHORS (Generated Assets)
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