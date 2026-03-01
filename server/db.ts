import { eq, desc, and, gte, lte, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  couriers, InsertCourier, Courier,
  businesses, InsertBusiness, Business,
  orders, InsertOrder, Order,
  pricingConfig, InsertPricingConfig, PricingConfig,
  surgeConfig, InsertSurgeConfig, SurgeConfig,
  notifications, InsertNotification, Notification,
  earnings, InsertEarning, Earning,
  ratings, InsertRating, Rating,
  Restaurant, InsertRestaurant,
  errorLogs, InsertErrorLog, ErrorLog,

  pages, InsertPage, Page
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.email) {
    throw new Error("User email is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      email: user.email,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "loginMethod", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

// OAuth user lookup removed - using email-based lookup instead

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Courier functions
export async function createCourier(courier: InsertCourier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Set default location to Skopje center if not provided
  const courierWithDefaults = {
    ...courier,
    currentLatitude: courier.currentLatitude || "41.9973",
    currentLongitude: courier.currentLongitude || "21.4280",
  };
  
  await db.insert(couriers).values(courierWithDefaults);
}

export async function getCourierByUserId(userId: number): Promise<Courier | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(couriers).where(eq(couriers.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAvailableCouriers(vehicleType?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (vehicleType && vehicleType !== 'any') {
    return await db.select().from(couriers).where(
      and(
        eq(couriers.isAvailable, true),
        eq(couriers.isVerified, true),
        eq(couriers.vehicleType, vehicleType as any)
      )
    );
  }
  
  return await db.select().from(couriers).where(
    and(
      eq(couriers.isAvailable, true),
      eq(couriers.isVerified, true)
    )
  );
}

export async function updateCourierLocation(courierId: number, latitude: string, longitude: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(couriers)
    .set({ currentLatitude: latitude, currentLongitude: longitude, updatedAt: new Date() })
    .where(eq(couriers.id, courierId));
}

export async function updateCourierAvailability(courierId: number, isAvailable: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(couriers)
    .set({ isAvailable, updatedAt: new Date() })
    .where(eq(couriers.id, courierId));
}

export async function getAllCouriers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(couriers).orderBy(desc(couriers.createdAt));
}

export async function approveCourier(courierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(couriers)
    .set({ status: 'approved', updatedAt: new Date() })
    .where(eq(couriers.id, courierId));
}

// Restaurant functions
export async function createRestaurant(restaurant: InsertRestaurant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(businesses).values(restaurant);
}

export async function getRestaurantByUserId(userId: number): Promise<Restaurant | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businesses).where(eq(businesses.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Order functions
export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(order);
  return result;
}

export async function getOrderById(id: number): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderDetailsById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  // Get order
  const order = await getOrderById(id);
  if (!order) return undefined;
  
  // Get customer details
  const customer = order.customerId ? await getUserById(order.customerId) : null;
  
  // Get courier details if assigned
  let courierDetails = null;
  if (order.courierId) {
    const courierProfile = await getCourierByUserId(order.courierId);
    const courierUser = await getUserById(order.courierId);
    if (courierProfile && courierUser) {
      courierDetails = {
        id: courierProfile.id,
        userId: courierProfile.userId,
        name: courierUser.name,
        phone: courierProfile.phone || courierUser.phone,
        avatarUrl: courierUser.avatarUrl,
        vehicleType: courierProfile.vehicleType,
        vehiclePlate: courierProfile.vehiclePlate,
        rating: courierProfile.rating,
        totalDeliveries: courierProfile.totalDeliveries,
        currentLatitude: courierProfile.currentLatitude,
        currentLongitude: courierProfile.currentLongitude,
      };
    }
  }
  
  // Get restaurant/business details if applicable
  let businessDetails = null;
  // TODO: Implement getBusinessById function
  // if (order.restaurantId) {
  //   businessDetails = await getBusinessById(order.restaurantId);
  // }
  
  // Get rating if exists
  const rating = await getRatingByOrderId(id);
  
  return {
    order,
    customer: customer ? {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      avatarUrl: customer.avatarUrl,
    } : null,
    courier: courierDetails,
    business: businessDetails,
    rating,
  };
}

export async function getOrdersByCustomerId(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));
}

export async function getOrdersByCourierId(courierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders)
    .where(eq(orders.courierId, courierId))
    .orderBy(desc(orders.createdAt));
}

export async function getOrdersByRestaurantId(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders)
    .where(eq(orders.restaurantId, restaurantId))
    .orderBy(desc(orders.createdAt));
}

