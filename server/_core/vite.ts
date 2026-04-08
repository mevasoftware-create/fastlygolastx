import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getDb } from "../db";
import { areas, categories, pages } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// SEO cache to avoid DB hits on every request
const seoCache = new Map<string, { title: string; description: string; expiry: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const SUPPORTED_LANGS = ["en", "tr", "mk", "sq"] as const;
type SupportedLang = typeof SUPPORTED_LANGS[number];

function detectLanguageFromUrl(url: string, acceptLanguage?: string): string {
  // 1. ?lang= query param takes priority
  const params = new URLSearchParams(url.includes("?") ? url.split("?")[1] : "");
  const lang = params.get("lang");
  if (lang && SUPPORTED_LANGS.includes(lang as SupportedLang)) return lang;
  // 2. Accept-Language header fallback
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(",")[0].split("-")[0].toLowerCase();
    if (SUPPORTED_LANGS.includes(preferred as SupportedLang)) return preferred;
  }
  return "en";
}

function parseSeoMeta(seoMetaRaw: any, language: string): { title: string; description: string } {
  try {
    const seoMeta = typeof seoMetaRaw === "string" ? JSON.parse(seoMetaRaw) : seoMetaRaw;
    const data = seoMeta?.[language] || seoMeta?.en || {};
    return { title: data.title || "", description: data.description || "" };
  } catch {
    return { title: "", description: "" };
  }
}

async function getSeoForUrl(url: string, acceptLanguage?: string): Promise<{ title: string; description: string } | null> {
  const pathname = url.split("?")[0];
  const language = detectLanguageFromUrl(url, acceptLanguage);
  const cacheKey = `${pathname}:${language}`;
  const cached = seoCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) return { title: cached.title, description: cached.description };
  // Also cache all languages at once for this pathname to reduce DB hits
  const allLangsCacheKey = `${pathname}:__all`;
  try {
    const db = await getDb();
    if (!db) return null;
    let result: { title: string; description: string } | null = null;
    const areaMatch = pathname.match(/^\/areas\/([^/?]+)$/);
    if (areaMatch) {
      const rows = await db.select({ seoMeta: areas.seoMeta }).from(areas).where(eq(areas.slug, areaMatch[1])).limit(1);
      if (rows[0]) result = parseSeoMeta(rows[0].seoMeta, language);
    }
    const catMatch = pathname.match(/^\/categories\/([^/?]+)$/);
    if (catMatch) {
      const rows = await db.select({ seoMeta: categories.seoMeta }).from(categories).where(eq(categories.slug, catMatch[1])).limit(1);
      if (rows[0]) result = parseSeoMeta(rows[0].seoMeta, language);
    }
    const staticPageSlugs: Record<string, string> = {
      "/": "home", "/areas": "areas", "/categories": "categories",
      "/about-us": "about-us", "/how-it-works": "how-it-works",
      "/services": "services", "/privacy-policy": "privacy-policy",
      "/terms-of-service": "terms-of-service",
    };
    if (staticPageSlugs[pathname]) {
      const rows = await db.select({ seoMeta: pages.seoMeta }).from(pages).where(eq(pages.slug, staticPageSlugs[pathname])).limit(1);
      if (rows[0]) result = parseSeoMeta(rows[0].seoMeta, language);
    }
    if (result?.title) seoCache.set(cacheKey, { ...result, expiry: Date.now() + CACHE_TTL });
    return result;
  } catch {
    return null;
  }
}

const BASE_URL = "https://fastlygo.mk";
const OG_IMAGE = "https://fastlygo.mk/og-image.e6740bbc.jpg";

/**
 * Server-side SEO injection:
 * Injects correct title, description, canonical, hreflang, og:*, twitter:* tags
 * into static HTML so Google bot sees correct content before JS executes.
 * Overwrites any Manus-generated placeholder tags with correct values.
 */
