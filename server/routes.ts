import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserUsageSchema, insertDistanceQuerySchema, insertArticleSchema, insertContactSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import sharp from "sharp";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
const FRONTEND_GOOGLE_MAPS_API_KEY = "AIzaSyDV-CnRnVjrMhv6-hAFFJgq7Qx_ze2S4FA";

// アップロードディレクトリの設定（永続ストレージ）
const uploadsDir = path.join(process.cwd(), 'persistent_uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer設定
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB制限
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('JPG、PNG、WebP形式の画像のみアップロード可能です'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Static file serving for uploads (永続ストレージ)
  app.use('/uploads', express.static(uploadsDir));
  
  // ads.txtファイルの配信
  app.get('/ads.txt', (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(process.cwd(), 'ads.txt'));
  });
  
  // robots.txtファイルの配信
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(process.cwd(), 'robots.txt'));
  });
  
  // 動的sitemap.xmlの生成と配信
  app.get('/sitemap.xml', async (req, res) => {
    try {
      res.type('application/xml');
      
      // 基本ページ
      const baseUrls = [
        { loc: 'https://hikaku-map.com/', lastmod: '2025-06-07', changefreq: 'weekly', priority: '1.0' },
        { loc: 'https://hikaku-map.com/articles', lastmod: '2025-06-07', changefreq: 'daily', priority: '0.8' },
        { loc: 'https://hikaku-map.com/privacy', lastmod: '2025-06-07', changefreq: 'yearly', priority: '0.3' },
        { loc: 'https://hikaku-map.com/terms', lastmod: '2025-06-07', changefreq: 'yearly', priority: '0.3' }
      ];
      
      // 記事ページを動的に追加
      const { articles } = await storage.getAllArticles(1, 1000); // 全記事を取得
      const articleUrls = articles.map(article => {
        // updatedAtまたはcreatedAtの文字列を使用、どちらもない場合はデフォルト日付
        const dateString = (article.updatedAt || article.createdAt || '2025-06-07T00:00:00.000Z').toString();
        const lastmod = new Date(dateString).toISOString().split('T')[0];
        return {
          loc: `https://hikaku-map.com/articles/${article.id}`,
          lastmod,
          changefreq: 'monthly',
          priority: '0.6'
        };
      });
      
      const allUrls = [...baseUrls, ...articleUrls];
      
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
      
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      // フォールバック: 静的sitemapを配信
      res.sendFile(path.join(process.cwd(), 'sitemap.xml'));
    }
  });
  
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
        data.usageCount || 0
      );
      res.json(usage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid usage data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating usage" });
    }
  });

  // Google Maps API key endpoint (for frontend use)
  app.get("/api/google-maps-config", (req, res) => {
    res.json({
      apiKey: FRONTEND_GOOGLE_MAPS_API_KEY,
      libraries: ['places', 'geometry']
    });
  });

  // Get reCAPTCHA site key for frontend
  app.get("/api/recaptcha-config", (req, res) => {
    res.json({ siteKey: process.env.RECAPTCHA_SITE_KEY });
  });

  // Verify reCAPTCHA token
  async function verifyRecaptcha(token: string): Promise<boolean> {
    try {
      const secretKey = process.env.RECAPTCHA_SECRET_KEY;
      if (!secretKey) {
        console.error('RECAPTCHA_SECRET_KEY not configured');
        return false;
      }

      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${secretKey}&response=${token}`,
      });

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return false;
    }
  }

  // Send LINE notification
  async function sendLineNotification(contact: any): Promise<void> {
    try {
      const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      if (!channelAccessToken) {
        console.error('LINE_CHANNEL_ACCESS_TOKEN not configured');
        return;
      }

      const message = `新しいお問い合わせが届きました
問い合わせ番号: ${contact.inquiryNumber}
日時: ${new Date(contact.createdAt).toLocaleString('ja-JP')}
お名前: ${contact.name}
件名: ${contact.subject}`;

      await fetch('https://api.line.me/v2/bot/message/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${channelAccessToken}`,
        },
        body: JSON.stringify({
          messages: [
            {
              type: 'text',
              text: message,
            },
          ],
        }),
      });
    } catch (error) {
      console.error('LINE notification error:', error);
    }
  }

  // Contact form submission
  app.post("/api/contacts", async (req, res) => {
    try {
      const { recaptchaToken, ...contactData } = req.body;
      
      // Verify reCAPTCHA
      if (!recaptchaToken) {
        return res.status(400).json({ message: "reCAPTCHA token is required" });
      }

      const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
      if (!isRecaptchaValid) {
        return res.status(400).json({ message: "reCAPTCHA verification failed" });
      }

      // Validate contact data
      const validatedData = insertContactSchema.parse(contactData);
      
      // Create contact
      const contact = await storage.createContact(validatedData);
      
      // Send LINE notification (async, don't wait for completion)
      sendLineNotification(contact).catch(error => {
        console.error('Failed to send LINE notification:', error);
      });
      
      res.json({ 
        success: true, 
        inquiryNumber: contact.inquiryNumber,
        message: "お問い合わせを受け付けました" 
      });
    } catch (error) {
      console.error('Contact form error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "入力データが不正です", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "サーバーエラーが発生しました" });
    }
  });

  // Get contacts list for admin (with pagination and search)
  app.get("/api/admin/contacts", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      
      const contacts = await storage.getAllContacts(page, limit, search);
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ message: "問い合わせ一覧の取得に失敗しました" });
    }
  });

  // Get single contact detail for admin
  app.get("/api/admin/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getContactById(id);
      
      if (!contact) {
        return res.status(404).json({ message: "問い合わせが見つかりません" });
      }
      
      res.json(contact);
    } catch (error) {
      console.error('Error fetching contact:', error);
      res.status(500).json({ message: "問い合わせの取得に失敗しました" });
    }
  });

  // Update contact status
  app.put("/api/admin/contacts/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['pending', 'reviewed', 'resolved'].includes(status)) {
        return res.status(400).json({ message: "無効なステータスです" });
      }
      
      const contact = await storage.updateContactStatus(id, status);
      
      if (!contact) {
        return res.status(404).json({ message: "問い合わせが見つかりません" });
      }
      
      res.json(contact);
    } catch (error) {
      console.error('Error updating contact status:', error);
      res.status(500).json({ message: "ステータスの更新に失敗しました" });
    }
  });

  // Delete contact
  app.delete("/api/admin/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteContact(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "問い合わせが見つかりません" });
      }
      
      res.json({ message: "問い合わせを削除しました" });
    } catch (error) {
      console.error('Error deleting contact:', error);
      res.status(500).json({ message: "問い合わせの削除に失敗しました" });
    }
  });

  // New endpoint: /get-distance for Google Distance Matrix API
  app.post("/get-distance", async (req, res) => {
    try {
      const { origin, destinations, travelMode = "driving" } = req.body;
      
      if (!origin || !destinations || !Array.isArray(destinations) || destinations.length === 0) {
        return res.status(400).json({ 
          error: "origin and destinations (array) are required" 
        });
      }
      
      if (!GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({ 
          error: "Google Maps API key not configured" 
        });
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
        return res.status(400).json({ 
          error: "Google Maps API error", 
          details: data.status 
        });
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

      res.json({ 
        success: true,
        origin: data.origin_addresses[0],
        results 
      });
    } catch (error) {
      console.error('Distance calculation error:', error);
      res.status(500).json({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get detailed routes using Google Directions API
  app.post("/api/get-routes", async (req, res) => {
    try {
      const { origin, destination, travelMode = "driving", avoidTolls = false } = req.body;
      
      if (!origin || !destination) {
        return res.status(400).json({ 
          error: "origin and destination are required" 
        });
      }
      
      if (!GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({ 
          error: "Google Maps API key not configured" 
        });
      }

      console.log(`Processing route from ${origin} to ${destination} with mode ${travelMode}`);

      // Construct Directions API URL
      const baseUrl = "https://maps.googleapis.com/maps/api/directions/json";
      const params = new URLSearchParams({
        origin: origin,
        destination: destination,
        mode: travelMode,
        language: 'ja',
        alternatives: 'true',
        key: GOOGLE_MAPS_API_KEY
      });

      // Add avoid tolls parameter for driving mode
      if (travelMode === 'driving' && avoidTolls) {
        params.append('avoid', 'tolls');
      }

      const apiUrl = `${baseUrl}?${params}`;
      console.log(`Calling Directions API: ${apiUrl.replace(GOOGLE_MAPS_API_KEY, 'API_KEY_HIDDEN')}`);
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      console.log("Directions API response status:", data.status);
      
      if (data.status !== 'OK') {
        console.error("Directions API error:", data);
        return res.status(400).json({ 
          error: "Google Directions API error", 
          details: data.status,
          message: data.error_message || "No routes found"
        });
      }

      if (!data.routes || data.routes.length === 0) {
        console.error("No routes found in response");
        return res.status(400).json({ 
          error: "No routes found",
          details: "The API response did not contain any routes"
        });
      }

      // Format routes
      const routes = data.routes.map((route: any, index: number) => {
        if (!route.legs || !route.legs[0]) {
          console.error(`Route ${index} has no legs`);
          return {
            routeIndex: index,
            summary: `ルート ${index + 1}`,
            distance: "不明",
            duration: "不明",
            distanceValue: 0,
            durationValue: 0,
            polyline: "",
            warnings: ["ルート詳細が取得できませんでした"],
          };
        }
        
        return {
          routeIndex: index,
          summary: route.summary || `ルート ${index + 1}`,
          distance: route.legs[0].distance?.text || "不明",
          duration: route.legs[0].duration?.text || "不明",
          distanceValue: route.legs[0].distance?.value || 0,
          durationValue: route.legs[0].duration?.value || 0,
          polyline: route.overview_polyline?.points || "",
          warnings: route.warnings || [],
          copyrights: route.copyrights || "Google"
        };
      });

      console.log(`Returning ${routes.length} routes`);
      
      res.json({ 
        success: true,
        origin: data.routes[0].legs[0]?.start_address || origin,
        destination: data.routes[0].legs[0]?.end_address || destination,
        routes 
      });
    } catch (error) {
      console.error('Route calculation error:', error);
      
      // デモデータを返して、フロントエンドの動作を確保
      const demoRoutes = [
        {
          routeIndex: 0,
          summary: "主要道路",
          distance: "10.5 km",
          duration: "25分",
          distanceValue: 10500,
          durationValue: 1500,
          polyline: "",
          warnings: ["注意: これはデモデータです"]
        },
        {
          routeIndex: 1,
          summary: "高速道路",
          distance: "12.0 km",
          duration: "15分",
          distanceValue: 12000,
          durationValue: 900,
          polyline: "",
          warnings: ["注意: これはデモデータです", "高速道路を含むルート"]
        }
      ];
      
      res.json({
        success: true,
        origin: req.body.origin,
        destination: req.body.destination,
        routes: demoRoutes
      });
    }
  });

  // Calculate distances using Google Distance Matrix API
  app.post("/api/calculate-distances", async (req, res) => {
    try {
      const { origin, destinations, travelMode, userId, routeSettings } = req.body;
      
      console.log("Calculate distances with:", { 
        origin, 
        destinationsCount: destinations.length, 
        travelMode, 
        hasRouteSettings: !!routeSettings 
      });
      
      if (routeSettings) {
        console.log("Route settings provided:", JSON.stringify(routeSettings));
        
        // 詳細設定情報の構造をデバッグするためにログ出力
        for (const key in routeSettings) {
          const setting = routeSettings[key];
          console.log(`Route setting for destination ${key}:`, {
            hasRouteData: !!setting.routeData,
            selectedRouteIndex: setting.selectedRouteIndex,
            avoidTolls: setting.avoidTolls
          });
          
          if (setting.routeData) {
            console.log(`Route data for destination ${key}:`, {
              distance: setting.routeData.distance,
              duration: setting.routeData.duration,
              summary: setting.routeData.summary
            });
          }
        }
      }
      
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

      console.log("Making Distance Matrix API request:", `${baseUrl}?${params}`);
      const response = await fetch(`${baseUrl}?${params}`);
      const data = await response.json();
      
      console.log("Distance Matrix API response:", JSON.stringify(data, null, 2));

      if (data.status !== 'OK') {
        console.error("Distance Matrix API error:", {
          status: data.status,
          error_message: data.error_message,
          full_response: data
        });
        return res.status(400).json({ 
          message: "Google Maps API error", 
          error: data.status,
          error_message: data.error_message 
        });
      }

      // Format results with custom route settings if available
      const results = data.rows[0].elements.map((element: any, index: number) => {
        // 詳細設定が指定されている場合はカスタムルート情報を使用
        // indexはnumber型だが、Mapから変換された場合objectのキーは文字列になる可能性がある
        const hasCustomSettings = routeSettings && 
          (routeSettings[index] || routeSettings[index.toString()]) && 
          ((routeSettings[index] && routeSettings[index].routeData) || 
           (routeSettings[index.toString()] && routeSettings[index.toString()].routeData));
        
        if (element.status === 'OK') {
          // カスタム設定があればそれを使用、なければAPIの結果を使用
          if (hasCustomSettings) {
            // キーが数値型と文字列型の両方に対応
            const routeSetting = routeSettings[index] || routeSettings[index.toString()];
            const customRoute = routeSetting.routeData;
            
            console.log(`Using custom route for destination ${index}: ${destinations[index]}`, {
              distance: customRoute.distance,
              duration: customRoute.duration,
              summary: customRoute.summary
            });
            
            return {
              destination: destinations[index],
              distance: customRoute.distance,
              duration: customRoute.duration,
              distanceValue: customRoute.distanceValue,
              durationValue: customRoute.durationValue,
              customRouteApplied: true
            };
          } else {
            return {
              destination: destinations[index],
              distance: element.distance.text,
              duration: element.duration.text,
              distanceValue: element.distance.value,
              durationValue: element.duration.value
            };
          }
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

  // Data cleanup endpoints (admin only)
  app.get('/api/admin/cleanup/stats', async (req, res) => {
    try {
      const stats = await storage.getOldDataStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      res.status(500).json({ error: 'Failed to get cleanup stats' });
    }
  });

  app.post('/api/admin/cleanup/execute', async (req, res) => {
    try {
      const { cleanupScheduler } = await import('./cleanup-scheduler');
      const result = await cleanupScheduler.manualCleanup();
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error executing cleanup:', error);
      res.status(500).json({ error: 'Failed to execute cleanup' });
    }
  });

  app.get('/api/admin/cleanup/status', async (req, res) => {
    try {
      const { cleanupScheduler } = await import('./cleanup-scheduler');
      const status = cleanupScheduler.getStatus();
      res.json(status);
    } catch (error) {
      console.error('Error getting cleanup status:', error);
      res.status(500).json({ error: 'Failed to get cleanup status' });
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

  // Article API endpoints
  
  // Get all articles with pagination
  app.get("/api/articles", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await storage.getAllArticles(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error fetching articles" });
    }
  });

  // Get article by ID and increment views
  app.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticleById(id);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Increment view count
      await storage.updateArticleViews(id);
      
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Error fetching article" });
    }
  });

  // Get popular articles
  app.get("/api/articles/popular/:limit?", async (req, res) => {
    try {
      const limit = parseInt(req.params.limit || "10");
      const articles = await storage.getPopularArticles(limit);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching popular articles" });
    }
  });

  // Image upload endpoints
  app.post("/api/upload/thumbnail", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "画像ファイルが必要です" });
      }
      
      // 画像を圧縮・リサイズ（サムネイル用: 最大400x300px、品質80%）
      const compressedBuffer = await sharp(req.file.path)
        .resize(400, 300, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      const base64Image = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
      
      // 元ファイルを削除
      fs.unlinkSync(req.file.path);
      
      res.json({ url: base64Image });
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      res.status(500).json({ message: "画像のアップロードに失敗しました" });
    }
  });

  app.post("/api/upload/image", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "画像ファイルが必要です" });
      }
      
      // 画像を圧縮・リサイズ（記事内画像: 最大800x600px、品質85%）
      const compressedBuffer = await sharp(req.file.path)
        .resize(800, 600, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      const base64Image = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
      
      // 元ファイルを削除
      fs.unlinkSync(req.file.path);
      
      res.json({ url: base64Image });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ message: "画像のアップロードに失敗しました" });
    }
  });

  // Create new article (admin only)
  app.post("/api/articles", async (req, res) => {
    try {
      const articleData = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid article data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating article" });
    }
  });

  // Update article (admin only)
  app.put("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const articleData = insertArticleSchema.parse(req.body);
      const article = await storage.updateArticle(id, articleData);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid article data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating article" });
    }
  });

  // Delete article (admin only)
  app.delete("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteArticle(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json({ message: "Article deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting article" });
    }
  });

  // XML Sitemap endpoint
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const baseUrl = 'https://www.hikaku-map.com';
      const currentDate = new Date().toISOString();
      
      // 静的ページのURL
      const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/how-to', priority: '0.8', changefreq: 'monthly' },
        { url: '/articles', priority: '0.9', changefreq: 'daily' },
        { url: '/terms', priority: '0.3', changefreq: 'yearly' },
        { url: '/privacy', priority: '0.3', changefreq: 'yearly' }
      ];

      // 記事データを取得
      const articlesData = await storage.getAllArticles(1, 1000); // 全記事を取得
      
      let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

      // 静的ページを追加
      staticPages.forEach(page => {
        sitemapXml += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
      });

      // 記事ページを追加
      articlesData.articles.forEach(article => {
        const articleDate = article.updatedAt ? new Date(article.updatedAt as string | number | Date).toISOString() : currentDate;
        sitemapXml += `
  <url>
    <loc>${baseUrl}/articles/${article.id}</loc>
    <lastmod>${articleDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      sitemapXml += `
</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.send(sitemapXml);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Admin: Get test mode status
  app.get("/api/admin/test-mode", async (req, res) => {
    try {
      const userTrackingPath = path.join(process.cwd(), 'client/src/lib/userTracking.ts');
      
      const content = fs.readFileSync(userTrackingPath, 'utf8');
      // テストモード = ユーザーIDがアクティブ（利用制限除外、広告なし）
      // 本番モード = ユーザーIDがコメントアウト（利用制限適用、広告あり）
      const isTestMode = content.includes("'user_1747983273983_rsdgkwozg', // Admin test user");
      
      res.json({ 
        isTestMode,
        targetUserId: 'user_1747983273983_rsdgkwozg',
        status: isTestMode ? 'テストモード（利用制限から除外）' : '本番モード（利用制限を適用）'
      });
    } catch (error) {
      res.status(500).json({ message: "Error getting test mode status" });
    }
  });

  // Admin: Toggle test mode
  app.post("/api/admin/toggle-test-mode", async (req, res) => {
    try {
      const userTrackingPath = path.join(process.cwd(), 'client/src/lib/userTracking.ts');
      
      let content = fs.readFileSync(userTrackingPath, 'utf8');
      console.log('Current file content:', content.substring(content.indexOf('TEST_USER_IDS'), content.indexOf('TEST_USER_IDS') + 200));
      
      // テストモード = ユーザーIDがアクティブ（利用制限除外、広告なし）
      // 本番モード = ユーザーIDがコメントアウト（利用制限適用、広告あり）
      const isCurrentlyTestMode = content.includes("'user_1747983273983_rsdgkwozg', // Admin test user");
      console.log('Currently in test mode:', isCurrentlyTestMode);
      
      if (isCurrentlyTestMode) {
        // Switch to production mode (apply limits, show ads) - comment out the user ID
        const beforeReplace = content;
        content = content.replace(
          "  'user_1747983273983_rsdgkwozg', // Admin test user",
          "  // 'user_1747983273983_rsdgkwozg', // Temporarily removed for ad testing"
        );
        console.log('Replacement attempted (test->prod):', beforeReplace !== content);
      } else {
        // Switch to test mode (exclude from limits, no ads) - uncomment the user ID
        const beforeReplace = content;
        content = content.replace(
          "  // 'user_1747983273983_rsdgkwozg', // Temporarily removed for ad testing",
          "  'user_1747983273983_rsdgkwozg', // Admin test user"
        );
        console.log('Replacement attempted (prod->test):', beforeReplace !== content);
      }
      
      fs.writeFileSync(userTrackingPath, content, 'utf8');
      console.log('File written successfully');
      
      // Re-read to verify the change
      const verifyContent = fs.readFileSync(userTrackingPath, 'utf8');
      const newMode = verifyContent.includes("'user_1747983273983_rsdgkwozg', // Admin test user");
      console.log('Verified new mode (test mode):', newMode);
      
      res.json({ 
        success: true,
        isTestMode: newMode,
        status: newMode ? 'テストモード（利用制限から除外）' : '本番モード（利用制限を適用）',
        message: newMode ? 'テストモードに切り替えました' : '本番モードに切り替えました'
      });
    } catch (error) {
      console.error('Toggle test mode error:', error);
      res.status(500).json({ message: "Error toggling test mode" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
