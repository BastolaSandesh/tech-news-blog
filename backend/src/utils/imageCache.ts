import * as fs from 'fs';
import * as path from 'path';

interface ImageCache {
    usedUrls: Set<string>;
    usedQueries: Map<string, string[]>;
    lastUpdated: string;
}

class ImageCacheManager {
    private static instance: ImageCacheManager;
    private cachePath: string;
    private cache: ImageCache;

    private constructor() {
        this.cachePath = path.join(process.cwd(), 'data', 'imageCache.json');
        this.cache = this.loadCache();
    }

    public static getInstance(): ImageCacheManager {
        if (!ImageCacheManager.instance) {
            ImageCacheManager.instance = new ImageCacheManager();
        }
        return ImageCacheManager.instance;
    }

    private loadCache(): ImageCache {
        try {
            if (fs.existsSync(this.cachePath)) {
                const data = JSON.parse(fs.readFileSync(this.cachePath, 'utf8'));
                return {
                    usedUrls: new Set(data.usedUrls || []),
                    usedQueries: new Map(Object.entries(data.usedQueries || {})),
                    lastUpdated: data.lastUpdated || new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('Error loading image cache:', error);
        }

        return {
            usedUrls: new Set(),
            usedQueries: new Map(),
            lastUpdated: new Date().toISOString()
        };
    }

    private saveCache(): void {
        try {
            const dir = path.dirname(this.cachePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const data = {
                usedUrls: Array.from(this.cache.usedUrls),
                usedQueries: Object.fromEntries(this.cache.usedQueries),
                lastUpdated: new Date().toISOString()
            };

            fs.writeFileSync(this.cachePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving image cache:', error);
        }
    }

    public isUrlUsed(url: string): boolean {
        return this.cache.usedUrls.has(url);
    }

    public addUsedUrl(url: string, query: string): void {
        this.cache.usedUrls.add(url);
        
        const queryUrls = this.cache.usedQueries.get(query) || [];
        queryUrls.push(url);
        this.cache.usedQueries.set(query, queryUrls);
        
        this.saveCache();
    }

    public getUsedUrlsForQuery(query: string): string[] {
        return this.cache.usedQueries.get(query) || [];
    }

    public clearOldEntries(daysToKeep: number = 30): void {
        const now = new Date();
        const cutoff = new Date(now.setDate(now.getDate() - daysToKeep));

        // Clear old entries based on last updated time
        if (new Date(this.cache.lastUpdated) < cutoff) {
            this.cache.usedUrls.clear();
            this.cache.usedQueries.clear();
            this.cache.lastUpdated = new Date().toISOString();
            this.saveCache();
        }
    }
}

export const imageCacheManager = ImageCacheManager.getInstance();
