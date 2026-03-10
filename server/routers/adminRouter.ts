import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import * as db from "../db";
import { 
  users, couriers, businesses, orders, earnings, 
  paymentRequests, siteSettings, appVersions, pushNotifications, pushTokens, fcmTokens,
  notifications
} from "../../drizzle/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { emitToUser } from "../_core/socket";

export const adminRouter = router({
  /**
   * Dashboard statistics
   */
  getDashboardStats: adminProcedure.query(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) {
      return {
        users: { total: 0, today: 0 },
        orders: { total: 0, pending: 0, active: 0, completed: 0 },
        couriers: { total: 0, active: 0, pending: 0 },
        businesses: { total: 0, active: 0, pending: 0 },
        revenue: { today: 0, thisMonth: 0, total: 0 },
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Users stats
    const totalUsers = await dbInstance.select({ count: sql<number>`count(*)` }).from(users);
    const usersToday = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.createdAt, today));

    // Orders stats
    const totalOrders = await dbInstance.select({ count: sql<number>`count(*)` }).from(orders);
    const pendingOrders = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "pending"));
    const activeOrders = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(sql`${orders.status} IN ('accepted', 'picked_up', 'in_transit')`);
    const completedOrders = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "delivered"));

    // Couriers stats
    const totalCouriers = await dbInstance.select({ count: sql<number>`count(*)` }).from(couriers);
    const activeCouriers = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(couriers)
      .where(eq(couriers.status, "active"));
    const pendingCouriers = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(couriers)
      .where(eq(couriers.status, "pending"));

    // Businesses stats
    const totalBusinesses = await dbInstance.select({ count: sql<number>`count(*)` }).from(businesses);
    const activeBusinesses = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(businesses)
      .where(eq(businesses.status, "active"));
    const pendingBusinesses = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(businesses)
      .where(eq(businesses.status, "inactive"));

    // Revenue stats (from completed orders)
    const revenueToday = await dbInstance
      .select({ total: sql<number>`SUM(${orders.totalFee})` })
      .from(orders)
      .where(and(eq(orders.status, "delivered"), gte(orders.deliveredAt, today)));

    const revenueMonth = await dbInstance
      .select({ total: sql<number>`SUM(${orders.totalFee})` })
      .from(orders)
      .where(and(eq(orders.status, "delivered"), gte(orders.deliveredAt, monthStart)));

    const revenueTotal = await dbInstance
      .select({ total: sql<number>`SUM(${orders.totalFee})` })
      .from(orders)
      .where(eq(orders.status, "delivered"));

    return {
      users: {
        total: Number(totalUsers[0]?.count || 0),
        today: Number(usersToday[0]?.count || 0),
      },
      orders: {
        total: Number(totalOrders[0]?.count || 0),
        pending: Number(pendingOrders[0]?.count || 0),
        active: Number(activeOrders[0]?.count || 0),
        completed: Number(completedOrders[0]?.count || 0),
      },
      couriers: {
        total: Number(totalCouriers[0]?.count || 0),
        active: Number(activeCouriers[0]?.count || 0),
        pending: Number(pendingCouriers[0]?.count || 0),
      },
      businesses: {
        total: Number(totalBusinesses[0]?.count || 0),
        active: Number(activeBusinesses[0]?.count || 0),
        pending: Number(pendingBusinesses[0]?.count || 0),
      },
      revenue: {
        today: Number(revenueToday[0]?.total || 0),
        thisMonth: Number(revenueMonth[0]?.total || 0),
        total: Number(revenueTotal[0]?.total || 0),
      },
    };
  }),

  /**
   * Approve courier application
   */
  approveCourier: adminProcedure
    .input(z.object({
      courierId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Get courier
      const courier = await dbInstance
        .select()
        .from(couriers)
        .where(eq(couriers.id, input.courierId))
        .limit(1);

      if (courier.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Courier not found" });
      }

      // Update courier status
      await dbInstance
        .update(couriers)
        .set({ status: "active", isVerified: true })
        .where(eq(couriers.id, input.courierId));

      // Update user role
      await dbInstance
        .update(users)
        .set({ role: "courier" })
        .where(eq(users.id, courier[0].userId));

      // Notify courier
      emitToUser(courier[0].userId, "courier:approved", {
        message: "Your courier application has been approved!",
      });

      return { success: true };
    }),

  /**
   * Reject courier application
   */
  rejectCourier: adminProcedure
    .input(z.object({
      courierId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Get courier
      const courier = await dbInstance
        .select()
        .from(couriers)
        .where(eq(couriers.id, input.courierId))
        .limit(1);

      if (courier.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Courier not found" });
      }

      // Update courier status
      await dbInstance
        .update(couriers)
        .set({ status: "inactive" })
        .where(eq(couriers.id, input.courierId));

      // Notify courier
      emitToUser(courier[0].userId, "courier:rejected", {
        message: "Your courier application has been rejected",
        reason: input.reason,
      });

      return { success: true };
    }),

  /**
   * Approve business application
   */
  approveBusiness: adminProcedure
    .input(z.object({
      businessId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Get business
      const business = await dbInstance
        .select()
        .from(businesses)
        .where(eq(businesses.id, input.businessId))
        .limit(1);

      if (business.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
      }

      // Update business status
      await dbInstance
        .update(businesses)
        .set({ status: "active", isVerified: true })
        .where(eq(businesses.id, input.businessId));

      // Update user role
      await dbInstance
        .update(users)
        .set({ role: "business" })
        .where(eq(users.id, business[0].userId));

      // Notify business
      emitToUser(business[0].userId, "business:approved", {
        message: "Your business application has been approved!",
      });

      return { success: true };
    }),

  /**
   * Reject business application
   */
  rejectBusiness: adminProcedure
    .input(z.object({
      businessId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Get business
      const business = await dbInstance
        .select()
        .from(businesses)
        .where(eq(businesses.id, input.businessId))
        .limit(1);

      if (business.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
      }

      // Update business status
      await dbInstance
        .update(businesses)
        .set({ status: "inactive" })
        .where(eq(businesses.id, input.businessId));

      // Notify business
      emitToUser(business[0].userId, "business:rejected", {
        message: "Your business application has been rejected",
        reason: input.reason,
      });

      return { success: true };
    }),

  /**
   * Ban/suspend user
   */
  suspendUser: adminProcedure
    .input(z.object({
      userId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // TODO: Add suspended field to users table
      // For now, we can use a workaround or add it to schema

      emitToUser(input.userId, "account:suspended", {
        message: "Your account has been suspended",
        reason: input.reason,
      });

      return { success: true, message: "User suspended (TODO: add suspended field to schema)" };
    }),

  /**
   * Get all pending courier applications
   */
  getPendingCouriers: adminProcedure.query(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return [];

    const pending = await dbInstance
      .select({
        courier: couriers,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
        },
      })
      .from(couriers)
      .leftJoin(users, eq(couriers.userId, users.id))
      .where(eq(couriers.status, "pending"))
      .orderBy(desc(couriers.createdAt));

    return pending;
  }),

  /**
   * Get all pending business applications
   */
  getPendingBusinesses: adminProcedure.query(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return [];

    const pending = await dbInstance
      .select({
        business: businesses,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(businesses)
      .leftJoin(users, eq(businesses.userId, users.id))
      .where(eq(businesses.status, "inactive"))
      .orderBy(desc(businesses.createdAt));

    return pending;
  }),

  /**
   * Update site settings
   */
  updateSetting: adminProcedure
    .input(z.object({
      key: z.string(),
      value: z.string(),
      type: z.enum(["string", "number", "boolean", "json"]).default("string"),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Check if setting exists
      const existing = await dbInstance
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, input.key))
        .limit(1);

      if (existing.length > 0) {
        // Update
        await dbInstance
          .update(siteSettings)
          .set({
            value: input.value,
            type: input.type,
            description: input.description,
            updatedBy: ctx.user!.id,
          })
          .where(eq(siteSettings.key, input.key));
      } else {
        // Create
        await dbInstance.insert(siteSettings).values({
          key: input.key,
          value: input.value,
          type: input.type,
          description: input.description,
          updatedBy: ctx.user!.id,
        });
      }

      return { success: true };
    }),

  /**
   * Get all site settings
   */
  getSettings: adminProcedure.query(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return [];

    const settings = await dbInstance.select().from(siteSettings);
    return settings;
  }),

  /**
   * Get all orders
   */
  allOrders: adminProcedure.query(async () => {
    try {
      const dbInstance = await getDb();
      if (!dbInstance) {
        return [];
      }

      // Use raw SQL to select only existing columns
      const [rows]: any = await dbInstance.execute(
        `SELECT id, orderNumber, customerId, courierId, restaurantId, orderType,
                pickupAddress, deliveryAddress, vehicleType, packageDescription,
                distance, baseFee, distanceFee, totalFee, status,
                createdAt, acceptedAt, pickedUpAt, deliveredAt
         FROM orders 
         ORDER BY createdAt DESC`
      );
      return rows || [];
    } catch (error) {
      console.error('[Admin] allOrders error:', error);
      throw error;
    }
  }),

  /**
   * Update order status
   */
  updateOrder: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "accepted", "picked_up", "in_transit", "delivered", "cancelled"]),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      await dbInstance
        .update(orders)
        .set({ status: input.status })
        .where(eq(orders.id, input.id));

      return { success: true };
    }),

  /**
   * Delete order
   */
  deleteOrder: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      await dbInstance
        .delete(orders)
        .where(eq(orders.id, input.id));

      return { success: true };
    }),

  /**
   * Get pricing settings
   */
  getPricingSettings: adminProcedure.query(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return [];

    // Return pricing config for different scenarios
    const pricingConfigs = await dbInstance.select().from(orders).limit(0); // Dummy query
    
    // Return default pricing scenarios
    return [
      { scenario: "standard", baseFee: 400, perKmFee: 70, minFee: 300 },
      { scenario: "express", baseFee: 600, perKmFee: 100, minFee: 500 },
      { scenario: "scheduled", baseFee: 350, perKmFee: 60, minFee: 250 },
    ];
  }),

  /**
   * Update pricing settings
   */
  updatePricingSettings: adminProcedure
    .input(z.object({
      scenario: z.string(),
      baseFee: z.number(),
      perKmFee: z.number(),
      minFee: z.number(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Implement pricing config update in database
      // For now, just return success
      return { success: true };
    }),

  /**
   * Get all businesses with details
   */
  getAllBusinesses: adminProcedure.query(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) {
      return [];
    }

    const allBusinesses = await dbInstance.select().from(businesses).orderBy(desc(businesses.createdAt));
    return allBusinesses;
  }),

  /**
   * Get all couriers with user details
   */
  getAllCouriersWithUsers: adminProcedure.query(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) {
      return [];
    }

    // Join couriers with users table to get user details
    const couriersWithUsers = await dbInstance
      .select({
        id: couriers.id,
        userId: couriers.userId,
        vehicleType: couriers.vehicleType,
        vehiclePlate: couriers.vehiclePlate,
        status: couriers.status,
        isAvailable: couriers.isAvailable,
        isOnline: couriers.isOnline,
        rating: couriers.rating,
        totalDeliveries: couriers.totalDeliveries,
        phone: couriers.phone,
        currentLatitude: couriers.currentLatitude,
        currentLongitude: couriers.currentLongitude,
        lastLocationUpdate: couriers.lastLocationUpdate,
        isDemo: couriers.isDemo,
        createdAt: couriers.createdAt,
        updatedAt: couriers.updatedAt,
        userName: users.name,
        userEmail: users.email,
        userPhone: couriers.phone,
        lastSignedIn: users.lastSignedIn,
      })
      .from(couriers)
      .leftJoin(users, eq(couriers.userId, users.id))
      .orderBy(desc(couriers.createdAt));

    return couriersWithUsers;
  }),

  /**
   * Update business
   */
  updateBusiness: adminProcedure
    .input(z.object({
      businessId: z.number(),
      businessName: z.string().optional(),
      contactPerson: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      status: z.enum(["active", "inactive", "suspended"]).optional(),
      balance: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const { businessId, ...updateData } = input;
      
      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );

      await dbInstance
        .update(businesses)
        .set(cleanData)
        .where(eq(businesses.id, businessId));

      return { success: true };
    }),

  /**
   * Delete business
   */
  deleteBusiness: adminProcedure
    .input(z.object({
      businessId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      await dbInstance
        .delete(businesses)
        .where(eq(businesses.id, input.businessId));

      return { success: true };
    }),

  /**
   * Update courier
   */
  updateCourier: adminProcedure
    .input(z.object({
      courierId: z.number(),
      phone: z.string().optional(),
      vehicleType: z.enum(["bicycle", "motorcycle", "car", "van"]).optional(),
      vehiclePlate: z.string().optional(),
      status: z.enum(["active", "inactive", "suspended", "pending"]).optional(),
      isAvailable: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const { courierId, phone, ...courierData } = input;
      
      // Remove undefined values from courier data
      const cleanCourierData = Object.fromEntries(
        Object.entries(courierData).filter(([_, v]) => v !== undefined)
      );

      // Update courier data
      if (Object.keys(cleanCourierData).length > 0) {
        await dbInstance
          .update(couriers)
          .set(cleanCourierData)
          .where(eq(couriers.id, courierId));
      }

      // Update user phone if provided
      if (phone !== undefined) {
        const courier = await dbInstance
          .select({ userId: couriers.userId })
          .from(couriers)
          .where(eq(couriers.id, courierId))
          .limit(1);
        
        if (courier.length > 0 && courier[0].userId) {
          // Note: users table doesn't have phone field in current schema
          // This would need to be added to the schema first
        }
      }

      // Emit socket event for courier status change
      if (cleanCourierData.status || cleanCourierData.isAvailable !== undefined) {
        const courierData = await dbInstance
          .select({ userId: couriers.userId })
          .from(couriers)
          .where(eq(couriers.id, courierId))
          .limit(1);
        
        if (courierData.length > 0 && courierData[0].userId) {
          emitToUser(courierData[0].userId, "courier:statusChanged", {
            courierId,
            status: cleanCourierData.status,
            isAvailable: cleanCourierData.isAvailable,
          });
        }
      }

      return { success: true };
    }),

  /**
   * Delete courier
   */
  deleteCourier: adminProcedure
    .input(z.object({
      courierId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      await dbInstance
        .delete(couriers)
        .where(eq(couriers.id, input.courierId));

      return { success: true };
    }),

  /**
   * Get revenue report
   */
  getRevenueReport: adminProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      groupBy: z.enum(["day", "week", "month"]).default("day"),
    }))
    .query(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) return [];

      const startDate = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = input.endDate || new Date();

      const revenueData = await dbInstance
        .select({
          date: sql<string>`DATE(${orders.deliveredAt})`,
          total: sql<number>`SUM(${orders.totalFee})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.status, "delivered"),
            gte(orders.deliveredAt, startDate),
            lte(orders.deliveredAt, endDate)
          )
        )
        .groupBy(sql`DATE(${orders.deliveredAt})`);

      return revenueData;
    }),

  /**
   * Get all users
   */
  getAllUsers: adminProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
      role: z.enum(["user", "admin", "courier", "business"]).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) return { users: [], total: 0 };

      let whereConditions: any[] = [];

      if (input.role) {
        whereConditions.push(eq(users.role, input.role));
      }

      if (input.search) {
        whereConditions.push(
          sql`${users.email} LIKE ${`%${input.search}%`} OR ${users.name} LIKE ${`%${input.search}%`}`
        );
      }

      const totalResult = await dbInstance
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

      const usersList = await dbInstance
        .select()
        .from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        users: usersList,
        total: Number(totalResult[0]?.count || 0),
      };
    }),

  /**
   * Delete user
   */
  deleteUser: adminProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Get user to check if exists
      const user = await dbInstance
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user || user.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Delete related records first
      if (user[0].role === "courier") {
        await dbInstance.delete(couriers).where(eq(couriers.userId, input.userId));
      } else if (user[0].role === "business") {
        await dbInstance.delete(businesses).where(eq(businesses.userId, input.userId));
      }

      // Delete user
      await dbInstance.delete(users).where(eq(users.id, input.userId));

      return { success: true };
    }),

  /**
   * Create app version
   */
  createAppVersion: adminProcedure
    .input(z.object({
      platform: z.enum(["ios", "android"]),
      version: z.string(),
      buildNumber: z.number(),
      minSupportedVersion: z.string().optional(),
      forceUpdate: z.boolean().default(false),
      releaseNotes: z.string().optional(),
      downloadUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Deactivate previous versions
      await dbInstance
        .update(appVersions)
        .set({ isActive: false })
        .where(eq(appVersions.platform, input.platform));

      // Create new version
      await dbInstance.insert(appVersions).values({
        ...input,
        isActive: true,
      });

      return { success: true };
    }),

  /**
   * Get all payment requests
   */
  getAllPaymentRequests: adminProcedure.query(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return [];

    const requests = await dbInstance
      .select({
        id: paymentRequests.id,
        courierId: paymentRequests.courierId,
        amount: paymentRequests.amount,
        status: paymentRequests.status,
        requestedAt: paymentRequests.requestedAt,
        processedAt: paymentRequests.processedAt,
        notes: paymentRequests.notes,
        rejectionReason: paymentRequests.rejectionReason,
        processedBy: paymentRequests.processedBy,
        iban: couriers.iban,
        courierName: users.name,
        courierEmail: users.email,
      })
      .from(paymentRequests)
      .leftJoin(couriers, eq(paymentRequests.courierId, couriers.id))
      .leftJoin(users, eq(couriers.userId, users.id))
      .orderBy(desc(paymentRequests.requestedAt));

    return requests;
  }),

  /**
   * Approve payment request
   */
  approvePaymentRequest: adminProcedure
    .input(z.object({
      requestId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const request = await dbInstance
        .select()
        .from(paymentRequests)
        .where(eq(paymentRequests.id, input.requestId))
        .limit(1);

      if (!request || request.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payment request not found" });
      }

      await dbInstance
        .update(paymentRequests)
        .set({ status: "approved", processedAt: sql`NOW()`, notes: input.notes, processedBy: 1 })
        .where(eq(paymentRequests.id, input.requestId));

      return { success: true };
    }),

  /**
   * Reject payment request
   */
  rejectPaymentRequest: adminProcedure
    .input(z.object({
      requestId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const request = await dbInstance
        .select()
        .from(paymentRequests)
        .where(eq(paymentRequests.id, input.requestId))
        .limit(1);

      if (!request || request.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payment request not found" });
      }

      await dbInstance
        .update(paymentRequests)
        .set({ status: "rejected", processedAt: sql`NOW()`, rejectionReason: input.reason, processedBy: 1 })
        .where(eq(paymentRequests.id, input.requestId));

      return { success: true };
    }),

  // ============================================================================
  // Surge Pricing Management
  // ============================================================================

  /**
   * Get all surge configurations
   */
  getAllSurgeConfigs: adminProcedure
    .query(async () => {
      return await db.getAllSurgeConfigs();
    }),

  /**
   * Get active surge configuration
   */
  getActiveSurgeConfig: adminProcedure
    .query(async () => {
      return await db.getActiveSurgeConfig();
    }),

  /**
   * Create new surge configuration
   */
  createSurgeConfig: adminProcedure
    .input(z.object({
      name: z.string(),
      reason: z.string(),
      multiplier: z.number().min(0.5).max(5.0),
      isActive: z.boolean().default(false),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.createSurgeConfig({
        name: input.name,
        reason: input.reason,
        multiplier: input.multiplier.toString(),
        isActive: input.isActive,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        createdBy: ctx.user?.id || null,
      });
      return { success: true };
    }),

  /**
   * Update surge configuration
   */
  updateSurgeConfig: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      reason: z.string().optional(),
      multiplier: z.number().min(0.5).max(5.0).optional(),
      isActive: z.boolean().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const updates: any = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.reason !== undefined) updates.reason = input.reason;
      if (input.multiplier !== undefined) updates.multiplier = input.multiplier.toString();
      if (input.isActive !== undefined) updates.isActive = input.isActive;
      if (input.startDate !== undefined) updates.startDate = new Date(input.startDate);
      if (input.endDate !== undefined) updates.endDate = new Date(input.endDate);
      
      await db.updateSurgeConfig(input.id, updates);
      return { success: true };
    }),

  /**
   * Delete surge configuration
   */
  deleteSurgeConfig: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.deleteSurgeConfig(input.id);
      return { success: true };
    }),

  /**
   * Toggle surge configuration active status
   */
  toggleSurgeConfig: adminProcedure
    .input(z.object({
      id: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      // Deactivate all other surge configs if activating this one
      if (input.isActive) {
        const allConfigs = await db.getAllSurgeConfigs();
        for (const config of allConfigs) {
          if (config.id !== input.id && config.isActive) {
            await db.updateSurgeConfig(config.id, { isActive: false });
          }
        }
      }
      
      await db.updateSurgeConfig(input.id, { isActive: input.isActive });
      return { success: true };
    }),

  /**
   * Send push notification
   */
  sendNotification: adminProcedure
    .input(z.object({
      title: z.string(),
      body: z.string(),
      imageUrl: z.string().optional(),
      actionUrl: z.string().optional(),
      platform: z.enum(["web", "mobile", "all"]),
      targetAudience: z.enum(["all", "users", "couriers", "business"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Get target device tokens
      // pushTokens already imported at top
      
      // Build where conditions
      const conditions = [eq(pushTokens.isActive, true)];

      // Filter by platform
      if (input.platform === "web") {
        conditions.push(eq(pushTokens.platform, "web"));
      } else if (input.platform === "mobile") {
        conditions.push(sql`${pushTokens.platform} IN ('ios', 'android')`);
      }

      // Filter by target audience (get user IDs first)
      if (input.targetAudience !== "all") {
        let targetUserIds: number[] = [];
        
        if (input.targetAudience === "users") {
          const usersList = await dbInstance.select({ id: users.id }).from(users).where(eq(users.role, "user"));
          targetUserIds = usersList.map(u => u.id);
        } else if (input.targetAudience === "couriers") {
          const couriersList = await dbInstance.select({ userId: couriers.userId }).from(couriers);
          targetUserIds = couriersList.map(c => c.userId);
        } else if (input.targetAudience === "business") {
          const businessList = await dbInstance.select({ userId: businesses.userId }).from(businesses);
          targetUserIds = businessList.map(b => b.userId);
        }

        if (targetUserIds.length > 0) {
          conditions.push(sql`${pushTokens.userId} IN (${sql.join(targetUserIds.map(id => sql`${id}`), sql`, `)})`);
        }
      }

      const tokens = await dbInstance.select().from(pushTokens).where(and(...conditions));

      // Save notification to database
      const [notification] = await dbInstance.insert(pushNotifications).values({
        title: input.title,
        body: input.body,
        imageUrl: input.imageUrl,
        actionUrl: input.actionUrl,
        platform: input.platform,
        targetAudience: input.targetAudience,
        sentCount: tokens.length,
        failedCount: 0,
        sentAt: sql`NOW()`,
        createdBy: ctx.user?.id || 0,
      });

      // Send actual web push notifications
      let sentCount = 0;
      let failedCount = 0;

      if (input.platform === "web" || input.platform === "all") {
        const { sendWebPushToAll } = await import("../webPushService");
        const webTokens = tokens.filter(t => t.platform === "web" && t.endpoint && t.p256dh && t.auth);
        if (webTokens.length > 0) {
          const result = await sendWebPushToAll(
            { title: input.title, body: input.body, imageUrl: input.imageUrl, actionUrl: input.actionUrl },
            { userIds: input.targetAudience !== "all" ? tokens.map(t => t.userId).filter(Boolean) as number[] : undefined }
          );
          sentCount += result.sent;
          failedCount += result.failed;
        }
      }

      // Send FCM push notifications (mobile devices)
      if (input.platform === "mobile" || input.platform === "all") {
        const { sendFcmToAllUsers, sendFcmToUsers, isFcmConfigured } = await import("../fcmService");
        if (isFcmConfigured()) {
          let fcmResult: { sent: number; failed: number };
          
          if (input.targetAudience === "all") {
            // Send to all active FCM tokens
            const allResult = await sendFcmToAllUsers({
              title: input.title,
              body: input.body,
              imageUrl: input.imageUrl,
              data: input.actionUrl ? { actionUrl: input.actionUrl } : undefined,
            });
            fcmResult = { sent: allResult.sent, failed: allResult.failed };
          } else {
            // Get target user IDs for FCM
            let fcmTargetUserIds: number[] = [];
            if (input.targetAudience === "users") {
              const usersList = await dbInstance.select({ id: users.id }).from(users).where(eq(users.role, "user"));
              fcmTargetUserIds = usersList.map(u => u.id);
            } else if (input.targetAudience === "couriers") {
              const couriersList = await dbInstance.select({ userId: couriers.userId }).from(couriers);
              fcmTargetUserIds = couriersList.map(c => c.userId);
            } else if (input.targetAudience === "business") {
              const businessList = await dbInstance.select({ userId: businesses.userId }).from(businesses);
              fcmTargetUserIds = businessList.map(b => b.userId);
            }
            
            if (fcmTargetUserIds.length > 0) {
              const usersResult = await sendFcmToUsers(fcmTargetUserIds, {
                title: input.title,
                body: input.body,
                imageUrl: input.imageUrl,
                data: input.actionUrl ? { actionUrl: input.actionUrl } : undefined,
              });
              fcmResult = { sent: usersResult.totalSent, failed: usersResult.totalFailed };
            } else {
              fcmResult = { sent: 0, failed: 0 };
            }
          }
          
          sentCount += fcmResult.sent;
          failedCount += fcmResult.failed;
          console.log(`[Admin] FCM sent=${fcmResult.sent}, failed=${fcmResult.failed}`);
        } else {
          console.warn("[Admin] FCM not configured, skipping mobile push");
        }
      }

      // Update sentCount and failedCount in DB
      await dbInstance.update(pushNotifications)
        .set({ sentCount, failedCount })
        .where(eq(pushNotifications.id, notification.insertId));

      // Save to notifications table so mobile app can list them
      // Determine target user IDs
      let notifUserIds: number[] = [];
      if (input.targetAudience === "all") {
        const allUsers = await dbInstance.select({ id: users.id }).from(users);
        notifUserIds = allUsers.map(u => u.id);
      } else if (input.targetAudience === "users") {
        const usersList = await dbInstance.select({ id: users.id }).from(users).where(eq(users.role, "user"));
        notifUserIds = usersList.map(u => u.id);
      } else if (input.targetAudience === "couriers") {
        const couriersList = await dbInstance.select({ userId: couriers.userId }).from(couriers);
        notifUserIds = couriersList.map(c => c.userId);
      } else if (input.targetAudience === "business") {
        const businessList = await dbInstance.select({ userId: businesses.userId }).from(businesses);
        notifUserIds = businessList.map(b => b.userId);
      }

      if (notifUserIds.length > 0) {
        const notifRows = notifUserIds.map(userId => ({
          userId,
          title: input.title,
          message: input.body,
          type: "system" as const,
          isRead: false,
        }));
        // Insert in batches of 100 to avoid query size limits
        for (let i = 0; i < notifRows.length; i += 100) {
          await dbInstance.insert(notifications).values(notifRows.slice(i, i + 100));
        }
      }

      return {
        success: true,
        sentCount,
        failedCount,
        notificationId: notification.insertId,
      };
    }),

  /**
   * Get notification history
   */
  getNotificationHistory: adminProcedure.query(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return [];

    const notifications = await dbInstance
      .select()
      .from(pushNotifications)
      .orderBy(desc(pushNotifications.createdAt))
      .limit(50);

    return notifications;
  }),
});
