import React, { useState, useEffect } from 'react';
import { GalleryItem } from '../types';
import { Button } from './Button';

interface ImageLightboxProps {
    images: GalleryItem[];
    initialIndex: number;
    onClose: () => void;
    onDelete?: (id: string) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
    images,
    initialIndex,
    onClose,
    onDelete
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const currentImage = images[currentIndex];

    // Navigation functions
    const goNext = () => {
        setCurrentIndex((i) => (i + 1) % images.length);
    };

    const goPrev = () => {
        setCurrentIndex((i) => (i - 1 + images.length) % images.length);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [currentIndex]);

    // Prevent body scroll when lightbox is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Download image
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = currentImage.imageUrl;
        link.download = `image-studio-${currentImage.id}.png`;
        link.click();
    };

    // Copy prompt to clipboard
    const handleCopyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(currentImage.prompt);
            alert('Prompt copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Delete handler
    const handleDelete = () => {
        if (window.confirm('Delete this image?')) {
            onDelete?.(currentImage.id);

            // Navigate to next image or close if last one
            if (images.length === 1) {
                onClose();
            } else if (currentIndex === images.length - 1) {
                setCurrentIndex(currentIndex - 1);
            }
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    // Get type badge color
    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'generation': return 'bg-indigo-600';
            case 'faceswap': return 'bg-pink-600';
            case 'editing': return 'bg-green-600';
            case 'image-to-prompt': return 'bg-yellow-600';
            case 'character-prompt': return 'bg-purple-600';
            default: return 'bg-slate-600';
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white text-2xl transition-colors"
                aria-label="Close"
            >
                ✕
            </button>

            {/* Image counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-black/50 rounded-full text-white text-sm">
                {currentIndex + 1} / {images.length}
            </div>

            {/* Main content area */}
            <div className="h-full flex items-center justify-center px-4 lg:pr-96" onClick={(e) => e.stopPropagation()}>

                {/* Left arrow */}
                {images.length > 1 && (
                    <button
                        onClick={goPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white text-2xl transition-colors z-10"
                        aria-label="Previous image"
                    >
                        ←
                    </button>
                )}

                {/* Image */}
                <div className="max-w-full max-h-[90vh] flex items-center justify-center">
                    <img
                        src={currentImage.imageUrl}
                        alt={currentImage.prompt}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

                {/* Right arrow */}
                {images.length > 1 && (
                    <button
                        onClick={goNext}
                        className="absolute right-4 lg:right-96 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white text-2xl transition-colors z-10"
                        aria-label="Next image"
                    >
                        →
                    </button>
                )}
            </div>

            {/* Metadata sidebar (desktop) */}
            <div
                className="absolute right-0 top-0 h-full w-96 bg-slate-900 border-l border-slate-700 p-6 overflow-y-auto hidden lg:block"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold text-white mb-4">Details</h3>

                {/* Type badge */}
                <div className="mb-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${getTypeBadgeColor(currentImage.type)}`}>
                        {currentImage.type.replace('-', ' ').toUpperCase()}
                    </span>
                </div>

                {/* Timestamp */}
                <div className="mb-6">
                    <p className="text-slate-500 text-sm">{formatTimestamp(currentImage.timestamp)}</p>
                </div>

                {/* Prompt */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Prompt</label>
                    <div className="bg-slate-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <p className="text-white text-sm leading-relaxed">{currentImage.prompt}</p>
                    </div>
                    <button
                        onClick={handleCopyPrompt}
                        className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Prompt
                    </button>
                </div>

                {/* Character reference (if available) */}
                {currentImage.influencerId && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Character</label>
                        <p className="text-white text-sm">Character ID: {currentImage.influencerId}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <Button
                        onClick={handleDownload}
                        variant="secondary"
                        className="w-full"
                        icon={
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        }
                    >
                        Download Image
                    </Button>

                    {onDelete && (
                        <button
                            onClick={handleDelete}
                            className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Image
                        </button>
                    )}
                </div>

                {/* Keyboard shortcuts hint */}
                <div className="mt-8 pt-6 border-t border-slate-700">
                    <p className="text-slate-500 text-xs mb-2">Keyboard Shortcuts</p>
                    <div className="space-y-1 text-xs text-slate-400">
                        <div className="flex justify-between">
                            <span>Close</span>
                            <kbd className="px-2 py-1 bg-slate-800 rounded">Esc</kbd>
                        </div>
                        <div className="flex justify-between">
                            <span>Previous</span>
                            <kbd className="px-2 py-1 bg-slate-800 rounded">←</kbd>
                        </div>
                        <div className="flex justify-between">
                            <span>Next</span>
                            <kbd className="px-2 py-1 bg-slate-800 rounded">→</kbd>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile metadata (bottom sheet) */}
            <div
                className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-4 lg:hidden max-h-[40vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${getTypeBadgeColor(currentImage.type)}`}>
                        {currentImage.type.replace('-', ' ').toUpperCase()}
                    </span>
                    <span className="ml-2 text-slate-500 text-sm">{formatTimestamp(currentImage.timestamp)}</span>
                </div>

                <div className="mb-4">
                    <p className="text-white text-sm leading-relaxed line-clamp-3">{currentImage.prompt}</p>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={handleDownload}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                    >
                        Download
                    </Button>
                    {onDelete && (
                        <button
                            onClick={handleDelete}
                            className="flex-1 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
