import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { orders, couriers, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { storagePut } from "../storage";

/**
 * Mobile API Router - Flutter uygulaması için endpoint'ler
 */
export const mobileRouter = router({
  /**
   * Kurye Puanlama
   * POST /api/trpc/mobile.rateCourier
   */
  rateCourier: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Veritabanı bağlantısı başarısız",
          });
        }

        // Siparişi kontrol et
        const order = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!order || order.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Sipariş bulunamadı",
          });
        }

        // Siparişin müşteriye ait olduğunu kontrol et
        if (order[0].customerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Bu siparişi puanlamaya yetkiniz yok",
          });
        }

        // Siparişin teslim edilmiş olduğunu kontrol et
        if (order[0].status !== "delivered") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Sadece teslim edilmiş siparişleri puanlayabilirsiniz",
          });
        }

        // Puanlamayı kaydet (orders tablosuna rating alanı eklenebilir)
        // TODO: orders tablosuna rating ve comment alanları ekle
        // await db.update(orders)
        //   .set({
        //     rating: input.rating,
        //     comment: input.comment,
        //   })
        //   .where(eq(orders.id, input.orderId));

        return {
          success: true,
          message: "Kurye başarıyla puanlandı",
          rating: input.rating,
        };
      } catch (error) {
        console.error("[Mobile] Rate courier error:", error);
        throw error;
      }
    }),

  /**
   * Sipariş İptali
   * POST /api/trpc/mobile.cancelOrder
   */
  cancelOrder: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        reason: z.string().min(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Veritabanı bağlantısı başarısız",
          });
        }

        // Siparişi kontrol et
        const order = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!order || order.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Sipariş bulunamadı",
          });
        }

        // Siparişin müşteriye ait olduğunu kontrol et
        if (order[0].customerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Bu siparişi iptal etmeye yetkiniz yok",
          });
        }

        // Siparişin iptal edilebilir durumda olduğunu kontrol et
        const cancelableStatuses = ["pending", "accepted", "assigned"];
        if (!cancelableStatuses.includes(order[0].status)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${order[0].status} durumundaki siparişler iptal edilemez`,
          });
        }

        // Siparişi iptal et
        await db
          .update(orders)
          .set({
            status: "cancelled",
          })
          .where(eq(orders.id, input.orderId));

        // TODO: cancelReason alanı orders tablosuna eklenebilir

        return {
          success: true,
          message: "Sipariş başarıyla iptal edildi",
        };
      } catch (error) {
        console.error("[Mobile] Cancel order error:", error);
        throw error;
      }
    }),

  /**
   * Promosyon Kodu Doğrulama
   * GET /api/trpc/mobile.validatePromoCode?code=KOD
   */
  validatePromoCode: protectedProcedure
    .input(z.object({ code: z.string().min(3) }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Veritabanı bağlantısı başarısız",
          });
        }

        // TODO: Promosyon kodları için database tablosu oluştur
        // Şimdilik örnek promosyon kodları
        const promoCodes: Record<
          string,
          { discountType: "percentage" | "fixed"; value: number; maxUses: number }
        > = {
          WELCOME10: { discountType: "percentage", value: 10, maxUses: 1 },
          SUMMER20: { discountType: "percentage", value: 20, maxUses: 100 },
          FAST50: { discountType: "fixed", value: 50, maxUses: 50 },
        };

        const promoCode = promoCodes[input.code.toUpperCase()];

        if (!promoCode) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Promosyon kodu geçersiz",
          });
        }

        return {
          success: true,
          code: input.code.toUpperCase(),
          discountType: promoCode.discountType,
          value: promoCode.value,
          message: `${promoCode.value}${
            promoCode.discountType === "percentage" ? "%" : "₺"
          } indirim uygulandı`,
        };
      } catch (error) {
        console.error("[Mobile] Validate promo code error:", error);
        throw error;
      }
    }),

  /**
   * Profil Fotoğrafı Yükleme
   * POST /api/trpc/mobile.uploadProfilePhoto (multipart/form-data)
   */
  uploadProfilePhoto: protectedProcedure
    .input(
      z.object({
        photoBase64: z.string(), // Base64 encoded image
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Veritabanı bağlantısı başarısız",
          });
        }

        // Base64'ü Buffer'a dönüştür
        const buffer = Buffer.from(input.photoBase64, "base64");

        // Dosya boyutunu kontrol et (5MB max)
        if (buffer.length > 5 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Dosya boyutu 5MB'dan büyük olamaz",
          });
        }

        // S3'e yükle
        const fileKey = `users/${ctx.user.id}/profile-photo-${Date.now()}.jpg`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Kullanıcı profil fotoğrafını güncelle
        // TODO: users tablosuna profilePhoto alanı ekle
        // await db.update(users)
        //   .set({ profilePhoto: url })
        //   .where(eq(users.id, ctx.user.id));

        return {
          success: true,
          photoUrl: url,
          message: "Profil fotoğrafı başarıyla yüklendi",
        };
      } catch (error) {
        console.error("[Mobile] Upload profile photo error:", error);
        throw error;
      }
    }),
});
