/**
 * Merkezi site konfigürasyonu — her domain için şehir, lokasyon ve dil ayarları.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  YENİ DOMAIN EKLEMEK İÇİN SADECE BU DOSYAYA BİR KAYIT EKLEYİN  ║
 * ║  Başka hiçbir dosyaya dokunmanıza gerek yok.                    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Nasıl çalışır?
 * - DB'deki SEO içerikleri "referans domain" (fastlygo.mk / Skopje) için yazılmıştır.
 * - parseSeoMeta(), her domain için `referenceTerms` → `localTerms` çevirisini
 *   otomatik uygular. Yeni domain eklenince DB'ye dokunmadan çalışır.
 *
 * Gelecek planı:
 *   fastlygo.rs  → Belgrad   (sr)
 *   fastlygo.ks  → Priştine  (sq/en)
 */

/** Dil bazlı çeviri haritası */
export type LangMap = Record<string, string>;

export interface SiteConfig {
  /** Ana domain (www. olmadan) */
  domain: string;
  /** Canonical base URL */
  baseUrl: string;
  /** Varsayılan dil kodu (BCP-47) */
  defaultLang: string;
  /** Desteklenen diller (varsayılan ilk sırada) */
  supportedLangs: string[];

  /** Şehir adı — her dilde */
  cityNames: LangMap;
  /** Ülke adı — her dilde */
  countryNames: LangMap;

  /**
   * DB'deki referans içeriklerde geçen şehir/ülke terimleri.
   * parseSeoMeta() bu terimleri `cityNames` ve `countryNames` ile değiştirir.
   * Referans domain (fastlygo.mk) için boş bırakın — kendi terimleri zaten doğru.
   */
  referenceTerms?: {
    /** DB'de geçen şehir adları (tüm çekim halleri dahil) → yerel karşılık */
    city: Array<{ from: LangMap; to: LangMap }>;
    /** DB'de geçen ülke adları → yerel karşılık */
    country: Array<{ from: LangMap; to: LangMap }>;
  };

  /** ISO 3166-1 alpha-2 ülke kodu */
  countryCode: string;
  /** Posta kodu */
  postalCode: string;
  /** Enlem */
  latitude: number;
  /** Boylam */
  longitude: number;
  /** İletişim telefonu */
  telephone: string;
  /** İletişim e-postası */
  email: string;
  /** Kabul edilen para birimleri */
  currencies: string;
  /** OG image URL */
  ogImage: string;
  /** Hizmet verilen mahalle/bölge sayısı */
  neighborhoodCount: number;
  /** Aktif kurye sayısı */
  activeCouriers: number;
  /** Ortalama teslimat süresi (dakika) */
  deliveryMinutes: number;
  /** Hizmet alanı bölgeleri (sitemap ve JSON-LD için) */
  areas: string[];
}

