import webpush from "web-push";
import { getDb } from "./db";
import { pushTokens } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Configure VAPID
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_EMAIL = "mailto:admin@fastlygo.mk";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  imageUrl?: string;
  actionUrl?: string;
}

/**
 * Send push notification to a single subscription
 */
async function sendToSubscription(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify(payload)
    );
    return true;
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    // 410 Gone = subscription expired, mark inactive
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      const dbInstance = await getDb();
      if (dbInstance) {
        await dbInstance
          .update(pushTokens)
          .set({ isActive: false })
          .where(eq(pushTokens.endpoint, endpoint));
      }
    }
    console.error("[WebPush] Send error:", error?.message || err);
    return false;
  }
}

/**
 * Send push notification to all active web subscribers
 * Optionally filter by userId or role
 */
export async function sendWebPushToAll(
  payload: PushPayload,
  options?: {
    userIds?: number[];
  }
): Promise<{ sent: number; failed: number }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[WebPush] VAPID keys not configured");
    return { sent: 0, failed: 0 };
  }

  const dbInstance = await getDb();
  if (!dbInstance) return { sent: 0, failed: 0 };

  // Get active web push tokens
  let query = dbInstance
    .select()
    .from(pushTokens)
    .where(
      and(
        eq(pushTokens.platform, "web"),
        eq(pushTokens.isActive, true)
      )
    );

  const tokens = await query;

  // Filter by userIds if specified
  const filtered = options?.userIds
    ? tokens.filter((t) => t.userId && options.userIds!.includes(t.userId))
    : tokens;

  let sent = 0;
  let failed = 0;

  for (const token of filtered) {
    if (!token.endpoint || !token.p256dh || !token.auth) continue;

    const ok = await sendToSubscription(
      token.endpoint,
      token.p256dh,
      token.auth,
      payload
    );
    if (ok) sent++;
    else failed++;
  }

  return { sent, failed };
}
