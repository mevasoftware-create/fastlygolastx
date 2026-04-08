import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Star, AlertTriangle, Award, Search, Users, Trophy, ChevronLeft, ChevronRight, Loader2, Frown } from "lucide-react";

export default function CourierRatings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: couriers, isLoading } = trpc.admin.getAllCouriersWithUsers.useQuery();

  const processedCouriers = couriers?.map((c: any) => ({
    ...c,
    rating: c.averageRating || 0,
    totalDeliveries: c.deliveries?.length || 0,
  })) || [];

  const filteredCouriers = processedCouriers
    .filter((courier: any) =>
      courier.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((courier: any) => {
      if (filterRating === "all") return true;
      const minRating = parseInt(filterRating);
      return (courier.rating || 0) >= minRating;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "highest":
          return (b.rating || 0) - (a.rating || 0);
        case "lowest":
          return (a.rating || 0) - (b.rating || 0);
        case "deliveries":
          return (b.totalDeliveries || 0) - (a.totalDeliveries || 0);
        default:
          return (a.name || "").localeCompare(b.name || "");
      }
    });

  const totalPages = Math.ceil(filteredCouriers.length / itemsPerPage);
  const paginatedCouriers = filteredCouriers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRatingBadge = (rating: number) => {
    const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border";
    if (rating >= 4.5) {
      return <span className={`${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200`}>Mükemmel</span>;
    } else if (rating >= 4.0) {
      return <span className={`${baseClasses} bg-blue-50 text-blue-700 border-blue-200`}>İyi</span>;
    } else if (rating >= 3.5) {
      return <span className={`${baseClasses} bg-amber-50 text-amber-700 border-amber-200`}>Orta</span>;
    } else {
      return <span className={`${baseClasses} bg-red-50 text-red-700 border-red-200`}>Düşük</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </div>
    );
  }

  const averageRating = filteredCouriers.length > 0
    ? (filteredCouriers.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) / filteredCouriers.length).toFixed(1)
    : "0.0";

  const topPerformersCount = filteredCouriers.filter((c: any) => (c.rating || 0) >= 4.5).length;
  const lowRatedCouriersCount = filteredCouriers.filter((c: any) => (c.rating || 0) < 3.5).length;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kurye Değerlendirmeleri</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kurye performansını ve puanlarını buradan takip edin.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-blue-100">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-blue-800 font-medium">Toplam Kurye</p>
            <p className="text-xl font-bold text-blue-900">{filteredCouriers.length}</p>
          </div>
        </div>
        <div className="bg-orange-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-orange-100">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <Star className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-orange-800 font-medium">Ortalama Puan</p>
            <p className="text-xl font-bold text-orange-900">{averageRating}</p>
          </div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-emerald-100">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <Trophy className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-emerald-800 font-medium">Top Performans</p>
            <p className="text-xl font-bold text-emerald-900">{topPerformersCount}</p>
          </div>
        </div>
        <div className="bg-red-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-red-100">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-red-800 font-medium">Düşük Puanlı</p>
            <p className="text-xl font-bold text-red-900">{lowRatedCouriersCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Tüm Kuryeler</h2>
          <p className="text-sm text-gray-500">Kurye listesini arayın, filtreleyin ve sıralayın.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Kurye adı ile ara..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 rounded-xl"
              />
            </div>
            <Select value={filterRating} onValueChange={(value) => { setFilterRating(value); setCurrentPage(1); }}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Puan filtresi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Puanlar</SelectItem>
                <SelectItem value="4">4+ Yıldız</SelectItem>
                <SelectItem value="3">3+ Yıldız</SelectItem>
                <SelectItem value="2">2+ Yıldız</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => { setSortBy(value); setCurrentPage(1); }}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Yeniye Göre</SelectItem>
                <SelectItem value="highest">En Yüksek Puan</SelectItem>
                <SelectItem value="lowest">En Düşük Puan</SelectItem>
                <SelectItem value="deliveries">Teslimat Sayısı</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {paginatedCouriers.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {paginatedCouriers.map((courier: any) => (
              <div key={courier.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors group flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={courier.user?.image || `https://ui-avatars.com/api/?name=${courier.name}&background=random`} alt={courier.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-gray-800">{courier.name}</p>
                    <p className="text-sm text-gray-500">{courier.totalDeliveries} teslimat</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-orange-400 text-orange-500" />
                    <span className="font-bold text-gray-800">{(courier.rating || 0).toFixed(1)}</span>
                  </div>
                  {getRatingBadge(courier.rating)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 mx-auto">
              <Frown className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">Sonuç bulunamadı</p>
            <p className="text-xs text-gray-500 mt-1">Filtrelerinizi değiştirmeyi deneyin.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <p className="text-gray-600">Toplam {filteredCouriers.length} kurye</p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-medium">Sayfa {currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
