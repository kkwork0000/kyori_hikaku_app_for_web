import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserUsageSchema, insertDistanceQuerySchema } from "@shared/schema";
import { z } from "zod";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get user usage for current month
  app.get("/api/usage/:userId/:month", async (req, res) => {
    try {
      const { userId, month } = req.params;
      const usage = await storage.getUserUsage(userId, month);
      
      if (!usage) {
        return res.json({ usageCount: 0 });
      }
      
      res.json({ usageCount: usage.usageCount });
    } catch (error) {
      res.status(500).json({ message: "Error fetching usage data" });
    }
  });

  // Update user usage count
  app.post("/api/usage", async (req, res) => {
    try {
      const data = insertUserUsageSchema.parse(req.body);
      const usage = await storage.updateUserUsage(
        data.userId, 
        data.month, 
        data.usageCount
      );
      res.json(usage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid usage data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating usage" });
    }
  });

  // Calculate distances using Google Distance Matrix API
  app.post("/api/calculate-distances", async (req, res) => {
    try {
      const { origin, destinations, travelMode, userId } = req.body;
      
      if (!GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }

      // Construct Distance Matrix API URL
      const baseUrl = "https://maps.googleapis.com/maps/api/distancematrix/json";
      const params = new URLSearchParams({
        origins: origin,
        destinations: destinations.join('|'),
        mode: travelMode,
        language: 'ja',
        key: GOOGLE_MAPS_API_KEY
      });

      const response = await fetch(`${baseUrl}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK') {
        return res.status(400).json({ message: "Google Maps API error", error: data.status });
      }

      // Format results
      const results = data.rows[0].elements.map((element: any, index: number) => {
        if (element.status === 'OK') {
          return {
            destination: destinations[index],
            distance: element.distance.text,
            duration: element.duration.text,
            distanceValue: element.distance.value,
            durationValue: element.duration.value
          };
        } else {
          return {
            destination: destinations[index],
            distance: 'N/A',
            duration: 'N/A',
            error: element.status
          };
        }
      });

      // Save query to storage if userId provided
      if (userId) {
        await storage.createDistanceQuery({
          userId,
          origin,
          destinations,
          travelMode,
          results: JSON.stringify(results)
        });
      }

      res.json({ results });
    } catch (error) {
      console.error('Distance calculation error:', error);
      res.status(500).json({ message: "Error calculating distances" });
    }
  });

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
      } else {
        res.status(401).json({ message: "Incorrect password" });
      }
    } catch (error) {
      res.status(500).json({ message: "Login error" });
    }
  });

  // Admin statistics
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const currentMonth = `${new Date().getMonth() + 1}_${new Date().getFullYear()}`;
      
      const totalUsers = await storage.getTotalUsersCount();
      const monthlyQueries = await storage.getMonthlyQueriesCount(currentMonth);
      const allUsage = await storage.getAllUserUsage();
      
      // Filter for current month and format for display
      const currentMonthUsage = allUsage
        .filter(usage => usage.month === currentMonth)
        .map(usage => ({
          userId: usage.userId,
          usageCount: usage.usageCount,
          lastUsed: usage.lastUsed?.toISOString().split('T')[0] || 'N/A'
        }));

      res.json({
        totalUsers,
        monthlyQueries,
        userUsage: currentMonthUsage
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching admin statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
