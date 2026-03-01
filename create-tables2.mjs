import mysql from 'mysql2/promise';

const DB_URL = 'mysql://4EV5ivwhyC7eCUY.ebc471170149:5gcDaoKix3x19o5IWNf8@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/4KwtmFvvd67FSFhQ5dyp9H?ssl={"rejectUnauthorized":true}';
const conn = await mysql.createConnection(DB_URL);

const tables = [
  // users tablosunu güncelle
  [`ALTER TABLE users MODIFY COLUMN role enum('user','admin','courier','business') NOT NULL DEFAULT 'user'`],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS password text`],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar(20)`],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatarUrl text`],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerified tinyint(1) NOT NULL DEFAULT 0`],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerificationToken varchar(255)`],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS passwordResetToken varchar(255)`],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS passwordResetExpires timestamp NULL`],

  // businesses
  [`CREATE TABLE IF NOT EXISTS businesses (
    id int AUTO_INCREMENT NOT NULL,
    userId int NOT NULL UNIQUE,
    businessName varchar(255) NOT NULL,
    businessAddress text,
    businessPhone varchar(20),
    businessEmail varchar(320),
    taxNumber varchar(50),
    isApproved tinyint(1) NOT NULL DEFAULT 0,
    isActive tinyint(1) NOT NULL DEFAULT 1,
    rating decimal(3,2) NOT NULL DEFAULT 5.00,
    totalOrders int NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT (now()),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT businesses_id PRIMARY KEY(id)
  )`],

  // categories
  [`CREATE TABLE IF NOT EXISTS categories (
    id int AUTO_INCREMENT NOT NULL,
    slug varchar(100) NOT NULL UNIQUE,
    icon varchar(100),
    shortName json,
    seoMeta json,
    active tinyint(1) NOT NULL DEFAULT 1,
    displayOrder int NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT (now()),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT categories_id PRIMARY KEY(id)
  )`],

  // areas
  [`CREATE TABLE IF NOT EXISTS areas (
    id int AUTO_INCREMENT NOT NULL,
    slug varchar(100) NOT NULL UNIQUE,
    seoMeta json,
    active tinyint(1) NOT NULL DEFAULT 1,
    displayOrder int NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT (now()),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT areas_id PRIMARY KEY(id)
  )`],

  // orders
  [`CREATE TABLE IF NOT EXISTS orders (
    id int AUTO_INCREMENT NOT NULL,
    orderNumber varchar(50) NOT NULL UNIQUE,
    userId int,
    businessId int,
    courierId int,
    status enum('pending','confirmed','assigned','picked_up','in_transit','delivered','cancelled','failed') NOT NULL DEFAULT 'pending',
    pickupAddress text NOT NULL,
    pickupLat decimal(10,8),
    pickupLng decimal(11,8),
    deliveryAddress text NOT NULL,
    deliveryLat decimal(10,8),
    deliveryLng decimal(11,8),
    categoryId int,
    areaId int,
    description text,
    weight decimal(8,2),
    distance decimal(8,2),
    basePrice decimal(10,2) NOT NULL DEFAULT 0.00,
    surgeMultiplier decimal(4,2) NOT NULL DEFAULT 1.00,
    totalPrice decimal(10,2) NOT NULL DEFAULT 0.00,
    paymentMethod enum('cash','card','wallet') NOT NULL DEFAULT 'cash',
    paymentStatus enum('pending','paid','refunded') NOT NULL DEFAULT 'pending',
    notes text,
    estimatedDeliveryTime timestamp NULL,
    actualDeliveryTime timestamp NULL,
    cancelReason text,
    createdAt timestamp NOT NULL DEFAULT (now()),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT orders_id PRIMARY KEY(id)
  )`],

  // pricingConfig
  [`CREATE TABLE IF NOT EXISTS pricingConfig (
    id int AUTO_INCREMENT NOT NULL,
    categoryId int,
    areaId int,
    basePrice decimal(10,2) NOT NULL DEFAULT 10.00,
    pricePerKm decimal(10,2) NOT NULL DEFAULT 2.00,
    minPrice decimal(10,2) NOT NULL DEFAULT 5.00,
    maxPrice decimal(10,2),
    isActive tinyint(1) NOT NULL DEFAULT 1,
    createdAt timestamp NOT NULL DEFAULT (now()),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pricingConfig_id PRIMARY KEY(id)
  )`],

  // surgeConfig
  [`CREATE TABLE IF NOT EXISTS surgeConfig (
    id int AUTO_INCREMENT NOT NULL,
    multiplier decimal(4,2) NOT NULL DEFAULT 1.00,
    isActive tinyint(1) NOT NULL DEFAULT 0,
    reason varchar(255),
    startTime timestamp NULL,
    endTime timestamp NULL,
    createdAt timestamp NOT NULL DEFAULT (now()),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT surgeConfig_id PRIMARY KEY(id)
  )`],

  // notifications
  [`CREATE TABLE IF NOT EXISTS notifications (
    id int AUTO_INCREMENT NOT NULL,
    userId int NOT NULL,
    title varchar(255) NOT NULL,
    message text NOT NULL,
    type varchar(50) NOT NULL DEFAULT 'info',
    isRead tinyint(1) NOT NULL DEFAULT 0,
    data json,
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT notifications_id PRIMARY KEY(id)
  )`],

  // earnings
  [`CREATE TABLE IF NOT EXISTS earnings (
    id int AUTO_INCREMENT NOT NULL,
    courierId int NOT NULL,
    orderId int,
    amount decimal(10,2) NOT NULL DEFAULT 0.00,
    type enum('delivery','bonus','penalty') NOT NULL DEFAULT 'delivery',
    description text,
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT earnings_id PRIMARY KEY(id)
  )`],

  // paymentRequests
  [`CREATE TABLE IF NOT EXISTS paymentRequests (
    id int AUTO_INCREMENT NOT NULL,
    courierId int NOT NULL,
    amount decimal(10,2) NOT NULL,
    status enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    requestedAt timestamp NOT NULL DEFAULT (now()),
    processedAt timestamp NULL,
    notes text,
    CONSTRAINT paymentRequests_id PRIMARY KEY(id)
  )`],

  // restaurantTransactions
  [`CREATE TABLE IF NOT EXISTS restaurantTransactions (
    id int AUTO_INCREMENT NOT NULL,
    businessId int NOT NULL,
    orderId int,
    amount decimal(10,2) NOT NULL,
    type enum('charge','refund','adjustment') NOT NULL DEFAULT 'charge',
    description text,
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT restaurantTransactions_id PRIMARY KEY(id)
  )`],

  // favoriteAddresses
  [`CREATE TABLE IF NOT EXISTS favoriteAddresses (
    id int AUTO_INCREMENT NOT NULL,
    userId int NOT NULL,
    label varchar(100) NOT NULL,
    address text NOT NULL,
    lat decimal(10,8),
    lng decimal(11,8),
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT favoriteAddresses_id PRIMARY KEY(id)
  )`],

  // ratings
  [`CREATE TABLE IF NOT EXISTS ratings (
    id int AUTO_INCREMENT NOT NULL,
    orderId int NOT NULL,
    fromUserId int NOT NULL,
    toUserId int,
    toCourierId int,
    toBusinessId int,
    rating int NOT NULL DEFAULT 5,
    comment text,
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT ratings_id PRIMARY KEY(id)
  )`],

  // priceOffers
  [`CREATE TABLE IF NOT EXISTS priceOffers (
    id int AUTO_INCREMENT NOT NULL,
    orderId int NOT NULL,
    courierId int NOT NULL,
    offeredPrice decimal(10,2) NOT NULL,
    status enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT priceOffers_id PRIMARY KEY(id)
  )`],

  // orderTracking
  [`CREATE TABLE IF NOT EXISTS orderTracking (
    id int AUTO_INCREMENT NOT NULL,
    orderId int NOT NULL,
    status varchar(100) NOT NULL,
    message text,
    lat decimal(10,8),
    lng decimal(11,8),
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT orderTracking_id PRIMARY KEY(id)
  )`],

  // courierLocations
  [`CREATE TABLE IF NOT EXISTS courierLocations (
    id int AUTO_INCREMENT NOT NULL,
    courierId int NOT NULL,
    lat decimal(10,8) NOT NULL,
    lng decimal(11,8) NOT NULL,
    heading decimal(5,2),
    speed decimal(8,2),
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT courierLocations_id PRIMARY KEY(id)
  )`],

  // siteSettings
  [`CREATE TABLE IF NOT EXISTS siteSettings (
    id int AUTO_INCREMENT NOT NULL,
    \`key\` varchar(100) NOT NULL UNIQUE,
    value json,
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT siteSettings_id PRIMARY KEY(id)
  )`],

  // priceIncreaseHistory
  [`CREATE TABLE IF NOT EXISTS priceIncreaseHistory (
    id int AUTO_INCREMENT NOT NULL,
    orderId int,
    oldPrice decimal(10,2) NOT NULL,
    newPrice decimal(10,2) NOT NULL,
    reason varchar(255),
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT priceIncreaseHistory_id PRIMARY KEY(id)
  )`],

  // coupons
  [`CREATE TABLE IF NOT EXISTS coupons (
    id int AUTO_INCREMENT NOT NULL,
    code varchar(50) NOT NULL UNIQUE,
    discountType enum('percentage','fixed') NOT NULL DEFAULT 'fixed',
    discountValue decimal(10,2) NOT NULL,
    minOrderAmount decimal(10,2),
    maxUses int,
    usedCount int NOT NULL DEFAULT 0,
    isActive tinyint(1) NOT NULL DEFAULT 1,
    expiresAt timestamp NULL,
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT coupons_id PRIMARY KEY(id)
  )`],

  // couponUsage
  [`CREATE TABLE IF NOT EXISTS couponUsage (
    id int AUTO_INCREMENT NOT NULL,
    couponId int NOT NULL,
    userId int NOT NULL,
    orderId int,
    usedAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT couponUsage_id PRIMARY KEY(id)
  )`],

  // referrals
  [`CREATE TABLE IF NOT EXISTS referrals (
    id int AUTO_INCREMENT NOT NULL,
    referrerId int NOT NULL,
    referredId int NOT NULL,
    reward decimal(10,2) NOT NULL DEFAULT 0.00,
    isPaid tinyint(1) NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT referrals_id PRIMARY KEY(id)
  )`],

  // fcmTokens
  [`CREATE TABLE IF NOT EXISTS fcmTokens (
    id int AUTO_INCREMENT NOT NULL,
    userId int NOT NULL,
    token text NOT NULL,
    platform varchar(20),
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT fcmTokens_id PRIMARY KEY(id)
  )`],

  // appVersions
  [`CREATE TABLE IF NOT EXISTS appVersions (
    id int AUTO_INCREMENT NOT NULL,
    platform varchar(20) NOT NULL,
    version varchar(20) NOT NULL,
    forceUpdate tinyint(1) NOT NULL DEFAULT 0,
    releaseNotes text,
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT appVersions_id PRIMARY KEY(id)
  )`],

  // supportTickets
  [`CREATE TABLE IF NOT EXISTS supportTickets (
    id int AUTO_INCREMENT NOT NULL,
    userId int NOT NULL,
    orderId int,
    subject varchar(255) NOT NULL,
    status enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
    priority enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
    createdAt timestamp NOT NULL DEFAULT (now()),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT supportTickets_id PRIMARY KEY(id)
  )`],

  // supportTicketMessages
  [`CREATE TABLE IF NOT EXISTS supportTicketMessages (
    id int AUTO_INCREMENT NOT NULL,
    ticketId int NOT NULL,
    userId int NOT NULL,
    message text NOT NULL,
    isStaff tinyint(1) NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT supportTicketMessages_id PRIMARY KEY(id)
  )`],

  // userWallets
  [`CREATE TABLE IF NOT EXISTS userWallets (
    id int AUTO_INCREMENT NOT NULL,
    userId int NOT NULL UNIQUE,
    balance decimal(10,2) NOT NULL DEFAULT 0.00,
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT userWallets_id PRIMARY KEY(id)
  )`],

  // walletTransactions
  [`CREATE TABLE IF NOT EXISTS walletTransactions (
    id int AUTO_INCREMENT NOT NULL,
    walletId int NOT NULL,
    amount decimal(10,2) NOT NULL,
    type enum('credit','debit') NOT NULL,
    description text,
    orderId int,
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT walletTransactions_id PRIMARY KEY(id)
  )`],

  // errorLogs
  [`CREATE TABLE IF NOT EXISTS errorLogs (
    id int AUTO_INCREMENT NOT NULL,
    level varchar(20) NOT NULL DEFAULT 'error',
    message text NOT NULL,
    stack text,
    context json,
    userId int,
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT errorLogs_id PRIMARY KEY(id)
  )`],

  // redirects
  [`CREATE TABLE IF NOT EXISTS redirects (
    id int AUTO_INCREMENT NOT NULL,
    fromPath varchar(500) NOT NULL UNIQUE,
    toPath varchar(500) NOT NULL,
    statusCode int NOT NULL DEFAULT 301,
    isActive tinyint(1) NOT NULL DEFAULT 1,
    createdAt timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT redirects_id PRIMARY KEY(id)
  )`],
];

let ok = 0, skip = 0, err = 0;
for (const [sql] of tables) {
  try {
    await conn.execute(sql);
    ok++;
    process.stdout.write('.');
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME' || e.sqlMessage?.includes('Duplicate column') || e.sqlMessage?.includes('already exists')) {
      skip++;
      process.stdout.write('s');
    } else {
      console.error(`\nHATA: ${e.sqlMessage || e.message}`);
      err++;
    }
  }
}

console.log(`\n\nSonuç: ${ok} başarılı, ${skip} atlandı, ${err} hata`);

const [tables2] = await conn.execute('SHOW TABLES');
console.log('\nGüncel tablolar (' + tables2.length + '):');
tables2.forEach(r => console.log(' -', Object.values(r)[0]));

for (const tbl of ['areas', 'categories', 'orders', 'couriers', 'businesses']) {
  try {
    const [rows] = await conn.execute(`SELECT COUNT(*) as cnt FROM ${tbl}`);
    console.log(`${tbl}: ${rows[0].cnt} kayıt`);
  } catch(e) { console.error(`${tbl} hatası:`, e.message); }
}

await conn.end();
console.log('\nTamamlandı!');
