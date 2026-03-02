import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).unique().notNull(),
  password: text("password"),
  name: text("name"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "courier", "business"]).default("user").notNull(),
  phone: varchar("phone", { length: 20 }),
  avatarUrl: text("avatarUrl"),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerificationToken: varchar("emailVerificationToken", { length: 255 }),
  passwordResetToken: varchar("passwordResetToken", { length: 255 }),
  passwordResetExpires: timestamp("passwordResetExpires"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
}))

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Courier profiles - extends user with courier-specific data
 */
export const couriers = mysqlTable("couriers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  vehicleType: mysqlEnum("vehicleType", ["bicycle", "motorcycle", "car"]).notNull(),
  vehiclePlate: varchar("vehiclePlate", { length: 20 }),
  experience: text("experience"),
  availability: text("availability"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  rating: int("rating").default(5),
  totalDeliveries: int("totalDeliveries").default(0),
  currentLatitude: varchar("currentLatitude", { length: 50 }),
  currentLongitude: varchar("currentLongitude", { length: 50 }),
  // Payment information
  iban: varchar("iban", { length: 34 }),
  identityNumber: varchar("identityNumber", { length: 20 }),
  identityType: mysqlEnum("identityType", ["tc", "passport"]),
  identityVerified: boolean("identityVerified").default(false).notNull(),
  isDemo: boolean("isDemo").default(false).notNull(), // Flag for demo couriers
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Courier = typeof couriers.$inferSelect;
export type InsertCourier = typeof couriers.$inferInsert;

/**
 * Business profiles
 */
export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  address: text("address").notNull(),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  taxNumber: varchar("taxNumber", { length: 50 }),
  balance: int("balance").default(0).notNull(),
  totalDebt: int("totalDebt").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "suspended"]).default("pending").notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  rating: int("rating").default(5),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("business_userId_idx").on(table.userId),
}))

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

// Backward compatibility aliases
export type Restaurant = Business;
export type InsertRestaurant = InsertBusiness;

