import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { notifications } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const notificationRouter = router({
  // List notifications for current user
  list: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
      unreadOnly: z.boolean().optional().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [eq(notifications.userId, ctx.user.id)];
      if (input.unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }

      const result = await dbInstance
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),

  // Get unread count
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) return 0;

    const result = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, ctx.user.id),
        eq(notifications.isRead, false)
      ));

    return Number(result[0]?.count || 0);
  }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify notification belongs to user
      const notification = await dbInstance
        .select()
        .from(notifications)
        .where(eq(notifications.id, input.id))
        .limit(1);

      if (!notification.length || notification[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      await dbInstance
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, input.id));

      return { success: true };
    }),

  // Mark all as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    await dbInstance
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, ctx.user.id),
        eq(notifications.isRead, false)
      ));

    return { success: true };
  }),

  // Delete notification
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify notification belongs to user
      const notification = await dbInstance
        .select()
        .from(notifications)
        .where(eq(notifications.id, input.id))
        .limit(1);

      if (!notification.length || notification[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      await dbInstance
        .delete(notifications)
        .where(eq(notifications.id, input.id));

      return { success: true };
    }),

  // Get notification settings
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    // For now, return default settings
    // In future, this can be stored in a separate table
    return {
      orderUpdates: true,
      courierUpdates: true,
      paymentUpdates: true,
      promotions: false,
      emailNotifications: true,
      pushNotifications: true,
    };
  }),

  // Update notification settings
  updateSettings: protectedProcedure
    .input(z.object({
      orderUpdates: z.boolean().optional(),
      courierUpdates: z.boolean().optional(),
      paymentUpdates: z.boolean().optional(),
      promotions: z.boolean().optional(),
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // For now, just return success
      // In future, store these settings in a separate table
      return { success: true, settings: input };
    }),
});
