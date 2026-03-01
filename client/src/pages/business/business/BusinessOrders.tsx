import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search, Filter, MapPin, User, Phone, Clock, DollarSign } from "lucide-react";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/currency";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BusinessOrders() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Get business orders
  const { data: orders = [], isLoading } = trpc.business.myOrders.useQuery(undefined, {
    enabled: !!user && user.role === "business",
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "business") {
    setLocation("/");
    return null;
  }

  // Filter orders
  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Beklemede", variant: "secondary" },
      accepted: { label: "Kabul Edildi", variant: "default" },
      picked_up: { label: "Alındı", variant: "default" },
      in_transit: { label: "Yolda", variant: "default" },
      delivered: { label: "Teslim Edildi", variant: "outline" },
      cancelled: { label: "İptal Edildi", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getOrderTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      restaurant: "Restoran",
      market: "Market",
      pharmacy: "Eczane",
      individual: "Bireysel",
      express: "Ekspres",
    };
    return types[type] || type;
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === "pending").length,
    inProgress: orders.filter((o: any) => ["accepted", "picked_up", "in_transit"].includes(o.status)).length,
    completed: orders.filter((o: any) => o.status === "delivered").length,
    totalSpent: orders.reduce((sum: number, o: any) => sum + (o.totalFee || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Sipariş Geçmişi</h1>
          <p className="text-gray-600 mt-2">İşletmenizin tüm teslimat siparişlerini görüntüleyin ve takip edin</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Beklemede</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Devam Eden</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                <MapPin className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tamamlanan</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <Package className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Harcama</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalSpent, language)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Sipariş numarası veya adres ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Durum Filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="accepted">Kabul Edildi</SelectItem>
                    <SelectItem value="picked_up">Alındı</SelectItem>
                    <SelectItem value="in_transit">Yolda</SelectItem>
                    <SelectItem value="delivered">Teslim Edildi</SelectItem>
                    <SelectItem value="cancelled">İptal Edildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sipariş Bulunamadı</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== "all"
                  ? "Arama kriterlerinize uygun sipariş bulunamadı."
                  : "Henüz sipariş oluşturmadınız."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order: any) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="font-mono">#{order.orderNumber}</span>
                        {getStatusBadge(order.status)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {new Date(order.createdAt).toLocaleString("tr-TR")}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Tutar</p>
                      <p className="text-xl font-bold text-orange-600">
                        {formatCurrency(order.totalFee || 0, language)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-orange-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Alış Adresi</p>
                          <p className="text-sm text-gray-600">{order.pickupAddress}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Teslimat Adresi</p>
                          <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      <span>{getOrderTypeLabel(order.orderType)}</span>
                    </div>
                    {order.courierId && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Kurye ID: {order.courierId}</span>
                      </div>
                    )}
                  </div>

                  {order.packageDescription && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Paket Açıklaması:</span> {order.packageDescription}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/track-order/${order.orderNumber}`)}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Canlı Takip
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
