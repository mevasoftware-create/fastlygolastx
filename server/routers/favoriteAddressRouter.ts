import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { favoriteAddresses } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const favoriteAddressRouter = router({
  /**
   * Create a favorite address
   */
  create: protectedProcedure
    .input(z.object({
      label: z.string(),
      address: z.string(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      isDefault: z.enum(["0", "1"]).default("0"),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // If setting as default, unset other defaults
      if (input.isDefault === "1") {
        await dbInstance
          .update(favoriteAddresses)
          .set({ isDefault: "0" })
          .where(eq(favoriteAddresses.userId, ctx.user.id));
      }

      await dbInstance.insert(favoriteAddresses).values({
        userId: ctx.user.id,
        label: input.label,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        isDefault: input.isDefault,
      });

      return { success: true };
    }),

  /**
   * List user's favorite addresses
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) return [];

    const addresses = await dbInstance
      .select()
      .from(favoriteAddresses)
      .where(eq(favoriteAddresses.userId, ctx.user.id));

    return addresses;
  }),

  /**
   * Get a specific favorite address
   */
  get: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) return null;

      const address = await dbInstance
        .select()
        .from(favoriteAddresses)
        .where(
          and(
            eq(favoriteAddresses.id, input.id),
            eq(favoriteAddresses.userId, ctx.user.id)
          )
        )
        .limit(1);

      return address.length > 0 ? address[0] : null;
    }),

  /**
   * Update a favorite address
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      label: z.string().optional(),
      address: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      isDefault: z.enum(["0", "1"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Verify ownership
      const existing = await dbInstance
        .select()
        .from(favoriteAddresses)
        .where(
          and(
            eq(favoriteAddresses.id, input.id),
            eq(favoriteAddresses.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Address not found" });
      }

      // If setting as default, unset other defaults
      if (input.isDefault === "1") {
        await dbInstance
          .update(favoriteAddresses)
          .set({ isDefault: "0" })
          .where(eq(favoriteAddresses.userId, ctx.user.id));
      }

      const { id, ...updateData } = input;
      await dbInstance
        .update(favoriteAddresses)
        .set(updateData)
        .where(eq(favoriteAddresses.id, input.id));

      return { success: true };
    }),

  /**
   * Delete a favorite address
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Verify ownership
      const existing = await dbInstance
        .select()
        .from(favoriteAddresses)
        .where(
          and(
            eq(favoriteAddresses.id, input.id),
            eq(favoriteAddresses.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Address not found" });
      }

      await dbInstance
        .delete(favoriteAddresses)
        .where(eq(favoriteAddresses.id, input.id));

      return { success: true };
    }),

  /**
   * Get default address
   */
  getDefault: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) return null;

    const address = await dbInstance
      .select()
      .from(favoriteAddresses)
      .where(
        and(
          eq(favoriteAddresses.userId, ctx.user.id),
          eq(favoriteAddresses.isDefault, "1")
        )
      )
      .limit(1);

    return address.length > 0 ? address[0] : null;
  }),
});
