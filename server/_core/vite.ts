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

/**
 * Domain → varsayılan dil eşleştirmesi
 * fastlygo.al → sq (Arnavutça)
 * fastlygo.mk → mk (Makedonca) — kullanıcı tercihine göre override edilebilir
 */
const DOMAIN_DEFAULT_LANG: Record<string, SupportedLang> = {
  "fastlygo.al": "sq",
  "www.fastlygo.al": "sq",
  "fastlygo.mk": "mk",
  "www.fastlygo.mk": "mk",
};

/**
 * Domain'e göre canonical base URL döndür
 * fastlygo.al → https://fastlygo.al
 * diğer → https://fastlygo.mk
 */
function getBaseUrlForHost(host: string): string {
  const cleanHost = host.replace(/^www\./, "");
  if (cleanHost === "fastlygo.al") return "https://fastlygo.al";
  return "https://fastlygo.mk";
}

function detectLanguageFromUrl(url: string, acceptLanguage?: string, host?: string): string {
  // 1. ?lang= query param takes priority
  const params = new URLSearchParams(url.includes("?") ? url.split("?")[1] : "");
  const lang = params.get("lang");
  if (lang && SUPPORTED_LANGS.includes(lang as SupportedLang)) return lang;
  // 2. Domain-based default language (fastlygo.al → sq, fastlygo.mk → mk)
  if (host) {
    const cleanHost = host.split(":")[0]; // port varsa çıkar
    const domainLang = DOMAIN_DEFAULT_LANG[cleanHost];
    if (domainLang) return domainLang;
  }
  // 3. Accept-Language header fallback
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

async function getSeoForUrl(url: string, acceptLanguage?: string, host?: string): Promise<{ title: string; description: string } | null> {
  const pathname = url.split("?")[0];
  const language = detectLanguageFromUrl(url, acceptLanguage, host);
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
 * Multi-language i18n dictionary for JSON-LD schemas.
 * Supports: en (English), tr (Turkish), mk (Macedonian), sq (Albanian)
 */
const SCHEMA_I18N: Record<string, {
  // LocalBusiness / Organization
  lbDescription: string;
  orgDescription: string;
  orgAreaServed: string;
  // BreadcrumbList labels
  bcHome: string;
  bcAboutUs: string;
  bcHowItWorks: string;
  bcServices: string;
  bcAreas: string;
  bcDeliveryAreas: string;
  bcOrder: string;
  bcOrderNow: string;
  bcBecomeACourier: string;
  bcBusinessReg: string;
  // HowTo
  howToName: string;
  howToDesc: string;
  step1Name: string; step1Text: string;
  step2Name: string; step2Text: string;
  step3Name: string; step3Text: string;
  step4Name: string; step4Text: string;
  // Services schema
  serviceName: string;
  serviceDesc: string;
  serviceType: string;
  // Order schema
  orderName: string;
  orderDesc: string;
  // FAQ HowItWorks
  hiw_q1: string; hiw_a1: string;
  hiw_q2: string; hiw_a2: string;
  hiw_q3: string; hiw_a3: string;
  hiw_q4: string; hiw_a4: string;
  hiw_q5: string; hiw_a5: string;
  hiw_q6: string; hiw_a6: string;
  // FAQ Services
  svc_q1: string; svc_a1: string;
  svc_q2: string; svc_a2: string;
  svc_q3: string; svc_a3: string;
  svc_q4: string; svc_a4: string;
  svc_q5: string; svc_a5: string;
  svc_q6: string; svc_a6: string;
}> = {
  en: {
    lbDescription: "Fast courier & delivery service in Skopje, Macedonia. Food, cargo, package delivery in 15 minutes with real-time tracking.",
    orgDescription: "Professional courier and delivery service in Skopje, Macedonia.",
    orgAreaServed: "Skopje, Macedonia",
    bcHome: "Home", bcAboutUs: "About Us", bcHowItWorks: "How It Works",
    bcServices: "Services", bcAreas: "Areas", bcDeliveryAreas: "Delivery Areas",
    bcOrder: "Order", bcOrderNow: "Order Now", bcBecomeACourier: "Become a Courier", bcBusinessReg: "Business Registration",
    howToName: "How FastlyGo Delivery Works",
    howToDesc: "FastlyGo delivery in 4 simple steps",
    step1Name: "Place Your Order", step1Text: "Open the app or website, enter pickup and delivery addresses, choose your package size.",
    step2Name: "Courier Assigned", step2Text: "Our smart algorithm instantly matches you with the nearest available professional courier.",
    step3Name: "Live Tracking", step3Text: "Watch your courier move on a live map. Get live ETA updates and push notifications.",
    step4Name: "Delivered!", step4Text: "Your package arrives safely. Receive photo proof of delivery and a digital confirmation.",
    serviceName: "FastlyGo Delivery Services",
    serviceDesc: "Food, grocery, pharmacy, cargo and document delivery in Skopje",
    serviceType: "Courier and Delivery",
    orderName: "Order a Courier - FastlyGo", orderDesc: "Place a delivery order with FastlyGo. Fast courier service in Skopje.",
    hiw_q1: "How fast is FastlyGo delivery in Skopje?",
    hiw_a1: "FastlyGo delivers in as little as 15 minutes within Skopje. Our smart dispatch system assigns the nearest available courier immediately after you place your order.",
    hiw_q2: "How do I track my order in real time?",
    hiw_a2: "Once your courier is assigned, you can watch them move on a live map directly in the FastlyGo app or website. You will also receive push notifications with live ETA updates.",
    hiw_q3: "What areas does FastlyGo cover in Skopje?",
    hiw_a3: "FastlyGo covers 38+ neighborhoods across Skopje, including Centar, Karpos, Aerodrom, Kisela Voda, Gazi Baba, Butel, and many more.",
    hiw_q4: "How do I place a delivery order with FastlyGo?",
    hiw_a4: "Simply open the FastlyGo website or app, enter your pickup and delivery addresses, select your package size and vehicle type, then confirm your order. A courier will be assigned within seconds.",
    hiw_q5: "What payment methods does FastlyGo accept?",
    hiw_a5: "FastlyGo accepts both cash on delivery and credit/debit card payments. You can choose your preferred payment method when placing your order.",
    hiw_q6: "Can I get proof of delivery?",
    hiw_a6: "Yes. After every successful delivery, FastlyGo provides a digital confirmation and photo proof of delivery directly in the app.",
    svc_q1: "What types of deliveries does FastlyGo handle?",
    svc_a1: "FastlyGo handles food from restaurants, groceries from supermarkets, medicines from pharmacies, documents, flowers, gifts, and general cargo packages across Skopje.",
    svc_q2: "Can FastlyGo deliver food from any restaurant in Skopje?",
    svc_a2: "Yes. FastlyGo couriers can pick up food from any restaurant, cafe, or fast food outlet in Skopje — not just partner restaurants.",
    svc_q3: "Does FastlyGo deliver medicines and pharmacy products?",
    svc_a3: "Yes. FastlyGo offers pharmacy delivery in Skopje. Our couriers pick up medicines and health products from pharmacies and deliver them to your door within 15-30 minutes.",
    svc_q4: "Can businesses use FastlyGo for regular deliveries?",
    svc_a4: "Absolutely. FastlyGo offers a Business Partner Program for restaurants, shops, pharmacies, and other businesses that need regular courier services in Skopje.",
    svc_q5: "What is the maximum package size FastlyGo can deliver?",
    svc_a5: "FastlyGo supports three package sizes: Small (under 3 kg), Medium (3-10 kg), and Large (10+ kg). For large packages, a car courier is automatically assigned.",
    svc_q6: "How much does a delivery cost with FastlyGo?",
    svc_a6: "Delivery prices start from a competitive base rate and vary depending on distance, package size, and vehicle type. You can see the exact price before confirming your order.",
  },
  tr: {
    lbDescription: "Üsküp, Makedonya'da hızlı kurye ve teslimat hizmeti. Yemek, kargo, paket teslimatı 15 dakikada gerçek zamanlı takiple.",
    orgDescription: "Üsküp, Makedonya'da profesyonel kurye ve teslimat hizmeti.",
    orgAreaServed: "Üsküp, Makedonya",
    bcHome: "Ana Sayfa", bcAboutUs: "Hakkımızda", bcHowItWorks: "Nasıl Çalışır",
    bcServices: "Hizmetler", bcAreas: "Bölgeler", bcDeliveryAreas: "Teslimat Bölgeleri",
    bcOrder: "Sipariş", bcOrderNow: "Hemen Sipariş Ver", bcBecomeACourier: "Kurye Ol", bcBusinessReg: "İşletme Kaydı",
    howToName: "FastlyGo Teslimatı Nasıl Çalışır",
    howToDesc: "FastlyGo teslimatı 4 basit adımda",
    step1Name: "Sipariş Ver", step1Text: "Uygulama veya web sitesini açın, alış ve teslimat adreslerini girin, paket boyutunu seçin.",
    step2Name: "Kurye Atandı", step2Text: "Akıllı algoritmamız sizi anında en yakın müsait profesyonel kurye ile eşleştirir.",
    step3Name: "Canlı Takip", step3Text: "Kuryenizi canlı harita üzerinde takip edin. Anlık ETA güncellemeleri ve bildirimler alın.",
    step4Name: "Teslim Edildi!", step4Text: "Paketiniz güvenle ulaşır. Uygulama üzerinden fotoğraflı teslimat kanıtı alırsınız.",
    serviceName: "FastlyGo Teslimat Hizmetleri",
    serviceDesc: "Üsküp'te yemek, market, eczane, kargo ve evrak teslimatı",
    serviceType: "Kurye ve Teslimat",
    orderName: "Kurye Çağır - FastlyGo", orderDesc: "FastlyGo ile teslimat siparişi verin. Üsküp'te hızlı kurye hizmeti.",
    hiw_q1: "FastlyGo Üsküp'te ne kadar hızlı teslimat yapar?",
    hiw_a1: "FastlyGo, Üsküp içinde en az 15 dakikada teslimat yapar. Akıllı dağıtım sistemimiz, siparişinizi verdikten hemen sonra en yakın müsait kuryeyi atar.",
    hiw_q2: "Siparişimi gerçek zamanlı nasıl takip ederim?",
    hiw_a2: "Kurye atandıktan sonra FastlyGo uygulaması veya web sitesinde canlı harita üzerinde kuryenizi takip edebilirsiniz. Anlık ETA güncellemeleri içeren push bildirimleri de alırsınız.",
    hiw_q3: "FastlyGo Üsküp'te hangi bölgeleri kapsıyor?",
    hiw_a3: "FastlyGo, Centar, Karpoş, Aerodrom, Kisela Voda, Gazi Baba, Butel ve daha fazlası dahil Üsküp genelinde 38'den fazla mahalleyi kapsamaktadır.",
    hiw_q4: "FastlyGo ile nasıl teslimat siparişi veririm?",
    hiw_a4: "FastlyGo web sitesini veya uygulamasını açın, alış ve teslimat adreslerini girin, paket boyutunu ve araç tipini seçin, ardından siparişinizi onaylayın. Saniyeler içinde kurye atanır.",
    hiw_q5: "FastlyGo hangi ödeme yöntemlerini kabul ediyor?",
    hiw_a5: "FastlyGo hem kapıda nakit ödeme hem de kredi/banka kartı ödemesini kabul eder. Sipariş verirken tercih ettiğiniz ödeme yöntemini seçebilirsiniz.",
    hiw_q6: "Teslimat kanıtı alabilir miyim?",
    hiw_a6: "Evet. Her başarılı teslimatın ardından FastlyGo, uygulamada dijital onay ve fotoğraflı teslimat kanıtı sunar.",
    svc_q1: "FastlyGo hangi tür teslimatları yapar?",
    svc_a1: "FastlyGo; restoranlardan yemek, süpermarketlerden market alışverişi, eczanelerden ilaç, evrak, çiçek, hediye ve Üsküp genelinde genel kargo teslimatı yapar.",
    svc_q2: "FastlyGo Üsküp'teki herhangi bir restorandan yemek teslim edebilir mi?",
    svc_a2: "Evet. FastlyGo kuryeleri, yalnızca anlaşmalı restoranlardan değil, Üsküp'teki herhangi bir restoran, kafe veya fast food işletmesinden yemek alabilir.",
    svc_q3: "FastlyGo ilaç ve eczane ürünleri teslim ediyor mu?",
    svc_a3: "Evet. FastlyGo, Üsküp'te eczane teslimatı sunmaktadır. Kuryeleri eczanelerden ilaç ve sağlık ürünlerini alıp genellikle 15-30 dakika içinde kapınıza getirir.",
    svc_q4: "İşletmeler FastlyGo'yu düzenli teslimatlar için kullanabilir mi?",
    svc_a4: "Kesinlikle. FastlyGo, Üsküp'te düzenli kurye hizmetine ihtiyaç duyan restoranlar, mağazalar, eczaneler ve diğer işletmeler için İşletme Ortağı Programı sunar.",
    svc_q5: "FastlyGo'nun teslim edebileceği maksimum paket boyutu nedir?",
    svc_a5: "FastlyGo üç paket boyutunu destekler: Küçük (3 kg altı), Orta (3-10 kg) ve Büyük (10+ kg). Büyük paketler için otomatik olarak araçlı kurye atanır.",
    svc_q6: "FastlyGo ile teslimat ne kadar tutar?",
    svc_a6: "Teslimat fiyatları rekabetçi bir başlangıç ücretinden başlar ve mesafeye, paket boyutuna ve araç tipine göre değişir. Siparişinizi onaylamadan önce kesin fiyatı görebilirsiniz.",
  },
  mk: {
    lbDescription: "Брза курирска и доставна услуга во Скопје, Македонија. Достава на храна, карго, пакети за 15 минути со следење во реално време.",
    orgDescription: "Професионална курирска и доставна услуга во Скопје, Македонија.",
    orgAreaServed: "Скопје, Македонија",
    bcHome: "Почетна", bcAboutUs: "За Нас", bcHowItWorks: "Како Функционира",
    bcServices: "Услуги", bcAreas: "Области", bcDeliveryAreas: "Области на Достава",
    bcOrder: "Нарачка", bcOrderNow: "Нарачај Сега", bcBecomeACourier: "Стани Курир", bcBusinessReg: "Регистрација на Бизнис",
    howToName: "Како Функционира Доставата на FastlyGo",
    howToDesc: "Доставата на FastlyGo во 4 едноставни чекори",
    step1Name: "Направи Нарачка", step1Text: "Отвори ја апликацијата или веб-страницата, внеси адреси за подигање и достава, избери ја големината на пакетот.",
    step2Name: "Курирот е Доделен", step2Text: "Нашиот паметен алгоритам веднаш те поврзува со најблискиот достапен професионален курир.",
    step3Name: "Следење во Живо", step3Text: "Следи го курирот на жива карта. Добивај ажурирања за ETA и push-известувања.",
    step4Name: "Доставено!", step4Text: "Пакетот пристигнува безбедно. Добиваш фото-доказ за достава и дигитална потврда.",
    serviceName: "Доставни Услуги на FastlyGo",
    serviceDesc: "Достава на храна, маркет, аптека, карго и документи во Скопје",
    serviceType: "Курир и Достава",
    orderName: "Нарачај Курир - FastlyGo", orderDesc: "Направи нарачка за достава со FastlyGo. Брза курирска услуга во Скопје.",
    hiw_q1: "Колку брзо доставува FastlyGo во Скопје?",
    hiw_a1: "FastlyGo доставува за само 15 минути во Скопје. Нашиот паметен систем за распределба го доделува најблискиот достапен курир веднаш по нарачката.",
    hiw_q2: "Како да ја следам нарачката во реално време?",
    hiw_a2: "Откако ќе биде доделен курирот, можеш да го следиш на жива карта во апликацијата или веб-страницата на FastlyGo. Ќе добиваш и push-известувања со ажурирања за ETA.",
    hiw_q3: "Кои области ги покрива FastlyGo во Скопје?",
    hiw_a3: "FastlyGo покрива 38+ населби низ Скопје, вклучувајќи Центар, Карпош, Аеродром, Кисела Вода, Гази Баба, Бутел и многу повеќе.",
    hiw_q4: "Како да направам нарачка за достава со FastlyGo?",
    hiw_a4: "Отвори ја веб-страницата или апликацијата на FastlyGo, внеси адреси за подигање и достава, избери ја големината на пакетот и типот на возило, потоа потврди ја нарачката.",
    hiw_q5: "Кои начини на плаќање ги прифаќа FastlyGo?",
    hiw_a5: "FastlyGo прифаќа готовинско плаќање при достава и плаќање со кредитна/дебитна картичка. Можеш да го избереш саканиот начин при нарачката.",
    hiw_q6: "Можам ли да добијам доказ за достава?",
    hiw_a6: "Да. По секоја успешна достава, FastlyGo обезбедува дигитална потврда и фото-доказ за достава директно во апликацијата.",
    svc_q1: "Какви видови достави врши FastlyGo?",
    svc_a1: "FastlyGo врши достава на храна од ресторани, намирници од супермаркети, лекови од аптеки, документи, цвеќиња, подароци и општи карго-пакети низ Скопје.",
    svc_q2: "Може ли FastlyGo да достави храна од кој било ресторан во Скопје?",
    svc_a2: "Да. Куририте на FastlyGo можат да подигнат храна од кој било ресторан, кафе или брза храна во Скопје — не само од партнерски ресторани.",
    svc_q3: "Дали FastlyGo доставува лекови и аптекарски производи?",
    svc_a3: "Да. FastlyGo нуди достава од аптека во Скопје. Куририте подигаат лекови и здравствени производи и ги доставуваат до вратата во рок од 15-30 минути.",
    svc_q4: "Можат ли бизнисите да го користат FastlyGo за редовни достави?",
    svc_a4: "Апсолутно. FastlyGo нуди Програма за Деловни Партнери за ресторани, продавници, аптеки и други бизниси кои имаат потреба од редовни курирски услуги во Скопје.",
    svc_q5: "Која е максималната големина на пакет што FastlyGo може да го достави?",
    svc_a5: "FastlyGo поддржува три големини на пакети: Мал (под 3 кг), Среден (3-10 кг) и Голем (10+ кг). За големи пакети автоматски се доделува курир со автомобил.",
    svc_q6: "Колку чини достава со FastlyGo?",
    svc_a6: "Цените за достава почнуваат од конкурентна основна стапка и варираат во зависност од растојанието, големината на пакетот и типот на возило. Точната цена ја гледаш пред потврда на нарачката.",
  },
  sq: {
    lbDescription: "Shërbim i shpejtë korrieri dhe dorëzimi në Shkup, Maqedoni. Dorëzim ushqimi, kargo, pako në 15 minuta me gjurmim në kohë reale.",
    orgDescription: "Shërbim profesional korrieri dhe dorëzimi në Shkup, Maqedoni.",
    orgAreaServed: "Shkup, Maqedoni",
    bcHome: "Kryefaqja", bcAboutUs: "Rreth Nesh", bcHowItWorks: "Si Funksionon",
    bcServices: "Shërbimet", bcAreas: "Zonat", bcDeliveryAreas: "Zonat e Dorëzimit",
    bcOrder: "Porosi", bcOrderNow: "Porosit Tani", bcBecomeACourier: "Bëhu Korrier", bcBusinessReg: "Regjistrimi i Biznesit",
    howToName: "Si Funksionon Dorëzimi i FastlyGo",
    howToDesc: "Dorëzimi i FastlyGo në 4 hapa të thjeshtë",
    step1Name: "Bëj Porosinë", step1Text: "Hap aplikacionin ose faqen e internetit, fut adresat e marrjes dhe dorëzimit, zgjidh madhësinë e paketës.",
    step2Name: "Korrierin u Caktua", step2Text: "Algoritmi ynë i zgjuar të lidh menjëherë me korrierën profesionale më të afërt të disponueshme.",
    step3Name: "Ndjekje në Kohë Reale", step3Text: "Shiko korrierën në hartë të drejtpërdrejtë. Merr përditësime ETA dhe njoftime push.",
    step4Name: "Dorëzuar!", step4Text: "Paketa arrin në mënyrë të sigurt. Merr provë fotografike të dorëzimit dhe konfirmim dixhital.",
    serviceName: "Shërbimet e Dorëzimit të FastlyGo",
    serviceDesc: "Dorëzim ushqimi, market, farmaci, kargo dhe dokumentesh në Shkup",
    serviceType: "Korrier dhe Dorëzim",
    orderName: "Porosit Korrier - FastlyGo", orderDesc: "Bëj porosinë e dorëzimit me FastlyGo. Shërbim i shpejtë korrieri në Shkup.",
    hiw_q1: "Sa shpejt dorëzon FastlyGo në Shkup?",
    hiw_a1: "FastlyGo dorëzon brenda 15 minutave në Shkup. Sistemi ynë i zgjuar i shpërndarjes cakton korrierën më të afërt të disponueshme menjëherë pas porosisë.",
    hiw_q2: "Si ta gjurmoj porosinë time në kohë reale?",
    hiw_a2: "Pasi të caktohet korrieria, mund ta shikosh atë duke lëvizur në hartë të drejtpërdrejtë në aplikacionin ose faqen e FastlyGo. Do të marrësh gjithashtu njoftime push me përditësime ETA.",
    hiw_q3: "Cilat zona mbulon FastlyGo në Shkup?",
    hiw_a3: "FastlyGo mbulon 38+ lagje në të gjithë Shkupin, duke përfshirë Qendrën, Karposh, Aerodromin, Kisela Voda, Gazi Baba, Butel dhe shumë të tjera.",
    hiw_q4: "Si të bëj një porosi dorëzimi me FastlyGo?",
    hiw_a4: "Hap faqen e internetit ose aplikacionin e FastlyGo, fut adresat e marrjes dhe dorëzimit, zgjidh madhësinë e paketës dhe llojin e automjetit, pastaj konfirmo porosinë. Korrieria caktohet brenda sekondave.",
    hiw_q5: "Cilat metoda pagese pranon FastlyGo?",
    hiw_a5: "FastlyGo pranon pagesë me para në dorë dhe pagesë me kartë krediti/debiti. Mund të zgjedhësh metodën e preferuar të pagesës gjatë porosisë.",
    hiw_q6: "A mund të marr provë dorëzimi?",
    hiw_a6: "Po. Pas çdo dorëzimi të suksesshëm, FastlyGo ofron konfirmim dixhital dhe provë fotografike të dorëzimit direkt në aplikacion.",
    svc_q1: "Çfarë llojesh dorëzimesh kryen FastlyGo?",
    svc_a1: "FastlyGo kryen dorëzim ushqimi nga restorantet, ushqime nga supermarketet, ilaçe nga farmacitë, dokumente, lule, dhurata dhe pako kargo të përgjithshme në të gjithë Shkupin.",
    svc_q2: "A mund të dorëzojë FastlyGo ushqim nga çdo restorant në Shkup?",
    svc_a2: "Po. Korrierat e FastlyGo mund të marrin ushqim nga çdo restorant, kafe ose fast food në Shkup — jo vetëm nga restorantet partnere.",
    svc_q3: "A dorëzon FastlyGo ilaçe dhe produkte farmaceutike?",
    svc_a3: "Po. FastlyGo ofron dorëzim nga farmacia në Shkup. Korrierat marrin ilaçe dhe produkte shëndetësore dhe i dorëzojnë te dera juaj zakonisht brenda 15-30 minutave.",
    svc_q4: "A mund të përdorin bizneset FastlyGo për dorëzime të rregullta?",
    svc_a4: "Absolutisht. FastlyGo ofron Programin e Partnerëve të Biznesit për restorante, dyqane, farmaci dhe biznese të tjera që kanë nevojë për shërbime të rregullta korrieri në Shkup.",
    svc_q5: "Cila është madhësia maksimale e paketës që mund të dorëzojë FastlyGo?",
    svc_a5: "FastlyGo mbështet tre madhësi paketash: E vogël (nën 3 kg), Mesatare (3-10 kg) dhe E madhe (10+ kg). Për paketat e mëdha caktohet automatikisht korrier me makinë.",
    svc_q6: "Sa kushton dorëzimi me FastlyGo?",
    svc_a6: "Çmimet e dorëzimit fillojnë nga një tarifë bazë konkurruese dhe ndryshojnë sipas distancës, madhësisë së paketës dhe llojit të automjetit. Çmimin e saktë e sheh para konfirmimit të porosisë.",
  },
};

/**
 * Returns JSON-LD structured data schemas for a given pathname.
 * These are injected server-side so Google bot sees them before JS runs.
 * All text content is localized based on the `language` parameter.
 */
function getJsonLdForPath(pathname: string, language: string, title: string, description: string, host?: string): Record<string, unknown>[] {
  const lang = (language && SCHEMA_I18N[language]) ? language : "en";
  const t = SCHEMA_I18N[lang];
  const pageBaseUrl = host ? getBaseUrlForHost(host) : BASE_URL;
  const localBusinessBase = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "FastlyGo",
    "description": t.lbDescription,
    "url": pageBaseUrl,
    "telephone": "+38978123456",
    "email": "info@fastlygo.mk",
    "image": OG_IMAGE,
    "logo": `${BASE_URL}/logo.png`,
    "priceRange": "€€",
    "currenciesAccepted": "EUR, MKD",
    "paymentAccepted": "Cash, Credit Card",
    "openingHours": "Mo-Su 08:00-23:00",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Skopje",
      "addressLocality": "Skopje",
      "addressRegion": "Skopje",
      "postalCode": "1000",
      "addressCountry": "MK"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 41.9981,
      "longitude": 21.4254
    },
    "sameAs": [
      "https://www.facebook.com/fastlygo",
      "https://www.instagram.com/fastlygo"
    ],
    "serviceArea": {
      "@type": "City",
      "name": "Skopje"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "FastlyGo",
    "url": pageBaseUrl,
    "logo": `${BASE_URL}/logo.png`,
    "description": t.orgDescription,
    "foundingDate": "2023",
    "areaServed": t.orgAreaServed,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+38978123456",
      "contactType": "customer service",
      "availableLanguage": ["English", "Macedonian", "Albanian", "Turkish"]
    },
    "sameAs": [
      "https://fastlygo.mk",
      "https://fastlygo.al",
      "https://www.facebook.com/fastlygo",
      "https://www.instagram.com/fastlygo"
    ]
  };

  // Helper: build a BreadcrumbList
  const breadcrumb = (...items: { name: string; url: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url
    }))
  });

  // Helper: build a FAQPage schema from question/answer pairs
  const faqPage = (pairs: { q: string; a: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": pairs.map(({ q, a }) => ({
      "@type": "Question",
      "name": q,
      "acceptedAnswer": { "@type": "Answer", "text": a }
    }))
  });

  // Home page
  if (pathname === "/") {
    return [localBusinessBase, organizationSchema];
  }

  // About Us
  if (pathname === "/about-us") {
    return [organizationSchema, breadcrumb(
      { name: t.bcHome, url: BASE_URL },
      { name: t.bcAboutUs, url: `${BASE_URL}/about-us` }
    )];
  }

  // How It Works
  if (pathname === "/how-it-works") {
    return [{
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": title || t.howToName,
      "description": description || t.howToDesc,
      "step": [
        { "@type": "HowToStep", "position": 1, "name": t.step1Name, "text": t.step1Text },
        { "@type": "HowToStep", "position": 2, "name": t.step2Name, "text": t.step2Text },
        { "@type": "HowToStep", "position": 3, "name": t.step3Name, "text": t.step3Text },
        { "@type": "HowToStep", "position": 4, "name": t.step4Name, "text": t.step4Text }
      ]
    },
    faqPage([
      { q: t.hiw_q1, a: t.hiw_a1 },
      { q: t.hiw_q2, a: t.hiw_a2 },
      { q: t.hiw_q3, a: t.hiw_a3 },
      { q: t.hiw_q4, a: t.hiw_a4 },
      { q: t.hiw_q5, a: t.hiw_a5 },
      { q: t.hiw_q6, a: t.hiw_a6 },
    ]),
    breadcrumb(
      { name: t.bcHome, url: BASE_URL },
      { name: t.bcHowItWorks, url: `${BASE_URL}/how-it-works` }
    )];
  }

  // Services
  if (pathname === "/services") {
    return [{
      "@context": "https://schema.org",
      "@type": "Service",
      "name": t.serviceName,
      "description": description || t.serviceDesc,
      "provider": { "@type": "LocalBusiness", "name": "FastlyGo" },
      "areaServed": "Skopje",
      "serviceType": t.serviceType
    },
    faqPage([
      { q: t.svc_q1, a: t.svc_a1 },
      { q: t.svc_q2, a: t.svc_a2 },
      { q: t.svc_q3, a: t.svc_a3 },
      { q: t.svc_q4, a: t.svc_a4 },
      { q: t.svc_q5, a: t.svc_a5 },
      { q: t.svc_q6, a: t.svc_a6 },
    ]),
    breadcrumb(
      { name: t.bcHome, url: BASE_URL },
      { name: t.bcServices, url: `${BASE_URL}/services` }
    )];
  }

  // Areas list
  if (pathname === "/areas") {
    return [
      breadcrumb(
        { name: t.bcHome, url: BASE_URL },
        { name: t.bcDeliveryAreas, url: `${BASE_URL}/areas` }
      ),
      localBusinessBase
    ];
  }

  // Area detail page
  const areaMatch = pathname.match(/^\/areas\/([^/?]+)$/);
  if (areaMatch) {
    const slug = areaMatch[1];
    const areaName = slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    return [{
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": `FastlyGo - ${areaName}`,
      "description": description || `FastlyGo delivery service in ${areaName}, Skopje`,
      "url": `${BASE_URL}/areas/${slug}`,
      "areaServed": areaName,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": areaName,
        "addressRegion": "Skopje",
        "addressCountry": "MK"
      }
    },
    breadcrumb(
      { name: t.bcHome, url: BASE_URL },
      { name: t.bcAreas, url: `${BASE_URL}/areas` },
      { name: areaName, url: `${BASE_URL}/areas/${slug}` }
    )];
  }

  // Category detail page
  const catMatch = pathname.match(/^\/categories\/([^/?]+)$/);
  if (catMatch) {
    const slug = catMatch[1];
    const catName = slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    return [{
      "@context": "https://schema.org",
      "@type": "Service",
      "name": title || `${catName} Delivery - FastlyGo`,
      "description": description || `${catName} delivery service in Skopje by FastlyGo`,
      "provider": { "@type": "LocalBusiness", "name": "FastlyGo", "url": BASE_URL },
      "areaServed": "Skopje",
      "url": `${BASE_URL}/categories/${slug}`
    },
    breadcrumb(
      { name: t.bcHome, url: BASE_URL },
      { name: t.bcServices, url: `${BASE_URL}/services` },
      { name: catName, url: `${BASE_URL}/categories/${slug}` }
    )];
  }

  // Order / new-order page
  if (pathname === "/new-order" || pathname === "/order") {
    return [{
      "@context": "https://schema.org",
      "@type": "Service",
      "name": t.orderName,
      "description": t.orderDesc,
      "provider": { "@type": "LocalBusiness", "name": "FastlyGo", "url": BASE_URL },
      "areaServed": "Skopje"
    },
    breadcrumb(
      { name: t.bcHome, url: BASE_URL },
      { name: t.bcOrderNow, url: `${BASE_URL}/new-order` }
    )];
  }

  // Courier register
  if (pathname === "/courier/register") {
    return [breadcrumb(
      { name: t.bcHome, url: BASE_URL },
      { name: t.bcBecomeACourier, url: `${BASE_URL}/courier/register` }
    )];
  }

  // Business register
  if (pathname === "/business/register") {
    return [breadcrumb(
      { name: t.bcHome, url: BASE_URL },
      { name: t.bcBusinessReg, url: `${BASE_URL}/business/register` }
    )];
  }

  // Default: return LocalBusiness for all other pages
  return [localBusinessBase];
}

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
  language: string,
  host?: string
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
  // Domain-aware base URL: fastlygo.al → https://fastlygo.al, others → https://fastlygo.mk
  const pageBaseUrl = host ? getBaseUrlForHost(host) : BASE_URL;
  const mkBaseUrl = "https://fastlygo.mk";
  const alBaseUrl = "https://fastlygo.al";
  // Canonical URL: domain'e göre (fastlygo.al'dan gelince canonical fastlygo.al olur)
  const canonicalUrl = `${pageBaseUrl}${pathname}`;
  // hreflang URLs: her dil kendi canonical domain'ini gösterir
  // sq → fastlygo.al (Arnavutça canonical domain)
  // mk → fastlygo.mk?lang=mk
  // en, tr → fastlygo.mk
  const hrefEn = `${mkBaseUrl}${pathname}`;
  const hrefTr = `${mkBaseUrl}${pathname}?lang=tr`;
  const hrefMk = `${mkBaseUrl}${pathname}?lang=mk`;
  const hrefSq = `${alBaseUrl}${pathname}`;
  // OG locale map
  const ogLocale: Record<string, string> = { en: "en_US", tr: "tr_TR", mk: "mk_MK", sq: "sq_AL" };
  const locale = ogLocale[language] || "en_US";
  // Current page URL
  let currentUrl: string;
  if (language === "sq") {
    currentUrl = `${alBaseUrl}${pathname}`;
  } else if (language === "en") {
    currentUrl = `${mkBaseUrl}${pathname}`;
  } else {
    currentUrl = `${mkBaseUrl}${pathname}?lang=${language}`;
  }

  // Build JSON-LD structured data for this page
  const jsonLdSchemas = getJsonLdForPath(pathname, language, safeTitle, safeDesc, host);
  const jsonLdBlock = jsonLdSchemas.length > 0
    ? jsonLdSchemas.map(schema => `  <script type="application/ld+json">${JSON.stringify(schema)}</script>`).join("\n")
    : "";

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
  <meta name="twitter:image" content="${OG_IMAGE}" />
