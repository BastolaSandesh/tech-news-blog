import * as fs from 'fs';
import * as path from 'path';
import { fetch } from 'undici';
import dotenv from 'dotenv';
import { imageCacheManager } from './imageCache';

// Load environment variables
dotenv.config();

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

interface ImageSource {
    url: string;
    attribution?: string;
}

async function fetchImageFromPexels(query: string): Promise<ImageSource | null> {
    if (!PEXELS_API_KEY) {
        console.log('Pexels API key not found, skipping...');
        return null;
    }

    try {
        console.log('Fetching image from Pexels for query:', query);
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
            {
                headers: {
                    'Authorization': PEXELS_API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Pexels API error: ${response.statusText}`);
        }

        const data = await response.json() as {
            photos?: Array<{
                src?: {
                    large?: string;
                };
                photographer?: string;
            }>;
        };

        if (!data.photos?.length) {
            return null;
        }

        // Randomly select one of the photos
        const randomIndex = Math.floor(Math.random() * data.photos.length);
        const photo = data.photos[randomIndex];

        if (!photo.src?.large) {
            return null;
        }

        return {
            url: photo.src.large,
            attribution: photo.photographer ? `Photo by ${photo.photographer} on Pexels` : undefined
        };
    } catch (error) {
        console.error('Error fetching from Pexels:', error);
        return null;
    }
}

async function fetchImageFromPixabay(query: string): Promise<ImageSource | null> {
    if (!PIXABAY_API_KEY) {
        console.log('Pixabay API key not found, skipping...');
        return null;
    }

    try {
        console.log('Fetching image from Pixabay for query:', query);
        const response = await fetch(
            `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&per_page=10&orientation=horizontal&image_type=photo`,
        );

        if (!response.ok) {
            throw new Error(`Pixabay API error: ${response.statusText}`);
        }

        const data = await response.json() as {
            hits?: Array<{
                largeImageURL?: string;
                user?: string;
            }>;
        };

        if (!data.hits?.length) {
            return null;
        }

        // Randomly select one of the images
        const randomIndex = Math.floor(Math.random() * data.hits.length);
        const image = data.hits[randomIndex];

        if (!image.largeImageURL) {
            return null;
        }

        return {
            url: image.largeImageURL,
            attribution: image.user ? `Photo by ${image.user} on Pixabay` : undefined
        };
    } catch (error) {
        console.error('Error fetching from Pixabay:', error);
        return null;
    }
}

async function fetchImageFromUnsplash(query: string): Promise<ImageSource | null> {
    if (!UNSPLASH_ACCESS_KEY) {
        console.log('Unsplash API key not found, skipping...');
        return null;
    }

    try {
        console.log('Fetching image from Unsplash for query:', query);
        const searchParams = new URLSearchParams({
            query,
            orientation: 'landscape',
            per_page: '10'
        });

        const response = await fetch(
            `https://api.unsplash.com/search/photos?${searchParams}`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.statusText}`);
        }

        const data = await response.json() as {
            results?: Array<{
                urls?: {
                    regular?: string;
                };
                user?: {
                    name?: string;
                };
            }>;
        };

        if (!data.results?.length) {
            return null;
        }

        // Randomly select one of the results
        const randomIndex = Math.floor(Math.random() * data.results.length);
        const result = data.results[randomIndex];

        if (!result.urls?.regular) {
            return null;
        }

        return {
            url: result.urls.regular,
            attribution: result.user?.name ? `Photo by ${result.user.name} on Unsplash` : undefined
        };
    } catch (error) {
        console.error('Error fetching from Unsplash:', error);
        return null;
    }
}

function ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`Created directory: ${dirPath}`);
        } catch (error) {
            console.error(`Failed to create directory ${dirPath}:`, error);
            throw error;
        }
    }
}

function getPublicPath(): string {
    // Start from the current working directory
    let currentDir = process.cwd();
    
    // If we're in the backend directory, go up one level
    if (currentDir.endsWith('backend')) {
        currentDir = path.join(currentDir, '..');
    }
    
    return path.join(currentDir, 'public');
}

export async function downloadImage(query: string, slug: string): Promise<string> {
    try {
        console.log('Starting image download process for:', {
            query,
            slug,
            keys: {
                unsplash: !!UNSPLASH_ACCESS_KEY,
                pexels: !!PEXELS_API_KEY,
                pixabay: !!PIXABAY_API_KEY
            }
        });

        // Function to check if an image URL has been used
        const isImageUnique = (url: string): boolean => !imageCacheManager.isUrlUsed(url);

        // Try each service with uniqueness check
        let imageSource = null;
        
        // Try all services in parallel and get the first unique image
        const [unsplashResult, pexelsResult, pixabayResult] = await Promise.all([
            fetchImageFromUnsplash(query),
            fetchImageFromPexels(query),
            fetchImageFromPixabay(query)
        ]);

        // Filter valid results and check for uniqueness
        const validResults = [unsplashResult, pexelsResult, pixabayResult]
            .filter(result => result?.url && isImageUnique(result.url));

        if (validResults.length > 0) {
            // Randomly select one of the valid unique images
            imageSource = validResults[Math.floor(Math.random() * validResults.length)];
            console.log(`Found unique image from service`);
        }

        if (!imageSource) {
            console.log('No unique images found from any service');
            return '/images/news/placeholder.svg';
        }

        console.log(`Downloading image from: ${imageSource.url}`);
        
        const response = await fetch(imageSource.url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        
        // Get the public directory path
        const publicDir = getPublicPath();
        const imageDir = path.join(publicDir, 'images', 'news');
        console.log('Target image directory:', imageDir);
        
        // Ensure the images directory exists
        ensureDirectoryExists(imageDir);
        
        // Create filename from slug and add attribution if available
        const imageFileName = `${slug}-thumb.jpg`;
        const attributionFileName = `${slug}-attribution.txt`;
        const imagePath = path.join(imageDir, imageFileName);
        console.log('Saving image to:', imagePath);
        
        // Get the image data
        const arrayBuffer = await response.arrayBuffer();
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error('Received empty image data');
        }
        
        // Save the image
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(imagePath, buffer);
        
        // Add to image cache
        imageCacheManager.addUsedUrl(imageSource.url, query);

        // Save attribution if available
        if (imageSource.attribution) {
            const attributionPath = path.join(imageDir, attributionFileName);
            fs.writeFileSync(attributionPath, imageSource.attribution);
        }
        
        console.log('Image saved successfully');
        
        // Return the public URL path
        return `/images/news/${imageFileName}`;
    } catch (error) {
        console.error('Error downloading image:', error);
        return '/images/news/placeholder.svg';
    }
}
