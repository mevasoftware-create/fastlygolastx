import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, RefreshCw } from "lucide-react";
import { Component, ReactNode } from "react";
import { logError } from "@/lib/errorLogger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('[ErrorBoundary] Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    
    // Log error to backend
    logError(error, {
      componentStack: errorInfo.componentStack,
      type: 'React Error Boundary',
    });
    
    // Clear service worker cache if error occurs
    if ('serviceWorker' in navigator && 'caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          console.log('[ErrorBoundary] Clearing cache:', cacheName);
          caches.delete(cacheName);
        });
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-2xl font-semibold mb-2 text-foreground">Beklenmeyen bir hata oluştu</h2>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              Üzgünüz, bir şeyler yanlış gitti. Lütfen sayfayı yenileyin. Sorun devam ederse, tarayıcı önbelleğinizi temizleyin.
            </p>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-lg font-medium",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 transition-opacity cursor-pointer"
                )}
              >
                <RotateCcw size={18} />
                Sayfayı Yenile
              </button>
              
              <button
                onClick={async () => {
                  // Clear all caches and reload
                  try {
                    if ('caches' in self) {
                      const names = await self.caches.keys();
                      await Promise.all(names.map(name => self.caches.delete(name)));
                    }
                  } catch (e) {
                    console.error('Failed to clear cache:', e);
                  } finally {
                    self.location.href = '/';
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-lg font-medium",
                  "bg-secondary text-secondary-foreground",
                  "hover:opacity-90 transition-opacity cursor-pointer"
                )}
              >
                <RefreshCw size={18} />
                Önbelleği Temizle
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