/**
 * Orders/Deliveries
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  courierId: int("courierId"),
  restaurantId: int("restaurantId"),
  
  // Order type
  orderType: mysqlEnum("orderType", ["restaurant", "market", "pharmacy", "individual", "express"]).notNull(),
  
  // Pickup and delivery addresses
  pickupAddress: text("pickupAddress").notNull(),
  pickupLatitude: varchar("pickupLatitude", { length: 50 }),
  pickupLongitude: varchar("pickupLongitude", { length: 50 }),
  pickupFullName: varchar("pickupFullName", { length: 255 }),
  pickupPhone: varchar("pickupPhone", { length: 20 }),
  deliveryAddress: text("deliveryAddress").notNull(),
  deliveryLatitude: varchar("deliveryLatitude", { length: 50 }),
  deliveryLongitude: varchar("deliveryLongitude", { length: 50 }),
  deliveryFullName: varchar("deliveryFullName", { length: 255 }),
  deliveryPhone: varchar("deliveryPhone", { length: 20 }),
  
  // Vehicle preference
  vehicleType: mysqlEnum("vehicleType", ["bicycle", "motorcycle", "car", "any"]).default("any"),
  
  // Order details
  packageDescription: text("packageDescription"),
  specialInstructions: text("specialInstructions"),
  
  // Pricing
  distance: int("distance"), // in meters
  baseFee: int("baseFee").notNull(), // in cents (Euro cents)
  distanceFee: int("distanceFee").notNull(), // in cents
  totalFee: int("totalFee").notNull(), // in cents
  pricingScenario: mysqlEnum("pricingScenario", ["A", "B", "C"]).default("A"),
  commissionRate: int("commissionRate"), // percentage for scenario C
  
  // Dynamic pricing fields
  calculatedPrice: int("calculatedPrice"), // System calculated price in cents
  offeredPrice: int("offeredPrice"), // Customer offered price in cents
  currentPrice: int("currentPrice"), // Current active price (can be updated)
  priceMultiplier: int("priceMultiplier").default(100), // Multiplier for priority/urgency (100 = 1.0x, 150 = 1.5x)
  packageSize: mysqlEnum("packageSize", ["small", "medium", "large"]).default("medium"),
  
  // Status tracking
  status: mysqlEnum("status", [
    "pending", 
    "accepted", 
    "picked_up", 
    "in_transit", 
    "delivered", 
    "cancelled"
  ]).default("pending").notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  pickedUpAt: timestamp("pickedUpAt"),
  deliveredAt: timestamp("deliveredAt"),
  
  // Proof of pickup and delivery
  pickupPhotoUrl: text("pickupPhotoUrl"),
  deliveryPhotoUrl: text("deliveryPhotoUrl"),
  deliveryNotes: text("deliveryNotes"),
  customerSignature: text("customerSignature"),
  
  // Rating
  customerRating: int("customerRating"),
  customerReview: text("customerReview"),
  
  // Payment Management
  paymentType: mysqlEnum("paymentType", ["sender_pays", "receiver_pays"]).default("sender_pays").notNull(), // Gönderici mi alıcı mı ödeyecek
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "collected", "paid"]).default("pending").notNull(), // Ödeme durumu
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "card", "wallet"]).default("cash"), // Ödeme şekli
  collectedAmount: int("collectedAmount"), // Kurye tarafından alınan tutar (cents)
  collectedAt: timestamp("collectedAt"), // Ödeme alındığı zaman
  collectedBy: int("collectedBy"), // Ödemeyi alan kurye ID
  
  // Delivery Time Management
  deliveryTimeType: mysqlEnum("deliveryTimeType", ["now", "scheduled"]).default("now").notNull(), // Şimdi mi zamanlanmış mı
  scheduledDeliveryDate: timestamp("scheduledDeliveryDate"), // Zamanlanmış teslimat tarihi
  scheduledTimeSlot: varchar("scheduledTimeSlot", { length: 20 }), // Zaman aralığı ("14:00-15:00")
  
  // Data Management
  isArchived: boolean("isArchived").default(false).notNull(), // Arşivlenmiş mi?
  archivedAt: timestamp("archivedAt"), // Arşivlenme tarihi
  archivedBy: int("archivedBy"), // Arşivleyen admin ID
}, (table) => ({
  statusIdx: index("order_status_idx").on(table.status),
  createdAtIdx: index("order_createdAt_idx").on(table.createdAt),
  isArchivedIdx: index("order_isArchived_idx").on(table.isArchived),
  customerIdIdx: index("order_customerId_idx").on(table.customerId),
  courierIdIdx: index("order_courierId_idx").on(table.courierId),
  restaurantIdIdx: index("order_restaurantId_idx").on(table.restaurantId),
}));

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Pricing configuration
 */