export async function getPendingOrders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders)
    .where(eq(orders.status, 'pending'))
    .orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(orderId: number, status: string, additionalData?: Partial<Order>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status, ...additionalData };
  
  if (status === 'accepted') {
    updateData.acceptedAt = new Date();
  } else if (status === 'picked_up') {
    updateData.pickedUpAt = new Date();
  } else if (status === 'delivered') {
    updateData.deliveredAt = new Date();
  }
  
  await db.update(orders)
    .set(updateData)
    .where(eq(orders.id, orderId));
}

export async function assignCourierToOrder(orderId: number, courierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders)
    .set({ courierId, status: 'accepted', acceptedAt: new Date() })
    .where(eq(orders.id, orderId));
}

// Pricing functions
export async function getPricingConfig(scenario: string): Promise<PricingConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pricingConfig)
    .where(and(
      eq(pricingConfig.scenario, scenario as any),
      eq(pricingConfig.isActive, true)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllPricingConfigs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(pricingConfig)
    .where(eq(pricingConfig.isActive, true));
}

export async function upsertPricingConfig(config: InsertPricingConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(pricingConfig).values(config).onDuplicateKeyUpdate({
    set: {
      baseFee: config.baseFee,
      perKmFee: config.perKmFee,
      commissionRate: config.commissionRate,
      description: config.description,
      isActive: config.isActive,
      updatedAt: new Date(),
    },
  });
}

// Notification functions
export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notifications).values(notification);
}

export async function getNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

// Earnings functions
export async function createEarning(earning: InsertEarning) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(earnings).values(earning);
}

export async function getEarningsByCourierId(courierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(earnings)
    .where(eq(earnings.courierId, courierId))
    .orderBy(desc(earnings.createdAt));
}

export async function getTotalEarningsByCourierId(courierId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({
    total: sql<number>`SUM(${earnings.amount})`,
  }).from(earnings)
    .where(eq(earnings.courierId, courierId));
  
  return result[0]?.total || 0;
}

// Admin/Analytics functions
export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrderStats() {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select({
    total: sql<number>`COUNT(*)`,
    pending: sql<number>`SUM(CASE WHEN ${orders.status} = 'pending' THEN 1 ELSE 0 END)`,
    accepted: sql<number>`SUM(CASE WHEN ${orders.status} = 'accepted' THEN 1 ELSE 0 END)`,
    in_transit: sql<number>`SUM(CASE WHEN ${orders.status} = 'in_transit' THEN 1 ELSE 0 END)`,
    delivered: sql<number>`SUM(CASE WHEN ${orders.status} = 'delivered' THEN 1 ELSE 0 END)`,
    cancelled: sql<number>`SUM(CASE WHEN ${orders.status} = 'cancelled' THEN 1 ELSE 0 END)`,
    totalRevenue: sql<number>`SUM(${orders.totalFee})`,
  }).from(orders);
  
  return result[0];
}

export async function getAllRestaurants() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(businesses).orderBy(desc(businesses.createdAt));
}

export async function updateCourierPaymentInfo(
  courierId: number,
  paymentInfo: { iban: string; identityNumber: string; identityType: "tc" | "passport" }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(couriers)
    .set({
      iban: paymentInfo.iban,
      identityNumber: paymentInfo.identityNumber,
      identityType: paymentInfo.identityType,
      updatedAt: new Date(),
    })
    .where(eq(couriers.id, courierId));
}

export async function getOrdersByRestaurantAndDateRange(restaurantId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const { orders } = await import("../drizzle/schema");
  const { and, eq, gte, lte } = await import("drizzle-orm");
  
  return await db.select().from(orders)
    .where(
      and(
        eq(orders.restaurantId, restaurantId),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate)
      )
    )
    .orderBy(orders.createdAt);
}

// Payment Request functions
export async function createPaymentRequest(request: { courierId: number; amount: number; status: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { paymentRequests } = await import("../drizzle/schema");
  await db.insert(paymentRequests).values({
    courierId: request.courierId,
    amount: request.amount,
    status: request.status as any,
  });
}

export async function getAllPaymentRequests() {
  const db = await getDb();
  if (!db) return [];
  
  const { paymentRequests } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  return await db.select().from(paymentRequests).orderBy(desc(paymentRequests.requestedAt));
}

export async function getPaymentRequestsByCourierId(courierId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { paymentRequests } = await import("../drizzle/schema");
  const { eq, desc } = await import("drizzle-orm");
  return await db.select().from(paymentRequests)
    .where(eq(paymentRequests.courierId, courierId))
    .orderBy(desc(paymentRequests.requestedAt));
}

export async function updatePaymentRequestStatus(
  requestId: number,
  status: string,
  processedBy: number,
  notes?: string,
  rejectionReason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { paymentRequests } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  await db.update(paymentRequests)
    .set({
      status: status as any,
      processedAt: new Date(),
      processedBy,
      notes: notes || null,
      rejectionReason: rejectionReason || null,
    })
    .where(eq(paymentRequests.id, requestId));
}

// Favorite Addresses
export async function getFavoriteAddresses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { favoriteAddresses } = await import('../drizzle/schema');
  const results = await db.select().from(favoriteAddresses).where(eq(favoriteAddresses.userId, userId));
  
  // Convert isDefault from "0"/"1" to boolean
  return results.map(addr => ({
    ...addr,
    isDefault: addr.isDefault === "1",
  }));
}

