import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Bell, Send, History, Users, Smartphone, Globe, Monitor, RefreshCw } from "lucide-react";
import { useState } from "react";

type TabType = "send" | "history" | "devices";

export default function AdminNotifications() {
  const [activeTab, setActiveTab] = useState<TabType>("send");
  const [form, setForm] = useState({
    title: "",
    body: "",
    imageUrl: "",
    actionUrl: "",
    platform: "all" as "web" | "mobile" | "all",
    targetAudience: "all" as "all" | "users" | "couriers" | "business",
  });
  const [activeOnly, setActiveOnly] = useState(false);

  const { data: notificationHistory, refetch } = trpc.admin.getNotificationHistory.useQuery();
  const sendNotificationMutation = trpc.admin.sendNotification.useMutation();

  const { data: devicesData, isLoading: devicesLoading, refetch: refetchDevices } =
    trpc.pushNotifications.getRegisteredDevices.useQuery(
      { limit: 100, offset: 0, activeOnly },
      { enabled: activeTab === "devices" }
    );

  const handleSend = async () => {
    if (!form.title || !form.body) {
      toast.error("Başlık ve mesaj gerekli");
      return;
    }

    try {
      const result = await sendNotificationMutation.mutateAsync(form);
      toast.success(`Bildirim gönderildi: ${result.sentCount} cihaz`);
      setForm({
        title: "",
        body: "",
        imageUrl: "",
        actionUrl: "",
        platform: "all",
        targetAudience: "all",
      });
      refetch();
    } catch (error) {
      toast.error("Bildirim gönderilemedi");
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    if (deviceType === "android" || deviceType === "ios") return <Smartphone className="h-4 w-4" />;
    if (deviceType === "web") return <Monitor className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
  };

  const getDeviceLabel = (deviceType: string | null) => {
    if (deviceType === "android") return "Android";
    if (deviceType === "ios") return "iOS";
    if (deviceType === "web") return "Web";
    return deviceType || "Bilinmiyor";
  };

  const getRoleBadgeColor = (role: string | null) => {
    if (role === "admin") return "bg-red-100 text-red-700";
    if (role === "courier") return "bg-blue-100 text-blue-700";
    if (role === "business") return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-700";
  };

  const getRoleLabel = (role: string | null) => {
    if (role === "admin") return "Admin";
    if (role === "courier") return "Kurye";
    if (role === "business") return "İşletme";
    return "Kullanıcı";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab("send")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "send"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Bildirim Gönder
          </span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Bildirim Geçmişi
          </span>
        </button>
        <button
          onClick={() => setActiveTab("devices")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "devices"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Kayıtlı Cihazlar
            {devicesData && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
                {devicesData.total}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Send Notification Tab */}
      {activeTab === "send" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Bildirim Gönder
            </CardTitle>
            <CardDescription>Web ve mobil kullanıcılara push notification gönderin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Platform Selector */}
              <div>
                <Label>Platform</Label>
                <Select
                  value={form.platform}
                  onValueChange={(value: any) => setForm({ ...form, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Tümü (Web + Mobil)
                      </div>
                    </SelectItem>
                    <SelectItem value="web">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Sadece Web
                      </div>
                    </SelectItem>
                    <SelectItem value="mobile">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Sadece Mobil
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Audience */}
              <div>
                <Label>Hedef Kitle</Label>
                <Select
                  value={form.targetAudience}
                  onValueChange={(value: any) => setForm({ ...form, targetAudience: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Tüm Kullanıcılar
                      </div>
                    </SelectItem>
                    <SelectItem value="users">Sadece Müşteriler</SelectItem>
                    <SelectItem value="couriers">Sadece Kuryeler</SelectItem>
                    <SelectItem value="business">Sadece İşletmeler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Title */}
            <div>
              <Label>Başlık</Label>
              <Input
                placeholder="Yeni Kampanya!"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            {/* Body */}
            <div>
              <Label>Mesaj</Label>
              <Textarea
                placeholder="Bugün tüm teslimatlar %20 indirimli!"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={3}
              />
            </div>

            {/* Image URL (Optional) */}
            <div>
              <Label>Görsel URL (Opsiyonel)</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </div>

            {/* Action URL (Optional) */}
            <div>
              <Label>Tıklama URL'i (Opsiyonel)</Label>
              <Input
                placeholder="/services veya https://fastlygo.mk/promo"
                value={form.actionUrl}
                onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
              />
            </div>

            <Button onClick={handleSend} className="w-full" disabled={sendNotificationMutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {sendNotificationMutation.isPending ? "Gönderiliyor..." : "Bildirimi Gönder"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notification History Tab */}
      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Bildirim Geçmişi
            </CardTitle>
            <CardDescription>Gönderilen bildirimler ve istatistikler</CardDescription>
          </CardHeader>
          <CardContent>
            {notificationHistory && notificationHistory.length > 0 ? (
              <div className="space-y-3">
                {notificationHistory.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{notification.title}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {notification.platform === "all"
                              ? "Web + Mobil"
                              : notification.platform === "web"
                              ? "Web"
                              : "Mobil"}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            {notification.targetAudience === "all"
                              ? "Tümü"
                              : notification.targetAudience === "users"
                              ? "Müşteriler"
                              : notification.targetAudience === "couriers"
                              ? "Kuryeler"
                              : "İşletmeler"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.body}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>✅ {notification.sentCount} gönderildi</span>
                          {notification.failedCount > 0 && (
                            <span className="text-red-600">❌ {notification.failedCount} başarısız</span>
                          )}
                          <span>
                            {new Date(notification.sentAt || notification.createdAt).toLocaleString("tr-TR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Henüz bildirim gönderilmemiş</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Registered Devices Tab */}
      {activeTab === "devices" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Kayıtlı Cihazlar
                </CardTitle>
                <CardDescription>
                  Push bildirim için kayıtlı tüm cihazlar
                  {devicesData && (
                    <span className="ml-1 font-medium text-gray-700">
                      — {devicesData.total} cihaz
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeOnly}
                    onChange={(e) => setActiveOnly(e.target.checked)}
                    className="rounded"
                  />
                  Sadece aktif
                </label>
                <Button variant="outline" size="sm" onClick={() => refetchDevices()}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Yenile
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {devicesLoading ? (
              <div className="text-center py-8 text-gray-500">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin opacity-40" />
                <p>Yükleniyor...</p>
              </div>
            ) : devicesData && devicesData.devices.length > 0 ? (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b">
                  <div className="col-span-1">#</div>
                  <div className="col-span-3">Kullanıcı</div>
                  <div className="col-span-2">Rol</div>
                  <div className="col-span-2">Cihaz</div>
                  <div className="col-span-2">Durum</div>
                  <div className="col-span-2">Kayıt Tarihi</div>
                </div>
                {devicesData.devices.map((device, index) => (
                  <div
                    key={device.id}
                    className="grid grid-cols-12 gap-2 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                  >
                    {/* Index */}
                    <div className="col-span-1 flex items-center text-sm text-gray-400">
                      {index + 1}
                    </div>

                    {/* User Info */}
                    <div className="col-span-3 flex flex-col justify-center min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {device.userName || "İsimsiz"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {device.userEmail || `ID: ${device.userId}`}
                      </p>
                    </div>

                    {/* Role */}
                    <div className="col-span-2 flex items-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(device.userRole)}`}>
                        {getRoleLabel(device.userRole)}
                      </span>
                    </div>

                    {/* Device Type */}
                    <div className="col-span-2 flex items-center gap-1.5">
                      <span className="text-gray-500">{getDeviceIcon(device.deviceType)}</span>
                      <span className="text-sm text-gray-700">{getDeviceLabel(device.deviceType)}</span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex items-center">
                      {device.isActive ? (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                          Aktif
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                          Pasif
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="col-span-2 flex items-center text-xs text-gray-500">
                      {device.createdAt
                        ? new Date(device.createdAt).toLocaleDateString("tr-TR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "-"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Kayıtlı cihaz bulunamadı</p>
                <p className="text-sm mt-1">
                  {activeOnly
                    ? "Aktif cihaz yok. Tüm cihazları görmek için filtreyi kaldırın."
                    : "Mobil uygulamada giriş yapıldığında cihazlar burada görünecek."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
