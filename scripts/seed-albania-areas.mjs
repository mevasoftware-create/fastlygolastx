import mysql from "mysql2/promise";
import { readFileSync } from "fs";

// Load env
const envPath = "/home/ubuntu/.user_env";
try {
  const envContent = readFileSync(envPath, "utf8");
  envContent.split("\n").forEach(line => {
    const match = line.match(/^export\s+([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  });
} catch {}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not found"); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

// Arnavutluk bölgeleri
const albaniaAreas = [
  // Tirana şehri ve ilçeleri
  { slug: "tirane", cityName: "Tirana", lat: 41.3275, lng: 19.8187, order: 1, seoMeta: {
    en: { title: "Delivery in Tirana | FastlyGo", subtitle: "Tirana City Center", description: "Fast courier delivery in Tirana, Albania. 15-minute delivery to all neighborhoods.", keywords: "delivery tirana, courier tirana, fast delivery albania" },
    sq: { title: "Dërgesë në Tiranë | FastlyGo", subtitle: "Qendra e Tiranës", description: "Dërgesë e shpejtë me korrier në Tiranë, Shqipëri. Dërgesë 15-minutëshe në të gjitha lagjet.", keywords: "dërgesa tiranë, korrier tiranë, dërgesa e shpejtë shqipëri" },
    tr: { title: "Tiran'da Teslimat | FastlyGo", subtitle: "Tiran Şehir Merkezi", description: "Arnavutluk Tiran'da hızlı kurye teslimatı. Tüm mahallelere 15 dakikada teslimat.", keywords: "tiran teslimat, kurye tiran, hızlı teslimat arnavutluk" },
    mk: { title: "Достава во Тирана | FastlyGo", subtitle: "Центар на Тирана", description: "Брза курирска достава во Тирана, Албанија. Достава за 15 минути.", keywords: "достава тирана, курир тирана" }
  }},
  { slug: "blloku", cityName: "Tirana", lat: 41.3245, lng: 19.8175, order: 2, seoMeta: {
    en: { title: "Delivery in Blloku, Tirana | FastlyGo", subtitle: "Blloku District", description: "Fast delivery in Blloku, Tirana's most vibrant neighborhood.", keywords: "delivery blloku tirana, courier blloku" },
    sq: { title: "Dërgesë në Bllok, Tiranë | FastlyGo", subtitle: "Lagja Bllok", description: "Dërgesë e shpejtë në Bllok, lagja më e gjallë e Tiranës.", keywords: "dërgesa bllok tiranë, korrier bllok" },
    tr: { title: "Blloku, Tiran'da Teslimat | FastlyGo", subtitle: "Blloku Mahallesi", description: "Tiran'ın en canlı mahallesi Blloku'da hızlı teslimat.", keywords: "blloku tiran teslimat" },
    mk: { title: "Достава во Блоку, Тирана | FastlyGo", subtitle: "Блоку квартал", description: "Брза достава во Блоку, Тирана.", keywords: "достава блоку тирана" }
  }},
  { slug: "kombinat", cityName: "Tirana", lat: 41.3150, lng: 19.8050, order: 3, seoMeta: {
    en: { title: "Delivery in Kombinat, Tirana | FastlyGo", subtitle: "Kombinat District", description: "Fast courier delivery in Kombinat district, Tirana.", keywords: "delivery kombinat tirana" },
    sq: { title: "Dërgesë në Kombinat, Tiranë | FastlyGo", subtitle: "Lagja Kombinat", description: "Dërgesë e shpejtë me korrier në lagjen Kombinat, Tiranë.", keywords: "dërgesa kombinat tiranë" },
    tr: { title: "Kombinat, Tiran'da Teslimat | FastlyGo", subtitle: "Kombinat Mahallesi", description: "Tiran Kombinat mahallesinde hızlı kurye teslimatı.", keywords: "kombinat tiran teslimat" },
    mk: { title: "Достава во Комбинат, Тирана | FastlyGo", subtitle: "Комбинат", description: "Брза достава во Комбинат, Тирана.", keywords: "достава комбинат тирана" }
  }},
  { slug: "don-bosko", cityName: "Tirana", lat: 41.3380, lng: 19.8300, order: 4, seoMeta: {
    en: { title: "Delivery in Don Bosko, Tirana | FastlyGo", subtitle: "Don Bosko District", description: "Fast courier delivery in Don Bosko, Tirana.", keywords: "delivery don bosko tirana" },
    sq: { title: "Dërgesë në Don Bosko, Tiranë | FastlyGo", subtitle: "Lagja Don Bosko", description: "Dërgesë e shpejtë me korrier në lagjen Don Bosko, Tiranë.", keywords: "dërgesa don bosko tiranë" },
    tr: { title: "Don Bosko, Tiran'da Teslimat | FastlyGo", subtitle: "Don Bosko Mahallesi", description: "Tiran Don Bosko mahallesinde hızlı kurye teslimatı.", keywords: "don bosko tiran teslimat" },
    mk: { title: "Достава во Дон Боско, Тирана | FastlyGo", subtitle: "Дон Боско", description: "Брза достава во Дон Боско, Тирана.", keywords: "достава дон боско тирана" }
  }},
  { slug: "selite", cityName: "Tirana", lat: 41.3450, lng: 19.8400, order: 5, seoMeta: {
    en: { title: "Delivery in Selitë, Tirana | FastlyGo", subtitle: "Selitë District", description: "Fast courier delivery in Selitë, Tirana.", keywords: "delivery selite tirana" },
    sq: { title: "Dërgesë në Selitë, Tiranë | FastlyGo", subtitle: "Lagja Selitë", description: "Dërgesë e shpejtë me korrier në lagjen Selitë, Tiranë.", keywords: "dërgesa selitë tiranë" },
    tr: { title: "Selitë, Tiran'da Teslimat | FastlyGo", subtitle: "Selitë Mahallesi", description: "Tiran Selitë mahallesinde hızlı kurye teslimatı.", keywords: "selite tiran teslimat" },
    mk: { title: "Достава во Селите, Тирана | FastlyGo", subtitle: "Селите", description: "Брза достава во Селите, Тирана.", keywords: "достава селите тирана" }
  }},
  // Durrës
  { slug: "durres", cityName: "Durrës", lat: 41.3233, lng: 19.4414, order: 10, seoMeta: {
    en: { title: "Delivery in Durrës | FastlyGo", subtitle: "Durrës City", description: "Fast courier delivery in Durrës, Albania's main port city.", keywords: "delivery durres, courier durres albania" },
    sq: { title: "Dërgesë në Durrës | FastlyGo", subtitle: "Qyteti i Durrësit", description: "Dërgesë e shpejtë me korrier në Durrës, qyteti kryesor portual i Shqipërisë.", keywords: "dërgesa durrës, korrier durrës" },
    tr: { title: "Durrës'te Teslimat | FastlyGo", subtitle: "Durrës Şehri", description: "Arnavutluk'un ana liman şehri Durrës'te hızlı kurye teslimatı.", keywords: "durrës teslimat, kurye durrës" },
    mk: { title: "Достава во Драч | FastlyGo", subtitle: "Град Драч", description: "Брза достава во Драч, Албанија.", keywords: "достава драч" }
  }},
  // Vlorë
  { slug: "vlore", cityName: "Vlorë", lat: 40.4667, lng: 19.4833, order: 20, seoMeta: {
    en: { title: "Delivery in Vlorë | FastlyGo", subtitle: "Vlorë City", description: "Fast courier delivery in Vlorë, Albania.", keywords: "delivery vlore, courier vlore albania" },
    sq: { title: "Dërgesë në Vlorë | FastlyGo", subtitle: "Qyteti i Vlorës", description: "Dërgesë e shpejtë me korrier në Vlorë, Shqipëri.", keywords: "dërgesa vlorë, korrier vlorë" },
    tr: { title: "Vlorë'de Teslimat | FastlyGo", subtitle: "Vlorë Şehri", description: "Arnavutluk Vlorë'de hızlı kurye teslimatı.", keywords: "vlorë teslimat, kurye vlorë" },
    mk: { title: "Достава во Вльора | FastlyGo", subtitle: "Вльора", description: "Брза достава во Вльора, Албанија.", keywords: "достава вльора" }
  }},
  // Shkodër
  { slug: "shkoder", cityName: "Shkodër", lat: 42.0683, lng: 19.5126, order: 30, seoMeta: {
    en: { title: "Delivery in Shkodër | FastlyGo", subtitle: "Shkodër City", description: "Fast courier delivery in Shkodër, northern Albania.", keywords: "delivery shkoder, courier shkoder albania" },
    sq: { title: "Dërgesë në Shkodër | FastlyGo", subtitle: "Qyteti i Shkodrës", description: "Dërgesë e shpejtë me korrier në Shkodër, Shqipëria veriore.", keywords: "dërgesa shkodër, korrier shkodër" },
    tr: { title: "Shkodër'de Teslimat | FastlyGo", subtitle: "Shkodër Şehri", description: "Kuzey Arnavutluk Shkodër'de hızlı kurye teslimatı.", keywords: "shkodër teslimat, kurye shkodër" },
    mk: { title: "Достава во Шкодра | FastlyGo", subtitle: "Шкодра", description: "Брза достава во Шкодра, Албанија.", keywords: "достава шкодра" }
  }},
  // Elbasan
  { slug: "elbasan", cityName: "Elbasan", lat: 41.1125, lng: 20.0822, order: 40, seoMeta: {
    en: { title: "Delivery in Elbasan | FastlyGo", subtitle: "Elbasan City", description: "Fast courier delivery in Elbasan, central Albania.", keywords: "delivery elbasan, courier elbasan albania" },
    sq: { title: "Dërgesë në Elbasan | FastlyGo", subtitle: "Qyteti i Elbasanit", description: "Dërgesë e shpejtë me korrier në Elbasan, Shqipëria qendrore.", keywords: "dërgesa elbasan, korrier elbasan" },
    tr: { title: "Elbasan'da Teslimat | FastlyGo", subtitle: "Elbasan Şehri", description: "Orta Arnavutluk Elbasan'da hızlı kurye teslimatı.", keywords: "elbasan teslimat, kurye elbasan" },
    mk: { title: "Достава во Елбасан | FastlyGo", subtitle: "Елбасан", description: "Брза достава во Елбасан, Албанија.", keywords: "достава елбасан" }
  }},
  // Fier
  { slug: "fier", cityName: "Fier", lat: 40.7239, lng: 19.5567, order: 50, seoMeta: {
    en: { title: "Delivery in Fier | FastlyGo", subtitle: "Fier City", description: "Fast courier delivery in Fier, Albania.", keywords: "delivery fier, courier fier albania" },
    sq: { title: "Dërgesë në Fier | FastlyGo", subtitle: "Qyteti i Fierit", description: "Dërgesë e shpejtë me korrier në Fier, Shqipëri.", keywords: "dërgesa fier, korrier fier" },
    tr: { title: "Fier'de Teslimat | FastlyGo", subtitle: "Fier Şehri", description: "Arnavutluk Fier'de hızlı kurye teslimatı.", keywords: "fier teslimat, kurye fier" },
    mk: { title: "Достава во Фиер | FastlyGo", subtitle: "Фиер", description: "Брза достава во Фиер, Албанија.", keywords: "достава фиер" }
  }},
  // Korçë
  { slug: "korce", cityName: "Korçë", lat: 40.6186, lng: 20.7808, order: 60, seoMeta: {
    en: { title: "Delivery in Korçë | FastlyGo", subtitle: "Korçë City", description: "Fast courier delivery in Korçë, southeastern Albania.", keywords: "delivery korce, courier korce albania" },
    sq: { title: "Dërgesë në Korçë | FastlyGo", subtitle: "Qyteti i Korçës", description: "Dërgesë e shpejtë me korrier në Korçë, Shqipëria juglindore.", keywords: "dërgesa korçë, korrier korçë" },
    tr: { title: "Korçë'de Teslimat | FastlyGo", subtitle: "Korçë Şehri", description: "Güneydoğu Arnavutluk Korçë'de hızlı kurye teslimatı.", keywords: "korçë teslimat, kurye korçë" },
    mk: { title: "Достава во Корча | FastlyGo", subtitle: "Корча", description: "Брза достава во Корча, Албанија.", keywords: "достава корча" }
  }},
  // Berat
  { slug: "berat", cityName: "Berat", lat: 40.7058, lng: 19.9522, order: 70, seoMeta: {
    en: { title: "Delivery in Berat | FastlyGo", subtitle: "Berat City", description: "Fast courier delivery in Berat, the city of a thousand windows.", keywords: "delivery berat, courier berat albania" },
    sq: { title: "Dërgesë në Berat | FastlyGo", subtitle: "Qyteti i Beratit", description: "Dërgesë e shpejtë me korrier në Berat, qyteti i njëmijë dritareve.", keywords: "dërgesa berat, korrier berat" },
    tr: { title: "Berat'ta Teslimat | FastlyGo", subtitle: "Berat Şehri", description: "Bin pencereli şehir Berat'ta hızlı kurye teslimatı.", keywords: "berat teslimat, kurye berat" },
    mk: { title: "Достава во Берат | FastlyGo", subtitle: "Берат", description: "Брза достава во Берат, Албанија.", keywords: "достава берат" }
  }},
  // Gjirokastër
  { slug: "gjirokaster", cityName: "Gjirokastër", lat: 40.0758, lng: 20.1389, order: 80, seoMeta: {
    en: { title: "Delivery in Gjirokastër | FastlyGo", subtitle: "Gjirokastër City", description: "Fast courier delivery in Gjirokastër, southern Albania.", keywords: "delivery gjirokaster, courier gjirokaster albania" },
    sq: { title: "Dërgesë në Gjirokastër | FastlyGo", subtitle: "Qyteti i Gjirokastrës", description: "Dërgesë e shpejtë me korrier në Gjirokastër, Shqipëria jugore.", keywords: "dërgesa gjirokastër, korrier gjirokastër" },
    tr: { title: "Gjirokastër'de Teslimat | FastlyGo", subtitle: "Gjirokastër Şehri", description: "Güney Arnavutluk Gjirokastër'de hızlı kurye teslimatı.", keywords: "gjirokastër teslimat, kurye gjirokastër" },
    mk: { title: "Достава во Ѓирокастра | FastlyGo", subtitle: "Ѓирокастра", description: "Брза достава во Ѓирокастра, Албанија.", keywords: "достава ѓирокастра" }
  }},
  // Lushnjë
  { slug: "lushnje", cityName: "Lushnjë", lat: 40.9417, lng: 19.7050, order: 90, seoMeta: {
    en: { title: "Delivery in Lushnjë | FastlyGo", subtitle: "Lushnjë City", description: "Fast courier delivery in Lushnjë, Albania.", keywords: "delivery lushnje, courier lushnje albania" },
    sq: { title: "Dërgesë në Lushnjë | FastlyGo", subtitle: "Qyteti i Lushnjës", description: "Dërgesë e shpejtë me korrier në Lushnjë, Shqipëri.", keywords: "dërgesa lushnjë, korrier lushnjë" },
    tr: { title: "Lushnjë'de Teslimat | FastlyGo", subtitle: "Lushnjë Şehri", description: "Arnavutluk Lushnjë'de hızlı kurye teslimatı.", keywords: "lushnjë teslimat, kurye lushnjë" },
    mk: { title: "Достава во Лушња | FastlyGo", subtitle: "Лушња", description: "Брза достава во Лушња, Албанија.", keywords: "достава лушња" }
  }},
];

let added = 0, skipped = 0;
for (const area of albaniaAreas) {
  const seoMetaStr = JSON.stringify(area.seoMeta);
  try {
    await conn.execute(
      `INSERT INTO areas (slug, seoMeta, active, displayOrder, countryCode, cityName, lat, lng) 
       VALUES (?, ?, 1, ?, 'AL', ?, ?, ?)
       ON DUPLICATE KEY UPDATE countryCode='AL', cityName=VALUES(cityName)`,
      [area.slug, seoMetaStr, area.order, area.cityName, area.lat, area.lng]
    );
    added++;
    console.log(`✓ ${area.slug} (${area.cityName})`);
  } catch (e) {
    console.error(`✗ ${area.slug}: ${e.message}`);
    skipped++;
  }
}

console.log(`\n✓ ${added} Arnavutluk bölgesi eklendi, ${skipped} atlandı`);

// Özet
const [rows] = await conn.execute(`SELECT countryCode, COUNT(*) as count FROM areas GROUP BY countryCode`);
console.log("\nÜlke bazlı bölge sayısı:");
console.table(rows);

await conn.end();
