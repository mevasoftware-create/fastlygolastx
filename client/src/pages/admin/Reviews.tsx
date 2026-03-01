import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Star, MessageSquare, Search } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`h-3 w-3 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

export function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: orders, refetch, isLoading } = trpc.admin.allOrders.useQuery();

  // Sadece customerReview olan siparişleri filtrele
  const reviewedOrders = orders?.filter((o: any) => o.customerReview && o.customerReview.trim() !== "");

  const filtered = reviewedOrders?.filter((o: any) => {
    const q = searchTerm.toLowerCase();
    return !q || o.customerReview?.toLowerCase().includes(q) || o.id.toString().includes(q);
  });

  const avgRating = reviewedOrders?.length
    ? (reviewedOrders.reduce((s: number, o: any) => s + (o.customerRating || 0), 0) / reviewedOrders.length).toFixed(1)
    : "—";

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Değerlendirmeler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tamamlanan siparişlere yapılan müşteri yorumları</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm flex items-center gap-2">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-lg font-bold text-gray-900">{avgRating}</span>
            <span className="text-xs text-gray-500">Ort. Puan</span>
          </div>
          <div className="bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">{reviewedOrders?.length || 0}</span>
            <span className="text-xs text-gray-500">Yorum</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />Yenile
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Yorum içeriği veya sipariş ID ara..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} className="pl-9 h-9 text-sm border-gray-200" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Yükleniyor...</div>
        ) : !filtered?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <MessageSquare className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Henüz değerlendirme yapılmamış</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Sipariş","Rota","Puan","Yorum","Tarih"].map((h, i) => (
                    <th key={i} className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">#{o.id}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" /><span className="text-xs text-gray-500 truncate">{o.pickupAddress?.split(",")[0]}</span></div>
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" /><span className="text-xs text-gray-500 truncate">{o.deliveryAddress?.split(",")[0]}</span></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {o.customerRating ? <StarRating rating={o.customerRating} /> : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-gray-600 line-clamp-2">{o.customerReview}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString("tr-TR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
