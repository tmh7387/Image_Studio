

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { Influencer, GalleryItem } from '../types';
import { storageService } from '../services/storageService';
import { ImageLightbox } from './ImageLightbox';

interface DashboardProps {
  onNavigate: (view: string, config?: any) => void;
  influencers: Influencer[];
  onDeleteInfluencer?: (id: string | number) => void;
  gallery?: GalleryItem[];
  onDeleteFromGallery?: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  influencers,
  onDeleteInfluencer,
  gallery = [],
  onDeleteFromGallery
}) => {
  const [canvasPrompt, setCanvasPrompt] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleEdit = (influencer: Influencer) => {
    setOpenMenuId(null);
    onNavigate('create-character', { editMode: true, influencer });
  };

  const handleDelete = (id: string | number) => {
    setOpenMenuId(null);
    if (onDeleteInfluencer) {
      onDeleteInfluencer(id);
    }
  };

  // Export data
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const jsonData = await storageService.exportData();

      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-studio-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Import data
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await storageService.importData(text);
      alert(`Import successful!\n${result.influencers} characters and ${result.gallery} gallery items imported.`);
      window.location.reload(); // Reload to show imported data
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import data. Please check the file format.');
    } finally {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredGallery = filterType === 'all'
    ? gallery
    : gallery.filter(item => item.type === filterType);

  return (
    <div className="w-full max-w-[1600px] mx-auto animate-fade-in">
      {/* Section: Your AI Influencers */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-semibold text-white">Your AI Influencers</h2>
          <div className="flex items-center gap-3">
            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={isExporting || (influencers.length === 0 && gallery.length === 0)}
              className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Export all data as JSON backup"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {isExporting ? 'Exporting...' : 'Export'}
            </button>

            {/* Import Button */}
            <button
              onClick={handleImport}
              className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Import data from JSON backup"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Create Button */}
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate('create-character')}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Create AI Character
            </Button>
          </div>
        </div>

        {influencers.length === 0 ? (
          <div className="w-full py-16 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-slate-400 text-lg font-medium mb-2">No AI Characters yet</p>
            <p className="text-slate-500 text-sm mb-6 max-w-sm">Create your first custom AI influencer to start generating consistent images and content.</p>
            <Button onClick={() => onNavigate('create-character')}>Create Character</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {influencers.map((inf) => (
              <div key={inf.id} className="bg-[#1a1f2e] rounded-xl p-4 border border-slate-800/50 hover:border-indigo-500/30 transition-all shadow-lg relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg ${inf.imageColor || 'bg-slate-700'} flex items-center justify-center text-white font-bold shadow-inner overflow-hidden bg-cover bg-center`} >
                      {(() => {
                        // Support both new CharacterDNA structure and legacy Influencer structure
                        const thumbnailUrl = (inf as any).anchorHeadshot || inf.avatarUrl;
                        return thumbnailUrl ? (
                          <img src={thumbnailUrl} alt={inf.name} className="w-full h-full object-cover" />
                        ) : (
                          inf.name.substring(0, 1).toUpperCase()
                        );
                      })()}
                    </div>
                    <span className="font-medium text-lg text-slate-200">{inf.name}</span>
                  </div>

                  {/* Settings Gear Icon */}
                  <div className="relative">
                    <button
                      onClick={(e) => toggleMenu(e, inf.id)}
                      className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-700/50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuId === inf.id && (
                      <div ref={menuRef} className="absolute right-0 top-8 w-48 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 z-50 overflow-hidden animate-fade-in-up">
                        <button
                          onClick={() => handleEdit(inf)}
                          className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Edit Character
                        </button>
                        <button
                          onClick={() => handleDelete(inf.id)}
                          className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center transition-colors border-t border-slate-700"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Delete Character
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => onNavigate('face-swap', { influencerId: inf.id })}
                    className="w-full flex items-center justify-between p-3 bg-slate-800/50 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors text-sm hover:text-white group"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 opacity-70 group-hover:text-indigo-400 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Character Transfer
                    </div>
                    <span className="text-xs opacity-50">›</span>
                  </button>
                  <button
                    onClick={() => onNavigate('canvas-studio', { influencerId: inf.id })}
                    className="w-full flex items-center justify-between p-3 bg-slate-800/50 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors text-sm hover:text-white group"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 opacity-70 group-hover:text-indigo-400 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      AI Image Generator
                    </div>
                    <span className="text-xs opacity-50">›</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: AI Tools */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-6">AI Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Nano Banana Card */}
          <div className="col-span-1 bg-[#1a1f2e] rounded-xl overflow-hidden border border-slate-800 hover:border-yellow-500/50 transition-all group relative">
            <div className="absolute top-3 right-3 z-10">
              <span className="px-2 py-1 bg-yellow-400 text-black text-xs font-bold rounded">NEW</span>
            </div>
            <div className="h-48 bg-slate-800 relative overflow-hidden">
              {/* Placeholder Art */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                <div className="text-6xl">🎨</div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f2e] to-transparent opacity-90"></div>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="bg-slate-900/80 backdrop-blur rounded-lg p-1 flex items-center border border-slate-700">
                  <input
                    type="text"
                    placeholder="he crosses arms..."
                    className="bg-transparent border-none text-xs text-white w-full focus:outline-none px-2"
                    value={canvasPrompt}
                    onChange={(e) => setCanvasPrompt(e.target.value)}
                  />
                  <button
                    onClick={() => onNavigate('canvas-studio', { prompt: canvasPrompt })}
                    className="bg-indigo-600 text-xs text-white px-3 py-1 rounded hover:bg-indigo-500"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center mb-1">
                <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                <h3 className="font-semibold text-white">Canvas Studio</h3>
              </div>
            </div>
          </div>

          {/* Character Sheet */}
          <div onClick={() => onNavigate('character-sheet')} className="bg-[#1a1f2e] rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group">
            <div className="h-48 bg-slate-800 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-slate-900 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-2 opacity-30 group-hover:opacity-50 transition-opacity">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="w-8 h-8 bg-white rounded-sm"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                <h3 className="font-semibold text-white">Character Sheet</h3>
              </div>
            </div>
          </div>

          {/* Image to Prompt */}
          <div onClick={() => onNavigate('image-to-prompt')} className="bg-[#1a1f2e] rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group">
            <div className="h-48 bg-slate-800 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-900/40 to-orange-900/40 flex items-center justify-center">
                <svg className="w-16 h-16 text-white/20 group-hover:text-white/40 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                <h3 className="font-semibold text-white">Image to Prompt</h3>
              </div>
            </div>
          </div>

          {/* AI Image Editor */}
          <div onClick={() => onNavigate('image-editor')} className="bg-[#1a1f2e] rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group">
            <div className="h-48 bg-slate-800 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 flex items-center justify-center">
                <svg className="w-16 h-16 text-white/20 group-hover:text-white/40 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <h3 className="font-semibold text-white">AI Image Editor</h3>
              </div>
            </div>
          </div>

          {/* Character Prompt Generator */}
          <div onClick={() => onNavigate('character-prompt')} className="bg-[#1a1f2e] rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group">
            <div className="h-48 bg-slate-800 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-pink-900/40 flex items-center justify-center">
                <svg className="w-16 h-16 text-white/20 group-hover:text-white/40 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <h3 className="font-semibold text-white">Character Prompt</h3>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Section: Recent Creations (Gallery) */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Recent Creations</h2>
          <div className="flex space-x-2">
            {['all', 'generation', 'faceswap', 'editing', 'image-to-prompt', 'character-prompt'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${filterType === type
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredGallery.length === 0 ? (
          <div className="py-12 text-center text-slate-500 border border-dashed border-slate-700/50 rounded-xl bg-slate-900/30">
            <p>No creations found in gallery.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredGallery.map((item, index) => (
              <div
                key={item.id}
                className="group relative aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer"
                onClick={() => setLightboxIndex(index)}
              >
                {/* For text-only items like character-prompt that might lack a thumbnail, use a placeholder or image */}
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.type} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <span className="text-4xl">📝</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                    {item.type.replace('-', ' ')}
                  </span>
                  <p className="text-xs text-slate-300 line-clamp-2 mb-2">{item.prompt}</p>

                  <div className="flex items-center justify-between">
                    {item.imageUrl && (
                      <a
                        href={item.imageUrl}
                        download={`${item.type}-${item.id}.png`}
                        className="p-1.5 bg-slate-700 hover:bg-white hover:text-slate-900 rounded-md text-white transition-colors"
                        title="Download Image"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </a>
                    )}
                    <button
                      className="p-1.5 bg-slate-700 hover:bg-white hover:text-slate-900 rounded-md text-white transition-colors ml-1"
                      title="Copy Prompt"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(item.prompt);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                    {onDeleteFromGallery && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteFromGallery(item.id); }}
                        className="p-1.5 bg-red-900/60 hover:bg-red-600 rounded-md text-white transition-colors ml-auto"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Lightbox Modal */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={filteredGallery}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={onDeleteFromGallery}
        />
      )}
    </div>
  );
};
