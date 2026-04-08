import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import {
  RefreshCw, Star, MessageSquare, Search, ChevronLeft, ChevronRight,
  TrendingUp, Award, ThumbsUp,
} from "lucide-react";

const ITEMS_PER_PAGE = 15;

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${cls} ${i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

export function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const { data: orders, refetch, isLoading } = trpc.admin.allOrders.useQuery();

  const reviewedOrders = useMemo(() => orders?.filter((o: any) => o.customerReview && o.customerReview.trim() !== "") || [], [orders]);

  const filtered = useMemo(() => {
    return reviewedOrders.filter((o: any) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || o.customerReview?.toLowerCase().includes(q) || o.id.toString().includes(q);
      const matchRating = ratingFilter === null || o.customerRating === ratingFilter;
      return matchSearch && matchRating;
    });
  }, [reviewedOrders, searchTerm, ratingFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const avgRating = reviewedOrders.length
    ? (reviewedOrders.reduce((s: number, o: any) => s + (o.customerRating || 0), 0) / reviewedOrders.length)
    : 0;

  const ratingDist = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviewedOrders.forEach((o: any) => { if (o.customerRating >= 1 && o.customerRating <= 5) dist[o.customerRating - 1]++; });
    return dist;
  }, [reviewedOrders]);

  const maxDist = Math.max(...ratingDist, 1);

  const stats = [
    { label: "Toplam Yorum", value: reviewedOrders.length, color: "text-gray-600", bg: "bg-gray-50", ring: "ring-gray-100", icon: MessageSquare },
    { label: "Ort. Puan", value: avgRating ? avgRating.toFixed(1) : "—", color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100", icon: Star },
    { label: "5 Yıldız", value: ratingDist[4], color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100", icon: Award },
    { label: "Memnuniyet", value: reviewedOrders.length ? Math.round(((ratingDist[3] + ratingDist[4]) / reviewedOrders.length) * 100) + "%" : "—", color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-100", icon: ThumbsUp },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Değerlendirmeler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Müşteri yorumları ve puanlamaları</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
          <RefreshCw className="h-3.5 w-3.5" />Yenile
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3.5 flex items-center gap-3 ring-1 ${s.ring}`}>
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0"><s.icon className={`h-4 w-4 ${s.color}`} /></div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-gray-900 mb-3">Puan Dağılımı</p>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((r) => (
            <button key={r} onClick={() => { setRatingFilter(ratingFilter === r ? null : r); setPage(1); }}
              className={`flex items-center gap-3 w-full group transition-all rounded-lg p-1.5 -m-1.5 ${ratingFilter === r ? "bg-amber-50" : "hover:bg-gray-50"}`}>
              <span className="text-xs font-medium text-gray-500 w-3">{r}</span>
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all" style={{ width: `${(ratingDist[r - 1] / maxDist) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">{ratingDist[r - 1]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Yorum veya sipariş ID ara..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} className="pl-10 h-10 text-sm border-gray-200 rounded-xl" />
        </div>
        {ratingFilter !== null && (
          <button onClick={() => { setRatingFilter(null); setPage(1); }} className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-100 transition-colors">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{ratingFilter} Yıldız Filtresi
            <span className="ml-1 text-amber-400">&times;</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="space-y-0">{[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
              <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
              <div className="flex-1 h-4 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ))}</div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><MessageSquare className="h-8 w-8 opacity-30" /></div>
            <p className="text-sm font-medium">Değerlendirme bulunamadı</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {paginated.map((o: any) => (
                <div key={o.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{o.customerRating >= 4 ? "😊" : o.customerRating >= 3 ? "😐" : "😞"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-[11px] font-mono font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{o.id}</span>
                        <StarRating rating={o.customerRating || 0} />
                        <span className="text-[11px] text-gray-400">{new Date(o.createdAt).toLocaleDateString("tr-TR")}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{o.customerReview}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-400" /><span className="text-[11px] text-gray-400 truncate max-w-[150px]">{o.pickupAddress?.split(",")[0]}</span></div>
                        <span className="text-gray-300">→</span>
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><span className="text-[11px] text-gray-400 truncate max-w-[150px]">{o.deliveryAddress?.split(",")[0]}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
                <p className="text-xs text-gray-500">{filtered.length} sonuçtan {(page-1)*ITEMS_PER_PAGE+1}-{Math.min(page*ITEMS_PER_PAGE, filtered.length)} gösteriliyor</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, page-1))} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const p = i + 1;
                    return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === page ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-100"}`}>{p}</button>;
                  })}
                  <button onClick={() => setPage(Math.min(totalPages, page+1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
