import { getDb } from './server/db.ts';
import { pages } from './drizzle/schema.ts';

const db = await getDb();
if (!db) { console.log('no db'); process.exit(1); }

const rows = await db.select({ slug: pages.slug, seoMeta: pages.seoMeta }).from(pages);
for (const row of rows) {
  try {
    const meta = JSON.parse(row.seoMeta);
    console.log(`\n=== ${row.slug} ===`);
    if (meta.en) console.log('EN:', meta.en.title);
    if (meta.mk) console.log('MK:', meta.mk.title);
    if (meta.sq) console.log('SQ:', meta.sq.title);
    if (meta.tr) console.log('TR:', meta.tr.title);
  } catch {
    console.log(`${row.slug}: parse error`);
  }
}
process.exit(0);