const SITE_CONFIGS: SiteConfig[] = [
  // ─── Makedonya — Skopje (REFERANS DOMAIN) ────────────────────────────────
  // DB içerikleri bu domain için yazılmıştır. referenceTerms boş.
  {
    domain: "fastlygo.mk",
    baseUrl: "https://fastlygo.mk",
    defaultLang: "en",
    supportedLangs: ["en", "tr", "mk", "sq"],
    cityNames: {
      en: "Skopje",
      tr: "Üsküp",
      mk: "Скопје",
      sq: "Shkup",
    },
    countryNames: {
      en: "North Macedonia",
      tr: "Kuzey Makedonya",
      mk: "Македонија",
      sq: "Maqedoni",
    },
    // referenceTerms yok — bu zaten referans domain
    countryCode: "MK",
    postalCode: "1000",
    latitude: 41.9981,
    longitude: 21.4254,
    telephone: "+38978123456",
    email: "info@fastlygo.mk",
    currencies: "EUR, MKD",
    ogImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/4KwtmFvvd67FSFhQ5dyp9H/fastlygo-og-universal-FQjXU2VrdYT8YobXcaLM9u.png",
    neighborhoodCount: 38,
    activeCouriers: 56,
    deliveryMinutes: 15,
    areas: [
      "aerodrom", "centar", "karpos", "kisela-voda", "cair",
      "gazi-baba", "saraj", "butel", "skopje", "gjorce-petrov",
      "tetovo", "gostivar",
    ],
  },

  // ─── Arnavutluk — Tirana ─────────────────────────────────────────────────
  // DB'deki sq içeriklerde "Shkup" / "Maqedoni" geçer → Tiranë / Shqipëri
  {
    domain: "fastlygo.al",
    baseUrl: "https://fastlygo.al",
    defaultLang: "sq",
    supportedLangs: ["sq", "en", "tr"],
    cityNames: {
      sq: "Tiranë",
      en: "Tirana",
      tr: "Tiran",
    },
    countryNames: {
      sq: "Shqipëri",
      en: "Albania",
      tr: "Arnavutluk",
    },
    referenceTerms: {
      city: [
        // Çekim halleri önce, kök sonra (regex sırası önemli)
        { from: { sq: "Shkupit", en: "Skopje's", tr: "Üsküp'ün" }, to: { sq: "Tiranës", en: "Tirana's", tr: "Tiran'ın" } },
        { from: { sq: "Shkupin", en: "Skopje",   tr: "Üsküp"    }, to: { sq: "Tiranën", en: "Tirana",   tr: "Tiran"    } },
        { from: { sq: "Shkup",   en: "Skopje",   tr: "Üsküp"    }, to: { sq: "Tiranë",  en: "Tirana",   tr: "Tiran"    } },
      ],
      country: [
        { from: { sq: "Maqedonisë", en: "North Macedonia", tr: "Kuzey Makedonya" }, to: { sq: "Shqipërisë", en: "Albania", tr: "Arnavutluk" } },
        { from: { sq: "Maqedoninë", en: "North Macedonia", tr: "Kuzey Makedonya" }, to: { sq: "Shqipërinë", en: "Albania", tr: "Arnavutluk" } },
        { from: { sq: "Maqedoni",   en: "North Macedonia", tr: "Kuzey Makedonya" }, to: { sq: "Shqipëri",   en: "Albania", tr: "Arnavutluk" } },
        { from: { sq: "Maqedonia",  en: "Macedonia",       tr: "Makedonya"       }, to: { sq: "Shqipëria",  en: "Albania", tr: "Arnavutluk" } },
      ],
    },
    countryCode: "AL",
    postalCode: "1001",
    latitude: 41.3275,
    longitude: 19.8187,
    telephone: "+355693123456",
    email: "info@fastlygo.al",
    currencies: "EUR, ALL",
    ogImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/4KwtmFvvd67FSFhQ5dyp9H/fastlygo-og-universal-FQjXU2VrdYT8YobXcaLM9u.png",
    neighborhoodCount: 38,
    activeCouriers: 24,
    deliveryMinutes: 15,
    areas: [
      // Tiranë ve mahalleler
      "tirana", "blloku", "kombinat", "don-bosko", "laprake",
      "kamez", "vore", "shkoze", "ali-dem", "tirana-e-re", "kashar",
      // Diğer büyük şehirler
      "durres", "vlore", "shkoder", "elbasan", "fier",
      "korce", "berat", "lushnje", "kavaje", "pogradec",
      "gjirokaster", "sarande", "permet", "kukes", "lezhe",
      "peshkopi", "burrel", "corovode", "tepelene", "gramsh",
    ],
  },

  // ─── Gelecek: Sırbistan — Belgrad ────────────────────────────────────────
  // Sadece bu bloğu uncomment edin, başka hiçbir dosyaya dokunmayın.
  // {
  //   domain: "fastlygo.rs",
  //   baseUrl: "https://fastlygo.rs",
  //   defaultLang: "sr",
  //   supportedLangs: ["sr", "en"],
  //   cityNames: { sr: "Beograd", en: "Belgrade", tr: "Belgrad" },
  //   countryNames: { sr: "Srbija", en: "Serbia", tr: "Sırbistan" },
  //   referenceTerms: {
  //     city: [
  //       { from: { sr: "Shkup", en: "Skopje", tr: "Üsküp" }, to: { sr: "Beograd", en: "Belgrade", tr: "Belgrad" } },
  //     ],
  //     country: [
  //       { from: { sr: "Maqedoni", en: "North Macedonia", tr: "Kuzey Makedonya" }, to: { sr: "Srbija", en: "Serbia", tr: "Sırbistan" } },
  //     ],
  //   },
  //   countryCode: "RS",
  //   postalCode: "11000",
  //   latitude: 44.8176,
  //   longitude: 20.4569,
  //   telephone: "+381601234567",
  //   email: "info@fastlygo.rs",
  //   currencies: "EUR, RSD",
  //   ogImage: "https://fastlygo.rs/og-image.e6740bbc.jpg",
  //   neighborhoodCount: 0,
  //   activeCouriers: 0,
  //   deliveryMinutes: 15,
  //   areas: [],
  // },

  // ─── Gelecek: Kosova — Priştine ──────────────────────────────────────────
  // {
  //   domain: "fastlygo.ks",
  //   baseUrl: "https://fastlygo.ks",
  //   defaultLang: "sq",
  //   supportedLangs: ["sq", "en"],
  //   cityNames: { sq: "Prishtinë", en: "Pristina", tr: "Priştine" },
  //   countryNames: { sq: "Kosovë", en: "Kosovo", tr: "Kosova" },
  //   referenceTerms: {
  //     city: [
  //       { from: { sq: "Shkupit", en: "Skopje's" }, to: { sq: "Prishtinës", en: "Pristina's" } },
  //       { from: { sq: "Shkupin", en: "Skopje"   }, to: { sq: "Prishtinën", en: "Pristina"   } },
  //       { from: { sq: "Shkup",   en: "Skopje"   }, to: { sq: "Prishtinë",  en: "Pristina"   } },
  //     ],
  //     country: [
  //       { from: { sq: "Maqedoni", en: "North Macedonia" }, to: { sq: "Kosovë", en: "Kosovo" } },
  //     ],
  //   },
  //   countryCode: "XK",
  //   postalCode: "10000",
  //   latitude: 42.6629,
  //   longitude: 21.1655,
  //   telephone: "+38344123456",
  //   email: "info@fastlygo.ks",
  //   currencies: "EUR",
  //   ogImage: "https://fastlygo.ks/og-image.e6740bbc.jpg",
  //   neighborhoodCount: 0,
  //   activeCouriers: 0,
  //   deliveryMinutes: 15,
  //   areas: [],
  // },
];

