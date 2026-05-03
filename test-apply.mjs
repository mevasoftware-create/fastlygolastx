import { getSiteConfigForHost, applyLocalTerms } from './shared/siteConfig.ts';

const cfg = getSiteConfigForHost('fastlygo.al');
const sqTitle = "FastlyGo - Dërgesë Ushqimi, Kurier dhe Kargo në Shkup";
const sqDesc = "Shërbim profesional dërgeseje ushqimi, kurier dhe kargo në Shkup, Maqedoni. Dërgesë e shpejtë në 15 minuta, ndjekje në kohë reale. Thirr kurier tani!";

const resultTitle = applyLocalTerms(sqTitle, cfg, 'sq');
const resultDesc = applyLocalTerms(sqDesc, cfg, 'sq');

console.log('Original title:', sqTitle);
console.log('Transformed title:', resultTitle);
console.log('');
console.log('Original desc:', sqDesc);
console.log('Transformed desc:', resultDesc);
console.log('');
console.log('referenceTerms:', JSON.stringify(cfg.referenceTerms, null, 2));
process.exit(0);
