import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { pages } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const pagesRouter = router({
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(pages)
        .where(eq(pages.slug, input.slug))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    }),
});
