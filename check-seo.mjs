import { getDb } from './server/db.ts';
import { pages } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();
if (!db) { console.log('no db'); process.exit(1); }
const rows = await db.select({ slug: pages.slug, seoMeta: pages.seoMeta }).from(pages).where(eq(pages.slug, 'home'));
console.log(JSON.stringify(rows, null, 2));
process.exit(0);
