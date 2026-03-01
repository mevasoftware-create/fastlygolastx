import mysql from 'mysql2/promise';

const DB_URL = 'mysql://4EV5ivwhyC7eCUY.root:yAdu9BKls357j85iUbFO@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/ZkKgZDz9VnqDkYQWNb7iTG?ssl={"rejectUnauthorized":true}';

const conn = await mysql.createConnection(DB_URL);

// users tablosundaki mevcut kolonları al
const [cols] = await conn.execute('DESCRIBE users');
const existingCols = cols.map(r => r.Field);
console.log('Mevcut kolonlar:', existingCols.join(', '));

// Eksik kolonları ekle
const toAdd = [
  { name: 'password', sql: 'ADD COLUMN `password` TEXT' },
  { name: 'emailVerified', sql: 'ADD COLUMN `emailVerified` TINYINT(1) NOT NULL DEFAULT 0' },
  { name: 'emailVerificationToken', sql: 'ADD COLUMN `emailVerificationToken` VARCHAR(255)' },
  { name: 'passwordResetToken', sql: 'ADD COLUMN `passwordResetToken` VARCHAR(255)' },
  { name: 'passwordResetExpires', sql: 'ADD COLUMN `passwordResetExpires` TIMESTAMP NULL' },
  { name: 'avatarUrl', sql: 'ADD COLUMN `avatarUrl` TEXT' },
  { name: 'phone', sql: 'ADD COLUMN `phone` VARCHAR(20)' },
];

for (const col of toAdd) {
  if (existingCols.includes(col.name)) {
    console.log('Zaten var:', col.name);
  } else {
    await conn.execute('ALTER TABLE users ' + col.sql);
    console.log('Eklendi:', col.name);
  }
}

// role enum'unu güncelle - courier ve business ekle
try {
  await conn.execute("ALTER TABLE users MODIFY COLUMN `role` ENUM('user','admin','courier','business') NOT NULL DEFAULT 'user'");
  console.log('role enum güncellendi');
} catch(e) {
  console.log('role enum zaten doğru:', e.message);
}

// areas tablosunu test et
const [areaRows] = await conn.execute('SELECT COUNT(*) as cnt FROM areas WHERE active = 1');
console.log('areas aktif kayıt sayısı:', areaRows[0].cnt);

// categories tablosunu test et
const [catRows] = await conn.execute('SELECT COUNT(*) as cnt FROM categories WHERE active = 1');
console.log('categories aktif kayıt sayısı:', catRows[0].cnt);

// orders tablosunu test et
const [orderRows] = await conn.execute('SELECT COUNT(*) as cnt FROM orders');
console.log('orders toplam kayıt sayısı:', orderRows[0].cnt);

await conn.end();
console.log('\nTüm kontroller tamamlandı!');
