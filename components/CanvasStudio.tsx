import React, { useState, useEffect } from 'react';
import { ArtStyle, AspectRatio, GenerationConfig, Influencer, GalleryItem, AIProvider, AIModel } from '../types';
import { generateContent } from '../services/aiService';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { ImageUploader } from './ImageUploader';
import { ImageLightbox } from './ImageLightbox';
import { constructGenerationPayload } from '../utils/promptEngine';

interface CanvasStudioProps {
  initialPrompt?: string;
  initialBase64Image?: string | null;
  onBack: () => void;
  activeInfluencer?: Influencer | null;
  influencers?: Influencer[];
  gallery?: GalleryItem[];
  onAddToGallery?: (item: GalleryItem) => void;
  onDeleteFromGallery?: (id: string) => void;
}

export const CanvasStudio: React.FC<CanvasStudioProps> = ({
  initialPrompt = '',
  initialBase64Image = null,
  onBack,
  activeInfluencer,
  influencers = [],
  gallery = [],
  onAddToGallery,
  onDeleteFromGallery
}) => {
  const [prompt, setPrompt] = useState<string>(initialPrompt);
  const [style, setStyle] = useState<string>(ArtStyle.NO_STYLE);
  const [aspectRatio, setAspectRatio] = useState<string>(AspectRatio.SQUARE);

  // Character Selection State
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | number>('');
  const [selectedCharacter, setSelectedCharacter] = useState<Influencer | null>(
    activeInfluencer || null
  );

  // AI Provider & Model Selection
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(
    (localStorage.getItem('ai_provider') as AIProvider) || AIProvider.GOOGLE
  );
  const [selectedModel, setSelectedModel] = useState<AIModel>(
    selectedProvider === AIProvider.GOOGLE
      ? AIModel.GEMINI_2_5_FLASH_IMAGE
      : AIModel.DOUBAO_SEEDREAM
  );

  // Provider change handler
  const handleProviderChange = (provider: AIProvider) => {
    setSelectedProvider(provider);
    if (provider === AIProvider.GOOGLE) {
      setSelectedModel(AIModel.GEMINI_2_5_FLASH_IMAGE);
    } else {
      setSelectedModel(AIModel.DOUBAO_SEEDREAM);
    }
  };

  // Character selection handler
  const handleCharacterSelect = (id: string | number) => {
    setSelectedCharacterId(id);
    const character = influencers?.find(i => i.id === id) || null;
    setSelectedCharacter(character);
  };

  // Image handling
  const [refImageBase64, setRefImageBase64] = useState<string | null>(initialBase64Image);
  const [refImageMimeType, setRefImageMimeType] = useState<string | null>(initialBase64Image ? 'image/png' : null);

  // Output State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Gallery Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    if (initialBase64Image) {
      setRefImageBase64(initialBase64Image);
      // Assume PNG for crops, or simple detection
      if (initialBase64Image.startsWith('data:image/jpeg')) {
        setRefImageMimeType('image/jpeg');
      } else {
        setRefImageMimeType('image/png');
      }
    }
  }, [initialBase64Image]);

  const handleGenerate = async () => {
    const rawPrompt = prompt.trim();
    if (!rawPrompt) {
      setError("Please enter a description.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedText(null);

    // Prompt construction - use selected character OR the one passed via activeInfluencer
    let finalPrompt = rawPrompt;
    const effectiveCharacter = selectedCharacter || activeInfluencer;

    // Prioritize anchor images
    let characterReferenceImage = effectiveCharacter?.anchorHeadshot ||
      effectiveCharacter?.anchorBody ||
      effectiveCharacter?.avatarUrl;

    if (effectiveCharacter) {
      // Convert Influencer to CharacterDNA structure for the engine
      const dnaStub: any = {
        name: effectiveCharacter.name,
        anchorImage: characterReferenceImage || '',
        bio: {
          ageRange: effectiveCharacter.age || "Unknown Age",
          gender: effectiveCharacter.gender || "Unknown Gender",
          ethnicity: effectiveCharacter.ethnicity || "Unknown Ethnicity",
          bodySomatotype: effectiveCharacter.bodyType || "Average",
          facialFeatures: effectiveCharacter.distinguishingFeatures ? [effectiveCharacter.distinguishingFeatures] : []
        },
        stylePreferences: {
          clothingStyle: effectiveCharacter.characterStyle ? [effectiveCharacter.characterStyle] : []
        }
      };

      const payload = constructGenerationPayload(dnaStub, rawPrompt);
      finalPrompt = payload.textPrompt;
      characterReferenceImage = payload.referenceImage || characterReferenceImage;
    }

    try {
      const config: GenerationConfig = {
        prompt: finalPrompt,
        style: style as ArtStyle,
        aspectRatio: aspectRatio as AspectRatio,
        base64Image: refImageBase64 || undefined,
        mimeType: refImageMimeType || undefined,
        characterReferenceImage: characterReferenceImage || undefined,
        provider: selectedProvider,
        model: selectedModel
      };

      const result = await generateContent(config);

      if (result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        if (onAddToGallery) {
          onAddToGallery({
            id: Date.now().toString(),
            imageUrl: result.imageUrl,
            prompt: finalPrompt,
            type: 'generation',
            timestamp: Date.now(),
            influencerId: activeInfluencer?.id
          });
        }
      } else if (result.text) {
        setGeneratedText(result.text);
      } else {
        setError("The model generated a response but no image was found.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (base64: string, mimeType: string) => {
    setRefImageBase64(base64);
    setRefImageMimeType(mimeType);
  };

  const handleImageRemove = () => {
    setRefImageBase64(null);
    setRefImageMimeType(null);
  };

  const relevantGallery = gallery.filter(item => {
    if (activeInfluencer) return item.influencerId === activeInfluencer.id && item.type === 'generation';
    return item.type === 'generation' && !item.influencerId;
  });

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in pb-20">
      {/* Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>

        {activeInfluencer && (
          <div className="flex items-center px-4 py-2 bg-indigo-900/30 border border-indigo-500/30 rounded-full">
            <div className="w-6 h-6 rounded-full overflow-hidden mr-3 border border-indigo-400">
              {activeInfluencer.avatarUrl ? (
                <img src={activeInfluencer.avatarUrl} alt={activeInfluencer.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-indigo-500"></div>
              )}
            </div>
            <span className="text-sm font-medium text-indigo-200">
              Creating as <span className="text-white font-bold">{activeInfluencer.name}</span>
              <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20">Identity Locked</span>
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

        {/* Left Panel: Controls */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
                Studio Configuration
              </h2>
              <span className="text-2xl">🎨</span>
            </div>

            <div className="space-y-5">
              {/* Character Selector */}
              {influencers && influencers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Character Reference (Optional)
                  </label>
                  <select
                    value={selectedCharacterId}
                    onChange={(e) => handleCharacterSelect(e.target.value || '')}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">No Character</option>
                    {influencers.map(inf => (
                      <option key={inf.id} value={inf.id}>{inf.name}</option>
                    ))}
                  </select>

                  {selectedCharacter && (
                    <div className="mt-3 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-xl flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                        {((selectedCharacter as any).anchorHeadshot || selectedCharacter.avatarUrl) ? (
                          <img
                            src={(selectedCharacter as any).anchorHeadshot || selectedCharacter.avatarUrl}
                            alt={selectedCharacter.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold">
                            {selectedCharacter.name[0]}
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{selectedCharacter.name}</p>
                        <p className="text-xs text-indigo-300">Reference Active</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">
                  {refImageBase64 ? "Editing Instructions" : "Image Description"}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    activeInfluencer
                      ? `Describe what ${activeInfluencer.name} is doing...`
                      : "A futuristic city in the clouds..."
                  }
                  className="w-full h-40 px-4 py-3 bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none text-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* AI Provider Selection */}
                <Dropdown
                  label="AI Provider"
                  value={selectedProvider}
                  options={Object.values(AIProvider)}
                  onChange={(val) => handleProviderChange(val as AIProvider)}
                />

                {/* Image Model Selection */}
                <Dropdown
                  label="Image Model"
                  value={selectedModel}
                  options={
                    selectedProvider === AIProvider.GOOGLE
                      ? [AIModel.GEMINI_2_5_FLASH_IMAGE]
                      : [AIModel.DOUBAO_SEEDREAM, AIModel.FLUX_1_PRO]
                  }
                  onChange={(val) => setSelectedModel(val as AIModel)}
                />

                <Dropdown
                  label="Artistic Style"
                  value={style}
                  options={Object.values(ArtStyle)}
                  onChange={setStyle}
                />

                <Dropdown
                  label="Aspect Ratio"
                  value={aspectRatio}
                  options={Object.values(AspectRatio)}
                  onChange={setAspectRatio}
                />
              </div>

              <ImageUploader
                selectedImage={refImageBase64}
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
              />

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {error}
                </div>
              )}

              <Button
                onClick={handleGenerate}
                isLoading={isLoading}
                className="w-full"
                variant="primary"
                size="lg"
              >
                {isLoading ? "Generating..." : "Generate Image"}
              </Button>
            </div>
          </div>
        </section>

        {/* Right Panel: Output */}
        <section className="lg:col-span-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl min-h-[800px] flex flex-col h-full">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-1 h-6 bg-emerald-500 rounded-full mr-3"></span>
                Result
              </div>
              {generatedImage && (
                <a
                  href={generatedImage}
                  download={`canvas-studio-${Date.now()}.png`}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center"
                >
                  Download
                </a>
              )}
            </h2>

            <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/40 rounded-xl border border-dashed border-slate-700/50 relative overflow-hidden group min-h-[700px]">
              {!isLoading && !generatedImage && !generatedText && (
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-lg font-light">Your masterpiece will appear here</p>
                </div>
              )}

              {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                  <div className="relative w-28 h-28">
                    <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-r-4 border-purple-500 rounded-full animate-spin animation-delay-200"></div>
                    <div className="absolute inset-4 border-b-4 border-pink-500 rounded-full animate-spin animation-delay-500"></div>
                  </div>
                  <p className="mt-8 text-indigo-300 font-medium text-lg animate-pulse">
                    {activeInfluencer ? `Applying ${activeInfluencer.name}'s features...` : "Dreaming up pixels..."}
                  </p>
                </div>
              )}

              {generatedImage && !isLoading && (
                <img
                  src={generatedImage}
                  alt="Generated Art"
                  className="w-full h-full object-contain p-2"
                />
              )}

              {generatedText && !generatedImage && !isLoading && (
                <div className="p-8 text-slate-300 text-center max-w-2xl">
                  <p className="mb-3 text-yellow-500 font-semibold text-lg">Message from Model:</p>
                  <p className="text-lg leading-relaxed">{generatedText}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {relevantGallery.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Gallery</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {relevantGallery.map((item, index) => (
              <div
                key={item.id}
                className="relative aspect-square group rounded-lg overflow-hidden bg-slate-900 border border-slate-700 hover:border-indigo-500/50 transition-all cursor-pointer"
                onClick={() => setLightboxIndex(index)}
              >
                <img src={item.imageUrl} alt="Gallery item" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                    {item.type.replace('-', ' ')}
                  </span>
                  <p className="text-xs text-slate-300 line-clamp-2 mb-2">{item.prompt}</p>

                  <div className="flex gap-2">
                    <a
                      href={item.imageUrl}
                      download={`canvas-${item.id}.png`}
                      className="p-1.5 bg-slate-700 hover:bg-white hover:text-slate-900 rounded-md text-white transition-colors"
                      title="Download Image"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    {onDeleteFromGallery && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteFromGallery(item.id); }}
                        className="p-1.5 bg-red-900/60 hover:bg-red-600 rounded-md text-white transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={relevantGallery}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={onDeleteFromGallery}
        />
      )}
    </div>
  );
};