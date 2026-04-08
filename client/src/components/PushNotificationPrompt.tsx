import { useState, useEffect } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebPush } from "@/hooks/useWebPush";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

const DISMISSED_KEY = "push_prompt_dismissed";

export function PushNotificationPrompt() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { permissionState, isSubscribed, isLoading, subscribe } = useWebPush();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  const isAdmin = location.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) return;
    const wasDismissed = sessionStorage.getItem(DISMISSED_KEY) === "1";
    if (
      user &&
      permissionState === "default" &&
      !isSubscribed &&
      !wasDismissed
    ) {
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, permissionState, isSubscribed, isAdmin]);

  // Admin panelinde bildirim izni popup'ını gösterme
  if (isAdmin) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
    setVisible(false);
  };

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (ok) {
      setVisible(false);
    }
  };

  if (!visible || dismissed || !user || permissionState === "unsupported") {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <Bell className="w-5 h-5 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Bildirimleri Etkinleştir</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sipariş güncellemeleri ve kampanyalardan anında haberdar olun.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 px-3"
              onClick={handleSubscribe}
              disabled={isLoading}
            >
              {isLoading ? "Yükleniyor..." : "İzin Ver"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-8 px-3 text-muted-foreground"
              onClick={handleDismiss}
            >
              Şimdi Değil
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Compact toggle button for notification settings page
 */
export function PushNotificationToggle() {
  const { permissionState, isSubscribed, isLoading, subscribe, unsubscribe } = useWebPush();
  const { user } = useAuth();

  if (!user || permissionState === "unsupported") return null;

  if (permissionState === "denied") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="w-4 h-4" />
        <span>Bildirimler tarayıcı tarafından engellendi. Tarayıcı ayarlarından izin verin.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-orange-500" />
        <div>
          <p className="text-sm font-medium">Push Bildirimleri</p>
          <p className="text-xs text-muted-foreground">
            {isSubscribed ? "Bildirimler aktif" : "Bildirimler kapalı"}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant={isSubscribed ? "outline" : "default"}
        className={isSubscribed ? "" : "bg-orange-500 hover:bg-orange-600 text-white"}
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
      >
        {isLoading ? "..." : isSubscribed ? "Kapat" : "Etkinleştir"}
      </Button>
    </div>
  );
}
