import { Vlog } from '../types/Vlog';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fetch } from 'undici';
import { downloadImage } from '../utils/imageDownloader';

const VLOGS_FILE = path.join(__dirname, '../../data/vlogs.json');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize vlogs file if it doesn't exist
if (!fs.existsSync(VLOGS_FILE)) {
    fs.writeFileSync(VLOGS_FILE, JSON.stringify({ vlogs: [] }));
}

// Load vlogs from file
const loadVlogs = (): Vlog[] => {
    try {
        const data = fs.readFileSync(VLOGS_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        return parsed.vlogs || [];
    } catch (error) {
        console.error('Error loading vlogs:', error);
        return [];
    }
};

// Save vlogs to file
const saveVlogs = (vlogs: Vlog[]) => {
    try {
        fs.writeFileSync(VLOGS_FILE, JSON.stringify({ vlogs }, null, 2));
    } catch (error) {
        console.error('Error saving vlogs:', error);
    }
};

// Clean text for YAML frontmatter
const cleanYamlText = (text: string) => {
    return text
        .replace(/"/g, '\\"')  // Escape quotes
        .replace(/\n/g, ' ')   // Remove newlines
        .replace(/\s+/g, ' ')  // Normalize whitespace
        .trim();
};

// Create a news article from vlog content
const createNewsArticle = async (vlog: Vlog) => {
    try {
        // Generate a URL-friendly slug from the title
        const slug = vlog.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        // Extract and clean the first sentence for the summary
        const summary = cleanYamlText(vlog.content.split('.')[0].trim() + '.');

        // Generate tags based on content analysis
        const contentLower = vlog.content.toLowerCase();
        const tags: string[] = []; // Start with empty tags array
        
        // Define keyword to tag mappings
        const tagMappings = {
            'AI': ['ai', 'artificial intelligence', 'machine learning', 'neural network', 'deep learning', 'nlp'],
            'Biotech': ['biotech', 'biotechnology', 'protein', 'genome', 'enzyme', 'molecular'],
            'Gaming': ['gaming', 'game', 'playstation', 'xbox', 'nintendo', 'console'],
            'Security': ['security', 'cybersecurity', 'hack', 'breach', 'privacy', 'encryption'],
            'Cloud': ['cloud', 'aws', 'azure', 'serverless', 'saas', 'paas'],
            'Mobile': ['mobile', 'smartphone', 'android', 'iphone', 'ios', 'app'],
            'Hardware': ['hardware', 'chip', 'semiconductor', 'processor', 'circuit', 'device'],
            'Software': ['software', 'application', 'program', 'code', 'development'],
            'Space': ['space', 'satellite', 'orbit', 'rocket', 'spacecraft', 'astronomy'],
            'Health': ['health', 'medical', 'healthcare', 'medicine', 'treatment', 'patient'],
            'Innovation': ['innovation', 'breakthrough', 'revolutionary', 'novel', 'pioneering'],
            'Research': ['research', 'study', 'scientific', 'discovery', 'experiment', 'laboratory'],
            'Connectivity': ['network', 'internet', 'wireless', '5g', 'broadband', 'communication'],
            'Markets': ['market', 'industry', 'business', 'company', 'startup', 'investment']
        };

        // Add tags based on content keywords
        for (const [tag, keywords] of Object.entries(tagMappings)) {
            if (keywords.some(keyword => contentLower.includes(keyword))) {
                tags.push(tag);
            }
        }

        // Extract key topics and concepts from the content
        const contentWords = vlog.content.toLowerCase().split(/\W+/);
        const titleWords = vlog.title.toLowerCase().split(/\W+/);

        // Define product and technology terms to look for
        const products = ['iphone', 'macbook', 'apple watch', 'pixel', 'xbox', 'playstation'];
        const techTerms = ['ai', '5g', 'blockchain', 'cloud', 'quantum', 'vr', 'ar'];

        // Find mentioned products and tech terms
        const mentionedProducts = products.filter(product => 
            vlog.content.toLowerCase().includes(product) || 
            vlog.title.toLowerCase().includes(product)
        );
        const mentionedTech = techTerms.filter(term => 
            contentWords.includes(term) || 
            titleWords.includes(term)
        );

        // Map content types to specific image queries
        const contentTypeQueries: Record<string, string> = {
            'iphone': 'new iphone design modern',
            'apple watch': 'apple watch features modern',
            'macbook': 'macbook laptop modern',
            'pixel': 'google pixel phone modern',
            'xbox': 'xbox gaming console modern',
            'playstation': 'playstation gaming modern',
            'ai': 'artificial intelligence visualization modern',
            '5g': '5g network technology modern',
            'blockchain': 'blockchain technology modern',
            'cloud': 'cloud computing datacenter modern',
            'quantum': 'quantum computing technology modern',
            'vr': 'virtual reality headset modern',
            'ar': 'augmented reality technology modern'
        };

        // Extract main topic from title (first significant word)
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to'];
        const mainTopic = titleWords.find(word => !stopWords.includes(word)) || '';

        // Build a specific image query
        let imageQuery: string;

        // Check for product mentions first
        const mentionedProduct = mentionedProducts[0];
        if (mentionedProduct && contentTypeQueries[mentionedProduct]) {
            imageQuery = contentTypeQueries[mentionedProduct];
        }
        // Then check for tech terms
        else if (mentionedTech[0] && contentTypeQueries[mentionedTech[0]]) {
            imageQuery = contentTypeQueries[mentionedTech[0]];
        }
        // Then try company mentions
        else if (contentWords.includes('apple')) {
            imageQuery = 'apple technology modern';
        }
        // Use tag-based image if available
        else if (tags.includes('AI')) {
            imageQuery = 'artificial intelligence visualization modern';
        } else if (tags.includes('Cloud')) {
            imageQuery = 'cloud computing technology modern';
        } else if (tags.includes('Security')) {
            imageQuery = 'cybersecurity protection modern';
        } else {
            // Create a specific query combining main topic and context
            imageQuery = `${mainTopic} ${tags[0]?.toLowerCase() || 'technology'} modern`;
        }

        // Add random seed to prevent duplicate images
        const randomSeed = Math.floor(Math.random() * 1000).toString();

        console.log('Using image query:', imageQuery);
        
        // Download image and get its path
        let imagePath = '';
        try {
            imagePath = await downloadImage(imageQuery, slug);
            console.log('Image path:', imagePath);
        } catch (error) {
            console.error('Error fetching image from Unsplash:', error);
            // Set a default fallback image path
            imagePath = '/images/news/placeholder.svg';
        }

        // Create the markdown content with properly escaped YAML
        const markdown = `---
slug: ${slug}
title: "${cleanYamlText(vlog.title)}"
date: ${vlog.timestamp}
summary: "${summary}"
tags: [${tags.join(', ')}]
image: "${imagePath}"
---

${vlog.content}

${vlog.keyTakeaways.length > 0 ? '\nKey takeaways:\n' + vlog.keyTakeaways.map(point => `- ${point}`).join('\n') : ''}
${vlog.sourceUrl ? `\nOriginal source: ${vlog.sourceUrl}` : ''}`;

        // Save the file
        const newsDir = path.join(__dirname, '../../../src/content/news');
        if (!fs.existsSync(newsDir)) {
            fs.mkdirSync(newsDir, { recursive: true });
        }

        const filePath = path.join(newsDir, `${slug}.md`);
        fs.writeFileSync(filePath, markdown);
        console.log('Created news article:', filePath);
        return true;
    } catch (error) {
        console.error('Error creating news article:', error);
        return false;
    }
};

export const addApprovedVlog = async (content: string) => {
    try {
        console.log('Processing approved vlog content...');
        
        // Parse the content to extract title, content, and key takeaways
        const titleMatch = content.match(/Title: (.*?)\n/);
        const contentMatch = content.match(/Content: ([\s\S]*?)(?=Key Takeaways:)/);
        const keyTakeawaysMatch = content.match(/Key Takeaways:\n([\s\S]*?)(?=\n\*Original Source\*:|$)/);
        const sourceUrlMatch = content.match(/\*Original Source\*: (.*?)(?=\n|$)/);
        const techTagsMatch = content.match(/Tech Tags: \[(.*?)\]/);

        console.log('Content parsing results:', {
            hasTitle: !!titleMatch,
            hasContent: !!contentMatch,
            hasKeyTakeaways: !!keyTakeawaysMatch,
            hasSourceUrl: !!sourceUrlMatch,
            hasTechTags: !!techTagsMatch
        });

        if (!titleMatch || !contentMatch) {
            console.error('Could not parse vlog content');
            return;
        }

        const title = titleMatch[1].trim();
        const mainContent = contentMatch[1].trim();
        const keyTakeaways = keyTakeawaysMatch ? 
            keyTakeawaysMatch[1]
                .split('\n')
                .map(item => item.replace(/^\* /, '').trim())
                .filter(item => item.length > 0) : 
            [];
        const sourceUrl = sourceUrlMatch ? sourceUrlMatch[1].trim() : '';

        const vlog: Vlog = {
            id: uuidv4(),
            title,
            content: mainContent,
            keyTakeaways,
            sourceUrl,
            timestamp: new Date().toISOString()
        };

        // Save to vlogs.json
        const vlogs = loadVlogs();
        vlogs.unshift(vlog); // Add new vlog at the beginning
        saveVlogs(vlogs);

        // Create news article
        await createNewsArticle(vlog);

        console.log('Successfully added new vlog and created news article:', vlog.title);
    } catch (error) {
        console.error('Error adding vlog:', error);
    }
};

export const fetchApprovedVlogs = (page = 1, pageSize = 10) => {
    try {
        const vlogs = loadVlogs();
        const startIdx = (page - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        
        return {
            vlogs: vlogs.slice(startIdx, endIdx),
            total: vlogs.length,
            page,
            pageSize
        };
    } catch (error) {
        console.error('Error fetching vlogs:', error);
        return {
            vlogs: [],
            total: 0,
            page,
            pageSize
        };
    }
};