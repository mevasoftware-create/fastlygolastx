import { useLanguage } from '@/contexts/LanguageContext';

interface BreadcrumbSchemaProps {
  areaName: string;
  areaSlug: string;
}

/**
 * Breadcrumb JSON-LD Schema Component
 * Provides structured breadcrumb navigation for Google
 * Shows: Home > Areas > [Area Name] in search results
 */
export default function BreadcrumbSchema({
  areaName,
  areaSlug,
}: BreadcrumbSchemaProps) {
  const { language } = useLanguage();

  // Breadcrumb labels vary by language
  const homeLabel = language === 'tr' 
    ? 'Ana Sayfa'
    : language === 'mk'
    ? 'Дома'
    : language === 'sq'
    ? 'Ballina'
    : 'Home';

  const areasLabel = language === 'tr' 
    ? 'Bölgeler'
    : language === 'mk'
    ? 'Области'
    : language === 'sq'
    ? 'Zonat'
    : 'Areas';

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": homeLabel,
        "item": "https://fastlygo.mk/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": areasLabel,
        "item": "https://fastlygo.mk/areas"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": areaName,
        "item": `https://fastlygo.mk/areas/${areaSlug}`
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
