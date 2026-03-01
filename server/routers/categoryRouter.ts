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

export const categoryRouter = router({
  // Public: List all active categories
  list: publicProcedure.query(async () => {
    return await db.getActiveCategories();
  }),
  
  // Public: Get category by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const category = await db.getCategoryBySlug(input.slug);
      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
      }
      return category;
    }),
  
  // Admin: List all categories (including inactive)
  listAll: adminProcedure.query(async () => {
    return await db.getAllCategories();
  }),
  
  // Admin: Create category
  create: adminProcedure
    .input(z.object({
      slug: z.string(),
      icon: z.string(),
      shortName: z.string(), // JSON string
      seoMeta: z.string(), // JSON string
      active: z.boolean().default(true),
      displayOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      return await db.createCategory(input);
    }),
  
  // Admin: Update category
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      slug: z.string().optional(),
      icon: z.string().optional(),
      shortName: z.string().optional(),
      active: z.boolean().optional(),
      displayOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await db.updateCategory(id, updates);
      return { success: true };
    }),
  
  // Admin: Delete category
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteCategory(input.id);
      return { success: true };
    }),
});
