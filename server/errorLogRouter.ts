import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const errorLogRouter = router({
  /**
   * Log an error from frontend
   */
  logFrontendError: publicProcedure
    .input(z.object({
      errorType: z.string(),
      errorMessage: z.string(),
      stackTrace: z.string().optional(),
      url: z.string().optional(),
      userAgent: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.createErrorLog({
        errorType: input.errorType,
        errorMessage: input.errorMessage,
        stackTrace: input.stackTrace || null,
        url: input.url || null,
        userAgent: input.userAgent || null,
        source: "frontend" as const,
        severity: "medium" as const,
        userId: ctx.user?.id || null,
        userEmail: ctx.user?.email || null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      });
      
      return { success: true };
    }),

  /**
   * Get all error logs (admin only)
   */
  list: adminProcedure
    .input(z.object({
      source: z.enum(["frontend", "backend", "api"]).optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      resolved: z.boolean().optional(),
      userId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(500).default(100),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const logs = await db.getErrorLogs(input);
      return logs;
    }),

  /**
   * Get error log by ID (admin only)
   */
  getById: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const log = await db.getErrorLogById(input.id);
      if (!log) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Error log not found' });
      }
      return log;
    }),

  /**
   * Mark error as resolved (admin only)
   */
  resolve: adminProcedure
    .input(z.object({
      id: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.resolveErrorLog(input.id, ctx.user.id, input.notes);
      return { success: true };
    }),

  /**
   * Get error log statistics (admin only)
   */
  stats: adminProcedure
    .query(async () => {
      const stats = await db.getErrorLogStats();
      return stats;
    }),
});
