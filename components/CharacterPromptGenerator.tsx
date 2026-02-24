import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { GalleryItem, GenerationConfig, ArtStyle, AspectRatio, AIModel, AIProvider } from '../types';
import { generateCharacterPrompt, generateContent } from '../services/aiService';

interface CharacterPromptGeneratorProps {
  onBack: () => void;
  onAddToGallery: (item: GalleryItem) => void;
}

export const CharacterPromptGenerator: React.FC<CharacterPromptGeneratorProps> = ({ onBack, onAddToGallery }) => {
  // Image State
  const [headshot, setHeadshot] = useState<string | null>(null);
  const [bodyshot, setBodyshot] = useState<string | null>(null);

  // Workflow State
  const [generatedHeadshot, setGeneratedHeadshot] = useState<string | null>(null);

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
  const [isSaved, setIsSaved] = useState(false);

  // AI Configuration State
  const [activeProvider, setActiveProvider] = useState<AIProvider>(AIProvider.GOOGLE);
  const [selectedModel, setSelectedModel] = useState<string>(AIModel.GEMINI_2_5_FLASH);

  const headshotInputRef = useRef<HTMLInputElement>(null);
  const bodyshotInputRef = useRef<HTMLInputElement>(null);

  // Load defaults
  useEffect(() => {
    const storedProvider = localStorage.getItem('ai_provider') as AIProvider;
    if (storedProvider) {
      setActiveProvider(storedProvider);
      if (storedProvider === AIProvider.COMET) {
        setSelectedModel(AIModel.DOUBAO_SEEDREAM);
      } else {
        setSelectedModel(AIModel.GEMINI_2_5_FLASH);
      }
    }
  }, []);

  // Constants
  const genderOptions = ['Male', 'Female', 'Non-binary'];
  const ageOptions = ['Child', 'Teenager', 'Young Adult (18-25)', 'Adult (25-40)', 'Middle-aged', 'Senior'];
  const ethnicityOptions = ['Asian', 'Black/African', 'Caucasian', 'Hispanic/Latino', 'Middle Eastern', 'South Asian', 'Indigenous', 'Mixed'];
  const bodyTypeOptions = ['Slim', 'Athletic', 'Muscular', 'Curvy', 'Plus-size', 'Average'];
  const heightOptions = ['Short', 'Average', 'Tall'];
  const complexionOptions = ['Fair', 'Medium', 'Olive', 'Tan', 'Dark', 'Porcelain', 'Freckled'];
  const featureOptions = ['None', 'Tattoos', 'Scars', 'Piercings', 'Glasses', 'Freckles', 'Mole'];

  // AI Lists
  const providerOptions = [AIProvider.GOOGLE, AIProvider.COMET];

  // Dynamic Model List based on Provider
  const getModelOptions = () => {
    if (activeProvider === AIProvider.GOOGLE) {
      return [AIModel.GEMINI_2_5_FLASH, AIModel.GEMINI_EXP_1206];
    }
    return [AIModel.DOUBAO_SEEDREAM, AIModel.GEMINI_3_PRO_IMAGE, AIModel.FLUX_1_PRO];
  };

  const handleProviderChange = (val: string) => {
    const newProvider = val as AIProvider;
    setActiveProvider(newProvider);
    // Reset model default when provider switches
    if (newProvider === AIProvider.COMET) setSelectedModel(AIModel.DOUBAO_SEEDREAM);
    else setSelectedModel(AIModel.GEMINI_2_5_FLASH);
  };

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
    } catch (error: any) {
      console.error(error);
      setGeneratedPrompt(`Error generating prompt: ${error.message || "Unknown error"}`);
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedPrompt) return;

    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setIsSaved(false);

    // 1. Construct Prompt Logic
    let visualPrompt = generatedPrompt;

    // Strict Headshot Mode
    if (shotType === 'Headshot') {
      visualPrompt = `Identify the face of the person described and convert it into a portrait ID photo. No unnecessary actions, text or objects. The person must face the camera and the body and face must be symmetrical. Background: Pure white. \n\nCharacter Description: ${generatedPrompt}`;
    } else {
      // Full Body Mode
      visualPrompt = `${generatedPrompt}. \n\nCOMPOSITION: Full Body shot, showing entire outfit and shoes, detailed environment, professional photography.`;
    }

    try {
      const config: GenerationConfig = {
        prompt: visualPrompt,
        style: ArtStyle.PHOTOREALISTIC,
        aspectRatio: shotType === 'Full Body' ? AspectRatio.TALL_9_16 : AspectRatio.SQUARE,
        provider: activeProvider, // Explicit 
        model: selectedModel,     // Explicit
      };

      // 2. Identity Consistency (Headshot -> Full Body)
      if (shotType === 'Full Body' && generatedHeadshot) {
        // Pass the confirmed headshot as the reference image
        config.characterReferenceImage = generatedHeadshot;
        config.characterStrength = 'high';
      }

      const result = await generateContent(config);

      if (result.imageUrl) {
        setGeneratedImage(result.imageUrl);

        // If we generated a headshot, strictly save it as the new reference
        if (shotType === 'Headshot') {
          setGeneratedHeadshot(result.imageUrl);
        }
      } else {
        throw new Error("No image URL returned");
      }
    } catch (error: any) {
      console.error("Image generation failed:", error);
      alert(`Generation Failed: ${error.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSaveToGallery = () => {
    if (!generatedImage) return;
    onAddToGallery({
      id: Date.now().toString(),
      imageUrl: generatedImage,
      prompt: generatedPrompt,
      type: 'generation',
      timestamp: Date.now()
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
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
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div onClick={() => headshotInputRef.current?.click()} className="cursor-pointer">
                <div className="block text-xs font-medium text-slate-300 mb-2">Ref Headshot (Opt)</div>
                <div className="w-full aspect-square border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center bg-slate-800/30 hover:bg-slate-800/50 transition-all overflow-hidden relative group">
                  {headshot ? <img src={headshot} alt="Head" className="w-full h-full object-cover" /> : <div className="text-center p-2"><span className="text-2xl block mb-1">👤</span></div>}
                </div>
                <input type="file" ref={headshotInputRef} onChange={(e) => handleImageUpload(e, setHeadshot)} className="hidden" accept="image/*" />
              </div>
              <div onClick={() => bodyshotInputRef.current?.click()} className="cursor-pointer">
                <div className="block text-xs font-medium text-slate-300 mb-2">Ref Body (Opt)</div>
                <div className="w-full aspect-square border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center bg-slate-800/30 hover:bg-slate-800/50 transition-all overflow-hidden relative group">
                  {bodyshot ? <img src={bodyshot} alt="Body" className="w-full h-full object-cover" /> : <div className="text-center p-2"><span className="text-2xl block mb-1">🧍</span></div>}
                </div>
                <input type="file" ref={bodyshotInputRef} onChange={(e) => handleImageUpload(e, setBodyshot)} className="hidden" accept="image/*" />
              </div>
            </div>
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
              <p className="text-xs text-center mt-2 text-slate-500">Uses {activeProvider === AIProvider.GOOGLE ? 'Gemini 2.5 Flash' : 'Grok-4 (via Comet)'}</p>
            </div>
          </div>
        </div>

        {/* Column 2: Prompt Editor */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-full min-h-[500px]">
          <h3 className="text-lg font-semibold text-white mb-4">2. Review & Edit Prompt</h3>
          <textarea
            value={generatedPrompt}
            onChange={(e) => setGeneratedPrompt(e.target.value)}
            placeholder="The generated prompt will appear here. You can edit it before generating the image."
            className="w-full h-full min-h-[400px] bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-slate-200 leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none mb-4"
          />
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={copyToClipboard} disabled={!generatedPrompt} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}>
              Copy Text
            </Button>
          </div>
        </div>

        {/* Column 3: Image Generator */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-full min-h-[500px]">
          <h3 className="text-lg font-semibold text-white mb-4">3. Visualize Character</h3>

          <div className="flex flex-col gap-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <Dropdown label="Provider" value={activeProvider} options={providerOptions} onChange={handleProviderChange} />
              <Dropdown label="Model" value={selectedModel} options={getModelOptions()} onChange={setSelectedModel} />
            </div>
          </div>

          <div className="flex space-x-2 mb-4 bg-slate-800/50 p-1 rounded-lg">
            <button
              onClick={() => setShotType('Headshot')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${shotType === 'Headshot' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Headshot {generatedHeadshot && "✅"}
            </button>
            <button
              onClick={() => setShotType('Full Body')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${shotType === 'Full Body' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'} ${!generatedHeadshot ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!generatedHeadshot}
              title={!generatedHeadshot ? "Generate Headshot first to ensure identity" : "Generate Full Body"}
            >
              Full Body
            </button>
          </div>

          <div className="flex-1 bg-black/20 rounded-xl border border-dashed border-slate-700/50 mb-4 flex items-center justify-center overflow-hidden relative min-h-[300px]">
            {!generatedImage && !isGeneratingImage && (
              <div className="text-center text-slate-500">
                <p className="mb-2 font-medium">Ready to render</p>
                {shotType === 'Headshot' ? (
                  <p className="text-xs">Step 1: Generate Headshot (ID Photo Style)</p>
                ) : (
                  <p className="text-xs">Step 2: Generate Full Body (Using Headshot Reference)</p>
                )}
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
            Generate {shotType}
          </Button>

          {generatedImage && (
            <Button
              variant={isSaved ? "primary" : "glass"}
              className={`w-full transition-all ${isSaved ? 'bg-emerald-600 border-emerald-500' : ''}`}
              onClick={handleSaveToGallery}
              disabled={isSaved}
              icon={isSaved ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
            >
              {isSaved ? "Saved!" : "Save Image"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
