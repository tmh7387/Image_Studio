
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { NanoBananaStudio } from './components/NanoBananaStudio';
import { CharacterCreator } from './components/CharacterCreator';
import { FaceSwap } from './components/FaceSwap';
import { ImageToPrompt } from './components/ImageToPrompt';
import { CharacterSheetGenerator } from './components/CharacterSheetGenerator';
import { ImageEditor } from './components/ImageEditor';
import { CharacterPromptGenerator } from './components/CharacterPromptGenerator';
import { Influencer, GalleryItem } from './types';

type View = 'dashboard' | 'nano-banana' | 'create-character' | 'face-swap' | 'image-to-prompt' | 'character-sheet' | 'image-editor' | 'character-prompt';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [studioPrompt, setStudioPrompt] = useState<string>('');
  const [studioInitialImage, setStudioInitialImage] = useState<string | null>(null);
  
  // State for influencers with LocalStorage
  const [influencers, setInfluencers] = useState<Influencer[]>(() => {
    try {
      const saved = localStorage.getItem('nanobanana_influencers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load influencers from storage", e);
      return [];
    }
  });

  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);

  // State for Gallery with LocalStorage
  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    try {
      const saved = localStorage.getItem('nanobanana_gallery');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load gallery from storage", e);
      return [];
    }
  });

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem('nanobanana_influencers', JSON.stringify(influencers));
    } catch (error) {
      console.error("Failed to save influencers to LocalStorage:", error);
      // Quota exceeded or other error - silently fail to prevent crash, but log it.
    }
  }, [influencers]);

  useEffect(() => {
    try {
      localStorage.setItem('nanobanana_gallery', JSON.stringify(gallery));
    } catch (error) {
      console.error("