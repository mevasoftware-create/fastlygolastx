import mysql from 'mysql2/promise';

const DB = process.env.DATABASE_URL;
const conn = await mysql.createConnection(DB);

const alters = [
  // coupons
  'ALTER TABLE coupons ADD COLUMN maxDiscount DECIMAL(10,2)',
  'ALTER TABLE coupons ADD COLUMN usageLimit INT',
  'ALTER TABLE coupons ADD COLUMN usageCount INT DEFAULT 0',
  'ALTER TABLE coupons ADD COLUMN perUserLimit INT',
  "ALTER TABLE coupons ADD COLUMN targetAudience ENUM('all','new_users','existing_users') DEFAULT 'all'",
  'ALTER TABLE coupons ADD COLUMN validFrom TIMESTAMP NULL',
  'ALTER TABLE coupons ADD COLUMN validUntil TIMESTAMP NULL',
  // appVersions
  'ALTER TABLE appVersions ADD COLUMN forceUpdate TINYINT DEFAULT 0',
  'ALTER TABLE appVersions ADD COLUMN buildNumber VARCHAR(20)',
  'ALTER TABLE appVersions ADD COLUMN downloadUrl VARCHAR(500)',
  'ALTER TABLE appVersions ADD COLUMN minSupportedVersion VARCHAR(20)',
  'ALTER TABLE appVersions ADD COLUMN isActive TINYINT DEFAULT 1',
  'ALTER TABLE appVersions ADD COLUMN updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  // orderTracking
  'ALTER TABLE orderTracking ADD COLUMN speed DECIMAL(5,2)',
  'ALTER TABLE orderTracking ADD COLUMN heading DECIMAL(5,2)',
  // notifications
  'ALTER TABLE notifications ADD COLUMN relatedOrderId INT',
  'ALTER TABLE notifications ADD COLUMN platform VARCHAR(50)',
  'ALTER TABLE notifications ADD COLUMN sentAt TIMESTAMP NULL',
  'ALTER TABLE notifications ADD COLUMN sentCount INT DEFAULT 0',
  'ALTER TABLE notifications ADD COLUMN failedCount INT DEFAULT 0',
  'ALTER TABLE notifications ADD COLUMN body TEXT',
  'ALTER TABLE notifications ADD COLUMN heading VARCHAR(255)',
  // referrals
  'ALTER TABLE referrals ADD COLUMN rewardedAt TIMESTAMP NULL',
  // pushNotificationTokens
  `CREATE TABLE IF NOT EXISTS pushNotificationTokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    token TEXT NOT NULL,
    platform ENUM('ios','android','web') DEFAULT 'web',
    deviceType VARCHAR(50),
    isActive TINYINT DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
];

let ok = 0, fail = 0;
for (const sql of alters) {
  try {
    await conn.execute(sql);
    ok++;
  } catch(e) {
    const msg = e.message || '';
    if (msg.includes('Duplicate column') || msg.includes('already exists')) {
      ok++;
    } else {
      console.log('FAIL:', msg.substring(0, 100));
      fail++;
    }
  }
}
console.log('Done:', ok, 'ok,', fail, 'failed');
await conn.end();
