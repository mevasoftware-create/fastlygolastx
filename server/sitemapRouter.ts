/**
 * Dynamic Sitemap Generator
 * Generates sitemap.xml with all area and category pages
 */
import { Router, Request, Response } from "express";
import { getDb } from "./db";
import { areas, categories } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

const BASE_URL = "https://fastlygo.mk";
const LANGUAGES = ["en", "tr", "mk", "sq"];

// Cache sitemap to avoid DB hits on every request
let sitemapCache: string | null = null;
let sitemapCacheExpiry = 0;
const SITEMAP_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function generateSitemap(): Promise<string> {
  if (sitemapCache && sitemapCacheExpiry > Date.now()) {
    return sitemapCache;
  }

  const db = await getDb();
  
  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/areas", priority: "0.9", changefreq: "weekly" },
    { url: "/categories", priority: "0.9", changefreq: "weekly" },
    { url: "/about-us", priority: "0.7", changefreq: "monthly" },
    { url: "/how-it-works", priority: "0.7", changefreq: "monthly" },
    { url: "/services", priority: "0.7", changefreq: "monthly" },
    { url: "/privacy-policy", priority: "0.4", changefreq: "yearly" },
    { url: "/terms-of-service", priority: "0.4", changefreq: "yearly" },
  ];

  let areaRows: { slug: string }[] = [];
  let categoryRows: { slug: string }[] = [];

  if (db) {
    try {
      areaRows = await db.select({ slug: areas.slug }).from(areas).where(eq(areas.active, true));
      categoryRows = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.active, true));
    } catch {
      // Use empty arrays if DB fails
    }
  }

  const now = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

  // Static pages with hreflang
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${page.url}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}${page.url}"/>
    <xhtml:link rel="alternate" hreflang="tr" href="${BASE_URL}${page.url}?lang=tr"/>
    <xhtml:link rel="alternate" hreflang="mk" href="${BASE_URL}${page.url}?lang=mk"/>
    <xhtml:link rel="alternate" hreflang="sq" href="${BASE_URL}${page.url}?lang=sq"/>
  </url>
`;
  }

  // Area pages
  for (const area of areaRows) {
    const url = `/areas/${area.slug}`;
    xml += `  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${url}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}${url}"/>
    <xhtml:link rel="alternate" hreflang="tr" href="${BASE_URL}${url}?lang=tr"/>
    <xhtml:link rel="alternate" hreflang="mk" href="${BASE_URL}${url}?lang=mk"/>
    <xhtml:link rel="alternate" hreflang="sq" href="${BASE_URL}${url}?lang=sq"/>
  </url>
`;
  }

  // Category pages
  for (const cat of categoryRows) {
    const url = `/categories/${cat.slug}`;
    xml += `  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${url}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}${url}"/>
    <xhtml:link rel="alternate" hreflang="tr" href="${BASE_URL}${url}?lang=tr"/>
    <xhtml:link rel="alternate" hreflang="mk" href="${BASE_URL}${url}?lang=mk"/>
    <xhtml:link rel="alternate" hreflang="sq" href="${BASE_URL}${url}?lang=sq"/>
  </url>
`;
  }

  xml += `</urlset>`;

  sitemapCache = xml;
  sitemapCacheExpiry = Date.now() + SITEMAP_CACHE_TTL;

  return xml;
}

router.get("/sitemap.xml", async (req: Request, res: Response) => {
  try {
    const xml = await generateSitemap();
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    console.error("[Sitemap] Error generating sitemap:", err);
    res.status(500).send("Error generating sitemap");
  }
});

// Sitemap index (for large sites)
router.get("/sitemap-index.xml", async (req: Request, res: Response) => {
  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
  res.set("Content-Type", "application/xml; charset=utf-8");
  res.send(xml);
});

export default router;