export async function createFavoriteAddress(data: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { favoriteAddresses } = await import('../drizzle/schema');
  
  // Convert isDefault boolean to "0"/"1"
  const insertData = {
    ...data,
    isDefault: data.isDefault ? "1" : "0",
  };
  
  const result = await db.insert(favoriteAddresses).values(insertData);
  return result;
}

export async function updateFavoriteAddress(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { favoriteAddresses } = await import('../drizzle/schema');
  
  // Convert isDefault boolean to "0"/"1" if present
  const updateData = { ...data };
  if (typeof updateData.isDefault === 'boolean') {
    updateData.isDefault = updateData.isDefault ? "1" : "0";
  }
  
  await db.update(favoriteAddresses).set(updateData).where(eq(favoriteAddresses.id, id));
}

export async function deleteFavoriteAddress(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { favoriteAddresses } = await import('../drizzle/schema');
  await db.delete(favoriteAddresses).where(eq(favoriteAddresses.id, id));
}

// ============================================
// RATING FUNCTIONS
// ============================================

export async function createRating(data: InsertRating) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(ratings).values(data);
  return result;
}

export async function getRatingByOrderId(orderId: number): Promise<Rating | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(ratings).where(eq(ratings.orderId, orderId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCourierRatings(courierId: number): Promise<Rating[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(ratings).where(eq(ratings.courierId, courierId));
}

export async function getCourierAverageRating(courierId: number): Promise<{ average: number; count: number }> {
  const db = await getDb();
  if (!db) return { average: 0, count: 0 };
  
  const courierRatings = await db.select().from(ratings).where(eq(ratings.courierId, courierId));
  
  if (courierRatings.length === 0) {
    return { average: 0, count: 0 };
  }
  
  const sum = courierRatings.reduce((acc, r) => acc + r.rating, 0);
  const average = sum / courierRatings.length;
  
  return {
    average: Math.round(average * 10) / 10, // Round to 1 decimal
    count: courierRatings.length
  };
}

export async function canRateOrder(orderId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Check if order is delivered
  const order = await getOrderById(orderId);
  if (!order || order.status !== 'delivered') {
    return false;
  }
  
  // Check if rating already exists
  const existingRating = await getRatingByOrderId(orderId);
  return !existingRating;
}

// ========================================
// Category Management
// ========================================

import { categories, InsertCategory, Category, areas, InsertArea, Area } from "../drizzle/schema";

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(categories).orderBy(categories.displayOrder);
}

export async function getActiveCategories(): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.displayOrder);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}

export async function createCategory(category: InsertCategory): Promise<Category> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(categories).values(category);
  const insertedId = result[0].insertId;
  
  const inserted = await db.select().from(categories).where(eq(categories.id, insertedId)).limit(1);
  return inserted[0];
}

export async function updateCategory(id: number, updates: Partial<InsertCategory>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(categories).set(updates).where(eq(categories.id, id));
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(categories).where(eq(categories.id, id));
}

// ========================================
// Area Management
// ========================================

export async function getAllAreas(): Promise<Area[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(areas).orderBy(areas.displayOrder);
}

export async function getActiveAreas(): Promise<Area[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(areas).where(eq(areas.active, true)).orderBy(areas.displayOrder);
}

export async function getAreaBySlug(slug: string): Promise<Area | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(areas).where(eq(areas.slug, slug)).limit(1);
  return result[0];
}

export async function createArea(area: InsertArea): Promise<Area> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(areas).values(area);
  const insertedId = result[0].insertId;
  
  const inserted = await db.select().from(areas).where(eq(areas.id, insertedId)).limit(1);
  return inserted[0];
}

export async function updateArea(id: number, updates: Partial<InsertArea>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(areas).set(updates).where(eq(areas.id, id));
}

