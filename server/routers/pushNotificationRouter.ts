import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { fcmTokens } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const pushNotificationRouter = router({
  /**
   * Register FCM token for push notifications
   */
  registerToken: protectedProcedure
    .input(z.object({
      token: z.string(),
      deviceType: z.enum(["ios", "android", "web"]),
      deviceId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Check if token already exists for this user
      const existing = await dbInstance
        .select()
        .from(fcmTokens)
        .where(
          and(
            eq(fcmTokens.userId, ctx.user.id),
            eq(fcmTokens.token, input.token)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing token
        await dbInstance
          .update(fcmTokens)
          .set({
            deviceType: input.deviceType,
            deviceId: input.deviceId,
            isActive: true,
          })
          .where(eq(fcmTokens.id, existing[0].id));
      } else {
        // Create new token
        await dbInstance.insert(fcmTokens).values({
          userId: ctx.user.id,
          token: input.token,
          deviceType: input.deviceType,
          deviceId: input.deviceId,
          isActive: true,
        });
      }

      return { success: true };
    }),

  /**
   * Unregister FCM token
   */
  unregisterToken: protectedProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      await dbInstance
        .update(fcmTokens)
        .set({ isActive: false })
        .where(
          and(
            eq(fcmTokens.userId, ctx.user.id),
            eq(fcmTokens.token, input.token)
          )
        );

      return { success: true };
    }),

  /**
   * Get user's registered tokens
   */
  getMyTokens: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) return [];

    const tokens = await dbInstance
      .select()
      .from(fcmTokens)
      .where(
        and(
          eq(fcmTokens.userId, ctx.user.id),
          eq(fcmTokens.isActive, true)
        )
      );

    return tokens;
  }),

  /**
   * Admin: Send test notification
   */
  sendTest: adminProcedure
    .input(z.object({
      userId: z.number(),
      title: z.string(),
      body: z.string(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Get user's active tokens
      const tokens = await dbInstance
        .select()
        .from(fcmTokens)
        .where(
          and(
            eq(fcmTokens.userId, input.userId),
            eq(fcmTokens.isActive, true)
          )
        );

      if (tokens.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No active tokens found for user" });
      }

      // TODO: Implement actual FCM sending logic here
      // This would use Firebase Admin SDK or HTTP API
      // For now, just return success
      console.log(`[Push Notification] Would send to ${tokens.length} devices:`, {
        title: input.title,
        body: input.body,
      });

      return { 
        success: true, 
        message: `Notification queued for ${tokens.length} device(s)` 
      };
    }),
});

/**
 * Helper function to send push notification to a user
 * This should be called from other parts of the application
 */
export async function sendPushNotification(
  userId: number,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const dbInstance = await getDb();
  if (!dbInstance) return false;

  try {
    // Get user's active tokens
    const tokens = await dbInstance
      .select()
      .from(fcmTokens)
      .where(
        and(
          eq(fcmTokens.userId, userId),
          eq(fcmTokens.isActive, true)
        )
      );

    if (tokens.length === 0) {
      console.log(`[Push Notification] No active tokens for user ${userId}`);
      return false;
    }

    // TODO: Implement actual FCM sending logic
    // Example using Firebase Admin SDK:
    /*
    const admin = require('firebase-admin');
    const message = {
      notification: { title, body },
      data: data || {},
      tokens: tokens.map(t => t.token),
    };
    await admin.messaging().sendMulticast(message);
    */

    console.log(`[Push Notification] Would send to user ${userId}:`, {
      title,
      body,
      data,
      tokenCount: tokens.length,
    });

    return true;
  } catch (error) {
    console.error("[Push Notification] Error sending:", error);
    return false;
  }
}
