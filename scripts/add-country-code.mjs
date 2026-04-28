import mysql from "mysql2/promise";
import dotenv from "dotenv";
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
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

try {
  // countryCode kolonu ekle (yoksa)
  await conn.execute(`
    ALTER TABLE areas 
    ADD COLUMN IF NOT EXISTS countryCode VARCHAR(2) NOT NULL DEFAULT 'MK' COMMENT 'MK=Makedonya, AL=Arnavutluk'
  `);
  console.log("✓ countryCode kolonu eklendi");
} catch (e) {
  if (e.code === "ER_DUP_FIELDNAME") {
    console.log("✓ countryCode zaten mevcut");
  } else throw e;
}

try {
  // cityName kolonu ekle (yoksa)
  await conn.execute(`
    ALTER TABLE areas 
    ADD COLUMN IF NOT EXISTS cityName VARCHAR(100) NOT NULL DEFAULT 'Skopje' COMMENT 'Şehir grubu'
  `);
  console.log("✓ cityName kolonu eklendi");
} catch (e) {
  if (e.code === "ER_DUP_FIELDNAME") {
    console.log("✓ cityName zaten mevcut");
  } else throw e;
}

// Mevcut tüm alanları MK olarak işaretle
const [result] = await conn.execute(`UPDATE areas SET countryCode = 'MK' WHERE countryCode = 'MK' OR countryCode IS NULL`);
console.log(`✓ Mevcut ${result.affectedRows} MK bölgesi güncellendi`);

// cityName'leri slug'a göre ata
const cityMap = {
  // Skopje bölgeleri
  "aerodrom": "Skopje", "shkup": "Skopje", "qender": "Skopje", "karpos": "Skopje",
  "kisela-voda": "Skopje", "cair": "Skopje", "gazi-baba": "Skopje", "saraj": "Skopje",
  "butel": "Skopje", "gjorce-petrov": "Skopje", "shuto-orizari": "Skopje",
  "center": "Skopje", "chair": "Skopje",
  // Diğer şehirler
  "bitola": "Bitola", "gostivar": "Gostivar", "tetovo": "Tetovo",
  "ohrid": "Ohrid", "kumanovo": "Kumanovo", "veles": "Veles",
  "strumica": "Strumica", "kocani": "Kocani", "istip": "Istip", "prilep": "Prilep",
};

for (const [slug, city] of Object.entries(cityMap)) {
  await conn.execute(`UPDATE areas SET cityName = ? WHERE slug = ?`, [city, slug]);
}
console.log("✓ cityName değerleri güncellendi");

// Sonucu göster
const [rows] = await conn.execute(`SELECT slug, countryCode, cityName FROM areas ORDER BY countryCode, cityName, slug`);
console.log("\nMevcut bölgeler:");
console.table(rows);

await conn.end();
console.log("\n✓ Migration tamamlandı!");
