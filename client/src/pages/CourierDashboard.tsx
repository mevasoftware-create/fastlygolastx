import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LOGO, APP_TITLE, ORDER_STATUS } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  CheckCircle2, Clock, MapPin, Package, TrendingUp, Settings, 
  Home, List, Bell, Menu, X, LogOut, User, Wallet, BarChart3
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { PhotoUploadModal } from "@/components/PhotoUploadModal";
import { EarningsReport } from "@/components/EarningsReport";
import { Camera } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function CourierDashboard() {
  const { t, language } = useTranslation();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [activePage, setActivePage] = useState("available");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [iban, setIban] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [identityType, setIdentityType] = useState<"tc" | "passport">("tc");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [photoUploadModalOpen, setPhotoUploadModalOpen] = useState(false);
  const [selectedOrderForPhoto, setSelectedOrderForPhoto] = useState<any>(null);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Query hooks
  const { data: courierStatus, isLoading: courierStatusLoading } = trpc.courier.getStatus.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: availableOrders, isLoading: ordersLoading } = trpc.courier.pendingOrders.useQuery(
    undefined,
    { enabled: isAuthenticated && courierStatus?.status === 'active' }
  );

  const { data: myOrders } = trpc.courier.myOrders.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: earnings } = trpc.courier.myEarnings.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const acceptOrderMutation = trpc.courier.acceptOrder.useMutation({
    onSuccess: () => {
      toast.success("Sipariş kabul edildi!");
      utils.courier.pendingOrders.invalidate();
      utils.courier.myOrders.invalidate();
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.courier.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Sipariş durumu güncellendi!");
      utils.courier.myOrders.invalidate();
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const setOnlineStatusMutation = trpc.courier.setOnlineStatus.useMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.isOnline ? "🟢 Çevrimiçi oldunuz" : "⚫ Çevrimdışı oldunuz");
      utils.courier.getStatus.invalidate();
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // All useEffect hooks
  // Mobil responsive: ekran boyutu değiştiğinde sidebar'ı kapat
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tek bir useEffect ile tüm yönlendirmeleri yönet
  useEffect(() => {
    // Loading durumunda bekle
    if (loading || courierStatusLoading) {
      return;
    }

    // Giriş yapmamış kullanıcıları courier/register'a yönlendir
    if (!isAuthenticated) {
      navigate("/courier/register");
      return;
    }

    // Kurye profili olmayan kullanıcıları direkt kayıt sayfasına yönlendir
    if (courierStatus === null) {
      navigate("/courier/register");
      return;
    }

    // Pending durumundaki kuryeyi onay sayfasına yönlendir
    if (courierStatus?.status === 'pending') {
      navigate("/pending-approval");
      return;
    }
  }, [isAuthenticated, loading, courierStatus, courierStatusLoading, navigate]);

  // Konum güncellemesi - sadece çevrimiçi kuryeler için
  const updateLocationMutation = trpc.courier.updateLocation.useMutation();
  const { socket, isConnected } = useSocket();
  
  // Konum güncelleme fonksiyonu - her 10 saniyede bir çağrılır
  const sendLocationUpdate = useCallback((latitude: number, longitude: number) => {
    const activeOrder = myOrders?.find((o: any) => !['delivered', 'cancelled'].includes(o.status));
    updateLocationMutation.mutate({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });
    if (socket && isConnected) {
      socket.emit('courier:updateLocation', {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        orderId: activeOrder?.id,
      });
    }
  }, [myOrders, socket, isConnected]);

  useEffect(() => {
    // Sadece çevrimiçi ve onaylı kuryeler için konum takibi yap
    if (!courierStatus?.isAvailable || courierStatus?.status !== 'active') {
      return;
    }

    if (!('geolocation' in navigator)) {
      toast.error('📍 Tarayıcınız konum servislerini desteklemiyor.');
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let permissionDeniedShown = false;

    const fetchAndSend = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendLocationUpdate(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Konum alınamadı:', error);
          if (error.code === error.PERMISSION_DENIED && !permissionDeniedShown) {
            permissionDeniedShown = true;
            toast.error('📍 Konum izni gerekli. Lütfen tarayıcı ayarlarından konum iznini aktif edin.');
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,  // 5 saniye önbelleğ
          timeout: 8000,     // 8 saniye timeout
        }
      );
    };

    // İlk konum alımını hemen yap
    fetchAndSend();

    // Her 10 saniyede bir güncelle
    intervalId = setInterval(fetchAndSend, 10000);

    // Cleanup: interval'i temizle
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [courierStatus?.isAvailable, courierStatus?.status, sendLocationUpdate]);

  // NOW SAFE TO DO CONDITIONAL RETURNS
  if (loading || courierStatusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to /courier/register
  }

  if (!courierStatus) {
    return null; // Will redirect to /courier/register
  }

  if (courierStatus.status === 'pending') {
    return null;
  }

  if (courierStatus.status === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Başvurunuz Reddedildi</CardTitle>
            <CardDescription>
              Kurye başvurunuz kabul edilmedi
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Maalesef başvurunuz şu anda kabul edilemedi. Daha fazla bilgi için destek ekibimizle iletişime geçebilirsiniz.
            </p>
            <Button variant="outline" className="border-orange-300" onClick={() => navigate("/")}>
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      accepted: "default",
      picked_up: "default",
      in_transit: "default",
      delivered: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{ORDER_STATUS[status as keyof typeof ORDER_STATUS] || status}</Badge>;
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      accepted: "picked_up",
      picked_up: "in_transit",
      in_transit: "delivered",
    };
    return statusFlow[currentStatus] || null;
  };

  const getNextStatusLabel = (currentStatus: string): string => {
    const labels: Record<string, string> = {
      accepted: "Paket Alındı",
      picked_up: "Yola Çıkıldı",
      in_transit: "Teslim Edildi",
    };
    return labels[currentStatus] || "Durumu Güncelle";
  };

  const menuItems = [
    { id: "available", label: "Müsait Siparişler", icon: Package },
    { id: "active", label: "Aktif Teslimatlar", icon: TrendingUp },
    { id: "history", label: "Geçmiş", icon: List },
    { id: "earnings", label: "Kazançlarım", icon: BarChart3 },
    { id: "withdraw", label: "Para Çekme", icon: Wallet },
    { id: "settings", label: "Ayarlar", icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`bg-white border-r border-orange-200 transition-all duration-300 fixed lg:sticky top-0 h-screen z-40 ${
        sidebarOpen ? 'w-64' : 'w-20'
      } flex flex-col shadow-lg`}>
        {/* Logo */}
        <div className="p-4 border-b border-orange-200 flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />}
              <span className="font-bold text-lg">Kurye Panel</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Stats Summary */}
        {sidebarOpen && (
          <div className="p-4 border-b border-orange-200">
            <div className="space-y-3">
              {/* Online/Offline Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Durum:</span>
                <button
                  onClick={() => {
                    const newStatus = !courierStatus?.isAvailable;
                    setOnlineStatusMutation.mutate({ isOnline: newStatus });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    courierStatus?.isAvailable
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-400 text-white hover:bg-gray-500'
                  }`}
                >
                  {courierStatus?.isAvailable ? '🟢 Çevrimiçi' : '⚫ Çevrimdışı'}
                </button>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Kazanç:</span>
                <span className="font-bold text-orange-600">€{(earnings?.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Aktif:</span>
                <span className="font-bold">{myOrders?.filter(o => !['delivered', 'cancelled'].includes(o.status)).length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Müsait:</span>
                <span className="font-bold">{availableOrders?.length || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center rounded-lg transition-all duration-200 ${sidebarOpen ? 'gap-3 px-4 py-4' : 'justify-center px-2 py-4'} ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-lg transition-colors text-red-600 hover:bg-red-50 border-t border-orange-200 mt-6 pt-6 ${sidebarOpen ? 'gap-3 px-4 py-4' : 'justify-center px-2 py-4'}`}
          >
            <LogOut className="w-6 h-6 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Çıkış Yap</span>}
          </button>
        </nav>

        {/* User Info */}
        {sidebarOpen && user && (
          <div className="p-4 border-t border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100">
            <div className="text-sm">
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-gray-500 text-xs">{user.email}</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
      } ml-20`}>
        <div className="p-4 md:p-6">
          {/* Available Orders Page */}
          {activePage === "available" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Müsait Siparişler</h1>
                <p className="text-gray-600 mt-1">Kabul edebileceğiniz siparişler</p>
              </div>

              {ordersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
              ) : availableOrders && availableOrders.length > 0 ? (
                <div className="grid gap-6">
                  {availableOrders.map((order: any) => (
                    <Card key={order.id} className="hover:shadow-lg transition-shadow border-orange-200">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>Sipariş #{order.orderNumber}</CardTitle>
                            <CardDescription>
                              {order.orderType}
                              {order.createdAt && (
                                <span className="block text-xs text-muted-foreground mt-1">
                                  {new Date(order.createdAt).toLocaleString(language === 'tr' ? 'tr-TR' : language === 'mk' ? 'mk-MK' : 'en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </CardDescription>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-orange-500 mt-0.5" />
                              <div>
                                <p className="font-medium">Alış Noktası</p>
                                <p className="text-muted-foreground">{order.pickupAddress}</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                              <div>
                                <p className="font-medium">Teslimat Noktası</p>
                                <p className="text-muted-foreground">{order.deliveryAddress}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Delivery Time Info */}
                        {order.deliveryTimeType === "scheduled" && order.scheduledDeliveryDate && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">📅</span>
                              <span className="font-semibold text-blue-800">{t('deliveryScheduled')}</span>
                            </div>
                            <div className="text-sm text-blue-700">
                              <p><strong>{t('selectDate')}:</strong> {new Date(order.scheduledDeliveryDate).toLocaleDateString(language === 'tr' ? 'tr-TR' : language === 'mk' ? 'mk-MK' : 'en-US')}</p>
                              {order.scheduledTimeSlot && <p><strong>{t('selectTimeSlot')}:</strong> {order.scheduledTimeSlot}</p>}
                            </div>
                          </div>
                        )}
                        {order.deliveryTimeType === "now" && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">⚡</span>
                              <span className="font-semibold text-orange-800">{t('deliveryNow')}</span>
                            </div>
                            <div className="text-sm text-orange-700 mt-1">
                              <p>{t('deliveryNowDesc')}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Payment Info */}
                        {order.paymentType === "receiver_pays" && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">💰</span>
                              <span className="font-semibold text-yellow-800">{t('paymentCollect')}</span>
                            </div>
                            <div className="text-sm text-yellow-700">
                              <p>{t('paymentCollectDesc')}</p>
                              <p>{t('paymentMethod')}: <strong>{order.paymentMethod === "cash" ? t('cash') + " 💵" : order.paymentMethod === "card" ? t('card') + " 💳" : t('wallet') + " 👛"}</strong></p>
                              <p className="font-bold text-lg mt-1">{t('collectedAmount')}: €{(order.totalFee / 100).toFixed(2)}</p>
                            </div>
                          </div>
                        )}
                        {order.paymentType === "sender_pays" && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">✅</span>
                              <span className="font-semibold text-green-800">{t('paymentNotCollect')}</span>
                            </div>
                            <div className="text-sm text-green-700 mt-1">
                              <p>{t('paymentNotCollectDesc')}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="text-sm">
                            <span className="text-muted-foreground">{t('yourEarnings')}: </span>
                            <span className="font-bold text-lg text-orange-600">€{((order.deliveryFee || order.totalFee || 0) / 100).toFixed(2)}</span>
                          </div>
                          <Button
                            onClick={() => acceptOrderMutation.mutate({ orderId: order.id })}
                            disabled={acceptOrderMutation.isPending}
                            className="bg-gradient-to-r from-orange-500 to-orange-600"
                          >
                            {acceptOrderMutation.isPending ? "Kabul Ediliyor..." : "Siparişi Kabul Et"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Şu anda müsait sipariş bulunmuyor</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Active Deliveries Page */}
          {activePage === "active" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Aktif Teslimatlar</h1>
                <p className="text-gray-600 mt-1">Devam eden siparişleriniz</p>
              </div>

              {myOrders && myOrders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length > 0 ? (
                <div className="grid gap-6">
                  {myOrders
                    .filter(o => !['delivered', 'cancelled'].includes(o.status))
                    .map((order: any) => {
                      const nextStatus = getNextStatus(order.status);
                      return (
                        <Card key={order.id} className="hover:shadow-lg transition-shadow border-orange-200">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>Sipariş #{order.orderNumber}</CardTitle>
                                <CardDescription>
                                  {order.orderType}
                                  {order.createdAt && (
                                    <span className="block text-xs text-muted-foreground mt-1">
                                      {new Date(order.createdAt).toLocaleString(language === 'tr' ? 'tr-TR' : language === 'mk' ? 'mk-MK' : 'en-US', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  )}
                                </CardDescription>
                              </div>
                              {getStatusBadge(order.status)}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-start gap-2 text-sm">
                                  <MapPin className="h-4 w-4 text-orange-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Alış Noktası</p>
                                    <p className="text-muted-foreground">{order.pickupAddress}</p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-start gap-2 text-sm">
                                  <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Teslimat Noktası</p>
                                    <p className="text-muted-foreground">{order.deliveryAddress}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Payment Info */}
                            {order.paymentType === "receiver_pays" && order.paymentStatus !== "collected" && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">💰</span>
                                  <span className="font-semibold text-yellow-800">{t('paymentCollect')}</span>
                                </div>
                                <div className="text-sm text-yellow-700">
                                  <p>{t('paymentCollectDesc')}</p>
                                  <p>{t('paymentMethod')}: <strong>{order.paymentMethod === "cash" ? t('cash') + " 💵" : order.paymentMethod === "card" ? t('card') + " 💳" : t('wallet') + " 👛"}</strong></p>
                                  <p className="font-bold text-lg mt-1">{t('collectedAmount')}: €{(order.totalFee / 100).toFixed(2)}</p>
                                </div>
                              </div>
                            )}
                            {order.paymentType === "receiver_pays" && order.paymentStatus === "collected" && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">✅</span>
                                  <span className="font-semibold text-green-800">{t('paymentCollected')}</span>
                                </div>
                                <div className="text-sm text-green-700 mt-1">
                                  <p>{t('collectedAmount')}: <strong>€{(order.collectedAmount / 100).toFixed(2)}</strong></p>
                                  <p className="text-xs text-gray-600 mt-1">{new Date(order.collectedAt).toLocaleString('tr-TR')}</p>
                                </div>
                              </div>
                            )}
                            {order.paymentType === "sender_pays" && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">✅</span>
                                  <span className="font-semibold text-green-800">{t('paymentNotCollect')}</span>
                                </div>
                                <div className="text-sm text-green-700 mt-1">
                                  <p>{t('paymentNotCollectDesc')}</p>
                                </div>
                              </div>
                            )}
                            
                            <div className="space-y-3 pt-4 border-t">
                              <div className="flex justify-between items-center">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">{t('yourEarnings')}: </span>
                                  <span className="font-bold text-lg text-orange-600">€{((order.totalFee || 0) / 100).toFixed(2)}</span>
                                </div>
                                {nextStatus && (
                                  <Button
                                    onClick={() => {
                                      // Photo is required for picked_up and delivered status
                                      if (nextStatus === "picked_up" || nextStatus === "delivered") {
                                        setSelectedOrderForPhoto(order);
                                        setPhotoUploadModalOpen(true);
                                      } else {
                                        updateStatusMutation.mutate({ orderId: order.id, status: nextStatus as "picked_up" | "in_transit" | "delivered" });
                                      }
                                    }}
                                    disabled={updateStatusMutation.isPending}
                                    className="bg-gradient-to-r from-orange-500 to-orange-600"
                                  >
                                    {updateStatusMutation.isPending ? "Güncelleniyor..." : getNextStatusLabel(order.status)}
                                  </Button>
                                )}
                              </div>
                              
                              {/* Mark Payment Collected Button */}
                              {order.paymentType === "receiver_pays" && order.paymentStatus !== "collected" && order.status !== "pending" && (
                                <Button
                                  onClick={() => {
                                    const markPaymentMutation = trpc.courier.markPaymentCollected.useMutation({
                                      onSuccess: () => {
                                        toast.success("Ödeme alındı olarak işaretlendi!");
                                        utils.courier.myOrders.invalidate();
                                      },
                                      onError: (error) => {
                                        toast.error(`Hata: ${error.message}`);
                                      },
                                    });
                                    markPaymentMutation.mutate({
                                      orderId: order.id,
                                      collectedAmount: order.totalFee,
                                    });
                                  }}
                                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                                >
                                  💰 {t('paymentCollectedButton')} (€{(order.totalFee / 100).toFixed(2)})
                                </Button>
                              )}
                              

                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aktif teslimatınız bulunmuyor</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* History Page */}
          {activePage === "history" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Teslimat Geçmişi</h1>
                <p className="text-gray-600 mt-1">Tamamlanan ve iptal edilen siparişler</p>
              </div>

              {myOrders && myOrders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length > 0 ? (
                <div className="grid gap-6">
                  {myOrders
                    .filter(o => ['delivered', 'cancelled'].includes(o.status))
                    .map((order: any) => (
                      <Card key={order.id} className="border-gray-200">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>Sipariş #{order.orderNumber}</CardTitle>
                              <CardDescription>
                                {order.orderType}
                                {order.createdAt && (
                                  <span className="block text-xs text-muted-foreground mt-1">
                                    {new Date(order.createdAt).toLocaleString(language === 'tr' ? 'tr-TR' : language === 'mk' ? 'mk-MK' : 'en-US', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                )}
                              </CardDescription>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-start gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                <div>
                                  <p className="font-medium">Alış Noktası</p>
                                  <p className="text-muted-foreground">{order.pickupAddress}</p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-start gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                <div>
                                  <p className="font-medium">Teslimat Noktası</p>
                                  <p className="text-muted-foreground">{order.deliveryAddress}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-4 border-t">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Kazanç: </span>
                              <span className="font-bold text-lg">€{((order.totalFee || 0) / 100).toFixed(2)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <List className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Henüz teslimat geçmişiniz bulunmuyor</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Withdraw Page */}
          {activePage === "withdraw" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Para Çekme</h1>
                <p className="text-gray-600 mt-1">Kazancınızı çekin</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Toplam Kazanç</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      €{(earnings?.total || 0).toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {earnings?.earnings?.length || 0} teslim tamamlandı
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Çekilebilir Bakiye</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      €{(earnings?.total || 0).toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Çekim için hazır
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Para Çekme Talebi</CardTitle>
                  <CardDescription>Ödeme bilgilerinizi kontrol edin ve çekim talebinde bulunun</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount">Miktar (€)</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Çekmek istediğiniz miktar"
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600"
                    onClick={() => {
                      toast.info("Ödeme sistemi yakında! Para çekmek için admin ile iletişime geçin.");
                      setWithdrawAmount("");
                    }}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Çekim Talebi Oluştur
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Earnings Page */}
          {activePage === "earnings" && (
            <div className="space-y-6">
              <EarningsReport />
            </div>
          )}

          {/* Settings Page */}
          {activePage === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
                <p className="text-gray-600 mt-1">Hesap ve kurye ayarlarınız</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Kurye Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {courierStatus.gender && (
                    <div>
                      <p className="text-sm text-muted-foreground">Cinsiyet</p>
                      <p className="font-medium">
                        {courierStatus.gender === 'male' ? 'Erkek' : 
                         courierStatus.gender === 'female' ? 'Kadın' : 'Diğer'}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Araç Tipi</p>
                    <p className="font-medium">{courierStatus.vehicleType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plaka</p>
                    <p className="font-medium">{courierStatus.vehiclePlate || "Belirtilmemiş"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Durum</p>
                    <Badge variant="default">{courierStatus.status}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hızlı Aksiyonlar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate("/")}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Ana Sayfaya Git
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Photo Upload Modal (Pickup or Delivery) */}
      {selectedOrderForPhoto && (
        <PhotoUploadModal
          orderId={selectedOrderForPhoto.id}
          orderNumber={selectedOrderForPhoto.orderNumber}
          photoType={selectedOrderForPhoto.status === 'accepted' ? 'pickup' : selectedOrderForPhoto.status === 'in_transit' ? 'delivery' : 'pickup'}
          currentStatus={selectedOrderForPhoto.status}
          isOpen={photoUploadModalOpen}
          onClose={() => {
            setPhotoUploadModalOpen(false);
            setSelectedOrderForPhoto(null);
          }}
          onSuccess={() => {
            // Refresh orders list
          }}
        />
      )}
    </div>
  );
}
