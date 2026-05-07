import { getSiteConfigForHost, applyLocalTerms } from './shared/siteConfig.ts';

const title = 'FastlyGo - Food Delivery, Courier & Cargo Service in Skopje';
const desc = 'Professional food delivery, courier and cargo service in Skopje, North Macedonia.';

const cfgAl = getSiteConfigForHost('fastlygo.al');
console.log('=== fastlygo.al ===');
console.log('EN title:', applyLocalTerms(title, cfgAl, 'en'));
console.log('EN desc:', applyLocalTerms(desc, cfgAl, 'en'));

const cfgKs = getSiteConfigForHost('fastlygo.ks');
console.log('\n=== fastlygo.ks ===');
console.log('EN title:', applyLocalTerms(title, cfgKs, 'en'));
console.log('EN desc:', applyLocalTerms(desc, cfgKs, 'en'));

const cfgMk = getSiteConfigForHost('fastlygo.mk');
console.log('\n=== fastlygo.mk (no referenceTerms, should be unchanged) ===');
console.log('EN title:', applyLocalTerms(title, cfgMk, 'en'));
process.exit(0);
