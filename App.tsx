
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { CanvasStudio } from './components/CanvasStudio';
import { CharacterCreator } from './components/CharacterCreator';
import { FaceSwap } from './components/FaceSwap';
import { ImageToPrompt } from './components/ImageToPrompt';
import { CharacterSheetGenerator } from './components/CharacterSheetGenerator';
import { ImageEditor } from './components/ImageEditor';
import { CharacterPromptGenerator } from './components/CharacterPromptGenerator';
import { Influencer, GalleryItem } from './types';
import { SettingsModal } from './components/SettingsModal';

type View = 'dashboard' | 'canvas-studio' | 'create-character' | 'face-swap' | 'image-to-prompt' | 'character-sheet' | 'image-editor' | 'character-prompt';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showSettings, setShowSettings] = useState(false);

  // Navigation State transfer
  const [studioPrompt, setStudioPrompt] = useState<string>('');
  const [studioInitialImage, setStudioInitialImage] = useState<string | null>(null);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [activeInfluencerId, setActiveInfluencerId] = useState<string | number | undefined>(undefined);

  // --- State for Influencers with LocalStorage ---
  const [influencers, setInfluencers] = useState<Influencer[]>(() => {
    try {
      const saved = localStorage.getItem('nanobanana_influencers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load influencers from storage", e);
      return [];
    }
  });

  // --- State for Gallery with LocalStorage ---
  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    try {
      const saved = localStorage.getItem('nanobanana_gallery');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load gallery from storage", e);
      return [];
    }
  });

  // --- Persistence Effects ---
  useEffect(() => {
    try {
      localStorage.setItem('nanobanana_influencers', JSON.stringify(influencers));
    } catch (error) {
      console.error("Failed to save influencers (Quota Exceeded?):", error);
    }
  }, [influencers]);

  useEffect(() => {
    try {
      localStorage.setItem('nanobanana_gallery', JSON.stringify(gallery));
    } catch (error) {
      console.error("Failed to save gallery (Quota Exceeded?):", error);
    }
  }, [gallery]);

  // --- Handlers ---

  const handleNavigate = (view: string, config?: any) => {
    // Reset transient state when navigating
    if (view === 'dashboard') {
      setStudioPrompt('');
      setStudioInitialImage(null);
      setEditingInfluencer(null);
      setActiveInfluencerId(undefined);
    }

    // Handle specific config transfers
    if (config) {
      if (config.prompt) setStudioPrompt(config.prompt);
      if (config.initialBase64Image) setStudioInitialImage(config.initialBase64Image);
      if (config.editMode && config.influencer) setEditingInfluencer(config.influencer);
      if (config.influencerId) setActiveInfluencerId(config.influencerId);
    }

    setCurrentView(view as View);
  };

  const handleCharacterCreated = (newInfluencer: Influencer) => {
    setInfluencers(prev => {
      const exists = prev.findIndex(inf => inf.id === newInfluencer.id);
      if (exists !== -1) {
        // Update existing
        const updated = [...prev];
        updated[exists] = newInfluencer;
        return updated;
      }
      // Add new
      return [...prev, newInfluencer];
    });
    setEditingInfluencer(null); // Clear edit mode
    setCurrentView('dashboard');
  };

  const handleDeleteInfluencer = (id: string | number) => {
    if (window.confirm("Are you sure you want to delete this character? This cannot be undone.")) {
      setInfluencers(prev => prev.filter(inf => inf.id !== id));
      // Optionally clean up gallery items associated? We'll keep them for now.
    }
  };

  const handleAddToGallery = (item: GalleryItem) => {
    setGallery(prev => [item, ...prev]);
  };

  const handleDeleteFromGallery = (id: string) => {
    if (window.confirm("Delete this creation?")) {
      setGallery(prev => prev.filter(item => item.id !== id));
    }
  };

  // Helper to find the active influencer object
  const activeInfluencer = influencers.find(inf => inf.id === activeInfluencerId) || null;

  // --- Render Logic ---

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={handleNavigate}
            influencers={influencers}
            onDeleteInfluencer={handleDeleteInfluencer}
            gallery={gallery}
            onDeleteFromGallery={handleDeleteFromGallery}
          />
        );

      case 'create-character':
        return (
          <CharacterCreator
            onBack={() => setCurrentView('dashboard')}
            onCharacterCreated={handleCharacterCreated}
            initialData={editingInfluencer || undefined}
          />
        );

      case 'canvas-studio':
        return (
          <CanvasStudio
            onBack={() => setCurrentView('dashboard')}
            initialPrompt={studioPrompt}
            initialBase64Image={studioInitialImage}
            activeInfluencer={activeInfluencer}
            gallery={gallery}
            onAddToGallery={handleAddToGallery}
            onDeleteFromGallery={handleDeleteFromGallery}
          />
        );

      case 'face-swap':
        return (
          <FaceSwap
            onBack={() => setCurrentView('dashboard')}
            influencers={influencers}
            initialInfluencer={activeInfluencer}
            gallery={gallery}
            onAddToGallery={handleAddToGallery}
            onDeleteFromGallery={handleDeleteFromGallery}
          />
        );

      case 'image-to-prompt':
        return (
          <ImageToPrompt
            onBack={() => setCurrentView('dashboard')}
            onUsePrompt={(prompt) => {
              setStudioPrompt(prompt);
              setCurrentView('canvas-studio');
            }}
            onAddToGallery={handleAddToGallery}
          />
        );

      case 'character-sheet':
        return (
          <CharacterSheetGenerator
            onBack={() => setCurrentView('dashboard')}
            influencers={influencers}
            onAddToGallery={handleAddToGallery}
            onNavigate={handleNavigate}
          />
        );

      case 'image-editor':
        return (
          <ImageEditor
            onBack={() => setCurrentView('dashboard')}
            onAddToGallery={handleAddToGallery}
          />
        );

      case 'character-prompt':
        return (
          <CharacterPromptGenerator
            onBack={() => setCurrentView('dashboard')}
            onAddToGallery={handleAddToGallery}
          />
        );

      default:
        return <div>View Not Found</div>;
    }
  };

  return (
    <div className="min-h-screen pb-10">
      <header className="px-6 py-4 bg-slate-900/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="text-3xl">🎨</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Character Canvas
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800/50 rounded-lg hover:bg-slate-700"
              title="API Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* User profile placeholder */}
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white border border-indigo-400">
              JS
            </div>
          </div>
        </div>
      </header>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <main className="p-6">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
