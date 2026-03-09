import jwt from 'jsonwebtoken';
import { createConnection } from 'mysql2/promise';

// Env vars are injected by the platform

const secret = process.env.JWT_SECRET;
const DB_URL = process.env.DATABASE_URL;
const FCM_ACCESS_TOKEN = process.env.FCM_ACCESS_TOKEN;
const FCM_PROJECT_ID = process.env.FCM_PROJECT_ID || 'fastlygo1';

const BASE = 'http://localhost:3000/api/trpc';

// DB connection
const url = new URL(DB_URL.replace('mysql://', 'http://'));
const conn = await createConnection({
  host: url.hostname, port: parseInt(url.port)||3306,
  user: url.username, password: url.password,
  database: url.pathname.slice(1), ssl: { rejectUnauthorized: false },
});

// Get admin user
const [users] = await conn.execute("SELECT id, email FROM users WHERE role = 'admin' LIMIT 1");
const testUser = users[0];
console.log(`\n👤 Test user: ${testUser.email} (id: ${testUser.id})`);

// Create auth token
const token = jwt.sign({ userId: testUser.id }, secret, { expiresIn: '1h' });
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'User-Agent': 'FastlyGo/1.0 Android',
};

function encodeInput(obj) {
  return encodeURIComponent(JSON.stringify({ "0": { json: obj } }));
}

// ─── TEST 1: notifications.list ──────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('TEST 1: notifications.list');
console.log('═══════════════════════════════════════');

// First insert a test notification
await conn.execute(
  "INSERT INTO notifications (userId, title, message, type, isRead) VALUES (?, 'Test Bildirimi 1', 'İlk test', 'system', 0)",
  [testUser.id]
);
await conn.execute(
  "INSERT INTO notifications (userId, title, message, type, isRead) VALUES (?, 'Test Bildirimi 2', 'İkinci test', 'order', 0)",
  [testUser.id]
);
console.log('✅ 2 test notification inserted');

const listResp = await fetch(
  `${BASE}/notifications.list?batch=1&input=${encodeInput({ limit: 10, offset: 0, unreadOnly: false })}`,
  { headers }
);
const listData = await listResp.json();
console.log(`Status: ${listResp.status}`);
if (listResp.status === 200) {
  const items = listData[0]?.result?.data?.json;
  console.log(`✅ notifications.list SUCCESS — ${Array.isArray(items) ? items.length : 'N/A'} items`);
  if (Array.isArray(items)) {
    items.slice(0, 3).forEach(n => console.log(`  - [${n.id}] ${n.title} | isRead: ${n.isRead}`));
  }
} else {
  console.log('❌ notifications.list FAILED:', JSON.stringify(listData).substring(0, 300));
}

// ─── TEST 2: notifications.unreadCount ───────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('TEST 2: notifications.unreadCount');
console.log('═══════════════════════════════════════');

const countResp = await fetch(
  `${BASE}/notifications.unreadCount?batch=1&input=${encodeInput({})}`,
  { headers }
);
const countData = await countResp.json();
console.log(`Status: ${countResp.status}`);
if (countResp.status === 200) {
  const count = countData[0]?.result?.data?.json;
  console.log(`✅ unreadCount SUCCESS — count: ${count}`);
} else {
  console.log('❌ unreadCount FAILED:', JSON.stringify(countData).substring(0, 300));
}

// ─── TEST 3: notifications.markAsRead ────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('TEST 3: notifications.markAsRead');
console.log('═══════════════════════════════════════');

// Get first notification ID
const [notifs] = await conn.execute(
  "SELECT id FROM notifications WHERE userId = ? AND title LIKE 'Test Bildirimi%' LIMIT 1",
  [testUser.id]
);
const notifId = notifs[0]?.id;
console.log(`Using notification id: ${notifId}`);

