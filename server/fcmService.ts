/**
 * FCM HTTP v1 API Service
 * 
 * Firebase Cloud Messaging HTTP v1 API kullanarak mobil cihazlara
 * push notification gönderir.
 * 
 * Authentication: OAuth2 access token (gcloud auth print-access-token)
 * 
 * NOT: Token 1 saat geçerlidir. Yenilemek için:
 *   gcloud auth print-access-token
 * 
 * Uzun vadeli çözüm için Workload Identity Federation kullanılabilir.
 */

import { getDb } from "./db";
import { fcmTokens } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const FCM_PROJECT_ID = process.env.FCM_PROJECT_ID || "fastlygo1";
const FCM_V1_ENDPOINT = `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`;

export interface FcmPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

/**
 * Get the current FCM access token from environment
 */
function getAccessToken(): string | null {
  return process.env.FCM_ACCESS_TOKEN || null;
}

/**
 * Send FCM notification to a single device token
 */
async function sendToDevice(
  deviceToken: string,
  payload: FcmPayload,
  platform: "ios" | "android" | "web"
): Promise<{ success: boolean; error?: string }> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return { success: false, error: "FCM_ACCESS_TOKEN not configured" };
  }

  const message: Record<string, unknown> = {
    token: deviceToken,
    notification: {
      title: payload.title,
      body: payload.body,
      ...(payload.imageUrl ? { image: payload.imageUrl } : {}),
    },
    data: payload.data || {},
  };

  // Platform-specific config
  if (platform === "android") {
    message.android = {
      priority: "high",
      notification: {
        sound: "default",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    };
  } else if (platform === "ios") {
    message.apns = {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    };
  }

  try {
    const response = await fetch(FCM_V1_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ message }),
    });

    const responseData = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      const errorInfo = responseData as { error?: { message?: string; status?: string } };
      const errorMsg = errorInfo?.error?.message || `HTTP ${response.status}`;
      const errorStatus = errorInfo?.error?.status || "";
      
      // Token geçersiz veya kayıtlı değil - deaktive et
      if (
        errorStatus === "UNREGISTERED" ||
        errorStatus === "INVALID_ARGUMENT" ||
        response.status === 404
      ) {
        return { success: false, error: `TOKEN_INVALID:${errorMsg}` };
      }
      
      // Token süresi dolmuş (401) - access token yenilenmeli
      if (response.status === 401) {
        return { success: false, error: `AUTH_EXPIRED:${errorMsg}` };
      }

      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

/**
 * Send FCM notification to all active devices of a user
 */
export async function sendFcmToUser(
  userId: number,
  payload: FcmPayload
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    console.warn("[FCM] FCM_ACCESS_TOKEN not configured. Skipping FCM notification.");
    return { sent: 0, failed: 0, errors: ["FCM_ACCESS_TOKEN not configured"] };
  }

  const dbInstance = await getDb();
  if (!dbInstance) return { sent: 0, failed: 0, errors: ["Database not available"] };

  const tokens = await dbInstance
    .select()
    .from(fcmTokens)
    .where(
      and(
        eq(fcmTokens.userId, userId),
        eq(fcmTokens.isActive, true)
      )
    );

  if (tokens.length === 0) {
    console.log(`[FCM] No active tokens for user ${userId}`);
    return { sent: 0, failed: 0, errors: [] };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const tokenRow of tokens) {
    if (!tokenRow.token) continue;

    const platform = (tokenRow.deviceType as "ios" | "android" | "web") || "android";
    const result = await sendToDevice(tokenRow.token, payload, platform);

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(result.error || "Unknown error");

      // Geçersiz token'ı deaktive et
      if (result.error?.startsWith("TOKEN_INVALID:")) {
        await dbInstance
          .update(fcmTokens)
          .set({ isActive: false })
          .where(eq(fcmTokens.id, tokenRow.id));
        console.log(`[FCM] Deactivated invalid token for user ${userId}`);
      }
    }
  }

  console.log(`[FCM] User ${userId}: sent=${sent}, failed=${failed}`);
  return { sent, failed, errors };
}

/**
 * Send FCM notification to multiple users
 */
export async function sendFcmToUsers(
  userIds: number[],
  payload: FcmPayload
): Promise<{ totalSent: number; totalFailed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendFcmToUser(userId, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { totalSent, totalFailed };
}

/**
 * Send FCM notification to ALL users with active tokens
 */
export async function sendFcmToAllUsers(
  payload: FcmPayload
): Promise<{ sent: number; failed: number; total: number; errors: string[] }> {
  const dbInstance = await getDb();
  if (!dbInstance) return { sent: 0, failed: 0, total: 0, errors: ["Database not available"] };

  const allTokens = await dbInstance
    .select()
    .from(fcmTokens)
    .where(eq(fcmTokens.isActive, true));

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const tokenRow of allTokens) {
    if (!tokenRow.token) continue;
    const platform = (tokenRow.deviceType as "ios" | "android" | "web") || "android";
    const result = await sendToDevice(tokenRow.token, payload, platform);
    if (result.success) {
      sent++;
    } else {
      failed++;
      if (result.error) errors.push(result.error);
      // Deactivate invalid tokens
      if (result.error?.startsWith("TOKEN_INVALID:")) {
        await dbInstance.update(fcmTokens).set({ isActive: false }).where(eq(fcmTokens.id, tokenRow.id));
      }
    }
  }

  console.log(`[FCM] sendToAll: total=${allTokens.length}, sent=${sent}, failed=${failed}`);
  return { sent, failed, total: allTokens.length, errors };
}

/**
 * Send FCM notification to a specific device token directly
 * (Useful for testing)
 */
export async function sendFcmToToken(
  token: string,
  payload: FcmPayload,
  platform: "ios" | "android" | "web" = "android"
): Promise<{ success: boolean; error?: string }> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return { success: false, error: "FCM_ACCESS_TOKEN not configured" };
  }
  return sendToDevice(token, payload, platform);
}

/**
 * Check if FCM is configured and ready
 */
export function isFcmConfigured(): boolean {
  return !!getAccessToken();
}
