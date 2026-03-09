import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { fcmTokens } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendFcmToUser, sendFcmToToken, sendFcmToAllUsers, isFcmConfigured } from "../fcmService";

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
      console.log("[FCM] registerToken called", {
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        tokenPreview: input.token.substring(0, 30) + "...",
        deviceType: input.deviceType,
        deviceId: input.deviceId,
      });

      const dbInstance = await getDb();
      if (!dbInstance) {
        console.error("[FCM] registerToken FAILED: Database not available");
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
        console.log("[FCM] registerToken UPDATED existing token, id:", existing[0].id);
      } else {
        // Create new token
        await dbInstance.insert(fcmTokens).values({
          userId: ctx.user.id,
          token: input.token,
          deviceType: input.deviceType,
          deviceId: input.deviceId,
          isActive: true,
        });
        console.log("[FCM] registerToken INSERTED new token for userId:", ctx.user.id);
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
   * Check FCM configuration status
   */
  getStatus: adminProcedure.query(() => {
    return {
      configured: isFcmConfigured(),
      projectId: process.env.FCM_PROJECT_ID || "fastlygo1",
    };
  }),

  /**
   * Admin: Send test notification to a specific user
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

      if (!isFcmConfigured()) {
        throw new TRPCError({ 
          code: "PRECONDITION_FAILED", 
          message: "FCM not configured. Please set FCM_ACCESS_TOKEN environment variable." 
        });
      }

      const result = await sendFcmToUser(input.userId, {
        title: input.title,
        body: input.body,
      });

      return { 
        success: result.sent > 0,
        sent: result.sent,
        failed: result.failed,
        message: `Sent to ${result.sent} device(s), failed: ${result.failed}`,
        errors: result.errors,
      };
    }),

  /**
   * Admin: Send notification to ALL users with active tokens
   */
  sendToAll: adminProcedure
    .input(z.object({
      title: z.string(),
      body: z.string(),
      data: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      if (!isFcmConfigured()) {
        throw new TRPCError({ 
          code: "PRECONDITION_FAILED", 
          message: "FCM not configured. Please set FCM_ACCESS_TOKEN environment variable." 
        });
      }

      const result = await sendFcmToAllUsers({
        title: input.title,
        body: input.body,
        data: input.data as Record<string, string> | undefined,
      });

      return { 
        success: result.sent > 0,
        sent: result.sent,
        failed: result.failed,
        total: result.total,
        message: `Sent to ${result.sent}/${result.total} device(s), failed: ${result.failed}`,
        errors: result.errors,
      };
    }),

  /**
   * Admin: Send test notification to a specific FCM token directly
   */
  sendTestToToken: adminProcedure
    .input(z.object({
      token: z.string(),
      title: z.string(),
      body: z.string(),
      platform: z.enum(["ios", "android", "web"]).default("android"),
    }))
    .mutation(async ({ input }) => {
      if (!isFcmConfigured()) {
        throw new TRPCError({ 
          code: "PRECONDITION_FAILED", 
          message: "FCM not configured. Please set FCM_ACCESS_TOKEN environment variable." 
        });
      }

      const result = await sendFcmToToken(input.token, {
        title: input.title,
        body: input.body,
      }, input.platform);

      if (!result.success) {
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: result.error || "Failed to send notification" 
        });
      }

      return { success: true, message: "Notification sent successfully" };
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
  data?: Record<string, string>
) {
  if (!isFcmConfigured()) {
    console.log(`[FCM] Not configured, skipping notification for user ${userId}`);
    return false;
  }

  try {
    const result = await sendFcmToUser(userId, { title, body, data });
    return result.sent > 0;
  } catch (error) {
    console.error("[FCM] Error sending push notification:", error);
    return false;
  }
}
