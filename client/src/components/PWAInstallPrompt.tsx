import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useTranslation } from '@/lib/i18n';

export function PWAInstallPrompt() {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Check if user previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show prompt after 3 seconds if installable
    if (isInstallable) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if dismissed or not installable
  if (isDismissed || !isInstallable || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl shadow-2xl p-4 border border-orange-400/20">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Kapat"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Download className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-1">
              {t('pwaInstallTitle') || 'Uygulamayı Yükle'}
            </h3>
            <p className="text-sm text-white/90 mb-3">
              {t('pwaInstallDescription') || 'FastlyGo\'yu cihazınıza yükleyin ve daha hızlı erişim sağlayın'}
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="bg-white text-orange-600 hover:bg-white/90 font-medium shadow-lg"
              >
                <Download className="w-4 h-4 mr-1.5" />
                {t('pwaInstallButton') || 'Yükle'}
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                {t('pwaInstallLater') || 'Sonra'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