export const pricingConfig = mysqlTable("pricingConfig", {
  id: int("id").autoincrement().primaryKey(),
  scenario: mysqlEnum("scenario", ["A", "B", "C"]).notNull().unique(),
  baseFee: int("baseFee").notNull(), // in cents
  perKmFee: int("perKmFee").notNull(), // in cents
  commissionRate: int("commissionRate"), // percentage for scenario C
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PricingConfig = typeof pricingConfig.$inferSelect;
export type InsertPricingConfig = typeof pricingConfig.$inferInsert;

/**
 * Surge Pricing Configuration
 * Admin-controlled manual surge pricing for special conditions
 */
export const surgeConfig = mysqlTable("surgeConfig", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Snow Storm Surge"
  reason: text("reason").notNull(), // e.g., "Heavy snowfall, limited courier availability"
  multiplier: decimal("multiplier", { precision: 4, scale: 2 }).notNull(), // e.g., 1.50 for +50%
  isActive: boolean("isActive").default(false).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdBy: int("createdBy"), // Admin user ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SurgeConfig = typeof surgeConfig.$inferSelect;
export type InsertSurgeConfig = typeof surgeConfig.$inferInsert;

/**
 * Notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["order", "delivery", "system", "payment"]).notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  relatedOrderId: int("relatedOrderId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Earnings tracking for couriers
 */
export const earnings = mysqlTable("earnings", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  orderId: int("orderId").notNull(),
  amount: int("amount").notNull(), // in cents
  pricingScenario: mysqlEnum("pricingScenario", ["A", "B", "C"]).notNull(),
  commissionAmount: int("commissionAmount"), // in cents (for scenario C)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Earning = typeof earnings.$inferSelect;
export type InsertEarning = typeof earnings.$inferInsert;

/**
 * Payment requests from couriers
 */
export const paymentRequests = mysqlTable("paymentRequests", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  amount: int("amount").notNull(), // in cents
  status: mysqlEnum("status", ["pending", "approved", "rejected", "paid"]).default("pending").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
  processedBy: int("processedBy"), // admin user ID
  notes: text("notes"),
  rejectionReason: text("rejectionReason"),
});

export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type InsertPaymentRequest = typeof paymentRequests.$inferInsert;

/**
 * Restaurant transactions - balance top-ups and order charges
 */
export const restaurantTransactions = mysqlTable("restaurantTransactions", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  type: mysqlEnum("type", ["topup", "order_charge", "refund", "adjustment"]).notNull(),
  amount: int("amount").notNull(), // in cents, positive for topup/refund, negative for charges
  balanceBefore: int("balanceBefore").notNull(), // in cents
  balanceAfter: int("balanceAfter").notNull(), // in cents
  relatedOrderId: int("relatedOrderId"), // for order_charge type
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"), // admin user ID for manual adjustments
});

export type RestaurantTransaction = typeof restaurantTransactions.$inferSelect;
export type InsertRestaurantTransaction = typeof restaurantTransactions.$inferInsert;

/**
 * Favorite addresses for users
 */
export const favoriteAddresses = mysqlTable("favoriteAddresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 100 }).notNull(), // "Home", "Work", "Office", etc.
  address: text("address").notNull(),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  isDefault: mysqlEnum("isDefault", ["0", "1"]).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FavoriteAddress = typeof favoriteAddresses.$inferSelect;
export type InsertFavoriteAddress = typeof favoriteAddresses.$inferInsert;

/**
 * Ratings - Customer ratings for couriers after delivery
 */
export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(), // One rating per order
  customerId: int("customerId").notNull(),
  courierId: int("courierId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

/**
 * Price offers/bids from couriers for orders
 * Allows couriers to bid on orders with their own price
 */
export const priceOffers = mysqlTable("priceOffers", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  courierId: int("courierId").notNull(),
  offeredPrice: int("offeredPrice").notNull(), // in cents
  message: text("message"), // Optional message from courier
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // Offer expiry time
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
}, (table) => ({
  orderIdIdx: index("priceOffer_orderId_idx").on(table.orderId),
  courierIdIdx: index("priceOffer_courierId_idx").on(table.courierId),
}));

export type PriceOffer = typeof priceOffers.$inferSelect;
export type InsertPriceOffer = typeof priceOffers.$inferInsert;

/**
 * Order tracking history - stores all location updates during delivery
 */
export const orderTracking = mysqlTable("orderTracking", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  courierId: int("courierId").notNull(),
  latitude: varchar("latitude", { length: 50 }).notNull(),
  longitude: varchar("longitude", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }), // Order status at this point
  speed: int("speed"), // Speed in km/h (optional)
  heading: int("heading"), // Direction in degrees (optional)
  accuracy: int("accuracy"), // GPS accuracy in meters (optional)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  orderIdIdx: index("orderTracking_orderId_idx").on(table.orderId),
}));

export type OrderTracking = typeof orderTracking.$inferSelect;
export type InsertOrderTracking = typeof orderTracking.$inferInsert;

/**
 * Courier real-time locations - stores current and historical location data
 * This table is optimized for real-time tracking and location history
 */
export const courierLocations = mysqlTable("courierLocations", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  latitude: varchar("latitude", { length: 50 }).notNull(),
  longitude: varchar("longitude", { length: 50 }).notNull(),
  accuracy: int("accuracy"), // GPS accuracy in meters
  speed: int("speed"), // Speed in km/h
  heading: int("heading"), // Direction in degrees (0-360)
  altitude: int("altitude"), // Altitude in meters
  isActive: boolean("isActive").default(true).notNull(), // Is courier currently sharing location
  batteryLevel: int("batteryLevel"), // Battery percentage (0-100)
  timestamp: timestamp("timestamp").defaultNow().notNull(), // Location timestamp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  courierIdIdx: index("courierLocation_courierId_idx").on(table.courierId),
  timestampIdx: index("courierLocation_timestamp_idx").on(table.timestamp),
  isActiveIdx: index("courierLocation_isActive_idx").on(table.isActive),
}));

export type CourierLocation = typeof courierLocations.$inferSelect;
export type InsertCourierLocation = typeof courierLocations.$inferInsert;


