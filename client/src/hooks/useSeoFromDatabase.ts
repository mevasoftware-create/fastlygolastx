import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

export interface SeoData {
  title: string;
  description: string;
  keywords: string;
}

/**
 * Hook to extract SEO data from database objects (categories, areas, etc.)
 * Handles JSON parsing and language fallback
 * 
 * Uses i18next directly instead of LanguageContext to avoid
 * "useLanguage must be used within LanguageProvider" errors
 * when the component tree re-mounts during HMR or error recovery.
 * 
 * Usage:
 * const seoData = useSeoFromDatabase(category?.seoMeta);
 */
export function useSeoFromDatabase(seoMetaJson: string | object | null | undefined): SeoData {
  const { i18n } = useTranslation();
  const language = i18n.language || 'en';

  if (!seoMetaJson) {
    return { title: '', description: '', keywords: '' };
  }

  try {
    const seoMeta = typeof seoMetaJson === 'string' ? JSON.parse(seoMetaJson) : seoMetaJson;
    
    // Try to get data for current language, fallback to English
    const seoData = seoMeta[language] || seoMeta.en || { title: '', description: '', keywords: '' };
    
    return {
      title: seoData.title || '',
      description: seoData.description || '',
      keywords: seoData.keywords || ''
    };
  } catch (error) {
    console.error('Error parsing SEO meta:', error);
    return { title: '', description: '', keywords: '' };
  }
}
