/**
 * Scheduled Notification Router
 *
 * Belirli tarih ve saatte push notification gönderme sistemi.
 * - Tek seferlik, günlük veya haftalık tekrar destekler
 * - Her dakika cron job ile bekleyen bildirimler kontrol edilir
 * - FCM (mobil) ve Web Push (tarayıcı) destekler
 */

import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { scheduledNotifications } from "../../drizzle/schema";
import { eq, and, lte, sql, desc } from "drizzle-orm";
import { sendFcmToAllUsers, sendFcmToUsers, isFcmConfigured } from "../fcmService";
import { users, couriers, businesses } from "../../drizzle/schema";

// ─── Cron Job ────────────────────────────────────────────────────────────────

let cronInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Zamanlanmış bildirimleri kontrol edip gönderir.
 * Her dakika çalışır.
 */
export async function processScheduledNotifications() {
  let dbInstance;
  try {
    dbInstance = await getDb();
  } catch (connErr: unknown) {
    console.error("[Scheduler] DB bağlantısı kurulamadı, sonraki dakika tekrar denenecek:", (connErr as Error).message);
    return;
  }
  if (!dbInstance) return;

  const now = new Date();

  let pending;
  try {
    // Gönderilmesi gereken bekleyen bildirimleri bul
    pending = await dbInstance
    .select()
    .from(scheduledNotifications)
    .where(
      and(
        eq(scheduledNotifications.status, "pending"),
        lte(scheduledNotifications.scheduledAt, now)
      )
    )
    .limit(20); // Aynı anda max 20 bildirim işle
  } catch (queryErr: unknown) {
    console.error("[Scheduler] DB sorgusu başarısız (ECONNRESET?), sonraki dakika tekrar denenecek:", (queryErr as Error).message);
    return;
  }

  if (pending.length === 0) return;

  console.log(`[Scheduler] ${pending.length} zamanlanmış bildirim işlenecek`);

  for (const notif of pending) {
    try {
      // FCM gönderimi
      let fcmResult = { sent: 0, failed: 0, total: 0 };

      if (isFcmConfigured()) {
        const payload = {
          title: notif.title,
          body: notif.body,
          imageUrl: notif.imageUrl ?? undefined,
          data: notif.actionUrl ? { actionUrl: notif.actionUrl } : undefined,
        };

        if (notif.targetAudience === "all") {
          const r = await sendFcmToAllUsers(payload);
          fcmResult = { sent: r.sent, failed: r.failed, total: r.total };
        } else {
          let targetUserIds: number[] = [];

          if (notif.targetAudience === "users") {
            const list = await dbInstance.select({ id: users.id }).from(users).where(eq(users.role, "user"));
            targetUserIds = list.map(u => u.id);
          } else if (notif.targetAudience === "couriers") {
            const list = await dbInstance.select({ userId: couriers.userId }).from(couriers);
            targetUserIds = list.map(c => c.userId);
          } else if (notif.targetAudience === "business") {
            const list = await dbInstance.select({ userId: businesses.userId }).from(businesses);
            targetUserIds = list.map(b => b.userId);
          }

          if (targetUserIds.length > 0) {
            const r = await sendFcmToUsers(targetUserIds, payload);
            fcmResult = { sent: r.totalSent, failed: r.totalFailed, total: targetUserIds.length };
          }
        }
      }

      // Tekrar mantığı
      const nextScheduledAt = getNextScheduledAt(notif);

      if (nextScheduledAt) {
        // Tekrarlayan bildirim: bir sonraki zamanı ayarla
        await dbInstance
          .update(scheduledNotifications)
          .set({
            scheduledAt: nextScheduledAt,
            lastSentAt: now,
            sentCount: (notif.sentCount || 0) + fcmResult.sent,
            failedCount: (notif.failedCount || 0) + fcmResult.failed,
            updatedAt: now,
          })
          .where(eq(scheduledNotifications.id, notif.id));
      } else {
        // Tek seferlik veya tekrar bitti: tamamlandı olarak işaretle
        await dbInstance
          .update(scheduledNotifications)
          .set({
            status: "sent",
            lastSentAt: now,
            sentCount: (notif.sentCount || 0) + fcmResult.sent,
            failedCount: (notif.failedCount || 0) + fcmResult.failed,
            updatedAt: now,
          })
          .where(eq(scheduledNotifications.id, notif.id));
      }

      console.log(`[Scheduler] Bildirim #${notif.id} gönderildi: ${fcmResult.sent} cihaz`);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`[Scheduler] Bildirim #${notif.id} hatası:`, error.message);

      await dbInstance
        .update(scheduledNotifications)
        .set({
          status: "failed",
          errorMessage: error.message,
          updatedAt: new Date(),
        })
        .where(eq(scheduledNotifications.id, notif.id));
    }
  }
}

