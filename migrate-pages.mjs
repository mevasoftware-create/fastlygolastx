import mysql from 'mysql2/promise';

const TIDB = 'mysql://4EV5ivwhyC7eCUY.root:yAdu9BKls357j85iUbFO@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/ZkKgZDz9VnqDkYQWNb7iTG';
const tidbUrl = new URL(TIDB.split('?')[0]);
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

// TiDB'deki pages tablosunun yapısını kontrol et
const [tidbCols] = await tidb.query('SHOW COLUMNS FROM pages');
console.log('TiDB pages kolonları:', tidbCols.map(c => c.Field).join(', '));

// TiDB'den pages verilerini çek
const [rows] = await tidb.query('SELECT * FROM pages');
console.log('TiDB pages kayıt sayısı:', rows.length);

if (rows.length === 0) {
  console.log('pages tablosu boş');
  await tidb.end(); await manus.end();
  process.exit(0);
}

// Manus'taki pages tablosunun kolonlarını al
const [manusCols] = await manus.query('SHOW COLUMNS FROM pages');
const manusColSet = new Set(manusCols.map(c => c.Field));
console.log('Manus pages kolonları:', [...manusColSet].join(', '));

// Eksik kolonları Manus'a ekle
for (const col of tidbCols) {
  if (!manusColSet.has(col.Field) && col.Field !== 'id') {
    let colDef = `\`${col.Field}\` ${col.Type}`;
    if (col.Null === 'NO') colDef += ' NOT NULL';
    if (col.Default !== null) {
      const def = typeof col.Default === 'string' ? `'${col.Default}'` : col.Default;
      colDef += ` DEFAULT ${def}`;
    }
    try {
      await manus.execute(`ALTER TABLE pages ADD COLUMN IF NOT EXISTS ${colDef}`);
      console.log('Kolon eklendi:', col.Field);
    } catch (e) {
      console.log('Kolon eklenemedi:', col.Field, e.message.substring(0, 60));
    }
  }
}

// Mevcut verileri temizle
await manus.execute('DELETE FROM pages');

// Güncel Manus kolonlarını al
const [freshCols] = await manus.query('SHOW COLUMNS FROM pages');
const freshColSet = new Set(freshCols.map(c => c.Field));

// Verileri aktar
let inserted = 0;
for (const row of rows) {
  const filtered = {};
  for (const [k, v] of Object.entries(row)) {
    if (freshColSet.has(k)) filtered[k] = v;
  }
  const cols = Object.keys(filtered);
  const vals = Object.values(filtered);
  const colList = cols.map(c => `\`${c}\``).join(', ');
  const placeholders = cols.map(() => '?').join(', ');
  const sql = `INSERT IGNORE INTO pages (${colList}) VALUES (${placeholders})`;
  try {
    await manus.execute(sql, vals);
    inserted++;
  } catch (e) {
    console.error('Satır hatası:', e.message.substring(0, 80));
  }
}

console.log(`\n✅ pages: ${inserted}/${rows.length} kayıt aktarıldı`);

// siteSettings tablosunu da aktar
console.log('\n--- siteSettings aktarılıyor ---');
try {
  const [ssRows] = await tidb.query('SELECT * FROM siteSettings');
  if (ssRows.length > 0) {
    const [ssCols] = await manus.query('SHOW COLUMNS FROM siteSettings');
    const ssColSet = new Set(ssCols.map(c => c.Field));
    await manus.execute('DELETE FROM siteSettings');
    let ssInserted = 0;
    for (const row of ssRows) {
      const filtered = {};
      for (const [k, v] of Object.entries(row)) {
        if (ssColSet.has(k)) filtered[k] = v;
      }
      const cols = Object.keys(filtered);
      const vals = Object.values(filtered);
      const colList = cols.map(c => `\`${c}\``).join(', ');
      const placeholders = cols.map(() => '?').join(', ');
      await manus.execute(`INSERT IGNORE INTO siteSettings (${colList}) VALUES (${placeholders})`, vals);
      ssInserted++;
    }
    console.log(`✅ siteSettings: ${ssInserted}/${ssRows.length} kayıt aktarıldı`);
  } else {
    console.log('siteSettings boş');
  }
} catch (e) {
  console.log('siteSettings hatası:', e.message.substring(0, 80));
}

await tidb.end();
await manus.end();
