import { Router, Request, Response } from "express";
import { getRSSFeeds, processAndPostContent } from "../services/rssService";
import { fetchApprovedVlogs } from "../controllers/vlogController";
import webhookRoutes from "./webhookRoutes";

const router = Router();

// Mount webhook routes
router.use('/webhook', webhookRoutes);

// Test endpoint to verify router is working
router.get("/test", (req: Request, res: Response) => {
  res.json({ status: "Router is working" });
});

// Get RSS feeds
router.get("/rss", async (req: Request, res: Response) => {
  try {
    console.log("Fetching RSS feeds...");
    const feeds = await getRSSFeeds();
    console.log(`Successfully fetched ${feeds.length} feeds`);
    res.json({ success: true, data: feeds });
  } catch (error) {
    console.error("Error fetching RSS feeds:", error);
    res.status(500).json({ success: false, message: "Failed to fetch RSS feeds" });
  }
});

// Process feeds endpoint - supports both GET and POST
const processFeedsHandler = async (req: Request, res: Response) => {
  try {
    console.log("Starting feed processing...");
    await processAndPostContent();
    res.json({ success: true, message: "Feed processing started" });
  } catch (error) {
    console.error("Error processing feeds:", error);
    res.status(500).json({ success: false, message: "Failed to process feeds" });
  }
};

router.get("/process-feed", processFeedsHandler);
router.post("/process-feed", processFeedsHandler);

// Get approved vlogs with pagination
router.get("/vlogs", (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    
    const result = fetchApprovedVlogs(page, pageSize);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching vlogs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch vlogs" });
  }
});

export default router;