/**
 * Site Settings - Admin configuration
 */
export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  type: mysqlEnum("type", ["string", "number", "boolean", "json"]).default("string").notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"), // admin user ID
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

/**
 * Default settings keys:
 * 
 * BRANDING:
 * - site_title: Site başlığı
 * - site_logo_url: Logo URL'si
 * - site_favicon_url: Favicon URL'si
 * - site_description: Site açıklaması
 * 
 * EMAIL (SMTP):
 * - smtp_host: SMTP sunucu
 * - smtp_port: SMTP port
 * - smtp_user: SMTP kullanıcı
 * - smtp_password: SMTP şifre
 * - smtp_from: Gönderici email
 * - smtp_secure: SSL/TLS kullan (true/false)
 * 
 * OAUTH:
 * - google_oauth_client_id: Google Client ID
 * - google_oauth_client_secret: Google Client Secret
 * - apple_oauth_client_id: Apple Client ID
 * - facebook_oauth_app_id: Facebook App ID
 * - facebook_oauth_app_secret: Facebook App Secret
 * 
 * SYSTEM:
 * - email_verification_expiry_hours: Email doğrulama süresi (saat)
 * - password_reset_expiry_hours: Şifre sıfırlama süresi (saat)
 * - max_upload_size_mb: Maksimum yükleme boyutu (MB)
 */


/**
 * Categories for SEO and service organization
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  icon: varchar("icon", { length: 50 }).notNull(), // emoji or icon name
  shortName: text("shortName").notNull(), // JSON: {en: "...", tr: "...", mk: "...", sq: "..."}
  seoMeta: text("seoMeta").notNull(), // JSON: {en: {title, subtitle, description, keywords}, tr: {...}, mk: {...}, sq: {...}}
  active: boolean("active").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Areas/neighborhoods for local SEO
 */
export const areas = mysqlTable("areas", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  seoMeta: text("seoMeta").notNull(), // JSON: {en: {title, subtitle, description, keywords}, tr: {...}, mk: {...}, sq: {...}}
  active: boolean("active").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Area = typeof areas.$inferSelect;
export type InsertArea = typeof areas.$inferInsert;

/**
 * Price increase history - Track customer price increases for pending orders
 */
export const priceIncreaseHistory = mysqlTable("priceIncreaseHistory", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  customerId: int("customerId").notNull(),
  previousPrice: int("previousPrice").notNull(), // in cents
  newPrice: int("newPrice").notNull(), // in cents
  increaseAmount: int("increaseAmount").notNull(), // in cents
  reason: text("reason"), // Optional reason from customer
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PriceIncreaseHistory = typeof priceIncreaseHistory.$inferSelect;
export type InsertPriceIncreaseHistory = typeof priceIncreaseHistory.$inferInsert;

/**
 * Coupons - Discount codes and promotions
 */
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  type: mysqlEnum("type", ["percentage", "fixed"]).notNull(),
  value: int("value").notNull(), // percentage (0-100) or cents
  minOrderAmount: int("minOrderAmount"), // Minimum order amount in cents
  maxDiscount: int("maxDiscount"), // Maximum discount in cents (for percentage)
  usageLimit: int("usageLimit"), // Total usage limit (null = unlimited)
  usageCount: int("usageCount").default(0).notNull(),
  perUserLimit: int("perUserLimit").default(1), // Usage limit per user
  validFrom: timestamp("validFrom").notNull(),
  validUntil: timestamp("validUntil").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"), // admin user ID
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

/**
 * Coupon usage tracking
 */
export const couponUsage = mysqlTable("couponUsage", {
  id: int("id").autoincrement().primaryKey(),
  couponId: int("couponId").notNull(),
  userId: int("userId").notNull(),
  orderId: int("orderId").notNull(),
  discountAmount: int("discountAmount").notNull(), // in cents
  usedAt: timestamp("usedAt").defaultNow().notNull(),
}, (table) => ({
  couponIdIdx: index("couponUsage_couponId_idx").on(table.couponId),
  userIdIdx: index("couponUsage_userId_idx").on(table.userId),
}));

export type CouponUsage = typeof couponUsage.$inferSelect;
export type InsertCouponUsage = typeof couponUsage.$inferInsert;

/**
 * Referral system
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(), // User who referred
  referredId: int("referredId").notNull().unique(), // User who was referred
  referralCode: varchar("referralCode", { length: 20 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "rewarded"]).default("pending").notNull(),
  rewardAmount: int("rewardAmount"), // Reward in cents
  rewardedAt: timestamp("rewardedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  referrerIdIdx: index("referral_referrerId_idx").on(table.referrerId),
}));

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * FCM tokens for push notifications
 */
export const fcmTokens = mysqlTable("fcmTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: text("token").notNull(),
  deviceType: mysqlEnum("deviceType", ["ios", "android", "web"]).notNull(),
  deviceId: varchar("deviceId", { length: 255 }), // Unique device identifier
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("fcmToken_userId_idx").on(table.userId),
}));

