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

// Server-side SEO injection: only injects title + description into static HTML
// so Google bot sees correct content before JS executes.
// hreflang tags are handled by SEOHead component (React 19 head hoisting) - no duplication needed.
function injectSeoIntoHtml(html: string, title: string, description: string): string {
  if (!title) return html;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeTitle = esc(title);
  const safeDesc = esc(description || "");
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`);
  if (html.includes('property="og:title"')) html = html.replace(/<meta property="og:title"[^>]*\/?>/, `<meta property="og:title" content="${safeTitle}"/>`);
  if (safeDesc) {
    if (html.includes('name="description"')) html = html.replace(/<meta name="description"[^>]*\/?>/, `<meta name="description" content="${safeDesc}"/>`);
    else html = html.replace("</head>", `  <meta name="description" content="${safeDesc}"/>\n</head>`);
    if (html.includes('property="og:description"')) html = html.replace(/<meta property="og:description"[^>]*\/?>/, `<meta property="og:description" content="${safeDesc}"/>`);
  }
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
      if (seoData?.title) page = injectSeoIntoHtml(page, seoData.title, seoData.description);
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
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    const url = req.originalUrl || req.url;
    fs.readFile(indexPath, "utf-8", async (err, html) => {
      if (err) { res.sendFile(indexPath); return; }
      // Server-side SEO injection
      const acceptLang = (req as any).headers?.["accept-language"] as string | undefined;
      const seoData = await getSeoForUrl(url, acceptLang).catch(() => null);
      if (seoData?.title) html = injectSeoIntoHtml(html, seoData.title, seoData.description);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    });
  });
}
