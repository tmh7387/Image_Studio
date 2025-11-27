import React, { useState, useRef, MouseEvent } from 'react';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { Influencer, GalleryItem, ArtStyle, AspectRatio } from '../types';
import { generateContent } from '../services/geminiService';

interface CharacterSheetGeneratorProps {
  influencers: Influencer[];
  onBack: () => void;
  onAddToGallery: (item: GalleryItem) => void;
  onNavigate: (view: string, config?: any) => void;
}

export const CharacterSheetGenerator: React.FC<CharacterSheetGeneratorProps> = ({ 
  influencers, 
  onBack,
  onAddToGallery,
  onNavigate
}) => {
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | number>('');
  const [outfitDescription, setOutfitDescription] = useState('');
  const [style, setStyle] = useState<string>(ArtStyle.PHOTOREALISTIC);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cropping State
  const [selection, setSelection] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedInfluencer = influencers.find(i => i.id === selectedInfluencerId);

  const handleGenerate = async () => {
    if (!selectedInfluencer) {
      setError("Please select an AI Character.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setGeneratedImage(null);
    setSelection(null);

    // Construct Character Context
    const attrs = [];
    if (selectedInfluencer.gender) attrs.push(`Gender: ${selectedInfluencer.gender}`);
    if (selectedInfluencer.age) attrs.push(`Age: ${selectedInfluencer.age}`);
    if (selectedInfluencer.ethnicity) attrs.push(`Ethnicity: ${selectedInfluencer.ethnicity}`);
    if (selectedInfluencer.bodyType) attrs.push(`Body: ${selectedInfluencer.bodyType}`);
    if (selectedInfluencer.height) attrs.push(`Height: ${selectedInfluencer.height}`);
    if (selectedInfluencer.complexion) attrs.push(`Complexion: ${selectedInfluencer.complexion}`);
    if (selectedInfluencer.distinguishingFeatures && selectedInfluencer.distinguishingFeatures !== 'None') {
      attrs.push(`Features: ${selectedInfluencer.distinguishingFeatures}`);
    }
    
    const charProfile = `Character Name: ${selectedInfluencer.name}. Physical Attributes: [${attrs.join(', ')}]. ${selectedInfluencer.description || ''}`;

    const sheetPrompt = `
      Create a professional detailed CHARACTER REFERENCE SHEET (Model Sheet) for the following character.
      
      CHARACTER DETAILS:
      ${charProfile}
      
      OUTFIT / SETTING:
      ${outfitDescription || 'Casual everyday clothing suitable for the character.'}
      
      LAYOUT REQUIREMENTS:
      - Generate exactly 12 distinct poses arranged in a grid layout (e.g., 4x3 or 6x2).
      - Include a mix of: Front view, Side view, Back view, 3/4 view, Action poses, Sitting poses, and Close-up facial expressions.
      - BACKGROUND: Solid neutral white or light grey background (Clean Studio Lighting).
      - STYLE: ${style}. High resolution, consistent proportions, consistent clothing across all poses.
      - The image should look like a cohesive production asset for animation or game design.
    `;

    try {
      const result = await generateContent({
        prompt: sheetPrompt,
        style: style as ArtStyle,
        aspectRatio: AspectRatio.WIDE_16_9, 
        characterReferenceImage: selectedInfluencer.avatarUrl,
        characterStrength: 'high'
      });

      if (result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        onAddToGallery({
          id: Date.now().toString(),
          imageUrl: result.imageUrl,
          prompt: sheetPrompt,
          type: 'generation',
          timestamp: Date.now(),
          influencerId: selectedInfluencer.id
        });
      } else {
        setError("Failed to generate character sheet.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Selection Handlers
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!generatedImage || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setIsSelecting(true);
    setSelection({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || !startPos || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = Math.abs(currentX - startPos.x);
    const height = Math.abs(currentY - startPos.y);
    const x = Math.min(currentX, startPos.x);
    const y = Math.min(currentY, startPos.y);

    setSelection({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  const handleCropAndUpscale = () => {
    if (!imageRef.current || !selection || selection.width < 10 || selection.height < 10) return;

    const img = imageRef.current;
    
    // The image displayed on screen might be scaled down (contain).
    // We need to map the visual selection (selection state) to the intrinsic image dimensions.
    
    // Get actual displayed dimensions of the image element
    const rect = img.getBoundingClientRect();
    // Container might be larger than image due to object-contain centering
    // Actually, relying on mouse coordinates relative to container vs image is tricky with object-contain.
    // Simpler approach: Assume user clicks on the image itself? 
    // To be robust: We used a container. But let's assume the selection box is relative to the container.
    // We need to know where the image is inside the container.
    
    // For this implementation, let's assume the container fits the image perfectly or we calculate offsets.
    // A standard trick: use naturalWidth / clientWidth ratio.
    
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    
    // However, if object-fit is contain, there are empty bars.
    // Let's rely on the image element's position relative to the container if possible.
    // But getting `img.width` (displayed width) vs `rect.width` is reliable.
    // The issue is centering.
    
    // SIMPLIFIED UI FIX: We make the image 'cover' or force the container to match aspect ratio?
    // Better: We calculate the 'rendered' dimensions and offset.
    
    // Calculate aspect ratios
    const naturalRatio = img.naturalWidth / img.naturalHeight;
    const displayedRatio = img.width / img.height; // This is the element size, not necessarily rendered pixels if contain
    
    // Actually, `img.width` IS the rendered width in layout, but the pixels might be empty?
    // No, img tag size matches layout. 
    // Let's assume the user selects relative to the *visible* image.
    // To ensure this works simply, we'll put the event listeners ON THE IMG tag itself via a wrapper that matches size.
    
    // Implementation: Draw to canvas
    const canvas = document.createElement('canvas');
    canvas.width = selection.width * scaleX;
    canvas.height = selection.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      img, 
      selection.x * scaleX, 
      selection.y * scaleY, 
      selection.width * scaleX, 
      selection.height * scaleY,
      0, 0,
      canvas.width, canvas.height
    );

    const croppedBase64 = canvas.toDataURL('image/png');
    
    // Navigate to Studio
    onNavigate('nano-banana', {
       initialBase64Image: croppedBase64,
       prompt: `High-resolution detailed render of this character pose. ${selectedInfluencer?.name || 'Character'}. ${outfitDescription}. Highly detailed face and clothing. Upscale and refine details.`,
       influencerId: selectedInfluencer?.id
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in pb-20">
      <div className="mb-6 flex items-center">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-white">Character Sheet Generator</h2>
          <p className="text-slate-400 mt-1">Create a 12-pose reference grid for your AI character.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Configuration Panel */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-6">Sheet Settings</h3>
            
            <div className="space-y-6">
              {/* Character Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Character</label>
                {influencers.length === 0 ? (
                  <div className="text-slate-500 text-sm italic">No characters created yet.</div>
                ) : (
                  <div className="relative">
                    <select 
                      value={selectedInfluencerId} 
                      onChange={(e) => setSelectedInfluencerId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">Choose a character...</option>
                      {influencers.map(inf => (
                        <option key={inf.id} value={inf.id}>{inf.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {selectedInfluencer && (
                   <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-xl flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                        {selectedInfluencer.avatarUrl ? (
                          <img src={selectedInfluencer.avatarUrl} alt={selectedInfluencer.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold">{selectedInfluencer.name[0]}</div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{selectedInfluencer.name}</p>
                        <p className="text-xs text-indigo-300">Reference Ready</p>
                      </div>
                   </div>
                )}
              </div>

              {/* Outfit Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Outfit & Setting Details</label>
                <textarea 
                  value={outfitDescription}
                  onChange={(e) => setOutfitDescription(e.target.value)}
                  placeholder="e.g. Tactical cyberpunk armor, neon accents. Or: Summer floral dress with a sun hat."
                  className="w-full h-32 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none placeholder-slate-500 text-sm"
                />
              </div>

              {/* Style */}
              <Dropdown 
                label="Art Style"
                value={style}
                options={Object.values(ArtStyle)}
                onChange={setStyle}
              />

              <Button 
                className="w-full" 
                onClick={handleGenerate} 
                disabled={isProcessing || !selectedInfluencerId}
                isLoading={isProcessing}
              >
                {isProcessing ? "Generating Sheet..." : "Generate Character Sheet"}
              </Button>

              {selection && selection.width > 20 && (
                <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
                   <p className="text-xs text-emerald-400 mb-2 font-semibold tracking-wide uppercase">Area Selected</p>
                   <Button 
                     variant="glass" 
                     className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-500/30"
                     onClick={handleCropAndUpscale}
                   >
                     Upscale Selected Pose
                   </Button>
                   <p className="text-xs text-slate-400 mt-2">
                     Click to upscale this specific pose in the Studio.
                   </p>
                </div>
              )}

              {error && (
                <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-500/20">
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Output Panel */}
        <section className="lg:col-span-8">
           <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Generated Sheet</h3>
                {generatedImage ? (
                  <div className="flex items-center space-x-4">
                     <span className="text-sm text-indigo-300 animate-pulse">Drag to select a pose to upscale</span>
                     <a 
                       href={generatedImage} 
                       download={`character-sheet-${selectedInfluencer?.name || 'ai'}.png`}
                       className="text-sm text-slate-400 hover:text-white transition-colors"
                     >
                       Download
                     </a>
                  </div>
                ) : null}
              </div>

              <div 
                 className="flex-1 bg-slate-900/40 rounded-xl border border-dashed border-slate-700/50 relative flex items-center justify-center group select-none"
                 style={{ minHeight: '500px' }}
              >
                 {!generatedImage && !isProcessing && (
                    <div className="text-center text-slate-500 p-8">
                       <div className="grid grid-cols-3 gap-2 w-32 h-24 mx-auto mb-4 opacity-30">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-slate-600 rounded-sm"></div>
                          ))}
                       </div>
                       <p>Select a character to generate a pose grid.</p>
                    </div>
                 )}

                 {isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm z-10">
                       <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                       <p className="text-indigo-300 animate-pulse">Rendering 12 poses...</p>
                    </div>
                 )}

                 {/* Interactive Container */}
                 {generatedImage && (
                    <div 
                      ref={containerRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className="relative inline-block cursor-crosshair max-w-full max-h-[800px]"
                    >
                       <img 
                          ref={imageRef}
                          src={generatedImage} 
                          alt="Character Sheet" 
                          draggable={false}
                          className="max-w-full max-h-[800px] block object-contain" 
                       />
                       
                       {/* Selection Overlay */}
                       {selection && (
                         <div 
                           className="absolute border-2 border-emerald-500 bg-emerald-500/20 pointer-events-none"
                           style={{
                             left: selection.x,
                             top: selection.y,
                             width: selection.width,
                             height: selection.height
                           }}
                         ></div>
                       )}
                    </div>
                 )}
              </div>
           </div>
        </section>

      </div>
    </div>
  );
};