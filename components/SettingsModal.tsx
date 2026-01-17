import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { AIProvider } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [geminiKey, setGeminiKey] = useState('');
    const [cometKey, setCometKey] = useState('');
    const [provider, setProvider] = useState<AIProvider>(AIProvider.GOOGLE);
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setGeminiKey(localStorage.getItem('gemini_api_key') || '');
            setCometKey(localStorage.getItem('comet_api_key') || '');
            const storedProvider = localStorage.getItem('ai_provider') as AIProvider;
            setProvider(storedProvider || AIProvider.GOOGLE);
        }
    }, [isOpen]);

    const handleSave = () => {
        // Save Gemini Key
        if (geminiKey.trim()) localStorage.setItem('gemini_api_key', geminiKey.trim());
        else localStorage.removeItem('gemini_api_key');

        // Save Comet Key
        if (cometKey.trim()) localStorage.setItem('comet_api_key', cometKey.trim());
        else localStorage.removeItem('comet_api_key');

        // Save Provider
        localStorage.setItem('ai_provider', provider);

        window.location.reload();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1a1f2e] border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl transform transition-all scale-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">AI Settings</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-6 mb-8">

                    {/* Provider Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">AI Provider</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setProvider(AIProvider.GOOGLE)}
                                className={`p-3 rounded-lg border flex flex-col items-center justify-center text-sm font-medium transition-all ${provider === AIProvider.GOOGLE
                                        ? 'bg-indigo-600 border-indigo-500 text-white'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                <span>Google Gemini</span>
                                <span className="text-[10px] opacity-70 mt-1">Native Integration</span>
                            </button>
                            <button
                                onClick={() => setProvider(AIProvider.COMET)}
                                className={`p-3 rounded-lg border flex flex-col items-center justify-center text-sm font-medium transition-all ${provider === AIProvider.COMET
                                        ? 'bg-purple-600 border-purple-500 text-white'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                <span>CometAPI</span>
                                <span className="text-[10px] opacity-70 mt-1">Multi-Model Aggregator</span>
                            </button>
                        </div>
                    </div>

                    {/* Conditional Inputs */}
                    {provider === AIProvider.GOOGLE ? (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Gemini API Key
                            </label>
                            <div className="relative">
                                <input
                                    type={showKey ? "text" : "password"}
                                    value={geminiKey}
                                    onChange={(e) => setGeminiKey(e.target.value)}
                                    placeholder="AIzaSy..."
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-600 font-mono text-sm pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    {showKey ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Get a key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline">Google AI Studio</a>.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Comet API Key
                            </label>
                            <div className="relative">
                                <input
                                    type={showKey ? "text" : "password"}
                                    value={cometKey}
                                    onChange={(e) => setCometKey(e.target.value)}
                                    placeholder="sk-..."
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-slate-600 font-mono text-sm pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    {showKey ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Using models: <span className="text-purple-300">gemini-3-pro, doubao-seedream, grok-4</span>
                            </p>
                        </div>
                    )}

                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>Save & Reload</Button>
                </div>
            </div>
        </div>
    );
};
