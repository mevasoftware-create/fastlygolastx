import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { coupons, couponUsage } from "../../drizzle/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";

export const couponRouter = router({
  /**
   * Validate and apply a coupon code
   */
  validate: protectedProcedure
    .input(z.object({
      code: z.string(),
      orderAmount: z.number(), // in cents
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Find coupon
      const coupon = await dbInstance
        .select()
        .from(coupons)
        .where(eq(coupons.code, input.code.toUpperCase()))
        .limit(1);

      if (coupon.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid coupon code" });
      }

      const c = coupon[0];

      // Check if active
      if (!c.isActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Coupon is not active" });
      }

      // Check validity period
      const now = new Date();
      if (c.validFrom > now || c.validUntil < now) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Coupon is not valid at this time" });
      }

      // Check usage limit
      if (c.usageLimit && c.usageCount >= c.usageLimit) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Coupon usage limit reached" });
      }

      // Check per-user limit
      const userUsage = await dbInstance
        .select({ count: sql<number>`count(*)` })
        .from(couponUsage)
        .where(
          and(
            eq(couponUsage.couponId, c.id),
            eq(couponUsage.userId, ctx.user!.id)
          )
        );

      if (c.perUserLimit && Number(userUsage[0]?.count || 0) >= c.perUserLimit) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You have already used this coupon" });
      }

      // Check minimum order amount
      if (c.minOrderAmount && input.orderAmount < c.minOrderAmount) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: `Minimum order amount is €${(c.minOrderAmount / 100).toFixed(2)}` 
        });
      }

      // Calculate discount
      let discountAmount = 0;
      if (c.type === "percentage") {
        discountAmount = Math.round((input.orderAmount * c.value) / 100);
        if (c.maxDiscount && discountAmount > c.maxDiscount) {
          discountAmount = c.maxDiscount;
        }
      } else {
        discountAmount = c.value;
      }

      return {
        valid: true,
        couponId: c.id,
        discountAmount,
        finalAmount: Math.max(0, input.orderAmount - discountAmount),
      };
    }),

  /**
   * Apply coupon to an order (called after order creation)
   */
  applyCoupon: protectedProcedure
    .input(z.object({
      couponId: z.number(),
      orderId: z.number(),
      discountAmount: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Record usage
      await dbInstance.insert(couponUsage).values({
        couponId: input.couponId,
        userId: ctx.user!.id,
        orderId: input.orderId,
        discountAmount: input.discountAmount,
      });

      // Increment usage count
      await dbInstance
        .update(coupons)
        .set({ usageCount: sql`${coupons.usageCount} + 1` })
        .where(eq(coupons.id, input.couponId));

      return { success: true };
    }),

  /**
   * Get user's coupon usage history
   */
  getMyUsage: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) return [];

    const usage = await dbInstance
      .select({
        usage: couponUsage,
        coupon: coupons,
      })
      .from(couponUsage)
      .leftJoin(coupons, eq(couponUsage.couponId, coupons.id))
      .where(eq(couponUsage.userId, ctx.user!.id));

    return usage;
  }),

  /**
   * Admin: Create a new coupon
   */
  create: adminProcedure
    .input(z.object({
      code: z.string(),
      type: z.enum(["percentage", "fixed"]),
      value: z.number(),
      minOrderAmount: z.number().optional(),
      maxDiscount: z.number().optional(),
      usageLimit: z.number().optional(),
      perUserLimit: z.number().default(1),
      validFrom: z.date(),
      validUntil: z.date(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      await dbInstance.insert(coupons).values({
        code: input.code.toUpperCase(),
        type: input.type,
        value: input.value,
        minOrderAmount: input.minOrderAmount,
        maxDiscount: input.maxDiscount,
        usageLimit: input.usageLimit,
        perUserLimit: input.perUserLimit,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        description: input.description,
        isActive: true,
        usageCount: 0,
        createdBy: ctx.user!.id,
      });

      return { success: true };
    }),

  /**
   * Admin: List all coupons
   */
  list: adminProcedure.query(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return [];

    const allCoupons = await dbInstance.select().from(coupons);
    return allCoupons;
  }),

  /**
   * Admin: Update coupon
   */
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      isActive: z.boolean().optional(),
      usageLimit: z.number().optional(),
      validUntil: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const { id, ...updateData } = input;
      await dbInstance
        .update(coupons)
        .set(updateData)
        .where(eq(coupons.id, input.id));

      return { success: true };
    }),

  /**
   * Admin: Delete coupon
   */
  delete: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      await dbInstance.delete(coupons).where(eq(coupons.id, input.id));
      return { success: true };
    }),
});
