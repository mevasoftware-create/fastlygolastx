import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, RefreshCw, Trash2, CheckCircle, XCircle, Building2,
  Phone, MapPin, Star,
  Eye, Ban, Clock, AlertCircle
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "suspended";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: "Beklemede",    color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200" },
  approved:  { label: "Onaylı",       color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200" },
  rejected:  { label: "Reddedildi",   color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200"   },
  suspended: { label: "Askıya Alındı",color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200"},
};

export default function Businesses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);

  const { data: businesses, refetch, isLoading } = trpc.admin.getAllBusinesses.useQuery();
  const deleteMutation = trpc.admin.deleteBusiness.useMutation();
  const approveMutation = trpc.admin.approveBusiness.useMutation();
  const rejectMutation = trpc.admin.rejectBusiness.useMutation();

  const utils = trpc.useUtils();

  const filtered = businesses?.filter((b: any) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || b.businessName?.toLowerCase().includes(q) ||
      b.contactPerson?.toLowerCase().includes(q) || b.address?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: businesses?.length ?? 0,
    pending: businesses?.filter((b: any) => b.status === "pending").length ?? 0,
    approved: businesses?.filter((b: any) => b.status === "approved").length ?? 0,
    rejected: businesses?.filter((b: any) => b.status === "rejected").length ?? 0,
    suspended: businesses?.filter((b: any) => b.status === "suspended").length ?? 0,
  };

  const handleApprove = async (businessId: number, businessName: string) => {
    try {
      await approveMutation.mutateAsync({ businessId });
      toast.success(`"${businessName}" onaylandı`);
      utils.admin.getAllBusinesses.invalidate();
    } catch {
      toast.error("Onaylama başarısız");
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    const business = businesses?.find((b: any) => b.id === rejectingId);
    try {
      await rejectMutation.mutateAsync({ businessId: rejectingId, reason: rejectReason });
      toast.success(`"${business?.businessName}" reddedildi`);
      utils.admin.getAllBusinesses.invalidate();
      setRejectingId(null);
      setRejectReason("");
    } catch {
      toast.error("Reddetme başarısız");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync({ businessId: deletingId });
      toast.success("İşletme silindi");
      utils.admin.getAllBusinesses.invalidate();
      setDeletingId(null);
    } catch {
      toast.error("Silme başarısız");
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const s = STATUS_LABELS[status] ?? { label: status, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.border} ${s.color}`}>
        {status === "pending" && <Clock className="h-3 w-3" />}
        {status === "approved" && <CheckCircle className="h-3 w-3" />}
        {status === "rejected" && <XCircle className="h-3 w-3" />}
        {status === "suspended" && <Ban className="h-3 w-3" />}
        {s.label}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">İşletmeler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platforma kayıtlı işletmeleri yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          {counts.pending > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              {counts.pending} onay bekliyor
            </span>
          )}
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">{counts.all} İşletme</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 h-8">
            <RefreshCw className="h-3.5 w-3.5" /> Yenile
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="İşletme adı veya adres ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                statusFilter === s
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s === "all" ? `Tümü (${counts.all})` :
               s === "pending" ? `Beklemede (${counts.pending})` :
               s === "approved" ? `Onaylı (${counts.approved})` :
               `Reddedildi (${counts.rejected})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">İşletme</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Adres</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Puan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Yükleniyor...</td></tr>
            ) : filtered?.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Kayıt bulunamadı</td></tr>
            ) : filtered?.map((b: any) => (
              <tr key={b.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                      {b.businessName?.charAt(0)?.toUpperCase() || "B"}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{b.businessName || "—"}</div>
                      {b.contactPerson && <div className="text-xs text-gray-500">{b.contactPerson}</div>}
                      {b.phone && (
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />{b.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  {b.address ? (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{b.address}</span>
                    </div>
                  ) : <span className="text-gray-300 text-sm">—</span>}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {b.rating ? (b.rating / 10).toFixed(1) : "5.0"}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={b.status || "pending"} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Pending: show approve + reject */}
                    {b.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(b.id, b.businessName)}
                          disabled={approveMutation.isPending}
                          className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Onayla
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setRejectingId(b.id); setRejectReason(""); }}
                          disabled={rejectMutation.isPending}
                          className="h-7 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 gap-1"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reddet
                        </Button>
                      </>
                    )}
                    {/* Approved: show reject option */}
                    {b.status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setRejectingId(b.id); setRejectReason(""); }}
                        className="h-7 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Askıya Al
                      </Button>
                    )}
                    {/* Rejected: show approve option */}
                    {b.status === "rejected" && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(b.id, b.businessName)}
                        className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Onayla
                      </Button>
                    )}
                    {/* Detail + Delete */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
                      onClick={() => setSelectedBusiness(b)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                      onClick={() => setDeletingId(b.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İşletmeyi Reddet</DialogTitle>
            <DialogDescription>
              Bu işletmenin başvurusunu reddetmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Red Nedeni (isteğe bağlı)</Label>
            <Textarea
              placeholder="Red nedenini belirtin..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>İptal</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Reddediliyor..." : "Reddet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İşletmeyi Sil</DialogTitle>
            <DialogDescription>Bu işlem geri alınamaz. İşletmeyi silmek istediğinizden emin misiniz?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>İptal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedBusiness} onOpenChange={(open) => !open && setSelectedBusiness(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              {selectedBusiness?.businessName}
            </DialogTitle>
          </DialogHeader>
          {selectedBusiness && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">İletişim Kişisi</div>
                  <div className="font-medium">{selectedBusiness.contactPerson || "—"}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Telefon</div>
                  <div className="font-medium">{selectedBusiness.phone || "—"}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Vergi No</div>
                  <div className="font-medium">{selectedBusiness.taxNumber || "—"}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Durum</div>
                  <StatusBadge status={selectedBusiness.status || "pending"} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Adres</div>
                <div className="font-medium">{selectedBusiness.address || "—"}</div>
              </div>
              {selectedBusiness.description && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Açıklama</div>
                  <div className="font-medium">{selectedBusiness.description}</div>
                </div>
              )}
              {selectedBusiness.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 gap-1.5"
                    onClick={() => { handleApprove(selectedBusiness.id, selectedBusiness.businessName); setSelectedBusiness(null); }}
                  >
                    <CheckCircle className="h-4 w-4" /> Onayla
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                    onClick={() => { setRejectingId(selectedBusiness.id); setSelectedBusiness(null); }}
                  >
                    <XCircle className="h-4 w-4" /> Reddet
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