/**
 * Tekrarlayan bildirim için bir sonraki zamanı hesaplar.
 * Tekrar yoksa veya bittiyse null döner.
 */
function getNextScheduledAt(notif: {
  repeatType: string;
  repeatUntil: Date | null;
  scheduledAt: Date;
  repeatDays: unknown;
}): Date | null {
  if (notif.repeatType === "once") return null;

  const now = new Date();
  let next: Date;

  if (notif.repeatType === "daily") {
    next = new Date(notif.scheduledAt);
    next.setDate(next.getDate() + 1);
    // Geçmiş kaldıysa bugüne taşı
    while (next <= now) {
      next.setDate(next.getDate() + 1);
    }
  } else if (notif.repeatType === "weekly") {
    const repeatDays = (notif.repeatDays as number[] | null) || [];
    if (repeatDays.length === 0) return null;

    next = new Date(notif.scheduledAt);
    next.setDate(next.getDate() + 7);
    while (next <= now) {
      next.setDate(next.getDate() + 7);
    }
  } else {
    return null;
  }

  // repeatUntil kontrolü
  if (notif.repeatUntil && next > notif.repeatUntil) {
    return null;
  }

  return next;
}

/**
 * Cron job'ı başlatır (her dakika çalışır)
 */
export function startScheduledNotificationCron() {
  if (cronInterval) return; // Zaten çalışıyor

  console.log("[Scheduler] Zamanlanmış bildirim cron job başlatıldı (her dakika)");

  // İlk çalıştırma hemen
  processScheduledNotifications().catch(err =>
    console.error("[Scheduler] İlk çalıştırma hatası:", err)
  );

  // Her 60 saniyede bir
  cronInterval = setInterval(() => {
    processScheduledNotifications().catch(err =>
      console.error("[Scheduler] Cron hatası:", err)
    );
  }, 60 * 1000);
}

export function stopScheduledNotificationCron() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log("[Scheduler] Cron job durduruldu");
  }
}

// ─── tRPC Router ─────────────────────────────────────────────────────────────

