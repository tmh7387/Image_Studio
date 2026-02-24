import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Button } from './Button';

interface StorageMigrationProps {
    onComplete: () => void;
}

export const StorageMigration: React.FC<StorageMigrationProps> = ({ onComplete }) => {
    const [status, setStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ influencers: number; gallery: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleMigrate = async () => {
        setStatus('migrating');
        setProgress(10);

        try {
            // Perform migration
            setProgress(30);
            const migrationResult = await storageService.migrateFromLocalStorage();
            setProgress(80);

            // Clear old storage
            storageService.clearOldStorage();
            setProgress(100);

            setResult(migrationResult);
            setStatus('success');

            // Auto-complete after 2 seconds
            setTimeout(() => {
                onComplete();
            }, 2000);
        } catch (err) {
            console.error('Migration failed:', err);
            setError(err instanceof Error ? err.message : 'Migration failed');
            setStatus('error');
        }
    };

    const handleSkip = () => {
        // Clear old storage and proceed
        storageService.clearOldStorage();
        onComplete();
    };

    const handleBackup = () => {
        try {
            const influencersData = localStorage.getItem('nanobanana_influencers');
            const galleryData = localStorage.getItem('nanobanana_gallery');

            const backup = {
                version: 1,
                exportedAt: new Date().toISOString(),
                data: {
                    influencers: influencersData ? JSON.parse(influencersData) : [],
                    gallery: galleryData ? JSON.parse(galleryData) : []
                }
            };

            // Create download
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `image-studio-backup-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Backup failed:', error);
            alert('Failed to create backup. Please try again.');
        }
    };

    if (status === 'success') {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm">
                <div className="bg-[#1a1f2e] border border-green-500/30 rounded-2xl p-8 w-full max-w-md text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Migration Complete!</h2>
                    <p className="text-slate-400 mb-4">
                        Successfully migrated {result?.influencers || 0} characters and {result?.gallery || 0} gallery items.
                    </p>
                    <p className="text-sm text-green-400">Redirecting...</p>
                </div>
            </div>
        );
    }

    if (status === 'migrating') {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm">
                <div className="bg-[#1a1f2e] border border-indigo-500/30 rounded-2xl p-8 w-full max-w-md">
                    <h2 className="text-2xl font-bold text-white mb-4 text-center">Migrating Data...</h2>
                    <div className="mb-4">
                        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-center text-slate-400 text-sm mt-2">{progress}%</p>
                    </div>
                    <p className="text-slate-400 text-sm text-center">Please wait while we transfer your data to the new storage system...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-[#1a1f2e] border border-slate-700 rounded-2xl p-8 w-full max-w-lg">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-indigo-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Storage Upgrade Available</h2>
                    <p className="text-slate-400 text-sm">
                        We've upgraded to a new storage system that's more reliable and supports larger data volumes.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-white mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        What This Means
                    </h3>
                    <ul className="text-sm text-slate-400 space-y-1 ml-7">
                        <li>• Your existing characters and images will be transferred</li>
                        <li>• Future data will be stored more reliably</li>
                        <li>• No more "storage quota exceeded" errors</li>
                        <li>• This only takes a few seconds</li>
                    </ul>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        variant="primary"
                        onClick={handleMigrate}
                        disabled={status === 'migrating'}
                        icon={
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        }
                    >
                        Upgrade Storage Now
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={handleBackup}
                        icon={
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        }
                    >
                        Download Backup First
                    </Button>

                    <button
                        onClick={handleSkip}
                        className="text-sm text-slate-500 hover:text-slate-400 transition-colors mt-2"
                    >
                        Skip migration (start fresh)
                    </button>
                </div>
            </div>
        </div>
    );
};
