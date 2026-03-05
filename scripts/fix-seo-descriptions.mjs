import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql2.createConnection(process.env.DATABASE_URL);

// Google meta description limit: 155-160 characters
// Each description is crafted to be unique, keyword-rich, and within 155 chars

const areaDescriptions = {
  'aerodrom': {
    en: 'FastlyGo delivers in Aerodrom — food, groceries, pharmacy & parcels. Near Skopje Airport. 15-min express courier, 7 days a week, live GPS tracking.',
    mk: 'FastlyGo доставува во Аеродром — храна, намирници, лекови и пакети. Кај аеродромот. Брза достава за 15 мин, 7 дена, GPS следење.',
    sq: 'FastlyGo dërgon në Aerodrom — ushqim, ushqimore, farmaci & pako. Pranë aeroportit. Korrjer 15 min, 7 ditë, gjurmim GPS.',
    tr: 'FastlyGo Aerodrom\'da teslimat yapıyor — yiyecek, market, eczane ve kargo. Havalimanı yakını. 15 dk ekspres kurye, haftanın 7 günü.',
  },
  'centar': {
    en: 'FastlyGo delivers in Centar, Skopje city center — food, groceries, pharmacy & packages. 15-min express courier with live GPS tracking, 7 days a week.',
    mk: 'FastlyGo доставува во Центар, срцето на Скопје — храна, намирници, лекови и пакети. Брза достава за 15 мин, GPS следење, 7 дена.',
    sq: 'FastlyGo dërgon në Qendër, zemra e Shkupit — ushqim, ushqimore, farmaci & pako. Korrjer 15 min me gjurmim GPS, 7 ditë.',
    tr: 'FastlyGo Centar\'da teslimat yapıyor — Skopje şehir merkezi. Yiyecek, market, eczane ve kargo. 15 dk ekspres kurye, GPS takip.',
  },
  'karpos': {
    en: 'FastlyGo delivers in Karpos, Skopje — food, groceries, pharmacy & parcels. Prestigious residential area. 15-min express courier, live GPS, 7 days.',
    mk: 'FastlyGo доставува во Карпош, Скопје — храна, намирници, лекови и пакети. Престижна населба. Брза достава за 15 мин, 7 дена.',
    sq: 'FastlyGo dërgon në Karposh, Shkup — ushqim, ushqimore, farmaci & pako. Lagje prestigjioze. Korrjer 15 min, GPS, 7 ditë.',
    tr: 'FastlyGo Karpoş\'ta teslimat yapıyor — yiyecek, market, eczane ve kargo. Prestijli konut bölgesi. 15 dk ekspres kurye, GPS takip.',
  },
  'kisela-voda': {
    en: 'FastlyGo delivers in Kisela Voda, Skopje — food, groceries, pharmacy & packages. Largest municipality. 15-min express courier with GPS, 7 days.',
    mk: 'FastlyGo доставува во Кисела Вода, Скопје — храна, намирници, лекови и пакети. Најголема општина. Брза достава 15 мин, GPS, 7 дена.',
    sq: 'FastlyGo dërgon në Kisela Voda, Shkup — ushqim, ushqimore, farmaci & pako. Komuna më e madhe. Korrjer 15 min, GPS, 7 ditë.',
    tr: 'FastlyGo Kisela Voda\'da teslimat yapıyor — yiyecek, market, eczane ve kargo. En büyük belediye. 15 dk ekspres kurye, GPS takip.',
  },
  'cair': {
    en: 'FastlyGo delivers in Cair, Skopje — food, groceries, pharmacy & parcels. Historic multicultural district. 15-min express courier, GPS, 7 days.',
    mk: 'FastlyGo доставува во Чаир, Скопје — храна, намирници, лекови и пакети. Историски мултикултурен реон. Брза достава 15 мин, 7 дена.',
    sq: 'FastlyGo dërgon në Çair, Shkup — ushqim, ushqimore, farmaci & pako. Lagje historike multikulturore. Korrjer 15 min, GPS, 7 ditë.',
    tr: 'FastlyGo Çair\'de teslimat yapıyor — yiyecek, market, eczane ve kargo. Tarihi çok kültürlü bölge. 15 dk ekspres kurye, GPS takip.',
  },
  'gazi-baba': {
    en: 'FastlyGo delivers in Gazi Baba, Skopje — food, groceries, pharmacy & packages. Eastern gateway district. 15-min express courier, GPS, 7 days.',
    mk: 'FastlyGo доставува во Гази Баба, Скопје — храна, намирници, лекови и пакети. Источна порта на градот. Брза достава 15 мин, 7 дена.',
    sq: 'FastlyGo dërgon në Gazi Baba, Shkup — ushqim, ushqimore, farmaci & pako. Porta lindore e qytetit. Korrjer 15 min, GPS, 7 ditë.',
    tr: 'FastlyGo Gazi Baba\'da teslimat yapıyor — yiyecek, market, eczane ve kargo. Şehrin doğu kapısı. 15 dk ekspres kurye, GPS takip.',
  },
  'saraj': {
    en: 'FastlyGo delivers in Saraj, Skopje — food, groceries, pharmacy & parcels. Westernmost municipality. 15-min express courier with GPS, 7 days.',
    mk: 'FastlyGo доставува во Сарај, Скопје — храна, намирници, лекови и пакети. Западна општина. Брза достава за 15 мин, GPS, 7 дена.',
    sq: 'FastlyGo dërgon në Saraj, Shkup — ushqim, ushqimore, farmaci & pako. Komuna perëndimore. Korrjer 15 min, GPS, 7 ditë.',
    tr: 'FastlyGo Saraj\'da teslimat yapıyor — yiyecek, market, eczane ve kargo. En batıdaki belediye. 15 dk ekspres kurye, GPS takip.',
  },
  'butel': {
    en: 'FastlyGo delivers in Butel, Skopje — food, groceries, pharmacy & packages. Northern municipality. 15-min express courier with live GPS, 7 days.',
    mk: 'FastlyGo доставува во Бутел, Скопје — храна, намирници, лекови и пакети. Северна општина. Брза достава за 15 мин, GPS, 7 дена.',
    sq: 'FastlyGo dërgon në Butel, Shkup — ushqim, ushqimore, farmaci & pako. Komuna veriore. Korrjer 15 min, GPS gjallë, 7 ditë.',
    tr: 'FastlyGo Butel\'de teslimat yapıyor — yiyecek, market, eczane ve kargo. Kuzey belediyesi. 15 dk ekspres kurye, canlı GPS takip.',
  },
  'skopje': {
    en: 'FastlyGo — Skopje\'s on-demand delivery platform. Food, groceries, pharmacy & parcels delivered in 15 min. Live GPS tracking, 7 days a week.',
    mk: 'FastlyGo — платформа за достава во Скопје. Храна, намирници, лекови и пакети за 15 мин. GPS следење, 7 дена во неделата.',
    sq: 'FastlyGo — platforma e dërgimit në Shkup. Ushqim, ushqimore, farmaci & pako në 15 min. Gjurmim GPS, 7 ditë në javë.',
    tr: 'FastlyGo — Skopje\'nin talep üzerine teslimat platformu. Yiyecek, market, eczane ve kargo 15 dk\'da. Canlı GPS, haftanın 7 günü.',
  },
  'tetovo': {
    en: 'FastlyGo delivers in Tetovo — food, groceries, pharmacy & parcels. Capital of the Polog region. 15-min express courier, GPS tracking, 7 days.',
    mk: 'FastlyGo доставува во Тетово — храна, намирници, лекови и пакети. Главен град на Полог. Брза достава 15 мин, GPS, 7 дена.',
    sq: 'FastlyGo dërgon në Tetovë — ushqim, ushqimore, farmaci & pako. Kryeqyteti i Pollogut. Korrjer 15 min, GPS, 7 ditë.',
    tr: 'FastlyGo Tetovo\'da teslimat yapıyor — yiyecek, market, eczane ve kargo. Polog bölgesinin başkenti. 15 dk kurye, GPS, 7 gün.',
  },
  'bitola': {
    en: 'FastlyGo delivers in Bitola — food, groceries, pharmacy & parcels. North Macedonia\'s second city. 15-min express courier, GPS tracking, 7 days.',
    mk: 'FastlyGo доставува во Битола — храна, намирници, лекови и пакети. Втор град во Македонија. Брза достава 15 мин, GPS, 7 дена.',
    sq: 'FastlyGo dërgon në Manastir — ushqim, ushqimore, farmaci & pako. Qyteti i dytë i Maqedonisë. Korrjer 15 min, GPS, 7 ditë.',
    tr: 'FastlyGo Bitola\'da teslimat yapıyor — yiyecek, market, eczane ve kargo. Kuzey Makedonya\'nın ikinci şehri. 15 dk kurye, GPS.',
  },
  'kumanovo': {
    en: 'FastlyGo delivers in Kumanovo — food, groceries, pharmacy & parcels. Third largest city. 15-min express courier with live GPS tracking, 7 days.',
    mk: 'FastlyGo доставува во Куманово — храна, намирници, лекови и пакети. Трет по големина град. Брза достава 15 мин, GPS, 7 дена.',
    sq: 'FastlyGo dërgon në Kumanovë — ushqim, ushqimore, farmaci & pako. Qyteti i tretë. Korrjer 15 min, GPS gjallë, 7 ditë.',
    tr: 'FastlyGo Kumanovo\'da teslimat yapıyor — yiyecek, market, eczane ve kargo. Üçüncü büyük şehir. 15 dk ekspres kurye, GPS takip.',
  },
  'istip': {
    en: 'FastlyGo delivers in Shtip — food, groceries, pharmacy & parcels. Cultural capital of east Macedonia. 15-min courier, GPS tracking, 7 days.',
    mk: 'FastlyGo доставува во Штип — храна, намирници, лекови и пакети. Културна престолнина на исток. Брза достава 15 мин, GPS, 7 дена.',
    sq: 'FastlyGo dërgon në Shtip — ushqim, ushqimore, farmaci & pako. Kryeqyteti kulturor i lindjes. Korrjer 15 min, GPS, 7 ditë.',
    tr: 'FastlyGo Ştip\'te teslimat yapıyor — yiyecek, market, eczane ve kargo. Doğu Makedonya\'nın kültür başkenti. 15 dk kurye, GPS.',
  },
  'veles': {
    en: 'FastlyGo delivers in Veles — food, groceries, pharmacy & parcels. Historic city at the geographic center of Macedonia. 15-min courier, GPS, 7 days.',
    mk: 'FastlyGo доставува во Велес — храна, намирници, лекови и пакети. Историски град во центарот на Македонија. Брза достава 15 мин.',
    sq: 'FastlyGo dërgon në Veles — ushqim, ushqimore, farmaci & pako. Qytet historik në qendër të Maqedonisë. Korrjer 15 min, GPS.',
    tr: 'FastlyGo Veles\'te teslimat yapıyor — yiyecek, market, eczane ve kargo. Makedonya\'nın coğrafi merkezindeki tarihi şehir.',
  },
  'prilep': {
    en: 'FastlyGo delivers in Prilep — food, groceries, pharmacy & parcels. City of Tobacco and Marble. 15-min express courier, GPS tracking, 7 days.',
    mk: 'FastlyGo доставува во Прилеп — храна, намирници, лекови и пакети. Градот на тутунот и мермерот. Брза достава 15 мин, GPS.',
    sq: 'FastlyGo dërgon në Prilep — ushqim, ushqimore, farmaci & pako. Qyteti i duhanit dhe mermerit. Korrjer 15 min, GPS, 7 ditë.',
    tr: 'FastlyGo Prilep\'te teslimat yapıyor — yiyecek, market, eczane ve kargo. Tütün ve Mermer Şehri. 15 dk ekspres kurye, GPS takip.',
  },
  'kocani': {
    en: 'FastlyGo delivers in Kocani — food, groceries, pharmacy & parcels. Rice capital of North Macedonia. 15-min express courier, GPS, 7 days a week.',
    mk: 'FastlyGo доставува во Кочани — храна, намирници, лекови и пакети. Престолнина на оризот. Брза достава за 15 мин, GPS, 7 дена.',
    sq: 'FastlyGo dërgon në Koçani — ushqim, ushqimore, farmaci & pako. Kryeqyteti i orizit. Korrjer 15 min, GPS gjallë, 7 ditë.',
    tr: 'FastlyGo Koçani\'de teslimat yapıyor — yiyecek, market, eczane ve kargo. Kuzey Makedonya\'nın pirinç başkenti. 15 dk kurye.',
  },
  'strumica': {
    en: 'FastlyGo delivers in Strumica — food, groceries, pharmacy & parcels. Agricultural capital of southeast Macedonia. 15-min courier, GPS, 7 days.',
    mk: 'FastlyGo доставува во Струмица — храна, намирници, лекови и пакети. Земјоделска престолнина на југоисток. Брза достава 15 мин.',
    sq: 'FastlyGo dërgon në Strumicë — ushqim, ushqimore, farmaci & pako. Kryeqyteti bujqësor i juglindjes. Korrjer 15 min, GPS.',
    tr: 'FastlyGo Strumica\'da teslimat yapıyor — yiyecek, market, eczane ve kargo. Güneydoğunun tarım başkenti. 15 dk kurye, GPS.',
  },
  'gostivar': {
    en: 'FastlyGo delivers in Gostivar — food, groceries, pharmacy & parcels. Vibrant multicultural city. 15-min express courier, GPS tracking, 7 days.',
    mk: 'FastlyGo доставува во Гостивар — храна, намирници, лекови и пакети. Мултикултурен град. Брза достава за 15 мин, GPS, 7 дена.',
    sq: 'FastlyGo dërgon në Gostivar — ushqim, ushqimore, farmaci & pako. Qytet multikulturor. Korrjer 15 min, GPS gjallë, 7 ditë.',
    tr: 'FastlyGo Gostivar\'da teslimat yapıyor — yiyecek, market, eczane ve kargo. Canlı çok kültürlü şehir. 15 dk ekspres kurye, GPS.',
  },
  'ohrid': {
    en: 'FastlyGo delivers in Ohrid — food, groceries, pharmacy & parcels. UNESCO World Heritage city & lake resort. 15-min courier, GPS, 7 days.',
    mk: 'FastlyGo доставува во Охрид — храна, намирници, лекови и пакети. УНЕСКО наследство. Брза достава за 15 мин, GPS, 7 дена.',
    sq: 'FastlyGo dërgon në Ohër — ushqim, ushqimore, farmaci & pako. Trashëgimi UNESCO. Korrjer 15 min, GPS gjallë, 7 ditë.',
    tr: 'FastlyGo Ohrid\'de teslimat yapıyor — yiyecek, market, eczane ve kargo. UNESCO Dünya Mirası şehri. 15 dk ekspres kurye, GPS.',
  },
  'gjorce-petrov': {
    en: 'FastlyGo delivers in Gjorce Petrov, Skopje — food, groceries, pharmacy & parcels. Western residential hub. 15-min courier, GPS tracking, 7 days.',
    mk: 'FastlyGo доставува во Ѓорче Петров, Скопје — храна, намирници, лекови и пакети. Западна населба. Брза достава 15 мин, GPS.',
    sq: 'FastlyGo dërgon në Gjorçe Petrov, Shkup — ushqim, ushqimore, farmaci & pako. Lagje perëndimore. Korrjer 15 min, GPS, 7 ditë.',
    tr: 'FastlyGo Gjorce Petrov\'da teslimat yapıyor — yiyecek, market, eczane ve kargo. Batı konut merkezi. 15 dk kurye, GPS takip.',
  },
  'suto-orizari': {
    en: 'FastlyGo delivers in Suto Orizari, Skopje — food, groceries, pharmacy & parcels. Unique northern municipality. 15-min courier, GPS, 7 days.',
    mk: 'FastlyGo доставува во Шуто Оризари, Скопје — храна, намирници, лекови и пакети. Северна општина. Брза достава 15 мин, GPS.',
    sq: 'FastlyGo dërgon në Shuto Orizare, Shkup — ushqim, ushqimore, farmaci & pako. Komunë veriore unike. Korrjer 15 min, GPS.',
    tr: 'FastlyGo Suto Orizari\'de teslimat yapıyor — yiyecek, market, eczane ve kargo. Benzersiz kuzey belediyesi. 15 dk kurye, GPS.',
  },
};

