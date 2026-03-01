import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Manus'un sağladığı veritabanı URL'si
const DB_URL = 'mysql://4EV5ivwhyC7eCUY.ebc471170149:5gcDaoKix3x19o5IWNf8@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/4KwtmFvvd67FSFhQ5dyp9H?ssl={"rejectUnauthorized":true}';

const conn = await mysql.createConnection(DB_URL);

// Mevcut tabloları al
const [tables] = await conn.execute('SHOW TABLES');
const existing = new Set(tables.map(r => Object.values(r)[0]));
console.log('Mevcut tablolar:', [...existing].join(', '));

// SQL migration dosyalarını sırala
const drizzleDir = path.join(__dirname, 'drizzle');
const sqlFiles = fs.readdirSync(drizzleDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`\n${sqlFiles.length} SQL migration dosyası bulundu\n`);

let applied = 0;
let skipped = 0;
let errors = 0;

for (const file of sqlFiles) {
  const filePath = path.join(drizzleDir, file);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // SQL'i statement'lara böl (breakpoint ile ayrılmış)
  const statements = sql
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const stmt of statements) {
    if (!stmt || stmt.startsWith('--')) continue;
    
    try {
      await conn.execute(stmt);
      applied++;
    } catch (e) {
      if (e.code === 'ER_TABLE_EXISTS_ERROR' || 
          e.code === 'ER_DUP_KEYNAME' ||
          e.code === 'ER_DUP_FIELDNAME' ||
          e.sqlMessage?.includes('already exists') ||
          e.sqlMessage?.includes('Duplicate column') ||
          e.sqlMessage?.includes('Duplicate key')) {
        skipped++;
      } else {
        console.error(`HATA (${file}): ${e.sqlMessage || e.message}`);
        console.error('SQL:', stmt.substring(0, 100));
        errors++;
      }
    }
  }
  
  process.stdout.write('.');
}

console.log(`\n\nSonuç: ${applied} uygulandı, ${skipped} atlandı, ${errors} hata`);

// Tabloları tekrar kontrol et
const [newTables] = await conn.execute('SHOW TABLES');
console.log('\nGüncel tablolar (' + newTables.length + '):');
newTables.forEach(r => console.log(' -', Object.values(r)[0]));

// Test sorguları
try {
  const [areas] = await conn.execute('SELECT COUNT(*) as cnt FROM areas');
  console.log('\nareas:', areas[0].cnt, 'kayıt');
} catch(e) { console.error('areas hatası:', e.message); }

try {
  const [cats] = await conn.execute('SELECT COUNT(*) as cnt FROM categories');
  console.log('categories:', cats[0].cnt, 'kayıt');
} catch(e) { console.error('categories hatası:', e.message); }

try {
  const [orders] = await conn.execute('SELECT COUNT(*) as cnt FROM orders');
  console.log('orders:', orders[0].cnt, 'kayıt');
} catch(e) { console.error('orders hatası:', e.message); }

await conn.end();
console.log('\nTamamlandı!');
