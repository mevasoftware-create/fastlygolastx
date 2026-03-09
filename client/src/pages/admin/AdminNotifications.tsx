import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Bell, Send, History, Smartphone, Globe, Monitor, RefreshCw,
  CheckCircle, XCircle, AlertCircle, Users, Zap, BarChart3,
  Trash2, PowerOff, Eye, ChevronRight, Wifi, WifiOff, Settings,
} from "lucide-react";
import { useState } from "react";

type TabType = "send" | "history" | "devices" | "stats";

const TEMPLATES = [
  { key: "order_received", label: "📦 Sipariş Alındı", title: "Siparişiniz Alındı 📦", body: "Siparişiniz başarıyla alındı ve işleme alındı." },
  { key: "order_assigned", label: "🚴 Kurye Atandı", title: "Kurye Atandı 🚴", body: "Siparişiniz için kurye atandı, yakında yola çıkıyor." },
  { key: "order_picked_up", label: "🚀 Sipariş Yola Çıktı", title: "Sipariş Yola Çıktı 🚀", body: "Kurye siparişinizi aldı ve yola çıktı." },
  { key: "order_delivered", label: "✅ Teslim Edildi", title: "Sipariş Teslim Edildi ✅", body: "Siparişiniz başarıyla teslim edildi. Afiyet olsun!" },
  { key: "new_order_for_courier", label: "🔔 Yeni Sipariş (Kurye)", title: "Yeni Sipariş Var! 🔔", body: "Yakınınızda yeni bir sipariş var. Hemen kontrol edin!" },
  { key: "promotion", label: "🎉 Kampanya", title: "Özel Kampanya! 🎉", body: "Size özel indirim fırsatı sizi bekliyor!" },
  { key: "system", label: "⚙️ Sistem Bildirimi", title: "Sistem Bildirimi ⚙️", body: "FastlyGo'dan önemli bir güncelleme var." },
];

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
  const [activeOnly, setActiveOnly] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  // Queries
  const { data: statusData, refetch: refetchStatus } = trpc.pushNotifications.getStatus.useQuery();
  const { data: statsData, refetch: refetchStats } = trpc.pushNotifications.getStats.useQuery(
    undefined,
    { enabled: activeTab === "stats" }
  );
  const { data: historyData, refetch: refetchHistory } = trpc.pushNotifications.getHistory.useQuery(
    { limit: 30, offset: 0 },
    { enabled: activeTab === "history" }
  );
  const { data: devicesData, isLoading: devicesLoading, refetch: refetchDevices } =
    trpc.pushNotifications.getRegisteredDevices.useQuery(
      { limit: 100, offset: 0, activeOnly },
      { enabled: activeTab === "devices" }
    );

  // Mutations
  const sendMutation = trpc.pushNotifications.sendToAudience.useMutation();
  const deactivateMutation = trpc.pushNotifications.deactivateDevice.useMutation();
  const deleteMutation = trpc.pushNotifications.deleteDevice.useMutation();

  const handleSend = async () => {
    if (!form.title || !form.body) {
      toast.error("Başlık ve mesaj gerekli");
      return;
    }

    try {
      const result = await sendMutation.mutateAsync({
        audience: form.targetAudience,
        platform: form.platform,
        title: form.title,
        body: form.body,
        imageUrl: form.imageUrl || undefined,
        actionUrl: form.actionUrl || undefined,
      });

      if (result.total === 0) {
        toast.warning("Kayıtlı aktif cihaz bulunamadı. Mobil uygulamadan giriş yapılıp bildirim izni verilmesi gerekiyor.");
      } else {
        toast.success(`✅ ${result.sent} cihaza gönderildi${result.failed > 0 ? ` (${result.failed} başarısız)` : ""}`);
      }

      setForm({ title: "", body: "", imageUrl: "", actionUrl: "", platform: "all", targetAudience: "all" });
      refetchHistory();
      refetchStatus();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || "Bildirim gönderilemedi");
    }
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setForm(prev => ({ ...prev, title: template.title, body: template.body }));
    toast.success(`"${template.label}" şablonu uygulandı`);
  };

  const handleDeactivate = async (tokenId: number) => {
    try {
      await deactivateMutation.mutateAsync({ tokenId });
      toast.success("Cihaz deaktive edildi");
      refetchDevices();
      refetchStatus();
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  const handleDelete = async (tokenId: number) => {
    if (!confirm("Bu cihazı kalıcı olarak silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteMutation.mutateAsync({ tokenId });
      toast.success("Cihaz silindi");
      refetchDevices();
      refetchStatus();
    } catch {
      toast.error("İşlem başarısız");
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
    if (role === "admin") return "bg-red-100 text-red-700 border-red-200";
    if (role === "courier") return "bg-blue-100 text-blue-700 border-blue-200";
    if (role === "business") return "bg-purple-100 text-purple-700 border-purple-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getRoleLabel = (role: string | null) => {
    if (role === "admin") return "Admin";
    if (role === "courier") return "Kurye";
    if (role === "business") return "İşletme";
    return "Müşteri";
  };

  const getAudienceLabel = (audience: string) => {
    const map: Record<string, string> = { all: "Tümü", users: "Müşteriler", couriers: "Kuryeler", business: "İşletmeler", specific: "Belirli" };
    return map[audience] || audience;
  };

  const getPlatformLabel = (platform: string) => {
    const map: Record<string, string> = { all: "Web + Mobil", web: "Web", mobile: "Mobil" };
    return map[platform] || platform;
  };

  return (
    <div className="p-6 space-y-4">
      {/* FCM Status Bar */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm ${
        statusData?.configured
          ? statusData.method === "service_account"
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-yellow-50 border-yellow-200 text-yellow-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}>
        <div className="flex items-center gap-2">
          {statusData?.configured ? (
            statusData.method === "service_account" ? (
              <><Wifi className="h-4 w-4" /><span><strong>FCM Aktif</strong> — Service Account ile otomatik token yenileme çalışıyor</span></>
            ) : (
              <><AlertCircle className="h-4 w-4" /><span><strong>FCM Aktif</strong> — Manuel token (her saat yenilenmeli). Service Account eklemek için ayarlara gidin.</span></>
            )
          ) : (
            <><WifiOff className="h-4 w-4" /><span><strong>FCM Yapılandırılmamış</strong> — FCM_ACCESS_TOKEN veya FCM_SERVICE_ACCOUNT_JSON gerekli</span></>
          )}
        </div>
        <div className="flex items-center gap-3">
          {statusData && (
            <span className="font-medium">{statusData.activeDeviceCount} aktif cihaz</span>
          )}
          <button onClick={() => refetchStatus()} className="opacity-60 hover:opacity-100">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b">
        {[
          { id: "send" as TabType, icon: <Send className="h-4 w-4" />, label: "Bildirim Gönder" },
          { id: "history" as TabType, icon: <History className="h-4 w-4" />, label: "Geçmiş" },
          { id: "devices" as TabType, icon: <Smartphone className="h-4 w-4" />, label: "Cihazlar", badge: statusData?.activeDeviceCount },
          { id: "stats" as TabType, icon: <BarChart3 className="h-4 w-4" />, label: "İstatistikler" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">{tab.badge}</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* ===== SEND TAB ===== */}
      {activeTab === "send" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Send className="h-4 w-4" />
                  Bildirim Gönder
                </CardTitle>
                <CardDescription>FCM ile mobil ve web cihazlarına push notification gönderin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Platform</Label>
                    <Select value={form.platform} onValueChange={(v: "web" | "mobile" | "all") => setForm({ ...form, platform: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all"><div className="flex items-center gap-2"><Bell className="h-4 w-4" />Tümü (Web + Mobil)</div></SelectItem>
                        <SelectItem value="mobile"><div className="flex items-center gap-2"><Smartphone className="h-4 w-4" />Sadece Mobil (FCM)</div></SelectItem>
                        <SelectItem value="web"><div className="flex items-center gap-2"><Globe className="h-4 w-4" />Sadece Web</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Hedef Kitle</Label>
                    <Select value={form.targetAudience} onValueChange={(v: "all" | "users" | "couriers" | "business") => setForm({ ...form, targetAudience: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all"><div className="flex items-center gap-2"><Users className="h-4 w-4" />Tüm Kullanıcılar</div></SelectItem>
                        <SelectItem value="users">Sadece Müşteriler</SelectItem>
                        <SelectItem value="couriers">Sadece Kuryeler</SelectItem>
                        <SelectItem value="business">Sadece İşletmeler</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Başlık *</Label>
                  <Input
                    className="mt-1"
                    placeholder="Bildirim başlığı..."
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Mesaj *</Label>
                  <Textarea
                    className="mt-1"
                    placeholder="Bildirim mesajı..."
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Görsel URL (Opsiyonel)</Label>
                    <Input
                      className="mt-1"
                      placeholder="https://example.com/image.jpg"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Tıklama URL'i (Opsiyonel)</Label>
                    <Input
                      className="mt-1"
                      placeholder="/orders veya https://fastlygo.mk/promo"
                      value={form.actionUrl}
                      onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                    />
                  </div>
                </div>

                {/* Preview */}
                {previewMode && form.title && (
                  <div className="p-3 bg-gray-900 rounded-xl text-white text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs opacity-70 mb-0.5">FastlyGo</p>
                        <p className="font-medium">{form.title}</p>
                        <p className="text-xs opacity-80 mt-0.5">{form.body}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleSend}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                    disabled={sendMutation.isPending || !form.title || !form.body}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendMutation.isPending ? "Gönderiliyor..." : "Bildirimi Gönder"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="px-3"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Templates Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4" />
                  Hızlı Şablonlar
                </CardTitle>
                <CardDescription>Hazır şablonları tek tıkla uygulayın</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {TEMPLATES.map(template => (
                  <button
                    key={template.key}
                    onClick={() => applyTemplate(template)}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">{template.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-orange-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{template.body}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* FCM Config Info */}
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-gray-600">
                  <Settings className="h-4 w-4" />
                  FCM Yapılandırması
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-500 space-y-1.5">
                <div className="flex justify-between">
                  <span>Proje ID:</span>
                  <span className="font-mono font-medium text-gray-700">{statusData?.projectId || "fastlygo1"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Yöntem:</span>
                  <span className={`font-medium ${statusData?.method === "service_account" ? "text-green-600" : "text-yellow-600"}`}>
                    {statusData?.method === "service_account" ? "Service Account ✓" : statusData?.method === "manual_token" ? "Manuel Token ⚠" : "Yapılandırılmamış ✗"}
                  </span>
                </div>
                {statusData?.method === "manual_token" && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded text-yellow-700 text-xs">
                    Otomatik yenileme için <strong>FCM_SERVICE_ACCOUNT_JSON</strong> secret'ını ekleyin.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ===== HISTORY TAB ===== */}
      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Bildirim Geçmişi
                </CardTitle>
                <CardDescription>Gönderilen tüm bildirimler — {historyData?.total || 0} kayıt</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchHistory()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Yenile
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {historyData && historyData.notifications.length > 0 ? (
              <div className="space-y-2">
                {historyData.notifications.map((n) => (
                  <div key={n.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold text-sm">{n.title}</h4>
                          <Badge variant="outline" className="text-xs">{getPlatformLabel(n.platform)}</Badge>
                          <Badge variant="outline" className="text-xs">{getAudienceLabel(n.targetAudience)}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{n.body}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleString("tr-TR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm flex-shrink-0">
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">{n.sentCount}</span>
                        </div>
                        {n.failedCount > 0 && (
                          <div className="flex items-center gap-1 text-red-500">
                            <XCircle className="h-4 w-4" />
                            <span className="font-medium">{n.failedCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Henüz bildirim gönderilmemiş</p>
                <p className="text-sm mt-1">İlk bildirimi göndermek için "Bildirim Gönder" sekmesine gidin</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== DEVICES TAB ===== */}
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
                  Push bildirim için kayıtlı cihazlar — {devicesData?.total || 0} cihaz
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
              <div className="text-center py-12 text-gray-400">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin opacity-40" />
                <p>Yükleniyor...</p>
              </div>
            ) : devicesData && devicesData.devices.length > 0 ? (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b">
                  <div className="col-span-4">Kullanıcı</div>
                  <div className="col-span-2">Rol</div>
                  <div className="col-span-2">Cihaz</div>
                  <div className="col-span-2">Durum</div>
                  <div className="col-span-1">Tarih</div>
                  <div className="col-span-1 text-right">İşlem</div>
                </div>
                {devicesData.devices.map((device) => (
                  <div
                    key={device.id}
                    className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-lg transition-colors border ${
                      device.isActive
                        ? "border-transparent hover:bg-gray-50 hover:border-gray-200"
                        : "border-gray-100 bg-gray-50 opacity-60"
                    }`}
                  >
                    {/* User */}
                    <div className="col-span-4 flex flex-col justify-center min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{device.userName || "İsimsiz"}</p>
                      <p className="text-xs text-gray-500 truncate">{device.userEmail || `ID: ${device.userId}`}</p>
                    </div>

                    {/* Role */}
                    <div className="col-span-2 flex items-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getRoleBadgeColor(device.userRole)}`}>
                        {getRoleLabel(device.userRole)}
                      </span>
                    </div>

                    {/* Device */}
                    <div className="col-span-2 flex items-center gap-1.5 text-sm text-gray-700">
                      {getDeviceIcon(device.deviceType)}
                      <span>{getDeviceLabel(device.deviceType)}</span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex items-center">
                      {device.isActive ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle className="h-3.5 w-3.5" />Aktif
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <XCircle className="h-3.5 w-3.5" />Pasif
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="col-span-1 flex items-center text-xs text-gray-400">
                      {new Date(device.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      {device.isActive && (
                        <button
                          onClick={() => handleDeactivate(device.id)}
                          className="p-1 rounded hover:bg-yellow-100 text-yellow-600 transition-colors"
                          title="Deaktive et"
                        >
                          <PowerOff className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(device.id)}
                        className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Kayıtlı cihaz bulunamadı</p>
                <p className="text-sm mt-1">Mobil uygulamadan giriş yapıp bildirim izni verildiğinde cihazlar burada görünür</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== STATS TAB ===== */}
      {activeTab === "stats" && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Toplam Gönderim", value: statsData?.totalNotificationsSent || 0, icon: <Send className="h-5 w-5" />, color: "text-blue-600 bg-blue-50" },
              { label: "Ulaşılan Cihaz", value: statsData?.totalDevicesReached || 0, icon: <CheckCircle className="h-5 w-5" />, color: "text-green-600 bg-green-50" },
              { label: "Aktif Cihaz", value: statsData?.activeDevices || 0, icon: <Smartphone className="h-5 w-5" />, color: "text-orange-600 bg-orange-50" },
              { label: "FCM Durumu", value: statusData?.configured ? "Aktif" : "Pasif", icon: <Wifi className="h-5 w-5" />, color: statusData?.configured ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50" },
            ].map((stat, i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${stat.color}`}>{stat.icon}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Devices by Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cihaz Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                {statsData?.devicesByType && statsData.devicesByType.length > 0 ? (
                  <div className="space-y-3">
                    {statsData.devicesByType.map((d) => (
                      <div key={d.deviceType} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-24">
                          {getDeviceIcon(d.deviceType)}
                          <span className="text-sm font-medium">{getDeviceLabel(d.deviceType)}</span>
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, (Number(d.count) / (statsData.activeDevices || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold w-8 text-right">{d.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Veri yok</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Son Bildirimler</CardTitle>
              </CardHeader>
              <CardContent>
                {statsData?.recentNotifications && statsData.recentNotifications.length > 0 ? (
                  <div className="space-y-2">
                    {statsData.recentNotifications.map((n) => (
                      <div key={n.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          <p className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString("tr-TR")}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className="text-xs text-green-600 font-medium">{n.sentCount} ✓</span>
                          {n.failedCount > 0 && <span className="text-xs text-red-500">{n.failedCount} ✗</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Henüz bildirim gönderilmemiş</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Button variant="outline" onClick={() => refetchStats()} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            İstatistikleri Yenile
          </Button>
        </div>
      )}
    </div>
  );
}
