import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const pagesRouter = router({
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return await db.getPageBySlug(input.slug);
    }),

  listAll: adminProcedure.query(async () => {
    return await db.getAllPages();
  }),

  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const page = await db.getPageById(input.id);
      if (!page) throw new TRPCError({ code: 'NOT_FOUND', message: 'Page not found' });
      return page;
    }),

  create: adminProcedure
    .input(z.object({
      slug: z.string().min(1),
      seoMeta: z.string(),
      active: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      return await db.createPage(input);
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      slug: z.string().optional(),
      seoMeta: z.string().optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await db.updatePage(id, updates);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deletePage(input.id);
      return { success: true };
    }),
});
