/**
 * Server-Side SEO Meta Tag Injection Middleware
 * 
 * This middleware injects SEO meta tags (title, description, canonical, hreflang)
 * into the HTML BEFORE JavaScript runs, so Google can read them without executing JS.
 * 
 * This is critical because React's Helmet/react-helmet-async injects tags AFTER JS loads,
 * which means Googlebot may not see them if it doesn't execute JavaScript.
 */

import { Request, Response, NextFunction } from "express";

const BASE_URL = "https://fastlygo.mk";

// Pages that should NOT be indexed by search engines
const NOINDEX_PATHS = [
  "/admin",
  "/admin/",
  "/admin/login",
  "/courier-dashboard",
  "/courier/dashboard",
  "/business/dashboard",
  "/business-dashboard",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/pending-approval",
  "/profile",
  "/my-orders",
  "/order-history",
  "/new-order",
  "/notifications",
  "/notification-settings",
  "/settings",
  "/track",
  "/courier/payments",
  "/courier/map",
];

// Check if a path should be noindex
function isNoindexPath(pathname: string): boolean {
  // Admin pages (all subpaths)
  if (pathname.startsWith("/admin")) return true;
  // Courier dashboard pages
  if (pathname.startsWith("/courier-dashboard")) return true;
  if (pathname.startsWith("/courier/dashboard")) return true;
  // Business dashboard pages
  if (pathname.startsWith("/business/dashboard")) return true;
  if (pathname.startsWith("/business-dashboard")) return true;
  // Auth and user pages
  return NOINDEX_PATHS.includes(pathname);
}

