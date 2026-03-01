import { ENV } from "./env";
import { emitToUser } from "./socket";
import { sendOrderStatusEmail } from "./emailNotification";

interface NotificationPayload {
  userId: number;
  title: string;
  message: string;
  type: "order" | "delivery" | "system" | "payment";
  relatedOrderId?: number;
  data?: Record<string, any>;
}

/**
 * Send push notification using Manus built-in notification API
 */
export async function sendPushNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const { getUserById } = await import("../db");
    const user = await getUserById(payload.userId);
    
    if (!user) {
      console.error(`[PushNotification] User not found: ${payload.userId}`);
      return false;
    }

    // Notification will be sent via Socket.IO (real-time) and email
    // Manus API integration removed

    // Also emit real-time notification via Socket.IO
    emitToUser(payload.userId, "notification:new", {
      title: payload.title,
      message: payload.message,
      type: payload.type,
      relatedOrderId: payload.relatedOrderId,
      timestamp: new Date(),
    });

    console.log(`[PushNotification] Sent to user ${payload.userId}: ${payload.title}`);
    return true;
  } catch (error) {
    console.error("[PushNotification] Error:", error);
    return false;
  }
}

/**
 * Send notification to multiple users
 */
export async function sendBulkNotifications(
  userIds: number[],
  title: string,
  message: string,
  type: "order" | "delivery" | "system" | "payment"
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  await Promise.all(
    userIds.map(async (userId) => {
      const result = await sendPushNotification({
        userId,
        title,
        message,
        type,
      });
      if (result) {
        success++;
      } else {
        failed++;
      }
    })
  );

  return { success, failed };
}

/**
 * Send notification when order status changes
 */
export async function notifyOrderStatusChange(
  orderId: number,
  customerId: number,
  courierId: number | null,
  status: string
): Promise<void> {
  const statusMessages: Record<string, { title: string; message: string }> = {
    accepted: {
      title: "Siparişiniz Kabul Edildi",
      message: "Kuryeniz siparişinizi kabul etti ve yola çıkıyor.",
    },
    picked_up: {
      title: "Sipariş Alındı",
      message: "Kuryeniz siparişinizi aldı ve size doğru yola çıktı.",
    },
    in_transit: {
      title: "Sipariş Yolda",
      message: "Kuryeniz size doğru geliyor. Canlı takip için uygulamayı açın.",
    },
    delivered: {
      title: "Sipariş Teslim Edildi",
      message: "Siparişiniz başarıyla teslim edildi. Bizi tercih ettiğiniz için teşekkürler!",
    },
    cancelled: {
      title: "Sipariş İptal Edildi",
      message: "Siparişiniz iptal edildi.",
    },
  };

  const notification = statusMessages[status];
  
  if (notification) {
    // Get customer email
    const { getUserById, getOrderById } = await import("../db");
    const customer = await getUserById(customerId);
    const order = await getOrderById(orderId);
    
    // Notify customer via push
    await sendPushNotification({
      userId: customerId,
      title: notification.title,
      message: notification.message,
      type: "order",
      relatedOrderId: orderId,
    });
    
    // Send email notification
    if (customer?.email && order) {
      const trackingUrl = `${process.env.FRONTEND_URL || 'https://fastlygo.com'}/track-order?id=${orderId}`;
      await sendOrderStatusEmail(
        customer.email,
        order.orderNumber,
        status,
        trackingUrl
      );
    }

    // Notify courier if assigned
    if (courierId && status === "accepted") {
      await sendPushNotification({
        userId: courierId,
        title: "Yeni Sipariş",
        message: "Yeni bir sipariş kabul ettiniz. Detaylar için uygulamayı açın.",
        type: "order",
        relatedOrderId: orderId,
      });
    }
  }
}

/**
 * Send notification when new order is created
 */
export async function notifyNewOrder(orderId: number, customerId: number): Promise<void> {
  await sendPushNotification({
    userId: customerId,
    title: "Sipariş Oluşturuldu",
    message: "Siparişiniz başarıyla oluşturuldu. Kurye araması yapılıyor...",
    type: "order",
    relatedOrderId: orderId,
  });
}

/**
 * Send notification to all available couriers about new order
 */
export async function notifyAvailableCouriers(orderId: number): Promise<void> {
  try {
    const { getAvailableCouriers } = await import("../db");
    const couriers = await getAvailableCouriers();
    
    if (couriers.length === 0) {
      console.log("[PushNotification] No available couriers to notify");
      return;
    }

    await sendBulkNotifications(
      couriers.map(c => c.userId),
      "Yeni Sipariş Mevcut",
      "Size yakın yeni bir sipariş var. Hemen kabul edin!",
      "order"
    );
  } catch (error) {
    console.error("[PushNotification] Failed to notify couriers:", error);
  }
}

/**
 * Send notification when courier is approved
 */
export async function notifyCourierApproved(userId: number): Promise<void> {
  await sendPushNotification({
    userId,
    title: "Kurye Başvurunuz Onaylandı! 🎉",
    message: "Tebrikler! Artık sipariş kabul edebilir ve kazanmaya başlayabilirsiniz.",
    type: "system",
  });
}

/**
 * Send notification when courier is rejected
 */
export async function notifyCourierRejected(userId: number): Promise<void> {
  await sendPushNotification({
    userId,
    title: "Kurye Başvurunuz",
    message: "Maalesef başvurunuz şu anda onaylanamadı. Daha fazla bilgi için destek ekibiyle iletişime geçebilirsiniz.",
    type: "system",
  });
}

/**
 * Send notification when business is approved
 */
export async function notifyBusinessApproved(userId: number): Promise<void> {
  await sendPushNotification({
    userId,
    title: "İşletme Kaydınız Onaylandı! 🎉",
    message: "Tebrikler! Artık sipariş oluşturabilir ve teslimat hizmetimizden yararlanabilirsiniz.",
    type: "system",
  });
}

/**
 * Send notification when business is rejected
 */
export async function notifyBusinessRejected(userId: number): Promise<void> {
  await sendPushNotification({
    userId,
    title: "İşletme Kaydınız",
    message: "Maalesef kaydınız şu anda onaylanamadı. Daha fazla bilgi için destek ekibiyle iletişime geçebilirsiniz.",
    type: "system",
  });
}

/**
 * Send notification when payment request is approved
 */
export async function notifyPaymentApproved(userId: number, amount: number): Promise<void> {
  await sendPushNotification({
    userId,
    title: "Ödeme Talebiniz Onaylandı 💰",
    message: `${amount} TL ödeme talebiniz onaylandı. Para hesabınıza 1-3 iş günü içinde yatırılacak.`,
    type: "payment",
  });
}

/**
 * Send notification when payment request is rejected
 */
export async function notifyPaymentRejected(userId: number, amount: number, reason?: string): Promise<void> {
  await sendPushNotification({
    userId,
    title: "Ödeme Talebi Reddedildi",
    message: reason || `${amount} TL ödeme talebiniz reddedildi. Detaylar için destek ekibiyle iletişime geçin.`,
    type: "payment",
  });
}
