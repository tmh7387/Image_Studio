import React, { useState, useRef, useEffect } from 'react';
import { analyzeCharacterImage, generateAnchorHeadshot, generateAnchorBody } from '../services/aiService';
import { Button } from './Button';
import { CharacterDNA, Influencer, AIProvider, AIModel } from '../types';
import { Dropdown } from './Dropdown';

interface CharacterCreatorProps {
  onBack: () => void;
  onCharacterCreated: (character: CharacterDNA | Influencer) => void;
  initialData?: Influencer;
}

type ForgeStep = 'upload' | 'analyze' | 'edit-prompts' | 'generate' | 'review';

// Helper function to generate headshot prompt from blueprint
const generateHeadshotPrompt = (blueprint: CharacterDNA['blueprint']): string => {
  const { identity } = blueprint;
  return `Professional passport-style headshot photograph, 1:1 square format:

SUBJECT IDENTITY:
- ${identity.gender}, ${identity.ageRange}
- Ethnicity: ${identity.ethnicity}
- Skin: ${identity.skinComplexion}
- Eyes: ${identity.eyeDetails}
- Hair: ${identity.hairDetails}
- Distinctive features: ${identity.distinctiveFeatures.join(', ')}

STYLE CONSTRAINTS:
- Neutral, pleasant expression (slight natural smile)
- Direct eye contact with camera
- Head and shoulders only (crop at collarbone)
- Centered composition

LIGHTING & BACKGROUND:
- Soft, even studio lighting (no harsh shadows)
- Plain white or light gray background
- Professional photography studio quality
- Photorealistic, sharp focus`;
};