// Page meta data for each route and language
const PAGE_META: Record<string, Record<string, { title: string; description: string; keywords?: string }>> = {
  "/": {
    en: {
      title: "FastlyGo - Fast & Reliable Courier Delivery in Skopje",
      description: "FastlyGo offers fast and reliable courier delivery in Skopje, Macedonia. Order food, groceries, medicines and more. Real-time tracking, 50+ active couriers.",
      keywords: "courier delivery Skopje, fast delivery Macedonia, food delivery, grocery delivery, FastlyGo"
    },
    tr: {
      title: "FastlyGo - Üsküp'te Hızlı ve Güvenilir Kurye Teslimatı",
      description: "FastlyGo, Üsküp'te hızlı ve güvenilir kurye teslimatı sunar. Yemek, market, ilaç ve daha fazlasını sipariş edin. Gerçek zamanlı takip, 50+ aktif kurye.",
      keywords: "kurye teslimat Üsküp, hızlı teslimat Makedonya, yemek teslimatı, FastlyGo"
    },
    mk: {
      title: "FastlyGo - Брза и Доверлива Курирска Достава во Скопје",
      description: "FastlyGo нуди брза и доверлива курирска достава во Скопје, Македонија. Нарачајте храна, намирници, лекови и повеќе. Следење во реално време, 50+ активни курири.",
      keywords: "курирска достава Скопје, брза достава Македонија, FastlyGo"
    },
    sq: {
      title: "FastlyGo - Shërbim i Shpejtë dhe i Besueshëm Korrieri në Shkup",
      description: "FastlyGo ofron shërbim të shpejtë dhe të besueshëm korrieri në Shkup, Maqedoni. Porosisni ushqim, ushqimore, ilaçe dhe më shumë. Gjurmim në kohë reale, 50+ korrier aktivë.",
      keywords: "shërbim korrieri Shkup, dorëzim i shpejtë Maqedoni, FastlyGo"
    }
  },
  "/how-it-works": {
    en: {
      title: "How It Works - FastlyGo Delivery Process",
      description: "Learn how FastlyGo works: Create order, match with courier, live tracking, delivery completed. Fast 4-step delivery process in Skopje.",
      keywords: "how FastlyGo works, delivery process, courier service Skopje"
    },
    tr: {
      title: "Nasıl Çalışır - FastlyGo Teslimat Süreci",
      description: "FastlyGo'nun nasıl çalıştığını öğrenin: Sipariş oluştur, kurye eşleştir, canlı takip, teslimat tamamlandı. Üsküp'te hızlı 4 adımlı teslimat süreci.",
      keywords: "FastlyGo nasıl çalışır, teslimat süreci, kurye hizmeti"
    },
    mk: {
      title: "Како Функционира - Процес на Достава FastlyGo",
      description: "Дознајте kako функционира FastlyGo: Создадете нарачка, поврзете се со курир, следење во живо, доставата е завршена.",
      keywords: "FastlyGo kako funkcionira, proces na dostava, kurirska usluga Skopje"
    },
    sq: {
      title: "Si Funksionon - Procesi i Dorëzimit FastlyGo",
      description: "Mësoni si funksionon FastlyGo: Krijoni porosi, përputhuni me korrierin, gjurmim i drejtpërdrejtë, dorëzimi i përfunduar.",
      keywords: "si funksionon FastlyGo, procesi i dorëzimit, shërbim korrieri"
    }
  },
  "/services": {
    en: {
      title: "Our Services - FastlyGo Delivery Services",
      description: "FastlyGo offers food delivery, grocery delivery, pharmacy courier, document delivery and more in Skopje. Professional courier services for all needs.",
      keywords: "delivery services Skopje, food delivery, grocery delivery, pharmacy courier, FastlyGo services"
    },
    tr: {
      title: "Hizmetlerimiz - FastlyGo Teslimat Hizmetleri",
      description: "FastlyGo, Üsküp'te yemek teslimatı, market teslimatı, eczane kurye, belge teslimatı ve daha fazlasını sunar. Tüm ihtiyaçlar için profesyonel kurye hizmetleri.",
      keywords: "teslimat hizmetleri Üsküp, yemek teslimatı, market teslimatı, eczane kurye"
    },
    mk: {
      title: "Нашите Услуги - Услуги за Достава FastlyGo",
      description: "FastlyGo нуди достава на храна, намирници, аптека, документи и повеќе во Скопје. Професионални курирски услуги за сите потреби.",
      keywords: "услуги за достава Скопје, FastlyGo услуги"
    },
    sq: {
      title: "Shërbimet Tona - Shërbimet e Dorëzimit FastlyGo",
      description: "FastlyGo ofron dorëzim ushqimi, ushqimore, farmaci, dokumente dhe më shumë në Shkup. Shërbime profesionale korrieri për të gjitha nevojat.",
      keywords: "shërbime dorëzimi Shkup, FastlyGo shërbime"
    }
  },
  "/about": {
    en: {
      title: "About Us - FastlyGo Courier Platform",
      description: "FastlyGo is Skopje's leading multi-vehicle courier platform. Learn about our mission, team and commitment to fast, reliable delivery in Macedonia.",
      keywords: "about FastlyGo, courier platform Skopje, delivery company Macedonia"
    },
    tr: {
      title: "Hakkımızda - FastlyGo Kurye Platformu",
      description: "FastlyGo, Üsküp'ün önde gelen çok araçlı kurye platformudur. Misyonumuz, ekibimiz ve Makedonya'da hızlı, güvenilir teslimat taahhüdümüz hakkında bilgi edinin.",
      keywords: "FastlyGo hakkında, kurye platformu Üsküp, teslimat şirketi"
    },
    mk: {
      title: "За Нас - Курирска Платформа FastlyGo",
      description: "FastlyGo е водечката мулти-возилна курирска платформа во Скопје. Дознајте за нашата мисија, тим и посветеност кон брза, доверлива достава во Македонија.",
      keywords: "za FastlyGo, kurirska platforma Skopje, kompanija za dostava"
    },
    sq: {
      title: "Rreth Nesh - Platforma Korrieri FastlyGo",
      description: "FastlyGo është platforma kryesore e korrieries me shumë mjete në Shkup. Mësoni për misionin, ekipin dhe angazhimin tonë ndaj dorëzimit të shpejtë dhe të besueshëm.",
      keywords: "rreth FastlyGo, platforma korrieri Shkup"
    }
  },
  "/about-us": {
    en: {
      title: "About Us - FastlyGo Courier Platform",
      description: "FastlyGo is Skopje's leading multi-vehicle courier platform. Learn about our mission, team and commitment to fast, reliable delivery in Macedonia.",
      keywords: "about FastlyGo, courier platform Skopje, delivery company Macedonia"
    },
    tr: {
      title: "Hakkımızda - FastlyGo Kurye Platformu",
      description: "FastlyGo, Üsküp'ün önde gelen çok araçlı kurye platformudur. Misyonumuz, ekibimiz ve Makedonya'da hızlı, güvenilir teslimat taahhüdümüz hakkında bilgi edinin.",
      keywords: "FastlyGo hakkında, kurye platformu Üsküp, teslimat şirketi"
    },
    mk: {
      title: "За Нас - Курирска Платформа FastlyGo",
      description: "FastlyGo е водечката мулти-возилна курирска платформа во Скопје.",
      keywords: "za FastlyGo, kurirska platforma Skopje"
    },
    sq: {
      title: "Rreth Nesh - Platforma Korrieri FastlyGo",
      description: "FastlyGo është platforma kryesore e korrieries me shumë mjete në Shkup.",
      keywords: "rreth FastlyGo, platforma korrieri Shkup"
    }
  },
  "/contact": {
    en: {
      title: "Contact Us - FastlyGo",
      description: "Contact FastlyGo for courier delivery services in Skopje. Reach us by phone, email or through our app. We're available 24/7.",
      keywords: "contact FastlyGo, courier service contact Skopje"
    },
    tr: {
      title: "İletişim - FastlyGo",
      description: "Üsküp'te kurye teslimat hizmetleri için FastlyGo ile iletişime geçin. Telefon, e-posta veya uygulamamız aracılığıyla bize ulaşın. 7/24 hizmetinizdeyiz.",
      keywords: "FastlyGo iletişim, kurye hizmeti iletişim"
    },
    mk: {
      title: "Контактирајте Нè - FastlyGo",
      description: "Контактирајте нè за курирски услуги за достава во Скопје. Достапни сме 24/7.",
      keywords: "kontakt FastlyGo, kurirska usluga kontakt Skopje"
    },
    sq: {
      title: "Na Kontaktoni - FastlyGo",
      description: "Kontaktoni FastlyGo për shërbime korrieri në Shkup. Jemi të disponueshëm 24/7.",
      keywords: "kontakt FastlyGo, shërbim korrieri kontakt Shkup"
    }
  },
  "/areas": {
    en: {
      title: "Delivery Areas - FastlyGo Coverage in Skopje",
      description: "FastlyGo delivers across all major neighborhoods in Skopje: Centar, Karpoš, Aerodrom, Čair, Kisela Voda and more. Check if we deliver to your area.",
      keywords: "delivery areas Skopje, FastlyGo coverage, neighborhoods Skopje delivery"
    },
    tr: {
      title: "Teslimat Bölgeleri - FastlyGo Üsküp Kapsamı",
      description: "FastlyGo, Üsküp'ün tüm büyük mahallelerine teslimat yapar: Centar, Karpoş, Aerodrom, Çair, Kisela Voda ve daha fazlası.",
      keywords: "teslimat bölgeleri Üsküp, FastlyGo kapsama alanı, mahalle teslimat"
    },
    mk: {
      title: "Области на Достава - FastlyGo Покриеност во Скопје",
      description: "FastlyGo доставува низ сите главни населби во Скопје: Центар, Карпош, Аеродром, Чаир, Кисела Вода и повеќе.",
      keywords: "области на достава Скопје, FastlyGo покриеност"
    },
    sq: {
      title: "Zonat e Dorëzimit - FastlyGo Mbulimi në Shkup",
      description: "FastlyGo dorëzon në të gjitha lagjet kryesore të Shkupit: Qendra, Karposh, Aerodrom, Çair, Kisela Voda dhe më shumë.",
      keywords: "zonat e dorëzimit Shkup, mbulimi FastlyGo"
    }
  },
  "/courier/register": {
    en: {
      title: "Become a Courier - Join FastlyGo",
      description: "Join FastlyGo as a courier in Skopje. Flexible hours, good earnings, be your own boss. Register now and start delivering today.",
      keywords: "become courier Skopje, join FastlyGo, courier job Macedonia"
    },
    tr: {
      title: "Kurye Ol - FastlyGo'ya Katıl",
      description: "Üsküp'te FastlyGo kurye olarak katılın. Esnek saatler, iyi kazanç, kendi patronunuz olun. Hemen kayıt olun ve bugün teslimat yapmaya başlayın.",
      keywords: "kurye ol Üsküp, FastlyGo'ya katıl, kurye işi Makedonya"
    },
    mk: {
      title: "Стани Курир - Придружи се на FastlyGo",
      description: "Придружи се на FastlyGo како курир во Скопје. Флексибилно работно време, добра заработка, биди свој шеф.",
      keywords: "стани курир Скопје, FastlyGo курир, работа курир Македонија"
    },
    sq: {
      title: "Bëhu Korrier - Bashkohu me FastlyGo",
      description: "Bashkohu me FastlyGo si korrier në Shkup. Orare fleksibël, fitime të mira, bëhu shefi yt.",
      keywords: "bëhu korrier Shkup, FastlyGo korrier, punë korrier Maqedoni"
    }
  },
  "/business/register": {
    en: {
      title: "Business Registration - FastlyGo for Businesses",
      description: "Register your business with FastlyGo and get reliable courier delivery services in Skopje. Perfect for restaurants, pharmacies, markets and more.",
      keywords: "business delivery Skopje, FastlyGo business, restaurant delivery service"
    },
    tr: {
      title: "İşletme Kaydı - İşletmeler için FastlyGo",
      description: "İşletmenizi FastlyGo'ya kaydedin ve Üsküp'te güvenilir kurye teslimat hizmetleri alın. Restoranlar, eczaneler, marketler ve daha fazlası için ideal.",
      keywords: "işletme teslimat Üsküp, FastlyGo işletme, restoran teslimat hizmeti"
    },
    mk: {
      title: "Регистрација на Бизнис - FastlyGo за Бизниси",
      description: "Регистрирајте го вашиот бизнис со FastlyGo и добијте доверливи курирски услуги во Скопје.",
      keywords: "бизнис достава Скопје, FastlyGo бизнис, ресторан достава"
    },
    sq: {
      title: "Regjistrim Biznesi - FastlyGo për Bizneset",
      description: "Regjistroni biznesin tuaj me FastlyGo dhe merrni shërbime të besueshme korrieri në Shkup.",
      keywords: "dorëzim biznesi Shkup, FastlyGo biznes, shërbim dorëzimi restorant"
    }
  },
  "/terms-of-service": {
    en: {
      title: "Terms of Service - FastlyGo",
      description: "Read FastlyGo's terms of service. Understand your rights and obligations when using our courier delivery platform in Skopje.",
      keywords: "FastlyGo terms of service, delivery terms, courier platform terms"
    },
    tr: {
      title: "Kullanım Şartları - FastlyGo",
      description: "FastlyGo kullanım şartlarını okuyun. Üsküp'teki kurye teslimat platformumuzu kullanırken haklarınızı ve yükümlülüklerinizi anlayın.",
      keywords: "FastlyGo kullanım şartları, teslimat şartları"
    },
    mk: {
      title: "Услови за Користење - FastlyGo",
      description: "Прочитајте ги условите за користење на FastlyGo.",
      keywords: "FastlyGo услови за користење"
    },
    sq: {
      title: "Kushtet e Shërbimit - FastlyGo",
      description: "Lexoni kushtet e shërbimit të FastlyGo.",
      keywords: "FastlyGo kushtet e shërbimit"
    }
  },
  "/privacy-policy": {
    en: {
      title: "Privacy Policy - FastlyGo",
      description: "FastlyGo's privacy policy. Learn how we collect, use and protect your personal data when using our courier delivery services.",
      keywords: "FastlyGo privacy policy, data protection, courier service privacy"
    },
    tr: {
      title: "Gizlilik Politikası - FastlyGo",
      description: "FastlyGo gizlilik politikası. Kurye teslimat hizmetlerimizi kullanırken kişisel verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu öğrenin.",
      keywords: "FastlyGo gizlilik politikası, veri koruma"
    },
    mk: {
      title: "Политика за Приватност - FastlyGo",
      description: "Политиката за приватност на FastlyGo. Дознајте kako ги собираме, користиме и штитиме вашите лични податоци.",
      keywords: "FastlyGo политика за приватност"
    },
    sq: {
      title: "Politika e Privatësisë - FastlyGo",
      description: "Politika e privatësisë e FastlyGo. Mësoni si mbledhim, përdorim dhe mbrojmë të dhënat tuaja personale.",
      keywords: "FastlyGo politika e privatësisë"
    }
  }
};

