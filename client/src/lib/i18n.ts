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

// If URL has lang parameter, store it in localStorage
if (langFromUrl && ['en', 'tr', 'mk', 'sq'].includes(langFromUrl)) {
  localStorage.setItem('fastlygo_language', langFromUrl);
}

/**
 * Domain bazlı varsayılan dil tespiti
 * fastlygo.al → sq (Arnavutça)
 * fastlygo.mk → mk (Makedonca)
 *
 * ?lang= parametresi veya localStorage varsa domain tespiti override edilir.
 */
function detectDomainLanguage(): Language | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname.replace(/^www\./, '');
  if (hostname === 'fastlygo.al') return 'sq';
  if (hostname === 'fastlygo.mk') return 'mk';
  return null;
}

// Domain bazlı dil: sadece ?lang= yoksa ve localStorage yoksa uygula
if (!langFromUrl) {
  const storedLang = localStorage.getItem('fastlygo_language');
  if (!storedLang) {
    const domainLang = detectDomainLanguage();
    if (domainLang) {
      localStorage.setItem('fastlygo_language', domainLang);
    }
  }
}

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Default language
    debug: false,
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'fastlygo_language'
    }
  });

// Helper function to get current language
export const getCurrentLanguage = (): Language => {
  return (i18n.language as Language) || 'en';
};

// Helper function to change language
export const setLanguage = (lang: Language) => {
  i18n.changeLanguage(lang);
  
  // Update URL with language parameter
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    // fastlygo.al'da sq için ?lang= parametresi ekleme (domain zaten sq canonical)
    const hostname = url.hostname.replace(/^www\./, '');
    if (lang === 'en') {
      url.searchParams.delete('lang');
    } else if (lang === 'sq' && hostname === 'fastlygo.al') {
      // fastlygo.al'da Arnavutça varsayılan — URL temiz kalır
      url.searchParams.delete('lang');
    } else if (lang === 'mk' && hostname === 'fastlygo.mk') {
      // fastlygo.mk'da Makedonca varsayılan — URL temiz kalır
      url.searchParams.delete('lang');
    } else {
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

export const useTranslation = () => {
  const { t, i18n, ready } = useI18nextTranslation();
  return {
    t,
    i18n,
    ready,
    language: (i18n.language as Language) || 'en'
  };
};

export default i18n;
