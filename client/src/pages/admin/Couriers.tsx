import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Edit, Trash2, Bike, RefreshCw, Filter, Star, Mail, MapPin, CheckCircle2, XCircle, Clock } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: "Beklemede",  color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  approved: { label: "Onaylı",     color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  rejected: { label: "Reddedildi", color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  online:   { label: "Çevrimiçi",  color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  offline:  { label: "Çevrimdışı", color: "text-gray-600",   bg: "bg-gray-50 border-gray-200" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "text-gray-700", bg: "bg-gray-50 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
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
  const [editApprovalStatus, setEditApprovalStatus] = useState<"pending" | "approved" | "rejected">("pending");

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

  const filtered = couriers?.filter((c: any) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || c.userName?.toLowerCase().includes(q) || c.userEmail?.toLowerCase().includes(q) || c.vehicleType?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchDemo = filterDemo === "all" || (filterDemo === "demo" ? c.isDemo : !c.isDemo);
    return matchSearch && matchStatus && matchDemo;
  });

  const stats = [
    { label: "Toplam", value: couriers?.length || 0, color: "text-gray-900" },
    { label: "Onaylı", value: couriers?.filter((c: any) => c.status === "approved").length || 0, color: "text-green-600" },
    { label: "Beklemede", value: couriers?.filter((c: any) => c.status === "pending").length || 0, color: "text-amber-600" },
    { label: "Çevrimiçi", value: couriers?.filter((c: any) => c.isOnline).length || 0, color: "text-blue-600" },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kuryeler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kurye hesaplarını ve onay durumlarını yönetin</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />Yenile
        </Button>
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
          <Input placeholder="İsim, telefon veya araç ara..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} className="pl-9 h-9 text-sm border-gray-200" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-9 text-sm border-gray-200"><SelectValue placeholder="Onay Durumu" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="pending">Beklemede</SelectItem>
            <SelectItem value="approved">Onaylı</SelectItem>
            <SelectItem value="rejected">Reddedildi</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDemo} onValueChange={setFilterDemo}>
          <SelectTrigger className="w-36 h-9 text-sm border-gray-200"><SelectValue placeholder="Tip" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="real">Gerçek</SelectItem>
            <SelectItem value="demo">Demo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Yükleniyor...</div>
        ) : !filtered?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Bike className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Kurye bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Kurye","Araç","Konum","Puan","Onay","Durum",""].map((h, i) => (
                    <th key={i} className={`px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.userName?.charAt(0)?.toUpperCase() || "K"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{c.userName || c.userEmail?.split('@')[0] || "—"}</div>
                          {c.userEmail && <div className="text-xs text-gray-400 flex items-center gap-1"><Mail className="h-3 w-3" />{c.userEmail}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 capitalize">{c.vehicleType || "—"}</span>
                      {c.isDemo && <span className="ml-1.5 text-xs bg-purple-50 text-purple-600 border border-purple-200 px-1.5 py-0.5 rounded-full">Demo</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {c.currentLat && c.currentLng ? (
                        <span className="flex items-center gap-1 text-green-600"><MapPin className="h-3 w-3" />Aktif</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {c.rating ? (
                        <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{Number(c.rating).toFixed(1)}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${c.isOnline ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                        {c.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.status === "pending" && (
                          <>
                            <Button size="sm" variant="ghost"
                              className="h-7 px-2 text-xs text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg gap-1"
                              disabled={approveMutation.isPending}
                              onClick={() => approveMutation.mutate({ courierId: c.id })}>
                              <CheckCircle2 className="h-3.5 w-3.5" />Onayla
                            </Button>
                            <Button size="sm" variant="ghost"
                              className="h-7 px-2 text-xs text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg gap-1"
                              disabled={rejectMutation.isPending}
                              onClick={() => rejectMutation.mutate({ courierId: c.id })}>
                              <XCircle className="h-3.5 w-3.5" />Reddet
                            </Button>
                          </>
                        )}
                        {c.status === "approved" && (
                          <Button size="sm" variant="ghost"
                            className="h-7 px-2 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg gap-1"
                            disabled={rejectMutation.isPending}
                            onClick={() => rejectMutation.mutate({ courierId: c.id })}>
                            <XCircle className="h-3.5 w-3.5" />Askıya Al
                          </Button>
                        )}
                        {c.status === "rejected" && (
                          <Button size="sm" variant="ghost"
                            className="h-7 px-2 text-xs text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg gap-1"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate({ courierId: c.id })}>
                            <CheckCircle2 className="h-3.5 w-3.5" />Onayla
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                          onClick={() => { setEditingCourier(c); setEditApprovalStatus(c.status); }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                          onClick={() => setDeletingId(c.id)}>
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
      </div>

      <Dialog open={!!editingCourier} onOpenChange={() => setEditingCourier(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCourier?.userName || `Kurye #${editingCourier?.id}`}</DialogTitle>
            <DialogDescription>Kurye onay durumunu güncelleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Onay Durumu</label>
              <Select value={editApprovalStatus} onValueChange={(v) => setEditApprovalStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="approved">Onayla</SelectItem>
                  <SelectItem value="rejected">Reddet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-sm">
              <div className="flex gap-2"><span className="text-gray-500 w-24">E-posta:</span><span>{editingCourier?.userEmail || "—"}</span></div>
              <div className="flex gap-2"><span className="text-gray-500 w-24">Araç:</span><span className="capitalize">{editingCourier?.vehicleType || "—"}</span></div>
              <div className="flex gap-2"><span className="text-gray-500 w-24">Puan:</span><span>{editingCourier?.rating ? Number(editingCourier.rating).toFixed(1) : "—"}</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCourier(null)}>İptal</Button>
            <Button onClick={() => updateMutation.mutate({ courierId: editingCourier.id, status: editApprovalStatus })}
              disabled={updateMutation.isPending} className="bg-orange-500 hover:bg-orange-600">
              {updateMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kuryeyi Sil</AlertDialogTitle>
            <AlertDialogDescription>Bu kurye kalıcı olarak silinecek.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate({ courierId: deletingId })} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CouriersPage;
