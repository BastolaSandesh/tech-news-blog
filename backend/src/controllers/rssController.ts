import { Request, Response } from "express";
import { getRSSFeeds, processAndPostContent } from "../services/rssService";

export const fetchRSSFeeds = async (req: Request, res: Response) => {
  try {
    const feeds = await getRSSFeeds();
    res.status(200).json({ success: true, data: feeds });
  } catch (error) {
    console.error("Error fetching RSS feeds:", error);
    res.status(500).json({ success: false, message: "Failed to fetch RSS feeds" });
  }
};

export const processRSSFeed = async (req: Request, res: Response) => {
  try {
    console.log("Starting RSS feed processing...");
    await processAndPostContent();
    res.status(200).json({ success: true, message: "RSS feed processing started" });
  } catch (error) {
    console.error("Error processing RSS feed:", error);
    res.status(500).json({ success: false, message: "Failed to process RSS feed" });
  }
};
