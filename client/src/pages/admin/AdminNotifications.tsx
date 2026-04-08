import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Bell, Send, History, Smartphone, Globe, Monitor, RefreshCw,
  CheckCircle, XCircle, AlertCircle, Users, Zap, BarChart3,
  Trash2, PowerOff, Eye, ChevronRight, Wifi, WifiOff, Settings, Calendar, Loader2, Search, Package, Server,
} from "lucide-react";
import { useState, lazy, Suspense, useMemo } from "react";

const AdminScheduledNotifications = lazy(() => import("./AdminScheduledNotifications"));

type TabType = "send" | "history" | "devices" | "stats" | "scheduled";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Queries
  const { data: statusData, refetch: refetchStatus } = trpc.pushNotifications.getStatus.useQuery();
  const { data: statsData, refetch: refetchStats } = trpc.pushNotifications.getStats.useQuery(
    undefined,
    { enabled: activeTab === "stats" }
  );
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = trpc.pushNotifications.getHistory.useQuery(
    { limit: 50, offset: 0 },
    { enabled: activeTab === "history" }
  );
  const { data: devicesData, isLoading: devicesLoading, refetch: refetchDevices } =
    trpc.pushNotifications.getRegisteredDevices.useQuery(
      { limit: 100, offset: 0, activeOnly },
      { enabled: activeTab === "devices" }
    );

  // Mutations
  const sendMutation = trpc.admin.sendNotification.useMutation();
  const deactivateMutation = trpc.pushNotifications.deactivateDevice.useMutation();
  const deleteMutation = trpc.pushNotifications.deleteDevice.useMutation();

  const handleSend = async () => {
    if (!form.title || !form.body) {
      toast.error("Başlık ve mesaj gerekli");
      return;
    }

    try {
      const result = await sendMutation.mutateAsync({
        title: form.title,
        body: form.body,
        imageUrl: form.imageUrl || undefined,
        actionUrl: form.actionUrl || undefined,
        platform: form.platform,
        targetAudience: form.targetAudience,
      });

      if (result.sentCount === 0) {
        toast.warning("Kayıtlı aktif cihaz bulunamadı. Bildirim uygulama içi listeye kaydedildi.");
      } else {
        toast.success(`✅ ${result.sentCount} cihaza gönderildi${result.failedCount > 0 ? ` (${result.failedCount} başarısız)` : ""}`);
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
    try {
      await deleteMutation.mutateAsync({ tokenId });
      toast.success("Cihaz silindi");
      refetchDevices();
      refetchStatus();
      setShowDeleteConfirm(null);
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  const filteredDevices = useMemo(() => {
    if (!devicesData) return [];
    return devicesData.devices.filter(device =>
      device.id.toString().includes(searchTerm.toLowerCase()) ||
      device.userId?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRoleLabel(String(device.userRole ?? ""))?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [devicesData, searchTerm]);

  const getDeviceIcon = (deviceType: string | null) => {
    if (deviceType === "android" || deviceType === "ios") return <Smartphone className="h-5 w-5 text-gray-500" />;
    if (deviceType === "web") return <Monitor className="h-5 w-5 text-gray-500" />;
    return <Bell className="h-5 w-5 text-gray-500" />;
  };

  const getDeviceLabel = (deviceType: string | null) => {
    if (deviceType === "android") return "Android";
    if (deviceType === "ios") return "iOS";
    if (deviceType === "web") return "Web";
    return deviceType || "Bilinmiyor";
  };

  const getRoleBadge = (role: string | null) => {
    const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border";
    if (role === "admin") return <span className={`${baseClasses} bg-red-50 text-red-700 border-red-200`}>Admin</span>;
    if (role === "courier") return <span className={`${baseClasses} bg-blue-50 text-blue-700 border-blue-200`}>Kurye</span>;
    if (role === "business") return <span className={`${baseClasses} bg-amber-50 text-amber-700 border-amber-200`}>İşletme</span>;
    return <span className={`${baseClasses} bg-gray-50 text-gray-600 border-gray-200`}>Müşteri</span>;
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

  const renderEmptyState = (icon: React.ReactNode, message: string, description: string) => (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">{icon}</div>
      <p className="text-sm font-medium text-gray-800">{message}</p>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );

  const statCards = [
    { title: "Aktif Cihaz", value: statusData?.activeDeviceCount || 0, icon: <Smartphone className="h-5 w-5 text-blue-600" />, color: "blue" },
    { title: "Toplam Cihaz", value: devicesData?.total || 0, icon: <Users className="h-5 w-5 text-amber-600" />, color: "amber" },
    { title: "Bildirimler (24s)", value: statsData?.totalNotificationsSent || 0, icon: <Send className="h-5 w-5 text-emerald-600" />, color: "emerald" },
    { title: "FCM Durumu", value: statusData?.configured ? "Aktif" : "Pasif", icon: <Server className="h-5 w-5 text-red-600" />, color: "red" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Push Bildirimleri</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kullanıcılara ve kuryelere anlık bildirimler gönderin, geçmişi ve kayıtlı cihazları yönetin.</p>
      </div>

      {/* FCM Status Bar */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border text-sm font-medium ${
        statusData?.configured
          ? statusData.method === "service_account"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}>
        <div className="flex items-center gap-2">
          {statusData?.configured ? (
            statusData.method === "service_account" ? (
              <><Wifi className="h-4 w-4" /><span><strong>FCM Aktif:</strong> Service Account ile otomatik token yenileme çalışıyor.</span></>
            ) : (
              <><AlertCircle className="h-4 w-4" /><span><strong>FCM Aktif:</strong> Manuel token kullanılıyor. Service Account eklemeniz önerilir.</span></>
            )
          ) : (
            <><WifiOff className="h-4 w-4" /><span><strong>FCM Yapılandırılmamış:</strong> Push bildirimleri gönderilemiyor.</span></>
          )}
        </div>
        <div className="flex items-center gap-3">
          {statusData && (
            <span>{statusData.activeDeviceCount} aktif cihaz</span>
          )}
          <button onClick={() => refetchStatus()} className="opacity-60 hover:opacity-100 transition-opacity">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-100 rounded-xl p-1 flex items-center gap-1">
        {[
          { id: "send" as TabType, icon: <Send className="h-4 w-4" />, label: "Gönder" },
          { id: "history" as TabType, icon: <History className="h-4 w-4" />, label: "Geçmiş" },
          { id: "devices" as TabType, icon: <Smartphone className="h-4 w-4" />, label: "Cihazlar", badge: statusData?.activeDeviceCount },
          { id: "stats" as TabType, icon: <BarChart3 className="h-4 w-4" />, label: "İstatistikler" },
          { id: "scheduled" as TabType, icon: <Calendar className="h-4 w-4" />, label: "Zamanlama" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === tab.id
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-orange-500 text-white">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ===== SEND TAB ===== */}
      {activeTab === "send" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Platform</Label>
                  <Select value={form.platform} onValueChange={(v: "web" | "mobile" | "all") => setForm({ ...form, platform: v })}>
                    <SelectTrigger className="mt-1.5 rounded-xl">
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
                  <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Hedef Kitle</Label>
                  <Select value={form.targetAudience} onValueChange={(v: "all" | "users" | "couriers" | "business") => setForm({ ...form, targetAudience: v })}>
                    <SelectTrigger className="mt-1.5 rounded-xl">
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
                <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Başlık *</Label>
                <Input
                  className="mt-1.5 rounded-xl"
                  placeholder="Bildirim başlığı..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Mesaj *</Label>
                <Textarea
                  className="mt-1.5 rounded-xl"
                  placeholder="Bildirim mesajı..."
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Görsel URL (Opsiyonel)</Label>
                  <Input
                    className="mt-1.5 rounded-xl"
                    placeholder="https://example.com/image.jpg"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Tıklama URL'i (Opsiyonel)</Label>
                  <Input
                    className="mt-1.5 rounded-xl"
                    placeholder="/orders veya https://fastlygo.mk/promo"
                    value={form.actionUrl}
                    onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {previewMode && form.title && (
              <div className="p-3 bg-gray-900 rounded-xl text-white text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
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

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Button
                onClick={handleSend}
                className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-xl h-11"
                disabled={sendMutation.isPending || !form.title || !form.body}
              >
                {sendMutation.isPending ? 
                  <Loader2 className="h-5 w-5 animate-spin" /> :
                  <><Send className="h-4 w-4 mr-2" /><span>Bildirimi Gönder</span></>
                }
              </Button>
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="px-3 rounded-xl h-11"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Zap className="h-5 w-5 text-orange-500" />Hızlı Şablonlar</h3>
                <p className="text-xs text-gray-500 mt-1 mb-4">Hazır şablonları tek tıkla uygulayın.</p>
                <div className="space-y-2">
                    {TEMPLATES.map(template => (
                    <button
                        key={template.key}
                        onClick={() => applyTemplate(template)}
                        className="w-full text-left px-3 py-2.5 rounded-xl border border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition-colors group"
                    >
                        <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">{template.label}</span>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500" />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{template.body}</p>
                    </button>
                    ))}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== HISTORY TAB ===== */}
      {activeTab === "history" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
                <h3 className="text-lg font-bold text-gray-800">Gönderim Geçmişi</h3>
                <p className="text-sm text-gray-500">{historyData?.total || 0} kayıt bulundu</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchHistory()} disabled={historyLoading} className="rounded-xl">
              {historyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
          {historyLoading && !historyData ? (
            <div className="w-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
          ) : historyData && historyData.notifications.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
              {historyData.notifications.map((n) => (
                <div key={n.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-sm text-gray-800">{n.title}</h4>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-gray-50 text-gray-600 border-gray-200">{getPlatformLabel(n.platform)}</span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-gray-50 text-gray-600 border-gray-200">{getAudienceLabel(n.targetAudience)}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {new Date(n.createdAt).toLocaleString("tr-TR", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm flex-shrink-0 font-semibold">
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>{n.sentCount}</span>
                      </div>
                      {n.failedCount > 0 && (
                        <div className="flex items-center gap-1.5 text-red-500">
                          <XCircle className="h-4 w-4" />
                          <span>{n.failedCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            renderEmptyState(<History className="h-8 w-8 text-gray-400" />, "Henüz Bildirim Gönderilmemiş", "İlk bildirimi göndermek için \"Gönder\" sekmesine gidin.")
          )}
        </div>
      )}

      {/* ===== DEVICES TAB ===== */}
      {activeTab === "devices" && (
        <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Cihazlarda ara..." 
                        className="rounded-xl pl-10" 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant={activeOnly ? "secondary" : "outline"} onClick={() => setActiveOnly(!activeOnly)} className="rounded-xl"> 
                        {activeOnly ? "Sadece Aktifleri Göster" : "Tümünü Göster"}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => refetchDevices()} disabled={devicesLoading} className="rounded-xl w-10 h-10">
                        {devicesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {devicesLoading && !devicesData ? (
                <div className="w-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
            ) : filteredDevices.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
                {filteredDevices.map((d) => (
                    <div key={d.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shadow-sm flex-shrink-0">
                                    {getDeviceIcon(d.deviceType)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm text-gray-800">Cihaz #{d.id}</p>
                                        {!d.isActive && <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-red-50 text-red-600 border-red-200">Pasif</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">Kullanıcı: {d.userId || "Misafir"} &bull; {getDeviceLabel(d.deviceType)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {getRoleBadge(d.userRole)}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {d.isActive && 
                                        <Button variant="outline" size="icon" className="w-8 h-8 rounded-xl" onClick={() => handleDeactivate(d.id)}><PowerOff className="h-4 w-4" /></Button>
                                    }
                                    <Button variant="destructive" size="icon" className="w-8 h-8 rounded-xl" onClick={() => setShowDeleteConfirm(d.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            ) : (
                renderEmptyState(<Smartphone className="h-8 w-8 text-gray-400" />, "Kayıtlı Cihaz Bulunamadı", "Kullanıcılar uygulamayı kullandıkça cihazları burada listelenecektir.")
            )}
        </div>
      )}

      {/* ===== STATS TAB ===== */}
      {activeTab === "stats" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(stat => (
                <div key={stat.title} className={`bg-${stat.color}-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-${stat.color}-100`}>
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">{stat.icon}</div>
                    <div>
                        <p className="text-xs font-medium text-gray-500">{stat.title}</p>
                        <p className="text-xl font-bold text-gray-800">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* ===== SCHEDULED TAB ===== */}
      {activeTab === "scheduled" && (
        <Suspense fallback={<div className="w-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>}>
          <AdminScheduledNotifications />
        </Suspense>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowDeleteConfirm(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm shadow-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900">Cihazı Sil</h3>
                <p className="text-sm text-gray-500 mt-2">Cihaz #{showDeleteConfirm} kalıcı olarak silinecektir. Bu cihaza artık bildirim gönderilemez. Bu işlem geri alınamaz.</p>
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" className="rounded-xl" onClick={() => setShowDeleteConfirm(null)}>İptal</Button>
                    <Button 
                        variant="destructive" 
                        className="rounded-xl bg-red-500 hover:bg-red-600"
                        onClick={() => handleDelete(showDeleteConfirm)}
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Evet, Sil"}
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
