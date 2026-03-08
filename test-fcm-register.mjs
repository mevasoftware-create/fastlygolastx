// Test: pushNotifications.registerToken endpoint'ini simüle et
// Çalıştır: node test-fcm-register.mjs

import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";

// .env dosyasını oku
try {
  const envContent = readFileSync(".env", "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...val] = line.split("=");
    if (key && val.length) process.env[key.trim()] = val.join("=").trim();
  });
} catch {}

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("❌ DATABASE_URL bulunamadı");
  process.exit(1);
}

// MySQL URL parse
const url = new URL(DB_URL);
const conn = await createConnection({
  host: url.hostname,
  port: parseInt(url.port || "3306"),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

console.log("✅ DB bağlantısı kuruldu\n");

// 1. Admin kullanıcıları listele
const [users] = await conn.execute(
  "SELECT id, email, name, role, loginMethod, password IS NOT NULL as hasPassword FROM users WHERE role = 'admin' LIMIT 5"
);
console.log("👤 Admin kullanıcılar:");
console.table(users);

// 2. Tüm kullanıcılar (ilk 10)
const [allUsers] = await conn.execute(
  "SELECT id, email, name, role FROM users ORDER BY id DESC LIMIT 10"
);
console.log("\n👥 Son 10 kullanıcı:");
console.table(allUsers);

// 3. fcmTokens tablosunu kontrol et
const [tokens] = await conn.execute("SELECT * FROM fcmTokens LIMIT 20");
console.log("\n📱 fcmTokens tablosu (mevcut kayıtlar):");
if (tokens.length === 0) {
  console.log("  ⚠️  Tablo BOŞ — hiç token kaydedilmemiş");
} else {
  console.table(tokens);
}

// 4. Test token ekle (ilk admin kullanıcısı için)
if (users.length > 0) {
  const adminUser = users[0];
  const testToken = "TEST_FCM_TOKEN_" + Date.now();
  
  console.log(`\n🔧 Test token ekleniyor (userId: ${adminUser.id})...`);
  try {
    await conn.execute(
      "INSERT INTO fcmTokens (userId, token, deviceType, deviceId, isActive) VALUES (?, ?, ?, ?, ?)",
      [adminUser.id, testToken, "android", "test-device", true]
    );
    console.log("✅ Test token başarıyla eklendi!");
    
    // Eklenen token'ı doğrula
    const [inserted] = await conn.execute(
      "SELECT * FROM fcmTokens WHERE token = ?",
      [testToken]
    );
    console.log("\n✅ DB'deki token:");
    console.table(inserted);
    
    // Test token'ı temizle
    await conn.execute("DELETE FROM fcmTokens WHERE token = ?", [testToken]);
    console.log("🧹 Test token temizlendi");
  } catch (err) {
    console.error("❌ Token eklenemedi:", err.message);
  }
}

await conn.end();
console.log("\n✅ Test tamamlandı");
