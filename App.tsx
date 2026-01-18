
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { CanvasStudio } from './components/CanvasStudio';
import { CharacterCreatorV2 } from './components/CharacterCreatorV2';
import { FaceSwap } from './components/FaceSwap';
import { ImageToPrompt } from './components/ImageToPrompt';
import { CharacterSheetGenerator } from './components/CharacterSheetGenerator';
import { ImageEditor } from './components/ImageEditor';
import { CharacterPromptGenerator } from './components/CharacterPromptGenerator';
import { Influencer, GalleryItem } from './types';
import { SettingsModal } from './components/SettingsModal';
import { StorageMigration } from './components/StorageMigration';
import { storageService } from './services/storageService';

type View = 'dashboard' | 'canvas-studio' | 'create-character' | 'face-swap' | 'image-to-prompt' | 'character-sheet' | 'image-editor' | 'character-prompt';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation State transfer
  const [studioPrompt, setStudioPrompt] = useState<string>('');
  const [studioInitialImage, setStudioInitialImage] = useState<string | null>(null);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [activeInfluencerId, setActiveInfluencerId] = useState<string | number | undefined>(undefined);

  // State for Influencers and Gallery (now using IndexedDB)
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  // Initialize storage and load data
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Initialize IndexedDB
        await storageService.init();

        // Check if migration is needed
        if (storageService.needsMigration()) {
          setShowMigration(true);
          setIsLoading(false);
          return;
        }

        // Load data from IndexedDB
        await loadData();
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        alert('Failed to load storage. The app may not work correctly.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, []);

  // Load data from IndexedDB
  const loadData = async () => {
    try {
      const [loadedInfluencers, loadedGallery] = await Promise.all([
        storageService.getAllInfluencers(),
        storageService.getAllGalleryItems()
      ]);
      setInfluencers(loadedInfluencers);
      setGallery(loadedGallery);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };



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

  const handleCharacterCreated = async (newInfluencer: Influencer) => {
    try {
      await storageService.saveInfluencer(newInfluencer);
      // Reload  data to ensure consistency
      await loadData();
      setEditingInfluencer(null);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Failed to save character:', error);
      alert('Failed to save character. Please try again.');
    }
  };

  const handleDeleteInfluencer = async (id: string | number) => {
    if (window.confirm("Are you sure you want to delete this character? This cannot be undone.")) {
      try {
        await storageService.deleteInfluencer(id);
        await loadData();
      } catch (error) {
        console.error('Failed to delete character:', error);
        alert('Failed to delete character. Please try again.');
      }
    }
  };

  const handleAddToGallery = async (item: GalleryItem) => {
    try {
      await storageService.saveGalleryItem(item);
      await loadData();
    } catch (error) {
      console.error('Failed to save to gallery:', error);
      alert('Failed to save to gallery. Storage may be full.');
    }
  };

  const handleDeleteFromGallery = async (id: string) => {
    if (window.confirm("Delete this creation?")) {
      try {
        await storageService.deleteGalleryItem(id);
        await loadData();
      } catch (error) {
        console.error('Failed to delete from gallery:', error);
        alert('Failed to delete. Please try again.');
      }
    }
  };

  // Helper to find the active influencer object
  const activeInfluencer = influencers.find(inf => inf.id === activeInfluencerId) || null;

  // Handle migration completion
  const handleMigrationComplete = async () => {
    setShowMigration(false);
    await loadData();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show migration modal if needed
  if (showMigration) {
    return <StorageMigration onComplete={handleMigrationComplete} />;
  }

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
          <CharacterCreatorV2
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
