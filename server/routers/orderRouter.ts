import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { orders, priceIncreaseHistory, couriers, users } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Order Router - Sipariş yönetimi ve fiyat teklifi sistemi
 */
export const orderRouter = router({
  /**
   * Müşteri Fiyat Teklifi - Hesaplanan fiyattan daha yüksek teklif verme
   * POST /api/trpc/order.offerPrice
   */
  offerPrice: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        offeredPrice: z.number().min(1), // in cents
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Siparişi kontrol et
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Müşteriye ait olduğunu kontrol et
        if (order.customerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to modify this order",
          });
        }

        // Sadece pending durumundaki siparişler için teklif verilebilir
        if (order.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You can only offer price for pending orders",
          });
        }

        // Teklif edilen fiyat hesaplanan fiyattan düşük olamaz
        const calculatedPrice = order.calculatedPrice || order.totalFee;
        if (input.offeredPrice < calculatedPrice) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Offered price must be at least ${calculatedPrice} cents`,
          });
        }

        // Fiyat teklifini kaydet
        await db
          .update(orders)
          .set({
            offeredPrice: input.offeredPrice,
            currentPrice: input.offeredPrice,
          })
          .where(eq(orders.id, input.orderId));

        return {
          success: true,
          message: "Price offer submitted successfully",
          orderId: input.orderId,
          offeredPrice: input.offeredPrice,
        };
      } catch (error) {
        console.error("[Order] Offer price error:", error);
        throw error;
      }
    }),

  /**
   * Fiyat Artırma - "Kurye Bekleniyor" durumundaki siparişler için
   * POST /api/trpc/order.increasePrice
   */
  increasePrice: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        newPrice: z.number().min(1), // in cents
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Siparişi kontrol et
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Müşteriye ait olduğunu kontrol et
        if (order.customerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to modify this order",
          });
        }

        // Sadece pending durumundaki siparişler için fiyat artırılabilir
        if (order.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You can only increase price for pending orders",
          });
        }

        const currentPrice = order.currentPrice || order.offeredPrice || order.totalFee;

        // Yeni fiyat mevcut fiyattan yüksek olmalı
        if (input.newPrice <= currentPrice) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `New price must be higher than current price (${currentPrice} cents)`,
          });
        }

        const increaseAmount = input.newPrice - currentPrice;

        // Fiyat artırma geçmişini kaydet
        await db.insert(priceIncreaseHistory).values({
          orderId: input.orderId,
          customerId: ctx.user.id,
          previousPrice: currentPrice,
          newPrice: input.newPrice,
          increaseAmount: increaseAmount,
          reason: input.reason,
        });

        // Sipariş fiyatını güncelle
        await db
          .update(orders)
          .set({
            currentPrice: input.newPrice,
          })
          .where(eq(orders.id, input.orderId));

        return {
          success: true,
          message: "Price increased successfully",
          orderId: input.orderId,
          previousPrice: currentPrice,
          newPrice: input.newPrice,
          increaseAmount: increaseAmount,
        };
      } catch (error) {
        console.error("[Order] Increase price error:", error);
        throw error;
      }
    }),

  /**
   * Fiyat Artırma Geçmişi - Bir siparişin fiyat artırma geçmişini getir
   * GET /api/trpc/order.getPriceHistory
   */
  getPriceHistory: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Siparişi kontrol et
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Müşteriye ait olduğunu kontrol et
        if (order.customerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view this order's history",
          });
        }

        // Fiyat artırma geçmişini getir
        const history = await db
          .select()
          .from(priceIncreaseHistory)
          .where(eq(priceIncreaseHistory.orderId, input.orderId))
          .orderBy(desc(priceIncreaseHistory.createdAt));

        return {
          success: true,
          orderId: input.orderId,
          history: history,
        };
      } catch (error) {
        console.error("[Order] Get price history error:", error);
        throw error;
      }
    }),

  /**
   * Kurye için Uygun Siparişler - Mesafe ve fiyat bilgisi ile
   * GET /api/trpc/order.getAvailableOrders
   */
  getAvailableOrders: protectedProcedure
    .input(
      z.object({
        courierLatitude: z.string(),
        courierLongitude: z.string(),
        maxDistance: z.number().optional().default(10000), // meters
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Kullanıcının kurye olduğunu kontrol et
        if (ctx.user.role !== "courier") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only couriers can view available orders",
          });
        }

        // Pending durumundaki siparişleri getir
        const availableOrders = await db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            pickupAddress: orders.pickupAddress,
            pickupLatitude: orders.pickupLatitude,
            pickupLongitude: orders.pickupLongitude,
            deliveryAddress: orders.deliveryAddress,
            deliveryLatitude: orders.deliveryLatitude,
            deliveryLongitude: orders.deliveryLongitude,
            distance: orders.distance,
            currentPrice: orders.currentPrice,
            offeredPrice: orders.offeredPrice,
            totalFee: orders.totalFee,
            calculatedPrice: orders.calculatedPrice,
            packageSize: orders.packageSize,
            vehicleType: orders.vehicleType,
            createdAt: orders.createdAt,
            packageDescription: orders.packageDescription,
          })
          .from(orders)
          .where(eq(orders.status, "pending"))
          .orderBy(
            // Yüksek fiyatlı siparişler önce
            desc(
              sql`COALESCE(${orders.currentPrice}, ${orders.offeredPrice}, ${orders.totalFee})`
            )
          );

        // Her sipariş için kuryeye olan mesafeyi hesapla (basit Haversine)
        const ordersWithDistance = availableOrders.map((order) => {
          const pickupLat = parseFloat(order.pickupLatitude || "0");
          const pickupLon = parseFloat(order.pickupLongitude || "0");
          const courierLat = parseFloat(input.courierLatitude);
          const courierLon = parseFloat(input.courierLongitude);

          // Haversine formula
          const R = 6371000; // Earth radius in meters
          const φ1 = (pickupLat * Math.PI) / 180;
          const φ2 = (courierLat * Math.PI) / 180;
          const Δφ = ((courierLat - pickupLat) * Math.PI) / 180;
          const Δλ = ((courierLon - pickupLon) * Math.PI) / 180;

          const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distanceToCourier = Math.round(R * c);

          const displayPrice =
            order.currentPrice || order.offeredPrice || order.totalFee;

          return {
            ...order,
            distanceToCourier,
            displayPrice,
          };
        });

        // Maksimum mesafe filtreleme
        const filteredOrders = ordersWithDistance.filter(
          (order) => order.distanceToCourier <= input.maxDistance
        );

        return {
          success: true,
          orders: filteredOrders,
          count: filteredOrders.length,
        };
      } catch (error) {
        console.error("[Order] Get available orders error:", error);
        throw error;
      }
    }),

  /**
   * Kurye Sipariş Kabul
   * POST /api/trpc/order.acceptOrder
   */
  acceptOrder: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Kullanıcının kurye olduğunu kontrol et
        if (ctx.user.role !== "courier") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only couriers can accept orders",
          });
        }

        // Siparişi kontrol et
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Sipariş pending durumunda olmalı
        if (order.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This order is no longer available",
          });
        }

        // Siparişi kabul et
        await db
          .update(orders)
          .set({
            courierId: ctx.user.id,
            status: "accepted",
            acceptedAt: sql`NOW()`,
          })
          .where(eq(orders.id, input.orderId));

        return {
          success: true,
          message: "Order accepted successfully",
          orderId: input.orderId,
        };
      } catch (error) {
        console.error("[Order] Accept order error:", error);
        throw error;
      }
    }),

  /**
   * Kurye Sipariş Reddetme
   * POST /api/trpc/order.rejectOrder
   */
  rejectOrder: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Kullanıcının kurye olduğunu kontrol et
        if (ctx.user.role !== "courier") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only couriers can reject orders",
          });
        }

        // Siparişi kontrol et
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Sipariş pending durumunda olmalı
        if (order.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This order cannot be rejected",
          });
        }

        // Not: Reddetme işlemi için ayrı bir tablo oluşturulabilir
        // Şimdilik sadece log basıyoruz
        console.log(`[Order] Courier ${ctx.user.id} rejected order ${input.orderId}. Reason: ${input.reason}`);

        return {
          success: true,
          message: "Order rejected",
          orderId: input.orderId,
        };
      } catch (error) {
        console.error("[Order] Reject order error:", error);
        throw error;
      }
    }),
});
