/**
 * SEO Middleware - Server-Side Title & Meta Injection
 * Injects correct <title> and <meta description> into HTML before sending to client.
 * This ensures Google bot sees correct titles even before JavaScript runs.
 */
import { Request, Response, NextFunction } from "express";
import { getDb } from "../db";
import { areas, categories, pages } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Cache SEO data to avoid DB hits on every request
const seoCache = new Map<string, { title: string; description: string; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function detectLanguage(req: Request): string {
  const lang = req.query.lang as string;
  if (lang && ["tr", "mk", "sq", "en"].includes(lang)) return lang;
  const acceptLang = req.headers["accept-language"] || "";
  if (acceptLang.includes("mk")) return "mk";
  if (acceptLang.includes("tr")) return "tr";
  if (acceptLang.includes("sq")) return "sq";
  return "en";
}

function parseSeoMeta(seoMetaRaw: any, language: string): { title: string; description: string } {
  try {
    const seoMeta = typeof seoMetaRaw === "string" ? JSON.parse(seoMetaRaw) : seoMetaRaw;
    const data = seoMeta?.[language] || seoMeta?.en || {};
    return {
      title: data.title || "",
      description: data.description || "",
    };
  } catch {
    return { title: "", description: "" };
  }
}

async function getSeoForPath(pathname: string, language: string): Promise<{ title: string; description: string } | null> {
  const cacheKey = `${pathname}:${language}`;
  const cached = seoCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return { title: cached.title, description: cached.description };
  }

  try {
    const db = await getDb();
    if (!db) return null;

    let result: { title: string; description: string } | null = null;

    // Match /areas/:slug
    const areaMatch = pathname.match(/^\/areas\/([^/?]+)/);
    if (areaMatch) {
      const slug = areaMatch[1];
      const rows = await db.select({ seoMeta: areas.seoMeta }).from(areas).where(eq(areas.slug, slug)).limit(1);
      if (rows[0]) {
        result = parseSeoMeta(rows[0].seoMeta, language);
      }
    }

    // Match /categories/:slug
    const catMatch = pathname.match(/^\/categories\/([^/?]+)/);
    if (catMatch) {
      const slug = catMatch[1];
      const rows = await db.select({ seoMeta: categories.seoMeta }).from(categories).where(eq(categories.slug, slug)).limit(1);
      if (rows[0]) {
        result = parseSeoMeta(rows[0].seoMeta, language);
      }
    }

    // Match /areas (list page)
    if (pathname === "/areas") {
      const rows = await db.select({ seoMeta: pages.seoMeta }).from(pages).where(eq(pages.slug, "areas")).limit(1);
      if (rows[0]) {
        result = parseSeoMeta(rows[0].seoMeta, language);
      }
    }

    // Match /categories (list page)
    if (pathname === "/categories") {
      const rows = await db.select({ seoMeta: pages.seoMeta }).from(pages).where(eq(pages.slug, "categories")).limit(1);
      if (rows[0]) {
        result = parseSeoMeta(rows[0].seoMeta, language);
      }
    }

    // Match static pages (/, /about-us, /how-it-works, /services, etc.)
    const staticPageSlugs: Record<string, string> = {
      "/": "home",
      "/about-us": "about-us",
      "/how-it-works": "how-it-works",
      "/services": "services",
      "/privacy-policy": "privacy-policy",
      "/terms-of-service": "terms-of-service",
    };
    if (staticPageSlugs[pathname]) {
      const rows = await db.select({ seoMeta: pages.seoMeta }).from(pages).where(eq(pages.slug, staticPageSlugs[pathname])).limit(1);
      if (rows[0]) {
        result = parseSeoMeta(rows[0].seoMeta, language);
      }
    }

    if (result && result.title) {
      seoCache.set(cacheKey, { ...result, expiry: Date.now() + CACHE_TTL });
    }
    return result;
  } catch {
    return null;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function injectSeoTags(html: string, title: string, description: string): string {
  if (!title) return html;

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description || "");

  // Replace <title> tag
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`);

  // Replace or inject meta description
  if (safeDesc) {
    if (html.includes('name="description"')) {
      html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${safeDesc}">`);
    } else {
      html = html.replace("</head>", `<meta name="description" content="${safeDesc}">\n</head>`);
    }
  }

  // Replace og:title
  if (html.includes('property="og:title"')) {
    html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${safeTitle}">`);
  }

  // Replace og:description
  if (safeDesc && html.includes('property="og:description"')) {
    html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${safeDesc}">`);
  }

  return html;
}

export async function seoMiddlewareHandler(req: Request, res: Response, next: NextFunction) {
  // Only process HTML requests (not API, assets, etc.)
  const accept = req.headers.accept || "";
  if (!accept.includes("text/html") && !accept.includes("*/*")) {
    return next();
  }

  // Skip API routes
  const url = req.originalUrl || req.url;
  if (url.startsWith("/api/") || url.startsWith("/socket.io") || url.includes(".")) {
    return next();
  }

  // Intercept the response to inject SEO tags
  const originalSend = res.send.bind(res);
  res.send = function (body: any) {
    if (typeof body === "string" && body.includes("<title>")) {
      const pathname = url.split("?")[0];
      const language = detectLanguage(req);

      // Run async SEO injection
      getSeoForPath(pathname, language).then((seoData) => {
        if (seoData && seoData.title) {
          body = injectSeoTags(body, seoData.title, seoData.description);
        }
        return originalSend(body);
      }).catch(() => {
        return originalSend(body);
      });
    } else {
      return originalSend(body);
    }
  } as any;

  next();
}

// Keep old export for backward compatibility
export function seoMiddleware(req: Request, res: Response, next: NextFunction) {
  next();
}
