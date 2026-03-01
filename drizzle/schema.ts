import {
  int, mysqlEnum, mysqlTable, text, timestamp, varchar,
  tinyint, json, decimal, unique
} from "drizzle-orm/mysql-core";

// ─── users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "courier", "business"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  phone: varchar("phone", { length: 20 }),
  avatarUrl: text("avatarUrl"),
  password: text("password"),
  emailVerified: tinyint("emailVerified").default(0).notNull(),
  emailVerificationToken: varchar("emailVerificationToken", { length: 255 }),
  passwordResetToken: varchar("passwordResetToken", { length: 255 }),
  passwordResetExpires: timestamp("passwordResetExpires"),
  emailPreferences: json("emailPreferences"),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── areas ───────────────────────────────────────────────────────────────────
export const areas = mysqlTable("areas", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  seoMeta: text("seoMeta").notNull(),
  active: tinyint("active").default(1).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Area = typeof areas.$inferSelect;

// ─── categories ──────────────────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  icon: varchar("icon", { length: 50 }).notNull(),
  seoMeta: text("seoMeta").notNull(),
  active: tinyint("active").default(1).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  shortName: text("shortName").notNull(),
});
export type Category = typeof categories.$inferSelect;

// ─── businesses ──────────────────────────────────────────────────────────────
export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  address: text("address"),
  businessType: varchar("businessType", { length: 100 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  phone: varchar("phone", { length: 20 }),
  countryCode: varchar("countryCode", { length: 5 }),
  taxNumber: varchar("taxNumber", { length: 50 }),
  isVerified: tinyint("isVerified").default(0).notNull(),
  rating: int("rating").default(5),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  contactPerson: varchar("contactPerson", { length: 255 }),
  email: varchar("email", { length: 320 }),
  balance: int("balance").default(0),
  totalDebt: int("totalDebt").default(0),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active"),
});
export type Business = typeof businesses.$inferSelect;

