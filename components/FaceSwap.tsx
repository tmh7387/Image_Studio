
import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { Influencer, GalleryItem, ArtStyle, AspectRatio } from '../types';
import { generateContent } from '../services/geminiService';

interface FaceSwapProps {
  influencers: Influencer[];
  initialInfluencer?: Influencer | null;
  onBack: () => void;
  gallery: GalleryItem[];
  onAddToGallery: (item: GalleryItem) => void;
  onDeleteFromGallery: (id: string) => void;
}

export const FaceSwap: React.FC<FaceSwapProps> = ({
  influencers,
  initialInfluencer,
  onBack,
  gallery,
  onAddToGallery,
  onDeleteFromGallery
}) => {
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | number | undefined>(initialInfluencer?.id);
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [targetMimeType, setTargetMimeType] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedInfluencer = influencers.find(i => i.id === selectedInfluencerId);

  const handleTargetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTargetImage(reader.result as string);
        setTargetMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSwap = async () => {
    if (!selectedInfluencer || !targetImage) {
      setError("Please select a character and upload a scene reference.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Construct rich character context
    const attrs = [];
    if (selectedInfluencer.gender) attrs.push(selectedInfluencer.gender);
    if (selectedInfluencer.ethnicity) attrs.push(selectedInfluencer.ethnicity);
    if (selectedInfluencer.age) attrs.push(selectedInfluencer.age);
    if (selectedInfluencer.complexion) attrs.push(`${selectedInfluencer.complexion} skin`);
    const physicalContext = attrs.length > 0 ? `(${attrs.join(', ')})` : '';

    // Construct prompt for "Character Transfer"
    const swapPrompt = `Character Insertion. Recreate this image featuring the character ${selectedInfluencer.name} ${physicalContext}. ${selectedInfluencer.description || ''}. Maintain the original pose, lighting, composition, and background of the reference image exactly as is. Ensure high photorealism and seamless blending.`;

    try {
      const result = await generateContent({
        prompt: swapPrompt,
        style: ArtStyle.PHOTOREALISTIC,
        aspectRatio: AspectRatio.SQUARE,
        base64Image: targetImage,
        mimeType: targetMimeType || 'image/png',
        characterReferenceImage: selectedInfluencer.avatarUrl // CRITICAL FIX: Pass the face reference
      });

      if (result.imageUrl) {
        onAddToGallery({
          id: Date.now().toString(),
          imageUrl: result.imageUrl,
          prompt: swapPrompt,
          type: 'faceswap',
          timestamp: Date.now(),
          influencerId: selectedInfluencer.id
        });
      } else {
        setError("Failed to generate scene.");
      }
    } catch (err: any) {
      setError(err.message || "Character transfer failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const swapGallery = gallery.filter(item => item.type === 'faceswap');

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-6">Character Transfer Config</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Character Identity</label>
                <div className="space-y-2">
                  {influencers.length === 0 ? (
                    <div className="text-slate-500 text-sm">No characters available.</div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedInfluencerId}
                        onChange={(e) => setSelectedInfluencerId(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">Select Character...</option>
                        {influencers.map(inf => (
                          <option key={inf.id} value={inf.id}>{inf.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedInfluencer && (
                    <div className="mt-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                        {selectedInfluencer.avatarUrl ? (
                          <img src={selectedInfluencer.avatarUrl} alt={selectedInfluencer.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-bold">{selectedInfluencer.name[0]}</div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{selectedInfluencer.name}</p>
                        {selectedInfluencer.characterStyle && <p className="text-xs text-slate-400">{selectedInfluencer.characterStyle} • {selectedInfluencer.age}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Target Scene / Pose Reference</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-800/30 transition-all text-center"
                >
                  {targetImage ? (
                    <div className="relative w-full aspect-video bg-black/40 rounded-lg overflow-hidden">
                      <img src={targetImage} alt="Target" className="w-full h-full object-contain" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setTargetImage(null); }}
                        className="absolute top-2 right-2 p-1 bg-red-600 rounded-full text-white"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-300">Drag & drop or click to select files</p>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleTargetUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSwap}
                disabled={isProcessing || !targetImage || !selectedInfluencer}
                isLoading={isProcessing}
              >
                {isProcessing ? "Generating..." : "Transfer Character"}
              </Button>

              {error && (
                <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-500/20">
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="lg:col-span-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl min-h-[600px]">
            <h2 className="text-lg font-semibold text-white mb-6">Character Transfer Gallery</h2>

            {swapGallery.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-slate-500 border border-dashed border-slate-700/50 rounded-xl">
                <p>Processed scenes will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {swapGallery.map((item) => (
                  <div key={item.id} className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                    <div className="aspect-[4/3] bg-black">
                      <img src={item.imageUrl} alt="Swap Result" className="w-full h-full object-contain" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
