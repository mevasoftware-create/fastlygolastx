import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, Language } from '@/lib/i18n';

const MK_BASE_URL = 'https://fastlygo.mk';
const AL_BASE_URL = 'https://fastlygo.al';

/**
 * Domain'e göre canonical base URL döndür.
 * fastlygo.al → https://fastlygo.al
 * diğer → https://fastlygo.mk
 */
function getCanonicalBaseUrl(): string {
  if (typeof window === 'undefined') return MK_BASE_URL;
  const hostname = window.location.hostname.replace(/^www\./, '');
  if (hostname === 'fastlygo.al') return AL_BASE_URL;
  return MK_BASE_URL;
}

interface SEOHeadProps {
  titleKey?: string;
  descriptionKey?: string;
  keywordsKey?: string;
  ogImageUrl?: string;
  siteName?: string;
  structuredData?: Record<string, any> | Record<string, any>[];
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  customDescription?: string;
  noindex?: boolean;
  /** When true, suppresses <title> rendering so the static index.html title persists until data arrives */
  isLoading?: boolean;
}

/**
 * SEOHead Component
 * Generates SEO meta tags using React 19's built-in <head> hoisting.
 *
 * Key rules:
 * - fastlygo.al → canonical https://fastlygo.al/..., hreflang sq = fastlygo.al
 * - fastlygo.mk → canonical https://fastlygo.mk/..., hreflang mk = fastlygo.mk?lang=mk
 * - hreflang: x-default + en first, then tr/mk/sq
 * - English version has no ?lang= param (clean URL is canonical)
 * - NO manual DOM manipulation — React 19 handles <head> tag deduplication
 */
export default function SEOHead({
  titleKey = 'seoTitle',
  descriptionKey = 'seoDescription',
  keywordsKey = 'seoKeywords',
  ogImageUrl = 'https://fastlygo.mk/og-image.e6740bbc.jpg',
  siteName = 'FastlyGo',
  structuredData,
  title: customTitle,
  description: customDescription,
  keywords: customKeywords,
  canonical: customCanonical,
  noindex = false,
  isLoading = false,
}: SEOHeadProps) {
  // Safe location hook usage with error handling
  let location = '/';
  try {
    const [loc] = useLocation();
    location = loc;
  } catch {
    if (typeof window !== 'undefined') {
      location = window.location.pathname;
    }
  }

  const { language } = useLanguage();

  const pathname = location.split('?')[0];

  // Domain-aware canonical base URL
  const canonicalBaseUrl = getCanonicalBaseUrl();

  // Canonical URL: domain'e göre (fastlygo.al'dan gelince canonical fastlygo.al olur)
  const defaultCanonicalUrl = `${canonicalBaseUrl}${pathname}`;

  // hreflang URLs:
  // sq → fastlygo.al/{path} (fastlygo.al EN canonical, sq prefix yok)
  // mk → fastlygo.mk?lang=mk
  // en → fastlygo.mk (temiz URL, canonical)
  // tr → fastlygo.mk?lang=tr
  const hreflangs = {
    en: `${MK_BASE_URL}${pathname}`,
    tr: `${MK_BASE_URL}${pathname}?lang=tr`,
    mk: `${MK_BASE_URL}${pathname}?lang=mk`,
    sq: `${AL_BASE_URL}${pathname}`,
  };

  // Title resolution:
  // - customTitle is a non-empty string → use it directly (DB value)
  // - customTitle is "" (empty string, loading state) → suppress <title> so index.html static title persists
  // - customTitle is undefined → fall back to i18n key
  const titleResolved = customTitle !== undefined
    ? (customTitle !== '' ? customTitle : null)   // null = suppress
    : t(titleKey as any, language);               // i18n fallback
  const title = titleResolved;
  const rawDescription = customDescription || t(descriptionKey as any, language);
  // Truncate description to 160 characters max (Google's recommended limit)
  const description = rawDescription && rawDescription.length > 160
    ? rawDescription.slice(0, 157) + '...'
    : rawDescription;
  const keywords = customKeywords || t(keywordsKey as any, language);
  const finalCanonicalUrl = customCanonical || defaultCanonicalUrl;

  // OG URL: language-specific URL
  const ogUrl = language === 'sq'
    ? `${AL_BASE_URL}${pathname}`
    : language === 'en'
    ? `${MK_BASE_URL}${pathname}`
    : `${MK_BASE_URL}${pathname}?lang=${language}`;

  // Only update <html lang="..."> — no other DOM manipulation
  // React 19 handles <head> tag hoisting and deduplication automatically
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const langMap: Record<Language, string> = {
      en: 'en',
      tr: 'tr',
      mk: 'mk',
      sq: 'sq',
    };
    document.documentElement.setAttribute('lang', langMap[language] || 'en');
  }, [language]);

  return (
    <>
      {/* Title — suppressed when title===null (loading state: empty string passed) so index.html static title persists */}
      {title !== null && <title>{title ?? ''}</title>}

      {/* Primary Meta Tags */}
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex ? (
        <>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="googlebot" content="noindex, nofollow" />
        </>
      ) : (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}

      {/* Canonical URL — domain'e göre (fastlygo.al veya fastlygo.mk) */}
      <link rel="canonical" href={finalCanonicalUrl} />

      {/* Hreflang Tags — x-default and en first (Google recommendation) */}
      <link rel="alternate" hrefLang="x-default" href={hreflangs.en} />
      <link rel="alternate" hrefLang="en" href={hreflangs.en} />
      <link rel="alternate" hrefLang="tr" href={hreflangs.tr} />
      <link rel="alternate" hrefLang="mk" href={hreflangs.mk} />
      <link rel="alternate" hrefLang="sq" href={hreflangs.sq} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={title ?? ''} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={siteName} />
      <meta
        property="og:locale"
        content={
          language === 'en'
            ? 'en_US'
            : language === 'tr'
            ? 'tr_TR'
            : language === 'mk'
            ? 'mk_MK'
            : 'sq_AL'
        }
      />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title ?? ''} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="twitter:image:width" content="1200" />
      <meta name="twitter:image:height" content="630" />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </>
  );
}
