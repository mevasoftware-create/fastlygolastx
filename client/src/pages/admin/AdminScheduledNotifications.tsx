import { useState } from "react";
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
  Clock, Plus, Trash2, XCircle, RefreshCw, Send, Calendar,
  CheckCircle, AlertCircle, Ban, Repeat, ChevronDown, ChevronUp,
  Bell, Users, Smartphone, Globe, Zap,
} from "lucide-react";

type StatusFilter = "all" | "pending" | "sent" | "cancelled" | "failed";

const TEMPLATES = [
  { label: "📦 Sipariş Alındı", title: "Siparişiniz Alındı 📦", body: "Siparişiniz başarıyla alındı ve işleme alındı." },
  { label: "🎉 Kampanya", title: "Özel Kampanya! 🎉", body: "Size özel indirim fırsatı sizi bekliyor!" },
  { label: "⚙️ Sistem Bildirimi", title: "Sistem Bildirimi ⚙️", body: "FastlyGo'dan önemli bir güncelleme var." },
];

const WEEKDAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

function getStatusBadge(status: string) {
  switch (status) {
    case "pending": return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100"><Clock className="h-3 w-3 mr-1" />Bekliyor</Badge>;
    case "sent": return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Gönderildi</Badge>;
    case "cancelled": return <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100"><Ban className="h-3 w-3 mr-1" />İptal</Badge>;
    case "failed": return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Başarısız</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

function getRepeatLabel(repeatType: string, repeatDays: unknown) {
  if (repeatType === "once") return "Bir kez";
  if (repeatType === "daily") return "Her gün";
  if (repeatType === "weekly") {
    const days = repeatDays as number[] | null;
    if (days && days.length > 0) {
      return `Haftalık (${days.map(d => WEEKDAYS[d]).join(", ")})`;
    }
    return "Haftalık";
  }
  return repeatType;
}

function getAudienceLabel(audience: string) {
  const map: Record<string, string> = { all: "Tümü", users: "Müşteriler", couriers: "Kuryeler", business: "İşletmeler" };
  return map[audience] || audience;
}

function getPlatformIcon(platform: string) {
  if (platform === "mobile") return <Smartphone className="h-3.5 w-3.5" />;
  if (platform === "web") return <Globe className="h-3.5 w-3.5" />;
  return <Bell className="h-3.5 w-3.5" />;
}

// Yerel datetime input için yardımcı
function toLocalDatetimeValue(date?: Date): string {
  if (!date) {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  }
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function getMinDatetime(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 1);
  return d.toISOString().slice(0, 16);
}

export default function AdminScheduledNotifications() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: "",
    body: "",
    imageUrl: "",
    actionUrl: "",
    platform: "all" as "web" | "mobile" | "all",
    targetAudience: "all" as "all" | "users" | "couriers" | "business",
    scheduledAt: toLocalDatetimeValue(),
    repeatType: "once" as "once" | "daily" | "weekly",
    repeatDays: [] as number[],
    repeatUntil: "",
  });

  const utils = trpc.useUtils();

  const { data: listData, isLoading, refetch } = trpc.scheduledNotifications.list.useQuery({
    status: statusFilter,
    limit: 50,
    offset: 0,
  });

  const { data: statsData } = trpc.scheduledNotifications.getStats.useQuery();

  const createMutation = trpc.scheduledNotifications.create.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      resetForm();
      refetch();
      utils.scheduledNotifications.getStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.scheduledNotifications.update.useMutation({
    onSuccess: () => {
      toast.success("Bildirim güncellendi");
      resetForm();
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelMutation = trpc.scheduledNotifications.cancel.useMutation({
    onSuccess: () => {
      toast.success("Bildirim iptal edildi");
      refetch();
      utils.scheduledNotifications.getStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.scheduledNotifications.delete.useMutation({
    onSuccess: () => {
      toast.success("Bildirim silindi");
      refetch();
      utils.scheduledNotifications.getStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const sendNowMutation = trpc.scheduledNotifications.sendNow.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      utils.scheduledNotifications.getStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setForm({
      title: "",
      body: "",
      imageUrl: "",
      actionUrl: "",
      platform: "all",
      targetAudience: "all",
      scheduledAt: toLocalDatetimeValue(),
      repeatType: "once",
      repeatDays: [],
      repeatUntil: "",
    });
    setShowForm(false);
    setEditId(null);
  };

  const handleSubmit = () => {
    if (!form.title || !form.body) {
      toast.error("Başlık ve mesaj gerekli");
      return;
    }

    const scheduledAt = new Date(form.scheduledAt).toISOString();

    if (editId) {
      updateMutation.mutate({
        id: editId,
        title: form.title,
        body: form.body,
        imageUrl: form.imageUrl || undefined,
        actionUrl: form.actionUrl || undefined,
        platform: form.platform,
        targetAudience: form.targetAudience,
        scheduledAt,
        repeatType: form.repeatType,
        repeatDays: form.repeatType === "weekly" ? form.repeatDays : undefined,
        repeatUntil: form.repeatUntil ? new Date(form.repeatUntil).toISOString() : undefined,
      });
    } else {
      createMutation.mutate({
        title: form.title,
        body: form.body,
        imageUrl: form.imageUrl || undefined,
        actionUrl: form.actionUrl || undefined,
        platform: form.platform,
        targetAudience: form.targetAudience,
        scheduledAt,
        repeatType: form.repeatType,
        repeatDays: form.repeatType === "weekly" ? form.repeatDays : undefined,
        repeatUntil: form.repeatUntil ? new Date(form.repeatUntil).toISOString() : undefined,
      });
    }
  };

  const toggleRepeatDay = (day: number) => {
    setForm(prev => ({
      ...prev,
      repeatDays: prev.repeatDays.includes(day)
        ? prev.repeatDays.filter(d => d !== day)
        : [...prev.repeatDays, day].sort(),
    }));
  };

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setForm(prev => ({ ...prev, title: t.title, body: t.body }));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Zamanlanmış Bildirimler
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Belirli tarih ve saatte otomatik gönderim — her dakika kontrol edilir</p>
        </div>
        <Button
          onClick={() => { setShowForm(!showForm); setEditId(null); }}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Zamanlama
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Bekliyor", value: statsData?.pending ?? 0, color: "text-blue-600 bg-blue-50", icon: <Clock className="h-4 w-4" /> },
          { label: "Gönderildi", value: statsData?.sent ?? 0, color: "text-green-600 bg-green-50", icon: <CheckCircle className="h-4 w-4" /> },
          { label: "İptal", value: statsData?.cancelled ?? 0, color: "text-gray-600 bg-gray-50", icon: <Ban className="h-4 w-4" /> },
          { label: "Başarısız", value: statsData?.failed ?? 0, color: "text-red-600 bg-red-50", icon: <XCircle className="h-4 w-4" /> },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${s.color.split(" ")[1]} border-current/10`}>
            <div className={`p-2 rounded-lg ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {editId ? "Bildirimi Düzenle" : "Yeni Zamanlanmış Bildirim"}
            </CardTitle>
            <CardDescription>Bildirim belirtilen tarih ve saatte otomatik olarak gönderilecek</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Şablonlar */}
            <div>
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hızlı Şablon</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => applyTemplate(t)}
                    className="text-xs px-3 py-1.5 rounded-full border border-orange-200 bg-white hover:bg-orange-50 hover:border-orange-400 transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Platform</Label>
                <Select value={form.platform} onValueChange={(v: "web" | "mobile" | "all") => setForm({ ...form, platform: v })}>
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü (Web + Mobil)</SelectItem>
                    <SelectItem value="mobile">Sadece Mobil</SelectItem>
                    <SelectItem value="web">Sadece Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Hedef Kitle</Label>
                <Select value={form.targetAudience} onValueChange={(v: "all" | "users" | "couriers" | "business") => setForm({ ...form, targetAudience: v })}>
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
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
                className="mt-1 bg-white"
                placeholder="Bildirim başlığı..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Mesaj *</Label>
              <Textarea
                className="mt-1 bg-white"
                placeholder="Bildirim mesajı..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Görsel URL (Opsiyonel)</Label>
                <Input
                  className="mt-1 bg-white"
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Tıklama URL'i (Opsiyonel)</Label>
                <Input
                  className="mt-1 bg-white"
                  placeholder="/orders veya https://..."
                  value={form.actionUrl}
                  onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                />
              </div>
            </div>

            {/* Zamanlama */}
            <div className="p-3 bg-white rounded-lg border border-orange-100 space-y-3">
              <Label className="text-xs font-medium text-orange-700 uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Zamanlama
              </Label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Gönderim Tarihi ve Saati *</Label>
                  <Input
                    type="datetime-local"
                    className="mt-1"
                    value={form.scheduledAt}
                    min={getMinDatetime()}
                    onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Tekrar</Label>
                  <Select value={form.repeatType} onValueChange={(v: "once" | "daily" | "weekly") => setForm({ ...form, repeatType: v, repeatDays: [] })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Bir kez</SelectItem>
                      <SelectItem value="daily">Her gün</SelectItem>
                      <SelectItem value="weekly">Haftalık</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Haftalık gün seçimi */}
              {form.repeatType === "weekly" && (
                <div>
                  <Label className="text-xs text-gray-500">Hangi günler?</Label>
                  <div className="flex gap-1.5 mt-1.5">
                    {WEEKDAYS.map((day, i) => (
                      <button
                        key={i}
                        onClick={() => toggleRepeatDay(i)}
                        className={`w-9 h-9 rounded-lg text-xs font-medium transition-colors ${
                          form.repeatDays.includes(i)
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-orange-100"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tekrar bitiş tarihi */}
              {form.repeatType !== "once" && (
                <div>
                  <Label className="text-xs text-gray-500">Tekrar Bitiş Tarihi (Opsiyonel)</Label>
                  <Input
                    type="datetime-local"
                    className="mt-1"
                    value={form.repeatUntil}
                    min={form.scheduledAt}
                    onChange={(e) => setForm({ ...form, repeatUntil: e.target.value })}
                    placeholder="Boş bırakırsanız süresiz tekrar eder"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                disabled={isPending || !form.title || !form.body || !form.scheduledAt}
              >
                <Clock className="h-4 w-4 mr-2" />
                {isPending ? "Kaydediliyor..." : editId ? "Güncelle" : "Zamanla"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                İptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b">
        {(["all", "pending", "sent", "cancelled", "failed"] as StatusFilter[]).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === s
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {s === "all" ? "Tümü" : s === "pending" ? "Bekliyor" : s === "sent" ? "Gönderildi" : s === "cancelled" ? "İptal" : "Başarısız"}
            {s === "pending" && statsData?.pending ? (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">{statsData.pending}</span>
            ) : null}
          </button>
        ))}
        <button onClick={() => refetch()} className="ml-auto px-3 py-2 text-gray-400 hover:text-gray-600">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin opacity-40" />
              <p>Yükleniyor...</p>
            </div>
          ) : listData && listData.notifications.length > 0 ? (
            <div className="space-y-2">
              {listData.notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`border rounded-lg transition-colors ${
                    notif.status === "pending"
                      ? "border-blue-100 hover:border-blue-200 bg-blue-50/30"
                      : notif.status === "sent"
                      ? "border-green-100 bg-green-50/20"
                      : notif.status === "failed"
                      ? "border-red-100 bg-red-50/20"
                      : "border-gray-100 bg-gray-50/50"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {getStatusBadge(notif.status)}
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            {getPlatformIcon(notif.platform)}
                            {notif.platform}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {getAudienceLabel(notif.targetAudience)}
                          </span>
                          {notif.repeatType !== "once" && (
                            <span className="text-xs text-purple-600 flex items-center gap-1">
                              <Repeat className="h-3.5 w-3.5" />
                              {getRepeatLabel(notif.repeatType, notif.repeatDays)}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-sm">{notif.title}</h4>
                        <p className="text-sm text-gray-600 truncate">{notif.body}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(notif.scheduledAt).toLocaleString("tr-TR", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                          {notif.sentCount > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              {notif.sentCount} cihaz
                            </span>
                          )}
                          {notif.failedCount > 0 && (
                            <span className="flex items-center gap-1 text-red-500">
                              <XCircle className="h-3 w-3" />
                              {notif.failedCount} başarısız
                            </span>
                          )}
                        </div>
                        {notif.errorMessage && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {notif.errorMessage}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {notif.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => sendNowMutation.mutate({ id: notif.id })}
                              disabled={sendNowMutation.isPending}
                              title="Hemen gönder"
                            >
                              <Zap className="h-3.5 w-3.5 mr-1" />
                              Hemen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                              onClick={() => cancelMutation.mutate({ id: notif.id })}
                              disabled={cancelMutation.isPending}
                              title="İptal et"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-xs text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            if (confirm("Bu zamanlamayı kalıcı olarak silmek istediğinizden emin misiniz?")) {
                              deleteMutation.mutate({ id: notif.id });
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          title="Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <button
                          onClick={() => setExpandedId(expandedId === notif.id ? null : notif.id)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                        >
                          {expandedId === notif.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {expandedId === notif.id && (
                      <div className="mt-3 pt-3 border-t border-dashed border-gray-200 text-xs text-gray-500 space-y-1">
                        {notif.imageUrl && <p><strong>Görsel:</strong> {notif.imageUrl}</p>}
                        {notif.actionUrl && <p><strong>URL:</strong> {notif.actionUrl}</p>}
                        {notif.repeatUntil && (
                          <p><strong>Tekrar bitiş:</strong> {new Date(notif.repeatUntil).toLocaleString("tr-TR")}</p>
                        )}
                        {notif.lastSentAt && (
                          <p><strong>Son gönderim:</strong> {new Date(notif.lastSentAt).toLocaleString("tr-TR")}</p>
                        )}
                        <p><strong>Oluşturulma:</strong> {new Date(notif.createdAt).toLocaleString("tr-TR")}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Calendar className="h-14 w-14 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-gray-500">
                {statusFilter === "all" ? "Henüz zamanlanmış bildirim yok" : `${statusFilter} durumunda bildirim yok`}
              </p>
              <p className="text-sm mt-1">Yukarıdaki "Yeni Zamanlama" butonuna tıklayarak başlayın</p>
              <Button
                className="mt-4 bg-orange-500 hover:bg-orange-600"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                İlk Zamanlamamı Oluştur
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
