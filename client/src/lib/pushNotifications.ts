/**
 * Push Notifications Manager
 * Handles browser push notifications for order updates
 */

export type NotificationPermission = 'default' | 'granted' | 'denied';

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

class PushNotificationManager {
  private static instance: PushNotificationManager;

  private constructor() {}

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Get current permission status
   */
  getPermission(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission as NotificationPermission;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Push notifications are not supported');
      return 'denied';
    }

    if (this.getPermission() === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a notification
   */
  async showNotification(options: PushNotificationOptions): Promise<void> {
    const permission = this.getPermission();

    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const {
        title,
        body,
        icon = '/brand/fastlygo_icon_only.webp',
        badge = '/brand/fastlygo_icon_only.webp',
        tag,
        data,
        requireInteraction = false,
      } = options;

      // Check if service worker is available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Use service worker to show notification
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon,
          badge,
          tag,
          data,
          requireInteraction,
        });
      } else {
        // Fallback to regular notification
        new Notification(title, {
          body,
          icon,
          badge,
          tag,
          data,
          requireInteraction,
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Show order status notification
   */
  async notifyOrderStatus(
    orderNumber: string,
    status: string,
    message: string
  ): Promise<void> {
    const statusTitles: Record<string, string> = {
      pending: '📦 Sipariş Alındı',
      accepted: '✅ Sipariş Onaylandı',
      courier_assigned: '🏍️ Kurye Atandı',
      picked_up: '📍 Paket Alındı',
      in_transit: '🚚 Yolda',
      delivered: '🎉 Teslim Edildi',
      cancelled: '❌ İptal Edildi',
    };

    const title = statusTitles[status] || 'Sipariş Güncellendi';

    await this.showNotification({
      title,
      body: `${orderNumber}: ${message}`,
      tag: `order-${orderNumber}`,
      data: { orderNumber, status },
      requireInteraction: status === 'delivered' || status === 'cancelled',
    });
  }

  /**
   * Show courier assigned notification
   */
  async notifyCourierAssigned(
    orderNumber: string,
    courierName: string,
    estimatedTime: number
  ): Promise<void> {
    await this.showNotification({
      title: '🏍️ Kurye Atandı',
      body: `${courierName} siparişinizi teslim edecek. Tahmini süre: ${estimatedTime} dakika`,
      tag: `courier-${orderNumber}`,
      data: { orderNumber, courierName },
      requireInteraction: false,
    });
  }

  /**
   * Show delivery completed notification
   */
  async notifyDeliveryCompleted(orderNumber: string): Promise<void> {
    await this.showNotification({
      title: '🎉 Teslimat Tamamlandı',
      body: `${orderNumber} numaralı siparişiniz teslim edildi. Deneyiminizi değerlendirmek ister misiniz?`,
      tag: `delivered-${orderNumber}`,
      data: { orderNumber, action: 'rate' },
      requireInteraction: true,
    });
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications();
      notifications.forEach(notification => notification.close());
    }
  }

  /**
   * Clear notifications by tag
   */
  async clearByTag(tag: string): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications({ tag });
      notifications.forEach(notification => notification.close());
    }
  }
}

// Export singleton instance
export const pushNotifications = PushNotificationManager.getInstance();

// Helper hook for React components
export function usePushNotifications() {
  const isSupported = pushNotifications.isSupported();
  const permission = pushNotifications.getPermission();

  const requestPermission = async () => {
    return await pushNotifications.requestPermission();
  };

  const showNotification = async (options: PushNotificationOptions) => {
    return await pushNotifications.showNotification(options);
  };

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    notifyOrderStatus: pushNotifications.notifyOrderStatus.bind(pushNotifications),
    notifyCourierAssigned: pushNotifications.notifyCourierAssigned.bind(pushNotifications),
    notifyDeliveryCompleted: pushNotifications.notifyDeliveryCompleted.bind(pushNotifications),
  };
}
