import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertSummarySchema } from "@shared/schema";
import { summarizeText } from "./summarize";

// Auth middleware type-safe implementation
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log('Checking authentication:', req.isAuthenticated(), req.user?.id);
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.post("/api/summarize", requireAuth, async (req, res) => {
    try {
      console.log('Processing summarize request for user:', req.user?.id);
      const { originalText, language } = insertSummarySchema.parse(req.body);

      const summary = await summarizeText(originalText, language);
      console.log('Generated summary:', summary ? 'success' : 'failed');

      const savedSummary = await storage.createSummary(req.user!.id, {
        originalText,
        language,
        summary
      });

      res.json(savedSummary);
    } catch (error) {
      console.error('Summarization error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to summarize text' });
    }
  });

  app.get("/api/summaries", requireAuth, async (req, res) => {
    try {
      const summaries = await storage.getUserSummaries(req.user!.id);
      res.json(summaries);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      res.status(500).json({ message: "Failed to fetch summaries" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}