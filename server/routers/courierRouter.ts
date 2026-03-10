import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { getDb } from "../db";
import { couriers, users, priceOffers, orders, paymentRequests, earnings, courierLocations } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { emitToUser, emitToAdmins } from "../_core/socket";
import { sendPushNotification } from "./pushNotificationRouter";
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
          createdAt: sql`NOW()`,
          updatedAt: sql`NOW()`,
          lastSignedIn: sql`NOW()`,
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

      // Get courier profile to get courierId
      const courierProfile = await dbInstance
        .select({ id: couriers.id })
        .from(couriers)
        .where(eq(couriers.userId, ctx.user.id))
        .limit(1);

      if (courierProfile.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Courier profile not found" });
      }

      const now = new Date();

      // Update current location on couriers table
      await dbInstance
        .update(couriers)
        .set({
          currentLatitude: input.latitude,
          currentLongitude: input.longitude,
          lastLocationUpdate: now,
          isOnline: true,
        })
        .where(eq(couriers.userId, ctx.user.id));

      // Insert into courierLocations for history tracking
      await dbInstance
        .insert(courierLocations)
        .values({
          courierId: courierProfile[0].id,
          latitude: input.latitude,
          longitude: input.longitude,
          timestamp: now,
          createdAt: now,
        } as any);

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

      if (courier.length === 0 || courier[0].status !== "active") {
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

    if (courier.length === 0 || courier[0].status !== "active") {
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

      if (courier.length === 0 || courier[0].status !== "active") {
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
          acceptedAt: sql`NOW()`,
        })
        .where(eq(orders.id, input.orderId));

      // Notify customer via Socket.IO
      emitToUser(order[0].customerId, "order:accepted", {
        orderId: input.orderId,
        courierId: courier[0].id,
        courierName: ctx.user.name,
      });

      // Notify customer via FCM push notification
      if (order[0].customerId) {
        sendPushNotification(
          order[0].customerId,
          "Kurye Atandı 🚴",
          `${ctx.user.name || "Kurye"} siparişinizi aldı ve yola çıkıyor!`,
          { orderId: String(input.orderId), type: "order_accepted" }
        ).catch(err => console.error("[FCM] acceptOrder notification failed:", err));
      }

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

  /**
   * Get payment requests for current courier
   */
  getPaymentRequests: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) return [];

    const courier = await dbInstance
      .select()
      .from(couriers)
      .where(eq(couriers.userId, ctx.user.id))
      .limit(1);

    if (courier.length === 0) return [];

    return await dbInstance
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.courierId, courier[0].id))
      .orderBy(desc(paymentRequests.requestedAt));
  }),

  /**
   * Get earnings summary (total earned, total withdrawn, available balance)
   */
  getEarningsSummary: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) return { totalEarnings: 0, totalWithdrawn: 0, availableBalance: 0, totalDeliveries: 0 };

    const courier = await dbInstance
      .select()
      .from(couriers)
      .where(eq(couriers.userId, ctx.user.id))
      .limit(1);

    if (courier.length === 0) return { totalEarnings: 0, totalWithdrawn: 0, availableBalance: 0, totalDeliveries: 0 };

    const courierId = courier[0].id;

    // Total earnings from earnings table
    const earningsResult = await dbInstance
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(earnings)
      .where(eq(earnings.courierId, courierId));

    // Total approved/paid withdrawals
    const withdrawnResult = await dbInstance
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(paymentRequests)
      .where(
        and(
          eq(paymentRequests.courierId, courierId),
          sql`${paymentRequests.status} IN ('approved', 'paid')`
        )
      );

    // Pending withdrawal requests
    const pendingResult = await dbInstance
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(paymentRequests)
      .where(
        and(
          eq(paymentRequests.courierId, courierId),
          eq(paymentRequests.status, 'pending')
        )
      );

    const totalEarnings = Number(earningsResult[0]?.total || 0);
    const totalWithdrawn = Number(withdrawnResult[0]?.total || 0);
    const pendingAmount = Number(pendingResult[0]?.total || 0);
    const availableBalance = Math.max(0, totalEarnings - totalWithdrawn - pendingAmount);

    return {
      totalEarnings,
      totalWithdrawn,
      pendingAmount,
      availableBalance,
      totalDeliveries: courier[0].totalDeliveries || 0,
    };
  }),

  /**
   * Create a new payment request
   */
  requestPayment: protectedProcedure
    .input(z.object({
      amount: z.number().min(100), // minimum 1 EUR in cents
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const courier = await dbInstance
        .select()
        .from(couriers)
        .where(eq(couriers.userId, ctx.user.id))
        .limit(1);

      if (courier.length === 0) throw new TRPCError({ code: 'NOT_FOUND', message: 'Kurye profili bulunamadı' });

      const courierId = courier[0].id;

      // Check available balance
      const earningsResult = await dbInstance
        .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(earnings)
        .where(eq(earnings.courierId, courierId));

      const withdrawnResult = await dbInstance
        .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(paymentRequests)
        .where(
          and(
            eq(paymentRequests.courierId, courierId),
            sql`${paymentRequests.status} IN ('approved', 'paid', 'pending')`
          )
        );

      const totalEarnings = Number(earningsResult[0]?.total || 0);
      const totalCommitted = Number(withdrawnResult[0]?.total || 0);
      const available = totalEarnings - totalCommitted;

      if (input.amount > available) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Yetersiz bakiye. Çekilebilir bakiye: €${(available / 100).toFixed(2)}`,
        });
      }

      await dbInstance.insert(paymentRequests).values({
        courierId,
        amount: input.amount,
        status: 'pending',
      });

      return { success: true };
    }),
});
