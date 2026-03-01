/**
 * TiDB Cloud → Manus Veritabanı Veri Aktarım Scripti
 * Her tablodan veri çekip Manus'un veritabanına aktarır.
 */

import mysql from 'mysql2/promise';

const SOURCE_URL = 'mysql://4EV5ivwhyC7eCUY.root:yAdu9BKls357j85iUbFO@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/ZkKgZDz9VnqDkYQWNb7iTG?ssl={"rejectUnauthorized":true}';
const TARGET_URL = process.env.DATABASE_URL;

if (!TARGET_URL) {
  console.error('DATABASE_URL bulunamadı!');
  process.exit(1);
}

// SSL ayarları
const sslConfig = { rejectUnauthorized: false };

async function createConnection(url) {
  // URL'den bağlantı bilgilerini parse et
  const urlObj = new URL(url.split('?')[0]);
  const config = {
    host: urlObj.hostname,
    port: parseInt(urlObj.port) || 3306,
    user: urlObj.username,
    password: urlObj.password,
    database: urlObj.pathname.slice(1),
    ssl: sslConfig,
    multipleStatements: true,
    connectTimeout: 30000,
  };
  return mysql.createConnection(config);
}

// Aktarılacak tablolar (bağımlılık sırasına göre)
const TABLES = [
  'users',
  'areas',
  'categories',
  'businesses',
  'couriers',
  'pricingConfig',
  'surgeConfig',
  'siteSettings',
  'coupons',
  'orders',
  'orderTracking',
  'courierLocations',
  'earnings',
  'ratings',
  'notifications',
  'fcmTokens',
  'paymentRequests',
  'priceOffers',
  'priceIncreaseHistory',
  'referrals',
  'userWallets',
  'walletTransactions',
  'restaurantTransactions',
  'favoriteAddresses',
  'supportTickets',
  'supportTicketMessages',
  'errorLogs',
  'redirects',
  'appVersions',
  'couponUsage',
];

async function migrateTable(sourceConn, targetConn, tableName) {
  try {
    // Kaynak tablodan veri çek
    const [rows] = await sourceConn.query(`SELECT * FROM \`${tableName}\``);
    
    if (rows.length === 0) {
      console.log(`  ⏭  ${tableName}: boş, atlanıyor`);
      return { table: tableName, count: 0, status: 'skipped' };
    }

    console.log(`  📦 ${tableName}: ${rows.length} kayıt aktarılıyor...`);

    // Hedef tablodaki mevcut verileri temizle
    await targetConn.query(`DELETE FROM \`${tableName}\``);

    // AUTO_INCREMENT'i geçici olarak devre dışı bırak
    await targetConn.query(`SET FOREIGN_KEY_CHECKS=0`);

    // Batch insert (500'er kayıt)
    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      if (batch.length === 0) continue;

      // Kolon isimlerini al
      const columns = Object.keys(batch[0]).map(c => `\`${c}\``).join(', ');
      
      // Değerleri hazırla
      const placeholders = batch.map(row => 
        `(${Object.values(row).map(() => '?').join(', ')})`
      ).join(', ');
      
      const values = batch.flatMap(row => Object.values(row).map(v => {
        if (v instanceof Date) return v;
        if (v === null || v === undefined) return null;
        if (typeof v === 'object') return JSON.stringify(v);
        return v;
      }));

      await targetConn.query(
        `INSERT INTO \`${tableName}\` (${columns}) VALUES ${placeholders}`,
        values
      );
      
      inserted += batch.length;
    }

    await targetConn.query(`SET FOREIGN_KEY_CHECKS=1`);

    console.log(`  ✅ ${tableName}: ${inserted} kayıt aktarıldı`);
    return { table: tableName, count: inserted, status: 'success' };

  } catch (error) {
    console.error(`  ❌ ${tableName} HATA: ${error.message}`);
    return { table: tableName, count: 0, status: 'error', error: error.message };
  }
}

async function main() {
  console.log('🚀 Veri aktarımı başlıyor...\n');
  
  let sourceConn, targetConn;
  
  try {
    console.log('📡 Kaynak veritabanına bağlanıyor (TiDB Cloud)...');
    sourceConn = await createConnection(SOURCE_URL);
    console.log('✅ Kaynak bağlantısı kuruldu\n');

    console.log('📡 Hedef veritabanına bağlanıyor (Manus)...');
    targetConn = await createConnection(TARGET_URL);
    console.log('✅ Hedef bağlantısı kuruldu\n');

    // Kaynak tablolardaki kayıt sayılarını kontrol et
    console.log('📊 Kaynak veritabanı istatistikleri:');
    const [sourceTables] = await sourceConn.query('SHOW TABLES');
    const sourceTableNames = sourceTables.map(r => Object.values(r)[0]);
    
    for (const table of sourceTableNames) {
      const [count] = await sourceConn.query(`SELECT COUNT(*) as cnt FROM \`${table}\``);
      if (count[0].cnt > 0) {
        console.log(`  ${table}: ${count[0].cnt} kayıt`);
      }
    }
    console.log('');

    // Tabloları sırayla aktar
    console.log('🔄 Aktarım başlıyor...');
    const results = [];
    
    for (const table of TABLES) {
      // Tablonun kaynak veritabanında var olup olmadığını kontrol et
      if (!sourceTableNames.includes(table)) {
        console.log(`  ⚠️  ${table}: kaynak veritabanında yok, atlanıyor`);
        continue;
      }
      
      const result = await migrateTable(sourceConn, targetConn, table);
      results.push(result);
    }

    // Özet
    console.log('\n📋 AKTARIM ÖZETİ:');
    console.log('='.repeat(50));
    let totalMigrated = 0;
    let errorCount = 0;
    
    for (const r of results) {
      if (r.status === 'success') {
        console.log(`✅ ${r.table}: ${r.count} kayıt`);
        totalMigrated += r.count;
      } else if (r.status === 'error') {
        console.log(`❌ ${r.table}: HATA - ${r.error}`);
        errorCount++;
      }
    }
    
    console.log('='.repeat(50));
    console.log(`\n🎉 Toplam aktarılan: ${totalMigrated} kayıt`);
    if (errorCount > 0) {
      console.log(`⚠️  Hatalı tablo sayısı: ${errorCount}`);
    }

  } catch (error) {
    console.error('💥 Kritik hata:', error.message);
    process.exit(1);
  } finally {
    if (sourceConn) await sourceConn.end();
    if (targetConn) await targetConn.end();
  }
}

main();
