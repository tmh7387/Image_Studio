# Character Canvas 🎨

ImCharacter Canvas is a powerful AI-powered creative suite built with React, Vite, and Google's Gemini models. It allows users to generate images, create consistent characters (influencers), perform face swaps, and more, all within a modern, responsive interface.

## Features

*   **Dashboard**: Central hub to manage your creations and characters.
*   **Canvas Studio**: Advanced image generation using `gemini-2.5-flash-image`. Supports various art styles and aspect ratios.
*   **Character Creator**: Define and save custom "Influencers" with specific physical attributes and styles to ensure consistency across generations.
*   **Character Transfer**: Generatively insert your saved character identities into new scenes or poses.
*   **Image to Prompt**: Reverse engineer prompts from existing images to understand how to recreate styles.
*   **Character Sheet Generator**: Create consistent character reference sheets.
*   **Image Editor**: (Feature in progress) Edit generated images.
*   **Character Prompt Generator**: Generate detailed text prompts based on visual references and attributes.

## Tech Stack

*   **Frontend**: React 19, Vite, TypeScript
*   **Styling**: Tailwind CSS
*   **AI**: Google GenAI SDK (`@google/genai`)
    *   Image Generation: `gemini-2.5-flash-image`
    *   Text/Prompt Generation: `gemini-2.5-flash`
*   **Persistence**: LocalStorage (Current)

## Getting Started

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm or yarn
*   A Google Gemini API Key

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd nanobanana-studio
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment Variables:
    *   Create a `.env` file in the root directory.
    *   Add your Gemini API key:
        ```env
        VITE_GEMINI_API_KEY=your_api_key_here
        ```
    *   *Note: The current codebase might check `process.env.API_KEY` or similar. Ensure the service file `services/geminiService.ts` is using the correct environment variable format for Vite (`import.meta.env.VITE_...` or configured via `define` in vite config).*

4.  Run the development server:
    ```bash
    npm run dev
    ```

5.  Open your browser and navigate to `http://localhost:5173` (or the port shown in the terminal).

## Usage

1.  **Create a Character**: Go to "Create Character" to define your influencer's look.
2.  **Generate Images**: Use the "NanoBanana Studio" to generate images. You can select your created character to maintain consistency.
3.  **Character Transfer**: Upload a reference scene and select a character to transfer their identity while maintaining the scene's composition.
4.  **Gallery**: Your creations are saved locally to your browser's LocalStorage.

## Project Structure

*   `src/components`: React components for each feature (Dashboard, Studio, etc.).
*   `src/services`: API integration logic (Gemini service).
*   `src/types.ts`: TypeScript definitions for data models.
*   `App.tsx`: Main application routing and state management.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