export const scheduledNotificationRouter = router({
  /**
   * Yeni zamanlanmış bildirim oluştur
   */
  create: adminProcedure
    .input(z.object({
      title: z.string().min(1, "Başlık gerekli"),
      body: z.string().min(1, "Mesaj gerekli"),
      imageUrl: z.string().optional(),
      actionUrl: z.string().optional(),
      platform: z.enum(["web", "mobile", "all"]).default("all"),
      targetAudience: z.enum(["all", "users", "couriers", "business"]).default("all"),
      scheduledAt: z.string(), // ISO 8601 string
      repeatType: z.enum(["once", "daily", "weekly"]).default("once"),
      repeatDays: z.array(z.number().min(0).max(6)).optional(), // 0=Pazar, 6=Cumartesi
      repeatUntil: z.string().optional(), // ISO 8601 string
    }))
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const scheduledAt = new Date(input.scheduledAt);
      if (isNaN(scheduledAt.getTime())) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Geçersiz tarih formatı" });
      }

      if (scheduledAt <= new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Zamanlama tarihi gelecekte olmalı" });
      }

      const repeatUntil = input.repeatUntil ? new Date(input.repeatUntil) : null;

      const [result] = await dbInstance.insert(scheduledNotifications).values({
        title: input.title,
        body: input.body,
        imageUrl: input.imageUrl,
        actionUrl: input.actionUrl,
        platform: input.platform,
        targetAudience: input.targetAudience,
        scheduledAt,
        repeatType: input.repeatType,
        repeatDays: input.repeatDays || null,
        repeatUntil,
        status: "pending",
        sentCount: 0,
        failedCount: 0,
        createdBy: ctx.user?.id ?? 0,
      });

      console.log(`[Scheduler] Yeni bildirim zamanlandı: #${result.insertId} - ${scheduledAt.toISOString()}`);

      return {
        success: true,
        id: result.insertId,
        message: `Bildirim ${scheduledAt.toLocaleString("tr-TR")} tarihinde gönderilecek`,
      };
    }),

  /**
   * Zamanlanmış bildirimleri listele
   */
  list: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "sent", "cancelled", "failed", "all"]).default("all"),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) return { notifications: [], total: 0 };

      const conditions = input.status !== "all"
        ? [eq(scheduledNotifications.status, input.status)]
        : [];

      const notifications = await dbInstance
        .select()
        .from(scheduledNotifications)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(scheduledNotifications.scheduledAt))
        .limit(input.limit)
        .offset(input.offset);

      const [countResult] = await dbInstance
        .select({ count: sql<number>`count(*)` })
        .from(scheduledNotifications)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        notifications,
        total: Number(countResult?.count || 0),
      };
    }),

  /**
   * Tek bir zamanlanmış bildirimi getir
   */
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [notif] = await dbInstance
        .select()
        .from(scheduledNotifications)
        .where(eq(scheduledNotifications.id, input.id))
        .limit(1);

      if (!notif) throw new TRPCError({ code: "NOT_FOUND", message: "Bildirim bulunamadı" });

      return notif;
    }),

  /**
   * Zamanlanmış bildirimi güncelle (sadece pending olanlar)
   */
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      body: z.string().min(1).optional(),
      imageUrl: z.string().optional(),
      actionUrl: z.string().optional(),
      platform: z.enum(["web", "mobile", "all"]).optional(),
      targetAudience: z.enum(["all", "users", "couriers", "business"]).optional(),
      scheduledAt: z.string().optional(),
      repeatType: z.enum(["once", "daily", "weekly"]).optional(),
      repeatDays: z.array(z.number().min(0).max(6)).optional(),
      repeatUntil: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [existing] = await dbInstance
        .select()
        .from(scheduledNotifications)
        .where(eq(scheduledNotifications.id, input.id))
        .limit(1);

      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Bildirim bulunamadı" });
      if (existing.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sadece bekleyen bildirimler güncellenebilir" });
      }

      let scheduledAtDate: Date | undefined;
      if (input.scheduledAt) {
        const d = new Date(input.scheduledAt);
        if (isNaN(d.getTime())) throw new TRPCError({ code: "BAD_REQUEST", message: "Geçersiz tarih" });
        if (d <= new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "Tarih gelecekte olmalı" });
        scheduledAtDate = d;
      }

      await dbInstance
        .update(scheduledNotifications)
        .set({
          ...(input.title ? { title: input.title } : {}),
          ...(input.body ? { body: input.body } : {}),
          ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
          ...(input.actionUrl !== undefined ? { actionUrl: input.actionUrl } : {}),
          ...(input.platform ? { platform: input.platform } : {}),
          ...(input.targetAudience ? { targetAudience: input.targetAudience } : {}),
          ...(scheduledAtDate ? { scheduledAt: scheduledAtDate } : {}),
          ...(input.repeatType ? { repeatType: input.repeatType } : {}),
          ...(input.repeatDays !== undefined ? { repeatDays: input.repeatDays } : {}),
          ...(input.repeatUntil !== undefined ? { repeatUntil: input.repeatUntil ? new Date(input.repeatUntil) : null } : {}),
          updatedAt: new Date(),
        })
        .where(eq(scheduledNotifications.id, input.id));

      return { success: true };
    }),

  /**
   * Zamanlanmış bildirimi iptal et
   */
  cancel: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [existing] = await dbInstance
        .select()
        .from(scheduledNotifications)
        .where(eq(scheduledNotifications.id, input.id))
        .limit(1);

      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Bildirim bulunamadı" });
      if (existing.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sadece bekleyen bildirimler iptal edilebilir" });
      }

      await dbInstance
        .update(scheduledNotifications)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(scheduledNotifications.id, input.id));

      return { success: true };
    }),

  /**
   * Zamanlanmış bildirimi sil
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await dbInstance
        .delete(scheduledNotifications)
        .where(eq(scheduledNotifications.id, input.id));

      return { success: true };
    }),

  /**
   * Hemen test gönderimi (zamanlamayı atla)
   */
  sendNow: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [notif] = await dbInstance
        .select()
        .from(scheduledNotifications)
        .where(eq(scheduledNotifications.id, input.id))
        .limit(1);

      if (!notif) throw new TRPCError({ code: "NOT_FOUND", message: "Bildirim bulunamadı" });
      if (notif.status === "cancelled") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "İptal edilmiş bildirim gönderilemez" });
      }

      // scheduledAt'ı şimdiye çek ki cron hemen işlesin
      await dbInstance
        .update(scheduledNotifications)
        .set({
          scheduledAt: new Date(Date.now() - 1000), // 1 saniye önce
          status: "pending",
          updatedAt: new Date(),
        })
        .where(eq(scheduledNotifications.id, input.id));

      // Hemen işle
      await processScheduledNotifications();

      return { success: true, message: "Bildirim hemen gönderildi" };
    }),

  /**
   * İstatistikler
   */
  getStats: adminProcedure.query(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return null;

    const [pending] = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(scheduledNotifications)
      .where(eq(scheduledNotifications.status, "pending"));

    const [sent] = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(scheduledNotifications)
      .where(eq(scheduledNotifications.status, "sent"));

    const [cancelled] = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(scheduledNotifications)
      .where(eq(scheduledNotifications.status, "cancelled"));

    const [failed] = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(scheduledNotifications)
      .where(eq(scheduledNotifications.status, "failed"));

    return {
      pending: Number(pending?.count || 0),
      sent: Number(sent?.count || 0),
      cancelled: Number(cancelled?.count || 0),
      failed: Number(failed?.count || 0),
    };
  }),
});
