import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Star, AlertTriangle, Award, Search, Filter } from "lucide-react";
import { useLocation } from "wouter";

export default function CourierRatings() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  // Redirect if not admin
  if (!loading && (!isAuthenticated || user?.role !== "admin")) {
    navigate("/");
    return null;
  }

  const { data: couriers, isLoading } = trpc.admin.getAllCouriersWithUsers.useQuery();

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Filter and sort couriers
  let filteredCouriers = couriers?.map((c: any) => ({
    ...c,
    rating: c.averageRating || 0,
    totalDeliveries: 0,
  })) || [];

  // Search filter
  if (searchTerm) {
    filteredCouriers = filteredCouriers.filter((courier: any) =>
      courier.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Rating filter
  if (filterRating !== "all") {
    const minRating = parseInt(filterRating);
    filteredCouriers = filteredCouriers.filter(
      (courier: any) => (courier.rating || 0) >= minRating
    );
  }

  // Sort
  filteredCouriers = [...filteredCouriers].sort((a, b) => {
    switch (sortBy) {
      case "highest":
        return (b.rating || 0) - (a.rating || 0);
      case "lowest":
        return (a.rating || 0) - (b.rating || 0);
      case "deliveries":
        return (b.totalDeliveries || 0) - (a.totalDeliveries || 0);
      default:
        return 0;
    }
  });

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) {
      return <Badge className="bg-green-600">Mükemmel</Badge>;
    } else if (rating >= 4.0) {
      return <Badge className="bg-blue-600">İyi</Badge>;
    } else if (rating >= 3.5) {
      return <Badge className="bg-yellow-600">Orta</Badge>;
    } else if (rating >= 3.0) {
      return <Badge className="bg-orange-600">Düşük</Badge>;
    } else {
      return <Badge className="bg-red-600">Çok Düşük</Badge>;
    }
  };

  const getRozet = (courier: any) => {
    const rating = courier.rating || 0;
    const deliveries = courier.totalDeliveries || 0;

    if (rating >= 4.8 && deliveries >= 100) {
      return { icon: "🏆", label: "Gold", color: "text-yellow-600" };
    } else if (rating >= 4.5 && deliveries >= 50) {
      return { icon: "🥈", label: "Silver", color: "text-gray-400" };
    } else if (rating >= 4.0 && deliveries >= 20) {
      return { icon: "🥉", label: "Bronze", color: "text-orange-700" };
    } else if (deliveries >= 10 && rating >= 4.0) {
      return { icon: "⭐", label: "Rising Star", color: "text-blue-600" };
    }
    return null;
  };

  const lowRatedCouriers = filteredCouriers.filter((c: any) => (c.averageRating || 0) < 3.5);
  const topPerformers = filteredCouriers.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kurye Değerlendirmeleri</h1>
          <p className="text-gray-600 mt-2">Kurye performansını takip edin ve yönetin</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Kurye</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{filteredCouriers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Ortalama Puan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {filteredCouriers.length > 0
                  ? (
                      filteredCouriers.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) /
                      filteredCouriers.length
                    ).toFixed(1)
                  : "0.0"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Top Performans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {filteredCouriers.filter((c: any) => (c.rating || 0) >= 4.5).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Düşük Puan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{lowRatedCouriers.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Low Rated Couriers Warning */}
        {lowRatedCouriers.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Düşük Puanlı Kuryeler ({lowRatedCouriers.length})
              </CardTitle>
              <CardDescription className="text-red-700">
                Aşağıdaki kuryeler 3.5 puanın altında performans gösteriyor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
              {filteredCouriers.slice(0, 5).map((courier: any) => (
                  <div
                    key={courier.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{courier.name}</p>
                      <p className="text-sm text-gray-600">
                        {courier.totalDeliveries || 0} teslimat
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                        <span className="font-bold text-red-600">{courier.rating || 0}</span>
                      </div>
                      {getRatingBadge(courier.rating || 0)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Performers */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Award className="h-5 w-5" />
              En İyi Performans Gösterenler
            </CardTitle>
            <CardDescription className="text-green-700">
              Liderlik tablosu - Top 5 kurye
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPerformers.map((courier: any, index: number) => {
                const rozet = getRozet(courier);
                return (
                  <div
                    key={courier.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                      <div>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          {courier.name}
                          {rozet && (
                            <span className={`text-sm ${rozet.color}`}>
                              {rozet.icon} {rozet.label}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {courier.totalDeliveries || 0} teslimat
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-orange-500 text-orange-500" />
                        <span className="font-bold text-green-600 text-lg">
                          {courier.rating || 0}
                        </span>
                      </div>
                      {getRatingBadge(courier.rating || 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Tüm Kuryeler</CardTitle>
            <CardDescription>Kurye listesini filtreleyin ve sıralayın</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Kurye ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Puan filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Puanlar</SelectItem>
                  <SelectItem value="4">4+ Yıldız</SelectItem>
                  <SelectItem value="3">3+ Yıldız</SelectItem>
                  <SelectItem value="2">2+ Yıldız</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Son Eklenenler</SelectItem>
                  <SelectItem value="highest">En Yüksek Puan</SelectItem>
                  <SelectItem value="lowest">En Düşük Puan</SelectItem>
                  <SelectItem value="deliveries">En Çok Teslimat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Courier List */}
            <div className="space-y-3">
              {filteredCouriers.map((courier: any) => {
                const rozet = getRozet(courier);
                return (
                  <div
                    key={courier.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-xl font-bold text-orange-600">
                          {courier.name?.charAt(0) || "K"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          {courier.name}
                          {rozet && (
                            <span className={`text-sm ${rozet.color}`}>
                              {rozet.icon} {rozet.label}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {courier.totalDeliveries || 0} teslimat • {courier.vehicleType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= (courier.rating || 0)
                                  ? "fill-orange-500 text-orange-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm font-bold text-gray-900">
                          {courier.rating || 0} / 5.0
                        </p>
                      </div>
                      {getRatingBadge(courier.rating || 0)}
                    </div>
                  </div>
                );
              })}

              {filteredCouriers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600">Kurye bulunamadı</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
