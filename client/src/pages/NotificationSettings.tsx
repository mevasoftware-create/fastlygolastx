import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Settings, Bell, Package, Bike, DollarSign, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function NotificationSettings() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);

  // Fetch current settings
  const { data: settings, isLoading, refetch } = trpc.notifications.getSettings.useQuery();

  // Update settings mutation
  const updateSettings = trpc.notifications.updateSettings.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Bildirim ayarları güncellendi");
    },
    onError: (error: any) => {
      toast.error(error.message || "Ayarlar güncellenemedi");
    },
  });

  const [localSettings, setLocalSettings] = useState({
    orderUpdates: settings?.orderUpdates ?? true,
    courierUpdates: settings?.courierUpdates ?? true,
    paymentUpdates: settings?.paymentUpdates ?? true,
    promotions: settings?.promotions ?? false,
    emailNotifications: settings?.emailNotifications ?? true,
    pushNotifications: settings?.pushNotifications ?? true,
  });

  const handleToggle = (key: keyof typeof localSettings) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    updateSettings.mutate(localSettings);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ayarlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Header */}
      <header className="bg-white border-b border-orange-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/notifications")}
              >
                ← Geri
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-6 h-6 text-orange-500" />
                Bildirim Ayarları
              </h1>
            </div>

            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="bg-gradient-to-r from-orange-500 to-orange-600"
            >
              {updateSettings.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      </header>

      {/* Settings */}
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="space-y-6">
          {/* Notification Types */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              Bildirim Türleri
            </h2>

            <div className="space-y-4">
              {/* Order Updates */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">Sipariş Güncellemeleri</p>
                    <p className="text-sm text-gray-500">
                      Sipariş durumu değişikliklerinde bildirim al
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.orderUpdates}
                  onCheckedChange={() => handleToggle("orderUpdates")}
                />
              </div>

              {/* Courier Updates */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Bike className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900">Kurye Güncellemeleri</p>
                    <p className="text-sm text-gray-500">
                      Kurye atama ve konum güncellemeleri
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.courierUpdates}
                  onCheckedChange={() => handleToggle("courierUpdates")}
                />
              </div>

              {/* Payment Updates */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-gray-900">Ödeme Bildirimleri</p>
                    <p className="text-sm text-gray-500">
                      Ödeme işlemleri ve fatura bildirimleri
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.paymentUpdates}
                  onCheckedChange={() => handleToggle("paymentUpdates")}
                />
              </div>

              {/* Promotions */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-gray-900">Kampanya ve Promosyonlar</p>
                    <p className="text-sm text-gray-500">
                      Özel teklifler ve kampanya duyuruları
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.promotions}
                  onCheckedChange={() => handleToggle("promotions")}
                />
              </div>
            </div>
          </Card>

          {/* Delivery Methods */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Bildirim Kanalları
            </h2>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">E-posta Bildirimleri</p>
                  <p className="text-sm text-gray-500">
                    Bildirimleri e-posta ile al
                  </p>
                </div>
                <Switch
                  checked={localSettings.emailNotifications}
                  onCheckedChange={() => handleToggle("emailNotifications")}
                />
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">Push Bildirimleri</p>
                  <p className="text-sm text-gray-500">
                    Tarayıcı ve mobil uygulama bildirimleri
                  </p>
                </div>
                <Switch
                  checked={localSettings.pushNotifications}
                  onCheckedChange={() => handleToggle("pushNotifications")}
                />
              </div>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Not:</strong> Kritik bildirimler (sipariş onayı, teslimat tamamlandı) her zaman gönderilir.
              Bu ayarlar sadece ek bildirim türlerini kontrol eder.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
