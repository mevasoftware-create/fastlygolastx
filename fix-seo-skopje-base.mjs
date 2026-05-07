/**
 * DB'deki tüm sayfa SEO meta'larını Skopje/Makedonya bazlı (referans domain = fastlygo.mk) olarak günceller.
 * applyLocalTerms bu değerleri alıp fastlygo.al → Tirana, fastlygo.ks → Pristina'ya çevirecek.
 */
import { getDb } from './server/db.ts';
import { pages } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();
if (!db) { console.log('no db'); process.exit(1); }

const SEO_DATA = {
  'home': {
    en: {
      title: "FastlyGo - Food Delivery, Courier & Cargo Service in Skopje",
      description: "Professional food delivery, courier and cargo service in Skopje, North Macedonia. Fast delivery in 15 minutes, real-time tracking, affordable prices. Order courier now!",
      keywords: "food delivery, courier service, cargo delivery, Skopje, North Macedonia, fast delivery, package delivery, motorcycle courier, express delivery, delivery service"
    },
    mk: {
      title: "FastlyGo - Достава на храна, Курир и Карго во Скопје",
      description: "Професионална достава на храна, курирска и карго услуга во Скопје, Македонија. Брза достава за 15 минути, следење во реално време. Нарачај курир сега!",
      keywords: "достава на храна, курирска услуга, карго достава, Скопје, Македонија, брза достава, достава на пакети, мотоциклистички курир, експрес достава"
    },
    sq: {
      title: "FastlyGo - Dërgesë Ushqimi, Kurier dhe Kargo në Shkup",
      description: "Shërbim profesional dërgeseje ushqimi, kurier dhe kargo në Shkup, Maqedoni. Dërgesë e shpejtë në 15 minuta, ndjekje në kohë reale. Thirr kurier tani!",
      keywords: "dërgesë ushqimi, shërbim kurier, dërgesë kargo, Shkup, Maqedoni, dërgesë e shpejtë, dërgesë pakete, kurier me motor, dërgesë ekspres"
    },
    tr: {
      title: "FastlyGo - Yemek Teslimatı, Kurye ve Kargo Hizmeti Üsküp",
      description: "Profesyonel yemek teslimatı, kurye ve kargo hizmeti Üsküp, Kuzey Makedonya. 15 dakikada hızlı teslimat, canlı takip, uygun fiyatlar. Hemen kurye çağır!",
      keywords: "yemek teslimatı, kurye hizmeti, kargo teslimat, Üsküp, Kuzey Makedonya, hızlı teslimat, paket teslimat, motosiklet kurye, ekspres teslimat"
    }
  },
  'about-us': {
    en: {
      title: "About FastlyGo | Courier Service in Skopje",
      description: "Learn about FastlyGo - the leading courier and delivery service in Skopje, North Macedonia. Our story, mission and values.",
      keywords: "about FastlyGo, courier company, delivery service, Skopje, North Macedonia"
    },
    mk: {
      title: "За FastlyGo | Курирска услуга во Скопје",
      description: "Дознајте повеќе за FastlyGo - водечката курирска и услуга за достава во Скопје, Македонија.",
      keywords: "за FastlyGo, курирска компанија, услуга за достава, Скопје, Македонија"
    },
    sq: {
      title: "Rreth FastlyGo | Shërbim kurierie në Shkup",
      description: "Mësoni rreth FastlyGo - shërbimi kryesor i kurierit dhe dërgesës në Shkup, Maqedoni.",
      keywords: "rreth FastlyGo, kompani kurierie, shërbim dërgese, Shkup, Maqedoni"
    },
    tr: {
      title: "FastlyGo Hakkında | Üsküp Kurye Hizmeti",
      description: "FastlyGo hakkında bilgi edinin - Üsküp, Kuzey Makedonya'nın önde gelen kurye ve teslimat hizmeti.",
      keywords: "FastlyGo hakkında, kurye şirketi, teslimat hizmeti, Üsküp, Kuzey Makedonya"
    }
  },
  'new-order': {
    en: {
      title: "Call a Courier in Skopje - Fast Delivery Service | FastlyGo",
      description: "Order a courier in Skopje instantly. Fast delivery in 15 minutes. Food, packages, documents - we deliver everything in North Macedonia.",
      keywords: "call courier, order delivery, Skopje, fast delivery, courier service, North Macedonia"
    },
    mk: {
      title: "Повикај курир во Скопје - Брза услуга за достава | FastlyGo",
      description: "Нарачај курир во Скопје веднаш. Брза достава за 15 минути. Храна, пакети, документи - доставуваме сè во Македонија.",
      keywords: "повикај курир, нарачај достава, Скопје, брза достава, курирска услуга, Македонија"
    },
    sq: {
      title: "Thirr një Kurier në Shkup - Shërbim i Shpejtë Dorëzimi | FastlyGo",
      description: "Porosit një kurier në Shkup menjëherë. Dorëzim i shpejtë në 15 minuta. Ushqim, pako, dokumente - dorëzojmë gjithçka në Maqedoni.",
      keywords: "thirr kurier, porosit dërgesë, Shkup, dorëzim i shpejtë, shërbim kurierie, Maqedoni"
    },
    tr: {
      title: "Üsküp'te Kurye Çağır - Hızlı Teslimat Hizmeti | FastlyGo",
      description: "Üsküp'te anında kurye sipariş edin. 15 dakikada hızlı teslimat. Yemek, paket, belge - Kuzey Makedonya'da her şeyi teslim ediyoruz.",
      keywords: "kurye çağır, teslimat sipariş et, Üsküp, hızlı teslimat, kurye hizmeti, Kuzey Makedonya"
    }
  }
};

for (const [slug, meta] of Object.entries(SEO_DATA)) {
  const result = await db.update(pages)
    .set({ seoMeta: JSON.stringify(meta) })
    .where(eq(pages.slug, slug));
  console.log(`Updated ${slug}:`, result[0]?.changedRows ?? result[0]?.affectedRows, 'rows');
}

console.log('\nDone! Verifying...');
const rows = await db.select({ slug: pages.slug, seoMeta: pages.seoMeta }).from(pages);
for (const row of rows) {
  try {
    const meta = JSON.parse(row.seoMeta);
    console.log(`\n=== ${row.slug} ===`);
    if (meta.en) console.log('EN:', meta.en.title);
  } catch {
    console.log(`${row.slug}: parse error`);
  }
}
process.exit(0);