const LANGUAGES = ["en", "tr", "mk", "sq"];

const LANG_ATTRS: Record<string, string> = {
  en: "en",
  tr: "tr",
  mk: "mk",
  sq: "sq"
};

// Get language from URL query parameter
function getLangFromUrl(url: string): string {
  try {
    const urlObj = new URL(url, BASE_URL);
    const lang = urlObj.searchParams.get("lang");
    if (lang && LANGUAGES.includes(lang)) {
      return lang;
    }
  } catch {
    // ignore
  }
  return "en";
}

// Get pathname without query string
function getPathname(url: string): string {
  try {
    const urlObj = new URL(url, BASE_URL);
    return urlObj.pathname;
  } catch {
    return url.split("?")[0];
  }
}

// Generate hreflang tags for a given pathname
function generateHreflangTags(pathname: string): string {
  // Don't add hreflang for noindex pages
  if (isNoindexPath(pathname)) return "";
  
  const tags: string[] = [];
  
  // x-default (English)
  tags.push(`<link rel="alternate" hreflang="x-default" href="${BASE_URL}${pathname}" />`);
  tags.push(`<link rel="alternate" hreflang="en" href="${BASE_URL}${pathname}" />`);
  
  // Other languages
  for (const lang of ["tr", "mk", "sq"]) {
    tags.push(`<link rel="alternate" hreflang="${lang}" href="${BASE_URL}${pathname}?lang=${lang}" />`);
  }
  
  return tags.join("\n    ");
}

