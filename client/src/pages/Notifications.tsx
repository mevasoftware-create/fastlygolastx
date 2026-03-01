import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Trash2, Settings, Package, Bike, AlertCircle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Notifications() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Fetch notifications
  const { data: notifications, isLoading, refetch } = trpc.notifications.list.useQuery({});
  
  // Mark as read mutation
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Bildirim okundu olarak işaretlendi");
    },
  });

  // Mark all as read mutation
  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Tüm bildirimler okundu olarak işaretlendi");
    },
  });

  // Delete notification mutation
  const deleteNotification = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Bildirim silindi");
    },
  });

  const filteredNotifications = notifications?.filter((n: any) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  const { data: unreadCountData } = trpc.notifications.unreadCount.useQuery();
  const unreadCount = unreadCountData || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order_created":
      case "order_updated":
        return <Package className="w-5 h-5 text-orange-500" />;
      case "courier_assigned":
      case "courier_accepted":
        return <Bike className="w-5 h-5 text-blue-500" />;
      case "delivery_completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Az önce";
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return new Date(date).toLocaleDateString("tr-TR");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Bildirimler yükleniyor...</p>
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
                onClick={() => navigate("/")}
              >
                ← Geri
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-6 h-6 text-orange-500" />
                  Bildirimler
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-600">
                    {unreadCount} okunmamış bildirim
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Tümünü Okundu İşaretle
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/notification-settings")}
              >
                <Settings className="w-4 h-4 mr-2" />
                Ayarlar
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-gradient-to-r from-orange-500 to-orange-600" : ""}
            >
              Tümü ({notifications?.length || 0})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
              className={filter === "unread" ? "bg-gradient-to-r from-orange-500 to-orange-600" : ""}
            >
              Okunmamış ({unreadCount})
            </Button>
          </div>
        </div>
      </header>

      {/* Notifications List */}
      <main className="container mx-auto px-4 py-6">
        {!filteredNotifications || filteredNotifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {filter === "unread" ? "Okunmamış bildirim yok" : "Henüz bildirim yok"}
            </h3>
            <p className="text-gray-500">
              {filter === "unread" 
                ? "Tüm bildirimlerinizi okudunuz" 
                : "Yeni bildirimler burada görünecek"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 transition-all hover:shadow-md ${
                  !notification.isRead ? "bg-orange-50 border-orange-200" : "bg-white"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>

                      {!notification.isRead && (
                        <Badge variant="default" className="bg-orange-500 flex-shrink-0">
                          Yeni
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead.mutate({ id: notification.id })}
                          disabled={markAsRead.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Okundu İşaretle
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification.mutate({ id: notification.id })}
                        disabled={deleteNotification.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Sil
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
