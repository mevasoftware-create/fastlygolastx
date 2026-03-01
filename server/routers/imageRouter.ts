import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  uploadOptimizedImages,
  validateImage,
  ImageSize,
} from "../utils/imageOptimizer";

export const imageRouter = router({
  /**
   * Upload and optimize image
   * Accepts base64 encoded image
   */
  upload: protectedProcedure
    .input(
      z.object({
        image: z.string(), // base64 encoded image
        key: z.string(), // S3 key prefix
        sizes: z
          .array(z.enum(["thumbnail", "small", "medium", "large"]))
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Decode base64
        const base64Data = input.image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Validate image
        const validation = await validateImage(buffer);
        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: validation.error || "Invalid image",
          });
        }

        // Generate unique key with user ID
        const uniqueKey = `users/${ctx.user.id}/${input.key}-${Date.now()}`;

        // Upload optimized images
        const urls = await uploadOptimizedImages(
          buffer,
          uniqueKey,
          input.sizes as ImageSize[] | undefined
        );

        return {
          success: true,
          urls,
        };
      } catch (error) {
        console.error("Image upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload image",
        });
      }
    }),
});
