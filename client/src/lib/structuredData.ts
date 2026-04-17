/**
 * Structured Data (JSON-LD) Schemas
 * Centralized management of all schema.org structured data
 */

export interface StructuredDataSchema {
  "@context"?: string;
  "@type": string;
  [key: string]: any;
}

/**
 * LocalBusiness Schema - Main business information
 */
export const getLocalBusinessSchema = (): StructuredDataSchema => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "FastlyGo",
  "image": "https://fastlygo.mk/og-image.jpg",
  "@id": "https://fastlygo.mk",
  "url": "https://fastlygo.mk",
  "telephone": "+389 71 246 766",
  "priceRange": "€€",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Skopje",
    "addressLocality": "Skopje",
    "addressCountry": "MK"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 41.9973,
    "longitude": 21.4280
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    "opens": "00:00",
    "closes": "23:59"
  },
  "sameAs": [
    "https://facebook.com/fastlygo",
    "https://twitter.com/fastlygo",
    "https://instagram.com/fastlygo"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "250"
  },
  "description": "Professional courier and delivery service in Skopje, Macedonia. Fast delivery in 15 minutes, real-time tracking, affordable prices.",
  "areaServed": [
    {
      "@type": "City",
      "name": "Skopje",
      "alternateName": ["Üsküp", "Скопје"]
    },
    {
      "@type": "AdministrativeArea",
      "name": "Macedonia",
      "alternateName": ["Makedonya", "North Macedonia"]
    }
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Courier and Delivery Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Food Delivery",
          "description": "Fast food delivery service in Skopje",
          "serviceType": "Courier Service"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Package Delivery",
          "description": "Express package and cargo delivery",
          "serviceType": "Courier Service"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Pharmacy Delivery",
          "description": "Medicine and health product delivery",
          "serviceType": "Courier Service"
        }
      }
    ]
  },
  "slogan": "Skopje Kurier - Fast and Reliable Delivery",
  "keywords": "skopje kurier, kurier skopje, courier delivery, yemek teslimatı, kargo hizmeti"
});

/**
 * Organization Schema - Company details
 */
export const getOrganizationSchema = (): StructuredDataSchema => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "FastlyGo",
  "url": "https://fastlygo.mk",
  "logo": "https://fastlygo.mk/logo.webp",
  "description": "Professional courier and delivery service in Skopje, Macedonia. Fast delivery in 15 minutes, real-time tracking, affordable prices.",
  "foundingDate": "2024",
  "foundingLocation": "Skopje, Macedonia",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Skopje",
    "addressLocality": "Skopje",
    "addressCountry": "MK"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Support",
    "telephone": "+389 71 246 766",
    "availableLanguage": ["en", "tr", "mk", "sq"]
  },
  "sameAs": [
    "https://facebook.com/fastlygo",
    "https://twitter.com/fastlygo",
    "https://instagram.com/fastlygo"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "250"
  }
});

/**
 * BreadcrumbList Schema - Navigation path
 */
export const getBreadcrumbSchema = (items: Array<{ position: number; name: string; item: string }>): StructuredDataSchema => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map(item => ({
    "@type": "ListItem",
    "position": item.position,
    "name": item.name,
    "item": item.item
  }))
});

/**
 * HowTo Schema - Step-by-step instructions
 */
export const getHowToSchema = (
  name: string,
  description: string,
  steps: Array<{ position: number; name: string; text: string; image?: string }>
): StructuredDataSchema => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": name,
  "description": description,
  "image": "https://fastlygo.mk/og-image.jpg",
  "totalTime": "PT15M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "EUR",
    "value": "4.00"
  },
  "step": steps.map(step => ({
    "@type": "HowToStep",
    "position": step.position,
    "name": step.name,
    "text": step.text,
    ...(step.image && { "image": step.image })
  }))
});

/**
 * FAQPage Schema - Frequently Asked Questions
 */
export const getFAQSchema = (
  faqs: Array<{ question: string; answer: string }>
): StructuredDataSchema => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

/**
 * Product Schema - Service offerings
 */
export const getProductSchema = (
  name: string,
  description: string,
  price: string,
  rating: number,
  reviewCount: number
): StructuredDataSchema => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": name,
  "description": description,
  "image": "https://fastlygo.mk/og-image.jpg",
  "offers": {
    "@type": "Offer",
    "url": "https://fastlygo.mk",
    "priceCurrency": "EUR",
    "price": price,
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": rating.toString(),
    "reviewCount": reviewCount.toString()
  }
});

/**
 * Combine multiple schemas into a graph
 */
export const combineSchemas = (schemas: StructuredDataSchema[]): any => {
  if (schemas.length === 1) {
    return schemas[0];
  }
  return {
    "@context": "https://schema.org",
    "@graph": schemas.map(schema => {
      const { "@context": _context, ...rest } = schema;
      return rest;
    })
  };
};

/**
 * Predefined schema combinations for common pages
 */
export const getHomePageSchemas = (): StructuredDataSchema[] => [
  getLocalBusinessSchema(),
  getBreadcrumbSchema([
    { position: 1, name: "Home", item: "https://fastlygo.mk" }
  ])
];

