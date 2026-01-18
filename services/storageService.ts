/**
 * IndexedDB Storage Service
 * Handles all persistent storage for characters and gallery items
 */

import { Influencer, GalleryItem } from '../types';

const DB_NAME = 'image_studio_db';
const DB_VERSION = 1;
const STORE_INFLUENCERS = 'influencers';
const STORE_GALLERY = 'gallery';

class StorageService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialize the database
     */
    async init(): Promise<void> {
        if (this.db) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create influencers store
                if (!db.objectStoreNames.contains(STORE_INFLUENCERS)) {
                    const influencerStore = db.createObjectStore(STORE_INFLUENCERS, { keyPath: 'id' });
                    influencerStore.createIndex('name', 'name', { unique: false });
                    influencerStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Create gallery store
                if (!db.objectStoreNames.contains(STORE_GALLERY)) {
                    const galleryStore = db.createObjectStore(STORE_GALLERY, { keyPath: 'id' });
                    galleryStore.createIndex('timestamp', 'timestamp', { unique: false });
                    galleryStore.createIndex('type', 'type', { unique: false });
                    galleryStore.createIndex('influencerId', 'influencerId', { unique: false });
                }
            };
        });

        return this.initPromise;
    }

    /**
     * Get all influencers
     */
    async getAllInfluencers(): Promise<Influencer[]> {
        await this.init();
        return this.getAll<Influencer>(STORE_INFLUENCERS);
    }

    /**
     * Save influencer (create or update)
     */
    async saveInfluencer(influencer: Influencer): Promise<void> {
        await this.init();
        return this.put(STORE_INFLUENCERS, influencer);
    }

    /**
     * Delete influencer
     */
    async deleteInfluencer(id: string | number): Promise<void> {
        await this.init();
        return this.delete(STORE_INFLUENCERS, id);
    }

    /**
     * Get all gallery items
     */
    async getAllGalleryItems(): Promise<GalleryItem[]> {
        await this.init();
        const items = await this.getAll<GalleryItem>(STORE_GALLERY);
        // Sort by timestamp descending (newest first)
        return items.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Save gallery item
     */
    async saveGalleryItem(item: GalleryItem): Promise<void> {
        await this.init();
        return this.put(STORE_GALLERY, item);
    }

    /**
     * Delete gallery item
     */
    async deleteGalleryItem(id: string): Promise<void> {
        await this.init();
        return this.delete(STORE_GALLERY, id);
    }

    /**
     * Clear all data (for reset/cleanup)
     */
    async clearAll(): Promise<void> {
        await this.init();
        await this.clear(STORE_INFLUENCERS);
        await this.clear(STORE_GALLERY);
    }

    /**
     * Export all data as JSON
     */
    async exportData(): Promise<string> {
        await this.init();
        const influencers = await this.getAllInfluencers();
        const gallery = await this.getAllGalleryItems();

        const backup = {
            version: 1,
            exportedAt: new Date().toISOString(),
            data: {
                influencers,
                gallery
            }
        };

        return JSON.stringify(backup, null, 2);
    }

    /**
     * Import data from JSON backup
     */
    async importData(jsonData: string): Promise<{ influencers: number; gallery: number }> {
        await this.init();

        try {
            const backup = JSON.parse(jsonData);

            if (!backup.data) {
                throw new Error('Invalid backup format');
            }

            const { influencers = [], gallery = [] } = backup.data;

            // Import influencers
            for (const influencer of influencers) {
                await this.saveInfluencer(influencer);
            }

            // Import gallery items
            for (const item of gallery) {
                await this.saveGalleryItem(item);
            }

            return {
                influencers: influencers.length,
                gallery: gallery.length
            };
        } catch (error) {
            console.error('Import failed:', error);
            throw new Error('Failed to parse backup file. Please check the file format.');
        }
    }

    /**
     * Migrate data from localStorage to IndexedDB
     */
    async migrateFromLocalStorage(): Promise<{ influencers: number; gallery: number }> {
        await this.init();

        let influencerCount = 0;
        let galleryCount = 0;

        try {
            // Migrate influencers
            const influencersData = localStorage.getItem('nanobanana_influencers');
            if (influencersData) {
                const influencers: Influencer[] = JSON.parse(influencersData);
                for (const influencer of influencers) {
                    await this.saveInfluencer(influencer);
                    influencerCount++;
                }
            }

            // Migrate gallery
            const galleryData = localStorage.getItem('nanobanana_gallery');
            if (galleryData) {
                const gallery: GalleryItem[] = JSON.parse(galleryData);
                for (const item of gallery) {
                    await this.saveGalleryItem(item);
                    galleryCount++;
                }
            }

            return { influencers: influencerCount, gallery: galleryCount };
        } catch (error) {
            console.error('Migration error:', error);
            throw new Error('Failed to migrate data from localStorage');
        }
    }

    /**
     * Check if migration is needed
     */
    needsMigration(): boolean {
        const hasOldInfluencers = localStorage.getItem('nanobanana_influencers');
        const hasOldGallery = localStorage.getItem('nanobanana_gallery');
        return !!(hasOldInfluencers || hasOldGallery);
    }

    /**
     * Clear localStorage after successful migration
     */
    clearOldStorage(): void {
        localStorage.removeItem('nanobanana_influencers');
        localStorage.removeItem('nanobanana_gallery');
    }

    /**
     * Get storage usage estimate
     */
    async getStorageEstimate(): Promise<{ usage: number; quota: number; percentage: number }> {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const usage = estimate.usage || 0;
            const quota = estimate.quota || 0;
            const percentage = quota > 0 ? (usage / quota) * 100 : 0;

            return { usage, quota, percentage };
        }

        return { usage: 0, quota: 0, percentage: 0 };
    }

    // ===== Generic IndexedDB Helpers =====

    private async getAll<T>(storeName: string): Promise<T[]> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    private async put<T>(storeName: string, data: T): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private async delete(storeName: string, key: string | number): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private async clear(storeName: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Export singleton instance
export const storageService = new StorageService();
