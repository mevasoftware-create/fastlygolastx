import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";

export type PushNotificationPayload = {
  userId: number;
  title: string;
  content: string;
  data?: Record<string, any>;
};

const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 500;

/**
 * Send push notification to a specific user via Manus Notification API
 * This uses the built-in notification system that works with the Management UI
 */
export async function sendPushNotification(
  payload: PushNotificationPayload
): Promise<boolean> {
  const { userId, title, content, data } = payload;

  // Validate inputs
  if (!title || title.trim().length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }

  if (!content || content.trim().length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  // Check if notification service is configured
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    console.warn("[PushNotification] Notification service not configured");
    return false;
  }

  try {
    // Use Manus built-in notification API
    const endpoint = `${ENV.forgeApiUrl}/webdevtoken.v1.WebDevService/SendNotification`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({
        title: title.trim(),
        content: content.trim(),
        // Additional metadata can be passed here
        metadata: {
          userId,
          timestamp: new Date().toISOString(),
          ...data,
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[PushNotification] Failed to send notification (${response.status})${
          detail ? `: ${detail}` : ""
        }`
      );
      return false;
    }

    console.log(`[PushNotification] Sent to user ${userId}: ${title}`);
    return true;
  } catch (error) {
    console.warn("[PushNotification] Error sending notification:", error);
    return false;
  }
}

/**
 * Helper functions for common notification scenarios
 */
export const NotificationTemplates = {
  orderCreated: (orderId: number, orderNumber: string) => ({
    title: "Sipariş Oluşturuldu",
    content: `Siparişiniz (#${orderNumber}) başarıyla oluşturuldu. Kurye ataması bekleniyor.`,
    data: { orderId, orderNumber, type: "order_created" },
  }),

  orderAccepted: (orderId: number, orderNumber: string, courierName: string) => ({
    title: "Sipariş Kabul Edildi",
    content: `${courierName} siparişinizi (#${orderNumber}) kabul etti. Yakında yola çıkacak.`,
    data: { orderId, orderNumber, type: "order_accepted" },
  }),

  orderPickedUp: (orderId: number, orderNumber: string) => ({
    title: "Paket Alındı",
    content: `Kurye paketinizi (#${orderNumber}) teslim aldı. Yolda!`,
    data: { orderId, orderNumber, type: "order_picked_up" },
  }),

  orderDelivered: (orderId: number, orderNumber: string) => ({
    title: "Teslimat Tamamlandı",
    content: `Siparişiniz (#${orderNumber}) başarıyla teslim edildi. Kuryeyi değerlendirin!`,
    data: { orderId, orderNumber, type: "order_delivered" },
  }),

  newOrderForCourier: (orderId: number, orderNumber: string, distance: string) => ({
    title: "Yeni Sipariş Teklifi",
    content: `${distance} mesafede yeni bir sipariş (#${orderNumber}) var. Kabul etmek ister misiniz?`,
    data: { orderId, orderNumber, type: "new_order_courier" },
  }),

  courierApproved: () => ({
    title: "Kurye Başvurunuz Onaylandı",
    content: "Tebrikler! Kurye başvurunuz onaylandı. Artık sipariş kabul edebilirsiniz.",
    data: { type: "courier_approved" },
  }),

  businessApproved: () => ({
    title: "İşletme Kaydınız Onaylandı",
    content: "Tebrikler! İşletme kaydınız onaylandı. Artık sipariş oluşturabilirsiniz.",
    data: { type: "business_approved" },
  }),

  paymentRequestApproved: (amount: number) => ({
    title: "Ödeme Talebiniz Onaylandı",
    content: `${amount} TL ödeme talebiniz onaylandı. Hesabınıza yakında yatırılacak.`,
    data: { amount, type: "payment_approved" },
  }),
};
