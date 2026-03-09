import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { fcmTokens, users, pushNotifications, couriers, businesses } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { sendFcmToUser, sendFcmToToken, sendFcmToAllUsers, sendFcmToUsers, isFcmConfigured } from "../fcmService";
import { getFcmTokenStatus } from "../fcmTokenManager";

// Bildirim şablonları - hızlı gönderim için
export const NOTIFICATION_TEMPLATES = {
  order_received: {
    title: "Siparişiniz Alındı 📦",
    body: "Siparişiniz başarıyla alındı ve işleme alındı.",
  },
  order_assigned: {
    title: "Kurye Atandı 🚴",
    body: "Siparişiniz için kurye atandı, yakında yola çıkıyor.",
  },
  order_picked_up: {
    title: "Sipariş Yola Çıktı 🚀",
    body: "Kurye siparişinizi aldı ve yola çıktı.",
  },
  order_delivered: {
    title: "Sipariş Teslim Edildi ✅",
    body: "Siparişiniz başarıyla teslim edildi. Afiyet olsun!",
  },
  order_cancelled: {
    title: "Sipariş İptal Edildi ❌",
    body: "Siparişiniz iptal edildi.",
  },
  new_order_for_courier: {
    title: "Yeni Sipariş Var! 🔔",
    body: "Yakınınızda yeni bir sipariş var. Hemen kontrol edin!",
  },
  payment_received: {
    title: "Ödeme Alındı 💰",
    body: "Ödemeniz başarıyla işlendi.",
  },
  promotion: {
    title: "Özel Kampanya! 🎉",
    body: "Size özel indirim fırsatı sizi bekliyor!",
  },
  system: {
    title: "Sistem Bildirimi ⚙️",
    body: "FastlyGo'dan önemli bir güncelleme var.",
  },
};

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
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Check if token already exists for this user
      const existing = await dbInstance
        .select()
        .from(fcmTokens)
        .where(and(eq(fcmTokens.userId, ctx.user.id), eq(fcmTokens.token, input.token)))
        .limit(1);

      if (existing.length > 0) {
        await dbInstance
          .update(fcmTokens)
          .set({ deviceType: input.deviceType, deviceId: input.deviceId, isActive: true })
          .where(eq(fcmTokens.id, existing[0].id));
        console.log("[FCM] registerToken UPDATED existing token, id:", existing[0].id);
      } else {
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
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await dbInstance
        .update(fcmTokens)
        .set({ isActive: false })
        .where(and(eq(fcmTokens.userId, ctx.user.id), eq(fcmTokens.token, input.token)));

      return { success: true };
    }),

  /**
   * Get user's registered tokens
   */
  getMyTokens: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) return [];

    return dbInstance
      .select()
      .from(fcmTokens)
      .where(and(eq(fcmTokens.userId, ctx.user.id), eq(fcmTokens.isActive, true)));
  }),

  /**
   * Check FCM configuration status (enhanced)
   */
  getStatus: adminProcedure.query(async () => {
    const tokenStatus = await getFcmTokenStatus();
    const dbInstance = await getDb();
    
    let activeDeviceCount = 0;
    let totalDeviceCount = 0;
    
    if (dbInstance) {
      const [activeCount] = await dbInstance
        .select({ count: sql<number>`count(*)` })
        .from(fcmTokens)
        .where(eq(fcmTokens.isActive, true));
      
      const [totalCount] = await dbInstance
        .select({ count: sql<number>`count(*)` })
        .from(fcmTokens);
      
      activeDeviceCount = Number(activeCount?.count || 0);
      totalDeviceCount = Number(totalCount?.count || 0);
    }

    return {
      configured: tokenStatus.configured,
      method: tokenStatus.method,
      tokenValid: tokenStatus.tokenValid,
      expiresIn: tokenStatus.expiresIn,
      projectId: process.env.FCM_PROJECT_ID || "fastlygo1",
      activeDeviceCount,
      totalDeviceCount,
    };
  }),

  /**
   * Admin: List all registered devices with user info
   */
  getRegisteredDevices: adminProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
      activeOnly: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) return { devices: [], total: 0 };

      const conditions = input.activeOnly ? [eq(fcmTokens.isActive, true)] : [];

      const devices = await dbInstance
        .select({
          id: fcmTokens.id,
          userId: fcmTokens.userId,
          token: fcmTokens.token,
          deviceType: fcmTokens.deviceType,
          deviceId: fcmTokens.deviceId,
          isActive: fcmTokens.isActive,
          createdAt: fcmTokens.createdAt,
          updatedAt: fcmTokens.updatedAt,
          userName: users.name,
          userEmail: users.email,
          userRole: users.role,
        })
        .from(fcmTokens)
        .leftJoin(users, eq(fcmTokens.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(fcmTokens.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Total count
      const [countResult] = await dbInstance
        .select({ count: sql<number>`count(*)` })
        .from(fcmTokens)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return { devices, total: Number(countResult?.count || 0) };
    }),

  /**
   * Admin: Deactivate a specific device token
   */
  deactivateDevice: adminProcedure
    .input(z.object({ tokenId: z.number() }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await dbInstance.update(fcmTokens).set({ isActive: false }).where(eq(fcmTokens.id, input.tokenId));
      return { success: true };
    }),

  /**
   * Admin: Delete a specific device token permanently
   */
  deleteDevice: adminProcedure
    .input(z.object({ tokenId: z.number() }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await dbInstance.delete(fcmTokens).where(eq(fcmTokens.id, input.tokenId));
      return { success: true };
    }),

  /**
   * Admin: Send notification to a specific user
   */
  sendToUser: adminProcedure
    .input(z.object({
      userId: z.number(),
      title: z.string(),
      body: z.string(),
      imageUrl: z.string().optional(),
      data: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!isFcmConfigured()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "FCM yapılandırılmamış" });
      }

      const result = await sendFcmToUser(input.userId, {
        title: input.title,
        body: input.body,
        imageUrl: input.imageUrl,
        data: input.data,
      });

      // Geçmişe kaydet
      const dbInstance = await getDb();
      if (dbInstance) {
        await dbInstance.insert(pushNotifications).values({
          title: input.title,
          body: input.body,
          imageUrl: input.imageUrl,
          platform: "mobile",
          targetAudience: "specific",
          targetUserIds: [input.userId],
          sentCount: result.sent,
          failedCount: result.failed,
          sentAt: new Date(),
          createdBy: ctx.user?.id ?? 0,
        });
      }

      return {
        success: result.sent > 0,
        sent: result.sent,
        failed: result.failed,
        errors: result.errors,
      };
    }),

  /**
   * Admin: Send notification to ALL users (FCM)
   */
  sendToAll: adminProcedure
    .input(z.object({
      title: z.string(),
      body: z.string(),
      imageUrl: z.string().optional(),
      data: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!isFcmConfigured()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "FCM yapılandırılmamış" });
      }

      const result = await sendFcmToAllUsers({
        title: input.title,
        body: input.body,
        imageUrl: input.imageUrl,
        data: input.data,
      });

      // Geçmişe kaydet
      const dbInstance = await getDb();
      if (dbInstance) {
        await dbInstance.insert(pushNotifications).values({
          title: input.title,
          body: input.body,
          imageUrl: input.imageUrl,
          platform: "mobile",
          targetAudience: "all",
          sentCount: result.sent,
          failedCount: result.failed,
          sentAt: new Date(),
          createdBy: ctx.user?.id ?? 0,
        });
      }

      return {
        success: result.sent > 0,
        sent: result.sent,
        failed: result.failed,
        total: result.total,
        message: `${result.total} cihazdan ${result.sent} tanesine gönderildi`,
        errors: result.errors,
      };
    }),

  /**
   * Admin: Send notification to a target audience (couriers, users, businesses)
   */
  sendToAudience: adminProcedure
    .input(z.object({
      audience: z.enum(["all", "users", "couriers", "business"]),
      platform: z.enum(["all", "mobile", "web"]).default("all"),
      title: z.string(),
      body: z.string(),
      imageUrl: z.string().optional(),
      actionUrl: z.string().optional(),
      data: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!isFcmConfigured()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "FCM yapılandırılmamış" });
      }

      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let fcmResult = { sent: 0, failed: 0, total: 0 };
      const payload = {
        title: input.title,
        body: input.body,
        imageUrl: input.imageUrl,
        data: {
          ...(input.data || {}),
          ...(input.actionUrl ? { actionUrl: input.actionUrl } : {}),
        },
      };

      if (input.audience === "all") {
        const result = await sendFcmToAllUsers(payload);
        fcmResult = { sent: result.sent, failed: result.failed, total: result.total };
      } else {
        // Hedef kullanıcı ID'lerini bul
        let targetUserIds: number[] = [];

        if (input.audience === "users") {
          const list = await dbInstance.select({ id: users.id }).from(users).where(eq(users.role, "user"));
          targetUserIds = list.map(u => u.id);
        } else if (input.audience === "couriers") {
          const list = await dbInstance.select({ userId: couriers.userId }).from(couriers);
          targetUserIds = list.map(c => c.userId);
        } else if (input.audience === "business") {
          const list = await dbInstance.select({ userId: businesses.userId }).from(businesses);
          targetUserIds = list.map(b => b.userId);
        }

        if (targetUserIds.length > 0) {
          const result = await sendFcmToUsers(targetUserIds, payload);
          fcmResult = { sent: result.totalSent, failed: result.totalFailed, total: targetUserIds.length };
        }
      }

      // Geçmişe kaydet
      await dbInstance.insert(pushNotifications).values({
        title: input.title,
        body: input.body,
        imageUrl: input.imageUrl,
        actionUrl: input.actionUrl,
        platform: input.platform === "web" ? "web" : input.platform === "mobile" ? "mobile" : "all",
        targetAudience: input.audience,
        sentCount: fcmResult.sent,
        failedCount: fcmResult.failed,
        sentAt: new Date(),
        createdBy: ctx.user?.id ?? 0,
      });

      return {
        success: fcmResult.sent > 0 || fcmResult.total === 0,
        sent: fcmResult.sent,
        failed: fcmResult.failed,
        total: fcmResult.total,
        message: `${fcmResult.total} cihazdan ${fcmResult.sent} tanesine gönderildi`,
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
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "FCM yapılandırılmamış" });
      }

      const result = await sendFcmToToken(input.token, { title: input.title, body: input.body }, input.platform);

      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error || "Gönderim başarısız" });
      }

      return { success: true, message: "Bildirim başarıyla gönderildi" };
    }),

  /**
   * Admin: Get notification history
   */
  getHistory: adminProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) return { notifications: [], total: 0 };

      const notifications = await dbInstance
        .select()
        .from(pushNotifications)
        .orderBy(desc(pushNotifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [countResult] = await dbInstance
        .select({ count: sql<number>`count(*)` })
        .from(pushNotifications);

      return {
        notifications,
        total: Number(countResult?.count || 0),
      };
    }),

  /**
   * Admin: Get notification statistics
   */
  getStats: adminProcedure.query(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return null;

    // Son 30 günlük istatistikler
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalSent] = await dbInstance
      .select({ count: sql<number>`count(*)`, totalDevices: sql<number>`sum(sentCount)` })
      .from(pushNotifications);

    const [activeDevices] = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(fcmTokens)
      .where(eq(fcmTokens.isActive, true));

    const devicesByType = await dbInstance
      .select({
        deviceType: fcmTokens.deviceType,
        count: sql<number>`count(*)`,
      })
      .from(fcmTokens)
      .where(eq(fcmTokens.isActive, true))
      .groupBy(fcmTokens.deviceType);

    const recentNotifications = await dbInstance
      .select()
      .from(pushNotifications)
      .orderBy(desc(pushNotifications.createdAt))
      .limit(5);

    return {
      totalNotificationsSent: Number(totalSent?.count || 0),
      totalDevicesReached: Number(totalSent?.totalDevices || 0),
      activeDevices: Number(activeDevices?.count || 0),
      devicesByType,
      recentNotifications,
    };
  }),

  /**
   * Get notification templates
   */
  getTemplates: adminProcedure.query(() => {
    return Object.entries(NOTIFICATION_TEMPLATES).map(([key, value]) => ({
      key,
      ...value,
    }));
  }),
});

/**
 * Helper function to send push notification to a user
 * Called from order/courier routers for automatic notifications
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
