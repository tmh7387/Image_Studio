import React, { useRef } from 'react';

interface ImageUploaderProps {
  selectedImage: string | null;
  onImageSelect: (base64: string, mimeType: string) => void;
  onImageRemove: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ selectedImage, onImageSelect, onImageRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      onImageSelect(result, file.type);
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-slate-300 ml-1">Reference Image (Optional)</label>
      
      {!selectedImage ? (
        <div 
          onClick={triggerUpload}
          className="group relative w-full h-64 border-2 border-dashed border-slate-600 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-800/30 hover:bg-slate-800/50"
        >
          <div className="p-3 rounded-full bg-slate-700/50 group-hover:bg-indigo-500/20 transition-colors mb-2">
             <svg className="w-8 h-8 text-slate-400 group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
          </div>
          <span className="text-sm text-slate-400 group-hover:text-slate-300 mt-2">Click to upload reference</span>
        </div>
      ) : (
        <div className="relative w-full min-h-[16rem] max-h-[600px] rounded-xl overflow-hidden border border-slate-600 group bg-black/40 flex items-center justify-center">
          <img src={selectedImage} alt="Reference" className="max-w-full max-h-[600px] object-contain" />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onImageRemove(); }}
              className="px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white text-sm rounded-full backdrop-blur-sm transition-colors shadow-lg"
            >
              Remove Image
            </button>
          </div>
        </div>
      )}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};