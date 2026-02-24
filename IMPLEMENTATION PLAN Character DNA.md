# IMPLEMENTATION PLAN: Character DNA Suite Upgrade

## 1. Executive Summary
**Goal:** Upgrade the existing "Influencer" system in NanoBanana Studio to a robust "Character DNA" architecture. 
**Objective:** Achieve photorealistic identity consistency (realism) and infinite situational flexibility (variety) without building a custom training backend.
**Method:** Leverage `gemini-2.5-flash` (Vision) for semantic analysis and `gemini-2.5-flash-image` (Image Guidance) for visual consistency.

## 2. Technical Context & Constraints
* **Current Stack:** React 19, Vite, TypeScript, Tailwind CSS.
* **AI Engine:** Google GenAI SDK (`@google/genai`).
* **Persistence:** `localStorage` (Client-side).
* **Constraint:** NO external Python backend or database. All logic must reside in the frontend `services/` and `utils/` layers.

---

## 3. Data Architecture (Schema Upgrade)

**Action:** Update `src/types.ts`.
Refactor the simple `Influencer` interface into a structured `CharacterDNA` profile that separates "Fixed Identity" from "Variable Style."

```typescript
export interface CharacterDNA {
  id: string;
  name: string;
  createdAt: number;

  /** * VISUAL ANCHOR: The source of truth for the AI generator.
   * This specific base64 string must be passed to the image generator 
   * as a reference image to enforce facial identity.
   */
  anchorImage: string; 

  /**
   * SEMANTIC ANCHOR: The text source of truth.
   * Extracted via Gemini Vision, but editable by the user.
   */
  bio: {
    ageRange: string;       // e.g., "Late 20s", "Mid 40s"
    gender: string;         // e.g., "Female", "Non-binary", "Male"
    ethnicity: string;      // e.g., "East Asian", "Afro-Caribbean"
    bodySomatotype: string; // e.g., "Athletic", "Curvy", "Slender"
    
    // Key facial landmarks to reinforce the prompt
    facialFeatures: string[]; // e.g., ["High cheekbones", "Freckles", "Sharp jawline"]
  };

  /**
   * AESTHETIC LAYER: Variable preferences that give the character "vibe".
   */
  stylePreferences: {
    clothingStyle: string[];    // e.g., ["Streetwear", "Minimalist", "Cyberpunk"]
    defaultAccessories: string[]; // e.g., ["Silver chain", "Glasses"]
  };
}