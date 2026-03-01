import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { earnings, orders, couriers } from "../../drizzle/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const earningsRouter = router({
  // Get earnings statistics for current courier
  stats: protectedProcedure
    .input(z.object({
      period: z.enum(["daily", "weekly", "monthly"]).default("monthly"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get courier profile
      const courierProfile = await dbInstance
        .select()
        .from(couriers)
        .where(eq(couriers.userId, ctx.user.id))
        .limit(1);

      if (!courierProfile.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Courier profile not found" });
      }

      const courierId = courierProfile[0].id;

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      if (input.startDate) {
        startDate = new Date(input.startDate);
      } else {
        switch (input.period) {
          case "daily":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case "weekly":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "monthly":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        }
      }

      const endDate = input.endDate ? new Date(input.endDate) : now;

      // Get earnings in date range
      const earningsData = await dbInstance
        .select({
          totalAmount: sql<number>`SUM(${earnings.amount})`,
          totalCommission: sql<number>`SUM(COALESCE(${earnings.commissionAmount}, 0))`,
          count: sql<number>`COUNT(*)`,
        })
        .from(earnings)
        .where(and(
          eq(earnings.courierId, courierId),
          gte(earnings.createdAt, startDate),
          lte(earnings.createdAt, endDate)
        ));

      // Get completed deliveries count
      const completedDeliveries = await dbInstance
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(and(
          eq(orders.courierId, courierId),
          eq(orders.status, "delivered"),
          gte(orders.deliveredAt, startDate),
          lte(orders.deliveredAt, endDate)
        ));

      const totalAmount = Number(earningsData[0]?.totalAmount || 0);
      const totalCommission = Number(earningsData[0]?.totalCommission || 0);
      const deliveryCount = Number(completedDeliveries[0]?.count || 0);

      return {
        totalEarnings: totalAmount,
        totalCommission: totalCommission,
        netEarnings: totalAmount - totalCommission,
        deliveryCount: deliveryCount,
        averagePerDelivery: deliveryCount > 0 ? Math.round(totalAmount / deliveryCount) : 0,
        period: input.period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
    }),

  // Get earnings chart data
  chartData: protectedProcedure
    .input(z.object({
      period: z.enum(["daily", "weekly", "monthly"]).default("monthly"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get courier profile
      const courierProfile = await dbInstance
        .select()
        .from(couriers)
        .where(eq(couriers.userId, ctx.user.id))
        .limit(1);

      if (!courierProfile.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Courier profile not found" });
      }

      const courierId = courierProfile[0].id;

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      if (input.startDate) {
        startDate = new Date(input.startDate);
      } else {
        switch (input.period) {
          case "daily":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
            break;
          case "weekly":
            startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000); // Last 4 weeks
            break;
          case "monthly":
            startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1); // Last 6 months
            break;
        }
      }

      const endDate = input.endDate ? new Date(input.endDate) : now;

      // Get earnings grouped by date
      let groupByFormat: string;
      switch (input.period) {
        case "daily":
          groupByFormat = "%Y-%m-%d";
          break;
        case "weekly":
          groupByFormat = "%Y-%u"; // Year-Week
          break;
        case "monthly":
          groupByFormat = "%Y-%m";
          break;
      }

      const chartData = await dbInstance
        .select({
          date: sql<string>`DATE_FORMAT(${earnings.createdAt}, ${groupByFormat})`,
          totalAmount: sql<number>`SUM(${earnings.amount})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(earnings)
        .where(and(
          eq(earnings.courierId, courierId),
          gte(earnings.createdAt, startDate),
          lte(earnings.createdAt, endDate)
        ))
        .groupBy(sql`DATE_FORMAT(${earnings.createdAt}, ${groupByFormat})`)
        .orderBy(sql`DATE_FORMAT(${earnings.createdAt}, ${groupByFormat})`);

      return chartData.map(row => ({
        date: row.date,
        earnings: Number(row.totalAmount || 0),
        deliveries: Number(row.count || 0),
      }));
    }),

  // Get recent earnings list
  list: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get courier profile
      const courierProfile = await dbInstance
        .select()
        .from(couriers)
        .where(eq(couriers.userId, ctx.user.id))
        .limit(1);

      if (!courierProfile.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Courier profile not found" });
      }

      const courierId = courierProfile[0].id;

      const earningsList = await dbInstance
        .select({
          id: earnings.id,
          amount: earnings.amount,
          commissionAmount: earnings.commissionAmount,
          pricingScenario: earnings.pricingScenario,
          createdAt: earnings.createdAt,
          orderNumber: orders.orderNumber,
          orderType: orders.orderType,
        })
        .from(earnings)
        .leftJoin(orders, eq(earnings.orderId, orders.id))
        .where(eq(earnings.courierId, courierId))
        .orderBy(desc(earnings.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return earningsList;
    }),
});