// ─── couriers ────────────────────────────────────────────────────────────────
export const couriers = mysqlTable("couriers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  vehicleType: mysqlEnum("vehicleType", ["bicycle", "motorcycle", "car"]).notNull(),
  vehiclePlate: varchar("vehiclePlate", { length: 20 }),
  isAvailable: tinyint("isAvailable").default(1).notNull(),
  isVerified: tinyint("isVerified").default(0).notNull(),
  rating: int("rating").default(5),
  totalDeliveries: int("totalDeliveries").default(0),
  currentLatitude: varchar("currentLatitude", { length: 50 }),
  currentLongitude: varchar("currentLongitude", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  phone: varchar("phone", { length: 20 }),
  countryCode: varchar("countryCode", { length: 5 }),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  experience: text("experience"),
  availability: text("availability"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  iban: varchar("iban", { length: 34 }),
  identityNumber: varchar("identityNumber", { length: 20 }),
  identityType: mysqlEnum("identityType", ["tc", "passport"]),
  identityVerified: tinyint("identityVerified").default(0).notNull(),
  isDemo: tinyint("isDemo").default(0).notNull(),
});
export type Courier = typeof couriers.$inferSelect;

// ─── pricingConfig ───────────────────────────────────────────────────────────
export const pricingConfig = mysqlTable("pricingConfig", {
  id: int("id").autoincrement().primaryKey(),
  scenario: mysqlEnum("scenario", ["A", "B", "C"]).notNull().unique(),
  baseFee: int("baseFee").notNull(),
  perKmFee: int("perKmFee").notNull(),
  commissionRate: int("commissionRate"),
  description: text("description"),
  isActive: tinyint("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PricingConfig = typeof pricingConfig.$inferSelect;

// ─── surgeConfig ─────────────────────────────────────────────────────────────
export const surgeConfig = mysqlTable("surgeConfig", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  reason: text("reason").notNull(),
  multiplier: decimal("multiplier", { precision: 4, scale: 2 }).notNull(),
  isActive: tinyint("isActive").default(0).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── orders ──────────────────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  courierId: int("courierId"),
  restaurantId: int("restaurantId"),
  orderType: mysqlEnum("orderType", ["restaurant", "market", "pharmacy", "individual", "express"]).notNull(),
  pickupAddress: text("pickupAddress").notNull(),
  pickupLatitude: varchar("pickupLatitude", { length: 50 }),
  pickupLongitude: varchar("pickupLongitude", { length: 50 }),
  deliveryAddress: text("deliveryAddress").notNull(),
  deliveryLatitude: varchar("deliveryLatitude", { length: 50 }),
  deliveryLongitude: varchar("deliveryLongitude", { length: 50 }),
  vehicleType: mysqlEnum("vehicleType", ["bicycle", "motorcycle", "car", "any"]).default("any"),
  packageDescription: text("packageDescription"),
  specialInstructions: text("specialInstructions"),
  distance: int("distance"),
  baseFee: int("baseFee").notNull(),
  distanceFee: int("distanceFee").notNull(),
  totalFee: int("totalFee").notNull(),
  pricingScenario: mysqlEnum("pricingScenario", ["A", "B", "C"]).default("A"),
  commissionRate: int("commissionRate"),
  status: mysqlEnum("status", ["pending", "accepted", "picked_up", "in_transit", "delivered", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  pickedUpAt: timestamp("pickedUpAt"),
  pickupPhotoUrl: text("pickupPhotoUrl"),
  deliveredAt: timestamp("deliveredAt"),
  deliveryPhotoUrl: text("deliveryPhotoUrl"),
  deliveryNotes: text("deliveryNotes"),
  customerSignature: text("customerSignature"),
  customerRating: int("customerRating"),
  customerReview: text("customerReview"),
  paymentType: mysqlEnum("paymentType", ["sender_pays", "receiver_pays"]).default("sender_pays").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "collected", "paid"]).default("pending").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "card", "wallet"]).default("cash"),
  collectedAmount: int("collectedAmount"),
  collectedAt: timestamp("collectedAt"),
  collectedBy: int("collectedBy"),
  deliveryTimeType: mysqlEnum("deliveryTimeType", ["now", "scheduled"]).default("now").notNull(),
  scheduledDeliveryDate: timestamp("scheduledDeliveryDate"),
  scheduledTimeSlot: varchar("scheduledTimeSlot", { length: 20 }),
  isArchived: tinyint("isArchived").default(0).notNull(),
  archivedAt: timestamp("archivedAt"),
  archivedBy: int("archivedBy"),
  calculatedPrice: int("calculatedPrice"),
  offeredPrice: int("offeredPrice"),
  currentPrice: int("currentPrice"),
  priceMultiplier: int("priceMultiplier").default(100),
  packageSize: mysqlEnum("packageSize", ["small", "medium", "large"]).default("medium"),
  pickupPhone: varchar("pickupPhone", { length: 20 }),
  deliveryPhone: varchar("deliveryPhone", { length: 20 }),
  pickupFullName: varchar("pickupFullName", { length: 255 }),
  deliveryFullName: varchar("deliveryFullName", { length: 255 }),
});
export type Order = typeof orders.$inferSelect;

// ─── earnings ────────────────────────────────────────────────────────────────
export const earnings = mysqlTable("earnings", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  orderId: int("orderId").notNull(),
  amount: int("amount").notNull(),
  pricingScenario: mysqlEnum("pricingScenario", ["A", "B", "C"]).notNull(),
  commissionAmount: int("commissionAmount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Earning = typeof earnings.$inferSelect;

// ─── ratings ─────────────────────────────────────────────────────────────────
export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(),
  customerId: int("customerId").notNull(),
  courierId: int("courierId").notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Rating = typeof ratings.$inferSelect;

// ─── pages ───────────────────────────────────────────────────────────────────
export const pages = mysqlTable("pages", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  seoMeta: text("seoMeta").notNull(),
  active: tinyint("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── paymentRequests ─────────────────────────────────────────────────────────
export const paymentRequests = mysqlTable("paymentRequests", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  amount: int("amount").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "paid"]).default("pending").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
  processedBy: int("processedBy"),
  notes: text("notes"),
  rejectionReason: text("rejectionReason"),
});

// ─── priceIncreaseHistory ────────────────────────────────────────────────────
export const priceIncreaseHistory = mysqlTable("priceIncreaseHistory", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  customerId: int("customerId").notNull(),
  previousPrice: int("previousPrice").notNull(),
  newPrice: int("newPrice").notNull(),
  increaseAmount: int("increaseAmount").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── push_notifications ──────────────────────────────────────────────────────
export const pushNotifications = mysqlTable("push_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["order", "delivery", "system", "payment"]).notNull(),
  isRead: tinyint("isRead").default(0).notNull(),
  relatedOrderId: int("relatedOrderId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── push_tokens ─────────────────────────────────────────────────────────────
export const pushTokens = mysqlTable("push_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  token: text("token").notNull(),
  platform: mysqlEnum("platform", ["web", "ios", "android"]).notNull(),
  deviceInfo: json("deviceInfo"),
  isActive: tinyint("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt").defaultNow().notNull(),
});

// ─── errorLogs ───────────────────────────────────────────────────────────────
export const errorLogs = mysqlTable("errorLogs", {
  id: int("id").autoincrement().primaryKey(),
  errorType: varchar("errorType", { length: 100 }).notNull(),
  errorMessage: text("errorMessage").notNull(),
  stackTrace: text("stackTrace"),
  userId: int("userId"),
  userEmail: varchar("userEmail", { length: 320 }),
  url: text("url"),
  userAgent: text("userAgent"),
  source: mysqlEnum("source", ["frontend", "backend", "api"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  statusCode: int("statusCode"),
  resolved: tinyint("resolved").default(0).notNull(),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  notes: text("notes"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── favoriteAddresses ───────────────────────────────────────────────────────
export const favoriteAddresses = mysqlTable("favoriteAddresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  address: text("address").notNull(),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  isDefault: mysqlEnum("isDefault", ["0", "1"]).default("0").notNull(),
});

// ─── redirects ───────────────────────────────────────────────────────────────
export const redirects = mysqlTable("redirects", {
  id: int("id").autoincrement().primaryKey(),
  sourceUrl: varchar("sourceUrl", { length: 500 }).notNull().unique(),
  targetUrl: varchar("targetUrl", { length: 500 }).notNull(),
  redirectType: mysqlEnum("redirectType", ["301", "302"]).default("301").notNull(),
  isActive: tinyint("isActive").default(1).notNull(),
  description: text("description"),
  hitCount: int("hitCount").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── siteSettings ────────────────────────────────────────────────────────────
export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  type: mysqlEnum("type", ["string", "number", "boolean", "json"]).default("string").notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});

// ─── restaurantTransactions ──────────────────────────────────────────────────
export const restaurantTransactions = mysqlTable("restaurantTransactions", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  type: mysqlEnum("type", ["topup", "order_charge", "refund", "adjustment"]).notNull(),
  amount: int("amount").notNull(),
  balanceBefore: int("balanceBefore").notNull(),
  balanceAfter: int("balanceAfter").notNull(),
  relatedOrderId: int("relatedOrderId"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
});

// ─── priceOffers ─────────────────────────────────────────────────────────────
export const priceOffers = mysqlTable("priceOffers", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  courierId: int("courierId").notNull(),
  offeredPrice: int("offeredPrice").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "expired"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── orderTracking ───────────────────────────────────────────────────────────
export const orderTracking = mysqlTable("orderTracking", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── courierLocations ────────────────────────────────────────────────────────
export const courierLocations = mysqlTable("courierLocations", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  latitude: varchar("latitude", { length: 50 }).notNull(),
  longitude: varchar("longitude", { length: 50 }).notNull(),
  accuracy: decimal("accuracy", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── notifications ───────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: tinyint("isRead").default(0).notNull(),
  relatedId: int("relatedId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── fcmTokens ───────────────────────────────────────────────────────────────
export const fcmTokens = mysqlTable("fcmTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: text("token").notNull(),
  platform: mysqlEnum("platform", ["web", "ios", "android"]).notNull(),
  isActive: tinyint("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── coupons ─────────────────────────────────────────────────────────────────
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).notNull(),
  discountValue: int("discountValue").notNull(),
  minOrderValue: int("minOrderValue").default(0),
  maxUsage: int("maxUsage"),
  usedCount: int("usedCount").default(0).notNull(),
  isActive: tinyint("isActive").default(1).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── couponUsage ─────────────────────────────────────────────────────────────
export const couponUsage = mysqlTable("couponUsage", {
  id: int("id").autoincrement().primaryKey(),
  couponId: int("couponId").notNull(),
  userId: int("userId").notNull(),
  orderId: int("orderId"),
  usedAt: timestamp("usedAt").defaultNow().notNull(),
});

// ─── referrals ───────────────────────────────────────────────────────────────
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredId: int("referredId").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "rewarded"]).default("pending").notNull(),
  rewardAmount: int("rewardAmount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── userWallets ─────────────────────────────────────────────────────────────
export const userWallets = mysqlTable("userWallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balance: int("balance").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── walletTransactions ──────────────────────────────────────────────────────
export const walletTransactions = mysqlTable("walletTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["credit", "debit"]).notNull(),
  amount: int("amount").notNull(),
  description: text("description"),
  relatedOrderId: int("relatedOrderId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── appVersions ─────────────────────────────────────────────────────────────
export const appVersions = mysqlTable("appVersions", {
  id: int("id").autoincrement().primaryKey(),
  platform: mysqlEnum("platform", ["ios", "android", "web"]).notNull(),
  version: varchar("version", { length: 20 }).notNull(),
  isForceUpdate: tinyint("isForceUpdate").default(0).notNull(),
  releaseNotes: text("releaseNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── supportTickets ──────────────────────────────────────────────────────────
export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── supportTicketMessages ───────────────────────────────────────────────────
export const supportTicketMessages = mysqlTable("supportTicketMessages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  userId: int("userId").notNull(),
  message: text("message").notNull(),
  isStaff: tinyint("isStaff").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
