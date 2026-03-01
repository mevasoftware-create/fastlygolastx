import { eq, and, sql } from "drizzle-orm";
import { ratings, orders, couriers } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Add a new rating for a courier
 */
export async function addRating(data: {
  orderId: number;
  customerId: number;
  courierId: number;
  rating: number;
  comment?: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Check if rating already exists for this order
  const existing = await db
    .select()
    .from(ratings)
    .where(eq(ratings.orderId, data.orderId))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("This order has already been rated");
  }

  // Insert rating
  const result = await db.insert(ratings).values({
    orderId: data.orderId,
    customerId: data.customerId,
    courierId: data.courierId,
    rating: data.rating,
    comment: data.comment || null,
  });

  // Update courier's average rating and total deliveries
  await updateCourierRating(data.courierId);

  return result;
}

/**
 * Get all ratings for a courier
 */
export async function getCourierRatings(courierId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db
    .select()
    .from(ratings)
    .where(eq(ratings.courierId, courierId))
    .orderBy(sql`${ratings.createdAt} DESC`);
}

/**
 * Get average rating for a courier
 */
export async function getCourierAverageRating(courierId: number): Promise<{
  averageRating: number;
  totalRatings: number;
}> {
  const db = await getDb();
  if (!db) {
    return { averageRating: 0, totalRatings: 0 };
  }

  const result = await db
    .select({
      avgRating: sql<number>`AVG(${ratings.rating})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .where(eq(ratings.courierId, courierId));

  if (result.length === 0 || !result[0].count) {
    return { averageRating: 0, totalRatings: 0 };
  }

  return {
    averageRating: Math.round((result[0].avgRating || 0) * 10) / 10, // Round to 1 decimal
    totalRatings: result[0].count,
  };
}

/**
 * Update courier's rating in the couriers table
 */
async function updateCourierRating(courierId: number) {
  const db = await getDb();
  if (!db) {
    return;
  }

  const { averageRating } = await getCourierAverageRating(courierId);

  await db
    .update(couriers)
    .set({ rating: Math.round(averageRating) })
    .where(eq(couriers.id, courierId));
}

/**
 * Check if a user can rate an order
 */
export async function canRateOrder(orderId: number, customerId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return false;
  }

  // Check if order exists and belongs to customer
  const order = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.customerId, customerId)))
    .limit(1);

  if (order.length === 0) {
    return false;
  }

  // Check if order is delivered
  if (order[0].status !== "delivered") {
    return false;
  }

  // Check if already rated
  const existingRating = await db
    .select()
    .from(ratings)
    .where(eq(ratings.orderId, orderId))
    .limit(1);

  return existingRating.length === 0;
}

/**
 * Get rating for a specific order
 */
export async function getOrderRating(orderId: number) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db
    .select()
    .from(ratings)
    .where(eq(ratings.orderId, orderId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
