import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { ratings, orders, couriers, users } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { emitToUser } from "../_core/socket";

export const ratingRouter = router({
  /**
   * Create a rating for a completed order
   */
  create: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Check if order exists and belongs to user
      const order = await dbInstance
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (order.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      if (order[0].customerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only rate your own orders" });
      }

      if (order[0].status !== "delivered") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order must be delivered to rate" });
      }

      if (!order[0].courierId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No courier assigned to this order" });
      }

      // Check if already rated
      const existingRating = await dbInstance
        .select()
        .from(ratings)
        .where(eq(ratings.orderId, input.orderId))
        .limit(1);

      if (existingRating.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order already rated" });
      }

      // Create rating
      await dbInstance.insert(ratings).values({
        orderId: input.orderId,
        customerId: ctx.user.id,
        courierId: order[0].courierId,
        rating: input.rating,
        comment: input.comment,
      });

      // Update order with rating
      await dbInstance
        .update(orders)
        .set({
          customerRating: input.rating,
          customerReview: input.comment,
        })
        .where(eq(orders.id, input.orderId));

      // Calculate and update courier average rating
      const courierRatings = await dbInstance
        .select({ rating: ratings.rating })
        .from(ratings)
        .where(eq(ratings.courierId, order[0].courierId));

      const avgRating = Math.round(
        courierRatings.reduce((sum, r) => sum + r.rating, 0) / courierRatings.length
      );

      await dbInstance
        .update(couriers)
        .set({ rating: avgRating })
        .where(eq(couriers.id, order[0].courierId));

      // Get courier user ID to notify
      const courier = await dbInstance
        .select()
        .from(couriers)
        .where(eq(couriers.id, order[0].courierId))
        .limit(1);

      if (courier.length > 0) {
        emitToUser(courier[0].userId, "rating:received", {
          orderId: input.orderId,
          rating: input.rating,
          newAverage: avgRating,
        });
      }

      return { success: true, message: "Rating submitted successfully" };
    }),

  /**
   * Get ratings for a courier
   */
  getCourierRatings: protectedProcedure
    .input(z.object({
      courierId: z.number(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) return [];

      const courierRatings = await dbInstance
        .select({
          rating: ratings,
          customer: {
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
          },
          order: {
            id: orders.id,
            orderNumber: orders.orderNumber,
            deliveredAt: orders.deliveredAt,
          },
        })
        .from(ratings)
        .leftJoin(users, eq(ratings.customerId, users.id))
        .leftJoin(orders, eq(ratings.orderId, orders.id))
        .where(eq(ratings.courierId, input.courierId))
        .orderBy(desc(ratings.createdAt))
        .limit(input.limit);

      return courierRatings;
    }),

  /**
   * Get average rating for a courier
   */
  getCourierAverage: protectedProcedure
    .input(z.object({
      courierId: z.number(),
    }))
    .query(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        return { average: 5, count: 0 };
      }

      const result = await dbInstance
        .select({
          average: sql<number>`AVG(${ratings.rating})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(ratings)
        .where(eq(ratings.courierId, input.courierId));

      return {
        average: result[0]?.average ? Math.round(result[0].average * 10) / 10 : 5,
        count: Number(result[0]?.count || 0),
      };
    }),

  /**
   * Get my ratings (as a customer)
   */
  getMyRatings: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) return [];

    const myRatings = await dbInstance
      .select({
        rating: ratings,
        courier: {
          id: couriers.id,
          vehicleType: couriers.vehicleType,
          rating: couriers.rating,
        },
        courierUser: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
        order: {
          id: orders.id,
          orderNumber: orders.orderNumber,
          deliveredAt: orders.deliveredAt,
        },
      })
      .from(ratings)
      .leftJoin(couriers, eq(ratings.courierId, couriers.id))
      .leftJoin(users, eq(couriers.userId, users.id))
      .leftJoin(orders, eq(ratings.orderId, orders.id))
      .where(eq(ratings.customerId, ctx.user.id))
      .orderBy(desc(ratings.createdAt));

    return myRatings;
  }),

  /**
   * Get rating for a specific order
   */
  getOrderRating: protectedProcedure
    .input(z.object({
      orderId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) return null;

      const rating = await dbInstance
        .select()
        .from(ratings)
        .where(
          and(
            eq(ratings.orderId, input.orderId),
            eq(ratings.customerId, ctx.user.id)
          )
        )
        .limit(1);

      return rating.length > 0 ? rating[0] : null;
    }),
});
