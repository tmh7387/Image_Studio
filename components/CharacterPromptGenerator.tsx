
import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { GalleryItem, GenerationConfig, ArtStyle, AspectRatio } from '../types';
import { generateCharacterPrompt, generateContent } from '../services/geminiService';

interface CharacterPromptGeneratorProps {
  onBack: () => void;
  onAddToGallery: (item: GalleryItem) => void;
}

export const CharacterPromptGenerator: React.FC<CharacterPromptGeneratorProps> = ({ onBack, onAddToGallery }) => {
  // Image State (Inputs)
  const [headshot, setHeadshot] = useState<string | null>(null);
  const [bodyshot, setBodyshot] = useState<string | null>(null);
  
  // Attribute State
  const [gender, setGender] = useState('Female');
  const [age, setAge] = useState('Young Adult (18-25)');
  const [ethnicity, setEthnicity] = useState('Caucasian');
  const [bodyType, setBodyType] = useState('Average');
  const [height, setHeight] = useState('Average');
  const [complexion, setComplexion] = useState('Fair');
  const [features, setFeatures] = useState('None');

  // Text Prompt State
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGeneratingText, setIsGeneratingText] = useState(false);

  // Image Generation State
  const [shotType, setShotType] = useState<'Headshot' | 'Full Body'>('Headshot');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const headshotInputRef = useRef<HTMLInputElement>(null);
  const bodyshotInputRef = useRef<HTMLInputElement>(null);

  // Options (Reused from Creator)
  const genderOptions = ['Male', 'Female', 'Non-binary'];
  const ageOptions = ['Child', 'Teenager', 'Young Adult (18-25)', 'Adult (25-40)', 'Middle-aged', 'Senior'];
  const ethnicityOptions = ['Asian', 'Black/African', 'Caucasian', 'Hispanic/Latino', 'Middle Eastern', 'South Asian', 'Indigenous', 'Mixed'];
  const bodyTypeOptions = ['Slim', 'Athletic', 'Muscular', 'Curvy', 'Plus-size', 'Average'];
  const heightOptions = ['Short', 'Average', 'Tall'];
  const complexionOptions = ['Fair', 'Medium', 'Olive', 'Tan', 'Dark', 'Porcelain', 'Freckled'];
  const featureOptions = ['None', 'Tattoos', 'Scars', 'Piercings', 'Glasses', 'Freckles', 'Mole'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateText = async () => {
    setIsGeneratingText(true);
    try {
      const result = await generateCharacterPrompt(
        headshot, 
        bodyshot, 
        { gender, age, ethnicity, bodyType, height, complexion, features }
      );
      
      setGeneratedPrompt(result);
    } catch (error) {
      console.error(error);
      setGeneratedPrompt("Error generating prompt. Please try again.");
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedPrompt) return;
    
    setIsGeneratingImage(true);
    setGeneratedImage(null);

    // Enforce constraints: Clean background + Shot type
    const visualPrompt = `${generatedPrompt}. \n\nCOMPOSITION: Professional ${shotType}, clean solid neutral background, studio lighting, high resolution, photorealistic.`;

    try {
      const config: GenerationConfig = {
        prompt: visualPrompt,
        style: ArtStyle.PHOTOREALISTIC,
        aspectRatio: shotType === 'Full Body' ? AspectRatio.TALL_9_16 : AspectRatio.SQUARE,
        // We use the inputs as loose references if provided, or rely purely on the text description
        // For this workflow, let's rely on the rich text prompt we just generated, 
        // as it theoretically contains the distilled essence of the inputs.
      };

      const result = await generateContent(config);
      
      if (result.imageUrl) {
        setGeneratedImage(result.imageUrl);
      }
    } catch (error) {
      console.error("Image generation failed:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSaveToGallery = () => {
    if (!generatedImage) return;
    onAddToGallery({
      id: Date.now().toString(),
      imageUrl: generatedImage,
      prompt: generatedPrompt, // Save the text prompt associated with it
      type: 'generation', // It's effectively a generation now
      timestamp: Date.now()
    });
    alert("Saved Image to Gallery!");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto animate-fade-in pb-20 px-6">
      <div className="mb-6 flex items-center">
        <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-2">Character Prompt & Visualization</h2>
        <p className="text-slate-400">Define attributes, generate a precise prompt, and visualize the character.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        
        {/* Column 1: Inputs */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
             <h3 className="text-lg font-semibold text-white mb-4">1. References & Attributes</h3>
             
             {/* Images */}
             <div className="grid grid-cols-2 gap-4 mb-6">
                <div onClick={() => headshotInputRef.current?.click()} className="cursor-pointer">
                   <div className="block text-xs font-medium text-slate-300 mb-2">Headshot (Opt)</div>
                   <div className="w-full aspect-square border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center bg-slate-800/30 hover:bg-slate-800/50 transition-all overflow-hidden relative group">
                      {headshot ? (
                        <img src={headshot} alt="Head" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                           <span className="text-2xl block mb-1">👤</span>
                        </div>
                      )}
                   </div>
                   <input type="file" ref={headshotInputRef} onChange={(e) => handleImageUpload(e, setHeadshot)} className="hidden" accept="image/*" />
                </div>
                <div onClick={() => bodyshotInputRef.current?.click()} className="cursor-pointer">
                   <div className="block text-xs font-medium text-slate-300 mb-2">Body (Opt)</div>
                   <div className="w-full aspect-square border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center bg-slate-800/30 hover:bg-slate-800/50 transition-all overflow-hidden relative group">
                      {bodyshot ? (
                        <img src={bodyshot} alt="Body" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                           <span className="text-2xl block mb-1">🧍</span>
                        </div>
                      )}
                   </div>
                   <input type="file" ref={bodyshotInputRef} onChange={(e) => handleImageUpload(e, setBodyshot)} className="hidden" accept="image/*" />
                </div>
             </div>

             {/* Attributes */}
             <div className="grid grid-cols-2 gap-4">
                <Dropdown label="Gender" value={gender} options={genderOptions} onChange={setGender} />
                <Dropdown label="Age" value={age} options={ageOptions} onChange={setAge} />
                <Dropdown label="Ethnicity" value={ethnicity} options={ethnicityOptions} onChange={setEthnicity} />
                <Dropdown label="Body Type" value={bodyType} options={bodyTypeOptions} onChange={setBodyType} />
                <Dropdown label="Height" value={height} options={heightOptions} onChange={setHeight} />
                <Dropdown label="Complexion" value={complexion} options={complexionOptions} onChange={setComplexion} />
                <div className="col-span-2">
                   <Dropdown label="Features" value={features} options={featureOptions} onChange={setFeatures} />
                </div>
             </div>
             
             <div className="mt-6">
                <Button className="w-full" onClick={handleGenerateText} isLoading={isGeneratingText}>
                  {isGeneratingText ? "Generating Prompt..." : "Generate Prompt"}
                </Button>
             </div>
          </div>
        </div>

        {/* Column 2: Prompt Editor */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-full min-h-[500px]">
           <h3 className="text-lg font-semibold text-white mb-4">2. Review & Edit Prompt</h3>
           
           <div className="flex-1 relative mb-4">
              <textarea 
                value={generatedPrompt}
                onChange={(e) => setGeneratedPrompt(e.target.value)}
                placeholder="The generated prompt will appear here. You can edit it before generating the image."
                className="w-full h-full min-h-[400px] bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-slate-200 leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
              {!generatedPrompt && !isGeneratingText && (
                 <div className="absolute inset-0 flex items-center justify-center text-slate-500 pointer-events-none">
                    <p>Waiting for generation...</p>
                 </div>
              )}
           </div>

           <div className="flex justify-end">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={copyToClipboard}
                disabled={!generatedPrompt}
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
              >
                Copy Text
              </Button>
           </div>
        </div>

        {/* Column 3: Image Generator */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-full min-h-[500px]">
           <h3 className="text-lg font-semibold text-white mb-4">3. Visualize Character</h3>
           
           <div className="flex space-x-2 mb-4 bg-slate-800/50 p-1 rounded-lg">
              <button 
                onClick={() => setShotType('Headshot')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${shotType === 'Headshot' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Headshot
              </button>
              <button 
                onClick={() => setShotType('Full Body')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${shotType === 'Full Body' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Full Body
              </button>
           </div>

           <div className="flex-1 bg-black/20 rounded-xl border border-dashed border-slate-700/50 mb-4 flex items-center justify-center overflow-hidden relative">
              {!generatedImage && !isGeneratingImage && (
                 <div className="text-center text-slate-500">
                    <p className="mb-2">Ready to render</p>
                    <p className="text-xs">Select shot type and click generate</p>
                 </div>
              )}
              
              {isGeneratingImage && (
                 <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-indigo-300 text-sm animate-pulse">Rendering {shotType}...</p>
                 </div>
              )}

              {generatedImage && (
                 <img src={generatedImage} alt="Result" className="w-full h-full object-contain" />
              )}
           </div>

           <Button 
             className="w-full mb-3" 
             onClick={handleGenerateImage} 
             disabled={!generatedPrompt || isGeneratingImage}
             isLoading={isGeneratingImage}
           >
             Generate Image
           </Button>

           {generatedImage && (
             <Button 
               variant="glass" 
               className="w-full"
               onClick={handleSaveToGallery}
               icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
             >
               Save Image
             </Button>
           )}
        </div>

      </div>
    </div>
  );
};
