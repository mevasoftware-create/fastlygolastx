/**
 * TiDB Cloud → Manus Veritabanı - Kolon Eşleştirmeli Aktarım Scripti
 */

import mysql from 'mysql2/promise';

const SOURCE_CONFIG = {
  host: 'gateway02.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '4EV5ivwhyC7eCUY.root',
  password: 'yAdu9BKls357j85iUbFO',
  database: 'ZkKgZDz9VnqDkYQWNb7iTG',
  ssl: { rejectUnauthorized: false },
  connectTimeout: 30000,
};

const incompatible = [];

function getTargetConfig() {
  const url = new URL(process.env.DATABASE_URL.split('?')[0]);
  return {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
    connectTimeout: 30000,
  };
}

// ============================================================
// KOLON EŞLEŞTİRME HARİTALARI
// format: { hedef_kolon: (kaynak_row) => değer }
// ============================================================

const TABLE_MAPS = {

  users: {
    map: (row) => ({
      id: row.id,
      openId: row.openId || ('legacy_' + row.id),
      name: row.name,
      email: row.email,
      loginMethod: row.loginMethod,
      role: row.role || 'user',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastSignedIn: row.lastSignedIn,
      password: row.password,
      phone: row.phone,
      avatarUrl: row.avatarUrl,
      emailVerified: row.emailVerified ?? false,
      emailVerificationToken: row.emailVerificationToken,
      passwordResetToken: row.passwordResetToken,
      passwordResetExpires: row.passwordResetExpires,
    }),
    dropped: ['emailPreferences'],
  },

  businesses: {
    map: (row) => ({
      id: row.id,
      userId: row.userId,
      businessName: row.businessName,
      businessAddress: row.address || null,          // address → businessAddress
      businessPhone: row.phone || null,              // phone → businessPhone
      businessEmail: row.email || null,              // email → businessEmail
      taxNumber: row.taxNumber,
      isApproved: row.isVerified ?? false,           // isVerified → isApproved
      isActive: row.status === 'active' ? true : (row.status == null ? true : false),
      rating: row.rating,
      totalOrders: 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }),
    dropped: ['businessType', 'latitude', 'longitude', 'countryCode', 'contactPerson', 'balance', 'totalDebt', 'status'],
  },

  couriers: {
    map: (row) => ({
      id: row.id,
      userId: row.userId,
      phone: row.phone,
      vehicleType: row.vehicleType,
      isOnline: row.isAvailable ?? false,            // isAvailable → isOnline
      isApproved: row.isVerified ?? false,           // isVerified → isApproved
      isActive: row.status === 'active' ? true : (row.status == null ? true : false),
      rating: row.rating,
      totalDeliveries: row.totalDeliveries,
      totalEarnings: 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }),
    dropped: ['vehiclePlate', 'currentLatitude', 'currentLongitude', 'countryCode', 'gender', 'experience', 'availability', 'status', 'iban', 'identityNumber', 'identityType', 'identityVerified', 'isDemo'],
  },

  pricingConfig: {
    map: (row) => ({
      id: row.id,
      categoryId: null,                              // eski şemada yok
      areaId: null,                                  // eski şemada yok
      basePrice: row.baseFee,                        // baseFee → basePrice
      pricePerKm: row.perKmFee,                      // perKmFee → pricePerKm
      minPrice: row.baseFee || 5,
      maxPrice: null,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }),
    dropped: ['scenario', 'commissionRate', 'description'],
  },

  orders: {
    map: (row) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      userId: row.customerId,                        // customerId → userId
      businessId: row.restaurantId,                  // restaurantId → businessId
      courierId: row.courierId,
      status: mapOrderStatus(row.status),
      pickupAddress: row.pickupAddress,
      pickupLat: row.pickupLatitude,                 // pickupLatitude → pickupLat
      pickupLng: row.pickupLongitude,                // pickupLongitude → pickupLng
      deliveryAddress: row.deliveryAddress,
      deliveryLat: row.deliveryLatitude,             // deliveryLatitude → deliveryLat
      deliveryLng: row.deliveryLongitude,            // deliveryLongitude → deliveryLng
      categoryId: null,
      areaId: null,
      description: row.packageDescription,           // packageDescription → description
      weight: null,
      distance: row.distance,
      basePrice: row.baseFee,                        // baseFee → basePrice
      surgeMultiplier: (row.priceMultiplier && row.priceMultiplier >= 1 && row.priceMultiplier <= 99) ? row.priceMultiplier : 1.00,
      totalPrice: row.totalFee,                      // totalFee → totalPrice
      paymentMethod: row.paymentMethod || 'cash',
      paymentStatus: row.paymentStatus || 'pending',
      notes: row.specialInstructions,               // specialInstructions → notes
      estimatedDeliveryTime: null,
      actualDeliveryTime: row.deliveredAt,           // deliveredAt → actualDeliveryTime
      cancelReason: null,
      createdAt: row.createdAt,
      updatedAt: row.createdAt,
    }),
    dropped: ['orderType', 'vehicleType', 'distanceFee', 'pricingScenario', 'commissionRate',
              'acceptedAt', 'pickedUpAt', 'pickupPhotoUrl', 'deliveryPhotoUrl', 'deliveryNotes',
              'customerSignature', 'customerRating', 'customerReview', 'paymentType',
              'collectedAmount', 'collectedAt', 'collectedBy', 'deliveryTimeType',
              'scheduledDeliveryDate', 'scheduledTimeSlot', 'isArchived', 'archivedAt', 'archivedBy',
              'calculatedPrice', 'offeredPrice', 'currentPrice', 'packageSize',
              'pickupPhone', 'deliveryPhone', 'pickupFullName', 'deliveryFullName'],
  },

  earnings: {
    map: (row) => ({
      id: row.id,
      courierId: row.courierId,
      orderId: row.orderId,
      amount: row.amount,
      type: 'delivery',
      description: null,
      createdAt: row.createdAt,
    }),
    dropped: ['pricingScenario', 'commissionAmount'],
  },

  ratings: {
    map: (row) => ({
      id: row.id,
      orderId: row.orderId,
      fromUserId: row.customerId,                    // customerId → fromUserId
      toUserId: null,
      toCourierId: row.courierId,
      toBusinessId: null,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt,
    }),
    dropped: [],
  },
};

