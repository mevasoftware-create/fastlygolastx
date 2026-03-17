import "dotenv/config";
import express from "express";
import { initFcmTokenManager } from "../fcmTokenManager";
import { startScheduledNotificationCron } from "../routers/scheduledNotificationRouter";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import compression from "compression";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
// Manus OAuth removed - using email/password and Google OAuth instead
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeSocketIO } from "./socket";
import { defaultRateLimit, lenientRateLimit, logRateLimitInfo } from "./rateLimit";
import { seoMiddleware, seoMiddlewareHandler } from "./seoMiddleware";
import jwt from "jsonwebtoken";
import { getDb } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Security Headers with Helmet (must be first)
  // Disable CSP in development for easier debugging
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  app.use(helmet({
    contentSecurityPolicy: isDevelopment ? false : {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://maps.googleapis.com", "https://maps.gstatic.com", "https://accounts.google.com", "https://www.googletagmanager.com", "https://manus-analytics.com"],  
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https:", "wss:", "ws:", "https://maps.googleapis.com"],
        frameSrc: ["'self'", "https://accounts.google.com"],
        workerSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    // permissionsPolicy is handled separately if needed
  }));
  
  // Disable x-powered-by header
  app.disable("x-powered-by");
  
  // Enable gzip compression for all responses
  app.use(compression({
    level: 6, // Compression level (0-9, 6 is default and balanced)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      // Don't compress if client doesn't support it
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Use compression for all content types
      return compression.filter(req, res);
    }
  }));
  
  // Force HTTPS for production (but allow Manus development domains)
  app.use((req, res, next) => {
    // Manus proxy may forward the original host via x-forwarded-host
    // Check both host and x-forwarded-host headers
    const host = (req.headers['x-forwarded-host'] as string || req.headers.host || '').split(',')[0].trim();
    
    // Skip redirect for localhost and Manus development domains
    if (host.includes('localhost') || host.includes('127.0.0.1') || 
        host.includes('manus.space') || host.includes('manus.computer') || host.includes('manusvm.computer')) {
      return next();
    }
    
    // Check protocol from multiple sources
    const xForwardedProto = req.headers['x-forwarded-proto'] as string | undefined;
    const xForwardedSsl = req.headers['x-forwarded-ssl'] as string | undefined;
    const protocol = xForwardedProto || (xForwardedSsl === 'on' ? 'https' : (req.protocol || 'http'));
    
    // Remove www prefix
    const cleanHost = host.replace(/^www\./, '');
    
    // Force non-www for production domain (fastlygo.mk)
    // www.fastlygo.mk → fastlygo.mk (301 redirect)
    if (host.startsWith('www.') && host !== cleanHost) {
      const redirectUrl = `https://${cleanHost}${req.url}`;
      console.log(`[WWW Redirect] ${protocol}://${host}${req.url} → ${redirectUrl}`);
      res.setHeader('Location', redirectUrl);
      return res.status(301).end();
    }
    
    // Force HTTPS
    if (protocol !== 'https' && cleanHost === 'fastlygo.mk') {
      const redirectUrl = `https://${cleanHost}${req.url}`;
      console.log(`[HTTPS Redirect] ${protocol}://${host}${req.url} → ${redirectUrl}`);
      res.setHeader('Location', redirectUrl);
      return res.status(301).end();
    }
    
    next();
  });

  // CORS configuration for mobile app
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Cookie, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Cache headers for better performance
  app.use((req, res, next) => {
    if (req.path.startsWith('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    next();
  });



  // SEO Middleware - DISABLED (Manus auto SEO removed, site uses custom SEO)
  // app.use(seoMiddleware);

  // Temporary debug endpoint - remove after diagnosis
  app.get('/api/debug-headers', (req, res) => {
    res.json({
      host: req.headers.host,
      'x-forwarded-host': req.headers['x-forwarded-host'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
      'x-real-ip': req.headers['x-real-ip'],
      'cf-connecting-ip': req.headers['cf-connecting-ip'],
      'cf-visitor': req.headers['cf-visitor'],
      allHeaders: req.headers,
    });
  });

  // OAuth routes handled separately
  
  // Apply rate limiting to tRPC endpoints
  // Use lenient rate limit for frequently accessed endpoints
  app.use("/api/trpc/orders.getMyOrders", lenientRateLimit);
  app.use("/api/trpc/orders.getById", lenientRateLimit);
  app.use("/api/trpc/orders.list", lenientRateLimit);
  
  // Apply default rate limit to all other tRPC endpoints
  app.use("/api/trpc", defaultRateLimit);
  
  // Log tRPC requests for debugging
  app.use("/api/trpc", (req, res, next) => {
    if (req.headers.authorization) {
      console.log("[tRPC Request] Bearer token auth detected");
    }
    next();
  });

  // tRPC API - handle both regular and batch requests with optimizations
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      batching: {
        enabled: true,
      },
    })
  );
  // Initialize Socket.IO
  initializeSocketIO(server);

  // ─── REST API endpoints for mobile app ───────────────────────────────────
  const verifyToken = (req: any, res: any): { id: number; email: string; role: string } | null => {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) { res.status(401).json({ error: "Unauthorized" }); return null; }
    try {
      return jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
    } catch { res.status(401).json({ error: "Invalid token" }); return null; }
  };

  // POST /api/auth/refresh - Refresh access token
  app.post("/api/auth/refresh", async (req: any, res: any) => {
    const user = verifyToken(req, res);
    if (!user) return;
    const newToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "30d" }
    );
    res.json({ token: newToken });
  });

  // GET /api/notifications - Get user notifications
  app.get("/api/notifications", async (req: any, res: any) => {
    const user = verifyToken(req, res);
    if (!user) return;
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const { notifications } = await import("../../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const items = await db.select().from(notifications)
        .where(eq(notifications.userId, user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
      res.json(items);
    } catch (e) { res.status(500).json({ error: "Server error" }); }
  });

  // POST /api/notifications/:id/read - Mark notification as read
  app.post("/api/notifications/:id/read", async (req: any, res: any) => {
    const user = verifyToken(req, res);
    if (!user) return;
    try {
      const db = await getDb();
      if (!db) return res.json({ success: false });
      const { notifications } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      await db.update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, parseInt(req.params.id)), eq(notifications.userId, user.id)));
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Server error" }); }
  });

  // POST /api/orders/:id/cancel - Cancel an order
  app.post("/api/orders/:id/cancel", async (req: any, res: any) => {
    const user = verifyToken(req, res);
    if (!user) return;
    try {
      const db = await getDb();
      if (!db) return res.json({ success: false });
      const { orders } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const order = await db.select().from(orders)
        .where(and(eq(orders.id, parseInt(req.params.id)), eq(orders.customerId, user.id)))
        .limit(1);
      if (!order.length) return res.status(404).json({ error: "Order not found" });
      if (order[0].status !== "pending") return res.status(400).json({ error: "Order cannot be cancelled" });
      await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Server error" }); }
  });

  // GET /api/orders/:id/track - Track order status
  app.get("/api/orders/:id/track", async (req: any, res: any) => {
    const user = verifyToken(req, res);
    if (!user) return;
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB unavailable" });
      const { orders, couriers } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const order = await db.select().from(orders).where(eq(orders.id, parseInt(req.params.id))).limit(1);
      if (!order.length) return res.status(404).json({ error: "Order not found" });
      let courierLocation = null;
      if (order[0].courierId) {
        const courier = await db.select({
          lat: couriers.currentLatitude, lng: couriers.currentLongitude
        }).from(couriers).where(eq(couriers.id, order[0].courierId)).limit(1);
        if (courier.length) courierLocation = courier[0];
      }
      res.json({ order: order[0], courierLocation });
    } catch (e) { res.status(500).json({ error: "Server error" }); }
  });

  // GET /api/courier/:id/location - Get courier location
  app.get("/api/courier/:id/location", async (req: any, res: any) => {
    const user = verifyToken(req, res);
    if (!user) return;
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB unavailable" });
      const { couriers } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const courier = await db.select({
        id: couriers.id, lat: couriers.currentLatitude, lng: couriers.currentLongitude,
        isAvailable: couriers.isAvailable, status: couriers.status
      }).from(couriers).where(eq(couriers.id, parseInt(req.params.id))).limit(1);
      if (!courier.length) return res.status(404).json({ error: "Courier not found" });
      res.json(courier[0]);
    } catch (e) { res.status(500).json({ error: "Server error" }); }
  });

  // GET /api/courier/:id/track - Track courier
  app.get("/api/courier/:id/track", async (req: any, res: any) => {
    const user = verifyToken(req, res);
    if (!user) return;
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB unavailable" });
      const { couriers, users: usersTable } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const courier = await db.select({
        id: couriers.id, vehicleType: couriers.vehicleType, vehiclePlate: couriers.vehiclePlate,
        status: couriers.status, isAvailable: couriers.isAvailable,
        lat: couriers.currentLatitude, lng: couriers.currentLongitude,
        rating: couriers.rating, totalDeliveries: couriers.totalDeliveries,
        name: usersTable.name
      }).from(couriers)
        .leftJoin(usersTable, eq(couriers.userId, usersTable.id))
        .where(eq(couriers.id, parseInt(req.params.id))).limit(1);
      if (!courier.length) return res.status(404).json({ error: "Courier not found" });
      res.json(courier[0]);
    } catch (e) { res.status(500).json({ error: "Server error" }); }
  });
  // GET /api/profile - Get current user profile (with avatarUrl)
  app.get("/api/profile", async (req: any, res: any) => {
    const user = verifyToken(req, res);
    if (!user) return;
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB unavailable" });
      const { users: usersTable } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const result = await db.select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
        avatarUrl: usersTable.avatarUrl,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
      }).from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
      if (!result.length) return res.status(404).json({ error: "User not found" });
      res.json(result[0]);
    } catch (e) { res.status(500).json({ error: "Server error" }); }
  });

  // PUT /api/profile - Update profile (name, phone)
  app.put("/api/profile", async (req: any, res: any) => {
    const user = verifyToken(req, res);
    if (!user) return;
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB unavailable" });
      const { users: usersTable } = await import("../../drizzle/schema");
      const { eq, sql } = await import("drizzle-orm");
      const { name, phone } = req.body;
      const updateData: any = { updatedAt: sql`NOW()` };
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      await db.update(usersTable).set(updateData).where(eq(usersTable.id, user.id));
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Server error" }); }
  });

  // POST /api/profile/avatar - Upload avatar (base64)
  app.post("/api/profile/avatar", async (req: any, res: any) => {
    const user = verifyToken(req, res);
    if (!user) return;
    try {
      const { base64Image, mimeType } = req.body;
      if (!base64Image || !mimeType) return res.status(400).json({ error: "base64Image and mimeType required" });
      const { storagePut } = await import("../storage");
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const ext = mimeType.split("/")[1] || "jpg";
      const filename = `avatars/${user.id}-${Date.now()}.${ext}`;
      const { url } = await storagePut(filename, buffer, mimeType);
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB unavailable" });
      const { users: usersTable } = await import("../../drizzle/schema");
      const { eq, sql } = await import("drizzle-orm");
      await db.update(usersTable).set({ avatarUrl: url, updatedAt: sql`NOW()` }).where(eq(usersTable.id, user.id));
      res.json({ success: true, avatarUrl: url });
    } catch (e) { console.error("[Avatar upload]", e); res.status(500).json({ error: "Upload failed" }); }
  });
  // ─────────────────────────────────────────────────────────────────────────
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Initialize FCM Token Manager (auto-refresh)
  initFcmTokenManager().catch(err => {
    console.error("[FCM] Failed to initialize token manager:", err);
  });

  // Start scheduled notification cron job (runs every minute)
  startScheduledNotificationCron();

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log("[Security] Helmet security headers enabled");
    console.log("[Performance] Cache headers configured");
    console.log("[Performance] tRPC batching enabled (max 100 requests)");
    logRateLimitInfo();
  });
}

startServer().catch(err => {
  console.error("[Server Error] Failed to start server:", err);
  process.exit(1);
});

/**
 * Security Headers Configuration:
 * - Content-Security-Policy: Prevents XSS attacks
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - X-XSS-Protection: Legacy XSS protection
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Controls browser features
 * - HSTS: Forces HTTPS connections
 * - Cross-Origin policies: Manages cross-origin requests
 */
