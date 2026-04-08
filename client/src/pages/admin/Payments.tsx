import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  DollarSign, CheckCircle, XCircle, Clock, AlertCircle, Loader2,
  CreditCard, RefreshCw, ChevronLeft, ChevronRight, Wallet, TrendingUp,
  Banknote, Eye,
} from "lucide-react";
import { formatEUR } from "@/lib/formatEUR";

const ITEMS_PER_PAGE = 15;

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dotColor: string }> = {
  pending:  { label: "Beklemede", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     dotColor: "bg-amber-400" },
  approved: { label: "Onaylandı", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dotColor: "bg-emerald-400" },
  rejected: { label: "Reddedildi", color: "text-red-700",    bg: "bg-red-50 border-red-200",         dotColor: "bg-red-400" },
  paid:     { label: "Ödendi",    color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",       dotColor: "bg-blue-400" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || { label: status, color: "text-gray-700", bg: "bg-gray-50 border-gray-200", dotColor: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${cfg.bg} ${cfg.color}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />{cfg.label}
    </span>
  );
}

export function PaymentsPage() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [notes, setNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);

  const { data: paymentRequests, isLoading, refetch } = trpc.admin.getAllPaymentRequests.useQuery();

  const approveMutation = trpc.admin.approvePaymentRequest.useMutation({
    onSuccess: () => { toast.success("Ödeme talebi onaylandı"); refetch(); setSelectedRequest(null); setNotes(""); },
    onError: (e: any) => toast.error("Hata: " + (e.message || "Onaylanamadı")),
  });
  const rejectMutation = trpc.admin.rejectPaymentRequest.useMutation({
    onSuccess: () => { toast.success("Ödeme talebi reddedildi"); refetch(); setSelectedRequest(null); setRejectionReason(""); },
    onError: (e: any) => toast.error("Hata: " + (e.message || "Reddedilemedi")),
  });

  const filtered = useMemo(() => (paymentRequests || []).filter((r: any) => filterStatus === "all" || r.status === filterStatus), [paymentRequests, filterStatus]);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const all = paymentRequests || [];
    return {
      total: all.length,
      pending: all.filter((r: any) => r.status === "pending").length,
      approved: all.filter((r: any) => r.status === "approved").length,
      paid: all.filter((r: any) => r.status === "paid").length,
      totalAmount: all.reduce((s: number, r: any) => s + (r.amount || 0), 0),
      pendingAmount: all.filter((r: any) => r.status === "pending").reduce((s: number, r: any) => s + (r.amount || 0), 0),
    };
  }, [paymentRequests]);

  const statCards = [
    { label: "Toplam Talep", value: stats.total, color: "text-gray-600", bg: "bg-gray-50", ring: "ring-gray-100", icon: CreditCard },
    { label: "Beklemede", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100", icon: Clock },
    { label: "Onaylandı", value: stats.approved, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100", icon: CheckCircle },
    { label: "Toplam Tutar", value: formatEUR(stats.totalAmount), color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-100", icon: Wallet, isText: true },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ödeme Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kurye ödeme taleplerini yönetin ve işleyin</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
          <RefreshCw className="h-3.5 w-3.5" />Yenile
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s: any) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3.5 flex items-center gap-3 ring-1 ${s.ring}`}>
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0"><s.icon className={`h-4 w-4 ${s.color}`} /></div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {stats.pending > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0"><Banknote className="h-5 w-5 text-amber-600" /></div>
          <div>
            <p className="font-semibold text-amber-900 text-sm">{stats.pending} ödeme talebi bekliyor ({formatEUR(stats.pendingAmount)})</p>
            <p className="text-xs text-amber-600 mt-0.5">Aşağıdan onaylayabilir veya reddedebilirsiniz</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center bg-gray-100 rounded-xl p-1 w-fit">
          {[{k: "all", l: "Tümü"}, {k: "pending", l: "Beklemede"}, {k: "approved", l: "Onaylandı"}, {k: "paid", l: "Ödendi"}, {k: "rejected", l: "Reddedildi"}].map(({k, l}) => (
            <button key={k} onClick={() => { setFilterStatus(k); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === k ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><CreditCard className="h-8 w-8 opacity-30" /></div>
            <p className="text-sm font-medium">Ödeme talebi bulunamadı</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Kurye","Tutar","Durum","Talep Tarihi","İşlem Tarihi",""].map((h, i) => (
                      <th key={i} className={`px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r: any) => (
                    <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">K{r.courierId}</div>
                          <span className="font-medium text-gray-900 text-sm">Kurye #{r.courierId}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><span className="font-bold text-gray-900 text-sm">{formatEUR(r.amount)}</span></td>
                      <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{new Date(r.requestedAt).toLocaleDateString("tr-TR")}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{r.processedAt ? new Date(r.processedAt).toLocaleDateString("tr-TR") : "—"}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {r.status === "pending" && (
                            <>
                              <button onClick={() => { setSelectedRequest(r); setNotes(""); setRejectionReason(""); }}
                                className="h-7 px-2.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors">
                                <CheckCircle className="h-3 w-3" />İşle
                              </button>
                            </>
                          )}
                          <button onClick={() => setSelectedRequest(r)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100">
                            <Eye className="h-3.5 w-3.5" />
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

      {/* Detail / Process Sheet */}
      <Sheet open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-gray-100">
            <SheetTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5 text-violet-600" />Ödeme Talebi</SheetTitle>
          </SheetHeader>
          {selectedRequest && (
            <div className="space-y-5 py-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-violet-500/20">
                  K{selectedRequest.courierId}
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">Kurye #{selectedRequest.courierId}</p>
                  <StatusBadge status={selectedRequest.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3.5 ring-1 ring-blue-100">
                  <p className="text-[11px] text-blue-600 uppercase tracking-wider font-semibold">Tutar</p>
                  <p className="text-xl font-bold text-blue-700 mt-1">{formatEUR(selectedRequest.amount)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5 ring-1 ring-gray-100">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Talep Tarihi</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{new Date(selectedRequest.requestedAt).toLocaleDateString("tr-TR")}</p>
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="bg-gray-50 rounded-xl p-3.5 ring-1 ring-gray-100">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Notlar</p>
                  <p className="text-sm text-gray-700">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.status === "pending" && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Not (İsteğe Bağlı)</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ödeme hakkında not ekleyin..." className="mt-2 rounded-xl" rows={2} />
                  </div>
                  <Button onClick={() => approveMutation.mutateAsync({ requestId: selectedRequest.id, notes: notes || undefined })}
                    disabled={approveMutation.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2">
                    {approveMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />İşleniyor...</> : <><CheckCircle className="h-4 w-4" />Onayla</>}
                  </Button>
                  <div className="bg-red-50 rounded-xl p-4 ring-1 ring-red-100 space-y-3">
                    <p className="text-sm font-semibold text-red-800">Reddet</p>
                    <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Red nedenini belirtin..." className="rounded-xl" rows={2} />
                    <Button variant="destructive" className="w-full rounded-xl gap-2" disabled={rejectMutation.isPending || !rejectionReason.trim()}
                      onClick={() => rejectMutation.mutateAsync({ requestId: selectedRequest.id, reason: rejectionReason })}>
                      {rejectMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />İşleniyor...</> : <><XCircle className="h-4 w-4" />Reddet</>}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
