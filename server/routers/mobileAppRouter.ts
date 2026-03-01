import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { appVersions } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const mobileAppRouter = router({
  /**
   * Check app version and get update info
   */
  checkVersion: publicProcedure
    .input(z.object({
      platform: z.enum(["ios", "android"]),
      currentVersion: z.string(),
      buildNumber: z.number(),
    }))
    .query(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        return {
          updateAvailable: false,
          forceUpdate: false,
          latestVersion: input.currentVersion,
          downloadUrl: null,
          releaseNotes: null,
        };
      }

      // Get latest version for platform
      const latest = await dbInstance
        .select()
        .from(appVersions)
        .where(
          and(
            eq(appVersions.platform, input.platform),
            eq(appVersions.isActive, true)
          )
        )
        .orderBy(desc(appVersions.buildNumber))
        .limit(1);

      if (latest.length === 0) {
        return {
          updateAvailable: false,
          forceUpdate: false,
          latestVersion: input.currentVersion,
          downloadUrl: null,
          releaseNotes: null,
        };
      }

      const latestVersion = latest[0];
      const updateAvailable = latestVersion.buildNumber > input.buildNumber;

      // Check if current version is below minimum supported
      let forceUpdate = false;
      if (latestVersion.minSupportedVersion) {
        forceUpdate = compareVersions(input.currentVersion, latestVersion.minSupportedVersion) < 0;
      }

      // Override with explicit force update flag
      if (latestVersion.forceUpdate) {
        forceUpdate = true;
      }

      return {
        updateAvailable,
        forceUpdate,
        latestVersion: latestVersion.version,
        latestBuildNumber: latestVersion.buildNumber,
        downloadUrl: latestVersion.downloadUrl,
        releaseNotes: latestVersion.releaseNotes,
      };
    }),

  /**
   * Get QR code data for web-to-mobile login
   */
  generateQRLogin: protectedProcedure.mutation(async ({ ctx }) => {
    // Generate a temporary token for QR code
    const token = `${ctx.user.id}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    // In production, store this token in database with expiry
    // For now, we'll use a simple JWT-like structure
    const qrData = Buffer.from(JSON.stringify({
      userId: ctx.user.id,
      email: ctx.user.email,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
    })).toString('base64');

    return {
      qrData,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    };
  }),

  /**
   * Verify QR code and login on mobile
   */
  verifyQRLogin: publicProcedure
    .input(z.object({
      qrData: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Decode QR data
        const decoded = JSON.parse(Buffer.from(input.qrData, 'base64').toString());
        
        // Check expiry
        if (new Date(decoded.expiresAt) < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "QR code expired" });
        }

        // In production, verify token against database
        // For now, return user info
        return {
          success: true,
          userId: decoded.userId,
          email: decoded.email,
          token: decoded.token,
        };
      } catch (error) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid QR code" });
      }
    }),

  /**
   * Get app configuration for mobile
   */
  getConfig: publicProcedure.query(async () => {
    // Return app-wide configuration
    return {
      features: {
        googleOAuth: true,
        appleOAuth: false,
        facebookOAuth: false,
        biometricAuth: true,
        offlineMode: true,
      },
      limits: {
        maxUploadSizeMB: 10,
        maxImagesPerOrder: 5,
      },
      pricing: {
        currency: "EUR",
        currencySymbol: "€",
      },
      support: {
        email: "support@rtransfer.com",
        phone: "+1234567890",
      },
    };
  }),

  /**
   * Report app crash/error (for debugging)
   */
  reportError: protectedProcedure
    .input(z.object({
      errorType: z.string(),
      errorMessage: z.string(),
      stackTrace: z.string().optional(),
      deviceInfo: z.object({
        platform: z.enum(["ios", "android"]),
        version: z.string(),
        buildNumber: z.number(),
        osVersion: z.string().optional(),
        deviceModel: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // Log error for debugging
      console.error("[Mobile App Error]", {
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        ...input,
        timestamp: new Date().toISOString(),
      });

      // In production, send to error tracking service (Sentry, etc.)
      
      return { success: true };
    }),

  /**
   * Sync offline data
   */
  syncOfflineData: protectedProcedure
    .input(z.object({
      lastSyncAt: z.date().optional(),
      pendingActions: z.array(z.object({
        type: z.string(),
        data: z.any(),
        timestamp: z.date(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Process pending actions from offline mode
      // This is a placeholder - implement based on your needs
      
      return {
        success: true,
        syncedAt: new Date(),
        conflicts: [], // Any data conflicts that need resolution
      };
    }),
});

/**
 * Compare semantic versions (e.g., "1.2.3" vs "1.2.0")
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
}
