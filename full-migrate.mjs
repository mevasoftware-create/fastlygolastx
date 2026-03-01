/**
 * TiDB Cloud → Manus veritabanı tam veri aktarımı
 * Şema artık uyumlu olduğundan doğrudan kopyalama yapılır.
 */
import mysql from 'mysql2/promise';

const TIDB_URL = 'mysql://4EV5ivwhyC7eCUY.root:yAdu9BKls357j85iUbFO@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/ZkKgZDz9VnqDkYQWNb7iTG';
const tidbUrl = new URL(TIDB_URL.split('?')[0]);
const manusUrl = new URL(process.env.DATABASE_URL.split('?')[0]);

const tidb = await mysql.createConnection({
  host: tidbUrl.hostname, port: parseInt(tidbUrl.port) || 3306,
  user: tidbUrl.username, password: tidbUrl.password,
  database: tidbUrl.pathname.slice(1), ssl: { rejectUnauthorized: false }
});

const manus = await mysql.createConnection({
  host: manusUrl.hostname, port: parseInt(manusUrl.port) || 3306,
  user: manusUrl.username, password: manusUrl.password,
  database: manusUrl.pathname.slice(1), ssl: { rejectUnauthorized: false }
});

console.log('✅ Her iki veritabanına bağlantı kuruldu\n');

// Aktarılacak tablolar ve sırası (foreign key bağımlılıklarına göre)
const tables = [
  'users',
  'areas',
  'categories',
  'businesses',
  'couriers',
  'pricingConfig',
  'surgeConfig',
  'orders',
  'earnings',
  'ratings',
  'pages',
  'paymentRequests',
  'priceIncreaseHistory',
  'push_notifications',
  'push_tokens',
  'errorLogs',
  'favoriteAddresses',
  'redirects',
  'siteSettings',
  'restaurantTransactions',
  'priceOffers',
  'orderTracking',
  'courierLocations',
  'notifications',
  'fcmTokens',
  'coupons',
  'couponUsage',
  'referrals',
  'userWallets',
  'walletTransactions',
  'appVersions',
  'supportTickets',
  'supportTicketMessages',
];

const summary = [];

for (const table of tables) {
  try {
    // Önce Manus'taki tabloyu temizle
    await manus.execute(`DELETE FROM \`${table}\``);
    
    // TiDB'den veri çek
    let rows;
    try {
      [rows] = await tidb.query(`SELECT * FROM \`${table}\``);
    } catch (e) {
      summary.push({ table, status: 'TIDB_MISSING', count: 0, note: e.message.substring(0, 60) });
      console.log(`  ⚠️  ${table}: TiDB'de tablo yok, atlandı`);
      continue;
    }

    if (rows.length === 0) {
      summary.push({ table, status: 'EMPTY', count: 0 });
      console.log(`  ℹ️  ${table}: Boş tablo, atlandı`);
      continue;
    }

    // Manus tablosundaki kolonları al
    const [manusColsRaw] = await manus.query(`SHOW COLUMNS FROM \`${table}\``);
    const manusCols = new Set(manusColsRaw.map(c => c.Field));

    // Her satırı sadece Manus'ta var olan kolonlarla filtrele
    const filteredRows = rows.map(row => {
      const filtered = {};
      for (const [key, val] of Object.entries(row)) {
        if (manusCols.has(key)) {
          filtered[key] = val;
        }
      }
      return filtered;
    });

    if (filteredRows.length === 0 || Object.keys(filteredRows[0]).length === 0) {
      summary.push({ table, status: 'NO_MATCHING_COLS', count: 0 });
      continue;
    }

    // Batch insert (500'er kayıt)
    const cols = Object.keys(filteredRows[0]);
    const placeholders = cols.map(() => '?').join(', ');
    const insertSql = `INSERT IGNORE INTO \`${table}\` (\`${cols.join('`, `')}\`) VALUES (${placeholders})`;

    let inserted = 0;
    const batchSize = 500;
    for (let i = 0; i < filteredRows.length; i += batchSize) {
      const batch = filteredRows.slice(i, i + batchSize);
      for (const row of batch) {
        try {
          await manus.execute(insertSql, Object.values(row));
          inserted++;
        } catch (e) {
          // Duplicate key veya constraint hatası - atla
          if (!e.message.includes('Duplicate entry') && !e.message.includes('ER_DUP_ENTRY')) {
            console.error(`    ⚠️  ${table} satır hatası: ${e.message.substring(0, 80)}`);
          }
        }
      }
    }

    summary.push({ table, status: 'OK', count: inserted });
    console.log(`  ✅ ${table}: ${inserted}/${rows.length} kayıt aktarıldı`);

  } catch (e) {
    summary.push({ table, status: 'ERROR', count: 0, note: e.message.substring(0, 80) });
    console.error(`  ❌ ${table}: ${e.message.substring(0, 80)}`);
  }
}

console.log('\n============================================================');
console.log('📋 AKTARIM ÖZETİ');
console.log('============================================================');
let total = 0;
for (const s of summary) {
  const icon = s.status === 'OK' ? '✅' : s.status === 'EMPTY' ? 'ℹ️ ' : '⚠️ ';
  console.log(`  ${icon} ${s.table}: ${s.count} kayıt ${s.note ? '(' + s.note + ')' : ''}`);
  total += s.count;
}
console.log(`\n🎉 Toplam aktarılan: ${total} kayıt`);

await tidb.end();
await manus.end();
