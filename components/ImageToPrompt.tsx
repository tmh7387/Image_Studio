import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { describeImage } from '../services/geminiService';
import { GalleryItem } from '../types';

interface ImageToPromptProps {
  onBack: () => void;
  onUsePrompt: (prompt: string) => void;
  onAddToGallery?: (item: GalleryItem) => void;
}

interface GeneratedPrompt {
  id: string;
  imageUrl: string;
  text: string;
}

export const ImageToPrompt: React.FC<ImageToPromptProps> = ({ onBack, onUsePrompt, onAddToGallery }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !mimeType) return;

    setIsProcessing(true);
    try {
      const promptText = await describeImage(selectedImage, mimeType);
      
      const newItem = {
        id: Date.now().toString(),
        imageUrl: selectedImage,
        text: promptText
      };

      setGeneratedPrompts(prev => [newItem, ...prev]);

      // Save to global gallery
      if (onAddToGallery) {
        onAddToGallery({
          id: newItem.id,
          imageUrl: selectedImage,
          prompt: promptText,
          type: 'image-to-prompt',
          timestamp: Date.now()
        });
      }

    } catch (error) {
      console.error("Failed to generate prompt:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto animate-fade-in pb-20">
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
          <h2 className="text-2xl font-semibold text-white">Image to Prompt</h2>
          <p className="text-slate-400 mt-1">Extract detailed prompts from your reference images.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Results List */}
        <section className="lg:col-span-8 space-y-6 order-2 lg:order-1">
           {generatedPrompts.length === 0 ? (
             <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center h-[500px]">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                   <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No prompts generated yet</h3>
                <p className="text-slate-400 max-w-md">
                  Upload an image on the right to start generating detailed descriptions and prompts.
                </p>
             </div>
           ) : (
             <div className="space-y-6">
                {generatedPrompts.map((item) => (
                  <div key={item.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row gap-6 animate-fade-in">
                     <div className="w-full md:w-48 h-48 flex-shrink-0 bg-black/40 rounded-xl overflow-hidden border border-slate-700/50">
                        <img src={item.imageUrl} alt="Source" className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                           <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Generated Prompt</span>
                           <div className="flex space-x-2">
                             <button 
                               onClick={() => copyToClipboard(item.text)}
                               className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                               title="Copy to clipboard"
                             >
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                             </button>
                           </div>
                        </div>
                        <div className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-slate-800 text-slate-300 text-sm leading-relaxed overflow-y-auto max-h-[150px] mb-4">
                           {item.text}
                        </div>
                        <div className="flex justify-end">
                           <Button 
                             size="sm" 
                             variant="glass"
                             onClick={() => onUsePrompt(item.text)}
                             icon={
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                             }
                           >
                             Use Prompt
                           </Button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </section>

        {/* Right Column: Upload */}
        <section className="lg:col-span-4 order-1 lg:order-2">
           <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">Add Source Image</h3>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square border-2 border-dashed border-slate-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-800/30 transition-all group mb-6 relative overflow-hidden"
              >
                {selectedImage ? (
                   <>
                     <img src={selectedImage} alt="Selected" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" />
                     <div className="relative z-10 bg-black/60 p-2 rounded-lg backdrop-blur-sm">
                        <span className="text-white text-sm">Click to change</span>
                     </div>
                   </>
                ) : (
                   <>
                     <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     </div>
                     <p className="text-slate-300 font-medium">Click to upload</p>
                     <p className="text-slate-500 text-xs mt-1">JPEG, PNG, WEBP</p>
                   </>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*" 
              />

              <Button 
                className="w-full" 
                onClick={handleGenerate} 
                disabled={!selectedImage || isProcessing}
                isLoading={isProcessing}
              >
                {isProcessing ? "Analyzing Image..." : "Generate Prompt"}
              </Button>
           </div>
        </section>

      </div>
    </div>
  );
};