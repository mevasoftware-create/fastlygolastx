import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { referrals, users, userWallets, walletTransactions } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

// Referral reward amount in cents (e.g., 500 = €5.00)
const REFERRAL_REWARD = 500;

export const referralRouter = router({
  /**
   * Get my referral code
   */
  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    // Generate unique referral code based on user ID
    const code = `REF${ctx.user.id.toString().padStart(6, '0')}`;
    
    const dbInstance = await getDb();
    if (!dbInstance) {
      return { code, stats: { total: 0, completed: 0, rewarded: 0 } };
    }

    // Get referral stats
    const stats = await dbInstance
      .select({
        total: sql<number>`COUNT(*)`,
        completed: sql<number>`SUM(CASE WHEN ${referrals.status} = 'completed' THEN 1 ELSE 0 END)`,
        rewarded: sql<number>`SUM(CASE WHEN ${referrals.status} = 'rewarded' THEN 1 ELSE 0 END)`,
      })
      .from(referrals)
      .where(eq(referrals.referrerId, ctx.user.id));

    return {
      code,
      stats: {
        total: Number(stats[0]?.total || 0),
        completed: Number(stats[0]?.completed || 0),
        rewarded: Number(stats[0]?.rewarded || 0),
      },
    };
  }),

  /**
   * Apply a referral code during registration
   */
  applyCode: protectedProcedure
    .input(z.object({
      code: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Check if user already used a referral code
      const existing = await dbInstance
        .select()
        .from(referrals)
        .where(eq(referrals.referredId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You already used a referral code" });
      }

      // Extract referrer ID from code (format: REF000123)
      const match = input.code.match(/^REF(\d{6})$/);
      if (!match) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid referral code format" });
      }

      const referrerId = parseInt(match[1], 10);

      // Check if referrer exists
      const referrer = await dbInstance
        .select()
        .from(users)
        .where(eq(users.id, referrerId))
        .limit(1);

      if (referrer.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Referral code not found" });
      }

      // Can't refer yourself
      if (referrerId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot use your own referral code" });
      }

      // Create referral record
      await dbInstance.insert(referrals).values({
        referrerId,
        referredId: ctx.user.id,
        referralCode: input.code,
        status: "pending",
      });

      return { success: true, message: "Referral code applied successfully" };
    }),

  /**
   * Get my referrals
   */
  getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) return [];

    const myReferrals = await dbInstance
      .select({
        referral: referrals,
        referredUser: {
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        },
      })
      .from(referrals)
      .leftJoin(users, eq(referrals.referredId, users.id))
      .where(eq(referrals.referrerId, ctx.user.id));

    return myReferrals;
  }),

  /**
   * Admin: Mark referral as completed and reward
   */
  completeReferral: adminProcedure
    .input(z.object({
      referralId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Get referral
      const referral = await dbInstance
        .select()
        .from(referrals)
        .where(eq(referrals.id, input.referralId))
        .limit(1);

      if (referral.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Referral not found" });
      }

      if (referral[0].status === "rewarded") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Referral already rewarded" });
      }

      // Get or create wallet for referrer
      let wallet = await dbInstance
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, referral[0].referrerId))
        .limit(1);

      if (wallet.length === 0) {
        await dbInstance.insert(userWallets).values({
          userId: referral[0].referrerId,
          balance: 0,
        });
        wallet = await dbInstance
          .select()
          .from(userWallets)
          .where(eq(userWallets.userId, referral[0].referrerId))
          .limit(1);
      }

      const currentBalance = wallet[0].balance;
      const newBalance = currentBalance + REFERRAL_REWARD;

      // Update wallet balance
      await dbInstance
        .update(userWallets)
        .set({ balance: newBalance })
        .where(eq(userWallets.id, wallet[0].id));

      // Record transaction
      await dbInstance.insert(walletTransactions).values({
        walletId: wallet[0].id,
        type: "referral_bonus",
        amount: REFERRAL_REWARD,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: `Referral bonus for referring user ID ${referral[0].referredId}`,
      });

      // Update referral status
      await dbInstance
        .update(referrals)
        .set({
          status: "rewarded",
          rewardAmount: REFERRAL_REWARD,
          rewardedAt: sql`NOW()`,
        })
        .where(eq(referrals.id, input.referralId));

      return { success: true, rewardAmount: REFERRAL_REWARD };
    }),

  /**
   * Get referral statistics (admin)
   */
  getStats: adminProcedure.query(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) {
      return { total: 0, pending: 0, completed: 0, rewarded: 0, totalRewards: 0 };
    }

    const stats = await dbInstance
      .select({
        total: sql<number>`COUNT(*)`,
        pending: sql<number>`SUM(CASE WHEN ${referrals.status} = 'pending' THEN 1 ELSE 0 END)`,
        completed: sql<number>`SUM(CASE WHEN ${referrals.status} = 'completed' THEN 1 ELSE 0 END)`,
        rewarded: sql<number>`SUM(CASE WHEN ${referrals.status} = 'rewarded' THEN 1 ELSE 0 END)`,
        totalRewards: sql<number>`SUM(CASE WHEN ${referrals.status} = 'rewarded' THEN ${referrals.rewardAmount} ELSE 0 END)`,
      })
      .from(referrals);

    return {
      total: Number(stats[0]?.total || 0),
      pending: Number(stats[0]?.pending || 0),
      completed: Number(stats[0]?.completed || 0),
      rewarded: Number(stats[0]?.rewarded || 0),
      totalRewards: Number(stats[0]?.totalRewards || 0),
    };
  }),
});