// Helper function to generate full body prompt from blueprint
const generateFullBodyPrompt = (blueprint: CharacterDNA['blueprint']): string => {
  const { identity, style } = blueprint;
  return `Full-body neutral lookbook photograph, 9:16 tall format:

BODY COMPOSITION:
- Subject: ${identity.gender}, ${identity.ageRange}
- Body type: ${style.bodySomatotype}
- Standing naturally with arms relaxed at sides
- Full body visible from head to feet
- Centered composition

CLOTHING & ACCESSORIES:
- Style: ${style.clothingStyle.join(', ')} aesthetic
- Accessories: ${style.defaultAccessories.join(', ')}
- Neutral, timeless outfit

BACKGROUND:
- PLAIN WHITE or LIGHT GRAY BACKGROUND
- No scenes, no curtains, no props, no context
- Professional lookbook/catalog aesthetic
- Clean, minimal, reusable asset

LIGHTING & QUALITY:
- Even studio lighting, soft shadows
- Neutral expression
- Photorealistic, sharp focus
- Professional fashion photography quality`;
};

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onBack, onCharacterCreated, initialData }) => {
  // Sequential workflow state
  const [currentStep, setCurrentStep] = useState<ForgeStep>('upload');
  const [characterName, setCharacterName] = useState(initialData?.name || '');

  // Reference images
  const [uploadedHeadshot, setUploadedHeadshot] = useState<string | null>(null);
  const [uploadedBody, setUploadedBody] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<CharacterDNA['blueprint'] | null>(null);

  // Manual attributes (for manual mode or override)
  const [gender, setGender] = useState('Female');
  const [age, setAge] = useState('Young Adult (18-25)');
  const [ethnicity, setEthnicity] = useState('Caucasian');
  const [bodyType, setBodyType] = useState('Average');
  const [height, setHeight] = useState('Average');
  const [complexion, setComplexion] = useState('Fair');
  const [features, setFeatures] = useState('None');

  // Editable prompts
  const [headshotPrompt, setHeadshotPrompt] = useState('');
  const [fullBodyPrompt, setFullBodyPrompt] = useState('');

  const [anchorHeadshot, setAnchorHeadshot] = useState<string | null>(null);
  const [anchorBody, setAnchorBody] = useState<string | null>(null);

  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [isGeneratingHead, setIsGeneratingHead] = useState(false);
  const [isGeneratingBody, setIsGeneratingBody] = useState(false);

  // Model selection
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(
    (localStorage.getItem('ai_provider') as AIProvider) || AIProvider.GOOGLE
  );
  const [selectedModel, setSelectedModel] = useState<AIModel>(
    selectedProvider === AIProvider.GOOGLE ? AIModel.GEMINI_2_5_FLASH_IMAGE : AIModel.DOUBAO_SEEDREAM
  );

  const headshotInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);

  // Attribute options
  const genderOptions = ['Male', 'Female', 'Non-binary'];
  const ageOptions = ['Child', 'Teenager', 'Young Adult (18-25)', 'Adult (25-40)', 'Middle-aged', 'Senior'];
  const ethnicityOptions = ['Asian', 'Black/African', 'Caucasian', 'Hispanic/Latino', 'Middle Eastern', 'South Asian', 'Indigenous', 'Mixed'];
  const bodyTypeOptions = ['Slim', 'Athletic', 'Muscular', 'Curvy', 'Plus-size', 'Average'];
  const heightOptions = ['Short', 'Average', 'Tall'];
  const complexionOptions = ['Fair', 'Medium', 'Olive', 'Tan', 'Dark', 'Porcelain', 'Freckled'];
  const featureOptions = ['None', 'Tattoos', 'Scars', 'Piercings', 'Glasses', 'Freckles', 'Mole'];

  // Update model when provider changes
  useEffect(() => {
    if (selectedProvider === AIProvider.GOOGLE) {
      setSelectedModel(AIModel.GEMINI_2_5_FLASH_IMAGE);
    } else {
      setSelectedModel(AIModel.DOUBAO_SEEDREAM);
    }
  }, [selectedProvider]);

  // Initialize edit mode - populate existing character data
  useEffect(() => {
    if (initialData) {
      const charData = initialData as any; // Support both Influencer and CharacterDNA

      // If this is a CharacterDNA (has anchorHeadshot), populate everything
      if (charData.anchorHeadshot) {
        setAnchorHeadshot(charData.anchorHeadshot);
        setAnchorBody(charData.anchorBody);
        setBlueprint(charData.blueprint);

        // Generate prompts from blueprint
        if (charData.blueprint) {
          setHeadshotPrompt(generateHeadshotPrompt(charData.blueprint));
          setFullBodyPrompt(generateFullBodyPrompt(charData.blueprint));
        }

        // Skip directly to review step so user can see images and edit prompts
        setCurrentStep('review');
      }
    }
  }, [initialData]);

  // Image upload handler (headshot)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedHeadshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // STEP 2: Analyze handler
  const handleAnalyze = async () => {
    if (!uploadedHeadshot) return;

    setIsAnalyzing(true);
    setCurrentStep('analyze');

    try {
      const extractedBlueprint = await analyzeCharacterImage(uploadedHeadshot);
      setBlueprint(extractedBlueprint);

      // Auto-generate prompts from blueprint
      setHeadshotPrompt(generateHeadshotPrompt(extractedBlueprint));
      setFullBodyPrompt(generateFullBodyPrompt(extractedBlueprint));

      setCurrentStep('edit-prompts');
    } catch (error: any) {
      console.error('Analysis failed:', error);
      const errorMsg = error?.message || error?.toString() || 'Unknown error';
      alert(`Failed to analyze image: ${errorMsg}\n\nPlease check:\n1. Your Gemini API key is set in Settings\n2. The image is clear and contains a person\n3. You have available API quota`);
      setCurrentStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // STEP 3a: Generate Headshot handler
  const handleGenerateHeadshot = async () => {
    if (!headshotPrompt) return;

    setIsGeneratingHead(true);

    try {
      const headshot = await generateAnchorHeadshot(headshotPrompt, selectedProvider);
      setAnchorHeadshot(headshot);
    } catch (error) {
      console.error('Headshot generation failed:', error);
      alert('Failed to generate headshot. Please try again or switch providers/models.');
    } finally {
      setIsGeneratingHead(false);
    }
  };

  // STEP 3b: Generate Body handler
  const handleGenerateBody = async () => {
    if (!anchorHeadshot || !fullBodyPrompt || !headshotPrompt) {
      alert('Please generate headshot first');
      return;
    }

    setIsGeneratingBody(true);

    try {
      const body = await generateAnchorBody(anchorHeadshot, fullBodyPrompt, headshotPrompt, selectedProvider);
      setAnchorBody(body);
      setCurrentStep('review');
    } catch (error) {
      console.error('Body generation failed:', error);
      alert('Failed to generate body shot. Please try again or switch providers/models.');
    } finally {
      setIsGeneratingBody(false);
    }
  };

  // STEP 4: Save handler
  const handleSave = () => {
    if (!characterName || !blueprint || !anchorHeadshot || !anchorBody) {
      alert('Please complete all steps before saving.');
      return;
    }

    const character: CharacterDNA = {
      id: initialData?.id?.toString() || Date.now().toString(),
      name: characterName,
      createdAt: initialData?.createdAt || Date.now(),
      anchorHeadshot,
      anchorBody,
      blueprint
    };

    onCharacterCreated(character);
  };

  // Download image helper
  const handleDownloadImage = (imageBase64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageBase64;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Step Indicator Component
  const StepIndicator = ({ step, label, active, completed }: { step: number; label: string; active: boolean; completed: boolean }) => (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${active ? 'bg-indigo-600 text-white ring-4 ring-indigo-600/30' :
        completed ? 'bg-green-600 text-white' :
          'bg-slate-700 text-slate-400'
        }`}>
        {completed ? '✓' : step}
      </div>
      <p className={`text-xs mt-2 ${active ? 'text-white font-medium' : 'text-slate-500'}`}>{label}</p>
    </div>
  );

  const isStepCompleted = (stepName: ForgeStep): boolean => {
    const order: ForgeStep[] = ['upload', 'analyze', 'edit-prompts', 'generate', 'review'];
    const current = order.indexOf(currentStep);
    const target = order.indexOf(stepName);
    return target < current;
  };

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="mb-6 text-slate-400 hover:text-white flex items-center">
        ← Back to Dashboard
      </button>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-12 max-w-4xl mx-auto">
        <StepIndicator step={1} label="Upload" active={currentStep === 'upload'} completed={isStepCompleted('upload')} />
        <div className="flex-1 h-0.5 bg-slate-700 mx-2"></div>
        <StepIndicator step={2} label="Analyze" active={currentStep === 'analyze'} completed={isStepCompleted('analyze')} />
        <div className="flex-1 h-0.5 bg-slate-700 mx-2"></div>
        <StepIndicator step={3} label="Edit Prompts" active={currentStep === 'edit-prompts'} completed={isStepCompleted('edit-prompts')} />
        <div className="flex-1 h-0.5 bg-slate-700 mx-2"></div>
        <StepIndicator step={4} label="Generate" active={currentStep === 'generate'} completed={isStepCompleted('generate')} />
        <div className="flex-1 h-0.5 bg-slate-700 mx-2"></div>
        <StepIndicator step={5} label="Save" active={currentStep === 'review'} completed={false} />
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto">

        {/* STEP 1: Upload */}
        {currentStep === 'upload' && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">Upload Reference Image</h2>
            <p className="text-slate-400 text-sm mb-6">Upload a clear photo to extract character identity</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Character Name</label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Sarah Chen"
                />
              </div>

              <div>
                {!uploadedHeadshot ? (
                  <div
                    onClick={() => headshotInputRef.current?.click()}
                    className="w-full h-64 border-2 border-dashed border-slate-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-800/30 transition-all"
                  >
                    <svg className="w-12 h-12 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-white font-medium">Click to upload reference image</p>
                    <p className="text-slate-500 text-sm mt-2">PNG, JPG up to 10MB</p>
                  </div>
                ) : (
                  <div className="relative w-full h-64 bg-black/40 rounded-2xl border border-slate-600 overflow-hidden group">
                    <img src={uploadedHeadshot} alt="Uploaded" className="w-full h-full object-contain" />
                    <button
                      onClick={() => setUploadedHeadshot(null)}
                      className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-500/80 rounded-full text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <input
                  ref={headshotInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={!characterName || !uploadedHeadshot}
                className="w-full"
              >
                Analyze Image →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Analyzing */}
        {currentStep === 'analyze' && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-fade-in text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Extracting Character DNA...</h2>
            <p className="text-slate-400">Analyzing facial features, ethnicity, and style</p>
          </div>
        )}

        {/* STEP 3: Edit Prompts */}
        {currentStep === 'edit-prompts' && blueprint && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">Review & Edit Prompts</h2>
            <p className="text-slate-400 text-sm mb-6">Customize the prompts before generating images</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Headshot Prompt */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  📷 Headshot Prompt (1:1)
                </label>
                <textarea
                  value={headshotPrompt}
                  onChange={(e) => setHeadshotPrompt(e.target.value)}
                  className="w-full h-96 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono"
                  placeholder="Headshot generation prompt..."
                />
              </div>

              {/* Full Body Prompt */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  🧍 Full Body Prompt (9:16)
                </label>
                <textarea
                  value={fullBodyPrompt}
                  onChange={(e) => setFullBodyPrompt(e.target.value)}
                  className="w-full h-96 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono"
                  placeholder="Full body generation prompt..."
                />
              </div>
            </div>

            <Button
              onClick={() => setCurrentStep('generate')}
              disabled={!headshotPrompt || !fullBodyPrompt}
              className="w-full"
            >
              Continue to Generation →
            </Button>
          </div>
        )}

        {/* STEP 4: Generate */}
        {currentStep === 'generate' && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">Generate Visual Anchors</h2>
            <p className="text-slate-400 text-sm mb-6">Generate headshot first, then full body</p>

            {/* Provider & Model Selection */}
            <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <p className="text-sm font-medium text-slate-300 mb-3">Image Generation Settings</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Dropdown
                  label="Provider"
                  value={selectedProvider}
                  options={[AIProvider.GOOGLE, AIProvider.COMET]}
                  onChange={(val) => setSelectedProvider(val as AIProvider)}
                />
                <Dropdown
                  label="Model"
                  value={selectedModel}
                  options={
                    selectedProvider === AIProvider.GOOGLE
                      ? [AIModel.GEMINI_2_5_FLASH_IMAGE]
                      : [AIModel.DOUBAO_SEEDREAM, AIModel.FLUX_1_PRO]
                  }
                  onChange={(val) => setSelectedModel(val as AIModel)}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                💡 Tip: Switch providers if you encounter quota limits
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Headshot Generator */}
              <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">A. Headshot (1:1)</h3>

                {anchorHeadshot ? (
                  <div className="mb-4">
                    <img src={anchorHeadshot} alt="Headshot" className="w-full aspect-square rounded-lg border border-slate-600 object-cover" />
                  </div>
                ) : (
                  <div className="w-full aspect-square rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center mb-4">
                    <p className="text-slate-500">Not generated yet</p>
                  </div>
                )}

                <Button
                  onClick={handleGenerateHeadshot}
                  disabled={isGeneratingHead}
                  variant="primary"
                  className="w-full"
                >
                  {isGeneratingHead ? 'Generating...' : anchorHeadshot ? 'Regenerate' : 'Generate Headshot'}
                </Button>
              </div>

              {/* Body Generator */}
              <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">B. Full Body (9:16)</h3>

                {anchorBody ? (
                  <div className="mb-4">
                    <img src={anchorBody} alt="Body" className="w-full aspect-[9/16] rounded-lg border border-slate-600 object-cover mx-auto" style={{ maxHeight: '400px' }} />
                  </div>
                ) : (
                  <div className="w-full aspect-[9/16] rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center mb-4 mx-auto" style={{ maxHeight: '400px' }}>
                    <p className="text-slate-500">Not generated yet</p>
                  </div>
                )}

                <Button
                  onClick={handleGenerateBody}
                  disabled={!anchorHeadshot || isGeneratingBody}
                  variant="primary"
                  className="w-full"
                >
                  {isGeneratingBody ? 'Generating...' : anchorBody ? 'Regenerate' : 'Generate Full Body'}
                </Button>
                {!anchorHeadshot && (
                  <p className="text-slate-500 text-xs mt-2 text-center">Generate headshot first</p>
                )}
              </div>
            </div>

            {anchorHeadshot && anchorBody && (
              <div className="mt-6">
                <Button onClick={() => setCurrentStep('review')} className="w-full">
                  Continue to Review & Save →
                </Button>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Review & Save */}
        {currentStep === 'review' && anchorHeadshot && anchorBody && blueprint && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">Character Complete!</h2>
            <p className="text-slate-400 text-sm mb-6">Review both visual anchors before saving</p>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-xs">Anchor Headshot (1:1)</p>
                  <button
                    onClick={() => handleDownloadImage(anchorHeadshot, `${characterName}_headshot.png`)}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 text-xs"
                    title="Download headshot"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
                <img src={anchorHeadshot} alt="Headshot" className="w-full aspect-square rounded-xl border border-slate-600 object-cover" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-xs">Anchor Body (9:16)</p>
                  <button
                    onClick={() => handleDownloadImage(anchorBody, `${characterName}_body.png`)}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 text-xs"
                    title="Download body image"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
                <img src={anchorBody} alt="Body" className="w-full aspect-[9/16] rounded-xl border border-slate-600 object-cover" />
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
              <p className="text-white font-medium">{characterName}</p>
              <p className="text-slate-400 text-sm">{blueprint.identity.gender}, {blueprint.identity.ageRange} · {blueprint.identity.ethnicity}</p>
            </div>

            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setCurrentStep('edit-prompts')} className="w-1/3">
                ← Edit Prompts
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Save Character ✓
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};