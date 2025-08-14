import { downloadImage } from './utils/imageDownloader';

async function testImageDownload() {
    try {
        console.log('Testing image download with different queries...');
        
        const tests = [
            { query: 'artificial intelligence technology', slug: 'ai-test' },
            { query: 'blockchain cryptocurrency', slug: 'crypto-test' },
            { query: 'cloud computing server', slug: 'cloud-test' }
        ];

        for (const test of tests) {
            console.log(`\nTesting query: ${test.query}`);
            const imagePath = await downloadImage(test.query, test.slug);
            console.log(`Result: ${imagePath}`);
        }
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testImageDownload();
