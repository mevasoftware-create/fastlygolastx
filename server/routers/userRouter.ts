import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";

export const userRouter = router({
  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        avatarUrl: z.string().optional(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      await dbInstance
        .update(users)
        .set({
          name: input.name,
          phone: input.phone,
          avatarUrl: input.avatarUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  /**
   * Change password
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.password) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found or password not set",
        });
      }

      const isValid = await bcryptjs.compare(input.currentPassword, user.password);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      const hashedPassword = await bcryptjs.hash(input.newPassword, 10);
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      await dbInstance
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  /**
   * Upload avatar
   */
  uploadAvatar: protectedProcedure
    .input(
      z.object({
        base64Image: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { storagePut } = await import("../storage");
      
      // Convert base64 to buffer
      const base64Data = input.base64Image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      // Generate unique filename
      const ext = input.mimeType.split("/")[1] || "jpg";
      const filename = `avatars/${ctx.user.id}-${Date.now()}.${ext}`;
      
      // Upload to S3
      const { url } = await storagePut(filename, buffer, input.mimeType);
      
      // Update user avatar URL in database
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }
      
      await dbInstance
        .update(users)
        .set({ avatarUrl: url, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));
      
      return { success: true, avatarUrl: url };
    }),

  /**
   * Get email preferences
   */
  getEmailPreferences: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Return default preferences
    return {
      orderConfirmation: true,
      courierAssigned: true,
      deliveryCompleted: true,
      promotions: true,
    };
  }),

  // Email preferences feature removed
});