export async function deleteArea(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(areas).where(eq(areas.id, id));
}

// Error Log functions - Database operations for error logging
export async function createErrorLog(errorLog: InsertErrorLog): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Database] Cannot log error: database not available");
    return;
  }
  
  await db.insert(errorLogs).values(errorLog);
}

export async function getErrorLogs(filters?: {
  source?: string;
  severity?: string;
  resolved?: boolean;
  userId?: number;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ErrorLog[]> {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(errorLogs);
  
  const conditions = [];
  
  if (filters?.source) {
    conditions.push(eq(errorLogs.source, filters.source as any));
  }
  
  if (filters?.severity) {
    conditions.push(eq(errorLogs.severity, filters.severity as any));
  }
  
  if (filters?.resolved !== undefined) {
    conditions.push(eq(errorLogs.resolved, filters.resolved));
  }
  
  if (filters?.userId) {
    conditions.push(eq(errorLogs.userId, filters.userId));
  }
  
  if (filters?.startDate) {
    conditions.push(gte(errorLogs.createdAt, filters.startDate));
  }
  
  if (filters?.endDate) {
    conditions.push(lte(errorLogs.createdAt, filters.endDate));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(errorLogs.errorMessage, `%${filters.search}%`),
        like(errorLogs.errorType, `%${filters.search}%`)
      )
    );
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const results = await query
    .orderBy(desc(errorLogs.createdAt))
    .limit(filters?.limit || 100)
    .offset(filters?.offset || 0);
  
  return results;
}

export async function getErrorLogById(id: number): Promise<ErrorLog | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(errorLogs).where(eq(errorLogs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function resolveErrorLog(id: number, resolvedBy: number, notes?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(errorLogs)
    .set({
      resolved: true,
      resolvedBy,
      resolvedAt: new Date(),
      notes,
    })
    .where(eq(errorLogs.id, id));
}

export async function getErrorLogStats(): Promise<{
  total: number;
  unresolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  bySource: { frontend: number; backend: number; api: number };
}> {
  const db = await getDb();
  if (!db) return {
    total: 0,
    unresolved: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    bySource: { frontend: 0, backend: 0, api: 0 },
  };
  
  const allLogs = await db.select().from(errorLogs);
  
  const stats = {
    total: allLogs.length,
    unresolved: allLogs.filter(log => !log.resolved).length,
    critical: allLogs.filter(log => log.severity === 'critical').length,
    high: allLogs.filter(log => log.severity === 'high').length,
    medium: allLogs.filter(log => log.severity === 'medium').length,
    low: allLogs.filter(log => log.severity === 'low').length,
    bySource: {
      frontend: allLogs.filter(log => log.source === 'frontend').length,
      backend: allLogs.filter(log => log.source === 'backend').length,
      api: allLogs.filter(log => log.source === 'api').length,
    },
  };
  
  return stats;
}


// Pages (SEO Management)
export async function getAllPages() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(pages).orderBy(pages.updatedAt);
}

export async function getPageBySlug(slug: string, language: string = 'en') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  if (result.length === 0) return null;
  return result[0];
}

export async function createPage(data: InsertPage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pages).values(data);
  return result;
}

export async function updatePage(id: number, updates: Partial<InsertPage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pages).set(updates).where(eq(pages.id, id));
}

export async function deletePage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pages).where(eq(pages.id, id));
}

export async function getPageById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}


// ============================================================================
// Surge Pricing Configuration CRUD
// ============================================================================

export async function createSurgeConfig(data: InsertSurgeConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(surgeConfig).values(data);
}

export async function getAllSurgeConfigs() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(surgeConfig).orderBy(desc(surgeConfig.createdAt));
}

export async function getActiveSurgeConfig(): Promise<SurgeConfig | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  const result = await db
    .select()
    .from(surgeConfig)
    .where(
      and(
        eq(surgeConfig.isActive, true),
        or(
          sql`${surgeConfig.startDate} IS NULL`,
          lte(surgeConfig.startDate, now)
        ),
        or(
          sql`${surgeConfig.endDate} IS NULL`,
          gte(surgeConfig.endDate, now)
        )
      )
    )
    .orderBy(desc(surgeConfig.createdAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateSurgeConfig(id: number, updates: Partial<InsertSurgeConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(surgeConfig).set(updates).where(eq(surgeConfig.id, id));
}

export async function deleteSurgeConfig(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(surgeConfig).where(eq(surgeConfig.id, id));
}

export async function getSurgeConfigById(id: number): Promise<SurgeConfig | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(surgeConfig).where(eq(surgeConfig.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.email, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
