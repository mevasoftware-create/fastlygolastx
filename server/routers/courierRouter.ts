import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { getDb } from "../db";
import { couriers, users, priceOffers, orders } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { emitToUser, emitToAdmins } from "../_core/socket";

export const courierRouter = router({
  /**
   * Apply to become a courier
   */
  applyToCourier: publicProcedure
    .input(z.object({
      phone: z.string().optional(),
      gender: z.enum(["male", "female", "other"]).optional(),
      vehicleType: z.enum(["bicycle", "motorcycle", "car"]),
      vehiclePlate: z.string().optional(),
      experience: z.string().optional(),
      availability: z.string().optional(),
      iban: z.string().optional(),
      identityNumber: z.string().optional(),
      identityType: z.enum(["tc", "passport"]).optional(),
      email: z.string().email().optional(),
      password: z.string().min(8).optional(),
      name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      let userId: number;
      let userName: string;
      let userEmail: string;
      
      // If user is already logged in, use their account
      if (ctx.user) {
        userId = ctx.user.id;
        userName = ctx.user.name || input.name || "";
        userEmail = ctx.user.email || input.email || "";
        
        // Check if user already has a courier profile
        const existing = await dbInstance
          .select()
          .from(couriers)
          .where(eq(couriers.userId, userId))
          .limit(1);

        if (existing.length > 0) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "You already have a courier application" 
          });
        }
      } else {
        // Create new user account for courier registration
        if (!input.email || !input.password) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Email and password are required" 
          });
        }
        
        userEmail = input.email;
        userName = input.name || "";
        
        // Check if email already exists
        const existingUser = await dbInstance.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existingUser.length > 0) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "This email is already in use" 
          });
        }
        
        // Hash password
        const bcryptjs = await import("bcryptjs");
        const hashedPassword = await bcryptjs.hash(input.password, 10);
        
        // Create user account
        await dbInstance.insert(users).values({
          email: input.email,
          password: hashedPassword,
          name: userName,
          role: "courier",
          loginMethod: "email",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        });
        
        // Get the last inserted user ID from database
        const newUser = await dbInstance.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (!newUser.length) throw new Error("Kullanıcı oluşturulamadı");
        userId = newUser[0].id;
      }

      // Create courier profile
      await dbInstance.insert(couriers).values({
        userId: userId,
        phone: input.phone,
        gender: input.gender,
        vehicleType: input.vehicleType,
        vehiclePlate: input.vehiclePlate,
        experience: input.experience,
        availability: input.availability,
        iban: input.iban,
        identityNumber: input.identityNumber,
        identityType: input.identityType,
        status: "pending",
        isAvailable: false,
        isVerified: false,
      });

      // Notify admins
      emitToAdmins("courier:newApplication", {
        userId: userId,
        userName: userName,
        userEmail: userEmail,
      });

      return { success: true, message: "Application submitted successfully" };
    }),

  /**
   * Get courier profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) return null;

    const result = await dbInstance
      .select()
      .from(couriers)
      .where(eq(couriers.userId, ctx.user.id))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }),

  /**
   * Update courier profile
   */
  updateProfile: protectedProcedure
    .input(z.object({
      phone: z.string().optional(),
      vehiclePlate: z.string().optional(),
      experience: z.string().optional(),
      availability: z.string().optional(),
      iban: z.string().optional(),
      isAvailable: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      await dbInstance
        .update(couriers)
        .set(input)
        .where(eq(couriers.userId, ctx.user.id));

      return { success: true };
    }),

  /**
   * Update courier location
   */
  updateLocation: protectedProcedure
    .input(z.object({
      latitude: z.string(),
      longitude: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Verify user is a courier
      if (ctx.user.role !== "courier") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can update location" });
      }

      await dbInstance
        .update(couriers)
        .set({
          currentLatitude: input.latitude,
          currentLongitude: input.longitude,
        })
        .where(eq(couriers.userId, ctx.user.id));

      return { success: true };
    }),

  /**
   * Submit a price offer for an order
   */
  submitOffer: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      offeredPrice: z.number(), // in cents
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Verify user is a courier
      if (ctx.user.role !== "courier") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can submit offers" });
      }

      // Get courier profile
      const courier = await dbInstance
        .select()
        .from(couriers)
        .where(eq(couriers.userId, ctx.user.id))
        .limit(1);

      if (courier.length === 0 || courier[0].status !== "approved") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Courier not approved" });
      }

      // Check if order exists and is pending
      const order = await dbInstance
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (order.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      if (order[0].status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order is not accepting offers" });
      }

      // Check if courier already submitted an offer
      const existingOffer = await dbInstance
        .select()
        .from(priceOffers)
        .where(
          and(
            eq(priceOffers.orderId, input.orderId),
            eq(priceOffers.courierId, courier[0].id)
          )
        )
        .limit(1);

      if (existingOffer.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You already submitted an offer for this order" });
      }

      // Create offer (expires in 30 minutes)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      await dbInstance.insert(priceOffers).values({
        orderId: input.orderId,
        courierId: courier[0].id,
        offeredPrice: input.offeredPrice,
        message: input.message,
        status: "pending",
        expiresAt,
      });

      // Notify customer
      emitToUser(order[0].customerId, "order:newOffer", {
        orderId: input.orderId,
        courierId: courier[0].id,
        offeredPrice: input.offeredPrice,
      });

      return { success: true, message: "Offer submitted successfully" };
    }),

  /**
   * Get courier's submitted offers
   */
  getMyOffers: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "accepted", "rejected", "expired"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) return [];

      // Get courier profile
      const courier = await dbInstance
        .select()
        .from(couriers)
        .where(eq(couriers.userId, ctx.user.id))
        .limit(1);

      if (courier.length === 0) return [];

      let whereConditions = [eq(priceOffers.courierId, courier[0].id)];
      
      if (input.status) {
        whereConditions.push(eq(priceOffers.status, input.status));
      }

      const query = dbInstance
        .select({
          offer: priceOffers,
          order: orders,
        })
        .from(priceOffers)
        .leftJoin(orders, eq(priceOffers.orderId, orders.id))
        .where(and(...whereConditions))

      const result = await query.orderBy(desc(priceOffers.createdAt));

      return result;
    }),

  /**
   * Get available orders for courier (pending orders)
   */
  getAvailableOrders: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) return [];

    // Verify user is a courier
    if (ctx.user.role !== "courier") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can view available orders" });
    }

    // Get courier profile
    const courier = await dbInstance
      .select()
      .from(couriers)
      .where(eq(couriers.userId, ctx.user.id))
      .limit(1);

    if (courier.length === 0 || courier[0].status !== "approved") {
      return [];
    }

    // Get pending orders
    const availableOrders = await dbInstance
      .select()
      .from(orders)
      .where(eq(orders.status, "pending"))
      .orderBy(desc(orders.createdAt))
      .limit(50);

    return availableOrders;
  }),

  /**
   * Accept an order (direct assignment, no bidding)
   */
  acceptOrder: protectedProcedure
    .input(z.object({
      orderId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Verify user is a courier
      if (ctx.user.role !== "courier") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can accept orders" });
      }

      // Get courier profile
      const courier = await dbInstance
        .select()
        .from(couriers)
        .where(eq(couriers.userId, ctx.user.id))
        .limit(1);

      if (courier.length === 0 || courier[0].status !== "approved") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Courier not approved" });
      }

      if (!courier[0].isAvailable) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You are not available for orders" });
      }

      // Check if order exists and is pending
      const order = await dbInstance
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (order.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      if (order[0].status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order is no longer available" });
      }

      // Assign courier to order
      await dbInstance
        .update(orders)
        .set({
          courierId: courier[0].id,
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(orders.id, input.orderId));

      // Notify customer
      emitToUser(order[0].customerId, "order:accepted", {
        orderId: input.orderId,
        courierId: courier[0].id,
        courierName: ctx.user.name,
      });

      return { success: true, message: "Order accepted successfully" };
    }),

  /**
   * Get courier statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) {
      return {
        totalDeliveries: 0,
        completedToday: 0,
        rating: 5,
        totalEarnings: 0,
      };
    }

    // Get courier profile
    const courier = await dbInstance
      .select()
      .from(couriers)
      .where(eq(couriers.userId, ctx.user.id))
      .limit(1);

    if (courier.length === 0) {
      return {
        totalDeliveries: 0,
        completedToday: 0,
        rating: 5,
        totalEarnings: 0,
      };
    }

    // Get completed deliveries today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        and(
          eq(orders.courierId, courier[0].id),
          eq(orders.status, "delivered"),
          sql`${orders.deliveredAt} >= ${today}`
        )
      );

    return {
      totalDeliveries: courier[0].totalDeliveries || 0,
      completedToday: Number(completedToday[0]?.count || 0),
      rating: courier[0].rating || 5,
      totalEarnings: 0, // TODO: Calculate from earnings table
    };
  }),
});
