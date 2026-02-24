# Character Canvas - Architecture & Feature Documentation

Character Canvas is a client-side AI creative suite built with React and powered by Google's Gemini 2.5 Flash models. It focuses on character consistency ("Influencers"), image generation, and workflow tools for AI artists.

## 1. Tech Stack

- **Frontend Framework**: React 19 (via Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Backend**: Google GenAI SDK (`@google/genai`)
  - Image Generation: `gemini-2.5-flash-image`
  - Vision/Text: `gemini-2.5-flash`
- **Persistence**: Browser `localStorage` (No external database currently)
- **State Management**: React Context / Lifted State in `App.tsx`

## 2. Core Features

### 1. Dashboard
- **Purpose**: Central hub for navigation and asset management.
- **Functionality**:
  - Displays created Characters ("Influencers").
  - Displays Gallery of generated images.
  - Quick actions to delete items or start new workflows.

### 2. Canvas Studio (Image Generator)
- **Purpose**: Primary text-to-image and image-to-image workspace.
- **Key Capabilities**:
  - **Text-to-Image**: Generate images from prompts with selectable Art Styles (e.g., Photorealistic, Anime, Cyberpunk).
  - **Aspect Ratios**: Supports 1:1, 16:9, 9:16, 4:5, 3:2.
  - **Image Reference**: Upload an image to use as a composition/pose reference.
  - **Character Consistency**: Select a saved "Influencer" to inject their identity (face) into the generation using Gemini's reference image capabilities.

### 3. Character Creator
- **Purpose**: Define and save persistent character profiles.
- **Data Stored**:
  - **Identity Image**: Uploaded photo used as the "Face Source" for consistency.
  - **Attributes**: Age, Gender, Ethnicity, Body Type, etc.
  - These profiles are saved to `localStorage` and used across other modules.

### 4. Character Transfer (formerly Face Swap)
- **Purpose**: Generative insertion of a character into an existing scene/photo.
- **Workflow**:
  1. Upload a Target Scene (Source base for pose/composition).
  2. Select a Character (Identity Source).
  3. AI "re-imagines" the scene, generating a new image that maintains the target's composition/lighting but features the character's identity.
- **Note**: This is distinct from pixel-based "deepfakes". It is a full generative process using the `gemini-2.5-flash-image` reference capabilities.

### 5. Image to Prompt
- **Purpose**: Reverse-engineer prompts from images.
- **Mechanism**: Uses `gemini-2.5-flash` (Vision) to analyze an uploaded image and describe it in "Stable Diffusion prompt format" (Subject, Lighting, Style, etc.).
- **Integration**: One-click "Use this Prompt" button sends the result to the Studio module.

### 6. Character Sheet Generator
- **Purpose**: Create consistent reference sheets for characters.
- **Functionality**: Generates multiple views/expressions of a selected Influencer in a single layout, useful for consistency testing.

### 7. Character Prompt Generator
- **Purpose**: Helper tool to write detailed text descriptions for characters.
- **Mechanism**: Analyzes uploaded headshots/bodyshots + distinct attributes (Gender, Age, etc.) to write a dense, high-quality prompt paragraph.

### 8. Image Editor *(In Progress)*
- **Purpose**: Edit specific parts of generated images (Inpainting/Outpainting or Adjustment).
- **Status**: Feature structure exists, logic is specialized for "Editing" tasks via the AI service.

## 3. Architecture & Data Flow

### Entry Point & Routing
- **File**: `App.tsx`
- **Routing**: No external router (e.g., React Router). Uses a simple state-based view switcher (`currentView` state).
- **State Persistence**: 
  - `influencers` and `gallery` states are initialized from `localStorage` on mount.
  - `useEffect` hooks sync state changes back to `localStorage`.

### State Management
- **Global State**: Managed in `App.tsx` and passed down as props.
  - `influencers`: Array of character profiles.
  - `gallery`: Array of generated artifacts.
- **Transient State**: Passed via `handleNavigate(view, config)` to transfer data between views (e.g., sending a generated prompt from *Image to Prompt* -> *Studio*).

### AI Service Layer
- **File**: `services/geminiService.ts`
- **Client**: Instantiates `GoogleGenAI` with an API Key.
- **Methods**:
  - `generateContent(config)`: The workhorse function. specific logic handles constructing the multipart request (Text + Reference Images) for Gemini.
    - Handles logic for "Style" suffixes.
    - Maps UI Aspect Ratios to API-supported ratios.
  - `describeImage(base64)`: Calls Flash Vision model for image captioning.
  - `generateCharacterPrompt(...)`: Complex prompt engineering pipeline that combines visual analysis of uploads with structured text constraints.

## 4. Data Models

### Influencer (Character)
```typescript
interface Influencer {
  id: string | number;
  name: string;
  avatarUrl: string; // Base64 or URL of the face reference
  // Physical attributes (Gender, Age, Ethnicity, etc.) used for prompting text
  gender?: string;
  ethnicity?: string; 
  // ...
}
```

### GalleryItem
```typescript
interface GalleryItem {
  id: string;
  imageUrl: string; // Base64
  prompt: string;
  type: 'generation' | 'faceswap' | ...;
  timestamp: number;
}
```

## 5. Directory Structure

```
src/
├── components/          # Feature-specific UI components
│   ├── Dashboard.tsx    # Home view
│   ├── NanoBananaStudio.tsx # Main generator
│   └── ...              # Other feature components
├── services/
│   └── geminiService.ts # Google GenAI SDK wrapper
├── App.tsx              # Main controller & State container
├── types.ts             # TypeScript definitions
└── main.tsx            # React entry
```
