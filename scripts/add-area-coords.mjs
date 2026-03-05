import mysql2 from 'mysql2/promise';

const conn = await mysql2.createConnection(process.env.DATABASE_URL);

// Add lat/lng columns if they don't exist
try {
  await conn.execute('ALTER TABLE areas ADD COLUMN lat DOUBLE NULL');
  console.log('Added lat column');
} catch (e) { console.log('lat already exists'); }

try {
  await conn.execute('ALTER TABLE areas ADD COLUMN lng DOUBLE NULL');
  console.log('Added lng column');
} catch (e) { console.log('lng already exists'); }

// Coordinates for each area (center points)
const coords = {
  'aerodrom':      { lat: 41.9836, lng: 21.4914 },
  'centar':        { lat: 41.9981, lng: 21.4254 },
  'karpos':        { lat: 42.0069, lng: 21.3883 },
  'kisela-voda':   { lat: 41.9681, lng: 21.4667 },
  'cair':          { lat: 42.0097, lng: 21.4436 },
  'gazi-baba':     { lat: 41.9997, lng: 21.5078 },
  'saraj':         { lat: 42.0083, lng: 21.3256 },
  'butel':         { lat: 42.0353, lng: 21.4353 },
  'skopje':        { lat: 41.9981, lng: 21.4254 },
  'gjorce-petrov': { lat: 41.9958, lng: 21.3644 },
  'suto-orizari':  { lat: 42.0478, lng: 21.4231 },
  'tetovo':        { lat: 42.0103, lng: 20.9714 },
  'bitola':        { lat: 41.0297, lng: 21.3294 },
  'kumanovo':      { lat: 42.1322, lng: 21.7144 },
  'istip':         { lat: 41.7453, lng: 22.1958 },
  'veles':         { lat: 41.7153, lng: 21.7753 },
  'prilep':        { lat: 41.3453, lng: 21.5553 },
  'kocani':        { lat: 41.9153, lng: 22.4153 },
  'strumica':      { lat: 41.4353, lng: 22.6453 },
  'gostivar':      { lat: 41.7953, lng: 20.9053 },
  'ohrid':         { lat: 41.1153, lng: 20.8053 },
};

for (const [slug, { lat, lng }] of Object.entries(coords)) {
  const [result] = await conn.execute(
    'UPDATE areas SET lat = ?, lng = ? WHERE slug = ?',
    [lat, lng, slug]
  );
  console.log(`Updated ${slug}: lat=${lat}, lng=${lng} (affected: ${result.affectedRows})`);
}

await conn.end();
console.log('Done!');