const categoryDescriptions = {
  'food-delivery': {
    en: 'Order pizza, burgers, sushi, kebabs & more from top Skopje restaurants. FastlyGo delivers hot food to your door in 15 minutes, 7 days a week.',
    mk: 'Нарачај пица, бургери, суши, кебап и уште од топ ресторани во Скопје. FastlyGo доставува топла храна за 15 мин, 7 дена.',
    sq: 'Porosit picë, hamburgerë, sushi, qebap & më shumë nga restorantet kryesore. FastlyGo dërgon ushqim të ngrohtë në 15 min, 7 ditë.',
    tr: 'Skopje\'nin en iyi restoranlarından pizza, burger, sushi, kebap ve daha fazlasını sipariş edin. FastlyGo 15 dk\'da sıcak yemek teslim eder.',
  },
  'grocery-delivery': {
    en: 'Order fresh groceries, fruits, vegetables & daily essentials online. FastlyGo delivers from local Skopje markets to your door in 15 minutes.',
    mk: 'Нарачај свежи намирници, овошје, зеленчук и секојдневни потреби. FastlyGo доставува од локални маркети за 15 мин.',
    sq: 'Porosit ushqimore të freskëta, fruta, perime & të domosdoshme. FastlyGo dërgon nga tregjet lokale të Shkupit në 15 min.',
    tr: 'Taze market ürünleri, meyve, sebze ve günlük ihtiyaçlarınızı online sipariş edin. FastlyGo Skopje\'deki marketlerden 15 dk\'da teslim eder.',
  },
  'pharmacy-delivery': {
    en: 'Order prescription medicines, vitamins, supplements & health products. FastlyGo delivers from licensed Skopje pharmacies in 15 minutes, 7 days.',
    mk: 'Нарачај лекови на рецепт, витамини, суплементи и здравствени производи. FastlyGo доставува од аптеки за 15 мин, 7 дена.',
    sq: 'Porosit ilaçe me recetë, vitamina, suplemente & produkte shëndetësore. FastlyGo dërgon nga barnatoret e licencuara në 15 min.',
    tr: 'Reçeteli ilaçlar, vitaminler, takviyeler ve sağlık ürünleri sipariş edin. FastlyGo lisanslı Skopje eczanelerinden 15 dk\'da teslim eder.',
  },
  'flower-delivery': {
    en: 'Send fresh flowers, bouquets & floral arrangements across Skopje. FastlyGo delivers roses, tulips & seasonal blooms in 15 minutes, same day.',
    mk: 'Испрати свежи цвеќиња, букети и цветни аранжмани низ Скопје. FastlyGo доставува рози, лалиња и сезонски цвеќиња за 15 мин.',
    sq: 'Dërgo lule të freskëta, buqeta & aranzhime lulesh nëpër Shkup. FastlyGo dërgon trëndafila, tulipanë & lule sezonale në 15 min.',
    tr: 'Skopje genelinde taze çiçekler, buketler ve çiçek aranjmanları gönderin. FastlyGo güller, laleler ve mevsim çiçeklerini 15 dk\'da teslim eder.',
  },
  'cargo-package-delivery': {
    en: 'Send packages, documents & cargo across Skopje and North Macedonia. FastlyGo offers same-day courier delivery with real-time GPS tracking.',
    mk: 'Испрати пакети, документи и карго низ Скопје и Македонија. FastlyGo нуди достава во ист ден со GPS следење во реално време.',
    sq: 'Dërgo pako, dokumente & kargo nëpër Shkup dhe Maqedoninë e Veriut. FastlyGo ofron dërgim të njëjtën ditë me gjurmim GPS.',
    tr: 'Skopje ve Kuzey Makedonya genelinde paket, belge ve kargo gönderin. FastlyGo aynı gün kurye teslimatı ve gerçek zamanlı GPS takibi sunar.',
  },
  'pet-supplies': {
    en: 'Order cat food, dog food, pet toys, accessories & care products online. FastlyGo delivers pet supplies to your door in 15 minutes across Skopje.',
    mk: 'Нарачај храна за мачки, кучиња, играчки и производи за миленичиња. FastlyGo доставува потреби за миленичиња за 15 мин низ Скопје.',
    sq: 'Porosit ushqim mace, qeni, lodra & produkte kujdesi për kafshë shtëpiake. FastlyGo dërgon furnizime për kafshë në 15 min.',
    tr: 'Kedi maması, köpek maması, evcil hayvan oyuncakları ve bakım ürünleri sipariş edin. FastlyGo Skopje genelinde 15 dk\'da teslim eder.',
  },
};

