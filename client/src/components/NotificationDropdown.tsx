import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export function NotificationDropdown() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Get unread count
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get recent notifications
  const { data: notifications = [] } = trpc.notifications.list.useQuery({
    limit: 10,
    offset: 0,
    unreadOnly: false,
  });

  // Mark as read mutation
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate({ id: notification.id });
    }

    // Navigate to related page
    if (notification.relatedOrderId) {
      navigate(`/my-orders`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return "📦";
      case "delivery":
        return "🚚";
      case "payment":
        return "💰";
      case "system":
        return "ℹ️";
      default:
        return "🔔";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Bildirimler</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-orange-600"
              onClick={() => markAllAsReadMutation.mutate()}
            >
              Tümünü Okundu İşaretle
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Henüz bildirim yok
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`cursor-pointer p-3 ${
                  !notification.isRead ? "bg-orange-50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3 w-full">
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm line-clamp-1">
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="h-2 w-2 bg-orange-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer justify-center text-orange-600"
              onClick={() => navigate("/notifications")}
            >
              Tüm Bildirimleri Gör
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
