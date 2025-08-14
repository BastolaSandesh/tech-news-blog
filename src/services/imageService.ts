interface UnsplashImage {
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    html: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

export async function getImageForContent(query: string): Promise<{
  imageUrl: string;
  credit: {
    photographer: string;
    photographerUrl: string;
    sourceUrl: string;
  };
} | null> {
  try {
    // Add tech-related terms to improve image relevance
    const enhancedQuery = `${query} technology digital`;
    const searchParams = new URLSearchParams({
      query: enhancedQuery,
      per_page: '1',
      orientation: 'landscape',
    });

    const response = await fetch(
      `https://api.unsplash.com/search/photos?${searchParams}`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.statusText}`);
    }

    const data = await response.json();
    const image = data.results[0] as UnsplashImage | undefined;

    if (!image) {
      console.warn(`No image found for query: ${query}`);
      return null;
    }

    return {
      imageUrl: image.urls.regular,
      credit: {
        photographer: image.user.name,
        photographerUrl: image.user.links.html,
        sourceUrl: image.links.html,
      },
    };
  } catch (error) {
    console.error('Error fetching image from Unsplash:', error);
    return null;
  }
}

export function generateSearchQuery(content: string, tags: string[]): string {
  // Keywords that map to better search terms
  const keywordMap: Record<string, string> = {
    ai: 'artificial intelligence technology',
    ml: 'machine learning computer',
    gaming: 'video game console',
    cybersecurity: 'cyber security technology',
    privacy: 'data privacy computer',
    quantum: 'quantum computing technology',
    cloud: 'cloud computing server',
    startup: 'tech startup office',
  };

  // Combine title keywords and tags
  const searchTerms = new Set<string>();
  const words = content.toLowerCase().split(/\s+/);

  // Add mapped keywords
  for (const [keyword, replacement] of Object.entries(keywordMap)) {
    if (words.includes(keyword)) {
      searchTerms.add(replacement);
    }
  }

  // Add tags
  tags.forEach(tag => {
    if (keywordMap[tag.toLowerCase()]) {
      searchTerms.add(keywordMap[tag.toLowerCase()]);
    } else {
      searchTerms.add(tag);
    }
  });

  // If no specific terms found, use a generic tech term
  if (searchTerms.size === 0) {
    searchTerms.add('technology digital');
  }

  // Return first search term (most relevant)
  return Array.from(searchTerms)[0];
}

// Fallback images when API fails
export const fallbackImages = {
  ai: "/images/news/ai-microchip-thumb.jpg",
  gaming: "/images/news/gadget-review-thumb.jpg",
  space: "/images/news/space-internet-thumb.jpg",
  cybersecurity: "/images/news/cybersecurity-thumb.jpg",
  privacy: "/images/news/privacy-law-thumb.jpg",
  quantum: "/images/news/quantum-thumb.jpg",
  startup: "/images/news/startup-funding-thumb.jpg",
  supply: "/images/news/supply-chain-chips-thumb.jpg",
  cloud: "/images/news/cloud-outage-thumb.jpg",
  default: "/images/news/ai-policy-thumb.jpg",
};
