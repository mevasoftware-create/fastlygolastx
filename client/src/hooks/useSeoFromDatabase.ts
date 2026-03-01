import { useLanguage } from '@/contexts/LanguageContext';

export interface SeoData {
  title: string;
  description: string;
  keywords: string;
}

/**
 * Hook to extract SEO data from database objects (categories, areas, etc.)
 * Handles JSON parsing and language fallback
 * 
 * Usage:
 * const seoData = useSeoFromDatabase(category?.seoMeta);
 */
export function useSeoFromDatabase(seoMetaJson: string | object | null | undefined): SeoData {
  const { language } = useLanguage();

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
