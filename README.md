# Character Canvas 🎨

Character Canvas is a professional-grade AI creative suite designed for artists and creators who need **character consistency** and powerful image generation workflows. Built with a modern React stack and powered by **Google Gemini 2.5 Flash**, it offers a seamless, client-side experience for creating, managing, and evolving digital identities.

---

## 🚀 Key Modules & Functionalities

### 1. **Dashboard** 🏠
The central nerve center of the application.
- **Identity Management**: View and manage your saved "Influencers" (Character DNA).
- **Creative Gallery**: A persistent archive of all your generations, face swaps, and prompt extractions.
- **Quick Links**: Fast access to all creative tools and settings.

### 2. **Canvas Studio** 🖌️
The primary playground for image generation.
- **Character Consistency**: Select a saved Influencer to "lock" their identity. The AI uses the character's reference image and attributes to ensure consistent features across generations.
- **Compositional References**: Upload a "Pose/Composition" image to guide the AI's layout.
- **Artistic Styles**: One-click selection of high-quality styles (Photorealistic, Anime, Cinematic, Cyberpunk, etc.).
- **Flexible Aspect Ratios**: Precision control over output dimensions (1:1, 16:9, 9:16, 4:5, 3:2).

### 3. **Character Creator V2** 🧬
Building a persistent digital soul.
- **Character DNA**: Upload a master reference image to establish the facial and physical identity.
- **Granular Attributes**: Define Gender, Age, Ethnicity, Body Type, and Hair Style.
- **3-Panel Interface**: A state-of-the-art layout for defining, refining, and previewing your character profiles.

### 4. **Face Swap (Character Transfer)** 🔄
Beyond Simple Deepfakes.
- **Identity Injection**: Take any scene or existing image and "generatively" swap the character with your saved Influencer.
- **Context Awareness**: Unlike pixel-based swappers, this process uses Gemini's generative power to maintain lighting, shadows, and artistic style while updating the identity.

### 5. **Intelligence Tools** 🧠
- **Image to Prompt**: Upload any image to reverse-engineer its visual style and subject into a high-density AI prompt.
- **Character Prompt Generator**: Automatically generates complex, high-quality prompt paragraphs based on your character's visual attributes.
- **Character Sheet Generator**: Instantly create a multi-view reference sheet for your character, perfect for concept art and consistency checks.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite.
- **Styling**: Tailwind CSS with a premium glassmorphic design system.
- **AI Core**: Google GenAI SDK
  - **Vision & Logic**: `gemini-2.5-flash`
  - **Image Generation**: `gemini-2.5-flash-image`
- **Persistence**: 
  - **IndexedDB**: Robust, high-capacity client-side storage for images and profiles.
  - **Migration Engine**: Automatic handling of legacy `localStorage` data into the new IndexedDB system.

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key ([Get one here](https://aistudio.google.com/))

### Installation
1. **Clone the repo:**
   ```bash
   git clone <repository-url>
   cd Image_Studio
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment:**
   Create a `.env` file in the root:
   ```env
   VITE_GEMINI_API_KEY=your_key_here
   ```
4. **Launch:**
   ```bash
   npm run dev
   ```

---

## 🎨 Creative Workflow
1. **Setup**: Add your API key in the **Settings Modal** (gear icon).
2. **Define**: Use the **Character Creator** to build your first "Influencer".
3. **Generate**: Go to **Canvas Studio**, select your character, and type a prompt.
4. **Refine**: Use **Face Swap** to move your character into new scenes or **Image to Prompt** to borrow styles from other artists.

---

## 🔐 Privacy & Data
Character Canvas is **fully client-side**. Your images, characters, and API keys are stored locally in your browser's IndexedDB. Your data never touches our servers—it's between you and your AI provider.
