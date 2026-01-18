import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { analyzeCharacterImage, generateAnchorHeadshot, generateAnchorBody } from '../services/aiService';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { CharacterDNA, Influencer, AIProvider, AIModel } from '../types';

interface CharacterCreatorV2Props {
    onBack: () => void;
    onCharacterCreated: (character: CharacterDNA | Influencer) => void;
    initialData?: Influencer | CharacterDNA;
}

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

// Helper function to map complexion from detailed description
const mapComplexion = (skinComplexion: string): string => {
    const lowerCase = skinComplexion.toLowerCase();
    if (lowerCase.includes('fair') || lowerCase.includes('light')) return 'Fair';
    if (lowerCase.includes('dark')) return 'Dark';
    if (lowerCase.includes('olive')) return 'Olive';
    if (lowerCase.includes('tan')) return 'Tan';
    if (lowerCase.includes('porcelain')) return 'Porcelain';
    if (lowerCase.includes('freckled')) return 'Freckled';
    return 'Medium';
};

export const CharacterCreatorV2: React.FC<CharacterCreatorV2Props> = ({ onBack, onCharacterCreated, initialData }) => {
    // Character basic info
    const [characterName, setCharacterName] = useState(initialData?.name || '');

    // Reference images
    const [uploadedHeadshot, setUploadedHeadshot] = useState<string | null>(null);
    const [uploadedBody, setUploadedBody] = useState<string | null>(null);
    const [blueprint, setBlueprint] = useState<CharacterDNA['blueprint'] | null>(null);

    // Manual attributes
    const [gender, setGender] = useState('Female');
    const [age, setAge] = useState('Young Adult (18-25)');
    const [ethnicity, setEthnicity] = useState('Caucasian');
    const [bodyType, setBodyType] = useState('Average');
    const [complexion, setComplexion] = useState('Fair');
    const [features, setFeatures] = useState('None');

    // Editable prompts
    const [headshotPrompt, setHeadshotPrompt] = useState('');
    const [fullBodyPrompt, setFullBodyPrompt] = useState('');

    // Generated anchors
    const [anchorHeadshot, setAnchorHeadshot] = useState<string | null>(null);
    const [anchorBody, setAnchorBody] = useState<string | null>(null);

    // Loading states
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
    const [isGeneratingHead, setIsGeneratingHead] = useState(false);
    const [isGeneratingBody, setIsGeneratingBody] = useState(false);
    const [viewingImage, setViewingImage] = useState<{ url: string; title: string } | null>(null);

    // Model selection
    const [selectedProvider, setSelectedProvider] = useState<AIProvider>(
        (localStorage.getItem('ai_provider') as AIProvider) || AIProvider.GOOGLE
    );
    const [selectedModel, setSelectedModel] = useState<AIModel>(
        selectedProvider === AIProvider.GOOGLE ? AIModel.GEMINI_2_5_FLASH_IMAGE : AIModel.DOUBAO_SEEDREAM
    );

    const headshotInputRef = useRef<HTMLInputElement>(null);
    const bodyInputRef = useRef<HTMLInputElement>(null);

    // Attribute options - memoized to prevent recreation on every render
    const attributeOptions = useMemo(() => ({
        gender: ['Male', 'Female', 'Non-binary'],
        age: ['Child', 'Teenager', 'Young Adult (18-25)', 'Adult (25-40)', 'Middle-aged', 'Senior'],
        ethnicity: ['Asian', 'Black/African', 'Caucasian', 'Hispanic/Latino', 'Middle Eastern', 'South Asian', 'Indigenous', 'Mixed'],
        bodyType: ['Slim', 'Athletic', 'Muscular', 'Curvy', 'Plus-size', 'Average'],
        complexion: ['Fair', 'Medium', 'Olive', 'Tan', 'Dark', 'Porcelain', 'Freckled'],
        features: ['None', 'Tattoos', 'Scars', 'Piercings', 'Glasses', 'Freckles', 'Mole']
    }), []);

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
            const charData = initialData as any;

            if (charData.anchorHeadshot) {
                setAnchorHeadshot(charData.anchorHeadshot);
                setAnchorBody(charData.anchorBody);
                setBlueprint(charData.blueprint);

                if (charData.blueprint) {
                    setHeadshotPrompt(generateHeadshotPrompt(charData.blueprint));
                    setFullBodyPrompt(generateFullBodyPrompt(charData.blueprint));
                }
            }
        }
    }, [initialData]);

    // Image upload handlers
    const handleHeadshotUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedHeadshot(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleBodyUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedBody(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    // Auto-extract attributes from headshot image
    const handleAutoExtract = useCallback(async () => {
        if (!uploadedHeadshot) return;

        setIsAnalyzing(true);

        try {
            const extractedBlueprint = await analyzeCharacterImage(uploadedHeadshot);
            setBlueprint(extractedBlueprint);

            // Populate manual attribute dropdowns from extracted blueprint
            const { identity, style } = extractedBlueprint;
            setGender(identity.gender);
            setAge(identity.ageRange);
            setEthnicity(identity.ethnicity);
            setBodyType(style.bodySomatotype);
            setComplexion(mapComplexion(identity.skinComplexion));

            // Auto-generate prompts
            setHeadshotPrompt(generateHeadshotPrompt(extractedBlueprint));
            setFullBodyPrompt(generateFullBodyPrompt(extractedBlueprint));

            alert('✅ Attributes extracted and prompts generated! Review Panel 2 and adjust as needed.');
        } catch (error: any) {
            console.error('Auto-extract failed:', error);
            const errorMsg = error?.message || error?.toString() || 'Unknown error';
            alert(`Failed to analyze image: ${errorMsg}\n\nPlease check:\n1. Your Gemini API key is set in Settings\n2. The image is clear and contains a person\n3. You have available API quota`);
        } finally {
            setIsAnalyzing(false);
        }
    }, [uploadedHeadshot]);

    // Generate prompts from manual attributes
    const handleGeneratePrompts = useCallback(async () => {
        setIsGeneratingPrompts(true);

        try {
            // Build a blueprint from manual attributes
            const manualBlueprint: CharacterDNA['blueprint'] = {
                identity: {
                    ageRange: age,
                    gender: gender,
                    ethnicity: ethnicity,
                    skinComplexion: `${complexion} complexion`,
                    eyeDetails: 'Expressive eyes',
                    hairDetails: 'Natural hair',
                    distinctiveFeatures: features !== 'None' ? [features] : []
                },
                style: {
                    bodySomatotype: bodyType,
                    clothingStyle: ['Casual'],
                    defaultAccessories: []
                }
            };

            // If we already have a blueprint from auto-extract, merge attributes
            if (blueprint) {
                manualBlueprint.identity = {
                    ...blueprint.identity,
                    ageRange: age,
                    gender: gender,
                    ethnicity: ethnicity,
                    skinComplexion: `${complexion} complexion`
                };
                manualBlueprint.style = {
                    ...blueprint.style,
                    bodySomatotype: bodyType
                };
            }

            setBlueprint(manualBlueprint);

            // Generate prompts from this blueprint
            setHeadshotPrompt(generateHeadshotPrompt(manualBlueprint));
            setFullBodyPrompt(generateFullBodyPrompt(manualBlueprint));

            alert('✅ Prompts generated from attributes! Review Panel 2 before generating images.');
        } catch (error: any) {
            console.error('Prompt generation failed:', error);
            alert('Failed to generate prompts. Please try again.');
        } finally {
            setIsGeneratingPrompts(false);
        }
    }, [age, gender, ethnicity, complexion, features, bodyType, blueprint]);

    // Generate Headshot
    const handleGenerateHeadshot = useCallback(async () => {
        if (!headshotPrompt) {
            alert('Please generate prompts first (Panel 1)');
            return;
        }

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
    }, [headshotPrompt, selectedProvider]);

    // Generate Body
    const handleGenerateBody = useCallback(async () => {
        if (!anchorHeadshot || !fullBodyPrompt || !headshotPrompt) {
            alert('Please generate headshot first');
            return;
        }

        setIsGeneratingBody(true);

        try {
            const body = await generateAnchorBody(anchorHeadshot, fullBodyPrompt, headshotPrompt, selectedProvider);
            setAnchorBody(body);
        } catch (error) {
            console.error('Body generation failed:', error);
            alert('Failed to generate body shot. Please try again or switch providers/models.');
        } finally {
            setIsGeneratingBody(false);
        }
    }, [anchorHeadshot, fullBodyPrompt, headshotPrompt, selectedProvider]);

    // Save character
    const handleSave = useCallback(() => {
        if (!characterName || !blueprint || !anchorHeadshot || !anchorBody) {
            alert('Please complete all steps:\n1. Name your character\n2. Generate prompts\n3. Generate both images');
            return;
        }

        const character: CharacterDNA = {
            id: (initialData as any)?.id?.toString() || Date.now().toString(),
            name: characterName,
            createdAt: (initialData as any)?.createdAt || Date.now(),
            anchorHeadshot,
            anchorBody,
            blueprint
        };

        // Save to gallery
        const items = [
            {
                id: `${character.id}_headshot_${Date.now()}`,
                imageUrl: anchorHeadshot,
                prompt: headshotPrompt,
                timestamp: Date.now(),
                type: 'character-headshot'
            },
            {
                id: `${character.id}_body_${Date.now()}`,
                imageUrl: anchorBody,
                prompt: fullBodyPrompt,
                timestamp: Date.now(),
                type: 'character-body'
            }
        ];

        const gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
        localStorage.setItem('gallery', JSON.stringify([...items, ...gallery]));
        onCharacterCreated(character);
    }, [characterName, blueprint, anchorHeadshot, anchorBody, headshotPrompt, fullBodyPrompt, initialData, onCharacterCreated]);

    // Download image helper
    const handleDownloadImage = useCallback((imageBase64: string, filename: string) => {
        const link = document.createElement('a');
        link.href = imageBase64;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    return (
        <div className="w-full max-w-[1800px] mx-auto animate-fade-in pb-20 px-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                </button>
                <h1 className="text-2xl font-semibold text-white">
                    {initialData ? 'Edit Character' : 'Create AI Character'}
                </h1>
                <div className="w-32"></div> {/* Spacer for centering */}
            </div>

            {/* 3-Panel Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* PANEL 1: References & Attributes */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">1. References & Attributes</h3>

                    {/* Character Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Character Name</label>
                        <input
                            type="text"
                            value={characterName}
                            onChange={(e) => setCharacterName(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g., Sarah Chen"
                        />
                    </div>

                    {/* Reference Images */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div onClick={() => headshotInputRef.current?.click()} className="cursor-pointer">
                            <div className="text-xs font-medium text-slate-300 mb-1">Ref Headshot (Opt)</div>
                            <div className="w-full aspect-square border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center bg-slate-800/30 hover:bg-slate-800/50 transition-all overflow-hidden">
                                {uploadedHeadshot ? (
                                    <img src={uploadedHeadshot} alt="Head" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <span className="text-xl block">👤</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={headshotInputRef} onChange={handleHeadshotUpload} className="hidden" accept="image/*" />
                        </div>
                        <div onClick={() => bodyInputRef.current?.click()} className="cursor-pointer">
                            <div className="text-xs font-medium text-slate-300 mb-1">Ref Body (Opt)</div>
                            <div className="w-full aspect-square border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center bg-slate-800/30 hover:bg-slate-800/50 transition-all overflow-hidden">
                                {uploadedBody ? (
                                    <img src={uploadedBody} alt="Body" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <span className="text-xl block">🧍</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={bodyInputRef} onChange={handleBodyUpload} className="hidden" accept="image/*" />
                        </div>
                    </div>

                    {/* Auto-Extract Button */}
                    {uploadedHeadshot && (
                        <Button
                            onClick={handleAutoExtract}
                            disabled={isAnalyzing}
                            variant="secondary"
                            className="w-full mb-4"
                            size="sm"
                        >
                            {isAnalyzing ? 'Analyzing...' : '🤖 Auto-Extract Attributes'}
                        </Button>
                    )}

                    {/* Attribute Dropdowns */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <Dropdown label="Gender" value={gender} options={attributeOptions.gender} onChange={setGender} />
                        <Dropdown label="Age" value={age} options={attributeOptions.age} onChange={setAge} />
                        <Dropdown label="Ethnicity" value={ethnicity} options={attributeOptions.ethnicity} onChange={setEthnicity} />
                        <Dropdown label="Body Type" value={bodyType} options={attributeOptions.bodyType} onChange={setBodyType} />
                        <Dropdown label="Complexion" value={complexion} options={attributeOptions.complexion} onChange={setComplexion} />
                        <div className="col-span-2">
                            <Dropdown label="Features" value={features} options={attributeOptions.features} onChange={setFeatures} />
                        </div>
                    </div>

                    {/* Generate Prompts Button */}
                    <Button
                        onClick={handleGeneratePrompts}
                        disabled={isGeneratingPrompts}
                        className="w-full"
                    >
                        {isGeneratingPrompts ? 'Generating...' : '✨ Generate Prompts'}
                    </Button>
                    <p className="text-xs text-slate-500 text-center mt-2">
                        Creates headshot & body prompts from attributes
                    </p>
                </div>

                {/* PANEL 2: Edit Prompts */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-4">2. Edit Prompts</h3>

                    {/* Headshot Prompt */}
                    <div className="mb-4 flex-1 flex flex-col">
                        <label className="block text-sm font-medium text-slate-300 mb-2">📷 Headshot Prompt (1:1)</label>
                        <textarea
                            value={headshotPrompt}
                            onChange={(e) => setHeadshotPrompt(e.target.value)}
                            className="flex-1 w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono"
                            placeholder="Generate prompts first (Panel 1)"
                        />
                    </div>

                    {/* Full Body Prompt */}
                    <div className="flex-1 flex flex-col">
                        <label className="block text-sm font-medium text-slate-300 mb-2">🧍 Full Body Prompt (9:16)</label>
                        <textarea
                            value={fullBodyPrompt}
                            onChange={(e) => setFullBodyPrompt(e.target.value)}
                            className="flex-1 w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono"
                            placeholder="Generate prompts first (Panel 1)"
                        />
                    </div>
                </div>

                {/* PANEL 3: Generate Visual Anchors */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">3. Generate Visual Anchors</h3>

                    {/* Provider/Model Selection */}
                    <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-xs font-medium text-slate-300 mb-2">Image Generation Settings</p>
                        <div className="grid grid-cols-2 gap-2">
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
                        <p className="text-xs text-slate-500 mt-2">💡 Switch providers if quota limits</p>
                    </div>

                    {/* Headshot Generator */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-300">A. Headshot (1:1)</p>
                            {anchorHeadshot && (
                                <button
                                    onClick={() => handleDownloadImage(anchorHeadshot, `${characterName}_headshot.png`)}
                                    className="text-indigo-400 hover:text-indigo-300 text-xs"
                                >
                                    ⬇ Download
                                </button>
                            )}
                        </div>
                        {anchorHeadshot ? (
                            <img src={anchorHeadshot} alt="Headshot" className="w-full aspect-square rounded-lg border border-slate-600 object-cover mb-2" />
                        ) : (
                            <div className="w-full aspect-square rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center mb-2">
                                <p className="text-slate-500 text-sm">Not generated yet</p>
                            </div>
                        )}
                        <Button
                            onClick={handleGenerateHeadshot}
                            disabled={isGeneratingHead || !headshotPrompt}
                            variant="primary"
                            size="sm"
                            className="w-full"
                        >
                            {isGeneratingHead ? 'Generating...' : anchorHeadshot ? '🔄 Regenerate' : '✨ Generate Headshot'}
                        </Button>
                    </div>

                    {/* Body Generator */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-300">B. Full Body (9:16)</p>
                            {anchorBody && (
                                <button
                                    onClick={() => handleDownloadImage(anchorBody, `${characterName}_body.png`)}
                                    className="text-indigo-400 hover:text-indigo-300 text-xs"
                                >
                                    ⬇ Download
                                </button>
                            )}
                        </div>
                        {anchorBody ? (
                            <img
                                src={anchorBody}
                                alt="Body"
                                onClick={() => setViewingImage({ url: anchorBody, title: `${characterName} - Full Body` })}
                                className="w-full aspect-[9/16] rounded-lg border border-slate-600 object-cover mb-2 mx-auto cursor-pointer hover:opacity-90 transition-opacity"
                                style={{ maxHeight: '280px' }}
                                title="Click to view full size"
                            />
                        ) : (
                            <div className="w-full aspect-[9/16] rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center mb-2 mx-auto" style={{ maxHeight: '280px' }}>
                                <p className="text-slate-500 text-sm">Not generated yet</p>
                            </div>
                        )}
                        <Button
                            onClick={handleGenerateBody}
                            disabled={!anchorHeadshot || isGeneratingBody || !fullBodyPrompt}
                            variant="primary"
                            size="sm"
                            className="w-full"
                        >
                            {isGeneratingBody ? 'Generating...' : anchorBody ? '🔄 Regenerate' : '✨ Generate Full Body'}
                        </Button>
                        {!anchorHeadshot && (
                            <p className="text-slate-500 text-xs mt-1 text-center">Generate headshot first</p>
                        )}
                    </div>

                    {/* Save Button */}
                    <Button
                        onClick={handleSave}
                        disabled={!anchorHeadshot || !anchorBody}
                        className="w-full"
                    >
                        {initialData ? '💾 Save Changes' : '💾 Save Character'}
                    </Button>
                </div>
            </div>

            {/* Image Viewer Modal */}
            {viewingImage && (
                <div
                    className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-6"
                    onClick={() => setViewingImage(null)}
                >
                    <div className="max-w-4xl">
                        <button
                            onClick={() => setViewingImage(null)}
                            className="text-white mb-2 hover:text-red-400"
                        >
                            ✕ Close
                        </button>
                        <img
                            src={viewingImage.url}
                            alt={viewingImage.title}
                            className="max-h-[85vh] w-auto rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
