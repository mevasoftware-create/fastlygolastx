import { describe, it, expect } from 'vitest';
import {
  getLocalBusinessSchema,
  getOrganizationSchema,
  getBreadcrumbSchema,
  getHowToSchema,
  getFAQSchema,
  getProductSchema,
  combineSchemas,
  getHomePageSchemas,
  getHowItWorksSchemas,
  getAboutUsSchemas,
  getServicesSchemas
} from '../structuredData';

describe('Structured Data Schemas', () => {
  describe('LocalBusiness Schema', () => {
    it('should generate valid LocalBusiness schema', () => {
      const schema = getLocalBusinessSchema();
      
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('LocalBusiness');
      expect(schema.name).toBe('FastlyGo');
      expect(schema.url).toBe('https://fastlygo.mk');
      expect(schema.telephone).toBe('+389 71 246 766');
    });

    it('should include address information', () => {
      const schema = getLocalBusinessSchema();
      
      expect(schema.address).toBeDefined();
      expect(schema.address['@type']).toBe('PostalAddress');
      expect(schema.address.addressLocality).toBe('Skopje');
      expect(schema.address.addressCountry).toBe('MK');
    });

    it('should include geo coordinates', () => {
      const schema = getLocalBusinessSchema();
      
      expect(schema.geo).toBeDefined();
      expect(schema.geo['@type']).toBe('GeoCoordinates');
      expect(schema.geo.latitude).toBe(41.9973);
      expect(schema.geo.longitude).toBe(21.4280);
    });

    it('should include opening hours', () => {
      const schema = getLocalBusinessSchema();
      
      expect(schema.openingHoursSpecification).toBeDefined();
      expect(schema.openingHoursSpecification.dayOfWeek).toContain('Monday');
      expect(schema.openingHoursSpecification.opens).toBe('00:00');
      expect(schema.openingHoursSpecification.closes).toBe('23:59');
    });

    it('should include aggregate rating', () => {
      const schema = getLocalBusinessSchema();
      
      expect(schema.aggregateRating).toBeDefined();
      expect(schema.aggregateRating.ratingValue).toBe('4.8');
      expect(schema.aggregateRating.reviewCount).toBe('250');
    });

    it('should include social media links', () => {
      const schema = getLocalBusinessSchema();
      
      expect(schema.sameAs).toBeDefined();
      expect(schema.sameAs).toContain('https://facebook.com/fastlygo');
      expect(schema.sameAs).toContain('https://twitter.com/fastlygo');
      expect(schema.sameAs).toContain('https://instagram.com/fastlygo');
    });
  });

  describe('Organization Schema', () => {
    it('should generate valid Organization schema', () => {
      const schema = getOrganizationSchema();
      
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('FastlyGo');
      expect(schema.foundingDate).toBe('2024');
    });

    it('should include contact point', () => {
      const schema = getOrganizationSchema();
      
      expect(schema.contactPoint).toBeDefined();
      expect(schema.contactPoint['@type']).toBe('ContactPoint');
      expect(schema.contactPoint.contactType).toBe('Customer Support');
      expect(schema.contactPoint.availableLanguage).toContain('en');
      expect(schema.contactPoint.availableLanguage).toContain('tr');
    });
  });

  describe('BreadcrumbList Schema', () => {
    it('should generate valid BreadcrumbList schema', () => {
      const items = [
        { position: 1, name: 'Home', item: 'https://fastlygo.mk' },
        { position: 2, name: 'About', item: 'https://fastlygo.mk/about' }
      ];
      
      const schema = getBreadcrumbSchema(items);
      
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(2);
    });

    it('should map items correctly', () => {
      const items = [
        { position: 1, name: 'Home', item: 'https://fastlygo.mk' }
      ];
      
      const schema = getBreadcrumbSchema(items);
      const item = schema.itemListElement[0];
      
      expect(item['@type']).toBe('ListItem');
      expect(item.position).toBe(1);
      expect(item.name).toBe('Home');
      expect(item.item).toBe('https://fastlygo.mk');
    });
  });

  describe('HowTo Schema', () => {
    it('should generate valid HowTo schema', () => {
      const steps = [
        {
          position: 1,
          name: 'Step 1',
          text: 'Do this first'
        }
      ];
      
      const schema = getHowToSchema('How to Order', 'Learn how to order', steps);
      
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('HowTo');
      expect(schema.name).toBe('How to Order');
      expect(schema.description).toBe('Learn how to order');
    });

    it('should include estimated cost', () => {
      const steps = [];
      const schema = getHowToSchema('Test', 'Test', steps);
      
      expect(schema.estimatedCost).toBeDefined();
      expect(schema.estimatedCost['@type']).toBe('MonetaryAmount');
      expect(schema.estimatedCost.currency).toBe('EUR');
    });

    it('should map steps correctly', () => {
      const steps = [
        {
          position: 1,
          name: 'Create Order',
          text: 'Enter your details',
          image: 'https://example.com/step1.jpg'
        }
      ];
      
      const schema = getHowToSchema('Test', 'Test', steps);
      const step = schema.step[0];
      
      expect(step['@type']).toBe('HowToStep');
      expect(step.position).toBe(1);
      expect(step.name).toBe('Create Order');
      expect(step.image).toBe('https://example.com/step1.jpg');
    });
  });

  describe('FAQ Schema', () => {
    it('should generate valid FAQPage schema', () => {
      const faqs = [
        { question: 'How fast?', answer: 'Very fast' }
      ];
      
      const schema = getFAQSchema(faqs);
      
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toHaveLength(1);
    });

    it('should map FAQ items correctly', () => {
      const faqs = [
        { question: 'How fast?', answer: 'Very fast' }
      ];
      
      const schema = getFAQSchema(faqs);
      const item = schema.mainEntity[0];
      
      expect(item['@type']).toBe('Question');
      expect(item.name).toBe('How fast?');
      expect(item.acceptedAnswer['@type']).toBe('Answer');
      expect(item.acceptedAnswer.text).toBe('Very fast');
    });
  });

  describe('Product Schema', () => {
    it('should generate valid Product schema', () => {
      const schema = getProductSchema(
        'Delivery Service',
        'Fast delivery',
        '4.00',
        4.8,
        250
      );
      
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Product');
      expect(schema.name).toBe('Delivery Service');
    });

    it('should include offers', () => {
      const schema = getProductSchema('Test', 'Test', '5.00', 4.5, 100);
      
      expect(schema.offers).toBeDefined();
      expect(schema.offers['@type']).toBe('Offer');
      expect(schema.offers.priceCurrency).toBe('EUR');
      expect(schema.offers.price).toBe('5.00');
    });
  });

  describe('Combine Schemas', () => {
    it('should combine single schema without graph', () => {
      const schemas = [getLocalBusinessSchema()];
      const combined = combineSchemas(schemas);
      
      expect(combined['@type']).toBe('LocalBusiness');
      expect(combined['@context']).toBe('https://schema.org');
    });

    it('should combine multiple schemas with graph', () => {
      const schemas = [
        getLocalBusinessSchema(),
        getBreadcrumbSchema([
          { position: 1, name: 'Home', item: 'https://fastlygo.mk' }
        ])
      ];
      
      const combined = combineSchemas(schemas);
      
      expect(combined['@context']).toBe('https://schema.org');
      expect(combined['@graph']).toBeDefined();
      expect(combined['@graph']).toHaveLength(2);
    });
  });

  describe('Predefined Page Schemas', () => {
    it('should generate Home page schemas', () => {
      const schemas = getHomePageSchemas();
      
      expect(schemas).toHaveLength(2);
      expect(schemas[0]['@type']).toBe('LocalBusiness');
      expect(schemas[1]['@type']).toBe('BreadcrumbList');
    });

    it('should generate HowItWorks page schemas', () => {
      const schemas = getHowItWorksSchemas();
      
      expect(schemas).toHaveLength(2);
      expect(schemas[0]['@type']).toBe('HowTo');
      expect(schemas[1]['@type']).toBe('BreadcrumbList');
    });

    it('should generate AboutUs page schemas', () => {
      const schemas = getAboutUsSchemas();
      
      expect(schemas).toHaveLength(2);
      expect(schemas[0]['@type']).toBe('Organization');
      expect(schemas[1]['@type']).toBe('BreadcrumbList');
    });

    it('should generate Services page schemas', () => {
      const schemas = getServicesSchemas();
      
      expect(schemas).toHaveLength(2);
      expect(schemas[0]['@type']).toBe('BreadcrumbList');
      expect(schemas[1]['@type']).toBe('Product');
    });
  });

  describe('Schema Validation', () => {
    it('all schemas should have required context', () => {
      const schemas = [
        getLocalBusinessSchema(),
        getOrganizationSchema(),
        getHowToSchema('Test', 'Test', []),
        getFAQSchema([]),
        getProductSchema('Test', 'Test', '1.00', 4, 10)
      ];

      schemas.forEach(schema => {
        expect(schema['@context']).toBe('https://schema.org');
        expect(schema['@type']).toBeDefined();
      });
    });

    it('all schemas should have required type', () => {
      const schemas = [
        getLocalBusinessSchema(),
        getOrganizationSchema(),
        getHowToSchema('Test', 'Test', []),
        getFAQSchema([]),
        getProductSchema('Test', 'Test', '1.00', 4, 10)
      ];

      const validTypes = ['LocalBusiness', 'Organization', 'HowTo', 'FAQPage', 'Product'];
      schemas.forEach((schema, index) => {
        expect(validTypes).toContain(schema['@type']);
      });
    });
  });
});
