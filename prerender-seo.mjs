#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

/**
 * Pre-render SEO script: Creates per-page HTML files with correct meta tags.
 * 
 * Manus proxy serves static files from dist/public/ and does NOT pass HTML
 * requests to Express server. This means server-side SEO injection never runs.
 * 
 * Solution: Generate dist/public/{path}/index.html for each page during build,
 * so Manus proxy serves the correct meta tags for each page.
 * 
 * Manus proxy also overrides <title> with VITE_APP_TITLE ("FastlyGo") and
 * injects a canonical tag before </head>. We can't prevent the title override,
 * but we ensure all other meta tags (description, OG, Twitter, hreflang) are
 * correct per page.
 */

const distPublicPath = path.resolve('./dist/public');
const BASE_URL = 'https://fastlygo.mk';
const OG_IMAGE = 'https://fastlygo.mk/og-image.e6740bbc.jpg';

// Escape HTML entities
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Page SEO data (English defaults for static HTML - client-side will update per language)
const pages = {
  '/': {
    title: 'FastlyGo - Food Delivery, Courier and Cargo Services in Skopje',
    description: 'Fast courier & delivery service in Skopje. Food, cargo, package delivery in 15 minutes. Real-time tracking, affordable prices. Order now with FastlyGo!',
    keywords: 'food delivery, courier service, Skopje, fast delivery, cargo delivery, Macedonia'
  },
  '/how-it-works': {
    title: 'How It Works - FastlyGo Delivery Process | Skopje',
    description: 'Learn how FastlyGo delivery works. Simple 4-step process: Order online, courier accepts, real-time tracking, delivery in 15 minutes. Fast & reliable.',
    keywords: 'delivery process, how to order, courier tracking, fast delivery, order steps, Skopje'
  },
  '/about-us': {
    title: 'About FastlyGo - Courier & Delivery Service in Skopje',
    description: 'FastlyGo is a professional courier and delivery service in Skopje, Macedonia. 53+ active couriers, 15-minute delivery, real-time tracking. Learn our story.',
    keywords: 'about fastlygo, courier company, delivery service, Skopje, Macedonia, company info'
  },
  '/services': {
    title: 'Our Services - FastlyGo Delivery Categories | Skopje',
    description: 'Explore FastlyGo delivery services: food delivery, grocery shopping, pharmacy delivery, cargo transport, document delivery and more in Skopje.',
    keywords: 'delivery services, food delivery, grocery delivery, pharmacy delivery, cargo, Skopje'
  },
  '/areas': {
    title: 'Delivery Areas - FastlyGo Coverage in Skopje',
    description: 'Check FastlyGo delivery coverage areas in Skopje and surrounding regions. Fast delivery to 38+ neighborhoods and districts.',
    keywords: 'delivery areas, coverage, Skopje neighborhoods, delivery zones, service areas'
  },
  '/new-order': {
    title: 'Order Now - FastlyGo Quick Courier | Skopje',
    description: 'Place your delivery order with FastlyGo. Fast courier service in Skopje. Enter pickup and delivery addresses, choose package size, and get instant delivery.',
    keywords: 'order delivery, call courier, fast delivery, Skopje, order now'
  },
  '/login': {
    title: 'Login - FastlyGo Account',
    description: 'Log in to your FastlyGo account. Track orders, manage deliveries, and access your courier dashboard.',
    keywords: 'login, sign in, FastlyGo account, courier login'
  },
  '/register': {
    title: 'Register - Create FastlyGo Account',
    description: 'Create your FastlyGo account. Join thousands of users enjoying fast delivery. Quick registration for customers, couriers, and businesses.',
    keywords: 'register, sign up, create account, FastlyGo join'
  },
  '/courier/register': {
    title: 'Become a Courier - FastlyGo Driver Registration',
    description: 'Join FastlyGo as a courier driver. Flexible hours, competitive pay, instant payouts. Register now and start earning in Skopje.',
    keywords: 'courier registration, driver signup, delivery driver, earn money, Skopje'
  },
  '/business/register': {
    title: 'Business Registration - FastlyGo Partner Program',
    description: 'Partner with FastlyGo for your business deliveries. Restaurant, market, pharmacy integration. Grow your business with fast delivery.',
    keywords: 'business registration, partner program, restaurant delivery, business delivery'
  },
  '/my-orders': {
    title: 'My Orders - FastlyGo Order History',
    description: 'View and track your FastlyGo orders. Order history, delivery status, and order details.',
    keywords: 'my orders, order history, track delivery, order status'
  },
  '/profile': {
    title: 'My Profile - FastlyGo Account Settings',
    description: 'Manage your FastlyGo profile. Update personal information, delivery addresses, and account settings.',
    keywords: 'profile, account settings, personal info, FastlyGo account'
  },
  '/privacy-policy': {
    title: 'Privacy Policy - FastlyGo',
    description: 'FastlyGo privacy policy. Learn how we collect, use, and protect your personal data.',
    keywords: 'privacy policy, data protection, personal data, FastlyGo privacy'
  },
  '/terms-of-service': {
    title: 'Terms of Service - FastlyGo',
    description: 'FastlyGo terms of service. Read our terms and conditions for using the delivery platform.',
    keywords: 'terms of service, terms and conditions, user agreement, FastlyGo terms'
  },
  '/forgot-password': {
    title: 'Forgot Password - FastlyGo',
    description: 'Reset your FastlyGo account password. Enter your email to receive a password reset link.',
    keywords: 'forgot password, reset password, account recovery'
  },
  '/notifications': {
    title: 'Notifications - FastlyGo',
    description: 'View your FastlyGo notifications. Stay updated on orders, deliveries, and account activity.',
    keywords: 'notifications, alerts, order updates, delivery notifications'
  }
};

