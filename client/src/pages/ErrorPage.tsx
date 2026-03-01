import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft, RefreshCw } from "lucide-react";
import { APP_TITLE, APP_LOGO } from "@/const";
import SEOHead from "@/components/SEOHead";

interface ErrorPageProps {
  errorCode?: number;
  title?: string;
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  showRefreshButton?: boolean;
}

export default function ErrorPage({
  errorCode = 404,
  title,
  message,
  showBackButton = true,
  showHomeButton = true,
  showRefreshButton = false,
}: ErrorPageProps) {
  const [, navigate] = useLocation();

  // Default messages based on error code
  const getDefaultContent = (code: number) => {
    switch (code) {
      case 404:
        return {
          title: "Sayfa Bulunamadı",
          message:
            "Aradığınız sayfa mevcut değil veya taşınmış olabilir. Lütfen URL'i kontrol edin veya ana sayfaya dönün.",
        };
      case 403:
        return {
          title: "Erişim Engellendi",
          message:
            "Bu sayfaya erişim yetkiniz bulunmamaktadır. Lütfen giriş yapın veya yetkilendirme için yöneticinizle iletişime geçin.",
        };
      case 500:
        return {
          title: "Sunucu Hatası",
          message:
            "Bir şeyler ters gitti. Sunucumuzda beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin veya destek ekibimizle iletişime geçin.",
        };
      case 503:
        return {
          title: "Hizmet Kullanılamıyor",
          message:
            "Sistemimiz şu anda bakımda. Lütfen birkaç dakika sonra tekrar deneyin. Anlayışınız için teşekkür ederiz.",
        };
      default:
        return {
          title: "Bir Hata Oluştu",
          message:
            "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin veya destek ekibimizle iletişime geçin.",
        };
    }
  };

  const defaultContent = getDefaultContent(errorCode);
  const finalTitle = title || defaultContent.title;
  const finalMessage = message || defaultContent.message;

  const handleGoBack = () => {
    window.history.back();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      {/* Prevent Google from indexing error pages */}
      <SEOHead 
        title={`${errorCode} - ${finalTitle} | ${APP_TITLE}`}
        description={finalMessage}
        noindex={true}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <a className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity">
              {APP_LOGO && (
                <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-auto" />
              )}
              <span className="text-2xl font-bold text-gray-900">{APP_TITLE}</span>
            </a>
          </Link>
        </div>

        <Card className="border-2 shadow-xl">
          <CardContent className="pt-12 pb-8 px-8">
            {/* Error Icon and Code */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-4">
                <AlertCircle className="h-10 w-10 text-orange-600" />
              </div>
              <div className="text-6xl font-bold text-gray-900 mb-2">{errorCode}</div>
            </div>

            {/* Title and Message */}
            <div className="text-center mb-8 space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">{finalTitle}</h1>
              <p className="text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
                {finalMessage}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              {showBackButton && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleGoBack}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Geri Dön
                </Button>
              )}

              {showHomeButton && (
                <Link href="/">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Home className="mr-2 h-5 w-5" />
                    Ana Sayfaya Git
                  </Button>
                </Link>
              )}

              {showRefreshButton && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleRefresh}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Yenile
                </Button>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-sm text-gray-500">
                Sorun devam ederse,{" "}
                <Link href="/contact">
                  <a className="text-orange-600 hover:text-orange-700 font-medium underline">
                    destek ekibimizle iletişime geçin
                  </a>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Hata Kodu: {errorCode} • {new Date().toLocaleString("tr-TR")}
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

// Specific error page components for common use cases
export function NotFoundPage() {
  return <ErrorPage errorCode={404} />;
}

export function ForbiddenPage() {
  return <ErrorPage errorCode={403} />;
}

export function ServerErrorPage() {
  return (
    <ErrorPage
      errorCode={500}
      showRefreshButton={true}
      showBackButton={false}
    />
  );
}

export function ServiceUnavailablePage() {
  return (
    <ErrorPage
      errorCode={503}
      showRefreshButton={true}
      showBackButton={false}
    />
  );
}
