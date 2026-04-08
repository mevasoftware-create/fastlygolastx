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
      "/new-order": "new-order",
      "/courier/register": "courier-register",
      "/business/register": "business-register",
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
  // Fallback SEO data for pages not in DB - multi-language
  const fallbackSeoAll: Record<string, Record<string, { title: string; description: string }>> = {
    "/": {
      en: { title: "FastlyGo - Food Delivery, Courier and Cargo Services in Skopje", description: "Fast courier & delivery service in Skopje. Food, cargo, package delivery in 15 minutes. Real-time tracking, affordable prices." },
      tr: { title: "FastlyGo - Üsküp Yemek Teslimat, Kurye ve Kargo Hizmetleri", description: "Üsküp'te hızlı kurye ve teslimat hizmeti. Yemek, kargo, paket teslimatı 15 dakikada. Gerçek zamanlı takip, uygun fiyatlar." },
      mk: { title: "FastlyGo - Достава на Храна, Курирски Услуги во Скопје", description: "Брза курирска и доставна услуга во Скопје. Храна, карго, пакети за 15 минути." },
      sq: { title: "FastlyGo - Dorëzim Ushqimi, Shërbime Korrierë në Shkup", description: "Shërbim i shpejtë korrieri në Shkup. Ushqim, kargo, dorëzim pako në 15 minuta." },
    },
    "/how-it-works": {
      en: { title: "How It Works - FastlyGo Delivery Process | Skopje", description: "Learn how FastlyGo delivery works. Simple 4-step process: Order online, courier accepts, real-time tracking, delivery in 15 minutes." },
      tr: { title: "Nasıl Çalışır - FastlyGo Teslimat Süreci | Üsküp", description: "FastlyGo teslimat sürecini öğrenin. 4 basit adım: Online sipariş, kurye kabul, gerçek zamanlı takip, 15 dakikada teslimat." },
      mk: { title: "Како Функционира - FastlyGo Процес на Достава", description: "Научете како функционира FastlyGo доставата. 4 едноставни чекори." },
      sq: { title: "Si Funksionon - Procesi i Dorëzimit FastlyGo", description: "Mësoni si funksionon dorëzimi FastlyGo. 4 hapa të thjeshtë." },
    },
    "/about-us": {
      en: { title: "About FastlyGo - Courier & Delivery Service in Skopje", description: "FastlyGo is a professional courier and delivery service in Skopje, Macedonia. 53+ active couriers, 15-minute delivery." },
      tr: { title: "Hakkımızda - FastlyGo Üsküp Kurye Hizmeti", description: "FastlyGo, Üsküp Makedonya'da profesyonel kurye ve teslimat hizmeti. 53+ aktif kurye, 15 dakika teslimat." },
      mk: { title: "За Нас - FastlyGo Курирска Услуга во Скопје", description: "FastlyGo е професионална курирска услуга во Скопје. 53+ активни курири." },
      sq: { title: "Rreth Nesh - FastlyGo Shërbim Korrieri në Shkup", description: "FastlyGo është shërbim profesional korrieri në Shkup. 53+ korrierë aktivë." },
    },
    "/services": {
      en: { title: "Our Services - FastlyGo Delivery Categories | Skopje", description: "Explore FastlyGo delivery services: food, grocery, pharmacy, cargo, document delivery in Skopje." },
      tr: { title: "Hizmetlerimiz - FastlyGo Teslimat Kategorileri | Üsküp", description: "FastlyGo teslimat hizmetlerini keşfedin: yemek, market, eczane, kargo, evrak teslimatı." },
      mk: { title: "Наши Услуги - FastlyGo Категории на Достава", description: "Истражете ги услугите на FastlyGo: храна, маркет, аптека, карго." },
      sq: { title: "Shërbimet Tona - FastlyGo Kategori Dorëzimi", description: "Eksploroni shërbimet e FastlyGo: ushqim, market, farmaci, kargo." },
    },
    "/areas": {
      en: { title: "Delivery Areas - FastlyGo Coverage in Skopje", description: "Check FastlyGo delivery coverage areas in Skopje. Fast delivery to 38+ neighborhoods." },
      tr: { title: "Teslimat Bölgeleri - FastlyGo Üsküp Kapsam Alanı", description: "FastlyGo Üsküp teslimat bölgelerini kontrol edin. 38+ mahalleye hızlı teslimat." },
      mk: { title: "Области на Достава - FastlyGo Покриеност во Скопје", description: "Проверете ги областите на достава на FastlyGo. 38+ населби." },
      sq: { title: "Zonat e Dorëzimit - FastlyGo Mbulimi në Shkup", description: "Kontrolloni zonat e dorëzimit të FastlyGo. Dorëzim i shpejtë në 38+ lagje." },
    },
    "/new-order": {
      en: { title: "Order Now - FastlyGo Quick Courier | Skopje", description: "Place your delivery order with FastlyGo. Fast courier service in Skopje." },
      tr: { title: "Hemen Sipariş Ver - FastlyGo Hızlı Kurye | Üsküp", description: "FastlyGo ile teslimat siparişinizi verin. Üsküp'te hızlı kurye hizmeti." },
      mk: { title: "Нарачај Сега - FastlyGo Брз Курир", description: "Направете нарачка со FastlyGo. Брза курирска услуга." },
      sq: { title: "Porosit Tani - FastlyGo Korrier i Shpejtë", description: "Bëni porosi me FastlyGo. Shërbim i shpejtë korrieri në Shkup." },
    },
    "/privacy-policy": {
      en: { title: "Privacy Policy - FastlyGo", description: "FastlyGo privacy policy. How we collect, use, and protect your data." },
      tr: { title: "Gizlilik Politikası - FastlyGo", description: "FastlyGo gizlilik politikası. Verilerinizi nasıl topladığımızı öğrenin." },
      mk: { title: "Политика на Приватност - FastlyGo", description: "FastlyGo политика на приватност." },
      sq: { title: "Politika e Privatësisë - FastlyGo", description: "Politika e privatësisë e FastlyGo." },
    },
    "/terms-of-service": {
      en: { title: "Terms of Service - FastlyGo", description: "FastlyGo terms of service." },
      tr: { title: "Hizmet Koşulları - FastlyGo", description: "FastlyGo hizmet koşulları." },
      mk: { title: "Услови на Употреба - FastlyGo", description: "FastlyGo услови на употреба." },
      sq: { title: "Kushtet e Shërbimit - FastlyGo", description: "Kushtet e shërbimit të FastlyGo." },
    },
    "/courier/register": {
      en: { title: "Become a Courier - FastlyGo Driver Registration", description: "Join FastlyGo as a courier. Flexible hours, competitive pay." },
      tr: { title: "Kurye Ol - FastlyGo Sürücü Kayıt", description: "FastlyGo'ya kurye olarak katılın. Esnek saatler, rekabetçi ücret." },
      mk: { title: "Стани Курир - FastlyGo Регистрација", description: "Придружете се на FastlyGo како курир." },
      sq: { title: "Bëhu Korrier - Regjistrimi FastlyGo", description: "Bashkohuni me FastlyGo si korrier." },
    },
    "/business/register": {
      en: { title: "Business Registration - FastlyGo Partner Program", description: "Partner with FastlyGo for business deliveries." },
      tr: { title: "İşletme Kayıt - FastlyGo Partner Programı", description: "FastlyGo ile işletme teslimatlarınız için ortak olun." },
      mk: { title: "Регистрација на Бизнис - FastlyGo", description: "Партнерирајте со FastlyGo." },
      sq: { title: "Regjistrimi i Biznesit - FastlyGo", description: "Partnerizohu me FastlyGo." },
    },
    "/login": {
      en: { title: "Login - FastlyGo Account", description: "Log in to your FastlyGo account." },
      tr: { title: "Giriş - FastlyGo Hesabı", description: "FastlyGo hesabınıza giriş yapın." },
      mk: { title: "Најава - FastlyGo Сметка", description: "Најавете се на вашата FastlyGo сметка." },
      sq: { title: "Hyrje - Llogaria FastlyGo", description: "Hyni në llogarinë tuaj FastlyGo." },
    },
    "/register": {
      en: { title: "Register - Create FastlyGo Account", description: "Create your FastlyGo account." },
      tr: { title: "Kayıt Ol - FastlyGo Hesabı Oluştur", description: "FastlyGo hesabınızı oluşturun." },
      mk: { title: "Регистрација - FastlyGo Сметка", description: "Креирајте FastlyGo сметка." },
      sq: { title: "Regjistrohu - Krijo Llogari FastlyGo", description: "Krijoni llogarinë tuaj FastlyGo." },
    },
  };
  const fbLang = fallbackSeoAll[pathname];
  const fb = fbLang ? (fbLang[language] || fbLang.en) : null;
  const safeTitle = title ? esc(title) : (fb ? esc(fb.title) : "FastlyGo");
  const safeDesc = esc(description || fb?.description || "");

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