function injectSeoIntoHtml(html, pageData, pathname) {
  const safeTitle = esc(pageData.title);
  const safeDesc = esc(pageData.description);
  const safeKeywords = esc(pageData.keywords || '');
  const canonicalUrl = `${BASE_URL}${pathname}`;

  // hreflang URLs
  const hrefEn = `${BASE_URL}${pathname}`;
  const hrefTr = `${BASE_URL}${pathname}?lang=tr`;
  const hrefMk = `${BASE_URL}${pathname}?lang=mk`;
  const hrefSq = `${BASE_URL}${pathname}?lang=sq`;

  const seoBlock = `
    <!-- Pre-rendered SEO meta tags for ${pathname} -->
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />
    <meta name="keywords" content="${safeKeywords}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <link rel="alternate" hreflang="x-default" href="${hrefEn}" />
    <link rel="alternate" hreflang="en" href="${hrefEn}" />
    <link rel="alternate" hreflang="tr" href="${hrefTr}" />
    <link rel="alternate" hreflang="mk" href="${hrefMk}" />
    <link rel="alternate" hreflang="sq" href="${hrefSq}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:site_name" content="FastlyGo" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />`;

  // Remove existing SEO tags from template
  let result = html
    .replace(/<title>[^<]*<\/title>/g, '')
    .replace(/<meta name="description"[^>]*\/?>/g, '')
    .replace(/<meta name="keywords"[^>]*\/?>/g, '')
    .replace(/<link rel="canonical"[^>]*\/?>/g, '')
    .replace(/<link rel="alternate" hreflang[^>]*\/?>/g, '')
    .replace(/<link rel="alternate" hrefLang[^>]*\/?>/g, '')
    .replace(/<meta property="og:[^>]*\/?>/g, '')
    .replace(/<meta name="twitter:[^>]*\/?>/g, '')
    .replace(/<!-- SEO Meta Tags[^>]*-->/g, '')
    .replace(/<!-- canonical and hreflang[^>]*-->/g, '')
    .replace(/<!-- Removed from static[^>]*-->/g, '')
    .replace(/<!-- Server-side injection[^>]*-->/g, '');

  // Inject our clean SEO block before </head>
  result = result.replace('</head>', `${seoBlock}\n  </head>`);

  return result;
}

// Main
console.log('\n🔍 Pre-rendering SEO meta tags for all pages...\n');

const indexHtmlPath = path.join(distPublicPath, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error('❌ dist/public/index.html not found. Run build first.');
  process.exit(1);
}

const templateHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
let generatedCount = 0;

for (const [pathname, seoData] of Object.entries(pages)) {
  const html = injectSeoIntoHtml(templateHtml, seoData, pathname);
  
  if (pathname === '/') {
    // Root page - overwrite index.html directly
    fs.writeFileSync(indexHtmlPath, html, 'utf-8');
    console.log(`✓ / → dist/public/index.html (${seoData.title})`);
  } else {
    // Sub-pages - create {path}/index.html
    const dirPath = path.join(distPublicPath, pathname);
    fs.mkdirSync(dirPath, { recursive: true });
    const filePath = path.join(dirPath, 'index.html');
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log(`✓ ${pathname} → dist/public${pathname}/index.html (${seoData.title})`);
  }
  generatedCount++;
}

console.log('\n' + '='.repeat(60));
console.log(`✅ ${generatedCount} pages pre-rendered with unique SEO meta tags`);
console.log('✅ Each page now has its own title, description, OG tags');
console.log('✅ Manus proxy will serve correct meta tags per page');
console.log('='.repeat(60) + '\n');
