import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { AlertCircle, Clock, Mail, Phone, CheckCircle2 } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useTranslation } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PendingApproval() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [checkCount, setCheckCount] = useState(0);
  // Only show success message if user just registered (?new=1 in URL)
  const isNewRegistration = new URLSearchParams(window.location.search).get('new') === '1';
  const [showSuccessMessage, setShowSuccessMessage] = useState(isNewRegistration);

  // Kurye/İşletme onay durumunu kontrol et
  const { data: courierData } = trpc.courier.getProfile.useQuery(
    undefined,
    { enabled: user?.role === "courier", refetchInterval: 5000 }
  );

  const { data: businessData } = trpc.business.getStatus.useQuery(
    undefined,
    { enabled: user?.role === "business", refetchInterval: 5000 }
  );

  // Timeout: 5 saniye sonra hâlâ yükleniyor ise login'e yönlendir
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoadingTimeout(true), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading) return;

    // Giriş yapmamış veya yanlış rol
    if (!user) { setLocation("/login"); return; }
    if (user.role === "admin") { setLocation("/admin/dashboard"); return; }
    if (user.role === "user") { setLocation("/"); return; }

    // Kurye onaylanıldıysa dashboard'a yönlendir
    if (user.role === "courier" && courierData?.status === "active") {
      setLocation("/courier"); return;
    }
    // İşletme onaylanıldıysa dashboard'a yönlendir
    if (user.role === "business" && businessData?.status === "active") {
      setLocation("/business-dashboard"); return;
    }
  }, [user, loading, courierData, businessData, setLocation]);

  // Kontrol sayacı için
  useEffect(() => {
    const interval = setInterval(() => {
      setCheckCount((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Başarı mesajını 5 saniye sonra gizle
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSuccessMessage(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Show loading state while auth is being checked; timeout sonrası login'e yönlendir
  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "courier" && user.role !== "business")) {
    return null;
  }

  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-200/50">
            <CheckCircle2 className="h-14 w-14 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t('applicationReceived')}</h1>
          <p className="text-xl text-gray-600 mb-10 max-w-lg mx-auto">
            {t('applicationReceivedDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-2 border-orange-100">
        <div className="p-8 md:p-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-16" />
          </div>

          {/* Animasyonlu İkon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-200 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-orange-500 rounded-full p-6">
                <Clock className="w-12 h-12 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Başlık */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Başvurunuz Değerlendiriliyor
            </h1>
            <p className="text-lg text-gray-600">
              Merhaba <span className="font-semibold text-orange-600">{user.name}</span>!
            </p>
          </div>

          {/* Açıklama */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 mb-8 border border-orange-200">
            <p className="text-gray-700 leading-relaxed text-center">
              {user.role === "courier" ? (
                <>
                  <strong className="text-orange-600">Kurye başvurunuz</strong> başarıyla alındı. 
                  Ekibimiz belgelerinizi ve bilgilerinizi değerlendiriyor. Onay sürecimiz tamamlandığında 
                  <strong> otomatik olarak kurye dashboard'ınıza</strong> yönlendirileceksiniz.
                </>
              ) : (
                <>
                  <strong className="text-orange-600">İşletme başvurunuz</strong> başarıyla alındı. 
                  Ekibimiz işletme bilgilerinizi ve belgelerinizi değerlendiriyor. Onay sürecimiz tamamlandığında 
                  <strong> otomatik olarak işletme dashboard'ınıza</strong> yönlendirileceksiniz.
                </>
              )}
            </p>
          </div>

          {/* Durum Kartı */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Sol: Durum */}
            <div className="bg-white border-2 border-orange-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Mevcut Durum</h3>
                  <p className="text-sm text-gray-600">Onay Bekleniyor</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-orange-600">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
                <span className="text-sm font-medium">İşleniyor...</span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Kontrol sayısı: {checkCount} (Her 5 saniyede güncelleniyor)
              </p>
            </div>

            {/* Sağ: Süre */}
            <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Tahmini Süre</h3>
                  <p className="text-sm text-gray-600">24-48 Saat</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Başvurular genellikle <strong>1-2 iş günü</strong> içinde değerlendirilir. 
                Yoğun dönemlerde bu süre uzayabilir.
              </p>
            </div>
          </div>

          {/* Süreç Adımları */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-orange-500 rounded"></div>
              Değerlendirme Süreci
            </h3>
            <div className="space-y-3">
              {user.role === "courier" ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✓</div>
                    <div>
                      <p className="font-medium text-gray-900">Başvuru Alındı</p>
                      <p className="text-sm text-gray-600">Bilgileriniz sisteme kaydedildi</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 animate-pulse">2</div>
                    <div>
                      <p className="font-medium text-gray-900">Kimlik Doğrulama</p>
                      <p className="text-sm text-gray-600">Kimlik ve sürücü belgesi kontrol ediliyor</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-300 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                    <div>
                      <p className="font-medium text-gray-400">Araç Bilgileri</p>
                      <p className="text-sm text-gray-500">Araç ruhsatı ve sigorta kontrolü</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-300 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                    <div>
                      <p className="font-medium text-gray-400">Onay</p>
                      <p className="text-sm text-gray-500">Başvurunuz onaylanacak</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✓</div>
                    <div>
                      <p className="font-medium text-gray-900">Başvuru Alındı</p>
                      <p className="text-sm text-gray-600">İşletme bilgileriniz kaydedildi</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 animate-pulse">2</div>
                    <div>
                      <p className="font-medium text-gray-900">Belge Kontrolü</p>
                      <p className="text-sm text-gray-600">Vergi numarası ve ticaret sicil doğrulanıyor</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-300 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                    <div>
                      <p className="font-medium text-gray-400">İletişim Doğrulama</p>
                      <p className="text-sm text-gray-500">Telefon ve e-posta onayı</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-300 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                    <div>
                      <p className="font-medium text-gray-400">Onay</p>
                      <p className="text-sm text-gray-500">Başvurunuz onaylanacak</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* İletişim */}
          <div className="border-t-2 border-gray-200 pt-6">
            <p className="text-center text-gray-600 mb-4">
              Sorularınız veya acil durumlar için bizimle iletişime geçebilirsiniz:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@fastlygo.app" 
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Mail className="w-5 h-5" />
                E-posta Gönder
              </a>
              <a 
                href="tel:+38971246756" 
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Phone className="w-5 h-5" />
                Bizi Arayın
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Arka plan animasyonu */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 20px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>
    </div>
  );
}
