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
  Search, Edit, Trash2, Bike, RefreshCw, Star, Mail, MapPin,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight, Filter, Eye,
  Clock, Wifi, WifiOff, Car, AlertCircle, Phone, User,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dotColor: string }> = {
  pending:  { label: "Beklemede",  color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",   dotColor: "bg-amber-400" },
  active:   { label: "Onaylı",     color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dotColor: "bg-emerald-400" },
  approved: { label: "Onaylı",     color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dotColor: "bg-emerald-400" },
  inactive: { label: "Reddedildi", color: "text-red-700",     bg: "bg-red-50 border-red-200",       dotColor: "bg-red-400" },
  rejected: { label: "Reddedildi", color: "text-red-700",     bg: "bg-red-50 border-red-200",       dotColor: "bg-red-400" },
  suspended:{ label: "Askıda",     color: "text-gray-700",    bg: "bg-gray-50 border-gray-200",     dotColor: "bg-gray-400" },
};

const ITEMS_PER_PAGE = 15;

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "text-gray-700", bg: "bg-gray-50 border-gray-200", dotColor: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${cfg.bg} ${cfg.color}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  );
}

export function CouriersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDemo, setFilterDemo] = useState("all");
  const [editingCourier, setEditingCourier] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editApprovalStatus, setEditApprovalStatus] = useState<"pending" | "active" | "inactive" | "suspended">("pending");
  const [selectedCourier, setSelectedCourier] = useState<any>(null);
  const [page, setPage] = useState(1);

  const { data: couriers, refetch, isLoading } = trpc.admin.getAllCouriersWithUsers.useQuery();

  const updateMutation = trpc.admin.updateCourier.useMutation({
    onSuccess: () => { toast.success("Kurye güncellendi"); refetch(); setEditingCourier(null); },
    onError: (e: any) => toast.error("Hata: " + e.message),
  });
  const approveMutation = trpc.admin.approveCourier.useMutation({
    onSuccess: () => { toast.success("Kurye onaylandı"); refetch(); },
    onError: (e: any) => toast.error("Hata: " + e.message),
  });
  const rejectMutation = trpc.admin.rejectCourier.useMutation({
    onSuccess: () => { toast.success("Kurye reddedildi"); refetch(); },
    onError: (e: any) => toast.error("Hata: " + e.message),
  });
  const deleteMutation = trpc.admin.deleteCourier.useMutation({
    onSuccess: () => { toast.success("Kurye silindi"); refetch(); setDeletingId(null); },
    onError: (e: any) => toast.error("Hata: " + e.message),
  });

  const filtered = useMemo(() => {
    return couriers?.filter((c: any) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || c.userName?.toLowerCase().includes(q) || c.userEmail?.toLowerCase().includes(q) || c.vehicleType?.toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || c.status === filterStatus;
      const matchDemo = filterDemo === "all" || (filterDemo === "demo" ? c.isDemo : !c.isDemo);
      return matchSearch && matchStatus && matchDemo;
    }) || [];
  }, [couriers, searchTerm, filterStatus, filterDemo]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => [
    { label: "Toplam", value: couriers?.length || 0, color: "text-gray-600", bg: "bg-gray-50", ring: "ring-gray-100", icon: Bike },
    { label: "Onaylı", value: couriers?.filter((c: any) => c.status === "active").length || 0, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100", icon: CheckCircle2 },
    { label: "Beklemede", value: couriers?.filter((c: any) => c.status === "pending").length || 0, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100", icon: Clock },
    { label: "Çevrimiçi", value: couriers?.filter((c: any) => c.isOnline).length || 0, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-100", icon: Wifi },
  ], [couriers]);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kuryeler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kurye hesaplarını ve onay durumlarını yönetin</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
          <RefreshCw className="h-3.5 w-3.5" />Yenile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3.5 flex items-center gap-3 ring-1 ${s.ring}`}>
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Alert */}
      {(couriers?.filter((c: any) => c.status === "pending").length || 0) > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-900 text-sm">{couriers?.filter((c: any) => c.status === "pending").length} kurye onay bekliyor</p>
            <p className="text-xs text-amber-600 mt-0.5">Aşağıdaki tablodan onaylayabilir veya reddedebilirsiniz</p>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="İsim, e-posta veya araç ara..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} className="pl-10 h-10 text-sm border-gray-200 rounded-xl" />
        </div>
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40 h-10 text-sm border-gray-200 rounded-xl"><SelectValue placeholder="Onay Durumu" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="pending">Beklemede</SelectItem>
            <SelectItem value="active">Onaylı</SelectItem>
            <SelectItem value="inactive">Reddedildi</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDemo} onValueChange={(v) => { setFilterDemo(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-32 h-10 text-sm border-gray-200 rounded-xl"><SelectValue placeholder="Tip" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="real">Gerçek</SelectItem>
            <SelectItem value="demo">Demo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
                <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse" />
                <div className="flex-1 h-4 bg-gray-100 rounded-xl animate-pulse" />
                <div className="w-20 h-6 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><Bike className="h-8 w-8 opacity-30" /></div>
            <p className="text-sm font-medium">Kurye bulunamadı</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Kurye","Araç","Puan","Durum","Çevrimiçi","Son Giriş","Aksiyonlar"].map((h, i) => (
                      <th key={i} className={`px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((c: any) => (
                    <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <button onClick={() => setSelectedCourier(c)} className="flex items-center gap-3 text-left group/name">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                            {c.userName?.charAt(0)?.toUpperCase() || "K"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm group-hover/name:text-orange-600 transition-colors">{c.userName || "İsimsiz"}</p>
                            <p className="text-[11px] text-gray-400">{c.userEmail}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-600 capitalize">{c.vehicleType || "—"}</span>
                          {c.isDemo && <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-200 px-1.5 py-0.5 rounded-full font-medium">Demo</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {c.rating ? (
                          <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{Number(c.rating).toFixed(1)}
                          </span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] font-medium ${c.isOnline ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-500"}`}>
                          {c.isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                          {c.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">
                        {c.lastSignedIn ? new Date(c.lastSignedIn).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.status === "pending" && (
                            <>
                              <button onClick={() => approveMutation.mutate({ courierId: c.id })} disabled={approveMutation.isPending}
                                className="h-7 px-2.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1 transition-colors">
                                <CheckCircle2 className="h-3 w-3" />Onayla
                              </button>
                              <button onClick={() => rejectMutation.mutate({ courierId: c.id })} disabled={rejectMutation.isPending}
                                className="h-7 px-2.5 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl flex items-center gap-1 transition-colors">
                                <XCircle className="h-3 w-3" />Reddet
                              </button>
                            </>
                          )}
                          {c.status === "active" && (
                            <button onClick={() => rejectMutation.mutate({ courierId: c.id })} disabled={rejectMutation.isPending}
                              className="h-7 px-2.5 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100">
                              <XCircle className="h-3 w-3" />Askıya Al
                            </button>
                          )}
                          {c.status === "inactive" && (
                            <button onClick={() => approveMutation.mutate({ courierId: c.id })} disabled={approveMutation.isPending}
                              className="h-7 px-2.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100">
                              <CheckCircle2 className="h-3 w-3" />Onayla
                            </button>
                          )}
                          <button onClick={() => { setEditingCourier(c); setEditApprovalStatus(c.status); }}
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors opacity-0 group-hover:opacity-100">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeletingId(c.id)}
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
                <p className="text-xs text-gray-500">{filtered.length} sonuçtan {(page-1)*ITEMS_PER_PAGE+1}-{Math.min(page*ITEMS_PER_PAGE, filtered.length)} gösteriliyor</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, page-1))} disabled={page === 1} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const p = i + 1;
                    return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-xl text-xs font-medium transition-colors ${p === page ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-100"}`}>{p}</button>;
                  })}
                  <button onClick={() => setPage(Math.min(totalPages, page+1))} disabled={page === totalPages} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedCourier} onOpenChange={() => setSelectedCourier(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-gray-100">
            <SheetTitle className="text-lg">Kurye Detayı</SheetTitle>
          </SheetHeader>
          {selectedCourier && (
            <div className="space-y-5 py-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-orange-500/20">
                  {selectedCourier.userName?.charAt(0)?.toUpperCase() || "K"}
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{selectedCourier.userName || "İsimsiz"}</p>
                  <p className="text-sm text-gray-500">{selectedCourier.userEmail}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={selectedCourier.status} />
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium ${selectedCourier.isOnline ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-500"}`}>
                  {selectedCourier.isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {selectedCourier.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
                </span>
                {selectedCourier.isDemo && <span className="text-[11px] bg-purple-50 text-purple-600 border border-purple-200 px-2.5 py-1 rounded-xl font-medium">Demo</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3.5 ring-1 ring-gray-100">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Araç Tipi</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 capitalize">{selectedCourier.vehicleType || "Belirtilmemiş"}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3.5 ring-1 ring-amber-100">
                  <p className="text-[11px] text-amber-600 uppercase tracking-wider font-semibold">Puan</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1">
                    {selectedCourier.rating ? <><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{Number(selectedCourier.rating).toFixed(1)}</> : "Henüz yok"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setEditingCourier(selectedCourier); setEditApprovalStatus(selectedCourier.status); setSelectedCourier(null); }}>
                  <Edit className="h-4 w-4 mr-2" />Düzenle
                </Button>
                <Button variant="outline" className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={() => { setDeletingId(selectedCourier.id); setSelectedCourier(null); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <Dialog open={!!editingCourier} onOpenChange={() => setEditingCourier(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingCourier?.userName || `Kurye #${editingCourier?.id}`}</DialogTitle>
            <DialogDescription>Kurye onay durumunu güncelleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Onay Durumu</label>
              <Select value={editApprovalStatus} onValueChange={(v) => setEditApprovalStatus(v as any)}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="active">Onayla</SelectItem>
                  <SelectItem value="inactive">Reddet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 space-y-2.5">
              <div className="flex gap-3 text-sm"><span className="text-gray-400 w-20">E-posta</span><span className="text-gray-700">{editingCourier?.userEmail || "—"}</span></div>
              <div className="flex gap-3 text-sm"><span className="text-gray-400 w-20">Araç</span><span className="text-gray-700 capitalize">{editingCourier?.vehicleType || "—"}</span></div>
              <div className="flex gap-3 text-sm"><span className="text-gray-400 w-20">Puan</span><span className="text-gray-700">{editingCourier?.rating ? Number(editingCourier.rating).toFixed(1) : "—"}</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCourier(null)} className="rounded-xl">İptal</Button>
            <Button onClick={() => updateMutation.mutate({ courierId: editingCourier.id, status: editApprovalStatus })}
              disabled={updateMutation.isPending} className="bg-orange-500 hover:bg-orange-600 rounded-xl">
              {updateMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Kuryeyi Sil</AlertDialogTitle>
            <AlertDialogDescription>Bu kurye kalıcı olarak silinecek. Bu işlem geri alınamaz.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate({ courierId: deletingId })} className="bg-red-600 hover:bg-red-700 rounded-xl">
              {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CouriersPage;
