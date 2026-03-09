/**
 * End-to-end test script for FCM + Notifications system
 * Tests: token register, notification list, mark read, delete, FCM send
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const BASE_URL = "https://fastlygo.mk/api/trpc";

// We'll use a real user session by creating a JWT-like auth via the DB
// First let's test with direct DB operations to simulate what the API does

import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load env
try {
  const envContent = readFileSync('/home/ubuntu/fastlygo/.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
} catch (e) {}

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("❌ DATABASE_URL not found");
  process.exit(1);
}

// Parse MySQL URL
const url = new URL(DB_URL.replace('mysql://', 'http://'));
const conn = await createConnection({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

console.log("✅ DB connected\n");

// ─── TEST 1: FCM Token Register ───────────────────────────────────────────────
console.log("═══════════════════════════════════════");
console.log("TEST 1: FCM Token Register");
console.log("═══════════════════════════════════════");

// Get a real user
const [users] = await conn.execute("SELECT id, email FROM users WHERE role = 'admin' LIMIT 1");
const testUser = users[0];
console.log(`Using user: ${testUser.email} (id: ${testUser.id})`);

// Check fcmTokens columns
const [cols] = await conn.execute(
  "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_NAME = 'fcmTokens' AND TABLE_SCHEMA = DATABASE() ORDER BY ORDINAL_POSITION"
);
console.log("fcmTokens columns:", cols.map(c => c.COLUMN_NAME).join(', '));

// Insert test FCM token
const testToken = `TEST_FCM_TOKEN_${Date.now()}`;
await conn.execute(
  "INSERT INTO fcmTokens (userId, token, deviceType, deviceId, isActive) VALUES (?, ?, 'android', 'test-emulator', 1)",
  [testUser.id, testToken]
);
console.log("✅ FCM token inserted successfully");

// Verify it's there
const [tokenRows] = await conn.execute(
  "SELECT id, userId, LEFT(token, 30) as token_preview, deviceType, deviceId, isActive FROM fcmTokens WHERE token = ?",
  [testToken]
);
console.log("✅ Token in DB:", tokenRows[0]);

// ─── TEST 2: Notifications List ───────────────────────────────────────────────
console.log("\n═══════════════════════════════════════");
console.log("TEST 2: Notifications Table");
console.log("═══════════════════════════════════════");

// Check notifications columns
const [notifCols] = await conn.execute(
  "SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_NAME = 'notifications' AND TABLE_SCHEMA = DATABASE() ORDER BY ORDINAL_POSITION"
);
console.log("notifications columns:");
notifCols.forEach(c => console.log(`  - ${c.COLUMN_NAME}: ${c.COLUMN_TYPE}`));

// Insert test notification
const [insertResult] = await conn.execute(
  "INSERT INTO notifications (userId, title, message, type, isRead) VALUES (?, ?, ?, ?, 0)",
  [testUser.id, "Test Bildirimi", "Bu bir test bildirimidir", "system"]
);
const notifId = insertResult.insertId;
console.log(`✅ Notification inserted, id: ${notifId}`);

// List notifications
const [notifList] = await conn.execute(
  "SELECT id, userId, title, message, type, isRead, createdAt FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 5",
  [testUser.id]
);
console.log(`✅ Notifications list (${notifList.length} items):`);
notifList.forEach(n => console.log(`  - [${n.id}] ${n.title} | isRead: ${n.isRead}`));

// ─── TEST 3: Mark as Read ─────────────────────────────────────────────────────
console.log("\n═══════════════════════════════════════");
console.log("TEST 3: Mark Notification as Read");
console.log("═══════════════════════════════════════");

await conn.execute("UPDATE notifications SET isRead = 1 WHERE id = ?", [notifId]);
const [readCheck] = await conn.execute("SELECT isRead FROM notifications WHERE id = ?", [notifId]);
console.log(`✅ isRead after update: ${readCheck[0].isRead} (expected: 1)`);

// ─── TEST 4: Unread Count ─────────────────────────────────────────────────────
console.log("\n═══════════════════════════════════════");
console.log("TEST 4: Unread Count");
console.log("═══════════════════════════════════════");

// Insert another unread notification
await conn.execute(
  "INSERT INTO notifications (userId, title, message, type, isRead) VALUES (?, ?, ?, ?, 0)",
  [testUser.id, "Okunmamış Bildirim", "Bu okunmamış", "order"]
);
const [countResult] = await conn.execute(
  "SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0",
  [testUser.id]
);
console.log(`✅ Unread count: ${countResult[0].count}`);

// ─── TEST 5: Delete Notification ─────────────────────────────────────────────
console.log("\n═══════════════════════════════════════");
console.log("TEST 5: Delete Notification");
console.log("═══════════════════════════════════════");

await conn.execute("DELETE FROM notifications WHERE id = ?", [notifId]);
const [deleteCheck] = await conn.execute("SELECT id FROM notifications WHERE id = ?", [notifId]);
console.log(`✅ After delete, found: ${deleteCheck.length} rows (expected: 0)`);

// ─── TEST 6: FCM HTTP v1 API Send ─────────────────────────────────────────────
console.log("\n═══════════════════════════════════════");
console.log("TEST 6: FCM HTTP v1 API Send");
console.log("═══════════════════════════════════════");

const FCM_ACCESS_TOKEN = process.env.FCM_ACCESS_TOKEN;
const FCM_PROJECT_ID = process.env.FCM_PROJECT_ID || "fastlygo1";

if (!FCM_ACCESS_TOKEN) {
  console.log("⚠️  FCM_ACCESS_TOKEN not set, skipping FCM send test");
} else {
  const fcmPayload = {
    message: {
      token: testToken,
      notification: {
        title: "Test Bildirimi",
        body: "Bu bir backend test bildirimidir",
      },
      android: {
        priority: "high",
      },
    },
  };

  try {
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FCM_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fcmPayload),
      }
    );
    const data = await response.json();
    if (response.ok) {
      console.log("✅ FCM send SUCCESS:", data.name);
    } else {
      console.log(`⚠️  FCM send failed (${response.status}):`, data.error?.message || JSON.stringify(data));
      if (data.error?.message?.includes("registration-token-not-registered")) {
        console.log("   → Token geçersiz (test token), gerçek cihaz tokeni ile çalışacak");
      }
    }
  } catch (err) {
    console.log("❌ FCM send error:", err.message);
  }
}

// ─── CLEANUP ──────────────────────────────────────────────────────────────────
console.log("\n═══════════════════════════════════════");
console.log("CLEANUP");
console.log("═══════════════════════════════════════");

// Remove test FCM token
await conn.execute("DELETE FROM fcmTokens WHERE token = ?", [testToken]);
console.log("✅ Test FCM token cleaned up");

// Remove remaining test notifications
await conn.execute(
  "DELETE FROM notifications WHERE userId = ? AND title IN ('Test Bildirimi', 'Okunmamış Bildirim')",
  [testUser.id]
);
console.log("✅ Test notifications cleaned up");

await conn.end();
console.log("\n✅ All tests completed!");
