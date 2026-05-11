import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import translationEN from '../locales/en.json';
import translationTR from '../locales/tr.json';
import translationMK from '../locales/mk.json';
import translationSQ from '../locales/sq.json';

export type Language = 'en' | 'tr' | 'mk' | 'sq';

const resources = {
  en: { translation: translationEN },
  tr: { translation: translationTR },
  mk: { translation: translationMK },
  sq: { translation: translationSQ }
};

// Read lang parameter from URL before initializing i18n
const urlParams = new URLSearchParams(window.location.search);
const langFromUrl = urlParams.get('lang') as Language | null;

// If URL has a valid lang parameter, store it in localStorage
if (langFromUrl && ['en', 'tr', 'mk', 'sq'].includes(langFromUrl)) {
  localStorage.setItem('fastlygo_language', langFromUrl);
} else if (!langFromUrl) {
  // No ?lang= in URL → default is English for all domains.
  // Clear any previously stored non-English language so returning visitors
  // don't get stuck in a non-default language without an explicit URL param.
  const storedLang = localStorage.getItem('fastlygo_language');
  if (!storedLang || storedLang === 'mk' || storedLang === 'sq') {
    // Only reset if it was a domain-default that is no longer the default
    localStorage.removeItem('fastlygo_language');
  }
}

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Default language is English
    lng: langFromUrl || undefined, // Use URL param if present, otherwise let detector decide
    debug: false,

    interpolation: {
      escapeValue: false // React already escapes values
    },

    detection: {
      order: ['querystring', 'localStorage'],
      caches: ['localStorage'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'fastlygo_language'
    }
  });

// Helper function to get current language
export const getCurrentLanguage = (): Language => {
  return (i18n.language as Language) || 'en';
};

/**
 * Change language and update URL accordingly.
 * English is the canonical language for all domains — no ?lang= param needed.
 * All other languages require ?lang=<code> in the URL.
 */
export const setLanguage = (lang: Language) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('fastlygo_language', lang);

  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    if (lang === 'en') {
      // English is default — clean URL, no ?lang= param
      url.searchParams.delete('lang');
      localStorage.removeItem('fastlygo_language');
    } else {
      // All non-English languages need ?lang= param
      url.searchParams.set('lang', lang);
    }
    window.history.replaceState({}, '', url.toString());
  }
};

// Legacy t function for backward compatibility
export const t = (key: string, lang?: Language): string => {
  const currentLang = lang || getCurrentLanguage();
  return i18n.t(key, { lng: currentLang });
};

// Re-export useTranslation from react-i18next with language property
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { getSiteConfigForHost, applyLocalTerms } from '../../../shared/siteConfig';

// Domain-aware site config (client-side, computed once at module load)
const _hostname = typeof window !== 'undefined' ? window.location.hostname.replace(/^www\./, '') : 'fastlygo.mk';
const _siteConfig = getSiteConfigForHost(_hostname);

export const useTranslation = () => {
  const { t: rawT, i18n, ready } = useI18nextTranslation();
  const lang = (i18n.language as Language) || 'en';

  // Wrap t() to apply domain-aware city/country term replacements
  // e.g. fastlygo.al: "Skopje" → "Tirana", "North Macedonia" → "Albania"
  const t = (key: string, options?: Record<string, unknown>): string => {
    const raw = String(rawT(key, options as never));
    if (!_siteConfig.referenceTerms) return raw; // reference domain → no change
    return applyLocalTerms(raw, _siteConfig, lang);
  };

  return {
    t,
    i18n,
    ready,
    language: lang
  };
};

export default i18n;
