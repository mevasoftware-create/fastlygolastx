import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { BASE_URL } from '@/const';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, Language } from '@/lib/i18n';

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
}

/**
 * SEOHead Component
 * Generates SEO meta tags using React 19's built-in <head> hoisting.
 *
 * Key rules:
 * - Canonical always uses BASE_URL (fastlygo.mk), never window.location.host
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

  // ALWAYS use BASE_URL for canonical/hreflang — never window.location.host
  const baseUrl = BASE_URL; // "https://fastlygo.mk"

  const pathname = location.split('?')[0];

  // Read lang parameter from URL
  const urlParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const langFromUrl = urlParams.get('lang') as Language | null;

  // Canonical URL:
  // - English (default): https://fastlygo.mk/path  (no ?lang=)
  // - Other languages:   https://fastlygo.mk/path?lang=XX
  let defaultCanonicalUrl = `${baseUrl}${pathname}`;
  if (langFromUrl && langFromUrl !== 'en') {
    defaultCanonicalUrl = `${baseUrl}${pathname}?lang=${langFromUrl}`;
  }

  const hreflangs = {
    en: `${baseUrl}${pathname}`,
    tr: `${baseUrl}${pathname}?lang=tr`,
    mk: `${baseUrl}${pathname}?lang=mk`,
    sq: `${baseUrl}${pathname}?lang=sq`,
  };

  // Get translated content or use custom values
  const title = customTitle || t(titleKey as any, language);
  const description = customDescription || t(descriptionKey as any, language);
  const keywords = customKeywords || t(keywordsKey as any, language);
  const finalCanonicalUrl = customCanonical || defaultCanonicalUrl;

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
      {/* Title */}
      <title>{title}</title>

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

      {/* Canonical URL — always fastlygo.mk (non-www, BASE_URL) */}
      <link rel="canonical" href={finalCanonicalUrl} />

      {/* Hreflang Tags — x-default and en first (Google recommendation) */}
      <link rel="alternate" hrefLang="x-default" href={hreflangs.en} />
      <link rel="alternate" hrefLang="en" href={hreflangs.en} />
      <link rel="alternate" hrefLang="tr" href={hreflangs.tr} />
      <link rel="alternate" hrefLang="mk" href={hreflangs.mk} />
      <link rel="alternate" hrefLang="sq" href={hreflangs.sq} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={finalCanonicalUrl} />
      <meta property="og:title" content={title} />
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
      <meta name="twitter:title" content={title} />
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