export type FcmToken = typeof fcmTokens.$inferSelect;
export type InsertFcmToken = typeof fcmTokens.$inferInsert;

/**
 * App version control
 */
export const appVersions = mysqlTable("appVersions", {
  id: int("id").autoincrement().primaryKey(),
  platform: mysqlEnum("platform", ["ios", "android"]).notNull(),
  version: varchar("version", { length: 20 }).notNull(), // e.g., "1.2.3"
  buildNumber: int("buildNumber").notNull(),
  minSupportedVersion: varchar("minSupportedVersion", { length: 20 }), // Minimum version still supported
  forceUpdate: boolean("forceUpdate").default(false).notNull(),
  releaseNotes: text("releaseNotes"),
  downloadUrl: text("downloadUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AppVersion = typeof appVersions.$inferSelect;
export type InsertAppVersion = typeof appVersions.$inferInsert;

/**
 * Support tickets
 */
export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  ticketNumber: varchar("ticketNumber", { length: 50 }).notNull().unique(),
  userId: int("userId").notNull(),
  orderId: int("orderId"), // Related order (optional)
  category: mysqlEnum("category", ["order", "payment", "account", "technical", "other"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "waiting_customer", "resolved", "closed"]).default("open").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  assignedTo: int("assignedTo"), // Admin user ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
}, (table) => ({
  userIdIdx: index("supportTicket_userId_idx").on(table.userId),
}));

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/**
 * Support ticket messages
 */
export const supportTicketMessages = mysqlTable("supportTicketMessages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  userId: int("userId").notNull(),
  message: text("message").notNull(),
  attachments: text("attachments"), // JSON array of file URLs
  isInternal: boolean("isInternal").default(false).notNull(), // Internal admin notes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  ticketIdIdx: index("supportTicketMessage_ticketId_idx").on(table.ticketId),
}));

export type SupportTicketMessage = typeof supportTicketMessages.$inferSelect;
export type InsertSupportTicketMessage = typeof supportTicketMessages.$inferInsert;

/**
 * User wallet for credits/balance
 */
