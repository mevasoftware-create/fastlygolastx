import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_LOGO, APP_TITLE, ORDER_STATUS, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Building2, Wallet, Plus, Package, Settings, 
  Menu, X, LogOut, Home, List, BarChart3, MapPin, Image as ImageIcon,
  Bike, Truck, Box, Zap, CheckCircle, User, Phone, Clock, DollarSign
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { AddressMapPicker } from "@/components/AddressMapPicker";

export default function BusinessDashboard() {
  const [, navigate] = useLocation();
  const { user, loading, logout } = useAuth();
  const [activePage, setActivePage] = useState("orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [orderForm, setOrderForm] = useState({
    deliveryAddress: "",
    deliveryLatitude: "",
    deliveryLongitude: "",
    packageSize: "medium" as "small" | "medium" | "large",
    priority: "normal" as "normal" | "fast" | "urgent",
    vehicleType: "any" as "bicycle" | "motorcycle" | "car" | "any",
    packageDescription: "",
    specialInstructions: "",
    customerName: "",
    customerPhone: "",
  });
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [priceEstimate, setPriceEstimate] = useState<{
    distance: number;
    baseFee: number;
    distanceFee: number;
    vehicleFee: number;
    priorityFee: number;
    packageSizeFee: number;
    totalFee: number;
  } | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

  const { data: profile, isLoading: profileLoading } = trpc.restaurant.getProfile.useQuery(undefined, {
    enabled: !!user && !loading,
  });
  const { data: myOrders } = trpc.restaurant.myOrders.useQuery(undefined, {
    enabled: !!user && !!profile,
  });
  const { data: transactions } = trpc.restaurant.getTransactions.useQuery(undefined, {
    enabled: !!user && !!profile,
  });
  const createOrderMutation = trpc.restaurant.createDelivery.useMutation();

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

  // Giriş yapmamış kullanıcıları direkt business/register'a yönlendir
  useEffect(() => {
    if (!loading && !user) {
      navigate("/business/register");
    }
  }, [user, loading, navigate]);

  // Profile yoksa direkt kayıt sayfasına yönlendir
  useEffect(() => {
    if (!loading && !profileLoading && user && !profile) {
      navigate("/business/register");
    }
  }, [user, profile, loading, profileLoading, navigate]);

  // İşletme durumuna göre yönlendirme
  useEffect(() => {
    if (!loading && !profileLoading && user && profile) {
      // Pending durumda onay bekleyen sayfaya yönlendir
      if (profile.status === 'inactive' || profile.status === 'suspended') {
        navigate("/pending-approval");
        return;
      }
    }
  }, [user, profile, profile?.status, loading, profileLoading, navigate]);

  // Calculate price whenever relevant fields change
  useEffect(() => {
    const calculateLivePrice = async () => {
      // Check if we have valid coordinates and profile
      if (!profile?.latitude || !profile?.longitude || !orderForm.deliveryLatitude || !orderForm.deliveryLongitude) {
        setPriceEstimate(null);
        return;
      }

      setIsCalculatingPrice(true);
      try {
        const pickupLat = parseFloat(profile.latitude);
        const pickupLng = parseFloat(profile.longitude);
        const deliveryLat = parseFloat(orderForm.deliveryLatitude);
        const deliveryLng = parseFloat(orderForm.deliveryLongitude);

        // Calculate distance using Haversine formula
        const R = 6371; // Earth radius in km
        const dLat = (deliveryLat - pickupLat) * Math.PI / 180;
        const dLon = (deliveryLng - pickupLng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(pickupLat * Math.PI / 180) * Math.cos(deliveryLat * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c * 1000; // Convert to meters

        // Pricing calculation (Scenario B for businesses)
        const baseFee = 350; // 3.50 EUR in cents
        const perKmFee = 60; // 0.60 EUR per km in cents
        const distanceFee = Math.round((distance / 1000) * perKmFee);

        // Vehicle type fee
        let vehicleFee = 0;
        if (orderForm.vehicleType === "car") {
          vehicleFee = 150; // +1.50 EUR
        } else if (orderForm.vehicleType === "motorcycle") {
          vehicleFee = 50; // +0.50 EUR
        }

        // Package size fee
        let packageSizeFee = 0;
        if (orderForm.packageSize === "large") {
          packageSizeFee = 100; // +1.00 EUR
        } else if (orderForm.packageSize === "medium") {
          packageSizeFee = 50; // +0.50 EUR
        }

        // Calculate subtotal before priority multiplier
        const subtotal = baseFee + distanceFee + vehicleFee + packageSizeFee;

        // Priority multiplier and fee
        let priorityMultiplier = 1.0;
        let priorityFee = 0;
        if (orderForm.priority === "urgent") {
          priorityMultiplier = 1.5; // +50%
          priorityFee = Math.round(subtotal * 0.5);
        } else if (orderForm.priority === "fast") {
          priorityMultiplier = 1.25; // +25%
          priorityFee = Math.round(subtotal * 0.25);
        }

        const totalFee = Math.round(subtotal * priorityMultiplier);

        setPriceEstimate({
          distance: Math.round(distance),
          baseFee,
          distanceFee,
          vehicleFee,
          priorityFee,
          packageSizeFee,
          totalFee,
        });
      } catch (error) {
        console.error('Error calculating price:', error);
      } finally {
        setIsCalculatingPrice(false);
      }
    };

    calculateLivePrice();
  }, [profile?.latitude, profile?.longitude, orderForm.deliveryLatitude, orderForm.deliveryLongitude, orderForm.vehicleType, orderForm.packageSize, orderForm.priority]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to /business/register
  }

  if (!profile) {
    return null; // Will redirect to /business/register
  }

  // Pending status redirect handled by useEffect above
  if (profile.status === "inactive" || profile.status === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Başvuru Reddedildi</CardTitle>
            <CardDescription>İşletme kaydınız onaylanmadı</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Daha fazla bilgi için destek ekibiyle iletişime geçin.
            </p>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full border-orange-300">
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrderMutation.mutateAsync({
        deliveryAddress: orderForm.deliveryAddress,
        deliveryLatitude: orderForm.deliveryLatitude || undefined,
        deliveryLongitude: orderForm.deliveryLongitude || undefined,
        packageDescription: orderForm.packageDescription,
        specialInstructions: orderForm.specialInstructions,
        vehicleType: orderForm.vehicleType,
        packageSize: orderForm.packageSize,
        priority: orderForm.priority,
      });
      
      // TODO: Add price validation when frontend price calculation is implemented
      
      toast.success("Sipariş oluşturuldu!");
      setOrderForm({
        deliveryAddress: "",
        deliveryLatitude: "",
        deliveryLongitude: "",
        packageSize: "medium",
        priority: "normal",
        vehicleType: "any",
        packageDescription: "",
        specialInstructions: "",
        customerName: "",
        customerPhone: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Sipariş oluşturulamadı");
    }
  };

  const balanceInDenar = (profile.balance / 100).toFixed(2);
  const debtInDenar = (profile.totalDebt / 100).toFixed(2);

  const menuItems = [
    { id: "orders", label: "Siparişlerim", icon: Package },
    { id: "create", label: "Yeni Sipariş", icon: Plus },
    { id: "balance", label: "Bakiye", icon: Wallet },

    { id: "settings", label: "Ayarlar", icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

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
              <span className="font-bold text-lg">İşletme Panel</span>
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
          <div className="p-4 border-b border-orange-200 bg-orange-50">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bakiye:</span>
                <span className="font-bold text-orange-600">{balanceInDenar} MKD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Borç:</span>
                <span className="font-bold text-red-600">{debtInDenar} MKD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Siparişler:</span>
                <span className="font-bold">{myOrders?.length || 0}</span>
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
            className={`w-full flex items-center rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50 border-t border-orange-200 mt-6 pt-6 ${sidebarOpen ? 'gap-3 px-4 py-4' : 'justify-center px-2 py-4'}`}
          >
            <LogOut className="w-6 h-6 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Çıkış Yap</span>}
          </button>
        </nav>

        {/* Business Info */}
        {sidebarOpen && (
          <div className="p-4 border-t border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100">
            <div className="text-sm">
              <p className="font-medium text-gray-900">{profile.businessName}</p>
              <p className="text-gray-500 text-xs">{user?.email}</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
      } ml-20`}>
        <div className="p-4 md:p-6">
          {/* Orders Page */}
          {activePage === "orders" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Siparişlerim</h1>
                <p className="text-gray-600 mt-1">Tüm teslimat siparişleriniz</p>
              </div>

              {myOrders && myOrders.length > 0 ? (
                <div className="grid gap-6">
                  {myOrders.map((order: any) => (
                    <Card key={order.id} className="hover:shadow-lg transition-shadow border-orange-200">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>Sipariş #{order.orderNumber}</CardTitle>
                            <CardDescription>{order.orderType}</CardDescription>
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
                        {/* Delivery Photo */}
                        {order.status === "delivered" && order.deliveryPhotoUrl && (
                          <div className="pt-4 border-t">
                            <div className="flex items-center gap-2 mb-2">
                              <ImageIcon className="h-4 w-4 text-green-600" />
                              <p className="text-sm font-semibold text-gray-900">Teslimat Fotoğrafı</p>
                            </div>
                            <div 
                              className="relative group cursor-pointer"
                              onClick={() => {
                                setSelectedPhotoUrl(order.deliveryPhotoUrl);
                                setPhotoModalOpen(true);
                              }}
                            >
                              <img
                                src={order.deliveryPhotoUrl}
                                alt="Teslimat fotoğrafı"
                                className="w-48 h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-orange-500 transition-colors bg-gray-50"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-lg flex items-center justify-center">
                                <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                  Büyütmek için tıklayın
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Ücret: </span>
                            <span className="font-bold text-lg text-orange-600">{(order.deliveryFee / 100).toFixed(2)} MKD</span>
                          </div>
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-orange-300 text-orange-600"
                              onClick={() => navigate(`/track-order/${order.orderNumber}`)}
                            >
                              Canlı Takip
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Henüz siparişiniz bulunmuyor</p>
                    <Button 
                      className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600"
                      onClick={() => setActivePage("create")}
                    >
                      İlk Siparişi Oluştur
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Create Order Page - MODERN RICH FORM */}
          {activePage === "create" && (
            <div className="space-y-8">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Plus className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold">Yeni Sipariş Oluştur</h1>
                    <p className="text-xl opacity-95 mt-2">Profesyonel teslimat hizmeti</p>
                  </div>
                </div>
              </div>

              <Card className="shadow-2xl border-none bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-50 via-orange-100/50 to-orange-50 border-b border-orange-200/50 p-8">
                  <CardTitle className="text-3xl font-bold text-gray-900">Sipariş Detayları</CardTitle>
                  <CardDescription className="text-gray-600 text-lg mt-2">
                    Teslimat bilgilerini eksiksiz doldurun
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 md:p-10 space-y-10">
                  <form onSubmit={handleCreateOrder} className="space-y-10">
                    
                    {/* Customer Information */}
                    <div className="space-y-5">
                      <Label className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        Müşteri Bilgileri
                      </Label>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="customerName" className="text-base font-semibold text-gray-700">Müşteri Adı</Label>
                          <Input
                            id="customerName"
                            value={orderForm.customerName}
                            onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                            placeholder="Alıcının adı soyadı"
                            className="border-orange-200 focus:border-orange-400 focus:ring-orange-400 rounded-xl h-12 text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customerPhone" className="text-base font-semibold text-gray-700">Müşteri Telefonu</Label>
                          <Input
                            id="customerPhone"
                            value={orderForm.customerPhone}
                            onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                            placeholder="Alıcının telefon numarası"
                            className="border-orange-200 focus:border-orange-400 focus:ring-orange-400 rounded-xl h-12 text-base"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="space-y-5">
                      <Label className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        Teslimat Adresi
                      </Label>
                      <AddressMapPicker
                        label="Teslimat Noktası"
                        value={orderForm.deliveryAddress}
                        onChange={(address, lat, lng) => setOrderForm({ 
                          ...orderForm, 
                          deliveryAddress: address,
                          deliveryLatitude: String(lat),
                          deliveryLongitude: String(lng)
                        })}
                        placeholder="Teslimat adresini girin veya haritadan seçin..."
                      />
                    </div>

                    {/* Package Size */}
                    <div className="space-y-5">
                      <Label className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <Box className="h-5 w-5 text-white" />
                        </div>
                        Paket Boyutu
                      </Label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: "small", label: "Küçük", icon: "📦", size: "< 5kg" },
                          { value: "medium", label: "Orta", icon: "📦", size: "5-15kg" },
                          { value: "large", label: "Büyük", icon: "📦", size: "> 15kg" },
                        ].map((size) => (
                          <button
                            key={size.value}
                            type="button"
                            onClick={() => setOrderForm({ ...orderForm, packageSize: size.value as any })}
                            className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-center transform hover:scale-105 ${
                              orderForm.packageSize === size.value
                                ? "border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl"
                                : "border-gray-200 hover:border-orange-300 bg-white hover:shadow-lg"
                            }`}
                          >
                            <div className="text-4xl mb-3">{size.icon}</div>
                            <div className="font-bold text-base text-gray-900 mb-1">{size.label}</div>
                            <div className="text-sm text-gray-600">{size.size}</div>
                            {orderForm.packageSize === size.value && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Priority Level */}
                    <div className="space-y-5">
                      <Label className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        Öncelik Seviyesi
                      </Label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: "normal", label: "Normal", icon: "🟢", time: "+30 dk" },
                          { value: "fast", label: "Hızlı", icon: "🟡", time: "+15 dk" },
                          { value: "urgent", label: "Acil", icon: "🔴", time: "ASAP" },
                        ].map((priority) => (
                          <button
                            key={priority.value}
                            type="button"
                            onClick={() => setOrderForm({ ...orderForm, priority: priority.value as any })}
                            className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-center transform hover:scale-105 ${
                              orderForm.priority === priority.value
                                ? "border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl"
                                : "border-gray-200 hover:border-orange-300 bg-white hover:shadow-lg"
                            }`}
                          >
                            <div className="text-4xl mb-3">{priority.icon}</div>
                            <div className="font-bold text-base text-gray-900 mb-1">{priority.label}</div>
                            <div className="text-sm text-gray-600">{priority.time}</div>
                            {orderForm.priority === priority.value && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Vehicle Type */}
                    <div className="space-y-5">
                      <Label className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                          <Bike className="h-5 w-5 text-white" />
                        </div>
                        Araç Tercihi
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { value: "bicycle", label: "Bisiklet", icon: <Bike className="h-8 w-8" /> },
                          { value: "motorcycle", label: "Motosiklet", icon: <Bike className="h-8 w-8" /> },
                          { value: "car", label: "Araba", icon: <Truck className="h-8 w-8" /> },
                          { value: "any", label: "Fark Etmez", icon: <Package className="h-8 w-8" /> },
                        ].map((vehicle) => (
                          <button
                            key={vehicle.value}
                            type="button"
                            onClick={() => setOrderForm({ ...orderForm, vehicleType: vehicle.value as any })}
                            className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 transform hover:scale-105 ${
                              orderForm.vehicleType === vehicle.value
                                ? "border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl"
                                : "border-gray-200 hover:border-orange-300 bg-white hover:shadow-lg"
                            }`}
                          >
                            <div className="text-orange-600">{vehicle.icon}</div>
                            <div className="font-bold text-sm text-gray-900">{vehicle.label}</div>
                            {orderForm.vehicleType === vehicle.value && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Package Description */}
                    <div className="space-y-4">
                      <Label htmlFor="packageDescription" className="text-lg font-bold text-gray-900">Paket Açıklaması *</Label>
                      <Input
                        id="packageDescription"
                        value={orderForm.packageDescription}
                        onChange={(e) => setOrderForm({ ...orderForm, packageDescription: e.target.value })}
                        placeholder="Örn: 2 pizza, 1 salata, 2 içecek"
                        required
                        className="border-orange-200 focus:border-orange-400 focus:ring-orange-400 rounded-2xl h-14 text-base"
                      />
                    </div>

                    {/* Special Instructions */}
                    <div className="space-y-4">
                      <Label htmlFor="specialInstructions" className="text-lg font-bold text-gray-900">Özel Talimatlar</Label>
                      <Textarea
                        id="specialInstructions"
                        value={orderForm.specialInstructions}
                        onChange={(e) => setOrderForm({ ...orderForm, specialInstructions: e.target.value })}
                        placeholder="Kurye için özel notlar, adres tarifi, kapı kodu vb..."
                        rows={4}
                        className="resize-none border-orange-200 focus:border-orange-400 focus:ring-orange-400 rounded-2xl text-base"
                      />
                    </div>

                    {/* Price Calculation */}
                    {orderForm.deliveryAddress && (
                      <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                            <DollarSign className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">Fiyat Hesaplaması</h3>
                            <p className="text-sm text-gray-600">Tahmini teslimat ücreti</p>
                          </div>
                        </div>

                        {isCalculatingPrice ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                          </div>
                        ) : priceEstimate ? (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                              <span className="text-gray-700">Temel Üret</span>
                              <span className="font-bold text-gray-900">€{(priceEstimate.baseFee / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                              <span className="text-gray-700">Mesafe ({(priceEstimate.distance / 1000).toFixed(1)} km)</span>
                              <span className="font-bold text-gray-900">€{(priceEstimate.distanceFee / 100).toFixed(2)}</span>
                            </div>
                            {priceEstimate.vehicleFee > 0 && (
                              <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                                <span className="text-gray-700">Araç Tipi</span>
                                <span className="font-bold text-gray-900">€{(priceEstimate.vehicleFee / 100).toFixed(2)}</span>
                              </div>
                            )}
                            {priceEstimate.priorityFee > 0 && (
                              <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                                <span className="text-gray-700">Öncelik Ücreti</span>
                                <span className="font-bold text-gray-900">€{(priceEstimate.priorityFee / 100).toFixed(2)}</span>
                              </div>
                            )}
                            {priceEstimate.packageSizeFee > 0 && (
                              <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                                <span className="text-gray-700">Paket Boyutu</span>
                                <span className="font-bold text-gray-900">€{(priceEstimate.packageSizeFee / 100).toFixed(2)}</span>
                              </div>
                            )}
                            
                            <div className="border-t-2 border-orange-300 pt-3">
                              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-white">
                                <span className="text-xl font-bold">Toplam</span>
                                <span className="text-3xl font-bold">€{(priceEstimate.totalFee / 100).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <p>Teslimat adresi seçildikten sonra fiyat hesaplanacak</p>
                          </div>
                        )}
                      </Card>
                    )}

                    {/* Submit Button */}
                    <div className="pt-6">
                      <Button
                        type="submit"
                        disabled={createOrderMutation.isPending || !orderForm.deliveryAddress || !orderForm.packageDescription}
                        className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:via-orange-700 hover:to-amber-700 text-white font-bold py-7 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {createOrderMutation.isPending ? (
                          <span className="flex items-center justify-center gap-3">
                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            Sipariş Oluşturuluyor...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-3">
                            <CheckCircle className="h-6 w-6" />
                            Sipariş Oluştur
                            <Plus className="h-6 w-6" />
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Balance Page */}
          {activePage === "balance" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Bakiye Yönetimi</h1>
                <p className="text-gray-600 mt-1">Hesap bakiyenizi görüntüleyin</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Mevcut Bakiye</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{balanceInDenar} MKD</div>
                    <p className="text-xs text-muted-foreground mt-1">Kullanılabilir bakiye</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Toplam Borç</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{debtInDenar} MKD</div>
                    <p className="text-xs text-muted-foreground mt-1">Ödenmesi gereken</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Durum</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={profile.status === "active" ? "default" : "secondary"}>
                      {profile.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">Hesap durumu</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Bakiye Yükle</CardTitle>
                  <CardDescription>Hesabınıza bakiye ekleyin</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="topup">Miktar (MKD)</Label>
                      <Input
                        id="topup"
                        type="number"
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(e.target.value)}
                        placeholder="Miktar girin"
                      />
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600"
                      onClick={() => {
                        toast.info("Ödeme entegrasyonu yakında! Bakiye yüklemek için admin ile iletişime geçin.");
                        setTopupAmount("");
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Bakiye Yükle
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {transactions && transactions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>İşlem Geçmişi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {transactions.map((tx: any) => (
                        <div key={tx.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{tx.type}</p>
                            <p className="text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString('tr-TR')}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{(tx.amount / 100).toFixed(2)} MKD</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}



          {/* Settings Page */}
          {activePage === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
                <p className="text-gray-600 mt-1">İşletme ayarlarınız</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>İşletme Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">İşletme Adı</p>
                    <p className="font-medium">{profile.businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">İletişim Kişisi</p>
                    <p className="font-medium">{profile.contactPerson}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Adres</p>
                    <p className="font-medium">{profile.address}</p>
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

      {/* Photo Modal */}
      <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Teslimat Fotoğrafı</DialogTitle>
          </DialogHeader>
          {selectedPhotoUrl && (
            <img
              src={selectedPhotoUrl}
              alt="Teslimat fotoğrafı"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
