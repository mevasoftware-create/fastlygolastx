import { getDb } from './server/db.ts';
import { pages } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();
if (!db) { console.log('no db'); process.exit(1); }

// fastlygo.al için home page SEO meta — Tirana + İngilizce öncelikli
const newSeoMeta = {
  en: {
    title: "FastlyGo - Food Delivery, Courier & Cargo Service in Tirana",
    description: "Professional food delivery, courier and cargo service in Tirana, Albania. Fast delivery in 15 minutes, real-time tracking, affordable prices. Order courier now!",
    keywords: "food delivery, courier service, cargo delivery, Tirana, Albania, fast delivery, package delivery, motorcycle courier, express delivery, delivery service"
  },
  sq: {
    title: "FastlyGo - Dërgesë Ushqimi, Kurier dhe Kargo në Tiranë",
    description: "Shërbim profesional dërgeseje ushqimi, kurier dhe kargo në Tiranë, Shqipëri. Dërgesë e shpejtë në 15 minuta, ndjekje në kohë reale. Thirr kurier tani!",
    keywords: "dërgesë ushqimi, shërbim kurier, dërgesë kargo, Tiranë, Shqipëri, dërgesë e shpejtë, dërgesë pakete, kurier me motor, dërgesë ekspres, shërbim dërgese"
  },
  tr: {
    title: "FastlyGo - Yemek Teslimatı, Kurye ve Kargo Hizmeti Tiran",
    description: "Profesyonel yemek teslimatı, kurye ve kargo hizmeti Tiran, Arnavutluk. 15 dakikada hızlı teslimat, canlı takip, uygun fiyatlar. Hemen kurye çağır!",
    keywords: "yemek teslimatı, kurye hizmeti, kargo teslimat, Tiran, Arnavutluk, hızlı teslimat, paket teslimat, motosiklet kurye, ekspres teslimat, teslimat hizmeti"
  }
};

// home page'i güncelle
const result = await db.update(pages)
  .set({ seoMeta: JSON.stringify(newSeoMeta) })
  .where(eq(pages.slug, 'home'));

console.log('Updated home page SEO meta for fastlygo.al:', result);

// Verify
const rows = await db.select({ slug: pages.slug, seoMeta: pages.seoMeta }).from(pages).where(eq(pages.slug, 'home'));
const meta = JSON.parse(rows[0].seoMeta);
console.log('EN title:', meta.en.title);
console.log('SQ title:', meta.sq.title);
process.exit(0);