export const userWallets = mysqlTable("userWallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balance: int("balance").default(0).notNull(), // in cents
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserWallet = typeof userWallets.$inferSelect;
export type InsertUserWallet = typeof userWallets.$inferInsert;

/**
 * Wallet transactions
 */
export const walletTransactions = mysqlTable("walletTransactions", {
  id: int("id").autoincrement().primaryKey(),
  walletId: int("walletId").notNull(),
  type: mysqlEnum("type", ["deposit", "withdrawal", "order_payment", "refund", "referral_bonus", "adjustment"]).notNull(),
  amount: int("amount").notNull(), // in cents, positive for credit, negative for debit
  balanceBefore: int("balanceBefore").notNull(),
  balanceAfter: int("balanceAfter").notNull(),
  relatedOrderId: int("relatedOrderId"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  walletIdIdx: index("walletTransaction_walletId_idx").on(table.walletId),
}));

export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;

/**
 * Error logs for tracking application errors
 */
export const errorLogs = mysqlTable("errorLogs", {
  id: int("id").autoincrement().primaryKey(),
  errorType: varchar("errorType", { length: 100 }).notNull(), // e.g., "TypeError", "NetworkError", "ValidationError"
  errorMessage: text("errorMessage").notNull(),
  stackTrace: text("stackTrace"),
  userId: int("userId"), // null for anonymous users
  userEmail: varchar("userEmail", { length: 320 }),
  url: text("url"), // URL where error occurred
  userAgent: text("userAgent"), // Browser/device info
  source: mysqlEnum("source", ["frontend", "backend", "api"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  statusCode: int("statusCode"), // HTTP status code if applicable
  resolved: boolean("resolved").default(false).notNull(),
  resolvedBy: int("resolvedBy"), // Admin user ID who resolved
  resolvedAt: timestamp("resolvedAt"),
  notes: text("notes"), // Admin notes about resolution
  metadata: json("metadata"), // Additional context as JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("errorLog_userId_idx").on(table.userId),
  createdAtIdx: index("errorLog_createdAt_idx").on(table.createdAt),
  severityIdx: index("errorLog_severity_idx").on(table.severity),
}));

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;

/**
 * URL Redirects - Admin managed URL redirections
 */
export const redirects = mysqlTable("redirects", {
  id: int("id").autoincrement().primaryKey(),
  sourceUrl: varchar("sourceUrl", { length: 500 }).notNull().unique(), // Source URL pattern (e.g., "/old-page", "?lang=tr")
  targetUrl: varchar("targetUrl", { length: 500 }).notNull(), // Target URL (e.g., "/new-page", "/tr")
  redirectType: mysqlEnum("redirectType", ["301", "302"]).default("301").notNull(), // 301 = permanent, 302 = temporary
  isActive: boolean("isActive").default(true).notNull(),
  description: text("description"), // Admin notes about this redirect
  hitCount: int("hitCount").default(0).notNull(), // Track how many times this redirect was used
  createdBy: int("createdBy").notNull(), // Admin user ID who created
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  sourceUrlIdx: index("redirect_sourceUrl_idx").on(table.sourceUrl),
  isActiveIdx: index("redirect_isActive_idx").on(table.isActive),
}));

export type Redirect = typeof redirects.$inferSelect;
export type InsertRedirect = typeof redirects.$inferInsert;

/**
 * Pages - SEO management for static pages
 * Multi-language support with seoMeta JSON field (includes title, description, keywords, subtitle, content)
 */
export const pages = mysqlTable("pages", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // URL slug (e.g., "home", "services", "about", "new-order")
  seoMeta: text("seoMeta").notNull(), // JSON: {en: {title, description, keywords, subtitle, content}, tr: {...}, mk: {...}, sq: {...}}
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Page = typeof pages.$inferSelect;
export type InsertPage = typeof pages.$inferInsert;

/**
 * Push Tokens - Store device tokens for push notifications
 */
export const pushTokens = mysqlTable("push_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // NULL for anonymous web users
  token: text("token").notNull(), // FCM/Expo Push token or web push subscription
  platform: mysqlEnum("platform", ["web", "ios", "android"]).notNull(),
  deviceInfo: json("deviceInfo"), // Device details (browser, OS, device model, etc.)
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("pushToken_userId_idx").on(table.userId),
  platformIdx: index("pushToken_platform_idx").on(table.platform),
  tokenIdx: index("pushToken_token_idx").on(table.token),
}));

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;

/**
 * Push Notifications - Store sent push notifications history
 */
export const pushNotifications = mysqlTable("push_notifications", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  imageUrl: text("imageUrl"), // Optional notification image
  actionUrl: text("actionUrl"), // Deep link or URL to open
  platform: mysqlEnum("platform", ["web", "mobile", "all"]).notNull(), // Target platform
  targetAudience: mysqlEnum("targetAudience", ["all", "users", "couriers", "business", "specific"]).notNull(),
  targetUserIds: json("targetUserIds"), // Array of user IDs for specific targeting
  sentCount: int("sentCount").default(0).notNull(), // How many devices received it
  failedCount: int("failedCount").default(0).notNull(), // How many failed
  scheduledAt: timestamp("scheduledAt"), // For scheduled notifications
  sentAt: timestamp("sentAt"), // When it was actually sent
  createdBy: int("createdBy").notNull(), // Admin user ID who created
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  platformIdx: index("notification_platform_idx").on(table.platform),
  targetAudienceIdx: index("notification_targetAudience_idx").on(table.targetAudience),
  sentAtIdx: index("notification_sentAt_idx").on(table.sentAt),
  createdByIdx: index("notification_createdBy_idx").on(table.createdBy),
}));

export type PushNotification = typeof pushNotifications.$inferSelect;
export type InsertPushNotification = typeof pushNotifications.$inferInsert;