function injectSeoIntoHtml(
  html: string,
  title: string,
  description: string,
  pathname: string,
  language: string
): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeTitle = title ? esc(title) : "FastlyGo";
  const safeDesc = esc(description || "");

  // Canonical URL: always BASE_URL, clean path (no ?lang= in canonical)
  const canonicalUrl = `${BASE_URL}${pathname}`;

  // hreflang URLs
  const hrefEn = `${BASE_URL}${pathname}`;
  const hrefTr = `${BASE_URL}${pathname}?lang=tr`;
  const hrefMk = `${BASE_URL}${pathname}?lang=mk`;
  const hrefSq = `${BASE_URL}${pathname}?lang=sq`;

  // OG locale map
  const ogLocale: Record<string, string> = { en: "en_US", tr: "tr_TR", mk: "mk_MK", sq: "sq_AL" };
  const locale = ogLocale[language] || "en_US";

  // Current page URL (with lang param if non-English)
  const currentUrl = language !== "en" ? `${BASE_URL}${pathname}?lang=${language}` : canonicalUrl;

  // Build the full SEO block to inject before </head>
  const seoBlock = `
  <!-- Server-side SEO injection -->
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <link rel="alternate" hreflang="x-default" href="${hrefEn}" />
  <link rel="alternate" hreflang="en" href="${hrefEn}" />
  <link rel="alternate" hreflang="tr" href="${hrefTr}" />
  <link rel="alternate" hreflang="mk" href="${hrefMk}" />
  <link rel="alternate" hreflang="sq" href="${hrefSq}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${currentUrl}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:site_name" content="FastlyGo" />
  <meta property="og:locale" content="${locale}" />
  <meta property="og:image" content="${OG_IMAGE}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${OG_IMAGE}" />`;

  // Remove any existing Manus-injected or duplicate og/twitter/canonical/hreflang tags
  html = html
    .replace(/<title>[^<]*<\/title>/g, "")
    .replace(/<meta name="description"[^>]*\/?>/g, "")
    .replace(/<link rel="canonical"[^>]*\/?>/g, "")
    .replace(/<link rel="alternate" hreflang[^>]*\/?>/g, "")
    .replace(/<link rel="alternate" hrefLang[^>]*\/?>/g, "")
    .replace(/<meta property="og:[^>]*\/?>/g, "")
    .replace(/<meta name="twitter:[^>]*\/?>/g, "");

  // Inject our clean SEO block before </head>
  html = html.replace("</head>", `${seoBlock}
</head>`);

  return html;
}

export async function setupVite(app: Express, server: Server) {
  const serverPort = parseInt(process.env.PORT || "3000");
  const serverOptions = {
    // Spread viteConfig.server first so allowedHosts etc. are preserved
    ...(viteConfig.server as Record<string, unknown> || {}),
    middlewareMode: true as const,
    // port must match Express server port so Vite builds correct serverHost for HMR WebSocket
    port: serverPort,
    // HMR: attach to Express HTTP server so Vite does NOT fall back to port 24678
    // Manus proxy does not support WebSocket upgrade, so connections will fail silently
    // overlay: false suppresses the error overlay in the browser
    hmr: {
      server,
      overlay: false,
    },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Serve sitemap.xml and robots.txt from server/static (Manus does not override this directory)
  app.get("/sitemap.xml", (_req, res) => {
    const sitemapPath = path.resolve(import.meta.dirname, "..", "static", "sitemap.xml");
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(sitemapPath);
  });

  app.get("/robots.txt", (_req, res) => {
    const robotsPath = path.resolve(import.meta.dirname, "..", "static", "robots.txt");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(robotsPath);
  });

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      let page = await vite.transformIndexHtml(url, template);
      // Server-side SEO injection - inject correct title/description for Google bot
      // Language detection: ?lang= param → Accept-Language header → default EN
      const acceptLang = req.headers["accept-language"] as string | undefined;
      const seoData = await getSeoForUrl(url, acceptLang);
      const _pathname = url.split("?")[0];
      const _language = detectLanguageFromUrl(url, acceptLang);
      page = injectSeoIntoHtml(page, seoData?.title || "", seoData?.description || "", _pathname, _language);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Serve sitemap.xml and robots.txt from server/static (Manus does not override this directory)
  const staticSourcePath = path.resolve(import.meta.dirname, "..", "static");
  app.get("/sitemap.xml", (_req, res) => {
    const sitemapPath = path.join(staticSourcePath, "sitemap.xml");
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(sitemapPath);
  });
  app.get("/robots.txt", (_req, res) => {
    const robotsPath = path.join(staticSourcePath, "robots.txt");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(robotsPath);
  });

  app.use(express.static(distPath));

  // Explicit page routes for SEO injection
  // Manus proxy forwards explicit routes to Express but bypasses wildcard SPA fallback
  const seoPages = [
    "/", "/how-it-works", "/about-us", "/services", "/areas",
    "/new-order", "/login", "/register", "/courier-register",
    "/business/register", "/my-orders", "/profile",
    "/privacy-policy", "/terms-of-service", "/forgot-password",
    "/notifications", "/notification-settings", "/settings/notifications",
    "/courier", "/courier/register", "/courier/payments",
    "/business", "/admin", "/admin/login",
    "/verify-email", "/reset-password", "/pending-approval",
    "/track-order/:orderNumber", "/categories/:slug", "/areas/:slug",
    "/api-docs", "/404"
  ];

  const serveSeoHtml = async (req: any, res: any) => {
    const indexPath = path.resolve(distPath, "index.html");
    const url = req.originalUrl || req.url;
    fs.readFile(indexPath, "utf-8", async (err, html) => {
      if (err) { res.sendFile(indexPath); return; }
      const acceptLang = req.headers?.["accept-language"] as string | undefined;
      const seoData = await getSeoForUrl(url, acceptLang).catch(() => null);
      const _pathname = url.split("?")[0];
      const _language = detectLanguageFromUrl(url, acceptLang);
      html = injectSeoIntoHtml(html, seoData?.title || "", seoData?.description || "", _pathname, _language);
      res.status(200).set({ "Content-Type": "text/html", "X-SEO-Injected": "true" }).end(html);
    });
  };

  for (const pagePath of seoPages) {
    app.get(pagePath, serveSeoHtml);
  }

  // fall through to index.html if the file doesn't exist
  app.use("*", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    const url = req.originalUrl || req.url;
    fs.readFile(indexPath, "utf-8", async (err, html) => {
      if (err) { res.sendFile(indexPath); return; }
      // Server-side SEO injection
      const acceptLang = (req as any).headers?.["accept-language"] as string | undefined;
      const seoData = await getSeoForUrl(url, acceptLang).catch(() => null);
      const _pathname = url.split("?")[0];
      const _language = detectLanguageFromUrl(url, acceptLang);
      html = injectSeoIntoHtml(html, seoData?.title || "", seoData?.description || "", _pathname, _language);
      res.status(200).set({ "Content-Type": "text/html", "X-SEO-Injected": "true" }).end(html);
    });
  });
}
