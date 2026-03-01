import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Edit, Trash2, Package, Clock, CheckCircle2, XCircle, Truck, ShoppingBag, RefreshCw, Filter, Map, List } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "Beklemede",     color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  accepted:   { label: "Kabul Edildi",  color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  picked_up:  { label: "Alındı",        color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  in_transit: { label: "Yolda",         color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  delivered:  { label: "Teslim Edildi", color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  cancelled:  { label: "İptal",         color: "text-red-700",    bg: "bg-red-50 border-red-200" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "text-gray-700", bg: "bg-gray-50 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<"pending" | "accepted" | "picked_up" | "in_transit" | "delivered" | "cancelled">("pending");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const { data: orders, refetch, isLoading } = trpc.admin.allOrders.useQuery();

  const updateOrderMutation = trpc.admin.updateOrder.useMutation({
    onSuccess: () => { toast.success("Sipariş güncellendi"); refetch(); setEditingOrder(null); },
    onError: (e) => toast.error("Hata: " + e.message),
  });
  const deleteOrderMutation = trpc.admin.deleteOrder.useMutation({
    onSuccess: () => { toast.success("Sipariş silindi"); refetch(); setDeletingOrderId(null); },
    onError: (e) => toast.error("Hata: " + e.message),
  });

  const filteredOrders = orders?.filter((o: any) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || o.id.toString().includes(q) ||
      o.pickupAddress?.toLowerCase().includes(q) ||
      o.deliveryAddress?.toLowerCase().includes(q);
    return matchesSearch && (filterStatus === "all" || o.status === filterStatus);
  });

  const stats = [
    { label: "Toplam", value: orders?.length || 0, color: "text-gray-900" },
    { label: "Beklemede", value: orders?.filter((o: any) => o.status === "pending").length || 0, color: "text-amber-600" },
    { label: "Aktif", value: orders?.filter((o: any) => ["accepted","picked_up","in_transit"].includes(o.status)).length || 0, color: "text-blue-600" },
    { label: "Tamamlanan", value: orders?.filter((o: any) => o.status === "delivered").length || 0, color: "text-green-600" },
    { label: "İptal", value: orders?.filter((o: any) => o.status === "cancelled").length || 0, color: "text-red-600" },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Siparişler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tüm teslimat siparişlerini yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode("list")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}><List className="h-3.5 w-3.5" />Liste</button>
            <button onClick={() => setViewMode("map")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "map" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}><Map className="h-3.5 w-3.5" />Harita</button>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />Yenile
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl px-4 py-2.5 border border-gray-100 shadow-sm flex items-center gap-2">
            <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
            <span className="text-xs text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Sipariş ID veya adres ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9 text-sm border-gray-200" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44 h-9 text-sm border-gray-200"><SelectValue placeholder="Tüm Durumlar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === "map" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Sipariş Konumları</h2>
            <p className="text-xs text-gray-400 mt-0.5">Aktif siparişlerin alış ve teslimat noktaları</p>
          </div>
          <div className="relative h-[480px] bg-gray-50">
            <iframe
              src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY&q=Skopje,North+Macedonia&zoom=12`}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
            <div className="absolute top-3 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {filteredOrders?.filter((o: any) => ["accepted","picked_up","in_transit"].includes(o.status)).slice(0, 5).map((o: any) => (
                  <div key={o.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-gray-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                    <span className="text-xs font-medium text-gray-700">#{o.id}</span>
                    <StatusBadge status={o.status} />
                  </div>
                ))}
                {!filteredOrders?.filter((o: any) => ["accepted","picked_up","in_transit"].includes(o.status)).length && (
                  <p className="text-xs text-gray-400">Şu an aktif sipariş yok</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === "list" && (<div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Yükleniyor...</div>
        ) : !filteredOrders?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ShoppingBag className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Sipariş bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["ID","Rota","Kurye","Tutar","Durum","Tarih",""].map((h,i) => (
                    <th key={i} className={`px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">#{order.id}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="space-y-1">
                        <div className="flex items-start gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-orange-400 mt-1 flex-shrink-0" />
                          <span className="text-xs text-gray-600 truncate max-w-[180px] block">{order.pickupAddress}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                          <span className="text-xs text-gray-600 truncate max-w-[180px] block">{order.deliveryAddress}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {order.courierId ? <span className="font-medium text-gray-700">#{order.courierId}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-orange-600">{formatCurrency(order.totalFee)}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                          onClick={() => { setEditingOrder(order); setEditStatus(order.status); }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                          onClick={() => setDeletingOrderId(order.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>)}

      <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sipariş #{editingOrder?.id}</DialogTitle>
            <DialogDescription>Sipariş durumunu güncelleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Durum</label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-sm">
              <div className="flex gap-2"><span className="text-gray-500 w-24">Tutar:</span><span className="font-medium">{formatCurrency(editingOrder?.totalFee || 0)}</span></div>
              <div className="flex gap-2"><span className="text-gray-500 w-24">Alış:</span><span className="text-xs">{editingOrder?.pickupAddress}</span></div>
              <div className="flex gap-2"><span className="text-gray-500 w-24">Teslimat:</span><span className="text-xs">{editingOrder?.deliveryAddress}</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOrder(null)}>İptal</Button>
            <Button onClick={() => updateOrderMutation.mutate({ id: editingOrder.id, status: editStatus })}
              disabled={updateOrderMutation.isPending} className="bg-orange-500 hover:bg-orange-600">
              {updateOrderMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingOrderId} onOpenChange={() => setDeletingOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Siparişi Sil</AlertDialogTitle>
            <AlertDialogDescription>Sipariş #{deletingOrderId} kalıcı olarak silinecek.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingOrderId && deleteOrderMutation.mutate({ id: deletingOrderId })} className="bg-red-600 hover:bg-red-700">
              {deleteOrderMutation.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