// Generate canonical URL - always use BASE_URL (fastlygo.mk), never www
function generateCanonicalTag(pathname: string, lang: string): string {
  if (lang === "en") {
    return `<link rel="canonical" href="${BASE_URL}${pathname}" />`;
  }
  return `<link rel="canonical" href="${BASE_URL}${pathname}?lang=${lang}" />`;
}

// Generate meta description tag
function generateMetaTags(pathname: string, lang: string): string {
  const noindex = isNoindexPath(pathname);
  
  // For noindex pages, use minimal meta tags
  if (noindex) {
    const tags: string[] = [];
    tags.push(`<title>FastlyGo</title>`);
    tags.push(`<meta name="robots" content="noindex, nofollow" />`);
    tags.push(`<meta name="googlebot" content="noindex, nofollow" />`);
    return tags.join("\n    ");
  }
  
  const pageMeta = PAGE_META[pathname] || PAGE_META["/"];
  const meta = pageMeta[lang] || pageMeta["en"];
  
  const tags: string[] = [];
  
  // Title
  tags.push(`<title>${meta.title}</title>`);
  
  // Description
  tags.push(`<meta name="description" content="${meta.description.replace(/"/g, '&quot;')}" />`);
  
  // Keywords
  if (meta.keywords) {
    tags.push(`<meta name="keywords" content="${meta.keywords.replace(/"/g, '&quot;')}" />`);
  }
  
  // Robots - allow indexing for public pages
  tags.push(`<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`);
  tags.push(`<meta name="googlebot" content="index, follow" />`);
  
  // OG tags
  tags.push(`<meta property="og:title" content="${meta.title.replace(/"/g, '&quot;')}" />`);
  tags.push(`<meta property="og:description" content="${meta.description.replace(/"/g, '&quot;')}" />`);
  tags.push(`<meta property="og:type" content="website" />`);
  
  const canonicalUrl = lang === "en" 
    ? `${BASE_URL}${pathname}` 
    : `${BASE_URL}${pathname}?lang=${lang}`;
  tags.push(`<meta property="og:url" content="${canonicalUrl}" />`);
  tags.push(`<meta property="og:site_name" content="FastlyGo" />`);
  tags.push(`<meta property="og:locale" content="${lang === 'en' ? 'en_US' : lang === 'tr' ? 'tr_TR' : lang === 'mk' ? 'mk_MK' : 'sq_AL'}" />`);
  
  // OG Image
  const ogImage = `${BASE_URL}/og-image.e6740bbc.jpg`;
  tags.push(`<meta property="og:image" content="${ogImage}" />`);
  tags.push(`<meta property="og:image:width" content="1200" />`);
  tags.push(`<meta property="og:image:height" content="630" />`);
  
  // Twitter Card
  tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
  tags.push(`<meta name="twitter:title" content="${meta.title.replace(/"/g, '&quot;')}" />`);
  tags.push(`<meta name="twitter:description" content="${meta.description.replace(/"/g, '&quot;')}" />`);
  tags.push(`<meta name="twitter:image" content="${ogImage}" />`);
  tags.push(`<meta name="twitter:image:width" content="1200" />`);
  tags.push(`<meta name="twitter:image:height" content="630" />`);  
  return tags.join("\n    ");
}
// Direct HTML injection function (for Vite dev mode / static serve)
export function injectSeoTags(html: string, url: string): string {
  const pathname = getPathname(url);
  const lang = getLangFromUrl(url);
  const htmlLang = LANG_ATTRS[lang] || "en";
  
  // Remove ALL existing meta tags (including those injected by Manus CDN)
  html = html.replace(/<title>[^<]*<\/title>/g, "");
  html = html.replace(/<meta property="og:title"[^>]*>/g, "");
  html = html.replace(/<meta property="og:description"[^>]*>/g, "");
  html = html.replace(/<meta property="og:url"[^>]*>/g, "");
  html = html.replace(/<meta property="og:type"[^>]*>/g, "");
  html = html.replace(/<meta property="og:site_name"[^>]*>/g, "");
  html = html.replace(/<meta property="og:locale"[^>]*>/g, "");
  html = html.replace(/<meta property="og:image"[^>]*>/g, "");
  html = html.replace(/<meta property="og:image:width"[^>]*>/g, "");
  html = html.replace(/<meta property="og:image:height"[^>]*>/g, "");
  html = html.replace(/<meta name="twitter:card"[^>]*>/g, "");
  html = html.replace(/<meta name="twitter:title"[^>]*>/g, "");
  html = html.replace(/<meta name="twitter:description"[^>]*>/g, "");
  html = html.replace(/<meta name="twitter:image"[^>]*>/g, "");
  html = html.replace(/<meta name="twitter:image:width"[^>]*>/g, "");
  html = html.replace(/<meta name="twitter:image:height"[^>]*>/g, "");
  html = html.replace(/<link rel="canonical"[^>]*\/>/g, "");
  html = html.replace(/<link rel="canonical"[^>]*>/g, "");
  // Remove ALL hreflang tags (including any injected by Manus CDN)
  html = html.replace(/<link[^>]*hreflang[^>]*\/>/g, "");
  html = html.replace(/<link[^>]*hreflang[^>]*>/g, "");
  html = html.replace(/<meta name="description"[^>]*>/g, "");
  html = html.replace(/<meta name="robots"[^>]*>/g, "");
  html = html.replace(/<meta name="googlebot"[^>]*>/g, "");
  
  // Update HTML lang attribute
  html = html.replace(/<html([^>]*)>/, `<html$1 lang="${htmlLang}">`);
  html = html.replace(/lang="[^"]*"\s+lang="[^"]*"/, `lang="${htmlLang}"`);
  
  // Generate all SEO tags
  const metaTags = generateMetaTags(pathname, lang);
  const canonicalTag = isNoindexPath(pathname) ? "" : generateCanonicalTag(pathname, lang);
  const hreflangTags = generateHreflangTags(pathname);
  
  const seoTags = `
    <!-- SEO Meta Tags (Server-Side Injected) -->
    ${metaTags}
    ${canonicalTag}
    ${hreflangTags}`;
  
  // Inject before </head>
  html = html.replace("</head>", `${seoTags}\n  </head>`);
  
  return html;
}
// Main SEO middleware
export function seoMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only process HTML requests (not API, assets, etc.)
  const url = req.originalUrl || req.url;
  
  if (
    url.startsWith("/api/") ||
    url.startsWith("/assets/") ||
    url.startsWith("/images/") ||
    url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|json|xml|txt|mp4|mp3|pdf)(\?|$)/)
  ) {
    return next();
  }
  
  const pathname = getPathname(url);
  const lang = getLangFromUrl(url);
  const htmlLang = LANG_ATTRS[lang] || "en";
  
  // Intercept the response to inject meta tags
  const originalSend = res.send.bind(res);
  
  (res as any).send = function(body: any) {
    if (typeof body === "string" && body.toLowerCase().includes("<!doctype html>")) {
      // Remove ALL existing meta tags (including those injected by Manus CDN)
      body = body.replace(/<title>[^<]*<\/title>/g, "");
      body = body.replace(/<meta property="og:title"[^>]*>/g, "");
      body = body.replace(/<meta property="og:description"[^>]*>/g, "");
      body = body.replace(/<meta property="og:url"[^>]*>/g, "");
      body = body.replace(/<meta property="og:type"[^>]*>/g, "");
      body = body.replace(/<meta property="og:site_name"[^>]*>/g, "");
      body = body.replace(/<meta property="og:locale"[^>]*>/g, "");
      body = body.replace(/<meta property="og:image"[^>]*>/g, "");
      body = body.replace(/<meta property="og:image:width"[^>]*>/g, "");
      body = body.replace(/<meta property="og:image:height"[^>]*>/g, "");
      body = body.replace(/<meta name="twitter:card"[^>]*>/g, "");
      body = body.replace(/<meta name="twitter:title"[^>]*>/g, "");
      body = body.replace(/<meta name="twitter:description"[^>]*>/g, "");
      body = body.replace(/<meta name="twitter:image"[^>]*>/g, "");
      body = body.replace(/<meta name="twitter:image:width"[^>]*>/g, "");
      body = body.replace(/<meta name="twitter:image:height"[^>]*>/g, "");
      body = body.replace(/<link rel="canonical"[^>]*\/>/g, "");
      body = body.replace(/<link rel="canonical"[^>]*>/g, "");
      // Remove ALL hreflang tags (including any injected by Manus CDN)
      body = body.replace(/<link[^>]*hreflang[^>]*\/>/g, "");
      body = body.replace(/<link[^>]*hreflang[^>]*>/g, "");
      body = body.replace(/<meta name="description"[^>]*>/g, "");
      body = body.replace(/<meta name="robots"[^>]*>/g, "");
      body = body.replace(/<meta name="googlebot"[^>]*>/g, "");
      
      // Update HTML lang attribute
      body = body.replace(/<html([^>]*)>/, `<html$1 lang="${htmlLang}">`);
      // Fix double lang if already exists
      body = body.replace(/lang="[^"]*"\s+lang="[^"]*"/, `lang="${htmlLang}"`);
      
      // Generate all SEO tags
      const metaTags = generateMetaTags(pathname, lang);
      const canonicalTag = isNoindexPath(pathname) ? "" : generateCanonicalTag(pathname, lang);
      const hreflangTags = generateHreflangTags(pathname);
      
      const seoTags = `
    <!-- SEO Meta Tags (Server-Side Injected) -->
    ${metaTags}
    ${canonicalTag}
    ${hreflangTags}`;
      
      // Inject before </head>
      body = body.replace("</head>", `${seoTags}\n  </head>`);
    }
    
    return originalSend(body);
  };
  
  next();
}
