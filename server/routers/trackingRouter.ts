import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { orderTracking, orders, couriers } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { emitToOrder } from "../_core/socket";

export const trackingRouter = router({
  /**
   * Record courier location update during delivery
   */
  recordLocation: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      latitude: z.string(),
      longitude: z.string(),
      speed: z.number().optional(), // km/h
      heading: z.number().optional(), // degrees
      accuracy: z.number().optional(), // meters
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Verify user is a courier
      if (ctx.user.role !== "courier") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can record location" });
      }

      // Get courier profile
      const courier = await dbInstance
        .select()
        .from(couriers)
        .where(eq(couriers.userId, ctx.user.id))
        .limit(1);

      if (courier.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Courier profile not found" });
      }

      // Verify order belongs to courier
      const order = await dbInstance
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (order.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      if (order[0].courierId !== courier[0].id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Order not assigned to you" });
      }

      // Record location
      await dbInstance.insert(orderTracking).values({
        orderId: input.orderId,
        courierId: courier[0].id,
        latitude: input.latitude,
        longitude: input.longitude,
        status: order[0].status,
        speed: input.speed,
        heading: input.heading,
        accuracy: input.accuracy,
      });

      // Update courier's current location
      await dbInstance
        .update(couriers)
        .set({
          currentLatitude: input.latitude,
          currentLongitude: input.longitude,
        })
        .where(eq(couriers.id, courier[0].id));

      // Emit real-time update to order room
      emitToOrder(input.orderId, "tracking:locationUpdate", {
        latitude: input.latitude,
        longitude: input.longitude,
        speed: input.speed,
        heading: input.heading,
        timestamp: new Date(),
      });

      return { success: true };
    }),

  /**
   * Get location history for an order
   */
  getOrderHistory: protectedProcedure
    .input(z.object({
      orderId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) return [];

      // Verify user has access to this order
      const order = await dbInstance
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (order.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      // Check if user is customer, courier, or admin
      const courier = await dbInstance
        .select()
        .from(couriers)
        .where(eq(couriers.userId, ctx.user.id))
        .limit(1);

      const isCourier = courier.length > 0 && order[0].courierId === courier[0].id;
      const isCustomer = order[0].customerId === ctx.user.id;
      const isAdmin = ctx.user.role === "admin";

      if (!isCourier && !isCustomer && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Get tracking history
      const history = await dbInstance
        .select()
        .from(orderTracking)
        .where(eq(orderTracking.orderId, input.orderId))
        .orderBy(orderTracking.createdAt);

      return history;
    }),

  /**
   * Get current courier location for an order (public for tracking link)
   */
  getCurrentLocation: publicProcedure
    .input(z.object({
      orderId: z.number(),
      trackingCode: z.string().optional(), // For public tracking
    }))
    .query(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) return null;

      // Get order
      const order = await dbInstance
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (order.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      if (!order[0].courierId) {
        return null; // No courier assigned yet
      }

      // Get latest location
      const latest = await dbInstance
        .select()
        .from(orderTracking)
        .where(eq(orderTracking.orderId, input.orderId))
        .orderBy(desc(orderTracking.createdAt))
        .limit(1);

      if (latest.length === 0) {
        // Fall back to courier's current location
        const courier = await dbInstance
          .select()
          .from(couriers)
          .where(eq(couriers.id, order[0].courierId))
          .limit(1);

        if (courier.length > 0 && courier[0].currentLatitude && courier[0].currentLongitude) {
          return {
            latitude: courier[0].currentLatitude,
            longitude: courier[0].currentLongitude,
            timestamp: new Date(),
            speed: null,
            heading: null,
          };
        }

        return null;
      }

      return {
        latitude: latest[0].latitude,
        longitude: latest[0].longitude,
        timestamp: latest[0].createdAt,
        speed: latest[0].speed,
        heading: latest[0].heading,
      };
    }),

  /**
   * Calculate estimated arrival time
   */
  getEstimatedArrival: protectedProcedure
    .input(z.object({
      orderId: z.number(),
    }))
    .query(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) return null;

      // Get order
      const order = await dbInstance
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (order.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      // Get latest location
      const latest = await dbInstance
        .select()
        .from(orderTracking)
        .where(eq(orderTracking.orderId, input.orderId))
        .orderBy(desc(orderTracking.createdAt))
        .limit(1);

      if (latest.length === 0 || !order[0].deliveryLatitude || !order[0].deliveryLongitude) {
        return null;
      }

      // Simple ETA calculation based on distance and average speed
      const currentLat = parseFloat(latest[0].latitude);
      const currentLon = parseFloat(latest[0].longitude);
      const destLat = parseFloat(order[0].deliveryLatitude);
      const destLon = parseFloat(order[0].deliveryLongitude);

      // Haversine formula for distance
      const R = 6371; // Earth's radius in km
      const dLat = (destLat - currentLat) * Math.PI / 180;
      const dLon = (destLon - currentLon) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(currentLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c; // Distance in km

      // Use courier's current speed or default to 25 km/h
      const speed = latest[0].speed || 25;
      const timeInHours = distance / speed;
      const timeInMinutes = Math.round(timeInHours * 60);

      const eta = new Date();
      eta.setMinutes(eta.getMinutes() + timeInMinutes);

      return {
        estimatedMinutes: timeInMinutes,
        estimatedArrival: eta,
        remainingDistance: Math.round(distance * 1000), // in meters
        currentSpeed: speed,
      };
    }),
});
