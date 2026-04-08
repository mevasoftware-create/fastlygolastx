import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search, RefreshCw, Trash2, CheckCircle, XCircle, Building2,
  Phone, MapPin, Star, Eye, Ban, Clock, AlertCircle, ChevronLeft,
  ChevronRight, Edit, Mail, FileText,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "suspended";
const ITEMS_PER_PAGE = 15;

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dotColor: string }> = {
  pending:   { label: "Beklemede",     color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     dotColor: "bg-amber-400" },
  approved:  { label: "Onaylı",        color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dotColor: "bg-emerald-400" },
  rejected:  { label: "Reddedildi",    color: "text-red-700",     bg: "bg-red-50 border-red-200",         dotColor: "bg-red-400" },
  suspended: { label: "Askıya Alındı", color: "text-gray-700",    bg: "bg-gray-50 border-gray-200",       dotColor: "bg-gray-400" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || { label: status, color: "text-gray-700", bg: "bg-gray-50 border-gray-200", dotColor: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${cfg.bg} ${cfg.color}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  );
}

export default function Businesses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [page, setPage] = useState(1);

  const { data: businesses, refetch, isLoading } = trpc.admin.getAllBusinesses.useQuery();
  const deleteMutation = trpc.admin.deleteBusiness.useMutation();
  const approveMutation = trpc.admin.approveBusiness.useMutation();
  const rejectMutation = trpc.admin.rejectBusiness.useMutation();
  const utils = trpc.useUtils();

  const filtered = useMemo(() => {
    return businesses?.filter((b: any) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q || b.businessName?.toLowerCase().includes(q) ||
        b.contactPerson?.toLowerCase().includes(q) || b.address?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];
  }, [businesses, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const counts = useMemo(() => ({
    all: businesses?.length ?? 0,
    pending: businesses?.filter((b: any) => b.status === "pending").length ?? 0,
    approved: businesses?.filter((b: any) => b.status === "approved").length ?? 0,
    rejected: businesses?.filter((b: any) => b.status === "rejected").length ?? 0,
  }), [businesses]);

  const handleApprove = async (businessId: number, businessName: string) => {
    try {
      await approveMutation.mutateAsync({ businessId });
      toast.success(`"${businessName}" onaylandı`);
      utils.admin.getAllBusinesses.invalidate();
    } catch { toast.error("Onaylama başarısız"); }
  };
  const handleReject = async () => {
    if (!rejectingId) return;
    const business = businesses?.find((b: any) => b.id === rejectingId);
    try {
      await rejectMutation.mutateAsync({ businessId: rejectingId, reason: rejectReason });
      toast.success(`"${business?.businessName}" reddedildi`);
      utils.admin.getAllBusinesses.invalidate();
      setRejectingId(null); setRejectReason("");
    } catch { toast.error("Reddetme başarısız"); }
  };
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync({ businessId: deletingId });
      toast.success("İşletme silindi");
      utils.admin.getAllBusinesses.invalidate();
      setDeletingId(null);
    } catch { toast.error("Silme başarısız"); }
  };

  const stats = useMemo(() => [
    { label: "Toplam", value: counts.all, color: "text-gray-600", bg: "bg-gray-50", ring: "ring-gray-100", icon: Building2 },
    { label: "Onaylı", value: counts.approved, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100", icon: CheckCircle },
    { label: "Beklemede", value: counts.pending, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100", icon: Clock },
    { label: "Reddedildi", value: counts.rejected, color: "text-red-600", bg: "bg-red-50", ring: "ring-red-100", icon: XCircle },
  ], [counts]);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">İşletmeler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platforma kayıtlı işletmeleri yönetin</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
          <RefreshCw className="h-3.5 w-3.5" />Yenile
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <button key={s.label} onClick={() => { setStatusFilter(s.label === "Toplam" ? "all" : s.label === "Onaylı" ? "approved" : s.label === "Beklemede" ? "pending" : "rejected"); setPage(1); }}
            className={`${s.bg} rounded-2xl p-3.5 flex items-center gap-3 ring-1 ${s.ring} hover:ring-2 transition-all text-left`}>
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0"><s.icon className={`h-4 w-4 ${s.color}`} /></div>
            <div><p className={`text-xl font-bold ${s.color}`}>{s.value}</p><p className="text-[11px] text-gray-500">{s.label}</p></div>
          </button>
        ))}
      </div>

      {counts.pending > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0"><AlertCircle className="h-5 w-5 text-amber-600" /></div>
          <div>
            <p className="font-semibold text-amber-900 text-sm">{counts.pending} işletme onay bekliyor</p>
            <p className="text-xs text-amber-600 mt-0.5">Aşağıdaki tablodan onaylayabilir veya reddedebilirsiniz</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="İşletme adı, kişi veya adres ara..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} className="pl-10 h-10 text-sm border-gray-200 rounded-xl" />
        </div>
        <div className="flex items-center bg-gray-100 rounded-xl p-1">
          {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              {s === "all" ? "Tümü" : s === "pending" ? "Beklemede" : s === "approved" ? "Onaylı" : "Reddedildi"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="space-y-0">{[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
              <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse" />
              <div className="flex-1 h-4 bg-gray-100 rounded-lg animate-pulse" />
              <div className="w-20 h-6 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ))}</div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><Building2 className="h-8 w-8 opacity-30" /></div>
            <p className="text-sm font-medium">İşletme bulunamadı</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["İşletme","Adres","Puan","Durum","Aksiyonlar"].map((h, i) => (
                      <th key={i} className={`px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider ${i === 4 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((b: any) => (
                    <tr key={b.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <button onClick={() => setSelectedBusiness(b)} className="flex items-center gap-3 text-left group/name">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                            {b.businessName?.charAt(0)?.toUpperCase() || "B"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm group-hover/name:text-orange-600 transition-colors">{b.businessName || "—"}</p>
                            {b.contactPerson && <p className="text-[11px] text-gray-400">{b.contactPerson}</p>}
                          </div>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 max-w-[200px]">
                        {b.address ? (
                          <span className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin className="h-3 w-3 flex-shrink-0" /><span className="truncate">{b.address}</span></span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {b.rating ? (b.rating / 10).toFixed(1) : "5.0"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={b.status || "pending"} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {b.status === "pending" && (
                            <>
                              <button onClick={() => handleApprove(b.id, b.businessName)} disabled={approveMutation.isPending}
                                className="h-7 px-2.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors">
                                <CheckCircle className="h-3 w-3" />Onayla
                              </button>
                              <button onClick={() => { setRejectingId(b.id); setRejectReason(""); }}
                                className="h-7 px-2.5 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1 transition-colors">
                                <XCircle className="h-3 w-3" />Reddet
                              </button>
                            </>
                          )}
                          {b.status === "approved" && (
                            <button onClick={() => { setRejectingId(b.id); setRejectReason(""); }}
                              className="h-7 px-2.5 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100">
                              <Ban className="h-3 w-3" />Askıya Al
                            </button>
                          )}
                          {b.status === "rejected" && (
                            <button onClick={() => handleApprove(b.id, b.businessName)}
                              className="h-7 px-2.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100">
                              <CheckCircle className="h-3 w-3" />Onayla
                            </button>
                          )}
                          <button onClick={() => setSelectedBusiness(b)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeletingId(b.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
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

      {/* Detail Sheet */}
      <Sheet open={!!selectedBusiness} onOpenChange={() => setSelectedBusiness(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-gray-100">
            <SheetTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-emerald-600" />İşletme Detayı</SheetTitle>
          </SheetHeader>
          {selectedBusiness && (
            <div className="space-y-5 py-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/20">
                  {selectedBusiness.businessName?.charAt(0)?.toUpperCase() || "B"}
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{selectedBusiness.businessName}</p>
                  <StatusBadge status={selectedBusiness.status || "pending"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3.5 ring-1 ring-gray-100">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">İletişim Kişisi</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{selectedBusiness.contactPerson || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5 ring-1 ring-gray-100">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Telefon</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{selectedBusiness.phone || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5 ring-1 ring-gray-100">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Vergi No</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{selectedBusiness.taxNumber || "—"}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3.5 ring-1 ring-amber-100">
                  <p className="text-[11px] text-amber-600 uppercase tracking-wider font-semibold">Puan</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {selectedBusiness.rating ? (selectedBusiness.rating / 10).toFixed(1) : "5.0"}
                  </p>
                </div>
              </div>
              {selectedBusiness.address && (
                <div className="bg-gray-50 rounded-xl p-3.5 ring-1 ring-gray-100">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Adres</p>
                  <p className="text-sm text-gray-700 flex items-start gap-2"><MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />{selectedBusiness.address}</p>
                </div>
              )}
              {selectedBusiness.description && (
                <div className="bg-gray-50 rounded-xl p-3.5 ring-1 ring-gray-100">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Açıklama</p>
                  <p className="text-sm text-gray-700">{selectedBusiness.description}</p>
                </div>
              )}
              {selectedBusiness.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-1.5" onClick={() => { handleApprove(selectedBusiness.id, selectedBusiness.businessName); setSelectedBusiness(null); }}>
                    <CheckCircle className="h-4 w-4" />Onayla
                  </Button>
                  <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl gap-1.5" onClick={() => { setRejectingId(selectedBusiness.id); setSelectedBusiness(null); }}>
                    <XCircle className="h-4 w-4" />Reddet
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>İşletmeyi Reddet</DialogTitle>
            <DialogDescription>Bu işletmenin başvurusunu reddetmek istediğinizden emin misiniz?</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Red Nedeni (isteğe bağlı)</Label>
            <Textarea placeholder="Red nedenini belirtin..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)} className="rounded-xl">İptal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending} className="rounded-xl">
              {rejectMutation.isPending ? "Reddediliyor..." : "Reddet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>İşletmeyi Sil</DialogTitle>
            <DialogDescription>Bu işlem geri alınamaz. İşletmeyi silmek istediğinizden emin misiniz?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)} className="rounded-xl">İptal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} className="rounded-xl">
              {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
