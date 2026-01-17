import React, { useState, useRef, useEffect } from 'react';
import { generateContent, analyzeCharacterImage } from '../services/aiService'; // Updated service import
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { Influencer } from '../types';

interface CharacterCreatorProps {
  onBack: () => void;
  onCharacterCreated: (influencer: Influencer) => void;
  initialData?: Influencer;
}

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onBack, onCharacterCreated, initialData }) => {
  const [step, setStep] = useState<number>(1);
  const isEditMode = !!initialData;
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Physical Attributes State
  const [characterStyle, setCharacterStyle] = useState('Realistic');
  const [gender, setGender] = useState('Female');
  const [age, setAge] = useState('Young Adult (18-25)');
  const [ethnicity, setEthnicity] = useState('Caucasian');
  const [bodyType, setBodyType] = useState('Average');
  const [height, setHeight] = useState('Average');
  const [complexion, setComplexion] = useState('Fair');
  const [distinguishingFeatures, setDistinguishingFeatures] = useState('None');

  // Images
  const [targetFace, setTargetFace] = useState<string | null>(null);
  const [trainingImages, setTrainingImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetFaceInputRef = useRef<HTMLInputElement>(null);
  const analysisInputRef = useRef<HTMLInputElement>(null);

  // Initialize data if editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setCharacterStyle(initialData.characterStyle || 'Realistic');
      setGender(initialData.gender || 'Female');
      setAge(initialData.age || 'Young Adult (18-25)');
      setEthnicity(initialData.ethnicity || 'Caucasian');
      setBodyType(initialData.bodyType || 'Average');
      setHeight(initialData.height || 'Average');
      setComplexion(initialData.complexion || 'Fair');
      setDistinguishingFeatures(initialData.distinguishingFeatures || 'None');

      // Load image data
      if (initialData.avatarUrl) {
        setTargetFace(initialData.avatarUrl);
      }
      if (initialData.trainingImages) {
        setTrainingImages(initialData.trainingImages);
      }
    }
  }, [initialData]);

  // Options Data
  const styleOptions = ['Realistic', '3D Render', 'Anime', 'Cyberpunk', 'Oil Painting']; // Expanded options logic would go here
  const genderOptions = ['Male', 'Female', 'Non-binary'];
  const ageOptions = ['Child', 'Teenager', 'Young Adult (18-25)', 'Adult (25-40)', 'Middle-aged', 'Senior'];
  const ethnicityOptions = ['Asian', 'Black/African', 'Caucasian', 'Hispanic/Latino', 'Middle Eastern', 'South Asian', 'Indigenous', 'Mixed'];
  const bodyTypeOptions = ['Slim', 'Athletic', 'Muscular', 'Curvy', 'Plus-size', 'Average', 'Ectomorph', 'Mesomorph', 'Endomorph'];
  const heightOptions = ['Short', 'Average', 'Tall'];
  const complexionOptions = ['Fair', 'Medium', 'Olive', 'Tan', 'Dark', 'Porcelain', 'Freckled'];
  const featureOptions = ['None', 'Tattoos', 'Scars', 'Piercings', 'Glasses', 'Cyborg Enhancements', 'Freckles', 'Mole'];

  const handleStep1Submit = () => {
    if (name) {
      setStep(2);
    }
  };

  const handleAnalysisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsAnalyzing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          // 1. Analyze
          const dna = await analyzeCharacterImage(base64);
          if (dna && dna.bio) {
            // 2. Auto-fill
            if (dna.bio.ageRange) setAge(dna.bio.ageRange); // Need mapping logic or flexible input? Using flexible for now or assuming close match.
            if (dna.bio.gender) setGender(dna.bio.gender);
            if (dna.bio.ethnicity) setEthnicity(dna.bio.ethnicity);
            if (dna.bio.bodySomatotype) setBodyType(dna.bio.bodySomatotype);
            if (dna.bio.facialFeatures) setDistinguishingFeatures(dna.bio.facialFeatures.join(', '));

            // Also set description from style
            if (dna.stylePreferences?.clothingStyle) {
              setDescription(`Wearing ${dna.stylePreferences.clothingStyle.join(', ')}.`);
            }

            // 3. Set as Target Face automatically
            setTargetFace(base64);
          }
        } catch (err) {
          console.error("Analysis Failed", err);
          alert("Could not analyze image. Please try again.");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTargetFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTargetFace(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTrainingImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setTrainingImages(prev => {
            if (prev.length >= 50) return prev;
            return [...prev, reader.result as string];
          });
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const handleFinish = () => {
    const newInfluencer: Influencer = {
      // Use existing ID if editing, otherwise create new
      id: initialData ? initialData.id : Date.now(),
      name: name,
      description: description,
      gender: gender,
      avatarUrl: targetFace || trainingImages[0] || undefined,
      trainingImages: trainingImages,
      imageColor: initialData?.imageColor || 'bg-indigo-600',
      // New fields
      characterStyle,
      age,
      ethnicity,
      bodyType,
      height,
      complexion,
      distinguishingFeatures
    };
    onCharacterCreated(newInfluencer);
  };

  const renderStep1 = () => (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-0">{isEditMode ? 'Edit AI Character' : 'Create AI Character'}</h2>
        <button
          onClick={() => analysisInputRef.current?.click()}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center"
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Extracting DNA...
            </>
          ) : (
            <>
              <span className="mr-2">✨</span> Auto-Fill from Photo
            </>
          )}
        </button>
        <input type="file" ref={analysisInputRef} onChange={handleAnalysisUpload} className="hidden" accept="image/*" />
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Character Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
            placeholder="e.g. Cyber Samurai"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Dropdown
            label="Character Style"
            value={characterStyle}
            options={styleOptions}
            onChange={setCharacterStyle}
          />
          <Dropdown
            label="Gender"
            value={gender}
            options={genderOptions}
            onChange={setGender}
          />
          <Dropdown
            label="Age"
            value={age}
            options={ageOptions}
            onChange={setAge}
          />
          <Dropdown
            label="Ethnicity"
            value={ethnicity}
            options={ethnicityOptions}
            onChange={setEthnicity}
          />
          <Dropdown
            label="Body Type"
            value={bodyType}
            options={bodyTypeOptions}
            onChange={setBodyType}
          />
          <Dropdown
            label="Height"
            value={height}
            options={heightOptions}
            onChange={setHeight}
          />
          <Dropdown
            label="Complexion"
            value={complexion}
            options={complexionOptions}
            onChange={setComplexion}
          />
          <Dropdown
            label="Distinguishing Features"
            value={distinguishingFeatures}
            options={featureOptions}
            onChange={setDistinguishingFeatures}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Description / Backstory</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-32 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none placeholder-slate-500"
            placeholder="Describe the character's personality, outfit style, and role..."
          ></textarea>
        </div>

        <div className="pt-4">
          <Button
            className="w-full"
            onClick={handleStep1Submit}
            disabled={!name}
          >
            Next: Character Appearance
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-fade-in max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Default target face</h2>
      </div>

      <p className="text-sm text-slate-400 mb-4">
        This image will be used as the primary anchor for generation. Choose a clear, high-quality close-up of the face.
      </p>

      <div className="mb-6">
        {!targetFace ? (
          <div
            onClick={() => targetFaceInputRef.current?.click()}
            className="w-full h-64 border-2 border-dashed border-slate-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-800/30 transition-all group"
          >
            <p className="text-white font-medium">Drag & drop or click to select files</p>
          </div>
        ) : (
          <div className="relative w-full h-64 bg-black/40 rounded-2xl border border-slate-600 overflow-hidden group">
            <img src={targetFace} alt="Target" className="w-full h-full object-contain" />
            <button
              onClick={() => setTargetFace(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-500/80 rounded-full text-white transition-colors"
            >
              Remove
            </button>
          </div>
        )}
        <input type="file" ref={targetFaceInputRef} onChange={handleTargetFaceUpload} className="hidden" accept="image/*" />
      </div>

      <div className="flex gap-4">
        <Button className="w-full" variant="secondary" onClick={() => setStep(1)}>Back</Button>
        <Button className="w-full" onClick={() => setStep(3)} disabled={!targetFace}>Next</Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-8 text-center">{isEditMode ? 'Update AI Character' : 'Train AI Character'}</h2>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Upload up to 50 images</h3>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>{trainingImages.length} / 50 files (min 10 required)</span>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full min-h-[200px] border-2 border-dashed border-slate-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-800/30 transition-all p-4"
          >
            {trainingImages.length === 0 ? (
              <p className="text-white font-medium">Drag & drop or click to select files</p>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-4 w-full">
                {trainingImages.map((img, idx) => (
                  <div key={idx} className="aspect-square relative group rounded-lg overflow-hidden border border-slate-700 bg-black/40">
                    <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleTrainingImagesUpload}
            className="hidden"
            accept="image/*"
            multiple
          />
        </div>

        <div className="flex gap-4">
          <Button className="w-1/3" variant="secondary" onClick={() => setStep(2)}>Back</Button>
          <Button
            className="w-full"
            onClick={handleFinish}
            disabled={trainingImages.length < 10}
            variant={trainingImages.length >= 10 ? 'primary' : 'secondary'}
          >
            {isEditMode ? 'Save Changes' : (trainingImages.length < 10 ? `Upload ${10 - trainingImages.length} more images` : 'Start Training')}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="mb-6 text-slate-400 hover:text-white flex items-center">
        ← Back to Dashboard
      </button>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
};