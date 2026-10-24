# Character Canvas - Architecture & Feature Documentation

Character Canvas is a professional-grade AI creative suite built with React. It orchestrates multiple AI providers (Google Gemini, CometAPI) to provide advanced layouts, character consistency ("Character DNA"), and persistent storage via IndexedDB.

## 1. Tech Stack

- **Frontend Framework**: React 19 (via Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Backend**: Multi-Provider Architecture
  - **Google GenAI**: `gemini-2.5-flash-image` (Generation), `gemini-2.5-flash` (Vision/Logic)
  - **CometAPI**: Aggregator for models like `doubao-seedream`, `flux-1-pro`, `grok-4`
- **Persistence**: **IndexedDB** (Client-side localized database)
- **State Management**: React Context / Lifted State in `App.tsx` + `storageService`

## 2. Core Features

### 1. Dashboard
- **Purpose**: Central hub for navigation, asset management, and quick actions.
- **Functionality**:
  - Displays "Influencers" (Characters) and Gallery grid.
  - Handles deletion and navigation to sub-modules.

### 2. Canvas Studio (The Generator)
- **Purpose**: Primary workspace for Text-to-Image and Image-to-Image.
- **Key Capabilities**:
  - **Multi-Model Support**: Switch between Gemini, Doubao, Flux, etc.
  - **Character Consistency**: Select a saved "Influencer". The system injects their visual anchors (Headshot/Body) into the generation pipeline.
  - **Composition Control**: Upload reference images for pose/layout guidance.
  - **Aspect Ratios**: 1:1, 16:9, 9:16, 4:5, 3:2.

### 3. Character Creator V2
- **Purpose**: Create professional "Character DNA" profiles.
- **Architecture**: 3-Panel Workflow
  1.  **References & Attributes**: Upload ref photos or manually define physical traits (Gender, Age, Ethnicity, etc.).
  2.  **Prompt Engineering**: Auto-generates high-fidelity text prompts for a "Passport Headshot" mapping and "Full Body Lookbook" mapping.
  3.  **Visual Anchors**: Generates and specifically saves two master images (Headshot & Body) which act as the ground truth for all future "Influencer" generations.

### 4. Character Transfer (Face Swap+)
- **Purpose**: Generative identity injection.
- **Mechanism**: specific pipeline that uses `gemini-2.5-flash-image` to re-render a target scene while enforcing the identity constraints of a selected Influencer.

### 5. Intelligence Tools
- **Image to Prompt**: Reverse-engineering vision tool. Uses Gemini Vision to describe an uploaded image in stable-diffusion-style prompt format.
- **Character Prompt Generator**: Helper tool to write dense descriptive paragraphs for character consistency.
- **Character Sheet Generator**: Automates the creation of multi-view reference sheets.

### 6. Image Editor
- **Purpose**: AI-powered image modification.
- **Functionality**: Upload a source image and provide natural language instructions (e.g., "Change background to a city", "Make the car red").

## 3. Architecture & Data Flow

### Entry Point & Routing
- **File**: `App.tsx`
- **Routing**: Internal state-based switcher (`currentView`).
- **Initialization**: On mount, calls `storageService.init()` to open IndexedDB and load data into React state.

### AI Unified Service Layer
- **Google Service** (`services/geminiService.ts`):
  - Direct connection to Google GenAI SDK.
  - Handles complex multipart requests (text + media).
- **Comet Service** (`services/cometService.ts`):
  - Proxy/Aggregator service for external models (Doubao, Flux).
  - Normalizes responses to match the app's `GenerationResult` interface.

### Storage Layer (IndexedDB)
- **File**: `services/storageService.ts`
- **Mechanism**: 
  - Uses browser native **IndexedDB** for high-capacity storage (Base64 images).
  - **Stores**: `influencers` (Profiles) and `gallery` (Generations).
  - **Migration**: Includes `StorageMigration.tsx` to port legacy `localStorage` data to IndexedDB.

### Data Models (`types.ts`)

#### Character DNA (The "Influencer")
```typescript
interface CharacterDNA {
  id: string;
  name: string;
  // The Visual Truth
  anchorHeadshot: string; // Base64 1:1
  anchorBody: string;     // Base64 9:16
  // The Semantic Truth
  blueprint: {
    identity: { gender, ethnicity, skin, eyes, hair, ... }; // Immutable
    style: { bodyType, clothing, ... }; // Mutable
  };
}
```

#### Gallery Item
```typescript
interface GalleryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  type: 'generation' | 'faceswap' | 'editing' | ...;
  timestamp: number;
}
```

## 5. Directory Structure

```
src/
├── components/           # UI Modules
│   ├── CanvasStudio.tsx      # Main Generator
│   ├── CharacterCreatorV2.tsx # DNA Builder
│   ├── ImageEditor.tsx       # AI Editor
│   ├── StorageMigration.tsx  # DB Utils
│   └── ... 
├── services/
│   ├── geminiService.ts  # Google GenAI Logic
│   ├── cometService.ts   # 3rd Party Model Logic
│   ├── storageService.ts # IndexedDB Wrapper
│   └── aiService.ts      # Shared Utilities
├── types.ts              # Global Interfaces
└── App.tsx               # Main Controller
```
