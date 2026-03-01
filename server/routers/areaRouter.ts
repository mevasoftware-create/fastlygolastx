import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const areaRouter = router({
  // Public: List all active areas
  list: publicProcedure.query(async () => {
    return await db.getActiveAreas();
  }),
  
  // Public: Get area by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const area = await db.getAreaBySlug(input.slug);
      if (!area) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Area not found' });
      }
      return area;
    }),
  
  // Admin: List all areas (including inactive)
  listAll: adminProcedure.query(async () => {
    return await db.getAllAreas();
  }),
  
  // Admin: Create area
  create: adminProcedure
    .input(z.object({
      slug: z.string(),
      translations: z.string(), // JSON string
      seoMeta: z.string(), // JSON string
      active: z.boolean().default(true),
      displayOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      return await db.createArea(input);
    }),
  
  // Admin: Update area
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      slug: z.string().optional(),
      active: z.boolean().optional(),
      displayOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await db.updateArea(id, updates);
      return { success: true };
    }),
  
  // Admin: Delete area
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteArea(input.id);
      return { success: true };
    }),
});
