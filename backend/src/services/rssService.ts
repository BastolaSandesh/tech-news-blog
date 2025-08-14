import Parser from "rss-parser";
import axios from "axios";
import { addApprovedVlog } from "../controllers/vlogController";

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, application/atom+xml, text/xml;q=0.9, */*;q=0.8'
  },
  timeout: 10000, // 10 seconds
  requestOptions: {
    rejectUnauthorized: false // For testing only, handle SSL certificates
  }
});

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = "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";

const RSS_FEED_URLS = [
  "https://feeds.feedburner.com/TechCrunch",
  "https://www.engadget.com/rss.xml",
  "https://rss.slashdot.org/Slashdot/slashdotMain",
  "https://feeds.arstechnica.com/arstechnica/index",
  "https://news.ycombinator.com/rss",
];

export const getRSSFeeds = async () => {
  try {
    console.log("Fetching RSS feeds from URLs:", RSS_FEED_URLS);
    const feedPromises = RSS_FEED_URLS.map(async (url) => {
      try {
        console.log(`Fetching feed from ${url}...`);
        let feed;
        
        try {
          // First try with RSS parser
          feed = await parser.parseURL(url);
        } catch (parserError) {
          console.log(`RSS parser failed for ${url}, trying with axios...`);
          // Fallback to axios if RSS parser fails
          const response = await axios.get(url);
          feed = await parser.parseString(response.data);
        }

        if (!feed || !feed.items) {
          console.error(`No items found in feed from ${url}`);
          return [];
        }

        console.log(`Successfully fetched ${feed.items.length} items from ${url}`);
        return feed.items.map((item) => ({
          title: item.title || 'No Title',
          link: item.link || url,
          pubDate: item.pubDate || new Date().toISOString(),
          contentSnippet: item.contentSnippet || item.content || item.description || 'No content available',
        }));
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error fetching feed from ${url}:`, errorMessage);
        console.error('Full error:', error);
        return [];
      }
    });

    const feeds = await Promise.all(feedPromises);
    const flattenedFeeds = feeds.flat();
    console.log(`Total feeds fetched: ${flattenedFeeds.length}`);
    
    if (flattenedFeeds.length === 0) {
      throw new Error('No feeds were successfully fetched');
    }
    
    return flattenedFeeds;
  } catch (error) {
    console.error("Error in getRSSFeeds:", error);
    throw error;
  }
};

export const rewriteContentWithLLM = async (content: string) => {
  try {
    console.log("Sending content to LLM for rewriting:", content.substring(0, 100) + "...");
    
    const systemPrompt = `You are a professional tech journalist. Your task is to:
    1. Rewrite the given technology news article in a clear, engaging style
    2. Keep the main facts and technical details accurate
    3. Add a catchy title that includes the main technology or company name
    4. Include key takeaways or implications
    5. Include relevant tech sector tags (e.g., AI, Cloud, Hardware, Software, etc.)
    6. Format the output EXACTLY as:
       Title: [Your title]
       Content: [Your rewritten article]
       Key Takeaways:
       * [First key point]
       * [Second key point]
       * [Third key point]
       Tech Tags: [AI, Cloud, Hardware, etc.]
       *Original Source*: [URL from input]`;

    // Log detailed request information
    console.log('Sending request to Groq API:', {
      url: GROQ_API_URL,
      model: "llama-3.3-70b-versatile",
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });
    
    console.log('System prompt:', systemPrompt);
    console.log('Content preview:', content.substring(0, 200) + '...');

    console.log("Making API request to Groq...");
    
    // Validate input content
    if (!content || content.length < 10) {
      throw new Error("Content too short or empty");
    }

    // Prepare request body with proper validation
    const requestBody = {
      model: "llama-3.3-70b-versatile",  // Using the supported Llama 3.3 model
      messages: [
        { 
          role: "system", 
          content: systemPrompt.trim()
        },
        { 
          role: "user", 
          content: content.trim().substring(0, 4000)  // Ensure content is within limits
        }
      ],
      temperature: 0.7,  // Slightly increased for more creative output
      max_tokens: 2000,  // Increased for longer responses
      top_p: 0.9,
      frequency_penalty: 0.1,  // Reduced to allow some repetition when needed
      presence_penalty: 0.1,  // Reduced to allow some repetition when needed
      stream: false
    };

    // Validate the request body
    if (!requestBody.messages[0].content || !requestBody.messages[1].content) {
      throw new Error("Invalid message content in request body");
    }

    console.log('Request body preview:', {
      model: requestBody.model,
      messageCount: requestBody.messages.length,
      systemPromptLength: requestBody.messages[0].content.length,
      userContentLength: requestBody.messages[1].content.length
    });

    console.log("Request payload:", JSON.stringify(requestBody, null, 2));
    
    console.log('Making request to Groq API with config:', {
      url: GROQ_API_URL,
      headers: {
        Authorization: 'Bearer <REDACTED>',
        "Content-Type": "application/json"
      },
      timeout: 60000
    });

    const response = await axios.post(
      GROQ_API_URL,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000, // Increased timeout to 60 seconds
      }
    );
    
    console.log("Received response from Groq API:", {
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data,
      headers: response.headers,
      responseType: response.headers['content-type']
    });

    // Log the raw response for debugging
    console.log('Response data type:', typeof response.data);
    console.log('Response structure:', Object.keys(response.data || {}));

    if (!response.data) {
      console.error("No response data from LLM");
      throw new Error("No response data received from LLM");
    }

    // Log full response for debugging
    try {
      console.log('Raw LLM response:', JSON.stringify(response.data, null, 2));
    } catch (e) {
      console.error('Could not stringify response:', e);
      console.log('Raw response:', response.data);
    }

    // Validate response structure
    if (!Array.isArray(response.data.choices)) {
      console.error("Invalid response structure - missing choices array:", response.data);
      throw new Error("Invalid response structure: no choices array");
    }

    if (response.data.choices.length === 0) {
      console.error("Empty choices array in response:", response.data);
      throw new Error("No choices returned from LLM");
    }

    // Try to extract content from response
    const firstChoice = response.data.choices[0];
    console.log('First choice structure:', Object.keys(firstChoice || {}));

    let rewrittenContent = '';
    
    // Try different possible response formats
    if (firstChoice.message?.content) {
      rewrittenContent = firstChoice.message.content;  // OpenAI format
      console.log('Found content in message.content');
    } else if (firstChoice.text) {
      rewrittenContent = firstChoice.text;  // Alternative format
      console.log('Found content in text field');
    } else if (firstChoice.generated_text) {
      rewrittenContent = firstChoice.generated_text;  // Another format
      console.log('Found content in generated_text field');
    } else if (firstChoice.output) {
      rewrittenContent = firstChoice.output;  // Another format
      console.log('Found content in output field');
    }

    if (!rewrittenContent || rewrittenContent.trim().length === 0) {
      console.error("Could not find content in any known field. Choice structure:", firstChoice);
      throw new Error("No content found in LLM response");
    }

    // Validate the content length
    if (rewrittenContent.length < 50) {
      console.error("LLM returned too short content:", rewrittenContent);
      throw new Error("Content too short from LLM");
    }

    console.log("Successfully rewrote content. Preview:", rewrittenContent.substring(0, 200) + "...");
    
    return rewrittenContent;
    
    // Validate the rewritten content
    if (!rewrittenContent || rewrittenContent.length < 50) {
      console.error("LLM returned too short or empty content");
      throw new Error("Invalid content length from LLM");
    }

    console.log("Successfully rewrote content. Preview:", rewrittenContent.substring(0, 200) + "...");
    
    return rewrittenContent;
  } catch (error: unknown) {
    console.error("\n=== LLM Rewriting Error Details ===");
    console.error(`Time: ${new Date().toISOString()}`);
    
    if (axios.isAxiosError(error)) {
      console.error("\nAPI Error Information:");
      
      // Handle response errors
      if (error.response) {
        const status = error.response.status;
        console.error(`Status Code: ${status}`);
        console.error(`Status Text: ${error.response.statusText}`);
        console.error("Response Headers:", error.response.headers);
        console.error("Response Body:", error.response.data);
        
        // Handle specific status codes
        if (status === 401) {
          throw new Error("Authentication failed - Invalid API key");
        } else if (status === 429) {
          throw new Error("Rate limit exceeded - Too many requests");
        } else if (status === 400) {
          const errorMessage = error.response.data?.error?.message || 'Invalid request parameters';
          throw new Error(`Bad request: ${errorMessage}`);
        } else if (status >= 500) {
          throw new Error("Groq API server error - Service temporarily unavailable");
        }
      } else if (error.request) {
        console.error("No response received - Request timeout or network error");
        console.error("Request details:", error.request);
        throw new Error("No response received from Groq API - Check your network connection");
      } else {
        console.error("Request setup failed:", error.message);
        throw new Error(`Request setup failed: ${error.message}`);
      }

      // Log request details
      if (error.config) {
        console.error("\nRequest Details:");
        console.error(`URL: ${error.config.url}`);
        console.error(`Method: ${error.config.method}`);
        console.error("Headers:", {
          ...error.config.headers,
          Authorization: '<REDACTED>'
        });
        
        if (typeof error.config.data === 'string') {
          try {
            const requestBody = JSON.parse(error.config.data) as {
              model: string;
              messages: Array<{ role: string; content?: string }>;
            };
            
            console.error("Request Payload:", {
              model: requestBody.model,
              messages: requestBody.messages.map(m => ({
                role: m.role,
                contentLength: m.content?.length || 0,
                contentPreview: m.content ? `${m.content.substring(0, 100)}...` : null
              }))
            });
          } catch (parseError) {
            console.error("Could not parse request payload:", 
              parseError instanceof Error ? parseError.message : String(parseError)
            );
          }
        }
      }

      // Handle specific API errors
      // All status code handling is now in the error.response block above

      // Log the request payload that caused the error
      if (typeof error.config?.data === 'string') {
        try {
          const requestData = JSON.parse(error.config.data) as {
            model: string;
            messages: Array<{ role: string; content?: string; }>;
          };
          
          console.error("Failed request payload:", {
            model: requestData.model,
            messages: requestData.messages.map(m => ({
              role: m.role,
              contentLength: m.content?.length ?? 0
            }))
          });
        } catch (parseError) {
          console.error("Could not parse request data:", parseError instanceof Error ? parseError.message : String(parseError));
        }
      }
    }
    
    throw new Error(`LLM Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const processAndPostContent = async () => {
  try {
    console.log("Starting scheduled content processing...");
    
    // Step 1: Fetch RSS Feeds
    const feeds = await getRSSFeeds();
    console.log(`Successfully fetched ${feeds.length} feeds`);
    
    // Filter feeds to only include those published in the last 24 hours
    const now = new Date();
    const recentFeeds = feeds.filter(feed => {
      const pubDate = new Date(feed.pubDate);
      return (now.getTime() - pubDate.getTime()) < 24 * 60 * 60 * 1000;
    });
    
    if (recentFeeds.length === 0) {
      console.log("No recent feeds found; exiting scheduled processing.");
      return;
    }
    
    // Randomly select one recent feed
    const feed = recentFeeds[Math.floor(Math.random() * recentFeeds.length)];
    console.log(`Processing randomly selected feed: ${feed.title}`);
    
    // Prepare content for LLM
    const cleanContent = (feed.contentSnippet || '')
      .replace(/\n+/g, ' ')  // Replace newlines with spaces
      .replace(/\s+/g, ' ')   // Normalize whitespace
      .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
      .trim();
    
    if (!cleanContent || cleanContent.length < 50) {
      console.log("Skipping feed due to insufficient content length");
      return;
    }
    
    // Limit content to a shorter length for LLM processing (1500 characters max)
    const truncatedContent = cleanContent.substring(0, 1500);
    
    const content = `
Please rewrite the following technology article in a clear and engaging way:

Original Title: ${feed.title || 'Untitled'}
Original Content: ${truncatedContent}
Source URL: ${feed.link || 'No URL provided'}

Instructions:
1. Create a more engaging title that captures the main point
2. Rewrite the content in a clear, professional style
3. Keep all important technical details accurate
4. Add 2-3 key takeaways as bullet points at the end
5. Keep the response under 1000 words`;
    
    // Step 2: Rewrite Content with LLM
    console.log("Sending to LLM for rewriting...");
    const rewrittenContent = await rewriteContentWithLLM(content);
    
    // Step 3: Process content directly (skipping Telegram approval)
    console.log("Processing content directly...");
    await addApprovedVlog(rewrittenContent);
    console.log("Content processed and published successfully");
    
  } catch (error) {
    console.error("Error in scheduled processAndPostContent:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
};
