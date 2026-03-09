import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebPush } from '@/hooks/useWebPush';
import { useAuth } from '@/_core/hooks/useAuth';

const BANNER_DISMISSED_KEY = 'fastlygo_notif_banner_dismissed';

export function NotificationPermissionBanner() {
  const { user } = useAuth();
  const { permissionState, isSubscribed, isLoading, subscribe, isSupported } = useWebPush();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const wasDismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (wasDismissed) setDismissed(true);
  }, []);

  // Gösterme koşulları:
  // - Kullanıcı giriş yapmış olmalı
  // - Web push desteklenmeli
  // - Henüz izin verilmemiş (default durumda)
  // - Abone olunmamış
  // - Banner kapatılmamış
  if (!mounted) return null;
  if (!user) return null;
  if (!isSupported) return null;
  if (permissionState === 'granted' && isSubscribed) return null;
  if (permissionState === 'denied') return null;
  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  };

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      setDismissed(true);
    }
  };

  return (
    <div className="relative flex items-center gap-3 px-4 py-3 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 dark:border-orange-800">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
        <Bell className="w-4 h-4 text-orange-600 dark:text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
          Tarayıcı bildirimlerini etkinleştir
        </p>
        <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">
          Sipariş güncellemeleri ve önemli bildirimler için izin verin.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          onClick={handleSubscribe}
          disabled={isLoading}
          className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-7 px-3"
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
              Etkinleştiriliyor...
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Bell className="w-3 h-3" />
              Etkinleştir
            </span>
          )}
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-orange-200 dark:hover:bg-orange-800 text-orange-600 dark:text-orange-400 transition-colors"
          aria-label="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Küçük bildirim durumu göstergesi (profil menüsü veya ayarlar için)
 */
export function NotificationToggle() {
  const { permissionState, isSubscribed, isLoading, subscribe, unsubscribe, isSupported } = useWebPush();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="w-4 h-4" />
        <span>Tarayıcı bildirimleri desteklenmiyor</span>
      </div>
    );
  }

  if (permissionState === 'denied') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="w-4 h-4" />
        <span>Bildirimler engellendi (tarayıcı ayarlarından açın)</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        {isSubscribed ? (
          <Bell className="w-4 h-4 text-green-500" />
        ) : (
          <BellOff className="w-4 h-4 text-muted-foreground" />
        )}
        <span>{isSubscribed ? 'Tarayıcı bildirimleri açık' : 'Tarayıcı bildirimleri kapalı'}</span>
      </div>
      <Button
        size="sm"
        variant={isSubscribed ? "outline" : "default"}
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
        className="text-xs h-7"
      >
        {isLoading ? 'İşleniyor...' : isSubscribed ? 'Kapat' : 'Aç'}
      </Button>
    </div>
  );
}