export const getHowItWorksSchemas = (): StructuredDataSchema[] => [
  getHowToSchema(
    "How to Order Delivery with FastlyGo",
    "Learn how to order fast courier delivery service in Skopje with FastlyGo in 3 simple steps.",
    [
      {
        position: 1,
        name: "Create Your Order",
        text: "Enter pickup and delivery addresses on our website or mobile app. Add package details and special instructions.",
        image: "https://fastlygo.mk/step1.jpg"
      },
      {
        position: 2,
        name: "Courier Assignment",
        text: "Our system automatically assigns the nearest available courier to your order. You'll see courier details and estimated arrival time.",
        image: "https://fastlygo.mk/step2.jpg"
      },
      {
        position: 3,
        name: "Track & Receive",
        text: "Track your delivery in real-time on the map. Receive notifications when courier picks up and delivers your package.",
        image: "https://fastlygo.mk/step3.jpg"
      }
    ]
  ),
  getBreadcrumbSchema([
    { position: 1, name: "Home", item: "https://fastlygo.mk" },
    { position: 2, name: "How It Works", item: "https://fastlygo.mk/how-it-works" }
  ])
];

export const getAboutUsSchemas = (): StructuredDataSchema[] => [
  getOrganizationSchema(),
  getBreadcrumbSchema([
    { position: 1, name: "Home", item: "https://fastlygo.mk" },
    { position: 2, name: "About Us", item: "https://fastlygo.mk/about" }
  ])
];

export const getServicesSchemas = (): StructuredDataSchema[] => [
  getBreadcrumbSchema([
    { position: 1, name: "Home", item: "https://fastlygo.mk" },
    { position: 2, name: "Services", item: "https://fastlygo.mk/services" }
  ]),
  getProductSchema(
    "Fast Courier Delivery Service",
    "Professional courier and delivery service in Skopje with 15-minute average delivery time.",
    "4.00",
    4.8,
    250
  )
];

/**
 * Areas Page Schema - ItemList of delivery areas
 */
export const getAreasPageSchemas = (
  areas?: Array<{ slug: string; lat?: number | null; lng?: number | null; seoMeta?: any }>
): StructuredDataSchema[] => {
  const schemas: StructuredDataSchema[] = [
    getBreadcrumbSchema([
      { position: 1, name: "Home", item: "https://fastlygo.mk" },
      { position: 2, name: "Delivery Areas", item: "https://fastlygo.mk/areas" }
    ])
  ];

  if (areas && areas.length > 0) {
    const itemListSchema: StructuredDataSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "FastlyGo Delivery Areas in Skopje",
      "description": "All delivery areas covered by FastlyGo courier service in Skopje and North Macedonia.",
      "url": "https://fastlygo.mk/areas",
      "numberOfItems": areas.length,
      "itemListElement": areas.map((area, index) => {
        const meta = area.seoMeta?.en || {};
        const areaName = meta.heading || meta.badge || area.slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        return {
          "@type": "ListItem",
          "position": index + 1,
          "name": areaName,
          "url": `https://fastlygo.mk/areas/${area.slug}`
        };
      })
    };
    schemas.push(itemListSchema);
  }

  return schemas;
};

/**
 * Category Page Schema - Service schema for a specific delivery category
 */
export const getCategoryPageSchemas = (
  slug: string,
  categoryName: string,
  description: string
): StructuredDataSchema[] => [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": categoryName,
    "description": description,
    "url": `https://fastlygo.mk/categories/${slug}`,
    "provider": {
      "@type": "LocalBusiness",
      "name": "FastlyGo",
      "url": "https://fastlygo.mk",
      "telephone": "+389 71 246 766",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Skopje",
        "addressCountry": "MK"
      }
    },
    "areaServed": {
      "@type": "City",
      "name": "Skopje"
    },
    "serviceType": "Courier Delivery",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "EUR",
      "price": "4.00",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "250"
    }
  },
  getBreadcrumbSchema([
    { position: 1, name: "Home", item: "https://fastlygo.mk" },
    { position: 2, name: "Services", item: "https://fastlygo.mk/services" },
    { position: 3, name: categoryName, item: `https://fastlygo.mk/categories/${slug}` }
  ])
];

/**
 * Order Page Schema - Service offering for placing a new order
 */
export const getOrderPageSchemas = (): StructuredDataSchema[] => [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Call a Courier - FastlyGo Express Delivery",
    "description": "Order an express courier in Skopje. Enter pickup and delivery addresses, choose package size, and a courier arrives in 15 minutes.",
    "url": "https://fastlygo.mk/new-order",
    "provider": {
      "@type": "LocalBusiness",
      "name": "FastlyGo",
      "url": "https://fastlygo.mk",
      "telephone": "+389 71 246 766",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Skopje",
        "addressCountry": "MK"
      }
    },
    "serviceType": "Courier Delivery",
    "areaServed": {
      "@type": "City",
      "name": "Skopje"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "EUR",
      "price": "4.00",
      "availability": "https://schema.org/InStock"
    }
  },
  getBreadcrumbSchema([
    { position: 1, name: "Home", item: "https://fastlygo.mk" },
    { position: 2, name: "Call a Courier", item: "https://fastlygo.mk/new-order" }
  ])
];