const markResp = await fetch(`${BASE}/notifications.markAsRead?batch=1`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ "0": { json: { id: notifId } } }),
});
const markData = await markResp.json();
console.log(`Status: ${markResp.status}`);
if (markResp.status === 200) {
  console.log(`✅ markAsRead SUCCESS`);
  // Verify in DB
  const [check] = await conn.execute("SELECT isRead FROM notifications WHERE id = ?", [notifId]);
  console.log(`  DB isRead: ${check[0]?.isRead} (expected: 1)`);
} else {
  console.log('❌ markAsRead FAILED:', JSON.stringify(markData).substring(0, 300));
}

// ─── TEST 4: notifications.markAllAsRead ─────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('TEST 4: notifications.markAllAsRead');
console.log('═══════════════════════════════════════');

const markAllResp = await fetch(`${BASE}/notifications.markAllAsRead?batch=1`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ "0": { json: {} } }),
});
const markAllData = await markAllResp.json();
console.log(`Status: ${markAllResp.status}`);
if (markAllResp.status === 200) {
  console.log(`✅ markAllAsRead SUCCESS`);
} else {
  console.log('❌ markAllAsRead FAILED:', JSON.stringify(markAllData).substring(0, 300));
}

// ─── TEST 5: notifications.delete ────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('TEST 5: notifications.delete');
console.log('═══════════════════════════════════════');

const deleteResp = await fetch(`${BASE}/notifications.delete?batch=1`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ "0": { json: { id: notifId } } }),
});
const deleteData = await deleteResp.json();
console.log(`Status: ${deleteResp.status}`);
if (deleteResp.status === 200) {
  console.log(`✅ delete SUCCESS`);
  const [check] = await conn.execute("SELECT id FROM notifications WHERE id = ?", [notifId]);
  console.log(`  DB rows after delete: ${check.length} (expected: 0)`);
} else {
  console.log('❌ delete FAILED:', JSON.stringify(deleteData).substring(0, 300));
}

// ─── TEST 6: pushNotifications.registerToken ─────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('TEST 6: pushNotifications.registerToken');
console.log('═══════════════════════════════════════');

const testFcmToken = `TEST_FCM_${Date.now()}`;
const regResp = await fetch(`${BASE}/pushNotifications.registerToken?batch=1`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ "0": { json: { token: testFcmToken, deviceType: 'android', deviceId: 'test-device' } } }),
});
const regData = await regResp.json();
console.log(`Status: ${regResp.status}`);
if (regResp.status === 200) {
  console.log(`✅ registerToken SUCCESS`);
  const [check] = await conn.execute("SELECT id, deviceType, isActive FROM fcmTokens WHERE token = ?", [testFcmToken]);
  console.log(`  DB record:`, check[0]);
} else {
  console.log('❌ registerToken FAILED:', JSON.stringify(regData).substring(0, 400));
}

// ─── TEST 7: FCM Send via pushNotifications.sendToAll ────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('TEST 7: pushNotifications.sendToAll');
console.log('═══════════════════════════════════════');

const sendResp = await fetch(`${BASE}/pushNotifications.sendToAll?batch=1`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ "0": { json: { title: 'Test Bildirimi', body: 'Backend testi' } } }),
});
const sendData = await sendResp.json();
console.log(`Status: ${sendResp.status}`);
if (sendResp.status === 200) {
  const result = sendData[0]?.result?.data?.json;
  console.log(`✅ sendToAll SUCCESS:`, JSON.stringify(result));
} else {
  console.log('❌ sendToAll FAILED:', JSON.stringify(sendData).substring(0, 300));
}

// ─── CLEANUP ─────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('CLEANUP');
console.log('═══════════════════════════════════════');
await conn.execute("DELETE FROM notifications WHERE userId = ? AND title LIKE 'Test Bildirimi%'", [testUser.id]);
await conn.execute("DELETE FROM fcmTokens WHERE token LIKE 'TEST_FCM_%'", []);
console.log('✅ Cleaned up test data');

await conn.end();
console.log('\n✅ All API tests completed!');