${jsonLdBlock}`;

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
      // Language detection: ?lang= param → domain default → Accept-Language header → EN
      const acceptLang = req.headers["accept-language"] as string | undefined;
      const _host = (req.headers["x-forwarded-host"] as string || req.headers.host || "").split(",")[0].trim();
      const seoData = await getSeoForUrl(url, acceptLang, _host);
      const _pathname = url.split("?")[0];
      const _language = detectLanguageFromUrl(url, acceptLang, _host);
      page = injectSeoIntoHtml(page, seoData?.title || "", seoData?.description || "", _pathname, _language, _host);
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
      const _host = (req.headers?.["x-forwarded-host"] as string || req.headers?.host || "").split(",")[0].trim();
      const seoData = await getSeoForUrl(url, acceptLang, _host).catch(() => null);
      const _pathname = url.split("?")[0];
      const _language = detectLanguageFromUrl(url, acceptLang, _host);
      
      // Check if this is a dynamic route with no matching data - return 404 status
      const isAreaPage = _pathname.match(/^\/areas\/([^/?]+)$/);
      const isCategoryPage = _pathname.match(/^\/categories\/([^/?]+)$/);
      const isDynamicNotFound = (isAreaPage || isCategoryPage) && !seoData;
      const statusCode = isDynamicNotFound ? 404 : 200;
      
      html = injectSeoIntoHtml(html, seoData?.title || "", seoData?.description || "", _pathname, _language, _host);
      res.status(statusCode).set({ "Content-Type": "text/html", "X-SEO-Injected": "true" }).end(html);
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
      const _host = ((req as any).headers?.["x-forwarded-host"] as string || (req as any).headers?.host || "").split(",")[0].trim();
      const seoData = await getSeoForUrl(url, acceptLang, _host).catch(() => null);
      const _pathname = url.split("?")[0];
      const _language = detectLanguageFromUrl(url, acceptLang, _host);
      html = injectSeoIntoHtml(html, seoData?.title || "", seoData?.description || "", _pathname, _language, _host);
      res.status(200).set({ "Content-Type": "text/html", "X-SEO-Injected": "true" }).end(html);
    });
  });
}