/**
 * Host string'inden (örn. "fastlygo.al", "www.fastlygo.mk") SiteConfig döner.
 * Eşleşme bulunamazsa varsayılan olarak fastlygo.mk config'ini döner.
 */
export function getSiteConfigForHost(host: string): SiteConfig {
  const clean = host.replace(/^www\./, "").split(":")[0].toLowerCase().trim();
  return SITE_CONFIGS.find(c => c.domain === clean) ?? SITE_CONFIGS[0];
}

/**
 * Bir metin içindeki referans şehir/ülke terimlerini hedef domain'in
 * yerel terimleriyle değiştirir.
 *
 * Kullanım: parseSeoMeta içinde çağrılır.
 * Yeni domain eklenince sadece siteConfig'deki referenceTerms güncellenir.
 */
export function applyLocalTerms(text: string, cfg: SiteConfig, lang: string): string {
  if (!cfg.referenceTerms) return text; // referans domain → değişiklik yok
  let result = text;
  const allTermGroups = [...cfg.referenceTerms.city, ...cfg.referenceTerms.country];
  for (const term of allTermGroups) {
    const fromStr = term.from[lang] ?? term.from["en"];
    const toStr   = term.to[lang]   ?? term.to["en"];
    if (fromStr && toStr && fromStr !== toStr) {
      result = result.split(fromStr).join(toStr);
    }
  }
  return result;
}

/**
 * Tüm aktif site config'lerini döner.
 */
export function getAllSiteConfigs(): SiteConfig[] {
  return SITE_CONFIGS;
}

export default SITE_CONFIGS;
