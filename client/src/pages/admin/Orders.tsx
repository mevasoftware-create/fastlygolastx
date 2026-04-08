import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Search, Edit, Trash2, ShoppingBag, RefreshCw, Filter, Map, List,
  Package, MapPin, Clock, CheckCircle2, XCircle, Truck, ArrowRight,
  ChevronLeft, ChevronRight, Eye, MoreHorizontal, Download, Calendar,
  User, Phone, CreditCard, Route, Timer, AlertCircle,
} from "lucide-react";
import { formatEUR } from "@/lib/formatEUR";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; dotColor: string }> = {
  pending:    { label: "Beklemede",     color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",   icon: Clock,        dotColor: "bg-amber-400" },
  accepted:   { label: "Kabul Edildi",  color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",     icon: CheckCircle2, dotColor: "bg-blue-400" },
  picked_up:  { label: "Alındı",        color: "text-purple-700",  bg: "bg-purple-50 border-purple-200", icon: Package,      dotColor: "bg-purple-400" },
  in_transit: { label: "Yolda",         color: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-200", icon: Truck,        dotColor: "bg-indigo-400" },
  delivered:  { label: "Teslim Edildi", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2, dotColor: "bg-emerald-400" },
  cancelled:  { label: "İptal",         color: "text-red-700",     bg: "bg-red-50 border-red-200",       icon: XCircle,      dotColor: "bg-red-400" },
};

const ITEMS_PER_PAGE = 15;

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "text-gray-700", bg: "bg-gray-50 border-gray-200", icon: AlertCircle, dotColor: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${cfg.bg} ${cfg.color}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
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
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [page, setPage] = useState(1);

  const { data: orders, refetch, isLoading } = trpc.admin.allOrders.useQuery();

  const updateOrderMutation = trpc.admin.updateOrder.useMutation({
    onSuccess: () => { toast.success("Sipariş güncellendi"); refetch(); setEditingOrder(null); },
    onError: (e) => toast.error("Hata: " + e.message),
  });
  const deleteOrderMutation = trpc.admin.deleteOrder.useMutation({
    onSuccess: () => { toast.success("Sipariş silindi"); refetch(); setDeletingOrderId(null); },
    onError: (e) => toast.error("Hata: " + e.message),
  });

  const filteredOrders = useMemo(() => {
    return orders?.filter((o: any) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q || o.id.toString().includes(q) ||
        o.orderNumber?.toLowerCase().includes(q) ||
        o.pickupAddress?.toLowerCase().includes(q) ||
        o.deliveryAddress?.toLowerCase().includes(q);
      return matchesSearch && (filterStatus === "all" || o.status === filterStatus);
    }) || [];
  }, [orders, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => [
    { label: "Toplam", value: orders?.length || 0, color: "text-gray-900", bg: "bg-gray-50", ring: "ring-gray-100", icon: Package },
    { label: "Beklemede", value: orders?.filter((o: any) => o.status === "pending").length || 0, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100", icon: Clock },
    { label: "Aktif", value: orders?.filter((o: any) => ["accepted","picked_up","in_transit"].includes(o.status)).length || 0, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-100", icon: Truck },
    { label: "Tamamlanan", value: orders?.filter((o: any) => o.status === "delivered").length || 0, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100", icon: CheckCircle2 },
    { label: "İptal", value: orders?.filter((o: any) => o.status === "cancelled").length || 0, color: "text-red-600", bg: "bg-red-50", ring: "ring-red-100", icon: XCircle },
  ], [orders]);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Siparişler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tüm teslimat siparişlerini yönetin ve takip edin</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button onClick={() => setViewMode("list")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              <List className="h-3.5 w-3.5" />Liste
            </button>
            <button onClick={() => setViewMode("map")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${viewMode === "map" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              <Map className="h-3.5 w-3.5" />Harita
            </button>
          </div>
          <button onClick={() => refetch()} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            <RefreshCw className="h-3.5 w-3.5" />Yenile
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => setFilterStatus(s.label === "Toplam" ? "all" : s.label === "Beklemede" ? "pending" : s.label === "Aktif" ? "accepted" : s.label === "Tamamlanan" ? "delivered" : "cancelled")}
            className={`${s.bg} rounded-2xl p-3.5 flex items-center gap-3 ring-1 ${s.ring} hover:ring-2 transition-all text-left`}
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-500">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Sipariş no, adres veya ID ile ara..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} className="pl-10 h-10 text-sm border-gray-200 rounded-xl" />
        </div>
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48 h-10 text-sm border-gray-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <SelectValue placeholder="Tüm Durumlar" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Map View */}
      {viewMode === "map" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
          </div>
        </div>
      )}

      {/* Table */}
      {viewMode === "list" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="space-y-0">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
                  <div className="w-16 h-4 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="flex-1 h-4 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="w-24 h-4 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="w-20 h-6 bg-gray-100 rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          ) : !filteredOrders.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8 opacity-30" />
              </div>
              <p className="text-sm font-medium">Sipariş bulunamadı</p>
              <p className="text-xs mt-1">Arama kriterlerinizi değiştirmeyi deneyin</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Sipariş","Rota","Kurye","Tutar","Durum","Tarih",""].map((h,i) => (
                        <th key={i} className={`px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order: any) => (
                      <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                        <td className="px-5 py-3.5">
                          <button onClick={() => setSelectedOrder(order)} className="text-left group/id">
                            <p className="font-semibold text-gray-900 text-sm group-hover/id:text-orange-600 transition-colors">{order.orderNumber || `#${order.id}`}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 font-mono">ID: {order.id}</p>
                          </button>
                        </td>
                        <td className="px-5 py-3.5 max-w-[220px]">
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-2">
                              <div className="w-5 h-5 rounded-md bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <MapPin className="h-3 w-3 text-orange-500" />
                              </div>
                              <span className="text-xs text-gray-600 line-clamp-1">{order.pickupAddress}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <MapPin className="h-3 w-3 text-emerald-500" />
                              </div>
                              <span className="text-xs text-gray-600 line-clamp-1">{order.deliveryAddress}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">
                          {order.courierId ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-gray-50 font-medium text-gray-700">
                              <User className="h-3 w-3" />#{order.courierId}
                            </span>
                          ) : <span className="text-gray-300">Atanmadı</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-gray-900 text-sm">{formatEUR(order.totalFee)}</span>
                        </td>
                        <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</p>
                          <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</p>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setSelectedOrder(order)} className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => { setEditingOrder(order); setEditStatus(order.status); }} className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors">
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setDeletingOrderId(order.id)} className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
                  <p className="text-xs text-gray-500">{filteredOrders.length} sonuçtan {(page-1)*ITEMS_PER_PAGE+1}-{Math.min(page*ITEMS_PER_PAGE, filteredOrders.length)} gösteriliyor</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(Math.max(1, page-1))} disabled={page === 1} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      const p = i + 1;
                      return (
                        <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-xl text-xs font-medium transition-colors ${p === page ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-100"}`}>{p}</button>
                      );
                    })}
                    {totalPages > 5 && <span className="text-gray-400 text-xs px-1">...</span>}
                    <button onClick={() => setPage(Math.min(totalPages, page+1))} disabled={page === totalPages} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-gray-100">
            <SheetTitle className="text-lg">Sipariş Detayı</SheetTitle>
          </SheetHeader>
          {selectedOrder && (
            <div className="space-y-5 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-gray-900">{selectedOrder.orderNumber || `#${selectedOrder.id}`}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(selectedOrder.createdAt).toLocaleString("tr-TR")}</p>
                </div>
                <StatusBadge status={selectedOrder.status} />
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">Alış Noktası</p>
                    <p className="text-sm text-gray-700 mt-0.5">{selectedOrder.pickupAddress}</p>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-dashed border-gray-200 h-4" />
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Teslimat Noktası</p>
                    <p className="text-sm text-gray-700 mt-0.5">{selectedOrder.deliveryAddress}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 rounded-xl p-3.5 ring-1 ring-orange-100">
                  <p className="text-[11px] text-orange-600 font-semibold uppercase tracking-wider">Toplam Tutar</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatEUR(selectedOrder.totalFee)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3.5 ring-1 ring-blue-100">
                  <p className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider">Kurye</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{selectedOrder.courierId ? `#${selectedOrder.courierId}` : "Atanmadı"}</p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="bg-amber-50 rounded-xl p-3.5 ring-1 ring-amber-100">
                  <p className="text-[11px] text-amber-600 font-semibold uppercase tracking-wider mb-1">Notlar</p>
                  <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setEditingOrder(selectedOrder); setEditStatus(selectedOrder.status); setSelectedOrder(null); }}>
                  <Edit className="h-4 w-4 mr-2" />Düzenle
                </Button>
                <Button variant="outline" className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={() => { setDeletingOrderId(selectedOrder.id); setSelectedOrder(null); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Sipariş Düzenle</DialogTitle>
            <DialogDescription>{editingOrder?.orderNumber || `#${editingOrder?.id}`} numaralı siparişin durumunu güncelleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Durum</label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as any)}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${v.dotColor}`} />
                        {v.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 space-y-2.5">
              <div className="flex gap-3 text-sm"><span className="text-gray-400 w-20 flex-shrink-0">Tutar</span><span className="font-semibold text-gray-900">{formatEUR(editingOrder?.totalFee)}</span></div>
              <div className="flex gap-3 text-sm"><span className="text-gray-400 w-20 flex-shrink-0">Alış</span><span className="text-gray-600 text-xs">{editingOrder?.pickupAddress}</span></div>
              <div className="flex gap-3 text-sm"><span className="text-gray-400 w-20 flex-shrink-0">Teslimat</span><span className="text-gray-600 text-xs">{editingOrder?.deliveryAddress}</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOrder(null)} className="rounded-xl">İptal</Button>
            <Button onClick={() => updateOrderMutation.mutate({ id: editingOrder.id, status: editStatus })}
              disabled={updateOrderMutation.isPending} className="bg-orange-500 hover:bg-orange-600 rounded-xl">
              {updateOrderMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingOrderId} onOpenChange={() => setDeletingOrderId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Siparişi Sil</AlertDialogTitle>
            <AlertDialogDescription>Sipariş #{deletingOrderId} kalıcı olarak silinecek. Bu işlem geri alınamaz.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingOrderId && deleteOrderMutation.mutate({ id: deletingOrderId })} className="bg-red-600 hover:bg-red-700 rounded-xl">
              {deleteOrderMutation.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
