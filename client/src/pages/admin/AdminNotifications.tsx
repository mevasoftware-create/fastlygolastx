import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Bell, Send, History, Users, Smartphone, Globe } from "lucide-react";
import { useState } from "react";

export default function AdminNotifications() {
  const [form, setForm] = useState({
    title: "",
    body: "",
    imageUrl: "",
    actionUrl: "",
    platform: "all" as "web" | "mobile" | "all",
    targetAudience: "all" as "all" | "users" | "couriers" | "business",
  });

  const { data: notificationHistory, refetch } = trpc.admin.getNotificationHistory.useQuery();
  const sendNotificationMutation = trpc.admin.sendNotification.useMutation();

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

  return (
    <div className="p-6 space-y-6">
      {/* Send Notification */}
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

      {/* Notification History */}
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
    </div>
  );
}
