import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { ArtStyle, AspectRatio, GalleryItem, GenerationConfig } from '../types';
import { generateContent } from '../services/geminiService';

interface ImageEditorProps {
  onBack: () => void;
  onAddToGallery: (item: GalleryItem) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ onBack, onAddToGallery }) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setMimeType(file.type);
        setResultImage(null); // Clear previous result on new upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!sourceImage || !editInstruction) {
      setError("Please upload an image and provide instructions.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const config: GenerationConfig = {
        prompt: editInstruction,
        style: ArtStyle.NO_STYLE, // Usually keep original style for edits unless specified in prompt
        aspectRatio: AspectRatio.SQUARE, // This might need to match input, but API handles resizing
        base64Image: sourceImage,
        mimeType: mimeType || 'image/png',
        taskType: 'editing'
      };

      const result = await generateContent(config);

      if (result.imageUrl) {
        setResultImage(result.imageUrl);
        onAddToGallery({
          id: Date.now().toString(),
          imageUrl: result.imageUrl,
          prompt: `Edit: ${editInstruction}`,
          type: 'editing',
          timestamp: Date.now()
        });
      } else {
        setError("The model did not return an edited image. Try a different instruction.");
      }
    } catch (err: any) {
      setError(err.message || "Editing failed.");
    } finally {
      setIsProcessing(false);
    }
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
          <h2 className="text-2xl font-semibold text-white">AI Image Editor</h2>
          <p className="text-slate-400 mt-1">Upload an image and use text to modify details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Input */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col h-full">
           <h3 className="text-lg font-semibold text-white mb-4">Source & Instructions</h3>
           
           <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-800/30 transition-all mb-6 relative overflow-hidden bg-slate-900/50"
           >
              {sourceImage ? (
                 <>
                   <img src={sourceImage} alt="Source" className="w-full h-full object-contain" />
                   <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-medium bg-black/50 px-3 py-1 rounded">Click to change</p>
                   </div>
                 </>
              ) : (
                 <div className="text-center p-4">
                    <svg className="w-12 h-12 text-slate-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-slate-300">Upload Source Image</p>
                 </div>
              )}
           </div>
           <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

           <div className="space-y-4 flex-1">
             <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Edit Instruction</label>
                <textarea 
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  placeholder="e.g. Change the background to a beach, make the car red, add sunglasses..."
                  className="w-full h-32 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none placeholder-slate-500"
                />
             </div>
             
             {error && (
                <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-500/20">
                  {error}
                </div>
              )}

             <Button 
               className="w-full" 
               onClick={handleEdit} 
               disabled={isProcessing || !sourceImage || !editInstruction}
               isLoading={isProcessing}
             >
               {isProcessing ? "Applying Edits..." : "Generate Edit"}
             </Button>
           </div>
        </div>

        {/* Right: Output */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col h-full min-h-[500px]">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Edited Result</h3>
              {resultImage && (
                <a 
                  href={resultImage} 
                  download="edited-image.png"
                  className="text-indigo-400 hover:text-white text-sm"
                >
                  Download
                </a>
              )}
           </div>

           <div className="flex-1 bg-slate-900/40 rounded-xl border border-dashed border-slate-700/50 flex items-center justify-center overflow-hidden relative">
              {!resultImage && !isProcessing && (
                 <p className="text-slate-500">Result will appear here</p>
              )}
              
              {isProcessing && (
                 <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-indigo-300 animate-pulse">Processing edits...</p>
                 </div>
              )}

              {resultImage && (
                 <img src={resultImage} alt="Result" className="w-full h-full object-contain" />
              )}
           </div>
        </div>

      </div>
    </div>
  );
};
