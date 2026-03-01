/**
 * Manus veritabanındaki tabloları TiDB Cloud şemasıyla uyumlu hale getirir.
 * Eksik kolonları ekler, tip uyumsuzluklarını düzeltir.
 */
import mysql from 'mysql2/promise';

const url = new URL(process.env.DATABASE_URL.split('?')[0]);
const conn = await mysql.createConnection({
  host: url.hostname, port: parseInt(url.port) || 3306,
  user: url.username, password: url.password,
  database: url.pathname.slice(1), ssl: { rejectUnauthorized: false }
});

const alterStatements = [
  // ── users ──────────────────────────────────────────────────────────────────
  // openId nullable yap (eski şemada DEFAULT NULL)
  `ALTER TABLE users MODIFY COLUMN openId varchar(64) DEFAULT NULL`,
  // email NOT NULL unique yap
  `ALTER TABLE users MODIFY COLUMN email varchar(320) NOT NULL`,
  // role enum'a courier ve business ekle
  `ALTER TABLE users MODIFY COLUMN role enum('user','admin','courier','business') NOT NULL DEFAULT 'user'`,
  // Eksik kolonları ekle
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar(20) DEFAULT NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatarUrl text DEFAULT NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS password text DEFAULT NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerified tinyint(1) NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerificationToken varchar(255) DEFAULT NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS passwordResetToken varchar(255) DEFAULT NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS passwordResetExpires timestamp NULL DEFAULT NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS emailPreferences json DEFAULT NULL`,

  // ── businesses ─────────────────────────────────────────────────────────────
  `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS businessType varchar(100) DEFAULT NULL`,
  `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS latitude varchar(50) DEFAULT NULL`,
  `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS longitude varchar(50) DEFAULT NULL`,
  `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS countryCode varchar(5) DEFAULT NULL`,
  `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contactPerson varchar(255) DEFAULT NULL`,
  `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS email varchar(320) DEFAULT NULL`,
  `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS balance int(11) DEFAULT 0`,
  `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS totalDebt int(11) DEFAULT 0`,
  `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS status enum('active','inactive','suspended') DEFAULT 'active'`,
  // isApproved → isVerified rename (eğer isApproved varsa)
  // isActive → status ile değiştirildi, eski kolon varsa bırak
  // totalOrders kaldır (eski şemada yok)
  `ALTER TABLE businesses DROP COLUMN IF EXISTS totalOrders`,
  `ALTER TABLE businesses DROP COLUMN IF EXISTS isApproved`,
  `ALTER TABLE businesses DROP COLUMN IF EXISTS isActive`,
  // isVerified ekle
  `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS isVerified tinyint(1) NOT NULL DEFAULT 0`,

  // ── couriers ───────────────────────────────────────────────────────────────
  `ALTER TABLE couriers ADD COLUMN IF NOT EXISTS vehiclePlate varchar(20) DEFAULT NULL`,
  `ALTER TABLE couriers ADD COLUMN IF NOT EXISTS currentLatitude varchar(50) DEFAULT NULL`,
  `ALTER TABLE couriers ADD COLUMN IF NOT EXISTS currentLongitude varchar(50) DEFAULT NULL`,
  `ALTER TABLE couriers ADD COLUMN IF NOT EXISTS countryCode varchar(5) DEFAULT NULL`,
  `ALTER TABLE couriers ADD COLUMN IF NOT EXISTS gender enum('male','female','other') DEFAULT NULL`,
  `ALTER TABLE couriers ADD COLUMN IF NOT EXISTS experience text DEFAULT NULL`,
  `ALTER TABLE couriers ADD COLUMN IF NOT EXISTS availability text DEFAULT NULL`,
  `ALTER TABLE couriers ADD COLUMN IF NOT EXISTS iban varchar(34) DEFAULT NULL`,
  `ALTER TABLE couriers ADD COLUMN IF NOT EXISTS identityNumber varchar(20) DEFAULT NULL`,
  `ALTER TABLE couriers ADD COLUMN IF NOT EXISTS identityType enum('tc','passport') DEFAULT NULL`,
  `ALTER TABLE couriers ADD COLUMN IF NOT EXISTS identityVerified tinyint(1) NOT NULL DEFAULT 0`,
  `ALTER TABLE couriers ADD COLUMN IF NOT EXISTS isDemo tinyint(1) NOT NULL DEFAULT 0`,
  // status enum güncelle
  `ALTER TABLE couriers MODIFY COLUMN status enum('pending','approved','rejected') NOT NULL DEFAULT 'pending'`,
  // isVerified ekle (eski şemada var)
  `ALTER TABLE couriers ADD COLUMN IF NOT EXISTS isVerified tinyint(1) NOT NULL DEFAULT 0`,
  // isApproved kaldır
  `ALTER TABLE couriers DROP COLUMN IF EXISTS isApproved`,
  `ALTER TABLE couriers DROP COLUMN IF EXISTS isActive`,
  `ALTER TABLE couriers DROP COLUMN IF EXISTS totalEarnings`,

  // ── pricingConfig ──────────────────────────────────────────────────────────
  `ALTER TABLE pricingConfig ADD COLUMN IF NOT EXISTS scenario enum('A','B','C') NOT NULL DEFAULT 'A'`,
  `ALTER TABLE pricingConfig ADD COLUMN IF NOT EXISTS commissionRate int(11) DEFAULT NULL`,
  `ALTER TABLE pricingConfig ADD COLUMN IF NOT EXISTS description text DEFAULT NULL`,
  // baseFee, perKmFee kolonlarını ekle (eski şema adları)
  `ALTER TABLE pricingConfig ADD COLUMN IF NOT EXISTS baseFee int(11) NOT NULL DEFAULT 0`,
  `ALTER TABLE pricingConfig ADD COLUMN IF NOT EXISTS perKmFee int(11) NOT NULL DEFAULT 0`,
  // minPrice, maxPrice, basePrice, pricePerKm kaldır
  `ALTER TABLE pricingConfig DROP COLUMN IF EXISTS minPrice`,
  `ALTER TABLE pricingConfig DROP COLUMN IF EXISTS maxPrice`,
  `ALTER TABLE pricingConfig DROP COLUMN IF EXISTS basePrice`,
  `ALTER TABLE pricingConfig DROP COLUMN IF EXISTS pricePerKm`,
  `ALTER TABLE pricingConfig DROP COLUMN IF EXISTS categoryId`,
  `ALTER TABLE pricingConfig DROP COLUMN IF EXISTS areaId`,

  // ── orders ─────────────────────────────────────────────────────────────────
  // customerId ekle (eski şemada var, yeni şemada userId idi)
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS customerId int(11) NOT NULL DEFAULT 0`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS restaurantId int(11) DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS orderType enum('restaurant','market','pharmacy','individual','express') NOT NULL DEFAULT 'individual'`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS distanceFee int(11) NOT NULL DEFAULT 0`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS pricingScenario enum('A','B','C') DEFAULT 'A'`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS commissionRate int(11) DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS acceptedAt timestamp NULL DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickedUpAt timestamp NULL DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickupPhotoUrl text DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS deliveryPhotoUrl text DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS deliveryNotes text DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS customerSignature text DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS customerRating int(11) DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS customerReview text DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS paymentType enum('sender_pays','receiver_pays') NOT NULL DEFAULT 'sender_pays'`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS collectedAmount int(11) DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS collectedAt timestamp NULL DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS collectedBy int(11) DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS deliveryTimeType enum('now','scheduled') NOT NULL DEFAULT 'now'`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduledDeliveryDate timestamp NULL DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduledTimeSlot varchar(20) DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS isArchived tinyint(1) NOT NULL DEFAULT 0`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS archivedAt timestamp NULL DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS archivedBy int(11) DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS calculatedPrice int(11) DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS offeredPrice int(11) DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS currentPrice int(11) DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS priceMultiplier int(11) DEFAULT 100`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS packageSize enum('small','medium','large') DEFAULT 'medium'`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickupPhone varchar(20) DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS deliveryPhone varchar(20) DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickupFullName varchar(255) DEFAULT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS deliveryFullName varchar(255) DEFAULT NULL`,
  // vehicleType enum güncelle
  `ALTER TABLE orders MODIFY COLUMN vehicleType enum('bicycle','motorcycle','car','any') DEFAULT 'any'`,
  // surgeMultiplier kaldır (eski şemada yok)
  `ALTER TABLE orders DROP COLUMN IF EXISTS surgeMultiplier`,
  `ALTER TABLE orders DROP COLUMN IF EXISTS userId`,
  `ALTER TABLE orders DROP COLUMN IF EXISTS businessId`,
  `ALTER TABLE orders DROP COLUMN IF EXISTS description`,
  `ALTER TABLE orders DROP COLUMN IF EXISTS weight`,
  `ALTER TABLE orders DROP COLUMN IF EXISTS basePrice`,
  `ALTER TABLE orders DROP COLUMN IF EXISTS totalPrice`,
  `ALTER TABLE orders DROP COLUMN IF EXISTS notes`,

  // ── earnings ───────────────────────────────────────────────────────────────
  `ALTER TABLE earnings ADD COLUMN IF NOT EXISTS pricingScenario enum('A','B','C') NOT NULL DEFAULT 'A'`,
  `ALTER TABLE earnings ADD COLUMN IF NOT EXISTS commissionAmount int(11) DEFAULT NULL`,

  // ── ratings ────────────────────────────────────────────────────────────────
  `ALTER TABLE ratings MODIFY COLUMN customerId int(11) NOT NULL`,
  `ALTER TABLE ratings MODIFY COLUMN courierId int(11) NOT NULL`,
];

let success = 0;
let failed = 0;
for (const sql of alterStatements) {
  try {
    await conn.execute(sql);
    success++;
  } catch (e) {
    if (e.code === 'ER_CANT_DROP_FIELD_OR_KEY' || e.message.includes('check that column/key exists')) {
      // Kolon zaten yok, sorun değil
    } else if (e.message.includes('Duplicate column name') || e.message.includes('already exists')) {
      // Kolon zaten var, sorun değil
    } else {
      console.error(`HATA [${sql.substring(0, 60)}...]: ${e.message}`);
      failed++;
    }
  }
}

console.log(`\n✅ ${success} ALTER başarılı, ❌ ${failed} hata`);
await conn.end();
