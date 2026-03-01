import { useLanguage } from '@/contexts/LanguageContext';

interface LocalBusinessSchemaProps {
  areaName: string;
  areaSlug: string;
  description: string;
  rating?: number;
  reviewCount?: number;
}

/**
 * LocalBusiness JSON-LD Schema Component
 * Provides structured data for Google rich snippets
 * Shows: star rating, address, phone, opening hours in search results
 */
export default function LocalBusinessSchema({
  areaName,
  areaSlug,
  description,
  rating = 4.9,
  reviewCount = 1250,
}: LocalBusinessSchemaProps) {
  const { language } = useLanguage();

  // Business name varies by language
  const businessName = language === 'tr' 
    ? `FastlyGo - ${areaName} Kurye ve Teslimat Hizmeti`
    : language === 'mk'
    ? `FastlyGo - Куриерска и Достава Услуга во ${areaName}`
    : language === 'sq'
    ? `FastlyGo - Shërbim Kurier dhe Dërgesë në ${areaName}`
    : `FastlyGo - Courier and Delivery Service in ${areaName}`;

  // Address varies by area (Skopje-based service)
  const address = {
    "@type": "PostalAddress",
    "streetAddress": areaName,
    "addressLocality": "Skopje",
    "addressRegion": "Skopje",
    "postalCode": "1000",
    "addressCountry": "MK"
  };

  // Opening hours: 24/7 service
  const openingHours = [
    "Monday-Sunday 00:00-23:59"
  ];

  // Price range: € (affordable)
  const priceRange = "€";

  // Service area
  const areaServed = {
    "@type": "City",
    "name": "Skopje",
    "containedIn": {
      "@type": "Country",
      "name": "North Macedonia"
    }
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `https://fastlygo.mk/areas/${areaSlug}`,
    "name": businessName,
    "description": description,
    "url": `https://fastlygo.mk/areas/${areaSlug}`,
    "telephone": "+389-71-246-756",
    "email": "info@fastlygo.mk",
    "address": address,
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "41.9973",
      "longitude": "21.4280"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ],
        "opens": "00:00",
        "closes": "23:59"
      }
    ],
    "priceRange": priceRange,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": rating.toString(),
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": reviewCount.toString()
    },
    "areaServed": areaServed,
    "serviceType": [
      "Courier Service",
      "Food Delivery",
      "Package Delivery",
      "Document Delivery",
      "Grocery Delivery"
    ],
    "logo": "https://fastlygo.mk/brand/fastlygo_logo_pro_v3.webp",
    "image": "https://fastlygo.mk/brand/fastlygo_logo_pro_v3.webp",
    "sameAs": [
      "https://www.instagram.com/fastlygo.mk",
      "https://twitter.com/fastlygo",
      "https://www.youtube.com/@fastlygo",
      "https://www.tiktok.com/@fastlygo"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