function mapOrderStatus(status) {
  const map = {
    'pending': 'pending',
    'accepted': 'accepted',
    'picked_up': 'picked_up',
    'in_transit': 'in_transit',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'completed': 'delivered',
  };
  return map[status] || 'pending';
}

async function insertBatch(conn, tableName, rows) {
  if (rows.length === 0) return 0;
  const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
  const placeholders = rows.map(r => `(${Object.values(r).map(() => '?').join(', ')})`).join(', ');
  const values = rows.flatMap(r => Object.values(r).map(v => {
    if (v instanceof Date) return v;
    if (v === null || v === undefined) return null;
    if (typeof v === 'object') return JSON.stringify(v);
    return v;
  }));
  await conn.query(`INSERT INTO \`${tableName}\` (${columns}) VALUES ${placeholders}`, values);
  return rows.length;
}

async function main() {
  console.log('🚀 Kolon eşleştirmeli veri aktarımı başlıyor...\n');

  const sourceConn = await mysql.createConnection(SOURCE_CONFIG);
  const targetConn = await mysql.createConnection(getTargetConfig());

  console.log('✅ Her iki veritabanına bağlantı kuruldu\n');

  await targetConn.query('SET FOREIGN_KEY_CHECKS=0');

  // Önce areas ve categories (bağımlılık yok, zaten aktarıldı - kontrol et)
  const simpleTablesOk = [];
  for (const t of ['areas', 'categories']) {
    const [rows] = await targetConn.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
    simpleTablesOk.push(`${t}: ${rows[0].cnt} kayıt zaten mevcut`);
  }

  const results = [];

  for (const [tableName, { map, dropped }] of Object.entries(TABLE_MAPS)) {
    try {
      const [sourceRows] = await sourceConn.query(`SELECT * FROM \`${tableName}\``);
      if (sourceRows.length === 0) {
        console.log(`  ⏭  ${tableName}: boş, atlanıyor`);
        continue;
      }

      console.log(`  📦 ${tableName}: ${sourceRows.length} kayıt dönüştürülüyor...`);

      // Mevcut verileri temizle
      await targetConn.query(`DELETE FROM \`${tableName}\``);

      const mapped = sourceRows.map(map);
      const batchSize = 200;
      let total = 0;
      for (let i = 0; i < mapped.length; i += batchSize) {
        total += await insertBatch(targetConn, tableName, mapped.slice(i, i + batchSize));
      }

      console.log(`  ✅ ${tableName}: ${total} kayıt aktarıldı`);
      results.push({ table: tableName, count: total, dropped });

      if (dropped.length > 0) {
        incompatible.push({ table: tableName, dropped });
      }

    } catch (err) {
      console.error(`  ❌ ${tableName} HATA: ${err.message}`);
      results.push({ table: tableName, count: 0, error: err.message });
    }
  }

  await targetConn.query('SET FOREIGN_KEY_CHECKS=1');
  await sourceConn.end();
  await targetConn.end();

  // ── ÖZET ──
  console.log('\n' + '='.repeat(60));
  console.log('📋 AKTARIM ÖZETİ');
  console.log('='.repeat(60));

  for (const t of simpleTablesOk) console.log(`  ✅ ${t}`);

  let totalRows = 0;
  for (const r of results) {
    if (r.error) {
      console.log(`  ❌ ${r.table}: HATA - ${r.error}`);
    } else {
      console.log(`  ✅ ${r.table}: ${r.count} kayıt`);
      totalRows += r.count;
    }
  }

  console.log('\n🎉 Toplam aktarılan: ' + totalRows + ' kayıt\n');

  if (incompatible.length > 0) {
    console.log('⚠️  UYUMSUZ / KAYIP ALANLAR:');
    console.log('='.repeat(60));
    for (const { table, dropped } of incompatible) {
      console.log(`  ${table}: ${dropped.join(', ')}`);
    }
  }
}

main().catch(e => { console.error('💥', e.message); process.exit(1); });
