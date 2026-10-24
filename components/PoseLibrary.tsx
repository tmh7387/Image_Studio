import React, { useState } from 'react';
import { PoseAsset } from '../types';
import poseData from './poseLibrary.json';

interface PoseLibraryProps {
    onSelect: (pose: PoseAsset) => void;
    onClose: () => void;
}

export const PoseLibrary: React.FC<PoseLibraryProps> = ({ onSelect, onClose }) => {
    const poses = poseData as PoseAsset[];
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = ['all', 'ecom', 'editorial', 'runway', 'technical'];

    const filteredPoses = selectedCategory === 'all'
        ? poses
        : poses.filter(p => p.category === selectedCategory);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-700 shadow-2xl animate-fade-in">
                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/30">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            👗 Fashion Pose Library
                        </h2>
                        <p className="text-slate-400 text-sm">
                            Select a high-quality anchor pose for your character
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Categories */}
                <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-2 overflow-x-auto">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === cat
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {cat.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Pose Grid */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredPoses.map((pose) => (
                            <div
                                key={pose.id}
                                className="group relative bg-slate-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer border border-slate-700/50"
                                onClick={() => onSelect(pose)}
                            >
                                <div className="aspect-[3/4] relative overflow-hidden bg-slate-900">
                                    <img
                                        src={pose.imageUrl}
                                        alt={pose.id}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                                        <p className="text-white text-xs font-bold truncate mb-1">
                                            {pose.id.split('_').join(' ').toUpperCase()}
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {pose.tags?.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-indigo-500/30 text-indigo-200 rounded-md backdrop-blur-sm">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        {pose.category}
                                    </span>
                                    <span className="text-[10px] text-slate-500 capitalize">
                                        {pose.gender}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-800/30 text-center">
                    <p className="text-slate-500 text-xs">
                        {filteredPoses.length} professional poses available
                    </p>
                </div>
            </div>
        </div>
    );
};