// Validate character limits
function validateDescriptions(data, type) {
  let issues = 0;
  for (const [slug, langs] of Object.entries(data)) {
    for (const [lang, desc] of Object.entries(langs)) {
      if (desc.length > 160) {
        console.warn(`⚠️  ${type}/${slug} [${lang}]: ${desc.length} chars (too long!)`);
        issues++;
      }
    }
  }
  if (issues === 0) console.log(`✅ All ${type} descriptions within 160 char limit`);
}

validateDescriptions(areaDescriptions, 'areas');
validateDescriptions(categoryDescriptions, 'categories');

// Update areas
const [areas] = await db.execute('SELECT id, slug, seoMeta FROM areas');
let areaCount = 0;
for (const area of areas) {
  const slug = area.slug;
  if (!areaDescriptions[slug]) continue;
  
  let existing = {};
  try { existing = JSON.parse(area.seoMeta || '{}'); } catch {}
  
  const newMeta = {};
  for (const lang of ['en', 'mk', 'sq', 'tr']) {
    const existingLang = existing[lang] || {};
    newMeta[lang] = {
      ...existingLang,
      description: areaDescriptions[slug][lang],
    };
  }
  
  await db.execute('UPDATE areas SET seoMeta = ? WHERE id = ?', [JSON.stringify(newMeta), area.id]);
  areaCount++;
}
console.log(`✅ Updated ${areaCount} areas`);

// Update categories
const [cats] = await db.execute('SELECT id, slug, seoMeta FROM categories');
let catCount = 0;
for (const cat of cats) {
  const slug = cat.slug;
  if (!categoryDescriptions[slug]) continue;
  
  let existing = {};
  try { existing = JSON.parse(cat.seoMeta || '{}'); } catch {}
  
  const newMeta = {};
  for (const lang of ['en', 'mk', 'sq', 'tr']) {
    const existingLang = existing[lang] || {};
    newMeta[lang] = {
      ...existingLang,
      description: categoryDescriptions[slug][lang],
    };
  }
  
  await db.execute('UPDATE categories SET seoMeta = ? WHERE id = ?', [JSON.stringify(newMeta), cat.id]);
  catCount++;
}
console.log(`✅ Updated ${catCount} categories`);

await db.end();
console.log('🎉 All SEO descriptions updated to Google 155-160 char limit');
